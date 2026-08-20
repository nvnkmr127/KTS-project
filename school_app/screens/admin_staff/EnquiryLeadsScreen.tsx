import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { Search, Phone, MessageSquare, GraduationCap, Calendar, Smile, UserPlus } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

const leadsData = [
  { id: 1, parent: 'Mr. Rajan', child: 'Aarav', class: 'Class 1', date: 'Oct 25', status: 'NEW' },
  { id: 2, parent: 'Mrs. Sharma', child: 'Vihaan', class: 'Class 3', date: 'Oct 24', status: 'CONTACTED' },
  { id: 3, parent: 'Dr. Gupta', child: 'Ishani', class: 'Nursery', date: 'Oct 22', status: 'FOLLOW-UP' },
  { id: 4, parent: 'Mr. Verma', child: 'Kabir', class: 'Class 5', date: 'Oct 19', status: 'CONVERTED' },
  { id: 5, parent: 'Ms. Iyer', child: 'Meera', class: 'KG 1', date: 'Oct 15', status: 'DROPPED' },
];

export const EnquiryLeadsScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { insets, isSmallPhone } = useResponsive();
  const isSuperAdmin = user?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState('All Leads');
  const tabs = ['All Leads', 'New', 'Contacted', 'Follow-up'];

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';
  const primaryBorderClass = isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/30';

  return (
    <View style={[styles.container, isSuperAdmin && { backgroundColor: '#101415' }]}>
      <LinearGradient
        colors={isSuperAdmin ? ['#1d2022', '#101415'] : ['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <AdminStaffHeader 
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Admin Panel"
        icon={
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150' }} 
            className={`w-8 h-8 rounded-full border ${primaryBorderClass}`}
          />
        }
        rightAction={
          <Pressable>
            <Search size={24} color={primaryColor} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Pipeline Stats */}
        <GlassCard intensity="low" className={`p-5 mb-6 bg-[#101415]/80 border ${primaryBorderClass} shadow-lg`} glowColor={isSuperAdmin ? 'rgba(240, 193, 16, 0.1)' : 'rgba(0, 241, 161, 0.1)'}>
          <Text className={`${primaryTextClass} tracking-[0.2em] text-[10px] font-bold mb-2`}>ENQUIRY PIPELINE</Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-4xl font-bold tracking-tighter">42 Leads</Text>
            <View className={`bg-[#101415] border px-3 py-1.5 rounded-md ${primaryBorderClass}`}>
              <Text className={`${primaryTextClass} text-[10px] font-bold`}>+12% vs last week</Text>
            </View>
          </View>
        </GlassCard>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 pl-1" contentContainerStyle={{ paddingRight: 20 }}>
          {tabs.map((tab) => (
            <Pressable 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              className={`mr-3 px-5 py-2.5 rounded-full ${activeTab === tab ? `bg-[#101415] border ${isSuperAdmin ? 'border-[#f0c110]' : 'border-[#00f1a1]'} shadow-lg` : 'bg-transparent border border-white/20'}`}
            >
              <Text className={activeTab === tab ? `${primaryTextClass} font-bold tracking-wider` : 'text-white/70 font-semibold tracking-wider'}>{tab}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Leads List */}
        {leadsData.map(lead => (
          <GlassCard key={lead.id} intensity="low" className="p-5 mb-4 border-white/10 bg-[#101415]/60">
            <View className="flex-row justify-between items-start mb-3">
              <Text className="text-white text-lg font-semibold">{lead.parent}</Text>
              <StatusBadge status={lead.status} variant="outline" />
            </View>

            <View className="flex-row items-center mb-4">
              <Smile size={14} color="#ffffff" opacity={0.5} className="mr-1.5" />
              <Text className="text-white/80 text-sm font-medium">Child: {lead.child}</Text>
            </View>

            <View className="flex-row mb-5">
              <View className="flex-row items-center mr-6">
                <GraduationCap size={14} color={primaryColor} className="mr-1.5" />
                <Text className="text-white text-sm font-medium">{lead.class}</Text>
              </View>
              <View className="flex-row items-center">
                <Calendar size={14} color={primaryColor} className="mr-1.5" />
                <Text className="text-white text-sm font-medium">{lead.date}</Text>
              </View>
            </View>

            <View className="flex-row space-x-3" style={{ gap: 12 }}>
              <Pressable className={`flex-1 bg-[#101415] border ${primaryBorderClass} rounded-xl py-3 flex-row justify-center items-center shadow-lg`}>
                <Phone size={16} color={primaryColor} style={{ marginRight: 6 }} />
                <Text className={`${primaryTextClass} font-bold text-sm tracking-wide`}>Quick Call</Text>
              </Pressable>
              <Pressable className={`flex-1 bg-[#101415] border ${primaryBorderClass} rounded-xl py-3 flex-row justify-center items-center shadow-lg`}>
                <MessageSquare size={16} color={primaryColor} style={{ marginRight: 6 }} />
                <Text className={`${primaryTextClass} font-bold text-sm tracking-wide`}>WhatsApp</Text>
              </Pressable>
            </View>
          </GlassCard>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} className={`${primaryBtnClass} shadow-lg`}>
        <UserPlus size={24} color="#101415" />
      </Pressable>
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
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  }
});

export default EnquiryLeadsScreen;
