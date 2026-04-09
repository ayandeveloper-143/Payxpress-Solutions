import { createHash, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import {
    sendLoginAlertEmail,
    sendPasswordResetEmail,
    sendSignupVerificationEmail,
} from "../services/auth-mail.service.js";
import { getClientIp } from "../utils/delivery-log.js";

const signupSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(255),
    password: z.string().min(6).max(128),
});

const loginSchema = z.object({
    email: z.string().trim().email().max(255),
    password: z.string().min(6).max(128),
});

const forgotPasswordStartSchema = z.object({
    email: z.string().trim().email().max(255),
});

const forgotPasswordResetSchema = z.object({
    token: z.string().trim().min(20),
    newPassword: z.string().min(6).max(128),
});

type UserRecord = {
    id: number;
    uuid: string;
    name: string;
    email: string;
    password_hash: string;
    is_verified: number;
    order_history: unknown;
};

type OrderHistoryItem = {
    slug: string;
    purchasedAt: string;
};

const parseOrderHistory = (value: unknown): OrderHistoryItem[] => {
    const normalized =
        typeof value === "string"
            ? (() => {
                try {
                    return JSON.parse(value);
                } catch {
                    return null;
                }
            })()
            : value;

    if (!Array.isArray(normalized)) {
        return [];
    }

    return normalized
        .map((entry) => {
            if (
                typeof entry !== "object" ||
                entry === null ||
                typeof (entry as { slug?: unknown }).slug !== "string" ||
                typeof (entry as { purchasedAt?: unknown }).purchasedAt !== "string"
            ) {
                return null;
            }

            return {
                slug: (entry as { slug: string }).slug,
                purchasedAt: (entry as { purchasedAt: string }).purchasedAt,
            };
        })
        .filter((entry): entry is OrderHistoryItem => entry !== null);
};

type AccessTokenPayload = {
    sub: string;
    email: string;
    name: string;
};

type ActionTokenPayload = {
    purpose: "signup" | "reset";
    email: string;
    passwordHash?: string;
};

const hashAccessToken = (token: string) => createHash("sha256").update(token).digest("hex");

const getAccessTokenExpiryDate = (token: string) => {
    const decoded = jwt.decode(token);

    if (typeof decoded === "object" && decoded !== null && typeof decoded.exp === "number") {
        return new Date(decoded.exp * 1000);
    }

    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 7);
    return fallbackDate;
};

const persistAccessToken = async (params: {
    token: string;
    userUuid: string;
    request: Request;
}) => {
    await db.execute(
        `INSERT INTO auth_sessions (user_uuid, token_hash, expires_at, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?)`,
        [
            params.userUuid,
            hashAccessToken(params.token),
            getAccessTokenExpiryDate(params.token),
            getClientIp(params.request) || null,
            params.request.get("user-agent") ?? null,
        ]
    );
};

const isAccessTokenActive = async (params: { token: string; userUuid: string }) => {
    const [rows] = await db.query(
        `SELECT id
         FROM auth_sessions
         WHERE user_uuid = ?
           AND token_hash = ?
           AND revoked_at IS NULL
           AND expires_at > NOW()
         LIMIT 1`,
        [params.userUuid, hashAccessToken(params.token)]
    );

    return (rows as Array<{ id: number }>).length > 0;
};


const revokeAccessToken = async (params: { token: string; userUuid: string }) => {
    await db.execute(
        `UPDATE auth_sessions
         SET revoked_at = NOW()
         WHERE user_uuid = ?
           AND token_hash = ?
           AND revoked_at IS NULL`,
        [params.userUuid, hashAccessToken(params.token)]
    );
};

// Revoke all access tokens for a user (logout everywhere)
const revokeAllAccessTokens = async (userUuid: string) => {
    await db.execute(
        `UPDATE auth_sessions
         SET revoked_at = NOW()
         WHERE user_uuid = ?
           AND revoked_at IS NULL`,
        [userUuid]
    );
};

const getBearerToken = (request: Request) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
};

