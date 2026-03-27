import { createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { buildLoginAlertEmail } from "./email-templates/login-alert.template.js";
import { buildPasswordResetEmail } from "./email-templates/password-reset.template.js";
import { buildSignupVerificationEmail } from "./email-templates/signup-verification.template.js";

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
  const { subject, text, html } = buildSignupVerificationEmail({ name, verificationLink });

  await sendMail({ to, subject, text, html });
};

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  const { subject, text, html } = buildPasswordResetEmail({ resetLink });

  await sendMail({ to, subject, text, html });
};

export const sendLoginAlertEmail = async (params: {
  to: string;
  name: string;
  deviceInfo: string;
  browserInfo: string;
  ipAddress: string;
  loginDateTime: string;
  secureAccountLink?: string;
}) => {
  const { subject, text, html } = buildLoginAlertEmail({
    name: params.name,
    deviceInfo: params.deviceInfo,
    browserInfo: params.browserInfo,
    ipAddress: params.ipAddress,
    loginDateTime: params.loginDateTime,
    secureAccountLink: params.secureAccountLink ?? `${env.clientOrigin}/auth`,
  });

  await sendMail({ to: params.to, subject, text, html });
};
