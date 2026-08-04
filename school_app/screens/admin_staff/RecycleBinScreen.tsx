import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Trash2, RotateCcw, AlertTriangle, Users, Search, 
  CheckCircle2, AlertCircle, X, GraduationCap, Activity, User, ShieldAlert
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';

export interface DeletedEntityItem {
  id: string;
  name: string;
  type: 'student' | 'staff' | 'log';
  details: string;
  deletedAt: string;
  deletedBy: string;
}

const MOCK_DELETED_STUDENTS: DeletedEntityItem[] = [
  { id: 'ds_1', name: 'Ravi Teja', type: 'student', details: 'Class 10A • Roll: 10A15', deletedAt: '2026-08-01 11:30 AM', deletedBy: 'Admin Staff' },
  { id: 'ds_2', name: 'Sneha Reddy', type: 'student', details: 'Class 8B • Roll: 8B09', deletedAt: '2026-07-28 04:15 PM', deletedBy: 'Admin Staff' }
];

const MOCK_DELETED_STAFF: DeletedEntityItem[] = [
  { id: 'dst_1', name: 'Mr. Ramesh Babu', type: 'staff', details: 'Physics Teacher • Senior Secondary', deletedAt: '2026-07-25 10:00 AM', deletedBy: 'Principal' }
];

const MOCK_DELETED_LOGS: DeletedEntityItem[] = [
  { id: 'log_1', name: 'Fee Structure Override Log #1042', type: 'log', details: 'Waiver transaction log archive', deletedAt: '2026-07-20 02:20 PM', deletedBy: 'System Cron' }
];

