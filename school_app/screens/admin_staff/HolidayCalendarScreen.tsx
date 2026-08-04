import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Calendar, Plus, Trash2, Pencil, CheckCircle2, 
  AlertCircle, X, Clock, PartyPopper, Flag, School, Search
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';

export interface HolidayItem {
  id: string;
  title: string;
  dateRange: string;
  type: 'National' | 'Festival' | 'Institutional' | 'Vacation';
  description: string;
}

const MOCK_HOLIDAYS: HolidayItem[] = [
  { id: 'hol_1', title: 'Independence Day', dateRange: '15 Aug 2026', type: 'National', description: 'National Holiday celebrating Indian Independence' },
  { id: 'hol_2', title: 'Ganesh Chaturthi', dateRange: '07 Sep 2026', type: 'Festival', description: 'Ganesh Chaturthi Festival holiday' },
  { id: 'hol_3', title: 'Gandhi Jayanti', dateRange: '02 Oct 2026', type: 'National', description: 'Mahatma Gandhi Jayanti holiday' },
  { id: 'hol_4', title: 'Dussehra / Vijayadashami Break', dateRange: '20 Oct - 25 Oct 2026', type: 'Vacation', description: 'Dussehra term break for all classes' },
  { id: 'hol_5', title: 'Diwali Celebrations', dateRange: '12 Nov - 14 Nov 2026', type: 'Festival', description: 'Deepavali festival school holiday' },
  { id: 'hol_6', title: 'Annual Sports Meet Day', dateRange: '20 Dec 2026', type: 'Institutional', description: 'School Annual Athletics & Sports meet day' }
];

