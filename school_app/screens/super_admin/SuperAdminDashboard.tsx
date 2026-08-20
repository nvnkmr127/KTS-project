import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';
import { 
  School, Users, TrendingUp, TrendingDown, LayoutGrid, 
  UserCheck, Banknote, BarChart, Megaphone, CalendarCheck, 
  Briefcase, Receipt, ShieldCheck, Settings, AlertTriangle, 
  ChevronRight, Info, Check 
} from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';

export const SuperAdminDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isSmallPhone, headerPaddingTop, scrollBottomPadding } = useResponsive();

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
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-10 h-10 rounded-xl bg-[#f5c518] items-center justify-center">
              <School size={22} color="#241a00" />
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-lg md:text-xl font-bold text-white font-display-lg">EduVision</Text>
              <Text numberOfLines={1} className="text-[9px] uppercase tracking-widest text-[#d1c5ac]">Super Admin Terminal</Text>
            </View>
          </View>

          <Pressable 
            onPress={handleEmergencyAlert} 
            className="w-10 h-10 rounded-full bg-red-600 items-center justify-center active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.6)]"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <AlertTriangle size={18} color="#FFF" />
          </Pressable>
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
          { paddingBottom: scrollBottomPadding + 20 }
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
            {/* Action 1: Admin */}
            <Pressable 
              onPress={() => navigation.navigate('SuperAdminAdminConsole')}
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderColor: 'rgba(240, 193, 16, 0.6)' }]}
              className="w-[31%] bg-white/5 border border-white/10 rounded-2xl p-4 items-center justify-center mb-3 active:bg-[#f0c110]/25 active:border-[#f0c110]/60 active:scale-95"
            >
              <ShieldCheck size={24} color="#ffe5a0" />
              <Text className="text-white text-[10px] font-bold text-center mt-2">Admin</Text>
            </Pressable>

            {/* Action 2: Fee Structure */}
            <Pressable 
              onPress={() => navigation.navigate('AssignFeeStructure')}
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderColor: 'rgba(240, 193, 16, 0.6)' }]}
              className="w-[31%] bg-white/5 border border-white/10 rounded-2xl p-4 items-center justify-center mb-3 active:bg-[#f0c110]/25 active:border-[#f0c110]/60 active:scale-95"
            >
              <Banknote size={24} color="#ffe5a0" />
              <Text className="text-white text-[10px] font-bold text-center mt-2">Fee Structure</Text>
            </Pressable>

            {/* Action 3: Leave Approvals */}
            <Pressable 
              onPress={() => navigation.navigate('LeaveApprovals')}
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderColor: 'rgba(240, 193, 16, 0.6)' }]}
              className="w-[31%] bg-white/5 border border-white/10 rounded-2xl p-4 items-center justify-center mb-3 active:bg-[#f0c110]/25 active:border-[#f0c110]/60 active:scale-95"
            >
              <CalendarCheck size={24} color="#ffe5a0" />
              <Text className="text-white text-[10px] font-bold text-center mt-2">Leave Approvals</Text>
            </Pressable>

            {/* Action 4: Salary & Payroll */}
            <Pressable 
              onPress={() => navigation.navigate('SalaryExpenses')}
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderColor: 'rgba(240, 193, 16, 0.6)' }]}
              className="w-[31%] bg-white/5 border border-white/10 rounded-2xl p-4 items-center justify-center mb-3 active:bg-[#f0c110]/25 active:border-[#f0c110]/60 active:scale-95"
            >
              <Briefcase size={24} color="#ffe5a0" />
              <Text className="text-white text-[10px] font-bold text-center mt-2">Salary & Payroll</Text>
            </Pressable>

            {/* Action 5: Expenses */}
            <Pressable 
              onPress={() => navigation.navigate('SalaryExpenses')}
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderColor: 'rgba(240, 193, 16, 0.6)' }]}
              className="w-[31%] bg-white/5 border border-white/10 rounded-2xl p-4 items-center justify-center mb-3 active:bg-[#f0c110]/25 active:border-[#f0c110]/60 active:scale-95"
            >
              <Receipt size={24} color="#ffe5a0" />
              <Text className="text-white text-[10px] font-bold text-center mt-2">Expenses</Text>
            </Pressable>

            {/* Action 6: Staff Access */}
            <Pressable 
              onPress={() => navigation.navigate('Users')}
              style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderColor: 'rgba(240, 193, 16, 0.6)' }]}
              className="w-[31%] bg-white/5 border border-white/10 rounded-2xl p-4 items-center justify-center mb-3 active:bg-[#f0c110]/25 active:border-[#f0c110]/60 active:scale-95"
            >
              <UserCheck size={24} color="#ffe5a0" />
              <Text className="text-white text-[10px] font-bold text-center mt-2">Staff Access</Text>
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
