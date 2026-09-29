import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  ArrowLeft,
  TrendingUp,
  Award,
  Users,
  Percent,
  ChevronDown,
  Search,
  Check,
  Sparkles,
  BarChart2,
  Calendar,
  Layers,
  BookOpen,
  Filter,
  X,
  Crown,
} from "lucide-react-native";
import { useResponsive } from "../../utils/responsive";
import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface StudentPerformanceItem {
  id: string;
  name: string;
  roll: string;
  init: string;
  average: number;
  hasMarks: boolean;
  standing: "Outstanding" | "Good" | "Satisfactory" | "Needs Help";
  standingColor: { bg: string; text: string; border: string };
  rank: number;
}

const DEFAULT_TEACHER_CLASSES = [
  "Class 4A",
  "Class 4B",
  "Class 8A",
  "Class 8B",
  "Class 9A",
  "Class 10A",
];

const DEFAULT_SUBJECTS_MAP: Record<string, string[]> = {
  "Class 4A": ["Academics", "Mathematics", "Science", "English", "Telugu", "EVS"],
  "Class 4B": ["Academics", "Mathematics", "Science", "English", "Telugu", "GK"],
  "Class 8A": ["Academics", "Mathematics", "Physics", "Biology", "Social Studies", "English"],
  "Class 8B": ["Academics", "Physics", "Chemistry", "Mathematics", "English"],
  "Class 9A": ["Academics", "Mathematics", "Advanced Algebra", "Physical Science"],
  "Class 10A": ["Academics", "Mathematics", "Physics", "Chemistry", "Social Studies"],
};

const SAMPLE_STUDENTS_PERFORMANCE: Record<string, { name: string; roll: string; init: string; avg: number }[]> = {
  "Class 4A": [
    { name: "Vallepu NagaVaishanvi", roll: "STDDe2026084", init: "VN", avg: 0 },
    { name: "ALLI DEEKSHITHA", roll: "STDDe2026036", init: "AD", avg: 0 },
    { name: "BANTU MOKSHITH", roll: "STDDe2026037", init: "BM", avg: 0 },
    { name: "BODDU VEDHAGNA", roll: "STDDe2026038", init: "BV", avg: 0 },
    { name: "BODDU VEDHASRI", roll: "STDDe2026039", init: "BV", avg: 0 },
    { name: "CHAKALI SRI TEJ", roll: "STDDe2026040", init: "CT", avg: 0 },
    { name: "DUMSA OMKAR", roll: "STDDe2026041", init: "DO", avg: 0 },
    { name: "E BHANUTEJA", roll: "STDDe2026042", init: "EB", avg: 0 },
    { name: "GOLLA SHASHANK", roll: "STDDe2026045", init: "GS", avg: 0 },
    { name: "KAVALI DHANUSH", roll: "STDDe2026048", init: "KD", avg: 0 },
    { name: "POTHULA SAI KRISHNA", roll: "STDDe2026051", init: "PS", avg: 0 },
    { name: "KOTTE AKSHAYA", roll: "STDDe2026055", init: "KA", avg: 0 },
    { name: "GUNDU RITHVIK", roll: "STDDe2026059", init: "GR", avg: 0 },
  ],
  "Class 8A": [
    { name: "BODAPOTHULA ABHILASH GOUD", roll: "STDDe2026400", init: "BG", avg: 94 },
    { name: "SHIVVAMOLLA SATHVIKA", roll: "STDDe2026451", init: "SS", avg: 91 },
    { name: "GAJJAGANI CHAITANYA", roll: "STDDe2026459", init: "GC", avg: 88 },
    { name: "RALLAMOLLA NIHARIKA", roll: "STDDe2026444", init: "RN", avg: 85 },
    { name: "MALAPATI RISHITHA", roll: "STDDe2026448", init: "MR", avg: 78 },
    { name: "MALAPATI LASYA", roll: "STDDe2026447", init: "ML", avg: 74 },
    { name: "KAVALI ANANYA", roll: "STDDe2026446", init: "KA", avg: 68 },
    { name: "MANTHRI SANTHOSH", roll: "STDDe2026445", init: "MS", avg: 59 },
    { name: "CHINTHA SRIKANTH", roll: "STDDe2026443", init: "CS", avg: 48 },
    { name: "DODDI RAMESH", roll: "STDDe2026442", init: "DR", avg: 42 },
  ],
  "Class 4B": [
    { name: "H VAISHANVI", roll: "STDDe2026074", init: "HV", avg: 92 },
    { name: "MANGALI SWATHI", roll: "STDDe2026075", init: "MS", avg: 89 },
    { name: "SHERI MAANVITHA", roll: "STDDe2026076", init: "SM", avg: 84 },
    { name: "ADDANUMUTHI RUTHWIK", roll: "STDDe2026077", init: "AR", avg: 79 },
    { name: "CHAKALI SAI VARSHITH", roll: "STDDe2026078", init: "CV", avg: 71 },
    { name: "GADDAMEEDA SAIDATH", roll: "STDDe2026079", init: "GS", avg: 65 },
    { name: "TURPU SHASHIVARDHAN", roll: "STDDe2026080", init: "TS", avg: 54 },
    { name: "VOGGU ANEESH VARDHAN", roll: "STDDe2026081", init: "VV", avg: 38 },
  ],
};

