import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { updateSettingsCache } from '../utils/storage';
import { PageLoader } from '../components/PageLoader';


export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  init: string;
  type: 'Sick Leave' | 'Casual Leave' | 'Emergency Leave' | 'Earned Leave';
  from: string;
  to: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
  adminNotes?: string;
}

export interface Notification {
  id: string;
  type: 'leave_request' | 'leave_approved' | 'leave_rejected';
  message: string;
  time: string;
  read: boolean;
  refId?: string;
}

export type TimetablePeriod = {
  subject: string;
  teacher: string;
  teacherId: string;
  room: string;
};

export type TimetableDay = {
  [periodIndex: number]: TimetablePeriod | null;
};

export type ClassTimetable = {
  [day: string]: TimetableDay;
};

export type SchoolTimetable = {
  [className: string]: ClassTimetable;
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = 8;

function buildDefaultTimetable(): SchoolTimetable {
  const classes = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'];
  const timetable: SchoolTimetable = {};
  for (const cls of classes) {
    timetable[cls] = {};
    for (const day of DAYS) {
      timetable[cls][day] = {};
      for (let p = 0; p < PERIODS; p++) {
        timetable[cls][day][p] = null;
      }
    }
  }

  const times8A: { day: string; period: number; subject: string; room: string }[] = [
    { day: 'Monday', period: 0, subject: 'Mathematics', room: 'Room 12' },
    { day: 'Monday', period: 1, subject: 'Science', room: 'Room 12' },
    { day: 'Monday', period: 2, subject: 'English', room: 'Room 12' },
    { day: 'Tuesday', period: 0, subject: 'Mathematics', room: 'Room 12' },
    { day: 'Tuesday', period: 1, subject: 'Telugu', room: 'Room 12' },
    { day: 'Wednesday', period: 0, subject: 'Mathematics', room: 'Room 12' },
    { day: 'Wednesday', period: 2, subject: 'Social', room: 'Room 12' },
    { day: 'Thursday', period: 0, subject: 'Mathematics', room: 'Room 12' },
    { day: 'Thursday', period: 1, subject: 'Science', room: 'Room 12' },
    { day: 'Friday', period: 0, subject: 'Mathematics', room: 'Room 12' },
    { day: 'Friday', period: 3, subject: 'English', room: 'Room 12' },
    { day: 'Saturday', period: 0, subject: 'Mathematics', room: 'Room 12' },
  ];
  for (const entry of times8A) {
    timetable['8A'][entry.day][entry.period] = {
      subject: entry.subject,
      teacher: 'Mrs. Lakshmi Devi',
      teacherId: '2',
      room: entry.room,
    };
  }

  const times8B: { day: string; period: number; subject: string; room: string }[] = [
    { day: 'Monday', period: 1, subject: 'Mathematics', room: 'Room 13' },
    { day: 'Tuesday', period: 2, subject: 'Mathematics', room: 'Room 13' },
    { day: 'Wednesday', period: 1, subject: 'Mathematics', room: 'Room 13' },
    { day: 'Thursday', period: 3, subject: 'Mathematics', room: 'Room 13' },
    { day: 'Friday', period: 1, subject: 'Mathematics', room: 'Room 13' },
  ];
  for (const entry of times8B) {
    timetable['8B'][entry.day][entry.period] = {
      subject: entry.subject,
      teacher: 'Mrs. Lakshmi Devi',
      teacherId: '2',
      room: entry.room,
    };
  }

  const times9A: { day: string; period: number; subject: string; room: string }[] = [
    { day: 'Monday', period: 2, subject: 'Mathematics', room: 'Room 15' },
    { day: 'Tuesday', period: 0, subject: 'Mathematics', room: 'Room 15' },
    { day: 'Wednesday', period: 3, subject: 'Mathematics', room: 'Room 15' },
    { day: 'Thursday', period: 0, subject: 'Mathematics', room: 'Room 15' },
    { day: 'Friday', period: 2, subject: 'Mathematics', room: 'Room 15' },
    { day: 'Saturday', period: 1, subject: 'Mathematics', room: 'Room 15' },
  ];
  for (const entry of times9A) {
    timetable['9A'][entry.day][entry.period] = {
      subject: entry.subject,
      teacher: 'Mrs. Lakshmi Devi',
      teacherId: '2',
      room: entry.room,
    };
  }

  return timetable;
}

export interface PeriodTiming {
  start: string;
  end: string;
  isBreak?: boolean;
  label?: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_TIMINGS: PeriodTiming[] = [
  { start: '8:00 AM', end: '9:00 AM' },
  { start: '9:00 AM', end: '10:00 AM' },
  { start: '10:00 AM', end: '11:00 AM' },
  { start: '11:00 AM', end: '11:15 AM', isBreak: true, label: 'Short Break' },
  { start: '11:15 AM', end: '12:15 PM' },
  { start: '12:15 PM', end: '1:15 PM' },
  { start: '1:15 PM', end: '2:00 PM', isBreak: true, label: 'Lunch Break' },
  { start: '2:00 PM', end: '3:00 PM' },
  { start: '3:00 PM', end: '4:00 PM' },
];

interface AppContextValue {
  leaveRequests: LeaveRequest[];
  notifications: Notification[];
  unreadCount: number;
  timetable: SchoolTimetable;
  periodTimings: PeriodTiming[];
  academicYears: { id: string; name: string; is_current: boolean }[];
  selectedAcademicYearId: string;
  setSelectedAcademicYearId: (id: string) => void;
  addLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'appliedOn'>) => Promise<void>;
  approveLeave: (id: string) => Promise<void>;
  rejectLeave: (id: string, notes?: string) => Promise<void>;
  markNotificationsRead: () => void;
  setTimetablePeriod: (className: string, day: string, periodIndex: number, period: TimetablePeriod | null) => void;
  savePeriodTimings: (newTimings: PeriodTiming[]) => Promise<void>;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (val: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const TIMETABLE_DAYS = DAYS;
// eslint-disable-next-line react-refresh/only-export-components
export const TIMETABLE_PERIODS = PERIODS;

// eslint-disable-next-line react-refresh/only-export-components
export const PERIOD_TIMES = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [timetable, setTimetable] = useState<SchoolTimetable>(buildDefaultTimetable);
  const [periodTimings, setPeriodTimings] = useState<PeriodTiming[]>(() => {
    const saved = localStorage.getItem('timetable_period_timings');
    return saved ? JSON.parse(saved) : DEFAULT_TIMINGS;
  });
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string; is_current: boolean }[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearIdState] = useState<string>(() => {
    return localStorage.getItem('selected_academic_year_id') || '';
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const setSelectedAcademicYearId = (id: string) => {
    setSelectedAcademicYearIdState(id);
    localStorage.setItem('selected_academic_year_id', id);
  };

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLeaveRequests([]);
      setNotifications([]);
      setTimetable(buildDefaultTimetable());
      setAcademicYears([]);
      setSettingsLoaded(true);
      return;
    }

    setSettingsLoaded(false);

    async function loadInitialData() {
      try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Load Academic Years
      try {
        const ays = await api.getResources('academic-years');
        if (ays && ays.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped = ays.map((ay: any) => ({
            id: String(ay.id),
            name: ay.name,
            is_current: !!ay.is_current,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }));
          setAcademicYears(mapped);
          
          const savedId = localStorage.getItem('selected_academic_year_id');
          if (!savedId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const current = mapped.find((ay: any) => ay.is_current) || mapped[0];
            setSelectedAcademicYearId(current.id);
          }
        }
      } catch (err) {
        console.error('Error loading academic years in AppContext:', err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }

      // Load leaves
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const leavesData = await api.getResources('leaves');
        if (leavesData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedLeaves = leavesData.map((d: any) => ({
            id: String(d.id),
            staffId: String(d.user_id),
            staffName: d.staff_name || 'Staff Member',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            init: d.init || (d.staff_name ? d.staff_name.split(' ').map((n: any) => n[0] ?? '').join('') : 'SM'),
            type: (typeof d.leave_type === 'object' && d.leave_type ? d.leave_type.name : d.leave_type) || 'Sick Leave',
            from: d.start_date || d.from,
            to: d.end_date || d.to,
            days: d.days || 1,
            reason: d.reason || '',
            status: d.status || 'Pending',
            appliedOn: d.created_at ? d.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
            adminNotes: d.admin_notes || '',
          }));
          setLeaveRequests(mappedLeaves);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
      } catch (err) {
        console.error('Error loading leaves in AppContext:', err);
      }

      // Load notifications
      try {
        const notifData = await api.getResources('notifications').catch(() => []);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setNotifications((notifData || []).map((n: any) => ({
          id: String(n.id),
          type: n.type || 'leave_request',
          message: n.message,
          time: 'Recently',
          read: !!n.read_at,
        })));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err) {
        console.error('Error loading notifications in AppContext:', err);
      }

      // Fetch all database settings to restore to localStorage on app boot
      try {
        const allSettings = await api.getResources('settings');
        if (Array.isArray(allSettings)) {
          updateSettingsCache(allSettings);
          const keysToExclude = ['token', 'user'];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          allSettings.forEach((setting: any) => {
            if (setting.key && !keysToExclude.includes(setting.key) && setting.value !== undefined) {
              // Write directly using localStorage.originalSetItem to bypass monkey-patch background writes
              (localStorage as any).originalSetItem(setting.key, setting.value);
              
              // Explicitly load period timings state if present
              if (setting.key === 'timetable_period_timings') {
                try {
                  setPeriodTimings(JSON.parse(setting.value));
                } catch (e) {
                  console.error('Failed to parse timetable_period_timings:', e);
                }
              }
            }
          });
        }
      } catch (err) {
        console.error('Error loading DB settings to localStorage in AppContext:', err);
      }

      // Fetch timetable from database
      try {
        const timetableData = await api.getResources('timetable', { limit: '1000' });
        if (timetableData && timetableData.length > 0) {
          const dayMap: Record<string, string> = {
            '2026-06-01': 'Monday',
            '2026-06-02': 'Tuesday',
            '2026-06-03': 'Wednesday',
            '2026-06-04': 'Thursday',
            '2026-06-05': 'Friday',
            '2026-06-06': 'Saturday',
          };
          
          const loadedTimetable: SchoolTimetable = {};
          const classes = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const cls of classes) {
            loadedTimetable[cls] = {};
            for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) {
              loadedTimetable[cls][day] = {};
              for (let p = 0; p < 12; p++) {
                loadedTimetable[cls][day][p] = null;
              }
            }
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          timetableData.forEach((slot: any) => {
            const rawCls = slot.batch_name;
            if (!rawCls) return;
            
            const cls = rawCls.trim();
            const day = slot.day || dayMap[slot.date];
            const p = slot.period;
            if (day && p !== undefined && p >= 0 && p < 12) {
              // Dynamically initialize class and day structures if not present
              if (!loadedTimetable[cls]) {
                loadedTimetable[cls] = {};
              }
              if (!loadedTimetable[cls][day]) {
                loadedTimetable[cls][day] = {};
                for (let i = 0; i < 12; i++) {
                  loadedTimetable[cls][day][i] = null;
                }
              }

              loadedTimetable[cls][day][p] = {
                subject: slot.subject,
                teacher: slot.teacher,
                teacherId: String(slot.teacherId),
                room: slot.room,
              };
            }
          });
          setTimetable(loadedTimetable);
        }
      } catch (tErr) {
        console.error('Error loading timetable in AppContext:', tErr);
      }

        // Delay pre-fetching of non-critical tab resources by 1.5 seconds
        setTimeout(() => {
          api.getResources('students', { with: 'batch.academicYear', limit: '1000' }).catch(() => {});
          api.getResources('batches').catch(() => {});
          api.getResources('holidays').catch(() => {});
          api.getSubstituteStaff().catch(() => {});
          api.getResources('daily-diaries').catch(() => {});
          api.getResources('fee-categories').catch(() => {});
          api.getResources('student-fees', { limit: '10000' }).catch(() => {});
          api.getResources('faculty').catch(() => {});
          api.getResources('expenses').catch(() => {});
          api.getResources('settings').catch(() => {});
          api.getResources('settings', { key: 'kts_student_attendance_records' }).catch(() => {});
          api.getResources('settings', { key: 'kts_holidays' }).catch(() => {});
          api.getResources('settings', { key: 'examinations_exams' }).catch(() => {});
          api.getResources('settings', { key: 'kts_student_marks' }).catch(() => {});
          api.getResources('settings', { key: 'examinations_schedules' }).catch(() => {});
          api.getResources('payslips').catch(() => {});
          api.getResources('biometric-logs').catch(() => {});
          api.getResources('homework').catch(() => {});
          api.getResources('alumni').catch(() => {});
        }, 1500);
      } catch (err) {
        console.error('Failed to load initial settings in AppContext:', err);
      } finally {
        setSettingsLoaded(true);
      }
    }
    loadInitialData();
  }, [user]);

  // Periodic polling and focus refetching to ensure multi-device and tab synchronization
  useEffect(() => {
    if (!user || !settingsLoaded) return;

    let isFetching = false;
    const refetch = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        // Sync settings
        const allSettings = await api.getResources('settings');
        if (Array.isArray(allSettings)) {
          updateSettingsCache(allSettings);
          const keysToExclude = ['token', 'user'];
          allSettings.forEach((setting: any) => {
            if (setting.key && !keysToExclude.includes(setting.key) && setting.value !== undefined) {
              const localVal = localStorage.getItem(setting.key);
              if (localVal !== setting.value) {
                // Write directly to local storage to bypass the monkey-patch save call
                (localStorage as any).originalSetItem(setting.key, setting.value);
                
                // Dispatch a StorageEvent in the current window so local page listeners update state immediately
                const event = new StorageEvent('storage', {
                  key: setting.key,
                  newValue: setting.value,
                  storageArea: localStorage,
                });
                window.dispatchEvent(event);

                // If timetable period timings change, update state directly
                if (setting.key === 'timetable_period_timings') {
                  try {
                    const parsed = JSON.parse(setting.value);
                    setPeriodTimings(prev => {
                      const hasChanged = JSON.stringify(prev) !== JSON.stringify(parsed);
                      return hasChanged ? parsed : prev;
                    });
                  } catch (e) {
                    console.error('Failed to parse timetable_period_timings from background sync:', e);
                  }
                }
              }
            }
          });
        }

        // Sync timetable
        const timetableRes = await api.getResources('timetable');
        if (Array.isArray(timetableRes) && timetableRes.length > 0) {
          const dayMap: Record<string, string> = {
            '2026-06-01': 'Monday',
            '2026-06-02': 'Tuesday',
            '2026-06-03': 'Wednesday',
            '2026-06-04': 'Thursday',
            '2026-06-05': 'Friday',
            '2026-06-06': 'Saturday',
          };

          const loadedTimetable: SchoolTimetable = {};
          const classes = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const cls of classes) {
            loadedTimetable[cls] = {};
            for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) {
              loadedTimetable[cls][day] = {};
              for (let p = 0; p < 12; p++) {
                loadedTimetable[cls][day][p] = null;
              }
            }
          }

          timetableRes.forEach((slot: any) => {
            const rawCls = slot.batch_name;
            if (!rawCls) return;

            const cls = rawCls.trim();
            const day = slot.day || dayMap[slot.date];
            const p = slot.period;
            if (day && p !== undefined && p >= 0 && p < 12) {
              // Dynamically initialize class and day structures if not present
              if (!loadedTimetable[cls]) {
                loadedTimetable[cls] = {};
              }
              if (!loadedTimetable[cls][day]) {
                loadedTimetable[cls][day] = {};
                for (let i = 0; i < 12; i++) {
                  loadedTimetable[cls][day][i] = null;
                }
              }

              loadedTimetable[cls][day][p] = {
                subject: slot.subject,
                teacher: slot.teacher,
                teacherId: String(slot.teacherId),
                room: slot.room,
              };
            }
          });
          setTimetable(prev => {
            const hasChanged = JSON.stringify(prev) !== JSON.stringify(loadedTimetable);
            return hasChanged ? loadedTimetable : prev;
          });
        }

        // Sync leaves
        const leavesData = await api.getResources('leaves');
        if (Array.isArray(leavesData)) {
          const mapped = leavesData.map((l: any) => ({
            id: String(l.id),
            staffId: String(l.user_id),
            staffName: l.staff_name || 'Unknown',
            init: l.initials || 'LD',
            type: (typeof l.leave_type === 'object' && l.leave_type ? l.leave_type.name : l.leave_type) || 'Sick Leave',
            from: l.start_date,
            to: l.end_date,
            days: Number(l.days),
            reason: l.reason,
            status: l.status,
            appliedOn: l.created_at ? l.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
            adminNotes: l.admin_notes || undefined,
          }));
          setLeaveRequests(prev => {
            const hasChanged = JSON.stringify(prev) !== JSON.stringify(mapped);
            return hasChanged ? mapped : prev;
          });
        }
      } catch (err) {
        console.warn('Background sync failed:', err);
      } finally {
        isFetching = false;
      }
    };

    // Refetch on window focus
    const handleFocus = () => {
      refetch();
    };

    // Refetch on visibility change (tab switch back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Poll every 5 seconds for other devices/users
    const intervalId = setInterval(refetch, 5000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [user, settingsLoaded]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addLeaveRequest = async (req: Omit<LeaveRequest, 'id' | 'appliedOn'>) => {
    try {
      const res = await api.createResource('leaves', {
        user_id: parseInt(req.staffId) || 1,
        staff_name: req.staffName,
        leave_type: req.type,
        start_date: req.from,
        end_date: req.to,
        days: req.days,
        reason: req.reason,
        status: 'Pending',
      });

      const newReq: LeaveRequest = {
        ...req,
        id: String(res.id),
        appliedOn: new Date().toISOString().slice(0, 10),
        status: 'Pending',
        adminNotes: '',
      };
      setLeaveRequests((prev) => [newReq, ...prev]);

      const notif: Notification = {
        id: 'n' + res.id,
        type: 'leave_request',
        message: `${req.staffName} applied for ${req.type} (${req.from})`,
        time: 'Just now',
        read: false,
        refId: String(res.id),
      };
      setNotifications((prev) => [notif, ...prev]);
    } catch (err) {
      console.error('Error adding leave request:', err);
    }
  };

  const approveLeave = async (id: string) => {
    try {
      await api.updateResource('leaves', id, { status: 'Approved' });
      setLeaveRequests((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: 'Approved' } : l))
      );
      const req = leaveRequests.find((l) => l.id === id);
      if (req) {
        const notif: Notification = {
          id: 'na' + id,
          type: 'leave_approved',
          message: `Your ${req.type} request has been approved`,
          time: 'Just now',
          read: false,
          refId: id,
        };
        setNotifications((prev) => [notif, ...prev]);
      }
    } catch (err) {
      console.error('Error approving leave:', err);
    }
  };

  const rejectLeave = async (id: string, notes?: string) => {
    try {
      await api.updateResource('leaves', id, { status: 'Rejected', admin_notes: notes });
      setLeaveRequests((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: 'Rejected', adminNotes: notes } : l))
      );
      const req = leaveRequests.find((l) => l.id === id);
      if (req) {
        const notif: Notification = {
          id: 'nr' + id,
          type: 'leave_rejected',
          message: `Your ${req.type} request has been rejected.${notes ? ` Reason: ${notes}` : ''}`,
          time: 'Just now',
          read: false,
          refId: id,
        };
        setNotifications((prev) => [notif, ...prev]);
      }
    } catch (err) {
      console.error('Error rejecting leave:', err);
    }
  };

  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const setTimetablePeriod = (
    className: string,
    day: string,
    periodIndex: number,
    period: TimetablePeriod | null
  ) => {
    setTimetable((prev) => ({
      ...prev,
      [className]: {
        ...prev[className],
        [day]: {
          ...(prev[className]?.[day] ?? {}),
          [periodIndex]: period,
        },
      },
    }));
  };

  const savePeriodTimings = async (newTimings: PeriodTiming[]) => {
    setPeriodTimings(newTimings);
    localStorage.setItem('timetable_period_timings', JSON.stringify(newTimings));
    try {
      const valueStr = JSON.stringify(newTimings);
      const existing = await api.getResources('settings', { key: 'timetable_period_timings' });
      if (Array.isArray(existing) && existing.length > 0) {
        const settingId = existing[0].id;
        await api.updateResource('settings', String(settingId), { value: valueStr });
      } else {
        await api.createResource('settings', {
          key: 'timetable_period_timings',
          value: valueStr,
          group: 'timetable',
          type: 'json',
          is_public: true,
        });
      }
    } catch (err) {
      console.error('Error saving period timings to DB:', err);
    }
  };

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <AppContext.Provider value={{
      leaveRequests,
      notifications,
      unreadCount,
      timetable,
      periodTimings,
      academicYears,
      selectedAcademicYearId,
      setSelectedAcademicYearId,
      addLeaveRequest,
      approveLeave,
      rejectLeave,
      markNotificationsRead,
      setTimetablePeriod,
      savePeriodTimings,
      hasUnsavedChanges,
      setHasUnsavedChanges,
    }}>
      {settingsLoaded ? children : <PageLoader />}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
