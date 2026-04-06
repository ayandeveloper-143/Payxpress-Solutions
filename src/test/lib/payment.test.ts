import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCheckout = vi.fn();
const mockLoad = vi.fn();
const mockCreateSession = vi.fn();

vi.mock("@cashfreepayments/cashfree-js", () => ({
  load: () => mockLoad(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    createCashfreeSession: (...args: unknown[]) => mockCreateSession(...args),
  };
});

// Import after mocks so that the module receives the mocked dependencies.
import { handleCashfreePayment } from "@/lib/payment";

const defaultParams = {
  orderId: "ord-1",
  customerName: "Test User",
  customerEmail: "test@test.com",
  customerPhone: "9999999999",
  billingAddress: "Street 1, City",
  orderNote: "Test order",
};

describe("handleCashfreePayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // NOTE: The Cashfree SDK instance is cached at module level after first
  // successful initialisation. The tests below are ordered so that the first
  // test exercises the "init fails" path (cashfree stays null), the second
  // exercises "init succeeds but session fails" (caches the instance), and
  // subsequent tests reuse the cached instance.

  it("returns failure result when cashfree SDK fails to load", async () => {
    mockLoad.mockRejectedValueOnce(new Error("SDK load failed"));
    const result = await handleCashfreePayment(defaultParams);
    expect(result.success).toBe(false);
    expect(result.message).toBe("SDK load failed");
    expect(mockCheckout).not.toHaveBeenCalled();
  });

  it("returns failure result when session creation throws an Error", async () => {
    mockLoad.mockResolvedValueOnce({ checkout: mockCheckout });
    mockCreateSession.mockRejectedValueOnce(new Error("Network error"));
    const result = await handleCashfreePayment(defaultParams);
    expect(result.success).toBe(false);
    expect(result.message).toBe("Network error");
    expect(mockCheckout).not.toHaveBeenCalled();
  });

  it("returns failure with generic message when a non-Error is thrown", async () => {
    // cashfree is now cached from the previous test
    mockCreateSession.mockRejectedValueOnce("string error");
    const result = await handleCashfreePayment(defaultParams);
    expect(result.success).toBe(false);
    expect(result.message).toBe("Payment failed");
  });

  it("calls checkout and returns success on the happy path", async () => {
    // cashfree is cached; only createCashfreeSession needs to resolve
    mockCreateSession.mockResolvedValueOnce({
      message: "Created",
      orderId: "ord-1",
      paymentSessionId: "sess-abc",
    });
    const result = await handleCashfreePayment(defaultParams);
    expect(result.success).toBe(true);
    expect(result.message).toBe("Payment completed");
    expect(result.orderId).toBe("ord-1");
    expect(mockCheckout).toHaveBeenCalledWith({
      paymentSessionId: "sess-abc",
      redirectTarget: "_modal",
    });
  });

  it("passes all payment params to createCashfreeSession", async () => {
    mockCreateSession.mockResolvedValueOnce({
      message: "Created",
      orderId: "ord-2",
      paymentSessionId: "sess-xyz",
    });
    const params = {
      ...defaultParams,
      orderId: "ord-2",
      customerName: "Alice",
      billingAddress: "Block A, Sector 9",
      orderNote: "Premium order",
    };
    await handleCashfreePayment(params);
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "ord-2",
        customerName: "Alice",
        billingAddress: "Block A, Sector 9",
        orderNote: "Premium order",
      }),
    );
  });
});
