import type { Request, Response, NextFunction } from "express";
import type { RowDataPacket } from "mysql2";
import { db } from "../config/db.js";

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

