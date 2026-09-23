import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Image,
  Modal,
  BackHandler,
  PanResponder,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Bell,
  Clock,
  MapPin,
  ClipboardCheck,
  ClipboardList,
  Star,
  BookOpen,
  Calendar,
  CalendarCheck,
  CalendarOff,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Lock,
  Plus,
  X,
  LogOut,
  GraduationCap,
  FileText,
  ShieldCheck,
  Layers,
} from "lucide-react-native";
import { useResponsive } from "../../utils/responsive";
import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ClassScheduleItem {
  period: string;
  periodIndex: number;
  time: string;
  subject: string;
  class: string;
  room: string;
  status: 'In Progress' | 'Completed' | 'Upcoming';
  isBreak?: boolean;
}

interface ActionTaskItem {
  id: string;
  task: string;
  classTag?: string;
  due: string;
  urgent: boolean;
  route: string;
  actionText: string;
}

interface LeaveRequestItem {
  id: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  adminNotes?: string;
}

interface ClassPerformanceItem {
  className: string;
  rate: number;
  totalStudents: number;
  presentCount: number;
}

interface SystemNoticeItem {
  id: string;
  title: string;
  message: string;
  time: string;
  category: 'Administrative' | 'Academic' | 'Urgent';
}

export const TeacherDashboard: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isSmallPhone, headerPaddingTop, scrollBottomPadding } = useResponsive();
  const { user, logout } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showSidebarModal, setShowSidebarModal] = useState(false);
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Live state mirroring web options
  const [classTeacherOf, setClassTeacherOf] = useState<string>("Grade 8-A");
  const [teacherClasses, setTeacherClasses] = useState<string[]>(["8-A", "8-B", "9-A", "10-B"]);
  const [leaveBalance, setLeaveBalance] = useState({ cl: 8, sl: 5, el: 12, total: 25 });
  const [todayClasses, setTodayClasses] = useState<ClassScheduleItem[]>([
    {
      period: "P1",
      periodIndex: 1,
      time: "08:30 AM - 09:15 AM",
      subject: "Mathematics",
      class: "8-A",
      room: "Room 402",
      status: "Completed",
    },
    {
      period: "P2",
      periodIndex: 2,
      time: "09:20 AM - 10:05 AM",
      subject: "Physics (Lab)",
      class: "8-B",
      room: "Physics Lab A",
      status: "In Progress",
    },
    {
      period: "P3",
      periodIndex: 3,
      time: "10:15 AM - 11:00 AM",
      subject: "Mathematics",
      class: "9-A",
      room: "Room 305",
      status: "Upcoming",
    },
    {
      period: "P4",
      periodIndex: 4,
      time: "11:30 AM - 12:15 PM",
      subject: "Advanced Algebra",
      class: "10-B",
      room: "Room 501",
      status: "Upcoming",
    },
    {
      period: "P5",
      periodIndex: 5,
      time: "01:00 PM - 01:45 PM",
      subject: "Doubt Clearing Session",
      class: "8-A",
      room: "Room 402",
      status: "Upcoming",
    },
  ]);

  const [dynamicTasks, setDynamicTasks] = useState<ActionTaskItem[]>([
    {
      id: "task-1",
      task: "Mark morning student attendance",
      classTag: "Class 8-A",
      due: "Pending for Morning Session",
      urgent: true,
      route: "Attendance",
      actionText: "Mark Attendance",
    },
    {
      id: "task-2",
      task: "Submit Daily Diary entries",
      classTag: "Class 8-A & 8-B",
      due: "Due by 02:00 PM Today",
      urgent: true,
      route: "DailyDiary",
      actionText: "Post Diary",
    },
    {
      id: "task-3",
      task: "Upload homework for Class 9-A",
      classTag: "Algebra Ch. 4",
      due: "Due by 04:00 PM",
      urgent: false,
      route: "Homework",
      actionText: "Add Homework",
    },
    {
      id: "task-4",
      task: "Enter Term-1 Mid Assessment Marks",
      classTag: "Class 10-B",
      due: "Due tomorrow",
      urgent: false,
      route: "Marks",
      actionText: "Enter Marks",
    },
  ]);

  const [myLeaves, setMyLeaves] = useState<LeaveRequestItem[]>([
    {
      id: "lev-101",
      type: "Casual Leave",
      from: "12 Oct 2026",
      to: "13 Oct 2026",
      days: 2,
      reason: "Family personal commitment",
      status: "Approved",
    },
    {
      id: "lev-102",
      type: "Medical Leave",
      from: "28 Sep 2026",
      to: "28 Sep 2026",
      days: 1,
      reason: "Dental appointment & checkup",
      status: "Pending",
    },
  ]);

  const [classPerformance, setClassPerformance] = useState<ClassPerformanceItem[]>([
    { className: "Grade 8-A (Class Teacher)", rate: 94, totalStudents: 42, presentCount: 40 },
    { className: "Grade 8-B (Physics)", rate: 89, totalStudents: 38, presentCount: 34 },
    { className: "Grade 9-A (Maths)", rate: 96, totalStudents: 40, presentCount: 38 },
    { className: "Grade 10-B (Algebra)", rate: 82, totalStudents: 36, presentCount: 30 },
  ]);

  const [systemNotices, setSystemNotices] = useState<SystemNoticeItem[]>([
    {
      id: "not-1",
      title: "Mid-Term Examination Syllabus Submission",
      message: "All faculty members are requested to upload the completed syllabus blueprint before Friday.",
      time: "2 hours ago",
      category: "Academic",
    },
    {
      id: "not-2",
      title: "Parent-Teacher Conference Schedule",
      message: "PTM will be conducted this Saturday from 09:00 AM to 01:00 PM at Central Auditorium.",
      time: "Yesterday",
      category: "Administrative",
    },
  ]);

  const showSidebarModalRef = useRef(showSidebarModal);
  showSidebarModalRef.current = showSidebarModal;

  // Swipe from left-to-right anywhere on Dashboard to open sidebar drawer
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (showSidebarModalRef.current) return false;
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.25;
        return isHorizontal && gestureState.dx > 25;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 35 || (gestureState.dx > 15 && gestureState.vx > 0.2)) {
          setShowSidebarModal(true);
        }
      },
    })
  ).current;

  // Swipe from right-to-left on open sidebar drawer to close
  const sidebarSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2;
        return isHorizontal && gestureState.dx < -20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -30 || gestureState.vx < -0.2) {
          setShowSidebarModal(false);
        }
      },
    })
  ).current;

  // Hardware Back Button closes open sidebar modal
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showQuickActionModal) {
          setShowQuickActionModal(false);
          return true;
        }
        if (showSidebarModal) {
          setShowSidebarModal(false);
          return true;
        }
        if (showNotificationModal) {
          setShowNotificationModal(false);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [showSidebarModal, showQuickActionModal, showNotificationModal])
  );

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [notifsRes, leavesRes] = await Promise.all([
        api.getNotifications().catch(() => null),
        api.getResources("leave-applications").catch(() => null),
      ]);

      if (Array.isArray(notifsRes) && notifsRes.length > 0) {
        setSystemNotices(
          notifsRes.slice(0, 5).map((n: any) => ({
            id: String(n.id || Date.now()),
            title: n.title || "Faculty Announcement",
            message: n.message || n.body || "New administrative notice.",
            time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
            category: n.category || "Administrative",
          }))
        );
      }

      if (Array.isArray(leavesRes) && leavesRes.length > 0) {
        const myFiltered = leavesRes.filter(
          (l: any) =>
            String(l.staff_id || l.staffId || l.user_id) === String(user?.id || (user as any)?.staffId)
        );
        if (myFiltered.length > 0) {
          setMyLeaves(
            myFiltered.slice(0, 4).map((l: any) => ({
              id: String(l.id),
              type: l.leave_type || l.type || "Casual Leave",
              from: l.start_date || l.from || "Upcoming",
              to: l.end_date || l.to || l.start_date,
              days: Number(l.days || 1),
              reason: l.reason || "Personal work",
              status: (l.status as any) || "Pending",
              adminNotes: l.admin_notes || l.adminNotes,
            }))
          );
        }
      }
    } catch (err) {
      console.log("Error loading teacher dashboard live data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleSignOut = () => {
    setShowSidebarModal(false);
    setShowSignOutModal(false);
    logout();
    try {
      if (navigation?.getParent()) {
        navigation.getParent()?.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      } else if (navigation?.reset) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      } else if (navigation?.navigate) {
        navigation.navigate("Login");
      }
    } catch (_) {}
  };

  const displayName = user?.name || "Ms. Priya Reddy";
  const displayEmail = user?.email || "priya.reddy@krishnaveni.edu";
  const displayDesignation = user?.designation || "Senior Mathematics Faculty";
  const userInitials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Calculated metrics
  const completedClassesCount = todayClasses.filter((c) => c.status === "Completed").length;
  const totalClassesCount = todayClasses.length;
  const pendingAttendanceCount = dynamicTasks.filter((t) => t.route === "Attendance").length;

  const quickActions = [
    {
      id: "allot-att",
      title: "Attendance",
      subtitle: "Mark Sessions",
      icon: <ClipboardCheck size={22} color="#ddb7ff" />,
      route: "Attendance",
    },
    {
      id: "examination",
      title: "Examination",
      subtitle: "Grade & Exams",
      icon: <GraduationCap size={22} color="#c084fc" />,
      route: "Examination",
    },
    {
      id: "timetable",
      title: "Time Table",
      subtitle: "Class Schedule",
      icon: <Calendar size={22} color="#818cf8" />,
      route: "Timetable",
    },
    {
      id: "performance",
      title: "Performance",
      subtitle: "Student Analytics",
      icon: <TrendingUp size={22} color="#34d399" />,
      route: "Performance",
    },
    {
      id: "homework",
      title: "Homework",
      subtitle: "Assign Tasks",
      icon: <ClipboardList size={22} color="#38bdf8" />,
      route: "Homework",
    },
    {
      id: "holiday-calendar",
      title: "Holiday Calendar",
      subtitle: "Vacations & Events",
      icon: <CalendarCheck size={22} color="#facc15" />,
      route: "HolidayCalendar",
    },
    {
      id: "leave-app",
      title: "Apply Leave",
      subtitle: "Leave Portal",
      icon: <CalendarOff size={22} color="#f472b6" />,
      route: "Leave",
    },
    {
      id: "messages",
      title: "Messages",
      subtitle: "Parent Chat",
      icon: <MessageSquare size={22} color="#4ade80" />,
      route: "TeacherCommunication",
    },
  ];

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Seamless Deep Background Gradient */}
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
          {/* Header Left Profile Area (Click to open Left Sidebar Drawer) */}
          <Pressable
            onPress={() => setShowSidebarModal(true)}
            className="flex-row items-center flex-1 mr-2 active:opacity-80"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <View className="relative">
              <View className="w-11 h-11 md:w-12 md:h-12 rounded-full border-2 border-[#ddb7ff] p-0.5 items-center justify-center bg-[#1f1633] shadow-[0_0_12px_rgba(221,183,255,0.35)]">
                {user?.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150",
                    }}
                    className="w-full h-full rounded-full"
                  />
                )}
              </View>
              <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00f1a1] rounded-full border-2 border-[#0e0d17]" />
            </View>
            <View className="ml-3 flex-1">
              <Text numberOfLines={1} className="text-[#ddb7ff] text-lg md:text-xl font-extrabold font-display-lg">
                {displayName}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <Text numberOfLines={1} className="text-white/80 text-xs font-bold tracking-wider uppercase mr-2">
                  {classTeacherOf ? `Class Teacher: ${classTeacherOf}` : "Faculty Member"}
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Header Right Actions */}
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setShowNotificationModal(true)}
              className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/10 active:bg-white/15 relative"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Bell size={20} color="#ddb7ff" />
              {systemNotices.length > 0 && (
                <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#f43f5e] rounded-full shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
              )}
            </Pressable>
          </View>
        </BlurView>

        {/* Glow Shadow beneath header */}
        <LinearGradient
          colors={["rgba(221, 183, 255, 0.18)", "transparent"]}
          style={{ position: "absolute", bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollBottomPadding + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchDashboardData}
            tintColor="#ddb7ff"
            colors={["#ddb7ff", "#c084fc"]}
          />
        }
      >
        {/* 1. FACULTY WORKSPACE WELCOME (Open Layout Seamlessly on Background Gradient) */}
        <View className="mb-6 px-1">
          {/* Top Badges & Date */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center bg-[#ddb7ff]/15 px-3 py-1.5 rounded-full border border-[#ddb7ff]/30">
              <View className="w-2 h-2 rounded-full bg-[#ddb7ff] mr-2 shadow-[0_0_8px_#ddb7ff]" />
              <Text className="text-[#ddb7ff] text-[11px] font-black uppercase tracking-wider">
                Faculty Workspace
              </Text>
            </View>

            {classTeacherOf ? (
              <View className="bg-[#00f1a1]/15 px-3 py-1 rounded-full border border-[#00f1a1]/30">
                <Text className="text-[#00f1a1] text-[11px] font-extrabold tracking-wide">
                  {classTeacherOf}
                </Text>
              </View>
            ) : (
              <Text className="text-white/60 text-xs font-semibold">
                {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </Text>
            )}
          </View>

          {/* Welcome Heading & Details */}
          <Text className="text-white text-2xl md:text-3xl font-black font-display-lg leading-tight">
            Welcome back, <Text className="text-[#ddb7ff]">{displayName}</Text>
          </Text>
          <Text className="text-white/70 text-xs font-medium mt-1.5 leading-relaxed">
            {displayDesignation} • Classes: {teacherClasses.join(", ")}
          </Text>

          {/* Quick Status Chips Ribbon */}
          <View className="flex-row flex-wrap items-center gap-2 mt-3.5">
            <View className="flex-row items-center bg-white/5 px-3.5 py-2 rounded-xl border border-white/10">
              <Clock size={14} color="#ddb7ff" style={{ marginRight: 6 }} />
              <Text className="text-white font-extrabold text-xs">
                {completedClassesCount}/{totalClassesCount} Classes Today
              </Text>
            </View>

            <View
              className={`flex-row items-center px-3.5 py-2 rounded-xl border ${
                pendingAttendanceCount > 0
                  ? "bg-amber-500/15 border-amber-500/30"
                  : "bg-emerald-500/15 border-emerald-500/30"
              }`}
            >
              {pendingAttendanceCount > 0 ? (
                <AlertCircle size={14} color="#fcd34d" style={{ marginRight: 6 }} />
              ) : (
                <CheckCircle2 size={14} color="#00f1a1" style={{ marginRight: 6 }} />
              )}
              <Text
                className={`font-extrabold text-xs ${
                  pendingAttendanceCount > 0 ? "text-amber-300" : "text-[#00f1a1]"
                }`}
              >
                {pendingAttendanceCount > 0
                  ? `Attendance: ${pendingAttendanceCount} Pending`
                  : "Attendance: All Marked"}
              </Text>
            </View>

            <Pressable
              onPress={() => navigation.navigate("Leave")}
              className="flex-row items-center bg-white/5 px-3.5 py-2 rounded-xl border border-white/10 active:opacity-80"
            >
              <CalendarOff size={14} color="#f472b6" style={{ marginRight: 6 }} />
              <Text className="text-[#f472b6] font-extrabold text-xs">
                {leaveBalance.total} Leave Days Left
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 2. FOUR KEY METRIC SUMMARY CARDS (Bento KPI Grid) */}
        <View className="mb-6">
          <View className="flex-row justify-between mb-3" style={{ gap: 10 }}>
            {/* Card 1: Classes Today */}
            <View className="flex-1 bg-[#181524] border border-white/10 rounded-2xl p-4 shadow-lg">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-white/60 text-[11px] font-extrabold uppercase tracking-wider">
                  Classes Today
                </Text>
                <Clock size={16} color="#ddb7ff" />
              </View>
              <Text className="text-white text-2xl font-black">{totalClassesCount}</Text>
              <Text className="text-[#ddb7ff] text-xs font-semibold mt-1">
                {completedClassesCount} done • {totalClassesCount - completedClassesCount} left
              </Text>
            </View>

            {/* Card 2: Attendance Status */}
            <View className="flex-1 bg-[#181524] border border-white/10 rounded-2xl p-4 shadow-lg">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-white/60 text-[11px] font-extrabold uppercase tracking-wider">
                  Attendance
                </Text>
                <ClipboardCheck size={16} color={pendingAttendanceCount > 0 ? "#fcd34d" : "#4ade80"} />
              </View>
              <Text className="text-white text-2xl font-black">
                {totalClassesCount - pendingAttendanceCount}/{totalClassesCount}
              </Text>
              <Text
                className={`text-xs font-semibold mt-1 ${
                  pendingAttendanceCount > 0 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {pendingAttendanceCount > 0 ? `${pendingAttendanceCount} Pending` : "Complete"}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between" style={{ gap: 10 }}>
            {/* Card 3: Homework & Diaries */}
            <View className="flex-1 bg-[#181524] border border-white/10 rounded-2xl p-4 shadow-lg">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-white/60 text-[11px] font-extrabold uppercase tracking-wider">
                  Homework
                </Text>
                <ClipboardList size={16} color="#38bdf8" />
              </View>
              <Text className="text-white text-2xl font-black">3/4</Text>
              <Text className="text-[#38bdf8] text-xs font-semibold mt-1">Classes Assigned</Text>
            </View>

            {/* Card 4: Leave Balance */}
            <Pressable
              onPress={() => navigation.navigate("Leave")}
              className="flex-1 bg-[#181524] border border-white/10 rounded-2xl p-4 shadow-lg active:scale-95"
            >
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-white/60 text-[11px] font-extrabold uppercase tracking-wider">
                  Leave Balance
                </Text>
                <CalendarOff size={16} color="#f472b6" />
              </View>
              <Text className="text-white text-2xl font-black">{leaveBalance.total} Days</Text>
              <Text className="text-[#f472b6] text-xs font-semibold mt-1">
                CL {leaveBalance.cl} • SL {leaveBalance.sl} • EL {leaveBalance.el}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 3. QUICK ACTIONS GRID (6 Essential Navigation Tiles) */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-white text-lg font-extrabold">Quick Actions</Text>
            <Text className="text-[#ddb7ff] text-xs font-bold uppercase tracking-wider">
              Faculty Tools
            </Text>
          </View>

          <View className="flex-row flex-wrap justify-between" style={{ gap: 10 }}>
            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => action.route && navigation.navigate(action.route)}
                className="w-[48%] bg-[#181524] border border-white/10 rounded-2xl p-3.5 flex-row items-center active:bg-white/10 shadow-md relative overflow-hidden"
              >
                <View className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 items-center justify-center mr-3">
                  {action.icon}
                </View>
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-white font-extrabold text-sm">
                    {action.title}
                  </Text>
                  <Text numberOfLines={1} className="text-white/50 text-xs font-medium mt-0.5">
                    {action.subtitle}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 4. ACTION REQUIRED & PENDING TASKS (Interactive Action Hub) */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center">
              <AlertCircle size={18} color="#f43f5e" style={{ marginRight: 6 }} />
              <Text className="text-white text-lg font-extrabold">Action Required</Text>
            </View>
            <View className="bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-500/40">
              <Text className="text-rose-300 text-xs font-bold">{dynamicTasks.length} Pending</Text>
            </View>
          </View>

          <View className="bg-[#181524] border border-white/10 rounded-3xl p-4 shadow-lg">
            {dynamicTasks.map((t, idx) => (
              <View
                key={t.id}
                className={`py-3.5 flex-row items-center justify-between ${
                  idx < dynamicTasks.length - 1 ? "border-b border-white/10" : ""
                }`}
              >
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center mb-1">
                    <View
                      className={`w-2 h-2 rounded-full mr-2 ${
                        t.urgent ? "bg-rose-500 shadow-[0_0_6px_#f43f5e]" : "bg-amber-400"
                      }`}
                    />
                    <Text className="text-white font-bold text-sm flex-1" numberOfLines={1}>
                      {t.task}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    {t.classTag && (
                      <Text className="text-[#ddb7ff] text-xs font-extrabold mr-2">
                        {t.classTag}
                      </Text>
                    )}
                    <Text className="text-white/50 text-xs font-medium">{t.due}</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => navigation.navigate(t.route)}
                  className="px-3.5 py-2 rounded-xl bg-[#ddb7ff]/20 border border-[#ddb7ff]/40 flex-row items-center active:bg-[#ddb7ff]/30"
                >
                  <Text className="text-[#ddb7ff] font-extrabold text-xs mr-1">{t.actionText}</Text>
                  <ArrowRight size={12} color="#ddb7ff" />
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        {/* 5. TODAY'S CLASSES SCHEDULE (Live Timetable Stream) */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center">
              <Clock size={18} color="#ddb7ff" style={{ marginRight: 6 }} />
              <Text className="text-white text-lg font-extrabold">Today's Class Schedule</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate("TimetableBuilder")}
              className="flex-row items-center active:opacity-80"
            >
              <Text className="text-[#ddb7ff] text-xs font-bold mr-1">Timetable</Text>
              <ChevronRight size={14} color="#ddb7ff" />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="overflow-visible"
            contentContainerStyle={{ paddingRight: 10 }}
          >
            {todayClasses.map((cls, idx) => {
              const isInProgress = cls.status === "In Progress";
              const isDone = cls.status === "Completed";

              return (
                <View
                  key={idx}
                  className={`w-52 rounded-3xl p-4 mr-3 border ${
                    isInProgress
                      ? "bg-[#271d42] border-[#ddb7ff] shadow-lg shadow-[#ddb7ff]/20"
                      : isDone
                      ? "bg-[#14121c] border-white/5"
                      : "bg-[#181524] border-white/10"
                  }`}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="bg-white/10 px-2.5 py-1 rounded-xl">
                      <Text className="text-[#ddb7ff] font-extrabold text-xs">{cls.period}</Text>
                    </View>
                    <View
                      className={`px-2.5 py-0.5 rounded-full ${
                        isInProgress
                          ? "bg-[#00f1a1]/20 border border-[#00f1a1]/40"
                          : isDone
                          ? "bg-white/10 border border-white/10"
                          : "bg-white/5 border border-white/10"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-black uppercase ${
                          isInProgress
                            ? "text-[#00f1a1]"
                            : isDone
                            ? "text-white/50"
                            : "text-[#ddb7ff]"
                        }`}
                      >
                        {isInProgress ? "ONGOING" : isDone ? "DONE" : "UPCOMING"}
                      </Text>
                    </View>
                  </View>

                  <Text numberOfLines={1} className="text-white font-extrabold text-base mb-1">
                    {cls.subject}
                  </Text>
                  <Text className="text-white/70 text-xs font-semibold mb-3">
                    Class {cls.class} • {cls.room}
                  </Text>

                  <View className="pt-2 border-t border-white/10 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Clock size={12} color="rgba(255,255,255,0.5)" style={{ marginRight: 4 }} />
                      <Text className="text-white/60 text-[11px] font-medium">{cls.time.split(" - ")[0]}</Text>
                    </View>

                    <Pressable
                      onPress={() => navigation.navigate("Attendance")}
                      className="px-2.5 py-1 bg-white/10 rounded-lg active:bg-white/20"
                    >
                      <Text className="text-[#ddb7ff] font-extrabold text-[10px]">Attendance</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* 6. CLASS ATTENDANCE PERFORMANCE (Progress Bars) */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center">
              <TrendingUp size={18} color="#4ade80" style={{ marginRight: 6 }} />
              <Text className="text-white text-lg font-extrabold">Attendance Performance</Text>
            </View>
            <Text className="text-white/50 text-xs font-semibold">Active Term</Text>
          </View>

          <View className="bg-[#181524] border border-white/10 rounded-3xl p-4 shadow-lg">
            {classPerformance.map((item, idx) => {
              const isHigh = item.rate >= 90;
              const isMedium = item.rate >= 80 && item.rate < 90;

              return (
                <View
                  key={idx}
                  className={`py-3 ${idx < classPerformance.length - 1 ? "border-b border-white/10" : ""}`}
                >
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-white font-bold text-sm">{item.className}</Text>
                    <View className="flex-row items-center">
                      <Text
                        className={`text-sm font-black mr-1 ${
                          isHigh ? "text-[#00f1a1]" : isMedium ? "text-[#ddb7ff]" : "text-amber-400"
                        }`}
                      >
                        {item.rate}%
                      </Text>
                      <Text className="text-white/40 text-xs">
                        ({item.presentCount}/{item.totalStudents})
                      </Text>
                    </View>
                  </View>

                  {/* Progress Track */}
                  <View className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <LinearGradient
                      colors={
                        isHigh
                          ? ["#00f1a1", "#059669"]
                          : isMedium
                          ? ["#ddb7ff", "#9333ea"]
                          : ["#fcd34d", "#d97706"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ width: `${item.rate}%`, height: "100%", borderRadius: 999 }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 7. MY LEAVE APPLICATIONS STATUS */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center">
              <Calendar size={18} color="#f472b6" style={{ marginRight: 6 }} />
              <Text className="text-white text-lg font-extrabold">My Leave Requests</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate("Leave")}
              className="flex-row items-center active:opacity-80"
            >
              <Text className="text-[#f472b6] text-xs font-bold mr-1">Apply Leave</Text>
              <Plus size={14} color="#f472b6" />
            </Pressable>
          </View>

          <View className="bg-[#181524] border border-white/10 rounded-3xl p-4 shadow-lg">
            {myLeaves.map((lev, idx) => (
              <View
                key={lev.id}
                className={`py-3 flex-row items-center justify-between ${
                  idx < myLeaves.length - 1 ? "border-b border-white/10" : ""
                }`}
              >
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center mb-0.5">
                    <Text className="text-white font-bold text-sm mr-2">{lev.type}</Text>
                    <Text className="text-white/50 text-xs">
                      • {lev.days} {lev.days > 1 ? "Days" : "Day"}
                    </Text>
                  </View>
                  <Text className="text-[#ddb7ff] text-xs font-semibold mb-0.5">
                    {lev.from} → {lev.to}
                  </Text>
                  <Text className="text-white/60 text-xs" numberOfLines={1}>
                    Reason: {lev.reason}
                  </Text>
                </View>

                <View
                  className={`px-3 py-1 rounded-full border ${
                    lev.status === "Approved"
                      ? "bg-emerald-500/20 border-emerald-500/40"
                      : lev.status === "Pending"
                      ? "bg-amber-500/20 border-amber-500/40"
                      : "bg-rose-500/20 border-rose-500/40"
                  }`}
                >
                  <Text
                    className={`text-xs font-black uppercase ${
                      lev.status === "Approved"
                        ? "text-emerald-300"
                        : lev.status === "Pending"
                        ? "text-amber-300"
                        : "text-rose-300"
                    }`}
                  >
                    {lev.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 8. SYSTEM NOTICES & ANNOUNCEMENTS */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center">
              <Bell size={18} color="#ddb7ff" style={{ marginRight: 6 }} />
              <Text className="text-white text-lg font-extrabold">System Notices</Text>
            </View>
            <Text className="text-white/50 text-xs font-semibold">Live Broadcasts</Text>
          </View>

          <View className="space-y-3">
            {systemNotices.map((notice) => (
              <View
                key={notice.id}
                className="bg-[#181524] border border-white/10 rounded-2xl p-4 shadow-md mb-2.5"
              >
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-2 h-2 rounded-full bg-[#ddb7ff] mr-2" />
                    <Text numberOfLines={1} className="text-white font-extrabold text-sm flex-1">
                      {notice.title}
                    </Text>
                  </View>
                  <Text className="text-white/40 text-[11px] font-medium">{notice.time}</Text>
                </View>
                <Text className="text-white/70 text-xs leading-relaxed mt-1">
                  {notice.message}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* QUICK FLOATING ACTION BUTTON (FAB) */}
      <Pressable
        onPress={() => setShowQuickActionModal(true)}
        className="absolute bottom-[100px] right-6 w-14 h-14 bg-[#ddb7ff] rounded-2xl items-center justify-center shadow-2xl z-50 border border-white/20 active:scale-95"
        style={{
          shadowColor: "#ddb7ff",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.45,
          shadowRadius: 10,
          elevation: 12,
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Plus size={28} color="#161224" />
      </Pressable>

      {/* QUICK ACTIONS MODAL DIALOG */}
      {showQuickActionModal && (
        <Modal
          visible={showQuickActionModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQuickActionModal(false)}
        >
          <View className="flex-1 bg-black/80 items-center justify-center p-5">
            <View className="w-full max-w-sm bg-[#181524] border border-[#ddb7ff]/30 rounded-3xl p-5 shadow-2xl">
              <View className="flex-row items-center justify-between pb-3 border-b border-white/10 mb-4">
                <View className="flex-row items-center">
                  <Layers size={20} color="#ddb7ff" style={{ marginRight: 8 }} />
                  <Text className="text-white font-extrabold text-base">Quick Actions</Text>
                </View>
                <Pressable
                  onPress={() => setShowQuickActionModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                >
                  <X size={16} color="white" />
                </Pressable>
              </View>

              <View className="gap-2.5">
                <Pressable
                  onPress={() => {
                    setShowQuickActionModal(false);
                    navigation.navigate("Attendance");
                  }}
                  className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex-row items-center active:bg-[#ddb7ff]/20"
                >
                  <View className="w-10 h-10 rounded-xl bg-[#ddb7ff]/20 items-center justify-center mr-3">
                    <ClipboardCheck size={20} color="#ddb7ff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-extrabold text-sm">Mark Attendance</Text>
                    <Text className="text-white/50 text-xs">Allot student presence for today</Text>
                  </View>
                  <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowQuickActionModal(false);
                    navigation.navigate("DailyDiary");
                  }}
                  className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex-row items-center active:bg-[#ddb7ff]/20"
                >
                  <View className="w-10 h-10 rounded-xl bg-purple-500/20 items-center justify-center mr-3">
                    <BookOpen size={20} color="#c084fc" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-extrabold text-sm">Post Daily Diary</Text>
                    <Text className="text-white/50 text-xs">Share class summary & updates</Text>
                  </View>
                  <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowQuickActionModal(false);
                    navigation.navigate("Homework");
                  }}
                  className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex-row items-center active:bg-[#ddb7ff]/20"
                >
                  <View className="w-10 h-10 rounded-xl bg-sky-500/20 items-center justify-center mr-3">
                    <ClipboardList size={20} color="#38bdf8" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-extrabold text-sm">Add Homework</Text>
                    <Text className="text-white/50 text-xs">Assign exercises and deadlines</Text>
                  </View>
                  <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowQuickActionModal(false);
                    navigation.navigate("Leave");
                  }}
                  className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex-row items-center active:bg-[#ddb7ff]/20"
                >
                  <View className="w-10 h-10 rounded-xl bg-rose-500/20 items-center justify-center mr-3">
                    <CalendarOff size={20} color="#f472b6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-extrabold text-sm">Apply For Leave</Text>
                    <Text className="text-white/50 text-xs">Submit absence request</Text>
                  </View>
                  <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* NOTIFICATIONS MODAL */}
      {showNotificationModal && (
        <Modal
          visible={showNotificationModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View className="flex-1 bg-black/80 items-center justify-center p-5">
            <View className="w-full max-w-sm bg-[#181524] border border-[#ddb7ff]/30 rounded-3xl p-5 shadow-2xl max-h-[80%]">
              <View className="flex-row items-center justify-between pb-3 border-b border-white/10 mb-4">
                <View className="flex-row items-center">
                  <Bell size={20} color="#ddb7ff" style={{ marginRight: 8 }} />
                  <Text className="text-white font-extrabold text-base">Faculty Notifications</Text>
                </View>
                <Pressable
                  onPress={() => setShowNotificationModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                >
                  <X size={16} color="white" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {systemNotices.map((n) => (
                  <View key={n.id} className="p-3 bg-white/5 rounded-2xl border border-white/10 mb-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-[#ddb7ff] font-extrabold text-xs">{n.category}</Text>
                      <Text className="text-white/40 text-[10px]">{n.time}</Text>
                    </View>
                    <Text className="text-white font-bold text-sm mb-1">{n.title}</Text>
                    <Text className="text-white/70 text-xs leading-relaxed">{n.message}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* LEFT SIDEBAR DRAWER MODAL (Profile Details & Sign Out - Teacher Theme) */}
      {showSidebarModal && (
        <Modal
          visible={showSidebarModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSidebarModal(false)}
        >
          <View className="flex-1 bg-black/80 flex-row">
            <View
              {...sidebarSwipeResponder.panHandlers}
              className="w-[82%] max-w-xs h-full p-5 flex-col justify-between border-r border-[#ddb7ff]/30"
              style={{
                backgroundColor: "#120f1f",
                paddingTop: Math.max(insets.top, 20) + 8,
                paddingBottom: Math.max(insets.bottom, 20) + 12,
              }}
            >
              {/* Sidebar Header & Close */}
              <View>
                <View className="flex-row justify-between items-center pb-4 border-b border-white/10 mb-5">
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-xl bg-[#ddb7ff]/20 border border-[#ddb7ff]/40 items-center justify-center mr-2.5">
                      <GraduationCap size={20} color="#ddb7ff" />
                    </View>
                    <View>
                      <Text className="text-white font-extrabold text-sm">EduVision</Text>
                      <Text className="text-[#ddb7ff] text-[9px] font-bold uppercase tracking-widest">
                        TEACHER PORTAL
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setShowSidebarModal(false)} className="p-1 active:scale-95">
                    <X size={20} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                </View>

                {/* Profile Avatar Card */}
                <View className="bg-black/60 p-4 rounded-3xl border border-[#ddb7ff]/20 mb-5 items-center">
                  <View className="w-16 h-16 rounded-full items-center justify-center mb-3 bg-[#ddb7ff]/20 border-2 border-[#ddb7ff] shadow-[0_0_15px_rgba(221,183,255,0.3)] overflow-hidden">
                    {user?.avatar ? (
                      <Image source={{ uri: user.avatar }} className="w-full h-full rounded-full" />
                    ) : (
                      <Text className="text-[#ddb7ff] font-extrabold text-xl">{userInitials}</Text>
                    )}
                  </View>
                  <Text className="text-white font-extrabold text-base text-center">{displayName}</Text>
                  <Text className="text-white/50 text-xs text-center mt-0.5">{displayEmail}</Text>

                  <View className="px-3 py-1 rounded-xl mt-3 bg-[#ddb7ff]/20 border border-[#ddb7ff]/40">
                    <Text className="text-[#ddb7ff] text-[10px] font-black uppercase tracking-wider">
                      {user?.designation || "SENIOR FACULTY"}
                    </Text>
                  </View>
                </View>

                {/* Staff Info Details List */}
                <View className="bg-white/5 p-3.5 rounded-2xl border border-white/10 mb-4" style={{ gap: 10 }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">Faculty ID</Text>
                    <Text className="text-white font-extrabold text-xs">TCH-2026-42</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">Class Assigned</Text>
                    <Text className="text-[#ddb7ff] font-bold text-xs">
                      {classTeacherOf ? `${classTeacherOf} (Class Teacher)` : "Subject Faculty"}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">Department</Text>
                    <Text className="text-white font-bold text-xs">Mathematics & Sciences</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">Campus</Text>
                    <Text className="text-white font-bold text-xs">KTS Central Campus</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">System Version</Text>
                    <Text className="text-white/70 font-semibold text-xs">v2.4.0 (Expo SDK 56)</Text>
                  </View>
                </View>
              </View>

              {/* Bottom Actions: Fast navigation & Sign Out */}
              <View className="pb-6">
                <Pressable
                  onPress={() => {
                    setShowSidebarModal(false);
                    navigation.navigate("Attendance");
                  }}
                  className="w-full py-3.5 px-4 mb-2.5 bg-white/5 border border-white/15 rounded-2xl flex-row items-center justify-between active:bg-white/10"
                >
                  <View className="flex-row items-center">
                    <ClipboardCheck size={18} color="#ddb7ff" style={{ marginRight: 10 }} />
                    <Text className="text-white font-extrabold text-xs">Mark Attendance</Text>
                  </View>
                  <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowSidebarModal(false);
                    navigation.navigate("Leave");
                  }}
                  className="w-full py-3.5 px-4 mb-2.5 bg-white/5 border border-white/15 rounded-2xl flex-row items-center justify-between active:bg-white/10"
                >
                  <View className="flex-row items-center">
                    <CalendarOff size={18} color="#ddb7ff" style={{ marginRight: 10 }} />
                    <Text className="text-white font-extrabold text-xs">Leave Applications</Text>
                  </View>
                  <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowSidebarModal(false);
                    setShowSignOutModal(true);
                  }}
                  className="w-full py-3.5 bg-rose-500/20 border border-rose-500/50 rounded-2xl flex-row items-center justify-center active:bg-rose-500/30"
                >
                  <LogOut size={18} color="#ff516a" style={{ marginRight: 8 }} />
                  <Text className="text-[#ff516a] font-extrabold text-xs uppercase tracking-wider">
                    Sign Out
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Tap Backdrop Outside Drawer to Dismiss */}
            <Pressable onPress={() => setShowSidebarModal(false)} className="flex-1" />
          </View>
        </Modal>
      )}

      {/* SIGN OUT CONFIRMATION MODAL */}
      {showSignOutModal && (
        <Modal
          visible={showSignOutModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSignOutModal(false)}
        >
          <View className="flex-1 bg-black/80 items-center justify-center p-5">
            <View className="w-full max-w-sm bg-[#181524] border border-rose-500/30 rounded-3xl p-6 shadow-2xl">
              <View className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 items-center justify-center self-center mb-4">
                <LogOut size={28} color="#ff516a" />
              </View>

              <Text className="text-white text-xl font-extrabold text-center mb-2">
                Sign Out
              </Text>
              <Text className="text-white/60 text-sm text-center leading-relaxed mb-6">
                Are you sure you want to sign out from your Teacher Portal? You will need to enter your credentials to log in again.
              </Text>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowSignOutModal(false)}
                  className="flex-1 py-3.5 bg-white/10 rounded-2xl items-center justify-center active:bg-white/20 border border-white/10"
                >
                  <Text className="text-white font-bold text-sm">Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleSignOut}
                  className="flex-1 py-3.5 bg-rose-600 rounded-2xl items-center justify-center active:bg-rose-700 shadow-lg shadow-rose-600/40"
                >
                  <Text className="text-white font-bold text-sm">Sign Out</Text>
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

export default TeacherDashboard;
