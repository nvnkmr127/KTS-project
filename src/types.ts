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
  | 'alumni'
  | 'search'
  | 'substitute'
  | 'webhook';

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

export interface Student {
  id: string | number;
  name: string;
  roll?: string;
  class?: string;
  section?: string;
  batch_id?: number | string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface Staff {
  id: string | number;
  name: string;
  role?: string;
  department?: string;
  email?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phone?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: T;
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface SelectOption {
  value: string | number;
  label: string;
}
