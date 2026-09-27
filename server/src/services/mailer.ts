import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { config } from '../config';

let resendClient: Resend | null = null;
let transporter: nodemailer.Transporter | null = null;
let testAccount: nodemailer.TestAccount | null = null;

/**
 * Initializes and returns a singleton Nodemailer transporter for fallback / sandbox testing.
 */
export const getMailTransporter = async (): Promise<nodemailer.Transporter> => {
  if (transporter) {
    return transporter;
  }

  if (config.smtp.user && config.smtp.pass) {
    if (config.smtp.host) {
      transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port || 587,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
      console.log(`[Mailer] ✅ Real SMTP transport initialized with host: ${config.smtp.host}`);
    } else {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
      console.log(`[Mailer] ✅ Real Gmail SMTP transport initialized for: ${config.smtp.user}`);
    }
    return transporter;
  }

  // Automatic Ethereal Test Account (Sandbox mode for automated testing)
  try {
    testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log(`[Mailer] 🧪 Ethereal Test SMTP sandbox initialized. Account: ${testAccount.user}`);
    return transporter;
  } catch (error) {
    console.error('[Mailer] Failed to create Ethereal test account:', error);
    throw error;
  }
};

export interface SendEmailPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string;
}

/**
 * Sends an email using:
 * 1. Resend API (HTTP port 443 — 100% Render and Cloud deployment compatible) if RESEND_API_KEY is configured.
 * 2. Real SMTP / Gmail if SMTP credentials provided.
 * 3. Ethereal Test sandbox as automated testing fallback.
 */
export const sendEmail = async (payload: SendEmailPayload): Promise<SendEmailResult> => {
  // Option 1: Resend Mail API (Primary for Production & Render)
  if (config.resendApiKey) {
    try {
      if (!resendClient) {
        resendClient = new Resend(config.resendApiKey);
      }

      const fromAddress = config.resendFromEmail || 'onboarding@resend.dev';
      const resendAttachments = payload.attachments?.map((att) => ({
        filename: att.filename,
        path: att.path,
      }));

      const { data, error } = await resendClient.emails.send({
        from: fromAddress,
        replyTo: payload.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        attachments: resendAttachments,
      });

      if (error) {
        console.error('[Mailer] Resend API Error:', error);
        throw new Error(`Resend Delivery Failed: ${error.message}`);
      }

      const messageId = data?.id || `resend_${Date.now()}`;
      console.log(`[Mailer] 🚀 Resend delivered email to: ${payload.to} | Message ID: ${messageId}`);

      return {
        messageId,
        previewUrl: '', // Delivered directly to recipient inbox
      };
    } catch (err: any) {
      console.error('[Mailer] Resend error, trying fallback:', err.message);
      // If Resend fails (e.g. unverified test recipient on free tier), fall back to Nodemailer
    }
  }

  // Option 2 & 3: Nodemailer (Custom SMTP or Ethereal Sandbox fallback)
  const mailer = await getMailTransporter();
  const isRealSMTP = Boolean(config.smtp.user && config.smtp.pass);

  const mailOptions: nodemailer.SendMailOptions = {
    from: isRealSMTP ? `"${payload.from.split('@')[0]}" <${config.smtp.user}>` : payload.from,
    replyTo: payload.from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    attachments: payload.attachments,
  };

  const info = await mailer.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info) || '';

  if (isRealSMTP) {
    console.log(`[Mailer] 📬 SMTP DELIVERED to: ${payload.to} | Message ID: ${info.messageId}`);
  } else {
    console.log(`[Mailer] 🧪 Ethereal Sandbox email sent to: ${payload.to} | Preview: ${previewUrl}`);
  }

  return {
    messageId: info.messageId,
    previewUrl: previewUrl ? previewUrl.toString() : '',
  };
};


