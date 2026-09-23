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
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  FileText,
  Share2,
} from "lucide-react-native";
import { useResponsive } from "../../utils/responsive";

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

export const TeacherExamScheduleScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isSmallPhone, headerPaddingTop } = useResponsive();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All Statuses");
  const [selectedSort, setSelectedSort] = useState<string>("No Sorting");

  // Dropdown Picker Modals
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Hardware Back Handler returning to Examination Hub
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

  // Filter & Sort Logic
  const filteredExams = useMemo(() => {
    let list = [...INITIAL_EXAMS];

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
  }, [searchQuery, selectedStatus, selectedSort]);

  // KPI Metrics Calculations
  const upcomingCount = useMemo(
    () => INITIAL_EXAMS.filter((e) => e.status === "Upcoming").length,
    []
  );
  const resultsPublishedCount = useMemo(
    () => INITIAL_EXAMS.filter((e) => e.status === "Results Published").length,
    []
  );

  const handleExport = async () => {
    setShowExportModal(false);
    showToast("Exam schedule exported successfully!");
    try {
      await Share.share({
        title: "KTS Exam Schedule",
        message:
          "KTS Model High School - Exam Schedule 2026-2027\n\n" +
          INITIAL_EXAMS.map(
            (e) => `• ${e.name} (${e.status})\n  Classes: ${e.classes}\n  Date: ${e.date} | Max Marks: ${e.maxMarks}`
          ).join("\n\n"),
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
          bg: "bg-[#ddb7ff]/20",
          border: "border-[#ddb7ff]/40",
          text: "text-[#ddb7ff]",
        };
    }
  };

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
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <Pressable
                onPress={() => navigation.navigate("Examination")}
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center mr-3 active:bg-white/20"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color="#ddb7ff" />
              </Pressable>
              <View className="flex-1">
                <Text className="text-white text-lg md:text-xl font-extrabold" numberOfLines={1}>
                  Exam Schedule
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <View className="w-2 h-2 rounded-full bg-[#00f1a1] mr-1.5" />
                  <Text className="text-[#ddb7ff] text-xs font-semibold">
                    Academic Year: 2026-2027 (Current)
                  </Text>
                </View>
              </View>
            </View>

            {/* Export Action Button */}
            <Pressable
              onPress={() => setShowExportModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#ddb7ff]/15 border border-[#ddb7ff]/30 flex-row items-center active:bg-[#ddb7ff]/25"
            >
              <Download size={14} color="#ddb7ff" style={{ marginRight: 5 }} />
              <Text className="text-[#ddb7ff] text-xs font-extrabold">Export</Text>
            </Pressable>
          </View>
        </BlurView>
      </View>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <View className="absolute top-24 left-4 right-4 z-50 bg-[#2d1b4e] border border-[#ddb7ff]/50 rounded-2xl p-3.5 shadow-2xl flex-row items-center">
          <CheckCircle2 size={18} color="#00f1a1" style={{ marginRight: 10 }} />
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
          <View className="w-[48%] bg-[#181524] border border-white/10 rounded-2xl p-3.5 shadow-md relative overflow-hidden">
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

          {/* 3. Top Score */}
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

          {/* 4. Results Published */}
          <View className="w-[48%] bg-[#181524] border border-white/10 rounded-2xl p-3.5 shadow-md relative overflow-hidden">
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

        {/* SEARCH & FILTER CONTROLS */}
        <View className="mb-4" style={{ gap: 8 }}>
          {/* Search Bar */}
          <View className="flex-row items-center bg-[#181524] border border-white/10 rounded-2xl px-3.5 py-2.5">
            <Search size={16} color="#ddb7ff" style={{ marginRight: 8 }} />
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
              className="flex-1 bg-[#181524] border border-white/10 rounded-xl px-3 py-2.5 flex-row items-center justify-between active:bg-white/10"
            >
              <Text numberOfLines={1} className="text-white/80 text-xs font-bold mr-1">
                {selectedStatus}
              </Text>
              <ChevronDown size={14} color="#ddb7ff" />
            </Pressable>

            {/* Sorting Dropdown Trigger */}
            <Pressable
              onPress={() => setShowSortPicker(true)}
              className="flex-1 bg-[#181524] border border-white/10 rounded-xl px-3 py-2.5 flex-row items-center justify-between active:bg-white/10"
            >
              <Text numberOfLines={1} className="text-white/80 text-xs font-bold mr-1">
                {selectedSort}
              </Text>
              <ChevronDown size={14} color="#ddb7ff" />
            </Pressable>
          </View>
        </View>

        {/* LIST OF EXAMS (READ-ONLY FOR TEACHER LOGIN) */}
        <View className="mb-2 flex-row items-center justify-between px-1">
          <Text className="text-white/70 text-xs font-bold uppercase tracking-wider">
            Examination List
          </Text>
          <Text className="text-[#ddb7ff] text-xs font-bold">
            {filteredExams.length} {filteredExams.length === 1 ? "Exam" : "Exams"}
          </Text>
        </View>

        {filteredExams.length === 0 ? (
          <View className="bg-[#181524] border border-white/10 rounded-2xl p-8 items-center justify-center my-4">
            <BookOpen size={32} color="#ffffff30" style={{ marginBottom: 8 }} />
            <Text className="text-white/70 font-bold text-sm">No examinations found</Text>
            <Text className="text-white/40 text-xs text-center mt-1">
              Try adjusting your search query or status filters.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredExams.map((exam) => {
              const badgeStyle = getStatusBadgeStyle(exam.status);

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

              const handleOpenPreview = () => {
                navigation.navigate("TeacherExamSchedulePreview", {
                  examId: exam.id,
                  exam: examPayload,
                  selectedClass: targetClass,
                });
              };

              return (
                <Pressable
                  key={exam.id}
                  onPress={handleOpenPreview}
                  className="bg-[#181524] border border-white/10 rounded-2xl p-4 shadow-lg relative overflow-hidden active:border-[#ddb7ff]/40"
                  style={{ borderRadius: 16 }}
                >
                  {/* Top Section: Icon, Title, Status */}
                  <View className="flex-row items-start mb-3">
                    {/* Left Book Icon Badge */}
                    <View className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 items-center justify-center mr-3">
                      <BookOpen size={20} color="#38bdf8" />
                    </View>

                    <View className="flex-1">
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
                  </View>

                  {/* Metadata Info Row */}
                  <View className="bg-black/30 rounded-xl p-2.5 mb-3.5 flex-row flex-wrap items-center justify-between" style={{ gap: 6 }}>
                    <View className="flex-row items-center">
                      <FileText size={12} color="#ddb7ff" style={{ marginRight: 4 }} />
                      <Text className="text-white/70 text-xs font-semibold">
                        Subjects: <Text className="text-white font-bold">{exam.subjects}</Text>
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Calendar size={12} color="#ddb7ff" style={{ marginRight: 4 }} />
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

                  {/* Action Button Row (Matching Web Application) */}
                  <View className="flex-row items-center justify-end pt-2 border-t border-white/10">
                    {exam.status === "Results Published" && (
                      <Pressable
                        onPress={() => navigation.navigate("TeacherExamResults", { examId: exam.id, exam: examPayload })}
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
                        onPress={() => navigation.navigate("MarksEntry", { examId: exam.id, exam: examPayload, selectedClass: targetClass })}
                        className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex-row items-center active:bg-emerald-500/30"
                      >
                        <Text className="text-emerald-300 font-extrabold text-xs mr-1">
                          Enter Marks
                        </Text>
                        <ChevronRight size={14} color="#6ee7b7" />
                      </Pressable>
                    )}

                    {exam.status === "Upcoming" && (
                      <Pressable
                        onPress={handleOpenPreview}
                        className="px-4 py-2 rounded-xl bg-[#ddb7ff]/20 border border-[#ddb7ff]/40 flex-row items-center active:bg-[#ddb7ff]/30"
                      >
                        <Text className="text-[#ddb7ff] font-extrabold text-xs mr-1">
                          View Schedule
                        </Text>
                        <ChevronRight size={14} color="#ddb7ff" />
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
            <View className="w-full max-w-sm bg-[#181524] border border-white/15 rounded-3xl p-4 shadow-2xl">
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
                  className={`p-3 rounded-xl mb-1.5 flex-row items-center justify-between ${
                    selectedStatus === st ? "bg-[#ddb7ff]/20 border border-[#ddb7ff]/40" : "bg-white/5"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      selectedStatus === st ? "text-[#ddb7ff]" : "text-white/80"
                    }`}
                  >
                    {st}
                  </Text>
                  {selectedStatus === st && <CheckCircle2 size={16} color="#ddb7ff" />}
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
            <View className="w-full max-w-sm bg-[#181524] border border-white/15 rounded-3xl p-4 shadow-2xl">
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
                  className={`p-3 rounded-xl mb-1.5 flex-row items-center justify-between ${
                    selectedSort === srt ? "bg-[#ddb7ff]/20 border border-[#ddb7ff]/40" : "bg-white/5"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      selectedSort === srt ? "text-[#ddb7ff]" : "text-white/80"
                    }`}
                  >
                    {srt}
                  </Text>
                  {selectedSort === srt && <CheckCircle2 size={16} color="#ddb7ff" />}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}

      {/* EXPORT CONFIRMATION MODAL */}
      {showExportModal && (
        <Modal transparent animationType="slide" visible={showExportModal}>
          <View className="flex-1 bg-black/80 justify-center items-center p-4">
            <View className="w-full max-w-sm bg-[#181524] border border-[#ddb7ff]/30 rounded-3xl p-5 shadow-2xl">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Download size={20} color="#ddb7ff" style={{ marginRight: 8 }} />
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
                Export current examination schedule list (all active, completed, and published terms) for faculty records.
              </Text>

              <View className="flex-row items-center" style={{ gap: 10 }}>
                <Pressable
                  onPress={handleExport}
                  className="flex-1 bg-[#ddb7ff] py-3 rounded-xl items-center justify-center active:bg-[#c084fc]"
                >
                  <Text className="text-[#0b0912] font-black text-xs">Share / Save</Text>
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
    backgroundColor: "#08070d",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
});

export default TeacherExamScheduleScreen;
