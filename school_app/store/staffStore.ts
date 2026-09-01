import { create } from 'zustand';
import { api } from '../services/api';

export interface StaffMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  category: 'Teaching' | 'Non-Teaching' | 'Admin' | 'Support';
  subject?: string;
  phone: string;
  email: string;
  join_date: string;
  attendance_percentage: number;
  status: 'Active' | 'On Leave' | 'Resigned';
  salary: number;
  qualifications: string;
  documents?: string[];
  biometric_employee_code?: string;
  avatar?: string;
  attendanceStatus?: 'Present' | 'Absent' | 'Half Day' | 'Leave';
  inTime?: string;
  outTime?: string;
  biometricSynced?: boolean;
}

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'st_1',
    name: 'Dr. Julian Vance',
    designation: 'Senior Faculty Head',
    department: 'Physics',
    category: 'Teaching',
    subject: 'Senior Physics',
    phone: '+91 98450 12345',
    email: 'julian.vance@krishnaveni.edu',
    join_date: '2021-06-15',
    attendance_percentage: 98.4,
    status: 'Active',
    salary: 65000,
    qualifications: 'Ph.D. in Physics, M.Sc.',
    documents: ['Aadhaar Card', 'Degree Certificate', 'Experience Letter'],
    biometric_employee_code: 'BIO-101',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
    attendanceStatus: 'Present',
    inTime: '08:24 AM',
    outTime: '04:30 PM',
    biometricSynced: true,
  },
  {
    id: 'st_2',
    name: 'Mrs. Sarah Jenkins',
    designation: 'Admin Operations Head',
    department: 'Administration',
    category: 'Admin',
    subject: 'Management',
    phone: '+91 98450 23456',
    email: 'sarah.jenkins@krishnaveni.edu',
    join_date: '2020-03-10',
    attendance_percentage: 96.2,
    status: 'Active',
    salary: 58000,
    qualifications: 'MBA in Operations, B.Com',
    documents: ['Aadhaar Card', 'Degree Certificate', 'Contract Agreement'],
    biometric_employee_code: 'BIO-102',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150',
    attendanceStatus: 'Present',
    inTime: '08:15 AM',
    outTime: '05:00 PM',
    biometricSynced: true,
  },
  {
    id: 'st_3',
    name: 'Prof. Michael Chen',
    designation: 'HOD Mathematics',
    department: 'Mathematics',
    category: 'Teaching',
    subject: 'Higher Calculus',
    phone: '+91 98450 34567',
    email: 'michael.chen@krishnaveni.edu',
    join_date: '2019-08-01',
    attendance_percentage: 92.0,
    status: 'On Leave',
    salary: 72000,
    qualifications: 'M.Sc. Mathematics, B.Ed',
    documents: ['Aadhaar Card', 'Degree Certificate'],
    biometric_employee_code: 'BIO-103',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150',
    attendanceStatus: 'Leave',
    inTime: '--:--',
    outTime: '--:--',
    biometricSynced: false,
  },
  {
    id: 'st_4',
    name: 'Rajesh Sharma',
    designation: 'Senior Accountant',
    department: 'Accounts & Finance',
    category: 'Non-Teaching',
    subject: 'Finance',
    phone: '+91 98450 45678',
    email: 'rajesh.sharma@krishnaveni.edu',
    join_date: '2022-01-20',
    attendance_percentage: 95.5,
    status: 'Active',
    salary: 45000,
    qualifications: 'M.Com, Chartered Inter',
    documents: ['Aadhaar Card', 'Police Clearance', 'Degree Certificate'],
    biometric_employee_code: 'BIO-104',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150',
    attendanceStatus: 'Half Day',
    inTime: '08:30 AM',
    outTime: '01:00 PM',
    biometricSynced: true,
  },
  {
    id: 'st_5',
    name: 'Priya Nambiar',
    designation: 'Senior English Faculty',
    department: 'Languages',
    category: 'Teaching',
    subject: 'English Literature',
    phone: '+91 98450 56789',
    email: 'priya.nambiar@krishnaveni.edu',
    join_date: '2023-04-12',
    attendance_percentage: 97.1,
    status: 'Active',
    salary: 48000,
    qualifications: 'M.A. English, B.Ed',
    documents: ['Aadhaar Card', 'Degree Certificate'],
    biometric_employee_code: 'BIO-105',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150',
    attendanceStatus: 'Present',
    inTime: '08:28 AM',
    outTime: '04:30 PM',
    biometricSynced: true,
  },
  {
    id: 'st_6',
    name: 'Ramesh Goud',
    designation: 'Transport & Fleet Supervisor',
    department: 'Logistics',
    category: 'Support',
    subject: 'Fleet',
    phone: '+91 98450 67890',
    email: 'ramesh.goud@krishnaveni.edu',
    join_date: '2021-11-05',
    attendance_percentage: 94.0,
    status: 'Active',
    salary: 32000,
    qualifications: 'Diploma in Automobile Mechanics',
    documents: ['Aadhaar Card', 'Driving License', 'Police Clearance'],
    biometric_employee_code: 'BIO-106',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150',
    attendanceStatus: 'Present',
    inTime: '07:45 AM',
    outTime: '04:00 PM',
    biometricSynced: true,
  },
];

