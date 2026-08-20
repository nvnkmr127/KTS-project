import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Modal, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../components/GlassCard';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';
import {
  UserPlus, ChevronDown, Calendar, HelpCircle,
  CheckCircle2, ArrowLeft, Check
} from 'lucide-react-native';

export const AddStudentScreen: React.FC<any> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { isSmallPhone } = useResponsive();
  const { user } = useAuthStore();
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
  const [address, setAddress] = useState('');
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
        style={StyleSheet.absoluteFillObject}
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
            { paddingBottom: keyboardPadding > 0 ? keyboardPadding + 20 : 30 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard intensity="low" className={`p-5 bg-[#101415]/80 mb-6 border ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/20'}`}>
            <Text className="text-white text-lg font-bold mb-1">{isEdit ? "Update Student Details" : "Student Registration Form"}</Text>
            <Text className="text-white/60 text-xs mb-5">Fill in all required student and parent details to update the record.</Text>

            {/* SECTION 1: Core Info */}
            <Text className={`${primaryTextClass} text-xs font-bold tracking-wider uppercase mb-3 pb-1 border-b ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/20'}`}>
              1. Basic Student Info
            </Text>

            {/* First Name & Last Name */}
            <View className="flex-row mb-3" style={{ gap: 10 }}>
              <View className="flex-1">
                <Text className="text-white/70 text-xs mb-1 font-semibold">First Name <Text className="text-[#ff516a]">*</Text></Text>
                <TextInput
                  placeholder="Arjun"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={firstName}
                  onChangeText={setFirstName}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-sm"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-xs mb-1 font-semibold">Last Name <Text className="text-[#ff516a]">*</Text></Text>
                <TextInput
                  placeholder="Reddy"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={lastName}
                  onChangeText={setLastName}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-sm"
                />
              </View>
            </View>

            {/* Class, Section, Gender Pickers */}
            <View className="flex-row mb-3" style={{ gap: 8 }}>
              <View className="flex-1">
                <Text className="text-white/70 text-xs mb-1 font-semibold">Class <Text className="text-[#ff516a]">*</Text></Text>
                <Pressable
                  onPress={() => setShowClassPicker(!showClassPicker)}
                  className="bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 flex-row justify-between items-center"
                >
                  <Text className="text-white text-xs font-semibold">{studentClass}</Text>
                  <ChevronDown size={14} color={primaryColor} />
                </Pressable>
              </View>

              <View className="flex-1">
                <Text className="text-white/70 text-xs mb-1 font-semibold">Section <Text className="text-[#ff516a]">*</Text></Text>
                <Pressable
                  onPress={() => setShowSectionPicker(!showSectionPicker)}
                  className="bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 flex-row justify-between items-center"
                >
                  <Text className="text-white text-xs font-semibold">{section}</Text>
                  <ChevronDown size={14} color={primaryColor} />
                </Pressable>
              </View>

              <View className="flex-1">
                <Text className="text-white/70 text-xs mb-1 font-semibold">Gender <Text className="text-[#ff516a]">*</Text></Text>
                <Pressable
                  onPress={() => setShowGenderPicker(!showGenderPicker)}
                  className="bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 flex-row justify-between items-center"
                >
                  <Text className="text-white text-xs font-semibold">{gender}</Text>
                  <ChevronDown size={14} color={primaryColor} />
                </Pressable>
              </View>
            </View>

            {/* Expandable Pickers Selection Row */}
            {showClassPicker && (
              <View className={`bg-white/5 border p-2 rounded-xl mb-3 flex-row flex-wrap ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/30'}`} style={{ gap: 6 }}>
                {['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(cls => (
                  <Pressable key={cls} onPress={() => { setStudentClass(cls); setShowClassPicker(false); }} className={`px-2.5 py-1.5 rounded-lg ${studentClass === cls ? primaryBtnClass : 'bg-white/10'}`}>
                    <Text className={`text-xs font-bold ${studentClass === cls ? 'text-[#101415]' : 'text-white'}`}>{cls}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {showSectionPicker && (
              <View className={`bg-white/5 border p-2 rounded-xl mb-3 flex-row flex-wrap ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/30'}`} style={{ gap: 6 }}>
                {['Section A', 'Section B', 'Section C', 'Section D'].map(sec => (
                  <Pressable key={sec} onPress={() => { setSection(sec); setShowSectionPicker(false); }} className={`px-2.5 py-1.5 rounded-lg ${section === sec ? primaryBtnClass : 'bg-white/10'}`}>
                    <Text className={`text-xs font-bold ${section === sec ? 'text-[#101415]' : 'text-white'}`}>{sec}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {showGenderPicker && (
              <View className={`bg-white/5 border p-2 rounded-xl mb-3 flex-row flex-wrap ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/30'}`} style={{ gap: 6 }}>
                {['Male', 'Female', 'Other'].map(g => (
                  <Pressable key={g} onPress={() => { setGender(g); setShowGenderPicker(false); }} className={`px-2.5 py-1.5 rounded-lg ${gender === g ? primaryBtnClass : 'bg-white/10'}`}>
                    <Text className={`text-xs font-bold ${gender === g ? 'text-[#101415]' : 'text-white'}`}>{g}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Admission Number & Student PEN NO. */}
            <View className="flex-row mb-3" style={{ gap: 10 }}>
              <View className="flex-1">
                <Text className="text-white/70 text-xs mb-1 font-semibold">Admission Number</Text>
                <TextInput
                  placeholder="Leave blank to auto-generate"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={admissionNoForm}
                  onChangeText={setAdmissionNoForm}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-xs"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-xs mb-1 font-semibold">Student PEN NO.</Text>
                <TextInput
                  placeholder="Student PEN Number"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={penNoForm}
                  onChangeText={setPenNoForm}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-xs"
                />
              </View>
            </View>

            {/* Date of Birth & Admission Date */}
            <View className={`flex-row ${isEdit ? 'mb-4' : 'mb-6'}`} style={{ gap: 10 }}>
              <View className="flex-1">
                <Text className="text-white/70 text-xs mb-1 font-semibold">Date of Birth <Text className="text-[#ff516a]">*</Text></Text>
                <View className="flex-row items-center bg-white/5 border border-white/15 rounded-xl px-3 py-2.5">
                  <TextInput
                    placeholder="dd-mm-yyyy"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={dobForm}
                    onChangeText={setDobForm}
                    className="flex-1 text-white text-xs p-0"
                  />
                  <Calendar size={14} color={primaryColor} />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-xs mb-1 font-semibold">Admission Date</Text>
                <View className="flex-row items-center bg-white/5 border border-white/15 rounded-xl px-3 py-2.5">
                  <TextInput
                    placeholder="03-08-2026"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={admissionDateForm}
                    onChangeText={setAdmissionDateForm}
                    className="flex-1 text-white text-xs p-0"
                  />
                  <Calendar size={14} color={primaryColor} />
                </View>
              </View>
            </View>

            {/* Student Status Dropdown (Shown in Edit Mode below Date of Birth, matching web app) */}
            {isEdit && (
              <View className="mb-6">
                <Text className="text-white/70 text-xs mb-1.5 font-semibold">Student Status</Text>
                <Pressable
                  onPress={() => setShowStatusPicker(!showStatusPicker)}
                  className="bg-white/5 border border-white/15 rounded-xl px-3.5 py-3 flex-row justify-between items-center active:bg-white/10"
                >
                  <Text className="text-white text-sm font-semibold">{statusForm === 'Left' ? 'Left (Dropout)' : statusForm}</Text>
                  <ChevronDown size={14} color={primaryColor} />
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
                          className={`px-3 py-2.5 rounded-lg flex-row items-center justify-between ${isSelected ? (isSuperAdmin ? 'bg-[#f0c110]/20' : 'bg-[#00f1a1]/20') : 'active:bg-white/5'
                            }`}
                        >
                          <Text className={`text-xs ${isSelected ? `${primaryTextClass} font-bold` : 'text-white/80 font-medium'}`}>
                            {opt.label}
                          </Text>
                          {isSelected && <Check size={14} color={primaryColor} />}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* SECTION 2: Parent / Guardian Details */}
            <Text className={`${primaryTextClass} text-xs font-bold tracking-wider uppercase mb-3 pb-1 border-b ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/20'}`}>
              2. Parent / Guardian Details
            </Text>

            {/* Father's Info */}
            <View className="flex-row mb-3" style={{ gap: 8 }}>
              <View className="flex-1">
                <Text className="text-white/70 text-[11px] mb-1 font-semibold">Father's Name <Text className="text-[#ff516a]">*</Text></Text>
                <TextInput
                  placeholder="Father's name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={fatherName}
                  onChangeText={setFatherName}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-[11px] mb-1 font-semibold">Father's Mobile</Text>
                <TextInput
                  placeholder="Father's phone"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="phone-pad"
                  value={fatherMobile}
                  onChangeText={setFatherMobile}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-[11px] mb-1 font-semibold">Father's Occupation</Text>
                <TextInput
                  placeholder="e.g. Business"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={fatherOccupation}
                  onChangeText={setFatherOccupation}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>
            </View>

            {/* Mother's Info */}
            <View className="flex-row mb-3" style={{ gap: 8 }}>
              <View className="flex-1">
                <Text className="text-white/70 text-[11px] mb-1 font-semibold">Mother's Name</Text>
                <TextInput
                  placeholder="Mother's name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={motherName}
                  onChangeText={setMotherName}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-[11px] mb-1 font-semibold">Mother's Mobile</Text>
                <TextInput
                  placeholder="Mother's phone"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="phone-pad"
                  value={motherMobile}
                  onChangeText={setMotherMobile}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-[11px] mb-1 font-semibold">Mother's Occupation</Text>
                <TextInput
                  placeholder="e.g. Teacher"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={motherOccupation}
                  onChangeText={setMotherOccupation}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>
            </View>

            {/* Student/Guardian Mobile */}
            <View className="mb-3">
              <Text className="text-white/70 text-xs mb-1 font-semibold">Student/Guardian Mobile Number</Text>
              <TextInput
                placeholder="e.g. 9876543210"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="phone-pad"
                value={guardianMobile}
                onChangeText={setGuardianMobile}
                className="bg-white/5 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-xs"
              />
            </View>

            {/* Address & Biometric Code */}
            <View className="flex-row mb-3" style={{ gap: 10 }}>
              <View className="flex-[1.5]">
                <Text className="text-white/70 text-xs mb-1 font-semibold">Address</Text>
                <TextInput
                  placeholder="House no, Street, Area, City"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  multiline
                  numberOfLines={2}
                  value={address}
                  onChangeText={setAddress}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3.5 py-2 text-xs"
                  style={{ minHeight: 48 }}
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-xs mb-1 font-semibold">Biometric Code <HelpCircle size={10} color={primaryColor} /></Text>
                <TextInput
                  placeholder="e.g. STU-1001"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={biometricCode}
                  onChangeText={setBiometricCode}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-xs"
                />
              </View>
            </View>

            {/* Aadhar Number */}
            <View className="mb-6">
              <Text className="text-white/70 text-xs mb-1 font-semibold">Aadhar Number</Text>
              <TextInput
                placeholder="e.g. 123456789012"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="numeric"
                value={aadharNumber}
                onChangeText={setAadharNumber}
                className="bg-white/5 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-xs"
              />
            </View>

            {/* SECTION 3: Demographics & TC Details */}
            <Text className={`${primaryTextClass} text-xs font-bold tracking-wider uppercase mb-3 pb-1 border-b ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/20'}`}>
              3. Demographics & TC Details
            </Text>

            {/* Mother Tongue, Nationality, State */}
            <View className="flex-row mb-3" style={{ gap: 8 }}>
              <View className="flex-1">
                <Text className="text-white/70 text-[11px] mb-1 font-semibold">Mother Tongue</Text>
                <TextInput
                  placeholder="e.g. Telugu, Hindi"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={motherTongue}
                  onChangeText={setMotherTongue}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-[11px] mb-1 font-semibold">Nationality</Text>
                <TextInput
                  placeholder="Indian"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={nationality}
                  onChangeText={setNationality}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-[11px] mb-1 font-semibold">State</Text>
                <TextInput
                  placeholder="e.g. Telangana"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={stateForm}
                  onChangeText={setStateForm}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>
            </View>

            {/* Religion, Caste, Sub Caste, TC Number */}
            <View className="flex-row mb-6" style={{ gap: 8 }}>
              <View className="flex-1">
                <Text className="text-white/70 text-[11px] mb-1 font-semibold">Religion</Text>
                <TextInput
                  placeholder="e.g. Hindu"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={religion}
                  onChangeText={setReligion}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-2.5 py-2 text-xs"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-[11px] mb-1 font-semibold">Caste</Text>
                <TextInput
                  placeholder="e.g. OC, BC-B"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={caste}
                  onChangeText={setCaste}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-2.5 py-2 text-xs"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-[11px] mb-1 font-semibold">Sub Caste</Text>
                <TextInput
                  placeholder="Sub Caste"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={subCaste}
                  onChangeText={setSubCaste}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-2.5 py-2 text-xs"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-[11px] mb-1 font-semibold">TC Number</Text>
                <TextInput
                  placeholder="TC Number"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={tcNumber}
                  onChangeText={setTcNumber}
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-2.5 py-2 text-xs"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row pt-4 border-t border-white/10" style={{ gap: 10 }}>
              <Pressable
                onPress={() => navigation.goBack()}
                className="flex-1 bg-white/10 py-3.5 px-2 rounded-xl items-center justify-center active:bg-white/15"
              >
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSaveStudent}
                disabled={isSaving}
                className={`flex-1 ${primaryBtnClass} py-3.5 px-2 rounded-xl items-center justify-center shadow-lg active:scale-95 ${isSaving ? 'opacity-70' : ''}`}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{ color: '#101415', fontWeight: '800', fontSize: 14 }}
                >
                  {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Add Student"}
                </Text>
              </Pressable>
            </View>
          </GlassCard>
        </ScrollView>
      </View>

      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className={`bg-[#101415] border p-6 rounded-3xl w-full max-w-sm items-center ${isSuperAdmin ? 'border-[#f0c110]' : 'border-[#00f1a1]'}`}>
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 border ${primaryBadgeClass}`}>
              <CheckCircle2 size={32} color={primaryColor} />
            </View>
            <Text className="text-white text-xl font-bold text-center mb-2">{isEdit ? "Student Updated!" : "Student Added!"}</Text>
            <Text className="text-white/70 text-sm text-center mb-6">
              Record for <Text className={`${primaryTextClass} font-bold`}>{firstName || 'Student'} {lastName}</Text> has been saved.
            </Text>
            <Pressable
              onPress={handleFinish}
              className={`${primaryBtnClass} py-3 px-8 rounded-xl w-full items-center shadow-lg`}
            >
              <Text className="text-[#101415] font-bold text-base">View Student Directory</Text>
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
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

export default AddStudentScreen;
