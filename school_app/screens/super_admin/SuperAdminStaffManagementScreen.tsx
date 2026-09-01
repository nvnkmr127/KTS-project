import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Edit3,
  UserCheck,
  UserX,
  Clock,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  GraduationCap,
  FileText,
  DollarSign,
  Fingerprint,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  Shield,
  Eye,
  Download,
  Award,
  Layers,
  Users,
  CheckCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';
import { useResponsive } from '../../utils/responsive';

import { useStaffStore, StaffMember, INITIAL_STAFF_MEMBERS } from '../../store/staffStore';

export const SuperAdminStaffManagementScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isSmallPhone, isTablet, insets, headerPaddingTop, scrollBottomPadding, containerStyle } = useResponsive();

  const { staffList, loading, fetchStaff, addStaff, updateStaff, deleteStaff } = useStaffStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Teaching' | 'Non-Teaching' | 'Admin' | 'Support'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'On Leave' | 'Resigned'>('All');

  // Modals state
  const [addEditModalVisible, setAddEditModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formCategory, setFormCategory] = useState<'Teaching' | 'Non-Teaching' | 'Admin' | 'Support'>('Teaching');
  const [formSubject, setFormSubject] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formJoinDate, setFormJoinDate] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formQualifications, setFormQualifications] = useState('');
  const [formBiometricCode, setFormBiometricCode] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'On Leave' | 'Resigned'>('Active');

  // Custom Alert Modal State
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

  // Sync staff on mount
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Robust Filtered staff records (case-insensitive & category-aware)
  const filteredStaff = useMemo(() => {
    const list = staffList && staffList.length > 0 ? staffList : INITIAL_STAFF_MEMBERS;
    return list.filter((s) => {
      const q = (searchQuery || '').toLowerCase().trim();
      const name = (s.name || '').toLowerCase();
      const desig = (s.designation || '').toLowerCase();
      const dept = (s.department || '').toLowerCase();
      const bio = (s.biometric_employee_code || '').toLowerCase();
      const phone = s.phone || '';
      const email = (s.email || '').toLowerCase();

      const matchesQuery =
        !q ||
        name.includes(q) ||
        desig.includes(q) ||
        dept.includes(q) ||
        bio.includes(q) ||
        phone.includes(q) ||
        email.includes(q);

      const sCat = (s.category || 'Teaching').toLowerCase();
      const filterCat = categoryFilter.toLowerCase();
      const matchesCat =
        categoryFilter === 'All' ||
        sCat === filterCat ||
        (filterCat === 'teaching' && sCat === 'teaching') ||
        (filterCat === 'admin' && sCat === 'admin') ||
        (filterCat === 'support' && (sCat === 'support' || sCat.includes('fleet') || sCat.includes('logistics'))) ||
        (filterCat === 'non-teaching' && (sCat === 'non-teaching' || sCat === 'support' || sCat.includes('account') || sCat.includes('finance')));

      const sStatus = (s.status || 'Active').toLowerCase();
      const filterStatus = statusFilter.toLowerCase();
      const matchesStatus =
        statusFilter === 'All' ||
        sStatus === filterStatus ||
        (filterStatus === 'active' && sStatus === 'active') ||
        (filterStatus === 'on leave' && (sStatus.includes('leave') || sStatus === 'on leave' || sStatus === 'on_leave')) ||
        (filterStatus === 'resigned' && (sStatus.includes('resign') || sStatus.includes('inactive')));

      return matchesQuery && matchesCat && matchesStatus;
    });
  }, [staffList, searchQuery, categoryFilter, statusFilter]);

  // KPI calculations
  const listForKPI = staffList && staffList.length > 0 ? staffList : INITIAL_STAFF_MEMBERS;
  const totalStaffCount = listForKPI.length;
  const teachingCount = listForKPI.filter((s) => (s.category || '').toLowerCase() === 'teaching').length;
  const nonTeachingCount = listForKPI.filter((s) => (s.category || '').toLowerCase() !== 'teaching').length;
  const onLeaveCount = listForKPI.filter((s) => (s.status || '').toLowerCase().includes('leave')).length;

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormName('');
    setFormDesignation('');
    setFormDepartment('');
    setFormCategory('Teaching');
    setFormSubject('');
    setFormPhone('');
    setFormEmail('');
    setFormJoinDate(new Date().toISOString().split('T')[0]);
    setFormSalary('45000');
    setFormQualifications('');
    setFormBiometricCode(`BIO-${Math.floor(100 + Math.random() * 900)}`);
    setFormStatus('Active');
    setAddEditModalVisible(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormName(staff.name);
    setFormDesignation(staff.designation);
    setFormDepartment(staff.department);
    setFormCategory(staff.category);
    setFormSubject(staff.subject || '');
    setFormPhone(staff.phone);
    setFormEmail(staff.email);
    setFormJoinDate(staff.join_date);
    setFormSalary(String(staff.salary));
    setFormQualifications(staff.qualifications);
    setFormBiometricCode(staff.biometric_employee_code || '');
    setFormStatus(staff.status);
    setAddEditModalVisible(true);
  };

  // Navigate to Full Screen Staff Dossier & Profile
  const handleOpenStaffDetails = (staff: StaffMember) => {
    navigation.navigate('SuperAdminStaffDetails', { staffId: staff.id, staff });
  };

  // Save Staff (Add or Edit)
  const handleSaveStaff = async () => {
    if (!formName.trim() || !formDesignation.trim() || !formDepartment.trim()) {
      showCustomAlert('Validation Error', 'Please enter Full Name, Designation, and Department.', 'error');
      return;
    }

    const salaryNum = parseFloat(formSalary.trim()) || 0;

    if (editingStaff) {
      // Edit existing staff
      const updatedMember: StaffMember = {
        ...editingStaff,
        name: formName.trim(),
        designation: formDesignation.trim(),
        department: formDepartment.trim(),
        category: formCategory,
        subject: formSubject.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        join_date: formJoinDate.trim() || editingStaff.join_date,
        salary: salaryNum,
        qualifications: formQualifications.trim(),
        biometric_employee_code: formBiometricCode.trim(),
        status: formStatus,
      };

      updateStaff(updatedMember);

      try {
        api.updateResource('faculty', editingStaff.id, updatedMember).catch(() => {});
      } catch (_) {}

      setAddEditModalVisible(false);
      showCustomAlert('Success', `Staff member ${updatedMember.name} updated successfully.`, 'success');
    } else {
      // Create new staff
      const newMember: StaffMember = {
        id: `st_${Date.now()}`,
        name: formName.trim(),
        designation: formDesignation.trim(),
        department: formDepartment.trim(),
        category: formCategory,
        subject: formSubject.trim(),
        phone: formPhone.trim() || '+91 98450 00000',
        email: formEmail.trim() || `${formName.toLowerCase().replace(/\s+/g, '.')}@krishnaveni.edu`,
        join_date: formJoinDate.trim() || new Date().toISOString().split('T')[0],
        attendance_percentage: 100,
        status: formStatus,
        salary: salaryNum,
        qualifications: formQualifications.trim() || 'Degree Holder',
        documents: ['Aadhaar Card', 'Degree Certificate'],
        biometric_employee_code: formBiometricCode.trim() || `BIO-${Math.floor(100 + Math.random() * 900)}`,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
      };

      addStaff(newMember);

      try {
        api.createResource('faculty', newMember).catch(() => {});
      } catch (_) {}

      setAddEditModalVisible(false);
      showCustomAlert('Success', `New faculty ${newMember.name} onboarded into directory.`, 'success');
    }
  };

  // Delete Staff
  const handleDeleteStaff = (staff: StaffMember) => {
    showCustomAlert(
      'Move to Recycle Bin',
      `Are you sure you want to delete ${staff.name} from active staff? They can be restored from the Recycle Bin.`,
      'confirm_delete',
      async () => {
        deleteStaff(staff.id);
        try {
          api.deleteResource('faculty', staff.id).catch(() => {});
        } catch (_) {}
        setCustomAlert((prev) => ({ ...prev, visible: false }));
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

      {/* Header matching Super Admin Dark Gold Luxury Theme */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20 active:scale-95"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <ArrowLeft size={18} color="#ffe5a0" />
            </Pressable>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-lg md:text-xl font-bold text-white font-display-lg">
                Staff Management
              </Text>
              <Text numberOfLines={1} className="text-[9px] uppercase tracking-widest text-[#ffe5a0] font-bold">
                FACULTY & PERSONNEL DIRECTORY
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleOpenAddModal}
            className="w-10 h-10 rounded-xl bg-[#f0c110] items-center justify-center active:scale-95 shadow-[0_0_15px_rgba(240,193,16,0.5)]"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Plus size={20} color="#101415" strokeWidth={3} />
          </Pressable>
        </BlurView>

        {/* Glow Line below Header */}
        <LinearGradient
          colors={['rgba(245, 197, 24, 0.15)', 'transparent']}
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Stat Cards (4 columns) */}
        <View className="px-5 mb-5 flex-row flex-wrap justify-between" style={{ gap: 8 }}>
          <GlassCard
            className="w-[23%] p-2.5 border border-white/10 items-center"
            style={{ backgroundColor: '#1d2122' }}
          >
            <Text className="text-white/40 text-[8.5px] font-bold uppercase text-center">Total Staff</Text>
            <Text className="text-white text-lg font-extrabold mt-0.5">{totalStaffCount}</Text>
          </GlassCard>

          <GlassCard
            className="w-[23%] p-2.5 border border-white/10 items-center"
            style={{ backgroundColor: '#1d2122' }}
          >
            <Text className="text-white/40 text-[8.5px] font-bold uppercase text-center">Teaching</Text>
            <Text className="text-[#ffe5a0] text-lg font-extrabold mt-0.5">{teachingCount}</Text>
          </GlassCard>

          <GlassCard
            className="w-[23%] p-2.5 border border-white/10 items-center"
            style={{ backgroundColor: '#1d2122' }}
          >
            <Text className="text-white/40 text-[8.5px] font-bold uppercase text-center">Admin/Supp</Text>
            <Text className="text-[#41eec2] text-lg font-extrabold mt-0.5">{nonTeachingCount}</Text>
          </GlassCard>

          <GlassCard
            className="w-[23%] p-2.5 border border-white/10 items-center"
            style={{ backgroundColor: '#1d2122' }}
          >
            <Text className="text-white/40 text-[8.5px] font-bold uppercase text-center">On Leave</Text>
            <Text className="text-rose-400 text-lg font-extrabold mt-0.5">{onLeaveCount}</Text>
          </GlassCard>
        </View>

        {/* Search Bar */}
        <View className="px-5 mb-4">
          <View className="bg-black/40 border border-white/15 rounded-2xl px-3.5 py-2.5 flex-row items-center shadow-lg">
            <Search size={18} color="#ffe5a0" style={{ marginRight: 10 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search faculty name, subject, bio code, email..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="flex-1 text-white text-xs font-semibold"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} className="p-1">
                <X size={14} color="#ffe5a0" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Category Filters Ribbon */}
        <View className="px-5 mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {(['All', 'Teaching', 'Non-Teaching', 'Admin', 'Support'] as const).map((cat) => {
                const isSel = categoryFilter === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-xl border ${
                      isSel ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-white/5 border-white/15'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${isSel ? 'text-[#101415]' : 'text-white/70'}`}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Status Filters Ribbon */}
        <View className="px-5 mb-5 flex-row justify-between items-center">
          <View className="flex-row" style={{ gap: 6 }}>
            {(['All', 'Active', 'On Leave', 'Resigned'] as const).map((st) => {
              const isSel = statusFilter === st;
              return (
                <Pressable
                  key={st}
                  onPress={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg border ${
                    isSel ? 'bg-[#ffe5a0]/20 border-[#ffe5a0]/40' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <Text className={`text-[10px] font-bold ${isSel ? 'text-[#ffe5a0]' : 'text-white/50'}`}>
                    {st}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="text-[#ffe5a0] text-[10px] font-bold uppercase tracking-wider">
            {filteredStaff.length} RECORD{filteredStaff.length === 1 ? '' : 'S'}
          </Text>
        </View>

        {/* Staff Directory List */}
        <View className="px-5 mb-8">
          {filteredStaff.length === 0 ? (
            <GlassCard className="p-8 items-center justify-center border border-white/10" style={{ backgroundColor: '#1d2122' }}>
              <Users size={32} color="#ffe5a0" style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text className="text-white font-bold text-sm">No Staff Members Found</Text>
              <Text className="text-white/40 text-xs mt-1 text-center">
                Try adjusting your search criteria or add a new faculty member.
              </Text>
            </GlassCard>
          ) : (
            filteredStaff.map((staff) => (
              <GlassCard
                key={staff.id}
                className="p-4 mb-3.5 border border-white/10"
                style={{
                  backgroundColor: '#1d2122',
                  shadowColor: '#f0c110',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {/* Top Row: Avatar + Info + Status Pill */}
                <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-white/10">
                  <Pressable
                    onPress={() => handleOpenStaffDetails(staff)}
                    className="flex-row items-center flex-1 mr-2 active:opacity-80"
                  >
                    <Image
                      source={{ uri: staff.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150' }}
                      className="w-12 h-12 rounded-2xl border border-white/15 mr-3"
                    />
                    <View className="flex-1 pr-1">
                      <Text className="text-white font-extrabold text-sm" numberOfLines={1}>
                        {staff.name}
                      </Text>
                      <Text className="text-[#ffe5a0] text-[11px] font-bold mt-0.5" numberOfLines={1}>
                        {staff.designation} • {staff.department}
                      </Text>
                      {staff.subject ? (
                        <Text className="text-white/40 text-[10px] mt-0.5" numberOfLines={1}>
                          {staff.subject}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>

                  <View
                    className={`px-2.5 py-1 rounded-full border ${
                      staff.status === 'Active'
                        ? 'bg-[#41eec2]/15 border-[#41eec2]/30'
                        : staff.status === 'On Leave'
                        ? 'bg-rose-500/15 border-rose-500/30'
                        : 'bg-white/10 border-white/20'
                    }`}
                  >
                    <Text
                      className={`text-[9.5px] font-extrabold uppercase ${
                        staff.status === 'Active'
                          ? 'text-[#41eec2]'
                          : staff.status === 'On Leave'
                          ? 'text-rose-400'
                          : 'text-white/60'
                      }`}
                    >
                      {staff.status}
                    </Text>
                  </View>
                </View>

                {/* Details Metrics Ribbon */}
                <View className="flex-row justify-between items-center flex-wrap bg-black/40 p-2.5 rounded-xl border border-white/5 mb-3" style={{ gap: 6 }}>
                  <View className="flex-row items-center">
                    <Fingerprint size={12} color="#ffe5a0" style={{ marginRight: 4 }} />
                    <Text className="text-[#ffe5a0] text-[11px] font-mono font-bold">
                      {staff.biometric_employee_code || 'BIO-N/A'}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Clock size={12} color="#41eec2" style={{ marginRight: 4 }} />
                    <Text className="text-white/80 text-[11px] font-bold">
                      Attn: <Text className="text-[#41eec2]">{staff.attendance_percentage}%</Text>
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <DollarSign size={12} color="#f0c110" style={{ marginRight: 2 }} />
                    <Text className="text-white/80 text-[11px] font-bold">
                      ₹{(staff.salary || 0).toLocaleString('en-IN')}/mo
                    </Text>
                  </View>
                </View>

                {/* Contact & Action Buttons */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1 mr-2 gap-3">
                    <View className="flex-row items-center">
                      <Phone size={11} color="rgba(255,255,255,0.4)" style={{ marginRight: 3 }} />
                      <Text className="text-white/60 text-[10px] font-semibold">{staff.phone}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-1.5">
                    {/* View Details Button */}
                    <Pressable
                      onPress={() => handleOpenStaffDetails(staff)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/15 flex-row items-center active:bg-white/20"
                    >
                      <Eye size={12} color="#ffe5a0" style={{ marginRight: 4 }} />
                      <Text className="text-[#ffe5a0] text-[10px] font-bold">Profile</Text>
                    </Pressable>

                    {/* Edit Button */}
                    <Pressable
                      onPress={() => handleOpenEditModal(staff)}
                      className="w-7 h-7 rounded-lg bg-[#f0c110]/15 border border-[#f0c110]/30 items-center justify-center active:bg-[#f0c110]/30"
                    >
                      <Edit3 size={13} color="#f0c110" />
                    </Pressable>

                    {/* Delete Button */}
                    <Pressable
                      onPress={() => handleDeleteStaff(staff)}
                      className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 items-center justify-center active:bg-red-500/30"
                    >
                      <Trash2 size={13} color="#ffb4ab" />
                    </Pressable>
                  </View>
                </View>
              </GlassCard>
            ))
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ================= ADD / EDIT STAFF MODAL ================= */}
      <Modal
        visible={addEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCardContainer}>
            <GlassCard
              className="p-6 border border-white/15 max-h-[85vh]"
              style={{
                backgroundColor: '#16191b',
                borderRadius: 28,
                shadowColor: '#f0c110',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
              }}
            >
              {/* Modal Header */}
              <View className="flex-row items-center justify-between pb-4 border-b border-white/10 mb-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-[#f0c110]/15 border border-[#f0c110]/30 items-center justify-center">
                    <Briefcase size={20} color="#f0c110" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-base">
                      {editingStaff ? 'Edit Staff Profile' : 'Onboard New Faculty'}
                    </Text>
                    <Text className="text-[#ffe5a0] text-[10px] uppercase tracking-wider font-bold">
                      {editingStaff ? `ID: ${editingStaff.id}` : 'ENTER DETAILS'}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setAddEditModalVisible(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                >
                  <X size={16} color="#FFF" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="pr-1">
                {/* Full Name */}
                <View className="mb-3">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">Full Name *</Text>
                  <TextInput
                    value={formName}
                    onChangeText={setFormName}
                    placeholder="e.g. Dr. Julian Vance"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                  />
                </View>

                {/* Designation & Department */}
                <View className="flex-row gap-2.5 mb-3">
                  <View className="flex-1">
                    <Text className="text-white/70 text-xs font-bold mb-1.5">Designation *</Text>
                    <TextInput
                      value={formDesignation}
                      onChangeText={setFormDesignation}
                      placeholder="e.g. Senior Faculty"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white/70 text-xs font-bold mb-1.5">Department *</Text>
                    <TextInput
                      value={formDepartment}
                      onChangeText={setFormDepartment}
                      placeholder="e.g. Physics"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                    />
                  </View>
                </View>

                {/* Category Selector */}
                <View className="mb-3">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">Category *</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(['Teaching', 'Non-Teaching', 'Admin', 'Support'] as const).map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => setFormCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl border ${
                          formCategory === cat ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-black/40 border-white/15'
                        }`}
                      >
                        <Text className={`text-xs font-bold ${formCategory === cat ? 'text-[#101415]' : 'text-white/70'}`}>
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Subject Specialization */}
                <View className="mb-3">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">Subject / Specialization</Text>
                  <TextInput
                    value={formSubject}
                    onChangeText={setFormSubject}
                    placeholder="e.g. Higher Secondary Physics"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                  />
                </View>

                {/* Phone & Email */}
                <View className="flex-row gap-2.5 mb-3">
                  <View className="flex-1">
                    <Text className="text-white/70 text-xs font-bold mb-1.5">Phone Number</Text>
                    <TextInput
                      value={formPhone}
                      onChangeText={setFormPhone}
                      placeholder="+91 98450 00000"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      keyboardType="phone-pad"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white/70 text-xs font-bold mb-1.5">Email Address</Text>
                    <TextInput
                      value={formEmail}
                      onChangeText={setFormEmail}
                      placeholder="faculty@krishnaveni.edu"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                    />
                  </View>
                </View>

                {/* Salary & Biometric Code */}
                <View className="flex-row gap-2.5 mb-3">
                  <View className="flex-1">
                    <Text className="text-white/70 text-xs font-bold mb-1.5">Monthly CTC Salary (₹)</Text>
                    <TextInput
                      value={formSalary}
                      onChangeText={setFormSalary}
                      placeholder="45000"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      keyboardType="numeric"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white/70 text-xs font-bold mb-1.5">Biometric Code</Text>
                    <TextInput
                      value={formBiometricCode}
                      onChangeText={setFormBiometricCode}
                      placeholder="BIO-101"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      autoCapitalize="characters"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                    />
                  </View>
                </View>

                {/* Joining Date & Qualifications */}
                <View className="flex-row gap-2.5 mb-3">
                  <View className="flex-1">
                    <Text className="text-white/70 text-xs font-bold mb-1.5">Joining Date (DD-MM-YYYY)</Text>
                    <TextInput
                      value={formJoinDate}
                      onChangeText={setFormJoinDate}
                      placeholder="15-06-2021"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white/70 text-xs font-bold mb-1.5">Qualifications & Degrees</Text>
                    <TextInput
                      value={formQualifications}
                      onChangeText={setFormQualifications}
                      placeholder="e.g. M.Sc., B.Ed"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                    />
                  </View>
                </View>

                {/* Status Selector */}
                <View className="mb-6">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">Employment Status</Text>
                  <View className="flex-row gap-2">
                    {(['Active', 'On Leave', 'Resigned'] as const).map((st) => (
                      <Pressable
                        key={st}
                        onPress={() => setFormStatus(st)}
                        className={`px-3.5 py-1.5 rounded-xl border ${
                          formStatus === st ? 'bg-[#ffe5a0] border-[#ffe5a0]' : 'bg-black/40 border-white/15'
                        }`}
                      >
                        <Text className={`text-xs font-bold ${formStatus === st ? 'text-[#101415]' : 'text-white/70'}`}>
                          {st}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Submit Action Button */}
                <Pressable
                  onPress={handleSaveStaff}
                  className="w-full py-3.5 rounded-xl bg-[#f0c110] items-center justify-center active:scale-95 shadow-md shadow-[#f0c110]/30 mb-2"
                >
                  <Text className="text-[#101415] text-xs font-extrabold uppercase tracking-wider">
                    {editingStaff ? 'Save Changes' : 'Confirm & Add Staff'}
                  </Text>
                </Pressable>
              </ScrollView>
            </GlassCard>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= CUSTOM ALERT DIALOG MODAL ================= */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
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
            }}
          >
            <View
              className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center border ${
                customAlert.type === 'confirm_delete' || customAlert.type === 'error'
                  ? 'bg-red-500/15 border-red-500/30'
                  : 'bg-[#f0c110]/15 border-[#f0c110]/30'
              }`}
            >
              {customAlert.type === 'confirm_delete' || customAlert.type === 'error' ? (
                <AlertTriangle size={24} color="#ffb4ab" />
              ) : (
                <Check size={24} color="#f0c110" strokeWidth={3} />
              )}
            </View>

            <Text className="text-white text-lg font-bold font-display-md text-center mb-2">
              {customAlert.title}
            </Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-6 px-1">
              {customAlert.message}
            </Text>

            {customAlert.type === 'confirm_delete' ? (
              <View className="flex-row gap-2 w-full">
                <Pressable
                  onPress={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
                  className="flex-1 py-3 rounded-xl bg-white/10 border border-white/15 items-center active:scale-95"
                >
                  <Text className="text-white text-xs font-bold uppercase">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => customAlert.onConfirm && customAlert.onConfirm()}
                  className="flex-1 py-3 rounded-xl bg-red-600 items-center active:scale-95 shadow-md shadow-red-600/30"
                >
                  <Text className="text-white text-xs font-bold uppercase">Delete</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
                className="w-full py-3.5 rounded-xl bg-[#f0c110] items-center active:scale-95 shadow-md shadow-[#f0c110]/30"
              >
                <Text className="text-[#101415] text-xs font-bold uppercase tracking-wider">Dismiss</Text>
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
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCardContainer: {
    width: '100%',
    maxWidth: 480,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SuperAdminStaffManagementScreen;
