import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput, BackHandler, PanResponder } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  BookOpen, Calendar, Search, Send, 
  CheckCircle2, AlertCircle, X, Clock, ArrowLeft, 
  ChevronRight, RefreshCw, Paperclip, ChevronLeft
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { useDiaryStore, DiaryEntry } from '../../store/diaryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

export interface ClassDiarySubmissionSummary {
  classId: string;
  className: string;
  hasSchedule: boolean;
}

export interface PeriodStructure {
  periodNumber: number;
  periodLabel: string;
  timeSlot: string;
  isBreak?: boolean;
  breakLabel?: string;
}

const ALL_CLASSES_LIST: ClassDiarySubmissionSummary[] = [
  { classId: '1A', className: 'Class 1A', hasSchedule: false },
  { classId: '1B', className: 'Class 1B', hasSchedule: false },
  { classId: '2A', className: 'Class 2A', hasSchedule: false },
  { classId: '2B', className: 'Class 2B', hasSchedule: false },
  { classId: '3A', className: 'Class 3A', hasSchedule: false },
  { classId: '3B', className: 'Class 3B', hasSchedule: false },
  { classId: '4A', className: 'Class 4A', hasSchedule: false },
  { classId: '4B', className: 'Class 4B', hasSchedule: false },
  { classId: '5A', className: 'Class 5A', hasSchedule: false },
  { classId: '5B', className: 'Class 5B', hasSchedule: false },
  { classId: '6A', className: 'Class 6A', hasSchedule: true },
  { classId: '6B', className: 'Class 6B', hasSchedule: true },
  { classId: '7A', className: 'Class 7A', hasSchedule: true },
  { classId: '7B', className: 'Class 7B', hasSchedule: true },
  { classId: '8A', className: 'Class 8A', hasSchedule: true },
  { classId: '8B', className: 'Class 8B', hasSchedule: true },
  { classId: '9A', className: 'Class 9A', hasSchedule: true },
  { classId: '9B', className: 'Class 9B', hasSchedule: true },
  { classId: '10A', className: 'Class 10A', hasSchedule: true },
  { classId: '10B', className: 'Class 10B', hasSchedule: true }
];

