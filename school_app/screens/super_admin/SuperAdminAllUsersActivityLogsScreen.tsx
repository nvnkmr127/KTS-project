import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  History, Users, UserCheck, Banknote, ShieldCheck, 
  Search, Filter, Download, CheckCircle2, Clock, 
  Calendar, FileText, ArrowLeftRight, Award, 
  Smartphone, Globe, ChevronRight, X, User,
  Layers, Lock, AlertTriangle, BookOpen, GraduationCap
} from 'lucide-react-native';
import { GlassCard } from '../../components/GlassCard';
import { useResponsive } from '../../utils/responsive';

export interface UserActivityLog {
  id: string;
  userName: string;
  userRole: 'admin_staff' | 'teacher' | 'accountant' | 'transport' | 'super_admin' | 'parent';
  roleTitle: string;
  avatarInitials: string;
  actionTitle: string;
  category: 'Attendance' | 'Fees' | 'Admissions' | 'Academics' | 'Substitutions' | 'Leaves' | 'Broadcasts' | 'Security';
  details: string;
  targetEntity: string;
  timestamp: string;
  platform: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'info';
  badgeColor: string;
}

const ALL_USERS_MOCK_LOGS: UserActivityLog[] = [
  {
    id: 'log_01',
    userName: 'Sarah Jenkins',
    userRole: 'admin_staff',
    roleTitle: 'Admin Staff',
    avatarInitials: 'SJ',
    actionTitle: 'New Student Admission Enrolled',
    category: 'Admissions',
    details: 'Enrolled new student profile for Arjun Reddy into Class 10-A (Admission No: STD-2026-088, Father: Mohan Reddy).',
    targetEntity: 'Student: Arjun Reddy (10-A)',
    timestamp: 'Today, 11:45 AM',
    platform: 'School App • Android',
    ipAddress: '192.168.1.104',
    status: 'success',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  {
    id: 'log_02',
    userName: 'Mrs. Anita Sharma',
    userRole: 'teacher',
    roleTitle: 'Class Teacher (9-B)',
    avatarInitials: 'AS',
    actionTitle: 'Class Attendance Marked',
    category: 'Attendance',
    details: 'Submitted morning attendance for Class 9-B Mathematics: 42 Students Present, 2 Absent (Roll #14, #28).',
    targetEntity: 'Class 9-B • Morning Session',
    timestamp: 'Today, 10:15 AM',
    platform: 'School App • iOS',
    ipAddress: '192.168.1.118',
    status: 'success',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
  },
  {
    id: 'log_03',
    userName: 'Suresh Nair',
    userRole: 'accountant',
    roleTitle: 'Chief Accountant',
    avatarInitials: 'SN',
    actionTitle: 'Student Term 2 Fee Collected',
    category: 'Fees',
    details: 'Collected ₹14,500 Term 2 Tuition & Transport Fee from Aman Gupta (Class 10-A) via UPI. Issued Receipt #REC-9821.',
    targetEntity: 'Receipt #REC-9821 • ₹14,500',
    timestamp: 'Today, 09:50 AM',
    platform: 'Web Portal • Chrome Windows',
    ipAddress: '192.168.1.102',
    status: 'success',
    badgeColor: 'bg-[#f0c110]/20 text-[#ffe5a0] border-[#f0c110]/40',
  },
  {
    id: 'log_04',
    userName: 'Sarah Jenkins',
    userRole: 'admin_staff',
    roleTitle: 'Admin Staff',
    avatarInitials: 'SJ',
    actionTitle: 'Proxy Substitute Assigned',
    category: 'Substitutions',
    details: 'Allotted Mr. Rajesh Kumar as Substitute Faculty for Physics in Class 8-A Period 3 due to leave.',
    targetEntity: 'Class 8-A • Period 3 (Physics)',
    timestamp: 'Today, 09:20 AM',
    platform: 'School App • Android',
    ipAddress: '192.168.1.104',
    status: 'info',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  {
    id: 'log_05',
    userName: 'Mr. Rajesh Kumar',
    userRole: 'teacher',
    roleTitle: 'Faculty (Science)',
    avatarInitials: 'RK',
    actionTitle: 'Daily Diary Homework Posted',
    category: 'Academics',
    details: 'Published Science Daily Diary task: "Complete Chapter 4 numerical problems 1-10" for Class 8-A & 8-B.',
    targetEntity: 'Class 8 • Science Homework',
    timestamp: 'Today, 08:45 AM',
    platform: 'School App • Android',
    ipAddress: '192.168.1.135',
    status: 'success',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
  },
  {
    id: 'log_06',
    userName: 'Vikram Bus Incharge',
    userRole: 'transport',
    roleTitle: 'Transport Fleet Lead',
    avatarInitials: 'VB',
    actionTitle: 'Morning Bus Route Completed',
    category: 'Attendance',
    details: 'Bus TS07UP2292 (Route 1) completed pickup journey: 38 students boarded, 0 delays reported.',
    targetEntity: 'Fleet Bus TS07UP2292 • Route 1',
    timestamp: 'Today, 08:30 AM',
    platform: 'GPS Terminal • Telematics',
    ipAddress: '10.0.12.88',
    status: 'success',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  },
  {
    id: 'log_07',
    userName: 'Principal Sharma',
    userRole: 'super_admin',
    roleTitle: 'Super Administrator',
    avatarInitials: 'PS',
    actionTitle: 'Role Privileges Updated',
    category: 'Security',
    details: 'Updated module access permissions matrix for Admin Staff role: Enabled Salary Categories view permission.',
    targetEntity: 'Role: Admin Staff (ID #2)',
    timestamp: 'Yesterday, 05:15 PM',
    platform: 'Super Admin Terminal',
    ipAddress: '192.168.1.104',
    status: 'warning',
    badgeColor: 'bg-[#f0c110]/20 text-[#ffe5a0] border-[#f0c110]/40',
  },
  {
    id: 'log_08',
    userName: 'Prof. Michael Chen',
    userRole: 'teacher',
    roleTitle: 'Senior Teacher',
    avatarInitials: 'MC',
    actionTitle: 'Medical Leave Application Filed',
    category: 'Leaves',
    details: 'Submitted application for 3 days Medical Leave from 26 Oct to 28 Oct with medical prescription attached.',
    targetEntity: 'Leave Request #LA-2026-88',
    timestamp: 'Yesterday, 03:40 PM',
    platform: 'School App • iOS',
    ipAddress: '192.168.1.144',
    status: 'info',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  {
    id: 'log_09',
    userName: 'Sarah Jenkins',
    userRole: 'admin_staff',
    roleTitle: 'Admin Staff',
    avatarInitials: 'SJ',
    actionTitle: 'Fee Reminder Broadcast Dispatched',
    category: 'Broadcasts',
    details: 'Dispatched automated push alert and SMS notification to 480 parents regarding Term 2 tuition fee deadline.',
    targetEntity: 'Broadcast: Term 2 Fee Notice',
    timestamp: 'Yesterday, 02:10 PM',
    platform: 'School App • Android',
    ipAddress: '192.168.1.104',
    status: 'success',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  {
    id: 'log_10',
    userName: 'Mr. Ramesh Gupta',
    userRole: 'parent',
    roleTitle: 'Parent (Rohan Gupta, 10-A)',
    avatarInitials: 'RG',
    actionTitle: 'Term 2 Fee Online Payment',
    category: 'Fees',
    details: 'Paid ₹12,000 Term 2 fee online via Net Banking gateway for student Rohan Gupta (Receipt #ONLINE-5512).',
    targetEntity: 'Student: Rohan Gupta (Adm #8812)',
    timestamp: '22 Oct 2026, 07:20 PM',
    platform: 'Parent Portal • Web',
    ipAddress: '49.205.112.44',
    status: 'success',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
];

export const SuperAdminAllUsersActivityLogsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isSmallPhone, headerPaddingTop, scrollBottomPadding } = useResponsive();

  const [logs, setLogs] = useState<UserActivityLog[]>(ALL_USERS_MOCK_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'All' | 'admin_staff' | 'teacher' | 'accountant' | 'transport' | 'super_admin' | 'parent'>('All');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Attendance' | 'Fees' | 'Admissions' | 'Academics' | 'Substitutions' | 'Leaves' | 'Broadcasts' | 'Security'>('All');
  const [selectedLog, setSelectedLog] = useState<UserActivityLog | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const filteredLogs = logs.filter(log => {
    const matchesRole = selectedRole === 'All' || log.userRole === selectedRole;
    const matchesCategory = selectedCategory === 'All' || log.category === selectedCategory;
    const matchesSearch = log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.actionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.targetEntity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.roleTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesCategory && matchesSearch;
  });

  const handleExport = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const getRoleBadgeStyle = (role: UserActivityLog['userRole']) => {
    switch (role) {
      case 'super_admin': return 'bg-[#f0c110]/20 border-[#f0c110]/40 text-[#ffe5a0]';
      case 'admin_staff': return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
      case 'teacher': return 'bg-sky-500/20 border-sky-500/40 text-sky-400';
      case 'accountant': return 'bg-amber-500/20 border-amber-500/40 text-amber-400';
      case 'transport': return 'bg-teal-500/20 border-teal-500/40 text-teal-300';
      case 'parent': return 'bg-purple-500/20 border-purple-500/40 text-purple-300';
      default: return 'bg-white/10 border-white/20 text-white';
    }
  };

  const getCategoryIcon = (category: UserActivityLog['category']) => {
    switch (category) {
      case 'Admissions': return <User size={14} color="#34d399" />;
      case 'Attendance': return <UserCheck size={14} color="#38bdf8" />;
      case 'Fees': return <Banknote size={14} color="#ffe5a0" />;
      case 'Academics': return <BookOpen size={14} color="#38bdf8" />;
      case 'Substitutions': return <ArrowLeftRight size={14} color="#c084fc" />;
      case 'Leaves': return <Calendar size={14} color="#f59e0b" />;
      case 'Broadcasts': return <AlertTriangle size={14} color="#ff516a" />;
      case 'Security': return <ShieldCheck size={14} color="#ffe5a0" />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1d2022', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center shadow-[0_0_12px_rgba(240,193,16,0.3)]">
              <History size={20} color="#f0c110" />
            </View>
            <View>
              <Text className="text-white text-lg font-bold">Users Activity Logs</Text>
              <Text className="text-[#ffe5a0] text-[9px] font-bold tracking-widest uppercase">ALL USERS AUDIT STREAM</Text>
            </View>
          </View>

          <Pressable 
            onPress={handleExport}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f0c110] active:scale-95 shadow-md shadow-[#f0c110]/30"
          >
            <Download size={14} color="#101415" />
            <Text className="text-[#101415] text-xs font-black uppercase">Export</Text>
          </Pressable>
        </BlurView>

        {/* Glowing border line */}
        <LinearGradient 
          colors={['rgba(245, 197, 24, 0.2)', 'transparent']} 
          style={{ position: 'absolute', bottom: -12, left: 0, right: 0, height: 12 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Metrics */}
        <View className="px-5 mb-4">
          <View className="flex-row justify-between" style={{ gap: 8 }}>
            <GlassCard className="flex-1 p-3 border border-white/10 items-center">
              <Text className="text-[#ffe5a0] text-lg font-black">{logs.length}</Text>
              <Text className="text-white/50 text-[9px] font-bold uppercase mt-0.5">Total Logs</Text>
            </GlassCard>

            <GlassCard className="flex-1 p-3 border border-emerald-500/30 items-center">
              <Text className="text-emerald-400 text-lg font-black">
                {logs.filter(l => l.userRole === 'admin_staff').length}
              </Text>
              <Text className="text-emerald-400/70 text-[9px] font-bold uppercase mt-0.5">Admin Staff</Text>
            </GlassCard>

            <GlassCard className="flex-1 p-3 border border-sky-500/30 items-center">
              <Text className="text-sky-400 text-lg font-black">
                {logs.filter(l => l.userRole === 'teacher').length}
              </Text>
              <Text className="text-sky-400/70 text-[9px] font-bold uppercase mt-0.5">Teachers</Text>
            </GlassCard>

            <GlassCard className="flex-1 p-3 border border-amber-500/30 items-center">
              <Text className="text-amber-400 text-lg font-black">
                {logs.filter(l => l.userRole === 'accountant' || l.category === 'Fees').length}
              </Text>
              <Text className="text-amber-400/70 text-[9px] font-bold uppercase mt-0.5">Finance</Text>
            </GlassCard>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-5 mb-3.5">
          <GlassCard className="flex-row items-center px-3.5 py-2.5 border border-white/10">
            <Search size={18} color="#ffe5a0" style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Search user, role, action, student, receipt..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white text-xs font-semibold"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} className="p-1">
                <Text className="text-white/50 text-xs">Clear</Text>
              </Pressable>
            )}
          </GlassCard>
        </View>

        {/* Role Filters Carousel */}
        <View className="mb-2.5">
          <Text className="text-white/50 text-[10px] font-bold uppercase tracking-wider px-5 mb-1.5">Filter by User Role</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}>
            {[
              { id: 'All', label: 'All Roles' },
              { id: 'admin_staff', label: 'Admin Staff' },
              { id: 'teacher', label: 'Teachers' },
              { id: 'accountant', label: 'Accountants' },
              { id: 'transport', label: 'Transport' },
              { id: 'super_admin', label: 'Super Admin' },
              { id: 'parent', label: 'Parents' },
            ].map(roleItem => {
              const isSelected = selectedRole === roleItem.id;
              return (
                <Pressable
                  key={roleItem.id}
                  onPress={() => setSelectedRole(roleItem.id as any)}
                  className={`px-3 py-1.5 rounded-xl border ${
                    isSelected ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <Text className={`text-xs font-extrabold ${isSelected ? 'text-[#101415]' : 'text-white/70'}`}>
                    {roleItem.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Category Filters Carousel */}
        <View className="mb-4">
          <Text className="text-white/50 text-[10px] font-bold uppercase tracking-wider px-5 mb-1.5">Filter by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}>
            {(['All', 'Attendance', 'Fees', 'Admissions', 'Academics', 'Substitutions', 'Leaves', 'Broadcasts', 'Security'] as const).map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl border ${
                    isSelected ? 'bg-[#ffe5a0] border-[#ffe5a0]' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <Text className={`text-[11px] font-bold ${isSelected ? 'text-[#101415]' : 'text-white/60'}`}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Activity Logs Stream */}
        <View className="px-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-sm font-extrabold">All User Logs ({filteredLogs.length})</Text>
            <Text className="text-[#ffe5a0] text-[10px] font-bold uppercase">Real-Time Sync</Text>
          </View>

          {filteredLogs.length === 0 ? (
            <GlassCard className="p-8 items-center justify-center border border-white/10">
              <History size={36} color="rgba(255,255,255,0.2)" style={{ marginBottom: 12 }} />
              <Text className="text-white font-bold text-sm text-center">No Activity Logs Found</Text>
              <Text className="text-white/40 text-xs text-center mt-1">No events match the selected role or filter filters.</Text>
            </GlassCard>
          ) : (
            filteredLogs.map(log => (
              <Pressable
                key={log.id}
                onPress={() => setSelectedLog(log)}
                className="active:opacity-90"
              >
                <GlassCard 
                  className="p-4 mb-3 border border-white/10"
                  style={{ backgroundColor: 'rgba(22, 25, 27, 0.75)' }}
                >
                  {/* Top Row: User Avatar + Name + Role Badge */}
                  <View className="flex-row items-center justify-between mb-2.5 pb-2.5 border-b border-white/5">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className={`w-9 h-9 rounded-full items-center justify-center mr-2.5 border ${getRoleBadgeStyle(log.userRole)}`}>
                        <Text className="text-white font-black text-xs">{log.avatarInitials}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-extrabold text-xs" numberOfLines={1}>
                          {log.userName}
                        </Text>
                        <Text className="text-white/50 text-[10px] font-semibold">{log.roleTitle}</Text>
                      </View>
                    </View>

                    <View className={`px-2 py-0.5 rounded-lg border ${log.badgeColor}`}>
                      <Text className="text-[9px] font-extrabold uppercase">{log.category}</Text>
                    </View>
                  </View>

                  {/* Action Title */}
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    {getCategoryIcon(log.category)}
                    <Text className="text-white font-bold text-xs flex-1" numberOfLines={1}>
                      {log.actionTitle}
                    </Text>
                  </View>

                  {/* Details */}
                  <Text className="text-white/70 text-xs leading-relaxed mb-3">
                    {log.details}
                  </Text>

                  {/* Bottom Footer Info */}
                  <View className="flex-row items-center justify-between pt-2 border-t border-white/5">
                    <View className="flex-row items-center gap-1">
                      <Clock size={11} color="rgba(255, 255, 255, 0.4)" />
                      <Text className="text-white/40 text-[10px]">{log.timestamp}</Text>
                    </View>
                    <Text className="text-[#ffe5a0]/70 text-[10px] font-medium">{log.platform}</Text>
                  </View>
                </GlassCard>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Detailed Log Modal */}
      {selectedLog && (
        <Modal visible={!!selectedLog} transparent animationType="fade" onRequestClose={() => setSelectedLog(null)}>
          <Pressable onPress={() => setSelectedLog(null)} className="flex-1 bg-black/80 justify-center items-center p-5">
            <Pressable onPress={(e) => e.stopPropagation()} className="w-full max-w-sm bg-[#16191b] p-5 rounded-3xl border border-[#f0c110]/40 shadow-2xl">
              {/* Header */}
              <View className="flex-row justify-between items-center pb-3 border-b border-white/10 mb-4">
                <View className="flex-row items-center">
                  <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${getRoleBadgeStyle(selectedLog.userRole)}`}>
                    <History size={16} color="#ffe5a0" />
                  </View>
                  <View>
                    <Text className="text-white font-extrabold text-sm">Audit Trace Record</Text>
                    <Text className="text-[#ffe5a0] text-[9px] font-bold">LOG #{selectedLog.id.toUpperCase()}</Text>
                  </View>
                </View>
                <Pressable onPress={() => setSelectedLog(null)} className="p-1">
                  <X size={20} color="rgba(255,255,255,0.6)" />
                </Pressable>
              </View>

              {/* User Metadata */}
              <View className="bg-black/50 p-3 rounded-2xl border border-white/5 mb-3.5" style={{ gap: 8 }}>
                <View className="flex-row justify-between">
                  <Text className="text-white/50 text-xs">User</Text>
                  <Text className="text-white font-extrabold text-xs">{selectedLog.userName} ({selectedLog.roleTitle})</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/50 text-xs">Action</Text>
                  <Text className="text-[#ffe5a0] font-bold text-xs">{selectedLog.actionTitle}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/50 text-xs">Target</Text>
                  <Text className="text-white font-bold text-xs">{selectedLog.targetEntity}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/50 text-xs">Timestamp</Text>
                  <Text className="text-white/80 text-xs">{selectedLog.timestamp}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/50 text-xs">Platform / IP</Text>
                  <Text className="text-emerald-400 text-xs">{selectedLog.platform} • {selectedLog.ipAddress}</Text>
                </View>
              </View>

              {/* Event Content */}
              <Text className="text-white/80 text-xs leading-relaxed mb-4 px-1">
                {selectedLog.details}
              </Text>

              {/* Dismiss Button */}
              <Pressable
                onPress={() => setSelectedLog(null)}
                className="w-full py-3 rounded-xl bg-[#f0c110] items-center active:scale-95"
              >
                <Text className="text-[#101415] text-xs font-black uppercase">Dismiss Record</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Export Toast */}
      {toastVisible && (
        <View 
          className="absolute bottom-10 left-5 right-5 z-50 py-3.5 px-4 rounded-2xl flex-row items-center justify-between border border-[#f0c110]/50 shadow-2xl"
          style={{ backgroundColor: '#16191b' }}
        >
          <View className="flex-row items-center flex-1 mr-2">
            <CheckCircle2 size={20} color="#f0c110" style={{ marginRight: 10 }} />
            <View className="flex-1">
              <Text className="text-white font-bold text-xs">Audit Ledger Exported</Text>
              <Text className="text-white/60 text-[10px]">All users activity logs downloaded to device storage.</Text>
            </View>
          </View>
          <Pressable onPress={() => setToastVisible(false)} className="p-1">
            <Text className="text-[#f0c110] text-xs font-bold uppercase">OK</Text>
          </Pressable>
        </View>
      )}
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
  },
});

export default SuperAdminAllUsersActivityLogsScreen;
