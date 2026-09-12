import { apiClient } from './apiClient';
import type { Classroom, ClassroomStudent, ClassroomSettings, PaginatedResponse } from '../types';
import { mockClassrooms, mockActivity } from './mockData';

export const classroomService = {
  async getClassrooms(teacherId: string): Promise<Classroom[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockClassrooms.filter(c => c.teacherId === teacherId);
  },

  async getClassroom(id: string): Promise<Classroom | null> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return mockClassrooms.find(c => c.id === id) || null;
  },

  async createClassroom(data: { name: string; description?: string; teacherId: string }): Promise<Classroom> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const code = data.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase() + '-' + new Date().getFullYear().toString().slice(-2);
    
    const newClassroom: Classroom = {
      id: `class-${Date.now()}`,
      name: data.name,
      code: `${code}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`,
      description: data.description,
      teacherId: data.teacherId,
      students: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        allowDuel: true,
        allowPractice: true,
        allowAdaptive: true,
        visibility: 'private',
      },
    };
    
    mockClassrooms.push(newClassroom);
    return newClassroom;
  },

  async updateClassroom(id: string, data: Partial<Classroom>): Promise<Classroom> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = mockClassrooms.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Classroom not found');
    
    mockClassrooms[index] = {
      ...mockClassrooms[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    return mockClassrooms[index];
  },

  async deleteClassroom(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = mockClassrooms.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Classroom not found');
    mockClassrooms.splice(index, 1);
  },

  async addStudent(classroomId: string, student: Omit<ClassroomStudent, 'joinedAt' | 'lastActive'>): Promise<Classroom> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const classroom = mockClassrooms.find(c => c.id === classroomId);
    if (!classroom) throw new Error('Classroom not found');
    
    const newStudent: ClassroomStudent = {
      ...student,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    
    classroom.students.push(newStudent);
    classroom.studentCount = classroom.students.length;
    classroom.updatedAt = new Date().toISOString();
    
    return classroom;
  },

  async removeStudent(classroomId: string, studentId: string): Promise<Classroom> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const classroom = mockClassrooms.find(c => c.id === classroomId);
    if (!classroom) throw new Error('Classroom not found');
    
    classroom.students = classroom.students.filter(s => s.userId !== studentId);
    classroom.studentCount = classroom.students.length;
    classroom.updatedAt = new Date().toISOString();
    
    return classroom;
  },

  async updateStudent(classroomId: string, studentId: string, data: Partial<ClassroomStudent>): Promise<ClassroomStudent> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const classroom = mockClassrooms.find(c => c.id === classroomId);
    if (!classroom) throw new Error('Classroom not found');
    
    const student = classroom.students.find(s => s.userId === studentId);
    if (!student) throw new Error('Student not found');
    
    Object.assign(student, data);
    classroom.updatedAt = new Date().toISOString();
    
    return student;
  },

  async getClassroomStudents(classroomId: string): Promise<ClassroomStudent[]> {
    await new Promise(resolve => setTimeout(resolve, 150));
    const classroom = mockClassrooms.find(c => c.id === classroomId);
    return classroom?.students || [];
  },

  async getClassroomAnalytics(classroomId: string): Promise<{
    totalStudents: number;
    activeStudents: number;
    averageDuelRating: number;
    averagePracticeRating: number;
    averageAdaptiveRating: number;
    activity: typeof mockActivity;
  }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const classroom = mockClassrooms.find(c => c.id === classroomId);
    if (!classroom) throw new Error('Classroom not found');
    
    const activeStudents = classroom.students.filter(s => s.isActive);
    
    return {
      totalStudents: classroom.students.length,
      activeStudents: activeStudents.length,
      averageDuelRating: Math.round(classroom.students.reduce((a, b) => a + b.duelRating, 0) / classroom.students.length) || 0,
      averagePracticeRating: Math.round(classroom.students.reduce((a, b) => a + b.practiceRating, 0) / classroom.students.length) || 0,
      averageAdaptiveRating: Math.round(classroom.students.reduce((a, b) => a + b.adaptiveRating, 0) / classroom.students.length) || 0,
      activity: mockActivity.filter(a => classroom.students.some(s => s.userId === a.userId)),
    };
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
    await new Promise(resolve => setTimeout(resolve, 200));
    const classroom = mockClassrooms.find(c => c.id === classroomId);
    if (!classroom) return null;
    
    const student = classroom.students.find(s => s.userId === studentId);
    if (!student) return null;
    
    return {
      student,
      statistics: {
        totalBattles: Math.floor(Math.random() * 50) + 20,
        winRate: Math.floor(Math.random() * 40) + 40,
        problemsSolved: Math.floor(Math.random() * 100) + 50,
        adaptiveSessions: Math.floor(Math.random() * 20) + 5,
        currentStreak: Math.floor(Math.random() * 10),
        ratingHistory: Array.from({ length: 12 }, (_, i) => ({
          date: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          duel: student.duelRating + Math.floor(Math.random() * 100) - 50,
          practice: student.practiceRating + Math.floor(Math.random() * 100) - 50,
          adaptive: student.adaptiveRating + Math.floor(Math.random() * 100) - 50,
        })),
      },
    };
  },

  async updateSettings(classroomId: string, settings: ClassroomSettings): Promise<Classroom> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const classroom = mockClassrooms.find(c => c.id === classroomId);
    if (!classroom) throw new Error('Classroom not found');
    
    classroom.settings = settings;
    classroom.updatedAt = new Date().toISOString();
    
    return classroom;
  },
};