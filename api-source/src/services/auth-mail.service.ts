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

const emailLayout = (content: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PayXpress</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f0eb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#ff7a00;border-radius:12px;padding:10px 20px;">
                    <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;text-decoration:none;">
                      Pay<span style="color:#fff3e8;">Xpress</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;padding:40px 40px 32px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 6px;font-size:13px;color:#9b7a5e;">
                © ${new Date().getFullYear()} PayXpress Solutions. All rights reserved.
              </p>
              <p style="margin:0;font-size:12px;color:#b89880;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const hashOtpCode = (value: string) => createHash("sha256").update(value).digest("hex");

export const sendSignupVerificationEmail = async (to: string, name: string, verificationLink: string) => {
  const subject = "Verify your PayXpress account";
  const text = `Hi ${name},\n\nClick this link to verify your account:\n${verificationLink}\n\nThis link expires in 24 hours.\n\nIf you did not create a PayXpress account, you can safely ignore this email.`;
  const html = emailLayout(`
      <!-- Icon -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;width:64px;height:64px;background:linear-gradient(135deg,#fff3e8 0%,#ffe0c4 100%);border-radius:50%;line-height:64px;font-size:28px;">
          ✉️
        </div>
      </div>

      <!-- Title -->
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1f1f1f;text-align:center;letter-spacing:-0.3px;">
        Verify your email address
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#737373;text-align:center;line-height:1.5;">
        Hi <strong style="color:#1f1f1f;">${name}</strong>, welcome to PayXpress! Please verify your email to activate your account.
      </p>

      <!-- Divider -->
      <hr style="border:none;border-top:1px solid #e8d9cc;margin:0 0 28px;" />

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${verificationLink}"
           style="display:inline-block;padding:14px 36px;background-color:#ff7a00;color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.2px;">
          Verify Email Address
        </a>
      </div>

      <!-- Expiry note -->
      <p style="margin:0 0 20px;font-size:13px;color:#737373;text-align:center;">
        ⏱ This link expires in <strong>24 hours</strong>.
      </p>

      <!-- Divider -->
      <hr style="border:none;border-top:1px solid #e8d9cc;margin:0 0 20px;" />

      <!-- Fallback link -->
      <p style="margin:0 0 8px;font-size:13px;color:#737373;">
        If the button above doesn't work, copy and paste this URL into your browser:
      </p>
      <p style="margin:0 0 20px;word-break:break-all;">
        <a href="${verificationLink}" style="font-size:13px;color:#0052cc;text-decoration:underline;">${verificationLink}</a>
      </p>

      <!-- Safety note -->
      <div style="background-color:#f9f3ee;border-radius:10px;padding:14px 16px;">
        <p style="margin:0;font-size:13px;color:#9b7a5e;line-height:1.5;">
          🔒 If you didn't create a PayXpress account, you can safely ignore this email. Your email address will not be used.
        </p>
      </div>
    `);

  await sendMail({ to, subject, text, html });
};

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  const subject = "Reset your PayXpress password";
  const text = `A password reset was requested for your PayXpress account.\n\nClick this link to set a new password:\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email. Your password will remain unchanged.`;
  const html = emailLayout(`
      <!-- Icon -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;width:64px;height:64px;background:linear-gradient(135deg,#e8f0ff 0%,#c4d8ff 100%);border-radius:50%;line-height:64px;font-size:28px;">
          🔐
        </div>
      </div>

      <!-- Title -->
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1f1f1f;text-align:center;letter-spacing:-0.3px;">
        Reset your password
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#737373;text-align:center;line-height:1.5;">
        We received a request to reset your <strong style="color:#1f1f1f;">PayXpress</strong> account password. Click the button below to proceed.
      </p>

      <!-- Divider -->
      <hr style="border:none;border-top:1px solid #e8d9cc;margin:0 0 28px;" />

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${resetLink}"
           style="display:inline-block;padding:14px 36px;background-color:#0052cc;color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.2px;">
          Reset Password
        </a>
      </div>

      <!-- Expiry note -->
      <p style="margin:0 0 20px;font-size:13px;color:#737373;text-align:center;">
        ⏱ This link expires in <strong>1 hour</strong>.
      </p>

      <!-- Divider -->
      <hr style="border:none;border-top:1px solid #e8d9cc;margin:0 0 20px;" />

      <!-- Fallback link -->
      <p style="margin:0 0 8px;font-size:13px;color:#737373;">
        If the button above doesn't work, copy and paste this URL into your browser:
      </p>
      <p style="margin:0 0 20px;word-break:break-all;">
        <a href="${resetLink}" style="font-size:13px;color:#0052cc;text-decoration:underline;">${resetLink}</a>
      </p>

      <!-- Safety note -->
      <div style="background-color:#f9f3ee;border-radius:10px;padding:14px 16px;">
        <p style="margin:0;font-size:13px;color:#9b7a5e;line-height:1.5;">
          🔒 If you didn't request a password reset, please ignore this email. Your password will remain unchanged and your account is safe.
        </p>
      </div>
    `);

  await sendMail({ to, subject, text, html });
};
