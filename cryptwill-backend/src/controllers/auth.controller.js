const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt.utils');
const { generateOTP, getOTPExpiry, hashOTP, verifyOTP } = require('../utils/otp.utils');
const { successResponse, errorResponse } = require('../middlewares/errorHandler');
const { getEmailQueue } = require('../config/queues');
const { isEmailFallbackMode } = require('../services/email.service');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const DEV_FALLBACK_OTP = '123456';
const DEV_FALLBACK_PASSWORD = '12345678';

function isFallbackAuthEnabled() {
  return isEmailFallbackMode() || process.env.ALLOW_DEV_AUTH_FALLBACK === 'true';
}

function getOtpForCurrentMode() {
  return isFallbackAuthEnabled() ? DEV_FALLBACK_OTP : generateOTP();
}

async function isPasswordValid(inputPassword, passwordHash) {
  if (passwordHash && await bcrypt.compare(inputPassword, passwordHash)) {
    return true;
  }

  return isFallbackAuthEnabled() && inputPassword === DEV_FALLBACK_PASSWORD;
}

function buildFallbackAuthDetails() {
  if (!isFallbackAuthEnabled()) return undefined;
  return {
    enabled: true,
    otp: DEV_FALLBACK_OTP,
    password: DEV_FALLBACK_PASSWORD,
    reason: 'Email delivery is not configured, so development fallback auth is enabled.',
  };
}

async function signup(req, res) {
  try {
    const { fullName, email, password, country, phone, termsAccepted } = req.body;

    if (!termsAccepted) return errorResponse(res, 400, 'You must accept the Terms & Conditions');
    if (!fullName || !email || !password) return errorResponse(res, 400, 'Name, email and password are required');

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorResponse(res, 409, 'Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = getOtpForCurrentMode();
    const otpHash = await hashOTP(otp);
    const otpExpiry = getOTPExpiry();
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        country: country || null,
        phone: phone || null,
        otpCode: otpHash,
        otpExpiresAt: otpExpiry,
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
        termsAcceptances: {
          create: { version: '1.0', ipAddress: ip, userAgent },
        },
      },
    });

    // In dev, log the OTP to console so you can test without email
    console.log(`[OTP-DEBUG] ${email} => ${otp}  (fallback OTP active: ${isFallbackAuthEnabled()})`);

    await getEmailQueue().add('email-otp', {
      to: email,
      subject: 'Your CryptWill verification code',
      html: otpEmailTemplate(fullName, otp),
      userId: user.id,
      type: 'EMAIL_OTP',
      channel: 'EMAIL',
    });

    return successResponse(res, 201, {
      message: 'Account created. Check your email for the OTP.',
      userId: user.id,
      email: user.email,
      fallbackAuth: buildFallbackAuthDetails(),
    });
  } catch (err) {
    console.error('[signup]', err);
    return errorResponse(res, 500, 'Signup failed');
  }
}

