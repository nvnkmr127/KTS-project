import {
  LayoutDashboard, Users, CalendarCheck, BookOpen,
  DollarSign, BadgeIcon, Clock, Wallet,
  Bus, BarChart2, Settings, School, MessageCircle,
  GraduationCap, ClipboardList, Calendar, ShoppingCart, LogOut, Grid3X3, X, Tags, Lock, Activity, Trash2
} from 'lucide-react';
import type { PageId, Role } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  page: PageId;
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
      { icon: <LayoutDashboard size={14} />, label: 'Dashboard', page: 'dashboard' },
    ],
  },
  {
    label: 'Academics',
    items: [
      { icon: <Users size={14} />, label: 'Students', page: 'students' },
      { icon: <CalendarCheck size={14} />, label: 'Attendance', page: 'attendance' },
      { icon: <BookOpen size={14} />, label: 'Daily Diary', page: 'diary' },
      { icon: <ClipboardList size={14} />, label: 'Examinations', page: 'exams' },
      { icon: <Grid3X3 size={14} />, label: 'Timetable', page: 'timetable' },
      { icon: <School size={14} />, label: 'Classes', page: 'classes' },
      { icon: <GraduationCap size={14} />, label: 'Promotion', page: 'promotion' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { icon: <Tags size={14} />, label: 'Fee Categories', page: 'fee-categories' },
      { icon: <DollarSign size={14} />, label: 'Fee Management', page: 'fee' },
      { icon: <Tags size={14} />, label: 'Salary Categories', page: 'salary-categories' },
      { icon: <Wallet size={14} />, label: 'Salary', page: 'salary' },
      { icon: <ShoppingCart size={14} />, label: 'Expenses', page: 'expenses' },
    ],
  },
  {
    label: 'Staff',
    items: [
      { icon: <BadgeIcon size={14} />, label: 'Staff Management', page: 'staff' },
      { icon: <CalendarCheck size={14} />, label: 'Staff Attendance', page: 'staff-attendance' },
      { icon: <Clock size={14} />, label: 'Faculty', page: 'faculty' },
      { icon: <Calendar size={14} />, label: 'Leave', page: 'leave' },
      { icon: <Lock size={14} />, label: 'Staff Access', page: 'staff-access' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { icon: <MessageCircle size={14} />, label: 'WhatsApp Center', page: 'whatsapp' },
      { icon: <Users size={14} />, label: 'Parent Meetings', page: 'meetings' },
    ],
  },
  {
    label: 'Transport',
    items: [
      { icon: <Bus size={14} />, label: 'Bus Tracking', page: 'bus' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { icon: <BarChart2 size={14} />, label: 'Reports', page: 'reports' },
      { icon: <Activity size={14} />, label: 'Activity Logs', page: 'activity-logs' },
    ],
  },
  {
    label: 'System',
    items: [
      { icon: <Trash2 size={14} />, label: 'Recycle Bin', page: 'recycle-bin' },
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
      { icon: <GraduationCap size={14} />, label: 'Examinations', page: 'exams' },
      { icon: <BarChart2 size={14} />, label: 'Performance', page: 'performance' },
    ],
  },
  {
    label: 'Leave',
    items: [
      { icon: <Calendar size={14} />, label: 'Leave Management', page: 'leave' },
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
  current: PageId;
  onNavigate: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ current, onNavigate, isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const sections = isAdmin ? ADMIN_SECTIONS : TEACHER_SECTIONS;

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
        className={`fixed md:static inset-y-0 left-0 w-[196px] flex-shrink-0 bg-[var(--surf)] border-r border-[var(--b)] flex flex-col h-full z-40 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-3.5 py-3 border-b border-[var(--b)] flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--blue)] flex items-center justify-center text-white flex-shrink-0">
              <School size={14} />
            </div>
            <div>
              <div className="text-[12px] font-bold text-[var(--tx)] leading-none">Krishnaveni</div>
              <div className="text-[10px] text-[var(--tx3)] mt-0.5">Talent School</div>
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
                const isActive = item.page === current;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      onNavigate(item.page);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-[5.5px] text-[12px] transition-all duration-100 border-l-2 cursor-pointer text-left ${
                      isActive
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
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] rounded-lg transition-colors cursor-pointer text-left ${
                current === 'settings'
                  ? 'bg-[var(--blue-bg)] text-[var(--blue-tx)] font-semibold'
                  : 'text-[var(--tx2)] hover:bg-[var(--surf2)] hover:text-[var(--tx)]'
              }`}
            >
              <Settings size={14} />
              <span>Settings</span>
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
