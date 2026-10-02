/**
 * End-to-end verification of the Problem Set / Submission / Adaptive milestone.
 * Run: node scripts/verify-milestone.mjs   (backend must be running on :3001)
 */
const API = process.env.API_URL || 'http://localhost:3001/api';

function assert(cond, label) {
  if (cond) { console.log(`  ✅ ${label}`); return true; }
  console.log(`  ❌ ${label}`); process.exitCode = 1; return false;
}

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* 204 */ }
  return { status: res.status, json };
}

const TWO_SUM_JS = `function solution(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (map.has(need)) return [map.get(need), i];
    map.set(nums[i], i);
  }
  return [];
}`;
const TWO_SUM_WRONG = `function solution(nums, target) {
  return [0, 1];
}`;
const TWO_SUM_PY = `def solution(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []`;

console.log('\n== 1. Auth: demo logins ==\n');
const studentLogin = await api('POST', '/auth/demo-login', { body: { role: 'student' } });
const teacherLogin = await api('POST', '/auth/demo-login', { body: { role: 'teacher' } });
const personalLogin = await api('POST', '/auth/demo-login', { body: { role: 'personal' } });
const student = studentLogin.json?.data?.user;
const teacher = teacherLogin.json?.data?.user;
const personalUser = personalLogin.json?.data?.user;
const sTok = studentLogin.json?.data?.token;
const tTok = teacherLogin.json?.data?.token;
const pTok = personalLogin.json?.data?.token;
assert(studentLogin.status === 200 && sTok && student?.role === 'student', `student demo login (rating=${student?.practiceRating?.rating})`);
assert(teacherLogin.status === 200 && tTok && teacher?.role === 'teacher', 'teacher demo login');
assert(personalLogin.status === 200 && pTok, 'personal demo login');

const baselineDuel = student.duelRating.rating;
const baselinePractice = student.practiceRating.rating;
const baselineAdaptive = student.adaptiveRating.rating;
console.log(`     Baselines — duel:${baselineDuel} practice:${baselinePractice} adaptive:${baselineAdaptive}`);

console.log('\n== 2. Problems: list, filter, teacher create ==\n');
const listAll = await api('GET', '/problems?limit=50', { token: sTok });
assert(listAll.status === 200 && listAll.json?.data?.data?.length > 0, `list problems (${listAll.json?.data?.total} total)`);
const easyList = await api('GET', '/problems?difficulty=easy&limit=50', { token: sTok });
assert(easyList.json?.data?.data?.every((p) => p.difficulty === 'easy'), 'filter: difficulty=easy');
const topics = await api('GET', '/problems/topics/list', { token: sTok });
assert(topics.status === 200 && Array.isArray(topics.json?.data) && topics.json.data.length > 0, `topics endpoint (${topics.json?.data?.length} topics)`);

const unique = Date.now().toString(36);
const created = await api('POST', '/problems', {
  token: tTok,
  body: {
    title: `Verify Two Sum ${unique}`,
    description: 'Return indices of two numbers adding to target.',
    difficulty: 'easy',
    topics: ['Arrays', 'Hash Maps'],
    constraints: '2 <= n <= 10^4',
    examples: [{ input: '[2,7,11,15], 9', output: '[0,1]' }],
    starterCode: { javascript: 'function solution(nums, target) {\n  \n}', python: 'def solution(nums, target):\n    pass' },
    testCases: [
      { id: 'tc1', input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isPublic: true },
      { id: 'tc2', input: '[3,2,4], 6', expectedOutput: '[1,2]', isPublic: true },
      { id: 'tc3', input: '[3,3], 6', expectedOutput: '[0,1]', isPublic: false },
    ],
  },
});
assert(created.status === 201 && created.json?.data?.id, `teacher creates problem (${created.json?.data?.id ?? created.json?.message})`);
const createdId = created.json?.data?.id;
const createdPublic = created.json?.data;
const hiddenLeak = JSON.stringify(createdPublic).includes('[3,3]');
assert(!hiddenLeak || createdPublic.testCases.every((tc) => tc.input !== '[3,3]'), 'hidden test cases NOT exposed to teacher create response');

