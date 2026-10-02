import { asyncHandler } from '../utils/asyncHandler.js';
import * as adaptiveService from '../services/adaptiveService.js';
import * as adaptiveEngine from '../services/adaptiveEngine.js';

/** GET /api/adaptive/next?sessionId=...&topics=A,B — recommend the next problem. */
export const next = asyncHandler(async (req, res) => {
  const focusTopics = req.query.topics ? String(req.query.topics).split(',').map((t) => t.trim()).filter(Boolean) : [];
  const sessionId = req.query.sessionId || req.query.session_id;

  if (sessionId) {
    const result = await adaptiveService.getNextProblem(sessionId, req.user, { focusTopics });
    return res.json({ success: true, data: result });
  }

  // No session id: auto-start/resume an active session, then recommend.
  const session = await adaptiveService.startSession(req.user, { focusTopics });
  const result = await adaptiveService.getNextProblem(session.id, req.user, { focusTopics });
  res.json({ success: true, data: result });
});

/** POST /api/adaptive/session — start (or resume) a session. */
export const startSession = asyncHandler(async (req, res) => {
  const focusTopics = Array.isArray(req.body?.focusTopics) ? req.body.focusTopics : [];
  const session = await adaptiveService.startSession(req.user, { focusTopics });
  res.status(201).json({ success: true, message: 'Session started', data: session });
});

/** POST /api/adaptive/session/:id/complete — end the session. */
export const completeSession = asyncHandler(async (req, res) => {
  const session = await adaptiveService.completeSession(req.params.id, req.user);
  res.json({ success: true, message: 'Session completed', data: session });
});

/** GET /api/adaptive/sessions — session list/history. */
export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await adaptiveService.listSessions(req.user._id.toString());
  res.json({ success: true, data: sessions });
});

/** GET /api/adaptive/sessions/:id */
export const getSession = asyncHandler(async (req, res) => {
  const session = await adaptiveService.getSession(req.params.id, req.user._id.toString());
  res.json({ success: true, data: session });
});

/** POST /api/adaptive/session/:id/submit — attempt the current problem. */
export const submitAttempt = asyncHandler(async (req, res) => {
  const result = await adaptiveService.submitAttempt({
    sessionId: req.params.id,
    code: req.body.code,
    language: req.body.language ?? 'javascript',
    timeSpent: Number(req.body.timeSpent) || 0,
    user: req.user,
  });
  res.json({ success: true, data: result });
});

/** GET /api/adaptive/skill-profile — full skill analytics. */
export const skillProfile = asyncHandler(async (req, res) => {
  const analytics = await adaptiveEngine.getSkillAnalytics(req.user);
  res.json({ success: true, data: analytics });
});

/** GET /api/adaptive/history — completed session summaries. */
export const history = asyncHandler(async (req, res) => {
  const data = await adaptiveService.getSessionHistory(req.user._id.toString(), Number(req.query.limit) || 10);
  res.json({ success: true, data });
});
