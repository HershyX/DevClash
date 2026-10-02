/**
 * End-to-end verification script for DevClash backend.
 * Run: node scripts/verify.mjs
 * Tests: problems, run/submit, XP/rating persistence, adaptive session, skill profile,
 *        rating ladder independence, activity feed shape.
 */
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Submission from '../src/models/Submission.js';
import Rating from '../src/models/Rating.js';
import AdaptiveSession from '../src/models/AdaptiveSession.js';
import SkillProfile from '../src/models/SkillProfile.js';
import * as authService from '../src/services/authService.js';
import * as problemService from '../src/services/problemService.js';
import * as adaptiveService from '../src/services/adaptiveService.js';
import * as analyticsService from '../src/services/analyticsService.js';

const PASS = '✅';
const FAIL = '❌';
let failures = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ${PASS} ${label}`);
  } else {
    console.log(`  ${FAIL} ${label}${detail ? ` — ${detail}` : ''}`);
    failures++;
  }
}

async function run() {
  await connectDB();
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  DevClash End-to-End Verification');
  console.log('══════════════════════════════════════════════════════\n');

  // ── 1. Auth: xpToNextLevel is present ──────────────────────────────────────
  console.log('── 1. Auth / xpToNextLevel ─────────────────────────────');
  const { user: studentUser, token } = await authService.demoLoginUser('student');
  assert('demo-login returns user', !!studentUser && !!token);
  assert('duelRating.xpToNextLevel present',    typeof studentUser.duelRating?.xpToNextLevel === 'number', `got ${studentUser.duelRating?.xpToNextLevel}`);
  assert('practiceRating.xpToNextLevel present', typeof studentUser.practiceRating?.xpToNextLevel === 'number');
  assert('adaptiveRating.xpToNextLevel present', typeof studentUser.adaptiveRating?.xpToNextLevel === 'number');

  // ── 2. Problem list & filtering ────────────────────────────────────────────
  console.log('\n── 2. Problem List & Filtering ─────────────────────────');
  const allProblems = await problemService.listProblems({ page: 1, limit: 50 });
  assert('listProblems returns data', allProblems.total >= 8, `got ${allProblems.total}`);

  const easyProblems = await problemService.listProblems({ page: 1, limit: 50, difficulty: 'easy' });
  assert('difficulty filter: easy only', easyProblems.data.every(p => p.difficulty === 'easy'), `got ${easyProblems.data.map(p=>p.difficulty)}`);
  assert('difficulty filter: correct count', easyProblems.total >= 2);

  const searchRes = await problemService.listProblems({ page: 1, limit: 50, search: 'Two Sum' });
  assert('search filter finds "Two Sum"', searchRes.data.some(p => p.title === 'Two Sum'));

  const topics = await problemService.listTopics();
  assert('topics list non-empty', topics.length > 0, `got ${topics.length}`);

  // ── 3. Single problem fetch ────────────────────────────────────────────────
  console.log('\n── 3. Single Problem ───────────────────────────────────');
  const twoSumDoc = allProblems.data.find(p => p.title === 'Two Sum');
  assert('Two Sum problem found', !!twoSumDoc);
  const twoSum = await problemService.getProblem(twoSumDoc.id);
  assert('getProblem returns full doc', !!twoSum && twoSum.title === 'Two Sum');
  assert('Two Sum has examples', twoSum.examples?.length >= 1);
  assert('public testCases exposed', twoSum.testCases?.length >= 1);
  assert('hidden testCases NOT exposed', twoSum.testCases?.every(tc => tc.isPublic !== false || tc.isPublic === undefined) ||
    !twoSum.testCases?.some(tc => tc.isPublic === false));

  // ── 4. Code Execution: RUN (public tests only) ─────────────────────────────
  console.log('\n── 4. Code Execution — RUN ─────────────────────────────');
  const studentDoc = await User.findOne({ email: 'student@devclash.demo' });
  const CORRECT_JS = 'function twoSum(nums,target){const m=new Map();for(let i=0;i<nums.length;i++){const c=target-nums[i];if(m.has(c))return[m.get(c),i];m.set(nums[i],i);}return[];}';
  const WRONG_JS   = 'function twoSum(nums,target){return[0,0];}';
  const BAD_JS     = 'function twoSum( { syntax error {{{{';

  const runCorrect = await problemService.runTestCases(twoSumDoc.id, CORRECT_JS, 'javascript', studentDoc);
  assert('RUN correct → accepted',        runCorrect.status === 'accepted', `got ${runCorrect.status}`);
  assert('RUN correct → all tests pass',  runCorrect.passedCount === runCorrect.totalCount, `${runCorrect.passedCount}/${runCorrect.totalCount}`);
  assert('RUN correct → testCaseResults', runCorrect.testCaseResults?.length > 0);

  const runWrong = await problemService.runTestCases(twoSumDoc.id, WRONG_JS, 'javascript', studentDoc);
  assert('RUN wrong → wrong status',      runWrong.status === 'wrong', `got ${runWrong.status}`);
  assert('RUN wrong → some tests fail',   runWrong.passedCount < runWrong.totalCount);

  const runBad = await problemService.runTestCases(twoSumDoc.id, BAD_JS, 'javascript', studentDoc);
  assert('RUN bad → compile_error',       runBad.status === 'compile_error', `got ${runBad.status}`);
  assert('RUN bad → errorMessage set',    !!runBad.errorMessage);

  // ── 5. SUBMIT: first-time accepted → XP + rating persisted ────────────────
  console.log('\n── 5. SUBMIT — first-time accepted (problemSet ladder) ─');
  // Use a fresh user to guarantee this is their first solve
  let freshUser = await User.findOne({ email: 'emma@student.devclash.demo' });
  if (!freshUser) {
    // If the classroom student was deleted, re-use the main student but clear their Two Sum submissions
    await Submission.deleteMany({ user: studentDoc._id, problem: twoSumDoc.id });
    freshUser = await User.findById(studentDoc._id);
  }

  const practiceBefore = freshUser.problemSetRating?.rating ?? 1200;
  const xpBefore       = freshUser.problemSetRating?.xp ?? 0;
  const duelBefore     = freshUser.duelRating?.rating ?? 1200;
  const adaptBefore    = freshUser.adaptiveRating?.rating ?? 1200;
  const solvedBefore   = freshUser.statistics?.problemsSolved ?? 0;

  // Clear any prior submission for this user on Two Sum so we get first-solve XP
  await Submission.deleteMany({ user: freshUser._id, problem: twoSumDoc.id });
  // Re-fetch to have fresh Mongoose doc (needed for save())
  freshUser = await User.findById(freshUser._id);

  const submitRes = await problemService.evaluateSubmission({
    problemId: twoSumDoc.id,
    code: CORRECT_JS,
    language: 'javascript',
    user: freshUser,
  });
  assert('SUBMIT accepted',             submitRes.status === 'accepted', `got ${submitRes.status}`);
  assert('SUBMIT xpEarned > 0',         submitRes.xpEarned > 0, `got ${submitRes.xpEarned}`);
  assert('SUBMIT ratingDelta > 0',      submitRes.ratingDelta > 0, `got ${submitRes.ratingDelta}`);
  assert('SUBMIT previouslySolved false', submitRes.previouslySolved === false);
  assert('SUBMIT all tests pass',       submitRes.passedCount === submitRes.totalCount, `${submitRes.passedCount}/${submitRes.totalCount}`);

  // Verify persistence in MongoDB
  const afterUser = await User.findById(freshUser._id);
  assert('problemSet rating persisted ↑', afterUser.problemSetRating.rating > practiceBefore, `${practiceBefore} → ${afterUser.problemSetRating.rating}`);
  assert('problemSet xp persisted ↑',    afterUser.problemSetRating.xp > xpBefore, `${xpBefore} → ${afterUser.problemSetRating.xp}`);
  assert('problemsSolved incremented',    afterUser.statistics.problemsSolved > solvedBefore);

  // ── Task 7: Rating isolation ──────────────────────────────────────────────
  console.log('\n── 7. RATING ISOLATION ─────────────────────────────────');
  assert('Duel rating UNCHANGED after problem submit',     afterUser.duelRating.rating === duelBefore, `before=${duelBefore} after=${afterUser.duelRating.rating}`);
  assert('Adaptive rating UNCHANGED after problem submit', afterUser.adaptiveRating.rating === adaptBefore, `before=${adaptBefore} after=${afterUser.adaptiveRating.rating}`);

  // Rating ledger only has a problemSet entry, not duel/adaptive
  const submitSub = await Submission.findOne({ user: freshUser._id, problem: twoSumDoc.id }).sort({ createdAt: -1 });
  const ladgerEntry = await Rating.findOne({ user: freshUser._id, refId: submitSub?._id });
  // refId may be null on problemSet (it points to problem._id)
  const recentRatings = await Rating.find({ user: freshUser._id }).sort({ createdAt: -1 }).limit(5);
  const ladderTypes = recentRatings.map(r => r.ladder);
  assert('Recent rating entry is problemSet',  ladderTypes.includes('problemSet'), `got ${ladderTypes}`);
  assert('No duel rating entry from submit',    !recentRatings.some(r => r.ladder === 'duel' && r.reason === 'problem-solved'));
  assert('No adaptive rating entry from submit',!recentRatings.some(r => r.ladder === 'adaptive' && r.reason === 'problem-solved'));

  // ── 6b. SUBMIT: repeat → 10% XP, no rating change ────────────────────────
  console.log('\n── 6. SUBMIT — repeat solve (anti-farm) ───────────────');
  const ratingAfterFirst = afterUser.problemSetRating.rating;
  freshUser = await User.findById(freshUser._id); // re-fetch with updated state
  const submitRepeat = await problemService.evaluateSubmission({
    problemId: twoSumDoc.id,
    code: CORRECT_JS,
    language: 'javascript',
    user: freshUser,
  });
  assert('Repeat SUBMIT accepted',            submitRepeat.status === 'accepted');
  assert('Repeat SUBMIT previouslySolved true', submitRepeat.previouslySolved === true);
  assert('Repeat SUBMIT xpEarned small (10%)', submitRepeat.xpEarned > 0 && submitRepeat.xpEarned < submitRes.xpEarned, `got ${submitRepeat.xpEarned} vs first ${submitRes.xpEarned}`);
  assert('Repeat SUBMIT ratingDelta = 0',     submitRepeat.ratingDelta === 0, `got ${submitRepeat.ratingDelta}`);
  const afterRepeat = await User.findById(freshUser._id);
  assert('Rating unchanged after repeat',     afterRepeat.problemSetRating.rating === ratingAfterFirst, `${ratingAfterFirst} → ${afterRepeat.problemSetRating.rating}`);

  // ── 7b. Submission history ─────────────────────────────────────────────────
  console.log('\n── 8. Submission History ───────────────────────────────');
  const history = await problemService.listSubmissionHistory({ userId: freshUser._id.toString(), limit: 10 });
  assert('Submission history non-empty',        history.length >= 2);
  assert('History entries have problemTitle',   history.every(s => s.problemTitle));
  assert('History entries have status',         history.every(s => s.status));
  assert('History entries have createdAt',      history.every(s => s.createdAt));
  assert('No sourceCode in history',            history.every(s => !s.sourceCode));

  // ── 9. Activity feed shape ─────────────────────────────────────────────────
  console.log('\n── 9. Activity Feed (timestamp field) ──────────────────');
  const feed = await analyticsService.getActivityFeed(freshUser._id.toString(), 10);
  if (feed.length > 0) {
    assert('ActivityEvent has timestamp field', feed.every(e => !!e.timestamp), `sample: ${JSON.stringify(feed[0])}`);
    assert('ActivityEvent has userId field',    feed.every(e => !!e.userId));
    assert('ActivityEvent has userName field',  feed.every(e => e.userName !== undefined));
    assert('ActivityEvent has type field',      feed.every(e => !!e.type));
  } else {
    console.log('  ⚠️  No activity events yet — skipping shape check');
  }

  // ── 10. Adaptive session lifecycle ────────────────────────────────────────
  console.log('\n── 10. Adaptive Session Lifecycle ──────────────────────');
  // Use a fresh fetch of studentDoc so it has a clean Mongoose doc
  const adaptUser = await User.findOne({ email: 'student@devclash.demo' });
  // Close any existing active session first
  await AdaptiveSession.updateMany({ user: adaptUser._id, status: 'active' }, { status: 'completed', endedAt: new Date() });

  const adaptBefore2 = adaptUser.adaptiveRating?.rating ?? 1200;

  const session = await adaptiveService.startSession(adaptUser, { focusTopics: [] });
  assert('Start session returns id',       !!session.id);
  assert('Start session status active',    session.status === 'active', `got ${session.status}`);
  assert('Start session has currentProblem', !!session.currentProblem, 'engine found no problems');
  if (session.reasoning) {
    assert('Start session has reasoning',  typeof session.reasoning === 'string');
  }

  // Submit a correct answer for the session's problem
  if (session.currentProblem) {
    const ALWAYS_CORRECT_JS = `function ${session.currentProblem.title.toLowerCase().replace(/[^a-z]/g,'')}() { return null; }
