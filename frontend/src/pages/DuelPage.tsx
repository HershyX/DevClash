import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Avatar } from '@components/ui/Avatar';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Icon } from '@components/ui/Icon';
import { battleService } from '@services/battleService';
import { useAuth } from '@context/AuthContext';
import type { Battle, BattleParticipant, StudentUser } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@utils';

type DuelView = 'lobby' | 'waiting' | 'matched';

export function DuelPage() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const student    = user as StudentUser | null;

  // ── state ───────────────────────────────────────────────────────────────────
  const [view, setView]                 = useState<DuelView>('lobby');
  const [activeTab, setActiveTab]       = useState<'ranked' | 'casual'>('ranked');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal]     = useState(false);
  const [createdBattle, setCreatedBattle]     = useState<Battle | null>(null);
  const [joinCode, setJoinCode]               = useState('');
  const [joinError, setJoinError]             = useState('');
  const [isLoading, setIsLoading]             = useState(false);
  const [waitingSeconds, setWaitingSeconds]   = useState(0);
  const [matchedBattle, setMatchedBattle]     = useState<Battle | null>(null);
  const [battleHistory, setBattleHistory]     = useState<Battle[]>([]);

  // Role-aware arena path (/student or /personal)
  const role     = user?.role ?? 'student';
  const arenaBase = `/${role}/duel/arena`;

  const userObj = user
    ? { id: user.id, name: user.name, duelRating: (user as StudentUser).duelRating }
    : { id: 'me', name: 'You' };

  // ── Load real battle history on mount ───────────────────────────────────────
  useEffect(() => {
    battleService.getBattles().then(setBattleHistory).catch(() => setBattleHistory([]));
  }, []);

  // ── Waiting timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== 'waiting') return;
    const t = setInterval(() => setWaitingSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [view]);

  // ── Socket.IO: listen for opponent joining while in waiting room ─────────────
  const cleanupSocketRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (view !== 'waiting' || !createdBattle) return;

    let cancelled = false;

    battleService.simulateOpponentProgress(
      createdBattle.id,
      // onProgress handles participant updates — reuse the same socket connection
      () => {}
    ).then((cleanup) => {
      cleanupSocketRef.current = cleanup;
    });

    // Listen for battle:start pushed by the server when someone joins
    (async () => {
      const { io } = await import('socket.io-client');
      const token = localStorage.getItem('devclash_token');
      const url = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
      const sock = (io as any)(url, { auth: { token }, autoConnect: true });

      sock.emit('battle:join', { battleId: createdBattle.id });

      const onStart = (payload: { battleId: string; battle: Battle }) => {
        if (cancelled) return;
        if (payload.battleId === createdBattle.id) {
          // Real opponent joined — server pushed battle:start
          setMatchedBattle(payload.battle);
          setView('matched');
        }
      };

      const onJoined = (payload: { battleId: string; participant: BattleParticipant }) => {
        if (cancelled) return;
        if (payload.battleId === createdBattle.id && payload.participant) {
          // Immediately navigate — don't wait for separate start event
          battleService.getBattle(createdBattle.id).then((b) => {
            if (b && !cancelled) { setMatchedBattle(b); setView('matched'); }
          });
        }
      };

      sock.on('battle:start',  onStart);
      sock.on('battle:joined', onJoined);

      cleanupSocketRef.current = () => {
        sock.off('battle:start',  onStart);
        sock.off('battle:joined', onJoined);
        sock.disconnect();
      };
    })();

    return () => {
      cancelled = true;
      cleanupSocketRef.current?.();
      cleanupSocketRef.current = null;
    };
  }, [view, createdBattle?.id]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCreateBattle = async (isRanked: boolean) => {
    setIsLoading(true);
    setShowCreateModal(false);
    try {
      const battle = await battleService.createCustomBattle(isRanked, userObj);
      setCreatedBattle(battle);
      setWaitingSeconds(0);
      setView('waiting');
    } catch (e: any) {
      alert(e.message || 'Failed to create battle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinBattle = async () => {
    if (!joinCode.trim()) { setJoinError('Enter a battle code'); return; }
    setIsLoading(true);
    setJoinError('');
    try {
      const battle = await battleService.joinCustomBattle(joinCode, userObj);
      setShowJoinModal(false);
      navigate(`${arenaBase}/${battle.id}`);
    } catch (e: any) {
      setJoinError(e.message || 'Battle not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindMatch = async (isRanked: boolean) => {
    setIsLoading(true);
    try {
      const battle = await battleService.findQuickMatch(isRanked, userObj);
      navigate(`${arenaBase}/${battle.id}`);
    } catch (e: any) {
      alert(e.message || 'Failed to find match');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBattle = () => {
    cleanupSocketRef.current?.();
    cleanupSocketRef.current = null;
    setCreatedBattle(null);
    setView('lobby');
  };

  const opponent = matchedBattle?.participants?.find((p) => p.userId !== user?.id);

  // ── Derived stats from real user data ──────────────────────────────────────
  const duelRating    = student?.duelRating?.rating    ?? 0;
  const duelWinRate   = student?.statistics?.winRate   ?? 0;
  const duelStreak    = student?.statistics?.currentStreak ?? 0;
  const totalBattles  = student?.statistics?.totalBattles  ?? 0;
  const battlesWon    = student?.statistics?.battlesWon    ?? 0;
  const totalXp       = student?.statistics?.totalXp       ?? 0;

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">

        {/* ── LOBBY ── */}
        {view === 'lobby' && (
          <motion.div key="lobby" className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">Live 1v1 Duels</h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">Challenge opponents in real-time coding battles</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowJoinModal(true)} leftIcon={<Icon name="code" size={16} />}>Join Battle</Button>
                <Button variant="primary" onClick={() => setShowCreateModal(true)} leftIcon={<span>⚔️</span>}>Create Battle</Button>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
              {(['ranked', 'casual'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn('px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all',
                    activeTab === tab ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm'
                                     : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white')}>
                  {tab === 'ranked' ? '🏆 Ranked' : '🎮 Casual'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Match + Create/Join */}
              <div className="lg:col-span-2 space-y-4">
                <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <Card variant="glass" className="relative overflow-hidden border border-duel-200 dark:border-duel-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-duel-500/10 to-transparent pointer-events-none" />
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-duel-100 dark:bg-duel-900/40 flex items-center justify-center text-3xl">⚔️</div>
                        <div>
                          <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                            {activeTab === 'ranked' ? 'Ranked Match' : 'Casual Match'}
                          </h2>
                          <p className="text-sm text-surface-600 dark:text-surface-400">
                            {activeTab === 'ranked' ? 'Affects your duel rating • Top players' : 'No rating impact • For practice & fun'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        {[{ label: 'Avg Wait', value: '~30s', icon: '⏱️' }, { label: 'Time Limit', value: '30 min', icon: '⌛' }, { label: 'Problems', value: '1 random', icon: '📝' }].map((stat) => (
                          <div key={stat.label} className="text-center p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                            <p className="text-lg">{stat.icon}</p>
                            <p className="font-bold text-surface-900 dark:text-white text-sm">{stat.value}</p>
                            <p className="text-xs text-surface-500">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                      <Button variant="primary" fullWidth size="lg" onClick={() => handleFindMatch(activeTab === 'ranked')} disabled={isLoading} leftIcon={<span>🎯</span>}>
                        {isLoading ? 'Finding Match...' : `Find ${activeTab === 'ranked' ? 'Ranked' : 'Casual'} Match`}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: '🔗', title: 'Create Private Battle', desc: 'Generate a code & invite a friend', onClick: () => setShowCreateModal(true) },
                    { icon: '🚪', title: 'Join with Code',        desc: 'Enter a DC-XXXXX battle code',    onClick: () => setShowJoinModal(true)  },
                  ].map((c) => (
                    <motion.div key={c.title} whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <Card variant="glass" hover className="cursor-pointer" onClick={c.onClick}>
                        <CardContent className="pt-5 text-center">
                          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xl mx-auto mb-3">{c.icon}</div>
                          <h3 className="font-semibold text-surface-900 dark:text-white text-sm mb-1">{c.title}</h3>
                          <p className="text-xs text-surface-500 dark:text-surface-400">{c.desc}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Live stats sidebar — from real user data */}
              <div className="space-y-4">
                <Card variant="glass">
                  <CardHeader><CardTitle>Your Duel Rating</CardTitle></CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="text-center py-2">
                      <p className="text-4xl font-extrabold text-duel-600 dark:text-duel-400">{duelRating}</p>
                      <p className="text-sm text-surface-500 mt-1">Level {student?.duelRating?.level ?? 1}</p>
                    </div>
                    {student?.duelRating && (
                      <ProgressBar
                        value={student.duelRating.xp}
                        max={student.duelRating.xp + (student.duelRating.xpToNextLevel || 1)}
                        variant="duel" size="sm"
                        showLabel label={`${student.duelRating.xp} / ${student.duelRating.xp + (student.duelRating.xpToNextLevel || 1)} XP`}
                      />
                    )}
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                        <p className="text-xl font-bold text-practice-600 dark:text-practice-400">{duelWinRate}%</p>
                        <p className="text-xs text-surface-500">Win Rate</p>
                      </div>
                      <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                        <p className="text-xl font-bold text-warning-600 dark:text-warning-400">🔥{duelStreak}</p>
                        <p className="text-xs text-surface-500">Streak</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="glass">
                  <CardHeader><CardTitle>Season Stats</CardTitle></CardHeader>
                  <CardContent className="pt-0 space-y-2 text-sm">
                    {[
                      { label: 'Battles Played', value: totalBattles },
                      { label: 'Battles Won',    value: battlesWon  },
                      { label: 'Total XP',       value: totalXp.toLocaleString() },
                      { label: 'Duel Level',     value: student?.duelRating?.level ?? 1 },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-surface-100 dark:border-surface-800 last:border-0">
                        <span className="text-surface-600 dark:text-surface-400">{s.label}</span>
                        <span className="font-semibold text-surface-900 dark:text-white">{s.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Battle History — real data from API */}
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Battle History</CardTitle>
                  <Badge variant="default" size="sm">Last {battleHistory.length} battles</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {battleHistory.length === 0 ? (
                  <p className="text-center text-surface-500 py-8">No battles yet. Start your first duel!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-surface-200 dark:border-surface-700">
                          {['Opponent', 'Problem', 'Result', 'Rating Δ', 'Duration', 'Date'].map((h) => (
                            <th key={h} className="text-left p-3 text-xs font-medium text-surface-500 dark:text-surface-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {battleHistory.map((b, i) => {
                          const opponent = b.participants?.find((p) => p.userId !== user?.id);
                          const me       = b.participants?.find((p) => p.userId === user?.id);
                          const isWin    = b.result?.winnerId === user?.id;
                          const delta    = b.result?.ratingChange ?? 0;
                          const duration = b.result?.duration ?? 0;
                          return (
                            <motion.tr key={b.id}
                              className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50"
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Avatar name={opponent?.name ?? 'Bot'} size="sm" />
                                  <span className="font-medium text-surface-900 dark:text-white text-sm">{opponent?.name ?? 'Bot'}</span>
                                </div>
                              </td>
                              <td className="p-3 text-sm text-surface-600 dark:text-surface-400 max-w-[120px] truncate">
                                {(b.problem as any)?.title ?? '—'}
                              </td>
                              <td className="p-3">
                                {b.status === 'completed'
                                  ? <Badge variant={isWin ? 'success' : 'danger'} size="sm" dot>{isWin ? 'Victory' : 'Defeat'}</Badge>
                                  : <Badge variant="default" size="sm">{b.status}</Badge>}
                              </td>
                              <td className="p-3">
                                {b.status === 'completed' && b.isRanked
                                  ? <span className={cn('font-mono font-semibold text-sm', delta >= 0 ? 'text-practice-600' : 'text-duel-600')}>{delta > 0 ? '+' : ''}{delta}</span>
                                  : <span className="text-surface-400 text-sm">Casual</span>}
                              </td>
                              <td className="p-3 text-sm text-surface-600 dark:text-surface-400">
                                {duration ? `${Math.floor(duration / 60)}m ${duration % 60}s` : '—'}
                              </td>
                              <td className="p-3 text-sm text-surface-500">
                                {b.endedAt ? new Date(b.endedAt).toLocaleDateString() : b.startedAt ? new Date(b.startedAt as string).toLocaleDateString() : '—'}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── WAITING ROOM ── */}
        {view === 'waiting' && createdBattle && (
          <motion.div key="waiting" className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Battle Created!</h1>
              <p className="text-surface-600 dark:text-surface-400">Share this code with your opponent</p>
            </div>
            <Card variant="glass" className="w-full max-w-md">
              <CardContent className="pt-6 text-center space-y-6">
                <div>
                  <p className="text-sm text-surface-500 mb-2">Battle Code</p>
                  <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border-2 border-brand-200 dark:border-brand-800">
                    <span className="font-mono text-4xl font-bold tracking-widest text-brand-700 dark:text-brand-300">
                      {createdBattle.battleCode}
                    </span>
                    <button onClick={() => navigator.clipboard?.writeText(createdBattle.battleCode || '')} className="text-brand-500 hover:text-brand-700 transition-colors">
                      <Icon name="copy" size={20} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-6 justify-center">
                  <div className="text-center">
                    <Avatar name={user?.name || 'You'} size="lg" />
                    <p className="text-sm font-medium text-surface-900 dark:text-white mt-2">{user?.name || 'You'}</p>
                    <p className="text-xs text-surface-500">{duelRating}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                      <motion.span className="text-2xl" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>⟳</motion.span>
                    </div>
                    <p className="text-xs text-surface-500 mt-2">{waitingSeconds}s</p>
                  </div>
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-surface-100 dark:bg-surface-800 border-2 border-dashed border-surface-300 dark:border-surface-600 flex items-center justify-center text-2xl">❓</div>
                    <p className="text-sm font-medium text-surface-400 mt-2">Waiting...</p>
                  </div>
                </div>
                <p className="text-sm text-surface-500 dark:text-surface-400 animate-pulse">Waiting for opponent to join...</p>
                <Button variant="ghost" onClick={handleCancelBattle} fullWidth>Cancel Battle</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── MATCHED ── */}
        {view === 'matched' && matchedBattle && (
          <motion.div key="matched" className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="text-6xl">⚔️</motion.div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Opponent Found!</h1>
              <p className="text-surface-600 dark:text-surface-400">Get ready to code!</p>
            </div>
            <div className="flex items-center gap-8">
              <motion.div className="text-center" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <Avatar name={user?.name || 'You'} size="xl" />
                <p className="font-semibold text-surface-900 dark:text-white mt-2">{user?.name}</p>
                <p className="text-sm text-surface-500">{duelRating}</p>
              </motion.div>
              <motion.div className="text-3xl font-extrabold text-duel-500" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}>VS</motion.div>
              <motion.div className="text-center" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <Avatar name={opponent?.name || 'Opponent'} size="xl" />
                <p className="font-semibold text-surface-900 dark:text-white mt-2">{opponent?.name}</p>
                <p className="text-sm text-surface-500">{opponent?.rating}</p>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Button variant="primary" size="lg" onClick={() => navigate(`${arenaBase}/${matchedBattle.id}`)} leftIcon={<span>⚔️</span>}>
                Enter Battle Arena
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Battle Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Battle" size="sm">
        <div className="space-y-4 py-2">
          <p className="text-sm text-surface-600 dark:text-surface-400">Choose your battle type. A unique code will be generated for your opponent to join.</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { ranked: true,  icon: '🏆', label: 'Ranked',  desc: 'Affects rating',   cls: 'border-duel-200 dark:border-duel-800 bg-duel-50 dark:bg-duel-900/20 hover:border-duel-500' },
              { ranked: false, icon: '🎮', label: 'Casual',  desc: 'No rating impact', cls: 'border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 hover:border-brand-500' },
            ].map((opt) => (
              <motion.button key={opt.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => handleCreateBattle(opt.ranked)}
                className={`p-4 rounded-xl border-2 transition-colors text-center ${opt.cls}`}>
                <div className="text-3xl mb-2">{opt.icon}</div>
                <p className="font-semibold text-surface-900 dark:text-white">{opt.label}</p>
                <p className="text-xs text-surface-500 mt-1">{opt.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Join Battle Modal */}
      <Modal isOpen={showJoinModal} onClose={() => { setShowJoinModal(false); setJoinError(''); setJoinCode(''); }} title="Join Battle" size="sm">
        <div className="space-y-4 py-2">
          <p className="text-sm text-surface-600 dark:text-surface-400">Enter the battle code shared by your opponent.</p>
          <Input label="Battle Code" placeholder="DC-XXXXX" value={joinCode}
            onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
            error={joinError} className="font-mono tracking-widest text-center text-lg uppercase"
            onKeyDown={(e) => { if (e.key === 'Enter') handleJoinBattle(); }} />
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setShowJoinModal(false)}>Cancel</Button>
            <Button variant="primary" fullWidth onClick={handleJoinBattle} disabled={isLoading}>
              {isLoading ? 'Joining...' : 'Join Battle'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
