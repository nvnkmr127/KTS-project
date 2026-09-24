import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Share,
  Dimensions,
  BackHandler,
  Alert,
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
  Search,
  ChevronDown,
  Download,
  Calendar,
  CheckCircle2,
  ChevronRight,
  X,
  FileText,
  Plus,
  Trash2,
  Pencil,
  AlertCircle,
  CheckSquare,
  Square,
  Layers,
} from "lucide-react-native";
import { useResponsive } from "../../utils/responsive";
import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface ExamItem {
  id: string;
  name: string;
  classes: string;
  subjects: string;
  date: string;
  maxMarks: number;
  status: "Upcoming" | "Completed" | "Results Published";
}

const INITIAL_EXAMS: ExamItem[] = [
  {
    id: "1",
    name: "FA 1",
    classes: "Class 10A, 9A, 8A, 7A, 6A",
    subjects: "All Subjects",
    date: "01-09-2027",
    maxMarks: 20,
    status: "Results Published",
  },
  {
    id: "2",
    name: "FA 1 PRIMARY",
    classes: "Class 1B, 1A, 2A, 2B, 3A, 3B, 4A, 4B, 5A",
    subjects: "All Subjects",
    date: "01-01-2026",
    maxMarks: 50,
    status: "Completed",
  },
  {
    id: "3",
    name: "Mid-Term Examination 2026",
    classes: "Class 10A, 10B, 9A, 9B",
    subjects: "Mathematics, Physics, Chemistry",
    date: "15-10-2026",
    maxMarks: 100,
    status: "Upcoming",
  },
  {
    id: "4",
    name: "Quarterly Assessment 2026",
    classes: "All High School Classes",
    subjects: "All Subjects",
    date: "20-11-2026",
    maxMarks: 50,
    status: "Upcoming",
  },
];

