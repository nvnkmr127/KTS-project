import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Trash2, RotateCcw, AlertTriangle, Search, Filter, 
  UserX, FileX, CalendarX, CheckCircle2, AlertCircle, X, ShieldAlert, ArrowLeft
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';

export interface DeletedItem {
  id: string;
  name: string;
  category: 'Student' | 'Fee Receipt' | 'Staff Leave' | 'Document';
  details: string;
  deletedDate: string;
  deletedBy: string;
  avatarInitials?: string;
}

const MOCK_DELETED_ITEMS: DeletedItem[] = [
  {
    id: 'del_1',
    name: 'Kavya Sharma',
    category: 'Student',
    details: 'Class 9-A • Adm No: UV-2026-089',
    deletedDate: 'Today • 10:15 AM',
    deletedBy: 'Rajesh K (Admin Staff)',
    avatarInitials: 'KS'
  },
  {
    id: 'del_2',
    name: 'Term 2 Fee Receipt #RCP-9941',
    category: 'Fee Receipt',
    details: '₹12,500 • Paid via Cash • Student: Rahul Verma',
    deletedDate: 'Yesterday • 04:30 PM',
    deletedBy: 'Priya M (Accounts Staff)',
    avatarInitials: 'FR'
  },
  {
    id: 'del_3',
    name: 'Sick Leave Request — Mr. Suresh Kumar',
    category: 'Staff Leave',
    details: '2 Days Leave • Physics Department',
    deletedDate: '01 Aug 2026 • 11:20 AM',
    deletedBy: 'Rajesh K (Admin Staff)',
    avatarInitials: 'SL'
  },
  {
    id: 'del_4',
    name: 'Anish Nambiar',
    category: 'Student',
    details: 'Class 11-B • Adm No: UV-2026-044',
    deletedDate: '29 Jul 2026 • 02:45 PM',
    deletedBy: 'Rajesh K (Admin Staff)',
    avatarInitials: 'AN'
  },
  {
    id: 'del_5',
    name: 'Transport Concession Receipt #CON-102',
    category: 'Fee Receipt',
    details: '₹2,000 Concession • Student: Swati Reddy',
    deletedDate: '25 Jul 2026 • 09:10 AM',
    deletedBy: 'Priya M (Accounts Staff)',
    avatarInitials: 'CR'
  }
];

