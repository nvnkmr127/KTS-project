import { useState, useEffect } from 'react';
import { AlertCircle, WifiOff } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './pages/Dashboard';
import { FeeManagement } from './pages/FeeManagement';
import { FeeCategories } from './pages/FeeCategories';
import { Attendance } from './pages/Attendance';
import { DailyDiary } from './pages/DailyDiary';
import { BusTracking } from './pages/BusTracking';
import { Faculty } from './pages/Faculty';
import { Reports } from './pages/Reports';
import { Students } from './pages/Students';
import { StaffManagement } from './pages/StaffManagement';
import { Classes } from './pages/Classes';
import { Salary } from './pages/Salary';
import { SalaryCategories } from './pages/SalaryCategories';
import { Expenses } from './pages/Expenses';
import { WhatsApp } from './pages/WhatsApp';
import { Leave } from './pages/Leave';
import { Examinations } from './pages/Examinations';
import { Performance } from './pages/Performance';
import { Meetings } from './pages/Meetings';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { Homework } from './pages/Homework';
import { Timetable } from './pages/Timetable';
import { StaffAttendance } from './pages/StaffAttendance';
import { StaffAccess } from './pages/StaffAccess';
import { AllotAttendance } from './pages/AllotAttendance';
import { Promotion } from './pages/Promotion';
import { MySalary } from './pages/MySalary';
import { Settings } from './pages/Settings';
import { SearchPage } from './pages/SearchPage';
import { TeacherActivityLogs } from './pages/TeacherActivityLogs';
import { RecycleBin } from './pages/RecycleBin';
import { Alumni } from './pages/Alumni';
import type { PageId } from './types';

const PAGE_TO_PATH: Record<PageId, string> = {
  dashboard: '/dashboard',
  fee: '/fee-management',
  'fee-categories': '/fee-categories',
  attendance: '/attendance',
  diary: '/daily-diary',
  bus: '/bus-tracking',
  faculty: '/faculty',
  reports: '/reports',
  students: '/students',
  staff: '/staff-management',
  'staff-attendance': '/staff-attendance',
  classes: '/classes',
  salary: '/salary',
  'salary-categories': '/salary-categories',
  expenses: '/expenses',
  whatsapp: '/whatsapp-center',
  leave: '/leave-management',
  'staff-access': '/staff-access',
  exams: '/examination',
  meetings: '/parent-meetings',
  homework: '/homework',
  performance: '/performance',
  'teacher-dashboard': '/teacher-dashboard',
  'allot-attendance': '/allot-attendance',
  promotion: '/promotion',
  timetable: '/timetable',
  'my-salary': '/my-salary',
  settings: '/settings',
  'activity-logs': '/activity-logs',
  'recycle-bin': '/recycle-bin',
  alumni: '/alumni',
  search: '/search',
};

const PATH_TO_PAGE: Record<string, PageId> = Object.entries(PAGE_TO_PATH).reduce(
  (acc, [page, path]) => {
    acc[path] = page as PageId;
    return acc;
  },
  {} as Record<string, PageId>
);

const getInitialPage = (isTeacher: boolean): PageId => {
  const path = window.location.pathname;
  const pageFromPath = PATH_TO_PAGE[path];
  if (pageFromPath) {
    if (isTeacher && ['dashboard', 'fee', 'fee-categories', 'students', 'staff', 'salary', 'expenses', 'reports', 'timetable', 'classes', 'faculty', 'bus', 'whatsapp', 'meetings', 'recycle-bin'].includes(pageFromPath)) {
      return 'teacher-dashboard';
    }
    if (!isTeacher && ['teacher-dashboard', 'homework', 'performance'].includes(pageFromPath)) {
      return 'dashboard';
    }
    return pageFromPath;
  }
  return isTeacher ? 'teacher-dashboard' : 'dashboard';
};

