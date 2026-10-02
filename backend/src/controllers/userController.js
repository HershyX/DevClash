import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/User.js';
import * as analytics from '../services/analyticsService.js';
import * as adaptive from '../services/adaptiveService.js';
import * as problemService from '../services/problemService.js';
import { mapUserToClient } from '../services/userMapper.js';
import { ApiError } from '../middleware/errorHandler.js';

/** GET /api/users/me/stats — everything a dashboard needs in one call. */
export const getMyStats = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  const [statistics, rankDuel, rankPractice, rankAdaptive, activeSession] = await Promise.all([
    analytics.getStudentStatistics(userId),
    analytics.getUserRank(userId, 'duel'),
    analytics.getUserRank(userId, 'problemSet'),
    analytics.getUserRank(userId, 'adaptive'),
    adaptive.findActiveSession(userId),
  ]);

  res.json({
    success: true,
    data: {
      user: mapUserToClient(req.user),
      statistics,
      ranks: { duel: rankDuel, problemSet: rankPractice, adaptive: rankAdaptive },
      activeAdaptiveSession: activeSession,
    },
  });
});

/** PATCH /api/users/me — profile updates. */
export const updateMe = asyncHandler(async (req, res) => {
  const allowed = {};
  if (req.body.name) allowed.name = String(req.body.name).trim().slice(0, 80);
  if (req.body.bio !== undefined) allowed.bio = String(req.body.bio).slice(0, 300);
  if (req.body.avatar !== undefined) allowed.avatar = String(req.body.avatar).slice(0, 500);

  if (Object.keys(allowed).length === 0) {
    throw new ApiError(422, 'No updatable fields provided (name, bio, avatar)');
  }

  const user = await User.findByIdAndUpdate(req.user._id, allowed, { new: true, runValidators: true });
  res.json({ success: true, data: { user: mapUserToClient(user) } });
});

/** GET /api/users/me/submissions?problemId=... — submission history. */
export const getMySubmissionHistory = asyncHandler(async (req, res) => {
  const data = await problemService.listSubmissionHistory({
    userId: req.user._id.toString(),
    problemId: req.query.problemId,
    limit: Math.min(Number(req.query.limit) || 20, 100),
  });
  res.json({ success: true, data });
});
