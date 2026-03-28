// Calculate GST/gateway fee breakdown for a cart
export const cartBreakdown = async (request: Request, response: Response) => {
    try {
        const parsed = cartSchema.safeParse(request.body);
        if (!parsed.success) {
            response.status(400).json({
                message: "Invalid cart payload.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }
        const cart = parsed.data.cart;
        // Calculate subtotal (displayed as base price if included)
        const subtotal = Number(
            cart.reduce((total, item) => {
                const price = parseFloat(item.price.replace("₹", "").replace(",", ""));
                return total + price * item.quantity;
            }, 0).toFixed(2)
        );
        const gstPercent = env.gstPercent;
        const gatewayFeePercent = env.gatewayFeePercent;
        const gstType = env.gstType;

        let basePrice = subtotal;
        let gstAmount = 0, cgstAmount = 0, sgstAmount = 0, gatewayFee = 0, total = 0;

        if (gstType === "included") {
            // Calculate base price (without GST)
            basePrice = Number((subtotal / (1 + gstPercent / 100)).toFixed(2));
            gstAmount = Number((subtotal - basePrice).toFixed(2));
            cgstAmount = Number((gstAmount / 2).toFixed(2));
            sgstAmount = Number((gstAmount / 2).toFixed(2));
            gatewayFee = Number(((subtotal * gatewayFeePercent) / 100).toFixed(2));
            total = subtotal;
        } else {
            basePrice = subtotal;
            gstAmount = Number(((subtotal * gstPercent) / 100).toFixed(2));
            cgstAmount = Number((gstAmount / 2).toFixed(2));
            sgstAmount = Number((gstAmount / 2).toFixed(2));
            gatewayFee = Number((((subtotal + gstAmount) * gatewayFeePercent) / 100).toFixed(2));
            total = subtotal + gstAmount + gatewayFee;
        }

        // Return only the included model breakdown for UI clarity
        if (gstType === "included") {
            // Accounting breakdown
            // total = price (includes GST + gateway fee)
            // gstAmount = total * gstPercent / (100 + gstPercent)
            // netAfterGST = total - gstAmount
            // gatewayFee = total * gatewayFeePercent / 100
            // netAfterGateway = netAfterGST - gatewayFee
            // cgst/sgst = gstAmount / 2
            const netAfterGST = Number((total - gstAmount).toFixed(2));
            const netAfterGateway = Number((netAfterGST - gatewayFee).toFixed(2));
            const cgst = Number((gstAmount / 2).toFixed(2));
            const sgst = Number((gstAmount / 2).toFixed(2));
            response.status(200).json({
                type: "included",
                label: "Price (incl. GST & fees)",
                price: total,
                gstPercent,
                gstIncluded: gstAmount,
                gatewayFeePercent,
                gatewayFee,
                netAfterGST,
                netAfterGateway,
                total,
                breakdown: {
                    total,
                    gstIncluded: gstAmount,
                    cgst,
                    sgst,
                    gatewayFee,
                    netRevenue: netAfterGateway
                },
                message: "All taxes and charges included."
            });
        } else {
            // Fallback: return the extra model if ever needed
            response.status(200).json({
                type: "extra",
                basePrice,
                subtotal,
                gstPercent,
                gstAmount,
                cgstAmount,
                sgstAmount,
                gatewayFeePercent,
                gatewayFee,
                total,
                message: "Taxes and charges are added on top."
            });
        }
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Failed to calculate cart breakdown." });
    }
};
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { db } from "../config/db.js";
import { env } from "../config/env.js";

type AccessTokenPayload = {
    sub: string;
    email: string;
    name: string;
};

const cartItemSchema = z.object({
    slug: z.string().trim().min(1).max(255),
    title: z.string().trim().min(1).max(255),
    price: z.string().trim().min(1).max(64),
    image: z.string().trim().min(1).max(1024),
    quantity: z.number().int().min(1).max(999),
    cartLimit: z.number().int().min(1).max(999).optional(),
});

const cartSchema = z.object({
    cart: z.array(cartItemSchema).max(200),
});

type UserCartRow = {
    uuid: string;
    is_verified: number;
    cart_items_json: unknown;
};

type ProductLimitRow = RowDataPacket & {
    slug: string;
    cart_limit: number;
};

const getBearerToken = (request: Request) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
};

const verifyAccessToken = (token: string): AccessTokenPayload | null => {
    try {
        const decoded = jwt.verify(token, env.jwtAccessSecret);

        if (typeof decoded !== "object" || decoded === null) {
            return null;
        }

        if (typeof decoded.sub !== "string") {
            return null;
        }

        if (typeof decoded.email !== "string" || typeof decoded.name !== "string") {
            return null;
        }

        return {
            sub: decoded.sub,
            email: decoded.email,
            name: decoded.name,
        };
    } catch {
        return null;
    }
};

const getAuthorizedUserRow = async (request: Request) => {
    const token = getBearerToken(request);

    if (!token) {
        return { error: "Missing access token.", status: 401 as const };
    }

    const tokenPayload = verifyAccessToken(token);

    if (!tokenPayload) {
        return { error: "Invalid or expired access token.", status: 401 as const };
    }

    const [rows] = await db.query(
        `SELECT uuid, is_verified, cart_items_json
         FROM users
         WHERE uuid = ?
         LIMIT 1`,
        [tokenPayload.sub]
    );

    const user = (rows as UserCartRow[])[0];

    if (!user || !user.is_verified) {
        return { error: "User no longer authorized.", status: 401 as const };
    }

    return { user };
};

const isAuthError = (
    result: Awaited<ReturnType<typeof getAuthorizedUserRow>>
): result is { error: string; status: 401 } => {
    return "error" in result;
};

const parseStoredCart = (raw: unknown) => {
    if (!raw) {
        return [];
    }

    try {
        let parsed: unknown;

        if (typeof raw === "string") {
            parsed = JSON.parse(raw);
        } else if (Buffer.isBuffer(raw)) {
            parsed = JSON.parse(raw.toString("utf8"));
        } else {
            parsed = raw;
        }

        // Accept both array payloads and object payloads for compatibility.
        const normalized =
            Array.isArray(parsed) ? { cart: parsed } : typeof parsed === "object" && parsed !== null ? parsed : { cart: [] };

        const validated = cartSchema.safeParse(normalized);
        return validated.success ? validated.data.cart : [];
    } catch {
        return [];
    }
};

const normalizeCartLimit = (value: number | null | undefined) => {
    if (!Number.isFinite(value) || value === undefined || value === null) {
        return 1;
    }

    return Math.min(Math.max(Math.trunc(value), 1), 999);
};

const attachCartLimits = async (cart: Array<z.infer<typeof cartItemSchema>>) => {
    if (cart.length === 0) {
        return [];
    }

    const slugs = [...new Set(cart.map((item) => item.slug))];
    const placeholders = slugs.map(() => "?").join(", ");
    const [rows] = await db.query<ProductLimitRow[]>(
        `SELECT slug, cart_limit
         FROM products
         WHERE slug IN (${placeholders}) AND is_active = 1`,
        slugs
    );

    const limitBySlug = new Map(rows.map((row) => [row.slug, normalizeCartLimit(row.cart_limit)]));

    return cart.reduce<Array<z.infer<typeof cartItemSchema>>>((result, item) => {
        const cartLimit = limitBySlug.get(item.slug);

        if (!cartLimit) {
            return result;
        }

        result.push({
            ...item,
            cartLimit,
            quantity: Math.min(item.quantity, cartLimit),
        });

        return result;
    }, []);
};

export const getCart = async (request: Request, response: Response) => {
    try {
        const result = await getAuthorizedUserRow(request);

        if (isAuthError(result)) {
            response.status(result.status).json({ message: result.error });
            return;
        }

        response.status(200).json({
            cart: await attachCartLimits(parseStoredCart(result.user.cart_items_json)),
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Failed to fetch cart." });
    }
};

export const saveCart = async (request: Request, response: Response) => {
    try {
        const authResult = await getAuthorizedUserRow(request);

        if (isAuthError(authResult)) {
            response.status(authResult.status).json({ message: authResult.error });
            return;
        }

        const parsed = cartSchema.safeParse(request.body);

        if (!parsed.success) {
            response.status(400).json({
                message: "Invalid cart payload.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const normalizedCart = await attachCartLimits(parsed.data.cart);

        await db.execute(
            `UPDATE users
             SET cart_items_json = ?, updated_at = NOW()
             WHERE uuid = ?`,
            [JSON.stringify(normalizedCart), authResult.user.uuid]
        );

        response.status(200).json({
            message: "Cart updated successfully.",
            cart: normalizedCart,
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Failed to save cart." });
    }
};
