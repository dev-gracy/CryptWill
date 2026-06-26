const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken, verifyToken } = require('../utils/jwt.utils');
const { generateOTP, getOTPExpiry, hashOTP, verifyOTP } = require('../utils/otp.utils');
const { successResponse, errorResponse } = require('../middlewares/errorHandler');
const { getEmailQueue } = require('../config/queues');

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

async function signup(req, res) {
  try {
    const { fullName, email, password, country, phone, termsAccepted } = req.body;

    if (!termsAccepted) return errorResponse(res, 400, 'You must accept the Terms & Conditions');

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorResponse(res, 409, 'Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const otpExpiry = getOTPExpiry();
    const ip = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        country,
        phone,
        otpCode: otpHash,
        otpExpiresAt: otpExpiry,
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
        termsAcceptances: {
          create: { version: '1.0', ipAddress: ip, userAgent },
        },
      },
    });

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
    });
  } catch (err) {
    console.error('[signup]', err);
    return errorResponse(res, 500, 'Signup failed');
  }
}

async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return errorResponse(res, 404, 'User not found');
    if (user.isVerified) return errorResponse(res, 400, 'Email already verified');

    if (!user.otpCode || !user.otpExpiresAt) {
      return errorResponse(res, 400, 'No OTP found. Request a new one.');
    }
    if (new Date() > user.otpExpiresAt) {
      return errorResponse(res, 400, 'OTP expired. Request a new one.');
    }

    const valid = await verifyOTP(otp, user.otpCode);
    if (!valid) return errorResponse(res, 400, 'Invalid OTP');

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otpCode: null, otpExpiresAt: null },
    });

    await getEmailQueue().add('welcome', {
      to: email,
      subject: 'Welcome to CryptWill 🔐',
      html: welcomeEmailTemplate(user.fullName),
      userId: user.id,
      type: 'WELCOME',
      channel: 'EMAIL',
    });

    const accessToken = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return successResponse(res, 200, { message: 'Email verified successfully', redirectTo: '/onboarding' });
  } catch (err) {
    console.error('[verifyOtp]', err);
    return errorResponse(res, 500, 'OTP verification failed');
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return errorResponse(res, 401, 'Invalid email or password');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return errorResponse(res, 401, 'Invalid email or password');

    if (!user.isVerified) return errorResponse(res, 403, 'Please verify your email first');

    const accessToken = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return successResponse(res, 200, {
      user: {
        id: user.id, email: user.email, fullName: user.fullName,
        plan: user.plan, isOnboarded: user.isOnboarded,
      },
    });
  } catch (err) {
    console.error('[login]', err);
    return errorResponse(res, 500, 'Login failed');
  }
}

async function refresh(req, res) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return errorResponse(res, 401, 'No refresh token');

    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || user.refreshToken !== token) {
      return errorResponse(res, 401, 'Invalid refresh token');
    }

    const newAccessToken = signAccessToken({ userId: user.id });
    const newRefreshToken = signRefreshToken({ userId: user.id });

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

    res.cookie('accessToken', newAccessToken, COOKIE_OPTIONS);
    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    return successResponse(res, 200, { message: 'Tokens refreshed' });
  } catch (err) {
    return errorResponse(res, 401, 'Invalid or expired refresh token');
  }
}

async function logout(req, res) {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        await prisma.user.update({ where: { id: decoded.userId }, data: { refreshToken: null } });
      } catch (_) {}
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return successResponse(res, 200, { message: 'Logged out successfully' });
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

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const otpExpiry = getOTPExpiry();

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otpHash, otpExpiresAt: otpExpiry },
    });

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

async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.otpCode) return errorResponse(res, 400, 'Invalid or expired reset request');

    if (new Date() > user.otpExpiresAt) return errorResponse(res, 400, 'OTP expired');

    const valid = await verifyOTP(otp, user.otpCode);
    if (!valid) return errorResponse(res, 400, 'Invalid OTP');

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

// ─── Email Templates ─────────────────────────────────────────────────────────

function otpEmailTemplate(name, otp) {
  return `
  <div style="font-family: Inter, sans-serif; background:#0A0A0F; color:#F0F0F5; padding:40px; max-width:480px; margin:auto; border-radius:12px;">
    <h2 style="color:#4F6EF7;">CryptWill 🔐</h2>
    <p>Hi ${name},</p>
    <p>Your verification code is:</p>
    <div style="font-size:36px; font-weight:700; letter-spacing:8px; color:#4F6EF7; padding:20px; background:#111118; border-radius:8px; text-align:center;">
      ${otp}
    </div>
    <p style="color:#9090A0; font-size:14px;">This code expires in 10 minutes. Never share it with anyone.</p>
  </div>`;
}

function welcomeEmailTemplate(name) {
  return `
  <div style="font-family: Inter, sans-serif; background:#0A0A0F; color:#F0F0F5; padding:40px; max-width:480px; margin:auto; border-radius:12px;">
    <h2 style="color:#4F6EF7;">Welcome to CryptWill 🔐</h2>
    <p>Hi ${name},</p>
    <p>Your account is verified. Your crypto inheritance plan starts now.</p>
    <a href="${process.env.FRONTEND_URL}/onboarding" style="display:inline-block; background:#4F6EF7; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Complete Setup →</a>
    <p style="color:#9090A0; font-size:14px; margin-top:24px;">Your crypto shouldn't die with you.</p>
  </div>`;
}

function passwordResetEmailTemplate(name, otp) {
  return `
  <div style="font-family: Inter, sans-serif; background:#0A0A0F; color:#F0F0F5; padding:40px; max-width:480px; margin:auto; border-radius:12px;">
    <h2 style="color:#4F6EF7;">Password Reset</h2>
    <p>Hi ${name},</p>
    <p>Your password reset code is:</p>
    <div style="font-size:36px; font-weight:700; letter-spacing:8px; color:#4F6EF7; padding:20px; background:#111118; border-radius:8px; text-align:center;">
      ${otp}
    </div>
    <p style="color:#9090A0; font-size:14px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
  </div>`;
}

module.exports = { signup, verifyOtp, login, refresh, logout, forgotPassword, resetPassword };
