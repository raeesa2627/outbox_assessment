import { Router } from 'express';
import authRoutes from './authRoutes';
import emailRoutes from './emailRoutes';
import uploadRoutes from './uploadRoutes';
import settingsRoutes from './settingsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/emails', emailRoutes);
router.use('/upload', uploadRoutes);
router.use('/settings', settingsRoutes);

export default router;
