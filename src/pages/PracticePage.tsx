import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Icon } from '@components/ui/Icon';
import { Input } from '@components/ui/Input';
import { ProgressBar } from '@components/ui/ProgressBar';
import { NavLink } from 'react-router-dom';
import { cn } from '@utils';
import { mockProblems } from '@services/mockData';
import { useAuth } from '@context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const DIFFICULTY_VARIANTS = { easy: 'success', medium: 'warning', hard: 'danger' } as const;
const ALL_TAGS = Array.from(new Set(mockProblems.flatMap((p) => p.tags))).sort();

function DifficultyBadge({ difficulty }: { difficulty: 'easy' | 'medium' | 'hard' }) {
  return <Badge variant={DIFFICULTY_VARIANTS[difficulty]} size="sm" className="capitalize">{difficulty}</Badge>;
}

export function PracticePage() {
  const { user } = useAuth();
  const role = user?.role || 'student';
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return mockProblems.filter((p) => {
      const matchSearch = search === '' || p.title.toLowerCase().includes(search.toLowerCase()) || p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchDiff = diffFilter === 'all' || p.difficulty === diffFilter;
      const matchTag = tagFilter === null || p.tags.includes(tagFilter);
      const matchStatus = statusFilter === 'all' || (statusFilter === 'solved' ? p.solved : !p.solved);
      return matchSearch && matchDiff && matchTag && matchStatus;
    });
  }, [search, diffFilter, tagFilter, statusFilter]);

  const stats = useMemo(() => {
    const solved = mockProblems.filter((p) => p.solved).length;
    const byDiff = { easy: 0, medium: 0, hard: 0 };
    mockProblems.forEach((p) => byDiff[p.difficulty]++);
    return { solved, total: mockProblems.length, byDiff };
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">Problem Sets</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">Master algorithms and data structures</p>
        </div>
        <Button variant="outline" leftIcon={<Icon name="filter" size={16} />} onClick={() => setShowFilters((p) => !p)}>
          {showFilters ? 'Hide Filters' : 'Filters'}
        </Button>
      </motion.div>

      {/* Stats Row */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
        <Card variant="glass">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-surface-500">Solved</span>
              <span className="text-sm font-bold text-practice-600 dark:text-practice-400">{stats.solved}/{stats.total}</span>
            </div>
            <ProgressBar value={stats.solved} max={stats.total} variant="success" size="sm" />
          </CardContent>
        </Card>
        {(['easy', 'medium', 'hard'] as const).map((diff) => (
          <Card key={diff} variant="glass" className="cursor-pointer" onClick={() => setDiffFilter((p) => p === diff ? 'all' : diff)}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-1">
                <DifficultyBadge difficulty={diff} />
                <span className="text-sm font-bold text-surface-900 dark:text-white">{stats.byDiff[diff]}</span>
              </div>
              <p className="text-xs text-surface-500 capitalize">{diff} problems</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Search & Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
        <Input
          placeholder="Search problems or tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Icon name="search" size={16} />}
        />
      </motion.div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
            <Card variant="glass">
              <CardContent className="pt-4 pb-4 space-y-4">
                <div className="flex flex-wrap gap-3">
                  <div>
                    <p className="text-xs text-surface-500 mb-2 font-medium uppercase tracking-wide">Difficulty</p>
                    <div className="flex gap-2">
                      {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => setDiffFilter(d)}
                          className={cn('px-3 py-1 rounded-full text-sm font-medium border transition-all capitalize', diffFilter === d ? 'bg-brand-500 text-white border-brand-500' : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-brand-300')}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 mb-2 font-medium uppercase tracking-wide">Status</p>
                    <div className="flex gap-2">
                      {(['all', 'solved', 'unsolved'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className={cn('px-3 py-1 rounded-full text-sm font-medium border transition-all capitalize', statusFilter === s ? 'bg-brand-500 text-white border-brand-500' : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-brand-300')}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-2 font-medium uppercase tracking-wide">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setTagFilter((p) => p === tag ? null : tag)}
                        className={cn('px-2.5 py-1 rounded-full text-xs font-medium border transition-all', tagFilter === tag ? 'bg-brand-500 text-white border-brand-500' : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-brand-300')}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Problem List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Problem Library</CardTitle>
              <span className="text-sm text-surface-500">{filtered.length} problem{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <AnimatePresence mode="wait">
              {filtered.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <Icon name="search" size={40} className="text-surface-300 mx-auto mb-3" />
                  <p className="text-surface-500">No problems match your filters</p>
                  <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setSearch(''); setDiffFilter('all'); setTagFilter(null); setStatusFilter('all'); }}>
                    Clear Filters
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-2" key="list">
                  {filtered.map((problem, index) => (
                    <motion.div
                      key={problem.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                    >
                      <NavLink to={`/${role}/practice/${problem.id}`} className="block">
                        <motion.div
                          className="flex items-center gap-4 p-4 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group"
                          whileHover={{ x: 4, scale: 1.005 }}
                        >
                          {/* Status icon */}
                          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0', problem.solved ? 'bg-practice-100 dark:bg-practice-900/30 text-practice-600' : 'bg-surface-100 dark:bg-surface-800 text-surface-400')}>
                            {problem.solved ? '✓' : '○'}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1.5">
                              <h3 className="font-medium text-surface-900 dark:text-white truncate">{problem.title}</h3>
                              <DifficultyBadge difficulty={problem.difficulty} />
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {problem.tags.map((tag) => (
                                <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-surface-500 dark:text-surface-400 shrink-0">
                            <div className="hidden md:flex items-center gap-1.5">
                              <Icon name="check" size={13} />
                              <span>{problem.statistics.acceptanceRate.toFixed(1)}%</span>
                            </div>
                            <div className="hidden md:block text-xs">
                              {problem.statistics.totalSubmissions.toLocaleString()} submissions
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20 group-hover:text-brand-600 transition-colors"
                            >
                              Solve →
                            </Button>
                          </div>
                        </motion.div>
                      </NavLink>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}