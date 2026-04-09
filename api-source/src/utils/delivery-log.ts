import type { Request } from "express";
import { db } from "../config/db.js";

const isIPv4 = (ip: string): boolean => /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);

/**
 * Extracts the client's IPv4 address from a request.
 * Prefers x-forwarded-for (set by proxies), then x-real-ip (set by nginx),
 * then falls back to request.ip. Always strips the ::ffff: prefix used for
 * IPv4-mapped IPv6 addresses and, when multiple IPs are present in
 * x-forwarded-for, picks the first IPv4 address found.
 */
export const getClientIp = (request: Request): string => {
    const forwarded = request.headers["x-forwarded-for"] as string | undefined;
    if (forwarded) {
        const ips = forwarded.split(",").map((ip) => ip.trim().replace(/^::ffff:/, ""));
        const ipv4 = ips.find(isIPv4);
        if (ipv4) return ipv4;
        if (ips[0]) return ips[0];
    }

    const realIp = request.headers["x-real-ip"] as string | undefined;
    if (realIp) {
        const cleaned = realIp.trim().replace(/^::ffff:/, "");
        if (cleaned) return cleaned;
    }

    return (request.ip ?? "").replace(/^::ffff:/, "");
};

export const logDeliveryEvent = async (params: {
    request?: Request;
    userUuid: string;
    userEmail: string;
    eventType: "payment_success" | "download";
    orderId?: string;
    invoiceId?: string;
    transactionId?: string;
    items?: Array<{ slug: string; title: string; quantity: number }>;
    ipAddress?: string;
    userAgent?: string;
}): Promise<void> => {
    try {
        const ip = params.ipAddress ?? (params.request ? getClientIp(params.request) : null);
        const ua = params.userAgent ?? (params.request ? (params.request.headers["user-agent"] ?? null) : null);

        await db.execute(
            `INSERT INTO delivery_logs
                (user_uuid, user_email, event_type, order_id, invoice_id, transaction_id, ip_address, user_agent, status, items_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'delivered', CAST(? AS JSON))`,
            [
                params.userUuid,
                params.userEmail,
                params.eventType,
                params.orderId ?? null,
                params.invoiceId ?? null,
                params.transactionId ?? null,
                ip ?? null,
                ua ?? null,
                JSON.stringify(params.items ?? []),
            ]
        );
    } catch (err) {
        // Non-fatal: log error but do not interrupt the main flow
        console.error("[delivery-log] Failed to insert delivery log:", err);
    }
};
