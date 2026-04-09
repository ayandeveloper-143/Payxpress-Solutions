
import { createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { db } from "../config/db.js";
import { buildLoginAlertEmail } from "./email-templates/login-alert.template.js";
import { buildPasswordResetEmail } from "./email-templates/password-reset.template.js";
import { buildSignupVerificationEmail } from "./email-templates/signup-verification.template.js";
import { renderEmailLayout, escapeHtml } from "././email-templates/shared.js";


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
  emailType: string;
}) => {
  if (!transporter) {
    console.warn("SMTP not configured. Skipping email send.", {
      to: params.to,
      subject: params.subject,
    });
    await insertEmailLog(params.to, params.subject, params.emailType, "skipped", null);
    return;
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    await insertEmailLog(params.to, params.subject, params.emailType, "sent", null);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await insertEmailLog(params.to, params.subject, params.emailType, "failed", errMsg);
    throw err;
  }
};

const insertEmailLog = async (
  recipient: string,
  subject: string,
  emailType: string,
  status: "sent" | "failed" | "skipped",
  errorMsg: string | null
): Promise<void> => {
  try {
    await db.execute(
      `INSERT INTO email_logs (recipient, subject, email_type, status, error_msg)
       VALUES (?, ?, ?, ?, ?)`,
      [recipient, subject, emailType, status, errorMsg]
    );
  } catch (logErr) {
    // Non-fatal: email_logs table may not exist yet (run migration script first)
    console.error("[email-log] Failed to insert email log:", logErr);
  }
};

export const hashOtpCode = (value: string) => createHash("sha256").update(value).digest("hex");

export const sendSignupVerificationEmail = async (to: string, name: string, verificationLink: string) => {
  const { subject, text, html } = buildSignupVerificationEmail({ name, verificationLink });

  await sendMail({ to, subject, text, html, emailType: "signup_verification" });
};

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  const { subject, text, html } = buildPasswordResetEmail({ resetLink });

  await sendMail({ to, subject, text, html, emailType: "password_reset" });
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

  await sendMail({ to: params.to, subject, text, html, emailType: "login_alert" });
};


export const sendPaymentSuccessEmail = async (params: {
  to: string;
  name: string;
  orderId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentTime: string;
  pdfPath: string;
}) => {
  const subject = `Payment Successful - Invoice #${params.invoiceId}`;
  const html = renderEmailLayout({
    title: "Payment Successful",
    preheader: `Thank you, ${params.name}! Your payment was successful.`,
    intro: `We are pleased to inform you that your payment for Order ID ${params.orderId} has been successfully processed. Below are the details of your transaction:`,
    bodyHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:0 0 12px 0;">
            <div style="height:1px;background-color:#eee;line-height:1px;font-size:1px;">&nbsp;</div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 18px 0;">
            <p style="margin:0;color:#333;font-size:15px;line-height:1.6;font-family:'Inter',sans-serif;">Order ID: <strong>${params.orderId}</strong></p>
            <p style="margin:0;color:#333;font-size:15px;line-height:1.6;font-family:'Inter',sans-serif;">Invoice ID: <strong>${params.invoiceId}</strong></p>
            <p style="margin:0;color:#333;font-size:15px;line-height:1.6;font-family:'Inter',sans-serif;">Amount Paid: <strong>₹${params.amount}</strong></p>
            <p style="margin:0;color:#333;font-size:15px;line-height:1.6;font-family:'Inter',sans-serif;">Payment Method: <strong>${params.paymentMethod}</strong></p>
            <p style="margin:0;color:#333;font-size:15px;line-height:1.6;font-family:'Inter',sans-serif;">Payment Time: <strong>${params.paymentTime}</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 0 0 0;">
            <p style="margin:0;color:#333;font-size:15px;line-height:1.6;font-family:'Inter',sans-serif;">Your invoice PDF is attached with this email.</p>
          </td>
        </tr>
      </table>
    `,
  });

  const text = `Thank you, ${params.name}! Your payment was successful.\n\nOrder ID: ${params.orderId}\nInvoice ID: ${params.invoiceId}\nAmount Paid: ₹${params.amount}\nPayment Method: ${params.paymentMethod}\nPayment Time: ${params.paymentTime}\n\nYour invoice PDF is attached with this email.`;

  if (!transporter) {
    console.warn("SMTP not configured. Skipping payment success email.", { to: params.to, subject });
    await insertEmailLog(params.to, subject, "payment_success", "skipped", null);
    return;
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: params.to,
      subject,
      html,
      text,
      attachments: [
        {
          filename: `Invoice-${params.invoiceId}.pdf`,
          path: params.pdfPath,
          contentType: "application/pdf",
        },
      ],
    });
    await insertEmailLog(params.to, subject, "payment_success", "sent", null);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await insertEmailLog(params.to, subject, "payment_success", "failed", errMsg);
    throw err;
  }
};
