import { useAuth } from '@context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Avatar } from '@components/ui/Avatar';
import { RatingCard } from '@components/ui/RatingCard';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Tabs, TabsList, TabTrigger, TabPanel } from '@components/ui/Tabs';
import { mockStudent } from '@services/mockData';
import { cn, formatRating } from '@utils';

export function ProfilePage() {
  const { user } = useAuth();
  const student = user as typeof mockStudent;

  const achievements = [
    { id: '1', name: 'First Blood', description: 'Win your first duel', icon: '⚔️', earned: true, date: 'Jan 15, 2024' },
    { id: '2', name: 'Problem Solver', description: 'Solve 50 problems', icon: '💻', earned: true, date: 'Feb 3, 2024' },
    { id: '3', name: 'Streak Master', description: 'Maintain a 7-day streak', icon: '🔥', earned: true, date: 'Mar 10, 2024' },
    { id: '4', name: 'Adaptive Learner', description: 'Complete 10 adaptive sessions', icon: '🧠', earned: false, progress: 3 },
    { id: '5', name: 'Centurion', description: 'Reach 100 total wins', icon: '💯', earned: false, progress: 52 },
    { id: '6', name: 'Grandmaster', description: 'Reach 2500 rating in any mode', icon: '👑', earned: false, progress: 65 },
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
            <Avatar name={student?.name || 'User'} size="2xl" />
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white">{student?.name}</h2>
                <Badge variant={student?.role || 'student'} size="md" dot>
                  {(student?.role || 'student').charAt(0).toUpperCase() + (student?.role || 'student').slice(1)}
                </Badge>
              </div>
              <p className="text-surface-600 dark:text-surface-400">{student?.email}</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">Member since {new Date(student?.createdAt || '').toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{student?.statistics?.totalXp?.toLocaleString() || 0}</p>
                <p className="text-sm text-surface-500 dark:text-surface-400">Total XP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-practice-600 dark:text-practice-400">{student?.statistics?.currentStreak || 0}</p>
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
                  rating={student?.duelRating?.rating || 0}
                  level={student?.duelRating?.level || 1}
                  xp={student?.duelRating?.xp || 0}
                  xpToNextLevel={student?.duelRating?.xpToNextLevel || 0}
                  weeklyXpGain={student?.duelRating?.weeklyXpGain || 0}
                  trend={student?.duelRating?.trend || 'stable'}
                  rank={student?.duelRating?.rank}
                  percentile={student?.duelRating?.percentile}
                />
                <RatingCard
                  type="practice"
                  rating={student?.practiceRating?.rating || 0}
                  level={student?.practiceRating?.level || 1}
                  xp={student?.practiceRating?.xp || 0}
                  xpToNextLevel={student?.practiceRating?.xpToNextLevel || 0}
                  weeklyXpGain={student?.practiceRating?.weeklyXpGain || 0}
                  trend={student?.practiceRating?.trend || 'stable'}
                  rank={student?.practiceRating?.rank}
                  percentile={student?.practiceRating?.percentile}
                />
                <RatingCard
                  type="adaptive"
                  rating={student?.adaptiveRating?.rating || 0}
                  level={student?.adaptiveRating?.level || 1}
                  xp={student?.adaptiveRating?.xp || 0}
                  xpToNextLevel={student?.adaptiveRating?.xpToNextLevel || 0}
                  weeklyXpGain={student?.adaptiveRating?.weeklyXpGain || 0}
                  trend={student?.adaptiveRating?.trend || 'stable'}
                  rank={student?.adaptiveRating?.rank}
                  percentile={student?.adaptiveRating?.percentile}
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
                <StatItem label="Total Battles" value={student?.statistics?.totalBattles || 0} icon="⚔️" color="duel" />
                <StatItem label="Battles Won" value={student?.statistics?.battlesWon || 0} icon="🏆" color="success" />
                <StatItem label="Battles Lost" value={student?.statistics?.battlesLost || 0} icon="💀" color="danger" />
                <StatItem label="Win Rate" value={`${student?.statistics?.winRate || 0}%`} icon="📊" color="brand" />
                <StatItem label="Problems Solved" value={student?.statistics?.problemsSolved || 0} icon="✅" color="practice" />
                <StatItem label="Problems Attempted" value={student?.statistics?.problemsAttempted || 0} icon="📝" color="primary" />
                <StatItem label="Adaptive Sessions" value={student?.statistics?.adaptiveSessions || 0} icon="🧠" color="adaptive" />
                <StatItem label="Max Streak" value={`${student?.statistics?.maxStreak || 0} days`} icon="🔥" color="warning" />
                <StatItem label="Average Rating" value={formatRating(student?.statistics?.averageRating || 0)} icon="📈" color="brand" />
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