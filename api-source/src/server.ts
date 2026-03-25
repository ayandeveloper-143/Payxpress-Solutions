import app from "./app.js";
import { db } from "./config/db.js";
import { env } from "./config/env.js";

const startServer = async () => {
    await db.getConnection();

    await db.execute(`
        CREATE TABLE IF NOT EXISTS auth_sessions (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_uuid VARCHAR(64) NOT NULL,
            token_hash CHAR(64) NOT NULL,
            issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            revoked_at DATETIME NULL,
            ip_address VARCHAR(45) NULL,
            user_agent VARCHAR(255) NULL,
            PRIMARY KEY (id),
            UNIQUE KEY ux_auth_sessions_token_hash (token_hash),
            KEY idx_auth_sessions_user_uuid (user_uuid),
            KEY idx_auth_sessions_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    app.listen(env.port, () => {
        console.log(`API server running on http://localhost:${env.port}`);
    });
};

startServer().catch((error) => {
    console.error("Failed to start API server", error);
    process.exit(1);
});