function AppShell() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const { hasUnsavedChanges, setHasUnsavedChanges } = useApp();
  const [pendingPage, setPendingPage] = useState<PageId | null>(null);

  const [page, setPage] = useState<PageId>(() => getInitialPage(isTeacher));
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [preSearchPage, setPreSearchPage] = useState<PageId>(() => getInitialPage(isTeacher));

  useEffect(() => {
    if (user) {
      const initialPage = getInitialPage(isTeacher);
      setPage(initialPage);
      // Sync URL if on root path
      if (window.location.pathname === '/' || window.location.pathname === '') {
        window.history.replaceState({}, '', PAGE_TO_PATH[initialPage]);
      } else {
        const path = PAGE_TO_PATH[initialPage];
        if (path && window.location.pathname !== path) {
          window.history.replaceState({}, '', path);
        }
      }
    }
  }, [user, isTeacher]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const path = window.location.pathname;
      const pageFromPath = PATH_TO_PAGE[path];
      if (pageFromPath) {
        if (hasUnsavedChanges) {
          // Revert history state to keep user on current page until they decide
          window.history.pushState({}, '', PAGE_TO_PATH[page]);
          setPendingPage(pageFromPath);
        } else {
          setPage(pageFromPath);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasUnsavedChanges, page]);

  if (!user) return <Login />;

  const toggleDark = () => {
    setDark((d) => !d);
    document.documentElement.classList.toggle('dark');
  };

  const navigate = (p: PageId) => {
    if (hasUnsavedChanges) {
      setPendingPage(p);
      return;
    }
    setPage(p);
    const path = PAGE_TO_PATH[p];
    if (path && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-start justify-center md:p-4 md:py-6 p-0">
      <div
        className="w-full max-w-[1360px] flex border-0 md:border border-[var(--b2)] md:rounded-2xl overflow-hidden h-screen md:h-[calc(100vh-48px)] md:min-h-[640px]"
        style={{
          boxShadow: dark ? '0 32px 64px rgba(0,0,0,0.6)' : '0 32px 64px rgba(0,0,0,0.14)',
        }}
      >
        <Sidebar current={page} onNavigate={navigate} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--bg)]">
          <Topbar
            current={page}
            dark={dark}
            onToggleDark={toggleDark}
            onMenuClick={() => setSidebarOpen(true)}
            onNavigate={navigate}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Admin pages */}
          {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {page === 'fee' && <FeeManagement />}
          {page === 'fee-categories' && <FeeCategories />}
          {page === 'attendance' && <Attendance />}
          {page === 'diary' && <DailyDiary />}
          {page === 'bus' && <BusTracking />}
          {page === 'faculty' && <Faculty />}
          {page === 'reports' && <Reports />}
          {page === 'students' && <Students />}
          {page === 'staff' && <StaffManagement />}
          {page === 'staff-attendance' && <StaffAttendance />}
          {page === 'classes' && <Classes />}
          {page === 'salary' && <Salary />}
          {page === 'salary-categories' && <SalaryCategories />}
          {page === 'expenses' && <Expenses />}
          {page === 'whatsapp' && <WhatsApp />}
          {page === 'leave' && <Leave />}
          {page === 'staff-access' && <StaffAccess />}
          {page === 'exams' && <Examinations />}
          {page === 'meetings' && <Meetings />}
          {page === 'timetable' && <Timetable />}
          {page === 'promotion' && <Promotion />}
          {page === 'settings' && <Settings initialTab={0} />}
          {page === 'activity-logs' && (
            isTeacher ? <TeacherActivityLogs /> : <Settings initialTab={2} />
          )}
          {page === 'recycle-bin' && <RecycleBin />}
          {page === 'alumni' && <Alumni />}
          {page === 'search' && (
            <SearchPage
              searchQuery={searchQuery}
              onNavigate={navigate}
              onClearSearch={() => setSearchQuery('')}
            />
          )}

          {/* Teacher pages */}
          {page === 'teacher-dashboard' && <TeacherDashboard />}
          {page === 'homework' && <Homework />}
          {page === 'allot-attendance' && <AllotAttendance />}
          {page === 'performance' && <Performance />}
          {page === 'my-salary' && <MySalary />}
        </div>
      </div>
      {pendingPage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-bold text-[var(--tx)] mb-2">Unsaved Changes</h3>
            <p className="text-xs text-[var(--tx3)] mb-6">
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingPage(null)}
                className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setHasUnsavedChanges(false);
                  const p = pendingPage;
                  setPendingPage(null);
                  setPage(p);
                  const path = PAGE_TO_PATH[p];
                  if (path && window.location.pathname !== path) {
                    window.history.pushState({}, '', path);
                  }
                }}
                className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-[12px] font-semibold hover:bg-amber-700 cursor-pointer"
              >
                Discard &amp; Leave
              </button>
            </div>
          </div>
        </div>
      )}
      {!isOnline && (
        <div className="fixed bottom-4 right-4 z-[99] bg-[var(--red-bg)] border border-[var(--red-tx)]/25 text-[var(--red-tx)] px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 animate-bounce">
          <WifiOff size={15} />
          <div className="text-left">
            <div className="text-[11.5px] font-bold">Offline Mode</div>
            <div className="text-[9.5px] opacity-80">Real-time sync paused. Reconnecting...</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </AuthProvider>
  );
}
