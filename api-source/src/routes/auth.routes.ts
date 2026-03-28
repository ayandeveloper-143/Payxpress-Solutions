import { Router } from "express";
import {
    getCurrentUser,
    login,
    logout,
    startForgotPassword,
    resetPasswordWithToken,
    signup,
    verifySignupLink,
    changePassword,
} from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/auth/signup", signup);
authRouter.post("/auth/signup/verify-link", verifySignupLink);
authRouter.post("/auth/login", login);
authRouter.get("/auth/me", getCurrentUser);
authRouter.post("/auth/logout", logout);
authRouter.post("/auth/forgot-password/start", startForgotPassword);
authRouter.post("/auth/forgot-password/reset", resetPasswordWithToken);
authRouter.post("/auth/change-password", changePassword);

export default authRouter;
