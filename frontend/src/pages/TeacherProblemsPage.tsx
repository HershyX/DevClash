import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Icon } from '@components/ui/Icon';
import { cn } from '@utils';
import { motion } from 'framer-motion';
import { problemService } from '@services/problemService';
import type { Problem } from '@types';

const DIFFICULTY_COLORS = { easy: 'success', medium: 'warning', hard: 'danger' } as const;

interface ProblemForm {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string;
  constraints: string;
  exampleInput: string;
  exampleOutput: string;
  testCaseInput: string;
  testCaseExpected: string;
  starterCodeJs: string;
  starterCodePy: string;
}

const EMPTY_FORM: ProblemForm = {
  title: '',
  description: '',
  difficulty: 'easy',
  tags: '',
  constraints: '',
  exampleInput: '',
  exampleOutput: '',
  testCaseInput: '',
  testCaseExpected: '',
  starterCodeJs: '// Write your solution here\n',
  starterCodePy: '# Write your solution here\n',
};

export function TeacherProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewId, setShowPreviewId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [newProblem, setNewProblem] = useState<ProblemForm>(EMPTY_FORM);

  const loadProblems = async () => {
    setIsLoading(true);
    try {
      const res = await problemService.getProblems(1, 100);
      setProblems(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const handleCreate = async () => {
    if (!newProblem.title.trim() || !newProblem.description.trim()) return;
    setSaving(true);
    setFormError('');
    try {
      const tags = newProblem.tags.split(',').map((t) => t.trim()).filter(Boolean);
      await problemService.createProblem({
        title: newProblem.title.trim(),
        description: newProblem.description.trim(),
        difficulty: newProblem.difficulty,
        topics: tags,
        constraints: newProblem.constraints || 'No constraints specified.',
        examples: newProblem.exampleInput
          ? [{ input: newProblem.exampleInput, output: newProblem.exampleOutput }]
          : [],
        hints: [],
        starterCode: { javascript: newProblem.starterCodeJs, python: newProblem.starterCodePy },
        testCases: newProblem.testCaseInput
          ? [{ id: 'tc-1', input: newProblem.testCaseInput, expectedOutput: newProblem.testCaseExpected, isPublic: true }]
          : [],
      });
      setShowCreateModal(false);
      setNewProblem(EMPTY_FORM);
      await loadProblems();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create problem');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this problem permanently?')) return;
    try {
      await problemService.deleteProblem(id);
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete problem');
    }
  };

  const filtered = useMemo(
    () =>
      problems.filter(
        (p) =>
          search === '' ||
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
      ),
    [problems, search]
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
          { label: 'Avg Acceptance', value: `${(problems.reduce((a, p) => a + (p.statistics?.acceptanceRate ?? 0), 0) / Math.max(problems.length, 1)).toFixed(1)}%`, color: 'text-practice-600 dark:text-practice-400' },
          { label: 'Total Submissions', value: problems.reduce((a, p) => a + (p.statistics?.totalSubmissions ?? 0), 0).toLocaleString(), color: 'text-adaptive-600 dark:text-adaptive-400' },
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
                        {(problem.tags ?? []).slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                        ))}
                        {(problem.tags ?? []).length > 3 && <Badge variant="default" size="sm">+{(problem.tags ?? []).length - 3}</Badge>}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <span className="font-mono font-medium text-brand-600 dark:text-brand-400">{(problem.statistics?.acceptanceRate ?? 0).toFixed(1)}%</span>
                        <div className="w-16 mt-1 bg-surface-100 dark:bg-surface-800 rounded-full h-1">
                          <div className="h-1 rounded-full bg-brand-500" style={{ width: `${problem.statistics?.acceptanceRate ?? 0}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-surface-600 dark:text-surface-400">
                      {(problem.statistics?.totalSubmissions ?? 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => setShowPreviewId(problem.id)}>Preview</Button>
                        <Button variant="ghost" size="sm" className="text-duel-600 dark:text-duel-400 hover:bg-duel-50 dark:hover:bg-duel-900/20" onClick={() => handleDelete(problem.id)}>Delete</Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !isLoading && (
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
              label="Tags / Topics (comma-separated)"
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

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Example Input"
              placeholder='e.g., [2,7,11,15], target = 9'
              value={newProblem.exampleInput}
              onChange={(e) => setNewProblem({ ...newProblem, exampleInput: e.target.value })}
            />
            <Input
              label="Example Output"
              placeholder="e.g., [0,1]"
              value={newProblem.exampleOutput}
              onChange={(e) => setNewProblem({ ...newProblem, exampleOutput: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sample Test Case Input *"
              placeholder="e.g., [2,7,11,15] 9"
              value={newProblem.testCaseInput}
              onChange={(e) => setNewProblem({ ...newProblem, testCaseInput: e.target.value })}
            />
            <Input
              label="Sample Test Case Expected Output *"
              placeholder="e.g., [0,1]"
              value={newProblem.testCaseExpected}
              onChange={(e) => setNewProblem({ ...newProblem, testCaseExpected: e.target.value })}
            />
          </div>
          <p className="text-xs text-surface-500 -mt-2">
            The sample test case is visible to solvers (Run). Hidden tests can be added later via the API.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={!newProblem.title.trim() || !newProblem.description.trim() || saving}>
              {saving ? 'Creating...' : 'Create Problem'}
            </Button>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>
      </Modal>

      {/* Problem Preview Modal */}
      <Modal isOpen={!!showPreviewId} onClose={() => setShowPreviewId(null)} title={previewProblem?.title || ''} size="lg">
        {previewProblem && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={DIFFICULTY_COLORS[previewProblem.difficulty]} size="md" className="capitalize">{previewProblem.difficulty}</Badge>
              {(previewProblem.tags ?? []).map((t) => <Badge key={t} variant="default" size="sm">{t}</Badge>)}
            </div>
            <p className="text-surface-700 dark:text-surface-300 text-sm leading-relaxed whitespace-pre-line">{previewProblem.description}</p>
            {(previewProblem.examples ?? []).length > 0 && (
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
            {(previewProblem.testCases ?? []).length > 0 && (
              <div>
                <h3 className="font-medium text-surface-900 dark:text-white mb-2">Test Cases (teacher view)</h3>
                {previewProblem.testCases!.map((tc) => (
                  <div key={tc.id} className="p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg mb-2 font-mono text-xs space-y-1">
                    <div><span className="text-surface-500">Input: </span>{tc.input}</div>
                    <div><span className="text-surface-500">Expected: </span>{tc.expectedOutput}</div>
                    <Badge variant={tc.isPublic ? 'success' : 'default'} size="sm">{tc.isPublic ? 'public' : 'hidden'}</Badge>
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
