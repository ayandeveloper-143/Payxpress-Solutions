import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCheckout = vi.fn();
const mockLoad = vi.fn();
const mockCreateOrder = vi.fn();

vi.mock("@cashfreepayments/cashfree-js", () => ({
  load: () => mockLoad(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    createOrder: (...args: unknown[]) => mockCreateOrder(...args),
  };
});

// Import after mocks so that the module receives the mocked dependencies.
import { handlePayment } from "@/lib/payment";

const defaultParams = {
  phone: "9999999999",
  address: "Street 1, City",
};

const cashfreeOrderResponse = {
  gateway: "cashfree" as const,
  cashfreeMode: "sandbox" as const,
  message: "Payment session created.",
  orderId: "ORDER_123",
  paymentSessionId: "sess-abc",
};

describe("handlePayment (Cashfree)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns failure result when cashfree SDK fails to load", async () => {
    mockCreateOrder.mockResolvedValueOnce(cashfreeOrderResponse);
    mockLoad.mockRejectedValueOnce(new Error("SDK load failed"));
    const result = await handlePayment(defaultParams);
    expect(result.success).toBe(false);
    expect(result.message).toBe("SDK load failed");
    expect(mockCheckout).not.toHaveBeenCalled();
  });

  it("returns failure result when createOrder throws an Error", async () => {
    mockCreateOrder.mockRejectedValueOnce(new Error("Network error"));
    const result = await handlePayment(defaultParams);
    expect(result.success).toBe(false);
    expect(result.message).toBe("Network error");
    expect(mockCheckout).not.toHaveBeenCalled();
  });

  it("returns failure with generic message when a non-Error is thrown", async () => {
    mockCreateOrder.mockRejectedValueOnce("string error");
    const result = await handlePayment(defaultParams);
    expect(result.success).toBe(false);
    expect(result.message).toBe("Payment failed");
  });

  it("calls checkout and returns success on the happy path", async () => {
    mockCreateOrder.mockResolvedValueOnce(cashfreeOrderResponse);
    mockLoad.mockResolvedValueOnce({ checkout: mockCheckout });
    mockCheckout.mockResolvedValueOnce({});
    const result = await handlePayment(defaultParams);
    expect(result.success).toBe(true);
    expect(result.message).toBe("Payment completed");
    expect(result.orderId).toBe("ORDER_123");
    expect(result.gateway).toBe("cashfree");
    expect(mockCheckout).toHaveBeenCalledWith({
      paymentSessionId: "sess-abc",
      redirectTarget: "_modal",
    });
  });

  it("passes phone and address to createOrder", async () => {
    mockCreateOrder.mockResolvedValueOnce(cashfreeOrderResponse);
    mockLoad.mockResolvedValueOnce({ checkout: mockCheckout });
    mockCheckout.mockResolvedValueOnce({});
    const params = { phone: "9876543210", address: "Block A, Sector 9" };
    await handlePayment(params);
    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: "9876543210",
        address: "Block A, Sector 9",
      }),
    );
  });
});