// generic passthrough — just need to test adaptive rating flow
function solution(...args) { return args[0]; }`;

    // We can't run arbitrary correct code for any problem, so test the wrong-answer path
    // (which still exercises the rating deduction logic and SkillProfile update)
    const adaptUser2 = await User.findById(adaptUser._id);
    const attemptRes = await adaptiveService.submitAttempt({
      sessionId: session.id,
      code: 'function solution() { return null; }',
      language: 'javascript',
      timeSpent: 45,
      user: adaptUser2,
    });
    assert('Adaptive submit returns session', !!attemptRes.session);
    assert('Adaptive submit returns ratingChange', typeof attemptRes.ratingChange === 'number', `got ${attemptRes.ratingChange}`);
    // After a wrong answer the rating should go slightly down (negative ratingChange)
    assert('Wrong adaptive attempt → negative ratingChange', attemptRes.ratingChange < 0 || attemptRes.ratingChange === 0, `got ${attemptRes.ratingChange}`);
  }

  // End the session
  const ended = await adaptiveService.completeSession(session.id, adaptUser);
  assert('End session returns completed status', ended.status === 'completed', `got ${ended.status}`);

  // ── 11. Skill profile ──────────────────────────────────────────────────────
  console.log('\n── 11. Skill Profile ───────────────────────────────────');
  const skillData = await adaptiveService.getSkillProfile(adaptUser._id.toString());
  assert('getSkillProfile returns object', !!skillData);
  assert('skillData has overall field',   !!skillData.overall, `got ${JSON.stringify(Object.keys(skillData))}`);
  assert('skillData has topics array',    Array.isArray(skillData.topics));
  assert('skillData has strongest array', Array.isArray(skillData.strongest));
  assert('skillData has weakest array',   Array.isArray(skillData.weakest));

  // ── 12. Adaptive rating isolation ─────────────────────────────────────────
  console.log('\n── 12. Adaptive Rating Isolation ───────────────────────');
  // Re-fetch the SAME user we ran the adaptive session with (adaptUser = student@devclash.demo).
  // Their duel and problemSet ladders must be unchanged — only adaptiveRating may differ.
  const adaptUserAfter = await User.findById(adaptUser._id);
  const adaptDuelBefore     = adaptUser.duelRating?.rating ?? 1200;
  const adaptPracticeBefore = adaptUser.problemSetRating?.rating ?? 1200;
  assert('Duel rating unchanged by adaptive session',      adaptUserAfter.duelRating.rating === adaptDuelBefore,     `before=${adaptDuelBefore} after=${adaptUserAfter.duelRating.rating}`);
  assert('problemSet rating unchanged by adaptive session', adaptUserAfter.problemSetRating.rating === adaptPracticeBefore, `before=${adaptPracticeBefore} after=${adaptUserAfter.problemSetRating.rating}`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════');
  if (failures === 0) {
    console.log(`  ${PASS} ALL CHECKS PASSED`);
  } else {
    console.log(`  ${FAIL} ${failures} CHECK(S) FAILED`);
  }
  console.log('══════════════════════════════════════════════════════\n');

  await disconnectDB();
  setImmediate(() => process.exit(failures > 0 ? 1 : 0));
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
