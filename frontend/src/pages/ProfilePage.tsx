import { useAuth } from '@context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Avatar } from '@components/ui/Avatar';
import { RatingCard } from '@components/ui/RatingCard';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Tabs, TabsList, TabTrigger, TabPanel } from '@components/ui/Tabs';
import type { StudentUser } from '@types';
import { cn, formatRating } from '@utils';

// ── Achievement computation ────────────────────────────────────────────────
// Achievements are derived from real user statistics stored in MongoDB.
// No hardcoded dates or fake progress — everything is calculated live.
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: number; // 0–100 when unearned
}

function computeAchievements(s: StudentUser): Achievement[] {
  const stats   = s.statistics;
  const duel    = s.duelRating;
  const practice = s.practiceRating;
  const adaptive = s.adaptiveRating;
  const maxRating = Math.max(duel?.rating ?? 0, practice?.rating ?? 0, adaptive?.rating ?? 0);

  return [
    {
      id: 'first-blood',
      name: 'First Blood',
      description: 'Win your first duel',
      icon: '⚔️',
      earned: (stats?.battlesWon ?? 0) >= 1,
      progress: Math.min(100, ((stats?.battlesWon ?? 0) / 1) * 100),
    },
    {
      id: 'problem-solver',
      name: 'Problem Solver',
      description: 'Solve 50 problems',
      icon: '💻',
      earned: (stats?.problemsSolved ?? 0) >= 50,
      progress: Math.min(100, Math.round(((stats?.problemsSolved ?? 0) / 50) * 100)),
    },
    {
      id: 'streak-master',
      name: 'Streak Master',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      earned: (stats?.maxStreak ?? 0) >= 7,
      progress: Math.min(100, Math.round(((stats?.maxStreak ?? 0) / 7) * 100)),
    },
    {
      id: 'adaptive-learner',
      name: 'Adaptive Learner',
      description: 'Complete 10 adaptive sessions',
      icon: '🧠',
      earned: (stats?.adaptiveSessions ?? 0) >= 10,
      progress: Math.min(100, Math.round(((stats?.adaptiveSessions ?? 0) / 10) * 100)),
    },
    {
      id: 'centurion',
      name: 'Centurion',
      description: 'Reach 100 total duel wins',
      icon: '💯',
      earned: (stats?.battlesWon ?? 0) >= 100,
      progress: Math.min(100, Math.round(((stats?.battlesWon ?? 0) / 100) * 100)),
    },
    {
      id: 'grandmaster',
      name: 'Grandmaster',
      description: 'Reach 2000 rating in any mode',
      icon: '👑',
      earned: maxRating >= 2000,
      progress: Math.min(100, Math.round(((maxRating - 1200) / (2000 - 1200)) * 100)),
    },
  ];
}

