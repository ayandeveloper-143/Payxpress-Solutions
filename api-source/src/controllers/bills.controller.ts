import type { Request, Response } from "express";
import { db } from "../config/db.js";
import { getBearerToken, verifyAccessToken, isAccessTokenActive } from "./payment.controller.js";

// Only extract the fields needed for UI: Amount, Date, Invoice No, Status (Paid)
export const getBillsHistory = async (request: Request, response: Response) => {
    try {
        const token = getBearerToken(request);
        if (!token) {
            response.status(401).json({ message: "Missing access token." });
            return;
        }
        const tokenPayload = verifyAccessToken(token);
        if (!tokenPayload) {
            response.status(401).json({ message: "Invalid or expired access token." });
            return;
        }
        const activeToken = await isAccessTokenActive({ token, userUuid: tokenPayload.sub });
        if (!activeToken) {
            response.status(401).json({ message: "Session expired or logged out." });
            return;
        }
        // Only fetch bills for this user, status = 'success', sorted by created_at desc
        const [rows] = await db.query(
            `SELECT orderid, data, status, created_at, total
             FROM bills
             WHERE uid = ? AND status = 'success'
             ORDER BY created_at DESC`,
            [tokenPayload.sub]
        );
        // Extract only required fields for UI
        const bills = (rows as any[]).map((row) => {
            let invoiceNo = "";
            let amount = row.total;
            let date = row.created_at;
            try {
                const data = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
                // Try to extract invoice from data.data.order.order_tags.INVOICE
                invoiceNo = data?.data?.order?.order_tags?.INVOICE || "";
            } catch { }
            return {
                invoiceNo,
                amount,
                date,
                status: "Paid", // Always Paid for success
                orderId: row.orderid,
            };
        });
        response.json({ bills });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Unable to fetch bills history." });
    }
};