export const RecycleBinScreen: React.FC<any> = ({ navigation }) => {
  const [deletedList, setDeletedList] = useState<DeletedItem[]>(MOCK_DELETED_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal states
  const [itemToPurge, setItemToPurge] = useState<DeletedItem | null>(null);
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'warning' }>({
    visible: false,
    title: '',
    message: '',
    type: 'success'
  });

  const showToast = (title: string, message: string, type: 'success' | 'warning' = 'success') => {
    setToastData({ visible: true, title, message, type });
  };

  const filteredItems = deletedList.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRestoreItem = (item: DeletedItem) => {
    setDeletedList(prev => prev.filter(i => i.id !== item.id));
    showToast('Record Restored!', `"${item.name}" has been successfully restored to the system.`, 'success');
  };

  const handleConfirmPermanentDelete = () => {
    if (!itemToPurge) return;
    const name = itemToPurge.name;
    setDeletedList(prev => prev.filter(i => i.id !== itemToPurge.id));
    setItemToPurge(null);
    showToast('Permanently Purged', `"${name}" has been permanently removed from database.`, 'warning');
  };

  const handleEmptyRecycleBin = () => {
    if (deletedList.length === 0) return;
    setDeletedList([]);
    showToast('Recycle Bin Emptied', 'All archived items have been permanently deleted.', 'warning');
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
        title="Recycle Bin"
        subtitle="Archival & Recovery Terminal"
        icon={
          <View className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 items-center justify-center">
            <Trash2 size={20} color="#ff516a" />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Stats Banner */}
        <View className="px-5 mb-5 flex-row justify-between items-center">
          <View>
            <Text className="text-white text-lg font-extrabold">Deleted Items Registry</Text>
            <Text className="text-white/50 text-xs">{deletedList.length} records available for recovery</Text>
          </View>
          {deletedList.length > 0 && (
            <Pressable 
              onPress={handleEmptyRecycleBin}
              className="bg-rose-500/15 border border-rose-500/40 px-3 py-2 rounded-xl flex-row items-center"
            >
              <Trash2 size={13} color="#ff516a" style={{ marginRight: 4 }} />
              <Text className="text-[#ff516a] text-xs font-bold">Empty Bin</Text>
            </Pressable>
          )}
        </View>

        {/* Search & Category Filter Pills */}
        <View className="px-5 mb-5">
          <View className="bg-[#101415] border border-white/15 rounded-2xl flex-row items-center px-3.5 py-2.5 mb-3 shadow-md">
            <Search size={16} color="#00f1a1" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search deleted records by name or detail..."
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

          {/* Category Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {['All', 'Student', 'Fee Receipt', 'Staff Leave'].map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl border ${isSelected ? 'bg-[#00f1a1] border-[#00f1a1]' : 'bg-white/5 border-white/15'}`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white/70'}`}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Deleted Items List */}
        <View className="px-5">
          {filteredItems.length === 0 ? (
            <View className="bg-[#101415]/80 border border-white/10 p-8 rounded-3xl items-center justify-center my-6">
              <View className="w-14 h-14 rounded-full bg-[#00f1a1]/10 border border-[#00f1a1]/30 items-center justify-center mb-3">
                <CheckCircle2 size={28} color="#00f1a1" />
              </View>
              <Text className="text-white text-base font-bold text-center mb-1">Recycle Bin Empty</Text>
              <Text className="text-white/50 text-xs text-center">No deleted items match your search or filter selection.</Text>
            </View>
          ) : (
            filteredItems.map(item => (
              <GlassCard key={item.id} intensity="low" className="mb-3 p-4 border-white/10 bg-[#101415]/80">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 items-center justify-center mr-3">
                      <Text className="text-[#ff516a] font-bold text-xs">{item.avatarInitials || 'DEL'}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center mb-0.5">
                        <Text className="text-white font-bold text-sm mr-2">{item.name}</Text>
                        <View className="bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-md">
                          <Text className="text-[#ff516a] text-[9px] font-bold">{item.category}</Text>
                        </View>
                      </View>
                      <Text className="text-white/60 text-xs">{item.details}</Text>
                      <Text className="text-white/40 text-[10px] mt-1">Deleted: {item.deletedDate} • by {item.deletedBy}</Text>
                    </View>
                  </View>

                  {/* Actions: Restore & Permanent Delete */}
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <Pressable
                      onPress={() => handleRestoreItem(item)}
                      className="bg-[#00f1a1]/15 border border-[#00f1a1]/40 px-3 py-2 rounded-xl flex-row items-center"
                    >
                      <RotateCcw size={12} color="#00f1a1" style={{ marginRight: 4 }} />
                      <Text className="text-[#00f1a1] text-xs font-bold">Restore</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setItemToPurge(item)}
                      className="bg-rose-500/15 border border-rose-500/40 p-2 rounded-xl"
                    >
                      <Trash2 size={14} color="#ff516a" />
                    </Pressable>
                  </View>
                </View>
              </GlassCard>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* PERMANENT PURGE CONFIRMATION MODAL */}
      <Modal visible={Boolean(itemToPurge)} transparent animationType="fade" onRequestClose={() => setItemToPurge(null)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-rose-500/50 rounded-3xl w-full max-w-sm p-6 items-center shadow-[0_0_30px_rgba(255,81,106,0.3)]">
            <View className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/50 items-center justify-center mb-4">
              <ShieldAlert size={28} color="#ff516a" />
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">Permanently Delete?</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">
              Are you sure you want to permanently delete "{itemToPurge?.name}"? This action cannot be undone.
            </Text>

            <View className="flex-row w-full" style={{ gap: 10 }}>
              <Pressable
                onPress={() => setItemToPurge(null)}
                className="flex-1 py-3.5 rounded-xl bg-white/10 items-center"
              >
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmPermanentDelete}
                className="flex-1 py-3.5 rounded-xl bg-rose-500 items-center shadow-[0_0_12px_rgba(255,81,106,0.4)]"
              >
                <Text className="text-white font-extrabold text-xs">Delete Forever</Text>
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

export default RecycleBinScreen;
