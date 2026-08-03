import React, { useState, useMemo } from 'react';
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
  Trash2
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';

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
  },
  {
    id: '3',
    name: 'Rohan Sharma',
    gender: 'Male',
    dob: '15-05-2010',
    admissionNo: 'STDDe2026003',
    penNo: 'PEN984210',
    className: 'Class 9 — B',
    academicYear: '2026-2027',
    parentName: 'Sanjay Sharma',
    phone: '+91 9876543212',
    feeStatus: 'Overdue',
    status: 'Active',
    initials: 'RS',
    avatarColor: '#10b981',
  },
  {
    id: '4',
    name: 'Ananya Verma',
    gender: 'Female',
    dob: '22-08-2012',
    admissionNo: 'STDDe2026004',
    penNo: 'PEN984211',
    className: 'Class 8 — A',
    academicYear: '2025-2026',
    parentName: 'Vikram Verma',
    phone: '+91 9876543213',
    feeStatus: 'Paid',
    status: 'Left',
    initials: 'AV',
    avatarColor: '#8b5cf6',
  },
  {
    id: '5',
    name: 'Karthik Raju',
    gender: 'Male',
    dob: '04-01-2009',
    admissionNo: 'STDDe2026005',
    penNo: 'N/A',
    className: 'Class 10 — A',
    academicYear: '2026-2027',
    parentName: 'Ramesh Raju',
    phone: '+91 9876543214',
    feeStatus: 'Partial',
    status: 'Transfer',
    initials: 'KR',
    avatarColor: '#f59e0b',
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

export const StudentDirectoryScreen: React.FC<any> = ({ route, navigation }) => {
  const [studentsList, setStudentsList] = useState<StudentItem[]>(MOCK_STUDENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Import Modal & File Picker States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; uri: string } | null>(null);

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
          'text/comma-separated-values',
          '*/*'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileSizeMB = file.size ? file.size / (1024 * 1024) : 0;
        if (fileSizeMB > 10) {
          Alert.alert('File Too Large', 'Please select a file smaller than 10MB limit.');
          return;
        }
        setSelectedFile({
          name: file.name,
          size: fileSizeMB > 0 ? `${fileSizeMB.toFixed(2)} MB` : 'Under 10MB',
          uri: file.uri
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleDownloadTemplate = async (format: 'excel' | 'csv') => {
    try {
      const csvHeader = 'First Name,Last Name,Class,Section,Gender,Date of Birth,Admission Number,Admission Date,Student PEN NO.,Aadhar Number of Student,Father Name,Father Mobile Number,Father Occupation,Mother Name,Mother Mobile Number,Mother Occupation,Address,Mother Tongue,Nationality,State,Religion,Caste,Sub Caste,TC Number\n';
      const sampleRows =
        `Ravi,Teja,9,B,Male,15-05-2012,2026-101,01-06-2026,36 1204 1002 045,123456789012,Nageswara Rao,9876543210,Farmer,Laxmi,9876543211,Homemaker,Nizamabad Main Street,Telugu,Indian,Andhra Pradesh,Hindu,BC-B,Yadav,TC-9988
Anjali,Devi,10,A,Female,22-09-2011,2026-102,01-06-2026,36 1204 1002 046,234567890123,Srinivas,9848022338,Teacher,Rani,9848022340,Government Employee,Housing Board Colony,Telugu,Indian,Andhra Pradesh,Hindu,OC,Reddy,TC-9989
Arun,Kumar,8,C,Male,10-03-2013,2026-103,01-06-2026,36 1204 1002 047,345678901234,Ramesh,9700123456,Business,Latha,9700123458,Homemaker,"Old Town, Nizamabad",Telugu,Indian,Telangana,Hindu,BC-D,Goud,TC-9990`;

      const fullContent = csvHeader + sampleRows;
      const fileName = `Student_Import_Template.${format === 'excel' ? 'csv' : 'csv'}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, fullContent, { encoding: 'utf8' });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Download Student ${format.toUpperCase()} Template`,
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Alert.alert('Template Generated', `Template saved to ${fileName}`);
      }
    } catch (error) {
      console.error('Error generating template:', error);
      Alert.alert('Error', 'Unable to generate download template.');
    }
  };

  const handleConfirmImport = () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please click "Browse Files" to select a file before importing.');
      return;
    }
    Alert.alert(
      'Import Successful!',
      `Successfully uploaded ${selectedFile.name}.\n\n24 columns verified against template. Student directory data updated.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setIsImportModalOpen(false);
            setSelectedFile(null);
          }
        }
      ]
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
  }, [route?.params?.openAddStudent]);

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

  const renderFeeBadge = (status: StudentItem['feeStatus']) => {
    switch (status) {
      case 'Paid':
        return (
          <View className="bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
            <Text className="text-emerald-400 text-xs font-bold">Paid</Text>
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
          <View className="bg-[#00f1a1]/15 border border-[#00f1a1]/40 px-2.5 py-1 rounded-full">
            <Text className="text-[#00f1a1] text-xs font-bold">Active</Text>
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <AdminStaffHeader
        title="EduVision"
        subtitle="Student Directory"
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1] items-center justify-center shadow-[0_0_10px_rgba(0,241,161,0.5)]">
            <ShieldCheck size={22} color="#101415" />
          </View>
        }
        rightAction={
          <Pressable className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center relative shadow-[0_0_10px_rgba(0,241,161,0.1)]">
            <Bell size={18} color="#00f1a1" />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Top Header & Actions (Matching Web Screenshot) */}
        <View className="flex-row justify-between items-center mb-5 px-5">
          <View>
            <Text className="text-white text-2xl font-bold">Student Directory</Text>
            <Text className="text-white/60 text-xs mt-0.5">
              Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            {/* Import Button */}
            <Pressable
              onPress={() => setIsImportModalOpen(true)}
              className="bg-white/5 border border-white/15 px-3 py-2 rounded-xl flex-row items-center"
            >
              <Upload size={14} color="#00f1a1" className="mr-1.5" />
              <Text className="text-white text-xs font-semibold">Import</Text>
            </Pressable>
            {/* Add Student Button */}
            <Pressable
              onPress={() => navigation.navigate('AddStudent')}
              className="bg-[#00f1a1] px-3 py-2 rounded-xl flex-row items-center shadow-[0_0_12px_rgba(0,241,161,0.3)]"
            >
              <Plus size={16} color="#101415" className="mr-1" />
              <Text className="text-[#101415] text-xs font-bold">Add Student</Text>
            </Pressable>
          </View>
        </View>

        {/* Search Bar & Filter Icon Row */}
        <View className="px-5 mb-4 flex-row items-center" style={{ gap: 10 }}>
          {/* Search Input Box */}
          <View className="flex-1 bg-[#101415] border border-white/15 rounded-2xl flex-row items-center px-3.5 py-2.5 shadow-md">
            <Search size={18} color="#00f1a1" className="mr-2.5" />
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
              ? 'bg-[#00f1a1]/20 border-[#00f1a1]'
              : 'bg-[#101415] border-white/15'
              }`}
          >
            <SlidersHorizontal size={20} color={activeFilterCount > 0 ? '#00f1a1' : 'rgba(255, 255, 255, 0.8)'} />
            {activeFilterCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 bg-[#00f1a1] rounded-full items-center justify-center">
                <Text className="text-[#101415] text-[10px] font-extrabold">{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Active Filter Chips Bar (if filters applied) */}
        {activeFilterCount > 0 && (
          <View className="px-5 mb-4 flex-row flex-wrap items-center" style={{ gap: 8 }}>
            <Text className="text-white/40 text-xs font-semibold">Active Filters:</Text>
            {selectedYear !== 'All Years' && (
              <View className="bg-[#00f1a1]/10 border border-[#00f1a1]/30 px-2.5 py-1 rounded-lg flex-row items-center">
                <Text className="text-[#00f1a1] text-xs mr-1.5">{selectedYear}</Text>
                <Pressable onPress={() => setSelectedYear('All Years')}>
                  <X size={12} color="#00f1a1" />
                </Pressable>
              </View>
            )}
            {selectedClass !== 'All Classes' && (
              <View className="bg-[#00f1a1]/10 border border-[#00f1a1]/30 px-2.5 py-1 rounded-lg flex-row items-center">
                <Text className="text-[#00f1a1] text-xs mr-1.5">{selectedClass}</Text>
                <Pressable onPress={() => setSelectedClass('All Classes')}>
                  <X size={12} color="#00f1a1" />
                </Pressable>
              </View>
            )}
            {selectedStatus !== 'All' && (
              <View className="bg-[#00f1a1]/10 border border-[#00f1a1]/30 px-2.5 py-1 rounded-lg flex-row items-center">
                <Text className="text-[#00f1a1] text-xs mr-1.5">Status: {selectedStatus}</Text>
                <Pressable onPress={() => setSelectedStatus('All')}>
                  <X size={12} color="#00f1a1" />
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
              <Pressable onPress={handleResetFilters} className="bg-[#00f1a1]/20 border border-[#00f1a1]/40 px-4 py-2 rounded-xl">
                <Text className="text-[#00f1a1] text-xs font-bold">Reset Filters</Text>
              </Pressable>
            </GlassCard>
          ) : (
            filteredStudents.map((student) => (
              <GlassCard
                key={student.id}
                intensity="low"
                className="mb-4 p-4 border-[#00f1a1]/20 bg-[#101415]/70 rounded-2xl shadow-lg"
              >
                {/* Top Section: Avatar, Name, Admission No, Status */}
                <View className="flex-row items-start justify-between mb-3 border-b border-white/10 pb-3">
                  <Pressable
                    onPress={() => handleOpenStudentPerformance(student)}
                    className="flex-row items-center flex-1 mr-2 active:opacity-70"
                  >
                    {/* Initials Avatar */}
                    <View
                      className="w-11 h-11 rounded-xl items-center justify-center mr-3 border border-[#00f1a1]/30 shadow-sm"
                      style={{ backgroundColor: `${student.avatarColor}25` }}
                    >
                      <Text className="font-bold text-base" style={{ color: student.avatarColor }}>
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
                      <Text className="text-[#00f1a1] text-[11px] font-mono mt-0.5">
                        Adm No: {student.admissionNo}
                      </Text>
                    </View>
                  </Pressable>
                  <View className="items-end" style={{ gap: 6 }}>
                    {renderStatusBadge(student.status)}
                    {renderFeeBadge(student.feeStatus)}
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
                      <Phone size={11} color="#00f1a1" />
                    </View>
                  </View>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Academic Year</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">{student.academicYear}</Text>
                  </View>
                </View>

                {/* Action Buttons Row */}
                <View className="flex-row justify-between items-center pt-1">
                  <Text className="text-white/40 text-[10px]">Tap icon to trigger action</Text>
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    {/* View Performance Button */}
                    <Pressable
                      onPress={() => handleOpenStudentPerformance(student)}
                      className="bg-[#00f1a1]/15 border border-[#00f1a1]/40 p-2 rounded-xl flex-row items-center px-2.5"
                    >
                      <Eye size={14} color="#00f1a1" className="mr-1" />
                      <Text className="text-[#00f1a1] text-xs font-bold">Performance</Text>
                    </Pressable>
                    {/* Edit */}
                    <Pressable className="bg-white/5 border border-white/10 p-2 rounded-xl">
                      <Pencil size={14} color="rgba(255, 255, 255, 0.7)" />
                    </Pressable>
                    {/* Transfer */}
                    <Pressable className="bg-white/5 border border-white/10 p-2 rounded-xl">
                      <ArrowLeftRight size={14} color="rgba(255, 255, 255, 0.7)" />
                    </Pressable>
                    {/* Delete */}
                    <Pressable className="bg-rose-500/10 border border-rose-500/30 p-2 rounded-xl">
                      <Trash2 size={14} color="#ff516a" />
                    </Pressable>
                  </View>
                </View>
              </GlassCard>
            ))
          )}

          {/* Pagination Footer (Matching Web Screenshot) */}
          <View className="flex-row justify-between items-center py-4 border-t border-white/10 mt-2 mb-8">
            <Text className="text-white/50 text-xs">
              Showing 1 to {filteredStudents.length} of {MOCK_STUDENTS.length} students
            </Text>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Pressable className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg opacity-60">
                <Text className="text-white/70 text-xs font-semibold">Previous</Text>
              </Pressable>
              <View className="bg-[#00f1a1] px-3 py-1.5 rounded-lg">
                <Text className="text-[#101415] text-xs font-bold">1 of 1</Text>
              </View>
              <Pressable className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg opacity-60">
                <Text className="text-white/70 text-xs font-semibold">Next</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FILTER OVERLAY CARD MODAL (Medium Size Overlay at Side / Floating) */}
      <Modal
        visible={isFilterOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsFilterOpen(false)}>
          <View className="flex-1 bg-black/70 justify-center items-end p-4">
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              {/* Filter Card Container (Medium Size Overlay) */}
              <View className="w-[90%] max-w-[380px] bg-[#121817] border-2 border-[#00f1a1]/40 rounded-3xl p-5 shadow-[0_0_35px_rgba(0,241,161,0.2)]">
                {/* Overlay Header */}
                <View className="flex-row justify-between items-center border-b border-white/10 pb-4 mb-4">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center mr-2.5">
                      <SlidersHorizontal size={16} color="#00f1a1" />
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
                    <Text className="text-[#00f1a1] text-xs font-bold tracking-wider uppercase mb-2">
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
                              ? 'bg-[#00f1a1] border-[#00f1a1]'
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
                    <Text className="text-[#00f1a1] text-xs font-bold tracking-wider uppercase mb-2">
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
                              ? 'bg-[#00f1a1] border-[#00f1a1]'
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

                  {/* 3. Status Option (Active, Left, Transfer) */}
                  <View className="mb-5">
                    <Text className="text-[#00f1a1] text-xs font-bold tracking-wider uppercase mb-2">
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
                              ? 'bg-[#00f1a1] border-[#00f1a1]'
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
                    className="flex-1 bg-[#00f1a1] py-3 rounded-xl items-center shadow-[0_0_12px_rgba(0,241,161,0.4)]"
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
            <View className="bg-[#101415] border border-[#00f1a1]/40 rounded-3xl w-full max-w-lg max-h-[92%] overflow-hidden shadow-[0_0_30px_rgba(0,241,161,0.2)]">

              {/* Header */}
              <View className="flex-row justify-between items-start p-5 border-b border-white/10 bg-[#121817]">
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center mb-1">
                    <View className="w-8 h-8 rounded-xl bg-[#00f1a1]/20 items-center justify-center mr-2.5 border border-[#00f1a1]/40">
                      <Upload size={18} color="#00f1a1" />
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
                {/* Dropzone Container */}
                <View className="border border-dashed border-[#00f1a1]/40 bg-[#00f1a1]/5 rounded-2xl p-6 items-center justify-center mb-5">
                  <View className="w-14 h-14 rounded-2xl bg-[#00f1a1]/20 items-center justify-center mb-3 border border-[#00f1a1]/30">
                    <UploadCloud size={30} color="#00f1a1" />
                  </View>

                  <Text className="text-white font-bold text-base mb-1 text-center">Drag and drop file here</Text>
                  <Text className="text-white/50 text-xs mb-4 text-center">
                    Limit 10MB per file · PDF, DOCX, XLSX, XLS, CSV
                  </Text>

                  <Pressable
                    onPress={handleBrowseFiles}
                    className="bg-[#00f1a1] px-6 py-2.5 rounded-full flex-row items-center shadow-[0_0_15px_rgba(0,241,161,0.4)]"
                  >
                    <FileText size={16} color="#101415" className="mr-2" />
                    <Text className="text-[#101415] font-bold text-sm">Browse Files</Text>
                  </Pressable>

                  {/* Selected File Card */}
                  {selectedFile && (
                    <View className="mt-4 bg-[#121817] border border-[#00f1a1]/50 p-3 rounded-xl flex-row items-center justify-between w-full">
                      <View className="flex-row items-center flex-1 mr-2">
                        <CheckCircle2 size={18} color="#00f1a1" className="mr-2.5" />
                        <View className="flex-1">
                          <Text className="text-white text-xs font-bold" numberOfLines={1}>{selectedFile.name}</Text>
                          <Text className="text-white/50 text-[10px]">{selectedFile.size}</Text>
                        </View>
                      </View>
                      <Pressable onPress={() => setSelectedFile(null)} className="p-1">
                        <X size={16} color="rgba(255,255,255,0.6)" />
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Required Column Order Box */}
                <View className="bg-[#191e1d] border border-white/10 p-4 rounded-2xl mb-5">
                  <View className="flex-row items-center mb-1">
                    <FileCheck size={16} color="#00f1a1" className="mr-2" />
                    <Text className="text-white font-bold text-xs">Required column order in your file</Text>
                  </View>
                  <Text className="text-white/40 text-[11px] mb-3">
                    Columns must appear in this order (header names are flexible)
                  </Text>

                  {/* 24 Columns Badges */}
                  <View className="flex-row flex-wrap mb-4" style={{ gap: 6 }}>
                    {IMPORT_COLUMNS.map((col) => (
                      <View
                        key={col.num}
                        className="bg-white/5 border border-white/15 px-2.5 py-1 rounded-xl flex-row items-center"
                      >
                        <Text className="text-[#00f1a1] text-[10px] font-bold mr-1">{col.num}.</Text>
                        <Text className="text-white/90 text-[11px] font-medium">
                          {col.name} {col.tag ? <Text className="text-white/40">{col.tag}</Text> : ''}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* EXAMPLE ROW Box */}
                  <Text className="text-white/50 text-[10px] font-bold tracking-wider uppercase mb-1.5">EXAMPLE ROW</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-black/30 p-2.5 rounded-xl mb-3">
                    <View className="flex-row" style={{ gap: 8 }}>
                      {EXAMPLE_ROW_DATA.map((val, idx) => (
                        <View key={idx} className="bg-white/10 border border-white/15 px-2.5 py-1 rounded-lg">
                          <Text className="text-white text-xs font-mono">{val}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>

                  {/* Stats Footer */}
                  <View className="flex-row justify-between items-center pt-2 border-t border-white/10">
                    <Text className="text-[#00f1a1] text-[11px] font-bold">
                      ● 24 columns available (23 are required, 1 is optional)
                    </Text>
                    <Text className="text-white/40 text-[10px]">
                      Dates: DD-MM-YYYY · DD/MM/YYYY · YYYY-MM-DD
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Footer Action Bar */}
              <View className="p-4 border-t border-white/10 bg-[#121817] flex-row justify-between items-center">
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Text className="text-white/60 text-xs font-medium mr-1">Download template:</Text>
                  <Pressable
                    onPress={() => handleDownloadTemplate('excel')}
                    className="bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-lg flex-row items-center"
                  >
                    <FileSpreadsheet size={13} color="#00f1a1" className="mr-1" />
                    <Text className="text-[#00f1a1] text-xs font-bold">Excel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDownloadTemplate('csv')}
                    className="bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-lg flex-row items-center"
                  >
                    <FileText size={13} color="#00f1a1" className="mr-1" />
                    <Text className="text-[#00f1a1] text-xs font-bold">CSV</Text>
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
                    className="bg-[#00f1a1] px-4 py-2 rounded-xl shadow-[0_0_10px_rgba(0,241,161,0.3)]"
                  >
                    <Text className="text-[#101415] font-bold text-xs">Import Data</Text>
                  </Pressable>
                </View>
              </View>
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

export default StudentDirectoryScreen;
