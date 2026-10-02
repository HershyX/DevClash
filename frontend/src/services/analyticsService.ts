import { apiClient } from './apiClient';
import type { LeaderboardEntry, ActivityEvent, StudentStatistics, TeacherAnalytics } from '../types';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

type Mode = 'duel' | 'practice' | 'adaptive';

export const analyticsService = {
  async getLeaderboard(mode: Mode, limit = 50, offset = 0): Promise<LeaderboardEntry[]> {
    try {
      const res = await apiClient.get<ApiEnvelope<LeaderboardEntry[]>>(
        `/analytics/leaderboard?ladder=${mode}&limit=${limit}&offset=${offset}`
      );
      return res.data;
    } catch {
      return [];
    }
  },

  async getUserRank(userId: string, mode: Mode): Promise<number> {
    void userId; // backend derives the user from the JWT
    // Translate frontend 'practice' to the backend's ladder name 'problemSet'
    const ladderParam = mode === 'practice' ? 'problemSet' : mode;
    try {
      const res = await apiClient.get<ApiEnvelope<{ rank: number }>>(`/analytics/rank?ladder=${ladderParam}`);
      return res.data.rank;
    } catch {
      return 0;
    }
  },

  async getActivityFeed(userId: string, limit = 20): Promise<ActivityEvent[]> {
    void userId;
    try {
      const res = await apiClient.get<ApiEnvelope<ActivityEvent[]>>(`/analytics/activity?limit=${limit}`);
      return res.data;
    } catch {
      return [];
    }
  },

  async getGlobalActivity(limit = 20): Promise<ActivityEvent[]> {
    try {
      const res = await apiClient.get<ApiEnvelope<ActivityEvent[]>>(`/analytics/activity?scope=global&limit=${limit}`);
      return res.data;
    } catch {
      return [];
    }
  },

  async getStudentStatistics(userId: string): Promise<StudentStatistics> {
    void userId;
    const res = await apiClient.get<ApiEnvelope<StudentStatistics>>('/analytics/statistics');
    return res.data;
  },

  async getTeacherAnalytics(teacherId: string): Promise<TeacherAnalytics> {
    void teacherId;
    const res = await apiClient.get<ApiEnvelope<TeacherAnalytics>>('/analytics/teacher');
    return res.data;
  },

  async getRatingHistory(userId: string, mode: Mode, days = 30): Promise<{ date: string; rating: number }[]> {
    void userId;
    try {
      const ladderParam = mode === 'practice' ? 'problemSet' : mode;
      const res = await apiClient.get<ApiEnvelope<{ date: string; rating: number }[]>>(
        `/analytics/rating-history?ladder=${ladderParam}&days=${days}`
      );
      return res.data;
    } catch {
      return [];
    }
  },

  async getWeeklyProgress(userId: string): Promise<{
    duel: { xp: number; battles: number; wins: number };
    practice: { xp: number; problems: number; solved: number };
    adaptive: { xp: number; sessions: number; completed: number };
  }> {
    void userId;
    try {
      const res = await apiClient.get<ApiEnvelope<{
        duel: { xp: number; battles: number; wins: number };
        practice: { xp: number; problems: number; solved: number };
        adaptive: { xp: number; sessions: number; completed: number };
      }>>('/analytics/weekly-progress');
      return res.data;
    } catch {
      return {
        duel: { xp: 0, battles: 0, wins: 0 },
        practice: { xp: 0, problems: 0, solved: 0 },
        adaptive: { xp: 0, sessions: 0, completed: 0 },
      };
    }
  },

  async getSkillBreakdown(userId: string): Promise<Record<string, number>> {
    void userId;
    try {
      const res = await apiClient.get<ApiEnvelope<Record<string, number>>>('/analytics/skill-breakdown');
      return res.data;
    } catch {
      return {};
    }
  },

  async getComparisonData(userId: string, peerIds: string[]): Promise<{
    user: { duel: number; practice: number; adaptive: number };
    peers: Array<{ id: string; name: string; duel: number; practice: number; adaptive: number }>;
  }> {
    // Peer comparison endpoint not yet built; derive from leaderboard.
    void userId;
    const [duel, practice, adaptive] = await Promise.all([
      this.getLeaderboard('duel', 10),
      this.getLeaderboard('practice', 10),
      this.getLeaderboard('adaptive', 10),
    ]);
    return {
      user: {
        duel: duel[0]?.rating ?? 1200,
        practice: practice[0]?.rating ?? 1200,
        adaptive: adaptive[0]?.rating ?? 1200,
      },
      peers: peerIds.map((id, i) => ({
        id,
        name: duel[i]?.name ?? `Peer ${i + 1}`,
        duel: duel[i]?.rating ?? 1200,
        practice: practice[i]?.rating ?? 1200,
        adaptive: adaptive[i]?.rating ?? 1200,
      })),
    };
  },
};
