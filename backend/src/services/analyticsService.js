import User from '../models/User.js';
import Submission from '../models/Submission.js';
import BattleParticipant from '../models/BattleParticipant.js';
import AdaptiveSession from '../models/AdaptiveSession.js';
import ClassroomMembership from '../models/ClassroomMembership.js';
import { getRecentActivity } from './activityService.js';

const LADDER_FIELD = { duel: 'duelRating', problemSet: 'problemSetRating', adaptive: 'adaptiveRating' };

export async function getLeaderboard({ ladder = 'duel', limit = 50, offset = 0 } = {}) {
  const field = LADDER_FIELD[ladder] ?? LADDER_FIELD.duel;
  const users = await User.find({ role: { $in: ['student', 'personal'] } })
    .sort({ [`${field}.rating`]: -1 })
    .skip(offset)
    .limit(limit)
    .lean();

  return users.map((u, i) => ({
    rank: offset + i + 1,
    userId: u._id.toString(),
    name: u.name,
    avatar: u.avatar ?? undefined,
    rating: u[field]?.rating ?? 1200,
    level: u[field]?.level ?? 1,
    xp: u[field]?.xp ?? 0,
    winRate: u.statistics?.winRate ?? 0,
    problemsSolved: u.statistics?.problemsSolved ?? 0,
  }));
}

export async function getUserRank(userId, ladder = 'duel') {
  const field = LADDER_FIELD[ladder] ?? LADDER_FIELD.duel;
  const user = await User.findById(userId).lean();
  if (!user) return 0;
  const rating = user[field]?.rating ?? 1200;
  // sanitizeFilter wraps plain objects, so build the operator query explicitly.
  const higher = await User.countDocuments({
    role: { $in: ['student', 'personal'] },
    [`${field}.rating`]: { $gt: rating },
  });
  return higher + 1;
}

/** Map a raw ActivityEvent lean doc to the shape the frontend expects. */
function toClientEvent(e) {
  return {
    id: e._id.toString(),
    userId: e.user?.toString?.() ?? String(e.user),
    userName: e.userName ?? '',
    type: e.type,
    description: e.description,
    metadata: e.metadata ?? {},
    timestamp: e.createdAt?.toISOString?.() ?? new Date(e.createdAt).toISOString(),
  };
}

export async function getActivityFeed(userId, limit = 20) {
  const events = await getRecentActivity({ userId, limit });
  return events.map(toClientEvent);
}

export async function getGlobalActivity(limit = 20) {
  const events = await getRecentActivity({ limit });
  return events.map(toClientEvent);
}

export async function getStudentStatistics(userId) {
  const user = await User.findById(userId).lean();
  if (!user) return null;
  const totalBattles = user.statistics?.totalBattles ?? 0;
  const battlesWon = user.statistics?.battlesWon ?? 0;
  return {
    totalBattles,
    battlesWon,
    battlesLost: user.statistics?.battlesLost ?? 0,
    winRate: totalBattles ? Math.round((battlesWon / totalBattles) * 100) : 0,
    problemsSolved: user.statistics?.problemsSolved ?? 0,
    problemsAttempted: user.statistics?.problemsAttempted ?? 0,
    adaptiveSessions: user.statistics?.adaptiveSessions ?? 0,
    totalXp: user.statistics?.totalXp ?? 0,
    currentStreak: user.statistics?.currentStreak ?? 0,
    maxStreak: user.statistics?.maxStreak ?? 0,
    averageRating: Math.round(
      ((user.duelRating?.rating ?? 1200) + (user.problemSetRating?.rating ?? 1200) + (user.adaptiveRating?.rating ?? 1200)) / 3
    ),
  };
}

export async function getRatingHistory(userId, ladder = 'duel', days = 30) {
  const Rating = (await import('../models/Rating.js')).default;
  const entries = await Rating.find({ user: userId, ladder })
    .sort({ createdAt: -1 })
    .limit(days)
    .lean();

  // Fill forward from current rating for days without ledger entries.
  const user = await User.findById(userId).lean();
  const field = LADDER_FIELD[ladder] ?? LADDER_FIELD.duel;
  const currentRating = user?.[field]?.rating ?? 1200;

  const history = [];
  let rating = currentRating;
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const entry = entries.find((e) => e.createdAt.toISOString().split('T')[0] === date);
    if (entry) {
      rating = entry.ratingBefore;
      history.unshift({ date, rating: entry.ratingAfter });
    } else {
      history.unshift({ date, rating });
    }
  }
  return history;
}

