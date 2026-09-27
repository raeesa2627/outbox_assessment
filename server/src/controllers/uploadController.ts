import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

// Configure Cloudinary if credentials exist
if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
  console.log('[Cloudinary] Cloudinary configured with cloud name:', config.cloudinary.cloudName);
}

// Local uploads directory fallback
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

/**
 * Upload image / attachment (Cloudinary or local fallback)
 */
export const uploadAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const isImage = req.file.mimetype.startsWith('image/');

    // If Cloudinary is configured, upload there
    if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
      try {
        const uploadResult = await cloudinary.uploader.upload(filePath, {
          folder: 'outbox_scheduler',
          resource_type: isImage ? 'image' : 'auto',
        });

        // Clean up local temp file after upload
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        res.json({
          success: true,
          url: uploadResult.secure_url,
          name: originalName,
          size: req.file.size,
          type: req.file.mimetype,
        });
        return;
      } catch (cloudErr) {
        console.warn('[Upload] Cloudinary upload failed, falling back to local storage:', cloudErr);
      }
    }

    // Local fallback URL
    const relativeUrl = `/uploads/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${relativeUrl}`;

    res.json({
      success: true,
      url: fullUrl,
      name: originalName,
      size: req.file.size,
      type: req.file.mimetype,
    });
  } catch (error: any) {
    console.error('[Upload] Error uploading attachment:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

/**
 * Parse CSV or text file containing lead email addresses
 */
export const parseLeadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No lead file provided' });
      return;
    }

    const content = fs.readFileSync(req.file.path, 'utf8');
    // Regex for finding valid email addresses in text or CSV
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = content.match(emailRegex) || [];

    // Deduplicate and trim emails
    const uniqueEmails = Array.from(new Set(matches.map((e) => e.toLowerCase().trim())));

    // Clean up local file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      success: true,
      totalLeads: uniqueEmails.length,
      emails: uniqueEmails,
    });
  } catch (error: any) {
    console.error('[Upload] Error parsing lead file:', error);
    res.status(500).json({ success: false, message: 'Failed to parse file' });
  }
};
