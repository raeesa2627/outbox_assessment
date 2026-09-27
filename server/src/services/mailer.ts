import nodemailer from 'nodemailer';
import { config } from '../config';

let transporter: nodemailer.Transporter | null = null;
let testAccount: nodemailer.TestAccount | null = null;

/**
 * Initializes and returns a singleton Nodemailer transporter.
 * If custom SMTP credentials are provided in config, it uses them (delivers to real inboxes).
 * Otherwise, it initializes an Ethereal SMTP test account automatically.
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
      // Default to Gmail service if user and app password provided
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
 * Sends an email using the active Nodemailer transporter.
 * If real SMTP is configured, sends to real inbox.
 * If Ethereal test account is used, extracts and stores the Ethereal web preview URL.
 */
export const sendEmail = async (payload: SendEmailPayload): Promise<SendEmailResult> => {
  const mailer = await getMailTransporter();
  const isRealSMTP = Boolean(config.smtp.user && config.smtp.pass);

  // For real SMTP, use authenticated user as from address or envelope
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
    console.log(`[Mailer] 📬 REAL EMAIL DELIVERED to: ${payload.to} | Message ID: ${info.messageId}`);
  } else {
    console.log(`[Mailer] 🧪 Ethereal Sandbox email sent to: ${payload.to} | Preview: ${previewUrl}`);
  }

  return {
    messageId: info.messageId,
    previewUrl: previewUrl ? previewUrl.toString() : '',
  };
};

