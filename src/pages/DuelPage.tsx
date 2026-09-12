import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Avatar } from '@components/ui/Avatar';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Icon } from '@components/ui/Icon';
import { battleService } from '@services/battleService';
import { useAuth } from '@context/AuthContext';
import type { Battle } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@utils';

type DuelView = 'lobby' | 'waiting' | 'matched';

const mockHistory = [
  { id: '1', opponent: 'Ryan Chen', result: 'won', ratingChange: '+24', date: 'Today, 5:12 PM', duration: '12m 4s', problem: 'Two Sum' },
  { id: '2', opponent: 'Sarah Kim', result: 'lost', ratingChange: '-18', date: 'Today, 3:44 PM', duration: '18m 22s', problem: 'Valid Parentheses' },
  { id: '3', opponent: 'Alex Park', result: 'won', ratingChange: '+31', date: 'Yesterday', duration: '8m 55s', problem: 'Max Subarray' },
  { id: '4', opponent: 'Jordan Lee', result: 'lost', ratingChange: '-12', date: 'Mar 12', duration: '22m 1s', problem: 'Merge Intervals' },
  { id: '5', opponent: 'Priya Nair', result: 'won', ratingChange: '+19', date: 'Mar 11', duration: '15m 38s', problem: 'Linked List Cycle' },
];

