const express = require('express');
const router = express.Router();
const { protect, requireOnboarded } = require('../middlewares/auth.middleware');
const { requirePlan } = require('../middlewares/planGate.middleware');
const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../middlewares/errorHandler');
const { getEmailQueue } = require('../config/queues');
const { signInviteToken } = require('../utils/jwt.utils');

const { seedDemoLawyerTeam } = require('../services/lawyerTeam.service');

router.use(protect, requireOnboarded, requirePlan('ENTERPRISE'));

// GET /api/lawyers — list all lawyer team members
router.get('/', async (req, res) => {
  try {
    let team = await prisma.lawyerTeamMember.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!team.length) {
      await seedDemoLawyerTeam(req.user.id);
      team = await prisma.lawyerTeamMember.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    return successResponse(res, 200, { team });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch lawyer team');
  }
});

// POST /api/lawyers — add a lawyer/legal team member
router.post('/', async (req, res) => {
  try {
    const { fullName, email, role, firmName, phone, barNumber, experience, notes } = req.body;
    if (!fullName || !email) return errorResponse(res, 400, 'Name and email are required');

    const inviteToken = signInviteToken({ email, ownerId: req.user.id, role: 'lawyer' });

    const member = await prisma.lawyerTeamMember.create({
      data: {
        userId: req.user.id,
        fullName,
        email,
        role: role || 'LAWYER',
        firmName: firmName || null,
        phone: phone || null,
        barNumber: barNumber || null,
        experience: experience || null,
        notes: notes || null,
        inviteToken,
      },
    });

    // Notify the lawyer
    await getEmailQueue().add('lawyer-invite', {
      to: email,
      subject: `${req.user.fullName} has added you to their CryptWill legal team`,
      html: lawyerInviteTemplate(req.user.fullName, fullName, role || 'LAWYER', firmName),
      userId: req.user.id,
      type: 'LAWYER_INVITE',
      channel: 'EMAIL',
    });

    return successResponse(res, 201, { member });
  } catch (err) {
    console.error('[lawyer create]', err);
    return errorResponse(res, 500, 'Failed to add lawyer team member');
  }
});

// PUT /api/lawyers/:id — update lawyer info
router.put('/:id', async (req, res) => {
  try {
    const m = await prisma.lawyerTeamMember.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!m) return errorResponse(res, 404, 'Member not found');

    const { fullName, role, firmName, phone, barNumber, experience, notes, status } = req.body;
    const updated = await prisma.lawyerTeamMember.update({
      where: { id: req.params.id },
      data: {
        ...(fullName  && { fullName }),
        ...(role      && { role }),
        ...(firmName  !== undefined && { firmName }),
        ...(phone     !== undefined && { phone }),
        ...(barNumber !== undefined && { barNumber }),
        ...(experience !== undefined && { experience }),
        ...(notes     !== undefined && { notes }),
        ...(status    && { status }),
      },
    });
    return successResponse(res, 200, { member: updated });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to update lawyer team member');
  }
});

// DELETE /api/lawyers/:id — remove a lawyer
router.delete('/:id', async (req, res) => {
  try {
    const m = await prisma.lawyerTeamMember.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!m) return errorResponse(res, 404, 'Member not found');
    await prisma.lawyerTeamMember.delete({ where: { id: req.params.id } });
    return successResponse(res, 200, { message: 'Lawyer team member removed' });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to remove lawyer team member');
  }
});

function lawyerInviteTemplate(ownerName, lawyerName, role, firm) {
  return `
  <div style="font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0F5;padding:40px;max-width:480px;margin:auto;border-radius:12px;">
    <h2 style="color:#4F6EF7;">CryptWill — Legal Team Invitation</h2>
    <p>Hi ${lawyerName},</p>
    <p><strong>${ownerName}</strong> has added you as a <strong>${role}</strong>${firm ? ` from <strong>${firm}</strong>` : ''} to their CryptWill digital estate plan.</p>
    <p>You have been designated to assist with the legal aspects of their digital inheritance. Your details have been recorded in their estate plan.</p>
    <p style="color:#9090A0;font-size:14px;margin-top:24px;">This is a notification only. No action is required from you at this time.</p>
  </div>`;
}

module.exports = router;
