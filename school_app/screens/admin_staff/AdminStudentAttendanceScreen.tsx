import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Modal, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import {
  CheckCircle2, AlertCircle, ChevronRight, ArrowLeft, 
  School, AlertTriangle, ShieldCheck, ChevronLeft, Clock, Info, X
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { useAuthStore } from '../../store/useAuthStore';

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
  { id: 's1', name: 'B Sandeep Goud', initials: 'BS', rollNo: '123', totalLectures: 45, attended: 42, overallPct: 93.3, attendanceMap: { 1: 'present', 2: 'present', 3: 'present', 4: 'partial', 5: 'present', 6: 'present', 7: 'present', 8: 'present', 10: 'present', 11: 'absent', 12: 'present', 13: 'present', 14: 'present' } },
  { id: 's2', name: 'Banda Teja Sri', initials: 'BT', rollNo: '124', totalLectures: 45, attended: 44, overallPct: 97.7, attendanceMap: { 1: 'present', 2: 'present', 3: 'present', 4: 'present', 5: 'present', 6: 'present', 7: 'present', 8: 'present', 10: 'present', 11: 'present', 12: 'present', 13: 'present', 14: 'present' } },
  { id: 's3', name: 'Chandippa Sragvi', initials: 'CS', rollNo: '125', totalLectures: 45, attended: 40, overallPct: 88.8, attendanceMap: { 1: 'present', 2: 'absent', 3: 'present', 4: 'present', 5: 'present', 6: 'absent', 7: 'present', 8: 'present', 10: 'present', 11: 'present', 12: 'present', 13: 'absent', 14: 'present' } },
  { id: 's4', name: 'Chilkuri Shiva Prasad', initials: 'CS', rollNo: '126', totalLectures: 45, attended: 45, overallPct: 100.0, attendanceMap: { 1: 'present', 2: 'present', 3: 'present', 4: 'present', 5: 'present', 6: 'present', 7: 'present', 8: 'present', 10: 'present', 11: 'present', 12: 'present', 13: 'present', 14: 'present' } },
  { id: 's5', name: 'D Thanush', initials: 'DT', rollNo: '127', totalLectures: 45, attended: 41, overallPct: 91.1, attendanceMap: { 1: 'present', 2: 'present', 3: 'present', 4: 'absent', 5: 'present', 6: 'present', 7: 'present', 8: 'present', 10: 'absent', 11: 'present', 12: 'present', 13: 'present', 14: 'present' } },
  { id: 's6', name: 'Dutha Varshini', initials: 'DV', rollNo: '128', totalLectures: 45, attended: 43, overallPct: 95.5, attendanceMap: { 1: 'present', 2: 'present', 3: 'present', 4: 'present', 5: 'present', 6: 'present', 7: 'present', 8: 'present', 10: 'present', 11: 'absent', 12: 'present', 13: 'present', 14: 'present' } },
  { id: 's7', name: 'Harijan Naveen Kumar', initials: 'HN', rollNo: '129', totalLectures: 45, attended: 39, overallPct: 86.6, attendanceMap: { 1: 'present', 2: 'absent', 3: 'present', 4: 'present', 5: 'absent', 6: 'present', 7: 'present', 8: 'present', 10: 'absent', 11: 'present', 12: 'present', 13: 'present', 14: 'absent' } },
  { id: 's8', name: 'Kandikonda Ashwitha', initials: 'KA', rollNo: '130', totalLectures: 45, attended: 44, overallPct: 97.7, attendanceMap: { 1: 'present', 2: 'present', 3: 'present', 4: 'present', 5: 'present', 6: 'present', 7: 'present', 8: 'present', 10: 'present', 11: 'present', 12: 'present', 13: 'present', 14: 'present' } },
  { id: 's9', name: 'Katikam Sreshta', initials: 'KS', rollNo: '131', totalLectures: 45, attended: 42, overallPct: 93.3, attendanceMap: { 1: 'present', 2: 'present', 3: 'present', 4: 'present', 5: 'absent', 6: 'present', 7: 'present', 8: 'present', 10: 'present', 11: 'present', 12: 'present', 13: 'present', 14: 'present' } },
  { id: 's10', name: 'Kavali Chaithra', initials: 'KC', rollNo: '132', totalLectures: 45, attended: 45, overallPct: 100.0, attendanceMap: { 1: 'present', 2: 'present', 3: 'present', 4: 'present', 5: 'present', 6: 'present', 7: 'present', 8: 'present', 10: 'present', 11: 'present', 12: 'present', 13: 'present', 14: 'present' } }
];

