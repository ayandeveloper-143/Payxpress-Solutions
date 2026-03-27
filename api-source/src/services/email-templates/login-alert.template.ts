import { escapeHtml, renderEmailLayout } from "./shared.js";

type LoginAlertTemplateParams = {
    name: string;
    deviceInfo: string;
    browserInfo: string;
    ipAddress: string;
    loginDateTime: string;
    secureAccountLink: string;
};

const infoRow = (label: string, value: string) => `
  <tr>
    <td style="padding:9px 0;border-bottom:1px solid #f3e8dc;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="color:#6b7280;font-size:13px;line-height:1.4;font-family:Arial,Helvetica,sans-serif;width:36%;vertical-align:top;">${label}</td>
          <td style="color:#111827;font-size:13px;line-height:1.4;font-family:Arial,Helvetica,sans-serif;font-weight:600;vertical-align:top;">${value}</td>
        </tr>
      </table>
    </td>
  </tr>
`;

export const buildLoginAlertEmail = ({
    name,
    deviceInfo,
    browserInfo,
    ipAddress,
    loginDateTime,
    secureAccountLink,
}: LoginAlertTemplateParams) => {
    const safeName = escapeHtml(name);
    const safeDeviceInfo = escapeHtml(deviceInfo);
    const safeBrowserInfo = escapeHtml(browserInfo);
    const safeIpAddress = escapeHtml(ipAddress);
    const safeLoginDateTime = escapeHtml(loginDateTime);
    const safeSecureAccountLink = escapeHtml(secureAccountLink);

    const subject = "Login alert for your PayXpress account";
    const text = `Hi ${name},\n\nWe noticed a login to your PayXpress account.\n\nDevice: ${deviceInfo}\nBrowser: ${browserInfo}\nIP Address: ${ipAddress}\nDate & Time: ${loginDateTime}\n\nIf this was not you, secure your account immediately: ${secureAccountLink}`;

    const html = renderEmailLayout({
        title: "New login detected",
        preheader: "A login was detected on your PayXpress account.",
        intro: `Hi <strong style="color:#111827;">${safeName}</strong>, we detected a successful login to your account.`,
        bodyHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:0 0 16px 0;">
            <div style="height:1px;background-color:#efe5db;line-height:1px;font-size:1px;">&nbsp;</div>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 14px;background-color:#fffbeb;border:1px solid #fde68a;border-radius:10px;">
            <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">If this login was not you, secure your account right away and reset your password.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 0 8px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #f3e8dc;">
              ${infoRow("Device", safeDeviceInfo)}
              ${infoRow("Browser", safeBrowserInfo)}
              ${infoRow("IP Address", safeIpAddress)}
              ${infoRow("Date & Time", safeLoginDateTime)}
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:18px 0 12px 0;">
            <a class="px-btn" href="${safeSecureAccountLink}" style="display:inline-block;background-color:#b91c1c;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;font-family:Arial,Helvetica,sans-serif;line-height:1;padding:13px 26px;border-radius:10px;">Secure Account</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0;">
            <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">If the button is unavailable, open this link manually:</p>
            <p style="margin:6px 0 0 0;word-break:break-word;"><a href="${safeSecureAccountLink}" style="color:#0f4c81;text-decoration:underline;font-size:12px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">${safeSecureAccountLink}</a></p>
          </td>
        </tr>
      </table>
    `,
    });

    return { subject, text, html };
};