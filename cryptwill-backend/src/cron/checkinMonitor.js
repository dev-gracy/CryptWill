const cron = require('node-cron');
const { differenceInDays, addDays } = require('date-fns');
const prisma = require('../config/db');
const { getEmailQueue, getSmsQueue } = require('../config/queues');
const { signCheckinToken } = require('../utils/jwt.utils');
const { PLAN_LIMITS } = require('../middlewares/planGate.middleware');

function startCheckinMonitor() {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Starting daily check-in monitor');
    
    try {
      const contracts = await prisma.contract.findMany({
        where: { status: 'ACTIVE' },
        include: { user: true },
      });

      for (const contract of contracts) {
        if (!contract.nextCheckinDue) continue;
        
        const daysUntilDeadline = differenceInDays(contract.nextCheckinDue, new Date());
        const userPlanConfig = PLAN_LIMITS[contract.user.plan];
        
        // Generate a fresh one-click checkin token
        const checkinToken = signCheckinToken(contract.user.id, contract.id);
        const checkinLink = `${process.env.FRONTEND_URL}/checkin/instant/${checkinToken}`;

        if (daysUntilDeadline === 5) {
          await getEmailQueue().add('reminder-early', {
            to: contract.user.email,
            subject: '⏰ Your CryptWill check-in is due in 5 days',
            html: earlyReminderTemplate(contract.user.fullName, contract.nextCheckinDue, checkinLink),
            userId: contract.user.id,
            type: 'CHECKIN_REMINDER_EARLY',
            channel: 'EMAIL',
          });
        } 
        else if (daysUntilDeadline === 2) {
          await getEmailQueue().add('reminder-urgent', {
            to: contract.user.email,
            subject: '🚨 2 days left — check in now',
            html: urgentReminderTemplate(contract.user.fullName, contract.nextCheckinDue, checkinLink),
            userId: contract.user.id,
            type: 'CHECKIN_REMINDER_URGENT',
            channel: 'EMAIL',
          });

          if (userPlanConfig.smsNotifications && contract.user.phone) {
            await getSmsQueue().add('reminder-urgent-sms', {
              phone: contract.user.phone,
              body: `CryptWill: Check in now or guardians notified in 2 days. Link: ${checkinLink}`,
              userId: contract.user.id,
              type: 'CHECKIN_REMINDER_URGENT',
              channel: 'SMS',
            });
          }
        }
        else if (daysUntilDeadline === 0) {
          // Final 12-hour warning could be handled by a more frequent cron or just rely on day 0
          await getEmailQueue().add('reminder-final', {
            to: contract.user.email,
            subject: '⛔ Final notice — check in before midnight',
            html: finalReminderTemplate(contract.user.fullName, checkinLink),
            userId: contract.user.id,
            type: 'CHECKIN_REMINDER_FINAL',
            channel: 'EMAIL',
          });

          if (userPlanConfig.smsNotifications && contract.user.phone) {
            await getSmsQueue().add('reminder-final-sms', {
              phone: contract.user.phone,
              body: `CryptWill URGENT: Check in TODAY or inheritance starts tomorrow. Link: ${checkinLink}`,
              userId: contract.user.id,
              type: 'CHECKIN_REMINDER_FINAL',
              channel: 'SMS',
            });
          }
        }
        else if (daysUntilDeadline < 0) {
          await handleMissedCheckin(contract);
        }
      }
    } catch (err) {
      console.error('[Cron Error]', err);
    }
  });
}

async function handleMissedCheckin(contract) {
  const checkinToken = signCheckinToken(contract.user.id, contract.id);
  const emergencyLink = `${process.env.FRONTEND_URL}/checkin/instant/${checkinToken}`;
  const userPlanConfig = PLAN_LIMITS[contract.user.plan];

  const updatedContract = await prisma.contract.update({
    where: { id: contract.id },
    data: { 
      missedCheckinCount: { increment: 1 },
      // Push next due date forward to prevent re-triggering immediately if they miss multiple days
      nextCheckinDue: addDays(contract.nextCheckinDue, contract.checkinIntervalDays)
    },
  });

  await getEmailQueue().add('checkin-missed-owner', {
    to: contract.user.email,
    subject: '⚠️ You missed your check-in',
    html: missedCheckinOwnerTemplate(contract.user.fullName, emergencyLink),
    userId: contract.user.id,
    type: 'CHECKIN_MISSED',
    channel: 'EMAIL',
  });

  if (userPlanConfig.smsNotifications && contract.user.phone) {
    await getSmsQueue().add('checkin-missed-sms', {
      phone: contract.user.phone,
      body: `CryptWill: You missed your check-in. Guardians will be notified soon. Emergency check-in: ${emergencyLink}`,
      userId: contract.user.id,
      type: 'CHECKIN_MISSED',
      channel: 'SMS',
    });
  }

  // PRD: 3 consecutive misses triggers guardian alert (0, 1, 2 = 3 misses)
  if (updatedContract.missedCheckinCount >= 3) {
    await triggerGuardianAlert(updatedContract);
  }
}

