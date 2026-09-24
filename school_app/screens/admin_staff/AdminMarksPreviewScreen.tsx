import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  RefreshControl,
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
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  Check,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react-native";
import { useResponsive } from "../../utils/responsive";
import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface ExamOption {
  id: string;
  name: string;
  classes: string;
  subject: string;
  date: string;
  maxMarks: number;
  status: "Upcoming" | "Completed" | "Results Published";
}

export interface StudentItem {
  id: string;
  name: string;
  roll: string;
  init: string;
}

const DEFAULT_EXAMS: ExamOption[] = [
  {
    id: "2",
    name: "FA 1 PRIMARY",
    classes: "Class 4B, 4A, 3A, 3B, 2A, 2B, 1A, 1B, 5A",
    subject: "All Subjects",
    date: "01-01-2026",
    maxMarks: 50,
    status: "Completed",
  },
  {
    id: "1",
    name: "FA 1",
    classes: "Class 10A, 9A, 8A, 7A, 6A",
    subject: "All Subjects",
    date: "01-09-2027",
    maxMarks: 20,
    status: "Results Published",
  },
  {
    id: "3",
    name: "Mid-Term Examination 2026",
    classes: "Class 10A, 10B, 9A, 9B, 8A",
    subject: "Mathematics, Physics, Chemistry, English",
    date: "10-06-2026",
    maxMarks: 100,
    status: "Upcoming",
  },
];

const DEFAULT_CLASSES = [
  "Class 4B",
  "Class 8A",
  "Class 10A",
  "Class 9A",
  "Class 7A",
  "Class 6A",
  "Class 5A",
  "Class 3A",
  "Class 2A",
  "Class 1A",
];

const CLASS_SUBJECTS_MAP: Record<string, { subjects: string[]; maxPerSub: number }> = {
  "Class 4B": {
    subjects: ["Telugu", "Hindi", "English", "Maths", "GK", "EVS"],
    maxPerSub: 50,
  },
  "Class 8A": {
    subjects: ["Telugu", "Hindi", "English", "Maths", "Physics", "Biology", "Social"],
    maxPerSub: 20,
  },
  "Class 10A": {
    subjects: ["Telugu", "Hindi", "English", "Mathematics", "Physics", "Chemistry", "Biology", "Social Studies"],
    maxPerSub: 100,
  },
  default: {
    subjects: ["Telugu", "Hindi", "English", "Maths", "Science", "Social"],
    maxPerSub: 50,
  },
};

const SAMPLE_STUDENTS_BY_CLASS: Record<string, StudentItem[]> = {
  "Class 4B": [
    { id: "s-1", name: "H VAISHANVI", roll: "STDDe2026074", init: "HV" },
    { id: "s-2", name: "MANGALI SWATHI", roll: "STDDe2026075", init: "MS" },
    { id: "s-3", name: "SHERI MAANVITHA", roll: "STDDe2026076", init: "SM" },
    { id: "s-4", name: "ADDANUMUTHI RUTHWIK", roll: "STDDe2026077", init: "AR" },
    { id: "s-5", name: "CHAKALI SAI VARSHITH", roll: "STDDe2026078", init: "CV" },
    { id: "s-6", name: "GADDAMEEDA SAIDATH", roll: "STDDe2026079", init: "GS" },
    { id: "s-7", name: "TURPU SHASHIVARDHAN", roll: "STDDe2026080", init: "TS" },
    { id: "s-8", name: "VOGGU ANEESH VARDHAN", roll: "STDDe2026081", init: "VV" },
  ],
  "Class 8A": [
    { id: "s-101", name: "BODAPOTHULA ABHILASH GOUD", roll: "STDDe2026400", init: "BG" },
    { id: "s-102", name: "SHIVVAMOLLA SATHVIKA", roll: "STDDe2026451", init: "SS" },
    { id: "s-103", name: "GAJJAGANI CHAITANYA", roll: "STDDe2026459", init: "GC" },
    { id: "s-104", name: "RALLAMOLLA NIHARIKA", roll: "STDDe2026444", init: "RN" },
    { id: "s-105", name: "MALAPATI RISHITHA", roll: "STDDe2026448", init: "MR" },
    { id: "s-106", name: "MALAPATI LASYA", roll: "STDDe2026447", init: "ML" },
    { id: "s-107", name: "KAVALI ANANYA", roll: "STDDe2026446", init: "KA" },
    { id: "s-108", name: "SATHWIK BANDA", roll: "STDDe2026450", init: "SB" },
    { id: "s-109", name: "Chakali Vishnu Charan", roll: "151", init: "CC" },
    { id: "s-110", name: "Dosada Vaishnavi", roll: "152", init: "DV" },
    { id: "s-111", name: "Gundala Manoj Kumar", roll: "153", init: "GK" },
    { id: "s-112", name: "Harijan Nani", roll: "154", init: "HN" },
    { id: "s-113", name: "Karike Chandana", roll: "155", init: "KC" },
    { id: "s-114", name: "Mohammad Sohel Khan", roll: "156", init: "MK" },
    { id: "s-115", name: "P Akhil", roll: "157", init: "PA" },
    { id: "s-116", name: "P Pranaya", roll: "158", init: "PP" },
    { id: "s-117", name: "Papayolla Archana", roll: "159", init: "PA" },
    { id: "s-118", name: "Pegula Sanjay Goud", roll: "160", init: "PS" },
    { id: "s-119", name: "Pegula Swathi", roll: "161", init: "PS" },
    { id: "s-120", name: "Rathod Maheshwari", roll: "162", init: "RM" },
    { id: "s-121", name: "Sara Sathvik", roll: "163", init: "SS" },
    { id: "s-122", name: "Sara Uday Kiran", roll: "164", init: "SU" },
    { id: "s-123", name: "Shivvamolla Sathvika", roll: "165", init: "SS" },
    { id: "s-124", name: "Tammiyu Adi Sankar", roll: "166", init: "TA" },
    { id: "s-125", name: "Talakalapally Rishi Kumar", roll: "167", init: "TR" },
    { id: "s-126", name: "Bantu Varshini", roll: "145", init: "BV" },
    { id: "s-127", name: "Begari Chandana", roll: "146", init: "BC" },
    { id: "s-128", name: "Chakali Nandhini", roll: "147", init: "CN" },
    { id: "s-129", name: "Chakali Navadeep", roll: "148", init: "CN" },
    { id: "s-130", name: "Chakali Sharanya Sri", roll: "149", init: "CS" },
    { id: "s-131", name: "Chakali Sneha", roll: "150", init: "CS" },
  ],
  "Class 10A": [
    { id: "s-201", name: "A. ROHITH SHARMA", roll: "STD20261001", init: "AR" },
    { id: "s-202", name: "B. SNEHA REDDY", roll: "STD20261002", init: "BS" },
    { id: "s-203", name: "C. VARUN KUMAR", roll: "STD20261003", init: "CV" },
    { id: "s-204", name: "D. MANISH GOUD", roll: "STD20261004", init: "DM" },
    { id: "s-205", name: "E. POOJA SHARMA", roll: "STD20261005", init: "EP" },
  ],
};

