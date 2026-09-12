import { apiClient } from './apiClient';
import type { LeaderboardEntry, ActivityEvent, StudentStatistics, TeacherAnalytics } from '../types';
import { mockLeaderboard, mockActivity, mockStudent, mockTeacher } from './mockData';

export const analyticsService = {
  async getLeaderboard(
    mode: 'duel' | 'practice' | 'adaptive',
    limit = 50,
    offset = 0
  ): Promise<LeaderboardEntry[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockLeaderboard.slice(offset, offset + limit);
  },

  async getUserRank(userId: string, mode: 'duel' | 'practice' | 'adaptive'): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 150));
    const userIndex = mockLeaderboard.findIndex(u => u.userId === userId);
    return userIndex >= 0 ? userIndex + 1 : mockLeaderboard.length + Math.floor(Math.random() * 1000) + 1;
  },

  async getActivityFeed(userId: string, limit = 20): Promise<ActivityEvent[]> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return mockActivity
      .filter(a => a.userId === userId)
      .slice(0, limit);
  },

  async getGlobalActivity(limit = 20): Promise<ActivityEvent[]> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return mockActivity.slice(0, limit);
  },

  async getStudentStatistics(userId: string): Promise<StudentStatistics> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return mockStudent.statistics;
  },

  async getTeacherAnalytics(teacherId: string): Promise<TeacherAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockTeacher.analytics;
  },

  async getRatingHistory(
    userId: string,
    mode: 'duel' | 'practice' | 'adaptive',
    days = 30
  ): Promise<{ date: string; rating: number }[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const baseRating = mode === 'duel' ? 1642 : mode === 'practice' ? 1287 : 1519;
    
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      rating: baseRating + Math.floor(Math.random() * 200) - 100 + Math.floor(i * 2),
    }));
  },

  async getWeeklyProgress(userId: string): Promise<{
    duel: { xp: number; battles: number; wins: number };
    practice: { xp: number; problems: number; solved: number };
    adaptive: { xp: number; sessions: number; completed: number };
  }> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return {
      duel: { xp: 42, battles: 8, wins: 5 },
      practice: { xp: 85, problems: 12, solved: 9 },
      adaptive: { xp: 67, sessions: 4, completed: 3 },
    };
  },

  async getSkillBreakdown(userId: string): Promise<Record<string, number>> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return {
      'Arrays & Strings': 85,
      'Hash Tables': 78,
      'Two Pointers': 72,
      'Sliding Window': 68,
      'Binary Search': 65,
      'Dynamic Programming': 45,
      'Graphs': 38,
      'Trees': 52,
      'Greedy': 58,
      'Math & Geometry': 42,
    };
  },

  async getComparisonData(userId: string, peerIds: string[]): Promise<{
    user: { duel: number; practice: number; adaptive: number };
    peers: Array<{ id: string; name: string; duel: number; practice: number; adaptive: number }>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      user: { duel: 1642, practice: 1287, adaptive: 1519 },
      peers: peerIds.map((id, i) => ({
        id,
        name: `Peer ${i + 1}`,
        duel: 1500 + Math.floor(Math.random() * 300),
        practice: 1100 + Math.floor(Math.random() * 300),
        adaptive: 1300 + Math.floor(Math.random() * 300),
      })),
    };
  },
};