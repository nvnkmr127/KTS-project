import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Image, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { Bell, Calendar, ChevronDown, Bold, Italic, List, Paperclip, Save, ArrowRight, FileText, ChevronLeft } from 'lucide-react-native';

const recentLogs = [
  {
    id: '1',
    title: "Newton's Third Law Deep Dive",
    tag: 'Mechanics',
    date: 'Oct 23',
    content: "Completed the classroom demonstration with pulleys and weights. Students seemed engaged with the practical application, thou...",
    attachment: 'pulley_setup.pdf'
  },
  {
    id: '2',
    title: "Vector Addition Lab",
    tag: 'Lab Session',
    date: 'Oct 22',
    content: "Students worked in pairs to calculate resultant forces using spring balances. Observations indicate that Grade 10B is ahead of schedule...",
    attachment: 'lab_results_2210.xlsx'
  },
  {
    id: '3',
    title: "Intro to Wave-Particle Duality",
    tag: 'Quantum',
    date: 'Oct 21',
    content: "Started with the Double Slit Experiment concept. High levels of curiosity noted. Need to prepare more visual aids for the next...",
    attachment: null
  }
];

export const DailyDiaryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [details, setDetails] = useState('');

  return (
    <View style={styles.container}>
      <View className="absolute inset-0 bg-[#150E22]" />
      
      {/* Header Container with Custom Glow Shadow */}
      <View style={{ zIndex: 50 }}>
        <BlurView
          intensity={30}
          tint="dark"
          style={[
            styles.header,
            { paddingTop: insets.top + (Platform.OS === "android" ? 24 : 16) },
          ]}
        >
          <View className="flex-row items-center">
            {navigation.canGoBack() && (
              <Pressable onPress={() => navigation.goBack()} className="mr-3 p-1">
                <ChevronLeft size={24} color="#ddb7ff" />
              </Pressable>
            )}
            <View className="relative">
              <View className="w-10 h-10 rounded-full border-2 border-[#ddb7ff] p-0.5 items-center justify-center bg-[#1a1525]">
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150",
                  }}
                  className="w-full h-full rounded-full"
                />
              </View>
              <View className="absolute bottom-0 right-0 w-3 h-3 bg-[#00f1a1] rounded-full border-2 border-[#0d0d12]" />
            </View>
            <View className="ml-3">
              <Text className="text-[#ddb7ff] text-xl font-bold">Daily Diary</Text>
              <Text className="text-white/50 text-xs font-semibold tracking-wider uppercase mt-0.5">Daily Progress</Text>
            </View>
          </View>
          <Pressable className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/10">
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
        
        {/* Title */}
        <View className="mb-6">
          <Text className="text-white text-[32px] font-extrabold tracking-tight mb-2">Daily Diary</Text>
          <Text className="text-[#A1A1AA] text-sm">Capture today's pedagogical progress.</Text>
        </View>

        {/* Filters */}
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-row items-center bg-[#2a1b4e]/80 border border-[#ddb7ff]/20 px-5 py-3 rounded-2xl flex-1 mr-4 shadow-lg">
            <Text className="text-white font-medium flex-1 text-base">Grade 10 - Physics</Text>
            <ChevronDown size={20} color="#EABFFF" />
          </View>
          <View className="bg-[#2a1b4e]/80 border border-[#ddb7ff]/20 px-4 py-3 rounded-2xl flex-row items-center justify-center shadow-lg">
            <Calendar size={18} color="#EABFFF" className="mr-3" />
            <View>
              <Text className="text-white/80 text-[10px] font-bold">Oct</Text>
              <Text className="text-white text-xs font-bold">24, 2023</Text>
            </View>
          </View>
        </View>

        {/* Input Form */}
        <View className="bg-[#1e1136] border border-white/5 rounded-[32px] p-6 mb-8 shadow-lg">
          
          {/* Tags */}
          <Text className="text-[#EABFFF] text-[10px] font-bold tracking-widest uppercase mb-4">TODAY'S SUBJECT FOCUS</Text>
          <View className="flex-row flex-wrap mb-8">
            <View className="bg-[#ddb7ff]/20 border border-[#ddb7ff]/50 px-5 py-2.5 rounded-full mr-2 mb-3">
              <Text className="text-[#EABFFF] text-xs font-bold">Electromagnetism</Text>
            </View>
            <View className="bg-[#2a1b4e] border border-transparent px-5 py-2.5 rounded-full mr-2 mb-3">
              <Text className="text-[#A1A1AA] text-xs font-medium">Optics</Text>
            </View>
            <View className="bg-[#2a1b4e] border border-transparent px-5 py-2.5 rounded-full mr-2 mb-3">
              <Text className="text-[#A1A1AA] text-xs font-medium">Thermodynamics</Text>
            </View>
            <View className="bg-[#2a1b4e] border border-transparent px-5 py-2.5 rounded-full mr-2 mb-3">
              <Text className="text-[#A1A1AA] text-xs font-medium">Lab Session</Text>
            </View>
            <View className="bg-transparent border border-[#A1A1AA]/30 border-dashed px-5 py-2.5 rounded-full mb-3 flex-row items-center">
              <Text className="text-[#A1A1AA] text-xs font-medium">+ Add Tag</Text>
            </View>
          </View>

          {/* Text Editor */}
          <Text className="text-[#EABFFF] text-[10px] font-bold tracking-widest uppercase mb-4">CLASS COVERAGE DETAILS</Text>
          <View className="bg-[#120A1A] border border-white/5 rounded-2xl overflow-hidden mb-8">
            <View className="flex-row items-center px-5 py-4 border-b border-white/5 bg-[#1a0f2e]">
              <Pressable className="mr-5"><Bold size={18} color="#EABFFF" /></Pressable>
              <Pressable className="mr-5"><Italic size={18} color="#EABFFF" /></Pressable>
              <Pressable className="mr-5"><List size={18} color="#EABFFF" /></Pressable>
              <View className="w-[1px] h-4 bg-white/20 mx-3" />
              <Pressable className="ml-3"><Paperclip size={18} color="#EABFFF" /></Pressable>
            </View>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="What was covered today in class? Summarize key concepts, student reactions, and homework assigned..."
              placeholderTextColor="#A1A1AA"
              multiline
              numberOfLines={6}
              style={{ textAlignVertical: 'top' }}
              className="px-5 py-5 text-white text-base leading-relaxed"
            />
          </View>

          <Pressable className="bg-[#EABFFF] flex-row items-center justify-center py-4 rounded-2xl shadow-lg shadow-[#EABFFF]/30">
            <Save size={20} color="#150E22" />
            <Text className="text-[#150E22] font-bold text-base ml-2">Save Daily Entry</Text>
          </Pressable>
        </View>

        {/* Recent Logs */}
        <View className="flex-row justify-between items-end mb-6">
          <Text className="text-white text-[28px] font-bold tracking-tight">Recent Logs</Text>
          <Pressable className="flex-row items-center">
            <Text className="text-[#EABFFF] text-sm font-bold tracking-wide mr-1">View All History</Text>
            <ArrowRight size={16} color="#EABFFF" />
          </Pressable>
        </View>

        <View className="space-y-4">
          {recentLogs.map((log) => (
            <View key={log.id} className="bg-[#1C1C1E] border border-white/5 rounded-3xl p-6 shadow-lg mb-4">
              <View className="flex-row justify-between items-center mb-4">
                <View className="bg-[#2a1b4e] px-4 py-1.5 rounded-full border border-transparent">
                  <Text className="text-[#EABFFF] text-[10px] font-bold">{log.tag}</Text>
                </View>
                <Text className="text-[#A1A1AA] text-xs font-bold">{log.date}</Text>
              </View>
              
              <Text className="text-white text-lg font-bold mb-3">{log.title}</Text>
              <Text className="text-[#A1A1AA] text-sm leading-relaxed mb-5">{log.content}</Text>
              
              <View className="border-t border-white/5 pt-5">
                {log.attachment ? (
                  <View className="flex-row items-center">
                    <Paperclip size={14} color="#A1A1AA" />
                    <Text className="text-[#A1A1AA] text-xs ml-2 font-medium">{log.attachment}</Text>
                  </View>
                ) : (
                  <Text className="text-[#A1A1AA]/50 text-xs italic">No attachments</Text>
                )}
              </View>
            </View>
          ))}
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

export default DailyDiaryScreen;
