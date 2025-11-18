// src/lib/emailTemplate.ts
import { emailSignature } from "./emailSignature";

function linkify(text: string): string {
  // Escape basic HTML
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Newlines → <br>
  const withBreaks = escaped.replace(/\n/g, "<br>");

  // Turn URLs into clickable links
  return withBreaks.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#b8860b; font-weight:bold;">$1</a>'
  );
}

export function buildEmailHTML(body: string): string {
  const content = linkify(body);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:24px;border-radius:12px;box-shadow:0 4px 14px rgba(0,0,0,0.08);">
    <div style="font-size:15px;line-height:1.6;color:#333333;">
      ${content}
    </div>
    <hr style="margin:24px 0;border:none;border-top:1px solid #eeeeee;" />
    ${emailSignature}
  </div>
</body>
</html>
`;
}
