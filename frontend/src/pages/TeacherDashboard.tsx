import { useState, useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { StatCard, StatGrid } from '@components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Avatar } from '@components/ui/Avatar';
import type { TeacherUser, TeacherAnalytics, Classroom } from '@types';
import { cn, formatRating } from '@utils';
import { NavLink } from 'react-router-dom';
import { Icon } from '@components/ui/Icon';
import { motion } from 'framer-motion';
import { analyticsService } from '@services/analyticsService';
import { classroomService } from '@services/classroomService';

const EMPTY_ANALYTICS: TeacherAnalytics = {
  totalClassrooms: 0,
  totalStudents: 0,
  activeStudents: 0,
  averageDuelRating: 0,
  averagePracticeRating: 0,
  averageAdaptiveRating: 0,
  topStudents: [],
  recentActivity: [],
};

export function TeacherDashboard() {
  const { user } = useAuth();
  const teacher = user as TeacherUser;

  const [analytics, setAnalytics] = useState<TeacherAnalytics>(EMPTY_ANALYTICS);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [recentActivity, setRecentActivity] = useState<
    Array<{ type: string; user: string; action: string; meta: string; time: string; color: string; icon: string }>
  >([
    { type: 'battle', user: 'Emma Chen', action: 'won a Duel against Marcus Johnson', meta: '+24 Rating', time: '2m ago', color: 'duel', icon: 'target' },
    { type: 'problem', user: 'Sofia Rodriguez', action: 'solved "Two Sum" (Easy)', meta: '+50 XP', time: '15m ago', color: 'practice', icon: 'code' },
    { type: 'adaptive', user: 'Marcus Johnson', action: 'completed Adaptive Session', meta: '+45 XP • +12 Rating', time: '1h ago', color: 'adaptive', icon: 'brain' },
    { type: 'classroom', user: 'You', action: 'created classroom "CS 301 - Advanced Topics"', meta: '', time: '3h ago', color: 'brand', icon: 'building' },
    { type: 'achievement', user: 'Priya Patel', action: 'earned "Streak Master" badge', meta: '14-day streak', time: '5h ago', color: 'brand', icon: 'trophy' },
  ]);

  useEffect(() => {
    let cancelled = false;

    analyticsService.getTeacherAnalytics(user?.id ?? '').then((data) => {
      if (cancelled) return;
      setAnalytics({ ...EMPTY_ANALYTICS, ...data });
      if (data.recentActivity?.length) {
        setRecentActivity(
          data.recentActivity.map((e) => ({
            type: e.type,
            user: e.userName,
            action: e.description,
            meta: '',
            time: new Date(e.timestamp).toLocaleString(),
            color: e.type === 'battle' ? 'duel' : e.type === 'problem' ? 'practice' : e.type === 'adaptive' ? 'adaptive' : 'brand',
            icon: e.type === 'battle' ? 'target' : e.type === 'problem' ? 'code' : e.type === 'adaptive' ? 'brain' : 'building',
          }))
        );
      }
    }).catch(() => {/* keep placeholder */});

    classroomService.getClassrooms(user?.id ?? '').then((list) => {
      if (cancelled) return;
      setClassrooms(list);
    }).catch(() => {});

    return () => { cancelled = true; };
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
            Teacher Dashboard
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Overview of your classrooms and student performance
          </p>
        </div>
        <NavLink to="/teacher/classrooms/new">
          <Button leftIcon={<Icon name="plus" />}>Create Classroom</Button>
        </NavLink>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <StatGrid columns={4} gap="md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <StatCard label="Total Classrooms" value={analytics.totalClassrooms || 0} icon={<Icon name="building" />} variant="primary" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.3 }}
          >
            <StatCard label="Total Students" value={analytics.totalStudents || 0} icon={<Icon name="users" />} variant="success" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <StatCard label="Active Students" value={analytics.activeStudents || 0} icon={<Icon name="sparkles" />} trend="up" trendValue="+3 this week" variant="brand" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, duration: 0.3 }}
          >
            <StatCard label="Avg Rating" value={formatRating(Math.round((analytics.averageDuelRating + analytics.averagePracticeRating + analytics.averageAdaptiveRating) / 3) || 0)} icon={<Icon name="barChart" />} variant="adaptive" />
          </motion.div>
        </StatGrid>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <StatGrid columns={3} gap="md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              <StatCard label="Avg Duel Rating" value={formatRating(analytics.averageDuelRating || 0)} icon={<Icon name="target" />} variant="danger" size="lg" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.75, duration: 0.3 }}
            >
              <StatCard label="Avg Practice Rating" value={formatRating(analytics.averagePracticeRating || 0)} icon={<Icon name="code" />} variant="practice" size="lg" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
            >
              <StatCard label="Avg Adaptive Rating" value={formatRating(analytics.averageAdaptiveRating || 0)} icon={<Icon name="brain" />} variant="adaptive" size="lg" />
            </motion.div>
          </StatGrid>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Your Classrooms</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {classrooms.map((classroom, index) => (
                <motion.div
                  key={classroom.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                >
                  <NavLink to={`/teacher/classrooms/${classroom.id}`} className="block">
                    <motion.div 
                      className={cn('p-4 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors')}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-lg">
                            <Icon name="building" className="text-brand-600" />
                          </div>
                          <div>
                            <p className="font-medium text-surface-900 dark:text-white">{classroom.name}</p>
                            <p className="text-sm text-surface-500 dark:text-surface-400">Code: <span className="font-mono text-brand-600 dark:text-brand-400">{classroom.code}</span></p>
                          </div>
                        </div>
                        <Badge variant={classroom.isActive ? 'success' : 'default'} size="sm" dot>
                          {classroom.isActive ? 'Active' : 'Archived'}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400">
                        <span className="flex items-center gap-1">
                          <Icon name="users" size={14} />
                          {classroom.studentCount} students
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="calendar" size={14} />
                          {new Date(classroom.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  </NavLink>
                </motion.div>
              ))}
              {(!classrooms || classrooms.length === 0) && (
                <div className="text-center py-8 text-surface-500 dark:text-surface-400">
                  <p className="mb-2">No classrooms yet</p>
                  <NavLink to="/teacher/classrooms/new"><Button size="sm" leftIcon={<Icon name="plus" />}>Create First Classroom</Button></NavLink>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Top Students</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {analytics.topStudents.slice(0, 5).map((student, index) => (
                  <motion.div
                    key={student.userId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 + index * 0.1, duration: 0.3 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0', index < 3 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400')}>
                      #{index + 1}
                    </div>
                    <Avatar name={student.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-900 dark:text-white truncate">{student.name}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">Duel: {formatRating(student.rating)} • Level {student.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-brand-600 dark:text-brand-400">{student.winRate}% WR</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">{student.problemsSolved} solved</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <CardFooter className="pt-4">
                <NavLink to="/teacher/students"><Button variant="ghost" fullWidth size="sm">View All Students</Button></NavLink>
              </CardFooter>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + index * 0.1, duration: 0.3 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', activity.color === 'duel' && 'bg-duel-100 dark:bg-duel-900/30', activity.color === 'practice' && 'bg-practice-100 dark:bg-practice-900/30', activity.color === 'adaptive' && 'bg-adaptive-100 dark:bg-adaptive-900/30', activity.color === 'brand' && 'bg-brand-100 dark:bg-brand-900/30')}>
                      <Icon name={activity.icon} className={cn(activity.color === 'duel' && 'text-duel-600', activity.color === 'practice' && 'text-practice-600', activity.color === 'adaptive' && 'text-adaptive-600', activity.color === 'brand' && 'text-brand-600')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-900 dark:text-white">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      {activity.meta && <p className="text-xs text-surface-500 dark:text-surface-400">{activity.meta}</p>}
                    </div>
                    <span className="text-xs text-surface-400 dark:text-surface-500 whitespace-nowrap">{activity.time}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}