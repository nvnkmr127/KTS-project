import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Modal, Platform, Keyboard, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../components/GlassCard';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';
import {
  UserPlus, ChevronDown, Calendar, HelpCircle,
  CheckCircle2, ArrowLeft, Check, ChevronLeft, ChevronRight, X,
  MapPin, Bus
} from 'lucide-react-native';
import { useFeeStore, DEMO_VILLAGE_RATES } from '../../store/useFeeStore';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

export const AddStudentScreen: React.FC<any> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();
  const { user } = useAuthStore();
  const { villageRates } = useFeeStore();
  const isSuperAdmin = user?.role === 'super_admin';

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';

  const editStudent = route?.params?.student;
  const isEdit = route?.params?.isEdit || false;

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [keyboardPadding, setKeyboardPadding] = useState(0);

  // Calendar Modal State
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [calendarTargetField, setCalendarTargetField] = useState<'dob' | 'admissionDate'>('dob');
  const [calMonth, setCalMonth] = useState<number>(() => new Date().getMonth());
  const [calYear, setCalYear] = useState<number>(() => new Date().getFullYear());
  const [calSelectedDay, setCalSelectedDay] = useState<number>(() => new Date().getDate());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const openCalendarFor = (target: 'dob' | 'admissionDate') => {
    setCalendarTargetField(target);
    const val = target === 'dob' ? dobForm : admissionDateForm;
    let d = new Date();
    if (val && val.includes('-')) {
      const parts = val.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          // DD-MM-YYYY
          d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
      }
    } else if (target === 'dob' && !val) {
      d = new Date(2016, 5, 15);
    }
    if (!isNaN(d.getTime())) {
      setCalYear(d.getFullYear());
      setCalMonth(d.getMonth());
      setCalSelectedDay(d.getDate());
    } else {
      const now = new Date();
      setCalYear(now.getFullYear());
      setCalMonth(now.getMonth());
      setCalSelectedDay(now.getDate());
    }
    setShowYearPicker(false);
    setCalendarModalVisible(true);
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    const today = new Date();
    const isCurrentOrFutureMonth = calYear > today.getFullYear() || (calYear === today.getFullYear() && calMonth >= today.getMonth());
    if (isCurrentOrFutureMonth) return;
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  const calPrevMonthRef = useRef(handlePrevMonth);
  const calNextMonthRef = useRef(handleNextMonth);
  calPrevMonthRef.current = handlePrevMonth;
  calNextMonthRef.current = handleNextMonth;

  // Swipe Gesture Responder for Calendar Month Grid (Right-to-Left: Next Month, Left-to-Right: Previous Month)
  const calSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 15;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -35) {
          calNextMonthRef.current?.();
        } else if (gestureState.dx > 35) {
          calPrevMonthRef.current?.();
        }
      },
    })
  ).current;

  const handleSetToday = () => {
    const now = new Date();
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth());
    setCalSelectedDay(now.getDate());
  };

  const handleApplyCalendarDate = (selectedDayOverride?: number) => {
    const day = selectedDayOverride || calSelectedDay;
    const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const safeDay = Math.min(Math.max(1, day), daysInCurrentMonth);

    // Prevent selecting future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const candidateDate = new Date(calYear, calMonth, safeDay);
    if (candidateDate > today) {
      return;
    }

    const dayStr = String(safeDay).padStart(2, '0');
    const monthStr = String(calMonth + 1).padStart(2, '0');
    const formatted = `${dayStr}-${monthStr}-${calYear}`;
    if (calendarTargetField === 'dob') {
      setDobForm(formatted);
    } else {
      setAdmissionDateForm(formatted);
    }
    setCalendarModalVisible(false);
  };

  const calendarCells = React.useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      cells.push(d);
    }
    return cells;
  }, [calYear, calMonth]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardPadding(e.endCoordinates.height - (insets.bottom || 0));
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardPadding(0);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom]);

  // Form State
  const [firstName, setFirstName] = useState(() => editStudent ? (editStudent.name.split(' ')[0] || '') : '');
  const [lastName, setLastName] = useState(() => editStudent ? (editStudent.name.split(' ').slice(1).join(' ') || '') : '');
  const [studentClass, setStudentClass] = useState(() => editStudent?.className ? editStudent.className.split('—')[0].trim() : 'Class 1');
  const [section, setSection] = useState(() => editStudent?.className && editStudent.className.includes('—') ? `Section ${editStudent.className.split('—')[1].trim()}` : 'Section A');
  const [gender, setGender] = useState(() => editStudent?.gender || 'Male');
  const [admissionNoForm, setAdmissionNoForm] = useState(() => editStudent?.admissionNo || '');
  const [penNoForm, setPenNoForm] = useState(() => editStudent?.penNo || '');
  const [dobForm, setDobForm] = useState(() => editStudent?.dob || '');
  const [admissionDateForm, setAdmissionDateForm] = useState('03-08-2026');

  // Student Status State (matching web app: Active, Transferred, Left)
  const [statusForm, setStatusForm] = useState<'Active' | 'Transferred' | 'Left'>(() => {
    if (editStudent?.status) {
      if (editStudent.status === 'Transfer' || editStudent.status === 'Transferred') return 'Transferred';
      if (editStudent.status === 'Left') return 'Left';
    }
    return 'Active';
  });

  // Parent / Guardian Details
  const [fatherName, setFatherName] = useState(() => editStudent?.parentName || '');
  const [fatherMobile, setFatherMobile] = useState(() => editStudent?.phone || '');
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherMobile, setMotherMobile] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');
  const [guardianMobile, setGuardianMobile] = useState('');
  const [address, setAddress] = useState(() => editStudent?.address || '');
  const [selectedVillage, setSelectedVillage] = useState<string>(() => editStudent?.village || '');
  const [showVillagePicker, setShowVillagePicker] = useState(false);
  const [biometricCode, setBiometricCode] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');

  // Demographics & TC Details
  const [motherTongue, setMotherTongue] = useState('');
  const [nationality, setNationality] = useState('Indian');
  const [stateForm, setStateForm] = useState('');
  const [religion, setReligion] = useState('');
  const [caste, setCaste] = useState('');
  const [subCaste, setSubCaste] = useState('');
  const [tcNumber, setTcNumber] = useState('');

  // Dropdown Picker Toggle States
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [savedStudentData, setSavedStudentData] = useState<any>(null);

  const matchedVillageRate = (villageRates || DEMO_VILLAGE_RATES).find(
    r => r.village.toLowerCase() === selectedVillage.toLowerCase()
  );

  const handleSelectVillage = (villageName: string) => {
    setSelectedVillage(villageName);
    setShowVillagePicker(false);
    if (!address || address.trim() === '' || (villageRates || DEMO_VILLAGE_RATES).some(r => r.village === address)) {
      setAddress(villageName);
    }
  };

  const handleSaveStudent = async () => {
    setIsSaving(true);
    const dbStatus = statusForm === 'Transferred' ? 'transfer' : statusForm === 'Left' ? 'left' : 'active';
    const normalizedStatus: 'Active' | 'Left' | 'Transfer' = statusForm === 'Transferred' ? 'Transfer' : statusForm === 'Left' ? 'Left' : 'Active';

    const studentDataToSave = {
      id: editStudent?.id || String(Date.now()),
      name: `${firstName} ${lastName}`.trim() || editStudent?.name || 'Student',
      gender: gender as any,
      dob: dobForm || editStudent?.dob || 'N/A',
      admissionNo: admissionNoForm || editStudent?.admissionNo || `STDDe2026${Date.now().toString().slice(-4)}`,
      penNo: penNoForm || editStudent?.penNo || 'N/A',
      className: `${studentClass} — ${section.replace('Section ', '')}`,
      academicYear: editStudent?.academicYear || '2026-2027',
      parentName: fatherName || motherName || editStudent?.parentName || 'Parent',
      phone: fatherMobile || motherMobile || editStudent?.phone || '+91 9876543210',
      feeStatus: editStudent?.feeStatus || 'Paid',
      status: normalizedStatus,
      initials: ((firstName[0] || editStudent?.name?.[0] || 'S') + (lastName[0] || editStudent?.name?.[1] || 'T')).toUpperCase(),
      avatarColor: editStudent?.avatarColor || '#3b82f6',
      address,
      village: selectedVillage,
      transportFee: matchedVillageRate?.amount || 0,
    };

    setSavedStudentData(studentDataToSave);

    try {
      if (isEdit && editStudent?.id) {
        await api.updateResource('students', editStudent.id, {
          name: studentDataToSave.name,
          class_name: studentDataToSave.className,
          gender,
          admission_number: studentDataToSave.admissionNo,
          pen_number: studentDataToSave.penNo,
          dob: studentDataToSave.dob,
          status: dbStatus,
          father_name: fatherName,
          father_mobile: fatherMobile,
          address,
          village: selectedVillage,
          transport_fee: matchedVillageRate?.amount || 0,
        });
      } else {
        await api.createResource('students', {
          name: studentDataToSave.name,
          first_name: firstName,
          last_name: lastName,
          class_name: studentDataToSave.className,
          gender,
          admission_number: studentDataToSave.admissionNo,
          pen_number: studentDataToSave.penNo,
          dob: studentDataToSave.dob,
          father_name: fatherName,
          father_mobile: fatherMobile,
          mother_name: motherName,
          mother_mobile: motherMobile,
          address,
          village: selectedVillage,
          transport_fee: matchedVillageRate?.amount || 0,
          aadhar_number: aadharNumber,
          status: dbStatus,
        });
      }
    } catch (err) {
      console.log('Error saving student in database:', err);
    } finally {
      setIsSaving(false);
      setSuccessModalVisible(true);
    }
  };

  const handleFinish = () => {
    setSuccessModalVisible(false);
    if (isEdit) {
      navigation.navigate('StudentDirectory', { updatedStudent: savedStudentData });
    } else {
      navigation.navigate('StudentDirectory', { newStudent: savedStudentData });
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

      <AdminStaffHeader
        title={isEdit ? "Edit Student Profile" : "Add New Student"}
        subtitle={isSuperAdmin ? "SUPER ADMIN REGISTRATION TERMINAL" : "STUDENT REGISTRATION TERMINAL"}
        onBackPress={() => navigation.goBack()}
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <UserPlus size={20} color={primaryColor} />
          </View>
        }
      />

      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            containerStyle,
            { paddingBottom: keyboardPadding > 0 ? keyboardPadding + 20 : scrollBottomPadding + 24 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard intensity="low" className={`p-5 bg-[#101415]/80 mb-6 border ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/20'}`}>
            <Text className="text-white text-xl font-extrabold mb-1.5">{isEdit ? "Update Student Details" : "Student Registration Form"}</Text>
            <Text className="text-white/70 text-sm mb-6 leading-5">Fill in all required student and parent details to {isEdit ? "update" : "register"} the student record.</Text>

            {/* SECTION 1: Core Info */}
            <Text className={`${primaryTextClass} text-sm font-extrabold tracking-wider uppercase mb-4 pb-2 border-b ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/20'}`}>
              1. Basic Student Info
            </Text>

            {/* First Name & Last Name */}
            <View className="flex-row mb-4" style={{ gap: 12 }}>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">First Name <Text className="text-[#ff516a]">*</Text></Text>
                <TextInput
                  placeholder="Arjun"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={firstName}
                  onChangeText={setFirstName}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Last Name <Text className="text-[#ff516a]">*</Text></Text>
                <TextInput
                  placeholder="Reddy"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={lastName}
                  onChangeText={setLastName}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
            </View>

            {/* Class, Section, Gender Pickers */}
            <View className="flex-row mb-4" style={{ gap: 10 }}>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Class <Text className="text-[#ff516a]">*</Text></Text>
                <Pressable
                  onPress={() => setShowClassPicker(!showClassPicker)}
                  className="bg-white/5 border border-white/15 rounded-xl px-3.5 py-3 flex-row justify-between items-center"
                >
                  <Text className="text-white text-sm font-bold" numberOfLines={1}>{studentClass}</Text>
                  <ChevronDown size={16} color={primaryColor} />
                </Pressable>
              </View>

              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Section <Text className="text-[#ff516a]">*</Text></Text>
                <Pressable
                  onPress={() => setShowSectionPicker(!showSectionPicker)}
                  className="bg-white/5 border border-white/15 rounded-xl px-3.5 py-3 flex-row justify-between items-center"
                >
                  <Text className="text-white text-sm font-bold" numberOfLines={1}>{section}</Text>
                  <ChevronDown size={16} color={primaryColor} />
                </Pressable>
              </View>

              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Gender <Text className="text-[#ff516a]">*</Text></Text>
                <Pressable
                  onPress={() => setShowGenderPicker(!showGenderPicker)}
                  className="bg-white/5 border border-white/15 rounded-xl px-3.5 py-3 flex-row justify-between items-center"
                >
                  <Text className="text-white text-sm font-bold" numberOfLines={1}>{gender}</Text>
                  <ChevronDown size={16} color={primaryColor} />
                </Pressable>
              </View>
            </View>

            {/* Expandable Pickers Selection Row */}
            {showClassPicker && (
              <View className={`bg-[#141a18] border p-3 rounded-xl mb-4 flex-row flex-wrap ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/30'}`} style={{ gap: 8 }}>
                {['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(cls => (
                  <Pressable key={cls} onPress={() => { setStudentClass(cls); setShowClassPicker(false); }} className={`px-3 py-2 rounded-lg ${studentClass === cls ? primaryBtnClass : 'bg-white/10'}`}>
                    <Text className={`text-sm font-bold ${studentClass === cls ? 'text-[#101415]' : 'text-white'}`}>{cls}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {showSectionPicker && (
              <View className={`bg-[#141a18] border p-3 rounded-xl mb-4 flex-row flex-wrap ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/30'}`} style={{ gap: 8 }}>
                {['Section A', 'Section B', 'Section C', 'Section D'].map(sec => (
                  <Pressable key={sec} onPress={() => { setSection(sec); setShowSectionPicker(false); }} className={`px-3 py-2 rounded-lg ${section === sec ? primaryBtnClass : 'bg-white/10'}`}>
                    <Text className={`text-sm font-bold ${section === sec ? 'text-[#101415]' : 'text-white'}`}>{sec}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {showGenderPicker && (
              <View className={`bg-[#141a18] border p-3 rounded-xl mb-4 flex-row flex-wrap ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/30'}`} style={{ gap: 8 }}>
                {['Male', 'Female', 'Other'].map(g => (
                  <Pressable key={g} onPress={() => { setGender(g); setShowGenderPicker(false); }} className={`px-3.5 py-2 rounded-lg ${gender === g ? primaryBtnClass : 'bg-white/10'}`}>
                    <Text className={`text-sm font-bold ${gender === g ? 'text-[#101415]' : 'text-white'}`}>{g}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Admission Number & Student PEN NO. */}
            <View className="flex-row mb-4" style={{ gap: 12 }}>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Admission Number</Text>
                <TextInput
                  placeholder="Leave blank to auto-generate"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={admissionNoForm}
                  onChangeText={setAdmissionNoForm}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Student PEN NO.</Text>
                <TextInput
                  placeholder="Student PEN Number"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={penNoForm}
                  onChangeText={setPenNoForm}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
            </View>

            {/* Date of Birth & Admission Date */}
            <View className={`flex-row ${isEdit ? 'mb-4' : 'mb-6'}`} style={{ gap: 12 }}>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Date of Birth <Text className="text-[#ff516a]">*</Text></Text>
                <View className="flex-row items-center bg-white/5 border border-white/15 rounded-xl px-3.5 py-1.5">
                  <TextInput
                    placeholder="dd-mm-yyyy"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={dobForm}
                    onChangeText={setDobForm}
                    className="flex-1 text-white text-sm font-medium py-2 pr-1"
                  />
                  <Pressable
                    onPress={() => openCalendarFor('dob')}
                    className={`p-2 rounded-lg ${isSuperAdmin ? 'bg-[#f0c110]/20' : 'bg-[#00f1a1]/20'} active:scale-95`}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Calendar size={18} color={primaryColor} />
                  </Pressable>
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Admission Date</Text>
                <View className="flex-row items-center bg-white/5 border border-white/15 rounded-xl px-3.5 py-1.5">
                  <TextInput
                    placeholder="03-08-2026"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={admissionDateForm}
                    onChangeText={setAdmissionDateForm}
                    className="flex-1 text-white text-sm font-medium py-2 pr-1"
                  />
                  <Pressable
                    onPress={() => openCalendarFor('admissionDate')}
                    className={`p-2 rounded-lg ${isSuperAdmin ? 'bg-[#f0c110]/20' : 'bg-[#00f1a1]/20'} active:scale-95`}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Calendar size={18} color={primaryColor} />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Student Status Dropdown (Shown in Edit Mode below Date of Birth, matching web app) */}
            {isEdit && (
              <View className="mb-6">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Student Status</Text>
                <Pressable
                  onPress={() => setShowStatusPicker(!showStatusPicker)}
                  className="bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 flex-row justify-between items-center active:bg-white/10"
                >
                  <Text className="text-white text-sm font-bold">{statusForm === 'Left' ? 'Left (Dropout)' : statusForm}</Text>
                  <ChevronDown size={16} color={primaryColor} />
                </Pressable>

                {showStatusPicker && (
                  <View className={`bg-[#121817] border p-2 rounded-xl mt-2 ${isSuperAdmin ? 'border-[#f0c110]/40' : 'border-[#00f1a1]/40'}`} style={{ gap: 4 }}>
                    {[
                      { label: 'Active', val: 'Active' },
                      { label: 'Transferred', val: 'Transferred' },
                      { label: 'Left (Dropout)', val: 'Left' }
                    ].map(opt => {
                      const isSelected = statusForm === opt.val;
                      return (
                        <Pressable
                          key={opt.val}
                          onPress={() => {
                            setStatusForm(opt.val as any);
                            setShowStatusPicker(false);
                          }}
                          className={`px-3.5 py-3 rounded-lg flex-row items-center justify-between ${isSelected ? (isSuperAdmin ? 'bg-[#f0c110]/20' : 'bg-[#00f1a1]/20') : 'active:bg-white/5'
                            }`}
                        >
                          <Text className={`text-sm ${isSelected ? `${primaryTextClass} font-bold` : 'text-white/80 font-semibold'}`}>
                            {opt.label}
                          </Text>
                          {isSelected && <Check size={16} color={primaryColor} />}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* SECTION 2: Parent / Guardian Details */}
            <Text className={`${primaryTextClass} text-sm font-extrabold tracking-wider uppercase mb-4 pb-2 border-b ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/20'}`}>
              2. Parent / Guardian Details
            </Text>

            {/* Father's Info */}
            <View className="flex-row mb-4" style={{ gap: 12 }}>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Father's Name <Text className="text-[#ff516a]">*</Text></Text>
                <TextInput
                  placeholder="Father's name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={fatherName}
                  onChangeText={setFatherName}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Father's Mobile</Text>
                <TextInput
                  placeholder="Father's phone"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="phone-pad"
                  value={fatherMobile}
                  onChangeText={setFatherMobile}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-white/80 text-sm mb-1.5 font-bold">Father's Occupation</Text>
              <TextInput
                placeholder="e.g. Business"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={fatherOccupation}
                onChangeText={setFatherOccupation}
                className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
              />
            </View>

            {/* Mother's Info */}
            <View className="flex-row mb-4" style={{ gap: 12 }}>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Mother's Name</Text>
                <TextInput
                  placeholder="Mother's name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={motherName}
                  onChangeText={setMotherName}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Mother's Mobile</Text>
                <TextInput
                  placeholder="Mother's phone"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="phone-pad"
                  value={motherMobile}
                  onChangeText={setMotherMobile}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
            </View>

            <View className="flex-row mb-4" style={{ gap: 12 }}>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Mother's Occupation</Text>
                <TextInput
                  placeholder="e.g. Teacher"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={motherOccupation}
                  onChangeText={setMotherOccupation}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Guardian Mobile</Text>
                <TextInput
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="phone-pad"
                  value={guardianMobile}
                  onChangeText={setGuardianMobile}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
            </View>

            {/* Village / Transport Route (Bus Transport) */}
            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-white/80 text-sm font-bold flex-row items-center">
                  Village / Route (Bus Transport)
                </Text>
                {selectedVillage ? (
                  <Pressable onPress={() => setSelectedVillage('')}>
                    <Text className="text-rose-400 text-xs font-bold">Clear Route</Text>
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                onPress={() => setShowVillagePicker(!showVillagePicker)}
                className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 flex-row justify-between items-center active:bg-white/10"
              >
                <View className="flex-row items-center">
                  <MapPin size={16} color={primaryColor} style={{ marginRight: 8 }} />
                  <Text className={`text-sm ${selectedVillage ? 'text-white font-bold' : 'text-white/40'}`}>
                    {selectedVillage ? `${selectedVillage} Route` : 'Select Student Village Route (Optional)'}
                  </Text>
                </View>
                <ChevronDown size={16} color={primaryColor} />
              </Pressable>

              {showVillagePicker && (
                <View className={`bg-[#121817] border p-2 rounded-xl mt-2 max-h-52 ${isSuperAdmin ? 'border-[#f0c110]/40' : 'border-[#00f1a1]/40'}`}>
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                    {(villageRates || DEMO_VILLAGE_RATES).map(rate => {
                      const isSelected = selectedVillage.toLowerCase() === rate.village.toLowerCase();
                      return (
                        <Pressable
                          key={rate.id}
                          onPress={() => handleSelectVillage(rate.village)}
                          className={`px-3 py-2.5 rounded-lg flex-row items-center justify-between mb-1 ${
                            isSelected ? (isSuperAdmin ? 'bg-[#f0c110]/20' : 'bg-[#00f1a1]/20') : 'active:bg-white/5'
                          }`}
                        >
                          <View className="flex-row items-center">
                            <MapPin size={13} color={primaryColor} style={{ marginRight: 6 }} />
                            <Text className={`text-xs ${isSelected ? `${primaryTextClass} font-bold` : 'text-white/80 font-medium'}`}>
                              {rate.village}
                            </Text>
                          </View>
                          <Text className="text-emerald-400 font-bold text-xs">₹{rate.amount.toLocaleString()}/yr</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Transport Fee Active Badge */}
              {selectedVillage && matchedVillageRate && (
                <View className="mt-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-400/30 flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Bus size={15} color="#c084fc" style={{ marginRight: 6 }} />
                    <View>
                      <Text className="text-purple-200 text-xs font-bold">
                        Bus Route: {selectedVillage}
                      </Text>
                      <Text className="text-purple-300/70 text-[10px]">
                        Annual Transport Fee Allocated
                      </Text>
                    </View>
                  </View>
                  <View className="bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-400/40">
                    <Text className="text-purple-300 font-extrabold text-xs">
                      ₹{matchedVillageRate.amount.toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Address */}
            <View className="mb-4">
              <Text className="text-white/80 text-sm mb-1.5 font-bold">Address</Text>
              <TextInput
                placeholder="House no, Street, Area, City"
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                numberOfLines={2}
                value={address}
                onChangeText={setAddress}
                className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                style={{ minHeight: 56 }}
              />
            </View>

            {/* Biometric Code & Aadhar Number */}
            <View className="flex-row mb-6" style={{ gap: 12 }}>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Biometric Code <HelpCircle size={12} color={primaryColor} /></Text>
                <TextInput
                  placeholder="e.g. STU-1001"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={biometricCode}
                  onChangeText={setBiometricCode}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Aadhar Number</Text>
                <TextInput
                  placeholder="e.g. 123456789012"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="numeric"
                  value={aadharNumber}
                  onChangeText={setAadharNumber}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
            </View>

            {/* SECTION 3: Demographics & TC Details */}
            <Text className={`${primaryTextClass} text-sm font-extrabold tracking-wider uppercase mb-4 pb-2 border-b ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/20'}`}>
              3. Demographics & TC Details
            </Text>

            {/* Mother Tongue & Nationality */}
            <View className="flex-row mb-4" style={{ gap: 12 }}>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Mother Tongue</Text>
                <TextInput
                  placeholder="e.g. Telugu, Hindi"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={motherTongue}
                  onChangeText={setMotherTongue}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Nationality</Text>
                <TextInput
                  placeholder="Indian"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={nationality}
                  onChangeText={setNationality}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
            </View>

            {/* State & Religion */}
            <View className="flex-row mb-4" style={{ gap: 12 }}>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">State</Text>
                <TextInput
                  placeholder="e.g. Telangana"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={stateForm}
                  onChangeText={setStateForm}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Religion</Text>
                <TextInput
                  placeholder="e.g. Hindu"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={religion}
                  onChangeText={setReligion}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
            </View>

            {/* Caste & Sub Caste */}
            <View className="flex-row mb-4" style={{ gap: 12 }}>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Caste</Text>
                <TextInput
                  placeholder="e.g. OC, BC-B"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={caste}
                  onChangeText={setCaste}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1.5 font-bold">Sub Caste</Text>
                <TextInput
                  placeholder="Sub Caste"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={subCaste}
                  onChangeText={setSubCaste}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
                />
              </View>
            </View>

            {/* TC Number */}
            <View className="mb-6">
              <Text className="text-white/80 text-sm mb-1.5 font-bold">TC Number</Text>
              <TextInput
                placeholder="TC Number"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={tcNumber}
                onChangeText={setTcNumber}
                className="bg-white/5 border border-white/15 rounded-xl text-white px-4 py-3 text-sm font-medium"
              />
            </View>

            {/* Action Buttons */}
            <View className="flex-row pt-5 border-t border-white/10" style={{ gap: 12 }}>
              <Pressable
                onPress={() => navigation.goBack()}
                className="flex-1 bg-white/10 py-4 px-3 rounded-xl items-center justify-center active:bg-white/15"
              >
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSaveStudent}
                disabled={isSaving}
                className={`flex-1 ${primaryBtnClass} py-4 px-3 rounded-xl items-center justify-center shadow-lg active:scale-95 ${isSaving ? 'opacity-70' : ''}`}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{ color: '#101415', fontWeight: '800', fontSize: 15 }}
                >
                  {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Add Student"}
                </Text>
              </Pressable>
            </View>
          </GlassCard>
        </ScrollView>
      </View>

      {/* Calendar Picker Modal */}
      <Modal
        visible={calendarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center px-4">
          <View className={`bg-[#101415] border p-5 rounded-3xl w-full max-w-sm ${isSuperAdmin ? 'border-[#f0c110]/40' : 'border-[#00f1a1]/40'}`}>
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-white/10">
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <View className={`w-9 h-9 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
                  <Calendar size={18} color={primaryColor} />
                </View>
                <View>
                  <Text className="text-white font-extrabold text-base">
                    {calendarTargetField === 'dob' ? 'Date of Birth' : 'Admission Date'}
                  </Text>
                  <Text className="text-white/60 text-xs font-semibold">
                    Select date on calendar
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setCalendarModalVisible(false)}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
              >
                <X size={16} color="#ffffff" />
              </Pressable>
            </View>

            {/* Month & Year Navigation Row */}
            <View className="flex-row items-center justify-between mb-3 bg-white/5 p-2 rounded-2xl border border-white/10">
              <Pressable
                onPress={handlePrevMonth}
                className="p-2 rounded-xl bg-white/10 active:bg-white/20"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={18} color={primaryColor} />
              </Pressable>

              <Pressable
                onPress={() => setShowYearPicker(!showYearPicker)}
                className={`flex-row items-center px-3 py-1.5 rounded-xl ${showYearPicker ? (isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40') : 'bg-white/10'}`}
                style={{ gap: 6 }}
              >
                <Text className="text-white font-extrabold text-sm">
                  {MONTH_NAMES[calMonth]} {calYear}
                </Text>
                <ChevronDown size={14} color={primaryColor} />
              </Pressable>

              {(() => {
                const today = new Date();
                const isCurrentOrFutureMonth = calYear > today.getFullYear() || (calYear === today.getFullYear() && calMonth >= today.getMonth());
                return (
                  <Pressable
                    onPress={handleNextMonth}
                    disabled={isCurrentOrFutureMonth}
                    className={`p-2 rounded-xl bg-white/10 ${isCurrentOrFutureMonth ? 'opacity-25' : 'active:bg-white/20'}`}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <ChevronRight size={18} color={primaryColor} />
                  </Pressable>
                );
              })()}
            </View>

            {/* Year Picker View (Fast Year Jump) */}
            {showYearPicker ? (
              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Select Year</Text>
                <ScrollView
                  style={{ maxHeight: 180 }}
                  contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 4 }}
                  showsVerticalScrollIndicator={false}
                >
                  {YEAR_OPTIONS.map(yr => {
                    const isSelected = calYear === yr;
                    return (
                      <Pressable
                        key={yr}
                        onPress={() => {
                          setCalYear(yr);
                          setShowYearPicker(false);
                        }}
                        className={`px-3 py-2 rounded-xl ${isSelected ? primaryBtnClass : 'bg-white/10 active:bg-white/20'}`}
                      >
                        <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white'}`}>
                          {yr}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              <View {...calSwipeResponder.panHandlers}>
                {/* Day of Week Headers */}
                <View className="flex-row justify-between mb-2 px-1">
                  {DAY_LABELS.map((dayLabel, idx) => (
                    <View key={idx} style={{ width: '13.5%', alignItems: 'center' }}>
                      <Text className="text-white/50 text-xs font-bold">{dayLabel}</Text>
                    </View>
                  ))}
                </View>

                {/* Calendar Day Grid */}
                <View className="flex-row flex-wrap justify-start mb-4">
                  {calendarCells.map((dayNum, idx) => {
                    if (dayNum === null) {
                      return <View key={`empty-${idx}`} style={{ width: '14.28%', height: 36 }} />;
                    }
                    const isSelected = dayNum === calSelectedDay;
                    const now = new Date();
                    const isToday =
                      dayNum === now.getDate() &&
                      calMonth === now.getMonth() &&
                      calYear === now.getFullYear();

                    const cellDate = new Date(calYear, calMonth, dayNum);
                    now.setHours(23, 59, 59, 999);
                    const isFuture = cellDate > now;

                    return (
                      <View key={`day-${dayNum}`} style={{ width: '14.28%', height: 38, alignItems: 'center', justifyContent: 'center' }}>
                        <Pressable
                          disabled={isFuture}
                          onPress={() => {
                            if (!isFuture) setCalSelectedDay(dayNum);
                          }}
                          className={`w-8 h-8 rounded-xl items-center justify-center ${
                            isFuture
                              ? 'opacity-20 bg-white/5'
                              : isSelected
                              ? primaryBtnClass
                              : isToday
                              ? 'border border-white/40 bg-white/10'
                              : 'active:bg-white/15'
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              isFuture
                                ? 'text-white/30'
                                : isSelected
                                ? 'text-[#101415]'
                                : isToday
                                ? primaryTextClass
                                : 'text-white'
                            }`}
                          >
                            {dayNum}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Selected Date Summary Display */}
            <View className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-3 flex-row items-center justify-between">
              <Text className="text-white/60 text-xs font-medium">Selected Date:</Text>
              <Text className={`${primaryTextClass} text-sm font-extrabold`}>
                {String(calSelectedDay).padStart(2, '0')}-{String(calMonth + 1).padStart(2, '0')}-{calYear}
              </Text>
            </View>

            {/* Modal Actions */}
            <View className="flex-row pt-3 border-t border-white/10" style={{ gap: 10 }}>
              <Pressable
                onPress={handleSetToday}
                className="bg-white/10 py-3 px-3 rounded-xl items-center justify-center active:bg-white/20"
              >
                <Text className="text-white font-bold text-xs">Today</Text>
              </Pressable>

              <Pressable
                onPress={() => setCalendarModalVisible(false)}
                className="flex-1 bg-white/10 py-3 px-3 rounded-xl items-center justify-center active:bg-white/20"
              >
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={() => handleApplyCalendarDate()}
                className={`flex-1 ${primaryBtnClass} py-3 px-3 rounded-xl items-center justify-center shadow-lg active:scale-95`}
              >
                <Text className="text-[#101415] font-extrabold text-xs">Apply Date</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className={`bg-[#101415] border p-6 rounded-3xl w-full max-w-sm items-center ${isSuperAdmin ? 'border-[#f0c110]' : 'border-[#00f1a1]'}`}>
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 border ${primaryBadgeClass}`}>
              <CheckCircle2 size={32} color={primaryColor} />
            </View>
            <Text className="text-white text-2xl font-extrabold text-center mb-2">{isEdit ? "Student Updated!" : "Student Added!"}</Text>
            <Text className="text-white/80 text-base text-center mb-6 leading-6">
              Record for <Text className={`${primaryTextClass} font-extrabold`}>{firstName || 'Student'} {lastName}</Text> has been saved.
            </Text>
            <Pressable
              onPress={handleFinish}
              className={`${primaryBtnClass} py-3.5 px-8 rounded-xl w-full items-center shadow-lg active:scale-95`}
            >
              <Text className="text-[#101415] font-extrabold text-base">View Student Directory</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

export default AddStudentScreen;
