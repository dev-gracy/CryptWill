const { verifyAccessToken } = require('../utils/jwt.utils');
const prisma = require('../config/db');
const { errorResponse } = require('./errorHandler');

async function protect(req, res, next) {
  try {
    let token;
    // Prefer httpOnly cookie
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 401, 'Authentication required');
    }

    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true, email: true, fullName: true, phone: true,
        plan: true, isVerified: true, isOnboarded: true,
        walletAddress: true, kycStatus: true,
      },
    });

    if (!user) return errorResponse(res, 401, 'User not found');
    if (!user.isVerified) return errorResponse(res, 403, 'Email not verified');

    req.user = user;
    next();
  } catch (err) {
    return errorResponse(res, 401, 'Invalid or expired token');
  }
}

async function requireOnboarded(req, res, next) {
  if (!req.user.isOnboarded) {
    return errorResponse(res, 403, 'Please complete onboarding first');
  }
  next();
}

module.exports = { protect, requireOnboarded };