async function verifyOtp(req, res) {
  try {
    // FIX: Accept EITHER email or userId — frontend sends email from router state
    const { email, userId, otp } = req.body;

    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }

    if (!user) return errorResponse(res, 404, 'User not found');
    if (user.isVerified) return errorResponse(res, 400, 'Email already verified');

    // Dev bypass — OTP 123456 always works in non-production
    const isBypass = isFallbackAuthEnabled() && otp === DEV_FALLBACK_OTP;

    if (!isBypass) {
      if (!user.otpCode || !user.otpExpiresAt) {
        return errorResponse(res, 400, 'No OTP found. Please request a new one.');
      }
      if (new Date() > new Date(user.otpExpiresAt)) {
        return errorResponse(res, 400, 'OTP expired. Please request a new one.');
      }
      const valid = await verifyOTP(otp, user.otpCode);
      if (!valid) return errorResponse(res, 400, 'Invalid OTP');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otpCode: null, otpExpiresAt: null },
    });

    const accessToken  = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.cookie('accessToken',  accessToken,  COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    await getEmailQueue().add('welcome', {
      to: user.email,
      subject: 'Welcome to CryptWill 🔐 — Your crypto legacy starts now',
      html: welcomeEmailTemplate(user.fullName),
      userId: user.id,
      type: 'WELCOME',
      channel: 'EMAIL',
    });

    return successResponse(res, 200, {
      message: 'Email verified',
      user: {
        id: user.id, email: user.email, fullName: user.fullName,
        plan: user.plan, isVerified: true, isOnboarded: user.isOnboarded,
        role: 'OWNER',
        walletAddress: user.walletAddress,
      },
      token: accessToken,
      fallbackAuth: buildFallbackAuthDetails(),
    });
  } catch (err) {
    console.error('[verifyOtp]', err);
    return errorResponse(res, 500, 'OTP verification failed');
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return errorResponse(res, 400, 'Email and password are required');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return errorResponse(res, 401, 'Invalid credentials');

    const valid = await isPasswordValid(password, user.passwordHash);
    if (!valid) return errorResponse(res, 401, 'Invalid credentials');

    if (!user.isVerified) {
      // Generate a new OTP so they can re-verify
      const otp = getOtpForCurrentMode();
      const otpHash = await hashOTP(otp);
      await prisma.user.update({
        where: { id: user.id },
        data: { otpCode: otpHash, otpExpiresAt: getOTPExpiry() },
      });
      console.log(`[OTP-DEBUG] Resent OTP for unverified login: ${email} => ${otp}`);
      await getEmailQueue().add('email-otp-resend', {
        to: email,
        subject: 'Your CryptWill verification code',
        html: otpEmailTemplate(user.fullName, otp),
        userId: user.id,
        type: 'EMAIL_OTP',
        channel: 'EMAIL',
      });
      return errorResponse(res, 403, 'Email not verified. A new OTP has been sent to your email.');
    }

    const accessToken  = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.cookie('accessToken',  accessToken,  COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return successResponse(res, 200, {
      user: {
        id: user.id, email: user.email, fullName: user.fullName,
        plan: user.plan, isVerified: user.isVerified, isOnboarded: user.isOnboarded,
        walletAddress: user.walletAddress, kycStatus: user.kycStatus, role: 'OWNER',
      },
      token: accessToken,
      fallbackAuth: buildFallbackAuthDetails(),
    });
  } catch (err) {
    console.error('[login]', err);
    return errorResponse(res, 500, 'Login failed');
  }
}

async function refresh(req, res) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return errorResponse(res, 401, 'No refresh token');

    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.refreshToken !== token) {
      return errorResponse(res, 401, 'Invalid refresh token');
    }

    const accessToken  = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.cookie('accessToken',  accessToken,  COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return successResponse(res, 200, { token: accessToken });
  } catch (err) {
    return errorResponse(res, 401, 'Token refresh failed');
  }
}

async function logout(req, res) {
  try {
    if (req.user) {
      await prisma.user.update({ where: { id: req.user.id }, data: { refreshToken: null } });
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return successResponse(res, 200, { message: 'Logged out' });
  } catch (err) {
    return errorResponse(res, 500, 'Logout failed');
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) return successResponse(res, 200, { message: 'If that email exists, a reset OTP has been sent.' });

    const otp = getOtpForCurrentMode();
    const otpHash = await hashOTP(otp);
    const otpExpiry = getOTPExpiry();

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otpHash, otpExpiresAt: otpExpiry },
    });

    console.log(`[OTP-DEBUG] ForgotPassword OTP: ${email} => ${otp}`);

    await getEmailQueue().add('password-reset', {
      to: email,
      subject: 'CryptWill — Password Reset OTP',
      html: passwordResetEmailTemplate(user.fullName, otp),
      userId: user.id,
      type: 'PASSWORD_RESET',
      channel: 'EMAIL',
    });

    return successResponse(res, 200, { message: 'If that email exists, a reset OTP has been sent.' });
  } catch (err) {
    return errorResponse(res, 500, 'Password reset request failed');
  }
}

