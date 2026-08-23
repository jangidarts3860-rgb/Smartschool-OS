import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole } from './types';
import Login from './components/Login';
import ForcePasswordChange from './components/ForcePasswordChange';
import Layout from './components/Layout';
import PlaceholderPage from './components/shared/PlaceholderPage';
import ErrorBoundary from './components/shared/ErrorBoundary';
import MagicLinkHandler from './components/MagicLinkHandler';
import MaintenancePage from './components/MaintenancePage';
import NotFoundPage from './components/NotFoundPage';
import { getRoleBasePath } from './config/navItems';
import { useAuth } from './hooks/useAuth';
import { userService } from './services/firestore';
import { signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { authService } from './services/authService';
import { AlertCircle } from 'lucide-react';
import { initializeFcmForUser, onForegroundMessage } from './services/fcmService';
import { db } from './services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getDeterministicAvatar } from './constants';

const Dashboard = lazy(() => import('./components/Dashboard'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const FeeManagement = lazy(() => import('./components/admin/FeeManagement'));
const Settings = lazy(() => import('./components/Settings'));
const ClassManagement = lazy(() => import('./components/admin/ClassManagement'));
const AcademicSetup = lazy(() => import('./components/admin/AcademicSetup'));
const StudentProfile = lazy(() => import('./components/shared/StudentProfile'));
const TeacherProfile = lazy(() => import('./components/admin/TeacherProfile'));
const TeacherManagement = lazy(() => import('./components/admin/TeacherManagement'));

const Reports = lazy(() => import('./components/admin/ReportsCenter'));
const WhatsAppCenter = lazy(() => import('./components/admin/WhatsAppCenter'));
const LibraryManagement = lazy(() => import('./components/admin/LibraryManagement'));
const TimetableManagement = lazy(() => import('./components/admin/TimetableManagement'));
const AttendanceManagement = lazy(() => import('./components/admin/AttendanceManagement'));
const TeacherAttendance = lazy(() => import('./components/teacher/AttendanceManagement'));
const Exams = lazy(() => import('./components/admin/ExamManagement'));
const ResultManagement = lazy(() => import('./components/admin/ResultManagement'));
const ReportCardGenerator = lazy(() => import('./components/admin/ReportCardGenerator'));
const ParentPortal = lazy(() => import('./components/parent/ParentPortal'));
const SchoolSettings = lazy(() => import('./components/admin/SchoolSettings'));
const NotificationCenter = lazy(() => import('./components/admin/NotificationCenter'));
const TransportManagement = lazy(() => import('./components/admin/TransportManagement'));
const HomeworkOverview = lazy(() => import('./components/admin/HomeworkOverview'));
const TeacherHomework = lazy(() => import('./components/teacher/TeacherHomework'));
const CreateHomework = lazy(() => import('./components/teacher/CreateHomework'));
const NoticeBoard = lazy(() => import('./components/admin/NoticeBoard'));
const TeacherNotices = lazy(() => import('./components/teacher/TeacherNotices'));
const SubjectManagement = lazy(() => import('./components/admin/SubjectManagement'));
const TeacherDashboard = lazy(() => import('./components/teacher/TeacherDashboard'));
const StudentManager = lazy(() => import('./components/teacher/StudentManager'));
const TeacherGrades = lazy(() => import('./components/teacher/TeacherGrades'));
const StudentDashboard = lazy(() => import('./components/student/StudentDashboard'));
const StudentResult = lazy(() => import('./components/student/StudentResult'));
const StudentFees = lazy(() => import('./components/student/StudentFees'));
const StudentHomework = lazy(() => import('./components/student/StudentHomework'));
const StudentNotices = lazy(() => import('./components/student/StudentNotices'));
const StudentAttendance = lazy(() => import('./components/student/StudentAttendance'));
const StudentTimetable = lazy(() => import('./components/student/StudentTimetable'));
const StudentLibrary = lazy(() => import('./components/student/StudentLibrary'));
const StudentTransport = lazy(() => import('./components/student/StudentTransport'));
const ParentFees = lazy(() => import('./components/parent/ParentFees'));
const ParentHomework = lazy(() => import('./components/parent/ParentHomework'));
const ParentAttendance = lazy(() => import('./components/parent/ParentAttendance'));
const ParentResults = lazy(() => import('./components/parent/ParentResults'));
const ParentTransport = lazy(() => import('./components/parent/ParentTransport'));
const ParentNotices = lazy(() => import('./components/parent/ParentNotices'));
const TeacherLibrary = lazy(() => import('./components/teacher/TeacherLibrary'));
const ParentLibrary = lazy(() => import('./components/parent/ParentLibrary'));
const CerebroDashboard = lazy(() => import('./components/admin/CerebroDashboard'));
import CerebroAssistant from './components/shared/CerebroAssistant';
import PWAInstallBanner from './components/shared/PWAInstallBanner';
import OnboardingWizard from './components/OnboardingWizard';

const IS_MOCK_MODE = true;

const Placeholder = ({ title }: { title: string }) => (
  <PlaceholderPage title={title} estimatedRelease="Q1 2025" />
);

const StudentProfileRoute: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  return <StudentProfile studentId={id || ''} user={user} onBack={() => navigate(-1)} />;
};

const TeacherProfileRoute: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  return <TeacherProfile teacherId={id || ''} onBack={() => navigate(-1)} />;
};

const App: React.FC = () => {
  const { user: firebaseUser, loading: authLoading, error: authError } = useAuth();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isDarkMode, setIsDarkMode] = React.useState(true);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [showForcePasswordChange, setShowForcePasswordChange] = React.useState(false);
  const [maintenanceMode, setMaintenanceMode] = React.useState<{ enabled: boolean; message: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const profileFetchedRef = React.useRef(false);

  React.useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  React.useEffect(() => {
    if (location.pathname.startsWith('/auth/')) {
      setLoading(false);
      return;
    }

    const hydrateUser = (rawUser: User): User => {
      const avatar = getDeterministicAvatar(rawUser.name, rawUser.role);
      const classId = (rawUser.role === UserRole.STUDENT && (rawUser.uniqueId === 'STU001' || rawUser.id === 'stu001' || !rawUser.classId)) ? '12A' : rawUser.classId;
      return { ...rawUser, classId: classId || rawUser.classId, avatar };
    };

    // =====================================================
    // MOCK MODE: No Firebase, no Firestore, no validation.
    // Profile lives 100% in localStorage via authService.
    // =====================================================
    if (IS_MOCK_MODE) {
      const stored = authService.getStoredSession();
      if (stored) {
        setUser(hydrateUser(stored));
      }
      setLoading(false);
      return;
    }

    // =====================================================
    // PRODUCTION MODE: Use Firebase Auth + Firestore
    // =====================================================

    // Restore cached session immediately on mount to avoid flash of login screen
    if (!user) {
      const quickStored = authService.getStoredSession();
      if (quickStored) {
        setUser(hydrateUser(quickStored));
        setLoading(false);
      }
    }

    if (firebaseUser && !authLoading && !profileFetchedRef.current) {
      profileFetchedRef.current = true;
      const fetchUserProfile = async () => {
        try {
          const userProfile = await userService.getUser(firebaseUser.uid);
          if (userProfile) {
            const hydrated = hydrateUser(userProfile);
            setUser(hydrated);
            authService.storeSession(hydrated);
          }
        } catch {
          // Firestore fetch failed — keep the cached session, do NOT clear it
          const stored = authService.getStoredSession();
          if (stored && !user) {
            setUser(hydrateUser(stored));
          }
        }
        setLoading(false);
      };
      fetchUserProfile();
    } else if (!firebaseUser && !authLoading) {
      const initSession = async () => {
        const storedUser = authService.getStoredSession();
        if (storedUser) {
          try {
            const isValid = await Promise.race([
              authService.checkSessionValid(storedUser),
              new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 500))
            ]);
            if (isValid) {
              setUser(hydrateUser(storedUser));
              setLoading(false);
              return;
            }
            // Session invalidated server-side — clear it
            authService.clearSession();
          } catch {
            // Network error validating — keep stored session as fallback
            setUser(hydrateUser(storedUser));
            setLoading(false);
            return;
          }
        }
        setLoading(false);
      };
      initSession();
    }
  }, [firebaseUser, authLoading]);

  React.useEffect(() => {
    if (user?.role === UserRole.ADMIN && user.isFirstLogin && !sessionStorage.getItem('onboarding_dismissed')) {
      setShowOnboarding(true);
    }
    if (user?.isFirstLogin && !showOnboarding) {
      setShowForcePasswordChange(true);
    }
  }, [user, showOnboarding]);

  React.useEffect(() => {
    if (user) {
      const roleBase = getRoleBasePath(user.role);
      const rolePrefix = `/${roleBase.split('/')[1]}`;
      if (location.pathname === '/' || !location.pathname.startsWith(rolePrefix)) {
        navigate(roleBase, { replace: true });
      }
    }
  }, [user]);

  const handleForcePasswordComplete = (newCredential: string) => {
    setShowForcePasswordChange(false);
    if (user) {
      // FIXED: update both the localStorage session AND the React state.
      // Previously, only localStorage was updated, causing the useEffect at
      // line 163-170 to re-trigger ForcePasswordChange on every render
      // because `user.isFirstLogin` was still `true` in React state.
      const updatedUser = { ...user, isFirstLogin: false };
      setUser(updatedUser);
      authService.storeSession(updatedUser);
      void newCredential; // newCredential is already hashed in setFirstLoginComplete
    }
  };

  const handleForcePasswordLogout = () => {
    setShowForcePasswordChange(false);
    setUser(null);
    authService.clearSession();
    navigate('/');
  };

  // FCM: request notification permission + register token when user logs in
  React.useEffect(() => {
    if (IS_MOCK_MODE) return;
    if (!user || !user.schoolId || !user.id) return;
    let unsub: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      try {
        const token = await initializeFcmForUser(user.schoolId!, user.id!);
        if (cancelled || !token) return;
        const result = await onForegroundMessage((payload) => {
          const title = payload.notification?.title || 'SmartSchool';
          const body = payload.notification?.body || '';
          // Native browser notification (in addition to in-app toast)
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(title, { body, icon: '/icon-192.png' });
            } catch {
              // Some browsers block new Notification() from non-SW context
            }
          }
          console.info('[FCM] foreground message:', title, body);
        });
        if (!result.ok) {
          console.info('[FCM] foreground message listener unavailable:', result.reason);
          return;
        }
        unsub = result.unsubscribe;
      } catch (err) {
        console.warn('[FCM] init failed:', err);
      }
    })();
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [user?.id, user?.schoolId]);

  // Maintenance mode check
  React.useEffect(() => {
    if (IS_MOCK_MODE) return;
    if (!user?.schoolId) return;
    const maintenanceRef = doc(db, 'schools', user.schoolId, 'config', 'maintenance');
    const unsub = onSnapshot(maintenanceRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as { enabled: boolean; message: string };
        setMaintenanceMode(data);
      }
    });
    return () => unsub();
  }, [user?.schoolId]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    try {
      setUser(null);
      profileFetchedRef.current = false;
      authService.clearSession();
      sessionStorage.clear();
      if (!IS_MOCK_MODE) {
        await signOut(auth);
      }
      navigate('/', { replace: true });
    } catch {
      setUser(null);
      profileFetchedRef.current = false;
      authService.clearSession();
      navigate('/', { replace: true });
    }
  };

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/30">
        <div className="max-w-md w-full bg-white dark:bg-red-900/80 rounded-xl shadow-lg border border-red-200 dark:border-red-800">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <AlertCircle size={24} className="text-red-500 mb-2" />
              <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 ml-3">
                Authentication Error
              </h3>
            </div>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {authError}
            </p>
            <button
              onClick={() => navigate(0)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-indigo-600 dark:text-indigo-300">Loading application...</span>
        </div>
      </div>
    );
  }

  if (location.pathname.startsWith('/auth/')) {
    return (
      <Routes>
        <Route path="/auth/magic" element={<MagicLinkHandler onLogin={(u) => { profileFetchedRef.current = true; setUser(u); }} />} />
        <Route path="/auth/reset" element={<MagicLinkHandler onLogin={(u) => { profileFetchedRef.current = true; setUser(u); }} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (!user) {
    return <Login onLogin={(loggedInUser) => { profileFetchedRef.current = true; setUser(loggedInUser); }} onRegister={() => { }} />;
  }

  if (showForcePasswordChange && user) {
    return (
      <ForcePasswordChange
        user={user}
        onComplete={handleForcePasswordComplete}
        onLogout={handleForcePasswordLogout}
      />
    );
  }

  // Maintenance mode: block non-admin users
  if (maintenanceMode?.enabled && user && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    return (
      <MaintenancePage
        message={maintenanceMode.message}
        schoolName={user.schoolName || 'SmartSchool'}
      />
    );
  }

  const basePath = getRoleBasePath(user.role);

  return (
    <>
      <Layout
        user={user}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      >
        <ErrorBoundary fallbackLabel="Page encountered an error">
        {showOnboarding && user && (
          <OnboardingWizard 
            school={{ id: user.schoolId, name: user.schoolName || 'Your School', config: user.schoolConfig || { primaryColor: '#4f46e5', secondaryColor: '#0f172a', subdomain: '', aiFallback: true }, status: 'PENDING' }} 
            onComplete={() => {
              setShowOnboarding(false);
              sessionStorage.setItem('onboarding_dismissed', 'true');
              // Update user status in Firestore to prevent re-onboarding
              userService.updateUser(user.id, { isFirstLogin: false });
            }} 
          />
        )}
        <CerebroAssistant user={user} />
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-screen">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <Routes>
            <Route path="/" element={<Navigate to={basePath} replace />} />

            {(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
              <>
                <Route path="/admin/dashboard" element={<Dashboard user={user} />} />
                <Route path="/admin/intelligence" element={<CerebroDashboard schoolId={user?.schoolId} user={user} />} />
                <Route path="/admin/students" element={<UserManagement currentUser={user} onViewProfile={(uid, role) => { navigate(role === UserRole.TEACHER ? `/admin/teacher-profile/${uid}` : `/admin/student-profile/${uid}`); }} />} />
                <Route path="/admin/teachers" element={<TeacherManagement user={user} onViewProfile={(uid) => { navigate(`/admin/teacher-profile/${uid}`); }} />} />
                <Route path="/admin/classes" element={<ClassManagement user={user} />} />
                <Route path="/admin/attendance" element={<AttendanceManagement user={user} />} />
                <Route path="/admin/fees" element={<FeeManagement user={user} onBack={() => navigate(-1)} />} />

                <Route path="/admin/exams" element={<Exams user={user} />} />
                <Route path="/admin/results" element={<ResultManagement user={user} onBack={() => navigate(-1)} />} />
                <Route path="/admin/homework" element={<HomeworkOverview user={user} onBack={() => navigate(-1)} />} />
                <Route path="/admin/library" element={<LibraryManagement user={user} onBack={() => navigate(-1)} />} />
                <Route path="/admin/bus-tracking" element={<TransportManagement user={user} />} />
                <Route path="/admin/announcements" element={<NoticeBoard user={user} />} />
                <Route path="/admin/report-cards" element={<ReportCardGenerator user={user} />} />
                <Route path="/admin/whatsapp" element={<WhatsAppCenter user={user} />} />
                <Route path="/admin/academic/setup" element={<AcademicSetup schoolId={user.schoolId} onBack={() => navigate(-1)} />} />
                <Route path="/admin/academic/subjects" element={<SubjectManagement user={user} onBack={() => navigate(-1)} />} />
                <Route path="/admin/academic/timetable" element={<TimetableManagement user={user} onBack={() => navigate(-1)} />} />
                <Route path="/admin/reports" element={<Reports user={user} onBack={() => navigate(-1)} />} />
                <Route path="/admin/settings" element={<SchoolSettings user={user} />} />
                <Route path="/admin/notifications" element={<NotificationCenter user={user} />} />
                <Route path="/admin/student-profile/:id" element={<StudentProfileRoute user={user} />} />
                <Route path="/admin/teacher-profile/:id" element={<TeacherProfileRoute user={user} />} />
              </>
            )}

            {user.role === UserRole.TEACHER && (
              <>
                <Route path="/teacher/dashboard" element={<TeacherDashboard user={user} />} />
                <Route path="/teacher/attendance" element={<TeacherAttendance user={user} />} />
                <Route path="/teacher/students" element={<StudentManager user={user} />} />
                <Route path="/teacher/homework" element={<TeacherHomework user={user} onCreate={() => navigate('/teacher/homework/create')} />} />
                <Route path="/teacher/homework/create" element={<CreateHomework user={user} onBack={() => navigate('/teacher/homework')} />} />
                <Route path="/teacher/grades" element={<TeacherGrades user={user} />} />
                <Route path="/teacher/announcements" element={<TeacherNotices user={user} />} />
                <Route path="/teacher/library" element={<TeacherLibrary user={user} />} />
                <Route path="/teacher/settings" element={<Settings user={user} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
              </>
            )}

            {user.role === UserRole.STUDENT && (
              <>
                <Route path="/student/dashboard" element={<StudentDashboard user={user} />} />
                <Route path="/student/academics" element={<StudentResult user={user} />} />
                <Route path="/student/homework" element={<StudentHomework user={user} />} />
                <Route path="/student/notices" element={<StudentNotices user={user} />} />
                <Route path="/student/fees" element={<StudentFees user={user} />} />
                <Route path="/student/attendance" element={<StudentAttendance user={user} />} />
                <Route path="/student/timetable" element={<StudentTimetable user={user} />} />
                <Route path="/student/library" element={<StudentLibrary user={user} />} />
                <Route path="/student/transport" element={<StudentTransport user={user} />} />
              </>
            )}

            {user.role === UserRole.PARENT && (
              <>
                <Route path="/parent/dashboard" element={<ParentPortal user={user} onLogout={handleLogout} />} />
                <Route path="/parent/homework" element={<ParentHomework user={user} />} />
                <Route path="/parent/fees" element={<ParentFees user={user} />} />
                <Route path="/parent/attendance" element={<ParentAttendance user={user} />} />
                <Route path="/parent/results" element={<ParentResults user={user} />} />
                <Route path="/parent/transport" element={<ParentTransport user={user} />} />
                <Route path="/parent/notices" element={<ParentNotices user={user} />} />
                <Route path="/parent/library" element={<ParentLibrary user={user} />} />
                <Route path="/parent/settings" element={<Settings user={user} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
              </>
            )}

            <Route
              path="*"
              element={<NotFoundPage />}
            />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </Layout>
      <PWAInstallBanner />
    </>
  );
};

export default App;