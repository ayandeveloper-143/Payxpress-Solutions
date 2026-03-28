import app from "./app.js";
import { db } from "./config/db.js";
import { env } from "./config/env.js";

const startServer = async () => {
    await db.getConnection();

    app.listen(env.port, () => {
        console.log(`API server running on http://localhost:${env.port}`);
    });
};

startServer().catch((error) => {
    console.error("Failed to start API server", error);
    process.exit(1);
});