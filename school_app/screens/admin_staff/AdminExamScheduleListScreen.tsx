import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronRight as ChevronRightIcon,
  X,
  FileText,
  Plus,
  Trash2,
  Pencil,
  AlertCircle,
  AlertTriangle,
  CheckSquare,
  Square,
  Layers,
  Check,
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

export const formatToYYYYMMDD = (dateStr: string): string => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }
  return dateStr;
};

export const ACADEMIC_HOLIDAYS = [
  { id: "h1", name: "Telangana Formation Day", startDate: "2026-06-02", endDate: "2026-06-02" },
  { id: "h2", name: "Eid-ul-Fitr / Ramzan", startDate: "2026-06-16", endDate: "2026-06-17" },
  { id: "h3", name: "Bonalu Festival", startDate: "2026-07-20", endDate: "2026-07-20" },
  { id: "h4", name: "Independence Day", startDate: "2026-08-15", endDate: "2026-08-15" },
  { id: "h5", name: "Ganesh Chaturthi", startDate: "2026-09-07", endDate: "2026-09-08" },
  { id: "h6", name: "Milad-un-Nabi", startDate: "2026-09-16", endDate: "2026-09-16" },
  { id: "h7", name: "Gandhi Jayanti", startDate: "2026-10-02", endDate: "2026-10-02" },
  { id: "h8", name: "Dussehra Vacation", startDate: "2026-10-20", endDate: "2026-10-24" },
  { id: "h9", name: "Diwali / Deepavali", startDate: "2026-11-08", endDate: "2026-11-09" },
  { id: "h10", name: "Guru Nanak Jayanti", startDate: "2026-11-24", endDate: "2026-11-24" },
  { id: "h11", name: "Christmas Vacation", startDate: "2026-12-25", endDate: "2026-12-26" },
  { id: "h12", name: "New Year Holiday", startDate: "2027-01-01", endDate: "2027-01-01" },
  { id: "h13", name: "Sankranti Vacation", startDate: "2027-01-13", endDate: "2027-01-16" },
  { id: "h14", name: "Republic Day", startDate: "2027-01-26", endDate: "2027-01-26" },
];

