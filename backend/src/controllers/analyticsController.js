import { asyncHandler } from '../utils/asyncHandler.js';
import * as analyticsService from '../services/analyticsService.js';

/** GET /api/analytics/leaderboard?ladder=duel|problemSet|adaptive */
export const leaderboard = asyncHandler(async (req, res) => {
  const entries = await analyticsService.getLeaderboard({
    ladder: req.query.ladder,
    limit: Math.min(Number(req.query.limit) || 50, 100),
    offset: Number(req.query.offset) || 0,
  });
  res.json({ success: true, data: entries });
});

/** GET /api/analytics/rank?ladder=duel */
export const rank = asyncHandler(async (req, res) => {
  const position = await analyticsService.getUserRank(req.user._id.toString(), req.query.ladder);
  res.json({ success: true, data: { rank: position } });
});

/** GET /api/analytics/activity?scope=me|global */
export const activity = asyncHandler(async (req, res) => {
  const data =
    req.query.scope === 'global'
      ? await analyticsService.getGlobalActivity(Number(req.query.limit) || 20)
      : await analyticsService.getActivityFeed(req.user._id.toString(), Number(req.query.limit) || 20);
  res.json({ success: true, data });
});

/** GET /api/analytics/statistics */
export const statistics = asyncHandler(async (req, res) => {
  const stats = await analyticsService.getStudentStatistics(req.user._id.toString());
  res.json({ success: true, data: stats });
});

/** GET /api/analytics/rating-history?ladder=duel&days=30 */
export const ratingHistory = asyncHandler(async (req, res) => {
  const history = await analyticsService.getRatingHistory(
    req.user._id.toString(),
    req.query.ladder,
    Math.min(Number(req.query.days) || 30, 90)
  );
  res.json({ success: true, data: history });
});

/** GET /api/analytics/weekly-progress */
export const weeklyProgress = asyncHandler(async (req, res) => {
  const progress = await analyticsService.getWeeklyProgress(req.user._id);
  res.json({ success: true, data: progress });
});

/** GET /api/analytics/skill-breakdown */
export const skillBreakdown = asyncHandler(async (req, res) => {
  const breakdown = await analyticsService.getSkillBreakdown(req.user._id.toString());
  res.json({ success: true, data: breakdown });
});

/** GET /api/analytics/teacher (teacher) */
export const teacher = asyncHandler(async (req, res) => {
  const data = await analyticsService.getTeacherAnalytics(req.user._id.toString());
  res.json({ success: true, data });
});
