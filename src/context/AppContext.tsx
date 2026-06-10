import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

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

interface AppContextValue {
  leaveRequests: LeaveRequest[];
  notifications: Notification[];
  unreadCount: number;
  timetable: SchoolTimetable;
  addLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'appliedOn'>) => Promise<void>;
  approveLeave: (id: string) => Promise<void>;
  rejectLeave: (id: string, notes?: string) => Promise<void>;
  markNotificationsRead: () => void;
  setTimetablePeriod: (className: string, day: string, periodIndex: number, period: TimetablePeriod | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const TIMETABLE_DAYS = DAYS;
export const TIMETABLE_PERIODS = PERIODS;

export const PERIOD_TIMES = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [timetable, setTimetable] = useState<SchoolTimetable>(buildDefaultTimetable);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const leavesData = await api.getResources('leaves');
        const mappedLeaves = leavesData.map((d: any) => ({
          id: String(d.id),
          staffId: String(d.user_id),
          staffName: d.staff_name || 'Staff Member',
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

        const notifData = await api.getResources('notifications').catch(() => []);
        setNotifications((notifData || []).map((n: any) => ({
          id: String(n.id),
          type: n.type || 'leave_request',
          message: n.message,
          time: 'Recently',
          read: !!n.read_at,
        })));

        // Fetch timetable from database
        try {
          const timetableData = await api.getResources('timetable');
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
            for (const cls of classes) {
              loadedTimetable[cls] = {};
              for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) {
                loadedTimetable[cls][day] = {};
                for (let p = 0; p < 8; p++) {
                  loadedTimetable[cls][day][p] = null;
                }
              }
            }

            timetableData.forEach((slot: any) => {
              const cls = slot.batch_name;
              const day = dayMap[slot.date];
              const p = slot.period;
              if (cls && day && p !== undefined && p >= 0 && p < 8) {
                if (loadedTimetable[cls]) {
                  loadedTimetable[cls][day][p] = {
                    subject: slot.subject,
                    teacher: slot.teacher,
                    teacherId: String(slot.teacherId),
                    room: slot.room,
                  };
                }
              }
            });
            setTimetable(loadedTimetable);
          }
        } catch (tErr) {
          console.error('Error loading timetable in AppContext:', tErr);
        }
      } catch (err) {
        console.error('Error loading API data in AppContext:', err);
      }
    }
    loadInitialData();
  }, []);

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

  return (
    <AppContext.Provider value={{
      leaveRequests,
      notifications,
      unreadCount,
      timetable,
      addLeaveRequest,
      approveLeave,
      rejectLeave,
      markNotificationsRead,
      setTimetablePeriod,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
