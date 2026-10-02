import AdaptiveSession from '../models/AdaptiveSession.js';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import { ApiError } from '../middleware/errorHandler.js';
import { applyLadderDelta, XP_PER_XP_SOURCE } from '../utils/ladder.js';
import { mapUserToClient } from './userMapper.js';
import { logActivity } from './activityService.js';
import { recommendNextProblem, recordSkillObservation, computeTopicSkill } from './adaptiveEngine.js';
import { executeInSandbox } from './sandbox/runner.js';

const SUPPORTED_LANGUAGES = ['javascript', 'python'];

/** The engine returns a structured reasoning object; clients want a sentence. */
function reasoningToText(reasoning) {
  if (!reasoning) return null;
  if (typeof reasoning === 'string') return reasoning;
  const parts = [reasoning.reason];
  if (reasoning.topic) parts.push(`Topic: ${reasoning.topic} (skill ${reasoning.topicSkill ?? '?'}/100).`);
  if (reasoning.difficulty) parts.push(`Difficulty: ${reasoning.difficulty}.`);
  return parts.filter(Boolean).join(' ');
}

function sessionToClient(doc) {
  const s = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const id = s._id.toString();

  return {
    id,
    userId: s.user?.toString?.() ?? String(s.user),
    status: s.status,
    currentProblem: s.currentProblem && typeof s.currentProblem === 'object'
      ? {
          ...s.currentProblem,
          id: s.currentProblem._id?.toString?.() ?? String(s.currentProblem._id),
          testCases: (s.currentProblem.testCases ?? [])
            .filter((tc) => tc.isPublic)
            .map((tc) => ({ id: tc.id ?? String(tc._id), input: tc.input, expectedOutput: tc.expectedOutput, isPublic: true })),
        }
      : null,
    problemsAttempted: (s.problemsAttempted ?? []).map((a) => ({
      problemId: a.problem?.toString?.() ?? String(a.problem),
      problemTitle: a.problemTitle,
      difficulty: a.difficulty,
      topic: a.topic,
      status: a.status,
      timeSpent: a.timeSpent,
      attempts: a.attempts,
      ratingChange: a.ratingChange,
      xpEarned: a.xpEarned ?? 0,
    })),
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    skillProfile: s.skillProfile ?? {},
    lastReasoning: s.lastReasoning ?? null,
    reasoning:
      reasoningToText(s.lastReasoning) ??
      (s.currentProblem ? 'Resumed session — continuing with the staged problem.' : null),
  };
}

export async function listSessions(userId) {
  const sessions = await AdaptiveSession.find({ user: userId }).sort({ createdAt: -1 }).limit(30).lean();
  return sessions.map(sessionToClient);
}

export async function findActiveSession(userId) {
  const session = await AdaptiveSession.findOne({ user: userId, status: 'active' }).lean();
  return session ? sessionToClient(session) : null;
}

export async function getSession(id, userId) {
  const session = await AdaptiveSession.findOne({ _id: id, user: userId }).populate('currentProblem');
  if (!session) throw new ApiError(404, 'Session not found');
  return sessionToClient(session);
}

/** POST /api/adaptive/session — start (or resume) a session. */
export async function startSession(user, { focusTopics = [] } = {}) {
  const active = await AdaptiveSession.findOne({ user: user._id, status: 'active' });
  if (active) {
    const populated = await active.populate('currentProblem');
    const client = sessionToClient(populated);
    if (!client.currentProblem) {
      const rec = await recommendNextProblem(user, { focusTopics, session: active });
      if (rec) {
        active.currentProblem = rec.problem._id;
        active.lastReasoning = rec.reasoning;
        await active.save();
        const repopulated = await active.populate('currentProblem');
        return { ...sessionToClient(repopulated), reasoning: reasoningToText(rec.reasoning) };
      }
    }
    return client;
  }

  const session = await AdaptiveSession.create({
    user: user._id,
    status: 'active',
    skillProfile: { estimatedRating: user.adaptiveRating?.rating ?? 1200, confidence: 0.5 },
  });
  user.statistics.adaptiveSessions += 1;
  await user.save();

  const rec = await recommendNextProblem(user, { focusTopics, session });
  if (rec) {
    session.currentProblem = rec.problem._id;
    session.lastReasoning = rec.reasoning;
    await session.save();
  }
  const populated = await session.populate('currentProblem');
  return { ...sessionToClient(populated), reasoning: reasoningToText(rec?.reasoning) };
}

