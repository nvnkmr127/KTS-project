import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
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
  Building,
  CheckCircle2,
  CalendarOff,
  UserCheck,
} from "lucide-react-native";
import { useResponsive } from "../../utils/responsive";
import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface InvigilationDuty {
  id: string;
  examId: string;
  examName: string;
  class: string;
  subject: string;
  date: string;
  timeSlot: string;
  room: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
}

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

const DEFAULT_INVIGILATIONS: InvigilationDuty[] = [
  {
    id: "inv-1",
    examId: "1",
    examName: "test",
    class: "8A",
    subject: "Telugu",
    date: "28-09-2026",
    timeSlot: "10:00 AM",
    room: "Room 101",
    staffId: "1",
    staffName: "Sheeren Sultana",
    staffEmail: "sheeren@kts.edu",
  },
  {
    id: "inv-2",
    examId: "3",
    examName: "Mid-Term Examination 2026",
    class: "10A",
    subject: "Mathematics",
    date: "15-10-2026",
    timeSlot: "10:00 AM",
    room: "Hall A",
    staffId: "1",
    staffName: "Sheeren Sultana",
    staffEmail: "sheeren@kts.edu",
  },
];

export const TeacherExamInvigilationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { headerPaddingTop } = useResponsive();
  const { user } = useAuthStore();

  const [invigilations, setInvigilations] = useState<InvigilationDuty[]>(DEFAULT_INVIGILATIONS);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // Load invigilations from API or local storage
  const loadDuties = useCallback(async () => {
    try {
      const res = await api.getResources("settings", { key: "kts_exam_invigilations" }).catch(() => null);
      if (res && Array.isArray(res) && res.length > 0 && res[0]?.value) {
        const parsed = JSON.parse(res[0].value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInvigilations(parsed);
          return;
        }
      }
    } catch {
      // fallback to default
    }
  }, []);

  useEffect(() => {
    loadDuties();
  }, [loadDuties]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDuties();
    setRefreshing(false);
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

  // Filter duties assigned to the logged-in teacher
  const myDuties = useMemo(() => {
    if (!user) return invigilations;
    const userName = (user.name || "").toLowerCase().trim();
    const userEmail = (user.email || "").toLowerCase().trim();

    const filtered = invigilations.filter((inv) => {
      const staffName = (inv.staffName || "").toLowerCase().trim();
      const staffEmail = (inv.staffEmail || "").toLowerCase().trim();
      return (
        (userName && (staffName === userName || staffName.includes(userName) || userName.includes(staffName))) ||
        (userEmail && staffEmail === userEmail) ||
        inv.staffId === String(user.id)
      );
    });

    return filtered.length > 0 ? filtered : invigilations;
  }, [invigilations, user]);

  const kpiCardWidth = (SCREEN_WIDTH - 32 - 10) / 2;

  const topTabs = [
    { id: "TeacherExamSchedule", label: "Exam Schedule" },
    { id: "TeacherExamResults", label: "Results & Rankings" },
    { id: "MarksEntry", label: "Marks Entry" },
    { id: "TeacherExamSchedulePreview", label: "Schedule Preview" },
    { id: "TeacherExamInvigilation", label: "Exam Invisilation", active: true },
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
                  Exam Invigilation
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ddb7ff"
            colors={["#ddb7ff", "#38bdf8"]}
          />
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 95,
          paddingHorizontal: 16,
          paddingTop: 14,
        }}
      >
        {/* 4 KPI CARDS (2x2 Grid) */}
        <View style={styles.kpiGrid}>
          {/* 1. Upcoming Exams */}
          <View style={[styles.kpiCard, { width: kpiCardWidth }]}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white/60 text-[11px] font-bold">Upcoming Exams</Text>
              <View className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 items-center justify-center">
                <BookOpen size={16} color="#38bdf8" />
              </View>
            </View>
            <Text className="text-white text-2xl font-black">1</Text>
            <Text className="text-white/40 text-[10px] font-medium mt-0.5">This month</Text>
          </View>

          {/* 2. Class Average */}
          <View style={[styles.kpiCard, { width: kpiCardWidth }]}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white/60 text-[11px] font-bold">Class Average</Text>
              <View className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center">
                <BarChart2 size={16} color="#34d399" />
              </View>
            </View>
            <Text className="text-white text-2xl font-black">0.0%</Text>
            <Text className="text-white/40 text-[10px] font-medium mt-0.5">Class 4B • Selected Exam</Text>
          </View>

          {/* 3. Top Score */}
          <View style={[styles.kpiCard, { width: kpiCardWidth }]}>
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
          <View style={[styles.kpiCard, { width: kpiCardWidth }]}>
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

        {/* HORIZONTAL EXAMINATION TABS BAR */}
        <View className="mb-4">
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
                className={`px-3.5 py-2 rounded-xl border items-center justify-center ${
                  t.active
                    ? "bg-[#38bdf8]/15 border-[#38bdf8] shadow-sm"
                    : "bg-[#181524] border-white/10 active:bg-white/10"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    t.active ? "text-[#38bdf8]" : "text-white/60"
                  }`}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* MAIN DUTIES CONTAINER */}
        <View style={styles.mainCard}>
          {/* Section Heading & View Toggle */}
          <View className="mb-4 pb-3 border-b border-white/10">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-white text-base font-black">
                  My Exam Invisilation Duties
                </Text>
                <Text className="text-white/50 text-xs font-medium mt-0.5">
                  List of exam invigilation duties assigned to you
                </Text>
              </View>

              {/* View Toggle (Card / Table) */}
              <View className="flex-row bg-white/5 p-1 rounded-xl border border-white/10">
                <Pressable
                  onPress={() => setViewMode("card")}
                  className={`px-2.5 py-1 rounded-lg ${
                    viewMode === "card" ? "bg-[#ddb7ff]/25 border border-[#ddb7ff]/40" : ""
                  }`}
                >
                  <Text
                    className={`text-[10px] font-extrabold ${
                      viewMode === "card" ? "text-[#ddb7ff]" : "text-white/50"
                    }`}
                  >
                    Cards
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setViewMode("table")}
                  className={`px-2.5 py-1 rounded-lg ${
                    viewMode === "table" ? "bg-[#38bdf8]/25 border border-[#38bdf8]/40" : ""
                  }`}
                >
                  <Text
                    className={`text-[10px] font-extrabold ${
                      viewMode === "table" ? "text-[#38bdf8]" : "text-white/50"
                    }`}
                  >
                    Table
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Empty State */}
          {myDuties.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <View className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 items-center justify-center mb-3">
                <CalendarOff size={26} color="#ffffff40" />
              </View>
              <Text className="text-white/60 text-xs font-semibold text-center leading-relaxed">
                You have no exam invigilation duties assigned.
              </Text>
            </View>
          ) : viewMode === "card" ? (
            /* ========================================================= */
            /* MODE 1: MOBILE CARD VIEW */
            /* ========================================================= */
            <View style={{ gap: 12 }}>
              {myDuties.map((duty) => (
                <View
                  key={duty.id}
                  style={styles.dutyCard}
                >
                  {/* Top Bar: Exam Name & Class Badge */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 mr-2">
                      <Text className="text-white text-base font-black" numberOfLines={1}>
                        {duty.examName}
                      </Text>
                      <Text className="text-[#38bdf8] text-xs font-bold mt-0.5">
                        {duty.subject}
                      </Text>
                    </View>
                    <View className="bg-[#ddb7ff]/15 px-2.5 py-1 rounded-lg border border-[#ddb7ff]/30">
                      <Text className="text-[#ddb7ff] text-xs font-extrabold">
                        Class {duty.class}
                      </Text>
                    </View>
                  </View>

                  {/* Details Grid */}
                  <View style={styles.detailsGrid}>
                    {/* Date & Time Row */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1 mr-2">
                        <Calendar size={13} color="#ddb7ff" style={{ marginRight: 6 }} />
                        <Text className="text-white/70 text-xs font-medium">
                          Date: <Text className="text-white font-bold">{formatToDDMMYYYY(duty.date)}</Text>
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Clock size={13} color="#38bdf8" style={{ marginRight: 6 }} />
                        <Text className="text-white/70 text-xs font-medium">
                          Time: <Text className="text-white font-bold">{duty.timeSlot}</Text>
                        </Text>
                      </View>
                    </View>

                    {/* Room & Status Row */}
                    <View className="flex-row items-center justify-between pt-2 border-t border-white/10">
                      <View className="flex-row items-center">
                        <Building size={13} color="#facc15" style={{ marginRight: 6 }} />
                        <Text className="text-white/70 text-xs font-medium">
                          Room: <Text className="text-[#facc15] font-black">{duty.room}</Text>
                        </Text>
                      </View>
                      <View className="flex-row items-center bg-[#00f1a1]/10 px-2.5 py-1 rounded-full border border-[#00f1a1]/30">
                        <CheckCircle2 size={12} color="#00f1a1" style={{ marginRight: 4 }} />
                        <Text className="text-[#00f1a1] text-[10px] font-extrabold">
                          Assigned
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            /* ========================================================= */
            /* MODE 2: WEB-MATCHING HORIZONTAL SCROLLABLE TABLE VIEW */
            /* ========================================================= */
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ minWidth: 620 }}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderText, { width: 105 }]}>Date</Text>
                  <Text style={[styles.tableHeaderText, { width: 95 }]}>Time Slot</Text>
                  <Text style={[styles.tableHeaderText, { width: 130 }]}>Exam Name</Text>
                  <Text style={[styles.tableHeaderText, { width: 90 }]}>Class</Text>
                  <Text style={[styles.tableHeaderText, { width: 100 }]}>Subject</Text>
                  <Text style={[styles.tableHeaderText, { width: 100 }]}>Room No</Text>
                </View>

                {/* Table Rows */}
                {myDuties.map((duty, idx) => (
                  <View
                    key={duty.id}
                    style={[
                      styles.tableRow,
                      idx === myDuties.length - 1 ? { borderBottomWidth: 0 } : {},
                    ]}
                  >
                    <Text style={[styles.tableCellText, { width: 105, color: "#ffffff", fontWeight: "700" }]}>
                      {formatToDDMMYYYY(duty.date)}
                    </Text>
                    <Text style={[styles.tableCellText, { width: 95, color: "rgba(255, 255, 255, 0.75)" }]}>
                      {duty.timeSlot}
                    </Text>
                    <Text style={[styles.tableCellText, { width: 130, color: "#ffffff", fontWeight: "800" }]}>
                      {duty.examName}
                    </Text>
                    <Text style={[styles.tableCellText, { width: 90, color: "rgba(255, 255, 255, 0.75)" }]}>
                      Class {duty.class}
                    </Text>
                    <Text style={[styles.tableCellText, { width: 100, color: "#38bdf8", fontWeight: "800" }]}>
                      {duty.subject}
                    </Text>
                    <Text style={[styles.tableCellText, { width: 100, color: "#facc15", fontWeight: "800", fontFamily: "monospace" }]}>
                      {duty.room}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
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
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
    rowGap: 10,
  },
  kpiCard: {
    backgroundColor: "#181524",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 14,
  },
  mainCard: {
    backgroundColor: "#181524",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    padding: 16,
  },
  dutyCard: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 18,
    padding: 14,
  },
  detailsGrid: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    gap: 8,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.4)",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  tableCellText: {
    fontSize: 12,
  },
});

export default TeacherExamInvigilationScreen;
