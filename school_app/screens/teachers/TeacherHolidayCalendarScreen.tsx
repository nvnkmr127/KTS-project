import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  PanResponder,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  PartyPopper,
  Flag,
  School,
  Sun,
  Clock,
  CheckCircle2,
  Info,
  ArrowRight,
  Palmtree,
} from "lucide-react-native";
import { useResponsive } from "../../utils/responsive";
import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../services/api";

export interface HolidayItem {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dateRange: string; // e.g. "20 Oct - 24 Oct 2026" or "15 Aug 2026"
  type: "National" | "Festival" | "Institutional" | "Vacation";
  description: string;
  color?: string;
  daysCount?: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper: Format YYYY-MM-DD into readable string (e.g. "15 Aug 2026")
const formatIsoToDisplay = (isoStr: string): string => {
  if (!isoStr || !isoStr.includes("-")) return isoStr;
  const parts = isoStr.split("-");
  if (parts.length !== 3) return isoStr;
  const y = parts[0];
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return `${d} ${MONTH_SHORT[m] || ""} ${y}`;
};

// Helper: Format Date Range (e.g. "20 Oct - 24 Oct 2026" or "15 Aug 2026")
const formatDisplayRange = (startIso: string, endIso: string): string => {
  if (!startIso) return "";
  if (!endIso || startIso === endIso) {
    return formatIsoToDisplay(startIso);
  }
  const sParts = startIso.split("-");
  const eParts = endIso.split("-");
  if (sParts.length === 3 && eParts.length === 3) {
    const sYear = sParts[0];
    const sMonth = parseInt(sParts[1], 10) - 1;
    const sDay = parseInt(sParts[2], 10);

    const eYear = eParts[0];
    const eMonth = parseInt(eParts[1], 10) - 1;
    const eDay = parseInt(eParts[2], 10);

    if (sYear === eYear && sMonth === eMonth) {
      return `${sDay} ${MONTH_SHORT[sMonth]} - ${eDay} ${MONTH_SHORT[eMonth]} ${sYear}`;
    }
    return `${sDay} ${MONTH_SHORT[sMonth]} ${sYear} - ${eDay} ${MONTH_SHORT[eMonth]} ${eYear}`;
  }
  return `${startIso} - ${endIso}`;
};

// Helper: Calculate inclusive day count between start and end
const calculateDurationDays = (startIso: string, endIso: string): number => {
  if (!startIso || !endIso) return 1;
  try {
    const s = new Date(startIso).getTime();
    const e = new Date(endIso).getTime();
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  } catch (_) {
    return 1;
  }
};

export const DEFAULT_HOLIDAYS: HolidayItem[] = [
  {
    id: "hol_1",
    title: "Independence Day",
    startDate: "2026-08-15",
    endDate: "2026-08-15",
    dateRange: "15 Aug 2026",
    type: "National",
    description: "National Holiday celebrating Indian Independence with flag hoisting",
    color: "#00f1a1",
    daysCount: 1,
  },
  {
    id: "hol_2",
    title: "Ganesh Chaturthi",
    startDate: "2026-09-07",
    endDate: "2026-09-08",
    dateRange: "07 Sep - 08 Sep 2026",
    type: "Festival",
    description: "Ganesh Chaturthi Festival holiday and cultural celebrations",
    color: "#f59e0b",
    daysCount: 2,
  },
  {
    id: "hol_3",
    title: "Gandhi Jayanti",
    startDate: "2026-10-02",
    endDate: "2026-10-02",
    dateRange: "02 Oct 2026",
    type: "National",
    description: "Mahatma Gandhi Jayanti official national holiday",
    color: "#ef4444",
    daysCount: 1,
  },
  {
    id: "hol_4",
    title: "Dussehra Term Break",
    startDate: "2026-10-20",
    endDate: "2026-10-24",
    dateRange: "20 Oct - 24 Oct 2026",
    type: "Vacation",
    description: "Dussehra term vacation break for all classes and faculty",
    color: "#c084fc",
    daysCount: 5,
  },
  {
    id: "hol_5",
    title: "Telangana Formation Day",
    startDate: "2026-06-02",
    endDate: "2026-06-02",
    dateRange: "02 Jun 2026",
    type: "National",
    description: "Official State Holiday for Telangana Formation Day",
    color: "#ef4444",
    daysCount: 1,
  },
  {
    id: "hol_6",
    title: "Ramzan / Eid-ul-Fitr",
    startDate: "2026-06-16",
    endDate: "2026-06-17",
    dateRange: "16 Jun - 17 Jun 2026",
    type: "Festival",
    description: "Festival holidays and special prayer observances",
    color: "#38bdf8",
    daysCount: 2,
  },
  {
    id: "hol_7",
    title: "Diwali Festive Break",
    startDate: "2026-11-08",
    endDate: "2026-11-10",
    dateRange: "08 Nov - 10 Nov 2026",
    type: "Festival",
    description: "Deepavali festival holidays and lakshmi pooja celebrations",
    color: "#f59e0b",
    daysCount: 3,
  },
  {
    id: "hol_8",
    title: "Winter & Christmas Break",
    startDate: "2026-12-23",
    endDate: "2026-12-26",
    dateRange: "23 Dec - 26 Dec 2026",
    type: "Vacation",
    description: "Annual winter vacation and Christmas celebration break",
    color: "#38bdf8",
    daysCount: 4,
  },
  {
    id: "hol_9",
    title: "Republic Day",
    startDate: "2027-01-26",
    endDate: "2027-01-26",
    dateRange: "26 Jan 2027",
    type: "National",
    description: "National Republic Day celebrations and parades",
    color: "#00f1a1",
    daysCount: 1,
  },
  {
    id: "hol_10",
    title: "Maha Shivaratri",
    startDate: "2027-03-07",
    endDate: "2027-03-07",
    dateRange: "07 Mar 2027",
    type: "Festival",
    description: "Maha Shivaratri auspicious festival holiday",
    color: "#c084fc",
    daysCount: 1,
  },
];

export const TeacherHolidayCalendarScreen: React.FC<{ navigation: any }> = ({
  navigation: propNavigation,
}) => {
  const navigation = useNavigation<any>() || propNavigation;
  const insets = useSafeAreaInsets();
  const { headerPaddingTop, scrollBottomPadding } = useResponsive();
  const { user } = useAuthStore();

  const [holidays, setHolidays] = useState<HolidayItem[]>(DEFAULT_HOLIDAYS);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Filter Pill States: All, Calendar, National, Festival, Vacation, Institutional
  const [typeFilter, setTypeFilter] = useState<
    "All" | "Calendar" | "National" | "Festival" | "Vacation" | "Institutional"
  >("Calendar");

  // Calendar Grid Month/Year State (Default current month / Sep 2026)
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(8); // 8 = September (0-indexed)

  // Selected Holiday Detail View Modal (Read-Only)
  const [selectedHolidayDetail, setSelectedHolidayDetail] = useState<HolidayItem | null>(null);

  const handleBack = useCallback(() => {
    navigation.navigate("Dashboard");
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (selectedHolidayDetail) {
          setSelectedHolidayDetail(null);
          return true;
        }
        handleBack();
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [selectedHolidayDetail, handleBack])
  );

  // Clean Teacher Name (strip Ms., Mr., Mrs., Dr., etc.)
  const displayTeacherName = useMemo(() => {
    const rawName = user?.name || "";
    const cleaned = rawName
      .replace(/^[\s(]*(ms|mr|mrs|dr|prof)\.?[\s)]*/i, "")
      .replace(/[\s()]/g, " ")
      .trim();
    const firstName = cleaned.split(/\s+/)[0] || "FACULTY";
    return firstName.toUpperCase();
  }, [user?.name]);

  const fetchHolidays = async () => {
    setRefreshing(true);
    try {
      const res = await api.getResources("holidays").catch(() => null);
      if (Array.isArray(res) && res.length > 0) {
        const mapped: HolidayItem[] = res.map((h: any) => {
          const start = h.start_date || h.date || "2026-08-15";
          const end = h.end_date || start;
          const days = calculateDurationDays(start, end);
          return {
            id: String(h.id),
            title: h.title || h.name || "School Holiday",
            startDate: start,
            endDate: end,
            dateRange: h.date_range || formatDisplayRange(start, end),
            type: (h.type || "Festival") as any,
            description: h.description || "Official school holiday",
            color: h.color || "#c084fc",
            daysCount: days,
          };
        });
        setHolidays(mapped);
      }
    } catch (err) {
      console.log("Error loading holidays for teacher:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  // Helper: Find holiday item that covers a given date string (YYYY-MM-DD)
  const findHolidayForDate = (dateStr: string): HolidayItem | undefined => {
    return holidays.find((h) => {
      const s = h.startDate || "";
      const e = h.endDate || s;
      return dateStr >= s && dateStr <= e;
    });
  };

  // Month Navigation
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

  // Swipe Gesture Responder for Calendar Month Grid
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

  // Calendar Calculation Helpers for Main Grid
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

  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        h.title.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.dateRange.toLowerCase().includes(q);
      const matchesType =
        typeFilter === "All" || typeFilter === "Calendar" || h.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [holidays, searchQuery, typeFilter]);

  // Statistics Summary Metrics
  const stats = useMemo(() => {
    return {
      total: holidays.length,
      national: holidays.filter((h) => h.type === "National").length,
      festivals: holidays.filter((h) => h.type === "Festival").length,
      vacations: holidays.filter((h) => h.type === "Vacation").length,
    };
  }, [holidays]);

  return (
    <View style={styles.container}>
      {/* Seamless Teacher Background Gradient */}
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
                Holiday Calendar
              </Text>
              <View className="flex-row items-center mt-0.5" style={{ flexWrap: "nowrap" }}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  className="text-white/70 text-xs font-bold tracking-wider uppercase"
                  style={{ includeFontPadding: false }}
                >
                  ACADEMIC YEAR: 2026-2027 (CURRENT)
                </Text>
              </View>
            </View>
          </View>

          {/* Teacher Profile Avatar / Badge */}
          <View
            className="flex-row items-center bg-[#ddb7ff]/20 px-3.5 py-1.5 rounded-full border border-[#ddb7ff]/40"
            style={{ flexShrink: 0, flexWrap: "nowrap" }}
          >
            <View
              className="w-2 h-2 rounded-full bg-[#00f1a1] mr-2 shadow-[0_0_8px_#00f1a1]"
              style={{ flexShrink: 0 }}
            />
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
            onRefresh={fetchHolidays}
            tintColor="#ddb7ff"
            colors={["#ddb7ff", "#c084fc"]}
          />
        }
      >
        {/* 1. DASHBOARD BANNER */}
        <View className="mb-4 px-1">
          <Text
            className="text-white text-2xl font-black font-display-lg"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={{ includeFontPadding: false }}
          >
            Academic Holidays & Events
          </Text>
          <Text
            className="text-white/60 text-xs font-medium mt-0.5"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={{ includeFontPadding: false }}
          >
            Official school holiday schedule, festival breaks, and institutional vacations
          </Text>
        </View>

        {/* 2. FOUR KPI SUMMARY PILLS */}
        <View className="flex-row items-center gap-2 mb-4" style={{ flexWrap: "nowrap" }}>
          {/* Card 1: Total */}
          <View className="flex-1 bg-[#181524] border border-[#ddb7ff]/20 rounded-2xl p-2.5 items-center justify-center shadow-md">
            <Text className="text-white/60 text-[10px] font-extrabold uppercase" numberOfLines={1}>
              Total
            </Text>
            <Text className="text-[#ddb7ff] text-base font-black mt-0.5" numberOfLines={1}>
              {stats.total}
            </Text>
          </View>

          {/* Card 2: National */}
          <View className="flex-1 bg-[#181524] border border-[#00f1a1]/20 rounded-2xl p-2.5 items-center justify-center shadow-md">
            <Text className="text-white/60 text-[10px] font-extrabold uppercase" numberOfLines={1}>
              National
            </Text>
            <Text className="text-[#00f1a1] text-base font-black mt-0.5" numberOfLines={1}>
              {stats.national}
            </Text>
          </View>

          {/* Card 3: Festivals */}
          <View className="flex-1 bg-[#181524] border border-amber-400/20 rounded-2xl p-2.5 items-center justify-center shadow-md">
            <Text className="text-white/60 text-[10px] font-extrabold uppercase" numberOfLines={1}>
              Festivals
            </Text>
            <Text className="text-amber-300 text-base font-black mt-0.5" numberOfLines={1}>
              {stats.festivals}
            </Text>
          </View>

          {/* Card 4: Vacations */}
          <View className="flex-1 bg-[#181524] border border-[#38bdf8]/20 rounded-2xl p-2.5 items-center justify-center shadow-md">
            <Text className="text-white/60 text-[10px] font-extrabold uppercase" numberOfLines={1}>
              Vacations
            </Text>
            <Text className="text-[#38bdf8] text-base font-black mt-0.5" numberOfLines={1}>
              {stats.vacations}
            </Text>
          </View>
        </View>

        {/* 3. SEARCH BAR */}
        <View className="bg-[#181524] border border-[#ddb7ff]/30 rounded-2xl px-3.5 py-2.5 flex-row items-center mb-3.5 shadow-md">
          <Search size={16} color="#ddb7ff" style={{ marginRight: 8, flexShrink: 0 }} />
          <TextInput
            placeholder="Search holiday, festival, date..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-white text-xs font-semibold"
            style={{ includeFontPadding: false }}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}
        </View>

        {/* 4. FILTER PILLS */}
        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {(
                ["Calendar", "All", "National", "Festival", "Vacation", "Institutional"] as const
              ).map((tf) => {
                const isSelected = typeFilter === tf;
                return (
                  <Pressable
                    key={tf}
                    onPress={() => setTypeFilter(tf)}
                    style={[
                      {
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 12,
                        borderWidth: 1,
                      },
                      isSelected
                        ? {
                            backgroundColor: "rgba(221, 183, 255, 0.25)",
                            borderColor: "#ddb7ff",
                          }
                        : {
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            borderColor: "rgba(255, 255, 255, 0.12)",
                          },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: isSelected ? "900" : "700",
                        color: isSelected ? "#ddb7ff" : "rgba(255, 255, 255, 0.75)",
                        includeFontPadding: false,
                      }}
                    >
                      {tf === "Calendar"
                        ? "Calendar Grid"
                        : tf === "All"
                        ? "All Holidays"
                        : tf}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* 5. VIEW MODE: CALENDAR GRID OR DIRECTORY LIST */}
        {typeFilter === "Calendar" ? (
          <View className="mb-6">
            <View className="bg-[#181524] border border-[#ddb7ff]/30 rounded-3xl p-4 shadow-xl">
              {/* Calendar Grid Header Bar */}
              <View className="flex-row justify-between items-center mb-3.5 pb-3 border-b border-white/10">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center">
                    <Calendar size={16} color="#ddb7ff" style={{ marginRight: 6 }} />
                    <Text className="text-white font-extrabold text-base">
                      Academic Calendar
                    </Text>
                  </View>
                  <Text className="text-white/50 text-[11px] font-medium mt-0.5">
                    Tap any highlighted date for details
                  </Text>
                </View>

                {/* Month Navigator: < September 2026 > */}
                <View className="flex-row items-center bg-black/60 border border-[#ddb7ff]/40 px-3 py-1.5 rounded-2xl shadow-md">
                  <Pressable
                    onPress={handlePrevMonth}
                    className="p-1 active:opacity-60"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <ChevronLeft size={16} color="#ddb7ff" />
                  </Pressable>
                  <Text className="text-white font-black text-xs mx-2">
                    {MONTH_NAMES[calendarMonth]} {calendarYear}
                  </Text>
                  <Pressable
                    onPress={handleNextMonth}
                    className="p-1 active:opacity-60"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <ChevronRight size={16} color="#ddb7ff" />
                  </Pressable>
                </View>
              </View>

              {/* Calendar Swipeable Container */}
              <View {...calSwipeResponder.panHandlers}>
                {/* Weekday Labels Header */}
                <View style={{ flexDirection: "row", width: "100%", marginBottom: 6 }}>
                  {DAY_NAMES.map((d, i) => (
                    <View key={d} style={{ width: `${100 / 7}%`, paddingHorizontal: 2 }}>
                      <View
                        style={{
                          width: "100%",
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: "rgba(0,0,0,0.5)",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.08)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "900",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: i === 0 ? "#fb7185" : "rgba(255,255,255,0.8)",
                            includeFontPadding: false,
                          }}
                        >
                          {d}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Calendar Days Grid */}
                <View style={{ width: "100%" }}>
                  {calendarWeeks.map((week, weekIdx) => (
                    <View
                      key={`week_${weekIdx}`}
                      style={{ flexDirection: "row", width: "100%", marginBottom: 6 }}
                    >
                      {week.map((cell, colIdx) => {
                        const { dayNum, fullDateStr, isSunday, isOtherMonth, isPrevMonth, isNextMonth } = cell;
                        const holidayOnDay = findHolidayForDate(fullDateStr);

                        return (
                          <View
                            key={`day_${fullDateStr}_${colIdx}`}
                            style={{ width: `${100 / 7}%`, paddingHorizontal: 2 }}
                          >
                            <Pressable
                              onPress={() => {
                                if (isPrevMonth) {
                                  handlePrevMonth();
                                } else if (isNextMonth) {
                                  handleNextMonth();
                                } else if (holidayOnDay) {
                                  setSelectedHolidayDetail(holidayOnDay);
                                }
                              }}
                              style={[
                                {
                                  width: "100%",
                                  minHeight: 58,
                                  padding: 4,
                                  borderRadius: 10,
                                  borderWidth: 1,
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                },
                                isOtherMonth
                                  ? {
                                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                                      borderColor: "rgba(255, 255, 255, 0.05)",
                                      opacity: 0.55,
                                    }
                                  : isSunday
                                  ? {
                                      backgroundColor: "rgba(244, 63, 94, 0.12)",
                                      borderColor: "rgba(244, 63, 94, 0.35)",
                                    }
                                  : holidayOnDay
                                  ? {
                                      backgroundColor: "rgba(221, 183, 255, 0.2)",
                                      borderColor: "rgba(221, 183, 255, 0.5)",
                                    }
                                  : {
                                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                                      borderColor: "rgba(255, 255, 255, 0.1)",
                                    },
                              ]}
                            >
                              {/* Day Number and Holiday Indicator Dot */}
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  width: "100%",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 11,
                                    fontWeight: isOtherMonth ? "600" : "900",
                                    color: isOtherMonth ? "#71717a" : isSunday ? "#fb7185" : "#ffffff",
                                    includeFontPadding: false,
                                  }}
                                >
                                  {dayNum}
                                </Text>
                                {holidayOnDay && !isOtherMonth && (
                                  <View
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: 3,
                                      backgroundColor: holidayOnDay.color || "#ddb7ff",
                                    }}
                                  />
                                )}
                              </View>

                              {/* Sunday or Holiday Indicator Badge */}
                              {isSunday && !isOtherMonth ? (
                                <View
                                  style={{
                                    width: "100%",
                                    backgroundColor: "rgba(244, 63, 94, 0.25)",
                                    paddingVertical: 1.5,
                                    borderRadius: 4,
                                    borderWidth: 1,
                                    borderColor: "rgba(244, 63, 94, 0.35)",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: "#fda4af",
                                      fontSize: 7.5,
                                      fontWeight: "900",
                                      textTransform: "uppercase",
                                      textAlign: "center",
                                      includeFontPadding: false,
                                    }}
                                    numberOfLines={1}
                                  >
                                    SUN
                                  </Text>
                                </View>
                              ) : holidayOnDay && !isOtherMonth ? (
                                <View
                                  style={{
                                    width: "100%",
                                    backgroundColor: holidayOnDay.color || "#ddb7ff",
                                    paddingVertical: 1.5,
                                    paddingHorizontal: 2,
                                    borderRadius: 4,
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: "#181524",
                                      fontSize: 7.5,
                                      fontWeight: "900",
                                      textAlign: "center",
                                      includeFontPadding: false,
                                    }}
                                    numberOfLines={1}
                                  >
                                    {holidayOnDay.title}
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
            </View>
          </View>
        ) : null}

        {/* 6. LIST OF HOLIDAYS (DIRECTORY VIEW) */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3 px-1">
            <Text
              className="text-white text-base font-extrabold"
              numberOfLines={1}
              style={{ includeFontPadding: false }}
            >
              Academic Holidays ({filteredHolidays.length})
            </Text>
            {typeFilter !== "Calendar" && (
              <Pressable
                onPress={() => setTypeFilter("Calendar")}
                className="flex-row items-center"
              >
                <Text
                  className="text-[#ddb7ff] text-xs font-bold mr-1"
                  style={{ includeFontPadding: false }}
                >
                  Switch to Grid
                </Text>
                <ArrowRight size={13} color="#ddb7ff" />
              </Pressable>
            )}
          </View>

          {filteredHolidays.length === 0 ? (
            <View className="bg-[#181524] border border-white/10 rounded-3xl p-8 items-center justify-center shadow-lg">
              <Calendar
                size={32}
                color="rgba(255,255,255,0.3)"
                style={{ marginBottom: 8 }}
              />
              <Text
                className="text-white/60 text-xs font-bold text-center"
                numberOfLines={1}
              >
                No holidays matching "{searchQuery}"
              </Text>
            </View>
          ) : (
            filteredHolidays.map((hol) => {
              const typeColor =
                hol.type === "National"
                  ? { bg: "bg-[#00f1a1]/15", border: "border-[#00f1a1]/30", text: "text-[#00f1a1]" }
                  : hol.type === "Festival"
                  ? { bg: "bg-amber-400/15", border: "border-amber-400/30", text: "text-amber-300" }
                  : hol.type === "Vacation"
                  ? { bg: "bg-[#38bdf8]/15", border: "border-[#38bdf8]/30", text: "text-[#38bdf8]" }
                  : { bg: "bg-[#ddb7ff]/15", border: "border-[#ddb7ff]/30", text: "text-[#ddb7ff]" };

              return (
                <Pressable
                  key={hol.id}
                  onPress={() => setSelectedHolidayDetail(hol)}
                  className="bg-[#181524] border border-white/10 rounded-3xl p-4 mb-3 shadow-lg active:border-[#ddb7ff]/40"
                >
                  <View
                    className="flex-row items-center justify-between mb-2"
                    style={{ flexWrap: "nowrap" }}
                  >
                    <View
                      className="flex-row items-center flex-1 mr-2"
                      style={{ flexWrap: "nowrap" }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: hol.color || "#ddb7ff",
                          marginRight: 8,
                        }}
                      />
                      <Text
                        className="text-white font-black text-sm flex-1"
                        numberOfLines={1}
                        style={{ includeFontPadding: false }}
                      >
                        {hol.title}
                      </Text>
                    </View>

                    {/* Type Badge */}
                    <View
                      className={`px-2.5 py-0.5 rounded-full border ${typeColor.bg} ${typeColor.border}`}
                      style={{ flexShrink: 0 }}
                    >
                      <Text
                        className={`text-[9px] font-black uppercase ${typeColor.text}`}
                        numberOfLines={1}
                        style={{ includeFontPadding: false }}
                      >
                        {hol.type}
                      </Text>
                    </View>
                  </View>

                  {/* Date Range & Duration Pill */}
                  <View
                    className="flex-row items-center justify-between mt-1 pt-2 border-t border-white/5"
                    style={{ flexWrap: "nowrap" }}
                  >
                    <View
                      className="flex-row items-center flex-1 mr-2"
                      style={{ flexWrap: "nowrap" }}
                    >
                      <CalendarDays
                        size={13}
                        color="#ddb7ff"
                        style={{ marginRight: 6, flexShrink: 0 }}
                      />
                      <Text
                        className="text-white/80 text-xs font-bold"
                        numberOfLines={1}
                        style={{ includeFontPadding: false }}
                      >
                        {hol.dateRange}
                      </Text>
                    </View>

                    <View
                      className="bg-white/10 px-2 py-0.5 rounded-md"
                      style={{ flexShrink: 0 }}
                    >
                      <Text
                        className="text-white/70 text-[10px] font-extrabold"
                        numberOfLines={1}
                        style={{ includeFontPadding: false }}
                      >
                        {hol.daysCount || 1} Day{(hol.daysCount || 1) > 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  {hol.description ? (
                    <Text
                      className="text-white/50 text-[11px] font-medium mt-2 leading-tight"
                      numberOfLines={2}
                      style={{ includeFontPadding: false }}
                    >
                      {hol.description}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 7. READ-ONLY HOLIDAY DETAIL VIEW MODAL */}
      {selectedHolidayDetail && (
        <Modal
          visible={!!selectedHolidayDetail}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedHolidayDetail(null)}
        >
          <View className="flex-1 bg-black/80 items-center justify-center p-5">
            <View className="w-full max-w-sm bg-[#181524] border border-[#ddb7ff]/40 rounded-3xl p-5 shadow-2xl">
              {/* Modal Header */}
              <View
                className="flex-row items-center justify-between pb-3 border-b border-white/10 mb-4"
                style={{ flexWrap: "nowrap" }}
              >
                <View
                  className="flex-row items-center flex-1 mr-2"
                  style={{ flexWrap: "nowrap" }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: selectedHolidayDetail.color || "#ddb7ff",
                      marginRight: 8,
                    }}
                  />
                  <Text
                    className="text-white font-extrabold text-base"
                    numberOfLines={1}
                    style={{ includeFontPadding: false }}
                  >
                    Holiday Details
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedHolidayDetail(null)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                >
                  <X size={16} color="white" />
                </Pressable>
              </View>

              {/* Title & Type */}
              <View className="mb-4">
                <Text
                  className="text-white font-black text-xl mb-2"
                  style={{ includeFontPadding: false }}
                >
                  {selectedHolidayDetail.title}
                </Text>
                <View className="flex-row items-center gap-2" style={{ flexWrap: "nowrap" }}>
                  <View className="bg-[#ddb7ff]/20 px-3 py-1 rounded-full border border-[#ddb7ff]/40">
                    <Text className="text-[#ddb7ff] text-xs font-black uppercase">
                      {selectedHolidayDetail.type} Holiday
                    </Text>
                  </View>
                  <View className="bg-white/10 px-2.5 py-1 rounded-full">
                    <Text className="text-white/80 text-xs font-bold">
                      {selectedHolidayDetail.daysCount || 1} Day
                      {(selectedHolidayDetail.daysCount || 1) > 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Date Information Card */}
              <View className="bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-4">
                <View className="flex-row items-center mb-2">
                  <CalendarDays size={16} color="#ddb7ff" style={{ marginRight: 8 }} />
                  <Text className="text-white font-extrabold text-sm">
                    {selectedHolidayDetail.dateRange}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <CheckCircle2 size={14} color="#00f1a1" style={{ marginRight: 8 }} />
                  <Text className="text-white/60 text-xs font-semibold">
                    Official academic non-working day
                  </Text>
                </View>
              </View>

              {/* Description */}
              {selectedHolidayDetail.description ? (
                <View className="mb-5">
                  <Text className="text-white/50 text-xs font-bold uppercase mb-1">
                    Event Notes
                  </Text>
                  <Text className="text-white/80 text-xs font-medium leading-relaxed">
                    {selectedHolidayDetail.description}
                  </Text>
                </View>
              ) : null}

              {/* Close Button */}
              <Pressable
                onPress={() => setSelectedHolidayDetail(null)}
                className="w-full bg-[#ddb7ff] py-3 rounded-2xl items-center justify-center active:opacity-80 shadow-md"
              >
                <Text className="text-[#181524] text-sm font-black uppercase tracking-wider">
                  Close
                </Text>
              </Pressable>
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

export default TeacherHolidayCalendarScreen;
