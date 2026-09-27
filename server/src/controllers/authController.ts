import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config';
import { AuthenticatedRequest } from '../middleware/auth';

const googleClient = new OAuth2Client(config.googleClientId);

const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: '7d' });
};

/**
 * Google OAuth login / verification
 */
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({ success: false, message: 'Google credential token is required' });
      return;
    }

    let email = '';
    let name = '';
    let avatar = '';
    let googleId = '';

    if (config.googleClientId) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: config.googleClientId,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        res.status(400).json({ success: false, message: 'Invalid Google token payload' });
        return;
      }
      email = payload.email;
      name = payload.name || payload.email.split('@')[0];
      avatar = payload.picture || '';
      googleId = payload.sub;
    } else {
      // In case Google Client ID is not yet provided in .env, decode the JWT safely
      const decoded: any = jwt.decode(credential);
      if (!decoded || !decoded.email) {
        res.status(400).json({ success: false, message: 'Could not decode Google token' });
        return;
      }
      email = decoded.email;
      name = decoded.name || decoded.email.split('@')[0];
      avatar = decoded.picture || '';
      googleId = decoded.sub || '';
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00A859&color=fff&bold=true`,
        slackWebhookUrl: config.defaultSlackWebhookUrl,
      });
    } else {
      if (name) user.name = name;
      if (avatar) user.avatar = avatar;
      if (googleId && !user.googleId) user.googleId = googleId;
      await user.save();
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        slackWebhookUrl: user.slackWebhookUrl,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Google login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Google authentication failed' });
  }
};

/**
 * 1-Click Demo / Email Login (matches Figma "Login" and "Oliver Brown" profile)
 */
export const demoLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email = 'oliver.brown@domain.io', name } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // Derive proper display name
    let effectiveName = name;
    if (!effectiveName || (effectiveName === 'Oliver Brown' && cleanEmail !== 'oliver.brown@domain.io')) {
      const prefix = cleanEmail.split('@')[0] || 'User';
      effectiveName = prefix
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase())
        .trim();
    }

    const isDefaultOliver = cleanEmail === 'oliver.brown@domain.io';
    const defaultAvatar = isDefaultOliver
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(effectiveName)}&background=00A859&color=fff&bold=true`;

    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      user = await User.create({
        email: cleanEmail,
        name: effectiveName,
        avatar: defaultAvatar,
        slackWebhookUrl: config.defaultSlackWebhookUrl,
      });
    } else {
      // Update existing record if email is custom
      if (effectiveName && (!isDefaultOliver || user.name === 'Oliver Brown')) {
        user.name = effectiveName;
      }
      if (!isDefaultOliver && (user.avatar?.includes('unsplash') || !user.avatar)) {
        user.avatar = defaultAvatar;
      }
      await user.save();
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        slackWebhookUrl: user.slackWebhookUrl,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Demo login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

/**
 * Get current authenticated user details
 */
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
      slackWebhookUrl: req.user.slackWebhookUrl,
    },
  });
};
