import { Router } from 'express';
import { updateSettings, testSlackAlert } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', updateSettings);
router.post('/test-slack', testSlackAlert);

export default router;
