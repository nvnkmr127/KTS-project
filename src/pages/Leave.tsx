import { useState, useEffect } from 'react';
import { Plus, X, Clock, CheckCircle, XCircle, Calendar, ChevronLeft, ChevronRight, } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/date';
import { STAFF } from './StaffManagement';
import { api } from '../services/api';
import { useDialog } from '../context/DialogContext';

const AVATAR_COLORS: Record<string, { bg: string; color: string }> = {
  SR: { bg: 'var(--red-bg)', color: 'var(--red-tx)' },
  RS: { bg: 'var(--amber-bg)', color: 'var(--amber-tx)' },
  SK: { bg: 'var(--teal-bg)', color: 'var(--teal-tx)' },
  PN: { bg: 'var(--green-bg)', color: 'var(--green-tx)' },
  LD: { bg: 'var(--purple-bg)', color: 'var(--purple-tx)' },
};

const LEAVE_BALANCE = [
  { type: 'Sick Leave', total: 12, used: 4, remaining: 8 },
  { type: 'Casual Leave', total: 6, used: 1, remaining: 5 },
  { type: 'Earned Leave', total: 18, used: 3, remaining: 15 },
  { type: 'Emergency Leave', total: 5, used: 1, remaining: 4 },
];

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  description?: string;
  color: string; // 'red' | 'blue' | 'teal' | 'purple' | 'amber'
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

async function saveSettingToDb(key: string, value: any) {
  try {
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    const existing = await api.getResources('settings', { key });
    if (Array.isArray(existing) && existing.length > 0) {
      const settingId = existing[0].id;
      await api.updateResource('settings', String(settingId), { value: valueStr });
    } else {
      await api.createResource('settings', {
        key,
        value: valueStr,
        group: 'leave',
        type: 'json',
        is_public: true,
      });
    }
  } catch (err) {
    console.error(`Error saving setting ${key} to DB:`, err);
  }
}

