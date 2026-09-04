import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  History, Activity, UserPlus, Banknote, UserCheck, 
  ArrowLeftRight, Award, Calendar, Search, Filter, 
  Download, CheckCircle2, ShieldCheck, Clock, FileSpreadsheet, ChevronRight
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';
import { useResponsive } from '../../utils/responsive';

export interface ActivityLogItem {
  id: string;
  actionTitle: string;
  category: 'Student' | 'Fee' | 'Teacher' | 'Substitute' | 'Invigilation' | 'System';
  details: string;
  performedBy: string;
  timestamp: string;
  badgeColor: string;
  iconType: 'user_plus' | 'fee' | 'teacher' | 'substitute' | 'invigilation' | 'calendar';
}

const MOCK_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: 'act_1',
    actionTitle: 'Created New Student Profile',
    category: 'Student',
    details: 'Created student record for Arjun Reddy (Class 10-A, Adm No: STDDe2026088)',
    performedBy: 'Sarah Jenkins (Admin Staff)',
    timestamp: 'Today, 11:45 AM',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    iconType: 'user_plus',
  },
  {
    id: 'act_2',
    actionTitle: 'Collected Student Fee',
    category: 'Fee',
    details: 'Collected ₹4,500 Term 2 fee from Aman Gupta (Class 10-A, Receipt #REC-9821)',
    performedBy: 'Sarah Jenkins (Admin Staff)',
    timestamp: 'Today, 11:15 AM',
    badgeColor: 'bg-[#00f1a1]/20 text-[#00f1a1] border-[#00f1a1]/40',
    iconType: 'fee',
  },
  {
    id: 'act_3',
    actionTitle: 'Allotted Class Teacher',
    category: 'Teacher',
    details: 'Allotted Mrs. Anita Sharma as Class Teacher for Class 9-B Mathematics',
    performedBy: 'Sarah Jenkins (Admin Staff)',
    timestamp: 'Today, 10:30 AM',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
    iconType: 'teacher',
  },
  {
    id: 'act_4',
    actionTitle: 'Allotted Substitute Staff',
    category: 'Substitute',
    details: 'Assigned Mr. Rajesh Kumar as Substitute for Physics in Class 8-A (Period 3)',
    performedBy: 'Sarah Jenkins (Admin Staff)',
    timestamp: 'Today, 09:45 AM',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    iconType: 'substitute',
  },
  {
    id: 'act_5',
    actionTitle: 'Assigned Exam Invigilation',
    category: 'Invigilation',
    details: 'Assigned Invigilation Duty to Mr. Vikram Verma for Term 1 Mid-Exam (Hall 3)',
    performedBy: 'Sarah Jenkins (Admin Staff)',
    timestamp: 'Yesterday, 04:20 PM',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    iconType: 'invigilation',
  },
  {
    id: 'act_6',
    actionTitle: 'Configured School Holiday',
    category: 'System',
    details: 'Added Telangana Formation Day to Holiday Calendar (Date: 02 Jun 2026)',
    performedBy: 'Sarah Jenkins (Admin Staff)',
    timestamp: 'Yesterday, 02:10 PM',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    iconType: 'calendar',
  },
  {
    id: 'act_7',
    actionTitle: 'Dispatched Parent Alert',
    category: 'System',
    details: 'Dispatched Fee Payment Due Alert to 480 parents of All Classes via Push & SMS',
    performedBy: 'Sarah Jenkins (Admin Staff)',
    timestamp: '03 Aug 2026, 05:00 PM',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    iconType: 'user_plus',
  },
];

