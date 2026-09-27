export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  slackWebhookUrl?: string;
}

export interface EmailAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface EmailJob {
  _id: string;
  userId?: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  attachments?: EmailAttachment[];
  status: 'scheduled' | 'processing' | 'sent' | 'failed' | 'cancelled';
  scheduledAt: string;
  sentAt?: string;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
  bullJobId?: string;
  etherealPreviewUrl?: string;
  errorReason?: string;
  batchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
  total: number;
}

export interface DashboardStats {
  scheduledCount: number;
  sentCount: number;
  failedCount: number;
  queue: QueueMetrics;
}
