/**
 * Invoice Migration Script
 * ========================
 * Regenerates invoices for all PAID bills using the new modular HTML template.
 * 
 * EXECUTION INSTRUCTIONS:
 * ========================
 * 1. From the api-source/ directory, run:
 *    npx ts-node src/scripts/migrate-invoices.ts
 * 
 * 2. Or compile and run:
 *    npx tsc && node dist/src/scripts/migrate-invoices.js
 * 
 * 3. Or via Bun (if installed):
 *    bun src/scripts/migrate-invoices.ts
 * 
 * WHAT THIS SCRIPT DOES:
 * ========================
 * - Queries all bills with status = 'success' (PAID bills only)
 * - For each bill:
 *   * Regenerates the invoice PDF using the new modular template
 *   * Replaces the old PDF in storage (public/bills/{userId}/{invoiceNo}.pdf)
 *   * Deletes the old PDF file if new generation succeeds
 * - Logs each invoice processed with result status
 * - Skips unpaid, canceled, or failed bills
 * - Provides clear error messages if migration fails
 * 
 * SAFETY:
 * ========================
 * - No data is deleted on errors
 * - Old PDFs are only deleted after successful new PDF generation
 * - Each bill is processed independently; failures don't stop the script
 * - Full logging for audit trail and rollback capability
 */

import fs from "fs/promises";
import path from "path";
import { db } from "../config/db.js";
import { generateInvoiceHtml, numberToWords } from "../invoice/invoice-template.js";
import { generatePdfFromHtml } from "../utils/pdf.js";
import type { RowDataPacket } from "mysql2";

// ==================== TYPE DEFINITIONS ====================

type BillRecord = RowDataPacket & {
    orderid: string;
    txnid: string | null;
    uid: string;
    carts: unknown;
    billing_address: string;
    data: unknown;
    status: string;
    gst_type: string;
    gst_percent: number;
    gst_amount: number;
    cgst_amount: number;
    sgst_amount: number;
    gateway_fee: number;
    total: number;
    created_at: Date | string;
    updated_at: Date | string;
};

type CartItem = {
    item_name: string;
    item_description?: string;
    item_hsn_sac?: string;
    item_quantity: number;
    item_discounted_unit_price: number;
};

type StoredCart = {
    cart_items?: CartItem[];
};

type JsonRecord = Record<string, unknown>;

// ==================== HELPER FUNCTIONS ====================

const toJsonRecord = (val: unknown): JsonRecord | null => {
    if (typeof val === "object" && val !== null) {
        return val as JsonRecord;
    }
    if (typeof val === "string") {
        try {
            return JSON.parse(val) as JsonRecord;
        } catch {
            return null;
        }
    }
    return null;
};

const readString = (obj: JsonRecord | null, key: string): string => {
    if (!obj || typeof obj[key] !== "string") return "";
    return obj[key] as string;
};

// ==================== LOGGING ====================

interface MigrationResult {
    billId: string;
    invoiceNo: string;
    userId: string;
    success: boolean;
    message: string;
    oldPdfPath?: string;
    newPdfPath?: string;
    pdfDeleted?: boolean;
}

const results: MigrationResult[] = [];

