import { Router } from 'express';
import { leaderboard, rank, activity, statistics, ratingHistory, weeklyProgress, skillBreakdown, teacher } from '../controllers/analyticsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/leaderboard', leaderboard);
router.get('/rank', rank);
router.get('/activity', activity);
router.get('/statistics', statistics);
router.get('/rating-history', ratingHistory);
router.get('/weekly-progress', weeklyProgress);
router.get('/skill-breakdown', skillBreakdown);
router.get('/teacher', requireRole('teacher'), teacher);

export default router;
