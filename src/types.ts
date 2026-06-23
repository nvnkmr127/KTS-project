export type Role = 'admin' | 'teacher';

export type PageId =
  | 'dashboard'
  | 'fee'
  | 'fee-categories'
  | 'attendance'
  | 'diary'
  | 'bus'
  | 'faculty'
  | 'reports'
  | 'students'
  | 'staff'
  | 'staff-attendance'
  | 'staff-access'
  | 'classes'
  | 'salary'
  | 'salary-categories'
  | 'expenses'
  | 'whatsapp'
  | 'leave'
  | 'exams'
  | 'meetings'
  | 'homework'
  | 'performance'
  | 'teacher-dashboard'
  | 'allot-attendance'
  | 'promotion'
  | 'timetable'
  | 'my-salary'
  | 'settings'
  | 'activity-logs'
  | 'recycle-bin'
  | 'search';

export type ColorVariant =
  | 'blue'
  | 'teal'
  | 'amber'
  | 'coral'
  | 'purple'
  | 'green'
  | 'red'
  | 'pink'
  | 'gray';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  initials: string;
  designation?: string;
  subject?: string;
  classes?: string[];
}
