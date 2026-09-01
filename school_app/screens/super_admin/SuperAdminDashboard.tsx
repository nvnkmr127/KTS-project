import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Modal, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  School, Users, TrendingUp, TrendingDown, LayoutGrid, 
  UserCheck, Banknote, BarChart, Megaphone, CalendarCheck, 
  Briefcase, Receipt, ShieldCheck, Settings, AlertTriangle, 
  ChevronRight, Info, Check, Tag, Key, Bell, X, CheckCircle2,
  LogOut, History, Building2, Smartphone 
} from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  category: 'Fees' | 'Leaves' | 'Staff' | 'System' | 'Bus';
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', title: 'Morning Attendance Complete', message: '98.2% reported by Class Teachers. 4 faculty logs verified.', time: '15 mins ago', category: 'Staff', read: false },
  { id: 'n2', title: 'Pending Staff Leave Applications', message: 'Prof. Michael Chen submitted sick leave request for review.', time: '35 mins ago', category: 'Leaves', read: false },
  { id: 'n3', title: 'Term Fee Installments Collected', message: '₹1.42L collected today across Senior secondary batches.', time: '1 hour ago', category: 'Fees', read: false },
  { id: 'n4', title: 'Biometric Server Sync Status', message: 'e-TimeOffice biometric terminal device online and synchronized.', time: '2 hours ago', category: 'System', read: true },
  { id: 'n5', title: 'Bus Fleet Movement Alert', message: 'All 8 GPS fleet buses completed morning pickup routes.', time: '3 hours ago', category: 'Bus', read: true },
];

