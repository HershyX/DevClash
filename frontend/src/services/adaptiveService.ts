import { apiClient } from './apiClient';
import type { AdaptiveSession, AdaptiveProblemAttempt } from '../types';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

/** Per-topic analytics row returned by GET /api/adaptive/skill-profile. */
export interface TopicAnalytics {
  topic: string;
  attempts: number;
  solved: number;
  accuracy: number;
  skillScore: number;
  confidence: number;
  avgAttemptsToSolve: number;
  avgSolveTimeSec: number;
  recentAccuracy: number | null;
}

export interface SkillAnalytics {
  topics: TopicAnalytics[];
  strongest: TopicAnalytics[];
  weakest: TopicAnalytics[];
  overall: { accuracy: number; totalAttempted: number; totalSolved: number; avgSolveTimeSec: number };
  difficultyPerformance: Record<'easy' | 'medium' | 'hard', { attempts: number; solved: number; accuracy: number; avgSolveTimeSec: number }>;
}

export interface AdaptiveSessionHistoryEntry {
  id: string;
  date: string;
  problems: number;
  solved: number;
  xp: number;
  ratingChange: number;
  durationSec: number;
  topics: string[];
  accuracy: number;
}

export const adaptiveService = {
  async getSessions(_userId: string): Promise<AdaptiveSession[]> {
    try {
      const res = await apiClient.get<ApiEnvelope<AdaptiveSession[]>>('/adaptive/sessions');
      return res.data;
    } catch {
      return [];
    }
  },

  async getSession(id: string): Promise<AdaptiveSession | null> {
    try {
      const res = await apiClient.get<ApiEnvelope<AdaptiveSession>>(`/adaptive/sessions/${id}`);
      return res.data;
    } catch {
      return null;
    }
  },

  /** Start (or resume) a session — backend picks the first problem via the engine. */
  async startSession(_userId: string, focusTopics: string[] = []): Promise<AdaptiveSession & { reasoning?: string | null }> {
    const res = await apiClient.post<ApiEnvelope<AdaptiveSession & { reasoning?: string | null }>>('/adaptive/session', {
      focusTopics,
    });
    return res.data;
  },

  /** Ask the engine for the next recommended problem in the session. */
  async getNextProblem(sessionId: string): Promise<(AdaptiveSession & { reasoning?: string | null }) | null> {
    try {
      const res = await apiClient.post<ApiEnvelope<AdaptiveSession & { reasoning?: string | null }>>(
        `/adaptive/session/${sessionId}/next`,
        {}
      );
      return res.data;
    } catch {
      return null;
    }
  },

  /** Submit code for the session's current problem (sandbox-evaluated). */
  async submitAttempt(
    sessionId: string,
    problemId: string,
    code: string,
    language: string,
    timeSpent: number
  ): Promise<AdaptiveProblemAttempt & {
    evalStatus: string;
    errorMessage?: string;
    passedCount: number;
    totalCount: number;
    xpEarned: number;
    ratingChange: number;
    session: AdaptiveSession;
    user?: unknown;
  }> {
    void problemId; // backend evaluates the session's staged problem
    const res = await apiClient.post<ApiEnvelope<AdaptiveProblemAttempt & {
      evalStatus: string;
      errorMessage?: string;
      passedCount: number;
      totalCount: number;
      xpEarned: number;
      ratingChange: number;
      session: AdaptiveSession;
      user?: unknown;
    }>>(`/adaptive/session/${sessionId}/submit`, { code, language, timeSpent });
    return res.data;
  },

  /** Full skill analytics: topics, strongest/weakest, accuracy, difficulty performance. */
  async getSkillProfile(_userId: string): Promise<SkillAnalytics> {
    try {
      const res = await apiClient.get<ApiEnvelope<SkillAnalytics>>('/adaptive/skill-profile');
      return res.data;
    } catch {
      return {
        topics: [],
        strongest: [],
        weakest: [],
        overall: { accuracy: 0, totalAttempted: 0, totalSolved: 0, avgSolveTimeSec: 0 },
        difficultyPerformance: {
          easy: { attempts: 0, solved: 0, accuracy: 0, avgSolveTimeSec: 0 },
          medium: { attempts: 0, solved: 0, accuracy: 0, avgSolveTimeSec: 0 },
          hard: { attempts: 0, solved: 0, accuracy: 0, avgSolveTimeSec: 0 },
        },
      };
    }
  },

  /** Completed session summaries for the "Recent Sessions" panel. */
  async getHistory(limit = 5): Promise<AdaptiveSessionHistoryEntry[]> {
    try {
      const res = await apiClient.get<ApiEnvelope<AdaptiveSessionHistoryEntry[]>>(`/adaptive/history?limit=${limit}`);
      return res.data;
    } catch {
      return [];
    }
  },

  async endSession(sessionId: string): Promise<AdaptiveSession> {
    const res = await apiClient.post<ApiEnvelope<AdaptiveSession>>(`/adaptive/session/${sessionId}/complete`, {});
    return res.data;
  },
};
