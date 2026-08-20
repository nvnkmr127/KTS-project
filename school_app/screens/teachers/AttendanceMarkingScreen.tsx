import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Image, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { 
  Bell, Search, Check, Lock, ChevronLeft, Calendar, 
  Clock, ShieldCheck, CheckCircle2, AlertCircle, Users, Sun, Sunset
} from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';

export interface StudentMarkItem {
  id: string;
  name: string;
  rollNo: string;
  avatar: string;
  status: 'P' | 'A' | 'L' | 'HD';
  locked?: boolean;
}

export interface AllottedClassSession {
  classId: string;
  className: string;
  session: 'first_period' | 'lunch_period';
  sessionLabel: string;
  periodLabel: string;
  subjectName: string;
  isAllotted: boolean;
  students: StudentMarkItem[];
}

const ALLOTTED_CLASSES_DATA: AllottedClassSession[] = [
  {
    classId: '10A',
    className: 'Class 10 — Section A',
    session: 'first_period',
    sessionLabel: 'Morning 1st Period Session',
    periodLabel: 'Period 1 (08:30 - 09:15)',
    subjectName: 'Mathematics',
    isAllotted: true,
    students: [
      { id: 'st_1', name: 'B Sandeep Goud', rollNo: '10A01', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150', status: 'P' },
      { id: 'st_2', name: 'Banda Teja Sri', rollNo: '10A02', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150', status: 'P' },
      { id: 'st_3', name: 'Chandippa Sragvi', rollNo: '10A03', avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=150', status: 'A' },
      { id: 'st_4', name: 'Chilkuri Shiva Prasad', rollNo: '10A04', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150', status: 'P' },
      { id: 'st_5', name: 'D Thanush', rollNo: '10A05', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150', status: 'P' },
      { id: 'st_6', name: 'Dutha Varshini', rollNo: '10A06', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150', status: 'L', locked: true },
      { id: 'st_7', name: 'Harijan Naveen Kumar', rollNo: '10A07', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=150', status: 'P' },
      { id: 'st_8', name: 'Kandikonda Ashwitha', rollNo: '10A08', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150', status: 'HD' }
    ]
  },
  {
    classId: '10A',
    className: 'Class 10 — Section A',
    session: 'lunch_period',
    sessionLabel: 'Post-Lunch Session',
    periodLabel: 'Period 4 (11:30 - 12:15)',
    subjectName: 'Physics (Lab Session)',
    isAllotted: true,
    students: [
      { id: 'st_1', name: 'B Sandeep Goud', rollNo: '10A01', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150', status: 'P' },
      { id: 'st_2', name: 'Banda Teja Sri', rollNo: '10A02', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150', status: 'P' },
      { id: 'st_3', name: 'Chandippa Sragvi', rollNo: '10A03', avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=150', status: 'A' },
      { id: 'st_4', name: 'Chilkuri Shiva Prasad', rollNo: '10A04', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150', status: 'P' },
      { id: 'st_5', name: 'D Thanush', rollNo: '10A05', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150', status: 'P' }
    ]
  },
  {
    classId: '9A',
    className: 'Class 9 — Section A',
    session: 'first_period',
    sessionLabel: 'Morning 1st Period Session',
    periodLabel: 'Period 1 (08:30 - 09:15)',
    subjectName: 'Chemistry',
    isAllotted: true,
    students: [
      { id: 'st_9', name: 'Aditi Sharma', rollNo: '9A01', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150', status: 'P' },
      { id: 'st_10', name: 'Aryan Verma', rollNo: '9A02', avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=150', status: 'A' },
      { id: 'st_11', name: 'Ishaan Gupta', rollNo: '9A03', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150', status: 'P' },
      { id: 'st_12', name: 'Kavya Nair', rollNo: '9A04', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150', status: 'P' }
    ]
  }
];

export const AttendanceMarkingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isSmallPhone, headerPaddingTop, scrollBottomPadding } = useResponsive();

  const [selectedSession, setSelectedSession] = useState<'first_period' | 'lunch_period'>('first_period');
  const [selectedClassIndex, setSelectedClassIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Available Allotted Classes matching selected session
  const activeAllottedClasses = ALLOTTED_CLASSES_DATA.filter(ac => ac.session === selectedSession);
  const activeClassObj = activeAllottedClasses[selectedClassIndex] || activeAllottedClasses[0] || ALLOTTED_CLASSES_DATA[0];

  // Student Attendance State: studentId -> status
  const [studentStatusMap, setStudentStatusMap] = useState<Record<string, 'P' | 'A' | 'L' | 'HD'>>(() => {
    const map: Record<string, 'P' | 'A' | 'L' | 'HD'> = {};
    activeClassObj.students.forEach(s => {
      map[s.id] = s.status;
    });
    return map;
  });

  // Modal State
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'warning' }>({
    visible: false, title: '', message: '', type: 'success'
  });

  const showToast = (title: string, message: string, type: 'success' | 'warning' = 'success') => {
    setToastData({ visible: true, title, message, type });
  };

  const handleStatusChange = (studentId: string, newStatus: 'P' | 'A' | 'L' | 'HD') => {
    setStudentStatusMap(prev => ({
      ...prev,
      [studentId]: newStatus
    }));
  };

  const handleMarkAllPresent = () => {
    const map: Record<string, 'P' | 'A' | 'L' | 'HD'> = {};
    activeClassObj.students.forEach(s => {
      if (s.locked) {
        map[s.id] = studentStatusMap[s.id] || s.status;
      } else {
        map[s.id] = 'P';
      }
    });
    setStudentStatusMap(map);
    showToast('Success', `All students marked Present for ${activeClassObj.className}`);
  };

  const handleConfirmSubmitAttendance = () => {
    setShowSubmitConfirmModal(false);
    showToast(
      'Attendance Submitted!',
      `Attendance for ${activeClassObj.className} (${activeClassObj.sessionLabel}) recorded in school portal.`,
      'success'
    );
  };

  // Metrics
  const currentStudentsList = activeClassObj.students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const presentCount = Object.values(studentStatusMap).filter(s => s === 'P' || s === 'HD').length;
  const totalCount = activeClassObj.students.length;
  const progressPct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

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
          style={[styles.header, { paddingTop: headerPaddingTop }]}
        >
          <View className="flex-row items-center flex-1 mr-2">
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
            <View className="ml-3 flex-1">
              <Text numberOfLines={1} className="text-[#ddb7ff] text-lg md:text-xl font-bold">Attendance Allotment</Text>
              <Text numberOfLines={1} className="text-white/50 text-xs font-semibold tracking-wider uppercase mt-0.5">Teacher Login Directory</Text>
            </View>
          </View>
          
          <Pressable className="w-10 h-10 rounded-xl items-center justify-center bg-white/5 border border-white/10">
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
        
        {/* Attendance Allotment Session Picker (1st Period vs Post-Lunch) */}
        <View className="mb-4">
          <Text className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Select Allotted Attendance Session</Text>
          <View className="flex-row bg-[#1c1233]/80 p-1.5 rounded-2xl border border-[#ddb7ff]/20" style={{ gap: 8 }}>
            <Pressable
              onPress={() => {
                setSelectedSession('first_period');
                setSelectedClassIndex(0);
              }}
              className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${selectedSession === 'first_period' ? 'bg-[#ddb7ff] text-[#1a1525]' : 'bg-transparent'}`}
            >
              <Sun size={15} color={selectedSession === 'first_period' ? '#1a1525' : '#ddb7ff'} style={{ marginRight: 6 }} />
              <Text className={`text-xs font-extrabold ${selectedSession === 'first_period' ? 'text-[#1a1525]' : 'text-[#ddb7ff]'}`}>
                1st Period (Morning)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setSelectedSession('lunch_period');
                setSelectedClassIndex(0);
              }}
              className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${selectedSession === 'lunch_period' ? 'bg-[#ddb7ff] text-[#1a1525]' : 'bg-transparent'}`}
            >
              <Sunset size={15} color={selectedSession === 'lunch_period' ? '#1a1525' : '#ddb7ff'} style={{ marginRight: 6 }} />
              <Text className={`text-xs font-extrabold ${selectedSession === 'lunch_period' ? 'text-[#1a1525]' : 'text-[#ddb7ff]'}`}>
                Post-Lunch Period
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Timetable Allotted Class Cards Selector */}
        <View className="mb-5">
          <Text className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Timetable Allotted Classes ({activeAllottedClasses.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 10 }}>
              {activeAllottedClasses.map((ac, idx) => {
                const isSelected = selectedClassIndex === idx;
                return (
                  <Pressable
                    key={ac.classId + idx}
                    onPress={() => setSelectedClassIndex(idx)}
                    className={`p-3.5 rounded-2xl border w-56 ${isSelected ? 'bg-[#2a1b4e] border-[#ddb7ff]' : 'bg-[#1c1233]/40 border-white/10'}`}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-white font-extrabold text-sm">{ac.className}</Text>
                      <View className="bg-[#00f1a1]/20 border border-[#00f1a1]/40 px-2 py-0.5 rounded-md">
                        <Text className="text-[#00f1a1] text-[9px] font-bold">Allotted</Text>
                      </View>
                    </View>
                    <Text className="text-[#ddb7ff] text-[11px] font-bold mt-0.5">{ac.periodLabel}</Text>
                    <Text className="text-white/40 text-[10px] mt-0.5">{ac.subjectName}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Allotment Authorization Banner */}
        <View className="bg-[#2a1b4e]/40 border border-[#ddb7ff]/20 p-3.5 rounded-2xl mb-5 flex-row items-center">
          <ShieldCheck size={18} color="#00f1a1" style={{ marginRight: 10 }} />
          <View className="flex-1">
            <Text className="text-[#00f1a1] text-xs font-bold">Timetable Attendance Authorization Active</Text>
            <Text className="text-white/70 text-[10.5px] mt-0.5">
              Authorized via Timetable allotment for {activeClassObj.periodLabel}.
            </Text>
          </View>
        </View>

        {/* Progress Card & Actions */}
        <View className="bg-[#1c1233]/40 border border-[#ddb7ff]/15 rounded-2xl p-4 mb-5 shadow-lg">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white font-bold text-sm">Attendance Progress</Text>
            <Text className="text-[#ddb7ff] font-extrabold text-sm">{presentCount} / {totalCount} Present</Text>
          </View>
          <View className="h-2.5 bg-[#130d22] rounded-full overflow-hidden mb-3">
            <View className="h-full bg-[#00f1a1] rounded-full" style={{ width: `${progressPct}%` }} />
          </View>

          <View className="flex-row justify-between items-center">
            <Pressable
              onPress={handleMarkAllPresent}
              className="bg-[#2a1b4e] border border-[#ddb7ff]/30 py-2 px-4 rounded-xl flex-row items-center"
            >
              <CheckCircle2 size={13} color="#ddb7ff" style={{ marginRight: 5 }} />
              <Text className="text-[#ddb7ff] font-bold text-xs">Mark All Present</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowSubmitConfirmModal(true)}
              className="bg-[#00f1a1] py-2 px-5 rounded-xl flex-row items-center shadow-[0_0_12px_rgba(0,241,161,0.3)]"
            >
              <Check size={13} color="#101415" style={{ marginRight: 5 }} />
              <Text className="text-[#101415] font-extrabold text-xs">Submit Attendance</Text>
            </Pressable>
          </View>
        </View>

        {/* Search Student */}
        <View className="flex-row items-center bg-[#251845]/40 border border-[#ddb7ff]/15 rounded-2xl px-4 py-2.5 mb-5 shadow-md">
          <Search size={16} color="rgba(255,255,255,0.4)" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search student name or roll no..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="text-white font-medium text-xs flex-1 p-0"
          />
        </View>

        {/* Students Allotted List */}
        <Text className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">
          {activeClassObj.className} Student Roster ({currentStudentsList.length})
        </Text>

        {currentStudentsList.map(st => {
          const currentStatus = studentStatusMap[st.id] || 'P';
          return (
            <View key={st.id} className="bg-[#1c1233]/40 border border-white/10 p-3.5 rounded-2xl mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2">
                <Image source={{ uri: st.avatar }} className="w-10 h-10 rounded-full mr-3 border border-[#ddb7ff]/30" />
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm">{st.name}</Text>
                  <Text className="text-white/40 text-[10.5px]">Roll: {st.rollNo}</Text>
                </View>
              </View>

              {/* Attendance Status Option Buttons (P, A, L, HD) */}
              <View className="flex-row" style={{ gap: 6 }}>
                {(['P', 'A', 'L', 'HD'] as const).map(stKey => {
                  const isSel = currentStatus === stKey;
                  const getBg = () => {
                    if (!isSel) return 'bg-white/5 border-white/10';
                    if (stKey === 'P') return 'bg-[#00f1a1] border-[#00f1a1]';
                    if (stKey === 'A') return 'bg-rose-500 border-rose-500';
                    if (stKey === 'L') return 'bg-amber-500 border-amber-500';
                    return 'bg-sky-500 border-sky-500';
                  };

                  return (
                    <Pressable
                      key={stKey}
                      onPress={() => handleStatusChange(st.id, stKey)}
                      className={`w-8 h-8 rounded-xl items-center justify-center border ${getBg()}`}
                    >
                      <Text className={`text-xs font-extrabold ${isSel && stKey === 'P' ? 'text-[#101415]' : isSel ? 'text-white' : 'text-white/60'}`}>
                        {stKey}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CONFIRM SUBMIT MODAL */}
      <Modal visible={showSubmitConfirmModal} transparent animationType="fade" onRequestClose={() => setShowSubmitConfirmModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-[#00f1a1]/40 rounded-3xl w-full max-w-sm p-6 items-center shadow-[0_0_30px_rgba(0,241,161,0.3)]">
            <View className="w-14 h-14 rounded-full bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center mb-4">
              <CheckCircle2 size={28} color="#00f1a1" />
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">Submit Attendance?</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">
              Submit attendance for {activeClassObj.className} ({activeClassObj.sessionLabel}) with {presentCount} Present & {totalCount - presentCount} Absent/Leave.
            </Text>

            <View className="flex-row w-full" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowSubmitConfirmModal(false)} className="flex-1 py-3.5 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmSubmitAttendance} className="flex-1 py-3.5 rounded-xl bg-[#00f1a1] items-center shadow-[0_0_12px_rgba(0,241,161,0.4)]">
                <Text className="text-[#101415] font-extrabold text-xs">Confirm & Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUSTOM TOAST MODAL */}
      <Modal visible={toastData.visible} transparent animationType="fade" onRequestClose={() => setToastData(prev => ({ ...prev, visible: false }))}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-[#00f1a1]/40 rounded-3xl w-full max-w-sm p-6 items-center shadow-[0_0_30px_rgba(0,241,161,0.3)]">
            <View className={`w-14 h-14 rounded-full items-center justify-center mb-4 border ${toastData.type === 'warning' ? 'bg-amber-500/20 border-amber-500/40' : 'bg-[#00f1a1]/20 border-[#00f1a1]/40'}`}>
              {toastData.type === 'warning' ? (
                <AlertCircle size={28} color="#f59e0b" />
              ) : (
                <CheckCircle2 size={28} color="#00f1a1" />
              )}
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
    backgroundColor: '#0b0516',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
});

export default AttendanceMarkingScreen;
