
import { createHash } from "node:crypto";
import type { ResultSetHeader } from "mysql2";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { db } from "../config/db.js";
import { buildLoginAlertEmail } from "./email-templates/login-alert.template.js";
import { buildPasswordResetEmail } from "./email-templates/password-reset.template.js";
import { buildSignupVerificationEmail } from "./email-templates/signup-verification.template.js";
import { renderEmailLayout, escapeHtml } from "././email-templates/shared.js";


const hasMailConfig = Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

const transporter = hasMailConfig
  ? nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
    tls: {
      servername: env.smtpTlsServername || undefined,
      rejectUnauthorized: env.smtpTlsRejectUnauthorized,
    },
  })
  : null;

const fromAddress = env.mailFrom || env.smtpUser || "no-reply@example.com";
const EMAIL_SENT_FINALIZE_MINUTES = 5; // After how many minutes a "sending" email log should be finalized to "sent"
const EMAIL_STATUS_FINALIZER_INTERVAL_MS = 60_000;
let emailStatusFinalizerTimer: NodeJS.Timeout | null = null;

const sendMail = async (params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  emailType: string;
  attachments?: Array<{
    filename: string;
    path: string;
    contentType?: string;
  }>;
}) => {
  const logId = await createEmailLogEntry(params.to, params.subject, params.emailType);

  if (!transporter) {
    console.warn("SMTP not configured. Skipping email send.", {
      to: params.to,
      subject: params.subject,
    });
    await updateEmailLogEntry(logId, "skipped", null);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      attachments: params.attachments,
      headers: logId ? { "X-Log-Id": String(logId) } : {},
    });

    const rejected = Array.isArray((info as { rejected?: unknown }).rejected)
      ? ((info as { rejected: unknown[] }).rejected as string[])
      : [];

    if (rejected.length > 0) {
      const rejectedList = rejected.join(", ");
      await updateEmailLogEntry(logId, "failed", `SMTP rejected recipient(s): ${rejectedList}`);
      throw new Error(`SMTP rejected recipient(s): ${rejectedList}`);
    }

    // SMTP accepted the mail. Keep it in "sending" for 20 minutes so
    // bounce-tracker can still flip it to failed if a delayed DSN arrives.
    await updateEmailLogEntry(logId, "sending", null);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await updateEmailLogEntry(logId, "failed", errMsg);
    throw err;
  }
};

