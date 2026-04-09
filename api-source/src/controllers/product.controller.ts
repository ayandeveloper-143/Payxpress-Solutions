import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import path from "node:path";
import fs from "node:fs";
import { logDeliveryEvent } from "../utils/delivery-log.js";

// Helper to verify access token and get user UUID
const getBearerToken = (request: Request) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
};

const verifyAccessToken = (token: string): { sub: string } | null => {
    try {
        const decoded = jwt.verify(token, env.jwtAccessSecret);
        if (typeof decoded === "object" && decoded !== null && typeof decoded.sub === "string") {
            return { sub: decoded.sub };
        }
        return null;
    } catch {
        return null;
    }
};

// GET /api/download/:slug
export const downloadProductFile = async (request: Request, response: Response) => {
    const rawSlug = request.params.slug;
    const slug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug ?? "").trim();
    if (!slug) {
        response.status(400).json({ message: "Invalid product slug." });
        return;
    }
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
    const userUuid = tokenPayload.sub;

    const extractPurchasedSlugsFromBill = (rawCarts: unknown): string[] => {
        try {
            const parsed = typeof rawCarts === "string" ? JSON.parse(rawCarts) : rawCarts;

            // Legacy shape: carts is already an array of cart items.
            if (Array.isArray(parsed)) {
                return parsed
                    .map((item) => {
                        if (!item || typeof item !== "object") return "";
                        const row = item as Record<string, unknown>;
                        const slugValue = row.slug;
                        const itemIdValue = row.item_id;
                        if (typeof slugValue === "string" && slugValue.trim()) return slugValue;
                        if (typeof itemIdValue === "string" && itemIdValue.trim()) return itemIdValue;
                        return "";
                    })
                    .filter((value): value is string => typeof value === "string" && value.length > 0);
            }

            // Current shape: carts stores Cashfree cart_details with cart_items.
            if (parsed && typeof parsed === "object") {
                const root = parsed as Record<string, unknown>;
                const cartItems = Array.isArray(root.cart_items) ? root.cart_items : [];
                return cartItems
                    .map((item) => {
                        if (!item || typeof item !== "object") return "";
                        const row = item as Record<string, unknown>;
                        const itemIdValue = row.item_id;
                        const slugValue = row.slug;
                        if (typeof itemIdValue === "string" && itemIdValue.trim()) return itemIdValue;
                        if (typeof slugValue === "string" && slugValue.trim()) return slugValue;
                        return "";
                    })
                    .filter((value): value is string => typeof value === "string" && value.length > 0);
            }
        } catch {
            return [];
        }

        return [];
    };

    // 1. Check bills table for a successful purchase of this product by this user
    const [bills] = await db.query<any[]>(
        `SELECT orderid, txnid, carts, data FROM bills WHERE uid = ? AND status = 'success'`,
        [userUuid]
    );
    let foundInBills = false;
    let matchedBill: { orderid: string; txnid: string | null; data: unknown } | null = null;
    for (const bill of bills) {
        const purchasedSlugs = extractPurchasedSlugsFromBill(bill.carts);
        if (purchasedSlugs.includes(slug)) {
            foundInBills = true;
            matchedBill = bill;
            break;
        }
    }

    // 2. Check users table order_history for this product
    const [users] = await db.query<any[]>(
        `SELECT order_history FROM users WHERE uuid = ? LIMIT 1`,
        [userUuid]
    );
    let foundInOrderHistory = false;
    if (users.length > 0) {
        let orderHistory = [];
        try {
            orderHistory = typeof users[0].order_history === "string" ? JSON.parse(users[0].order_history) : users[0].order_history;
        } catch { }
        if (Array.isArray(orderHistory) && orderHistory.some((item) => item.slug === slug)) {
            foundInOrderHistory = true;
        }
    }

    if (!foundInBills && !foundInOrderHistory) {
        response.status(403).json({ message: "You have not purchased this product." });
        return;
    }

    // 3. Get product file path from products table
    const [products] = await db.query<any[]>(
        `SELECT product_file FROM products WHERE slug = ? AND is_active = 1 LIMIT 1`,
        [slug]
    );
    if (!products.length || !products[0].product_file) {
        response.status(404).json({ message: "Project file not found. Please contact customer support." });
        return;
    }
    const filePath = products[0].product_file;
    // Only allow files inside /public/projects
    const safeBase = path.resolve(process.cwd(), "public/projects");
    const resolvedPath = path.resolve(process.cwd(), filePath.replace(/^\/+/, ""));
    if (!resolvedPath.startsWith(safeBase)) {
        response.status(403).json({ message: "Invalid file path." });
        return;
    }
    if (!fs.existsSync(resolvedPath)) {
        response.status(404).json({ message: "File not found on server." });
        return;
    }
    response.setHeader("Content-Disposition", `attachment; filename="${path.basename(resolvedPath)}"`);
    response.setHeader("Content-Type", "application/zip");
    const stream = fs.createReadStream(resolvedPath);
    stream.pipe(response);

    // Log download event (non-fatal, fire-and-forget)
    const [dlUserRows] = await db.query<any[]>(
        `SELECT email FROM users WHERE uuid = ? LIMIT 1`,
        [userUuid]
    );
    const userEmail = dlUserRows[0]?.email ?? "";
    const slugStr = String(slug);

    // Extract invoice id from bill data JSON
    const extractInvoiceIdLocal = (data: unknown): string => {
        try {
            const d: Record<string, unknown> = typeof data === "string"
                ? JSON.parse(data) as Record<string, unknown>
                : (data as Record<string, unknown>) ?? {};
            const dataObj = d?.data as Record<string, unknown> | undefined;
            const orderObj = dataObj?.order as Record<string, unknown> | undefined;
            const orderTags = orderObj?.order_tags as Record<string, unknown> | undefined;
            const inv = orderTags?.INVOICE;
            if (typeof inv === "string" && inv) return inv;
            const payload = d?.payload as Record<string, unknown> | undefined;
            const payment = payload?.payment as Record<string, unknown> | undefined;
            const entity = payment?.entity as Record<string, unknown> | undefined;
            const notes = entity?.notes as Record<string, unknown> | undefined;
            const invoiceId = notes?.invoice_id;
            return typeof invoiceId === "string" ? invoiceId : "";
        } catch {
            return "";
        }
    };

    const downloadOrderId = matchedBill?.orderid ?? undefined;
    const downloadTxnId = matchedBill?.txnid ?? undefined;
    const downloadInvoiceId = matchedBill ? (extractInvoiceIdLocal(matchedBill.data) || undefined) : undefined;

    logDeliveryEvent({
        request,
        userUuid,
        userEmail,
        eventType: "download",
        orderId: downloadOrderId,
        invoiceId: downloadInvoiceId,
        transactionId: downloadTxnId,
        items: [{ slug: slugStr, title: slugStr, quantity: 1 }],
    }).catch((err) => console.error("[delivery-log] download log failed:", err));
};
import type { Request, Response } from "express";
import { db } from "../config/db.js";
import type { ProductRecord, ProductResponse } from "../types/product.js";

