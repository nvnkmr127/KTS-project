import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  BookOpen, Calendar, Search, Plus, 
  Paperclip, Send, CheckCircle2, AlertCircle, X, 
  School, Megaphone, Eye, Filter, Check, Clock, User
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';

export interface DiaryLogItem {
  id: string;
  className: string;      // e.g. "Class 10-A"
  teacherName: string;    // e.g. "Mr. Rajesh Kumar"
  subject: string;        // e.g. "Physics"
  topicTitle: string;     // e.g. "Newton's Third Law Deep Dive"
  topicTags: string[];    // e.g. ["Mechanics", "Lab Session"]
  contentSummary: string; // Summary of classroom coverage
  date: string;
  timestamp: string;
  attachmentName?: string;
  isAcknowledged: boolean;
}

const MOCK_DIARY_LOGS: DiaryLogItem[] = [
  {
    id: 'd_1',
    className: 'Class 10 — Section A',
    teacherName: 'Mrs. Anita Sharma',
    subject: 'Mathematics',
    topicTitle: 'Quadratic Equations & Real Roots',
    topicTags: ['Algebra', 'Class Test Next'],
    contentSummary: 'Completed exercise 4.3 on discriminant methods. Assigned homework problems 5 through 12. Students demonstrated strong grasp of real vs imaginary roots.',
    date: 'Today',
    timestamp: '11:30 AM',
    attachmentName: 'quadratic_equations_worksheet.pdf',
    isAcknowledged: true
  },
  {
    id: 'd_2',
    className: 'Class 10 — Section B',
    teacherName: 'Mr. Rajesh Kumar',
    subject: 'Physics',
    topicTitle: 'Electromagnetism & Faraday Law',
    topicTags: ['Physics', 'Lab Experiment'],
    contentSummary: 'Demonstrated magnetic flux induction using solenoid coils. Students performed practical verification in pairs during lab hour.',
    date: 'Today',
    timestamp: '10:15 AM',
    attachmentName: 'solenoid_lab_guide.pdf',
    isAcknowledged: false
  },
  {
    id: 'd_3',
    className: 'Class 9 — Section A',
    teacherName: 'Dr. Meenakshi Sundaram',
    subject: 'Chemistry',
    topicTitle: 'Chemical Reactions & Stoichiometry',
    topicTags: ['Chemistry', 'Board Prep'],
    contentSummary: 'Balanced chemical equations practice. Reviewed double displacement reactions with barium chloride demonstrations.',
    date: 'Yesterday',
    timestamp: '02:45 PM',
    attachmentName: 'reaction_balancing_notes.pdf',
    isAcknowledged: true
  },
  {
    id: 'd_4',
    className: 'Class 8 — Section A',
    teacherName: 'Mr. David Miller',
    subject: 'English',
    topicTitle: 'Poetry Analysis: The Road Not Taken',
    topicTags: ['Literature', 'Essay Assignment'],
    contentSummary: 'Discussed metaphoric themes of decision making. Assigned 250-word analytical essay due on Friday.',
    date: 'Yesterday',
    timestamp: '01:20 PM',
    isAcknowledged: true
  }
];

