import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ChevronDown, AlertTriangle, Lightbulb, TrendingUp, Mail, ArrowLeft } from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';

export const StudentPerformanceScreen: React.FC<any> = ({ route, navigation }) => {
  const selectedStudent = route?.params?.student;
  const studentName = selectedStudent?.name || 'Julian Sterling';
  const className = selectedStudent?.className || 'Grade 9-A';
  const admissionNo = selectedStudent?.admissionNo || 'STDDe2026002';
  const canGoBack = navigation?.canGoBack && navigation.canGoBack();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header matching Admin Staff theme */}
      <AdminStaffHeader 
        title="Student Performance"
        subtitle="ACADEMIC PERFORMANCE TERMINAL"
        onBackPress={canGoBack ? () => navigation.goBack() : undefined}
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1] items-center justify-center shadow-[0_0_10px_rgba(0,241,161,0.5)]">
            <TrendingUp size={22} color="#101415" />
          </View>
        }
        rightAction={
          <Pressable className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center relative shadow-[0_0_10px_rgba(0,241,161,0.1)]">
            <Bell size={18} color="#00f1a1" />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Title */}
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-white text-[28px] font-extrabold tracking-tight mb-1">Student Performance</Text>
            <Text className="text-white/60 text-sm">Deep dive into academic metrics & trends</Text>
          </View>
          {canGoBack && (
            <Pressable 
              onPress={() => navigation.goBack()}
              className="bg-[#00f1a1]/15 border border-[#00f1a1]/30 px-3 py-1.5 rounded-xl flex-row items-center"
            >
              <ArrowLeft size={14} color="#00f1a1" className="mr-1" />
              <Text className="text-[#00f1a1] text-xs font-bold">Back to Directory</Text>
            </Pressable>
          )}
        </View>

        {/* Student Selector / Active Student Banner */}
        <View className="bg-[#101415]/80 border border-[#00f1a1]/30 rounded-2xl px-5 py-3.5 flex-row justify-between items-center mb-8 shadow-lg">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-[#00f1a1]/20 border border-[#00f1a1]/50 items-center justify-center mr-3">
              <Text className="text-[#00f1a1] font-bold text-base">
                {selectedStudent?.initials || studentName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text className="text-[#00f1a1] text-[10px] font-bold tracking-widest uppercase mb-0.5">
                SELECTED STUDENT • {className}
              </Text>
              <Text className="text-white font-bold text-base">{studentName}</Text>
              <Text className="text-white/40 text-[11px]">Adm No: {admissionNo}</Text>
            </View>
          </View>
          <ChevronDown size={20} color="#00f1a1" />
        </View>

        {/* Subject Mastery */}
        <View className="bg-[#101415]/80 border border-white/10 rounded-[32px] p-6 mb-8 shadow-lg">
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-white text-2xl font-bold mb-1">Subject Mastery</Text>
              <Text className="text-white/60 text-[10px] font-bold tracking-widest uppercase">CURRENT SEMESTER SCORE %</Text>
            </View>
            <View className="bg-[#00f1a1]/10 border border-[#00f1a1]/30 px-4 py-1.5 rounded-full flex-row items-center">
              <View className="w-1.5 h-1.5 rounded-full bg-[#00f1a1] mr-2 shadow-[0_0_8px_#00f1a1]" />
              <Text className="text-[#00f1a1] text-[10px] font-bold">Live Data</Text>
            </View>
          </View>

          <View className="flex-row justify-between items-end h-40 mt-4 px-2">
            {[
              { label: 'MATH', height: '90%' },
              { label: 'PHYS', height: '65%' },
              { label: 'BIOL', height: '80%' },
              { label: 'HIST', height: '45%' },
              { label: 'LIT', height: '85%' },
              { label: 'CHEM', height: '60%' },
            ].map((item, index) => (
              <View key={index} className="items-center w-[12%]">
                <View className="w-full bg-[#0d2a24]/60 rounded-t-xl overflow-hidden" style={{ height: 120, justifyContent: 'flex-end' }}>
                  <View style={{ width: '100%', height: item.height as any, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: '#00f1a1' }} />
                </View>
                <Text className="text-white/80 text-[10px] font-bold mt-4">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Rank Trend */}
        <View className="bg-[#101415]/80 border border-white/10 rounded-[32px] p-6 mb-8 shadow-lg overflow-hidden relative">
          <Text className="text-white text-2xl font-bold mb-1">Rank Trend</Text>
          <Text className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-8">GLOBAL CLASSROOM POSITION</Text>
          
          {/* Mock Chart Area */}
          <View className="h-28 mb-4 justify-center relative">
            <View className="absolute inset-x-0 top-1/2 h-[3px] bg-[#00f1a1] rounded-full shadow-[0_0_12px_#00f1a1]" style={{ elevation: 10, shadowColor: '#00f1a1', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8 }} />
            <View className="flex-row justify-between items-center h-full pt-4 relative">
              <View className="w-3 h-3 rounded-full bg-[#00f1a1] border-[3px] border-[#101415] z-10" style={{ transform: [{ translateY: 15 }] }} />
              <View className="w-3 h-3 rounded-full bg-[#00f1a1] border-[3px] border-[#101415] z-10" style={{ transform: [{ translateY: -5 }] }} />
              <View className="w-3 h-3 rounded-full bg-[#00f1a1] border-[3px] border-[#101415] z-10" style={{ transform: [{ translateY: 20 }] }} />
              <View className="w-3.5 h-3.5 rounded-full bg-white border-[3px] border-[#101415] shadow-[0_0_16px_#fff] z-10" style={{ transform: [{ translateY: -20 }] }} />
            </View>
          </View>

          <View className="flex-row justify-between mb-8 px-1">
            <Text className="text-white/60 text-xs font-bold">Ex. 01</Text>
            <Text className="text-white/60 text-xs font-bold">Ex. 02</Text>
            <Text className="text-white/60 text-xs font-bold">Ex. 03</Text>
            <Text className="text-white/60 text-xs font-bold">Latest</Text>
          </View>

          <View className="flex-row justify-between items-end border-t border-white/5 pt-5 mt-2">
            <View>
              <Text className="text-white/60 text-sm mb-1">Current Rank</Text>
              <Text className="text-[#00f1a1] text-3xl font-bold">#04</Text>
            </View>
            <View className="bg-[#00f1a1]/20 border border-[#00f1a1]/30 px-4 py-1.5 rounded-full flex-row items-center">
              <TrendingUp size={14} color="#00f1a1" className="mr-1" />
              <Text className="text-[#00f1a1] text-xs font-bold">+2</Text>
            </View>
          </View>
        </View>

        {/* Benchmarking */}
        <View className="flex-row justify-between items-center mb-6 mt-4">
          <Text className="text-white text-[28px] font-bold tracking-tight">Benchmarking</Text>
          <View className="flex-row">
            <View className="flex-row items-center mr-4">
              <View className="w-2 h-2 rounded-full bg-[#00f1a1] mr-1.5" />
              <Text className="text-white font-bold text-xs">Above</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-[#f87171] mr-1.5" />
              <Text className="text-white font-bold text-xs">Below</Text>
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-between mb-8">
          {[
            { subject: 'Mathematics', val: '+12%', type: 'Above Avg' },
            { subject: 'Physics', val: '+05%', type: 'Above Avg' },
            { subject: 'History', val: '-08%', type: 'Below Avg' },
            { subject: 'Biology', val: '+02%', type: 'Above Avg' },
            { subject: 'Literature', val: '+18%', type: 'Above Avg' },
            { subject: 'Chemistry', val: '-04%', type: 'Below Avg' },
          ].map((item, index) => {
            const isAbove = item.type === 'Above Avg';
            return (
              <View key={index} className="w-[48%] bg-[#101415]/80 border border-white/10 rounded-2xl p-5 mb-4 shadow-lg">
                <Text className="text-white/90 text-sm mb-4 font-medium">{item.subject}</Text>
                <View className="flex-row items-center">
                  <Text className="text-white text-xl font-bold mr-2">{item.val}</Text>
                  <View className={`px-2 py-1 rounded-md ${isAbove ? 'bg-[#00f1a1]/20' : 'bg-[#f87171]/20'}`}>
                    <Text className={`text-[10px] font-bold ${isAbove ? 'text-[#00f1a1]' : 'text-[#f87171]'}`}>{item.type}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Priority: History */}
        <View className="bg-[#101415]/80 border-2 border-[#f97316]/50 rounded-[32px] p-6 mb-6 relative overflow-hidden">
          {/* Faint alert icon in background */}
          <View className="absolute -right-4 -top-4 opacity-[0.03]">
            <AlertTriangle size={140} color="#f97316" />
          </View>
          
          <View className="flex-row items-center mb-5">
            <AlertTriangle size={24} color="#f97316" />
            <Text className="text-white text-lg font-bold ml-3">Priority: History</Text>
          </View>
          
          <Text className="text-white/60 text-[15px] leading-relaxed mb-6">
            Julian is struggling with chronological timelines and cause-effect analysis in 19th-century modules.
          </Text>

          <Text className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-3">SUGGESTED ACTION</Text>
          <View className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
            <Text className="text-white/70 text-sm italic leading-relaxed">
              "Schedule a 15-minute sync to review the Napoleonic Era mind-map. Assign visual timeline exercises for homework."
            </Text>
          </View>

          <Pressable className="bg-[#f97316]/10 border border-[#f97316]/30 flex-row items-center justify-center py-4 rounded-xl">
            <Mail size={18} color="#f97316" />
            <Text className="text-[#f97316] font-bold text-base ml-2">Nudge Guardian</Text>
          </Pressable>
        </View>

        {/* Progress Note: Chemistry */}
        <View className="bg-[#101415]/80 border-2 border-[#00f1a1]/30 rounded-[32px] p-6 mb-8 relative overflow-hidden">
          <View className="absolute -right-4 -bottom-4 opacity-[0.03]">
            <Lightbulb size={140} color="#00f1a1" />
          </View>
          
          <View className="flex-row items-center mb-5">
            <Lightbulb size={24} color="#00f1a1" />
            <Text className="text-white text-lg font-bold ml-3">Progress Note: Chemistry</Text>
          </View>
          
          <Text className="text-white/60 text-[15px] leading-relaxed mb-6">
            Steady improvement in stoichiometric calculations, but conceptual gaps remain in organic bonding.
          </Text>

          <View className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-5 flex-row justify-between items-center">
            <Text className="text-white/70 text-sm font-medium">Interactive Quiz Score</Text>
            <Text className="text-[#00f1a1] text-lg font-bold">74%</Text>
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
});

export default StudentPerformanceScreen;
