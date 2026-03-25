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
    smtpHost: process.env.SMTP_HOST ?? "",
    smtpPort: toNumber(process.env.SMTP_PORT, 587),
    smtpSecure: toBoolean(process.env.SMTP_SECURE, false),
    smtpUser: process.env.SMTP_USER ?? "",
    smtpPass: process.env.SMTP_PASS ?? "",
    smtpTlsServername: process.env.SMTP_TLS_SERVERNAME ?? "",
    smtpTlsRejectUnauthorized: toBoolean(process.env.SMTP_TLS_REJECT_UNAUTHORIZED, true),
    mailFrom: process.env.MAIL_FROM ?? "",
    otpExpiryMinutes: toNumber(process.env.OTP_EXPIRY_MINUTES, 10),
    jwtAccessSecret:
        process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? "payxpress-dev-secret-change-in-prod",
    jwtActionSecret:
        process.env.JWT_ACTION_SECRET ?? process.env.JWT_ACCESS_SECRET ?? "payxpress-dev-action-secret-change-in-prod",
    jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY ?? "7d",
};