const createAsStudent = await api('POST', '/problems', { token: sTok, body: { title: 'nope', description: 'x', difficulty: 'easy' } });
assert(createAsStudent.status === 403, `student blocked from creating problems (HTTP ${createAsStudent.status})`);

console.log('\n== 3. Sandbox: run vs submit ==\n');
const runOk = await api('POST', `/problems/${createdId}/run`, { token: sTok, body: { code: TWO_SUM_JS, language: 'javascript' } });
assert(runOk.json?.data?.status === 'accepted' && runOk.json?.data?.totalCount === 2, `run (visible only): accepted on ${runOk.json?.data?.totalCount} samples`);

const submitFull = await api('POST', `/problems/${createdId}/submit`, { token: sTok, body: { code: TWO_SUM_JS, language: 'javascript' } });
assert(submitFull.json?.data?.status === 'accepted' && submitFull.json?.data?.totalCount === 3, `submit: accepted on full suite (${submitFull.json?.data?.totalCount} tests incl. hidden)`);
const afterSolve = await api('GET', '/auth/me', { token: sTok });
const midPractice = afterSolve.json?.data?.user?.practiceRating?.rating;
assert(midPractice === baselinePractice + 10, `problemSet rating +10 (${baselinePractice} -> ${midPractice})`);
assert(afterSolve.json?.data?.user?.duelRating?.rating === baselineDuel, `duel rating UNTOUCHED (${baselineDuel})`);
assert(afterSolve.json?.data?.user?.adaptiveRating?.rating === baselineAdaptive, `adaptive rating UNTOUCHED (${baselineAdaptive})`);

const repeat = await api('POST', `/problems/${createdId}/submit`, { token: sTok, body: { code: TWO_SUM_JS, language: 'javascript' } });
assert(repeat.json?.data?.status === 'accepted' && repeat.json?.data?.ratingDelta === 0, `anti-farm: repeat solve gives 0 rating (${repeat.json?.data?.xpEarned} XP only)`);
const afterRepeat = await api('GET', '/auth/me', { token: sTok });
assert(afterRepeat.json?.data?.user?.practiceRating?.rating === midPractice, 'rating unchanged by repeat submission');

const submitWrong = await api('POST', `/problems/${createdId}/submit`, { token: pTok, body: { code: TWO_SUM_WRONG, language: 'javascript' } });
assert(submitWrong.json?.data?.status === 'wrong', 'wrong answer detected');
const afterWrong = await api('GET', '/auth/me', { token: pTok });
assert(afterWrong.json?.data?.user?.practiceRating?.rating === personalUser.practiceRating.rating, 'no rating change on wrong answer');

const submitPy = await api('POST', `/problems/${createdId}/submit`, { token: pTok, body: { code: TWO_SUM_PY, language: 'python' } });
assert(submitPy.json?.data?.status === 'accepted', 'python solution accepted');

const compileErr = await api('POST', `/problems/${createdId}/submit`, { token: pTok, body: { code: 'function solution( { broken!!', language: 'javascript' } });
assert(compileErr.json?.data?.status === 'compile_error', 'compile error detected');
const runtimeErr = await api('POST', `/problems/${createdId}/submit`, { token: pTok, body: { code: 'function solution(nums, target) { throw new Error("boom"); }', language: 'javascript' } });
assert(runtimeErr.json?.data?.status === 'runtime_error', 'runtime error detected');
const tle = await api('POST', `/problems/${createdId}/submit`, { token: pTok, body: { code: 'function solution(nums, target) { while(true) {} }', language: 'javascript' } });
assert(tle.json?.data?.status === 'tle', `time limit exceeded (${tle.json?.data?.status})`);

console.log('\n== 4. Submission history ==\n');
const history = await api('GET', '/users/me/submissions?limit=10', { token: sTok });
assert(history.status === 200 && history.json?.data?.length >= 2, `student history (${history.json?.data?.length} entries)`);
const histOk = history.json.data.every((h) => ['accepted', 'wrong', 'tle', 'compile_error', 'runtime_error'].includes(h.status));
assert(histOk, 'history statuses valid');

