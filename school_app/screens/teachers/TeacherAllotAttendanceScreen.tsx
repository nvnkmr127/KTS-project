import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  BackHandler,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CalendarDays,
  Users,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Shield,
  GraduationCap,
  Sun,
  Utensils,
  Sparkles,
  PartyPopper,
  Flag,
  Palmtree,
  School,
  Info,
  Lock,
} from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';
import { useAuthStore } from '../../store/useAuthStore';
import {
  ALL_BATCHES,
  getStudentsForClass,
  StudentItem,
  useStudentAttendanceStore,
  StudentPeriodAttendance,
} from '../../store/studentAttendanceStore';
import { DEFAULT_HOLIDAYS, HolidayItem } from './TeacherHolidayCalendarScreen';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TeacherAllotAttendanceScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isSmallPhone, isTablet, tabBarBottomPadding, headerPaddingTop } = useResponsive();
  const { user } = useAuthStore();
  const { records, loadRecords, saveRecords } = useStudentAttendanceStore();

  const handleBack = useCallback(() => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Dashboard');
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBack])
  );

  // Date management: default today
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${parts[2]} ${MONTH_SHORT[mIdx] || parts[1]} ${parts[0]}`;
    }
    return dateStr;
  };

  const [date, setDate] = useState<string>(getTodayDateStr());
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showAcademicYearModal, setShowAcademicYearModal] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026-2027 (Current)');

  // Calendar picker month/year state
  const [calendarMonth, setCalendarMonth] = useState<number>(() => {
    const today = new Date();
    return today.getMonth();
  });
  const [calendarYear, setCalendarYear] = useState<number>(() => {
    const today = new Date();
    return today.getFullYear();
  });

  // Helper: find holiday covering date
  const findHolidayForDate = (dateStr: string): HolidayItem | undefined => {
    return DEFAULT_HOLIDAYS.find((h) => {
      const s = h.startDate || "";
      const e = h.endDate || s;
      return dateStr >= s && dateStr <= e;
    });
  };

  // Month navigation handlers
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

  // Swipe Gesture Responder for Calendar Month Grid (matching Holiday Calendar)
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

  // Calendar Calculation Helpers for Grid (including prev/next month dates)
  const daysInMonthCount = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayWeekdayIndex = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sunday

  const calendarWeeks = useMemo(() => {
    const totalSlots: {
      dayNum: number;
      fullDateStr: string;
      isSunday: boolean;
      isOtherMonth: boolean;
      isPrevMonth?: boolean;
      isNextMonth?: boolean;
    }[] = [];

    // Prev month details
    const prevMonth = calendarMonth === 0 ? 11 : calendarMonth - 1;
    const prevYear = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
    const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();

    // Next month details
    const nextMonth = calendarMonth === 11 ? 0 : calendarMonth + 1;
    const nextYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear;

    // 1. Previous month leading days
    for (let i = firstDayWeekdayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dayOfWeek = (firstDayWeekdayIndex - 1 - i) % 7;
      const mStr = String(prevMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      totalSlots.push({
        dayNum: d,
        fullDateStr: `${prevYear}-${mStr}-${dStr}`,
        isSunday: dayOfWeek === 0,
        isOtherMonth: true,
        isPrevMonth: true,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonthCount; d++) {
      const dayOfWeek = (firstDayWeekdayIndex + d - 1) % 7;
      const mStr = String(calendarMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      totalSlots.push({
        dayNum: d,
        fullDateStr: `${calendarYear}-${mStr}-${dStr}`,
        isSunday: dayOfWeek === 0,
        isOtherMonth: false,
      });
    }

    // 3. Next month trailing days to complete last week
    let nextDayNum = 1;
    while (totalSlots.length % 7 !== 0) {
      const dayOfWeek = totalSlots.length % 7;
      const mStr = String(nextMonth + 1).padStart(2, "0");
      const dStr = String(nextDayNum).padStart(2, "0");
      totalSlots.push({
        dayNum: nextDayNum,
        fullDateStr: `${nextYear}-${mStr}-${dStr}`,
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
  }, [calendarYear, calendarMonth, firstDayWeekdayIndex, daysInMonthCount]);

  // Classes & Session state
  const allowedClasses = ['Class 4B', 'Class 3A', 'Class 8A', 'Class 10A'];
  const [selectedClass, setSelectedClass] = useState<string>('Class 4B');
  const [showClassDropdownModal, setShowClassDropdownModal] = useState(false);

  const [session, setSession] = useState<'first_period' | 'lunch_period'>('first_period');
  const [showSessionDropdownModal, setShowSessionDropdownModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusMap, setStatusMap] = useState<Record<string, 'present' | 'absent'>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [isAutoAllotted, setIsAutoAllotted] = useState(false);
  const [isFacultySubmitted, setIsFacultySubmitted] = useState(false);
  const [facultyWhoSubmitted, setFacultyWhoSubmitted] = useState('');

  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load records from store on mount
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Students for selected class
  const classStudents = useMemo(() => {
    return getStudentsForClass(selectedClass);
  }, [selectedClass]);

  // Day of week
  const dayOfWeek = useMemo(() => {
    const d = new Date(date + 'T00:00:00');
    return DAY_NAMES[d.getDay()] || 'Tuesday';
  }, [date]);

  // Determine allowed sessions for teacher
  const isClassTeacher = selectedClass === 'Class 4B' || selectedClass === 'Class 8A';
  const teachesAfterLunch = selectedClass === 'Class 3A' || selectedClass === 'Class 4B';

  useEffect(() => {
    if (isClassTeacher && !teachesAfterLunch) {
      setSession('first_period');
    } else if (!isClassTeacher && teachesAfterLunch) {
      setSession('lunch_period');
    }
  }, [selectedClass, isClassTeacher, teachesAfterLunch]);

  // Load existing records for selected class, date, and session
  useEffect(() => {
    if (!selectedClass || !date || !session) return;

    const initialMap: Record<string, 'present' | 'absent'> = {};
    classStudents.forEach(s => {
      initialMap[s.id] = 'present';
    });

    const matching = records.filter(
      r => r.className.toLowerCase() === selectedClass.toLowerCase() &&
        r.session === session &&
        r.date === date
    );

    if (matching.length > 0) {
      matching.forEach(r => {
        initialMap[r.studentId] = r.status;
      });
      setStatusMap(initialMap);

      const isAuto = matching.some(r => r.autoAllotted);
      if (isAuto) {
        setIsAutoAllotted(true);
        setIsLocked(false);
        setIsFacultySubmitted(false);
      } else {
        setIsAutoAllotted(false);
        setIsLocked(true);
        setIsFacultySubmitted(true);
        setFacultyWhoSubmitted(matching[0]?.markedBy || 'Teacher');
      }
    } else {
      setStatusMap(initialMap);
      setIsLocked(false);
      setIsAutoAllotted(false);
      setIsFacultySubmitted(false);
      setFacultyWhoSubmitted('');
    }
  }, [selectedClass, date, session, records, classStudents]);

  // Toggle student status
  const toggleStudentStatus = (studentId: string) => {
    if (isLocked) return;
    setStatusMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  };

  const markAll = (status: 'present' | 'absent') => {
    if (isLocked) return;
    const updated: Record<string, 'present' | 'absent'> = {};
    classStudents.forEach(s => {
      updated[s.id] = status;
    });
    setStatusMap(updated);
  };

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents;
    const q = searchQuery.toLowerCase().trim();
    return classStudents.filter(
      s => s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q)
    );
  }, [classStudents, searchQuery]);

  const presentCount = useMemo(() => {
    return classStudents.filter(s => (statusMap[s.id] || 'present') === 'present').length;
  }, [classStudents, statusMap]);

  const absentCount = useMemo(() => {
    return classStudents.filter(s => statusMap[s.id] === 'absent').length;
  }, [classStudents, statusMap]);

  // Submit Handler
  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setSaving(true);
    try {
      const timestamp = new Date().toISOString();
      const teacherName = user?.name || 'Sheeren Sultana (Teacher)';

      const newEntries: StudentPeriodAttendance[] = classStudents.map(s => ({
        studentId: s.id,
        studentName: s.name,
        roll: s.roll,
        className: selectedClass,
        date: date,
        session: session,
        status: statusMap[s.id] || 'present',
        markedBy: teacherName,
        markedById: user?.id || '1',
        markedAt: timestamp,
      }));

      const otherRecords = records.filter(
        r => !(r.className.toLowerCase() === selectedClass.toLowerCase() &&
          r.session === session &&
          r.date === date)
      );

      const updated = [...otherRecords, ...newEntries];
      await saveRecords(updated);

      setIsLocked(true);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.log('Error submitting attendance:', err);
    } finally {
      setSaving(false);
    }
  };

  // Date selection helper (Future dates strictly disabled)
  const isFutureDateStr = (dateStr: string) => {
    const today = getTodayDateStr();
    return dateStr > today;
  };

  const handleSelectDate = (fullDateStr: string) => {
    if (isFutureDateStr(fullDateStr)) return;
    setDate(fullDateStr);
    setShowDatePickerModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Background Deep Gradient (Matching Examination Screen) */}
      <LinearGradient
        colors={["#22143d", "#150d26", "#0b0912", "#08070d"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER WITH LEFT ARROW & ACADEMIC YEAR DROPDOWN */}
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={20} color="#ddb7ff" />
            </Pressable>

            <View style={styles.headerTitleGroup}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitleText} numberOfLines={1}>
                  Allot Attendance
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

      {/* MAIN SCROLLABLE BODY */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(tabBarBottomPadding + 40, 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* PURPLE HERO BANNER */}
        <View style={styles.heroBanner}>
          <LinearGradient
            colors={['#581c87', '#6b21a8', '#4c1d95']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroBackgroundIcon}>
            <Users size={80} color="rgba(255,255,255,0.08)" />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroSubtitle}>TEACHER PORTAL</Text>
            <Text style={styles.heroTitle}>Student Attendance Allotment</Text>
            <Text style={styles.heroDesc}>
              Mark daily attendance for your class-teacher sections and lunch break periods.
            </Text>
          </View>
        </View>

        {/* FILTERS PANEL */}
        <View style={styles.card}>
          {/* Date Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <CalendarIcon size={11} color="#cfc2d6" style={{ marginRight: 4 }} /> DATE
            </Text>
            <Pressable
              onPress={() => setShowDatePickerModal(true)}
              style={styles.inputBox}
            >
              <Text style={styles.inputBoxText}>{formatDateDisplay(date)}</Text>
              <CalendarIcon size={14} color="#ddb7ff" />
            </Pressable>
          </View>

          {/* Class / Section Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Users size={11} color="#cfc2d6" style={{ marginRight: 4 }} /> CLASS / SECTION
            </Text>
            <Pressable
              onPress={() => setShowClassDropdownModal(true)}
              style={styles.inputBox}
            >
              <Text style={styles.inputBoxText}>{selectedClass}</Text>
              <ChevronDown size={14} color="#ddb7ff" />
            </Pressable>
          </View>

          {/* Session / Attendance Type Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Clock size={11} color="#cfc2d6" style={{ marginRight: 4 }} /> SESSION / ATTENDANCE TYPE
            </Text>
            <Pressable
              onPress={() => setShowSessionDropdownModal(true)}
              style={styles.inputBox}
            >
              <Text style={styles.inputBoxText} numberOfLines={1}>
                {session === 'first_period'
                  ? 'Morning (1st Period - Class Teacher/Substitute)'
                  : 'Afternoon (1st Period After Lunch - Teacher/Substitute)'}
              </Text>
              <ChevronDown size={14} color="#ddb7ff" />
            </Pressable>
          </View>

          {/* Student Search */}
          <View style={[styles.inputGroup, { marginBottom: 0 }]}>
            <View style={styles.searchBox}>
              <Search size={14} color="#a1a1aa" style={{ marginRight: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search student name/roll..."
                placeholderTextColor="#71717a"
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X size={14} color="#a1a1aa" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Warning if not eligible */}
          {!isClassTeacher && !teachesAfterLunch && (
            <View style={styles.warningBox}>
              <AlertCircle size={14} color="#f59e0b" style={{ marginRight: 6 }} />
              <Text style={styles.warningBoxText}>
                You do not teach the lunch period slot nor are you the class teacher (or substitute) for {selectedClass} on {dayOfWeek}s.
              </Text>
            </View>
          )}
        </View>

        {/* STATUS NOTICES */}
        {isAutoAllotted ? (
          <View style={styles.infoBannerBlue}>
            <AlertCircle size={16} color="#38bdf8" style={{ marginRight: 8 }} />
            <Text style={styles.infoBannerBlueText}>
              Afternoon attendance for <Text style={{ fontWeight: 'bold' }}>{selectedClass}</Text> on <Text style={{ fontWeight: 'bold' }}>{formatDateDisplay(date)}</Text> was <Text style={{ fontWeight: 'bold' }}>auto-allotted from morning attendance</Text>. You can adjust and re-submit below.
            </Text>
          </View>
        ) : isLocked ? (
          <View style={styles.infoBannerGreen}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <CheckCircle2 size={16} color="#34d399" style={{ marginRight: 8 }} />
              <Text style={styles.infoBannerGreenText}>
                Attendance is submitted &amp; locked for this session ({facultyWhoSubmitted || 'Submitted'}).
              </Text>
            </View>
            <Pressable
              onPress={() => setIsLocked(false)}
              style={styles.reopenButton}
            >
              <Text style={styles.reopenButtonText}>Edit / Re-open</Text>
            </Pressable>
          </View>
        ) : null}

        {/* ATTENDANCE LIST CARD */}
        <View style={styles.card}>
          {/* List Header & Bulk Actions */}
          <View style={styles.listHeaderRow}>
            <View style={styles.listTitleGroup}>
              <Text style={styles.listTitleText}>
                {selectedClass} Attendance List
              </Text>
              <View style={styles.badgesRow}>
                <View style={styles.presentBadge}>
                  <Text style={styles.presentBadgeText}>{presentCount} Present</Text>
                </View>
                <View style={styles.absentBadge}>
                  <Text style={styles.absentBadgeText}>{absentCount} Absent</Text>
                </View>
              </View>
            </View>

            <View style={styles.bulkActionsRow}>
              <Pressable
                onPress={() => markAll('present')}
                disabled={isLocked}
                style={[styles.bulkButton, isLocked && { opacity: 0.5 }]}
              >
                <Text style={styles.bulkButtonText}>Mark All Present</Text>
              </Pressable>
              <Pressable
                onPress={() => markAll('absent')}
                disabled={isLocked}
                style={[styles.bulkButton, isLocked && { opacity: 0.5 }]}
              >
                <Text style={styles.bulkButtonText}>Mark All Absent</Text>
              </Pressable>
            </View>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderText, { width: 44 }]}>Init</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, paddingLeft: 6 }]}>Student Name</Text>
            <Text style={[styles.tableHeaderText, { width: 95, textAlign: 'left' }]}>Roll No</Text>
            <Text style={[styles.tableHeaderText, { width: 85, textAlign: 'center' }]}>Status</Text>
          </View>

          {/* Student Rows */}
          {filteredStudents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No students found matching search.</Text>
            </View>
          ) : (
            filteredStudents.map((student, index) => {
              const isPresent = (statusMap[student.id] || 'present') === 'present';
              return (
                <View
                  key={student.id}
                  style={[
                    styles.studentRow,
                    index === filteredStudents.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  {/* Init Badge */}
                  <View
                    style={[
                      styles.avatarBadge,
                      {
                        backgroundColor: isPresent
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(239, 68, 68, 0.15)',
                        borderColor: isPresent
                          ? 'rgba(16, 185, 129, 0.3)'
                          : 'rgba(239, 68, 68, 0.3)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarBadgeText,
                        { color: isPresent ? '#34d399' : '#f87171' },
                      ]}
                    >
                      {student.init}
                    </Text>
                  </View>

                  {/* Student Name */}
                  <View style={styles.studentNameContainer}>
                    <Text style={styles.studentNameText} numberOfLines={1}>
                      {student.name}
                    </Text>
                  </View>

                  {/* Roll No */}
                  <Text style={styles.studentRollText} numberOfLines={1}>
                    {student.roll}
                  </Text>

                  {/* Status Toggle Button */}
                  <Pressable
                    onPress={() => toggleStudentStatus(student.id)}
                    disabled={isLocked}
                    style={[
                      styles.statusToggleBtn,
                      isPresent ? styles.statusBtnPresent : styles.statusBtnAbsent,
                      isLocked && { opacity: 0.7 },
                    ]}
                  >
                    {isPresent ? (
                      <Check size={12} color="#34d399" style={{ marginRight: 4 }} strokeWidth={2.5} />
                    ) : (
                      <X size={12} color="#f87171" style={{ marginRight: 4 }} strokeWidth={2.5} />
                    )}
                    <Text
                      style={[
                        styles.statusToggleText,
                        { color: isPresent ? '#34d399' : '#f87171' },
                      ]}
                    >
                      {isPresent ? 'Present' : 'Absent'}
                    </Text>
                  </Pressable>
                </View>
              );
            })
          )}

          {/* Submit Footer */}
          <View style={styles.submitFooter}>
            {showSuccessToast && (
              <View style={styles.toastRow}>
                <CheckCircle2 size={14} color="#34d399" style={{ marginRight: 4 }} />
                <Text style={styles.toastText}>
                  Attendance saved and synced successfully!
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => setShowConfirmModal(true)}
              disabled={saving || classStudents.length === 0 || isLocked}
              style={[
                styles.submitButton,
                (saving || classStudents.length === 0 || isLocked) && { opacity: 0.45 },
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
              ) : (
                <Save size={16} color="#ffffff" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.submitButtonText}>
                {saving ? 'Submitting...' : 'Submit Attendance'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* CONFIRMATION SUBMISSION MODAL */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalBox}>
            <LinearGradient
              colors={['#581c87', '#6b21a8']}
              style={styles.confirmModalHeader}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Users size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.confirmModalTitle}>Confirm Attendance</Text>
              </View>
              <Pressable onPress={() => setShowConfirmModal(false)}>
                <X size={18} color="#ffffff" />
              </Pressable>
            </LinearGradient>

            <View style={styles.confirmModalBody}>
              <Text style={styles.confirmModalDesc}>
                You are about to submit attendance for{' '}
                <Text style={{ fontWeight: 'bold', color: '#ffffff' }}>{selectedClass}</Text> (
                {session === 'first_period' ? 'Morning' : 'Afternoon'}) on{' '}
                <Text style={{ fontWeight: 'bold', color: '#ffffff' }}>{formatDateDisplay(date)}</Text>.
              </Text>

              <View style={styles.confirmStatsRow}>
                <View style={styles.confirmStatCardPresent}>
                  <Text style={styles.confirmStatLabelPresent}>PRESENT</Text>
                  <Text style={styles.confirmStatValuePresent}>{presentCount}</Text>
                  <Text style={styles.confirmStatSub}>Students</Text>
                </View>

                <View style={styles.confirmStatCardAbsent}>
                  <Text style={styles.confirmStatLabelAbsent}>ABSENT</Text>
                  <Text style={styles.confirmStatValueAbsent}>{absentCount}</Text>
                  <Text style={styles.confirmStatSub}>Students</Text>
                </View>
              </View>

              <View style={styles.confirmNoticeBox}>
                <AlertCircle size={14} color="#38bdf8" style={{ marginRight: 6, marginTop: 2 }} />
                <Text style={styles.confirmNoticeText}>
                  Once submitted, stats will sync to dashboards immediately.
                </Text>
              </View>

              <View style={styles.confirmBtnRow}>
                <Pressable
                  onPress={() => setShowConfirmModal(false)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmSubmit}
                  style={styles.confirmSubmitBtn}
                >
                  <Save size={14} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmSubmitBtnText}>Confirm &amp; Submit</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* DATE PICKER MODAL (HOLIDAY CALENDAR STYLE WITH SWIPE & PAST HOLIDAYS) */}
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
                      const isSelected = date === fullDateStr;
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
                            disabled={isFuture}
                            style={[
                              styles.calendarDayCard,
                              isOtherMonth && {
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                borderColor: 'rgba(255, 255, 255, 0.04)',
                                opacity: 0.5,
                              },
                              !isOtherMonth && isSunday && styles.calendarSundayCard,
                              !isOtherMonth && holidayOnDay && !isFuture && styles.calendarHolidayCard,
                              isSelected && styles.calendarSelectedCard,
                              isFuture && styles.calendarFutureCard,
                            ]}
                          >
                            {/* Day Number and Top Indicator */}
                            <View style={styles.calendarDayHeaderRow}>
                              <Text
                                style={[
                                  styles.calendarDayNumText,
                                  isOtherMonth && { color: '#71717a', fontWeight: '600' },
                                  !isOtherMonth && isSunday && { color: '#fb7185' },
                                  !isOtherMonth && holidayOnDay && !isFuture && { color: holidayOnDay.color || '#ddb7ff' },
                                  isSelected && { color: '#ffffff', fontWeight: '900' },
                                  isFuture && { color: '#52525b' },
                                ]}
                              >
                                {dayNum}
                              </Text>

                              {holidayOnDay && !isFuture && !isOtherMonth ? (
                                <View
                                  style={[
                                    styles.calendarHolidayDot,
                                    { backgroundColor: holidayOnDay.color || '#ddb7ff' },
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
                            ) : !isOtherMonth && isSunday ? (
                              <View style={styles.calendarSunBadge}>
                                <Text style={styles.calendarSunBadgeText} numberOfLines={1}>
                                  SUN
                                </Text>
                              </View>
                            ) : !isOtherMonth && holidayOnDay && !isFuture ? (
                              <View
                                style={[
                                  styles.calendarHolBadge,
                                  { backgroundColor: holidayOnDay.color || '#ddb7ff' },
                                ]}
                              >
                                <Text
                                  style={styles.calendarHolBadgeText}
                                  numberOfLines={1}
                                >
                                  {holidayOnDay.title.split(' ')[0] || 'HOL'}
                                </Text>
                              </View>
                            ) : !isOtherMonth && isToday ? (
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
                <Text style={styles.legendText}>Holiday</Text>
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
                  const todayStr = getTodayDateStr();
                  setDate(todayStr);
                  const now = new Date();
                  setCalendarMonth(now.getMonth());
                  setCalendarYear(now.getFullYear());
                  setShowDatePickerModal(false);
                }}
                style={styles.todayQuickBtn}
              >
                <Text style={styles.todayQuickBtnText}>Select Today ({formatDateDisplay(getTodayDateStr())})</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CLASS SELECT MODAL */}
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
          <Pressable style={styles.dropdownModalBox} onPress={e => e.stopPropagation()}>
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

            <View style={styles.dropdownOptionsList}>
              {allowedClasses.map(cls => {
                const isSelected = selectedClass === cls;
                const isCT = cls === 'Class 4B' || cls === 'Class 8A';
                return (
                  <Pressable
                    key={cls}
                    onPress={() => {
                      setSelectedClass(cls);
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
                          {cls.replace('Class ', '')}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.dropdownOptionTitle,
                            isSelected && styles.dropdownOptionTitleActive,
                          ]}
                        >
                          {cls}
                        </Text>
                        <Text style={styles.dropdownOptionDesc}>
                          {isCT ? 'Class Teacher Assigned' : 'Lunch Slot Subject Teacher'}
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

      {/* SESSION SELECT MODAL */}
      <Modal
        visible={showSessionDropdownModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSessionDropdownModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSessionDropdownModal(false)}
        >
          <Pressable style={styles.dropdownModalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.dropdownModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={styles.dropdownHeaderIconBox}>
                  <Clock size={18} color="#ddb7ff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dropdownModalTitle}>Attendance Session</Text>
                  <Text style={styles.dropdownModalSubtitle}>
                    Select time period for marking attendance
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setShowSessionDropdownModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color="#ddb7ff" />
              </Pressable>
            </View>

            <View style={styles.dropdownOptionsList}>
              {/* Morning Session */}
              <Pressable
                onPress={() => {
                  setSession('first_period');
                  setShowSessionDropdownModal(false);
                }}
                style={[
                  styles.dropdownOptionCard,
                  session === 'first_period' && styles.dropdownOptionCardActive,
                ]}
              >
                <View style={styles.dropdownOptionLeft}>
                  <View
                    style={[
                      styles.sessionIconBox,
                      session === 'first_period' && styles.sessionIconBoxActive,
                    ]}
                  >
                    <Sun size={18} color={session === 'first_period' ? '#fbbf24' : '#a1a1aa'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        style={[
                          styles.dropdownOptionTitle,
                          session === 'first_period' && styles.dropdownOptionTitleActive,
                        ]}
                      >
                        Morning Session
                      </Text>
                      <View style={styles.periodPill}>
                        <Text style={styles.periodPillText}>1st Period</Text>
                      </View>
                    </View>
                    <Text style={styles.dropdownOptionDesc}>
                      Marked in morning 1st period by Class Teacher
                    </Text>
                  </View>
                </View>

                {session === 'first_period' ? (
                  <View style={styles.activeCheckCircle}>
                    <Check size={14} color="#ffffff" strokeWidth={3} />
                  </View>
                ) : (
                  <View style={styles.inactiveRadioCircle} />
                )}
              </Pressable>

              {/* Afternoon Session */}
              <Pressable
                onPress={() => {
                  setSession('lunch_period');
                  setShowSessionDropdownModal(false);
                }}
                style={[
                  styles.dropdownOptionCard,
                  session === 'lunch_period' && styles.dropdownOptionCardActive,
                ]}
              >
                <View style={styles.dropdownOptionLeft}>
                  <View
                    style={[
                      styles.sessionIconBox,
                      session === 'lunch_period' && styles.sessionIconBoxActive,
                    ]}
                  >
                    <Utensils size={18} color={session === 'lunch_period' ? '#38bdf8' : '#a1a1aa'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        style={[
                          styles.dropdownOptionTitle,
                          session === 'lunch_period' && styles.dropdownOptionTitleActive,
                        ]}
                      >
                        Afternoon Session
                      </Text>
                      <View style={styles.periodPill}>
                        <Text style={styles.periodPillText}>After Lunch</Text>
                      </View>
                    </View>
                    <Text style={styles.dropdownOptionDesc}>
                      Marked 1st period after lunch by assigned teacher
                    </Text>
                  </View>
                </View>

                {session === 'lunch_period' ? (
                  <View style={styles.activeCheckCircle}>
                    <Check size={14} color="#ffffff" strokeWidth={3} />
                  </View>
                ) : (
                  <View style={styles.inactiveRadioCircle} />
                )}
              </Pressable>
            </View>
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
          <Pressable style={styles.dropdownModalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.dropdownModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={styles.dropdownHeaderIconBox}>
                  <Sparkles size={18} color="#ddb7ff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dropdownModalTitle}>Select Academic Year</Text>
                  <Text style={styles.dropdownModalSubtitle}>
                    Active session curriculum cycle
                  </Text>
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
              {['2026-2027 (Current)', '2025-2026', '2024-2025'].map(yr => {
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
  card: {
    backgroundColor: '#16151f',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 14,
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
  searchBox: {
    backgroundColor: '#1e1b29',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    color: '#ffffff',
    fontSize: 12,
    flex: 1,
    padding: 0,
  },
  warningBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningBoxText: {
    color: '#fbbf24',
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  infoBannerBlue: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoBannerBlueText: {
    color: '#7dd3fc',
    fontSize: 11.5,
    flex: 1,
    lineHeight: 16,
  },
  infoBannerGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoBannerGreenText: {
    color: '#6ee7b7',
    fontSize: 11.5,
    lineHeight: 15,
  },
  reopenButton: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reopenButtonText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  listHeaderRow: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 12,
  },
  listTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  listTitleText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presentBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  presentBadgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  absentBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  absentBadgeText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
  bulkActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkButton: {
    flex: 1,
    backgroundColor: '#1e1b29',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkButtonText: {
    color: '#cfc2d6',
    fontSize: 11.5,
    fontWeight: '600',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tableHeaderText: {
    color: '#a1a1aa',
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  studentNameContainer: {
    flex: 1,
    marginRight: 6,
  },
  studentNameText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  studentRollText: {
    width: 95,
    color: '#a1a1aa',
    fontSize: 10.5,
    fontFamily: 'monospace',
  },
  statusToggleBtn: {
    width: 88,
    paddingVertical: 6.5,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnPresent: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: 'rgba(16, 185, 129, 0.38)',
  },
  statusBtnAbsent: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderColor: 'rgba(239, 68, 68, 0.38)',
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 12,
  },
  submitFooter: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  toastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'center',
  },
  toastText: {
    color: '#34d399',
    fontSize: 11.5,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#181622',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmModalHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmModalTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  confirmModalBody: {
    padding: 16,
  },
  confirmModalDesc: {
    color: '#cfc2d6',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  confirmStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  confirmStatCardPresent: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  confirmStatLabelPresent: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  confirmStatValuePresent: {
    color: '#34d399',
    fontSize: 22,
    fontWeight: '900',
  },
  confirmStatCardAbsent: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  confirmStatLabelAbsent: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  confirmStatValueAbsent: {
    color: '#f87171',
    fontSize: 22,
    fontWeight: '900',
  },
  confirmStatSub: {
    color: '#71717a',
    fontSize: 9.5,
  },
  confirmNoticeBox: {
    backgroundColor: '#1e1b29',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  confirmNoticeText: {
    color: '#a1a1aa',
    fontSize: 10.5,
    flex: 1,
    lineHeight: 14,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#272436',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  confirmSubmitBtn: {
    flex: 1.3,
    backgroundColor: '#6b21a8',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSubmitBtnText: {
    color: '#ffffff',
    fontSize: 12,
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
    width: 34,
    height: 34,
    borderRadius: 10,
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
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
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
  calendarEmptyBox: {
    width: '100%',
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
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
  sessionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sessionIconBoxActive: {
    backgroundColor: 'rgba(221, 183, 255, 0.18)',
    borderWidth: 1,
    borderColor: '#ddb7ff',
  },
  periodPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginLeft: 6,
  },
  periodPillText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 9.5,
    fontWeight: '700',
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
    borderRadius: 6,
    marginLeft: 6,
  },
  activePillText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '900',
  },
});
