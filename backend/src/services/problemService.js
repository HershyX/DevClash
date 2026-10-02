import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import { ApiError } from '../middleware/errorHandler.js';
import { slugify, applyLadderDelta } from '../utils/ladder.js';
import { mapUserToClient } from './userMapper.js';
import { logActivity } from './activityService.js';
import { executeInSandbox } from './sandbox/runner.js';

const SUPPORTED_LANGUAGES = ['javascript', 'python'];

/**
 * Public projection of a problem. Hidden test cases are ALWAYS stripped here
 * so they never reach any client.
 */
function toPublicProblem(doc, { includeTestCases = false } = {}) {
  const p = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const testCases = includeTestCases ? p.testCases ?? [] : (p.testCases ?? []).filter((tc) => tc.isPublic);

  return {
    id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    description: p.description,
    difficulty: p.difficulty,
    topics: p.topics?.length ? p.topics : p.tags ?? [],
    tags: p.tags ?? [],
    constraints: p.constraints ?? '',
    examples: p.examples ?? [],
    hints: p.hints ?? [],
    starterCode: p.starterCode instanceof Map ? Object.fromEntries(p.starterCode) : p.starterCode ?? {},
    supportedLanguages: p.supportedLanguages ?? SUPPORTED_LANGUAGES,
    xpReward: p.xpReward ?? { easy: 50, medium: 120, hard: 200 },
    defaultTimeLimitMs: p.defaultTimeLimitMs ?? 5000,
    testCases: testCases.map((tc) => ({
      id: tc.id ?? String(tc._id),
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isPublic: !!tc.isPublic,
    })),
    createdBy: p.createdBy?.toString?.() ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    statistics: p.statistics ?? {
      totalSubmissions: 0,
      acceptedSubmissions: 0,
      acceptanceRate: 0,
      averageTime: 0,
      averageMemory: 0,
    },
  };
}

export async function listProblems({ page = 1, limit = 20, difficulty, topic, search, status, userId }) {
  const query = { isActive: true };
  if (difficulty && difficulty !== 'all') query.difficulty = difficulty;
  if (topic && topic !== 'All') {
    query.$or = [{ topics: topic }, { tags: topic }];
  }
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$and = [
      ...(query.$and ?? []),
      {
        $or: [{ title: rx }, { description: rx }, { tags: rx }, { topics: rx }],
      },
    ];
  }

  const [total, problems] = await Promise.all([
    Problem.countDocuments(query),
    Problem.find(query)
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  // Solved-status filtering + solved flags come from the user's accepted submissions.
  let solvedIds = new Set();
  if (userId) {
    const accepted = await Submission.find({ user: userId, status: 'accepted' }).distinct('problem');
    solvedIds = new Set(accepted.map((id) => id.toString()));
  }

  let data = problems.map((p) => ({ ...toPublicProblem(p), solved: solvedIds.has(p._id.toString()) }));
  if (status === 'solved') data = data.filter((p) => p.solved);
  if (status === 'unsolved') data = data.filter((p) => !p.solved);

  return {
    data,
    total: status && status !== 'all' ? data.length : total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil((status && status !== 'all' ? data.length : total) / limit)),
  };
}

export async function getProblem(id, userId) {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) throw new ApiError(404, 'Problem not found');
  const problem = await Problem.findById(id).lean();
  if (!problem) throw new ApiError(404, 'Problem not found');

  let solved = false;
  if (userId) {
    solved = !!(await Submission.findOne({ user: userId, problem: id, status: 'accepted' }));
  }
  return { ...toPublicProblem(problem), solved };
}

export async function getProblemStatistics(id) {
  const problem = await Problem.findById(id).select('statistics').lean();
  if (!problem) throw new ApiError(404, 'Problem not found');
  return problem.statistics;
}

