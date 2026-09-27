export function emailVerificationTemplate({
    name,
    verificationUrl,
}: {
    name: string;
    verificationUrl: string;
}) {
    return `
        <h2>Hello ${name},</h2>

        <p>Thanks for creating an account.</p>

        <p>Please verify your email address by clicking the link below:</p>

        <a href="${verificationUrl}">
            Verify your email
        </a>

        <p>This link will expire in 24 hours.</p>
    `;
}
