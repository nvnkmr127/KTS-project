import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput, BackHandler, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  BookOpen, Calendar, Search, Send, 
  CheckCircle2, AlertCircle, X, Clock, ArrowLeft, 
  ChevronRight, RefreshCw, Paperclip, ChevronLeft
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { useDiaryStore, DiaryEntry, normalizeDate } from '../../store/diaryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';
import { DEFAULT_HOLIDAYS, HolidayItem } from '../teachers/TeacherHolidayCalendarScreen';

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
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const AdminDailyDiaryScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();
  const diaryEntries = useDiaryStore((state) => state.diaryEntries);
  const [selectedAcademicYear] = useState('2026-2027 (Current)');

  // Default to today formatted DD-MM-YYYY
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}-${m}-${y}`;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassDetail, setSelectedClassDetail] = useState<string | null>(null);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [dateSelectionError, setDateSelectionError] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({ visible: false, title: '', message: '' });

  // Helper: convert date to ISO (YYYY-MM-DD) format
  const toIsoDateStr = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  };

  // Find holiday for date helper
  const findHolidayForDate = (dateStr: string): HolidayItem | undefined => {
    const isoDate = toIsoDateStr(dateStr);
    return DEFAULT_HOLIDAYS.find((h) => {
      const hStart = toIsoDateStr(h.startDate);
      const hEnd = toIsoDateStr(h.endDate || h.startDate);
      return isoDate >= hStart && isoDate <= hEnd;
    });
  };

  // Helper: check if date is Sunday
  const isSundayDateStr = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    let y: number, m: number, d: number;
    if (parts[0].length === 4) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      d = parseInt(parts[2], 10);
    } else {
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      y = parseInt(parts[2], 10);
    }
    const dt = new Date(y, m, d);
    return dt.getDay() === 0;
  };

  // Date selection helper (Future dates strictly disabled)
  const isFutureDateStr = (dateStr: string) => {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const iso = toIsoDateStr(dateStr);
    return iso > todayIso;
  };

  const handleSelectDate = (fullDateStr: string) => {
    if (isFutureDateStr(fullDateStr)) {
      setDateSelectionError({
        visible: true,
        title: 'Future Date Disabled',
        message: `Daily diary cannot be viewed for upcoming dates (${fullDateStr}). Only past and current dates are allowed.`,
      });
      return;
    }

    if (isSundayDateStr(fullDateStr)) {
      setDateSelectionError({
        visible: true,
        title: 'Sunday (Weekend Holiday)',
        message: `School remains closed on Sundays (${fullDateStr}). Daily diary entries cannot be submitted on weekend holidays.`,
      });
      return;
    }

    const holiday = findHolidayForDate(fullDateStr);
    if (holiday) {
      setDateSelectionError({
        visible: true,
        title: `${holiday.title} (Holiday)`,
        message: `${fullDateStr} is an official holiday (${holiday.title}). Daily diary entries cannot be submitted on holidays.`,
      });
      return;
    }

    setSelectedDate(fullDateStr);
    setShowDatePickerModal(false);
  };

  // Handle Hardware Back Button & System Back Gesture
  useEffect(() => {
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
  }, [selectedClassDetail, showDatePickerModal, navigation]);

  // Filtered Class List
  const filteredClasses = ALL_CLASSES_LIST.filter(c => 
    c.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate live submissions per class for selected date
  const getClassEntriesCount = (classId: string) => {
    const normSel = normalizeDate(selectedDate);
    const cleanId = classId.replace(/^Class\s*/i, '').toUpperCase();
    return diaryEntries.filter(
      e => e.classId.toUpperCase() === cleanId && normalizeDate(e.date) === normSel
    ).length;
  };

  const totalClasses = ALL_CLASSES_LIST.length;
  const classesSubmittedCount = ALL_CLASSES_LIST.filter(c => getClassEntriesCount(c.classId) > 0).length;
  const pendingClassesCount = ALL_CLASSES_LIST.filter(c => c.hasSchedule && getClassEntriesCount(c.classId) < 5).length;

  // Real JS Date-based Calendar State
  const [viewDate, setViewDate] = useState(() => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    return new Date();
  });

  const calendarMonth = viewDate.getMonth();
  const calendarYear = viewDate.getFullYear();

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

  // Swipe Gesture Responder for Calendar Month Grid
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

  // Generate calendar weeks with previous and next month dates in gray
  const calendarWeeks = useMemo(() => {
    const totalSlots: {
      dayNum: number;
      dateStr: string;
      isSunday: boolean;
      isOtherMonth: boolean;
      isPrevMonth?: boolean;
      isNextMonth?: boolean;
    }[] = [];

    const daysInMonthCount = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDayWeekdayIndex = new Date(calendarYear, calendarMonth, 1).getDay();

    const prevMonth = calendarMonth === 0 ? 11 : calendarMonth - 1;
    const prevYear = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
    const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();

    const nextMonth = calendarMonth === 11 ? 0 : calendarMonth + 1;
    const nextYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear;

    // 1. Previous month leading days
    for (let i = firstDayWeekdayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dayOfWeek = (firstDayWeekdayIndex - 1 - i) % 7;
      const mStr = String(prevMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      totalSlots.push({
        dayNum: d,
        dateStr: `${dStr}-${mStr}-${prevYear}`,
        isSunday: dayOfWeek === 0,
        isOtherMonth: true,
        isPrevMonth: true,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonthCount; d++) {
      const dayOfWeek = (firstDayWeekdayIndex + d - 1) % 7;
      const mStr = String(calendarMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      totalSlots.push({
        dayNum: d,
        dateStr: `${dStr}-${mStr}-${calendarYear}`,
        isSunday: dayOfWeek === 0,
        isOtherMonth: false,
      });
    }

    // 3. Next month trailing days to complete full grid
    let nextDayNum = 1;
    while (totalSlots.length % 7 !== 0) {
      const dayOfWeek = totalSlots.length % 7;
      const mStr = String(nextMonth + 1).padStart(2, '0');
      const dStr = String(nextDayNum).padStart(2, '0');
      totalSlots.push({
        dayNum: nextDayNum,
        dateStr: `${dStr}-${mStr}-${nextYear}`,
        isSunday: dayOfWeek === 0,
        isOtherMonth: true,
        isNextMonth: true,
      });
      nextDayNum++;
    }

    const weeks: (typeof totalSlots)[] = [];
    for (let i = 0; i < totalSlots.length; i += 7) {
      weeks.push(totalSlots.slice(i, i + 7));
    }
    return weeks;
  }, [calendarYear, calendarMonth]);

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';
  const primaryPillClass = isSuperAdmin ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-emerald-500/15 border border-emerald-500/30';

  // Get all entries for selected class and date in Level 2 view
  const selectedClassEntries = useMemo(() => {
    if (!selectedClassDetail) return [];
    const normDate = normalizeDate(selectedDate);
    const cleanId = selectedClassDetail.replace(/^Class\s*/i, '').toUpperCase();
    return diaryEntries.filter(
      e => e.classId.toUpperCase() === cleanId && normalizeDate(e.date) === normDate
    );
  }, [selectedClassDetail, selectedDate, diaryEntries]);

  // Unmatched / General diary entries (non-period specific)
  const matchedEntryIds = new Set<string>();

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
        title={selectedClassDetail ? `Class ${selectedClassDetail} Submissions` : "Daily Diary"}
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
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-white/50 text-[11px] font-bold uppercase text-center">Diaries Submitted</Text>
                <Text numberOfLines={1} className="text-white text-lg sm:text-xl font-extrabold mt-0.5">{classesSubmittedCount}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit className={`${primaryTextClass} text-[10px] font-semibold text-center mt-0.5`}>Out of {totalClasses} classes</Text>
              </GlassCard>

              <GlassCard intensity="low" className="flex-1 p-2.5 sm:p-3.5 border-white/10 bg-[#101415]/80 items-center">
                <View className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 items-center justify-center mb-1">
                  <Send size={15} color="#38bdf8" />
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-white/50 text-[11px] font-bold uppercase text-center">Messages Delivered</Text>
                <Text numberOfLines={1} className="text-white text-lg sm:text-xl font-extrabold mt-0.5">{classesSubmittedCount * 28}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-sky-400 text-[10px] font-semibold text-center mt-0.5">WhatsApp + SMS</Text>
              </GlassCard>

              <GlassCard intensity="low" className="flex-1 p-2.5 sm:p-3.5 border-white/10 bg-[#101415]/80 items-center">
                <View className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 items-center justify-center mb-1">
                  <Clock size={15} color="#f59e0b" />
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-white/50 text-[11px] font-bold uppercase text-center">Pending</Text>
                <Text numberOfLines={1} className="text-amber-400 text-lg sm:text-xl font-extrabold mt-0.5">{pendingClassesCount}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-amber-300 text-[10px] font-semibold text-center mt-0.5">Not yet updated</Text>
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

              <Text className="text-white/40 text-[13px]">
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
                  className="flex-1 text-white text-sm"
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
                              <Text className="text-white font-extrabold text-base" numberOfLines={1}>{cls.className}</Text>
                              {isNoSchedule ? (
                                <Text className="text-white/40 text-xs italic">No Schedule</Text>
                              ) : isFullySubmitted ? (
                                <View className={`px-2 py-0.5 rounded-md ${primaryBadgeClass} flex-shrink-0`}>
                                  <Text className={`${primaryTextClass} text-[10px] font-bold`}>Complete</Text>
                                </View>
                              ) : (
                                <View className="bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-md flex-shrink-0">
                                  <Text className="text-amber-400 text-[10px] font-bold">Pending</Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-white/60 text-xs mt-0.5" numberOfLines={1}>
                              {isNoSchedule ? `${subCount > 0 ? `${subCount} Diary Submitted` : 'No Schedule'}` : `${subCount} Teacher${subCount === 1 ? '' : 's'} Submitted`}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center flex-shrink-0">
                          <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            className={`${primaryTextClass} text-sm font-bold mr-1`}
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
                <Text className="text-white font-extrabold text-lg">Class {selectedClassDetail} Submissions</Text>
                <Text className="text-white/50 text-xs">Timeline for {selectedDate}</Text>
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
                    <Text className="text-white/60 text-sm font-bold uppercase tracking-wider">
                      {pt.breakLabel || 'SHORT BREAK'} ({pt.timeSlot})
                    </Text>
                  </View>
                );
              }

              // Match submitted entry for this class, date, and periodNumber
              const submittedEntry = selectedClassEntries.find(
                e => e.periodNumber === pt.periodNumber
              );

              if (submittedEntry?.id) {
                matchedEntryIds.add(submittedEntry.id);
              }

              return (
                <GlassCard key={idx} intensity="low" className="mb-3 p-3.5 border-white/10 bg-[#101415]/90">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className={`${primaryTextClass} text-sm font-extrabold`}>
                      {pt.periodLabel} ({pt.timeSlot})
                    </Text>
                    {submittedEntry && (
                      <View className={`px-2 py-0.5 rounded-md ${primaryBadgeClass}`}>
                        <Text className={`${primaryTextClass} text-[10px] font-bold`}>Submitted {submittedEntry.submittedAt}</Text>
                      </View>
                    )}
                  </View>

                  {submittedEntry ? (
                    <View className="mt-1">
                      <View className="flex-row items-center">
                        <Text className="text-white font-extrabold text-base mr-2">{submittedEntry.subject || 'General'}</Text>
                        <Text className="text-white/60 text-sm">— {submittedEntry.teacherName}</Text>
                      </View>
                      <Text className="text-white/80 text-sm font-bold mt-1.5">{submittedEntry.topics || submittedEntry.topicTitle}</Text>
                      <Text className="text-white/60 text-sm mt-1 leading-relaxed">{submittedEntry.contentSummary || submittedEntry.notes}</Text>

                      {submittedEntry.homework && (
                        <View className="bg-black/40 p-2.5 rounded-xl border border-white/5 mt-2.5">
                          <Text className="text-amber-400 text-sm font-bold">Homework: <Text className="text-white/80 font-normal">{submittedEntry.homework}</Text></Text>
                          {Boolean(submittedEntry.homeworkSubmissionDate) && (
                            <Text className="text-sky-400 text-xs font-semibold mt-1">
                              Submission Due: <Text className="text-white/90 font-bold">{submittedEntry.homeworkSubmissionDate}</Text>
                            </Text>
                          )}
                        </View>
                      )}

                      {submittedEntry.attachmentName && (
                        <View className="flex-row items-center mt-2">
                          <Paperclip size={12} color="#38bdf8" style={{ marginRight: 4 }} />
                          <Text className="text-sky-400 text-xs font-semibold">{submittedEntry.attachmentName}</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text className="text-white/30 text-sm italic mt-1">No subject scheduled / Pending submission</Text>
                  )}
                </GlassCard>
              );
            })}

            {/* Additional General Submissions from Teacher Portal */}
            {selectedClassEntries.filter(e => !matchedEntryIds.has(e.id)).length > 0 && (
              <View className="mt-4 pt-3 border-t border-white/10">
                <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">
                  Additional Diary Submissions (Teacher Portal)
                </Text>
                {selectedClassEntries
                  .filter(e => !matchedEntryIds.has(e.id))
                  .map((entry) => (
                    <GlassCard key={entry.id} intensity="low" className="mb-3 p-3.5 border-white/10 bg-[#101415]/90">
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text className={`${primaryTextClass} text-sm font-extrabold`}>
                          {entry.teacherName}
                        </Text>
                        <View className={`px-2 py-0.5 rounded-md ${primaryBadgeClass}`}>
                          <Text className={`${primaryTextClass} text-[10px] font-bold`}>Submitted {entry.submittedAt}</Text>
                        </View>
                      </View>

                      <Text className="text-white text-sm font-bold mt-1">
                        <Text className="text-white/50 font-normal">Topics: </Text>
                        {entry.topics || entry.topicTitle}
                      </Text>

                      {Boolean(entry.homework) && (
                        <View className="bg-black/40 p-2 rounded-xl border border-white/5 mt-2">
                          <Text className="text-amber-400 text-xs font-bold">
                            Homework: <Text className="text-white/80 font-normal">{entry.homework}</Text>
                          </Text>
                          {Boolean(entry.homeworkSubmissionDate) && (
                            <Text className="text-sky-400 text-[11px] font-semibold mt-1">
                              Submission Due: <Text className="text-white/90 font-bold">{entry.homeworkSubmissionDate}</Text>
                            </Text>
                          )}
                        </View>
                      )}

                      {Boolean(entry.notes) && (
                        <Text className="text-sky-300 text-xs mt-1.5">
                          Note: {entry.notes}
                        </Text>
                      )}
                    </GlassCard>
                  ))}
              </View>
            )}
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
              <Text className="text-white font-extrabold text-sm">
                {MONTH_NAMES[calendarMonth]} {calendarYear}
              </Text>
              <Pressable
                onPress={handleNextMonth}
                className="p-1 border border-white/10 rounded-lg bg-white/5 active:bg-white/20"
              >
                <ChevronRight size={16} color={primaryColor} />
              </Pressable>
            </View>

            {/* Swipeable Calendar Grid Container */}
            <View {...calSwipeResponder.panHandlers}>
              {/* 7-Column Days of Week Bar */}
              <View className="flex-row mb-2">
                {DAYS_OF_WEEK.map((d, i) => (
                  <View key={i} style={{ width: '14.28%', alignItems: 'center' }}>
                    <Text className={`text-[10px] font-bold uppercase ${i === 0 ? 'text-red-400/70' : 'text-white/40'}`}>
                      {d}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 7-Column Calendar Days Grid with gray other-month dates */}
              <View className="mb-4">
                {calendarWeeks.map((week, wIdx) => (
                  <View key={wIdx} className="flex-row mb-1">
                    {week.map((cell, cIdx) => {
                      const isSelected = selectedDate === cell.dateStr;
                      const now = new Date();
                      now.setHours(23, 59, 59, 999);
                      const parts = cell.dateStr.split('-');
                      const cellDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                      const isFuture = cellDate > now;

                      return (
                        <View key={cIdx} style={{ width: '14.28%', height: 38, padding: 2 }}>
                          <Pressable
                            onPress={() => {
                              if (cell.isPrevMonth) {
                                handlePrevMonth();
                              } else if (cell.isNextMonth) {
                                handleNextMonth();
                              }
                              handleSelectDate(cell.dateStr);
                            }}
                            className={`w-full h-full rounded-xl items-center justify-center border ${
                              isFuture
                                ? 'opacity-20 bg-white/5 border-transparent'
                                : isSelected
                                ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]')
                                : cell.isSunday
                                ? 'bg-red-500/10 border-red-500/20'
                                : 'bg-white/5 border-white/10'
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                isFuture
                                  ? 'text-white/30'
                                  : isSelected
                                  ? 'text-[#101415] font-black'
                                  : cell.isSunday
                                  ? 'text-red-400'
                                  : 'text-white'
                              }`}
                            >
                              {cell.dayNum}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            <View className="flex-row" style={{ gap: 8 }}>
              <Pressable
                onPress={() => {
                  const today = new Date();
                  const d = String(today.getDate()).padStart(2, '0');
                  const m = String(today.getMonth() + 1).padStart(2, '0');
                  const y = today.getFullYear();
                  handleSelectDate(`${d}-${m}-${y}`);
                }}
                className={`flex-1 py-3 rounded-xl items-center justify-center ${isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40'}`}
              >
                <Text className={`${primaryTextClass} font-extrabold text-xs`}>Select Today</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowDatePickerModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 items-center justify-center"
              >
                <Text className="text-white font-bold text-xs">Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* DATE SELECTION ERROR MODAL */}
      <Modal
        visible={dateSelectionError.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setDateSelectionError((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateErrorModalBox}>
            <View style={styles.dateErrorIconBox}>
              <AlertCircle size={28} color="#fb7185" />
            </View>

            <Text style={styles.dateErrorTitle}>{dateSelectionError.title}</Text>
            <Text style={styles.dateErrorMessage}>{dateSelectionError.message}</Text>

            <Pressable
              onPress={() => setDateSelectionError((prev) => ({ ...prev, visible: false }))}
              style={styles.dateErrorDismissBtn}
            >
              <Text style={styles.dateErrorDismissBtnText}>Understood</Text>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dateErrorModalBox: {
    backgroundColor: '#181524',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 113, 133, 0.4)',
    padding: 22,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#fb7185',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  dateErrorIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(251, 113, 133, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dateErrorTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  dateErrorMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  dateErrorDismissBtn: {
    backgroundColor: '#fb7185',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  dateErrorDismissBtnText: {
    color: '#0d0d12',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default AdminDailyDiaryScreen;


