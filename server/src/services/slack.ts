import { config } from '../config';

export interface SlackRateLimitAlertData {
  senderEmail: string;
  hourlyLimit: number;
  currentCount: number;
  nextAvailableWindow: Date;
  jobId?: string;
  recipientEmail?: string;
  subject?: string;
}

/**
 * Sends a rich, structured Slack message to the configured Slack Webhook URL.
 */
export const sendSlackNotification = async (
  webhookUrl: string | undefined,
  title: string,
  alertData: SlackRateLimitAlertData
): Promise<boolean> => {
  const targetWebhook = webhookUrl || config.defaultSlackWebhookUrl;

  if (!targetWebhook) {
    console.warn('[Slack] No webhook URL configured. Skipping Slack notification.');
    return false;
  }

  const payload = {
    text: `⚠️ *${title}* for \`${alertData.senderEmail}\``,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 ReachInbox Email Rate Limit Alert',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Sender:*\n${alertData.senderEmail}`,
          },
          {
            type: 'mrkdwn',
            text: `*Hourly Limit:*\n${alertData.hourlyLimit} emails/hour`,
          },
          {
            type: 'mrkdwn',
            text: `*Current Counter:*\n${alertData.currentCount} sent`,
          },
          {
            type: 'mrkdwn',
            text: `*Next Available Window:*\n${alertData.nextAvailableWindow.toLocaleTimeString()} (${alertData.nextAvailableWindow.toLocaleDateString()})`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*Action taken:* Remaining emails have been delayed to the next window. No jobs were dropped. | Target Recipient: \`${alertData.recipientEmail || 'N/A'}\``,
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch(targetWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Slack] Webhook failed (${res.status}): ${errText}`);
      return false;
    }

    console.log(`[Slack] Successfully delivered rate limit alert for ${alertData.senderEmail}`);
    return true;
  } catch (error) {
    console.error('[Slack] Error sending webhook notification:', error);
    return false;
  }
};
