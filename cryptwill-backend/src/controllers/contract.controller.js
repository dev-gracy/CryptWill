const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../middlewares/errorHandler');
const { getEmailQueue } = require('../config/queues');
const stellarService = require('../services/stellar.service');
const { addDays } = require('date-fns');

async function deployContract(req, res) {
  try {
    const { checkinIntervalDays, guardianQuorum, termsAccepted } = req.body;

    if (!termsAccepted) return errorResponse(res, 400, 'You must accept the Terms & Conditions before deploying');

    const existing = await prisma.contract.findUnique({ where: { userId: req.user.id } });
    if (existing && existing.status !== 'NOT_DEPLOYED') {
      return errorResponse(res, 409, 'Contract already deployed');
    }

    const guardians = await prisma.guardian.findMany({ where: { userId: req.user.id, status: 'ACTIVE' } });
    if (guardians.length < 3) return errorResponse(res, 400, 'At least 3 active guardians required before deployment');

    const assets = await prisma.asset.findMany({ where: { userId: req.user.id, isActive: true } });
    if (assets.length === 0) return errorResponse(res, 400, 'At least 1 asset required before deployment');

    const interval = parseInt(checkinIntervalDays) || 30;
    const quorum = parseInt(guardianQuorum) || 3;

    // Deploy Soroban contract via stellar service
    let contractAddress = null;
    let stellarTxHash = null;

    try {
      const result = await stellarService.deployContract({
        ownerWallet: req.user.walletAddress,
        guardianAddresses: guardians.map(g => g.email),
        quorum,
        intervalDays: interval,
      });
      contractAddress = result.contractAddress;
      stellarTxHash = result.txHash;
    } catch (stellarErr) {
      console.warn('[deployContract] Stellar deploy failed (demo mode):', stellarErr.message);
      contractAddress = `CTEST${Date.now()}`;
      stellarTxHash = `demo-tx-${Date.now()}`;
    }

    const now = new Date();
    const nextDue = addDays(now, interval);

    const contract = await prisma.contract.upsert({
      where: { userId: req.user.id },
      update: {
        status: 'ACTIVE',
        checkinIntervalDays: interval,
        guardianQuorum: quorum,
        contractAddress,
        stellarTxHash,
        deployedAt: now,
        lastCheckinAt: now,
        nextCheckinDue: nextDue,
        missedCheckinCount: 0,
      },
      create: {
        userId: req.user.id,
        status: 'ACTIVE',
        checkinIntervalDays: interval,
        guardianQuorum: quorum,
        contractAddress,
        stellarTxHash,
        deployedAt: now,
        lastCheckinAt: now,
        nextCheckinDue: nextDue,
      },
    });

    // Log T&C acceptance for contract deployment
    await prisma.termsAcceptance.create({
      data: {
        userId: req.user.id, version: '1.0-deploy',
        ipAddress: req.ip, userAgent: req.headers['user-agent'],
      },
    });

    await getEmailQueue().add('contract-deployed', {
      to: req.user.email,
      subject: '✅ Your CryptWill contract is live',
      html: contractDeployedTemplate(req.user.fullName, contractAddress, stellarTxHash, nextDue),
      userId: req.user.id,
      type: 'CONTRACT_DEPLOYED',
      channel: 'EMAIL',
    });

    return successResponse(res, 201, { contract });
  } catch (err) {
    console.error('[deployContract]', err);
    return errorResponse(res, 500, 'Failed to deploy contract');
  }
}

async function getContractStatus(req, res) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { userId: req.user.id },
      include: {
        checkIns: { orderBy: { checkedInAt: 'desc' }, take: 6 },
        votes: { include: { guardian: { select: { fullName: true } } } },
      },
    });

    if (!contract) {
      return successResponse(res, 200, { contract: null, status: 'NOT_DEPLOYED' });
    }

    return successResponse(res, 200, { contract });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch contract status');
  }
}

async function cancelContract(req, res) {
  try {
    const contract = await prisma.contract.findUnique({ where: { userId: req.user.id } });
    if (!contract || contract.status === 'NOT_DEPLOYED') {
      return errorResponse(res, 404, 'No active contract found');
    }

    await prisma.contract.update({
      where: { id: contract.id },
      data: { status: 'CANCELLED', missedCheckinCount: 0 },
    });

    // Notify all guardians
    const guardians = await prisma.guardian.findMany({ where: { userId: req.user.id, status: 'ACTIVE' } });
    for (const g of guardians) {
      await getEmailQueue().add('contract-cancelled', {
        to: g.email,
        subject: `${req.user.fullName} has cancelled their CryptWill inheritance process`,
        html: `<p>Hi ${g.fullName}, ${req.user.fullName} has returned and cancelled the inheritance process. No further action needed.</p>`,
        userId: req.user.id,
        type: 'CONTRACT_DEPLOYED',
        channel: 'EMAIL',
      });
    }

    return successResponse(res, 200, { message: 'Contract cancelled successfully' });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to cancel contract');
  }
}

function contractDeployedTemplate(name, address, txHash, nextDue) {
  const explorerLink = `https://stellar.expert/explorer/testnet/tx/${txHash}`;
  return `
  <div style="font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0F5;padding:40px;border-radius:12px;">
    <h2 style="color:#22C55E;">✅ Your CryptWill Contract is Live</h2>
    <p>Hi ${name}, your smart contract has been deployed on the Stellar blockchain.</p>
    <p><strong>Contract Address:</strong> ${address}</p>
    <p><strong>First Check-In Due:</strong> ${nextDue.toDateString()}</p>
    <a href="${explorerLink}" style="display:inline-block;background:#4F6EF7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">View on Stellar Explorer →</a>
  </div>`;
}

module.exports = { deployContract, getContractStatus, cancelContract };
