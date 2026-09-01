import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  History, ShieldCheck, Key, Users, DollarSign, 
  Server, AlertTriangle, Search, Filter, Download, 
  CheckCircle2, Clock, ChevronLeft, Calendar, FileSpreadsheet,
  Layers, Lock, Database, UserPlus, RefreshCw, Smartphone
} from 'lucide-react-native';
import { GlassCard } from '../../components/GlassCard';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

export interface SuperAdminAuditLogItem {
  id: string;
  actionTitle: string;
  category: 'Security' | 'Payroll' | 'Staff' | 'System' | 'Broadcast';
  details: string;
  performedBy: string;
  targetResource: string;
  timestamp: string;
  ipAddress: string;
  auditHash: string;
  badgeColor: string;
  iconType: 'security' | 'payroll' | 'staff' | 'system' | 'broadcast' | 'database';
}

const SUPER_ADMIN_MOCK_LOGS: SuperAdminAuditLogItem[] = [
  {
    id: 'sa_log_1',
    actionTitle: 'Role Permissions Matrix Modified',
    category: 'Security',
    details: 'Updated module permissions for "Admin Staff" role: Granted Salary Categories Read Access and revoked Class Deletion privilege.',
    performedBy: 'Principal Sharma (Super Admin)',
    targetResource: 'Role: Admin Staff (ID #2)',
    timestamp: 'Today, 02:45 PM',
    ipAddress: '192.168.1.104 • SuperRoot Terminal',
    auditHash: 'SHA256: 8f92a149b0...',
    badgeColor: 'bg-[#f0c110]/20 text-[#ffe5a0] border-[#f0c110]/40',
    iconType: 'security',
  },
  {
    id: 'sa_log_2',
    actionTitle: 'Onboarded Senior Faculty & CTC Setup',
    category: 'Staff',
    details: 'Onboarded Dr. Robert Vance as HOD Physics (Teaching Category) with monthly CTC ₹85,000 and mapped Biometric Code BIO-889.',
    performedBy: 'Principal Sharma (Super Admin)',
    targetResource: 'Staff: Dr. Robert Vance (EMP-2026-94)',
    timestamp: 'Today, 01:15 PM',
    ipAddress: '192.168.1.104 • SuperRoot Terminal',
    auditHash: 'SHA256: 7d44c821ea...',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    iconType: 'staff',
  },
  {
    id: 'sa_log_3',
    actionTitle: 'Salary Component Head Adjusted',
    category: 'Payroll',
    details: 'Modified House Rent Allowance (HRA) master component from 18% to 20% of Basic Pay for all Teaching Faculty.',
    performedBy: 'Principal Sharma (Super Admin)',
    targetResource: 'Salary Component: HRA (#SC-02)',
    timestamp: 'Today, 11:30 AM',
    ipAddress: '192.168.1.104 • SuperRoot Terminal',
    auditHash: 'SHA256: b38e99120c...',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    iconType: 'payroll',
  },
  {
    id: 'sa_log_4',
    actionTitle: 'Faculty Attendance Manual Override',
    category: 'Staff',
    details: 'Overrode attendance status for Mrs. Anita Sharma from "Absent" to "On Leave (Medical)" for date 24 Oct 2026.',
    performedBy: 'Principal Sharma (Super Admin)',
    targetResource: 'Staff Attendance: Mrs. Anita Sharma',
    timestamp: 'Today, 09:10 AM',
    ipAddress: '192.168.1.104 • SuperRoot Terminal',
    auditHash: 'SHA256: a12ff9801d...',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
    iconType: 'staff',
  },
  {
    id: 'sa_log_5',
    actionTitle: 'Campus Emergency Broadcast Dispatched',
    category: 'Broadcast',
    details: 'Dispatched Priority Level 1 Severe Weather Alert notification to 1,248 Parents, 85 Teachers, and 12 Admin Staff.',
    performedBy: 'Principal Sharma (Super Admin)',
    targetResource: 'Broadcast Channel: All Campuses',
    timestamp: 'Yesterday, 04:30 PM',
    ipAddress: '192.168.1.104 • SuperRoot Terminal',
    auditHash: 'SHA256: e80112fa9b...',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    iconType: 'broadcast',
  },
  {
    id: 'sa_log_6',
    actionTitle: 'Encrypted Cloud Database Backup',
    category: 'System',
    details: 'Completed full encrypted database snapshot (42.8 MB) and synchronized to secure off-site cloud storage vault.',
    performedBy: 'Automated Super Root Daemon',
    targetResource: 'PostgreSQL DB Snapshot #BK-9921',
    timestamp: 'Yesterday, 02:00 AM',
    ipAddress: '10.0.4.12 • Cloud Cron Service',
    auditHash: 'SHA256: 48ce0198ad...',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    iconType: 'database',
  },
  {
    id: 'sa_log_7',
    actionTitle: 'Accountant User Security Credentials Created',
    category: 'Security',
    details: 'Generated new portal user account for Accountant Suresh Nair with Two-Factor Authentication enforced.',
    performedBy: 'Principal Sharma (Super Admin)',
    targetResource: 'User Account: suresh.nair@kts.edu.in',
    timestamp: '22 Oct 2026, 03:20 PM',
    ipAddress: '192.168.1.104 • SuperRoot Terminal',
    auditHash: 'SHA256: f19e34bc81...',
    badgeColor: 'bg-[#f0c110]/20 text-[#ffe5a0] border-[#f0c110]/40',
    iconType: 'security',
  },
  {
    id: 'sa_log_8',
    actionTitle: 'e-TimeOffice Biometric Device Synced',
    category: 'System',
    details: 'Initiated manual sync on Biometric Gateway Terminal #01; 84 faculty punch records verified and committed.',
    performedBy: 'Principal Sharma (Super Admin)',
    targetResource: 'Biometric Terminal #01 (Main Gate)',
    timestamp: '21 Oct 2026, 06:15 PM',
    ipAddress: '192.168.1.104 • SuperRoot Terminal',
    auditHash: 'SHA256: c3298a00ef...',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    iconType: 'system',
  },
];

