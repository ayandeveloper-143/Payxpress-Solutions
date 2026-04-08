/**
 * Email Logs Migration Script
 * ============================
 * Creates the email_logs table used to track all outbound emails.
 *
 * EXECUTION INSTRUCTIONS:
 * ========================
 * From the api-source/ directory, run:
 *   bun src/scripts/create-email-logs-table.ts
 *
 * Or via ts-node:
 *   npx ts-node src/scripts/create-email-logs-table.ts
 */

import { db } from "../config/db.js";

const run = async (): Promise<void> => {
    console.log("[email-logs-migration] Creating email_logs table...");

    await db.execute(`
        CREATE TABLE IF NOT EXISTS email_logs (
            id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
            recipient   VARCHAR(255)     NOT NULL,
            subject     VARCHAR(500)     NOT NULL,
            email_type  VARCHAR(100)     NOT NULL,
            status      ENUM('sent','failed','skipped') NOT NULL DEFAULT 'sent',
            error_msg   TEXT             NULL DEFAULT NULL,
            created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_recipient  (recipient),
            INDEX idx_email_type (email_type),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("[email-logs-migration] email_logs table created (or already exists).");
    process.exit(0);
};

run().catch((err) => {
    console.error("[email-logs-migration] Fatal error:", err);
    process.exit(1);
});
