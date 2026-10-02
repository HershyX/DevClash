import { apiClient } from './apiClient';
import type { Classroom, ClassroomStudent, ClassroomSettings } from '../types';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const classroomService = {
  async getClassrooms(_teacherId: string): Promise<Classroom[]> {
    const res = await apiClient.get<ApiEnvelope<Classroom[]>>('/classrooms');
    return res.data;
  },

  async getClassroom(id: string): Promise<Classroom | null> {
    try {
      const res = await apiClient.get<ApiEnvelope<Classroom>>(`/classrooms/${id}`);
      return res.data;
    } catch {
      return null;
    }
  },

  async createClassroom(data: { name: string; description?: string; teacherId: string }): Promise<Classroom> {
    void data.teacherId; // backend derives the teacher from the JWT
    const res = await apiClient.post<ApiEnvelope<Classroom>>('/classrooms', {
      name: data.name,
      description: data.description,
    });
    return res.data;
  },

  async updateClassroom(id: string, data: Partial<Classroom>): Promise<Classroom> {
    const res = await apiClient.put<ApiEnvelope<Classroom>>(`/classrooms/${id}`, data);
    return res.data;
  },

  async deleteClassroom(id: string): Promise<void> {
    await apiClient.delete(`/classrooms/${id}`);
  },

  async addStudent(classroomId: string, student: { userId: string; name: string; email: string }): Promise<Classroom> {
    // Backend adds by email (the authoritative identifier).
    const res = await apiClient.post<ApiEnvelope<Classroom>>(`/classrooms/${classroomId}/students`, {
      email: student.email,
    });
    return res.data;
  },

  async removeStudent(classroomId: string, studentId: string): Promise<Classroom> {
    const res = await apiClient.delete<ApiEnvelope<Classroom>>(`/classrooms/${classroomId}/students/${studentId}`);
    return res.data;
  },

  async updateStudent(classroomId: string, studentId: string, data: Partial<ClassroomStudent>): Promise<ClassroomStudent> {
    // Not yet exposed by the backend; kept for interface compatibility.
    console.warn('updateStudent is not supported by the backend yet', classroomId, studentId, data);
    throw new Error('Not implemented on backend');
  },

  async getClassroomStudents(classroomId: string): Promise<ClassroomStudent[]> {
    const classroom = await this.getClassroom(classroomId);
    return classroom?.students ?? [];
  },

  async getClassroomAnalytics(classroomId: string): Promise<{
    totalStudents: number;
    activeStudents: number;
    averageDuelRating: number;
    averagePracticeRating: number;
    averageAdaptiveRating: number;
    activity: unknown[];
  }> {
    const res = await apiClient.get<ApiEnvelope<{
      totalStudents: number;
      activeStudents: number;
      averageDuelRating: number;
      averagePracticeRating: number;
      averageAdaptiveRating: number;
      activity: unknown[];
    }>>(`/classrooms/${classroomId}/analytics`);
    return res.data;
  },

  async getStudentDetail(classroomId: string, studentId: string): Promise<{
    student: ClassroomStudent;
    statistics: {
      totalBattles: number;
      winRate: number;
      problemsSolved: number;
      adaptiveSessions: number;
      currentStreak: number;
      ratingHistory: { date: string; duel: number; practice: number; adaptive: number }[];
    };
  } | null> {
    try {
      const res = await apiClient.get<ApiEnvelope<{
        student: ClassroomStudent;
        statistics: {
          totalBattles: number;
          winRate: number;
          problemsSolved: number;
          adaptiveSessions: number;
          currentStreak: number;
          ratingHistory: { date: string; duel: number; practice: number; adaptive: number }[];
        };
      }>>(`/classrooms/${classroomId}/students/${studentId}`);
      return res.data;
    } catch {
      return null;
    }
  },

  async updateSettings(classroomId: string, settings: ClassroomSettings): Promise<Classroom> {
    const res = await apiClient.put<ApiEnvelope<Classroom>>(`/classrooms/${classroomId}/settings`, settings);
    return res.data;
  },

  async joinByCode(code: string): Promise<{ classroomId: string; name: string; code: string }> {
    const res = await apiClient.post<ApiEnvelope<{ classroomId: string; name: string; code: string }>>(
      '/classrooms/join',
      { code }
    );
    return res.data;
  },

  /** Returns every student across all of the teacher's classrooms in one call. */
  async getAllStudents(): Promise<(ClassroomStudent & { classroom: string; classroomId: string })[]> {
    try {
      const res = await apiClient.get<ApiEnvelope<(ClassroomStudent & { classroom: string; classroomId: string })[]>>(
        '/classrooms/students'
      );
      return res.data;
    } catch {
      return [];
    }
  },
};
