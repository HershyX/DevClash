import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { StatCard, StatGrid } from '@components/ui/StatCard';
import { analyticsService } from '@services/analyticsService';
import { cn, formatRating } from '@utils';
import type { TeacherAnalytics } from '@types';

const EMPTY: TeacherAnalytics = {
  totalClassrooms: 0,
  totalStudents: 0,
  activeStudents: 0,
  averageDuelRating: 0,
  averagePracticeRating: 0,
  averageAdaptiveRating: 0,
  topStudents: [],
  recentActivity: [],
};

export function TeacherAnalyticsPage() {
  const [analytics, setAnalytics] = useState<TeacherAnalytics>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await analyticsService.getTeacherAnalytics('me');
      setAnalytics({ ...EMPTY, ...data });
    } catch {
      setAnalytics(EMPTY);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">Analytics</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">Classroom performance overview across all rating systems</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={load} disabled={isLoading}>{isLoading ? 'Refreshing…' : 'Refresh'}</Button>
        </div>
      </div>

      <StatGrid columns={4} gap="md">
        <StatCard label="Total Students" value={analytics.totalStudents} icon={<span className="text-2xl">👥</span>} variant="primary" />
        <StatCard label="Active This Week" value={analytics.activeStudents} icon={<span className="text-2xl">🟢</span>} trend="up" trendValue="+3" variant="success" />
        <StatCard label="Total Classrooms" value={analytics.totalClassrooms} icon={<span className="text-2xl">🏫</span>} variant="brand" />
        <StatCard
          label="Avg Rating"
          value={formatRating(Math.round((analytics.averageDuelRating + analytics.averagePracticeRating + analytics.averageAdaptiveRating) / 3))}
          icon={<span className="text-2xl">📊</span>}
          variant="adaptive"
        />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatGrid columns={3} gap="md" className="lg:col-span-2">
          <StatCard label="Avg Duel Rating" value={formatRating(analytics.averageDuelRating)} icon={<span className="text-2xl">⚔️</span>} variant="danger" size="lg" />
          <StatCard label="Avg Practice Rating" value={formatRating(analytics.averagePracticeRating)} icon={<span className="text-2xl">💻</span>} variant="practice" size="lg" />
          <StatCard label="Avg Adaptive Rating" value={formatRating(analytics.averageAdaptiveRating)} icon={<span className="text-2xl">🧠</span>} variant="adaptive" size="lg" />
        </StatGrid>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {[
              { label: 'Bronze (0-1199)', min: 0, max: 1199 },
              { label: 'Silver (1200-1599)', min: 1200, max: 1599 },
              { label: 'Gold (1600-1999)', min: 1600, max: 1999 },
              { label: 'Platinum (2000-2399)', min: 2000, max: 2399 },
              { label: 'Diamond (2400+)', min: 2400, max: Infinity },
            ].map((tier) => {
              const count = analytics.topStudents.filter((s) => s.rating >= tier.min && s.rating <= tier.max).length;
              const denom = Math.max(analytics.topStudents.length, 1);
              return (
                <div key={tier.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-700 dark:text-surface-300">{tier.label}</span>
                    <span className="font-medium text-surface-900 dark:text-white">{count} students</span>
                  </div>
                  <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(count / denom) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {analytics.topStudents.slice(0, 10).map((student, index) => (
                <div key={student.userId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0', index < 3 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400')}>
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-900 dark:text-white">{student.name}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      Duel: {formatRating(student.rating)} | Solved: {student.problemsSolved ?? 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-brand-600 dark:text-brand-400">{student.winRate != null ? `${student.winRate}% WR` : '—'}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Lv.{student.level}</p>
                  </div>
                </div>
              ))}
              {analytics.topStudents.length === 0 && !isLoading && (
                <p className="text-sm text-surface-500 text-center py-4">No student data yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {analytics.recentActivity.map((activity, index) => (
                <div key={activity.id ?? index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', activity.type === 'battle' && 'bg-duel-100 dark:bg-duel-900/30', activity.type === 'problem' && 'bg-practice-100 dark:bg-practice-900/30', activity.type === 'adaptive' && 'bg-adaptive-100 dark:bg-adaptive-900/30', activity.type === 'classroom' && 'bg-brand-100 dark:bg-brand-900/30', activity.type === 'achievement' && 'bg-yellow-100 dark:bg-yellow-900/30')}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-900 dark:text-white">
                      <span className="font-medium">{activity.userName}</span> {activity.description}
                    </p>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {Object.entries(activity.metadata).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-surface-400 dark:text-surface-500 whitespace-nowrap">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {analytics.recentActivity.length === 0 && !isLoading && (
                <p className="text-sm text-surface-500 text-center py-4">No activity yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