export const HolidayCalendarScreen: React.FC<any> = ({ navigation }) => {
  const [holidays, setHolidays] = useState<HolidayItem[]>(MOCK_HOLIDAYS);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'National' | 'Festival' | 'Institutional' | 'Vacation'>('All');

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await api.getResources('holidays');
        if (Array.isArray(res) && res.length > 0) {
          const mapped: HolidayItem[] = res.map((h: any) => ({
            id: String(h.id),
            title: h.title || h.name || 'School Holiday',
            dateRange: h.date_range || h.start_date || '15 Aug 2026',
            type: (h.type || 'Festival') as any,
            description: h.description || 'Official school holiday',
          }));
          setHolidays(mapped);
        }
      } catch (err) {
        console.log('Error loading holidays:', err);
      }
    };
    fetchHolidays();
  }, []);

  // Modal States
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<HolidayItem | null>(null);

  // Form States
  const [formTitle, setFormTitle] = useState('');
  const [formDateRange, setFormDateRange] = useState('');
  const [formType, setFormType] = useState<'National' | 'Festival' | 'Institutional' | 'Vacation'>('Festival');
  const [formDescription, setFormDescription] = useState('');

  // Custom Toast State
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'warning' }>({
    visible: false, title: '', message: '', type: 'success'
  });

  const showToast = (title: string, message: string, type: 'success' | 'warning' = 'success') => {
    setToastData({ visible: true, title, message, type });
  };

  const handleOpenAdd = () => {
    setEditingHoliday(null);
    setFormTitle('');
    setFormDateRange('15 Aug 2026');
    setFormType('National');
    setFormDescription('Official academic holiday');
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (hol: HolidayItem) => {
    setEditingHoliday(hol);
    setFormTitle(hol.title);
    setFormDateRange(hol.dateRange);
    setFormType(hol.type);
    setFormDescription(hol.description);
    setShowAddEditModal(true);
  };

  const handleSaveHoliday = () => {
    if (!formTitle.trim()) {
      showToast('Missing Title', 'Please enter holiday title.', 'warning');
      return;
    }

    if (editingHoliday) {
      setHolidays(prev => prev.map(h => h.id === editingHoliday.id ? {
        ...h,
        title: formTitle,
        dateRange: formDateRange || '2026',
        type: formType,
        description: formDescription || 'School academic holiday'
      } : h));
      showToast('Holiday Updated', `${formTitle} updated in calendar.`, 'success');
    } else {
      const newHol: HolidayItem = {
        id: `hol_${Date.now()}`,
        title: formTitle,
        dateRange: formDateRange || '2026',
        type: formType,
        description: formDescription || 'School academic holiday'
      };
      setHolidays(prev => [newHol, ...prev]);
      showToast('Holiday Added', `${formTitle} added to academic calendar.`, 'success');
    }

    setShowAddEditModal(false);
  };

  const handleConfirmDelete = () => {
    if (!deletingHoliday) return;
    const title = deletingHoliday.title;
    setHolidays(prev => prev.filter(h => h.id !== deletingHoliday.id));
    setDeletingHoliday(null);
    showToast('Holiday Deleted', `${title} removed from calendar.`, 'warning');
  };

  const filteredHolidays = holidays.filter(h => {
    const matchesType = typeFilter === 'All' || h.type === typeFilter;
    const matchesSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          h.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

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
        title="Holiday Calendar Console"
        subtitle="Academic Events, Vacations & National Holidays"
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center">
            <Calendar size={20} color="#00f1a1" />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Search & Add Action Header */}
        <View className="px-5 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1 bg-[#101415] border border-white/15 rounded-2xl flex-row items-center px-3.5 py-2.5 mr-3 shadow-md">
              <Search size={16} color="#00f1a1" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search holiday name or description..."
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
              className="bg-[#00f1a1] px-4 py-2.5 rounded-2xl flex-row items-center shadow-[0_0_12px_rgba(0,241,161,0.3)]"
            >
              <Plus size={16} color="#101415" style={{ marginRight: 4 }} />
              <Text className="text-[#101415] text-xs font-extrabold">Add Holiday</Text>
            </Pressable>
          </View>

          {/* Holiday Type Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {(['All', 'National', 'Festival', 'Institutional', 'Vacation'] as const).map(tf => {
                const isSelected = typeFilter === tf;
                return (
                  <Pressable
                    key={tf}
                    onPress={() => setTypeFilter(tf)}
                    className={`px-3.5 py-1.5 rounded-xl border ${isSelected ? 'bg-[#00f1a1] border-[#00f1a1]' : 'bg-white/5 border-white/15'}`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white/70'}`}>
                      {tf === 'All' ? 'All Holidays' : tf}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Holiday Cards Directory */}
        <View className="px-5">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Academic Calendar Holidays ({filteredHolidays.length})</Text>

          {filteredHolidays.map(hol => {
            const badgeStyle = hol.type === 'National' ? 'bg-[#00f1a1]/20 border-[#00f1a1]/40 text-[#00f1a1]' :
                              hol.type === 'Festival' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' :
                              hol.type === 'Vacation' ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' :
                              'bg-sky-500/20 border-sky-500/40 text-sky-400';

            return (
              <GlassCard key={hol.id} intensity="low" className="mb-4 p-4 border-white/10 bg-[#101415]/90">
                <View className="flex-row justify-between items-start pb-3 border-b border-white/10 mb-3">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-10 h-10 rounded-2xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center mr-3">
                      <Calendar size={20} color="#00f1a1" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-white font-extrabold text-base mr-2">{hol.title}</Text>
                      </View>
                      <Text className="text-[#00f1a1] text-xs font-bold mt-0.5">{hol.dateRange}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <View className={`${badgeStyle} border px-2.5 py-1 rounded-xl mr-1`}>
                      <Text className={`${badgeStyle.split(' ').pop()} text-[10px] font-bold`}>{hol.type}</Text>
                    </View>

                    <Pressable
                      onPress={() => handleOpenEdit(hol)}
                      className="bg-white/5 border border-white/10 p-2 rounded-xl"
                    >
                      <Pencil size={14} color="rgba(255,255,255,0.7)" />
                    </Pressable>

                    <Pressable
                      onPress={() => setDeletingHoliday(hol)}
                      className="bg-rose-500/10 border border-rose-500/30 p-2 rounded-xl"
                    >
                      <Trash2 size={14} color="#ff516a" />
                    </Pressable>
                  </View>
                </View>

                <Text className="text-white/70 text-xs leading-relaxed">{hol.description}</Text>
              </GlassCard>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ADD / EDIT HOLIDAY MODAL */}
      <Modal visible={showAddEditModal} transparent animationType="slide" onRequestClose={() => setShowAddEditModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-[#00f1a1]/40 rounded-3xl w-full max-w-md p-5 shadow-[0_0_30px_rgba(0,241,161,0.3)]">
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <Text className="text-white font-bold text-base">{editingHoliday ? 'Edit Holiday Entry' : 'Add Holiday Entry'}</Text>
              <Pressable onPress={() => setShowAddEditModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Holiday Title *</Text>
                <TextInput
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="e.g. Independence Day"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Date Range *</Text>
                <TextInput
                  value={formDateRange}
                  onChangeText={setFormDateRange}
                  placeholder="e.g. 15 Aug 2026 or 20 Oct - 25 Oct 2026"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Category Type *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row" style={{ gap: 6 }}>
                    {(['National', 'Festival', 'Institutional', 'Vacation'] as const).map(t => {
                      const isSel = formType === t;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => setFormType(t)}
                          className={`px-3 py-1.5 rounded-xl border ${isSel ? 'bg-[#00f1a1] border-[#00f1a1]' : 'bg-white/5 border-white/15'}`}
                        >
                          <Text className={`text-xs font-bold ${isSel ? 'text-[#101415]' : 'text-white/70'}`}>{t}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Description</Text>
                <TextInput
                  value={formDescription}
                  onChangeText={setFormDescription}
                  multiline
                  numberOfLines={3}
                  placeholder="Official notice or holiday announcement..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>
            </ScrollView>

            <View className="flex-row border-t border-white/10 pt-3 mt-2" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowAddEditModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveHoliday} className="flex-1 py-3 rounded-xl bg-[#00f1a1] items-center shadow-[0_0_12px_rgba(0,241,161,0.4)]">
                <Text className="text-[#101415] font-extrabold text-xs">
                  {editingHoliday ? 'Update Holiday' : 'Save Holiday'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal visible={Boolean(deletingHoliday)} transparent animationType="fade" onRequestClose={() => setDeletingHoliday(null)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-rose-500/50 rounded-3xl w-full max-w-sm p-6 items-center shadow-[0_0_30px_rgba(255,81,106,0.3)]">
            <View className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/50 items-center justify-center mb-4">
              <Trash2 size={28} color="#ff516a" />
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">Delete Holiday?</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">
              Are you sure you want to remove "{deletingHoliday?.title}" from the holiday calendar?
            </Text>

            <View className="flex-row w-full" style={{ gap: 10 }}>
              <Pressable onPress={() => setDeletingHoliday(null)} className="flex-1 py-3.5 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmDelete} className="flex-1 py-3.5 rounded-xl bg-rose-500 items-center shadow-[0_0_12px_rgba(255,81,106,0.4)]">
                <Text className="text-white font-extrabold text-xs">Delete Entry</Text>
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

export default HolidayCalendarScreen;
