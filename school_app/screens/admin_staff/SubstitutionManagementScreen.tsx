import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, Calendar, Clock, UserPlus, CheckCircle2, 
  AlertCircle, X, ShieldCheck, UserX, ArrowRight, Search, RefreshCw
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

export interface AbsentTeacherItem {
  id: string;
  name: string;
  subject: string;
  absentDate: string;
  unassignedPeriod: string;
  targetClass: string;
  timeSlot: string;
}

export interface AvailableTeacherItem {
  id: string;
  name: string;
  subject: string;
  freeStatus: string;
}

const MOCK_ABSENT_TEACHERS: AbsentTeacherItem[] = [
  { id: 'ab_1', name: 'Dr. Meenakshi Sundaram', subject: 'Chemistry', absentDate: 'Today (2026-08-04)', unassignedPeriod: 'Period 3', targetClass: 'Class 10A', timeSlot: '10:00 AM - 10:45 AM' },
  { id: 'ab_2', name: 'Mr. David Miller', subject: 'English', absentDate: 'Today (2026-08-04)', unassignedPeriod: 'Period 4', targetClass: 'Class 6B', timeSlot: '11:30 AM - 12:15 PM' }
];

const MOCK_FREE_TEACHERS: AvailableTeacherItem[] = [
  { id: 'ft_1', name: 'Mrs. Anita Sharma', subject: 'Mathematics', freeStatus: 'Free during Period 3 & 4' },
  { id: 'ft_2', name: 'Mr. Rajesh Kumar', subject: 'Physics', freeStatus: 'Free during Period 3' },
  { id: 'ft_3', name: 'Mrs. Sunita Rao', subject: 'Social Studies', freeStatus: 'Free during Period 4' }
];

