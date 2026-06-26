const { Resend } = require('resend');

let resendClient;

function getResend() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

async function sendEmail({ to, subject, html }) {
  const resend = getResend();
  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@cryptwill.app',
    to,
    subject,
    html,
  });
  return result;
}

module.exports = { sendEmail };
