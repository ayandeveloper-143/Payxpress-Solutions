import { Router } from "express";
import { cashfreeWebhook, createCashfreeSession, getCashfreeOrderStatus } from "../controllers/payment.controller.js";

const paymentRouter = Router();

paymentRouter.post("/payments/cashfree/session", createCashfreeSession);
paymentRouter.get("/payments/cashfree/orders/:orderId/status", getCashfreeOrderStatus);
paymentRouter.post("/webhook", cashfreeWebhook);

export default paymentRouter;
