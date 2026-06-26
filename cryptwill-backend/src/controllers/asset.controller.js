const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../middlewares/errorHandler');

async function listAssets(req, res) {
  try {
    const assets = await prisma.asset.findMany({
      where: { userId: req.user.id, isActive: true },
      include: { assignments: { include: { beneficiary: { select: { id: true, fullName: true, email: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, 200, { assets });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch assets');
  }
}

async function createAsset(req, res) {
  try {
    const { assetName, assetType, walletAddress, tokenCode, estimatedValueUsd, releaseDay, specialInstructions } = req.body;

    const asset = await prisma.asset.create({
      data: {
        userId: req.user.id,
        assetName,
        assetType,
        walletAddress,
        tokenCode,
        estimatedValueUsd: estimatedValueUsd ? parseFloat(estimatedValueUsd) : null,
        releaseDay: releaseDay ? parseInt(releaseDay) : 0,
        specialInstructions,
      },
    });
    return successResponse(res, 201, { asset });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to create asset');
  }
}

async function getAsset(req, res) {
  try {
    const asset = await prisma.asset.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { assignments: { include: { beneficiary: true } }, vaultFiles: true },
    });
    if (!asset) return errorResponse(res, 404, 'Asset not found');
    return successResponse(res, 200, { asset });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch asset');
  }
}

async function updateAsset(req, res) {
  try {
    const { assetName, walletAddress, tokenCode, estimatedValueUsd, releaseDay, specialInstructions } = req.body;
    const asset = await prisma.asset.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!asset) return errorResponse(res, 404, 'Asset not found');

    const updated = await prisma.asset.update({
      where: { id: req.params.id },
      data: {
        ...(assetName && { assetName }),
        ...(walletAddress !== undefined && { walletAddress }),
        ...(tokenCode !== undefined && { tokenCode }),
        ...(estimatedValueUsd !== undefined && { estimatedValueUsd: parseFloat(estimatedValueUsd) }),
        ...(releaseDay !== undefined && { releaseDay: parseInt(releaseDay) }),
        ...(specialInstructions !== undefined && { specialInstructions }),
      },
    });
    return successResponse(res, 200, { asset: updated });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to update asset');
  }
}

async function deleteAsset(req, res) {
  try {
    const asset = await prisma.asset.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!asset) return errorResponse(res, 404, 'Asset not found');

    await prisma.asset.update({ where: { id: req.params.id }, data: { isActive: false } });
    return successResponse(res, 200, { message: 'Asset removed' });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to delete asset');
  }
}

async function assignBeneficiary(req, res) {
  try {
    const { beneficiaryId, percentage, notes } = req.body;
    const asset = await prisma.asset.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!asset) return errorResponse(res, 404, 'Asset not found');

    const beneficiary = await prisma.beneficiary.findFirst({ where: { id: beneficiaryId, userId: req.user.id } });
    if (!beneficiary) return errorResponse(res, 404, 'Beneficiary not found');

    const assignment = await prisma.assetBeneficiaryAssignment.upsert({
      where: { assetId_beneficiaryId: { assetId: req.params.id, beneficiaryId } },
      update: { percentage: parseInt(percentage) || 100, notes },
      create: { assetId: req.params.id, beneficiaryId, percentage: parseInt(percentage) || 100, notes },
    });
    return successResponse(res, 200, { assignment });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to assign beneficiary');
  }
}

module.exports = { listAssets, createAsset, getAsset, updateAsset, deleteAsset, assignBeneficiary };
