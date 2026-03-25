import type { Product } from "@/data/products";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

type RequestOptions = RequestInit & {
    body?: string;
    requiresAuth?: boolean;
};

export class ApiRequestError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const headers = new Headers(options.headers ?? {});
    const token = localStorage.getItem("auth_token");

    if (options.requiresAuth && token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
        ...options,
        headers,
    });
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

export interface AuthUserResponse {
    id: string;
    name: string;
    email: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponse {
    message: string;
    token: string;
    user: AuthUserResponse;
}

export interface SignupStartPayload {
    name: string;
    email: string;
    password: string;
}

export interface SignupStartResponse {
    message: string;
    requiresEmailVerification: boolean;
    email: string;
}

export interface SignupVerifyLinkPayload {
    token: string;
}

export interface SignupVerifyLinkResponse {
    message: string;
    token: string;
    user: AuthUserResponse;
}

export interface ForgotPasswordStartPayload {
    email: string;
}

export interface ForgotPasswordStartResponse {
    message: string;
}

export interface ForgotPasswordVerifyPayload {
    token: string;
    newPassword: string;
}

export interface ForgotPasswordVerifyResponse {
    message: string;
}

export interface CurrentUserResponse {
    user: AuthUserResponse;
}

export interface LogoutResponse {
    message: string;
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

export const loginUser = (payload: LoginPayload) =>
    request<LoginResponse>("/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

export const startSignup = (payload: SignupStartPayload) =>
    request<SignupStartResponse>("/auth/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

export const verifySignupLink = (payload: SignupVerifyLinkPayload) =>
    request<SignupVerifyLinkResponse>("/auth/signup/verify-link", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

export const startForgotPassword = (payload: ForgotPasswordStartPayload) =>
    request<ForgotPasswordStartResponse>("/auth/forgot-password/start", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

export const verifyForgotPassword = (payload: ForgotPasswordVerifyPayload) =>
    request<ForgotPasswordVerifyResponse>("/auth/forgot-password/reset", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

export const getCurrentUser = () =>
    request<CurrentUserResponse>("/auth/me", {
        method: "GET",
        requiresAuth: true,
    });

export const logoutUser = () =>
    request<LogoutResponse>("/auth/logout", {
        method: "POST",
        requiresAuth: true,
    });
