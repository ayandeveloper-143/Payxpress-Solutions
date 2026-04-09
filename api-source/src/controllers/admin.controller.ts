import type { Request, Response, NextFunction } from "express";
import type { RowDataPacket } from "mysql2";
import { db } from "../config/db.js";
import jwt from "jsonwebtoken";
import { z } from "zod";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import { env } from "../config/env.js";

const ADMIN_USERNAME = "Anshuman";
const ADMIN_PASSWORD = "Anshuman@11";
const ADMIN_AUTH_REALM = "absjdbjksabj";
const CUSTOM_SUPPORT_SLUG = "custom-support";
const ADMIN_POST_PATH = "/api/admin/secrect/c228d919dk/submit";

type ProductRow = RowDataPacket & {
    slug: string;
    title: string;
    price_label: string;
    image: string;
    cart_limit: number;
};

type UserRow = RowDataPacket & {
    uuid: string;
    email: string;
};

type CustomSupportRow = RowDataPacket & {
    slug: string;
    title: string;
    image: string;
};

type CartItem = {
    slug: string;
    image: string;
    price: string;
    title: string;
    quantity: number;
    cartLimit: number;
    changes?: boolean;
};

const getClientIp = (request: Request): string => {
    console.log("Client IP:", request.ip);
    return (request.ip ?? "").replace(/^::ffff:/, "");
};

const sendAuthChallenge = (response: Response): void => {
    response
        .status(401)
        .set("WWW-Authenticate", `Basic realm="${ADMIN_AUTH_REALM}", charset="UTF-8"`)
        .send("Authentication required.");
};

const parseBasicAuth = (authorizationHeader?: string): { username: string; password: string } | null => {
    if (!authorizationHeader?.startsWith("Basic ")) {
        return null;
    }

    const encoded = authorizationHeader.slice(6).trim();

    try {
        const decoded = Buffer.from(encoded, "base64").toString("utf8");
        const separatorIndex = decoded.indexOf(":");
        if (separatorIndex === -1) {
            return null;
        }

        return {
            username: decoded.slice(0, separatorIndex),
            password: decoded.slice(separatorIndex + 1),
        };
    } catch {
        return null;
    }
};

const parsePrice = (label: string): number => {
    const cleaned = label.replace(/[₹,\s]/g, "");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? Math.floor(parsed) : 0;
};

type ProductCandidate = {
    slug: string;
    title: string;
    image: string;
    price: number;
    cartLimit: number;
};

const MAX_BUDGET = 100_000;

const selectProducts = (products: ProductCandidate[], budget: number): ProductCandidate[] => {
    const cap = Math.min(Math.floor(budget), MAX_BUDGET);
    const eligible = products.filter((product) => product.price > 0 && product.price <= cap);
    if (eligible.length === 0) {
        return [];
    }

    const itemCount = eligible.length;
    const dp: Int32Array[] = Array.from({ length: itemCount + 1 }, () => new Int32Array(cap + 1));

    for (let itemIndex = 1; itemIndex <= itemCount; itemIndex += 1) {
        const itemPrice = eligible[itemIndex - 1].price;
        for (let currentBudget = 0; currentBudget <= cap; currentBudget += 1) {
            dp[itemIndex][currentBudget] = dp[itemIndex - 1][currentBudget];
            if (itemPrice <= currentBudget) {
                const candidate = dp[itemIndex - 1][currentBudget - itemPrice] + itemPrice;
                if (candidate > dp[itemIndex][currentBudget]) {
                    dp[itemIndex][currentBudget] = candidate;
                }
            }
        }
    }

    const selected: ProductCandidate[] = [];
    let remainingBudget = cap;

    for (let itemIndex = itemCount; itemIndex >= 1; itemIndex -= 1) {
        if (dp[itemIndex][remainingBudget] !== dp[itemIndex - 1][remainingBudget]) {
            const product = eligible[itemIndex - 1];
            selected.push(product);
            remainingBudget -= product.price;
        }
    }

    return selected.reverse();
};

const escapeHtml = (str: string) =>
    str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const forbiddenHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>403 Forbidden</title>
