import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

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
    const { slug } = request.params;
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

    // 1. Check bills table for a successful purchase of this product by this user
    const [bills] = await db.query<any[]>(
        `SELECT carts, status FROM bills WHERE uid = ? AND status = 'success'`,
        [userUuid]
    );
    let foundInBills = false;
    for (const bill of bills) {
        let carts = [];
        try {
            carts = typeof bill.carts === "string" ? JSON.parse(bill.carts) : bill.carts;
        } catch { }
        if (Array.isArray(carts) && carts.some((item) => item.slug === slug)) {
            foundInBills = true;
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

    // 3. Get product file URL from products table
    const [products] = await db.query<any[]>(
        `SELECT product_file FROM products WHERE slug = ? AND is_active = 1 LIMIT 1`,
        [slug]
    );
    if (!products.length || !products[0].product_file) {
        response.status(404).json({ message: "Project file not found. Please contact customer support." });
        return;
    }
    response.json({ url: products[0].product_file });
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