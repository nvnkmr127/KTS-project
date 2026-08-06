import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl, Modal, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { GlassCard } from '../../components/GlassCard';
import { AdminStatCard } from '../../components/AdminStatCard';
import { QuickActionIcon } from '../../components/QuickActionIcon';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Users, Banknote, CalendarDays, Bus, 
  Search, UserSquare2, Wallet, CalendarRange, 
  FileEdit, ClipboardCheck, ArrowLeftRight, 
  Megaphone, UserPlus, Phone, MessageCircle, X, Check,
  ShieldCheck, Bell, UserCheck, BookOpen, TrendingUp,
  GraduationCap, Tag, Palmtree, CalendarOff, BarChart2, Layers,
  UserSearch, PhoneCall, HelpCircle, School, FileBarChart, Trash2, CheckCircle2,
  LogOut, Mail, Building2, Smartphone, History, ChevronRight, Settings
} from 'lucide-react-native';

interface QuickAction {
  title: string;
  icon: React.ReactNode;
  route: string;
  params?: Record<string, any>;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  category: 'Fees' | 'Leaves' | 'System' | 'Bus';
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', title: 'Term 2 Fee Collection Summary', message: '₹42,500 collected today across Class 10-A and 9-B.', time: '10 mins ago', category: 'Fees', read: false },
  { id: 'n2', title: 'Pending Staff Leave Applications', message: '5 staff leave applications pending review.', time: '35 mins ago', category: 'Leaves', read: false },
  { id: 'n3', title: 'Bus Live Movement Alert', message: 'Bus TS07UP2292 completed Morning Route 1.', time: '1 hour ago', category: 'Bus', read: false },
  { id: 'n4', title: 'Parent Fee Reminder Broadcast', message: 'Automated fee due reminder dispatched to 480 parents.', time: '2 hours ago', category: 'Fees', read: true },
];

