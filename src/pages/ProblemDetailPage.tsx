import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Tabs, TabContent, TabList, TabTrigger } from '@components/ui/Tabs';
import { Icon } from '@components/ui/Icon';
import { ProgressBar } from '@components/ui/ProgressBar';
import { mockProblems } from '@services/mockData';
import { cn } from '@utils';
import { motion, AnimatePresence } from 'framer-motion';

const STARTER_CODE: Record<string, string> = {
  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function solution(nums, target) {
  // Write your solution here
  
}`,
  python: `class Solution:
    def solve(self, nums: list[int], target: int) -> list[int]:
        # Write your solution here
        pass`,
  java: `class Solution {
    public int[] solve(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,
  cpp: `class Solution {
public:
    vector<int> solve(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};`,
};

type SubmitStatus = 'idle' | 'running' | 'accepted' | 'wrong' | 'error';

export function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const problem = mockProblems.find((p) => p.id === id);

  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(problem?.starterCode?.[language] || STARTER_CODE[language]);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [testResults, setTestResults] = useState<Array<{ id: number; status: 'pending' | 'passed' | 'failed'; time?: string }>>([]);
  const [activeEditorTab, setActiveEditorTab] = useState<'editor' | 'output'>('editor');
  const [isRunning, setIsRunning] = useState(false);

  if (!problem) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Icon name="code" size={48} className="text-surface-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">Problem not found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(problem.starterCode?.[lang] || STARTER_CODE[lang] || '// Write your solution\n');
    setSubmitStatus('idle');
    setTestResults([]);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setActiveEditorTab('output');
    const initResults = (problem.examples || []).map((_, i) => ({ id: i + 1, status: 'pending' as const }));
    setTestResults(initResults);
    for (let i = 0; i < initResults.length; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setTestResults((prev) => prev.map((t) => t.id === i + 1 ? { ...t, status: Math.random() > 0.15 ? 'passed' : 'failed', time: `${Math.floor(Math.random() * 80) + 20}ms` } : t));
    }
    setIsRunning(false);
  };

  const handleSubmit = async () => {
    setSubmitStatus('running');
    setActiveEditorTab('output');
    setTestResults([]);
    await new Promise((r) => setTimeout(r, 1200));
    const accepted = Math.random() > 0.3;
    setSubmitStatus(accepted ? 'accepted' : 'wrong');
    const cases = problem.examples?.length || 3;
    setTestResults(
      Array.from({ length: cases }, (_, i) => ({
        id: i + 1,
        status: accepted || i < cases - 1 ? 'passed' : 'failed',
        time: `${Math.floor(Math.random() * 80) + 10}ms`,
      }))
    );
  };

  const difficultyColors = {
    easy: 'text-practice-600 dark:text-practice-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    hard: 'text-duel-600 dark:text-duel-400',
  };

  const statusConfig = {
    idle: null,
    running: { color: 'text-brand-600', label: 'Evaluating...', icon: '⟳' },
    accepted: { color: 'text-practice-600', label: 'Accepted ✓', icon: '✓' },
    wrong: { color: 'text-duel-600', label: 'Wrong Answer', icon: '✗' },
    error: { color: 'text-red-600', label: 'Runtime Error', icon: '!' },
  };

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <motion.div className="flex items-center gap-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <Icon name="chevronLeft" size={16} /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-bold text-surface-900 dark:text-white">{problem.title}</h1>
            <Badge
              variant={problem.difficulty === 'easy' ? 'success' : problem.difficulty === 'medium' ? 'warning' : 'danger'}
              size="md"
              className="capitalize"
            >
              {problem.difficulty}
            </Badge>
            {problem.solved && <Badge variant="success" size="sm" dot>Solved</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {problem.tags.map((tag) => (
              <Badge key={tag} variant="outline" size="sm">{tag}</Badge>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Left: Problem Details */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <Tabs defaultValue="description">
            <TabList>
              <TabTrigger value="description">Description</TabTrigger>
              <TabTrigger value="examples">Examples</TabTrigger>
              <TabTrigger value="hints">Hints</TabTrigger>
              <TabTrigger value="stats">Stats</TabTrigger>
            </TabList>

            <TabContent value="description">
              <Card variant="glass">
                <CardContent className="pt-5">
                  <p className="text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-line text-sm">
                    {problem.description}
                  </p>
                  <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                    <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Constraints</h3>
                    <pre className="text-xs text-surface-600 dark:text-surface-400 whitespace-pre-wrap font-mono bg-surface-50 dark:bg-surface-800/50 rounded-lg p-3">
                      {problem.constraints}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabContent>

            <TabContent value="examples">
              <Card variant="glass">
                <CardContent className="pt-5 space-y-4">
                  {problem.examples.map((example, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700"
                    >
                      <p className="text-sm font-semibold text-surface-900 dark:text-white mb-2">Example {index + 1}</p>
                      <div className="space-y-2 font-mono text-xs">
                        <div><span className="text-surface-500">Input: </span><span className="text-surface-900 dark:text-white">{example.input}</span></div>
                        <div><span className="text-surface-500">Output: </span><span className="text-practice-600 dark:text-practice-400">{example.output}</span></div>
                        {example.explanation && (
                          <div className="mt-2 pt-2 border-t border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 font-sans leading-relaxed">
                            {example.explanation}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </TabContent>

            <TabContent value="hints">
              <Card variant="glass">
                <CardContent className="pt-5">
                  {problem.hints && problem.hints.length > 0 ? (
                    <div className="space-y-3">
                      {problem.hints.map((hint, i) => (
                        <div key={i} className="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl">
                          <p className="text-sm font-medium text-warning-700 dark:text-warning-300">Hint {i + 1}</p>
                          <p className="text-sm text-warning-600 dark:text-warning-400 mt-1">{hint}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Icon name="lock" size={36} className="text-surface-300 mx-auto mb-3" />
                      <p className="text-surface-500 text-sm">No hints available for this problem</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabContent>

            <TabContent value="stats">
              <Card variant="glass">
                <CardContent className="pt-5">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {[
                      { label: 'Submissions', value: problem.statistics.totalSubmissions.toLocaleString(), icon: '📬' },
                      { label: 'Acceptance Rate', value: `${problem.statistics.acceptanceRate.toFixed(1)}%`, icon: '✅' },
                      { label: 'Avg Runtime', value: `${problem.statistics.averageTime}ms`, icon: '⚡' },
                      { label: 'Avg Memory', value: `${problem.statistics.averageMemory}MB`, icon: '💾' },
                    ].map((stat) => (
                      <div key={stat.label} className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl text-center">
                        <p className="text-lg mb-1">{stat.icon}</p>
                        <p className="text-xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
                        <p className="text-xs text-surface-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-600 dark:text-surface-400">Acceptance</span>
                      <span className="font-medium text-surface-900 dark:text-white">{problem.statistics.acceptanceRate.toFixed(1)}%</span>
                    </div>
                    <ProgressBar value={problem.statistics.acceptanceRate} max={100} variant="success" size="sm" />
                  </div>
                </CardContent>
              </Card>
            </TabContent>
          </Tabs>
        </motion.div>

        {/* Right: Code Editor */}
        <motion.div className="space-y-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          {/* Editor Controls */}
          <div className="flex items-center justify-between">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-sm rounded-lg px-3 py-1.5 border border-surface-200 dark:border-surface-700 focus:outline-none focus:border-brand-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>

            <div className="flex gap-2">
              {statusConfig[submitStatus] && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn('text-sm font-medium px-3 py-1.5 rounded-lg', statusConfig[submitStatus]!.color,
                    submitStatus === 'accepted' ? 'bg-practice-50 dark:bg-practice-900/20' :
                    submitStatus === 'wrong' ? 'bg-duel-50 dark:bg-duel-900/20' :
                    'bg-surface-100 dark:bg-surface-800'
                  )}
                >
                  {submitStatus === 'running' && <span className="animate-spin mr-1">⟳</span>}
                  {statusConfig[submitStatus]!.label}
                </motion.span>
              )}
              <Button variant="outline" size="sm" onClick={handleRun} disabled={isRunning || submitStatus === 'running'}>
                {isRunning ? '⟳ Running...' : '▶ Run'}
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isRunning || submitStatus === 'running'}>
                ✓ Submit
              </Button>
            </div>
          </div>

          {/* Editor / Output Tabs */}
          <div className="flex gap-0.5 p-0.5 bg-surface-100 dark:bg-surface-800 rounded-lg w-fit">
            {(['editor', 'output'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveEditorTab(tab)}
                className={cn('px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all', activeEditorTab === tab ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300')}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeEditorTab === 'editor' ? (
            // Code Editor
            <Card variant="glass" className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-surface-900 text-white border-b border-surface-700">
                <span className="text-xs font-mono text-surface-400">
                  {language === 'javascript' ? 'solution.js' : language === 'python' ? 'solution.py' : language === 'java' ? 'Solution.java' : 'solution.cpp'}
                </span>
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
              </div>
              <div className="relative" style={{ height: '420px' }}>
                <div className="absolute inset-0 flex bg-surface-950 overflow-hidden">
                  <div className="text-surface-600 text-xs font-mono py-4 pl-3 pr-2 select-none bg-surface-900 border-r border-surface-800" style={{minWidth: '2.5rem'}}>
                    {code.split('\n').map((_, i) => <div key={i} className="leading-5">{i + 1}</div>)}
                  </div>
                  <textarea
                    className="flex-1 bg-transparent text-surface-100 font-mono text-sm p-3 resize-none outline-none leading-5 overflow-auto"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                    autoComplete="off"
                    style={{ tabSize: 2 }}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const s = e.currentTarget.selectionStart;
                        const newCode = code.substring(0, s) + '  ' + code.substring(e.currentTarget.selectionEnd);
                        setCode(newCode);
                        requestAnimationFrame(() => { e.currentTarget.selectionStart = s + 2; e.currentTarget.selectionEnd = s + 2; });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-surface-700 bg-surface-900/50">
                <button
                  onClick={() => setCode(problem.starterCode?.[language] || STARTER_CODE[language])}
                  className="text-xs text-surface-500 hover:text-surface-300 transition-colors"
                >
                  Reset to starter code
                </button>
                <span className="text-xs text-surface-600">{code.split('\n').length} lines</span>
              </div>
            </Card>
          ) : (
            // Output Panel
            <Card variant="glass" style={{ minHeight: '460px' }}>
              <CardContent className="pt-4 space-y-4">
                <AnimatePresence mode="wait">
                  {submitStatus === 'running' || isRunning ? (
                    <motion.div key="running" className="flex flex-col items-center justify-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="text-3xl mb-3">⟳</motion.div>
                      <p className="text-surface-500 animate-pulse">Running test cases...</p>
                    </motion.div>
                  ) : testResults.length > 0 ? (
                    <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      {submitStatus !== 'idle' && (
                        <div className={cn('p-3 rounded-xl border', submitStatus === 'accepted' ? 'bg-practice-50 dark:bg-practice-900/20 border-practice-200 dark:border-practice-800' : 'bg-duel-50 dark:bg-duel-900/20 border-duel-200 dark:border-duel-800')}>
                          <p className={cn('font-semibold', submitStatus === 'accepted' ? 'text-practice-700 dark:text-practice-300' : 'text-duel-700 dark:text-duel-300')}>
                            {submitStatus === 'accepted' ? '✓ Accepted — All test cases passed!' : '✗ Wrong Answer'}
                          </p>
                        </div>
                      )}
                      {testResults.map((t, i) => (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn('p-3 rounded-xl border', t.status === 'passed' ? 'border-practice-200 dark:border-practice-800 bg-practice-50 dark:bg-practice-900/20' : t.status === 'failed' ? 'border-duel-200 dark:border-duel-800 bg-duel-50 dark:bg-duel-900/20' : 'border-surface-200 dark:border-surface-700')}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-surface-900 dark:text-white">Test Case {t.id}</span>
                            <div className="flex items-center gap-2">
                              {t.time && <span className="text-xs text-surface-500">{t.time}</span>}
                              {t.status === 'passed' && <span className="text-xs text-practice-600 font-medium">✓ Passed</span>}
                              {t.status === 'failed' && <span className="text-xs text-duel-600 font-medium">✗ Failed</span>}
                              {t.status === 'pending' && <span className="text-xs text-surface-400">Pending...</span>}
                            </div>
                          </div>
                          {problem.examples[i] && (
                            <div className="text-xs font-mono space-y-0.5">
                              <div><span className="text-surface-500">Input: </span><span className="text-surface-700 dark:text-surface-300">{problem.examples[i].input}</span></div>
                              <div><span className="text-surface-500">Expected: </span><span className="text-practice-600 dark:text-practice-400">{problem.examples[i].output}</span></div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div key="empty" className="flex flex-col items-center justify-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Icon name="code" size={40} className="text-surface-300 mb-3" />
                      <p className="text-surface-500 text-sm">Click Run or Submit to see results</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}