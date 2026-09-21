export interface WelcomeTemplateData {
    name: string;
    companyName: string;
    verificationUrl: string;
}

export function welcomeTemplate(data: WelcomeTemplateData): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome</title>
      </head>

      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:40px 20px;">

              <table
                width="600"
                cellpadding="0"
                cellspacing="0"
                style="max-width:600px;width:100%;background:#ffffff;"
              >

                <tr>
                  <td style="padding:30px;text-align:center;background:#111827;">
                    <h1 style="margin:0;color:#ffffff;">
                      ${data.companyName}
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px 30px;">

                    <h2 style="color:#111827;">
                      Hello ${data.name} 👋
                    </h2>

                    <p style="color:#4b5563;font-size:16px;line-height:1.6;">
                      Welcome to ${data.companyName}.
                    </p>

                    <p style="color:#4b5563;font-size:16px;line-height:1.6;">
                      Your account has been successfully created.
                    </p>

                    <a
                      href="${data.verificationUrl}"
                      style="
                        display:inline-block;
                        padding:14px 24px;
                        background:#2563eb;
                        color:#ffffff;
                        text-decoration:none;
                        border-radius:6px;
                        font-weight:bold;
                      "
                    >
                      Verify Email
                    </a>

                  </td>
                </tr>

                <tr>
                  <td style="padding:25px;text-align:center;background:#f9fafb;">
                    <p style="margin:0;color:#9ca3af;font-size:13px;">
                      © 2026 ${data.companyName}. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>

      </body>
    </html>
  `;
}