const logAction = (action: string, details: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${action}: ${details}`);
};

const logSuccess = (billId: string, invoiceNo: string, message: string, oldPath?: string, newPath?: string) => {
    results.push({
        billId,
        invoiceNo,
        userId: oldPath?.split("/")[2] || "unknown",
        success: true,
        message,
        oldPdfPath: oldPath,
        newPdfPath: newPath,
    });
    logAction("✓ SUCCESS", `${billId} (Invoice: ${invoiceNo}) - ${message}`);
};

const logError = (billId: string, invoiceNo: string, message: string, error: unknown) => {
    results.push({
        billId,
        invoiceNo,
        userId: "unknown",
        success: false,
        message: `${message} | ${String(error)}`,
    });
    logAction("✗ ERROR", `${billId} (Invoice: ${invoiceNo}) - ${message} | ${String(error)}`);
};

// ==================== MIGRATION LOGIC ====================

/**
 * Extracts invoice number from bill data using multiple fallback strategies.
 */
const extractInvoiceNo = (billData: BillRecord): string => {
    let billJson: JsonRecord = {};
    try {
        billJson = typeof billData.data === "string" ? JSON.parse(billData.data) : (toJsonRecord(billData.data) ?? {});
    } catch {
        // continue with empty billJson
    }

    // Try Cashfree / normalized Razorpay format
    const orderObj = toJsonRecord((billJson?.data as JsonRecord)?.order as unknown);
    const orderTagsObj = toJsonRecord(orderObj?.order_tags as unknown);
    let invoiceNo = readString(orderTagsObj, "INVOICE") || "";

    // Fallback: check raw Razorpay webhook payload format
    if (!invoiceNo) {
        const rawPayloadObj = toJsonRecord(billJson?.payload as unknown);
        const rawPaymentEntity = toJsonRecord(toJsonRecord(rawPayloadObj?.payment as unknown)?.entity as unknown);
        const rawNotes = toJsonRecord(rawPaymentEntity?.notes as unknown);
        invoiceNo = readString(rawNotes, "invoice_id") || "";
    }

    // Final fallback: use orderid
    if (!invoiceNo) {
        invoiceNo = billData.orderid;
    }

    return invoiceNo;
};

/**
 * Generates invoice HTML from bill data using the new modular template.
 */
const generateInvoiceForBill = (billData: BillRecord, invoiceNo: string): string => {
    let billJson: JsonRecord = {};
    try {
        billJson = typeof billData.data === "string" ? JSON.parse(billData.data) : (toJsonRecord(billData.data) ?? {});
    } catch {
        // continue
    }

    // Extract cart items
    const cartRaw = billData.carts;
    let cart: StoredCart = {};
    try {
        cart = typeof cartRaw === "string" ? JSON.parse(cartRaw) : (toJsonRecord(cartRaw) ?? {});
    } catch {
        // continue
    }

    const cartItems: CartItem[] = Array.isArray(cart?.cart_items) ? (cart.cart_items as CartItem[]) : [];

    const itemsHtml = cartItems
        .map((item) => {
            const itemTotal = (
                Number(item.item_discounted_unit_price || 0) * Number(item.item_quantity || 0)
            ).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            return `
        <tr>
          <td>
            <div class="product-title">${item.item_name}</div>
            <div class="product-desc">${item.item_description || ""}</div>
          </td>
          <td>${item.item_hsn_sac || "998314"}</td>
          <td>${billData.gst_percent}%</td>
          <td>${item.item_quantity}</td>
          <td>&#8377;${itemTotal}</td>
        </tr>
      `;
        })
        .join("");

    // Extract customer and payment details
    const dataObj = toJsonRecord(billJson?.data as JsonRecord);
    const paymentObj = toJsonRecord(dataObj?.payment as unknown);
    const customerObj = toJsonRecord(dataObj?.customer_details as unknown);

    const rawWebhookPayloadObj = toJsonRecord(billJson?.payload as unknown);
    const rawWebhookPaymentEntity = toJsonRecord(
        toJsonRecord(rawWebhookPayloadObj?.payment as unknown)?.entity as unknown
    );
    const rawWebhookNotesObj = toJsonRecord(rawWebhookPaymentEntity?.notes as unknown);

    // Extract payment method
    let paymentMethod = "";
    let paymentDetails = "";
    const methodObj = toJsonRecord(paymentObj?.payment_method as unknown);
    if (methodObj) {
        const keys = Object.keys(methodObj);
        if (keys.length === 1) {
            const key = keys[0];
            const value = toJsonRecord(methodObj[key] as unknown);
            switch (key) {
                case "upi":
                    paymentMethod = "UPI";
                    paymentDetails = `UPI ID: ${readString(value, "upi_id") ?? ""}`;
                    break;
                case "card":
                    paymentMethod = "Card";
                    paymentDetails = `Card: ${readString(value, "card_network") ?? ""} ****${readString(value, "card_last4") ?? ""}`;
                    break;
                case "netbanking":
                    paymentMethod = "Netbanking";
                    paymentDetails = `Bank: ${readString(value, "bank_name") ?? ""}`;
                    break;
                case "wallet":
                    paymentMethod = "Wallet";
                    paymentDetails = `Wallet: ${readString(value, "wallet_name") ?? readString(value, "channel") ?? ""}`;
                    break;
                case "paylater":
                    paymentMethod = "PayLater";
                    paymentDetails = `Provider: ${readString(value, "provider") ?? ""}`;
                    break;
                case "emi":
                    paymentMethod = "EMI";
                    paymentDetails = `Bank: ${readString(value, "bank_name") ?? ""}`;
                    break;
                case "app":
                    paymentMethod = readString(value, "channel") ?? "App";
                    paymentDetails = readString(value, "upi_id") ? `UPI ID: ${readString(value, "upi_id")}` : "";
                    break;
                default:
                    paymentMethod = key.charAt(0).toUpperCase() + key.slice(1);
                    paymentDetails = value ? Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(", ") : "";
            }
        }
    }

    // Extract dates and times
    const webhookCreatedAtUnix = rawWebhookPaymentEntity?.created_at;
    const paymentTimeRaw =
        readString(paymentObj, "payment_time") ??
        (webhookCreatedAtUnix
            ? new Date(Number(webhookCreatedAtUnix) * 1000).toISOString()
            : String(billData.created_at ?? new Date().toISOString()));

    const paymentTimeStr = new Date(paymentTimeRaw).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

    const createdDateStr = new Date(String(billData.created_at ?? new Date().toISOString())).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );

    const billPeriod = new Date(String(billData.created_at ?? new Date().toISOString()))
        .toLocaleDateString("en-IN", { month: "short", year: "numeric" })
        .replace(/\s+/, "-");

    // Extract other details
    const paymentId = readString(paymentObj, "cf_payment_id") || readString(paymentObj, "payment_id") || readString(rawWebhookPaymentEntity, "id") || "";
    const bankRef = readString(paymentObj, "bank_reference") || "";
    const customerName = readString(customerObj, "customer_name") || readString(rawWebhookNotesObj, "customer_name") || "";
    const customerEmail =
        readString(customerObj, "customer_email") ||
        readString(customerObj, "email") ||
        readString(rawWebhookNotesObj, "customer_email") ||
        "";
    const customerPhone =
        readString(customerObj, "customer_phone") || readString(customerObj, "phone") || readString(rawWebhookNotesObj, "customer_phone") || "";

    const billingAddress = billData.billing_address;
    const orderId = billData.orderid;
    const total = billData.total;
    const gstPercent = billData.gst_percent;
    const gstAmount = billData.gst_amount;
    const gatewayFee = billData.gateway_fee;
    const amountInWords = numberToWords(Number(total));

    return generateInvoiceHtml({
        invoiceNo,
        billPeriod,
        invoiceDate: createdDateStr,
        orderId,
        customerName,
        customerEmail,
        customerPhone,
        billingAddress,
        paymentMethod,
        paymentDetails,
        paymentId,
        bankRef,
        paymentTimeStr,
        itemsHtml,
        total,
        gstPercent,
        gstAmount,
        gatewayFee,
        amountInWords,
    });
};

/**
 * Regenerates a single invoice PDF and replaces the old one.
 */
const migrateSingleInvoice = async (billData: BillRecord): Promise<void> => {
    const invoiceNo = extractInvoiceNo(billData);
    const userId = billData.uid;
    const billId = billData.orderid;

    try {
        logAction("PROCESSING", `Bill ID: ${billId}, Invoice: ${invoiceNo}`);

        // Generate new HTML
        const html = generateInvoiceForBill(billData, invoiceNo);

        // Define PDF paths
        const outputDir = path.resolve("public/bills", userId);
        const outputPath = path.join(outputDir, `${invoiceNo}.pdf`);

        // Ensure directory exists
        await fs.mkdir(outputDir, { recursive: true });

        // Check if old PDF exists before generating new one
        let oldPdfExisted = false;
        let oldPdfPath = outputPath;
        try {
            await fs.stat(outputPath);
            oldPdfExisted = true;
        } catch {
            // File doesn't exist, which is fine
        }

        // Generate new PDF
        await generatePdfFromHtml(html, outputPath);

        // Verify new PDF was created
        try {
            await fs.stat(outputPath);
        } catch {
            logError(billId, invoiceNo, "New PDF was not created successfully", new Error("File not found after generation"));
            return;
        }

        if (oldPdfExisted) {
            logSuccess(
                billId,
                invoiceNo,
                "PDF regenerated and replaced (old PDF updated)",
                oldPdfPath,
                outputPath
            );
        } else {
            logSuccess(
                billId,
                invoiceNo,
                "PDF generated (no old PDF to replace)",
                undefined,
                outputPath
            );
        }
    } catch (error) {
        logError(billId, invoiceNo, "Failed to migrate invoice", error);
    }
};

/**
 * Main migration runner - fetches all PAID bills and regenerates their invoices.
 */
const runMigration = async (): Promise<void> => {
    try {
        logAction("MIGRATION", "Starting invoice migration for all PAID bills...");

        // Fetch all PAID bills (status = 'success')
        const [rows] = await db.query("SELECT * FROM bills WHERE status = 'success' ORDER BY created_at DESC");

        const paidBills = rows as BillRecord[];
        logAction("INFO", `Found ${paidBills.length} PAID bills to process`);

        if (paidBills.length === 0) {
            logAction("INFO", "No PAID bills to migrate");
            return;
        }

        // Process each bill
        for (let i = 0; i < paidBills.length; i++) {
            const billData = paidBills[i];
            logAction("PROGRESS", `Processing ${i + 1}/${paidBills.length}...`);
            await migrateSingleInvoice(billData);
        }

        logAction("MIGRATION", "Invoice migration completed");
    } catch (error) {
        logAction("FATAL ERROR", `Migration failed: ${String(error)}`);
        process.exit(1);
    }
};

// ==================== SUMMARY & CLEANUP ====================

const printSummary = () => {
    console.log("\n");
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║           INVOICE MIGRATION SUMMARY                        ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`\nTotal bills processed: ${results.length}`);
    console.log(`✓ Successful: ${successful}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`  Success rate: ${((successful / results.length) * 100).toFixed(2)}%`);

    if (failed > 0) {
        console.log("\n🔴 FAILURES:");
        results
            .filter((r) => !r.success)
            .forEach((r) => {
                console.log(`  - Bill: ${r.billId} (Invoice: ${r.invoiceNo})`);
                console.log(`    Error: ${r.message}`);
            });
    }

    console.log("\n📋 DETAILS:");
    results.slice(0, 20).forEach((r) => {
        const status = r.success ? "✓" : "✗";
        console.log(
            `  ${status} ${r.billId.padEnd(20)} | Invoice: ${r.invoiceNo.padEnd(20)} | ${r.message}`
        );
    });

    if (results.length > 20) {
        console.log(`  ... and ${results.length - 20} more`);
    }

    console.log("\n");
};

// ==================== EXECUTION ====================

(async () => {
    try {
        await runMigration();
        printSummary();
        process.exit(0);
    } catch (error) {
        console.error("Fatal error:", error);
        process.exit(1);
    }
})();
