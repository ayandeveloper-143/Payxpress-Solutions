import type { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env.js";

const createCashfreeSessionSchema = z.object({
    orderId: z.string().trim().min(3).max(50).optional(),
    orderAmount: z.number().positive(),
    orderCurrency: z.string().trim().length(3).default("INR"),
    customerId: z.string().trim().min(2).max(64),
    customerName: z.string().trim().min(2).max(100).optional(),
    customerEmail: z.string().trim().email().max(255),
    customerPhone: z.string().trim().min(10).max(20),
    orderNote: z.string().trim().max(200).optional(),
});

type CashfreeOrderResponse = {
    message?: string;
    order_id?: string;
    payment_session_id?: string;
};

export const createCashfreeSession = async (request: Request, response: Response) => {
    if (!env.paymentGatewayEnabled) {
        response.status(503).json({
            message: "Payment gateway is currently disabled.",
        });
        return;
    }

    const parsed = createCashfreeSessionSchema.safeParse(request.body);

    if (!parsed.success) {
        response.status(400).json({
            message: "Invalid payment request.",
            errors: parsed.error.flatten().fieldErrors,
        });
        return;
    }

    if (!env.cashfreeAppId || !env.cashfreeSecretKey) {
        response.status(500).json({
            message: "Cashfree credentials are not configured on server.",
        });
        return;
    }

    const data = parsed.data;
    const orderId = data.orderId ?? `ORDER_${Date.now()}`;
    const baseUrl =
        env.cashfreeMode === "production"
            ? "https://api.cashfree.com"
            : "https://sandbox.cashfree.com";

    const payload = {
        order_id: orderId,
        order_amount: data.orderAmount,
        order_currency: data.orderCurrency.toUpperCase(),
        order_note: data.orderNote,
        customer_details: {
            customer_id: data.customerId,
            customer_name: data.customerName,
            customer_email: data.customerEmail,
            customer_phone: data.customerPhone,
        },
    };

    const cashfreeResponse = await fetch(`${baseUrl}/pg/orders`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-client-id": env.cashfreeAppId,
            "x-client-secret": env.cashfreeSecretKey,
            "x-api-version": env.cashfreeApiVersion,
        },
        body: JSON.stringify(payload),
    });

    const responseData = (await cashfreeResponse.json().catch(() => ({}))) as CashfreeOrderResponse;

    if (!cashfreeResponse.ok || !responseData.payment_session_id) {
        response.status(cashfreeResponse.status || 502).json({
            message:
                typeof responseData.message === "string"
                    ? responseData.message
                    : "Unable to create Cashfree payment session.",
        });
        return;
    }

    response.status(201).json({
        message: "Payment session created.",
        orderId: responseData.order_id ?? orderId,
        paymentSessionId: responseData.payment_session_id,
    });
};
