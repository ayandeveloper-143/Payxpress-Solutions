import type { Request, Response } from "express";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { z } from "zod";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import { generateInvoiceHtml, numberToWords } from "../invoice/invoice-template.js";
import { logDeliveryEvent } from "../utils/delivery-log.js";

const createCashfreeSessionSchema = z.object({
    orderId: z.string().trim().min(3).max(50).optional(),
    customerName: z.string().trim().min(2).max(100),
    customerEmail: z.string().trim().email().max(255),
    customerPhone: z.string().trim().min(10).max(20),
    billingAddress: z.preprocess(
        (value) => {
            if (typeof value === "string" && value.trim().length === 0) {
                return undefined;
            }

            return value;
        },
        z
            .union([
                z.string().trim().min(5).max(500),
                z.object({
                    fullName: z.string().trim().min(2).max(100),
                    country: z.string().trim().min(2).max(80),
                    city: z.string().trim().min(2).max(100),
                    state: z.string().trim().min(2).max(100),
                    pincode: z.string().trim().min(3).max(20),
                    address1: z.string().trim().min(5).max(300),
                    address2: z.string().trim().max(300).optional(),
                }),
            ])
            .optional()
    ),
    orderNote: z.string().trim().max(200).optional(),
});

type AccessTokenPayload = {
    sub: string;
    email: string;
    name: string;
};

type UserCartRow = {
    uuid: string;
    name: string;
    email: string;
    is_verified: number;
    cart_items_json: unknown;
};

const CUSTOM_SUPPORT_SLUG = "custom-support";

type StoredCartItem = {
    slug: string;
    title: string;
    quantity: number;
    price?: string;
};

type ProductPriceRow = RowDataPacket & {
    slug: string;
    title: string;
    description: string;
    tag: string;
    image: string;
    price_label: string;
    cart_limit: number;
};

type CashfreeOrderResponse = {
    message?: string;
    order_id?: string;
    payment_session_id?: string;
};

type CashfreeOrderPaymentTransaction = {
    payment_status?: string;
};

type CashfreeOrderPaymentsResponse = {
    message?: string;
    data?: CashfreeOrderPaymentTransaction[];
    payments?: CashfreeOrderPaymentTransaction[];
};

type JsonRecord = Record<string, unknown>;

type OrderHistoryItem = {
    slug: string;
    purchasedAt: string;
};

type BillRow = RowDataPacket & {
    uid: string;
    carts: unknown;
};

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

type UserOrderHistoryRow = RowDataPacket & {
    order_history: unknown;
};

// ---------- Razorpay types ----------

type RazorpayOrderResponse = {
    id?: string;
    entity?: string;
    amount?: number;
    currency?: string;
    receipt?: string;
    status?: string;
    error?: string;
    description?: string;
};

type RazorpayPaymentDetails = {
    id?: string;
    order_id?: string;
    amount?: number;
    currency?: string;
    status?: string;
    method?: string;
    vpa?: string;
    bank?: string;
    wallet?: string;
    card_id?: string;
    card?: {
        network?: string;
        last4?: string;
        issuer?: string;
    };
    created_at?: number;
    description?: string;
    error_description?: string;
    acquirer_data?: {
        rrn?: string;
        auth_code?: string;
        [key: string]: string | undefined;
    };
    notes?: {
        invoice_id?: string;
        [key: string]: string | undefined;
    };
};

const createRazorpayOrderSchema = z.object({
    customerName: z.string().trim().min(2).max(100),
    customerEmail: z.string().trim().email().max(255),
    customerPhone: z.string().trim().min(10).max(20),
    billingAddress: z.preprocess(
        (value) => {
            if (typeof value === "string" && value.trim().length === 0) {
                return undefined;
            }
            return value;
        },
        z
            .union([
                z.string().trim().min(5).max(500),
                z.object({
                    fullName: z.string().trim().min(2).max(100),
                    country: z.string().trim().min(2).max(80),
                    city: z.string().trim().min(2).max(100),
                    state: z.string().trim().min(2).max(100),
                    pincode: z.string().trim().min(3).max(20),
                    address1: z.string().trim().min(5).max(300),
                    address2: z.string().trim().max(300).optional(),
                }),
            ])
            .optional()
    ),
    orderNote: z.string().trim().max(200).optional(),
});

const verifyRazorpayPaymentSchema = z.object({
    razorpayOrderId: z.string().trim().min(1).max(100),
    razorpayPaymentId: z.string().trim().min(1).max(100),
    razorpaySignature: z.string().trim().min(1).max(300),
});

const hashAccessToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const getBearerToken = (request: Request) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
};

