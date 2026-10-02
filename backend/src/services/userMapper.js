import { getXPToNextLevel } from '../utils/ladder.js';

/**
 * Maps a User document into the camelCase user object the React frontend
 * already consumes (duelRating/practiceRating/adaptiveRating + statistics).
 * `practiceRating` is a live alias of `problemSetRating` — the two names refer
 * to the same ladder and no overall rating is ever computed.
 */
export function mapUserToClient(user) {
  const u = typeof user.toJSON === 'function' ? user.toJSON() : user;

  function ladder(l) {
    const src = u[l] ?? {};
    const xp = src.xp ?? 0;
    return {
      rating: src.rating ?? 1200,
      level: src.level ?? 1,
      xp,
      xpToNextLevel: getXPToNextLevel(xp),
      weeklyXpGain: src.weeklyXpGain ?? 0,
      trend: src.trend ?? 'stable',
    };
  }

  const base = {
    id: u.id ?? u._id?.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar ?? undefined,
    bio: u.bio ?? '',
    createdAt: u.createdAt,
  };

  if (u.role === 'teacher') {
    return { ...base, role: 'teacher' };
  }

  return {
    ...base,
    duelRating: ladder('duelRating'),
    practiceRating: ladder('problemSetRating'),
    adaptiveRating: ladder('adaptiveRating'),
    statistics: {
      totalBattles: u.statistics?.totalBattles ?? 0,
      battlesWon: u.statistics?.battlesWon ?? 0,
      battlesLost: u.statistics?.battlesLost ?? 0,
      winRate: u.statistics?.winRate ?? 0,
      problemsSolved: u.statistics?.problemsSolved ?? 0,
      problemsAttempted: u.statistics?.problemsAttempted ?? 0,
      adaptiveSessions: u.statistics?.adaptiveSessions ?? 0,
      totalXp: u.statistics?.totalXp ?? 0,
      currentStreak: u.statistics?.currentStreak ?? 0,
      maxStreak: u.statistics?.maxStreak ?? 0,
      averageRating: u.statistics?.averageRating ?? 0,
    },
  };
}
