type LayoutParams = {
    title: string;
    preheader: string;
    intro: string;
    bodyHtml: string;
};

export const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

export const renderEmailLayout = ({ title, preheader, intro, bodyHtml }: LayoutParams) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>PayXpress Solutions</title>
  <style>
    @media only screen and (max-width: 600px) {
      .px-card {
        padding: 24px 18px !important;
      }
      .px-title {
        font-size: 22px !important;
      }
      .px-btn {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f0eb;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f0eb;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;">
          <tr>
            <td align="center" style="padding:0 0 20px 0;">
              <img src="https://payxpress-solutions.com/logo.png" alt="PayXpress Solutions" width="160" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:100%;margin:0 auto;" />
            </td>
          </tr>
          <tr>
            <td class="px-card" style="background-color:#ffffff;border:1px solid #efe5db;border-radius:14px;padding:34px 30px;box-shadow:0 4px 16px rgba(16,24,40,0.06);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:0 0 8px 0;">
                    <h1 class="px-title" style="margin:0;color:#1f2937;font-size:26px;line-height:1.25;font-weight:700;font-family:Arial,Helvetica,sans-serif;">${title}</h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 24px 0;">
                    <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">${intro}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;">
                    ${bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 8px 0 8px;">
              <p style="margin:0 0 6px 0;color:#6b7280;font-size:12px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">&copy; ${new Date().getFullYear()} PayXpress Solutions. All rights reserved.</p>
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">This is an automated security email. Please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;