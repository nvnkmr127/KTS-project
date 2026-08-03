import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Dimensions, Platform } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { mockExams } from '../../services/mockData';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Bell,
  Download,
  TrendingUp,
  TrendingDown,
  Calculator,
  Beaker,
  Languages
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const ReportCardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, activeChildId } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'ut1' | 'mid' | 'final'>('ut1');

  if (!user) return null;

  const subjectExams = mockExams[activeChildId || 'stud_001'] || [];

  const getTrendingIcon = (subject: string) => {
    if (subject.toLowerCase().includes('math') || subject.toLowerCase().includes('english')) {
      return <TrendingUp size={16} color="#4ade80" />;
    }
    return <TrendingDown size={16} color="#f87171" />;
  };

  const getSubjectIcon = (subject: string) => {
    if (subject.toLowerCase().includes('math')) {
      return <Calculator size={20} color="#818CF8" />;
    }
    if (subject.toLowerCase().includes('science') || subject.toLowerCase().includes('physics')) {
      return <Beaker size={20} color="#818CF8" />;
    }
    return <Languages size={20} color="#818CF8" />;
  };

  const getGradeStyle = (grade: string) => {
    if (grade.startsWith('A')) {
      return {
        bg: 'rgba(16, 185, 129, 0.15)',
        text: '#34D399',
        border: 'rgba(16, 185, 129, 0.25)'
      };
    }
    return {
      bg: 'rgba(94, 92, 230, 0.15)',
      text: '#818CF8',
      border: 'rgba(94, 92, 230, 0.25)'
    };
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0E0F26', '#121330']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Header */}
      <View style={styles.header}>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => navigation?.goBack()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-95">
            <ChevronLeft size={20} color="#818CF8" />
          </Pressable>
          <View>
            <Text className="text-white text-lg font-bold font-headline-md">Academic Results</Text>
          </View>
        </View>
        <Pressable className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-95">
          <Bell size={20} color="#5E5CE6" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Exam Selector Pill Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 pl-5" contentContainerStyle={{ paddingRight: 30 }}>
          <Pressable 
            onPress={() => setActiveTab('ut1')}
            className={`px-6 py-2.5 rounded-full mr-2 border ${
              activeTab === 'ut1' 
                ? 'bg-[#10B981]/15 border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                : 'bg-white/5 border-white/10'
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === 'ut1' ? 'text-white' : 'text-white/60'}`}>
              Unit Test 1
            </Text>
          </Pressable>

          <Pressable 
            onPress={() => setActiveTab('mid')}
            className={`px-6 py-2.5 rounded-full mr-2 border ${
              activeTab === 'mid' 
                ? 'bg-[#10B981]/15 border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                : 'bg-white/5 border-white/10'
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === 'mid' ? 'text-white' : 'text-white/60'}`}>
              Mid Term
            </Text>
          </Pressable>

          <Pressable 
            onPress={() => setActiveTab('final')}
            className={`px-6 py-2.5 rounded-full mr-2 border ${
              activeTab === 'final' 
                ? 'bg-[#10B981]/15 border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                : 'bg-white/5 border-white/10'
            }`}
          >
            <Text className={`text-xs font-bold ${activeTab === 'final' ? 'text-white' : 'text-white/60'}`}>
              Final
            </Text>
          </Pressable>
        </ScrollView>

        {/* Overall Scorecard */}
        <View className="px-5 mb-6">
          <View style={[styles.glassCard, styles.scoreCard]} className="p-6 rounded-3xl relative overflow-hidden">
            <View className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Overall Score</Text>
                <View className="flex-row items-baseline gap-2 mt-1">
                  <Text className="text-4xl font-extrabold text-[#10B981] leading-none">76.4%</Text>
                  <Text className="text-lg font-semibold text-[#34D399]">B+</Text>
                </View>
              </View>
              <View className="bg-[#10B981]/20 border border-[#10B981]/30 px-3.5 py-1 rounded-full">
                <Text className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">Pass</Text>
              </View>
            </View>

            <View className="mt-6 flex-row justify-between border-t border-white/10 pt-4">
              <View>
                <Text className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Rank</Text>
                <Text className="text-lg font-bold text-white mt-0.5">12/42</Text>
              </View>
              <View className="items-end">
                <Text className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Percentile</Text>
                <Text className="text-lg font-bold text-white mt-0.5">88th</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Subject-wise List */}
        <View className="px-5 mb-6">
          <Text className="text-white text-base font-bold font-headline-md mb-3 px-1">Subject Performance</Text>
          <View className="gap-3">
            {subjectExams.map((exam) => {
              const gradeStyle = getGradeStyle(exam.grade);
              return (
                <View 
                  key={exam.id} 
                  style={styles.glassCard}
                  className="p-4 rounded-2xl flex-row justify-between items-center border border-white/10"
                >
                  <View className="flex-row items-center gap-4 flex-1 mr-2">
                    <View className="w-12 h-12 rounded-xl bg-[#818CF8]/10 flex items-center justify-center">
                      {getSubjectIcon(exam.subject)}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-sm leading-tight" numberOfLines={1}>
                        {exam.subject}
                      </Text>
                      <Text className="text-white/50 text-xs mt-1 font-semibold">
                        {exam.marksObtained} / {exam.maxMarks}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View 
                      style={{ backgroundColor: gradeStyle.bg, borderColor: gradeStyle.border, borderWidth: 1 }}
                      className="px-3 py-1 rounded-full"
                    >
                      <Text style={{ color: gradeStyle.text }} className="text-[10px] font-bold uppercase">
                        {exam.grade}
                      </Text>
                    </View>
                    {getTrendingIcon(exam.subject)}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Custom Rendered Performance Charts */}
        <View className="px-5 mb-6 gap-6">
          {/* Bar Chart Card */}
          <View style={styles.glassCard} className="p-5 rounded-3xl border border-white/10">
            <Text className="text-white text-base font-bold font-headline-md mb-4">Subject Comparison</Text>
            
            {/* Custom Bar Layout */}
            <View className="h-48 flex-row justify-between items-end pb-2.5">
              {[
                { label: 'Math', score: 82, avg: 72 },
                { label: 'Sci', score: 74, avg: 70 },
                { label: 'Eng', score: 88, avg: 75 },
                { label: 'Hist', score: 65, avg: 68 },
                { label: 'Comp', score: 92, avg: 80 }
              ].map((item, idx) => (
                <View key={idx} className="items-center flex-1">
                  <View className="h-full w-10 flex-row gap-1 items-end justify-center mb-1">
                    {/* Score Bar */}
                    <View 
                      style={{ height: `${item.score}%` }} 
                      className="w-3 bg-[#10B981] rounded-t-sm"
                    />
                    {/* Average Bar */}
                    <View 
                      style={{ height: `${item.avg}%` }} 
                      className="w-3 bg-white/10 rounded-t-sm border border-white/20"
                    />
                  </View>
                  <Text className="text-white/50 text-[10px] font-bold uppercase">{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Custom Chart Legend */}
            <View className="flex-row justify-center gap-6 mt-4 pt-3 border-t border-white/5">
              <View className="flex-row items-center gap-1.5">
                <View className="w-2.5 h-2.5 bg-[#10B981] rounded-sm" />
                <Text className="text-white/60 text-[10px] font-bold">Score</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="w-2.5 h-2.5 bg-white/10 border border-white/20 rounded-sm" />
                <Text className="text-white/60 text-[10px] font-bold">Class Avg</Text>
              </View>
            </View>
          </View>

          {/* Trend Chart Card */}
          <View style={styles.glassCard} className="p-5 rounded-3xl border border-white/10">
            <Text className="text-white text-base font-bold font-headline-md mb-4">Rank Trend</Text>
            
            {/* Custom Trend Stepper */}
            <View className="h-44 flex-row relative pb-2 px-3">
              {/* Left Y-Axis Markings */}
              <View className="w-6 h-32 justify-between items-end pr-2.5 border-r border-white/10">
                {[12, 13, 14, 15, 16, 17, 18].map((val) => (
                  <Text key={val} className="text-white/40 text-[9px] font-bold leading-none">{val}</Text>
                ))}
              </View>
              
              {/* Plotting Area */}
              <View className="flex-1 h-32 relative">
                {/* Horizontal Grid Lines */}
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <View 
                    key={i} 
                    className="absolute left-0 right-0 h-[1px] bg-white/5" 
                    style={{ top: `${(i / 6) * 100}%` }}
                  />
                ))}

                {/* Draw connecting lines */}
                {(() => {
                  const plotWidth = width - 130;
                  const minVal = 12;
                  const maxVal = 18;
                  const getY = (val: number) => ((val - minVal) / (maxVal - minVal)) * 120;
                  const getX = (idx: number) => (idx / 4) * plotWidth;

                  const data = [18, 15, 14, 13, 12];
                  const segs = [];
                  for (let i = 0; i < data.length - 1; i++) {
                    const x1 = getX(i);
                    const y1 = getY(data[i]);
                    const x2 = getX(i + 1);
                    const y2 = getY(data[i + 1]);
                    
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    
                    segs.push({
                      left: (x1 + x2) / 2 - len / 2,
                      top: (y1 + y2) / 2,
                      len,
                      angle,
                      key: i
                    });
                  }

                  return segs.map((seg) => (
                    <View 
                      key={seg.key}
                      style={{
                        position: 'absolute',
                        left: seg.left,
                        top: seg.top,
                        width: seg.len,
                        height: 2,
                        backgroundColor: '#818CF8',
                        opacity: 0.6,
                        transform: [{ rotate: `${seg.angle}deg` }]
                      }}
                    />
                  ));
                })()}

                {/* Plot Dots and Labels */}
                {[
                  { label: 'Test 1', val: 18 },
                  { label: 'Test 2', val: 15 },
                  { label: 'Mid Term', val: 14 },
                  { label: 'Test 3', val: 13 },
                  { label: 'Current', val: 12 }
                ].map((item, idx) => {
                  const plotWidth = width - 130;
                  const x = (idx / 4) * plotWidth;
                  const minVal = 12;
                  const maxVal = 18;
                  const y = ((item.val - minVal) / (maxVal - minVal)) * 120;

                  return (
                    <View key={idx} style={{ position: 'absolute', left: x - 14, top: y - 14 }} className="items-center">
                      <View className="bg-[#10B981] w-7 h-7 rounded-full items-center justify-center border-2 border-[#121330] shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                        <Text className="text-white text-[9px] font-black">{item.val}</Text>
                      </View>
                      <Text className="text-white/50 text-[8px] font-bold uppercase mt-1.5 absolute top-7 w-16 text-center">{item.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Download PDF Button */}
        <View className="px-5 mb-8">
          <Pressable 
            style={[styles.glassCard, styles.downloadButton]}
            className="w-full py-4 rounded-2xl flex-row items-center justify-center gap-3 border border-[#10B981]/40 active:scale-95"
          >
            <Download size={18} color="#10B981" />
            <Text className="text-[#10B981] text-sm font-bold uppercase tracking-wider">
              Download Report Card PDF
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F26',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 65 : 52,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 50,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  scoreCard: {
    borderRadius: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: Platform.OS === 'ios' ? 6 : 0,
  },
  downloadButton: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: Platform.OS === 'ios' ? 4 : 0,
  },
});

export default ReportCardScreen;
