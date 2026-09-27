import { Router } from 'express';
import {
  scheduleEmails,
  getScheduledEmails,
  getSentEmails,
  cancelEmail,
  getStats,
} from '../controllers/emailController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All email routes use authentication (with demo fallback)
router.use(authenticate);

router.post('/schedule', scheduleEmails);
router.get('/scheduled', getScheduledEmails);
router.get('/sent', getSentEmails);
router.get('/stats', getStats);
router.delete('/:id', cancelEmail);

export default router;
