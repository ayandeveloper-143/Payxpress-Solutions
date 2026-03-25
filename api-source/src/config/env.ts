import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const envPath = path.resolve(currentDir, "../../.env");

dotenv.config({ path: envPath });

const toNumber = (value: string | undefined, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback: boolean) => {
    if (value === undefined) {
        return fallback;
    }

    return value.toLowerCase() === "true";
};

export const env = {
    port: toNumber(process.env.PORT, 8846),
    clientOrigin: process.env.CLIENT_ORIGIN ?? "https://payxpress-solutions.com",
    dbHost: process.env.DB_HOST ?? "127.0.0.1",
    dbPort: toNumber(process.env.DB_PORT, 3306),
    dbUser: process.env.DB_USER ?? "root",
    dbPassword: process.env.DB_PASSWORD ?? "",
    dbName: process.env.DB_NAME ?? "payxpress_api",
    paymentGatewayEnabled: toBoolean(process.env.PAYMENT_GATEWAY_ENABLED, true),
    cashfreeMode: process.env.CASHFREE_MODE === "production" ? "production" : "sandbox",
    cashfreeAppId:
        process.env.CASHFREE_MODE === "production"
            ? process.env.CASHFREE_PRODUCTION_APP_ID ?? process.env.CASHFREE_APP_ID ?? ""
            : process.env.CASHFREE_SANDBOX_APP_ID ?? process.env.CASHFREE_APP_ID ?? "",
    cashfreeSecretKey:
        process.env.CASHFREE_MODE === "production"
            ? process.env.CASHFREE_PRODUCTION_SECRET_KEY ?? process.env.CASHFREE_SECRET_KEY ?? ""
            : process.env.CASHFREE_SANDBOX_SECRET_KEY ?? process.env.CASHFREE_SECRET_KEY ?? "",
    cashfreeApiVersion: process.env.CASHFREE_API_VERSION ?? "2023-08-01",
};