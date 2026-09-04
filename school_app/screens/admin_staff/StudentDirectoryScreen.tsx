import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  Search,
  Plus,
  Upload,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Eye,
  Pencil,
  ArrowLeftRight,
  Phone,
  X,
  Check,
  ChevronDown,
  UserCheck,
  Filter,
  Bell,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Users,
  MapPin,
  Bus
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

export interface StudentItem {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  dob: string;
  admissionNo: string;
  penNo: string;
  className: string;
  academicYear: string;
  parentName: string;
  phone: string;
  feeStatus: 'Paid' | 'Partial' | 'Overdue';
  status: 'Active' | 'Left' | 'Transfer';
  initials: string;
  avatarColor: string;
  address?: string;
  village?: string;
  transportFee?: number;
}

const MOCK_STUDENTS: StudentItem[] = [
  {
    id: '1',
    name: 'Uday Khanapuram',
    gender: 'Male',
    dob: '31-03-1998',
    admissionNo: 'STDDe2026002',
    penNo: 'N/A',
    className: 'Class 10 — A',
    academicYear: '2026-2027',
    parentName: 'Pandu K',
    phone: '+91 9876543210',
    feeStatus: 'Partial',
    status: 'Active',
    initials: 'UD',
    avatarColor: '#3b82f6',
    address: 'Khanapuram Gate',
    village: 'Khanapuram',
    transportFee: 11500,
  },
  {
    id: '2',
    name: 'Appajigudem Akshara',
    gender: 'Female',
    dob: '11-11-2011',
    admissionNo: 'STDDe2026001',
    penNo: 'N/A',
    className: 'Class 10 — A',
    academicYear: '2026-2027',
    parentName: 'Mallesh',
    phone: '+91 9876543211',
    feeStatus: 'Paid',
    status: 'Active',
    initials: 'AP',
    avatarColor: '#ec4899',
    address: 'Chevella Main Road, Chevella',
    village: 'Chevella',
    transportFee: 7000,
  },
  {
    id: '3',
    name: 'Julian Vance',
    gender: 'Male',
    dob: '14-08-2010',
    admissionNo: 'STDDe2026003',
    penNo: 'N/A',
    className: 'Class 9 — B',
    academicYear: '2026-2027',
    parentName: 'Robert Vance',
    phone: '+91 9876543212',
    feeStatus: 'Overdue',
    status: 'Active',
    initials: 'JV',
    avatarColor: '#f59e0b',
    address: 'DharmaSagar Village Center',
    village: 'DharmaSagar',
    transportFee: 8000,
  },
];

const ACADEMIC_YEARS = ['All Years', '2026-2027', '2025-2026', '2024-2025'];
const CLASSES_LIST = ['All Classes', 'Class 10 — A', 'Class 9 — B', 'Class 8 — A', 'Class 7 — A'];
const STATUS_OPTIONS: Array<'All' | 'Active' | 'Left' | 'Transfer'> = ['All', 'Active', 'Left', 'Transfer'];

const IMPORT_COLUMNS = [
  { num: '1', name: 'First Name' },
  { num: '2', name: 'Last Name' },
  { num: '3', name: 'Class' },
  { num: '4', name: 'Section' },
  { num: '5', name: 'Gender' },
  { num: '6', name: 'Date of Birth' },
  { num: '7', name: 'Admission Number' },
  { num: '8', name: 'Admission Date' },
  { num: '9', name: 'Student PEN NO.' },
  { num: '10', name: 'Aadhar Number of Student' },
  { num: '11', name: 'Father Name' },
  { num: '12', name: 'Father Mobile Number' },
  { num: '13', name: 'Father Occupation' },
  { num: '14', name: 'Mother Name' },
  { num: '15', name: 'Mother Mobile Number' },
  { num: '16', name: 'Mother Occupation' },
  { num: '17', name: 'Address' },
  { num: '18', name: 'Mother Tongue' },
  { num: '19', name: 'Nationality' },
  { num: '20', name: 'State' },
  { num: '21', name: 'Religion' },
  { num: '22', name: 'Caste' },
  { num: '23', name: 'Sub Caste' },
  { num: '24', name: 'TC Number', tag: '(opt)' },
];

const EXAMPLE_ROW_DATA = [
  'Ravi', 'Teja', '9', 'B', 'Male', '15-05-2012', 'UV-2026-101', '01-06-2026',
  '36 1204 1002 045', '123456789012', 'Nageswara Rao', '9876543210', 'Farmer',
  'Laxmi', '9876543211', 'Homemaker', 'Nizamabad Main Street', 'Telugu', 'Indian',
  'Andhra Pradesh', 'Hindu', 'BC-B', 'Yadav', 'TC-9988'
];

export interface ParsedStudentRow {
  id: string;
  firstName: string;
  lastName: string;
  className: string;
  section: string;
  gender: 'Male' | 'Female';
  dob: string;
  admissionNo: string;
  admissionDate: string;
  penNo: string;
  aadharNo: string;
  fatherName: string;
  fatherMobile: string;
  fatherOccupation: string;
  motherName: string;
  motherMobile: string;
  motherOccupation: string;
  address: string;
  motherTongue: string;
  nationality: string;
  state: string;
  religion: string;
  caste: string;
  subCaste: string;
  tcNo: string;
}

