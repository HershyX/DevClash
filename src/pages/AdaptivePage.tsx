import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Avatar } from '@components/ui/Avatar';
import { Icon } from '@components/ui/Icon';
import { useAuth } from '@context/AuthContext';
import { adaptiveService } from '@services/adaptiveService';
import type { AdaptiveSession, Problem } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@utils';

type Stage = 'idle' | 'configure' | 'solving' | 'checking' | 'feedback' | 'summary';

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const TOPICS = ['Arrays', 'Strings', 'Hash Tables', 'Two Pointers', 'Sliding Window', 'Binary Search', 'Dynamic Programming', 'Graph Algorithms', 'Trees', 'Greedy', 'Backtracking', 'Sorting'];

const SAMPLE_PROBLEMS: Record<string, { title: string; description: string; difficulty: 'easy' | 'medium' | 'hard'; tags: string[] }[]> = {
  easy: [
    { title: 'Two Sum', description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.', difficulty: 'easy', tags: ['Array', 'Hash Table'] },
    { title: 'Valid Parentheses', description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.\n\nAn input string is valid if: Open brackets must be closed by the same type of brackets, and in the correct order.', difficulty: 'easy', tags: ['String', 'Stack'] },
  ],
  medium: [
    { title: 'Longest Substring Without Repeating Characters', description: 'Given a string s, find the length of the longest substring without repeating characters.\n\nA substring is a contiguous non-empty sequence of characters within a string.', difficulty: 'medium', tags: ['String', 'Sliding Window', 'Hash Table'] },
    { title: 'Group Anagrams', description: 'Given an array of strings strs, group the anagrams together. You can return the answer in any order.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.', difficulty: 'medium', tags: ['Array', 'Hash Table', 'String', 'Sorting'] },
  ],
  hard: [
    { title: 'Merge K Sorted Lists', description: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.', difficulty: 'hard', tags: ['Linked List', 'Divide and Conquer', 'Heap', 'Merge Sort'] },
  ],
};

export function AdaptivePage() {
  const { user } = useAuth();

  const [stage, setStage] = useState<Stage>('idle');
  const [focusTopics, setFocusTopics] = useState<string[]>([]);
  const [session, setSession] = useState<Partial<AdaptiveSession> & { currentProblemData?: any; problemsCompleted?: number; totalXp?: number }>({});
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<{ success: boolean; message: string; xp: number; ratingChange: number } | null>(null);
  const [recentSessions] = useState([
    { id: '1', date: 'Today', problems: 3, xp: 67, ratingChange: '+12', duration: '45m', topics: ['Arrays', 'Hash Tables'] },
    { id: '2', date: 'Yesterday', problems: 4, xp: 89, ratingChange: '+18', duration: '52m', topics: ['Sliding Window', 'DP'] },
    { id: '3', date: 'Mar 10', problems: 2, xp: 34, ratingChange: '-5', duration: '28m', topics: ['Graph Algorithms'] },
    { id: '4', date: 'Mar 8', problems: 5, xp: 112, ratingChange: '+24', duration: '1h 12m', topics: ['Trees', 'Greedy'] },
  ]);

  // Timer
  useEffect(() => {
    if (stage !== 'solving' || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [stage, timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const getNextProblem = useCallback((sessionData: typeof session) => {
    // Simple difficulty progression: start easy, escalate based on successes
    const solved = sessionData.problemsCompleted || 0;
    let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
    if (solved >= 2 && (sessionData.totalXp || 0) > 50) difficulty = 'medium';
    if (solved >= 4 && (sessionData.totalXp || 0) > 150) difficulty = 'hard';
    const pool = SAMPLE_PROBLEMS[difficulty];
    return pool[solved % pool.length];
  }, []);

  const handleStartSession = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const newSession = {
      id: `session-${Date.now()}`,
      status: 'active' as const,
      problemsCompleted: 0,
      totalXp: 0,
      problemsAttempted: [],
      startedAt: new Date().toISOString(),
      skillProfile: {
        strengths: ['Arrays', 'Hash Tables'],
        weaknesses: ['Dynamic Programming'],
        recommendedTopics: focusTopics.length > 0 ? focusTopics : ['Sliding Window', 'Binary Search'],
        estimatedRating: (user as any)?.adaptiveRating?.rating || 1519,
        confidence: 0.72,
      },
    };
    const firstProblem = getNextProblem({ problemsCompleted: 0, totalXp: 0 });
    setSession({ ...newSession, currentProblemData: firstProblem });
    setCode(`// Solve: ${firstProblem.title}\n\nfunction solution() {\n  // Your code here\n  \n}`);
    setTimeLeft(15 * 60);
    setStage('solving');
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    setStage('checking');
    await new Promise((r) => setTimeout(r, 1500));
    const success = Math.random() > 0.3; // 70% success rate
    const xp = success ? Math.floor(Math.random() * 40) + 30 : Math.floor(Math.random() * 15);
    const ratingChange = success ? Math.floor(Math.random() * 20) + 5 : -(Math.floor(Math.random() * 10));
    setFeedbackResult({ success, message: success ? 'All test cases passed!' : 'Wrong answer on test case 2.', xp, ratingChange });
    setStage('feedback');
  };

  const handleNextProblem = () => {
    if (!feedbackResult) return;
    const updatedSession = {
      ...session,
      problemsCompleted: (session.problemsCompleted || 0) + 1,
      totalXp: (session.totalXp || 0) + feedbackResult.xp,
    };
    const nextProblem = getNextProblem(updatedSession);
    setSession({ ...updatedSession, currentProblemData: nextProblem });
    setCode(`// Solve: ${nextProblem.title}\n\nfunction solution() {\n  // Your code here\n  \n}`);
    setTimeLeft(15 * 60);
    setFeedbackResult(null);
    setStage('solving');
  };

  const handleEndSession = () => {
    setStage('summary');
  };

  const currentProblem = session.currentProblemData;
  const estimatedRating = (session.skillProfile?.estimatedRating || 1519) + Math.floor((session.totalXp || 0) / 5);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">

        {/* ── IDLE ── */}
        {stage === 'idle' && (
          <motion.div key="idle" className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">Adaptive Coding</h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">AI-powered sessions that adapt to your skill level in real-time</p>
              </div>
              <Button variant="primary" size="lg" leftIcon={<span>🧠</span>} onClick={() => setStage('configure')}>
                Start New Session
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Skill Profile Card */}
              <Card variant="glass" className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Your Skill Profile</CardTitle>
                    <Badge variant="adaptive" size="sm" dot>Calibrated</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-5">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                      <p className="text-3xl font-bold text-adaptive-600 dark:text-adaptive-400">{(user as any)?.adaptiveRating?.rating || 1519}</p>
                      <p className="text-xs text-surface-500 mt-1">Adaptive Rating</p>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                      <p className="text-3xl font-bold text-practice-600 dark:text-practice-400">87%</p>
                      <p className="text-xs text-surface-500 mt-1">Accuracy</p>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                      <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">24</p>
                      <p className="text-xs text-surface-500 mt-1">Sessions</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-practice-600 dark:text-practice-400 mb-2 flex items-center gap-2">
                        <span>💪</span> Strengths
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {['Arrays', 'Hash Tables', 'Two Pointers'].map((s) => (
                          <Badge key={s} variant="success" size="sm">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-duel-600 dark:text-duel-400 mb-2 flex items-center gap-2">
                        <span>⚠️</span> Needs Work
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {['Dynamic Programming', 'Graphs'].map((s) => (
                          <Badge key={s} variant="danger" size="sm">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-brand-600 dark:text-brand-400 mb-2 flex items-center gap-2">
                        <span>🎯</span> Recommended
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {['Sliding Window', 'Binary Search', 'Greedy'].map((s) => (
                          <Badge key={s} variant="brand" size="sm">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Sessions */}
              <Card variant="glass">
                <CardHeader><CardTitle>Recent Sessions</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {recentSessions.map((s) => (
                    <div key={s.id} className="p-3 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-surface-900 dark:text-white text-sm">{s.date}</span>
                        <Badge variant={s.ratingChange.startsWith('+') ? 'success' : 'danger'} size="sm">{s.ratingChange}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {s.topics.map((t) => <Badge key={t} variant="default" size="sm">{t}</Badge>)}
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-xs text-surface-500 dark:text-surface-400">
                        <span>📝 {s.problems}</span>
                        <span>⭐ +{s.xp} XP</span>
                        <span>⏱️ {s.duration}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ── CONFIGURE ── */}
        {stage === 'configure' && (
          <motion.div key="configure" className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div>
              <button onClick={() => setStage('idle')} className="text-sm text-surface-500 hover:text-surface-900 dark:hover:text-white mb-4 flex items-center gap-1">
                <Icon name="chevronLeft" size={14} /> Back
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">Configure Session</h1>
              <p className="text-surface-600 dark:text-surface-400 mt-1">Customize your adaptive learning experience</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="glass">
                <CardHeader><CardTitle>Focus Topics (optional)</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-surface-500 mb-4">Select topics to focus on, or leave empty for full adaptive selection.</p>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map((topic) => (
                      <motion.button
                        key={topic}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setFocusTopics((prev) =>
                          prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
                        )}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                          focusTopics.includes(topic)
                            ? 'bg-brand-500 text-white border-brand-500'
                            : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-brand-300'
                        )}
                      >
                        {topic}
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card variant="glass">
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-adaptive-100 dark:bg-adaptive-900/30 flex items-center justify-center text-2xl">🧠</div>
                      <div>
                        <h3 className="font-semibold text-surface-900 dark:text-white">AI Adaptive Mode</h3>
                        <p className="text-sm text-surface-500">Problems scale with your performance in real-time</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card variant="glass">
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-2xl">⏱️</div>
                      <div>
                        <h3 className="font-semibold text-surface-900 dark:text-white">15 min per problem</h3>
                        <p className="text-sm text-surface-500">Flexible pacing • End anytime</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Button variant="primary" size="lg" fullWidth leftIcon={<span>🚀</span>} onClick={handleStartSession} disabled={isLoading}>
                  {isLoading ? 'Calibrating...' : 'Start Session'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SOLVING ── */}
        {stage === 'solving' && currentProblem && (
          <motion.div key="solving" className="space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="adaptive" size="sm" dot>Adaptive Session</Badge>
                <span className="text-sm text-surface-500">Problem {(session.problemsCompleted || 0) + 1}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn('font-mono text-lg font-bold px-3 py-1 rounded-lg', timeLeft < 180 ? 'text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse' : 'text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800')}>
                  {formatTime(timeLeft)}
                </div>
                <Button variant="outline" size="sm" onClick={handleEndSession}>End Session</Button>
              </div>
            </div>

            {/* XP progress */}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-surface-500">Session XP:</span>
              <div className="flex-1">
                <ProgressBar value={Math.min(session.totalXp || 0, 200)} max={200} variant="adaptive" size="sm" />
              </div>
              <span className="font-bold text-adaptive-600 dark:text-adaptive-400">+{session.totalXp || 0} XP</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Problem description */}
              <Card variant="glass" className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{currentProblem.title}</CardTitle>
                    <Badge
                      variant={currentProblem.difficulty === 'easy' ? 'success' : currentProblem.difficulty === 'medium' ? 'warning' : 'danger'}
                      size="sm"
                    >
                      {currentProblem.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-line">
                    {currentProblem.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {currentProblem.tags.map((tag: string) => (
                      <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Code editor */}
              <Card variant="glass" className="lg:col-span-3 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-200 dark:border-surface-700 bg-surface-900 text-white rounded-t-xl">
                  <span className="text-xs font-mono text-surface-400">solution.js</span>
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  </div>
                </div>
                <div className="relative" style={{ height: '340px' }}>
                  <div className="absolute inset-0 flex bg-surface-950 rounded-b-xl overflow-hidden">
                    <div className="text-surface-600 text-xs font-mono py-4 pl-3 pr-2 select-none bg-surface-900 border-r border-surface-800 overflow-hidden" style={{minWidth: '2.5rem'}}>
                      {code.split('\n').map((_, i) => <div key={i} className="leading-5">{i + 1}</div>)}
                    </div>
                    <textarea
                      className="flex-1 bg-transparent text-surface-100 font-mono text-sm p-3 resize-none outline-none leading-5 overflow-auto"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      spellCheck={false}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          const s = e.currentTarget.selectionStart;
                          const newCode = code.substring(0, s) + '  ' + code.substring(e.currentTarget.selectionEnd);
                          setCode(newCode);
                          requestAnimationFrame(() => { e.currentTarget.selectionStart = s + 2; e.currentTarget.selectionEnd = s + 2; });
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center px-4 py-3 border-t border-surface-200 dark:border-surface-700">
                  <Button variant="ghost" size="sm" onClick={() => setCode(`// Solve: ${currentProblem.title}\n\nfunction solution() {\n  // Your code here\n  \n}`)}>
                    Reset
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setStage('feedback')}>Skip</Button>
                    <Button variant="primary" size="sm" onClick={handleSubmit}>
                      Submit Solution
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ── CHECKING ── */}
        {stage === 'checking' && (
          <motion.div key="checking" className="flex flex-col items-center justify-center min-h-[50vh] space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="text-5xl">
              ⟳
            </motion.div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-1">Evaluating Solution</h2>
              <p className="text-surface-500">Running test cases...</p>
            </div>
            <div className="w-64">
              <ProgressBar value={75} max={100} variant="adaptive" size="md" />
            </div>
          </motion.div>
        )}

        {/* ── FEEDBACK ── */}
        {stage === 'feedback' && feedbackResult && (
          <motion.div key="feedback" className="flex flex-col items-center justify-center min-h-[50vh] space-y-6" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }} className="text-6xl">
              {feedbackResult.success ? '✅' : '❌'}
            </motion.div>

            <div className="text-center">
              <h2 className={cn('text-2xl font-extrabold mb-1', feedbackResult.success ? 'text-practice-500' : 'text-duel-500')}>
                {feedbackResult.success ? 'Correct!' : 'Not Quite'}
              </h2>
              <p className="text-surface-600 dark:text-surface-400">{feedbackResult.message}</p>
            </div>

            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-500">+{feedbackResult.xp}</p>
                <p className="text-xs text-surface-500">XP Earned</p>
              </div>
              <div className="text-center">
                <p className={cn('text-2xl font-bold', feedbackResult.ratingChange > 0 ? 'text-practice-500' : 'text-duel-500')}>
                  {feedbackResult.ratingChange > 0 ? '+' : ''}{feedbackResult.ratingChange}
                </p>
                <p className="text-xs text-surface-500">Rating Change</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleEndSession}>End Session</Button>
              <Button variant="primary" leftIcon={<span>➡️</span>} onClick={handleNextProblem}>
                Next Problem
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── SUMMARY ── */}
        {stage === 'summary' && (
          <motion.div key="summary" className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="text-6xl mb-4">
                🎓
              </motion.div>
              <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Session Complete!</h1>
              <p className="text-surface-600 dark:text-surface-400">Great job! Here's your performance summary.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Problems Solved', value: session.problemsCompleted || 0, icon: '📝', color: 'text-brand-600 dark:text-brand-400' },
                { label: 'XP Earned', value: `+${session.totalXp || 0}`, icon: '⭐', color: 'text-practice-600 dark:text-practice-400' },
                { label: 'Est. Rating', value: estimatedRating, icon: '📈', color: 'text-adaptive-600 dark:text-adaptive-400' },
                { label: 'Accuracy', value: '70%', icon: '🎯', color: 'text-warning-600 dark:text-warning-400' },
              ].map((stat) => (
                <motion.div key={stat.label} whileHover={{ scale: 1.03 }}>
                  <Card variant="glass">
                    <CardContent className="pt-5 text-center">
                      <p className="text-3xl mb-1">{stat.icon}</p>
                      <p className={cn('text-2xl font-extrabold', stat.color)}>{stat.value}</p>
                      <p className="text-xs text-surface-500 mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => { setStage('idle'); setSession({}); setFocusTopics([]); }}>
                Back to Dashboard
              </Button>
              <Button variant="primary" leftIcon={<span>🔄</span>} onClick={() => { setSession({}); setStage('configure'); }}>
                Start New Session
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}