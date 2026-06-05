import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './pages/Dashboard';
import { FeeManagement } from './pages/FeeManagement';
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

function AppShell() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [page, setPage] = useState<PageId>(isTeacher ? 'teacher-dashboard' : 'dashboard');
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return <Login />;

  const toggleDark = () => {
    setDark((d) => !d);
    document.documentElement.classList.toggle('dark');
  };

  const navigate = (p: PageId) => setPage(p);

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