export function DuelPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [view, setView] = useState<DuelView>('lobby');
  const [activeTab, setActiveTab] = useState<'ranked' | 'casual'>('ranked');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createdBattle, setCreatedBattle] = useState<Battle | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [matchedBattle, setMatchedBattle] = useState<Battle | null>(null);

  const userObj = user ? { id: user.id, name: user.name, duelRating: (user as any).duelRating } : { id: 'me', name: 'You' };

  // Waiting timer
  useEffect(() => {
    if (view !== 'waiting') return;
    const t = setInterval(() => setWaitingSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [view]);

  // Auto-simulate opponent joining after 5 seconds
  useEffect(() => {
    if (view !== 'waiting' || !createdBattle) return;
    const t = setTimeout(async () => {
      const updated = await battleService.getBattle(createdBattle.id);
      if (updated) {
        // Simulate opponent joining by creating a fake active battle
        setMatchedBattle({ ...createdBattle, status: 'active', participants: [
          ...createdBattle.participants,
          { userId: 'opp-sim', name: 'AlgoNinja_99', rating: 1618, status: 'connected', testCasesPassed: 0, totalTestCases: 5 }
        ]});
        setView('matched');
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [view, createdBattle]);

  const handleCreateBattle = async (isRanked: boolean) => {
    setIsLoading(true);
    setShowCreateModal(false);
    try {
      const battle = await battleService.createCustomBattle(isRanked, userObj);
      setCreatedBattle(battle);
      setWaitingSeconds(0);
      setView('waiting');
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
      navigate(`/student/duel/arena/${battle.id}`);
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
      navigate(`/student/duel/arena/${battle.id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const opponent = matchedBattle?.participants?.find((p) => p.userId !== (user?.id || 'me'));

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* ── LOBBY ── */}
        {view === 'lobby' && (
          <motion.div key="lobby" className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">Live 1v1 Duels</h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">Challenge opponents in real-time coding battles</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowJoinModal(true)} leftIcon={<Icon name="code" size={16} />}>
                  Join Battle
                </Button>
                <Button variant="primary" onClick={() => setShowCreateModal(true)} leftIcon={<span>⚔️</span>}>
                  Create Battle
                </Button>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
              {(['ranked', 'casual'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all',
                    activeTab === tab
                      ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm'
                      : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
                  )}
                >
                  {tab === 'ranked' ? '🏆 Ranked' : '🎮 Casual'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Match Card */}
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
                        {[
                          { label: 'Avg Wait', value: '~30s', icon: '⏱️' },
                          { label: 'Time Limit', value: '30 min', icon: '⌛' },
                          { label: 'Problems', value: '1 random', icon: '📝' },
                        ].map((stat) => (
                          <div key={stat.label} className="text-center p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                            <p className="text-lg">{stat.icon}</p>
                            <p className="font-bold text-surface-900 dark:text-white text-sm">{stat.value}</p>
                            <p className="text-xs text-surface-500">{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      <Button
                        variant="primary"
                        fullWidth
                        size="lg"
                        onClick={() => handleFindMatch(activeTab === 'ranked')}
                        disabled={isLoading}
                        leftIcon={<span>🎯</span>}
                      >
                        {isLoading ? 'Finding Match...' : `Find ${activeTab === 'ranked' ? 'Ranked' : 'Casual'} Match`}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Create / Join row */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <Card variant="glass" hover className="cursor-pointer" onClick={() => setShowCreateModal(true)}>
                      <CardContent className="pt-5 text-center">
                        <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xl mx-auto mb-3">🔗</div>
                        <h3 className="font-semibold text-surface-900 dark:text-white text-sm mb-1">Create Private Battle</h3>
                        <p className="text-xs text-surface-500 dark:text-surface-400">Generate a code & invite a friend</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <Card variant="glass" hover className="cursor-pointer" onClick={() => setShowJoinModal(true)}>
                      <CardContent className="pt-5 text-center">
                        <div className="w-10 h-10 rounded-xl bg-adaptive-100 dark:bg-adaptive-900/30 flex items-center justify-center text-xl mx-auto mb-3">🚪</div>
                        <h3 className="font-semibold text-surface-900 dark:text-white text-sm mb-1">Join with Code</h3>
                        <p className="text-xs text-surface-500 dark:text-surface-400">Enter a DC-XXXXX battle code</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>

              {/* Rating & Stats Sidebar */}
              <div className="space-y-4">
                <Card variant="glass">
                  <CardHeader><CardTitle>Your Duel Rating</CardTitle></CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="text-center py-2">
                      <p className="text-4xl font-extrabold text-duel-600 dark:text-duel-400">
                        {(user as any)?.duelRating?.rating || 1642}
                      </p>
                      <p className="text-sm text-surface-500 mt-1">Gold II • Top 22%</p>
                    </div>
                    <ProgressBar value={65} max={100} variant="duel" size="sm" showLabel label="Gold II → Platinum I" />
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                        <p className="text-xl font-bold text-practice-600 dark:text-practice-400">62%</p>
                        <p className="text-xs text-surface-500">Win Rate</p>
                      </div>
                      <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                        <p className="text-xl font-bold text-warning-600 dark:text-warning-400">🔥7</p>
                        <p className="text-xs text-surface-500">Streak</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="glass">
                  <CardHeader><CardTitle>Season Stats</CardTitle></CardHeader>
                  <CardContent className="pt-0 space-y-2 text-sm">
                    {[
                      { label: 'Battles Played', value: '47' },
                      { label: 'Battles Won', value: '29' },
                      { label: 'Total XP', value: '4,280' },
                      { label: 'Best Rating', value: '1,701' },
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

            {/* Battle History */}
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Battle History</CardTitle>
                  <Badge variant="default" size="sm">Last 5 battles</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-700">
                        {['Opponent', 'Problem', 'Result', 'Rating', 'Duration', 'Date'].map((h) => (
                          <th key={h} className="text-left p-3 text-xs font-medium text-surface-500 dark:text-surface-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mockHistory.map((battle, i) => (
                        <motion.tr
                          key={battle.id}
                          className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={battle.opponent} size="sm" />
                              <span className="font-medium text-surface-900 dark:text-white text-sm">{battle.opponent}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-surface-600 dark:text-surface-400">{battle.problem}</td>
                          <td className="p-3">
                            <Badge variant={battle.result === 'won' ? 'success' : 'danger'} size="sm" dot>
                              {battle.result === 'won' ? 'Victory' : 'Defeat'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className={cn('font-mono font-semibold text-sm', battle.result === 'won' ? 'text-practice-600' : 'text-duel-600')}>
                              {battle.ratingChange}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-surface-600 dark:text-surface-400">{battle.duration}</td>
                          <td className="p-3 text-sm text-surface-500">{battle.date}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── WAITING ROOM ── */}
        {view === 'waiting' && createdBattle && (
          <motion.div key="waiting" className="flex flex-col items-center justify-center min-h-[60vh] space-y-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
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
                    <button
                      onClick={() => navigator.clipboard?.writeText(createdBattle.battleCode || '')}
                      className="text-brand-500 hover:text-brand-700 transition-colors"
                    >
                      <Icon name="copy" size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-6 justify-center">
                  <div className="text-center">
                    <Avatar name={user?.name || 'You'} size="lg" />
                    <p className="text-sm font-medium text-surface-900 dark:text-white mt-2">{user?.name || 'You'}</p>
                    <p className="text-xs text-surface-500">{(user as any)?.duelRating?.rating || 1642}</p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                      <motion.span
                        className="text-2xl"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      >
                        ⟳
                      </motion.span>
                    </div>
                    <p className="text-xs text-surface-500 mt-2">{waitingSeconds}s</p>
                  </div>

                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-surface-100 dark:bg-surface-800 border-2 border-dashed border-surface-300 dark:border-surface-600 flex items-center justify-center text-2xl">❓</div>
                    <p className="text-sm font-medium text-surface-400 mt-2">Waiting...</p>
                  </div>
                </div>

                <p className="text-sm text-surface-500 dark:text-surface-400 animate-pulse">
                  Waiting for opponent to join...
                </p>

                <Button variant="ghost" onClick={() => setView('lobby')} fullWidth>
                  Cancel Battle
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── MATCHED ── */}
        {view === 'matched' && matchedBattle && (
          <motion.div key="matched" className="flex flex-col items-center justify-center min-h-[60vh] space-y-8" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="text-6xl"
            >
              ⚔️
            </motion.div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Opponent Found!</h1>
              <p className="text-surface-600 dark:text-surface-400">Get ready to code!</p>
            </div>

            <div className="flex items-center gap-8">
              <motion.div className="text-center" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <Avatar name={user?.name || 'You'} size="xl" />
                <p className="font-semibold text-surface-900 dark:text-white mt-2">{user?.name}</p>
                <p className="text-sm text-surface-500">{(user as any)?.duelRating?.rating || 1642}</p>
              </motion.div>

              <motion.div className="text-3xl font-extrabold text-duel-500" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}>
                VS
              </motion.div>

              <motion.div className="text-center" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <Avatar name={opponent?.name || 'Opponent'} size="xl" />
                <p className="font-semibold text-surface-900 dark:text-white mt-2">{opponent?.name}</p>
                <p className="text-sm text-surface-500">{opponent?.rating}</p>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(`/student/duel/arena/${matchedBattle.id}`)}
                leftIcon={<span>⚔️</span>}
              >
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
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => handleCreateBattle(true)}
              className="p-4 rounded-xl border-2 border-duel-200 dark:border-duel-800 bg-duel-50 dark:bg-duel-900/20 hover:border-duel-500 transition-colors text-center"
            >
              <div className="text-3xl mb-2">🏆</div>
              <p className="font-semibold text-surface-900 dark:text-white">Ranked</p>
              <p className="text-xs text-surface-500 mt-1">Affects rating</p>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => handleCreateBattle(false)}
              className="p-4 rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 hover:border-brand-500 transition-colors text-center"
            >
              <div className="text-3xl mb-2">🎮</div>
              <p className="font-semibold text-surface-900 dark:text-white">Casual</p>
              <p className="text-xs text-surface-500 mt-1">No rating impact</p>
            </motion.button>
          </div>
        </div>
      </Modal>

      {/* Join Battle Modal */}
      <Modal isOpen={showJoinModal} onClose={() => { setShowJoinModal(false); setJoinError(''); setJoinCode(''); }} title="Join Battle" size="sm">
        <div className="space-y-4 py-2">
          <p className="text-sm text-surface-600 dark:text-surface-400">Enter the battle code shared by your opponent.</p>
          <Input
            label="Battle Code"
            placeholder="DC-XXXXX"
            value={joinCode}
            onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
            error={joinError}
            className="font-mono tracking-widest text-center text-lg uppercase"
            onKeyDown={(e) => { if (e.key === 'Enter') handleJoinBattle(); }}
          />
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