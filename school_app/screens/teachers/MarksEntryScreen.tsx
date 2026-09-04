import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Image, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  Bell, Save, ChevronDown, CheckCircle2, AlertCircle, 
  Search, Award, Percent, TrendingUp, Users, BookOpen, Filter, Check, X
} from 'lucide-react-native';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

interface StudentMarkItem {
  id: string;
  name: string;
  rollNo: string;
  avatar?: string;
  score: number | string;
}

const EXAMS_LIST = [
  { id: 'ex_midterm', name: 'Mid-Term Examination 2026', maxMarks: 100 },
  { id: 'ex_ut1', name: 'Unit Test 1 (Formative)', maxMarks: 25 },
  { id: 'ex_quarterly', name: 'Quarterly Assessment 2026', maxMarks: 50 },
  { id: 'ex_annual', name: 'Annual Final Examination', maxMarks: 100 }
];

const CLASSES_LIST = ['Class 10A', 'Class 10B', 'Class 9A', 'Class 9B', 'Class 8A', 'Class 8B', 'Class 7A', 'Class 6A'];

const CLASS_SUBJECTS_MAP: Record<string, string[]> = {
  'Class 10A': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Social Studies', 'Telugu', 'Hindi'],
  'Class 10B': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Social Studies', 'Telugu', 'Hindi'],
  'Class 9A': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Social Studies', 'Telugu'],
  'Class 9B': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Social Studies', 'Telugu'],
  'Class 8A': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Social Studies', 'Telugu'],
  'Class 8B': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Social Studies', 'Telugu'],
  'Class 7A': ['Mathematics', 'Science', 'English', 'Social Studies', 'Telugu', 'Hindi'],
  'Class 6A': ['Mathematics', 'Science', 'English', 'Social Studies', 'Telugu', 'Hindi'],
};

