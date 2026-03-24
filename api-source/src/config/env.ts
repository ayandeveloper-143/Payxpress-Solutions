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

export const env = {
    port: toNumber(process.env.PORT, 8846),
    clientOrigin: process.env.CLIENT_ORIGIN ?? "https://payxpress-solutions.com",
    dbHost: process.env.DB_HOST ?? "127.0.0.1",
    dbPort: toNumber(process.env.DB_PORT, 3306),
    dbUser: process.env.DB_USER ?? "root",
    dbPassword: process.env.DB_PASSWORD ?? "",
    dbName: process.env.DB_NAME ?? "payxpress_api",
};