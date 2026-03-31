import { Router } from "express";
import { adminBasicAuth, getAdminPage, handleAdminSubmit, adminRateLimiter } from "../controllers/admin.controller.js";

const adminRouter = Router();

adminRouter.get("/admin/secrect/c228d919dk", adminRateLimiter, adminBasicAuth, getAdminPage);
adminRouter.post("/admin/secrect/c228d919dk/submit", adminRateLimiter, adminBasicAuth, handleAdminSubmit);

export default adminRouter;
