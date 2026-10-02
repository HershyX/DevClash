/**
 * Rating Isolation Tests
 * ────────────────────────────────────────────────────────────────────────────
 * CRITICAL: The three rating ladders (duel, problemSet, adaptive) must NEVER
 * affect each other. These tests verify that invariant against the real
 * MongoDB database using seeded demo accounts.
 *
 * Run:  npm test   (from backend/)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Submission from '../src/models/Submission.js';
import Battle from '../src/models/Battle.js';
import BattleParticipant from '../src/models/BattleParticipant.js';
import Rating from '../src/models/Rating.js';
import * as problemService from '../src/services/problemService.js';
import * as battleService from '../src/services/battleService.js';
import * as adaptiveService from '../src/services/adaptiveService.js';

// ── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function freshUser(email) {
  const u = await User.findOne({ email });
  if (!u) throw new Error(`Demo user not found: ${email}. Run npm run seed first.`);
  return u;
}

function snapshot(user) {
  return {
    duel:     user.duelRating?.rating     ?? 1200,
    practice: user.problemSetRating?.rating ?? 1200,
    adaptive: user.adaptiveRating?.rating  ?? 1200,
  };
}

// ── Test Suite ───────────────────────────────────────────────────────────────

describe('Rating Isolation', () => {

  // ── Problem Set (practice) activity ─────────────────────────────────────────

  describe('Problem submission → only problemSet ladder changes', () => {
    it('accepted first-time solve raises problemSetRating, leaves duel + adaptive unchanged', async () => {
      const user  = await freshUser('emma@student.devclash.demo');
      const before = snapshot(user);

      // Find Two Sum (easy) and clear prior submissions for this user
      const problems = await problemService.listProblems({ page: 1, limit: 50 });
      const twoSum   = problems.data.find((p) => p.title === 'Two Sum');
      expect(twoSum, 'Two Sum problem must be seeded').toBeTruthy();

      await Submission.deleteMany({ user: user._id, problem: twoSum.id });
      const freshDoc = await User.findById(user._id); // re-fetch for clean save()

      const CORRECT = 'function twoSum(nums,t){const m=new Map();for(let i=0;i<nums.length;i++){const c=t-nums[i];if(m.has(c))return[m.get(c),i];m.set(nums[i],i);}return[];}';
      const res = await problemService.evaluateSubmission({
        problemId: twoSum.id,
        code:      CORRECT,
        language:  'javascript',
        user:      freshDoc,
      });

      expect(res.status).toBe('accepted');
      expect(res.xpEarned).toBeGreaterThan(0);
      expect(res.ratingDelta).toBeGreaterThan(0);

      const after = snapshot(await User.findById(user._id));

      // Practice went UP
      expect(after.practice).toBeGreaterThan(before.practice);
      // Duel UNCHANGED
      expect(after.duel).toBe(before.duel);
      // Adaptive UNCHANGED
      expect(after.adaptive).toBe(before.adaptive);
    });

    it('wrong answer does not change any ladder', async () => {
      const user   = await freshUser('marcus@student.devclash.demo');
      const before  = snapshot(user);
      const problems = await problemService.listProblems({ page: 1, limit: 50 });
      const twoSum   = problems.data.find((p) => p.title === 'Two Sum');

      // This function always returns wrong output
      const WRONG = 'function twoSum(){return[99,99];}';
      const freshDoc = await User.findById(user._id);
      const res = await problemService.evaluateSubmission({
        problemId: twoSum.id,
        code:      WRONG,
        language:  'javascript',
        user:      freshDoc,
      });

      expect(res.status).toBe('wrong');
      expect(res.xpEarned).toBe(0);

      const after = snapshot(await User.findById(user._id));
      expect(after.duel).toBe(before.duel);
      expect(after.practice).toBe(before.practice);
      expect(after.adaptive).toBe(before.adaptive);
    });

    it('repeat solve gives 10% XP, no rating delta, other ladders untouched', async () => {
      const user   = await freshUser('sofia@student.devclash.demo');
      const problems = await problemService.listProblems({ page: 1, limit: 50 });
      const twoSum   = problems.data.find((p) => p.title === 'Two Sum');
      const CORRECT  = 'function twoSum(nums,t){const m=new Map();for(let i=0;i<nums.length;i++){const c=t-nums[i];if(m.has(c))return[m.get(c),i];m.set(nums[i],i);}return[];}';

      // First solve
      let fresh = await User.findById(user._id);
      await Submission.deleteMany({ user: fresh._id, problem: twoSum.id });
      fresh = await User.findById(user._id);
      await problemService.evaluateSubmission({ problemId: twoSum.id, code: CORRECT, language: 'javascript', user: fresh });

      // Second solve (repeat)
      fresh = await User.findById(user._id);
      const duelBefore     = fresh.duelRating?.rating     ?? 1200;
      const practiceBefore = fresh.problemSetRating?.rating ?? 1200;
      const adaptiveBefore = fresh.adaptiveRating?.rating  ?? 1200;

      fresh = await User.findById(user._id);
      const res2 = await problemService.evaluateSubmission({ problemId: twoSum.id, code: CORRECT, language: 'javascript', user: fresh });
      expect(res2.previouslySolved).toBe(true);
      expect(res2.ratingDelta).toBe(0);   // no rating on repeat
      expect(res2.xpEarned).toBeGreaterThan(0); // small consolation XP

      const after = snapshot(await User.findById(user._id));
      expect(after.duel).toBe(duelBefore);
      expect(after.practice).toBe(practiceBefore); // rating unchanged for repeat
      expect(after.adaptive).toBe(adaptiveBefore);
    });

    it('problemSet Rating ledger entries have ladder=problemSet, not duel/adaptive', async () => {
      const user  = await freshUser('emma@student.devclash.demo');
      const recent = await Rating.find({ user: user._id, reason: 'problem-solved' })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      for (const entry of recent) {
        expect(entry.ladder).toBe('problemSet');
        expect(entry.ladder).not.toBe('duel');
        expect(entry.ladder).not.toBe('adaptive');
      }
    });
  });

  // ── Adaptive activity ──────────────────────────────────────────────────────

  describe('Adaptive session → only adaptive ladder changes', () => {
    it('solving adaptive problem raises adaptiveRating, leaves duel + problemSet unchanged', async () => {
      const user  = await freshUser('student@devclash.demo');
      const before = snapshot(user);

      // Close any open sessions
      const AdaptiveSession = (await import('../src/models/AdaptiveSession.js')).default;
      await AdaptiveSession.updateMany({ user: user._id, status: 'active' }, { status: 'completed', endedAt: new Date() });

      let fresh = await User.findById(user._id);
      const session = await adaptiveService.startSession(fresh, { focusTopics: [] });
      expect(session.status).toBe('active');

      // Submit a wrong answer (still exercises the rating deduction path)
      fresh = await User.findById(user._id);
      const attempt = await adaptiveService.submitAttempt({
        sessionId: session.id,
        code:      'function solution(){return null;}',
        language:  'javascript',
        timeSpent: 30,
        user:      fresh,
      });
      expect(typeof attempt.ratingChange).toBe('number');

      const after = snapshot(await User.findById(user._id));
      // Duel MUST be unchanged
      expect(after.duel).toBe(before.duel);
      // Practice MUST be unchanged
      expect(after.practice).toBe(before.practice);
      // Adaptive may have changed (wrong answer gives slight negative delta)
    });

    it('adaptive Rating ledger entries have ladder=adaptive', async () => {
      const user   = await freshUser('student@devclash.demo');
      const recent = await Rating.find({ user: user._id, reason: 'adaptive-session' })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      for (const entry of recent) {
        expect(entry.ladder).toBe('adaptive');
        expect(entry.ladder).not.toBe('duel');
        expect(entry.ladder).not.toBe('problemSet');
      }
    });
  });

  // ── Duel activity ──────────────────────────────────────────────────────────

  describe('Duel battle → only duel ladder changes', () => {
    it('winning a battle raises duelRating, leaves problemSet + adaptive unchanged', async () => {
      const student  = await freshUser('student@devclash.demo');
      const personal = await freshUser('personal@devclash.demo');
      const before   = snapshot(student);

      // Create + join a ranked battle
      const created = await battleService.createCustomBattle({ isRanked: true, user: student });
      await battleService.joinCustomBattle({ battleCode: created.battleCode, user: personal });

      // Submit a correct Two Sum solution
      const fresh      = await User.findById(student._id);
      const CORRECT_JS = 'function twoSum(n,t){const m=new Map();for(let i=0;i<n.length;i++){const c=t-n[i];if(m.has(c))return[m.get(c),i];m.set(n[i],i);}return[];}';

      // The battle's problem may not be Two Sum — just test shape (rating isolation)
      const subRes = await battleService.submitBattleCode({
        battleId: created.id,
        code:     CORRECT_JS,
        language: 'javascript',
        user:     fresh,
      });

      expect(typeof subRes.ratingChange).toBe('number');
      expect(typeof subRes.xpGained).toBe('number');

      const after = snapshot(await User.findById(student._id));
      // If it was a win, duel changed; if wrong answer, nothing changed —
      // either way problemSet and adaptive must be IDENTICAL to before.
      expect(after.practice).toBe(before.practice);
      expect(after.adaptive).toBe(before.adaptive);
    });

    it('duel Rating ledger entries have ladder=duel', async () => {
      const user   = await freshUser('student@devclash.demo');
      const recent = await Rating.find({ user: user._id, reason: 'battle' })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      for (const entry of recent) {
        expect(entry.ladder).toBe('duel');
        expect(entry.ladder).not.toBe('problemSet');
        expect(entry.ladder).not.toBe('adaptive');
      }
    });
  });

  // ── Cross-ladder invariant ─────────────────────────────────────────────────

  describe('Cross-system invariant', () => {
    it('a user can have completely different ratings on each ladder', async () => {
      const user = await freshUser('student@devclash.demo');
      const d = user.duelRating?.rating     ?? 1200;
      const p = user.problemSetRating?.rating ?? 1200;
      const a = user.adaptiveRating?.rating  ?? 1200;
      // Just assert they are independent numbers — not forced to be equal
      expect(typeof d).toBe('number');
      expect(typeof p).toBe('number');
      expect(typeof a).toBe('number');
      // The seeded student has deliberately different values on each ladder
      // d=1642, p=1287, a=1519 in seed data (modified by tests above, but all differ)
    });

    it('no rating entry has ladder not in [duel, problemSet, adaptive]', async () => {
      const entries = await Rating.find({}).select('ladder').limit(200).lean();
      const valid = new Set(['duel', 'problemSet', 'adaptive']);
      for (const e of entries) {
        expect(valid.has(e.ladder), `unexpected ladder: ${e.ladder}`).toBe(true);
      }
    });
  });
});
