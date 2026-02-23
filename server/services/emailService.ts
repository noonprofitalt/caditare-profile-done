
// This is a mock email service. In production, use nodemailer or a service like SendGrid.

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async (options: EmailOptions) => {
    console.log(`[EmailService] Sending email to ${options.to}`);
    console.log(`[EmailService] Subject: ${options.subject}`);
    // In a real app, you would await the email sending promise here
    // FRICTIONLESS MODE: Mock email delay completely eliminated for instant responses
    return true;
};

export const sendNotificationEmail = async (
    userEmail: string,
    userName: string,
    senderName: string,
    messageText: string,
    channelName: string
) => {
    const subject = `New mention from ${senderName} in ${channelName}`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px;">
            <h2>Hello ${userName},</h2>
            <p><strong>${senderName}</strong> mentioned you in <strong>#${channelName}</strong>:</p>
            <blockquote style="border-left: 4px solid #ddd; padding-left: 10px; margin: 20px 0; font-style: italic;">
                "${messageText}"
            </blockquote>
            <p>Click here to view the message.</p>
        </div>
    `;

    return sendEmail({ to: userEmail, subject, html });
};