const createEmailLogEntry = async (
  recipient: string,
  subject: string,
  emailType: string,
): Promise<number | null> => {
  try {
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO email_logs (recipient, subject, email_type, status, error_msg)
       VALUES (?, ?, ?, ?, ?)`,
      [recipient, subject, emailType, "sending", "Accepted by SMTP. Waiting for bounce window."]
    );

    return result.insertId;
  } catch (logErr) {
    // Non-fatal: email_logs table may not exist yet (run migration script first)
    console.error("[email-log] Failed to create email log entry:", logErr);
    return null;
  }
};

const updateEmailLogEntry = async (
  logId: number | null,
  status: "sending" | "sent" | "failed" | "skipped",
  errorMsg: string | null
): Promise<void> => {
  if (!logId) {
    return;
  }

  try {
    await db.execute(
      `UPDATE email_logs
       SET status = ?, error_msg = ?
       WHERE id = ?`,
      [status, errorMsg, logId]
    );
  } catch (logErr) {
    // Non-fatal: avoid interrupting main flow if log update fails
    console.error("[email-log] Failed to update email log entry:", logErr);
  }
};

const finalizePendingEmailLogs = async (): Promise<void> => {
  try {
    const [result] = await db.execute(
      `UPDATE email_logs
       SET status = 'sent', error_msg = NULL
       WHERE status = 'sending'
         AND created_at <= (NOW() - INTERVAL ? MINUTE)`,
      [EMAIL_SENT_FINALIZE_MINUTES]
    );

    const affectedRows = (result as { affectedRows?: number }).affectedRows ?? 0;
    if (affectedRows > 0) {
      console.log(`[email-log] Finalized ${affectedRows} email log(s) from sending to sent`);
    }
  } catch (error) {
    console.error("[email-log] Failed to finalize pending email logs:", error);
  }
};

export const startEmailLogStatusFinalizer = () => {
  if (emailStatusFinalizerTimer) {
    return;
  }

  void finalizePendingEmailLogs();

  emailStatusFinalizerTimer = setInterval(() => {
    void finalizePendingEmailLogs();
  }, EMAIL_STATUS_FINALIZER_INTERVAL_MS);
};

export const hashOtpCode = (value: string) => createHash("sha256").update(value).digest("hex");

export const sendSignupVerificationEmail = async (to: string, name: string, verificationLink: string) => {
  const { subject, text, html } = buildSignupVerificationEmail({ name, verificationLink });

  await sendMail({ to, subject, text, html, emailType: "signup_verification" });
};

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  const { subject, text, html } = buildPasswordResetEmail({ resetLink });

  await sendMail({ to, subject, text, html, emailType: "password_reset" });
};

export const sendLoginAlertEmail = async (params: {
  to: string;
  name: string;
  deviceInfo: string;
  browserInfo: string;
  ipAddress: string;
  loginDateTime: string;
  secureAccountLink?: string;
}) => {
  const { subject, text, html } = buildLoginAlertEmail({
    name: params.name,
    deviceInfo: params.deviceInfo,
    browserInfo: params.browserInfo,
    ipAddress: params.ipAddress,
    loginDateTime: params.loginDateTime,
    secureAccountLink: params.secureAccountLink ?? `${env.clientOrigin}/auth`,
  });

  await sendMail({ to: params.to, subject, text, html, emailType: "login_alert" });
};


export const sendPaymentSuccessEmail = async (params: {
  to: string;
  name: string;
  orderId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentTime: string;
  pdfPath: string;
}) => {
  const subject = `Payment Successful - Invoice #${params.invoiceId}`;
  const html = renderEmailLayout({
    title: "Payment Successful",
    preheader: `Thank you, ${params.name}! Your payment was successful.`,
    intro: `We are pleased to inform you that your payment for Order ID ${params.orderId} has been successfully processed. Below are the details of your transaction:`,
    bodyHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:0 0 12px 0;">
            <div style="height:1px;background-color:#eee;line-height:1px;font-size:1px;">&nbsp;</div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 18px 0;">
            <p style="margin:0;color:#333;font-size:15px;line-height:1.6;font-family:'Inter',sans-serif;">Order ID: <strong>${params.orderId}</strong></p>
            <p style="margin:0;color:#333;font-size:15px;line-height:1.6;font-family:'Inter',sans-serif;">Invoice ID: <strong>${params.invoiceId}</strong></p>
            <p style="margin:0;color:#333;font-size:15px;line-height:1.6;font-family:'Inter',sans-serif;">Amount Paid: <strong>₹${params.amount}</strong></p>
            <p style="margin:0;color:#333;font-size:15px;line-height:1.6;font-family:'Inter',sans-serif;">Payment Method: <strong>${params.paymentMethod}</strong></p>
            <p style="margin:0;color:#333;font-size:15px;line-height:1.6;font-family:'Inter',sans-serif;">Payment Time: <strong>${params.paymentTime}</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 0 0 0;">
            <p style="margin:0;color:#333;font-size:15px;line-height:1.6;font-family:'Inter',sans-serif;">Your invoice PDF is attached with this email.</p>
          </td>
        </tr>
      </table>
    `,
  });

  const text = `Thank you, ${params.name}! Your payment was successful.\n\nOrder ID: ${params.orderId}\nInvoice ID: ${params.invoiceId}\nAmount Paid: ₹${params.amount}\nPayment Method: ${params.paymentMethod}\nPayment Time: ${params.paymentTime}\n\nYour invoice PDF is attached with this email.`;

  await sendMail({
    to: params.to,
    subject,
    html,
    text,
    emailType: "payment_success",
    attachments: [
      {
        filename: `Invoice-${params.invoiceId}.pdf`,
        path: params.pdfPath,
        contentType: "application/pdf",
      },
    ],
  });
};
