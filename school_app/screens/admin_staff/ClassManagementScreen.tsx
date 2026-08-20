import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  School, Users, UserCheck, Search, Plus,
  Pencil, Calendar, Trash2, ArrowLeft, CheckCircle2,
  AlertCircle, X, ChevronRight, BookOpen, Layers,
  ChevronDown, UserPlus, FileText, Award, Building2, Sparkles, Filter, Phone, Check
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

export interface SubjectTeacher {
  subject: string;
  teacherName: string;
  phone: string;
  hoursPerWeek: number;
}

export interface ClassItem {
  id: string;
  grade: string;          // e.g. "Class 10"
  section: string;        // e.g. "Section A"
  wing: 'Senior Secondary' | 'High School' | 'Middle School' | 'Primary';
  classTeacher: string;   // e.g. "Mrs. Anita Sharma"
  teacherSubject: string; // e.g. "Mathematics"
  teacherPhone: string;
  totalStudents: number;
  maxCapacity: number;
  roomNo: string;
  buildingBlock: string;
  attendanceRate: string;
  presentToday: number;
  absentToday: number;
  classRank: string;
  academicYear: string;
  avatarColor: string;
  subjectTeachers: SubjectTeacher[];
}

const AVAILABLE_FACULTY = [
  { name: 'Mrs. Anita Sharma', subject: 'Mathematics', phone: '+91 98765 43210' },
  { name: 'Mr. Rajesh Kumar', subject: 'Physics', phone: '+91 98480 11223' },
  { name: 'Dr. Meenakshi Sundaram', subject: 'Chemistry', phone: '+91 97001 22334' },
  { name: 'Mr. David Miller', subject: 'English Literature', phone: '+91 99887 76655' },
  { name: 'Mrs. Sunita Rao', subject: 'Social Studies', phone: '+91 94401 55667' },
  { name: 'Mr. Vikramaditya Singh', subject: 'Biology', phone: '+91 91234 56789' },
  { name: 'Mrs. Priya Nambiar', subject: 'Computer Science', phone: '+91 98765 00998' },
  { name: 'Mr. Suresh Verma', subject: 'Hindi / Vernacular', phone: '+91 98112 33445' }
];

