import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Dimensions, Platform } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { mockFees, mockHomework, mockExams } from '../../services/mockData';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Bell,
  ChevronDown,
  CheckCircle,
  Calendar,
  FileText,
  Award,
  CreditCard,
  Bus,
  Clock,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  FlaskConical,
  MessageCircle
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const ParentDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, activeChildId, switchChild } = useAuthStore();
  const [showChildPicker, setShowChildPicker] = useState(false);

  if (!user || !user.children) return null;

  const currentChild = user.children.find(c => c.id === activeChildId) || user.children[0];
  const inactiveChild = user.children.find(c => c.id !== activeChildId) || user.children[1];

  // Calculate dynamic stats for current active child
  const fees = mockFees[currentChild.id] || [];
  const homework = mockHomework[currentChild.id] || [];
  const exams = mockExams[currentChild.id] || [];

  const pendingFeesCount = fees.filter(f => f.status !== 'paid').length;
  const pendingHwCount = homework.filter(h => h.status === 'pending').length;

  const handleSwitchChild = (childId: string) => {
    switchChild(childId);
    setShowChildPicker(false);
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0E0F26', '#121330']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top App Bar */}
      <View style={styles.header}>
        <View className="flex-row items-center gap-3">
          <Pressable 
            onPress={() => navigation.navigate('StudentProfileDetails')}
            className="w-10 h-10 rounded-full overflow-hidden border border-white/20"
          >
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMrIIqhz709VeW2BpRqLVg1j7U7Pl9daXfwRKA-2HDDgcA9W7mXSd5OKr4pnpdIm8PH7zmg2kpcIfjndCo00bTp-Axh-ozzk6NmCmBUgatneU-MIJXsqAP3jNupEJEVMnZddUdmfbtXx9Pf104uwZfzaiIwRgyJZ8fQhJHzGToBXPUzvkGYakj-ALyh-X-w-OuUIWQTLleEFRHfU4lEubjrHCKU1coc5G8ockGv2_JF5fyZw89gZymwweZDxq0LKQFld8hZ2gu1G6t' }}
              className="w-full h-full object-cover"
            />
          </Pressable>
          <View>
            <Text className="text-white/70 text-xs font-semibold">Good Morning,</Text>
            <Text className="text-white text-lg font-bold font-headline-md">{user.name} 👋</Text>
          </View>
        </View>
        <Pressable className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-95">
          <Bell size={20} color="#5E5CE6" />
        </Pressable>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Child Switcher */}
        <View className="items-center mb-6">
          <Pressable 
            onPress={() => setShowChildPicker(!showChildPicker)}
            className="bg-white/10 border border-white/15 px-4 py-2 rounded-full flex-row items-center gap-2 active:scale-95"
            style={styles.glassCard}
          >
            <Text className="text-[#818CF8] font-bold text-xs font-label-md">
              {currentChild.name} ({currentChild.class.replace('Grade ', '')})
            </Text>
            <ChevronDown size={14} color="#818CF8" />
          </Pressable>
 
          {showChildPicker && inactiveChild && (
            <Pressable 
              onPress={() => handleSwitchChild(inactiveChild.id)}
              className="absolute top-10 bg-[#16162D] border border-white/10 px-4 py-2 rounded-full z-50 active:scale-95 shadow-lg"
            >
              <Text className="text-white/70 text-xs font-label-md">
                Switch to {inactiveChild.name} ({inactiveChild.class.replace('Grade ', '')})
              </Text>
            </Pressable>
          )}
        </View>

        {/* Attendance Status Row */}
        <View className="px-5 mb-5">
          <View 
            style={[styles.glassCard, styles.attendanceCard]}
            className="p-4 flex-row items-center gap-4 border-l-4 border-l-green-500"
          >
            <View className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={20} color="#22c55e" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium text-sm leading-tight">
                {currentChild.name} entered school at {currentChild.id === 'stud_001' ? '8:42 AM' : '8:45 AM'} today
              </Text>
              <Text className="text-white/50 text-[10px] mt-0.5 uppercase tracking-wider font-semibold">
                {currentChild.id === 'stud_001' ? 'Gate 2 • Main Building' : 'Gate 1 • Junior Building'}
              </Text>
            </View>
          </View>
        </View>

        {/* Feature Chips Row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-6 pl-5"
          contentContainerStyle={{ paddingRight: 30 }}
        >
          <Pressable 
            onPress={() => navigation.navigate('Attendance')}
            className="flex-row items-center gap-1.5 px-5 py-2.5 rounded-full mr-2 bg-[#5E5CE6] shadow-[0_0_15px_rgba(94,92,230,0.4)]"
          >
            <Calendar size={15} color="#FFFFFF" />
            <Text className="text-white font-bold text-[11px] uppercase tracking-wider">Attendance</Text>
          </Pressable>

          <Pressable 
            onPress={() => navigation.navigate('Academics')}
            className="flex-row items-center gap-1.5 px-5 py-2.5 rounded-full mr-2 bg-white/10 border border-white/10"
            style={styles.glassCard}
          >
            <FileText size={15} color="#A5B4FC" />
            <Text className="text-[#A5B4FC] font-semibold text-[11px] uppercase tracking-wider">Homework</Text>
          </Pressable>

          <Pressable 
            onPress={() => navigation.navigate('Academics')}
            className="flex-row items-center gap-1.5 px-5 py-2.5 rounded-full mr-2 bg-white/10 border border-white/10"
            style={styles.glassCard}
          >
            <Award size={15} color="#A5B4FC" />
            <Text className="text-[#A5B4FC] font-semibold text-[11px] uppercase tracking-wider">Results</Text>
          </Pressable>

          <Pressable 
            onPress={() => navigation.navigate('Fees')}
            className="flex-row items-center gap-1.5 px-5 py-2.5 rounded-full mr-2 bg-white/10 border border-white/10"
            style={styles.glassCard}
          >
            <CreditCard size={15} color="#A5B4FC" />
            <Text className="text-[#A5B4FC] font-semibold text-[11px] uppercase tracking-wider">Fees</Text>
          </Pressable>

          <Pressable 
            onPress={() => navigation.navigate('Bus')}
            className="flex-row items-center gap-1.5 px-5 py-2.5 rounded-full mr-2 bg-white/10 border border-white/10"
            style={styles.glassCard}
          >
            <Bus size={15} color="#A5B4FC" />
            <Text className="text-[#A5B4FC] font-semibold text-[11px] uppercase tracking-wider">Bus Tracker</Text>
          </Pressable>
        </ScrollView>

        {/* Fee Alert Banner */}
        {pendingFeesCount > 0 && (
          <View className="px-5 mb-6">
            <LinearGradient
              colors={['#5E5CE6', '#3B3B98']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.feeBanner}
            >
              <View className="absolute top-0 right-0 p-4 opacity-20">
                <AlertTriangle size={72} color="#FFFFFF" />
              </View>
              <Text className="text-white text-base font-bold font-headline-md">Fee Alert</Text>
              <Text className="text-white/90 text-sm mt-1">
                Term 2 fee {currentChild.id === 'stud_001' ? '₹18,000' : '₹12,000'} due in 7 days
              </Text>
              <Pressable 
                onPress={() => navigation.navigate('Fees')}
                className="mt-3 bg-white px-5 py-2 rounded-full self-start active:scale-95 shadow-sm"
              >
                <Text className="text-[#5E5CE6] font-bold text-xs">Pay Now →</Text>
              </Pressable>
            </LinearGradient>
          </View>
        )}

        {/* Homework Section */}
        <View className="px-5 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white text-base font-bold font-headline-md">Homework Due Today</Text>
            <Pressable onPress={() => navigation.navigate('Academics')}>
              <Text className="text-[#818CF8] text-xs font-bold font-label-md">View All</Text>
            </Pressable>
          </View>

          {homework.slice(0, 2).map((hw, idx) => (
            <View 
              key={hw.id}
              style={styles.glassCard}
              className="p-4 rounded-xl flex-row justify-between items-center mb-3 border border-white/10"
            >
              <View className="flex-row items-center gap-4 flex-1 mr-2">
                <View 
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    idx === 0 ? 'bg-blue-500/20' : 'bg-purple-500/20'
                  }`}
                >
                  <FileText size={22} color={idx === 0 ? '#60a5fa' : '#c084fc'} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-sm leading-tight" numberOfLines={1}>
                    {hw.subject} - {hw.title}
                  </Text>
                  <Text className="text-red-400 font-semibold text-[10px] uppercase tracking-wider mt-1">
                    Due 4:00 PM
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
            </View>
          ))}
        </View>

        {/* Bus Tracker Card */}
        <View className="px-5 mb-6">
          <Text className="text-white text-base font-bold font-headline-md mb-3">Live Bus Tracking</Text>
          <View 
            style={[styles.glassCard, styles.busCard]}
            className="rounded-2xl overflow-hidden border border-white/10"
          >
            <View className="h-32 w-full relative">
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsrlIfVMFFa2P3mwXYGHD9lGeUxDUD7vCJYh_Zmz-dxQmtMhDnu974L3GPQWzT76Zv_Y_HDPPCGfCyhpM_lVfA2dhyrkJ6MpoiTZKbYZLmuzqnCxY66GcYOXpKh7_5o5ABVi748n7eriB2KwXpRxFOY8R2nfZns7ZwmL9NIWv3PVsATmL-NwizbA_tjDStVd8xxWe2BsdIpby-iUe9eNd0-aXwCKXjIXwjf_-jUhrUUvNnMuXWge43oWvQNK6EDijfjRjSFe14Ykdu' }}
                className="w-full h-full opacity-60"
                style={{ resizeMode: 'cover' }}
              />
              <LinearGradient
                colors={['transparent', '#0E0F26']}
                style={StyleSheet.absoluteFillObject}
              />
              <View className="absolute bottom-3 left-3 flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 bg-[#10B981] rounded-full" />
                <Text className="text-white font-bold text-[11px] uppercase tracking-wider shadow-md">
                  Bus 42B - Route North
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center p-4">
              <View className="flex-row items-center gap-2">
                <Bus size={18} color="#818CF8" />
                <Text className="text-white font-semibold text-xs">Bus arrives in 12 min</Text>
              </View>
              <Pressable onPress={() => navigation.navigate('Bus')}>
                <Text className="text-[#5E5CE6] font-bold text-xs underline">Track Live</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Announcements Feed */}
        <View className="px-5 mb-8">
          <Text className="text-white text-base font-bold font-headline-md mb-3">Latest Announcements</Text>
          {/* Card 1 */}
          <View style={styles.glassCard} className="p-4 rounded-xl flex-row gap-4 mb-3 border border-white/10">
            <View className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <ShieldCheck size={20} color="#818CF8" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm leading-tight">Annual Day Notice 2024</Text>
              <Text className="text-white/70 text-xs mt-1 leading-normal">
                Costumes for the cultural program must be collected by Friday evening from the respective class teachers.
              </Text>
              <View className="mt-2 bg-[#5E5CE6]/15 border border-[#5E5CE6]/25 px-2.5 py-0.5 rounded self-start">
                <Text className="text-[#818CF8] text-[9px] font-bold uppercase tracking-wider">School Admin</Text>
              </View>
            </View>
          </View>
 
          {/* Card 2 */}
          <View style={styles.glassCard} className="p-4 rounded-xl flex-row gap-4 mb-3 border border-white/10">
            <View className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <FlaskConical size={20} color="#34D399" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm leading-tight">Science Fair Registration</Text>
              <Text className="text-white/70 text-xs mt-1 leading-normal">
                Students of Grade 8 are invited to submit their innovative projects for the regional Science Fair. Registrations close Monday.
              </Text>
              <View className="mt-2 bg-[#10B981]/15 border border-[#10B981]/25 px-2.5 py-0.5 rounded self-start">
                <Text className="text-[#34D399] text-[9px] font-bold uppercase tracking-wider">Academic Cell</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FAB Chat Button */}
      <Pressable 
        onPress={() => navigation.navigate('Messages')}
        style={styles.fab}
        className="active:scale-90 shadow-2xl"
      >
        <MessageCircle size={24} color="#FFFFFF" />
      </Pressable>
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
    paddingBottom: 110,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  attendanceCard: {
    borderRadius: 16,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: Platform.OS === 'ios' ? 4 : 0,
  },
  feeBanner: {
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#5E5CE6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: Platform.OS === 'ios' ? 8 : 0,
  },
  busCard: {
    borderRadius: 20,
    shadowColor: '#5E5CE6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: Platform.OS === 'ios' ? 6 : 0,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 115 : 105,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5E5CE6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5E5CE6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: Platform.OS === 'ios' ? 8 : 0,
    zIndex: 99,
  },
});

export default ParentDashboard;
