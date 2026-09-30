import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  PanResponder,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Bookmark,
  Sparkles,
  Shield,
  GraduationCap,
  CalendarDays,
  Check,
  UserCheck,
} from 'lucide-react-native';
import { useDiaryStore, DiaryEntry, normalizeDate } from '../../store/diaryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';
import { DEFAULT_HOLIDAYS, HolidayItem } from './TeacherHolidayCalendarScreen';

// Assigned teacher classes matching Daily Diary screen
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

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'English',
  'Science',
  'Physics',
  'Chemistry',
  'Social Studies',
  'Hindi',
  'Telugu',
  'Computer Science',
  'General',
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
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10) - 1;
    d = parseInt(parts[2], 10);
  } else {
    d = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10) - 1;
    y = parseInt(parts[2], 10);
  }

  const monthName = MONTH_SHORT[m] || 'Sep';
  return `${d < 10 ? '0' + d : d} ${monthName} ${y}`;
};

export const HomeworkAssignmentsScreen: React.FC = () => {
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

  const getTomorrowDateStr = () => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    const d = String(tmrw.getDate()).padStart(2, '0');
    const m = String(tmrw.getMonth() + 1).padStart(2, '0');
    const y = tmrw.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const todayStr = useMemo(() => getTodayDateStr(), []);

  // Filter & Search State
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMyHomeworkOnly, setShowMyHomeworkOnly] = useState<boolean>(false);

  // Resolved Logged-in Teacher Name
  const currentTeacherName = user?.name || 'Sheeren Sultana';

  // "Add Homework" Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [formClass, setFormClass] = useState<string>('Class 4A');
  const [formSubject, setFormSubject] = useState<string>('Mathematics');
  const [formHwDate, setFormHwDate] = useState<string>(todayStr);
  const [formHwDescription, setFormHwDescription] = useState<string>('');
  const [formHwSubmissionDate, setFormHwSubmissionDate] = useState<string>('');
  const [formSpecialNote, setFormSpecialNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dropdown / Picker Modals
  const [showClassDropdownModal, setShowClassDropdownModal] = useState<boolean>(false);
  const [showSubjectDropdownModal, setShowSubjectDropdownModal] = useState<boolean>(false);
  const [showHwDatePickerModal, setShowHwDatePickerModal] = useState<boolean>(false);
  const [showSubmissionDatePickerModal, setShowSubmissionDatePickerModal] = useState<boolean>(false);

  // Toast / Feedback Modal
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; isError?: boolean }>({
    visible: false,
    title: '',
    message: '',
    isError: false,
  });

  // Calendar Navigator for Homework Date (Past & Present enabled, Future disabled)
  const [hwCalMonth, setHwCalMonth] = useState<number>(() => new Date().getMonth());
  const [hwCalYear, setHwCalYear] = useState<number>(() => new Date().getFullYear());

  // Calendar Navigator for Submission Date (Future enabled, Past disabled)
  const [subCalMonth, setSubCalMonth] = useState<number>(() => new Date().getMonth());
  const [subCalYear, setSubCalYear] = useState<number>(() => new Date().getFullYear());

  // Month navigation for HW Date Picker
  const handleHwPrevMonth = useCallback(() => {
    if (hwCalMonth === 0) {
      setHwCalMonth(11);
      setHwCalYear((prev) => prev - 1);
    } else {
      setHwCalMonth((prev) => prev - 1);
    }
  }, [hwCalMonth]);

  const handleHwNextMonth = useCallback(() => {
    if (hwCalMonth === 11) {
      setHwCalMonth(0);
      setHwCalYear((prev) => prev + 1);
    } else {
      setHwCalMonth((prev) => prev + 1);
    }
  }, [hwCalMonth]);

  const hwCalPrevRef = useRef(handleHwPrevMonth);
  const hwCalNextRef = useRef(handleHwNextMonth);
  hwCalPrevRef.current = handleHwPrevMonth;
  hwCalNextRef.current = handleHwNextMonth;

  // Swipe responder for HW Date Picker
  const calHwSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 15;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -35) {
          hwCalNextRef.current?.();
        } else if (gestureState.dx > 35) {
          hwCalPrevRef.current?.();
        }
      },
    })
  ).current;

  // Month navigation for Submission Date Picker
  const handleSubPrevMonth = useCallback(() => {
    if (subCalMonth === 0) {
      setSubCalMonth(11);
      setSubCalYear((prev) => prev - 1);
    } else {
      setSubCalMonth((prev) => prev - 1);
    }
  }, [subCalMonth]);

  const handleSubNextMonth = useCallback(() => {
    if (subCalMonth === 11) {
      setSubCalMonth(0);
      setSubCalYear((prev) => prev + 1);
    } else {
      setSubCalMonth((prev) => prev + 1);
    }
  }, [subCalMonth]);

  const subCalPrevRef = useRef(handleSubPrevMonth);
  const subCalNextRef = useRef(handleSubNextMonth);
  subCalPrevRef.current = handleSubPrevMonth;
  subCalNextRef.current = handleSubNextMonth;

  // Swipe responder for Submission Date Picker
  const calSubSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 15;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -35) {
          subCalNextRef.current?.();
        } else if (gestureState.dx > 35) {
          subCalPrevRef.current?.();
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

  // Find holiday helper
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

  // Helper: check if date is in future
  const isFutureDateStr = (dateStr: string): boolean => {
    const today = getTodayDateStr();
    const partsToday = today.split('-');
    const partsDate = dateStr.split('-');
    const dToday = new Date(Number(partsToday[2]), Number(partsToday[1]) - 1, Number(partsToday[0]));
    const dDate = new Date(Number(partsDate[2]), Number(partsDate[1]) - 1, Number(partsDate[0]));
    return dDate > dToday;
  };

  // Helper: check if date is strictly in past (before today)
  const isPastDateStr = (dateStr: string): boolean => {
    const today = getTodayDateStr();
    const partsToday = today.split('-');
    const partsDate = dateStr.split('-');
    const dToday = new Date(Number(partsToday[2]), Number(partsToday[1]) - 1, Number(partsToday[0]));
    const dDate = new Date(Number(partsDate[2]), Number(partsDate[1]) - 1, Number(partsDate[0]));
    return dDate < dToday;
  };

  // Selection Handler for Homework Date (Past and Present allowed, Future/Holidays/Sundays blocked)
  const handleSelectHwDate = (fullDateStr: string) => {
    if (isFutureDateStr(fullDateStr)) {
      setToastData({
        visible: true,
        title: 'Future Date Disabled',
        message: `Homework cannot be assigned on upcoming dates (${formatDateDisplay(fullDateStr)}). Only past and current dates are allowed.`,
        isError: true,
      });
      return;
    }

    if (isSundayDateStr(fullDateStr)) {
      setToastData({
        visible: true,
        title: 'Sunday Selected',
        message: `Sundays are non-working days (${formatDateDisplay(fullDateStr)}). Please choose a valid school working day.`,
        isError: true,
      });
      return;
    }

    const holiday = findHolidayForDate(fullDateStr);
    if (holiday) {
      setToastData({
        visible: true,
        title: `Holiday: ${holiday.title}`,
        message: `${holiday.title} is an official school holiday (${formatDateDisplay(fullDateStr)}). Homework cannot be assigned on holidays.`,
        isError: true,
      });
      return;
    }

    setFormHwDate(fullDateStr);
    setShowHwDatePickerModal(false);
  };

  // Selection Handler for Homework Submission Due Date (Future allowed, Past/Holidays/Sundays blocked)
  const handleSelectSubmissionDate = (fullDateStr: string) => {
    if (isPastDateStr(fullDateStr)) {
      setToastData({
        visible: true,
        title: 'Past Date Disabled',
        message: `Homework submission due date (${formatDateDisplay(fullDateStr)}) cannot be in the past. Please select today or a future date.`,
        isError: true,
      });
      return;
    }

    if (isSundayDateStr(fullDateStr)) {
      setToastData({
        visible: true,
        title: 'Sunday Selected',
        message: `Sundays are non-working days (${formatDateDisplay(fullDateStr)}). Please select a school working day for homework submission.`,
        isError: true,
      });
      return;
    }

    const holiday = findHolidayForDate(fullDateStr);
    if (holiday) {
      setToastData({
        visible: true,
        title: `Holiday: ${holiday.title}`,
        message: `${holiday.title} is an official school holiday (${formatDateDisplay(fullDateStr)}). Please choose a working school day for submission.`,
        isError: true,
      });
      return;
    }

    setFormHwSubmissionDate(fullDateStr);
    setShowSubmissionDatePickerModal(false);
  };

  // Handle Save New Homework
  const handleSaveHomework = async () => {
    if (!formHwDescription.trim()) {
      setToastData({
        visible: true,
        title: 'Homework Required',
        message: 'Please provide homework instructions or description before publishing.',
        isError: true,
      });
      return;
    }

    setIsSubmitting(true);
    const cleanClassId = formClass.replace(/^Class\s*/i, '');
    const teacherName = user?.name || 'Sheeren Sultana';

    try {
      await addOrUpdateEntry({
        classId: cleanClassId,
        className: `Class ${cleanClassId}`,
        subject: formSubject,
        teacherName,
        topics: `Homework: ${formSubject}`,
        topicTitle: `Homework: ${formSubject}`,
        homework: formHwDescription.trim(),
        homeworkSubmissionDate: formHwSubmissionDate || undefined,
        notes: formSpecialNote.trim(),
        contentSummary: formHwDescription.trim(),
        date: formHwDate,
        parentsCount: 28,
      });

      setShowAddModal(false);
      setToastData({
        visible: true,
        title: 'Homework Assigned Successfully!',
        message: `Homework for Class ${cleanClassId} (${formSubject}) on ${formatDateDisplay(formHwDate)} has been published.`,
        isError: false,
      });

      // Reset form
      setFormHwDescription('');
      setFormHwSubmissionDate('');
      setFormSpecialNote('');
    } catch (error) {
      console.log('Error saving homework:', error);
      setToastData({
        visible: true,
        title: 'Error Saving Homework',
        message: 'Failed to assign homework. Please try again.',
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const myAssignedClean = useMemo(
    () => ASSIGNED_CLASSES.map((c) => c.id.toUpperCase()),
    []
  );

  // All homework assignments sourced from diaryStore (entries with homework text or submission date)
  const homeworkItems = useMemo(() => {
    const list = diaryEntries.filter(
      (e) =>
        (e.homework && e.homework.trim().length > 0) ||
        (e.homeworkSubmissionDate && ((e.topics && e.topics.trim().length > 0) || (e.notes && e.notes.trim().length > 0)))
    );
    // Sort descending by date
    return list.sort((a, b) => {
      const isoA = toIsoDateStr(a.date);
      const isoB = toIsoDateStr(b.date);
      return isoB.localeCompare(isoA);
    });
  }, [diaryEntries]);

  // Filtered list based on Class filter, Own Homework toggle & Search query
  const filteredHomework = useMemo(() => {
    return homeworkItems.filter((item) => {
      // Toggle for showing only current logged in user's own homework
      if (showMyHomeworkOnly) {
        const itemTeacher = (item.teacherName || '').toLowerCase().trim();
        const myName = currentTeacherName.toLowerCase().trim();
        const isAssignedClass = myAssignedClean.includes(item.classId.toUpperCase());
        const matchTeacher =
          isAssignedClass ||
          itemTeacher.includes(myName) ||
          myName.includes(itemTeacher) ||
          (user?.email && itemTeacher.includes(user.email.split('@')[0].toLowerCase()));

        if (!matchTeacher) return false;
      }

      const matchClass =
        selectedClassFilter === 'ALL' ||
        item.classId.toUpperCase() === selectedClassFilter.toUpperCase() ||
        item.className.toUpperCase().includes(selectedClassFilter.toUpperCase());

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.homework && item.homework.toLowerCase().includes(q)) ||
        (item.subject && item.subject.toLowerCase().includes(q)) ||
        (item.teacherName && item.teacherName.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.topics && item.topics.toLowerCase().includes(q)) ||
        (item.className && item.className.toLowerCase().includes(q));

      return matchClass && matchSearch;
    });
  }, [homeworkItems, showMyHomeworkOnly, currentTeacherName, myAssignedClean, selectedClassFilter, searchQuery, user?.email]);

  // Stats calculation
  const totalHomeworkCount = homeworkItems.length;
  const classesWithHwCount = new Set(homeworkItems.map((h) => h.classId)).size;
  const withSubmissionDueCount = homeworkItems.filter((h) => h.homeworkSubmissionDate).length;

  // Calendar Grid calculation for Homework Assigned Date (Past & Present enabled)
  const hwCalendarWeeks = useMemo(() => {
    const totalSlots: {
      dayNum: number;
      fullDateStr: string;
      isSunday: boolean;
      isOtherMonth: boolean;
      isPrevMonth?: boolean;
      isNextMonth?: boolean;
    }[] = [];

    const daysInMonthCount = new Date(hwCalYear, hwCalMonth + 1, 0).getDate();
    const firstDayWeekdayIndex = new Date(hwCalYear, hwCalMonth, 1).getDay();

    const prevMonth = hwCalMonth === 0 ? 11 : hwCalMonth - 1;
    const prevYear = hwCalMonth === 0 ? hwCalYear - 1 : hwCalYear;
    const daysInPrevMonth = new Date(hwCalYear, hwCalMonth, 0).getDate();

    const nextMonth = hwCalMonth === 11 ? 0 : hwCalMonth + 1;
    const nextYear = hwCalMonth === 11 ? hwCalYear + 1 : hwCalYear;

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
      const mStr = String(hwCalMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      totalSlots.push({
        dayNum: d,
        fullDateStr: `${dStr}-${mStr}-${hwCalYear}`,
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
  }, [hwCalYear, hwCalMonth]);

  // Calendar Grid calculation for Submission Due Date (Future dates enabled)
  const subCalendarWeeks = useMemo(() => {
    const totalSlots: {
      dayNum: number;
      fullDateStr: string;
      isSunday: boolean;
      isOtherMonth: boolean;
      isPrevMonth?: boolean;
      isNextMonth?: boolean;
    }[] = [];

    const daysInMonthCount = new Date(subCalYear, subCalMonth + 1, 0).getDate();
    const firstDayWeekdayIndex = new Date(subCalYear, subCalMonth, 1).getDay();

    const prevMonth = subCalMonth === 0 ? 11 : subCalMonth - 1;
    const prevYear = subCalMonth === 0 ? subCalYear - 1 : subCalYear;
    const daysInPrevMonth = new Date(subCalYear, subCalMonth, 0).getDate();

    const nextMonth = subCalMonth === 11 ? 0 : subCalMonth + 1;
    const nextYear = subCalMonth === 11 ? subCalYear + 1 : subCalYear;

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
      const mStr = String(subCalMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      totalSlots.push({
        dayNum: d,
        fullDateStr: `${dStr}-${mStr}-${subCalYear}`,
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
  }, [subCalYear, subCalMonth]);

  const handleBack = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Dashboard');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Deep Gradient matching Examination Screen */}
      <LinearGradient
        colors={['#22143d', '#150d26', '#0b0912', '#08070d']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER MATCHING DAILY DIARY STYLE */}
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {navigation?.canGoBack?.() && (
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
                  Homework
                </Text>
                <View style={styles.headerBadge}>
                  <Shield size={10} color="#34d399" style={{ marginRight: 3 }} />
                  <Text style={styles.headerBadgeText}>Teacher Portal</Text>
                </View>
              </View>
              <View className="flex-row items-center mt-0.5">
                <View className="w-2 h-2 rounded-full bg-[#00f1a1] mr-1.5" />
                <Text className="text-[#ddb7ff] text-xs font-semibold" numberOfLines={1}>
                  Academic Session 2026-27
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* MAIN CONTENT SCROLLVIEW */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(tabBarBottomPadding + 40, 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO BANNER & ADD HOMEWORK BUTTON ROW */}
        <View style={styles.heroBanner}>
          <LinearGradient
            colors={['#581c87', '#6b21a8', '#4c1d95']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroBackgroundIcon}>
            <Bookmark size={80} color="rgba(255,255,255,0.08)" />
          </View>
          <View style={styles.heroContent}>
            <View className="flex-row items-center justify-between">
              <Text style={styles.heroSubtitle}>ACADEMIC ASSIGNMENTS</Text>
            </View>
            <Text style={styles.heroTitle}>Homework & Submissions</Text>
            <Text style={styles.heroDesc}>
              View active homework assignments synchronized with Daily Diary, track submission due dates, and assign new tasks.
            </Text>
          </View>
        </View>

        {/* TOP ACTION BAR: MY HOMEWORK TOGGLE & "ADD HOMEWORK" BUTTON */}
        <View style={styles.topControlRow}>
          {/* Toggle Switch: My Homework Only */}
          <View style={styles.myHwToggleCard}>
            <View style={styles.myHwToggleInfo}>
              <View className="flex-row items-center">
                <UserCheck
                  size={14}
                  color={showMyHomeworkOnly ? '#ddb7ff' : 'rgba(255,255,255,0.5)'}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.myHwToggleTitle, showMyHomeworkOnly && styles.myHwToggleTitleActive]}>
                  My Homework
                </Text>
              </View>
              <Text style={styles.myHwToggleSub} numberOfLines={1}>
                {showMyHomeworkOnly ? `Only ${currentTeacherName}` : 'All faculty tasks'}
              </Text>
            </View>
            <Switch
              value={showMyHomeworkOnly}
              onValueChange={setShowMyHomeworkOnly}
              trackColor={{ false: 'rgba(255, 255, 255, 0.15)', true: '#9333ea' }}
              thumbColor={showMyHomeworkOnly ? '#ddb7ff' : '#9ca3af'}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginLeft: 4 }}
            />
          </View>

          {/* "+ ADD HOMEWORK" BUTTON AT TOP RIGHT */}
          <Pressable
            onPress={() => setShowAddModal(true)}
            style={styles.addHomeworkBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <LinearGradient
              colors={['#c084fc', '#9333ea']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addHomeworkBtnGradient}
            >
              <Plus size={16} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.addHomeworkBtnText}>Add Home Work</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* 3 KPI SUMMARY CARDS */}
        <View style={styles.kpiRow}>
          {/* Card 1 */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(221, 183, 255, 0.15)', borderColor: 'rgba(221, 183, 255, 0.35)' }]}>
              <Bookmark size={16} color="#ddb7ff" />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.kpiLabel}>
              Total Assigned
            </Text>
            <Text style={styles.kpiValue}>{totalHomeworkCount}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.kpiSub, { color: '#ddb7ff' }]}>
              Across all classes
            </Text>
          </View>

          {/* Card 2 */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.35)' }]}>
              <CalendarDays size={16} color="#38bdf8" />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.kpiLabel}>
              Due Dates Set
            </Text>
            <Text style={styles.kpiValue}>{withSubmissionDueCount}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.kpiSub, { color: '#38bdf8' }]}>
              With submission date
            </Text>
          </View>

          {/* Card 3 */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.35)' }]}>
              <GraduationCap size={16} color="#34d399" />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.kpiLabel}>
              Classes Active
            </Text>
            <Text style={styles.kpiValue}>{classesWithHwCount}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.kpiSub, { color: '#34d399' }]}>
              Sections covered
            </Text>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Search size={18} color="rgba(255, 255, 255, 0.4)" style={{ marginRight: 10 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search homework, subject, or special notes..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color="rgba(255, 255, 255, 0.6)" />
            </Pressable>
          )}
        </View>

        {/* CLASS FILTER HORIZONTAL TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.classFilterScroll}
        >
          <Pressable
            onPress={() => setSelectedClassFilter('ALL')}
            style={[
              styles.classFilterPill,
              selectedClassFilter === 'ALL' && styles.classFilterPillActive,
            ]}
          >
            <Text
              style={[
                styles.classFilterPillText,
                selectedClassFilter === 'ALL' && styles.classFilterPillTextActive,
              ]}
            >
              All Classes ({homeworkItems.length})
            </Text>
          </Pressable>

          {ASSIGNED_CLASSES.map((cls) => {
            const count = homeworkItems.filter(
              (h) => h.classId.toUpperCase() === cls.id.toUpperCase()
            ).length;
            const isSelected = selectedClassFilter.toUpperCase() === cls.id.toUpperCase();

            return (
              <Pressable
                key={cls.id}
                onPress={() => setSelectedClassFilter(cls.id)}
                style={[
                  styles.classFilterPill,
                  isSelected && styles.classFilterPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.classFilterPillText,
                    isSelected && styles.classFilterPillTextActive,
                  ]}
                >
                  {cls.name} {count > 0 ? `(${count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* LIST OF HOMEWORK ASSIGNMENT CARDS */}
        <View style={styles.listHeaderRow}>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <Text style={styles.sectionHeading}>
              {selectedClassFilter === 'ALL' ? 'All Assignments' : `Class ${selectedClassFilter} Assignments`}
            </Text>
            {showMyHomeworkOnly && (
              <View style={styles.myOnlyBadge}>
                <Text style={styles.myOnlyBadgeText}>My Tasks Only</Text>
              </View>
            )}
          </View>
          <Text style={styles.resultsCount}>
            {filteredHomework.length} {filteredHomework.length === 1 ? 'task' : 'tasks'} found
          </Text>
        </View>

        {filteredHomework.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Bookmark size={42} color="rgba(221, 183, 255, 0.3)" />
            <Text style={styles.emptyStateTitle}>No Homework Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? 'No homework matches your search query. Try clearing the search.'
                : 'No homework assignments published yet for this selection. Click "+ Add Home Work" above or publish via Daily Diary.'}
            </Text>
            <Pressable
              onPress={() => setShowAddModal(true)}
              style={styles.emptyStateActionBtn}
            >
              <Plus size={16} color="#ddb7ff" style={{ marginRight: 6 }} />
              <Text style={styles.emptyStateActionBtnText}>Create Homework Now</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {filteredHomework.map((item) => (
              <View key={item.id} style={styles.hwCard}>
                {/* Top Row: Class & Subject Badge + Date */}
                <View style={styles.hwCardHeader}>
                  <View style={styles.hwBadgeRow}>
                    <View style={styles.classPill}>
                      <Text style={styles.classPillText}>
                        {item.className || `Class ${item.classId}`}
                      </Text>
                    </View>
                    {item.subject && (
                      <View style={styles.subjectPill}>
                        <Text style={styles.subjectPillText}>{item.subject}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.hwDateBadge}>
                    <CalendarIcon size={13} color="#ddb7ff" style={{ marginRight: 4 }} />
                    <Text style={styles.hwDateText}>{formatDateDisplay(item.date)}</Text>
                  </View>
                </View>

                {/* Teacher Info */}
                <View style={styles.teacherRow}>
                  <Text style={styles.teacherLabel}>Assigned by:</Text>
                  <Text style={styles.teacherName}>
                    {showMyHomeworkOnly ? currentTeacherName : (item.teacherName || currentTeacherName)}
                  </Text>
                  {item.submittedAt && (
                    <Text style={styles.submissionTime}>• {item.submittedAt}</Text>
                  )}
                </View>

                {/* Homework Content / Instructions */}
                <View style={styles.hwContentContainer}>
                  <View style={styles.hwContentHeaderRow}>
                    <BookOpen size={15} color="#ddb7ff" style={{ marginRight: 6 }} />
                    <Text style={styles.hwContentLabel}>HOMEWORK INSTRUCTIONS</Text>
                  </View>
                  <Text style={styles.hwDescriptionText}>
                    {item.homework || item.notes || item.topics || 'Homework assigned'}
                  </Text>
                </View>

                {/* Homework Submission Date Badge (if provided) */}
                {item.homeworkSubmissionDate ? (
                  <View style={styles.submissionDueBox}>
                    <CalendarDays size={16} color="#38bdf8" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.submissionDueLabel}>SUBMISSION DUE DATE</Text>
                      <Text style={styles.submissionDueDateValue}>
                        {formatDateDisplay(item.homeworkSubmissionDate)}
                      </Text>
                    </View>
                    <View style={styles.submissionActiveTag}>
                      <Clock size={11} color="#38bdf8" style={{ marginRight: 3 }} />
                      <Text style={styles.submissionActiveTagText}>Due</Text>
                    </View>
                  </View>
                ) : null}

                {/* Special Notes (if any) */}
                {item.notes ? (
                  <View style={styles.specialNoteBox}>
                    <View style={styles.specialNoteHeader}>
                      <FileText size={13} color="#f59e0b" style={{ marginRight: 5 }} />
                      <Text style={styles.specialNoteLabel}>SPECIAL NOTE / REMARKS</Text>
                    </View>
                    <Text style={styles.specialNoteText}>{item.notes}</Text>
                  </View>
                ) : null}

                {/* Topics Covered (if any) */}
                {item.topics && item.topics !== `Homework: ${item.subject}` && (
                  <View style={styles.topicsRow}>
                    <Text style={styles.topicsLabel}>Classroom Topic:</Text>
                    <Text style={styles.topicsText} numberOfLines={1}>
                      {item.topics}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* ADD HOMEWORK POPUP MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAddModal(false)} />
          <View style={[styles.modalCardContainer, { maxHeight: '90%' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View className="flex-row items-center flex-1">
                <View style={styles.modalHeaderIconBox}>
                  <Bookmark size={20} color="#ddb7ff" />
                </View>
                <View className="ml-3 flex-1">
                  <Text style={styles.modalTitleText}>Add Home Work</Text>
                  <Text style={styles.modalSubTitleText}>
                    Assign new homework task with submission due date
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setShowAddModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>

            {/* Modal Scrollable Form */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 18, paddingBottom: 24 }}
            >
              {/* 1. Class Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  SELECT CLASS <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <Pressable
                  onPress={() => setShowClassDropdownModal(true)}
                  style={styles.dropdownInput}
                >
                  <View className="flex-row items-center flex-1">
                    <GraduationCap size={18} color="#ddb7ff" style={{ marginRight: 10 }} />
                    <Text style={styles.dropdownValueText}>{formClass}</Text>
                  </View>
                  <ChevronDown size={18} color="#ddb7ff" />
                </Pressable>
              </View>

              {/* 2. Subject Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  SELECT SUBJECT <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <Pressable
                  onPress={() => setShowSubjectDropdownModal(true)}
                  style={styles.dropdownInput}
                >
                  <View className="flex-row items-center flex-1">
                    <BookOpen size={18} color="#38bdf8" style={{ marginRight: 10 }} />
                    <Text style={styles.dropdownValueText}>{formSubject}</Text>
                  </View>
                  <ChevronDown size={18} color="#38bdf8" />
                </Pressable>
              </View>

              {/* 3. Homework Date (Assigned Date: Past & Present only, Holiday warning) */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  HOMEWORK DATE (ASSIGNED) <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <Pressable
                  onPress={() => setShowHwDatePickerModal(true)}
                  style={styles.datePickerInput}
                >
                  <View className="flex-row items-center flex-1">
                    <CalendarIcon size={18} color="#ddb7ff" style={{ marginRight: 10 }} />
                    <Text style={styles.datePickerValueText}>
                      {formatDateDisplay(formHwDate) || 'Select date'}
                    </Text>
                  </View>
                  <View style={styles.dateChangeBadge}>
                    <Text style={styles.dateChangeBadgeText}>Pick Date</Text>
                  </View>
                </Pressable>
                <Text style={styles.fieldHelpText}>
                  Past and present working dates are enabled. Sundays and holidays are excluded.
                </Text>
              </View>

              {/* 4. Homework Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  HOMEWORK DESCRIPTION <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  value={formHwDescription}
                  onChangeText={setFormHwDescription}
                  placeholder="Enter detailed homework instructions, exercises, questions..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  numberOfLines={4}
                  style={styles.textAreaInput}
                />
              </View>

              {/* 5. Homework Submission Date (Future dates enabled, Holiday/Sunday warnings) */}
              <View style={styles.formGroup}>
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text style={styles.formLabel}>
                    HOMEWORK SUBMISSION DATE <Text style={styles.optionalText}>(Optional)</Text>
                  </Text>
                  {formHwSubmissionDate ? (
                    <Pressable
                      onPress={() => setFormHwSubmissionDate('')}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.clearDateText}>Clear</Text>
                    </Pressable>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => setShowSubmissionDatePickerModal(true)}
                  style={[
                    styles.datePickerInput,
                    formHwSubmissionDate ? { borderColor: 'rgba(56, 189, 248, 0.4)' } : {},
                  ]}
                >
                  <View className="flex-row items-center flex-1">
                    <CalendarDays
                      size={18}
                      color={formHwSubmissionDate ? '#38bdf8' : '#ddb7ff'}
                      style={{ marginRight: 10 }}
                    />
                    <Text
                      style={[
                        styles.datePickerValueText,
                        formHwSubmissionDate ? { color: '#38bdf8', fontWeight: '700' } : { color: 'rgba(255,255,255,0.45)' },
                      ]}
                    >
                      {formHwSubmissionDate ? formatDateDisplay(formHwSubmissionDate) : 'Select submission due date'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.dateChangeBadge,
                      formHwSubmissionDate ? { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.35)' } : {},
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateChangeBadgeText,
                        formHwSubmissionDate ? { color: '#38bdf8' } : {},
                      ]}
                    >
                      {formHwSubmissionDate ? 'Change Due Date' : 'Set Due Date'}
                    </Text>
                  </View>
                </Pressable>
                <Text style={styles.fieldHelpText}>
                  Future working school dates are enabled. Marked Sundays and holidays are excluded.
                </Text>
              </View>

              {/* 6. Special Note / Remarks */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  SPECIAL NOTE / REMARKS <Text style={styles.optionalText}>(Optional)</Text>
                </Text>
                <TextInput
                  value={formSpecialNote}
                  onChangeText={setFormSpecialNote}
                  placeholder="Special instructions (e.g. Bring workbook tomorrow, parent signature required...)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  numberOfLines={2}
                  style={[styles.textAreaInput, { minHeight: 70 }]}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionRow}>
                <Pressable
                  onPress={() => setShowAddModal(false)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveHomework}
                  disabled={isSubmitting}
                  style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                >
                  <LinearGradient
                    colors={['#c084fc', '#9333ea']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitBtnGradient}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Check size={18} color="#fff" strokeWidth={2.5} style={{ marginRight: 6 }} />
                        <Text style={styles.submitBtnText}>Publish Homework</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* CLASS SELECTOR MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={showClassDropdownModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClassDropdownModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowClassDropdownModal(false)} />
          <View style={styles.pickerModalBox}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Class</Text>
              <Pressable onPress={() => setShowClassDropdownModal(false)}>
                <X size={18} color="#fff" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 340 }}>
              {ASSIGNED_CLASSES.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setFormClass(c.name);
                    setShowClassDropdownModal(false);
                  }}
                  style={[
                    styles.pickerOptionItem,
                    formClass === c.name && styles.pickerOptionItemActive,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formClass === c.name && styles.pickerOptionTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                    <Text style={styles.pickerOptionSub}>{c.desc}</Text>
                  </View>
                  {formClass === c.name && <Check size={18} color="#ddb7ff" />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* SUBJECT SELECTOR MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={showSubjectDropdownModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubjectDropdownModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowSubjectDropdownModal(false)} />
          <View style={styles.pickerModalBox}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Subject</Text>
              <Pressable onPress={() => setShowSubjectDropdownModal(false)}>
                <X size={18} color="#fff" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 340 }}>
              {DEFAULT_SUBJECTS.map((sub) => (
                <Pressable
                  key={sub}
                  onPress={() => {
                    setFormSubject(sub);
                    setShowSubjectDropdownModal(false);
                  }}
                  style={[
                    styles.pickerOptionItem,
                    formSubject === sub && styles.pickerOptionItemActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      formSubject === sub && styles.pickerOptionTextActive,
                    ]}
                  >
                    {sub}
                  </Text>
                  {formSubject === sub && <Check size={18} color="#38bdf8" />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* CALENDAR MODAL: HOMEWORK ASSIGNED DATE (PAST & PRESENT ENABLED) */}
      {/* ========================================================================= */}
      <Modal
        visible={showHwDatePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHwDatePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowHwDatePickerModal(false)} />
          <View style={styles.datePickerModalBox}>
            {/* Modal Header */}
            <View style={styles.datePickerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <View style={styles.datePickerIconCircle}>
                  <CalendarDays size={18} color="#ddb7ff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.datePickerTitle}>Select Homework Date</Text>
                  <Text style={styles.datePickerSubtitle}>
                    Swipe left/right to navigate months
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

            {/* Month Navigator */}
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
                  {MONTH_NAMES[hwCalMonth]} {hwCalYear}
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
                      const isFuture = isFutureDateStr(fullDateStr);
                      const isSelected = formHwDate === fullDateStr;
                      const isToday = fullDateStr === todayStr;

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
                                  isFuture && { color: '#52525b' },
                                  !isFuture && isSunday && { color: '#fb7185' },
                                  !isFuture && holidayOnDay && { color: holidayOnDay.color || '#ddb7ff' },
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
                  setFormHwDate(todayStr);
                  setShowHwDatePickerModal(false);
                }}
                style={styles.todayQuickBtn}
              >
                <Text style={styles.todayQuickBtnText}>
                  Select Today ({formatDateDisplay(todayStr)})
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* CALENDAR MODAL: HOMEWORK SUBMISSION DUE DATE (FUTURE DATES ENABLED) */}
      {/* ========================================================================= */}
      <Modal
        visible={showSubmissionDatePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmissionDatePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowSubmissionDatePickerModal(false)} />
          <View style={styles.datePickerModalBox}>
            {/* Modal Header */}
            <View style={styles.datePickerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <View style={[styles.datePickerIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.35)' }]}>
                  <CalendarDays size={18} color="#38bdf8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.datePickerTitle}>Submission Due Date</Text>
                  <Text style={styles.datePickerSubtitle}>
                    Future dates enabled for assignment submission
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setShowSubmissionDatePickerModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color="#38bdf8" />
              </Pressable>
            </View>

            {/* Month Navigator */}
            <View style={styles.datePickerMonthNav}>
              <Pressable
                onPress={handleSubPrevMonth}
                style={styles.navArrowBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={16} color="#38bdf8" />
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CalendarIcon size={14} color="#38bdf8" style={{ marginRight: 6 }} />
                <Text style={styles.datePickerMonthText}>
                  {MONTH_NAMES[subCalMonth]} {subCalYear}
                </Text>
              </View>
              <Pressable
                onPress={handleSubNextMonth}
                style={styles.navArrowBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronRight size={16} color="#38bdf8" />
              </Pressable>
            </View>

            {/* Swipeable Calendar Body */}
            <View {...calSubSwipeResponder.panHandlers} style={{ width: '100%' }}>
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
                {subCalendarWeeks.map((week, weekIdx) => (
                  <View key={`sub_week_${weekIdx}`} style={styles.calendarWeekRow}>
                    {week.map((cell, colIdx) => {
                      const { dayNum, fullDateStr, isSunday, isPrevMonth, isNextMonth } = cell;
                      const holidayOnDay = findHolidayForDate(fullDateStr);
                      const isPast = isPastDateStr(fullDateStr);
                      const isSelected = formHwSubmissionDate === fullDateStr;
                      const isToday = fullDateStr === todayStr;

                      return (
                        <View
                          key={`sub_day_${fullDateStr}_${colIdx}`}
                          style={styles.calendarCellSlot}
                        >
                          <Pressable
                            onPress={() => {
                              if (isPrevMonth) {
                                handleSubPrevMonth();
                              } else if (isNextMonth) {
                                handleSubNextMonth();
                              }
                              handleSelectSubmissionDate(fullDateStr);
                            }}
                            style={[
                              styles.calendarDayCard,
                              isPast && styles.calendarFutureCard,
                              !isPast && isSunday && styles.calendarSundayCard,
                              !isPast && holidayOnDay && styles.calendarHolidayCard,
                              isSelected && styles.calendarSelectedCardBlue,
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

                            {/* Badge Label: DUE, SUN, HOL, or TODAY */}
                            {isSelected ? (
                              <View style={styles.calendarSelectedBadgeBlue}>
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
                <View style={[styles.legendDot, { backgroundColor: '#0284c7' }]} />
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
                  handleSelectSubmissionDate(tmrw);
                }}
                style={[styles.todayQuickBtn, { flex: 1, backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.35)' }]}
              >
                <Text style={[styles.todayQuickBtnText, { color: '#38bdf8' }]}>
                  Tomorrow ({formatDateDisplay(getTomorrowDateStr())})
                </Text>
              </Pressable>
              {Boolean(formHwSubmissionDate) && (
                <Pressable
                  onPress={() => {
                    setFormHwSubmissionDate('');
                    setShowSubmissionDatePickerModal(false);
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

      {/* ========================================================================= */}
      {/* TOAST / WARNING / SUCCESS MODAL POPUP */}
      {/* ========================================================================= */}
      <Modal
        visible={toastData.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setToastData((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.toastOverlay}>
          <View style={styles.toastCard}>
            <View
              style={[
                styles.toastIconBox,
                toastData.isError
                  ? { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)' }
                  : { backgroundColor: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.4)' },
              ]}
            >
              {toastData.isError ? (
                <AlertCircle size={28} color="#ef4444" />
              ) : (
                <CheckCircle2 size={28} color="#34d399" />
              )}
            </View>
            <Text style={styles.toastTitle}>{toastData.title}</Text>
            <Text style={styles.toastMessage}>{toastData.message}</Text>
            <Pressable
              onPress={() => setToastData((prev) => ({ ...prev, visible: false }))}
              style={[
                styles.toastActionBtn,
                toastData.isError
                  ? { backgroundColor: '#ef4444' }
                  : { backgroundColor: '#9333ea' },
              ]}
            >
              <Text style={styles.toastActionBtnText}>
                {toastData.isError ? 'Understood' : 'Continue'}
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
    backgroundColor: '#08070d',
  },
  headerContainer: {
    zIndex: 50,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  headerBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroBanner: {
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
  },
  heroBackgroundIcon: {
    position: 'absolute',
    right: -10,
    bottom: -15,
  },
  heroContent: {
    zIndex: 2,
  },
  heroSubtitle: {
    color: '#ddb7ff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  heroDesc: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 10,
  },
  myHwToggleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181524',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.2)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  myHwToggleInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  myHwToggleTitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '700',
  },
  myHwToggleTitleActive: {
    color: '#ddb7ff',
    fontWeight: '900',
  },
  myHwToggleSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  myOnlyBadge: {
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.4)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  myOnlyBadgeText: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(221, 183, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 6,
  },
  kpiMiniText: {
    color: '#ddb7ff',
    fontSize: 12,
    fontWeight: '600',
  },
  addHomeworkBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  addHomeworkBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  addHomeworkBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#181524',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  kpiValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  kpiSub: {
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181524',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  classFilterScroll: {
    gap: 8,
    paddingBottom: 14,
  },
  classFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  classFilterPillActive: {
    backgroundColor: '#9333ea',
    borderColor: '#c084fc',
  },
  classFilterPillText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  classFilterPillTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeading: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  resultsCount: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStateCard: {
    backgroundColor: '#181524',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyStateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(221, 183, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.35)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyStateActionBtnText: {
    color: '#ddb7ff',
    fontSize: 13,
    fontWeight: '800',
  },
  hwCard: {
    backgroundColor: '#181524',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.18)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  hwCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  hwBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  classPill: {
    backgroundColor: 'rgba(221, 183, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  classPillText: {
    color: '#ddb7ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subjectPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subjectPillText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },
  hwDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  hwDateText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '700',
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 5,
  },
  teacherLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    fontWeight: '500',
  },
  teacherName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  submissionTime: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '500',
  },
  hwContentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  hwContentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  hwContentLabel: {
    color: '#ddb7ff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  hwDescriptionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  submissionDueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  submissionDueLabel: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  submissionDueDateValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  submissionActiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  submissionActiveTagText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
  specialNoteBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  specialNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  specialNoteLabel: {
    color: '#f59e0b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  specialNoteText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  topicsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  topicsLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '500',
  },
  topicsText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    position: 'absolute',
    inset: 0,
  },
  modalCardContainer: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#181524',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  modalHeaderIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(221, 183, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  modalSubTitleText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    color: '#ddb7ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  optionalText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    fontWeight: '600',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownValueText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  datePickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  datePickerValueText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  dateChangeBadge: {
    backgroundColor: 'rgba(221, 183, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dateChangeBadgeText: {
    color: '#ddb7ff',
    fontSize: 11,
    fontWeight: '700',
  },
  clearDateText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
  fieldHelpText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 14,
  },
  textAreaInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    padding: 12,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlignVertical: 'top',
    minHeight: 90,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  pickerModalBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#181524',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
    padding: 16,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  pickerModalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  pickerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  pickerOptionItemActive: {
    backgroundColor: 'rgba(221, 183, 255, 0.1)',
  },
  pickerOptionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pickerOptionTextActive: {
    color: '#ddb7ff',
    fontWeight: '900',
  },
  pickerOptionSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    marginTop: 2,
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
  calendarSelectedCardBlue: {
    backgroundColor: '#0369a1',
    borderColor: '#38bdf8',
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
  calendarSelectedBadgeBlue: {
    width: '100%',
    backgroundColor: 'rgba(56, 189, 248, 0.35)',
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
  toastOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  toastCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#181524',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
    padding: 22,
    alignItems: 'center',
  },
  toastIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  toastTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  toastMessage: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  toastActionBtn: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default HomeworkAssignmentsScreen;
