import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Clock,
  Send,
  X,
  Check,
  Sparkles,
  Shield,
  GraduationCap,
  FileText,
  Users,
  Edit3,
} from 'lucide-react-native';
import { useDiaryStore, DiaryEntry, normalizeDate } from '../../store/diaryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';
import { DEFAULT_HOLIDAYS, HolidayItem } from './TeacherHolidayCalendarScreen';

// Assigned teacher classes matching web interface (e.g., Sheeren Sultana / Teacher Portal)
const ASSIGNED_CLASSES = [
  { id: '4A', name: 'Class 4A', desc: 'Class Teacher Assigned' },
  { id: '4B', name: 'Class 4B', desc: 'Assigned Faculty Section' },
  { id: '3B', name: 'Class 3B', desc: 'Assigned Faculty Section' },
  { id: '3A', name: 'Class 3A', desc: 'Assigned Faculty Section' },
  { id: '2A', name: 'Class 2A', desc: 'Assigned Faculty Section' },
  { id: '2B', name: 'Class 2B', desc: 'Assigned Faculty Section' },
  { id: '10A', name: 'Class 10A', desc: 'Senior Faculty Section' },
  { id: '10B', name: 'Class 10B', desc: 'Senior Faculty Section' },
  { id: '9A', name: 'Class 9A', desc: 'High School Faculty Section' },
  { id: '9B', name: 'Class 9B', desc: 'High School Faculty Section' },
];

const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Helper: Format YYYY-MM-DD or DD-MM-YYYY to display string (e.g. "30 Sep 2026")
const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  let y: number, m: number, d: number;
  if (parts[0].length === 4) {
    // YYYY-MM-DD
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10) - 1;
    d = parseInt(parts[2], 10);
  } else {
    // DD-MM-YYYY
    d = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10) - 1;
    y = parseInt(parts[2], 10);
  }

  const monthName = MONTH_SHORT[m] || 'Sep';
  return `${d < 10 ? '0' + d : d} ${monthName} ${y}`;
};

