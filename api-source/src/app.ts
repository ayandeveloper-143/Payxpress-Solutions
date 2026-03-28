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

const app = express();

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
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", productRouter);
app.use("/api", contactRouter);
app.use("/api", paymentRouter);
app.use("/api", authRouter);
app.use("/api", cartRouter);
app.use("/api", billsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;