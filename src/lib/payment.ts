import { load } from "@cashfreepayments/cashfree-js";
import { createCashfreeSession } from "@/lib/api";

const cashfreeMode = import.meta.env.VITE_CASHFREE_MODE === "production" ? "production" : "sandbox";
const paymentGatewayEnabled = import.meta.env.VITE_PAYMENT_GATEWAY_ENABLED !== "false";

interface CashfreePaymentParams {
  orderId: string;
  customerId: string;
  customerName?: string;
  customerEmail: string;
  customerPhone: string;
  orderAmount: number;
  orderCurrency: string;
  orderNote: string;
}

interface PaymentResult {
  success: boolean;
  message: string;
}

interface CashfreeInstance {
  checkout: (options: { paymentSessionId: string; redirectTarget: "_self" | "_blank" | "_modal" }) => void;
}

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
    const sessionId = await getSessionId(params);

    const checkoutOptions = {
      paymentSessionId: sessionId,
      redirectTarget: "_modal" as const,
    };

    cf.checkout(checkoutOptions);

    return {
      success: true,
      message: "Payment session started",
    };
  } catch (error) {
    console.error("Payment error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Payment failed",
    };
  }
};

const getSessionId = async (params: CashfreePaymentParams): Promise<string> => {
  const response = await createCashfreeSession({
    orderId: params.orderId,
    orderAmount: params.orderAmount,
    orderCurrency: params.orderCurrency,
    customerId: params.customerId,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    orderNote: params.orderNote,
  });

  return response.paymentSessionId;
};
