import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Layout } from './components/Layout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { useLocaleStore } from './store/localeStore';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Courses = lazy(() => import('./pages/Courses').then((m) => ({ default: m.Courses })));
const CourseView = lazy(() => import('./pages/CourseView').then((m) => ({ default: m.CourseView })));
const LessonView = lazy(() => import('./pages/LessonView').then((m) => ({ default: m.LessonView })));
const ExerciseView = lazy(() => import('./pages/ExerciseView').then((m) => ({ default: m.ExerciseView })));
const Builds = lazy(() => import('./pages/Builds').then((m) => ({ default: m.Builds })));
const BuildEditor = lazy(() => import('./pages/BuildEditor').then((m) => ({ default: m.BuildEditor })));
const Worlds = lazy(() => import('./pages/Worlds').then((m) => ({ default: m.Worlds })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Community = lazy(() => import('./pages/Community').then((m) => ({ default: m.Community })));
const Challenges = lazy(() => import('./pages/Challenges').then((m) => ({ default: m.Challenges })));
const Leaderboard = lazy(() => import('./pages/Leaderboard').then((m) => ({ default: m.Leaderboard })));
const AvatarCustomizer = lazy(() => import('./pages/AvatarCustomizer').then((m) => ({ default: m.AvatarCustomizer })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export function App() {
  const { initialize } = useAuthStore();
  const { initialize: initializeTheme } = useThemeStore();
  const { initialize: initializeLocale } = useLocaleStore();

  React.useEffect(() => {
    initialize();
    initializeTheme();
    initializeLocale();
  }, [initialize, initializeTheme, initializeLocale]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner size="large" />}>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseView />} />
            <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonView />} />
            <Route path="/courses/:courseId/lessons/:lessonId/exercises/:exerciseId" element={<ExerciseView />} />
            <Route path="/builds" element={<Builds />} />
            <Route path="/builds/new" element={<ProtectedRoute><BuildEditor /></ProtectedRoute>} />
            <Route path="/builds/:buildId" element={<BuildEditor />} />
            <Route path="/worlds" element={<Worlds />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/community" element={<Community />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/avatar" element={<ProtectedRoute><AvatarCustomizer /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Suspense>
    </ErrorBoundary>
  );
}