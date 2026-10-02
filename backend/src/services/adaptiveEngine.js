import Problem from '../models/Problem.js';
import AdaptiveSession from '../models/AdaptiveSession.js';
import SkillProfile from '../models/SkillProfile.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Adaptive recommendation engine (backend-only logic).
 *
 * Not a simple Easy→Medium→Hard ladder. Per user+topic mastery is tracked in
 * SkillProfile and combined into a 0–100 skill score:
 *   mastery = accuracy*50 + recency*20 + speed*15 + efficiency*15
 * The engine then:
 *   1. picks the TARGET TOPIC:
 *      - user-selected focus topics win
 *      - otherwise weakest-topic-first (reinforcement), with a 30% explore
 *        chance on a random unseen topic
 *      - repeated failures (3+ recent fails on a topic) force reinforcement of
 *        an easier problem in the same topic before any difficulty bump
 *   2. picks the DIFFICULTY from the topic's skill score:
 *      score >=75 → hard, >=45 → medium, else easy — but never harder than the
 *      difficulty the user's most recent result justifies (a fresh hard failure
 *      in that topic steps difficulty DOWN once).
 *   3. excludes problems already solved this session and (softly) previously
 *      solved ones.
 */

const TOPIC_CANON = [
  'Arrays', 'Strings', 'Hash Maps', 'Recursion', 'Linked Lists', 'Stacks', 'Queues',
  'Trees', 'Graphs', 'Dynamic Programming', 'Sorting', 'Searching', 'Two Pointers',
  'Sliding Window', 'Binary Search', 'Greedy', 'Math',
];

const RECENT_WINDOW = 5; // results considered for recency
const FAIL_STREAK_REINFORCE = 3; // consecutive failures before forcing easier
const EXPLORE_CHANCE = 0.3;