export const SubstitutionManagementScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();
  const isSuperAdmin = user?.role === 'super_admin';
  const [absentTeachers, setAbsentTeachers] = useState<AbsentTeacherItem[]>(MOCK_ABSENT_TEACHERS);
  const [availableTeachers] = useState<AvailableTeacherItem[]>(MOCK_FREE_TEACHERS);

  useEffect(() => {
    const fetchSubstitutes = async () => {
      try {
        const res = await api.getSubstitutesSchedule();
        if (res && Array.isArray(res.absentTeachers) && res.absentTeachers.length > 0) {
          setAbsentTeachers(res.absentTeachers);
        }
      } catch (err) {
        console.log('Error fetching substitutes:', err);
      }
    };
    fetchSubstitutes();
  }, []);

  const [activeSubstitutions, setActiveSubstitutions] = useState<Array<{ id: string; originalTeacher: string; subTeacher: string; targetClass: string; period: string }>>([
    { id: 'sub_1', originalTeacher: 'Mr. Vikramaditya Singh', subTeacher: 'Mrs. Priya Nambiar', targetClass: 'Class 8A', period: 'Period 2 (09:15 AM)' }
  ]);

  // Modal States
  const [selectedUnassigned, setSelectedUnassigned] = useState<AbsentTeacherItem | null>(null);
  const [selectedSubTeacherId, setSelectedSubTeacherId] = useState('ft_1');

  // Custom Toast State
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'warning' }>({
    visible: false, title: '', message: '', type: 'success'
  });

  const showToast = (title: string, message: string, type: 'success' | 'warning' = 'success') => {
    setToastData({ visible: true, title, message, type });
  };

  const handleOpenAssignModal = (ab: AbsentTeacherItem) => {
    setSelectedUnassigned(ab);
    setSelectedSubTeacherId('ft_1');
  };

  const handleConfirmSubstitute = () => {
    if (!selectedUnassigned) return;
    const subObj = MOCK_FREE_TEACHERS.find(f => f.id === selectedSubTeacherId) || MOCK_FREE_TEACHERS[0];

    const newSub = {
      id: `sub_${Date.now()}`,
      originalTeacher: selectedUnassigned.name,
      subTeacher: subObj.name,
      targetClass: selectedUnassigned.targetClass,
      period: `${selectedUnassigned.unassignedPeriod} (${selectedUnassigned.timeSlot})`
    };

    setActiveSubstitutions(prev => [newSub, ...prev]);
    setAbsentTeachers(prev => prev.filter(a => a.id !== selectedUnassigned.id));
    const targetClass = selectedUnassigned.targetClass;
    setSelectedUnassigned(null);

    showToast(
      'Substitute Assigned!',
      `${subObj.name} assigned to cover ${targetClass} (${newSub.period}).`,
      'success'
    );
  };

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';
  const primaryPillClass = isSuperAdmin ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-emerald-500/15 border border-emerald-500/30';

  return (
    <View style={[styles.container, isSuperAdmin && { backgroundColor: '#101415' }]}>
      <LinearGradient
        colors={isSuperAdmin ? ['#1d2022', '#101415'] : ['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Teacher Substitutions Console"
        subtitle="Absenteeism Coverage & Period Allotment"
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <Users size={20} color={primaryColor} />
          </View>
        }
      />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* KPI Cards */}
        <View className="px-5 mb-5 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Absent Faculty</Text>
              <UserX size={14} color="#ff516a" />
            </View>
            <Text className="text-rose-400 text-xl font-extrabold">{absentTeachers.length} On Leave</Text>
            <Text className="text-rose-300 text-[10px] font-semibold mt-0.5">● Today (2026-08-04)</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Active Subs</Text>
              <CheckCircle2 size={14} color={primaryColor} />
            </View>
            <Text className={`${primaryTextClass} text-xl font-extrabold`}>{activeSubstitutions.length} Allotted</Text>
            <Text className={`${primaryTextClass} text-[10px] font-semibold mt-0.5`}>● Period Covered</Text>
          </GlassCard>
        </View>

        {/* Unassigned Period Slots (Absent Teachers) */}
        <View className="px-5 mb-5">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Unassigned Periods Requiring Substitutes ({absentTeachers.length})</Text>

          {absentTeachers.length > 0 ? (
            absentTeachers.map(ab => (
              <GlassCard key={ab.id} intensity="low" className="mb-3 p-4 border-white/10 bg-[#101415]/90">
                <View className="flex-row justify-between items-start pb-3 border-b border-white/10 mb-3">
                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center">
                      <Text className="text-white font-extrabold text-base mr-2">{ab.targetClass}</Text>
                      <View className="bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded-md">
                        <Text className="text-rose-400 text-[9.5px] font-bold">{ab.unassignedPeriod}</Text>
                      </View>
                    </View>
                    <Text className={`${primaryTextClass} text-xs font-bold mt-0.5`}>{ab.timeSlot}</Text>
                    <Text className="text-white/50 text-[11px] mt-0.5">Absent: {ab.name} ({ab.subject})</Text>
                  </View>

                  <Pressable
                    onPress={() => handleOpenAssignModal(ab)}
                    className={`${primaryBtnClass} px-3.5 py-2 rounded-xl flex-row items-center justify-center shadow-lg active:scale-95 flex-shrink-0`}
                    style={{ minWidth: 100 }}
                  >
                    <UserPlus size={13} color="#101415" style={{ marginRight: 4 }} />
                    <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#101415', fontSize: 12, fontWeight: '800', flexShrink: 0 }}>
                      Assign Sub
                    </Text>
                  </Pressable>
                </View>
              </GlassCard>
            ))
          ) : (
            <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/90 items-center justify-center">
              <CheckCircle2 size={24} color={primaryColor} style={{ marginBottom: 6 }} />
              <Text className="text-white font-bold text-xs">All Absent Periods Covered!</Text>
              <Text className="text-white/40 text-[10px] mt-0.5">No unassigned period slots remaining today.</Text>
            </GlassCard>
          )}
        </View>

        {/* Active Substitute Assignments Summary List */}
        <View className="px-5">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Today's Assigned Substitutions ({activeSubstitutions.length})</Text>

          {activeSubstitutions.map(sub => (
            <GlassCard key={sub.id} intensity="low" className="mb-3 p-3.5 border-white/10 bg-[#101415]/90">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-white font-extrabold text-sm mr-2">{sub.targetClass}</Text>
                    <Text className={`${primaryTextClass} text-xs font-bold`}>{sub.period}</Text>
                  </View>
                  <Text className="text-white/60 text-xs mt-1">
                    Substitute: <Text className="text-white font-bold">{sub.subTeacher}</Text> (for {sub.originalTeacher})
                  </Text>
                </View>

                <View className={`px-2.5 py-1 rounded-xl ${primaryBadgeClass}`}>
                  <Text className={`${primaryTextClass} text-[10px] font-bold`}>Active ✓</Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ASSIGN SUBSTITUTE MODAL */}
      <Modal visible={Boolean(selectedUnassigned)} transparent animationType="slide" onRequestClose={() => setSelectedUnassigned(null)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-md p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <View className="flex-row items-center">
                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${primaryBadgeClass}`}>
                  <UserPlus size={16} color={primaryColor} />
                </View>
                <View>
                  <Text className="text-white font-bold text-base">Assign Substitute</Text>
                  <Text className={`${primaryTextClass} text-[11px] font-bold`}>{selectedUnassigned?.targetClass} • {selectedUnassigned?.unassignedPeriod}</Text>
                </View>
              </View>
              <Pressable onPress={() => setSelectedUnassigned(null)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              <Text className="text-white/70 text-xs font-bold mb-2">Available Free Teachers for {selectedUnassigned?.unassignedPeriod} *</Text>

              {MOCK_FREE_TEACHERS.map(ft => {
                const isSel = selectedSubTeacherId === ft.id;
                return (
                  <Pressable
                    key={ft.id}
                    onPress={() => setSelectedSubTeacherId(ft.id)}
                    className={`p-3 rounded-2xl border mb-2.5 flex-row justify-between items-center ${isSel ? (isSuperAdmin ? 'bg-[#f0c110]/20 border-[#f0c110]' : 'bg-[#00f1a1]/20 border-[#00f1a1]') : 'bg-white/5 border-white/10'}`}
                  >
                    <View>
                      <Text className={`text-xs font-extrabold ${isSel ? primaryTextClass : 'text-white'}`}>{ft.name}</Text>
                      <Text className="text-white/40 text-[10px]">{ft.subject} • {ft.freeStatus}</Text>
                    </View>

                    <View className={`px-2 py-0.5 rounded-md ${primaryBadgeClass}`}>
                      <Text className={`${primaryTextClass} text-[9px] font-bold`}>Free Slot</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View className="flex-row border-t border-white/10 pt-3 mt-2" style={{ gap: 10 }}>
              <Pressable onPress={() => setSelectedUnassigned(null)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmSubstitute} className={`flex-1 py-3 rounded-xl ${primaryBtnClass} items-center shadow-lg`}>
                <Text className="text-[#101415] font-extrabold text-xs">Confirm Sub</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUSTOM TOAST MODAL */}
      <Modal visible={toastData.visible} transparent animationType="fade" onRequestClose={() => setToastData(prev => ({ ...prev, visible: false }))}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-sm p-6 items-center ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            <View className={`w-14 h-14 rounded-full items-center justify-center mb-4 border ${toastData.type === 'warning' ? 'bg-amber-500/20 border-amber-500/40' : primaryBadgeClass}`}>
              {toastData.type === 'warning' ? (
                <AlertCircle size={28} color="#f59e0b" />
              ) : (
                <CheckCircle2 size={28} color={primaryColor} />
              )}
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">{toastData.title}</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">{toastData.message}</Text>

            <Pressable
              onPress={() => setToastData(prev => ({ ...prev, visible: false }))}
              className={`w-full py-3.5 rounded-xl ${primaryBtnClass} items-center shadow-lg`}
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
  },
});

export default SubstitutionManagementScreen;