export const AdminDailyDiaryScreen: React.FC<any> = ({ navigation }) => {
  const [diaryLogs, setDiaryLogs] = useState<DiaryLogItem[]>(MOCK_DIARY_LOGS);
  const [selectedDate, setSelectedDate] = useState<string>('04 Aug 2026');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState<boolean>(false);
  const [formClass, setFormClass] = useState<string>('Class 10 — Section A');
  const [formSubject, setFormSubject] = useState<string>('Admin Notice');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');

  // Custom Toast State
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'warning' }>({
    visible: false, title: '', message: '', type: 'success'
  });

  const showToast = (title: string, message: string, type: 'success' | 'warning' = 'success') => {
    setToastData({ visible: true, title, message, type });
  };

  const filteredLogs = diaryLogs.filter(log => {
    const matchesClass = selectedClassFilter === 'All' || log.className.includes(selectedClassFilter);
    const matchesSearch = log.topicTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const handleAcknowledgeLog = (id: string) => {
    setDiaryLogs(prev => prev.map(l => l.id === id ? { ...l, isAcknowledged: true } : l));
    showToast('Entry Acknowledged', 'Diary submission acknowledged by Admin Staff.', 'success');
  };

  const handleBroadcastLog = (log: DiaryLogItem) => {
    showToast('Broadcast Sent!', `Daily diary update for ${log.className} sent to parent portal.`, 'success');
  };

  const handleCreateAdminEntry = () => {
    if (!formTitle.trim() || !formContent.trim()) {
      showToast('Missing Fields', 'Please enter title and announcement summary.', 'warning');
      return;
    }

    const newLog: DiaryLogItem = {
      id: `d_${Date.now()}`,
      className: formClass,
      teacherName: 'Rajesh K (Admin Staff)',
      subject: formSubject,
      topicTitle: formTitle,
      topicTags: ['Admin Circular', 'Important Notice'],
      contentSummary: formContent,
      date: 'Today',
      timestamp: 'Just Now',
      isAcknowledged: true
    };

    setDiaryLogs(prev => [newLog, ...prev]);
    setShowAddAnnouncementModal(false);
    setFormTitle('');
    setFormContent('');
    showToast('Admin Entry Published!', `Daily diary notice posted for ${formClass}.`, 'success');
  };

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
        title="Daily Diary Console"
        subtitle="School-Wide Class Coverage & Homework Logs"
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center">
            <BookOpen size={20} color="#00f1a1" />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Academic Overview Bar */}
        <View className="px-5 mb-5 flex-row justify-between items-center">
          <View>
            <Text className="text-white text-lg font-extrabold">Curriculum Activity Feed</Text>
            <Text className="text-white/50 text-xs">Monitoring today's classroom logs</Text>
          </View>
          <View className="bg-[#101415] border border-[#00f1a1]/40 px-3 py-1.5 rounded-xl flex-row items-center">
            <Calendar size={13} color="#00f1a1" style={{ marginRight: 6 }} />
            <Text className="text-[#00f1a1] text-xs font-bold">{selectedDate}</Text>
          </View>
        </View>

        {/* 4 Summary Stats Cards */}
        <View className="px-5 mb-5 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Submitted Today</Text>
              <CheckCircle2 size={14} color="#00f1a1" />
            </View>
            <Text className="text-white text-xl font-extrabold">32 / 36 Classes</Text>
            <Text className="text-[#00f1a1] text-[10px] font-semibold mt-0.5">● 88.8% Submitted</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Pending Diaries</Text>
              <Clock size={14} color="#f59e0b" />
            </View>
            <Text className="text-white text-xl font-extrabold">4 Classes</Text>
            <Text className="text-amber-400 text-[10px] font-semibold mt-0.5">● Reminder Sent</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Lessons Logged</Text>
              <BookOpen size={14} color="#38bdf8" />
            </View>
            <Text className="text-white text-xl font-extrabold">120 Lessons</Text>
            <Text className="text-sky-400 text-[10px] font-semibold mt-0.5">● 5 Subjects / Class</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Study Materials</Text>
              <Paperclip size={14} color="#c084fc" />
            </View>
            <Text className="text-white text-xl font-extrabold">28 Files</Text>
            <Text className="text-purple-400 text-[10px] font-semibold mt-0.5">● Worksheets & PDFs</Text>
          </GlassCard>
        </View>

        {/* Action & Filter Bar */}
        <View className="px-5 mb-5">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1 bg-[#101415] border border-white/15 rounded-2xl flex-row items-center px-3.5 py-2.5 mr-3 shadow-md">
              <Search size={16} color="#00f1a1" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search topic, teacher, subject..."
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
              onPress={() => setShowAddAnnouncementModal(true)}
              className="bg-[#00f1a1] px-3.5 py-2.5 rounded-2xl flex-row items-center shadow-[0_0_12px_rgba(0,241,161,0.3)]"
            >
              <Plus size={16} color="#101415" style={{ marginRight: 4 }} />
              <Text className="text-[#101415] text-xs font-extrabold">+ Post Notice</Text>
            </Pressable>
          </View>

          {/* Class Filter Selector Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {['All', 'Class 10', 'Class 9', 'Class 8'].map((clsFilter) => {
                const isSelected = selectedClassFilter === clsFilter;
                return (
                  <Pressable
                    key={clsFilter}
                    onPress={() => setSelectedClassFilter(clsFilter)}
                    className={`px-3.5 py-1.5 rounded-xl border ${isSelected ? 'bg-[#00f1a1] border-[#00f1a1]' : 'bg-white/5 border-white/15'}`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white/70'}`}>
                      {clsFilter}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Daily Diary Feed Cards */}
        <View className="px-5">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Submitted Class Diaries</Text>
          {filteredLogs.map(log => (
            <GlassCard key={log.id} intensity="low" className="mb-4 p-4 border-white/10 bg-[#101415]/90">
              {/* Card Header Row */}
              <View className="flex-row justify-between items-start pb-3 border-b border-white/10 mb-3">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 items-center justify-center mr-3">
                    <BookOpen size={18} color="#c084fc" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-white font-extrabold text-sm mr-2">{log.className}</Text>
                      <View className="bg-purple-500/15 border border-purple-500/40 px-2 py-0.5 rounded-md">
                        <Text className="text-purple-300 text-[10px] font-bold">{log.subject}</Text>
                      </View>
                    </View>
                    <Text className="text-white/50 text-[10px] mt-0.5">{log.teacherName} • {log.date} at {log.timestamp}</Text>
                  </View>
                </View>

                {log.isAcknowledged ? (
                  <View className="bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full flex-row items-center">
                    <CheckCircle2 size={11} color="#00f1a1" style={{ marginRight: 3 }} />
                    <Text className="text-[#00f1a1] text-[9.5px] font-bold">Verified</Text>
                  </View>
                ) : (
                  <View className="bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full flex-row items-center">
                    <Clock size={11} color="#f59e0b" style={{ marginRight: 3 }} />
                    <Text className="text-amber-400 text-[9.5px] font-bold">New Entry</Text>
                  </View>
                )}
              </View>

              {/* Topic Title & Tags */}
              <Text className="text-white font-bold text-sm mb-2">{log.topicTitle}</Text>
              <View className="flex-row flex-wrap mb-3" style={{ gap: 6 }}>
                {log.topicTags.map((tag, idx) => (
                  <View key={idx} className="bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg">
                    <Text className="text-[#00f1a1] text-[10px] font-semibold">#{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Coverage Summary Box */}
              <View className="bg-black/30 p-3 rounded-2xl mb-3 border border-white/5">
                <Text className="text-white/70 text-xs leading-relaxed">{log.contentSummary}</Text>
                {log.attachmentName && (
                  <View className="mt-2.5 pt-2 border-t border-white/5 flex-row items-center">
                    <Paperclip size={12} color="#00f1a1" style={{ marginRight: 5 }} />
                    <Text className="text-[#00f1a1] text-[11px] font-mono" numberOfLines={1}>{log.attachmentName}</Text>
                  </View>
                )}
              </View>

              {/* Card Actions */}
              <View className="flex-row justify-between items-center" style={{ gap: 8 }}>
                {!log.isAcknowledged && (
                  <Pressable
                    onPress={() => handleAcknowledgeLog(log.id)}
                    className="flex-1 bg-emerald-500/15 border border-emerald-500/40 py-2.5 rounded-xl flex-row items-center justify-center"
                  >
                    <Check size={13} color="#00f1a1" style={{ marginRight: 5 }} />
                    <Text className="text-[#00f1a1] text-xs font-bold">Acknowledge</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => handleBroadcastLog(log)}
                  className="flex-1 bg-[#00f1a1]/15 border border-[#00f1a1]/40 py-2.5 rounded-xl flex-row items-center justify-center"
                >
                  <Send size={13} color="#00f1a1" style={{ marginRight: 5 }} />
                  <Text className="text-[#00f1a1] text-xs font-bold">Broadcast Parents</Text>
                </Pressable>
              </View>
            </GlassCard>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CREATE ADMIN ANNOUNCEMENT LOG MODAL */}
      <Modal visible={showAddAnnouncementModal} transparent animationType="slide" onRequestClose={() => setShowAddAnnouncementModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-[#00f1a1]/40 rounded-3xl w-full max-w-md p-5 shadow-[0_0_30px_rgba(0,241,161,0.3)]">
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center mr-2.5">
                  <Megaphone size={16} color="#00f1a1" />
                </View>
                <Text className="text-white font-bold text-base">Post Admin Daily Diary Notice</Text>
              </View>
              <Pressable onPress={() => setShowAddAnnouncementModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              <View className="flex-row mb-3" style={{ gap: 10 }}>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Target Class *</Text>
                  <TextInput
                    value={formClass}
                    onChangeText={setFormClass}
                    placeholder="e.g. Class 10-A"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Subject Tag</Text>
                  <TextInput
                    value={formSubject}
                    onChangeText={setFormSubject}
                    placeholder="e.g. Admin Notice"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Topic Title *</Text>
                <TextInput
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="e.g. Upcoming Science Exhibition Submission"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Coverage & Notice Details *</Text>
                <TextInput
                  value={formContent}
                  onChangeText={setFormContent}
                  multiline
                  numberOfLines={4}
                  placeholder="Describe the lesson progress or administrative announcement details..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white p-3 text-xs"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>
            </ScrollView>

            <View className="flex-row border-t border-white/10 pt-3 mt-2" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowAddAnnouncementModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleCreateAdminEntry} className="flex-1 py-3 rounded-xl bg-[#00f1a1] items-center shadow-[0_0_12px_rgba(0,241,161,0.4)]">
                <Text className="text-[#101415] font-extrabold text-xs">Publish Entry</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUSTOM ADMIN STAFF TOAST MODAL */}
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

export default AdminDailyDiaryScreen;