export const RecycleBinScreen: React.FC<any> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'staff' | 'logs'>('students');
  const [deletedStudents, setDeletedStudents] = useState<DeletedEntityItem[]>(MOCK_DELETED_STUDENTS);
  const [deletedStaff, setDeletedStaff] = useState<DeletedEntityItem[]>(MOCK_DELETED_STAFF);
  const [deletedLogs, setDeletedLogs] = useState<DeletedEntityItem[]>(MOCK_DELETED_LOGS);
  const [searchQuery, setSearchQuery] = useState('');

  // Action Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean; actionType: 'restore' | 'purge'; item: DeletedEntityItem | null }>({
    visible: false, actionType: 'restore', item: null
  });

  // Custom Toast State
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'warning' }>({
    visible: false, title: '', message: '', type: 'success'
  });

  const showToast = (title: string, message: string, type: 'success' | 'warning' = 'success') => {
    setToastData({ visible: true, title, message, type });
  };

  const handleOpenAction = (item: DeletedEntityItem, actionType: 'restore' | 'purge') => {
    setConfirmModal({ visible: true, actionType, item });
  };

  const handleConfirmAction = () => {
    if (!confirmModal.item) return;
    const { item, actionType } = confirmModal;

    if (item.type === 'student') setDeletedStudents(prev => prev.filter(i => i.id !== item.id));
    else if (item.type === 'staff') setDeletedStaff(prev => prev.filter(i => i.id !== item.id));
    else setDeletedLogs(prev => prev.filter(i => i.id !== item.id));

    setConfirmModal({ visible: false, actionType: 'restore', item: null });

    if (actionType === 'restore') {
      showToast('Item Restored!', `${item.name} has been restored to active records.`, 'success');
    } else {
      showToast('Permanently Purged', `${item.name} has been permanently deleted from database.`, 'warning');
    }
  };

  const activeList = activeTab === 'students' ? deletedStudents : activeTab === 'staff' ? deletedStaff : deletedLogs;
  const filteredList = activeList.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.details.toLowerCase().includes(searchQuery.toLowerCase())
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
        title="Recycle Bin & Trash Purge"
        subtitle="System Archives, Restoration & Purging"
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center">
            <Trash2 size={20} color="#00f1a1" />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top 3 KPI Summary Cards */}
        <View className="px-5 mb-5 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
          <GlassCard intensity="low" className="w-[31%] p-3 border-white/10 bg-[#101415]/80 items-center">
            <Text className="text-white/40 text-[9px] font-bold uppercase mb-1">Students</Text>
            <Text className="text-[#00f1a1] text-lg font-extrabold">{deletedStudents.length}</Text>
            <Text className="text-[#00f1a1] text-[9px] font-semibold">● Restorable</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[31%] p-3 border-white/10 bg-[#101415]/80 items-center">
            <Text className="text-white/40 text-[9px] font-bold uppercase mb-1">Staff</Text>
            <Text className="text-sky-400 text-lg font-extrabold">{deletedStaff.length}</Text>
            <Text className="text-sky-300 text-[9px] font-semibold">● Restorable</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[31%] p-3 border-white/10 bg-[#101415]/80 items-center">
            <Text className="text-white/40 text-[9px] font-bold uppercase mb-1">Activity Logs</Text>
            <Text className="text-purple-300 text-lg font-extrabold">{deletedLogs.length}</Text>
            <Text className="text-purple-400 text-[9px] font-semibold">● Archived</Text>
          </GlassCard>
        </View>

        {/* Tab Bar (Students, Staff, Logs) */}
        <View className="px-5 mb-4">
          <View className="flex-row bg-[#101415] p-1.5 rounded-2xl border border-white/10" style={{ gap: 6 }}>
            <Pressable
              onPress={() => setActiveTab('students')}
              className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'students' ? 'bg-[#00f1a1]' : 'bg-transparent'}`}
            >
              <Text className={`text-xs font-extrabold ${activeTab === 'students' ? 'text-[#101415]' : 'text-white/60'}`}>
                Students ({deletedStudents.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('staff')}
              className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'staff' ? 'bg-[#00f1a1]' : 'bg-transparent'}`}
            >
              <Text className={`text-xs font-extrabold ${activeTab === 'staff' ? 'text-[#101415]' : 'text-white/60'}`}>
                Staff ({deletedStaff.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('logs')}
              className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'logs' ? 'bg-[#00f1a1]' : 'bg-transparent'}`}
            >
              <Text className={`text-xs font-extrabold ${activeTab === 'logs' ? 'text-[#101415]' : 'text-white/60'}`}>
                Logs ({deletedLogs.length})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-5 mb-4">
          <View className="bg-[#101415] border border-white/15 rounded-2xl flex-row items-center px-3.5 py-2.5 shadow-md">
            <Search size={16} color="#00f1a1" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search deleted records..."
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

        {/* Deleted Items List */}
        <View className="px-5">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Archived Trash Items ({filteredList.length})</Text>

          {filteredList.length > 0 ? (
            filteredList.map(item => (
              <GlassCard key={item.id} intensity="low" className="mb-3 p-4 border-white/10 bg-[#101415]/90">
                <View className="flex-row justify-between items-center mb-2 pb-2.5 border-b border-white/10">
                  <View className="flex-1 mr-2">
                    <Text className="text-white font-extrabold text-sm">{item.name}</Text>
                    <Text className="text-white/50 text-[10.5px] mt-0.5">{item.details}</Text>
                  </View>

                  {/* Actions: Restore & Permanent Purge Delete */}
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Pressable
                      onPress={() => handleOpenAction(item, 'restore')}
                      className="bg-[#00f1a1]/15 border border-[#00f1a1]/40 px-3 py-1.5 rounded-xl flex-row items-center"
                    >
                      <RotateCcw size={12} color="#00f1a1" style={{ marginRight: 4 }} />
                      <Text className="text-[#00f1a1] text-xs font-extrabold">Restore</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleOpenAction(item, 'purge')}
                      className="bg-rose-500/15 border border-rose-500/40 p-2 rounded-xl"
                    >
                      <Trash2 size={13} color="#ff516a" />
                    </Pressable>
                  </View>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-white/40 text-[9.5px]">Deleted At: {item.deletedAt}</Text>
                  <Text className="text-white/40 text-[9.5px]">By: {item.deletedBy}</Text>
                </View>
              </GlassCard>
            ))
          ) : (
            <GlassCard intensity="low" className="p-6 border-white/10 bg-[#101415]/90 items-center justify-center">
              <CheckCircle2 size={28} color="#00f1a1" style={{ marginBottom: 8 }} />
              <Text className="text-white font-bold text-sm">Recycle Bin Empty!</Text>
              <Text className="text-white/40 text-xs mt-1">No deleted records in {activeTab} section.</Text>
            </GlassCard>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CONFIRM ACTION MODAL (RESTORE OR PERMANENT PURGE) */}
      <Modal visible={confirmModal.visible} transparent animationType="fade" onRequestClose={() => setConfirmModal(prev => ({ ...prev, visible: false }))}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 ${confirmModal.actionType === 'purge' ? 'border-rose-500/50' : 'border-[#00f1a1]/40'} rounded-3xl w-full max-w-sm p-6 items-center shadow-lg`}>
            <View className={`w-14 h-14 rounded-full items-center justify-center mb-4 border ${confirmModal.actionType === 'purge' ? 'bg-rose-500/20 border-rose-500/50' : 'bg-[#00f1a1]/20 border-[#00f1a1]/40'}`}>
              {confirmModal.actionType === 'purge' ? (
                <Trash2 size={28} color="#ff516a" />
              ) : (
                <RotateCcw size={28} color="#00f1a1" />
              )}
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">
              {confirmModal.actionType === 'purge' ? 'Permanently Purge Item?' : 'Restore Record?'}
            </Text>

            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">
              {confirmModal.actionType === 'purge'
                ? `Are you sure you want to permanently delete "${confirmModal.item?.name}" from database? This action CANNOT be undone.`
                : `Restore "${confirmModal.item?.name}" back to active school directory?`
              }
            </Text>

            <View className="flex-row w-full" style={{ gap: 10 }}>
              <Pressable onPress={() => setConfirmModal(prev => ({ ...prev, visible: false }))} className="flex-1 py-3.5 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmAction}
                className={`flex-1 py-3.5 rounded-xl items-center ${confirmModal.actionType === 'purge' ? 'bg-rose-500' : 'bg-[#00f1a1]'}`}
              >
                <Text className={`font-extrabold text-xs ${confirmModal.actionType === 'purge' ? 'text-white' : 'text-[#101415]'}`}>
                  {confirmModal.actionType === 'purge' ? 'Purge Forever' : 'Restore Record'}
                </Text>
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

export default RecycleBinScreen;