export const DailyDiaryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { headerPaddingTop, tabBarBottomPadding, isSmallPhone } = useResponsive();
  const { user } = useAuthStore();

  const addOrUpdateEntry = useDiaryStore((state) => state.addOrUpdateEntry);
  const diaryEntries = useDiaryStore((state) => state.diaryEntries);

  // Today's default date formatted as DD-MM-YYYY
  const getTodayDateStr = () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const todayStr = useMemo(() => getTodayDateStr(), []);

  // Form State
  const [selectedClass, setSelectedClass] = useState<string>('Class 4A');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026-2027 (Current)');
  const [topics, setTopics] = useState<string>('');
  const [homework, setHomework] = useState<string>('');
  const [homeworkSubmissionDate, setHomeworkSubmissionDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modals State
  const [showClassDropdownModal, setShowClassDropdownModal] = useState<boolean>(false);
  const [showAcademicYearModal, setShowAcademicYearModal] = useState<boolean>(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState<boolean>(false);
  const [showHwDatePickerModal, setShowHwDatePickerModal] = useState<boolean>(false);
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; isError?: boolean }>({
    visible: false,
    title: '',
    message: '',
    isError: false,
  });

  // Calendar Navigator State (Diary Date)
  const [calendarMonth, setCalendarMonth] = useState<number>(() => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      return Number(parts[1]) - 1;
    }
    return new Date().getMonth();
  });

  const [calendarYear, setCalendarYear] = useState<number>(() => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      return Number(parts[2]);
    }
    return new Date().getFullYear();
  });

  // Calendar Navigator State (Homework Submission Date)
  const [hwCalendarMonth, setHwCalendarMonth] = useState<number>(() => {
    return new Date().getMonth();
  });
  const [hwCalendarYear, setHwCalendarYear] = useState<number>(() => {
    return new Date().getFullYear();
  });

  // Month navigation
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((prev) => prev - 1);
    } else {
      setCalendarMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((prev) => prev + 1);
    } else {
      setCalendarMonth((prev) => prev + 1);
    }
  };

  const calPrevMonthRef = useRef(handlePrevMonth);
  const calNextMonthRef = useRef(handleNextMonth);
  calPrevMonthRef.current = handlePrevMonth;
  calNextMonthRef.current = handleNextMonth;

  // Swipe gesture for Calendar Grid (matching Holiday Calendar / Allot Attendance)
  const calSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 15
        );
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
  const findHolidayForDate = useCallback((fullDateStr: string) => {
    const isoDate = toIsoDateStr(fullDateStr);
    return DEFAULT_HOLIDAYS.find((h) => {
      const hStart = toIsoDateStr(h.startDate);
      const hEnd = toIsoDateStr(h.endDate || h.startDate);
      return isoDate >= hStart && isoDate <= hEnd;
    });
  }, []);

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

  // Date selection helper (Future dates, Sundays, and Holidays show error toast)
  const isFutureDateStr = (dateStr: string) => {
    const today = getTodayDateStr();
    const partsToday = today.split('-');
    const partsDate = dateStr.split('-');
    const dToday = new Date(Number(partsToday[2]), Number(partsToday[1]) - 1, Number(partsToday[0]));
    const dDate = new Date(Number(partsDate[2]), Number(partsDate[1]) - 1, Number(partsDate[0]));
    return dDate > dToday;
  };

  const handleSelectDate = (fullDateStr: string) => {
    if (isFutureDateStr(fullDateStr)) {
      setToastData({
        visible: true,
        title: 'Future Date Disabled',
        message: `Daily diary cannot be created for upcoming dates (${formatDateDisplay(fullDateStr)}). Only past and current dates are allowed.`,
        isError: true,
      });
      return;
    }

    if (isSundayDateStr(fullDateStr)) {
      setToastData({
        visible: true,
        title: 'Sunday (Weekend Holiday)',
        message: `School remains closed on Sundays (${formatDateDisplay(fullDateStr)}). Daily diary entries cannot be created on weekend holidays.`,
        isError: true,
      });
      return;
    }

    const holiday = findHolidayForDate(fullDateStr);
    if (holiday) {
      setToastData({
        visible: true,
        title: `${holiday.title} (Holiday)`,
        message: `${formatDateDisplay(fullDateStr)} is an official holiday (${holiday.title}). Daily diary entries cannot be submitted on holidays.`,
        isError: true,
      });
      return;
    }

    setSelectedDate(fullDateStr);
    setShowDatePickerModal(false);
  };

  // Homework submission date month navigation
  const handleHwPrevMonth = () => {
    if (hwCalendarMonth === 0) {
      setHwCalendarMonth(11);
      setHwCalendarYear((prev) => prev - 1);
    } else {
      setHwCalendarMonth((prev) => prev - 1);
    }
  };

  const handleHwNextMonth = () => {
    if (hwCalendarMonth === 11) {
      setHwCalendarMonth(0);
      setHwCalendarYear((prev) => prev + 1);
    } else {
      setHwCalendarMonth((prev) => prev + 1);
    }
  };

  const calHwPrevMonthRef = useRef(handleHwPrevMonth);
  const calHwNextMonthRef = useRef(handleHwNextMonth);
  calHwPrevMonthRef.current = handleHwPrevMonth;
  calHwNextMonthRef.current = handleHwNextMonth;

  // Swipe gesture for HW Calendar Grid
  const calHwSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 15
        );
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -35) {
          calHwNextMonthRef.current?.();
        } else if (gestureState.dx > 35) {
          calHwPrevMonthRef.current?.();
        }
      },
    })
  ).current;

  // Helper: check if date is strictly before today
  const isPastDateStr = (dateStr: string): boolean => {
    const today = getTodayDateStr();
    return toIsoDateStr(dateStr) < toIsoDateStr(today);
  };

  const getTomorrowDateStr = () => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    const d = String(tmrw.getDate()).padStart(2, '0');
    const m = String(tmrw.getMonth() + 1).padStart(2, '0');
    const y = tmrw.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const handleSelectHwDate = (fullDateStr: string) => {
    if (isPastDateStr(fullDateStr)) {
      setToastData({
        visible: true,
        title: 'Past Date Disabled',
        message: `Homework submission date cannot be in the past (${formatDateDisplay(fullDateStr)}). Please select today or an upcoming date.`,
        isError: true,
      });
      return;
    }

    if (isSundayDateStr(fullDateStr)) {
      setToastData({
        visible: true,
        title: 'Sunday (Weekend Holiday)',
        message: `School remains closed on Sundays (${formatDateDisplay(fullDateStr)}). Please select an active school working day for homework submission.`,
        isError: true,
      });
      return;
    }

    const holiday = findHolidayForDate(fullDateStr);
    if (holiday) {
      setToastData({
        visible: true,
        title: `${holiday.title} (Holiday)`,
        message: `${formatDateDisplay(fullDateStr)} is an official school holiday (${holiday.title}). Please select an active school working day for homework submission.`,
        isError: true,
      });
      return;
    }

    setHomeworkSubmissionDate(fullDateStr);
    setShowHwDatePickerModal(false);
  };

  // Generate weeks for HW calendar grid (future dates enabled)
  const hwCalendarWeeks = useMemo(() => {
    const totalSlots: {
      dayNum: number;
      fullDateStr: string;
      isSunday: boolean;
      isOtherMonth: boolean;
      isPrevMonth?: boolean;
      isNextMonth?: boolean;
    }[] = [];

    const daysInMonthCount = new Date(hwCalendarYear, hwCalendarMonth + 1, 0).getDate();
    const firstDayWeekdayIndex = new Date(hwCalendarYear, hwCalendarMonth, 1).getDay();

    const prevMonth = hwCalendarMonth === 0 ? 11 : hwCalendarMonth - 1;
    const prevYear = hwCalendarMonth === 0 ? hwCalendarYear - 1 : hwCalendarYear;
    const daysInPrevMonth = new Date(hwCalendarYear, hwCalendarMonth, 0).getDate();

    const nextMonth = hwCalendarMonth === 11 ? 0 : hwCalendarMonth + 1;
    const nextYear = hwCalendarMonth === 11 ? hwCalendarYear + 1 : hwCalendarYear;

    // 1. Previous month leading days
    for (let i = firstDayWeekdayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dayOfWeek = (firstDayWeekdayIndex - 1 - i) % 7;
      const mStr = String(prevMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      totalSlots.push({
        dayNum: d,
        fullDateStr: `${dStr}-${mStr}-${prevYear}`,
        isSunday: dayOfWeek === 0,
        isOtherMonth: true,
        isPrevMonth: true,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonthCount; d++) {
      const dayOfWeek = (firstDayWeekdayIndex + d - 1) % 7;
      const mStr = String(hwCalendarMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      totalSlots.push({
        dayNum: d,
        fullDateStr: `${dStr}-${mStr}-${hwCalendarYear}`,
        isSunday: dayOfWeek === 0,
        isOtherMonth: false,
      });
    }

    // 3. Next month trailing days
    let nextDayNum = 1;
    while (totalSlots.length % 7 !== 0) {
      const dayOfWeek = totalSlots.length % 7;
      const mStr = String(nextMonth + 1).padStart(2, '0');
      const dStr = String(nextDayNum).padStart(2, '0');
      totalSlots.push({
        dayNum: nextDayNum,
        fullDateStr: `${dStr}-${mStr}-${nextYear}`,
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
  }, [hwCalendarYear, hwCalendarMonth]);



  // Generate weeks for calendar grid with gray previous and next month dates
  const calendarWeeks = useMemo(() => {
    const totalSlots: {
      dayNum: number;
      fullDateStr: string;
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
        fullDateStr: `${dStr}-${mStr}-${prevYear}`,
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
        fullDateStr: `${dStr}-${mStr}-${calendarYear}`,
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
        fullDateStr: `${dStr}-${mStr}-${nextYear}`,
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

  // Teacher Name
  const teacherName = user?.name || 'Sheeren Sultana';

  // Calculate top KPI cards based on active store entries
  const normalizedToday = normalizeDate(todayStr);

  const myAssignedClean = useMemo(
    () => ASSIGNED_CLASSES.map((c) => c.id.toUpperCase()),
    []
  );

  // Entries for assigned classes
  const assignedEntries = useMemo(() => {
    return diaryEntries.filter((e) =>
      myAssignedClean.includes(e.classId.toUpperCase())
    );
  }, [diaryEntries, myAssignedClean]);

  const sentTodayEntries = useMemo(() => {
    return assignedEntries.filter(
      (e) => normalizeDate(e.date) === normalizedToday
    );
  }, [assignedEntries, normalizedToday]);

  const sentCount = sentTodayEntries.length;
  const totalDelivered = sentTodayEntries.reduce(
    (sum, e) => sum + (e.parentsCount || 28),
    0
  );
  const pendingCount = Math.max(0, ASSIGNED_CLASSES.length - sentCount);

  // Recent Submissions List (Showing logged in user name only)
  const myRecentSubmissions = useMemo(() => {
    return [...assignedEntries]
      .map((e) => ({
        ...e,
        teacherName: teacherName,
      }))
      .slice(0, 10);
  }, [assignedEntries, teacherName]);

  // Handle Save Diary Submission
  const handleSaveDiary = async () => {
    if (!topics.trim()) {
      setToastData({
        visible: true,
        title: 'Missing Required Field',
        message: "Please enter Today's Topics before saving the diary entry.",
      });
      return;
    }

    setSubmitting(true);
    const cleanClassId = selectedClass.replace(/^Class\s*/i, '');

    try {
      await addOrUpdateEntry({
        classId: cleanClassId,
        className: `Class ${cleanClassId}`,
        teacherName,
        topics: topics.trim(),
        topicTitle: topics.trim(),
        homework: homework.trim(),
        homeworkSubmissionDate: homeworkSubmissionDate || undefined,
        notes: notes.trim(),
        contentSummary: notes.trim() || topics.trim(),
        date: selectedDate,
        parentsCount: 28,
      });

      setToastData({
        visible: true,
        title: 'Daily Diary Saved!',
        message: `Your diary entry for Class ${cleanClassId} (${formatDateDisplay(selectedDate)}) has been published and is now live on the Admin Staff Portal.`,
      });

      // Reset form inputs
      setTopics('');
      setHomework('');
      setHomeworkSubmissionDate('');
      setNotes('');
    } catch (err) {
      console.log('Error saving diary entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Deep Gradient matching Allot Attendance & Examination Screen */}
      <LinearGradient
        colors={['#22143d', '#150d26', '#0b0912', '#08070d']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER WITH LEFT ARROW & ACADEMIC YEAR DROPDOWN */}
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {navigation.canGoBack() && (
              <Pressable
                onPress={handleBack}
                style={styles.backButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color="#ddb7ff" />
              </Pressable>
            )}

            <View style={styles.headerTitleGroup}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitleText} numberOfLines={1}>
                  Daily Diary
                </Text>
                <View style={styles.headerBadge}>
                  <Shield size={10} color="#34d399" style={{ marginRight: 3 }} />
                  <Text style={styles.headerBadgeText}>Teacher Portal</Text>
                </View>
              </View>

              <Pressable
                onPress={() => setShowAcademicYearModal(true)}
                style={styles.academicYearRow}
              >
                <View style={styles.liveIndicator} />
                <Text style={styles.academicYearText} numberOfLines={1}>
                  Academic Year: {selectedAcademicYear}
                </Text>
                <ChevronDown size={13} color="#ddb7ff" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(tabBarBottomPadding + 40, 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* PURPLE HERO BANNER (Matching Allot Attendance Screen) */}
        <View style={styles.heroBanner}>
          <LinearGradient
            colors={['#581c87', '#6b21a8', '#4c1d95']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroBackgroundIcon}>
            <BookOpen size={80} color="rgba(255,255,255,0.08)" />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroSubtitle}>TEACHER PORTAL</Text>
            <Text style={styles.heroTitle}>Daily Diary & Lesson Updates</Text>
            <Text style={styles.heroDesc}>
              Publish classroom topics, homework assignments, and special notes to parents and Admin Staff.
            </Text>
          </View>
        </View>

        {/* TOP 3 KPI SUMMARY CARDS (Matching Allot Attendance / Web layout) */}
        <View style={styles.kpiRow}>
          {/* 1. Diaries Sent Today */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(45, 212, 191, 0.15)', borderColor: 'rgba(45, 212, 191, 0.35)' }]}>
              <BookOpen size={16} color="#2dd4bf" />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.kpiLabel}>
              My Diaries Sent Today
            </Text>
            <Text style={styles.kpiValue}>{sentCount}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.kpiSub, { color: '#2dd4bf' }]}>
              Out of {ASSIGNED_CLASSES.length} assigned
            </Text>
          </View>

          {/* 2. Messages Delivered */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.35)' }]}>
              <Send size={15} color="#38bdf8" />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.kpiLabel}>
              Messages Delivered
            </Text>
            <Text style={styles.kpiValue}>{totalDelivered}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.kpiSub, { color: '#38bdf8' }]}>
              WhatsApp + SMS
            </Text>
          </View>

          {/* 3. Pending Classes */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.35)' }]}>
              <Clock size={16} color="#f59e0b" />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.kpiLabel}>
              My Pending Classes
            </Text>
            <Text style={[styles.kpiValue, { color: '#fbbf24' }]}>{pendingCount}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.kpiSub, { color: '#fbbf24' }]}>
              Awaiting updates
            </Text>
          </View>
        </View>

        {/* SECTION 1: NEW DIARY ENTRY CARD (Card design matching Allot Attendance) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.cardHeaderIconCircle}>
                <Edit3 size={16} color="#ddb7ff" />
              </View>
              <Text style={styles.cardHeaderTitle}>New Diary Entry</Text>
            </View>
            <View style={styles.portalBadge}>
              <Text style={styles.portalBadgeText}>Teacher Portal</Text>
            </View>
          </View>

          {/* Selectors Row: Class & Date */}
          <View style={styles.selectorsRow}>
            {/* Class Dropdown */}
            <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
              <Text style={styles.inputLabel}>
                <Users size={11} color="#cfc2d6" style={{ marginRight: 4 }} /> CLASS / SECTION
              </Text>
              <Pressable
                onPress={() => setShowClassDropdownModal(true)}
                style={styles.inputBox}
              >
                <Text style={styles.inputBoxText} numberOfLines={1}>
                  {selectedClass}
                </Text>
                <ChevronDown size={14} color="#ddb7ff" />
              </Pressable>
            </View>

            {/* Date Selector */}
            <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
              <Text style={styles.inputLabel}>
                <CalendarIcon size={11} color="#cfc2d6" style={{ marginRight: 4 }} /> DIARY DATE
              </Text>
              <Pressable
                onPress={() => setShowDatePickerModal(true)}
                style={styles.inputBox}
              >
                <Text style={styles.inputBoxText} numberOfLines={1}>
                  {formatDateDisplay(selectedDate)}
                </Text>
                <CalendarIcon size={14} color="#ddb7ff" />
              </Pressable>
            </View>
          </View>

          {/* Today's Topics * */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>
              <FileText size={11} color="#cfc2d6" style={{ marginRight: 4 }} /> TODAY'S TOPICS *
            </Text>
            <TextInput
              value={topics}
              onChangeText={setTopics}
              placeholder="Linear equations Ch 3, Water cycle..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={3}
              style={[styles.textInputArea, { minHeight: 72 }]}
            />
          </View>

          {/* Homework */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <BookOpen size={11} color="#cfc2d6" style={{ marginRight: 4 }} /> HOMEWORK
            </Text>
            <TextInput
              value={homework}
              onChangeText={setHomework}
              placeholder="Maths pg 56 Ex 4 · Draw diagram..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={2}
              style={[styles.textInputArea, { minHeight: 60 }]}
            />
          </View>

          {/* Homework Submission Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <CalendarDays size={11} color="#cfc2d6" style={{ marginRight: 4 }} /> HOMEWORK SUBMISSION DATE
            </Text>
            <Pressable
              onPress={() => {
                if (homeworkSubmissionDate) {
                  const parts = homeworkSubmissionDate.split('-');
                  if (parts.length === 3) {
                    setHwCalendarMonth(Number(parts[1]) - 1);
                    setHwCalendarYear(Number(parts[2]));
                  }
                } else {
                  const now = new Date();
                  setHwCalendarMonth(now.getMonth());
                  setHwCalendarYear(now.getFullYear());
                }
                setShowHwDatePickerModal(true);
              }}
              style={styles.inputBox}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <CalendarDays size={15} color="#ddb7ff" style={{ marginRight: 8 }} />
                <Text
                  style={[
                    styles.inputBoxText,
                    !homeworkSubmissionDate && { color: '#71717a' },
                  ]}
                  numberOfLines={1}
                >
                  {homeworkSubmissionDate
                    ? formatDateDisplay(homeworkSubmissionDate)
                    : 'Select submission due date (optional)'}
                </Text>
              </View>
              {homeworkSubmissionDate ? (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    setHomeworkSubmissionDate('');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ padding: 2 }}
                >
                  <X size={15} color="#a1a1aa" />
                </Pressable>
              ) : (
                <ChevronDown size={14} color="#ddb7ff" />
              )}
            </Pressable>
          </View>

          {/* Special Notes (optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <AlertCircle size={11} color="#cfc2d6" style={{ marginRight: 4 }} /> SPECIAL NOTES (OPTIONAL)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Reminder: submission due tomorrow..."
              placeholderTextColor="#71717a"
              style={styles.textInputSingle}
            />
          </View>

          {/* Save Diary Button */}
          <Pressable
            onPress={handleSaveDiary}
            disabled={submitting || !topics.trim()}
            style={[
              styles.saveDiaryButton,
              (!topics.trim() || submitting) && styles.saveDiaryButtonDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
            ) : (
              <Send size={15} color="#ffffff" style={{ marginRight: 6 }} />
            )}
            <Text style={styles.saveDiaryButtonText}>
              {submitting ? 'Saving Diary...' : 'Save Diary'}
            </Text>
          </Pressable>
        </View>

        {/* SECTION 2: MY RECENT SUBMISSIONS */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.cardHeaderIconCircle}>
                <Clock size={16} color="#ddb7ff" />
              </View>
              <Text style={styles.cardHeaderTitle}>My Recent Submissions</Text>
            </View>
            <View style={styles.liveSyncBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveSyncBadgeText}>Live Sync Active</Text>
            </View>
          </View>

          {myRecentSubmissions.length > 0 ? (
            myRecentSubmissions.map((entry) => (
              <View key={entry.id} style={styles.recentSubmissionItem}>
                <View style={styles.recentItemTop}>
                  <Text style={styles.recentItemClass}>{entry.className}</Text>
                  <View style={styles.recentItemDateBadge}>
                    <Text style={styles.recentItemDateText}>
                      {formatDateDisplay(entry.date)}
                    </Text>
                  </View>
                </View>

                {/* Topics */}
                <View style={{ marginTop: 4 }}>
                  <Text style={styles.recentTopicsText}>
                    <Text style={styles.recentTopicsLabel}>Topics: </Text>
                    {entry.topics || entry.topicTitle}
                  </Text>
                </View>

                {/* Homework */}
                {Boolean(entry.homework) && (
                  <View style={styles.recentHomeworkBox}>
                    <Text style={styles.recentHomeworkText}>
                      Homework: <Text style={{ color: '#ffffff', fontWeight: '400' }}>{entry.homework}</Text>
                    </Text>
                  </View>
                )}

                {/* Homework Submission Date */}
                {Boolean(entry.homeworkSubmissionDate) && (
                  <View style={styles.recentHwDueBadge}>
                    <CalendarDays size={12} color="#38bdf8" style={{ marginRight: 5 }} />
                    <Text style={styles.recentHwDueText}>
                      Submission Due: <Text style={{ color: '#ffffff', fontWeight: '700' }}>{formatDateDisplay(entry.homeworkSubmissionDate!)}</Text>
                    </Text>
                  </View>
                )}

                {/* Notes */}
                {Boolean(entry.notes) && (
                  <View style={styles.recentNotesBox}>
                    <Text style={styles.recentNotesText}>
                      Note: {entry.notes}
                    </Text>
                  </View>
                )}

                {/* Footer / Teacher Name */}
                <View style={styles.recentItemFooter}>
                  <Text style={styles.recentTeacherName}>{entry.teacherName}</Text>
                  {entry.submittedAt && (
                    <Text style={styles.recentSubmittedAt}>{entry.submittedAt}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyRecentBox}>
              <BookOpen size={28} color="rgba(255, 255, 255, 0.2)" />
              <Text style={styles.emptyRecentText}>No recent diary submissions.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* CLASS SELECTION MODAL (Matching Allot Attendance Screen) */}
      <Modal
        visible={showClassDropdownModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClassDropdownModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowClassDropdownModal(false)}
        >
          <Pressable style={styles.dropdownModalBox} onPress={(e) => e.stopPropagation()}>
            <View style={styles.dropdownModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={styles.dropdownHeaderIconBox}>
                  <GraduationCap size={18} color="#ddb7ff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dropdownModalTitle}>Select Class / Section</Text>
                  <Text style={styles.dropdownModalSubtitle}>
                    Assigned faculty allotment classes
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setShowClassDropdownModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color="#ddb7ff" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              <View style={styles.dropdownOptionsList}>
                {ASSIGNED_CLASSES.map((item) => {
                  const isSelected = selectedClass === item.name;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        setSelectedClass(item.name);
                        setShowClassDropdownModal(false);
                      }}
                      style={[
                        styles.dropdownOptionCard,
                        isSelected && styles.dropdownOptionCardActive,
                      ]}
                    >
                      <View style={styles.dropdownOptionLeft}>
                        <View
                          style={[
                            styles.classInitialBadge,
                            isSelected && styles.classInitialBadgeActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.classInitialBadgeText,
                              isSelected && { color: '#ffffff' },
                            ]}
                          >
                            {item.id}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.dropdownOptionTitle,
                              isSelected && styles.dropdownOptionTitleActive,
                            ]}
                          >
                            {item.name}
                          </Text>
                          <Text style={styles.dropdownOptionDesc}>{item.desc}</Text>
                        </View>
                      </View>

                      {isSelected ? (
                        <View style={styles.activeCheckCircle}>
                          <Check size={14} color="#ffffff" strokeWidth={3} />
                        </View>
                      ) : (
                        <View style={styles.inactiveRadioCircle} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ACADEMIC YEAR MODAL */}
      <Modal
        visible={showAcademicYearModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAcademicYearModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAcademicYearModal(false)}
        >
          <Pressable style={styles.dropdownModalBox} onPress={(e) => e.stopPropagation()}>
            <View style={styles.dropdownModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={styles.dropdownHeaderIconBox}>
                  <Sparkles size={18} color="#ddb7ff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dropdownModalTitle}>Select Academic Year</Text>
                  <Text style={styles.dropdownModalSubtitle}>Active session curriculum cycle</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setShowAcademicYearModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color="#ddb7ff" />
              </Pressable>
            </View>

            <View style={styles.dropdownOptionsList}>
              {['2026-2027 (Current)', '2025-2026', '2024-2025'].map((yr) => {
                const isSelected = selectedAcademicYear === yr;
                const isCurrent = yr.includes('Current');
                return (
                  <Pressable
                    key={yr}
                    onPress={() => {
                      setSelectedAcademicYear(yr);
                      setShowAcademicYearModal(false);
                    }}
                    style={[
                      styles.dropdownOptionCard,
                      isSelected && styles.dropdownOptionCardActive,
                    ]}
                  >
                    <View style={styles.dropdownOptionLeft}>
                      <View
                        style={[
                          styles.yearBadge,
                          isSelected && styles.yearBadgeActive,
                        ]}
                      >
                        <CalendarIcon size={16} color={isSelected ? '#ddb7ff' : '#a1a1aa'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text
                            style={[
                              styles.dropdownOptionTitle,
                              isSelected && styles.dropdownOptionTitleActive,
                            ]}
                          >
                            {yr}
                          </Text>
                          {isCurrent && (
                            <View style={styles.activePill}>
                              <Text style={styles.activePillText}>ACTIVE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.dropdownOptionDesc}>
                          {isCurrent ? 'Current active academic cycle' : 'Archived academic records'}
                        </Text>
                      </View>
                    </View>

                    {isSelected ? (
                      <View style={styles.activeCheckCircle}>
                        <Check size={14} color="#ffffff" strokeWidth={3} />
                      </View>
                    ) : (
                      <View style={styles.inactiveRadioCircle} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* DATE PICKER MODAL (EXACT ALLOT ATTENDANCE / HOLIDAY CALENDAR STYLE) */}
      <Modal
        visible={showDatePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModalBox}>
            {/* Modal Header */}
            <View style={styles.datePickerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <View style={styles.datePickerIconCircle}>
                  <CalendarDays size={18} color="#ddb7ff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.datePickerTitle}>Select Date</Text>
                  <Text style={styles.datePickerSubtitle}>
                    Swipe left/right to change months
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setShowDatePickerModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color="#ddb7ff" />
              </Pressable>
            </View>

            {/* Month Navigator with < Month Year > */}
            <View style={styles.datePickerMonthNav}>
              <Pressable
                onPress={handlePrevMonth}
                style={styles.navArrowBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={16} color="#ddb7ff" />
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CalendarIcon size={14} color="#ddb7ff" style={{ marginRight: 6 }} />
                <Text style={styles.datePickerMonthText}>
                  {MONTH_NAMES[calendarMonth]} {calendarYear}
                </Text>
              </View>
              <Pressable
                onPress={handleNextMonth}
                style={styles.navArrowBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronRight size={16} color="#ddb7ff" />
              </Pressable>
            </View>

            {/* Swipeable Calendar Body */}
            <View {...calSwipeResponder.panHandlers} style={{ width: '100%' }}>
              {/* Day Names Header */}
              <View style={styles.weekdayHeaderRow}>
                {DAY_SHORT_NAMES.map((d, i) => (
                  <View key={d} style={styles.weekdayCol}>
                    <Text
                      style={[
                        styles.weekdayHeaderText,
                        i === 0 && { color: '#fb7185' },
                      ]}
                    >
                      {d}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Weeks & Days Grid */}
              <View style={{ width: '100%' }}>
                {calendarWeeks.map((week, weekIdx) => (
                  <View key={`week_${weekIdx}`} style={styles.calendarWeekRow}>
                    {week.map((cell, colIdx) => {
                      const { dayNum, fullDateStr, isSunday, isOtherMonth, isPrevMonth, isNextMonth } = cell;
                      const holidayOnDay = findHolidayForDate(fullDateStr);
                      const isFuture = isFutureDateStr(fullDateStr);
                      const isHoliday = Boolean(holidayOnDay && !isOtherMonth);
                      const isDisabled = isFuture || isHoliday;
                      const isSelected = selectedDate === fullDateStr;
                      const isToday = fullDateStr === getTodayDateStr();

                      return (
                        <View
                          key={`day_${fullDateStr}_${colIdx}`}
                          style={styles.calendarCellSlot}
                        >
                          <Pressable
                            onPress={() => {
                              if (isPrevMonth) {
                                handlePrevMonth();
                              } else if (isNextMonth) {
                                handleNextMonth();
                              }
                              handleSelectDate(fullDateStr);
                            }}
                            style={[
                              styles.calendarDayCard,
                              isFuture && styles.calendarFutureCard,
                              !isFuture && isSunday && styles.calendarSundayCard,
                              !isFuture && holidayOnDay && styles.calendarHolidayCard,
                              isSelected && styles.calendarSelectedCard,
                            ]}
                          >
                            {/* Day Number and Top Indicator */}
                            <View style={styles.calendarDayHeaderRow}>
                              <Text
                                style={[
                                  styles.calendarDayNumText,
                                  !isFuture && isSunday && { color: '#fb7185' },
                                  !isFuture && holidayOnDay && { color: holidayOnDay.color || '#ddb7ff' },
                                  isSelected && { color: '#ffffff', fontWeight: '900' },
                                  isFuture && { color: '#52525b' },
                                ]}
                              >
                                {dayNum}
                              </Text>

                              {holidayOnDay ? (
                                <View
                                  style={[
                                    styles.calendarHolidayDot,
                                    { backgroundColor: holidayOnDay.color || '#ddb7ff' },
                                    isFuture && { opacity: 0.4 },
                                  ]}
                                />
                              ) : isToday && !isSelected ? (
                                <View style={styles.calendarTodayDot} />
                              ) : null}
                            </View>

                            {/* Badge Label: ACTIVE, SUN, HOL, or TODAY */}
                            {isSelected ? (
                              <View style={styles.calendarSelectedBadge}>
                                <Text style={styles.calendarSelectedBadgeText} numberOfLines={1}>
                                  ACTIVE
                                </Text>
                              </View>
                            ) : isSunday ? (
                              <View style={[styles.calendarSunBadge, isFuture && { opacity: 0.4 }]}>
                                <Text style={styles.calendarSunBadgeText} numberOfLines={1}>
                                  SUN
                                </Text>
                              </View>
                            ) : holidayOnDay ? (
                              <View
                                style={[
                                  styles.calendarHolBadge,
                                  { backgroundColor: holidayOnDay.color || '#ddb7ff' },
                                  isFuture && { opacity: 0.4 },
                                ]}
                              >
                                <Text
                                  style={styles.calendarHolBadgeText}
                                  numberOfLines={1}
                                >
                                  {holidayOnDay.title.split(' ')[0] || 'HOL'}
                                </Text>
                              </View>
                            ) : isToday ? (
                              <View style={styles.calendarTodayBadge}>
                                <Text style={styles.calendarTodayBadgeText} numberOfLines={1}>
                                  TODAY
                                </Text>
                              </View>
                            ) : null}
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            {/* Legend */}
            <View style={styles.calendarLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#7c3aed' }]} />
                <Text style={styles.legendText}>Selected</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>Holiday (Off)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#fb7185' }]} />
                <Text style={styles.legendText}>Sunday</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#52525b' }]} />
                <Text style={styles.legendText}>Future</Text>
              </View>
            </View>

            {/* Quick Actions Footer */}
            <View style={styles.datePickerFooter}>
              <Pressable
                onPress={() => {
                  const today = getTodayDateStr();
                  handleSelectDate(today);
                }}
                style={styles.todayQuickBtn}
              >
                <Text style={styles.todayQuickBtnText}>
                  Select Today ({formatDateDisplay(getTodayDateStr())})
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* HOMEWORK SUBMISSION DATE PICKER MODAL (FUTURE DATES ENABLED, HOLIDAYS & SUNDAYS SHOWN) */}
      <Modal
        visible={showHwDatePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHwDatePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModalBox}>
            {/* Modal Header */}
            <View style={styles.datePickerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <View style={styles.datePickerIconCircle}>
                  <CalendarDays size={18} color="#ddb7ff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.datePickerTitle}>Submission Due Date</Text>
                  <Text style={styles.datePickerSubtitle}>
                    Pick a future working day for homework submission
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setShowHwDatePickerModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color="#ddb7ff" />
              </Pressable>
            </View>

            {/* Month Navigator with < Month Year > */}
            <View style={styles.datePickerMonthNav}>
              <Pressable
                onPress={handleHwPrevMonth}
                style={styles.navArrowBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={16} color="#ddb7ff" />
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CalendarIcon size={14} color="#ddb7ff" style={{ marginRight: 6 }} />
                <Text style={styles.datePickerMonthText}>
                  {MONTH_NAMES[hwCalendarMonth]} {hwCalendarYear}
                </Text>
              </View>
              <Pressable
                onPress={handleHwNextMonth}
                style={styles.navArrowBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronRight size={16} color="#ddb7ff" />
              </Pressable>
            </View>

            {/* Swipeable Calendar Body */}
            <View {...calHwSwipeResponder.panHandlers} style={{ width: '100%' }}>
              {/* Day Names Header */}
              <View style={styles.weekdayHeaderRow}>
                {DAY_SHORT_NAMES.map((d, i) => (
                  <View key={d} style={styles.weekdayCol}>
                    <Text
                      style={[
                        styles.weekdayHeaderText,
                        i === 0 && { color: '#fb7185' },
                      ]}
                    >
                      {d}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Weeks & Days Grid */}
              <View style={{ width: '100%' }}>
                {hwCalendarWeeks.map((week, weekIdx) => (
                  <View key={`hw_week_${weekIdx}`} style={styles.calendarWeekRow}>
                    {week.map((cell, colIdx) => {
                      const { dayNum, fullDateStr, isSunday, isPrevMonth, isNextMonth } = cell;
                      const holidayOnDay = findHolidayForDate(fullDateStr);
                      const isPast = isPastDateStr(fullDateStr);
                      const isSelected = homeworkSubmissionDate === fullDateStr;
                      const isToday = fullDateStr === getTodayDateStr();

                      return (
                        <View
                          key={`hw_day_${fullDateStr}_${colIdx}`}
                          style={styles.calendarCellSlot}
                        >
                          <Pressable
                            onPress={() => {
                              if (isPrevMonth) {
                                handleHwPrevMonth();
                              } else if (isNextMonth) {
                                handleHwNextMonth();
                              }
                              handleSelectHwDate(fullDateStr);
                            }}
                            style={[
                              styles.calendarDayCard,
                              isPast && styles.calendarFutureCard,
                              !isPast && isSunday && styles.calendarSundayCard,
                              !isPast && holidayOnDay && styles.calendarHolidayCard,
                              isSelected && styles.calendarSelectedCard,
                            ]}
                          >
                            {/* Day Number and Top Indicator */}
                            <View style={styles.calendarDayHeaderRow}>
                              <Text
                                style={[
                                  styles.calendarDayNumText,
                                  isPast && { color: '#52525b' },
                                  !isPast && isSunday && { color: '#fb7185' },
                                  !isPast && holidayOnDay && { color: holidayOnDay.color || '#ddb7ff' },
                                  isSelected && { color: '#ffffff', fontWeight: '900' },
                                ]}
                              >
                                {dayNum}
                              </Text>

                              {holidayOnDay ? (
                                <View
                                  style={[
                                    styles.calendarHolidayDot,
                                    { backgroundColor: holidayOnDay.color || '#ddb7ff' },
                                    isPast && { opacity: 0.4 },
                                  ]}
                                />
                              ) : isToday && !isSelected ? (
                                <View style={styles.calendarTodayDot} />
                              ) : null}
                            </View>

                            {/* Badge Label: ACTIVE, SUN, HOL, or TODAY */}
                            {isSelected ? (
                              <View style={styles.calendarSelectedBadge}>
                                <Text style={styles.calendarSelectedBadgeText} numberOfLines={1}>
                                  DUE
                                </Text>
                              </View>
                            ) : isSunday ? (
                              <View style={[styles.calendarSunBadge, isPast && { opacity: 0.4 }]}>
                                <Text style={styles.calendarSunBadgeText} numberOfLines={1}>
                                  SUN
                                </Text>
                              </View>
                            ) : holidayOnDay ? (
                              <View
                                style={[
                                  styles.calendarHolBadge,
                                  { backgroundColor: holidayOnDay.color || '#ddb7ff' },
                                  isPast && { opacity: 0.4 },
                                ]}
                              >
                                <Text
                                  style={styles.calendarHolBadgeText}
                                  numberOfLines={1}
                                >
                                  {holidayOnDay.title.split(' ')[0] || 'HOL'}
                                </Text>
                              </View>
                            ) : isToday ? (
                              <View style={styles.calendarTodayBadge}>
                                <Text style={styles.calendarTodayBadgeText} numberOfLines={1}>
                                  TODAY
                                </Text>
                              </View>
                            ) : null}
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            {/* Legend */}
            <View style={styles.calendarLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#7c3aed' }]} />
                <Text style={styles.legendText}>Selected Due</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>Holiday (Off)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#fb7185' }]} />
                <Text style={styles.legendText}>Sunday</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#52525b' }]} />
                <Text style={styles.legendText}>Past</Text>
              </View>
            </View>

            {/* Quick Actions Footer */}
            <View style={[styles.datePickerFooter, { flexDirection: 'row', gap: 8 }]}>
              <Pressable
                onPress={() => {
                  const tmrw = getTomorrowDateStr();
                  handleSelectHwDate(tmrw);
                }}
                style={[styles.todayQuickBtn, { flex: 1 }]}
              >
                <Text style={styles.todayQuickBtnText}>
                  Tomorrow ({formatDateDisplay(getTomorrowDateStr())})
                </Text>
              </Pressable>
              {Boolean(homeworkSubmissionDate) && (
                <Pressable
                  onPress={() => {
                    setHomeworkSubmissionDate('');
                    setShowHwDatePickerModal(false);
                  }}
                  style={[styles.todayQuickBtn, { flex: 0.6, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 255, 255, 0.15)' }]}
                >
                  <Text style={[styles.todayQuickBtnText, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                    Clear
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* TOAST / FEEDBACK MODAL */}
      <Modal
        visible={toastData.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setToastData((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.toastModalBox, toastData.isError && styles.toastModalBoxError]}>
            <View style={[styles.toastIconBox, toastData.isError && styles.toastIconBoxError]}>
              {toastData.isError ? (
                <AlertCircle size={28} color="#fb7185" />
              ) : (
                <CheckCircle2 size={28} color="#34d399" />
              )}
            </View>

            <Text style={styles.toastTitle}>{toastData.title}</Text>
            <Text style={styles.toastMessage}>{toastData.message}</Text>

            <Pressable
              onPress={() => setToastData((prev) => ({ ...prev, visible: false }))}
              style={[styles.toastDoneButton, toastData.isError && styles.toastDoneButtonError]}
            >
              <Text style={[styles.toastDoneButtonText, toastData.isError && styles.toastDoneButtonTextError]}>
                {toastData.isError ? 'Understood' : 'Got it'}
              </Text>
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
    backgroundColor: '#0d0d12',
  },
  headerContainer: {
    position: 'relative',
    zIndex: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginRight: 8,
  },
  headerBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  academicYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00f1a1',
    marginRight: 6,
  },
  academicYearText: {
    color: '#ddb7ff',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
  },
  heroBanner: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBackgroundIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
    opacity: 0.6,
  },
  heroContent: {
    zIndex: 2,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11.5,
    lineHeight: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#16151f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    alignItems: 'center',
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  kpiValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#16151f',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeaderIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(221, 183, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cardHeaderTitle: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '800',
  },
  portalBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  portalBadgeText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  selectorsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#cfc2d6',
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputBox: {
    backgroundColor: '#1e1b29',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputBoxText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  textInputArea: {
    backgroundColor: '#1e1b29',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 12.5,
    textAlignVertical: 'top',
    lineHeight: 18,
  },
  textInputSingle: {
    backgroundColor: '#1e1b29',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 12.5,
  },
  saveDiaryButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  saveDiaryButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  saveDiaryButtonText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
    marginRight: 5,
  },
  liveSyncBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
  },
  recentSubmissionItem: {
    backgroundColor: '#1e1b29',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginBottom: 10,
  },
  recentItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recentItemClass: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  recentItemDateBadge: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recentItemDateText: {
    color: '#2dd4bf',
    fontSize: 11,
    fontWeight: '700',
  },
  recentTopicsText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    lineHeight: 17,
  },
  recentTopicsLabel: {
    color: '#ddb7ff',
    fontWeight: '700',
  },
  recentHomeworkBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 6,
  },
  recentHomeworkText: {
    color: '#fbbf24',
    fontSize: 11.5,
    fontWeight: '700',
  },
  recentNotesBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginTop: 6,
  },
  recentNotesText: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '500',
  },
  recentItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  recentTeacherName: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    fontWeight: '600',
  },
  recentSubmittedAt: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 10.5,
  },
  emptyRecentBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyRecentText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dropdownModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#181524',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  dropdownHeaderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(221, 183, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dropdownModalTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  dropdownModalSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownOptionsList: {
    gap: 8,
  },
  dropdownOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dropdownOptionCardActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    borderColor: '#ddb7ff',
  },
  dropdownOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  classInitialBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  classInitialBadgeActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#ddb7ff',
  },
  classInitialBadgeText: {
    color: '#cfc2d6',
    fontSize: 13,
    fontWeight: '900',
  },
  dropdownOptionTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownOptionTitleActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  dropdownOptionDesc: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 10.5,
    marginTop: 1,
  },
  activeCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  yearBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  yearBadgeActive: {
    backgroundColor: 'rgba(221, 183, 255, 0.18)',
    borderWidth: 1,
    borderColor: '#ddb7ff',
  },
  activePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginLeft: 6,
  },
  activePillText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800',
  },
  datePickerModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#181524',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  datePickerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(221, 183, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  datePickerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  datePickerSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
  datePickerMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 10,
  },
  datePickerMonthText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  navArrowBtn: {
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayHeaderRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 6,
  },
  weekdayCol: {
    width: `${100 / 7}%`,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  weekdayHeaderText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 4,
  },
  calendarCellSlot: {
    width: `${100 / 7}%`,
    paddingHorizontal: 2,
  },
  calendarDayCard: {
    width: '100%',
    minHeight: 46,
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  calendarSundayCard: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  calendarHolidayCard: {
    backgroundColor: 'rgba(221, 183, 255, 0.18)',
    borderColor: 'rgba(221, 183, 255, 0.45)',
  },
  calendarSelectedCard: {
    backgroundColor: '#6b21a8',
    borderColor: '#ddb7ff',
    borderWidth: 1.5,
  },
  calendarFutureCard: {
    opacity: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  calendarDayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  calendarDayNumText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#ffffff',
  },
  calendarHolidayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  calendarTodayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#34d399',
  },
  calendarSelectedBadge: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 1,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarSelectedBadgeText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  calendarSunBadge: {
    width: '100%',
    backgroundColor: 'rgba(244, 63, 94, 0.22)',
    paddingVertical: 1,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarSunBadgeText: {
    color: '#fda4af',
    fontSize: 7,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  calendarHolBadge: {
    width: '100%',
    paddingVertical: 1,
    paddingHorizontal: 1,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarHolBadgeText: {
    color: '#181524',
    fontSize: 7,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  calendarTodayBadge: {
    width: '100%',
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    paddingVertical: 1,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTodayBadgeText: {
    color: '#6ee7b7',
    fontSize: 7,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  calendarLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 4,
  },
  legendText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 9.5,
    fontWeight: '700',
  },
  datePickerFooter: {
    marginTop: 10,
  },
  todayQuickBtn: {
    backgroundColor: 'rgba(221, 183, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.3)',
    borderRadius: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayQuickBtnText: {
    color: '#ddb7ff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  toastModalBox: {
    backgroundColor: '#181524',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    padding: 22,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#34d399',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  toastIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  toastTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  toastMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  toastDoneButton: {
    backgroundColor: '#34d399',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  toastDoneButtonText: {
    color: '#0d0d12',
    fontSize: 13,
    fontWeight: '800',
  },
  toastModalBoxError: {
    borderColor: 'rgba(251, 113, 133, 0.4)',
    shadowColor: '#fb7185',
  },
  toastIconBoxError: {
    backgroundColor: 'rgba(251, 113, 133, 0.15)',
    borderColor: 'rgba(251, 113, 133, 0.35)',
  },
  toastDoneButtonError: {
    backgroundColor: '#fb7185',
  },
  toastDoneButtonTextError: {
    color: '#0d0d12',
  },
  recentHwDueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  recentHwDueText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default DailyDiaryScreen;
