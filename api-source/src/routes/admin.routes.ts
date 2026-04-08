import { Router } from "express";
import {
    adminBasicAuth,
    getAdminPage,
    handleAdminSubmit,
    adminRateLimiter,
    adminApiLogin,
    requireAdminJwt,
    getAdminInvoices,
    downloadAdminInvoice,
    bulkDownloadAdminInvoices,
    getAdminDeliveryLogs,
    getAdminUsers,
    deleteAdminPurchase,
    getAdminProducts,
    createAdminProduct,
    updateAdminProduct,
    deleteAdminProduct,
    storePodAgreement,
} from "../controllers/admin.controller.js";

const adminRouter = Router();

// Legacy HTML admin panel (Basic Auth)
adminRouter.get("/admin/secrect/c228d919dk", adminRateLimiter, adminBasicAuth, getAdminPage);
adminRouter.post("/admin/secrect/c228d919dk/submit", adminRateLimiter, adminBasicAuth, handleAdminSubmit);

// JWT-based Admin API (used by the React /admin panel)
adminRouter.post("/admin/login", adminRateLimiter, adminApiLogin);

// Invoices
adminRouter.get("/admin/invoices", adminRateLimiter, requireAdminJwt, getAdminInvoices);
adminRouter.get("/admin/invoices/:invoiceId/pdf", adminRateLimiter, requireAdminJwt, downloadAdminInvoice);
adminRouter.post("/admin/invoices/bulk-download", adminRateLimiter, requireAdminJwt, bulkDownloadAdminInvoices);

// Delivery Logs
adminRouter.get("/admin/delivery-logs", adminRateLimiter, requireAdminJwt, getAdminDeliveryLogs);

// Users & Purchases
adminRouter.get("/admin/users", adminRateLimiter, requireAdminJwt, getAdminUsers);
adminRouter.delete("/admin/purchases/:userUuid/:slug", adminRateLimiter, requireAdminJwt, deleteAdminPurchase);

// Products
adminRouter.get("/admin/products", adminRateLimiter, requireAdminJwt, getAdminProducts);
adminRouter.post("/admin/products", adminRateLimiter, requireAdminJwt, createAdminProduct);
adminRouter.patch("/admin/products/:id", adminRateLimiter, requireAdminJwt, updateAdminProduct);
adminRouter.delete("/admin/products/:id", adminRateLimiter, requireAdminJwt, deleteAdminProduct);

// POD Agreement (called from checkout)
adminRouter.post("/pod/agreement", storePodAgreement);

export default adminRouter;
