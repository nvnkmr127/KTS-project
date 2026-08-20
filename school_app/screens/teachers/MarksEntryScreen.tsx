import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Image, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Bell, Save, ChevronDown } from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';

const studentsData = [
  { id: '1', name: 'Johnathan Doe', rollNo: '10A001', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150', defaultMark: '98' },
  { id: '2', name: 'Sarah Weaver', rollNo: '10A002', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150', defaultMark: '72' },
  { id: '3', name: 'Marcus Thorne', rollNo: '10A003', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150', defaultMark: '31' },
  { id: '4', name: 'Luna Aster', rollNo: '10A004', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150', defaultMark: '88' },
];

export const MarksEntryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isSmallPhone, headerPaddingTop } = useResponsive();
  const [marks, setMarks] = useState<Record<string, string>>(
    studentsData.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.defaultMark }), {})
  );

  const handleMarkChange = (id: string, value: string) => {
    setMarks(prev => ({ ...prev, [id]: value }));
  };

  return (
    <View style={styles.container}>
      <View className="absolute inset-0 bg-[#150E22]" />

      {/* Header Container with Shadow */}
      <View style={{ zIndex: 50 }}>
        <BlurView
          intensity={30}
          tint="dark"
          style={[
            styles.header,
            { paddingTop: headerPaddingTop },
          ]}
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className="relative">
              <View className="w-12 h-12 rounded-full border-2 border-[#ddb7ff] p-0.5 items-center justify-center bg-[#1a1525]">
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150",
                  }}
                  className="w-full h-full rounded-full"
                />
              </View>
              <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00f1a1] rounded-full border-2 border-[#0d0d12]" />
            </View>
            <View className="ml-3 flex-1">
              <Text numberOfLines={1} className="text-[#ddb7ff] text-lg md:text-xl font-bold">Marks Entry</Text>
              <Text numberOfLines={1} className="text-white/50 text-xs font-semibold tracking-wider uppercase mt-0.5">
                Student Assessments
              </Text>
            </View>
          </View>
          <Pressable 
            className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/10"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
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

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 }
        ]} 
        showsVerticalScrollIndicator={false}
      >

        {/* Title & Save Button */}
        <View className="mb-6">
          <Text className="text-white text-[28px] md:text-[32px] font-extrabold tracking-tight mb-2">Marks Entry</Text>
          <Text className="text-white/60 text-xs font-bold tracking-[0.15em] uppercase mb-6 leading-5">
            Academic Year 2023-24 • Grade 10-A
          </Text>
          <Pressable className="bg-[#EABFFF] flex-row items-center justify-center py-4 rounded-xl shadow-lg shadow-[#EABFFF]/20 active:scale-95">
            <Save size={20} color="#2d1b4e" />
            <Text className="text-[#2d1b4e] font-bold text-base ml-2">Save Marks</Text>
          </Pressable>
        </View>

        {/* Dropdowns */}
        <View className="mb-8">
          <View className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-4 shadow-lg mb-4">
            <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-widest uppercase mb-3">Select Examination</Text>
            <View className="flex-row justify-between items-center bg-[#2a1b4e]/80 border border-transparent px-4 py-3 rounded-xl">
              <Text className="text-white text-sm md:text-base">Final Term Examination</Text>
              <ChevronDown size={20} color="#fff" />
            </View>
          </View>

          <View className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-4 shadow-lg">
            <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-widest uppercase mb-3">Select Subject</Text>
            <View className="flex-row justify-between items-center bg-[#2a1b4e]/80 border border-transparent px-4 py-3 rounded-xl">
              <Text className="text-white text-sm md:text-base">Advanced Mathematics</Text>
              <ChevronDown size={20} color="#fff" />
            </View>
          </View>
        </View>

        {/* Marks Table */}
        <View className="bg-[#1C1C1E] border border-white/5 rounded-3xl shadow-lg mb-8 overflow-hidden">
          {/* Table Header */}
          <View className="flex-row items-center px-4 md:px-5 py-4 md:py-5 border-b border-white/5 bg-[#251e33]/50">
            <Text className="text-[#ddb7ff] text-[10px] md:text-[11px] font-bold tracking-widest uppercase flex-[1.4]">STUDENT</Text>
            <Text className="text-[#ddb7ff] text-[10px] md:text-[11px] font-bold tracking-widest uppercase flex-1 text-center">ROLL NO</Text>
            <Text className="text-[#ddb7ff] text-[10px] md:text-[11px] font-bold tracking-widest uppercase flex-1 text-right">MARKS (/100)</Text>
          </View>

          {/* Table Rows */}
          {studentsData.map((student, index) => (
            <View key={student.id} className={`flex-row items-center px-4 md:px-5 py-3.5 md:py-4 ${index !== studentsData.length - 1 ? 'border-b border-white/5' : ''}`}>
              <View className="flex-row items-center flex-[1.4] pr-2">
                <Image source={{ uri: student.avatar }} className="w-8 h-8 md:w-10 md:h-10 rounded-full mr-2.5 border border-white/10" />
                <View className="flex-1">
                  <Text className="text-white font-bold text-xs md:text-sm leading-tight" numberOfLines={2}>{student.name}</Text>
                </View>
              </View>
              <Text className="text-[#A1A1AA] text-xs md:text-sm flex-1 text-center">{student.rollNo}</Text>
              <View className="flex-1 items-end">
                <TextInput
                  value={marks[student.id]}
                  onChangeText={(val) => handleMarkChange(student.id, val)}
                  keyboardType="numeric"
                  maxLength={3}
                  className="bg-[#150E22] border border-white/5 text-white font-bold text-sm md:text-base text-right px-3 py-2 md:px-4 md:py-3 rounded-xl min-w-[56px] md:min-w-[70px]"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between">
          <View className="w-[48%] bg-[#1C1C1E] border border-white/5 rounded-3xl p-5 mb-4 shadow-lg">
            <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-widest uppercase mb-3">Class Average</Text>
            <Text className="text-white text-2xl font-light tracking-tight">72.4 %</Text>
          </View>

          <View className="w-[48%] bg-[#1C1C1E] border border-white/5 rounded-3xl p-5 mb-4 shadow-lg">
            <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-widest uppercase mb-3">Highest Score</Text>
            <Text className="text-[#EABFFF] text-2xl font-light tracking-tight">98 <Text className="text-[#A1A1AA] text-sm">/ 100</Text></Text>
          </View>

          <View className="w-[48%] bg-[#1C1C1E] border border-white/5 rounded-3xl p-5 shadow-lg">
            <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-widest uppercase mb-3">Lowest Score</Text>
            <Text className="text-[#ff9f43] text-2xl font-light tracking-tight">31 <Text className="text-[#A1A1AA] text-sm">/ 100</Text></Text>
          </View>

          <View className="w-[48%] bg-[#1C1C1E] border border-white/5 rounded-3xl p-5 shadow-lg">
            <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-widest uppercase mb-3">Pass Rate</Text>
            <Text className="text-white text-2xl font-light tracking-tight mb-2">94 %</Text>
            <View className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
              <View className="h-full bg-[#EABFFF] rounded-full w-[94%]" />
            </View>
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
    backgroundColor: '#150E22',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
});

export default MarksEntryScreen;
