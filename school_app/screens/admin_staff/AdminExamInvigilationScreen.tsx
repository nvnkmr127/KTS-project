import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building,
  UserCheck,
  ShieldCheck,
  Plus,
  Trash2,
  Pencil,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Search,
  Users,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Info,
  BookOpen,
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
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface InvigilationDutyItem {
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
  status: "Assigned" | "Checked In" | "Pending";
}

const DEFAULT_INVIGILATIONS: InvigilationDutyItem[] = [
  {
    id: "inv-1",
    examId: "3",
    examName: "Mid-Term Examination 2026",
    class: "Class 10A",
    subject: "Mathematics",
    date: "15-10-2026",
    timeSlot: "09:30 AM - 12:30 PM",
    room: "Room 12 (North Wing)",
    staffId: "stf_1",
    staffName: "P. R. Sharma",
    staffEmail: "pr.sharma@school.edu",
    status: "Assigned",
  },
  {
    id: "inv-2",
    examId: "3",
    examName: "Mid-Term Examination 2026",
    class: "Class 10B",
    subject: "Physics",
    date: "17-10-2026",
    timeSlot: "09:30 AM - 12:30 PM",
    room: "Science Hall 2",
    staffId: "stf_2",
    staffName: "K. L. Rao",
    staffEmail: "kl.rao@school.edu",
    status: "Assigned",
  },
  {
    id: "inv-3",
    examId: "3",
    examName: "Mid-Term Examination 2026",
    class: "Class 9A",
    subject: "Chemistry",
    date: "19-10-2026",
    timeSlot: "09:30 AM - 12:30 PM",
    room: "Chemistry Lab A",
    staffId: "stf_3",
    staffName: "S. V. Reddy",
    staffEmail: "sv.reddy@school.edu",
    status: "Checked In",
  },
  {
    id: "inv-4",
    examId: "3",
    examName: "Mid-Term Examination 2026",
    class: "Class 8A",
    subject: "English Literature",
    date: "21-10-2026",
    timeSlot: "09:30 AM - 12:30 PM",
    room: "Room 10",
    staffId: "stf_4",
    staffName: "V. Anuradha",
    staffEmail: "v.anuradha@school.edu",
    status: "Assigned",
  },
  {
    id: "inv-5",
    examId: "4",
    examName: "Quarterly Assessment 2026",
    class: "Class 10A",
    subject: "Mathematics",
    date: "20-11-2026",
    timeSlot: "10:00 AM - 01:00 PM",
    room: "Room 12",
    staffId: "stf_1",
    staffName: "P. R. Sharma",
    staffEmail: "pr.sharma@school.edu",
    status: "Assigned",
  },
];

const TEACHING_FACULTY = [
  { id: "stf_1", name: "P. R. Sharma", role: "Sr. Mathematics Teacher", email: "pr.sharma@school.edu" },
  { id: "stf_2", name: "K. L. Rao", role: "Physics Lecturer", email: "kl.rao@school.edu" },
  { id: "stf_3", name: "S. V. Reddy", role: "Chemistry Faculty", email: "sv.reddy@school.edu" },
  { id: "stf_4", name: "V. Anuradha", role: "English Teacher", email: "v.anuradha@school.edu" },
  { id: "stf_5", name: "M. G. Krishna", role: "Social Studies Teacher", email: "mg.krishna@school.edu" },
  { id: "stf_6", name: "B. Laxmi", role: "Biology Lecturer", email: "b.laxmi@school.edu" },
  { id: "stf_7", name: "R. Srinivas", role: "Telugu Faculty", email: "r.srinivas@school.edu" },
  { id: "stf_8", name: "K. Mahesh", role: "Computer Instructor", email: "k.mahesh@school.edu" },
];

const AVAILABLE_EXAMS = [
  { id: "3", name: "Mid-Term Examination 2026", status: "Upcoming", startDate: "2026-10-15" },
  { id: "4", name: "Quarterly Assessment 2026", status: "Upcoming", startDate: "2026-11-20" },
];

const AVAILABLE_CLASSES = ["Class 10A", "Class 10B", "Class 9A", "Class 9B", "Class 8A", "Class 7A", "Class 6A"];

const ALL_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "General Science",
  "Social Studies",
  "Telugu",
  "Hindi",
  "English",
  "English Literature",
  "Computer Science",
  "EVS",
  "GK",
  "All Subjects",
];

const TIME_PRESETS = [
  { label: "09:30 AM - 12:30 PM (3 hrs)", start: "09:30", startP: "AM", end: "12:30", endP: "PM" },
  { label: "10:00 AM - 01:00 PM (3 hrs)", start: "10:00", startP: "AM", end: "01:00", endP: "PM" },
  { label: "02:00 PM - 05:00 PM (3 hrs)", start: "02:00", startP: "PM", end: "05:00", endP: "PM" },
  { label: "10:00 AM - 11:30 AM (1.5 hrs)", start: "10:00", startP: "AM", end: "11:30", endP: "AM" },
  { label: "02:00 PM - 03:30 PM (1.5 hrs)", start: "02:00", startP: "PM", end: "03:30", endP: "PM" },
  { label: "09:30 AM - 10:30 AM (1 hr)", start: "09:30", startP: "AM", end: "10:30", endP: "AM" },
];

