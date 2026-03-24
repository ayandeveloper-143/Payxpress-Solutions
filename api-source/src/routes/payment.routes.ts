import { Router } from "express";
import { createCashfreeSession } from "../controllers/payment.controller.js";

const paymentRouter = Router();

paymentRouter.post("/payments/cashfree/session", createCashfreeSession);

export default paymentRouter;
