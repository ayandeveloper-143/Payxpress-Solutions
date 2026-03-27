import { renderEmailLayout, escapeHtml } from "./shared.js";

type PasswordResetTemplateParams = {
    resetLink: string;
};

export const buildPasswordResetEmail = ({ resetLink }: PasswordResetTemplateParams) => {
    const safeLink = escapeHtml(resetLink);

    const subject = "Reset your PayXpress password";
    const text = `A password reset was requested for your PayXpress account.\n\nClick this link to set a new password:\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email. Your password will remain unchanged.`;

    const html = renderEmailLayout({
        title: "Reset your password",
        preheader: "A secure link to reset your PayXpress password.",
        intro: "We received a request to reset your PayXpress account password.",
        bodyHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:0 0 22px 0;">
            <div style="height:1px;background-color:#efe5db;line-height:1px;font-size:1px;">&nbsp;</div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 0 18px 0;">
            <a class="px-btn" href="${safeLink}" style="display:inline-block;background-color:#0f4c81;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;font-family:Arial,Helvetica,sans-serif;line-height:1;padding:13px 26px;border-radius:10px;">Reset Password</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 0 18px 0;">
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">Link expiry: <strong style="color:#111827;">1 hour</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 8px 0;">
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">If the button does not work, copy and paste this URL into your browser:</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 18px 0;word-break:break-word;">
            <a href="${safeLink}" style="color:#0f4c81;text-decoration:underline;font-size:13px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">${safeLink}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 14px;background-color:#fef2f2;border:1px solid #fee2e2;border-radius:10px;">
            <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">If you did not request this reset, ignore this email. Your current password remains active.</p>
          </td>
        </tr>
      </table>
    `,
    });

    return { subject, text, html };
};