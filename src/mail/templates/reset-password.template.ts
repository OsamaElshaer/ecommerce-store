export interface ResetPasswordTemplateData {
    name: string;
    resetUrl: string;
}

export function resetPasswordTemplate(data: ResetPasswordTemplateData): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset your password</title>
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
                  <td style="padding:32px;">
                    <p>Hi ${data.name},</p>
                    <p>We received a request to set/reset the password on your account. Click the button below to continue:</p>
                    <p style="text-align:center;margin:32px 0;">
                      <a href="${data.resetUrl}" style="background:#111827;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;">
                        Set new password
                      </a>
                    </p>
                    <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
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
