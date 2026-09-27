import { EmailJob } from '../models/EmailJob';
import { User } from '../models/User';
import { sendEmail } from '../services/mailer';
import { checkAndIncrementRateLimit } from '../services/rateLimiter';
import { sendSlackNotification } from '../services/slack';
import { config } from '../config';

let isProcessing = false;
let workerInterval: NodeJS.Timeout | null = null;

/**
 * MongoDB-Native Background Worker Engine.
 * Enables 100% standalone execution with ONLY MongoDB (zero external cloud Redis required).
 */
export const processDueEmailJobs = async (): Promise<void> => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const now = new Date();
    // Find scheduled emails whose dispatch time has arrived
    const dueJobs = await EmailJob.find({
      status: 'scheduled',
      scheduledAt: { $lte: now },
    })
      .sort({ scheduledAt: 1 })
      .limit(10);

    for (const emailDoc of dueJobs) {
      // Atomically acquire lock on document
      const lockedJob = await EmailJob.findOneAndUpdate(
        { _id: emailDoc._id, status: 'scheduled' },
        { status: 'processing' },
        { new: true }
      );

      if (!lockedJob) continue;

      const { senderEmail, recipientEmail, subject, bodyHtml, attachments, hourlyLimit, delayBetweenEmailsMs, userId } = lockedJob;
      console.log(`[MongoEngine] 🔄 Processing job ${lockedJob._id} for: ${recipientEmail}`);

      // 1. Check rate limit
      const rateLimitResult = await checkAndIncrementRateLimit(senderEmail, hourlyLimit || config.maxEmailsPerHour);

      if (!rateLimitResult.allowed) {
        console.warn(`[MongoEngine] ⚠️ Rate limit (${rateLimitResult.limit}/hr) reached for ${senderEmail}. Postponing.`);

        let slackWebhook = config.defaultSlackWebhookUrl;
        if (userId) {
          const userDoc = await User.findById(userId);
          if (userDoc?.slackWebhookUrl) {
            slackWebhook = userDoc.slackWebhookUrl;
          }
        }

        // Fire Slack Alert
        await sendSlackNotification(slackWebhook, 'Email Rate Limit Reached', {
          senderEmail,
          hourlyLimit: rateLimitResult.limit,
          currentCount: rateLimitResult.currentCount,
          nextAvailableWindow: rateLimitResult.nextAvailableWindow,
          jobId: lockedJob._id.toString(),
          recipientEmail,
          subject,
        });

        // Reschedule in MongoDB to next hour window
        lockedJob.status = 'scheduled';
        lockedJob.scheduledAt = rateLimitResult.nextAvailableWindow;
        await lockedJob.save();
        continue;
      }

      // 2. Deliver Email
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

        lockedJob.status = 'sent';
        lockedJob.sentAt = new Date();
        lockedJob.etherealPreviewUrl = result.previewUrl || '';
        await lockedJob.save();

        console.log(`[MongoEngine] ✅ Email sent to ${recipientEmail}`);

        if (delayBetweenEmailsMs > 0) {
          await new Promise((r) => setTimeout(r, Math.min(delayBetweenEmailsMs, 3000)));
        }
      } catch (err: any) {
        console.error(`[MongoEngine] ❌ Error sending to ${recipientEmail}:`, err.message);
        lockedJob.status = 'failed';
        lockedJob.errorReason = err.message || 'Transmission failed';
        await lockedJob.save();
      }
    }
  } catch (error) {
    console.error('[MongoEngine] Worker loop error:', error);
  } finally {
    isProcessing = false;
  }
};

/**
 * Starts the standalone MongoDB queue loop (every 2 seconds).
 */
export const setupMongoWorker = () => {
  if (workerInterval) clearInterval(workerInterval);
  workerInterval = setInterval(processDueEmailJobs, 2000);
  console.log('[MongoEngine] 🍃 Standalone MongoDB Queue Worker initialized.');
};
