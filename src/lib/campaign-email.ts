// src/lib/campaign-email.ts

export type CampaignEmailOptions = {
  subject: string;
  body: string;
};

function convertBody(body: string) {
  const escape = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const withBreaks = escape.replace(/\n/g, "<br>");

  return withBreaks.replace(
    /(https?:\/\/[^\s<]+)/g,
    `<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#b8860b;font-weight:bold;text-decoration:none;">$1</a>`
  );
}

export function buildCampaignEmail(opts: CampaignEmailOptions): string {
  const bodyHtml = convertBody(opts.body);

  return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${opts.subject}</title>

    <style>
      body { margin:0; padding:0; background:#ffffff; }
      table { border-collapse:collapse; }
      img { display:block; border:0; outline:none; }
      .container { width:100%; background:#ffffff; }
      .inner { max-width:600px; margin:auto; background:#ffffff; }
      .btn {
        background:#c7080f; color:#ffffff!important;
        padding:12px 20px; border-radius:4px; display:inline-block;
        text-decoration:none; font-size:14px; font-family:Arial;
      }
      @media only screen and (max-width:480px){
        .inner { width:100%!important; }
        h1 { font-size:18px!important; }
        .btn { width:100%!important; display:block!important; }
      }
    </style>
  </head>

  <body>

    <table width="100%" class="container">
      <tr><td align="center">
        <table width="600" class="inner">

          <tr>
            <td>
              <img src="https://yourdomain.com/banner.png" width="600" alt="Banner" />
            </td>
          </tr>

          <tr>
            <td style="padding:20px;text-align:center;font-family:Arial;">
              <h1 style="margin:0;font-size:24px;">${opts.subject}</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:20px;font-family:Arial;font-size:16px;color:#333;line-height:24px;">
              ${bodyHtml}
            </td>
          </tr>

          <tr>
            <td style="padding:20px;" align="center">
              <a href="https://yourdomain.com" class="btn">Explore Now</a>
            </td>
          </tr>

          <tr>
            <td style="padding:20px;">
              <table width="100%">
                <tr>
                  <td width="50%" align="center">
                    <img src="https://yourdomain.com/img1.png" width="250" />
                    <p style="font-family:Arial;font-size:14px;">Gift Cards</p>
                  </td>
                  <td width="50%" align="center">
                    <img src="https://yourdomain.com/img2.png" width="250" />
                    <p style="font-family:Arial;font-size:14px;">Wine Subscription</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px;text-align:center;font-family:Arial;font-size:12px;color:#777;">
              © 2025 Elizabeth CRM — Developed by Chef Alex<br />
              <a href="https://yourdomain.com/unsubscribe" style="color:#777;">Unsubscribe</a>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>

  </body>
</html>`;
}
