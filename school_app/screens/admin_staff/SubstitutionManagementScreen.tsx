import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { Search, ChevronDown, Clock, MapPin, Calendar, Check, X, AlertCircle, CheckCircle2 } from 'lucide-react-native';

export const SubstitutionManagementScreen: React.FC<any> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Pending');

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
            className="w-8 h-8 rounded-full border border-[#00f1a1]/30"
          />
        }
        rightAction={
          <Pressable>
            <Search size={24} color="#00f1a1" />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Teacher Profile Card */}
        <GlassCard intensity="low" className="p-5 items-center mb-8 border border-[#00f1a1]/30 w-2/3 self-center shadow-[0_10px_25px_rgba(0,241,161,0.15)] bg-[#101415]/80" glowColor="rgba(0, 241, 161, 0.1)">
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150' }} 
            className="w-16 h-16 rounded-full mb-3 border border-[#00f1a1]/50"
          />
          <Text className="text-white text-lg font-bold mb-1">Marcus Thorne</Text>
          <Text className="text-white/60 text-xs mb-3">Mathematics Dept.</Text>
          <View className="bg-[#101415] px-3 py-1 rounded-sm border border-[#00f1a1]/40">
            <Text className="text-[#00f1a1] text-[10px] font-bold tracking-[0.2em] text-center">SICK{"\n"}LEAVE</Text>
          </View>
        </GlassCard>

        {/* Timeline Header */}
        <View className="mb-6">
          <Text className="text-white text-xl font-bold tracking-tight mb-1">Timeline: Marcus Thorne</Text>
          <Text className="text-white/60 text-sm">Select unassigned periods to bridge the gap.</Text>
        </View>

        {/* Timeline Items */}
        <View className="ml-2 mb-8 border-l border-white/10 pl-6 pb-2">
          
          {/* Item 1 - Assigned */}
          <View className="relative mb-6">
            <View className="absolute -left-[35px] bg-[#101415] w-6 h-6 items-center justify-center">
              <View className="w-2 h-2 rounded-full bg-[#00f1a1]" />
            </View>
            <Text className="text-white/50 text-xs font-semibold absolute -left-16 top-1">08:00</Text>
            
            <GlassCard intensity="low" className="p-4 bg-[#101415]/60 border border-[#00f1a1]/30 flex-row justify-between items-center shadow-[0_4px_15px_rgba(0,241,161,0.1)]" glowColor="rgba(0, 241, 161, 0.1)">
              <View>
                <Text className="text-[#00f1a1] font-bold mb-1 tracking-wider text-sm">PERIOD 1: ALGEBRA II</Text>
                <Text className="text-white text-xs">Room 402 • <Text className="text-[#00f1a1]">Sub: Sarah Jenks</Text></Text>
              </View>
              <CheckCircle2 size={24} color="#00f1a1" />
            </GlassCard>
          </View>

          {/* Item 2 - Unassigned */}
          <View className="relative mb-6">
            <View className="absolute -left-[35px] bg-[#101415] w-6 h-6 items-center justify-center">
              <View className="w-2 h-2 rounded-full bg-[#ff516a] shadow-[0_0_8px_#ff516a]" />
            </View>
            <Text className="text-white/50 text-xs font-semibold absolute -left-16 top-1">09:15</Text>
            
            <GlassCard intensity="low" className="p-4 bg-[#101415]/60 border border-[#ff516a]/40 flex-row justify-between items-center shadow-[0_4px_15px_rgba(255,81,106,0.15)]" glowColor="rgba(255, 81, 106, 0.1)">
              <View className="flex-1">
                <Text className="text-[#ff516a] font-bold mb-2 tracking-wider text-sm">PERIOD 2:{"\n"}CALCULUS BC</Text>
                <Text className="text-white text-xs leading-5">Room 402 •{"\n"}<Text className="text-white font-bold">UNASSIGNED</Text></Text>
              </View>
              <Pressable className="bg-[#ff516a] px-4 py-2 rounded-full flex-row items-center shadow-[0_0_10px_rgba(255,81,106,0.4)]">
                <Clock size={14} color="#101415" className="mr-1.5" />
                <Text className="text-[#101415] font-bold text-xs tracking-wider">ASSIGN</Text>
              </Pressable>
            </GlassCard>
          </View>

          {/* Item 3 - Unassigned */}
          <View className="relative mb-6">
            <View className="absolute -left-[35px] bg-[#101415] w-6 h-6 items-center justify-center">
              <View className="w-2 h-2 rounded-full bg-[#ff516a] shadow-[0_0_8px_#ff516a]" />
            </View>
            <Text className="text-white/50 text-xs font-semibold absolute -left-16 top-1">10:30</Text>
            
            <GlassCard intensity="low" className="p-4 bg-[#101415]/60 border border-[#ff516a]/40 flex-row justify-between items-center shadow-[0_4px_15px_rgba(255,81,106,0.15)]" glowColor="rgba(255, 81, 106, 0.1)">
              <View className="flex-1">
                <Text className="text-[#ff516a] font-bold mb-2 tracking-wider text-sm">PERIOD 3:{"\n"}TRIG PREP</Text>
                <Text className="text-white text-xs leading-5">Room 402 •{"\n"}<Text className="text-white font-bold">UNASSIGNED</Text></Text>
              </View>
              <Pressable className="bg-[#ff516a] px-4 py-2 rounded-full flex-row items-center shadow-[0_0_10px_rgba(255,81,106,0.4)]">
                <Clock size={14} color="#101415" className="mr-1.5" />
                <Text className="text-[#101415] font-bold text-xs tracking-wider">ASSIGN</Text>
              </Pressable>
            </GlassCard>
          </View>

          {/* Item 4 - Assigned */}
          <View className="relative">
            <View className="absolute -left-[35px] bg-[#101415] w-6 h-6 items-center justify-center">
              <View className="w-2 h-2 rounded-full bg-[#00f1a1]" />
            </View>
            <Text className="text-white/50 text-xs font-semibold absolute -left-16 top-1">12:00</Text>
            
            <GlassCard intensity="low" className="p-4 bg-[#101415]/60 border border-[#00f1a1]/30 flex-row justify-between items-center shadow-[0_4px_15px_rgba(0,241,161,0.1)]" glowColor="rgba(0, 241, 161, 0.1)">
              <View>
                <Text className="text-[#00f1a1] font-bold mb-1 tracking-wider text-sm">LUNCH DUTY</Text>
                <Text className="text-white text-xs">Cafeteria • <Text className="text-[#00f1a1]">Sub: Leo G.</Text></Text>
              </View>
              <CheckCircle2 size={24} color="#00f1a1" />
            </GlassCard>
          </View>

        </View>

        {/* Efficiency Rating */}
        <GlassCard intensity="low" className="p-5 border-[#00f1a1]/10 bg-[#101415]/60">
          <Text className="text-[#00f1a1] tracking-[0.2em] text-[10px] font-bold mb-3">EFFICIENCY RATING</Text>
          <View className="flex-row items-end mb-4">
            <Text className="text-[#00f1a1] text-4xl font-bold tracking-tighter mr-3">82%</Text>
            <Text className="text-white/80 text-sm mb-1.5">Substitutions Filled Today</Text>
          </View>
          <View className="h-2 bg-white/10 rounded-full w-full overflow-hidden">
            <View className="h-full bg-[#00f1a1] rounded-full w-[82%] shadow-[0_0_8px_#00f1a1]" />
          </View>
        </GlassCard>

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

export default SubstitutionManagementScreen;
