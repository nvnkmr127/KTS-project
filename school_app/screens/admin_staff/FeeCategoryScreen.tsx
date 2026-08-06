import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Tags, Plus, Trash2, Pencil, CheckCircle2, 
  AlertCircle, X, ShieldAlert, BookOpen, School, Search
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { useAuthStore } from '../../store/useAuthStore';

export interface FeeCategoryItem {
  id: string;
  name: string;
  amount: number;
  description: string;
  status: 'Active' | 'Inactive';
  applicableClasses: string;
}

const MOCK_FEE_CATEGORIES: FeeCategoryItem[] = [
  { id: 'cat_1', name: 'Tuition Fee', amount: 35000, description: 'Core academic term fee including classroom instruction and study material', status: 'Active', applicableClasses: 'All Classes (1 to 10)' },
  { id: 'cat_2', name: 'Transport / Bus Fee', amount: 12000, description: 'Annual AC bus transport facility per student route', status: 'Active', applicableClasses: 'Opted Students' },
  { id: 'cat_3', name: 'Examination Fee', amount: 3000, description: 'Internal midterm, quarterly and board prep exam evaluation fees', status: 'Active', applicableClasses: 'Classes 6 to 10' },
  { id: 'cat_4', name: 'Laboratory & Practical Fee', amount: 5000, description: 'Science lab equipment, computer lab systems and consumables', status: 'Active', applicableClasses: 'Classes 8 to 10' },
  { id: 'cat_5', name: 'Sports & Cultural Fee', amount: 2000, description: 'Annual sports day events, athletic equipment and cultural fest', status: 'Active', applicableClasses: 'All Classes' }
];

