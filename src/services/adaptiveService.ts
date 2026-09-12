import { apiClient } from './apiClient';
import type { AdaptiveSession, SkillProfile, AdaptiveProblemAttempt } from '../types';
import { mockProblems } from './mockData';

const mockSessions: AdaptiveSession[] = [
  {
    id: 'adaptive-1',
    userId: 'student-1',
    status: 'completed',
    problemsAttempted: [
      { problemId: 'prob-1', problemTitle: 'Two Sum', difficulty: 'easy', status: 'solved', timeSpent: 420, attempts: 1, ratingChange: 12 },
      { problemId: 'prob-2', problemTitle: 'Longest Substring', difficulty: 'medium', status: 'solved', timeSpent: 890, attempts: 2, ratingChange: 18 },
      { problemId: 'prob-3', problemTitle: 'Median of Two Arrays', difficulty: 'hard', status: 'attempted', timeSpent: 1200, attempts: 3, ratingChange: -5 },
    ],
    startedAt: '2024-03-14T19:00:00Z',
    endedAt: '2024-03-14T19:45:00Z',
    skillProfile: {
      strengths: ['Arrays', 'Hash Tables', 'Two Pointers'],
      weaknesses: ['Dynamic Programming', 'Graph Algorithms', 'Advanced Math'],
      recommendedTopics: ['Sliding Window', 'Binary Search', 'Greedy Algorithms'],
      estimatedRating: 1519,
      confidence: 0.87,
    },
  },
];

export const adaptiveService = {
  async getSessions(userId: string): Promise<AdaptiveSession[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockSessions.filter(s => s.userId === userId);
  },

  async getSession(id: string): Promise<AdaptiveSession | null> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return mockSessions.find(s => s.id === id) || null;
  },

  async startSession(userId: string): Promise<AdaptiveSession> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newSession: AdaptiveSession = {
      id: `adaptive-${Date.now()}`,
      userId,
      status: 'active',
      problemsAttempted: [],
      startedAt: new Date().toISOString(),
      skillProfile: {
        strengths: [],
        weaknesses: [],
        recommendedTopics: [],
        estimatedRating: 1200,
        confidence: 0.5,
      },
    };
    mockSessions.push(newSession);
    return newSession;
  },

  async getNextProblem(sessionId: string): Promise<AdaptiveSession | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const session = mockSessions.find(s => s.id === sessionId);
    if (!session || session.status !== 'active') return null;
    
    const availableProblems = mockProblems.filter(p => 
      !session.problemsAttempted.some(a => a.problemId === p.id)
    );
    
    if (availableProblems.length === 0) {
      session.status = 'completed';
      session.endedAt = new Date().toISOString();
      return session;
    }
    
    const nextProblem = availableProblems[Math.floor(Math.random() * availableProblems.length)];
    session.currentProblem = nextProblem;
    return session;
  },

  async submitAttempt(
    sessionId: string,
    problemId: string,
    code: string,
    language: string,
    timeSpent: number
  ): Promise<AdaptiveProblemAttempt> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const session = mockSessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');
    
    const problem = mockProblems.find(p => p.id === problemId);
    if (!problem) throw new Error('Problem not found');
    
    const passed = Math.random() > 0.25;
    const attempts = (session.problemsAttempted.find(a => a.problemId === problemId)?.attempts || 0) + 1;
    const ratingChange = passed ? Math.floor(Math.random() * 20) + 5 : -Math.floor(Math.random() * 10) - 1;
    
    const attempt: AdaptiveProblemAttempt = {
      problemId,
      problemTitle: problem.title,
      difficulty: problem.difficulty,
      status: passed ? 'solved' : 'attempted',
      timeSpent,
      attempts,
      ratingChange,
    };
    
    const existingIndex = session.problemsAttempted.findIndex(a => a.problemId === problemId);
    if (existingIndex >= 0) {
      session.problemsAttempted[existingIndex] = attempt;
    } else {
      session.problemsAttempted.push(attempt);
    }
    
    session.skillProfile.estimatedRating += ratingChange;
    
    return attempt;
  },

  async getSkillProfile(userId: string): Promise<SkillProfile> {
    await new Promise(resolve => setTimeout(resolve, 150));
    const session = mockSessions.find(s => s.userId === userId && s.status === 'completed');
    return session?.skillProfile || {
      strengths: [],
      weaknesses: [],
      recommendedTopics: [],
      estimatedRating: 1000,
      confidence: 0,
    };
  },

  async endSession(sessionId: string): Promise<AdaptiveSession> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const session = mockSessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');
    
    session.status = 'completed';
    session.endedAt = new Date().toISOString();
    return session;
  },
};