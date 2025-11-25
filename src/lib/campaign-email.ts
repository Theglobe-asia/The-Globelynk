// src/lib/campaign-email.ts

export type CampaignTemplateKey = "classic" | "minimal" | "spotlight";

export type CampaignPayload = {
  templateKey?: CampaignTemplateKey;
  subject: string;
  body: string;

  bannerUrl?: string;
  ctaText?: string;
  ctaUrl?: string;

  leftImageUrl?: string;
  leftImageLabel?: string;
  rightImageUrl?: string;
  rightImageLabel?: string;
};

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function linkify(input: string) {
  return input.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#b8860b; font-weight:bold; text-decoration:none;">$1</a>'
  );
}

function normalizeBody(body: string) {
  const escaped = escapeHtml(body);
  const withBreaks = escaped.replace(/\n/g, "<br>");
  return linkify(withBreaks);
}

export function buildCampaignEmail(payload: CampaignPayload): string {
  const {
    templateKey = "classic",
    subject,
    body,
    bannerUrl,
    ctaText,
    ctaUrl,
    leftImageUrl,
    leftImageLabel,
    rightImageUrl,
    rightImageLabel,
  } = payload;

  const bodyHtml = normalizeBody(body);

  const bannerBlock = bannerUrl
    ? `
      <tr>
        <td>
          <img src="${bannerUrl}" width="600" alt="Banner" style="width:100%; max-width:600px; height:auto;" />
        </td>
      </tr>
    `
    : "";

  const ctaBlock =
    ctaText && ctaUrl
      ? `
      <tr>
        <td align="center" style="padding:20px;">
          <a href="${ctaUrl}" style="
            background:#c7080f;
            color:#ffffff;
            padding:12px 20px;
            border-radius:4px;
            display:inline-block;
            font-family:Arial, sans-serif;
            font-size:14px;
            text-decoration:none;">
            ${ctaText}
          </a>
        </td>
      </tr>
    `
      : "";

  const twoColumnBlock =
    leftImageUrl || rightImageUrl
      ? `
      <tr>
        <td style="padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" align="center" valign="top" style="padding:10px;">
                ${
                  leftImageUrl
                    ? `<img src="${leftImageUrl}" width="250" style="width:100%; max-width:250px; height:auto;" />`
                    : ""
                }
                ${
                  leftImageLabel
                    ? `<p style="font-family:Arial; font-size:14px; margin:8px 0 0 0;">${escapeHtml(
                        leftImageLabel
                      )}</p>`
                    : ""
                }
              </td>
              <td width="50%" align="center" valign="top" style="padding:10px;">
                ${
                  rightImageUrl
                    ? `<img src="${rightImageUrl}" width="250" style="width:100%; max-width:250px; height:auto;" />`
                    : ""
                }
                ${
                  rightImageLabel
                    ? `<p style="font-family:Arial; font-size:14px; margin:8px 0 0 0;">${escapeHtml(
                        rightImageLabel
                      )}</p>`
                    : ""
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
      : "";

  const signatureBlock = `
  <tr>
    <td style="padding:20px; font-family:Arial,Helvetica,sans-serif; font-size:12px; text-align:center; color:#777;">
      © ${new Date().getFullYear()} The Globe in Pattaya — Developed by Chef Alex<br/>
      <a href="https://theglobeasia.com" style="color:#777; text-decoration:none;">theglobeasia.com</a>
    </td>
  </tr>
  `;

  // ---------- Layout Variants ----------
  const layouts: Record<CampaignTemplateKey, string> = {
    classic: `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
  <style>
    body { margin:0; padding:0; background:#ffffff; }
    table { border-collapse:collapse; }
    img { border:0; outline:none; text-decoration:none; display:block; }
    .container { width:100%; background:#ffffff; }
    .inner { max-width:600px; margin:auto; background:#ffffff; }
    @media only screen and (max-width:480px){
      .inner{ width:100%!important; }
      h1,h2,h3{ font-size:18px!important; }
      .btn{ width:100%!important; display:block!important; }
    }
  </style>
</head>
<body>
  <table width="100%" class="container" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="600" class="inner" cellpadding="0" cellspacing="0">
        ${bannerBlock}

        <tr>
          <td style="padding:20px; font-family:Arial; text-align:center;">
            <h1 style="font-size:24px; margin:0;">${escapeHtml(subject)}</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:20px; font-family:Arial; font-size:16px; line-height:24px; color:#333;">
            ${bodyHtml}
          </td>
        </tr>

        ${ctaBlock}
        ${twoColumnBlock}
        ${signatureBlock}
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,

    minimal: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#fff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:auto;padding:24px;">
    ${bannerUrl ? `<img src="${bannerUrl}" style="width:100%;border-radius:10px;margin-bottom:16px;" />` : ""}
    <h1 style="font-size:22px;margin:0 0 12px 0;">${escapeHtml(subject)}</h1>
    <div style="font-size:15px;line-height:1.6;color:#333;">${bodyHtml}</div>
    ${ctaBlock}
    ${twoColumnBlock}
    <div style="margin-top:18px;font-size:12px;color:#888;text-align:center;">
      The Globe’s Hidden Gem • Pattaya, Thailand
    </div>
  </div>
</body>
</html>
    `,

    spotlight: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:auto;background:#ffffff;">
    ${bannerBlock}
    <div style="padding:24px;">
      <h1 style="font-size:24px;margin:0 0 12px 0;color:#000;">${escapeHtml(subject)}</h1>
      <div style="font-size:15px;line-height:1.7;color:#222;">${bodyHtml}</div>
      ${ctaBlock}
      ${twoColumnBlock}
    </div>
    ${signatureBlock}
  </div>
</body>
</html>
    `,
  };

  return layouts[templateKey];
}