export const FeeCategoryScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const [categories, setCategories] = useState<FeeCategoryItem[]>(MOCK_FEE_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingCat, setEditingCat] = useState<FeeCategoryItem | null>(null);
  const [deletingCat, setDeletingCat] = useState<FeeCategoryItem | null>(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('5000');
  const [formDescription, setFormDescription] = useState('');
  const [formClasses, setFormClasses] = useState('All Classes');

  // Custom Toast State
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'warning' }>({
    visible: false, title: '', message: '', type: 'success'
  });

  const showToast = (title: string, message: string, type: 'success' | 'warning' = 'success') => {
    setToastData({ visible: true, title, message, type });
  };

  const handleOpenAdd = () => {
    setEditingCat(null);
    setFormName('');
    setFormAmount('5000');
    setFormDescription('Annual academic fee category');
    setFormClasses('All Classes (1 to 10)');
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (cat: FeeCategoryItem) => {
    setEditingCat(cat);
    setFormName(cat.name);
    setFormAmount(String(cat.amount));
    setFormDescription(cat.description);
    setFormClasses(cat.applicableClasses);
    setShowAddEditModal(true);
  };

  const handleSaveCategory = () => {
    if (!formName.trim()) {
      showToast('Missing Name', 'Please enter category name.', 'warning');
      return;
    }
    const amt = parseFloat(formAmount) || 0;

    if (editingCat) {
      setCategories(prev => prev.map(c => c.id === editingCat.id ? {
        ...c,
        name: formName,
        amount: amt,
        description: formDescription || 'School fee structure component',
        applicableClasses: formClasses || 'All Classes'
      } : c));
      showToast('Category Updated', `${formName} updated successfully.`, 'success');
    } else {
      const newCat: FeeCategoryItem = {
        id: `cat_${Date.now()}`,
        name: formName,
        amount: amt,
        description: formDescription || 'School fee structure component',
        status: 'Active',
        applicableClasses: formClasses || 'All Classes'
      };
      setCategories(prev => [newCat, ...prev]);
      showToast('Category Created', `${formName} added to fee structure.`, 'success');
    }

    setShowAddEditModal(false);
  };

  const handleConfirmDeleteCategory = () => {
    if (!deletingCat) return;
    const name = deletingCat.name;
    setCategories(prev => prev.filter(c => c.id !== deletingCat.id));
    setDeletingCat(null);
    showToast('Category Deleted', `${name} removed from fee categories.`, 'warning');
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';

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
        title="Fee Structure & Categories"
        subtitle={isSuperAdmin ? "Super Admin Category Allotments" : "School Fee Allotments & Amounts"}
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <Tags size={20} color={primaryColor} />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Ribbon & Add Button */}
        <View className="px-5 mb-5 flex-row justify-between items-center">
          <View className="flex-1 mr-3">
            <View className={`bg-[#101415] border rounded-2xl flex-row items-center px-3.5 py-2.5 shadow-md ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-white/15'}`}>
              <Search size={16} color={primaryColor} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search category name or description..."
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

          <Pressable
            onPress={handleOpenAdd}
            className={`${primaryBtnClass} px-4 py-2.5 rounded-2xl flex-row items-center shadow-lg`}
          >
            <Plus size={16} color="#101415" style={{ marginRight: 4 }} />
            <Text className="text-[#101415] text-xs font-extrabold">Add Category</Text>
          </Pressable>
        </View>

        {/* Fee Category List Cards */}
        <View className="px-5">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Configured Fee Structure Categories ({filteredCategories.length})</Text>

          {filteredCategories.map(cat => (
            <GlassCard key={cat.id} intensity="low" className={`mb-4 p-4 border bg-[#101415]/90 ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-white/10'}`}>
              <View className="flex-row justify-between items-start pb-3 border-b border-white/10 mb-3">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className={`w-10 h-10 rounded-2xl items-center justify-center mr-3 ${primaryBadgeClass}`}>
                    <Tags size={20} color={primaryColor} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-white font-extrabold text-base mr-2">{cat.name}</Text>
                      <View className={`px-2 py-0.5 rounded-md ${primaryBadgeClass}`}>
                        <Text className={`${primaryTextClass} text-[9.5px] font-bold`}>{cat.status}</Text>
                      </View>
                    </View>
                    <Text className={`${primaryTextClass} font-extrabold text-sm mt-0.5`}>₹{cat.amount.toLocaleString()} <Text className="text-white/40 text-[10px] font-normal">/ student</Text></Text>
                  </View>
                </View>

                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Pressable
                    onPress={() => handleOpenEdit(cat)}
                    className="bg-white/5 border border-white/10 p-2 rounded-xl"
                  >
                    <Pencil size={14} color="rgba(255,255,255,0.7)" />
                  </Pressable>

                  <Pressable
                    onPress={() => setDeletingCat(cat)}
                    className="bg-rose-500/10 border border-rose-500/30 p-2 rounded-xl"
                  >
                    <Trash2 size={14} color="#ff516a" />
                  </Pressable>
                </View>
              </View>

              <Text className="text-white/70 text-xs leading-relaxed mb-3">{cat.description}</Text>

              <View className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex-row justify-between items-center">
                <Text className="text-white/40 text-[10px] font-bold uppercase">Applicability</Text>
                <Text className="text-sky-300 text-xs font-bold">{cat.applicableClasses}</Text>
              </View>
            </GlassCard>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ADD / EDIT CATEGORY MODAL */}
      <Modal visible={showAddEditModal} transparent animationType="slide" onRequestClose={() => setShowAddEditModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-md p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-2xl' : 'border-[#00f1a1]/40 shadow-2xl'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <Text className="text-white font-bold text-base">{editingCat ? 'Edit Fee Category' : 'Create Fee Category'}</Text>
              <Pressable onPress={() => setShowAddEditModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Category Name *</Text>
                <TextInput
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g. Science Laboratory Fee"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Fee Amount (₹) *</Text>
                <TextInput
                  value={formAmount}
                  onChangeText={setFormAmount}
                  keyboardType="numeric"
                  placeholder="5000"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs font-mono"
                />
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Applicable Classes</Text>
                <TextInput
                  value={formClasses}
                  onChangeText={setFormClasses}
                  placeholder="e.g. Classes 8 to 10"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Category Description</Text>
                <TextInput
                  value={formDescription}
                  onChangeText={setFormDescription}
                  multiline
                  numberOfLines={3}
                  placeholder="Details regarding fee usage and allocation..."
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
              <Pressable onPress={handleSaveCategory} className={`flex-1 py-3 rounded-xl ${primaryBtnClass} items-center shadow-lg`}>
                <Text className="text-[#101415] font-extrabold text-xs">
                  {editingCat ? 'Update Category' : 'Save Category'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CONFIRM DELETE CATEGORY MODAL */}
      <Modal visible={Boolean(deletingCat)} transparent animationType="fade" onRequestClose={() => setDeletingCat(null)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-rose-500/50 rounded-3xl w-full max-w-sm p-6 items-center shadow-[0_0_30px_rgba(255,81,106,0.3)]">
            <View className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/50 items-center justify-center mb-4">
              <Trash2 size={28} color="#ff516a" />
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">Delete Fee Category?</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">
              Are you sure you want to remove "{deletingCat?.name}" from fee categories?
            </Text>

            <View className="flex-row w-full" style={{ gap: 10 }}>
              <Pressable onPress={() => setDeletingCat(null)} className="flex-1 py-3.5 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmDeleteCategory} className="flex-1 py-3.5 rounded-xl bg-rose-500 items-center shadow-[0_0_12px_rgba(255,81,106,0.4)]">
                <Text className="text-white font-extrabold text-xs">Delete Category</Text>
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

export default FeeCategoryScreen;
