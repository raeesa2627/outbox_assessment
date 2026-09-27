import nodemailer from 'nodemailer';
import { config } from '../config';

let transporter: nodemailer.Transporter | null = null;
let testAccount: nodemailer.TestAccount | null = null;

/**
 * Initializes and returns a singleton Nodemailer transporter.
 * If custom SMTP credentials are provided in config, it uses them.
 * Otherwise, it initializes an Ethereal SMTP test account automatically.
 */
export const getMailTransporter = async (): Promise<nodemailer.Transporter> => {
  if (transporter) {
    return transporter;
  }

  if (config.smtp.host && config.smtp.user && config.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
    console.log(`[Mailer] Initialized custom SMTP transport: ${config.smtp.host}`);
    return transporter;
  }

  // Automatic Ethereal Test Account
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

    console.log(`[Mailer] Ethereal SMTP initialized. User: ${testAccount.user}`);
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
 * Sends an email using the active Nodemailer transporter and extracts the Ethereal preview URL.
 */
export const sendEmail = async (payload: SendEmailPayload): Promise<SendEmailResult> => {
  const mailer = await getMailTransporter();

  const info = await mailer.sendMail({
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    attachments: payload.attachments,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || '';
  console.log(`[Mailer] Email sent to: ${payload.to} | Message ID: ${info.messageId}`);
  if (previewUrl) {
    console.log(`[Mailer] Ethereal Preview URL: ${previewUrl}`);
  }

  return {
    messageId: info.messageId,
    previewUrl: previewUrl ? previewUrl.toString() : '',
  };
};
