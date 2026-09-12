import { useAuth } from '@context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Avatar } from '@components/ui/Avatar';
import { RatingCard } from '@components/ui/RatingCard';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Tabs, TabsList, TabTrigger, TabPanel } from '@components/ui/Tabs';
import { mockPersonal } from '@services/mockData';
import { cn, formatRating } from '@utils';

export function PersonalProfilePage() {
  const { user } = useAuth();
  const personal = user as typeof mockPersonal;

  const achievements = [
    { id: '1', name: 'First Blood', description: 'Win your first duel', icon: '⚔️', earned: true, date: 'Feb 20, 2024' },
    { id: '2', name: 'Problem Solver', description: 'Solve 50 problems', icon: '💻', earned: true, date: 'Mar 1, 2024' },
    { id: '3', name: 'Streak Master', description: 'Maintain a 7-day streak', icon: '🔥', earned: true, date: 'Mar 8, 2024' },
    { id: '4', name: 'Centurion', description: 'Reach 100 total wins', icon: '💯', earned: true, date: 'Mar 12, 2024' },
    { id: '5', name: 'Platinum Climber', description: 'Reach Platinum in Duel', icon: '🏆', earned: true, date: 'Mar 14, 2024' },
    { id: '6', name: 'Grandmaster', description: 'Reach 2500 rating in any mode', icon: '👑', earned: false, progress: 72 },
  ];

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
            <Avatar name={personal?.name || 'User'} size="2xl" />
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white">{personal?.name}</h2>
                <Badge variant={personal?.role || 'personal'} size="md" dot>
                  {(personal?.role || 'personal').charAt(0).toUpperCase() + (personal?.role || 'personal').slice(1)}
                </Badge>
              </div>
              <p className="text-surface-600 dark:text-surface-400">{personal?.email}</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">Member since {new Date(personal?.createdAt || '').toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{personal?.statistics?.totalXp?.toLocaleString() || 0}</p>
                <p className="text-sm text-surface-500 dark:text-surface-400">Total XP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-practice-600 dark:text-practice-400">{personal?.statistics?.currentStreak || 0}</p>
                <p className="text-sm text-surface-500 dark:text-surface-400">Day Streak</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="ratings" variant="line">
            <TabsList aria-label="Profile sections">
              <TabTrigger value="ratings" leftIcon={<span>📊</span>}>Ratings</TabTrigger>
              <TabTrigger value="achievements" leftIcon={<span>🏆</span>}>Achievements</TabTrigger>
              <TabTrigger value="stats" leftIcon={<span>📈</span>}>Statistics</TabTrigger>
            </TabsList>

            <TabPanel value="ratings" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RatingCard
                  type="duel"
                  rating={personal?.duelRating?.rating || 0}
                  level={personal?.duelRating?.level || 1}
                  xp={personal?.duelRating?.xp || 0}
                  xpToNextLevel={personal?.duelRating?.xpToNextLevel || 0}
                  weeklyXpGain={personal?.duelRating?.weeklyXpGain || 0}
                  trend={personal?.duelRating?.trend || 'stable'}
                  rank={personal?.duelRating?.rank}
                  percentile={personal?.duelRating?.percentile}
                />
                <RatingCard
                  type="practice"
                  rating={personal?.practiceRating?.rating || 0}
                  level={personal?.practiceRating?.level || 1}
                  xp={personal?.practiceRating?.xp || 0}
                  xpToNextLevel={personal?.practiceRating?.xpToNextLevel || 0}
                  weeklyXpGain={personal?.practiceRating?.weeklyXpGain || 0}
                  trend={personal?.practiceRating?.trend || 'stable'}
                  rank={personal?.practiceRating?.rank}
                  percentile={personal?.practiceRating?.percentile}
                />
                <RatingCard
                  type="adaptive"
                  rating={personal?.adaptiveRating?.rating || 0}
                  level={personal?.adaptiveRating?.level || 1}
                  xp={personal?.adaptiveRating?.xp || 0}
                  xpToNextLevel={personal?.adaptiveRating?.xpToNextLevel || 0}
                  weeklyXpGain={personal?.adaptiveRating?.weeklyXpGain || 0}
                  trend={personal?.adaptiveRating?.trend || 'stable'}
                  rank={personal?.adaptiveRating?.rank}
                  percentile={personal?.adaptiveRating?.percentile}
                />
              </div>
            </TabPanel>

            <TabPanel value="achievements" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <Card key={achievement.id} variant="outlined" className={cn('transition-all', !achievement.earned && 'opacity-60 grayscale')}>
                    <CardContent className="pt-0 p-6">
                      <div className="flex items-start gap-4">
                        <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0', achievement.earned ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-surface-100 dark:bg-surface-800')}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-surface-900 dark:text-white">{achievement.name}</h4>
                          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{achievement.description}</p>
                          {achievement.earned ? (
                            <p className="text-xs text-practice-600 dark:text-practice-400 mt-2">Earned {achievement.date}</p>
                          ) : (
                            <div className="mt-2">
                              <ProgressBar value={achievement.progress || 0} max={100} size="sm" variant="brand" showLabel />
                              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{achievement.progress}% complete</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabPanel>

            <TabPanel value="stats" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatItem label="Total Battles" value={personal?.statistics?.totalBattles || 0} icon="⚔️" color="duel" />
                <StatItem label="Battles Won" value={personal?.statistics?.battlesWon || 0} icon="🏆" color="success" />
                <StatItem label="Battles Lost" value={personal?.statistics?.battlesLost || 0} icon="💀" color="danger" />
                <StatItem label="Win Rate" value={`${personal?.statistics?.winRate || 0}%`} icon="📊" color="brand" />
                <StatItem label="Problems Solved" value={personal?.statistics?.problemsSolved || 0} icon="✅" color="practice" />
                <StatItem label="Problems Attempted" value={personal?.statistics?.problemsAttempted || 0} icon="📝" color="primary" />
                <StatItem label="Adaptive Sessions" value={personal?.statistics?.adaptiveSessions || 0} icon="🧠" color="adaptive" />
                <StatItem label="Max Streak" value={`${personal?.statistics?.maxStreak || 0} days`} icon="🔥" color="warning" />
                <StatItem label="Average Rating" value={formatRating(personal?.statistics?.averageRating || 0)} icon="📈" color="brand" />
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
            <Button variant="ghost" fullWidth className="text-duel-600 dark:text-duel-400 hover:bg-duel-50 dark:hover:bg-duel-900/20" leftIcon={<span>🚪</span>}>Sign Out</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatItem({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <Card variant="outlined" padding="md">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-lg">{icon}</div>
        <div>
          <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
          <p className="font-bold text-surface-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}