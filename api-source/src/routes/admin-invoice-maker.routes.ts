import { Router } from "express";
import { adminRateLimiter, requireAdminJwt } from "../controllers/admin.controller.js";
import { generateAdminPreviewPdf } from "../controllers/admin-invoice-maker.controller.js";

const adminInvoiceMakerRouter = Router();

adminInvoiceMakerRouter.post(
    "/admin/invoice-maker/pdf",
    adminRateLimiter,
    requireAdminJwt,
    generateAdminPreviewPdf
);

export default adminInvoiceMakerRouter;