/** GET /api/adaptive/next — recommend (and stage) the next problem. */
export async function getNextProblem(sessionId, user, { focusTopics = [] } = {}) {
  let session = await AdaptiveSession.findOne({ _id: sessionId, user: user._id });
  if (!session) throw new ApiError(404, 'Session not found');
  if (session.status !== 'active') return { ...sessionToClient(session), reasoning: null };

  const rec = await recommendNextProblem(user, { focusTopics, session });
  if (!rec) {
    session.status = 'completed';
    session.endedAt = new Date();
    await session.save();
    return { ...sessionToClient(session), reasoning: null };
  }

  session.currentProblem = rec.problem._id;
  session.lastReasoning = rec.reasoning;
  await session.save();
  const populated = await session.populate('currentProblem');
  return { ...sessionToClient(populated), reasoning: reasoningToText(rec.reasoning) };
}

/** POST /api/adaptive/session/:id/complete — finish a session. */
export async function completeSession(sessionId, user) {
  const session = await AdaptiveSession.findOne({ _id: sessionId, user: user._id });
  if (!session) throw new ApiError(404, 'Session not found');

  session.status = 'completed';
  session.endedAt = new Date();
  session.currentProblem = null;

  const solved = session.problemsAttempted.filter((a) => a.status === 'solved');
  const topicsHit = [...new Set(session.problemsAttempted.map((a) => a.topic).filter(Boolean))];
  session.skillProfile.strengths = solved.length > 0 ? [...new Set(solved.map((a) => a.topic).filter(Boolean))] : [];
  session.skillProfile.weaknesses = session.problemsAttempted.filter((a) => a.status !== 'solved').length > solved.length
    ? topicsHit.filter((t) => !session.skillProfile.strengths.includes(t))
    : [];
  session.skillProfile.recommendedTopics = topicsHit;

  await session.save();
  return sessionToClient(session);
}

/** Legacy alias kept for compatibility with earlier route wiring. */
export const endSession = completeSession;

async function evaluateInSandboxForProblem(problem, code, language) {
  const result = await executeInSandbox({
    language,
    sourceCode: code,
    testCases: problem.testCases ?? [],
    timeLimitMs: problem.defaultTimeLimitMs,
  });
  const total = (problem.testCases ?? []).length;
  const passedCount = result.results.filter((r) => r.passed).length;
  let status;
  if (result.compileError) status = 'compile_error';
  else if (result.timedOut || result.results.some((r) => r.error === 'TIME_LIMIT_EXCEEDED')) status = 'tle';
  else if (result.runtimeError) status = 'runtime_error';
  else if (total > 0 && passedCount === total) status = 'accepted';
  else status = 'wrong';
  return { status, passedCount, total, engine: result.engine, errorMessage: result.compileError ? `Compilation error: ${result.compileError}` : result.runtimeError ? `Runtime error: ${result.runtimeError}` : result.timedOut ? 'Time limit exceeded' : '' };
}

