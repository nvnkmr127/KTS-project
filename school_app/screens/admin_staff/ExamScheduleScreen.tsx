import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Award, Calendar, Clock, Plus, Trash2, Pencil,
  CheckCircle2, AlertCircle, X, BookOpen, ShieldCheck, UserCheck, Search
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

export interface ExamScheduleItem {
  id: string;
  examName: string;
  className: string;
  subject: string;
  date: string;
  timeSlot: string;
  maxMarks: number;
  roomNo: string;
  status: 'Upcoming' | 'Completed' | 'Results Published';
}

const MOCK_EXAM_SCHEDULES: ExamScheduleItem[] = [
  { id: 'ex_1', examName: 'Unit Test 1', className: 'Class 10A', subject: 'Mathematics', date: '2026-06-10', timeSlot: '09:30 AM - 11:00 AM', maxMarks: 25, roomNo: 'Room 12', status: 'Upcoming' },
  { id: 'ex_2', examName: 'Unit Test 1', className: 'Class 10A', subject: 'Physics', date: '2026-06-11', timeSlot: '09:30 AM - 11:00 AM', maxMarks: 25, roomNo: 'Room 12', status: 'Upcoming' },
  { id: 'ex_3', examName: 'Mid-Term Examination 2026', className: 'Class 10A', subject: 'Chemistry', date: '2026-06-25', timeSlot: '09:30 AM - 12:30 PM', maxMarks: 100, roomNo: 'Chemistry Lab', status: 'Upcoming' },
  { id: 'ex_4', examName: 'Quarterly Assessment', className: 'Class 9A', subject: 'English', date: '2026-05-15', timeSlot: '09:30 AM - 12:00 PM', maxMarks: 50, roomNo: 'Room 14', status: 'Results Published' }
];