export const TeacherPerformanceScreen: React.FC<{ navigation: any; route?: any }> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { isSmallPhone, headerPaddingTop, scrollBottomPadding } = useResponsive();
  const { user } = useAuthStore();

  const handleBack = useCallback(() => {
    navigation.navigate("Dashboard");
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [handleBack])
  );

  // Filter Selectors
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("2026-2027 (Current)");
  const [selectedClass, setSelectedClass] = useState<string>(
    route?.params?.initialClass || (user as any)?.classTeacherOf || "Class 4A"
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(
    route?.params?.initialSubject || "Academics"
  );

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showClassModal, setShowClassModal] = useState<boolean>(false);
  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);
  const [showYearModal, setShowYearModal] = useState<boolean>(false);

  // Live Database Records
  const [apiStudents, setApiStudents] = useState<any[]>([]);
  const [apiMarks, setApiMarks] = useState<Record<string, any>>({});
  const [apiExams, setApiExams] = useState<any[]>([]);
  const [classList, setClassList] = useState<string[]>(DEFAULT_TEACHER_CLASSES);

  // Available classes for teacher
  const teacherClasses = useMemo(() => {
    const list = Array.from(
      new Set([
        ...((user as any)?.classes || []),
        ...((user as any)?.classTeacherOf ? [(user as any).classTeacherOf] : []),
        ...(classList.length > 0 ? classList : DEFAULT_TEACHER_CLASSES),
      ])
    );
    return list.map((c) => (c.startsWith("Class ") ? c : `Class ${c}`));
  }, [user, classList]);

  // Available subjects taught by this teacher for selected class
  const availableSubjects = useMemo(() => {
    const defaultList = DEFAULT_SUBJECTS_MAP[selectedClass] || [
      "Academics",
      (user as any)?.subject || "Mathematics",
      "Science",
      "English",
      "Social Studies",
    ];
    if ((user as any)?.subject && !defaultList.includes((user as any).subject)) {
      return ["Academics", (user as any).subject, ...defaultList.filter((s) => s !== "Academics")];
    }
    return defaultList;
  }, [selectedClass, user]);

  const fetchPerformanceData = async () => {
    setRefreshing(true);
    try {
      const [studentsRes, marksRes, examsRes, batchesRes] = await Promise.all([
        api.getResources("students", { limit: "1000" }).catch(() => null),
        api.getResources("settings", { key: "kts_student_marks" }).catch(() => null),
        api.getResources("exams", { limit: "500" }).catch(() => null),
        api.getResources("batches").catch(() => null),
      ]);

      if (Array.isArray(batchesRes) && batchesRes.length > 0) {
        const names = batchesRes.map((b: any) => (b.name.startsWith("Class ") ? b.name : `Class ${b.name}`));
        setClassList(names);
      }

      if (Array.isArray(studentsRes) && studentsRes.length > 0) {
        setApiStudents(studentsRes);
      }

      if (Array.isArray(examsRes) && examsRes.length > 0) {
        setApiExams(examsRes);
      }

      if (Array.isArray(marksRes) && marksRes.length > 0 && marksRes[0]?.value) {
        const val = marksRes[0].value;
        const parsed = typeof val === "string" ? JSON.parse(val) : val;
        setApiMarks(parsed || {});
      }
    } catch (err) {
      console.log("Error loading teacher performance data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [user]);

  // Ensure selected class & subject remain valid
  useEffect(() => {
    if (teacherClasses.length > 0 && !teacherClasses.includes(selectedClass)) {
      setSelectedClass(teacherClasses[0]);
    }
  }, [teacherClasses]);

  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [availableSubjects]);

  // Compute student rankings & performance statistics
  const { studentList, classAvg, highestScore, passingRate, totalStudents, scoreDistribution } =
    useMemo(() => {
      const rawClassKey = selectedClass.replace(/^Class\s*/i, "").trim().toUpperCase();

      // 1. Gather students matching selected class
      let studentsInClass: any[] = [];
      if (apiStudents.length > 0) {
        studentsInClass = apiStudents.filter((s: any) => {
          const sClass = (s.batch?.name || s.class_name || s.class || "").replace(/^Class\s*/i, "").trim().toUpperCase();
          return sClass === rawClassKey;
        });
      }

      let performanceList: StudentPerformanceItem[] = [];

      if (studentsInClass.length > 0) {
        performanceList = studentsInClass.map((s, idx) => {
          const fullName = s.name || (s.first_name ? `${s.first_name} ${s.last_name || ""}`.trim() : `Student ${idx + 1}`);
          const nameParts = fullName.trim().split(/\s+/);
          const initials =
            nameParts.length > 1
              ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
              : fullName.slice(0, 2).toUpperCase();
          const roll = s.roll || s.roll_no || s.enrollment_number || s.student_pen_no || `STDDe2026${String(idx + 30).padStart(3, "0")}`;

          // Check if marks exist for selected subject
          let avg = 0;
          let hasMarks = false;

          if (Object.keys(apiMarks).length > 0) {
            let total = 0;
            let count = 0;
            Object.values(apiMarks).forEach((examObj: any) => {
              const subObj = examObj[selectedSubject] || (selectedSubject === "Academics" ? examObj["Mathematics"] || examObj["Science"] : null);
              if (subObj) {
                const score = subObj[roll] ?? subObj[s.id];
                if (score !== undefined && score !== null && score !== "") {
                  total += Number(score);
                  count += 1;
                  hasMarks = true;
                }
              }
            });
            if (count > 0) {
              avg = Math.round(total / count);
            }
          }

          let standing: "Outstanding" | "Good" | "Satisfactory" | "Needs Help" = "Needs Help";
          let standingColor = { bg: "bg-amber-500/15", text: "text-amber-300", border: "border-amber-500/30" };

          if (avg >= 90) {
            standing = "Outstanding";
            standingColor = { bg: "bg-[#00f1a1]/15", text: "text-[#00f1a1]", border: "border-[#00f1a1]/30" };
          } else if (avg >= 75) {
            standing = "Good";
            standingColor = { bg: "bg-[#38bdf8]/15", text: "text-[#38bdf8]", border: "border-[#38bdf8]/30" };
          } else if (avg >= 50) {
            standing = "Satisfactory";
            standingColor = { bg: "bg-[#818cf8]/15", text: "text-[#818cf8]", border: "border-[#818cf8]/30" };
          }

          return {
            id: String(s.id || idx),
            name: fullName,
            roll: String(roll),
            init: initials || "ST",
            average: avg,
            hasMarks,
            standing,
            standingColor,
            rank: idx + 1,
          };
        });
      } else {
        // Fallback sample data matching the selected class
        const sampleData = SAMPLE_STUDENTS_PERFORMANCE[selectedClass] || SAMPLE_STUDENTS_PERFORMANCE["Class 4A"];
        performanceList = sampleData.map((s, idx) => {
          let standing: "Outstanding" | "Good" | "Satisfactory" | "Needs Help" = "Needs Help";
          let standingColor = { bg: "bg-amber-500/15", text: "text-amber-300", border: "border-amber-500/30" };

          if (s.avg >= 90) {
            standing = "Outstanding";
            standingColor = { bg: "bg-[#00f1a1]/15", text: "text-[#00f1a1]", border: "border-[#00f1a1]/30" };
          } else if (s.avg >= 75) {
            standing = "Good";
            standingColor = { bg: "bg-[#38bdf8]/15", text: "text-[#38bdf8]", border: "border-[#38bdf8]/30" };
          } else if (s.avg >= 50) {
            standing = "Satisfactory";
            standingColor = { bg: "bg-[#818cf8]/15", text: "text-[#818cf8]", border: "border-[#818cf8]/30" };
          }

          return {
            id: `s-${idx + 1}`,
            name: s.name,
            roll: s.roll,
            init: s.init,
            average: s.avg,
            hasMarks: s.avg > 0,
            standing,
            standingColor,
            rank: idx + 1,
          };
        });
      }

      // Sort by average descending to compute rank
      const sorted = [...performanceList].sort((a, b) => b.average - a.average);
      const rankedList = sorted.map((student, idx) => ({
        ...student,
        rank: idx + 1,
      }));

      // Calculate KPI summary metrics
      const total = rankedList.length;
      const scoredList = rankedList.filter((s) => s.hasMarks);
      const avg = scoredList.length > 0 ? Math.round(scoredList.reduce((sum, s) => sum + s.average, 0) / scoredList.length) : 0;
      const highest = scoredList.length > 0 ? Math.max(...scoredList.map((s) => s.average)) : 0;
      const passing = scoredList.length > 0 ? Math.round((scoredList.filter((s) => s.average >= 35).length / scoredList.length) * 100) : 0;

      // Score ranges distribution breakdown
      const dist = [
        { label: "90-100% (A+)", count: rankedList.filter((s) => s.average >= 90).length, color: "#00f1a1" },
        { label: "75-89% (A)", count: rankedList.filter((s) => s.average >= 75 && s.average < 90).length, color: "#38bdf8" },
        { label: "60-74% (B)", count: rankedList.filter((s) => s.average >= 60 && s.average < 75).length, color: "#818cf8" },
        { label: "50-59% (C)", count: rankedList.filter((s) => s.average >= 50 && s.average < 60).length, color: "#facc15" },
        { label: "<50% (Needs Help)", count: rankedList.filter((s) => s.average < 50).length, color: "#f43f5e" },
      ];

      return {
        studentList: rankedList,
        classAvg: avg,
        highestScore: highest,
        passingRate: passing,
        totalStudents: total,
        scoreDistribution: dist,
      };
    }, [selectedClass, selectedSubject, apiStudents, apiMarks]);

  // Filtered by Search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentList;
    const q = searchQuery.toLowerCase().trim();
    return studentList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.roll.toLowerCase().includes(q) ||
        s.standing.toLowerCase().includes(q)
    );
  }, [studentList, searchQuery]);

  // Top 3 Performers
  const topPerformers = useMemo(() => {
    return studentList.slice(0, 3);
  }, [studentList]);

  // Cleaned Teacher Name (strip Ms., Mr., Mrs., Dr., etc.)
  const displayTeacherName = useMemo(() => {
    const rawName = user?.name || "";
    const cleaned = rawName
      .replace(/^[\s(]*(ms|mr|mrs|dr|prof)\.?[\s)]*/i, "")
      .replace(/[\s()]/g, " ")
      .trim();
    const firstName = cleaned.split(/\s+/)[0] || "FACULTY";
    return firstName.toUpperCase();
  }, [user?.name]);

  return (
    <View style={styles.container}>
      {/* Background Teacher Gradient */}
      <LinearGradient
        colors={["#22143d", "#150d26", "#0b0912", "#08070d"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* TOP HEADER */}
      <View style={{ zIndex: 50 }}>
        <BlurView
          intensity={35}
          tint="dark"
          style={[styles.header, { paddingTop: headerPaddingTop }]}
        >
          <View className="flex-row items-center flex-1 mr-2" style={{ flexWrap: "nowrap" }}>
            <Pressable
              onPress={handleBack}
              className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/10 active:bg-white/15 mr-3"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ flexShrink: 0 }}
            >
              <ArrowLeft size={20} color="#ddb7ff" />
            </Pressable>

            <View className="flex-1">
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                className="text-[#ddb7ff] text-xl font-black font-display-lg"
                style={{ includeFontPadding: false }}
              >
                Student Performance
              </Text>
              <View className="flex-row items-center mt-0.5" style={{ flexWrap: "nowrap" }}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  className="text-white/70 text-xs font-bold tracking-wider uppercase"
                  style={{ includeFontPadding: false }}
                >
                  ACADEMIC YEAR: {selectedAcademicYear}
                </Text>
              </View>
            </View>
          </View>

          {/* Teacher Profile Avatar / Badge without (ms.) tag */}
          <View className="flex-row items-center bg-[#ddb7ff]/20 px-3.5 py-1.5 rounded-full border border-[#ddb7ff]/40" style={{ flexShrink: 0, flexWrap: "nowrap" }}>
            <View className="w-2 h-2 rounded-full bg-[#00f1a1] mr-2 shadow-[0_0_8px_#00f1a1]" style={{ flexShrink: 0 }} />
            <Text
              className="text-[#ddb7ff] text-xs font-black uppercase tracking-wider"
              numberOfLines={1}
              style={{ includeFontPadding: false }}
            >
              {displayTeacherName}
            </Text>
          </View>
        </BlurView>

        {/* Glow Shadow beneath header */}
        <LinearGradient
          colors={["rgba(221, 183, 255, 0.18)", "transparent"]}
          style={{ position: "absolute", bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      {/* SCROLLABLE MAIN BODY */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollBottomPadding + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchPerformanceData}
            tintColor="#ddb7ff"
            colors={["#ddb7ff", "#c084fc"]}
          />
        }
      >
        {/* 1. DASHBOARD TITLE & CLASS / SUBJECT SELECTORS */}
        <View className="mb-5 px-1">
          <View className="flex-col md:flex-row md:items-center md:justify-between mb-3" style={{ gap: 8 }}>
            <View className="flex-1">
              <Text
                className="text-white text-2xl font-black font-display-lg"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={{ includeFontPadding: false }}
              >
                Student Performance Dashboard
              </Text>
              <Text
                className="text-white/60 text-xs font-medium mt-0.5"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={{ includeFontPadding: false }}
              >
                Subject academic standing, average grades, and class rank distributions
              </Text>
            </View>
          </View>

          {/* Quick Selectors Bar (Class & Subject Dropdown Pickers) */}
          <View className="flex-row items-center gap-2.5 mt-1" style={{ flexWrap: "nowrap" }}>
            {/* Class Picker Button */}
            <Pressable
              onPress={() => setShowClassModal(true)}
              className="flex-1 flex-row items-center justify-between bg-[#181524] border border-[#ddb7ff]/30 px-4 py-3.5 rounded-2xl active:bg-[#22173a]"
              style={{ flexWrap: "nowrap", minHeight: 48 }}
            >
              <View className="flex-row items-center flex-1 mr-2" style={{ flexWrap: "nowrap" }}>
                <Layers size={16} color="#ddb7ff" style={{ marginRight: 8, flexShrink: 0 }} />
                <Text
                  className="text-white font-extrabold text-sm"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  style={{ includeFontPadding: false }}
                >
                  {selectedClass}
                </Text>
              </View>
              <ChevronDown size={16} color="#ddb7ff" style={{ flexShrink: 0 }} />
            </Pressable>

            {/* Subject Picker Button */}
            <Pressable
              onPress={() => setShowSubjectModal(true)}
              className="flex-1 flex-row items-center justify-between bg-[#181524] border border-[#ddb7ff]/30 px-4 py-3.5 rounded-2xl active:bg-[#22173a]"
              style={{ flexWrap: "nowrap", minHeight: 48 }}
            >
              <View className="flex-row items-center flex-1 mr-2" style={{ flexWrap: "nowrap" }}>
                <BookOpen size={16} color="#c084fc" style={{ marginRight: 8, flexShrink: 0 }} />
                <Text
                  className="text-white font-extrabold text-sm"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  style={{ includeFontPadding: false }}
                >
                  {selectedSubject}
                </Text>
              </View>
              <ChevronDown size={16} color="#c084fc" style={{ flexShrink: 0 }} />
            </Pressable>
          </View>
        </View>

        {/* 2. FOUR KPI SUMMARY CARDS */}
        <View className="mb-6">
          <View className="flex-row justify-between mb-3" style={{ gap: 10 }}>
            {/* Card 1: Class Average */}
            <View className="flex-1 bg-[#181524] border border-white/10 rounded-2xl p-4 shadow-lg">
              <View className="flex-row items-center justify-between mb-1.5" style={{ flexWrap: "nowrap" }}>
                <Text
                  className="text-white/60 text-[11px] font-extrabold uppercase tracking-wider"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  style={{ flexShrink: 1, includeFontPadding: false }}
                >
                  Class Average
                </Text>
                <View className="w-8 h-8 rounded-xl bg-[#38bdf8]/15 items-center justify-center" style={{ flexShrink: 0 }}>
                  <TrendingUp size={16} color="#38bdf8" />
                </View>
              </View>
              <Text
                className="text-white text-3xl font-black"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={{ includeFontPadding: false }}
              >
                {classAvg}%
              </Text>
              <Text
                className="text-[#38bdf8] text-xs font-semibold mt-1"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={{ includeFontPadding: false }}
              >
                {selectedClass} • {selectedSubject}
              </Text>
            </View>

            {/* Card 2: Highest Score */}
            <View className="flex-1 bg-[#181524] border border-white/10 rounded-2xl p-4 shadow-lg">
              <View className="flex-row items-center justify-between mb-1.5" style={{ flexWrap: "nowrap" }}>
                <Text
                  className="text-white/60 text-[11px] font-extrabold uppercase tracking-wider"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  style={{ flexShrink: 1, includeFontPadding: false }}
                >
                  Highest Score
                </Text>
                <View className="w-8 h-8 rounded-xl bg-[#ddb7ff]/15 items-center justify-center" style={{ flexShrink: 0 }}>
                  <Award size={16} color="#ddb7ff" />
                </View>
              </View>
              <Text
                className="text-white text-3xl font-black"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={{ includeFontPadding: false }}
              >
                {highestScore}%
              </Text>
              <Text
                className="text-[#ddb7ff] text-xs font-semibold mt-1"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={{ includeFontPadding: false }}
              >
                Top standing
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between" style={{ gap: 10 }}>
            {/* Card 3: Passing Rate (>=35%) */}
            <View className="flex-1 bg-[#181524] border border-white/10 rounded-2xl p-4 shadow-lg">
              <View className="flex-row items-center justify-between mb-1.5" style={{ flexWrap: "nowrap" }}>
                <Text
                  className="text-white/60 text-[11px] font-extrabold uppercase tracking-wider"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  style={{ flexShrink: 1, includeFontPadding: false }}
                >
                  Passing Rate (≥35%)
                </Text>
                <View className="w-8 h-8 rounded-xl bg-[#00f1a1]/15 items-center justify-center" style={{ flexShrink: 0 }}>
                  <Percent size={16} color="#00f1a1" />
                </View>
              </View>
              <Text
                className="text-white text-3xl font-black"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={{ includeFontPadding: false }}
              >
                {passingRate}%
              </Text>
              <Text
                className="text-[#00f1a1] text-xs font-semibold mt-1"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={{ includeFontPadding: false }}
              >
                Students passing
              </Text>
            </View>

            {/* Card 4: Total Students */}
            <View className="flex-1 bg-[#181524] border border-white/10 rounded-2xl p-4 shadow-lg">
              <View className="flex-row items-center justify-between mb-1.5" style={{ flexWrap: "nowrap" }}>
                <Text
                  className="text-white/60 text-[11px] font-extrabold uppercase tracking-wider"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  style={{ flexShrink: 1, includeFontPadding: false }}
                >
                  Total Students
                </Text>
                <View className="w-8 h-8 rounded-xl bg-amber-500/15 items-center justify-center" style={{ flexShrink: 0 }}>
                  <Users size={16} color="#fcd34d" />
                </View>
              </View>
              <Text
                className="text-white text-3xl font-black"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={{ includeFontPadding: false }}
              >
                {totalStudents}
              </Text>
              <Text
                className="text-amber-300 text-xs font-semibold mt-1"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={{ includeFontPadding: false }}
              >
                Enrolled in class
              </Text>
            </View>
          </View>
        </View>

        {/* 3. STUDENT RANKINGS & MARKS TABLE */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3 px-1" style={{ flexWrap: "nowrap" }}>
            <View className="flex-row items-center flex-1 mr-2" style={{ flexWrap: "nowrap" }}>
              <Award size={18} color="#ddb7ff" style={{ marginRight: 6, flexShrink: 0 }} />
              <Text
                className="text-white text-lg font-extrabold"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={{ flexShrink: 1, includeFontPadding: false }}
              >
                Student Rankings & Marks
              </Text>
            </View>
            <View className="bg-[#ddb7ff]/20 px-3 py-1 rounded-full border border-[#ddb7ff]/40" style={{ flexShrink: 0 }}>
              <Text
                className="text-[#ddb7ff] text-xs font-extrabold uppercase tracking-wide"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={{ includeFontPadding: false }}
              >
                {selectedSubject}
              </Text>
            </View>
          </View>

          {/* Search Box */}
          <View className="bg-[#181524] border border-white/10 rounded-2xl px-3.5 py-2.5 flex-row items-center mb-3" style={{ flexWrap: "nowrap" }}>
            <Search size={16} color="rgba(255,255,255,0.5)" style={{ marginRight: 8, flexShrink: 0 }} />
            <TextInput
              placeholder="Search student name or roll number..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white text-xs font-semibold"
              style={{ includeFontPadding: false }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={14} color="rgba(255,255,255,0.6)" />
              </Pressable>
            )}
          </View>

          {/* Table Container */}
          <View className="bg-[#181524] border border-white/10 rounded-3xl p-3 sm:p-4 shadow-lg">
            {/* Table Header Row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <Text
                style={{
                  width: 32,
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: 10,
                  fontWeight: "800",
                  includeFontPadding: false,
                }}
              >
                Rank
              </Text>
              <Text
                style={{
                  flex: 1,
                  textAlign: "left",
                  paddingLeft: 30,
                  paddingRight: 4,
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: 10,
                  fontWeight: "800",
                  includeFontPadding: false,
                }}
              >
                Student
              </Text>
              <Text
                style={{
                  width: 80,
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: 10,
                  fontWeight: "800",
                  includeFontPadding: false,
                }}
              >
                Roll No
              </Text>
              <Text
                style={{
                  width: 36,
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: 10,
                  fontWeight: "800",
                  includeFontPadding: false,
                }}
              >
                Avg %
              </Text>
              <Text
                style={{
                  width: 62,
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: 10,
                  fontWeight: "800",
                  includeFontPadding: false,
                }}
              >
                Standing
              </Text>
            </View>

            {/* Table Body Rows */}
            {filteredStudents.length > 0 ? (
              filteredStudents.map((st, idx) => {
                const isTop1 = st.rank === 1;
                const isTop2 = st.rank === 2;
                const isTop3 = st.rank === 3;

                return (
                  <View
                    key={st.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 10,
                      borderBottomWidth: idx < filteredStudents.length - 1 ? 1 : 0,
                      borderBottomColor: "rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    {/* Rank Badge Column */}
                    <View style={{ width: 32, alignItems: "center", justifyContent: "center" }}>
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isTop1
                            ? "#f59e0b"
                            : isTop2
                            ? "#e2e8f0"
                            : isTop3
                            ? "#d97706"
                            : "rgba(255, 255, 255, 0.08)",
                          borderWidth: 1,
                          borderColor: isTop1
                            ? "#fbbf24"
                            : isTop2
                            ? "#ffffff"
                            : isTop3
                            ? "#f59e0b"
                            : "rgba(255, 255, 255, 0.12)",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10.5,
                            fontWeight: "900",
                            color: isTop1
                              ? "#150d26"
                              : isTop2
                              ? "#0f172a"
                              : isTop3
                              ? "#ffffff"
                              : "rgba(255, 255, 255, 0.65)",
                            includeFontPadding: false,
                          }}
                        >
                          #{st.rank}
                        </Text>
                      </View>
                    </View>

                    {/* Student Initials & Full Name Column */}
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingLeft: 4, paddingRight: 4 }}>
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 6,
                          flexShrink: 0,
                          backgroundColor: isTop1
                            ? "rgba(245, 158, 11, 0.2)"
                            : isTop2
                            ? "rgba(226, 232, 240, 0.2)"
                            : isTop3
                            ? "rgba(217, 119, 6, 0.25)"
                            : "rgba(221, 183, 255, 0.2)",
                          borderWidth: 1,
                          borderColor: isTop1
                            ? "#f59e0b"
                            : isTop2
                            ? "#e2e8f0"
                            : isTop3
                            ? "#d97706"
                            : "rgba(221, 183, 255, 0.4)",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 8.5,
                            fontWeight: "900",
                            color: isTop1
                              ? "#fbbf24"
                              : isTop2
                              ? "#e2e8f0"
                              : isTop3
                              ? "#fbbf24"
                              : "#ddb7ff",
                            includeFontPadding: false,
                          }}
                        >
                          {st.init}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: "#ffffff",
                          fontSize: 11.5,
                          fontWeight: "800",
                          flex: 1,
                          lineHeight: 14,
                          includeFontPadding: false,
                        }}
                        numberOfLines={2}
                      >
                        {st.name}
                      </Text>
                    </View>

                    {/* Roll No Column */}
                    <View style={{ width: 80, alignItems: "center", justifyContent: "center" }}>
                      <Text
                        style={{
                          textAlign: "center",
                          color: "rgba(255, 255, 255, 0.6)",
                          fontSize: 9.5,
                          fontWeight: "700",
                          includeFontPadding: false,
                        }}
                        numberOfLines={1}
                      >
                        {st.roll}
                      </Text>
                    </View>

                    {/* Avg % Column */}
                    <View style={{ width: 36, alignItems: "center", justifyContent: "center" }}>
                      <Text
                        style={{
                          textAlign: "center",
                          color: "#ffffff",
                          fontSize: 12,
                          fontWeight: "900",
                          includeFontPadding: false,
                        }}
                      >
                        {st.average}%
                      </Text>
                    </View>

                    {/* Standing Column */}
                    <View style={{ width: 62, alignItems: "center", justifyContent: "center" }}>
                      <View
                        className={`px-1.5 py-0.5 rounded-full border ${st.standingColor.bg} ${st.standingColor.border}`}
                        style={{ maxWidth: 62 }}
                      >
                        <Text
                          className={`font-black uppercase tracking-tight ${st.standingColor.text}`}
                          style={{ fontSize: 8, includeFontPadding: false, textAlign: "center" }}
                          numberOfLines={1}
                        >
                          {st.standing}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View className="py-10 items-center justify-center">
                <Users size={32} color="rgba(255,255,255,0.3)" style={{ marginBottom: 8 }} />
                <Text className="text-white/50 text-xs font-semibold text-center">
                  No students found matching "{searchQuery}"
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 4. SCORE RANGES DISTRIBUTION & TOP PERFORMERS CARDS */}
        <View className="mb-6" style={{ gap: 14 }}>
          {/* Card: Score Ranges Distribution */}
          <View className="bg-[#181524] border border-white/10 rounded-3xl p-4 shadow-lg">
            <View className="flex-row items-center justify-between mb-3" style={{ flexWrap: "nowrap" }}>
              <View className="flex-row items-center flex-1 mr-2" style={{ flexWrap: "nowrap" }}>
                <BarChart2 size={18} color="#00f1a1" style={{ marginRight: 6, flexShrink: 0 }} />
                <Text
                  className="text-white text-base font-extrabold"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  style={{ includeFontPadding: false }}
                >
                  Score Ranges Distribution
                </Text>
              </View>
              <Text className="text-white/40 text-xs font-semibold" numberOfLines={1} style={{ includeFontPadding: false }}>
                {selectedClass}
              </Text>
            </View>

            {/* Distribution Visual Bars */}
            <View className="space-y-3">
              {scoreDistribution.map((item, idx) => {
                const percent = totalStudents > 0 ? Math.round((item.count / totalStudents) * 100) : 0;

                return (
                  <View key={idx} className="mb-2.5">
                    <View className="flex-row items-center justify-between mb-1" style={{ flexWrap: "nowrap" }}>
                      <Text className="text-white/70 text-xs font-bold flex-1" numberOfLines={1} style={{ includeFontPadding: false }}>
                        {item.label}
                      </Text>
                      <Text className="text-white font-extrabold text-xs" numberOfLines={1} style={{ includeFontPadding: false }}>
                        {item.count} students ({percent}%)
                      </Text>
                    </View>

                    {/* Bar Track */}
                    <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <View
                        style={{
                          width: `${Math.max(percent, item.count > 0 ? 8 : 0)}%`,
                          height: "100%",
                          backgroundColor: item.color,
                          borderRadius: 999,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Card: Top Performers */}
          <View className="bg-[#181524] border border-white/10 rounded-3xl p-4 shadow-lg">
            <View className="flex-row items-center justify-between mb-3" style={{ flexWrap: "nowrap" }}>
              <View className="flex-row items-center flex-1 mr-2" style={{ flexWrap: "nowrap" }}>
                <Crown size={18} color="#fcd34d" style={{ marginRight: 6, flexShrink: 0 }} />
                <Text
                  className="text-white text-base font-extrabold"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  style={{ includeFontPadding: false }}
                >
                  Top Performers
                </Text>
              </View>
              <Text className="text-[#ddb7ff] text-xs font-extrabold" numberOfLines={1} style={{ includeFontPadding: false }}>
                Top 3
              </Text>
            </View>

            <View className="space-y-2.5">
              {topPerformers.map((tp) => (
                <View
                  key={tp.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex-row items-center justify-between mb-2"
                  style={{ flexWrap: "nowrap" }}
                >
                  <View className="flex-row items-center flex-1 mr-3" style={{ flexWrap: "nowrap" }}>
                    <View className="w-10 h-10 rounded-full bg-[#ddb7ff]/20 border border-[#ddb7ff]/40 items-center justify-center mr-3" style={{ flexShrink: 0 }}>
                      <Text className="text-[#ddb7ff] text-xs font-black" numberOfLines={1} style={{ includeFontPadding: false }}>
                        {tp.init}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-white font-extrabold text-sm"
                        numberOfLines={2}
                        style={{ includeFontPadding: false, lineHeight: 18 }}
                      >
                        {tp.name}
                      </Text>
                      <Text
                        className="text-white/50 text-[11px] font-medium"
                        numberOfLines={1}
                        style={{ includeFontPadding: false }}
                      >
                        {tp.roll}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end" style={{ flexShrink: 0 }}>
                    <Text
                      className="text-white font-black text-base"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                      style={{ includeFontPadding: false }}
                    >
                      {tp.average}%
                    </Text>
                    <Text
                      className="text-white/40 text-[10px] font-semibold"
                      numberOfLines={1}
                      style={{ includeFontPadding: false }}
                    >
                      Overall Average
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* CLASS SELECTOR MODAL */}
      {showClassModal && (
        <Modal
          visible={showClassModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowClassModal(false)}
        >
          <View className="flex-1 bg-black/80 items-center justify-center p-5">
            <View className="w-full max-w-sm bg-[#181524] border border-[#ddb7ff]/30 rounded-3xl p-5 shadow-2xl">
              <View className="flex-row items-center justify-between pb-3 border-b border-white/10 mb-4" style={{ flexWrap: "nowrap" }}>
                <View className="flex-row items-center flex-1 mr-2" style={{ flexWrap: "nowrap" }}>
                  <Layers size={18} color="#ddb7ff" style={{ marginRight: 8, flexShrink: 0 }} />
                  <Text className="text-white font-extrabold text-base" numberOfLines={1} style={{ includeFontPadding: false }}>
                    Select Class
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowClassModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                >
                  <X size={16} color="white" />
                </Pressable>
              </View>

              <ScrollView className="max-h-72" showsVerticalScrollIndicator={false}>
                {teacherClasses.map((cls) => {
                  const isSelected = cls === selectedClass;
                  return (
                    <Pressable
                      key={cls}
                      onPress={() => {
                        setSelectedClass(cls);
                        setShowClassModal(false);
                      }}
                      style={[
                        {
                          padding: 14,
                          borderRadius: 16,
                          marginBottom: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        },
                        isSelected
                          ? {
                              backgroundColor: "rgba(221, 183, 255, 0.25)",
                              borderWidth: 2,
                              borderColor: "#ddb7ff",
                            }
                          : {
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                              borderWidth: 1,
                              borderColor: "rgba(255, 255, 255, 0.10)",
                            },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: isSelected ? 15 : 14,
                          fontWeight: isSelected ? "900" : "700",
                          color: isSelected ? "#ddb7ff" : "#ffffff",
                          includeFontPadding: false,
                        }}
                        numberOfLines={1}
                      >
                        {cls}
                      </Text>
                      {isSelected && (
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: "#ddb7ff",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Check size={14} color="#181524" strokeWidth={3} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* SUBJECT SELECTOR MODAL */}
      {showSubjectModal && (
        <Modal
          visible={showSubjectModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSubjectModal(false)}
        >
          <View className="flex-1 bg-black/80 items-center justify-center p-5">
            <View className="w-full max-w-sm bg-[#181524] border border-[#ddb7ff]/30 rounded-3xl p-5 shadow-2xl">
              <View className="flex-row items-center justify-between pb-3 border-b border-white/10 mb-4" style={{ flexWrap: "nowrap" }}>
                <View className="flex-row items-center flex-1 mr-2" style={{ flexWrap: "nowrap" }}>
                  <BookOpen size={18} color="#c084fc" style={{ marginRight: 8, flexShrink: 0 }} />
                  <Text className="text-white font-extrabold text-base" numberOfLines={1} style={{ includeFontPadding: false }}>
                    Select Subject
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowSubjectModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                >
                  <X size={16} color="white" />
                </Pressable>
              </View>

              <ScrollView className="max-h-72" showsVerticalScrollIndicator={false}>
                {availableSubjects.map((sub) => {
                  const isSelected = sub === selectedSubject;
                  return (
                    <Pressable
                      key={sub}
                      onPress={() => {
                        setSelectedSubject(sub);
                        setShowSubjectModal(false);
                      }}
                      style={[
                        {
                          padding: 14,
                          borderRadius: 16,
                          marginBottom: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        },
                        isSelected
                          ? {
                              backgroundColor: "rgba(221, 183, 255, 0.25)",
                              borderWidth: 2,
                              borderColor: "#ddb7ff",
                            }
                          : {
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                              borderWidth: 1,
                              borderColor: "rgba(255, 255, 255, 0.10)",
                            },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: isSelected ? 15 : 14,
                          fontWeight: isSelected ? "900" : "700",
                          color: isSelected ? "#ddb7ff" : "#ffffff",
                          includeFontPadding: false,
                        }}
                        numberOfLines={1}
                      >
                        {sub}
                      </Text>
                      {isSelected && (
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: "#ddb7ff",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Check size={14} color="#181524" strokeWidth={3} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#08070d",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
});

export default TeacherPerformanceScreen;
