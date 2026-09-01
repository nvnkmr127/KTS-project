import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput, ActivityIndicator, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Calendar, Clock, Plus, Pencil, Save, X, 
  ChevronDown, CheckCircle2, AlertCircle, School, UserCheck, 
  BookOpen, Building2, AlertTriangle, RefreshCw, Printer, Search, Trash2
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import * as Print from 'expo-print';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

export interface PeriodTiming {
  period: number;
  label: string;
  start: string;
  end: string;
  isBreak?: boolean;
}

export interface TimetableCell {
  subject: string;
  teacherId: string;
  teacherName: string;
  room: string;
}

export const TIMETABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_PERIOD_TIMINGS: PeriodTiming[] = [
  { period: 1, label: 'Period 1', start: '08:30', end: '09:15' },
  { period: 2, label: 'Period 2', start: '09:15', end: '10:00' },
  { period: 3, label: 'Period 3', start: '10:00', end: '10:45' },
  { period: 4, label: 'Lunch Break', start: '10:45', end: '11:30', isBreak: true },
  { period: 5, label: 'Period 4', start: '11:30', end: '12:15' },
  { period: 6, label: 'Period 5', start: '12:15', end: '01:00' },
  { period: 7, label: 'Period 6', start: '01:00', end: '01:45' },
  { period: 8, label: 'Period 7', start: '01:45', end: '02:30' }
];

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 
  'Social Studies', 'Computer Science', 'Physical Education', 'Hindi', 'Telugu', 'Art', 'Music'
];

const ROOMS = [
  'Room 10', 'Room 11', 'Room 12', 'Room 13', 'Room 14', 'Room 15', 
  'Physics Lab', 'Chemistry Lab', 'Computer Lab', 'Sports Ground'
];

const FACULTY_MEMBERS = [
  { id: 't1', name: 'Mrs. Anita Sharma', subject: 'Mathematics' },
  { id: 't2', name: 'Mr. Rajesh Kumar', subject: 'Physics' },
  { id: 't3', name: 'Dr. Meenakshi Sundaram', subject: 'Chemistry' },
  { id: 't4', name: 'Mr. David Miller', subject: 'English' },
  { id: 't5', name: 'Mrs. Sunita Rao', subject: 'Social Studies' },
  { id: 't6', name: 'Mr. Vikramaditya Singh', subject: 'Biology' },
  { id: 't7', name: 'Mrs. Priya Nambiar', subject: 'Computer Science' },
  { id: 't8', name: 'Mr. Suresh Verma', subject: 'Hindi' }
];

const INITIAL_CLASSES = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'];

const CLASS_TEACHERS: Record<string, string> = {
  '6A': 'Mrs. Sunita Rao',
  '6B': 'Mr. David Miller',
  '7A': 'Dr. Meenakshi Sundaram',
  '7B': 'Mr. Vikramaditya Singh',
  '8A': 'Mrs. Priya Nambiar',
  '8B': 'Mr. Suresh Verma',
  '9A': 'Dr. Meenakshi Sundaram',
  '9B': 'Mr. Rajesh Kumar',
  '10A': 'Mrs. Anita Sharma',
  '10B': 'Mr. Rajesh Kumar'
};