export const verifyAccessToken = (token: string): AccessTokenPayload | null => {
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

export const isAccessTokenActive = async (params: { token: string; userUuid: string }) => {
    const [rows] = await db.query(
        `SELECT id
         FROM auth_sessions
         WHERE user_uuid = ?
           AND token_hash = ?
           AND revoked_at IS NULL
           AND expires_at > NOW()
         LIMIT 1`,
        [params.userUuid, hashAccessToken(params.token)]
    );

    return (rows as Array<{ id: number }>).length > 0;
};

const parseStoredCart = (raw: unknown): StoredCartItem[] => {
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

        const cartSource = Array.isArray(parsed)
            ? parsed
            : typeof parsed === "object" && parsed !== null && Array.isArray((parsed as { cart?: unknown }).cart)
                ? (parsed as { cart: unknown[] }).cart
                : [];

        return cartSource
            .map((item) => {
                if (typeof item !== "object" || item === null) {
                    return null;
                }

                const row = item as Partial<StoredCartItem>;

                if (
                    typeof row.slug !== "string" ||
                    row.slug.trim().length === 0 ||
                    typeof row.title !== "string" ||
                    row.title.trim().length === 0 ||
                    typeof row.quantity !== "number" ||
                    !Number.isFinite(row.quantity)
                ) {
                    return null;
                }

                return {
                    slug: row.slug,
                    title: row.title,
                    quantity: Math.min(Math.max(Math.trunc(row.quantity), 1), 999),
                    ...(typeof row.price === "string" && row.price.trim().length > 0
                        ? { price: row.price.trim() }
                        : {}),
                };
            })
            .filter((item): item is StoredCartItem => item !== null);
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

const parsePriceLabel = (value: string) => {
    const numeric = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

/**
 * Resolves the unit price for a cart item.
 * For most products the authoritative price comes from the products table.
 * Products with dynamic pricing (e.g. custom-support) store the computed price
 * directly in the cart item because their price_label is '₹0', so we fall back
 * to that stored value when the database price_label resolves to null.
 */
const resolveUnitPrice = (product: ProductPriceRow, cartItem: StoredCartItem): number | null => {
    const productUnitPrice = parsePriceLabel(product.price_label);
    if (productUnitPrice !== null) {
        return productUnitPrice;
    }
    if (cartItem.slug === CUSTOM_SUPPORT_SLUG && cartItem.price) {
        return parsePriceLabel(cartItem.price);
    }
    return null;
};

const toAbsoluteUrl = (value: string) => {
    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    return `${env.clientOrigin.replace(/\/$/, "")}/${value.replace(/^\//, "")}`;
};

const toBillingAddressObject = (params: {
    billingAddress: z.infer<typeof createCashfreeSessionSchema>["billingAddress"];
    fallbackName: string;
}) => {
    if (!params.billingAddress) {
        return undefined;
    }

    if (typeof params.billingAddress !== "string") {
        return {
            full_name: params.billingAddress.fullName,
            country: params.billingAddress.country,
            city: params.billingAddress.city,
            state: params.billingAddress.state,
            pincode: params.billingAddress.pincode,
            address_1: params.billingAddress.address1,
            address_2: params.billingAddress.address2 ?? "",
        };
    }

    return {
        full_name: params.fallbackName,
        country: "India",
        city: "NA",
        state: "NA",
        pincode: "NA",
        address_1: params.billingAddress,
        address_2: "",
    };
};

const toJsonRecord = (value: unknown): JsonRecord | null => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return null;
    }

    return value as JsonRecord;
};

const readString = (obj: JsonRecord | null, key: string) => {
    if (!obj) {
        return null;
    }

    const value = obj[key];
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
};

const normalizeBillStatus = (value: string | null): "pending" | "success" | "failed" | "unknown" => {
    if (!value) {
        return "unknown";
    }

    const normalized = value.trim().toUpperCase();

    if (normalized.includes("SUCCESS") || normalized === "PAID") {
        return "success";
    }

    if (normalized.includes("FAIL") || normalized.includes("DECLINED") || normalized.includes("CANCEL")) {
        return "failed";
    }

    if (normalized.includes("PENDING") || normalized.includes("NOT_ATTEMPTED") || normalized.includes("ACTIVE")) {
        return "pending";
    }

    return "unknown";
};

const extractWebhookBillUpdate = (payload: unknown) => {
    const root = toJsonRecord(payload);
    const rootData = toJsonRecord(root?.data);
    const rootOrder = toJsonRecord(root?.order);
    const rootPayment = toJsonRecord(root?.payment);
    const dataOrder = toJsonRecord(rootData?.order);
    const dataPayment = toJsonRecord(rootData?.payment);

    const orderId =
        readString(root, "order_id") ||
        readString(rootOrder, "order_id") ||
        readString(dataOrder, "order_id") ||
        readString(root, "orderId");

    const txnId =
        readString(root, "txnid") ||
        readString(root, "cf_payment_id") ||
        readString(rootPayment, "cf_payment_id") ||
        readString(dataPayment, "cf_payment_id") ||
        readString(rootPayment, "payment_id") ||
        readString(dataPayment, "payment_id") ||
        readString(rootPayment, "paymentId") ||
        readString(dataPayment, "paymentId");

    const statusRaw =
        readString(rootPayment, "payment_status") ||
        readString(dataPayment, "payment_status") ||
        readString(rootOrder, "order_status") ||
        readString(dataOrder, "order_status") ||
        readString(root, "payment_status") ||
        readString(root, "status") ||
        readString(root, "type");

    return {
        orderId,
        txnId,
        status: normalizeBillStatus(statusRaw),
    };
};

const parseOrderHistory = (raw: unknown): OrderHistoryItem[] => {
    if (!raw) {
        return [];
    }

    try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : Buffer.isBuffer(raw) ? JSON.parse(raw.toString("utf8")) : raw;

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .map((item) => {
                const row = toJsonRecord(item);
                const slug = readString(row, "slug");
                const purchasedAt = readString(row, "purchasedAt");

                if (!slug || !purchasedAt) {
                    return null;
                }

                return { slug, purchasedAt };
            })
            .filter((item): item is OrderHistoryItem => item !== null);
    } catch {
        return [];
    }
};

const parseBillCartSlugs = (raw: unknown) => {
    if (!raw) {
        return [] as string[];
    }

    try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : Buffer.isBuffer(raw) ? JSON.parse(raw.toString("utf8")) : raw;
        const root = toJsonRecord(parsed);
        const cartItems = Array.isArray(root?.cart_items) ? root.cart_items : [];

        return [...new Set(
            cartItems
                .map((item) => readString(toJsonRecord(item), "item_id") || readString(toJsonRecord(item), "slug"))
                .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
        )];
    } catch {
        return [] as string[];
    }
};

const mergeOrderHistory = (current: OrderHistoryItem[], purchasedSlugs: string[], purchasedAt: string) => {
    const historyBySlug = new Map(current.map((item) => [item.slug, item]));

    for (const slug of purchasedSlugs) {
        historyBySlug.set(slug, { slug, purchasedAt });
    }

    return [...historyBySlug.values()];
};

// ---------- Shared helpers ----------

/**
 * Authenticate the incoming request via Bearer JWT.
 * Returns the verified token payload and the raw token string on success,
 * or sends the appropriate error response and returns null.
 */
const authenticateRequest = async (request: Request, response: Response) => {
    const token = getBearerToken(request);
    if (!token) {
        response.status(401).json({ message: "Missing access token." });
        return null;
    }
    const tokenPayload = verifyAccessToken(token);
    if (!tokenPayload) {
        response.status(401).json({ message: "Invalid or expired access token." });
        return null;
    }
    const activeToken = await isAccessTokenActive({ token, userUuid: tokenPayload.sub });
    if (!activeToken) {
        response.status(401).json({ message: "Session expired or logged out." });
        return null;
    }
    return { token, tokenPayload };
};

type CartOrderDetails = {
    user: UserCartRow;
    cartItems: Array<{
        item_id: string;
        item_name: string;
        item_description: string;
        item_tags: string[];
        item_details_url: string;
        item_image_url: string;
        item_original_unit_price: number;
        item_discounted_unit_price: number;
        item_quantity: number;
        item_currency: string;
    }>;
    subtotal: number;
    gstAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    gatewayFee: number;
    total: number;
    gstPercent: number;
    gatewayFeePercent: number;
    gstType: string;
    breakdown: Record<string, unknown>;
    invoiceId: string;
};

/**
 * Build cart order details for a given user UUID.
 * Fetches the cart from DB, resolves product prices and calculates all totals.
 * Returns null and sends an appropriate error response on failure.
 */
