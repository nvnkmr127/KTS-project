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
  ChevronDown,
  ChevronUp,
  X,
  Search,
  Check,
  LayoutGrid,
  Table as TableIcon,
  Crown,
  Sparkles,
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
    id: "1",
    name: "FA 1",
    classes: "Class 10A, 9A, 8A, 7A, 6A",
    subject: "All Subjects",
    date: "01-09-2027",
    maxMarks: 20,
    status: "Results Published",
  },
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
  "Class 8A",
  "Class 4B",
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
  "Class 8A": {
    subjects: ["Telugu", "Hindi", "English", "Maths", "Physics", "Biology", "Social"],
    maxPerSub: 20,
  },
  "Class 4B": {
    subjects: ["Telugu", "Hindi", "English", "Maths", "GK", "EVS"],
    maxPerSub: 50,
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
  "Class 8A": [
    { id: "s-101", name: "BODAPOTHULA ABHILASH GOUD", roll: "STDDe2026400", init: "BG" },
    { id: "s-104", name: "RALLAMOLLA NIHARIKA", roll: "STDDe2026444", init: "RN" },
    { id: "s-126", name: "Bantu Varshini", roll: "145", init: "BV" },
    { id: "s-127", name: "Begari Chandana", roll: "146", init: "BC" },
    { id: "s-128", name: "Chakali Nandhini", roll: "147", init: "CN" },
    { id: "s-129", name: "Chakali Navadeep", roll: "148", init: "CN" },
    { id: "s-130", name: "Chakali Sharanya Sri", roll: "149", init: "CS" },
    { id: "s-131", name: "Chakali Sneha", roll: "150", init: "CS" },
    { id: "s-109", name: "Chakali Vishnu Charan", roll: "151", init: "CC" },
    { id: "s-110", name: "Dosada Vaishnavi", roll: "152", init: "DV" },
    { id: "s-103", name: "GAJJAGANI CHAITANYA", roll: "STDDe2026459", init: "GC" },
    { id: "s-111", name: "Gundala Manoj Kumar", roll: "153", init: "GK" },
    { id: "s-112", name: "Harijan Nani", roll: "154", init: "HN" },
    { id: "s-113", name: "Karike Chandana", roll: "155", init: "KC" },
    { id: "s-107", name: "KAVALI ANANYA", roll: "STDDe2026446", init: "KA" },
    { id: "s-106", name: "MALAPATI LASYA", roll: "STDDe2026447", init: "ML" },
    { id: "s-105", name: "MALAPATI RISHITHA", roll: "STDDe2026448", init: "MR" },
    { id: "s-114", name: "Mohammad Sohel Khan", roll: "156", init: "MK" },
    { id: "s-115", name: "P Akhil", roll: "157", init: "PA" },
    { id: "s-116", name: "P Pranaya", roll: "158", init: "PP" },
    { id: "s-117", name: "Papayolla Archana", roll: "159", init: "PA" },
    { id: "s-118", name: "Pegula Sanjay Goud", roll: "160", init: "PS" },
    { id: "s-119", name: "Pegula Swathi", roll: "161", init: "PS" },
    { id: "s-120", name: "Rathod Maheshwari", roll: "162", init: "RM" },
    { id: "s-121", name: "Sara Sathvik", roll: "163", init: "SS" },
    { id: "s-122", name: "Sara Uday Kiran", roll: "164", init: "SU" },
    { id: "s-108", name: "SATHWIK BANDA", roll: "STDDe2026450", init: "SB" },
    { id: "s-102", name: "SHIVVAMOLLA SATHVIKA", roll: "STDDe2026451", init: "SS" },
    { id: "s-124", name: "Tammiyu Adi Sankar", roll: "166", init: "TA" },
    { id: "s-125", name: "Talakalapally Rishi Kumar", roll: "167", init: "TR" },
  ],
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

export const TeacherExamResultsScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { headerPaddingTop } = useResponsive();

  const [selectedClass, setSelectedClass] = useState<string>("Class 8A");
  const [selectedExamId, setSelectedExamId] = useState<string>("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
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

  // Hardware Back Handler
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Examination");
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

  const currentClassConfig = useMemo(() => {
    return CLASS_SUBJECTS_MAP[selectedClass] || CLASS_SUBJECTS_MAP.default;
  }, [selectedClass]);

  const subjectsList = currentClassConfig.subjects;
  const maxPerSubject = currentExam.maxMarks ? Math.min(currentExam.maxMarks, currentClassConfig.maxPerSub) : currentClassConfig.maxPerSub;

  const rawStudentsList = useMemo(() => {
    return SAMPLE_STUDENTS_BY_CLASS[selectedClass] || SAMPLE_STUDENTS_BY_CLASS["Class 8A"] || [];
  }, [selectedClass]);

  // Helper to fetch mark for a student
  const getMark = useCallback(
    (subject: string, roll: string): number | null => {
      const val = studentMarks[selectedExamId]?.[subject]?.[roll];
      if (val !== undefined && val !== null && val !== "" && !isNaN(Number(val))) {
        return Number(val);
      }
      return null;
    },
    [studentMarks, selectedExamId]
  );

  // Compute results for each student with Rank & Grade
  const rankedResults = useMemo(() => {
    const list = rawStudentsList.map((st) => {
      let totalObtained = 0;
      let hasAny = false;

      const subjectBreakdown = subjectsList.map((sub) => {
        const mark = getMark(sub, st.roll);
        if (mark !== null) {
          totalObtained += mark;
          hasAny = true;
        }
        return {
          subject: sub,
          mark,
          maxMarks: maxPerSubject,
        };
      });

      const totalMax = subjectBreakdown.length * maxPerSubject;
      const pct = hasAny && totalMax > 0 ? (totalObtained / totalMax) * 100 : null;
      let grade = "--";
      let gradeColor = "#a1a1aa";
      let gradeBadgeBg = "rgba(255, 255, 255, 0.05)";
      let gradeBorder = "rgba(255, 255, 255, 0.1)";

      if (pct !== null) {
        if (pct >= 90) {
          grade = "A+";
          gradeColor = "#ddb7ff";
          gradeBadgeBg = "rgba(168, 85, 247, 0.2)";
          gradeBorder = "rgba(168, 85, 247, 0.45)";
        } else if (pct >= 75) {
          grade = "A";
          gradeColor = "#00f1a1";
          gradeBadgeBg = "rgba(16, 185, 129, 0.2)";
          gradeBorder = "rgba(16, 185, 129, 0.45)";
        } else if (pct >= 65) {
          grade = "B+";
          gradeColor = "#38bdf8";
          gradeBadgeBg = "rgba(56, 189, 248, 0.2)";
          gradeBorder = "rgba(56, 189, 248, 0.45)";
        } else if (pct >= 50) {
          grade = "B";
          gradeColor = "#facc15";
          gradeBadgeBg = "rgba(245, 158, 11, 0.2)";
          gradeBorder = "rgba(245, 158, 11, 0.45)";
        } else {
          grade = "C";
          gradeColor = "#fb7185";
          gradeBadgeBg = "rgba(244, 63, 94, 0.2)";
          gradeBorder = "rgba(244, 63, 94, 0.45)";
        }
      }

      return {
        ...st,
        subjectBreakdown,
        totalObtained,
        totalMax,
        pct,
        percentageDisplay: pct !== null ? `${pct.toFixed(1).replace(/\.0$/, "")}%` : "--",
        grade,
        gradeColor,
        gradeBadgeBg,
        gradeBorder,
        hasAny,
      };
    });

    // Sort by percentage descending for ranking
    const graded = list.filter((item) => item.hasAny).sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
    const unGraded = list.filter((item) => !item.hasAny);

    let rankCounter = 1;
    const rankedGraded = graded.map((item, index) => {
      if (index > 0 && item.pct === graded[index - 1].pct) {
        // Tie rank
        return { ...item, rank: rankCounter };
      }
      rankCounter = index + 1;
      return { ...item, rank: rankCounter };
    });

    const finalRanked = [
      ...rankedGraded,
      ...unGraded.map((item) => ({ ...item, rank: null as number | null })),
    ];

    return finalRanked;
  }, [rawStudentsList, subjectsList, maxPerSubject, getMark]);

  // Filtered by search query
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return rankedResults;
    const q = searchQuery.toLowerCase().trim();
    return rankedResults.filter(
      (s) => s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q)
    );
  }, [rankedResults, searchQuery]);

  // Performance KPI Metrics Computations
  const { classAvgDisplay, topScoreDisplay, topStudentName } = useMemo(() => {
    const graded = rankedResults.filter((r) => r.hasAny && r.pct !== null);
    if (graded.length === 0) {
      return { classAvgDisplay: "0.0%", topScoreDisplay: "0.0%", topStudentName: "No score yet" };
    }

    const sumPct = graded.reduce((acc, r) => acc + (r.pct ?? 0), 0);
    const avg = sumPct / graded.length;
    const top = graded[0];

    return {
      classAvgDisplay: `${avg.toFixed(1)}%`,
      topScoreDisplay: `${(top.pct ?? 0).toFixed(1)}%`,
      topStudentName: top.name,
    };
  }, [rankedResults]);

  // Subject Averages Calculation for Visual Bar Chart
  const subjectAverages = useMemo(() => {
    return subjectsList.map((sub) => {
      let sum = 0;
      let count = 0;
      rankedResults.forEach((r) => {
        const subData = r.subjectBreakdown.find((s) => s.subject === sub);
        if (subData && subData.mark !== null) {
          sum += (subData.mark / maxPerSubject) * 100;
          count++;
        }
      });
      const avg = count > 0 ? Math.round(sum / count) : 0;
      return {
        subject: sub,
        avg,
      };
    });
  }, [subjectsList, rankedResults, maxPerSubject]);

  // Grade Distribution
  const gradeDistribution = useMemo(() => {
    const counts: Record<string, number> = { "A+": 0, "A": 0, "B+": 0, "B": 0, "C": 0 };
    let gradedCount = 0;
    rankedResults.forEach((r) => {
      if (r.hasAny && r.grade && r.grade !== "--") {
        counts[r.grade] = (counts[r.grade] || 0) + 1;
        gradedCount++;
      }
    });

    const gradesList = [
      { grade: "A+", label: "A+", count: counts["A+"] || 0, color: "#ddb7ff" },
      { grade: "A", label: "A", count: counts["A"] || 0, color: "#00f1a1" },
      { grade: "B+", label: "B+", count: counts["B+"] || 0, color: "#38bdf8" },
      { grade: "B", label: "B", count: counts["B"] || 0, color: "#facc15" },
      { grade: "C", label: "C", count: counts["C"] || 0, color: "#fb7185" },
    ];

    return { gradesList, gradedCount };
  }, [rankedResults]);

  const topTabs = [
    { id: "TeacherExamSchedule", label: "Exam Schedule" },
    { id: "TeacherExamResults", label: "Results & Rankings", active: true },
    { id: "MarksEntry", label: "Marks Entry" },
    { id: "TeacherExamSchedulePreview", label: "Schedule Preview" },
    { id: "TeacherExamInvigilation", label: "Exam Invisilation" },
  ];

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={["#22143d", "#150d26", "#0b0912", "#08070d"]}
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
                onPress={() => navigation.navigate("Examination")}
                style={styles.backBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color="#ddb7ff" />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "900" }} numberOfLines={1}>
                  Results & Rankings
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#00f1a1", marginRight: 6 }} />
                  <Text style={{ color: "#ddb7ff", fontSize: 11, fontWeight: "700" }}>
                    ACADEMIC YEAR: 2026-2027 (Current)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ddb7ff"
            colors={["#ddb7ff", "#38bdf8"]}
          />
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 16,
          paddingTop: 14,
        }}
      >
        {/* 4 KPI CARDS (2x2 Grid) */}
        <View style={styles.kpiGrid}>
          {/* 1. Upcoming Exams */}
          <View style={styles.kpiCard}>
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
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiTitle} numberOfLines={1}>Class Average</Text>
              <View style={[styles.kpiIconWrapper, { backgroundColor: "rgba(52, 211, 153, 0.15)", borderColor: "rgba(52, 211, 153, 0.3)" }]}>
                <BarChart2 size={14} color="#34d399" />
              </View>
            </View>
            <Text style={styles.kpiValue}>{classAvgDisplay}</Text>
            <Text style={styles.kpiSub} numberOfLines={1}>{selectedClass} · Selected Exam</Text>
          </View>

          {/* 3. Top Score */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiTitle} numberOfLines={1}>Top Score</Text>
              <View style={[styles.kpiIconWrapper, { backgroundColor: "rgba(168, 85, 247, 0.15)", borderColor: "rgba(168, 85, 247, 0.3)" }]}>
                <Award size={14} color="#ddb7ff" />
              </View>
            </View>
            <Text style={styles.kpiValue} numberOfLines={1}>{topScoreDisplay}</Text>
            <Text style={styles.kpiSub} numberOfLines={1}>
              {topStudentName}
            </Text>
          </View>

          {/* 4. Results Published */}
          <View style={styles.kpiCard}>
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
                  t.active ? styles.tabButtonActive : styles.tabButtonInactive,
                ]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    t.active ? styles.tabButtonTextActive : styles.tabButtonTextInactive,
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* MAIN RESULTS & RANKINGS CARD */}
        <View style={styles.mainCard}>
          {/* Header & View Mode Switcher */}
          <View style={{ marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.1)" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "900" }}>
                  Results — {currentExam.name}
                </Text>
                <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 11, fontWeight: "500", marginTop: 2 }}>
                  Rankings based on overall percentage obtained
                </Text>
              </View>

              {/* View Mode Toggle (Card vs Web-Table) */}
              <View style={styles.viewModeWrapper}>
                <Pressable
                  onPress={() => setViewMode("card")}
                  style={[styles.viewModeBtn, viewMode === "card" && styles.viewModeBtnActive]}
                >
                  <LayoutGrid size={15} color={viewMode === "card" ? "#ddb7ff" : "rgba(255,255,255,0.4)"} />
                </Pressable>
                <Pressable
                  onPress={() => setViewMode("table")}
                  style={[styles.viewModeBtn, viewMode === "table" && styles.viewModeBtnActive]}
                >
                  <TableIcon size={15} color={viewMode === "table" ? "#ddb7ff" : "rgba(255,255,255,0.4)"} />
                </Pressable>
              </View>
            </View>

            {/* Class & Exam Selectors */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {/* Class Dropdown */}
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
                <ChevronDown size={14} color="#ddb7ff" />
              </Pressable>

              {/* Exam Dropdown */}
              <Pressable
                onPress={() => setShowExamPicker(true)}
                style={styles.dropdownTriggerExam}
              >
                <View style={{ flex: 1, marginRight: 4 }}>
                  <Text style={styles.dropdownLabel}>Exam</Text>
                  <Text style={styles.dropdownValue} numberOfLines={1}>
                    {currentExam.name}
                  </Text>
                </View>
                <ChevronDown size={14} color="#ddb7ff" />
              </Pressable>
            </View>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Search size={14} color="#ddb7ff" style={{ marginRight: 8 }} />
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

          {/* RESULTS CONTENT */}
          {filteredResults.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 12, fontWeight: "500" }}>
                No student marks recorded yet for {selectedClass}.
              </Text>
            </View>
          ) : viewMode === "card" ? (
            /* ========================================================= */
            /* VIEW MODE 1: MOBILE CARD VIEW */
            /* ========================================================= */
            <View style={{ gap: 12 }}>
              {filteredResults.map((item) => {
                const avatar = getAvatarColor(item.init);
                const isTopRank = item.rank === 1;

                return (
                  <View
                    key={item.roll}
                    style={[
                      styles.studentCard,
                      isTopRank && styles.studentCardTopRank,
                    ]}
                  >
                    {/* Header Row: Rank Badge + Avatar + Name + Grade */}
                    <View style={styles.studentCardHeader}>
                      {/* Left: Rank + Avatar + Name */}
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
                        {/* Rank Badge */}
                        <View
                          style={[
                            styles.rankBadge,
                            item.rank === 1
                              ? styles.rankBadge1
                              : item.rank === 2
                              ? styles.rankBadge2
                              : item.rank === 3
                              ? styles.rankBadge3
                              : styles.rankBadgeDefault,
                          ]}
                        >
                          {item.rank === 1 && <Crown size={10} color="#facc15" style={{ marginRight: 2 }} />}
                          <Text
                            style={[
                              styles.rankText,
                              item.rank === 1
                                ? { color: "#facc15" }
                                : item.rank === 2
                                ? { color: "#38bdf8" }
                                : item.rank === 3
                                ? { color: "#ddb7ff" }
                                : { color: "rgba(255,255,255,0.4)" },
                            ]}
                          >
                            {item.rank !== null ? `#${item.rank}` : "--"}
                          </Text>
                        </View>

                        {/* Avatar */}
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: avatar.bg,
                            borderColor: avatar.border,
                            borderWidth: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 10,
                          }}
                        >
                          <Text style={{ color: avatar.color, fontSize: 11, fontWeight: "900" }}>
                            {item.init}
                          </Text>
                        </View>

                        {/* Name & Roll */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: "#ffffff", fontWeight: "900", fontSize: 13 }} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 10.5, marginTop: 1 }}>
                            {item.roll}
                          </Text>
                        </View>
                      </View>

                      {/* Right: Total & Grade */}
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ color: "#ffffff", fontWeight: "900", fontSize: 12.5 }}>
                          {item.hasAny ? `${item.totalObtained}/${item.totalMax}` : "--"}
                          {item.hasAny && (
                            <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 10.5, fontWeight: "600" }}>
                              {" "}
                              ({item.percentageDisplay})
                            </Text>
                          )}
                        </Text>

                        <View
                          style={{
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: item.gradeBorder,
                            backgroundColor: item.gradeBadgeBg,
                            minWidth: 28,
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 3,
                          }}
                        >
                          <Text style={{ color: item.gradeColor, fontSize: 10, fontWeight: "900" }}>
                            {item.grade}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Subject Marks Breakdown Chips Strip */}
                    <View style={styles.subjectsStrip}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                        {item.subjectBreakdown.map((sub) => {
                          const isHigh = sub.mark !== null && sub.mark >= sub.maxMarks * 0.85;
                          const isLow = sub.mark !== null && sub.mark < sub.maxMarks * 0.35;

                          return (
                            <View
                              key={sub.subject}
                              style={[
                                styles.subjectChip,
                                isHigh && { borderColor: "rgba(0, 241, 161, 0.35)", backgroundColor: "rgba(0, 241, 161, 0.08)" },
                                isLow && { borderColor: "rgba(244, 63, 94, 0.35)", backgroundColor: "rgba(244, 63, 94, 0.08)" },
                              ]}
                            >
                              <Text style={styles.subjectChipTitle}>{sub.subject}:</Text>
                              <Text
                                style={[
                                  styles.subjectChipMark,
                                  isHigh ? { color: "#00f1a1" } : isLow ? { color: "#fb7185" } : { color: "#ffffff" },
                                ]}
                              >
                                {sub.mark !== null ? sub.mark : "--"}
                              </Text>
                            </View>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            /* ========================================================= */
            /* VIEW MODE 2: WEB-MATCHING TABLE VIEW (HORIZONTAL SCROLL) */
            /* ========================================================= */
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={{ minWidth: 650 + subjectsList.length * 60 }}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeadCol, { width: 55 }]}>Rank</Text>
                  <Text style={[styles.tableHeadCol, { width: 180 }]}>Student</Text>
                  {subjectsList.map((sub) => (
                    <Text key={sub} style={[styles.tableHeadCol, { width: 65, textAlign: "center" }]}>
                      {sub}
                    </Text>
                  ))}
                  <Text style={[styles.tableHeadCol, { width: 110, textAlign: "right" }]}>Total</Text>
                  <Text style={[styles.tableHeadCol, { width: 65, textAlign: "center" }]}>Grade</Text>
                </View>

                {/* Table Rows */}
                {filteredResults.map((item, idx) => {
                  const avatar = getAvatarColor(item.init);
                  return (
                    <View
                      key={item.roll}
                      style={[
                        styles.tableRow,
                        idx % 2 === 0 ? { backgroundColor: "rgba(255, 255, 255, 0.02)" } : { backgroundColor: "transparent" },
                      ]}
                    >
                      {/* Rank */}
                      <Text style={[styles.tableCellRank, { width: 55 }]}>
                        {item.rank !== null ? `#${item.rank}` : "--"}
                      </Text>

                      {/* Student */}
                      <View style={{ width: 180, flexDirection: "row", alignItems: "center", paddingRight: 8 }}>
                        <View
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            backgroundColor: avatar.bg,
                            borderColor: avatar.border,
                            borderWidth: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 8,
                          }}
                        >
                          <Text style={{ color: avatar.color, fontSize: 9.5, fontWeight: "900" }}>
                            {item.init}
                          </Text>
                        </View>
                        <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 12, flex: 1 }} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>

                      {/* Subject Marks */}
                      {item.subjectBreakdown.map((sub) => {
                        const isHigh = sub.mark !== null && sub.mark >= sub.maxMarks * 0.85;
                        const isLow = sub.mark !== null && sub.mark < sub.maxMarks * 0.35;

                        return (
                          <Text
                            key={sub.subject}
                            style={[
                              styles.tableCellSubject,
                              { width: 65 },
                              isHigh ? { color: "#00f1a1" } : isLow ? { color: "#fb7185" } : { color: "#ffffff" },
                            ]}
                          >
                            {sub.mark !== null ? sub.mark : "--"}
                          </Text>
                        );
                      })}

                      {/* Total */}
                      <View style={{ width: 110, alignItems: "flex-end" }}>
                        <Text style={{ color: "#ffffff", fontWeight: "900", fontSize: 12 }}>
                          {item.hasAny ? `${item.totalObtained}/${item.totalMax}` : "--"}
                        </Text>
                        {item.hasAny && (
                          <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 10 }}>
                            ({item.percentageDisplay})
                          </Text>
                        )}
                      </View>

                      {/* Grade */}
                      <View style={{ width: 65, alignItems: "center" }}>
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            borderWidth: 1,
                            borderColor: item.gradeBorder,
                            backgroundColor: item.gradeBadgeBg,
                          }}
                        >
                          <Text style={{ color: item.gradeColor, fontSize: 9.5, fontWeight: "900" }}>
                            {item.grade}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>

        {/* 2 ANALYTICAL CARDS: SUBJECT AVERAGES & GRADE DISTRIBUTION */}
        <View style={{ gap: 14, marginTop: 14 }}>
          {/* 1. SUBJECT AVERAGES (%) */}
          <View style={styles.analyticsCard}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={styles.analyticsTitle}>Subject Averages (%)</Text>
              <BarChart2 size={15} color="#ddb7ff" />
            </View>

            {/* Visual Subject Bars */}
            <View style={{ gap: 10 }}>
              {subjectAverages.map((sub) => (
                <View key={sub.subject} style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: "#ffffff", fontSize: 11.5, fontWeight: "700" }}>{sub.subject}</Text>
                    <Text style={{ color: "#ddb7ff", fontSize: 11.5, fontWeight: "900" }}>{sub.avg}%</Text>
                  </View>

                  <View style={styles.barTrack}>
                    <LinearGradient
                      colors={["#a855f7", "#c084fc", "#ddb7ff"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.barFill, { width: `${sub.avg}%` }]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 2. GRADE DISTRIBUTION */}
          <View style={styles.analyticsCard}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={styles.analyticsTitle}>Grade Distribution</Text>
              <Award size={15} color="#00f1a1" />
            </View>

            {/* Grade Bars */}
            <View style={{ gap: 8 }}>
              {gradeDistribution.gradesList.map((g) => {
                const pct =
                  gradeDistribution.gradedCount > 0
                    ? Math.round((g.count / gradeDistribution.gradedCount) * 100)
                    : 0;

                return (
                  <View key={g.grade} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={{ color: "#ffffff", fontWeight: "900", fontSize: 12, width: 24 }}>
                      {g.grade}
                    </Text>
                    <View style={[styles.barTrack, { flex: 1 }]}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${pct}%`, backgroundColor: g.color },
                        ]}
                      />
                    </View>
                    <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 11, fontWeight: "700", width: 20, textAlign: "right" }}>
                      {g.count}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 1. CLASS PICKER MODAL */}
      <Modal visible={showClassPicker} transparent animationType="fade" onRequestClose={() => setShowClassPicker(false)}>
        <Pressable onPress={() => setShowClassPicker(false)} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      {cls}
                    </Text>
                    {isSelected && <Check size={16} color="#ddb7ff" />}
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
          <View style={styles.modalContent}>
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
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                        {ex.name}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 2 }}>
                        Status: {ex.status} • Max Marks: {ex.maxMarks}
                      </Text>
                    </View>
                    {isSelected && <Check size={16} color="#ddb7ff" />}
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
    backgroundColor: "#08070d",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
    backgroundColor: "#181524",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
  tabButtonActive: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderColor: "#38bdf8",
  },
  tabButtonInactive: {
    backgroundColor: "#181524",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tabButtonTextActive: {
    color: "#38bdf8",
  },
  tabButtonTextInactive: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  mainCard: {
    backgroundColor: "#181524",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
  viewModeBtnActive: {
    backgroundColor: "rgba(221, 183, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(221, 183, 255, 0.4)",
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
  studentCard: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    overflow: "hidden",
    padding: 12,
  },
  studentCardTopRank: {
    borderColor: "rgba(250, 204, 21, 0.35)",
    backgroundColor: "rgba(34, 20, 61, 0.8)",
  },
  studentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  rankBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  rankBadge1: {
    backgroundColor: "rgba(250, 204, 21, 0.2)",
    borderColor: "rgba(250, 204, 21, 0.4)",
  },
  rankBadge2: {
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  rankBadge3: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    borderColor: "rgba(168, 85, 247, 0.4)",
  },
  rankBadgeDefault: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  rankText: {
    fontSize: 11,
    fontWeight: "900",
  },
  subjectsStrip: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  subjectChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subjectChipTitle: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 10,
    fontWeight: "700",
  },
  subjectChipMark: {
    fontSize: 11,
    fontWeight: "900",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeadCol: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 11,
    fontWeight: "700",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  tableCellRank: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
    fontWeight: "900",
  },
  tableCellSubject: {
    fontSize: 11.5,
    fontWeight: "700",
    textAlign: "center",
  },
  analyticsCard: {
    backgroundColor: "#181524",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 14,
  },
  analyticsTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  barTrack: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
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
    backgroundColor: "#181524",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
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
  modalItemSelected: {
    backgroundColor: "rgba(221, 183, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(221, 183, 255, 0.4)",
  },
  modalItemText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
  },
  modalItemTextSelected: {
    color: "#ddb7ff",
  },
});

export default TeacherExamResultsScreen;
