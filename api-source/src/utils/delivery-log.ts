import type { Request } from "express";
import { db } from "../config/db.js";

const getClientIp = (request: Request): string =>
    ((request.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
        request.ip ??
        "").replace(/^::ffff:/, "");

export const logDeliveryEvent = async (params: {
    request?: Request;
    userUuid: string;
    userEmail: string;
    eventType: "payment_success" | "download";
    productSlug?: string;
    orderId?: string;
    invoiceId?: string;
    items?: Array<{ slug: string; title: string; quantity: number }>;
    ipAddress?: string;
    userAgent?: string;
}): Promise<void> => {
    try {
        const ip = params.ipAddress ?? (params.request ? getClientIp(params.request) : null);
        const ua = params.userAgent ?? (params.request ? (params.request.headers["user-agent"] ?? null) : null);

        await db.execute(
            `INSERT INTO delivery_logs
                (user_uuid, user_email, event_type, product_slug, order_id, invoice_id, ip_address, user_agent, status, items_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'delivered', CAST(? AS JSON))`,
            [
                params.userUuid,
                params.userEmail,
                params.eventType,
                params.productSlug ?? null,
                params.orderId ?? null,
                params.invoiceId ?? null,
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
