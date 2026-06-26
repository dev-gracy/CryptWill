const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../middlewares/errorHandler');
const { getEmailQueue, getSmsQueue } = require('../config/queues');
const { signInviteToken, verifyToken, signAccessToken, verifyAccessToken } = require('../utils/jwt.utils');

async function listGuardians(req, res) {
  try {
    const guardians = await prisma.guardian.findMany({
      where: { userId: req.user.id },
      include: { votes: true },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, 200, { guardians });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch guardians');
  }
}

async function addGuardian(req, res) {
  try {
    const { fullName, email, phone } = req.body;

    const inviteToken = signInviteToken({ email, ownerId: req.user.id, role: 'guardian' });

    const guardian = await prisma.guardian.create({
      data: { userId: req.user.id, fullName, email, phone, inviteToken },
    });

    await getEmailQueue().add('guardian-invite', {
      to: email,
      subject: `${req.user.fullName} has named you as a Guardian on CryptWill`,
      html: guardianInviteTemplate(req.user.fullName, fullName, inviteToken),
      userId: req.user.id,
      type: 'GUARDIAN_INVITE',
      channel: 'EMAIL',
    });

    return successResponse(res, 201, { guardian });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to add guardian');
  }
}

async function removeGuardian(req, res) {
  try {
    const g = await prisma.guardian.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!g) return errorResponse(res, 404, 'Guardian not found');
    await prisma.guardian.update({ where: { id: req.params.id }, data: { status: 'REMOVED' } });
    return successResponse(res, 200, { message: 'Guardian removed' });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to remove guardian');
  }
}

async function acceptGuardianInvite(req, res) {
  try {
    const { token, password } = req.body;
    const decoded = verifyToken(token);
    if (decoded.role !== 'guardian') return errorResponse(res, 400, 'Invalid invite token');

    const guardian = await prisma.guardian.findFirst({ where: { inviteToken: token } });
    if (!guardian) return errorResponse(res, 404, 'Invite not found or already used');

    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    await prisma.guardian.update({
      where: { id: guardian.id },
      data: { status: 'ACTIVE', passwordHash, inviteToken: null, acceptedAt: new Date() },
    });

    const owner = await prisma.user.findUnique({ where: { id: guardian.userId } });
    await getEmailQueue().add('guardian-accepted', {
      to: owner.email,
      subject: `Guardian ${guardian.fullName} has accepted their role`,
      html: `<p>Hi ${owner.fullName}, <strong>${guardian.fullName}</strong> has accepted their guardian role on CryptWill. They are now active.</p>`,
      userId: owner.id,
      type: 'GUARDIAN_ACTIVATED',
      channel: 'EMAIL',
    });

    return successResponse(res, 200, { message: 'Guardian invitation accepted. You can now log in.' });
  } catch (err) {
    return errorResponse(res, 400, 'Invalid or expired invitation');
  }
}

