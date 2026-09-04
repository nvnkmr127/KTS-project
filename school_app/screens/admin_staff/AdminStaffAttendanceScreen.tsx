import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, TextInput, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  UserCheck, Clock, Calendar, Search, Filter, Fingerprint, ShieldCheck, Lock, Eye, ChevronLeft, ChevronRight
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';
import { useStaffStore, StaffMember, INITIAL_STAFF_MEMBERS } from '../../store/staffStore';

export const AdminStaffAttendanceScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();
  const isSuperAdmin = user?.role === 'super_admin';
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<'All' | 'Teaching' | 'Non-Teaching' | 'Admin' | 'Support'>('All');

  const { staffList, loading, fetchStaff } = useStaffStore();

  const handleStepDate = (days: number) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      if (days > 0 && selectedDate >= todayStr) return;
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        d.setDate(d.getDate() + days);
        const nextStr = d.toISOString().split('T')[0];
        if (days > 0 && nextStr > todayStr) return;
        setSelectedDate(nextStr);
      }
    } catch (_) {}
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const isToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return selectedDate === todayStr;
  }, [selectedDate]);

  // Handle Hardware Back Button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (navigation?.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Robust Filtered staff list
  const filteredStaff = useMemo(() => {
    const list = staffList && staffList.length > 0 ? staffList : INITIAL_STAFF_MEMBERS;
    return list.filter(s => {
      const q = (searchQuery || '').toLowerCase().trim();
      const name = (s.name || '').toLowerCase();
      const desig = (s.designation || s.department || '').toLowerCase();
      const bio = (s.biometric_employee_code || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || desig.includes(q) || bio.includes(q);

      const sCat = (s.category || 'Teaching').toLowerCase();
      const sDept = (s.department || '').toLowerCase();
      const filterDept = selectedDeptFilter.toLowerCase();

      const matchesDept =
        selectedDeptFilter === 'All' ||
        sCat === filterDept ||
        sDept === filterDept ||
        (filterDept === 'teaching' && (sCat === 'teaching' || sDept === 'physics' || sDept === 'mathematics' || sDept === 'languages' || sDept === 'science')) ||
        (filterDept === 'admin' && (sCat === 'admin' || sDept.includes('admin') || sDept.includes('administration'))) ||
        (filterDept === 'non-teaching' && (sCat === 'non-teaching' || sDept.includes('account') || sDept.includes('finance') || sCat === 'support')) ||
        (filterDept === 'support' && (sCat === 'support' || sDept.includes('logistics') || sDept.includes('fleet') || sDept.includes('transport')));

      return matchesSearch && matchesDept;
    });
  }, [staffList, searchQuery, selectedDeptFilter]);

  // KPI Metrics Calculations
  const listForKPI = staffList && staffList.length > 0 ? staffList : INITIAL_STAFF_MEMBERS;
  const totalStaffCount = listForKPI.length;
  const presentCount = listForKPI.filter(s => (s.attendanceStatus || (s.status === 'On Leave' ? 'Leave' : 'Present')) === 'Present').length;
  const absentCount = listForKPI.filter(s => {
    const st = s.attendanceStatus || (s.status === 'On Leave' ? 'Leave' : 'Present');
    return st === 'Absent' || st === 'Leave';
  }).length;
  const halfDayCount = listForKPI.filter(s => (s.attendanceStatus || (s.status === 'On Leave' ? 'Leave' : 'Present')) === 'Half Day').length;

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';
  const primaryPillClass = isSuperAdmin ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-emerald-500/15 border border-emerald-500/30';

  return (
    <View style={[styles.container, isSuperAdmin && { backgroundColor: '#101415' }]}>
      <LinearGradient
        colors={isSuperAdmin ? ['#1d2022', '#101415'] : ['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Staff Attendance Console"
        subtitle="Biometric Logs & Daily Staff Roster"
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <UserCheck size={20} color={primaryColor} />
          </View>
        }
      />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* View Only Mode Notification Ribbon */}
        <View className="px-5 mb-4">
          <View className="bg-sky-500/15 border border-sky-500/30 p-3.5 rounded-2xl flex-row items-center">
            <View className="w-9 h-9 rounded-xl bg-sky-500/20 items-center justify-center mr-3">
              <Eye size={20} color="#38bdf8" />
            </View>
            <View className="flex-1">
              <Text className="text-sky-400 font-extrabold text-sm">View Only Mode Active</Text>
              <Text className="text-sky-200/80 text-xs mt-0.5 font-medium leading-relaxed">Admin Staff login has view-only access. Super Admin manages staff members and attendance modifications.</Text>
            </View>
          </View>
        </View>

        {/* Top 4 KPI Metrics Cards */}
        <View className="px-5 mb-5 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
          <GlassCard intensity="low" className="w-[23%] p-3 border-white/10 bg-[#101415]/90 items-center">
            <Text className="text-white/60 text-[10px] sm:text-xs font-extrabold uppercase text-center" numberOfLines={1}>Total Staff</Text>
            <Text className="text-white text-xl font-black mt-1 font-mono">{totalStaffCount}</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[23%] p-3 border-white/10 bg-[#101415]/90 items-center">
            <Text className="text-white/60 text-[10px] sm:text-xs font-extrabold uppercase text-center" numberOfLines={1}>Present</Text>
            <Text className={`${primaryTextClass} text-xl font-black mt-1 font-mono`}>{presentCount}</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[23%] p-3 border-white/10 bg-[#101415]/90 items-center">
            <Text className="text-white/60 text-[10px] sm:text-xs font-extrabold uppercase text-center" numberOfLines={1}>Absent/Leave</Text>
            <Text className="text-rose-400 text-xl font-black mt-1 font-mono">{absentCount}</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[23%] p-3 border-white/10 bg-[#101415]/90 items-center">
            <Text className="text-white/60 text-[10px] sm:text-xs font-extrabold uppercase text-center" numberOfLines={1}>Half Day</Text>
            <Text className="text-amber-400 text-xl font-black mt-1 font-mono">{halfDayCount}</Text>
          </GlassCard>
        </View>

        {/* Date Selector & Navigation Bar */}
        <View className="px-5 mb-4 flex-row justify-between items-center flex-wrap" style={{ gap: 8 }}>
          <View className="flex-row items-center bg-[#101415]/90 border border-white/10 p-1.5 rounded-xl">
            <Pressable
              onPress={() => handleStepDate(-1)}
              className="w-8 h-8 rounded-lg bg-white/5 items-center justify-center mr-1"
            >
              <ChevronLeft size={18} color="rgba(255,255,255,0.8)" />
            </Pressable>

            <View className="flex-row items-center px-2.5 py-0.5">
              <Calendar size={15} color={primaryColor} style={{ marginRight: 6 }} />
              <Text className="text-white font-extrabold text-sm font-mono">{selectedDate}</Text>
            </View>

            <Pressable
              onPress={() => handleStepDate(1)}
              disabled={isToday}
              className={`w-8 h-8 rounded-lg items-center justify-center ml-1 ${isToday ? 'bg-white/5 opacity-30' : 'bg-white/10'}`}
            >
              <ChevronRight size={18} color="rgba(255,255,255,0.8)" />
            </Pressable>
          </View>

          <View className="flex-row items-center" style={{ gap: 6 }}>
            {!isToday && (
              <Pressable
                onPress={handleSetToday}
                className="px-3 py-2 rounded-xl bg-white/10 border border-white/15"
              >
                <Text className="text-white/90 text-xs font-bold">Today</Text>
              </Pressable>
            )}
            <View className={`px-3 py-2 rounded-xl flex-row items-center ${primaryBadgeClass}`}>
              <ShieldCheck size={14} color={primaryColor} style={{ marginRight: 5 }} />
              <Text className={`${primaryTextClass} text-xs font-bold`}>e-TimeOffice Live</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-5 mb-4">
          <View className="bg-[#101415]/90 border border-white/10 rounded-2xl px-3.5 py-2.5 flex-row items-center">
            <Search size={18} color={primaryColor} style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search faculty name or emp code..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="flex-1 text-white text-sm font-medium"
            />
          </View>
        </View>

        {/* Department Filter Ribbon */}
        <View className="px-5 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {(['All', 'Teaching', 'Non-Teaching', 'Admin', 'Support'] as const).map(d => {
                const isSel = selectedDeptFilter === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setSelectedDeptFilter(d)}
                    className={`px-4 py-2 rounded-xl border ${isSel ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-[#101415]/90 border-white/10'}`}
                  >
                    <Text className={`text-sm font-bold ${isSel ? 'text-[#101415]' : 'text-white/80'}`}>
                      {d}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Staff Attendance List (View Only) */}
        <View className="px-5 mb-8">
          {filteredStaff.length === 0 ? (
            <GlassCard className="p-8 items-center justify-center border border-white/10 bg-[#101415]/90" intensity="low">
              <Text className="text-white/60 text-sm font-bold">No staff members found matching filter.</Text>
            </GlassCard>
          ) : (
            filteredStaff.map(staff => {
              const currentStatus = staff.attendanceStatus || (staff.status === 'On Leave' ? 'Leave' : 'Present');
              return (
                <GlassCard key={staff.id} intensity="low" className="p-4 mb-3.5 border-white/10 bg-[#101415]/90">
                  
                  {/* Profile Header Row */}
                  <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-white/10">
                    <View className="flex-row items-center flex-1 mr-2">
                      <Image
                        source={{ uri: staff.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150' }}
                        className="w-13 h-13 rounded-2xl border border-white/10 mr-3"
                        style={{ width: 48, height: 48 }}
                      />
                      <View className="flex-1">
                        <Text className="text-white font-extrabold text-base">{staff.name}</Text>
                        <Text className={`${primaryTextClass} text-xs font-bold uppercase mt-0.5`}>
                          {staff.designation || staff.department} • {staff.biometric_employee_code || `BIO-${staff.id}`}
                        </Text>
                      </View>
                    </View>

                    <View className={`px-3 py-1 rounded-full border ${
                      currentStatus === 'Present' ? primaryBadgeClass :
                      currentStatus === 'Absent' ? 'bg-rose-500/20 border-rose-500/40' :
                      currentStatus === 'Half Day' ? 'bg-amber-500/20 border-amber-500/40' :
                      'bg-sky-500/20 border-sky-500/40'
                    }`}>
                      <Text className={`text-xs font-extrabold uppercase ${
                        currentStatus === 'Present' ? primaryTextClass :
                        currentStatus === 'Absent' ? 'text-rose-400' :
                        currentStatus === 'Half Day' ? 'text-amber-400' : 'text-sky-400'
                      }`}>
                        {currentStatus}
                      </Text>
                    </View>
                  </View>

                  {/* Timing Info & Biometric Sync Tag */}
                  <View className="flex-row justify-between items-center flex-wrap bg-black/40 p-3 rounded-xl border border-white/5" style={{ gap: 6 }}>
                    <View className="flex-row items-center flex-shrink-0">
                      <Clock size={15} color={primaryColor} style={{ marginRight: 5 }} />
                      <Text className="text-white/80 text-sm font-bold font-mono">
                        IN: {staff.inTime || '08:30 AM'}  |  OUT: {staff.outTime || '04:30 PM'}
                      </Text>
                    </View>

                    <View className="flex-row items-center flex-shrink-0">
                      <Fingerprint size={14} color={staff.biometricSynced !== false ? primaryColor : 'rgba(255,255,255,0.4)'} style={{ marginRight: 4 }} />
                      <Text className={`text-xs font-bold ${staff.biometricSynced !== false ? primaryTextClass : 'text-white/50'}`}>
                        {staff.biometricSynced !== false ? 'e-TimeOffice Live' : 'Recorded'}
                      </Text>
                    </View>
                  </View>

                </GlassCard>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d2a24',
  },
  scrollContent: {
    paddingTop: 16,
  },
});

export default AdminStaffAttendanceScreen;
