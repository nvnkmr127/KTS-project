import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Modal, TextInput, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { 
  Calendar, FileText, CheckCircle2, Clock, 
  CalendarOff, Search, X, Users, AlertCircle, 
  UserCheck, ChevronRight, Eye, ShieldCheck, Info
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

export interface StaffLeaveRecord {
  id: string;
  name: string;
  role: string;
  empId: string;
  type: string;
  dates: string;
  startDate: string;
  endDate: string;
  days: string;
  reason: string;
  substitute?: string;
  status: 'Active On Leave' | 'Scheduled' | 'Completed' | 'Approved';
  approvedBy: string;
  appliedOn: string;
  category: 'current' | 'upcoming' | 'past';
  avatar: string;
}

const MOCK_ON_LEAVE_STAFF: StaffLeaveRecord[] = [
  {
    id: 'l1',
    name: 'Dr. Julian Vance',
    role: 'Senior Faculty • Physics HOD',
    empId: 'EMP-2026-94',
    type: 'MEDICAL LEAVE',
    dates: '08 Sep - 11 Sep 2026',
    startDate: '2026-09-08',
    endDate: '2026-09-11',
    days: '4 Days',
    reason: 'Undergoing minor surgical procedure. Medical fitness certificate submitted.',
    substitute: 'Mrs. Sunita Rao (Covering 10-A, 9-B)',
    status: 'Active On Leave',
    approvedBy: 'Dr. Rajesh Sharma (Super Admin)',
    appliedOn: '04 Sep 2026',
    category: 'current',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
  },
  {
    id: 'l2',
    name: 'Prof. Michael Chen',
    role: 'Department Head • Computer Science',
    empId: 'EMP-2026-88',
    type: 'CASUAL LEAVE',
    dates: '09 Sep - 10 Sep 2026',
    startDate: '2026-09-09',
    endDate: '2026-09-10',
    days: '2 Days',
    reason: 'Attending State Educational Symposium at JNTU Hyderabad.',
    substitute: 'Mr. Ramesh Yadav (Covering Lab 2)',
    status: 'Scheduled',
    approvedBy: 'Dr. Rajesh Sharma (Super Admin)',
    appliedOn: '05 Sep 2026',
    category: 'upcoming',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150',
  },
  {
    id: 'l3',
    name: 'Mrs. Sunita Rao',
    role: 'Mathematics Senior Faculty',
    empId: 'EMP-2026-95',
    type: 'ANNUAL LEAVE',
    dates: '14 Sep - 18 Sep 2026',
    startDate: '2026-09-14',
    endDate: '2026-09-18',
    days: '5 Days',
    reason: 'Family pilgrimage and personal leave pre-scheduled for academic term.',
    substitute: 'Mr. Yadagiri T (Covering 8-A, 7-B)',
    status: 'Scheduled',
    approvedBy: 'Dr. Rajesh Sharma (Super Admin)',
    appliedOn: '01 Sep 2026',
    category: 'upcoming',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150',
  },
  {
    id: 'l4',
    name: 'Mr. Ramesh Yadav',
    role: 'Head of Accounts & Commerce',
    empId: 'EMP-2026-96',
    type: 'DUTY LEAVE',
    dates: '21 Sep - 23 Sep 2026',
    startDate: '2026-09-21',
    endDate: '2026-09-23',
    days: '3 Days',
    reason: 'Board of Intermediate Education official audit delegation.',
    substitute: 'Sarah Jenkins (Counter Accounts)',
    status: 'Scheduled',
    approvedBy: 'Dr. Rajesh Sharma (Super Admin)',
    appliedOn: '06 Sep 2026',
    category: 'upcoming',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150',
  },
  {
    id: 'l5',
    name: 'Mrs. Priyadarshini K',
    role: 'English Faculty & Cultural Lead',
    empId: 'EMP-2026-97',
    type: 'MATERNITY LEAVE',
    dates: '28 Sep - 28 Dec 2026',
    startDate: '2026-09-28',
    endDate: '2026-12-28',
    days: '90 Days',
    reason: 'Maternity leave as per institutional HR policy.',
    substitute: 'Guest Faculty Appointed',
    status: 'Scheduled',
    approvedBy: 'Dr. Rajesh Sharma (Super Admin)',
    appliedOn: '02 Sep 2026',
    category: 'upcoming',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150',
  },
  {
    id: 'l6',
    name: 'Mr. Anthony Das',
    role: 'Chief Security Officer',
    empId: 'EMP-2026-99',
    type: 'SICK LEAVE',
    dates: '01 Sep - 03 Sep 2026',
    startDate: '2026-09-01',
    endDate: '2026-09-03',
    days: '3 Days',
    reason: 'Viral fever and rest prescribed by physician.',
    substitute: 'Guard In-Charge T. Raju',
    status: 'Completed',
    approvedBy: 'Dr. Rajesh Sharma (Super Admin)',
    appliedOn: '30 Aug 2026',
    category: 'past',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150',
  },
];

export const AdminStaffLeavesScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();
  const isSuperAdmin = user?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState<'all' | 'current' | 'upcoming' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaves, setLeaves] = useState<StaffLeaveRecord[]>(MOCK_ON_LEAVE_STAFF);
  const [selectedLeave, setSelectedLeave] = useState<StaffLeaveRecord | null>(null);

  // Handle Hardware Back Button & System Back Gesture
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (selectedLeave) {
          setSelectedLeave(null);
          return true;
        }
        if (navigation?.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [selectedLeave, navigation])
  );

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await api.getResources('leaves');
        if (Array.isArray(res) && res.length > 0) {
          // Only show approved leaves for Admin Staff (Read Mode)
          const approved = res.filter((l: any) => l.status === 'approved' || l.status === 'Approved' || l.status === 'active');
          if (approved.length > 0) {
            const mapped: StaffLeaveRecord[] = approved.map((l: any, idx: number) => {
              const startStr = l.start_date || '2026-09-08';
              const isPast = new Date(startStr).getTime() < new Date('2026-09-08').getTime();
              const isCurrent = startStr === '2026-09-08' || (new Date(startStr).getTime() <= Date.now() && new Date(l.end_date || startStr).getTime() >= Date.now());
              return {
                id: String(l.id || idx),
                name: l.applicant_name || l.user_name || l.staff_name || 'Faculty Member',
                role: l.designation || l.department || 'Teaching Faculty',
                empId: l.employee_id || `EMP-2026-0${idx + 1}`,
                type: (l.leave_type || l.type || 'CASUAL LEAVE').toUpperCase(),
                dates: l.start_date ? `${l.start_date} - ${l.end_date || l.start_date}` : '08 Sep - 11 Sep 2026',
                startDate: startStr,
                endDate: l.end_date || startStr,
                days: l.days ? `${l.days} Days` : '1 Day',
                reason: l.reason || 'Approved absence registered in institutional portal.',
                substitute: l.substitute || 'Department Faculty Assigned',
                status: isCurrent ? 'Active On Leave' : isPast ? 'Completed' : 'Scheduled',
                approvedBy: l.approved_by || 'Dr. Rajesh Sharma (Super Admin)',
                appliedOn: l.created_at || '01 Sep 2026',
                category: isCurrent ? 'current' : isPast ? 'past' : 'upcoming',
                avatar: l.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
              };
            });
            setLeaves(mapped);
          }
        }
      } catch (err) {
        console.log('Error fetching leaves:', err);
      }
    };
    fetchLeaves();
  }, []);

  // Sort leaves from latest (today/current) to future dates
  const sortedAndFilteredLeaves = useMemo(() => {
    let list = [...leaves];

    // Filter by tab
    if (activeTab === 'current') {
      list = list.filter(l => l.category === 'current' || l.status === 'Active On Leave');
    } else if (activeTab === 'upcoming') {
      list = list.filter(l => l.category === 'upcoming' || l.status === 'Scheduled');
    } else if (activeTab === 'past') {
      list = list.filter(l => l.category === 'past' || l.status === 'Completed');
    }

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.role.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q) ||
        l.empId.toLowerCase().includes(q)
      );
    }

    // Sort: Latest to future dates (Chronological: today -> tomorrow -> future)
    return list.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime() || 0;
      const dateB = new Date(b.startDate).getTime() || 0;
      return dateA - dateB;
    });
  }, [leaves, activeTab, searchQuery]);

  const totalOnLeaveCount = leaves.filter(l => l.category !== 'past').length;
  const currentCount = leaves.filter(l => l.category === 'current').length;
  const upcomingCount = leaves.filter(l => l.category === 'upcoming').length;
  const pastCount = leaves.filter(l => l.category === 'past').length;

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';

  const getTypeStyle = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('MEDICAL') || t.includes('SICK')) {
      return { bg: 'bg-rose-500/15', border: 'border-rose-500/30', text: 'text-rose-400' };
    }
    if (t.includes('ANNUAL')) {
      return { bg: 'bg-sky-500/15', border: 'border-sky-500/30', text: 'text-sky-400' };
    }
    if (t.includes('DUTY') || t.includes('OFFICIAL')) {
      return { bg: 'bg-purple-500/15', border: 'border-purple-500/30', text: 'text-purple-300' };
    }
    return { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400' };
  };

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
        title="Staff Leave Directory"
        subtitle="Read Mode • Live Staff Absences & Schedule"
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <CalendarOff size={20} color={primaryColor} />
          </View>
        }
      />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Intro & Read Mode Banner */}
        <View className="px-5 mb-4">
          <View className="flex-row items-center mb-1">
            <UserCheck size={22} color={primaryColor} style={{ marginRight: 8 }} />
            <Text className="text-white text-xl font-extrabold">Staff Leave Roster</Text>
          </View>
          <Text className="text-white/60 text-sm leading-relaxed">
            Live schedule of faculty & staff approved leaves sorted from current to future dates.
          </Text>

          {/* Read Only Access Badge */}
          <View className="bg-white/5 border border-white/10 rounded-2xl p-3 mt-3 flex-row items-center">
            <Info size={16} color={primaryColor} style={{ marginRight: 8 }} />
            <Text className="text-white/70 text-xs flex-1 font-medium leading-relaxed">
              <Text className="text-white font-bold">Read-Only Mode:</Text> Leave applications and approvals are administered exclusively by the Super Admin Console.
            </Text>
          </View>
        </View>

        {/* 4 Summary Stats Cards Grid */}
        <View className="px-5 mb-4 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/90">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/50 text-[11px] font-extrabold uppercase">Total On Leave</Text>
              <Users size={15} color={primaryColor} />
            </View>
            <Text className="text-white text-2xl font-black">{totalOnLeaveCount}</Text>
            <Text className={`${primaryTextClass} text-xs font-semibold mt-0.5`}>Current & Upcoming</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/90">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/50 text-[11px] font-extrabold uppercase">Active Today</Text>
              <Clock size={15} color="#10B981" />
            </View>
            <Text className="text-emerald-400 text-2xl font-black">{currentCount}</Text>
            <Text className="text-white/50 text-xs font-semibold mt-0.5">Faculty Off-Campus</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/90">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/50 text-[11px] font-extrabold uppercase">Scheduled Ahead</Text>
              <Calendar size={15} color="#38bdf8" />
            </View>
            <Text className="text-sky-400 text-2xl font-black">{upcomingCount}</Text>
            <Text className="text-white/50 text-xs font-semibold mt-0.5">Future Dates</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/90">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/50 text-[11px] font-extrabold uppercase">Past Records</Text>
              <CheckCircle2 size={15} color="#a78bfa" />
            </View>
            <Text className="text-purple-400 text-2xl font-black">{pastCount}</Text>
            <Text className="text-white/50 text-xs font-semibold mt-0.5">Completed</Text>
          </GlassCard>
        </View>

        {/* Search Bar */}
        <View className="px-5 mb-3.5">
          <View className="bg-[#101415] border border-white/15 rounded-2xl flex-row items-center px-3.5 py-2.5 shadow-md">
            <Search size={16} color={primaryColor} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search faculty name, department or leave type..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white text-sm"
              style={{ paddingVertical: 0 }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={16} color="rgba(255, 255, 255, 0.5)" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View className="px-5 mb-4">
          <View className="flex-row bg-[#101415]/90 p-1 rounded-2xl border border-white/10 w-full justify-between" style={{ gap: 4 }}>
            <Pressable
              onPress={() => setActiveTab('all')}
              className={`flex-1 py-2.5 rounded-xl items-center justify-center flex-row ${
                activeTab === 'all' ? (isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]') : ''
              }`}
            >
              <Text className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'all' ? 'text-[#101415]' : 'text-white/50'}`}>All</Text>
              <View className={`w-5 h-5 rounded-full items-center justify-center ml-1 ${activeTab === 'all' ? 'bg-[#101415]/20' : 'bg-white/10'}`}>
                <Text className={`text-[10px] font-bold ${activeTab === 'all' ? 'text-[#101415]' : 'text-white/70'}`}>{leaves.length}</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('current')}
              className={`flex-1 py-2.5 rounded-xl items-center justify-center flex-row ${
                activeTab === 'current' ? (isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]') : ''
              }`}
            >
              <Text className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'current' ? 'text-[#101415]' : 'text-white/50'}`}>Current</Text>
              <View className={`w-5 h-5 rounded-full items-center justify-center ml-1 ${activeTab === 'current' ? 'bg-[#101415]/20' : 'bg-white/10'}`}>
                <Text className={`text-[10px] font-bold ${activeTab === 'current' ? 'text-[#101415]' : 'text-white/70'}`}>{currentCount}</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('upcoming')}
              className={`flex-1 py-2.5 rounded-xl items-center justify-center flex-row ${
                activeTab === 'upcoming' ? (isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]') : ''
              }`}
            >
              <Text className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'upcoming' ? 'text-[#101415]' : 'text-white/50'}`}>Upcoming</Text>
              <View className={`w-5 h-5 rounded-full items-center justify-center ml-1 ${activeTab === 'upcoming' ? 'bg-[#101415]/20' : 'bg-white/10'}`}>
                <Text className={`text-[10px] font-bold ${activeTab === 'upcoming' ? 'text-[#101415]' : 'text-white/70'}`}>{upcomingCount}</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('past')}
              className={`flex-1 py-2.5 rounded-xl items-center justify-center flex-row ${
                activeTab === 'past' ? (isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]') : ''
              }`}
            >
              <Text className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'past' ? 'text-[#101415]' : 'text-white/50'}`}>Past</Text>
              <View className={`w-5 h-5 rounded-full items-center justify-center ml-1 ${activeTab === 'past' ? 'bg-[#101415]/20' : 'bg-white/10'}`}>
                <Text className={`text-[10px] font-bold ${activeTab === 'past' ? 'text-[#101415]' : 'text-white/70'}`}>{pastCount}</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Staff Leaves List (Latest to Future Dates) */}
        <View className="px-5 mb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white font-extrabold text-base">
              Roster Records ({sortedAndFilteredLeaves.length})
            </Text>
            <Text className="text-white/40 text-xs font-semibold">Sorted Latest → Future</Text>
          </View>

          {sortedAndFilteredLeaves.length === 0 ? (
            <GlassCard className="p-8 items-center justify-center border border-white/10 bg-[#101415]/90" intensity="low">
              <CalendarOff size={32} color="rgba(255,255,255,0.3)" style={{ marginBottom: 12 }} />
              <Text className="text-white/50 text-sm font-bold text-center">No staff members on leave match the selected filter.</Text>
            </GlassCard>
          ) : (
            sortedAndFilteredLeaves.map((l) => {
              const typeStyle = getTypeStyle(l.type);
              return (
                <GlassCard key={l.id} className="p-4 mb-3.5 border border-white/10 bg-[#101415]/90" intensity="low">
                  <Pressable onPress={() => setSelectedLeave(l)}>
                    {/* Staff Profile Row */}
                    <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-white/10">
                      <View className="flex-row items-center flex-1 mr-2">
                        <Image 
                          source={{ uri: l.avatar }} 
                          className="w-12 h-12 rounded-2xl border border-white/10 mr-3"
                          style={{ resizeMode: 'cover' }}
                        />
                        <View className="flex-1">
                          <Text className="text-white font-extrabold text-sm">{l.name}</Text>
                          <Text className={`${primaryTextClass} text-xs font-bold mt-0.5`}>{l.role}</Text>
                          <Text className="text-white/40 text-[11px] font-medium">{l.empId}</Text>
                        </View>
                      </View>

                      <View className={`px-3 py-1 rounded-full ${typeStyle.bg} border ${typeStyle.border}`}>
                        <Text className={`${typeStyle.text} text-xs font-bold uppercase tracking-wider`}>{l.type}</Text>
                      </View>
                    </View>

                    {/* Dates & Duration Banner */}
                    <View className="flex-row items-center justify-between mb-2.5">
                      <View className="flex-row items-center bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                        <Calendar size={14} color={primaryColor} style={{ marginRight: 6 }} />
                        <Text className="text-white text-xs font-bold">{l.dates}</Text>
                      </View>
                      <View className="bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                        <Text className="text-emerald-400 font-extrabold text-xs">{l.days}</Text>
                      </View>
                    </View>

                    {/* Reason Bubble */}
                    <View className="bg-black/40 border border-white/5 p-3 rounded-xl mb-3 flex-row items-start">
                      <FileText size={14} color="rgba(255,255,255,0.4)" style={{ marginRight: 6, marginTop: 2 }} />
                      <Text className="text-white/70 text-xs leading-relaxed italic flex-1" numberOfLines={2}>
                        "{l.reason}"
                      </Text>
                    </View>

                    {/* Read Mode Status & Substitute Row */}
                    <View className="flex-row justify-between items-center pt-1 border-t border-white/5">
                      <View className="flex-row items-center flex-1 mr-2">
                        <CheckCircle2 size={14} color="#10B981" style={{ marginRight: 4 }} />
                        <Text className="text-emerald-400 text-xs font-bold" numberOfLines={1}>{l.status}</Text>
                        <Text className="text-white/40 text-xs ml-1">• Read Mode</Text>
                      </View>

                      <View className="flex-row items-center">
                        <Text className={`${primaryTextClass} text-xs font-bold mr-1`}>Inspect</Text>
                        <ChevronRight size={14} color={primaryColor} />
                      </View>
                    </View>
                  </Pressable>
                </GlassCard>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* READ-ONLY LEAVE INSPECTION MODAL */}
      <Modal
        visible={!!selectedLeave}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedLeave(null)}
      >
        <View className="flex-1 bg-black/85 justify-center items-center p-4">
          {selectedLeave && (
            <View className={`w-full max-w-sm p-6 border-2 rounded-3xl bg-[#101415] ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
              {/* Header */}
              <View className="flex-row justify-between items-center pb-3 border-b border-white/10 mb-4">
                <View className="flex-row items-center">
                  <View className="w-9 h-9 rounded-xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center mr-2.5">
                    <Eye size={18} color="#00f1a1" />
                  </View>
                  <Text className="text-white font-extrabold text-lg">Leave Inspection</Text>
                </View>
                <Pressable onPress={() => setSelectedLeave(null)} className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                  <X size={16} color="#ffffff" />
                </Pressable>
              </View>

              {/* Faculty Info Card */}
              <View className="flex-row items-center bg-white/5 border border-white/10 p-3 rounded-2xl mb-4">
                <Image 
                  source={{ uri: selectedLeave.avatar }} 
                  className="w-12 h-12 rounded-xl border border-white/15 mr-3"
                  style={{ resizeMode: 'cover' }}
                />
                <View className="flex-1">
                  <Text className="text-white font-extrabold text-base">{selectedLeave.name}</Text>
                  <Text className={`${primaryTextClass} text-xs font-bold`}>{selectedLeave.role}</Text>
                  <Text className="text-white/50 text-xs mt-0.5">{selectedLeave.empId}</Text>
                </View>
              </View>

              {/* Leave Breakdown Details */}
              <View className="bg-white/5 border border-white/10 p-3.5 rounded-2xl mb-4" style={{ gap: 8 }}>
                <View className="flex-row justify-between">
                  <Text className="text-white/50 text-xs font-bold uppercase">Leave Type</Text>
                  <Text className="text-white font-extrabold text-xs">{selectedLeave.type}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/50 text-xs font-bold uppercase">Dates Range</Text>
                  <Text className="text-white font-bold text-xs">{selectedLeave.dates}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/50 text-xs font-bold uppercase">Total Duration</Text>
                  <Text className={`${primaryTextClass} font-extrabold text-xs`}>{selectedLeave.days}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/50 text-xs font-bold uppercase">Applied Date</Text>
                  <Text className="text-white/80 font-bold text-xs">{selectedLeave.appliedOn}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/50 text-xs font-bold uppercase">Approval Authority</Text>
                  <Text className="text-emerald-400 font-bold text-xs">{selectedLeave.approvedBy}</Text>
                </View>
                {selectedLeave.substitute && (
                  <View className="flex-row justify-between">
                    <Text className="text-white/50 text-xs font-bold uppercase">Substitute</Text>
                    <Text className="text-sky-400 font-bold text-xs">{selectedLeave.substitute}</Text>
                  </View>
                )}
              </View>

              {/* Reason */}
              <View className="mb-5">
                <Text className="text-white/50 text-xs font-bold uppercase mb-1">Reason for Absence</Text>
                <View className="bg-black/50 border border-white/10 p-3 rounded-xl">
                  <Text className="text-white/80 text-xs leading-relaxed italic">
                    "{selectedLeave.reason}"
                  </Text>
                </View>
              </View>

              {/* Close Button */}
              <Pressable
                onPress={() => setSelectedLeave(null)}
                className={`w-full py-3.5 rounded-xl ${primaryBtnClass} items-center shadow-lg`}
              >
                <Text className="text-[#101415] text-sm font-extrabold uppercase tracking-wider">Close Roster Card</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
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

export default AdminStaffLeavesScreen;