export async function getWeeklyProgress(userId) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [battleAgg, problemAgg, adaptiveAgg, user] = await Promise.all([
    BattleParticipant.aggregate([
      { $match: { user: userId, createdAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: null,
          xp: { $sum: '$xpEarned' },
          battles: { $sum: 1 },
          wins: { $sum: { $cond: ['$isWinner', 1, 0] } },
        },
      },
    ]),
    Submission.aggregate([
      { $match: { user: userId, createdAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: null,
          xp: { $sum: '$xpEarned' },
          problems: { $sum: 1 },
          solved: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
        },
      },
    ]),
    AdaptiveSession.aggregate([
      { $match: { user: userId, createdAt: { $gte: weekAgo } } },
      { $group: { _id: null, sessions: { $sum: 1 } } },
    ]),
    User.findById(userId).lean(),
  ]);

  return {
    duel: {
      xp: battleAgg[0]?.xp ?? 0,
      battles: battleAgg[0]?.battles ?? 0,
      wins: battleAgg[0]?.wins ?? 0,
    },
    practice: {
      xp: problemAgg[0]?.xp ?? 0,
      problems: problemAgg[0]?.problems ?? 0,
      solved: problemAgg[0]?.solved ?? 0,
    },
    adaptive: {
      xp: 0,
      sessions: adaptiveAgg[0]?.sessions ?? 0,
      completed: adaptiveAgg[0]?.sessions ?? 0,
    },
  };
}

export async function getSkillBreakdown(userId) {
  const agg = await Submission.aggregate([
    { $match: { user: userId, status: 'accepted' } },
    { $lookup: { from: 'problems', localField: 'problem', foreignField: '_id', as: 'problemDoc' } },
    { $unwind: '$problemDoc' },
    { $unwind: '$problemDoc.tags' },
    { $group: { _id: '$problemDoc.tags', solved: { $sum: 1 } } },
    { $sort: { solved: -1 } },
  ]);

  const maxSolved = Math.max(1, ...agg.map((a) => a.solved));
  const result = {};
  for (const a of agg) {
    result[a._id] = Math.round((a.solved / maxSolved) * 100);
  }
  return result;
}

export async function getTeacherAnalytics(teacherId) {
  const classroomIds = await teacherClassroomIds(teacherId);
  const memberships = await ClassroomMembership.find({ classroom: { $in: classroomIds }, role: 'student', status: 'active' })
    .populate('user')
    .lean();

  const students = memberships.map((m) => m.user).filter(Boolean);
  const count = students.length;

  const avg = (field) =>
    count ? Math.round(students.reduce((sum, s) => sum + (s[field]?.rating ?? 1200), 0) / count) : 0;

  const topStudents = students
    .map((s) => ({
      userId: s._id.toString(),
      name: s.name,
      rating: s.duelRating?.rating ?? 1200,
      level: s.duelRating?.level ?? 1,
      xp: s.duelRating?.xp ?? 0,
      winRate: s.statistics?.winRate ?? 0,
      problemsSolved: s.statistics?.problemsSolved ?? 0,
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)
    .map((s, i) => ({ rank: i + 1, ...s }));

  const activity = await getRecentActivity({ limit: 20 });

  return {
    totalClassrooms: classroomIds.length,
    totalStudents: count,
    activeStudents: students.filter((s) => (s.statistics?.currentStreak ?? 0) > 0).length,
    averageDuelRating: avg('duelRating'),
    averagePracticeRating: avg('problemSetRating'),
    averageAdaptiveRating: avg('adaptiveRating'),
    topStudents,
    recentActivity: activity.map(toClientEvent),
  };
}

async function teacherClassroomIds(teacherId) {
  const Classroom = (await import('../models/Classroom.js')).default;
  return (await Classroom.find({ teacher: teacherId }).select('_id').lean()).map((c) => c._id);
}

export async function getClassroomAnalytics(classroomId) {
  const memberships = await ClassroomMembership.find({ classroom: classroomId, role: 'student', status: 'active' })
    .populate('user')
    .lean();

  const students = memberships.map((m) => m.user).filter(Boolean);
  const count = students.length;
  const avg = (field) => (count ? Math.round(students.reduce((s, u) => s + (u[field]?.rating ?? 1200), 0) / count) : 0);

  return {
    totalStudents: count,
    activeStudents: students.filter((s) => (s.statistics?.currentStreak ?? 0) > 0).length,
    averageDuelRating: avg('duelRating'),
    averagePracticeRating: avg('problemSetRating'),
    averageAdaptiveRating: avg('adaptiveRating'),
    activity: (await getRecentActivity({ limit: 20 })).map(toClientEvent),
  };
}
