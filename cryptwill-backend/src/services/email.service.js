const { Resend } = require('resend');
const nodemailer = require('nodemailer');

let resendClient;
let smtpTransporter;

function getResend() {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function getSmtpConfig() {
  const host = process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST;
  const port = parseInt(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || '587', 10);
  const user = process.env.BREVO_SMTP_USER || process.env.SMTP_USER;
  const pass = process.env.BREVO_SMTP_PASS || process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;
  return { host, port, user, pass };
}

function isEmailConfigured() {
  return Boolean(getSmtpConfig() || process.env.RESEND_API_KEY);
}

function isEmailFallbackMode() {
  return process.env.NODE_ENV !== 'production' && !isEmailConfigured();
}

function getSmtpTransporter() {
  if (!smtpTransporter) {
    const config = getSmtpConfig();
    if (!config) return null;

    smtpTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  return smtpTransporter;
}

function getFromAddress() {
  if (process.env.BREVO_FROM) {
    return process.env.BREVO_FROM;
  }
  if (process.env.NODE_ENV !== 'production') {
    return process.env.EMAIL_FROM_DEV || 'CryptWill <onboarding@resend.dev>';
  }
  return process.env.EMAIL_FROM || 'CryptWill <noreply@cryptwill.app>';
}

async function sendEmail({ to, subject, html }) {
  const smtpTransport = getSmtpTransporter();
  if (smtpTransport) {
    const result = await smtpTransport.sendMail({
      from: getFromAddress(),
      to,
      subject,
      html,
    });
    console.log('[Email] Sent via SMTP to', to, '—', subject);
    return { data: result, error: null, provider: 'smtp' };
  }

  if (process.env.RESEND_API_KEY) {
    const resend = getResend();
    const result = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error('[Email] Resend error:', result.error.message, '→', to);
      throw new Error(result.error.message || 'Email delivery failed');
    }

    console.log('[Email] Sent via Resend to', to, '—', subject);
    return { data: result, error: null, provider: 'resend' };
  }

  throw new Error('No email provider configured. Set BREVO_SMTP_* or RESEND_API_KEY.');
}

module.exports = { sendEmail, isEmailConfigured, isEmailFallbackMode };
