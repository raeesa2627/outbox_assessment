import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { sendSlackNotification } from '../services/slack';
import { config } from '../config';

/**
 * Update user settings (e.g. Slack Webhook URL)
 */
export const updateSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { slackWebhookUrl } = req.body;
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (slackWebhookUrl !== undefined) {
      user.slackWebhookUrl = slackWebhookUrl.trim();
    }

    await user.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        slackWebhookUrl: user.slackWebhookUrl,
      },
    });
  } catch (error: any) {
    console.error('[Settings] Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

/**
 * Trigger a test Slack alert to verify webhook integration
 */
export const testSlackAlert = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const webhookUrl = req.body.slackWebhookUrl || req.user?.slackWebhookUrl || config.defaultSlackWebhookUrl;

    if (!webhookUrl) {
      res.status(400).json({
        success: false,
        message: 'No Slack Webhook URL provided. Please provide a webhook URL to test.',
      });
      return;
    }

    const delivered = await sendSlackNotification(webhookUrl, 'Test Rate Limit Alert', {
      senderEmail: req.user?.email || 'oliver.brown@domain.io',
      hourlyLimit: config.maxEmailsPerHour,
      currentCount: config.maxEmailsPerHour,
      nextAvailableWindow: new Date(Date.now() + 60 * 60 * 1000),
      jobId: 'test_job_12345',
      recipientEmail: 'recruiter@outbox.com',
      subject: 'Interview Assignment Verification Test',
    });

    if (delivered) {
      res.json({ success: true, message: 'Test alert delivered to Slack successfully!' });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to deliver message to Slack. Check that your Webhook URL is valid and active.',
      });
    }
  } catch (error: any) {
    console.error('[Settings] Test Slack error:', error);
    res.status(500).json({ success: false, message: 'Error sending test Slack alert' });
  }
};
