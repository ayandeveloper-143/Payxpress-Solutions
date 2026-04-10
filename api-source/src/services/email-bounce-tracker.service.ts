import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { db } from "../config/db.js";
import { env } from "../config/env.js";

const BOUNCE_SUBJECT_RE = /undelivered|delivery[\s-]*status|mail delivery|failure notice|returned to sender/i;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const extractFailedRecipients = (subject: string, text: string): string[] => {
    const recipients = new Set<string>();

    for (const match of text.matchAll(/Final-Recipient:\s*rfc822;\s*([^\s]+)/gi)) {
        recipients.add(normalizeEmail(match[1]));
    }

    for (const match of text.matchAll(/Original-Recipient:\s*rfc822;\s*([^\s]+)/gi)) {
        recipients.add(normalizeEmail(match[1]));
    }

    if (recipients.size === 0 && BOUNCE_SUBJECT_RE.test(subject)) {
        const allEmails = text.match(EMAIL_RE) ?? [];
        for (const email of allEmails) {
            recipients.add(normalizeEmail(email));
        }
    }

    return [...recipients].filter((email) => email !== normalizeEmail(env.bounceImapUser));
};

const markLogAsBouncedById = async (logId: number, reason: string): Promise<boolean> => {
    const [result] = await db.execute(
        `UPDATE email_logs
         SET status = 'failed', error_msg = ?
         WHERE id = ?
           AND status = 'sending'`,
        [reason, logId]
    );

    const affectedRows = (result as { affectedRows?: number }).affectedRows ?? 0;
    if (affectedRows > 0) {
        console.log(`[bounce-tracker] Marked log #${logId} as failed via X-Log-Id`);
    }
    return affectedRows > 0;
};

const markLogAsBounced = async (recipient: string, reason: string): Promise<void> => {
    const [result] = await db.execute(
        `UPDATE email_logs
         SET status = 'failed', error_msg = ?
         WHERE recipient = ?
                     AND status = 'sending'
         ORDER BY id DESC
         LIMIT 1`,
        [reason, recipient]
    );

    const affectedRows = (result as { affectedRows?: number }).affectedRows ?? 0;
    if (affectedRows > 0) {
        console.log(`[bounce-tracker] Marked recipient as failed (fallback): ${recipient}`);
    }
};

// Process a single message UID — fetch source, parse, mark seen, update DB
const processMessage = async (client: ImapFlow, uid: number): Promise<void> => {
    console.log(`[bounce-tracker] Processing uid ${uid}`);

    let rawSource: Buffer | null = null;
    let envelopeSubject = "";

    for await (const message of client.fetch(
        [uid],
        {
            envelope: true,
            source: true,
            uid: true,
        },
        { uid: true }
    )) {
        if (message.source) {
            rawSource = message.source;
        }
        envelopeSubject = message.envelope?.subject ?? "";
    }

    if (!rawSource) {
        return;
    }

    const parsed = await simpleParser(rawSource);
    const subject = parsed.subject ?? envelopeSubject;
    const bodyText =
        typeof parsed.text === "string"
            ? parsed.text
            : typeof parsed.html === "string"
                ? parsed.html
                : rawSource.toString("utf8");

    if (
        !BOUNCE_SUBJECT_RE.test(subject) &&
        !/Final-Recipient:|Original-Recipient:|Action:\s*failed|Diagnostic-Code:/i.test(bodyText)
    ) {
        console.log(`[bounce-tracker] Skipped non-bounce uid ${uid} | subject="${subject}"`);
        return;
    }

    const failedRecipients = extractFailedRecipients(subject, bodyText);
    const reason = `Bounce detected via mailbox (${subject || "No Subject"})`;

    // X-Log-Id is embedded in the original message that Postfix
    // attaches to the bounce DSN. Strip \r for CRLF safety.
    const rawStr = rawSource.toString("utf8").replace(/\r/g, "");
    const logIdMatch = rawStr.match(/(?:^|\n)X-Log-ID\s*:\s*(\d+)/i);
    const embeddedLogId = logIdMatch ? parseInt(logIdMatch[1], 10) : null;

    console.log(
        `[bounce-tracker] Bounce | subject="${subject}" | recipients=${JSON.stringify(failedRecipients)} | X-Log-Id=${embeddedLogId ?? "not found"}`
    );

    if (embeddedLogId) {
        const updated = await markLogAsBouncedById(embeddedLogId, reason);
        if (!updated) {
            console.log(`[bounce-tracker] ID #${embeddedLogId} not in sent state, trying recipient fallback`);
            for (const recipient of failedRecipients) {
                await markLogAsBounced(recipient, reason);
            }
        }
    } else {
        for (const recipient of failedRecipients) {
            await markLogAsBounced(recipient, reason);
        }
    }

    // Mark as seen only after processing succeeds; this allows automatic retry
    // on next reconnect if any transient error occurs while parsing/updating.
    if (env.bounceMarkSeen) {
        await client.messageFlagsAdd([uid], ["\\Seen"], { uid: true }).catch((err) => {
            console.error(`[bounce-tracker] Failed to mark uid ${uid} as seen:`, err);
        });
    }
};