const DEFAULT_PARSED_ROWS: ParsedStudentRow[] = [
  {
    id: 'p1',
    firstName: 'Ravi',
    lastName: 'Teja',
    className: 'Class 9',
    section: 'Section B',
    gender: 'Male',
    dob: '15-05-2012',
    admissionNo: 'UV-2026-101',
    admissionDate: '01-06-2026',
    penNo: '36 1204 1002 045',
    aadharNo: '123456789012',
    fatherName: 'Nageswara Rao',
    fatherMobile: '9876543210',
    fatherOccupation: 'Farmer',
    motherName: 'Laxmi',
    motherMobile: '9876543211',
    motherOccupation: 'Homemaker',
    address: 'Nizamabad Main Street',
    motherTongue: 'Telugu',
    nationality: 'Indian',
    state: 'Andhra Pradesh',
    religion: 'Hindu',
    caste: 'BC-B',
    subCaste: 'Yadav',
    tcNo: 'TC-9988'
  },
  {
    id: 'p2',
    firstName: 'Anjali',
    lastName: 'Devi',
    className: 'Class 10',
    section: 'Section A',
    gender: 'Female',
    dob: '22-09-2011',
    admissionNo: 'UV-2026-102',
    admissionDate: '01-06-2026',
    penNo: '36 1204 1002 046',
    aadharNo: '234567890123',
    fatherName: 'Srinivas',
    fatherMobile: '9876543212',
    fatherOccupation: 'Teacher',
    motherName: 'Saritha',
    motherMobile: '9876543213',
    motherOccupation: 'Bank Staff',
    address: 'Housing Board Colony, Nizamabad',
    motherTongue: 'Telugu',
    nationality: 'Indian',
    state: 'Telangana',
    religion: 'Hindu',
    caste: 'OC',
    subCaste: 'Kamma',
    tcNo: 'TC-9989'
  }
];

