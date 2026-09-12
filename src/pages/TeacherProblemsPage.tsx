import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Icon } from '@components/ui/Icon';
import { mockProblems } from '@services/mockData';
import { cn } from '@utils';
import { motion } from 'framer-motion';

const DIFFICULTY_COLORS = { easy: 'success', medium: 'warning', hard: 'danger' } as const;

interface NewProblem {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string;
  constraints: string;
}

export function TeacherProblemsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewId, setShowPreviewId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newProblem, setNewProblem] = useState<NewProblem>({ title: '', description: '', difficulty: 'easy', tags: '', constraints: '' });
  const [problems, setProblems] = useState(mockProblems);

  const handleCreate = () => {
    if (!newProblem.title.trim()) return;
    const created = {
      id: `custom-${Date.now()}`,
      title: newProblem.title,
      description: newProblem.description || 'No description provided.',
      difficulty: newProblem.difficulty,
      tags: newProblem.tags.split(',').map((t) => t.trim()).filter(Boolean),
      constraints: newProblem.constraints || 'No constraints specified.',
      examples: [],
      starterCode: { javascript: '// Write your solution here\n', python: '# Write your solution here\n' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statistics: { totalSubmissions: 0, acceptedSubmissions: 0, acceptanceRate: 0, averageTime: 0, averageMemory: 0 },
    };
    setProblems((prev) => [created as any, ...prev]);
    setNewProblem({ title: '', description: '', difficulty: 'easy', tags: '', constraints: '' });
    setShowCreateModal(false);
  };

  const filtered = problems.filter((p) =>
    search === '' || p.title.toLowerCase().includes(search.toLowerCase()) || p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const previewProblem = showPreviewId ? problems.find((p) => p.id === showPreviewId) : null;

  return (
    <div className="space-y-6">
      <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">Problems</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">Manage your classroom problem library</p>
        </div>
        <Button variant="primary" leftIcon={<Icon name="plus" size={16} />} onClick={() => setShowCreateModal(true)}>
          Create Problem
        </Button>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Problems', value: problems.length, color: 'text-brand-600 dark:text-brand-400' },
          { label: 'Avg Acceptance', value: `${(problems.reduce((a, p) => a + p.statistics.acceptanceRate, 0) / problems.length).toFixed(1)}%`, color: 'text-practice-600 dark:text-practice-400' },
          { label: 'Total Submissions', value: problems.reduce((a, p) => a + p.statistics.totalSubmissions, 0).toLocaleString(), color: 'text-adaptive-600 dark:text-adaptive-400' },
        ].map((s) => (
          <Card key={s.label} variant="glass">
            <CardContent className="pt-4 pb-4">
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-surface-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Problem Library</CardTitle>
            <div className="w-64">
              <Input
                placeholder="Search problems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Icon name="search" size={14} />}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  {['Problem', 'Difficulty', 'Tags', 'Acceptance', 'Submissions', 'Actions'].map((h) => (
                    <th key={h} className="text-left p-3 text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((problem, i) => (
                  <motion.tr
                    key={problem.id}
                    className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <td className="p-3">
                      <p className="font-medium text-surface-900 dark:text-white">{problem.title}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-1 mt-0.5">{problem.description}</p>
                    </td>
                    <td className="p-3">
                      <Badge variant={DIFFICULTY_COLORS[problem.difficulty]} size="sm" className="capitalize">{problem.difficulty}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {problem.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                        ))}
                        {problem.tags.length > 3 && <Badge variant="default" size="sm">+{problem.tags.length - 3}</Badge>}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <span className="font-mono font-medium text-brand-600 dark:text-brand-400">{problem.statistics.acceptanceRate.toFixed(1)}%</span>
                        <div className="w-16 mt-1 bg-surface-100 dark:bg-surface-800 rounded-full h-1">
                          <div className="h-1 rounded-full bg-brand-500" style={{ width: `${problem.statistics.acceptanceRate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-surface-600 dark:text-surface-400">
                      {problem.statistics.totalSubmissions.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => setShowPreviewId(problem.id)}>Preview</Button>
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm" className="text-duel-600 dark:text-duel-400 hover:bg-duel-50 dark:hover:bg-duel-900/20">Delete</Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Icon name="search" size={36} className="text-surface-300 mx-auto mb-3" />
                <p className="text-surface-500">No problems match your search</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Problem Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Problem" size="lg">
        <div className="space-y-4">
          <Input
            label="Problem Title *"
            placeholder="e.g., Two Sum"
            value={newProblem.title}
            onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
            required
          />

          <Input
            label="Description *"
            placeholder="Describe the problem clearly..."
            value={newProblem.description}
            onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
            as="textarea"
            rows={4}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Difficulty</label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setNewProblem({ ...newProblem, difficulty: d })}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-sm font-medium border capitalize transition-all',
                      newProblem.difficulty === d
                        ? d === 'easy' ? 'bg-practice-500 text-white border-practice-500'
                          : d === 'medium' ? 'bg-warning-500 text-white border-warning-500'
                          : 'bg-duel-500 text-white border-duel-500'
                        : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="Tags (comma-separated)"
              placeholder="Array, Hash Table, Two Pointers"
              value={newProblem.tags}
              onChange={(e) => setNewProblem({ ...newProblem, tags: e.target.value })}
            />
          </div>

          <Input
            label="Constraints"
            placeholder="e.g., 2 <= nums.length <= 10^4"
            value={newProblem.constraints}
            onChange={(e) => setNewProblem({ ...newProblem, constraints: e.target.value })}
            as="textarea"
            rows={2}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={!newProblem.title.trim()}>
              Create Problem
            </Button>
          </div>
        </div>
      </Modal>

      {/* Problem Preview Modal */}
      <Modal isOpen={!!showPreviewId} onClose={() => setShowPreviewId(null)} title={previewProblem?.title || ''} size="lg">
        {previewProblem && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={DIFFICULTY_COLORS[previewProblem.difficulty]} size="md" className="capitalize">{previewProblem.difficulty}</Badge>
              {previewProblem.tags.map((t) => <Badge key={t} variant="default" size="sm">{t}</Badge>)}
            </div>
            <p className="text-surface-700 dark:text-surface-300 text-sm leading-relaxed whitespace-pre-line">{previewProblem.description}</p>
            {previewProblem.examples?.length > 0 && (
              <div>
                <h3 className="font-medium text-surface-900 dark:text-white mb-2">Examples</h3>
                {previewProblem.examples.map((ex, i) => (
                  <div key={i} className="p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg mb-2 font-mono text-xs space-y-1">
                    <div><span className="text-surface-500">Input: </span>{ex.input}</div>
                    <div><span className="text-surface-500">Output: </span>{ex.output}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowPreviewId(null)}>Close Preview</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}