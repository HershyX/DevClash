import type { Problem, ProblemStatistics, PaginatedResponse, ProblemTestCase } from '../types';
import { mockProblems } from './mockData';

export interface ExecutionResult {
  status: 'accepted' | 'wrong' | 'error' | 'timeout';
  passedCount: number;
  totalCount: number;
  runtimeMs: number;
  memoryMb: number;
  runtimePercentile: number;
  memoryPercentile: number;
  message: string;
  testCaseResults: Array<{
    id: string;
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  }>;
}

export const problemService = {
  async getProblems(
    page = 1,
    limit = 20,
    difficulty?: Problem['difficulty'],
    search?: string,
    topic?: string,
    statusFilter?: 'all' | 'solved' | 'unsolved'
  ): Promise<PaginatedResponse<Problem>> {
    await new Promise(resolve => setTimeout(resolve, 200));

    let problems = [...mockProblems];

    if (difficulty && difficulty !== ('all' as unknown)) {
      problems = problems.filter(p => p.difficulty === difficulty);
    }

    if (topic && topic !== 'All') {
      problems = problems.filter(p => p.tags.some(t => t.toLowerCase() === topic.toLowerCase()));
    }

    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'solved') {
        problems = problems.filter(p => p.solved);
      } else if (statusFilter === 'unsolved') {
        problems = problems.filter(p => !p.solved);
      }
    }

    if (search) {
      const query = search.toLowerCase();
      problems = problems.filter(
        p =>
          p.title.toLowerCase().includes(query) ||
          p.tags.some(t => t.toLowerCase().includes(query)) ||
          p.description.toLowerCase().includes(query)
      );
    }

    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      data: problems.slice(start, end),
      total: problems.length,
      page,
      limit,
      totalPages: Math.ceil(problems.length / limit),
    };
  },

  async getProblem(id: string): Promise<Problem | null> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return mockProblems.find(p => p.id === id) || null;
  },

  async getProblemStatistics(id: string): Promise<ProblemStatistics | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const problem = mockProblems.find(p => p.id === id);
    return problem?.statistics || null;
  },

  async runTestCases(problemId: string, _code: string, _language: string): Promise<ExecutionResult> {
    await new Promise(resolve => setTimeout(resolve, 750));
    const problem = mockProblems.find(p => p.id === problemId) || mockProblems[0];
    const testCases = problem.testCases || [
      { id: '1', input: 'sample 1', expectedOutput: 'output 1', isPublic: true },
      { id: '2', input: 'sample 2', expectedOutput: 'output 2', isPublic: true },
    ];

    const publicCases = testCases.filter(tc => tc.isPublic !== false);

    const testCaseResults = publicCases.map(tc => ({
      id: tc.id,
      input: tc.input,
      expected: tc.expectedOutput,
      actual: tc.expectedOutput,
      passed: true,
    }));

    return {
      status: 'accepted',
      passedCount: testCaseResults.length,
      totalCount: testCaseResults.length,
      runtimeMs: Math.floor(Math.random() * 35) + 38,
      memoryMb: +(Math.random() * 5 + 38.2).toFixed(1),
      runtimePercentile: 88,
      memoryPercentile: 79,
      message: `${testCaseResults.length}/${testCaseResults.length} test cases passed.`,
      testCaseResults,
    };
  },

  async submitSolution(problemId: string, _code: string, _language: string): Promise<ExecutionResult> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    const problem = mockProblems.find(p => p.id === problemId) || mockProblems[0];
    const testCases = problem.testCases || [
      { id: '1', input: 'test 1', expectedOutput: 'out 1' },
      { id: '2', input: 'test 2', expectedOutput: 'out 2' },
      { id: '3', input: 'test 3', expectedOutput: 'out 3' },
      { id: '4', input: 'test 4', expectedOutput: 'out 4' },
      { id: '5', input: 'test 5', expectedOutput: 'out 5' },
    ];

    problem.solved = true;

    const testCaseResults = testCases.map(tc => ({
      id: tc.id,
      input: tc.input,
      expected: tc.expectedOutput,
      actual: tc.expectedOutput,
      passed: true,
    }));

    return {
      status: 'accepted',
      passedCount: testCases.length,
      totalCount: testCases.length,
      runtimeMs: Math.floor(Math.random() * 30) + 42,
      memoryMb: +(Math.random() * 6 + 40.1).toFixed(1),
      runtimePercentile: Math.floor(Math.random() * 15) + 82,
      memoryPercentile: Math.floor(Math.random() * 15) + 75,
      message: `All ${testCases.length} test cases passed successfully! Accepted.`,
      testCaseResults,
    };
  },

  getAIHint(problem: Problem, level: number): string {
    if (!problem.hints || problem.hints.length === 0) {
      return 'Consider breaking down the problem into smaller subproblems or using standard data structures.';
    }
    const index = Math.min(level - 1, problem.hints.length - 1);
    return problem.hints[Math.max(0, index)];
  },
};