const signAccessToken = (user: { uuid: string; email: string; name: string }) => {
    const options: jwt.SignOptions = {
        subject: user.uuid,
        expiresIn: env.jwtAccessExpiry as jwt.SignOptions["expiresIn"],
    };

    return jwt.sign({ email: user.email, name: user.name }, env.jwtAccessSecret, {
        ...options,
    });
};

const signActionToken = (payload: ActionTokenPayload) => {
    const options: jwt.SignOptions = {
        expiresIn: `${env.otpExpiryMinutes}m` as jwt.SignOptions["expiresIn"],
    };

    return jwt.sign(payload, env.jwtActionSecret, {
        ...options,
    });
};

const verifyActionToken = (token: string): ActionTokenPayload | null => {
    try {
        const decoded = jwt.verify(token, env.jwtActionSecret);

        if (typeof decoded !== "object" || decoded === null) {
            return null;
        }

        if (decoded.purpose !== "signup" && decoded.purpose !== "reset") {
            return null;
        }

        if (typeof decoded.email !== "string") {
            return null;
        }

        if (decoded.passwordHash !== undefined && typeof decoded.passwordHash !== "string") {
            return null;
        }

        return {
            purpose: decoded.purpose,
            email: decoded.email,
            passwordHash: decoded.passwordHash,
        };
    } catch {
        return null;
    }
};

const verifyAccessToken = (token: string): AccessTokenPayload | null => {
    try {
        const decoded = jwt.verify(token, env.jwtAccessSecret);

        if (typeof decoded !== "object" || decoded === null) {
            return null;
        }

        if (typeof decoded.sub !== "string") {
            return null;
        }

        if (typeof decoded.email !== "string" || typeof decoded.name !== "string") {
            return null;
        }

        return {
            sub: decoded.sub,
            email: decoded.email,
            name: decoded.name,
        };
    } catch {
        return null;
    }
};

const parseBrowserInfo = (userAgent: string) => {
    if (/Edg\//i.test(userAgent)) return "Microsoft Edge";
    if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent)) return "Opera";
    if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) return "Google Chrome";
    if (/Firefox\//i.test(userAgent)) return "Mozilla Firefox";
    if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return "Safari";
    return "Unknown Browser";
};

const parseDeviceInfo = (userAgent: string) => {
    if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS Device";
    if (/Android/i.test(userAgent)) return "Android Device";
    if (/Windows/i.test(userAgent)) return "Windows Device";
    if (/Macintosh|Mac OS X/i.test(userAgent)) return "macOS Device";
    if (/Linux/i.test(userAgent)) return "Linux Device";
    return "Unknown Device";
};

