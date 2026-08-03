import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../../components/GlassCard';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { Search, Filter, BookOpen, Bus, Globe, ChevronDown, Calendar, Printer, UserCircle } from 'lucide-react-native';
import { useFeeStore } from '../../store/useFeeStore';

export const FeeCollectionScreen: React.FC<any> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { categories, feeData } = useFeeStore();
  
  // Map student (Aman Gupta, Class 10) to store data
  const classFeeInfo = feeData.find(f => f.grade === 'Class 10') || feeData[9];
  const totalClassFeeAnnual = Object.values(classFeeInfo.fees).reduce((sum, val) => sum + val, 0);
  const totalRupees = Math.round(totalClassFeeAnnual * 2.2);
  const outstandingRupees = Math.round(totalRupees * 0.69); // ~69% is outstanding
  
  const getIconForCategory = (key: string) => {
    if (key === 'tuition') return <BookOpen size={20} color="#34D399" className="mr-3" />;
    if (key === 'transport') return <Bus size={20} color="#34D399" className="mr-3" />;
    return <Globe size={20} color="#34D399" className="mr-3" />;
  };

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
        {/* Search Bar */}
        <View className="flex-row items-center mb-6">
          <View className="flex-row items-center flex-1 bg-emerald-950/20 border border-emerald-500/30 rounded-xl px-4 py-3 mr-3">
            <UserCircle size={20} color="#34D399" />
            <TextInput
              placeholder="Search student by name or..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white ml-2 text-sm"
            />
          </View>
          <Pressable className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-xl">
            <Filter size={20} color="#34D399" />
          </Pressable>
        </View>

        {/* Student Info Card */}
        <GlassCard intensity="low" className="p-5 mb-6 border border-emerald-500/20" glowColor="rgba(16, 185, 129, 0.2)">
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-white text-lg font-semibold">Aman Gupta</Text>
              <Text className="text-white/60 text-xs font-semibold tracking-wider mt-1">CLASS 10-A • ROLL #24</Text>
            </View>
            <View className="bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-full">
              <Text className="text-emerald-400 text-[10px] font-bold">ACADEMIC YEAR 24-25</Text>
            </View>
          </View>
          
          <Text className="text-white/60 text-[10px] font-bold tracking-wider mb-1">TOTAL OUTSTANDING BALANCE</Text>
          <View className="flex-row items-end">
            <Text className="text-[#ffcc00] text-4xl font-bold tracking-tighter">₹{outstandingRupees.toLocaleString('en-IN')}</Text>
            <Text className="text-white/40 text-sm line-through ml-2 mb-1.5 font-semibold">₹{totalRupees.toLocaleString('en-IN')}</Text>
          </View>
        </GlassCard>

        {/* Fee Breakdown */}
        <View className="mb-6">
          {categories.map(cat => {
            const catAmountAnnual = classFeeInfo.fees[cat.key] || 0;
            const catAmountRupees = Math.round(catAmountAnnual * 2.2);
            return (
              <GlassCard key={cat.key} intensity="low" className="flex-row items-center justify-between p-4 mb-2">
                <View className="flex-row items-center">
                  {getIconForCategory(cat.key)}
                  <Text className="text-white text-base">{cat.label}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-white text-xl font-bold mr-3">₹{catAmountRupees.toLocaleString('en-IN')}</Text>
                  <ChevronDown size={20} color="#ffffff" opacity={0.5} />
                </View>
              </GlassCard>
            );
          })}
        </View>

        {/* Record Cash Payment Form */}
        <GlassCard intensity="low" className="p-5 mb-6">
          <View className="flex-row items-center mb-6">
            <View className="bg-emerald-400 p-1.5 rounded-md mr-3">
              <Text className="text-slate-900 font-bold text-xs">₹</Text>
            </View>
            <Text className="text-white text-lg font-bold">Record Cash Payment</Text>
          </View>

          <View className="mb-4">
            <Text className="text-white/60 text-[10px] font-bold tracking-wider mb-2">AMOUNT TO PAY</Text>
            <View className="flex-row items-center bg-[#1E293B] border border-white/10 rounded-lg px-4 py-3">
              <Text className="text-emerald-400 font-bold mr-2">₹</Text>
              <TextInput
                value="12450"
                className="flex-1 text-white text-sm"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-white/60 text-[10px] font-bold tracking-wider mb-2">RECEIPT NUMBER</Text>
            <TextInput
              value="RCPT-99231"
              className="bg-[#1E293B] border border-white/10 rounded-lg px-4 py-3 text-white text-sm"
            />
          </View>

          <View className="mb-6">
            <Text className="text-white/60 text-[10px] font-bold tracking-wider mb-2">TRANSACTION DATE</Text>
            <View className="flex-row items-center bg-[#1E293B] border border-white/10 rounded-lg px-4 py-3 justify-between">
              <Text className="text-white text-sm">27-10-2023</Text>
              <View className="flex-row space-x-3">
                <Calendar size={18} color="#ffffff" opacity={0.5} />
                <Calendar size={18} color="#ffffff" opacity={0.5} />
              </View>
            </View>
          </View>

          <Pressable className="bg-emerald-400 rounded-xl py-3.5 flex-row items-center justify-center">
            <Printer size={18} color="#0F172A" className="mr-2" />
            <Text className="text-slate-900 font-bold text-sm">Save & Print Receipt</Text>
          </Pressable>
        </GlassCard>

        {/* Bottom Stats */}
        <GlassCard intensity="low" className="flex-row p-5 mb-6">
          <View className="flex-1 border-r border-white/10 pr-4">
            <Text className="text-white/60 text-[10px] font-bold tracking-wider mb-1">TODAY</Text>
            <Text className="text-emerald-400 text-2xl font-bold tracking-tight">₹48,500</Text>
          </View>
          <View className="flex-1 pl-4 items-end">
            <Text className="text-white/60 text-[10px] font-bold tracking-wider mb-1">THIS MONTH</Text>
            <Text className="text-white text-2xl font-bold tracking-tight">₹3.2L</Text>
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

export default FeeCollectionScreen;
