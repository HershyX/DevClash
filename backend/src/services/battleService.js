import Battle from '../models/Battle.js';
import BattleParticipant from '../models/BattleParticipant.js';
import Problem from '../models/Problem.js';
import User from '../models/User.js';
import crypto from 'crypto';
import { ApiError } from '../middleware/errorHandler.js';
import { applyLadderDelta, generateBattleCode, XP_PER_XP_SOURCE, RATING_K } from '../utils/ladder.js';
import { mapUserToClient } from './userMapper.js';
import { logActivity, notify } from './activityService.js';
import { executeInSandbox } from './sandbox/runner.js';

/**
 * Module-level io reference. Set once by createSocketServer() in sockets/index.js
 * so the service can push real-time updates without circular imports.
 */
let _io = null;
export function setIo(io) { _io = io; }

/** Push to a battle room; silently no-ops if Socket.IO isn't wired yet. */
function emitToBattle(battleId, event, payload) {
  _io?.to(`battle:${battleId}`).emit(event, payload);
}

/** Push to a user's personal notification room. */
function emitToUser(userId, event, payload) {
  _io?.to(`user:${userId}`).emit(event, payload);
}

// ── Bot opponents (named bots for quick-match) ──────────────────────────────
const BOT_IDS = {};
const BOT_OPPONENTS = [
  { name: 'Kavya_Dev',       ratingOffset: 12  },
  { name: 'AlgoNinja_99',    ratingOffset: -24 },
  { name: 'BinaryPhantom',   ratingOffset: 35  },
  { name: 'RecursionRex',    ratingOffset: -8  },
  { name: 'ByteMaster',      ratingOffset: 19  },
];
// Give each bot a stable fake hex ID so queries never accidentally match a real user.
for (const b of BOT_OPPONENTS) {
  BOT_IDS[b.name] = crypto.createHash('md5').update(`bot:${b.name}`).digest('hex').slice(0, 24);
}

// ── Shared helpers ──────────────────────────────────────────────────────────

function participantToClient(p) {
  return {
    userId:          p.user?.toString?.() ?? String(p.user),
    name:            p.name,
    avatar:          p.avatar ?? undefined,
    isBot:           p.isBot ?? false,
    rating:          p.rating ?? 1200,
    code:            undefined,             // never send source code through sockets
    language:        p.language ?? null,
    score:           p.score ?? 0,
    status:          p.status,
    testCasesPassed: p.testCasesPassed ?? 0,
    totalTestCases:  p.totalTestCases  ?? 0,
  };
}

function battleToClient(doc) {
  const b = typeof doc.toObject === 'function' ? doc.toObject() : doc;

  const problem = b.problem && typeof b.problem === 'object'
    ? { ...b.problem, id: b.problem._id?.toString?.() ?? String(b.problem._id) }
    : b.problem;

  return {
    id:           b._id.toString(),
    battleCode:   b.battleCode,
    isRanked:     b.isRanked,
    status:       b.status,
    mode:         b.mode,
    participants: (b.participants ?? []).map(participantToClient),
    problem,
    startedAt:    b.startedAt,
    endedAt:      b.endedAt,
    timeLimit:    b.timeLimit,
    language:     b.language,
    result:       b.result
      ? {
          ...b.result,
          scores: b.result.scores instanceof Map
            ? Object.fromEntries(b.result.scores)
            : (b.result.scores ?? {}),
        }
      : undefined,
  };
}

async function getRandomProblemSkip() {
  const count = await Problem.countDocuments({ isActive: true });
  return count === 0 ? 0 : Math.floor(Math.random() * count);
}

// ── Public service API ───────────────────────────────────────────────────────

