const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../middlewares/errorHandler');
const { kycUpload } = require('../middlewares/upload.middleware');

async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, fullName: true, phone: true, dateOfBirth: true,
        country: true, walletAddress: true, kycStatus: true, kycDocumentType: true,
        plan: true, isVerified: true, isOnboarded: true, termsAcceptedAt: true,
        createdAt: true, bankDeclaration: true,
      },
    });
    return successResponse(res, 200, { user });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch profile');
  }
}

async function updateProfile(req, res) {
  try {
    const { fullName, phone, dateOfBirth, country, walletAddress } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(country && { country }),
        ...(walletAddress && { walletAddress }),
      },
      select: { id: true, email: true, fullName: true, phone: true, walletAddress: true, country: true },
    });
    return successResponse(res, 200, { user });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to update profile');
  }
}

async function uploadKYC(req, res) {
  try {
    if (!req.file) return errorResponse(res, 400, 'No file uploaded');
    const { documentType } = req.body;
    if (!documentType) return errorResponse(res, 400, 'Document type required');

    // File is already AES-256 encrypted client-side before upload
    const pinataService = require('../services/pinata.service');
    const ipfsHash = await pinataService.uploadBuffer(req.file.buffer, req.file.originalname);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        kycDocumentUrl: `ipfs://${ipfsHash}`,
        kycDocumentType: documentType,
        kycStatus: 'SUBMITTED',
      },
    });

    return successResponse(res, 200, { message: 'KYC document submitted', ipfsHash });
  } catch (err) {
    console.error('[uploadKYC]', err);
    return errorResponse(res, 500, 'KYC upload failed');
  }
}

async function saveBankDeclaration(req, res) {
  try {
    const { bankName, accountNumber, ifsc } = req.body;
    const declaration = JSON.stringify({ bankName, accountNumber: `****${accountNumber.slice(-4)}`, ifsc });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { bankDeclaration: declaration },
    });

    return successResponse(res, 200, { message: 'Bank declaration saved' });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to save bank declaration');
  }
}

async function completeOnboarding(req, res) {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isOnboarded: true },
    });

    // Create empty subscription record for free tier
    await prisma.subscription.upsert({
      where: { userId: req.user.id },
      update: {},
      create: { userId: req.user.id, plan: 'FREE', status: 'ACTIVE' },
    });

    return successResponse(res, 200, { message: 'Onboarding complete', redirectTo: '/dashboard' });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to complete onboarding');
  }
}

module.exports = { getProfile, updateProfile, uploadKYC, saveBankDeclaration, completeOnboarding };
