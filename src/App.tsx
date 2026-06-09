import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
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
import { Expenses } from './pages/Expenses';
import { WhatsApp } from './pages/WhatsApp';
import { Leave } from './pages/Leave';
import { Examinations } from './pages/Examinations';
import { Meetings } from './pages/Meetings';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { Homework } from './pages/Homework';
import { Timetable } from './pages/Timetable';
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
  classes: '/classes',
  salary: '/salary',
  expenses: '/expenses',
  whatsapp: '/whatsapp-center',
  leave: '/leave-management',
  exams: '/examination',
  meetings: '/parent-meetings',
  homework: '/homework',
  performance: '/performance',
  'teacher-dashboard': '/teacher-dashboard',
  timetable: '/timetable',
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
    if (isTeacher && ['dashboard', 'fee', 'fee-categories', 'students', 'staff', 'salary', 'expenses', 'reports', 'timetable', 'classes', 'faculty', 'bus', 'whatsapp', 'meetings'].includes(pageFromPath)) {
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

  const [page, setPage] = useState<PageId>(() => getInitialPage(isTeacher));
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    const handlePopState = () => {
      const path = window.location.pathname;
      const pageFromPath = PATH_TO_PAGE[path];
      if (pageFromPath) {
        setPage(pageFromPath);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!user) return <Login />;

  const toggleDark = () => {
    setDark((d) => !d);
    document.documentElement.classList.toggle('dark');
  };

  const navigate = (p: PageId) => {
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
          <Topbar current={page} dark={dark} onToggleDark={toggleDark} onMenuClick={() => setSidebarOpen(true)} />

          {/* Admin pages */}
          {page === 'dashboard' && <Dashboard />}
          {page === 'fee' && <FeeManagement />}
          {page === 'fee-categories' && <FeeCategories />}
          {page === 'attendance' && <Attendance />}
          {page === 'diary' && <DailyDiary />}
          {page === 'bus' && <BusTracking />}
          {page === 'faculty' && <Faculty />}
          {page === 'reports' && <Reports />}
          {page === 'students' && <Students />}
          {page === 'staff' && <StaffManagement />}
          {page === 'classes' && <Classes />}
          {page === 'salary' && <Salary />}
          {page === 'expenses' && <Expenses />}
          {page === 'whatsapp' && <WhatsApp />}
          {page === 'leave' && <Leave />}
          {page === 'exams' && <Examinations />}
          {page === 'meetings' && <Meetings />}
          {page === 'timetable' && <Timetable />}

          {/* Teacher pages */}
          {page === 'teacher-dashboard' && <TeacherDashboard />}
          {page === 'homework' && <Homework />}
          {page === 'performance' && <Examinations />}
        </div>
      </div>
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
