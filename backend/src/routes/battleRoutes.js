import { Router } from 'express';
import { list, get, createCustom, join, quickMatch, submit } from '../controllers/battleController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', list);
router.get('/:id', get);
router.post('/custom', requireRole('student', 'personal'), createCustom);
router.post('/join', requireRole('student', 'personal'), join);
router.post('/quick-match', requireRole('student', 'personal'), quickMatch);
router.post('/:id/submit', requireRole('student', 'personal'), submit);

export default router;
