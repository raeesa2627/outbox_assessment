import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { EmailJob } from '../models/EmailJob';
import { addEmailToQueue, cancelJobFromQueue, getQueueMetrics } from '../queues/emailQueue';
import { config } from '../config';

/**
 * Schedule one or multiple emails (batch)
 */
export const scheduleEmails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      recipients, // array of strings or single string
      subject,
      bodyHtml,
      attachments = [],
      scheduledAt, // ISO string or timestamp
      delayBetweenEmailsMs = config.defaultDelayBetweenEmailsMs,
      hourlyLimit = config.maxEmailsPerHour,
      senderEmail,
    } = req.body;

    if (!recipients || (!Array.isArray(recipients) && typeof recipients !== 'string')) {
      res.status(400).json({ success: false, message: 'Valid recipient(s) are required' });
      return;
    }

    if (!subject || !bodyHtml) {
      res.status(400).json({ success: false, message: 'Subject and Body are required' });
      return;
    }

    const recipientList: string[] = Array.isArray(recipients)
      ? recipients.map((r: string) => r.trim()).filter(Boolean)
      : [recipients.trim()];

    if (recipientList.length === 0) {
      res.status(400).json({ success: false, message: 'No valid recipients provided' });
      return;
    }

    const effectiveSender = senderEmail || req.user?.email || 'oliver.brown@domain.io';
    const baseScheduleTime = scheduledAt ? new Date(scheduledAt).getTime() : Date.now();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const createdJobs = [];

    for (let i = 0; i < recipientList.length; i++) {
      const recipient = recipientList[i];
      // Stagger each recipient by the configured delay between emails
      const targetTimeMs = baseScheduleTime + (i * delayBetweenEmailsMs);
      const delayMs = Math.max(targetTimeMs - Date.now(), 0);

      // Create record in MongoDB
      const emailDoc = await EmailJob.create({
        userId: req.user?._id,
        senderEmail: effectiveSender,
        recipientEmail: recipient,
        subject,
        bodyHtml,
        attachments,
        status: 'scheduled',
        scheduledAt: new Date(targetTimeMs),
        delayBetweenEmailsMs,
        hourlyLimit,
        batchId,
      });

      // Add to BullMQ Queue
      const bullJobId = await addEmailToQueue(
        {
          dbJobId: emailDoc._id.toString(),
          userId: req.user?._id?.toString(),
          senderEmail: effectiveSender,
          recipientEmail: recipient,
          subject,
          bodyHtml,
          attachments,
          hourlyLimit,
          delayBetweenEmailsMs,
        },
        delayMs
      );

      // Save BullMQ job ID on DB document
      emailDoc.bullJobId = bullJobId;
      await emailDoc.save();

      createdJobs.push(emailDoc);
    }

    res.status(201).json({
      success: true,
      message: `Successfully scheduled ${createdJobs.length} email(s)`,
      batchId,
      scheduledCount: createdJobs.length,
      jobs: createdJobs,
    });
  } catch (error: any) {
    console.error('[Email Controller] Error scheduling emails:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to schedule emails' });
  }
};

/**
 * Get scheduled emails with optional search and pagination
 */
export const getScheduledEmails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search = '', page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const filter: any = {
      status: { $in: ['scheduled', 'processing'] },
    };

    if (search) {
      filter.$or = [
        { recipientEmail: { $regex: search as string, $options: 'i' } },
        { subject: { $regex: search as string, $options: 'i' } },
      ];
    }

    const total = await EmailJob.countDocuments(filter);
    const emails = await EmailJob.find(filter)
      .sort({ scheduledAt: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      emails,
    });
  } catch (error: any) {
    console.error('[Email Controller] Error fetching scheduled emails:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch scheduled emails' });
  }
};

/**
 * Get sent & failed emails with preview URLs and search
 */
export const getSentEmails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search = '', page = 1, limit = 50, status } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const filter: any = {};
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ['sent', 'failed'] };
    }

    if (search) {
      filter.$or = [
        { recipientEmail: { $regex: search as string, $options: 'i' } },
        { subject: { $regex: search as string, $options: 'i' } },
      ];
    }

    const total = await EmailJob.countDocuments(filter);
    const emails = await EmailJob.find(filter)
      .sort({ sentAt: -1, updatedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      emails,
    });
  } catch (error: any) {
    console.error('[Email Controller] Error fetching sent emails:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sent emails' });
  }
};

/**
 * Cancel a scheduled email
 */
export const cancelEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const email = await EmailJob.findById(id);

    if (!email) {
      res.status(404).json({ success: false, message: 'Email job not found' });
      return;
    }

    if (email.status !== 'scheduled') {
      res.status(400).json({
        success: false,
        message: `Cannot cancel an email that is already ${email.status}`,
      });
      return;
    }

    // Cancel in BullMQ
    if (email.bullJobId) {
      await cancelJobFromQueue(email.bullJobId);
    }

    email.status = 'cancelled';
    await emailDocSaveWithRetry(email);

    res.json({ success: true, message: 'Email job cancelled successfully', email });
  } catch (error: any) {
    console.error('[Email Controller] Error cancelling email:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel email' });
  }
};

const emailDocSaveWithRetry = async (doc: any) => {
  return await doc.save();
};

/**
 * Get dashboard stats (scheduled count, sent count, failed count, queue metrics)
 */
export const getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [scheduledCount, sentCount, failedCount, queueMetrics] = await Promise.all([
      EmailJob.countDocuments({ status: { $in: ['scheduled', 'processing'] } }),
      EmailJob.countDocuments({ status: 'sent' }),
      EmailJob.countDocuments({ status: 'failed' }),
      getQueueMetrics(),
    ]);

    res.json({
      success: true,
      stats: {
        scheduledCount,
        sentCount,
        failedCount,
        queue: queueMetrics,
      },
    });
  } catch (error: any) {
    console.error('[Email Controller] Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};
