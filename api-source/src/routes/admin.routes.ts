import { Router } from "express";
import { getAdminPage, handleAdminSubmit, adminRateLimiter } from "../controllers/admin.controller.js";

const adminRouter = Router();

adminRouter.get("/admin/secrect/c228d919dk", adminRateLimiter, getAdminPage);
adminRouter.post("/admin/secrect/c228d919dk", adminRateLimiter, handleAdminSubmit);

export default adminRouter;