const buildClient = (): ImapFlow => {
    const tlsOptions: Record<string, unknown> = {
        rejectUnauthorized: env.bounceImapTlsRejectUnauthorized,
    };
    if (env.bounceImapTlsServername) {
        tlsOptions.servername = env.bounceImapTlsServername;
    }

    return new ImapFlow({
        host: env.bounceImapHost,
        port: env.bounceImapPort,
        secure: env.bounceImapSecure,
        auth: {
            user: env.bounceImapUser,
            pass: env.bounceImapPass,
        },
        tls: tlsOptions,
        logger: false,
        connectionTimeout: 20000,
    });
};

// Drain all unseen messages that arrived before the IDLE session started
const drainUnseen = async (client: ImapFlow): Promise<void> => {
    const allResult = await client.search({}, { uid: true });
    const all = Array.isArray(allResult) ? allResult : [];

    const searchResult = await client.search({ seen: false }, { uid: true });
    const uids = Array.isArray(searchResult) ? searchResult : [];
    console.log(`[bounce-tracker] Mailbox stats | all=${all.length} unseen=${uids.length}`);
    console.log(`[bounce-tracker] Draining ${uids.length} unseen message(s)`);
    for (const uid of uids) {
        await processMessage(client, uid).catch((err) => {
            console.error(`[bounce-tracker] Error draining uid ${uid}:`, err);
        });
    }
};

// Start IDLE loop with automatic reconnect
const runIdleLoop = async (): Promise<void> => {
    while (true) {
        const client = buildClient();
        let isProcessingUnseen = false;
        let lastUnseenPassAt = 0;

        const runUnseenPass = async (reason: string) => {
            if (!client.usable) {
                return;
            }

            if (isProcessingUnseen) {
                return;
            }

            const now = Date.now();
            if (now - lastUnseenPassAt < 3000) {
                return;
            }

            isProcessingUnseen = true;
            lastUnseenPassAt = now;
            try {
                console.log(`[bounce-tracker] Running unseen pass (${reason})`);
                await drainUnseen(client);
            } catch (error) {
                console.error(`[bounce-tracker] Unseen pass failed (${reason}):`, error);
            } finally {
                isProcessingUnseen = false;
            }
        };

        try {
            await client.connect();
            console.log(`[bounce-tracker] Connected user: ${env.bounceImapUser}`);

            const mailboxes = await client.list().catch(() => []);
            if (Array.isArray(mailboxes)) {
                console.log(
                    `[bounce-tracker] Mailboxes: ${mailboxes.map((mailbox) => mailbox.path).join(", ")}`
                );
            }

            await client.mailboxOpen(env.bounceImapMailbox, { readOnly: false });
            console.log(`[bounce-tracker] Connected. Listening for new messages on ${env.bounceImapMailbox} via IDLE`);

            client.on("exists", (data) => {
                // Avoid event storms when count does not increase.
                if (data.count <= data.prevCount) {
                    return;
                }
                void runUnseenPass("exists-event");
            });

            // Process any messages that arrived before we connected
            await runUnseenPass("startup");

            // Keep a live IDLE heartbeat. If IDLE breaks, reconnect.
            while (true) {
                try {
                    await Promise.race([
                        client.idle(),
                        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 30_000)),
                    ]);
                    await runUnseenPass("idle-wakeup");
                } catch (idleError) {
                    console.error("[bounce-tracker] IDLE iteration failed:", idleError);
                    break;
                }

                if (!client.usable) {
                    break;
                }
            }

        } catch (error) {
            console.error("[bounce-tracker] Connection error:", error);
        } finally {
            await client.logout().catch(() => {
                // ignore logout errors
            });
        }

        // Wait 10s before reconnecting to avoid hammering on persistent failures
        console.log("[bounce-tracker] Reconnecting in 10s...");
        await new Promise<void>((resolve) => setTimeout(resolve, 10_000));
    }
};

export const startBounceTrackingLoop = () => {
    if (!env.bounceTrackingEnabled) {
        return;
    }

    if (!env.bounceImapHost || !env.bounceImapUser || !env.bounceImapPass) {
        console.warn("[bounce-tracker] Missing IMAP credentials. Bounce tracking disabled.");
        return;
    }

    console.log(`[bounce-tracker] Starting IDLE listener on ${env.bounceImapMailbox}`);

    // Run in background — never awaited so server startup is not blocked
    runIdleLoop().catch((error) => {
        console.error("[bounce-tracker] Fatal loop error:", error);
    });
};
