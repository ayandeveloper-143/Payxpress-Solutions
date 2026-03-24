import type { Product } from "@/data/products";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

type RequestOptions = RequestInit & {
    body?: string;
};

export class ApiRequestError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const response = await fetch(`${apiBaseUrl}${path}`, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = typeof data.message === "string" ? data.message : "Request failed.";
        throw new ApiRequestError(message, response.status);
    }

    return data as T;
};

export interface ProductsResponse {
    products: Product[];
}

export interface ProductResponse {
    product: Product;
}

export interface ContactPayload {
    name: string;
    email: string;
    subject?: string;
    message: string;
}

export interface ContactResponse {
    message: string;
    enquiryId: number;
}

export interface CreateCashfreeSessionPayload {
    orderId: string;
    orderAmount: number;
    orderCurrency: string;
    customerId: string;
    customerName?: string;
    customerEmail: string;
    customerPhone: string;
    orderNote?: string;
}

export interface CreateCashfreeSessionResponse {
    message: string;
    orderId: string;
    paymentSessionId: string;
}

export const fetchProducts = () => request<ProductsResponse>("/products");

export const fetchProductBySlug = (slug: string) =>
    request<ProductResponse>(`/products/${encodeURIComponent(slug)}`);

export const submitContact = (payload: ContactPayload) =>
    request<ContactResponse>("/contact", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

export const createCashfreeSession = (payload: CreateCashfreeSessionPayload) =>
    request<CreateCashfreeSessionResponse>("/payments/cashfree/session", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
