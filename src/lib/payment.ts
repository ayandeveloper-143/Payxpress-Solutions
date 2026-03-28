import { load } from "@cashfreepayments/cashfree-js";
import { ApiRequestError, createCashfreeSession } from "@/lib/api";

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
