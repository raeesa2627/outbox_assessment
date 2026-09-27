import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { EMAIL_QUEUE_NAME, EmailJobData, addEmailToQueue } from '../queues/emailQueue';
import { EmailJob } from '../models/EmailJob';
import { User } from '../models/User';
import { sendEmail } from '../services/mailer';
import { checkAndIncrementRateLimit } from '../services/rateLimiter';
import { sendSlackNotification } from '../services/slack';
import { config } from '../config';

const connection = createRedisConnection();

export const setupEmailWorker = () => {
  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      const { dbJobId, senderEmail, recipientEmail, subject, bodyHtml, attachments, hourlyLimit, delayBetweenEmailsMs, userId } = job.data;
      console.log(`[Worker] Picked up job ${job.id} for recipient: ${recipientEmail} from: ${senderEmail}`);

      // 1. Fetch job record from MongoDB
      const emailDoc = await EmailJob.findById(dbJobId);
      if (!emailDoc) {
        console.warn(`[Worker] Database record ${dbJobId} not found. Skipping.`);
        return { status: 'skipped', reason: 'Record not found' };
      }

      if (emailDoc.status === 'cancelled') {
        console.log(`[Worker] Job ${dbJobId} was cancelled by user. Discarding.`);
        return { status: 'cancelled' };
      }

      // Mark processing in DB
      emailDoc.status = 'processing';
      await emailDoc.save();

      // 2. Check and atomically increment hourly rate limit in Redis
      const rateLimitResult = await checkAndIncrementRateLimit(senderEmail, hourlyLimit || config.maxEmailsPerHour);

      if (!rateLimitResult.allowed) {
        console.warn(
          `[Worker] ⚠️ Hourly rate limit (${rateLimitResult.limit}/hr) hit for ${senderEmail}! Rescheduling to next window.`
        );

        // Fetch user for custom Slack webhook if configured
        let slackWebhook = config.defaultSlackWebhookUrl;
        if (userId) {
          const userDoc = await User.findById(userId);
          if (userDoc?.slackWebhookUrl) {
            slackWebhook = userDoc.slackWebhookUrl;
          }
        }

        // Send Slack alert
        await sendSlackNotification(slackWebhook, 'Email Rate Limit Reached', {
          senderEmail,
          hourlyLimit: rateLimitResult.limit,
          currentCount: rateLimitResult.currentCount,
          nextAvailableWindow: rateLimitResult.nextAvailableWindow,
          jobId: job.id,
          recipientEmail,
          subject,
        });

        // Re-queue the email for the next hour window (CRITICAL PRD REQUIREMENT: Do not drop/fail!)
        const newBullJobId = await addEmailToQueue(job.data, rateLimitResult.delayMs);

        emailDoc.status = 'scheduled';
        emailDoc.scheduledAt = rateLimitResult.nextAvailableWindow;
        emailDoc.bullJobId = newBullJobId;
        await emailDoc.save();

        return {
          status: 'rescheduled',
          rescheduledTo: rateLimitResult.nextAvailableWindow,
          newBullJobId,
        };
      }

      // 3. Send email via Nodemailer (Ethereal fake SMTP)
      try {
        const mailAttachments = attachments?.map((att) => ({
          filename: att.name,
          path: att.url,
        }));

        const result = await sendEmail({
          from: senderEmail,
          to: recipientEmail,
          subject,
          html: bodyHtml,
          attachments: mailAttachments,
        });

        // Update MongoDB document as Sent
        emailDoc.status = 'sent';
        emailDoc.sentAt = new Date();
        emailDoc.etherealPreviewUrl = result.previewUrl;
        await emailDoc.save();

        console.log(`[Worker] ✅ Email successfully sent to ${recipientEmail}. Preview: ${result.previewUrl}`);

        // Enforce delay between emails if specified
        if (delayBetweenEmailsMs && delayBetweenEmailsMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenEmailsMs));
        }

        return {
          status: 'sent',
          messageId: result.messageId,
          previewUrl: result.previewUrl,
        };
      } catch (err: any) {
        console.error(`[Worker] ❌ Failed to send email to ${recipientEmail}:`, err);
        emailDoc.status = 'failed';
        emailDoc.errorReason = err.message || 'Unknown error occurred during email transmission';
        await emailDoc.save();
        throw err;
      }
    },
    {
      connection,
      concurrency: config.workerConcurrency,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Fatal worker error:', err);
  });

  console.log(`[Worker] Email BullMQ Worker initialized with concurrency: ${config.workerConcurrency}`);
  return worker;
};
