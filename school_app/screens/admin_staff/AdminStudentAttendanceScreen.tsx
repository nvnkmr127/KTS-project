import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Modal, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle2, AlertCircle, ChevronRight, ArrowLeft, 
  School, AlertTriangle, ShieldCheck, ChevronLeft, Clock, Info, X
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface ClassItemSummary {
  id: string;
  className: string;
  grade: string;
  section: string;
  teacherName: string;
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  todayAvg: number;
}

export interface StudentAttendanceRecord {
  id: string;
  name: string;
  initials: string;
  rollNo: string;
  totalLectures: number;
  attended: number;
  overallPct: number;
  attendanceMap: Record<number, 'present' | 'absent' | 'partial'>;
}

export interface StudentAttendanceSummary {
  id: string;
  rollNo: string;
  name: string;
  initials: string;
  className: string;
  totalLectures: number;
  attended: number;
  overallPct: number;
  attendanceMap?: Record<number, 'present' | 'absent' | 'partial'>;
}

export interface PeriodDetail {
  periodNumber: number;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  status: 'Present' | 'Absent';
}

const CLASS_TIMETABLE_PERIODS: Record<number, Omit<PeriodDetail, 'status'>[]> = {
  0: [ // Sunday (Special Sessions & Mentorship)
    { periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Mathematics Problem Solving', teacher: 'Mrs. Anita Sharma', room: 'Room 204' },
    { periodNumber: 2, time: '09:45 AM - 10:30 AM', subject: 'Physics Doubt Clearing', teacher: 'Mr. Rajesh Kumar', room: 'Physics Lab' },
    { periodNumber: 3, time: '10:45 AM - 11:30 AM', subject: 'Chemistry Revision', teacher: 'Dr. Meenakshi Sundaram', room: 'Chem Lab' },
    { periodNumber: 4, time: '11:30 AM - 12:15 PM', subject: 'English Literature Workshop', teacher: 'Mrs. Priya Nambiar', room: 'Room 204' },
    { periodNumber: 5, time: '01:15 PM - 02:00 PM', subject: 'Biology Seminar', teacher: 'Mr. Vikramaditya Singh', room: 'Bio Lab' },
    { periodNumber: 6, time: '02:00 PM - 02:45 PM', subject: 'Computer Applications Lab', teacher: 'Mrs. Sarah Jenkins', room: 'Comp Lab' },
    { periodNumber: 7, time: '02:45 PM - 03:30 PM', subject: 'Physical Fitness & Sports', teacher: 'Mr. Ramesh Varma', room: 'Sports Ground' },
  ],
  1: [ // Monday
    { periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Mathematics', teacher: 'Mrs. Anita Sharma', room: 'Room 204' },
    { periodNumber: 2, time: '09:45 AM - 10:30 AM', subject: 'Physics', teacher: 'Mr. Rajesh Kumar', room: 'Physics Lab' },
    { periodNumber: 3, time: '10:45 AM - 11:30 AM', subject: 'Chemistry', teacher: 'Dr. Meenakshi Sundaram', room: 'Chem Lab' },
    { periodNumber: 4, time: '11:30 AM - 12:15 PM', subject: 'English Literature', teacher: 'Mrs. Priya Nambiar', room: 'Room 204' },
    { periodNumber: 5, time: '01:15 PM - 02:00 PM', subject: 'Biology', teacher: 'Mr. Vikramaditya Singh', room: 'Bio Lab' },
    { periodNumber: 6, time: '02:00 PM - 02:45 PM', subject: 'Computer Science', teacher: 'Mrs. Sarah Jenkins', room: 'Comp Lab' },
    { periodNumber: 7, time: '02:45 PM - 03:30 PM', subject: 'Physical Education', teacher: 'Mr. Ramesh Varma', room: 'Sports Ground' },
  ],
  2: [ // Tuesday
    { periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Physics', teacher: 'Mr. Rajesh Kumar', room: 'Physics Lab' },
    { periodNumber: 2, time: '09:45 AM - 10:30 AM', subject: 'Mathematics', teacher: 'Mrs. Anita Sharma', room: 'Room 204' },
    { periodNumber: 3, time: '10:45 AM - 11:30 AM', subject: 'English Literature', teacher: 'Mrs. Priya Nambiar', room: 'Room 204' },
    { periodNumber: 4, time: '11:30 AM - 12:15 PM', subject: 'Chemistry', teacher: 'Dr. Meenakshi Sundaram', room: 'Chem Lab' },
    { periodNumber: 5, time: '01:15 PM - 02:00 PM', subject: 'Social Science', teacher: 'Mr. Vikramaditya Singh', room: 'Room 204' },
    { periodNumber: 6, time: '02:00 PM - 02:45 PM', subject: 'Second Language', teacher: 'Mrs. Sunita Rao', room: 'Room 204' },
    { periodNumber: 7, time: '02:45 PM - 03:30 PM', subject: 'Library & Research', teacher: 'Mrs. Priya Nambiar', room: 'Library' },
  ],
  3: [ // Wednesday
    { periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Chemistry', teacher: 'Dr. Meenakshi Sundaram', room: 'Chem Lab' },
    { periodNumber: 2, time: '09:45 AM - 10:30 AM', subject: 'Mathematics', teacher: 'Mrs. Anita Sharma', room: 'Room 204' },
    { periodNumber: 3, time: '10:45 AM - 11:30 AM', subject: 'Biology', teacher: 'Mr. Vikramaditya Singh', room: 'Bio Lab' },
    { periodNumber: 4, time: '11:30 AM - 12:15 PM', subject: 'Physics', teacher: 'Mr. Rajesh Kumar', room: 'Physics Lab' },
    { periodNumber: 5, time: '01:15 PM - 02:00 PM', subject: 'Computer Applications', teacher: 'Mrs. Sarah Jenkins', room: 'Comp Lab' },
    { periodNumber: 6, time: '02:00 PM - 02:45 PM', subject: 'English Literature', teacher: 'Mrs. Priya Nambiar', room: 'Room 204' },
    { periodNumber: 7, time: '02:45 PM - 03:30 PM', subject: 'Art & Design', teacher: 'Mrs. Kavita Patel', room: 'Art Studio' },
  ],
  4: [ // Thursday
    { periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Mathematics', teacher: 'Mrs. Anita Sharma', room: 'Room 204' },
    { periodNumber: 2, time: '09:45 AM - 10:30 AM', subject: 'Physics', teacher: 'Mr. Rajesh Kumar', room: 'Physics Lab' },
    { periodNumber: 3, time: '10:45 AM - 11:30 AM', subject: 'Social Science', teacher: 'Mr. Vikramaditya Singh', room: 'Room 204' },
    { periodNumber: 4, time: '11:30 AM - 12:15 PM', subject: 'Chemistry', teacher: 'Dr. Meenakshi Sundaram', room: 'Chem Lab' },
    { periodNumber: 5, time: '01:15 PM - 02:00 PM', subject: 'Second Language', teacher: 'Mrs. Sunita Rao', room: 'Room 204' },
    { periodNumber: 6, time: '02:00 PM - 02:45 PM', subject: 'English Grammar', teacher: 'Mrs. Priya Nambiar', room: 'Room 204' },
    { periodNumber: 7, time: '02:45 PM - 03:30 PM', subject: 'Sports & Athletics', teacher: 'Mr. Ramesh Varma', room: 'Sports Ground' },
  ],
  5: [ // Friday
    { periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Biology', teacher: 'Mr. Vikramaditya Singh', room: 'Bio Lab' },
    { periodNumber: 2, time: '09:45 AM - 10:30 AM', subject: 'Chemistry', teacher: 'Dr. Meenakshi Sundaram', room: 'Chem Lab' },
    { periodNumber: 3, time: '10:45 AM - 11:30 AM', subject: 'Mathematics', teacher: 'Mrs. Anita Sharma', room: 'Room 204' },
    { periodNumber: 4, time: '11:30 AM - 12:15 PM', subject: 'Physics', teacher: 'Mr. Rajesh Kumar', room: 'Physics Lab' },
    { periodNumber: 5, time: '01:15 PM - 02:00 PM', subject: 'Computer Science', teacher: 'Mrs. Sarah Jenkins', room: 'Comp Lab' },
    { periodNumber: 6, time: '02:00 PM - 02:45 PM', subject: 'Environmental Studies', teacher: 'Mrs. Anita Sharma', room: 'Room 204' },
    { periodNumber: 7, time: '02:45 PM - 03:30 PM', subject: 'Club Activities / Debate', teacher: 'Mrs. Priya Nambiar', room: 'Auditorium' },
  ],
  6: [ // Saturday
    { periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Mathematics Problem Solving', teacher: 'Mrs. Anita Sharma', room: 'Room 204' },
    { periodNumber: 2, time: '09:45 AM - 10:30 AM', subject: 'Science Seminar', teacher: 'Mr. Rajesh Kumar', room: 'Physics Lab' },
    { periodNumber: 3, time: '10:45 AM - 11:30 AM', subject: 'English Debating', teacher: 'Mrs. Priya Nambiar', room: 'Room 204' },
    { periodNumber: 4, time: '11:30 AM - 12:15 PM', subject: 'Physical Fitness & Drill', teacher: 'Mr. Ramesh Varma', room: 'Sports Ground' },
  ]
};

const MOCK_CLASSES: ClassItemSummary[] = [
  { id: 'c1', className: 'Class 1A', grade: 'Class 1', section: 'A', teacherName: 'Mrs. Anita Sharma', totalStudents: 32, presentToday: 30, absentToday: 2, todayAvg: 93.8 },
  { id: 'c2', className: 'Class 1B', grade: 'Class 1', section: 'B', teacherName: 'Mr. Rajesh Kumar', totalStudents: 30, presentToday: 28, absentToday: 2, todayAvg: 93.3 },
  { id: 'c3', className: 'Class 2A', grade: 'Class 2', section: 'A', teacherName: 'Dr. Meenakshi Sundaram', totalStudents: 35, presentToday: 34, absentToday: 1, todayAvg: 97.1 },
  { id: 'c4', className: 'Class 2B', grade: 'Class 2', section: 'B', teacherName: 'Mrs. Priya Nambiar', totalStudents: 34, presentToday: 31, absentToday: 3, todayAvg: 91.2 },
  { id: 'c5', className: 'Class 3A', grade: 'Class 3', section: 'A', teacherName: 'Mr. Vikramaditya Singh', totalStudents: 36, presentToday: 35, absentToday: 1, todayAvg: 97.2 },
  { id: 'c6', className: 'Class 3B', grade: 'Class 3', section: 'B', teacherName: 'Mrs. Anita Sharma', totalStudents: 33, presentToday: 30, absentToday: 3, todayAvg: 90.9 },
  { id: 'c7', className: 'Class 4A', grade: 'Class 4', section: 'A', teacherName: 'Mr. Rajesh Kumar', totalStudents: 38, presentToday: 37, absentToday: 1, todayAvg: 97.4 },
  { id: 'c8', className: 'Class 4B', grade: 'Class 4', section: 'B', teacherName: 'Dr. Meenakshi Sundaram', totalStudents: 37, presentToday: 35, absentToday: 2, todayAvg: 94.6 },
  { id: 'c9', className: 'Class 5A', grade: 'Class 5', section: 'A', teacherName: 'Mrs. Priya Nambiar', totalStudents: 40, presentToday: 38, absentToday: 2, todayAvg: 95.0 },
  { id: 'c10', className: 'Class 5B', grade: 'Class 5', section: 'B', teacherName: 'Mr. Vikramaditya Singh', totalStudents: 39, presentToday: 36, absentToday: 3, todayAvg: 92.3 },
  { id: 'c11', className: 'Class 6A', grade: 'Class 6', section: 'A', teacherName: 'Mrs. Anita Sharma', totalStudents: 38, presentToday: 37, absentToday: 1, todayAvg: 97.3 },
  { id: 'c12', className: 'Class 6B', grade: 'Class 6', section: 'B', teacherName: 'Mr. Rajesh Kumar', totalStudents: 37, presentToday: 35, absentToday: 2, todayAvg: 94.5 },
  { id: 'c13', className: 'Class 7A', grade: 'Class 7', section: 'A', teacherName: 'Dr. Meenakshi Sundaram', totalStudents: 40, presentToday: 39, absentToday: 1, todayAvg: 97.5 },
  { id: 'c14', className: 'Class 7B', grade: 'Class 7', section: 'B', teacherName: 'Mr. Vikramaditya Singh', totalStudents: 39, presentToday: 37, absentToday: 2, todayAvg: 94.8 },
  { id: 'c15', className: 'Class 8A', grade: 'Class 8', section: 'A', teacherName: 'Mrs. Priya Nambiar', totalStudents: 44, presentToday: 43, absentToday: 1, todayAvg: 97.7 },
  { id: 'c16', className: 'Class 9A', grade: 'Class 9', section: 'A', teacherName: 'Dr. Meenakshi Sundaram', totalStudents: 21, presentToday: 20, absentToday: 1, todayAvg: 95.2 },
  { id: 'c17', className: 'Class 10A', grade: 'Class 10', section: 'A', teacherName: 'Mrs. Anita Sharma', totalStudents: 35, presentToday: 34, absentToday: 1, todayAvg: 97.1 }
];

const MOCK_CLASS_STUDENTS: StudentAttendanceRecord[] = [
  { id: 's1', name: 'B Sandeep Goud', initials: 'BS', rollNo: '101', totalLectures: 45, attended: 42, overallPct: 93.3, attendanceMap: { 1: 'present', 2: 'present', 3: 'present', 4: 'partial', 5: 'present', 6: 'present', 7: 'present', 8: 'present', 10: 'present', 11: 'absent', 12: 'present', 13: 'present', 14: 'present', 15: 'present', 17: 'present', 18: 'absent', 19: 'present', 20: 'present', 21: 'present', 22: 'present', 24: 'present', 25: 'partial', 26: 'present', 27: 'present', 28: 'present', 29: 'present', 31: 'present' } },
  { id: 's2', name: 'Banda Teja Sri', initials: 'BT', rollNo: '102', totalLectures: 45, attended: 44, overallPct: 97.7, attendanceMap: { 1: 'present', 2: 'present', 3: 'present', 4: 'present', 5: 'present', 6: 'present', 7: 'present', 8: 'present', 10: 'present', 11: 'present', 12: 'present', 13: 'present', 14: 'present', 15: 'present', 17: 'present', 18: 'present', 19: 'present', 20: 'present', 21: 'present', 22: 'present', 24: 'present', 25: 'present', 26: 'present', 27: 'present', 28: 'present', 29: 'present', 31: 'present' } },
  { id: 's3', name: 'Chandippa Sragvi', initials: 'CS', rollNo: '103', totalLectures: 45, attended: 40, overallPct: 88.8, attendanceMap: { 1: 'present', 2: 'absent', 3: 'present', 4: 'present', 5: 'present', 6: 'absent', 7: 'present', 8: 'present', 10: 'present', 11: 'present', 12: 'present', 13: 'absent', 14: 'present', 15: 'present', 17: 'present', 18: 'absent', 19: 'present', 20: 'present', 21: 'present', 22: 'present', 24: 'present', 25: 'absent', 26: 'present', 27: 'present', 28: 'present', 29: 'present', 31: 'present' } },
  { id: 's4', name: 'Arjun Reddy', initials: 'AR', rollNo: '104', totalLectures: 45, attended: 42, overallPct: 93.3, attendanceMap: { 1: 'present', 2: 'present', 3: 'present', 4: 'present', 5: 'absent', 6: 'present', 7: 'present', 8: 'present', 10: 'present', 11: 'present', 12: 'present', 13: 'present', 14: 'present', 15: 'present', 17: 'present', 18: 'absent', 19: 'present', 20: 'present', 21: 'present', 22: 'present', 24: 'present', 25: 'present', 26: 'present', 27: 'present', 28: 'present', 29: 'present', 31: 'present' } },
  { id: 's5', name: 'Bhavana Patel', initials: 'BP', rollNo: '105', totalLectures: 45, attended: 44, overallPct: 97.7, attendanceMap: { 1: 'present', 2: 'present', 3: 'present', 4: 'present', 5: 'present', 6: 'present', 7: 'present', 8: 'present', 10: 'present', 11: 'present', 12: 'present', 13: 'present', 14: 'present', 15: 'present', 17: 'present', 18: 'present', 19: 'present', 20: 'present', 21: 'present', 22: 'present', 24: 'present', 25: 'present', 26: 'present', 27: 'present', 28: 'present', 29: 'present', 31: 'present' } },
  { id: 's6', name: 'Charan Teja', initials: 'CT', rollNo: '106', totalLectures: 45, attended: 39, overallPct: 86.6, attendanceMap: { 1: 'present', 2: 'absent', 3: 'present', 4: 'partial', 5: 'absent', 6: 'present', 7: 'present', 8: 'present', 10: 'present', 11: 'absent', 12: 'present', 13: 'present', 14: 'present', 15: 'present', 17: 'present', 18: 'absent', 19: 'present', 20: 'present', 21: 'present', 22: 'present', 24: 'present', 25: 'partial', 26: 'present', 27: 'present', 28: 'present', 29: 'present', 31: 'present' } },
  { id: 's7', name: 'Divya Sri', initials: 'DS', rollNo: '107', totalLectures: 45, attended: 43, overallPct: 95.5, attendanceMap: { 1: 'present', 2: 'present', 3: 'present', 4: 'present', 5: 'present', 6: 'present', 7: 'present', 8: 'present', 10: 'present', 11: 'present', 12: 'present', 13: 'present', 14: 'present', 15: 'present', 17: 'present', 18: 'absent', 19: 'present', 20: 'present', 21: 'present', 22: 'present', 24: 'present', 25: 'present', 26: 'present', 27: 'present', 28: 'present', 29: 'present', 31: 'present' } },
  { id: 's8', name: 'Eshwar Rao', initials: 'ER', rollNo: '108', totalLectures: 45, attended: 41, overallPct: 91.1, attendanceMap: { 1: 'present', 2: 'present', 3: 'present', 4: 'present', 5: 'absent', 6: 'present', 7: 'present', 8: 'present', 10: 'present', 11: 'present', 12: 'present', 13: 'present', 14: 'present', 15: 'present', 17: 'present', 18: 'present', 19: 'present', 20: 'present', 21: 'present', 22: 'present', 24: 'present', 25: 'partial', 26: 'present', 27: 'present', 28: 'present', 29: 'present', 31: 'present' } }
];

export const AdminStudentAttendanceScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();
  const isSuperAdmin = user?.role === 'super_admin';

  // Navigation Drill-Down State: 1 = Class Directory, 2 = Student Roster, 3 = Monthly Attendance Calendar Grid
  const [viewLevel, setViewLevel] = useState<1 | 2 | 3>(1);
  const [selectedClass, setSelectedClass] = useState<ClassItemSummary | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentAttendanceRecord | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'All' | '10' | '9' | '8' | '7' | '6'>('All');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(4); // Default 4 Aug
  const [selectedDate, setSelectedDate] = useState('04-08-2026');
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('04-08-2026');

  const [gridMonth, setGridMonth] = useState<number>(7); // 7 = August (0-indexed)
  const [gridYear, setGridYear] = useState<number>(2026);
  const [modalViewDate, setModalViewDate] = useState<Date>(() => new Date(2026, 7, 4));

  const daysInGridMonth = useMemo(() => {
    return new Date(gridYear, gridMonth + 1, 0).getDate();
  }, [gridYear, gridMonth]);

  const handlePrevGridMonth = () => {
    if (gridMonth === 0) {
      setGridMonth(11);
      setGridYear(prev => prev - 1);
    } else {
      setGridMonth(prev => prev - 1);
    }
  };

  const handleNextGridMonth = () => {
    const today = new Date();
    const isCurrentOrFuture = gridYear > today.getFullYear() || (gridYear === today.getFullYear() && gridMonth >= today.getMonth());
    if (isCurrentOrFuture) return;
    if (gridMonth === 11) {
      setGridMonth(0);
      setGridYear(prev => prev + 1);
    } else {
      setGridMonth(prev => prev + 1);
    }
  };

  // No auto-clamp effect here — setSelectedCalendarDay is only called on explicit user press
  // and month navigation handlers guard against invalid days.

  const handlePrevModalMonth = () => {
    setModalViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextModalMonth = () => {
    const today = new Date();
    const isCurrentOrFuture = modalViewDate.getFullYear() > today.getFullYear() || (modalViewDate.getFullYear() === today.getFullYear() && modalViewDate.getMonth() >= today.getMonth());
    if (isCurrentOrFuture) return;
    setModalViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const calendarGridCells = useMemo(() => {
    const firstDayOfWeek = new Date(gridYear, gridMonth, 1).getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const daysInMonth = new Date(gridYear, gridMonth + 1, 0).getDate();

    const cells: Array<{ day: number | null; status?: 'present' | 'partial' | 'absent' | 'off' }> = [];

    // Empty offset padding cells before Day 1
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ day: null });
    }

    // Actual days in month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(gridYear, gridMonth, d);
      const dayOfWeek = dateObj.getDay();
      let status = selectedStudent?.attendanceMap?.[d];

      if (dayOfWeek === 0) {
        status = 'off' as any; // Sundays/Holidays always get gray bg
      } else if (!status) {
        if ((d + gridMonth) % 9 === 0 || d === 5 || d === 18) status = 'absent';
        else if ((d + gridMonth) % 6 === 0 || d === 12 || d === 25) status = 'partial';
        else status = 'present';
      }
      cells.push({ day: d, status: status as any });
    }

    return cells;
  }, [gridMonth, gridYear, selectedStudent]);

  // Selected Date Period Breakdown Calculation
  const selectedDatePeriods = useMemo(() => {
    try {
      if (!selectedStudent || !selectedCalendarDay) {
        const fallbackTemplate = CLASS_TIMETABLE_PERIODS[1] || [];
        return {
          dayName: 'Tuesday',
          formattedDate: `${MONTH_NAMES[gridMonth] || 'August'} ${selectedCalendarDay || 1}, ${gridYear}`,
          isSunday: false,
          status: 'present' as const,
          periods: fallbackTemplate.map(tp => ({ ...tp, status: 'Present' as const })),
          presentCount: fallbackTemplate.length,
          totalCount: fallbackTemplate.length,
        };
      }

      const dateObj = new Date(gridYear, gridMonth, selectedCalendarDay);
      const dayOfWeek = isNaN(dateObj.getTime()) ? 1 : dateObj.getDay(); // 0 = Sun, 1 = Mon, ...
      const dayName = DAY_NAMES[dayOfWeek] || 'Day';
      const monthName = MONTH_NAMES[gridMonth] || 'August';
      const formattedDate = `${dayName}, ${monthName} ${selectedCalendarDay}, ${gridYear}`;

      let dayStatus: 'present' | 'absent' | 'partial' = selectedStudent.attendanceMap?.[selectedCalendarDay] || 'present';
      if (!selectedStudent.attendanceMap?.[selectedCalendarDay]) {
        if (dayOfWeek === 0) {
          // Default Sunday status: absent / weekend off
          dayStatus = 'absent';
        } else if ((selectedCalendarDay + gridMonth) % 9 === 0 || selectedCalendarDay === 5 || selectedCalendarDay === 18) {
          dayStatus = 'absent';
        } else if ((selectedCalendarDay + gridMonth) % 6 === 0 || selectedCalendarDay === 12 || selectedCalendarDay === 25) {
          dayStatus = 'partial';
        } else {
          dayStatus = 'present';
        }
      }

      const templatePeriods = CLASS_TIMETABLE_PERIODS[dayOfWeek] || CLASS_TIMETABLE_PERIODS[1] || [];

      let presentCount = 0;
      const periods: PeriodDetail[] = templatePeriods.map((tp, idx) => {
        let pStatus: 'Present' | 'Absent' = 'Present';
        if (dayStatus === 'absent') {
          pStatus = 'Absent';
        } else if (dayStatus === 'partial') {
          // Morning periods Present, Afternoon periods Absent
          pStatus = idx < 3 ? 'Present' : 'Absent';
        } else {
          pStatus = 'Present';
        }

        if (pStatus === 'Present') {
          presentCount++;
        }

        return {
          ...tp,
          status: pStatus,
        };
      });

      return {
        dayName,
        formattedDate,
        isSunday: dayOfWeek === 0,
        status: dayStatus,
        periods,
        presentCount,
        totalCount: periods.length,
      };
    } catch (e) {
      console.error('Error calculating selectedDatePeriods:', e);
      const fallback = CLASS_TIMETABLE_PERIODS[1] || [];
      return {
        dayName: 'Monday',
        formattedDate: `Selected Day ${selectedCalendarDay}, ${gridYear}`,
        isSunday: false,
        status: 'present' as const,
        periods: fallback.map(tp => ({ ...tp, status: 'Present' as const })),
        presentCount: fallback.length,
        totalCount: fallback.length,
      };
    }
  }, [gridYear, gridMonth, selectedCalendarDay, selectedStudent]);

  // Handle Hardware Back Button & System Back Gesture (matching chevron left behavior)
  useEffect(() => {
    const onBackPress = () => {
      if (showDatePickerModal) {
        setShowDatePickerModal(false);
        return true;
      }
      if (viewLevel === 3) {
        setViewLevel(2);
        return true;
      }
      if (viewLevel === 2) {
        setViewLevel(1);
        return true;
      }
      if (navigation?.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [viewLevel, showDatePickerModal, navigation]);

  // Overall School Stats
  const overallStats = useMemo(() => {
    let totalSecs = MOCK_CLASSES.length;
    let totalStuds = 0;
    let totalPresent = 0;
    let totalAbsent = 0;

    MOCK_CLASSES.forEach(c => {
      totalStuds += c.totalStudents;
      totalPresent += c.presentToday;
      totalAbsent += c.absentToday;
    });

    const avgPct = totalStuds > 0 ? ((totalPresent / totalStuds) * 100).toFixed(1) : '0';
    return { totalSecs, totalStuds, totalPresent, totalAbsent, avgPct };
  }, []);

  // Filtered Classes based on search
  const filteredClasses = MOCK_CLASSES.filter(c => 
    c.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered Class Students based on search
  const filteredStudents = MOCK_CLASS_STUDENTS.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectClass = (c: ClassItemSummary) => {
    setSelectedClass(c);
    setViewLevel(2);
    setSearchQuery('');
  };

  const handleSelectStudent = (s: StudentAttendanceRecord) => {
    setSelectedStudent(s);
    setViewLevel(3);
  };

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';

  return (
    <View style={[styles.container, isSuperAdmin && { backgroundColor: '#101415' }]}>
      <LinearGradient
        colors={isSuperAdmin ? ['#1d2022', '#101415'] : ['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <AdminStaffHeader
        onBackPress={() => {
          if (viewLevel === 3) setViewLevel(2);
          else if (viewLevel === 2) setViewLevel(1);
          else if (navigation?.canGoBack && navigation.canGoBack()) navigation.goBack();
        }}
        title="Student Attendance Console"
        subtitle={
          viewLevel === 1 
            ? "Class Directory & Real-time Attendance" 
            : viewLevel === 2 
            ? `${selectedClass?.className} Student Roster` 
            : `${selectedStudent?.name} Monthly Attendance`
        }
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <School size={20} color={primaryColor} />
          </View>
        }
      />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]} 
        showsVerticalScrollIndicator={false}
      >

        {/* TOP LEVEL OVERVIEW SUMMARY CARDS */}
        {viewLevel === 1 && (
          <View className="px-5 mb-4">
            <GlassCard intensity="low" className={`p-4 border bg-[#101415]/90 rounded-2xl ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/20'}`}>
              <View className="flex-row items-center justify-between border-b border-white/10 pb-3 mb-3">
                <View className="flex-1 mr-2">
                  <Text className="text-white font-extrabold text-base">School Attendance Overview</Text>
                  <Text className="text-white/60 text-xs mt-0.5">Real-time attendance telemetry for today ({selectedDate})</Text>
                </View>
                <Pressable
                  onPress={() => setShowDatePickerModal(true)}
                  className={`px-3 py-1.5 rounded-xl border flex-row items-center ${isSuperAdmin ? 'bg-[#f0c110]/15 border-[#f0c110]/40' : 'bg-[#00f1a1]/15 border-[#00f1a1]/40'}`}
                >
                  <Clock size={14} color={primaryColor} style={{ marginRight: 6 }} />
                  <Text className={`${primaryTextClass} text-sm font-bold`}>{selectedDate}</Text>
                </Pressable>
              </View>

              {/* 4 Stats Grid */}
              <View className="flex-row justify-between" style={{ gap: 8 }}>
                <View className="flex-1 bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/50 text-xs uppercase font-black mb-0.5">Classes</Text>
                  <Text className="text-white text-lg font-black font-mono">{overallStats.totalSecs}</Text>
                  <Text className="text-white/60 text-xs font-semibold">Sections</Text>
                </View>

                <View className="flex-1 bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/50 text-xs uppercase font-black mb-0.5">Total</Text>
                  <Text className="text-sky-400 text-lg font-black font-mono">{overallStats.totalStuds}</Text>
                  <Text className="text-white/60 text-xs font-semibold">Enrolled</Text>
                </View>

                <View className="flex-1 bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/50 text-xs uppercase font-black mb-0.5">Present</Text>
                  <Text className={`${primaryTextClass} text-lg font-black font-mono`}>{overallStats.totalPresent}</Text>
                  <Text className="text-white/60 text-xs font-semibold">{overallStats.avgPct}%</Text>
                </View>

                <View className="flex-1 bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/50 text-xs uppercase font-black mb-0.5">Absent</Text>
                  <Text className="text-rose-400 text-lg font-black font-mono">{overallStats.totalAbsent}</Text>
                  <Text className="text-rose-400/80 text-xs font-semibold">Alert</Text>
                </View>
              </View>
            </GlassCard>
          </View>
        )}

        {/* LEVEL 2 HEADER: SELECTED CLASS SUMMARY */}
        {viewLevel === 2 && selectedClass && (
          <View className="px-5 mb-4">
            <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/90">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-3 ${primaryBadgeClass}`}>
                    <Text className={`${primaryTextClass} font-black text-base`}>{selectedClass.className.replace('Class ', '')}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-extrabold text-base">{selectedClass.className}</Text>
                    <Text className="text-white/60 text-sm mt-0.5">Class Teacher: {selectedClass.teacherName}</Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className={`${primaryTextClass} text-lg font-black font-mono`}>{selectedClass.todayAvg}%</Text>
                  <Text className="text-white/60 text-xs font-semibold">Today Avg</Text>
                </View>
              </View>
            </GlassCard>
          </View>
        )}

        {/* LEVEL 3 HEADER: SELECTED STUDENT SUMMARY */}
        {viewLevel === 3 && selectedStudent && (
          <View className="px-5 mb-4">
            <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/90">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-3 ${primaryBadgeClass}`}>
                    <Text className={`${primaryTextClass} font-black text-base`}>{selectedStudent.initials}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-white font-extrabold text-base mr-2">{selectedStudent.name}</Text>
                      <View className="bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-md">
                        <Text className="text-sky-300 text-xs font-bold">Roll #{selectedStudent.rollNo}</Text>
                      </View>
                    </View>
                    <Text className="text-white/60 text-xs mt-1">{selectedClass?.className || 'Class 10A'} • Attended: {selectedStudent.attended}/{selectedStudent.totalLectures} Days</Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className={`${primaryTextClass} text-xl font-black font-mono`}>{selectedStudent.overallPct}%</Text>
                  <Text className="text-white/60 text-xs font-semibold">Overall Rate</Text>
                </View>
              </View>
            </GlassCard>
          </View>
        )}

        {/* LEVEL 1: CLASS DIRECTORY LIST */}
        {viewLevel === 1 && (
          <View className="px-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white/70 text-xs font-black uppercase tracking-wider">Class Directory ({filteredClasses.length})</Text>
            </View>

            {filteredClasses.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleSelectClass(item)}
                className={`mb-3.5 p-4 rounded-2xl border bg-[#101415]/90 flex-row items-center justify-between active:scale-[0.98] ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-white/10'}`}
              >
                <View className="flex-row items-center flex-1 mr-2 min-w-0">
                  <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-3 flex-shrink-0 ${primaryBadgeClass}`}>
                    <Text className={`${primaryTextClass} font-black text-base`}>{item.className.replace('Class ', '')}</Text>
                  </View>

                  <View className="flex-1 min-w-0">
                    <Text className="text-white font-extrabold text-base" numberOfLines={1}>{item.className}</Text>
                    <Text className="text-white/60 text-xs mt-0.5 font-medium" numberOfLines={1}>{item.teacherName}</Text>
                    <View className="flex-row items-center flex-wrap mt-1.5" style={{ gap: 8 }}>
                      <Text className="text-white/70 text-xs font-medium">Students: <Text className="text-white font-bold">{item.totalStudents}</Text></Text>
                      <Text className="text-emerald-400 text-xs font-medium">Present: <Text className="font-bold">{item.presentToday}</Text></Text>
                      <Text className="text-rose-400 text-xs font-medium">Absent: <Text className="font-bold">{item.absentToday}</Text></Text>
                    </View>
                  </View>
                </View>

                <View className="items-end flex-shrink-0">
                  <View className="flex-row items-center mb-1">
                    <Text className={`${primaryTextClass} font-black text-base font-mono mr-1`}>{item.todayAvg}%</Text>
                    <ChevronRight size={14} color={primaryColor} />
                  </View>
                  <Text className="text-white/50 text-xs font-semibold">Attendance</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* LEVEL 2: CLASS STUDENT ROSTER LIST */}
        {viewLevel === 2 && (
          <View className="px-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white/70 text-xs font-black uppercase tracking-wider">Student Roster ({filteredStudents.length})</Text>
            </View>

            {filteredStudents.map((stud) => (
              <Pressable
                key={stud.id}
                onPress={() => handleSelectStudent(stud)}
                className="mb-3 p-4 rounded-2xl border border-white/10 bg-[#101415]/90 flex-row items-center justify-between active:scale-[0.98]"
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-3 ${primaryBadgeClass}`}>
                    <Text className={`${primaryTextClass} font-black text-sm`}>{stud.initials}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-extrabold text-base">{stud.name}</Text>
                    <Text className="text-white/60 text-xs mt-0.5 font-medium">Roll #{stud.rollNo} • Attended {stud.attended}/{stud.totalLectures} Days</Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className={`${primaryTextClass} text-base font-black font-mono`}>{stud.overallPct}%</Text>
                  <Text className="text-white/50 text-xs font-semibold">Overall Rate</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* LEVEL 3: MONTHLY ATTENDANCE GRID VIEW FOR SELECTED STUDENT */}
        {viewLevel === 3 && selectedStudent && (
          <View className="px-5">
            <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/90 mb-4">
              {/* Header with Legend */}
              <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-3">
                <Text className="text-white font-extrabold text-base">Monthly Attendance Grid</Text>
                <View className="flex-row items-center" style={{ gap: 10 }}>
                  <View className="flex-row items-center">
                    <View className={`w-2.5 h-2.5 rounded-full mr-1.5 ${isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]'}`} />
                    <Text className="text-white/70 text-xs font-bold">Present</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5" />
                    <Text className="text-white/70 text-xs font-bold">Partial</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5" />
                    <Text className="text-white/70 text-xs font-bold">Absent</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-2.5 rounded-full bg-white/40 mr-1.5" />
                    <Text className="text-white/50 text-xs font-bold">Off</Text>
                  </View>
                </View>
              </View>

              {/* Month Navigation */}
              <View className="flex-row justify-between items-center mb-4">
                <Pressable onPress={handlePrevGridMonth} className="p-2 rounded-xl bg-white/5 border border-white/10 active:bg-white/15">
                  <ChevronLeft size={18} color={primaryColor} />
                </Pressable>
                <Text className="text-white font-extrabold text-sm">{MONTH_NAMES[gridMonth]} {gridYear}</Text>
                {(() => {
                  const today = new Date();
                  const isCurrentOrFuture = gridYear > today.getFullYear() || (gridYear === today.getFullYear() && gridMonth >= today.getMonth());
                  return (
                    <Pressable
                      onPress={handleNextGridMonth}
                      disabled={isCurrentOrFuture}
                      className={`p-2 rounded-xl bg-white/5 border border-white/10 ${isCurrentOrFuture ? 'opacity-25' : 'active:bg-white/15'}`}
                    >
                      <ChevronRight size={18} color={primaryColor} />
                    </Pressable>
                  );
                })()}
              </View>

              {/* Calendar Grid Container */}
              <View>
                {/* Days Header Row */}
                <View className="flex-row justify-between mb-2">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
                    <Text key={d} className={`w-[14.28%] text-center text-xs font-black uppercase ${i === 0 ? 'text-rose-400' : 'text-white/50'}`}>{d}</Text>
                  ))}
                </View>

                {/* Real Calendar Days Grid */}
                <View className="flex-row flex-wrap" style={{ margin: -2 }}>
                  {calendarGridCells.map((item, idx) => {
                    if (item.day === null) {
                      return (
                        <View key={`pad_${idx}`} className="w-[14.28%] p-1">
                          <View className="h-11 border border-transparent rounded-xl" />
                        </View>
                      );
                    }

                    const dayNum = item.day;
                    const status = item.status;
                    const isSelected = selectedCalendarDay === dayNum;
                    const today = new Date();
                    const cellDate = new Date(gridYear, gridMonth, dayNum);
                    today.setHours(23, 59, 59, 999);
                    const isFuture = cellDate > today;

                    let bgStyle = primaryBadgeClass;
                    let textStyle = primaryTextClass;
                    if (status === 'partial') {
                      bgStyle = 'bg-amber-500/20 border-amber-500/40';
                      textStyle = 'text-amber-400';
                    } else if (status === 'absent') {
                      bgStyle = 'bg-rose-500/20 border-rose-500/40';
                      textStyle = 'text-rose-400';
                    } else if (status === 'off') {
                      bgStyle = 'bg-white/5 border-white/10';
                      textStyle = 'text-white/40';
                    }

                    return (
                      <View key={`day_${dayNum}`} className="w-[14.28%] p-1">
                        <Pressable
                          disabled={isFuture}
                          onPress={() => {
                            if (!isFuture) {
                              setSelectedCalendarDay(dayNum);
                              const dayStr = String(dayNum).padStart(2, '0');
                              const monthStr = String(gridMonth + 1).padStart(2, '0');
                              setSelectedDate(`${dayStr}-${monthStr}-${gridYear}`);
                            }
                          }}
                          className={`h-11 rounded-xl items-center justify-center border ${
                            isFuture
                              ? 'opacity-20 bg-white/5 border-transparent'
                              : isSelected 
                              ? (isSuperAdmin ? 'border-[#f0c110] bg-[#f0c110]/30 shadow-lg' : 'border-[#00f1a1] bg-[#00f1a1]/30 shadow-lg')
                              : bgStyle
                          }`}
                        >
                          <Text className={`text-sm font-black ${isFuture ? 'text-white/30' : isSelected ? 'text-white' : textStyle}`}>
                            {dayNum}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            </GlassCard>

            {/* Bottom Section: Period-Wise Breakdown for Selected Date */}
            <GlassCard intensity="low" className={`p-4 border bg-[#101415]/90 mb-4 rounded-2xl ${isSuperAdmin ? 'border-[#f0c110]/25' : 'border-[#00f1a1]/25'}`}>
              <View className="flex-row items-center justify-between border-b border-white/10 pb-3 mb-3">
                <View className="flex-1 mr-2">
                  <Text className="text-white text-base font-extrabold" numberOfLines={1}>
                    {selectedDatePeriods.formattedDate}
                  </Text>
                  <Text className="text-white/60 text-xs mt-0.5 font-medium">
                    {selectedClass?.className || 'Class 10A'} • Period Timetable Breakdown
                  </Text>
                </View>

                {/* Overall Day Status Badge */}
                {selectedDatePeriods.status === 'absent' ? (
                  <View className="bg-rose-500/20 border border-rose-500/40 px-3 py-1.5 rounded-xl flex-row items-center">
                    <AlertCircle size={14} color="#f43f5e" style={{ marginRight: 5 }} />
                    <Text className="text-rose-400 text-xs font-black">
                      {selectedDatePeriods.isSunday ? 'Sunday • Absent' : `Full Day Absent (0/${selectedDatePeriods.totalCount})`}
                    </Text>
                  </View>
                ) : selectedDatePeriods.status === 'partial' ? (
                  <View className="bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-xl flex-row items-center">
                    <Clock size={14} color="#fbbf24" style={{ marginRight: 5 }} />
                    <Text className="text-amber-400 text-xs font-black">
                      Partial ({selectedDatePeriods.presentCount}/{selectedDatePeriods.totalCount} Present)
                    </Text>
                  </View>
                ) : (
                  <View className="bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-xl flex-row items-center">
                    <CheckCircle2 size={14} color="#10B981" style={{ marginRight: 5 }} />
                    <Text className="text-emerald-400 text-xs font-black">
                      Full Day Present ({selectedDatePeriods.presentCount}/{selectedDatePeriods.totalCount})
                    </Text>
                  </View>
                )}
              </View>

              {/* Period List Items */}
              <View style={{ gap: 8 }}>
                {selectedDatePeriods.periods && selectedDatePeriods.periods.length > 0 ? (
                  selectedDatePeriods.periods.map((p) => {
                    const isPresent = p.status === 'Present';
                    return (
                      <View 
                        key={p.periodNumber} 
                        className={`p-3.5 rounded-xl border flex-row justify-between items-center ${
                          isPresent 
                            ? 'bg-emerald-950/15 border-emerald-500/20' 
                            : 'bg-rose-950/15 border-rose-500/25'
                        }`}
                      >
                        <View className="flex-row items-center flex-1 mr-3">
                          <View 
                            className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${
                              isPresent 
                                ? 'bg-emerald-500/20 border border-emerald-500/40' 
                                : 'bg-rose-500/20 border border-rose-500/40'
                            }`}
                          >
                            <Text className={`${isPresent ? 'text-emerald-400' : 'text-rose-400'} text-xs font-black font-mono`}>
                              P{p.periodNumber}
                            </Text>
                          </View>

                          <View className="flex-1">
                            <Text className="text-white font-extrabold text-sm">{p.subject}</Text>
                            <Text className="text-white/60 text-xs mt-0.5 font-medium">
                              {p.time} • {p.teacher} • <Text className="text-white/40">{p.room}</Text>
                            </Text>
                          </View>
                        </View>

                        <View 
                          className={`px-3 py-1.5 rounded-xl border flex-row items-center ${
                            isPresent 
                              ? 'bg-emerald-500/20 border-emerald-500/40' 
                              : 'bg-rose-500/20 border-rose-500/40'
                          }`}
                        >
                          {isPresent ? (
                            <CheckCircle2 size={13} color="#10B981" style={{ marginRight: 4 }} />
                          ) : (
                            <AlertCircle size={13} color="#f43f5e" style={{ marginRight: 4 }} />
                          )}
                          <Text className={`${isPresent ? 'text-emerald-400' : 'text-rose-400'} text-xs font-black`}>
                            {p.status}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View className="p-4 rounded-xl bg-white/5 border border-white/10 items-center">
                    <Text className="text-white/60 text-xs">No periods recorded for this date.</Text>
                  </View>
                )}
              </View>
            </GlassCard>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* DATE PICKER MODAL */}
      <Modal visible={showDatePickerModal} transparent animationType="slide" onRequestClose={() => setShowDatePickerModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-sm p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-2xl' : 'border-[#00f1a1]/40 shadow-2xl'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <View className="flex-row items-center">
                <View className={`w-9 h-9 rounded-xl items-center justify-center mr-2.5 ${primaryBadgeClass}`}>
                  <Clock size={18} color={primaryColor} />
                </View>
                <Text className="text-white font-extrabold text-base">Select Attendance Date</Text>
              </View>
              <Pressable onPress={() => setShowDatePickerModal(false)} className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                <X size={16} color="#ffffff" />
              </Pressable>
            </View>

            {/* Month Year Ribbon */}
            <View className="flex-row justify-between items-center bg-white/5 p-3 rounded-2xl mb-3 border border-white/10">
              <Pressable onPress={handlePrevModalMonth} className="p-1.5 border border-white/10 rounded-lg bg-white/5 active:bg-white/20">
                <ChevronLeft size={18} color={primaryColor} />
              </Pressable>
              <Text className="text-white font-extrabold text-sm">
                {modalViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              {(() => {
                const today = new Date();
                const isCurrentOrFuture = modalViewDate.getFullYear() > today.getFullYear() || (modalViewDate.getFullYear() === today.getFullYear() && modalViewDate.getMonth() >= today.getMonth());
                return (
                  <Pressable
                    onPress={handleNextModalMonth}
                    disabled={isCurrentOrFuture}
                    className={`p-1.5 border border-white/10 rounded-lg bg-white/5 ${isCurrentOrFuture ? 'opacity-25' : 'active:bg-white/20'}`}
                  >
                    <ChevronRight size={18} color={primaryColor} />
                  </Pressable>
                );
              })()}
            </View>

            {/* 7-Column Days Header */}
            <View className="flex-row mb-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
                <View key={i} style={{ width: '14.28%', alignItems: 'center' }}>
                  <Text className={`text-xs font-black uppercase ${i === 0 ? 'text-rose-400' : 'text-white/50'}`}>{d}</Text>
                </View>
              ))}
            </View>

            {/* 7-Column Calendar Days Grid with Future Disabled */}
            {(() => {
              const y = modalViewDate.getFullYear();
              const m = modalViewDate.getMonth();
              const firstDay = new Date(y, m, 1).getDay();
              const daysInM = new Date(y, m + 1, 0).getDate();
              const cells: (number | null)[] = [];
              for (let i = 0; i < firstDay; i++) cells.push(null);
              for (let d = 1; d <= daysInM; d++) cells.push(d);

              const now = new Date();
              now.setHours(23, 59, 59, 999);

              return (
                <View className="flex-row flex-wrap mb-4">
                  {cells.map((dayNum, idx) => {
                    if (!dayNum) {
                      return <View key={idx} style={{ width: '14.28%', height: 40 }} />;
                    }

                    const dayStr = String(dayNum).padStart(2, '0');
                    const monthStr = String(m + 1).padStart(2, '0');
                    const formattedDateStr = `${dayStr}-${monthStr}-${y}`;
                    const isSelected = selectedDate === formattedDateStr;
                    const cellDate = new Date(y, m, dayNum);
                    const isFuture = cellDate > now;

                    return (
                      <View key={idx} style={{ width: '14.28%', height: 40, padding: 2 }}>
                        <Pressable
                          disabled={isFuture}
                          onPress={() => {
                            if (!isFuture) {
                              setSelectedDate(formattedDateStr);
                              setCustomDateInput(formattedDateStr);
                              setShowDatePickerModal(false);
                            }
                          }}
                          className={`w-full h-full rounded-xl items-center justify-center border ${
                            isFuture
                              ? 'opacity-20 bg-white/5 border-transparent'
                              : isSelected
                              ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]')
                              : 'bg-white/5 border-white/10 active:bg-white/20'
                          }`}
                        >
                          <Text className={`text-sm font-black ${isFuture ? 'text-white/30' : isSelected ? 'text-[#101415]' : 'text-white'}`}>
                            {dayNum}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              );
            })()}

            <View className="flex-row border-t border-white/10 pt-3">
              <Pressable onPress={() => setShowDatePickerModal(false)} className="w-full py-3 rounded-xl bg-white/10 items-center active:bg-white/20">
                <Text className="text-white font-extrabold text-sm">Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d2a24',
  },
  scrollContent: {
    paddingTop: 16,
  },
});

export default AdminStudentAttendanceScreen;
