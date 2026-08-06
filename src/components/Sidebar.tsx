import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, CalendarCheck, BookOpen,
  DollarSign, BadgeIcon, Clock, Wallet,
  Bus, BarChart2, Settings, School, MessageCircle,
  GraduationCap, ClipboardList, Calendar, ShoppingCart, LogOut, Grid3X3, X, Tags, Lock, Activity, Trash2, Globe, Database, Shield
} from 'lucide-react';
import type { PageId, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { PAGE_TO_PATH } from '../routes';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  page: PageId;
  permission?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
  roles?: Role[];
}

const ADMIN_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { icon: <LayoutDashboard size={14} />, label: 'Dashboard', page: 'dashboard', permission: 'access dashboard' },
    ],
  },
  {
    label: 'Academics',
    items: [
      { icon: <Users size={14} />, label: 'Students', page: 'students', permission: 'view students' },
      { icon: <CalendarCheck size={14} />, label: 'Attendance', page: 'attendance', permission: 'view attendance' },
      { icon: <CalendarCheck size={14} />, label: 'Allot Attendance', page: 'allot-attendance', permission: 'view attendance' },
      { icon: <BookOpen size={14} />, label: 'Daily Diary', page: 'diary', permission: 'view events' },
      { icon: <ClipboardList size={14} />, label: 'Examinations', page: 'exams', permission: 'view students' },
      { icon: <Grid3X3 size={14} />, label: 'Timetable', page: 'timetable', permission: 'view timetable' },
      { icon: <School size={14} />, label: 'Classes', page: 'classes', permission: 'view batches' },
      { icon: <GraduationCap size={14} />, label: 'Promotion', page: 'promotion', permission: 'manage students' },
      { icon: <Users size={14} />, label: 'Alumni', page: 'alumni', permission: 'view students' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { icon: <Tags size={14} />, label: 'Fee Categories', page: 'fee-categories', permission: 'view fee structures' },
      { icon: <DollarSign size={14} />, label: 'Fee Management', page: 'fee', permission: 'view financials' },
      { icon: <Tags size={14} />, label: 'Salary Categories', page: 'salary-categories', permission: 'view financials' },
      { icon: <Wallet size={14} />, label: 'Salary', page: 'salary', permission: 'view financials' },
      { icon: <ShoppingCart size={14} />, label: 'Expenses', page: 'expenses', permission: 'view financials' },
    ],
  },
  {
    label: 'Staff',
    items: [
      { icon: <BadgeIcon size={14} />, label: 'Staff Management', page: 'staff', permission: 'view users' },
      { icon: <CalendarCheck size={14} />, label: 'Staff Attendance', page: 'staff-attendance', permission: 'view attendance' },
      { icon: <Clock size={14} />, label: 'Faculty', page: 'faculty', permission: 'view users' },
      { icon: <Calendar size={14} />, label: 'Leave & Holiday Calendar', page: 'leave', permission: 'view leaves' },
      { icon: <Users size={14} />, label: 'Substitute', page: 'substitute', permission: 'view users' },
      { icon: <Lock size={14} />, label: 'Staff Access', page: 'staff-access', permission: 'manage users' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { icon: <MessageCircle size={14} />, label: 'WhatsApp Center', page: 'whatsapp', permission: 'view settings' },
      { icon: <Users size={14} />, label: 'Parent Meetings', page: 'meetings', permission: 'view events' },
    ],
  },
  {
    label: 'Transport',
    items: [
      { icon: <Bus size={14} />, label: 'Bus Tracking', page: 'bus', permission: 'view assets' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { icon: <BarChart2 size={14} />, label: 'Reports', page: 'reports', permission: 'view analytics' },
      { icon: <Activity size={14} />, label: 'Activity Logs', page: 'activity-logs', permission: 'view analytics' },
    ],
  },
  {
    label: 'System',
    items: [
      { icon: <Globe size={14} />, label: 'Webhooks', page: 'webhook', permission: 'view system settings' },
      { icon: <Shield size={14} />, label: 'Roles & Permissions', page: 'roles-permissions', permission: 'view roles' },
      { icon: <Trash2 size={14} />, label: 'Recycle Bin', page: 'recycle-bin', permission: 'view system settings' },
    ],
  },
];

const TEACHER_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { icon: <LayoutDashboard size={14} />, label: 'My Dashboard', page: 'teacher-dashboard' },
    ],
  },
  {
    label: 'Teaching',
    items: [
      { icon: <CalendarCheck size={14} />, label: 'Attendance', page: 'attendance' },
      { icon: <BookOpen size={14} />, label: 'Daily Diary', page: 'diary' },
      { icon: <ClipboardList size={14} />, label: 'Homework', page: 'homework' },
      { icon: <CalendarCheck size={14} />, label: 'Allot Attendance', page: 'allot-attendance' },
    ],
  },
  {
    label: 'Academics',
    items: [
      { icon: <Grid3X3 size={14} />, label: 'Timetable', page: 'timetable' },
      { icon: <GraduationCap size={14} />, label: 'Examinations', page: 'exams' },
      { icon: <BarChart2 size={14} />, label: 'Performance', page: 'performance' },
    ],
  },
  {
    label: 'Leave',
    items: [
      { icon: <Calendar size={14} />, label: 'Leave & Holiday Calendar', page: 'leave' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { icon: <Wallet size={14} />, label: 'My Salary', page: 'my-salary' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { icon: <Activity size={14} />, label: 'Activity Logs', page: 'activity-logs' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const onNavigate = (page: PageId) => navigate(PAGE_TO_PATH[page] || "/" + page);
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin') || user?.roles?.includes('super-admin');
  const roles = user?.roles || [];
  const userPermissions = user?.permissions || [];
  
  const rawSections = isAdmin ? ADMIN_SECTIONS : TEACHER_SECTIONS;
  const sections = rawSections.map(section => {
    return {
      ...section,
      items: section.items.filter(item => {
        // Always show all Teacher Portal items for non-admin Faculty/Teacher users
        if (!isAdmin) {
          return true;
        }

        // Bypass permission checks for admins
        if (roles.includes('super-admin') || roles.includes('admin') || isAdmin) {
          return true;
        }

        // Verify permissions for non-admin users if specified
        if (item.permission) {
          return userPermissions.includes(item.permission);
        }

        return true;
      })
    };
  }).filter(section => section.items.length > 0);

  const [schoolName, setSchoolName] = useState(() => localStorage.getItem('school_name') || 'Krishnaveni Talent School');
  const [schoolLogo, setSchoolLogo] = useState(() => localStorage.getItem('school_logo') || '/KTHS_Logo.png');

  useEffect(() => {
    const handleUpdate = () => {
      setSchoolName(localStorage.getItem('school_name') || 'Krishnaveni Talent School');
      setSchoolLogo(localStorage.getItem('school_logo') || '/KTHS_Logo.png');
    };
    window.addEventListener('kts:school_profile_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('kts:school_profile_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <nav
        className={`fixed md:static inset-y-0 left-0 w-[196px] flex-shrink-0 bg-[var(--surf)] border-r border-[var(--b)] flex flex-col h-full z-40 transition-transform duration-200 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Logo */}
        <div className="px-3.5 py-3 border-b border-[var(--b)] flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-white border border-[var(--b)] flex items-center justify-center p-0.5 flex-shrink-0 shadow-sm">
              <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-[var(--tx)] leading-tight break-words">{schoolName}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-[var(--surf2)] text-[var(--tx2)] cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Role chip */}
        <div className="px-3 py-2.5 border-b border-[var(--b)]">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ${isAdmin ? 'bg-[var(--blue-bg)] text-[var(--blue-tx)]' : 'bg-[var(--teal-bg)] text-[var(--teal-tx)]'}`}>
            <BadgeIcon size={12} />
            {isAdmin ? 'Admin / Management' : 'Teacher Portal'}
          </div>
        </div>

        {/* Nav sections */}
        <div className="flex-1 overflow-y-auto py-1">
          {sections.map((section) => (
            <div key={section.label} className="mb-0.5">
              <div className="text-[9.5px] font-semibold text-[var(--tx3)] uppercase tracking-wider px-3 py-1.5 mt-1.5">
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive = (PAGE_TO_PATH[item.page] || "/" + item.page) === currentPath;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      onNavigate(item.page);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-[5.5px] text-[12px] transition-all duration-100 border-l-2 cursor-pointer text-left ${isActive
                        ? 'bg-[var(--blue-bg)] text-[var(--blue-tx)] border-[var(--blue)] font-semibold'
                        : 'text-[var(--tx2)] border-transparent hover:bg-[var(--surf2)] hover:text-[var(--tx)]'
                      }`}
                  >
                    <span className="flex-shrink-0 opacity-80">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-[var(--b)] space-y-0.5">
          {isAdmin && (
            <button
              onClick={() => {
                onNavigate('settings');
                onClose();
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] rounded-lg transition-colors cursor-pointer text-left ${currentPath === PAGE_TO_PATH["settings"]
                  ? 'bg-[var(--blue-bg)] text-[var(--blue-tx)] font-semibold'
                  : 'text-[var(--tx2)] hover:bg-[var(--surf2)] hover:text-[var(--tx)]'
                }`}
            >
              <Settings size={14} />
              <span>Settings</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => {
                onNavigate('backups');
                onClose();
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] rounded-lg transition-colors cursor-pointer text-left ${currentPath === PAGE_TO_PATH["backups"]
                  ? 'bg-[var(--blue-bg)] text-[var(--blue-tx)] font-semibold'
                  : 'text-[var(--tx2)] hover:bg-[var(--surf2)] hover:text-[var(--tx)]'
                }`}
            >
              <Database size={14} />
              <span>Backups</span>
            </button>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[var(--red-tx)] hover:bg-[var(--red-bg)] rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
