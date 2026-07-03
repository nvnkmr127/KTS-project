import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PageLoader } from './components/PageLoader';
import { WifiOff } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { PAGE_TO_PATH, PageId } from './routes';

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const FeeManagement = lazy(() => import('./pages/FeeManagement').then(m => ({ default: m.FeeManagement })));
const FeeCategories = lazy(() => import('./pages/FeeCategories').then(m => ({ default: m.FeeCategories })));
const Attendance = lazy(() => import('./pages/Attendance').then(m => ({ default: m.Attendance })));
const DailyDiary = lazy(() => import('./pages/DailyDiary').then(m => ({ default: m.DailyDiary })));
const BusTracking = lazy(() => import('./pages/BusTracking').then(m => ({ default: m.BusTracking })));
const Faculty = lazy(() => import('./pages/Faculty').then(m => ({ default: m.Faculty })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Students = lazy(() => import('./pages/Students').then(m => ({ default: m.Students })));
const StaffManagement = lazy(() => import('./pages/StaffManagement').then(m => ({ default: m.StaffManagement })));
const Classes = lazy(() => import('./pages/Classes').then(m => ({ default: m.Classes })));
const Salary = lazy(() => import('./pages/Salary').then(m => ({ default: m.Salary })));
const SalaryCategories = lazy(() => import('./pages/SalaryCategories').then(m => ({ default: m.SalaryCategories })));
const Expenses = lazy(() => import('./pages/Expenses').then(m => ({ default: m.Expenses })));
const WhatsApp = lazy(() => import('./pages/WhatsApp').then(m => ({ default: m.WhatsApp })));
const Leave = lazy(() => import('./pages/Leave').then(m => ({ default: m.Leave })));
const Examinations = lazy(() => import('./pages/Examinations').then(m => ({ default: m.Examinations })));
const Performance = lazy(() => import('./pages/Performance').then(m => ({ default: m.Performance })));
const Meetings = lazy(() => import('./pages/Meetings').then(m => ({ default: m.Meetings })));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const Homework = lazy(() => import('./pages/Homework').then(m => ({ default: m.Homework })));
const Timetable = lazy(() => import('./pages/Timetable').then(m => ({ default: m.Timetable })));
const StaffAttendance = lazy(() => import('./pages/StaffAttendance').then(m => ({ default: m.StaffAttendance })));
const StaffAccess = lazy(() => import('./pages/StaffAccess').then(m => ({ default: m.StaffAccess })));
const AllotAttendance = lazy(() => import('./pages/AllotAttendance').then(m => ({ default: m.AllotAttendance })));
const Promotion = lazy(() => import('./pages/Promotion').then(m => ({ default: m.Promotion })));
const MySalary = lazy(() => import('./pages/MySalary').then(m => ({ default: m.MySalary })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
  // eslint-disable-next-line unused-imports/no-unused-vars
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const TeacherActivityLogs = lazy(() => import('./pages/TeacherActivityLogs').then(m => ({ default: m.TeacherActivityLogs })));
const RecycleBin = lazy(() => import('./pages/RecycleBin').then(m => ({ default: m.RecycleBin })));
const Alumni = lazy(() => import('./pages/Alumni').then(m => ({ default: m.Alumni })));
const Substitute = lazy(() => import('./pages/Substitute'));

function ProtectedRoute({ children, requireAdmin = false }: { children: JSX.Element; requireAdmin?: boolean }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to={PAGE_TO_PATH['teacher-dashboard']} replace />;
  return children;
}

function AppShell() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  // eslint-disable-next-line unused-imports/no-unused-vars
  // eslint-disable-next-line unused-imports/no-unused-vars
  const { hasUnsavedChanges, setHasUnsavedChanges } = useApp();
  const location = useLocation();
  // eslint-disable-next-line unused-imports/no-unused-vars
  const navigate = useNavigate();
  
  const currentPath = location.pathname;
  const current = (Object.keys(PAGE_TO_PATH).find(k => PAGE_TO_PATH[k as PageId] === currentPath) || (isTeacher ? 'teacher-dashboard' : 'dashboard')) as PageId;


  const [searchQuery, setSearchQuery] = useState('');
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
  
  
  // Custom navigation interceptor for unsaved changes could go here if using useBlocker from react-router 6.4+
  // For now, we rely on component-level beforeunload or custom logic

  if (!user) return <Navigate to="/login" replace />;

  const toggleDark = () => {
    setDark((d) => !d);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-start justify-center md:p-4 md:py-6 p-0">
      <div
        className="w-full max-w-[1360px] flex border-0 md:border border-[var(--b2)] md:rounded-2xl overflow-hidden h-screen md:h-[calc(100vh-48px)] md:min-h-[640px]"
        style={{
          boxShadow: dark ? '0 32px 64px rgba(0,0,0,0.6)' : '0 32px 64px rgba(0,0,0,0.14)',
        }}
      >
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--bg)] relative">
          <Topbar
            current={current}
            dark={dark}
            onToggleDark={toggleDark}
            onMenuClick={() => setSidebarOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <Suspense fallback={<PageLoader />}>
            
            <Routes>
              {/* Common Routes */}
              <Route path={PAGE_TO_PATH['attendance']} element={<Attendance />} />
              <Route path={PAGE_TO_PATH['diary']} element={<DailyDiary />} />
              <Route path={PAGE_TO_PATH['bus']} element={<BusTracking />} />
              <Route path={PAGE_TO_PATH['faculty']} element={<Faculty />} />
              <Route path={PAGE_TO_PATH['reports']} element={<Reports />} />
              <Route path={PAGE_TO_PATH['students']} element={<Students />} />
              <Route path={PAGE_TO_PATH['classes']} element={<Classes />} />
              <Route path={PAGE_TO_PATH['whatsapp']} element={<WhatsApp />} />
              <Route path={PAGE_TO_PATH['leave']} element={<Leave />} />
              <Route path={PAGE_TO_PATH['exams']} element={<Examinations />} />
              <Route path={PAGE_TO_PATH['meetings']} element={<Meetings />} />
              <Route path={PAGE_TO_PATH['timetable']} element={<Timetable />} />
              <Route path={PAGE_TO_PATH['activity-logs']} element={isTeacher ? <TeacherActivityLogs /> : <Settings initialTab={2} />} />
              <Route path={PAGE_TO_PATH['alumni']} element={<Alumni />} />
              
              {/* Admin Routes */}
              <Route path={PAGE_TO_PATH['dashboard']} element={<ProtectedRoute requireAdmin><Dashboard onNavigate={() => {}} /></ProtectedRoute>} />
              <Route path={PAGE_TO_PATH['fee']} element={<ProtectedRoute requireAdmin><FeeManagement /></ProtectedRoute>} />
              <Route path={PAGE_TO_PATH['fee-categories']} element={<ProtectedRoute requireAdmin><FeeCategories /></ProtectedRoute>} />
              <Route path={PAGE_TO_PATH['staff']} element={<ProtectedRoute requireAdmin><StaffManagement /></ProtectedRoute>} />
              <Route path={PAGE_TO_PATH['staff-attendance']} element={<ProtectedRoute requireAdmin><StaffAttendance /></ProtectedRoute>} />
              <Route path={PAGE_TO_PATH['salary']} element={<ProtectedRoute requireAdmin><Salary /></ProtectedRoute>} />
              <Route path={PAGE_TO_PATH['salary-categories']} element={<ProtectedRoute requireAdmin><SalaryCategories /></ProtectedRoute>} />
              <Route path={PAGE_TO_PATH['expenses']} element={<ProtectedRoute requireAdmin><Expenses /></ProtectedRoute>} />
              <Route path={PAGE_TO_PATH['substitute']} element={<ProtectedRoute requireAdmin><Substitute /></ProtectedRoute>} />
              <Route path={PAGE_TO_PATH['staff-access']} element={<ProtectedRoute requireAdmin><StaffAccess /></ProtectedRoute>} />
              <Route path={PAGE_TO_PATH['promotion']} element={<ProtectedRoute requireAdmin><Promotion /></ProtectedRoute>} />
              <Route path={PAGE_TO_PATH['settings']} element={<ProtectedRoute requireAdmin><Settings initialTab={0} /></ProtectedRoute>} />
              <Route path={PAGE_TO_PATH['webhook']} element={<ProtectedRoute requireAdmin><Settings initialTab={3} /></ProtectedRoute>} />
              <Route path={PAGE_TO_PATH['recycle-bin']} element={<ProtectedRoute requireAdmin><RecycleBin /></ProtectedRoute>} />

              {/* Teacher Routes */}
              <Route path={PAGE_TO_PATH['teacher-dashboard']} element={<TeacherDashboard />} />
              <Route path={PAGE_TO_PATH['homework']} element={<Homework />} />
              <Route path={PAGE_TO_PATH['allot-attendance']} element={<AllotAttendance />} />
              <Route path={PAGE_TO_PATH['performance']} element={<Performance />} />
              <Route path={PAGE_TO_PATH['my-salary']} element={<MySalary />} />
              
              <Route path="/" element={<Navigate to={isTeacher ? PAGE_TO_PATH['teacher-dashboard'] : PAGE_TO_PATH['dashboard']} replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
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
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
            <Route path="*" element={<AppShell />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
