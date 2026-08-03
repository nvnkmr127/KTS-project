import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Image, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { Bell, Search, Check, Lock, Menu, ChevronLeft } from 'lucide-react-native';

const studentsData = [
  { id: '1', name: 'Aditi Sharma', rollNo: '8A01', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150', defaultStatus: 'P' },
  { id: '2', name: 'Aryan Verma', rollNo: '8A02', avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=150', defaultStatus: 'A' },
  { id: '3', name: 'Ishaan Gupta', rollNo: '8A03', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150', defaultStatus: 'L', locked: true },
  { id: '4', name: 'Kavya Nair', rollNo: '8A04', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150', defaultStatus: 'HD' },
];

export const AttendanceMarkingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [attendance, setAttendance] = useState<Record<string, string>>(
    studentsData.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.defaultStatus }), {})
  );

  const toggleStatus = (id: string, status: string) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
  };

  const getStatusColor = (status: string, isSelected: boolean) => {
    if (!isSelected) return 'bg-transparent';
    switch (status) {
      case 'P': return 'bg-[#10b981]';
      case 'A': return 'bg-[#ef4444]';
      case 'L': return 'bg-[#d97706]';
      case 'HD': return 'bg-[#3b82f6]';
      default: return 'bg-transparent';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#170c2a', '#0b0516']}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Header */}
      <View style={{ zIndex: 50 }}>
        <BlurView 
          intensity={30} 
          tint="dark" 
          style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 24 : 16) }]}
        >
          {/* Left Avatar with Online Indicator */}
          <View className="flex-row items-center">
            {navigation.canGoBack() && (
              <Pressable onPress={() => navigation.goBack()} className="mr-3 p-1">
                <ChevronLeft size={24} color="#ddb7ff" />
              </Pressable>
            )}
            <View className="relative">
              <View className="w-10 h-10 rounded-full border-2 border-[#ddb7ff] p-0.5 items-center justify-center bg-[#1a1525]">
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150' }} 
                  className="w-full h-full rounded-full"
                />
              </View>
              <View className="absolute bottom-0 right-0 w-3 h-3 bg-[#00f1a1] rounded-full border-2 border-[#0d0d12]" />
            </View>
            <View className="ml-3">
              <Text className="text-[#ddb7ff] text-xl font-bold">Attendance</Text>
              <Text className="text-white/50 text-xs font-semibold tracking-wider uppercase mt-0.5">Attendance Marking</Text>
            </View>
          </View>
          
          {/* Right Notification Bell */}
          <Pressable className="w-10 h-10 rounded-xl items-center justify-center bg-white/5 border border-white/10">
            <Bell size={20} color="#fff" />
          </Pressable>
        </BlurView>
        
        {/* Glow Shadow beneath header */}
        <LinearGradient 
          colors={['rgba(221, 183, 255, 0.15)', 'transparent']} 
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Class Details and Students Enrolled Description */}
        <View className="mb-5">
          <Text className="text-white text-2xl font-extrabold tracking-tight">Class 8-A | 29 May 2026</Text>
          <Text className="text-white/40 text-xs font-bold uppercase tracking-wider mt-1">42 Students Enrolled</Text>
        </View>

        {/* Top Controls */}
        <Pressable className="bg-[#2a1b4e]/60 border border-[#ddb7ff]/30 py-2.5 px-6 rounded-full self-start mb-6 shadow-md shadow-[#ddb7ff]/5">
          <Text className="text-[#ddb7ff] font-bold text-sm">Mark All Present</Text>
        </Pressable>

        {/* Progress Card */}
        <View className="bg-[#1c1233]/40 border border-[#ddb7ff]/15 rounded-2xl p-5 mb-6 shadow-lg">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-bold text-base">Attendance Progress</Text>
            <Text className="text-[#ddb7ff] font-bold text-base">38 / 42 marked</Text>
          </View>
          <View className="h-2.5 bg-[#130d22] rounded-full overflow-hidden">
            <View className="h-full bg-[#ddb7ff] rounded-full w-[90%]" />
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-[#251845]/20 border border-[#ddb7ff]/15 rounded-full px-5 py-3.5 mb-6 shadow-md">
          <Search size={18} color="rgba(255,255,255,0.4)" className="mr-3" />
          <TextInput
            placeholder="Search student name or roll no..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            className="text-white font-medium text-base flex-1 p-0"
          />
        </View>

        {/* Student List */}
        <View className="space-y-4">
          {studentsData.map((student, index) => {
            const isLocked = student.locked;
            return (
              <View key={student.id} className="bg-[#18112b]/60 border border-[#ddb7ff]/15 rounded-2xl p-5 shadow-lg mb-4">
                <View className={`flex-row items-center justify-between mb-5 ${isLocked ? 'opacity-50' : ''}`}>
                  <View className="flex-row items-center">
                    <Text className="text-[#A1A1AA] text-lg mr-4 font-bold">0{index + 1}</Text>
                    <Image 
                      source={{ uri: student.avatar }} 
                      className="w-12 h-12 rounded-xl border border-white/10 mr-4"
                    />
                    <View>
                      <Text className="text-white text-lg font-bold">{student.name}</Text>
                      <Text className="text-[#A1A1AA] text-xs mt-0.5">Roll No: {student.rollNo}</Text>
                    </View>
                  </View>
                </View>

                {isLocked ? (
                  <View className="bg-[#854d0e] rounded-full py-2.5 items-center mb-2 shadow-sm shadow-[#d97706]/10">
                    <Text className="text-white font-bold text-base tracking-widest">L</Text>
                  </View>
                ) : (
                  <View className="flex-row bg-[#252535]/50 border border-white/10 rounded-full p-1 mb-2">
                    {['P', 'A', 'L', 'HD'].map((status) => {
                      const isSelected = attendance[student.id] === status;
                      return (
                        <Pressable
                          key={status}
                          onPress={() => toggleStatus(student.id, status)}
                          className={`flex-1 py-2 rounded-full items-center justify-center ${getStatusColor(status, isSelected)}`}
                        >
                          <Text className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-[#A1A1AA]'}`}>
                            {status}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                <View className="flex-row justify-end items-center mt-1">
                  {isLocked ? (
                    <Lock size={18} color="#A1A1AA" />
                  ) : (
                    <Menu size={20} color={attendance[student.id] === 'A' ? '#ef4444' : '#A1A1AA'} />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Submit Button (Inline at bottom of student list) */}
        <Pressable className="bg-[#ddb7ff] flex-row items-center justify-center py-4 rounded-2xl shadow-lg shadow-[#ddb7ff]/30 active:scale-95 mt-8 mb-4">
          <Check size={24} color="#150E22" />
          <Text className="text-[#150E22] font-bold text-lg ml-2">Submit Attendance</Text>
        </Pressable>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#150E22',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
});

export default AttendanceMarkingScreen;
