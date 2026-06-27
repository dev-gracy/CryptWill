const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../middlewares/errorHandler');
const { getEmailQueue } = require('../config/queues');
const { signInviteToken, verifyToken } = require('../utils/jwt.utils');

async function listBeneficiaries(req, res) {
  try {
    const beneficiaries = await prisma.beneficiary.findMany({
      where: { userId: req.user.id },
      include: { assignments: { include: { asset: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, 200, { beneficiaries });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch beneficiaries');
  }
}

async function addBeneficiary(req, res) {
  try {
    const { fullName, email, phone, walletAddress } = req.body;

    const beneficiary = await prisma.beneficiary.create({
      data: {
        userId: req.user.id,
        fullName,
        email,
        phone,
        walletAddress,
        status: 'ACTIVE',
        verificationToken: null,
      },
    });

    await getEmailQueue().add('beneficiary-added', {
      to: email,
      subject: `${req.user.fullName} has added you as a beneficiary on CryptWill`,
      html: beneficiaryAddedTemplate(req.user.fullName, fullName),
      userId: req.user.id,
      type: 'BENEFICIARY_ADDED',
      channel: 'EMAIL',
    });

    return successResponse(res, 201, { beneficiary });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to add beneficiary');
  }
}

async function updateBeneficiary(req, res) {
  try {
    const { fullName, phone, walletAddress } = req.body;
    const b = await prisma.beneficiary.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!b) return errorResponse(res, 404, 'Beneficiary not found');

    const updated = await prisma.beneficiary.update({
      where: { id: req.params.id },
      data: {
        ...(fullName && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(walletAddress !== undefined && { walletAddress }),
      },
    });
    return successResponse(res, 200, { beneficiary: updated });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to update beneficiary');
  }
}

async function removeBeneficiary(req, res) {
  try {
    const b = await prisma.beneficiary.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!b) return errorResponse(res, 404, 'Beneficiary not found');
    await prisma.beneficiary.delete({ where: { id: req.params.id } });
    return successResponse(res, 200, { message: 'Beneficiary removed' });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to remove beneficiary');
  }
}

async function acceptBeneficiaryInvite(req, res) {
  try {
    const { token, password } = req.body;
    const decoded = verifyToken(token);

    if (decoded.role !== 'beneficiary') return errorResponse(res, 400, 'Invalid invite token');

    const beneficiary = await prisma.beneficiary.findFirst({ where: { verificationToken: token } });
    if (!beneficiary) return errorResponse(res, 404, 'Invite not found or already used');

    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    await prisma.beneficiary.update({
      where: { id: beneficiary.id },
      data: { status: 'ACTIVE', passwordHash, verificationToken: null },
    });

    const owner = await prisma.user.findUnique({ where: { id: beneficiary.userId } });
    await getEmailQueue().add('guardian-accepted', {
      to: owner.email,
      subject: `Beneficiary ${beneficiary.fullName} has accepted their role`,
      html: `<p>Hi ${owner.fullName}, ${beneficiary.fullName} has accepted their beneficiary invitation on CryptWill.</p>`,
      userId: owner.id,
      type: 'GUARDIAN_ACTIVATED',
      channel: 'EMAIL',
    });

    return successResponse(res, 200, { message: 'Invitation accepted. You can now log in to your beneficiary portal.' });
  } catch (err) {
    return errorResponse(res, 400, 'Invalid or expired invitation');
  }
}

async function beneficiaryLogin(req, res) {
  try {
    const { email, password } = req.body;
    const beneficiary = await prisma.beneficiary.findFirst({ where: { email, status: 'ACTIVE' } });
    if (!beneficiary || !beneficiary.passwordHash) return errorResponse(res, 401, 'Invalid credentials');

    const valid = await bcrypt.compare(password, beneficiary.passwordHash);
    if (!valid) return errorResponse(res, 401, 'Invalid credentials');

    const { signAccessToken } = require('../utils/jwt.utils');
    const token = signAccessToken({ userId: beneficiary.id, role: 'beneficiary', ownerId: beneficiary.userId });

    res.cookie('accessToken', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, 200, { beneficiary: { id: beneficiary.id, fullName: beneficiary.fullName, email: beneficiary.email } });
  } catch (err) {
    return errorResponse(res, 500, 'Beneficiary login failed');
  }
}

async function getBeneficiaryDashboard(req, res) {
  try {
    const token = req.cookies.accessToken;
    if (!token) return errorResponse(res, 401, 'Not authenticated');

    const { verifyAccessToken } = require('../utils/jwt.utils');
    const decoded = verifyAccessToken(token);
    if (decoded.role !== 'beneficiary') return errorResponse(res, 403, 'Not a beneficiary');

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: decoded.userId },
      include: {
        assignments: {
          include: { asset: { select: { assetName: true, assetType: true, estimatedValueUsd: true, releaseDay: true } } },
        },
        vaultFiles: { select: { id: true, fileName: true, fileType: true, fileSizeBytes: true, uploadedAt: true } },
      },
    });

    const owner = await prisma.user.findUnique({
      where: { id: decoded.ownerId },
      select: { fullName: true, contract: { select: { status: true, triggerStartedAt: true, executedAt: true } } },
    });

    return successResponse(res, 200, { beneficiary, owner });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to load beneficiary dashboard');
  }
}

function beneficiaryAddedTemplate(ownerName, beneficiaryName) {
  return `
  <div style="font-family: Inter, sans-serif; background:#0A0A0F; color:#F0F0F5; padding:40px; max-width:480px; margin:auto; border-radius:12px;">
    <h2 style="color:#4F6EF7;">CryptWill — Beneficiary Added</h2>
    <p>Hi ${beneficiaryName},</p>
    <p><strong>${ownerName}</strong> has added you as a beneficiary on CryptWill.</p>
    <p>You will receive their crypto assets automatically if their inheritance plan is ever triggered. No action is required on your part.</p>
    <p style="color:#9090A0; font-size:14px; margin-top:24px;">If you have questions, contact ${ownerName} directly.</p>
  </div>`;
}

module.exports = {
  listBeneficiaries, addBeneficiary, updateBeneficiary, removeBeneficiary,
  acceptBeneficiaryInvite, beneficiaryLogin, getBeneficiaryDashboard,
};