export const signup = async (request: Request, response: Response) => {
    try {
        const parsed = signupSchema.safeParse(request.body);

        if (!parsed.success) {
            const fieldErrors = parsed.error.flatten().fieldErrors;
            response.status(400).json({
                message: "Please check the highlighted fields.",
                code: "VALIDATION_ERROR",
                errors: fieldErrors,
            });
            return;
        }

        const { name, email, password } = parsed.data;
        const [rows] = await db.query(
            `SELECT id, uuid, name, email, password_hash, is_verified
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [email]
        );

        const existingUser = (rows as UserRecord[])[0];
        const passwordHash = await bcrypt.hash(password, 10);

        if (existingUser?.is_verified) {
            response.status(409).json({
                message: "An account with this email already exists.",
                code: "EMAIL_ALREADY_REGISTERED",
                field: "email",
            });
            return;
        }

        if (existingUser) {
            await db.execute(
                `UPDATE users
                 SET name = ?, password_hash = ?, is_verified = 0, updated_at = NOW()
                 WHERE email = ?`,
                [name, passwordHash, email]
            );
        } else {
            await db.execute(
                `INSERT INTO users (uuid, name, email, password_hash, is_verified)
                 VALUES (?, ?, ?, ?, 0)`,
                [randomUUID(), name, email, passwordHash]
            );
        }

        const token = signActionToken({
            purpose: "signup",
            email,
        });

        const verificationLink = `${env.clientOrigin}/auth?verifyToken=${encodeURIComponent(token)}`;
        await sendSignupVerificationEmail(email, name, verificationLink);

        response.status(200).json({
            message: "Verification link sent to your email.",
            requiresEmailVerification: true,
            email,
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({
            message: "Unable to complete signup right now. Please try again.",
            code: "SIGNUP_FAILED",
        });
    }
};

export const verifySignupLink = async (request: Request, response: Response) => {
    try {
        const queryToken = typeof request.query.token === "string" ? request.query.token : undefined;
        const bodyToken = typeof request.body?.token === "string" ? request.body.token : undefined;
        const token = queryToken ?? bodyToken;

        if (!token || token.length < 20) {
            response.status(400).json({
                message: "Verification token is invalid.",
                code: "INVALID_TOKEN",
                field: "token",
            });
            return;
        }

        const tokenPayload = verifyActionToken(token);

        if (!tokenPayload || tokenPayload.purpose !== "signup") {
            response.status(400).json({
                message: "Verification link is invalid or expired.",
                code: "INVALID_OR_EXPIRED_TOKEN",
                field: "token",
            });
            return;
        }

        const [rows] = await db.query(
            `SELECT id, uuid, name, email, password_hash, is_verified, order_history
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [tokenPayload.email]
        );

        const user = (rows as UserRecord[])[0];

        if (!user) {
            response.status(404).json({
                message: "No account found with this email.",
                code: "EMAIL_NOT_FOUND",
                field: "email",
            });
            return;
        }

        await db.execute(`UPDATE users SET is_verified = 1, updated_at = NOW() WHERE email = ?`, [
            tokenPayload.email,
        ]);

        response.status(200).json({
            message: "Email verified successfully. You can now log in.",
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({
            message: "Unable to verify email right now. Please try again.",
            code: "VERIFY_SIGNUP_FAILED",
        });
    }
};

export const login = async (request: Request, response: Response) => {
    try {
        const parsed = loginSchema.safeParse(request.body);

        if (!parsed.success) {
            const fieldErrors = parsed.error.flatten().fieldErrors;
            response.status(400).json({
                message: "Please check the highlighted fields.",
                code: "VALIDATION_ERROR",
                errors: fieldErrors,
            });
            return;
        }

        const { email, password } = parsed.data;
        const [rows] = await db.query(
            `SELECT id, uuid, name, email, password_hash, is_verified, order_history
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [email]
        );

        const user = (rows as UserRecord[])[0];

        if (!user) {
            response.status(401).json({
                message: "No account found with this email.",
                code: "EMAIL_NOT_FOUND",
                field: "email",
            });
            return;
        }

        if (!user.is_verified) {
            response.status(403).json({
                message: "No account found with this email.",
                code: "EMAIL_NOT_FOUND",
                field: "email",
            });
            return;
        }

        const passwordMatched = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatched) {
            response.status(401).json({
                message: "Incorrect password. Please try again.",
                code: "INVALID_PASSWORD",
                field: "password",
            });
            return;
        }


        // Revoke all previous sessions for this user (logout everywhere else)
        await revokeAllAccessTokens(user.uuid);

        const accessToken = signAccessToken({ uuid: user.uuid, email: user.email, name: user.name });
        await persistAccessToken({ token: accessToken, userUuid: user.uuid, request });

        const userAgent = request.get("user-agent") ?? "Unknown";
        const browserInfo = parseBrowserInfo(userAgent);
        const deviceInfo = parseDeviceInfo(userAgent);
        const ipAddress = getClientIp(request) || "Unknown";
        const loginDateTime = new Date().toUTCString();

        await sendLoginAlertEmail({
            to: user.email,
            name: user.name,
            deviceInfo,
            browserInfo,
            ipAddress,
            loginDateTime,
            secureAccountLink: `${env.clientOrigin}/auth`,
        }).catch((error) => {
            console.error("Failed to send login alert email", error);
        });

        response.status(200).json({
            message: "Login successful.",
            token: accessToken,
            user: {
                id: user.uuid,
                name: user.name,
                email: user.email,
                orderHistory: parseOrderHistory(user.order_history),
            },
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({
            message: "Unable to process login right now. Please try again.",
            code: "LOGIN_FAILED",
        });
    }
};

export const startForgotPassword = async (request: Request, response: Response) => {
    try {
        const parsed = forgotPasswordStartSchema.safeParse(request.body);

        if (!parsed.success) {
            const fieldErrors = parsed.error.flatten().fieldErrors;
            response.status(400).json({
                message: "Please check the highlighted fields.",
                code: "VALIDATION_ERROR",
                errors: fieldErrors,
            });
            return;
        }

        const { email } = parsed.data;
        const [rows] = await db.query(
            `SELECT id, uuid, name, email, password_hash, is_verified
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [email]
        );

        if ((rows as UserRecord[]).length === 0) {
            response.status(200).json({ message: "If this email is registered, a reset link has been sent." });
            return;
        }

        const user = (rows as UserRecord[])[0];
        const token = signActionToken({
            purpose: "reset",
            email,
            passwordHash: user.password_hash,
        });

        const resetLink = `${env.clientOrigin}/reset-password?token=${encodeURIComponent(token)}`;
        await sendPasswordResetEmail(email, resetLink);

        response.status(200).json({ message: "Password reset link sent to your email." });
    } catch (error) {
        console.error(error);
        response.status(500).json({
            message: "Unable to process forgot password right now. Please try again.",
            code: "FORGOT_PASSWORD_START_FAILED",
        });
    }
};

export const resetPasswordWithToken = async (request: Request, response: Response) => {
    try {
        const parsed = forgotPasswordResetSchema.safeParse(request.body);

        if (!parsed.success) {
            const fieldErrors = parsed.error.flatten().fieldErrors;
            response.status(400).json({
                message: "Please check the highlighted fields.",
                code: "VALIDATION_ERROR",
                errors: fieldErrors,
            });
            return;
        }

        const { token, newPassword } = parsed.data;
        const tokenPayload = verifyActionToken(token);

        if (!tokenPayload || tokenPayload.purpose !== "reset") {
            response.status(400).json({
                message: "Reset token is invalid or expired.",
                code: "INVALID_OR_EXPIRED_TOKEN",
                field: "token",
            });
            return;
        }

        const [rows] = await db.query(
            `SELECT id, uuid, name, email, password_hash, is_verified
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [tokenPayload.email]
        );

        const user = (rows as UserRecord[])[0];

        if (!user) {
            response.status(404).json({
                message: "No account found with this email.",
                code: "EMAIL_NOT_FOUND",
                field: "email",
            });
            return;
        }

        // Reset tokens become one-time because password hash changes after first successful use.
        if (!tokenPayload.passwordHash || tokenPayload.passwordHash !== user.password_hash) {
            response.status(400).json({
                message: "Reset token is invalid or expired.",
                code: "INVALID_OR_EXPIRED_TOKEN",
                field: "token",
            });
            return;
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await db.execute(`UPDATE users SET password_hash = ?, updated_at = NOW() WHERE email = ?`, [newPasswordHash, user.email]);

        response.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        console.error(error);
        response.status(500).json({
            message: "Unable to reset password right now. Please try again.",
            code: "RESET_PASSWORD_FAILED",
        });
    }
};

export const getCurrentUser = async (request: Request, response: Response) => {
    try {
        const token = getBearerToken(request);

        if (!token) {
            response.status(401).json({
                message: "Missing access token.",
                code: "MISSING_ACCESS_TOKEN",
                field: "token",
            });
            return;
        }

        const tokenPayload = verifyAccessToken(token);

        if (!tokenPayload) {
            response.status(401).json({
                message: "Invalid or expired access token.",
                code: "INVALID_OR_EXPIRED_ACCESS_TOKEN",
                field: "token",
            });
            return;
        }

        const activeToken = await isAccessTokenActive({ token, userUuid: tokenPayload.sub });

        if (!activeToken) {
            response.status(401).json({
                message: "Session expired or logged out.",
                code: "SESSION_INACTIVE",
                field: "token",
            });
            return;
        }

        const [rows] = await db.query(
            `SELECT id, uuid, name, email, password_hash, is_verified, order_history
             FROM users
             WHERE uuid = ?
             LIMIT 1`,
            [tokenPayload.sub]
        );

        const user = (rows as UserRecord[])[0];

        if (!user || !user.is_verified) {
            response.status(401).json({
                message: "User no longer authorized.",
                code: "USER_NOT_AUTHORIZED",
            });
            return;
        }

        response.status(200).json({
            user: {
                id: user.uuid,
                name: user.name,
                email: user.email,
                orderHistory: parseOrderHistory(user.order_history),
            },
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({
            message: "Unable to fetch current user right now. Please try again.",
            code: "GET_CURRENT_USER_FAILED",
        });
    }
};

export const logout = async (request: Request, response: Response) => {
    try {
        const token = getBearerToken(request);

        if (!token) {
            response.status(401).json({
                message: "Missing access token.",
                code: "MISSING_ACCESS_TOKEN",
                field: "token",
            });
            return;
        }

        const tokenPayload = verifyAccessToken(token);

        if (!tokenPayload) {
            response.status(401).json({
                message: "Invalid or expired access token.",
                code: "INVALID_OR_EXPIRED_ACCESS_TOKEN",
                field: "token",
            });
            return;
        }

        await revokeAccessToken({ token, userUuid: tokenPayload.sub });

        response.status(200).json({ message: "Logout successful." });
    } catch (error) {
        console.error(error);
        response.status(500).json({
            message: "Unable to logout right now. Please try again.",
            code: "LOGOUT_FAILED",
        });
    }
};

export const updateName = async (request: Request, response: Response) => {
    try {
        const { name } = request.body;
        if (!name || typeof name !== "string" || name.trim().length < 2) {
            response.status(400).json({ message: "A valid name (at least 2 characters) is required." });
            return;
        }
        const token = getBearerToken(request);
        if (!token) {
            response.status(401).json({ message: "Missing access token." });
            return;
        }
        const tokenPayload = verifyAccessToken(token);
        if (!tokenPayload) {
            response.status(401).json({ message: "Invalid or expired access token." });
            return;
        }
        const [rows] = await db.query(
            `SELECT id, uuid FROM users WHERE uuid = ? LIMIT 1`,
            [tokenPayload.sub]
        );
        const user = (rows as UserRecord[])[0];
        if (!user) {
            response.status(404).json({ message: "User not found." });
            return;
        }
        const trimmedName = name.trim();
        await db.execute(`UPDATE users SET name = ?, updated_at = NOW() WHERE uuid = ?`, [trimmedName, user.uuid]);
        response.status(200).json({ message: "Name updated successfully.", name: trimmedName });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Unable to update name right now." });
    }
};

export const changePassword = async (request: Request, response: Response) => {
    try {
        const { currentPassword, newPassword } = request.body;
        if (!currentPassword || !newPassword) {
            response.status(400).json({ message: "Current and new password are required." });
            return;
        }
        // Get user from token
        const token = getBearerToken(request);
        if (!token) {
            response.status(401).json({ message: "Missing access token." });
            return;
        }
        const tokenPayload = verifyAccessToken(token);
        if (!tokenPayload) {
            response.status(401).json({ message: "Invalid or expired access token." });
            return;
        }
        // Fetch user
        const [rows] = await db.query(
            `SELECT id, uuid, password_hash FROM users WHERE uuid = ? LIMIT 1`,
            [tokenPayload.sub]
        );
        const user = (rows as UserRecord[])[0];
        if (!user) {
            response.status(404).json({ message: "User not found." });
            return;
        }
        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            response.status(400).json({ message: "Current password is incorrect." });
            return;
        }
        // Update password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await db.execute(`UPDATE users SET password_hash = ?, updated_at = NOW() WHERE uuid = ?`, [newPasswordHash, user.uuid]);
        response.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Unable to change password right now." });
    }
};
