import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { Search, Phone, MessageSquare, GraduationCap, Calendar, Smile, UserPlus } from 'lucide-react-native';

const leadsData = [
  { id: 1, parent: 'Mr. Rajan', child: 'Aarav', class: 'Class 1', date: 'Oct 25', status: 'NEW' },
  { id: 2, parent: 'Mrs. Sharma', child: 'Vihaan', class: 'Class 3', date: 'Oct 24', status: 'CONTACTED' },
  { id: 3, parent: 'Dr. Gupta', child: 'Ishani', class: 'Nursery', date: 'Oct 22', status: 'FOLLOW-UP' },
  { id: 4, parent: 'Mr. Verma', child: 'Kabir', class: 'Class 5', date: 'Oct 19', status: 'CONVERTED' },
  { id: 5, parent: 'Ms. Iyer', child: 'Meera', class: 'KG 1', date: 'Oct 15', status: 'DROPPED' },
];

export const EnquiryLeadsScreen: React.FC<any> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('All Leads');
  const tabs = ['All Leads', 'New', 'Contacted', 'Follow-up'];

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
        
        {/* Pipeline Stats */}
        <GlassCard intensity="low" className="p-5 mb-6 bg-[#101415]/80 border border-[#00f1a1]/30 shadow-[0_4px_15px_rgba(0,241,161,0.15)]" glowColor="rgba(0, 241, 161, 0.1)">
          <Text className="text-[#00f1a1] tracking-[0.2em] text-[10px] font-bold mb-2">ENQUIRY PIPELINE</Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-white text-4xl font-bold tracking-tighter">42 Leads</Text>
            <View className="bg-[#101415] border border-[#00f1a1]/50 px-3 py-1.5 rounded-md shadow-[0_0_10px_rgba(0,241,161,0.2)]">
              <Text className="text-[#00f1a1] text-[10px] font-bold">+12% vs last week</Text>
            </View>
          </View>
        </GlassCard>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 pl-1" contentContainerStyle={{ paddingRight: 20 }}>
          {tabs.map((tab) => (
            <Pressable 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              className={`mr-3 px-5 py-2.5 rounded-full ${activeTab === tab ? 'bg-[#101415] border border-[#00f1a1] shadow-[0_0_8px_rgba(0,241,161,0.3)]' : 'bg-transparent border border-white/20'}`}
            >
              <Text className={activeTab === tab ? 'text-[#00f1a1] font-bold tracking-wider' : 'text-white/70 font-semibold tracking-wider'}>{tab}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Leads List */}
        {leadsData.map(lead => (
          <GlassCard key={lead.id} intensity="low" className="p-5 mb-4 border-[#00f1a1]/10 bg-[#101415]/60">
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
                <GraduationCap size={14} color="#00f1a1" className="mr-1.5" />
                <Text className="text-white text-sm font-medium">{lead.class}</Text>
              </View>
              <View className="flex-row items-center">
                <Calendar size={14} color="#00f1a1" className="mr-1.5" />
                <Text className="text-white text-sm font-medium">{lead.date}</Text>
              </View>
            </View>

            <View className="flex-row space-x-3">
              <Pressable className="flex-1 bg-[#101415] border border-[#00f1a1]/30 rounded-xl py-3 flex-row justify-center items-center shadow-[0_4px_10px_rgba(0,241,161,0.1)]">
                <Phone size={16} color="#00f1a1" className="mr-2" />
                <Text className="text-[#00f1a1] font-bold text-sm tracking-wide">Quick Call</Text>
              </Pressable>
              <Pressable className="flex-1 bg-[#101415] border border-[#00f1a1]/30 rounded-xl py-3 flex-row justify-center items-center shadow-[0_4px_10px_rgba(0,241,161,0.1)]">
                <MessageSquare size={16} color="#00f1a1" className="mr-2" />
                <Text className="text-[#00f1a1] font-bold text-sm tracking-wide">WhatsApp</Text>
              </Pressable>
            </View>
          </GlassCard>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} className="bg-[#00f1a1] shadow-[0_0_20px_rgba(0,241,161,0.6)]">
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
