import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  X,
  Send,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Sparkles,
  Award,
  Layers,
} from "lucide-react-native";
import { useResponsive } from "../../utils/responsive";
import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../services/api";

export interface LeaveRequestItem {
  id: string;
  staffId: string;
  staffName: string;
  init: string;
  type: "Sick Leave" | "Casual Leave" | "Emergency Leave" | "Earned Leave";
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedAt?: string;
  adminNotes?: string;
}

export interface LeaveBalanceItem {
  type: "Sick Leave" | "Casual Leave" | "Emergency Leave" | "Earned Leave";
  short: string;
  total: number;
  used: number;
  remaining: number;
  color: string;
}

const DEFAULT_LEAVE_BALANCES: LeaveBalanceItem[] = [
  { type: "Sick Leave", short: "SL", total: 12, used: 4, remaining: 8, color: "#38bdf8" },
  { type: "Casual Leave", short: "CL", total: 6, used: 1, remaining: 5, color: "#ddb7ff" },
  { type: "Earned Leave", short: "EL", total: 18, used: 3, remaining: 15, color: "#00f1a1" },
  { type: "Emergency Leave", short: "EML", total: 5, used: 1, remaining: 4, color: "#facc15" },
];

const INITIAL_TEACHER_LEAVES: LeaveRequestItem[] = [
  {
    id: "lev_1",
    staffId: "tea_101",
    staffName: "Priya Sharma",
    init: "PS",
    type: "Casual Leave",
    from: "2026-11-12",
    to: "2026-11-14",
    days: 3,
    reason: "Family emergency travel and personal commitments.",
    status: "Pending",
    appliedAt: "10 Nov 2026",
  },
  {
    id: "lev_2",
    staffId: "tea_101",
    staffName: "Priya Sharma",
    init: "PS",
    type: "Sick Leave",
    from: "2026-10-28",
    to: "2026-10-28",
    days: 1,
    reason: "Doctor appointment and seasonal viral recovery.",
    status: "Approved",
    appliedAt: "26 Oct 2026",
  },
  {
    id: "lev_3",
    staffId: "tea_101",
    staffName: "Priya Sharma",
    init: "PS",
    type: "Earned Leave",
    from: "2026-10-15",
    to: "2026-10-17",
    days: 3,
    reason: "Personal family vacation and out of station travel.",
    status: "Rejected",
    appliedAt: "12 Oct 2026",
    adminNotes: "High student examination evaluation schedule during these dates. Please reschedule after midterm exams.",
  },
  {
    id: "lev_4",
    staffId: "tea_101",
    staffName: "Priya Sharma",
    init: "PS",
    type: "Emergency Leave",
    from: "2026-09-18",
    to: "2026-09-18",
    days: 1,
    reason: "Urgent domestic repair and power maintenance.",
    status: "Approved",
    appliedAt: "17 Sep 2026",
  },
];

export interface HolidayItem {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  dateRange: string;
  type: "National" | "Festival" | "Institutional" | "Vacation";
  description: string;
  color?: string;
}

