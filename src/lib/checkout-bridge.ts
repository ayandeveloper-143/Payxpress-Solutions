import type { CreateOrderCashfreeResponse, CreateOrderRazorpayResponse, CreateOrderResponse } from "@/lib/api";

export const CHECKOUT_BRIDGE_ROUTE = "/k";

const CHECKOUT_BRIDGE_STORAGE_KEY = "checkout_bridge_create_order";

interface CheckoutBridgeEncodedPayload {
    token?: unknown;
    createorder?: unknown;
    createOrder?: unknown;
}

export interface CheckoutBridgePayload {
    token: string;
    createOrder: CreateOrderResponse;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

const isCashfreeOrderResponse = (value: unknown): value is CreateOrderCashfreeResponse => {
    if (!isRecord(value) || value.gateway !== "cashfree") {
        return false;
    }

    return (
        typeof value.message === "string"
        && typeof value.orderId === "string"
        && (value.cashfreeMode === "sandbox" || value.cashfreeMode === "production")
        && typeof value.paymentSessionId === "string"
    );
};

const isRazorpayOrderResponse = (value: unknown): value is CreateOrderRazorpayResponse => {
    if (!isRecord(value) || value.gateway !== "razorpay" || !isRecord(value.prefill)) {
        return false;
    }

    return (
        typeof value.message === "string"
        && typeof value.orderId === "string"
        && typeof value.amount === "number"
        && typeof value.currency === "string"
        && typeof value.keyId === "string"
        && typeof value.prefill.name === "string"
        && typeof value.prefill.email === "string"
        && typeof value.prefill.contact === "string"
    );
};

const normalizeCreateOrderResponse = (value: unknown): CreateOrderResponse | null => {
    if (isCashfreeOrderResponse(value) || isRazorpayOrderResponse(value)) {
        return value;
    }

    return null;
};

export const buildCheckoutBridgeUrl = (payload: CheckoutBridgePayload) => {
    const encoded = encodeURIComponent(JSON.stringify({
        token: payload.token,
        createorder: payload.createOrder,
    }));

    return `${CHECKOUT_BRIDGE_ROUTE}?data=${encoded}`;
};

export const parseCheckoutBridgeData = (encodedData: string): CheckoutBridgePayload | null => {
    try {
        const decoded = decodeURIComponent(encodedData);
        const parsed = JSON.parse(decoded) as CheckoutBridgeEncodedPayload;
        const token = typeof parsed.token === "string" ? parsed.token.trim() : "";
        const createOrder = normalizeCreateOrderResponse(parsed.createorder ?? parsed.createOrder);

        if (!token || !createOrder) {
            return null;
        }

        return {
            token,
            createOrder,
        };
    } catch {
        return null;
    }
};

export const storeCheckoutBridgeData = (payload: CheckoutBridgePayload) => {
    localStorage.setItem("auth_token", payload.token);
    localStorage.setItem(CHECKOUT_BRIDGE_STORAGE_KEY, JSON.stringify(payload.createOrder));
};

export const getStoredCreateOrderResponse = (): CreateOrderResponse | null => {
    try {
        const raw = localStorage.getItem(CHECKOUT_BRIDGE_STORAGE_KEY);

        if (!raw) {
            return null;
        }

        return normalizeCreateOrderResponse(JSON.parse(raw));
    } catch {
        return null;
    }
};

export const clearStoredCreateOrderResponse = () => {
    localStorage.removeItem(CHECKOUT_BRIDGE_STORAGE_KEY);
};

export const consumeStoredCreateOrderResponse = (): CreateOrderResponse | null => {
    const order = getStoredCreateOrderResponse();
    clearStoredCreateOrderResponse();
    return order;
};