interface StaffState {
  staffList: StaffMember[];
  loading: boolean;
  fetchStaff: () => Promise<void>;
  addStaff: (staff: StaffMember) => void;
  updateStaff: (staff: StaffMember) => void;
  deleteStaff: (staffId: string) => void;
  updateAttendanceStatus: (staffId: string, newStatus: 'Present' | 'Absent' | 'Half Day' | 'Leave') => void;
  markAllPresent: () => void;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staffList: INITIAL_STAFF_MEMBERS,
  loading: false,

  fetchStaff: async () => {
    // Only set loading to true if we have no staff members in memory
    if (get().staffList.length === 0) {
      set({ loading: true });
    }
    try {
      const res = await api.getResources('faculty');
      const extractArray = (data: any) =>
        Array.isArray(data)
          ? data
          : data?.data && Array.isArray(data.data)
          ? data.data
          : data?.data?.data && Array.isArray(data.data.data)
          ? data.data.data
          : [];
      const staffArr = extractArray(res);

      if (staffArr && staffArr.length > 0) {
        const mapped: StaffMember[] = staffArr.map((s: any, idx: number) => ({
          id: String(s.id || `faculty_${idx}`),
          name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Staff Member',
          designation: s.designation || s.role || 'Faculty',
          department: s.department || 'General',
          category: normalizeCategory(s.category || s.department_category || 'Teaching'),
          subject: s.subject || s.specialization || '',
          phone: s.phone || s.contact_number || '+91 98450 00000',
          email: s.email || 'staff@krishnaveni.edu',
          join_date: (s.join_date || s.created_at || '2023-01-01').split('T')[0],
          attendance_percentage: Number(s.attendance_percentage) || 95.0,
          status: normalizeStatus(s.status || 'Active'),
          salary: typeof s.salary === 'string' ? parseFloat(s.salary) : (s.salary || 45000),
          qualifications: s.qualifications || 'Graduate',
          documents: typeof s.documents === 'string' ? JSON.parse(s.documents) : (s.documents || ['Aadhaar Card', 'Degree Certificate']),
          biometric_employee_code: s.biometric_employee_code || s.employee_code || `BIO-${100 + idx}`,
          avatar: s.avatar || INITIAL_STAFF_MEMBERS[idx % INITIAL_STAFF_MEMBERS.length]?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
          attendanceStatus: s.attendanceStatus || (s.status === 'On Leave' ? 'Leave' : 'Present'),
          inTime: s.inTime || '08:30 AM',
          outTime: s.outTime || '04:30 PM',
          biometricSynced: s.biometricSynced !== false,
        }));
        set({ staffList: mapped, loading: false });
        return;
      }
    } catch (e) {
      console.log('Background staff sync:', e);
    } finally {
      set({ loading: false });
    }
  },

  addStaff: (newStaff) => {
    set((state) => ({
      staffList: [newStaff, ...state.staffList],
    }));
  },

  updateStaff: (updatedStaff) => {
    set((state) => ({
      staffList: state.staffList.map((s) => (s.id === updatedStaff.id ? updatedStaff : s)),
    }));
  },

  deleteStaff: (staffId) => {
    set((state) => ({
      staffList: state.staffList.filter((s) => s.id !== staffId),
    }));
  },

  updateAttendanceStatus: (staffId, newStatus) => {
    set((state) => ({
      staffList: state.staffList.map((s) => {
        if (s.id === staffId) {
          let newIn = s.inTime || '08:30 AM';
          let newOut = s.outTime || '04:30 PM';
          if (newStatus === 'Absent' || newStatus === 'Leave') {
            newIn = '--:--';
            newOut = '--:--';
          } else if (newStatus === 'Half Day') {
            newIn = '08:30 AM';
            newOut = '01:00 PM';
          } else if (newStatus === 'Present') {
            newIn = '08:30 AM';
            newOut = '04:30 PM';
          }
          return {
            ...s,
            attendanceStatus: newStatus,
            inTime: newIn,
            outTime: newOut,
          };
        }
        return s;
      }),
    }));
  },

  markAllPresent: () => {
    set((state) => ({
      staffList: state.staffList.map((s) => ({
        ...s,
        attendanceStatus: 'Present',
        inTime: s.inTime === '--:--' ? '08:30 AM' : (s.inTime || '08:30 AM'),
        outTime: s.outTime === '--:--' ? '04:30 PM' : (s.outTime || '04:30 PM'),
      })),
    }));
  },
}));

function normalizeCategory(cat: string): 'Teaching' | 'Non-Teaching' | 'Admin' | 'Support' {
  const c = (cat || '').toLowerCase().trim();
  if (c.includes('non') || c.includes('account') || c.includes('finance')) return 'Non-Teaching';
  if (c.includes('admin')) return 'Admin';
  if (c.includes('support') || c.includes('fleet') || c.includes('logistics') || c.includes('driver')) return 'Support';
  return 'Teaching';
}

function normalizeStatus(st: string): 'Active' | 'On Leave' | 'Resigned' {
  const s = (st || '').toLowerCase().trim();
  if (s.includes('leave')) return 'On Leave';
  if (s.includes('resign') || s.includes('inactive')) return 'Resigned';
  return 'Active';
}
