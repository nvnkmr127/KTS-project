import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  TextInput,
  Modal,
  KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Plus, X, Edit3, Banknote, Landmark, Check, AlertTriangle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';
import { useFeeStore, GradeFee, Category } from '../../store/useFeeStore';

export const AssignFeeStructureScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // Load from global Zustand store
  const { categories, feeData, updateClassFee, addCategory, removeCategory } = useFeeStore();

  // Modals visibility states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // Editing selection states
  const [selectedGrade, setSelectedGrade] = useState<GradeFee | null>(null);
  const [editFees, setEditFees] = useState<Record<string, string>>({});

  // New category creation form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryAmount, setNewCategoryAmount] = useState('');

  // Custom alert dialog state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'confirm_delete';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showCustomAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'confirm_delete',
    onConfirm?: () => void
  ) => {
    setCustomAlert({ visible: true, title, message, type, onConfirm });
  };

  // Calculate stats
  const calculateTotalFeesPerClass = (gradeFee: GradeFee) => {
    return Object.values(gradeFee.fees).reduce((sum, val) => sum + val, 0);
  };

  const getOverallAverage = () => {
    const totals = feeData.map(calculateTotalFeesPerClass);
    const sum = totals.reduce((acc, t) => acc + t, 0);
    return Math.round(sum / feeData.length);
  };

  const getProjectedRevenue = () => {
    // Estimating 100 students per grade
    const totals = feeData.map(calculateTotalFeesPerClass);
    const sum = totals.reduce((acc, t) => acc + t, 0);
    return sum * 100;
  };

  // Open edit modal for specific grade
  const handleOpenEditModal = (gradeFee: GradeFee) => {
    setSelectedGrade(gradeFee);
    const initialInputs: Record<string, string> = {};
    categories.forEach(cat => {
      initialInputs[cat.key] = (gradeFee.fees[cat.key] || 0).toString();
    });
    setEditFees(initialInputs);
    setEditModalVisible(true);
  };

  // Save edited fees for a grade
  const handleSaveGradeFees = () => {
    if (!selectedGrade) return;

    // Validate inputs and call global store update function
    for (const cat of categories) {
      const inputVal = editFees[cat.key] || '0';
      const numVal = parseInt(inputVal, 10);
      if (isNaN(numVal) || numVal < 0) {
        showCustomAlert('Validation Error', `Please enter a valid positive number for ${cat.label}`, 'error');
        return;
      }
      updateClassFee(selectedGrade.grade, cat.key, numVal);
    }

    setEditModalVisible(false);
    setSelectedGrade(null);
    showCustomAlert('Success', `${selectedGrade.grade} fee structure has been updated.`, 'success');
  };

  // Create new category in global store
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      showCustomAlert('Validation Error', 'Category name is required.', 'error');
      return;
    }

    const defaultAmt = parseInt(newCategoryAmount || '0', 10);
    if (isNaN(defaultAmt) || defaultAmt < 0) {
      showCustomAlert('Validation Error', 'Please enter a valid positive default amount.', 'error');
      return;
    }

    const key = newCategoryName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Check if category key already exists
    if (categories.some(c => c.key === key)) {
      showCustomAlert('Duplicate Category', 'A category with this name already exists.', 'error');
      return;
    }

    addCategory(newCategoryName.trim(), defaultAmt);

    // Reset fields and close modal
    setNewCategoryName('');
    setNewCategoryAmount('');
    setCategoryModalVisible(false);
    showCustomAlert('Success', `New category "${newCategoryName.trim()}" has been successfully added to all grades.`, 'success');
  };

  // Confirm deletion of category
  const handleConfirmDeleteCategory = (cat: Category) => {
    const isCore = cat.key === 'tuition' || cat.key === 'transport';
    const warningMessage = isCore
      ? `WARNING: "${cat.label}" is a core system category. Deleting it may alter default views. Are you sure you want to proceed?`
      : `Are you sure you want to delete the category "${cat.label}"? This will permanently remove this fee category from all grade structures.`;

    showCustomAlert(
      isCore ? 'Delete Core Category' : 'Remove Fee Category',
      warningMessage,
      'confirm_delete',
      () => {
        removeCategory(cat.key);
      }
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1d2022', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={{ zIndex: 50 }}>
        <BlurView
          intensity={30}
          tint="dark"
          style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 28 : 20) }]}
        >
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => navigation.goBack()} className="p-1 active:scale-95">
              <ChevronLeft size={24} color="#ffe5a0" />
            </Pressable>
            <Text className="text-xl font-bold text-white font-display-lg">Assign Fee Structure</Text>
          </View>
          <Pressable
            onPress={() => setCategoryModalVisible(true)}
            className="bg-[#f0c110] px-4 py-2 rounded-full flex-row items-center gap-1 active:scale-95 shadow-[0_0_12px_rgba(240,193,16,0.3)]"
          >
            <Plus size={16} color="#000" />
            <Text className="text-[#000] text-xs font-bold font-label-md">Add Category</Text>
          </Pressable>
        </BlurView>
        <LinearGradient
          colors={['rgba(245, 197, 24, 0.12)', 'transparent']}
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ERP Info & Summary Stats */}
        <View className="px-5 mb-6">
          <GlassCard className="p-5 border border-white/10" intensity="low">
            <Text className="text-[#ffe5a0] font-bold text-sm mb-3">Finance Console Overview</Text>
            <View className="flex-row justify-between items-center">
              <View className="gap-1">
                <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Projected Revenue</Text>
                <Text className="text-white text-xl font-black">${getProjectedRevenue().toLocaleString()}</Text>
              </View>
              <View className="w-[1px] h-8 bg-white/10" />
              <View className="gap-1">
                <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Average Fee / Grade</Text>
                <Text className="text-[#ffe5a0] text-xl font-black">${getOverallAverage().toLocaleString()}</Text>
              </View>
              <View className="w-[1px] h-8 bg-white/10" />
              <View className="gap-1">
                <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Categories</Text>
                <Text className="text-[#41eec2] text-xl font-black">{categories.length}</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Categories List Horizontal Banner */}
        <View className="px-5 mb-6">
          <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Active Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {categories.map(cat => (
              <View
                key={cat.key}
                className="bg-white/5 border border-white/10 pl-4 pr-3 py-2.5 rounded-full mr-3 flex-row items-center gap-2"
              >
                <View className="w-2 h-2 rounded-full bg-[#f5c518]" />
                <Text className="text-white/80 text-xs font-semibold">{cat.label}</Text>
                <Text className="text-white/40 text-[10px] font-medium">(${cat.defaultAmount})</Text>

                <Pressable
                  onPress={() => handleConfirmDeleteCategory(cat)}
                  className="p-1 rounded-full bg-white/10 active:bg-red-500/20"
                >
                  <X size={12} color="#ffb4ab" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Grade Cards List */}
        <View className="px-5 mb-10 gap-4">
          <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider">Grade Breakdowns</Text>
          {feeData.map((item) => {
            const totalClassFee = calculateTotalFeesPerClass(item);
            return (
              <Pressable
                key={item.grade}
                onPress={() => handleOpenEditModal(item)}
                className="active:scale-[0.99] transition-all"
              >
                <GlassCard className="p-4 border border-white/10 flex-row items-center justify-between" intensity="low">
                  <View className="flex-1 pr-4">
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-white text-base font-bold font-display-md">{item.grade}</Text>
                      <Text className="text-[#ffe5a0] text-sm font-bold">${totalClassFee.toLocaleString()} / yr</Text>
                    </View>

                    {/* Categories breakdowns */}
                    <View className="flex-row flex-wrap gap-x-4 gap-y-1.5">
                      {categories.map(cat => (
                        <View key={cat.key} className="flex-row items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                          <Text className="text-white/40 text-[10px] font-semibold uppercase">{cat.label.split(' ')[0]}</Text>
                          <Text className="text-white/80 text-[11px] font-bold">${item.fees[cat.key] || 0}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View className="w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center">
                    <Edit3 size={14} color="#ffe5a0" />
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* MODAL 1: Edit Grade Fees */}
      {selectedGrade && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContent}
            >
              <View className="p-6">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                  <View className="flex-row items-center gap-2">
                    <Banknote size={20} color="#ffe5a0" />
                    <Text className="text-white text-xl font-bold font-display-lg">Edit Fees: {selectedGrade.grade}</Text>
                  </View>
                  <Pressable
                    onPress={() => setEditModalVisible(false)}
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center active:scale-95"
                  >
                    <X size={16} color="#fff" />
                  </Pressable>
                </View>

                {/* Edit Form */}
                <ScrollView className="max-h-[300px] mb-6">
                  {categories.map((cat) => (
                    <View key={cat.key} className="mb-4">
                      <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">{cat.label} ($)</Text>
                      <View className="flex-row items-center bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
                        <TextInput
                          keyboardType="numeric"
                          value={editFees[cat.key]}
                          onChangeText={(text) => setEditFees(prev => ({ ...prev, [cat.key]: text }))}
                          placeholder={`Enter amount for ${cat.label}`}
                          placeholderTextColor="rgba(255,255,255,0.25)"
                          className="flex-1 text-white font-bold text-sm"
                        />
                      </View>
                    </View>
                  ))}
                </ScrollView>

                {/* Action Buttons */}
                <View className="flex-row justify-end gap-3 border-t border-white/10 pt-4">
                  <Pressable
                    onPress={() => setEditModalVisible(false)}
                    className="px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 active:bg-white/10"
                  >
                    <Text className="text-white/60 text-xs font-bold uppercase tracking-wider">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveGradeFees}
                    className="px-6 py-3.5 rounded-2xl bg-[#f0c110] active:scale-95 shadow-[0_0_12px_rgba(240,193,16,0.3)] flex-row items-center gap-1.5"
                  >
                    <Check size={16} color="#000" />
                    <Text className="text-[#000] text-xs font-bold uppercase tracking-wider">Save Changes</Text>
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      )}

      {/* MODAL 2: Add New Category */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={categoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View className="p-6">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center gap-2">
                  <Landmark size={20} color="#ffe5a0" />
                  <Text className="text-white text-xl font-bold font-display-lg">New Fee Category</Text>
                </View>
                <Pressable
                  onPress={() => setCategoryModalVisible(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center active:scale-95"
                >
                  <X size={16} color="#fff" />
                </Pressable>
              </View>

              {/* Form */}
              <View className="mb-6">
                <View className="mb-4">
                  <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Category Name</Text>
                  <View className="flex-row items-center bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
                    <TextInput
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      placeholder="e.g. Science Lab Fee, Tech Fee"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      className="flex-1 text-white font-bold text-sm"
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Default Amount ($)</Text>
                  <View className="flex-row items-center bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
                    <TextInput
                      keyboardType="numeric"
                      value={newCategoryAmount}
                      onChangeText={setNewCategoryAmount}
                      placeholder="e.g. 250"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      className="flex-1 text-white font-bold text-sm"
                    />
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row justify-end gap-3 border-t border-white/10 pt-4">
                <Pressable
                  onPress={() => setCategoryModalVisible(false)}
                  className="px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 active:bg-white/10"
                >
                  <Text className="text-white/60 text-xs font-bold uppercase tracking-wider">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleCreateCategory}
                  className="px-6 py-3.5 rounded-2xl bg-[#f0c110] active:scale-95 shadow-[0_0_12px_rgba(240,193,16,0.3)] flex-row items-center gap-1.5"
                >
                  <Plus size={16} color="#000" />
                  <Text className="text-[#000] text-xs font-bold uppercase tracking-wider">Create Category</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Custom Dialog Alert Modal */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[85%] max-w-[340px] p-6 border border-white/10 items-center"
            style={{
              backgroundColor: '#16191b',
              borderRadius: 28,
              shadowColor: '#f0c110',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            {/* Header Icon */}
            <View className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center ${
              customAlert.type === 'error'
                ? 'bg-red-500/10 border border-red-500/20'
                : customAlert.type === 'confirm_delete'
                ? 'bg-[#f0c110]/15 border border-[#f0c110]/25'
                : 'bg-green-500/10 border border-green-500/20'
            }`}>
              {customAlert.type === 'error' ? (
                <X size={24} color="#ffb4ab" />
              ) : customAlert.type === 'confirm_delete' ? (
                <AlertTriangle size={24} color="#f0c110" />
              ) : (
                <Check size={24} color="#41eec2" />
              )}
            </View>

            {/* Title & Message */}
            <Text className="text-white text-lg font-bold font-display-md text-center mb-2">
              {customAlert.title}
            </Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-6 px-1">
              {customAlert.message}
            </Text>

            {/* Action Buttons */}
            {customAlert.type === 'confirm_delete' ? (
              <View className="flex-row gap-3 w-full">
                <Pressable
                  onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
                  className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 items-center active:scale-95"
                >
                  <Text className="text-white/60 text-xs font-bold uppercase tracking-wider">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setCustomAlert(prev => ({ ...prev, visible: false }));
                    if (customAlert.onConfirm) customAlert.onConfirm();
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-red-500 items-center active:scale-95 shadow-md shadow-red-500/30"
                >
                  <Text className="text-white text-xs font-bold uppercase tracking-wider">Delete</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
                className="w-full py-3.5 rounded-xl bg-[#f0c110] items-center active:scale-95 shadow-md shadow-[#f0c110]/30"
              >
                <Text className="text-[#000] text-xs font-bold uppercase tracking-wider">Dismiss</Text>
              </Pressable>
            )}
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101415',
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#16191b',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
});

export default AssignFeeStructureScreen;