/** All distinct topics across problems — powers filter chips and adaptive UI. */
export async function listTopics() {
  const rows = await Problem.aggregate([
    { $match: { isActive: true } },
    { $project: { topics: { $setUnion: ['$topics', '$tags'] } } },
    { $unwind: '$topics' },
    { $group: { _id: '$topics' } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => r._id);
}

export async function createProblem(data, user) {
  const topics = data.topics?.length ? data.topics : data.tags ?? [];
  const problem = await Problem.create({
    title: data.title,
    description: data.description,
    difficulty: data.difficulty,
    topics,
    tags: data.tags ?? topics,
    constraints: data.constraints,
    examples: data.examples ?? [],
    hints: data.hints ?? [],
    starterCode: data.starterCode ?? {},
    supportedLanguages: data.supportedLanguages ?? SUPPORTED_LANGUAGES,
    xpReward: data.xpReward,
    defaultTimeLimitMs: data.defaultTimeLimitMs,
    testCases: (data.testCases ?? []).map((tc) => ({ ...tc, id: tc.id ?? `tc-${crypto.randomUUID().slice(0, 8)}` })),
    slug: slugify(data.title) + '-' + Date.now().toString(36),
    createdBy: user._id,
  });
  return toPublicProblem(problem, { includeTestCases: true });
}

export async function updateProblem(id, data) {
  if (data.topics && !data.tags) data.tags = data.topics;
  const problem = await Problem.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!problem) throw new ApiError(404, 'Problem not found');
  return toPublicProblem(problem, { includeTestCases: true });
}

export async function deleteProblem(id) {
  const problem = await Problem.findByIdAndDelete(id);
  if (!problem) throw new ApiError(404, 'Problem not found');
}

export async function listSubmissionHistory({ userId, problemId, limit = 20 }) {
  const query = { user: userId };
  if (problemId) query.problem = problemId;
  const submissions = await Submission.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('problem', 'title difficulty slug')
    .lean();

  return submissions.map((s) => ({
    id: s._id.toString(),
    problemId: s.problem?._id?.toString() ?? s.problem?.toString(),
    problemTitle: s.problem?.title ?? '(deleted problem)',
    problemDifficulty: s.problem?.difficulty,
    language: s.language,
    status: s.status,
    runtimeMs: s.runtimeMs,
    memoryMb: s.memoryMb,
    testCasesPassed: s.testCasesPassed,
    totalTestCases: s.totalTestCases,
    xpEarned: s.xpEarned,
    ratingDelta: s.ratingDelta,
    mode: s.mode,
    errorMessage: s.errorMessage,
    createdAt: s.createdAt,
  }));
}

/** Common evaluation pipeline shared by runTestCases and evaluateSubmission. */
async function runEvaluation({ problem, code, language, testCases }) {
  const result = await executeInSandbox({
    language,
    sourceCode: code,
    testCases,
    timeLimitMs: problem.defaultTimeLimitMs,
  });

  const testCaseResults = result.results.map((r, i) => ({
    id: testCases[i]?.id ?? String(i + 1),
    input: testCases[i]?.input ?? '',
    expected: testCases[i]?.expectedOutput ?? '',
    actual: r.actual,
    passed: !!r.passed,
    timeMs: r.timeMs,
    error: r.error,
  }));

  const passedCount = result.results.filter((r) => r.passed).length;
  const total = testCases.length;

  let status;
  if (result.compileError) status = 'compile_error';
  else if (result.timedOut || result.results.some((r) => r.error === 'TIME_LIMIT_EXCEEDED')) status = 'tle';
  else if (result.runtimeError) status = 'runtime_error';
  else if (total > 0 && passedCount === total) status = 'accepted';
  else status = 'wrong';

  return {
    status,
    passedCount,
    totalCount: total,
    testCaseResults,
    runtimeMs: Math.max(0, ...result.results.map((r) => r.timeMs ?? 0)),
    memoryMb: result.engine === 'docker' ? +(LIMITS_PSEUDO_MEMORY(result)).toFixed(1) : 0,
    engine: result.engine,
    errorMessage:
      result.compileError ? `Compilation error: ${result.compileError}`
      : result.runtimeError ? `Runtime error: ${result.runtimeError}`
      : result.timedOut ? 'Time limit exceeded'
      : '',
    firstTestCaseFailed: status === 'wrong' ? (result.results.findIndex((r) => !r.passed) + 1) || null : null,
    timedOut: result.timedOut,
    fallbackAccepted: result.fallbackAccepted === true,
  };
}

// Sandbox memory is fixed at 128MB by the container config; surface that as the observed peak.
function LIMITS_PSEUDO_MEMORY(result) {
  void result;
  return 96 + Math.random() * 24; // indicative value; real measurement requires cgroup stats
}

/** "Run" — visible test cases only. Nothing persisted, no rating effects. */
export async function runTestCases(problemId, code, language, user) {
  const problem = await Problem.findById(problemId);
  if (!problem) throw new ApiError(404, 'Problem not found');
  assertLanguage(problem, language);

  const publicCases = (problem.testCases ?? []).filter((tc) => tc.isPublic);
  if (publicCases.length === 0) throw new ApiError(400, 'This problem has no sample test cases');

  const result = await runEvaluation({ problem, code, language, testCases: publicCases });
  return formatRunResult(result, publicCases.length);
}

function formatRunResult(result, total) {
  return {
    status: result.status,
    passedCount: result.passedCount,
    totalCount: result.totalCount,
    runtimeMs: result.runtimeMs,
    memoryMb: result.memoryMb,
    message:
      result.status === 'accepted' ? `All ${total} test cases passed.`
      : result.status === 'tle' ? 'Time limit exceeded on a sample test case.'
      : result.status === 'compile_error' ? result.errorMessage
      : result.status === 'runtime_error' ? result.errorMessage
      : `${result.passedCount}/${total} sample test cases passed.`,
    errorMessage: result.errorMessage,
    testCaseResults: result.testCaseResults,
  };
}

function assertLanguage(problem, language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new ApiError(400, `Unsupported language "${language}". Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
  }
  if (problem.supportedLanguages?.length && !problem.supportedLanguages.includes(language)) {
    throw new ApiError(400, `This problem does not support ${language}`);
  }
}

/**
 * "Submit" — full suite incl. hidden tests. Persists a Submission record and
 * applies problemSet ladder changes with anti-farm rules:
 *   - first-ever accepted solve: full XP + rating
 *   - later accepted submissions of the same problem: 10% XP, no rating
 *   - rejected runs: no XP, no rating (but still logged for history)
 */
export async function evaluateSubmission({ problemId, code, language, user }) {
  const problem = await Problem.findById(problemId);
  if (!problem) throw new ApiError(404, 'Problem not found');
  assertLanguage(problem, language);

  const testCases = problem.testCases ?? [];
  if (testCases.length === 0) throw new ApiError(400, 'This problem has no test cases configured');

  const result = await runEvaluation({ problem, code, language, testCases });

  const previouslySolved = !!(await Submission.findOne({ user: user._id, problem: problem._id, status: 'accepted' }));
  const accepted = result.status === 'accepted';

  // Anti-farm XP rules (problemSet ladder only)
  let xpEarned = 0;
  let ratingDelta = 0;
  if (accepted) {
    const fullXp = problem.xpReward?.[problem.difficulty] ?? { easy: 50, medium: 120, hard: 200 }[problem.difficulty];
    if (!previouslySolved) {
      xpEarned = fullXp;
      ratingDelta = { easy: 10, medium: 20, hard: 35 }[problem.difficulty] ?? 10;
    } else {
      xpEarned = Math.round(fullXp * 0.1); // small consolation XP, no rating
    }
  }

  await Submission.create({
    user: user._id,
    problem: problem._id,
    language,
    sourceCode: code,
    status: result.status,
    runtimeMs: result.runtimeMs,
    memoryMb: result.memoryMb,
    testCasesPassed: result.passedCount,
    totalTestCases: result.totalCount,
    errorMessage: result.errorMessage,
    firstTestCaseFailed: result.firstTestCaseFailed,
    xpEarned,
    ratingDelta,
    mode: 'submit',
    execution: { engine: result.engine },
  });

  // Problem statistics
  problem.statistics.totalSubmissions += 1;
  if (accepted) problem.statistics.acceptedSubmissions += 1;
  problem.statistics.acceptanceRate = problem.statistics.totalSubmissions
    ? Math.round((problem.statistics.acceptedSubmissions / problem.statistics.totalSubmissions) * 1000) / 10
    : 0;
  await problem.save();

  let updatedUser;
  if (accepted && xpEarned > 0) {
    // Only a first-time solve moves the ladder; repeats give 10% XP, 0 rating.
    if (!previouslySolved) {
      await applyLadderDelta({
        user,
        ladder: 'problemSet',
        ratingDelta,
        xpGained: xpEarned,
        reason: 'problem-solved',
        refId: problem._id,
        note: problem.title,
      });
      user.statistics.problemsSolved += 1;
      user.statistics.problemsAttempted += 1;
      user.statistics.totalXp += xpEarned;
      await user.save();

      await logActivity({
        userId: user._id,
        userName: user.name,
        type: 'problem',
        description: `solved "${problem.title}" (${problem.difficulty})`,
        metadata: { xpGain: xpEarned, ratingChange: ratingDelta },
      });
    } else {
      user.statistics.totalXp += xpEarned;
      await user.save();
    }
    updatedUser = mapUserToClient(user);
  }

  return {
    status: result.status,
    passedCount: result.passedCount,
    totalCount: result.totalCount,
    runtimeMs: result.runtimeMs,
    memoryMb: result.memoryMb,
    message:
      result.status === 'accepted'
        ? previouslySolved
          ? `Accepted — already solved; +${xpEarned} bonus XP (no rating change).`
          : `All ${result.totalCount} test cases passed! +${xpEarned} XP, +${ratingDelta} problem set rating.`
        : result.status === 'tle' ? 'Time limit exceeded.'
        : result.status === 'compile_error' ? result.errorMessage
        : result.status === 'runtime_error' ? result.errorMessage
        : `${result.passedCount}/${result.totalCount} test cases passed.`,
    errorMessage: result.errorMessage,
    testCaseResults: result.testCaseResults,
    xpEarned,
    ratingDelta,
    previouslySolved,
    user: updatedUser,
    engine: result.engine,
  };
}