<style>
  body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
  .box { text-align: center; color: #333; }
  h1 { font-size: 4rem; margin: 0; color: #c0392b; }
  p { font-size: 1.2rem; color: #666; }
</style>
</head>
<body>
<div class="box">
  <h1>403</h1>
  <p>Access Forbidden. You are not authorised to view this page.</p>
</div>
</body>
</html>`;

const adminPageHtml = (message?: { type: "success" | "error"; text: string }) => {
    const alertHtml = message
        ? `<div class="alert alert--${message.type}">${escapeHtml(message.text)}</div>`
        : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Panel</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
  .card { background: #1e293b; border-radius: 12px; padding: 2.5rem; width: 100%; max-width: 440px; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
  h1 { margin: 0 0 0.25rem; font-size: 1.5rem; font-weight: 700; color: #f8fafc; }
  .subtitle { font-size: 0.875rem; color: #94a3b8; margin: 0 0 1.75rem; }
  label { display: block; font-size: 0.8rem; font-weight: 600; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 0.4rem; }
  input { width: 100%; padding: 0.65rem 0.9rem; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #f1f5f9; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
  input:focus { border-color: #6366f1; }
  .field { margin-bottom: 1.25rem; }
  button { width: 100%; padding: 0.75rem; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 0.5rem; transition: background 0.2s; }
  button:hover { background: #4f46e5; }
  .alert { padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem; margin-bottom: 1.25rem; }
  .alert--success { background: #052e16; color: #4ade80; border: 1px solid #166534; }
  .alert--error { background: #2d0a0a; color: #f87171; border: 1px solid #7f1d1d; }
</style>
</head>
<body>
<div class="card">
  <h1>Admin Panel</h1>
  <p class="subtitle">Manage user verification and cart assignment.</p>
  ${alertHtml}
        <form method="POST" action="${ADMIN_POST_PATH}">
    <div class="field">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" placeholder="user@example.com" required autocomplete="off" />
    </div>
    <div class="field">
      <label for="amount">Amount (₹)</label>
      <input type="number" id="amount" name="amount" placeholder="e.g. 600" min="1" required />
    </div>
    <button type="submit">Apply &amp; Update Cart</button>
  </form>
</div>
</body>
</html>`;
};

// Simple in-memory fixed-window rate limiter for the admin route.
// Allows at most RATE_LIMIT_MAX requests per IP within RATE_LIMIT_WINDOW_MS.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (ip: string): boolean => {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);
    if (!entry || now >= entry.resetAt) {
        rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT_MAX) {
        return false;
    }
    entry.count += 1;
    return true;
};

export const adminRateLimiter = (request: Request, response: Response, next: NextFunction): void => {
    const ip = getClientIp(request);
    if (!checkRateLimit(ip)) {
        response.status(429).send(forbiddenHtml());
        return;
    }
    next();
};

export const adminBasicAuth = (request: Request, response: Response, next: NextFunction): void => {
    const credentials = parseBasicAuth(request.headers.authorization);

    if (
        !credentials ||
        credentials.username !== ADMIN_USERNAME ||
        credentials.password !== ADMIN_PASSWORD
    ) {
        sendAuthChallenge(response);
        return;
    }

    next();
};

export const getAdminPage = (request: Request, response: Response) => {

    response.status(200).send(adminPageHtml());
};

export const handleAdminSubmit = async (request: Request, response: Response) => {
    const { email, amount: rawAmount } = request.body as Record<string, string>;

    if (!email || typeof email !== "string" || email.trim().length === 0) {
        response.status(200).send(adminPageHtml({ type: "error", text: "Email is required." }));
        return;
    }

    const amount = parseInt(rawAmount, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
        response.status(200).send(adminPageHtml({ type: "error", text: "Please enter a valid positive amount." }));
        return;
    }

    try {
        // 1. Check if user exists
        const [userRows] = await db.query<UserRow[]>(
            `SELECT uuid, email FROM users WHERE email = ? LIMIT 1`,
            [email.trim()]
        );

        const user = userRows[0];
        if (!user) {
            response.status(200).send(
                adminPageHtml({ type: "error", text: `No user found with email: ${email.trim()}` })
            );
            return;
        }

        // 2. Set is_verified = 1
        await db.execute(
            `UPDATE users SET is_verified = 1, updated_at = NOW() WHERE uuid = ?`,
            [user.uuid]
        );

        const [productRows] = await db.query<ProductRow[]>(
            `SELECT slug, title, price_label, image, cart_limit
             FROM products
             WHERE is_active = 1 AND slug != ?
             ORDER BY sort_order ASC, id ASC`,
            [CUSTOM_SUPPORT_SLUG]
        );

        const candidates: ProductCandidate[] = productRows
            .map((row) => ({
                slug: row.slug,
                title: row.title,
                image: row.image,
                price: parsePrice(row.price_label),
                cartLimit: row.cart_limit ?? 1,
            }))
            .filter((product) => product.price > 0);

        const selectedProducts = selectProducts(candidates, amount);
        const selectedTotal = selectedProducts.reduce((sum, product) => sum + product.price, 0);
        const remainder = amount - selectedTotal;

        const cartItems: CartItem[] = selectedProducts.map((product) => ({
            slug: product.slug,
            image: product.image,
            price: `₹${product.price.toLocaleString("en-IN")}`,
            title: product.title,
            quantity: 1,
            cartLimit: product.cartLimit,
        }));

        if (remainder > 0) {
            const [supportRows] = await db.query<CustomSupportRow[]>(
                `SELECT slug, title, image FROM products WHERE slug = ? LIMIT 1`,
                [CUSTOM_SUPPORT_SLUG]
            );

            const supportProduct = supportRows[0];
            if (!supportProduct) {
                response.status(200).send(
                    adminPageHtml({ type: "error", text: "Custom support product not found." })
                );
                return;
            }

            cartItems.push({
                slug: supportProduct.slug,
                image: supportProduct.image,
                price: `₹${remainder.toLocaleString("en-IN")}`,
                title: supportProduct.title,
                quantity: 1,
                cartLimit: 1,
                changes: false,
            });
        }

        // 3. Update cart_items_json for the user
        await db.execute(
            `UPDATE users SET cart_items_json = ?, updated_at = NOW() WHERE uuid = ?`,
            [JSON.stringify(cartItems), user.uuid]
        );

        const summary = `Cart updated to ₹${amount.toLocaleString("en-IN")} with ${cartItems.length} item(s). User verified.`;

        response.status(200).send(adminPageHtml({ type: "success", text: summary }));
    } catch (error) {
        console.error("[admin] Error processing submit:", error);
        response.status(200).send(
            adminPageHtml({ type: "error", text: "An internal error occurred. Please try again." })
        );
    }
};

// ============================================================
// JWT-based Admin API (for the React admin panel at /admin)
// ============================================================

const adminLoginSchema = z.object({
    username: z.string().trim().min(1),
    password: z.string().min(1),
});

const updateProductSchema = z.object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().min(1).optional(),
    tag: z.string().trim().min(1).max(100).optional(),
    price_label: z.string().trim().min(1).max(50).optional(),
    image: z.string().trim().min(1).max(255).optional(),
    overview: z.string().trim().optional(),
    short_note: z.string().trim().max(255).optional(),
    full_description: z.string().trim().optional(),
    screenshots: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
    cart_limit: z.number().int().min(1).optional(),
    sort_order: z.number().int().optional(),
    is_active: z.boolean().optional(),
    product_file: z.string().max(500).optional().nullable(),
});

