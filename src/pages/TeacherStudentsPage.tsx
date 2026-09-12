import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Avatar } from '@components/ui/Avatar';
import { mockClassrooms } from '@services/mockData';
import { cn, formatRating } from '@utils';

const allStudents = mockClassrooms.flatMap(c => c.students.map(s => ({ ...s, classroom: c.name })));

export function TeacherStudentsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">Students</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">Manage and monitor all your students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Filters</Button>
          <Button variant="primary" leftIcon={<span>➕</span>}>Add Student</Button>
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
                  <th className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allStudents.map((student) => (
                  <tr key={student.userId} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
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
                    <td className="p-3 font-mono font-medium text-duel-600 dark:text-duel-400">{formatRating(student.duelRating)}</td>
                    <td className="p-3 font-mono font-medium text-practice-600 dark:text-practice-400">{formatRating(student.practiceRating)}</td>
                    <td className="p-3 font-mono font-medium text-adaptive-600 dark:text-adaptive-400">{formatRating(student.adaptiveRating)}</td>
                    <td className="p-3">
                      <Badge variant={student.isActive ? 'success' : 'default'} size="sm" dot>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-surface-600 dark:text-surface-400">
                      {new Date(student.lastActive).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="p-1.5">View</Button>
                        <Button variant="ghost" size="sm" className="p-1.5">Message</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}