const DEFAULT_HOLIDAYS: HolidayItem[] = [
  {
    id: "hol_1",
    title: "Independence Day",
    startDate: "2026-08-15",
    endDate: "2026-08-15",
    dateRange: "15 Aug 2026",
    type: "National",
    description: "National Holiday celebrating Indian Independence with flag hoisting",
    color: "#00f1a1",
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
  },
  {
    id: "hol_4",
    title: "Dussehra Break",
    startDate: "2026-10-20",
    endDate: "2026-10-24",
    dateRange: "20 Oct - 24 Oct 2026",
    type: "Vacation",
    description: "Dussehra term vacation break for all classes and faculty",
    color: "#c084fc",
  },
  {
    id: "hol_5",
    title: "Telangana Formation",
    startDate: "2026-06-02",
    endDate: "2026-06-02",
    dateRange: "02 Jun 2026",
    type: "National",
    description: "Official State Holiday for Telangana Formation Day",
    color: "#ef4444",
  },
  {
    id: "hol_6",
    title: "Ramzan / Eid",
    startDate: "2026-06-16",
    endDate: "2026-06-17",
    dateRange: "16 Jun - 17 Jun 2026",
    type: "Festival",
    description: "Festival holidays and special prayer observances",
    color: "#38bdf8",
  },
  {
    id: "hol_7",
    title: "Diwali Break",
    startDate: "2026-11-08",
    endDate: "2026-11-10",
    dateRange: "08 Nov - 10 Nov 2026",
    type: "Festival",
    description: "Deepavali festival holidays and lakshmi pooja celebrations",
    color: "#f59e0b",
  },
  {
    id: "hol_8",
    title: "Winter Break",
    startDate: "2026-12-23",
    endDate: "2026-12-26",
    dateRange: "23 Dec - 26 Dec 2026",
    type: "Vacation",
    description: "Annual winter vacation and Christmas celebration break",
    color: "#38bdf8",
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
  },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Helper: Format YYYY-MM-DD into readable date (e.g. "15 Aug 2026")
const formatDisplayDate = (isoStr: string): string => {
  if (!isoStr || !isoStr.includes("-")) return isoStr || "";
  const parts = isoStr.split("-");
  if (parts.length !== 3) return isoStr;
  const y = parts[0];
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return `${d} ${MONTH_SHORT[m] || ""} ${y}`;
};

export const LeaveApplicationScreen: React.FC<{ navigation: any }> = ({
  navigation: propNavigation,
}) => {
  const navigation = useNavigation<any>() || propNavigation;
  const insets = useSafeAreaInsets();
  const { headerPaddingTop, scrollBottomPadding } = useResponsive();
  const { user } = useAuthStore();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>(INITIAL_TEACHER_LEAVES);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceItem[]>(DEFAULT_LEAVE_BALANCES);
  const [holidays, setHolidays] = useState<HolidayItem[]>(DEFAULT_HOLIDAYS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [refreshing, setRefreshing] = useState(false);

  // Apply Leave Modal State (Default to valid upcoming working days)
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyType, setApplyType] = useState<"Sick Leave" | "Casual Leave" | "Emergency Leave" | "Earned Leave">("Sick Leave");
  const [applyFrom, setApplyFrom] = useState("2026-11-18");
  const [applyTo, setApplyTo] = useState("2026-11-20");
  const [applyReason, setApplyReason] = useState("");
  const [dateError, setDateError] = useState("");

  // Date Picker Modal State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<"from" | "to">("from");
  const [pickerYear, setPickerYear] = useState(2026);
  const [pickerMonth, setPickerMonth] = useState(10); // November (0-indexed)

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<{ title: string; message: string; type: "success" | "warning" } | null>(null);

  const showToast = (title: string, message: string, type: "success" | "warning" = "success") => {
    setToastMsg({ title, message, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleBack = useCallback(() => {
    navigation.navigate("Dashboard");
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showDatePicker) {
          setShowDatePicker(false);
          return true;
        }
        if (showApplyModal) {
          setShowApplyModal(false);
          return true;
        }
        handleBack();
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [showDatePicker, showApplyModal, handleBack])
  );

  // Clean Teacher Name
  const displayTeacherName = useMemo(() => {
    const rawName = user?.name || "";
    const cleaned = rawName
      .replace(/^[\s(]*(ms|mr|mrs|dr|prof)\.?[\s)]*/i, "")
      .replace(/[\s()]/g, " ")
      .trim();
    const firstName = cleaned.split(/\s+/)[0] || "FACULTY";
    return firstName.toUpperCase();
  }, [user?.name]);

  // Fetch Leaves and Holidays from API / DB
  const fetchLeavesAndHolidays = async () => {
    setRefreshing(true);
    try {
      // 1. Fetch Leaves
      const res = await api.getResources("settings", { key: "kts_leave_requests" }).catch(() => null);
      if (Array.isArray(res) && res.length > 0 && res[0]?.value) {
        const parsed = typeof res[0].value === "string" ? JSON.parse(res[0].value) : res[0].value;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const teacherLeaves = parsed.filter(
            (l: any) => !user?.id || l.staffId === user?.id || (l.staffName || "").toLowerCase().includes(user?.name?.toLowerCase() || "")
          );
          if (teacherLeaves.length > 0) {
            setLeaveRequests(teacherLeaves);
          }
        }
      }

      // 2. Fetch Holidays defined by Admin Staff / Super Admin
      const holRes = await api.getResources("holidays").catch(() => null);
      if (Array.isArray(holRes) && holRes.length > 0) {
        const mapped: HolidayItem[] = holRes.map((h: any) => {
          const start = h.start_date || h.date || "2026-08-15";
          const end = h.end_date || start;
          return {
            id: String(h.id),
            title: h.title || h.name || "School Holiday",
            startDate: start,
            endDate: end,
            dateRange: h.date_range || `${start} - ${end}`,
            type: (h.type || "Festival") as any,
            description: h.description || "Official school holiday",
            color: h.color || "#c084fc",
          };
        });
        setHolidays(mapped);
      }
    } catch (err) {
      console.log("Error loading leaves or holidays:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeavesAndHolidays();
  }, [user]);

  // Helper: Find holiday item that covers a given date string (YYYY-MM-DD)
  const findHolidayForDate = useCallback(
    (dateStr: string): HolidayItem | undefined => {
      return holidays.find((h) => {
        const s = h.startDate || "";
        const e = h.endDate || s;
        return dateStr >= s && dateStr <= e;
      });
    },
    [holidays]
  );

  // Helper: Check if a date is non-working (Sunday or official holiday)
  const isDateDisabled = useCallback(
    (dateStr: string, isSunday: boolean): boolean => {
      if (isSunday) return true;
      return !!findHolidayForDate(dateStr);
    },
    [findHolidayForDate]
  );

  // Calculated WORKING Days between applyFrom & applyTo (Excludes Sundays & Official Holidays)
  const calculatedDays = useMemo(() => {
    if (!applyFrom || !applyTo) return 1;
    try {
      const s = new Date(applyFrom);
      const e = new Date(applyTo);
      if (e < s) return 1;
      let workingDays = 0;
      const cur = new Date(s);
      while (cur <= e) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, "0");
        const d = String(cur.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${d}`;
        const isSunday = cur.getDay() === 0;
        const isHol = isDateDisabled(dateStr, isSunday);
        if (!isHol) {
          workingDays++;
        }
        cur.setDate(cur.getDate() + 1);
      }
      return Math.max(1, workingDays);
    } catch {
      return 1;
    }
  }, [applyFrom, applyTo, isDateDisabled]);

  // Validate Dates (Must not fall on Sundays or Official Holidays)
  const validateDateSelection = useCallback(
    (fromStr: string, toStr: string) => {
      if (!fromStr || !toStr) return "";
      const from = new Date(fromStr);
      const to = new Date(toStr);
      if (to < from) {
        return "End date cannot be before start date.";
      }
      const fromSunday = from.getDay() === 0;
      const fromHoliday = findHolidayForDate(fromStr);
      if (fromSunday) {
        return "Start date cannot fall on a Sunday (school holiday).";
      }
      if (fromHoliday) {
        return `Start date falls on ${fromHoliday.title} (${fromHoliday.type} Holiday). Please select a working day.`;
      }
      const toSunday = to.getDay() === 0;
      const toHoliday = findHolidayForDate(toStr);
      if (toSunday) {
        return "End date cannot fall on a Sunday (school holiday).";
      }
      if (toHoliday) {
        return `End date falls on ${toHoliday.title} (${toHoliday.type} Holiday). Please select a working day.`;
      }
      return "";
    },
    [findHolidayForDate]
  );

  // Month Navigator Handlers for Date Picker Modal
  const handlePickerPrevMonth = useCallback(() => {
    if (pickerMonth === 0) {
      setPickerMonth(11);
      setPickerYear((y) => y - 1);
    } else {
      setPickerMonth((m) => m - 1);
    }
  }, [pickerMonth]);

  const handlePickerNextMonth = useCallback(() => {
    if (pickerMonth === 11) {
      setPickerMonth(0);
      setPickerYear((y) => y + 1);
    } else {
      setPickerMonth((m) => m + 1);
    }
  }, [pickerMonth]);

  const pickerPrevMonthRef = useRef(handlePickerPrevMonth);
  const pickerNextMonthRef = useRef(handlePickerNextMonth);
  pickerPrevMonthRef.current = handlePickerPrevMonth;
  pickerNextMonthRef.current = handlePickerNextMonth;

  // Swipe Gesture Responder for Calendar Modal Grid
  // Swipe right-to-left (dx < -35): Next Month
  // Swipe left-to-right (dx > 35): Previous Month
  const pickerSwipeResponder = useRef(
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
          pickerNextMonthRef.current?.();
        } else if (gestureState.dx > 35) {
          pickerPrevMonthRef.current?.();
        }
      },
    })
  ).current;

  // Open Date Picker for From / To
  const openDatePicker = (target: "from" | "to") => {
    setDatePickerTarget(target);
    const initialDate = target === "from" ? applyFrom : applyTo;
    if (initialDate && initialDate.includes("-")) {
      const parts = initialDate.split("-");
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        setPickerYear(y);
        setPickerMonth(m);
      }
    }
    setShowDatePicker(true);
  };

  // Select Date from Calendar Modal (Disables selection on Holidays/Sundays)
  const handleSelectDate = (dateStr: string, isSunday: boolean) => {
    const hol = findHolidayForDate(dateStr);
    if (isSunday) {
      showToast("Sunday Off", "Sundays are school holidays. Please select a working day.", "warning");
      return;
    }
    if (hol) {
      showToast("Official Holiday", `${hol.title} is an official school holiday (${hol.type}). Please select a working day.`, "warning");
      return;
    }

    if (datePickerTarget === "from") {
      setApplyFrom(dateStr);
      if (dateStr > applyTo) {
        setApplyTo(dateStr);
      }
      const err = validateDateSelection(dateStr, applyTo);
      setDateError(err);
    } else {
      setApplyTo(dateStr);
      const err = validateDateSelection(applyFrom, dateStr);
      setDateError(err);
    }
    setShowDatePicker(false);
  };

  // Submit Leave Request
  const handleSubmitLeave = async () => {
    if (!applyFrom || !applyTo || !applyReason.trim()) {
      showToast("Missing Details", "Please fill in leave reason and dates.", "warning");
      return;
    }

    const err = validateDateSelection(applyFrom, applyTo);
    if (err) {
      setDateError(err);
      showToast("Invalid Dates", err, "warning");
      return;
    }

    const selectedBal = leaveBalances.find((b) => b.type === applyType);
    if (selectedBal && selectedBal.remaining < calculatedDays) {
      showToast("Insufficient Balance", `You only have ${selectedBal.remaining} day(s) remaining for ${applyType}.`, "warning");
      return;
    }

    const newLeave: LeaveRequestItem = {
      id: `lev_${Date.now()}`,
      staffId: String(user?.id || "tea_101"),
      staffName: user?.name || "Priya Sharma",
      init: (user?.name?.slice(0, 2) || "PS").toUpperCase(),
      type: applyType,
      from: applyFrom,
      to: applyTo,
      days: calculatedDays,
      reason: applyReason.trim(),
      status: "Pending",
      appliedAt: "Just now",
    };

    const updatedList = [newLeave, ...leaveRequests];
    setLeaveRequests(updatedList);

    // Update balances locally
    setLeaveBalances((prev) =>
      prev.map((b) =>
        b.type === applyType
          ? { ...b, used: b.used + calculatedDays, remaining: Math.max(0, b.remaining - calculatedDays) }
          : b
      )
    );

    // Save to settings / API
    try {
      await api.createResource("settings", {
        key: "kts_leave_requests",
        value: JSON.stringify(updatedList),
        group: "leave",
        type: "json",
        is_public: true,
      }).catch(() => null);

      api.createResource("activity_logs", {
        log_name: "leave",
        event: "created",
        description: `${user?.name || "Teacher"} applied for ${calculatedDays} day(s) ${applyType} from ${applyFrom} to ${applyTo}.`,
        properties: {
          leave_type: applyType,
          from: applyFrom,
          to: applyTo,
          days: calculatedDays,
          reason: applyReason.trim(),
        },
      }).catch(() => null);
    } catch { /* empty */ }

    setShowApplyModal(false);
    setApplyReason("");
    setDateError("");
    showToast("Leave Submitted!", `Successfully applied for ${calculatedDays} day(s) ${applyType}.`);
  };

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.type.toLowerCase().includes(q) ||
        l.reason.toLowerCase().includes(q) ||
        l.from.includes(q) ||
        l.to.includes(q);
      const matchesStatus = statusFilter === "All" || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leaveRequests, searchQuery, statusFilter]);

  // Statistics KPI
  const stats = useMemo(() => {
    const total = leaveRequests.length;
    const pending = leaveRequests.filter((l) => l.status === "Pending").length;
    const approved = leaveRequests.filter((l) => l.status === "Approved").length;
    const daysUsed = leaveRequests
      .filter((l) => l.status === "Approved")
      .reduce((sum, l) => sum + (l.days || 1), 0);
    return { total, pending, approved, daysUsed };
  }, [leaveRequests]);

  // Calendar Grid builder for Date Picker Modal (Weeks of 7 days with Prev/Next month padding)
  const pickerDaysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const pickerFirstDayWeekday = new Date(pickerYear, pickerMonth, 1).getDay(); // 0 = Sunday
  const prevMonthDaysCount = new Date(pickerYear, pickerMonth, 0).getDate(); // days in previous month

  const pickerWeeks = useMemo(() => {
    const totalSlots: {
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isSunday: boolean;
      holiday?: HolidayItem;
    }[] = [];

    // 1. Previous month days (grayed out)
    const prevYear = pickerMonth === 0 ? pickerYear - 1 : pickerYear;
    const prevMonth = pickerMonth === 0 ? 11 : pickerMonth - 1;
    const prevMonthStr = String(prevMonth + 1).padStart(2, "0");

    for (let i = 0; i < pickerFirstDayWeekday; i++) {
      const dayNum = prevMonthDaysCount - pickerFirstDayWeekday + 1 + i;
      const dStr = String(dayNum).padStart(2, "0");
      const fullDateStr = `${prevYear}-${prevMonthStr}-${dStr}`;
      totalSlots.push({
        dayNum,
        dateStr: fullDateStr,
        isCurrentMonth: false,
        isSunday: i === 0,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= pickerDaysInMonth; d++) {
      const dayOfWeek = (pickerFirstDayWeekday + d - 1) % 7;
      const mStr = String(pickerMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      const fullDateStr = `${pickerYear}-${mStr}-${dStr}`;
      const hol = findHolidayForDate(fullDateStr);
      totalSlots.push({
        dayNum: d,
        dateStr: fullDateStr,
        isCurrentMonth: true,
        isSunday: dayOfWeek === 0,
        holiday: hol,
      });
    }

    // 3. Next month days (grayed out)
    const nextYear = pickerMonth === 11 ? pickerYear + 1 : pickerYear;
    const nextMonth = pickerMonth === 11 ? 0 : pickerMonth + 1;
    const nextMonthStr = String(nextMonth + 1).padStart(2, "0");
    let nextD = 1;

    while (totalSlots.length % 7 !== 0) {
      const dStr = String(nextD).padStart(2, "0");
      const fullDateStr = `${nextYear}-${nextMonthStr}-${dStr}`;
      const dayOfWeek = totalSlots.length % 7;
      totalSlots.push({
        dayNum: nextD,
        dateStr: fullDateStr,
        isCurrentMonth: false,
        isSunday: dayOfWeek === 0,
      });
      nextD++;
    }

    const weeks: (typeof totalSlots)[] = [];
    for (let i = 0; i < totalSlots.length; i += 7) {
      weeks.push(totalSlots.slice(i, i + 7));
    }
    return weeks;
  }, [pickerYear, pickerMonth, pickerFirstDayWeekday, pickerDaysInMonth, prevMonthDaysCount, findHolidayForDate]);

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
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
                Leave Requests
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
        </BlurView>

        {/* Glow Shadow beneath header */}
        <LinearGradient
          colors={["rgba(221, 183, 255, 0.18)", "transparent"]}
          style={{ position: "absolute", bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      {/* TOAST MESSAGE */}
      {toastMsg && (
        <View
          style={{
            position: "absolute",
            top: headerPaddingTop + 65,
            left: 16,
            right: 16,
            zIndex: 100,
            backgroundColor: toastMsg.type === "success" ? "#064e3b" : "#78350f",
            borderColor: toastMsg.type === "success" ? "#059669" : "#d97706",
            borderWidth: 1,
            borderRadius: 16,
            padding: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "900", fontSize: 13, marginBottom: 2 }}>
            {toastMsg.title}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11.5, fontWeight: "600" }}>
            {toastMsg.message}
          </Text>
        </View>
      )}

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
            onRefresh={fetchLeavesAndHolidays}
            tintColor="#ddb7ff"
            colors={["#ddb7ff", "#c084fc"]}
          />
        }
      >
        {/* 1. DASHBOARD TITLE & ACTION BUTTON */}
        <View className="mb-4 px-1 flex-row items-center justify-between" style={{ flexWrap: "nowrap" }}>
          <View className="flex-1 mr-2">
            <Text
              className="text-white text-2xl font-black font-display-lg"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={{ includeFontPadding: false }}
            >
              Leave Management
            </Text>
            <Text
              className="text-white/60 text-xs font-medium mt-0.5"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={{ includeFontPadding: false }}
            >
              Track leave balance, approvals, and submit applications
            </Text>
          </View>

          {/* Apply Leave Button */}
          <Pressable
            onPress={() => {
              setApplyFrom("2026-11-18");
              setApplyTo("2026-11-20");
              setApplyReason("");
              setDateError("");
              setShowApplyModal(true);
            }}
            className="bg-[#ddb7ff] px-3.5 py-2.5 rounded-2xl flex-row items-center shadow-lg active:opacity-80"
            style={{ flexShrink: 0 }}
          >
            <Plus size={16} color="#181524" style={{ marginRight: 4 }} strokeWidth={3} />
            <Text className="text-[#181524] text-xs font-black uppercase tracking-wider">
              Apply Leave
            </Text>
          </Pressable>
        </View>

        {/* 2. FOUR KPI SUMMARY CARDS */}
        <View className="flex-row items-center gap-2 mb-5" style={{ flexWrap: "nowrap" }}>
          {/* Total Leaves */}
          <View className="flex-1 bg-[#181524] border border-[#ddb7ff]/20 rounded-2xl p-2.5 items-center justify-center shadow-md">
            <Text className="text-white/60 text-[10px] font-extrabold uppercase" numberOfLines={1}>
              Total
            </Text>
            <Text className="text-[#ddb7ff] text-base font-black mt-0.5" numberOfLines={1}>
              {stats.total}
            </Text>
            <Text className="text-white/40 text-[9px] font-semibold mt-0.5" numberOfLines={1}>
              This Year
            </Text>
          </View>

          {/* Pending Approval */}
          <View className="flex-1 bg-[#181524] border border-amber-400/20 rounded-2xl p-2.5 items-center justify-center shadow-md">
            <Text className="text-white/60 text-[10px] font-extrabold uppercase" numberOfLines={1}>
              Pending
            </Text>
            <Text className="text-amber-300 text-base font-black mt-0.5" numberOfLines={1}>
              {stats.pending}
            </Text>
            <Text className="text-white/40 text-[9px] font-semibold mt-0.5" numberOfLines={1}>
              Under Review
            </Text>
          </View>

          {/* Approved */}
          <View className="flex-1 bg-[#181524] border border-[#00f1a1]/20 rounded-2xl p-2.5 items-center justify-center shadow-md">
            <Text className="text-white/60 text-[10px] font-extrabold uppercase" numberOfLines={1}>
              Approved
            </Text>
            <Text className="text-[#00f1a1] text-base font-black mt-0.5" numberOfLines={1}>
              {stats.approved}
            </Text>
            <Text className="text-white/40 text-[9px] font-semibold mt-0.5" numberOfLines={1}>
              Granted
            </Text>
          </View>

          {/* Days Used */}
          <View className="flex-1 bg-[#181524] border border-[#38bdf8]/20 rounded-2xl p-2.5 items-center justify-center shadow-md">
            <Text className="text-white/60 text-[10px] font-extrabold uppercase" numberOfLines={1}>
              Days Used
            </Text>
            <Text className="text-[#38bdf8] text-base font-black mt-0.5" numberOfLines={1}>
              {stats.daysUsed}
            </Text>
            <Text className="text-white/40 text-[9px] font-semibold mt-0.5" numberOfLines={1}>
              Days Taken
            </Text>
          </View>
        </View>

        {/* 3. LEAVE BALANCE BREAKDOWN CARD */}
        <View className="bg-[#181524] border border-white/10 rounded-3xl p-4 mb-5 shadow-lg">
          <View className="flex-row items-center justify-between mb-3 pb-2.5 border-b border-white/10" style={{ flexWrap: "nowrap" }}>
            <View className="flex-row items-center flex-1 mr-2" style={{ flexWrap: "nowrap" }}>
              <Award size={16} color="#ddb7ff" style={{ marginRight: 6, flexShrink: 0 }} />
              <Text className="text-white font-extrabold text-sm" numberOfLines={1}>
                Annual Leave Balances
              </Text>
            </View>
            <Text className="text-white/40 text-[11px] font-semibold" numberOfLines={1}>
              2026-2027
            </Text>
          </View>

          <View className="space-y-3">
            {leaveBalances.map((bal) => {
              const percent = bal.total > 0 ? Math.round((bal.remaining / bal.total) * 100) : 0;
              return (
                <View key={bal.type} className="mb-2.5">
                  <View className="flex-row items-center justify-between mb-1" style={{ flexWrap: "nowrap" }}>
                    <Text className="text-white font-bold text-xs flex-1" numberOfLines={1}>
                      {bal.type} ({bal.short})
                    </Text>
                    <Text className="text-white font-black text-xs" numberOfLines={1}>
                      {bal.remaining} / {bal.total} Days Left
                    </Text>
                  </View>

                  {/* Progress Bar Track */}
                  <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <View
                      style={{
                        width: `${percent}%`,
                        height: "100%",
                        backgroundColor: bal.color,
                        borderRadius: 999,
                      }}
                    />
                  </View>

                  <View className="flex-row justify-between items-center mt-1">
                    <Text className="text-white/40 text-[10px] font-medium">
                      {bal.used} used · {bal.remaining} remaining
                    </Text>
                    <Text style={{ color: bal.color, fontSize: 10, fontWeight: "800" }}>
                      {percent}% Available
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 4. SEARCH & STATUS FILTER BAR */}
        <View className="mb-4">
          <View className="bg-[#181524] border border-[#ddb7ff]/30 rounded-2xl px-3.5 py-2.5 flex-row items-center mb-3 shadow-md">
            <Search size={16} color="#ddb7ff" style={{ marginRight: 8, flexShrink: 0 }} />
            <TextInput
              placeholder="Search leave type, dates, reason..."
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

          {/* Status Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {(["All", "Pending", "Approved", "Rejected"] as const).map((st) => {
                const isSelected = statusFilter === st;
                return (
                  <Pressable
                    key={st}
                    onPress={() => setStatusFilter(st)}
                    style={[
                      {
                        paddingHorizontal: 14,
                        paddingVertical: 7,
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
                      {st === "All" ? "All Requests" : st}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* 5. MY LEAVE REQUESTS LIST */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3 px-1">
            <Text className="text-white text-base font-extrabold" numberOfLines={1}>
              My Leave History ({filteredRequests.length})
            </Text>
          </View>

          {filteredRequests.length === 0 ? (
            <View className="bg-[#181524] border border-white/10 rounded-3xl p-8 items-center justify-center shadow-lg">
              <Calendar
                size={32}
                color="rgba(255,255,255,0.3)"
                style={{ marginBottom: 8 }}
              />
              <Text className="text-white/60 text-xs font-bold text-center">
                No leave requests found matching "{searchQuery}"
              </Text>
            </View>
          ) : (
            filteredRequests.map((req) => {
              const statusStyle =
                req.status === "Approved"
                  ? { bg: "rgba(0, 241, 161, 0.15)", border: "rgba(0, 241, 161, 0.4)", text: "#00f1a1", dot: "#00f1a1" }
                  : req.status === "Pending"
                  ? { bg: "rgba(251, 191, 36, 0.18)", border: "rgba(251, 191, 36, 0.45)", text: "#fcd34d", dot: "#fbbf24" }
                  : { bg: "rgba(239, 68, 68, 0.18)", border: "rgba(239, 68, 68, 0.45)", text: "#f87171", dot: "#ef4444" };

              const typeBadgeColor =
                req.type === "Sick Leave"
                  ? { bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.35)", text: "#38bdf8" }
                  : req.type === "Casual Leave"
                  ? { bg: "rgba(221, 183, 255, 0.15)", border: "rgba(221, 183, 255, 0.35)", text: "#ddb7ff" }
                  : req.type === "Earned Leave"
                  ? { bg: "rgba(0, 241, 161, 0.15)", border: "rgba(0, 241, 161, 0.35)", text: "#00f1a1" }
                  : { bg: "rgba(250, 204, 21, 0.18)", border: "rgba(250, 204, 21, 0.4)", text: "#facc15" };

              return (
                <View
                  key={req.id}
                  className="bg-[#181524] border border-white/10 rounded-3xl p-4 mb-3.5 shadow-lg"
                >
                  {/* Row 1: Type Pill & Status Pill */}
                  <View className="flex-row items-center justify-between mb-2.5" style={{ flexWrap: "nowrap" }}>
                    <View
                      style={{
                        backgroundColor: typeBadgeColor.bg,
                        borderColor: typeBadgeColor.border,
                        borderWidth: 1,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 999,
                        flexShrink: 0,
                      }}
                    >
                      <Text
                        style={{
                          color: typeBadgeColor.text,
                          fontSize: 11,
                          fontWeight: "900",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          includeFontPadding: false,
                        }}
                        numberOfLines={1}
                      >
                        {req.type}
                      </Text>
                    </View>

                    {/* Status Pill */}
                    <View
                      style={{
                        backgroundColor: statusStyle.bg,
                        borderColor: statusStyle.border,
                        borderWidth: 1,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 999,
                        flexDirection: "row",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: statusStyle.dot,
                          marginRight: 6,
                        }}
                      />
                      <Text
                        style={{
                          color: statusStyle.text,
                          fontSize: 11,
                          fontWeight: "900",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          includeFontPadding: false,
                        }}
                        numberOfLines={1}
                      >
                        {req.status}
                      </Text>
                    </View>
                  </View>

                  {/* Row 2: Date Range & Duration */}
                  <View className="flex-row items-center justify-between py-2 border-y border-white/5" style={{ flexWrap: "nowrap" }}>
                    <View className="flex-row items-center flex-1 mr-2" style={{ flexWrap: "nowrap" }}>
                      <CalendarDays size={14} color="#ddb7ff" style={{ marginRight: 6, flexShrink: 0 }} />
                      <Text className="text-white font-bold text-xs flex-1" numberOfLines={1}>
                        {formatDisplayDate(req.from)} → {formatDisplayDate(req.to)}
                      </Text>
                    </View>
                    <View className="bg-white/10 px-2.5 py-0.5 rounded-md" style={{ flexShrink: 0 }}>
                      <Text className="text-white font-black text-xs">
                        {req.days} Day{req.days > 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>

                  {/* Row 3: Reason */}
                  <View className="mt-2.5">
                    <Text className="text-white/50 text-[10px] font-bold uppercase mb-0.5">
                      Reason
                    </Text>
                    <Text className="text-white/80 text-xs font-medium leading-tight">
                      {req.reason}
                    </Text>
                  </View>

                  {/* Row 4: Rejection Banner if Rejected */}
                  {req.status === "Rejected" && req.adminNotes ? (
                    <View
                      style={{
                        marginTop: 12,
                        backgroundColor: "rgba(239, 68, 68, 0.12)",
                        borderColor: "rgba(239, 68, 68, 0.35)",
                        borderWidth: 1,
                        borderRadius: 16,
                        padding: 12,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                        <AlertCircle size={13} color="#ef4444" style={{ marginRight: 5 }} />
                        <Text style={{ color: "#f87171", fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
                          Reason for Rejection
                        </Text>
                      </View>
                      <Text style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: 12, fontWeight: "500", lineHeight: 18 }}>
                        {req.adminNotes}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 6. APPLY FOR LEAVE MODAL */}
      {showApplyModal && (
        <Modal
          visible={showApplyModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowApplyModal(false)}
        >
          <View className="flex-1 bg-black/80 items-center justify-center p-4">
            <View className="w-full max-w-sm bg-[#181524] border border-[#ddb7ff]/40 rounded-3xl p-5 shadow-2xl">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between pb-3 border-b border-white/10 mb-4" style={{ flexWrap: "nowrap" }}>
                <View className="flex-row items-center flex-1 mr-2" style={{ flexWrap: "nowrap" }}>
                  <CalendarDays size={18} color="#ddb7ff" style={{ marginRight: 8, flexShrink: 0 }} />
                  <Text className="text-white font-extrabold text-base" numberOfLines={1}>
                    Apply for Leave
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowApplyModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                >
                  <X size={16} color="white" />
                </Pressable>
              </View>

              <ScrollView className="max-h-[420px]" showsVerticalScrollIndicator={false}>
                {/* 1. Leave Type Selector */}
                <Text className="text-[#ddb7ff] text-[10px] font-extrabold uppercase tracking-wider mb-2">
                  Select Leave Type *
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-2">
                  {(["Sick Leave", "Casual Leave", "Emergency Leave", "Earned Leave"] as const).map((t) => {
                    const isSel = applyType === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => setApplyType(t)}
                        style={[
                          {
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 12,
                            borderWidth: 1,
                          },
                          isSel
                            ? { backgroundColor: "#ddb7ff", borderColor: "#ddb7ff" }
                            : { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 11.5,
                            fontWeight: "800",
                            color: isSel ? "#181524" : "#ffffff",
                          }}
                        >
                          {t}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Remaining Balance indicator */}
                <View className="mb-4 bg-[#ddb7ff]/10 border border-[#ddb7ff]/20 px-3 py-1.5 rounded-xl flex-row items-center">
                  <Info size={12} color="#ddb7ff" style={{ marginRight: 6 }} />
                  <Text className="text-[#ddb7ff] text-xs font-bold">
                    Remaining:{" "}
                    {(() => {
                      const b = leaveBalances.find((x) => x.type === applyType);
                      return b ? `${b.remaining} of ${b.total} Days` : "N/A";
                    })()}
                  </Text>
                </View>

                {/* 2. Date Pickers (From / To) */}
                <View className="flex-row gap-2 mb-3">
                  {/* From Date */}
                  <View className="flex-1">
                    <Text className="text-white/60 text-[10px] font-extrabold uppercase mb-1">
                      From Date *
                    </Text>
                    <Pressable
                      onPress={() => openDatePicker("from")}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex-row items-center justify-between active:bg-white/10"
                    >
                      <Text className="text-white text-xs font-bold" numberOfLines={1}>
                        {formatDisplayDate(applyFrom)}
                      </Text>
                      <Calendar size={13} color="#ddb7ff" />
                    </Pressable>
                  </View>

                  {/* To Date */}
                  <View className="flex-1">
                    <Text className="text-white/60 text-[10px] font-extrabold uppercase mb-1">
                      To Date *
                    </Text>
                    <Pressable
                      onPress={() => openDatePicker("to")}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex-row items-center justify-between active:bg-white/10"
                    >
                      <Text className="text-white text-xs font-bold" numberOfLines={1}>
                        {formatDisplayDate(applyTo)}
                      </Text>
                      <Calendar size={13} color="#ddb7ff" />
                    </Pressable>
                  </View>
                </View>

                {/* Calculated Working Days Pill */}
                <View className="bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-xl flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Clock size={14} color="#00f1a1" style={{ marginRight: 6 }} />
                    <Text className="text-white/70 text-xs font-semibold">
                      Calculated Duration:
                    </Text>
                  </View>
                  <Text className="text-[#00f1a1] text-sm font-black">
                    {calculatedDays} Working Day{calculatedDays > 1 ? "s" : ""}
                  </Text>
                </View>

                {/* Date Error Warning if any */}
                {dateError ? (
                  <View className="bg-[#ef4444]/15 border border-[#ef4444]/30 p-2.5 rounded-xl mb-3 flex-row items-center">
                    <AlertCircle size={13} color="#ef4444" style={{ marginRight: 6 }} />
                    <Text className="text-[#ef4444] text-xs font-semibold flex-1">
                      {dateError}
                    </Text>
                  </View>
                ) : null}

                {/* 3. Reason for Leave */}
                <Text className="text-[#ddb7ff] text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
                  Reason for Absence *
                </Text>
                <TextInput
                  value={applyReason}
                  onChangeText={setApplyReason}
                  placeholder="Provide brief details for your absence request..."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  multiline
                  numberOfLines={3}
                  className="bg-white/5 border border-white/10 rounded-2xl p-3 text-white text-xs font-medium mb-4 leading-relaxed"
                  style={{ textAlignVertical: "top", minHeight: 70 }}
                />

                {/* Submit Button */}
                <Pressable
                  onPress={handleSubmitLeave}
                  className="w-full bg-[#ddb7ff] py-3.5 rounded-2xl flex-row items-center justify-center active:opacity-80 shadow-lg shadow-[#ddb7ff]/20"
                >
                  <Text className="text-[#181524] text-sm font-black uppercase tracking-wider mr-2">
                    Submit Application
                  </Text>
                  <Send size={15} color="#181524" />
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* 7. CALENDAR DATE PICKER MODAL */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View className="flex-1 bg-black/85 items-center justify-center p-4">
            <View className="w-full max-w-sm bg-[#181524] border border-[#ddb7ff]/40 rounded-3xl p-4 shadow-2xl">
              {/* Header */}
              <View className="flex-row items-center justify-between pb-3 border-b border-white/10 mb-3" style={{ flexWrap: "nowrap" }}>
                <View className="flex-row items-center flex-1 mr-2" style={{ flexWrap: "nowrap" }}>
                  <CalendarDays size={16} color="#ddb7ff" style={{ marginRight: 6, flexShrink: 0 }} />
                  <Text className="text-white font-extrabold text-sm" numberOfLines={1}>
                    Select {datePickerTarget === "from" ? "Start Date (From)" : "End Date (To)"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  className="w-7 h-7 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color="white" />
                </Pressable>
              </View>

              {/* Month Navigator Header Bar */}
              <View className="flex-row justify-between items-center bg-black/60 border border-[#ddb7ff]/30 px-3 py-2 rounded-2xl mb-3">
                <Pressable
                  onPress={handlePickerPrevMonth}
                  className="p-1.5 rounded-xl bg-white/5 active:bg-white/15"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronLeft size={16} color="#ddb7ff" />
                </Pressable>
                <View className="items-center">
                  <Text className="text-white font-black text-xs">
                    {MONTH_NAMES[pickerMonth]} {pickerYear}
                  </Text>
                  <Text className="text-white/40 text-[9px] font-semibold">
                    Swipe left/right to navigate
                  </Text>
                </View>
                <Pressable
                  onPress={handlePickerNextMonth}
                  className="p-1.5 rounded-xl bg-white/5 active:bg-white/15"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronRight size={16} color="#ddb7ff" />
                </Pressable>
              </View>

              {/* Swipeable Calendar Grid Container */}
              <View {...pickerSwipeResponder.panHandlers} style={{ width: "100%" }}>
                {/* Day Name Header Row (7 Equal Columns) */}
                <View style={{ flexDirection: "row", width: "100%", marginBottom: 6 }}>
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                    <View key={d} style={{ flex: 1, paddingHorizontal: 1.5 }}>
                      <View
                        style={{
                          width: "100%",
                          paddingVertical: 5,
                          borderRadius: 8,
                          backgroundColor: i === 0 ? "rgba(244, 63, 94, 0.12)" : "rgba(255,255,255,0.05)",
                          borderWidth: 1,
                          borderColor: i === 0 ? "rgba(244, 63, 94, 0.25)" : "rgba(255,255,255,0.06)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "900",
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

                {/* Day Rows (Weeks) */}
                <View style={{ width: "100%" }}>
                  {pickerWeeks.map((week, weekIdx) => (
                    <View
                      key={`week_${weekIdx}`}
                      style={{ flexDirection: "row", width: "100%", marginBottom: 4 }}
                    >
                      {week.map((cell, colIdx) => {
                        // Previous or Next Month padding days (Grayed out)
                        if (!cell.isCurrentMonth) {
                          return (
                            <View
                              key={`pday_${weekIdx}_${colIdx}_${cell.dayNum}`}
                              style={{ flex: 1, paddingHorizontal: 1.5 }}
                            >
                              <View
                                style={{
                                  width: "100%",
                                  height: 48,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: 9,
                                  borderWidth: 1,
                                  borderColor: "rgba(255, 255, 255, 0.03)",
                                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 11.5,
                                    fontWeight: "700",
                                    color: "rgba(255, 255, 255, 0.22)",
                                    includeFontPadding: false,
                                  }}
                                >
                                  {cell.dayNum}
                                </Text>
                              </View>
                            </View>
                          );
                        }

                        // Current Month Days
                        const { dayNum, dateStr, isSunday, holiday } = cell;
                        const isHoliday = Boolean(holiday) || isSunday;
                        // Clean short label for calendar cell so text doesn't truncate with ...
                        const holidayLabel = holiday
                          ? holiday.title.replace(/\s+(Break|Holiday|Festival|Term Break|Festive Break)/gi, "").trim() || holiday.title
                          : isSunday
                          ? "Sunday"
                          : null;

                        const isSelected =
                          datePickerTarget === "from" ? applyFrom === dateStr : applyTo === dateStr;
                        const isInRange =
                          applyFrom &&
                          applyTo &&
                          dateStr >= applyFrom &&
                          dateStr <= applyTo;

                        return (
                          <View
                            key={`cday_${dayNum}`}
                            style={{ flex: 1, paddingHorizontal: 1.5 }}
                          >
                            <Pressable
                              onPress={() => handleSelectDate(dateStr, isSunday)}
                              style={[
                                {
                                  width: "100%",
                                  height: 48,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: 9,
                                  borderWidth: 1,
                                  paddingHorizontal: 1,
                                  paddingVertical: 2,
                                },
                                isHoliday
                                  ? {
                                      backgroundColor: isSunday
                                        ? "rgba(244, 63, 94, 0.12)"
                                        : "rgba(245, 158, 11, 0.15)",
                                      borderColor: isSunday
                                        ? "rgba(244, 63, 94, 0.35)"
                                        : "rgba(245, 158, 11, 0.4)",
                                    }
                                  : isInRange && !isSelected
                                  ? {
                                      backgroundColor: "rgba(221, 183, 255, 0.18)",
                                      borderColor: "rgba(221, 183, 255, 0.35)",
                                    }
                                  : {
                                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                                      borderColor: "rgba(255, 255, 255, 0.08)",
                                    },
                                isSelected
                                  ? {
                                      backgroundColor: "#ddb7ff",
                                      borderColor: "#ffffff",
                                      shadowColor: "#ddb7ff",
                                      shadowOffset: { width: 0, height: 2 },
                                      shadowOpacity: 0.5,
                                      shadowRadius: 6,
                                      elevation: 4,
                                    }
                                  : {},
                              ]}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: isSelected ? "900" : isHoliday ? "800" : "700",
                                  color: isSelected
                                    ? "#181524"
                                    : isSunday
                                    ? "#fca5a5"
                                    : isHoliday
                                    ? "#fbbf24"
                                    : "#ffffff",
                                  includeFontPadding: false,
                                }}
                              >
                                {dayNum}
                              </Text>

                              {/* Holiday Reason Text Defined by Admin Staff / Super Admin */}
                              {holidayLabel ? (
                                <Text
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                  style={{
                                    fontSize: 7.8,
                                    fontWeight: "900",
                                    color: isSelected
                                      ? "#181524"
                                      : isSunday
                                      ? "#fca5a5"
                                      : "#fde68a",
                                    textAlign: "center",
                                    maxWidth: "100%",
                                    marginTop: 1,
                                    includeFontPadding: false,
                                    letterSpacing: 0.2,
                                  }}
                                >
                                  {holidayLabel}
                                </Text>
                              ) : null}
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>

              {/* High-Contrast Bottom Legend Bar */}
              <View className="mt-3.5 pt-3 border-t border-white/10 flex-row items-center justify-between px-1">
                {/* Selected */}
                <View className="flex-row items-center">
                  <View
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 5,
                      backgroundColor: "#ddb7ff",
                      marginRight: 5,
                    }}
                  />
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 10.5,
                      fontWeight: "800",
                      includeFontPadding: false,
                    }}
                  >
                    Selected
                  </Text>
                </View>

                {/* Range */}
                <View className="flex-row items-center">
                  <View
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 5,
                      backgroundColor: "rgba(221, 183, 255, 0.4)",
                      borderWidth: 1.5,
                      borderColor: "#ddb7ff",
                      marginRight: 5,
                    }}
                  />
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 10.5,
                      fontWeight: "800",
                      includeFontPadding: false,
                    }}
                  >
                    Range
                  </Text>
                </View>

                {/* Holiday (Off) */}
                <View className="flex-row items-center">
                  <View
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 5,
                      backgroundColor: "#f59e0b",
                      marginRight: 5,
                    }}
                  />
                  <Text
                    style={{
                      color: "#fde68a",
                      fontSize: 10.5,
                      fontWeight: "900",
                      includeFontPadding: false,
                    }}
                  >
                    Holiday (Off)
                  </Text>
                </View>

                {/* Sunday */}
                <View className="flex-row items-center">
                  <View
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 5,
                      backgroundColor: "#fb7185",
                      marginRight: 5,
                    }}
                  />
                  <Text
                    style={{
                      color: "#fecdd3",
                      fontSize: 10.5,
                      fontWeight: "900",
                      includeFontPadding: false,
                    }}
                  >
                    Sunday
                  </Text>
                </View>
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

export default LeaveApplicationScreen;
