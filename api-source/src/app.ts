import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import authRouter from "./routes/auth.routes.js";
import cartRouter from "./routes/cart.routes.js";
import contactRouter from "./routes/contact.routes.js";
import healthRouter from "./routes/health.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import productRouter from "./routes/product.routes.js";
import billsRouter from "./routes/bills.routes.js";
import adminRouter from "./routes/admin.routes.js";
import { razorpayWebhook } from "./controllers/payment.controller.js";


const app = express();

// Serve static files from public, but NOT /bills (bills only via API)
import path from "path";
app.use("/", express.static(path.resolve("public"), {
    index: false,
    setHeaders: (res, filePath) => {
        // Prevent direct access to /bills/
        if (filePath.includes(`${path.sep}bills${path.sep}`)) {
            res.statusCode = 403;
            res.end("Forbidden");
        }
    }
}));

app.set("trust proxy", 1);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || env.clientOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error("Not allowed by CORS"));
        },
    })
);

// Razorpay webhook must receive the raw body for HMAC-SHA256 signature verification.
// This route is mounted BEFORE express.json() so the body is not pre-parsed.
app.post("/api/webhook/razorpay", express.raw({ type: "*/*" }), razorpayWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", healthRouter);
app.use("/api", productRouter);
app.use("/api", contactRouter);
app.use("/api", paymentRouter);
app.use("/api", authRouter);
app.use("/api", cartRouter);
app.use("/api", billsRouter);
app.use("/api", adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;