const { Queue } = require('bullmq');
const { getRedisConnection } = require('./redis');

let emailQueue;
let smsQueue;

function createNoopQueue(name) {
  return {
    name,
    async add() {
      return { id: `${name}-demo-job` };
    },
    async close() {
      return undefined;
    },
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
