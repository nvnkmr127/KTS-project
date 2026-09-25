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
  Share,
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
  X,
  Search,
  Check,
  LayoutGrid,
  Table as TableIcon,
  Crown,
  Download,
  CheckCircle2,
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

export const AdminExamResultsScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { headerPaddingTop } = useResponsive();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";

  const primaryColor = isSuperAdmin ? "#f0c110" : "#00f1a1";
  const primaryLight = isSuperAdmin ? "#ffe5a0" : "#00f1a1";
  const bgGradient = isSuperAdmin
    ? (["#1d2022", "#101415"] as const)
    : (["#0d2a24", "#121414"] as const);

  const cardBg = isSuperAdmin ? "#101415" : "#102d26";
  const cardBorder = isSuperAdmin ? "rgba(240, 193, 16, 0.3)" : "rgba(0, 241, 161, 0.25)";

  const [selectedClass, setSelectedClass] = useState<string>("Class 8A");
  const [selectedExamId, setSelectedExamId] = useState<string>("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showExamPicker, setShowExamPicker] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  // Sync route params
  useEffect(() => {
    if (route?.params?.examId) {
      setSelectedExamId(String(route.params.examId));
    }
    if (route?.params?.selectedClass) {
      const c = route.params.selectedClass;
      setSelectedClass(c.startsWith("Class ") ? c : `Class ${c}`);
    }
  }, [route?.params]);

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

  const currentClassConfig = useMemo(() => {
    return CLASS_SUBJECTS_MAP[selectedClass] || CLASS_SUBJECTS_MAP.default;
  }, [selectedClass]);

  const currentExam = useMemo(() => {
    return DEFAULT_EXAMS.find((e) => String(e.id) === String(selectedExamId)) || DEFAULT_EXAMS[0];
  }, [selectedExamId]);

  const studentsList = useMemo(() => {
    return SAMPLE_STUDENTS_BY_CLASS[selectedClass] || SAMPLE_STUDENTS_BY_CLASS["Class 8A"] || [];
  }, [selectedClass]);

  const maxPerSubject = currentExam.maxMarks ? Math.min(currentExam.maxMarks, currentClassConfig.maxPerSub) : currentClassConfig.maxPerSub;
  const subjects = currentClassConfig.subjects;
  const totalMaxMarks = maxPerSubject * subjects.length;

  const getMarkForStudent = useCallback(
    (subject: string, roll: string): number | null => {
      const val = studentMarks[selectedExamId]?.[subject]?.[roll];
      if (val !== undefined && val !== "" && !isNaN(Number(val))) {
        return Number(val);
      }
      return null;
    },
    [studentMarks, selectedExamId]
  );

  const calculateGrade = (percentage: number): { grade: string; color: string; bg: string } => {
    if (percentage >= 90) return { grade: "A+", color: "#00f1a1", bg: "rgba(0, 241, 161, 0.15)" };
    if (percentage >= 80) return { grade: "A", color: "#34d399", bg: "rgba(52, 211, 153, 0.15)" };
    if (percentage >= 70) return { grade: "B+", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)" };
    if (percentage >= 60) return { grade: "B", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.15)" };
    if (percentage >= 50) return { grade: "C", color: "#facc15", bg: "rgba(250, 204, 21, 0.15)" };
    if (percentage >= 35) return { grade: "D", color: "#fb923c", bg: "rgba(251, 146, 60, 0.15)" };
    return { grade: "F", color: "#f87171", bg: "rgba(248, 113, 113, 0.15)" };
  };

  const rankedResults = useMemo(() => {
    const list = studentsList.map((student) => {
      const subjectScores: Record<string, number | null> = {};
      let totalObtained = 0;
      let scoredSubjectsCount = 0;

      subjects.forEach((sub) => {
        const mark = getMarkForStudent(sub, student.roll);
        subjectScores[sub] = mark;
        if (mark !== null) {
          totalObtained += mark;
          scoredSubjectsCount++;
        }
      });

      const isGraded = scoredSubjectsCount > 0;
      const percentage = isGraded && totalMaxMarks > 0
        ? Math.round((totalObtained / totalMaxMarks) * 100)
        : null;

      const gradeInfo = percentage !== null ? calculateGrade(percentage) : null;

      return {
        ...student,
        subjectScores,
        totalObtained,
        percentage,
        isGraded,
        gradeInfo,
      };
    });

    const graded = list.filter((s) => s.percentage !== null);
    graded.sort((a, b) => (b.percentage || 0) - (a.percentage || 0));

    let currentRank = 1;
    const rankedGraded = graded.map((s, index) => {
      if (index > 0 && s.percentage !== graded[index - 1].percentage) {
        currentRank = index + 1;
      }
      return { ...s, rank: currentRank };
    });

    const unranked = list
      .filter((s) => s.percentage === null)
      .map((s) => ({ ...s, rank: null }));

    return [...rankedGraded, ...unranked];
  }, [studentsList, subjects, getMarkForStudent, totalMaxMarks]);

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return rankedResults;
    const q = searchQuery.toLowerCase();
    return rankedResults.filter(
      (s) => s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q)
    );
  }, [rankedResults, searchQuery]);

  // KPI Calculations
  const gradedStudents = useMemo(() => rankedResults.filter((s) => s.percentage !== null), [rankedResults]);
  const classAvgDisplay = useMemo(() => {
    if (gradedStudents.length === 0) return "0.0%";
    const sum = gradedStudents.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    return `${(sum / gradedStudents.length).toFixed(1)}%`;
  }, [gradedStudents]);

  const topStudent = gradedStudents.length > 0 ? gradedStudents[0] : null;
  const topScoreDisplay = topStudent?.percentage !== null && topStudent !== null ? `${topStudent.percentage}%` : "0.0%";
  const topStudentName = topStudent ? topStudent.name : "No score yet";

  const { gradesList, gradedCount } = useMemo(() => {
    const graded = rankedResults.filter((s) => s.percentage !== null);
    const gradedCount = graded.length;

    const countByGrade = (g: string) => graded.filter((s) => s.gradeInfo?.grade === g).length;

    const gradesList = [
      { grade: "A+", label: "90-100%", count: countByGrade("A+"), color: "#00f1a1", bg: "rgba(0, 241, 161, 0.15)" },
      { grade: "A", label: "80-89%", count: countByGrade("A"), color: "#34d399", bg: "rgba(52, 211, 153, 0.15)" },
      { grade: "B+", label: "70-79%", count: countByGrade("B+"), color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)" },
      { grade: "B", label: "60-69%", count: countByGrade("B"), color: "#60a5fa", bg: "rgba(96, 165, 250, 0.15)" },
      { grade: "C", label: "50-59%", count: countByGrade("C"), color: "#facc15", bg: "rgba(250, 204, 21, 0.15)" },
      { grade: "D", label: "35-49%", count: countByGrade("D"), color: "#fb923c", bg: "rgba(251, 146, 60, 0.15)" },
      { grade: "F", label: "<35%", count: countByGrade("F"), color: "#f87171", bg: "rgba(248, 113, 113, 0.15)" },
    ];

    return { gradesList, gradedCount };
  }, [rankedResults]);

  const topTabs = [
    { id: "AdminExamSchedule", label: "Exam Schedule" },
    { id: "AdminExamResults", label: "Results & Rankings", active: true },
    { id: "AdminMarksPreview", label: "Marks Preview" },
    { id: "AdminExamScheduleDesigner", label: "Schedule Designer" },
    { id: "AdminExamInvigilation", label: "Allot Invigilation" },
  ];

  const handleExport = async () => {
    showToast("Results exported successfully!");
    try {
      await Share.share({
        title: `${currentExam.name} - ${selectedClass} Results`,
        message:
          `KTS Model High School - ${currentExam.name} (${selectedClass})\n\n` +
          rankedResults
            .filter((r) => r.percentage !== null)
            .map(
              (r) =>
                `Rank #${r.rank} - ${r.name} (${r.roll})\nTotal: ${r.totalObtained}/${totalMaxMarks} (${r.percentage}%) | Grade: ${r.gradeInfo?.grade}`
            )
            .join("\n\n"),
      });
    } catch {
      // ignore
    }
  };

  return (
    <View style={[styles.container, isSuperAdmin && { backgroundColor: "#101415" }]}>
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
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <Pressable
                onPress={() => {
                  if (navigation?.canGoBack && navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate("ExamSchedule");
                  }
                }}
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center mr-3 active:bg-white/20"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color={primaryLight} />
              </Pressable>
              <View className="flex-1 justify-center">
                <Text className="text-white text-lg md:text-xl font-extrabold" numberOfLines={1} style={{ includeFontPadding: false }}>
                  Results & Rankings
                </Text>
                <View className="flex-row items-center mt-0.5" style={{ flexWrap: "nowrap" }}>
                  <View
                    className="w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: primaryColor, flexShrink: 0 }}
                  />
                  <Text
                    className="text-xs font-semibold flex-1"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                    style={{ color: primaryLight, flexShrink: 1, includeFontPadding: false }}
                  >
                    Academic Year: 2026-2027 (Current)
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={handleExport}
              className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 flex-row items-center active:bg-white/20"
            >
              <Download size={14} color={primaryLight} style={{ marginRight: 5 }} />
              <Text className="text-white text-xs font-bold">Export</Text>
            </Pressable>
          </View>
        </BlurView>
      </View>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <View
          className="absolute top-24 left-4 right-4 z-50 rounded-2xl p-3.5 shadow-2xl flex-row items-center border"
          style={{
            backgroundColor: isSuperAdmin ? "#241f12" : "#0d2e26",
            borderColor: primaryColor,
          }}
        >
          <CheckCircle2 size={18} color={primaryColor} style={{ marginRight: 10 }} />
          <Text className="text-white text-xs md:text-sm font-bold flex-1">{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryLight}
            colors={[primaryColor, "#38bdf8"]}
          />
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 16,
          paddingTop: 14,
        }}
      >
        {/* 4 KPI CARDS (2x2 Grid) */}
        <View style={{ gap: 10, marginBottom: 16 }}>
          {/* Row 1 */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            {/* 1. Upcoming Exams */}
            <View
              style={[
                styles.kpiCard,
                { flex: 1, backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.kpiTopRow}>
                <Text
                  style={[styles.kpiTitle, { flex: 1, marginRight: 4, includeFontPadding: false }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  Upcoming Exams
                </Text>
                <View style={[styles.kpiIconWrapper, { backgroundColor: "rgba(56, 189, 248, 0.15)", borderColor: "rgba(56, 189, 248, 0.3)", flexShrink: 0 }]}>
                  <BookOpen size={14} color="#38bdf8" />
                </View>
              </View>
              <Text style={[styles.kpiValue, { includeFontPadding: false }]} numberOfLines={1}>1</Text>
              <Text style={[styles.kpiSub, { includeFontPadding: false }]} numberOfLines={1}>This month</Text>
            </View>

            {/* 2. Class Average */}
            <View
              style={[
                styles.kpiCard,
                { flex: 1, backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.kpiTopRow}>
                <Text
                  style={[styles.kpiTitle, { flex: 1, marginRight: 4, includeFontPadding: false }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  Class Average
                </Text>
                <View style={[styles.kpiIconWrapper, { backgroundColor: "rgba(52, 211, 153, 0.15)", borderColor: "rgba(52, 211, 153, 0.3)", flexShrink: 0 }]}>
                  <BarChart2 size={14} color="#34d399" />
                </View>
              </View>
              <Text style={[styles.kpiValue, { includeFontPadding: false }]} numberOfLines={1}>{classAvgDisplay}</Text>
              <Text style={[styles.kpiSub, { includeFontPadding: false }]} numberOfLines={1}>{selectedClass} · Selected Exam</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            {/* 3. Top Score */}
            <View
              style={[
                styles.kpiCard,
                { flex: 1, backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.kpiTopRow}>
                <Text
                  style={[styles.kpiTitle, { flex: 1, marginRight: 4, includeFontPadding: false }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  Top Score
                </Text>
                <View
                  style={[
                    styles.kpiIconWrapper,
                    {
                      flexShrink: 0,
                      backgroundColor: `${primaryColor}20`,
                      borderColor: `${primaryColor}40`,
                    },
                  ]}
                >
                  <Award size={14} color={primaryLight} />
                </View>
              </View>
              <Text style={[styles.kpiValue, { includeFontPadding: false }]} numberOfLines={1}>{topScoreDisplay}</Text>
              <Text style={[styles.kpiSub, { includeFontPadding: false }]} numberOfLines={1}>
                {topStudentName}
              </Text>
            </View>

            {/* 4. Results Published */}
            <View
              style={[
                styles.kpiCard,
                { flex: 1, backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.kpiTopRow}>
                <Text
                  style={[styles.kpiTitle, { flex: 1, marginRight: 4, includeFontPadding: false }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  Results Published
                </Text>
                <View style={[styles.kpiIconWrapper, { backgroundColor: "rgba(250, 204, 21, 0.15)", borderColor: "rgba(250, 204, 21, 0.3)", flexShrink: 0 }]}>
                  <TrendingUp size={14} color="#facc15" />
                </View>
              </View>
              <Text style={[styles.kpiValue, { includeFontPadding: false }]} numberOfLines={1}>1</Text>
              <Text style={[styles.kpiSub, { includeFontPadding: false }]} numberOfLines={1}>Exams</Text>
            </View>
          </View>
        </View>

        {/* HORIZONTAL EXAMINATION TABS BAR */}
        <View style={{ marginBottom: 16 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 16 }}
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
                  { flexShrink: 0 },
                  t.active
                    ? { backgroundColor: primaryColor, borderColor: primaryColor }
                    : { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { flexShrink: 0, includeFontPadding: false },
                    t.active ? { color: "#000", fontWeight: "900" } : { color: "#fff" },
                  ]}
                  numberOfLines={1}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* MAIN RESULTS & RANKINGS CARD */}
        <View style={[styles.mainCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
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
                  style={[
                    styles.viewModeBtn,
                    viewMode === "card" && { backgroundColor: "rgba(255, 255, 255, 0.15)", borderColor: primaryLight },
                  ]}
                >
                  <LayoutGrid size={15} color={viewMode === "card" ? primaryLight : "rgba(255,255,255,0.4)"} />
                </Pressable>
                <Pressable
                  onPress={() => setViewMode("table")}
                  style={[
                    styles.viewModeBtn,
                    viewMode === "table" && { backgroundColor: "rgba(255, 255, 255, 0.15)", borderColor: primaryLight },
                  ]}
                >
                  <TableIcon size={15} color={viewMode === "table" ? primaryLight : "rgba(255,255,255,0.4)"} />
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
                <ChevronDown size={14} color={primaryLight} />
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
                <ChevronDown size={14} color={primaryLight} />
              </Pressable>
            </View>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Search size={14} color={primaryLight} style={{ marginRight: 8 }} />
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
            /* VIEW MODE 1: MOBILE CARD VIEW */
            <View style={{ gap: 12 }}>
              {filteredResults.map((item) => {
                const avatar = getAvatarColor(item.init);
                const isTopRank = item.rank === 1;

                return (
                  <View
                    key={item.roll}
                    style={[
                      styles.studentCard,
                      isTopRank && {
                        borderColor: primaryColor,
                        backgroundColor: `${primaryColor}08`,
                      },
                    ]}
                  >
                    {/* Header Row: Rank Badge + Avatar + Name + Grade */}
                    <View style={[styles.studentCardHeader, { flexWrap: "nowrap" }]}>
                      {/* Left: Rank + Avatar + Name */}
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8, flexWrap: "nowrap" }}>
                        {/* Rank Badge */}
                        <View
                          style={[
                            styles.rankBadge,
                            { flexShrink: 0 },
                            item.rank === 1
                              ? styles.rankBadge1
                              : item.rank === 2
                              ? styles.rankBadge2
                              : item.rank === 3
                              ? styles.rankBadge3
                              : styles.rankBadgeDefault,
                          ]}
                        >
                          {item.rank === 1 && <Crown size={10} color="#facc15" style={{ marginRight: 2, flexShrink: 0 }} />}
                          <Text
                            style={[
                              styles.rankText,
                              { flexShrink: 0, includeFontPadding: false },
                              item.rank === 1
                                ? { color: "#facc15" }
                                : item.rank === 2
                                ? { color: "#38bdf8" }
                                : item.rank === 3
                                ? { color: primaryLight }
                                : { color: "rgba(255,255,255,0.4)" },
                            ]}
                            numberOfLines={1}
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
                            flexShrink: 0,
                          }}
                        >
                          <Text style={{ color: avatar.color, fontSize: 11, fontWeight: "900", includeFontPadding: false }} numberOfLines={1}>
                            {item.init}
                          </Text>
                        </View>

                        {/* Name & Roll */}
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.studentName, { includeFontPadding: false }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={[styles.studentRoll, { includeFontPadding: false }]} numberOfLines={1}>Roll: {item.roll}</Text>
                        </View>
                      </View>

                      {/* Right: Grade Pill */}
                      {item.gradeInfo ? (
                        <View
                          style={[
                            styles.gradePill,
                            {
                              flexShrink: 0,
                              backgroundColor: item.gradeInfo.bg,
                              borderColor: `${item.gradeInfo.color}40`,
                            },
                          ]}
                        >
                          <Text style={[styles.gradePillText, { color: item.gradeInfo.color, flexShrink: 0, includeFontPadding: false }]} numberOfLines={1}>
                            {item.gradeInfo.grade}
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.gradePillPending, { flexShrink: 0 }]}>
                          <Text style={[styles.gradePillPendingText, { flexShrink: 0, includeFontPadding: false }]} numberOfLines={1}>Pending</Text>
                        </View>
                      )}
                    </View>

                    {/* Summary Row: Total Marks, Max, Percentage */}
                    <View style={styles.cardSummaryBox}>
                      <View style={styles.summaryItem}>
                        <Text style={[styles.summaryLabel, { includeFontPadding: false }]} numberOfLines={1}>Total</Text>
                        <Text style={[styles.summaryValue, { includeFontPadding: false }]} numberOfLines={1}>
                          {item.isGraded ? item.totalObtained : "--"}
                        </Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <Text style={[styles.summaryLabel, { includeFontPadding: false }]} numberOfLines={1}>Max</Text>
                        <Text style={[styles.summaryValue, { includeFontPadding: false }]} numberOfLines={1}>{totalMaxMarks}</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <Text style={[styles.summaryLabel, { includeFontPadding: false }]} numberOfLines={1}>Percentage</Text>
                        <Text
                          style={[
                            styles.summaryValuePct,
                            { includeFontPadding: false },
                            item.percentage !== null
                              ? { color: primaryLight }
                              : { color: "rgba(255,255,255,0.4)" },
                          ]}
                          numberOfLines={1}
                        >
                          {item.percentage !== null ? `${item.percentage}%` : "--"}
                        </Text>
                      </View>
                    </View>

                    {/* Subject Score Breakdown */}
                    <View style={styles.subjectBreakdownWrapper}>
                      <Text style={styles.subjectBreakdownTitle}>Subject Scores</Text>
                      <View style={styles.subjectChipsGrid}>
                        {subjects.map((sub) => {
                          const mark = item.subjectScores[sub];
                          const hasMark = mark !== null;
                          return (
                            <View key={sub} style={styles.subjectChip}>
                              <Text style={styles.subjectChipLabel} numberOfLines={1}>
                                {sub}
                              </Text>
                              <Text
                                style={[
                                  styles.subjectChipMark,
                                  hasMark ? { color: "#ffffff" } : { color: "rgba(255,255,255,0.3)" },
                                ]}
                              >
                                {hasMark ? `${mark}/${maxPerSubject}` : `--/${maxPerSubject}`}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            /* VIEW MODE 2: WEB-MATCHING SPREADSHEET TABLE */
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={styles.tableContainer}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.th, { width: 50, textAlign: "center" }]}>Rank</Text>
                  <Text style={[styles.th, { width: 180 }]}>Student</Text>
                  {subjects.map((sub) => (
                    <Text key={sub} style={[styles.th, { width: 80, textAlign: "center" }]}>
                      {sub}
                    </Text>
                  ))}
                  <Text style={[styles.th, { width: 80, textAlign: "center" }]}>Total</Text>
                  <Text style={[styles.th, { width: 80, textAlign: "center" }]}>%</Text>
                  <Text style={[styles.th, { width: 70, textAlign: "center" }]}>Grade</Text>
                </View>

                {/* Table Rows */}
                {filteredResults.map((item, idx) => (
                  <View
                    key={item.roll}
                    style={[
                      styles.tableRow,
                      idx % 2 === 1 && styles.tableRowAlt,
                      item.rank === 1 && { backgroundColor: `${primaryColor}08` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.td,
                        { width: 50, textAlign: "center", fontWeight: "900" },
                        item.rank === 1 ? { color: "#facc15" } : { color: primaryLight },
                      ]}
                    >
                      {item.rank !== null ? `#${item.rank}` : "--"}
                    </Text>
                    <View style={{ width: 180, paddingHorizontal: 6 }}>
                      <Text style={styles.tableName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.tableRoll}>Roll: {item.roll}</Text>
                    </View>

                    {subjects.map((sub) => {
                      const mark = item.subjectScores[sub];
                      return (
                        <Text
                          key={sub}
                          style={[
                            styles.td,
                            { width: 80, textAlign: "center" },
                            mark !== null ? { color: "#ffffff" } : { color: "rgba(255,255,255,0.25)" },
                          ]}
                        >
                          {mark !== null ? mark : "--"}
                        </Text>
                      );
                    })}

                    <Text style={[styles.td, { width: 80, textAlign: "center", fontWeight: "800", color: "#ffffff" }]}>
                      {item.isGraded ? item.totalObtained : "--"}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        { width: 80, textAlign: "center", fontWeight: "900" },
                        item.percentage !== null ? { color: primaryLight } : { color: "rgba(255,255,255,0.3)" },
                      ]}
                    >
                      {item.percentage !== null ? `${item.percentage}%` : "--"}
                    </Text>
                    <View style={{ width: 70, alignItems: "center", justifyContent: "center" }}>
                      {item.gradeInfo ? (
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                            backgroundColor: item.gradeInfo.bg,
                            borderWidth: 1,
                            borderColor: `${item.gradeInfo.color}40`,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: "900", color: item.gradeInfo.color }}>
                            {item.gradeInfo.grade}
                          </Text>
                        </View>
                      ) : (
                        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>--</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* CLASS PERFORMANCE SUMMARY FOOTER */}
          <View style={styles.footerSummaryCard}>
            <Text style={styles.footerSummaryTitle}>Class Performance Summary</Text>
            <View style={styles.footerSummaryGrid}>
              <View style={styles.footerSummaryItem}>
                <Text style={styles.footerSummaryLabel}>Class Average</Text>
                <Text style={styles.footerSummaryValue}>{classAvgDisplay}</Text>
              </View>
              <View style={styles.footerSummaryItem}>
                <Text style={styles.footerSummaryLabel}>Highest</Text>
                <Text style={[styles.footerSummaryValue, { color: primaryLight }]}>
                  {topScoreDisplay}
                </Text>
              </View>
              <View style={styles.footerSummaryItem}>
                <Text style={styles.footerSummaryLabel}>Evaluated</Text>
                <Text style={styles.footerSummaryValue}>
                  {gradedCount}/{studentsList.length}
                </Text>
              </View>
            </View>

            {/* Grade Distribution Badges */}
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 10, fontWeight: "700", marginBottom: 6 }}>
                Grade Distribution
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {gradesList.map((g) => (
                  <View
                    key={g.grade}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: g.bg,
                      borderColor: `${g.color}35`,
                      borderWidth: 1,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      gap: 4,
                    }}
                  >
                    <Text style={{ color: g.color, fontSize: 11, fontWeight: "900" }}>{g.grade}</Text>
                    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>{g.count}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* CLASS PICKER MODAL */}
      {showClassPicker && (
        <Modal transparent animationType="fade" visible={showClassPicker}>
          <Pressable
            onPress={() => setShowClassPicker(false)}
            style={styles.modalOverlay}
          >
            <View style={[styles.pickerModal, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={styles.pickerTitle}>Select Class</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                {DEFAULT_CLASSES.map((cls) => (
                  <Pressable
                    key={cls}
                    onPress={() => {
                      setSelectedClass(cls);
                      setShowClassPicker(false);
                    }}
                    style={[
                      styles.pickerItem,
                      selectedClass === cls && {
                        backgroundColor: `${primaryColor}20`,
                        borderColor: `${primaryColor}40`,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedClass === cls && { color: primaryLight, fontWeight: "900" },
                      ]}
                    >
                      {cls}
                    </Text>
                    {selectedClass === cls && <Check size={16} color={primaryLight} />}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* EXAM PICKER MODAL */}
      {showExamPicker && (
        <Modal transparent animationType="fade" visible={showExamPicker}>
          <Pressable
            onPress={() => setShowExamPicker(false)}
            style={styles.modalOverlay}
          >
            <View style={[styles.pickerModal, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={styles.pickerTitle}>Select Examination</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                {DEFAULT_EXAMS.map((ex) => (
                  <Pressable
                    key={ex.id}
                    onPress={() => {
                      setSelectedExamId(ex.id);
                      setShowExamPicker(false);
                    }}
                    style={[
                      styles.pickerItem,
                      selectedExamId === ex.id && {
                        backgroundColor: `${primaryColor}20`,
                        borderColor: `${primaryColor}40`,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedExamId === ex.id && { color: primaryLight, fontWeight: "900" },
                        ]}
                      >
                        {ex.name}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
                        Max Marks: {ex.maxMarks} · {ex.status}
                      </Text>
                    </View>
                    {selectedExamId === ex.id && <Check size={16} color={primaryLight} />}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#061a14",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 10,
  },
  kpiCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  kpiTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  kpiTitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
    marginRight: 4,
  },
  kpiIconWrapper: {
    width: 26,
    height: 26,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  mainCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  viewModeWrapper: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 10,
    padding: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  viewModeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },
  dropdownTriggerClass: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownTriggerExam: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dropdownValue: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 1,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 12,
    padding: 0,
  },
  studentCard: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  studentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  rankBadge1: {
    backgroundColor: "rgba(250, 204, 21, 0.18)",
    borderColor: "rgba(250, 204, 21, 0.4)",
  },
  rankBadge2: {
    backgroundColor: "rgba(56, 189, 248, 0.18)",
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  rankBadge3: {
    backgroundColor: "rgba(221, 183, 255, 0.18)",
    borderColor: "rgba(221, 183, 255, 0.4)",
  },
  rankBadgeDefault: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  rankText: {
    fontSize: 11,
    fontWeight: "900",
  },
  studentName: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  studentRoll: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
  },
  gradePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  gradePillText: {
    fontSize: 11,
    fontWeight: "900",
  },
  gradePillPending: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  gradePillPendingText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    fontWeight: "700",
  },
  cardSummaryBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 1,
  },
  summaryValuePct: {
    fontSize: 13,
    fontWeight: "900",
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  subjectBreakdownWrapper: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    paddingTop: 8,
  },
  subjectBreakdownTitle: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  subjectChipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  subjectChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: "48%",
  },
  subjectChipLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10,
    fontWeight: "600",
    flex: 1,
    marginRight: 4,
  },
  subjectChipMark: {
    fontSize: 11,
    fontWeight: "800",
  },
  tableContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  th: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  tableRowAlt: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  td: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 4,
  },
  tableName: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  tableRoll: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    fontWeight: "500",
  },
  footerSummaryCard: {
    marginTop: 18,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  footerSummaryTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 10,
  },
  footerSummaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerSummaryItem: {
    alignItems: "center",
    flex: 1,
  },
  footerSummaryLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  footerSummaryValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  pickerModal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  pickerTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  pickerItemText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});

export default AdminExamResultsScreen;