const PERIOD_STRUCTURE_LIST: PeriodStructure[] = [
  { periodNumber: 1, periodLabel: 'Period 1', timeSlot: '8:00 AM - 9:00 AM' },
  { periodNumber: 2, periodLabel: 'Period 2', timeSlot: '9:00 AM - 10:00 AM' },
  { periodNumber: 3, periodLabel: 'Period 3', timeSlot: '10:00 AM - 11:00 AM' },
  { periodNumber: 4, periodLabel: 'Short Break', timeSlot: '11:00 AM - 11:15 AM', isBreak: true, breakLabel: 'Short Break' },
  { periodNumber: 5, periodLabel: 'Period 4', timeSlot: '11:15 AM - 12:15 PM' },
  { periodNumber: 6, periodLabel: 'Period 5', timeSlot: '12:15 PM - 1:15 PM' },
  { periodNumber: 7, periodLabel: 'Lunch Break', timeSlot: '1:15 PM - 2:00 PM', isBreak: true, breakLabel: 'Lunch Break' },
  { periodNumber: 8, periodLabel: 'Period 6', timeSlot: '2:00 PM - 3:00 PM' },
  { periodNumber: 9, periodLabel: 'Period 7', timeSlot: '3:00 PM - 4:00 PM' },
  { periodNumber: 10, periodLabel: 'Period 8', timeSlot: '4:00 PM - 5:00 PM' }
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AdminDailyDiaryScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();
  const diaryEntries = useDiaryStore((state) => state.diaryEntries);
  const [selectedAcademicYear] = useState('2026-2027 (Current)');
  const [selectedDate, setSelectedDate] = useState('04-08-2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassDetail, setSelectedClassDetail] = useState<string | null>(null);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  // Handle Hardware Back Button & System Back Gesture (matching chevron left behavior)
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (showDatePickerModal) {
          setShowDatePickerModal(false);
          return true;
        }
        if (selectedClassDetail) {
          setSelectedClassDetail(null);
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
    }, [selectedClassDetail, showDatePickerModal, navigation])
  );

  // Filtered Class List
  const filteredClasses = ALL_CLASSES_LIST.filter(c => 
    c.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate live submissions per class for selected date
  const getClassEntriesCount = (classId: string) => {
    return diaryEntries.filter(e => e.classId.toUpperCase() === classId.toUpperCase() && e.date === selectedDate).length;
  };

  const totalClasses = ALL_CLASSES_LIST.length;
  const classesSubmittedCount = ALL_CLASSES_LIST.filter(c => getClassEntriesCount(c.classId) > 0).length;
  const pendingClassesCount = ALL_CLASSES_LIST.filter(c => c.hasSchedule && getClassEntriesCount(c.classId) < 5).length;

  // Real JS Date-based Calendar State (default August 2026)
  const [viewDate, setViewDate] = useState(new Date(2026, 7, 4));

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const calPrevMonthRef = useRef(handlePrevMonth);
  const calNextMonthRef = useRef(handleNextMonth);
  calPrevMonthRef.current = handlePrevMonth;
  calNextMonthRef.current = handleNextMonth;

  // Swipe Gesture Responder for Calendar Month Grid (Right-to-Left: Next Month, Left-to-Right: Previous Month)
  const calSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 15;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -35) {
          calNextMonthRef.current?.();
        } else if (gestureState.dx > 35) {
          calPrevMonthRef.current?.();
        }
      },
    })
  ).current;

  const monthYearDisplay = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Generate 7-column Calendar Grid Days dynamically using real JS Date math
  const generateRealCalendarGrid = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayIdx = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{ dayNum: number; dateStr: string } | null> = [];

    for (let i = 0; i < firstDayIdx; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const monthStr = String(month + 1).padStart(2, '0');
      days.push({ dayNum: d, dateStr: `${dayStr}-${monthStr}-${year}` });
    }

    return days;
  };

  const calendarGridDays = generateRealCalendarGrid();

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
        style={StyleSheet.absoluteFill}
      />

      <AdminStaffHeader
        onBackPress={
          selectedClassDetail 
            ? () => setSelectedClassDetail(null) 
            : navigation?.canGoBack && navigation.canGoBack() 
            ? () => navigation.goBack() 
            : undefined
        }
        title={selectedClassDetail ? `Class ${selectedClassDetail} Submissions` : "Daily Diary Console"}
        subtitle={selectedClassDetail ? "Period-wise breakdown of scheduled teachers and diaries" : `ACADEMIC YEAR: ${selectedAcademicYear}`}
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <BookOpen size={20} color={primaryColor} />
          </View>
        }
      />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* LEVEL 1: ALL CLASSES OVERVIEW */}
        {!selectedClassDetail ? (
          <>
            {/* Top 3 Web KPI Header Cards */}
            <View className="px-5 mb-5 flex-row justify-between" style={{ gap: 6 }}>
              <GlassCard intensity="low" className="flex-1 p-2.5 sm:p-3.5 border-white/10 bg-[#101415]/80 items-center">
                <View className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl items-center justify-center mb-1 ${primaryBadgeClass}`}>
                  <BookOpen size={15} color={primaryColor} />
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-white/50 text-[8.5px] sm:text-[9px] font-bold uppercase text-center">Diaries Submitted</Text>
                <Text numberOfLines={1} className="text-white text-lg sm:text-xl font-extrabold mt-0.5">{classesSubmittedCount}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit className={`${primaryTextClass} text-[8.5px] sm:text-[9px] font-semibold text-center mt-0.5`}>Out of {totalClasses} classes</Text>
              </GlassCard>

              <GlassCard intensity="low" className="flex-1 p-2.5 sm:p-3.5 border-white/10 bg-[#101415]/80 items-center">
                <View className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 items-center justify-center mb-1">
                  <Send size={15} color="#38bdf8" />
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-white/50 text-[8.5px] sm:text-[9px] font-bold uppercase text-center">Messages Delivered</Text>
                <Text numberOfLines={1} className="text-white text-lg sm:text-xl font-extrabold mt-0.5">{classesSubmittedCount * 28}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-sky-400 text-[8.5px] sm:text-[9px] font-semibold text-center mt-0.5">WhatsApp + SMS</Text>
              </GlassCard>

              <GlassCard intensity="low" className="flex-1 p-2.5 sm:p-3.5 border-white/10 bg-[#101415]/80 items-center">
                <View className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 items-center justify-center mb-1">
                  <Clock size={15} color="#f59e0b" />
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-white/50 text-[8.5px] sm:text-[9px] font-bold uppercase text-center">Pending</Text>
                <Text numberOfLines={1} className="text-amber-400 text-lg sm:text-xl font-extrabold mt-0.5">{pendingClassesCount}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-amber-300 text-[8.5px] sm:text-[9px] font-semibold text-center mt-0.5">Not yet updated</Text>
              </GlassCard>
            </View>

            {/* Sub-header Controls Bar */}
            <View className="px-5 mb-4">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-white font-extrabold text-lg sm:text-xl" style={{ fontSize: 20 }} numberOfLines={1}>
                  Diary Submissions
                </Text>

                <View className="flex-row items-center flex-shrink-0" style={{ gap: 6 }}>
                  {/* Interactive Calendar View Date Picker Trigger */}
                  <Pressable
                    onPress={() => setShowDatePickerModal(true)}
                    className={`${isSuperAdmin ? 'bg-[#f0c110]/15 border border-[#f0c110]/40' : 'bg-[#00f1a1]/15 border border-[#00f1a1]/40'} px-2.5 sm:px-3 py-1.5 rounded-xl flex-row items-center flex-shrink-0 active:scale-95`}
                  >
                    <Calendar size={12} color={primaryColor} style={{ marginRight: 4 }} />
                    <Text className={`${primaryTextClass} text-[11px] sm:text-xs font-bold`} numberOfLines={1}>{selectedDate}</Text>
                  </Pressable>

                  <View className={`${primaryPillClass} px-2.5 py-1.5 rounded-xl flex-row items-center flex-shrink-0`}>
                    <RefreshCw size={11} color={primaryColor} style={{ marginRight: 4 }} />
                    <Text className={`${primaryTextClass} text-[10px] font-bold`} numberOfLines={1} style={{ flexShrink: 0 }}>
                      Live Sync
                    </Text>
                  </View>
                </View>
              </View>

              <Text className="text-white/40 text-[11px]">
                Select a class section to view period breakdown
              </Text>
            </View>

            {/* Search Bar */}
            <View className="px-5 mb-4">
              <View className="bg-[#101415] border border-white/15 rounded-2xl flex-row items-center px-3.5 py-2.5 shadow-md">
                <Search size={16} color={primaryColor} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Search class section..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 text-white text-xs"
                  style={{ paddingVertical: 0 }}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <X size={15} color="rgba(255, 255, 255, 0.5)" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* All Class Submission Cards List */}
            <View className="px-5">
              {filteredClasses.map((cls) => {
                const subCount = getClassEntriesCount(cls.classId);
                const isNoSchedule = !cls.hasSchedule;
                const isFullySubmitted = cls.hasSchedule && subCount >= 5;

                return (
                  <Pressable key={cls.classId} onPress={() => setSelectedClassDetail(cls.classId)}>
                    <GlassCard intensity="low" className="mb-3 p-4 border-white/10 bg-[#101415]/90">
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center flex-1 mr-2 min-w-0">
                          <View className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 items-center justify-center mr-2.5 flex-shrink-0">
                            <Text className={`${primaryTextClass} text-xs font-extrabold`}>{cls.classId}</Text>
                          </View>

                          <View className="flex-1 min-w-0">
                            <View className="flex-row items-center flex-wrap" style={{ gap: 4 }}>
                              <Text className="text-white font-extrabold text-sm" numberOfLines={1}>{cls.className}</Text>
                              {isNoSchedule ? (
                                <Text className="text-white/40 text-[10px] italic">No Schedule</Text>
                              ) : isFullySubmitted ? (
                                <View className={`px-2 py-0.5 rounded-md ${primaryBadgeClass} flex-shrink-0`}>
                                  <Text className={`${primaryTextClass} text-[9px] font-bold`}>Complete</Text>
                                </View>
                              ) : (
                                <View className="bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-md flex-shrink-0">
                                  <Text className="text-amber-400 text-[9px] font-bold">Pending</Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-white/60 text-[11px] mt-0.5" numberOfLines={1}>
                              {isNoSchedule ? 'No Schedule' : `${subCount} Teacher${subCount === 1 ? '' : 's'} Submitted`}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center flex-shrink-0">
                          <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            className={`${primaryTextClass} text-xs font-bold mr-1`}
                            style={{ flexShrink: 0 }}
                          >
                            Click to view details
                          </Text>
                          <ChevronRight size={14} color={primaryColor} />
                        </View>
                      </View>
                    </GlassCard>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          /* LEVEL 2: DETAILED PERIOD-WISE TIMELINE BREAKDOWN (READING LIVE SUBMISSIONS FROM TEACHER LOGIN) */
          <View className="px-5">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-white font-extrabold text-base">Class {selectedClassDetail} Submissions</Text>
                <Text className="text-white/50 text-[10.5px]">Timeline for Tuesday • {selectedDate}</Text>
              </View>

              <Pressable
                onPress={() => setShowDatePickerModal(true)}
                className={`${isSuperAdmin ? 'bg-[#f0c110]/15 border border-[#f0c110]/40' : 'bg-[#00f1a1]/15 border border-[#00f1a1]/40'} px-3 py-1.5 rounded-xl flex-row items-center`}
              >
                <Calendar size={13} color={primaryColor} style={{ marginRight: 5 }} />
                <Text className={`${primaryTextClass} text-xs font-bold`}>{selectedDate}</Text>
              </Pressable>
            </View>

            {/* Period-wise Rows Timeline List */}
            {PERIOD_STRUCTURE_LIST.map((pt, idx) => {
              if (pt.isBreak) {
                return (
                  <View key={idx} className="bg-white/5 border border-dashed border-white/20 p-3 rounded-2xl mb-3 items-center">
                    <Text className="text-white/60 text-xs font-bold uppercase tracking-wider">
                      {pt.breakLabel || 'SHORT BREAK'} ({pt.timeSlot})
                    </Text>
                  </View>
                );
              }

              // Match submitted entry for this class, date, and periodNumber
              const submittedEntry = diaryEntries.find(
                e => e.classId.toUpperCase() === (selectedClassDetail || '').toUpperCase() && 
                     e.periodNumber === pt.periodNumber && 
                     e.date === selectedDate
              );

              return (
                <GlassCard key={idx} intensity="low" className="mb-3 p-3.5 border-white/10 bg-[#101415]/90">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className={`${primaryTextClass} text-xs font-extrabold`}>
                      {pt.periodLabel} ({pt.timeSlot})
                    </Text>
                    {submittedEntry && (
                      <View className={`px-2 py-0.5 rounded-md ${primaryBadgeClass}`}>
                        <Text className={`${primaryTextClass} text-[9px] font-bold`}>Submitted {submittedEntry.submittedAt}</Text>
                      </View>
                    )}
                  </View>

                  {submittedEntry ? (
                    <View className="mt-1">
                      <View className="flex-row items-center">
                        <Text className="text-white font-extrabold text-sm mr-2">{submittedEntry.subject}</Text>
                        <Text className="text-white/60 text-xs">— {submittedEntry.teacherName}</Text>
                      </View>
                      <Text className="text-white/80 text-xs font-bold mt-1.5">{submittedEntry.topicTitle}</Text>
                      <Text className="text-white/60 text-xs mt-1 leading-relaxed">{submittedEntry.contentSummary}</Text>

                      {submittedEntry.homework && (
                        <View className="bg-black/40 p-2.5 rounded-xl border border-white/5 mt-2.5">
                          <Text className="text-amber-400 text-xs font-bold">Homework: <Text className="text-white/80 font-normal">{submittedEntry.homework}</Text></Text>
                        </View>
                      )}

                      {submittedEntry.attachmentName && (
                        <View className="flex-row items-center mt-2">
                          <Paperclip size={12} color="#38bdf8" style={{ marginRight: 4 }} />
                          <Text className="text-sky-400 text-[11px] font-semibold">{submittedEntry.attachmentName}</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text className="text-white/30 text-xs italic mt-1">No subject scheduled / Pending submission</Text>
                  )}
                </GlassCard>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FULL MONTHLY CALENDAR GRID VIEW DATE PICKER MODAL */}
      <Modal visible={showDatePickerModal} transparent animationType="slide" onRequestClose={() => setShowDatePickerModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-sm p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            {/* Header */}
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-3">
              <View className="flex-row items-center">
                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${primaryBadgeClass}`}>
                  <Calendar size={16} color={primaryColor} />
                </View>
                <Text className="text-white font-bold text-base">Calendar Date Picker</Text>
              </View>
              <Pressable onPress={() => setShowDatePickerModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            {/* Month Year Ribbon */}
            <View className="flex-row justify-between items-center bg-white/5 p-2.5 rounded-2xl mb-3 border border-white/10">
              <Pressable onPress={handlePrevMonth} className="p-1 border border-white/10 rounded-lg bg-white/5">
                <ChevronLeft size={16} color={primaryColor} />
              </Pressable>
              <Text className="text-white font-extrabold text-sm">{monthYearDisplay}</Text>
              <Pressable onPress={handleNextMonth} className="p-1 border border-white/10 rounded-lg bg-white/5">
                <ChevronRight size={16} color={primaryColor} />
              </Pressable>
            </View>

            {/* Swipeable Calendar Grid Container (Swipe Left/Right to change months) */}
            <View {...calSwipeResponder.panHandlers}>
              {/* 7-Column Days of Week Bar (14.28% Width Each) */}
              <View className="flex-row mb-2">
                {DAYS_OF_WEEK.map((d, i) => (
                  <View key={i} style={{ width: '14.28%', alignItems: 'center' }}>
                    <Text className="text-white/40 text-[10px] font-bold uppercase">{d}</Text>
                  </View>
                ))}
              </View>

              {/* 7-Column Calendar Days Grid (14.28% Width Each) */}
              <View className="flex-row flex-wrap mb-4">
                {calendarGridDays.map((cell, idx) => {
                  if (!cell) {
                    return <View key={idx} style={{ width: '14.28%', height: 36 }} />;
                  }
                  const isSelected = selectedDate === cell.dateStr;

                  return (
                    <View key={idx} style={{ width: '14.28%', height: 36, padding: 2 }}>
                      <Pressable
                        onPress={() => {
                          setSelectedDate(cell.dateStr);
                          setShowDatePickerModal(false);
                        }}
                        className={`w-full h-full rounded-xl items-center justify-center border ${isSelected ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/5 border-white/10'}`}
                      >
                        <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white'}`}>
                          {cell.dayNum}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>

            <Pressable
              onPress={() => setShowDatePickerModal(false)}
              className="w-full py-3 rounded-xl bg-white/10 items-center"
            >
              <Text className="text-white font-bold text-xs">Close Calendar</Text>
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

export default AdminDailyDiaryScreen;
