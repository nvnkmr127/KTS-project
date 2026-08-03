import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { Search, FileText, Calendar, Clock, Building2, Star, PlusCircle } from 'lucide-react-native';

const exams = [
  {
    id: 1,
    title: 'Mid-Term Exam',
    subject: 'Class 10 — Science & Mathematics',
    status: 'UPCOMING',
    date: 'Oct 24, 2024',
    time: '09:00 AM (3 hrs)',
    venue: 'Main Auditorium',
    marks: '100 Points',
    assigned: [
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150',
    ],
  },
  {
    id: 2,
    title: 'Final Assessment',
    subject: 'Class 12 — Economics & Humanities',
    status: 'DRAFT',
    date: 'Nov 12, 2024',
    time: '02:00 PM (2 hrs)',
    venue: 'Block C - Hall 4',
    marks: '80 Points',
    assigned: [],
  },
];

export const ExamScheduleScreen: React.FC<any> = ({ navigation }) => {

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
        
        {/* Title Row */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-white text-lg font-bold">Exam Schedule</Text>
          <Pressable className="bg-[#101415] border border-[#00f1a1]/30 px-4 py-2 rounded-lg flex-row items-center">
            <FileText size={16} color="#00f1a1" className="mr-2" />
            <Text className="text-[#00f1a1] font-semibold text-sm">Export PDF</Text>
          </Pressable>
        </View>

        {/* Exam Cards */}
        {exams.map((exam) => (
          <GlassCard key={exam.id} intensity="low" className="p-5 mb-5 border-l-2 border-l-[#00f1a1] border-[#00f1a1]/20 bg-[#101415]/60 shadow-[0_4px_15px_rgba(0,241,161,0.1)]">
            <View className="flex-row justify-between items-start mb-5">
              <View className="flex-row flex-1 mr-4">
                <View className="bg-[#101415] p-3 rounded-xl border border-[#00f1a1]/30 mr-4 h-12 w-12 items-center justify-center">
                  <FileText size={20} color="#00f1a1" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base font-bold mb-1">{exam.title}</Text>
                  <Text className="text-white/60 text-xs leading-5">{exam.subject}</Text>
                </View>
              </View>
              <StatusBadge status={exam.status} variant="outline" />
            </View>

            <View className="flex-row mb-5">
              <View className="flex-1">
                <View className="flex-row mb-4 items-start">
                  <Calendar size={16} color="#00f1a1" opacity={0.7} className="mr-3 mt-0.5" />
                  <View>
                    <Text className="text-white/50 text-[10px] tracking-wider font-bold mb-0.5">DATE</Text>
                    <Text className="text-white text-sm font-medium">{exam.date}</Text>
                  </View>
                </View>
                <View className="flex-row items-start">
                  <Building2 size={16} color="#00f1a1" opacity={0.7} className="mr-3 mt-0.5" />
                  <View>
                    <Text className="text-white/50 text-[10px] tracking-wider font-bold mb-0.5">VENUE</Text>
                    <Text className="text-white text-sm font-medium">{exam.venue}</Text>
                  </View>
                </View>
              </View>
              
              <View className="flex-1">
                <View className="flex-row mb-4 items-start">
                  <Clock size={16} color="#00f1a1" opacity={0.7} className="mr-3 mt-0.5" />
                  <View>
                    <Text className="text-white/50 text-[10px] tracking-wider font-bold mb-0.5">TIME</Text>
                    <Text className="text-white text-sm font-medium">{exam.time}</Text>
                  </View>
                </View>
                <View className="flex-row items-start">
                  <Star size={16} color="#00f1a1" opacity={0.7} className="mr-3 mt-0.5" />
                  <View>
                    <Text className="text-white/50 text-[10px] tracking-wider font-bold mb-0.5">TOTAL MARKS</Text>
                    <Text className="text-white text-sm font-medium">{exam.marks}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="border-t border-[#00f1a1]/10 pt-4 mt-2">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-white/70 text-xs tracking-[0.1em] font-bold">INVIGILATION DUTY</Text>
                <Pressable className="flex-row items-center">
                  <PlusCircle size={14} color="#00f1a1" className="mr-1" />
                  <Text className="text-[#00f1a1] font-semibold text-xs tracking-wider">Assign Teacher</Text>
                </Pressable>
              </View>
              
              {exam.assigned.length > 0 ? (
                <View className="flex-row items-center">
                  {exam.assigned.map((avatar, idx) => (
                    <Image 
                      key={idx}
                      source={{ uri: avatar }} 
                      className="w-8 h-8 rounded-full border-2 border-[#101415]"
                      style={{ marginLeft: idx > 0 ? -10 : 0, zIndex: 10 - idx }}
                    />
                  ))}
                  <View className="w-8 h-8 rounded-full border-2 border-[#101415] bg-[#1c2222] items-center justify-center -ml-2 z-0">
                    <Text className="text-[#00f1a1] text-[10px] font-bold">+2</Text>
                  </View>
                </View>
              ) : (
                <Text className="text-white/30 italic text-xs">No teachers assigned yet</Text>
              )}
            </View>
          </GlassCard>
        ))}

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

export default ExamScheduleScreen;
