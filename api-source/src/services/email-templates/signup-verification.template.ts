import { escapeHtml, renderEmailLayout } from "./shared.js";

type SignupVerificationTemplateParams = {
    name: string;
    verificationLink: string;
};

export const buildSignupVerificationEmail = ({
    name,
    verificationLink,
}: SignupVerificationTemplateParams) => {
    const safeName = escapeHtml(name);
    const safeLink = escapeHtml(verificationLink);

    const subject = "Verify your PayXpress account";
    const text = `Hi ${name},\n\nClick this link to verify your account:\n${verificationLink}\n\nThis link expires in 24 hours.\n\nIf you did not create a PayXpress account, you can safely ignore this email.`;

    const html = renderEmailLayout({
        title: "Verify your email",
        preheader: "Confirm your PayXpress account in one step.",
        intro: `Hi <strong style="color:#111827;">${safeName}</strong>, please confirm your email to activate your PayXpress account.`,
        bodyHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:0 0 22px 0;">
            <div style="height:1px;background-color:#efe5db;line-height:1px;font-size:1px;">&nbsp;</div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 0 18px 0;">
            <a class="px-btn" href="${safeLink}" style="display:inline-block;background-color:#f97316;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;font-family:Arial,Helvetica,sans-serif;line-height:1;padding:13px 26px;border-radius:10px;">Verify Email Address</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 0 18px 0;">
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">Link expiry: <strong style="color:#111827;">24 hours</strong></p>
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
          <td style="padding:12px 14px;background-color:#fff7ed;border:1px solid #ffedd5;border-radius:10px;">
            <p style="margin:0;color:#7c2d12;font-size:13px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">If you did not sign up for PayXpress, you can safely ignore this message.</p>
          </td>
        </tr>
      </table>
    `,
    });

    return { subject, text, html };
};