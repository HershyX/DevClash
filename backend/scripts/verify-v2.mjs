/**
 * End-to-end verification for Duel, Classroom, Analytics, Leaderboard, Notifications.
 * Run: node scripts/verify-v2.mjs
 */
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Battle from '../src/models/Battle.js';
import BattleParticipant from '../src/models/BattleParticipant.js';
import Rating from '../src/models/Rating.js';
import Notification from '../src/models/Notification.js';
import Classroom from '../src/models/Classroom.js';
import ClassroomMembership from '../src/models/ClassroomMembership.js';
import * as battleService from '../src/services/battleService.js';
import * as analyticsService from '../src/services/analyticsService.js';
import * as classroomService from '../src/services/classroomService.js';
import * as notificationService from '../src/services/notificationService.js';
import { notify } from '../src/services/activityService.js';

const PASS = '✅', FAIL = '❌';
let failures = 0;
function assert(label, cond, detail = '') {
  if (cond) { console.log(`  ${PASS} ${label}`); }
  else       { console.log(`  ${FAIL} ${label}${detail ? ' — ' + detail : ''}`); failures++; }
}

async function run() {
  await connectDB();
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  DevClash V2 Verification — Duels, Classrooms, Analytics');
  console.log('══════════════════════════════════════════════════════════\n');

  // ── 1. Battle creation ──────────────────────────────────────────────────────
  console.log('── 1. Battle Creation ──────────────────────────────────────');
  const student  = await User.findOne({ email: 'student@devclash.demo' });
  const personal = await User.findOne({ email: 'personal@devclash.demo' });
  assert('Demo users exist', !!student && !!personal);

  const created = await battleService.createCustomBattle({ isRanked: true, user: student });
  assert('createCustomBattle returns id',         !!created.id);
  assert('createCustomBattle returns battleCode', /^DC-/.test(created.battleCode ?? ''), `got ${created.battleCode}`);
  assert('Battle status is waiting',              created.status === 'waiting',           `got ${created.status}`);
  assert('Battle has 1 participant',              created.participants.length === 1);
  assert('Battle has a problem',                  !!created.problem);

  // ── 2. Join by code ─────────────────────────────────────────────────────────
  console.log('\n── 2. Join Battle by Code ───────────────────────────────────');
  const joined = await battleService.joinCustomBattle({ battleCode: created.battleCode, user: personal });
  assert('joinCustomBattle returns id',        joined.id === created.id);
  assert('Battle status becomes active',       joined.status === 'active',    `got ${joined.status}`);
  assert('Battle has 2 participants',          joined.participants.length === 2);

  // ── 3. Invalid join codes ────────────────────────────────────────────────────
  console.log('\n── 3. Invalid Join Code Handling ────────────────────────────');
  try {
    await battleService.joinCustomBattle({ battleCode: 'INVALID-CODE', user: student });
    assert('Invalid code throws 404', false, 'No error thrown');
  } catch (e) { assert('Invalid code throws 404', e.statusCode === 404, `got ${e.statusCode}`); }

  try {
    await battleService.joinCustomBattle({ battleCode: created.battleCode, user: personal });
    assert('Already started throws 409', false, 'No error thrown');
  } catch (e) { assert('Already started throws 409', e.statusCode === 409, `got ${e.statusCode}`); }

  try {
    await battleService.joinCustomBattle({ battleCode: created.battleCode, user: student });
    assert('Already in battle throws 409', false, 'No error thrown');
  } catch (e) { assert('Already in battle throws 409', e.statusCode === 409, `got ${e.statusCode}`); }

  // ── 4. Bot userId is stable fake ID (not real user) ──────────────────────────
  console.log('\n── 4. Quick Match Bot Safety ────────────────────────────────');
  const qm = await battleService.findQuickMatch({ isRanked: true, user: student });
  assert('Quick match is active',     qm.status === 'active', `got ${qm.status}`);
  assert('Quick match has 2 participants', qm.participants.length === 2);
  const bot = qm.participants.find(p => p.isBot);
  assert('Bot participant flagged isBot', !!bot);
  assert('Bot userId is NOT student userId', bot?.userId !== student._id.toString(),
    `bot.userId=${bot?.userId} student=${student._id}`);
  // Verify bot ID doesn't correspond to a real User in MongoDB
  const botUser = await User.findById(bot?.userId).catch(() => null);
  assert('Bot userId does not resolve to a real User', !botUser);

  // ── 5. Battle submission with real sandbox ────────────────────────────────────
  console.log('\n── 5. Battle Submission (real sandbox) ─────────────────────');
  const battleDoc = await Battle.findById(joined.id).populate('problem');
  assert('Battle found in DB',      !!battleDoc);
  assert('Battle problem populated', !!battleDoc?.problem?.title);

  // Use a fresh fetch for the user doc (needs to be a full Mongoose doc for save())
  const freshStudent  = await User.findById(student._id);
  const duelBefore    = freshStudent.duelRating?.rating ?? 1200;
  const practBefore   = freshStudent.problemSetRating?.rating ?? 1200;
  const adaptBefore   = freshStudent.adaptiveRating?.rating ?? 1200;

  const CORRECT_TWO_SUM = 'function twoSum(nums,target){const m=new Map();for(let i=0;i<nums.length;i++){const c=target-nums[i];if(m.has(c))return[m.get(c),i];m.set(nums[i],i);}return[];}';
  const submitRes = await battleService.submitBattleCode({
    battleId:  joined.id,
    code:      CORRECT_TWO_SUM,
    language:  'javascript',
    user:      freshStudent,
  });

  assert('Submit returns evalStatus',  typeof submitRes.evalStatus === 'string', `got ${submitRes.evalStatus}`);
  // Two Sum may or may not be the battle problem — just check the response shape
  assert('Submit returns passedCount', typeof submitRes.passedCount === 'number');
  assert('Submit returns totalCount',  typeof submitRes.totalCount  === 'number');
  assert('Submit returns ratingChange', typeof submitRes.ratingChange === 'number');
  assert('Submit returns xpGained',    typeof submitRes.xpGained    === 'number');
  assert('Submit returns user object', !!submitRes.user);
  assert('Submit does NOT include source code', !submitRes.submissions?.[0]?.code,
    `code field: ${submitRes.submissions?.[0]?.code}`);

  // If it was a victory, duel rating should have changed
  if (submitRes.evalStatus === 'accepted') {
    const afterStudent = await User.findById(student._id);
    assert('Duel rating updated after battle win', afterStudent.duelRating.rating !== duelBefore,
      `before=${duelBefore} after=${afterStudent.duelRating.rating}`);
    assert('problemSet rating UNCHANGED after duel', afterStudent.problemSetRating.rating === practBefore,
      `before=${practBefore} after=${afterStudent.problemSetRating.rating}`);
    assert('adaptive rating UNCHANGED after duel',   afterStudent.adaptiveRating.rating  === adaptBefore,
      `before=${adaptBefore} after=${afterStudent.adaptiveRating.rating}`);

    // Duel rating entry in ledger
    const ratingEntries = await Rating.find({ user: student._id, reason: 'battle' }).sort({ createdAt: -1 }).limit(3);
    assert('Rating ledger has battle entry', ratingEntries.some(r => r.ladder === 'duel'));
    assert('No problemSet entry from battle', !ratingEntries.some(r => r.ladder === 'problemSet' && r.reason === 'battle'));

    // BattleParticipant record created
    const bp = await BattleParticipant.findOne({ battle: joined.id, user: student._id });
    assert('BattleParticipant record created', !!bp);
    assert('BattleParticipant.isWinner = true', bp?.isWinner === true);
  } else {
    console.log(`  ⚠️  Two Sum not the battle problem (got ${battleDoc.problem.title}) — skipping victory assertions`);
  }

  // ── 6. Notifications created on battle completion ─────────────────────────────
  console.log('\n── 6. Notifications ─────────────────────────────────────────');
  if (submitRes.evalStatus === 'accepted') {
    const winnerNotif = await Notification.findOne({ user: student._id, type: 'battle' }).sort({ createdAt: -1 });
    assert('Winner notification created',  !!winnerNotif,    `none found`);
    assert('Winner notif title non-empty', !!winnerNotif?.title);

    const loserNotif  = await Notification.findOne({ user: personal._id, type: 'battle' }).sort({ createdAt: -1 });
    assert('Loser notification created',   !!loserNotif, `none found`);
  }

  // Manual notification creation
  await notify({ userId: student._id, type: 'system', title: 'Test', message: 'Verify test' });
  const count = await notificationService.getUnreadCount(student._id.toString());
  assert('Notification count > 0', count >= 1, `got ${count}`);

  const notifList = await notificationService.listNotifications(student._id.toString(), { limit: 5 });
  assert('Notification list has id',        notifList.every(n => n.id));
  assert('Notification list has timestamp', notifList.every(n => n.createdAt));

  await notificationService.markRead(student._id.toString());
  const afterCount = await notificationService.getUnreadCount(student._id.toString());
  assert('markRead clears unread count', afterCount === 0, `got ${afterCount}`);

  // ── 7. Leaderboards ──────────────────────────────────────────────────────────
  console.log('\n── 7. Leaderboards ──────────────────────────────────────────');
  const duelLB = await analyticsService.getLeaderboard({ ladder: 'duel', limit: 10 });
  assert('Duel leaderboard non-empty', duelLB.length > 0, `got ${duelLB.length}`);
  assert('Leaderboard entries have rank', duelLB.every(e => typeof e.rank === 'number'));
  assert('Leaderboard entries have rating', duelLB.every(e => typeof e.rating === 'number'));
  assert('Leaderboard sorted descending', duelLB[0].rating >= duelLB[duelLB.length - 1].rating);

  const practiceLB = await analyticsService.getLeaderboard({ ladder: 'problemSet', limit: 10 });
  assert('Practice leaderboard non-empty', practiceLB.length > 0);

  const adaptiveLB = await analyticsService.getLeaderboard({ ladder: 'adaptive', limit: 10 });
  assert('Adaptive leaderboard non-empty', adaptiveLB.length > 0);

  // Leaderboards are independent — same user can have different rank on each
  const duelRank    = await analyticsService.getUserRank(student._id.toString(), 'duel');
  const practiceRank = await analyticsService.getUserRank(student._id.toString(), 'problemSet');
  const adaptiveRank = await analyticsService.getUserRank(student._id.toString(), 'adaptive');
  assert('Duel rank is a number',     typeof duelRank    === 'number', `got ${duelRank}`);
  assert('Practice rank is a number', typeof practiceRank === 'number', `got ${practiceRank}`);
  assert('Adaptive rank is a number', typeof adaptiveRank === 'number', `got ${adaptiveRank}`);

  // ── 8. Teacher Analytics (totalClassrooms) ────────────────────────────────────
  console.log('\n── 8. Teacher Analytics ─────────────────────────────────────');
  const teacher = await User.findOne({ email: 'teacher@devclash.demo' });
  const teacherAnalytics = await analyticsService.getTeacherAnalytics(teacher._id.toString());
  assert('teacherAnalytics.totalClassrooms present', typeof teacherAnalytics.totalClassrooms === 'number', `got ${teacherAnalytics.totalClassrooms}`);
  assert('teacherAnalytics.totalStudents present',   typeof teacherAnalytics.totalStudents   === 'number');
  assert('teacherAnalytics.topStudents is array',    Array.isArray(teacherAnalytics.topStudents));
  assert('teacherAnalytics.recentActivity is array', Array.isArray(teacherAnalytics.recentActivity));
  if (teacherAnalytics.recentActivity.length > 0) {
    assert('Activity has timestamp field', !!teacherAnalytics.recentActivity[0].timestamp);
    assert('Activity has userId field',    !!teacherAnalytics.recentActivity[0].userId);
  }

  // ── 9. Classroom: listAllStudents ─────────────────────────────────────────────
  console.log('\n── 9. Classroom listAllStudents ─────────────────────────────');
  const allStudents = await classroomService.listAllStudents(teacher._id.toString());
  assert('listAllStudents returns array', Array.isArray(allStudents));
  assert('Students have classroom field',   allStudents.every(s => typeof s.classroom === 'string'), `first: ${JSON.stringify(allStudents[0])}`);
  assert('Students have classroomId field', allStudents.every(s => typeof s.classroomId === 'string'));
  assert('Students have duelRating field',  allStudents.every(s => typeof s.duelRating === 'number'));
  assert('Student count > 0', allStudents.length > 0, `got ${allStudents.length}`);
  console.log(`  ℹ️  ${allStudents.length} student(s) across all teacher classrooms`);

  // ── 10. Teacher cannot access other teacher's classroom ───────────────────────
  console.log('\n── 10. Classroom Authorization ──────────────────────────────');
  // Create a fresh classroom not owned by the seeded teacher
  const [cls] = await Classroom.find({ teacher: teacher._id }).limit(1).lean();
  assert('Seeded classroom exists', !!cls);

  // listAllStudents for a random user returns empty (no classrooms)
  const freshUser = await User.findOne({ email: 'emma@student.devclash.demo' });
  if (freshUser) {
    const otherStudents = await classroomService.listAllStudents(freshUser._id.toString());
    assert('Non-teacher gets no students', otherStudents.length === 0, `got ${otherStudents.length}`);
  }

  // getClassroom by ID throws for wrong teacher
  try {
    await classroomService.getClassroom(cls._id.toString(), freshUser?._id.toString() ?? '000000000000000000000000');
    assert('Wrong teacher gets 404', false, 'No error thrown');
  } catch (e) { assert('Wrong teacher gets 404', e.statusCode === 404, `got ${e.statusCode} ${e.message}`); }

  // ── 11. GET /api/classrooms/students (via HTTP) ───────────────────────────────
  console.log('\n── 11. Classroom students endpoint (HTTP) ───────────────────');
  const teacherLogin = await (await import('../src/services/authService.js')).demoLoginUser('teacher');
  const teacherToken = teacherLogin.token;

  const studentsResp = await fetch('http://localhost:3001/api/classrooms/students', {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  assert('/classrooms/students returns 200', studentsResp.ok, `status=${studentsResp.status}`);
  const studentsJson = await studentsResp.json();
  assert('Response has success:true', studentsJson.success === true);
  assert('Response has data array',   Array.isArray(studentsJson.data));

  // Student cannot access teacher endpoint
  const studentLogin = await (await import('../src/services/authService.js')).demoLoginUser('student');
  const studentToken = studentLogin.token;
  const forbidResp = await fetch('http://localhost:3001/api/classrooms/students', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert('Student gets 403 on /classrooms/students', forbidResp.status === 403, `got ${forbidResp.status}`);

  // ── 12. Battle history endpoint (HTTP) ────────────────────────────────────────
  console.log('\n── 12. Battle History (HTTP) ────────────────────────────────');
  const battlesResp = await fetch('http://localhost:3001/api/battles', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert('/api/battles returns 200', battlesResp.ok, `status=${battlesResp.status}`);
  const battlesJson = await battlesResp.json();
  assert('Battles response is array', Array.isArray(battlesJson.data));

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════');
  if (failures === 0) {
    console.log(`  ${PASS} ALL CHECKS PASSED`);
  } else {
    console.log(`  ${FAIL} ${failures} CHECK(S) FAILED`);
  }
  console.log('══════════════════════════════════════════════════════════\n');

  await disconnectDB();
  // Use setImmediate to let libuv drain pending handles before exiting (Windows compat)
  setImmediate(() => process.exit(failures > 0 ? 1 : 0));
}

run().catch((err) => { console.error('Fatal:', err); process.exit(1); });