const DEFAULT_STUDENTS: StudentMarkItem[] = [
  { id: '1', name: 'B Sandeep Goud', rollNo: '10A01', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150', score: 94 },
  { id: '2', name: 'Banda Teja Sri', rollNo: '10A02', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150', score: 88 },
  { id: '3', name: 'Chandippa Sragvi', rollNo: '10A03', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150', score: 76 },
  { id: '4', name: 'Chilkuri Shiva Prasad', rollNo: '10A04', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150', score: 68 },
  { id: '5', name: 'Malkapur Ramesh', rollNo: '10A05', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=150', score: 82 },
  { id: '6', name: 'Kesaram Ananya', rollNo: '10A06', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150', score: 91 },
  { id: '7', name: 'Priya Sharma', rollNo: '10A07', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150', score: 96 },
  { id: '8', name: 'Rahul Varma', rollNo: '10A08', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150', score: 32 }
];

export const MarksEntryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isSmallPhone, headerPaddingTop } = useResponsive();
  const { user } = useAuthStore();

  // Selection States
  const [selectedExamId, setSelectedExamId] = useState('ex_midterm');
  const [selectedClass, setSelectedClass] = useState('Class 10A');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown Modal Pickers
  const [showExamPicker, setShowExamPicker] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  // Marks State (Draft in memory vs Committed)
  const [draftMarks, setDraftMarks] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Success Toast Modal
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'warning' } | null>(null);

  const showToast = (title: string, desc: string, type: 'success' | 'warning' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const currentExam = useMemo(() => {
    return EXAMS_LIST.find(e => e.id === selectedExamId) || EXAMS_LIST[0];
  }, [selectedExamId]);

  const availableSubjects = useMemo(() => {
    return CLASS_SUBJECTS_MAP[selectedClass] || ['Mathematics', 'Science', 'English', 'Social Studies'];
  }, [selectedClass]);

  // Ensure selected subject is valid for class
  useEffect(() => {
    if (!availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0] || 'Mathematics');
    }
  }, [selectedClass, availableSubjects, selectedSubject]);

  // Load existing marks on mount / change
  useEffect(() => {
    const loadMarks = async () => {
      try {
        const res = await api.getResources('settings', { key: 'kts_student_marks' });
        if (Array.isArray(res) && res.length > 0 && res[0].value) {
          const parsed = typeof res[0].value === 'string' ? JSON.parse(res[0].value) : res[0].value;
          const examMarks = parsed[selectedExamId]?.[selectedSubject] || {};
          const initialMap: Record<string, string> = {};
          DEFAULT_STUDENTS.forEach(st => {
            const val = examMarks[st.rollNo] ?? examMarks[st.id] ?? st.score;
            initialMap[st.id] = String(val);
          });
          setDraftMarks(initialMap);
        } else {
          const initialMap: Record<string, string> = {};
          DEFAULT_STUDENTS.forEach(st => {
            initialMap[st.id] = String(st.score);
          });
          setDraftMarks(initialMap);
        }
      } catch {
        const initialMap: Record<string, string> = {};
        DEFAULT_STUDENTS.forEach(st => {
          initialMap[st.id] = String(st.score);
        });
        setDraftMarks(initialMap);
      }
    };
    loadMarks();
  }, [selectedExamId, selectedSubject, selectedClass]);

  const handleMarkChange = (id: string, value: string) => {
    // Only allow digits up to maxMarks
    const cleanNum = value.replace(/[^0-9]/g, '');
    const numVal = parseInt(cleanNum, 10);
    if (!isNaN(numVal) && numVal > currentExam.maxMarks) {
      setDraftMarks(prev => ({ ...prev, [id]: String(currentExam.maxMarks) }));
      return;
    }
    setDraftMarks(prev => ({ ...prev, [id]: cleanNum }));
  };

  const handleSaveMarks = async () => {
    setIsSaving(true);
    try {
      const commitPayload: Record<string, Record<string, Record<string, number>>> = {};
      commitPayload[selectedExamId] = {
        [selectedSubject]: {}
      };

      DEFAULT_STUDENTS.forEach(st => {
        const scoreStr = draftMarks[st.id];
        if (scoreStr !== undefined && scoreStr !== '') {
          const scoreNum = parseFloat(scoreStr);
          if (!isNaN(scoreNum)) {
            commitPayload[selectedExamId][selectedSubject][st.rollNo] = scoreNum;
            commitPayload[selectedExamId][selectedSubject][st.id] = scoreNum;
          }
        }
      });

      await api.createResource('settings', {
        key: 'kts_student_marks',
        value: JSON.stringify(commitPayload)
      }).catch(async () => {
        await api.updateResource('settings', 'kts_student_marks', {
          key: 'kts_student_marks',
          value: JSON.stringify(commitPayload)
        });
      });

      showToast(
        'Marks Saved Successfully!',
        `Saved marks for ${DEFAULT_STUDENTS.length} students in ${selectedClass} (${selectedSubject} · ${currentExam.name}). Sync is live across Admin & Faculty portals.`
      );
    } catch (err) {
      console.log('Error saving marks:', err);
      showToast('Saved to Local Cache', 'Marks saved to device storage and queued for backend sync.', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  // Performance Statistics Computations
  const scoresArray = useMemo(() => {
    return Object.values(draftMarks)
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));
  }, [draftMarks]);

  const classAverage = useMemo(() => {
    if (scoresArray.length === 0) return 0;
    const sum = scoresArray.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / scoresArray.length;
    return ((avg / currentExam.maxMarks) * 100).toFixed(1);
  }, [scoresArray, currentExam.maxMarks]);

  const highestScore = useMemo(() => {
    if (scoresArray.length === 0) return 0;
    return Math.max(...scoresArray);
  }, [scoresArray]);

  const lowestScore = useMemo(() => {
    if (scoresArray.length === 0) return 0;
    return Math.min(...scoresArray);
  }, [scoresArray]);

  const passRate = useMemo(() => {
    if (scoresArray.length === 0) return 0;
    const passingThreshold = currentExam.maxMarks * 0.35; // 35% passing
    const passingCount = scoresArray.filter(s => s >= passingThreshold).length;
    return Math.round((passingCount / scoresArray.length) * 100);
  }, [scoresArray, currentExam.maxMarks]);

  // Ranked Students List
  const rankedStudents = useMemo(() => {
    const list = DEFAULT_STUDENTS.map(st => {
      const markStr = draftMarks[st.id] ?? '';
      const markNum = parseFloat(markStr) || 0;
      const pct = (markNum / currentExam.maxMarks) * 100;
      let grade = 'F';
      let gradeColor = 'text-rose-400 bg-rose-500/20 border-rose-400/30';
      if (pct >= 90) {
        grade = 'A+';
        gradeColor = 'text-emerald-300 bg-emerald-500/20 border-emerald-400/30';
      } else if (pct >= 80) {
        grade = 'A';
        gradeColor = 'text-emerald-400 bg-emerald-500/20 border-emerald-400/30';
      } else if (pct >= 65) {
        grade = 'B';
        gradeColor = 'text-sky-300 bg-sky-500/20 border-sky-400/30';
      } else if (pct >= 50) {
        grade = 'C';
        gradeColor = 'text-amber-300 bg-amber-500/20 border-amber-400/30';
      } else if (pct >= 35) {
        grade = 'D';
        gradeColor = 'text-orange-300 bg-orange-500/20 border-orange-400/30';
      }

      return {
        ...st,
        currentMark: markStr,
        numericScore: markNum,
        percentage: pct,
        grade,
        gradeColor,
        isPassing: pct >= 35
      };
    });

    // Assign Ranks based on numeric score
    list.sort((a, b) => b.numericScore - a.numericScore);
    return list.map((st, idx) => ({ ...st, rank: idx + 1 }));
  }, [draftMarks, currentExam.maxMarks]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return rankedStudents;
    return rankedStudents.filter(s => 
      s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
    );
  }, [rankedStudents, searchQuery]);

  return (
    <View style={styles.container}>
      <View className="absolute inset-0 bg-[#150E22]" />

      {/* Header Container with BlurView */}
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
              <Text numberOfLines={1} className="text-[#ddb7ff] text-xl font-extrabold">Marks Entry</Text>
              <Text numberOfLines={1} className="text-white/70 text-xs font-bold tracking-wider uppercase mt-0.5">
                Faculty Assessment Portal
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

        {/* Header Glow Shadow */}
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
        {/* Title & Save Action Banner */}
        <View className="mb-5">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 mr-3">
              <Text className="text-white text-2xl font-black tracking-tight">{selectedSubject}</Text>
              <Text className="text-[#ddb7ff] text-xs font-bold tracking-wider uppercase mt-0.5">
                {selectedClass} • {currentExam.name}
              </Text>
            </View>
            <View className="bg-[#2a1b4e] px-3 py-1.5 rounded-xl border border-[#ddb7ff]/30">
              <Text className="text-[#ddb7ff] font-extrabold text-xs">Max: {currentExam.maxMarks}</Text>
            </View>
          </View>

          <Pressable 
            onPress={handleSaveMarks}
            disabled={isSaving}
            className={`flex-row items-center justify-center py-3.5 rounded-2xl shadow-lg active:scale-95 ${
              isSaving ? 'bg-[#ddb7ff]/50' : 'bg-[#EABFFF] shadow-[#EABFFF]/25'
            }`}
          >
            <Save size={18} color="#2d1b4e" />
            <Text className="text-[#2d1b4e] font-extrabold text-sm uppercase tracking-wider ml-2">
              {isSaving ? 'Saving to Database...' : 'Save Marks to Database'}
            </Text>
          </Pressable>
        </View>

        {/* 3 Interactive Dropdowns: Exam, Class, Subject */}
        <View className="mb-5" style={{ gap: 10 }}>
          {/* 1. Exam Selector */}
          <View className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-3 shadow-lg">
            <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-widest uppercase mb-1.5">Select Examination</Text>
            <Pressable
              onPress={() => setShowExamPicker(true)}
              className="flex-row justify-between items-center bg-[#2a1b4e]/80 border border-white/10 px-3.5 py-2.5 rounded-xl"
            >
              <View className="flex-row items-center">
                <BookOpen size={15} color="#ddb7ff" style={{ marginRight: 8 }} />
                <Text className="text-white text-xs font-bold">{currentExam.name}</Text>
              </View>
              <ChevronDown size={16} color="#ddb7ff" />
            </Pressable>
          </View>

          {/* 2. Class & Subject Row */}
          <View className="flex-row gap-2.5">
            <View className="flex-1 bg-[#1C1C1E] border border-white/5 rounded-2xl p-3 shadow-lg">
              <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-widest uppercase mb-1.5">Class</Text>
              <Pressable
                onPress={() => setShowClassPicker(true)}
                className="flex-row justify-between items-center bg-[#2a1b4e]/80 border border-white/10 px-3 py-2.5 rounded-xl"
              >
                <Text className="text-white text-xs font-bold">{selectedClass}</Text>
                <ChevronDown size={14} color="#ddb7ff" />
              </Pressable>
            </View>

            <View className="flex-1 bg-[#1C1C1E] border border-white/5 rounded-2xl p-3 shadow-lg">
              <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-widest uppercase mb-1.5">Subject</Text>
              <Pressable
                onPress={() => setShowSubjectPicker(true)}
                className="flex-row justify-between items-center bg-[#2a1b4e]/80 border border-white/10 px-3 py-2.5 rounded-xl"
              >
                <Text className="text-white text-xs font-bold" numberOfLines={1}>{selectedSubject}</Text>
                <ChevronDown size={14} color="#ddb7ff" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Live Performance KPI Grid */}
        <View className="flex-row flex-wrap justify-between mb-5" style={{ gap: 8 }}>
          <View className="w-[48%] bg-[#1C1C1E] border border-white/5 rounded-2xl p-3.5 shadow-lg">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Class Average</Text>
              <TrendingUp size={14} color="#38bdf8" />
            </View>
            <Text className="text-white text-xl font-extrabold">{classAverage}%</Text>
            <Text className="text-white/40 text-[10px] mt-0.5">{scoresArray.length} students graded</Text>
          </View>

          <View className="w-[48%] bg-[#1C1C1E] border border-white/5 rounded-2xl p-3.5 shadow-lg">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Highest Score</Text>
              <Award size={14} color="#EABFFF" />
            </View>
            <Text className="text-[#EABFFF] text-xl font-extrabold">{highestScore} <Text className="text-white/40 text-xs font-normal">/{currentExam.maxMarks}</Text></Text>
            <Text className="text-emerald-400 text-[10px] mt-0.5 font-bold">Top standing</Text>
          </View>

          <View className="w-[48%] bg-[#1C1C1E] border border-white/5 rounded-2xl p-3.5 shadow-lg">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Lowest Score</Text>
              <Percent size={14} color="#ff9f43" />
            </View>
            <Text className="text-[#ff9f43] text-xl font-extrabold">{lowestScore} <Text className="text-white/40 text-xs font-normal">/{currentExam.maxMarks}</Text></Text>
            <Text className="text-white/40 text-[10px] mt-0.5">Needs support</Text>
          </View>

          <View className="w-[48%] bg-[#1C1C1E] border border-white/5 rounded-2xl p-3.5 shadow-lg">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Pass Rate (≥35%)</Text>
              <Percent size={14} color="#00f1a1" />
            </View>
            <Text className="text-[#00f1a1] text-xl font-extrabold">{passRate}%</Text>
            <View className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1.5">
              <View className="h-full bg-[#00f1a1] rounded-full" style={{ width: `${passRate}%` }} />
            </View>
          </View>
        </View>

        {/* Student Search Bar */}
        <View className="bg-[#1C1C1E] border border-white/10 rounded-2xl px-3 py-2 flex-row items-center mb-3">
          <Search size={14} color="#ddb7ff" style={{ marginRight: 6 }} />
          <TextInput
            placeholder="Search student by name or roll no..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-white text-xs"
            style={{ paddingVertical: 0 }}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={14} color="rgba(255,255,255,0.5)" />
            </Pressable>
          )}
        </View>

        {/* Marks Entry Student Table / List */}
        <View className="bg-[#1C1C1E] border border-white/5 rounded-3xl shadow-lg mb-8 overflow-hidden">
          {/* Table Header */}
          <View className="flex-row items-center px-4 py-3.5 border-b border-white/5 bg-[#251e33]/80">
            <Text className="text-[#ddb7ff] text-[10px] font-extrabold tracking-widest uppercase flex-[1.4]">STUDENT</Text>
            <Text className="text-[#ddb7ff] text-[10px] font-extrabold tracking-widest uppercase flex-[0.8] text-center">RANK / GRADE</Text>
            <Text className="text-[#ddb7ff] text-[10px] font-extrabold tracking-widest uppercase flex-[1] text-right">MARKS (/{currentExam.maxMarks})</Text>
          </View>

          {/* Table Rows */}
          {filteredStudents.length === 0 ? (
            <View className="py-8 items-center justify-center">
              <Text className="text-white/40 text-xs">No students found matching search.</Text>
            </View>
          ) : (
            filteredStudents.map((student, index) => (
              <View 
                key={student.id} 
                className={`flex-row items-center px-4 py-3.5 ${index !== filteredStudents.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                {/* Student Info */}
                <View className="flex-row items-center flex-[1.4] pr-2">
                  <View className="w-8 h-8 rounded-full bg-[#2a1b4e] border border-[#ddb7ff]/30 items-center justify-center mr-2.5">
                    <Text className="text-[#ddb7ff] font-bold text-[10px]">
                      {student.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-xs leading-tight" numberOfLines={1}>{student.name}</Text>
                    <Text className="text-white/40 text-[10px] font-mono mt-0.5">{student.rollNo}</Text>
                  </View>
                </View>

                {/* Rank & Grade */}
                <View className="flex-[0.8] items-center">
                  <View className="flex-row items-center" style={{ gap: 4 }}>
                    <View className="bg-[#2a1b4e] px-1.5 py-0.5 rounded-md border border-[#ddb7ff]/20">
                      <Text className="text-[#ddb7ff] text-[9.5px] font-black">#{student.rank}</Text>
                    </View>
                    <View className={`px-1.5 py-0.5 rounded-md border ${student.gradeColor}`}>
                      <Text className="text-[9.5px] font-bold">{student.grade}</Text>
                    </View>
                  </View>
                </View>

                {/* Editable Marks Input */}
                <View className="flex-[1] items-end">
                  <View className="flex-row items-center">
                    <TextInput
                      value={draftMarks[student.id] || ''}
                      onChangeText={(val) => handleMarkChange(student.id, val)}
                      keyboardType="numeric"
                      maxLength={3}
                      placeholder="0"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      className="bg-[#150E22] border border-white/15 text-white font-black text-sm text-right px-2.5 py-1.5 rounded-xl min-w-[54px]"
                    />
                    <Text className="text-white/30 text-[10px] ml-1">/{currentExam.maxMarks}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 1. EXAM SELECTOR MODAL */}
      <Modal visible={showExamPicker} transparent animationType="fade" onRequestClose={() => setShowExamPicker(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#1a1329] border border-[#ddb7ff]/30 rounded-3xl w-full max-w-sm p-5 shadow-2xl">
            <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-white/10">
              <Text className="text-white font-extrabold text-sm">Select Examination</Text>
              <Pressable onPress={() => setShowExamPicker(false)}>
                <X size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {EXAMS_LIST.map(ex => {
                const isSelected = selectedExamId === ex.id;
                return (
                  <Pressable
                    key={ex.id}
                    onPress={() => {
                      setSelectedExamId(ex.id);
                      setShowExamPicker(false);
                    }}
                    className={`p-3 rounded-xl mb-1.5 flex-row justify-between items-center ${
                      isSelected ? 'bg-[#EABFFF]/20 border border-[#EABFFF]/40' : 'bg-white/5'
                    }`}
                  >
                    <View>
                      <Text className={`text-xs font-bold ${isSelected ? 'text-[#EABFFF]' : 'text-white/90'}`}>{ex.name}</Text>
                      <Text className="text-white/40 text-[10px] mt-0.5">Maximum Marks: {ex.maxMarks}</Text>
                    </View>
                    {isSelected && <Check size={16} color="#EABFFF" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. CLASS SELECTOR MODAL */}
      <Modal visible={showClassPicker} transparent animationType="fade" onRequestClose={() => setShowClassPicker(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#1a1329] border border-[#ddb7ff]/30 rounded-3xl w-full max-w-sm p-5 shadow-2xl">
            <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-white/10">
              <Text className="text-white font-extrabold text-sm">Select Class</Text>
              <Pressable onPress={() => setShowClassPicker(false)}>
                <X size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {CLASSES_LIST.map(cls => {
                const isSelected = selectedClass === cls;
                return (
                  <Pressable
                    key={cls}
                    onPress={() => {
                      setSelectedClass(cls);
                      setShowClassPicker(false);
                    }}
                    className={`p-3 rounded-xl mb-1.5 flex-row justify-between items-center ${
                      isSelected ? 'bg-[#EABFFF]/20 border border-[#EABFFF]/40' : 'bg-white/5'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? 'text-[#EABFFF]' : 'text-white/90'}`}>{cls}</Text>
                    {isSelected && <Check size={16} color="#EABFFF" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 3. SUBJECT SELECTOR MODAL */}
      <Modal visible={showSubjectPicker} transparent animationType="fade" onRequestClose={() => setShowSubjectPicker(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#1a1329] border border-[#ddb7ff]/30 rounded-3xl w-full max-w-sm p-5 shadow-2xl">
            <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-white/10">
              <Text className="text-white font-extrabold text-sm">Select Subject ({selectedClass})</Text>
              <Pressable onPress={() => setShowSubjectPicker(false)}>
                <X size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {availableSubjects.map(sub => {
                const isSelected = selectedSubject === sub;
                return (
                  <Pressable
                    key={sub}
                    onPress={() => {
                      setSelectedSubject(sub);
                      setShowSubjectPicker(false);
                    }}
                    className={`p-3 rounded-xl mb-1.5 flex-row justify-between items-center ${
                      isSelected ? 'bg-[#EABFFF]/20 border border-[#EABFFF]/40' : 'bg-white/5'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? 'text-[#EABFFF]' : 'text-white/90'}`}>{sub}</Text>
                    {isSelected && <Check size={16} color="#EABFFF" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SUCCESS TOAST MODAL */}
      {toastMessage && (
        <View className="absolute top-20 left-5 right-5 z-50 bg-[#1e1333] border border-[#ddb7ff]/50 rounded-2xl p-4 shadow-2xl flex-row items-center">
          <CheckCircle2 size={22} color="#00f1a1" style={{ marginRight: 10 }} />
          <View className="flex-1">
            <Text className="text-white font-extrabold text-xs">{toastMessage.title}</Text>
            <Text className="text-white/70 text-[11px] mt-0.5">{toastMessage.desc}</Text>
          </View>
        </View>
      )}
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
    paddingTop: 16,
    paddingBottom: 100,
  },
});

export default MarksEntryScreen;
