import { useState, useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { RatingCard } from '@components/ui/RatingCard';
import { StatCard, StatGrid } from '@components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import type { StudentUser } from '@types';
import { formatRating, cn } from '@utils';
import { NavLink } from 'react-router-dom';
import { Icon } from '@components/ui/Icon';
import { analyticsService } from '@services/analyticsService';

export function PersonalDashboard() {
  const { user } = useAuth();
  const personal = user as StudentUser;

  const [recentActivity, setRecentActivity] = useState<
    Array<{ type: string; title: string; detail: string; color: string; icon: string }>
  >([
    { type: 'duel', title: 'Won Duel vs CodeMaster99', detail: '+32 Rating • 45 min ago', color: 'duel', icon: 'target' },
    { type: 'practice', title: 'Solved "Median of Two Arrays"', detail: '+200 XP • 3h ago', color: 'practice', icon: 'code' },
    { type: 'adaptive', title: 'Completed Adaptive Session', detail: '+112 XP • 6h ago', color: 'adaptive', icon: 'brain' },
    { type: 'duel', title: 'Won Duel vs AlgoExpert', detail: '+18 Rating • 1d ago', color: 'duel', icon: 'target' },
    { type: 'achievement', title: 'Earned "Platinum Climber"', detail: 'Reached Platinum I • 2d ago', color: 'brand', icon: 'trophy' },
  ]);

  useEffect(() => {
    let cancelled = false;
    analyticsService
      .getActivityFeed(user?.id ?? '', 5)
      .then((events) => {
        if (cancelled) return;
        setRecentActivity(
          events.map((e) => ({
            type: e.type,
            title: `${e.userName} ${e.description}`,
            detail: new Date(e.timestamp).toLocaleString(),
            color: e.type === 'battle' ? 'duel' : e.type === 'problem' ? 'practice' : e.type === 'adaptive' ? 'adaptive' : 'brand',
            icon: e.type === 'battle' ? 'target' : e.type === 'problem' ? 'code' : e.type === 'adaptive' ? 'brain' : 'trophy',
          }))
        );
      })
      .catch(() => {/* keep placeholder data on error */});
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">
            Welcome back, {personal?.name.split(' ')[0] || 'Coder'}!
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Your personal coding journey across three independent systems
          </p>
        </div>
        <div className="flex gap-2">
          <NavLink to="/personal/duel">
            <Button variant="outline" leftIcon={<Icon name="target" />}>Find Battle</Button>
          </NavLink>
          <NavLink to="/personal/practice">
            <Button variant="primary" leftIcon={<Icon name="code" />}>Start Practice</Button>
          </NavLink>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RatingCard
          type="duel"
          rating={personal?.duelRating.rating || 0}
          level={personal?.duelRating.level || 1}
          xp={personal?.duelRating.xp || 0}
          xpToNextLevel={personal?.duelRating.xpToNextLevel || 0}
          weeklyXpGain={personal?.duelRating.weeklyXpGain || 0}
          trend={personal?.duelRating.trend || 'stable'}
          rank={personal?.duelRating.rank}
          percentile={personal?.duelRating.percentile}
        />
        <RatingCard
          type="practice"
          rating={personal?.practiceRating.rating || 0}
          level={personal?.practiceRating.level || 1}
          xp={personal?.practiceRating.xp || 0}
          xpToNextLevel={personal?.practiceRating.xpToNextLevel || 0}
          weeklyXpGain={personal?.practiceRating.weeklyXpGain || 0}
          trend={personal?.practiceRating.trend || 'stable'}
          rank={personal?.practiceRating.rank}
          percentile={personal?.practiceRating.percentile}
        />
        <RatingCard
          type="adaptive"
          rating={personal?.adaptiveRating.rating || 0}
          level={personal?.adaptiveRating.level || 1}
          xp={personal?.adaptiveRating.xp || 0}
          xpToNextLevel={personal?.adaptiveRating.xpToNextLevel || 0}
          weeklyXpGain={personal?.adaptiveRating.weeklyXpGain || 0}
          trend={personal?.adaptiveRating.trend || 'stable'}
          rank={personal?.adaptiveRating.rank}
          percentile={personal?.adaptiveRating.percentile}
        />
      </div>

      {/* Main Content: Performance Overview (Left 2 cols) & Activity/Actions (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Clear Statistics & Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                Performance Breakdown
              </h2>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Independent stats for 1v1 duels, problem solving, and AI adaptive practice
              </p>
            </div>
            <span className="text-xs font-medium text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full">
              Personal Pro Track
            </span>
          </div>

          {/* 6 Clear, Well-Organized Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <StatCard
              label="1v1 Battle Record"
              value={`${personal?.statistics.battlesWon || 0}W - ${personal?.statistics.battlesLost || 0}L`}
              subtitle={`${personal?.statistics.totalBattles || 0} competitive duels`}
              icon={<Icon name="sword" />}
              variant="danger"
              progress={{
                value: personal?.statistics.battlesWon || 0,
                max: personal?.statistics.totalBattles || 1,
                label: 'Win Distribution'
              }}
            />

            <StatCard
              label="Duel Win Rate"
              value={`${personal?.statistics.winRate || 0}%`}
              subtitle="Ranked match victory rate"
              icon={<Icon name="trophy" />}
              trend="up"
              trendValue="+1.8% this week"
              variant="success"
              progress={{
                value: personal?.statistics.winRate || 0,
                max: 100,
                label: 'Rate'
              }}
            />

            <StatCard
              label="Practice Problems"
              value={personal?.statistics.problemsSolved || 0}
              subtitle={`${personal?.statistics.problemsAttempted || 0} attempted`}
              icon={<Icon name="code" />}
              variant="primary"
              progress={{
                value: personal?.statistics.problemsSolved || 0,
                max: personal?.statistics.problemsAttempted || 1,
                label: 'Completion'
              }}
            />

            <StatCard
              label="Adaptive Sessions"
              value={personal?.statistics.adaptiveSessions || 0}
              subtitle="AI-tailored practice runs"
              icon={<Icon name="brain" />}
              variant="adaptive"
            />

            <StatCard
              label="Daily Streak"
              value={`${personal?.statistics.currentStreak || 0} Days`}
              subtitle={`Personal best: ${personal?.statistics.maxStreak || 0} days`}
              icon={<Icon name="flame" />}
              trend="up"
              trendValue="Active today"
              variant="warning"
            />

            <StatCard
              label="Cumulative XP"
              value={(personal?.statistics.totalXp || 0).toLocaleString()}
              subtitle="Across all three systems"
              icon={<Icon name="zap" />}
              variant="brand"
            />
          </div>
        </div>

        {/* Right 1 Column: Activity Feed & Quick Actions */}
        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader className="pb-3 border-b border-surface-200/50 dark:border-surface-700/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-duel-500"></span>
                  Recent Activity
                </CardTitle>
                <span className="text-xs text-surface-400">Live feed</span>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="space-y-2.5">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer border border-transparent hover:border-surface-200/60 dark:hover:border-surface-700/60',
                      index === 0 && 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-200/40 dark:border-brand-800/40'
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0',
                      activity.color === 'duel' && 'bg-duel-100 dark:bg-duel-900/30 text-duel-600 dark:text-duel-400',
                      activity.color === 'practice' && 'bg-practice-100 dark:bg-practice-900/30 text-practice-600 dark:text-practice-400',
                      activity.color === 'adaptive' && 'bg-adaptive-100 dark:bg-adaptive-900/30 text-adaptive-600 dark:text-adaptive-400',
                      activity.color === 'brand' && 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                    )}>
                      <Icon name={activity.icon} size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs text-surface-900 dark:text-white truncate">{activity.title}</p>
                      <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5">{activity.detail}</p>
                    </div>
                    <Badge variant={activity.color as any} size="sm" dot>
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-surface-200/50 dark:border-surface-700/50 text-center">
                <NavLink to="/personal/profile">
                  <Button variant="ghost" size="sm" className="w-full text-xs">View Full Activity History →</Button>
                </NavLink>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader className="pb-3 border-b border-surface-200/50 dark:border-surface-700/50">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5">
              <NavLink to="/personal/duel">
                <div className="w-full flex items-center gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors text-left group">
                  <div className="w-10 h-10 rounded-lg bg-duel-100 dark:bg-duel-900/30 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform">⚔️</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-surface-900 dark:text-white">Find a Duel</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 truncate">Real-time 1v1 coding battle</p>
                  </div>
                </div>
              </NavLink>
              <NavLink to="/personal/practice">
                <div className="w-full flex items-center gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors text-left group">
                  <div className="w-10 h-10 rounded-lg bg-practice-100 dark:bg-practice-900/30 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform">💻</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-surface-900 dark:text-white">Practice Problems</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 truncate">Solve algorithmic challenges</p>
                  </div>
                </div>
              </NavLink>
              <NavLink to="/personal/adaptive">
                <div className="w-full flex items-center gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors text-left group">
                  <div className="w-10 h-10 rounded-lg bg-adaptive-100 dark:bg-adaptive-900/30 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform">🧠</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-surface-900 dark:text-white">Adaptive Session</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 truncate">AI-powered personalized practice</p>
                  </div>
                </div>
              </NavLink>
              <NavLink to="/personal/leaderboard">
                <div className="w-full flex items-center gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors text-left group">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform">🏆</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-surface-900 dark:text-white">Leaderboards</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 truncate">Check your global ranking</p>
                  </div>
                </div>
              </NavLink>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}