// Custom Date Picker component showing Sunday and marked holidays
function CustomDatePicker({
  value,
  onChange,
  minDate,
  holidays,
  label
}: {
  value: string;
  onChange: (val: string) => void;
  minDate?: string;
  holidays: Holiday[];
  label: string;
}) {
  const { alert } = useDialog();
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return d.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return d.getMonth();
  });

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getCalendarDateStr = (day: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getHolidayForDate = (dateStr: string) => {
    return holidays.find(h => h.date === dateStr);
  };

  const isDateMinValid = (dateStr: string) => {
    if (!minDate) return true;
    return dateStr >= minDate;
  };

  return (
    <div className="relative">
      <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none text-left focus:border-[var(--blue)]"
      >
        <span>{value ? formatDate(value) : '-- Select Date --'}</span>
        <Calendar size={13} className="text-[var(--tx3)]" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 bg-[var(--surf)] border border-[var(--b)] rounded-2xl shadow-xl z-50 p-3 w-[295px] max-h-[380px] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear(y => y - 1);
                } else setCurrentMonth(m => m - 1);
              }}
              className="p-1 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="text-[11.5px] font-bold text-[var(--tx)]">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </div>
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear(y => y + 1);
                } else setCurrentMonth(m => m + 1);
              }}
              className="p-1 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[9.5px] font-bold text-[var(--tx3)] mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dateStr = getCalendarDateStr(day);
              const dateObj = new Date(dateStr + 'T00:00:00');
              const isSunday = dateObj.getDay() === 0;
              const holiday = getHolidayForDate(dateStr);
              const isSelectable = isDateMinValid(dateStr);

              // Determine styling
              let styleClass = 'text-[var(--tx)] hover:bg-[var(--surf2)]';
              let customStyle: React.CSSProperties = {};
              let hoverTitle = isSunday ? 'Sunday Holiday' : '';

              if (value === dateStr) {
                styleClass = 'bg-[var(--blue)] text-white font-bold';
              } else if (isSunday) {
                styleClass = 'bg-red-500/10 text-red-600 font-semibold';
              } else if (holiday) {
                hoverTitle = `${holiday.name}${holiday.description ? ' - ' + holiday.description : ''}`;
                const hColor = holiday.color || 'red';
                const colorMap: Record<string, { bg: string, tx: string }> = {
                  red: { bg: 'var(--red-bg)', tx: 'var(--red-tx)' },
                  blue: { bg: 'var(--blue-bg)', tx: 'var(--blue-tx)' },
                  teal: { bg: 'var(--teal-bg)', tx: 'var(--teal-tx)' },
                  purple: { bg: 'var(--purple-bg)', tx: 'var(--purple-tx)' },
                  amber: { bg: 'var(--amber-bg)', tx: 'var(--amber-tx)' },
                };
                const mapping = colorMap[hColor] || colorMap.red;
                customStyle = { backgroundColor: mapping.bg, color: mapping.tx };
              }

              if (!isSelectable) {
                styleClass = 'text-[var(--tx3)] opacity-40 cursor-not-allowed';
                customStyle = {};
              }

              return (
                <button
                  key={day}
                  type="button"
                  disabled={!isSelectable}
                  title={hoverTitle}
                  onClick={async () => {
                    if (isSunday || holiday) {
                      await alert(`Cannot select holiday/Sunday: ${holiday?.name || 'Sunday'}`, "Invalid Date");
                      return;
                    }
                    onChange(dateStr);
                    setIsOpen(false);
                  }}
                  className={`min-h-[42px] py-1 flex flex-col items-center justify-between rounded-lg text-[10px] relative transition-all border border-transparent ${styleClass} ${isSelectable ? 'cursor-pointer' : ''}`}
                  style={customStyle}
                >
                  <span className="font-bold">{day}</span>
                  {holiday && (
                    <span className="text-[7.5px] truncate max-w-full text-center leading-tight px-0.5" style={{ fontSize: '7px' }}>
                      {holiday.name}
                    </span>
                  )}
                  {holiday && holiday.description && (
                    <span className="text-[6.5px] opacity-75 truncate max-w-full text-center leading-none" style={{ fontSize: '6px' }}>
                      {holiday.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function Leave() {
  const { alert } = useDialog();
  const { user } = useAuth();
  const { leaveRequests, approveLeave, rejectLeave, addLeaveRequest, setHasUnsavedChanges } = useApp();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'requests' | 'holidays'>('requests');
  const [showApplyState, setShowApplyState] = useState(false);

  const setShowApply = (val: boolean) => {
    setShowApplyState(val);
    setHasUnsavedChanges(val);
    if (!val) {
      setDateError('');
    }
  };

  const [applyType, setApplyType] = useState<'Sick Leave' | 'Casual Leave' | 'Emergency Leave' | 'Earned Leave'>('Sick Leave');
  const [applyFrom, setApplyFrom] = useState('');
  const [applyTo, setApplyTo] = useState('');
  const [applyReason, setApplyReason] = useState('');
  const [dateError, setDateError] = useState('');

  // Rejection modal states
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState('');

  // Holidays state
  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const saved = localStorage.getItem('kts_holidays');
    return (saved && JSON.parse(saved)) || [];
  });

  // Admin Holiday Calendar designer states
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(5); // June
  const [holidayModal, setHolidayModal] = useState<{ dateStr: string; holiday?: Holiday } | null>(null);
  const [modalHolidayName, setModalHolidayName] = useState('');
  const [modalHolidayDesc, setModalHolidayDesc] = useState('');
  const [modalHolidayColor, setModalHolidayColor] = useState('red');
  const [modalIsHoliday, setModalIsHoliday] = useState(true);

  // Sync holidays from DB
  useEffect(() => {
    async function syncHolidays() {
      try {
        const res = await api.getResources('settings', { key: 'kts_holidays' });
        if (Array.isArray(res) && res.length > 0 && res[0].value) {
          const parsed = JSON.parse(res[0].value);
          setHolidays(parsed);
          (localStorage as any).originalSetItem('kts_holidays', JSON.stringify(parsed));
        }
      } catch (err) {
        console.error('Error syncing holidays:', err);
      }
    }
    syncHolidays();
  }, []);

  const handleRejectClick = (id: string) => {
    setRejectingId(id);
    setRejectionMessage('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectingId) return;
    rejectLeave(rejectingId, rejectionMessage);
    setRejectModalOpen(false);
    setRejectingId(null);
    setRejectionMessage('');
  };

  // Load staff list to filter leaves
  const staffList = (() => {
    const saved = localStorage.getItem('kts_staff_members');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(Boolean);
        }
      } catch (e) {
        console.error(e);
      }
    }
    return STAFF.filter(Boolean);
  })();

  const visibleRequests = isAdmin
    ? leaveRequests.filter((l) =>
      staffList.some(
        (s) => (s.name || '').toLowerCase() === (l.staffName || '').toLowerCase()
      )
    )
    : leaveRequests.filter((l) => l.staffId === user?.id);

  const pending = leaveRequests.filter((l) => l.status === 'Pending').length;
  const approved = leaveRequests.filter((l) => l.status === 'Approved').length;
  const totalDaysUsed = leaveRequests.filter((l) => l.status === 'Approved').reduce((s, l) => s + l.days, 0);

  const validateDates = (fromStr: string, toStr: string) => {
    if (!fromStr || !toStr) return '';
    const from = new Date(fromStr);
    const to = new Date(toStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (from < today) {
      return 'Start date cannot be in the past.';
    }
    if (to < from) {
      return 'End date cannot be before start date.';
    }

    // Check if weekend (Sunday: 0)
    const fromDay = from.getDay();
    const toDay = to.getDay();
    if (fromDay === 0 || toDay === 0) {
      return 'Selected dates cannot fall on Sundays (school holidays).';
    }

    const isHoliday = (dateStr: string) => holidays.some(h => h.date === dateStr);
    if (isHoliday(fromStr) || isHoliday(toStr)) {
      return 'Selected dates cannot fall on a school holiday.';
    }
    return '';
  };

  const handleFromChange = (val: string) => {
    setApplyFrom(val);
    const err = validateDates(val, applyTo);
    setDateError(err);
  };

  const handleToChange = (val: string) => {
    setApplyTo(val);
    const err = validateDates(applyFrom, val);
    setDateError(err);
  };

  const handleSubmit = () => {
    if (!applyFrom || !applyTo || !applyReason) return;
    const err = validateDates(applyFrom, applyTo);
    if (err) {
      setDateError(err);
      return;
    }
    const from = new Date(applyFrom);
    const to = new Date(applyTo);
    const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
    addLeaveRequest({
      staffId: user?.id ?? '2',
      staffName: user?.name ?? 'Unknown',
      init: user?.initials ?? 'LD',
      type: applyType,
      from: applyFrom,
      to: applyTo,
      days,
      reason: applyReason,
      status: 'Pending',
    });
    setHasUnsavedChanges(false);
    setShowApply(false);
    setApplyFrom('');
    setApplyTo('');
    setApplyReason('');
  };

  // Holiday management functions
  const openHolidayModal = (dateStr: string) => {
    const existing = holidays.find(h => h.date === dateStr);
    setHolidayModal({ dateStr, holiday: existing });
    if (existing) {
      setModalHolidayName(existing.name);
      setModalHolidayDesc(existing.description || '');
      setModalHolidayColor(existing.color);
      setModalIsHoliday(true);
    } else {
      setModalHolidayName('');
      setModalHolidayDesc('');
      setModalHolidayColor('red');
      setModalIsHoliday(true);
    }
  };

  const handleSaveHoliday = async () => {
    if (!holidayModal) return;
    let updatedHolidays = [...holidays];

    if (!modalIsHoliday) {
      // Remove holiday
      updatedHolidays = updatedHolidays.filter(h => h.date !== holidayModal.dateStr);
    } else {
      if (!modalHolidayName.trim()) {
        await alert('Holiday name is required.', 'Input Required');
        return;
      }
      const newHoliday: Holiday = {
        date: holidayModal.dateStr,
        name: modalHolidayName.trim(),
        description: modalHolidayDesc.trim() || undefined,
        color: modalHolidayColor,
      };
      const idx = updatedHolidays.findIndex(h => h.date === holidayModal.dateStr);
      if (idx >= 0) {
        updatedHolidays[idx] = newHoliday;
      } else {
        updatedHolidays.push(newHoliday);
      }
    }

    setHolidays(updatedHolidays);
    localStorage.setItem('kts_holidays', JSON.stringify(updatedHolidays));
    saveSettingToDb('kts_holidays', updatedHolidays);
    setHolidayModal(null);
  };

  // Helper to build admin calendar view
  const renderAdminHolidayCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

    const getCalendarDateStr = (day: number) =>
      `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return (
      <Card>
        <div className="flex items-center justify-between mb-4 border-b border-[var(--b)] pb-3">
          <div>
            <div className="text-[13px] font-semibold text-[var(--tx)]">School Holidays {isAdmin ? 'Designer' : 'Calendar'}</div>
            <div className="text-[11px] text-[var(--tx3)]">{isAdmin ? 'Click on any weekday to add/edit custom holidays, or view Sundays.' : 'View school holidays and Sundays.'}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (calendarMonth === 0) {
                  setCalendarMonth(11);
                  setCalendarYear(y => y - 1);
                } else setCalendarMonth(m => m - 1);
              }}
              className="p-1 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-[12.5px] font-bold text-[var(--tx)] px-2">
              {MONTH_NAMES[calendarMonth]} {calendarYear}
            </div>
            <button
              onClick={() => {
                if (calendarMonth === 11) {
                  setCalendarMonth(0);
                  setCalendarYear(y => y + 1);
                } else setCalendarMonth(m => m + 1);
              }}
              className="p-1 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10.5px] font-bold text-[var(--tx3)] mb-2">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="min-h-[64px] bg-[var(--surf2)]/20 border border-transparent rounded-xl" />;
            const dateStr = getCalendarDateStr(day);
            const dateObj = new Date(dateStr + 'T00:00:00');
            const isSunday = dateObj.getDay() === 0;
            const holiday = holidays.find(h => h.date === dateStr);

            let styleClass = 'bg-[var(--surf2)]/50 text-[var(--tx)] hover:bg-[var(--surf3)] hover:border-[var(--blue)]/40';
            let customStyle: React.CSSProperties = {};

            if (isSunday) {
              styleClass = 'bg-red-500/10 text-red-600 font-semibold border-red-500/20';
            } else if (holiday) {
              const hColor = holiday.color || 'red';
              const colorMap: Record<string, { bg: string, tx: string }> = {
                red: { bg: 'var(--red-bg)', tx: 'var(--red-tx)' },
                blue: { bg: 'var(--blue-bg)', tx: 'var(--blue-tx)' },
                teal: { bg: 'var(--teal-bg)', tx: 'var(--teal-tx)' },
                purple: { bg: 'var(--purple-bg)', tx: 'var(--purple-tx)' },
                amber: { bg: 'var(--amber-bg)', tx: 'var(--amber-tx)' },
              };
              const mapping = colorMap[hColor] || colorMap.red;
              customStyle = { backgroundColor: mapping.bg, color: mapping.tx, borderColor: 'transparent' };
            }

            return (
              <div
                key={day}
                onClick={async () => {
                  if (!isAdmin) return;
                  if (isSunday) {
                    await alert('Sundays are automatic school holidays.', 'Notice');
                    return;
                  }
                  openHolidayModal(dateStr);
                }}
                className={`min-h-[68px] p-2 flex flex-col justify-between rounded-xl border border-[var(--b)] transition-all ${isAdmin ? 'cursor-pointer' : 'cursor-default'} ${styleClass}`}
                style={customStyle}
              >
                <div className="font-bold text-[11.5px]">{day}</div>
                {isSunday && (
                  <div className="text-[9px] uppercase tracking-wider text-red-500 font-bold leading-none mt-1">
                    Sunday
                  </div>
                )}
                {holiday && (
                  <div className="text-[9.5px] font-bold mt-1 line-clamp-1 leading-tight">
                    {holiday.name}
                  </div>
                )}
                {holiday && holiday.description && (
                  <div className="text-[8px] opacity-75 line-clamp-2 leading-none mt-0.5">
                    {holiday.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label={isAdmin ? 'Total Requests' : 'Total Leaves'} value={isAdmin ? leaveRequests.length : visibleRequests.length} sub="This year" icon={<Calendar size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Pending Approval" value={pending} sub="Awaiting review" icon={<Clock size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
        <KPICard label="Approved" value={approved} sub="This month" icon={<CheckCircle size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Days Used" value={totalDaysUsed} sub="By all staff" icon={<XCircle size={15} />} iconBg="var(--red-bg)" iconColor="var(--red-tx)" />
      </div>

      <div className="flex border-b border-[var(--b)] mb-3">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-[12px] border-b-2 -mb-px transition-colors cursor-pointer ${activeTab === 'requests'
              ? 'text-[var(--blue-tx)] border-[var(--blue)] font-semibold'
              : 'text-[var(--tx3)] border-transparent hover:text-[var(--tx)]'
            }`}
        >
          Leave Requests
        </button>
        <button
          onClick={() => setActiveTab('holidays')}
          className={`px-4 py-2 text-[12px] border-b-2 -mb-px transition-colors cursor-pointer ${activeTab === 'holidays'
              ? 'text-[var(--blue-tx)] border-[var(--blue)] font-semibold'
              : 'text-[var(--tx3)] border-transparent hover:text-[var(--tx)]'
            }`}
        >
          Holiday Calendar
        </button>
      </div>


      {activeTab === 'holidays' ? (
        renderAdminHolidayCalendar()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-2.5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[13px] font-semibold text-[var(--tx)]">{isAdmin ? 'Leave Requests' : 'My Leave History'}</div>
              {!isAdmin && (
                <button onClick={() => setShowApply(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90">
                  <Plus size={11} /> Apply Leave
                </button>
              )}
            </div>

            <div className="space-y-2">
              {visibleRequests.length === 0 ? (
                <div className="text-center py-8 text-[12px] text-[var(--tx3)]">No leave requests found.</div>
              ) : (
                visibleRequests.map((l) => (
                  <div key={l.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-[var(--surf2)] border border-[var(--b)] rounded-xl">
                    <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                      {isAdmin && (
                        <div className="flex-shrink-0">
                          <Avatar initials={l.init} bg={AVATAR_COLORS[l.init]?.bg ?? 'var(--surf3)'} color={AVATAR_COLORS[l.init]?.color ?? 'var(--tx2)'} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {isAdmin && <span className="text-[12.5px] font-semibold text-[var(--tx)]">{l.staffName}</span>}
                          <Badge variant={l.type === 'Sick Leave' ? 'red' : l.type === 'Emergency Leave' ? 'coral' : l.type === 'Earned Leave' ? 'teal' : 'blue'}>
                            {l.type}
                          </Badge>
                        </div>
                        <div className="text-[11.5px] text-[var(--tx2)]">{formatDate(l.from)} → {formatDate(l.to)} <span className="text-[var(--tx3)]">({l.days} day{l.days > 1 ? 's' : ''})</span></div>
                        <div className="text-[11px] text-[var(--tx3)] truncate mt-0.5">{l.reason}</div>
                        {l.status === 'Rejected' && l.adminNotes && (
                          <div className="text-[10.5px] text-[var(--red-tx)] bg-[var(--red-bg)] px-2.5 py-1 rounded-lg border border-[var(--red-tx)]/10 mt-1.5 max-w-md">
                            <span className="font-semibold">Reason for Rejection:</span> {l.adminNotes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--b)] sm:border-none flex-shrink-0">
                      {l.status === 'Approved' && <Badge variant="teal">Approved</Badge>}
                      {l.status === 'Pending' && <Badge variant="amber">Pending</Badge>}
                      {l.status === 'Rejected' && <Badge variant="red">Rejected</Badge>}
                      {isAdmin && l.status === 'Pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => approveLeave(l.id)} className="px-2 py-0.5 text-[10.5px] bg-[var(--teal-bg)] text-[var(--teal-tx)] rounded-lg cursor-pointer font-medium hover:opacity-80">Approve</button>
                          <button onClick={() => handleRejectClick(l.id)} className="px-2 py-0.5 text-[10.5px] bg-[var(--red-bg)] text-[var(--red-tx)] rounded-lg cursor-pointer font-medium hover:opacity-80">Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <div className="text-[12.5px] font-semibold text-[var(--tx)] mb-3">Leave Balance</div>
            <div className="space-y-3">
              {LEAVE_BALANCE.map((lb) => (
                <div key={lb.type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-medium text-[var(--tx)]">{lb.type}</span>
                    <span className="text-[12px] font-semibold text-[var(--tx)]">{lb.remaining}/{lb.total}</span>
                  </div>
                  <div className="h-1.5 bg-[var(--surf2)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(lb.remaining / lb.total) * 100}%`,
                        background: lb.remaining > lb.total / 2 ? 'var(--teal)' : lb.remaining > 2 ? 'var(--amber)' : 'var(--red)',
                      }}
                    />
                  </div>
                  <div className="text-[10.5px] text-[var(--tx3)] mt-0.5">{lb.used} used · {lb.remaining} remaining</div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--b)]">
              <div className="text-[12px] font-semibold text-[var(--tx)] mb-2">Leave Calendar</div>
              <div className="text-[11.5px] text-[var(--tx3)] bg-[var(--surf2)] rounded-xl p-3 text-center">
                June 2026 · {leaveRequests.filter((l) => l.status === 'Approved').length} approved leaves
              </div>
              {leaveRequests.filter((l) => l.status === 'Approved').slice(0, 3).map((l) => (
                <div key={l.id} className="flex items-center justify-between mt-2 text-[11.5px]">
                  <span className="text-[var(--tx2)]">{isAdmin ? l.staffName : l.type}</span>
                  <span className="text-[var(--tx3)]">{formatDate(l.from)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyState && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[440px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">Apply for Leave</div>
              <button onClick={() => setShowApply(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Leave Type *</label>
                <select
                  value={applyType}
                  onChange={(e) => {
                    setApplyType(e.target.value as typeof applyType);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                >
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Earned Leave">Earned Leave</option>
                </select>
                {/* Remaining Balance display */}
                <div className="text-[11px] text-[var(--teal-tx)] font-semibold mt-1.5">
                  Remaining Balance: {(() => {
                    const bal = LEAVE_BALANCE.find(lb => lb.type === applyType);
                    return bal ? `${bal.remaining} of ${bal.total} days` : 'N/A';
                  })()}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <CustomDatePicker
                  value={applyFrom}
                  onChange={handleFromChange}
                  minDate={new Date().toISOString().slice(0, 10)}
                  holidays={holidays}
                  label="From Date *"
                />
                <CustomDatePicker
                  value={applyTo}
                  onChange={handleToChange}
                  minDate={applyFrom || new Date().toISOString().slice(0, 10)}
                  holidays={holidays}
                  label="To Date *"
                />
              </div>
              {dateError && (
                <div className="text-[10.5px] text-[var(--red-tx)] bg-[var(--red-bg)] border border-[var(--red-tx)]/10 px-3 py-1.5 rounded-lg">
                  {dateError}
                </div>
              )}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Reason *</label>
                <textarea
                  value={applyReason}
                  onChange={(e) => {
                    setApplyReason(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none resize-none focus:border-[var(--blue)]"
                  rows={3}
                  placeholder="Briefly describe the reason for leave..."
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Supporting Document (optional)</label>
                <div className="border-2 border-dashed border-[var(--b)] rounded-lg p-3 text-center cursor-pointer hover:border-[var(--blue)] transition-colors">
                  <div className="text-[11.5px] text-[var(--tx3)]">Upload medical certificate, etc.</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => { setShowApply(false); setHasUnsavedChanges(false); }} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!applyFrom || !applyTo || !applyReason || !!dateError}
                className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer disabled:opacity-50"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Leave Request Modal */}
      {rejectModalOpen && rejectingId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Reject Leave Request</div>
                <div className="text-[11.5px] text-[var(--tx3)] mt-0.5">Please provide a reason for rejecting this leave application.</div>
              </div>
              <button onClick={() => { setRejectModalOpen(false); setRejectingId(null); }} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Rejection Message / Reason *</label>
                <textarea
                  required
                  value={rejectionMessage}
                  onChange={(e) => setRejectionMessage(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none resize-none focus:border-[var(--blue)]"
                  rows={3}
                  placeholder="Enter rejection reason..."
                />
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => { setRejectModalOpen(false); setRejectingId(null); }} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionMessage.trim()}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[12.5px] font-semibold cursor-pointer disabled:opacity-50 hover:bg-red-700 transition-colors"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Assign/Edit Holiday Modal */}
      {holidayModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Configure School Holiday</div>
                <div className="text-[11.5px] text-[var(--tx3)] mt-0.5">{formatDate(holidayModal.dateStr)}</div>
              </div>
              <button onClick={() => setHolidayModal(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalIsHoliday}
                  onChange={(e) => setModalIsHoliday(e.target.checked)}
                  className="rounded border-[var(--b)] text-[var(--blue)] focus:ring-0 cursor-pointer"
                />
                <span className="text-[12px] font-semibold text-[var(--tx)]">Mark as Holiday</span>
              </label>

              {modalIsHoliday && (
                <>
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Holiday Name *</label>
                    <input
                      type="text"
                      value={modalHolidayName}
                      onChange={(e) => setModalHolidayName(e.target.value)}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                      placeholder="e.g. Diwali, Ramzan"
                    />
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Description (Optional)</label>
                    <textarea
                      value={modalHolidayDesc}
                      onChange={(e) => setModalHolidayDesc(e.target.value)}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none resize-none focus:border-[var(--blue)]"
                      rows={2}
                      placeholder="e.g. School remains closed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Visual Highlight Color *</label>
                    <div className="flex gap-2.5">
                      {['red', 'blue', 'teal', 'purple', 'amber'].map(color => {
                        const colors: Record<string, string> = {
                          red: 'bg-red-500',
                          blue: 'bg-blue-500',
                          teal: 'bg-teal-500',
                          purple: 'bg-purple-500',
                          amber: 'bg-amber-500',
                        };
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setModalHolidayColor(color)}
                            className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${colors[color]} ${modalHolidayColor === color ? 'border-[var(--tx)] scale-110 shadow-sm' : 'border-transparent'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setHolidayModal(null)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button
                onClick={handleSaveHoliday}
                className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer hover:opacity-90"
              >
                Save Holiday Config
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