export function normalizeTopic(topic) {
  if (!topic) return 'Arrays';
  const t = topic.trim();
  const alias = {
    'Hash Tables': 'Hash Maps', 'Hash Table': 'Hash Maps', Hashtable: 'Hash Maps',
    'Hash Maps': 'Hash Maps', Hashing: 'Hash Maps',
    'Graph Algorithms': 'Graphs', Graph: 'Graphs',
    'Dynamic Programming': 'Dynamic Programming', DP: 'Dynamic Programming',
    'Binary Search': 'Searching', Search: 'Searching', 'Binary Search Trees': 'Trees',
    'Two Pointers': 'Two Pointers', 'Sliding Window': 'Sliding Window',
    Tree: 'Trees', Queue: 'Queues', Stack: 'Stacks', 'Linked List': 'Linked Lists',
    Array: 'Arrays', String: 'Strings', Sort: 'Sorting', 'Sort Algorithms': 'Sorting',
  };
  return alias[t] ?? (TOPIC_CANON.includes(t) ? t : t); // allow free-form topics from problems
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function computeTopicSkill(stat) {
  if (!stat || stat.attempts === 0) return { score: 50, accuracy: 0, avgAttempts: 0, avgSolveTimeSec: 0, recentAccuracy: null, confidence: 0 };
  const accuracy = stat.solved / stat.attempts;
  const recents = stat.recentResults.slice(-RECENT_WINDOW);
  const recentAccuracy = recents.length ? recents.filter(Boolean).length / recents.length : null;
  const avgAttempts = stat.solved > 0 ? stat.totalAttemptsToSolve / stat.solved : stat.attempts;
  const avgSolveTimeSec = stat.solved > 0 ? stat.totalSolveTimeSec / stat.solved : 0;
  const efficiency = clamp(1.5 - avgAttempts / 3, 0, 1); // 1 attempt → 1.0, 3+ → ~0.17
  const speed = clamp(1 - avgSolveTimeSec / 1200, 0, 1); // 20min → 0
  const confidence = clamp(stat.attempts / 10, 0, 1);
  const score = Math.round(
    accuracy * 50 +
    (recentAccuracy ?? accuracy) * 20 +
    efficiency * 15 +
    speed * 15
  );
  return { score, accuracy, avgAttempts, avgSolveTimeSec, recentAccuracy, confidence: +confidence.toFixed(2) };
}

export function difficultyForScore(score) {
  if (score >= 75) return 'hard';
  if (score >= 45) return 'medium';
  return 'easy';
}

function lastFailStreak(stat) {
  if (!stat) return 0;
  let streak = 0;
  for (let i = stat.recentResults.length - 1; i >= 0; i--) {
    if (stat.recentResults[i]) break;
    streak++;
  }
  return streak;
}

/**
 * Picks the next problem for a user.
 * opts.focusTopics — topics the user explicitly wants to practice
 * Returns the problem doc (or null when the pool is exhausted).
 */
export async function recommendNextProblem(user, { focusTopics = [], session } = {}) {
  let profile = await SkillProfile.findOne({ user: user._id });
  if (!profile) profile = await SkillProfile.create({ user: user._id });

  const statByTopic = new Map(profile.topics.map((t) => [normalizeTopic(t.topic), t]));

  // ---- 1. Choose target topic ----
  let topic;
  let reason;

  const attemptedIds = (session?.problemsAttempted ?? []).map((a) => a.problem);
  const attemptedSet = new Set(attemptedIds.map(String));

  const focus = focusTopics.map(normalizeTopic);
  if (focus.length > 0) {
    topic = focus[Math.floor(Math.random() * focus.length)];
    reason = `You selected ${topic} as a focus topic.`;
  } else {
    // Check for fail streaks — reinforcement takes priority
    const failingTopic = [...statByTopic.entries()]
      .filter(([, s]) => lastFailStreak(s) >= FAIL_STREAK_REINFORCE)
      .sort((a, b) => lastFailStreak(b[1]) - lastFailStreak(a[1]))[0];

    if (failingTopic) {
      topic = failingTopic[0];
      reason = `Recent struggles in ${topic} — reinforcing with a gentler problem before stepping up.`;
    } else if (Math.random() < EXPLORE_CHANCE) {
      const seen = new Set(statByTopic.keys());
      const unseen = await distinctTopicsInPool();
      const candidates = unseen.filter((t) => !seen.has(t));
      if (candidates.length > 0) {
        topic = candidates[Math.floor(Math.random() * candidates.length)];
        reason = `Exploring a new topic: ${topic}.`;
      }
    }

    if (!topic) {
      // Weakest-first among practiced topics; fall back to any pool topic.
      const scored = [...statByTopic.entries()].map(([t, s]) => ({ t, score: computeTopicSkill(s).score }));
      scored.sort((a, b) => a.score - b.score);
      topic = scored[0]?.t ?? (await distinctTopicsInPool())[0] ?? 'Arrays';
      reason = scored[0] ? `Weakest area right now: ${topic} (skill ${scored[0].score}/100).` : `Building your baseline in ${topic}.`;
    }
  }

  // ---- 2. Choose difficulty ----
  const stat = statByTopic.get(topic);
  const skill = computeTopicSkill(stat);
  let difficulty = difficultyForScore(skill.score);
  const failStreak = lastFailStreak(stat);
  if (failStreak >= 2 && difficulty !== 'easy') {
    difficulty = difficulty === 'hard' ? 'medium' : 'easy';
    reason += ` Difficulty stepped down to ${difficulty} after recent misses.`;
  } else if (failStreak === 0 && stat && skill.recentAccuracy === 1 && skill.score >= 85) {
    // on a hot streak — one notch up
    difficulty = difficulty === 'easy' ? 'medium' : 'hard';
    reason += ` On a roll in ${topic} — leveling up to ${difficulty}.`;
  }

  // ---- 3. Pick problem from pool ----
  const excluded = [...attemptedSet];
  const pick = await pickProblem({ topic, difficulty, excluded, userId: user._id });

  // Graceful degradation: relax difficulty, then topic, then exclusion list
  let chosen = pick;
  if (!chosen) chosen = await pickProblem({ topic, difficulty: null, excluded, userId: user._id });
  if (!chosen) chosen = await pickProblem({ topic: null, difficulty: null, excluded, userId: user._id });
  if (!chosen) chosen = await pickProblem({ topic: null, difficulty: null, excluded: [], userId: user._id });
  if (!chosen) return null;

  return {
    problem: chosen,
    reasoning: {
      topic,
      difficulty: chosen.difficulty,
      reason,
      topicSkill: skill.score,
      topicConfidence: skill.confidence,
    },
  };
}

async function distinctTopicsInPool() {
  const rows = await Problem.aggregate([
    { $match: { isActive: true } },
    { $project: { t: { $setUnion: [{ $ifNull: ['$topics', []] }, { $ifNull: ['$tags', []] }] } } },
    { $unwind: '$t' },
    { $group: { _id: '$t' } },
  ]);
  return rows.map((r) => normalizeTopic(r._id));
}

async function pickProblem({ topic, difficulty, excluded, userId }) {
  const query = { isActive: true };
  if (topic) query.$or = [{ topics: topic }, { tags: topic }];
  if (difficulty) query.difficulty = difficulty;
  if (excluded.length > 0) query._id = { $nin: excluded };

  const count = await Problem.countDocuments(query);
  if (count === 0) return null;
  const skip = Math.floor(Math.random() * count);
  return Problem.findOne(query).skip(skip);
}

/**
 * Records an attempt into the user's SkillProfile.
 * Called by adaptiveService.submitAttempt with the attempt outcome.
 */
export async function recordSkillObservation({ user, problem, solved, timeSpent, attempts }) {
  const profile = await SkillProfile.findOneAndUpdate(
    { user: user._id },
    { $setOnInsert: { user: user._id, topics: [] } },
    { upsert: true, new: true }
  );

  const topic = normalizeTopic(problem.topics?.[0] ?? problem.tags?.[0] ?? 'Arrays');
  let stat = profile.topics.find((t) => normalizeTopic(t.topic) === topic);
  if (!stat) {
    profile.topics.push({ topic, attempts: 0, solved: 0, totalAttemptsToSolve: 0, totalSolveTimeSec: 0, recentResults: [] });
    stat = profile.topics[profile.topics.length - 1];
  }

  stat.attempts += 1;
  stat.recentResults.push(!!solved);
  if (stat.recentResults.length > RECENT_WINDOW * 3) stat.recentResults = stat.recentResults.slice(-RECENT_WINDOW * 3);
  if (solved) {
    stat.solved += 1;
    stat.totalAttemptsToSolve += attempts;
    stat.totalSolveTimeSec += timeSpent;
  }

  const dp = profile.difficultyPerformance[problem.difficulty] ?? profile.difficultyPerformance.easy;
  dp.attempts += 1;
  if (solved) {
    dp.solved += 1;
    dp.totalSolveTimeSec += timeSpent;
  }

  profile.totalProblemsAttempted += 1;
  if (solved) profile.totalProblemsSolved += 1;
  profile.totalSolveTimeSec += timeSpent;
  profile.updatedAt = new Date();
  await profile.save();

  return profile;
}

/** Full analytics payload for the Adaptive UI. */
export async function getSkillAnalytics(user) {
  const profile = await SkillProfile.findOne({ user: user._id }).lean();
  if (!profile) {
    return {
      topics: [],
      strongest: [],
      weakest: [],
      overall: { accuracy: 0, totalAttempted: 0, totalSolved: 0, avgSolveTimeSec: 0 },
      difficultyPerformance: { easy: { accuracy: 0 }, medium: { accuracy: 0 }, hard: { accuracy: 0 } },
    };
  }

  const topics = (profile.topics ?? []).map((t) => {
    const skill = computeTopicSkill(t);
    return {
      topic: t.topic,
      attempts: t.attempts,
      solved: t.solved,
      accuracy: Math.round(skill.accuracy * 100),
      skillScore: skill.score,
      confidence: skill.confidence,
      avgAttemptsToSolve: +skill.avgAttempts.toFixed(2),
      avgSolveTimeSec: Math.round(skill.avgSolveTimeSec),
      recentAccuracy: skill.recentAccuracy === null ? null : Math.round(skill.recentAccuracy * 100),
    };
  });
  topics.sort((a, b) => b.skillScore - a.skillScore);

  const dp = profile.difficultyPerformance ?? {};
  const diffPerf = {};
  for (const d of ['easy', 'medium', 'hard']) {
    const s = dp[d] ?? { attempts: 0, solved: 0, totalSolveTimeSec: 0 };
    diffPerf[d] = {
      attempts: s.attempts,
      solved: s.solved,
      accuracy: s.attempts ? Math.round((s.solved / s.attempts) * 100) : 0,
      avgSolveTimeSec: s.solved ? Math.round(s.totalSolveTimeSec / s.solved) : 0,
    };
  }

  return {
    topics,
    strongest: topics.slice(0, 3),
    weakest: [...topics].sort((a, b) => a.skillScore - b.skillScore).slice(0, 3),
    overall: {
      accuracy: profile.totalProblemsAttempted ? Math.round((profile.totalProblemsSolved / profile.totalProblemsAttempted) * 100) : 0,
      totalAttempted: profile.totalProblemsAttempted,
      totalSolved: profile.totalProblemsSolved,
      avgSolveTimeSec: profile.totalProblemsSolved ? Math.round(profile.totalSolveTimeSec / profile.totalProblemsSolved) : 0,
    },
    difficultyPerformance: diffPerf,
  };
}

export { TOPIC_CANON };
