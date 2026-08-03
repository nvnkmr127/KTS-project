import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../../components/GlassCard';
import { Search, ChevronDown, Plus, Upload } from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';

const SUBJECT_COLORS = {
  Physics: { bg: 'bg-indigo-950/60', border: 'border-indigo-500/30', text: 'text-indigo-200' },
  Math: { bg: 'bg-teal-950/60', border: 'border-teal-500/30', text: 'text-teal-200' },
  Biology: { bg: 'bg-emerald-950/60', border: 'border-emerald-500/30', text: 'text-emerald-200' },
  Chemistry: { bg: 'bg-rose-950/60', border: 'border-rose-500/30', text: 'text-rose-200' },
  History: { bg: 'bg-amber-950/60', border: 'border-amber-500/30', text: 'text-amber-200' },
};

const PeriodCell = ({ subject, room }: { subject?: keyof typeof SUBJECT_COLORS, room?: string }) => {
  if (!subject) {
    return (
      <View className="flex-1 min-w-[70px] h-[80px] bg-white/5 border border-white/10 rounded-xl items-center justify-center mr-2 mb-2">
        <Plus size={20} color="#ffffff" opacity={0.3} />
        <Text className="text-white/30 text-[10px] font-bold mt-1">ASSIGN</Text>
      </View>
    );
  }

  const colors = SUBJECT_COLORS[subject];
  return (
    <View className={`flex-1 min-w-[70px] h-[80px] ${colors.bg} border ${colors.border} rounded-xl items-center justify-center mr-2 mb-2`}>
      <Text className={`${colors.text} font-bold mb-1 text-sm`}>{subject === 'Physics' ? 'PHYS' : subject === 'Biology' ? 'BIO' : subject === 'Chemistry' ? 'CHEM' : subject.toUpperCase()}</Text>
      <Text className={`${colors.text} opacity-70 text-[10px]`}>{room}</Text>
    </View>
  );
};

export const TimetableBuilderScreen: React.FC<any> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Classes');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <AdminStaffHeader
        title="Admin Panel"
        icon={
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150' }}
            className="w-8 h-8 rounded-full border border-emerald-500/30"
          />
        }
        rightAction={
          <Pressable>
            <Search size={24} color="#34D399" />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text className="text-[#00f1a1] font-bold text-lg mb-4">Timetable Builder</Text>

        {/* Dropdown */}
        <View className="bg-[#101415] border border-[#00f1a1]/30 rounded-xl px-4 py-4 flex-row justify-between items-center mb-6">
          <Text className="text-white text-base font-semibold">Grade 10 - Section A</Text>
          <ChevronDown size={20} color="#00f1a1" opacity={0.7} />
        </View>

        {/* Timetable Grid Container */}
        <GlassCard intensity="low" className="p-4 mb-6 border-[#00f1a1]/20 bg-[#101415]/60">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Days Header */}
              <View className="flex-row pl-14 mb-4">
                {['MON', 'TUE', 'WED', 'THU', 'FRI'].map(day => (
                  <View key={day} className="w-[70px] items-center mr-2">
                    <Text className="text-[#00f1a1] text-[10px] font-bold tracking-[0.2em]">{day}</Text>
                  </View>
                ))}
              </View>

              {/* P1 */}
              <View className="flex-row items-center mb-2">
                <View className="w-14 items-center pr-2">
                  <Text className="text-[#00f1a1] font-bold text-sm">P1</Text>
                  <Text className="text-white/50 text-[10px]">08:00</Text>
                </View>
                <PeriodCell subject="Physics" room="R-204" />
                <PeriodCell subject="Math" room="R-102" />
                <PeriodCell />
                <PeriodCell subject="Biology" room="LAB-1" />
                <PeriodCell subject="Math" room="R-102" />
              </View>

              {/* P2 */}
              <View className="flex-row items-center mb-2">
                <View className="w-14 items-center pr-2">
                  <Text className="text-[#00f1a1] font-bold text-sm">P2</Text>
                  <Text className="text-white/50 text-[10px]">09:00</Text>
                </View>
                <PeriodCell subject="Math" room="R-102" />
                <PeriodCell />
                <PeriodCell subject="Physics" room="R-204" />
                <PeriodCell />
                <PeriodCell subject="Chemistry" room="LAB-2" />
              </View>

              {/* P3 */}
              <View className="flex-row items-center mb-2">
                <View className="w-14 items-center pr-2">
                  <Text className="text-[#00f1a1] font-bold text-sm">P3</Text>
                  <Text className="text-white/50 text-[10px]">10:00</Text>
                </View>
                <PeriodCell />
                <PeriodCell subject="Biology" room="LAB-1" />
                <PeriodCell subject="Chemistry" room="LAB-2" />
                <PeriodCell />
                <PeriodCell subject="Physics" room="R-204" />
              </View>

              {/* Recess */}
              <View className="bg-[#1c2222] border border-[#00f1a1]/20 rounded-lg py-2 items-center mb-4 ml-14 mr-2">
                <Text className="text-[#00f1a1] tracking-[0.2em] text-[10px] font-bold">RECESS INTERVAL</Text>
              </View>

              {/* P4 */}
              <View className="flex-row items-center mb-2">
                <View className="w-14 items-center pr-2">
                  <Text className="text-[#00f1a1] font-bold text-sm">P4</Text>
                  <Text className="text-white/50 text-[10px]">11:30</Text>
                </View>
                <View className="flex-1 bg-[#101415] rounded-xl p-4 mr-2 border border-white/5">
                  <Text className="text-white/40 italic text-xs">Remaining periods collapsed for preview...</Text>
                </View>
              </View>

            </View>
          </ScrollView>
        </GlassCard>

        {/* Subject Keys */}
        <GlassCard intensity="low" className="p-5 mb-6 border-[#00f1a1]/10 bg-[#101415]/60">
          <Text className="text-[#00f1a1] tracking-[0.2em] text-[10px] font-bold mb-4">SUBJECT KEYS</Text>
          <View className="flex-row flex-wrap">
            {Object.entries(SUBJECT_COLORS).map(([subject, colors]) => (
              <View key={subject} className="flex-row items-center mr-4 mb-3 w-[40%]">
                <View className={`w-3 h-3 rounded-full mr-2 ${colors.bg.replace('/60', '')} border ${colors.border}`} />
                <Text className="text-white text-sm font-medium">{subject}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Publish Button */}
        <Pressable className="bg-[#00f1a1] rounded-xl py-4 flex-row items-center justify-center shadow-[0_0_15px_rgba(0,241,161,0.4)]">
          <Upload size={20} color="#101415" className="mr-2" />
          <Text className="text-[#101415] font-bold text-base tracking-wide">Publish Timetable</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
});

export default TimetableBuilderScreen;
