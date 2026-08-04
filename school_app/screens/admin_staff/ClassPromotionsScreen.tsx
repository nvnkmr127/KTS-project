import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TrendingUp, GraduationCap, ArrowRight, CheckCircle2, 
  AlertCircle, X, Search, UserCheck, RefreshCw, ChevronRight, School, UserX
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';

export interface StudentPromotionItem {
  id: string;
  name: string;
  rollNo: string;
  currentClass: string;
  currentSection: string;
  gender: 'Male' | 'Female';
  action: 'promote' | 'retain' | 'left' | 'alumni';
  targetClass: string;
  targetSection: string;
}

const MOCK_PROMOTION_STUDENTS: StudentPromotionItem[] = [
  { id: 'p1', name: 'B Sandeep Goud', rollNo: '9A01', currentClass: 'Class 9', currentSection: 'Section A', gender: 'Male', action: 'promote', targetClass: 'Class 10', targetSection: 'Section A' },
  { id: 'p2', name: 'Banda Teja Sri', rollNo: '9A02', currentClass: 'Class 9', currentSection: 'Section A', gender: 'Female', action: 'promote', targetClass: 'Class 10', targetSection: 'Section A' },
  { id: 'p3', name: 'Chandippa Sragvi', rollNo: '9A03', currentClass: 'Class 9', currentSection: 'Section A', gender: 'Female', action: 'retain', targetClass: 'Class 9', targetSection: 'Section A' },
  { id: 'p4', name: 'Chilkuri Shiva Prasad', rollNo: '9A04', currentClass: 'Class 9', currentSection: 'Section A', gender: 'Male', action: 'promote', targetClass: 'Class 10', targetSection: 'Section B' },
  { id: 'p5', name: 'D Thanush', rollNo: '9A05', currentClass: 'Class 9', currentSection: 'Section A', gender: 'Male', action: 'left', targetClass: 'Left', targetSection: '-' },
  { id: 'p6', name: 'Priya Sharma', rollNo: '10A01', currentClass: 'Class 10', currentSection: 'Section A', gender: 'Female', action: 'alumni', targetClass: 'Graduated', targetSection: 'Alumni' }
];