async function triggerGuardianAlert(contract) {
  await prisma.contract.update({
    where: { id: contract.id },
    data: { status: 'TRIGGERED', triggerStartedAt: new Date() },
  });

  const guardians = await prisma.guardian.findMany({
    where: { userId: contract.userId, status: 'ACTIVE' },
  });

  // Emit socket event to owner to show triggered state
  const io = require('../index').io; // Assuming io is exported or accessible
  if (io) io.to(`user:${contract.userId}`).emit('contract-triggered', { contractId: contract.id });

  for (const guardian of guardians) {
    const voteLink = `${process.env.FRONTEND_URL}/guardian`;
    
    await getEmailQueue().add('guardian-alert', {
      to: guardian.email,
      subject: `⚠️ Guardian Action Required — ${contract.user.fullName} has been unreachable`,
      html: guardianAlertTemplate(guardian.fullName, contract.user.fullName, contract.missedCheckinCount, voteLink),
      userId: contract.userId,
      type: 'GUARDIAN_ALERT',
      channel: 'EMAIL',
    });

    if (guardian.phone) {
      await getSmsQueue().add('guardian-alert-sms', {
        phone: guardian.phone,
        body: `CryptWill: ${contract.user.fullName} missed check-ins. Guardian vote needed. Link: ${voteLink}`,
        userId: contract.userId,
        type: 'GUARDIAN_ALERT',
        channel: 'SMS',
      });
    }
  }
}

function earlyReminderTemplate(name, date, link) {
  return `<div style="font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0F5;padding:40px;border-radius:12px;">
    <h2 style="color:#4F6EF7;">⏰ Check-in due soon</h2>
    <p>Hi ${name}, your check-in is due on ${date.toDateString()}.</p>
    <a href="${link}" style="display:inline-block;background:#4F6EF7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">1-Click Check In Now →</a>
  </div>`;
}

function urgentReminderTemplate(name, date, link) {
  return `<div style="font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0F5;padding:40px;border-radius:12px;">
    <h2 style="color:#F59E0B;">🚨 2 Days Left</h2>
    <p>Hi ${name}, your check-in is due on ${date.toDateString()}. If you miss it, your missed check-in count will increase.</p>
    <a href="${link}" style="display:inline-block;background:#F59E0B;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Check In Now →</a>
  </div>`;
}

function finalReminderTemplate(name, link) {
  return `<div style="font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0F5;padding:40px;border-radius:12px;">
    <h2 style="color:#EF4444;">⛔ Final Notice</h2>
    <p>Hi ${name}, you must check in before midnight today.</p>
    <a href="${link}" style="display:inline-block;background:#EF4444;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Emergency Check In →</a>
  </div>`;
}

function missedCheckinOwnerTemplate(name, link) {
  return `<div style="font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0F5;padding:40px;border-radius:12px;">
    <h2 style="color:#EF4444;">⚠️ Missed Check-in</h2>
    <p>Hi ${name}, you missed your check-in deadline.</p>
    <p>If you miss 3 consecutive check-ins, your guardians will be notified to begin the inheritance process.</p>
    <a href="${link}" style="display:inline-block;background:#4F6EF7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Check In Now to Cancel Alert →</a>
  </div>`;
}

function guardianAlertTemplate(gName, oName, missedCount, link) {
  return `<div style="font-family:Inter,sans-serif;background:#0A0A0F;color:#F0F0F5;padding:40px;border-radius:12px;">
    <h2 style="color:#EF4444;">⚠️ Guardian Action Required</h2>
    <p>Hi ${gName},</p>
    <p><strong>${oName}</strong> has missed ${missedCount} consecutive check-ins on CryptWill.</p>
    <p>As a guardian, you must log in and vote to confirm if they have passed away, or deny if you know they are alive.</p>
    <p>You have 14 days to cast your vote.</p>
    <a href="${link}" style="display:inline-block;background:#EF4444;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Cast Vote Now →</a>
  </div>`;
}

module.exports = { startCheckinMonitor };