export const AdminExamScheduleListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isSmallPhone, headerPaddingTop } = useResponsive();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";

  const primaryColor = isSuperAdmin ? "#f0c110" : "#00f1a1";
  const primaryLight = isSuperAdmin ? "#ffe5a0" : "#00f1a1";
  const bgGradient = isSuperAdmin
    ? (["#101415", "#1a1e1f", "#0b0c0d", "#080809"] as const)
    : (["#061a14", "#0d2a24", "#081713", "#050f0c"] as const);

  const cardBg = isSuperAdmin ? "#181d1f" : "#102d26";
  const cardBorder = isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)";

  const [exams, setExams] = useState<ExamItem[]>(INITIAL_EXAMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All Statuses");
  const [selectedSort, setSelectedSort] = useState<string>("No Sorting");

  // Dropdown Picker Modals
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bulk Selection States
  const [isBulkSelectionMode, setIsBulkSelectionMode] = useState(false);
  const [selectedExamIds, setSelectedExamIds] = useState<Record<string, boolean>>({});

  // Admin Create / Edit Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [formExamName, setFormExamName] = useState("");
  const [formClasses, setFormClasses] = useState("");
  const [formSubjects, setFormSubjects] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formMaxMarks, setFormMaxMarks] = useState("100");
  const [formStatus, setFormStatus] = useState<ExamItem["status"]>("Upcoming");

  // Delete Confirmation Modal State
  const [deletingExam, setDeletingExam] = useState<ExamItem | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

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

  const topTabs = [
    { id: "AdminExamSchedule", label: "Exam Schedule", active: true },
    { id: "AdminExamResults", label: "Results & Rankings" },
    { id: "AdminMarksPreview", label: "Marks Preview" },
    { id: "AdminExamScheduleDesigner", label: "Schedule Designer" },
    { id: "AdminExamInvigilation", label: "Allot Invigilation" },
  ];

  // Filter & Sort Logic
  const filteredExams = useMemo(() => {
    let list = [...exams];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          ex.classes.toLowerCase().includes(q) ||
          ex.subjects.toLowerCase().includes(q)
      );
    }

    if (selectedStatus !== "All Statuses") {
      list = list.filter((ex) => ex.status === selectedStatus);
    }

    if (selectedSort === "Date: Earliest First") {
      list.sort((a, b) => a.date.localeCompare(b.date));
    } else if (selectedSort === "Date: Latest First") {
      list.sort((a, b) => b.date.localeCompare(a.date));
    } else if (selectedSort === "Name: A - Z") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (selectedSort === "Max Marks (High to Low)") {
      list.sort((a, b) => b.maxMarks - a.maxMarks);
    }

    return list;
  }, [exams, searchQuery, selectedStatus, selectedSort]);

  // KPI Metrics Calculations
  const upcomingCount = useMemo(
    () => exams.filter((e) => e.status === "Upcoming").length,
    [exams]
  );
  const resultsPublishedCount = useMemo(
    () => exams.filter((e) => e.status === "Results Published").length,
    [exams]
  );

  const handleExport = async () => {
    setShowExportModal(false);
    showToast("Exam schedule exported successfully!");
    try {
      await Share.share({
        title: "KTS Exam Schedule",
        message:
          "KTS Model High School - Exam Schedule 2026-2027\n\n" +
          exams
            .map(
              (e) => `• ${e.name} (${e.status})\n  Classes: ${e.classes}\n  Date: ${e.date} | Max Marks: ${e.maxMarks}`
            )
            .join("\n\n"),
      });
    } catch {
      // ignore
    }
  };

  const getStatusBadgeStyle = (status: ExamItem["status"]) => {
    switch (status) {
      case "Results Published":
        return {
          bg: "bg-emerald-500/20",
          border: "border-emerald-500/40",
          text: "text-emerald-300",
        };
      case "Completed":
        return {
          bg: "bg-amber-500/20",
          border: "border-amber-500/40",
          text: "text-amber-300",
        };
      case "Upcoming":
      default:
        return {
          bg: isSuperAdmin ? "bg-[#f0c110]/20" : "bg-[#00f1a1]/20",
          border: isSuperAdmin ? "border-[#f0c110]/40" : "border-[#00f1a1]/40",
          text: isSuperAdmin ? "text-[#ffe5a0]" : "text-[#00f1a1]",
        };
    }
  };

  // Bulk Actions
  const toggleSelectExam = (id: string) => {
    setSelectedExamIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectAllExams = () => {
    const allSelected = filteredExams.every((e) => selectedExamIds[e.id]);
    if (allSelected) {
      setSelectedExamIds({});
    } else {
      const updated: Record<string, boolean> = {};
      filteredExams.forEach((e) => {
        updated[e.id] = true;
      });
      setSelectedExamIds(updated);
    }
  };

  const selectedCount = useMemo(() => {
    return Object.values(selectedExamIds).filter(Boolean).length;
  }, [selectedExamIds]);

  const handleBulkDelete = () => {
    setExams((prev) => prev.filter((e) => !selectedExamIds[e.id]));
    setSelectedExamIds({});
    setShowBulkDeleteConfirm(false);
    setIsBulkSelectionMode(false);
    showToast("Selected examinations deleted successfully.");
  };

  const openCreateModal = () => {
    setEditingExamId(null);
    setFormExamName("");
    setFormClasses("Class 10A, 9A, 8A, 7A, 6A");
    setFormSubjects("All Subjects");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormMaxMarks("100");
    setFormStatus("Upcoming");
    setShowCreateModal(true);
  };

  const openEditModal = (exam: ExamItem) => {
    setEditingExamId(exam.id);
    setFormExamName(exam.name);
    setFormClasses(exam.classes);
    setFormSubjects(exam.subjects);
    setFormDate(exam.date);
    setFormMaxMarks(String(exam.maxMarks));
    setFormStatus(exam.status);
    setShowCreateModal(true);
  };

  const handleSaveExam = () => {
    if (!formExamName.trim()) {
      Alert.alert("Validation Error", "Please provide an Examination Name.");
      return;
    }

    const marksNum = parseInt(formMaxMarks, 10) || 100;

    if (editingExamId) {
      setExams((prev) =>
        prev.map((e) =>
          e.id === editingExamId
            ? {
                ...e,
                name: formExamName.trim(),
                classes: formClasses.trim() || "All Classes",
                subjects: formSubjects.trim() || "All Subjects",
                date: formDate.trim() || "01-10-2026",
                maxMarks: marksNum,
                status: formStatus,
              }
            : e
        )
      );
      showToast("Examination updated successfully!");
    } else {
      const newExam: ExamItem = {
        id: `exam_${Date.now()}`,
        name: formExamName.trim(),
        classes: formClasses.trim() || "All Classes",
        subjects: formSubjects.trim() || "All Subjects",
        date: formDate.trim() || "01-10-2026",
        maxMarks: marksNum,
        status: formStatus,
      };
      setExams((prev) => [newExam, ...prev]);
      showToast("New examination created successfully!");
    }

    setShowCreateModal(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingExam) {
      setExams((prev) => prev.filter((e) => e.id !== deletingExam.id));
      showToast(`Exam "${deletingExam.name}" deleted successfully.`);
      setDeletingExam(null);
    }
  };

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
              <View className="flex-1">
                <Text className="text-white text-lg md:text-xl font-extrabold" numberOfLines={1}>
                  Exam Schedule
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <View
                    className="w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <Text className="text-xs font-semibold" style={{ color: primaryLight }}>
                    Academic Year: 2026-2027 (Current)
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions: Create Exam & Export */}
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Pressable
                onPress={openCreateModal}
                className="px-3.5 py-2 rounded-xl flex-row items-center shadow-md active:opacity-80"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus size={14} color="#000" style={{ marginRight: 4 }} />
                <Text className="text-black text-xs font-black">Create</Text>
              </Pressable>

              <Pressable
                onPress={() => setShowExportModal(true)}
                className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 flex-row items-center active:bg-white/20"
              >
                <Download size={14} color={primaryLight} style={{ marginRight: 4 }} />
                <Text className="text-white text-xs font-bold">Export</Text>
              </Pressable>
            </View>
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
        contentContainerStyle={{
          paddingBottom: insets.bottom + 95,
          paddingHorizontal: 16,
          paddingTop: 16,
        }}
      >
        {/* 4 KPI CARDS (Matching Web App Metrics) */}
        <View className="flex-row flex-wrap justify-between mb-4" style={{ gap: 10 }}>
          {/* 1. Upcoming Exams */}
          <View
            className="w-[48%] border rounded-2xl p-3.5 shadow-md relative overflow-hidden"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white/60 text-[11px] font-bold">Upcoming Exams</Text>
              <View className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 items-center justify-center">
                <BookOpen size={16} color="#38bdf8" />
              </View>
            </View>
            <Text className="text-white text-2xl font-black">{upcomingCount}</Text>
            <Text className="text-white/40 text-[10px] font-medium mt-0.5">This month</Text>
          </View>

          {/* 2. Class Average */}
          <View
            className="w-[48%] border rounded-2xl p-3.5 shadow-md relative overflow-hidden"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white/60 text-[11px] font-bold">Class Average</Text>
              <View className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center">
                <BarChart2 size={16} color="#34d399" />
              </View>
            </View>
            <Text className="text-white text-2xl font-black">78.4%</Text>
            <Text className="text-white/40 text-[10px] font-medium mt-0.5">All Classes • Overall</Text>
          </View>

          {/* 3. Top Score */}
          <View
            className="w-[48%] border rounded-2xl p-3.5 shadow-md relative overflow-hidden"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white/60 text-[11px] font-bold">Top Score</Text>
              <View
                className="w-8 h-8 rounded-xl items-center justify-center border"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  borderColor: `${primaryColor}40`,
                }}
              >
                <Award size={16} color={primaryLight} />
              </View>
            </View>
            <Text className="text-white text-2xl font-black">98.5%</Text>
            <Text className="text-white/40 text-[10px] font-medium mt-0.5">Highest ranker</Text>
          </View>

          {/* 4. Results Published */}
          <View
            className="w-[48%] border rounded-2xl p-3.5 shadow-md relative overflow-hidden"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white/60 text-[11px] font-bold">Results Published</Text>
              <View className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 items-center justify-center">
                <TrendingUp size={16} color="#facc15" />
              </View>
            </View>
            <Text className="text-white text-2xl font-black">{resultsPublishedCount}</Text>
            <Text className="text-white/40 text-[10px] font-medium mt-0.5">Exams</Text>
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
                className="px-4 py-2.5 rounded-xl border flex-row items-center"
                style={{
                  backgroundColor: t.active
                    ? primaryColor
                    : isSuperAdmin
                    ? "rgba(26, 30, 31, 0.9)"
                    : "rgba(16, 45, 38, 0.9)",
                  borderColor: t.active
                    ? primaryColor
                    : isSuperAdmin
                    ? "rgba(240, 193, 16, 0.2)"
                    : "rgba(0, 241, 161, 0.2)",
                }}
              >
                <Text
                  className="text-xs font-black"
                  style={{ color: t.active ? "#000" : "#fff" }}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* SEARCH & FILTER CONTROLS */}
        <View className="mb-4" style={{ gap: 8 }}>
          {/* Search Bar */}
          <View
            className="flex-row items-center border rounded-2xl px-3.5 py-2.5"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
            }}
          >
            <Search size={16} color={primaryLight} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search exams by name, class or subject..."
              placeholderTextColor="#ffffff50"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white text-xs font-semibold py-0"
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery("")}>
                <X size={15} color="#ffffff70" />
              </Pressable>
            ) : null}
          </View>

          {/* Dropdown Filters (Status & Sorting) */}
          <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
            {/* Status Dropdown Trigger */}
            <Pressable
              onPress={() => setShowStatusPicker(true)}
              className="flex-1 border rounded-xl px-3 py-2.5 flex-row items-center justify-between active:opacity-80"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
            >
              <Text numberOfLines={1} className="text-white/80 text-xs font-bold mr-1">
                {selectedStatus}
              </Text>
              <ChevronDown size={14} color={primaryLight} />
            </Pressable>

            {/* Sorting Dropdown Trigger */}
            <Pressable
              onPress={() => setShowSortPicker(true)}
              className="flex-1 border rounded-xl px-3 py-2.5 flex-row items-center justify-between active:opacity-80"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
            >
              <Text numberOfLines={1} className="text-white/80 text-xs font-bold mr-1">
                {selectedSort}
              </Text>
              <ChevronDown size={14} color={primaryLight} />
            </Pressable>
          </View>
        </View>

        {/* LIST HEADER WITH BULK SELECTION CONTROLS */}
        <View className="mb-2 flex-row items-center justify-between px-1">
          <View className="flex-row items-center">
            <Text className="text-white/70 text-xs font-bold uppercase tracking-wider mr-2">
              Examination List
            </Text>
            <Text className="text-xs font-bold" style={{ color: primaryLight }}>
              ({filteredExams.length} {filteredExams.length === 1 ? "Exam" : "Exams"})
            </Text>
          </View>

          {/* Bulk Selection Toggle */}
          <Pressable
            onPress={() => {
              setIsBulkSelectionMode(!isBulkSelectionMode);
              setSelectedExamIds({});
            }}
            className="px-2.5 py-1 rounded-lg border flex-row items-center active:opacity-80"
            style={{
              backgroundColor: isBulkSelectionMode ? `${primaryColor}20` : "rgba(255, 255, 255, 0.05)",
              borderColor: isBulkSelectionMode ? primaryColor : "rgba(255, 255, 255, 0.15)",
            }}
          >
            <Layers size={13} color={isBulkSelectionMode ? primaryLight : "#fff"} style={{ marginRight: 4 }} />
            <Text
              className="text-[11px] font-bold"
              style={{ color: isBulkSelectionMode ? primaryLight : "#fff" }}
            >
              {isBulkSelectionMode ? "Exit Bulk" : "Bulk Select"}
            </Text>
          </Pressable>
        </View>

        {/* BULK ACTION BAR WHEN ACTIVE */}
        {isBulkSelectionMode && (
          <View
            className="p-3 rounded-2xl mb-3 border flex-row items-center justify-between"
            style={{
              backgroundColor: `${primaryColor}15`,
              borderColor: `${primaryColor}40`,
            }}
          >
            <Pressable onPress={selectAllExams} className="flex-row items-center">
              {filteredExams.every((e) => selectedExamIds[e.id]) && filteredExams.length > 0 ? (
                <CheckSquare size={16} color={primaryLight} style={{ marginRight: 6 }} />
              ) : (
                <Square size={16} color={primaryLight} style={{ marginRight: 6 }} />
              )}
              <Text className="text-xs font-bold" style={{ color: primaryLight }}>
                Select All ({selectedCount})
              </Text>
            </Pressable>

            {selectedCount > 0 && (
              <Pressable
                onPress={() => setShowBulkDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 flex-row items-center active:bg-rose-500/30"
              >
                <Trash2 size={13} color="#f87171" style={{ marginRight: 4 }} />
                <Text className="text-rose-300 text-xs font-bold">Delete Selected ({selectedCount})</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* LIST OF EXAMS */}
        {filteredExams.length === 0 ? (
          <View
            className="border rounded-2xl p-8 items-center justify-center my-4"
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
            }}
          >
            <BookOpen size={32} color="rgba(255, 255, 255, 0.3)" style={{ marginBottom: 8 }} />
            <Text className="text-white/70 font-bold text-sm">No examinations found</Text>
            <Text className="text-white/40 text-xs text-center mt-1 mb-4">
              Try adjusting your search query or create a new examination.
            </Text>
            <Pressable
              onPress={openCreateModal}
              className="px-4 py-2.5 rounded-xl flex-row items-center"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={15} color="#000" style={{ marginRight: 6 }} />
              <Text className="text-black text-xs font-black">Create Examination</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredExams.map((exam) => {
              const badgeStyle = getStatusBadgeStyle(exam.status);
              const isSelected = !!selectedExamIds[exam.id];

              let targetClass = "10A";
              if (exam.classes && exam.classes !== "All Classes") {
                const classes = exam.classes.replace(/^Class\s*/i, "").split(",").map((c) => c.trim());
                if (classes.length > 0) targetClass = classes[0];
              }

              const examPayload = {
                id: exam.id,
                name: exam.name,
                classes: exam.classes.replace(/^Class\s*/i, ""),
                subjects: exam.subjects,
                date: exam.date,
                maxMarks: exam.maxMarks,
                status: exam.status,
              };

              const handleOpenDesigner = () => {
                navigation.navigate("AdminExamScheduleDesigner", {
                  examId: exam.id,
                  exam: examPayload,
                  selectedClass: targetClass,
                });
              };

              return (
                <Pressable
                  key={exam.id}
                  onPress={() => {
                    if (isBulkSelectionMode) {
                      toggleSelectExam(exam.id);
                    } else {
                      handleOpenDesigner();
                    }
                  }}
                  className="border rounded-2xl p-4 shadow-lg relative overflow-hidden"
                  style={{
                    backgroundColor: cardBg,
                    borderColor: isSelected ? primaryColor : cardBorder,
                    borderRadius: 16,
                  }}
                >
                  {/* Top Section: Checkbox / Book Icon + Title + Status + Admin Actions */}
                  <View className="flex-row items-start mb-3">
                    {isBulkSelectionMode ? (
                      <Pressable
                        onPress={() => toggleSelectExam(exam.id)}
                        className="w-11 h-11 rounded-xl items-center justify-center mr-3 border"
                        style={{
                          backgroundColor: isSelected ? `${primaryColor}20` : "rgba(255, 255, 255, 0.05)",
                          borderColor: isSelected ? primaryColor : "rgba(255, 255, 255, 0.15)",
                        }}
                      >
                        {isSelected ? (
                          <CheckSquare size={20} color={primaryLight} />
                        ) : (
                          <Square size={20} color="rgba(255, 255, 255, 0.4)" />
                        )}
                      </Pressable>
                    ) : (
                      <View className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 items-center justify-center mr-3">
                        <BookOpen size={20} color="#38bdf8" />
                      </View>
                    )}

                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center flex-wrap" style={{ gap: 6, marginBottom: 2 }}>
                        <Text className="text-white text-base font-black mr-1">
                          {exam.name}
                        </Text>
                        <View
                          className={`px-2 py-0.5 rounded-md border ${badgeStyle.bg} ${badgeStyle.border}`}
                        >
                          <Text className={`text-[10px] font-black ${badgeStyle.text}`}>
                            {exam.status}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-white/50 text-xs font-medium" numberOfLines={2}>
                        {exam.classes}
                      </Text>
                    </View>

                    {/* Admin Actions: Edit & Delete */}
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Pressable
                        onPress={() => openEditModal(exam)}
                        className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Pencil size={14} color={primaryLight} />
                      </Pressable>
                      <Pressable
                        onPress={() => setDeletingExam(exam)}
                        className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 items-center justify-center active:bg-rose-500/25"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={14} color="#f87171" />
                      </Pressable>
                    </View>
                  </View>

                  {/* Metadata Info Row */}
                  <View
                    className="rounded-xl p-2.5 mb-3.5 flex-row flex-wrap items-center justify-between"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.35)", gap: 6 }}
                  >
                    <View className="flex-row items-center">
                      <FileText size={12} color={primaryLight} style={{ marginRight: 4 }} />
                      <Text className="text-white/70 text-xs font-semibold">
                        Subjects: <Text className="text-white font-bold">{exam.subjects}</Text>
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Calendar size={12} color={primaryLight} style={{ marginRight: 4 }} />
                      <Text className="text-white/70 text-xs font-semibold">
                        Date: <Text className="text-white font-bold">{exam.date}</Text>
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Award size={12} color="#facc15" style={{ marginRight: 4 }} />
                      <Text className="text-white/70 text-xs font-semibold">
                        Max Marks: <Text className="text-[#facc15] font-black">{exam.maxMarks}</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Action Button Row */}
                  <View className="flex-row items-center justify-end pt-2 border-t border-white/10" style={{ gap: 8 }}>
                    {exam.status === "Results Published" && (
                      <Pressable
                        onPress={() => navigation.navigate("AdminExamResults", { examId: exam.id, exam: examPayload })}
                        className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/40 flex-row items-center active:bg-blue-500/30"
                      >
                        <Text className="text-blue-300 font-extrabold text-xs mr-1">
                          View Results
                        </Text>
                        <ChevronRight size={14} color="#93c5fd" />
                      </Pressable>
                    )}

                    {exam.status === "Completed" && (
                      <Pressable
                        onPress={() => navigation.navigate("AdminMarksPreview", { examId: exam.id, exam: examPayload, selectedClass: targetClass })}
                        className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex-row items-center active:bg-emerald-500/30"
                      >
                        <Text className="text-emerald-300 font-extrabold text-xs mr-1">
                          Marks Preview
                        </Text>
                        <ChevronRight size={14} color="#6ee7b7" />
                      </Pressable>
                    )}

                    {exam.status === "Upcoming" && (
                      <Pressable
                        onPress={handleOpenDesigner}
                        className="px-4 py-2 rounded-xl border flex-row items-center active:opacity-80"
                        style={{
                          backgroundColor: `${primaryColor}20`,
                          borderColor: `${primaryColor}40`,
                        }}
                      >
                        <Text className="font-extrabold text-xs mr-1" style={{ color: primaryLight }}>
                          Schedule Designer
                        </Text>
                        <ChevronRight size={14} color={primaryLight} />
                      </Pressable>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* STATUS PICKER MODAL */}
      {showStatusPicker && (
        <Modal transparent animationType="fade" visible={showStatusPicker}>
          <Pressable
            onPress={() => setShowStatusPicker(false)}
            className="flex-1 bg-black/80 justify-center items-center p-4"
          >
            <View
              className="w-full max-w-sm border rounded-3xl p-4 shadow-2xl"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
            >
              <Text className="text-white text-base font-extrabold mb-3 px-1">
                Filter by Exam Status
              </Text>
              {["All Statuses", "Upcoming", "Completed", "Results Published"].map((st) => (
                <Pressable
                  key={st}
                  onPress={() => {
                    setSelectedStatus(st);
                    setShowStatusPicker(false);
                  }}
                  className="p-3 rounded-xl mb-1.5 flex-row items-center justify-between border"
                  style={{
                    backgroundColor: selectedStatus === st ? `${primaryColor}20` : "rgba(255, 255, 255, 0.05)",
                    borderColor: selectedStatus === st ? `${primaryColor}40` : "transparent",
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: selectedStatus === st ? primaryLight : "rgba(255, 255, 255, 0.8)" }}
                  >
                    {st}
                  </Text>
                  {selectedStatus === st && <CheckCircle2 size={16} color={primaryLight} />}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}

      {/* SORT PICKER MODAL */}
      {showSortPicker && (
        <Modal transparent animationType="fade" visible={showSortPicker}>
          <Pressable
            onPress={() => setShowSortPicker(false)}
            className="flex-1 bg-black/80 justify-center items-center p-4"
          >
            <View
              className="w-full max-w-sm border rounded-3xl p-4 shadow-2xl"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
            >
              <Text className="text-white text-base font-extrabold mb-3 px-1">
                Sort Examination List
              </Text>
              {[
                "No Sorting",
                "Date: Earliest First",
                "Date: Latest First",
                "Name: A - Z",
                "Max Marks (High to Low)",
              ].map((srt) => (
                <Pressable
                  key={srt}
                  onPress={() => {
                    setSelectedSort(srt);
                    setShowSortPicker(false);
                  }}
                  className="p-3 rounded-xl mb-1.5 flex-row items-center justify-between border"
                  style={{
                    backgroundColor: selectedSort === srt ? `${primaryColor}20` : "rgba(255, 255, 255, 0.05)",
                    borderColor: selectedSort === srt ? `${primaryColor}40` : "transparent",
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: selectedSort === srt ? primaryLight : "rgba(255, 255, 255, 0.8)" }}
                  >
                    {srt}
                  </Text>
                  {selectedSort === srt && <CheckCircle2 size={16} color={primaryLight} />}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}

      {/* CREATE / EDIT EXAM MODAL */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center p-4">
          <View
            className="w-full max-w-md border rounded-3xl p-5 shadow-2xl"
            style={{
              backgroundColor: isSuperAdmin ? "#181d1f" : "#0d2822",
              borderColor: isSuperAdmin ? "rgba(240, 193, 16, 0.3)" : "rgba(0, 241, 161, 0.3)",
            }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-white/10">
              <View className="flex-row items-center">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center mr-2.5 border"
                  style={{
                    backgroundColor: `${primaryColor}20`,
                    borderColor: `${primaryColor}40`,
                  }}
                >
                  <Calendar size={18} color={primaryLight} />
                </View>
                <Text className="text-white text-lg font-black">
                  {editingExamId ? "Edit Examination" : "Create Examination"}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
              >
                <X size={16} color="#fff" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Exam Name */}
              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1.5">Exam Name *</Text>
                <TextInput
                  value={formExamName}
                  onChangeText={setFormExamName}
                  placeholder="e.g. Mid-Term Examination 2026"
                  placeholderTextColor="#ffffff40"
                  className="bg-black/30 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                />
              </View>

              {/* Target Classes */}
              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1.5">Classes (Comma separated)</Text>
                <TextInput
                  value={formClasses}
                  onChangeText={setFormClasses}
                  placeholder="e.g. Class 10A, Class 9A, Class 8A"
                  placeholderTextColor="#ffffff40"
                  className="bg-black/30 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                />
              </View>

              {/* Subjects */}
              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1.5">Subjects Included</Text>
                <TextInput
                  value={formSubjects}
                  onChangeText={setFormSubjects}
                  placeholder="e.g. Mathematics, Physics, Chemistry, English"
                  placeholderTextColor="#ffffff40"
                  className="bg-black/30 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                />
              </View>

              {/* Date & Max Marks */}
              <View className="flex-row mb-3" style={{ gap: 10 }}>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">Start Date</Text>
                  <TextInput
                    value={formDate}
                    onChangeText={setFormDate}
                    placeholder="15-10-2026"
                    placeholderTextColor="#ffffff40"
                    className="bg-black/30 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                  />
                </View>
                <View className="w-28">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">Max Marks</Text>
                  <TextInput
                    value={formMaxMarks}
                    onChangeText={setFormMaxMarks}
                    keyboardType="numeric"
                    placeholder="100"
                    placeholderTextColor="#ffffff40"
                    className="bg-black/30 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold text-center"
                  />
                </View>
              </View>

              {/* Status */}
              <View className="mb-4">
                <Text className="text-white/70 text-xs font-bold mb-1.5">Status</Text>
                <View className="flex-row" style={{ gap: 8 }}>
                  {(["Upcoming", "Completed", "Results Published"] as ExamItem["status"][]).map((st) => (
                    <Pressable
                      key={st}
                      onPress={() => setFormStatus(st)}
                      className="flex-1 py-2 rounded-xl border items-center justify-center"
                      style={{
                        backgroundColor: formStatus === st ? primaryColor : "rgba(255, 255, 255, 0.05)",
                        borderColor: formStatus === st ? primaryColor : "rgba(255, 255, 255, 0.15)",
                      }}
                    >
                      <Text
                        className="text-[11px] font-black"
                        style={{ color: formStatus === st ? "#000" : "#fff" }}
                      >
                        {st === "Results Published" ? "Published" : st}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View className="flex-row items-center pt-3 border-t border-white/10" style={{ gap: 10 }}>
              <Pressable
                onPress={() => setShowCreateModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 border border-white/15 items-center justify-center"
              >
                <Text className="text-white text-xs font-bold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveExam}
                className="flex-1 py-3 rounded-xl items-center justify-center shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                <Text className="text-black text-xs font-black">
                  {editingExamId ? "Update Exam" : "Save Exam"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* SINGLE DELETE CONFIRMATION MODAL */}
      <Modal
        visible={!!deletingExam}
        transparent
        animationType="fade"
        onRequestClose={() => setDeletingExam(null)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center p-4">
          <View
            className="w-full max-w-sm border rounded-3xl p-5 shadow-2xl"
            style={{
              backgroundColor: isSuperAdmin ? "#181d1f" : "#0d2822",
              borderColor: "rgba(239, 68, 68, 0.4)",
            }}
          >
            <View className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 items-center justify-center self-center mb-3">
              <Trash2 size={24} color="#f87171" />
            </View>
            <Text className="text-white text-lg font-black text-center mb-1">Delete Exam?</Text>
            <Text className="text-white/60 text-xs text-center mb-4 leading-relaxed">
              Are you sure you want to delete <Text className="text-white font-bold">"{deletingExam?.name}"</Text>? All timetable schedule entries and student marks records for this exam will be removed.
            </Text>

            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Pressable
                onPress={() => setDeletingExam(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/15 items-center justify-center"
              >
                <Text className="text-white text-xs font-bold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 items-center justify-center shadow-md"
              >
                <Text className="text-white text-xs font-black">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* BULK DELETE CONFIRMATION MODAL */}
      <Modal
        visible={showBulkDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBulkDeleteConfirm(false)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center p-4">
          <View
            className="w-full max-w-sm border rounded-3xl p-5 shadow-2xl"
            style={{
              backgroundColor: isSuperAdmin ? "#181d1f" : "#0d2822",
              borderColor: "rgba(239, 68, 68, 0.4)",
            }}
          >
            <View className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 items-center justify-center self-center mb-3">
              <Trash2 size={24} color="#f87171" />
            </View>
            <Text className="text-white text-lg font-black text-center mb-1">
              Delete {selectedCount} Examinations?
            </Text>
            <Text className="text-white/60 text-xs text-center mb-4 leading-relaxed">
              Are you sure you want to delete the selected {selectedCount} examinations in bulk? This action cannot be undone.
            </Text>

            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Pressable
                onPress={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/15 items-center justify-center"
              >
                <Text className="text-white text-xs font-bold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleBulkDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 items-center justify-center shadow-md"
              >
                <Text className="text-white text-xs font-black">Delete All</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* EXPORT CONFIRMATION MODAL */}
      {showExportModal && (
        <Modal transparent animationType="slide" visible={showExportModal}>
          <View className="flex-1 bg-black/80 justify-center items-center p-4">
            <View
              className="w-full max-w-sm border rounded-3xl p-5 shadow-2xl"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Download size={20} color={primaryLight} style={{ marginRight: 8 }} />
                  <Text className="text-white text-base font-black">Export Exam Schedule</Text>
                </View>
                <Pressable
                  onPress={() => setShowExportModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                >
                  <X size={16} color="#fff" />
                </Pressable>
              </View>

              <Text className="text-white/70 text-xs mb-4 leading-relaxed">
                Export current examination schedule list (all active, completed, and published terms) for administrative records.
              </Text>

              <View className="flex-row items-center" style={{ gap: 10 }}>
                <Pressable
                  onPress={handleExport}
                  className="flex-1 py-3 rounded-xl items-center justify-center shadow-md active:opacity-80"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Text className="text-black font-black text-xs">Share / Save</Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowExportModal(false)}
                  className="px-4 py-3 bg-white/10 rounded-xl items-center justify-center border border-white/15"
                >
                  <Text className="text-white font-bold text-xs">Cancel</Text>
                </Pressable>
              </View>
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
    backgroundColor: "#061a14",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
});

export default AdminExamScheduleListScreen;
