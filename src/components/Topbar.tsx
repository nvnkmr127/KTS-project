import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Sun, Moon, X, Menu } from 'lucide-react';
import type { PageId } from '../types';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'Dashboard',
  fee: 'Fee Management',
  attendance: 'Student Attendance',
  diary: 'Daily Diary',
  bus: 'Bus Tracking',
  faculty: 'Faculty Management',
  reports: 'Reports & Analytics',
  students: 'Student Management',
  staff: 'Staff Management',
  classes: 'Class & Section Management',
  salary: 'Salary Management',
  expenses: 'School Expenses',
  whatsapp: 'WhatsApp Communication Center',
  leave: 'Leave Management',
  exams: 'Examinations',
  meetings: 'Parent Meetings',
  homework: 'Homework Management',
  performance: 'Student Performance',
  'teacher-dashboard': 'Teacher Dashboard',
  timetable: 'Timetable Designer',
};

interface TopbarProps {
  current: PageId;
  dark: boolean;
  onToggleDark: () => void;
  onMenuClick: () => void;
}

export function Topbar({ current, dark, onToggleDark, onMenuClick }: TopbarProps) {
  const { user } = useAuth();
  const { notifications, markNotificationsRead } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  const visibleNotifs = isAdmin
    ? notifications.filter((n) => n.type === 'leave_request')
    : notifications.filter((n) => n.type === 'leave_approved' || n.type === 'leave_rejected');

  const visibleUnread = visibleNotifs.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    if (showNotifs) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifs]);

  const handleBellClick = () => {
    setShowNotifs((v) => !v);
    if (!showNotifs) markNotificationsRead();
  };

  return (
    <div className="h-[50px] bg-[var(--surf)] border-b border-[var(--b)] flex items-center px-4 gap-2.5 flex-shrink-0 relative z-20">
      <button
        onClick={onMenuClick}
        className="md:hidden w-7 h-7 border border-[var(--b)] rounded-lg bg-[var(--surf2)] flex items-center justify-center text-[var(--tx2)] hover:bg-[var(--surf3)] transition-colors cursor-pointer mr-0.5"
      >
        <Menu size={14} />
      </button>

      <div className="flex-1 text-[14px] font-bold text-[var(--tx)] truncate">
        {PAGE_TITLES[current]}
      </div>

      <div className="hidden sm:flex items-center gap-1.5 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx3)] w-44 cursor-text">
        <Search size={12} />
        <span>Search...</span>
      </div>

      <div ref={notifRef} className="relative">
        <button
          onClick={handleBellClick}
          className="w-7 h-7 border border-[var(--b)] rounded-lg bg-[var(--surf2)] flex items-center justify-center text-[var(--tx2)] hover:bg-[var(--surf3)] transition-colors cursor-pointer relative"
        >
          <Bell size={14} />
          {visibleUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-[var(--red)] rounded-full border border-[var(--surf)] flex items-center justify-center text-white text-[8px] font-bold px-0.5">
              {visibleUnread > 9 ? '9+' : visibleUnread}
            </span>
          )}
        </button>

        {showNotifs && (
          <div className="absolute right-0 top-9 w-[300px] bg-[var(--surf)] border border-[var(--b)] rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--b)]">
              <div className="text-[12.5px] font-bold text-[var(--tx)]">Notifications</div>
              <button onClick={() => setShowNotifs(false)} className="p-0.5 hover:bg-[var(--surf2)] rounded cursor-pointer">
                <X size={13} />
              </button>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              {visibleNotifs.length === 0 ? (
                <div className="text-center py-6 text-[12px] text-[var(--tx3)]">No notifications</div>
              ) : (
                visibleNotifs.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2.5 px-3.5 py-2.5 border-b border-[var(--b)] last:border-0 ${!n.read ? 'bg-[var(--blue-bg)]/40' : ''}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                      n.type === 'leave_request' ? 'bg-[var(--amber)]' :
                      n.type === 'leave_approved' ? 'bg-[var(--teal)]' : 'bg-[var(--red)]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11.5px] text-[var(--tx)] leading-snug">{n.message}</div>
                      <div className="text-[10.5px] text-[var(--tx3)] mt-0.5">{n.time}</div>
                    </div>
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>
            {isAdmin && visibleNotifs.length > 0 && (
              <div className="px-3.5 py-2 border-t border-[var(--b)] text-[11px] text-[var(--blue-tx)] text-center cursor-pointer hover:underline">
                Go to Leave Management to approve/reject
              </div>
            )}
            {isTeacher && visibleNotifs.length > 0 && (
              <div className="px-3.5 py-2 border-t border-[var(--b)] text-[11px] text-[var(--blue-tx)] text-center cursor-pointer hover:underline">
                Go to Leave Management to view details
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onToggleDark}
        className="w-7 h-7 border border-[var(--b)] rounded-lg bg-[var(--surf2)] flex items-center justify-center text-[var(--tx2)] hover:bg-[var(--surf3)] transition-colors cursor-pointer"
      >
        {dark ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      <div className="flex items-center gap-2 cursor-pointer">
        <div className="w-7 h-7 rounded-full bg-[var(--blue)] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
          {user?.initials ?? 'AD'}
        </div>
        <div className="hidden sm:block">
          <div className="text-[11.5px] font-semibold text-[var(--tx)] leading-none">{user?.name?.split(' ').slice(0, 2).join(' ')}</div>
          <div className="text-[10px] text-[var(--tx3)] mt-0.5 capitalize">{user?.role}</div>
        </div>
      </div>
    </div>
  );
}