export const AdminExamInvigilationScreen: React.FC<{ navigation: any; route?: any }> = ({
  navigation,
  route,
}) => {
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

  const [duties, setDuties] = useState<InvigilationDutyItem[]>(DEFAULT_INVIGILATIONS);
  const [selectedExamId, setSelectedExamId] = useState<string>("3");
  const [searchFaculty, setSearchFaculty] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Allot / Edit Duty Modal State
  const [showDutyModal, setShowDutyModal] = useState(false);
  const [editingDutyId, setEditingDutyId] = useState<string | null>(null);
  const [formExamId, setFormExamId] = useState("3");
  const [formClass, setFormClass] = useState("Class 10A");
  const [formSubject, setFormSubject] = useState("Mathematics");
  const [formDate, setFormDate] = useState("15-10-2026");
  const [formRoom, setFormRoom] = useState("Room 12 (North Wing)");
  const [selectedStaffId, setSelectedStaffId] = useState("stf_1");
  const [formStatus, setFormStatus] = useState<InvigilationDutyItem["status"]>("Assigned");

  // Calendar Grid Modal State
  const [showCalendarGrid, setShowCalendarGrid] = useState(false);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [holidaysList, setHolidaysList] = useState<any[]>(ACADEMIC_HOLIDAYS);

  // Time Slot State (Manual Digits + AM/PM Dropdowns)
  const [formStartTime, setFormStartTime] = useState("09:30");
  const [formStartPeriod, setFormStartPeriod] = useState<"AM" | "PM">("AM");
  const [formEndTime, setFormEndTime] = useState("12:30");
  const [formEndPeriod, setFormEndPeriod] = useState<"AM" | "PM">("PM");

  // Dropdown Picker Modals
  const [showFacultyPicker, setShowFacultyPicker] = useState(false);
  const [facultySearchQuery, setFacultySearchQuery] = useState("");
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [showStartPeriodPicker, setShowStartPeriodPicker] = useState(false);
  const [showEndPeriodPicker, setShowEndPeriodPicker] = useState(false);

  // Delete Modal State
  const [deletingDuty, setDeletingDuty] = useState<InvigilationDutyItem | null>(null);

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

  // Fetch holidays from API on mount
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

  // Time auto-formatting helper for HH:MM
  const handleTimeChange = (text: string, setter: (val: string) => void, prevVal: string) => {
    if (text.length < prevVal.length) {
      setter(text);
      return;
    }
    const digits = text.replace(/[^0-9]/g, "");
    let res = digits;
    if (digits.length > 2) {
      res = `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
    }
    setter(res);
  };

  // Quick Date Helpers
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

  // Real-time manual date validation & guidance
  const manualDateValidation = useMemo(() => {
    if (!formDate || formDate.length < 10) return null;
    const ymd = formatToYYYYMMDD(formDate);
    const dObj = new Date(ymd + "T00:00:00");
    if (isNaN(dObj.getTime())) return { type: "error", message: "Invalid date format (Use DD-MM-YYYY)" };

    const currentFormExam = AVAILABLE_EXAMS.find((e) => e.id === formExamId) || AVAILABLE_EXAMS[0];
    const examMinDateYMD = currentFormExam?.startDate ? formatToYYYYMMDD(currentFormExam.startDate) : "";
    if (examMinDateYMD && ymd < examMinDateYMD) {
      return {
        type: "warning",
        message: `Date is prior to exam start date (${formatToDDMMYYYY(examMinDateYMD)})`,
      };
    }
    if (dObj.getDay() === 0) {
      return { type: "warning", message: "Selected date is a Sunday (School closed)" };
    }
    const hol = isHolidayDate(ymd, holidaysList);
    if (hol.isHoliday) {
      return { type: "warning", message: `Selected date is a holiday (${hol.holidayName})` };
    }
    return { type: "valid", message: "Valid exam date" };
  }, [formDate, formExamId, holidaysList]);

  // Sync route params
  useEffect(() => {
    if (route?.params?.examId) {
      setSelectedExamId(String(route.params.examId));
    }
  }, [route?.params?.examId]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("ExamSchedule");
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const topTabs = [
    { id: "AdminExamSchedule", label: "Exam Schedule" },
    { id: "AdminExamResults", label: "Results & Rankings" },
    { id: "AdminMarksPreview", label: "Marks Preview" },
    { id: "AdminExamScheduleDesigner", label: "Schedule Designer" },
    { id: "AdminExamInvigilation", label: "Allot Invigilation", active: true },
  ];

  const currentExam = useMemo(() => {
    return AVAILABLE_EXAMS.find((e) => e.id === selectedExamId) || AVAILABLE_EXAMS[0];
  }, [selectedExamId]);

  const filteredDuties = useMemo(() => {
    let list = duties.filter((d) => d.examId === selectedExamId);
    if (searchFaculty.trim()) {
      const q = searchFaculty.toLowerCase();
      list = list.filter(
        (d) =>
          d.staffName.toLowerCase().includes(q) ||
          d.subject.toLowerCase().includes(q) ||
          d.room.toLowerCase().includes(q) ||
          d.class.toLowerCase().includes(q)
      );
    }
    return list;
  }, [duties, selectedExamId, searchFaculty]);

  const totalAssignedCount = useMemo(() => filteredDuties.length, [filteredDuties]);
  const distinctFacultyCount = useMemo(() => {
    const ids = new Set(filteredDuties.map((d) => d.staffId));
    return ids.size;
  }, [filteredDuties]);

  const activeStaff = useMemo(() => {
    return TEACHING_FACULTY.find((f) => f.id === selectedStaffId) || TEACHING_FACULTY[0];
  }, [selectedStaffId]);

  const filteredFacultyList = useMemo(() => {
    if (!facultySearchQuery.trim()) return TEACHING_FACULTY;
    const q = facultySearchQuery.toLowerCase();
    return TEACHING_FACULTY.filter((f) => f.name.toLowerCase().includes(q) || f.role.toLowerCase().includes(q));
  }, [facultySearchQuery]);

  const filteredSubjectsList = useMemo(() => {
    if (!subjectSearchQuery.trim()) return ALL_SUBJECTS;
    const q = subjectSearchQuery.toLowerCase();
    return ALL_SUBJECTS.filter((s) => s.toLowerCase().includes(q));
  }, [subjectSearchQuery]);

  const openAddModal = () => {
    setEditingDutyId(null);
    setFormExamId(selectedExamId);
    setFormClass("Class 10A");
    setFormSubject("Mathematics");
    setFormDate(formatToDDMMYYYY(new Date().toISOString().slice(0, 10)) || "15-10-2026");
    setFormStartTime("09:30");
    setFormStartPeriod("AM");
    setFormEndTime("12:30");
    setFormEndPeriod("PM");
    setFormRoom("Room 12 (North Wing)");
    setSelectedStaffId(TEACHING_FACULTY[0].id);
    setFormStatus("Assigned");
    setShowDutyModal(true);
  };

  const openEditModal = (duty: InvigilationDutyItem) => {
    setEditingDutyId(duty.id);
    setFormExamId(duty.examId);
    setFormClass(duty.class);
    setFormSubject(duty.subject);
    setFormDate(formatToDDMMYYYY(duty.date));

    // Parse timeSlot: "09:30 AM - 12:30 PM"
    const match = duty.timeSlot.match(/^(\d{1,2}:\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)/i);
    if (match) {
      setFormStartTime(match[1]);
      setFormStartPeriod(match[2].toUpperCase() as "AM" | "PM");
      setFormEndTime(match[3]);
      setFormEndPeriod(match[4].toUpperCase() as "AM" | "PM");
    } else {
      setFormStartTime("09:30");
      setFormStartPeriod("AM");
      setFormEndTime("12:30");
      setFormEndPeriod("PM");
    }

    setFormRoom(duty.room);
    setSelectedStaffId(duty.staffId);
    setFormStatus(duty.status);
    setShowDutyModal(true);
  };

  const handleApplyPreset = (preset: typeof TIME_PRESETS[0]) => {
    setFormStartTime(preset.start);
    setFormStartPeriod(preset.startP as "AM" | "PM");
    setFormEndTime(preset.end);
    setFormEndPeriod(preset.endP as "AM" | "PM");
    setShowPresetPicker(false);
  };

  const handleSaveDuty = () => {
    if (!formSubject.trim()) {
      showWarning(
        "Subject Required",
        "Please select or provide a valid examination subject name.",
        "warning"
      );
      return;
    }

    const assignedStaff = TEACHING_FACULTY.find((f) => f.id === selectedStaffId) || TEACHING_FACULTY[0];
    const examObj = AVAILABLE_EXAMS.find((e) => e.id === formExamId) || currentExam;
    const computedTimeSlot = `${formStartTime.trim() || "09:30"} ${formStartPeriod} - ${formEndTime.trim() || "12:30"} ${formEndPeriod}`;
    const formattedDate = formatToDDMMYYYY(formDate) || "15-10-2026";

    if (editingDutyId) {
      setDuties((prev) =>
        prev.map((d) =>
          d.id === editingDutyId
            ? {
                ...d,
                examId: formExamId,
                examName: examObj.name,
                class: formClass,
                subject: formSubject.trim(),
                date: formattedDate,
                timeSlot: computedTimeSlot,
                room: formRoom.trim() || "Room 12",
                staffId: assignedStaff.id,
                staffName: assignedStaff.name,
                staffEmail: assignedStaff.email,
                status: formStatus,
              }
            : d
        )
      );
      showToast("Invigilation duty updated!");
    } else {
      const newDuty: InvigilationDutyItem = {
        id: `inv_${Date.now()}`,
        examId: formExamId,
        examName: examObj.name,
        class: formClass,
        subject: formSubject.trim(),
        date: formattedDate,
        timeSlot: computedTimeSlot,
        room: formRoom.trim() || "Room 12",
        staffId: assignedStaff.id,
        staffName: assignedStaff.name,
        staffEmail: assignedStaff.email,
        status: formStatus,
      };
      setDuties((prev) => [...prev, newDuty]);
      showToast(`Duty allotted to ${assignedStaff.name}!`);
    }
    setShowDutyModal(false);
  };

  const handleDeleteDutyConfirm = () => {
    if (deletingDuty) {
      setDuties((prev) => prev.filter((d) => d.id !== deletingDuty.id));
      showToast(`Duty assignment removed.`);
      setDeletingDuty(null);
    }
  };

  const handleExport = async () => {
    showToast("Duty roster exported successfully!");
    try {
      await Share.share({
        title: `${currentExam.name} - Invigilation Roster`,
        message:
          `KTS Model High School - Invigilation Roster\nExam: ${currentExam.name}\n\n` +
          filteredDuties
            .map(
              (d) =>
                `• ${d.staffName} (${d.class} - ${d.subject})\n  Room: ${d.room} | Date: ${d.date}\n  Timing: ${d.timeSlot}`
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
                onPress={() => navigation.navigate("ExamSchedule")}
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center mr-3 active:bg-white/20"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color={primaryLight} />
              </Pressable>
              <View className="flex-1 justify-center">
                <Text className="text-white text-base md:text-xl font-extrabold" numberOfLines={1} style={{ includeFontPadding: false }}>
                  Allot Invigilation
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
                    {currentExam.name}
                  </Text>
                </View>
              </View>
            </View>

            {/* Top Actions: Allot Duty & Export */}
            <View className="flex-row items-center" style={{ gap: 6, flexShrink: 0, flexWrap: "nowrap" }}>
              <Pressable
                onPress={openAddModal}
                className="px-3 py-1.5 rounded-xl flex-row items-center shadow-md active:opacity-80"
                style={{ backgroundColor: primaryColor, flexShrink: 0, flexWrap: "nowrap" }}
              >
                <Plus size={14} color="#000" style={{ marginRight: 4, flexShrink: 0 }} />
                <Text
                  className="text-black text-xs font-black"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  style={{ flexShrink: 0, includeFontPadding: false }}
                >
                  Allot Duty
                </Text>
              </Pressable>

              <Pressable
                onPress={handleExport}
                className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
                style={{ flexShrink: 0 }}
              >
                <Download size={14} color={primaryLight} />
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
        {/* KPI METRICS */}
        <View className="flex-row mb-4" style={{ gap: 10 }}>
          <View
            className="flex-1 border rounded-2xl p-3.5 shadow-md"
            style={{
              backgroundColor: isSuperAdmin ? "rgba(26, 30, 31, 0.95)" : "rgba(16, 45, 38, 0.95)",
              borderColor: isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)",
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
                Assigned Duties
              </Text>
              <View className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 items-center justify-center" style={{ flexShrink: 0 }}>
                <ShieldCheck size={16} color="#ddb7ff" />
              </View>
            </View>
            <Text className="text-white text-2xl font-black" numberOfLines={1} style={{ includeFontPadding: false }}>
              {totalAssignedCount}
            </Text>
            <Text className="text-white/40 text-[10px] font-medium mt-0.5" numberOfLines={1} style={{ includeFontPadding: false }}>
              Exam Hall Duties
            </Text>
          </View>

          <View
            className="flex-1 border rounded-2xl p-3.5 shadow-md"
            style={{
              backgroundColor: isSuperAdmin ? "rgba(26, 30, 31, 0.95)" : "rgba(16, 45, 38, 0.95)",
              borderColor: isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)",
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
                Faculty Allotted
              </Text>
              <View className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center" style={{ flexShrink: 0 }}>
                <Users size={16} color="#34d399" />
              </View>
            </View>
            <Text className="text-white text-2xl font-black" numberOfLines={1} style={{ includeFontPadding: false }}>
              {distinctFacultyCount}
            </Text>
            <Text className="text-white/40 text-[10px] font-medium mt-0.5" numberOfLines={1} style={{ includeFontPadding: false }}>
              Teachers Active
            </Text>
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

        {/* EXAM SELECTOR PILLS (ONLY UPCOMING EXAMS) */}
        <View className="mb-3">
          <Text className="text-white/60 text-xs font-bold mb-2 uppercase tracking-wider" numberOfLines={1} style={{ includeFontPadding: false }}>
            Select Examination (Upcoming Only)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {AVAILABLE_EXAMS.map((ex) => (
              <Pressable
                key={ex.id}
                onPress={() => setSelectedExamId(ex.id)}
                className="px-3.5 py-2 rounded-xl border"
                style={{
                  flexShrink: 0,
                  backgroundColor: selectedExamId === ex.id ? `${primaryColor}25` : "rgba(255, 255, 255, 0.05)",
                  borderColor: selectedExamId === ex.id ? primaryColor : "rgba(255, 255, 255, 0.12)",
                }}
              >
                <Text
                  className="text-xs font-black"
                  numberOfLines={1}
                  style={{ color: selectedExamId === ex.id ? primaryLight : "#fff", flexShrink: 0, includeFontPadding: false }}
                >
                  {ex.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* SEARCH & QUICK ALLOT DUTY BAR */}
        <View className="flex-row items-center mb-4" style={{ gap: 8 }}>
          <View
            className="flex-1 flex-row items-center border rounded-2xl px-3.5 py-2.5"
            style={{
              backgroundColor: isSuperAdmin ? "rgba(26, 30, 31, 0.9)" : "rgba(16, 45, 38, 0.9)",
              borderColor: isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)",
            }}
          >
            <Search size={16} color={primaryLight} style={{ marginRight: 8, flexShrink: 0 }} />
            <TextInput
              placeholder="Search faculty or room..."
              placeholderTextColor="#ffffff50"
              value={searchFaculty}
              onChangeText={setSearchFaculty}
              className="flex-1 text-white text-xs font-semibold py-0"
              style={{ includeFontPadding: false }}
            />
            {searchFaculty ? (
              <Pressable onPress={() => setSearchFaculty("")} style={{ flexShrink: 0 }}>
                <X size={15} color="#ffffff70" />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={openAddModal}
            className="px-3.5 py-2.5 rounded-2xl flex-row items-center shadow-md active:opacity-80"
            style={{
              backgroundColor: primaryColor,
              flexShrink: 0,
              flexWrap: "nowrap",
            }}
          >
            <Plus size={14} color="#000000" style={{ marginRight: 4, flexShrink: 0 }} />
            <Text
              className="text-xs font-black text-black"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={{ flexShrink: 0, includeFontPadding: false }}
            >
              Allot Duty
            </Text>
          </Pressable>
        </View>

        {/* LIST OF DUTY ALLOTMENTS */}
        <View style={{ gap: 12 }}>
          {filteredDuties.length === 0 ? (
            <View
              className="border rounded-2xl p-8 items-center justify-center my-4"
              style={{
                backgroundColor: isSuperAdmin ? "rgba(26, 30, 31, 0.9)" : "rgba(16, 45, 38, 0.9)",
                borderColor: isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)",
              }}
            >
              <UserCheck size={32} color={primaryLight} style={{ marginBottom: 8, opacity: 0.8 }} />
              <Text className="text-white text-base font-bold" style={{ includeFontPadding: false }}>No Invigilation Duties Allotted</Text>
              <Text className="text-white/50 text-xs text-center mt-1 mb-4" style={{ includeFontPadding: false }}>
                No faculty members assigned to {currentExam.name} yet.
              </Text>
              <Pressable
                onPress={openAddModal}
                className="px-4 py-2.5 rounded-xl flex-row items-center"
                style={{ backgroundColor: primaryColor, flexShrink: 0 }}
              >
                <Plus size={15} color="#000" style={{ marginRight: 6 }} />
                <Text className="text-black text-xs font-black" numberOfLines={1} style={{ includeFontPadding: false }}>Allot First Duty</Text>
              </Pressable>
            </View>
          ) : (
            filteredDuties.map((duty) => (
              <View
                key={duty.id}
                className="border rounded-2xl p-4 shadow-xl relative overflow-hidden"
                style={{
                  backgroundColor: isSuperAdmin ? "rgba(26, 30, 31, 0.95)" : "rgba(16, 45, 38, 0.95)",
                  borderColor: isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)",
                }}
              >
                {/* Faculty Card Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className="w-11 h-11 rounded-full items-center justify-center mr-3 border"
                      style={{
                        flexShrink: 0,
                        backgroundColor: `${primaryColor}20`,
                        borderColor: `${primaryColor}40`,
                      }}
                    >
                      <Text className="font-black text-base" style={{ color: primaryLight, includeFontPadding: false }}>
                        {duty.staffName ? duty.staffName[0] : "T"}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center" style={{ gap: 6, marginBottom: 2, flexWrap: "nowrap" }}>
                        <Text
                          className="text-white text-base font-black flex-1 mr-1"
                          numberOfLines={1}
                          style={{ includeFontPadding: false }}
                        >
                          {duty.staffName}
                        </Text>
                        <View
                          className="px-2 py-0.5 rounded-md border"
                          style={{
                            flexShrink: 0,
                            backgroundColor:
                              duty.status === "Checked In"
                                ? "rgba(16, 185, 129, 0.2)"
                                : duty.status === "Assigned"
                                ? "rgba(59, 130, 246, 0.2)"
                                : "rgba(245, 158, 11, 0.2)",
                            borderColor:
                              duty.status === "Checked In"
                                ? "rgba(16, 185, 129, 0.4)"
                                : duty.status === "Assigned"
                                ? "rgba(59, 130, 246, 0.4)"
                                : "rgba(245, 158, 11, 0.4)",
                          }}
                        >
                          <Text
                            className="text-[10px] font-black"
                            numberOfLines={1}
                            style={{
                              flexShrink: 0,
                              includeFontPadding: false,
                              color:
                                duty.status === "Checked In"
                                  ? "#34d399"
                                  : duty.status === "Assigned"
                                  ? "#60a5fa"
                                  : "#fbbf24",
                            }}
                          >
                            {duty.status}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-white/50 text-xs font-semibold" numberOfLines={1} style={{ includeFontPadding: false }}>
                        {duty.class} • {duty.subject}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row items-center" style={{ gap: 6, flexShrink: 0 }}>
                    <Pressable
                      onPress={() => openEditModal(duty)}
                      className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
                      style={{ flexShrink: 0 }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Pencil size={14} color={primaryLight} />
                    </Pressable>
                    <Pressable
                      onPress={() => setDeletingDuty(duty)}
                      className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 items-center justify-center active:bg-rose-500/25"
                      style={{ flexShrink: 0 }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={14} color="#f87171" />
                    </Pressable>
                  </View>
                </View>

                {/* Structured Duty Details Strip */}
                <View
                  className="rounded-xl p-3"
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.35)", gap: 6 }}
                >
                  <View className="flex-row items-center justify-between" style={{ flexWrap: "nowrap" }}>
                    <View className="flex-row items-center flex-1 mr-2" style={{ flexWrap: "nowrap" }}>
                      <Calendar size={13} color={primaryLight} style={{ marginRight: 5, flexShrink: 0 }} />
                      <Text className="text-white text-xs font-bold" numberOfLines={1} style={{ includeFontPadding: false }}>
                        {formatToDDMMYYYY(duty.date)}
                      </Text>
                    </View>

                    <View className="flex-row items-center" style={{ flexShrink: 0, flexWrap: "nowrap" }}>
                      <Clock size={13} color="#38bdf8" style={{ marginRight: 5, flexShrink: 0 }} />
                      <Text className="text-white text-xs font-bold" numberOfLines={1} style={{ flexShrink: 0, includeFontPadding: false }}>
                        {duty.timeSlot}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center pt-1 border-t border-white/5" style={{ flexWrap: "nowrap" }}>
                    <Building size={13} color="#facc15" style={{ marginRight: 5, flexShrink: 0 }} />
                    <Text className="text-white/80 text-xs font-bold flex-1" numberOfLines={1} style={{ includeFontPadding: false }}>
                      Room: <Text className="text-white font-extrabold">{duty.room}</Text>
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ========================================================= */}
      {/* ALLOT / EDIT DUTY POP-UP MODAL (Enhanced UX) */}
      {/* ========================================================= */}
      <Modal
        visible={showDutyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDutyModal(false)}
      >
        <Pressable
          onPress={() => setShowDutyModal(false)}
          style={styles.modalOverlay}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.dutyModalCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
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
                  <ShieldCheck size={18} color={primaryLight} />
                </View>
                <View>
                  <Text className="text-white text-base md:text-lg font-black">
                    {editingDutyId ? "Edit Allotment" : "Allot Faculty Duty"}
                  </Text>
                  <Text className="text-white/50 text-[11px] font-semibold">
                    {currentExam.name}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setShowDutyModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
              >
                <X size={16} color="#fff" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {/* 1. SELECT FACULTY (Dropdown UX) */}
              <View className="mb-3.5">
                <Text className="text-white/70 text-xs font-bold mb-1.5">Select Faculty *</Text>
                <Pressable
                  onPress={() => {
                    setFacultySearchQuery("");
                    setShowFacultyPicker(true);
                  }}
                  className="rounded-xl p-3 flex-row items-center justify-between border"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className="w-7 h-7 rounded-full items-center justify-center mr-2.5"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Text className="text-black font-black text-xs">{activeStaff.name[0]}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-xs md:text-sm font-bold" numberOfLines={1}>
                        {activeStaff.name}
                      </Text>
                      <Text className="text-white/50 text-[10px]" numberOfLines={1}>
                        {activeStaff.role}
                      </Text>
                    </View>
                  </View>
                  <ChevronDown size={16} color={primaryColor} />
                </Pressable>
              </View>

              {/* 2. CLASS & SUBJECT (Side-by-side Dropdowns) */}
              <View className="flex-row gap-3 mb-3.5">
                {/* Class Dropdown */}
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">Class *</Text>
                  <Pressable
                    onPress={() => setShowClassPicker(true)}
                    className="h-11 rounded-xl px-3 flex-row items-center justify-between border"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      borderColor: "rgba(255, 255, 255, 0.15)",
                    }}
                  >
                    <Text className="text-white font-bold text-xs" numberOfLines={1}>
                      {formClass}
                    </Text>
                    <ChevronDown size={14} color={primaryColor} />
                  </Pressable>
                </View>

                {/* Subject Dropdown */}
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">Subject *</Text>
                  <Pressable
                    onPress={() => {
                      setSubjectSearchQuery("");
                      setShowSubjectPicker(true);
                    }}
                    className="h-11 rounded-xl px-3 flex-row items-center justify-between border"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      borderColor: "rgba(255, 255, 255, 0.15)",
                    }}
                  >
                    <Text className="text-white font-bold text-xs" numberOfLines={1}>
                      {formSubject}
                    </Text>
                    <ChevronDown size={14} color={primaryColor} />
                  </Pressable>
                </View>
              </View>

              {/* 3. DATE (DD-MM-YYYY) WITH CALENDAR GRID */}
              <View className="mb-3.5">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-white/70 text-xs font-bold">Date (DD-MM-YYYY) *</Text>
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Pressable
                      onPress={() => {
                        const ymd = formatToYYYYMMDD(formDate);
                        const dObj = new Date(ymd + "T00:00:00");
                        if (!isNaN(dObj.getTime())) {
                          setCalendarYear(dObj.getFullYear());
                          setCalendarMonth(dObj.getMonth());
                        } else {
                          const curEx = AVAILABLE_EXAMS.find((e) => e.id === formExamId) || AVAILABLE_EXAMS[0];
                          if (curEx?.startDate) {
                            const exObj = new Date(curEx.startDate + "T00:00:00");
                            if (!isNaN(exObj.getTime())) {
                              setCalendarYear(exObj.getFullYear());
                              setCalendarMonth(exObj.getMonth());
                            }
                          }
                        }
                        setShowCalendarGrid(true);
                      }}
                      className="px-2.5 py-1 rounded-lg border flex-row items-center"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                        borderColor: `${primaryColor}40`,
                      }}
                    >
                      <CalendarDays size={12} color={primaryLight} style={{ marginRight: 4 }} />
                      <Text className="text-[11px] font-black" style={{ color: primaryLight }}>
                        Calendar Grid 📅
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={setTodayDate}
                      className="px-2 py-1 rounded-md border"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        borderColor: "rgba(255, 255, 255, 0.15)",
                      }}
                    >
                      <Text className="text-[10px] font-bold text-white/80">Today</Text>
                    </Pressable>
                  </View>
                </View>

                <View
                  className="h-11 rounded-xl px-3 flex-row items-center border"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <Pressable
                    onPress={() => {
                      const ymd = formatToYYYYMMDD(formDate);
                      const dObj = new Date(ymd + "T00:00:00");
                      if (!isNaN(dObj.getTime())) {
                        setCalendarYear(dObj.getFullYear());
                        setCalendarMonth(dObj.getMonth());
                      }
                      setShowCalendarGrid(true);
                    }}
                    className="mr-2.5"
                  >
                    <Calendar size={16} color={primaryColor} />
                  </Pressable>

                  <TextInput
                    value={formDate}
                    onChangeText={handleDateChange}
                    placeholder="DD-MM-YYYY (e.g. 15-10-2026)"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    maxLength={10}
                    keyboardType="numeric"
                    className="flex-1 text-white text-xs font-bold py-0"
                  />

                  <Pressable
                    onPress={() => {
                      const ymd = formatToYYYYMMDD(formDate);
                      const dObj = new Date(ymd + "T00:00:00");
                      if (!isNaN(dObj.getTime())) {
                        setCalendarYear(dObj.getFullYear());
                        setCalendarMonth(dObj.getMonth());
                      }
                      setShowCalendarGrid(true);
                    }}
                    className="px-2 py-1 rounded bg-white/10 ml-1"
                  >
                    <Text className="text-[10px] font-bold" style={{ color: primaryLight }}>
                      Pick Date
                    </Text>
                  </Pressable>
                </View>

                {/* Validation / Guidance Banner */}
                {manualDateValidation && (
                  <View
                    className="mt-1.5 px-2.5 py-1 rounded-lg flex-row items-center"
                    style={{
                      backgroundColor:
                        manualDateValidation.type === "valid"
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                      borderWidth: 1,
                      borderColor:
                        manualDateValidation.type === "valid"
                          ? "rgba(16, 185, 129, 0.3)"
                          : "rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    {manualDateValidation.type === "valid" ? (
                      <CheckCircle2 size={11} color="#34d399" style={{ marginRight: 5 }} />
                    ) : (
                      <AlertCircle size={11} color="#f87171" style={{ marginRight: 5 }} />
                    )}
                    <Text
                      className="text-[10px] font-bold flex-1"
                      style={{
                        color: manualDateValidation.type === "valid" ? "#34d399" : "#f87171",
                      }}
                    >
                      {manualDateValidation.message}
                    </Text>
                  </View>
                )}
              </View>

              {/* 4. TIME SLOT (Dropdown Presets + Manual Digits with AM/PM Dropdowns) */}
              <View className="mb-3.5">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-white/70 text-xs font-bold">Time Slot *</Text>
                  <Pressable
                    onPress={() => setShowPresetPicker(true)}
                    className="px-2.5 py-1 rounded-lg border flex-row items-center"
                    style={{
                      backgroundColor: `${primaryColor}15`,
                      borderColor: `${primaryColor}40`,
                    }}
                  >
                    <Clock size={11} color={primaryLight} style={{ marginRight: 4 }} />
                    <Text className="text-[11px] font-black" style={{ color: primaryLight }}>
                      Preset Slot ▾
                    </Text>
                  </Pressable>
                </View>

                {/* Manual Time Entry Container */}
                <View
                  className="rounded-2xl p-3 border"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.35)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    {/* START TIME */}
                    <View className="flex-1">
                      <Text className="text-white/50 text-[10px] font-bold mb-1">Start Time (Digits)</Text>
                      <View className="flex-row items-center gap-1.5">
                        <TextInput
                          value={formStartTime}
                          onChangeText={(t) => handleTimeChange(t, setFormStartTime, formStartTime)}
                          placeholder="09:30"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          maxLength={5}
                          keyboardType="numeric"
                          className="flex-1 h-10 rounded-xl px-2.5 text-center text-white font-bold text-xs border"
                          style={{
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            borderColor: "rgba(255, 255, 255, 0.15)",
                          }}
                        />
                        <Pressable
                          onPress={() => setShowStartPeriodPicker(true)}
                          className="h-10 px-2.5 rounded-xl border flex-row items-center justify-center"
                          style={{
                            backgroundColor: `${primaryColor}15`,
                            borderColor: `${primaryColor}40`,
                          }}
                        >
                          <Text className="font-black text-xs mr-1" style={{ color: primaryLight }}>{formStartPeriod}</Text>
                          <ChevronDown size={11} color={primaryColor} />
                        </Pressable>
                      </View>
                    </View>

                    {/* SEPARATOR */}
                    <View className="px-2 pt-3 items-center justify-center">
                      <Text className="text-white/40 font-bold text-xs">—</Text>
                    </View>

                    {/* END TIME */}
                    <View className="flex-1">
                      <Text className="text-white/50 text-[10px] font-bold mb-1">End Time (Digits)</Text>
                      <View className="flex-row items-center gap-1.5">
                        <TextInput
                          value={formEndTime}
                          onChangeText={(t) => handleTimeChange(t, setFormEndTime, formEndTime)}
                          placeholder="12:30"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          maxLength={5}
                          keyboardType="numeric"
                          className="flex-1 h-10 rounded-xl px-2.5 text-center text-white font-bold text-xs border"
                          style={{
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            borderColor: "rgba(255, 255, 255, 0.15)",
                          }}
                        />
                        <Pressable
                          onPress={() => setShowEndPeriodPicker(true)}
                          className="h-10 px-2.5 rounded-xl border flex-row items-center justify-center"
                          style={{
                            backgroundColor: `${primaryColor}15`,
                            borderColor: `${primaryColor}40`,
                          }}
                        >
                          <Text className="font-black text-xs mr-1" style={{ color: primaryLight }}>{formEndPeriod}</Text>
                          <ChevronDown size={11} color={primaryColor} />
                        </Pressable>
                      </View>
                    </View>
                  </View>

                  <View className="mt-2.5 pt-2 border-t border-white/5 flex-row items-center justify-between">
                    <Text className="text-white/50 text-[10px] font-semibold">Active Timing Slot:</Text>
                    <Text className="text-xs font-black" style={{ color: primaryColor }}>
                      {formStartTime} {formStartPeriod} - {formEndTime} {formEndPeriod}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 5. EXAM HALL / ROOM NO */}
              <View className="mb-4">
                <Text className="text-white/70 text-xs font-bold mb-1.5">Exam Hall / Room No</Text>
                <View
                  className="h-11 rounded-xl px-3 flex-row items-center border mb-2"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <Building size={14} color="#facc15" style={{ marginRight: 8 }} />
                  <TextInput
                    value={formRoom}
                    onChangeText={setFormRoom}
                    placeholder="e.g. Room 12 (North Wing)"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    className="flex-1 text-white text-xs font-semibold py-0"
                  />
                </View>

                {/* Quick Room Suggestions */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {["Room 12 (North Wing)", "Science Hall 2", "Chemistry Lab A", "Room 10", "Main Auditorium"].map((rm) => (
                    <Pressable
                      key={rm}
                      onPress={() => setFormRoom(rm)}
                      className="px-2.5 py-1 rounded-lg border"
                      style={{
                        backgroundColor: formRoom === rm ? `${primaryColor}20` : "rgba(255, 255, 255, 0.05)",
                        borderColor: formRoom === rm ? primaryColor : "rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <Text
                        className="text-[10px] font-bold"
                        style={{ color: formRoom === rm ? primaryLight : "rgba(255, 255, 255, 0.6)" }}
                      >
                        {rm}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View className="flex-row items-center pt-3 border-t border-white/10" style={{ gap: 10 }}>
              <Pressable
                onPress={() => setShowDutyModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/15"
              >
                <Text className="text-white text-xs font-bold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveDuty}
                className="flex-1 py-3 rounded-xl items-center justify-center shadow-lg active:opacity-80"
                style={{ backgroundColor: primaryColor }}
              >
                <Text className="text-black text-xs font-black">
                  {editingDutyId ? "Update Duty" : "Confirm Allotment"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 1. FACULTY PICKER MODAL */}
      <Modal visible={showFacultyPicker} transparent animationType="fade" onRequestClose={() => setShowFacultyPicker(false)}>
        <Pressable onPress={() => setShowFacultyPicker(false)} style={styles.modalOverlay}>
          <View
            style={[
              styles.pickerModalCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-white/10">
              <Text className="text-white font-extrabold text-sm">Select Faculty</Text>
              <Pressable onPress={() => setShowFacultyPicker(false)}>
                <X size={16} color="rgba(255,255,255,0.7)" />
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
                value={facultySearchQuery}
                onChangeText={setFacultySearchQuery}
                placeholder="Search faculty name or role..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="flex-1 text-white text-xs py-0"
              />
              {facultySearchQuery ? (
                <Pressable onPress={() => setFacultySearchQuery("")}>
                  <X size={13} color="rgba(255,255,255,0.6)" />
                </Pressable>
              ) : null}
            </View>

            <ScrollView style={{ maxHeight: 280 }}>
              {filteredFacultyList.map((faculty) => {
                const isSelected = selectedStaffId === faculty.id;
                return (
                  <Pressable
                    key={faculty.id}
                    onPress={() => {
                      setSelectedStaffId(faculty.id);
                      setShowFacultyPicker(false);
                    }}
                    className="p-2.5 rounded-xl mb-1.5 flex-row items-center justify-between"
                    style={{
                      backgroundColor: isSelected
                        ? isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)"
                        : "rgba(255, 255, 255, 0.05)",
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: primaryColor,
                    }}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <View
                        className="w-7 h-7 rounded-full items-center justify-center mr-2.5"
                        style={{ backgroundColor: isSelected ? primaryColor : "rgba(255, 255, 255, 0.2)" }}
                      >
                        <Text className="text-black font-bold text-xs">{faculty.name[0]}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold" style={{ color: isSelected ? primaryColor : "#fff" }}>
                          {faculty.name}
                        </Text>
                        <Text className="text-white/50 text-[10px]">{faculty.role}</Text>
                      </View>
                    </View>
                    {isSelected && <Check size={16} color={primaryColor} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* 2. SUBJECT PICKER MODAL */}
      <Modal visible={showSubjectPicker} transparent animationType="fade" onRequestClose={() => setShowSubjectPicker(false)}>
        <Pressable onPress={() => setShowSubjectPicker(false)} style={styles.modalOverlay}>
          <View
            style={[
              styles.pickerModalCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-white/10">
              <Text className="text-white font-extrabold text-sm">Select Subject</Text>
              <Pressable onPress={() => setShowSubjectPicker(false)}>
                <X size={16} color="rgba(255,255,255,0.7)" />
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
                placeholder="Search subject..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="flex-1 text-white text-xs py-0"
              />
              {subjectSearchQuery ? (
                <Pressable onPress={() => setSubjectSearchQuery("")}>
                  <X size={13} color="rgba(255,255,255,0.6)" />
                </Pressable>
              ) : null}
            </View>

            <ScrollView style={{ maxHeight: 280 }}>
              {filteredSubjectsList.map((sub) => {
                const isSelected = formSubject === sub;
                return (
                  <Pressable
                    key={sub}
                    onPress={() => {
                      setFormSubject(sub);
                      setShowSubjectPicker(false);
                    }}
                    className="p-3 rounded-xl mb-1.5 flex-row items-center justify-between"
                    style={{
                      backgroundColor: isSelected
                        ? isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)"
                        : "rgba(255, 255, 255, 0.05)",
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: primaryColor,
                    }}
                  >
                    <Text className="text-xs font-bold" style={{ color: isSelected ? primaryColor : "#fff" }}>
                      {sub}
                    </Text>
                    {isSelected && <Check size={16} color={primaryColor} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* 3. CLASS PICKER MODAL */}
      <Modal visible={showClassPicker} transparent animationType="fade" onRequestClose={() => setShowClassPicker(false)}>
        <Pressable onPress={() => setShowClassPicker(false)} style={styles.modalOverlay}>
          <View
            style={[
              styles.pickerModalCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-white/10">
              <Text className="text-white font-extrabold text-sm">Select Class</Text>
              <Pressable onPress={() => setShowClassPicker(false)}>
                <X size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 260 }}>
              {AVAILABLE_CLASSES.map((cls) => {
                const isSelected = formClass === cls;
                return (
                  <Pressable
                    key={cls}
                    onPress={() => {
                      setFormClass(cls);
                      setShowClassPicker(false);
                    }}
                    className="p-3 rounded-xl mb-1.5 flex-row items-center justify-between"
                    style={{
                      backgroundColor: isSelected
                        ? isSuperAdmin ? "rgba(240, 193, 16, 0.2)" : "rgba(0, 241, 161, 0.2)"
                        : "rgba(255, 255, 255, 0.05)",
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: primaryColor,
                    }}
                  >
                    <Text className="text-xs font-bold" style={{ color: isSelected ? primaryColor : "#fff" }}>
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

      {/* 4. TIME PRESET PICKER MODAL */}
      <Modal visible={showPresetPicker} transparent animationType="fade" onRequestClose={() => setShowPresetPicker(false)}>
        <Pressable onPress={() => setShowPresetPicker(false)} style={styles.modalOverlay}>
          <View
            style={[
              styles.pickerModalCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-white/10">
              <Text className="text-white font-extrabold text-sm">Choose Preset Time Slot</Text>
              <Pressable onPress={() => setShowPresetPicker(false)}>
                <X size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {TIME_PRESETS.map((preset, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleApplyPreset(preset)}
                  className="p-3 rounded-xl mb-1.5 flex-row items-center justify-between"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <Text className="text-xs font-bold text-white">{preset.label}</Text>
                  <Check size={14} color={primaryColor} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* 5. START PERIOD (AM/PM) PICKER MODAL */}
      <Modal visible={showStartPeriodPicker} transparent animationType="fade" onRequestClose={() => setShowStartPeriodPicker(false)}>
        <Pressable onPress={() => setShowStartPeriodPicker(false)} style={styles.modalOverlay}>
          <View
            style={[
              styles.smallPickerCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <Text className="text-white font-black text-xs mb-2">Select Start Period</Text>
            {(["AM", "PM"] as const).map((period) => (
              <Pressable
                key={period}
                onPress={() => {
                  setFormStartPeriod(period);
                  setShowStartPeriodPicker(false);
                }}
                className="p-2.5 rounded-xl mb-1 flex-row items-center justify-between"
                style={{
                  backgroundColor: formStartPeriod === period ? primaryColor : "rgba(255, 255, 255, 0.05)",
                }}
              >
                <Text className="text-xs font-bold" style={{ color: formStartPeriod === period ? "#000" : "#fff" }}>
                  {period}
                </Text>
                {formStartPeriod === period && <Check size={14} color="#000" />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* 6. END PERIOD (AM/PM) PICKER MODAL */}
      <Modal visible={showEndPeriodPicker} transparent animationType="fade" onRequestClose={() => setShowEndPeriodPicker(false)}>
        <Pressable onPress={() => setShowEndPeriodPicker(false)} style={styles.modalOverlay}>
          <View
            style={[
              styles.smallPickerCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <Text className="text-white font-black text-xs mb-2">Select End Period</Text>
            {(["AM", "PM"] as const).map((period) => (
              <Pressable
                key={period}
                onPress={() => {
                  setFormEndPeriod(period);
                  setShowEndPeriodPicker(false);
                }}
                className="p-2.5 rounded-xl mb-1 flex-row items-center justify-between"
                style={{
                  backgroundColor: formEndPeriod === period ? primaryColor : "rgba(255, 255, 255, 0.05)",
                }}
              >
                <Text className="text-xs font-bold" style={{ color: formEndPeriod === period ? "#000" : "#fff" }}>
                  {period}
                </Text>
                {formEndPeriod === period && <Check size={14} color="#000" />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* 7. CALENDAR GRID PICKER MODAL (WEB PARITY: DISABLES DATES PRIOR TO EXAM START, SUNDAYS, AND HOLIDAYS) */}
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
                  Exam: {AVAILABLE_EXAMS.find((e) => e.id === formExamId)?.name || currentExam.name}
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

                const currentFormExam = AVAILABLE_EXAMS.find((e) => e.id === formExamId) || currentExam;
                const examMinDateYMD = currentFormExam?.startDate ? formatToYYYYMMDD(currentFormExam.startDate) : "";
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

                  const isBeforeExamStart = examMinDateYMD ? dateYMD < examMinDateYMD : false;
                  const isSelected = selectedYMD === dateYMD;
                  const isDisabled = isSunday || isHoliday || isBeforeExamStart;

                  cells.push(
                    <View key={`day-${day}`} className="w-[14.28%] p-0.5 h-11 items-center justify-center">
                      <Pressable
                        disabled={isDisabled}
                        onPress={() => {
                          if (isDisabled) return;
                          setFormDate(dateDDMMYYYY);
                          setShowCalendarGrid(false);
                          showToast(`Selected date: ${dateDDMMYYYY}`);
                        }}
                        className="w-full h-full rounded-xl items-center justify-center relative overflow-hidden"
                        style={{
                          backgroundColor: isSelected
                            ? primaryColor
                            : isHoliday
                            ? "rgba(239, 68, 68, 0.18)"
                            : isSunday
                            ? "rgba(239, 68, 68, 0.08)"
                            : isBeforeExamStart
                            ? "rgba(255, 255, 255, 0.02)"
                            : "rgba(255, 255, 255, 0.06)",
                          borderWidth: isSelected ? 1.5 : isHoliday ? 1 : isBeforeExamStart ? 0 : 1,
                          borderColor: isSelected
                            ? "#fff"
                            : isHoliday
                            ? "rgba(239, 68, 68, 0.4)"
                            : "rgba(255, 255, 255, 0.08)",
                          opacity: isBeforeExamStart ? 0.3 : 1,
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
                              : isBeforeExamStart
                              ? "rgba(255, 255, 255, 0.3)"
                              : "#fff",
                            textDecorationLine: isBeforeExamStart ? "line-through" : "none",
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

            {/* Legend / Web Logic Guidelines */}
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
                  <Text className="text-white/60 text-[10px] font-semibold">Available</Text>
                </View>
              </View>

              {(() => {
                const currentFormExam = AVAILABLE_EXAMS.find((e) => e.id === formExamId) || currentExam;
                const examMinDateYMD = currentFormExam?.startDate ? formatToYYYYMMDD(currentFormExam.startDate) : "";
                if (examMinDateYMD) {
                  return (
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-white/30 mr-1.5" />
                      <Text className="text-white/40 text-[10px]">
                        Dates before {formatToDDMMYYYY(examMinDateYMD)} disabled (Exam Start)
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}
            </View>

            {/* Close / Cancel Button */}
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
                    : cardBorder,
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

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        visible={!!deletingDuty}
        transparent
        animationType="fade"
        onRequestClose={() => setDeletingDuty(null)}
      >
        <Pressable
          onPress={() => setDeletingDuty(null)}
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
                  Remove Assignment
                </Text>
              </View>
              <Text className="text-white text-lg font-black text-center">Remove Duty?</Text>
            </View>

            <Text className="text-white/60 text-xs text-center mb-4 leading-relaxed px-1">
              Are you sure you want to remove invigilation duty assigned to <Text className="text-white font-bold">"{deletingDuty?.staffName}"</Text> for <Text className="text-white font-bold">{deletingDuty?.subject}</Text>?
            </Text>

            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Pressable
                onPress={() => setDeletingDuty(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
              >
                <Text className="text-white text-xs font-bold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteDutyConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 items-center justify-center shadow-md active:opacity-90"
              >
                <Text className="text-white text-xs font-black">Remove</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  dutyModalCard: {
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  calendarModalCard: {
    width: "100%",
    maxWidth: 350,
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  pickerModalCard: {
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  smallPickerCard: {
    width: "100%",
    maxWidth: 200,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default AdminExamInvigilationScreen;