export const AdminStaffDashboard: React.FC<any> = ({ navigation: propNavigation }) => {
  const defaultNavigation = useNavigation<any>();
  const navigation = propNavigation || defaultNavigation;
  const { user, logout } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSidebarModal, setShowSidebarModal] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'All' | 'Fees' | 'Leaves' | 'System' | 'Bus'>('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const [stats, setStats] = useState({
    studentsCount: '1,248',
    feesDue: '₹2.3L',
    pendingLeaves: '5',
    activeBuses: '8',
  });

  const [feeDefaulters, setFeeDefaulters] = useState([
    { id: 1, initials: 'AG', name: 'Aman Gupta', classInfo: '10-A', amount: '₹4,500', color: 'bg-emerald-950/40 text-emerald-400' },
    { id: 2, initials: 'RS', name: 'Riya Sen', classInfo: '8-B', amount: '₹1,200', color: 'bg-emerald-950/40 text-emerald-400' },
    { id: 3, initials: 'KP', name: 'Kevin Peters', classInfo: '12-C', amount: '₹8,900', color: 'bg-emerald-950/40 text-emerald-400' },
  ]);

  const [leaveRequests, setLeaveRequests] = useState([
    { id: 1, name: 'Mrs. Anita Sharma', type: 'Sick Leave', date: '24 Oct - 26 Oct' },
    { id: 2, name: 'Mr. Rajesh Kumar', type: 'Casual Leave', date: '25 Oct' },
  ]);

  // Safe BackHandler effect
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
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

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [showSidebarModal, showNotificationModal])
  );

  const fetchLiveDashboardData = async () => {
    try {
      // 1. Fetch Students count
      const students = await api.getResources('students');
      let studentCountStr = stats.studentsCount;
      if (Array.isArray(students)) {
        studentCountStr = String(students.length);
      }

      // 2. Fetch Fee Records
      const fees = await api.getResources('student-fees');
      let feeDueSum = 0;
      if (Array.isArray(fees)) {
        fees.forEach((f: any) => {
          if (f.status === 'unpaid' || f.status === 'partial' || f.status === 'overdue') {
            feeDueSum += Number(f.due_amount || f.amount || 0);
          }
        });
        if (feeDueSum > 0) {
          stats.feesDue = feeDueSum >= 100000 ? `₹${(feeDueSum / 100000).toFixed(1)}L` : `₹${feeDueSum.toLocaleString()}`;
        }
      }

      // 3. Fetch Leaves
      const leaves = await api.getResources('leaves');
      if (Array.isArray(leaves)) {
        const pending = leaves.filter((l: any) => l.status === 'pending' || l.status === 'Pending');
        setStats(prev => ({
          ...prev,
          studentsCount: studentCountStr,
          pendingLeaves: String(pending.length),
        }));

        if (pending.length > 0) {
          setLeaveRequests(pending.slice(0, 3).map((l: any, idx: number) => ({
            id: l.id || idx,
            name: l.applicant_name || l.user_name || l.staff_name || 'Staff Member',
            type: l.leave_type || l.type || 'Leave',
            date: l.start_date ? `${l.start_date} - ${l.end_date || l.start_date}` : 'Today'
          })));
        }
      } else {
        setStats(prev => ({ ...prev, studentsCount: studentCountStr }));
      }

      // 4. Fetch Live Notifications
      const notifs = await api.getNotifications();
      if (Array.isArray(notifs) && notifs.length > 0) {
        const mapped = notifs.map((n: any) => ({
          id: String(n.id || Date.now()),
          title: n.title || 'System Alert',
          message: n.message || n.body || 'New administrative notification.',
          time: n.created_at || 'Recently',
          category: (n.category || 'System') as any,
          read: !!n.read,
        }));
        setNotifications(mapped);
      }
    } catch (e) {
      console.log('Error fetching live dashboard metrics:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveDashboardData();
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSignOut = () => {
    setShowSidebarModal(false);
    logout();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const isSuperAdmin = user?.role === 'super_admin';
  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';
  const primaryPillClass = isSuperAdmin ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-emerald-500/15 border border-emerald-500/30';

  const quickActions: QuickAction[] = [
    { title: 'Student Profiles', icon: <UserSquare2 size={24} color={primaryColor} />, route: 'StudentDirectory' },
    { title: 'Add Student', icon: <UserPlus size={24} color={primaryColor} />, route: 'AddStudent' },
    { title: 'Classes', icon: <School size={24} color={primaryColor} />, route: 'ClassManagement' },
    { title: 'Student Attendance', icon: <UserCheck size={24} color={primaryColor} />, route: 'AdminStudentAttendance' },
    { title: 'Daily Diary View', icon: <BookOpen size={24} color={primaryColor} />, route: 'AdminDailyDiary' },
    { title: 'Classes Promotions', icon: <TrendingUp size={24} color={primaryColor} />, route: 'ClassPromotions' },
    { title: 'Alumni', icon: <GraduationCap size={24} color={primaryColor} />, route: 'AlumniManagement' },
    { title: 'Fee Collection', icon: <Wallet size={24} color={primaryColor} />, route: 'FeeList' },
    { title: 'Fee Category', icon: <Tag size={24} color={primaryColor} />, route: 'FeeCategory' },
    { title: 'Holiday Calendar', icon: <CalendarDays size={24} color={primaryColor} />, route: 'HolidayCalendar' },
    { title: 'Staff Leaves', icon: <CalendarOff size={24} color={primaryColor} />, route: 'AdminStaffLeaves' },
    { title: 'Timetable Builder', icon: <CalendarRange size={24} color={primaryColor} />, route: 'TimetableBuilder' },
    { title: 'Exam Schedule', icon: <FileEdit size={24} color={primaryColor} />, route: 'ExamSchedule' },
    { title: 'Substitution Assign', icon: <ArrowLeftRight size={24} color={primaryColor} />, route: 'SubstitutionManagement' },
    { title: 'Circulars', icon: <Megaphone size={24} color={primaryColor} />, route: 'AdminAlertConfiguration' },
    { title: 'Enquiry Leads', icon: <UserSearch size={24} color={primaryColor} />, route: 'EnquiryLeads' },
    { title: 'Staff Attendance', icon: <UserCheck size={24} color={primaryColor} />, route: 'StaffAttendance' },
    { title: 'Bus Tracking', icon: <Bus size={24} color={primaryColor} />, route: 'AdminBusTracking' },
    { title: 'Reports & Analytics', icon: <FileBarChart size={24} color={primaryColor} />, route: 'AdminReportsAnalytics' },
    { title: 'Recycle Bin', icon: <Trash2 size={24} color={primaryColor} />, route: 'RecycleBin' },
  ];

  const filteredNotifications = notifications.filter(n => 
    notificationFilter === 'All' || n.category === notificationFilter
  );

  return (
    <View style={[styles.container, isSuperAdmin && { backgroundColor: '#101415' }]}>
      <LinearGradient
        colors={isSuperAdmin ? ['#1d2022', '#101415'] : ['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <AdminStaffHeader 
        onIconPress={() => setShowSidebarModal(true)}
        title="EduVision"
        subtitle={isSuperAdmin ? "Super Admin Terminal" : "Admin Staff Terminal"}
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <ShieldCheck size={22} color={primaryColor} />
          </View>
        }
        rightAction={
          <Pressable 
            onPress={() => setShowNotificationModal(true)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center relative active:bg-white/10"
          >
            <Bell size={18} color={primaryColor} />
            {unreadCount > 0 && (
              <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ff516a] rounded-full items-center justify-center shadow-[0_0_6px_rgba(255,81,106,0.8)]" />
            )}
          </Pressable>
        }
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00f1a1" />
        }
      >
        {/* Welcome Section */}
        <View className="mb-6 px-5">
          <Text className="text-white/90 text-xl font-bold mb-1">Welcome, {user?.name || 'Sarah'}</Text>
          <Text className="text-white/60 text-sm">Good morning! Here's the live system overview.</Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row mb-3 px-5" style={{ gap: 12 }}>
          <AdminStatCard 
            title="STUDENTS" 
            value={stats.studentsCount} 
            icon={<Users size={20} color={primaryColor} />}
            progress={0.65}
            onPress={() => navigation.navigate('StudentDirectory')}
          />
          <AdminStatCard 
            title="FEES DUE" 
            value={stats.feesDue} 
            icon={<Banknote size={20} color={primaryColor} />}
            trend="Live database sync"
            onPress={() => navigation.navigate('FeeList')}
          />
        </View>

        <View className="flex-row mb-6 px-5" style={{ gap: 12 }}>
          <AdminStatCard 
            title="PENDING LEAVES" 
            value={stats.pendingLeaves} 
            icon={<CalendarDays size={20} color={primaryColor} />}
            progress={0.25}
            onPress={() => navigation.navigate('AdminStaffLeaves')}
          />
          <AdminStatCard 
            title="ACTIVE BUSES" 
            value={stats.activeBuses} 
            icon={<Bus size={20} color={primaryColor} />}
            trend="GPS Live"
            onPress={() => navigation.navigate('AdminBusTracking')}
          />
        </View>

        {/* Quick Actions Grid */}
        <View className="mb-6 px-5">
          <Text className="text-white/80 text-sm font-bold uppercase tracking-wider mb-4">Quick Management Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            {quickActions.map((action, index) => (
              <QuickActionIcon
                key={index}
                title={action.title}
                icon={action.icon}
                onPress={() => navigation.navigate(action.route, action.params)}
              />
            ))}
          </View>
        </View>

        {/* Priority Action Lists */}
        <View className="mb-6 px-5">
          <Text className="text-white/80 text-sm font-bold uppercase tracking-wider mb-3">Pending Fee Overdue (Top 3)</Text>
          {feeDefaulters.map((item) => (
            <GlassCard key={item.id} className="p-3 mb-2 flex-row justify-between items-center bg-[#101415]/90 border-white/10" intensity="low">
              <View className="flex-row items-center gap-3">
                <View className={`w-9 h-9 rounded-xl ${primaryBadgeClass} items-center justify-center`}>
                  <Text className={`${primaryTextClass} font-bold text-xs`}>{item.initials}</Text>
                </View>
                <View>
                  <Text className="text-white font-bold text-sm">{item.name}</Text>
                  <Text className="text-white/50 text-xs">Class {item.classInfo}</Text>
                </View>
              </View>
              <Text className={`${primaryTextClass} font-extrabold text-sm`}>{item.amount}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Staff Leave Requests */}
        <View className="mb-6 px-5">
          <Text className="text-white/80 text-sm font-bold uppercase tracking-wider mb-3">Recent Leave Approvals</Text>
          {leaveRequests.map((item) => (
            <GlassCard key={item.id} className="p-3 mb-2 bg-[#101415]/90 border-white/10" intensity="low">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-white font-bold text-sm">{item.name}</Text>
                  <Text className="text-white/50 text-xs">{item.type} • {item.date}</Text>
                </View>
                <Pressable onPress={() => navigation.navigate('AdminStaffLeaves')} className={`p-2 rounded-xl ${primaryBadgeClass}`}>
                  <Check size={16} color={primaryColor} />
                </Pressable>
              </View>
            </GlassCard>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* LEFT SIDEBAR DRAWER MODAL (Profile Details & Sign Out) */}
      {showSidebarModal && (
        <Modal visible={showSidebarModal} transparent animationType="fade" onRequestClose={() => setShowSidebarModal(false)}>
          <View className="flex-1 bg-black/80 flex-row">
            <View className="w-[82%] max-w-xs h-full p-5 flex-col justify-between border-r border-white/15" style={{ backgroundColor: '#101415' }}>
              
              {/* Sidebar Header & Close */}
              <View>
                <View className="flex-row justify-between items-center pb-4 border-b border-white/10 mb-5 pt-4">
                  <View className="flex-row items-center">
                    <View className={`w-9 h-9 rounded-xl items-center justify-center mr-2.5 ${primaryBadgeClass}`}>
                      <ShieldCheck size={20} color={primaryColor} />
                    </View>
                    <View>
                      <Text className="text-white font-extrabold text-sm">EduVision</Text>
                      <Text className={`${primaryTextClass} text-[9px] font-bold`}>{isSuperAdmin ? "Super Admin Console" : "Admin Staff Portal"}</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setShowSidebarModal(false)} className="p-1">
                    <X size={20} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                </View>

                {/* Profile Avatar Card */}
                <View className="bg-black/60 p-4 rounded-3xl border border-white/10 mb-5 items-center">
                  <View className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${primaryBadgeClass}`}>
                    <Text className={`${primaryTextClass} font-extrabold text-xl`}>
                      {(user?.name || 'Sarah Jenkins').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Text>
                  </View>
                  <Text className="text-white font-extrabold text-base text-center">{user?.name || 'Sarah Jenkins'}</Text>
                  <Text className="text-white/50 text-xs text-center mt-0.5">{user?.email || 'sarah.jenkins@kts.edu.in'}</Text>

                  <View className={`px-3 py-1 rounded-xl mt-3 ${primaryBadgeClass}`}>
                    <Text className={`${primaryTextClass} text-[10px] font-black uppercase`}>{isSuperAdmin ? "SUPER ADMIN CONSOLE" : "ADMIN STAFF CONSOLE"}</Text>
                  </View>
                </View>

                {/* Staff Info Details List */}
                <View className="bg-white/5 p-3.5 rounded-2xl border border-white/10 mb-4" style={{ gap: 10 }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">Employee ID</Text>
                    <Text className="text-white font-extrabold text-xs">EMP-2026-88</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">Department</Text>
                    <Text className={`${primaryTextClass} font-bold text-xs`}>{isSuperAdmin ? "Super Administration" : "Administration"}</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">Campus</Text>
                    <Text className="text-white font-bold text-xs">KTS Main Campus</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">System Version</Text>
                    <Text className="text-white/70 font-semibold text-xs">v2.4.0 (Expo v56)</Text>
                  </View>
                </View>
              </View>

              {/* Bottom Actions: Settings, Activity Log & Sign Out */}
              <View className="pb-6">
                <Pressable
                  onPress={() => {
                    setShowSidebarModal(false);
                    navigation.navigate('AdminStaffSettings');
                  }}
                  className="w-full py-3.5 px-4 mb-2.5 bg-white/5 border border-white/15 rounded-2xl flex-row items-center justify-between active:bg-white/10"
                >
                  <View className="flex-row items-center">
                    <Settings size={18} color={primaryColor} style={{ marginRight: 10 }} />
                    <Text className="text-white font-extrabold text-xs">Settings</Text>
                  </View>
                  <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowSidebarModal(false);
                    navigation.navigate('AdminActivityLog');
                  }}
                  className={`w-full py-3.5 px-4 mb-2.5 rounded-2xl flex-row items-center justify-between ${primaryBadgeClass}`}
                >
                  <View className="flex-row items-center">
                    <History size={18} color={primaryColor} style={{ marginRight: 10 }} />
                    <Text className={`${primaryTextClass} font-extrabold text-xs`}>Activity Log</Text>
                  </View>
                  <ChevronRight size={16} color={primaryColor} />
                </Pressable>

                <Pressable
                  onPress={handleSignOut}
                  className="w-full py-3.5 bg-rose-500/20 border border-rose-500/50 rounded-2xl flex-row items-center justify-center active:bg-rose-500/30"
                >
                  <LogOut size={18} color="#ff516a" style={{ marginRight: 8 }} />
                  <Text className="text-[#ff516a] font-extrabold text-xs uppercase tracking-wider">Sign Out</Text>
                </Pressable>
              </View>

            </View>

            {/* Tap Backdrop Outside Drawer to Dismiss */}
            <Pressable onPress={() => setShowSidebarModal(false)} className="flex-1" />
          </View>
        </Modal>
      )}

      {/* NOTIFICATION CARD MODAL (Top-Right Popover Below Bell Icon) */}
      {showNotificationModal && (
        <Modal visible={showNotificationModal} transparent animationType="fade" onRequestClose={() => setShowNotificationModal(false)}>
          <Pressable 
            onPress={() => setShowNotificationModal(false)}
            className="flex-1 bg-black/60 pt-20 px-4 items-end"
          >
            <Pressable 
              onPress={(e) => e.stopPropagation()} 
              className={`w-[92%] max-w-sm p-4 border rounded-3xl shadow-2xl ${isSuperAdmin ? 'border-[#f0c110]/40' : 'border-white/20'}`} 
              style={{ backgroundColor: '#101415', marginTop: 8 }}
            >
              
              {/* Header Bar */}
              <View className="flex-row justify-between items-center pb-3 border-b border-white/10 mb-4">
                <View className="flex-row items-center">
                  <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${primaryBadgeClass}`}>
                    <Bell size={16} color={primaryColor} />
                  </View>
                  <View>
                    <Text className="text-white font-extrabold text-base">Notification Center</Text>
                    <Text className={`${primaryTextClass} text-[10px] font-bold`}>{unreadCount} Unread System Alerts</Text>
                  </View>
                </View>
                
                <Pressable onPress={() => setShowNotificationModal(false)} className="p-1">
                  <X size={20} color="rgba(255,255,255,0.6)" />
                </Pressable>
              </View>

              {/* Notification Category Filters */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                <View className="flex-row" style={{ gap: 6 }}>
                  {(['All', 'Fees', 'Leaves', 'Bus', 'System'] as const).map(cat => {
                    const isSel = notificationFilter === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setNotificationFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl border ${isSel ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/5 border-white/10'}`}
                      >
                        <Text className={`text-[10px] font-bold ${isSel ? 'text-[#101415]' : 'text-white/70'}`}>{cat}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Notifications List */}
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }} className="mb-4">
                {filteredNotifications.length === 0 ? (
                  <View className="py-8 items-center justify-center">
                    <Text className="text-white/40 text-xs font-bold">No notifications in this category.</Text>
                  </View>
                ) : (
                  filteredNotifications.map(n => (
                    <View 
                      key={n.id} 
                      className={`p-3 rounded-2xl mb-2.5 border ${
                        n.read ? 'bg-white/5 border-white/5' : primaryBadgeClass
                      }`}
                    >
                      <View className="flex-row justify-between items-start mb-1">
                        <Text className="text-white font-extrabold text-xs flex-1 mr-2">{n.title}</Text>
                        <Text className="text-white/40 text-[9px]">{n.time}</Text>
                      </View>
                      <Text className="text-white/70 text-[11px] leading-snug">{n.message}</Text>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Footer Actions */}
              <View className="flex-row" style={{ gap: 8 }}>
                <Pressable
                  onPress={handleMarkAllRead}
                  className="flex-1 py-2.5 bg-white/10 rounded-xl items-center flex-row justify-center"
                >
                  <CheckCircle2 size={14} color={primaryColor} style={{ marginRight: 4 }} />
                  <Text className="text-white text-xs font-bold">Mark All Read</Text>
                </Pressable>

                <Pressable
                  onPress={() => setShowNotificationModal(false)}
                  className={`flex-1 py-2.5 rounded-xl items-center ${primaryBtnClass}`}
                >
                  <Text className="text-[#101415] text-xs font-extrabold uppercase">Close</Text>
                </Pressable>
              </View>

            </Pressable>
          </Pressable>
        </Modal>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
});

export default AdminStaffDashboard;
