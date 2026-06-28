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

const https = require('https');

async function sendBrevoEmail({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_PASS;
  if (!apiKey) {
    throw new Error('Brevo API key is not configured');
  }

  const fromEmail = process.env.BREVO_FROM || 'gracyyyy.g@gmail.com';
  const body = JSON.stringify({
    sender: {
      name: 'CryptWill',
      email: fromEmail,
    },
    to: [
      {
        email: to,
      }
    ],
    subject: subject,
    htmlContent: html
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => (responseBody += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(responseBody));
        } else {
          reject(new Error(`Brevo API returned status ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function sendEmail({ to, subject, html }) {
  // 1. Try Brevo REST API first if a Brevo key is configured
  const brevoKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_PASS;
  if (brevoKey) {
    try {
      const result = await sendBrevoEmail({ to, subject, html });
      console.log('[Email] Sent via Brevo REST API to', to, '—', subject);
      return { data: result, error: null, provider: 'brevo' };
    } catch (err) {
      console.error('[Email] Brevo REST API error:', err.message, '→', to);
      throw err;
    }
  }

  // 2. Try SMTP
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

  // 3. Try Resend
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

  throw new Error('No email provider configured. Set BREVO_SMTP_PASS or RESEND_API_KEY.');
}

module.exports = { sendEmail, isEmailConfigured, isEmailFallbackMode };