const MOCK_CLASSES: ClassItem[] = [
  {
    id: 'cls_1',
    grade: 'Class 10',
    section: 'Section A',
    wing: 'High School',
    classTeacher: 'Mrs. Anita Sharma',
    teacherSubject: 'Mathematics',
    teacherPhone: '+91 98765 43210',
    totalStudents: 42,
    maxCapacity: 45,
    roomNo: 'Room 302',
    buildingBlock: 'Aryabhata Block • Floor 3',
    attendanceRate: '97.5%',
    presentToday: 41,
    absentToday: 1,
    classRank: '#1 in High School',
    academicYear: '2026-2027',
    avatarColor: '#00f1a1',
    subjectTeachers: [
      { subject: 'Mathematics', teacherName: 'Mrs. Anita Sharma', phone: '+91 98765 43210', hoursPerWeek: 6 },
      { subject: 'Physics', teacherName: 'Mr. Rajesh Kumar', phone: '+91 98480 11223', hoursPerWeek: 5 },
      { subject: 'Chemistry', teacherName: 'Dr. Meenakshi Sundaram', phone: '+91 97001 22334', hoursPerWeek: 5 },
      { subject: 'English', teacherName: 'Mr. David Miller', phone: '+91 99887 76655', hoursPerWeek: 4 },
      { subject: 'Social Studies', teacherName: 'Mrs. Sunita Rao', phone: '+91 94401 55667', hoursPerWeek: 4 },
    ]
  },
  {
    id: 'cls_2',
    grade: 'Class 10',
    section: 'Section B',
    wing: 'High School',
    classTeacher: 'Mr. Rajesh Kumar',
    teacherSubject: 'Physics',
    teacherPhone: '+91 98480 11223',
    totalStudents: 40,
    maxCapacity: 45,
    roomNo: 'Room 303',
    buildingBlock: 'Aryabhata Block • Floor 3',
    attendanceRate: '95.2%',
    presentToday: 38,
    absentToday: 2,
    classRank: '#3 in High School',
    academicYear: '2026-2027',
    avatarColor: '#38bdf8',
    subjectTeachers: [
      { subject: 'Physics', teacherName: 'Mr. Rajesh Kumar', phone: '+91 98480 11223', hoursPerWeek: 6 },
      { subject: 'Mathematics', teacherName: 'Mrs. Anita Sharma', phone: '+91 98765 43210', hoursPerWeek: 6 },
      { subject: 'Biology', teacherName: 'Mr. Vikramaditya Singh', phone: '+91 91234 56789', hoursPerWeek: 5 },
      { subject: 'English', teacherName: 'Mr. David Miller', phone: '+91 99887 76655', hoursPerWeek: 4 },
    ]
  },
  {
    id: 'cls_3',
    grade: 'Class 9',
    section: 'Section A',
    wing: 'High School',
    classTeacher: 'Dr. Meenakshi Sundaram',
    teacherSubject: 'Chemistry',
    teacherPhone: '+91 97001 22334',
    totalStudents: 38,
    maxCapacity: 40,
    roomNo: 'Room 201',
    buildingBlock: 'Aryabhata Block • Floor 2',
    attendanceRate: '92.1%',
    presentToday: 35,
    absentToday: 3,
    classRank: '#2 in High School',
    academicYear: '2026-2027',
    avatarColor: '#ec4899',
    subjectTeachers: [
      { subject: 'Chemistry', teacherName: 'Dr. Meenakshi Sundaram', phone: '+91 97001 22334', hoursPerWeek: 6 },
      { subject: 'Mathematics', teacherName: 'Mrs. Anita Sharma', phone: '+91 98765 43210', hoursPerWeek: 5 },
      { subject: 'English', teacherName: 'Mr. David Miller', phone: '+91 99887 76655', hoursPerWeek: 4 },
    ]
  },
  {
    id: 'cls_4',
    grade: 'Class 8',
    section: 'Section A',
    wing: 'Middle School',
    classTeacher: 'Mrs. Sunita Rao',
    teacherSubject: 'Social Studies',
    teacherPhone: '+91 94401 55667',
    totalStudents: 44,
    maxCapacity: 45,
    roomNo: 'Room 105',
    buildingBlock: 'Tagore Block • Floor 1',
    attendanceRate: '98.1%',
    presentToday: 43,
    absentToday: 1,
    classRank: '#1 in Middle School',
    academicYear: '2026-2027',
    avatarColor: '#00f1a1',
    subjectTeachers: [
      { subject: 'Social Studies', teacherName: 'Mrs. Sunita Rao', phone: '+91 94401 55667', hoursPerWeek: 6 },
      { subject: 'Science', teacherName: 'Mr. Vikramaditya Singh', phone: '+91 91234 56789', hoursPerWeek: 5 },
    ]
  },
  {
    id: 'cls_6',
    grade: 'Class 8',
    section: 'Section B',
    wing: 'Middle School',
    classTeacher: 'Mr. Vikramaditya Singh',
    teacherSubject: 'Biology',
    teacherPhone: '+91 91234 56789',
    totalStudents: 41,
    maxCapacity: 45,
    roomNo: 'Room 106',
    buildingBlock: 'Tagore Block • Floor 1',
    attendanceRate: '93.9%',
    presentToday: 38,
    absentToday: 3,
    classRank: '#3 in Middle School',
    academicYear: '2026-2027',
    avatarColor: '#fb7185',
    subjectTeachers: [
      { subject: 'Biology', teacherName: 'Mr. Vikramaditya Singh', phone: '+91 91234 56789', hoursPerWeek: 6 },
    ]
  }
];