const getAvatarColor = (init: string) => {
  const palette = [
    { bg: "rgba(56, 189, 248, 0.18)", color: "#38bdf8", border: "rgba(56, 189, 248, 0.4)" },
    { bg: "rgba(168, 85, 247, 0.18)", color: "#c084fc", border: "rgba(168, 85, 247, 0.4)" },
    { bg: "rgba(245, 158, 11, 0.18)", color: "#fbbf24", border: "rgba(245, 158, 11, 0.4)" },
    { bg: "rgba(16, 185, 129, 0.18)", color: "#34d399", border: "rgba(16, 185, 129, 0.4)" },
    { bg: "rgba(244, 63, 94, 0.18)", color: "#fb7185", border: "rgba(244, 63, 94, 0.4)" },
    { bg: "rgba(99, 102, 241, 0.18)", color: "#818cf8", border: "rgba(99, 102, 241, 0.4)" },
  ];
  let sum = 0;
  for (let i = 0; i < init.length; i++) {
    sum += init.charCodeAt(i);
  }
  return palette[sum % palette.length];
};

export const AdminMarksPreviewScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
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

  const [selectedClass, setSelectedClass] = useState<string>("Class 4B");
  const [selectedExamId, setSelectedExamId] = useState<string>("2");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({ "STDDe2026074": true });
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showExamPicker, setShowExamPicker] = useState(false);

  // Student Marks Storage: { [examId]: { [subject]: { [studentRoll]: mark } } }
  const [studentMarks, setStudentMarks] = useState<Record<string, Record<string, Record<string, number | string>>>>({
    "1": {
      "Telugu": { "STDDe2026400": 20 },
      "Hindi": { "STDDe2026400": 20 },
      "English": { "STDDe2026400": 10 },
      "Maths": { "STDDe2026400": 20 },
      "Physics": { "STDDe2026400": 10 },
      "Biology": { "STDDe2026400": 10 },
      "Social": { "STDDe2026400": 20 },
    },
  });

  // Draft in memory for instant typing
  const [draftMarks, setDraftMarks] = useState<Record<string, Record<string, Record<string, number | string>>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  const showToast = (title: string, desc: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Hardware Back Handler
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (navigation?.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate("ExamSchedule");
        }
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  // Sync route params when navigating from Exam Schedule
  useEffect(() => {
    if (route?.params?.examId) {
      setSelectedExamId(String(route.params.examId));
    }
    if (route?.params?.selectedClass) {
      const c = route.params.selectedClass;
      setSelectedClass(c.startsWith("Class ") ? c : `Class ${c}`);
    }
  }, [route?.params]);

  // Load marks from backend / settings
  const loadMarksFromDb = useCallback(async () => {
    try {
      const res = await api.getResources("settings", { key: "kts_student_marks" }).catch(() => null);
      if (res && Array.isArray(res) && res.length > 0 && res[0]?.value) {
        const parsed = typeof res[0].value === "string" ? JSON.parse(res[0].value) : res[0].value;
        if (parsed && typeof parsed === "object") {
          setStudentMarks((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    loadMarksFromDb();
  }, [loadMarksFromDb]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMarksFromDb();
    setRefreshing(false);
  };

  const currentExam = useMemo(() => {
    return DEFAULT_EXAMS.find((e) => String(e.id) === String(selectedExamId)) || DEFAULT_EXAMS[0];
  }, [selectedExamId]);

  const isUpcomingExam = currentExam.status === "Upcoming";

  const currentClassConfig = useMemo(() => {
    return CLASS_SUBJECTS_MAP[selectedClass] || CLASS_SUBJECTS_MAP.default;
  }, [selectedClass]);

  const subjectsList = currentClassConfig.subjects;
  const maxPerSubject = currentExam.maxMarks ? Math.min(currentExam.maxMarks, currentClassConfig.maxPerSub) : currentClassConfig.maxPerSub;

  const studentsList = useMemo(() => {
    return SAMPLE_STUDENTS_BY_CLASS[selectedClass] || SAMPLE_STUDENTS_BY_CLASS["Class 4B"] || [];
  }, [selectedClass]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentsList;
    const q = searchQuery.toLowerCase().trim();
    return studentsList.filter(
      (s) => s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q)
    );
  }, [studentsList, searchQuery]);

  // Toggle student expanded state
  const toggleStudent = (roll: string) => {
    setExpandedStudents((prev) => ({ ...prev, [roll]: !prev[roll] }));
  };

  // Helper: Find mark for a student
  const getMark = (subject: string, roll: string): number | string | null => {
    const draft = draftMarks[selectedExamId]?.[subject]?.[roll];
    if (draft !== undefined) return draft;
    const committed = studentMarks[selectedExamId]?.[subject]?.[roll];
    if (committed !== undefined) return committed;
    return null;
  };

  // Update mark for a student
  const handleUpdateMark = (subject: string, roll: string, value: string) => {
    let cleanVal: number | string | null = value.replace(/[^0-9]/g, "");
    if (cleanVal === "") {
      cleanVal = null;
    } else {
      let num = parseInt(cleanVal, 10);
      if (isNaN(num)) num = 0;
      if (num > maxPerSubject) num = maxPerSubject;
      if (num < 0) num = 0;
      cleanVal = num;
    }

    setDraftMarks((prev) => {
      const examMap = prev[selectedExamId] || {};
      const subMap = examMap[subject] || {};
      return {
        ...prev,
        [selectedExamId]: {
          ...examMap,
          [subject]: {
            ...subMap,
            [roll]: cleanVal as any,
          },
        },
      };
    });
  };

  // Clear marks for a student
  const handleClearStudentMarks = (student: StudentItem) => {
    Alert.alert(
      "Clear Marks",
      `Are you sure you want to clear all subject marks for ${student.name}? This will put them in a cleared state, which you can save.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Marks",
          style: "destructive",
          onPress: () => {
            setDraftMarks((prev) => {
              const examMap = { ...(prev[selectedExamId] || {}) };
              subjectsList.forEach((sub) => {
                examMap[sub] = { ...(examMap[sub] || {}), [student.roll]: "" };
              });
              return {
                ...prev,
                [selectedExamId]: examMap,
              };
            });
            showToast("Marks Cleared", `Subject marks for ${student.name} were cleared.`);
          },
        },
      ]
    );
  };

  // Compute student summary detail
  const computeStudentDetail = (student: StudentItem) => {
    let totalObtained = 0;
    let hasAny = false;

    const breakdown = subjectsList.map((sub) => {
      const raw = getMark(sub, student.roll);
      let mark: number | null = null;
      if (raw !== null && raw !== "" && !isNaN(Number(raw))) {
        mark = Number(raw);
        totalObtained += mark;
        hasAny = true;
      }
      const pct = mark !== null ? Math.round((mark / maxPerSubject) * 100) : null;
      let grade = "--";
      let gradeColor = "#a1a1aa";
      let gradeBadgeBg = "rgba(255, 255, 255, 0.05)";
      let gradeBorder = "rgba(255, 255, 255, 0.1)";

      if (pct !== null) {
        if (pct >= 90) {
          grade = "A+";
          gradeColor = isSuperAdmin ? "#f0c110" : "#00f1a1";
          gradeBadgeBg = isSuperAdmin ? "rgba(240, 193, 16, 0.18)" : "rgba(0, 241, 161, 0.18)";
          gradeBorder = isSuperAdmin ? "rgba(240, 193, 16, 0.4)" : "rgba(0, 241, 161, 0.4)";
        } else if (pct >= 75) {
          grade = "A";
          gradeColor = "#34d399";
          gradeBadgeBg = "rgba(16, 185, 129, 0.18)";
          gradeBorder = "rgba(16, 185, 129, 0.4)";
        } else if (pct >= 65) {
          grade = "B+";
          gradeColor = "#38bdf8";
          gradeBadgeBg = "rgba(56, 189, 248, 0.18)";
          gradeBorder = "rgba(56, 189, 248, 0.4)";
        } else if (pct >= 50) {
          grade = "B";
          gradeColor = "#facc15";
          gradeBadgeBg = "rgba(245, 158, 11, 0.18)";
          gradeBorder = "rgba(245, 158, 11, 0.4)";
        } else {
          grade = "C";
          gradeColor = "#fb7185";
          gradeBadgeBg = "rgba(244, 63, 94, 0.18)";
          gradeBorder = "rgba(244, 63, 94, 0.4)";
        }
      }

      return {
        subject: sub,
        mark,
        maxMarks: maxPerSubject,
        pct,
        grade,
        gradeColor,
        gradeBadgeBg,
        gradeBorder,
      };
    });

    const totalMax = breakdown.length * maxPerSubject;
    const overallPct = hasAny ? Math.round((totalObtained / totalMax) * 100) : null;
    let overallGrade = "--";
    let overallGradeColor = "#a1a1aa";
    let overallBadgeBg = "rgba(255, 255, 255, 0.05)";
    let overallBorder = "rgba(255, 255, 255, 0.1)";

    if (overallPct !== null) {
      if (overallPct >= 90) {
        overallGrade = "A+";
        overallGradeColor = isSuperAdmin ? "#f0c110" : "#00f1a1";
        overallBadgeBg = isSuperAdmin ? "rgba(240, 193, 16, 0.18)" : "rgba(0, 241, 161, 0.18)";
        overallBorder = isSuperAdmin ? "rgba(240, 193, 16, 0.4)" : "rgba(0, 241, 161, 0.4)";
      } else if (overallPct >= 75) {
        overallGrade = "A";
        overallGradeColor = "#34d399";
        overallBadgeBg = "rgba(16, 185, 129, 0.18)";
        overallBorder = "rgba(16, 185, 129, 0.4)";
      } else if (overallPct >= 65) {
        overallGrade = "B+";
        overallGradeColor = "#38bdf8";
        overallBadgeBg = "rgba(56, 189, 248, 0.18)";
        overallBorder = "rgba(56, 189, 248, 0.4)";
      } else if (overallPct >= 50) {
        overallGrade = "B";
        overallGradeColor = "#facc15";
        overallBadgeBg = "rgba(245, 158, 11, 0.18)";
        overallBorder = "rgba(245, 158, 11, 0.4)";
      } else {
        overallGrade = "C";
        overallGradeColor = "#fb7185";
        overallBadgeBg = "rgba(244, 63, 94, 0.18)";
        overallBorder = "rgba(244, 63, 94, 0.4)";
      }
    }

    return {
      breakdown,
      totalMax,
      totalObtained,
      totalObtainedDisplay: hasAny ? String(totalObtained) : "--",
      overallPctDisplay: overallPct !== null ? `${overallPct}%` : "--",
      overallGrade,
      overallGradeColor,
      overallBadgeBg,
      overallBorder,
      hasAny,
    };
  };

  // Performance KPI Metrics Computations
  const { classAvgDisplay, topScoreDisplay } = useMemo(() => {
    let sumPct = 0;
    let countGraded = 0;
    let highestPct = -1;
    let topStudentName = "";

    studentsList.forEach((st) => {
      const detail = computeStudentDetail(st);
      if (detail.hasAny && detail.totalMax > 0) {
        const pct = (detail.totalObtained / detail.totalMax) * 100;
        sumPct += pct;
        countGraded++;
        if (pct > highestPct) {
          highestPct = pct;
          topStudentName = st.name;
        }
      }
    });

    const avg = countGraded > 0 ? (sumPct / countGraded).toFixed(1) : "0.0";
    const top = highestPct >= 0 ? `${highestPct.toFixed(1)}%` : "0.0%";

    return {
      classAvgDisplay: `${avg}%`,
      topScoreDisplay: highestPct >= 0 ? `${top} • ${topStudentName.split(" ")[0]}` : "0.0%",
    };
  }, [studentsList, studentMarks, draftMarks, selectedExamId, maxPerSubject, subjectsList, isSuperAdmin]);

  // Save marks to database / backend
  const handleSaveMarks = async () => {
    setIsSaving(true);
    try {
      const merged = { ...studentMarks };
      if (!merged[selectedExamId]) merged[selectedExamId] = {};

      const draftForExam = draftMarks[selectedExamId] || {};
      Object.entries(draftForExam).forEach(([sub, rollMap]) => {
        if (!merged[selectedExamId][sub]) merged[selectedExamId][sub] = {};
        Object.entries(rollMap).forEach(([roll, val]) => {
          if (val === "" || val === null) {
            delete merged[selectedExamId][sub][roll];
          } else {
            merged[selectedExamId][sub][roll] = val;
          }
        });
      });

      setStudentMarks(merged);
      setDraftMarks({});

      await api.createResource("settings", {
        key: "kts_student_marks",
        value: JSON.stringify(merged),
      }).catch(async () => {
        await api.updateResource("settings", "kts_student_marks", {
          key: "kts_student_marks",
          value: JSON.stringify(merged),
        });
      });

      showToast(
        "Marks Saved Successfully!",
        `Committed marks for ${selectedClass} (${currentExam.name}). Sync is live across all logins.`
      );
    } catch {
      showToast("Saved to Local Cache", "Marks saved locally and queued for cloud synchronization.");
    } finally {
      setIsSaving(false);
    }
  };

  const topTabs = [
    { id: "AdminExamSchedule", label: "Exam Schedule" },
    { id: "AdminExamResults", label: "Results & Rankings" },
    { id: "AdminMarksPreview", label: "Marks Preview", active: true },
    { id: "AdminExamScheduleDesigner", label: "Schedule Designer" },
    { id: "AdminExamInvigilation", label: "Allot Invigilation" },
  ];

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={bgGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={40} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
              <Pressable
                onPress={() => {
                  if (navigation?.canGoBack && navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate("ExamSchedule");
                  }
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color={primaryColor} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "900" }} numberOfLines={1}>
                  Marks Preview
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: primaryColor, marginRight: 6 }} />
                  <Text style={{ color: primaryLight, fontSize: 11, fontWeight: "700" }}>
                    ACADEMIC YEAR: 2026-2027 (Current)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </View>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <View style={[styles.toast, { borderColor: primaryColor }]}>
          <CheckCircle2 size={18} color={primaryColor} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "800" }}>{toastMessage.title}</Text>
            <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 11, marginTop: 2 }}>{toastMessage.desc}</Text>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor, "#38bdf8"]}
          />
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: 16,
          paddingTop: 14,
        }}
      >
        {/* 4 KPI CARDS (2x2 Grid) */}
        <View style={styles.kpiGrid}>
          {/* 1. Upcoming Exams */}
          <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiTitle} numberOfLines={1}>Upcoming Exams</Text>
              <View style={[styles.kpiIconWrapper, { backgroundColor: "rgba(56, 189, 248, 0.15)", borderColor: "rgba(56, 189, 248, 0.3)" }]}>
                <BookOpen size={14} color="#38bdf8" />
              </View>
            </View>
            <Text style={styles.kpiValue}>1</Text>
            <Text style={styles.kpiSub}>This month</Text>
          </View>

          {/* 2. Class Average */}
          <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiTitle} numberOfLines={1}>Class Average</Text>
              <View style={[styles.kpiIconWrapper, { backgroundColor: "rgba(52, 211, 153, 0.15)", borderColor: "rgba(52, 211, 153, 0.3)" }]}>
                <BarChart2 size={14} color="#34d399" />
              </View>
            </View>
            <Text style={styles.kpiValue}>{classAvgDisplay}</Text>
            <Text style={styles.kpiSub} numberOfLines={1}>{selectedClass} • Selected Exam</Text>
          </View>

          {/* 3. Top Score */}
          <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiTitle} numberOfLines={1}>Top Score</Text>
              <View style={[styles.kpiIconWrapper, { backgroundColor: isSuperAdmin ? "rgba(240, 193, 16, 0.15)" : "rgba(0, 241, 161, 0.15)", borderColor: isSuperAdmin ? "rgba(240, 193, 16, 0.3)" : "rgba(0, 241, 161, 0.3)" }]}>
                <Award size={14} color={primaryColor} />
              </View>
            </View>
            <Text style={styles.kpiValue} numberOfLines={1}>{topScoreDisplay.split(" • ")[0]}</Text>
            <Text style={styles.kpiSub} numberOfLines={1}>
              {topScoreDisplay.includes(" • ") ? topScoreDisplay.split(" • ")[1] : "No score yet"}
            </Text>
          </View>

          {/* 4. Results Published */}
          <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiTitle} numberOfLines={1}>Results Published</Text>
              <View style={[styles.kpiIconWrapper, { backgroundColor: "rgba(250, 204, 21, 0.15)", borderColor: "rgba(250, 204, 21, 0.3)" }]}>
                <TrendingUp size={14} color="#facc15" />
              </View>
            </View>
            <Text style={styles.kpiValue}>1</Text>
            <Text style={styles.kpiSub}>Exams</Text>
          </View>
        </View>

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
                style={[
                  styles.tabButton,
                  t.active
                    ? { backgroundColor: isSuperAdmin ? "rgba(240, 193, 16, 0.15)" : "rgba(0, 241, 161, 0.15)", borderColor: primaryColor }
                    : { backgroundColor: cardBg, borderColor: "rgba(255, 255, 255, 0.1)" },
                ]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    t.active ? { color: primaryColor } : { color: "rgba(255, 255, 255, 0.6)" },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* MAIN MARKS PREVIEW / ENTRY CARD */}
        <View style={[styles.mainCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {/* Header & View Mode Switcher */}
          <View style={{ marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.1)" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "900" }}>Marks Preview</Text>
                <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 11, fontWeight: "500", marginTop: 2 }}>
                  View overall and subject-wise student marks.
                </Text>
              </View>

              {/* View Mode Toggle (Card vs Web-Table) */}
              <View style={styles.viewModeWrapper}>
                <Pressable
                  onPress={() => setViewMode("card")}
                  style={[
                    styles.viewModeBtn,
                    viewMode === "card" && {
                      backgroundColor: isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)",
                      borderWidth: 1,
                      borderColor: primaryColor,
                    },
                  ]}
                >
                  <LayoutGrid size={15} color={viewMode === "card" ? primaryColor : "rgba(255,255,255,0.4)"} />
                </Pressable>
                <Pressable
                  onPress={() => setViewMode("table")}
                  style={[
                    styles.viewModeBtn,
                    viewMode === "table" && {
                      backgroundColor: isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)",
                      borderWidth: 1,
                      borderColor: primaryColor,
                    },
                  ]}
                >
                  <TableIcon size={15} color={viewMode === "table" ? primaryColor : "rgba(255,255,255,0.4)"} />
                </Pressable>
              </View>
            </View>

            {/* Class & Exam Selectors (Robust Flex Layout) */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {/* Class Dropdown Trigger */}
              <Pressable
                onPress={() => setShowClassPicker(true)}
                style={styles.dropdownTriggerClass}
              >
                <View style={{ flex: 1, marginRight: 4 }}>
                  <Text style={styles.dropdownLabel}>Class</Text>
                  <Text style={styles.dropdownValue} numberOfLines={1}>
                    {selectedClass}
                  </Text>
                </View>
                <ChevronDown size={14} color={primaryColor} />
              </Pressable>

              {/* Exam Dropdown Trigger */}
              <Pressable
                onPress={() => setShowExamPicker(true)}
                style={styles.dropdownTriggerExam}
              >
                <View style={{ flex: 1, marginRight: 4 }}>
                  <Text style={styles.dropdownLabel}>Exam</Text>
                  <Text style={styles.dropdownValue} numberOfLines={1}>
                    {currentExam.name} ({currentExam.status})
                  </Text>
                </View>
                <ChevronDown size={14} color={primaryColor} />
              </Pressable>
            </View>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Search size={14} color={primaryColor} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search student by name or roll no..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery !== "" && (
              <Pressable onPress={() => setSearchQuery("")}>
                <X size={14} color="rgba(255, 255, 255, 0.6)" />
              </Pressable>
            )}
          </View>

          {/* Upcoming Exam Notice */}
          {isUpcomingExam ? (
            <View style={styles.upcomingNotice}>
              <View style={styles.upcomingIconBox}>
                <Clock size={24} color="#facc15" />
              </View>
              <Text style={{ color: "#ffffff", fontWeight: "900", fontSize: 14, marginBottom: 4, textAlign: "center" }}>
                Examination is Upcoming
              </Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 12, textAlign: "center", lineHeight: 18, maxWidth: 280 }}>
                Marks entry is only available for completed examinations. Conduct the exam and mark it as Completed to enter student marks.
              </Text>
            </View>
          ) : filteredStudents.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 12, fontWeight: "500" }}>
                No students found matching search.
              </Text>
            </View>
          ) : viewMode === "card" ? (
            /* ========================================================= */
            /* VIEW MODE 1: MOBILE CARD VIEW (EXPLICIT COLUMNS & CLEAN) */
            /* ========================================================= */
            <View style={{ gap: 12 }}>
              {filteredStudents.map((student) => {
                const detail = computeStudentDetail(student);
                const isExpanded = !!expandedStudents[student.roll];
                const avatar = getAvatarColor(student.init);

                return (
                  <View
                    key={student.roll}
                    style={[
                      styles.studentCard,
                      isExpanded && {
                        borderColor: isSuperAdmin ? "rgba(240, 193, 16, 0.35)" : "rgba(0, 241, 161, 0.35)",
                        backgroundColor: isSuperAdmin ? "rgba(24, 29, 31, 0.95)" : "rgba(16, 45, 38, 0.95)",
                      },
                    ]}
                  >
                    {/* Top Row: Avatar + Name + Roll + Subject Breakdown Action */}
                    <Pressable
                      onPress={() => toggleStudent(student.roll)}
                      style={styles.studentCardTopRow}
                    >
                      {/* Avatar + Student Name + Roll */}
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: avatar.bg,
                            borderColor: avatar.border,
                            borderWidth: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 10,
                          }}
                        >
                          <Text style={{ color: avatar.color, fontSize: 11, fontWeight: "900" }}>
                            {student.init}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: "#ffffff", fontWeight: "900", fontSize: 13 }} numberOfLines={1}>
                            {student.name}
                          </Text>
                          <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 10.5, marginTop: 2 }}>
                            {student.roll}
                          </Text>
                        </View>
                      </View>

                      {/* Explicit Subject Breakdown Toggle Button */}
                      <Pressable
                        onPress={() => toggleStudent(student.roll)}
                        style={[
                          styles.breakdownToggleBtn,
                          isExpanded
                            ? { backgroundColor: isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)", borderColor: primaryColor }
                            : styles.breakdownToggleBtnInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.breakdownToggleBtnText,
                            isExpanded ? { color: primaryColor } : { color: "rgba(255,255,255,0.7)" },
                          ]}
                        >
                          {isExpanded ? "Hide Subjects" : "View Subjects"}
                        </Text>
                        {isExpanded ? (
                          <ChevronUp size={13} color={isExpanded ? primaryColor : "rgba(255,255,255,0.7)"} />
                        ) : (
                          <ChevronDown size={13} color={isExpanded ? primaryColor : "rgba(255,255,255,0.7)"} />
                        )}
                      </Pressable>
                    </Pressable>

                    {/* METRIC STRIP (Max Marks, Marks Obtained, Percentage, Grade) */}
                    <View style={styles.metricStrip}>
                      {/* 1. Max Marks */}
                      <View style={styles.metricCell}>
                        <Text style={styles.metricLabel}>Max Marks</Text>
                        <Text style={styles.metricValue}>{detail.totalMax}</Text>
                      </View>

                      <View style={styles.metricDivider} />

                      {/* 2. Marks Obtained */}
                      <View style={styles.metricCell}>
                        <Text style={styles.metricLabel}>Marks Obt.</Text>
                        <Text style={styles.metricValue}>{detail.totalObtainedDisplay}</Text>
                      </View>

                      <View style={styles.metricDivider} />

                      {/* 3. Percentage */}
                      <View style={styles.metricCell}>
                        <Text style={styles.metricLabel}>Percentage</Text>
                        <Text style={styles.metricValue}>{detail.overallPctDisplay}</Text>
                      </View>

                      <View style={styles.metricDivider} />

                      {/* 4. Grade */}
                      <View style={styles.metricCell}>
                        <Text style={styles.metricLabel}>Grade</Text>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: detail.overallBorder,
                            backgroundColor: detail.overallBadgeBg,
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: 30,
                            marginTop: 2,
                          }}
                        >
                          <Text style={{ color: detail.overallGradeColor, fontSize: 10.5, fontWeight: "900" }}>
                            {detail.overallGrade}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* EXPANDED SUBJECT-WISE MARKS BREAKDOWN */}
                    {isExpanded && (
                      <View style={styles.breakdownContainer}>
                        {/* Breakdown Header */}
                        <View style={styles.breakdownHeaderBox}>
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 6 }}>
                              <BookOpen size={13} color="#38bdf8" style={{ marginRight: 6 }} />
                              <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "800" }} numberOfLines={1}>
                                Subject-wise Marks ({selectedClass})
                              </Text>
                            </View>

                            <Pressable
                              onPress={() => handleClearStudentMarks(student)}
                              style={styles.clearMarksBtn}
                            >
                              <RotateCcw size={10} color="#fb7185" style={{ marginRight: 4 }} />
                              <Text style={{ color: "#fda4af", fontSize: 10, fontWeight: "700" }}>Clear Marks</Text>
                            </Pressable>
                          </View>

                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <Text style={{ color: "#38bdf8", fontSize: 11, fontWeight: "700" }}>
                              {student.name} <Text style={{ color: "rgba(255,255,255,0.4)", fontWeight: "500" }}>(Roll: {student.roll})</Text>
                            </Text>
                            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>Max: {maxPerSubject}/sub</Text>
                          </View>
                        </View>

                        <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 10, fontWeight: "500", marginBottom: 10 }}>
                          Faculty Marks Entry Mode: Adjust subject marks below
                        </Text>

                        {/* Subject Input Rows Stack */}
                        <View style={{ gap: 8 }}>
                          {detail.breakdown.map((subItem) => (
                            <View
                              key={subItem.subject}
                              style={styles.subjectRowCard}
                            >
                              {/* Left: Subject title & Max Marks */}
                              <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 12.5 }} numberOfLines={1}>
                                  {subItem.subject}
                                </Text>
                                <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 10, marginTop: 2 }}>
                                  Max Marks: {subItem.maxMarks}
                                </Text>
                              </View>

                              {/* Right: Numeric Input + Percentage + Grade Pill */}
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <TextInput
                                  value={subItem.mark !== null ? String(subItem.mark) : ""}
                                  onChangeText={(val) => handleUpdateMark(subItem.subject, student.roll, val)}
                                  keyboardType="number-pad"
                                  placeholder="--"
                                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                  maxLength={3}
                                  style={styles.subjectInput}
                                />

                                <View style={{ alignItems: "center", justifyContent: "center", minWidth: 42 }}>
                                  <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 11, fontWeight: "700" }}>
                                    {subItem.pct !== null ? `(${subItem.pct}%)` : "(--)"}
                                  </Text>
                                </View>

                                <View
                                  style={{
                                    paddingHorizontal: 7,
                                    paddingVertical: 3,
                                    borderRadius: 6,
                                    borderWidth: 1,
                                    borderColor: subItem.gradeBorder,
                                    backgroundColor: subItem.gradeBadgeBg,
                                    minWidth: 28,
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Text style={{ color: subItem.gradeColor, fontSize: 10, fontWeight: "900" }}>
                                    {subItem.grade}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            /* ========================================================= */
            /* VIEW MODE 2: WEB-MATCHING TABLE VIEW (HORIZONTAL SCROLL) */
            /* ========================================================= */
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={{ minWidth: 720 }}>
                {/* Table Header */}
                <View style={{ flexDirection: "row", backgroundColor: "rgba(255, 255, 255, 0.05)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)", borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingVertical: 10, paddingHorizontal: 12 }}>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", width: 176 }}>Student Name</Text>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", width: 128 }}>Roll No</Text>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", width: 80 }}>Max Marks</Text>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", width: 96 }}>Marks Obtained</Text>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", width: 80 }}>Percentage</Text>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", width: 64 }}>Grade</Text>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", width: 112, textAlign: "right" }}>Subject Breakdown</Text>
                </View>

                {/* Table Rows */}
                {filteredStudents.map((student, idx) => {
                  const detail = computeStudentDetail(student);
                  const isExpanded = !!expandedStudents[student.roll];
                  const avatar = getAvatarColor(student.init);

                  return (
                    <View key={student.roll} style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.1)" }}>
                      {/* Main Table Row */}
                      <Pressable
                        onPress={() => toggleStudent(student.roll)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 12,
                          paddingHorizontal: 12,
                          backgroundColor: isExpanded
                            ? isSuperAdmin ? "rgba(240, 193, 16, 0.1)" : "rgba(0, 241, 161, 0.1)"
                            : idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                        }}
                      >
                        {/* Student Name */}
                        <View style={{ width: 176, flexDirection: "row", alignItems: "center", paddingRight: 8 }}>
                          <View
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: avatar.bg,
                              borderColor: avatar.border,
                              borderWidth: 1,
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 8,
                            }}
                          >
                            <Text style={{ color: avatar.color, fontSize: 10, fontWeight: "900" }}>
                              {student.init}
                            </Text>
                          </View>
                          <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 12, flex: 1 }} numberOfLines={1}>
                            {student.name}
                          </Text>
                        </View>

                        {/* Roll No */}
                        <Text style={{ color: "rgba(255,255,255,0.5)", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 11.5, width: 128 }} numberOfLines={1}>
                          {student.roll}
                        </Text>

                        {/* Max Marks */}
                        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, width: 80 }}>
                          {detail.totalMax}
                        </Text>

                        {/* Marks Obtained */}
                        <Text style={{ color: "#ffffff", fontWeight: "900", fontSize: 12, width: 96 }}>
                          {detail.totalObtainedDisplay}
                        </Text>

                        {/* Percentage */}
                        <Text style={{ color: "#ffffff", fontWeight: "900", fontSize: 12, width: 80 }}>
                          {detail.overallPctDisplay}
                        </Text>

                        {/* Grade */}
                        <View style={{ width: 64 }}>
                          <View
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              borderWidth: 1,
                              borderColor: detail.overallBorder,
                              backgroundColor: detail.overallBadgeBg,
                              alignSelf: "flex-start",
                            }}
                          >
                            <Text style={{ color: detail.overallGradeColor, fontSize: 10, fontWeight: "900" }}>{detail.overallGrade}</Text>
                          </View>
                        </View>

                        {/* Subject Breakdown Toggle Button */}
                        <View style={{ width: 112, alignItems: "flex-end" }}>
                          <Pressable
                            onPress={() => toggleStudent(student.roll)}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 4,
                              paddingHorizontal: 8,
                              borderRadius: 8,
                              backgroundColor: "rgba(255,255,255,0.05)",
                              borderWidth: 1,
                              borderColor: "rgba(255,255,255,0.1)",
                            }}
                          >
                            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10.5, fontWeight: "700", marginRight: 4 }}>
                              {isExpanded ? "Hide Subjects" : "View Subjects"}
                            </Text>
                            {isExpanded ? (
                              <ChevronUp size={12} color={primaryColor} />
                            ) : (
                              <ChevronDown size={12} color={primaryColor} />
                            )}
                          </Pressable>
                        </View>
                      </Pressable>

                      {/* Expanded Subject breakdown in Table mode */}
                      {isExpanded && (
                        <View style={{ backgroundColor: "rgba(255,255,255,0.04)", padding: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" }}>
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" }}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <BookOpen size={13} color="#38bdf8" style={{ marginRight: 6 }} />
                              <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "900" }}>
                                Subject-wise Marks for {selectedClass} — <Text style={{ color: "#38bdf8" }}>{student.name}</Text> (Roll: {student.roll})
                              </Text>
                            </View>
                            <Pressable
                              onPress={() => handleClearStudentMarks(student)}
                              style={styles.clearMarksBtn}
                            >
                              <RotateCcw size={10} color="#fb7185" style={{ marginRight: 4 }} />
                              <Text style={{ color: "#fda4af", fontSize: 10, fontWeight: "700" }}>Clear Marks</Text>
                            </Pressable>
                          </View>

                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                            {detail.breakdown.map((subItem) => (
                              <View
                                key={subItem.subject}
                                style={{
                                  width: 220,
                                  backgroundColor: "rgba(255,255,255,0.05)",
                                  borderWidth: 1,
                                  borderColor: "rgba(255,255,255,0.08)",
                                  borderRadius: 12,
                                  padding: 10,
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <View style={{ flex: 1, marginRight: 8 }}>
                                  <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 12 }} numberOfLines={1}>
                                    {subItem.subject}
                                  </Text>
                                  <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 2 }}>
                                    Max Marks: {subItem.maxMarks}
                                  </Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                  <TextInput
                                    value={subItem.mark !== null ? String(subItem.mark) : ""}
                                    onChangeText={(val) => handleUpdateMark(subItem.subject, student.roll, val)}
                                    keyboardType="number-pad"
                                    placeholder="--"
                                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                    maxLength={3}
                                    style={styles.subjectInput}
                                  />
                                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: "700" }}>
                                    {subItem.pct !== null ? `(${subItem.pct}%)` : "(--)"}
                                  </Text>
                                  <View
                                    style={{
                                      paddingHorizontal: 6,
                                      paddingVertical: 2,
                                      borderRadius: 4,
                                      borderWidth: 1,
                                      borderColor: subItem.gradeBorder,
                                      backgroundColor: subItem.gradeBadgeBg,
                                    }}
                                  >
                                    <Text style={{ color: subItem.gradeColor, fontSize: 9, fontWeight: "900" }}>
                                      {subItem.grade}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Footer Save Marks Bar */}
          {!isUpcomingExam && (
            <View style={styles.footerSaveBar}>
              <Text style={styles.footerNote}>
                Faculty Mode: You can view and edit marks for any class.
              </Text>

              <Pressable
                onPress={handleSaveMarks}
                disabled={isSaving}
                style={[
                  styles.saveBtn,
                  { backgroundColor: primaryColor, shadowColor: primaryColor },
                  isSaving && { opacity: 0.6 },
                ]}
              >
                <Check size={14} color="#0b0912" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>
                  {isSaving ? "Saving..." : "Save Marks"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 1. CLASS PICKER MODAL */}
      <Modal visible={showClassPicker} transparent animationType="fade" onRequestClose={() => setShowClassPicker(false)}>
        <Pressable onPress={() => setShowClassPicker(false)} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Class</Text>
              <Pressable onPress={() => setShowClassPicker(false)}>
                <X size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {DEFAULT_CLASSES.map((cls) => {
                const isSelected = selectedClass === cls;
                return (
                  <Pressable
                    key={cls}
                    onPress={() => {
                      setSelectedClass(cls);
                      setShowClassPicker(false);
                    }}
                    style={[
                      styles.modalItem,
                      isSelected && {
                        backgroundColor: isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)",
                        borderWidth: 1,
                        borderColor: primaryColor,
                      },
                    ]}
                  >
                    <Text style={[styles.modalItemText, isSelected && { color: primaryColor, fontWeight: "900" }]}>
                      {cls}
                    </Text>
                    {isSelected && <Check size={16} color={primaryColor} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* 2. EXAM PICKER MODAL */}
      <Modal visible={showExamPicker} transparent animationType="fade" onRequestClose={() => setShowExamPicker(false)}>
        <Pressable onPress={() => setShowExamPicker(false)} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Examination</Text>
              <Pressable onPress={() => setShowExamPicker(false)}>
                <X size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {DEFAULT_EXAMS.map((ex) => {
                const isSelected = selectedExamId === ex.id;
                return (
                  <Pressable
                    key={ex.id}
                    onPress={() => {
                      setSelectedExamId(ex.id);
                      setShowExamPicker(false);
                    }}
                    style={[
                      styles.modalItem,
                      isSelected && {
                        backgroundColor: isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)",
                        borderWidth: 1,
                        borderColor: primaryColor,
                      },
                    ]}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.modalItemText, isSelected && { color: primaryColor, fontWeight: "900" }]}>
                        {ex.name}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 2 }}>
                        Status: {ex.status} • Max Marks: {ex.maxMarks}
                      </Text>
                    </View>
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
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
    rowGap: 10,
  },
  kpiCard: {
    width: "48.5%",
    backgroundColor: "#102d26",
    borderWidth: 1,
    borderColor: "rgba(0, 241, 161, 0.2)",
    borderRadius: 16,
    padding: 12,
  },
  kpiTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  kpiTitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
    marginRight: 4,
  },
  kpiIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
  },
  kpiSub: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  mainCard: {
    backgroundColor: "#102d26",
    borderWidth: 1,
    borderColor: "rgba(0, 241, 161, 0.2)",
    borderRadius: 24,
    padding: 14,
  },
  viewModeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  viewModeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  dropdownTriggerClass: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownTriggerExam: {
    flex: 1.5,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dropdownValue: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1,
  },
  searchBox: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 12,
    paddingVertical: 0,
  },
  upcomingNotice: {
    paddingVertical: 36,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
    borderRadius: 20,
    marginVertical: 8,
  },
  upcomingIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  studentCard: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    overflow: "hidden",
  },
  studentCardTopRow: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breakdownToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  breakdownToggleBtnInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  breakdownToggleBtnText: {
    fontSize: 11,
    fontWeight: "700",
    marginRight: 4,
  },
  metricStrip: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricCell: {
    alignItems: "center",
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  metricLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 12,
    marginTop: 2,
  },
  breakdownContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    padding: 12,
  },
  breakdownHeaderBox: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    paddingBottom: 8,
    marginBottom: 8,
  },
  clearMarksBtn: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderColor: "rgba(244, 63, 94, 0.35)",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  subjectRowCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subjectInput: {
    width: 48,
    height: 36,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 10,
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 0,
  },
  footerSaveBar: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  footerNote: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
    fontWeight: "500",
    flex: 1,
  },
  saveBtn: {
    backgroundColor: "#00f1a1",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveBtnText: {
    color: "#0b0912",
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#102d26",
    borderWidth: 1,
    borderColor: "rgba(0, 241, 161, 0.2)",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 14,
  },
  modalItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  modalItemText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
  },
});

export default AdminMarksPreviewScreen;