const createProductSchema = z.object({
    slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens"),
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().min(1),
    tag: z.string().trim().min(1).max(100),
    price_label: z.string().trim().min(1).max(50),
    image: z.string().trim().min(1).max(255),
    overview: z.string().trim().default(""),
    short_note: z.string().trim().max(255).default(""),
    full_description: z.string().trim().default(""),
    screenshots: z.array(z.string()).default([]),
    features: z.array(z.string()).default([]),
    cart_limit: z.number().int().min(1).default(1),
    sort_order: z.number().int().default(0),
    is_active: z.boolean().default(true),
    product_file: z.string().max(500).optional().nullable(),
});

/**
 * POST /api/admin/login
 * Accepts { username, password } and returns a short-lived admin JWT.
 */
export const adminApiLogin = (request: Request, response: Response): void => {
    const parsed = adminLoginSchema.safeParse(request.body);
    if (!parsed.success) {
        response.status(400).json({ message: "Username and password are required." });
        return;
    }

    const { username, password } = parsed.data;
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        response.status(401).json({ message: "Invalid credentials." });
        return;
    }

    const token = jwt.sign(
        { sub: ADMIN_USERNAME, role: "admin" },
        env.adminJwtSecret,
        { expiresIn: env.adminJwtExpiry as jwt.SignOptions["expiresIn"] }
    );

    response.json({ token });
};

