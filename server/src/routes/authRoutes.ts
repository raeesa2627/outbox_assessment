import { Router } from 'express';
import { googleLogin, demoLogin, getCurrentUser } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/google', googleLogin);
router.post('/demo-login', demoLogin);
router.get('/me', authenticate, getCurrentUser);

export default router;
