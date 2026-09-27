import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { config } from '../config';
import { EmailJob } from '../models/EmailJob';

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

export const EMAIL_QUEUE_NAME = 'email-queue';

let queueInstance: Queue<EmailJobData> | null = null;

try {
  const connection = createRedisConnection();
  queueInstance = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
    connection: connection as any,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 24 * 3600,
        count: 1000,
      },
      removeOnFail: {
        age: 7 * 24 * 3600,
      },
    },
  });

  queueInstance.on('error', () => {
    // Suppress unhandled crash in pure MongoDB mode
  });
} catch {
  queueInstance = null;
}

export const emailQueue = queueInstance;

/**
 * Adds an email job to the queue.
 */
export const addEmailToQueue = async (
  jobData: EmailJobData,
  delayMs: number
): Promise<string> => {
  if (emailQueue) {
    try {
      const job = await emailQueue.add('send-email', jobData, {
        delay: Math.max(delayMs, 0),
      });
      return job.id as string;
    } catch {
      // Fallback
    }
  }
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
};

/**
 * Removes or cancels a scheduled job.
 */
export const cancelJobFromQueue = async (bullJobId: string): Promise<boolean> => {
  if (emailQueue) {
    try {
      const job = await emailQueue.getJob(bullJobId);
      if (job) {
        await job.remove();
        return true;
      }
    } catch {
      return false;
    }
  }
  return true;
};

/**
 * Retrieves aggregate metrics of the email queue from BullMQ or MongoDB.
 */
export const getQueueMetrics = async () => {
  if (emailQueue) {
    try {
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
    } catch {
      // Fallback to MongoDB metrics
    }
  }

  const [scheduled, processing, sent, failed] = await Promise.all([
    EmailJob.countDocuments({ status: 'scheduled' }),
    EmailJob.countDocuments({ status: 'processing' }),
    EmailJob.countDocuments({ status: 'sent' }),
    EmailJob.countDocuments({ status: 'failed' }),
  ]);

  return {
    waiting: 0,
    active: processing,
    delayed: scheduled,
    completed: sent,
    failed,
    total: scheduled + processing + sent + failed,
  };
};

