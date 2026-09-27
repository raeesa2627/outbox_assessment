import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';

export interface EmailJobData {
  dbJobId: string;
  userId?: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
    type?: string;
  }>;
  hourlyLimit: number;
  delayBetweenEmailsMs: number;
}

const connection = createRedisConnection();

export const EMAIL_QUEUE_NAME = 'email-queue';

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours in Redis for dashboard/auditing
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

emailQueue.on('error', (err) => {
  console.error('[BullMQ Queue] Error:', err);
});

/**
 * Adds an email job to the BullMQ queue with calculated delay.
 */
export const addEmailToQueue = async (
  jobData: EmailJobData,
  delayMs: number
): Promise<string> => {
  const job = await emailQueue.add('send-email', jobData, {
    delay: Math.max(delayMs, 0),
  });

  return job.id as string;
};

/**
 * Removes or cancels a scheduled job from the BullMQ queue.
 */
export const cancelJobFromQueue = async (bullJobId: string): Promise<boolean> => {
  try {
    const job = await emailQueue.getJob(bullJobId);
    if (job) {
      await job.remove();
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`[BullMQ Queue] Failed to remove job ${bullJobId}:`, error);
    return false;
  }
};

/**
 * Retrieves aggregate metrics of the email queue.
 */
export const getQueueMetrics = async () => {
  const [waiting, active, delayed, completed, failed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getDelayedCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    delayed,
    completed,
    failed,
    total: waiting + active + delayed + completed + failed,
  };
};
