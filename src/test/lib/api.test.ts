import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ApiRequestError,
  fetchProducts,
  fetchProductBySlug,
  submitContact,
  createCashfreeSession,
  loginUser,
  startSignup,
  verifySignupLink,
  startForgotPassword,
  verifyForgotPassword,
  getCurrentUser,
  logoutUser,
  fetchUserCart,
  saveUserCart,
} from "@/lib/api";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function makeResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// ApiRequestError
// ---------------------------------------------------------------------------
describe("ApiRequestError", () => {
  it("stores the message and status", () => {
    const err = new ApiRequestError("Not found", 404);
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
  });

  it("is an instance of Error", () => {
    expect(new ApiRequestError("x", 500)).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// request() internals
// ---------------------------------------------------------------------------
describe("request internals", () => {
  it("throws ApiRequestError with body message on non-ok response", async () => {
    mockFetch.mockResolvedValue(makeResponse({ message: "Unauthorized" }, 401));
    const err = await fetchProducts().catch((e) => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(err.status).toBe(401);
    expect(err.message).toBe("Unauthorized");
  });

  it("uses a fallback message when the body has no message field", async () => {
    mockFetch.mockResolvedValue(makeResponse({}, 500));
    const err = await fetchProducts().catch((e) => e);
    expect(err.message).toBe("Request failed.");
    expect(err.status).toBe(500);
  });

  it("handles non-JSON response bodies gracefully", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.reject(new Error("Not JSON")),
    } as unknown as Response);
    const err = await fetchProducts().catch((e) => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(err.status).toBe(503);
    expect(err.message).toBe("Request failed.");
  });

  it("adds Authorization header when requiresAuth=true and token exists", async () => {
    localStorage.setItem("auth_token", "test-token");
    mockFetch.mockResolvedValue(
      makeResponse({ user: { id: "1", name: "Test", email: "t@t.com" } }),
    );
    await getCurrentUser();
    const headers: Headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("does not add Authorization header when no token is stored", async () => {
    mockFetch.mockResolvedValue(
      makeResponse({ user: { id: "1", name: "Test", email: "t@t.com" } }),
    );
    await getCurrentUser();
    const headers: Headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.get("Authorization")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Products API
// ---------------------------------------------------------------------------
describe("fetchProducts", () => {
  it("calls GET /products and returns the products array", async () => {
    const products = [{ slug: "test-product", title: "Test" }];
    mockFetch.mockResolvedValue(makeResponse({ products }));
    const result = await fetchProducts();
    expect(result.products).toEqual(products);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/products"),
      expect.any(Object),
    );
  });
});

describe("fetchProductBySlug", () => {
  it("calls GET /products/:slug and returns the product", async () => {
    const product = { slug: "my-product", title: "My Product" };
    mockFetch.mockResolvedValue(makeResponse({ product }));
    const result = await fetchProductBySlug("my-product");
    expect(result.product).toEqual(product);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/products/my-product"),
      expect.any(Object),
    );
  });

  it("URL-encodes the slug", async () => {
    mockFetch.mockResolvedValue(makeResponse({ product: {} }));
    await fetchProductBySlug("my product/slug");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/products/my%20product%2Fslug"),
      expect.any(Object),
    );
  });
});

// ---------------------------------------------------------------------------
// Contact API
// ---------------------------------------------------------------------------
describe("submitContact", () => {
  it("posts to /contact with correct payload", async () => {
    const response = { message: "OK", enquiryId: 42 };
    mockFetch.mockResolvedValue(makeResponse(response));
    const payload = { name: "Alice", email: "alice@example.com", message: "Hello" };
    const result = await submitContact(payload);
    expect(result).toEqual(response);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/contact");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual(payload);
    expect(options.headers.get("Content-Type")).toBe("application/json");
  });

  it("includes optional subject field when provided", async () => {
    mockFetch.mockResolvedValue(makeResponse({ message: "OK", enquiryId: 1 }));
    const payload = { name: "Bob", email: "b@b.com", subject: "Help", message: "Need help" };
    await submitContact(payload);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.subject).toBe("Help");
  });
});

// ---------------------------------------------------------------------------
// Payments API
// ---------------------------------------------------------------------------
describe("createCashfreeSession", () => {
  it("posts to /payments/cashfree/session and returns session data", async () => {
    const response = { message: "Created", orderId: "ord-1", paymentSessionId: "sess-abc" };
    mockFetch.mockResolvedValue(makeResponse(response));
    const payload = {
      orderId: "ord-1",
      orderAmount: 499,
      orderCurrency: "INR",
      customerId: "cust-1",
      customerEmail: "user@example.com",
      customerPhone: "9999999999",
    };
    const result = await createCashfreeSession(payload);
    expect(result.paymentSessionId).toBe("sess-abc");
    expect(result.orderId).toBe("ord-1");
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/payments/cashfree/session");
    expect(options.method).toBe("POST");
  });
});

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------
describe("loginUser", () => {
  it("posts to /auth/login and returns token and user", async () => {
    const response = {
      message: "Login successful",
      token: "jwt-xyz",
      user: { id: "1", name: "Test User", email: "test@test.com" },
    };
    mockFetch.mockResolvedValue(makeResponse(response));
    const result = await loginUser({ email: "test@test.com", password: "pass123" });
    expect(result.token).toBe("jwt-xyz");
    expect(result.user.email).toBe("test@test.com");
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/auth/login");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ email: "test@test.com", password: "pass123" });
  });
});

describe("startSignup", () => {
  it("posts to /auth/signup and returns verification info", async () => {
    const response = {
      message: "Check your email",
      requiresEmailVerification: true,
      email: "new@user.com",
    };
    mockFetch.mockResolvedValue(makeResponse(response));
    const result = await startSignup({ name: "New User", email: "new@user.com", password: "pass" });
    expect(result.requiresEmailVerification).toBe(true);
    expect(result.email).toBe("new@user.com");
    expect(mockFetch.mock.calls[0][0]).toContain("/auth/signup");
  });
});

describe("verifySignupLink", () => {
  it("posts to /auth/signup/verify-link and returns token and user", async () => {
    const response = {
      message: "Account created",
      token: "jwt-new",
      user: { id: "2", name: "New User", email: "new@user.com" },
    };
    mockFetch.mockResolvedValue(makeResponse(response));
    const result = await verifySignupLink({ token: "email-verify-token" });
    expect(result.token).toBe("jwt-new");
    expect(result.user.name).toBe("New User");
    expect(mockFetch.mock.calls[0][0]).toContain("/auth/signup/verify-link");
  });
});

describe("startForgotPassword", () => {
  it("posts to /auth/forgot-password/start", async () => {
    mockFetch.mockResolvedValue(makeResponse({ message: "Reset email sent" }));
    const result = await startForgotPassword({ email: "user@example.com" });
    expect(result.message).toBe("Reset email sent");
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/auth/forgot-password/start");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ email: "user@example.com" });
  });
});

describe("verifyForgotPassword", () => {
  it("posts to /auth/forgot-password/reset", async () => {
    mockFetch.mockResolvedValue(makeResponse({ message: "Password updated" }));
    const result = await verifyForgotPassword({ token: "reset-tok", newPassword: "newPass1" });
    expect(result.message).toBe("Password updated");
    expect(mockFetch.mock.calls[0][0]).toContain("/auth/forgot-password/reset");
  });
});

describe("getCurrentUser", () => {
  it("sends GET /auth/me and returns the current user", async () => {
    localStorage.setItem("auth_token", "tok-123");
    mockFetch.mockResolvedValue(
      makeResponse({ user: { id: "5", name: "Me", email: "me@me.com" } }),
    );
    const result = await getCurrentUser();
    expect(result.user.email).toBe("me@me.com");
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/auth/me");
    expect(options.headers.get("Authorization")).toBe("Bearer tok-123");
  });
});

describe("logoutUser", () => {
  it("posts to /auth/logout with auth header", async () => {
    localStorage.setItem("auth_token", "tok-456");
    mockFetch.mockResolvedValue(makeResponse({ message: "Logged out" }));
    const result = await logoutUser();
    expect(result.message).toBe("Logged out");
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/auth/logout");
    expect(options.method).toBe("POST");
    expect(options.headers.get("Authorization")).toBe("Bearer tok-456");
  });
});

// ---------------------------------------------------------------------------
// Cart API
// ---------------------------------------------------------------------------
describe("fetchUserCart", () => {
  it("sends GET /cart with auth header and returns cart", async () => {
    localStorage.setItem("auth_token", "cart-tok");
    const cart = [
      { slug: "prod-1", title: "Product 1", price: "₹100", image: "", quantity: 2, cartLimit: 5 },
    ];
    mockFetch.mockResolvedValue(makeResponse({ cart }));
    const result = await fetchUserCart();
    expect(result.cart).toEqual(cart);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/cart");
    expect(options.headers.get("Authorization")).toBe("Bearer cart-tok");
  });
});

describe("saveUserCart", () => {
  it("sends PUT /cart with auth header and cart payload", async () => {
    localStorage.setItem("auth_token", "cart-tok");
    const cart = [
      { slug: "prod-1", title: "Product 1", price: "₹100", image: "", quantity: 1, cartLimit: 5 },
    ];
    mockFetch.mockResolvedValue(makeResponse({ message: "Saved", cart }));
    const result = await saveUserCart({ cart });
    expect(result.message).toBe("Saved");
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/cart");
    expect(options.method).toBe("PUT");
    expect(JSON.parse(options.body)).toEqual({ cart });
    expect(options.headers.get("Authorization")).toBe("Bearer cart-tok");
  });
});
