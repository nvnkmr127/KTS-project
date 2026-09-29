import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  School,
  AlertTriangle,
  ShieldCheck,
  ChevronLeft,
  Clock,
  Info,
  X,
  Search,
  Calendar,
  User,
  Users,
  Building2,
  BookOpen,
} from 'lucide-react-native';
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

export interface PeriodDetail {
  periodNumber: number;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  status: 'Present' | 'Absent';
}

const CLASS_TIMETABLE_PERIODS: Record<number, Omit<PeriodDetail, 'status'>[]> = {
  0: [
    { periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Mathematics Problem Solving', teacher: 'Mrs. Anita Sharma', room: 'Room 204' },
    { periodNumber: 2, time: '09:45 AM - 10:30 AM', subject: 'Physics Doubt Clearing', teacher: 'Mr. Rajesh Kumar', room: 'Physics Lab' },
    { periodNumber: 3, time: '10:45 AM - 11:30 AM', subject: 'Chemistry Revision', teacher: 'Dr. Meenakshi Sundaram', room: 'Chem Lab' },
    { periodNumber: 4, time: '11:30 AM - 12:15 PM', subject: 'English Literature Workshop', teacher: 'Mrs. Priya Nambiar', room: 'Room 204' },
    { periodNumber: 5, time: '01:15 PM - 02:00 PM', subject: 'Biology Seminar', teacher: 'Mr. Vikramaditya Singh', room: 'Bio Lab' },
    { periodNumber: 6, time: '02:00 PM - 02:45 PM', subject: 'Computer Applications Lab', teacher: 'Mrs. Sarah Jenkins', room: 'Comp Lab' },
    { periodNumber: 7, time: '02:45 PM - 03:30 PM', subject: 'Physical Fitness & Sports', teacher: 'Mr. Ramesh Varma', room: 'Sports Ground' },
  ],
  1: [
    { periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Mathematics', teacher: 'Mrs. Anita Sharma', room: 'Room 204' },
    { periodNumber: 2, time: '09:45 AM - 10:30 AM', subject: 'Physics', teacher: 'Mr. Rajesh Kumar', room: 'Physics Lab' },
    { periodNumber: 3, time: '10:45 AM - 11:30 AM', subject: 'Chemistry', teacher: 'Dr. Meenakshi Sundaram', room: 'Chem Lab' },
    { periodNumber: 4, time: '11:30 AM - 12:15 PM', subject: 'English Literature', teacher: 'Mrs. Priya Nambiar', room: 'Room 204' },
    { periodNumber: 5, time: '01:15 PM - 02:00 PM', subject: 'Biology', teacher: 'Mr. Vikramaditya Singh', room: 'Bio Lab' },
    { periodNumber: 6, time: '02:00 PM - 02:45 PM', subject: 'Computer Science', teacher: 'Mrs. Sarah Jenkins', room: 'Comp Lab' },
    { periodNumber: 7, time: '02:45 PM - 03:30 PM', subject: 'Physical Education', teacher: 'Mr. Ramesh Varma', room: 'Sports Ground' },
  ],
  2: [
    { periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Physics', teacher: 'Mr. Rajesh Kumar', room: 'Physics Lab' },
    { periodNumber: 2, time: '09:45 AM - 10:30 AM', subject: 'Mathematics', teacher: 'Mrs. Anita Sharma', room: 'Room 204' },
    { periodNumber: 3, time: '10:45 AM - 11:30 AM', subject: 'English Literature', teacher: 'Mrs. Priya Nambiar', room: 'Room 204' },
    { periodNumber: 4, time: '11:30 AM - 12:15 PM', subject: 'Chemistry', teacher: 'Dr. Meenakshi Sundaram', room: 'Chem Lab' },
    { periodNumber: 5, time: '01:15 PM - 02:00 PM', subject: 'Social Science', teacher: 'Mr. Vikramaditya Singh', room: 'Room 204' },
    { periodNumber: 6, time: '02:00 PM - 02:45 PM', subject: 'Second Language', teacher: 'Mrs. Sunita Rao', room: 'Room 204' },
    { periodNumber: 7, time: '02:45 PM - 03:30 PM', subject: 'Library & Research', teacher: 'Mrs. Priya Nambiar', room: 'Library' },
  ],
  3: [
    { periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Chemistry', teacher: 'Dr. Meenakshi Sundaram', room: 'Chem Lab' },
    { periodNumber: 2, time: '09:45 AM - 10:30 AM', subject: 'Mathematics', teacher: 'Mrs. Anita Sharma', room: 'Room 204' },
    { periodNumber: 3, time: '10:45 AM - 11:30 AM', subject: 'Biology', teacher: 'Mr. Vikramaditya Singh', room: 'Bio Lab' },
    { periodNumber: 4, time: '11:30 AM - 12:15 PM', subject: 'Physics', teacher: 'Mr. Rajesh Kumar', room: 'Physics Lab' },
    { periodNumber: 5, time: '01:15 PM - 02:00 PM', subject: 'Computer Applications', teacher: 'Mrs. Sarah Jenkins', room: 'Comp Lab' },
    { periodNumber: 6, time: '02:00 PM - 02:45 PM', subject: 'English Literature', teacher: 'Mrs. Priya Nambiar', room: 'Room 204' },
    { periodNumber: 7, time: '02:45 PM - 03:30 PM', subject: 'Art & Design', teacher: 'Mrs. Kavita Patel', room: 'Art Studio' },
  ],
  4: [
    { periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Mathematics', teacher: 'Mrs. Anita Sharma', room: 'Room 204' },
    { periodNumber: 2, time: '09:45 AM - 10:30 AM', subject: 'Physics', teacher: 'Mr. Rajesh Kumar', room: 'Physics Lab' },
    { periodNumber: 3, time: '10:45 AM - 11:30 AM', subject: 'Social Science', teacher: 'Mr. Vikramaditya Singh', room: 'Room 204' },
    { periodNumber: 4, time: '11:30 AM - 12:15 PM', subject: 'Chemistry', teacher: 'Dr. Meenakshi Sundaram', room: 'Chem Lab' },
    { periodNumber: 5, time: '01:15 PM - 02:00 PM', subject: 'Second Language', teacher: 'Mrs. Sunita Rao', room: 'Room 204' },
    { periodNumber: 6, time: '02:00 PM - 02:45 PM', subject: 'English Grammar', teacher: 'Mrs. Priya Nambiar', room: 'Room 204' },
    { periodNumber: 7, time: '02:45 PM - 03:30 PM', subject: 'Sports & Athletics', teacher: 'Mr. Ramesh Varma', room: 'Sports Ground' },
  ],
  5: [
    { periodNumber: 1, time: '09:00 AM - 09:45 AM', subject: 'Biology', teacher: 'Mr. Vikramaditya Singh', room: 'Bio Lab' },
    { periodNumber: 2, time: '09:45 AM - 10:30 AM', subject: 'Chemistry', teacher: 'Dr. Meenakshi Sundaram', room: 'Chem Lab' },
    { periodNumber: 3, time: '10:45 AM - 11:30 AM', subject: 'Mathematics', teacher: 'Mrs. Anita Sharma', room: 'Room 204' },
    { periodNumber: 4, time: '11:30 AM - 12:15 PM', subject: 'Physics', teacher: 'Mr. Rajesh Kumar', room: 'Physics Lab' },
    { periodNumber: 5, time: '01:15 PM - 02:00 PM', subject: 'Computer Science', teacher: 'Mrs. Sarah Jenkins', room: 'Comp Lab' },
    { periodNumber: 6, time: '02:00 PM - 02:45 PM', subject: 'Environmental Studies', teacher: 'Mrs. Anita Sharma', room: 'Room 204' },
    { periodNumber: 7, time: '02:45 PM - 03:30 PM', subject: 'Club Activities / Debate', teacher: 'Mrs. Priya Nambiar', room: 'Auditorium' },
  ],
  6: [
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
  { id: 'c15', className: 'Class 8A', grade: 'Class 8', section: 'A', teacherName: 'M Surender', totalStudents: 44, presentToday: 43, absentToday: 1, todayAvg: 97.7 },
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

export const TeacherStudentAttendanceScreen: React.FC<any> = ({ navigation }) => {
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle, headerPaddingTop, horizontalPadding } = useResponsive();
  const { user } = useAuthStore();

  // Navigation Drill-Down State: 1 = Class Directory, 2 = Student Roster, 3 = Monthly Attendance Calendar Grid
  const [viewLevel, setViewLevel] = useState<1 | 2 | 3>(1);
  const [selectedClass, setSelectedClass] = useState<ClassItemSummary | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentAttendanceRecord | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(4);
  const [selectedDate, setSelectedDate] = useState('04-08-2026');
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  const [gridMonth, setGridMonth] = useState<number>(7); // 7 = August (0-indexed)
  const [gridYear, setGridYear] = useState<number>(2026);
  const [modalViewDate, setModalViewDate] = useState<Date>(() => new Date(2026, 7, 4));

  const handlePrevGridMonth = () => {
    if (gridMonth === 0) {
      setGridMonth(11);
      setGridYear((prev) => prev - 1);
    } else {
      setGridMonth((prev) => prev - 1);
    }
  };

  const handleNextGridMonth = () => {
    const today = new Date();
    const isCurrentOrFuture =
      gridYear > today.getFullYear() ||
      (gridYear === today.getFullYear() && gridMonth >= today.getMonth());
    if (isCurrentOrFuture) return;
    if (gridMonth === 11) {
      setGridMonth(0);
      setGridYear((prev) => prev + 1);
    } else {
      setGridMonth((prev) => prev + 1);
    }
  };

  const handlePrevModalMonth = () => {
    setModalViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextModalMonth = () => {
    const today = new Date();
    const isCurrentOrFuture =
      modalViewDate.getFullYear() > today.getFullYear() ||
      (modalViewDate.getFullYear() === today.getFullYear() &&
        modalViewDate.getMonth() >= today.getMonth());
    if (isCurrentOrFuture) return;
    setModalViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const calendarGridCells = useMemo(() => {
    const firstDayOfWeek = new Date(gridYear, gridMonth, 1).getDay();
    const daysInMonth = new Date(gridYear, gridMonth + 1, 0).getDate();

    const cells: Array<{ day: number | null; status?: 'present' | 'partial' | 'absent' | 'off' }> = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ day: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(gridYear, gridMonth, d);
      const dayOfWeek = dateObj.getDay();
      let status = selectedStudent?.attendanceMap?.[d];

      if (dayOfWeek === 0) {
        status = 'off' as any;
      } else if (!status) {
        if ((d + gridMonth) % 9 === 0 || d === 5 || d === 18) status = 'absent';
        else if ((d + gridMonth) % 6 === 0 || d === 12 || d === 25) status = 'partial';
        else status = 'present';
      }
      cells.push({ day: d, status: status as any });
    }

    return cells;
  }, [gridMonth, gridYear, selectedStudent]);

  const selectedDatePeriods = useMemo(() => {
    try {
      if (!selectedStudent || !selectedCalendarDay) {
        const fallbackTemplate = CLASS_TIMETABLE_PERIODS[1] || [];
        return {
          dayName: 'Tuesday',
          formattedDate: `${MONTH_NAMES[gridMonth] || 'August'} ${selectedCalendarDay || 1}, ${gridYear}`,
          isSunday: false,
          status: 'present' as const,
          periods: fallbackTemplate.map((tp) => ({ ...tp, status: 'Present' as const })),
          presentCount: fallbackTemplate.length,
          totalCount: fallbackTemplate.length,
        };
      }

      const dateObj = new Date(gridYear, gridMonth, selectedCalendarDay);
      const dayOfWeek = isNaN(dateObj.getTime()) ? 1 : dateObj.getDay();
      const dayName = DAY_NAMES[dayOfWeek] || 'Day';
      const monthName = MONTH_NAMES[gridMonth] || 'August';
      const formattedDate = `${dayName}, ${monthName} ${selectedCalendarDay}, ${gridYear}`;

      let dayStatus: 'present' | 'absent' | 'partial' =
        selectedStudent.attendanceMap?.[selectedCalendarDay] || 'present';
      if (!selectedStudent.attendanceMap?.[selectedCalendarDay]) {
        if (dayOfWeek === 0) {
          dayStatus = 'absent';
        } else if (
          (selectedCalendarDay + gridMonth) % 9 === 0 ||
          selectedCalendarDay === 5 ||
          selectedCalendarDay === 18
        ) {
          dayStatus = 'absent';
        } else if (
          (selectedCalendarDay + gridMonth) % 6 === 0 ||
          selectedCalendarDay === 12 ||
          selectedCalendarDay === 25
        ) {
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
        periods: fallback.map((tp) => ({ ...tp, status: 'Present' as const })),
        presentCount: fallback.length,
        totalCount: fallback.length,
      };
    }
  }, [gridYear, gridMonth, selectedCalendarDay, selectedStudent]);

  // Handle Hardware Back Button
  useFocusEffect(
    React.useCallback(() => {
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
    }, [viewLevel, showDatePickerModal, navigation])
  );

  const overallStats = useMemo(() => {
    let totalSecs = MOCK_CLASSES.length;
    let totalStuds = 0;
    let totalPresent = 0;
    let totalAbsent = 0;

    MOCK_CLASSES.forEach((c) => {
      totalStuds += c.totalStudents;
      totalPresent += c.presentToday;
      totalAbsent += c.absentToday;
    });

    const avgPct = totalStuds > 0 ? ((totalPresent / totalStuds) * 100).toFixed(1) : '0';
    return { totalSecs, totalStuds, totalPresent, totalAbsent, avgPct };
  }, []);

  const filteredClasses = MOCK_CLASSES.filter(
    (c) =>
      c.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = MOCK_CLASS_STUDENTS.filter(
    (s) =>
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

  return (
    <View style={styles.container}>
      {/* Background Deep Gradient */}
      <LinearGradient
        colors={["#22143d", "#150d26", "#0b0912", "#08070d"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER (Matching Examination Screen Header) */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={40} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <Pressable
                onPress={() => {
                  if (viewLevel === 3) setViewLevel(2);
                  else if (viewLevel === 2) setViewLevel(1);
                  else if (navigation?.canGoBack && navigation.canGoBack()) navigation.goBack();
                  else navigation.navigate('Dashboard');
                }}
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center mr-3 active:bg-white/20"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color="#ddb7ff" />
              </Pressable>

              <View className="flex-1 justify-center">
                <Text className="text-white text-lg md:text-xl font-extrabold" numberOfLines={1} style={{ includeFontPadding: false }}>
                  Student Attendance
                </Text>
                <View className="flex-row items-center mt-0.5" style={{ flexWrap: "nowrap" }}>
                  <View className="w-2 h-2 rounded-full bg-[#00f1a1] mr-1.5" style={{ flexShrink: 0 }} />
                  <Text
                    className="text-[#ddb7ff] text-xs font-semibold flex-1"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                    style={{ flexShrink: 1, includeFontPadding: false }}
                  >
                    {viewLevel === 1
                      ? 'Class Directory & Real-time Attendance'
                      : viewLevel === 2
                      ? `${selectedClass?.className || 'Class'} Student Roster`
                      : `${selectedStudent?.name || 'Student'} Monthly Attendance`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </View>

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: Math.max(scrollBottomPadding + 40, 90),
          paddingTop: 10,
          paddingHorizontal: 12,
        }}
        showsVerticalScrollIndicator={true}
        className="flex-1"
      >
        {/* LEVEL 1: OVERVIEW TELEMETRY CARDS */}
        {viewLevel === 1 && (
          <View className="mb-4">
            <View className="p-4 border border-[#ddb7ff]/20 bg-[#181524] rounded-2xl shadow-lg mb-3">
              <View className="flex-row items-center justify-between border-b border-white/10 pb-3 mb-3">
                <View className="flex-1 mr-2">
                  <Text className="text-white font-extrabold text-base">School Attendance Overview</Text>
                  <Text className="text-white/60 text-xs mt-0.5">
                    Real-time attendance telemetry for today ({selectedDate})
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowDatePickerModal(true)}
                  className="px-3 py-1.5 rounded-xl border border-[#ddb7ff]/40 bg-[#ddb7ff]/15 flex-row items-center active:bg-[#ddb7ff]/25"
                >
                  <Clock size={13} color="#ddb7ff" style={{ marginRight: 5 }} />
                  <Text className="text-[#ddb7ff] text-xs font-black">{selectedDate}</Text>
                </Pressable>
              </View>

              {/* 4 Stats Grid */}
              <View className="flex-row justify-between" style={{ gap: 8 }}>
                <View className="flex-1 bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/50 text-[10px] uppercase font-black mb-0.5">Classes</Text>
                  <Text className="text-white text-base font-black font-mono">{overallStats.totalSecs}</Text>
                  <Text className="text-white/60 text-[10px] font-semibold">Sections</Text>
                </View>

                <View className="flex-1 bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/50 text-[10px] uppercase font-black mb-0.5">Total</Text>
                  <Text className="text-sky-400 text-base font-black font-mono">{overallStats.totalStuds}</Text>
                  <Text className="text-white/60 text-[10px] font-semibold">Enrolled</Text>
                </View>

                <View className="flex-1 bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/50 text-[10px] uppercase font-black mb-0.5">Present</Text>
                  <Text className="text-[#34d399] text-base font-black font-mono">{overallStats.totalPresent}</Text>
                  <Text className="text-white/60 text-[10px] font-semibold">{overallStats.avgPct}%</Text>
                </View>

                <View className="flex-1 bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/50 text-[10px] uppercase font-black mb-0.5">Absent</Text>
                  <Text className="text-rose-400 text-base font-black font-mono">{overallStats.totalAbsent}</Text>
                  <Text className="text-rose-400/80 text-[10px] font-semibold">Alert</Text>
                </View>
              </View>
            </View>

            {/* CLASS DIRECTORY LIST */}
            <View className="flex-row justify-between items-center mb-2.5 px-1">
              <Text className="text-white/70 text-xs font-black uppercase tracking-wider">
                Class Directory ({filteredClasses.length})
              </Text>
            </View>

            {filteredClasses.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleSelectClass(item)}
                className="mb-3 p-4 rounded-2xl border border-white/10 bg-[#181524] flex-row items-center justify-between active:scale-[0.98] shadow-md"
              >
                <View className="flex-row items-center flex-1 mr-2 min-w-0">
                  <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3 flex-shrink-0 bg-[#ddb7ff]/20 border border-[#ddb7ff]/40">
                    <Text className="text-[#ddb7ff] font-black text-base">
                      {item.className.replace('Class ', '')}
                    </Text>
                  </View>

                  <View className="flex-1 min-w-0">
                    <Text className="text-white font-extrabold text-base" numberOfLines={1}>
                      {item.className}
                    </Text>
                    <Text className="text-white/60 text-xs mt-0.5 font-medium" numberOfLines={1}>
                      Class Teacher: {item.teacherName}
                    </Text>
                    <View className="flex-row items-center flex-wrap mt-1.5" style={{ gap: 8 }}>
                      <Text className="text-white/70 text-xs font-medium">
                        Total: <Text className="text-white font-bold">{item.totalStudents}</Text>
                      </Text>
                      <Text className="text-emerald-400 text-xs font-medium">
                        Present: <Text className="font-bold">{item.presentToday}</Text>
                      </Text>
                      <Text className="text-rose-400 text-xs font-medium">
                        Absent: <Text className="font-bold">{item.absentToday}</Text>
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="items-end flex-shrink-0">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-[#ddb7ff] font-black text-base font-mono mr-1">
                      {item.todayAvg}%
                    </Text>
                    <ChevronRight size={14} color="#ddb7ff" />
                  </View>
                  <Text className="text-white/50 text-[10px] font-semibold">Today Avg</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* LEVEL 2: SELECTED CLASS STUDENT ROSTER */}
        {viewLevel === 2 && selectedClass && (
          <View className="mb-4">
            {/* Header Card */}
            <View className="p-4 border border-[#ddb7ff]/20 bg-[#181524] rounded-2xl shadow-lg mb-3">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3 bg-[#ddb7ff]/20 border border-[#ddb7ff]/40">
                    <Text className="text-[#ddb7ff] font-black text-base">
                      {selectedClass.className.replace('Class ', '')}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-extrabold text-base">{selectedClass.className}</Text>
                    <Text className="text-white/60 text-xs mt-0.5">
                      Class Teacher: {selectedClass.teacherName}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-[#ddb7ff] text-xl font-black font-mono">
                    {selectedClass.todayAvg}%
                  </Text>
                  <Text className="text-white/60 text-[10px] font-semibold">Today Avg</Text>
                </View>
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-2.5 px-1">
              <Text className="text-white/70 text-xs font-black uppercase tracking-wider">
                Student Roster ({filteredStudents.length})
              </Text>
            </View>

            {filteredStudents.map((stud) => (
              <Pressable
                key={stud.id}
                onPress={() => handleSelectStudent(stud)}
                className="mb-3 p-4 rounded-2xl border border-white/10 bg-[#181524] flex-row items-center justify-between active:scale-[0.98] shadow-md"
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View className="w-11 h-11 rounded-2xl items-center justify-center mr-3 bg-[#ddb7ff]/20 border border-[#ddb7ff]/40">
                    <Text className="text-[#ddb7ff] font-black text-sm">{stud.initials}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-extrabold text-base">{stud.name}</Text>
                    <Text className="text-white/60 text-xs mt-0.5 font-medium">
                      Roll #{stud.rollNo} • Attended {stud.attended}/{stud.totalLectures} Days
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-[#ddb7ff] text-base font-black font-mono mr-1">
                      {stud.overallPct}%
                    </Text>
                    <ChevronRight size={14} color="#ddb7ff" />
                  </View>
                  <Text className="text-white/50 text-[10px] font-semibold">Overall Rate</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* LEVEL 3: MONTHLY ATTENDANCE GRID VIEW FOR SELECTED STUDENT */}
        {viewLevel === 3 && selectedStudent && (
          <View className="mb-4">
            {/* Student Header */}
            <View className="p-4 border border-[#ddb7ff]/20 bg-[#181524] rounded-2xl shadow-lg mb-3">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3 bg-[#ddb7ff]/20 border border-[#ddb7ff]/40">
                    <Text className="text-[#ddb7ff] font-black text-base">{selectedStudent.initials}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-white font-extrabold text-base mr-2">{selectedStudent.name}</Text>
                      <View className="bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-md">
                        <Text className="text-sky-300 text-[10px] font-bold">Roll #{selectedStudent.rollNo}</Text>
                      </View>
                    </View>
                    <Text className="text-white/60 text-xs mt-1">
                      {selectedClass?.className || 'Class 10A'} • Attended: {selectedStudent.attended}/{selectedStudent.totalLectures} Days
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-[#ddb7ff] text-xl font-black font-mono">
                    {selectedStudent.overallPct}%
                  </Text>
                  <Text className="text-white/60 text-[10px] font-semibold">Overall Rate</Text>
                </View>
              </View>
            </View>

            {/* Monthly Calendar Grid Card */}
            <View
              style={{
                padding: 16,
                borderRadius: 20,
                backgroundColor: '#181524',
                borderColor: 'rgba(221, 183, 255, 0.2)',
                borderWidth: 1.2,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              {/* Header with Legend */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottomColor: 'rgba(255, 255, 255, 0.12)',
                  borderBottomWidth: 1,
                  paddingBottom: 12,
                  marginBottom: 14,
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 16 }}>Monthly Attendance Grid</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#34d399', marginRight: 4 }} />
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '700' }}>Present</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b', marginRight: 4 }} />
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '700' }}>Partial</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f43f5e', marginRight: 4 }} />
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '700' }}>Absent</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)', marginRight: 4 }} />
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' }}>Off</Text>
                  </View>
                </View>
              </View>

              {/* Month Navigation */}
              <View className="flex-row justify-between items-center mb-3">
                <Pressable
                  onPress={handlePrevGridMonth}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 active:bg-white/15"
                >
                  <ChevronLeft size={16} color="#ddb7ff" />
                </Pressable>
                <Text className="text-white font-extrabold text-sm">
                  {MONTH_NAMES[gridMonth]} {gridYear}
                </Text>
                {(() => {
                  const today = new Date();
                  const isCurrentOrFuture =
                    gridYear > today.getFullYear() ||
                    (gridYear === today.getFullYear() && gridMonth >= today.getMonth());
                  return (
                    <Pressable
                      onPress={handleNextGridMonth}
                      disabled={isCurrentOrFuture}
                      className={`p-2 rounded-xl bg-white/5 border border-white/10 ${
                        isCurrentOrFuture ? 'opacity-25' : 'active:bg-white/15'
                      }`}
                    >
                      <ChevronRight size={16} color="#ddb7ff" />
                    </Pressable>
                  );
                })()}
              </View>

              {/* Calendar Grid Container */}
              <View>
                <View className="flex-row justify-between mb-2">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
                    <Text
                      key={d}
                      className={`w-[14.28%] text-center text-[11px] font-black uppercase ${
                        i === 0 ? 'text-rose-400' : 'text-white/50'
                      }`}
                    >
                      {d}
                    </Text>
                  ))}
                </View>

                {/* Calendar Days Matrix */}
                <View className="flex-row flex-wrap" style={{ margin: -2 }}>
                  {calendarGridCells.map((item, idx) => {
                    if (item.day === null) {
                      return (
                        <View key={`pad_${idx}`} className="w-[14.28%] p-1">
                          <View className="h-10 border border-transparent rounded-xl" />
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
                    let cellBg = 'rgba(16, 185, 129, 0.2)';
                    let cellBorder = 'rgba(16, 185, 129, 0.5)';
                    let cellText = '#34d399';

                    if (status === 'partial') {
                      cellBg = 'rgba(245, 158, 11, 0.2)';
                      cellBorder = 'rgba(245, 158, 11, 0.5)';
                      cellText = '#fcd34d';
                    } else if (status === 'absent') {
                      cellBg = 'rgba(244, 63, 94, 0.2)';
                      cellBorder = 'rgba(244, 63, 94, 0.5)';
                      cellText = '#fb7185';
                    } else if (status === 'off') {
                      cellBg = 'rgba(255, 255, 255, 0.05)';
                      cellBorder = 'rgba(255, 255, 255, 0.12)';
                      cellText = 'rgba(255, 255, 255, 0.4)';
                    }

                    return (
                      <View key={`day_${dayNum}`} style={{ width: '14.28%', padding: 2 }}>
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
                          style={{
                            height: 42,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isFuture ? 'rgba(255,255,255,0.03)' : cellBg,
                            borderColor: isFuture
                              ? 'transparent'
                              : isSelected
                              ? '#ffffff'
                              : cellBorder,
                            borderWidth: isSelected ? 2 : 1.2,
                            opacity: isFuture ? 0.3 : 1,
                            overflow: 'hidden',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: isSelected ? '900' : '800',
                              color: isFuture ? 'rgba(255,255,255,0.25)' : cellText,
                            }}
                          >
                            {dayNum}
                          </Text>

                          {isSelected && !isFuture && (
                            <View
                              style={{
                                position: 'absolute',
                                bottom: 3,
                                width: 4,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: '#ffffff',
                              }}
                            />
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Period-Wise Breakdown for Selected Date */}
            <View
              style={{
                padding: 16,
                borderRadius: 20,
                backgroundColor: '#181524',
                borderColor: 'rgba(221, 183, 255, 0.2)',
                borderWidth: 1.2,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottomColor: 'rgba(255, 255, 255, 0.12)',
                  borderBottomWidth: 1,
                  paddingBottom: 12,
                  marginBottom: 14,
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }} numberOfLines={1}>
                    {selectedDatePeriods.formattedDate}
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 12, marginTop: 2, fontWeight: '500' }}>
                    {selectedClass?.className || 'Class 10A'} • Period Timetable Breakdown
                  </Text>
                </View>

                {/* Overall Day Status Badge */}
                {selectedDatePeriods.status === 'absent' ? (
                  <View
                    style={{
                      backgroundColor: 'rgba(244, 63, 94, 0.22)',
                      borderColor: 'rgba(244, 63, 94, 0.65)',
                      borderWidth: 1.5,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <AlertCircle size={14} color="#fb7185" style={{ marginRight: 5 }} />
                    <Text style={{ color: '#fb7185', fontSize: 12, fontWeight: '900' }}>
                      {selectedDatePeriods.isSunday
                        ? 'Sunday • Absent'
                        : `Full Day Absent (0/${selectedDatePeriods.totalCount})`}
                    </Text>
                  </View>
                ) : selectedDatePeriods.status === 'partial' ? (
                  <View
                    style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.22)',
                      borderColor: 'rgba(245, 158, 11, 0.65)',
                      borderWidth: 1.5,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <AlertTriangle size={14} color="#fcd34d" style={{ marginRight: 5 }} />
                    <Text style={{ color: '#fcd34d', fontSize: 12, fontWeight: '900' }}>
                      Partial Day ({selectedDatePeriods.presentCount}/{selectedDatePeriods.totalCount})
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.22)',
                      borderColor: 'rgba(16, 185, 129, 0.65)',
                      borderWidth: 1.5,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <CheckCircle2 size={14} color="#34d399" style={{ marginRight: 5 }} />
                    <Text style={{ color: '#34d399', fontSize: 12, fontWeight: '900' }}>
                      Present ({selectedDatePeriods.presentCount}/{selectedDatePeriods.totalCount})
                    </Text>
                  </View>
                )}
              </View>

              {/* Period Cards */}
              <View>
                {selectedDatePeriods.periods.map((item) => {
                  const isPresent = item.status === 'Present';
                  return (
                    <View
                      key={item.periodNumber}
                      style={{
                        backgroundColor: isPresent ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                        borderColor: isPresent ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)',
                        borderWidth: 1.2,
                        borderRadius: 14,
                        padding: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                            backgroundColor: isPresent ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)',
                            borderColor: isPresent ? 'rgba(16, 185, 129, 0.6)' : 'rgba(244, 63, 94, 0.6)',
                            borderWidth: 1,
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: '900',
                              fontSize: 12,
                              color: isPresent ? '#6ee7b7' : '#fda4af',
                            }}
                          >
                            P{item.periodNumber}
                          </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>{item.subject}</Text>
                          <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 12, marginTop: 2, fontWeight: '500' }}>
                            {item.teacher} • {item.room}
                          </Text>
                          <Text style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 11, marginTop: 2, fontWeight: '500' }}>{item.time}</Text>
                        </View>
                      </View>

                      <View
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 5,
                          borderRadius: 20,
                          backgroundColor: isPresent ? 'rgba(16, 185, 129, 0.22)' : 'rgba(244, 63, 94, 0.22)',
                          borderColor: isPresent ? 'rgba(16, 185, 129, 0.65)' : 'rgba(244, 63, 94, 0.65)',
                          borderWidth: 1.2,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '900',
                            letterSpacing: 0.5,
                            color: isPresent ? '#34d399' : '#fb7185',
                          }}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* DATE PICKER MODAL */}
      {showDatePickerModal && (
        <Modal
          visible={showDatePickerModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePickerModal(false)}
        >
          <View className="flex-1 bg-black/80 items-center justify-center p-5">
            <View className="w-full max-w-sm bg-[#181524] border border-[#ddb7ff]/30 rounded-3xl p-5 shadow-2xl">
              <View className="flex-row justify-between items-center pb-3 border-b border-white/10 mb-4">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-xl bg-[#ddb7ff]/20 items-center justify-center mr-2.5">
                    <Calendar size={16} color="#ddb7ff" />
                  </View>
                  <Text className="text-white font-black text-base">Select Attendance Date</Text>
                </View>
                <Pressable
                  onPress={() => setShowDatePickerModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                >
                  <X size={16} color="white" />
                </Pressable>
              </View>

              {/* Month Selector in Modal */}
              <View className="flex-row justify-between items-center mb-4">
                <Pressable
                  onPress={handlePrevModalMonth}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 active:bg-white/15"
                >
                  <ChevronLeft size={16} color="#ddb7ff" />
                </Pressable>
                <Text className="text-white font-extrabold text-sm">
                  {MONTH_NAMES[modalViewDate.getMonth()]} {modalViewDate.getFullYear()}
                </Text>
                {(() => {
                  const today = new Date();
                  const isCurrentOrFuture =
                    modalViewDate.getFullYear() > today.getFullYear() ||
                    (modalViewDate.getFullYear() === today.getFullYear() &&
                      modalViewDate.getMonth() >= today.getMonth());
                  return (
                    <Pressable
                      onPress={handleNextModalMonth}
                      disabled={isCurrentOrFuture}
                      className={`p-2 rounded-xl bg-white/5 border border-white/10 ${
                        isCurrentOrFuture ? 'opacity-25' : 'active:bg-white/15'
                      }`}
                    >
                      <ChevronRight size={16} color="#ddb7ff" />
                    </Pressable>
                  );
                })()}
              </View>

              {/* Day Grid in Modal */}
              <View className="flex-row flex-wrap" style={{ margin: -2 }}>
                {(() => {
                  const y = modalViewDate.getFullYear();
                  const m = modalViewDate.getMonth();
                  const firstDay = new Date(y, m, 1).getDay();
                  const totalDays = new Date(y, m + 1, 0).getDate();
                  const today = new Date();
                  today.setHours(23, 59, 59, 999);

                  const cells = [];
                  for (let p = 0; p < firstDay; p++) {
                    cells.push(
                      <View key={`mpad_${p}`} className="w-[14.28%] p-1">
                        <View className="h-8" />
                      </View>
                    );
                  }

                  for (let d = 1; d <= totalDays; d++) {
                    const cDate = new Date(y, m, d);
                    const isFuture = cDate > today;
                    const dateStr = `${String(d).padStart(2, '0')}-${String(m + 1).padStart(2, '0')}-${y}`;
                    const isCurrent = selectedDate === dateStr;

                    cells.push(
                      <View key={`mday_${d}`} className="w-[14.28%] p-1">
                        <Pressable
                          disabled={isFuture}
                          onPress={() => {
                            setSelectedDate(dateStr);
                            setSelectedCalendarDay(d);
                            setGridMonth(m);
                            setGridYear(y);
                            setShowDatePickerModal(false);
                          }}
                          className={`h-8 rounded-lg items-center justify-center border ${
                            isFuture
                              ? 'opacity-20 bg-white/5 border-transparent'
                              : isCurrent
                              ? 'bg-[#ddb7ff] border-[#ddb7ff]'
                              : 'bg-white/5 border-white/10 active:bg-white/15'
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              isFuture
                                ? 'text-white/30'
                                : isCurrent
                                ? 'text-[#181524] font-black'
                                : 'text-white'
                            }`}
                          >
                            {d}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  }
                  return cells;
                })()}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08070d',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
});