async function guardianLogin(req, res) {
  try {
    const { email, password } = req.body;
    const guardian = await prisma.guardian.findFirst({ where: { email, status: 'ACTIVE' } });
    if (!guardian || !guardian.passwordHash) return errorResponse(res, 401, 'Invalid credentials');

    const valid = await bcrypt.compare(password, guardian.passwordHash);
    if (!valid) return errorResponse(res, 401, 'Invalid credentials');

    const token = signAccessToken({ userId: guardian.id, role: 'guardian', ownerId: guardian.userId });
    res.cookie('accessToken', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(res, 200, { guardian: { id: guardian.id, fullName: guardian.fullName, email: guardian.email } });
  } catch (err) {
    return errorResponse(res, 500, 'Guardian login failed');
  }
}

async function getGuardianDashboard(req, res) {
  try {
    const token = req.cookies.accessToken;
    if (!token) return errorResponse(res, 401, 'Not authenticated');
    const decoded = verifyAccessToken(token);
    if (decoded.role !== 'guardian') return errorResponse(res, 403, 'Not a guardian');

    const guardian = await prisma.guardian.findUnique({
      where: { id: decoded.userId },
      include: { votes: { include: { contract: true } } },
    });

    const owner = await prisma.user.findUnique({
      where: { id: decoded.ownerId },
      select: {
        fullName: true,
        contract: {
          select: {
            id: true, status: true, missedCheckinCount: true,
            triggerStartedAt: true, lastCheckinAt: true,
            votes: { include: { guardian: { select: { fullName: true } } } },
          },
        },
      },
    });

    return successResponse(res, 200, { guardian, owner });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to load guardian dashboard');
  }
}

async function castVote(req, res) {
  try {
    const token = req.cookies.accessToken;
    if (!token) return errorResponse(res, 401, 'Not authenticated');
    const decoded = verifyAccessToken(token);
    if (decoded.role !== 'guardian') return errorResponse(res, 403, 'Not a guardian');

    const { contractId } = req.params;
    const { vote, notes } = req.body;

    if (!['APPROVE', 'DENY'].includes(vote)) return errorResponse(res, 400, 'Vote must be APPROVE or DENY');

    const contract = await prisma.contract.findFirst({
      where: { id: contractId, status: { in: ['TRIGGERED', 'EXECUTING'] } },
      include: { user: true, votes: { include: { guardian: true } } },
    });
    if (!contract) return errorResponse(res, 404, 'Contract not found or not in voting state');

    const guardian = await prisma.guardian.findUnique({ where: { id: decoded.userId } });
    if (!guardian || guardian.userId !== contract.userId) return errorResponse(res, 403, 'Not authorized');

    const guardianVote = await prisma.guardianVote.upsert({
      where: { contractId_guardianId: { contractId, guardianId: guardian.id } },
      update: { vote, notes },
      create: { contractId, guardianId: guardian.id, vote, notes },
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) io.to(`contract:${contractId}`).emit('vote-update', { guardianId: guardian.id, vote, notes });

    // Notify all guardians of vote update
    const allGuardians = await prisma.guardian.findMany({ where: { userId: contract.userId, status: 'ACTIVE' } });
    const approveCount = contract.votes.filter(v => v.vote === 'APPROVE').length + (vote === 'APPROVE' ? 1 : 0);
    const denyCount = contract.votes.filter(v => v.vote === 'DENY').length + (vote === 'DENY' ? 1 : 0);

    for (const g of allGuardians) {
      if (g.id !== guardian.id) {
        await getEmailQueue().add('vote-update', {
          to: g.email,
          subject: `Guardian vote update — ${approveCount} of ${contract.guardianQuorum} confirmed`,
          html: voteUpdateTemplate(g.fullName, contract.user.fullName, approveCount, denyCount, contract.guardianQuorum),
          userId: contract.userId,
          type: 'GUARDIAN_VOTE_UPDATE',
          channel: 'EMAIL',
        });
      }
    }

    // Check quorum
    if (approveCount >= contract.guardianQuorum) {
      await prisma.contract.update({ where: { id: contractId }, data: { status: 'EXECUTING' } });
      if (io) io.to(`contract:${contractId}`).emit('quorum-reached', { contractId });

      const beneficiaries = await prisma.beneficiary.findMany({ where: { userId: contract.userId, status: 'ACTIVE' } });
      for (const b of beneficiaries) {
        await getEmailQueue().add('quorum-reached', {
          to: b.email,
          subject: `Guardian consensus reached — inheritance begins`,
          html: `<p>Hi ${b.fullName}, the guardian consensus has been reached. ${contract.user.fullName}'s inheritance process is now executing. You will receive your assets automatically.</p>`,
          userId: contract.userId,
          type: 'GUARDIAN_QUORUM_REACHED',
          channel: 'EMAIL',
        });
      }
    }

    if (vote === 'DENY') {
      for (const g of allGuardians) {
        await getEmailQueue().add('guardian-denied', {
          to: g.email,
          subject: `A Guardian has denied — 48hr hold`,
          html: deniedTemplate(g.fullName, guardian.fullName, notes || ''),
          userId: contract.userId,
          type: 'GUARDIAN_DENIED',
          channel: 'EMAIL',
        });
      }
    }

    return successResponse(res, 200, { vote: guardianVote, approveCount, denyCount });
  } catch (err) {
    console.error('[castVote]', err);
    return errorResponse(res, 500, 'Failed to cast vote');
  }
}

async function getVotes(req, res) {
  try {
    const { contractId } = req.params;
    const votes = await prisma.guardianVote.findMany({
      where: { contractId },
      include: { guardian: { select: { fullName: true, email: true } } },
    });
    return successResponse(res, 200, { votes });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch votes');
  }
}

function guardianInviteTemplate(ownerName, guardianName, token) {
  const link = `${process.env.FRONTEND_URL}/guardian/invite/${token}`;
  return `
  <div style="font-family: Inter, sans-serif; background:#0A0A0F; color:#F0F0F5; padding:40px; max-width:480px; margin:auto; border-radius:12px;">
    <h2 style="color:#4F6EF7;">CryptWill — Guardian Invitation</h2>
    <p>Hi ${guardianName},</p>
    <p><strong>${ownerName}</strong> has named you as a Guardian on CryptWill.</p>
    <p>As a guardian, you will be asked to confirm if ${ownerName} has passed away. Your vote (along with other guardians) will trigger the inheritance process.</p>
    <a href="${link}" style="display:inline-block; background:#4F6EF7; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; margin-top:16px;">Accept Guardian Role →</a>
    <p style="color:#9090A0; font-size:14px; margin-top:24px;">This is a significant responsibility. Please only accept if you personally know ${ownerName}.</p>
  </div>`;
}

function voteUpdateTemplate(name, ownerName, approve, deny, quorum) {
  return `<div style="font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0F5;padding:40px;border-radius:12px;">
    <h2 style="color:#4F6EF7;">Vote Update</h2>
    <p>Hi ${name}, the guardian vote for ${ownerName}'s estate has been updated.</p>
    <p><strong>${approve} Approve | ${deny} Deny | ${quorum} needed</strong></p>
    <a href="${process.env.FRONTEND_URL}/guardian/dashboard" style="display:inline-block;background:#4F6EF7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">View Dashboard →</a>
  </div>`;
}

function deniedTemplate(name, denierName, notes) {
  return `<div style="font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0F5;padding:40px;border-radius:12px;">
    <h2 style="color:#EF4444;">Guardian Denied</h2>
    <p>Hi ${name}, guardian <strong>${denierName}</strong> has denied the inheritance vote.</p>
    <p>Reason: ${notes || 'No reason provided'}</p>
    <p>A 48-hour review hold has been placed. Please log in to review.</p>
  </div>`;
}

module.exports = {
  listGuardians, addGuardian, removeGuardian, acceptGuardianInvite,
  guardianLogin, getGuardianDashboard, castVote, getVotes,
};