export const ClassPromotionsScreen: React.FC<any> = ({ navigation }) => {
  const [sourceAy, setSourceAy] = useState('2025-2026');
  const [targetAy, setTargetAy] = useState('2026-2027');
  const [sourceClass, setSourceClass] = useState('Class 9 — Section A');
  const [students, setStudents] = useState<StudentPromotionItem[]>(MOCK_PROMOTION_STUDENTS);
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation Modal State
  const [showExecuteModal, setShowExecuteModal] = useState(false);

  // Custom Toast State
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'warning' }>({
    visible: false, title: '', message: '', type: 'success'
  });

  const showToast = (title: string, message: string, type: 'success' | 'warning' = 'success') => {
    setToastData({ visible: true, title, message, type });
  };

  const handleSetAllAction = (action: 'promote' | 'retain' | 'alumni') => {
    setStudents(prev => prev.map(s => ({
      ...s,
      action,
      targetClass: action === 'promote' ? 'Class 10' : action === 'retain' ? s.currentClass : action === 'alumni' ? 'Graduated' : 'Left',
      targetSection: action === 'promote' ? 'Section A' : action === 'retain' ? s.currentSection : action === 'alumni' ? 'Alumni' : '-'
    })));
    showToast('Bulk Decision Applied', `All students set to ${action.toUpperCase()}.`, 'success');
  };

  const handleStudentActionChange = (id: string, action: 'promote' | 'retain' | 'left' | 'alumni') => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          action,
          targetClass: action === 'promote' ? 'Class 10' : action === 'retain' ? s.currentClass : action === 'alumni' ? 'Graduated' : 'Left',
          targetSection: action === 'promote' ? 'Section A' : action === 'retain' ? s.currentSection : action === 'alumni' ? 'Alumni' : '-'
        };
      }
      return s;
    }));
  };

  const handleConfirmPromotion = () => {
    setShowExecuteModal(false);
    showToast(
      'Promotions Processed!',
      `Successfully migrated students from ${sourceAy} (${sourceClass}) to ${targetAy}.`,
      'success'
    );
  };

  const promoteCount = students.filter(s => s.action === 'promote').length;
  const retainCount = students.filter(s => s.action === 'retain').length;
  const alumniCount = students.filter(s => s.action === 'alumni').length;
  const leftCount = students.filter(s => s.action === 'left').length;

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Class Promotions Engine"
        subtitle="Batch Migration & Academic Progression"
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center">
            <TrendingUp size={20} color="#00f1a1" />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Source & Target Academic Year Transition Banner */}
        <View className="px-5 mb-5">
          <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/90">
            <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Academic Year Migration Config</Text>
            
            <View className="flex-row items-center justify-between mb-3 bg-black/40 p-3 rounded-2xl border border-white/5">
              <View className="flex-1">
                <Text className="text-white/50 text-[10px] uppercase font-bold">Source Year</Text>
                <Text className="text-[#00f1a1] text-xs font-extrabold mt-0.5">{sourceAy}</Text>
              </View>

              <View className="w-8 h-8 rounded-full bg-[#00f1a1]/15 border border-[#00f1a1]/40 items-center justify-center mx-2">
                <ArrowRight size={16} color="#00f1a1" />
              </View>

              <View className="flex-1 items-end">
                <Text className="text-white/50 text-[10px] uppercase font-bold">Target Next Year</Text>
                <Text className="text-sky-400 text-xs font-extrabold mt-0.5">{targetAy}</Text>
              </View>
            </View>

            <View className="bg-white/5 p-3 rounded-2xl border border-white/10 flex-row justify-between items-center">
              <View>
                <Text className="text-white text-xs font-bold">Source Class Section</Text>
                <Text className="text-white/50 text-[10px]">{sourceClass}</Text>
              </View>
              <View className="bg-[#00f1a1]/20 border border-[#00f1a1]/40 px-2.5 py-1 rounded-xl">
                <Text className="text-[#00f1a1] text-[10px] font-bold">{students.length} Students</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* 4 Summary Stats Cards */}
        <View className="px-5 mb-5 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">To Promote</Text>
              <TrendingUp size={14} color="#00f1a1" />
            </View>
            <Text className="text-[#00f1a1] text-xl font-extrabold">{promoteCount} Students</Text>
            <Text className="text-emerald-400 text-[10px] font-semibold mt-0.5">● Next Class</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">To Retain</Text>
              <RefreshCw size={14} color="#f59e0b" />
            </View>
            <Text className="text-amber-400 text-xl font-extrabold">{retainCount} Students</Text>
            <Text className="text-amber-300 text-[10px] font-semibold mt-0.5">● Repeat Same Class</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">To Alumni</Text>
              <GraduationCap size={14} color="#c084fc" />
            </View>
            <Text className="text-purple-300 text-xl font-extrabold">{alumniCount} Graduates</Text>
            <Text className="text-purple-400 text-[10px] font-semibold mt-0.5">● Class 10 Graduates</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Left / TC</Text>
              <UserX size={14} color="#ff516a" />
            </View>
            <Text className="text-rose-400 text-xl font-extrabold">{leftCount} Left</Text>
            <Text className="text-rose-300 text-[10px] font-semibold mt-0.5">● Transferred</Text>
          </GlassCard>
        </View>

        {/* Bulk Action Controls */}
        <View className="px-5 mb-5">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Bulk Quick Decision Shortcuts</Text>
          <View className="flex-row" style={{ gap: 8 }}>
            <Pressable
              onPress={() => handleSetAllAction('promote')}
              className="flex-1 bg-emerald-500/15 border border-emerald-500/40 py-2.5 rounded-xl items-center"
            >
              <Text className="text-[#00f1a1] text-xs font-bold">Promote All</Text>
            </Pressable>

            <Pressable
              onPress={() => handleSetAllAction('retain')}
              className="flex-1 bg-amber-500/15 border border-amber-500/40 py-2.5 rounded-xl items-center"
            >
              <Text className="text-amber-400 text-xs font-bold">Retain All</Text>
            </Pressable>

            <Pressable
              onPress={() => handleSetAllAction('alumni')}
              className="flex-1 bg-purple-500/15 border border-purple-500/40 py-2.5 rounded-xl items-center"
            >
              <Text className="text-purple-300 text-xs font-bold">Alumni All</Text>
            </Pressable>
          </View>
        </View>

        {/* Search Input */}
        <View className="px-5 mb-4">
          <View className="bg-[#101415] border border-white/15 rounded-2xl flex-row items-center px-3.5 py-2.5 shadow-md">
            <Search size={16} color="#00f1a1" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search student by name or roll number..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white text-xs"
              style={{ paddingVertical: 0 }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={15} color="rgba(255, 255, 255, 0.5)" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Student Roster Promotion Decision List */}
        <View className="px-5 mb-5">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Individual Student Promotion Decisions</Text>

          {filteredStudents.map(st => (
            <GlassCard key={st.id} intensity="low" className="mb-3 p-4 border-white/10 bg-[#101415]/90">
              <View className="flex-row justify-between items-center mb-3 pb-2.5 border-b border-white/10">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-9 h-9 rounded-full bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center mr-3">
                    <Text className="text-[#00f1a1] text-xs font-extrabold">{st.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-xs">{st.name}</Text>
                    <Text className="text-white/50 text-[10px]">Roll: {st.rollNo} • Current: {st.currentClass} {st.currentSection}</Text>
                  </View>
                </View>

                <View className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl">
                  <Text className="text-sky-400 text-[10px] font-bold">Target: {st.targetClass}</Text>
                </View>
              </View>

              {/* Action Decision Selector Pills */}
              <View className="flex-row justify-between" style={{ gap: 6 }}>
                {(['promote', 'retain', 'left', 'alumni'] as const).map(act => {
                  const isSel = st.action === act;
                  const getColors = () => {
                    if (!isSel) return 'bg-white/5 border-white/10 text-white/50';
                    if (act === 'promote') return 'bg-[#00f1a1] border-[#00f1a1] text-[#101415]';
                    if (act === 'retain') return 'bg-amber-500 border-amber-500 text-[#101415]';
                    if (act === 'alumni') return 'bg-purple-500 border-purple-500 text-white';
                    return 'bg-rose-500 border-rose-500 text-white';
                  };

                  return (
                    <Pressable
                      key={act}
                      onPress={() => handleStudentActionChange(st.id, act)}
                      className={`flex-1 py-1.5 rounded-xl border items-center justify-center ${getColors()}`}
                    >
                      <Text className={`text-[10px] font-extrabold capitalize ${isSel && (act === 'promote' || act === 'retain') ? 'text-[#101415]' : isSel ? 'text-white' : 'text-white/60'}`}>
                        {act}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Execute Promotion Submit Button */}
        <View className="px-5 mb-5">
          <Pressable
            onPress={() => setShowExecuteModal(true)}
            className="w-full py-4 rounded-2xl bg-[#00f1a1] items-center justify-center shadow-[0_0_20px_rgba(0,241,161,0.4)] flex-row"
          >
            <TrendingUp size={18} color="#101415" style={{ marginRight: 8 }} />
            <Text className="text-[#101415] font-extrabold text-sm">Execute Promotions Process ({students.length})</Text>
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CONFIRM EXECUTE PROMOTIONS MODAL */}
      <Modal visible={showExecuteModal} transparent animationType="fade" onRequestClose={() => setShowExecuteModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-[#00f1a1]/40 rounded-3xl w-full max-w-sm p-6 items-center shadow-[0_0_30px_rgba(0,241,161,0.3)]">
            <View className="w-14 h-14 rounded-full bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center mb-4">
              <TrendingUp size={28} color="#00f1a1" />
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">Execute Class Promotions?</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">
              Are you sure you want to promote {promoteCount} students, retain {retainCount}, and transfer {alumniCount} to Alumni? This action will update student active class records for {targetAy}.
            </Text>

            <View className="flex-row w-full" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowExecuteModal(false)} className="flex-1 py-3.5 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmPromotion} className="flex-1 py-3.5 rounded-xl bg-[#00f1a1] items-center shadow-[0_0_12px_rgba(0,241,161,0.4)]">
                <Text className="text-[#101415] font-extrabold text-xs">Execute Migration</Text>
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
    backgroundColor: '#0d2a24',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
});

export default ClassPromotionsScreen;
