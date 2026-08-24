import {
  CalendarCheck, BookOpen, ClipboardList, Bell, Clock, TrendingUp,
  ArrowRight, CheckCircle2, AlertCircle, Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp, TIMETABLE_DAYS } from '../context/AppContext';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PAGE_TO_PATH } from '../routes';
import { api } from '../services/api';
import { syncAndReconcileAttendanceRecords, reconcileStudentAttendance } from '../utils/studentAttendanceUtils';

const DAY_NAMES = ['Sunday', ...TIMETABLE_DAYS];

function getTodayDayName(): string {
  const dayIndex = new Date().getDay();
  return DAY_NAMES[dayIndex] ?? 'Monday';
}

type ClassStatus = 'Completed' | 'In Progress' | 'Upcoming';

function getCurrentPeriodIndex(): number {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();
  const totalMins = hour * 60 + minute;
  const periodStartMins = [480, 540, 600, 660, 720, 780, 840, 900];
  let current = -1;
  for (let i = 0; i < periodStartMins.length; i++) {
    if (totalMins >= periodStartMins[i]) current = i;
  }
  return current;
}

export function TeacherDashboard() {
  const { user } = useAuth();
  const { timetable, leaveRequests, notifications, periodTimings } = useApp();
  const navigate = useNavigate();

  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [diariesList, setDiariesList] = useState<any[]>([]);

  const [classTeacherOf, setClassTeacherOf] = useState<string | null>(null);

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString();
  const today = getTodayDayName();
  const currentPeriod = getCurrentPeriodIndex();

  useEffect(() => {
    async function fetchLiveData() {
      try {
        const [settingsRes, hwRes, diaryRes, batchesRes] = await Promise.all([
          api.getResources('settings', { key: 'kts_student_attendance_records' }).catch(() => []),
          api.getResources('homework').catch(() => []),
          api.getResources('daily-diaries').catch(() => []),
          api.getResources('batches').catch(() => [])
        ]);

        let loadedRecords: any[] = [];
        if (Array.isArray(settingsRes) && settingsRes.length > 0 && settingsRes[0].value) {
          try {
            loadedRecords = typeof settingsRes[0].value === 'string' ? JSON.parse(settingsRes[0].value) : settingsRes[0].value;
          } catch (err) {
            console.error('Failed parsing student attendance setting JSON', err);
          }
        } else {
          const local = localStorage.getItem('kts_student_attendance_records');
          if (local) {
            try {
              loadedRecords = JSON.parse(local);
            } catch {
              loadedRecords = [];
            }
          }
        }
        const reconciled = await syncAndReconcileAttendanceRecords(loadedRecords);
        setAttendanceRecords(reconciled);

        if (Array.isArray(hwRes)) setHomeworkList(hwRes);
        if (Array.isArray(diaryRes)) setDiariesList(diaryRes);

        if (Array.isArray(batchesRes) && user) {
          // Find if there is a batch where the current teacher is the class teacher
          const teacherBatch = batchesRes.find((b: any) => 
            String(b.class_teacher_id) === String(user.id) ||
            String(b.class_teacher_id) === String(user.staffId) ||
            String(b.class_teacher_id) === String(user.user_id) ||
            (b.class_teacher_name && user.name && b.class_teacher_name.toLowerCase().trim() === user.name.toLowerCase().trim())
          );
          if (teacherBatch) {
            setClassTeacherOf(teacherBatch.name);
          }
        }
      } catch (e) {
        console.error('Failed to load live data in Teacher Dashboard', e);
      }
    }

    fetchLiveData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kts_student_attendance_records' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const { records: reconciled } = reconcileStudentAttendance(parsed);
          setAttendanceRecords(reconciled);
        } catch (err) {
          console.debug('Failed to parse attendance storage value:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const isTeacherMatch = (slot: any, u: any) => {
    if (!slot || !u) return false;
    if (slot.teacherId && u.id && String(slot.teacherId) === String(u.id)) return true;
    if (slot.teacherId && u.staffId && String(slot.teacherId) === String(u.staffId)) return true;
    if (slot.teacherId && u.user_id && String(slot.teacherId) === String(u.user_id)) return true;
    if (slot.teacher && u.name) {
      const cleanSlot = slot.teacher.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanUser = u.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanSlot === cleanUser || cleanSlot.includes(cleanUser) || cleanUser.includes(cleanSlot)) return true;
    }
    return false;
  };

  const teacherClasses = Object.keys(timetable).filter(className => {
    return Object.values(timetable[className] || {}).some(daySlots => {
      return Object.values(daySlots).some(slot => isTeacherMatch(slot, user));
    });
  });

  const todayClasses: { time: string; subject: string; class: string; room: string; status: ClassStatus; periodIndex: number }[] = [];

  Object.keys(timetable).forEach((className) => {
    const daySlots = timetable[className]?.[today] ?? {};
    periodTimings.forEach((timing, p) => {
      if (timing.isBreak) return;
      const slot = daySlots[p];
      if (slot && isTeacherMatch(slot, user)) {
        let status: ClassStatus;
        if (p < currentPeriod) status = 'Completed';
        else if (p === currentPeriod) status = 'In Progress';
        else status = 'Upcoming';
        todayClasses.push({
          time: `${timing.start} - ${timing.end}`,
          subject: slot.subject,
          class: className,
          room: slot.room,
          status,
          periodIndex: p,
        });
      }
    });
  });

  todayClasses.sort((a, b) => a.periodIndex - b.periodIndex);

  const completed = todayClasses.filter((c) => c.status === 'Completed').length;
  const total = todayClasses.length;

  const lunchIdx = periodTimings.findIndex(t => t.isBreak && t.label?.toLowerCase().includes('lunch'));
  const firstPeriodAfterLunchIdx = periodTimings.findIndex((t, i) => i > lunchIdx && !t.isBreak);

  let classesToMarkAttendance = 0;
  let classesMarkedAttendance = 0;
  const pendingAttendanceClasses: string[] = [];

  todayClasses.forEach(cls => {
    const isAfternoonPeriod = firstPeriodAfterLunchIdx !== -1 ? cls.periodIndex >= firstPeriodAfterLunchIdx : cls.periodIndex >= 6;
    if (cls.periodIndex === 0 || isAfternoonPeriod) {
      classesToMarkAttendance++;
      const sessionName = cls.periodIndex === 0 ? 'first_period' : 'lunch_period';
      const isMarked = attendanceRecords.some(r =>
        r.date === todayStr &&
        r.session === sessionName &&
        r.className?.toLowerCase() === cls.class.toLowerCase()
      );
      if (isMarked) {
        classesMarkedAttendance++;
      } else {
        if (!pendingAttendanceClasses.includes(cls.class)) {
          pendingAttendanceClasses.push(cls.class);
        }
      }
    }
  });

  const attendancePending = classesToMarkAttendance - classesMarkedAttendance;

  // Live Homework posted count
  const todayHomeworks = homeworkList.filter(h => {
    const createdDate = h.created_at ? h.created_at.substring(0, 10) : (h.assigned_date || '');
    return createdDate === todayStr || h.date === todayStr;
  });
  const classesWithHomework = new Set(todayHomeworks.map(h => h.class_name || h.className || h.class));
  const homeworkPostedCount = teacherClasses.filter(c => classesWithHomework.has(c)).length;

  // Live Leave balance calculation (12 total base)
  const myLeaves = leaveRequests.filter((l) => String(l.staffId) === String(user?.id));
  const approvedLeaveDays = myLeaves
    .filter(l => l.status === 'Approved')
    .reduce((sum, l) => sum + (l.days || 1), 0);
  const remainingLeaveDays = Math.max(0, 12 - approvedLeaveDays);

  const myNotifications = notifications.filter(
    (n) => n.type === 'leave_approved' || n.type === 'leave_rejected'
  );
  const unreadLeaveNotifs = myNotifications.filter((n) => !n.read).length;

  // Dynamic Pending Tasks Construction
  const dynamicTasks: { task: string; due: string; urgent: boolean; link: string; actionText: string }[] = [];

  if (pendingAttendanceClasses.length > 0) {
    dynamicTasks.push({
      task: `Mark student attendance for Class ${pendingAttendanceClasses.join(', ')}`,
      due: 'Today',
      urgent: true,
      link: PAGE_TO_PATH['allot-attendance'],
      actionText: 'Mark Attendance'
    });
  }

  // Check if daily diary is missing for any assigned class today
  const todayDiaries = diariesList.filter(d => d.date === todayStr || d.created_at?.substring(0, 10) === todayStr);
  const classesWithDiary = new Set(todayDiaries.map(d => d.className || d.class || d.batch_name));
  const missingDiaryClasses = teacherClasses.filter(c => !classesWithDiary.has(c));
  if (missingDiaryClasses.length > 0) {
    dynamicTasks.push({
      task: `Submit daily diary for Class ${missingDiaryClasses.join(', ')}`,
      due: 'Today',
      urgent: true,
      link: PAGE_TO_PATH['diary'],
      actionText: 'Post Diary'
    });
  }

  // Check if homework posted
  const missingHomeworkClasses = teacherClasses.filter(c => !classesWithHomework.has(c));
  if (missingHomeworkClasses.length > 0) {
    dynamicTasks.push({
      task: `Post homework assignments for Class ${missingHomeworkClasses.join(', ')}`,
      due: 'Today',
      urgent: false,
      link: PAGE_TO_PATH['homework'],
      actionText: 'Add Homework'
    });
  }

  if (myLeaves.some(l => l.status === 'Pending')) {
    dynamicTasks.push({
      task: 'Check pending leave application status',
      due: 'Pending Admin',
      urgent: false,
      link: PAGE_TO_PATH['leave'],
      actionText: 'View Leaves'
    });
  }

  if (dynamicTasks.length === 0) {
    dynamicTasks.push({
      task: 'All daily tasks & attendance completed for today!',
      due: 'Complete',
      urgent: false,
      link: PAGE_TO_PATH['teacher-dashboard'],
      actionText: 'Great Job!'
    });
  }

  // Live Class Attendance Performance calculation
  const classPerformanceData = teacherClasses.map(cls => {
    const classRecords = attendanceRecords.filter(r => r.className?.toLowerCase() === cls.toLowerCase());
    if (classRecords.length === 0) return { className: cls, rate: 95 };
    const presentCount = classRecords.filter(r => r.status === 'present').length;
    const rate = Math.round((presentCount / classRecords.length) * 100);
    return { className: cls, rate };
  });

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[var(--blue)] via-[#3b82f6] to-[var(--purple)] rounded-2xl p-4 mb-3 text-white relative overflow-hidden shadow-sm">
        <div className="absolute right-4 top-4 opacity-10">
          <BookOpen size={72} />
        </div>
        <div className="relative z-10">
          <div className="text-[11px] font-medium opacity-80 uppercase tracking-wider mb-1">Faculty Dashboard</div>
          <div className="text-[20px] font-bold mb-1">Welcome back, {user?.name || 'Faculty Member'}</div>
          <div className="text-[12px] opacity-90">{user?.designation || 'Teacher'} · {user?.subject || 'Academics'} · Assigned Classes: {teacherClasses.length > 0 ? teacherClasses.join(', ') : 'None'}</div>

          {classTeacherOf && (
            <div className="mb-2.5">
              <span className="bg-white/30 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide">
                Class Teacher for: {classTeacherOf} Class
              </span>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[12px]">
            <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-medium">
              <Clock size={12} /> {completed}/{total} classes today
            </span>
            <span className={`flex items-center gap-1 px-3 py-1 rounded-full font-medium ${attendancePending > 0 ? 'bg-amber-500/80 text-white' : 'bg-white/20'}`}>
              <CalendarCheck size={12} /> Attendance pending: {attendancePending}
            </span>
            {unreadLeaveNotifs > 0 && (
              <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full font-medium">
                <Bell size={12} /> {unreadLeaveNotifs} leave update{unreadLeaveNotifs > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
        <button
          onClick={() => navigate(PAGE_TO_PATH['allot-attendance'])}
          className="flex items-center justify-center gap-2 p-2.5 bg-[var(--surf)] border border-[var(--b)] hover:border-[var(--blue)] rounded-xl transition-all shadow-sm group text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--blue-bg)] text-[var(--blue-tx)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <CalendarCheck size={16} />
          </div>
          <div>
            <div className="text-[11.5px] font-semibold text-[var(--tx)] group-hover:text-[var(--blue-tx)]">Allot Attendance</div>
            <div className="text-[9.5px] text-[var(--tx3)]">Mark Class</div>
          </div>
        </button>

        <button
          onClick={() => navigate(PAGE_TO_PATH['diary'])}
          className="flex items-center justify-center gap-2 p-2.5 bg-[var(--surf)] border border-[var(--b)] hover:border-[var(--purple)] rounded-xl transition-all shadow-sm group text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen size={16} />
          </div>
          <div>
            <div className="text-[11.5px] font-semibold text-[var(--tx)] group-hover:text-purple-600">Daily Diary</div>
            <div className="text-[9.5px] text-[var(--tx3)]">Post Updates</div>
          </div>
        </button>

        <button
          onClick={() => navigate(PAGE_TO_PATH['homework'])}
          className="flex items-center justify-center gap-2 p-2.5 bg-[var(--surf)] border border-[var(--b)] hover:border-[var(--teal)] rounded-xl transition-all shadow-sm group text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <ClipboardList size={16} />
          </div>
          <div>
            <div className="text-[11.5px] font-semibold text-[var(--tx)] group-hover:text-teal-600">Homework</div>
            <div className="text-[9.5px] text-[var(--tx3)]">Assign Tasks</div>
          </div>
        </button>

        <button
          onClick={() => navigate(PAGE_TO_PATH['leave'])}
          className="flex items-center justify-center gap-2 p-2.5 bg-[var(--surf)] border border-[var(--b)] hover:border-[var(--amber)] rounded-xl transition-all shadow-sm group text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Calendar size={16} />
          </div>
          <div>
            <div className="text-[11.5px] font-semibold text-[var(--tx)] group-hover:text-amber-600">Apply Leave</div>
            <div className="text-[9.5px] text-[var(--tx3)]">Leave Portal</div>
          </div>
        </button>

        <button
          onClick={() => navigate(PAGE_TO_PATH['timetable'])}
          className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 p-2.5 bg-[var(--surf)] border border-[var(--b)] hover:border-[var(--blue)] rounded-xl transition-all shadow-sm group text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Clock size={16} />
          </div>
          <div>
            <div className="text-[11.5px] font-semibold text-[var(--tx)] group-hover:text-indigo-600">Timetable</div>
            <div className="text-[9.5px] text-[var(--tx3)]">Schedule</div>
          </div>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-3 shadow-sm">
          <div className="text-[10.5px] text-[var(--tx3)] mb-1">Classes Today</div>
          <div className="text-[22px] font-bold text-[var(--tx)]">{total}</div>
          <div className="text-[10.5px] text-[var(--tx3)] mt-1">{completed} done · {total - completed} pending</div>
        </div>

        <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-3 shadow-sm">
          <div className="text-[10.5px] text-[var(--tx3)] mb-1">Attendance Status</div>
          <div className="text-[22px] font-bold text-[var(--tx)]">{classesMarkedAttendance}/{classesToMarkAttendance}</div>
          <div className="text-[10.5px] text-[var(--tx3)] mt-1">
            {attendancePending > 0 ? (
              <span className="text-[var(--amber-tx)] font-medium flex items-center gap-1">
                <AlertCircle size={10} /> {attendancePending} class{attendancePending > 1 ? 'es' : ''} pending
              </span>
            ) : (
              <span className="text-[var(--teal-tx)] font-medium flex items-center gap-1">
                <CheckCircle2 size={10} /> All marked today
              </span>
            )}
          </div>
        </div>

        <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-3 shadow-sm">
          <div className="text-[10.5px] text-[var(--tx3)] mb-1">Homework Posted</div>
          <div className="text-[22px] font-bold text-[var(--tx)]">{homeworkPostedCount}/{teacherClasses.length}</div>
          <div className="text-[10.5px] text-[var(--tx3)] mt-1">Assigned classes updated</div>
        </div>

        <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-3 shadow-sm">
          <div className="text-[10.5px] text-[var(--tx3)] mb-1">Leave Balance</div>
          <div className="text-[22px] font-bold text-[var(--tx)]">{remainingLeaveDays}</div>
          <div className="text-[10.5px] text-[var(--tx3)] mt-1">Annual days remaining</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-2.5">
        <div className="space-y-2.5">
          {/* Today's Schedule */}
          <Card>
            <CardHeader 
              title={`Today's Classes — ${today}`} 
              icon={<CalendarCheck size={14} />} 
              action={
                <button 
                  onClick={() => navigate(PAGE_TO_PATH['timetable'])}
                  className="text-[11.5px] font-medium text-[var(--blue-tx)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View Timetable <ArrowRight size={12} />
                </button>
              }
            />
            {todayClasses.length === 0 ? (
              <div className="text-center py-8 text-[12px] text-[var(--tx3)]">
                No classes scheduled for today. Enjoy your free time!
              </div>
            ) : (
              <div className="space-y-2">
                {todayClasses.map((cls, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${cls.status === 'In Progress' ? 'border-[var(--blue)] bg-[var(--blue-bg)] shadow-sm' : 'border-[var(--b)] bg-[var(--surf2)]'}`}>
                    <div className="text-right w-20 flex-shrink-0">
                      <div className={`text-[11.5px] font-semibold ${cls.status === 'In Progress' ? 'text-[var(--blue-tx)]' : 'text-[var(--tx3)]'}`}>{cls.time}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] font-semibold ${cls.status === 'In Progress' ? 'text-[var(--blue-tx)]' : 'text-[var(--tx)]'}`}>{cls.subject}</div>
                      <div className="text-[11px] text-[var(--tx3)]">Class {cls.class} · {cls.room}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {cls.status === 'Completed' && <Badge variant="teal">Done</Badge>}
                      {cls.status === 'In Progress' && <Badge variant="blue">Now</Badge>}
                      {cls.status === 'Upcoming' && <Badge variant="gray">Upcoming</Badge>}
                      <button
                        onClick={() => navigate(PAGE_TO_PATH['allot-attendance'])}
                        className="text-[11px] font-medium text-[var(--blue-tx)] bg-[var(--surf)] hover:bg-[var(--blue-bg)] border border-[var(--b)] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                      >
                        Attendance
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Interactive Pending Tasks */}
          <Card>
            <CardHeader title="Action Required & Pending Tasks" icon={<ClipboardList size={14} />} />
            <div className="space-y-2">
              {dynamicTasks.map((t, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-2.5 bg-[var(--surf2)] border border-[var(--b)] rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.urgent ? 'bg-[var(--red)] animate-pulse' : 'bg-[var(--amber)]'}`} />
                    <div className="truncate">
                      <div className="text-[12px] font-medium text-[var(--tx)] truncate">{t.task}</div>
                      <div className={`text-[10px] ${t.urgent ? 'text-[var(--red-tx)]' : 'text-[var(--amber-tx)]'}`}>{t.due}</div>
                    </div>
                  </div>
                  {t.actionText !== 'Great Job!' ? (
                    <button
                      onClick={() => navigate(t.link)}
                      className="flex-shrink-0 text-[11px] font-semibold text-white bg-[var(--blue)] hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                    >
                      {t.actionText} <ArrowRight size={11} />
                    </button>
                  ) : (
                    <span className="flex-shrink-0 text-[11px] font-semibold text-[var(--teal-tx)] flex items-center gap-1">
                      <CheckCircle2 size={12} /> Complete
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* My Leave Requests */}
          {myLeaves.length > 0 && (
            <Card>
              <CardHeader title="My Leave Requests" icon={<Bell size={14} />} />
              <div className="space-y-2">
                {myLeaves.map((l) => (
                  <div key={l.id} className="flex items-center justify-between p-2.5 bg-[var(--surf2)] border border-[var(--b)] rounded-xl">
                    <div>
                      <div className="text-[12px] font-semibold text-[var(--tx)]">{l.type}</div>
                      <div className="text-[11px] text-[var(--tx3)]">{l.from} → {l.to} · {l.days} day{l.days > 1 ? 's' : ''}</div>
                      <div className="text-[11px] text-[var(--tx3)] mt-0.5 truncate max-w-[220px]">{l.reason}</div>
                      {l.status === 'Rejected' && l.adminNotes && (
                        <div className="text-[10px] text-[var(--red-tx)] bg-[var(--red-bg)] px-2 py-0.5 rounded border border-[var(--red-tx)]/10 mt-1 max-w-[220px] truncate" title={l.adminNotes}>
                          Reason: {l.adminNotes}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {l.status === 'Approved' && <Badge variant="teal">Approved</Badge>}
                      {l.status === 'Pending' && <Badge variant="amber">Pending</Badge>}
                      {l.status === 'Rejected' && <Badge variant="red">Rejected</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-2.5">
          {/* Notifications & Notices */}
          <Card>
            <CardHeader title="System Notices & Updates" icon={<Bell size={14} />} />
            <div className="space-y-2">
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="p-2.5 bg-[var(--surf2)] border border-[var(--b)] rounded-xl">
                    <div className="text-[12px] font-medium text-[var(--tx)]">{n.message}</div>
                    <div className="text-[10px] text-[var(--tx3)] mt-1">{n.time}</div>
                  </div>
                ))
              ) : (
                <div className="text-[11.5px] text-[var(--tx3)] py-4 text-center">
                  No active system notices right now.
                </div>
              )}
            </div>
          </Card>

          {/* Live Class Attendance Performance */}
          <Card>
            <CardHeader title="My Classes Attendance Performance" icon={<TrendingUp size={14} />} />
            <div className="space-y-3">
              {classPerformanceData.map(({ className, rate }) => (
                <div key={className}>
                  <div className="flex justify-between text-[11.5px] mb-1">
                    <span className="font-semibold text-[var(--tx)]">Class {className}</span>
                    <span className={`font-bold ${rate >= 90 ? 'text-[var(--teal-tx)]' : rate >= 75 ? 'text-[var(--blue-tx)]' : 'text-[var(--amber-tx)]'}`}>
                      {rate}%
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--surf2)] rounded-full overflow-hidden border border-[var(--b)]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${rate}%`,
                        background: rate >= 90 ? 'var(--teal)' : rate >= 75 ? 'var(--blue)' : 'var(--amber)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