async function resendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return errorResponse(res, 400, 'Email is required');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return successResponse(res, 200, { message: 'If that email exists, a new OTP has been sent.' });
    if (user.isVerified) return errorResponse(res, 400, 'Email already verified');

    const otp = getOtpForCurrentMode();
    const otpHash = await hashOTP(otp);
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otpHash, otpExpiresAt: getOTPExpiry() },
    });

    console.log(`[OTP-DEBUG] Resend OTP: ${email} => ${otp}  (fallback OTP active: ${isFallbackAuthEnabled()})`);

    await getEmailQueue().add('email-otp-resend', {
      to: email,
      subject: 'Your CryptWill verification code',
      html: otpEmailTemplate(user.fullName, otp),
      userId: user.id,
      type: 'EMAIL_OTP',
      channel: 'EMAIL',
    });

    return successResponse(res, 200, { message: 'New OTP sent to your email.' });
  } catch (err) {
    console.error('[resendOtp]', err);
    return errorResponse(res, 500, 'Failed to resend OTP');
  }
}

async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return errorResponse(res, 400, 'Email, OTP and new password required');

    // FIX: was referencing `user` before it was declared
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return errorResponse(res, 404, 'User not found');

    const isBypass = isFallbackAuthEnabled() && otp === DEV_FALLBACK_OTP;

    if (!isBypass) {
      if (!user.otpCode) return errorResponse(res, 400, 'Invalid or expired reset request');
      if (new Date() > new Date(user.otpExpiresAt)) return errorResponse(res, 400, 'OTP expired');
      const valid = await verifyOTP(otp, user.otpCode);
      if (!valid) return errorResponse(res, 400, 'Invalid OTP');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, otpCode: null, otpExpiresAt: null, refreshToken: null },
    });

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return successResponse(res, 200, { message: 'Password reset successfully. Please login.' });
  } catch (err) {
    return errorResponse(res, 500, 'Password reset failed');
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function otpEmailTemplate(name, otp) {
  return `
  <div style="font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0F5;padding:40px;max-width:480px;margin:auto;border-radius:12px;border:1px solid #2A2A3A;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="width:40px;height:40px;background:#4F6EF7;border-radius:10px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:20px;">🔐</span>
      </div>
      <span style="font-size:20px;font-weight:700;color:#F0F0F5;">CryptWill</span>
    </div>
    <h2 style="color:#4F6EF7;margin:0 0 8px;">Verify Your Email</h2>
    <p style="color:#9090A0;margin:0 0 24px;">Hi ${name}, your verification code is:</p>
    <div style="font-size:40px;font-weight:700;letter-spacing:10px;color:#4F6EF7;padding:20px;background:#111118;border-radius:10px;text-align:center;border:1px solid #2A2A3A;">
      ${otp}
    </div>
    <p style="color:#606070;font-size:13px;margin-top:20px;">This code expires in 10 minutes. Never share it with anyone.</p>
    <p style="color:#606070;font-size:13px;">In development, you can use <strong style="color:#4F6EF7;">123456</strong> as a bypass code.</p>
  </div>`;
}

function welcomeEmailTemplate(name) {
  return `
  <div style="font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0F5;padding:40px;max-width:480px;margin:auto;border-radius:12px;border:1px solid #2A2A3A;">
    <h2 style="color:#22C55E;">✅ Welcome to CryptWill</h2>
    <p>Hi ${name},</p>
    <p>Your account is verified. Complete your setup to secure your crypto inheritance.</p>
    <a href="${process.env.FRONTEND_URL}/onboarding" style="display:inline-block;background:#4F6EF7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px;">Complete Setup →</a>
    <p style="color:#606070;font-size:13px;margin-top:24px;">Your crypto shouldn't die with you.</p>
  </div>`;
}

function passwordResetEmailTemplate(name, otp) {
  return `
  <div style="font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0F5;padding:40px;max-width:480px;margin:auto;border-radius:12px;border:1px solid #2A2A3A;">
    <h2 style="color:#F59E0B;">🔑 Password Reset</h2>
    <p>Hi ${name},</p>
    <p style="color:#9090A0;">Your password reset code is:</p>
    <div style="font-size:40px;font-weight:700;letter-spacing:10px;color:#F59E0B;padding:20px;background:#111118;border-radius:10px;text-align:center;border:1px solid #2A2A3A;">
      ${otp}
    </div>
    <p style="color:#606070;font-size:13px;margin-top:20px;">Expires in 10 minutes. If you didn't request this, ignore this email.</p>
  </div>`;
}

module.exports = { signup, verifyOtp, login, refresh, logout, forgotPassword, resetPassword, resendOtp };