export const SuperAdminActivityLogScreen: React.FC<any> = ({ navigation: propNavigation }) => {
  const defaultNavigation = useNavigation<any>();
  const navigation = propNavigation || defaultNavigation;
  const { user } = useAuthStore();
  const { isSmallPhone, isTablet, insets, headerPaddingTop, scrollBottomPadding, containerStyle } = useResponsive();

  const [logs, setLogs] = useState<SuperAdminAuditLogItem[]>(SUPER_ADMIN_MOCK_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Security' | 'Payroll' | 'Staff' | 'System' | 'Broadcast'>('All');
  const [toastVisible, setToastVisible] = useState(false);

  // Safe BackHandler
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

  const filteredLogs = logs.filter(log => {
    const matchesCategory = categoryFilter === 'All' || log.category === categoryFilter;
    const matchesSearch = log.actionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.targetResource.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.auditHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.performedBy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleExport = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const renderIcon = (type: SuperAdminAuditLogItem['iconType']) => {
    switch (type) {
      case 'security': return <Lock size={16} color="#ffe5a0" />;
      case 'payroll': return <DollarSign size={16} color="#f59e0b" />;
      case 'staff': return <Users size={16} color="#34d399" />;
      case 'broadcast': return <AlertTriangle size={16} color="#ff516a" />;
      case 'database': return <Database size={16} color="#c084fc" />;
      case 'system': return <Server size={16} color="#2dd4bf" />;
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
            <Pressable 
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/15 items-center justify-center active:scale-95"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <ChevronLeft size={22} color="#ffe5a0" />
            </Pressable>
            <View>
              <Text className="text-white text-lg font-bold">My Activity Logs</Text>
              <Text className="text-[#ffe5a0] text-[10px] font-bold tracking-wider uppercase">SUPER ADMIN AUDIT TRAIL</Text>
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
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Metric Summary Cards */}
        <View className="px-5 mb-5">
          <View className="flex-row justify-between" style={{ gap: 8 }}>
            <GlassCard className="flex-1 p-3.5 border border-white/10 items-center">
              <Text className="text-[#ffe5a0] text-xl font-black">142</Text>
              <Text className="text-white/50 text-[10px] font-bold uppercase mt-0.5">Total Logs</Text>
            </GlassCard>

            <GlassCard className="flex-1 p-3.5 border border-[#f0c110]/30 items-center">
              <Text className="text-[#f0c110] text-xl font-black">28</Text>
              <Text className="text-[#ffe5a0]/70 text-[10px] font-bold uppercase mt-0.5">Security</Text>
            </GlassCard>

            <GlassCard className="flex-1 p-3.5 border border-white/10 items-center">
              <Text className="text-amber-400 text-xl font-black">36</Text>
              <Text className="text-white/50 text-[10px] font-bold uppercase mt-0.5">Payroll</Text>
            </GlassCard>

            <GlassCard className="flex-1 p-3.5 border border-emerald-500/30 items-center">
              <Text className="text-emerald-400 text-xl font-black">8</Text>
              <Text className="text-emerald-400/70 text-[10px] font-bold uppercase mt-0.5">Today</Text>
            </GlassCard>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-5 mb-4">
          <GlassCard className="flex-row items-center px-3.5 py-2.5 border border-white/10">
            <Search size={18} color="#ffe5a0" style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Search audit actions, target, hash, or details..."
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

        {/* Category Filter Chips */}
        <View className="mb-5">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {(['All', 'Security', 'Payroll', 'Staff', 'System', 'Broadcast'] as const).map(cat => {
              const isSelected = categoryFilter === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-2 rounded-xl border ${
                    isSelected ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <Text className={`text-xs font-extrabold ${isSelected ? 'text-[#101415]' : 'text-white/70'}`}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Audit Log Stream */}
        <View className="px-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-sm font-extrabold">Audit Ledger Entries ({filteredLogs.length})</Text>
            <View className="flex-row items-center gap-1">
              <ShieldCheck size={14} color="#ffe5a0" />
              <Text className="text-[#ffe5a0] text-[10px] font-bold uppercase">Immutable Log Chain</Text>
            </View>
          </View>

          {filteredLogs.length === 0 ? (
            <GlassCard className="p-8 items-center justify-center border border-white/10">
              <History size={36} color="rgba(255,255,255,0.2)" style={{ marginBottom: 12 }} />
              <Text className="text-white font-bold text-sm text-center">No Audit Entries Found</Text>
              <Text className="text-white/40 text-xs text-center mt-1">Try adjusting your search or category filter criteria.</Text>
            </GlassCard>
          ) : (
            filteredLogs.map(log => (
              <GlassCard 
                key={log.id} 
                className="p-4 mb-3 border border-white/10"
                style={{ backgroundColor: 'rgba(22, 25, 27, 0.7)' }}
              >
                {/* Top Row: Icon + Action Title + Category Badge */}
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${log.badgeColor}`}>
                      {renderIcon(log.iconType)}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-extrabold text-sm" numberOfLines={1}>
                        {log.actionTitle}
                      </Text>
                      <Text className="text-[#ffe5a0]/70 text-[10px] font-semibold">{log.timestamp}</Text>
                    </View>
                  </View>

                  <View className={`px-2 py-0.5 rounded-lg border ${log.badgeColor}`}>
                    <Text className="text-[9px] font-extrabold uppercase">{log.category}</Text>
                  </View>
                </View>

                {/* Event Description */}
                <Text className="text-white/80 text-xs leading-relaxed mb-3">
                  {log.details}
                </Text>

                {/* Metadata Details Card */}
                <View className="bg-black/40 p-2.5 rounded-xl border border-white/5" style={{ gap: 6 }}>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white/40 text-[10px] font-bold uppercase">Target Entity</Text>
                    <Text className="text-[#ffe5a0] text-[10px] font-bold" numberOfLines={1}>{log.targetResource}</Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-white/40 text-[10px] font-bold uppercase">Performed By</Text>
                    <Text className="text-white/70 text-[10px] font-semibold">{log.performedBy}</Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-white/40 text-[10px] font-bold uppercase">Session / Host</Text>
                    <Text className="text-white/50 text-[9px]">{log.ipAddress}</Text>
                  </View>

                  <View className="flex-row justify-between items-center pt-1 border-t border-white/5">
                    <Text className="text-white/30 text-[9px] font-mono">HASH</Text>
                    <Text className="text-emerald-400/80 text-[9px] font-mono">{log.auditHash}</Text>
                  </View>
                </View>
              </GlassCard>
            ))
          )}
        </View>
      </ScrollView>

      {/* Export Success Toast Modal */}
      {toastVisible && (
        <View 
          className="absolute bottom-10 left-5 right-5 z-50 py-3.5 px-4 rounded-2xl flex-row items-center justify-between border border-[#f0c110]/50 shadow-2xl"
          style={{ backgroundColor: '#16191b' }}
        >
          <View className="flex-row items-center flex-1 mr-2">
            <CheckCircle2 size={20} color="#f0c110" style={{ marginRight: 10 }} />
            <View className="flex-1">
              <Text className="text-white font-bold text-xs">Audit Ledger Exported</Text>
              <Text className="text-white/60 text-[10px]">Encrypted CSV audit export downloaded to device storage.</Text>
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

export default SuperAdminActivityLogScreen;
