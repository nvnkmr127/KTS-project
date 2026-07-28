export type Role = 'admin' | 'teacher';

export type { PageId } from './routes';

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
  roles?: string[];
  permissions?: string[];
  status?: string;
}

export interface Student {
  id: string | number;
  name: string;
  roll?: string;
  class?: string;
  section?: string;
  batch_id?: number | string;
  student_pen_no?: string;
  father_occupation?: string;
  father_mobile?: string;
  mother_name?: string;
  mother_mobile?: string;
  mother_occupation?: string;
  mother_tongue?: string;
  nationality?: string;
  state?: string;
  religion?: string;
  caste?: string;
  sub_caste?: string;
  tc_no?: string;
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface Staff {
  id: string | number;
  name: string;
  role?: string;
  department?: string;
  email?: string;
   
  phone?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