export const ExamScheduleScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';

  const [examSchedules, setExamSchedules] = useState<ExamScheduleItem[]>(MOCK_EXAM_SCHEDULES);
  const [activeTab, setActiveTab] = useState<'schedules' | 'invigilation' | 'results'>('schedules');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');

  useEffect(() => {
    const fetchExamSchedules = async () => {
      try {
        const res = await api.getResources('exam-schedules');
        if (Array.isArray(res) && res.length > 0) {
          const mapped: ExamScheduleItem[] = res.map((e: any) => ({
            id: String(e.id),
            examName: e.exam_name || e.name || 'Mid-Term Exam',
            className: e.class_name || (e.batch ? e.batch.name : 'Class 10A'),
            subject: e.subject || 'Mathematics',
            date: e.date || '2026-06-10',
            timeSlot: e.time_slot || e.time || '09:30 AM - 11:00 AM',
            maxMarks: Number(e.max_marks || 100),
            roomNo: e.room_no || 'Room 12',
            status: (e.status || 'Upcoming') as any,
          }));
          setExamSchedules(mapped);
        }
      } catch (err) {
        console.log('Error loading exam schedules:', err);
      }
    };
    fetchExamSchedules();
  }, []);

  // Modal States
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamScheduleItem | null>(null);
  const [deletingExam, setDeletingExam] = useState<ExamScheduleItem | null>(null);

  // Form States
  const [formExamName, setFormExamName] = useState('Mid-Term Examination 2026');
  const [formClass, setFormClass] = useState('Class 10A');
  const [formSubject, setFormSubject] = useState('Mathematics');
  const [formDate, setFormDate] = useState('2026-06-15');
  const [formTimeSlot, setFormTimeSlot] = useState('09:30 AM - 12:30 PM');
  const [formMaxMarks, setFormMaxMarks] = useState('100');
  const [formRoom, setFormRoom] = useState('Room 12');

  // Custom Toast State
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'warning' }>({
    visible: false, title: '', message: '', type: 'success'
  });

  const showToast = (title: string, message: string, type: 'success' | 'warning' = 'success') => {
    setToastData({ visible: true, title, message, type });
  };

  const handleOpenAdd = () => {
    setEditingExam(null);
    setFormExamName('Mid-Term Examination 2026');
    setFormClass('Class 10A');
    setFormSubject('Mathematics');
    setFormDate('2026-06-15');
    setFormTimeSlot('09:30 AM - 12:30 PM');
    setFormMaxMarks('100');
    setFormRoom('Room 12');
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (ex: ExamScheduleItem) => {
    setEditingExam(ex);
    setFormExamName(ex.examName);
    setFormClass(ex.className);
    setFormSubject(ex.subject);
    setFormDate(ex.date);
    setFormTimeSlot(ex.timeSlot);
    setFormMaxMarks(String(ex.maxMarks));
    setFormRoom(ex.roomNo);
    setShowAddEditModal(true);
  };

  const handleSaveExamSchedule = async () => {
    if (!formExamName.trim() || !formSubject.trim()) {
      showToast('Missing Fields', 'Please fill in exam title and subject.', 'warning');
      return;
    }

    const marksNum = parseInt(formMaxMarks, 10) || 100;

    if (editingExam) {
      setExamSchedules(prev => prev.map(e => e.id === editingExam.id ? {
        ...e,
        examName: formExamName,
        className: formClass,
        subject: formSubject,
        date: formDate,
        timeSlot: formTimeSlot,
        maxMarks: marksNum,
        roomNo: formRoom
      } : e));

      try {
        await api.updateResource('exam-schedules', editingExam.id, {
          exam_name: formExamName,
          class_name: formClass,
          subject: formSubject,
          date: formDate,
          time_slot: formTimeSlot,
          max_marks: marksNum,
          room_no: formRoom,
        });
      } catch (err) {
        console.log('Error updating exam schedule in DB:', err);
      }
      showToast('Schedule Updated', `${formSubject} exam schedule updated.`, 'success');
    } else {
      const newExam: ExamScheduleItem = {
        id: `ex_${Date.now()}`,
        examName: formExamName,
        className: formClass,
        subject: formSubject,
        date: formDate,
        timeSlot: formTimeSlot,
        maxMarks: marksNum,
        roomNo: formRoom,
        status: 'Upcoming'
      };
      setExamSchedules(prev => [newExam, ...prev]);

      try {
        await api.createResource('exam-schedules', {
          exam_name: formExamName,
          class_name: formClass,
          subject: formSubject,
          date: formDate,
          time_slot: formTimeSlot,
          max_marks: marksNum,
          room_no: formRoom,
          status: 'Upcoming',
        });
      } catch (err) {
        console.log('Error creating exam schedule in DB:', err);
      }
      showToast('Exam Scheduled', `${formSubject} exam added to timetable.`, 'success');
    }

    setShowAddEditModal(false);
  };

  const handleConfirmDeleteExam = () => {
    if (!deletingExam) return;
    const sub = deletingExam.subject;
    setExamSchedules(prev => prev.filter(e => e.id !== deletingExam.id));
    setDeletingExam(null);
    showToast('Exam Removed', `${sub} exam deleted from schedule.`, 'warning');
  };

  const filteredExams = examSchedules.filter(ex => {
    const matchesClass = selectedClassFilter === 'All' || ex.className.includes(selectedClassFilter);
    const matchesSearch = ex.examName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.className.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  return (
    <View style={[styles.container, isSuperAdmin && { backgroundColor: '#101415' }]}>
      <LinearGradient
        colors={isSuperAdmin ? ['#1d2022', '#101415'] : ['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Examinations Console"
        subtitle={isSuperAdmin ? "Super Admin Examinations Terminal" : "Schedules, Invigilation & Marks Management"}
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <Award size={20} color={primaryColor} />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Navigation Tabs (Schedules, Invigilation, Results) */}
        <View className="px-5 mb-4">
          <View className="flex-row bg-[#101415] p-1.5 rounded-2xl border border-white/10" style={{ gap: 6 }}>
            <Pressable
              onPress={() => setActiveTab('schedules')}
              className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'schedules' ? primaryBtnClass : 'bg-transparent'}`}
            >
              <Text className={`text-xs font-extrabold ${activeTab === 'schedules' ? 'text-[#101415]' : 'text-white/60'}`}>
                Exam Schedules
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('invigilation')}
              className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'invigilation' ? primaryBtnClass : 'bg-transparent'}`}
            >
              <Text className={`text-xs font-extrabold ${activeTab === 'invigilation' ? 'text-[#101415]' : 'text-white/60'}`}>
                Invigilation Duties
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('results')}
              className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'results' ? primaryBtnClass : 'bg-transparent'}`}
            >
              <Text className={`text-xs font-extrabold ${activeTab === 'results' ? 'text-[#101415]' : 'text-white/60'}`}>
                Results & Ranks
              </Text>
            </Pressable>
          </View>
        </View>

        {activeTab === 'schedules' && (
          <>
            {/* Search & Add Action Header */}
            <View className="px-5 mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <View className={`flex-1 bg-[#101415] border rounded-2xl flex-row items-center px-3.5 py-2.5 mr-3 shadow-md ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-white/15'}`}>
                  <Search size={16} color={primaryColor} style={{ marginRight: 8 }} />
                  <TextInput
                    placeholder="Search exam name or subject..."
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

                <Pressable
                  onPress={handleOpenAdd}
                  className={`${primaryBtnClass} px-4 py-2.5 rounded-2xl flex-row items-center shadow-lg`}
                >
                  <Plus size={16} color="#101415" style={{ marginRight: 4 }} />
                  <Text className="text-[#101415] text-xs font-extrabold">Schedule Exam</Text>
                </Pressable>
              </View>

              {/* Class Filter Selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row" style={{ gap: 8 }}>
                  {['All', '10A', '9A', '8A', '7A'].map((cls) => {
                    const isSelected = selectedClassFilter === cls;
                    return (
                      <Pressable
                        key={cls}
                        onPress={() => setSelectedClassFilter(cls)}
                        className={`px-3.5 py-1.5 rounded-xl border ${isSelected ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/5 border-white/15'}`}
                      >
                        <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white/70'}`}>
                          {cls === 'All' ? 'All Classes' : `Class ${cls}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Exam Schedules List Cards */}
            <View className="px-5">
              <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Configured Exam Timetable ({filteredExams.length})</Text>

              {filteredExams.map(ex => (
                <GlassCard key={ex.id} intensity="low" className={`mb-4 p-4 border bg-[#101415]/90 ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-white/10'}`}>
                  <View className="flex-row justify-between items-start pb-3 border-b border-white/10 mb-3">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className={`w-10 h-10 rounded-2xl items-center justify-center mr-3 ${primaryBadgeClass}`}>
                        <BookOpen size={20} color={primaryColor} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-white font-extrabold text-base mr-2">{ex.subject}</Text>
                          <View className="bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-md">
                            <Text className="text-sky-300 text-[9.5px] font-bold">{ex.className}</Text>
                          </View>
                        </View>
                        <Text className={`${primaryTextClass} text-xs font-bold mt-0.5`}>{ex.examName}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Pressable
                        onPress={() => handleOpenEdit(ex)}
                        className="bg-white/5 border border-white/10 p-2 rounded-xl"
                      >
                        <Pencil size={14} color="rgba(255,255,255,0.7)" />
                      </Pressable>

                      <Pressable
                        onPress={() => setDeletingExam(ex)}
                        className="bg-rose-500/10 border border-rose-500/30 p-2 rounded-xl"
                      >
                        <Trash2 size={14} color="#ff516a" />
                      </Pressable>
                    </View>
                  </View>

                  {/* Date & Time Slot Grid */}
                  <View className="flex-row justify-between bg-black/40 p-3 rounded-2xl border border-white/5 mb-2">
                    <View className="flex-row items-center">
                      <Calendar size={14} color={primaryColor} style={{ marginRight: 6 }} />
                      <Text className="text-white text-xs font-semibold">{ex.date}</Text>
                    </View>

                    <View className="flex-row items-center">
                      <Clock size={14} color="#38bdf8" style={{ marginRight: 6 }} />
                      <Text className="text-sky-300 text-xs font-semibold">{ex.timeSlot}</Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-white/50 text-[11px]">Room: {ex.roomNo}</Text>
                    <Text className="text-amber-400 font-extrabold text-xs">Max Marks: {ex.maxMarks}</Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          </>
        )}

        {activeTab === 'invigilation' && (
          <View className="px-5">
            <GlassCard intensity="low" className={`p-4 border bg-[#101415]/90 mb-4 ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-white/10'}`}>
              <Text className="text-white font-extrabold text-sm mb-1">Faculty Invigilation Roster</Text>
              <Text className="text-white/50 text-xs mb-3">Assigned exam room supervision for staff members</Text>

              <View className="bg-white/5 p-3 rounded-2xl border border-white/10 mb-2 flex-row justify-between items-center">
                <View>
                  <Text className="text-white font-bold text-xs">Mrs. Anita Sharma</Text>
                  <Text className="text-white/40 text-[10px]">Mathematics • Room 12 (09:30 AM)</Text>
                </View>
                <View className={`px-2.5 py-1 rounded-xl ${primaryBadgeClass}`}>
                  <Text className={`${primaryTextClass} text-[10px] font-bold`}>Assigned</Text>
                </View>
              </View>

              <View className="bg-white/5 p-3 rounded-2xl border border-white/10 flex-row justify-between items-center">
                <View>
                  <Text className="text-white font-bold text-xs">Mr. Rajesh Kumar</Text>
                  <Text className="text-white/40 text-[10px]">Physics Lab • Room 15 (09:30 AM)</Text>
                </View>
                <View className={`px-2.5 py-1 rounded-xl ${primaryBadgeClass}`}>
                  <Text className={`${primaryTextClass} text-[10px] font-bold`}>Assigned</Text>
                </View>
              </View>
            </GlassCard>
          </View>
        )}

        {activeTab === 'results' && (
          <View className="px-5">
            <GlassCard intensity="low" className={`p-4 border bg-[#101415]/90 ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-white/10'}`}>
              <Text className="text-white font-extrabold text-sm mb-1">Class Rank & Performance Results</Text>
              <Text className="text-white/50 text-xs mb-3">Published examination marks and rank cards</Text>

              <View className="bg-black/40 p-3 rounded-2xl border border-white/5 mb-2 flex-row justify-between items-center">
                <View>
                  <Text className="text-white font-bold text-xs">Priya Sharma (Roll: 10A01)</Text>
                  <Text className={`${primaryTextClass} text-[11px] font-extrabold mt-0.5`}>Rank 1 • 94.5% (A+ Grade)</Text>
                </View>
                <View className="bg-purple-500/20 border border-purple-500/40 px-3 py-1 rounded-xl">
                  <Text className="text-purple-300 text-[10px] font-bold">Grade A+</Text>
                </View>
              </View>
            </GlassCard>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ADD / EDIT EXAM MODAL */}
      <Modal visible={showAddEditModal} transparent animationType="slide" onRequestClose={() => setShowAddEditModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-md p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-2xl' : 'border-[#00f1a1]/40 shadow-2xl'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <Text className="text-white font-bold text-base">{editingExam ? 'Edit Exam Schedule' : 'Schedule Examination'}</Text>
              <Pressable onPress={() => setShowAddEditModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Examination Title *</Text>
                <TextInput
                  value={formExamName}
                  onChangeText={setFormExamName}
                  placeholder="e.g. Mid-Term Examination 2026"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>

              <View className="flex-row mb-3" style={{ gap: 10 }}>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Target Class *</Text>
                  <TextInput
                    value={formClass}
                    onChangeText={setFormClass}
                    placeholder="Class 10A"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Subject *</Text>
                  <TextInput
                    value={formSubject}
                    onChangeText={setFormSubject}
                    placeholder="Mathematics"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>
              </View>

              <View className="flex-row mb-3" style={{ gap: 10 }}>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    value={formDate}
                    onChangeText={setFormDate}
                    placeholder="2026-06-15"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs font-mono"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Time Slot *</Text>
                  <TextInput
                    value={formTimeSlot}
                    onChangeText={setFormTimeSlot}
                    placeholder="09:30 AM - 12:30 PM"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>
              </View>

              <View className="flex-row mb-3" style={{ gap: 10 }}>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Max Marks *</Text>
                  <TextInput
                    value={formMaxMarks}
                    onChangeText={setFormMaxMarks}
                    keyboardType="numeric"
                    placeholder="100"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs font-mono"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Hall / Room No.</Text>
                  <TextInput
                    value={formRoom}
                    onChangeText={setFormRoom}
                    placeholder="Room 12"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>
              </View>
            </ScrollView>

            <View className="flex-row border-t border-white/10 pt-3 mt-2" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowAddEditModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveExamSchedule} className={`flex-1 py-3 rounded-xl ${primaryBtnClass} items-center shadow-lg`}>
                <Text className="text-[#101415] font-extrabold text-xs">
                  {editingExam ? 'Update Schedule' : 'Save Schedule'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CONFIRM DELETE EXAM MODAL */}
      <Modal visible={Boolean(deletingExam)} transparent animationType="fade" onRequestClose={() => setDeletingExam(null)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-rose-500/50 rounded-3xl w-full max-w-sm p-6 items-center shadow-[0_0_30px_rgba(255,81,106,0.3)]">
            <View className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/50 items-center justify-center mb-4">
              <Trash2 size={28} color="#ff516a" />
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">Delete Exam Schedule?</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">
              Are you sure you want to remove "{deletingExam?.subject}" from {deletingExam?.className} exam timetable?
            </Text>

            <View className="flex-row w-full" style={{ gap: 10 }}>
              <Pressable onPress={() => setDeletingExam(null)} className="flex-1 py-3.5 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmDeleteExam} className="flex-1 py-3.5 rounded-xl bg-rose-500 items-center shadow-[0_0_12px_rgba(255,81,106,0.4)]">
                <Text className="text-white font-extrabold text-xs">Delete Exam</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUSTOM TOAST MODAL */}
      <Modal visible={toastData.visible} transparent animationType="fade" onRequestClose={() => setToastData(prev => ({ ...prev, visible: false }))}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-sm p-6 items-center ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-2xl' : 'border-[#00f1a1]/40 shadow-2xl'}`}>
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
    paddingBottom: 100,
  },
});

export default ExamScheduleScreen;