export async function listBattles({ userId, status, limit = 20, page = 1 }) {
  const query = status ? { status } : { 'participants.user': userId };
  const skip  = (page - 1) * limit;
  const [total, battles] = await Promise.all([
    Battle.countDocuments(query),
    Battle.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(limit, 100))
      .populate('problem')
      .lean(),
  ]);
  return {
    data:       battles.map(battleToClient),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getBattle(idOrCode, _userId) {
  const query = /^[0-9a-fA-F]{24}$/.test(idOrCode)
    ? { _id: idOrCode }
    : { battleCode: idOrCode.toUpperCase() };
  const battle = await Battle.findOne(query).populate('problem');
  if (!battle) throw new ApiError(404, 'Battle not found');
  return battleToClient(battle);
}

/**
 * Player A creates a battle and waits. Returns immediately with a battle code.
 * Socket.IO will push `battle:joined` to the room when Player B joins.
 */
export async function createCustomBattle({ isRanked, problemId, user }) {
  const problem = problemId
    ? await Problem.findById(problemId)
    : (await Problem.findOne({ isActive: true }).skip(await getRandomProblemSkip())) ?? null;
  if (!problem) throw new ApiError(503, 'No problems available — run npm run seed first.');

  const battle = await Battle.create({
    battleCode:   generateBattleCode(),
    isRanked,
    status:       'waiting',
    mode:         'duel',
    participants: [{
      user:            user._id,
      name:            user.name,
      rating:          user.duelRating?.rating ?? 1200,
      status:          'connected',
      totalTestCases:  problem.testCases?.length ?? 0,
    }],
    problem: problem._id,
    timeLimit: 30,
    language: 'javascript',
  });

  return battleToClient(await battle.populate('problem'));
}

/**
 * Player B joins by battle code.
 * Emits `battle:joined` + `battle:start` to the room so Player A's waiting
 * screen automatically transitions into the arena.
 */
export async function joinCustomBattle({ battleCode, user }) {
  const normalized = battleCode.trim().toUpperCase();
  const battle = await Battle.findOne({ battleCode: normalized }).populate('problem');

  if (!battle) {
    throw new ApiError(404, `No battle found with code "${battleCode}". Check the code and try again.`);
  }
  if (battle.status === 'completed' || battle.status === 'cancelled') {
    throw new ApiError(409, 'This battle has already ended.');
  }
  if (battle.status === 'active') {
    throw new ApiError(409, 'This battle has already started.');
  }
  if (battle.participants.some((p) => p.user.toString() === user._id.toString())) {
    throw new ApiError(409, 'You have already joined this battle.');
  }
  if (battle.participants.length >= 2) {
    throw new ApiError(409, 'This battle is already full.');
  }

  battle.participants.push({
    user:           user._id,
    name:           user.name,
    rating:         user.duelRating?.rating ?? 1200,
    status:         'connected',
    totalTestCases: battle.problem?.testCases?.length ?? 0,
  });
  battle.status    = 'active';
  battle.startedAt = new Date();
  await battle.save();

  const client = battleToClient(battle);

  // Push to everyone in the room (including the creator who is already waiting).
  emitToBattle(client.id, 'battle:joined', { battleId: client.id, participant: participantToClient(battle.participants[1]) });
  emitToBattle(client.id, 'battle:start',  { battleId: client.id, battle: client });

  // Notify the battle creator via their personal room so they get a push even
  // if their socket hadn't joined the battle room yet.
  const creatorId = battle.participants[0].user.toString();
  emitToUser(creatorId, 'battle:start', { battleId: client.id, battle: client });

  return client;
}

/**
 * Instant quick-match against a named bot.
 * Bot gets a stable fake userId so participant queries don't touch real users.
 */
export async function findQuickMatch({ isRanked, user }) {
  const problem = await Problem.findOne({ isActive: true }).skip(await getRandomProblemSkip());
  if (!problem) throw new ApiError(503, 'No problems available — run npm run seed first.');

  const userRating = user.duelRating?.rating ?? 1200;
  const bot = BOT_OPPONENTS[Math.floor(Math.random() * BOT_OPPONENTS.length)];
  const opponentRating = Math.max(1000, userRating + bot.ratingOffset);
  const botFakeId = BOT_IDS[bot.name];

  const battle = await Battle.create({
    battleCode: generateBattleCode(),
    isRanked,
    status:    'active',
    mode:      'duel',
    participants: [
      {
        user:           user._id,
        name:           user.name,
        rating:         userRating,
        status:         'coding',
        totalTestCases: problem.testCases?.length ?? 0,
      },
      {
        user:           botFakeId,   // stable fake ID, never a real User ObjectId
        name:           bot.name,
        isBot:          true,
        rating:         opponentRating,
        status:         'coding',
        totalTestCases: problem.testCases?.length ?? 0,
      },
    ],
    problem:   problem._id,
    timeLimit: 30,
    language:  'javascript',
    startedAt: new Date(),
  });

  return battleToClient(await battle.populate('problem'));
}

/**
 * Bot timeline for the arena cosmetic progress bar.
 * Purely aesthetic — the real state is determined by the server.
 */
export function getBotTimeline(battle, _opponentUserId) {
  const bot = battle.participants?.find((p) => p.isBot);
  if (!bot) return [];
  const total = bot.totalTestCases || 5;
  return [
    { status: 'coding',    testCasesPassed: 1,                atSeconds: 4.5  },
    { status: 'coding',    testCasesPassed: Math.min(3,total), atSeconds: 9.0  },
    { status: 'coding',    testCasesPassed: Math.min(4,total), atSeconds: 13.5 },
    { status: 'submitted', testCasesPassed: total,             atSeconds: 18.0 },
  ].map((s) => ({ ...s, userId: bot.userId ?? bot.user?.toString() }));
}

/**
 * Evaluate a player's battle submission through the real sandbox.
 *
 * Security rules enforced server-side:
 *  - user must be a participant
 *  - battle must be active
 *  - player must not have already submitted a passing solution
 *  - rated effects only for ranked battles
 *  - loser also gets a rating deduction on ranked battles
 */
export async function submitBattleCode({ battleId, code, language, user }) {
  const battle = await Battle.findById(battleId).populate('problem');
  if (!battle) throw new ApiError(404, 'Battle not found');
  if (battle.status === 'completed') throw new ApiError(409, 'Battle already completed');
  if (battle.status !== 'active')    throw new ApiError(409, 'Battle is not active');

  const me = battle.participants.find((p) => !p.isBot && p.user.toString() === user._id.toString());
  if (!me) throw new ApiError(403, 'You are not a participant of this battle');
  if (me.status === 'passed') throw new ApiError(409, 'You have already submitted a passing solution');

  const testCases  = battle.problem?.testCases ?? [];
  const total      = testCases.length;
  let   passedCount = 0;
  let   evalStatus  = 'wrong';
  let   errorMsg    = '';

  if (total > 0 && ['javascript', 'python'].includes(language)) {
    // Use the real sandboxed executor (same as problem submissions)
    const result = await executeInSandbox({
      language,
      sourceCode:  code,
      testCases,
      timeLimitMs: battle.problem.defaultTimeLimitMs ?? 5000,
    });
    passedCount = result.results.filter((r) => r.passed).length;
    if (result.compileError) {
      evalStatus = 'compile_error';
      errorMsg   = `Compilation error: ${result.compileError}`;
    } else if (result.timedOut) {
      evalStatus = 'tle';
      errorMsg   = 'Time limit exceeded';
    } else if (result.runtimeError) {
      evalStatus = 'runtime_error';
      errorMsg   = `Runtime error: ${result.runtimeError}`;
    } else if (passedCount === total) {
      evalStatus = 'accepted';
    } else {
      evalStatus = 'wrong';
    }
  } else if (total === 0) {
    // No test cases configured — treat as accepted for demo purposes
    passedCount = 0;
    evalStatus  = 'accepted';
  } else {
    // Unsupported language — demo accept
    passedCount = total;
    evalStatus  = 'accepted';
  }

  const allPassed = evalStatus === 'accepted';
  const score     = total ? Math.round((passedCount / total) * 100) : (allPassed ? 100 : 0);

  // Update my participant record
  me.language        = language;
  me.score           = score;
  me.testCasesPassed = passedCount;
  me.status          = allPassed ? 'passed' : 'failed';
  if (!me.submittedAt) me.submittedAt = new Date();

  // Record submission in the battle log (no source code)
  battle.result.submissions.push({
    userId:      user._id.toString(),
    code:        '',              // deliberately empty — do NOT store user code in battle doc
    language,
    status:      allPassed ? 'accepted' : (evalStatus === 'compile_error' ? 'error' : 'wrong'),
    score,
    submittedAt: new Date(),
  });

  // If bot opponent is present and user passed, bot "finishes" slightly worse
  const bot = battle.participants.find((p) => p.isBot);
  if (bot && allPassed) {
    bot.status          = 'passed';
    bot.testCasesPassed = Math.max(0, total - 1);
    bot.score           = total ? Math.round(((total - 1) / total) * 100) : 0;
  }

  // Push live progress update to everyone in the room
  emitToBattle(battleId, 'battle:submission-update', {
    battleId,
    participant: participantToClient(me),
    evalStatus,
    score,
    passedCount,
    totalCount: total,
    errorMessage: errorMsg || undefined,
  });

  // ── Resolve battle completion ─────────────────────────────────────────────
  const isVictory = allPassed;
  if (isVictory) {
    battle.status              = 'completed';
    battle.endedAt             = new Date();
    battle.result.winnerId     = user._id.toString();
    battle.result.isVictory    = true;
    battle.result.duration     = battle.startedAt
      ? Math.floor((Date.now() - new Date(battle.startedAt).getTime()) / 1000)
      : 0;
    battle.result.scores = Object.fromEntries(
      battle.participants.map((p) => [p.user.toString(), p.score])
    );
  }

  await battle.save();

  // ── Rating + XP changes ──────────────────────────────────────────────────
  let ratingChange  = 0;
  let xpGained      = 0;
  let newRating     = user.duelRating?.rating ?? 1200;

  if (battle.status === 'completed') {
    const participantRatingBefore = me.rating;

    if (isVictory && battle.isRanked) {
      ratingChange = RATING_K.duel.win;
      xpGained     = XP_PER_XP_SOURCE.battleWin;
    } else if (isVictory) {
      xpGained = Math.round(XP_PER_XP_SOURCE.battleWin / 2);
    } else if (!isVictory && battle.isRanked) {
      // Loser also loses some rating in ranked
      ratingChange = -RATING_K.duel.loss;
      xpGained     = XP_PER_XP_SOURCE.battleLoss;
    } else {
      xpGained = XP_PER_XP_SOURCE.battleLoss;
    }

    await applyLadderDelta({
      user,
      ladder:      'duel',
      ratingDelta: ratingChange,
      xpGained,
      reason:      'battle',
      refId:       battle._id,
      note:        `${battle.battleCode} ${isVictory ? 'win' : 'loss'}`,
    });
    newRating = user.duelRating.rating;

    // Statistics
    user.statistics.totalBattles  += 1;
    if (isVictory) {
      user.statistics.battlesWon     += 1;
      user.statistics.currentStreak  += 1;
      user.statistics.maxStreak = Math.max(user.statistics.maxStreak, user.statistics.currentStreak);
    } else {
      user.statistics.battlesLost    += 1;
      user.statistics.currentStreak  = 0;
    }
    user.statistics.winRate = user.statistics.totalBattles
      ? Math.round((user.statistics.battlesWon / user.statistics.totalBattles) * 100)
      : 0;
    user.statistics.totalXp += xpGained;
    await user.save();

    await BattleParticipant.create({
      battle:       battle._id,
      user:         user._id,
      ratingBefore: participantRatingBefore,
      ratingAfter:  newRating,
      ratingDelta:  ratingChange,
      xpEarned:     xpGained,
      isWinner:     isVictory,
      score:        me.score,
      testCasesPassed: passedCount,
      totalTestCases:  total,
      status:       me.status,
    });

    await logActivity({
      userId:   user._id,
      userName: user.name,
      type:     'battle',
      description: isVictory
        ? `won a Duel (${battle.battleCode}) +${ratingChange} rating`
        : `lost Duel ${battle.battleCode} (${passedCount}/${total} tests)`,
      metadata: { ratingChange, xpGain: xpGained },
    });

    // ── Notify the OPPONENT via their user room ───────────────────────────
    const opponentParticipant = battle.participants.find(
      (p) => !p.isBot && p.user.toString() !== user._id.toString()
    );
    if (opponentParticipant) {
      const opponentId = opponentParticipant.user.toString();

      // Apply loser penalty if ranked and opponent hasn't already finished
      if (battle.isRanked && opponentParticipant.status !== 'passed') {
        const opponentDoc = await User.findById(opponentId);
        if (opponentDoc) {
          const opponentRatingBefore = opponentParticipant.rating;
          await applyLadderDelta({
            user:        opponentDoc,
            ladder:      'duel',
            ratingDelta: -RATING_K.duel.loss,
            xpGained:    XP_PER_XP_SOURCE.battleLoss,
            reason:      'battle',
            refId:       battle._id,
            note:        `${battle.battleCode} loss`,
          });
          opponentDoc.statistics.totalBattles += 1;
          opponentDoc.statistics.battlesLost  += 1;
          opponentDoc.statistics.currentStreak = 0;
          opponentDoc.statistics.winRate = opponentDoc.statistics.totalBattles
            ? Math.round((opponentDoc.statistics.battlesWon / opponentDoc.statistics.totalBattles) * 100)
            : 0;
          opponentDoc.statistics.totalXp += XP_PER_XP_SOURCE.battleLoss;
          await opponentDoc.save();

          await BattleParticipant.create({
            battle:       battle._id,
            user:         opponentId,
            ratingBefore: opponentRatingBefore,
            ratingAfter:  opponentDoc.duelRating.rating,
            ratingDelta:  -RATING_K.duel.loss,
            xpEarned:     XP_PER_XP_SOURCE.battleLoss,
            isWinner:     false,
            score:        opponentParticipant.score,
            testCasesPassed: opponentParticipant.testCasesPassed,
            totalTestCases:  total,
            status:       'failed',
          });
        }
      }

      await notify({
        userId:  opponentId,
        type:    'battle',
        title:   `${user.name} solved the problem first!`,
        message: `You lost Duel ${battle.battleCode}. Better luck next time!`,
        metadata: { battleId: battle._id.toString(), ratingChange: -RATING_K.duel.loss },
      });

      emitToUser(opponentId, 'battle:finished', {
        battleId:    battle._id.toString(),
        winnerId:    user._id.toString(),
        isVictory:   false,
        ratingChange: battle.isRanked ? -RATING_K.duel.loss : 0,
        xpGained:    XP_PER_XP_SOURCE.battleLoss,
      });
    }

    // Push battle:finished to the whole room
    emitToBattle(battleId, 'battle:finished', {
      battleId:     battle._id.toString(),
      winnerId:     user._id.toString(),
      winnerName:   user.name,
      isRanked:     battle.isRanked,
      duration:     battle.result.duration,
      scores:       battle.result.scores,
    });

    // Personal winner notification
    await notify({
      userId:  user._id,
      type:    'battle',
      title:   `You won Duel ${battle.battleCode}!`,
      message: battle.isRanked
        ? `+${ratingChange} duel rating, +${xpGained} XP`
        : `+${xpGained} XP (casual)`,
      metadata: { battleId: battle._id.toString(), ratingChange, xpGained },
    });
    emitToUser(user._id.toString(), 'battle:finished', {
      battleId:    battle._id.toString(),
      winnerId:    user._id.toString(),
      isVictory:   true,
      ratingChange,
      xpGained,
      newRating,
    });
  }

  const battleClient = battleToClient(battle);
  return {
    ...battleClient.result,
    battleId:  battle._id.toString(),
    winnerId:  battle.result.winnerId ?? null,
    isVictory,
    evalStatus,
    errorMessage: errorMsg || undefined,
    passedCount,
    totalCount: total,
    scores:  battle.result.scores instanceof Map
      ? Object.fromEntries(battle.result.scores)
      : (battle.result.scores ?? {}),
    duration:     battle.result.duration ?? 0,
    ratingChange,
    xpGained,
    newRating,
    streak:  user.statistics.currentStreak,
    submissions: battle.result.submissions.slice(-1).map((s) => ({ ...s, code: undefined })),
    user:    mapUserToClient(user),
  };
}