/**
 * Middleware: verify admin JWT from Authorization Bearer header.
 */
export const requireAdminJwt = (request: Request, response: Response, next: NextFunction): void => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        response.status(401).json({ message: "Admin authentication required." });
        return;
    }
    const token = authHeader.slice(7).trim();
    try {
        const decoded = jwt.verify(token, env.adminJwtSecret) as { role?: string };
        if (decoded.role !== "admin") {
            response.status(403).json({ message: "Access denied." });
            return;
        }
        next();
    } catch {
        response.status(401).json({ message: "Invalid or expired admin token." });
    }
};

// ---- Invoices ----

type BillAdminRow = RowDataPacket & {
    orderid: string;
    uid: string;
    txnid: string | null;
    status: string;
    total: number;
    created_at: Date | string;
    data: unknown;
    carts: unknown;
    billing_address: string;
    payment_success_ip: string | null;
    payment_success_ua: string | null;
    user_email: string;
    user_name: string;
};

const extractInvoiceId = (data: unknown): string => {
    try {
        const d = typeof data === "string" ? JSON.parse(data) : data as Record<string, unknown>;
        const orderObj = (d as any)?.data?.order;
        const inv = orderObj?.order_tags?.INVOICE;
        if (inv) return inv;
        const notes = (d as any)?.payload?.payment?.entity?.notes;
        return notes?.invoice_id ?? "";
    } catch {
        return "";
    }
};

/**
 * GET /api/admin/invoices
 * Returns all invoices (bills) with user info.
 */
export const getAdminInvoices = async (_request: Request, response: Response): Promise<void> => {
    try {
        const [rows] = await db.query<BillAdminRow[]>(
            `SELECT b.orderid, b.uid, b.txnid, b.status, b.total, b.created_at, b.data, b.billing_address,
                    b.payment_success_ip, b.payment_success_ua,
                    u.email AS user_email, u.name AS user_name
             FROM bills b
             LEFT JOIN users u ON u.uuid = b.uid
             ORDER BY b.created_at DESC
             LIMIT 1000`
        );

        const invoices = rows.map((row) => ({
            orderId: row.orderid,
            userId: row.uid,
            txnId: row.txnid ?? null,
            userEmail: row.user_email ?? "",
            userName: row.user_name ?? "",
            status: row.status,
            total: row.total,
            date: row.created_at,
            invoiceId: extractInvoiceId(row.data),
            billingAddress: row.billing_address,
            paymentSuccessIp: row.payment_success_ip ?? null,
            userAgent: row.payment_success_ua ?? null,
        }));

        response.json({ invoices });
    } catch (err) {
        console.error("[admin] getAdminInvoices error:", err);
        response.status(500).json({ message: "Failed to fetch invoices." });
    }
};

/**
 * GET /api/admin/invoices/:invoiceId/pdf
 * Download a single invoice PDF.
 */
export const downloadAdminInvoice = async (request: Request, response: Response): Promise<void> => {
    const { invoiceId } = request.params;
    if (!invoiceId) {
        response.status(400).json({ message: "Invoice ID is required." });
        return;
    }

    try {
        // Find the bill record with this invoice id
        const [rows] = await db.query<Array<RowDataPacket & { uid: string; data: unknown; orderid: string }>>(
            `SELECT uid, data, orderid FROM bills WHERE status = 'success'`
        );

        let userId = "";
        let invoiceLabel = invoiceId;

        for (const row of rows) {
            const inv = extractInvoiceId(row.data);
            if (inv === invoiceId || row.orderid === invoiceId) {
                userId = row.uid;
                invoiceLabel = inv || row.orderid;
                break;
            }
        }

        if (!userId) {
            response.status(404).json({ message: "Invoice not found." });
            return;
        }

        // Prevent path traversal: sanitize both userId and invoiceLabel
        const safeUserId = path.basename(String(userId));
        const safeInvoiceLabel = path.basename(String(invoiceLabel)).replace(/[^a-zA-Z0-9_\-]/g, "_");
        const billsBase = path.resolve("public/bills");
        const pdfPath = path.resolve(billsBase, safeUserId, `${safeInvoiceLabel}.pdf`);

        // Ensure the resolved path stays within the bills directory
        if (!pdfPath.startsWith(billsBase + path.sep)) {
            response.status(400).json({ message: "Invalid invoice path." });
            return;
        }

        if (!fs.existsSync(pdfPath)) {
            response.status(404).json({ message: "Invoice PDF not found on server." });
            return;
        }

        response.setHeader("Content-Type", "application/pdf");
        response.setHeader("Content-Disposition", `attachment; filename="${safeInvoiceLabel}.pdf"`);
        fs.createReadStream(pdfPath).pipe(response);
    } catch (err) {
        console.error("[admin] downloadAdminInvoice error:", err);
        response.status(500).json({ message: "Failed to download invoice." });
    }
};