export const isHolidayDate = (
  dateYMD: string,
  holidaysList: any[]
): { isHoliday: boolean; holidayName?: string } => {
  if (!dateYMD) return { isHoliday: false };
  for (const h of holidaysList) {
    if (h.date) {
      const hd = String(h.date).split("T")[0];
      if (hd === dateYMD) {
        return { isHoliday: true, holidayName: h.name || h.title || "Holiday" };
      }
    }
    if (h.startDate && h.endDate) {
      const s = String(h.startDate).split("T")[0];
      const e = String(h.endDate).split("T")[0];
      if (dateYMD >= s && dateYMD <= e) {
        return { isHoliday: true, holidayName: h.name || h.title || "Holiday" };
      }
    }
  }
  return { isHoliday: false };
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const AVAILABLE_CLASSES_LIST = [
  "Class 10A", "Class 10B",
  "Class 9A", "Class 9B",
  "Class 8A", "Class 8B",
  "Class 7A", "Class 7B",
  "Class 6A", "Class 6B",
  "Class 5A", "Class 4A",
  "Class 3A", "Class 2A", "Class 1A",
];

const AVAILABLE_SUBJECTS_LIST = [
  "Mathematics", "Physics", "Chemistry", "Biology",
  "General Science", "Social Studies", "Telugu", "Hindi",
  "English", "English Literature", "Computer Science", "EVS", "GK",
];

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
    ? (["#1d2022", "#101415"] as const)
    : (["#0d2a24", "#121414"] as const);

  const cardBg = isSuperAdmin ? "#101415" : "#102d26";
  const cardBorder = isSuperAdmin ? "rgba(240, 193, 16, 0.3)" : "rgba(0, 241, 161, 0.25)";

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
  
  // Classes Multi-selection
  const [formSelectedClasses, setFormSelectedClasses] = useState<string[]>([
    "Class 10A", "Class 9A", "Class 8A", "Class 7A", "Class 6A"
  ]);
  const [showClassMultiPicker, setShowClassMultiPicker] = useState(false);
  const [classSearchQuery, setClassSearchQuery] = useState("");

  // Subjects Multi-selection
  const [formSelectedSubjects, setFormSelectedSubjects] = useState<string[]>([
    "Mathematics", "Physics", "Chemistry", "English"
  ]);
  const [showSubjectMultiPicker, setShowSubjectMultiPicker] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");

  // Date State (DD-MM-YYYY) & Calendar Grid
  const [formDate, setFormDate] = useState("15-10-2026");
  const [showCalendarGrid, setShowCalendarGrid] = useState(false);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [holidaysList, setHolidaysList] = useState<any[]>(ACADEMIC_HOLIDAYS);

  const [formMaxMarks, setFormMaxMarks] = useState("100");
  const [formStatus, setFormStatus] = useState<ExamItem["status"]>("Upcoming");

  // Delete Confirmation Modal State
  const [deletingExam, setDeletingExam] = useState<ExamItem | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Custom UI Warning & Validation Modal State
  const [warningModal, setWarningModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: "warning" | "error" | "info";
  } | null>(null);

  const showWarning = (
    title: string,
    message: string,
    type: "warning" | "error" | "info" = "warning"
  ) => {
    setWarningModal({ visible: true, title, message, type });
  };

  // Fetch holidays on mount
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res: any = await api.getResources("holidays");
        if (Array.isArray(res) && res.length > 0) {
          setHolidaysList(res);
        }
      } catch {
        // fallback to ACADEMIC_HOLIDAYS
      }
    };
    fetchHolidays();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Date auto-formatting helper for DD-MM-YYYY
  const handleDateChange = (text: string) => {
    if (text.length < formDate.length) {
      setFormDate(text);
      return;
    }
    const digits = text.replace(/[^0-9]/g, "");
    let res = digits;
    if (digits.length > 2 && digits.length <= 4) {
      res = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    } else if (digits.length > 4) {
      res = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
    }
    setFormDate(res);
  };

  const setTodayDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    setFormDate(`${dd}-${mm}-${yyyy}`);
  };

  const setTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const yyyy = tomorrow.getFullYear();
    setFormDate(`${dd}-${mm}-${yyyy}`);
  };

  const manualDateValidation = useMemo(() => {
    if (!formDate || formDate.length < 10) return null;
    const ymd = formatToYYYYMMDD(formDate);
    const dObj = new Date(ymd + "T00:00:00");
    if (isNaN(dObj.getTime())) return { type: "error", message: "Invalid date format (Use DD-MM-YYYY)" };
    if (dObj.getDay() === 0) {
      return { type: "warning", message: "Selected date is a Sunday (School closed)" };
    }
    const hol = isHolidayDate(ymd, holidaysList);
    if (hol.isHoliday) {
      return { type: "warning", message: `Selected date is a holiday (${hol.holidayName})` };
    }
    return { type: "valid", message: "Valid start date" };
  }, [formDate, holidaysList]);

  // Multi-selection helper functions
  const toggleSelectClass = (cls: string) => {
    setFormSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const selectAllClasses = () => {
    setFormSelectedClasses(AVAILABLE_CLASSES_LIST);
  };

  const clearAllClasses = () => {
    setFormSelectedClasses([]);
  };

  const toggleSelectSubject = (sub: string) => {
    setFormSelectedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const selectAllSubjects = () => {
    setFormSelectedSubjects(AVAILABLE_SUBJECTS_LIST);
  };

  const clearAllSubjects = () => {
    setFormSelectedSubjects([]);
  };

  const filteredClassesList = useMemo(() => {
    if (!classSearchQuery.trim()) return AVAILABLE_CLASSES_LIST;
    const q = classSearchQuery.toLowerCase();
    return AVAILABLE_CLASSES_LIST.filter((c) => c.toLowerCase().includes(q));
  }, [classSearchQuery]);

  const filteredSubjectsList = useMemo(() => {
    if (!subjectSearchQuery.trim()) return AVAILABLE_SUBJECTS_LIST;
    const q = subjectSearchQuery.toLowerCase();
    return AVAILABLE_SUBJECTS_LIST.filter((s) => s.toLowerCase().includes(q));
  }, [subjectSearchQuery]);

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
    setFormSelectedClasses(["Class 10A", "Class 9A", "Class 8A", "Class 7A", "Class 6A"]);
    setFormSelectedSubjects(["Mathematics", "Physics", "Chemistry", "English"]);
    setFormDate(formatToDDMMYYYY(new Date().toISOString().slice(0, 10)) || "15-10-2026");
    setFormMaxMarks("100");
    setFormStatus("Upcoming");
    setShowCreateModal(true);
  };

  const openEditModal = (exam: ExamItem) => {
    setEditingExamId(exam.id);
    setFormExamName(exam.name);
    const clsArr = exam.classes ? exam.classes.split(",").map((c) => c.trim()).filter(Boolean) : [];
    setFormSelectedClasses(clsArr.length > 0 ? clsArr : ["Class 10A", "Class 9A"]);
    const subArr = exam.subjects ? exam.subjects.split(",").map((s) => s.trim()).filter(Boolean) : [];
    setFormSelectedSubjects(subArr.length > 0 ? subArr : ["Mathematics", "Physics"]);
    setFormDate(formatToDDMMYYYY(exam.date));
    setFormMaxMarks(String(exam.maxMarks));
    setFormStatus(exam.status);
    setShowCreateModal(true);
  };

  const handleSaveExam = () => {
    if (!formExamName.trim()) {
      showWarning(
        "Examination Name Required",
        "Please provide an examination name before proceeding.",
        "warning"
      );
      return;
    }
    if (formSelectedClasses.length === 0) {
      showWarning(
        "Target Classes Required",
        "Please select at least one class for this examination.",
        "warning"
      );
      return;
    }
    if (formSelectedSubjects.length === 0) {
      showWarning(
        "Subjects Required",
        "Please select at least one subject included in this examination.",
        "warning"
      );
      return;
    }

    const marksNum = parseInt(formMaxMarks, 10) || 100;
    const formattedDate = formatToDDMMYYYY(formDate) || "15-10-2026";
    const classesStr = formSelectedClasses.join(", ");
    const subjectsStr = formSelectedSubjects.join(", ");

    if (editingExamId) {
      setExams((prev) =>
        prev.map((e) =>
          e.id === editingExamId
            ? {
                ...e,
                name: formExamName.trim(),
                classes: classesStr,
                subjects: subjectsStr,
                date: formattedDate,
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
        classes: classesStr,
        subjects: subjectsStr,
        date: formattedDate,
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
                  Exam Schedule
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
        {/* 4 KPI CARDS (2x2 Grid) */}
        <View className="mb-4" style={{ gap: 10 }}>
          {/* Row 1 */}
          <View className="flex-row" style={{ gap: 10 }}>
            {/* 1. Upcoming Exams */}
            <View
              className="flex-1 border rounded-2xl p-3.5 shadow-md relative overflow-hidden"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  className="text-white/60 text-[11px] font-bold flex-1 mr-1"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={{ includeFontPadding: false }}
                >
                  Upcoming Exams
                </Text>
                <View className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 items-center justify-center" style={{ flexShrink: 0 }}>
                  <BookOpen size={16} color="#38bdf8" />
                </View>
              </View>
              <Text className="text-white text-2xl font-black" numberOfLines={1} style={{ includeFontPadding: false }}>
                {upcomingCount}
              </Text>
              <Text className="text-white/40 text-[10px] font-medium mt-0.5" numberOfLines={1} style={{ includeFontPadding: false }}>
                This month
              </Text>
            </View>

            {/* 2. Class Average */}
            <View
              className="flex-1 border rounded-2xl p-3.5 shadow-md relative overflow-hidden"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  className="text-white/60 text-[11px] font-bold flex-1 mr-1"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={{ includeFontPadding: false }}
                >
                  Class Average
                </Text>
                <View className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center" style={{ flexShrink: 0 }}>
                  <BarChart2 size={16} color="#34d399" />
                </View>
              </View>
              <Text className="text-white text-2xl font-black" numberOfLines={1} style={{ includeFontPadding: false }}>
                78.4%
              </Text>
              <Text className="text-white/40 text-[10px] font-medium mt-0.5" numberOfLines={1} style={{ includeFontPadding: false }}>
                All Classes • Overall
              </Text>
            </View>
          </View>

          {/* Row 2 */}
          <View className="flex-row" style={{ gap: 10 }}>
            {/* 3. Top Score */}
            <View
              className="flex-1 border rounded-2xl p-3.5 shadow-md relative overflow-hidden"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  className="text-white/60 text-[11px] font-bold flex-1 mr-1"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={{ includeFontPadding: false }}
                >
                  Top Score
                </Text>
                <View
                  className="w-8 h-8 rounded-xl items-center justify-center border"
                  style={{
                    flexShrink: 0,
                    backgroundColor: `${primaryColor}20`,
                    borderColor: `${primaryColor}40`,
                  }}
                >
                  <Award size={16} color={primaryLight} />
                </View>
              </View>
              <Text className="text-white text-2xl font-black" numberOfLines={1} style={{ includeFontPadding: false }}>
                98.5%
              </Text>
              <Text className="text-white/40 text-[10px] font-medium mt-0.5" numberOfLines={1} style={{ includeFontPadding: false }}>
                Highest ranker
              </Text>
            </View>

            {/* 4. Results Published */}
            <View
              className="flex-1 border rounded-2xl p-3.5 shadow-md relative overflow-hidden"
              style={{
                backgroundColor: cardBg,
                borderColor: cardBorder,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  className="text-white/60 text-[11px] font-bold flex-1 mr-1"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={{ includeFontPadding: false }}
                >
                  Results Published
                </Text>
                <View className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 items-center justify-center" style={{ flexShrink: 0 }}>
                  <TrendingUp size={16} color="#facc15" />
                </View>
              </View>
              <Text className="text-white text-2xl font-black" numberOfLines={1} style={{ includeFontPadding: false }}>
                {resultsPublishedCount}
              </Text>
              <Text className="text-white/40 text-[10px] font-medium mt-0.5" numberOfLines={1} style={{ includeFontPadding: false }}>
                Exams
              </Text>
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
                className="px-4 py-2.5 rounded-xl border flex-row items-center"
                style={{
                  flexShrink: 0,
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
                  style={{ color: t.active ? "#000" : "#fff", flexShrink: 0, includeFontPadding: false }}
                  numberOfLines={1}
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
            <Search size={16} color={primaryLight} style={{ marginRight: 8, flexShrink: 0 }} />
            <TextInput
              placeholder="Search exams by name, class or subject..."
              placeholderTextColor="#ffffff50"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white text-xs font-semibold py-0"
              style={{ includeFontPadding: false }}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery("")} style={{ flexShrink: 0 }}>
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
              <Text numberOfLines={1} className="text-white/80 text-xs font-bold mr-1 flex-1" style={{ includeFontPadding: false }}>
                {selectedStatus}
              </Text>
              <ChevronDown size={14} color={primaryLight} style={{ flexShrink: 0 }} />
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
              <Text numberOfLines={1} className="text-white/80 text-xs font-bold mr-1 flex-1" style={{ includeFontPadding: false }}>
                {selectedSort}
              </Text>
              <ChevronDown size={14} color={primaryLight} style={{ flexShrink: 0 }} />
            </Pressable>
          </View>
        </View>

        {/* LIST HEADER WITH CREATE & BULK SELECTION CONTROLS */}
        <View className="mb-2 flex-row items-center justify-between px-1">
          <View className="flex-row items-center flex-1 mr-2">
            <Text className="text-white/70 text-xs font-bold uppercase tracking-wider mr-2" numberOfLines={1} style={{ includeFontPadding: false }}>
              Examination List
            </Text>
            <Text className="text-xs font-bold" numberOfLines={1} style={{ color: primaryLight, includeFontPadding: false }}>
              ({filteredExams.length} {filteredExams.length === 1 ? "Exam" : "Exams"})
            </Text>
          </View>

          {/* Right Actions: Create Button beside Bulk Select Button */}
          <View className="flex-row items-center" style={{ gap: 6, flexShrink: 0 }}>
            {/* Create Exam Button */}
            <Pressable
              onPress={openCreateModal}
              className="px-3 py-1.5 rounded-xl flex-row items-center shadow-md active:opacity-80"
              style={{ backgroundColor: primaryColor, flexShrink: 0 }}
            >
              <Plus size={13} color="#000" style={{ marginRight: 4, flexShrink: 0 }} />
              <Text className="text-black text-xs font-black" numberOfLines={1} style={{ flexShrink: 0, includeFontPadding: false }}>Create</Text>
            </Pressable>

            {/* Bulk Selection Toggle */}
            <Pressable
              onPress={() => {
                setIsBulkSelectionMode(!isBulkSelectionMode);
                setSelectedExamIds({});
              }}
              className="px-2.5 py-1.5 rounded-xl border flex-row items-center active:opacity-80"
              style={{
                flexShrink: 0,
                backgroundColor: isBulkSelectionMode ? `${primaryColor}20` : "rgba(255, 255, 255, 0.06)",
                borderColor: isBulkSelectionMode ? primaryColor : "rgba(255, 255, 255, 0.15)",
              }}
            >
              <Layers size={13} color={isBulkSelectionMode ? primaryLight : "#fff"} style={{ marginRight: 4, flexShrink: 0 }} />
              <Text
                className="text-xs font-bold"
                numberOfLines={1}
                style={{ color: isBulkSelectionMode ? primaryLight : "#fff", flexShrink: 0, includeFontPadding: false }}
              >
                {isBulkSelectionMode ? "Exit Bulk" : "Bulk Select"}
              </Text>
            </Pressable>
          </View>
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
            <Pressable onPress={selectAllExams} className="flex-row items-center flex-1 mr-2">
              {filteredExams.every((e) => selectedExamIds[e.id]) && filteredExams.length > 0 ? (
                <CheckSquare size={16} color={primaryLight} style={{ marginRight: 6, flexShrink: 0 }} />
              ) : (
                <Square size={16} color={primaryLight} style={{ marginRight: 6, flexShrink: 0 }} />
              )}
              <Text className="text-xs font-bold" numberOfLines={1} style={{ color: primaryLight, includeFontPadding: false }}>
                Select All ({selectedCount})
              </Text>
            </Pressable>

            {selectedCount > 0 && (
              <Pressable
                onPress={() => setShowBulkDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 flex-row items-center active:bg-rose-500/30"
                style={{ flexShrink: 0 }}
              >
                <Trash2 size={13} color="#f87171" style={{ marginRight: 4, flexShrink: 0 }} />
                <Text className="text-rose-300 text-xs font-bold" numberOfLines={1} style={{ flexShrink: 0, includeFontPadding: false }}>
                  Delete Selected ({selectedCount})
                </Text>
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
            <Text className="text-white/70 font-bold text-sm" style={{ includeFontPadding: false }}>No examinations found</Text>
            <Text className="text-white/40 text-xs text-center mt-1 mb-4" style={{ includeFontPadding: false }}>
              Try adjusting your search query or create a new examination.
            </Text>
            <Pressable
              onPress={openCreateModal}
              className="px-4 py-2.5 rounded-xl flex-row items-center"
              style={{ backgroundColor: primaryColor, flexShrink: 0 }}
            >
              <Plus size={15} color="#000" style={{ marginRight: 6 }} />
              <Text className="text-black text-xs font-black" numberOfLines={1} style={{ includeFontPadding: false }}>Create Examination</Text>
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
                          flexShrink: 0,
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
                      <View
                        className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 items-center justify-center mr-3"
                        style={{ flexShrink: 0 }}
                      >
                        <BookOpen size={20} color="#38bdf8" />
                      </View>
                    )}

                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center justify-between mb-1" style={{ flexWrap: "nowrap" }}>
                        <Text
                          className="text-white text-base font-black flex-1 mr-2"
                          numberOfLines={1}
                          style={{ includeFontPadding: false }}
                        >
                          {exam.name}
                        </Text>
                        <View
                          className={`px-2 py-0.5 rounded-md border ${badgeStyle.bg} ${badgeStyle.border}`}
                          style={{ flexShrink: 0 }}
                        >
                          <Text
                            className={`text-[10px] font-black ${badgeStyle.text}`}
                            numberOfLines={1}
                            style={{ flexShrink: 0, includeFontPadding: false }}
                          >
                            {exam.status}
                          </Text>
                        </View>
                      </View>
                      <Text
                        className="text-white/50 text-xs font-medium"
                        numberOfLines={1}
                        style={{ includeFontPadding: false }}
                      >
                        {exam.classes}
                      </Text>
                    </View>

                    {/* Admin Actions: Edit & Delete */}
                    <View className="flex-row items-center" style={{ gap: 6, flexShrink: 0 }}>
                      <Pressable
                        onPress={() => openEditModal(exam)}
                        className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
                        style={{ flexShrink: 0 }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Pencil size={14} color={primaryLight} />
                      </Pressable>
                      <Pressable
                        onPress={() => setDeletingExam(exam)}
                        className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 items-center justify-center active:bg-rose-500/25"
                        style={{ flexShrink: 0 }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={14} color="#f87171" />
                      </Pressable>
                    </View>
                  </View>

                  {/* Structured 2-Tier Metadata Info Box */}
                  <View
                    className="rounded-xl p-3 mb-3.5"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.35)", gap: 6 }}
                  >
                    <View className="flex-row items-center" style={{ flexWrap: "nowrap" }}>
                      <FileText size={12} color={primaryLight} style={{ marginRight: 6, flexShrink: 0 }} />
                      <Text className="text-white/70 text-xs font-semibold flex-1" numberOfLines={1} style={{ includeFontPadding: false }}>
                        Subjects: <Text className="text-white font-bold">{exam.subjects}</Text>
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between pt-1 border-t border-white/5" style={{ flexWrap: "nowrap" }}>
                      <View className="flex-row items-center flex-1 mr-2" style={{ flexWrap: "nowrap" }}>
                        <Calendar size={12} color={primaryLight} style={{ marginRight: 5, flexShrink: 0 }} />
                        <Text className="text-white/70 text-xs font-semibold" numberOfLines={1} style={{ includeFontPadding: false }}>
                          Date: <Text className="text-white font-bold">{exam.date}</Text>
                        </Text>
                      </View>

                      <View className="flex-row items-center" style={{ flexShrink: 0, flexWrap: "nowrap" }}>
                        <Award size={12} color="#facc15" style={{ marginRight: 5, flexShrink: 0 }} />
                        <Text className="text-white/70 text-xs font-semibold" numberOfLines={1} style={{ flexShrink: 0, includeFontPadding: false }}>
                          Max Marks: <Text className="text-[#facc15] font-black">{exam.maxMarks}</Text>
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Button Row */}
                  <View className="flex-row items-center justify-end pt-2 border-t border-white/10" style={{ gap: 8 }}>
                    {exam.status === "Results Published" && (
                      <Pressable
                        onPress={() => navigation.navigate("AdminExamResults", { examId: exam.id, exam: examPayload })}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/40 flex-row items-center active:bg-blue-500/30"
                        style={{ flexShrink: 0 }}
                      >
                        <Text className="text-blue-300 font-extrabold text-xs mr-1" numberOfLines={1} style={{ flexShrink: 0, includeFontPadding: false }}>
                          View Results
                        </Text>
                        <ChevronRight size={14} color="#93c5fd" />
                      </Pressable>
                    )}

                    {exam.status === "Completed" && (
                      <Pressable
                        onPress={() => navigation.navigate("AdminMarksPreview", { examId: exam.id, exam: examPayload, selectedClass: targetClass })}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex-row items-center active:bg-emerald-500/30"
                        style={{ flexShrink: 0 }}
                      >
                        <Text className="text-emerald-300 font-extrabold text-xs mr-1" numberOfLines={1} style={{ flexShrink: 0, includeFontPadding: false }}>
                          Marks Preview
                        </Text>
                        <ChevronRight size={14} color="#6ee7b7" />
                      </Pressable>
                    )}

                    {exam.status === "Upcoming" && (
                      <Pressable
                        onPress={handleOpenDesigner}
                        className="px-3.5 py-1.5 rounded-xl border flex-row items-center active:opacity-80"
                        style={{
                          flexShrink: 0,
                          backgroundColor: `${primaryColor}20`,
                          borderColor: `${primaryColor}40`,
                        }}
                      >
                        <Text className="font-extrabold text-xs mr-1" numberOfLines={1} style={{ color: primaryLight, flexShrink: 0, includeFontPadding: false }}>
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
              backgroundColor: cardBg,
              borderColor: cardBorder,
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

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {/* 1. Exam Name */}
              <View className="mb-3.5">
                <Text className="text-white/70 text-xs font-bold mb-1.5">Exam Name *</Text>
                <TextInput
                  value={formExamName}
                  onChangeText={setFormExamName}
                  placeholder="e.g. Mid-Term Examination 2026"
                  placeholderTextColor="#ffffff40"
                  className="bg-black/30 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                />
              </View>

              {/* 2. Target Classes (Multi-Select Dropdown) */}
              <View className="mb-3.5">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-white/70 text-xs font-bold">Target Classes * (Multi-Select)</Text>
                  <Text className="text-[10px] font-bold" style={{ color: primaryLight }}>
                    {formSelectedClasses.length} Selected
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowClassMultiPicker(true)}
                  className="bg-black/30 border border-white/15 rounded-xl px-3.5 py-2.5 flex-row items-center justify-between active:border-white/30"
                >
                  <View className="flex-1 mr-2">
                    {formSelectedClasses.length === 0 ? (
                      <Text className="text-white/40 text-xs font-semibold">Select classes...</Text>
                    ) : (
                      <Text className="text-white text-xs font-semibold" numberOfLines={1}>
                        {formSelectedClasses.join(", ")}
                      </Text>
                    )}
                  </View>
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <View
                      className="px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <Text className="text-[10px] font-black" style={{ color: primaryLight }}>
                        {formSelectedClasses.length}/{AVAILABLE_CLASSES_LIST.length}
                      </Text>
                    </View>
                    <ChevronDown size={14} color={primaryLight} />
                  </View>
                </Pressable>

                {/* Selected Class Chips Preview */}
                {formSelectedClasses.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-2"
                    contentContainerStyle={{ gap: 6 }}
                  >
                    {formSelectedClasses.map((cls) => (
                      <View
                        key={cls}
                        className="flex-row items-center px-2 py-1 rounded-lg border"
                        style={{
                          backgroundColor: `${primaryColor}15`,
                          borderColor: `${primaryColor}35`,
                        }}
                      >
                        <Text className="text-[10px] font-bold mr-1" style={{ color: primaryLight }}>
                          {cls}
                        </Text>
                        <Pressable onPress={() => toggleSelectClass(cls)} hitSlop={4}>
                          <X size={10} color={primaryLight} />
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* 3. Subjects Included (Multi-Select Dropdown) */}
              <View className="mb-3.5">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-white/70 text-xs font-bold">Subjects Included * (Multi-Select)</Text>
                  <Text className="text-[10px] font-bold" style={{ color: primaryLight }}>
                    {formSelectedSubjects.length} Selected
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowSubjectMultiPicker(true)}
                  className="bg-black/30 border border-white/15 rounded-xl px-3.5 py-2.5 flex-row items-center justify-between active:border-white/30"
                >
                  <View className="flex-1 mr-2">
                    {formSelectedSubjects.length === 0 ? (
                      <Text className="text-white/40 text-xs font-semibold">Select subjects...</Text>
                    ) : (
                      <Text className="text-white text-xs font-semibold" numberOfLines={1}>
                        {formSelectedSubjects.join(", ")}
                      </Text>
                    )}
                  </View>
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <View
                      className="px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <Text className="text-[10px] font-black" style={{ color: primaryLight }}>
                        {formSelectedSubjects.length}/{AVAILABLE_SUBJECTS_LIST.length}
                      </Text>
                    </View>
                    <ChevronDown size={14} color={primaryLight} />
                  </View>
                </Pressable>

                {/* Selected Subject Chips Preview */}
                {formSelectedSubjects.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-2"
                    contentContainerStyle={{ gap: 6 }}
                  >
                    {formSelectedSubjects.map((sub) => (
                      <View
                        key={sub}
                        className="flex-row items-center px-2 py-1 rounded-lg border"
                        style={{
                          backgroundColor: `${primaryColor}15`,
                          borderColor: `${primaryColor}35`,
                        }}
                      >
                        <Text className="text-[10px] font-bold mr-1" style={{ color: primaryLight }}>
                          {sub}
                        </Text>
                        <Pressable onPress={() => toggleSelectSubject(sub)} hitSlop={4}>
                          <X size={10} color={primaryLight} />
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* 4. Start Date (DD-MM-YYYY) with Calendar Grid View */}
              <View className="mb-3.5">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-white/70 text-xs font-bold">Start Date * (DD-MM-YYYY)</Text>
                  <Pressable
                    onPress={() => setShowCalendarGrid(true)}
                    className="px-2.5 py-1 rounded-lg flex-row items-center border active:opacity-80"
                    style={{
                      backgroundColor: `${primaryColor}20`,
                      borderColor: `${primaryColor}40`,
                    }}
                  >
                    <CalendarDays size={12} color={primaryLight} style={{ marginRight: 4 }} />
                    <Text className="text-[10px] font-black" style={{ color: primaryLight }}>
                      Calendar Grid 📅
                    </Text>
                  </Pressable>
                </View>

                <View
                  className="rounded-xl px-3 flex-row items-center border"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.35)",
                    borderColor:
                      manualDateValidation?.type === "error"
                        ? "#f87171"
                        : manualDateValidation?.type === "warning"
                        ? "#facc15"
                        : "rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <Calendar size={14} color={primaryLight} style={{ marginRight: 8 }} />
                  <TextInput
                    value={formDate}
                    onChangeText={handleDateChange}
                    placeholder="DD-MM-YYYY (e.g. 15-10-2026)"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    maxLength={10}
                    keyboardType="numeric"
                    className="flex-1 text-white text-xs font-bold py-2.5"
                  />
                  <Pressable
                    onPress={() => setShowCalendarGrid(true)}
                    className="p-1 rounded-md bg-white/10 active:bg-white/20"
                    hitSlop={6}
                  >
                    <CalendarDays size={14} color={primaryLight} />
                  </Pressable>
                </View>

                {/* Quick Date Selectors (Today / Tomorrow) */}
                <View className="flex-row items-center justify-between mt-1.5">
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Pressable
                      onPress={setTodayDate}
                      className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15"
                    >
                      <Text className="text-white/80 text-[10px] font-semibold">Today</Text>
                    </Pressable>
                    <Pressable
                      onPress={setTomorrowDate}
                      className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15"
                    >
                      <Text className="text-white/80 text-[10px] font-semibold">Tomorrow</Text>
                    </Pressable>
                  </View>

                  {/* Real-time Validation Message */}
                  {manualDateValidation && (
                    <View className="flex-row items-center flex-1 justify-end ml-2">
                      {manualDateValidation.type === "valid" && (
                        <CheckCircle2 size={11} color="#34d399" style={{ marginRight: 3 }} />
                      )}
                      {manualDateValidation.type === "warning" && (
                        <AlertCircle size={11} color="#facc15" style={{ marginRight: 3 }} />
                      )}
                      {manualDateValidation.type === "error" && (
                        <AlertCircle size={11} color="#f87171" style={{ marginRight: 3 }} />
                      )}
                      <Text
                        className="text-[10px] font-bold"
                        numberOfLines={1}
                        style={{
                          color:
                            manualDateValidation.type === "valid"
                              ? "#34d399"
                              : manualDateValidation.type === "warning"
                              ? "#facc15"
                              : "#f87171",
                        }}
                      >
                        {manualDateValidation.message}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 5. Max Marks */}
              <View className="mb-3.5">
                <Text className="text-white/70 text-xs font-bold mb-1.5">Max Marks</Text>
                <TextInput
                  value={formMaxMarks}
                  onChangeText={setFormMaxMarks}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor="#ffffff40"
                  className="bg-black/30 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                />
              </View>

              {/* 6. Status */}
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
                className="flex-1 py-3 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
              >
                <Text className="text-white text-xs font-bold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveExam}
                className="flex-1 py-3 rounded-xl items-center justify-center shadow-md active:opacity-80"
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

      {/* 1. CLASS MULTI-PICKER MODAL */}
      <Modal
        visible={showClassMultiPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClassMultiPicker(false)}
      >
        <Pressable onPress={() => setShowClassMultiPicker(false)} style={styles.modalOverlay}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.pickerModalCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-3 pb-2.5 border-b border-white/10">
              <View className="flex-row items-center">
                <Text className="text-white font-black text-sm md:text-base mr-2">
                  Select Classes
                </Text>
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${primaryColor}25` }}
                >
                  <Text className="text-[10px] font-black" style={{ color: primaryLight }}>
                    {formSelectedClasses.length} selected
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setShowClassMultiPicker(false)}>
                <X size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>

            {/* Quick Actions: Select All & Clear All */}
            <View className="flex-row items-center justify-between mb-2.5 px-0.5">
              <Pressable
                onPress={selectAllClasses}
                className="px-3 py-1.5 rounded-xl border flex-row items-center"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  borderColor: `${primaryColor}35`,
                }}
              >
                <CheckSquare size={12} color={primaryLight} style={{ marginRight: 4 }} />
                <Text className="text-[11px] font-bold" style={{ color: primaryLight }}>
                  Select All
                </Text>
              </Pressable>

              <Pressable
                onPress={clearAllClasses}
                className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 flex-row items-center"
              >
                <Square size={12} color="rgba(255, 255, 255, 0.7)" style={{ marginRight: 4 }} />
                <Text className="text-[11px] font-bold text-white/80">Clear All</Text>
              </Pressable>
            </View>

            {/* Search Box */}
            <View
              className="flex-row items-center rounded-xl px-3 py-2 mb-2.5 border"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                borderColor: "rgba(255, 255, 255, 0.12)",
              }}
            >
              <Search size={14} color={primaryLight} style={{ marginRight: 6 }} />
              <TextInput
                value={classSearchQuery}
                onChangeText={setClassSearchQuery}
                placeholder="Search classes (e.g. Class 10A)..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="flex-1 text-white text-xs py-0"
              />
              {classSearchQuery ? (
                <Pressable onPress={() => setClassSearchQuery("")}>
                  <X size={13} color="rgba(255,255,255,0.6)" />
                </Pressable>
              ) : null}
            </View>

            {/* Class Items List with Multi-Select Checkboxes */}
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {filteredClassesList.map((cls) => {
                const isSelected = formSelectedClasses.includes(cls);
                return (
                  <Pressable
                    key={cls}
                    onPress={() => toggleSelectClass(cls)}
                    className="p-3 rounded-xl mb-1.5 flex-row items-center justify-between border"
                    style={{
                      backgroundColor: isSelected
                        ? isSuperAdmin
                          ? "rgba(240, 193, 16, 0.2)"
                          : "rgba(0, 241, 161, 0.2)"
                        : "rgba(255, 255, 255, 0.05)",
                      borderColor: isSelected ? primaryColor : "rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <View className="flex-row items-center flex-1">
                      {isSelected ? (
                        <CheckSquare size={16} color={primaryLight} style={{ marginRight: 10 }} />
                      ) : (
                        <Square size={16} color="rgba(255, 255, 255, 0.4)" style={{ marginRight: 10 }} />
                      )}
                      <Text
                        className="text-xs font-bold"
                        style={{ color: isSelected ? primaryLight : "#fff" }}
                      >
                        {cls}
                      </Text>
                    </View>
                    {isSelected && (
                      <View
                        className="w-5 h-5 rounded-full items-center justify-center"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Check size={12} color="#000" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Confirm / Done Button */}
            <Pressable
              onPress={() => setShowClassMultiPicker(false)}
              className="mt-3 py-2.5 rounded-xl items-center justify-center shadow-md active:opacity-80"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-black text-xs font-black">
                Done ({formSelectedClasses.length} Selected)
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 2. SUBJECT MULTI-PICKER MODAL */}
      <Modal
        visible={showSubjectMultiPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubjectMultiPicker(false)}
      >
        <Pressable onPress={() => setShowSubjectMultiPicker(false)} style={styles.modalOverlay}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.pickerModalCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-3 pb-2.5 border-b border-white/10">
              <View className="flex-row items-center">
                <Text className="text-white font-black text-sm md:text-base mr-2">
                  Select Subjects
                </Text>
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${primaryColor}25` }}
                >
                  <Text className="text-[10px] font-black" style={{ color: primaryLight }}>
                    {formSelectedSubjects.length} selected
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setShowSubjectMultiPicker(false)}>
                <X size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>

            {/* Quick Actions: Select All & Clear All */}
            <View className="flex-row items-center justify-between mb-2.5 px-0.5">
              <Pressable
                onPress={selectAllSubjects}
                className="px-3 py-1.5 rounded-xl border flex-row items-center"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  borderColor: `${primaryColor}35`,
                }}
              >
                <CheckSquare size={12} color={primaryLight} style={{ marginRight: 4 }} />
                <Text className="text-[11px] font-bold" style={{ color: primaryLight }}>
                  Select All
                </Text>
              </Pressable>

              <Pressable
                onPress={clearAllSubjects}
                className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 flex-row items-center"
              >
                <Square size={12} color="rgba(255, 255, 255, 0.7)" style={{ marginRight: 4 }} />
                <Text className="text-[11px] font-bold text-white/80">Clear All</Text>
              </Pressable>
            </View>

            {/* Search Box */}
            <View
              className="flex-row items-center rounded-xl px-3 py-2 mb-2.5 border"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                borderColor: "rgba(255, 255, 255, 0.12)",
              }}
            >
              <Search size={14} color={primaryLight} style={{ marginRight: 6 }} />
              <TextInput
                value={subjectSearchQuery}
                onChangeText={setSubjectSearchQuery}
                placeholder="Search subject (e.g. Mathematics)..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="flex-1 text-white text-xs py-0"
              />
              {subjectSearchQuery ? (
                <Pressable onPress={() => setSubjectSearchQuery("")}>
                  <X size={13} color="rgba(255,255,255,0.6)" />
                </Pressable>
              ) : null}
            </View>

            {/* Subject Items List with Multi-Select Checkboxes */}
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {filteredSubjectsList.map((sub) => {
                const isSelected = formSelectedSubjects.includes(sub);
                return (
                  <Pressable
                    key={sub}
                    onPress={() => toggleSelectSubject(sub)}
                    className="p-3 rounded-xl mb-1.5 flex-row items-center justify-between border"
                    style={{
                      backgroundColor: isSelected
                        ? isSuperAdmin
                          ? "rgba(240, 193, 16, 0.2)"
                          : "rgba(0, 241, 161, 0.2)"
                        : "rgba(255, 255, 255, 0.05)",
                      borderColor: isSelected ? primaryColor : "rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <View className="flex-row items-center flex-1">
                      {isSelected ? (
                        <CheckSquare size={16} color={primaryLight} style={{ marginRight: 10 }} />
                      ) : (
                        <Square size={16} color="rgba(255, 255, 255, 0.4)" style={{ marginRight: 10 }} />
                      )}
                      <Text
                        className="text-xs font-bold"
                        style={{ color: isSelected ? primaryLight : "#fff" }}
                      >
                        {sub}
                      </Text>
                    </View>
                    {isSelected && (
                      <View
                        className="w-5 h-5 rounded-full items-center justify-center"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Check size={12} color="#000" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Confirm / Done Button */}
            <Pressable
              onPress={() => setShowSubjectMultiPicker(false)}
              className="mt-3 py-2.5 rounded-xl items-center justify-center shadow-md active:opacity-80"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-black text-xs font-black">
                Done ({formSelectedSubjects.length} Selected)
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 3. CALENDAR GRID PICKER MODAL (DD-MM-YYYY FORMAT & DISABLES SUNDAYS/HOLIDAYS) */}
      <Modal
        visible={showCalendarGrid}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarGrid(false)}
      >
        <Pressable onPress={() => setShowCalendarGrid(false)} style={styles.modalOverlay}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.calendarModalCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            {/* Calendar Header with Month/Year Navigation */}
            <View className="flex-row items-center justify-between mb-3 pb-2.5 border-b border-white/10">
              <Pressable
                onPress={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear((y) => y - 1);
                  } else {
                    setCalendarMonth((m) => m - 1);
                  }
                }}
                className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={16} color={primaryLight} />
              </Pressable>

              <View className="items-center">
                <Text className="text-white font-extrabold text-sm md:text-base">
                  {MONTH_NAMES[calendarMonth]} {calendarYear}
                </Text>
                <Text className="text-white/50 text-[10px] font-semibold mt-0.5">
                  Select Examination Start Date
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear((y) => y + 1);
                  } else {
                    setCalendarMonth((m) => m + 1);
                  }
                }}
                className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronRight size={16} color={primaryLight} />
              </Pressable>
            </View>

            {/* Weekdays Row */}
            <View className="flex-row justify-between mb-2 px-1">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, idx) => (
                <View key={day} className="w-[13.5%] items-center justify-center">
                  <Text
                    className="text-[11px] font-black"
                    style={{ color: idx === 0 ? "#f87171" : "rgba(255, 255, 255, 0.55)" }}
                  >
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Days Grid */}
            <View className="flex-row flex-wrap px-0.5">
              {(() => {
                const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
                const cells: React.ReactNode[] = [];

                // Empty offset cells
                for (let i = 0; i < firstDayOfWeek; i++) {
                  cells.push(<View key={`empty-${i}`} className="w-[14.28%] h-11" />);
                }

                const selectedYMD = formatToYYYYMMDD(formDate);

                for (let day = 1; day <= daysInMonth; day++) {
                  const dayStr = String(day).padStart(2, "0");
                  const monthStr = String(calendarMonth + 1).padStart(2, "0");
                  const dateYMD = `${calendarYear}-${monthStr}-${dayStr}`;
                  const dateDDMMYYYY = `${dayStr}-${monthStr}-${calendarYear}`;
                  const dateObj = new Date(dateYMD + "T00:00:00");
                  const isSunday = dateObj.getDay() === 0;

                  const holCheck = isHolidayDate(dateYMD, holidaysList);
                  const isHoliday = holCheck.isHoliday;
                  const holidayName = holCheck.holidayName;

                  const isSelected = selectedYMD === dateYMD;
                  const isDisabled = isSunday || isHoliday;

                  cells.push(
                    <View key={`day-${day}`} className="w-[14.28%] p-0.5 h-11 items-center justify-center">
                      <Pressable
                        disabled={isDisabled}
                        onPress={() => {
                          if (isDisabled) return;
                          setFormDate(dateDDMMYYYY);
                          setShowCalendarGrid(false);
                          showToast(`Start date set to ${dateDDMMYYYY}`);
                        }}
                        className="w-full h-full rounded-xl items-center justify-center relative overflow-hidden"
                        style={{
                          backgroundColor: isSelected
                            ? primaryColor
                            : isHoliday
                            ? "rgba(239, 68, 68, 0.18)"
                            : isSunday
                            ? "rgba(239, 68, 68, 0.08)"
                            : "rgba(255, 255, 255, 0.06)",
                          borderWidth: isSelected ? 1.5 : isHoliday ? 1 : 1,
                          borderColor: isSelected
                            ? "#fff"
                            : isHoliday
                            ? "rgba(239, 68, 68, 0.4)"
                            : "rgba(255, 255, 255, 0.08)",
                        }}
                      >
                        <Text
                          className="text-xs font-black"
                          style={{
                            color: isSelected
                              ? "#000"
                              : isHoliday
                              ? "#f87171"
                              : isSunday
                              ? "#f87171"
                              : "#fff",
                          }}
                        >
                          {day}
                        </Text>
                        {isHoliday && (
                          <Text
                            className="text-[6.5px] font-black leading-none text-rose-400"
                            numberOfLines={1}
                          >
                            {(holidayName || "Off").slice(0, 4)}
                          </Text>
                        )}
                        {isSunday && (
                          <Text className="text-[6px] font-black leading-none text-rose-400">
                            Sun
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  );
                }

                return cells;
              })()}
            </View>

            {/* Legend / Guidance */}
            <View className="mt-3 pt-2.5 border-t border-white/10" style={{ gap: 4 }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-rose-500 mr-1.5" />
                  <Text className="text-white/60 text-[10px] font-semibold">
                    Sundays & Holidays (Disabled)
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: primaryColor }} />
                  <Text className="text-white/60 text-[10px] font-semibold">Available Dates</Text>
                </View>
              </View>
            </View>

            {/* Close Button */}
            <Pressable
              onPress={() => setShowCalendarGrid(false)}
              className="mt-3 py-2.5 rounded-xl bg-white/10 items-center justify-center active:bg-white/20"
            >
              <Text className="text-white text-xs font-bold">Close Calendar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* CUSTOM LUXURY WARNING / VALIDATION MODAL */}
      {warningModal && (
        <Modal
          visible={warningModal.visible}
          transparent
          animationType="fade"
          onRequestClose={() => setWarningModal(null)}
        >
          <Pressable
            onPress={() => setWarningModal(null)}
            style={styles.modalOverlay}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="w-full max-w-sm border rounded-3xl p-5 shadow-2xl items-center"
              style={{
                backgroundColor: cardBg,
                borderColor:
                  warningModal.type === "error"
                    ? "rgba(239, 68, 68, 0.45)"
                    : warningModal.type === "warning"
                    ? "rgba(245, 158, 11, 0.45)"
                    : `${primaryColor}45`,
              }}
            >
              {/* Glowing Top Icon Badge */}
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center mb-3 border shadow-md"
                style={{
                  backgroundColor:
                    warningModal.type === "error"
                      ? "rgba(239, 68, 68, 0.2)"
                      : warningModal.type === "warning"
                      ? "rgba(245, 158, 11, 0.2)"
                      : `${primaryColor}20`,
                  borderColor:
                    warningModal.type === "error"
                      ? "rgba(239, 68, 68, 0.45)"
                      : warningModal.type === "warning"
                      ? "rgba(245, 158, 11, 0.45)"
                      : `${primaryColor}45`,
                }}
              >
                {warningModal.type === "error" ? (
                  <AlertCircle size={28} color="#f87171" />
                ) : warningModal.type === "warning" ? (
                  <AlertTriangle size={28} color="#facc15" />
                ) : (
                  <AlertCircle size={28} color={primaryLight} />
                )}
              </View>

              <Text className="text-white text-base md:text-lg font-black text-center mb-1.5">
                {warningModal.title}
              </Text>

              <Text className="text-white/70 text-xs text-center leading-relaxed mb-4 px-2">
                {warningModal.message}
              </Text>

              <Pressable
                onPress={() => setWarningModal(null)}
                className="w-full py-3 rounded-xl items-center justify-center shadow-lg active:opacity-90"
                style={{
                  backgroundColor:
                    warningModal.type === "error"
                      ? "#ef4444"
                      : warningModal.type === "warning"
                      ? "#f59e0b"
                      : primaryColor,
                }}
              >
                <Text
                  className="text-xs font-black"
                  style={{
                    color: warningModal.type === "error" ? "#fff" : "#000",
                  }}
                >
                  Understood
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* SINGLE DELETE CONFIRMATION MODAL */}
      <Modal
        visible={!!deletingExam}
        transparent
        animationType="fade"
        onRequestClose={() => setDeletingExam(null)}
      >
        <Pressable
          onPress={() => setDeletingExam(null)}
          style={styles.modalOverlay}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-sm border rounded-3xl p-5 shadow-2xl"
              style={{
                backgroundColor: cardBg,
                borderColor: "rgba(239, 68, 68, 0.45)",
              }}
          >
            <View className="w-13 h-13 rounded-2xl bg-rose-500/20 border border-rose-500/40 items-center justify-center self-center mb-3">
              <Trash2 size={24} color="#f87171" />
            </View>

            <View className="items-center mb-1">
              <View className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 mb-1.5 flex-row items-center">
                <AlertTriangle size={11} color="#f87171" style={{ marginRight: 4 }} />
                <Text className="text-[10px] font-black text-rose-400 uppercase tracking-wider">
                  Irreversible Action
                </Text>
              </View>
              <Text className="text-white text-lg font-black text-center">Delete Examination?</Text>
            </View>

            <Text className="text-white/60 text-xs text-center mb-4 leading-relaxed px-1">
              Are you sure you want to permanently delete <Text className="text-white font-bold">"{deletingExam?.name}"</Text>? All timetable schedules and student marks records for this exam will be removed.
            </Text>

            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Pressable
                onPress={() => setDeletingExam(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
              >
                <Text className="text-white text-xs font-bold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 items-center justify-center shadow-md active:opacity-90"
              >
                <Text className="text-white text-xs font-black">Delete Exam</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* BULK DELETE CONFIRMATION MODAL */}
      <Modal
        visible={showBulkDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBulkDeleteConfirm(false)}
      >
        <Pressable
          onPress={() => setShowBulkDeleteConfirm(false)}
          style={styles.modalOverlay}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-sm border rounded-3xl p-5 shadow-2xl"
              style={{
                backgroundColor: cardBg,
                borderColor: "rgba(239, 68, 68, 0.45)",
              }}
          >
            <View className="w-13 h-13 rounded-2xl bg-rose-500/20 border border-rose-500/40 items-center justify-center self-center mb-3">
              <Trash2 size={24} color="#f87171" />
            </View>

            <View className="items-center mb-1">
              <View className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 mb-1.5 flex-row items-center">
                <AlertTriangle size={11} color="#f87171" style={{ marginRight: 4 }} />
                <Text className="text-[10px] font-black text-rose-400 uppercase tracking-wider">
                  Bulk Deletion
                </Text>
              </View>
              <Text className="text-white text-lg font-black text-center">
                Delete {selectedCount} Examinations?
              </Text>
            </View>

            <Text className="text-white/60 text-xs text-center mb-4 leading-relaxed px-1">
              Are you sure you want to delete all selected {selectedCount} examinations simultaneously? This action cannot be reverted.
            </Text>

            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Pressable
                onPress={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
              >
                <Text className="text-white text-xs font-bold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleBulkDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 items-center justify-center shadow-md active:opacity-90"
              >
                <Text className="text-white text-xs font-black">Delete All</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  pickerModalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  calendarModalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
});

export default AdminExamScheduleListScreen;

