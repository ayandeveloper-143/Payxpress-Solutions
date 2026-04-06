import type { Product } from "@/data/products";
import type { CartItem } from "@/types/cart";

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

type RequestOptions = RequestInit & {
    body?: string;
    requiresAuth?: boolean;
};

export class ApiRequestError extends Error {
    status: number;
    code?: string;
    field?: string;
    errors?: Record<string, string[]>;

    constructor(params: {
        message: string;
        status: number;
        code?: string;
        field?: string;
        errors?: Record<string, string[]>;
    }) {
        super(params.message);
        this.status = params.status;
        this.code = params.code;
        this.field = params.field;
        this.errors = params.errors;
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
        const code = typeof data.code === "string" ? data.code : undefined;
        const field = typeof data.field === "string" ? data.field : undefined;
        const errors =
            data.errors && typeof data.errors === "object"
                ? (data.errors as Record<string, string[]>)
                : undefined;

        throw new ApiRequestError({
            message,
            status: response.status,
            code,
            field,
            errors,
        });
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
    orderId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    billingAddress?: string;
    orderNote?: string;
}

export interface CreateCashfreeSessionResponse {
    message: string;
    orderId: string;
    paymentSessionId: string;
}

export interface CashfreeOrderStatusResponse {
    orderId: string;
    orderStatus: "Success" | "Pending" | "Failure";
    transactions: Array<{ payment_status?: string }>;
}

export interface AuthUserResponse {
    id: string;
    name: string;
    email: string;
    orderHistory: UserOrderHistoryItem[];
}

export interface UserOrderHistoryItem {
    slug: string;
    purchasedAt: string;
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

export interface CartResponse {
    cart: CartItem[];
}

export interface SaveCartPayload {
    cart: CartItem[];
}

export interface SaveCartResponse {
    message: string;
    cart: CartItem[];
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
        requiresAuth: true,
        body: JSON.stringify(payload),
    });

export const fetchCashfreeOrderStatus = (orderId: string) =>
    request<CashfreeOrderStatusResponse>(`/payments/cashfree/orders/${encodeURIComponent(orderId)}/status`, {
        method: "GET",
    });

// ---- Razorpay API types and functions ----

export interface CreateRazorpayOrderPayload {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    billingAddress?: string;
    orderNote?: string;
}

export interface CreateRazorpayOrderResponse {
    message: string;
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    breakdown?: Record<string, unknown>;
}

export interface VerifyRazorpayPaymentPayload {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}

export interface VerifyRazorpayPaymentResponse {
    message: string;
    orderId: string;
}

export interface RazorpayOrderStatusResponse {
    orderId: string;
    orderStatus: "Success" | "Pending" | "Failure";
}

export const createRazorpayOrder = (payload: CreateRazorpayOrderPayload) =>
    request<CreateRazorpayOrderResponse>("/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        requiresAuth: true,
        body: JSON.stringify(payload),
    });

export const verifyRazorpayPayment = (payload: VerifyRazorpayPaymentPayload) =>
    request<VerifyRazorpayPaymentResponse>("/payments/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        requiresAuth: true,
        body: JSON.stringify(payload),
    });

export const fetchRazorpayOrderStatus = (orderId: string) =>
    request<RazorpayOrderStatusResponse>(`/payments/razorpay/orders/${encodeURIComponent(orderId)}/status`, {
        method: "GET",
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

export const fetchUserCart = () =>
    request<CartResponse>("/cart", {
        method: "GET",
        requiresAuth: true,
    });

export const saveUserCart = (payload: SaveCartPayload) =>
    request<SaveCartResponse>("/cart", {
        method: "PUT",
        requiresAuth: true,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

export interface Bill {
    invoiceNo: string;
    amount: number;
    date: string;
    status: string;
    orderId: string;
}

export interface BillsHistoryResponse {
    bills: Bill[];
}

export const fetchBillsHistory = () =>
    request<BillsHistoryResponse>("/bills/history", {
        method: "GET",
        requiresAuth: true,
    });

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

export interface ChangePasswordResponse {
    message: string;
}

export const changePassword = (payload: ChangePasswordPayload) =>
    request<ChangePasswordResponse>("/auth/change-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        requiresAuth: true,
        body: JSON.stringify(payload),
    });

export interface UpdateNamePayload {
    name: string;
}

export interface UpdateNameResponse {
    message: string;
    name: string;
}

export const updateName = (payload: UpdateNamePayload) =>
    request<UpdateNameResponse>("/auth/update-name", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        requiresAuth: true,
        body: JSON.stringify(payload),
    });