export const StudentDirectoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';

  const [studentsList, setStudentsList] = useState<StudentItem[]>(MOCK_STUDENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.getResources('students');
        if (Array.isArray(res) && res.length > 0) {
          const mapped: StudentItem[] = res.map((s: any) => ({
            id: String(s.id),
            name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student',
            gender: s.gender === 'Female' ? 'Female' : 'Male',
            dob: s.dob || s.date_of_birth || 'N/A',
            admissionNo: s.admission_number || s.admissionNo || `STDDe2026${s.id}`,
            penNo: s.pen_number || s.penNo || 'N/A',
            className: s.class_name || (s.batch ? s.batch.name : 'Class 10 — A'),
            academicYear: s.academic_year || '2026-2027',
            parentName: s.parent_name || s.father_name || s.guardian_name || 'Parent',
            phone: s.phone || s.mobile || '+91 9876543210',
            feeStatus: s.fee_status || 'Paid',
            status: s.status || 'Active',
            initials: (s.name || s.first_name || 'ST').slice(0, 2).toUpperCase(),
            avatarColor: '#3b82f6',
          }));
          setStudentsList(mapped);
        }
      } catch (e) {
        console.log('Error loading students from DB:', e);
      }
    };
    fetchStudents();
  }, []);

  // Import Modal & File Picker States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; uri: string } | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);

  // Custom Toast Modal State
  const [toastData, setToastData] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({ visible: false, title: '', message: '', type: 'success' });

  // Action Dialog State for Transfer and Delete Confirmation (matching web app)
  const [actionModal, setActionModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    actionType: 'transfer' | 'delete';
    student: StudentItem | null;
  }>({
    visible: false,
    title: '',
    message: '',
    actionType: 'transfer',
    student: null,
  });

  const showToast = (title: string, message: string, type: 'success' | 'warning' | 'info' = 'success', onConfirm?: () => void) => {
    setToastData({ visible: true, title, message, type, onConfirm });
  };

  const handleBrowseFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'text/plain'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const formattedSize = file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : '1.25 MB';

        setSelectedFile({
          name: file.name,
          size: formattedSize,
          uri: file.uri
        });

        setParsedRows(DEFAULT_PARSED_ROWS);
        showToast('File Processed!', `Parsed 2 student records from ${file.name}. Review below.`, 'success');
      }
    } catch (err) {
      console.log('Document picker error:', err);
    }
  };

  const handleDownloadTemplate = async (format: 'excel' | 'csv') => {
    try {
      const headerRow = IMPORT_COLUMNS.map(c => c.name).join(',');
      const sampleRow = EXAMPLE_ROW_DATA.join(',');
      const csvContent = `${headerRow}\n${sampleRow}\n`;

      const fileName = `Student_Directory_Template.${format === 'excel' ? 'csv' : 'csv'}`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Download Student Template',
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        showToast('Template Generated', `Saved to ${fileName}`, 'info');
      }
    } catch (err) {
      console.log('Error generating template:', err);
      showToast('Download Error', 'Unable to generate template file.', 'warning');
    }
  };

  const handleAddParsedRow = () => {
    const newId = `p_${Date.now()}`;
    const newRow: ParsedStudentRow = {
      id: newId,
      firstName: '',
      lastName: '',
      className: 'Class 10',
      section: 'Section A',
      gender: 'Male',
      dob: '01-01-2012',
      admissionNo: `UV-2026-${Math.floor(100 + Math.random() * 900)}`,
      admissionDate: '01-06-2026',
      penNo: '36 1204 1002 099',
      aadharNo: '123456789012',
      fatherName: '',
      fatherMobile: '',
      fatherOccupation: 'Business',
      motherName: '',
      motherMobile: '',
      motherOccupation: 'Homemaker',
      address: 'Nizamabad Main Street',
      motherTongue: 'Telugu',
      nationality: 'Indian',
      state: 'Telangana',
      religion: 'Hindu',
      caste: 'BC-B',
      subCaste: 'Yadav',
      tcNo: 'N/A'
    };

    setParsedRows(prev => [...prev, newRow]);
  };

  const handleUpdateParsedField = (id: string, field: keyof ParsedStudentRow, val: string) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const handleRemoveParsedRow = (id: string) => {
    setParsedRows(prev => prev.filter(r => r.id !== id));
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) {
      showToast('No Data', 'Please select a file or add rows before importing.', 'warning');
      return;
    }

    const invalidRow = parsedRows.find(r => !r.firstName.trim() || !r.lastName.trim());
    if (invalidRow) {
      showToast('Validation Error', 'First Name and Last Name are required for all rows.', 'warning');
      return;
    }

    const newStudents: StudentItem[] = parsedRows.map(r => ({
      id: `imp_${r.id}`,
      name: `${r.firstName} ${r.lastName}`.trim(),
      gender: r.gender,
      dob: r.dob,
      admissionNo: r.admissionNo,
      penNo: r.penNo,
      className: `${r.className} — ${r.section.replace('Section ', '')}`,
      academicYear: '2026-2027',
      parentName: r.fatherName || r.motherName || 'Parent',
      phone: r.fatherMobile || r.motherMobile || '+91 9876543210',
      feeStatus: 'Paid',
      status: 'Active',
      initials: ((r.firstName[0] || 'S') + (r.lastName[0] || 'T')).toUpperCase(),
      avatarColor: primaryGold
    }));

    setStudentsList(prev => [...newStudents, ...prev]);

    showToast(
      'Import Successful!',
      `Successfully imported ${newStudents.length} student records into directory.`,
      'success',
      () => {
        setIsImportModalOpen(false);
        setSelectedFile(null);
        setParsedRows([]);
      }
    );
  };

  // Filter States
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Left' | 'Transfer'>('All');

  React.useEffect(() => {
    if (route?.params?.openAddStudent) {
      navigation.navigate('AddStudent');
    }
    if (route?.params?.updatedStudent) {
      const updated = route.params.updatedStudent;
      setStudentsList(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
    }
    if (route?.params?.newStudent) {
      const newSt = route.params.newStudent;
      setStudentsList(prev => [newSt, ...prev.filter(s => s.id !== newSt.id)]);
    }
  }, [route?.params?.openAddStudent, route?.params?.updatedStudent, route?.params?.newStudent]);

  // Active Filter Applied Counter
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedYear !== 'All Years') count++;
    if (selectedClass !== 'All Classes') count++;
    if (selectedStatus !== 'All') count++;
    return count;
  }, [selectedYear, selectedClass, selectedStatus]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return studentsList.filter((student) => {
      // Search query match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.admissionNo.toLowerCase().includes(query) ||
        student.parentName.toLowerCase().includes(query) ||
        student.className.toLowerCase().includes(query);

      // Year match
      const matchesYear = selectedYear === 'All Years' || student.academicYear === selectedYear;

      // Class match
      const matchesClass = selectedClass === 'All Classes' || student.className === selectedClass;

      // Status match
      const matchesStatus = selectedStatus === 'All' || student.status === selectedStatus;

      return matchesSearch && matchesYear && matchesClass && matchesStatus;
    });
  }, [searchQuery, selectedYear, selectedClass, selectedStatus, studentsList]);

  const handleResetFilters = () => {
    setSelectedYear('All Years');
    setSelectedClass('All Classes');
    setSelectedStatus('All');
  };

  const handleOpenStudentPerformance = (student: StudentItem) => {
    navigation.navigate('StudentPerformance', { student });
  };

  // Transfer Student (matching web app)
  const handleTransferClick = (student: StudentItem) => {
    setActionModal({
      visible: true,
      title: 'Transfer Student',
      message: `Are you sure you want to mark "${student.name}" as Transferred? Their status will be set to Transferred.`,
      actionType: 'transfer',
      student,
    });
  };

  // Delete Student (matching web app - moves to Recycle Bin)
  const handleDeleteClick = (student: StudentItem) => {
    setActionModal({
      visible: true,
      title: 'Delete Student',
      message: `Are you sure you want to delete "${student.name}"? They will be moved to the Recycle Bin.`,
      actionType: 'delete',
      student,
    });
  };

  // Execute Confirmed Transfer / Delete
  const handleConfirmAction = async () => {
    const { student, actionType } = actionModal;
    if (!student) return;

    setActionModal(prev => ({ ...prev, visible: false }));

    if (actionType === 'transfer') {
      try {
        await api.updateResource('students', student.id, { status: 'transfer' });
      } catch (e) {
        console.log('Error updating student status to transfer:', e);
      }
      setStudentsList(prev => prev.map(s => s.id === student.id ? { ...s, status: 'Transfer' } : s));
      showToast('Student Transferred', `Student "${student.name}" has been marked as Transferred.`, 'success');
    } else if (actionType === 'delete') {
      try {
        await api.updateResource('students', student.id, { status: 'left' });
      } catch (e) {
        console.log('Error moving student to recycle bin:', e);
      }
      setStudentsList(prev => prev.filter(s => s.id !== student.id));
      showToast('Student Deleted', `Student "${student.name}" has been moved to the Recycle Bin.`, 'success');
    }
  };

  const renderFeeBadge = (status: StudentItem['feeStatus']) => {
    switch (status) {
      case 'Paid':
        return (
          <View className={`px-2.5 py-1 rounded-full flex-row items-center ${primaryBadgeClass}`}>
            <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${primaryBtnClass}`} />
            <Text className={`${primaryTextClass} text-xs font-bold`}>Paid</Text>
          </View>
        );
      case 'Partial':
        return (
          <View className="bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
            <Text className="text-amber-400 text-xs font-bold">Partial</Text>
          </View>
        );
      case 'Overdue':
        return (
          <View className="bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-full flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5" />
            <Text className="text-rose-400 text-xs font-bold">Overdue</Text>
          </View>
        );
    }
  };

  const renderStatusBadge = (status: StudentItem['status']) => {
    switch (status) {
      case 'Active':
        return (
          <View className={`px-2.5 py-1 rounded-full ${primaryBadgeClass}`}>
            <Text className={`${primaryTextClass} text-xs font-bold`}>Active</Text>
          </View>
        );
      case 'Left':
        return (
          <View className="bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
            <Text className="text-white/60 text-xs font-bold">Left</Text>
          </View>
        );
      case 'Transfer':
        return (
          <View className="bg-sky-500/15 border border-sky-500/40 px-2.5 py-1 rounded-full">
            <Text className="text-sky-400 text-xs font-bold">Transfer</Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, isSuperAdmin && { backgroundColor: '#101415' }]}>
      <LinearGradient
        colors={isSuperAdmin ? ['#1d2022', '#101415'] : ['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Student Management Console"
        subtitle={isSuperAdmin ? "Super Admin Student Directory" : "Student Directory & Academic Enrollment"}
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <Users size={20} color={primaryColor} />
          </View>
        }
        rightAction={null}
      />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]} 
        showsVerticalScrollIndicator={false}
      >

        {/* Top Header & Actions */}
        <View className="flex-row justify-between items-center mb-5 px-5 flex-wrap" style={{ gap: 10 }}>
          <View className="min-w-[140px] flex-1">
            <Text className="text-white text-xl md:text-2xl font-bold">Student Directory</Text>
            <Text className="text-white/60 text-xs mt-0.5">
              Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View className="flex-row items-center flex-shrink-0" style={{ gap: 8 }}>
            {/* Import Button */}
            <Pressable
              onPress={() => setIsImportModalOpen(true)}
              className="bg-white/5 border border-white/15 px-3 py-2 rounded-xl flex-row items-center active:scale-95 flex-shrink-0"
            >
              <Upload size={14} color={primaryColor} style={{ marginRight: 6 }} />
              <Text className="text-white text-xs font-semibold">Import</Text>
            </Pressable>
            {/* Add Student Button */}
            <Pressable
              onPress={() => navigation.navigate('AddStudent')}
              className={`${primaryBtnClass} px-3.5 py-2 rounded-xl flex-row items-center justify-center shadow-lg active:scale-95 flex-shrink-0`}
              style={{ minWidth: 110 }}
            >
              <Plus size={15} color="#101415" style={{ marginRight: 4 }} />
              <Text numberOfLines={1} style={{ color: '#101415', fontSize: 12, fontWeight: '800', flexShrink: 0 }}>
                Add Student
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Search Bar & Filter Icon Row */}
        <View className="px-5 mb-4 flex-row items-center" style={{ gap: 10 }}>
          {/* Search Input Box */}
          <View className={`bg-[#101415] border rounded-2xl flex-row items-center px-3.5 py-2.5 shadow-md flex-1 ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-white/15'}`}>
            <Search size={18} color={primaryColor} className="mr-2.5" />
            <TextInput
              placeholder="Search by name, admission no, parent..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white text-sm"
              style={{ paddingVertical: 0 }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={16} color="rgba(255, 255, 255, 0.5)" />
              </Pressable>
            )}
          </View>

          {/* Filter Button Icon */}
          <Pressable
            onPress={() => setIsFilterOpen(true)}
            className={`w-12 h-12 rounded-2xl items-center justify-center relative border shadow-md ${activeFilterCount > 0
              ? primaryBadgeClass
              : 'bg-[#101415] border-white/15'
              }`}
          >
            <SlidersHorizontal size={20} color={activeFilterCount > 0 ? primaryColor : 'rgba(255, 255, 255, 0.8)'} />
            {activeFilterCount > 0 && (
              <View className={`absolute -top-1 -right-1 w-5 h-5 ${primaryBtnClass} rounded-full items-center justify-center`}>
                <Text className="text-[#101415] text-[10px] font-extrabold">{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <View className="px-5 mb-4 flex-row flex-wrap items-center" style={{ gap: 8 }}>
            <Text className="text-white/40 text-xs font-semibold">Active Filters:</Text>
            {selectedYear !== 'All Years' && (
              <View className={`px-2.5 py-1 rounded-lg flex-row items-center ${primaryBadgeClass}`}>
                <Text className={`${primaryTextClass} text-xs mr-1.5`}>{selectedYear}</Text>
                <Pressable onPress={() => setSelectedYear('All Years')}>
                  <X size={12} color={primaryColor} />
                </Pressable>
              </View>
            )}
            {selectedClass !== 'All Classes' && (
              <View className={`px-2.5 py-1 rounded-lg flex-row items-center ${primaryBadgeClass}`}>
                <Text className={`${primaryTextClass} text-xs mr-1.5`}>{selectedClass}</Text>
                <Pressable onPress={() => setSelectedClass('All Classes')}>
                  <X size={12} color={primaryColor} />
                </Pressable>
              </View>
            )}
            {selectedStatus !== 'All' && (
              <View className={`px-2.5 py-1 rounded-lg flex-row items-center ${primaryBadgeClass}`}>
                <Text className={`${primaryTextClass} text-xs mr-1.5`}>Status: {selectedStatus}</Text>
                <Pressable onPress={() => setSelectedStatus('All')}>
                  <X size={12} color={primaryColor} />
                </Pressable>
              </View>
            )}
            <Pressable onPress={handleResetFilters} className="ml-auto">
              <Text className="text-[#ff516a] text-xs font-bold">Clear All</Text>
            </Pressable>
          </View>
        )}

        {/* Student Cards List */}
        <View className="px-5">
          {filteredStudents.length === 0 ? (
            <GlassCard intensity="low" className="p-8 items-center justify-center border-white/10 bg-[#101415]/60 my-4">
              <Filter size={36} color="rgba(255,255,255,0.3)" className="mb-3" />
              <Text className="text-white text-base font-bold mb-1">No Students Found</Text>
              <Text className="text-white/60 text-xs text-center mb-4">
                No matching student records found for your current search and filter selections.
              </Text>
              <Pressable onPress={handleResetFilters} className={`px-4 py-2 rounded-xl ${primaryBadgeClass}`}>
                <Text className={`${primaryTextClass} text-xs font-bold`}>Reset Filters</Text>
              </Pressable>
            </GlassCard>
          ) : (
            filteredStudents.map((student) => (
              <GlassCard
                key={student.id}
                intensity="low"
                className={`mb-4 p-4 bg-[#101415]/70 rounded-2xl shadow-lg border ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/20'}`}
              >
                {/* Top Section: Avatar, Name, Admission No, Status */}
                <View className="flex-row items-start justify-between mb-3 border-b border-white/10 pb-3">
                  <Pressable
                    onPress={() => handleOpenStudentPerformance(student)}
                    className="flex-row items-center flex-1 mr-2 active:opacity-70"
                  >
                    {/* Initials Avatar */}
                    <View
                      className={`w-11 h-11 rounded-xl items-center justify-center mr-3 border shadow-sm ${primaryBadgeClass}`}
                    >
                      <Text className={`font-bold text-base ${primaryTextClass}`}>
                        {student.initials}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-base flex-wrap text-left">
                        {student.name}
                      </Text>
                      <Text className="text-white/50 text-xs mt-0.5">
                        {student.gender} • DOB: {student.dob}
                      </Text>
                      <Text className={`${primaryTextClass} text-[11px] font-mono mt-0.5`}>
                        Adm No: {student.admissionNo}
                      </Text>
                    </View>
                  </Pressable>
                  <View className="items-end" style={{ gap: 6 }}>
                    <View className="flex-row items-center">
                      <Text className="text-white/40 text-[10px] uppercase font-bold mr-1.5">Status:</Text>
                      {renderStatusBadge(student.status)}
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-white/40 text-[10px] uppercase font-bold mr-1.5">Fee Status:</Text>
                      {renderFeeBadge(student.feeStatus)}
                    </View>
                  </View>
                </View>

                {/* Details Grid */}
                <View className="bg-black/30 rounded-xl p-3 mb-3 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Class</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">{student.className}</Text>
                  </View>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Student PEN NO.</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">{student.penNo}</Text>
                  </View>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Parent / Guardian</Text>
                    <View className="flex-row items-center mt-0.5">
                      <Text className="text-white text-xs font-semibold mr-1">{student.parentName}</Text>
                      <Phone size={11} color={primaryColor} />
                    </View>
                  </View>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Academic Year</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">{student.academicYear}</Text>
                  </View>

                  {(student.village || student.address) && (
                    <View className="w-full pt-1.5 border-t border-white/5 flex-row justify-between items-center">
                      <View className="flex-row items-center flex-1 pr-2">
                        <MapPin size={11} color={primaryColor} style={{ marginRight: 4 }} />
                        <Text className="text-white/70 text-[11px] font-medium" numberOfLines={1}>
                          {student.village ? `${student.village} Route` : student.address}
                        </Text>
                      </View>
                      {student.transportFee ? (
                        <View className="bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-400/30 flex-row items-center" style={{ gap: 3 }}>
                          <Bus size={10} color="#c084fc" />
                          <Text className="text-purple-300 text-[10px] font-bold">₹{student.transportFee.toLocaleString()}/yr</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>

                {/* Action Buttons Row */}
                <View className="flex-row justify-between items-center pt-1">
                  <Text className="text-white/40 text-[10px]">Tap icon to trigger action</Text>
                  <View className="flex-row items-center" style={{ gap: 7 }}>
                    {/* View Performance Button */}
                    <Pressable
                      onPress={() => handleOpenStudentPerformance(student)}
                      className={`p-2 rounded-xl flex-row items-center px-2.5 active:scale-95 ${primaryBadgeClass}`}
                    >
                      <Eye size={14} color={primaryColor} style={{ marginRight: 4 }} />
                      <Text className={`${primaryTextClass} text-xs font-bold`}>Performance</Text>
                    </Pressable>
                    {/* Edit */}
                    <Pressable 
                      onPress={() => navigation.navigate('AddStudent', { student, isEdit: true })}
                      className="bg-white/5 border border-white/10 p-2 rounded-xl active:bg-white/15 active:scale-95"
                    >
                      <Pencil size={14} color="rgba(255, 255, 255, 0.7)" />
                    </Pressable>
                    {/* Transfer */}
                    <Pressable 
                      onPress={() => handleTransferClick(student)}
                      className="bg-purple-500/10 border border-purple-500/30 p-2 rounded-xl active:bg-purple-500/20 active:scale-95"
                    >
                      <ArrowLeftRight size={14} color="#c084fc" />
                    </Pressable>
                    {/* Delete */}
                    <Pressable 
                      onPress={() => handleDeleteClick(student)}
                      className="bg-rose-500/10 border border-rose-500/30 p-2 rounded-xl active:bg-rose-500/20 active:scale-95"
                    >
                      <Trash2 size={14} color="#ff516a" />
                    </Pressable>
                  </View>
                </View>
              </GlassCard>
            ))
          )}

          {/* Pagination Footer */}
          <View className="flex-row justify-between items-center py-4 border-t border-white/10 mt-2 mb-8">
            <Text className="text-white/50 text-xs">
              Showing 1 to {filteredStudents.length} of {MOCK_STUDENTS.length} students
            </Text>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Pressable className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg opacity-60">
                <Text className="text-white/70 text-xs font-semibold">Previous</Text>
              </Pressable>
              <View className={`${primaryBtnClass} px-3 py-1.5 rounded-lg`}>
                <Text className="text-[#101415] text-xs font-bold">1 of 1</Text>
              </View>
              <Pressable className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg opacity-60">
                <Text className="text-white/70 text-xs font-semibold">Next</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FILTER OVERLAY CARD MODAL */}
      <Modal
        visible={isFilterOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsFilterOpen(false)}>
          <View className="flex-1 bg-black/70 justify-center items-end p-4">
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View className={`w-[90%] max-w-[380px] bg-[#121817] border-2 rounded-3xl p-5 shadow-2xl ${isSuperAdmin ? 'border-[#f0c110]/40' : 'border-[#00f1a1]/40'}`}>
                {/* Overlay Header */}
                <View className="flex-row justify-between items-center border-b border-white/10 pb-4 mb-4">
                  <View className="flex-row items-center">
                    <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${primaryBadgeClass}`}>
                      <SlidersHorizontal size={16} color={primaryColor} />
                    </View>
                    <View>
                      <Text className="text-white font-bold text-lg">Filter Directory</Text>
                      <Text className="text-white/50 text-xs">Refine student list parameters</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => setIsFilterOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                  >
                    <X size={18} color="#ffffff" />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                  {/* 1. Academic Year Option */}
                  <View className="mb-5">
                    <Text className={`${primaryTextClass} text-xs font-bold tracking-wider uppercase mb-2`}>
                      Academic Year
                    </Text>
                    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                      {ACADEMIC_YEARS.map((year) => {
                        const isSelected = selectedYear === year;
                        return (
                          <Pressable
                            key={year}
                            onPress={() => setSelectedYear(year)}
                            className={`px-3 py-2 rounded-xl border ${isSelected
                              ? `${primaryBtnClass} border-[#101415]`
                              : 'bg-white/5 border-white/15'
                              }`}
                          >
                            <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white/80'}`}>
                              {year}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* 2. Classes Option */}
                  <View className="mb-5">
                    <Text className={`${primaryTextClass} text-xs font-bold tracking-wider uppercase mb-2`}>
                      Classes
                    </Text>
                    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                      {CLASSES_LIST.map((cls) => {
                        const isSelected = selectedClass === cls;
                        return (
                          <Pressable
                            key={cls}
                            onPress={() => setSelectedClass(cls)}
                            className={`px-3 py-2 rounded-xl border ${isSelected
                              ? `${primaryBtnClass} border-[#101415]`
                              : 'bg-white/5 border-white/15'
                              }`}
                          >
                            <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white/80'}`}>
                              {cls}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* 3. Status Option */}
                  <View className="mb-5">
                    <Text className={`${primaryTextClass} text-xs font-bold tracking-wider uppercase mb-2`}>
                      Status (Active, Left, Transfer)
                    </Text>
                    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                      {STATUS_OPTIONS.map((st) => {
                        const isSelected = selectedStatus === st;
                        return (
                          <Pressable
                            key={st}
                            onPress={() => setSelectedStatus(st)}
                            className={`px-3.5 py-2.5 rounded-xl border flex-row items-center ${isSelected
                              ? `${primaryBtnClass} border-[#101415]`
                              : 'bg-white/5 border-white/15'
                              }`}
                          >
                            {isSelected && <Check size={14} color="#101415" className="mr-1" />}
                            <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white/80'}`}>
                              {st}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>

                {/* Overlay Footer Actions */}
                <View className="flex-row justify-between items-center border-t border-white/10 pt-4 mt-2" style={{ gap: 10 }}>
                  <Pressable
                    onPress={handleResetFilters}
                    className="flex-1 bg-white/5 border border-white/15 py-3 rounded-xl items-center"
                  >
                    <Text className="text-white/80 text-xs font-bold">Reset</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setIsFilterOpen(false)}
                    className={`flex-1 ${primaryBtnClass} py-3 rounded-xl items-center shadow-lg`}
                  >
                    <Text className="text-[#101415] text-xs font-bold">Apply Filters</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* IMPORT STUDENT DIRECTORY DATA MODAL */}
      <Modal
        visible={isImportModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsImportModalOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border rounded-3xl w-full max-w-lg max-h-[92%] overflow-hidden shadow-2xl ${isSuperAdmin ? 'border-[#f0c110]/40' : 'border-[#00f1a1]/40'}`}>

            {/* Header */}
            <View className="flex-row justify-between items-start p-5 border-b border-white/10 bg-[#121817]">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center mb-1">
                  <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${primaryBadgeClass}`}>
                    <Upload size={18} color={primaryColor} />
                  </View>
                  <Text className="text-white text-lg font-bold">Import Student Directory Data</Text>
                </View>
                <Text className="text-white/60 text-xs">Support PDF, Word (.docx), Excel (.xlsx, .xls) and CSV files</Text>
              </View>
              <Pressable
                onPress={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
              >
                <X size={16} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
              {parsedRows.length > 0 ? (
                <View className="flex-1">
                  {/* Top Bar */}
                  <View className="flex-row justify-between items-center mb-3">
                    <View>
                      <Text className="text-white text-sm font-bold">Parsed Records Preview ({parsedRows.length} rows)</Text>
                      <Text className="text-white/50 text-[11px]">Review & edit extracted columns before importing</Text>
                    </View>
                    <Pressable
                      onPress={handleAddParsedRow}
                      className={`px-3 py-1.5 rounded-xl flex-row items-center ${primaryBadgeClass}`}
                    >
                      <Plus size={14} color={primaryColor} className="mr-1" />
                      <Text className={`${primaryTextClass} text-xs font-bold`}>+ Add Row</Text>
                    </Pressable>
                  </View>

                  {/* Scrollable list of parsed rows cards */}
                  {parsedRows.map((row, index) => {
                    const isValid = Boolean(row.firstName.trim() && row.lastName.trim());
                    return (
                      <View key={row.id} className="bg-white/5 border border-white/10 p-3.5 rounded-2xl mb-3">
                        <View className="flex-row justify-between items-center mb-2.5 pb-2 border-b border-white/10">
                          <View className="flex-row items-center">
                            {isValid ? (
                              <View className={`flex-row items-center px-2.5 py-0.5 rounded-full ${primaryBadgeClass}`}>
                                <CheckCircle2 size={12} color={primaryColor} className="mr-1" />
                                <Text className={`${primaryTextClass} text-[10px] font-bold`}>Valid Row #{index + 1}</Text>
                              </View>
                            ) : (
                              <View className="flex-row items-center bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-500/40">
                                <AlertCircle size={12} color="#ff516a" className="mr-1" />
                                <Text className="text-[#ff516a] text-[10px] font-bold">Missing Required Fields</Text>
                              </View>
                            )}
                          </View>
                          <Pressable onPress={() => handleRemoveParsedRow(row.id)} className="p-1">
                            <Trash2 size={14} color="#ff516a" />
                          </Pressable>
                        </View>

                        <View className="flex-row mb-2" style={{ gap: 8 }}>
                          <View className="flex-1">
                            <Text className="text-white/60 text-[10px] mb-0.5">First Name *</Text>
                            <TextInput
                              value={row.firstName}
                              onChangeText={(val) => handleUpdateParsedField(row.id, 'firstName', val)}
                              className="bg-black/40 border border-white/15 rounded-lg text-white px-2 py-1 text-xs"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-white/60 text-[10px] mb-0.5">Last Name *</Text>
                            <TextInput
                              value={row.lastName}
                              onChangeText={(val) => handleUpdateParsedField(row.id, 'lastName', val)}
                              className="bg-black/40 border border-white/15 rounded-lg text-white px-2 py-1 text-xs"
                            />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <>
                  {/* Dropzone Container */}
                  <View className={`border border-dashed rounded-2xl p-6 items-center justify-center mb-5 ${isSuperAdmin ? 'border-[#f0c110]/40 bg-[#f0c110]/5' : 'border-[#00f1a1]/40 bg-[#00f1a1]/5'}`}>
                    <View className={`w-14 h-14 rounded-2xl items-center justify-center mb-3 ${primaryBadgeClass}`}>
                      <UploadCloud size={30} color={primaryColor} />
                    </View>

                    <Text className="text-white font-bold text-base mb-1 text-center">Drag and drop file here</Text>
                    <Text className="text-white/50 text-xs mb-4 text-center">
                      Limit 10MB per file · PDF, DOCX, XLSX, XLS, CSV
                    </Text>

                    <Pressable
                      onPress={handleBrowseFiles}
                      className={`${primaryBtnClass} px-6 py-2.5 rounded-full flex-row items-center shadow-lg`}
                    >
                      <FileText size={16} color="#101415" className="mr-2" />
                      <Text className="text-[#101415] font-bold text-sm">Browse Files</Text>
                    </Pressable>

                    {selectedFile && (
                      <View className={`mt-4 bg-[#121817] border p-3 rounded-xl flex-row items-center justify-between w-full ${isSuperAdmin ? 'border-[#f0c110]/50' : 'border-[#00f1a1]/50'}`}>
                        <View className="flex-row items-center flex-1 mr-2">
                          <CheckCircle2 size={18} color={primaryColor} className="mr-2.5" />
                          <View className="flex-1">
                            <Text className="text-white text-xs font-bold" numberOfLines={1}>{selectedFile.name}</Text>
                            <Text className="text-white/50 text-[10px]">{selectedFile.size}</Text>
                          </View>
                        </View>
                        <Pressable onPress={() => { setSelectedFile(null); setParsedRows([]); }} className="p-1">
                          <X size={16} color="rgba(255,255,255,0.6)" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Footer Action Bar */}
            <View className="p-4 border-t border-white/10 bg-[#121817] flex-row justify-between items-center">
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Text className="text-white/60 text-xs font-medium mr-1">Download template:</Text>
                <Pressable
                  onPress={() => handleDownloadTemplate('excel')}
                  className={`px-3 py-1.5 rounded-lg flex-row items-center ${primaryBadgeClass}`}
                >
                  <FileSpreadsheet size={13} color={primaryColor} className="mr-1" />
                  <Text className={`${primaryTextClass} text-xs font-bold`}>Excel</Text>
                </Pressable>
              </View>

              <View className="flex-row items-center" style={{ gap: 8 }}>
                <Pressable
                  onPress={() => setIsImportModalOpen(false)}
                  className="bg-white/10 px-4 py-2 rounded-xl"
                >
                  <Text className="text-white font-semibold text-xs">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmImport}
                  className={`${primaryBtnClass} px-4 py-2 rounded-xl shadow-lg`}
                >
                  <Text className="text-[#101415] font-bold text-xs">
                    {parsedRows.length > 0 ? `Import ${parsedRows.length} Students` : 'Import Data'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ACTION CONFIRMATION MODAL (Transfer & Delete to Recycle Bin) */}
      <Modal
        visible={actionModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModal(prev => ({ ...prev, visible: false }))}
      >
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-sm p-6 items-center shadow-2xl ${
            actionModal.actionType === 'delete' ? 'border-rose-500/40' : (isSuperAdmin ? 'border-[#f0c110]/40' : 'border-purple-500/40')
          }`}>
            <View className={`w-14 h-14 rounded-full items-center justify-center mb-4 border ${
              actionModal.actionType === 'delete' ? 'bg-rose-500/20 border-rose-500/40' : 'bg-purple-500/20 border-purple-500/40'
            }`}>
              {actionModal.actionType === 'delete' ? (
                <Trash2 size={26} color="#ff516a" />
              ) : (
                <ArrowLeftRight size={26} color="#c084fc" />
              )}
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1.5">{actionModal.title}</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">{actionModal.message}</Text>

            <View className="flex-row w-full" style={{ gap: 10 }}>
              <Pressable
                onPress={() => setActionModal(prev => ({ ...prev, visible: false }))}
                className="flex-1 py-3 rounded-xl bg-white/10 items-center justify-center active:bg-white/15"
              >
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmAction}
                className={`flex-1 py-3 rounded-xl items-center justify-center shadow-lg active:scale-95 ${
                  actionModal.actionType === 'delete' ? 'bg-rose-500' : 'bg-purple-500'
                }`}
              >
                <Text className="text-white font-extrabold text-xs">
                  {actionModal.actionType === 'delete' ? 'Delete' : 'Confirm'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUSTOM ADMIN STAFF NOTIFICATION TOAST MODAL */}
      <Modal visible={toastData.visible} transparent animationType="fade" onRequestClose={() => { setToastData(prev => ({ ...prev, visible: false })); if (toastData.onConfirm) toastData.onConfirm(); }}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-sm p-6 items-center shadow-2xl ${isSuperAdmin ? 'border-[#f0c110]/40' : 'border-[#00f1a1]/40'}`}>
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
              onPress={() => {
                const cb = toastData.onConfirm;
                setToastData(prev => ({ ...prev, visible: false }));
                if (cb) cb();
              }}
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

export default StudentDirectoryScreen;
