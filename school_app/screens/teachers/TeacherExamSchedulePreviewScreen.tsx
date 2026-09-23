import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  ArrowLeft,
  BookOpen,
  BarChart2,
  Award,
  TrendingUp,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  CalendarOff,
} from "lucide-react-native";
import { useResponsive } from "../../utils/responsive";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const formatToDDMMYYYY = (dateStr: string): string => {
  if (!dateStr) return "";
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, yyyy, mm, dd] = match;
    return `${dd}-${mm}-${yyyy}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  return dateStr;
};

interface ExamScheduleEntry {
  subject: string;
  time: string;
  duration: string;
  maxMarks: number;
}

type ClassExamSchedule = {
  [dateStr: string]: ExamScheduleEntry[];
};

interface PreviewExam {
  id: string;
  name: string;
  classes: string;
  subjects: string;
  date: string;
  maxMarks: number;
  status: "Upcoming" | "Completed" | "Results Published";
}

const DEFAULT_PREVIEW_EXAMS: PreviewExam[] = [
  {
    id: "1",
    name: "FA 1",
    classes: "10A, 9A, 8A, 7A, 6A",
    subjects: "All Subjects",
    date: "01-09-2027",
    maxMarks: 20,
    status: "Results Published",
  },
  {
    id: "2",
    name: "FA 1 PRIMARY",
    classes: "1B, 1A, 2A, 2B, 3A, 3B, 4A, 4B, 5A",
    subjects: "All Subjects",
    date: "01-01-2026",
    maxMarks: 50,
    status: "Completed",
  },
  {
    id: "3",
    name: "Mid-Term Examination 2026",
    classes: "10A, 10B, 9A, 9B, 8A",
    subjects: "Mathematics, Physics, Chemistry, English",
    date: "10-06-2026",
    maxMarks: 100,
    status: "Upcoming",
  },
];

const INITIAL_SCHEDULES_DATA: Record<string, Record<string, ClassExamSchedule>> = {
  // Exam 1: FA 1 (September 2027)
  "1": {
    "10A": {
      "2027-09-01": [
        { subject: "Mathematics", time: "09:30 AM", duration: "1 hr", maxMarks: 20 },
        { subject: "Physics", time: "02:00 PM", duration: "1 hr", maxMarks: 20 },
      ],
      "2027-09-02": [
        { subject: "Chemistry", time: "09:30 AM", duration: "1 hr", maxMarks: 20 },
      ],
      "2027-09-03": [
        { subject: "Telugu", time: "09:30 AM", duration: "1 hr", maxMarks: 20 },
      ],
      "2027-09-04": [
        { subject: "Social Studies", time: "09:30 AM", duration: "1 hr", maxMarks: 20 },
      ],
    },
    "9A": {
      "2027-09-01": [
        { subject: "Mathematics", time: "09:30 AM", duration: "1 hr", maxMarks: 20 },
      ],
      "2027-09-02": [
        { subject: "Science", time: "09:30 AM", duration: "1 hr", maxMarks: 20 },
      ],
    },
    "8A": {
      "2027-09-01": [
        { subject: "Mathematics", time: "09:30 AM", duration: "1 hr", maxMarks: 20 },
      ],
    },
  },

  // Exam 2: FA 1 PRIMARY (January 2026)
  "2": {
    "1A": {
      "2026-01-05": [
        { subject: "English", time: "10:00 AM", duration: "2 hrs", maxMarks: 50 },
      ],
      "2026-01-06": [
        { subject: "Mathematics", time: "10:00 AM", duration: "2 hrs", maxMarks: 50 },
        { subject: "EVS", time: "02:00 PM", duration: "1 hr", maxMarks: 50 },
      ],
    },
    "1B": {
      "2026-01-05": [
        { subject: "English", time: "10:00 AM", duration: "2 hrs", maxMarks: 50 },
      ],
    },
    "2A": {
      "2026-01-05": [
        { subject: "English", time: "10:00 AM", duration: "2 hrs", maxMarks: 50 },
      ],
      "2026-01-06": [
        { subject: "Mathematics", time: "10:00 AM", duration: "2 hrs", maxMarks: 50 },
      ],
    },
  },

  // Exam 3: Mid-Term Examination 2026 (June & October schedules)
  "3": {
    "10A": {
      "2026-06-10": [
        { subject: "Mathematics", time: "10:00 AM", duration: "2 hrs", maxMarks: 100 },
        { subject: "Physics", time: "02:00 PM", duration: "2 hrs", maxMarks: 100 },
      ],
      "2026-06-12": [
        { subject: "Chemistry", time: "10:00 AM", duration: "2 hrs", maxMarks: 100 },
        { subject: "English", time: "02:00 PM", duration: "2 hrs", maxMarks: 100 },
      ],
      "2026-06-15": [
        { subject: "Telugu", time: "10:00 AM", duration: "2 hrs", maxMarks: 100 },
        { subject: "Social Studies", time: "02:00 PM", duration: "2 hrs", maxMarks: 100 },
      ],
      "2026-10-15": [
        { subject: "Mathematics", time: "10:00 AM", duration: "2 hrs", maxMarks: 100 },
        { subject: "Physics", time: "02:00 PM", duration: "2 hrs", maxMarks: 100 },
      ],
      "2026-10-16": [
        { subject: "Chemistry", time: "10:00 AM", duration: "2 hrs", maxMarks: 100 },
        { subject: "English", time: "02:00 PM", duration: "2 hrs", maxMarks: 100 },
      ],
      "2026-10-17": [
        { subject: "Telugu", time: "10:00 AM", duration: "2 hrs", maxMarks: 100 },
        { subject: "Social Studies", time: "02:00 PM", duration: "2 hrs", maxMarks: 100 },
      ],
    },
    "10B": {
      "2026-06-10": [
        { subject: "Mathematics", time: "10:00 AM", duration: "2 hrs", maxMarks: 100 },
      ],
      "2026-06-12": [
        { subject: "Physics", time: "10:00 AM", duration: "2 hrs", maxMarks: 100 },
      ],
      "2026-10-15": [
        { subject: "Mathematics", time: "10:00 AM", duration: "2 hrs", maxMarks: 100 },
      ],
      "2026-10-16": [
        { subject: "Physics", time: "10:00 AM", duration: "2 hrs", maxMarks: 100 },
      ],
    },
    "9A": {
      "2026-06-10": [
        { subject: "Mathematics", time: "10:00 AM", duration: "2 hrs", maxMarks: 50 },
      ],
      "2026-06-11": [
        { subject: "General Science", time: "10:00 AM", duration: "2 hrs", maxMarks: 50 },
      ],
      "2026-10-15": [
        { subject: "Mathematics", time: "10:00 AM", duration: "2 hrs", maxMarks: 50 },
      ],
      "2026-10-16": [
        { subject: "General Science", time: "10:00 AM", duration: "2 hrs", maxMarks: 50 },
      ],
    },
    "8A": {
      "2026-06-10": [
        { subject: "Mathematics", time: "10:00 AM", duration: "2 hrs", maxMarks: 25 },
        { subject: "Science", time: "02:00 PM", duration: "2 hrs", maxMarks: 25 },
      ],
      "2026-06-11": [
        { subject: "English", time: "10:00 AM", duration: "2 hrs", maxMarks: 25 },
      ],
      "2026-06-12": [
        { subject: "Telugu", time: "10:00 AM", duration: "2 hrs", maxMarks: 25 },
        { subject: "Social Studies", time: "02:00 PM", duration: "2 hrs", maxMarks: 25 },
      ],
      "2026-10-15": [
        { subject: "Mathematics", time: "10:00 AM", duration: "2 hrs", maxMarks: 25 },
        { subject: "Science", time: "02:00 PM", duration: "2 hrs", maxMarks: 25 },
      ],
    },
  },

  // Exam 4: Quarterly Assessment 2026 (November 2026)
  "4": {
    "10A": {
      "2026-11-20": [
        { subject: "Mathematics", time: "10:00 AM", duration: "2 hrs", maxMarks: 50 },
      ],
      "2026-11-21": [
        { subject: "Science", time: "10:00 AM", duration: "2 hrs", maxMarks: 50 },
        { subject: "Social", time: "02:00 PM", duration: "2 hrs", maxMarks: 50 },
      ],
    },
    "9A": {
      "2026-11-20": [
        { subject: "Mathematics", time: "10:00 AM", duration: "2 hrs", maxMarks: 50 },
      ],
      "2026-11-21": [
        { subject: "General Science", time: "10:00 AM", duration: "2 hrs", maxMarks: 50 },
      ],
    },
  },
};

export function getScheduleForExam(
  schedules: Record<string, Record<string, ClassExamSchedule>>,
  exam: PreviewExam | null | undefined
): Record<string, ClassExamSchedule> {
  if (!schedules || !exam) return {};
  const idStr = String(exam.id || "").trim();
  const nameStr = String(exam.name || "").trim().toLowerCase();

  if (idStr && schedules[idStr]) return schedules[idStr];

  const cleanDigits = idStr.replace(/\D/g, "");
  if (cleanDigits && schedules[cleanDigits]) return schedules[cleanDigits];

  for (const [k, v] of Object.entries(schedules)) {
    if (k.toLowerCase().trim() === nameStr) return v;
  }

  // Partial name matching
  if (nameStr.includes("fa 1") && schedules["1"]) return schedules["1"];
  if (nameStr.includes("primary") && schedules["2"]) return schedules["2"];
  if (nameStr.includes("mid-term") || nameStr.includes("mid term")) return schedules["3"];
  if (nameStr.includes("quarterly")) return schedules["4"] || schedules["3"];

  return schedules["3"] || {};
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const TeacherExamSchedulePreviewScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { isSmallPhone, headerPaddingTop } = useResponsive();

  // Navigation / Active View State
  const [selectedExam, setSelectedExam] = useState<PreviewExam | null>(() => {
    if (route?.params?.exam) return route.params.exam;
    if (route?.params?.examId) {
      return DEFAULT_PREVIEW_EXAMS.find((e) => String(e.id) === String(route.params.examId)) || null;
    }
    return null;
  });
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (route?.params?.selectedClass) return route.params.selectedClass.replace(/^Class\s*/i, "");
    return "10A";
  });

  // Calendar State
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(5); // 0-indexed: 5 = June
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Sync route params when navigating from Exam Schedule screen
  useEffect(() => {
    if (route?.params?.exam) {
      setSelectedExam(route.params.exam);
      if (route.params.selectedClass) {
        setSelectedClass(route.params.selectedClass.replace(/^Class\s*/i, ""));
      }
    } else if (route?.params?.examId) {
      const found = DEFAULT_PREVIEW_EXAMS.find((e) => String(e.id) === String(route.params.examId));
      if (found) {
        setSelectedExam(found);
      }
    }
  }, [route?.params]);

  // Active class scheduled entries
  const classSchedule = useMemo(() => {
    if (!selectedExam) return {};
    const examSched = getScheduleForExam(INITIAL_SCHEDULES_DATA, selectedExam);
    const cleanClass = selectedClass.replace(/^Class\s*/i, "").trim();
    return examSched[cleanClass] || examSched[selectedClass] || {};
  }, [selectedExam, selectedClass]);

  // Auto sync calendar month/year to the first scheduled date for the active exam/class
  useEffect(() => {
    if (selectedExam) {
      const scheduledDates = Object.keys(classSchedule);
      if (scheduledDates.length > 0) {
        const firstDate = scheduledDates[0];
        let year = currentYear;
        let month = currentMonth;
        if (/^\d{2}-\d{2}-\d{4}$/.test(firstDate)) {
          const [dd, mm, yyyy] = firstDate.split("-");
          year = parseInt(yyyy, 10);
          month = parseInt(mm, 10) - 1;
        } else {
          const match = firstDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
          if (match) {
            year = parseInt(match[1], 10);
            month = parseInt(match[2], 10) - 1;
          }
        }
        setCurrentYear(year);
        setCurrentMonth(month);
        setSelectedCalendarDate(null);
        return;
      }

      if (selectedExam.date) {
        let year = 2026;
        let month = 5;
        if (/^\d{2}-\d{2}-\d{4}$/.test(selectedExam.date)) {
          const [dd, mm, yyyy] = selectedExam.date.split("-");
          year = parseInt(yyyy, 10);
          month = parseInt(mm, 10) - 1;
        } else {
          const match = selectedExam.date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
          if (match) {
            year = parseInt(match[1], 10);
            month = parseInt(match[2], 10) - 1;
          }
        }
        setCurrentYear(year);
        setCurrentMonth(month);
        setSelectedCalendarDate(null);
      }
    }
  }, [selectedExam, classSchedule]);

  // Inbuilt Mobile Back Handler
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (selectedExam !== null) {
          setSelectedExam(null);
          return true;
        }
        navigation.navigate("Examination");
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [selectedExam, navigation])
  );

  // Helper to count scheduled entries for an exam
  const getExamScheduleCount = (examId: string): number => {
    const examSched = INITIAL_SCHEDULES_DATA[examId];
    if (!examSched) return 0;
    return Object.values(examSched).reduce((sum, clsSched) => {
      return (
        sum +
        Object.values(clsSched).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0)
      );
    }, 0);
  };

  // Calendar days generation
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [firstDayOfMonth, daysInMonth]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const totalClassExamsCount = useMemo(() => {
    return Object.values(classSchedule).reduce(
      (sum, entries) => sum + (Array.isArray(entries) ? entries.length : 0),
      0
    );
  }, [classSchedule]);

  const availableClassList = useMemo(() => {
    if (!selectedExam) return [];
    return selectedExam.classes.split(",").map((c) => c.trim().replace(/^Class\s*/i, ""));
  }, [selectedExam]);

  // Filter entries to display in the list (if a calendar date is tapped, show only that date's entries; otherwise show all)
  const entriesToShow = useMemo(() => {
    if (selectedCalendarDate) {
      if (classSchedule[selectedCalendarDate]) {
        return [{ date: selectedCalendarDate, entries: classSchedule[selectedCalendarDate] }];
      }
      const altDate = formatToDDMMYYYY(selectedCalendarDate);
      if (classSchedule[altDate]) {
        return [{ date: selectedCalendarDate, entries: classSchedule[altDate] }];
      }
      return [];
    }
    return Object.entries(classSchedule).map(([date, entries]) => ({
      date,
      entries,
    }));
  }, [classSchedule, selectedCalendarDate]);

  return (
    <View style={styles.container}>
      {/* Background Deep Gradient */}
      <LinearGradient
        colors={["#22143d", "#150d26", "#0b0912", "#08070d"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={40} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <Pressable
                onPress={() => {
                  if (selectedExam !== null) {
                    setSelectedExam(null);
                  } else {
                    navigation.navigate("Examination");
                  }
                }}
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center mr-3 active:bg-white/20"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color="#ddb7ff" />
              </Pressable>
              <View className="flex-1">
                <Text className="text-white text-lg md:text-xl font-extrabold" numberOfLines={1}>
                  Schedule Preview
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <View className="w-2 h-2 rounded-full bg-[#00f1a1] mr-1.5" />
                  <Text className="text-[#ddb7ff] text-xs font-semibold">
                    Academic Year: 2026-2027 (Current)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 95,
          paddingHorizontal: 16,
          paddingTop: 16,
        }}
      >
        {/* ========================================================= */}
        {/* STATE 1: EXAM LIST SELECTION SCREEN */}
        {/* ========================================================= */}
        {!selectedExam && (
          <View>
            {/* 4 KPI CARDS */}
            <View className="flex-row flex-wrap justify-between mb-4" style={{ gap: 10 }}>
              <View className="w-[48%] bg-[#181524] border border-white/10 rounded-2xl p-3.5 shadow-md relative overflow-hidden">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white/60 text-[11px] font-bold">Upcoming Exams</Text>
                  <View className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 items-center justify-center">
                    <BookOpen size={16} color="#38bdf8" />
                  </View>
                </View>
                <Text className="text-white text-2xl font-black">0</Text>
                <Text className="text-white/40 text-[10px] font-medium mt-0.5">This month</Text>
              </View>

              <View className="w-[48%] bg-[#181524] border border-white/10 rounded-2xl p-3.5 shadow-md relative overflow-hidden">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white/60 text-[11px] font-bold">Class Average</Text>
                  <View className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center">
                    <BarChart2 size={16} color="#34d399" />
                  </View>
                </View>
                <Text className="text-white text-2xl font-black">0.0%</Text>
                <Text className="text-white/40 text-[10px] font-medium mt-0.5">Class 10A • Selected Exam</Text>
              </View>

              <View className="w-[48%] bg-[#181524] border border-white/10 rounded-2xl p-3.5 shadow-md relative overflow-hidden">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white/60 text-[11px] font-bold">Top Score</Text>
                  <View className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 items-center justify-center">
                    <Award size={16} color="#ddb7ff" />
                  </View>
                </View>
                <Text className="text-white text-2xl font-black">0.0%</Text>
                <Text className="text-white/40 text-[10px] font-medium mt-0.5">No score yet</Text>
              </View>

              <View className="w-[48%] bg-[#181524] border border-white/10 rounded-2xl p-3.5 shadow-md relative overflow-hidden">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white/60 text-[11px] font-bold">Results Published</Text>
                  <View className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 items-center justify-center">
                    <TrendingUp size={16} color="#facc15" />
                  </View>
                </View>
                <Text className="text-white text-2xl font-black">1</Text>
                <Text className="text-white/40 text-[10px] font-medium mt-0.5">Exams</Text>
              </View>
            </View>

            {/* SECTION HEADING */}
            <View className="mb-3 px-1">
              <Text className="text-white text-base font-extrabold">
                Select an Exam to preview its schedule
              </Text>
            </View>

            {/* EXAM CARDS GRID */}
            <View style={{ gap: 12 }}>
              {DEFAULT_PREVIEW_EXAMS.map((exam) => {
                const totalEntries = getExamScheduleCount(exam.id);
                const isScheduled = totalEntries > 0;

                return (
                  <Pressable
                    key={exam.id}
                    onPress={() => setSelectedExam(exam)}
                    className="bg-[#181524] border border-white/10 rounded-2xl p-4 active:bg-white/10 active:border-[#ddb7ff]/40 shadow-lg relative overflow-hidden"
                    style={{ borderRadius: 16 }}
                  >
                    <View className="flex-row items-start justify-between mb-2.5">
                      <Text className="text-white text-base font-black flex-1 mr-2">
                        {exam.name}
                      </Text>
                      <View
                        className={`px-2.5 py-0.5 rounded-full border ${
                          isScheduled
                            ? "bg-emerald-500/20 border-emerald-500/40"
                            : "bg-white/5 border-white/15"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-black ${
                            isScheduled ? "text-emerald-300" : "text-white/50"
                          }`}
                        >
                          {isScheduled ? "Scheduled" : "Not Scheduled"}
                        </Text>
                      </View>
                    </View>

                    <View className="bg-black/30 rounded-xl p-2.5 mb-3" style={{ gap: 4 }}>
                      <Text className="text-white/50 text-xs">
                        <Text className="text-white/80 font-bold">Classes: </Text>
                        {exam.classes}
                      </Text>
                      <Text className="text-white/50 text-xs">
                        <Text className="text-white/80 font-bold">Subject: </Text>
                        {exam.subjects}
                      </Text>
                      <Text className="text-white/50 text-xs">
                        <Text className="text-white/80 font-bold">Date: </Text>
                        {formatToDDMMYYYY(exam.date)}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between pt-2 border-t border-white/10">
                      <Text className="text-white/50 text-xs font-semibold">
                        {totalEntries} entries scheduled
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-[#38bdf8] text-xs font-extrabold mr-1">
                          View Schedule →
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* STATE 2: DETAILED SCHEDULE PREVIEW FOR SELECTED EXAM */}
        {/* ========================================================= */}
        {selectedExam && (
          <View>
            {/* Back to Exam List Action Bar */}
            <View className="flex-row items-center justify-between mb-3">
              <Pressable
                onPress={() => setSelectedExam(null)}
                className="flex-row items-center bg-[#181524] border border-white/10 px-3 py-1.5 rounded-xl active:bg-white/10"
              >
                <ArrowLeft size={14} color="#ddb7ff" style={{ marginRight: 6 }} />
                <Text className="text-[#ddb7ff] text-xs font-bold">Back to Exam List</Text>
              </Pressable>
              <View className="bg-[#ddb7ff]/15 px-2.5 py-1 rounded-full border border-[#ddb7ff]/30">
                <Text className="text-[#ddb7ff] text-[11px] font-black">
                  {totalClassExamsCount} exams scheduled
                </Text>
              </View>
            </View>

            {/* Top Bar with Exam Name and Class Pills */}
            <View className="bg-[#181524] border border-white/10 rounded-2xl p-4 mb-4 shadow-lg">
              <View className="mb-3">
                <Text className="text-white text-base font-black" numberOfLines={1}>
                  Exam Schedule Preview — {selectedExam.name}
                </Text>
                <Text className="text-white/50 text-[11px] font-medium mt-0.5">
                  Start Date: {formatToDDMMYYYY(selectedExam.date)}
                </Text>
              </View>

              {/* Class Filter Selector Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {availableClassList.map((c) => {
                  const isSelected = selectedClass === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => {
                        setSelectedClass(c);
                        setSelectedCalendarDate(null);
                      }}
                      className={`px-4 py-2 rounded-xl border items-center justify-center ${
                        isSelected
                          ? "bg-[#38bdf8] border-[#38bdf8] shadow-md shadow-[#38bdf8]/30"
                          : "bg-white/5 border-white/10 active:bg-white/10"
                      }`}
                    >
                      <Text
                        className={`text-xs font-black ${
                          isSelected ? "text-black" : "text-white/80"
                        }`}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* CALENDAR MODULE */}
            <View className="bg-[#181524] border border-white/10 rounded-3xl p-4 mb-4 shadow-xl">
              {/* Calendar Month Header */}
              <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-white/10">
                <Pressable
                  onPress={prevMonth}
                  className="w-8 h-8 rounded-lg bg-white/5 items-center justify-center active:bg-white/15"
                >
                  <ChevronLeft size={18} color="#ddb7ff" />
                </Pressable>

                <Text className="text-white font-black text-sm md:text-base">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </Text>

                <Pressable
                  onPress={nextMonth}
                  className="w-8 h-8 rounded-lg bg-white/5 items-center justify-center active:bg-white/15"
                >
                  <ChevronRight size={18} color="#ddb7ff" />
                </Pressable>
              </View>

              {/* Day of Week Headers */}
              <View className="flex-row justify-between mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
                  <View key={dayName} className="flex-1 items-center justify-center">
                    <Text className="text-white/40 text-[11px] font-black">{dayName}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Days Matrix with Perfect Circles & Dynamic Dots */}
              <View className="flex-row flex-wrap">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <View key={`empty-${idx}`} className="w-[14.28%] h-12" />;
                  }

                  const isoDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const ddmmyyyyDateStr = `${String(day).padStart(2, "0")}-${String(currentMonth + 1).padStart(2, "0")}-${currentYear}`;
                  const shortIsoStr = `${currentYear}-${currentMonth + 1}-${day}`;

                  let dayExams = classSchedule[isoDateStr] || classSchedule[ddmmyyyyDateStr] || classSchedule[shortIsoStr] || [];
                  if (dayExams.length === 0) {
                    for (const [k, v] of Object.entries(classSchedule)) {
                      if (k === isoDateStr || k === ddmmyyyyDateStr || formatToDDMMYYYY(k) === ddmmyyyyDateStr) {
                        dayExams = v;
                        break;
                      }
                    }
                  }

                  const examCount = dayExams.length;
                  const hasExam = examCount > 0;
                  const isSelectedDate =
                    selectedCalendarDate === isoDateStr ||
                    selectedCalendarDate === ddmmyyyyDateStr;

                  return (
                    <Pressable
                      key={`day-${day}`}
                      onPress={() => {
                        if (isSelectedDate) {
                          setSelectedCalendarDate(null);
                        } else {
                          setSelectedCalendarDate(isoDateStr);
                        }
                      }}
                      className="w-[14.28%] h-12 items-center justify-center relative p-0.5"
                    >
                      {/* Perfect Circle Date Badge */}
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isSelectedDate
                            ? "#ddb7ff"
                            : hasExam
                            ? "rgba(192, 132, 252, 0.25)"
                            : "transparent",
                          borderWidth: isSelectedDate || hasExam ? 1 : 0,
                          borderColor: isSelectedDate ? "#ddb7ff" : "rgba(221, 183, 255, 0.5)",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: isSelectedDate || hasExam ? "800" : "600",
                            color: isSelectedDate
                              ? "#0b0912"
                              : hasExam
                              ? "#ddb7ff"
                              : "rgba(255, 255, 255, 0.75)",
                          }}
                        >
                          {day}
                        </Text>
                      </View>

                      {/* Dots at bottom matching exact count of scheduled exams */}
                      {hasExam ? (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2.5,
                            marginTop: 2,
                            height: 4,
                          }}
                        >
                          {Array.from({ length: Math.min(examCount, 4) }).map((_, dotIdx) => (
                            <View
                              key={dotIdx}
                              style={{
                                width: 4,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: isSelectedDate ? "#ddb7ff" : "#38bdf8",
                              }}
                            />
                          ))}
                        </View>
                      ) : (
                        <View style={{ height: 4, marginTop: 2 }} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* CLASS EXAM SCHEDULE LIST SECTION */}
            <View className="bg-[#181524] border border-white/10 rounded-3xl p-4 shadow-lg">
              <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-white/10">
                <Text className="text-white font-extrabold text-sm">
                  Class {selectedClass} — Exam Schedule
                </Text>
                {selectedCalendarDate && (
                  <Pressable
                    onPress={() => setSelectedCalendarDate(null)}
                    className="bg-white/10 px-2.5 py-1 rounded-lg"
                  >
                    <Text className="text-[#ddb7ff] text-[10px] font-bold">Clear Date Filter</Text>
                  </Pressable>
                )}
              </View>

              {totalClassExamsCount === 0 || entriesToShow.length === 0 ? (
                <View className="py-10 px-4 items-center justify-center">
                  <View className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center mb-3">
                    <CalendarOff size={22} color="#ffffff40" />
                  </View>
                  <Text className="text-white/70 text-xs font-semibold text-center leading-relaxed">
                    No exams scheduled yet. Schedule has not been set yet.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {entriesToShow.map((group) => (
                    <View key={group.date} className="bg-black/30 border border-white/5 rounded-2xl p-3.5">
                      <View className="flex-row items-center mb-2.5 pb-1.5 border-b border-white/10">
                        <Calendar size={14} color="#ddb7ff" style={{ marginRight: 6 }} />
                        <Text className="text-white text-xs font-black">{formatToDDMMYYYY(group.date)}</Text>
                        <Text className="text-white/40 text-[10px] ml-2">
                          ({group.entries.length} {group.entries.length === 1 ? "Subject" : "Subjects"})
                        </Text>
                      </View>

                      <View style={{ gap: 8 }}>
                        {group.entries.map((item, itemIdx) => (
                          <View
                            key={itemIdx}
                            className="bg-white/5 rounded-xl p-3 border border-white/10 flex-row items-center justify-between"
                          >
                            <View className="flex-1 mr-2">
                              <Text className="text-white text-sm font-black">{item.subject}</Text>
                              <View className="flex-row items-center mt-1">
                                <Clock size={12} color="#38bdf8" style={{ marginRight: 4 }} />
                                <Text className="text-white/60 text-xs font-medium">
                                  {item.time} ({item.duration})
                                </Text>
                              </View>
                            </View>

                            <View className="items-end bg-[#ddb7ff]/10 border border-[#ddb7ff]/30 px-3 py-1.5 rounded-xl">
                              <Text className="text-[10px] text-white/50 font-bold uppercase">Max Marks</Text>
                              <Text className="text-[#ddb7ff] text-sm font-black">{item.maxMarks}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#08070d",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
});

export default TeacherExamSchedulePreviewScreen;
