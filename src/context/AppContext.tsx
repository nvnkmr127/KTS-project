import React, { createContext, useContext, useState } from 'react';

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

const INITIAL_LEAVES: LeaveRequest[] = [
  { id: '1', staffId: '3', staffName: 'Mrs. Suma Reddy', init: 'SR', type: 'Sick Leave', from: '2026-06-03', to: '2026-06-05', days: 3, reason: 'Fever and viral infection', status: 'Approved', appliedOn: '2026-06-02' },
  { id: '2', staffId: '4', staffName: 'Mr. Raju Sharma', init: 'RS', type: 'Casual Leave', from: '2026-06-10', to: '2026-06-10', days: 1, reason: 'Personal work', status: 'Pending', appliedOn: '2026-06-05' },
  { id: '3', staffId: '5', staffName: 'Mrs. Savitha Kumar', init: 'SK', type: 'Emergency Leave', from: '2026-06-02', to: '2026-06-02', days: 1, reason: 'Family emergency', status: 'Approved', appliedOn: '2026-06-02' },
  { id: '4', staffId: '6', staffName: 'Mr. Prakash Nair', init: 'PN', type: 'Earned Leave', from: '2026-06-20', to: '2026-06-22', days: 3, reason: 'Planned vacation', status: 'Pending', appliedOn: '2026-06-04' },
  { id: '5', staffId: '2', staffName: 'Mrs. Lakshmi Devi', init: 'LD', type: 'Sick Leave', from: '2026-05-28', to: '2026-05-28', days: 1, reason: 'Medical appointment', status: 'Approved', appliedOn: '2026-05-27' },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'leave_request', message: 'Mr. Raju Sharma applied for Casual Leave (Jun 10)', time: '2 hours ago', read: false, refId: '2' },
  { id: 'n2', type: 'leave_request', message: 'Mr. Prakash Nair applied for Earned Leave (Jun 20–22)', time: '1 day ago', read: false, refId: '4' },
];

interface AppContextValue {
  leaveRequests: LeaveRequest[];
  notifications: Notification[];
  unreadCount: number;
  timetable: SchoolTimetable;
  addLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'appliedOn'>) => void;
  approveLeave: (id: string) => void;
  rejectLeave: (id: string) => void;
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
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVES);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [timetable, setTimetable] = useState<SchoolTimetable>(buildDefaultTimetable);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addLeaveRequest = (req: Omit<LeaveRequest, 'id' | 'appliedOn'>) => {
    const id = String(Date.now());
    const newReq: LeaveRequest = { ...req, id, appliedOn: new Date().toISOString().slice(0, 10) };
    setLeaveRequests((prev) => [newReq, ...prev]);
    const notif: Notification = {
      id: 'n' + id,
      type: 'leave_request',
      message: `${req.staffName} applied for ${req.type} (${req.from}${req.from !== req.to ? ` – ${req.to}` : ''})`,
      time: 'Just now',
      read: false,
      refId: id,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const approveLeave = (id: string) => {
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
  };

  const rejectLeave = (id: string) => {
    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'Rejected' } : l))
    );
    const req = leaveRequests.find((l) => l.id === id);
    if (req) {
      const notif: Notification = {
        id: 'nr' + id,
        type: 'leave_rejected',
        message: `Your ${req.type} request has been rejected`,
        time: 'Just now',
        read: false,
        refId: id,
      };
      setNotifications((prev) => [notif, ...prev]);
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