/** Submit an attempt at the session's current problem (sandbox-evaluated). */
export async function submitAttempt({ sessionId, code, language, timeSpent = 0, user }) {
  const session = await AdaptiveSession.findOne({ _id: sessionId, user: user._id }).populate('currentProblem');
  if (!session) throw new ApiError(404, 'Session not found');
  if (!session.currentProblem) throw new ApiError(400, 'No active problem in this session. Request the next problem first.');
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new ApiError(400, `Unsupported language "${language}". Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
  }

  const problem = session.currentProblem;
  const existing = session.problemsAttempted.find((a) => a.problem.toString() === problem._id.toString());
  const attempts = (existing?.attempts ?? 0) + 1;

  const eval_ = await evaluateInSandboxForProblem(problem, code, language);
  const solved = eval_.status === 'accepted';

  // Record in Submission history too (mode 'submit', marked as adaptive)
  await Submission.create({
    user: user._id,
    problem: problem._id,
    language,
    sourceCode: code,
    status: eval_.status,
    runtimeMs: 0,
    memoryMb: 0,
    testCasesPassed: eval_.passedCount,
    totalTestCases: eval_.total,
    errorMessage: eval_.errorMessage,
    mode: 'submit',
    execution: { engine: eval_.engine },
  });

  // Adaptive ladder + XP only on solve
  let ratingChange = 0;
  let xpEarned = 0;
  if (solved) {
    ratingChange = { easy: 8, medium: 14, hard: 22 }[problem.difficulty] ?? 8;
    xpEarned = XP_PER_XP_SOURCE.adaptiveSolved(problem.difficulty);
  } else {
    ratingChange = -Math.floor(Math.random() * 5) - 1;
  }

  const attempt = {
    problem: problem._id,
    problemTitle: problem.title,
    difficulty: problem.difficulty,
    topic: problem.topics?.[0] ?? problem.tags?.[0] ?? null,
    status: solved ? 'solved' : 'attempted',
    timeSpent,
    attempts,
    ratingChange,
    xpEarned,
  };

  if (existing) {
    Object.assign(existing, attempt);
  } else {
    session.problemsAttempted.push(attempt);
  }

  session.skillProfile.estimatedRating = Math.max(800, (session.skillProfile.estimatedRating ?? 1200) + ratingChange);
  session.skillProfile.confidence = Math.min(1, (session.skillProfile.confidence ?? 0.5) + (solved ? 0.05 : 0.02));

  // Skill profile observation drives future recommendations
  await recordSkillObservation({ user, problem, solved, timeSpent, attempts });

  if (solved) {
    session.currentProblem = null;
  }
  await session.save();

  if (solved) {
    await applyLadderDelta({
      user,
      ladder: 'adaptive',
      ratingDelta: ratingChange,
      xpGained: xpEarned,
      reason: 'adaptive-session',
      refId: session._id,
      note: problem.title,
    });
    user.statistics.totalXp += xpEarned;
    await user.save();

    await logActivity({
      userId: user._id,
      userName: user.name,
      type: 'adaptive',
      description: `solved "${problem.title}" in adaptive session (+${xpEarned} XP)`,
      metadata: { ratingChange, xpGain: xpEarned },
    });
  }

  return {
    ...attempt,
    problemId: problem._id.toString(),
    status: solved ? 'solved' : eval_.status === 'tle' ? 'attempted' : 'attempted',
    evalStatus: eval_.status,
    errorMessage: eval_.errorMessage,
    passedCount: eval_.passedCount,
    totalCount: eval_.total,
    session: sessionToClient(session),
    user: mapUserToClient(user),
    ratingChange,
    xpEarned,
  };
}

export async function getSkillProfile(userId) {
  const { getSkillAnalytics } = await import('./adaptiveEngine.js');
  return getSkillAnalytics(await (async () => {
    const User = (await import('../models/User.js')).default;
    return User.findById(userId);
  })());
}

export async function getSessionHistory(userId, limit = 10) {
  const sessions = await AdaptiveSession.find({ user: userId, status: 'completed' })
    .sort({ endedAt: -1 })
    .limit(limit)
    .lean();

  return sessions.map((s) => {
    const solved = (s.problemsAttempted ?? []).filter((a) => a.status === 'solved');
    const totalRating = (s.problemsAttempted ?? []).reduce((sum, a) => sum + (a.ratingChange ?? 0), 0);
    const totalXp = (s.problemsAttempted ?? []).reduce((sum, a) => sum + (a.xpEarned ?? 0), 0);
    const durationSec = s.endedAt && s.startedAt ? Math.round((new Date(s.endedAt) - new Date(s.startedAt)) / 1000) : 0;
    return {
      id: s._id.toString(),
      date: s.endedAt ?? s.startedAt,
      problems: (s.problemsAttempted ?? []).length,
      solved: solved.length,
      xp: totalXp,
      ratingChange: totalRating,
      durationSec,
      topics: [...new Set((s.problemsAttempted ?? []).map((a) => a.topic).filter(Boolean))],
      accuracy: (s.problemsAttempted ?? []).length ? Math.round((solved.length / s.problemsAttempted.length) * 100) : 0,
    };
  });
}

export { computeTopicSkill };
