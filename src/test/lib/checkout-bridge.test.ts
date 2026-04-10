import { beforeEach, describe, expect, it } from "vitest";
import {
    buildCheckoutBridgeUrl,
    consumeStoredCreateOrderResponse,
    getStoredCreateOrderResponse,
    parseCheckoutBridgeData,
    storeCheckoutBridgeData,
} from "@/lib/checkout-bridge";

const cashfreeOrderResponse = {
    gateway: "cashfree" as const,
    cashfreeMode: "sandbox" as const,
    message: "Payment session created.",
    orderId: "ORDER_456",
    paymentSessionId: "sess-xyz",
};

describe("checkout bridge", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("builds and parses an encoded checkout bridge url", () => {
        const url = buildCheckoutBridgeUrl({
            token: "auth-123",
            createOrder: cashfreeOrderResponse,
        });

        const data = url.split("data=")[1];
        const payload = parseCheckoutBridgeData(data);

        expect(payload).toEqual({
            token: "auth-123",
            createOrder: cashfreeOrderResponse,
        });
    });

    it("stores and consumes the cached createOrder response", () => {
        storeCheckoutBridgeData({
            token: "auth-456",
            createOrder: cashfreeOrderResponse,
        });

        expect(localStorage.getItem("auth_token")).toBe("auth-456");
        expect(getStoredCreateOrderResponse()).toEqual(cashfreeOrderResponse);
        expect(consumeStoredCreateOrderResponse()).toEqual(cashfreeOrderResponse);
        expect(getStoredCreateOrderResponse()).toBeNull();
    });
});