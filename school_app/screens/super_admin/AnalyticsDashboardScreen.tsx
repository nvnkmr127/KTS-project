import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, FileSpreadsheet, FileText, AlertCircle, Award, UserMinus, Landmark } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';

const { width } = Dimensions.get('window');

export const AnalyticsDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<'week' | 'month' | 'term' | 'year'>('week');

  const kpis = [
    { id: '1', label: 'Defaulters', value: '23', color: '#ffb4ab', icon: AlertCircle, borderLeft: '#ffb4ab' },
    { id: '2', label: 'Top Class', value: '10-A', color: '#41eec2', icon: Award, borderLeft: '#41eec2', glow: true },
    { id: '3', label: 'Low Attendance', value: '14', color: '#ffe5a0', icon: UserMinus, borderLeft: '#ffe5a0' },
    { id: '4', label: 'Fee Recovery', value: '91%', color: '#e0bdff', icon: Landmark, borderLeft: '#e0bdff' },
  ];

  const classData = [
    { id: '1', name: '10-A (Sci)', avgScore: '89.4%', attendance: '98.2%', status: 'ELITE', statusColor: '#41eec2' },
    { id: '2', name: '12-C (Com)', avgScore: '76.1%', attendance: '91.0%', status: 'STABLE', statusColor: '#ffe5a0' },
    { id: '3', name: '9-B (Gen)', avgScore: '54.8%', attendance: '72.4%', status: 'CRITICAL', statusColor: '#ffb4ab' },
  ];

  const subjects = [
    { name: 'MATH', score: 92, status: 'high' },
    { name: 'SCI', score: 88, status: 'high' },
    { name: 'ENG', score: 74, status: 'avg' },
    { name: 'HIST', score: 65, status: 'avg' },
    { name: 'GEO', score: 42, status: 'low' },
    { name: 'ART', score: 90, status: 'high' },
    { name: 'PE', score: 98, status: 'high' },
  ];

  // Helper for rendering the heatmap cell color
  const getHeatmapColor = (status: string) => {
    if (status === 'high') return 'bg-[#41eec2]/20 border border-[#41eec2]/35 text-[#41eec2]';
    if (status === 'avg') return 'bg-[#ffe5a0]/20 border border-[#ffe5a0]/35 text-[#ffe5a0]';
    return 'bg-[#ffb4ab]/20 border border-[#ffb4ab]/35 text-[#ffb4ab]';
  };

  // Custom Chart heights representing 30-day attendance overview
  const attendanceTrendHeights = [65, 70, 75, 70, 72, 80, 85, 87, 84, 82, 88, 90, 87, 85, 88, 92, 95, 93, 89, 91, 94, 96, 92, 90, 88, 92, 94, 97, 98, 95];

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
        <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 28 : 20) }]}>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => navigation.goBack()} className="p-1 active:scale-95">
              <ChevronLeft size={24} color="#ffe5a0" />
            </Pressable>
            <Text className="text-xl font-bold text-white font-display-lg">Portal Analytics</Text>
          </View>
        </BlurView>
        
        {/* The glowing shadow below the line */}
        <LinearGradient 
          colors={['rgba(245, 197, 24, 0.15)', 'transparent']} 
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Filters & Actions Strip */}
        <View className="px-5 mb-6 gap-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row bg-white/5 p-1 rounded-full border border-white/5">
              <Pressable
                onPress={() => setActiveFilter('week')}
                className={`px-4 py-2 rounded-full ${activeFilter === 'week' ? 'bg-[#ffe5a0]' : ''}`}
              >
                <Text className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'week' ? 'text-[#000]' : 'text-[#d1c5ac]'}`}>This Week</Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveFilter('month')}
                className={`px-4 py-2 rounded-full ${activeFilter === 'month' ? 'bg-[#ffe5a0]' : ''}`}
              >
                <Text className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'month' ? 'text-[#000]' : 'text-[#d1c5ac]'}`}>Month</Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveFilter('term')}
                className={`px-4 py-2 rounded-full ${activeFilter === 'term' ? 'bg-[#ffe5a0]' : ''}`}
              >
                <Text className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'term' ? 'text-[#000]' : 'text-[#d1c5ac]'}`}>Term</Text>
              </Pressable>
            </View>

            <View className="flex-row gap-2">
              <Pressable className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center active:scale-95">
                <FileText size={18} color="#ffe5a0" />
              </Pressable>
              <Pressable className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center active:scale-95">
                <FileSpreadsheet size={18} color="#ffe5a0" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Horizontal KPI Strip */}
        <View className="mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <GlassCard
                  key={kpi.id}
                  className="w-44 p-4 mr-4 border border-white/10"
                  intensity="low"
                  style={{ borderLeftWidth: 4, borderLeftColor: kpi.borderLeft }}
                  glowColor={kpi.glow ? 'rgba(65, 238, 194, 0.25)' : undefined}
                >
                  <Text className="text-[#d1c5ac] text-[9px] font-bold uppercase tracking-wider mb-2">{kpi.label}</Text>
                  <View className="flex-row items-end justify-between">
                    <Text className="text-white text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</Text>
                    <Icon size={20} color={kpi.color} style={{ opacity: 0.6 }} />
                  </View>
                </GlassCard>
              );
            })}
          </ScrollView>
        </View>

        {/* Attendance Trend Chart */}
        <View className="px-5 mb-6">
          <GlassCard className="p-5 border border-white/10" intensity="low">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-white text-base font-bold">Attendance Trend</Text>
                <Text className="text-[#d1c5ac] text-xs">Last 30-day overview</Text>
              </View>
              <Text className="text-[#ffe5a0] text-xs font-bold">Avg: 87.4%</Text>
            </View>

            {/* Custom Neomorphic Area Chart using styled views */}
            <View className="h-44 flex-row items-end justify-between w-full pt-4">
              {attendanceTrendHeights.map((h, i) => (
                <View key={i} className="flex-1 items-center h-full justify-end px-0.5">
                  <View 
                    className="w-full rounded-t-full"
                    style={{ 
                      height: `${h}%`, 
                      backgroundColor: i === attendanceTrendHeights.length - 1 ? '#ffe5a0' : 'rgba(255, 229, 160, 0.25)',
                      borderTopWidth: i === attendanceTrendHeights.length - 1 ? 2 : 0,
                      borderColor: '#ffe5a0'
                    }} 
                  />
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

        {/* Fee Collection progress */}
        <View className="px-5 mb-6">
          <GlassCard className="p-5 border border-white/10" intensity="low">
            <Text className="text-white text-base font-bold mb-4">Fee Collection</Text>
            <View className="gap-4">
              {/* Term 1 */}
              <View>
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-[#d1c5ac] text-xs font-semibold">Term 1</Text>
                  <Text className="text-[#41eec2] text-xs font-bold">85%</Text>
                </View>
                <View className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <View className="h-full bg-[#41eec2]" style={{ width: '85%' }} />
                </View>
              </View>

              {/* Term 2 */}
              <View>
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-[#d1c5ac] text-xs font-semibold">Term 2</Text>
                  <Text className="text-[#ffe5a0] text-xs font-bold">62%</Text>
                </View>
                <View className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <View className="h-full bg-[#ffe5a0]" style={{ width: '62%' }} />
                </View>
              </View>

              {/* Term 3 */}
              <View>
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-[#d1c5ac] text-xs font-semibold">Term 3</Text>
                  <Text className="text-[#e0bdff] text-xs font-bold">40%</Text>
                </View>
                <View className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <View className="h-full bg-[#e0bdff]" style={{ width: '40%' }} />
                </View>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Heatmap Section */}
        <View className="px-5 mb-6">
          <GlassCard className="p-5 border border-white/10" intensity="low">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-base font-bold">Subject Performance</Text>
              <View className="flex-row gap-2">
                <View className="flex-row items-center gap-1">
                  <View className="w-1.5 h-1.5 rounded-sm bg-[#ffb4ab]" />
                  <Text className="text-[#d1c5ac] text-[9px] uppercase tracking-wider font-semibold">Low</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <View className="w-1.5 h-1.5 rounded-sm bg-[#ffe5a0]" />
                  <Text className="text-[#d1c5ac] text-[9px] uppercase tracking-wider font-semibold">Avg</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <View className="w-1.5 h-1.5 rounded-sm bg-[#41eec2]" />
                  <Text className="text-[#d1c5ac] text-[9px] uppercase tracking-wider font-semibold">High</Text>
                </View>
              </View>
            </View>

            <View className="flex-row justify-between">
              {subjects.map((sub, idx) => (
                <View key={idx} className="items-center flex-1 mx-0.5">
                  <Text className="text-[#d1c5ac] text-[9px] font-bold uppercase tracking-wider mb-2">{sub.name}</Text>
                  <View className={`w-full aspect-square rounded-xl items-center justify-center ${getHeatmapColor(sub.status)}`}>
                    <Text className="font-bold text-xs">{sub.score}</Text>
                  </View>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

        {/* Class performance Matrix Table */}
        <View className="px-5 mb-8">
          <GlassCard className="border border-white/10 overflow-hidden" intensity="low">
            <View className="p-4 border-b border-white/10 flex-row justify-between items-center">
              <Text className="text-white text-base font-bold">Class Performance Matrix</Text>
            </View>

            <View className="divide-y divide-white/5">
              {/* Header */}
              <View className="flex-row bg-white/5 p-4 justify-between">
                <Text className="text-[#d1c5ac] text-[9px] font-bold uppercase tracking-wider w-[35%]">Grade/Class</Text>
                <Text className="text-[#d1c5ac] text-[9px] font-bold uppercase tracking-wider w-[20%] text-center">Avg Score</Text>
                <Text className="text-[#d1c5ac] text-[9px] font-bold uppercase tracking-wider w-[25%] text-center">Attendance</Text>
                <Text className="text-[#d1c5ac] text-[9px] font-bold uppercase tracking-wider w-[20%] text-right">Status</Text>
              </View>

              {/* Rows */}
              {classData.map((cls) => (
                <View key={cls.id} className="flex-row p-4 items-center justify-between active:bg-white/5">
                  <Text className="text-white font-bold text-sm w-[35%]">{cls.name}</Text>
                  <Text className="text-[#41eec2] font-semibold text-sm w-[20%] text-center">{cls.avgScore}</Text>
                  <Text className="text-[#d1c5ac] text-sm w-[25%] text-center">{cls.attendance}</Text>
                  <View className="w-[20%] items-end">
                    <View 
                      className="px-2 py-0.5 rounded-full border" 
                      style={{ borderColor: cls.statusColor + '40', backgroundColor: cls.statusColor + '15' }}
                    >
                      <Text className="text-[9px] font-bold" style={{ color: cls.statusColor }}>{cls.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

      </ScrollView>
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
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
});

export default AnalyticsDashboardScreen;
