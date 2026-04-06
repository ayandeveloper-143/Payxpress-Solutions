import { Router } from "express";
import { cashfreeWebhook, createCashfreeSession, getCashfreeOrderStatus, createRazorpayOrder, verifyRazorpayPayment, getRazorpayOrderStatus } from "../controllers/payment.controller.js";

const paymentRouter = Router();

paymentRouter.post("/payments/cashfree/session", createCashfreeSession);
paymentRouter.get("/payments/cashfree/orders/:orderId/status", getCashfreeOrderStatus);
paymentRouter.post("/webhook", cashfreeWebhook);

paymentRouter.post("/payments/razorpay/order", createRazorpayOrder);
paymentRouter.post("/payments/razorpay/verify", verifyRazorpayPayment);
paymentRouter.get("/payments/razorpay/orders/:orderId/status", getRazorpayOrderStatus);

export default paymentRouter;
