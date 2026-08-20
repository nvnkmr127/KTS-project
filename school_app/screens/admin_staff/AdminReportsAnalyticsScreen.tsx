import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart2, TrendingUp, Award, AlertCircle, UserMinus, Landmark, FileText, FileSpreadsheet } from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { useResponsive } from '../../utils/responsive';

export const AdminReportsAnalyticsScreen: React.FC<any> = ({ navigation }) => {
  const { insets, isSmallPhone } = useResponsive();
  const [activeFilter, setActiveFilter] = useState<'week' | 'month' | 'term' | 'year'>('week');

  // Handle Hardware Back Button & System Back Gesture
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

  const kpis = [
    { id: '1', label: 'Fee Defaulters', value: '23', color: '#ff516a', icon: AlertCircle },
    { id: '2', label: 'Top Class', value: '10-A', color: '#00f1a1', icon: Award },
    { id: '3', label: 'Low Attendance', value: '14', color: '#f59e0b', icon: UserMinus },
    { id: '4', label: 'Fee Recovery', value: '91%', color: '#38bdf8', icon: Landmark },
  ];

  const classData = [
    { id: '1', name: 'Class 10-A', avgScore: '89.4%', attendance: '98.2%', status: 'ELITE', statusColor: '#00f1a1' },
    { id: '2', name: 'Class 9-B', avgScore: '76.1%', attendance: '91.0%', status: 'STABLE', statusColor: '#f59e0b' },
    { id: '3', name: 'Class 8-A', avgScore: '54.8%', attendance: '72.4%', status: 'CRITICAL', statusColor: '#ff516a' },
  ];

  const attendanceTrendHeights = [65, 70, 75, 70, 72, 80, 85, 87, 84, 82, 88, 90, 87, 85, 88, 92, 95, 93, 89, 91, 94, 96, 92, 90, 88, 92, 94, 97, 98, 95];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Reports & Analytics Console"
        subtitle="Performance Metrics & Insights"
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center">
            <BarChart2 size={20} color="#00f1a1" />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Filters & Export Bar */}
        <View className="px-5 mb-5 flex-row justify-between items-center">
          <View className="flex-row bg-[#101415]/90 p-1 rounded-2xl border border-white/10">
            {(['week', 'month', 'term', 'year'] as const).map(f => (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-xl ${activeFilter === f ? 'bg-[#00f1a1]' : ''}`}
              >
                <Text className={`text-[10px] font-bold uppercase ${activeFilter === f ? 'text-[#101415]' : 'text-white/50'}`}>
                  {f}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row" style={{ gap: 6 }}>
            <Pressable className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center">
              <FileText size={16} color="#00f1a1" />
            </Pressable>
            <Pressable className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center">
              <FileSpreadsheet size={16} color="#00f1a1" />
            </Pressable>
          </View>
        </View>

        {/* 4 Summary Stats Cards Grid */}
        <View className="px-5 mb-5 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
          {kpis.map(k => {
            const Icon = k.icon;
            return (
              <GlassCard key={k.id} intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/90">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-white/40 text-[10px] font-bold uppercase">{k.label}</Text>
                  <Icon size={14} color={k.color} />
                </View>
                <Text className="text-xl font-extrabold mt-0.5" style={{ color: k.color }}>{k.value}</Text>
                <Text className="text-white/50 text-[10px] mt-0.5">Academic Metric</Text>
              </GlassCard>
            );
          })}
        </View>

        {/* 30-Day Attendance Trend Chart */}
        <View className="px-5 mb-5">
          <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/90">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-white font-extrabold text-sm">Attendance Trend Overview</Text>
                <Text className="text-white/40 text-[10px]">30-Day active attendance tracking</Text>
              </View>
              <Text className="text-[#00f1a1] text-xs font-extrabold">Avg: 87.4%</Text>
            </View>

            <View className="h-36 flex-row items-end justify-between w-full pt-4">
              {attendanceTrendHeights.map((h, i) => (
                <View key={i} className="flex-1 items-center h-full justify-end px-0.5">
                  <View 
                    className="w-full rounded-t-md"
                    style={{ 
                      height: `${h}%`, 
                      backgroundColor: i === attendanceTrendHeights.length - 1 ? '#00f1a1' : 'rgba(0, 241, 161, 0.25)',
                    }} 
                  />
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

        {/* Class Performance Matrix Table */}
        <View className="px-5 mb-5">
          <GlassCard intensity="low" className="border-white/10 bg-[#101415]/90 overflow-hidden">
            <View className="p-3.5 border-b border-white/10">
              <Text className="text-white font-extrabold text-sm">Class Performance Matrix</Text>
            </View>

            <View className="divide-y divide-white/5">
              <View className="flex-row bg-white/5 p-3 justify-between">
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-white/40 text-[9px] sm:text-[9.5px] font-bold uppercase w-[35%]">Grade / Class</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-white/40 text-[9px] sm:text-[9.5px] font-bold uppercase w-[20%] text-center">Avg Score</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-white/40 text-[9px] sm:text-[9.5px] font-bold uppercase w-[25%] text-center">Attendance</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit className="text-white/40 text-[9px] sm:text-[9.5px] font-bold uppercase w-[20%] text-right">Status</Text>
              </View>

              {classData.map(cls => (
                <View key={cls.id} className="flex-row p-3.5 items-center justify-between">
                  <Text numberOfLines={1} className="text-white font-extrabold text-xs w-[35%]">{cls.name}</Text>
                  <Text numberOfLines={1} className="text-[#00f1a1] font-bold text-xs w-[20%] text-center">{cls.avgScore}</Text>
                  <Text numberOfLines={1} className="text-white/70 text-xs w-[25%] text-center">{cls.attendance}</Text>
                  <View className="w-[20%] items-end">
                    <View className="px-2 py-0.5 rounded-md border" style={{ borderColor: cls.statusColor + '40', backgroundColor: cls.statusColor + '20' }}>
                      <Text numberOfLines={1} className="text-[9px] font-extrabold" style={{ color: cls.statusColor }}>{cls.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

        <View style={{ height: 100 }} />
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
    paddingBottom: 100,
  },
});

export default AdminReportsAnalyticsScreen;
