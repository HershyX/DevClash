/**
 * Focused adaptive verification:
 *  1. a FRESH session returns real engine reasoning (not the resume fallback)
 *  2. an actual adaptive solve raises ONLY the adaptive ladder
 *  3. duel + problemSet ratings remain untouched
 * Run: node scripts/verify-adaptive-solve.mjs
 */
const API = process.env.API_URL || 'http://localhost:3001/api';

function assert(cond, label) {
  if (cond) { console.log(`  ✅ ${label}`); return true; }
  console.log(`  ❌ ${label}`); process.exitCode = 1; return false;
}

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* 204 */ }
  return { status: res.status, json };
}

// Reference solutions (mirror of the seed data) keyed by problem slug.
const SOLUTIONS = {
  'two-sum': 'function twoSum(nums, target) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const c = target - nums[i]; if (map.has(c)) return [map.get(c), i]; map.set(nums[i], i); } return []; }',
  'valid-parentheses': 'function isValid(s) { const stack = []; const map = { ")": "(", "}": "{", "]": "[" }; for (const ch of s) { if (ch in map) { if (stack.pop() !== map[ch]) return false; } else stack.push(ch); } return stack.length === 0; }',
  'longest-substring-without-repeating-characters': 'function lengthOfLongestSubstring(s) { let maxLen = 0, left = 0; const seen = new Map(); for (let right = 0; right < s.length; right++) { if (seen.has(s[right])) left = Math.max(left, seen.get(s[right]) + 1); seen.set(s[right], right); maxLen = Math.max(maxLen, right - left + 1); } return maxLen; }',
  'merge-intervals': 'function merge(intervals) { if (!intervals.length) return []; intervals.sort((a, b) => a[0] - b[0]); const out = [intervals[0]]; for (let i = 1; i < intervals.length; i++) { const last = out[out.length - 1]; if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]); else out.push(intervals[i]); } return out; }',
  'coin-change': 'function coinChange(coins, amount) { const dp = new Array(amount + 1).fill(Infinity); dp[0] = 0; for (let i = 1; i <= amount; i++) for (const c of coins) if (i >= c) dp[i] = Math.min(dp[i], dp[i - c] + 1); return dp[amount] === Infinity ? -1 : dp[amount]; }',
  'course-schedule': 'function canFinish(n, pre) { const indeg = new Array(n).fill(0); const adj = Array.from({ length: n }, () => []); for (const [a, b] of pre) { adj[b].push(a); indeg[a]++; } const q = []; for (let i = 0; i < n; i++) if (!indeg[i]) q.push(i); let c = 0; while (q.length) { const node = q.shift(); c++; for (const nx of adj[node]) if (--indeg[nx] === 0) q.push(nx); } return c === n; }',
  'median-of-two-sorted-arrays': 'function findMedianSortedArrays(a, b) { const m = a.length, n = b.length; if (m > n) return findMedianSortedArrays(b, a); const total = m + n, half = Math.floor((total + 1) / 2); let lo = 0, hi = m; while (lo <= hi) { const i = Math.floor((lo + hi) / 2), j = half - i; const L1 = i === 0 ? -Infinity : a[i - 1], R1 = i === m ? Infinity : a[i]; const L2 = j === 0 ? -Infinity : b[j - 1], R2 = j === n ? Infinity : b[j]; if (L1 <= R2 && L2 <= R1) { if (total % 2) return Math.max(L1, L2); return (Math.max(L1, L2) + Math.min(R1, R2)) / 2; } else if (L1 > R2) hi = i - 1; else lo = i + 1; } return 0; }',
  'validate-binary-search-tree': 'function isValidBST(root) { function validate(node, min, max) { if (!node) return true; if (node.val <= min || node.val >= max) return false; return validate(node.left, min, node.val) && validate(node.right, node.val, max); } return validate(root, -Infinity, Infinity); }',
};

console.log('\n== Setup: fresh session ==\n');
const login = await api('POST', '/auth/demo-login', { body: { role: 'student' } });
const tok = login.json?.data?.token;

// End any active sessions so the next start is genuinely fresh.
const sessions = await api('GET', '/adaptive/sessions', { token: tok });
for (const s of sessions.json?.data ?? []) {
  if (s.status === 'active') await api('POST', `/adaptive/session/${s.id}/complete`, { token: tok });
}

const before = login.json?.data?.user;
const duel0 = before.duelRating.rating;
const practice0 = before.practiceRating.rating;
const adaptive0 = before.adaptiveRating.rating;
console.log(`     Baselines — duel:${duel0} practice:${practice0} adaptive:${adaptive0}`);

const start = await api('POST', '/adaptive/session', { token: tok, body: {} });
const session = start.json?.data;
assert(start.status === 201 && session?.id, `fresh session started (${session?.id})`);
const reasoning = session?.reasoning ?? '';
assert(
  !!reasoning && !reasoning.startsWith('Resumed session'),
  `real engine reasoning: "${reasoning.slice(0, 90)}"`
);
assert(!!session?.currentProblem, `recommended: "${session?.currentProblem?.title}" (${session?.currentProblem?.difficulty})`);

console.log('\n== Adaptive solve ==\n');
const slug = session?.currentProblem?.slug;
const solution = SOLUTIONS[slug];
if (!solution) {
  console.log(`  ⚠️ no reference solution for slug "${slug}" — solve check skipped`);
} else {
  const submit = await api('POST', `/adaptive/session/${session.id}/submit`, {
    token: tok,
    body: { code: solution, language: 'javascript', timeSpent: 120 },
  });
  assert(submit.json?.data?.evalStatus === 'accepted', `adaptive submit accepted (${submit.json?.data?.passedCount}/${submit.json?.data?.totalCount} tests)`);

  const after = await api('GET', '/auth/me', { token: tok });
  const u = after.json?.data?.user;
  assert(u.adaptiveRating.rating > adaptive0, `ADAPTIVE rating increased (${adaptive0} -> ${u.adaptiveRating.rating})`);
  assert(u.duelRating.rating === duel0, `DUEL rating untouched (${duel0})`);
  assert(u.practiceRating.rating === practice0, `PROBLEM SET rating untouched (${practice0})`);

  // Next recommendation should account for the solve (no crash, new problem staged)
  const next = await api('POST', `/adaptive/session/${session.id}/next`, { token: tok });
  assert(next.status === 200, `next recommendation works (${next.json?.data?.currentProblem?.title ?? 'session complete'})`);

  const complete = await api('POST', `/adaptive/session/${session.id}/complete`, { token: tok });
  assert(complete.status === 200 && complete.json?.data?.status === 'completed', 'session completes cleanly');

  const skill = await api('GET', '/adaptive/skill-profile', { token: tok });
  const solvedTopics = skill.json?.data?.topics?.filter((t) => t.solved > 0) ?? [];
  assert(solvedTopics.length > 0, `skill profile records the solve (${solvedTopics.map((t) => `${t.topic}: ${t.solved} solved`).join(', ')})`);
}

console.log('\n==============================');
console.log(process.exitCode === 1 ? '❌ SOME CHECKS FAILED' : '✅ ALL CHECKS PASSED');
console.log('==============================\n');
