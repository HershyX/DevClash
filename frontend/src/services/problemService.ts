import { apiClient } from './apiClient';
import type { Problem, ProblemStatistics, PaginatedResponse } from '../types';
import { mockProblems } from './mockData';

export interface TestCaseResult {
  id: string;
  input: string;
  expected: string;
  actual?: string;
  passed: boolean;
  timeMs?: number;
  error?: string;
}

/** Matches the backend evaluation response (run + submit). */
export interface ExecutionResult {
  status: 'accepted' | 'wrong' | 'tle' | 'compile_error' | 'runtime_error';
  passedCount: number;
  totalCount: number;
  runtimeMs: number;
  memoryMb: number;
  message: string;
  errorMessage?: string;
  testCaseResults: TestCaseResult[];
  firstTestCaseFailed?: number | null;
  timedOut?: boolean;
  // Submit-only fields
  xpEarned?: number;
  ratingDelta?: number;
  previouslySolved?: boolean;
  user?: unknown;
  engine?: string;
}

export interface SubmissionHistoryEntry {
  id: string;
  problemId: string;
  problemTitle: string;
  problemDifficulty?: string;
  language: string;
  status: string;
  runtimeMs: number;
  memoryMb: number;
  testCasesPassed: number;
  totalTestCases: number;
  xpEarned: number;
  ratingDelta: number;
  mode: string;
  errorMessage?: string;
  createdAt: string;
}

export const problemService = {
  /** Backend list with difficulty/topic/search/status filters; falls back to mock data offline. */
  async getProblems(
    page = 1,
    limit = 20,
    difficulty?: Problem['difficulty'],
    search?: string,
    topic?: string,
    statusFilter?: 'all' | 'solved' | 'unsolved'
  ): Promise<PaginatedResponse<Problem>> {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (difficulty) params.set('difficulty', difficulty);
      if (search) params.set('search', search);
      if (topic) params.set('topic', topic);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const res = await apiClient.get<{ success: boolean; data: PaginatedResponse<Problem> }>(
        `/problems?${params.toString()}`
      );
      return res.data;
    } catch {
      // Offline fallback (backend unreachable) — keeps the UI usable in dev
      let problems = [...mockProblems];
      if (difficulty && difficulty !== ('all' as unknown)) problems = problems.filter((p) => p.difficulty === difficulty);
      if (topic && topic !== 'All') problems = problems.filter((p) => p.tags.some((t) => t.toLowerCase() === topic.toLowerCase()));
      if (statusFilter === 'solved') problems = problems.filter((p) => p.solved);
      if (statusFilter === 'unsolved') problems = problems.filter((p) => !p.solved);
      if (search) {
        const q = search.toLowerCase();
        problems = problems.filter(
          (p) => p.title.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      const start = (page - 1) * limit;
      return {
        data: problems.slice(start, start + limit),
        total: problems.length,
        page,
        limit,
        totalPages: Math.ceil(problems.length / limit),
      };
    }
  },

  async getProblem(id: string): Promise<Problem | null> {
    try {
      const res = await apiClient.get<{ success: boolean; data: Problem }>(`/problems/${id}`);
      return res.data;
    } catch {
      return mockProblems.find((p) => p.id === id) || null;
    }
  },

  async getProblemStatistics(id: string): Promise<ProblemStatistics | null> {
    try {
      const res = await apiClient.get<{ success: boolean; data: ProblemStatistics }>(`/problems/${id}/statistics`);
      return res.data;
    } catch {
      return mockProblems.find((p) => p.id === id)?.statistics || null;
    }
  },

  /** Distinct topics across all problems — powers filter chips. */
  async getTopics(): Promise<string[]> {
    try {
      const res = await apiClient.get<{ success: boolean; data: string[] }>('/problems/topics/list');
      return res.data;
    } catch {
      return [...new Set(mockProblems.flatMap((p) => p.tags))].sort();
    }
  },

  /** Alias kept for components that call listTopics(). */
  listTopics(): Promise<string[]> {
    return this.getTopics();
  },

  /** User's submissions (optionally scoped to one problem) — submission history UI. */
  async getSubmissionHistory(problemId?: string, limit = 20): Promise<SubmissionHistoryEntry[]> {
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (problemId) params.set('problemId', problemId);
      const res = await apiClient.get<{ success: boolean; data: SubmissionHistoryEntry[] }>(
        `/users/me/submissions?${params.toString()}`
      );
      return res.data;
    } catch {
      return [];
    }
  },

  /** "Run" — sample/visible test cases via the backend sandbox. Nothing persisted. */
  async runTestCases(problemId: string, code: string, language: string): Promise<ExecutionResult> {
    const res = await apiClient.post<{ success: boolean; data: ExecutionResult }>(`/problems/${problemId}/run`, {
      code,
      language,
    });
    return res.data;
  },

  /** "Submit" — full suite incl. hidden tests; persists submission, updates problemSet XP/rating. */
  async submitSolution(problemId: string, code: string, language: string): Promise<ExecutionResult> {
    const res = await apiClient.post<{ success: boolean; data: ExecutionResult }>(`/problems/${problemId}/submit`, {
      code,
      language,
    });
    return res.data;
  },

  /** Teacher-only: create a problem with test cases. */
  async createProblem(payload: {
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    topics?: string[];
    constraints?: string;
    examples?: Array<{ input: string; output: string; explanation?: string }>;
    hints?: string[];
    starterCode?: Record<string, string>;
    testCases?: Array<{ id: string; input: string; expectedOutput: string; isPublic: boolean }>;
  }): Promise<Problem> {
    const res = await apiClient.post<{ success: boolean; data: Problem }>('/problems', payload);
    return res.data;
  },

  /** Teacher-only: update a problem. */
  async updateProblem(id: string, payload: Record<string, unknown>): Promise<Problem> {
    const res = await apiClient.put<{ success: boolean; data: Problem }>(`/problems/${id}`, payload);
    return res.data;
  },

  /** Teacher-only: delete a problem. */
  async deleteProblem(id: string): Promise<void> {
    await apiClient.delete(`/problems/${id}`);
  },

  getAIHint(problem: Problem, level: number): string {
    if (!problem.hints || problem.hints.length === 0) {
      return 'Consider breaking down the problem into smaller subproblems or using standard data structures.';
    }
    const index = Math.min(level - 1, problem.hints.length - 1);
    return problem.hints[Math.max(0, index)];
  },
};