export const AdminStudentAttendanceScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  // Navigation level: 1 = Class Directory, 2 = Class Student List, 3 = Student Monthly Grid
  const [viewLevel, setViewLevel] = useState<1 | 2 | 3>(1);
  const [selectedClass, setSelectedClass] = useState<ClassItemSummary | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentAttendanceRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027 (Current)');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(4); // Default 4 Aug
  const [selectedDate, setSelectedDate] = useState('04-08-2026');
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('04-08-2026');

  const [gridMonth, setGridMonth] = useState<number>(7); // 7 = August (0-indexed)
  const [gridYear, setGridYear] = useState<number>(2026);

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevGridMonth = () => {
    if (gridMonth === 0) {
      setGridMonth(11);
      setGridYear(prev => prev - 1);
    } else {
      setGridMonth(prev => prev - 1);
    }
  };

  const handleNextGridMonth = () => {
    if (gridMonth === 11) {
      setGridMonth(0);
      setGridYear(prev => prev + 1);
    } else {
      setGridMonth(prev => prev + 1);
    }
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

  // Handle Hardware Back Button & System Back Gesture (matching chevron left behavior)
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
        style={StyleSheet.absoluteFillObject}
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* TOP LEVEL OVERVIEW SUMMARY CARDS */}
        {viewLevel === 1 && (
          <View className="px-5 mb-4">
            <GlassCard intensity="low" className={`p-4 border bg-[#101415]/90 rounded-2xl ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/20'}`}>
              <View className="flex-row items-center justify-between border-b border-white/10 pb-3 mb-3">
                <View>
                  <Text className="text-white font-extrabold text-base">School Attendance Overview</Text>
                  <Text className="text-white/50 text-xs">Real-time attendance telemetry for today ({selectedDate})</Text>
                </View>
                <Pressable
                  onPress={() => setShowDatePickerModal(true)}
                  className={`px-3 py-1.5 rounded-xl border flex-row items-center ${isSuperAdmin ? 'bg-[#f0c110]/15 border-[#f0c110]/40' : 'bg-[#00f1a1]/15 border-[#00f1a1]/40'}`}
                >
                  <Clock size={12} color={primaryColor} style={{ marginRight: 4 }} />
                  <Text className={`${primaryTextClass} text-xs font-bold`}>{selectedDate}</Text>
                </Pressable>
              </View>

              {/* 4 Stats Grid */}
              <View className="flex-row justify-between" style={{ gap: 8 }}>
                <View className="flex-1 bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/40 text-[9.5px] uppercase font-bold mb-0.5">Total Classes</Text>
                  <Text className="text-white text-base font-extrabold">{overallStats.totalSecs}</Text>
                  <Text className="text-white/50 text-[9px]">Sections</Text>
                </View>

                <View className="flex-1 bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/40 text-[9.5px] uppercase font-bold mb-0.5">Total Students</Text>
                  <Text className="text-sky-400 text-base font-extrabold">{overallStats.totalStuds}</Text>
                  <Text className="text-white/50 text-[9px]">Enrolled</Text>
                </View>

                <View className="flex-1 bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/40 text-[9.5px] uppercase font-bold mb-0.5">Present Today</Text>
                  <Text className={`${primaryTextClass} text-base font-extrabold`}>{overallStats.totalPresent}</Text>
                  <Text className="text-white/50 text-[9px]">{overallStats.avgPct}% Avg</Text>
                </View>

                <View className="flex-1 bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/40 text-[9.5px] uppercase font-bold mb-0.5">Absent Today</Text>
                  <Text className="text-rose-400 text-base font-extrabold">{overallStats.totalAbsent}</Text>
                  <Text className="text-white/50 text-[9px]">Requires Alert</Text>
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
                    <Text className={`${primaryTextClass} font-extrabold text-base`}>{selectedClass.className.replace('Class ', '')}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-extrabold text-base">{selectedClass.className}</Text>
                    <Text className="text-white/50 text-xs mt-0.5">Class Teacher: {selectedClass.teacherName}</Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className={`${primaryTextClass} text-base font-extrabold`}>{selectedClass.todayAvg}%</Text>
                  <Text className="text-white/50 text-[10px]">Today Avg</Text>
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
                    <Text className={`${primaryTextClass} font-extrabold text-base`}>{selectedStudent.initials}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-white font-extrabold text-base mr-2">{selectedStudent.name}</Text>
                      <View className="bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-md">
                        <Text className="text-sky-300 text-[9.5px] font-bold">Roll #{selectedStudent.rollNo}</Text>
                      </View>
                    </View>
                    <Text className="text-white/50 text-xs mt-0.5">{selectedClass?.className || 'Class 10A'} • Attended: {selectedStudent.attended}/{selectedStudent.totalLectures} Days</Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className={`${primaryTextClass} text-lg font-extrabold`}>{selectedStudent.overallPct}%</Text>
                  <Text className="text-white/50 text-[10px]">Overall Rate</Text>
                </View>
              </View>
            </GlassCard>
          </View>
        )}

        {/* LEVEL 1: CLASS DIRECTORY LIST */}
        {viewLevel === 1 && (
          <View className="px-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white/60 text-xs font-bold uppercase tracking-wider">Class Directory ({filteredClasses.length})</Text>
            </View>

            {filteredClasses.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleSelectClass(item)}
                className={`mb-3.5 p-4 rounded-2xl border bg-[#101415]/90 flex-row items-center justify-between active:scale-[0.98] ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-white/10'}`}
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-3 ${primaryBadgeClass}`}>
                    <Text className={`${primaryTextClass} font-extrabold text-sm`}>{item.className.replace('Class ', '')}</Text>
                  </View>

                  <View className="flex-1">
                    <Text className="text-white font-extrabold text-sm">{item.className}</Text>
                    <Text className="text-white/50 text-xs mt-0.5">{item.teacherName}</Text>
                    <View className="flex-row items-center mt-1.5" style={{ gap: 10 }}>
                      <Text className="text-white/60 text-[11px] font-medium">Students: <Text className="text-white font-bold">{item.totalStudents}</Text></Text>
                      <Text className="text-emerald-400 text-[11px] font-medium">Present: <Text className="font-bold">{item.presentToday}</Text></Text>
                      <Text className="text-rose-400 text-[11px] font-medium">Absent: <Text className="font-bold">{item.absentToday}</Text></Text>
                    </View>
                  </View>
                </View>

                <View className="items-end">
                  <View className="flex-row items-center mb-1">
                    <Text className={`${primaryTextClass} font-extrabold text-sm mr-1`}>{item.todayAvg}%</Text>
                    <ChevronRight size={12} color={primaryColor} />
                  </View>
                  <Text className="text-white/40 text-[9.5px]">Attendance</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* LEVEL 2: CLASS STUDENT ROSTER LIST */}
        {viewLevel === 2 && (
          <View className="px-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white/60 text-xs font-bold uppercase tracking-wider">Student Roster ({filteredStudents.length})</Text>
            </View>

            {filteredStudents.map((stud) => (
              <Pressable
                key={stud.id}
                onPress={() => handleSelectStudent(stud)}
                className="mb-3 p-3.5 rounded-2xl border border-white/10 bg-[#101415]/90 flex-row items-center justify-between active:scale-[0.98]"
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View className={`w-10 h-10 rounded-2xl items-center justify-center mr-3 ${primaryBadgeClass}`}>
                    <Text className={`${primaryTextClass} font-extrabold text-xs`}>{stud.initials}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-sm">{stud.name}</Text>
                    <Text className="text-white/40 text-[11px]">Roll #{stud.rollNo} • Attended {stud.attended}/{stud.totalLectures} Days</Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className={`${primaryTextClass} text-xs font-extrabold`}>{stud.overallPct}%</Text>
                  <Text className="text-white/40 text-[9.5px]">Overall Rate</Text>
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
                <Text className="text-white font-extrabold text-sm">Monthly Attendance Grid</Text>
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <View className="flex-row items-center">
                    <View className={`w-2 h-2 rounded-full mr-1 ${isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]'}`} />
                    <Text className="text-white/60 text-[9px]">Present</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-amber-400 mr-1" />
                    <Text className="text-white/60 text-[9px]">Partial</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-rose-500 mr-1" />
                    <Text className="text-white/60 text-[9px]">Absent</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-white/40 mr-1" />
                    <Text className="text-white/40 text-[9px]">Off/Sun</Text>
                  </View>
                </View>
              </View>

              {/* Month Navigation */}
              <View className="flex-row justify-between items-center mb-4">
                <Pressable onPress={handlePrevGridMonth} className="p-1.5 rounded-lg bg-white/5 border border-white/10 active:bg-white/15">
                  <ChevronLeft size={16} color={primaryColor} />
                </Pressable>
                <Text className="text-white font-bold text-xs">{MONTH_NAMES[gridMonth]} {gridYear}</Text>
                <Pressable onPress={handleNextGridMonth} className="p-1.5 rounded-lg bg-white/5 border border-white/10 active:bg-white/15">
                  <ChevronRight size={16} color={primaryColor} />
                </Pressable>
              </View>

              {/* Days Header Row */}
              <View className="flex-row justify-between mb-2">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
                  <Text key={d} className={`w-[14.28%] text-center text-[9.5px] font-bold uppercase ${i === 0 ? 'text-rose-400/80' : 'text-white/40'}`}>{d}</Text>
                ))}
              </View>

              {/* Real Calendar Days Grid */}
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
                    textStyle = 'text-white/30';
                  }

                  return (
                    <View key={`day_${dayNum}`} className="w-[14.28%] p-1">
                      <Pressable
                        onPress={() => setSelectedCalendarDay(dayNum)}
                        className={`h-10 rounded-xl items-center justify-center border ${
                          isSelected 
                            ? (isSuperAdmin ? 'border-[#f0c110] bg-[#f0c110]/30 shadow-lg' : 'border-[#00f1a1] bg-[#00f1a1]/30 shadow-lg')
                            : bgStyle
                        }`}
                      >
                        <Text className={`text-xs font-bold ${isSelected ? 'text-white' : textStyle}`}>
                          {dayNum}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </GlassCard>

            {/* Bottom Section: Period-Wise Breakdown for Selected Date */}
            <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/90 mb-4">
              <View className="flex-row items-center mb-3">
                <Clock size={14} color={primaryColor} style={{ marginRight: 6 }} />
                <Text className="text-white text-xs font-bold">
                  Period-wise breakdown on Aug {selectedCalendarDay}, 2026
                </Text>
              </View>

              <View className="space-y-2">
                {[
                  { period: 'Period 1 (09:00 AM)', subject: 'Mathematics', status: 'Present', teacher: 'Mrs. Anita Sharma' },
                  { period: 'Period 2 (10:00 AM)', subject: 'Physics', status: 'Present', teacher: 'Mr. Rajesh Kumar' },
                  { period: 'Period 3 (11:15 AM)', subject: 'Chemistry', status: 'Present', teacher: 'Dr. Meenakshi' },
                  { period: 'Period 4 (01:30 PM)', subject: 'English', status: 'Present', teacher: 'Mrs. Priya Nambiar' }
                ].map((p, idx) => (
                  <View key={idx} className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex-row justify-between items-center mb-2">
                    <View>
                      <Text className="text-white font-bold text-xs">{p.subject}</Text>
                      <Text className="text-white/40 text-[10px]">{p.period} • {p.teacher}</Text>
                    </View>
                    <View className="bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                      <Text className="text-emerald-400 text-[9.5px] font-bold">{p.status}</Text>
                    </View>
                  </View>
                ))}
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
                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${primaryBadgeClass}`}>
                  <Clock size={16} color={primaryColor} />
                </View>
                <Text className="text-white font-bold text-base">Select Attendance Date</Text>
              </View>
              <Pressable onPress={() => setShowDatePickerModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Calendar Grid Date Selector</Text>
            <View className="flex-row justify-between items-center bg-white/5 p-2.5 rounded-2xl mb-3 border border-white/10">
              <Pressable 
                onPress={() => {
                  const d = new Date(selectedDate.split('-').reverse().join('-'));
                  d.setMonth(d.getMonth() - 1);
                  const yearStr = d.getFullYear();
                  const monthStr = String(d.getMonth() + 1).padStart(2, '0');
                  setSelectedDate(`01-${monthStr}-${yearStr}`);
                }}
                className="p-1 border border-white/10 rounded-lg bg-white/5"
              >
                <ChevronLeft size={16} color={primaryColor} />
              </Pressable>
              <Text className="text-white font-extrabold text-sm">{selectedDate}</Text>
              <Pressable 
                onPress={() => {
                  const d = new Date(selectedDate.split('-').reverse().join('-'));
                  d.setMonth(d.getMonth() + 1);
                  const yearStr = d.getFullYear();
                  const monthStr = String(d.getMonth() + 1).padStart(2, '0');
                  setSelectedDate(`01-${monthStr}-${yearStr}`);
                }}
                className="p-1 border border-white/10 rounded-lg bg-white/5"
              >
                <ChevronRight size={16} color={primaryColor} />
              </Pressable>
            </View>

            <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
              {['04-08-2026', '03-08-2026', '02-08-2026', '01-08-2026', '31-07-2026', '30-07-2026'].map(qd => {
                const isSel = selectedDate === qd;
                return (
                  <Pressable
                    key={qd}
                    onPress={() => {
                      setSelectedDate(qd);
                      setCustomDateInput(qd);
                      setShowDatePickerModal(false);
                    }}
                    className={`px-3 py-2 rounded-xl border ${isSel ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/5 border-white/15'}`}
                  >
                    <Text className={`text-xs font-bold ${isSel ? 'text-[#101415]' : 'text-white/70'}`}>{qd}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="flex-row border-t border-white/10 pt-3" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowDatePickerModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Close</Text>
              </Pressable>
              <Pressable 
                onPress={() => {
                  if (customDateInput.trim()) {
                    setSelectedDate(customDateInput.trim());
                  }
                  setShowDatePickerModal(false);
                }} 
                className={`flex-1 py-3 rounded-xl ${primaryBtnClass} items-center shadow-lg`}
              >
                <Text className="text-[#101415] font-extrabold text-xs">Apply Date</Text>
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
    paddingBottom: 100,
  },
});

export default AdminStudentAttendanceScreen;