export function ProfilePage() {
  const { user } = useAuth();
  const student = user as StudentUser;

  const achievements = student ? computeAchievements(student) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">Profile</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">Manage your account and track achievements</p>
        </div>
        <Button variant="outline">Edit Profile</Button>
      </div>

      <Card variant="glass">
        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6">
            <Avatar name={student?.name || 'User'} size="2xl" />
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white">{student?.name}</h2>
                <Badge variant={student?.role || 'student'} size="md" dot>
                  {(student?.role || 'student').charAt(0).toUpperCase() + (student?.role || 'student').slice(1)}
                </Badge>
              </div>
              <p className="text-surface-600 dark:text-surface-400">{student?.email}</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">
                Member since {new Date(student?.createdAt || '').toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                  {student?.statistics?.totalXp?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-surface-500 dark:text-surface-400">Total XP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-practice-600 dark:text-practice-400">
                  {student?.statistics?.currentStreak || 0}
                </p>
                <p className="text-sm text-surface-500 dark:text-surface-400">Day Streak</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {achievements.filter((a) => a.earned).length}/{achievements.length}
                </p>
                <p className="text-sm text-surface-500 dark:text-surface-400">Achievements</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="ratings" variant="line">
            <TabsList aria-label="Profile sections">
              <TabTrigger value="ratings"      leftIcon={<span>📊</span>}>Ratings</TabTrigger>
              <TabTrigger value="achievements" leftIcon={<span>🏆</span>}>
                Achievements
                {achievements.filter((a) => a.earned).length > 0 && (
                  <Badge variant="success" size="sm" className="ml-2">
                    {achievements.filter((a) => a.earned).length}
                  </Badge>
                )}
              </TabTrigger>
              <TabTrigger value="stats" leftIcon={<span>📈</span>}>Statistics</TabTrigger>
            </TabsList>

            {/* ── Ratings ── */}
            <TabPanel value="ratings" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RatingCard
                  type="duel"
                  rating={student?.duelRating?.rating || 0}
                  level={student?.duelRating?.level || 1}
                  xp={student?.duelRating?.xp || 0}
                  xpToNextLevel={student?.duelRating?.xpToNextLevel || 0}
                  weeklyXpGain={student?.duelRating?.weeklyXpGain || 0}
                  trend={student?.duelRating?.trend || 'stable'}
                />
                <RatingCard
                  type="practice"
                  rating={student?.practiceRating?.rating || 0}
                  level={student?.practiceRating?.level || 1}
                  xp={student?.practiceRating?.xp || 0}
                  xpToNextLevel={student?.practiceRating?.xpToNextLevel || 0}
                  weeklyXpGain={student?.practiceRating?.weeklyXpGain || 0}
                  trend={student?.practiceRating?.trend || 'stable'}
                />
                <RatingCard
                  type="adaptive"
                  rating={student?.adaptiveRating?.rating || 0}
                  level={student?.adaptiveRating?.level || 1}
                  xp={student?.adaptiveRating?.xp || 0}
                  xpToNextLevel={student?.adaptiveRating?.xpToNextLevel || 0}
                  weeklyXpGain={student?.adaptiveRating?.weeklyXpGain || 0}
                  trend={student?.adaptiveRating?.trend || 'stable'}
                />
              </div>

              {/* Rating independence note */}
              <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800">
                <p className="text-sm text-brand-700 dark:text-brand-300">
                  <span className="font-semibold">Three independent ladders.</span> Duel, Practice, and Adaptive ratings
                  are completely separate — activity in one system never affects the others.
                </p>
              </div>
            </TabPanel>

            {/* ── Achievements — computed from real stats ── */}
            <TabPanel value="achievements" className="mt-6">
              {achievements.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-surface-500">Start solving problems and battling to unlock achievements!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((ach) => (
                    <Card
                      key={ach.id}
                      variant="outlined"
                      className={cn('transition-all', !ach.earned && 'opacity-60 grayscale')}
                    >
                      <CardContent className="pt-0 p-6">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              'w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0',
                              ach.earned
                                ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                : 'bg-surface-100 dark:bg-surface-800'
                            )}
                          >
                            {ach.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-surface-900 dark:text-white">{ach.name}</h4>
                            <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{ach.description}</p>
                            {ach.earned ? (
                              <p className="text-xs text-practice-600 dark:text-practice-400 mt-2 font-medium">
                                ✓ Earned
                              </p>
                            ) : (
                              <div className="mt-2">
                                <ProgressBar
                                  value={ach.progress ?? 0}
                                  max={100}
                                  size="sm"
                                  variant="brand"
                                  showLabel
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabPanel>

            {/* ── Statistics ── */}
            <TabPanel value="stats" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatItem label="Total Battles"       value={student?.statistics?.totalBattles    || 0}                              icon="⚔️" />
                <StatItem label="Battles Won"          value={student?.statistics?.battlesWon       || 0}                              icon="🏆" />
                <StatItem label="Battles Lost"         value={student?.statistics?.battlesLost      || 0}                              icon="💀" />
                <StatItem label="Win Rate"             value={`${student?.statistics?.winRate       || 0}%`}                           icon="📊" />
                <StatItem label="Problems Solved"      value={student?.statistics?.problemsSolved   || 0}                              icon="✅" />
                <StatItem label="Problems Attempted"   value={student?.statistics?.problemsAttempted || 0}                             icon="📝" />
                <StatItem label="Adaptive Sessions"    value={student?.statistics?.adaptiveSessions  || 0}                             icon="🧠" />
                <StatItem label="Current Streak"       value={`${student?.statistics?.currentStreak  || 0} days`}                      icon="🔥" />
                <StatItem label="Max Streak"           value={`${student?.statistics?.maxStreak      || 0} days`}                      icon="📅" />
                <StatItem label="Total XP"             value={(student?.statistics?.totalXp          || 0).toLocaleString()}            icon="⭐" />
                <StatItem label="Duel Level"           value={student?.duelRating?.level             || 1}                              icon="🥊" />
                <StatItem label="Practice Level"       value={student?.practiceRating?.level         || 1}                              icon="💡" />
              </div>
            </TabPanel>
          </Tabs>
        </div>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <Button variant="outline" fullWidth leftIcon={<span>🔔</span>}>Notifications</Button>
            <Button variant="outline" fullWidth leftIcon={<span>🎨</span>}>Appearance</Button>
            <Button variant="outline" fullWidth leftIcon={<span>⌨️</span>}>Keybindings</Button>
            <Button variant="outline" fullWidth leftIcon={<span>🔒</span>}>Privacy</Button>
            <Button variant="outline" fullWidth leftIcon={<span>🔗</span>}>Connected Accounts</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatItem({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <Card variant="outlined" padding="md">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-lg">
          {icon}
        </div>
        <div>
          <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
          <p className="font-bold text-surface-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}