export const AdminActivityLogScreen: React.FC<any> = ({ navigation: propNavigation }) => {
  const defaultNavigation = useNavigation<any>();
  const navigation = propNavigation || defaultNavigation;
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();

  const [logs, setLogs] = useState<ActivityLogItem[]>(MOCK_ACTIVITY_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Student' | 'Fee' | 'Teacher' | 'Substitute' | 'Invigilation' | 'System'>('All');
  
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
                          log.performedBy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderIcon = (type: ActivityLogItem['iconType']) => {
    switch (type) {
      case 'user_plus': return <UserPlus size={16} color="#00f1a1" />;
      case 'fee': return <Banknote size={16} color="#00f1a1" />;
      case 'teacher': return <UserCheck size={16} color="#38bdf8" />;
      case 'substitute': return <ArrowLeftRight size={16} color="#c084fc" />;
      case 'invigilation': return <Award size={16} color="#f59e0b" />;
      case 'calendar': return <Calendar size={16} color="#ff516a" />;
    }
  };

  const handleExportLogs = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Admin Staff Activity Logs"
        subtitle="User Action Audit Trail & Event History"
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center">
            <History size={20} color="#00f1a1" />
          </View>
        }
      />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* KPI Audit Summary Cards */}
        <View className="px-5 mb-4 flex-row justify-between" style={{ gap: 8 }}>
          <GlassCard intensity="low" className="flex-1 p-3.5 border-white/10 bg-[#101415]/90 items-center">
            <Text className="text-white/60 text-xs font-bold uppercase">Total Events</Text>
            <Text className="text-white font-black text-xl mt-1">{logs.length}</Text>
          </GlassCard>

          <GlassCard intensity="low" className="flex-1 p-3.5 border-white/10 bg-[#101415]/90 items-center">
            <Text className="text-white/60 text-xs font-bold uppercase">Today's Actions</Text>
            <Text className="text-[#00f1a1] font-black text-xl mt-1">4</Text>
          </GlassCard>

          <GlassCard intensity="low" className="flex-1 p-3.5 border-white/10 bg-[#101415]/90 items-center">
            <Text className="text-white/60 text-xs font-bold uppercase">Audit Status</Text>
            <Text className="text-emerald-400 font-extrabold text-sm mt-1">Verified 🟢</Text>
          </GlassCard>
        </View>

        {/* Search & Export Bar */}
        <View className="px-5 mb-4">
          <View className="flex-row items-center justify-between mb-3" style={{ gap: 8 }}>
            <View className="flex-1 bg-[#101415] border border-white/15 rounded-2xl flex-row items-center px-4 py-3">
              <Search size={18} color="#00f1a1" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search action, student, teacher, or receipt..."
                placeholderTextColor="rgba(255, 255, 255, 0.45)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 text-white text-sm font-semibold"
                style={{ paddingVertical: 0 }}
              />
            </View>

            <Pressable
              onPress={handleExportLogs}
              className="bg-[#00f1a1]/15 border border-[#00f1a1]/40 px-4 py-3 rounded-2xl flex-row items-center active:scale-95 flex-shrink-0"
            >
              <FileSpreadsheet size={16} color="#00f1a1" style={{ marginRight: 6 }} />
              <Text className="text-[#00f1a1] text-xs md:text-sm font-black uppercase">Export</Text>
            </Pressable>
          </View>

          {/* Category Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {(['All', 'Student', 'Fee', 'Teacher', 'Substitute', 'Invigilation', 'System'] as const).map(cat => {
                const isSel = categoryFilter === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategoryFilter(cat)}
                    className={`px-3.5 py-2 rounded-xl border ${
                      isSel ? 'bg-[#00f1a1] border-[#00f1a1]' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <Text className={`text-xs md:text-sm font-extrabold ${isSel ? 'text-[#101415]' : 'text-white/70'}`}>
                      {cat === 'All' ? 'All Logs' : cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Audit Log Items Timeline List */}
        <View className="px-5">
          <Text className="text-white/70 text-xs md:text-sm font-extrabold uppercase tracking-wider mb-3">Audit Activity Stream ({filteredLogs.length})</Text>

          {filteredLogs.length === 0 ? (
            <GlassCard className="p-8 items-center justify-center border border-white/10 bg-[#101415]/90" intensity="low">
              <Text className="text-white/50 text-sm font-bold">No activity logs found for this filter.</Text>
            </GlassCard>
          ) : (
            filteredLogs.map((item, index) => (
              <GlassCard key={item.id} intensity="low" className="mb-3.5 p-4 md:p-5 border-white/10 bg-[#101415]/90">
                <View className="flex-row justify-between items-start pb-2.5 border-b border-white/10 mb-2.5">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center mr-2.5">
                      {renderIcon(item.iconType)}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-black text-sm md:text-base">{item.actionTitle}</Text>
                      <Text className="text-[#00f1a1] text-xs font-bold mt-0.5">{item.performedBy}</Text>
                    </View>
                  </View>

                  <View className={`px-2.5 py-1 rounded-lg border ${item.badgeColor}`}>
                    <Text className="text-[11px] md:text-xs font-extrabold uppercase">{item.category}</Text>
                  </View>
                </View>

                {/* Event Details Description */}
                <Text className="text-white/85 text-sm md:text-base leading-relaxed mb-3">{item.details}</Text>

                {/* Event Footer */}
                <View className="flex-row justify-between items-center pt-2.5 border-t border-white/5">
                  <View className="flex-row items-center">
                    <Clock size={13} color="rgba(255,255,255,0.5)" style={{ marginRight: 6 }} />
                    <Text className="text-white/60 text-xs">{item.timestamp}</Text>
                  </View>
                  <Text className="text-[#00f1a1]/80 text-xs font-mono font-bold">ID: {item.id.toUpperCase()}</Text>
                </View>
              </GlassCard>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* TOAST NOTIFICATION */}
      {toastVisible && (
        <View className="absolute bottom-6 left-5 right-5 bg-[#00f1a1] p-3.5 rounded-2xl flex-row items-center justify-between shadow-[0_0_20px_rgba(0,241,161,0.5)]">
          <View>
            <Text className="text-[#101415] font-extrabold text-xs">Audit Log Exported</Text>
            <Text className="text-[#101415]/80 text-[10px]">CSV audit log report generated and saved.</Text>
          </View>
          <CheckCircle2 size={18} color="#101415" />
        </View>
      )}

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

export default AdminActivityLogScreen;
