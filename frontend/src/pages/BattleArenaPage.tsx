import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Avatar } from '@components/ui/Avatar';
import { Modal } from '@components/ui/Modal';
import { Icon } from '@components/ui/Icon';
import { battleService } from '@services/battleService';
import { problemService } from '@services/problemService';
import { useAuth } from '@context/AuthContext';
import type { Battle, BattleResult, BattleParticipant } from '@/types';

interface TestCaseResult {
  id: string | number;
  input: string;
  expected: string;
  actual?: string;
  passed: boolean;
  timeMs?: number;
  error?: string;
  status: 'pending' | 'passed' | 'failed' | 'error';
}

export function BattleArenaPage() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const { user, refreshUser } = useAuth();

  const [battle, setBattle]                 = useState<Battle | null>(null);
  const [code, setCode]                     = useState('// Write your solution\n');
  const [language, setLanguage]             = useState('javascript');
  const [timeLeft, setTimeLeft]             = useState(30 * 60);
  const [opponentProgress, setOpponentProgress] = useState<BattleParticipant | null>(null);
  const [isRunning, setIsRunning]           = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [testResults, setTestResults]       = useState<TestCaseResult[]>([]);
  const [runMessage, setRunMessage]         = useState('');
  const [result, setResult]                 = useState<BattleResult | null>(null);
  const [showResult, setShowResult]         = useState(false);
  const [activeTab, setActiveTab]           = useState<'description' | 'testcases'>('description');
  const cleanupRef = useRef<(() => void) | null>(null);

  // ── Load battle on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    battleService.getBattle(id).then((b) => {
      if (!b) { navigate(-1); return; }
      setBattle(b);
      const starter = b.problem?.starterCode?.[language] ?? '// Write your solution\n';
      setCode(starter);
      if (b.timeLimit) setTimeLeft(b.timeLimit * 60);
    });
  }, [id]);   // eslint-disable-line

  // ── Socket.IO: live opponent progress + battle:finished ──────────────────────
  useEffect(() => {
    if (!id || !battle || battle.status !== 'active') return;

    // simulateOpponentProgress connects the socket and joins the battle room.
    // We also listen for battle:submission-update to update the opponent bar.
    battleService.simulateOpponentProgress(id, (participant) => {
      setOpponentProgress(participant);
    }).then((cleanup) => { cleanupRef.current = cleanup; });

    // Also subscribe to battle:submission-update and battle:finished
    let sock: any = null;
    (async () => {
      const { io } = await import('socket.io-client');
      const token = localStorage.getItem('devclash_token');
      const url = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
      sock = (io as any)(url, { auth: { token }, autoConnect: true });
      sock.emit('battle:join', { battleId: id });

      // Live opponent progress from real submission-update events
      sock.on('battle:submission-update', (payload: any) => {
        if (payload.battleId !== id) return;
        if (payload.participant?.userId !== user?.id) {
          setOpponentProgress(payload.participant);
        }
        // If it's our own update, refresh battle state
        if (payload.participant?.userId === user?.id) {
          setBattle((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              participants: prev.participants.map((p) =>
                p.userId === user?.id ? { ...p, ...payload.participant } : p
              ),
            };
          });
        }
      });

      // Opponent finished the battle from their side
      sock.on('battle:finished', (payload: any) => {
        if (payload.battleId !== id) return;
        if (!showResult) {
          // Fetch final state so the result modal has complete data
          battleService.getBattle(id).then((b) => {
            if (b?.result) {
              setResult({
                ...b.result,
                isVictory: payload.isVictory ?? (b.result.winnerId === user?.id),
                ratingChange: payload.ratingChange ?? b.result.ratingChange ?? 0,
                xpGained:    payload.xpGained    ?? b.result.xpGained    ?? 0,
              } as BattleResult);
              setShowResult(true);
            }
          });
        }
      });

      // Battle state sync on reconnect
      sock.on('battle:state', (payload: any) => {
        if (payload.battle) setBattle(payload.battle);
      });
    })();

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      sock?.disconnect();
    };
  }, [id, battle?.status]);  // eslint-disable-line

  // ── Countdown timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft <= 0 || showResult) return;
    const t = setInterval(() => setTimeLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [showResult, timeLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Run (public test cases via real sandbox) ─────────────────────────────────
  const handleRun = useCallback(async () => {
    if (!battle?.problem?.id) return;
    setIsRunning(true);
    setActiveTab('testcases');
    setTestResults([]);
    setRunMessage('');
    try {
      const res = await problemService.runTestCases(battle.problem.id, code, language);
      setRunMessage(res.message);
      setTestResults(
        (res.testCaseResults ?? []).map((tc, i) => ({
          id:       tc.id ?? i + 1,
          input:    tc.input,
          expected: tc.expected,
          actual:   tc.actual,
          passed:   tc.passed,
          timeMs:   tc.timeMs,
          error:    tc.error,
          status:   tc.passed ? 'passed' : (tc.error && tc.error !== 'wrong answer' ? 'error' : 'failed'),
        }))
      );
    } catch (e: any) {
      setRunMessage(e.message || 'Execution failed');
    } finally {
      setIsRunning(false);
    }
  }, [battle, code, language]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!battle || !user) return;
    setIsSubmitting(true);
    try {
      const elapsed = (battle.timeLimit || 30) * 60 - timeLeft;
      const res = await battleService.submitCode(battle.id, user.id, code, language, elapsed);
      setResult(res);
      setShowResult(true);
      cleanupRef.current?.();
      // Refresh auth context so dashboard shows updated rating
      if ((res as any).user) refreshUser();
    } catch (e: any) {
      alert(e.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [battle, user, code, language, timeLeft, refreshUser]);

  const myParticipant  = battle?.participants?.find((p) => p.userId === user?.id);
  const opp            = battle?.participants?.find((p) => p.userId !== user?.id) ?? opponentProgress;
  const myProgress     = myParticipant
    ? ((myParticipant.testCasesPassed || 0) / Math.max(1, myParticipant.totalTestCases || 5)) * 100
    : 0;
  const oppProgress    = opponentProgress ?? opp;
  const oppProgressPct = oppProgress
    ? ((oppProgress.testCasesPassed || 0) / Math.max(1, oppProgress.totalTestCases || 5)) * 100
    : 0;
  const timerDanger    = timeLeft < 300;

  return (
    <div className="flex flex-col h-screen bg-surface-950 text-white overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-900 border-b border-surface-700 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-surface-400 hover:text-white">
            <Icon name="chevronLeft" size={16} />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-surface-300">
              {battle?.isRanked ? '⚔️ Ranked Duel' : '🎮 Casual Duel'}
            </span>
            {battle?.battleCode && (
              <Badge variant="default" size="sm" className="font-mono">{battle.battleCode}</Badge>
            )}
          </div>
        </div>

        <div className={`font-mono text-2xl font-bold px-4 py-1 rounded-lg transition-colors ${
          timerDanger ? 'text-red-400 bg-red-900/30 animate-pulse' : 'text-white bg-surface-800'
        }`}>
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => {
              const lang = e.target.value;
              setLanguage(lang);
              const starter = battle?.problem?.starterCode?.[lang];
              if (starter) setCode(starter);
            }}
            className="bg-surface-800 text-surface-300 text-sm rounded-lg px-3 py-1.5 border border-surface-700 focus:outline-none focus:border-brand-500"
          >
            {(battle?.problem?.supportedLanguages ?? ['javascript', 'python']).map((l) => (
              <option key={l} value={l}>{l === 'javascript' ? 'JavaScript' : l === 'python' ? 'Python' : l}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={handleRun} disabled={isRunning || isSubmitting}
            className="border-surface-600 text-surface-300 hover:text-white">
            {isRunning ? '⟳ Running...' : '▶ Run'}
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isSubmitting || isRunning}>
            {isSubmitting ? 'Submitting...' : '✓ Submit'}
          </Button>
        </div>
      </div>

      {/* ── Player vs Opponent Strip ── */}
      <div className="flex items-center gap-4 px-4 py-2 bg-surface-900/60 border-b border-surface-800 shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <Avatar name={user?.name || 'You'} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-surface-400 truncate">{user?.name || 'You'}</span>
              <span className="text-xs text-brand-400 font-mono">
                {myParticipant?.testCasesPassed || 0}/{myParticipant?.totalTestCases || 5} ✓
              </span>
            </div>
            <ProgressBar value={myProgress} max={100} variant="brand" size="sm" />
          </div>
        </div>
        <div className="text-surface-500 font-bold px-2">VS</div>
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-surface-400 truncate">{opp?.name || 'Opponent'}</span>
              <span className="text-xs text-duel-400 font-mono">
                {oppProgress?.testCasesPassed || 0}/{oppProgress?.totalTestCases || 5} ✓
              </span>
            </div>
            <ProgressBar value={oppProgressPct} max={100} variant="duel" size="sm" />
          </div>
          <Avatar name={opp?.name || 'Opponent'} size="sm" />
        </div>
      </div>

      {/* ── Main Split Layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Problem */}
        <div className="w-[42%] flex flex-col border-r border-surface-700 overflow-hidden">
          <div className="flex border-b border-surface-700 shrink-0">
            {(['description', 'testcases'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab ? 'text-brand-400 border-b-2 border-brand-400' : 'text-surface-400 hover:text-white'
                }`}>
                {tab === 'testcases' ? 'Test Cases' : 'Description'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'description' && battle?.problem ? (
              <>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-lg font-bold text-white">{battle.problem.title}</h2>
                    <Badge
                      variant={battle.problem.difficulty === 'easy' ? 'success' : battle.problem.difficulty === 'medium' ? 'warning' : 'danger'}
                      size="sm">{battle.problem.difficulty}</Badge>
                  </div>
                  <p className="text-surface-300 text-sm leading-relaxed whitespace-pre-line">{battle.problem.description}</p>
                </div>
                {(battle.problem.examples ?? []).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-surface-200 mb-3">Examples</h3>
                    <div className="space-y-3">
                      {battle.problem.examples.map((ex, i) => (
                        <div key={i} className="bg-surface-800 rounded-lg p-3 text-xs font-mono space-y-1">
                          <div><span className="text-surface-400">Input: </span><span className="text-green-400">{ex.input}</span></div>
                          <div><span className="text-surface-400">Output: </span><span className="text-brand-400">{ex.output}</span></div>
                          {ex.explanation && <div className="text-surface-500 pt-1 border-t border-surface-700">{ex.explanation}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {battle.problem.constraints && (
                  <div>
                    <h3 className="text-sm font-semibold text-surface-200 mb-2">Constraints</h3>
                    <pre className="text-xs text-surface-400 bg-surface-800 rounded-lg p-3 whitespace-pre-wrap font-mono">{battle.problem.constraints}</pre>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {(battle.problem.tags ?? battle.problem.topics ?? []).map((tag: string) => (
                    <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-surface-200 mb-3">Test Results</h3>
                {runMessage && (
                  <div className={`p-3 rounded-lg text-xs mb-2 ${
                    runMessage.includes('passed') ? 'bg-green-900/30 text-green-300 border border-green-700'
                    : 'bg-red-900/30 text-red-300 border border-red-700'
                  }`}>{runMessage}</div>
                )}
                {testResults.length === 0 && !isRunning && (
                  <p className="text-surface-500 text-sm py-4 text-center">Click ▶ Run to test your solution against sample cases.</p>
                )}
                {testResults.map((t, i) => (
                  <div key={i} className={`p-3 rounded-lg border text-sm ${
                    t.status === 'passed' ? 'border-green-600 bg-green-900/20' :
                    t.status === 'error'  ? 'border-yellow-600 bg-yellow-900/20' :
                    t.status === 'failed' ? 'border-red-600 bg-red-900/20' :
                    'border-surface-700 bg-surface-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-surface-400 font-medium">Case {i + 1}</span>
                      {t.status === 'passed' && <span className="text-green-400 text-xs font-medium">✓ Passed {t.timeMs ? `(${t.timeMs}ms)` : ''}</span>}
                      {t.status === 'failed' && <span className="text-red-400 text-xs font-medium">✗ Failed</span>}
                      {t.status === 'error'  && <span className="text-yellow-400 text-xs font-medium">⚠ Error</span>}
                    </div>
                    <div className="font-mono text-xs space-y-1">
                      <div><span className="text-surface-500">Input: </span><span className="text-surface-300">{t.input}</span></div>
                      <div><span className="text-surface-500">Expected: </span><span className="text-green-400">{t.expected}</span></div>
                      {t.actual !== undefined && (
                        <div><span className="text-surface-500">Got: </span><span className={t.passed ? 'text-green-400' : 'text-red-400'}>{t.actual}</span></div>
                      )}
                      {t.error && t.error !== 'wrong answer' && (
                        <div className="text-yellow-400 mt-1">{t.error}</div>
                      )}
                    </div>
                  </div>
                ))}
                {isRunning && (
                  <div className="text-center text-surface-400 py-4 animate-pulse">⟳ Running test cases...</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-surface-800 border-b border-surface-700 shrink-0">
            <span className="text-xs text-surface-400 font-mono">
              {language === 'javascript' ? 'solution.js' : language === 'python' ? 'solution.py' : 'solution'}
            </span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 flex">
              <div className="bg-surface-900 text-surface-600 text-xs font-mono py-4 pl-3 pr-2 select-none border-r border-surface-800 overflow-hidden" style={{ minWidth: '3rem' }}>
                {code.split('\n').map((_, i) => <div key={i} className="leading-6">{i + 1}</div>)}
              </div>
              <textarea
                className="flex-1 bg-surface-950 text-surface-100 font-mono text-sm p-4 resize-none outline-none leading-6 overflow-auto"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                style={{ tabSize: 2 }}
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
        </div>
      </div>

      {/* ── Battle Result Modal ── */}
      <Modal isOpen={showResult} onClose={() => {}} title="" size="md">
        {result && (
          <div className="text-center py-4">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-4 ${
              result.isVictory ? 'bg-practice-100 dark:bg-practice-900/30' : 'bg-duel-100 dark:bg-duel-900/30'
            }`}>
              {result.isVictory ? '🏆' : '😤'}
            </div>
            <h2 className={`text-3xl font-extrabold mb-1 ${result.isVictory ? 'text-practice-500' : 'text-duel-500'}`}>
              {result.isVictory ? 'VICTORY!' : 'DEFEAT'}
            </h2>
            <p className="text-surface-500 dark:text-surface-400 mb-6">
              {result.isVictory ? 'You solved it first!' : 'Better luck next time!'}
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                <p className={`text-2xl font-bold ${(result.ratingChange ?? 0) >= 0 ? 'text-practice-500' : 'text-duel-500'}`}>
                  {(result.ratingChange ?? 0) > 0 ? '+' : ''}{result.ratingChange ?? 0}
                </p>
                <p className="text-xs text-surface-500 mt-1">Rating Δ</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                <p className="text-2xl font-bold text-brand-500">+{result.xpGained ?? 0}</p>
                <p className="text-xs text-surface-500 mt-1">XP Earned</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                <p className="text-2xl font-bold text-adaptive-500">
                  {Math.floor((result.duration || 0) / 60)}m {(result.duration || 0) % 60}s
                </p>
                <p className="text-xs text-surface-500 mt-1">Time</p>
              </div>
            </div>
            {(result.streak ?? 0) > 1 && (
              <div className="mb-6 p-3 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
                <p className="text-warning-700 dark:text-warning-300 font-medium">🔥 {result.streak} Win Streak!</p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate(-1)}>Back to Duels</Button>
              <Button variant="primary" onClick={() => { setShowResult(false); navigate(-1); }}>Find New Battle</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
