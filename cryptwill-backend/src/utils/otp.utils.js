const crypto = require('crypto');
const bcrypt = require('bcryptjs');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOTPExpiry() {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  return expiry;
}

async function hashOTP(otp) {
  return bcrypt.hash(otp, 12);
}

async function verifyOTP(otp, hash) {
  return bcrypt.compare(otp, hash);
}

function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { generateOTP, getOTPExpiry, hashOTP, verifyOTP, generateSecureToken };
