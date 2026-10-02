/**
 * Database seed script.
 * Creates demo users (Student / Teacher / Personal), realistic problems,
 * classrooms with members, and enough historical activity for dashboards.
 *
 * Run:  npm run seed   (inside backend/)
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../src/config/db.js';

import User from '../src/models/User.js';
import Problem from '../src/models/Problem.js';
import Submission from '../src/models/Submission.js';
import Battle from '../src/models/Battle.js';
import BattleParticipant from '../src/models/BattleParticipant.js';
import AdaptiveSession from '../src/models/AdaptiveSession.js';
import Classroom from '../src/models/Classroom.js';
import ClassroomMembership from '../src/models/ClassroomMembership.js';
import Rating from '../src/models/Rating.js';
import ActivityEvent from '../src/models/ActivityEvent.js';
import Notification from '../src/models/Notification.js';
import { getLevelFromXP, getXPToNextLevel } from '../src/utils/ladder.js';

const DEMO_PASSWORD = 'demo1234';

const DEMO_USERS = [
  { name: 'Alex Johnson', email: 'student@devclash.demo', role: 'student' },
  { name: 'Dr. Sarah Williams', email: 'teacher@devclash.demo', role: 'teacher' },
  { name: 'Jordan Lee', email: 'personal@devclash.demo', role: 'personal' },
];

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const DEFAULT_XP = { easy: 50, medium: 120, hard: 200 };

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const PROBLEMS = [
  {
    title: 'Two Sum',
    difficulty: 'easy',
    tags: ['Arrays', 'Hash Maps'],
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].' },
    ],
    hints: [
      'A brute force approach checks all pairs in O(n^2) time. Can we do better using extra memory?',
      'Consider using a hash map to store the numbers you have seen so far and their indices.',
      'For each element x, check if (target - x) exists in the hash map.',
    ],
    starterCode: {
      javascript: 'function twoSum(nums, target) {\n  // Your code here\n}',
      python: 'def twoSum(nums, target):\n    # Your code here',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n    }\n}',
    },
    testCases: [
      { id: 'tc-1', input: '[2, 7, 11, 15], 9', expectedOutput: '[0,1]', isPublic: true },
      { id: 'tc-2', input: '[3, 2, 4], 6', expectedOutput: '[1,2]', isPublic: true },
      { id: 'tc-3', input: '[3, 3], 6', expectedOutput: '[0,1]', isPublic: true },
      { id: 'tc-4', input: '[1, 5, 8, 3], 9', expectedOutput: '[0,2]', isPublic: false },
      { id: 'tc-5', input: '[-1, -2, -3, -4, -5], -8', expectedOutput: '[2,4]', isPublic: false },
    ],
  },
  {
    title: 'Valid Parentheses',
    difficulty: 'easy',
    tags: ['Strings', 'Stack'],
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.",
    constraints: "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.",
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    hints: [
      'Think about using a Stack LIFO data structure.',
      'Push open brackets onto the stack. When you encounter a closing bracket, verify the top matches.',
      'Check if the stack is completely empty at the end.',
    ],
    starterCode: {
      javascript: 'function isValid(s) {\n  // Your code here\n}',
      python: 'def isValid(s):\n    # Your code here',
      java: 'class Solution {\n    public boolean isValid(String s) {\n        // Your code here\n    }\n}',
    },
    testCases: [
      { id: 'tc-1', input: '"()"', expectedOutput: 'true', isPublic: true },
      { id: 'tc-2', input: '"()[]{}"', expectedOutput: 'true', isPublic: true },
      { id: 'tc-3', input: '"(]"', expectedOutput: 'false', isPublic: true },
      { id: 'tc-4', input: '"([)]"', expectedOutput: 'false', isPublic: false },
      { id: 'tc-5', input: '"{[]}"', expectedOutput: 'true', isPublic: false },
    ],
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'medium',
    tags: ['Strings', 'Hash Maps', 'Sliding Window'],
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: '3', explanation: 'The answer is "wke", with the length of 3.' },
    ],
    hints: [
      'Use a sliding window defined by two pointers [left, right].',
      'Store the last seen index of each character in a map to slide the left pointer forward.',
    ],
    starterCode: {
      javascript: 'function lengthOfLongestSubstring(s) {\n  // Your code here\n}',
      python: 'def lengthOfLongestSubstring(s):\n    # Your code here',
      java: 'class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Your code here\n    }\n}',
    },
    testCases: [
      { id: 'tc-1', input: '"abcabcbb"', expectedOutput: '3', isPublic: true },
      { id: 'tc-2', input: '"bbbbb"', expectedOutput: '1', isPublic: true },
      { id: 'tc-3', input: '"pwwkew"', expectedOutput: '3', isPublic: true },
      { id: 'tc-4', input: '""', expectedOutput: '0', isPublic: false },
      { id: 'tc-5', input: '"dvdf"', expectedOutput: '3', isPublic: false },
    ],
  },
  {
    title: 'Merge Intervals',
    difficulty: 'medium',
    tags: ['Arrays', 'Sorting'],
    description:
      'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    constraints: '1 <= intervals.length <= 10^4\nintervals[i].length == 2\n0 <= start_i <= end_i <= 10^4',
    examples: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: 'Since intervals [1,3] and [2,6] overlap, merge them into [1,6].' },
      { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]', explanation: 'Intervals [1,4] and [4,5] are considered overlapping.' },
    ],
    hints: [
      'Sort the intervals by their start times first.',
      'Iterate through the sorted intervals. If the current interval overlaps with the previous merged interval, merge them by updating the end time.',
    ],
    starterCode: {
      javascript: 'function merge(intervals) {\n  // Your code here\n}',
      python: 'def merge(intervals):\n    # Your code here',
      java: 'class Solution {\n    public int[][] merge(int[][] intervals) {\n        // Your code here\n    }\n}',
    },
    testCases: [
      { id: 'tc-1', input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]', isPublic: true },
      { id: 'tc-2', input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]', isPublic: true },
      { id: 'tc-3', input: '[[1,4],[0,4]]', expectedOutput: '[[0,4]]', isPublic: false },
      { id: 'tc-4', input: '[[1,4],[2,3]]', expectedOutput: '[[1,4]]', isPublic: false },
      { id: 'tc-5', input: '[[6,8]]', expectedOutput: '[[6,8]]', isPublic: false },
    ],
  },
  {
    title: 'Coin Change',
    difficulty: 'medium',
    tags: ['Dynamic Programming'],
    description:
      'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.',
    constraints: '1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4',
    examples: [
      { input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1' },
      { input: 'coins = [2], amount = 3', output: '-1' },
      { input: 'coins = [1], amount = 0', output: '0' },
    ],
    hints: [
      'Define dp[i] as the minimum coins needed for amount i.',
      'dp[i] = min(dp[i - c] + 1) for all c in coins where i >= c.',
    ],
    starterCode: {
      javascript: 'function coinChange(coins, amount) {\n  // Your code here\n}',
      python: 'def coinChange(coins, amount):\n    # Your code here',
      java: 'class Solution {\n    public int coinChange(int[] coins, int amount) {\n        // Your code here\n    }\n}',
    },
    testCases: [
      { id: 'tc-1', input: '[1,2,5], 11', expectedOutput: '3', isPublic: true },
      { id: 'tc-2', input: '[2], 3', expectedOutput: '-1', isPublic: true },
      { id: 'tc-3', input: '[1], 0', expectedOutput: '0', isPublic: true },
      { id: 'tc-4', input: '[1,3,4,5], 7', expectedOutput: '2', isPublic: false },
      { id: 'tc-5', input: '[186,419,83,408], 6249', expectedOutput: '20', isPublic: false },
    ],
  },
  {
    title: 'Course Schedule',
    difficulty: 'medium',
    tags: ['Graphs'],
    description:
      'There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [a_i, b_i] indicates that you must take course b_i first if you want to take course a_i.\n\nReturn true if you can finish all courses. Otherwise, return false.',
    constraints: '1 <= numCourses <= 2000\n0 <= prerequisites.length <= 5000',
    examples: [
      { input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true', explanation: 'Take course 0 first, then course 1.' },
      { input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]', output: 'false', explanation: 'A cycle exists, so it is impossible.' },
    ],
    hints: [
      'This is equivalent to detecting whether a cycle exists in a directed graph.',
      "Use Kahn's algorithm (topological sort with in-degrees) or DFS with visited states.",
    ],
    starterCode: {
      javascript: 'function canFinish(numCourses, prerequisites) {\n  // Your code here\n}',
      python: 'def canFinish(numCourses, prerequisites):\n    # Your code here',
      java: 'class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        // Your code here\n    }\n}',
    },
    testCases: [
      { id: 'tc-1', input: '2, [[1,0]]', expectedOutput: 'true', isPublic: true },
      { id: 'tc-2', input: '2, [[1,0],[0,1]]', expectedOutput: 'false', isPublic: true },
      { id: 'tc-3', input: '4, [[1,0],[2,0],[3,1],[3,2]]', expectedOutput: 'true', isPublic: false },
      { id: 'tc-4', input: '3, [[0,1],[1,2],[2,0]]', expectedOutput: 'false', isPublic: false },
      { id: 'tc-5', input: '1, []', expectedOutput: 'true', isPublic: false },
    ],
  },
  {
    title: 'Median of Two Sorted Arrays',
    difficulty: 'hard',
    tags: ['Arrays', 'Binary Search'],
    description: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays in O(log (m+n)) runtime.',
    constraints: 'nums1.length == m\nnums2.length == n\n0 <= m, n <= 1000\n1 <= m + n <= 2000',
    examples: [
      { input: 'nums1 = [1,3], nums2 = [2]', output: '2.00000', explanation: 'merged array = [1,2,3] and median is 2.' },
      { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.50000', explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.' },
    ],
    hints: [
      'To achieve O(log(m+n)), binary search across the smaller array.',
      'Partition both arrays such that left halves contain (m + n + 1) / 2 elements and maxLeft <= minRight.',
    ],
    starterCode: {
      javascript: 'function findMedianSortedArrays(nums1, nums2) {\n  // Your code here\n}',
      python: 'def findMedianSortedArrays(nums1, nums2):\n    # Your code here',
      java: 'class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        // Your code here\n    }\n}',
    },
    testCases: [
      { id: 'tc-1', input: '[1, 3], [2]', expectedOutput: '2', isPublic: true },
      { id: 'tc-2', input: '[1, 2], [3, 4]', expectedOutput: '2.5', isPublic: true },
      { id: 'tc-3', input: '[0, 0], [0, 0]', expectedOutput: '0', isPublic: false },
      { id: 'tc-4', input: '[2], []', expectedOutput: '2', isPublic: false },
    ],
  },
  {
    title: 'Validate Binary Search Tree',
    difficulty: 'medium',
    tags: ['Trees', 'Recursion'],
    description:
      "Given the root of a binary tree, determine if it is a valid binary search tree (BST).\n\nA valid BST: the left subtree contains only keys less than the node's key, the right subtree only keys greater, and both subtrees are themselves valid BSTs.",
    constraints: 'The number of nodes in the tree is in the range [1, 10^4].',
    examples: [
      { input: 'root = [2,1,3]', output: 'true' },
      { input: 'root = [5,1,4,null,null,3,6]', output: 'false', explanation: "The root's value is 5 but its right child's value is 4." },
    ],
    hints: [
      'Can you pass a valid range [min, max] down through recursive calls?',
      'Alternatively, perform an in-order traversal; the values should strictly increase.',
    ],
    starterCode: {
      javascript: 'function isValidBST(root) {\n  // Your code here\n}',
      python: 'def isValidBST(root):\n    # Your code here',
      java: 'class Solution {\n    public boolean isValidBST(TreeNode root) {\n        // Your code here\n    }\n}',
    },
    testCases: [
      { id: 'tc-1', input: '{"val":2,"left":{"val":1},"right":{"val":3}}', expectedOutput: 'true', isPublic: true },
      { id: 'tc-2', input: '{"val":5,"left":{"val":1},"right":{"val":4,"left":{"val":3},"right":{"val":6}}}', expectedOutput: 'false', isPublic: true },
    ],
  },
];

// Reference solutions used to generate accepted submissions in seed data
const REFERENCE_SOLUTIONS = {
  'two-sum': 'function twoSum(nums, target) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const c = target - nums[i]; if (map.has(c)) return [map.get(c), i]; map.set(nums[i], i); } return []; }',
  'valid-parentheses': 'function isValid(s) { const stack = []; const map = { ")": "(", "}": "{", "]": "[" }; for (const ch of s) { if (ch in map) { if (stack.pop() !== map[ch]) return false; } else stack.push(ch); } return stack.length === 0; }',
  'longest-substring-without-repeating-characters': 'function lengthOfLongestSubstring(s) { let maxLen = 0, left = 0; const seen = new Map(); for (let right = 0; right < s.length; right++) { if (seen.has(s[right])) left = Math.max(left, seen.get(s[right]) + 1); seen.set(s[right], right); maxLen = Math.max(maxLen, right - left + 1); } return maxLen; }',
  'merge-intervals': 'function merge(intervals) { if (!intervals.length) return []; intervals.sort((a, b) => a[0] - b[0]); const out = [intervals[0]]; for (let i = 1; i < intervals.length; i++) { const last = out[out.length - 1]; if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]); else out.push(intervals[i]); } return out; }',
  'coin-change': 'function coinChange(coins, amount) { const dp = new Array(amount + 1).fill(Infinity); dp[0] = 0; for (let i = 1; i <= amount; i++) for (const c of coins) if (i >= c) dp[i] = Math.min(dp[i], dp[i - c] + 1); return dp[amount] === Infinity ? -1 : dp[amount]; }',
  'course-schedule': 'function canFinish(n, pre) { const indeg = new Array(n).fill(0); const adj = Array.from({ length: n }, () => []); for (const [a, b] of pre) { adj[b].push(a); indeg[a]++; } const q = []; for (let i = 0; i < n; i++) if (!indeg[i]) q.push(i); let c = 0; while (q.length) { const node = q.shift(); c++; for (const nx of adj[node]) if (--indeg[nx] === 0) q.push(nx); } return c === n; }',
  'median-of-two-sorted-arrays': 'function findMedianSortedArrays(a, b) { const m = a.length, n = b.length; if (m > n) return findMedianSortedArrays(b, a); const total = m + n, half = Math.floor((total + 1) / 2); let lo = 0, hi = m; while (lo <= hi) { const i = Math.floor((lo + hi) / 2), j = half - i; const L1 = i === 0 ? -Infinity : a[i - 1], R1 = i === m ? Infinity : a[i]; const L2 = j === 0 ? -Infinity : b[j - 1], R2 = j === n ? Infinity : b[j]; if (L1 <= R2 && L2 <= R1) { if (total % 2) return Math.max(L1, L2); return (Math.max(L1, L2) + Math.min(R1, R2)) / 2; } else if (L1 > R2) hi = i - 1; else lo = i + 1; } return 0; }',
  'validate-binary-search-tree': 'function isValidBST(root) { function validate(node, min, max) { if (!node) return true; if (node.val <= min || node.val >= max) return false; return validate(node.left, min, node.val) && validate(node.right, node.val, max); } return validate(root, -Infinity, Infinity); }',
};

const CLASSROOM_STUDENTS = [
  { name: 'Emma Chen', email: 'emma@student.devclash.demo' },
  { name: 'Marcus Johnson', email: 'marcus@student.devclash.demo' },
  { name: 'Sofia Rodriguez', email: 'sofia@student.devclash.demo' },
  { name: 'David Kim', email: 'david@student.devclash.demo' },
  { name: 'Priya Patel', email: 'priya@student.devclash.demo' },
];

function ladderSnapshot(rating, xp, weeklyXpGain = 0) {
  return {
    rating,
    xp,
    level: getLevelFromXP(xp),
    weeklyXpGain,
    trend: weeklyXpGain > 0 ? 'up' : 'stable',
  };
}

async function main() {
  console.log('[seed] connecting to database...');
  await connectDB();

  console.log('[seed] clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Problem.deleteMany({}),
    Submission.deleteMany({}),
    Battle.deleteMany({}),
    BattleParticipant.deleteMany({}),
    AdaptiveSession.deleteMany({}),
    Classroom.deleteMany({}),
    ClassroomMembership.deleteMany({}),
    Rating.deleteMany({}),
    ActivityEvent.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ---------- Demo users ----------
  console.log('[seed] creating demo users...');
  const [student, teacher, personal] = await User.create(
    {
      ...DEMO_USERS[0],
      passwordHash,
      isDemo: true,
      createdAt: daysAgo(120),
      duelRating: ladderSnapshot(1642, 28900, 42),
      problemSetRating: ladderSnapshot(1287, 14400, 85),
      adaptiveRating: ladderSnapshot(1519, 22500, 67),
      statistics: {
        totalBattles: 84, battlesWon: 52, battlesLost: 32, winRate: 62,
        problemsSolved: 156, problemsAttempted: 203, adaptiveSessions: 28,
        totalXp: 65800, currentStreak: 7, maxStreak: 14, averageRating: 1483,
      },
    },
    {
      ...DEMO_USERS[1],
      passwordHash,
      isDemo: true,
      createdAt: daysAgo(400),
    },
    {
      ...DEMO_USERS[2],
      passwordHash,
      isDemo: true,
      createdAt: daysAgo(200),
      duelRating: ladderSnapshot(1823, 39800, 124),
      problemSetRating: ladderSnapshot(1654, 30200, 98),
      adaptiveRating: ladderSnapshot(1789, 36700, 112),
      statistics: {
        totalBattles: 142, battlesWon: 98, battlesLost: 44, winRate: 69,
        problemsSolved: 287, problemsAttempted: 342, adaptiveSessions: 56,
        totalXp: 106700, currentStreak: 12, maxStreak: 23, averageRating: 1755,
      },
    }
  );

  // ---------- Classroom students ----------
  console.log('[seed] creating classroom students...');
  const classroomStudents = await User.create(
    CLASSROOM_STUDENTS.map((s, i) => ({
      name: s.name,
      email: s.email,
      passwordHash,
      role: 'student',
      isDemo: true,
      createdAt: daysAgo(90 - i),
      duelRating: ladderSnapshot(1892 - i * 74, 45200 - i * 4100, 30 + i * 5),
      problemSetRating: ladderSnapshot(1634 - i * 72, 38000 - i * 3900, 20 + i * 4),
      adaptiveRating: ladderSnapshot(1756 - i * 70, 41000 - i * 4000, 25 + i * 3),
      statistics: {
        totalBattles: 64 - i * 8, battlesWon: Math.round((64 - i * 8) * 0.68), battlesLost: Math.round((64 - i * 8) * 0.32),
        winRate: 88 - i * 4, problemsSolved: 142 - i * 20, problemsAttempted: 180 - i * 22,
        adaptiveSessions: 30 - i * 4, totalXp: 90000 - i * 9000, currentStreak: 10 - i, maxStreak: 16 - i,
        averageRating: 1760 - i * 65,
      },
    }))
  );

  // ---------- Problems ----------
  console.log('[seed] creating problems...');
  const problems = await Problem.create(
    PROBLEMS.map((p) => ({
      ...p,
      slug: slugify(p.title),
      topics: p.tags, // tags double as canonical topics for the adaptive engine
      supportedLanguages: ['javascript', 'python'],
      xpReward: DEFAULT_XP,
      defaultTimeLimitMs: 5000,
      createdBy: teacher._id,
      createdAt: daysAgo(60),
      statistics: {
        totalSubmissions: 2000 + Math.floor(Math.random() * 8000),
        acceptedSubmissions: 900 + Math.floor(Math.random() * 4000),
        acceptanceRate: 40 + Math.round(Math.random() * 30),
        averageTime: 40 + Math.floor(Math.random() * 90),
        averageMemory: 35 + Math.round(Math.random() * 15),
      },
    }))
  );

  // ---------- Classroom + memberships ----------
  console.log('[seed] creating classrooms...');
  const classroom1 = await Classroom.create({
    name: 'CS 101 - Data Structures',
    code: 'CS101-F24',
    subject: 'Computer Science',
    section: 'Section A',
    description: 'Introduction to fundamental data structures, search algorithms, and algorithmic complexity.',
    teacher: teacher._id,
    createdAt: daysAgo(80),
  });
  const classroom2 = await Classroom.create({
    name: 'CS 201 - Advanced Algorithms',
    code: 'CS201-F24',
    subject: 'Computer Science',
    section: 'Section B',
    description: 'Dynamic programming, graph theory, greedy strategies, and competitive problem solving.',
    teacher: teacher._id,
    createdAt: daysAgo(70),
  });

  await ClassroomMembership.create({ classroom: classroom1._id, user: teacher._id, role: 'teacher' });
  await ClassroomMembership.create({ classroom: classroom2._id, user: teacher._id, role: 'teacher' });

  for (const [i, cs] of classroomStudents.entries()) {
    await ClassroomMembership.create({
      classroom: classroom1._id,
      user: cs._id,
      role: 'student',
      joinedAt: daysAgo(60 - i),
      lastActive: daysAgo(i),
    });
    if (i < 3) {
      await ClassroomMembership.create({
        classroom: classroom2._id,
        user: cs._id,
        role: 'student',
        joinedAt: daysAgo(50 - i),
        lastActive: daysAgo(i),
      });
    }
  }

  // ---------- Rating ledger history for demo student/personal ----------
  console.log('[seed] creating rating history...');
  const ladders = ['duel', 'problemSet', 'adaptive'];
  for (const [user, base] of [[student, { duel: 1300, problemSet: 1050, adaptive: 1250 }], [personal, { duel: 1500, problemSet: 1350, adaptive: 1450 }]]) {
    for (const ladder of ladders) {
      let rating = base[ladder];
      const target = user[ladder === 'problemSet' ? 'problemSetRating' : `${ladder}Rating`].rating;
      const step = Math.round((target - rating) / 24);
      for (let d = 24; d >= 1; d -= 2) {
        const delta = step + Math.floor(Math.random() * 8) - 4;
        const after = rating + delta;
        await Rating.create({
          user: user._id,
          ladder,
          ratingBefore: rating,
          ratingAfter: after,
          delta,
          xpGained: Math.floor(Math.random() * 60) + 20,
          reason: ladder === 'duel' ? 'battle' : ladder === 'problemSet' ? 'problem-solved' : 'adaptive-session',
          createdAt: daysAgo(d),
        });
        rating = after;
      }
    }
  }

  // ---------- Historical submissions for demo student ----------
  console.log('[seed] creating submissions & activity...');
  const solvedProblems = problems.slice(0, 5);
  for (const [i, problem] of solvedProblems.entries()) {
    const solution = REFERENCE_SOLUTIONS[problem.slug];
    if (!solution) continue;

    // Verify the reference solution actually passes all test cases
    let allPass = true;
    try {
      const fn = new Function(`"use strict"; return (${solution});`)();
      for (const tc of problem.testCases) {
        const args = new Function(`"use strict"; return [${tc.input}];`)();
        const actual = fn(...args);
        const actualStr = typeof actual === 'string' ? actual : JSON.stringify(actual);
        if (actualStr !== tc.expectedOutput.trim()) {
          allPass = false;
          console.warn(`[seed] reference solution mismatch for ${problem.title} tc-${tc.id}: got ${actualStr}, want ${tc.expectedOutput}`);
          break;
        }
      }
    } catch (err) {
      allPass = false;
      console.warn(`[seed] reference solution failed for ${problem.title}: ${err.message}`);
    }
    if (!allPass) continue;

    await Submission.create({
      user: student._id,
      problem: problem._id,
      sourceCode: solution,
      language: 'javascript',
      status: 'accepted',
      testCasesPassed: problem.testCases.length,
      totalTestCases: problem.testCases.length,
      xpEarned: { easy: 50, medium: 120, hard: 200 }[problem.difficulty],
      createdAt: daysAgo(30 - i * 5),
    });

    await ActivityEvent.create({
      user: student._id,
      userName: student.name,
      type: 'problem',
      description: `solved "${problem.title}" (${problem.difficulty})`,
      metadata: { xpGain: { easy: 50, medium: 120, hard: 200 }[problem.difficulty] },
      createdAt: daysAgo(30 - i * 5),
    });
  }

  // ---------- Historical battles for demo student ----------
  console.log('[seed] creating battle history...');
  const battleHistory = [
    { opponent: 'Ryan Chen', problemIdx: 0, won: true, ratingChange: 38, days: 3 },
    { opponent: 'Sarah Kim', problemIdx: 2, won: false, ratingChange: -18, days: 6 },
    { opponent: 'BinaryPhantom', problemIdx: 1, won: true, ratingChange: 30, days: 9 },
  ];
  for (const bh of battleHistory) {
    const problem = problems[bh.problemIdx];
    const battle = await Battle.create({
      battleCode: `DC-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      mode: 'duel',
      status: 'completed',
      isRanked: true,
      participants: [
        { user: student._id, name: student.name, rating: 1642 - bh.ratingChange, status: bh.won ? 'passed' : 'failed', score: bh.won ? 92 : 45, testCasesPassed: bh.won ? 5 : 2, totalTestCases: 5 },
        { user: student._id, name: bh.opponent, isBot: true, rating: 1600, status: bh.won ? 'failed' : 'passed', score: bh.won ? 78 : 88, testCasesPassed: bh.won ? 3 : 5, totalTestCases: 5 },
      ],
      problem: problem._id,
      timeLimit: 30,
      language: 'javascript',
      startedAt: daysAgo(bh.days),
      endedAt: daysAgo(bh.days),
      createdAt: daysAgo(bh.days),
      result: {
        winnerId: bh.won ? student._id.toString() : null,
        isVictory: bh.won,
        duration: 540,
        ratingChange: bh.ratingChange,
        xpGained: bh.won ? 120 : 25,
        streak: bh.won ? 6 : 0,
        submissions: [],
      },
    });

    await BattleParticipant.create({
      battle: battle._id,
      user: student._id,
      ratingBefore: 1642 - bh.ratingChange,
      ratingAfter: 1642 - bh.ratingChange + bh.ratingChange,
      ratingDelta: bh.ratingChange,
      xpEarned: bh.won ? 120 : 25,
      isWinner: bh.won,
      score: bh.won ? 92 : 45,
      testCasesPassed: bh.won ? 5 : 2,
      totalTestCases: 5,
      status: bh.won ? 'passed' : 'failed',
      createdAt: daysAgo(bh.days),
    });

    await ActivityEvent.create({
      user: student._id,
      userName: student.name,
      type: 'battle',
      description: bh.won ? `won a Duel against ${bh.opponent} (+${bh.ratingChange} rating)` : `lost a Duel to ${bh.opponent} (${bh.ratingChange} rating)`,
      metadata: { ratingChange: bh.ratingChange },
      createdAt: daysAgo(bh.days),
    });
  }

  // ---------- Completed adaptive session for demo student ----------
  console.log('[seed] creating adaptive sessions...');
  const adaptiveSession = await AdaptiveSession.create({
    user: student._id,
    status: 'completed',
    problemsAttempted: [
      { problem: problems[0]._id, problemTitle: problems[0].title, difficulty: 'easy', status: 'solved', timeSpent: 420, attempts: 1, ratingChange: 12 },
      { problem: problems[2]._id, problemTitle: problems[2].title, difficulty: 'medium', status: 'solved', timeSpent: 890, attempts: 2, ratingChange: 18 },
      { problem: problems[5]._id, problemTitle: problems[5].title, difficulty: 'medium', status: 'attempted', timeSpent: 1200, attempts: 3, ratingChange: -5 },
    ],
    startedAt: daysAgo(4),
    endedAt: daysAgo(4),
    createdAt: daysAgo(4),
    skillProfile: {
      strengths: ['Arrays', 'Hash Tables', 'Two Pointers'],
      weaknesses: ['Dynamic Programming', 'Graph Algorithms'],
      recommendedTopics: ['Sliding Window', 'Binary Search', 'Greedy Algorithms'],
      estimatedRating: 1519,
      confidence: 0.87,
    },
  });

  await ActivityEvent.create({
    user: student._id,
    userName: student.name,
    type: 'adaptive',
    description: 'completed Adaptive Session (+67 XP)',
    metadata: { ratingChange: 12 },
    createdAt: daysAgo(4),
  });

  await ActivityEvent.create({
    user: student._id,
    userName: student.name,
    type: 'achievement',
    description: 'earned "Weekly Warrior" badge',
    metadata: { streak: 7 },
    createdAt: daysAgo(7),
  });

  // ---------- Notifications ----------
  await Notification.create([
    {
      user: student._id,
      type: 'achievement',
      title: 'Streak milestone reached',
      message: 'You have solved problems 7 days in a row. Keep it up!',
      createdAt: daysAgo(1),
    },
    {
      user: student._id,
      type: 'battle',
      title: 'New ranked duel available',
      message: 'Your duel rating is climbing — queue for a match.',
      createdAt: daysAgo(2),
    },
    {
      user: teacher._id,
      type: 'classroom',
      title: 'Classroom activity spike',
      message: 'CS 101 - Data Structures has 3 new submissions today.',
      createdAt: daysAgo(1),
    },
  ]);

  // ---------- Summary ----------
  const counts = {
    users: await User.countDocuments({}),
    problems: await Problem.countDocuments({}),
    submissions: await Submission.countDocuments({}),
    battles: await Battle.countDocuments({}),
    battleParticipants: await BattleParticipant.countDocuments({}),
    adaptiveSessions: await AdaptiveSession.countDocuments({}),
    classrooms: await Classroom.countDocuments({}),
    memberships: await ClassroomMembership.countDocuments({}),
    ratings: await Rating.countDocuments({}),
    activityEvents: await ActivityEvent.countDocuments({}),
    notifications: await Notification.countDocuments({}),
  };

  console.log('\n[seed] ✅ Database seeded successfully:');
  console.table(counts);
  console.log('\n[seed] Demo credentials:');
  console.log('  Student  → student@devclash.demo  / ' + DEMO_PASSWORD);
  console.log('  Teacher  → teacher@devclash.demo  / ' + DEMO_PASSWORD);
  console.log('  Personal → personal@devclash.demo / ' + DEMO_PASSWORD);

  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