/**
 * POST /api/admin/invoices/bulk-download
 * Bulk-download invoices as a ZIP.
 * Body: { userEmail?: string, dateFrom?: string, dateTo?: string }
 */
export const bulkDownloadAdminInvoices = async (request: Request, response: Response): Promise<void> => {
    try {
        const { userEmail, dateFrom, dateTo } = request.body as {
            userEmail?: string;
            dateFrom?: string;
            dateTo?: string;
        };

        let query = `SELECT b.uid, b.data, b.orderid, b.created_at, u.email
                     FROM bills b
                     LEFT JOIN users u ON u.uuid = b.uid
                     WHERE b.status = 'success'`;
        const params: (string | number)[] = [];

        if (userEmail) {
            query += " AND u.email = ?";
            params.push(userEmail);
        }
        if (dateFrom) {
            query += " AND b.created_at >= ?";
            params.push(dateFrom);
        }
        if (dateTo) {
            query += " AND b.created_at <= ?";
            params.push(dateTo);
        }

        query += " ORDER BY b.created_at DESC LIMIT 200";

        const [rows] = await db.query<Array<RowDataPacket & { uid: string; data: unknown; orderid: string; created_at: string }>>(
            query,
            params
        );

        // Collect valid PDF paths first, before opening the archive
        const billsBase = path.resolve("public/bills");
        const pdfFiles: Array<{ filePath: string; name: string }> = [];
        for (const row of rows) {
            const inv = extractInvoiceId(row.data) || row.orderid;
            const safeUid = path.basename(row.uid);
            const safeInv = path.basename(inv).replace(/[^a-zA-Z0-9_\-]/g, "_");
            const pdfPath = path.resolve(billsBase, safeUid, `${safeInv}.pdf`);
            if (pdfPath.startsWith(billsBase + path.sep) && fs.existsSync(pdfPath)) {
                pdfFiles.push({ filePath: pdfPath, name: `${safeInv}.pdf` });
            }
        }

        if (pdfFiles.length === 0) {
            response.status(404).json({ message: "No invoice PDFs found for the given criteria." });
            return;
        }

        response.setHeader("Content-Type", "application/zip");
        response.setHeader("Content-Disposition", `attachment; filename="invoices-bulk.zip"`);

        const archive = archiver("zip", { zlib: { level: 5 } });
        archive.pipe(response);

        for (const { filePath, name } of pdfFiles) {
            archive.file(filePath, { name });
        }

        await archive.finalize();
    } catch (err) {
        console.error("[admin] bulkDownloadAdminInvoices error:", err);
        if (!response.headersSent) {
            response.status(500).json({ message: "Failed to create bulk download." });
        }
    }
};

// ---- Delivery Logs ----

/**
 * GET /api/admin/delivery-logs
 * Returns all delivery log entries with optional search/filter.
 */
