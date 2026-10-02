import { Router } from 'express';
import { list, unreadCount, markRead } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', list);
router.get('/unread-count', unreadCount);
router.post('/mark-read', markRead);

export default router;
