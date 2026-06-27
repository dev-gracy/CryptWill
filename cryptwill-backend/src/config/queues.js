const { Queue } = require('bullmq');
const { getRedisConnection } = require('./redis');

let emailQueue;
let smsQueue;

// FIX: In demo mode (RUN_WORKERS=false), the noop queue now calls sendEmail directly
// instead of silently dropping notifications. This is why emails weren't sending.
function createNoopQueue(name) {
  return {
    name,
    async add(jobName, data) {
      if (data && data.to && data.html) {
        let status = 'SENT';
        let failureReason = null;

        try {
          const { sendEmail } = require('../services/email.service');
          await sendEmail({ to: data.to, subject: data.subject || 'CryptWill Notification', html: data.html });
          console.log(`[Queue-Direct] Email sent to ${data.to} [${jobName}]`);
        } catch (e) {
          status = 'FAILED';
          failureReason = e.message;
          console.warn(`[Queue-Direct] Email failed [${jobName}]:`, e.message);
        }

        if (data.userId) {
          try {
            const prisma = require('../config/db');
            await prisma.notification.create({
              data: {
                userId: data.userId,
                type: data.type || jobName.toUpperCase(),
                channel: data.channel || 'EMAIL',
                status,
                recipient: data.to,
                subject: data.subject || '',
                body: data.html,
                failureReason,
                sentAt: status === 'SENT' ? new Date() : null,
              },
            });
          } catch (dbErr) {
            console.warn('[Queue-Direct] Notification log failed:', dbErr.message);
          }
        }
      }

      if (data && data.to && data.sms && (data.channel === 'SMS')) {
        try {
          const { sendSms } = require('../services/sms.service');
          await sendSms({ to: data.to, body: data.sms });
        } catch (e) {
          console.warn(`[Queue-Direct] SMS failed [${jobName}]:`, e.message);
        }
      }

      return { id: `direct-${Date.now()}` };
    },
    async close() { return undefined; },
  };
}

function getEmailQueue() {
  if (process.env.RUN_WORKERS !== 'true') {
    return createNoopQueue('email-notifications');
  }

  if (!emailQueue) {
    emailQueue = new Queue('email-notifications', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return emailQueue;
}

function getSmsQueue() {
  if (process.env.RUN_WORKERS !== 'true') {
    return createNoopQueue('sms-notifications');
  }

  if (!smsQueue) {
    smsQueue = new Queue('sms-notifications', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return smsQueue;
}

module.exports = { getEmailQueue, getSmsQueue };
