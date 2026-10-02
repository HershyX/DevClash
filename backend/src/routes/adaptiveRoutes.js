import { Router } from 'express';
import {
  next as getNextProblemHandler,
  startSession,
  completeSession,
  listSessions,
  getSession,
  submitAttempt,
  skillProfile,
  history,
} from '../controllers/adaptiveController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
// Order matters: specific paths before /session/:id
router.get('/next', requireRole('student', 'personal'), getNextProblemHandler);
router.get('/skill-profile', skillProfile);
router.get('/history', history);
router.get('/sessions', listSessions);
router.get('/sessions/:id', getSession);

router.post('/session', requireRole('student', 'personal'), startSession);
router.post('/session/:id/next', requireRole('student', 'personal'), (req, res, expressNext) => {
  req.query.sessionId = req.params.id;
  expressNext();
}, getNextProblemHandler);
router.post('/session/:id/submit', requireRole('student', 'personal'), submitAttempt);
router.post('/session/:id/complete', requireRole('student', 'personal'), completeSession);

// Legacy aliases (older frontend wiring)
router.post('/sessions', requireRole('student', 'personal'), startSession);
router.post('/sessions/:id/next-problem', requireRole('student', 'personal'), (req, res, expressNext) => {
  req.query.sessionId = req.params.id;
  expressNext();
}, getNextProblemHandler);
router.post('/sessions/:id/submit', requireRole('student', 'personal'), submitAttempt);
router.post('/sessions/:id/end', requireRole('student', 'personal'), completeSession);

export default router;
