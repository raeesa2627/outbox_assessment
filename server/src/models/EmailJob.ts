import mongoose, { Document, Schema, Types } from 'mongoose';

export type EmailJobStatus = 'scheduled' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface IEmailAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface IEmailJob extends Document {
  userId?: Types.ObjectId;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  attachments: IEmailAttachment[];
  status: EmailJobStatus;
  scheduledAt: Date;
  sentAt?: Date;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
  bullJobId?: string;
  etherealPreviewUrl?: string;
  errorReason?: string;
  batchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailJobSchema = new Schema<IEmailJob>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    senderEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    bodyHtml: {
      type: String,
      required: true,
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number },
        type: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ['scheduled', 'processing', 'sent', 'failed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    sentAt: {
      type: Date,
      index: true,
    },
    delayBetweenEmailsMs: {
      type: Number,
      default: 2000,
    },
    hourlyLimit: {
      type: Number,
      default: 10,
    },
    bullJobId: {
      type: String,
      index: true,
    },
    etherealPreviewUrl: {
      type: String,
      default: '',
    },
    errorReason: {
      type: String,
    },
    batchId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for fast search by recipient and subject
EmailJobSchema.index({ recipientEmail: 'text', subject: 'text' });

export const EmailJob = mongoose.model<IEmailJob>('EmailJob', EmailJobSchema);
