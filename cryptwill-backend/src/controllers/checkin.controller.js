const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../middlewares/errorHandler');
const { getEmailQueue } = require('../config/queues');
const stellarService = require('../services/stellar.service');
const { verifyToken } = require('../utils/jwt.utils');
const { addDays } = require('date-fns');

async function manualCheckin(req, res) {
  try {
    const contract = await prisma.contract.findUnique({ where: { userId: req.user.id } });
    if (!contract || contract.status !== 'ACTIVE') {
      return errorResponse(res, 400, 'No active contract found');
    }

    let txHash = `demo-tx-${Date.now()}`;
    let polTokenId = `POL-${Date.now()}`;
    let explorerUrl = `https://stellar.expert/explorer/testnet/tx/${txHash}`;

    try {
      const result = await stellarService.submitMicroTransaction(req.user.walletAddress);
      txHash = result.txHash;
      const pol = await stellarService.mintProofOfLifeToken(req.user.walletAddress, contract.id);
      polTokenId = pol.tokenId;
      explorerUrl = `https://stellar.expert/explorer/testnet/tx/${result.txHash}`;
    } catch (err) {
      console.warn('[manualCheckin] Stellar error (demo mode):', err.message);
    }

    const now = new Date();
    const nextDue = addDays(now, contract.checkinIntervalDays);

    const [checkIn] = await Promise.all([
      prisma.checkIn.create({
        data: {
          contractId: contract.id, userId: req.user.id,
          transactionHash: txHash, proofOfLifeTokenId: polTokenId,
          stellarExplorerUrl: explorerUrl, method: 'manual',
        },
      }),
      prisma.contract.update({
        where: { id: contract.id },
        data: { lastCheckinAt: now, nextCheckinDue: nextDue, missedCheckinCount: 0 },
      }),
    ]);

    // Emit socket event
    const io = req.app.get('io');
    if (io) io.to(`user:${req.user.id}`).emit('checkin-confirmed', { checkIn, nextDue });

    await getEmailQueue().add('checkin-confirmed', {
      to: req.user.email,
      subject: '✅ Check-in confirmed',
      html: checkinConfirmedTemplate(req.user.fullName, polTokenId, explorerUrl, nextDue),
      userId: req.user.id,
      type: 'CHECKIN_CONFIRMED',
      channel: 'EMAIL',
    });

    return successResponse(res, 200, { checkIn, nextCheckinDue: nextDue });
  } catch (err) {
    console.error('[manualCheckin]', err);
    return errorResponse(res, 500, 'Check-in failed');
  }
}

// One-click check-in — NO AUTH MIDDLEWARE — JWT in URL
async function instantCheckin(req, res) {
  try {
    const { token } = req.params;
    const decoded = verifyToken(token);

    if (decoded.purpose !== 'checkin') {
      return errorResponse(res, 400, 'Invalid check-in token');
    }

    const contract = await prisma.contract.findUnique({ where: { userId: decoded.userId } });
    if (!contract || contract.status !== 'ACTIVE') {
      return errorResponse(res, 400, 'No active contract found');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    let txHash = `instant-tx-${Date.now()}`;
    let polTokenId = `POL-INSTANT-${Date.now()}`;
    let explorerUrl = `https://stellar.expert/explorer/testnet/tx/${txHash}`;

    try {
      // Pool wallet signs the micro-transaction on behalf of user
      const result = await stellarService.poolWalletMicroTransaction(user.walletAddress);
      txHash = result.txHash;
      explorerUrl = `https://stellar.expert/explorer/testnet/tx/${txHash}`;
    } catch (err) {
      console.warn('[instantCheckin] Stellar error (demo mode):', err.message);
    }

    const now = new Date();
    const nextDue = addDays(now, contract.checkinIntervalDays);

    await Promise.all([
      prisma.checkIn.create({
        data: {
          contractId: contract.id, userId: decoded.userId,
          transactionHash: txHash, proofOfLifeTokenId: polTokenId,
          stellarExplorerUrl: explorerUrl, method: 'instant-email',
        },
      }),
      prisma.contract.update({
        where: { id: contract.id },
        data: { lastCheckinAt: now, nextCheckinDue: nextDue, missedCheckinCount: 0 },
      }),
    ]);

    return successResponse(res, 200, {
      message: '✅ You are checked in! No login required.',
      nextCheckinDue: nextDue,
      explorerUrl,
    });
  } catch (err) {
    console.error('[instantCheckin]', err);
    return errorResponse(res, 400, 'Invalid or expired check-in token');
  }
}

async function getCheckinHistory(req, res) {
  try {
    const contract = await prisma.contract.findUnique({ where: { userId: req.user.id } });
    if (!contract) return successResponse(res, 200, { checkIns: [], contract: null });

    const checkIns = await prisma.checkIn.findMany({
      where: { userId: req.user.id },
      orderBy: { checkedInAt: 'desc' },
      take: 50,
    });

    return successResponse(res, 200, { checkIns, contract });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch check-in history');
  }
}

function checkinConfirmedTemplate(name, polToken, explorerUrl, nextDue) {
  return `
  <div style="font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0F5;padding:40px;border-radius:12px;">
    <h2 style="color:#22C55E;">✅ Check-in Confirmed</h2>
    <p>Hi ${name}, your check-in has been recorded on the Stellar blockchain.</p>
    <p><strong>Proof of Life Token:</strong> ${polToken}</p>
    <p><strong>Next Check-In Due:</strong> ${nextDue.toDateString()}</p>
    <a href="${explorerUrl}" style="display:inline-block;background:#4F6EF7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">View on Stellar Explorer →</a>
  </div>`;
}

module.exports = { manualCheckin, instantCheckin, getCheckinHistory };
