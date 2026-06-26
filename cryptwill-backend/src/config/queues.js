const { Queue } = require('bullmq');
const { getRedisConnection } = require('./redis');

let emailQueue;
let smsQueue;

function getEmailQueue() {
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
