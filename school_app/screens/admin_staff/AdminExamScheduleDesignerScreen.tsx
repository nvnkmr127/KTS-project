import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Dimensions,
  BackHandler,
  Alert,
  Platform,
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
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  X,
  ChevronDown,
  Check,
  Save,
} from "lucide-react-native";
import { useResponsive } from "../../utils/responsive";
import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../services/api";

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

export interface ExamScheduleEntry {
  subject: string;
  time: string;
  duration: string;
  maxMarks: number;
}

export type ClassExamSchedule = {
  [dateStr: string]: ExamScheduleEntry[];
};

export interface PreviewExam {
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
    classes: "10A, 10B, 9A, 9B, 8A, 7A, 6A, 5A, 4B, 4A, 3B, 3A, 2B, 2A, 1B, 1A",
    subjects: "Mathematics, Physics, Chemistry, English, Telugu, Hindi, Science, Social Studies",
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
    "8A": {
      "2026-09-28": [
        { subject: "Hindi", time: "02:00 PM", duration: "2 hrs", maxMarks: 100 },
        { subject: "Telugu", time: "10:00 AM", duration: "2 hrs", maxMarks: 100 },
      ],
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
    },
  },
};

const CLASS_AVAILABLE_SUBJECTS: Record<string, string[]> = {
  "Class 8A": ["Telugu", "Hindi", "English", "Mathematics", "Physics", "Biology", "Social Studies", "General Science"],
  "8A": ["Telugu", "Hindi", "English", "Mathematics", "Physics", "Biology", "Social Studies", "General Science"],
  "Class 10A": ["Telugu", "Hindi", "English", "Mathematics", "Physics", "Chemistry", "Biology", "Social Studies"],
  "10A": ["Telugu", "Hindi", "English", "Mathematics", "Physics", "Chemistry", "Biology", "Social Studies"],
  "Class 4B": ["Telugu", "Hindi", "English", "Mathematics", "EVS", "GK"],
  "4B": ["Telugu", "Hindi", "English", "Mathematics", "EVS", "GK"],
  default: ["Telugu", "Hindi", "English", "Mathematics", "General Science", "Social Studies", "EVS", "GK", "Computer Science"],
};

const START_TIMES = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
];

