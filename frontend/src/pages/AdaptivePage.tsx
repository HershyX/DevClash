import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Icon } from '@components/ui/Icon';
import { useAuth } from '@context/AuthContext';
import { adaptiveService } from '@services/adaptiveService';
import type { SkillAnalytics, AdaptiveSessionHistoryEntry } from '@services/adaptiveService';
import type { AdaptiveSession, Problem } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@utils';

type Stage = 'idle' | 'configure' | 'solving' | 'checking' | 'feedback' | 'summary';

const TOPICS = ['Arrays', 'Strings', 'Hash Maps', 'Recursion', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs', 'Dynamic Programming', 'Sorting', 'Searching'];

interface Feedback {
  success: boolean;
  message: string;
  xp: number;
  ratingChange: number;
}

interface SessionSummary {
  solved: number;
  attempted: number;
  xp: number;
  ratingChange: number;
  accuracy: number;
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  return `${m}m ${sec % 60}s`;
}

export function AdaptivePage() {
  const { user, refreshUser } = useAuth();

  const [stage, setStage] = useState<Stage>('idle');
  const [focusTopics, setFocusTopics] = useState<string[]>([]);
  const [skill, setSkill] = useState<SkillAnalytics | null>(null);
  const [history, setHistory] = useState<AdaptiveSessionHistoryEntry[]>([]);
  const [session, setSession] = useState<(AdaptiveSession & { reasoning?: string | null }) | null>(null);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const attemptStartRef = useRef<number>(Date.now());

  const loadDashboardData = useCallback(async () => {
    const [s, h] = await Promise.all([
      adaptiveService.getSkillProfile(user?.id ?? ''),
      adaptiveService.getHistory(5),
    ]);
    setSkill(s);
    setHistory(h);
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Timer
  useEffect(() => {
    if (stage !== 'solving' || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [stage, timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const currentProblem: Problem | null = session?.currentProblem ?? null;

  const loadNextProblem = useCallback(async (activeSession: AdaptiveSession) => {
    const next = await adaptiveService.getNextProblem(activeSession.id);
    if (!next) {
      setSession(null);
      setStage('summary');
      return;
    }
    if (!next.currentProblem) {
      // Engine says the session is exhausted — end it.
      await adaptiveService.endSession(next.id);
      setSummary(computeSummary(next));
      setSession(null);
      setStage('summary');
      return;
    }
    setSession(next);
    setCode(next.currentProblem?.starterCode?.javascript ?? '// Write your solution\n');
    setTimeLeft(15 * 60);
    attemptStartRef.current = Date.now();
    setFeedback(null);
    setStage('solving');
  }, []);

  const handleStartSession = async () => {
    setIsLoading(true);
    try {
      const started = await adaptiveService.startSession(user?.id ?? '', focusTopics);
      setSession(started);
      if (!started.currentProblem) {
        // No problems available for this user/topic combination
        setSummary({ solved: 0, attempted: 0, xp: 0, ratingChange: 0, accuracy: 0 });
        setStage('summary');
        return;
      }
      setCode(started.currentProblem?.starterCode?.javascript ?? '// Write your solution\n');
      setTimeLeft(15 * 60);
      attemptStartRef.current = Date.now();
      setStage('solving');
    } catch (err) {
      setFeedback({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to start session',
        xp: 0,
        ratingChange: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!session?.currentProblem || isSubmitting) return;
    setIsSubmitting(true);
    setStage('checking');
    const timeSpent = Math.round((Date.now() - attemptStartRef.current) / 1000);
    try {
      const result = await adaptiveService.submitAttempt(
        session.id,
        session.currentProblem.id,
        code,
        'javascript',
        timeSpent
      );
      const solved = result.evalStatus === 'accepted';
      setFeedback({
        success: solved,
        message: solved
          ? `All test cases passed! +${result.xpEarned ?? 0} XP, ${result.ratingChange && result.ratingChange > 0 ? '+' : ''}${result.ratingChange ?? 0} adaptive rating.`
          : (result.errorMessage || `Test cases passed: ${result.passedCount}/${result.totalCount}. Try again!`),
        xp: result.xpEarned ?? 0,
        ratingChange: result.ratingChange ?? 0,
      });
      setSession(result.session);
      if (solved) {
        void refreshUser();
      }
      setStage('feedback');
    } catch (err) {
      setFeedback({
        success: false,
        message: err instanceof Error ? err.message : 'Submission failed',
        xp: 0,
        ratingChange: 0,
      });
      setStage('feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextProblem = () => {
    if (!session) return;
    loadNextProblem(session);
  };

  const handleEndSession = async () => {
    if (!session) {
      setStage('idle');
      return;
    }
    try {
      const ended = await adaptiveService.endSession(session.id);
      setSummary(computeSummary(ended));
    } catch {
      setSummary(computeSummary(session));
    }
    setSession(null);
    setStage('summary');
  };

  const computeSummary = (s: AdaptiveSession): SessionSummary => {
    const attempts = s.problemsAttempted ?? [];
    const solved = attempts.filter((a) => a.status === 'solved');
    const xp = attempts.reduce((sum, a) => sum + (a.xpEarned ?? 0), 0);
    const ratingChange = attempts.reduce((sum, a) => sum + (a.ratingChange ?? 0), 0);
    return {
      solved: solved.length,
      attempted: attempts.length,
      xp,
      ratingChange,
      accuracy: attempts.length ? Math.round((solved.length / attempts.length) * 100) : 0,
    };
  };

  const estimatedRating = (user as unknown as { adaptiveRating?: { rating?: number } })?.adaptiveRating?.rating ?? 1200;

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">

        {/* ── IDLE ── */}
        {stage === 'idle' && (
          <motion.div key="idle" className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">Adaptive Coding</h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">Sessions that adapt to your skill level in real-time</p>
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
                    <Badge variant="adaptive" size="sm" dot>Live from backend</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-5">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                      <p className="text-3xl font-bold text-adaptive-600 dark:text-adaptive-400">{estimatedRating}</p>
                      <p className="text-xs text-surface-500 mt-1">Adaptive Rating</p>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                      <p className="text-3xl font-bold text-practice-600 dark:text-practice-400">{skill?.overall?.accuracy ?? 0}%</p>
                      <p className="text-xs text-surface-500 mt-1">Accuracy</p>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                      <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">{skill?.overall?.totalSolved ?? 0}</p>
                      <p className="text-xs text-surface-500 mt-1">Problems Solved</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-practice-600 dark:text-practice-400 mb-2 flex items-center gap-2">
                        <span>💪</span> Strengths
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(skill?.strongest ?? []).length > 0 ? (
                          skill!.strongest.map((t) => (
                            <Badge key={t.topic} variant="success" size="sm">{t.topic} · {t.skillScore}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-surface-500">Solve problems to build your profile</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-duel-600 dark:text-duel-400 mb-2 flex items-center gap-2">
                        <span>⚠️</span> Needs Work
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(skill?.weakest ?? []).length > 0 ? (
                          skill!.weakest.map((t) => (
                            <Badge key={t.topic} variant="danger" size="sm">{t.topic} · {t.skillScore}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-surface-500">No weak topics detected yet</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-brand-600 dark:text-brand-400 mb-2 flex items-center gap-2">
                        <span>⏱️</span> Avg Solve Time
                      </h4>
                      <p className="text-2xl font-bold text-surface-900 dark:text-white">
                        {formatDuration(skill?.overall?.avgSolveTimeSec ?? 0)}
                      </p>
                      <p className="text-xs text-surface-500 mt-1">
                        {skill?.overall?.totalAttempted ?? 0} total attempts
                      </p>
                    </div>
                  </div>

                  {/* Per-topic breakdown */}
                  {(skill?.topics ?? []).length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-surface-200 dark:border-surface-700">
                      <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Topic Performance</h4>
                      {skill!.topics.slice(0, 6).map((t) => (
                        <div key={t.topic} className="flex items-center gap-3">
                          <span className="text-sm text-surface-700 dark:text-surface-300 w-40 truncate">{t.topic}</span>
                          <div className="flex-1">
                            <ProgressBar value={t.accuracy} max={100} variant="adaptive" size="sm" />
                          </div>
                          <span className="text-xs text-surface-500 w-28 text-right">
                            {t.solved}/{t.attempts} · {formatDuration(t.avgSolveTimeSec)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Sessions */}
              <Card variant="glass">
                <CardHeader><CardTitle>Recent Sessions</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {history.length === 0 ? (
                    <p className="text-sm text-surface-500 py-4 text-center">No completed sessions yet.</p>
                  ) : (
                    history.map((s) => (
                      <div key={s.id} className="p-3 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-surface-900 dark:text-white text-sm">
                            {new Date(s.date).toLocaleDateString()}
                          </span>
                          <Badge variant={s.ratingChange >= 0 ? 'success' : 'danger'} size="sm">
                            {s.ratingChange >= 0 ? '+' : ''}{s.ratingChange}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {s.topics.map((t: string) => <Badge key={t} variant="default" size="sm">{t}</Badge>)}
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-xs text-surface-500 dark:text-surface-400">
                          <span>📝 {s.solved}/{s.problems}</span>
                          <span>⭐ +{s.xp} XP</span>
                          <span>⏱️ {formatDuration(s.durationSec)}</span>
                        </div>
                      </div>
                    ))
                  )}
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
                        <p className="text-sm text-surface-500">The backend engine picks problems based on your live skill profile</p>
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
                <span className="text-sm text-surface-500">
                  Problem {(session?.problemsAttempted?.length ?? 0) + 1}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn('font-mono text-lg font-bold px-3 py-1 rounded-lg', timeLeft < 180 ? 'text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse' : 'text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800')}>
                  {formatTime(timeLeft)}
                </div>
                <Button variant="outline" size="sm" onClick={handleEndSession}>End Session</Button>
              </div>
            </div>

            {/* Engine reasoning */}
            {session?.reasoning && (
              <div className="p-3 rounded-xl bg-adaptive-50 dark:bg-adaptive-900/20 border border-adaptive-200 dark:border-adaptive-800">
                <p className="text-xs text-adaptive-700 dark:text-adaptive-300">
                  <span className="font-semibold">Why this problem: </span>{session.reasoning}
                </p>
              </div>
            )}

            {/* Attempted progress */}
            {(session?.problemsAttempted?.length ?? 0) > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-surface-500">Session progress:</span>
                <div className="flex flex-wrap gap-1">
                  {session!.problemsAttempted.map((a, i) => (
                    <Badge key={i} variant={a.status === 'solved' ? 'success' : 'warning'} size="sm">
                      {a.status === 'solved' ? '✓' : '⟳'} {a.problemTitle}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

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
                    {(currentProblem.topics ?? currentProblem.tags ?? []).map((tag: string) => (
                      <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                    ))}
                  </div>
                  {(currentProblem.examples ?? []).length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-surface-200 dark:border-surface-700">
                      {currentProblem.examples.map((ex, i) => (
                        <div key={i} className="p-2.5 bg-surface-50 dark:bg-surface-800/50 rounded-lg font-mono text-xs space-y-0.5">
                          <div><span className="text-surface-500">Input: </span>{ex.input}</div>
                          <div><span className="text-surface-500">Output: </span>{ex.output}</div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <Button variant="ghost" size="sm" onClick={() => setCode(currentProblem.starterCode?.javascript ?? '// Write your solution\n')}>
                    Reset
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleEndSession}>End Session</Button>
                    <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting ? 'Evaluating...' : 'Submit Solution'}
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
              <p className="text-surface-500">Running in the sandbox...</p>
            </div>
            <div className="w-64">
              <ProgressBar value={75} max={100} variant="adaptive" size="md" />
            </div>
          </motion.div>
        )}

        {/* ── FEEDBACK ── */}
        {stage === 'feedback' && feedback && (
          <motion.div key="feedback" className="flex flex-col items-center justify-center min-h-[50vh] space-y-6" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }} className="text-6xl">
              {feedback.success ? '✅' : '❌'}
            </motion.div>

            <div className="text-center">
              <h2 className={cn('text-2xl font-extrabold mb-1', feedback.success ? 'text-practice-500' : 'text-duel-500')}>
                {feedback.success ? 'Correct!' : 'Not Quite'}
              </h2>
              <p className="text-surface-600 dark:text-surface-400 max-w-md">{feedback.message}</p>
            </div>

            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-500">+{feedback.xp}</p>
                <p className="text-xs text-surface-500">XP Earned</p>
              </div>
              <div className="text-center">
                <p className={cn('text-2xl font-bold', feedback.ratingChange >= 0 ? 'text-practice-500' : 'text-duel-500')}>
                  {feedback.ratingChange >= 0 ? '+' : ''}{feedback.ratingChange}
                </p>
                <p className="text-xs text-surface-500">Adaptive Rating</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleEndSession}>End Session</Button>
              {feedback.success && (
                <Button variant="primary" leftIcon={<span>➡️</span>} onClick={handleNextProblem}>
                  Next Problem
                </Button>
              )}
              {!feedback.success && (
                <Button variant="primary" onClick={() => { setStage('solving'); attemptStartRef.current = Date.now(); }}>
                  Try Again
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── SUMMARY ── */}
        {stage === 'summary' && summary && (
          <motion.div key="summary" className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="text-6xl mb-4">
                🎓
              </motion.div>
              <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Session Complete!</h1>
              <p className="text-surface-600 dark:text-surface-400">Here's your performance summary.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Problems Solved', value: `${summary.solved}/${summary.attempted}`, icon: '📝', color: 'text-brand-600 dark:text-brand-400' },
                { label: 'XP Earned', value: `+${summary.xp}`, icon: '⭐', color: 'text-practice-600 dark:text-practice-400' },
                { label: 'Adaptive Rating', value: `${summary.ratingChange >= 0 ? '+' : ''}${summary.ratingChange}`, icon: '📈', color: 'text-adaptive-600 dark:text-adaptive-400' },
                { label: 'Accuracy', value: `${summary.accuracy}%`, icon: '🎯', color: 'text-warning-600 dark:text-warning-400' },
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
              <Button variant="outline" onClick={() => { setStage('idle'); setSummary(null); setFocusTopics([]); loadDashboardData(); }}>
                Back to Dashboard
              </Button>
              <Button variant="primary" leftIcon={<span>🔄</span>} onClick={() => { setSummary(null); setStage('configure'); }}>
                Start New Session
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
