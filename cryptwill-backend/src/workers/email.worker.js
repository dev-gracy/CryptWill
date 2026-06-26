const { Worker } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const { sendEmail } = require('../services/email.service');
const prisma = require('../config/db');

const emailWorker = new Worker(
  'email-notifications',
  async (job) => {
    const { to, subject, html, userId, type, channel } = job.data;
    
    try {
      await sendEmail({ to, subject, html });
      
      await prisma.notification.create({
        data: {
          userId,
          type,
          channel,
          status: 'SENT',
          recipient: to,
          subject,
          body: html,
          sentAt: new Date(),
        },
      });
    } catch (err) {
      console.error(`[Email Worker] Failed to send email to ${to}:`, err);
      await prisma.notification.create({
        data: {
          userId,
          type,
          channel,
          status: 'FAILED',
          recipient: to,
          subject,
          body: html,
          failureReason: err.message,
        },
      });
      throw err; // Trigger BullMQ retry
    }
  },
  { connection: getRedisConnection() }
);

emailWorker.on('completed', (job) => {
  console.log(`[Email Worker] Job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[Email Worker] Job ${job.id} failed:`, err.message);
});

module.exports = emailWorker;
