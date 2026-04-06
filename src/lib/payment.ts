import { load } from "@cashfreepayments/cashfree-js";
import { ApiRequestError, createCashfreeSession, createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api";

const cashfreeMode = import.meta.env.VITE_CASHFREE_MODE === "production" ? "production" : "sandbox";
const paymentGatewayEnabled = import.meta.env.VITE_PAYMENT_GATEWAY_ENABLED !== "false";

interface CashfreePaymentParams {
  orderId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress?: string;
  orderNote: string;
}

interface PaymentResult {
  success: boolean;
  message: string;
  orderId?: string;
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

let cashfree: CashfreeInstance | null = null;

const initializeCashfree = async () => {
  if (cashfree) return cashfree;

  try {
    cashfree = await load({
      mode: cashfreeMode,
    });
    return cashfree;
  } catch (error) {
    console.error("Failed to initialize Cashfree:", error);
    throw error;
  }
};

export const handleCashfreePayment = async (params: CashfreePaymentParams): Promise<PaymentResult> => {
  try {
    if (!paymentGatewayEnabled) {
      return {
        success: false,
        message: "Payment gateway is currently disabled.",
      };
    }

    const cf = await initializeCashfree();

    // Request a real payment session from backend.
    const session = await getSession(params);

    const checkoutOptions = {
      paymentSessionId: session.paymentSessionId,
      redirectTarget: "_modal" as const,
    };

    const checkoutResponse = (await cf.checkout(checkoutOptions)) as CheckoutErrorResponse;

    if (checkoutResponse?.error?.message) {
      return {
        success: false,
        message: checkoutResponse.error.message,
      };
    }

    return {
      success: true,
      message: "Payment completed",
      orderId: session.orderId,
    };
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

const getSession = async (params: CashfreePaymentParams): Promise<{ paymentSessionId: string; orderId: string }> => {
  const response = await createCashfreeSession({
    orderId: params.orderId,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    billingAddress: params.billingAddress,
    orderNote: params.orderNote,
  });

  return {
    paymentSessionId: response.paymentSessionId,
    orderId: response.orderId,
  };
};

// ---- Razorpay popup checkout ----

interface RazorpayPaymentParams {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress?: string;
  orderNote: string;
}

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

export const handleRazorpayPayment = async (params: RazorpayPaymentParams): Promise<PaymentResult> => {
  try {
    if (!paymentGatewayEnabled) {
      return { success: false, message: "Payment gateway is currently disabled." };
    }

    // Create order on backend
    const order = await createRazorpayOrder({
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      billingAddress: params.billingAddress,
      orderNote: params.orderNote,
    });

    // Load Razorpay JS SDK
    await loadRazorpayScript();

    const RazorpayClass = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay;

    // Open Razorpay popup and wait for payment result
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
            await verifyRazorpayPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            resolve({ success: true, message: "Payment completed", orderId: order.orderId });
          } catch (error) {
            resolve({
              success: false,
              message: error instanceof ApiRequestError ? error.message : "Payment verification failed.",
            });
          }
        },
        prefill: {
          name: params.customerName,
          email: params.customerEmail,
          contact: params.customerPhone,
        },
        modal: {
          ondismiss: () => {
            resolve({ success: false, message: "Payment was cancelled." });
          },
        },
        theme: { color: "#7c3aed" },
      };

      const rzp = new RazorpayClass(rzpOptions);

      rzp.on("payment.failed", (response: RazorpayFailureResponse) => {
        resolve({
          success: false,
          message: response.error?.description || "Payment failed.",
        });
      });

      rzp.open();
    });
  } catch (error) {
    console.error("Razorpay payment error:", error);

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