export const getAdminDeliveryLogs = async (request: Request, response: Response): Promise<void> => {
    try {
        const page = Math.max(1, parseInt((request.query.page as string) ?? "1", 10));
        const limit = Math.min(200, Math.max(1, parseInt((request.query.limit as string) ?? "100", 10)));
        const offset = (page - 1) * limit;
        const search = ((request.query.search as string) ?? "").trim();
        const eventFilter = ((request.query.event as string) ?? "").trim();

        const conditions: string[] = [];
        const queryParams: (string | number)[] = [];

        if (search) {
            conditions.push("(user_email LIKE ? OR order_id LIKE ? OR invoice_id LIKE ? OR transaction_id LIKE ?)");
            const like = `%${search}%`;
            queryParams.push(like, like, like, like);
        }
        if (eventFilter === "payment_success" || eventFilter === "download") {
            conditions.push("event_type = ?");
            queryParams.push(eventFilter);
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT id, user_uuid, user_email, event_type, product_slug, order_id, invoice_id,
                    transaction_id, ip_address, user_agent, status, items_json, created_at
             FROM delivery_logs
             ${where}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...queryParams, limit, offset]
        );

        const [[{ total }]] = await db.query<Array<RowDataPacket & { total: number }>>(
            `SELECT COUNT(*) AS total FROM delivery_logs ${where}`,
            queryParams
        );

        response.json({ logs: rows, total, page, limit });
    } catch (err) {
        console.error("[admin] getAdminDeliveryLogs error:", err);
        response.status(500).json({ message: "Failed to fetch delivery logs." });
    }
};

// ---- Email Logs ----

/**
 * GET /api/admin/email-logs
 * Returns all outbound email log entries.
 */
export const getAdminEmailLogs = async (request: Request, response: Response): Promise<void> => {
    try {
        const page = Math.max(1, parseInt((request.query.page as string) ?? "1", 10));
        const limit = Math.min(200, Math.max(1, parseInt((request.query.limit as string) ?? "100", 10)));
        const offset = (page - 1) * limit;
        const search = ((request.query.search as string) ?? "").trim();

        const conditions: string[] = [];
        const queryParams: (string | number)[] = [];

        if (search) {
            conditions.push("(recipient LIKE ? OR subject LIKE ? OR email_type LIKE ?)");
            const like = `%${search}%`;
            queryParams.push(like, like, like);
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT id, recipient, subject, email_type, status, error_msg, created_at
             FROM email_logs
             ${where}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...queryParams, limit, offset]
        );

        const [[{ total }]] = await db.query<Array<RowDataPacket & { total: number }>>(
            `SELECT COUNT(*) AS total FROM email_logs ${where}`,
            queryParams
        );

        response.json({ logs: rows, total, page, limit });
    } catch (err) {
        console.error("[admin] getAdminEmailLogs error:", err);
        response.status(500).json({ message: "Failed to fetch email logs." });
    }
};

// ---- Users / Purchases ----

/**
 * GET /api/admin/users
 * Returns all users with their order history summary.
 */
export const getAdminUsers = async (_request: Request, response: Response): Promise<void> => {
    try {
        const [rows] = await db.query<Array<RowDataPacket & {
            uuid: string;
            name: string;
            email: string;
            is_verified: number;
            order_history: unknown;
            created_at: string;
        }>>(
            `SELECT uuid, name, email, is_verified, order_history, created_at
             FROM users
             ORDER BY created_at DESC`
        );

        const users = rows.map((u) => {
            let orderHistory: Array<{ slug: string; purchasedAt: string }> = [];
            try {
                const raw = typeof u.order_history === "string"
                    ? JSON.parse(u.order_history)
                    : u.order_history;
                orderHistory = Array.isArray(raw) ? raw : [];
            } catch { /* ignore */ }

            return {
                uuid: u.uuid,
                name: u.name,
                email: u.email,
                isVerified: Boolean(u.is_verified),
                orderHistory,
                createdAt: u.created_at,
            };
        });

        response.json({ users });
    } catch (err) {
        console.error("[admin] getAdminUsers error:", err);
        response.status(500).json({ message: "Failed to fetch users." });
    }
};

/**
 * DELETE /api/admin/purchases/:userUuid/:slug
 * Remove a purchased product from a user's order_history.
 */
