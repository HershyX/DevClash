/**
 * XP / level math for the three independent ladders.
 * Level curve: level n requires (n-1)^2 * 100 XP total, matching the
 * frontend's getLevelFromXP / getXPForLevel helpers exactly.
 */

export function getLevelFromXP(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function getXPForLevel(level) {
  return Math.pow(level - 1, 2) * 100;
}

export function getXPToNextLevel(xp) {
  const currentLevel = getLevelFromXP(xp);
  return getXPForLevel(currentLevel + 1) - xp;
}

export const LADDERS = ['duel', 'problemSet', 'adaptive'];

/** Map a ladder name to its User document field. */
export const LADDER_FIELD = {
  duel: 'duelRating',
  problemSet: 'problemSetRating',
  adaptive: 'adaptiveRating',
};

export const XP_PER_XP_SOURCE = {
  battleWin: 120,
  battleLoss: 25,
  problemSolved: (difficulty) => ({ easy: 50, medium: 120, hard: 200 })[difficulty] ?? 50,
  adaptiveSolved: (difficulty) => ({ easy: 40, medium: 100, hard: 160 })[difficulty] ?? 40,
};

export const RATING_K = {
  duel: { win: 38, loss: 18 },
  problemSet: { win: 20, loss: 8 },
  adaptive: { win: 22, loss: 9 },
};

/**
 * Applies an XP/rating delta to one ladder on the user document and records a
 * Rating ledger entry. Returns the updated ladder snapshot.
 */
export async function applyLadderDelta({ user, ladder, ratingDelta = 0, xpGained = 0, reason, refId = null, note = '' }) {
  const Rating = (await import('../models/Rating.js')).default;

  const field = LADDER_FIELD[ladder] ?? ladder;
  const ladderDoc = user[field] ?? {};
  const ratingBefore = ladderDoc.rating ?? 1200;
  const ratingAfter = Math.max(0, ratingBefore + ratingDelta);
  const newXp = Math.max(0, (ladderDoc.xp ?? 0) + xpGained);

  user[field] = {
    ...ladderDoc,
    rating: ratingAfter,
    xp: newXp,
    level: getLevelFromXP(newXp),
    weeklyXpGain: (ladderDoc.weeklyXpGain ?? 0) + xpGained,
    trend: ratingDelta > 0 ? 'up' : ratingDelta < 0 ? 'down' : (ladderDoc.trend ?? 'stable'),
  };

  await Rating.create({
    user: user._id,
    ladder,
    ratingBefore,
    ratingAfter,
    delta: ratingDelta,
    xpGained,
    reason,
    refId,
    note,
  });

  return user[ladder];
}

export function generateBattleCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'DC-';
  for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
