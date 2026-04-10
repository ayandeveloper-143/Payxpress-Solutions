import { load } from "@cashfreepayments/cashfree-js";
import { ApiRequestError, createOrder } from "@/lib/api";
import type { CreateOrderCashfreeResponse, CreateOrderRazorpayResponse, CreateOrderResponse } from "@/lib/api";

export interface PaymentResult {
  success: boolean;
  message: string;
  orderId?: string;
  gateway?: string;
}

interface CashfreeInstance {
  checkout: (options: {
    paymentSessionId: string;
    redirectTarget: "_self" | "_blank" | "_modal";
  }) => Promise<unknown> | unknown;
}

type CheckoutErrorResponse = {
  error?: {
    message?: string;
  };
};

// Cache Cashfree instances by mode to avoid re-initialization
const cashfreeInstances: Partial<Record<string, CashfreeInstance>> = {};

const initializeCashfree = async (mode: "sandbox" | "production"): Promise<CashfreeInstance> => {
  const cached = cashfreeInstances[mode];
  if (cached) return cached;

  try {
    const instance = await load({ mode });
    cashfreeInstances[mode] = instance as CashfreeInstance;
    return cashfreeInstances[mode] as CashfreeInstance;
  } catch (error) {
    console.error("Failed to initialize Cashfree:", error);
    throw error;
  }
};

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: { order_id: string; payment_id?: string };
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: RazorpayFailureResponse) => void) => void;
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

const RAZORPAY_CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if ((window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_CHECKOUT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay SDK")));
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.head.appendChild(script);
  });

const handleCashfreeOrderResult = async (order: CreateOrderCashfreeResponse): Promise<PaymentResult> => {
  const cf = await initializeCashfree(order.cashfreeMode);

  const checkoutResponse = (await cf.checkout({
    paymentSessionId: order.paymentSessionId,
    redirectTarget: "_modal",
  })) as CheckoutErrorResponse;

  if (checkoutResponse?.error?.message) {
    return { success: false, message: checkoutResponse.error.message };
  }

  return { success: true, message: "Payment completed", orderId: order.orderId, gateway: "cashfree" };
};

const handleRazorpayOrderResult = (order: CreateOrderRazorpayResponse): Promise<PaymentResult> => {
  return new Promise<PaymentResult>((resolve) => {
    const rzpOptions: Record<string, unknown> = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "PayXpress Solutions",
      description: "Purchase",
      order_id: order.orderId,
      handler: async (response: RazorpaySuccessResponse) => {
        try {
          const { verifyRazorpayPayment } = await import("@/lib/api");
          await verifyRazorpayPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          resolve({ success: true, message: "Payment completed", orderId: order.orderId, gateway: "razorpay" });
        } catch (error) {
          resolve({
            success: false,
            message: error instanceof ApiRequestError ? error.message : "Payment verification failed.",
          });
        }
      },
      prefill: order.prefill,
      modal: {
        ondismiss: () => {
          resolve({ success: false, message: "Payment was cancelled." });
        },
      },
      theme: { color: "#7c3aed" },
    };

    const RazorpayClass = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay;
    const rzp = new RazorpayClass(rzpOptions);

    rzp.on("payment.failed", (response: RazorpayFailureResponse) => {
      resolve({
        success: false,
        message: response.error?.description || "Payment failed.",
      });
    });

    rzp.open();
  });
};

export interface HandlePaymentParams {
  phone?: string;
  address?: string;
  createOrderResponse?: CreateOrderResponse;
}

export const handlePayment = async (params: HandlePaymentParams): Promise<PaymentResult> => {
  try {
    const order = params.createOrderResponse
      ?? await createOrder({
        phone: params.phone ?? "",
        address: params.address,
      });

    if (order.gateway === "razorpay") {
      await loadRazorpayScript();
      return await handleRazorpayOrderResult(order);
    }

    return await handleCashfreeOrderResult(order);
  } catch (error) {
    console.error("Payment error:", error);

    if (error instanceof ApiRequestError) {
      const fieldErrors = error.errors
        ? Object.values(error.errors)
          .flat()
          .filter((item) => typeof item === "string" && item.trim().length > 0)
        : [];

      return {
        success: false,
        message: fieldErrors[0] ?? error.message,
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Payment failed",
    };
  }
};