export const SuperAdminDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isSmallPhone, isTablet, headerPaddingTop, scrollBottomPadding, containerStyle } = useResponsive();
  const { user, logout } = useAuthStore();

  const [showSidebarModal, setShowSidebarModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'All' | 'Fees' | 'Leaves' | 'Staff' | 'System' | 'Bus'>('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

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

  const handleSignOut = () => {
    setShowSidebarModal(false);
    logout();
  };

  // Custom alert dialog state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showCustomAlert = (title: string, message: string) => {
    setCustomAlert({ visible: true, title, message });
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = notifications.filter(n => 
    notificationFilter === 'All' || n.category === notificationFilter
  );

  // Format current date
  const getFormattedDate = () => {
    const options: any = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const handleEmergencyAlert = () => {
    showCustomAlert(
      "Emergency Broadcast Triggered",
      "System emergency notification dispatched to all student, parent, and teacher portals."
    );
  };

  // Neomorphic sparkline helper
  const renderSparkline = (heights: number[], color: string) => {
    return (
      <View className="flex-row items-end gap-1 h-10 w-16 opacity-60">
        {heights.map((h, i) => (
          <View 
            key={i} 
            className="w-1 rounded-full" 
            style={{ height: `${h}%`, backgroundColor: color }} 
          />
        ))}
      </View>
    );
  };

  const recentActivities = [
    { id: '1', title: 'Morning Attendance Complete', subtitle: '98.2% reported by Class Teachers', time: '09:15 AM', status: 'success', glowColor: '#41eec2' },
    { id: '2', title: 'Pending Fee Installments (32)', subtitle: 'Automated reminders sent to parents', time: '11:30 AM', status: 'warning', glowColor: '#f5c518' },
    { id: '3', title: 'Critical Low Inventory: Lab Assets', subtitle: 'Beakers and chemicals stock alert', time: '01:00 PM', status: 'danger', glowColor: '#ffb4ab' },
    { id: '4', title: 'Staff Meeting Minutes Published', subtitle: 'Shared with academic department heads', time: '02:45 PM', status: 'info', glowColor: '#41eec2' },
  ];

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1d2022', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header with Custom Glow Shadow */}
      <View style={{ zIndex: 50 }}>
        {/* Top App Bar */}
        <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          {/* Header Left Profile Area (Click to open Left Sidebar Drawer) */}
          <Pressable 
            onPress={() => setShowSidebarModal(true)} 
            className="flex-row items-center gap-3 flex-1 mr-2 active:opacity-80"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <View className="w-10 h-10 rounded-xl bg-[#f5c518] items-center justify-center shadow-[0_0_12px_rgba(245,197,24,0.4)]">
              <School size={22} color="#241a00" />
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-lg md:text-xl font-bold text-white font-display-lg">EduVision</Text>
              <Text numberOfLines={1} className="text-[9px] uppercase tracking-widest text-[#d1c5ac]">Super Admin Terminal</Text>
            </View>
          </Pressable>

          {/* Top Right Header Action Icons: Emergency Alert + Notification Bell (rightmost) */}
          <View className="flex-row items-center gap-2">
            <Pressable 
              onPress={handleEmergencyAlert} 
              className="w-10 h-10 rounded-full bg-red-600 items-center justify-center active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.6)]"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <AlertTriangle size={18} color="#FFF" />
            </Pressable>

            <Pressable 
              onPress={() => setShowNotificationModal(true)} 
              className="w-10 h-10 rounded-full bg-white/10 border border-white/15 items-center justify-center active:bg-white/20 active:scale-95 relative"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Bell size={18} color="#ffe5a0" />
              {/* Notification Active Dot Badge */}
              {unreadCount > 0 && (
                <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#f0c110] shadow-[0_0_6px_#f0c110]" />
              )}
            </Pressable>
          </View>
        </BlurView>
        
        {/* The glowing shadow below the line */}
        <LinearGradient 
          colors={['rgba(245, 197, 24, 0.15)', 'transparent']} 
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          containerStyle,
          { paddingBottom: scrollBottomPadding + 24 }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome greeting */}
        <View className="px-5 mb-6">
          <Text className="text-white text-2xl font-bold font-display-lg leading-tight">
            Welcome back, <Text className="text-[#ffe5a0]">Principal Sharma</Text>
          </Text>
          <Text className="text-[#d1c5ac] text-xs font-body-sm mt-1">{getFormattedDate()}</Text>
        </View>

        {/* Bento Stats Grid */}
        <View className="px-5 flex-row flex-wrap justify-between mb-8">
          {/* Stat 1: Total Students */}
          <GlassCard 
            className="w-[48%] p-4 mb-4 border border-white/10" 
            style={{ backgroundColor: '#1d2122', shadowColor: '#f5c518', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 }}
          >
            <View className="flex-row justify-between items-start mb-3">
              <Text className="text-[#d1c5ac] text-[10px] font-bold uppercase tracking-wider">Total Students</Text>
              <View className="flex-row items-center gap-0.5">
                <TrendingUp size={10} color="#41eec2" />
                <Text className="text-[#41eec2] text-[10px] font-bold">2%</Text>
              </View>
            </View>
            <View className="flex-row items-end justify-between">
              <Text className="text-white text-2xl font-bold">1,248</Text>
              {renderSparkline([30, 45, 35, 50, 40, 60, 55, 70], '#ffe5a0')}
            </View>
          </GlassCard>

          {/* Stat 2: Staff Present */}
          <GlassCard 
            className="w-[48%] p-4 mb-4 border border-white/10" 
            style={{ backgroundColor: '#1d2122', shadowColor: '#f5c518', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 }}
          >
            <View className="flex-row justify-between items-start mb-3">
              <Text className="text-[#d1c5ac] text-[10px] font-bold uppercase tracking-wider">Staff Present</Text>
              <View className="flex-row items-center gap-0.5">
                <TrendingDown size={10} color="#ffb4ab" />
                <Text className="text-[#ffb4ab] text-[10px] font-bold">1%</Text>
              </View>
            </View>
            <View className="flex-row items-end justify-between">
              <Text className="text-white text-2xl font-bold">68/72</Text>
              {renderSparkline([80, 75, 78, 70, 72, 68, 70, 68], '#ffb4ab')}
            </View>
          </GlassCard>

          {/* Stat 3: Fee Collected */}
          <GlassCard 
            className="w-[48%] p-4 mb-4 border border-white/10" 
            style={{ backgroundColor: '#1d2122', shadowColor: '#f5c518', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 }}
          >
            <View className="flex-row justify-between items-start mb-3">
              <Text className="text-[#d1c5ac] text-[10px] font-bold uppercase tracking-wider">Fee Collected</Text>
              <View className="flex-row items-center gap-0.5">
                <TrendingUp size={10} color="#41eec2" />
                <Text className="text-[#41eec2] text-[10px] font-bold">5%</Text>
              </View>
            </View>
            <View className="flex-row items-end justify-between">
              <Text className="text-white text-2xl font-bold">₹14.2L</Text>
              {renderSparkline([40, 50, 45, 60, 55, 75, 70, 85], '#41eec2')}
            </View>
          </GlassCard>

          {/* Stat 4: Avg Attendance */}
          <GlassCard 
            className="w-[48%] p-4 mb-4 border border-white/10" 
            style={{ backgroundColor: '#1d2122', shadowColor: '#f5c518', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 }}
          >
            <View className="flex-row justify-between items-start mb-3">
              <Text className="text-[#d1c5ac] text-[10px] font-bold uppercase tracking-wider">Avg Attendance</Text>
              <View className="flex-row items-center gap-0.5">
                <TrendingUp size={10} color="#41eec2" />
                <Text className="text-[#41eec2] text-[10px] font-bold">0.5%</Text>
              </View>
            </View>
            <View className="flex-row items-end justify-between">
              <Text className="text-white text-2xl font-bold">87.4%</Text>
              {renderSparkline([60, 65, 70, 68, 75, 80, 82, 87], '#41eec2')}
            </View>
          </GlassCard>
        </View>

        {/* Command Center Quick Actions Console */}
        <View className="px-5 mb-8">
          <View className="flex-row items-center gap-2 mb-4">
            <LayoutGrid size={20} color="#ffe5a0" />
            <Text className="text-white text-lg font-bold">Command Center</Text>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {/* ROW 1: Staff Management, Staff Attendance, Staff Access */}
            {/* Action 1: Staff Management */}
            <Pressable 
              onPress={() => navigation.navigate('StaffManagement')}
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderColor: 'rgba(240, 193, 16, 0.6)' }]}
              className="w-[31%] bg-white/5 border border-white/10 rounded-2xl p-3.5 items-center justify-center mb-3 active:bg-[#f0c110]/25 active:border-[#f0c110]/60 active:scale-95"
            >
              <Users size={24} color="#ffe5a0" />
              <Text className="text-white text-[10px] font-bold text-center mt-2" numberOfLines={2}>Staff Management</Text>
            </Pressable>

            {/* Action 2: Staff Attendance */}
            <Pressable 
              onPress={() => navigation.navigate('StaffAttendance')}
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderColor: 'rgba(240, 193, 16, 0.6)' }]}
              className="w-[31%] bg-white/5 border border-white/10 rounded-2xl p-3.5 items-center justify-center mb-3 active:bg-[#f0c110]/25 active:border-[#f0c110]/60 active:scale-95"
            >
              <UserCheck size={24} color="#ffe5a0" />
              <Text className="text-white text-[10px] font-bold text-center mt-2" numberOfLines={2}>Staff Attendance</Text>
            </Pressable>

            {/* Action 3: Staff Access */}
            <Pressable 
              onPress={() => navigation.navigate('Users')}
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderColor: 'rgba(240, 193, 16, 0.6)' }]}
              className="w-[31%] bg-white/5 border border-white/10 rounded-2xl p-3.5 items-center justify-center mb-3 active:bg-[#f0c110]/25 active:border-[#f0c110]/60 active:scale-95"
            >
              <Key size={24} color="#ffe5a0" />
              <Text className="text-white text-[10px] font-bold text-center mt-2" numberOfLines={2}>Staff Access</Text>
            </Pressable>

            {/* ROW 2: Salary Category, Salary & Payroll, Expenses */}
            {/* Action 4: Salary Category */}
            <Pressable 
              onPress={() => navigation.navigate('SalaryCategories')}
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderColor: 'rgba(240, 193, 16, 0.6)' }]}
              className="w-[31%] bg-white/5 border border-white/10 rounded-2xl p-3.5 items-center justify-center mb-3 active:bg-[#f0c110]/25 active:border-[#f0c110]/60 active:scale-95"
            >
              <Tag size={24} color="#ffe5a0" />
              <Text className="text-white text-[10px] font-bold text-center mt-2" numberOfLines={2}>Salary Category</Text>
            </Pressable>

            {/* Action 5: Salary & Payroll */}
            <Pressable 
              onPress={() => navigation.navigate('SalaryExpenses')}
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderColor: 'rgba(240, 193, 16, 0.6)' }]}
              className="w-[31%] bg-white/5 border border-white/10 rounded-2xl p-3.5 items-center justify-center mb-3 active:bg-[#f0c110]/25 active:border-[#f0c110]/60 active:scale-95"
            >
              <Briefcase size={24} color="#ffe5a0" />
              <Text className="text-white text-[10px] font-bold text-center mt-2" numberOfLines={2}>Salary & Payroll</Text>
            </Pressable>

            {/* Action 6: Expenses */}
            <Pressable 
              onPress={() => navigation.navigate('SalaryExpenses')}
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderColor: 'rgba(240, 193, 16, 0.6)' }]}
              className="w-[31%] bg-white/5 border border-white/10 rounded-2xl p-3.5 items-center justify-center mb-3 active:bg-[#f0c110]/25 active:border-[#f0c110]/60 active:scale-95"
            >
              <Receipt size={24} color="#ffe5a0" />
              <Text className="text-white text-[10px] font-bold text-center mt-2" numberOfLines={2}>Expenses</Text>
            </Pressable>

            {/* ROW 3: Admin Operations, Leave Approvals, Roles & Permissions */}
            {/* Action 7: Admin Operations */}
            <Pressable 
              onPress={() => navigation.navigate('SuperAdminAdminConsole')}
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderColor: 'rgba(240, 193, 16, 0.6)' }]}
              className="w-[31%] bg-white/5 border border-white/10 rounded-2xl p-3.5 items-center justify-center mb-3 active:bg-[#f0c110]/25 active:border-[#f0c110]/60 active:scale-95"
            >
              <LayoutGrid size={24} color="#ffe5a0" />
              <Text className="text-white text-[10px] font-bold text-center mt-2" numberOfLines={2}>Admin Operations</Text>
            </Pressable>

            {/* Action 8: Leave Approvals */}
            <Pressable 
              onPress={() => navigation.navigate('LeaveApprovals')}
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderColor: 'rgba(240, 193, 16, 0.6)' }]}
              className="w-[31%] bg-white/5 border border-white/10 rounded-2xl p-3.5 items-center justify-center mb-3 active:bg-[#f0c110]/25 active:border-[#f0c110]/60 active:scale-95"
            >
              <CalendarCheck size={24} color="#ffe5a0" />
              <Text className="text-white text-[10px] font-bold text-center mt-2" numberOfLines={2}>Leave Approvals</Text>
            </Pressable>

            {/* Action 9: Roles & Permissions */}
            <Pressable 
              onPress={() => navigation.navigate('RolesPermissions')}
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderColor: 'rgba(240, 193, 16, 0.6)' }]}
              className="w-[31%] bg-white/5 border border-white/10 rounded-2xl p-3.5 items-center justify-center mb-3 active:bg-[#f0c110]/25 active:border-[#f0c110]/60 active:scale-95"
            >
              <ShieldCheck size={24} color="#ffe5a0" />
              <Text className="text-white text-[10px] font-bold text-center mt-2" numberOfLines={2}>Roles & Permissions</Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Activity Feed */}
        <View className="px-5 mb-8">
          <View className="flex-row items-center gap-2 mb-4">
            <ShieldCheck size={20} color="#ffe5a0" />
            <Text className="text-white text-lg font-bold">Terminal Feed</Text>
          </View>

          <View className="gap-3">
            {recentActivities.map((act) => (
              <GlassCard 
                key={act.id} 
                className="px-4 py-5 flex-row items-center justify-between" 
                intensity="low"
                glowColor={act.glowColor}
                style={{ 
                  borderWidth: 1, 
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderLeftWidth: act.status === 'warning' ? 3 : 1, 
                  borderLeftColor: act.status === 'warning' ? act.glowColor : 'rgba(255,255,255,0.1)' 
                }}
              >
                <View className="flex-row items-center gap-4 flex-1">
                  <View 
                    className="w-3 h-3 rounded-full" 
                    style={{ 
                      backgroundColor: act.glowColor, 
                      shadowColor: act.glowColor, 
                      shadowOffset: { width: 0, height: 0 }, 
                      shadowOpacity: 1, 
                      shadowRadius: 18, 
                      elevation: 16 
                    }} 
                  />
                  <View className="flex-1 pr-2">
                    <Text className="text-white font-bold text-sm">{act.title}</Text>
                    <Text className="text-[#d1c5ac] text-[11px] mt-0.5">{act.subtitle}</Text>
                  </View>
                </View>
                <Text className="text-[#d1c5ac] text-[10px] font-semibold">{act.time}</Text>
              </GlassCard>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* NOTIFICATION CARD MODAL (Top-Right Popover Below Bell Icon) */}
      {showNotificationModal && (
        <Modal 
          visible={showNotificationModal} 
          transparent 
          animationType="fade" 
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <Pressable 
            onPress={() => setShowNotificationModal(false)}
            style={{ paddingTop: headerPaddingTop + 4 }}
            className="flex-1 bg-black/60 px-4 items-end"
          >
            <Pressable 
              onPress={(e) => e.stopPropagation()} 
              className="w-[92%] max-w-sm p-4 border border-[#f0c110]/40 rounded-3xl shadow-2xl" 
              style={{ backgroundColor: '#101415', marginTop: 8 }}
            >
              
              {/* Header Bar */}
              <View className="flex-row justify-between items-center pb-3 border-b border-white/10 mb-4">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center mr-2.5">
                    <Bell size={16} color="#f0c110" />
                  </View>
                  <View>
                    <Text className="text-white font-extrabold text-base">Notification Center</Text>
                    <Text className="text-[#ffe5a0] text-[10px] font-bold">
                      {unreadCount} Unread System Alert{unreadCount === 1 ? '' : 's'}
                    </Text>
                  </View>
                </View>
                
                <Pressable onPress={() => setShowNotificationModal(false)} className="p-1 active:scale-95">
                  <X size={20} color="rgba(255,255,255,0.6)" />
                </Pressable>
              </View>

              {/* Notification Category Filters */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                <View className="flex-row" style={{ gap: 6 }}>
                  {(['All', 'Staff', 'Leaves', 'Fees', 'System', 'Bus'] as const).map(cat => {
                    const isSel = notificationFilter === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setNotificationFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl border ${
                          isSel ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <Text className={`text-[10px] font-bold ${isSel ? 'text-[#101415]' : 'text-white/70'}`}>
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Notifications List */}
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }} className="mb-4">
                {filteredNotifications.length === 0 ? (
                  <View className="py-8 items-center justify-center">
                    <Text className="text-white/40 text-xs font-bold">No notifications in this category.</Text>
                  </View>
                ) : (
                  filteredNotifications.map(n => (
                    <View 
                      key={n.id} 
                      className={`p-3 rounded-2xl mb-2.5 border ${
                        n.read ? 'bg-white/5 border-white/5' : 'bg-[#f0c110]/10 border-[#f0c110]/30'
                      }`}
                    >
                      <View className="flex-row justify-between items-start mb-1">
                        <Text className="text-white font-extrabold text-xs flex-1 mr-2">{n.title}</Text>
                        <Text className="text-[#ffe5a0]/70 text-[9px] font-semibold">{n.time}</Text>
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
                  className="flex-1 py-2.5 bg-white/10 border border-white/15 rounded-xl items-center flex-row justify-center active:scale-95"
                >
                  <CheckCircle2 size={14} color="#ffe5a0" style={{ marginRight: 4 }} />
                  <Text className="text-white text-xs font-bold">Mark All Read</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowNotificationModal(false);
                    navigation.navigate('Broadcast');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#f0c110] items-center justify-center active:scale-95 shadow-md shadow-[#f0c110]/30"
                >
                  <Text className="text-[#101415] text-xs font-extrabold uppercase">Broadcasts</Text>
                </Pressable>
              </View>

            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* LEFT SIDEBAR DRAWER MODAL (Profile Details & Sign Out - Super Admin Theme) */}
      {showSidebarModal && (
        <Modal 
          visible={showSidebarModal} 
          transparent 
          animationType="fade" 
          onRequestClose={() => setShowSidebarModal(false)}
        >
          <View className="flex-1 bg-black/80 flex-row">
            <View 
              className="w-[82%] max-w-xs h-full p-5 flex-col justify-between border-r border-[#f0c110]/30" 
              style={{ 
                backgroundColor: '#101415',
                paddingTop: Math.max(insets.top, 20) + 8,
                paddingBottom: Math.max(insets.bottom, 20) + 12,
              }}
            >
              {/* Sidebar Header & Close */}
              <View>
                <View className="flex-row justify-between items-center pb-4 border-b border-white/10 mb-5">
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center mr-2.5">
                      <School size={20} color="#f0c110" />
                    </View>
                    <View>
                      <Text className="text-white font-extrabold text-sm">EduVision</Text>
                      <Text className="text-[#ffe5a0] text-[9px] font-bold uppercase tracking-widest">SUPER ADMIN TERMINAL</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setShowSidebarModal(false)} className="p-1 active:scale-95">
                    <X size={20} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                </View>

                {/* Profile Avatar Card */}
                <View className="bg-black/60 p-4 rounded-3xl border border-[#f0c110]/20 mb-5 items-center">
                  <View className="w-16 h-16 rounded-full items-center justify-center mb-3 bg-[#f0c110]/20 border-2 border-[#f0c110] shadow-[0_0_15px_rgba(240,193,16,0.3)]">
                    <Text className="text-[#ffe5a0] font-extrabold text-xl">
                      {(user?.name || 'Principal Sharma').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </Text>
                  </View>
                  <Text className="text-white font-extrabold text-base text-center">{user?.name || 'Principal Sharma'}</Text>
                  <Text className="text-white/50 text-xs text-center mt-0.5">{user?.email || 'principal@krishnaveni.edu'}</Text>

                  <View className="px-3 py-1 rounded-xl mt-3 bg-[#f0c110]/20 border border-[#f0c110]/40">
                    <Text className="text-[#ffe5a0] text-[10px] font-black uppercase tracking-wider">SUPER ADMINISTRATOR</Text>
                  </View>
                </View>

                {/* Staff Info Details List */}
                <View className="bg-white/5 p-3.5 rounded-2xl border border-white/10 mb-4" style={{ gap: 10 }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">Admin ID</Text>
                    <Text className="text-white font-extrabold text-xs">ED-001 (Root Master)</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">Department</Text>
                    <Text className="text-[#ffe5a0] font-bold text-xs">Executive Administration</Text>
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

              {/* Bottom Actions: Activity Logs, Settings, Admin Operations & Sign Out */}
              <View className="pb-6">
                <Pressable
                  onPress={() => {
                    setShowSidebarModal(false);
                    navigation.navigate('SuperAdminActivityLog');
                  }}
                  className="w-full py-3.5 px-4 mb-2.5 bg-white/5 border border-white/15 rounded-2xl flex-row items-center justify-between active:bg-white/10"
                >
                  <View className="flex-row items-center">
                    <History size={18} color="#ffe5a0" style={{ marginRight: 10 }} />
                    <Text className="text-white font-extrabold text-xs">My Activity Logs</Text>
                  </View>
                  <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowSidebarModal(false);
                    navigation.navigate('PortalTools');
                  }}
                  className="w-full py-3.5 px-4 mb-2.5 bg-white/5 border border-white/15 rounded-2xl flex-row items-center justify-between active:bg-white/10"
                >
                  <View className="flex-row items-center">
                    <Settings size={18} color="#ffe5a0" style={{ marginRight: 10 }} />
                    <Text className="text-white font-extrabold text-xs">Portal Settings</Text>
                  </View>
                  <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowSidebarModal(false);
                    navigation.navigate('SuperAdminAdminConsole');
                  }}
                  className="w-full py-3.5 px-4 mb-2.5 rounded-2xl flex-row items-center justify-between bg-[#f0c110]/15 border border-[#f0c110]/30 active:bg-[#f0c110]/25"
                >
                  <View className="flex-row items-center">
                    <LayoutGrid size={18} color="#f0c110" style={{ marginRight: 10 }} />
                    <Text className="text-[#ffe5a0] font-extrabold text-xs">Admin Operations Console</Text>
                  </View>
                  <ChevronRight size={16} color="#f0c110" />
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

      {/* Custom Dialog Alert Modal */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[85%] max-w-[340px] p-6 border border-white/10 items-center"
            style={{
              backgroundColor: '#16191b',
              borderRadius: 28,
              shadowColor: '#f0c110',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            {/* Header Icon */}
            <View className="w-12 h-12 rounded-2xl mb-4 items-center justify-center bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={24} color="#ffb4ab" />
            </View>

            {/* Title & Message */}
            <Text className="text-white text-lg font-bold font-display-md text-center mb-2">
              {customAlert.title}
            </Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-6 px-1">
              {customAlert.message}
            </Text>

            {/* Action Button */}
            <Pressable
              onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
              className="w-full py-3.5 rounded-xl bg-[#f0c110] items-center active:scale-95 shadow-md shadow-[#f0c110]/30"
            >
              <Text className="text-[#000] text-xs font-bold uppercase tracking-wider">Dismiss</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101415',
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100, // accommodate bottom tab navigator height
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SuperAdminDashboard;
