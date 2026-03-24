import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import contactRouter from "./routes/contact.routes.js";
import healthRouter from "./routes/health.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import productRouter from "./routes/product.routes.js";

const app = express();

app.use(
    cors({
        origin: env.clientOrigin,
    })
);
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", productRouter);
app.use("/api", contactRouter);
app.use("/api", paymentRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;