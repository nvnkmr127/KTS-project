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

export interface StaffMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  category: 'Teaching' | 'Non-Teaching' | 'Admin' | 'Support';
  subject?: string;
  phone: string;
  email: string;
  join_date: string;
  attendance_percentage: number;
  status: 'Active' | 'On Leave' | 'Resigned';
  salary: number;
  qualifications: string;
  documents?: string[];
  biometric_employee_code?: string;
  avatar?: string;
}

const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'st_1',
    name: 'Dr. Julian Vance',
    designation: 'Senior Faculty Head',
    department: 'Physics',
    category: 'Teaching',
    subject: 'Senior Physics',
    phone: '+91 98450 12345',
    email: 'julian.vance@krishnaveni.edu',
    join_date: '2021-06-15',
    attendance_percentage: 98.4,
    status: 'Active',
    salary: 65000,
    qualifications: 'Ph.D. in Physics, M.Sc.',
    documents: ['Aadhaar Card', 'Degree Certificate', 'Experience Letter'],
    biometric_employee_code: 'BIO-101',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
  },
  {
    id: 'st_2',
    name: 'Mrs. Sarah Jenkins',
    designation: 'Admin Operations Head',
    department: 'Administration',
    category: 'Admin',
    subject: 'Management',
    phone: '+91 98450 23456',
    email: 'sarah.jenkins@krishnaveni.edu',
    join_date: '2020-03-10',
    attendance_percentage: 96.2,
    status: 'Active',
    salary: 58000,
    qualifications: 'MBA in Operations, B.Com',
    documents: ['Aadhaar Card', 'Degree Certificate', 'Contract Agreement'],
    biometric_employee_code: 'BIO-102',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150',
  },
  {
    id: 'st_3',
    name: 'Prof. Michael Chen',
    designation: 'HOD Mathematics',
    department: 'Mathematics',
    category: 'Teaching',
    subject: 'Higher Calculus',
    phone: '+91 98450 34567',
    email: 'michael.chen@krishnaveni.edu',
    join_date: '2019-08-01',
    attendance_percentage: 92.0,
    status: 'On Leave',
    salary: 72000,
    qualifications: 'M.Sc. Mathematics, B.Ed',
    documents: ['Aadhaar Card', 'Degree Certificate'],
    biometric_employee_code: 'BIO-103',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150',
  },
  {
    id: 'st_4',
    name: 'Rajesh Sharma',
    designation: 'Senior Accountant',
    department: 'Accounts & Finance',
    category: 'Non-Teaching',
    subject: 'Finance',
    phone: '+91 98450 45678',
    email: 'rajesh.sharma@krishnaveni.edu',
    join_date: '2022-01-20',
    attendance_percentage: 95.5,
    status: 'Active',
    salary: 45000,
    qualifications: 'M.Com, Chartered Inter',
    documents: ['Aadhaar Card', 'Police Clearance', 'Degree Certificate'],
    biometric_employee_code: 'BIO-104',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150',
  },
  {
    id: 'st_5',
    name: 'Priya Nambiar',
    designation: 'Senior English Faculty',
    department: 'Languages',
    category: 'Teaching',
    subject: 'English Literature',
    phone: '+91 98450 56789',
    email: 'priya.nambiar@krishnaveni.edu',
    join_date: '2023-04-12',
    attendance_percentage: 97.1,
    status: 'Active',
    salary: 48000,
    qualifications: 'M.A. English, B.Ed',
    documents: ['Aadhaar Card', 'Degree Certificate'],
    biometric_employee_code: 'BIO-105',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150',
  },
  {
    id: 'st_6',
    name: 'Ramesh Goud',
    designation: 'Transport & Fleet Supervisor',
    department: 'Logistics',
    category: 'Support',
    subject: 'Fleet',
    phone: '+91 98450 67890',
    email: 'ramesh.goud@krishnaveni.edu',
    join_date: '2021-11-05',
    attendance_percentage: 94.0,
    status: 'Active',
    salary: 32000,
    qualifications: 'Diploma in Automobile Mechanics',
    documents: ['Aadhaar Card', 'Driving License', 'Police Clearance'],
    biometric_employee_code: 'BIO-106',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150',
  },
];

export const SuperAdminStaffManagementScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { headerPaddingTop } = useResponsive();

  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Teaching' | 'Non-Teaching' | 'Admin' | 'Support'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'On Leave' | 'Resigned'>('All');

  // Modals state
  const [addEditModalVisible, setAddEditModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'info' | 'attendance' | 'salary' | 'leaves'>('info');

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

  // Sync staff from backend API on mount
  useEffect(() => {
    const fetchStaffFromDb = async () => {
      setLoading(true);
      try {
        const staffData = await api.getResources('faculty');
        const extractArray = (res: any) =>
          Array.isArray(res)
            ? res
            : res?.data && Array.isArray(res.data)
            ? res.data
            : res?.data?.data && Array.isArray(res.data.data)
            ? res.data.data
            : [];
        const staffArr = extractArray(staffData);

        if (staffArr.length > 0) {
          const normalizedStaff: StaffMember[] = staffArr.map((s: any, idx: number) => ({
            id: String(s.id || `faculty_${idx}`),
            name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Staff Member',
            designation: s.designation || s.role || 'Faculty',
            department: s.department || 'General',
            category: (s.category || s.department_category || 'Teaching') as any,
            subject: s.subject || s.specialization || '',
            phone: s.phone || s.contact_number || '+91 98450 00000',
            email: s.email || 'staff@krishnaveni.edu',
            join_date: (s.join_date || s.created_at || '2023-01-01').split('T')[0],
            attendance_percentage: s.attendance_percentage || 95.0,
            status: s.status ? (s.status.charAt(0).toUpperCase() + s.status.slice(1)) as any : 'Active',
            salary: typeof s.salary === 'string' ? parseFloat(s.salary) : (s.salary || 45000),
            qualifications: s.qualifications || 'B.Ed, Graduate',
            documents: typeof s.documents === 'string' ? JSON.parse(s.documents) : (s.documents || ['Aadhaar Card', 'Degree Certificate']),
            biometric_employee_code: s.biometric_employee_code || s.employee_code || `BIO-${100 + idx}`,
            avatar: s.avatar || INITIAL_STAFF[idx % INITIAL_STAFF.length]?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
          }));
          setStaffList(normalizedStaff);
        }
      } catch (err) {
        console.log('Using offline initial staff records:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffFromDb();
  }, []);

  // Filtered staff records
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.designation.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        (s.biometric_employee_code && s.biometric_employee_code.toLowerCase().includes(q)) ||
        s.phone.includes(q) ||
        s.email.toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'All' || s.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;

      return matchesQuery && matchesCat && matchesStatus;
    });
  }, [staffList, searchQuery, categoryFilter, statusFilter]);

  // KPI calculations
  const totalStaffCount = staffList.length;
  const teachingCount = staffList.filter((s) => s.category === 'Teaching').length;
  const nonTeachingCount = staffList.filter((s) => s.category !== 'Teaching').length;
  const onLeaveCount = staffList.filter((s) => s.status === 'On Leave').length;

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

  // Open View Details Modal
  const handleOpenViewModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setActiveViewTab('info');
    setViewModalVisible(true);
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

      setStaffList((prev) => prev.map((s) => (s.id === editingStaff.id ? updatedMember : s)));
      if (selectedStaff?.id === editingStaff.id) {
        setSelectedStaff(updatedMember);
      }

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

      setStaffList((prev) => [newMember, ...prev]);

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
        setStaffList((prev) => prev.filter((s) => s.id !== staff.id));
        if (selectedStaff?.id === staff.id) {
          setViewModalVisible(false);
          setSelectedStaff(null);
        }
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
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
          {loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#f0c110" />
              <Text className="text-white/50 text-xs mt-3">Loading faculty directory...</Text>
            </View>
          ) : filteredStaff.length === 0 ? (
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
                    onPress={() => handleOpenViewModal(staff)}
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
                      onPress={() => handleOpenViewModal(staff)}
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

                {/* Qualifications */}
                <View className="mb-3">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">Qualifications & Degrees</Text>
                  <TextInput
                    value={formQualifications}
                    onChangeText={setFormQualifications}
                    placeholder="e.g. M.Sc. Physics, B.Ed"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold"
                  />
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

      {/* ================= VIEW STAFF DETAILS MODAL ================= */}
      <Modal
        visible={viewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardContainer}>
            <GlassCard
              className="p-6 border border-white/15 max-h-[88vh]"
              style={{
                backgroundColor: '#16191b',
                borderRadius: 28,
                shadowColor: '#f0c110',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
              }}
            >
              {selectedStaff && (
                <>
                  {/* Top Profile Summary */}
                  <View className="flex-row items-center justify-between pb-4 border-b border-white/10 mb-4">
                    <View className="flex-row items-center gap-3 flex-1 mr-2">
                      <Image
                        source={{ uri: selectedStaff.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150' }}
                        className="w-14 h-14 rounded-2xl border border-white/20"
                      />
                      <View className="flex-1">
                        <Text className="text-white font-bold text-base" numberOfLines={1}>
                          {selectedStaff.name}
                        </Text>
                        <Text className="text-[#ffe5a0] text-xs font-semibold" numberOfLines={1}>
                          {selectedStaff.designation}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <View className="px-2 py-0.5 rounded bg-[#f0c110]/15 border border-[#f0c110]/30">
                            <Text className="text-[#ffe5a0] text-[9px] font-bold uppercase">{selectedStaff.category}</Text>
                          </View>
                          <Text className="text-white/40 text-[10px] font-mono">
                            {selectedStaff.biometric_employee_code || selectedStaff.id}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => setViewModalVisible(false)}
                      className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                    >
                      <X size={16} color="#FFF" />
                    </Pressable>
                  </View>

                  {/* Navigation Tabs */}
                  <View className="flex-row justify-between mb-4 border-b border-white/10 pb-2">
                    {[
                      { key: 'info', label: 'Info & Docs' },
                      { key: 'attendance', label: 'Attendance' },
                      { key: 'salary', label: 'Salary' },
                      { key: 'leaves', label: 'Leaves' },
                    ].map((tab) => {
                      const isSel = activeViewTab === tab.key;
                      return (
                        <Pressable
                          key={tab.key}
                          onPress={() => setActiveViewTab(tab.key as any)}
                          className={`pb-1 px-2 border-b-2 ${
                            isSel ? 'border-[#f0c110]' : 'border-transparent'
                          }`}
                        >
                          <Text className={`text-xs font-bold ${isSel ? 'text-[#ffe5a0]' : 'text-white/50'}`}>
                            {tab.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Tab Content */}
                  <ScrollView showsVerticalScrollIndicator={false} className="pr-1">
                    {activeViewTab === 'info' && (
                      <View className="gap-3">
                        <View className="bg-black/40 p-3 rounded-2xl border border-white/5">
                          <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-2">
                            BIOGRAPHICAL DETAILS
                          </Text>
                          <View className="gap-2">
                            <View className="flex-row justify-between">
                              <Text className="text-white/60 text-xs">Department</Text>
                              <Text className="text-white font-bold text-xs">{selectedStaff.department}</Text>
                            </View>
                            <View className="flex-row justify-between">
                              <Text className="text-white/60 text-xs">Subject</Text>
                              <Text className="text-white font-bold text-xs">{selectedStaff.subject || 'N/A'}</Text>
                            </View>
                            <View className="flex-row justify-between">
                              <Text className="text-white/60 text-xs">Join Date</Text>
                              <Text className="text-white font-bold text-xs">{selectedStaff.join_date}</Text>
                            </View>
                            <View className="flex-row justify-between">
                              <Text className="text-white/60 text-xs">Qualifications</Text>
                              <Text className="text-white font-bold text-xs">{selectedStaff.qualifications}</Text>
                            </View>
                            <View className="flex-row justify-between">
                              <Text className="text-white/60 text-xs">Phone</Text>
                              <Text className="text-[#ffe5a0] font-bold text-xs">{selectedStaff.phone}</Text>
                            </View>
                            <View className="flex-row justify-between">
                              <Text className="text-white/60 text-xs">Email</Text>
                              <Text className="text-[#ffe5a0] font-bold text-xs">{selectedStaff.email}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Uploaded Documents List */}
                        <View className="bg-black/40 p-3 rounded-2xl border border-white/5">
                          <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-2">
                            VERIFIED DOCUMENTS ({selectedStaff.documents?.length || 0})
                          </Text>
                          <View className="gap-2">
                            {(selectedStaff.documents || ['Aadhaar Card', 'Degree Certificate']).map((doc, idx) => (
                              <View
                                key={idx}
                                className="flex-row items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10"
                              >
                                <View className="flex-row items-center gap-2">
                                  <FileText size={14} color="#ffe5a0" />
                                  <Text className="text-white text-xs font-semibold">{doc}</Text>
                                </View>
                                <View className="flex-row items-center gap-1.5">
                                  <CheckCircle size={13} color="#41eec2" />
                                  <Text className="text-[#41eec2] text-[10px] font-bold">Verified</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                    )}

                    {activeViewTab === 'attendance' && (
                      <View className="gap-3">
                        <View className="bg-black/40 p-4 rounded-2xl border border-white/5 items-center">
                          <Text className="text-white/40 text-[10px] font-bold uppercase">Overall Attendance Rate</Text>
                          <Text className="text-[#41eec2] text-3xl font-extrabold mt-1">
                            {selectedStaff.attendance_percentage}%
                          </Text>
                          <Text className="text-white/60 text-xs mt-1">
                            Synced via Biometric ID: {selectedStaff.biometric_employee_code || 'BIO-N/A'}
                          </Text>
                        </View>

                        <View className="bg-black/40 p-3 rounded-2xl border border-white/5">
                          <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-2">
                            RECENT LOGS OVERVIEW
                          </Text>
                          <View className="gap-2">
                            <View className="flex-row justify-between p-2 rounded-xl bg-white/5">
                              <Text className="text-white/70 text-xs">Today Status</Text>
                              <Text className="text-[#41eec2] font-bold text-xs">Present (08:24 AM - 04:30 PM)</Text>
                            </View>
                            <View className="flex-row justify-between p-2 rounded-xl bg-white/5">
                              <Text className="text-white/70 text-xs">Working Days in Month</Text>
                              <Text className="text-white font-bold text-xs">24 Days</Text>
                            </View>
                            <View className="flex-row justify-between p-2 rounded-xl bg-white/5">
                              <Text className="text-white/70 text-xs">Leaves Taken</Text>
                              <Text className="text-amber-400 font-bold text-xs">1 Day</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}

                    {activeViewTab === 'salary' && (
                      <View className="gap-3">
                        <View className="bg-black/40 p-4 rounded-2xl border border-white/5">
                          <Text className="text-white/40 text-[10px] font-bold uppercase">Monthly CTC Base</Text>
                          <Text className="text-[#f0c110] text-2xl font-extrabold mt-1">
                            ₹{(selectedStaff.salary || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>

                        <View className="bg-black/40 p-3 rounded-2xl border border-white/5">
                          <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-2">
                            SALARY STRUCTURE BREAKDOWN
                          </Text>
                          <View className="gap-2">
                            <View className="flex-row justify-between">
                              <Text className="text-white/60 text-xs">Basic Pay (60%)</Text>
                              <Text className="text-white font-bold text-xs">
                                ₹{Math.round((selectedStaff.salary || 0) * 0.6).toLocaleString('en-IN')}
                              </Text>
                            </View>
                            <View className="flex-row justify-between">
                              <Text className="text-white/60 text-xs">HRA (20%)</Text>
                              <Text className="text-white font-bold text-xs">
                                ₹{Math.round((selectedStaff.salary || 0) * 0.2).toLocaleString('en-IN')}
                              </Text>
                            </View>
                            <View className="flex-row justify-between">
                              <Text className="text-white/60 text-xs">Allowances (20%)</Text>
                              <Text className="text-white font-bold text-xs">
                                ₹{Math.round((selectedStaff.salary || 0) * 0.2).toLocaleString('en-IN')}
                              </Text>
                            </View>
                            <View className="flex-row justify-between pt-2 border-t border-white/10">
                              <Text className="text-white/80 font-bold text-xs">Est. Net Take-Home</Text>
                              <Text className="text-[#41eec2] font-extrabold text-sm">
                                ₹{(selectedStaff.salary || 0).toLocaleString('en-IN')}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}

                    {activeViewTab === 'leaves' && (
                      <View className="gap-3">
                        <View className="bg-black/40 p-3 rounded-2xl border border-white/5">
                          <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-2">
                            LEAVE BALANCES
                          </Text>
                          <View className="flex-row justify-between">
                            <View className="items-center bg-white/5 p-2.5 rounded-xl w-[30%]">
                              <Text className="text-white/50 text-[9px] font-bold uppercase">Casual</Text>
                              <Text className="text-[#ffe5a0] text-base font-bold mt-0.5">8 / 12</Text>
                            </View>
                            <View className="items-center bg-white/5 p-2.5 rounded-xl w-[30%]">
                              <Text className="text-white/50 text-[9px] font-bold uppercase">Medical</Text>
                              <Text className="text-[#41eec2] text-base font-bold mt-0.5">10 / 10</Text>
                            </View>
                            <View className="items-center bg-white/5 p-2.5 rounded-xl w-[30%]">
                              <Text className="text-white/50 text-[9px] font-bold uppercase">Earned</Text>
                              <Text className="text-amber-400 text-base font-bold mt-0.5">5 / 7</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}
                  </ScrollView>

                  {/* Modal Footer Actions */}
                  <View className="flex-row gap-2 mt-4 pt-3 border-t border-white/10">
                    <Pressable
                      onPress={() => {
                        setViewModalVisible(false);
                        handleOpenEditModal(selectedStaff);
                      }}
                      className="flex-1 py-3 rounded-xl bg-[#f0c110] items-center justify-center active:scale-95"
                    >
                      <Text className="text-[#101415] text-xs font-bold uppercase">Edit Profile</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setViewModalVisible(false)}
                      className="px-5 py-3 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:scale-95"
                    >
                      <Text className="text-white text-xs font-bold uppercase">Close</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </GlassCard>
          </View>
        </View>
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