const buildCartOrderDetails = async (
    userUuid: string,
    response: Response
): Promise<CartOrderDetails | null> => {
    const [userRows] = await db.query(
        `SELECT uuid, name, email, is_verified, cart_items_json FROM users WHERE uuid = ? LIMIT 1`,
        [userUuid]
    );
    const user = (userRows as UserCartRow[])[0];
    if (!user || !user.is_verified) {
        response.status(401).json({ message: "User no longer authorized." });
        return null;
    }

    const userCart = parseStoredCart(user.cart_items_json);
    if (userCart.length === 0) {
        response.status(400).json({ message: "Cart is empty." });
        return null;
    }

    const slugs = [...new Set(userCart.map((item) => item.slug))];
    const placeholders = slugs.map(() => "?").join(", ");
    const [productRows] = await db.query<ProductPriceRow[]>(
        `SELECT slug, title, description, tag, image, price_label, cart_limit FROM products WHERE slug IN (${placeholders}) AND is_active = 1`,
        slugs
    );
    const productBySlug = new Map(productRows.map((row) => [row.slug, row]));

    const cartItems = userCart.reduce<CartOrderDetails["cartItems"]>((result, cartItem) => {
        const product = productBySlug.get(cartItem.slug);
        if (!product) return result;

        const unitPrice = resolveUnitPrice(product, cartItem);
        if (!unitPrice) return result;

        const maxQuantity = normalizeCartLimit(product.cart_limit);
        const quantity = Math.min(cartItem.quantity, maxQuantity);

        result.push({
            item_id: product.slug,
            item_name: product.title,
            item_description: product.description,
            item_tags: product.tag.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0),
            item_details_url: `${env.clientOrigin.replace(/\/$/, "")}/products/${encodeURIComponent(product.slug)}`,
            item_image_url: toAbsoluteUrl(product.image),
            item_original_unit_price: unitPrice,
            item_discounted_unit_price: unitPrice,
            item_quantity: quantity,
            item_currency: "INR",
        });
        return result;
    }, []);

    if (cartItems.length === 0) {
        response.status(400).json({ message: "No active products found in cart for checkout." });
        return null;
    }

    const subtotal = Number(
        cartItems.reduce((total, item) => total + item.item_discounted_unit_price * item.item_quantity, 0).toFixed(2)
    );

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
        response.status(400).json({ message: "Invalid order amount from cart." });
        return null;
    }

    const gstPercent = env.gstPercent;
    const gatewayFeePercent = env.gatewayFeePercent;
    const gstType = env.gstType;

    let gstAmount = 0, cgstAmount = 0, sgstAmount = 0, gatewayFee = 0, total = 0;
    let netAfterGST = 0, netAfterGateway = 0;

    if (gstType === "included") {
        total = subtotal;
        gstAmount = Number((total - (total / (1 + gstPercent / 100))).toFixed(2));
        netAfterGST = Number((total - gstAmount).toFixed(2));
        gatewayFee = Number((total * gatewayFeePercent / 100).toFixed(2));
        netAfterGateway = Number((netAfterGST - gatewayFee).toFixed(2));
        cgstAmount = Number((gstAmount / 2).toFixed(2));
        sgstAmount = Number((gstAmount / 2).toFixed(2));
    } else {
        gstAmount = Number(((subtotal * gstPercent) / 100).toFixed(2));
        cgstAmount = Number((gstAmount / 2).toFixed(2));
        sgstAmount = Number((gstAmount / 2).toFixed(2));
        gatewayFee = Number((((subtotal + gstAmount) * gatewayFeePercent) / 100).toFixed(2));
        total = subtotal + gstAmount + gatewayFee;
        netAfterGST = subtotal;
        netAfterGateway = subtotal - gatewayFee;
    }

    let breakdown: Record<string, unknown>;
    if (gstType === "included") {
        breakdown = {
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
            breakdown: { total, gstIncluded: gstAmount, cgst: cgstAmount, sgst: sgstAmount, gatewayFee, netRevenue: netAfterGateway },
            message: "All taxes and charges included.",
        };
    } else {
        breakdown = {
            type: "extra",
            subtotal,
            gstPercent,
            gstAmount,
            cgstAmount,
            sgstAmount,
            gatewayFeePercent,
            gatewayFee,
            total,
            message: "Taxes and charges are added on top.",
        };
    }

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const ms = String(Date.now() % 1000).padStart(3, "0");
    const invoiceId = `INV-${y}${m}${d}${ms}`;

    return { user, cartItems, subtotal, gstAmount, cgstAmount, sgstAmount, gatewayFee, total, gstPercent, gatewayFeePercent, gstType, breakdown, invoiceId };
};

/**
 * Fetch Razorpay payment details from the Razorpay API.
 * Returns null on failure (non-fatal; invoice template will gracefully degrade).
 */
const fetchRazorpayPaymentDetails = async (paymentId: string): Promise<RazorpayPaymentDetails | null> => {
    try {
        const credentials = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64");
        const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
            headers: { Authorization: `Basic ${credentials}` },
        });
        if (!res.ok) return null;
        return (await res.json().catch(() => null)) as RazorpayPaymentDetails | null;
    } catch {
        return null;
    }
};

/**
 * Map a Razorpay payment details object into a Cashfree-compatible `payment_method` shape
 * so the shared invoice template works for both gateways.
 */
const mapRazorpayMethodToCashfreeFormat = (details: RazorpayPaymentDetails): Record<string, unknown> => {
    const method = details.method ?? "unknown";
    switch (method) {
        case "upi":
            return { upi: { upi_id: details.vpa ?? "" } };
        case "card":
            return { card: { card_network: details.card?.network ?? "", card_last4: details.card?.last4 ?? "" } };
        case "netbanking":
            return { netbanking: { bank_name: details.bank ?? "" } };
        case "wallet":
            return { wallet: { wallet_name: details.wallet ?? "" } };
        case "emi":
            return { emi: { bank_name: details.bank ?? "" } };
        case "paylater":
            return { paylater: { provider: details.description ?? "" } };
        default:
            return { [method]: {} };
    }
};

/**
 * Generate invoice PDF and send payment-success email for a completed order.
 * Mirrors the logic in cashfreeWebhook so both gateways produce invoices.
 */
const generateInvoiceAndSendEmail = async (billData: BillRecord): Promise<void> => {
    try {
        const path = await import("path");
        const { generatePdfFromHtml } = await import("../utils/pdf.js");

        let billJson: Record<string, unknown> = {};
        try {
            billJson = typeof billData.data === "string"
                ? JSON.parse(billData.data)
                : (toJsonRecord(billData.data) ?? {});
        } catch { /* continue with empty billJson */ }

        // Read invoice from nested order_tags (Cashfree / normalized Razorpay format)
        const orderObj = toJsonRecord((billJson?.data as Record<string, unknown>)?.order as unknown);
        const orderTagsObj = toJsonRecord(orderObj?.order_tags as unknown);
        let invoiceNoFinal = readString(orderTagsObj, "INVOICE") || billData.orderid || "";

        // Fallback: check Razorpay raw webhook payload format (payload.payment.entity.notes.invoice_id)
        if (!invoiceNoFinal) {
            const rawPayloadObj = toJsonRecord(billJson?.payload as unknown);
            const rawPaymentEntity = toJsonRecord(toJsonRecord(rawPayloadObj?.payment as unknown)?.entity as unknown);
            const rawNotes = toJsonRecord(rawPaymentEntity?.notes as unknown);
            invoiceNoFinal = readString(rawNotes, "invoice_id") || billData.orderid || "";
        }

        const cartRaw = billData.carts;
        const cart = typeof cartRaw === "string" ? JSON.parse(cartRaw) : cartRaw;
        const cartItems: Record<string, unknown>[] = Array.isArray((cart as Record<string, unknown>)?.cart_items)
            ? (cart as Record<string, unknown>).cart_items as Record<string, unknown>[]
            : [];

        const itemsHtml = cartItems.map((item) => {
            const itemTotal = (Number(item.item_discounted_unit_price) * Number(item.item_quantity))
                .toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        }).join("");

        const dataObj = toJsonRecord((billJson?.data as Record<string, unknown>));
        const paymentObj = toJsonRecord(dataObj?.payment as unknown);
        const customerObj = toJsonRecord(dataObj?.customer_details as unknown);

        // Fallback: extract customer and payment details from raw Razorpay webhook format
        const rawWebhookPayloadObj = toJsonRecord(billJson?.payload as unknown);
        const rawWebhookPaymentEntity = toJsonRecord(toJsonRecord(rawWebhookPayloadObj?.payment as unknown)?.entity as unknown);
        const rawWebhookNotesObj = toJsonRecord(rawWebhookPaymentEntity?.notes as unknown);

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

        const webhookCreatedAtUnix = rawWebhookPaymentEntity ? rawWebhookPaymentEntity.created_at : undefined;
        const paymentTimeRaw = readString(paymentObj, "payment_time")
            ?? (webhookCreatedAtUnix ? new Date(Number(webhookCreatedAtUnix) * 1000).toISOString() : null)
            ?? String(billData.created_at ?? new Date().toISOString());
        const paymentTimeStr = new Date(paymentTimeRaw).toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
        });
        const createdDateStr = new Date(String(billData.created_at ?? new Date().toISOString())).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
        });

        const paymentId = readString(paymentObj, "cf_payment_id") || readString(paymentObj, "payment_id") || readString(rawWebhookPaymentEntity, "id") || "";
        const bankRef = readString(paymentObj, "bank_reference") || "";
        const customerName = readString(customerObj, "customer_name") || readString(rawWebhookNotesObj, "customer_name") || "";
        const customerEmail = readString(customerObj, "customer_email") || readString(customerObj, "email") || readString(rawWebhookNotesObj, "customer_email") || "";
        const customerPhone = readString(customerObj, "customer_phone") || readString(customerObj, "phone") || readString(rawWebhookNotesObj, "customer_phone") || "";
        const billingAddress = billData.billing_address;
        const orderId = billData.orderid;
        const total = billData.total;
        const gstPercent = billData.gst_percent;
        const gstAmount = billData.gst_amount;
        const gatewayFee = billData.gateway_fee;

        const billPeriod = new Date(String(billData.created_at ?? new Date().toISOString()))
            .toLocaleDateString("en-IN", { month: "short", year: "numeric" })
            .replace(/\s+/, "-");
        const amountInWords = numberToWords(Number(total));

        const html = generateInvoiceHtml({
            invoiceNo: invoiceNoFinal,
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

        const invoiceLabel = invoiceNoFinal || orderId;
        const userId = billData.uid;
        const outputDir = path.resolve("public/bills", userId);
        const outputPath = path.join(outputDir, `${invoiceLabel}.pdf`);

        await generatePdfFromHtml(html, outputPath);

        try {
            const { sendPaymentSuccessEmail } = await import("../services/auth-mail.service.js");
            if (customerEmail) {
                await sendPaymentSuccessEmail({
                    to: customerEmail,
                    name: customerName || "Customer",
                    orderId,
                    invoiceId: invoiceLabel,
                    amount: Number(total),
                    paymentMethod,
                    paymentTime: paymentTimeStr,
                    pdfPath: outputPath,
                });
            }
        } catch (mailErr) {
            console.error("Payment success email failed:", mailErr);
        }
    } catch (pdfErr) {
        console.error("PDF generation failed:", pdfErr);
    }
};

