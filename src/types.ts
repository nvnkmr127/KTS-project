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
  | 'timetable';

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