const parseJsonArray = (value: string[] | string): string[] => {
    if (Array.isArray(value)) {
        return value;
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const mapProduct = (product: ProductRecord): ProductResponse => ({
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    tag: product.tag,
    price: product.price_label,
    image: product.image,
    overview: product.overview,
    shortNote: product.short_note,
    fullDescription: product.full_description,
    screenshots: parseJsonArray(product.screenshots),
    features: parseJsonArray(product.features),
    cartLimit: product.cart_limit,
});

export const getProducts = async (_request: Request, response: Response) => {
    const [rows] = await db.query<ProductRecord[]>(
        `SELECT id, slug, title, description, tag, price_label, image, overview, short_note, full_description, screenshots, features, cart_limit
     FROM products
     WHERE is_active = 1
     ORDER BY sort_order ASC, id DESC`
    );

    response.json({ products: rows.map(mapProduct) });
};

export const getProductBySlug = async (request: Request, response: Response) => {
    const { slug } = request.params;
    const [rows] = await db.query<ProductRecord[]>(
        `SELECT id, slug, title, description, tag, price_label, image, overview, short_note, full_description, screenshots, features, cart_limit
     FROM products
     WHERE slug = ? AND is_active = 1
     LIMIT 1`,
        [slug]
    );

    const product = rows[0];

    if (!product) {
        response.status(404).json({ message: "Product not found." });
        return;
    }

    response.json({ product: mapProduct(product) });
};