const SUBJECT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Mathematics: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-[#00f1a1]' },
  Physics: { bg: 'bg-indigo-500/15', border: 'border-indigo-500/30', text: 'text-indigo-300' },
  Chemistry: { bg: 'bg-rose-500/15', border: 'border-rose-500/30', text: 'text-rose-300' },
  Biology: { bg: 'bg-teal-500/15', border: 'border-teal-500/30', text: 'text-teal-300' },
  English: { bg: 'bg-purple-500/15', border: 'border-purple-500/30', text: 'text-purple-300' },
  'Social Studies': { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-300' },
  'Computer Science': { bg: 'bg-sky-500/15', border: 'border-sky-500/30', text: 'text-sky-300' },
  'Physical Education': { bg: 'bg-[#00f1a1]/15', border: 'border-[#00f1a1]/30', text: 'text-[#00f1a1]' },
  Break: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/40' }
};

export const TimetableBuilderScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();
  const isSuperAdmin = user?.role === 'super_admin';
  const [selectedClass, setSelectedClass] = useState('10A');
  const [activeDay, setActiveDay] = useState('Monday');
  const [periodTimings, setPeriodTimings] = useState<PeriodTiming[]>(DEFAULT_PERIOD_TIMINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Timetable Data: classId -> day -> periodIdx -> TimetableCell
  const [timetableData, setTimetableData] = useState<Record<string, Record<string, Record<number, TimetableCell>>>>({
    '10A': {
      Monday: {
        0: { subject: 'Mathematics', teacherId: 't1', teacherName: 'Mrs. Anita Sharma', room: 'Room 12' },
        1: { subject: 'Physics', teacherId: 't2', teacherName: 'Mr. Rajesh Kumar', room: 'Room 12' },
        2: { subject: 'Chemistry', teacherId: 't3', teacherName: 'Dr. Meenakshi Sundaram', room: 'Chemistry Lab' },
        4: { subject: 'English', teacherId: 't4', teacherName: 'Mr. David Miller', room: 'Room 12' },
        5: { subject: 'Computer Science', teacherId: 't7', teacherName: 'Mrs. Priya Nambiar', room: 'Computer Lab' }
      },
      Tuesday: {
        0: { subject: 'Physics', teacherId: 't2', teacherName: 'Mr. Rajesh Kumar', room: 'Room 12' },
        1: { subject: 'Mathematics', teacherId: 't1', teacherName: 'Mrs. Anita Sharma', room: 'Room 12' },
        2: { subject: 'Biology', teacherId: 't6', teacherName: 'Mr. Vikramaditya Singh', room: 'Physics Lab' }
      }
    }
  });

  // Modal States
  const [showCellEditModal, setShowCellEditModal] = useState(false);
  const [editingCellTarget, setEditingCellTarget] = useState<{ day: string; periodIdx: number; currentCell: TimetableCell | null } | null>(null);

  // Cell Form States
  const [formSubject, setFormSubject] = useState('Mathematics');
  const [formTeacherId, setFormTeacherId] = useState('t1');
  const [formRoom, setFormRoom] = useState('Room 12');
  const [isManualRoomMode, setIsManualRoomMode] = useState(false);

  // Edit Timings Modal State
  const [showEditTimingsModal, setShowEditTimingsModal] = useState(false);

  // Handle Hardware Back Button & System Back Gesture (matching chevron left behavior)
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (showCellEditModal) {
          setShowCellEditModal(false);
          return true;
        }
        if (showEditTimingsModal) {
          setShowEditTimingsModal(false);
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
    }, [showCellEditModal, showEditTimingsModal, navigation])
  );
  const [tempTimings, setTempTimings] = useState<PeriodTiming[]>(DEFAULT_PERIOD_TIMINGS);

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Toast State
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'warning' }>({
    visible: false, title: '', message: '', type: 'success'
  });

  const showToast = (title: string, message: string, type: 'success' | 'warning' = 'success') => {
    setToastData({ visible: true, title, message, type });
  };

  // Count filled periods across all days for selected class
  const countFilledPeriods = () => {
    let count = 0;
    const classData = timetableData[selectedClass] || {};
    for (const day of TIMETABLE_DAYS) {
      const dayData = classData[day] || {};
      count += Object.keys(dayData).length;
    }
    return count;
  };

  // Conflict Check Logic matching Web
  const isTeacherBusyInOtherClass = (teacherId: string, day: string, periodIdx: number) => {
    return Object.keys(timetableData).some(clsId => {
      if (clsId === selectedClass) return false;
      const cell = timetableData[clsId]?.[day]?.[periodIdx];
      return cell && String(cell.teacherId) === String(teacherId);
    });
  };

  // Open Edit Cell Modal
  const handleOpenCellEdit = (day: string, periodIdx: number) => {
    const current = timetableData[selectedClass]?.[day]?.[periodIdx] || null;
    setEditingCellTarget({ day, periodIdx, currentCell: current });
    setFormSubject(current?.subject || 'Mathematics');

    // Available teachers filter
    const availableTeachers = FACULTY_MEMBERS.filter(t => !isTeacherBusyInOtherClass(t.id, day, periodIdx));
    setFormTeacherId(current?.teacherId || (availableTeachers[0]?.id || FACULTY_MEMBERS[0].id));
    
    const roomVal = current?.room || 'Room 12';
    setFormRoom(roomVal);
    setIsManualRoomMode(!ROOMS.includes(roomVal));
    setShowCellEditModal(true);
  };

  // Save Single Cell Assignment
  const handleSaveCell = () => {
    if (!editingCellTarget) return;
    const { day, periodIdx } = editingCellTarget;

    const teacherObj = FACULTY_MEMBERS.find(f => f.id === formTeacherId) || FACULTY_MEMBERS[0];

    // Conflict Check
    if (isTeacherBusyInOtherClass(formTeacherId, day, periodIdx)) {
      showToast('Teacher Conflict Alert!', `${teacherObj.name} is already assigned to another class during ${day} slot ${periodIdx + 1}.`, 'warning');
      return;
    }

    setTimetableData(prev => {
      const clsData = prev[selectedClass] || {};
      const dayData = clsData[day] || {};
      return {
        ...prev,
        [selectedClass]: {
          ...clsData,
          [day]: {
            ...dayData,
            [periodIdx]: {
              subject: formSubject,
              teacherId: teacherObj.id,
              teacherName: teacherObj.name,
              room: formRoom || 'Room 12'
            }
          }
        }
      };
    });

    setHasUnsavedChanges(true);
    setShowCellEditModal(false);

    // Attendance Allotment logic for 1st Period & 1st Period After Lunch
    const isFirstPeriod = periodIdx === 0;
    const isAfterLunchPeriod = (periodIdx > 0 && periodTimings[periodIdx - 1]?.isBreak) || periodIdx === 4;

    if (isFirstPeriod) {
      showToast('Attendance Allotted! (1st Period)', `${teacherObj.name} is now authorized for Morning Attendance for Class ${selectedClass} on ${day}.`, 'success');
    } else if (isAfterLunchPeriod) {
      showToast('Attendance Allotted! (Post-Lunch)', `${teacherObj.name} is now authorized for Afternoon Post-Lunch Attendance for Class ${selectedClass} on ${day}.`, 'success');
    }
  };

  // Clear Cell Assignment
  const handleClearCell = () => {
    if (!editingCellTarget) return;
    const { day, periodIdx } = editingCellTarget;

    setTimetableData(prev => {
      const clsData = prev[selectedClass] || {};
      const dayData = { ...(clsData[day] || {}) };
      delete dayData[periodIdx];
      return {
        ...prev,
        [selectedClass]: {
          ...clsData,
          [day]: dayData
        }
      };
    });

    setHasUnsavedChanges(true);
    setShowCellEditModal(false);
  };

  // Save All Timetable (Web Action: handleSaveAll)
  const handleSaveAllTimetable = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setHasUnsavedChanges(false);
      showToast('Timetable Saved!', `Full weekly schedule for Class ${selectedClass} saved to database.`, 'success');
    }, 800);
  };

  // Mobile Native Print Handler (Expo Print) matching Web Layout
  const handleMobilePrintSchedule = async () => {
    try {
      const classTeacher = CLASS_TEACHERS[selectedClass] || 'Not Allotted';
      
      let rowsHtml = '';
      periodTimings.forEach((timing, pIdx) => {
        if (timing.isBreak) {
          rowsHtml += `
            <tr>
              <td class="period-col">
                <div class="time-row">&#9719; ${timing.start} - ${timing.end}</div>
                <div class="period-label">${timing.label || 'Short Break'}</div>
              </td>
              <td colspan="${TIMETABLE_DAYS.length}" class="break-row">
                ${timing.label?.toUpperCase() || 'SHORT BREAK'}
              </td>
            </tr>
          `;
        } else {
          const displayPeriodIndex = periodTimings.slice(0, pIdx).filter(t => !t.isBreak).length + 1;
          let cellTdHtml = '';
          TIMETABLE_DAYS.forEach(day => {
            const cell = timetableData[selectedClass]?.[day]?.[pIdx];
            if (cell) {
              cellTdHtml += `
                <td>
                  <div class="cell-subject">${cell.subject}</div>
                  <div class="cell-teacher">${cell.teacherName}</div>
                  <div class="cell-room">${cell.room}</div>
                </td>
              `;
            } else {
              cellTdHtml += `<td></td>`;
            }
          });

          rowsHtml += `
            <tr>
              <td class="period-col">
                <div class="time-row">&#9719; ${timing.start} - ${timing.end}</div>
                <div class="period-label">Period ${displayPeriodIndex}</div>
              </td>
              ${cellTdHtml}
            </tr>
          `;
        }
      });

      const printHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Class ${selectedClass} Timetable</title>
            <style>
              @page {
                size: landscape;
                margin: 0.8cm;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #ffffff;
                color: #111827;
                margin: 0;
                padding: 10px;
              }
              .title {
                text-align: center;
                font-size: 22px;
                font-weight: 700;
                margin: 0 0 16px 0;
                color: #000000;
              }
              .table-card {
                border: 1px solid #e5e7eb;
                border-radius: 14px;
                padding: 12px;
                background-color: #ffffff;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
              }
              th {
                padding: 8px 10px;
                text-align: left;
                font-size: 11.5px;
                font-weight: 600;
                color: #4b5563;
                border-bottom: 1px solid #e5e7eb;
              }
              td {
                padding: 8px 10px;
                border-bottom: 1px solid #f3f4f6;
                border-left: 1px solid #f3f4f6;
                vertical-align: top;
              }
              td:first-child {
                border-left: none;
              }
              .period-col {
                width: 125px;
                color: #6b7280;
                font-size: 10.5px;
              }
              .time-row {
                color: #6b7280;
                font-size: 10.5px;
                font-weight: 500;
                margin-bottom: 2px;
              }
              .period-label {
                color: #6b7280;
                font-size: 10.5px;
              }
              .break-row {
                text-align: center;
                font-weight: 700;
                color: #4b5563;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                font-size: 11px;
                padding: 12px;
              }
              .cell-subject {
                font-weight: 700;
                color: #111827;
                font-size: 11.5px;
                margin-bottom: 2px;
              }
              .cell-teacher {
                color: #4b5563;
                font-size: 10.5px;
              }
              .cell-room {
                color: #9ca3af;
                font-size: 9.5px;
                margin-top: 2px;
              }
            </style>
          </head>
          <body>
            <h1 class="title">Class ${selectedClass} Timetable</h1>
            <div class="table-card">
              <table>
                <thead>
                  <tr>
                    <th style="width: 125px;">Period</th>
                    ${TIMETABLE_DAYS.map(d => `<th>${d}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </body>
        </html>
      `;

      await Print.printAsync({ html: printHtml });
    } catch (error) {
      console.error('Print Error:', error);
      showToast('Print Error', 'Could not open default printer dialog.', 'warning');
    }
  };

  // Edit Timings Handlers (Web Action: savePeriodTimings)
  const handleAddPeriodTiming = () => {
    const last = tempTimings[tempTimings.length - 1];
    let nextStart = '02:30';
    let nextEnd = '03:15';
    if (last) {
      nextStart = last.end;
      nextEnd = '03:30';
    }
    const newIdx = tempTimings.length + 1;
    setTempTimings([...tempTimings, { period: newIdx, label: `Period ${newIdx}`, start: nextStart, end: nextEnd }]);
  };

  const handleRemoveLastPeriodTiming = () => {
    if (tempTimings.length <= 1) return;
    setTempTimings(prev => prev.slice(0, -1));
  };

  const handleSavePeriodTimings = () => {
    setPeriodTimings(tempTimings);
    setShowEditTimingsModal(false);
    showToast('Period Timings Saved', 'Configured start and end times updated for all timetable grids.', 'success');
  };

  const currentDaySchedule = timetableData[selectedClass]?.[activeDay] || {};

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';
  const primaryPillClass = isSuperAdmin ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-emerald-500/15 border border-emerald-500/30';

  return (
    <View style={[styles.container, isSuperAdmin && { backgroundColor: '#101415' }]}>
      <LinearGradient
        colors={isSuperAdmin ? ['#1d2022', '#101415'] : ['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Timetable Designer"
        subtitle={`Class Teacher: ${CLASS_TEACHERS[selectedClass] || 'Not Allotted'}`}
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <Calendar size={20} color={primaryColor} />
          </View>
        }
      />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Class Selection Ribbon */}
        <View className="px-5 mb-4">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Target Class Section</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {INITIAL_CLASSES.map(cls => {
                const isSelected = selectedClass === cls;
                return (
                  <Pressable
                    key={cls}
                    onPress={() => setSelectedClass(cls)}
                    className={`px-4 py-2.5 rounded-2xl border ${isSelected ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/5 border-white/15'}`}
                  >
                    <Text className={`text-xs font-extrabold ${isSelected ? 'text-[#101415]' : 'text-white/70'}`}>
                      Class {cls}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Web Header Controls Bar (Periods Count Badge, Print, Edit Timings, Save Timetable) */}
        <View className="px-5 mb-4">
          <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/90">
            <View className="flex-row justify-between items-center mb-3 flex-wrap" style={{ gap: 8 }}>
              <View className="flex-row items-center flex-wrap" style={{ gap: 6 }}>
                <View className="bg-sky-500/15 border border-sky-500/30 px-3 py-1 rounded-xl">
                  <Text className="text-sky-400 text-xs font-bold">{countFilledPeriods()} Periods Assigned</Text>
                </View>
                {hasUnsavedChanges && (
                  <View className="bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                    <Text className="text-amber-400 text-[10px] font-bold">● Unsaved Changes</Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={handleMobilePrintSchedule}
                className="bg-white/5 border border-white/15 px-3 py-1.5 rounded-xl flex-row items-center active:scale-95 flex-shrink-0"
              >
                <Printer size={13} color={primaryColor} style={{ marginRight: 5 }} />
                <Text className={`${primaryTextClass} text-xs font-bold`}>Print Schedule</Text>
              </Pressable>
            </View>

            {/* Main Web Action Buttons */}
            <View className="flex-row" style={{ gap: 10 }}>
              <Pressable
                onPress={() => {
                  setTempTimings([...periodTimings]);
                  setShowEditTimingsModal(true);
                }}
                className="flex-1 bg-white/5 border border-white/15 py-2.5 rounded-xl flex-row items-center justify-center"
              >
                <Clock size={14} color="rgba(255,255,255,0.8)" style={{ marginRight: 6 }} />
                <Text className="text-white/90 text-xs font-bold">Edit Timings</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveAllTimetable}
                disabled={isSaving}
                className={`flex-1 ${primaryBtnClass} py-2.5 rounded-xl flex-row items-center justify-center shadow-lg`}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#101415" />
                ) : (
                  <>
                    <Save size={14} color="#101415" style={{ marginRight: 6 }} />
                    <Text className="text-[#101415] text-xs font-extrabold">Save Timetable</Text>
                  </>
                )}
              </Pressable>
            </View>
          </GlassCard>
        </View>

        {/* Day Selector Tabs */}
        <View className="px-5 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {TIMETABLE_DAYS.map(day => {
                const isSelected = activeDay === day;
                return (
                  <Pressable
                    key={day}
                    onPress={() => setActiveDay(day)}
                    className={`px-3.5 py-2 rounded-xl border ${isSelected ? (isSuperAdmin ? 'bg-[#f0c110]/20 border-[#f0c110]' : 'bg-[#00f1a1]/20 border-[#00f1a1]') : 'bg-white/5 border-white/10'}`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? primaryTextClass : 'text-white/60'}`}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Timetable Period Slots for Selected Day */}
        <View className="px-5">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">
            {activeDay} Schedule ({selectedClass})
          </Text>

          {periodTimings.map((timing, pIdx) => {
            if (timing.isBreak) {
              return (
                <View key={pIdx} className="bg-white/5 border border-dashed border-white/20 p-3 rounded-2xl mb-3 flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Clock size={16} color="rgba(255,255,255,0.4)" style={{ marginRight: 8 }} />
                    <Text className="text-white/60 text-xs font-bold uppercase">{timing.label || 'BREAK / LUNCH'}</Text>
                  </View>
                  <Text className="text-white/40 text-xs font-mono">{timing.start} - {timing.end}</Text>
                </View>
              );
            }

            const cell = currentDaySchedule[pIdx];
            const badgeStyle = cell ? (SUBJECT_COLORS[cell.subject] || SUBJECT_COLORS.Mathematics) : null;
            const displayPeriodIndex = periodTimings.slice(0, pIdx).filter(t => !t.isBreak).length + 1;

            return (
              <GlassCard key={pIdx} intensity="low" className="mb-3 p-3.5 border-white/10 bg-[#101415]/90">
                <View className="flex-row justify-between items-center">
                  {/* Period Time Slot */}
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-12 h-11 rounded-xl bg-white/5 border border-white/10 items-center justify-center mr-3">
                      <Text className={`${primaryTextClass} text-xs font-extrabold`}>P{displayPeriodIndex}</Text>
                      <Text className="text-white/40 text-[8px] font-mono mt-0.5" numberOfLines={1}>{timing.start}</Text>
                    </View>

                    {cell ? (
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-white font-extrabold text-sm mr-2">{cell.subject}</Text>
                          <View className={`${badgeStyle?.bg} ${badgeStyle?.border} border px-2 py-0.5 rounded-md`}>
                            <Text className={`${badgeStyle?.text} text-[9.5px] font-bold`}>{cell.room}</Text>
                          </View>
                        </View>
                        <Text className="text-white/50 text-[11px] mt-0.5">{cell.teacherName}</Text>
                      </View>
                    ) : (
                      <View className="flex-1">
                        <Text className="text-white/40 text-xs italic">Unassigned Period</Text>
                        <Text className="text-white/30 text-[10px]">Tap to assign subject & faculty</Text>
                      </View>
                    )}
                  </View>

                  {/* Assign / Edit Action Button */}
                  <Pressable
                    onPress={() => handleOpenCellEdit(activeDay, pIdx)}
                    className={`px-3.5 py-2 rounded-xl flex-row items-center border ${cell ? 'bg-white/5 border-white/15' : (isSuperAdmin ? 'bg-[#f0c110]/15 border-[#f0c110]/40' : 'bg-[#00f1a1]/15 border-[#00f1a1]/40')}`}
                  >
                    {cell ? (
                      <>
                        <Pencil size={13} color="rgba(255,255,255,0.7)" style={{ marginRight: 5 }} />
                        <Text className="text-white/80 text-xs font-bold">Edit</Text>
                      </>
                    ) : (
                      <>
                        <Plus size={13} color={primaryColor} style={{ marginRight: 5 }} />
                        <Text className={`${primaryTextClass} text-xs font-extrabold`}>Assign</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </GlassCard>
            );
          })}
        </View>

        {/* Subject Colors Legend */}
        <View className="px-5 mt-4">
          <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">Subject Color Legend</Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {Object.keys(SUBJECT_COLORS).slice(0, 8).map((subKey) => (
              <View key={subKey} className="flex-row items-center bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                <View className={`w-2 h-2 rounded-full mr-1.5 ${isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]'}`} />
                <Text className="text-white/60 text-[10px] font-semibold">{subKey}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* EDIT PERIOD CELL MODAL (WITH MANUAL ROOM OPTION) */}
      <Modal visible={showCellEditModal} transparent animationType="slide" onRequestClose={() => setShowCellEditModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-md p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <View className="flex-row items-center">
                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${primaryBadgeClass}`}>
                  <BookOpen size={16} color={primaryColor} />
                </View>
                <View>
                  <Text className="text-white font-bold text-base">Edit Period Cell</Text>
                  <Text className={`${primaryTextClass} text-[11px] font-bold`}>
                    Class {selectedClass} • {editingCellTarget?.day} (Slot {(editingCellTarget?.periodIdx ?? 0) + 1})
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setShowCellEditModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              {/* Select Subject */}
              <Text className="text-white/70 text-xs font-bold mb-1.5">Subject *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                <View className="flex-row" style={{ gap: 6 }}>
                  {SUBJECTS.map(sub => {
                    const isSel = formSubject === sub;
                    return (
                      <Pressable
                        key={sub}
                        onPress={() => setFormSubject(sub)}
                        className={`px-3 py-1.5 rounded-xl border ${isSel ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/5 border-white/15'}`}
                      >
                        <Text className={`text-xs font-bold ${isSel ? 'text-[#101415]' : 'text-white/70'}`}>{sub}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Select Teacher with Conflict Protection */}
              <Text className="text-white/70 text-xs font-bold mb-1.5">Assigned Teacher *</Text>
              <View className="mb-4" style={{ gap: 6 }}>
                {FACULTY_MEMBERS.map(fac => {
                  const isSel = formTeacherId === fac.id;
                  const isBusy = editingCellTarget ? isTeacherBusyInOtherClass(fac.id, editingCellTarget.day, editingCellTarget.periodIdx) : false;

                  return (
                    <Pressable
                      key={fac.id}
                      onPress={() => setFormTeacherId(fac.id)}
                      className={`p-2.5 rounded-xl border flex-row justify-between items-center ${isSel ? (isSuperAdmin ? 'bg-[#f0c110]/20 border-[#f0c110]' : 'bg-[#00f1a1]/20 border-[#00f1a1]') : isBusy ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/5 border-white/10'}`}
                    >
                      <View>
                        <Text className={`text-xs font-bold ${isSel ? primaryTextClass : 'text-white'}`}>{fac.name}</Text>
                        <Text className="text-white/40 text-[10px]">{fac.subject}</Text>
                      </View>

                      {isBusy ? (
                        <View className="bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded-md">
                          <Text className="text-rose-400 text-[9px] font-bold">Busy elsewhere</Text>
                        </View>
                      ) : (
                        <View className={`px-2 py-0.5 rounded-md ${primaryBadgeClass}`}>
                          <Text className={`${primaryTextClass} text-[9px] font-bold`}>Available</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Select Room with Manual Entry Toggle (Web Feature) */}
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-white/70 text-xs font-bold">Classroom / Room No *</Text>
                <Pressable onPress={() => setIsManualRoomMode(!isManualRoomMode)}>
                  <Text className={`${primaryTextClass} text-[10px] font-bold`}>
                    {isManualRoomMode ? 'Select from list' : '+ Custom Room'}
                  </Text>
                </Pressable>
              </View>

              {isManualRoomMode ? (
                <TextInput
                  value={formRoom}
                  onChangeText={setFormRoom}
                  placeholder="Enter custom room (e.g. Lab 3, Auditorium)..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs mb-4"
                />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row" style={{ gap: 6 }}>
                    {ROOMS.map(rm => {
                      const isSel = formRoom === rm;
                      return (
                        <Pressable
                          key={rm}
                          onPress={() => setFormRoom(rm)}
                          className={`px-3 py-1.5 rounded-xl border ${isSel ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/5 border-white/15'}`}
                        >
                          <Text className={`text-xs font-bold ${isSel ? 'text-[#101415]' : 'text-white/70'}`}>{rm}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </ScrollView>

            {/* Footer Action Buttons */}
            <View className="flex-row border-t border-white/10 pt-3 mt-2" style={{ gap: 10 }}>
              {editingCellTarget?.currentCell && (
                <Pressable onPress={handleClearCell} className="py-3 px-4 rounded-xl bg-rose-500/20 border border-rose-500/40 items-center">
                  <Text className="text-rose-400 font-bold text-xs">Clear</Text>
                </Pressable>
              )}
              <Pressable onPress={() => setShowCellEditModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveCell} className={`flex-1 py-3 rounded-xl ${primaryBtnClass} items-center shadow-lg`}>
                <Text className="text-[#101415] font-extrabold text-xs">Save Period</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT PERIOD TIMINGS MODAL (FULL WEB MATCH WITH DYNAMIC ADD/REMOVE AND BREAK TYPE) */}
      <Modal visible={showEditTimingsModal} transparent animationType="slide" onRequestClose={() => setShowEditTimingsModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-md p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <View className="flex-row items-center">
                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${primaryBadgeClass}`}>
                  <Clock size={16} color={primaryColor} />
                </View>
                <View>
                  <Text className="text-white font-bold text-base">Edit Period Timings</Text>
                  <Text className="text-white/50 text-[10px]">Set start and end times for each period slot</Text>
                </View>
              </View>
              <Pressable onPress={() => setShowEditTimingsModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              {tempTimings.map((t, idx) => (
                <View key={idx} className="mb-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-white font-extrabold text-xs">
                      {t.isBreak ? 'Break Slot' : `Period ${idx + 1}`}
                    </Text>

                    {/* Toggle Period vs Break */}
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Pressable
                        onPress={() => {
                          const copy = [...tempTimings];
                          copy[idx] = { ...copy[idx], isBreak: !copy[idx].isBreak, label: !copy[idx].isBreak ? 'Lunch Break' : `Period ${idx + 1}` };
                          setTempTimings(copy);
                        }}
                        className={`px-2.5 py-1 rounded-lg border ${t.isBreak ? 'bg-amber-500/20 border-amber-500/40' : 'bg-white/10 border-white/15'}`}
                      >
                        <Text className={`text-[10px] font-bold ${t.isBreak ? 'text-amber-400' : 'text-white/70'}`}>
                          {t.isBreak ? 'Break Slot' : 'Standard Period'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <View className="flex-1">
                      <Text className="text-white/40 text-[9px] mb-1">Start Time</Text>
                      <TextInput
                        value={t.start}
                        onChangeText={(val) => {
                          const copy = [...tempTimings];
                          copy[idx].start = val;
                          setTempTimings(copy);
                        }}
                        placeholder="08:30"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        className="bg-black/40 border border-white/15 rounded-xl text-white px-2.5 py-1.5 text-xs font-mono text-center"
                      />
                    </View>

                    <Text className="text-white/40 text-xs mt-3">to</Text>

                    <View className="flex-1">
                      <Text className="text-white/40 text-[9px] mb-1">End Time</Text>
                      <TextInput
                        value={t.end}
                        onChangeText={(val) => {
                          const copy = [...tempTimings];
                          copy[idx].end = val;
                          setTempTimings(copy);
                        }}
                        placeholder="09:15"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        className="bg-black/40 border border-white/15 rounded-xl text-white px-2.5 py-1.5 text-xs font-mono text-center"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Dynamic Add / Remove Period Controls */}
            <View className="flex-row justify-between items-center py-2.5 border-t border-b border-white/10 my-2 px-1">
              <Pressable onPress={handleAddPeriodTiming} className="flex-row items-center">
                <Plus size={14} color={primaryColor} style={{ marginRight: 4 }} />
                <Text className={`${primaryTextClass} text-xs font-bold`}>+ Add Period</Text>
              </Pressable>

              {tempTimings.length > 1 && (
                <Pressable onPress={handleRemoveLastPeriodTiming} className="flex-row items-center">
                  <Trash2 size={13} color="#ff516a" style={{ marginRight: 4 }} />
                  <Text className="text-rose-400 text-xs font-bold">- Remove Last Period</Text>
                </Pressable>
              )}
            </View>

            <View className="flex-row pt-2" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowEditTimingsModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSavePeriodTimings} className={`flex-1 py-3 rounded-xl ${primaryBtnClass} items-center shadow-lg`}>
                <Text className="text-[#101415] font-extrabold text-xs">Save Timings</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* PRINT SCHEDULE PREVIEW MODAL */}
      <Modal visible={showPrintModal} transparent animationType="slide" onRequestClose={() => setShowPrintModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-md p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <View className="flex-row items-center">
                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${primaryBadgeClass}`}>
                  <Printer size={16} color={primaryColor} />
                </View>
                <View>
                  <Text className="text-white font-bold text-base">Class {selectedClass} Timetable Schedule</Text>
                  <Text className="text-white/50 text-[10px]">Print Preview & Export View</Text>
                </View>
              </View>
              <Pressable onPress={() => setShowPrintModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {TIMETABLE_DAYS.map(day => {
                const daySchedule = timetableData[selectedClass]?.[day] || {};
                return (
                  <View key={day} className="mb-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <Text className={`${primaryTextClass} font-bold text-xs mb-1.5 uppercase`}>{day}</Text>
                    {Object.keys(daySchedule).length > 0 ? (
                      Object.entries(daySchedule).map(([pIdx, cell]) => (
                        <View key={pIdx} className="flex-row justify-between py-1 border-b border-white/5">
                          <Text className="text-white text-xs font-semibold">{cell.subject}</Text>
                          <Text className="text-white/50 text-[11px]">{cell.teacherName} ({cell.room})</Text>
                        </View>
                      ))
                    ) : (
                      <Text className="text-white/30 text-[11px] italic">No periods assigned for {day}</Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={() => {
                setShowPrintModal(false);
                handleMobilePrintSchedule();
              }}
              className={`w-full py-3 rounded-xl ${primaryBtnClass} items-center mt-3 shadow-lg`}
            >
              <Text className="text-[#101415] font-extrabold text-xs">Print / Export PDF</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* CUSTOM ADMIN STAFF TOAST MODAL */}
      <Modal visible={toastData.visible} transparent animationType="fade" onRequestClose={() => setToastData(prev => ({ ...prev, visible: false }))}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-sm p-6 items-center ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            <View className={`w-14 h-14 rounded-full items-center justify-center mb-4 border ${toastData.type === 'warning' ? 'bg-amber-500/20 border-amber-500/40' : primaryBadgeClass}`}>
              {toastData.type === 'warning' ? (
                <AlertCircle size={28} color="#f59e0b" />
              ) : (
                <CheckCircle2 size={28} color={primaryColor} />
              )}
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">{toastData.title}</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">{toastData.message}</Text>

            <Pressable
              onPress={() => setToastData(prev => ({ ...prev, visible: false }))}
              className={`w-full py-3.5 rounded-xl ${primaryBtnClass} items-center shadow-lg`}
            >
              <Text className="text-[#101415] font-extrabold text-sm">Got it</Text>
            </Pressable>
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

export default TimetableBuilderScreen;