export const createCashfreeSession = async (request: Request, response: Response) => {
    try {
        if (!env.paymentGatewayEnabled) {
            response.status(503).json({
                message: "Payment gateway is currently disabled.",
            });
            return;
        }

        const parsed = createCashfreeSessionSchema.safeParse(request.body);

        if (!parsed.success) {
            response.status(400).json({
                message: "Invalid payment request.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        if (!env.cashfreeAppId || !env.cashfreeSecretKey) {
            response.status(500).json({
                message: "Cashfree credentials are not configured on server.",
            });
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

        const activeToken = await isAccessTokenActive({ token, userUuid: tokenPayload.sub });

        if (!activeToken) {
            response.status(401).json({ message: "Session expired or logged out." });
            return;
        }

        const [userRows] = await db.query(
            `SELECT uuid, name, email, is_verified, cart_items_json
             FROM users
             WHERE uuid = ?
             LIMIT 1`,
            [tokenPayload.sub]
        );

        const user = (userRows as UserCartRow[])[0];

        if (!user || !user.is_verified) {
            response.status(401).json({ message: "User no longer authorized." });
            return;
        }

        const userCart = parseStoredCart(user.cart_items_json);

        if (userCart.length === 0) {
            response.status(400).json({ message: "Cart is empty." });
            return;
        }

        const slugs = [...new Set(userCart.map((item) => item.slug))];
        const placeholders = slugs.map(() => "?").join(", ");

        const [productRows] = await db.query<ProductPriceRow[]>(
            `SELECT slug, title, description, tag, image, price_label, cart_limit
             FROM products
             WHERE slug IN (${placeholders}) AND is_active = 1`,
            slugs
        );

        const productBySlug = new Map(productRows.map((row) => [row.slug, row]));

        const cartItems = userCart.reduce<
            Array<{
                item_id: string;
                item_name: string;
                item_description: string;
                item_tags: string[];
                item_details_url: string;
                item_image_url: string;
                item_original_unit_price: number;
                item_discounted_unit_price: number;
                item_quantity: number;
                item_currency: string;
            }>
        >((result, cartItem) => {
            const product = productBySlug.get(cartItem.slug);

            if (!product) {
                return result;
            }

            const unitPrice = resolveUnitPrice(product, cartItem);

            if (!unitPrice) {
                return result;
            }

            const maxQuantity = normalizeCartLimit(product.cart_limit);
            const quantity = Math.min(cartItem.quantity, maxQuantity);

            result.push({
                item_id: product.slug,
                item_name: product.title,
                item_description: product.description,
                item_tags: product.tag
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag.length > 0),
                item_details_url: `${env.clientOrigin.replace(/\/$/, "")}/products/${encodeURIComponent(product.slug)}`,
                item_image_url: toAbsoluteUrl(product.image),
                item_original_unit_price: unitPrice,
                item_discounted_unit_price: unitPrice,
                item_quantity: quantity,
                item_currency: "INR",
            });

            return result;
        }, []);

        if (cartItems.length === 0) {
            response.status(400).json({
                message: "No active products found in cart for checkout.",
            });
            return;
        }



        // Calculate subtotal
        const subtotal = Number(
            cartItems
                .reduce((total, item) => total + item.item_discounted_unit_price * item.item_quantity, 0)
                .toFixed(2)
        );

        // GST and Gateway Fee Calculation
        const gstPercent = env.gstPercent;
        const gatewayFeePercent = env.gatewayFeePercent;
        const gstType = env.gstType;

        let gstAmount = 0, cgstAmount = 0, sgstAmount = 0, gatewayFee = 0, total = 0;
        let netAfterGST = 0, netAfterGateway = 0;

        if (gstType === "included") {
            // GST included in subtotal
            // Use same logic as cart.controller.ts for accounting clarity
            total = subtotal;
            gstAmount = Number((total - (total / (1 + gstPercent / 100))).toFixed(2));
            netAfterGST = Number((total - gstAmount).toFixed(2));
            gatewayFee = Number((total * gatewayFeePercent / 100).toFixed(2));
            netAfterGateway = Number((netAfterGST - gatewayFee).toFixed(2));
            cgstAmount = Number((gstAmount / 2).toFixed(2));
            sgstAmount = Number((gstAmount / 2).toFixed(2));
        } else {
            // GST extra on subtotal
            gstAmount = Number(((subtotal * gstPercent) / 100).toFixed(2));
            cgstAmount = Number((gstAmount / 2).toFixed(2));
            sgstAmount = Number((gstAmount / 2).toFixed(2));
            gatewayFee = Number((((subtotal + gstAmount) * gatewayFeePercent) / 100).toFixed(2));
            total = subtotal + gstAmount + gatewayFee;
        }

        // For frontend: provide included model breakdown (matches cart.controller.ts)
        let breakdown;
        if (gstType === "included") {
            breakdown = {
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
                    cgst: cgstAmount,
                    sgst: sgstAmount,
                    gatewayFee,
                    netRevenue: netAfterGateway
                },
                message: "All taxes and charges included."
            };
        } else {
            breakdown = {
                type: "extra",
                subtotal,
                gstPercent,
                gstAmount,
                cgstAmount,
                sgstAmount,
                gatewayFeePercent,
                gatewayFee,
                total,
                message: "Taxes and charges are added on top."
            };
        }

        // Generate unique invoice id: INV-YYYYMMDDnnn (nnn = last 3 digits of ms timestamp)
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const d = String(today.getDate()).padStart(2, "0");
        const ms = String(Date.now() % 1000).padStart(3, "0");
        const invoiceId = `INV-${y}${m}${d}${ms}`;

        if (!Number.isFinite(subtotal) || subtotal <= 0) {
            response.status(400).json({ message: "Invalid order amount from cart." });
            return;
        }

        const data = parsed.data;
        const orderId = data.orderId ?? `ORDER_${Date.now()}`;
        const baseUrl =
            env.cashfreeMode === "production"
                ? "https://api.cashfree.com"
                : "https://sandbox.cashfree.com";

        const customerBillingAddress = toBillingAddressObject({
            billingAddress: data.billingAddress,
            fallbackName: data.customerName || user.name,
        });

        const payload = {
            order_id: orderId,
            order_amount: subtotal,
            order_currency: "INR",
            order_note: data.orderNote,
            customer_details: {
                customer_id: user.uuid,
                customer_name: data.customerName || user.name,
                customer_email: data.customerEmail || user.email,
                customer_phone: data.customerPhone,
            },
            order_meta: {
                return_url: `${env.clientOrigin.replace(/\/$/, "")}/payment-success?order_id={order_id}`,
                notify_url: `${env.clientOrigin.replace(/\/$/, "")}/api/webhook`,
            },
            order_tags: {
                INVOICE: invoiceId,
            },
            cart_details: {
                cart_name: `${user.name} cart`,
                cart_items: cartItems,
                ...(customerBillingAddress ? { customer_billing_address: customerBillingAddress } : {}),
            },
        };

        const cashfreeResponse = await fetch(`${baseUrl}/pg/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": env.cashfreeAppId,
                "x-client-secret": env.cashfreeSecretKey,
                "x-api-version": env.cashfreeApiVersion,
            },
            body: JSON.stringify(payload),
        });

        const responseData = (await cashfreeResponse.json().catch(() => ({}))) as CashfreeOrderResponse;

        if (!cashfreeResponse.ok || !responseData.payment_session_id) {
            response.status(cashfreeResponse.status || 502).json({
                message:
                    typeof responseData.message === "string"
                        ? responseData.message
                        : "Unable to create Cashfree payment session.",
            });
            return;
        }

        const finalOrderId = responseData.order_id ?? orderId;
        const billSeedData = {
            event: "cashfree_session_created",
            cashfree_response: responseData,
        };

        // Save only the original address1 string (if present) in billing_address
        let billingAddressRaw = "";
        if (typeof data.billingAddress === "string") {
            billingAddressRaw = data.billingAddress;
        } else if (data.billingAddress && typeof data.billingAddress.address1 === "string") {
            billingAddressRaw = data.billingAddress.address1;
        }


        await db.query(
            `INSERT INTO bills (orderid, txnid, uid, carts, billing_address, data, status, gst_type, gst_percent, gst_amount, cgst_amount, sgst_amount, gateway_fee, total)
             VALUES (?, NULL, ?, CAST(? AS JSON), ?, CAST(? AS JSON), 'pending', ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                uid = VALUES(uid),
                carts = VALUES(carts),
                billing_address = VALUES(billing_address),
                data = VALUES(data),
                gst_type = VALUES(gst_type),
                gst_percent = VALUES(gst_percent),
                gst_amount = VALUES(gst_amount),
                cgst_amount = VALUES(cgst_amount),
                sgst_amount = VALUES(sgst_amount),
                gateway_fee = VALUES(gateway_fee),
                total = VALUES(total),
                status = 'pending',
                updated_at = CURRENT_TIMESTAMP`,
            [
                finalOrderId,
                user.uuid,
                JSON.stringify(payload.cart_details),
                billingAddressRaw,
                JSON.stringify(billSeedData),
                gstType,
                gstPercent,
                gstAmount,
                cgstAmount,
                sgstAmount,
                gatewayFee,
                total
            ]
        );

        response.status(201).json({
            breakdown,
            message: "Payment session created.",
            orderId: finalOrderId,
            paymentSessionId: responseData.payment_session_id,
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({
            message: "Unable to create payment session right now.",
        });
    }
};

export const getCashfreeOrderStatus = async (request: Request, response: Response) => {
    try {
        if (!env.paymentGatewayEnabled) {
            response.status(503).json({
                message: "Payment gateway is currently disabled.",
            });
            return;
        }

        if (!env.cashfreeAppId || !env.cashfreeSecretKey) {
            response.status(500).json({
                message: "Cashfree credentials are not configured on server.",
            });
            return;
        }

        const rawOrderId = request.params.orderId;
        const orderId = (Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId ?? "").trim();

        if (orderId.length < 3) {
            response.status(400).json({
                message: "Invalid order id.",
            });
            return;
        }

        const baseUrl =
            env.cashfreeMode === "production"
                ? "https://api.cashfree.com"
                : "https://sandbox.cashfree.com";

        const cashfreeResponse = await fetch(`${baseUrl}/pg/orders/${encodeURIComponent(orderId)}/payments`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": env.cashfreeAppId,
                "x-client-secret": env.cashfreeSecretKey,
                "x-api-version": env.cashfreeApiVersion,
            },
        });

        const responseData = (await cashfreeResponse
            .json()
            .catch(() => ({}))) as CashfreeOrderPaymentsResponse | CashfreeOrderPaymentTransaction[];

        if (!cashfreeResponse.ok) {
            response.status(cashfreeResponse.status || 502).json({
                message:
                    typeof (responseData as CashfreeOrderPaymentsResponse).message === "string"
                        ? (responseData as CashfreeOrderPaymentsResponse).message
                        : "Unable to fetch Cashfree order status.",
            });
            return;
        }

        let getOrderResponse: CashfreeOrderPaymentTransaction[] = [];

        if (Array.isArray(responseData)) {
            getOrderResponse = responseData;
        } else if (Array.isArray(responseData.data)) {
            getOrderResponse = responseData.data;
        } else if (Array.isArray(responseData.payments)) {
            getOrderResponse = responseData.payments;
        }

        let orderStatus: "Success" | "Pending" | "Failure";

        if (getOrderResponse.some((transaction) => transaction.payment_status === "SUCCESS")) {
            orderStatus = "Success";
        } else if (getOrderResponse.some((transaction) => transaction.payment_status === "PENDING")) {
            orderStatus = "Pending";
        } else {
            orderStatus = "Failure";
        }

        response.status(200).json({
            orderId,
            orderStatus,
            transactions: getOrderResponse,
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({
            message: "Unable to fetch order status right now.",
        });
    }
};

export const cashfreeWebhook = async (request: Request, response: Response) => {
    let connection: PoolConnection | null = null;
    let transactionStarted = false;
    try {
        connection = await db.getConnection();
        const { orderId, txnId, status } = extractWebhookBillUpdate(request.body);

        if (!orderId) {
            response.status(400).json({ message: "Missing order id in webhook payload." });
            return;
        }

        // Check for duplicate webhook (already success)
        const [existingBillRows] = await connection.query<BillRecord[]>(
            `SELECT * FROM bills WHERE orderid = ? LIMIT 1`,
            [orderId]
        );
        const existingBill = existingBillRows[0];
        const wasAlreadySuccess = existingBill && existingBill.status === "success";
        if (wasAlreadySuccess) {
            response.status(409).json({ message: "Duplicate webhook: bill already marked as success." });
            return;
        }

        await connection.beginTransaction();
        transactionStarted = true;

        const [result] = await connection.query<ResultSetHeader>(
            `UPDATE bills
             SET txnid = COALESCE(?, txnid),
                 data = CAST(? AS JSON),
                 status = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE orderid = ?
               AND status != 'success'`,
            [txnId, JSON.stringify(request.body ?? {}), status, orderId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            transactionStarted = false;
            return response.status(200).json({ message: "Already processed" });
        }

        // PDF generation and email will be done after commit
        let billForEmail: BillRecord | null = null;
        if (status === "success") {
            // Fetch all bill data for invoice (for after commit)
            const [billRows] = await connection.query<BillRecord[]>(
                `SELECT * FROM bills WHERE orderid = ? LIMIT 1`,
                [orderId]
            );
            billForEmail = billRows[0] ?? null;
        }

        await connection.commit();
        transactionStarted = false;

        // Now, after commit, send email if needed
        if (status === "success" && billForEmail) {
            // Update user order history as before
            const purchasedSlugs = parseBillCartSlugs(billForEmail.carts);
            if (purchasedSlugs.length > 0) {
                const [userRows] = await db.query<UserOrderHistoryRow[]>(
                    `SELECT order_history FROM users WHERE uuid = ? LIMIT 1`,
                    [billForEmail.uid]
                );
                const existingHistory = parseOrderHistory(userRows[0]?.order_history);
                const purchasedAt = new Date().toISOString();
                const nextHistory = mergeOrderHistory(existingHistory, purchasedSlugs, purchasedAt);
                await db.query(
                    `UPDATE users SET order_history = CAST(? AS JSON), updated_at = CURRENT_TIMESTAMP WHERE uuid = ?`,
                    [JSON.stringify(nextHistory), billForEmail.uid]
                );
            }

            await generateInvoiceAndSendEmail(billForEmail);

            // Log delivery event (non-fatal)
            const [dlUserRows] = await db.query<Array<RowDataPacket & { email: string }>>(
                `SELECT email FROM users WHERE uuid = ? LIMIT 1`,
                [billForEmail.uid]
            );
            const userEmail = dlUserRows[0]?.email ?? "";
            const deliveryItems = purchasedSlugs.map((s) => ({ slug: s, title: s, quantity: 1 }));
            await logDeliveryEvent({
                userUuid: billForEmail.uid,
                userEmail,
                eventType: "payment_success",
                orderId: billForEmail.orderid,
                invoiceId: undefined,
                items: deliveryItems,
            });
        }

        response.status(200).json({
            message: "Webhook received and bill updated.",
            orderId,
            status,
        });
    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback().catch(() => undefined);
        }
        console.error(error);
        response.status(500).json({ message: "Unable to process webhook right now." });
    } finally {
        connection?.release();
    }
}

// ============================================================
// Razorpay controllers
// ============================================================

export const createRazorpayOrder = async (request: Request, response: Response) => {
    try {
        if (!env.paymentGatewayEnabled) {
            response.status(503).json({ message: "Payment gateway is currently disabled." });
            return;
        }

        if (!env.razorpayKeyId || !env.razorpayKeySecret) {
            response.status(500).json({ message: "Razorpay credentials are not configured on server." });
            return;
        }

        const parsed = createRazorpayOrderSchema.safeParse(request.body);
        if (!parsed.success) {
            response.status(400).json({
                message: "Invalid payment request.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const auth = await authenticateRequest(request, response);
        if (!auth) return;

        const orderDetails = await buildCartOrderDetails(auth.tokenPayload.sub, response);
        if (!orderDetails) return;

        const { user, cartItems, total, gstAmount, cgstAmount, sgstAmount, gatewayFee, gstType, gstPercent, gatewayFeePercent, breakdown, invoiceId } = orderDetails;

        const data = parsed.data;
        const receipt = `RZP_${Date.now()}`.slice(0, 40);

        // Razorpay amount is in paise (smallest currency unit)
        const amountInPaise = Math.round(total * 100);

        const billingAddressRaw =
            typeof data.billingAddress === "string"
                ? data.billingAddress
                : data.billingAddress && typeof data.billingAddress.address1 === "string"
                    ? data.billingAddress.address1
                    : "";

        const rzpPayload = {
            amount: amountInPaise,
            currency: "INR",
            receipt,
            notes: {
                customer_name: data.customerName || user.name,
                customer_email: data.customerEmail || user.email,
                customer_phone: data.customerPhone,
                order_note: data.orderNote ?? "",
                invoice_id: invoiceId,
            },
        };

        const credentials = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64");
        const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${credentials}`,
            },
            body: JSON.stringify(rzpPayload),
        });

        const rzpData = (await rzpResponse.json().catch(() => ({}))) as RazorpayOrderResponse;

        if (!rzpResponse.ok || !rzpData.id) {
            response.status(rzpResponse.status || 502).json({
                message: typeof rzpData.description === "string"
                    ? rzpData.description
                    : "Unable to create Razorpay order.",
            });
            return;
        }

        const razorpayOrderId = rzpData.id;

        const seedData = {
            event: "razorpay_order_created",
            gateway: "razorpay",
            razorpay_order: rzpData,
            data: {
                customer_details: {
                    customer_name: data.customerName || user.name,
                    customer_email: data.customerEmail || user.email,
                    customer_phone: data.customerPhone,
                },
                order: {
                    order_id: razorpayOrderId,
                    order_tags: { INVOICE: invoiceId },
                },
            },
        };

        const cartDetailsForBill = {
            cart_name: `${user.name} cart`,
            cart_items: cartItems,
        };

        await db.query(
            `INSERT INTO bills (orderid, txnid, uid, carts, billing_address, data, status, gst_type, gst_percent, gst_amount, cgst_amount, sgst_amount, gateway_fee, total)
             VALUES (?, NULL, ?, CAST(? AS JSON), ?, CAST(? AS JSON), 'pending', ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                uid = VALUES(uid),
                carts = VALUES(carts),
                billing_address = VALUES(billing_address),
                data = VALUES(data),
                gst_type = VALUES(gst_type),
                gst_percent = VALUES(gst_percent),
                gst_amount = VALUES(gst_amount),
                cgst_amount = VALUES(cgst_amount),
                sgst_amount = VALUES(sgst_amount),
                gateway_fee = VALUES(gateway_fee),
                total = VALUES(total),
                status = 'pending',
                updated_at = CURRENT_TIMESTAMP`,
            [
                razorpayOrderId,
                user.uuid,
                JSON.stringify(cartDetailsForBill),
                billingAddressRaw,
                JSON.stringify(seedData),
                gstType,
                gstPercent,
                gstAmount,
                cgstAmount,
                sgstAmount,
                gatewayFee,
                total,
            ]
        );

        response.status(201).json({
            breakdown,
            message: "Razorpay order created.",
            orderId: razorpayOrderId,
            amount: amountInPaise,
            currency: "INR",
            keyId: env.razorpayKeyId,
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Unable to create Razorpay order right now." });
    }
};

export const verifyRazorpayPayment = async (request: Request, response: Response) => {
    let connection: PoolConnection | null = null;
    let transactionStarted = false;
    try {
        if (!env.paymentGatewayEnabled) {
            response.status(503).json({ message: "Payment gateway is currently disabled." });
            return;
        }

        if (!env.razorpayKeyId || !env.razorpayKeySecret) {
            response.status(500).json({ message: "Razorpay credentials are not configured on server." });
            return;
        }

        const parsed = verifyRazorpayPaymentSchema.safeParse(request.body);
        if (!parsed.success) {
            response.status(400).json({
                message: "Invalid verification request.",
                errors: parsed.error.flatten().fieldErrors,
            });
            return;
        }

        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

        // Verify HMAC-SHA256 signature: HMAC(orderId + "|" + paymentId, keySecret)
        const expectedSig = createHmac("sha256", env.razorpayKeySecret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        const expectedBuf = Buffer.from(expectedSig, "hex");
        const receivedBuf = Buffer.from(razorpaySignature, "hex");

        const signaturesMatch =
            expectedBuf.length === receivedBuf.length &&
            timingSafeEqual(expectedBuf, receivedBuf);

        if (!signaturesMatch) {
            response.status(400).json({ message: "Payment signature verification failed." });
            return;
        }

        const auth = await authenticateRequest(request, response);
        if (!auth) return;

        connection = await db.getConnection();

        // Check if bill exists and belongs to the authenticated user
        const [billRows] = await connection.query<BillRecord[]>(
            `SELECT * FROM bills WHERE orderid = ? LIMIT 1`,
            [razorpayOrderId]
        );
        const bill = billRows[0];

        if (!bill) {
            response.status(404).json({ message: "Order not found." });
            return;
        }

        if (bill.uid !== auth.tokenPayload.sub) {
            response.status(403).json({ message: "Order does not belong to this user." });
            return;
        }

        // If already success, return 200 (idempotent)
        if (bill.status === "success") {
            response.status(200).json({ message: "Payment already verified.", orderId: razorpayOrderId });
            return;
        }

        // Fetch payment details from Razorpay API for invoice generation
        const paymentDetails = await fetchRazorpayPaymentDetails(razorpayPaymentId);

        // Build data object for bills table, normalized for invoice template
        const paymentMethodObj = paymentDetails ? mapRazorpayMethodToCashfreeFormat(paymentDetails) : {};
        const paymentTime = paymentDetails?.created_at
            ? new Date(paymentDetails.created_at * 1000).toISOString()
            : new Date().toISOString();

        // Parse existing seed data for customer details
        let existingData: Record<string, unknown> = {};
        try {
            existingData = typeof bill.data === "string" ? JSON.parse(bill.data) : (bill.data ?? {});
        } catch { /* ignore */ }

        const existingCustomerDetails = toJsonRecord(
            toJsonRecord((existingData as Record<string, unknown>)?.data as unknown)?.customer_details as unknown
        );

        const updatedData = {
            ...(existingData as Record<string, unknown>),
            event: "razorpay_payment_verified",
            gateway: "razorpay",
            razorpay_payment_id: razorpayPaymentId,
            data: {
                customer_details: {
                    customer_name: readString(existingCustomerDetails, "customer_name") ?? "",
                    customer_email: readString(existingCustomerDetails, "customer_email") ?? "",
                    customer_phone: readString(existingCustomerDetails, "customer_phone") ?? "",
                },
                payment: {
                    cf_payment_id: razorpayPaymentId,
                    payment_id: razorpayPaymentId,
                    payment_status: "SUCCESS",
                    payment_time: paymentTime,
                    payment_method: paymentMethodObj,
                    bank_reference: paymentDetails?.acquirer_data?.rrn ?? "",
                },
                order: {
                    order_id: razorpayOrderId,
                    order_tags: toJsonRecord(
                        toJsonRecord(toJsonRecord((existingData as Record<string, unknown>)?.data as unknown)?.order as unknown)?.order_tags as unknown
                    ) ?? { INVOICE: paymentDetails?.notes?.invoice_id ?? "" },
                },
            },
        };

        await connection.beginTransaction();
        transactionStarted = true;

        const [updateResult] = await connection.query<ResultSetHeader>(
            `UPDATE bills
             SET txnid = ?,
                 data = CAST(? AS JSON),
                 status = 'success',
                 updated_at = CURRENT_TIMESTAMP
             WHERE orderid = ?
               AND status != 'success'`,
            [razorpayPaymentId, JSON.stringify(updatedData), razorpayOrderId]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            transactionStarted = false;
            // Race condition: webhook already set it to success
            response.status(200).json({ message: "Payment already verified.", orderId: razorpayOrderId });
            return;
        }

        await connection.commit();
        transactionStarted = false;

        // Update user order history
        const purchasedSlugs = parseBillCartSlugs(bill.carts);
        if (purchasedSlugs.length > 0) {
            const [userRows] = await db.query<UserOrderHistoryRow[]>(
                `SELECT order_history FROM users WHERE uuid = ? LIMIT 1`,
                [auth.tokenPayload.sub]
            );
            const existingHistory = parseOrderHistory(userRows[0]?.order_history);
            const purchasedAt = new Date().toISOString();
            const nextHistory = mergeOrderHistory(existingHistory, purchasedSlugs, purchasedAt);
            await db.query(
                `UPDATE users SET order_history = CAST(? AS JSON), updated_at = CURRENT_TIMESTAMP WHERE uuid = ?`,
                [JSON.stringify(nextHistory), auth.tokenPayload.sub]
            );
        }

        // Fetch updated bill for invoice generation
        const [updatedBillRows] = await db.query<BillRecord[]>(
            `SELECT * FROM bills WHERE orderid = ? LIMIT 1`,
            [razorpayOrderId]
        );
        const updatedBill = updatedBillRows[0];
        if (updatedBill) {
            await generateInvoiceAndSendEmail(updatedBill);
        }

        // Log delivery event (non-fatal)
        await logDeliveryEvent({
            request,
            userUuid: auth.tokenPayload.sub,
            userEmail: auth.tokenPayload.email,
            eventType: "payment_success",
            orderId: razorpayOrderId,
            items: purchasedSlugs.map((s) => ({ slug: s, title: s, quantity: 1 })),
        });

        response.status(200).json({ message: "Payment verified successfully.", orderId: razorpayOrderId });
    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback().catch(() => undefined);
        }
        console.error(error);
        response.status(500).json({ message: "Unable to verify payment right now." });
    } finally {
        connection?.release();
    }
};

export const getRazorpayOrderStatus = async (request: Request, response: Response) => {
    try {
        if (!env.paymentGatewayEnabled) {
            response.status(503).json({ message: "Payment gateway is currently disabled." });
            return;
        }

        const rawOrderId = request.params.orderId;
        const orderId = (Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId ?? "").trim();

        if (orderId.length < 3) {
            response.status(400).json({ message: "Invalid order id." });
            return;
        }

        const [billRows] = await db.query<BillRecord[]>(
            `SELECT status FROM bills WHERE orderid = ? LIMIT 1`,
            [orderId]
        );
        const bill = billRows[0];

        if (!bill) {
            response.status(404).json({ message: "Order not found." });
            return;
        }

        let orderStatus: "Success" | "Pending" | "Failure";
        if (bill.status === "success") {
            orderStatus = "Success";
        } else if (bill.status === "pending") {
            orderStatus = "Pending";
        } else {
            orderStatus = "Failure";
        }

        response.status(200).json({ orderId, orderStatus });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Unable to fetch order status right now." });
    }
};

/**
 * Handles Razorpay webhook events.
 * The route must be mounted with express.raw() so that request.body is the
 * raw Buffer needed for HMAC-SHA256 signature verification.
 */
export const razorpayWebhook = async (request: Request, response: Response) => {
    let connection: PoolConnection | null = null;
    let transactionStarted = false;
    try {
        // Validate webhook secret is configured
        if (!env.razorpayWebhookSecret) {
            console.error("Razorpay webhook secret not configured.");
            response.status(500).json({ message: "Webhook secret not configured." });
            return;
        }

        const signature = request.headers["x-razorpay-signature"];
        if (typeof signature !== "string" || !signature) {
            response.status(400).json({ message: "Missing webhook signature." });
            return;
        }

        // request.body is a Buffer when express.raw() middleware is used
        const rawBody: Buffer = Buffer.isBuffer(request.body)
            ? request.body
            : Buffer.from(JSON.stringify(request.body ?? {}));

        const expectedSig = createHmac("sha256", env.razorpayWebhookSecret)
            .update(rawBody)
            .digest("hex");

        const expectedBuf = Buffer.from(expectedSig, "hex");
        const receivedBuf = Buffer.from(signature, "hex");

        const signaturesMatch =
            expectedBuf.length === receivedBuf.length &&
            timingSafeEqual(expectedBuf, receivedBuf);

        if (!signaturesMatch) {
            response.status(400).json({ message: "Invalid webhook signature." });
            return;
        }

        let payload: Record<string, unknown>;
        try {
            payload = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
        } catch {
            response.status(400).json({ message: "Invalid webhook payload." });
            return;
        }

        const event = typeof payload.event === "string" ? payload.event : "";

        // Extract order_id and payment_id from Razorpay webhook payload
        const payloadObj = toJsonRecord(payload.payload as unknown);
        const paymentEntity = toJsonRecord(toJsonRecord(payloadObj?.payment as unknown)?.entity as unknown);
        const orderId = readString(paymentEntity, "order_id");
        const txnId = readString(paymentEntity, "id");
        const paymentStatusRaw = readString(paymentEntity, "status");

        if (!orderId) {
            response.status(400).json({ message: "Missing order_id in webhook payload." });
            return;
        }

        // Map Razorpay event/status to internal status
        let status: "success" | "failed" | "pending";
        if (event === "payment.captured" || paymentStatusRaw === "captured") {
            status = "success";
        } else if (event === "payment.failed" || paymentStatusRaw === "failed") {
            status = "failed";
        } else {
            // Acknowledge other events without processing
            response.status(200).json({ message: "Event acknowledged." });
            return;
        }

        connection = await db.getConnection();

        const [existingBillRows] = await connection.query<BillRecord[]>(
            `SELECT * FROM bills WHERE orderid = ? LIMIT 1`,
            [orderId]
        );
        const existingBill = existingBillRows[0];

        if (!existingBill) {
            response.status(404).json({ message: "Order not found." });
            return;
        }

        if (existingBill.status === "success") {
            // Already processed (verify endpoint handled it first)
            response.status(200).json({ message: "Already processed." });
            return;
        }

        // Parse existing seed data to preserve invoice ID and customer details
        let existingData: Record<string, unknown> = {};
        try {
            existingData = typeof existingBill.data === "string"
                ? JSON.parse(existingBill.data)
                : (toJsonRecord(existingBill.data) ?? {});
        } catch { /* continue with empty */ }

        const existingDataInner = toJsonRecord(existingData?.data as unknown);
        const existingCustomerDetails = toJsonRecord(existingDataInner?.customer_details as unknown);
        const existingOrderObj = toJsonRecord(existingDataInner?.order as unknown);
        const existingOrderTags = toJsonRecord(existingOrderObj?.order_tags as unknown);

        // Extract invoice ID: prefer existing seed data, fall back to webhook notes
        const notesObj = toJsonRecord(paymentEntity?.notes as unknown);
        const invoiceIdFromSeed = readString(existingOrderTags, "INVOICE") || "";
        const invoiceIdFromNotes = readString(notesObj, "invoice_id") || "";
        const resolvedInvoiceId = invoiceIdFromSeed || invoiceIdFromNotes;

        // Extract bank reference from webhook payload acquirer_data, fall back to fetched payment details
        const acquirerDataObj = toJsonRecord(paymentEntity?.acquirer_data as unknown);
        const bankReferenceFromWebhook = readString(acquirerDataObj, "rrn") || "";

        // Extract customer details: prefer existing seed data, fall back to webhook notes
        const customerName = readString(existingCustomerDetails, "customer_name") || readString(notesObj, "customer_name") || "";
        const customerEmail = readString(existingCustomerDetails, "customer_email") || readString(notesObj, "customer_email") || "";
        const customerPhone = readString(existingCustomerDetails, "customer_phone") || readString(notesObj, "customer_phone") || "";

        // Fetch payment method details from Razorpay API (non-fatal)
        const webhookPaymentDetails = txnId ? await fetchRazorpayPaymentDetails(txnId) : null;
        const paymentMethodObj = webhookPaymentDetails ? mapRazorpayMethodToCashfreeFormat(webhookPaymentDetails) : {};
        const paymentTime = webhookPaymentDetails?.created_at
            ? new Date(webhookPaymentDetails.created_at * 1000).toISOString()
            : new Date().toISOString();
        const bankReference = bankReferenceFromWebhook || webhookPaymentDetails?.acquirer_data?.rrn || "";

        // Build normalized data in Cashfree-compatible format so invoice generation
        // and bill history work correctly for both gateways.
        const normalizedWebhookData = {
            event: "razorpay_payment_captured",
            gateway: "razorpay",
            razorpay_payment_id: txnId,
            razorpay_webhook_payload: payload,
            data: {
                customer_details: {
                    customer_name: customerName,
                    customer_email: customerEmail,
                    customer_phone: customerPhone,
                },
                payment: {
                    cf_payment_id: txnId,
                    payment_id: txnId,
                    payment_status: "SUCCESS",
                    payment_time: paymentTime,
                    payment_method: paymentMethodObj,
                    bank_reference: bankReference,
                },
                order: {
                    order_id: orderId,
                    order_tags: { INVOICE: resolvedInvoiceId },
                },
            },
        };

        await connection.beginTransaction();
        transactionStarted = true;

        const [updateResult] = await connection.query<ResultSetHeader>(
            `UPDATE bills
             SET txnid = COALESCE(?, txnid),
                 data = CAST(? AS JSON),
                 status = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE orderid = ?
               AND status != 'success'`,
            [txnId, JSON.stringify(normalizedWebhookData), status, orderId]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            transactionStarted = false;
            response.status(200).json({ message: "Already processed." });
            return;
        }

        let billForEmail: BillRecord | null = null;
        if (status === "success") {
            const [billRows] = await connection.query<BillRecord[]>(
                `SELECT * FROM bills WHERE orderid = ? LIMIT 1`,
                [orderId]
            );
            billForEmail = billRows[0] ?? null;
        }

        await connection.commit();
        transactionStarted = false;

        if (status === "success" && billForEmail) {
            // Update user order history
            const purchasedSlugs = parseBillCartSlugs(billForEmail.carts);
            if (purchasedSlugs.length > 0) {
                const [userRows] = await db.query<UserOrderHistoryRow[]>(
                    `SELECT order_history FROM users WHERE uuid = ? LIMIT 1`,
                    [billForEmail.uid]
                );
                const existingHistory = parseOrderHistory(userRows[0]?.order_history);
                const purchasedAt = new Date().toISOString();
                const nextHistory = mergeOrderHistory(existingHistory, purchasedSlugs, purchasedAt);
                await db.query(
                    `UPDATE users SET order_history = CAST(? AS JSON), updated_at = CURRENT_TIMESTAMP WHERE uuid = ?`,
                    [JSON.stringify(nextHistory), billForEmail.uid]
                );
            }

            // Generate invoice and send email (webhook may arrive before verify in some edge cases)
            await generateInvoiceAndSendEmail(billForEmail);

            // Log delivery event (non-fatal)
            const [dlUserRows2] = await db.query<Array<RowDataPacket & { email: string }>>(
                `SELECT email FROM users WHERE uuid = ? LIMIT 1`,
                [billForEmail.uid]
            );
            const webhookUserEmail = dlUserRows2[0]?.email ?? "";
            const webhookItems = parseBillCartSlugs(billForEmail.carts).map((s) => ({ slug: s, title: s, quantity: 1 }));
            await logDeliveryEvent({
                userUuid: billForEmail.uid,
                userEmail: webhookUserEmail,
                eventType: "payment_success",
                orderId: billForEmail.orderid,
                items: webhookItems,
            });
        }

        response.status(200).json({ message: "Webhook processed.", orderId, status });
    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback().catch(() => undefined);
        }
        console.error(error);
        response.status(500).json({ message: "Unable to process webhook right now." });
    } finally {
        connection?.release();
    }
};