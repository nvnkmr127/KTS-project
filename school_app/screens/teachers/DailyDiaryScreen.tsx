import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Image, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { 
  Bell, Calendar, ChevronDown, Paperclip, Save, ArrowRight, 
  ChevronLeft, CheckCircle2, AlertCircle, BookOpen, Clock, X
} from 'lucide-react-native';
import { useDiaryStore } from '../../store/diaryStore';

const CLASSES_LIST = ['10A', '10B', '9A', '9B', '8A', '8B', '7A', '7B', '6A', '6B'];
const PERIODS_LIST = [
  { num: 1, label: 'Period 1 (8:00 AM - 9:00 AM)' },
  { num: 2, label: 'Period 2 (9:00 AM - 10:00 AM)' },
  { num: 3, label: 'Period 3 (10:00 AM - 11:00 AM)' },
  { num: 5, label: 'Period 4 (11:15 AM - 12:15 PM)' },
  { num: 6, label: 'Period 5 (12:15 PM - 1:15 PM)' },
  { num: 8, label: 'Period 6 (2:00 PM - 3:00 PM)' }
];

export const DailyDiaryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const addOrUpdateEntry = useDiaryStore((state) => state.addOrUpdateEntry);
  const diaryEntries = useDiaryStore((state) => state.diaryEntries);

  const [selectedClass, setSelectedClass] = useState('10A');
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [subjectInput, setSubjectInput] = useState('Mathematics');
  const [topicInput, setTopicInput] = useState('');
  const [detailsInput, setDetailsInput] = useState('');
  const [homeworkInput, setHomeworkInput] = useState('');

  // Toast State
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false, title: '', message: ''
  });

  const handleSaveDiaryEntry = () => {
    if (!topicInput.trim() || !detailsInput.trim()) {
      setToastData({
        visible: true,
        title: 'Missing Required Fields',
        message: 'Please enter both Topic Title and Class Coverage details before saving.'
      });
      return;
    }

    addOrUpdateEntry({
      classId: selectedClass,
      className: `Class ${selectedClass}`,
      periodNumber: selectedPeriod,
      subject: subjectInput,
      teacherName: 'Mrs. Anita Sharma',
      topicTitle: topicInput,
      contentSummary: detailsInput,
      homework: homeworkInput || 'None',
      date: '04-08-2026',
      attachmentName: 'class_lecture_notes.pdf'
    });

    setToastData({
      visible: true,
      title: 'Daily Diary Submitted!',
      message: `Your entry for Class ${selectedClass} (Period ${selectedPeriod}) has been published and is now live on the Admin Staff Dashboard.`
    });

    // Reset inputs
    setTopicInput('');
    setDetailsInput('');
    setHomeworkInput('');
  };

  return (
    <View style={styles.container}>
      <View className="absolute inset-0 bg-[#150E22]" />
      
      {/* Header Container */}
      <View style={{ zIndex: 50 }}>
        <BlurView
          intensity={30}
          tint="dark"
          style={[
            styles.header,
            { paddingTop: insets.top + (Platform.OS === 'android' ? 24 : 16) },
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
                    uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150',
                  }}
                  className="w-full h-full rounded-full"
                />
              </View>
              <View className="absolute bottom-0 right-0 w-3 h-3 bg-[#00f1a1] rounded-full border-2 border-[#0d0d12]" />
            </View>
            <View className="ml-3">
              <Text className="text-[#ddb7ff] text-xl font-bold">Teacher Daily Diary</Text>
              <Text className="text-white/50 text-xs font-semibold tracking-wider uppercase mt-0.5">Live Admin Sync Active</Text>
            </View>
          </View>
          <Pressable className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/10">
            <Bell size={20} color="#fff" />
          </Pressable>
        </BlurView>
        
        <LinearGradient 
          colors={['rgba(221, 183, 255, 0.15)', 'transparent']} 
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Title */}
        <View className="mb-5">
          <Text className="text-white text-2xl font-extrabold tracking-tight mb-1">Submit Period Diary Entry</Text>
          <Text className="text-[#A1A1AA] text-xs">Record classroom progress to notify parents & Admin Staff.</Text>
        </View>

        {/* Class Selection Ribbon */}
        <View className="mb-4">
          <Text className="text-[#EABFFF] text-[10px] font-bold tracking-widest uppercase mb-2">Select Allotted Class Section</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {CLASSES_LIST.map(cls => {
                const isSel = selectedClass === cls;
                return (
                  <Pressable
                    key={cls}
                    onPress={() => setSelectedClass(cls)}
                    className={`px-4 py-2 rounded-xl border ${isSel ? 'bg-[#ddb7ff] border-[#ddb7ff]' : 'bg-[#2a1b4e]/80 border-[#ddb7ff]/20'}`}
                  >
                    <Text className={`text-xs font-extrabold ${isSel ? 'text-[#150E22]' : 'text-[#ddb7ff]'}`}>
                      Class {cls}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Period Selection Ribbon */}
        <View className="mb-5">
          <Text className="text-[#EABFFF] text-[10px] font-bold tracking-widest uppercase mb-2">Select Period Slot</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {PERIODS_LIST.map(p => {
                const isSel = selectedPeriod === p.num;
                return (
                  <Pressable
                    key={p.num}
                    onPress={() => setSelectedPeriod(p.num)}
                    className={`px-3.5 py-2 rounded-xl border ${isSel ? 'bg-[#00f1a1] border-[#00f1a1]' : 'bg-[#2a1b4e]/80 border-white/10'}`}
                  >
                    <Text className={`text-xs font-bold ${isSel ? 'text-[#101415]' : 'text-white/70'}`}>
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Form Inputs */}
        <View className="bg-[#1e1136] border border-white/10 rounded-3xl p-5 mb-6 shadow-lg">
          <Text className="text-[#EABFFF] text-[10px] font-bold tracking-widest uppercase mb-1.5">Subject *</Text>
          <TextInput
            value={subjectInput}
            onChangeText={setSubjectInput}
            placeholder="e.g. Mathematics, Physics..."
            placeholderTextColor="#A1A1AA"
            className="bg-[#120A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs mb-4"
          />

          <Text className="text-[#EABFFF] text-[10px] font-bold tracking-widest uppercase mb-1.5">Topic / Lesson Title *</Text>
          <TextInput
            value={topicInput}
            onChangeText={setTopicInput}
            placeholder="e.g. Quadratic Equations & Real Roots"
            placeholderTextColor="#A1A1AA"
            className="bg-[#120A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs mb-4 font-bold"
          />

          <Text className="text-[#EABFFF] text-[10px] font-bold tracking-widest uppercase mb-1.5">Classroom Coverage Summary *</Text>
          <TextInput
            value={detailsInput}
            onChangeText={setDetailsInput}
            placeholder="Summarize key concepts covered, student engagement, and board demonstrations..."
            placeholderTextColor="#A1A1AA"
            multiline
            numberOfLines={4}
            style={{ textAlignVertical: 'top' }}
            className="bg-[#120A1A] border border-white/10 rounded-xl px-3.5 py-3 text-white text-xs leading-relaxed mb-4"
          />

          <Text className="text-[#EABFFF] text-[10px] font-bold tracking-widest uppercase mb-1.5">Assigned Homework / Practice</Text>
          <TextInput
            value={homeworkInput}
            onChangeText={setHomeworkInput}
            placeholder="e.g. Exercise 4.3 Questions 1 through 8"
            placeholderTextColor="#A1A1AA"
            className="bg-[#120A1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs mb-5"
          />

          <Pressable
            onPress={handleSaveDiaryEntry}
            className="bg-[#00f1a1] flex-row items-center justify-center py-3.5 rounded-2xl shadow-lg shadow-[#00f1a1]/30"
          >
            <Save size={18} color="#150E22" style={{ marginRight: 6 }} />
            <Text className="text-[#150E22] font-extrabold text-xs uppercase tracking-wider">Publish Diary Entry</Text>
          </Pressable>
        </View>

        {/* Live Submitted Entries Log */}
        <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Live Submitted Entries ({diaryEntries.length})</Text>
        {diaryEntries.map(e => (
          <View key={e.id} className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-4 mb-3">
            <View className="flex-row justify-between items-center mb-1.5">
              <View className="bg-[#ddb7ff]/20 border border-[#ddb7ff]/40 px-2.5 py-0.5 rounded-md">
                <Text className="text-[#ddb7ff] text-[10px] font-bold">{e.className} • Period {e.periodNumber}</Text>
              </View>
              <Text className="text-[#00f1a1] text-[10px] font-bold">Submitted {e.submittedAt}</Text>
            </View>

            <Text className="text-white text-sm font-extrabold">{e.subject}: {e.topicTitle}</Text>
            <Text className="text-white/60 text-xs mt-1 leading-relaxed">{e.contentSummary}</Text>
            <Text className="text-amber-400 text-xs font-bold mt-2">HW: {e.homework}</Text>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* TOAST MODAL */}
      <Modal visible={toastData.visible} transparent animationType="fade" onRequestClose={() => setToastData(prev => ({ ...prev, visible: false }))}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-[#00f1a1]/40 rounded-3xl w-full max-w-sm p-6 items-center shadow-[0_0_30px_rgba(0,241,161,0.3)]">
            <View className="w-14 h-14 rounded-full bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center mb-4">
              <CheckCircle2 size={28} color="#00f1a1" />
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">{toastData.title}</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">{toastData.message}</Text>

            <Pressable
              onPress={() => setToastData(prev => ({ ...prev, visible: false }))}
              className="w-full py-3.5 rounded-xl bg-[#00f1a1] items-center shadow-[0_0_12px_rgba(0,241,161,0.4)]"
            >
              <Text className="text-[#101415] font-extrabold text-sm">Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
});

export default DailyDiaryScreen;
