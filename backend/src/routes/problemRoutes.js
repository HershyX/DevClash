import { Router } from 'express';
import { list, get, statistics, create, update, remove, run, submit } from '../controllers/problemController.js';
import { getMySubmissionHistory } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { problemRules } from '../middleware/validate.js';
import { validationRun } from '../utils/validateRun.js';
import { listTopics } from '../services/problemService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Topic catalog (any visitor)
router.get('/topics/list', asyncHandler(async (_req, res) => {
  const topics = await listTopics();
  res.json({ success: true, data: topics });
}));

// Public problem catalog (also serves logged-out users)
router.get('/', list);
router.get('/:id', get);
router.get('/:id/statistics', statistics);
router.get('/:id/submissions', requireAuth, getMySubmissionHistory);

// Solving (auth required)
router.post('/:id/run', requireAuth, run);
router.post('/:id/submit', requireAuth, submit);

// Authoring (teachers only)
router.post('/', requireAuth, requireRole('teacher'), validationRun(problemRules), create);
router.put('/:id', requireAuth, requireRole('teacher'), update);
router.delete('/:id', requireAuth, requireRole('teacher'), remove);

export default router;
