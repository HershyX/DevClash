export type UserRole = 'student' | 'teacher' | 'personal';

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface StudentUser extends BaseUser {
  role: 'student';
  duelRating: Rating;
  practiceRating: Rating;
  adaptiveRating: Rating;
  statistics: StudentStatistics;
}

export interface TeacherUser extends BaseUser {
  role: 'teacher';
  classrooms: ClassroomSummary[];
  totalStudents: number;
  analytics: TeacherAnalytics;
}

export interface PersonalUser extends BaseUser {
  role: 'personal';
  duelRating: Rating;
  practiceRating: Rating;
  adaptiveRating: Rating;
  statistics: StudentStatistics;
}

export type User = StudentUser | TeacherUser | PersonalUser;

export interface Rating {
  rating: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  weeklyXpGain: number;
  trend: 'up' | 'down' | 'stable';
  rank?: string;
  percentile?: number;
}

export interface StudentStatistics {
  totalBattles: number;
  battlesWon: number;
  battlesLost: number;
  winRate: number;
  problemsSolved: number;
  problemsAttempted: number;
  adaptiveSessions: number;
  totalXp: number;
  currentStreak: number;
  maxStreak: number;
  averageRating: number;
}

export interface TeacherAnalytics {
  totalClassrooms: number;
  totalStudents: number;
  activeStudents: number;
  averageDuelRating: number;
  averagePracticeRating: number;
  averageAdaptiveRating: number;
  topStudents: LeaderboardEntry[];
  recentActivity: ActivityEvent[];
}

export interface ClassroomSummary {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  createdAt: string;
  isActive: boolean;
}

export interface Classroom {
  id: string;
  name: string;
  code: string;
  subject?: string;
  section?: string;
  description?: string;
  teacherId: string;
  students: ClassroomStudent[];
  studentCount?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  settings: ClassroomSettings;
}

export interface ClassroomStudent {
  userId: string;
  name: string;
  email: string;
  joinedAt: string;
  duelRating: number;
  practiceRating: number;
  adaptiveRating: number;
  problemsSolved?: number;
  battles?: number;
  accuracy?: number;
  isActive: boolean;
  lastActive: string;
}

export interface ClassroomSettings {
  allowDuel: boolean;
  allowPractice: boolean;
  allowAdaptive: boolean;
  visibility: 'private' | 'public';
}

export interface ProblemTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isPublic?: boolean;
}

export interface Problem {
  id: string;
  title: string;
  slug?: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics?: string[];
  tags: string[];
  constraints: string;
  examples: ProblemExample[];
  hints?: string[];
  starterCode: Record<string, string>;
  supportedLanguages?: string[];
  xpReward?: { easy: number; medium: number; hard: number };
  solution?: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  statistics: ProblemStatistics;
  solved?: boolean;
  testCases?: ProblemTestCase[];
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemStatistics {
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  averageTime: number;
  averageMemory: number;
}

export interface Battle {
  id: string;
  battleCode?: string;
  isRanked?: boolean;
  status: 'waiting' | 'matched' | 'active' | 'completed' | 'cancelled';
  mode: 'duel' | 'practice' | 'adaptive';
  participants: BattleParticipant[];
  problem?: Problem;
  startedAt?: string;
  endedAt?: string;
  result?: BattleResult;
  timeLimit: number;
  language: string;
}

export interface BattleParticipant {
  userId: string;
  name: string;
  avatar?: string;
  rating: number;
  code?: string;
  score?: number;
  status: 'connected' | 'disconnected' | 'submitted' | 'coding' | 'passed' | 'failed';
  testCasesPassed?: number;
  totalTestCases?: number;
}

export interface BattleResult {
  winnerId?: string;
  isVictory?: boolean;
  scores: Record<string, number>;
  duration: number;
  ratingChange?: number;
  xpGained?: number;
  newRating?: number;
  streak?: number;
  submissions: BattleSubmission[];
}

export interface BattleSubmission {
  userId: string;
  code: string;
  language: string;
  status: 'accepted' | 'wrong' | 'timeout' | 'error';
  score: number;
  submittedAt: string;
}

export interface AdaptiveSession {
  id: string;
  userId: string;
  status: 'active' | 'completed' | 'paused';
  currentProblem?: Problem;
  problemsAttempted: AdaptiveProblemAttempt[];
  startedAt: string;
  endedAt?: string;
  skillProfile: SkillProfile;
}

export interface AdaptiveProblemAttempt {
  problemId: string;
  problemTitle: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'solved' | 'attempted' | 'skipped';
  timeSpent: number;
  attempts: number;
  ratingChange: number;
  xpEarned?: number;
}

export interface SkillCategory {
  name: string;
  score: number;
  problemsSolved: number;
  accuracy: number;
}

export interface SkillProfile {
  strengths: string[];
  weaknesses: string[];
  recommendedTopics: string[];
  estimatedRating: number;
  confidence: number;
  categories?: SkillCategory[];
  reasoningMessage?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  rating: number;
  level: number;
  xp: number;
  winRate?: number;
  problemsSolved?: number;
}

export interface ActivityEvent {
  id: string;
  type: 'battle' | 'problem' | 'adaptive' | 'classroom' | 'achievement';
  userId: string;
  userName: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type DashboardRoute = 
  | '/student' 
  | '/student/practice' 
  | '/student/adaptive' 
  | '/student/duel' 
  | '/student/leaderboard' 
  | '/student/profile'
  | '/personal' 
  | '/personal/practice' 
  | '/personal/adaptive' 
  | '/personal/duel' 
  | '/personal/leaderboard' 
  | '/personal/profile'
  | '/teacher' 
  | '/teacher/classrooms' 
  | '/teacher/students' 
  | '/teacher/analytics' 
  | '/teacher/problems';

export interface NavigationItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
  children?: NavigationItem[];
}