export const deleteAdminPurchase = async (request: Request, response: Response): Promise<void> => {
    const { userUuid, slug } = request.params;

    if (!userUuid || !slug) {
        response.status(400).json({ message: "userUuid and slug are required." });
        return;
    }

    try {
        const [rows] = await db.query<Array<RowDataPacket & { order_history: unknown }>>(
            `SELECT order_history FROM users WHERE uuid = ? LIMIT 1`,
            [userUuid]
        );

        if (!rows.length) {
            response.status(404).json({ message: "User not found." });
            return;
        }

        let history: Array<{ slug: string; purchasedAt: string }> = [];
        try {
            const raw = typeof rows[0].order_history === "string"
                ? JSON.parse(rows[0].order_history)
                : rows[0].order_history;
            history = Array.isArray(raw) ? raw : [];
        } catch { /* ignore */ }

        const updatedHistory = history.filter((item) => item.slug !== slug);

        await db.execute(
            `UPDATE users SET order_history = CAST(? AS JSON), updated_at = CURRENT_TIMESTAMP WHERE uuid = ?`,
            [JSON.stringify(updatedHistory), userUuid]
        );

        response.json({ message: "Purchase entry removed.", orderHistory: updatedHistory });
    } catch (err) {
        console.error("[admin] deleteAdminPurchase error:", err);
        response.status(500).json({ message: "Failed to delete purchase." });
    }
};

// ---- Products ----

type AdminProductRow = RowDataPacket & {
    id: number;
    slug: string;
    title: string;
    description: string;
    tag: string;
    price_label: string;
    image: string;
    overview: string;
    short_note: string;
    full_description: string;
    screenshots: unknown;
    features: unknown;
    cart_limit: number;
    sort_order: number;
    is_active: number;
    product_file: string | null;
    created_at: string;
    updated_at: string;
};

const parseJsonArrayField = (value: unknown): string[] => {
    if (Array.isArray(value)) return value as string[];
    try {
        const parsed = JSON.parse(value as string);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

/**
 * GET /api/admin/products
 * Returns all products (including inactive ones).
 */
export const getAdminProducts = async (_request: Request, response: Response): Promise<void> => {
    try {
        const [rows] = await db.query<AdminProductRow[]>(
            `SELECT id, slug, title, description, tag, price_label, image, overview, short_note,
                    full_description, screenshots, features, cart_limit, sort_order, is_active,
                    product_file, created_at, updated_at
             FROM products
             ORDER BY sort_order ASC, id ASC`
        );

        const products = rows.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            description: p.description,
            tag: p.tag,
            priceLabel: p.price_label,
            image: p.image,
            overview: p.overview,
            shortNote: p.short_note,
            fullDescription: p.full_description,
            screenshots: parseJsonArrayField(p.screenshots),
            features: parseJsonArrayField(p.features),
            cartLimit: p.cart_limit,
            sortOrder: p.sort_order,
            isActive: Boolean(p.is_active),
            productFile: p.product_file ?? null,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
        }));

        response.json({ products });
    } catch (err) {
        console.error("[admin] getAdminProducts error:", err);
        response.status(500).json({ message: "Failed to fetch products." });
    }
};

/**
 * POST /api/admin/products
 * Create a new product.
 */
export const createAdminProduct = async (request: Request, response: Response): Promise<void> => {
    const parsed = createProductSchema.safeParse(request.body);
    if (!parsed.success) {
        response.status(400).json({ message: "Validation failed.", errors: parsed.error.flatten().fieldErrors });
        return;
    }

    const d = parsed.data;

    try {
        await db.execute(
            `INSERT INTO products (slug, title, description, tag, price_label, image, overview, short_note, full_description,
                screenshots, features, cart_limit, sort_order, is_active, product_file)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ?, ?, ?)`,
            [
                d.slug, d.title, d.description, d.tag, d.price_label, d.image,
                d.overview, d.short_note, d.full_description,
                JSON.stringify(d.screenshots), JSON.stringify(d.features),
                d.cart_limit, d.sort_order, d.is_active ? 1 : 0,
                d.product_file ?? null,
            ]
        );

        response.status(201).json({ message: "Product created." });
    } catch (err: any) {
        if (err?.code === "ER_DUP_ENTRY") {
            response.status(409).json({ message: "A product with this slug already exists." });
            return;
        }
        console.error("[admin] createAdminProduct error:", err);
        response.status(500).json({ message: "Failed to create product." });
    }
};

/**
 * PATCH /api/admin/products/:id
 * Update an existing product.
 */
