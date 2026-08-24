import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { Search, Calendar, UserCheck, UserX, AlertCircle, Clock, Fingerprint, RefreshCw, Wifi, WifiOff, Save, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Avatar } from '../components/ui';
import { STAFF, StaffMember, isRealStaff } from './StaffManagement';

import { useApp } from '../context/AppContext';
import { useDialog } from '../context/DialogContext';
import { utcDateTimeToParts, scanDateTimeToParts, formatDate, getLocalDateStr } from '../utils/date';

export interface Holiday {
  date: string;
  name: string;
  description?: string;
  isHoliday?: boolean;
  color?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface StaffAttendanceDatePickerProps {
  value: string;
  onChange: (dateStr: string) => void;
  holidays: Holiday[];
  maxDate?: string;
}

function StaffAttendanceDatePicker({ value, onChange, holidays, maxDate }: StaffAttendanceDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const todayStr = maxDate || getLocalDateStr();

  const [currentYear, setCurrentYear] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    return !isNaN(d.getFullYear()) ? d.getFullYear() : new Date().getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    return !isNaN(d.getMonth()) ? d.getMonth() : new Date().getMonth();
  });

  // Sync view when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getCalendarDateStr = (day: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getHolidayForDate = (dateStr: string) => {
    return holidays.find((h) => h.date === dateStr);
  };

  const selectedHoliday = getHolidayForDate(value);
  const selectedDateObj = new Date(value + 'T00:00:00');
  const isSelectedSunday = !isNaN(selectedDateObj.getTime()) && selectedDateObj.getDay() === 0;

  // Holidays in currently viewed month
  const monthHolidays = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return holidays.filter((h) => h.date.startsWith(monthPrefix));
  }, [holidays, currentYear, currentMonth]);

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-500/15 text-blue-600 border border-blue-500/30',
          dot: 'bg-blue-500',
          badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        };
      case 'teal':
        return {
          bg: 'bg-teal-500/15 text-teal-600 border border-teal-500/30',
          dot: 'bg-teal-500',
          badge: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
        };
      case 'purple':
        return {
          bg: 'bg-purple-500/15 text-purple-600 border border-purple-500/30',
          dot: 'bg-purple-500',
          badge: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        };
      case 'amber':
        return {
          bg: 'bg-amber-500/15 text-amber-600 border border-amber-500/30',
          dot: 'bg-amber-500',
          badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        };
      case 'red':
      default:
        return {
          bg: 'bg-red-500/15 text-red-600 border border-red-500/30',
          dot: 'bg-red-500',
          badge: 'bg-red-500/10 text-red-600 border-red-500/20',
        };
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 bg-[var(--surf2)] border border-[var(--b)] hover:border-[var(--blue)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] cursor-pointer outline-none transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Calendar size={13} className="text-[var(--blue-tx)] shrink-0" />
          <span className="font-semibold truncate">
            {value ? formatDate(value) : '-- Select Date --'}
          </span>
          {selectedHoliday && (
            <span
              className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold truncate max-w-[110px] ${
                getColorClasses(selectedHoliday.color).badge
              } border`}
              title={selectedHoliday.name}
            >
              {selectedHoliday.name}
            </span>
          )}
          {!selectedHoliday && isSelectedSunday && (
            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold text-red-600 bg-red-500/10 border border-red-500/20">
              Sunday
            </span>
          )}
        </div>
        <span className="text-[10px] text-[var(--tx3)] font-mono shrink-0">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 mt-1 bg-[var(--surf)] border border-[var(--b)] rounded-2xl shadow-2xl z-50 p-3.5 w-[310px] animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header Month/Year Nav */}
          <div className="flex items-center justify-between mb-3 border-b border-[var(--b)] pb-2.5">
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear((y) => y - 1);
                } else {
                  setCurrentMonth((m) => m - 1);
                }
              }}
              className="p-1 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)] hover:text-[var(--tx)] transition-colors"
              title="Previous Month"
            >
              <ChevronLeft size={15} />
            </button>

            <div className="text-[12px] font-bold text-[var(--tx)] flex items-center gap-1.5">
              <span>{MONTH_NAMES[currentMonth]}</span>
              <span className="font-mono text-[var(--blue-tx)]">{currentYear}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setCurrentYear(now.getFullYear());
                  setCurrentMonth(now.getMonth());
                  onChange(todayStr);
                  setIsOpen(false);
                }}
                className="px-2 py-0.5 text-[10px] font-bold bg-[var(--blue-bg)] text-[var(--blue-tx)] hover:opacity-80 rounded-md cursor-pointer transition-opacity"
                title="Select Today"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear((y) => y + 1);
                  } else {
                    setCurrentMonth((m) => m + 1);
                  }
                }}
                className="p-1 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)] hover:text-[var(--tx)] transition-colors"
                title="Next Month"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[var(--tx3)] mb-1.5">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, idx) => (
              <div key={d} className={idx === 0 ? 'text-red-500' : ''}>
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className="h-8" />;
              const dateStr = getCalendarDateStr(day);
              const dateObj = new Date(dateStr + 'T00:00:00');
              const isSunday = dateObj.getDay() === 0;
              const holiday = getHolidayForDate(dateStr);
              const isFuture = dateStr > todayStr;
              const isSelected = value === dateStr;
              const isToday = dateStr === todayStr;

              let styleClasses = 'hover:bg-[var(--surf2)] text-[var(--tx)]';
              let holidayColorMeta = holiday ? getColorClasses(holiday.color) : null;

              if (isSelected) {
                styleClasses = 'bg-[var(--blue)] text-white font-bold shadow-sm';
              } else if (isFuture) {
                styleClasses = 'opacity-25 cursor-not-allowed text-[var(--tx3)] bg-[var(--surf2)]/30 select-none';
              } else if (holiday) {
                styleClasses = `${holidayColorMeta?.bg} font-semibold`;
              } else if (isSunday) {
                styleClasses = 'bg-red-500/10 text-red-500 font-semibold';
              }

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isFuture}
                  onClick={() => {
                    if (!isFuture) {
                      onChange(dateStr);
                      setIsOpen(false);
                    }
                  }}
                  title={
                    isFuture
                      ? 'Future dates are disabled'
                      : holiday
                      ? `Holiday: ${holiday.name}${holiday.description ? ` (${holiday.description})` : ''}`
                      : isSunday
                      ? 'Sunday Holiday'
                      : isToday
                      ? 'Today'
                      : dateStr
                  }
                  className={`h-8 rounded-lg flex flex-col items-center justify-center text-[11px] relative transition-all cursor-pointer ${styleClasses} ${
                    isToday && !isSelected ? 'ring-1.5 ring-[var(--blue)] ring-offset-1 ring-offset-[var(--surf)]' : ''
                  }`}
                >
                  <span>{day}</span>
                  {/* Indicator Dot for Holidays */}
                  {holiday && !isSelected && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${holidayColorMeta?.dot} absolute bottom-0.5`}
                    />
                  )}
                  {isSunday && !holiday && !isSelected && !isFuture && (
                    <span className="w-1 h-1 rounded-full bg-red-400 absolute bottom-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Month Holidays List / Summary */}
          {monthHolidays.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[var(--b)] max-h-[100px] overflow-y-auto">
              <div className="text-[10px] font-bold text-[var(--tx3)] mb-1.5 uppercase tracking-wider">
                Holidays this month:
              </div>
              <div className="space-y-1">
                {monthHolidays.map((h) => {
                  const meta = getColorClasses(h.color);
                  return (
                    <div
                      key={h.date}
                      onClick={() => {
                        if (h.date <= todayStr) {
                          onChange(h.date);
                          setIsOpen(false);
                        }
                      }}
                      className={`flex items-center justify-between text-[10.5px] px-2 py-1 rounded-md ${
                        meta.badge
                      } border ${h.date <= todayStr ? 'cursor-pointer hover:opacity-80' : 'opacity-60 cursor-not-allowed'}`}
                    >
                      <span className="font-semibold truncate max-w-[190px]">{h.name}</span>
                      <span className="font-mono text-[9.5px] shrink-0">{formatDate(h.date)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color Legend Footer */}
          <div className="mt-2.5 pt-2 border-t border-[var(--b)] flex items-center justify-between text-[9.5px] text-[var(--tx3)] flex-wrap gap-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Holiday/Sunday
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--blue)] inline-block" /> Selected
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400 opacity-40 inline-block" /> Future (Disabled)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Half Day';

interface BiometricRecord {
  Empcode: string;
  Name?: string;
  INTime?: string;
  OUTTime?: string;
  WorkTime?: string;
  OverTime?: string;
  Status?: string;
  DateString?: string;
  Remark?: string;
  Late_In?: string;
  Erl_Out?: string;
  PunchDate?: string;
}

interface LocalPunch {
  id: string;
  staffId: string;
  timestamp: string; // YYYY-MM-DD HH:MM:SS
}

const normalizeName = (name: string) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/^(mr|mrs|ms|dr)\.?\s+/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

const parsePunchDate = (punchDateStr: string): string => {
  if (!punchDateStr) return '';
  try {
    const utc = utcDateTimeToParts(punchDateStr);
    if (utc) return utc.date;
    const cleanStr = punchDateStr.includes('T') ? punchDateStr.split('T')[0] : punchDateStr;
    const parts = cleanStr.trim().split(' ');
    const datePart = parts[0];
    if (datePart.includes('/')) {
      const dateParts = datePart.split('/');
      if (dateParts.length === 3) {
        const day = dateParts[0];
        const month = dateParts[1];
        const year = dateParts[2];
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    } else if (datePart.includes('-')) {
      const dateParts = datePart.split('-');
      if (dateParts.length === 3) {
        if (dateParts[0].length === 4) {
          return `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].slice(0, 2).padStart(2, '0')}`;
        } else {
          const day = dateParts[0];
          const month = dateParts[1];
          const year = dateParts[2];
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }
  } catch (err) {
    console.error('Error parsing punch date:', err);
  }
  return '';
};

// Extracts "HH:MM" from a "YYYY-MM-DD HH:MM:SS" or ISO timestamp
const extractTimeOfDay = (ts: string): string => {
  if (!ts) return '';
  const timePart = ts.includes('T') ? ts.split('T')[1] : ts.split(' ')[1];
  return timePart ? timePart.substring(0, 5) : '';
};

// True when the last biometric OUT scan is basically "now" (i.e. an open/running clock, not a real checkout)
const isOutTimePlaceholder = (outTime: string, targetDate: string): boolean => {
  if (targetDate !== getLocalDateStr()) return false;
  const [outH, outM] = outTime.split(':').map(Number);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const outMinutes = outH * 60 + outM;
  return Math.abs(currentMinutes - outMinutes) <= 2;
};

const buildPunchesFromBioRecords = (records: BiometricRecord[], staff: StaffMember, targetDate: string, idSuffix: string): LocalPunch[] => {
  const punches: LocalPunch[] = [];
  records.forEach((rec) => {
    if (rec.INTime && rec.INTime !== '--:--') {
      punches.push({ id: `bio-in-${rec.Empcode}${idSuffix}`, staffId: staff.id, timestamp: `${targetDate} ${rec.INTime}:00` });
    }
    if (rec.OUTTime && rec.OUTTime !== '--:--' && !isOutTimePlaceholder(rec.OUTTime, targetDate)) {
      punches.push({ id: `bio-out-${rec.Empcode}${idSuffix}`, staffId: staff.id, timestamp: `${targetDate} ${rec.OUTTime}:00` });
    }
    if (!rec.INTime && !rec.OUTTime && rec.PunchDate) {
      punches.push({ id: `bio-${rec.Empcode}${idSuffix}`, staffId: staff.id, timestamp: rec.PunchDate });
    }
  });
  return punches;
};

// Check if a biometric record has actual punch data (not empty or '--:--' placeholders)
const hasRealPunchData = (record: BiometricRecord): boolean => {
  if (record.INTime && record.INTime !== '--:--' && record.INTime.trim() !== '') return true;
  if (record.OUTTime && record.OUTTime !== '--:--' && record.OUTTime.trim() !== '') return true;
  if (record.PunchDate && record.PunchDate.trim() !== '' && !record.INTime && !record.OUTTime) return true;
  return false;
};

// Matches a biometric record to a staff member by employee code (preferred) or name, plus the selected date
const matchesStaffOnDate = (record: BiometricRecord, staff: StaffMember, targetDate: string): boolean => {
  const empCode = String(record.Empcode || '').toLowerCase().trim();
  const name = String(record.Name || '').toLowerCase().trim();

  const matchesBiometricCode = staff.biometric_employee_code && (
    empCode === String(staff.biometric_employee_code).toLowerCase().trim() ||
    (!isNaN(Number(empCode)) && !isNaN(Number(staff.biometric_employee_code)) && Number(empCode) === Number(staff.biometric_employee_code))
  );

  const matchesIdNumerically = !isNaN(Number(empCode)) && !isNaN(Number(staff.id)) && Number(empCode) === Number(staff.id);
  const hasBioCode = staff.biometric_employee_code && String(staff.biometric_employee_code).trim() !== '';
  const matchCode = hasBioCode
    ? matchesBiometricCode
    : (empCode === String(staff.id).toLowerCase().trim() || matchesIdNumerically);

  const nName = normalizeName(name);
  const sName = normalizeName(staff.name);
  const matchName = (name && name === staff.name.toLowerCase().trim()) || (nName && sName && nName === sName);

  let dateMatch = false;
  if (record.DateString) {
    dateMatch = parsePunchDate(record.DateString) === targetDate;
  } else if (record.PunchDate) {
    dateMatch = (parsePunchDate(record.PunchDate) || record.PunchDate.slice(0, 10)) === targetDate;
  }

  return !!(matchCode || matchName) && dateMatch;
};

type ConnectionStatus = 'unknown' | 'connected' | 'disconnected' | 'testing';

const getIntervalDuration = () => {
  const currentHour = new Date().getHours();
  // Active hours: 7:00 AM to 10:00 PM (7 to 22)
  return currentHour >= 7 && currentHour < 22 ? 5000 : 15 * 60 * 1000;
};

// Runs `callback` on an interval that's fast during active hours and slow otherwise,
// re-checking the active-hours window every minute so it adapts without a remount.
function useAdaptiveInterval(callback: (silent: boolean) => void) {
  const callbackRef = useRef(callback);
  useEffect(() => { callbackRef.current = callback; }, [callback]);

  useEffect(() => {
    let timerId: ReturnType<typeof setInterval> | null = null;
    let currentInterval = getIntervalDuration();

    const startTimer = (ms: number) => {
      if (timerId) clearInterval(timerId);
      timerId = setInterval(() => callbackRef.current(true), ms);
    };

    startTimer(currentInterval);

    // Watch for hour changes to dynamically adjust the interval duration
    const watchTimer = setInterval(() => {
      const ms = getIntervalDuration();
      if (ms !== currentInterval) {
        currentInterval = ms;
        startTimer(currentInterval);
      }
    }, 60000);

    return () => {
      if (timerId) clearInterval(timerId);
      clearInterval(watchTimer);
    };
  }, []);
}

export function StaffAttendance() {
  const { confirm } = useDialog();
  const { leaveRequests } = useApp();
  const [date, setDate] = useState<string>(() => {
    return getLocalDateStr();
  });

  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem('kts_staff_members');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          return arr.filter(isRealStaff);
        }
      }
    } catch { /* empty */ }
    return [];
  });

  // Manual attendance overrides
  const [manualAttendance, setManualAttendance] = useState<Record<string, Record<string, AttendanceStatus>>>(() => {
    const saved = localStorage.getItem('kts_staff_attendance');
    return (saved && JSON.parse(saved)) || {};
  });

  // Local simulated biometric punches (fallback)
  const [localPunches, setLocalPunches] = useState<LocalPunch[]>(() => {
    const saved = localStorage.getItem('kts_biometric_punches');
    return (saved && JSON.parse(saved)) || [];
  });

  // Real biometric records pulled from e-TimeOffice API (via backend proxy)
  const [biometricRecords, setBiometricRecords] = useState<BiometricRecord[]>([]);

  // Attendance Mode
  const [attendanceMode, setAttendanceMode] = useState<'biometric' | 'manual'>('manual');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingPunches, setIsSyncingPunches] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [leavesList, setLeavesList] = useState<any[]>([]);
  const syncInProgress = useRef(false);
  const syncPunchesInProgress = useRef(false);
  const [lastSyncMsg, setLastSyncMsg] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');

  // Timing settings states (with default fallbacks)
  const [schoolStartTime, setSchoolStartTime] = useState('08:30');
  const [schoolEndTime, setSchoolEndTime] = useState('17:30');
  const [presentCutoffMorning, setPresentCutoffMorning] = useState('09:00');
  const [presentCutoffEvening, setPresentCutoffEvening] = useState('16:30');
  const [lateEntryCutoff, setLateEntryCutoff] = useState('09:50');
  const [earlyEntryCutoff, setEarlyEntryCutoff] = useState('15:00');
  const [biometricMachineCutoff, setBiometricMachineCutoff] = useState<string>(() => {
    return localStorage.getItem('biometric_machine_status_cutoff') || '10:00';
  });

  // Holidays state
  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    try {
      const saved = localStorage.getItem('kts_holidays');
      return (saved && JSON.parse(saved)) || [];
    } catch {
      return [];
    }
  });

  // Current local time ticker (updates every 15s to reactively enable manual mode when cutoff passes)
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      setCurrentTimeStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    };
    updateCurrentTime();
    const timer = setInterval(updateCurrentTime, 15000);
    return () => clearInterval(timer);
  }, []);

  // Determine date metrics & conditions
  const todayStr = getLocalDateStr();
  const isToday = date === todayStr;
  const isPastDate = date < todayStr;

  const selectedDateObj = new Date(date + 'T00:00:00');
  const isSunday = !isNaN(selectedDateObj.getTime()) && selectedDateObj.getDay() === 0;
  const holidayOnDate = holidays.find((h) => h.date === date);
  const isHoliday = !!holidayOnDate || isSunday;
  const holidayTitle = holidayOnDate ? holidayOnDate.name : (isSunday ? 'Sunday Holiday' : '');

  // Calculate total real punches for selected date
  const totalPunchesOnSelectedDate = useMemo(() => {
    const localMatches = localPunches.filter((p) => p.timestamp.startsWith(date));
    const bioMatches = biometricRecords.filter((r) => {
      const pDate = r.DateString ? (parsePunchDate(r.DateString) || r.DateString) : (r.PunchDate ? parsePunchDate(r.PunchDate) || r.PunchDate.slice(0, 10) : '');
      return pDate === date && hasRealPunchData(r);
    });
    return localMatches.length + bioMatches.length;
  }, [localPunches, biometricRecords, date]);

  // Is cutoff time reached for today with 0 punches received?
  const isCutoffExceededToday = isToday && currentTimeStr >= biometricMachineCutoff && totalPunchesOnSelectedDate === 0;

  // Is this a past date with 0 biometric punches?
  const isPastDateWithoutPunches = isPastDate && totalPunchesOnSelectedDate === 0;

  // Determine if manual mode / editing controls are allowed
  const isManualAllowed = !isHoliday && (
    connectionStatus === 'disconnected' ||
    isCutoffExceededToday ||
    isPastDateWithoutPunches ||
    attendanceMode === 'manual'
  );

  // Fetch holidays from API resources directly
  useEffect(() => {
    api.getResources('holidays')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
        if (list.length > 0) {
          setHolidays((prev) => {
            const map = new Map<string, Holiday>();
            prev.forEach((h) => map.set(h.date, h));
            list.forEach((h: any) => {
              const d = h.date ? h.date.slice(0, 10) : '';
              if (d) {
                map.set(d, {
                  date: d,
                  name: h.name || 'Holiday',
                  description: h.description || '',
                  color: h.color || 'red',
                  isHoliday: true,
                });
              }
            });
            const merged = Array.from(map.values());
            localStorage.setItem('kts_holidays', JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Load staff members, attendance, and biometric punches from DB settings / localStorage
  useEffect(() => {
    // Clean up mock staff members from localStorage if present
    try {
      const savedStaffStr = localStorage.getItem('kts_staff_members');
      if (savedStaffStr) {
        const parsed = JSON.parse(savedStaffStr);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(isRealStaff);
          if (filtered.length !== parsed.length) {
            localStorage.setItem('kts_staff_members', JSON.stringify(filtered));
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    api.getResources('faculty')
      .then((facultyList) => {
        let currentStaffList = STAFF;
        if (facultyList && Array.isArray(facultyList) && facultyList.length > 0) {
          currentStaffList = facultyList.map((s: any) => ({
            ...s,
            documents: typeof s.documents === 'string' ? JSON.parse(s.documents) : (s.documents || []),
            status: s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : 'Active',
            salary: typeof s.salary === 'string' ? parseFloat(s.salary) : s.salary
          }));
        } else if (facultyList && facultyList.data && Array.isArray(facultyList.data)) {
          // Fallback if backend wraps it in `{ data: [] }`
          currentStaffList = facultyList.data.map((s: any) => ({
            ...s,
            documents: typeof s.documents === 'string' ? JSON.parse(s.documents) : (s.documents || []),
            status: s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : 'Active',
            salary: typeof s.salary === 'string' ? parseFloat(s.salary) : s.salary
          }));
        }
        setStaffList(currentStaffList);
      })
      .catch((e) => {
        console.error('Failed to fetch faculty list in StaffAttendance', e);
      });

    api.getResources('settings')
      .then(async (settings) => {
        const settingsArray = Array.isArray(settings) ? settings : (settings && settings.data && Array.isArray(settings.data) ? settings.data : []);
        const startSetting = settingsArray.find((s: any) => s.key === 'school_start_time');
        const endSetting = settingsArray.find((s: any) => s.key === 'school_end_time');
        const presMSetting = settingsArray.find((s: any) => s.key === 'present_cutoff_morning');
        const presESetting = settingsArray.find((s: any) => s.key === 'present_cutoff_evening');
        const lateSetting = settingsArray.find((s: any) => s.key === 'late_entry_cutoff');
        const earlySetting = settingsArray.find((s: any) => s.key === 'early_entry_cutoff');
        const bioCutoffSetting = settingsArray.find((s: any) => s.key === 'biometric_machine_status_cutoff');
        const holidaysSetting = settingsArray.find((s: any) => s.key === 'kts_holidays');

        const sStart = startSetting?.value || '08:30';
        const sEnd = endSetting?.value || '17:30';
        const pCutM = presMSetting?.value || '09:00';
        const pCutE = presESetting?.value || '16:30';
        const lCutM = lateSetting?.value || '09:50';
        const eCutE = earlySetting?.value || '15:00';
        const bCutM = bioCutoffSetting?.value || '10:00';

        setSchoolStartTime(sStart);
        setSchoolEndTime(sEnd);
        setPresentCutoffMorning(pCutM);
        setPresentCutoffEvening(pCutE);
        setLateEntryCutoff(lCutM);
        setEarlyEntryCutoff(eCutE);
        setBiometricMachineCutoff(bCutM);
        localStorage.setItem('biometric_machine_status_cutoff', bCutM);

        if (holidaysSetting && holidaysSetting.value) {
          try {
            const parsedHolidays = JSON.parse(holidaysSetting.value);
            if (Array.isArray(parsedHolidays)) {
              setHolidays(parsedHolidays);
              (localStorage as any).originalSetItem('kts_holidays', holidaysSetting.value);
            }
          } catch (err) {
            console.error('Error parsing holidays setting:', err);
          }
        }

        const attendanceSetting = settingsArray.find((s: any) => s.key === 'kts_staff_attendance');
        const punchesSetting = settingsArray.find((s: any) => s.key === 'kts_biometric_punches');
        
        let loadedAttendance: Record<string, Record<string, AttendanceStatus>> = {};
        let loadedPunches: LocalPunch[] = [];

        if (attendanceSetting && attendanceSetting.value) {
          (localStorage as any).originalSetItem('kts_staff_attendance', attendanceSetting.value);
          loadedAttendance = JSON.parse(attendanceSetting.value);
        } else {
          const savedAtt = localStorage.getItem('kts_staff_attendance');
          if (savedAtt) loadedAttendance = JSON.parse(savedAtt);
        }

        if (punchesSetting && punchesSetting.value) {
          (localStorage as any).originalSetItem('kts_biometric_punches', punchesSetting.value);
          loadedPunches = JSON.parse(punchesSetting.value);
        } else {
          const savedPunches = localStorage.getItem('kts_biometric_punches');
          if (savedPunches) loadedPunches = JSON.parse(savedPunches);
        }

        setManualAttendance(loadedAttendance);
        setLocalPunches(loadedPunches);
      })
      .catch((err) => {
        console.error('Error syncing data from DB in StaffAttendance:', err);
        // Fallback to localStorage if API fails
        const savedAtt = localStorage.getItem('kts_staff_attendance');
        const parsedAtt = savedAtt && JSON.parse(savedAtt);
        if (parsedAtt) setManualAttendance(parsedAtt);
        
        const savedPunches = localStorage.getItem('kts_biometric_punches');
        const parsedPunches = savedPunches && JSON.parse(savedPunches);
        if (parsedPunches) setLocalPunches(parsedPunches);
      });
  }, []);

  // Listen to cross-tab updates to kts_staff_members, kts_staff_attendance, kts_biometric_punches, kts_staff_attendance_mode, kts_holidays, biometric_machine_status_cutoff
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'kts_staff_attendance') {
          setManualAttendance(JSON.parse(e.newValue));
        } else if (e.key === 'kts_biometric_punches') {
          setLocalPunches(JSON.parse(e.newValue));
        } else if (e.key === 'kts_staff_attendance_mode') {
          setAttendanceMode(e.newValue as 'biometric' | 'manual');
        } else if (e.key === 'kts_holidays') {
          setHolidays(JSON.parse(e.newValue));
        } else if (e.key === 'biometric_machine_status_cutoff') {
          setBiometricMachineCutoff(e.newValue);
        }
      } catch (err) {
        console.error('Error parsing storage change in StaffAttendance:', err);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  // Fetch logs from the local biometric_logs table (which gets instant webhook data)
  const fetchLocalBiometricLogs = useCallback(() => {
    api.getResources('biometric-logs', { date })
      .then((res) => {
        const extractArray = (res: any) => Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : (res?.data?.data && Array.isArray(res.data.data) ? res.data.data : []));
        const logs = extractArray(res);
         
        if (Array.isArray(logs) && logs.length > 0) {
          const mapped: BiometricRecord[] = logs.map((l: any) => {
            const scanTime = l.scan_datetime ? scanDateTimeToParts(l.scan_datetime).time : undefined;
            const scanType = String(l.scan_type || '').toLowerCase();
            const dateStr = l.scan_datetime ? parsePunchDate(l.scan_datetime) : undefined;
            return {
              Empcode: l.employee_code || l.Empcode || '',
              Name: l.raw_data?.name || l.raw_data?.Name || l.raw_data?.EmpName || '',
              PunchDate: (dateStr && scanTime) ? `${dateStr} ${scanTime}:00` : l.scan_datetime,
              INTime: l.raw_data?.in_time || l.raw_data?.INTime || (scanType === 'in' ? scanTime : undefined),
              OUTTime: l.raw_data?.out_time || l.raw_data?.OUTTime || (scanType === 'out' ? scanTime : undefined),
              WorkTime: l.raw_data?.work_time,
              Status: l.raw_data?.status,
              DateString: dateStr,
            };
          });

          // Merge with existing biometricRecords to avoid overwriting or losing records
          setBiometricRecords((prev) => {
            const map = new Map<string, BiometricRecord>();

            // Add previous ones
            prev.forEach((r) => {
              const key = `${r.Empcode}-${r.PunchDate || r.INTime || r.OUTTime}`;
              map.set(key, r);
            });

            // Add/overwrite with newly fetched local logs
            mapped.forEach((r) => {
              const key = `${r.Empcode}-${r.PunchDate || r.INTime || r.OUTTime}`;
              map.set(key, r);
            });

            return Array.from(map.values());
          });
        }
      })
      .catch((err) => {
        console.error('Error fetching local biometric logs:', err);
      });
  }, [date]);

  // Check biometric status & connectivity (physical device internet status)
  const checkBiometricStatus = useCallback(async (silent = false) => {
    if (!navigator.onLine) {
      setConnectionStatus('disconnected');
      setAttendanceMode('manual');
      if (!silent) setLastSyncMsg('✗ No internet connection. Operating in Manual Mode.');
      return false;
    }

    try {
      const res = await api.biometricStatus(true);
      // The physical biometric device is connected when the API is configured and reachable
      const isDeviceConnected = Boolean(
        res?.configured &&
        res?.connected &&
        res?.device_online !== false
      );

      if (isDeviceConnected) {
        setConnectionStatus('connected');
        setAttendanceMode('biometric');
        if (res.last_sync || res.last_punch_time) {
          const d = new Date(res.last_sync || res.last_punch_time);
          if (!isNaN(d.getTime())) {
            setLastSyncTime(d.toLocaleTimeString());
          } else if (res.last_punch_time) {
            setLastSyncTime(res.last_punch_time);
          }
        }
        return true;
      } else {
        setConnectionStatus('disconnected');
        setAttendanceMode('manual');
        if (!silent) {
          setLastSyncMsg(
            res?.connection_message
              ? `⚠ Biometric device: ${res.connection_message}`
              : '⚠ Biometric physical device is offline (not connected to internet). Manual mode active.'
          );
        }
        return false;
      }
    } catch {
      setConnectionStatus('disconnected');
      setAttendanceMode('manual');
      return false;
    }
  }, []);

  // Sync biometric IN/OUT data for the selected date from the real API
  const syncBiometric = useCallback((silent = false) => {
    if (syncInProgress.current) return;
    if (!navigator.onLine) {
      setConnectionStatus('disconnected');
      setAttendanceMode('manual');
      if (!silent) setLastSyncMsg('✗ No internet connection. Operating in Manual Mode.');
      return;
    }

    syncInProgress.current = true;
    setIsSyncing(true);
    if (!silent) setLastSyncMsg(null);

    api.biometricSyncInOut(date, date, 'ALL')
      .then((result) => {
        if (result?.success) {
          const records: BiometricRecord[] = result?.data || [];
          const realPunchRecords = records.filter(hasRealPunchData);

          if (records.length > 0) {
            // Merge with existing biometricRecords to keep webhook punches
            setBiometricRecords((prev) => {
              const map = new Map<string, BiometricRecord>();
              prev.forEach((r) => {
                const key = `${r.Empcode}-${r.PunchDate || r.INTime || r.OUTTime}`;
                map.set(key, r);
              });
              records.forEach((r) => {
                const key = `${r.Empcode}-${r.PunchDate || r.INTime || r.OUTTime}`;
                map.set(key, r);
              });
              return Array.from(map.values());
            });

            // Convert biometric records to LocalPunch format for saving
            const newPunches: LocalPunch[] = [];

            staffList.forEach((staff) => {
              const staffBioRecords = records.filter((record) => matchesStaffOnDate(record, staff, date));
              newPunches.push(...buildPunchesFromBioRecords(staffBioRecords, staff, date, `-${date}`));
            });

            // Update localPunches (filter out previous punches for this date)
            setLocalPunches((prev) => {
              const otherDatePunches = prev.filter((p) => !p.timestamp.startsWith(date));
              return [...otherDatePunches, ...newPunches];
            });

            const now = new Date().toLocaleTimeString();
            setLastSyncTime(now);

            // Physical device online status is determined by real punches transmitted on today's date
            if (isToday) {
              if (realPunchRecords.length > 0) {
                setConnectionStatus('connected');
                setAttendanceMode('biometric');
                if (!silent) {
                  setLastSyncMsg(`✓ Synced ${realPunchRecords.length} punch records from biometric device at ${now}`);
                }
              } else {
                // 0 real punches transmitted from physical device today -> offline
                setConnectionStatus('disconnected');
                setAttendanceMode('manual');
                if (!silent) {
                  setLastSyncMsg('⚠ Biometric device is offline (no punch transmission received today). Manual mode active.');
                }
              }
            } else {
              if (!silent) {
                setLastSyncMsg(`✓ Loaded ${realPunchRecords.length} punch records for ${date}`);
              }
            }
          } else {
            // 0 records received from physical device
            if (isToday) {
              setConnectionStatus('disconnected');
              setAttendanceMode('manual');
              if (!silent) {
                setLastSyncMsg('⚠ No biometric punch data received from physical device. Manual mode active.');
              }
            }
          }
        } else {
          // Sync failed or device not reachable -> offline
          if (isToday) {
            setConnectionStatus('disconnected');
            setAttendanceMode('manual');
          }
          if (!silent) {
            setLastSyncMsg(
              result?.message?.includes('not configured')
                ? '⚠ Biometric credentials not set. Configure them in Settings → Biometric Integration.'
                : '⚠ Biometric physical device is offline (not connected to internet). Manual mode active.'
            );
          }
          fetchLocalBiometricLogs();
        }
      })
      .catch((err: any) => {
        if (isToday) {
          setConnectionStatus('disconnected');
          setAttendanceMode('manual');
        }
        const errStr = String(err?.message || err || '');
        const isTimeout = errStr.includes('ERR_CONNECTION_TIMED_OUT') || errStr.includes('timed out') || errStr.includes('Unable to connect');
        if (!silent) {
          setLastSyncMsg(
            isTimeout
              ? '✗ Server connection timed out (ERR_CONNECTION_TIMED_OUT). Biometric device is offline.'
              : '✗ Biometric device is offline (not connected to internet). Operating in Manual Mode.'
          );
        }
        fetchLocalBiometricLogs();
      })
      .finally(() => {
        syncInProgress.current = false;
        setIsSyncing(false);
      });
  }, [date, staffList, fetchLocalBiometricLogs, isToday]);

  // Sync biometric raw punch logs (DownloadPunchData) every second during school hours
  const syncBiometricPunches = useCallback((silent = false) => {
    if (syncPunchesInProgress.current) return;
    if (!navigator.onLine) {
      setConnectionStatus('disconnected');
      setAttendanceMode('manual');
      return;
    }

    syncPunchesInProgress.current = true;
    setIsSyncingPunches(true);

    api.biometricSyncPunch(date, date, 'ALL')
      .then((result) => {
        if (result?.success) {
          fetchLocalBiometricLogs();
          const punchCount = Array.isArray(result?.data) ? result.data.length : (result?.saved || 0);
          if (isToday) {
            if (punchCount > 0) {
              setConnectionStatus('connected');
              setAttendanceMode('biometric');
            } else {
              setConnectionStatus('disconnected');
              setAttendanceMode('manual');
            }
          }
        } else {
          if (isToday) {
            setConnectionStatus('disconnected');
            setAttendanceMode('manual');
          }
        }
      })
      .catch((err) => {
        if (isToday) {
          setConnectionStatus('disconnected');
          setAttendanceMode('manual');
        }
        const errStr = String(err?.message || err || '');
        const isExpectedOfflineErr =
          errStr.includes('Biometric credentials not configured') ||
          errStr.includes('ERR_CONNECTION_TIMED_OUT') ||
          errStr.includes('timed out') ||
          errStr.includes('Unable to connect') ||
          errStr.includes('Failed to fetch');

        if (!isExpectedOfflineErr) {
          console.error('Error syncing biometric raw punches:', err);
        }
      })
      .finally(() => {
        syncPunchesInProgress.current = false;
        setIsSyncingPunches(false);
      });
  }, [date, fetchLocalBiometricLogs, isToday]);

  // Ref to hold the latest function reference for the 1s local-DB poll below
  const fetchLocalBiometricLogsRef = useRef(fetchLocalBiometricLogs);

  useEffect(() => {
    fetchLocalBiometricLogsRef.current = fetchLocalBiometricLogs;
  }, [fetchLocalBiometricLogs]);

  // Monitor browser network online/offline state
  useEffect(() => {
    const handleOnline = () => {
      checkBiometricStatus();
      syncBiometricPunches(true);
      syncBiometric(true);
    };
    const handleOffline = () => {
      setConnectionStatus('disconnected');
      setAttendanceMode('manual');
    };

    if (!navigator.onLine) {
      setConnectionStatus('disconnected');
      setAttendanceMode('manual');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkBiometricStatus, syncBiometric, syncBiometricPunches]);

  // Check biometric status on mount and periodic 45s heartbeat poll
  useEffect(() => {
    if (!navigator.onLine) {
      setConnectionStatus('disconnected');
      setAttendanceMode('manual');
      return;
    }

    setConnectionStatus('testing');
    checkBiometricStatus(true).then((isLive) => {
      if (isLive) {
        // Silently sync yesterday's biometric data to ensure it is stored in the database
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        api.biometricSyncPunch(yesterdayStr, yesterdayStr, 'ALL').catch(() => {});
        api.biometricSyncInOut(yesterdayStr, yesterdayStr, 'ALL').catch(() => {});

        syncBiometricPunches(true);
        syncBiometric(true);
      } else {
        setConnectionStatus('disconnected');
        setAttendanceMode('manual');
        fetchLocalBiometricLogs();
      }
    });

    // Method 1: Periodic 45s Cloud Heartbeat Check (Irrespective of punches)
    const heartbeatInterval = setInterval(() => {
      if (navigator.onLine) {
        checkBiometricStatus(true);
      }
    }, 45000);

    return () => clearInterval(heartbeatInterval);
  }, [checkBiometricStatus, syncBiometric, syncBiometricPunches, fetchLocalBiometricLogs]);

  // Auto-sync when date changes
  useEffect(() => {
    setBiometricRecords([]); // Clear old records
    
    const todayStr = getLocalDateStr();
    const isPreviousDate = date < todayStr;
    
    if (isPreviousDate) {
      setIsSyncing(true);
      setLastSyncMsg('Loading biometric logs from local database...');
      api.getResources('biometric-logs', { date })
        .then((res) => {
          const extractArray = (res: any) => Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : (res?.data?.data && Array.isArray(res.data.data) ? res.data.data : []));
          const logs = extractArray(res);
          if (Array.isArray(logs) && logs.length > 0) {
            const mapped: BiometricRecord[] = logs.map((l: any) => {
              const scanTime = l.scan_datetime ? scanDateTimeToParts(l.scan_datetime).time : undefined;
              const scanType = String(l.scan_type || '').toLowerCase();
              const dateStr = l.scan_datetime ? parsePunchDate(l.scan_datetime) : undefined;
              return {
                Empcode: l.employee_code || l.Empcode || '',
                Name: l.raw_data?.name || l.raw_data?.Name || l.raw_data?.EmpName || '',
                PunchDate: (dateStr && scanTime) ? `${dateStr} ${scanTime}:00` : l.scan_datetime,
                INTime: l.raw_data?.in_time || l.raw_data?.INTime || (scanType === 'in' ? scanTime : undefined),
                OUTTime: l.raw_data?.out_time || l.raw_data?.OUTTime || (scanType === 'out' ? scanTime : undefined),
                WorkTime: l.raw_data?.work_time,
                Status: l.raw_data?.status,
                DateString: dateStr,
              };
            });

            setBiometricRecords(mapped);

            // Convert biometric records to LocalPunch format for saving
            const newPunches: LocalPunch[] = [];
            staffList.forEach((staff) => {
              const staffBioRecords = mapped.filter((record) => matchesStaffOnDate(record, staff, date));
              newPunches.push(...buildPunchesFromBioRecords(staffBioRecords, staff, date, `-${date}`));
            });

            // Update localPunches (filter out previous punches for this date)
            setLocalPunches((prev) => {
              const otherDatePunches = prev.filter((p) => !p.timestamp.startsWith(date));
              return [...otherDatePunches, ...newPunches];
            });

            setLastSyncMsg(`✓ Loaded ${mapped.length} records from database`);
            setIsSyncing(false);
          } else {
            // No data in DB, fall back to API
            setLastSyncMsg('Local data missing. Syncing from e-TimeOffice API...');
            syncBiometricPunches(true);
            syncBiometric(true);
          }
        })
        .catch((err) => {
          console.error('Error fetching logs from DB, falling back to API:', err);
          setLastSyncMsg('Database fetch failed. Syncing from e-TimeOffice API...');
          syncBiometricPunches(true);
          syncBiometric(true);
        });
    } else {
      // For today, sync from API
      syncBiometricPunches(true);
      syncBiometric(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, staffList]);

  // Local DB polling interval (every 5 seconds)
  useEffect(() => {
    fetchLocalBiometricLogsRef.current();

    const timerId = setInterval(() => {
      fetchLocalBiometricLogsRef.current();
    }, 5000);

    return () => clearInterval(timerId);
  }, []);

  // Live auto-sync intervals (every 10 seconds during active hours, else every 15 minutes)
  useAdaptiveInterval(syncBiometricPunches);
  useAdaptiveInterval(syncBiometric);

  // Trigger sync immediately when window/tab receives focus
  useEffect(() => {
    const handleFocus = () => {
      syncBiometricPunches(true);
      syncBiometric(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [syncBiometric, syncBiometricPunches]);

  const saveSettingToDb = async (key: string, value: string) => {
    try {
      const settings = await api.getResources('settings');
      const settingsArray = Array.isArray(settings) ? settings : (settings?.data && Array.isArray(settings.data) ? settings.data : []);
      const setting = settingsArray.find((s: any) => s.key === key);
      if (setting && setting.id) {
        return await api.updateResource('settings', setting.id, { key, value });
      } else {
        return await api.createResource('settings', { key, value, group: 'staff' });
      }
    } catch (err) {
      console.error(`Error saving setting ${key} to DB:`, err);
    }
  };

  // Persistence hooks
  useEffect(() => {
    localStorage.setItem('kts_staff_attendance', JSON.stringify(manualAttendance));
    saveSettingToDb('kts_staff_attendance', JSON.stringify(manualAttendance));
  }, [manualAttendance]);

  // Automatically switch mode based on conditions:
  // - If device is disconnected: manual mode is active.
  // - If today cutoff reached with 0 punches: auto-enable manual mode.
  // - If past date with 0 punches: auto-enable manual mode.
  // - If online and punches exist or before cutoff on today: biometric mode active.
  useEffect(() => {
    if (isHoliday) return;

    if (connectionStatus === 'disconnected') {
      if (attendanceMode !== 'manual') {
        setAttendanceMode('manual');
      }
    } else if (isCutoffExceededToday) {
      if (attendanceMode !== 'manual') {
        setAttendanceMode('manual');
      }
    } else if (isPastDate && isPastDateWithoutPunches) {
      if (attendanceMode !== 'manual') {
        setAttendanceMode('manual');
      }
    } else if (connectionStatus === 'connected' && !isPastDate && !isCutoffExceededToday) {
      if (attendanceMode !== 'biometric') {
        setAttendanceMode('biometric');
      }
    }
  }, [connectionStatus, isCutoffExceededToday, isPastDate, isPastDateWithoutPunches, isHoliday, attendanceMode]);

  useEffect(() => {
    localStorage.setItem('kts_biometric_punches', JSON.stringify(localPunches));
    saveSettingToDb('kts_biometric_punches', JSON.stringify(localPunches));
  }, [localPunches]);

  useEffect(() => {
    localStorage.setItem('kts_staff_attendance_mode', attendanceMode);
  }, [attendanceMode]);

  // Extract unique categories for filtering
  const allCategories = Array.from(new Set(staffList.map((s) => s.category || 'Teaching')));

  // Fetch leaves directly from API on mount and when date changes
  const fetchLeaves = useCallback(async () => {
    try {
      const res = await api.getResources('leaves');
      const leavesArray = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
      const mapped = leavesArray.map((l: any) => ({
        id: String(l.id),
        staffId: String(l.user_id || l.staff_id || l.faculty_id || ''),
        staffName: l.staff_name || '',
        from: l.start_date || l.from || '',
        to: l.end_date || l.to || l.start_date || l.from || '',
        status: (l.status || 'Pending').toString(),
        type: typeof l.leave_type === 'object' && l.leave_type ? l.leave_type.name : (l.leave_type || 'Leave'),
      }));
      setLeavesList(mapped);
    } catch (e) {
      console.error('Failed to fetch leaves in StaffAttendance:', e);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves, date]);

  const allLeaves = useMemo(() => {
    const combined = [...leaveRequests];
    leavesList.forEach((l) => {
      if (!combined.some((c) => String(c.id) === String(l.id))) {
        combined.push(l);
      }
    });
    return combined;
  }, [leaveRequests, leavesList]);

  // Check if a staff member has an approved leave for a given date
  const isStaffOnLeave = useCallback((staff: StaffMember, checkDate: string): boolean => {
    const staffIdStr = String(staff.id).trim().toLowerCase();
    const staffUserIdStr = String((staff as any).user_id || '').trim().toLowerCase();
    const staffEmpCodeStr = String(staff.biometric_employee_code || (staff as any).employee_code || '').trim().toLowerCase();
    const staffNameStr = String(staff.name || '').trim().toLowerCase();

    return allLeaves.some((l) => {
      const lStatus = String(l.status || '').trim().toLowerCase();
      if (lStatus !== 'approved') return false;

      const lFrom = String(l.from || l.start_date || '').slice(0, 10);
      const lTo = String(l.to || l.end_date || lFrom).slice(0, 10);
      if (checkDate < lFrom || checkDate > lTo) return false;

      const lStaffId = String(l.staffId || l.user_id || l.staff_id || '').trim().toLowerCase();
      const lStaffName = String(l.staffName || '').trim().toLowerCase();

      const matchId = lStaffId && (lStaffId === staffIdStr || lStaffId === staffUserIdStr || (staffEmpCodeStr && lStaffId === staffEmpCodeStr));
      const matchName = lStaffName && staffNameStr && (lStaffName === staffNameStr || lStaffName.includes(staffNameStr) || staffNameStr.includes(lStaffName));

      return matchId || matchName;
    });
  }, [allLeaves]);

  // Find biometric record(s) for a given staff member on the selected date
  const getBiometricRecordsForStaff = (staff: StaffMember): BiometricRecord[] => {
    return biometricRecords.filter((record) => matchesStaffOnDate(record, staff, date));
  };

  // Helper to count all punches (biometric API + local simulation)
  const getPunchesForStaffOnDate = (staff: StaffMember) => {
    if (attendanceMode === 'manual') {
      const manualStatus = manualAttendance[date]?.[staff.id];
      if (manualStatus === 'Present' || (!manualStatus && !isStaffOnLeave(staff, date))) {
        return [
          { id: 'm1', staffId: staff.id, timestamp: `${date} 09:00:00` },
          { id: 'm2', staffId: staff.id, timestamp: `${date} 17:00:00` },
        ];
      }
      if (manualStatus === 'Half Day') {
        return [{ id: 'm1', staffId: staff.id, timestamp: `${date} 09:00:00` }];
      }
      return [];
    }

    // Local simulation punches
    const localCount = localPunches.filter(
      (p) => p.staffId === staff.id && p.timestamp.startsWith(date)
    );

    // Real biometric records
    const apiRecords = getBiometricRecordsForStaff(staff);
    const apiCount = buildPunchesFromBioRecords(apiRecords, staff, date, '');

    return [...localCount, ...apiCount];
  };

  const getStatus = (staff: StaffMember): AttendanceStatus => {
    const manualStatus = manualAttendance[date]?.[staff.id];

    // If manual status override exists, respect it (keeps controls working!)
    if (manualStatus) {
      return manualStatus;
    }

    // In BOTH biometric mode and manual mode:
    // Check if there is an approved leave request for this staff member on the selected date
    if (isStaffOnLeave(staff, date)) {
      return 'Leave';
    }

    if (attendanceMode === 'manual') {
      return 'Present'; // Default to Present in manual mode if not on approved leave
    }

    // Biometric Mode
    // Calculate check-in and check-out based on windows
    const punchesList = getPunchesForStaffOnDate(staff);
    const todayPunches = punchesList.filter((p) => p.timestamp.startsWith(date));
    // Sort punches by time
    todayPunches.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    let hasCheckIn = false;
    let hasCheckOut = false;

    if (todayPunches.length > 0) {
      const firstPunchTime = extractTimeOfDay(todayPunches[0].timestamp);
      const lastPunchTime = extractTimeOfDay(todayPunches[todayPunches.length - 1].timestamp);

      // Check-in: first punch must be before or during the late entry window
      if (firstPunchTime <= (lateEntryCutoff + ':59')) {
        hasCheckIn = true;
      }
      // Check-out: last punch must be after the early checkout window starts
      if (lastPunchTime >= (earlyEntryCutoff + ':00')) {
        hasCheckOut = true;
      }

      // If they punched but didn't meet strict criteria, give half day at least, unless they have both
      if (!hasCheckIn && !hasCheckOut) {
        if (todayPunches.length >= 2) {
          hasCheckIn = true;
          hasCheckOut = true;
        } else {
          hasCheckIn = true; // Half Day
        }
      }
    }

    if (hasCheckIn && hasCheckOut) return 'Present';
    if (hasCheckIn || hasCheckOut) return 'Half Day';
    return 'Absent';
  };

  const setManualStatus = (staffId: string, status: AttendanceStatus) => {
    setManualAttendance((prev) => {
      const dateRecords = prev[date] ? { ...prev[date] } : {};
      if (dateRecords[staffId] === status) {
        delete dateRecords[staffId];
      } else {
        dateRecords[staffId] = status;
      }
      return { ...prev, [date]: dateRecords };
    });
  };

  // Save manual attendance to database
  const handleSaveManualAttendance = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      // 1. Build complete day's attendance snapshot for all staff
      const dayRecords: Record<string, AttendanceStatus> = {};
      staffList.forEach((staff) => {
        dayRecords[staff.id] = getStatus(staff);
      });

      const updatedManualAttendance = {
        ...manualAttendance,
        [date]: dayRecords,
      };

      // 2. Save to local state and localStorage
      setManualAttendance(updatedManualAttendance);
      localStorage.setItem('kts_staff_attendance', JSON.stringify(updatedManualAttendance));

      // 3. Save to database settings table (kts_staff_attendance)
      await saveSettingToDb('kts_staff_attendance', JSON.stringify(updatedManualAttendance));

      // 4. Save/update each staff's record in backend attendances resource
      const savePromises = staffList.map(async (staff) => {
        const staffStatus = dayRecords[staff.id];
        const payload = {
          faculty_id: staff.id,
          attendance_date: date,
          status: staffStatus,
          device_id: 'manual',
          notes: `Staff attendance marked manually on ${date}`,
        };

        try {
          const existing = await api.getResources('attendance', {
            faculty_id: staff.id,
            attendance_date: date,
          }).catch(() => []);

          const existingArr = Array.isArray(existing) ? existing : (existing?.data || []);
          if (existingArr.length > 0 && existingArr[0]?.id) {
            await api.updateResource('attendance', existingArr[0].id, payload);
          } else {
            await api.createResource('attendance', payload);
          }
        } catch {
          // Settings table serves as primary reliable backup
        }
      });

      await Promise.allSettled(savePromises);

      setSaveSuccessMsg(`✓ Attendance for ${formatDate(date)} saved to database successfully!`);
      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      console.error('Error saving manual attendance to database:', err);
      setSaveSuccessMsg('⚠ Error saving attendance to database. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Add a test simulated biometric punch
  const addSimulatedPunch = (staffId: string) => {
    const now = new Date();
    const defaultTime = now.toTimeString().split(' ')[0].substring(0, 5);
    const timeStr = window.prompt("Enter punch time (HH:MM) in 24hr format:", defaultTime);
    if (!timeStr) return; // User cancelled

    const newPunch: LocalPunch = {
      id: 'punch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      staffId,
      timestamp: `${date} ${timeStr}:00`,
    };
    setLocalPunches((prev) => [...prev, newPunch]);
  };

  // Reset local simulation punches for the selected date
  const clearSimulatedPunches = async () => {
    if (await confirm('Clear all local simulated punches for this date?', 'Clear Punches', true)) {
      setLocalPunches((prev) => prev.filter((p) => !p.timestamp.startsWith(date)));
    }
  };

  // Filter staff list
  const filteredStaff = staffList.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.designation.toLowerCase().includes(search.toLowerCase()) ||
      (s.department || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'All' || (s.category || 'Teaching') === categoryFilter;
    return matchSearch && matchCategory;
  });

  // KPI metrics
  const totalStaff = staffList.length;
  const presentCount = staffList.filter((s) => getStatus(s) === 'Present').length;
  const absentCount  = staffList.filter((s) => getStatus(s) === 'Absent').length;
  const halfDayCount = staffList.filter((s) => getStatus(s) === 'Half Day').length;
  const leaveCount   = staffList.filter((s) => getStatus(s) === 'Leave').length;

  const ConnectionDot = () => (
    <span
      className="flex items-center gap-1.5"
      title={
        connectionStatus === 'connected'
          ? 'e-TimeOffice physical biometric machine is online and connected to internet'
          : 'e-TimeOffice physical biometric machine is offline (not connected to internet)'
      }
    >
      {connectionStatus === 'connected' ? (
        <>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
            <Wifi size={10} /> Biometric Device Online
          </span>
        </>
      ) : connectionStatus === 'disconnected' ? (
        <>
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <span className="text-[10px] text-red-500 font-bold flex items-center gap-0.5">
            <WifiOff size={10} /> Biometric Device Offline
          </span>
        </>
      ) : connectionStatus === 'testing' ? (
        <>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
          <span className="text-[10px] text-amber-600 font-medium">Checking Device…</span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-[var(--tx3)]/40 inline-block" />
          <span className="text-[10px] text-[var(--tx3)] font-medium">Unknown</span>
        </>
      )}
    </span>
  );

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mb-3">
        <KPICard
          label="Total Staff"
          value={totalStaff}
          sub="Active directory"
          icon={<UserCheck size={15} />}
          iconBg="var(--blue-bg)"
          iconColor="var(--blue-tx)"
        />
        <KPICard
          label="Present"
          value={presentCount}
          sub={`${totalStaff ? Math.round((presentCount / totalStaff) * 100) : 0}% Present`}
          icon={<UserCheck size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
        />
        <KPICard
          label="Absent"
          value={absentCount}
          sub="Needs review"
          icon={<UserX size={15} />}
          iconBg="var(--red-bg)"
          iconColor="var(--red-tx)"
        />
        <KPICard
          label="Half Day"
          value={halfDayCount}
          sub="Single punch count"
          icon={<Clock size={15} />}
          iconBg="var(--amber-bg)"
          iconColor="var(--amber-tx)"
        />
        <KPICard
          label="Leave"
          value={leaveCount}
          sub="Approved leave list"
          icon={<AlertCircle size={15} />}
          iconBg="var(--purple-bg)"
          iconColor="var(--purple-tx)"
        />
      </div>

      <Card>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 border-b border-[var(--b)] pb-4">
          <div>
            <div className="text-[13.5px] font-bold text-[var(--tx)]">Staff Daily Attendance</div>
            <div className="text-[11px] text-[var(--tx3)] flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Fingerprint size={12} className="text-[var(--blue-tx)]" />
                e-TimeOffice Biometric Machine
              </span>
              <span>•</span>
              <ConnectionDot />
              {lastSyncTime && <span className="text-[var(--tx3)] font-mono text-[10.5px]">· Last sync: {lastSyncTime}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-1.5">
              <span className="text-[10.5px] font-semibold text-[var(--tx2)] flex items-center gap-1 px-1">
                <Fingerprint size={12} className="text-[var(--blue-tx)]" /> Mode:
              </span>
              <button
                type="button"
                onClick={() => {
                  setAttendanceMode('biometric');
                  syncBiometricPunches(false);
                  syncBiometric(false);
                }}
                disabled={connectionStatus === 'disconnected' || isHoliday}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  connectionStatus === 'disconnected' || isHoliday
                    ? 'opacity-40 cursor-not-allowed text-[var(--tx3)]'
                    : 'cursor-pointer hover:text-[var(--tx2)]'
                } ${
                  attendanceMode === 'biometric'
                    ? 'bg-[var(--blue)] text-white'
                    : 'text-[var(--tx3)]'
                }`}
                title={
                  isHoliday
                    ? `Holiday: ${holidayTitle}`
                    : connectionStatus === 'disconnected'
                    ? "Biometric is offline (not connected to internet)"
                    : "Biometric mode"
                }
              >
                Biometric
              </button>
              <button
                type="button"
                onClick={() => setAttendanceMode('manual')}
                disabled={isHoliday}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  isHoliday
                    ? 'opacity-40 cursor-not-allowed text-[var(--tx3)]'
                    : 'cursor-pointer hover:text-[var(--tx2)]'
                } ${
                  attendanceMode === 'manual'
                    ? 'bg-[var(--amber-bg)] text-[var(--amber-tx)] border border-[var(--amber-tx)]/20'
                    : 'text-[var(--tx3)]'
                }`}
                title={
                  isHoliday
                    ? `Holiday: ${holidayTitle}`
                    : isCutoffExceededToday
                    ? `Biometric cutoff reached (${biometricMachineCutoff}) with no punch data. Manual mode enabled.`
                    : isPastDateWithoutPunches
                    ? "No biometric punches for previous date. Manual mode enabled."
                    : "Manual attendance mode"
                }
              >
                Manual
              </button>
            </div>

            {attendanceMode === 'manual' && !isHoliday && (
              <button
                type="button"
                onClick={handleSaveManualAttendance}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                title="Save attendance directly to database"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    Saving to DB…
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    Save Attendance
                  </>
                )}
              </button>
            )}

            {attendanceMode === 'biometric' && !isHoliday && (
              <button
                type="button"
                onClick={() => {
                  syncBiometricPunches(false);
                  syncBiometric(false);
                }}
                disabled={isSyncing || isSyncingPunches}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-[var(--blue)] text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw size={12} className={(isSyncing || isSyncingPunches) ? 'animate-spin' : ''} />
                {(isSyncing || isSyncingPunches) ? 'Syncing…' : 'Sync Now'}
              </button>
            )}
          </div>
        </div>

        {/* Save success banner */}
        {saveSuccessMsg && (
          <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11.5px] font-medium rounded-xl mb-4">
            <CheckCircle size={15} className="shrink-0 text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Filters and Custom Date Picker */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
          <div className="flex items-center gap-2 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5">
            <Search size={13} className="text-[var(--tx3)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff by name, department..."
              className="flex-1 bg-transparent text-[12px] text-[var(--tx)] placeholder:text-[var(--tx3)] outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-1.5 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
          >
            <option value="All">All Categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Color-coded Holiday Date Picker with Future Dates Disabled */}
          <StaffAttendanceDatePicker
            value={date}
            onChange={(newDate) => setDate(newDate)}
            holidays={holidays}
            maxDate={todayStr}
          />
        </div>

        {/* Mode banner */}
        {isHoliday ? (
          <div className="flex items-center justify-between p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-4 text-purple-700 dark:text-purple-300">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="text-purple-600 shrink-0" />
              <div>
                <div className="text-[12px] font-bold">Holiday / Non-Working Day: {holidayTitle}</div>
                <div className="text-[11px] opacity-85">
                  {holidayOnDate?.description || 'School holiday / Sunday. Attendance marking is disabled for this date.'}
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[10.5px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-lg shrink-0">
              Holiday
            </span>
          </div>
        ) : isCutoffExceededToday ? (
          <div className="flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl mb-4 text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Clock size={16} className="text-amber-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-[12px] font-bold">Biometric Machine Status Cutoff Reached ({biometricMachineCutoff})</div>
                <div className="text-[11px] opacity-85">
                  No punch data received from the biometric device up to {biometricMachineCutoff}. Manual Mode is enabled for admin to allot staff attendance. Click <strong>Save Attendance</strong> to commit changes directly to the database.
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[10.5px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg shrink-0 ml-3">
              Cutoff Failover Active
            </span>
          </div>
        ) : isPastDateWithoutPunches ? (
          <div className="flex items-center justify-between p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4 text-blue-800 dark:text-blue-300">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Calendar size={16} className="text-blue-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-[12px] font-bold">Previous Date Manual Entry ({formatDate(date)})</div>
                <div className="text-[11px] opacity-85">
                  No biometric punch data found for this past date. Manual entry is enabled so admin can mark attendance for previous dates. Click <strong>Save Attendance</strong> to save directly to the database.
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[10.5px] font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg shrink-0 ml-3">
              Past Date Manual
            </span>
          </div>
        ) : attendanceMode === 'manual' ? (
          <div className="flex items-center justify-between p-3.5 bg-[var(--surf2)] border border-[var(--b)] rounded-xl mb-4">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Fingerprint size={16} className="text-[var(--amber-tx)] shrink-0" />
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-[var(--tx)]">Manual Attendance Mode Active</div>
                <div className="text-[11px] text-[var(--tx3)]">
                  Admin can mark staff attendance manually. Click <strong>Save Attendance</strong> to save changes directly to the database.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3.5 bg-[var(--surf2)] border border-[var(--b)] rounded-xl mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Fingerprint size={15} className="text-[var(--blue-tx)] shrink-0" />
              <span className="text-[11.5px] text-[var(--tx2)] leading-relaxed">
                <strong>Biometric Mode:</strong> Attendance driven by e-TimeOffice impressions for <strong>{formatDate(date)}</strong>.<br />
                <span className="text-[10px] text-[var(--tx3)]">Rules: 0 punches = Absent · 1 punch = Half Day · 2+ punches = Present.</span>
                {lastSyncMsg && (
                  <span className={`block mt-0.5 text-[10.5px] ${lastSyncMsg.startsWith('✓') ? 'text-emerald-600' : lastSyncMsg.startsWith('⚠') ? 'text-amber-600' : 'text-red-500'}`}>
                    {lastSyncMsg}
                  </span>
                )}
              </span>
            </div>
            {attendanceMode === 'biometric' && (
              <button
                onClick={clearSimulatedPunches}
                className="text-[10.5px] text-[var(--red-tx)] hover:underline cursor-pointer font-medium ml-3 shrink-0"
              >
                Clear Simulation Punches
              </button>
            )}
          </div>
        )}

        {/* Staff Attendance Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] min-w-[850px]">
            <thead>
              <tr className="border-b border-[var(--b)] text-[var(--tx3)]">
                {['Staff Member', 'Category & Department', 'Check-In', 'Check-Out', 'Working Hours', 'Status', 'Controls'].map((h) => (
                  <th
                    key={h}
                    className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-3 py-2 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s) => {
                const status        = getStatus(s);
                const onLeave       = isStaffOnLeave(s, date);
                const punchesList   = getPunchesForStaffOnDate(s);
                const bioRecords    = getBiometricRecordsForStaff(s);
                const bioRecord     = bioRecords[0]; // primary record
                // Determine raw check-in and check-out times (first and last punches of the day):
                let inTime: string | null = null;
                let outTime: string | null = null;
                let workTime: string | null = null;
                let isLate = false;
                let isEarly = false;

                const todayPunches = punchesList.filter((p) => p.timestamp.startsWith(date));
                if (todayPunches.length > 0) {
                  todayPunches.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
                  
                  // First punch is check-in
                  const earliest = extractTimeOfDay(todayPunches[0].timestamp);
                  inTime = earliest;

                  // Last punch (if different and more than one punch) is check-out
                  if (todayPunches.length > 1) {
                    const latest = extractTimeOfDay(todayPunches[todayPunches.length - 1].timestamp);
                    if (latest !== earliest) {
                      outTime = latest;
                    }
                  }
                } else {
                  // Fallbacks from bioRecord
                  if (bioRecord?.INTime && bioRecord.INTime !== '--:--') {
                    inTime = bioRecord.INTime;
                  }
                  if (bioRecord?.OUTTime && bioRecord.OUTTime !== '--:--' && !isOutTimePlaceholder(bioRecord.OUTTime, date)) {
                    outTime = bioRecord.OUTTime;
                  }
                }

                // Determine Lateness (if first punch is after Present Cutoff Morning)
                if (inTime) {
                  if (inTime > presentCutoffMorning) {
                    isLate = true;
                  }
                }

                // Determine Early Departure (if last punch is before Present Cutoff Evening)
                if (outTime) {
                  if (outTime < presentCutoffEvening) {
                    isEarly = true;
                  }
                }

                // Compute Working Hours based on first and last punch times
                if (inTime && outTime) {
                  const [inH, inM] = inTime.split(':').map(Number);
                  const [outH, outM] = outTime.split(':').map(Number);
                  const diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
                  if (diffMinutes > 0) {
                    const hours = Math.floor(diffMinutes / 60);
                    const minutes = diffMinutes % 60;
                    workTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                  } else {
                    workTime = '00:00';
                  }
                } else if (bioRecord?.WorkTime && bioRecord.WorkTime !== '00:00') {
                  workTime = bioRecord.WorkTime;
                }

                return (
                  <tr key={s.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)]/40 transition-colors last:border-0">
                    {/* Staff info */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          initials={s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          bg="var(--purple-bg)"
                          color="var(--purple-tx)"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[var(--tx)]">{s.name}</span>
                            {onLeave && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 text-[9px] font-bold border border-purple-500/20">
                                On Leave
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--tx3)]">{s.designation}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-3 py-2.5">
                      <span className="font-medium text-[var(--tx)]">{s.category || 'Teaching'}</span>
                      <div className="text-[10.5px] text-[var(--tx3)]">{s.department || 'N/A'}</div>
                    </td>

                    {/* Check-In */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {attendanceMode === 'biometric' ? (
                          <>
                            <span className={`font-semibold ${inTime ? 'text-emerald-700' : 'text-[var(--tx3)]/60'}`}>
                              {inTime || '—'}
                            </span>
                            {isLate && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[9px] font-bold">
                                Late
                              </span>
                            )}
                            {connectionStatus !== 'connected' && (
                              <button
                                type="button"
                                onClick={() => addSimulatedPunch(s.id)}
                                className="p-1 border border-[var(--b)] bg-[var(--surf2)] hover:border-[var(--blue)] hover:bg-[var(--blue-bg)] hover:text-[var(--blue-tx)] rounded text-[9.5px] font-semibold cursor-pointer transition-colors"
                                title="Simulate Check-In/Punch"
                              >
                                + Sim
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="font-medium text-[var(--tx2)]">
                            {status === 'Present' || status === 'Half Day' ? '09:00 AM' : '—'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Check-Out */}
                    <td className="px-3 py-2.5">
                      {attendanceMode === 'biometric' ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${outTime ? 'text-red-600' : 'text-[var(--tx3)]/60'}`}>
                            {outTime || '—'}
                          </span>
                          {isEarly && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[9px] font-bold">
                              Early
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-medium text-[var(--tx2)]">
                          {status === 'Present' ? '05:00 PM' : '—'}
                        </span>
                      )}
                    </td>

                    {/* Working Hours */}
                    <td className="px-3 py-2.5">
                      {attendanceMode === 'biometric' ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${workTime ? 'text-[var(--tx)]' : 'text-[var(--tx3)]/60'}`}>
                            {workTime || '—'}
                          </span>
                          {bioRecord?.OverTime && bioRecord.OverTime !== '00:00' && (
                            <span className="text-[9.5px] text-emerald-600 font-bold">
                              +OT {bioRecord.OverTime}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-semibold text-[var(--tx2)]">
                          {status === 'Present' ? '8.0 hrs' : status === 'Half Day' ? '4.0 hrs' : '—'}
                        </span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-3 py-2.5">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                        status === 'Present'
                          ? 'bg-teal-500/10 text-teal-600 border-teal-500/20'
                          : status === 'Absent'
                          ? 'bg-red-500/10 text-red-600 border-red-500/20'
                          : status === 'Half Day'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                      }`}>
                        {status}
                      </span>
                    </td>

                    {/* Controls */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {isHoliday ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold text-purple-600 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center gap-1">
                            <AlertCircle size={11} /> Holiday
                          </span>
                        ) : onLeave && status === 'Leave' ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold text-purple-600 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center gap-1">
                            <AlertCircle size={11} /> Approved Leave
                          </span>
                        ) : (
                          [
                            { value: 'Present', bg: 'hover:bg-teal-500/10 hover:text-teal-600', active: 'bg-teal-500/10 text-teal-600 border border-teal-500/20' },
                            { value: 'Absent',  bg: 'hover:bg-red-500/10 hover:text-red-600',  active: 'bg-red-500/10 text-red-600 border border-red-500/20' },
                            { value: 'Half Day', bg: 'hover:bg-amber-500/10 hover:text-amber-600', active: 'bg-amber-500/10 text-amber-600 border border-amber-500/20' },
                            { value: 'Leave',   bg: 'hover:bg-purple-500/10 hover:text-purple-600', active: 'bg-purple-500/10 text-purple-600 border border-purple-500/20' },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={!isManualAllowed}
                              onClick={() => setManualStatus(s.id, opt.value as AttendanceStatus)}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                                !isManualAllowed
                                  ? 'opacity-40 cursor-not-allowed'
                                  : 'cursor-pointer'
                              } ${
                                status === opt.value
                                  ? opt.active
                                  : `text-[var(--tx3)] border-[var(--b)] bg-transparent ${!isManualAllowed ? '' : opt.bg}`
                              }`}
                              title={
                                !isManualAllowed
                                  ? "Manual mode is disabled while biometric device is online"
                                  : `Set to ${opt.value}`
                              }
                            >
                              {opt.value}
                            </button>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[var(--tx3)]">
                    No staff members found matching search or filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
