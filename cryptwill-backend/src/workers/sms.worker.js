const { Worker } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const { sendSMS } = require('../services/sms.service');
const prisma = require('../config/db');

const smsWorker = new Worker(
  'sms-notifications',
  async (job) => {
    const { phone, body, userId, type, channel } = job.data;
    
    try {
      await sendSMS({ to: phone, body });
      
      await prisma.notification.create({
        data: {
          userId,
          type,
          channel,
          status: 'SENT',
          recipient: phone,
          body,
          sentAt: new Date(),
        },
      });
    } catch (err) {
      console.error(`[SMS Worker] Failed to send SMS to ${phone}:`, err);
      await prisma.notification.create({
        data: {
          userId,
          type,
          channel,
          status: 'FAILED',
          recipient: phone,
          body,
          failureReason: err.message,
        },
      });
      throw err; // Trigger BullMQ retry
    }
  },
  { connection: getRedisConnection() }
);

smsWorker.on('completed', (job) => {
  console.log(`[SMS Worker] Job ${job.id} completed`);
});

smsWorker.on('failed', (job, err) => {
  console.error(`[SMS Worker] Job ${job.id} failed:`, err.message);
});

module.exports = smsWorker;
