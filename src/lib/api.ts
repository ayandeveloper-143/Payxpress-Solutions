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

// ---- Unified create order API ----

export interface CreateOrderPayload {
    phone: string;
    address?: string;
}

interface CreateOrderBaseResponse {
    message: string;
    orderId: string;
    breakdown?: Record<string, unknown>;
}

export interface CreateOrderCashfreeResponse extends CreateOrderBaseResponse {
    gateway: "cashfree";
    cashfreeMode: "sandbox" | "production";
    paymentSessionId: string;
}

export interface CreateOrderRazorpayResponse extends CreateOrderBaseResponse {
    gateway: "razorpay";
    amount: number;
    currency: string;
    keyId: string;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
}

export type CreateOrderResponse = CreateOrderCashfreeResponse | CreateOrderRazorpayResponse;

export const createOrder = (payload: CreateOrderPayload) =>
    request<CreateOrderResponse>("/createorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        requiresAuth: true,
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

// ---- Admin API ----

const adminRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const headers = new Headers(options.headers ?? {});
    const token = localStorage.getItem("admin_token");
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = typeof data.message === "string" ? data.message : "Request failed.";
        throw new ApiRequestError({ message, status: response.status });
    }
    return data as T;
};

export interface AdminLoginPayload {
    username: string;
    password: string;
}

export interface AdminLoginResponse {
    token: string;
}

export const adminLogin = (payload: AdminLoginPayload) =>
    request<AdminLoginResponse>("/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

export interface AdminInvoice {
    orderId: string;
    userId: string;
    txnId: string | null;
    userEmail: string;
    userName: string;
    status: string;
    total: number;
    date: string;
    invoiceId: string;
    billingAddress: string;
    paymentSuccessIp: string | null;
    userAgent: string | null;
}

export interface AdminInvoicesResponse {
    invoices: AdminInvoice[];
}

export const fetchAdminInvoices = () =>
    adminRequest<AdminInvoicesResponse>("/admin/invoices");

export const downloadAdminInvoicePdf = (invoiceId: string) => {
    const token = localStorage.getItem("admin_token") ?? "";
    const url = `${apiBaseUrl}/admin/invoices/${encodeURIComponent(invoiceId)}/pdf`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${invoiceId}.pdf`);
    // Fetch with auth, then trigger download
    return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
            if (!res.ok) throw new Error("Invoice not found.");
            return res.blob();
        })
        .then((blob) => {
            const objectUrl = URL.createObjectURL(blob);
            link.href = objectUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl);
        });
};

export interface AdminDeliveryLog {
    id: number;
    user_uuid: string;
    user_email: string;
    event_type: "payment_success" | "download";
    order_id: string | null;
    invoice_id: string | null;
    transaction_id: string | null;
    ip_address: string | null;
    user_agent: string | null;
    status: string;
    items_json: Array<{ slug: string; title: string; quantity: number }> | null;
    created_at: string;
}

export interface AdminDeliveryLogsResponse {
    logs: AdminDeliveryLog[];
    total: number;
    page: number;
    limit: number;
}

export const fetchAdminDeliveryLogs = (page = 1, search = "", event = "") => {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (event) params.set("event", event);
    return adminRequest<AdminDeliveryLogsResponse>(`/admin/delivery-logs?${params.toString()}`);
};

export interface AdminEmailLog {
    id: number;
    recipient: string;
    subject: string;
    email_type: string;
    status: "sent" | "failed" | "skipped";
    error_msg: string | null;
    created_at: string;
}

export interface AdminEmailLogsResponse {
    logs: AdminEmailLog[];
    total: number;
    page: number;
    limit: number;
}

export const fetchAdminEmailLogs = (page = 1, search = "") => {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    return adminRequest<AdminEmailLogsResponse>(`/admin/email-logs?${params.toString()}`);
};

export interface AdminUser {
    uuid: string;
    name: string;
    email: string;
    isVerified: boolean;
    orderHistory: Array<{ slug: string; purchasedAt: string }>;
    createdAt: string;
}

export interface AdminUsersResponse {
    users: AdminUser[];
}

export const fetchAdminUsers = () =>
    adminRequest<AdminUsersResponse>("/admin/users");

export const deleteAdminPurchase = (userUuid: string, slug: string) =>
    adminRequest<{ message: string }>(`/admin/purchases/${encodeURIComponent(userUuid)}/${encodeURIComponent(slug)}`, {
        method: "DELETE",
    });

export interface AdminProduct {
    id: number;
    slug: string;
    title: string;
    description: string;
    tag: string;
    priceLabel: string;
    image: string;
    overview: string;
    shortNote: string;
    fullDescription: string;
    screenshots: string[];
    features: string[];
    cartLimit: number;
    sortOrder: number;
    isActive: boolean;
    productFile: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AdminProductsResponse {
    products: AdminProduct[];
}

export const fetchAdminProducts = () =>
    adminRequest<AdminProductsResponse>("/admin/products");

export interface CreateAdminProductPayload {
    slug: string;
    title: string;
    description: string;
    tag: string;
    price_label: string;
    image: string;
    overview?: string;
    short_note?: string;
    full_description?: string;
    screenshots?: string[];
    features?: string[];
    cart_limit?: number;
    sort_order?: number;
    is_active?: boolean;
    product_file?: string | null;
}

export const createAdminProduct = (payload: CreateAdminProductPayload) =>
    adminRequest<{ message: string }>("/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

export interface UpdateAdminProductPayload {
    title?: string;
    description?: string;
    tag?: string;
    price_label?: string;
    image?: string;
    overview?: string;
    short_note?: string;
    full_description?: string;
    screenshots?: string[];
    features?: string[];
    cart_limit?: number;
    sort_order?: number;
    is_active?: boolean;
    product_file?: string | null;
}

export const updateAdminProduct = (id: number, payload: UpdateAdminProductPayload) =>
    adminRequest<{ message: string }>(`/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

export const deleteAdminProduct = (id: number, hard = false) =>
    adminRequest<{ message: string }>(`/admin/products/${id}${hard ? "?hard=true" : ""}`, {
        method: "DELETE",
    });

export const storePodAgreement = (payload: {
    userUuid: string;
    userEmail: string;
    orderId?: string;
    agreementText?: string;
}) =>
    request<{ message: string }>("/pod/agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

