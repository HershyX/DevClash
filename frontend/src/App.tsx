import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppErrorHandler } from './components/AppErrorHandler';
import { PublicLayout } from './components/layout/AppLayout';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { PersonalDashboard } from './pages/PersonalDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { PracticePage } from './pages/PracticePage';
import { AdaptivePage } from './pages/AdaptivePage';
import { DuelPage } from './pages/DuelPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { PersonalPracticePage } from './pages/PersonalPracticePage';
import { PersonalAdaptivePage } from './pages/PersonalAdaptivePage';
import { PersonalDuelPage } from './pages/PersonalDuelPage';
import { PersonalLeaderboardPage } from './pages/PersonalLeaderboardPage';
import { PersonalProfilePage } from './pages/PersonalProfilePage';
import { TeacherClassroomsPage } from './pages/TeacherClassroomsPage';
import { TeacherStudentsPage } from './pages/TeacherStudentsPage';
import { TeacherAnalyticsPage } from './pages/TeacherAnalyticsPage';
import { TeacherProblemsPage } from './pages/TeacherProblemsPage';
import { TeacherLeaderboardPage } from './pages/TeacherLeaderboardPage';
import { ProblemDetailPage } from './pages/ProblemDetailPage';
import { BattleArenaPage } from './pages/BattleArenaPage';
import './index.css';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user?.role || '')) {
    return <Navigate to={`/${user?.role}`} replace />;
  }
  
  return <>{children}</>;
}

/** Redirects an authenticated user to the dashboard for their role. */
function DashboardRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user?.role ?? ''}`} replace />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppErrorHandler />
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardRedirect />} />
            </Route>

            <Route element={<AppLayout />}>
              <Route
                path="/student/*"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Routes>
                      <Route path="dashboard" element={<StudentDashboard />} />
                      <Route path="practice" element={<PracticePage />} />
                      <Route path="practice/:id" element={<ProblemDetailPage />} />
                      <Route path="adaptive" element={<AdaptivePage />} />
                      <Route path="duel" element={<DuelPage />} />
                      <Route path="leaderboard" element={<LeaderboardPage />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/personal/*"
                element={
                  <ProtectedRoute allowedRoles={['personal']}>
                    <Routes>
                      <Route path="dashboard" element={<PersonalDashboard />} />
                      <Route path="practice" element={<PersonalPracticePage />} />
                      <Route path="practice/:id" element={<ProblemDetailPage />} />
                      <Route path="adaptive" element={<PersonalAdaptivePage />} />
                      <Route path="duel" element={<PersonalDuelPage />} />
                      <Route path="leaderboard" element={<PersonalLeaderboardPage />} />
                      <Route path="profile" element={<PersonalProfilePage />} />
                      <Route path="" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/teacher/*"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <Routes>
                      <Route path="dashboard" element={<TeacherDashboard />} />
                      <Route path="classrooms" element={<TeacherClassroomsPage />} />
                      <Route path="classrooms/:id" element={<TeacherClassroomsPage />} />
                      <Route path="students" element={<TeacherStudentsPage />} />
                      <Route path="students/:id" element={<TeacherStudentsPage />} />
                      <Route path="analytics" element={<TeacherAnalyticsPage />} />
                      <Route path="problems" element={<TeacherProblemsPage />} />
                      <Route path="problems/:id" element={<ProblemDetailPage />} />
                      <Route path="leaderboard" element={<TeacherLeaderboardPage />} />
                      <Route path="" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Battle Arena — full screen, no sidebar/topnav */}
            <Route
              path="/student/duel/arena/:id"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <BattleArenaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/personal/duel/arena/:id"
              element={
                <ProtectedRoute allowedRoles={['personal']}>
                  <BattleArenaPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;