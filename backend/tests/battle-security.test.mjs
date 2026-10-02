/**
 * Battle Security Tests
 * ────────────────────────────────────────────────────────────────────────────
 * Verifies that the server enforces all battle rules server-side:
 *  - Users cannot join someone else's battle as a different user
 *  - Already-completed battles cannot be resubmitted
 *  - Non-participants cannot submit code
 *  - Bot user IDs do not resolve to real users
 *  - Source code is never stored in the battle result submissions
 *  - Casual battles do not affect rating
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Battle from '../src/models/Battle.js';
import * as battleService from '../src/services/battleService.js';

beforeAll(async () => { await connectDB(); });
afterAll(async ()  => { await disconnectDB(); });

async function freshUser(email) {
  const u = await User.findOne({ email });
  if (!u) throw new Error(`User not found: ${email}`);
  return u;
}

describe('Battle Security', () => {

  describe('Join validation', () => {
    it('rejects joining a non-existent battle code', async () => {
      const user = await freshUser('student@devclash.demo');
      await expect(
        battleService.joinCustomBattle({ battleCode: 'DC-XXXXX', user })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('rejects joining a battle the user already created', async () => {
      const user    = await freshUser('student@devclash.demo');
      const battle  = await battleService.createCustomBattle({ isRanked: false, user });
      await expect(
        battleService.joinCustomBattle({ battleCode: battle.battleCode, user })
      ).rejects.toMatchObject({ statusCode: 409 });
      // Cleanup
      await Battle.deleteOne({ _id: battle.id });
    });

    it('rejects joining a full (already active) battle', async () => {
      const student  = await freshUser('student@devclash.demo');
      const personal = await freshUser('personal@devclash.demo');
      const extra    = await freshUser('emma@student.devclash.demo');

      const battle = await battleService.createCustomBattle({ isRanked: false, user: student });
      await battleService.joinCustomBattle({ battleCode: battle.battleCode, user: personal });

      await expect(
        battleService.joinCustomBattle({ battleCode: battle.battleCode, user: extra })
      ).rejects.toMatchObject({ statusCode: 409 });

      await Battle.deleteOne({ _id: battle.id });
    });
  });

  describe('Submission authorization', () => {
    it('rejects submission from a non-participant', async () => {
      const creator = await freshUser('student@devclash.demo');
      const joiner  = await freshUser('personal@devclash.demo');
      const third   = await freshUser('emma@student.devclash.demo');

      const created = await battleService.createCustomBattle({ isRanked: false, user: creator });
      await battleService.joinCustomBattle({ battleCode: created.battleCode, user: joiner });

      await expect(
        battleService.submitBattleCode({ battleId: created.id, code: 'function x(){}', language: 'javascript', user: third })
      ).rejects.toMatchObject({ statusCode: 403 });

      await Battle.deleteOne({ _id: created.id });
    });

    it('rejects submission on a completed battle', async () => {
      const student  = await freshUser('student@devclash.demo');
      const personal = await freshUser('personal@devclash.demo');

      const created = await battleService.createCustomBattle({ isRanked: false, user: student });
      await battleService.joinCustomBattle({ battleCode: created.battleCode, user: personal });

      // Force-complete via DB
      await Battle.findByIdAndUpdate(created.id, { status: 'completed' });

      const fresh = await User.findById(student._id);
      await expect(
        battleService.submitBattleCode({ battleId: created.id, code: '// code', language: 'javascript', user: fresh })
      ).rejects.toMatchObject({ statusCode: 409 });

      await Battle.deleteOne({ _id: created.id });
    });
  });

  describe('Bot safety', () => {
    it('quick match bot userId does not resolve to a real user', async () => {
      const user = await freshUser('student@devclash.demo');
      const qm   = await battleService.findQuickMatch({ isRanked: false, user });

      const bot = qm.participants.find((p) => p.isBot);
      expect(bot).toBeTruthy();
      expect(bot.userId).not.toBe(user._id?.toString());

      const botUser = await User.findById(bot.userId).catch(() => null);
      expect(botUser).toBeNull();

      await Battle.deleteOne({ _id: qm.id });
    });
  });

  describe('Casual battle rating isolation', () => {
    it('casual battle does not change any rating', async () => {
      const student  = await freshUser('david@student.devclash.demo');
      const personal = await freshUser('personal@devclash.demo');

      const duelBefore     = student.duelRating?.rating     ?? 1200;
      const practiceBefore = student.problemSetRating?.rating ?? 1200;
      const adaptBefore    = student.adaptiveRating?.rating  ?? 1200;

      const created = await battleService.createCustomBattle({ isRanked: false, user: student });
      await battleService.joinCustomBattle({ battleCode: created.battleCode, user: personal });

      const freshDoc = await User.findById(student._id);
      // Submit wrong code — casual, so 0 rating change even on correct
      const res = await battleService.submitBattleCode({
        battleId: created.id,
        code:     'function wrongAnswer(){return [];}',
        language: 'javascript',
        user:     freshDoc,
      });

      expect(res.ratingChange).toBe(0);

      const after = await User.findById(student._id);
      expect(after.duelRating.rating).toBe(duelBefore);
      expect(after.problemSetRating.rating).toBe(practiceBefore);
      expect(after.adaptiveRating.rating).toBe(adaptBefore);

      await Battle.deleteOne({ _id: created.id });
    });
  });

  describe('Source code security', () => {
    it('submission response does not include user source code', async () => {
      const student  = await freshUser('student@devclash.demo');
      const personal = await freshUser('personal@devclash.demo');

      const created = await battleService.createCustomBattle({ isRanked: false, user: student });
      await battleService.joinCustomBattle({ battleCode: created.battleCode, user: personal });

      const freshDoc = await User.findById(student._id);
      const SECRET_CODE = '// SECRET-CODE-SHOULD-NOT-LEAK';
      const res = await battleService.submitBattleCode({
        battleId: created.id,
        code:     SECRET_CODE,
        language: 'javascript',
        user:     freshDoc,
      });

      // The response should NOT contain the source code
      const responseStr = JSON.stringify(res);
      expect(responseStr).not.toContain(SECRET_CODE);

      // Verify the Battle document also doesn't store the code
      const battleDoc = await Battle.findById(created.id).lean();
      const submissionsStr = JSON.stringify(battleDoc?.result?.submissions ?? []);
      expect(submissionsStr).not.toContain(SECRET_CODE);

      await Battle.deleteOne({ _id: created.id });
    });
  });
});
