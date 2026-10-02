import { Router } from 'express';
import { getMyStats, updateMe, getMySubmissionHistory } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/me/stats', requireAuth, getMyStats);
router.get('/me/submissions', requireAuth, getMySubmissionHistory);
router.patch('/me', requireAuth, updateMe);

export default router;
