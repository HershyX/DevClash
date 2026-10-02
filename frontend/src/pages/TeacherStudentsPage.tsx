import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Avatar } from '@components/ui/Avatar';
import { Input } from '@components/ui/Input';
import { Icon } from '@components/ui/Icon';
import { classroomService } from '@services/classroomService';
import { cn, formatRating } from '@utils';
import { motion } from 'framer-motion';
import type { ClassroomStudent } from '@types';

interface Row extends ClassroomStudent {
  classroom: string;
}

export function TeacherStudentsPage() {
  const [students, setStudents] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await classroomService.getAllStudents();
        if (!cancelled) setStudents(rows as Row[]);
      } catch {
        if (!cancelled) setStudents([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () =>
      students.filter(
        (s) =>
          search === '' ||
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase()) ||
          s.classroom.toLowerCase().includes(search.toLowerCase())
      ),
    [students, search]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">Students</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">Manage and monitor all your students</p>
        </div>
        <div className="w-64">
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Icon name="search" size={14} />}
          />
        </div>
      </div>

      <Card variant="glass">
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400">Student</th>
                  <th className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400">Classroom</th>
                  <th className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400">Duel Rating</th>
                  <th className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400">Practice Rating</th>
                  <th className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400">Adaptive Rating</th>
                  <th className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400">Status</th>
                  <th className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, i) => (
                  <motion.tr
                    key={`${student.userId}-${student.classroom}`}
                    className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} size="sm" />
                        <div>
                          <p className="font-medium text-surface-900 dark:text-white">{student.name}</p>
                          <p className="text-sm text-surface-500 dark:text-surface-400">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="brand" size="sm">{student.classroom}</Badge>
                    </td>
                    <td className={cn('p-3 font-mono font-medium', formatRating(student.duelRating))}>
                      {typeof student.duelRating === 'number' ? student.duelRating : '—'}
                    </td>
                    <td className={cn('p-3 font-mono font-medium', formatRating(student.practiceRating))}>
                      {typeof student.practiceRating === 'number' ? student.practiceRating : '—'}
                    </td>
                    <td className={cn('p-3 font-mono font-medium', formatRating(student.adaptiveRating))}>
                      {typeof student.adaptiveRating === 'number' ? student.adaptiveRating : '—'}
                    </td>
                    <td className="p-3">
                      <Badge variant={student.isActive ? 'success' : 'default'} size="sm" dot>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-surface-600 dark:text-surface-400">
                      {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Icon name="users" size={36} className="text-surface-300 mx-auto mb-3" />
                <p className="text-surface-500">
                  {students.length === 0 ? 'No students enrolled yet.' : 'No students match your search.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
