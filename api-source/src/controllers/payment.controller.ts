import type { Request, Response } from "express";
import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { z } from "zod";
import { db } from "../config/db.js";
import { env } from "../config/env.js";

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

type StoredCartItem = {
    slug: string;
    title: string;
    quantity: number;
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

type UserOrderHistoryRow = RowDataPacket & {
    order_history: unknown;
};

const hashAccessToken = (token: string) => createHash("sha256").update(token).digest("hex");

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

const isAccessTokenActive = async (params: { token: string; userUuid: string }) => {
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

            const unitPrice = parsePriceLabel(product.price_label);

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


        const orderAmount = Number(
            cartItems
                .reduce((total, item) => total + item.item_discounted_unit_price * item.item_quantity, 0)
                .toFixed(2)
        );

        // Generate unique invoice id: INV-YYYYMMDDnnn (nnn = last 3 digits of ms timestamp)
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const d = String(today.getDate()).padStart(2, "0");
        const ms = String(Date.now() % 1000).padStart(3, "0");
        const invoiceId = `INV-${y}${m}${d}${ms}`;

        if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
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
            order_amount: orderAmount,
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
            `INSERT INTO bills (orderid, txnid, uid, carts, billing_address, data, status)
             VALUES (?, NULL, ?, CAST(? AS JSON), ?, CAST(? AS JSON), 'pending')
             ON DUPLICATE KEY UPDATE
                uid = VALUES(uid),
                carts = VALUES(carts),
                billing_address = VALUES(billing_address),
                data = VALUES(data),
                status = 'pending',
                updated_at = CURRENT_TIMESTAMP`,
            [
                finalOrderId,
                user.uuid,
                JSON.stringify(payload.cart_details),
                billingAddressRaw,
                JSON.stringify(billSeedData),
            ]
        );

        response.status(201).json({
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

        await connection.beginTransaction();
        transactionStarted = true;

        const [result] = await connection.query<ResultSetHeader>(
            `UPDATE bills
             SET txnid = COALESCE(?, txnid),
                 data = CAST(? AS JSON),
                 status = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE orderid = ?`,
            [txnId, JSON.stringify(request.body ?? {}), status, orderId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            transactionStarted = false;
            response.status(404).json({ message: "Bill record not found for this order id." });
            return;
        }

        if (status === "success") {
            const [billRows] = await connection.query<BillRow[]>(
                `SELECT uid, carts
                 FROM bills
                 WHERE orderid = ?
                 LIMIT 1`,
                [orderId]
            );

            const bill = billRows[0];

            if (bill) {
                const purchasedSlugs = parseBillCartSlugs(bill.carts);

                if (purchasedSlugs.length > 0) {
                    const [userRows] = await connection.query<UserOrderHistoryRow[]>(
                        `SELECT order_history
                         FROM users
                         WHERE uuid = ?
                         LIMIT 1`,
                        [bill.uid]
                    );

                    const existingHistory = parseOrderHistory(userRows[0]?.order_history);
                    const purchasedAt = new Date().toISOString();
                    const nextHistory = mergeOrderHistory(existingHistory, purchasedSlugs, purchasedAt);

                    await connection.query(
                        `UPDATE users
                         SET order_history = CAST(? AS JSON),
                             updated_at = CURRENT_TIMESTAMP
                         WHERE uuid = ?`,
                        [JSON.stringify(nextHistory), bill.uid]
                    );
                }
            }
        }

        await connection.commit();
        transactionStarted = false;

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
};
