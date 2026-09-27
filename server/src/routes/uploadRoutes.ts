import { Router } from 'express';
import { upload, uploadAttachment, parseLeadFile } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Endpoint to upload attachments (images or files)
router.post('/attachment', upload.single('file'), uploadAttachment);

// Endpoint to parse bulk leads CSV or TXT
router.post('/leads', upload.single('file'), parseLeadFile);

export default router;
