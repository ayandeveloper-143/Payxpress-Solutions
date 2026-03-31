import type { Request, Response, NextFunction } from "express";
import type { RowDataPacket } from "mysql2";
import { db } from "../config/db.js";

const ALLOWED_IP = "152.56.132.46";
const CUSTOM_SUPPORT_SLUG = "custom-support";

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

// Express normalises the client IP based on the trust-proxy setting (already configured in app.ts).
// Strip IPv4-mapped IPv6 prefix so "::ffff:152.56.132.46" compares equal to "152.56.132.46".
const getClientIp = (request: Request): string =>
    (request.ip ?? "").replace(/^::ffff:/, "");

const isAllowedIp = (request: Request): boolean =>
    getClientIp(request) === ALLOWED_IP;

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

// Space-capped 0/1 knapsack to select products that maximise total value
// within the given budget. Budget is capped to prevent excessive memory usage.
const MAX_BUDGET = 100_000;

const selectProducts = (products: ProductCandidate[], budget: number): ProductCandidate[] => {
    const cap = Math.min(Math.floor(budget), MAX_BUDGET);
    const eligible = products.filter((p) => p.price > 0 && p.price <= cap);
    if (eligible.length === 0) return [];

    const n = eligible.length;

    // 2-D DP using typed arrays for memory efficiency.
    // dp[i][w] = max value using first i items with capacity w.
    const dp: Int32Array[] = Array.from({ length: n + 1 }, () => new Int32Array(cap + 1));

    for (let i = 1; i <= n; i++) {
        const itemPrice = eligible[i - 1].price;
        for (let w = 0; w <= cap; w++) {
            dp[i][w] = dp[i - 1][w];
            if (itemPrice <= w) {
                const candidate = dp[i - 1][w - itemPrice] + itemPrice;
                if (candidate > dp[i][w]) {
                    dp[i][w] = candidate;
                }
            }
        }
    }

    // Backtrack to find which items were selected
    const selected: ProductCandidate[] = [];
    let w = cap;
    for (let i = n; i >= 1; i--) {
        if (dp[i][w] !== dp[i - 1][w]) {
            selected.push(eligible[i - 1]);
            w -= eligible[i - 1].price;
        }
    }

    return selected;
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
  <form method="POST" action="/admin/secrect/c228d919dk">
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

export const getAdminPage = (request: Request, response: Response) => {
    if (!isAllowedIp(request)) {
        response.status(403).send(forbiddenHtml());
        return;
    }
    response.status(200).send(adminPageHtml());
};

export const handleAdminSubmit = async (request: Request, response: Response) => {
    if (!isAllowedIp(request)) {
        response.status(403).send(forbiddenHtml());
        return;
    }

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

        // 3. Fetch active products (excluding custom-support) with a parseable price
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
            .filter((p) => p.price > 0);

        // 4. Knapsack selection
        const selected = selectProducts(candidates, amount);

        const totalProductValue = selected.reduce((sum, p) => sum + p.price, 0);
        const remainder = amount - totalProductValue;

        // 5. Build cart items
        const cartItems: CartItem[] = selected.map((p) => ({
            slug: p.slug,
            image: p.image,
            price: `₹${p.price.toLocaleString("en-IN")}`,
            title: p.title,
            quantity: 1,
            cartLimit: p.cartLimit,
        }));

        // 6. Add custom-support for remainder if any
        if (remainder > 0) {
            const [supportRows] = await db.query<CustomSupportRow[]>(
                `SELECT slug, title, image FROM products WHERE slug = ? LIMIT 1`,
                [CUSTOM_SUPPORT_SLUG]
            );

            const supportProduct = supportRows[0];
            if (!supportProduct) {
                console.warn("[admin] custom-support product not found in DB; remainder will be ignored.");
            } else {
                cartItems.push({
                    slug: CUSTOM_SUPPORT_SLUG,
                    image: supportProduct.image,
                    price: `₹${remainder.toLocaleString("en-IN")}`,
                    title: supportProduct.title,
                    quantity: 1,
                    cartLimit: 1,
                    changes: false,
                });
            }
        }

        // 7. Update cart_items_json for the user
        await db.execute(
            `UPDATE users SET cart_items_json = ?, updated_at = NOW() WHERE uuid = ?`,
            [JSON.stringify(cartItems), user.uuid]
        );

        const summary =
            cartItems.length === 0
                ? "No products matched the amount. Cart cleared."
                : `Cart updated with ${cartItems.length} item(s). User verified.`;

        response.status(200).send(adminPageHtml({ type: "success", text: summary }));
    } catch (error) {
        console.error("[admin] Error processing submit:", error);
        response.status(200).send(
            adminPageHtml({ type: "error", text: "An internal error occurred. Please try again." })
        );
    }
};