export const ClassManagementScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const [classList, setClassList] = useState<ClassItem[]>(MOCK_CLASSES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026-2027');
  const [selectedWingFilter, setSelectedWingFilter] = useState('All');

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.getResources('batches');
        if (Array.isArray(res) && res.length > 0) {
          const mapped: ClassItem[] = res.map((b: any, idx: number) => ({
            id: String(b.id),
            grade: b.name ? b.name.split('—')[0].trim() : `Class ${b.id}`,
            section: b.name && b.name.includes('—') ? b.name.split('—')[1].trim() : 'Section A',
            wing: (b.wing || 'High School') as any,
            classTeacher: b.class_teacher_name || b.teacher_name || 'Mrs. Anita Sharma',
            teacherSubject: b.subject || 'Academics',
            teacherPhone: b.phone || '+91 98765 43210',
            totalStudents: Number(b.total_students || b.students_count || 40),
            maxCapacity: Number(b.capacity || 45),
            roomNo: b.room_no || `Room ${100 + idx}`,
            buildingBlock: b.block || 'Main Academic Block',
            attendanceRate: b.attendance_rate || '96.5%',
            presentToday: Number(b.present_today || 38),
            absentToday: Number(b.absent_today || 2),
            classRank: b.rank || '#1 in Academic Division',
            academicYear: b.academic_year || '2026-2027',
            avatarColor: '#00f1a1',
            subjectTeachers: [
              { subject: 'Core Subjects', teacherName: b.class_teacher_name || 'Faculty Member', phone: '+91 98765 43210', hoursPerWeek: 5 }
            ]
          }));
          setClassList(mapped);
        }
      } catch (err) {
        console.log('Error fetching batches:', err);
      }
    };
    fetchBatches();
  }, []);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [viewingSubjectTeachersClass, setViewingSubjectTeachersClass] = useState<ClassItem | null>(null);
  const [deletingClassItem, setDeletingClassItem] = useState<ClassItem | null>(null);
  
  // Reassign Class Teacher Modal States
  const [reassigningClass, setReassigningClass] = useState<ClassItem | null>(null);
  const [selectedNewTeacher, setSelectedNewTeacher] = useState<typeof AVAILABLE_FACULTY[0] | null>(null);
  const [facultySearch, setFacultySearch] = useState('');

  // Form States
  const [formGrade, setFormGrade] = useState('Class 10');
  const [formSection, setFormSection] = useState('Section C');
  const [formWing, setFormWing] = useState<'Senior Secondary' | 'High School' | 'Middle School' | 'Primary'>('High School');
  const [formTeacher, setFormTeacher] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formBuilding, setFormBuilding] = useState('');
  const [formCapacity, setFormCapacity] = useState('45');

  // Custom Toast State
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'warning' }>({
    visible: false, title: '', message: '', type: 'success'
  });

  const showToast = (title: string, message: string, type: 'success' | 'warning' = 'success') => {
    setToastData({ visible: true, title, message, type });
  };

  const filteredClasses = classList.filter(item => {
    const matchesWing = selectedWingFilter === 'All' || item.wing === selectedWingFilter || item.grade === selectedWingFilter;
    const matchesSearch = item.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.classTeacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.roomNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWing && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingClass(null);
    setFormGrade('Class 10');
    setFormSection('Section C');
    setFormWing('High School');
    setFormTeacher('Mrs. Priya Nambiar');
    setFormSubject('Computer Science');
    setFormPhone('+91 98765 00998');
    setFormRoom('Room 304');
    setFormBuilding('Aryabhata Block • Floor 3');
    setFormCapacity('45');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (cls: ClassItem) => {
    setEditingClass(cls);
    setFormGrade(cls.grade);
    setFormSection(cls.section);
    setFormWing(cls.wing);
    setFormTeacher(cls.classTeacher);
    setFormSubject(cls.teacherSubject);
    setFormPhone(cls.teacherPhone);
    setFormRoom(cls.roomNo);
    setFormBuilding(cls.buildingBlock);
    setFormCapacity(String(cls.maxCapacity));
    setShowAddModal(true);
  };

  const handleOpenReassignModal = (cls: ClassItem) => {
    setReassigningClass(cls);
    setFacultySearch('');
    const current = AVAILABLE_FACULTY.find(f => f.name === cls.classTeacher) || AVAILABLE_FACULTY[0];
    setSelectedNewTeacher(current);
  };

  const handleConfirmReassignTeacher = () => {
    if (!reassigningClass || !selectedNewTeacher) return;

    setClassList(prev => prev.map(c => {
      if (c.id === reassigningClass.id) {
        return {
          ...c,
          classTeacher: selectedNewTeacher.name,
          teacherSubject: selectedNewTeacher.subject,
          teacherPhone: selectedNewTeacher.phone
        };
      }
      return c;
    }));

    const classLabel = `${reassigningClass.grade} ${reassigningClass.section}`;
    setReassigningClass(null);
    showToast('Teacher Reassigned!', `${selectedNewTeacher.name} is now the Class Teacher for ${classLabel}.`, 'success');
  };

  const handleSaveClass = () => {
    if (!formGrade.trim() || !formTeacher.trim()) {
      showToast('Missing Details', 'Please fill in Grade and Class Teacher name.', 'warning');
      return;
    }

    const capNum = parseInt(formCapacity) || 45;

    if (editingClass) {
      setClassList(prev => prev.map(c => c.id === editingClass.id ? {
        ...c,
        grade: formGrade,
        section: formSection,
        wing: formWing,
        classTeacher: formTeacher,
        teacherSubject: formSubject || 'Class Teacher',
        teacherPhone: formPhone || '+91 98765 43210',
        roomNo: formRoom || 'Room 101',
        buildingBlock: formBuilding || 'Main Building',
        maxCapacity: capNum
      } : c));
      showToast('Class Updated!', `${formGrade} ${formSection} details updated successfully.`, 'success');
    } else {
      const newCls: ClassItem = {
        id: `cls_${Date.now()}`,
        grade: formGrade,
        section: formSection,
        wing: formWing,
        classTeacher: formTeacher,
        teacherSubject: formSubject || 'Class Teacher',
        teacherPhone: formPhone || '+91 98765 43210',
        totalStudents: 35,
        maxCapacity: capNum,
        roomNo: formRoom || 'Room 101',
        buildingBlock: formBuilding || 'Main Building',
        attendanceRate: '98.0%',
        presentToday: 35,
        absentToday: 0,
        classRank: '#1 in Section',
        academicYear: selectedAcademicYear,
        avatarColor: '#00f1a1',
        subjectTeachers: [
          { subject: formSubject || 'Core Subject', teacherName: formTeacher, phone: formPhone || '+91 98765 43210', hoursPerWeek: 6 }
        ]
      };
      setClassList(prev => [newCls, ...prev]);
      showToast('New Class Added!', `${formGrade} ${formSection} created successfully.`, 'success');
    }

    setShowAddModal(false);
  };

  const handleConfirmDeleteClass = () => {
    if (!deletingClassItem) return;
    const name = `${deletingClassItem.grade} ${deletingClassItem.section}`;
    setClassList(prev => prev.filter(c => c.id !== deletingClassItem.id));
    setDeletingClassItem(null);
    showToast('Class Deleted', `${name} has been archived/removed.`, 'warning');
  };

  const filteredFaculty = AVAILABLE_FACULTY.filter(f => 
    f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
    f.subject.toLowerCase().includes(facultySearch.toLowerCase())
  );

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';
  const primaryPillClass = isSuperAdmin ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-emerald-500/15 border border-emerald-500/30';

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
        title="Class Management"
        subtitle="Classes, Sections & Teacher Directory"
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <School size={20} color={primaryColor} />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Academic Year Header & Summary Metrics */}
        <View className="px-5 mb-5 flex-row justify-between items-center">
          <View>
            <Text className="text-white text-lg font-extrabold">Academic Overview</Text>
            <Text className="text-white/50 text-xs">Managing {classList.length} active class sections</Text>
          </View>
          <View className={`px-3 py-1.5 rounded-xl flex-row items-center ${primaryBadgeClass}`}>
            <Calendar size={13} color={primaryColor} style={{ marginRight: 6 }} />
            <Text className={`${primaryTextClass} text-xs font-bold`}>{selectedAcademicYear}</Text>
          </View>
        </View>

        {/* 4 Web Summary Metric Cards */}
        <View className="px-5 mb-5 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Total Classes</Text>
              <School size={14} color={primaryColor} />
            </View>
            <Text className="text-white text-xl font-extrabold">{classList.length} Sections</Text>
            <Text className={`${primaryTextClass} text-[10px] font-semibold mt-0.5`}>● 100% Teachers Assigned</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Enrolled Students</Text>
              <Users size={14} color="#38bdf8" />
            </View>
            <Text className="text-white text-xl font-extrabold">1,248 Total</Text>
            <Text className="text-sky-400 text-[10px] font-semibold mt-0.5">● Avg 41 / Class</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Today Attendance</Text>
              <UserCheck size={14} color={primaryColor} />
            </View>
            <Text className="text-white text-xl font-extrabold">96.5%</Text>
            <Text className={`${primaryTextClass} text-[10px] font-semibold mt-0.5`}>● 1,204 Present Today</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Classrooms</Text>
              <Building2 size={14} color="#c084fc" />
            </View>
            <Text className="text-white text-xl font-extrabold">36 Rooms</Text>
            <Text className="text-purple-400 text-[10px] font-semibold mt-0.5">● Smart Displays Active</Text>
          </GlassCard>
        </View>

        {/* Action & Filter Bar */}
        <View className="px-5 mb-5">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1 bg-[#101415] border border-white/15 rounded-2xl flex-row items-center px-3.5 py-2.5 mr-3 shadow-md">
              <Search size={16} color={primaryColor} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search class, section, teacher, room..."
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
              onPress={handleOpenAddModal}
              className={`${primaryBtnClass} px-3.5 py-2.5 rounded-2xl flex-row items-center justify-center shadow-lg active:scale-95 flex-shrink-0`}
              style={{ minWidth: 98 }}
            >
              <Plus size={15} color="#101415" style={{ marginRight: 4 }} />
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#101415', fontSize: 12, fontWeight: '800', flexShrink: 0 }}>
                Add Class
              </Text>
            </Pressable>
          </View>

          {/* Category / Wing Selector Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {['All', 'High School', 'Middle School', 'Class 10', 'Class 9', 'Class 8'].map((wing) => {
                const isSelected = selectedWingFilter === wing;
                return (
                  <Pressable
                    key={wing}
                    onPress={() => setSelectedWingFilter(wing)}
                    className={`px-3.5 py-1.5 rounded-xl border ${isSelected ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/5 border-white/15'}`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white/70'}`}>
                      {wing}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Classes List Cards (Web-Matched Visual Design) */}
        <View className="px-5">
          {filteredClasses.map(cls => {
            const occupancyPct = Math.round((cls.totalStudents / cls.maxCapacity) * 100);
            return (
              <GlassCard key={cls.id} intensity="low" className="mb-4 p-4 border-white/10 bg-[#101415]/90">
                {/* Card Header Row */}
                <View className="flex-row justify-between items-start pb-3 border-b border-white/10 mb-3">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className="w-11 h-11 rounded-2xl items-center justify-center mr-3 border border-white/20 shadow-md"
                      style={{ backgroundColor: isSuperAdmin ? '#f0c11020' : `${cls.avatarColor}20` }}
                    >
                      <School size={22} color={primaryColor} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-white font-extrabold text-lg mr-2">{cls.grade}</Text>
                        <View className={`px-2.5 py-0.5 rounded-md mr-2 ${primaryBadgeClass}`}>
                          <Text className={`${primaryTextClass} text-[10px] font-bold`}>{cls.section}</Text>
                        </View>
                        <View className="bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-md">
                          <Text className="text-sky-400 text-[9px] font-bold">{cls.wing}</Text>
                        </View>
                      </View>
                      <Text className="text-white/50 text-[11px] mt-0.5">{cls.buildingBlock} • {cls.roomNo}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Pressable
                      onPress={() => handleOpenEditModal(cls)}
                      className="bg-white/5 border border-white/10 p-2 rounded-xl"
                    >
                      <Pencil size={14} color="rgba(255,255,255,0.7)" />
                    </Pressable>

                    <Pressable
                      onPress={() => setDeletingClassItem(cls)}
                      className="bg-rose-500/10 border border-rose-500/30 p-2 rounded-xl"
                    >
                      <Trash2 size={14} color="#ff516a" />
                    </Pressable>
                  </View>
                </View>

                {/* Class Teacher Info Card with REASSIGN Button */}
                <View className="bg-black/40 p-3 rounded-2xl mb-3 border border-white/5">
                  <View className="flex-row justify-between items-center mb-2 pb-2 border-b border-white/5">
                    <View className="flex-row items-center">
                      <UserCheck size={13} color={primaryColor} style={{ marginRight: 5 }} />
                      <Text className="text-white/70 text-xs font-bold">Class Teacher Assignment</Text>
                    </View>
                    <Pressable
                      onPress={() => handleOpenReassignModal(cls)}
                      className={`px-2.5 py-1 rounded-xl flex-row items-center ${primaryBadgeClass}`}
                    >
                      <UserPlus size={12} color={primaryColor} style={{ marginRight: 4 }} />
                      <Text className={`${primaryTextClass} text-[10px] font-extrabold`}>Reassign</Text>
                    </Pressable>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${primaryBadgeClass}`}>
                        <Text className={`${primaryTextClass} text-xs font-extrabold`}>{cls.classTeacher.slice(4, 6).toUpperCase()}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-xs font-bold">{cls.classTeacher}</Text>
                        <Text className="text-white/50 text-[10px]">Class Teacher ({cls.teacherSubject})</Text>
                        <Text className="text-white/40 text-[9.5px] mt-0.5">{cls.teacherPhone}</Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <View className={`flex-row items-center px-2 py-0.5 rounded-full mb-1 ${primaryBadgeClass}`}>
                        <Award size={10} color={primaryColor} style={{ marginRight: 4 }} />
                        <Text className={`${primaryTextClass} text-[9.5px] font-bold`}>{cls.classRank}</Text>
                      </View>
                      <Text className="text-white/40 text-[9px]">{cls.attendanceRate} Attendance</Text>
                    </View>
                  </View>
                </View>

                {/* Capacity & Attendance Bar */}
                <View className="bg-white/5 p-3 rounded-2xl mb-3 border border-white/5">
                  <View className="flex-row justify-between items-center mb-1.5">
                    <Text className="text-white/60 text-[11px] font-semibold">
                      Student Occupancy: <Text className="text-white font-bold">{cls.totalStudents} / {cls.maxCapacity} Seats</Text>
                    </Text>
                    <Text className={`${primaryTextClass} text-[11px] font-bold`}>{occupancyPct}% Full</Text>
                  </View>
                  {/* Progress Bar */}
                  <View className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                    <View 
                      className={`h-full rounded-full ${primaryBtnClass}`} 
                      style={{ width: `${occupancyPct}%` }} 
                    />
                  </View>
                  <View className="flex-row justify-between items-center pt-1 border-t border-white/5">
                    <Text className="text-white/40 text-[10px]">Today's Status: {cls.presentToday} Present · {cls.absentToday} Absent</Text>
                    <Text className="text-sky-400 text-[10px] font-bold">{cls.subjectTeachers.length} Subject Teachers</Text>
                  </View>
                </View>

                {/* Web Action Buttons Row */}
                <View className="flex-row justify-between items-center" style={{ gap: 8 }}>
                  <Pressable
                    onPress={() => navigation.navigate('StudentDirectory')}
                    className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${primaryBadgeClass}`}
                  >
                    <Users size={14} color={primaryColor} style={{ marginRight: 5 }} />
                    <Text className={`${primaryTextClass} text-xs font-bold`}>Students ({cls.totalStudents})</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setViewingSubjectTeachersClass(cls)}
                    className="flex-1 bg-purple-500/15 border border-purple-500/40 py-2.5 rounded-xl flex-row items-center justify-center"
                  >
                    <BookOpen size={14} color="#c084fc" style={{ marginRight: 5 }} />
                    <Text className="text-purple-300 text-xs font-bold">Teachers ({cls.subjectTeachers.length})</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => navigation.navigate('TimetableBuilder')}
                    className="bg-white/5 border border-white/10 px-3 py-2.5 rounded-xl flex-row items-center"
                  >
                    <Calendar size={14} color="rgba(255,255,255,0.7)" />
                  </Pressable>
                </View>
              </GlassCard>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* REASSIGN CLASS TEACHER MODAL */}
      <Modal visible={Boolean(reassigningClass)} transparent animationType="slide" onRequestClose={() => setReassigningClass(null)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-md p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            {/* Header */}
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <View className="flex-row items-center">
                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${primaryBadgeClass}`}>
                  <UserPlus size={16} color={primaryColor} />
                </View>
                <View>
                  <Text className="text-white font-bold text-base">Reassign Class Teacher</Text>
                  <Text className={`${primaryTextClass} text-[11px] font-bold`}>
                    {reassigningClass?.grade} {reassigningClass?.section} • Current: {reassigningClass?.classTeacher}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setReassigningClass(null)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            {/* Search Faculty */}
            <View className="bg-black/40 border border-white/15 rounded-xl flex-row items-center px-3 py-2 mb-3">
              <Search size={14} color={primaryColor} style={{ marginRight: 6 }} />
              <TextInput
                placeholder="Search available faculty members..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={facultySearch}
                onChangeText={setFacultySearch}
                className="flex-1 text-white text-xs"
                style={{ paddingVertical: 0 }}
              />
            </View>

            {/* Available Faculty List */}
            <Text className="text-white/60 text-[10px] uppercase font-bold tracking-wider mb-2">Select New Class Teacher</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 260 }}>
              {filteredFaculty.map((fac, idx) => {
                const isSelected = selectedNewTeacher?.name === fac.name;
                return (
                  <Pressable
                    key={idx}
                    onPress={() => setSelectedNewTeacher(fac)}
                    className={`p-3 rounded-2xl mb-2 flex-row justify-between items-center border ${isSelected ? primaryBadgeClass : 'bg-white/5 border-white/10'}`}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className={`w-8 h-8 rounded-full items-center justify-center mr-2.5 ${isSelected ? `${primaryBtnClass} text-[#101415]` : 'bg-white/10 text-white'}`}>
                        <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white'}`}>{fac.name.slice(4, 6).toUpperCase()}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-xs font-bold">{fac.name}</Text>
                        <Text className="text-white/50 text-[10px]">{fac.subject} • {fac.phone}</Text>
                      </View>
                    </View>

                    {isSelected && (
                      <View className={`w-6 h-6 rounded-full items-center justify-center ${primaryBtnClass}`}>
                        <Check size={14} color="#101415" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Footer Buttons */}
            <View className="flex-row border-t border-white/10 pt-3 mt-3" style={{ gap: 10 }}>
              <Pressable onPress={() => setReassigningClass(null)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmReassignTeacher} className={`flex-1 py-3 rounded-xl ${primaryBtnClass} items-center shadow-lg`}>
                <Text className="text-[#101415] font-extrabold text-xs">Assign Teacher</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* VIEW SUBJECT TEACHERS MODAL */}
      <Modal visible={Boolean(viewingSubjectTeachersClass)} transparent animationType="slide" onRequestClose={() => setViewingSubjectTeachersClass(null)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-md p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 items-center justify-center mr-2.5">
                  <BookOpen size={16} color="#c084fc" />
                </View>
                <View>
                  <Text className="text-white font-bold text-base">
                    {viewingSubjectTeachersClass?.grade} {viewingSubjectTeachersClass?.section} Teachers
                  </Text>
                  <Text className="text-white/50 text-[10px]">Assigned Faculty & Class Load</Text>
                </View>
              </View>
              <Pressable onPress={() => setViewingSubjectTeachersClass(null)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {viewingSubjectTeachersClass?.subjectTeachers.map((st, idx) => (
                <View key={idx} className="bg-white/5 border border-white/10 p-3 rounded-2xl mb-2.5 flex-row justify-between items-center">
                  <View className="flex-1 mr-2">
                    <Text className={`${primaryTextClass} text-xs font-bold`}>{st.subject}</Text>
                    <Text className="text-white font-semibold text-xs mt-0.5">{st.teacherName}</Text>
                    <Text className="text-white/40 text-[10px]">{st.phone}</Text>
                  </View>
                  <View className="bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 rounded-xl">
                    <Text className="text-purple-300 text-[10px] font-bold">{st.hoursPerWeek} hrs/wk</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <Pressable onPress={() => setViewingSubjectTeachersClass(null)} className={`w-full py-3 rounded-xl ${primaryBtnClass} items-center mt-3 shadow-lg`}>
              <Text className="text-[#101415] font-extrabold text-xs">Close Directory</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ADD / EDIT CLASS MODAL */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-md p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <View className="flex-row items-center">
                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${primaryBadgeClass}`}>
                  <School size={16} color={primaryColor} />
                </View>
                <Text className="text-white font-bold text-base">
                  {editingClass ? 'Edit Class Details' : 'Create New Class / Section'}
                </Text>
              </View>
              <Pressable onPress={() => setShowAddModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <View className="flex-row mb-3" style={{ gap: 10 }}>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Grade *</Text>
                  <TextInput
                    value={formGrade}
                    onChangeText={setFormGrade}
                    placeholder="e.g. Class 10"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Section *</Text>
                  <TextInput
                    value={formSection}
                    onChangeText={setFormSection}
                    placeholder="e.g. Section A"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Class Teacher Name *</Text>
                <TextInput
                  value={formTeacher}
                  onChangeText={setFormTeacher}
                  placeholder="e.g. Mrs. Anita Sharma"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                />
              </View>

              <View className="flex-row mb-3" style={{ gap: 10 }}>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Teacher Subject</Text>
                  <TextInput
                    value={formSubject}
                    onChangeText={setFormSubject}
                    placeholder="e.g. Mathematics"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Teacher Mobile</Text>
                  <TextInput
                    value={formPhone}
                    onChangeText={setFormPhone}
                    placeholder="+91 98765 43210"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>
              </View>

              <View className="flex-row mb-3" style={{ gap: 10 }}>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Room No</Text>
                  <TextInput
                    value={formRoom}
                    onChangeText={setFormRoom}
                    placeholder="e.g. Room 302"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">Max Capacity</Text>
                  <TextInput
                    value={formCapacity}
                    onChangeText={setFormCapacity}
                    keyboardType="numeric"
                    placeholder="45"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>
              </View>
            </ScrollView>

            <View className="flex-row border-t border-white/10 pt-3 mt-2" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveClass} className={`flex-1 py-3 rounded-xl ${primaryBtnClass} items-center shadow-lg`}>
                <Text className="text-[#101415] font-extrabold text-xs">
                  {editingClass ? 'Update Class' : 'Create Class'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CONFIRM DELETE CLASS MODAL */}
      <Modal visible={Boolean(deletingClassItem)} transparent animationType="fade" onRequestClose={() => setDeletingClassItem(null)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-rose-500/50 rounded-3xl w-full max-w-sm p-6 items-center shadow-[0_0_30px_rgba(255,81,106,0.3)]">
            <View className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/50 items-center justify-center mb-4">
              <Trash2 size={28} color="#ff516a" />
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">Delete Class Section?</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">
              Are you sure you want to delete "{deletingClassItem?.grade} {deletingClassItem?.section}"? All associated timetables and teacher assignments will be unlinked.
            </Text>

            <View className="flex-row w-full" style={{ gap: 10 }}>
              <Pressable onPress={() => setDeletingClassItem(null)} className="flex-1 py-3.5 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmDeleteClass} className="flex-1 py-3.5 rounded-xl bg-rose-500 items-center shadow-[0_0_12px_rgba(255,81,106,0.4)]">
                <Text className="text-white font-extrabold text-xs">Delete Class</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUSTOM ADMIN STAFF TOAST MODAL */}
      <Modal visible={toastData.visible} transparent animationType="fade" onRequestClose={() => setToastData(prev => ({ ...prev, visible: false }))}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-sm p-6 items-center ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
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

export default ClassManagementScreen;
