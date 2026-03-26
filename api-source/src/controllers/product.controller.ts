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