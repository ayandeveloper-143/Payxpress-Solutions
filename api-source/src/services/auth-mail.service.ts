import { createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const hasMailConfig = Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

const transporter = hasMailConfig
    ? nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpSecure,
        auth: {
            user: env.smtpUser,
            pass: env.smtpPass,
        },
        tls: {
            servername: env.smtpTlsServername || undefined,
            rejectUnauthorized: env.smtpTlsRejectUnauthorized,
        },
    })
    : null;

const fromAddress = env.mailFrom || env.smtpUser || "no-reply@example.com";

const sendMail = async (params: {
    to: string;
    subject: string;
    html: string;
    text: string;
}) => {
    if (!transporter) {
        console.warn("SMTP not configured. Skipping email send.", {
            to: params.to,
            subject: params.subject,
        });
        return;
    }

    await transporter.sendMail({
        from: fromAddress,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
    });
};

export const hashOtpCode = (value: string) => createHash("sha256").update(value).digest("hex");

export const sendSignupVerificationEmail = async (to: string, name: string, verificationLink: string) => {
    const subject = "Verify your PayXpress account";
    const text = `Hi ${name},\n\nClick this link to verify your account:\n${verificationLink}\n\nIf you did not request this, you can ignore this email.`;
    const html = `
        <p>Hi ${name},</p>
        <p>Click the button below to verify your account.</p>
        <p><a href="${verificationLink}" style="display:inline-block;padding:10px 16px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;">Verify Email</a></p>
        <p>If the button does not work, copy and paste this URL:</p>
        <p>${verificationLink}</p>
    `;

    await sendMail({ to, subject, text, html });
};

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
    const subject = "Reset your PayXpress password";
    const text = `A password reset was requested for your account. Click this link to set a new password:\n${resetLink}\n\nIf you did not request this, please ignore this email.`;
    const html = `
        <p>A password reset was requested for your account.</p>
        <p><a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
        <p>If the button does not work, copy and paste this URL:</p>
        <p>${resetLink}</p>
    `;

    await sendMail({ to, subject, text, html });
};