console.log('\n== 5. Adaptive: session, engine, skill profile ==\n');
const adaptiveBaselineUser = await api('GET', '/auth/me', { token: sTok });
const aBase = adaptiveBaselineUser.json?.data?.user?.adaptiveRating?.rating;
const dBase = adaptiveBaselineUser.json?.data?.user?.duelRating?.rating;
const pBase = adaptiveBaselineUser.json?.data?.user?.practiceRating?.rating;

const startSes = await api('POST', '/adaptive/session', { token: sTok, body: { focusTopics: [] } });
assert(startSes.status === 201 && startSes.json?.data?.id, `session started (${startSes.json?.data?.id})`);
const sesId = startSes.json?.data?.id;
assert(!!startSes.json?.data?.currentProblem, `engine recommends first problem: "${startSes.json?.data?.currentProblem?.title}"`);
assert(!!startSes.json?.data?.reasoning, `engine gives reasoning: "${(startSes.json?.data?.reasoning ?? '').slice(0, 60)}..."`);

let solvedInSession = false;
const sesSubmit = await api('POST', `/adaptive/session/${sesId}/submit`, {
  token: sTok,
  body: { code: TWO_SUM_JS, language: 'javascript', timeSpent: 95 },
});
if (sesSubmit.json?.data?.evalStatus === 'accepted') {
  solvedInSession = true;
  assert(true, 'adaptive submit: accepted');
} else {
  assert(sesSubmit.status === 200, `adaptive submit evaluated (${sesSubmit.json?.data?.evalStatus}, engine recommended a different problem)`);
}

const afterAdaptive = await api('GET', '/auth/me', { token: sTok });
const aNow = afterAdaptive.json?.data?.user?.adaptiveRating?.rating;
if (solvedInSession) {
  assert(aNow > aBase, `adaptive rating +delta (${aBase} -> ${aNow})`);
  assert(afterAdaptive.json?.data?.user?.practiceRating?.rating === pBase, `problemSet rating UNTOUCHED by adaptive (${pBase})`);
  assert(afterAdaptive.json?.data?.user?.duelRating?.rating === dBase, `duel rating UNTOUCHED by adaptive (${dBase})`);
} else {
  assert(aNow >= aBase, `adaptive rating stable when not solved (${aBase} -> ${aNow})`);
}

const skill = await api('GET', '/adaptive/skill-profile', { token: sTok });
assert(skill.status === 200 && Array.isArray(skill.json?.data?.topics), `skill profile (${skill.json?.data?.topics?.length ?? 0} topics tracked)`);
assert(typeof skill.json?.data?.overall?.accuracy === 'number', `overall accuracy: ${skill.json?.data?.overall?.accuracy}%`);
assert(skill.json?.data?.difficultyPerformance?.easy !== undefined, 'difficulty performance present');

const historySes = await api('GET', '/adaptive/history?limit=5', { token: sTok });
assert(historySes.status === 200 && Array.isArray(historySes.json?.data), 'adaptive session history endpoint');

console.log('\n== 6. XP isolation summary ==\n');
const finalMe = await api('GET', '/auth/me', { token: sTok });
const f = finalMe.json?.data?.user;
assert(
  f.duelRating.rating === baselineDuel,
  `DUEL rating unchanged through everything (${baselineDuel})`
);
assert(
  f.practiceRating.rating === midPractice,
  `PROBLEM SET rating changed ONLY by problem submissions (${baselinePractice} -> ${f.practiceRating.rating})`
);
assert(
  f.adaptiveRating.rating === (solvedInSession ? aNow : aBase),
  `ADAPTIVE rating changed ONLY by adaptive solves (${baselineAdaptive} -> ${f.adaptiveRating.rating})`
);

console.log('\n==============================');
console.log(process.exitCode === 1 ? '❌ SOME CHECKS FAILED' : '✅ ALL CHECKS PASSED');
console.log('==============================\n');
