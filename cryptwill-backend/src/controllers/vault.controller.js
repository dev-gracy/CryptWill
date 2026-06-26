const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../middlewares/errorHandler');
const pinataService = require('../services/pinata.service');
const { PLAN_LIMITS } = require('../middlewares/planGate.middleware');

async function listFiles(req, res) {
  try {
    const files = await prisma.vaultFile.findMany({
      where: { userId: req.user.id },
      include: { beneficiary: { select: { id: true, fullName: true } } },
      orderBy: { uploadedAt: 'desc' },
    });

    // Compute storage used
    const totalBytes = files.reduce((sum, f) => sum + f.fileSizeBytes, 0);
    const limitBytes = PLAN_LIMITS[req.user.plan].vaultStorageBytes;

    return successResponse(res, 200, { files, storage: { usedBytes: totalBytes, limitBytes } });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch vault files');
  }
}

async function uploadFile(req, res) {
  try {
    if (!req.file) return errorResponse(res, 400, 'No file uploaded');

    const files = await prisma.vaultFile.findMany({ where: { userId: req.user.id } });
    const usedBytes = files.reduce((sum, f) => sum + f.fileSizeBytes, 0);
    const limitBytes = PLAN_LIMITS[req.user.plan].vaultStorageBytes;

    if (usedBytes + req.file.size > limitBytes) {
      return errorResponse(res, 403, `Storage limit reached (${Math.round(limitBytes / 1024 / 1024)}MB for your plan)`);
    }

    // File arrives already AES-256 encrypted from client — server never sees plaintext
    const ipfsHash = await pinataService.uploadBuffer(req.file.buffer, req.file.originalname);

    const { assignedBeneficiaryId, assetId, encryptionKeyRef } = req.body;

    const vaultFile = await prisma.vaultFile.create({
      data: {
        userId: req.user.id,
        fileName: req.file.originalname,
        fileSizeBytes: req.file.size,
        fileType: req.file.mimetype,
        ipfsHash,
        isEncrypted: true,
        encryptionKeyRef: encryptionKeyRef || null,
        assignedBeneficiaryId: assignedBeneficiaryId || null,
        assetId: assetId || null,
      },
    });

    return successResponse(res, 201, { file: vaultFile });
  } catch (err) {
    console.error('[uploadFile]', err);
    return errorResponse(res, 500, 'File upload failed');
  }
}

async function deleteFile(req, res) {
  try {
    const file = await prisma.vaultFile.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!file) return errorResponse(res, 404, 'File not found');

    try {
      await pinataService.unpinFile(file.ipfsHash);
    } catch (pinataErr) {
      console.warn('[deleteFile] Pinata unpin failed:', pinataErr.message);
    }

    await prisma.vaultFile.delete({ where: { id: req.params.id } });
    return successResponse(res, 200, { message: 'File deleted' });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to delete file');
  }
}

async function reassignFile(req, res) {
  try {
    const file = await prisma.vaultFile.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!file) return errorResponse(res, 404, 'File not found');

    const { assignedBeneficiaryId } = req.body;
    const updated = await prisma.vaultFile.update({
      where: { id: req.params.id },
      data: { assignedBeneficiaryId: assignedBeneficiaryId || null },
    });

    return successResponse(res, 200, { file: updated });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to reassign file');
  }
}

module.exports = { listFiles, uploadFile, deleteFile, reassignFile };
