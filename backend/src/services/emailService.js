const { Resend } = require('resend');

let resend;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

async function sendTokenExpiryEmail(userEmail, userName, accountUsername) {
  try {
    const client = getResend();
    await client.emails.send({
      from: 'InstaAudit <noreply@instaaudit.app>',
      to: userEmail,
      subject: `Action required: Instagram account @${accountUsername} needs reconnection`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">InstaAudit</h1>
          <h2>Account reconnection required</h2>
          <p>Hi ${userName},</p>
          <p>
            The access token for your Instagram account <strong>@${accountUsername}</strong> has expired.
            Please reconnect this account to continue syncing analytics data.
          </p>
          <a href="${process.env.FRONTEND_URL}/accounts"
             style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
            Reconnect Account
          </a>
          <p style="color: #666; font-size: 14px;">
            If you no longer want to track this account, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send token expiry email:', error.message);
  }
}

async function sendWelcomeEmail(userEmail, userName) {
  try {
    const client = getResend();
    await client.emails.send({
      from: 'InstaAudit <noreply@instaaudit.app>',
      to: userEmail,
      subject: 'Welcome to InstaAudit!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">Welcome to InstaAudit!</h1>
          <p>Hi ${userName},</p>
          <p>
            Thanks for signing up. You can now connect up to 25 Instagram accounts
            and start tracking your analytics.
          </p>
          <a href="${process.env.FRONTEND_URL}/accounts"
             style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
            Connect Your First Account
          </a>
          <p style="color: #666; font-size: 14px;">
            Your data will automatically sync every 24 hours.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error.message);
  }
}

module.exports = { sendTokenExpiryEmail, sendWelcomeEmail };
