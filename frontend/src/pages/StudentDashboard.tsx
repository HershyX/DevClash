import { useState, useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { RatingCard } from '@components/ui/RatingCard';
import { StatCard, StatGrid } from '@components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { formatRating, cn } from '@utils';
import type { StudentUser } from '@types';
import { analyticsService } from '@services/analyticsService';
import { NavLink } from 'react-router-dom';
import { Icon } from '@components/ui/Icon';
import { motion } from 'framer-motion';

export function StudentDashboard() {
  const { user } = useAuth();
  const student = user as StudentUser;

  const [recentActivity, setRecentActivity] = useState<
    Array<{ type: string; title: string; detail: string; color: string; icon: string }>
  >([
    { type: 'duel', title: 'Won Duel vs Ryan Chen', detail: '+24 Rating • 12 min ago', color: 'duel', icon: 'target' },
    { type: 'practice', title: 'Solved "Longest Substring"', detail: '+120 XP • 2h ago', color: 'practice', icon: 'code' },
    { type: 'adaptive', title: 'Completed Adaptive Session', detail: '+67 XP • 5h ago', color: 'adaptive', icon: 'brain' },
    { type: 'duel', title: 'Lost Duel vs Sarah Kim', detail: '-18 Rating • 1d ago', color: 'duel', icon: 'target' },
    { type: 'achievement', title: 'Earned "Weekly Warrior"', detail: '7-day streak • 2d ago', color: 'brand', icon: 'trophy' },
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
      .catch(() => setRecentActivity([]));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">
            Welcome back, {student?.name.split(' ')[0] || 'Coder'}!
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Here's your progress across all three rating systems
          </p>
        </div>
        <div className="flex gap-2">
          <NavLink to="/student/duel">
            <Button variant="outline" leftIcon={<Icon name="target" />}>Find Battle</Button>
          </NavLink>
          <NavLink to="/student/practice">
            <Button variant="primary" leftIcon={<Icon name="code" />}>Start Practice</Button>
          </NavLink>
        </div>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <RatingCard
            type="duel"
            rating={student?.duelRating.rating || 0}
            level={student?.duelRating.level || 1}
            xp={student?.duelRating.xp || 0}
            xpToNextLevel={student?.duelRating.xpToNextLevel || 0}
            weeklyXpGain={student?.duelRating.weeklyXpGain || 0}
            trend={student?.duelRating.trend || 'stable'}
            rank={student?.duelRating.rank}
            percentile={student?.duelRating.percentile}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <RatingCard
            type="practice"
            rating={student?.practiceRating.rating || 0}
            level={student?.practiceRating.level || 1}
            xp={student?.practiceRating.xp || 0}
            xpToNextLevel={student?.practiceRating.xpToNextLevel || 0}
            weeklyXpGain={student?.practiceRating.weeklyXpGain || 0}
            trend={student?.practiceRating.trend || 'stable'}
            rank={student?.practiceRating.rank}
            percentile={student?.practiceRating.percentile}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <RatingCard
            type="adaptive"
            rating={student?.adaptiveRating.rating || 0}
            level={student?.adaptiveRating.level || 1}
            xp={student?.adaptiveRating.xp || 0}
            xpToNextLevel={student?.adaptiveRating.xpToNextLevel || 0}
            weeklyXpGain={student?.adaptiveRating.weeklyXpGain || 0}
            trend={student?.adaptiveRating.trend || 'stable'}
            rank={student?.adaptiveRating.rank}
            percentile={student?.adaptiveRating.percentile}
          />
        </motion.div>
      </motion.div>

      {/* Main Content: Performance Overview (Left 2 cols) & Activity/Actions (Right 1 col) */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
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
                Key metrics across duels, practice sets, and adaptive learning
              </p>
            </div>
            <span className="text-xs font-medium text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full">
              Season 1 Active
            </span>
          </div>

          {/* 6 Clear, Well-Organized Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              <StatCard
                label="1v1 Battle Record"
                value={`${student?.statistics.battlesWon || 0}W - ${student?.statistics.battlesLost || 0}L`}
                subtitle={`${student?.statistics.totalBattles || 0} competitive matches`}
                icon={<Icon name="sword" />}
                variant="danger"
                progress={{
                  value: student?.statistics.battlesWon || 0,
                  max: student?.statistics.totalBattles || 1,
                  label: 'Win Distribution'
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.75, duration: 0.3 }}
            >
              <StatCard
                label="Duel Win Rate"
                value={`${student?.statistics.winRate || 0}%`}
                subtitle="Ranked match victory rate"
                icon={<Icon name="trophy" />}
                trend="up"
                trendValue="+2.3% this week"
                variant="success"
                progress={{
                  value: student?.statistics.winRate || 0,
                  max: 100,
                  label: 'Rate'
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
            >
              <StatCard
                label="Practice Problems"
                value={student?.statistics.problemsSolved || 0}
                subtitle={`${student?.statistics.problemsAttempted || 0} attempted`}
                icon={<Icon name="code" />}
                variant="primary"
                progress={{
                  value: student?.statistics.problemsSolved || 0,
                  max: student?.statistics.problemsAttempted || 1,
                  label: 'Completion'
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.85, duration: 0.3 }}
            >
              <StatCard
                label="Adaptive Sessions"
                value={student?.statistics.adaptiveSessions || 0}
                subtitle="AI-tailored practice runs"
                icon={<Icon name="brain" />}
                variant="adaptive"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.3 }}
            >
              <StatCard
                label="Daily Streak"
                value={`${student?.statistics.currentStreak || 0} Days`}
                subtitle={`Personal best: ${student?.statistics.maxStreak || 0} days`}
                icon={<Icon name="flame" />}
                trend="up"
                trendValue="Active today"
                variant="warning"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.95, duration: 0.3 }}
            >
              <StatCard
                label="Cumulative XP"
                value={(student?.statistics.totalXp || 0).toLocaleString()}
                subtitle="Across all three systems"
                icon={<Icon name="zap" />}
                variant="brand"
              />
            </motion.div>
          </div>
        </div>

        {/* Right 1 Column: Activity Feed & Quick Actions */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
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
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 + index * 0.1, duration: 0.3 }}
                      className={cn(
                        'flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer border border-transparent hover:border-surface-200/60 dark:hover:border-surface-700/60',
                        index === 0 && 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-200/40 dark:border-brand-800/40'
                      )}
                      whileHover={{ scale: 1.01 }}
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
                    </motion.div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-surface-200/50 dark:border-surface-700/50 text-center">
                  <NavLink to="/student/profile">
                    <Button variant="ghost" size="sm" className="w-full text-xs">View Full Activity History →</Button>
                  </NavLink>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {[
                { to: '/student/duel', icon: '⚔️', title: 'Find a Duel', desc: 'Real-time 1v1 coding battle', color: 'duel' },
                { to: '/student/practice', icon: '💻', title: 'Practice Problems', desc: 'Solve algorithmic challenges', color: 'practice' },
                { to: '/student/adaptive', icon: '🧠', title: 'Adaptive Session', desc: 'AI-powered personalized practice', color: 'adaptive' },
                { to: '/student/leaderboard', icon: '🏆', title: 'Leaderboards', desc: 'Check your global ranking', color: 'brand' },
              ].map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.3 + index * 0.1, duration: 0.3 }}
                >
                  <NavLink to={action.to}>
                    <motion.button 
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-lg border border-surface-200 dark:border-surface-700',
                        'hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors text-left'
                      )}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                        action.color === 'duel' && 'bg-duel-100 dark:bg-duel-900/30',
                        action.color === 'practice' && 'bg-practice-100 dark:bg-practice-900/30',
                        action.color === 'adaptive' && 'bg-adaptive-100 dark:bg-adaptive-900/30',
                        action.color === 'brand' && 'bg-brand-100 dark:bg-brand-900/30'
                      )}>
                        {action.icon}
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 dark:text-white">{action.title}</p>
                        <p className="text-sm text-surface-500 dark:text-surface-400">{action.desc}</p>
                      </div>
                    </motion.button>
                  </NavLink>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  </div>
);
}