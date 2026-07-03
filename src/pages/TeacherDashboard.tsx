import {

  CalendarCheck, BookOpen, ClipboardList, Bell, Clock, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp, TIMETABLE_DAYS } from '../context/AppContext';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';

const notices = [
  { title: 'Staff Meeting on Friday', time: '2 hours ago', type: 'info' as const },
  { title: 'Submit Unit Test 1 marks by June 10', time: '5 hours ago', type: 'urgent' as const },
  { title: 'Class 9A — PTM scheduled on June 20', time: '1 day ago', type: 'info' as const },
  { title: 'Sports Day preparations — June 25', time: '2 days ago', type: 'info' as const },
];

const pendingTasks = [
  { task: 'Mark attendance for Class 9A', due: 'Today', urgent: true },
  { task: 'Submit daily diary for Class 8A', due: 'Today', urgent: true },
  { task: 'Enter Unit Test 3 marks', due: 'Jun 10', urgent: false },
  { task: 'Prepare homework for Class 10A', due: 'Tomorrow', urgent: false },
];

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

  const today = getTodayDayName();
  const currentPeriod = getCurrentPeriodIndex();

  const teacherClasses = Object.keys(timetable).filter(className => {
    return Object.values(timetable[className] || {}).some(daySlots => {
      return Object.values(daySlots).some(slot => slot && String(slot.teacherId) === String(user?.id));
    });
  });

  const todayClasses: { time: string; subject: string; class: string; room: string; status: ClassStatus; periodIndex: number }[] = [];

  Object.keys(timetable).forEach((className) => {
    const daySlots = timetable[className]?.[today] ?? {};
    periodTimings.forEach((timing, p) => {
      if (timing.isBreak) return;
      const slot = daySlots[p];
      if (slot && String(slot.teacherId) === String(user?.id)) {
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

  const myLeaves = leaveRequests.filter((l) => l.staffId === user?.id);
  const myNotifications = notifications.filter(
    (n) => n.type === 'leave_approved' || n.type === 'leave_rejected'
  );
  const unreadLeaveNotifs = myNotifications.filter((n) => !n.read).length;

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-[var(--blue)] to-[var(--blue)] rounded-2xl p-4 mb-3 text-white relative overflow-hidden">
        <div className="absolute right-4 top-4 opacity-10">
          <BookOpen size={64} />
        </div>
        <div className="relative z-10">
          <div className="text-[11px] font-medium opacity-70 uppercase tracking-wider mb-1">Good morning</div>
          <div className="text-[18px] font-bold mb-1">{user?.name}</div>
          <div className="text-[12px] opacity-80">{user?.designation} · {user?.subject} · Classes {teacherClasses.join(', ')}</div>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[12px]">
            <span className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full">
              <Clock size={11} /> {completed}/{total} classes today
            </span>
            <span className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full">
              <CalendarCheck size={11} /> Attendance pending: {Math.max(0, total - completed - 1)}
            </span>
            {unreadLeaveNotifs > 0 && (
              <span className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full">
                <Bell size={11} /> {unreadLeaveNotifs} leave update{unreadLeaveNotifs > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-3">
          <div className="text-[10.5px] text-[var(--tx3)] mb-1">Classes Today</div>
          <div className="text-[20px] font-semibold text-[var(--tx)]">{total || '—'}</div>
          <div className="text-[10.5px] text-[var(--tx3)] mt-1">{completed} done · {total - completed} pending</div>
        </div>
        <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-3">
          <div className="text-[10.5px] text-[var(--tx3)] mb-1">Attendance Status</div>
          <div className="text-[20px] font-semibold text-[var(--tx)]">3/4</div>
          <div className="text-[10.5px] text-[var(--tx3)] mt-1">Classes marked today</div>
        </div>
        <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-3">
          <div className="text-[10.5px] text-[var(--tx3)] mb-1">Homework Posted</div>
          <div className="text-[20px] font-semibold text-[var(--tx)]">2/4</div>
          <div className="text-[10.5px] text-[var(--tx3)] mt-1">Classes updated</div>
        </div>
        <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-3">
          <div className="text-[10.5px] text-[var(--tx3)] mb-1">Leave Balance</div>
          <div className="text-[20px] font-semibold text-[var(--tx)]">8</div>
          <div className="text-[10.5px] text-[var(--tx3)] mt-1">Days remaining</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-2.5">
        <div className="space-y-2.5">
          {/* Today's timetable */}
          <Card>
            <CardHeader title={`Today's Classes — ${today}`} icon={<CalendarCheck size={14} />} />
            {todayClasses.length === 0 ? (
              <div className="text-center py-8 text-[12px] text-[var(--tx3)]">
                No classes scheduled for today. Enjoy your free time!
              </div>
            ) : (
              <div className="space-y-2">
                {todayClasses.map((cls, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${cls.status === 'In Progress' ? 'border-[var(--blue)] bg-[var(--blue-bg)]' : 'border-[var(--b)] bg-[var(--surf2)]'}`}>
                    <div className="text-right w-16 flex-shrink-0">
                      <div className={`text-[11.5px] font-semibold ${cls.status === 'In Progress' ? 'text-[var(--blue-tx)]' : 'text-[var(--tx3)]'}`}>{cls.time}</div>
                    </div>
                    <div className="flex-1">
                      <div className={`text-[12.5px] font-semibold ${cls.status === 'In Progress' ? 'text-[var(--blue-tx)]' : 'text-[var(--tx)]'}`}>{cls.subject}</div>
                      <div className="text-[11px] text-[var(--tx3)]">Class {cls.class} · {cls.room}</div>
                    </div>
                    {cls.status === 'Completed' && <Badge variant="teal">Done</Badge>}
                    {cls.status === 'In Progress' && <Badge variant="blue">Now</Badge>}
                    {cls.status === 'Upcoming' && <Badge variant="gray">Upcoming</Badge>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pending tasks */}
          <Card>
            <CardHeader title="Pending Tasks" icon={<ClipboardList size={14} />} />
            <div className="space-y-2">
              {pendingTasks.map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.urgent ? 'bg-[var(--red)]' : 'bg-[var(--amber)]'}`} />
                  <span className="flex-1 text-[12px] text-[var(--tx)]">{t.task}</span>
                  <span className={`text-[11px] font-medium ${t.urgent ? 'text-[var(--red-tx)]' : 'text-[var(--amber-tx)]'}`}>{t.due}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* My leave status */}
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
          {/* Notices */}
          <Card>
            <CardHeader title="Notices" icon={<Bell size={14} />} />
            <div className="space-y-0">
              {notices.map((n, i) => (
                <div key={i} className={`py-2.5 ${i < notices.length - 1 ? 'border-b border-[var(--b)]' : ''}`}>
                  <div className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'urgent' ? 'bg-[var(--red)]' : 'bg-[var(--blue)]'}`} />
                    <div>
                      <div className={`text-[12px] font-medium ${n.type === 'urgent' ? 'text-[var(--red-tx)]' : 'text-[var(--tx)]'}`}>{n.title}</div>
                      <div className="text-[10.5px] text-[var(--tx3)]">{n.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardHeader title="My Classes Performance" icon={<TrendingUp size={14} />} />
            <div className="space-y-2.5">
              {teacherClasses.slice(0, 3).map((cls, i) => {
                const avgAtt = [92, 88, 95][i] ?? 90;
                return (
                  <div key={cls}>
                    <div className="flex justify-between text-[11.5px] mb-1">
                      <span className="font-medium text-[var(--tx)]">Class {cls}</span>
                      <span className={`font-semibold ${avgAtt >= 90 ? 'text-[var(--teal-tx)]' : 'text-[var(--amber-tx)]'}`}>{avgAtt}%</span>
                    </div>
                    <div className="h-1.5 bg-[var(--surf2)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${avgAtt}%`, background: avgAtt >= 90 ? 'var(--teal)' : 'var(--amber)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