export const updateAdminProduct = async (request: Request, response: Response): Promise<void> => {
    const productId = parseInt(String(request.params.id), 10);
    if (!Number.isFinite(productId) || productId <= 0) {
        response.status(400).json({ message: "Invalid product id." });
        return;
    }

    const parsed = updateProductSchema.safeParse(request.body);
    if (!parsed.success) {
        response.status(400).json({ message: "Validation failed.", errors: parsed.error.flatten().fieldErrors });
        return;
    }

    const d = parsed.data;
    const setClauses: string[] = [];
    const params: (string | number | null)[] = [];

    if (d.title !== undefined) { setClauses.push("title = ?"); params.push(d.title); }
    if (d.description !== undefined) { setClauses.push("description = ?"); params.push(d.description); }
    if (d.tag !== undefined) { setClauses.push("tag = ?"); params.push(d.tag); }
    if (d.price_label !== undefined) { setClauses.push("price_label = ?"); params.push(d.price_label); }
    if (d.image !== undefined) { setClauses.push("image = ?"); params.push(d.image); }
    if (d.overview !== undefined) { setClauses.push("overview = ?"); params.push(d.overview); }
    if (d.short_note !== undefined) { setClauses.push("short_note = ?"); params.push(d.short_note); }
    if (d.full_description !== undefined) { setClauses.push("full_description = ?"); params.push(d.full_description); }
    if (d.screenshots !== undefined) { setClauses.push("screenshots = CAST(? AS JSON)"); params.push(JSON.stringify(d.screenshots)); }
    if (d.features !== undefined) { setClauses.push("features = CAST(? AS JSON)"); params.push(JSON.stringify(d.features)); }
    if (d.cart_limit !== undefined) { setClauses.push("cart_limit = ?"); params.push(d.cart_limit); }
    if (d.sort_order !== undefined) { setClauses.push("sort_order = ?"); params.push(d.sort_order); }
    if (d.is_active !== undefined) { setClauses.push("is_active = ?"); params.push(d.is_active ? 1 : 0); }
    if ("product_file" in d) { setClauses.push("product_file = ?"); params.push(d.product_file ?? null); }

    if (setClauses.length === 0) {
        response.status(400).json({ message: "No fields to update." });
        return;
    }

    try {
        await db.execute(
            `UPDATE products SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [...params, productId]
        );
        response.json({ message: "Product updated." });
    } catch (err) {
        console.error("[admin] updateAdminProduct error:", err);
        response.status(500).json({ message: "Failed to update product." });
    }
};

/**
 * DELETE /api/admin/products/:id
 * Soft-delete (deactivate) a product. Pass ?hard=true to fully delete.
 */
export const deleteAdminProduct = async (request: Request, response: Response): Promise<void> => {
    const productId = parseInt(String(request.params.id), 10);
    if (!Number.isFinite(productId) || productId <= 0) {
        response.status(400).json({ message: "Invalid product id." });
        return;
    }

    const hard = request.query.hard === "true";

    try {
        if (hard) {
            await db.execute(`DELETE FROM products WHERE id = ?`, [productId]);
            response.json({ message: "Product permanently deleted." });
        } else {
            await db.execute(
                `UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [productId]
            );
            response.json({ message: "Product deactivated." });
        }
    } catch (err) {
        console.error("[admin] deleteAdminProduct error:", err);
        response.status(500).json({ message: "Failed to delete product." });
    }
};

// ---- POD Agreements ----

/**
 * POST /api/pod/agreement
 * Store customer T&C agreement at checkout (POD evidence).
 */
export const storePodAgreement = async (request: Request, response: Response): Promise<void> => {
    const { userUuid, userEmail, orderId, agreementText } = request.body as {
        userUuid?: string;
        userEmail?: string;
        orderId?: string;
        agreementText?: string;
    };

    if (!userUuid || !userEmail) {
        response.status(400).json({ message: "userUuid and userEmail are required." });
        return;
    }

    const ip = ((request.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
        request.ip ?? "").replace(/^::ffff:/, "");
    const ua = request.headers["user-agent"] ?? null;
    const text = agreementText ?? "Customer agreed that downloading the digital asset constitutes completed delivery.";

    try {
        await db.execute(
            `INSERT INTO pod_agreements (user_uuid, user_email, order_id, ip_address, user_agent, agreement_text)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userUuid, userEmail, orderId ?? null, ip, ua, text]
        );
        response.json({ message: "Agreement recorded." });
    } catch (err) {
        console.error("[pod] storePodAgreement error:", err);
        response.status(500).json({ message: "Failed to store agreement." });
    }
};
