import type { Request, Response } from "express";
import { db } from "../config/db.js";
import { getBearerToken, verifyAccessToken, isAccessTokenActive } from "./payment.controller.js";
import path from "path";
import fs from "fs";

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
                // Try Cashfree / normalized Razorpay format first
                invoiceNo = data?.data?.order?.order_tags?.INVOICE || "";
                // Fallback: check raw Razorpay webhook payload format (notes.invoice_id)
                if (!invoiceNo) {
                    invoiceNo = data?.payload?.payment?.entity?.notes?.invoice_id || "";
                }
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

export const downloadBillPdf = async (request: Request, response: Response) => {
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
        const invoiceId = request.params.invoiceId;
        // Find bill for this user and invoiceId (match only by invoiceNo)
        const [rows] = await db.query(
            `SELECT orderid, data, uid FROM bills WHERE uid = ? AND status = 'success'`,
            [tokenPayload.sub]
        );
        let matchedBill = null;
        for (const row of rows as any[]) {
            let data = row.data;
            try {
                data = typeof data === "string" ? JSON.parse(data) : data;
            } catch { }
            const inv = data?.data?.order?.order_tags?.INVOICE
                || data?.payload?.payment?.entity?.notes?.invoice_id;
            if (inv === invoiceId) {
                matchedBill = { ...row, invoiceNo: inv };
                break;
            }
        }
        if (!matchedBill) {
            response.status(404).json({ message: "Invoice not found." });
            return;
        }
        // PDF path (use correct uid from bill row)
        const userId = matchedBill.uid;
        const pdfPath = path.resolve("public/bills", userId, `${invoiceId}.pdf`);
        if (!fs.existsSync(pdfPath)) {
            response.status(404).json({ message: "PDF not found." });
            return;
        }
        response.setHeader("Content-Type", "application/pdf");
        response.setHeader("Content-Disposition", `attachment; filename=\"${invoiceId}.pdf\"`);
        const stream = fs.createReadStream(pdfPath);
        stream.pipe(response);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Unable to download invoice." });
    }
};