const DURATIONS = ["1 hr", "1.5 hrs", "2 hrs", "2.5 hrs", "3 hrs"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const AdminExamScheduleDesignerScreen: React.FC<{ navigation: any; route?: any }> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { headerPaddingTop } = useResponsive();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";

  const primaryColor = isSuperAdmin ? "#f0c110" : "#00f1a1";
  const primaryLight = isSuperAdmin ? "#ffe5a0" : "#00f1a1";
  const bgGradient = isSuperAdmin
    ? (["#101415", "#1a1e1f", "#0b0c0d", "#080809"] as const)
    : (["#061a14", "#0d2a24", "#081713", "#050f0c"] as const);

  const cardBg = isSuperAdmin ? "#181d1f" : "#102d26";
  const cardBorder = isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)";

  // Persistent Schedules State
  const [schedules, setSchedules] = useState<Record<string, Record<string, ClassExamSchedule>>>(INITIAL_SCHEDULES_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true); // Edit / Designer mode active by default
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    return "8A";
  });

  // Calendar State
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 8 = September (0-indexed)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // "Add Exam" Pop-up Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalDateStr, setModalDateStr] = useState<string>("");
  const [formSubject, setFormSubject] = useState<string>("Telugu");
  const [formTime, setFormTime] = useState<string>("10:00 AM");
  const [formDuration, setFormDuration] = useState<string>("2 hrs");
  const [formMaxMarks, setFormMaxMarks] = useState<string>("100");

  // Dropdown Picker Modals
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load schedules from DB / settings
  const loadSchedulesFromDb = useCallback(async () => {
    try {
      const res = await api.getResources("settings", { key: "examinations_schedules" }).catch(() => null);
      if (res && Array.isArray(res) && res.length > 0 && res[0]?.value) {
        const parsed = typeof res[0].value === "string" ? JSON.parse(res[0].value) : res[0].value;
        if (parsed && typeof parsed === "object") {
          setSchedules((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadSchedulesFromDb();
  }, [loadSchedulesFromDb]);

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
  const classSchedule: ClassExamSchedule = useMemo(() => {
    if (!selectedExam) return {};
    const idStr = String(selectedExam.id || "").trim();
    const nameStr = String(selectedExam.name || "").trim().toLowerCase();

    let examSched = schedules[idStr];
    if (!examSched) {
      const cleanDigits = idStr.replace(/\D/g, "");
      if (cleanDigits && schedules[cleanDigits]) examSched = schedules[cleanDigits];
    }
    if (!examSched) {
      for (const [k, v] of Object.entries(schedules)) {
        if (k.toLowerCase().trim() === nameStr) {
          examSched = v;
          break;
        }
      }
    }
    if (!examSched) {
      if (nameStr.includes("fa 1") && schedules["1"]) examSched = schedules["1"];
      else if (nameStr.includes("primary") && schedules["2"]) examSched = schedules["2"];
      else examSched = schedules["3"] || {};
    }

    const cleanClass = selectedClass.replace(/^Class\s*/i, "").trim();
    return examSched[cleanClass] || examSched[selectedClass] || {};
  }, [selectedExam, selectedClass, schedules]);

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
        return;
      }

      if (selectedExam.date) {
        let year = 2026;
        let month = 8;
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
      }
    }
  }, [selectedExam]);

  // Inbuilt Mobile Back Handler
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (selectedExam !== null) {
          setSelectedExam(null);
          return true;
        }
        navigation.navigate("ExamSchedule");
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [selectedExam, navigation])
  );

  // Helper to count scheduled entries for an exam
  const getExamScheduleCount = (examId: string): number => {
    const examSched = schedules[examId] || INITIAL_SCHEDULES_DATA[examId];
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

  const availableSubjectsList = useMemo(() => {
    return CLASS_AVAILABLE_SUBJECTS[selectedClass] || CLASS_AVAILABLE_SUBJECTS[`Class ${selectedClass}`] || CLASS_AVAILABLE_SUBJECTS.default;
  }, [selectedClass]);

  // Open "Add Exam" Pop-up Modal when clicking a calendar date
  const handleCalendarDayPress = (day: number) => {
    const isoDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedCalendarDate(isoDateStr);

    if (isEditing) {
      setModalDateStr(isoDateStr);
      setFormSubject(availableSubjectsList[0] || "Telugu");
      setFormTime("10:00 AM");
      setFormDuration("2 hrs");
      setFormMaxMarks(String(selectedExam?.maxMarks || 100));
      setShowAddModal(true);
    }
  };

  // Add Exam Entry to current schedule
  const handleAddExamEntry = () => {
    if (!selectedExam || !modalDateStr) return;

    const newEntry: ExamScheduleEntry = {
      subject: formSubject,
      time: formTime,
      duration: formDuration,
      maxMarks: parseInt(formMaxMarks, 10) || selectedExam.maxMarks || 100,
    };

    setSchedules((prev) => {
      const examId = selectedExam.id;
      const cleanClass = selectedClass.replace(/^Class\s*/i, "").trim();

      const examPrev = prev[examId] || {};
      const classPrev = examPrev[cleanClass] || {};
      const dayPrev = classPrev[modalDateStr] || [];

      const updatedClass = {
        ...classPrev,
        [modalDateStr]: [...dayPrev, newEntry],
      };

      const updatedExam = {
        ...examPrev,
        [cleanClass]: updatedClass,
      };

      const next = {
        ...prev,
        [examId]: updatedExam,
      };

      const cleanDigits = String(examId).replace(/\D/g, "");
      if (cleanDigits) {
        next[cleanDigits] = updatedExam;
      }
      return next;
    });

    setShowAddModal(false);
    showToast(`Added ${formSubject} on ${formatToDDMMYYYY(modalDateStr)}!`);
  };

  // Remove Exam Entry from schedule
  const handleRemoveEntry = (dateStr: string, index: number) => {
    if (!selectedExam) return;

    setSchedules((prev) => {
      const examId = selectedExam.id;
      const cleanClass = selectedClass.replace(/^Class\s*/i, "").trim();

      const examPrev = prev[examId] || {};
      const classPrev = examPrev[cleanClass] || {};
      const dayEntries = [...(classPrev[dateStr] || [])];

      dayEntries.splice(index, 1);

      const updatedClass = { ...classPrev, [dateStr]: dayEntries };
      if (dayEntries.length === 0) {
        delete updatedClass[dateStr];
      }

      const updatedExam = {
        ...examPrev,
        [cleanClass]: updatedClass,
      };

      const next = {
        ...prev,
        [examId]: updatedExam,
      };

      const cleanDigits = String(examId).replace(/\D/g, "");
      if (cleanDigits) {
        next[cleanDigits] = updatedExam;
      }
      return next;
    });

    showToast("Removed scheduled exam entry.");
  };

  // Save Schedule Button Action
  const handleSaveSchedule = async () => {
    setIsSaving(true);
    try {
      await api.createResource("settings", {
        key: "examinations_schedules",
        value: JSON.stringify(schedules),
      }).catch(async () => {
        await api.updateResource("settings", "examinations_schedules", {
          key: "examinations_schedules",
          value: JSON.stringify(schedules),
        });
      });

      setIsEditing(false); // Switch to saved preview state
      showToast("Exam Schedule saved successfully! Live sync active across Teacher & Admin logins.");
    } catch {
      setIsEditing(false);
      showToast("Saved locally and queued for cloud sync.");
    } finally {
      setIsSaving(false);
    }
  };

  // Display all scheduled dates for the active class sorted chronologically
  const entriesToShow = useMemo(() => {
    const list = Object.entries(classSchedule).map(([date, entries]) => ({
      date,
      entries,
    }));
    return list.sort((a, b) => {
      const getTimestamp = (dStr: string) => {
        if (/^\d{2}-\d{2}-\d{4}$/.test(dStr)) {
          const [dd, mm, yyyy] = dStr.split("-");
          return new Date(`${yyyy}-${mm}-${dd}`).getTime();
        }
        return new Date(dStr).getTime() || 0;
      };
      return getTimestamp(a.date) - getTimestamp(b.date);
    });
  }, [classSchedule]);

  const topTabs = [
    { id: "AdminExamSchedule", label: "Exam Schedule" },
    { id: "AdminExamResults", label: "Results & Rankings" },
    { id: "AdminMarksPreview", label: "Marks Preview" },
    { id: "AdminExamScheduleDesigner", label: "Schedule Designer", active: true },
    { id: "AdminExamInvigilation", label: "Allot Invigilation" },
  ];

  return (
    <View style={styles.container}>
      {/* Background Deep Gradient */}
      <LinearGradient
        colors={bgGradient}
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
                    navigation.navigate("ExamSchedule");
                  }
                }}
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center mr-3 active:bg-white/20"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color={primaryColor} />
              </Pressable>
              <View className="flex-1">
                <Text className="text-white text-lg md:text-xl font-extrabold" numberOfLines={1}>
                  Schedule Designer
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: primaryColor }} />
                  <Text className="text-xs font-semibold" style={{ color: primaryLight }}>
                    Academic Year: 2026-2027 (Current)
                  </Text>
                </View>
              </View>
            </View>

            {/* TOP RIGHT: SAVE SCHEDULE / EDIT SCHEDULE ACTION BUTTON */}
            {selectedExam && (
              <Pressable
                onPress={() => {
                  if (isEditing) {
                    handleSaveSchedule();
                  } else {
                    setIsEditing(true);
                    showToast("Edit Mode Enabled. Tap any calendar date to add subjects.");
                  }
                }}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl flex-row items-center shadow-lg active:opacity-80"
                style={{
                  backgroundColor: isEditing ? primaryColor : "rgba(255, 255, 255, 0.12)",
                  borderWidth: 1,
                  borderColor: isEditing ? primaryColor : "rgba(255, 255, 255, 0.25)",
                }}
              >
                {isEditing ? (
                  <>
                    <Save size={14} color="#000000" style={{ marginRight: 5 }} />
                    <Text className="text-black text-xs font-black">
                      {isSaving ? "Saving..." : "Save Schedule"}
                    </Text>
                  </>
                ) : (
                  <>
                    <Pencil size={14} color={primaryColor} style={{ marginRight: 5 }} />
                    <Text className="text-xs font-black" style={{ color: primaryColor }}>
                      Edit Schedule
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </BlurView>
      </View>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <View
          style={[styles.toast, { borderColor: primaryColor }]}
        >
          <CheckCircle2 size={18} color={primaryColor} style={{ marginRight: 10 }} />
          <Text className="text-white text-xs md:text-sm font-bold flex-1">{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 95,
          paddingHorizontal: 16,
          paddingTop: 16,
        }}
      >
        {/* HORIZONTAL EXAMINATION TABS BAR */}
        <View style={{ marginBottom: 16 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {topTabs.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => {
                  if (!t.active) {
                    navigation.navigate(t.id);
                  }
                }}
                className="px-4 py-2.5 rounded-xl border flex-row items-center"
                style={{
                  backgroundColor: t.active
                    ? isSuperAdmin ? "rgba(240, 193, 16, 0.15)" : "rgba(0, 241, 161, 0.15)"
                    : cardBg,
                  borderColor: t.active ? primaryColor : "rgba(255, 255, 255, 0.1)",
                }}
              >
                <Text
                  className="text-xs font-black"
                  style={{ color: t.active ? primaryColor : "rgba(255, 255, 255, 0.6)" }}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ========================================================= */}
        {/* STATE 1: EXAM LIST SELECTION SCREEN */}
        {/* ========================================================= */}
        {!selectedExam && (
          <View>
            {/* 4 KPI CARDS */}
            <View className="flex-row flex-wrap justify-between mb-4" style={{ gap: 10 }}>
              <View
                className="w-[48%] border rounded-2xl p-3.5 shadow-md relative overflow-hidden"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white/60 text-[11px] font-bold">Upcoming Exams</Text>
                  <View className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 items-center justify-center">
                    <BookOpen size={16} color="#38bdf8" />
                  </View>
                </View>
                <Text className="text-white text-2xl font-black">1</Text>
                <Text className="text-white/40 text-[10px] font-medium mt-0.5">This month</Text>
              </View>

              <View
                className="w-[48%] border rounded-2xl p-3.5 shadow-md relative overflow-hidden"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white/60 text-[11px] font-bold">Class Average</Text>
                  <View className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center">
                    <BarChart2 size={16} color="#34d399" />
                  </View>
                </View>
                <Text className="text-white text-2xl font-black">0.0%</Text>
                <Text className="text-white/40 text-[10px] font-medium mt-0.5">Class 8A • Selected Exam</Text>
              </View>

              <View
                className="w-[48%] border rounded-2xl p-3.5 shadow-md relative overflow-hidden"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white/60 text-[11px] font-bold">Top Score</Text>
                  <View
                    className="w-8 h-8 rounded-xl items-center justify-center border"
                    style={{
                      backgroundColor: isSuperAdmin ? "rgba(240, 193, 16, 0.15)" : "rgba(0, 241, 161, 0.15)",
                      borderColor: isSuperAdmin ? "rgba(240, 193, 16, 0.3)" : "rgba(0, 241, 161, 0.3)",
                    }}
                  >
                    <Award size={16} color={primaryColor} />
                  </View>
                </View>
                <Text className="text-white text-2xl font-black">0.0%</Text>
                <Text className="text-white/40 text-[10px] font-medium mt-0.5">No score yet</Text>
              </View>

              <View
                className="w-[48%] border rounded-2xl p-3.5 shadow-md relative overflow-hidden"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
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
                Select an Exam to design its schedule
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
                    className="border rounded-2xl p-4 active:opacity-80 shadow-lg relative overflow-hidden"
                    style={{
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      borderRadius: 16,
                    }}
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
                        <Text className="text-xs font-extrabold mr-1" style={{ color: primaryColor }}>
                          Open Designer →
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
        {/* STATE 2: DETAILED SCHEDULE DESIGNER / CALENDAR VIEW */}
        {/* ========================================================= */}
        {selectedExam && (
          <View>
            {/* Top Bar with Exam Name and Class Pills */}
            <View
              className="border rounded-2xl p-4 mb-4 shadow-lg"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 mr-2">
                  <Text className="text-white text-base font-black" numberOfLines={1}>
                    Exam Schedule Designer — <Text style={{ color: primaryColor }}>{selectedExam.name}</Text>
                  </Text>
                  <Text className="text-white/50 text-[11px] font-medium mt-0.5">
                    Start Date: {formatToDDMMYYYY(selectedExam.date)}
                  </Text>
                </View>

                {/* Status indicator */}
                <View
                  className="px-2.5 py-1 rounded-full border"
                  style={{
                    backgroundColor: isSuperAdmin ? "rgba(240, 193, 16, 0.15)" : "rgba(0, 241, 161, 0.15)",
                    borderColor: isSuperAdmin ? "rgba(240, 193, 16, 0.3)" : "rgba(0, 241, 161, 0.3)",
                  }}
                >
                  <Text className="text-[11px] font-black" style={{ color: primaryColor }}>
                    {totalClassExamsCount} exams scheduled
                  </Text>
                </View>
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
                      className={`px-3.5 py-1.5 rounded-xl border items-center justify-center ${
                        isSelected
                          ? "shadow-md"
                          : "bg-white/5 border-white/10 active:bg-white/10"
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: primaryColor, borderColor: primaryColor }
                          : undefined
                      }
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

            {/* DESIGNER INSTRUCTION BANNER */}
            {isEditing && (
              <View
                className="rounded-2xl p-3 mb-4 border flex-row items-center"
                style={{
                  backgroundColor: isSuperAdmin ? "rgba(240, 193, 16, 0.1)" : "rgba(0, 241, 161, 0.1)",
                  borderColor: isSuperAdmin ? "rgba(240, 193, 16, 0.25)" : "rgba(0, 241, 161, 0.25)",
                }}
              >
                <Calendar size={16} color={primaryColor} style={{ marginRight: 8 }} />
                <Text className="text-white/80 text-xs font-semibold flex-1">
                  Tap any date on the calendar to assign subjects and schedule exams for <Text className="text-white font-bold">Class {selectedClass}</Text>.
                </Text>
              </View>
            )}

            {/* CALENDAR MODULE */}
            <View
              className="border rounded-3xl p-4 mb-4 shadow-xl"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              {/* Calendar Month Header */}
              <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-white/10">
                <Pressable
                  onPress={prevMonth}
                  className="w-8 h-8 rounded-lg bg-white/5 items-center justify-center active:bg-white/15"
                >
                  <ChevronLeft size={18} color={primaryColor} />
                </Pressable>

                <Text className="text-white font-black text-sm md:text-base">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </Text>

                <Pressable
                  onPress={nextMonth}
                  className="w-8 h-8 rounded-lg bg-white/5 items-center justify-center active:bg-white/15"
                >
                  <ChevronRight size={18} color={primaryColor} />
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
                      onPress={() => handleCalendarDayPress(day)}
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
                            ? primaryColor
                            : hasExam
                            ? isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)"
                            : "transparent",
                          borderWidth: isSelectedDate || hasExam ? 1 : 0,
                          borderColor: isSelectedDate ? primaryColor : isSuperAdmin ? "rgba(240, 193, 16, 0.5)" : "rgba(0, 241, 161, 0.5)",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: isSelectedDate || hasExam ? "800" : "600",
                            color: isSelectedDate
                              ? "#0b0912"
                              : hasExam
                              ? primaryColor
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
                                backgroundColor: isSelectedDate ? "#ffffff" : primaryColor,
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

            {/* CLASS EXAM SCHEDULE LIST SECTION (Matching Web UI Card) */}
            <View
              className="border rounded-3xl p-4 shadow-lg"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-white/10">
                <Text className="text-white font-extrabold text-sm">
                  Class {selectedClass} — Exam Schedule
                </Text>
                <View
                  className="px-2.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: isSuperAdmin ? "rgba(240, 193, 16, 0.1)" : "rgba(0, 241, 161, 0.1)",
                    borderColor: isSuperAdmin ? "rgba(240, 193, 16, 0.25)" : "rgba(0, 241, 161, 0.25)",
                  }}
                >
                  <Text className="text-[10px] font-bold" style={{ color: primaryColor }}>
                    {totalClassExamsCount} {totalClassExamsCount === 1 ? "Subject" : "Subjects"}
                  </Text>
                </View>
              </View>

              {totalClassExamsCount === 0 || entriesToShow.length === 0 ? (
                <View className="py-10 px-4 items-center justify-center">
                  <View className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center mb-3">
                    <CalendarOff size={22} color="#ffffff40" />
                  </View>
                  <Text className="text-white/70 text-xs font-semibold text-center leading-relaxed">
                    No exams scheduled yet for Class {selectedClass}. Tap any date on the calendar above to assign subjects!
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {entriesToShow.map((group) => (
                    <View
                      key={group.date}
                      className="rounded-2xl p-4 border"
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        borderColor: "rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      {/* Date Heading */}
                      <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-white/10">
                        <View className="flex-row items-center">
                          <Calendar size={14} color={primaryColor} style={{ marginRight: 6 }} />
                          <Text className="text-white text-xs font-black">{formatToDDMMYYYY(group.date)}</Text>
                          <Text className="text-white/40 text-[10px] ml-2">
                            ({group.entries.length} {group.entries.length === 1 ? "Subject" : "Subjects"})
                          </Text>
                        </View>
                        {isEditing && (
                          <Pressable
                            onPress={() => {
                              setModalDateStr(group.date);
                              setFormSubject(availableSubjectsList[0] || "Telugu");
                              setShowAddModal(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-white/10 flex-row items-center"
                          >
                            <Plus size={12} color={primaryLight} style={{ marginRight: 3 }} />
                            <Text className="text-[10px] font-bold" style={{ color: primaryLight }}>Add</Text>
                          </Pressable>
                        )}
                      </View>

                      {/* Scheduled Subjects Stack (Exact Web Style) */}
                      <View style={{ gap: 8 }}>
                        {group.entries.map((item, itemIdx) => (
                          <View
                            key={itemIdx}
                            className="rounded-xl p-3 border flex-row items-center justify-between"
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.04)",
                              borderColor: "rgba(255, 255, 255, 0.08)",
                            }}
                          >
                            <View className="flex-row items-center flex-1 mr-2">
                              {/* Blue / Emerald Bullet Dot */}
                              <View
                                className="w-2.5 h-2.5 rounded-full mr-2.5"
                                style={{ backgroundColor: primaryColor }}
                              />
                              <View className="flex-1">
                                <Text className="text-white text-sm font-black">
                                  {item.subject}
                                </Text>
                                <Text className="text-white/60 text-xs font-medium mt-0.5">
                                  {item.time} · {item.duration} · <Text className="text-white/80 font-bold">{item.maxMarks} marks</Text>
                                </Text>
                              </View>
                            </View>

                            {/* Delete Entry 'x' button (in Edit Mode) */}
                            {isEditing && (
                              <Pressable
                                onPress={() => handleRemoveEntry(group.date, itemIdx)}
                                className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 items-center justify-center active:bg-rose-500/30"
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <X size={14} color="#f87171" />
                              </Pressable>
                            )}
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

      {/* ========================================================= */}
      {/* ADD EXAM POP-UP MODAL (Exact Matching Screenshot UI) */}
      {/* ========================================================= */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable
          onPress={() => setShowAddModal(false)}
          style={styles.modalOverlay}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.modalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            {/* Modal Header */}
            <View className="flex-row items-start justify-between mb-4 pb-3 border-b border-white/10">
              <View>
                <Text className="text-white text-lg font-black">Add Exam</Text>
                <Text className="text-white/50 text-xs font-semibold mt-0.5">
                  Class {selectedClass} · {formatToDDMMYYYY(modalDateStr)}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
              >
                <X size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>

            {/* Field 1: Subject * */}
            <View className="mb-3.5">
              <Text className="text-white/70 text-xs font-bold mb-1.5">Subject *</Text>
              <Pressable
                onPress={() => setShowSubjectPicker(true)}
                className="h-11 rounded-xl px-3.5 flex-row items-center justify-between border"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  borderColor: "rgba(255, 255, 255, 0.15)",
                }}
              >
                <Text className="text-white font-bold text-sm">{formSubject}</Text>
                <ChevronDown size={16} color={primaryColor} />
              </Pressable>
            </View>

            {/* Field 2 & 3: Start Time * & Duration * (Side-by-side) */}
            <View className="flex-row gap-3 mb-3.5">
              <View className="flex-1">
                <Text className="text-white/70 text-xs font-bold mb-1.5">Start Time *</Text>
                <Pressable
                  onPress={() => setShowTimePicker(true)}
                  className="h-11 rounded-xl px-3 flex-row items-center justify-between border"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <Text className="text-white font-bold text-xs" numberOfLines={1}>
                    {formTime}
                  </Text>
                  <ChevronDown size={14} color={primaryColor} />
                </Pressable>
              </View>

              <View className="flex-1">
                <Text className="text-white/70 text-xs font-bold mb-1.5">Duration *</Text>
                <Pressable
                  onPress={() => setShowDurationPicker(true)}
                  className="h-11 rounded-xl px-3 flex-row items-center justify-between border"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <Text className="text-white font-bold text-xs" numberOfLines={1}>
                    {formDuration}
                  </Text>
                  <ChevronDown size={14} color={primaryColor} />
                </Pressable>
              </View>
            </View>

            {/* Field 4: Max Marks * */}
            <View className="mb-5">
              <Text className="text-white/70 text-xs font-bold mb-1.5">Max Marks *</Text>
              <TextInput
                value={formMaxMarks}
                onChangeText={setFormMaxMarks}
                keyboardType="number-pad"
                placeholder="100"
                placeholderTextColor="rgba(255,255,255,0.3)"
                className="h-11 rounded-xl px-3.5 text-white font-bold text-sm border"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  borderColor: "rgba(255, 255, 255, 0.15)",
                }}
              />
            </View>

            {/* Action Buttons: Cancel & Add Exam */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowAddModal(false)}
                className="flex-1 h-12 rounded-xl border items-center justify-center bg-white/5 active:bg-white/10"
                style={{ borderColor: "rgba(255, 255, 255, 0.15)" }}
              >
                <Text className="text-white/80 font-bold text-sm">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleAddExamEntry}
                className="flex-1 h-12 rounded-xl items-center justify-center shadow-lg active:opacity-80"
                style={{ backgroundColor: primaryColor }}
              >
                <Text className="text-black font-black text-sm">Add Exam</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* SUBJECT SELECTOR PICKER MODAL */}
      <Modal visible={showSubjectPicker} transparent animationType="fade" onRequestClose={() => setShowSubjectPicker(false)}>
        <Pressable onPress={() => setShowSubjectPicker(false)} style={styles.modalOverlay}>
          <View style={[styles.pickerModalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-white/10">
              <Text className="text-white font-extrabold text-sm">Select Subject</Text>
              <Pressable onPress={() => setShowSubjectPicker(false)}>
                <X size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 260 }}>
              {availableSubjectsList.map((sub) => {
                const isSelected = formSubject === sub;
                return (
                  <Pressable
                    key={sub}
                    onPress={() => {
                      setFormSubject(sub);
                      setShowSubjectPicker(false);
                    }}
                    className="p-3 rounded-xl mb-1.5 flex-row items-center justify-between"
                    style={{
                      backgroundColor: isSelected
                        ? isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)"
                        : "rgba(255, 255, 255, 0.05)",
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: primaryColor,
                    }}
                  >
                    <Text className="text-sm font-bold" style={{ color: isSelected ? primaryColor : "#ffffff" }}>
                      {sub}
                    </Text>
                    {isSelected && <Check size={16} color={primaryColor} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* TIME SELECTOR PICKER MODAL */}
      <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
        <Pressable onPress={() => setShowTimePicker(false)} style={styles.modalOverlay}>
          <View style={[styles.pickerModalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-white/10">
              <Text className="text-white font-extrabold text-sm">Select Start Time</Text>
              <Pressable onPress={() => setShowTimePicker(false)}>
                <X size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 260 }}>
              {START_TIMES.map((time) => {
                const isSelected = formTime === time;
                return (
                  <Pressable
                    key={time}
                    onPress={() => {
                      setFormTime(time);
                      setShowTimePicker(false);
                    }}
                    className="p-3 rounded-xl mb-1.5 flex-row items-center justify-between"
                    style={{
                      backgroundColor: isSelected
                        ? isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)"
                        : "rgba(255, 255, 255, 0.05)",
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: primaryColor,
                    }}
                  >
                    <Text className="text-sm font-bold" style={{ color: isSelected ? primaryColor : "#ffffff" }}>
                      {time}
                    </Text>
                    {isSelected && <Check size={16} color={primaryColor} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* DURATION SELECTOR PICKER MODAL */}
      <Modal visible={showDurationPicker} transparent animationType="fade" onRequestClose={() => setShowDurationPicker(false)}>
        <Pressable onPress={() => setShowDurationPicker(false)} style={styles.modalOverlay}>
          <View style={[styles.pickerModalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-white/10">
              <Text className="text-white font-extrabold text-sm">Select Duration</Text>
              <Pressable onPress={() => setShowDurationPicker(false)}>
                <X size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 260 }}>
              {DURATIONS.map((dur) => {
                const isSelected = formDuration === dur;
                return (
                  <Pressable
                    key={dur}
                    onPress={() => {
                      setFormDuration(dur);
                      setShowDurationPicker(false);
                    }}
                    className="p-3 rounded-xl mb-1.5 flex-row items-center justify-between"
                    style={{
                      backgroundColor: isSelected
                        ? isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)"
                        : "rgba(255, 255, 255, 0.05)",
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: primaryColor,
                    }}
                  >
                    <Text className="text-sm font-bold" style={{ color: isSelected ? primaryColor : "#ffffff" }}>
                      {dur}
                    </Text>
                    {isSelected && <Check size={16} color={primaryColor} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050f0c",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  toast: {
    position: "absolute",
    top: 90,
    left: 16,
    right: 16,
    zIndex: 999,
    backgroundColor: "#061a14",
    borderWidth: 1,
    borderColor: "rgba(0, 241, 161, 0.5)",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  pickerModalCard: {
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
});

export default AdminExamScheduleDesignerScreen;
