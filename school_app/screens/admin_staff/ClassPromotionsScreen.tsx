import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TrendingUp, GraduationCap, ArrowRight, CheckCircle2, 
  AlertCircle, X, Search, ChevronDown, Check, UserX, Info
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

export interface StudentPromotionItem {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  rollNo: string;
  status: 'Active' | 'Inactive';
  action: 'promote' | 'retain' | 'left' | 'alumni';
}

const ALL_SOURCE_CLASSES = [
  'Nursery A', 'Nursery B',
  'LKG A', 'LKG B',
  'UKG A', 'UKG B',
  'Class 1A', 'Class 1B',
  'Class 2A', 'Class 2B',
  'Class 3A', 'Class 3B',
  'Class 4A', 'Class 4B',
  'Class 5A', 'Class 5B',
  'Class 6A', 'Class 6B',
  'Class 7A', 'Class 7B',
  'Class 8A', 'Class 8B',
  'Class 9A', 'Class 9B',
  'Class 10A', 'Class 10B'
];

const ALL_DESTINATION_CLASSES: Record<string, string[]> = {
  'Nursery': ['LKG A', 'LKG B'],
  'LKG': ['UKG A', 'UKG B'],
  'UKG': ['Class 1A', 'Class 1B'],
  'Class 1': ['Class 2A', 'Class 2B'],
  'Class 2': ['Class 3A', 'Class 3B'],
  'Class 3': ['Class 4A', 'Class 4B'],
  'Class 4': ['Class 5A', 'Class 5B'],
  'Class 5': ['Class 6A', 'Class 6B'],
  'Class 6': ['Class 7A', 'Class 7B'],
  'Class 7': ['Class 8A', 'Class 8B'],
  'Class 8': ['Class 9A', 'Class 9B'],
  'Class 9': ['Class 10A', 'Class 10B'],
  'Class 10': ['Alumni Network']
};

const autoDestinationMap: Record<string, string> = {
  'Nursery A': 'LKG A', 'Nursery B': 'LKG B',
  'LKG A': 'UKG A', 'LKG B': 'UKG B',
  'UKG A': 'Class 1A', 'UKG B': 'Class 1B',
  'Class 1A': 'Class 2A', 'Class 1B': 'Class 2B',
  'Class 2A': 'Class 3A', 'Class 2B': 'Class 3B',
  'Class 3A': 'Class 4A', 'Class 3B': 'Class 4B',
  'Class 4A': 'Class 5A', 'Class 4B': 'Class 5B',
  'Class 5A': 'Class 6A', 'Class 5B': 'Class 6B',
  'Class 6A': 'Class 7A', 'Class 6B': 'Class 7B',
  'Class 7A': 'Class 8A', 'Class 7B': 'Class 8B',
  'Class 8A': 'Class 9A', 'Class 8B': 'Class 9B',
  'Class 9A': 'Class 10A', 'Class 9B': 'Class 10B',
  'Class 10A': 'Alumni Network', 'Class 10B': 'Alumni Network'
};

// Helper function to extract grade key (e.g. "Class 8A" -> "Class 8", "Nursery A" -> "Nursery")
const getGradeKey = (sourceClassStr: string) => {
  if (sourceClassStr.startsWith('Nursery')) return 'Nursery';
  if (sourceClassStr.startsWith('LKG')) return 'LKG';
  if (sourceClassStr.startsWith('UKG')) return 'UKG';
  const match = sourceClassStr.match(/(Class\s+\d+)/i);
  return match ? match[1] : 'Class 8';
};

const MOCK_CLASS_8A_STUDENTS: StudentPromotionItem[] = [
  { id: '160', name: 'Pogula Sanjay Goud', gender: 'Male', rollNo: '160', status: 'Active', action: 'promote' },
  { id: '161', name: 'Pogula Swathi', gender: 'Female', rollNo: '161', status: 'Active', action: 'promote' },
  { id: '162', name: 'Rathod Maheshwari', gender: 'Female', rollNo: '162', status: 'Active', action: 'promote' },
  { id: '163', name: 'Sara Sathvik', gender: 'Male', rollNo: '163', status: 'Active', action: 'promote' },
  { id: '164', name: 'Sara Uday Kiran', gender: 'Male', rollNo: '164', status: 'Active', action: 'promote' },
  { id: '148', name: 'Chakali Navadeep', gender: 'Male', rollNo: '148', status: 'Active', action: 'promote' },
  { id: '149', name: 'Chakali Sharanya Sri', gender: 'Female', rollNo: '149', status: 'Active', action: 'promote' },
  { id: '150', name: 'Chakali Sneha', gender: 'Female', rollNo: '150', status: 'Active', action: 'promote' },
  { id: '151', name: 'Chakali Vishnu Charan', gender: 'Male', rollNo: '151', status: 'Active', action: 'promote' },
  { id: '152', name: 'Dosada Vaishnavi', gender: 'Female', rollNo: '152', status: 'Active', action: 'promote' },
  { id: '153', name: 'Gundala Manoj Kumar', gender: 'Male', rollNo: '153', status: 'Active', action: 'promote' },
  { id: '154', name: 'Harijan Nani', gender: 'Male', rollNo: '154', status: 'Active', action: 'promote' },
  { id: '155', name: 'Karike Chandana', gender: 'Female', rollNo: '155', status: 'Active', action: 'promote' },
  { id: '156', name: 'Mohammad Sohel Khan', gender: 'Male', rollNo: '156', status: 'Active', action: 'promote' },
  { id: '157', name: 'P Akhil', gender: 'Male', rollNo: '157', status: 'Active', action: 'promote' },
  { id: '158', name: 'P Pranaya', gender: 'Female', rollNo: '158', status: 'Active', action: 'promote' },
  { id: '159', name: 'Papayolla Archana', gender: 'Female', rollNo: '159', status: 'Active', action: 'promote' }
];

const MOCK_CLASS_10A_STUDENTS: StudentPromotionItem[] = [
  { id: '1472', name: 'Vaarla Bhanu Prasad', gender: 'Male', rollNo: '1472', status: 'Active', action: 'alumni' },
  { id: '1604', name: 'Vadde Mahender', gender: 'Male', rollNo: '1604', status: 'Active', action: 'alumni' },
  { id: '862', name: 'Vadde Dileep', gender: 'Male', rollNo: '862', status: 'Active', action: 'alumni' },
  { id: '919', name: 'P Tejasri', gender: 'Female', rollNo: '919', status: 'Active', action: 'alumni' },
  { id: '883', name: 'P Anjali', gender: 'Female', rollNo: '883', status: 'Active', action: 'alumni' },
  { id: '1603', name: 'K Varsha', gender: 'Female', rollNo: '1603', status: 'Active', action: 'alumni' },
  { id: '1086', name: 'K Sravani', gender: 'Female', rollNo: '1086', status: 'Active', action: 'alumni' },
  { id: '1469', name: 'H Sri Laxmi', gender: 'Female', rollNo: '1469', status: 'Active', action: 'alumni' },
  { id: '910', name: 'G Archana', gender: 'Female', rollNo: '910', status: 'Active', action: 'alumni' },
  { id: '918', name: 'Ch Sowmya', gender: 'Female', rollNo: '918', status: 'Active', action: 'alumni' },
  { id: '1327', name: 'Ch Jeevitha', gender: 'Female', rollNo: '1327', status: 'Active', action: 'alumni' },
  { id: '1050', name: 'Ch Geetanjali', gender: 'Female', rollNo: '1050', status: 'Active', action: 'alumni' },
  { id: '892', name: 'C UshaSri', gender: 'Female', rollNo: '892', status: 'Active', action: 'alumni' },
  { id: '1763', name: 'A Pranathi', gender: 'Female', rollNo: '1763', status: 'Active', action: 'alumni' },
  { id: '2026', name: 'Appajigudem Akshara', gender: 'Female', rollNo: 'STDde2026001', status: 'Active', action: 'alumni' }
];

export const ClassPromotionsScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();
  const isSuperAdmin = user?.role === 'super_admin';
  const [currentAcademicYear] = useState('2026-2027');
  const [upcomingAcademicYear] = useState('2026-2027');
  const [sourceClass, setSourceClass] = useState('Class 8A');
  const [targetClass, setTargetClass] = useState('Class 9A');
  const [searchQuery, setSearchQuery] = useState('');
  const [studentsList, setStudentsList] = useState<StudentPromotionItem[]>(MOCK_CLASS_8A_STUDENTS);

  // Dropdown Modal States
  const [showSourceClassModal, setShowSourceClassModal] = useState(false);
  const [showTargetClassModal, setShowTargetClassModal] = useState(false);

  // Confirmation Modal State
  const [showExecuteModal, setShowExecuteModal] = useState(false);

  // Toast State
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false, title: '', message: ''
  });

  const isClass10Source = sourceClass.startsWith('Class 10');

  // Compute next available destination options based on Source Class
  const currentGradeKey = getGradeKey(sourceClass);
  const availableDestinationOptions = ALL_DESTINATION_CLASSES[currentGradeKey] || ['Class 9A', 'Class 9B'];

  // Handle Source Class Selection with Auto-Fill Destination Class
  const handleSelectSourceClass = (selected: string) => {
    setSourceClass(selected);
    setShowSourceClassModal(false);

    // Auto fill destination class to next level
    const autoDest = autoDestinationMap[selected] || 'Class 9A';
    setTargetClass(autoDest);

    // Load roster data & default actions
    if (selected.startsWith('Class 10')) {
      setStudentsList(MOCK_CLASS_10A_STUDENTS.map(s => ({ ...s, action: 'alumni' })));
    } else {
      setStudentsList(MOCK_CLASS_8A_STUDENTS.map(s => ({ ...s, action: 'promote' })));
    }
  };

  const handleSetAllAction = (act: 'promote' | 'retain' | 'left' | 'alumni') => {
    setStudentsList(prev => prev.map(s => ({ ...s, action: act })));
  };

  const handleStudentActionChange = (id: string, act: 'promote' | 'retain' | 'left' | 'alumni') => {
    setStudentsList(prev => prev.map(s => s.id === id ? { ...s, action: act } : s));
  };

  const handleConfirmPromotion = async () => {
    setShowExecuteModal(false);
    
    // Sync promotions with DB
    try {
      const promoted = studentsList.filter(s => s.action === 'promote');
      for (const st of promoted) {
        await api.updateResource('students', st.id, { class_name: targetClass });
      }
    } catch (err) {
      console.log('Error executing promotions in DB:', err);
    }

    setToastData({
      visible: true,
      title: isClass10Source ? 'Graduation Complete!' : 'Promotions Processed!',
      message: isClass10Source 
        ? `Successfully graduated ${studentsList.filter(s => s.action === 'alumni').length} students from ${sourceClass} into the Alumni directory.`
        : `Successfully promoted ${studentsList.filter(s => s.action === 'promote').length} students from ${sourceClass} to ${targetClass}.`
    });
  };

  const filteredStudents = studentsList.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
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
        style={StyleSheet.absoluteFill}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Student Promotion"
        subtitle="Promote Classes & Manage Academic Progressions"
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <TrendingUp size={20} color={primaryColor} />
          </View>
        }
      />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Title Dashboard Section */}
        <View className="px-5 mb-4">
          <View className="flex-row items-center">
            <GraduationCap size={20} color={primaryColor} style={{ marginRight: 8 }} />
            <Text className="text-white font-extrabold text-lg">Student Promotion Dashboard</Text>
          </View>
          <Text className="text-white/50 text-xs mt-0.5">
            Promote students of the present class to the next class level for the upcoming academic year.
          </Text>
        </View>

        {/* 1. Source & 2. Destination Batch Config Grid */}
        <View className="px-5 mb-4 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
          {/* Card 1: Source Class / Batch */}
          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/90">
            <View className="flex-row items-center mb-2.5">
              <View className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-400/40 items-center justify-center mr-1.5">
                <Text className="text-sky-400 text-[10px] font-extrabold">1</Text>
              </View>
              <Text className="text-white/80 text-[10.5px] font-extrabold">Source Class / Batch</Text>
            </View>

            <Text className="text-white/40 text-[9.5px] uppercase font-bold mb-1">Academic Year</Text>
            <View className="bg-white/5 border border-white/15 rounded-xl px-2.5 py-1.5 mb-2.5">
              <Text className="text-white text-xs font-bold">{currentAcademicYear}</Text>
            </View>

            <Text className="text-white/40 text-[9.5px] uppercase font-bold mb-1">Class & Section</Text>
            <Pressable
              onPress={() => setShowSourceClassModal(true)}
              className={`border rounded-xl px-2.5 py-2 flex-row justify-between items-center ${isSuperAdmin ? 'bg-[#f0c110]/10 border-[#f0c110]/40' : 'bg-[#00f1a1]/10 border-[#00f1a1]/40'}`}
            >
              <Text className={`${primaryTextClass} text-xs font-bold mr-1`} numberOfLines={1}>{sourceClass}</Text>
              <ChevronDown size={14} color={primaryColor} />
            </Pressable>
          </GlassCard>

          {/* Card 2: Destination Class / Batch */}
          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/90">
            <View className="flex-row items-center mb-2.5">
              <View className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 items-center justify-center mr-1.5">
                <Text className={`${primaryTextClass} text-[10px] font-extrabold`}>2</Text>
              </View>
              <Text className="text-white/80 text-[10.5px] font-extrabold">Destination Class / Batch</Text>
            </View>

            {isClass10Source ? (
              /* Class 10 Destination Card: Alumni Network Banner */
              <View className="items-center py-2">
                <View className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 items-center justify-center mb-2">
                  <GraduationCap size={20} color="#c084fc" />
                </View>
                <Text className="text-purple-300 font-extrabold text-xs text-center">Alumni Network</Text>
                <Text className="text-white/50 text-[9.5px] text-center mt-0.5 leading-tight">
                  Class 10 students graduate and join the Alumni directory.
                </Text>
                <View className="bg-purple-500/20 border border-purple-500/40 px-2.5 py-1 rounded-xl mt-2">
                  <Text className="text-purple-300 text-[10px] font-extrabold">Graduates → Alumni</Text>
                </View>
              </View>
            ) : (
              /* Standard Destination Class Card */
              <>
                <Text className="text-white/40 text-[9.5px] uppercase font-bold mb-1">Upcoming Year</Text>
                <View className="bg-white/5 border border-white/15 rounded-xl px-2.5 py-1.5 mb-2.5">
                  <Text className="text-white text-xs font-bold">{upcomingAcademicYear}</Text>
                </View>

                <Text className="text-white/40 text-[9.5px] uppercase font-bold mb-1">Target Class & Section</Text>
                <Pressable
                  onPress={() => setShowTargetClassModal(true)}
                  className="bg-sky-500/10 border border-sky-400/40 rounded-xl px-2.5 py-2 flex-row justify-between items-center"
                >
                  <Text className="text-sky-400 text-xs font-bold mr-1" numberOfLines={1}>{targetClass}</Text>
                  <ChevronDown size={14} color="#38bdf8" />
                </Pressable>
              </>
            )}
          </GlassCard>
        </View>

        {/* Transition Rules Info Box */}
        <View className="px-5 mb-4">
          <View className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
            <View className="flex-row items-center mb-1.5">
              <Info size={14} color="#38bdf8" style={{ marginRight: 6 }} />
              <Text className="text-white font-extrabold text-xs">Transition Rules:</Text>
            </View>
            {isClass10Source ? (
              <>
                <Text className="text-white/60 text-[11px] leading-relaxed">
                  • <Text className="text-purple-300 font-bold">Alumni</Text> graduates the student and registers them in the Alumni network automatically.
                </Text>
                <Text className="text-white/60 text-[11px] leading-relaxed mt-0.5">
                  • <Text className="text-amber-400 font-bold">Retain</Text> assigns the student to the corresponding class level under the new year (keeps them in the same grade).
                </Text>
                <Text className="text-white/60 text-[11px] leading-relaxed mt-0.5">
                  • <Text className="text-rose-400 font-bold">Left</Text> updates the student status to "Left" (for transfers or dropouts). They are excluded from future year lists.
                </Text>
              </>
            ) : (
              <>
                <Text className="text-white/60 text-[11px] leading-relaxed">
                  • <Text className={`${primaryTextClass} font-bold`}>Promote</Text> updates the student to the selected target batch under the upcoming year.
                </Text>
                <Text className="text-white/60 text-[11px] leading-relaxed mt-0.5">
                  • <Text className="text-amber-400 font-bold">Retain</Text> assigns the student to the corresponding class level under the new year (keeps them in the same grade).
                </Text>
                <Text className="text-white/60 text-[11px] leading-relaxed mt-0.5">
                  • <Text className="text-rose-400 font-bold">Left</Text> updates the student status to "Left" (for transfers or dropouts). They are excluded from future year lists.
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Students List Header & Search Bar */}
        <View className="px-5 mb-3 flex-row justify-between items-center">
          <Text className="text-white font-extrabold text-base">Students List ({filteredStudents.length})</Text>

          {/* Bulk Action Pills */}
          <View className="flex-row items-center" style={{ gap: 6 }}>
            {!isClass10Source && (
              <Pressable
                onPress={() => handleSetAllAction('promote')}
                className={`px-2.5 py-1 rounded-xl ${primaryBadgeClass}`}
              >
                <Text className={`${primaryTextClass} text-[10.5px] font-extrabold`}>All Promote</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => handleSetAllAction('retain')}
              className="bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 rounded-xl"
            >
              <Text className="text-amber-400 text-[10.5px] font-extrabold">All Retain</Text>
            </Pressable>
            <Pressable
              onPress={() => handleSetAllAction('left')}
              className="bg-rose-500/15 border border-rose-500/40 px-2.5 py-1 rounded-xl"
            >
              <Text className="text-rose-400 text-[10.5px] font-extrabold">All Left</Text>
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-5 mb-4">
          <View className="bg-[#101415] border border-white/15 rounded-2xl flex-row items-center px-3.5 py-2 shadow-md">
            <Search size={15} color={primaryColor} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search students..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white text-xs"
              style={{ paddingVertical: 0 }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={14} color="rgba(255, 255, 255, 0.5)" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Student Roster Cards */}
        <View className="px-5 mb-5">
          {filteredStudents.map(st => (
            <GlassCard key={st.id} intensity="low" className="mb-2.5 p-3.5 border-white/10 bg-[#101415]/90">
              <View className="flex-row justify-between items-center">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center">
                    <Text className="text-white font-extrabold text-xs mr-1.5">{st.name}</Text>
                    <Text className="text-white/40 text-[10px]">({st.gender})</Text>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-white/50 text-[10px] mr-3">Roll: {st.rollNo}</Text>
                    <View className={`px-2 py-0.5 rounded-md ${primaryBadgeClass}`}>
                      <Text className={`${primaryTextClass} text-[9px] font-bold`}>{st.status}</Text>
                    </View>
                  </View>
                </View>

                {/* Transition Action Buttons */}
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  {isClass10Source ? (
                    /* Class 10: Alumni | Retain | Left */
                    <>
                      <Pressable
                        onPress={() => handleStudentActionChange(st.id, 'alumni')}
                        className={`px-3 py-1.5 rounded-xl border flex-row items-center ${st.action === 'alumni' ? 'bg-purple-600 border-purple-500' : 'bg-white/5 border-white/15'}`}
                      >
                        <GraduationCap size={12} color={st.action === 'alumni' ? '#ffffff' : '#c084fc'} style={{ marginRight: 3 }} />
                        <Text className={`text-[10.5px] font-extrabold ${st.action === 'alumni' ? 'text-white' : 'text-purple-300'}`}>Alumni</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleStudentActionChange(st.id, 'retain')}
                        className={`px-2.5 py-1.5 rounded-xl border ${st.action === 'retain' ? 'bg-amber-500 border-amber-500' : 'bg-white/5 border-white/15'}`}
                      >
                        <Text className={`text-[10.5px] font-extrabold ${st.action === 'retain' ? 'text-[#101415]' : 'text-white/70'}`}>Retain</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleStudentActionChange(st.id, 'left')}
                        className={`px-2.5 py-1.5 rounded-xl border ${st.action === 'left' ? 'bg-rose-500 border-rose-500' : 'bg-white/5 border-white/15'}`}
                      >
                        <Text className={`text-[10.5px] font-extrabold ${st.action === 'left' ? 'text-white' : 'text-white/70'}`}>Left</Text>
                      </Pressable>
                    </>
                  ) : (
                    /* Standard Grade: Promote | Retain | Left */
                    <>
                      <Pressable
                        onPress={() => handleStudentActionChange(st.id, 'promote')}
                        className={`px-3 py-1.5 rounded-xl border flex-row items-center ${st.action === 'promote' ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/5 border-white/15'}`}
                      >
                        <TrendingUp size={12} color={st.action === 'promote' ? '#101415' : primaryColor} style={{ marginRight: 3 }} />
                        <Text className={`text-[10.5px] font-extrabold ${st.action === 'promote' ? 'text-[#101415]' : primaryTextClass}`}>Promote</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleStudentActionChange(st.id, 'retain')}
                        className={`px-2.5 py-1.5 rounded-xl border ${st.action === 'retain' ? 'bg-amber-500 border-amber-500' : 'bg-white/5 border-white/15'}`}
                      >
                        <Text className={`text-[10.5px] font-extrabold ${st.action === 'retain' ? 'text-[#101415]' : 'text-white/70'}`}>Retain</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleStudentActionChange(st.id, 'left')}
                        className={`px-2.5 py-1.5 rounded-xl border ${st.action === 'left' ? 'bg-rose-500 border-rose-500' : 'bg-white/5 border-white/15'}`}
                      >
                        <Text className={`text-[10.5px] font-extrabold ${st.action === 'left' ? 'text-white' : 'text-white/70'}`}>Left</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Bottom Execute Action Button */}
        <View className="px-5 mb-5">
          <Pressable
            onPress={() => setShowExecuteModal(true)}
            className={`w-full py-4 rounded-2xl items-center justify-center flex-row shadow-lg ${
              isClass10Source 
                ? 'bg-purple-600 shadow-[0_0_20px_rgba(192,132,252,0.4)]' 
                : `${primaryBtnClass} shadow-lg`
            }`}
          >
            {isClass10Source ? (
              <>
                <GraduationCap size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text className="text-white font-extrabold text-sm">
                  Graduate to Alumni ({studentsList.length} students)
                </Text>
              </>
            ) : (
              <>
                <ArrowRight size={18} color="#101415" style={{ marginRight: 8 }} />
                <Text className="text-[#101415] font-extrabold text-sm">
                  Execute Promotion ({studentsList.length} students)
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* SOURCE CLASS SELECTION MODAL */}
      <Modal visible={showSourceClassModal} transparent animationType="slide" onRequestClose={() => setShowSourceClassModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-sm p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <Text className="text-white font-bold text-base">Select Source Class Section</Text>
              <Pressable onPress={() => setShowSourceClassModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {ALL_SOURCE_CLASSES.map(cls => {
                  const isSel = sourceClass === cls;
                  return (
                    <Pressable
                      key={cls}
                      onPress={() => handleSelectSourceClass(cls)}
                      className={`w-[48%] py-3 rounded-xl border items-center ${isSel ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/5 border-white/15'}`}
                    >
                      <Text className={`text-xs font-bold ${isSel ? 'text-[#101415]' : 'text-white'}`}>{cls}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DYNAMIC TARGET DESTINATION CLASS SELECTION MODAL (FILTERED TO NEXT GRADE ONLY) */}
      <Modal visible={showTargetClassModal} transparent animationType="slide" onRequestClose={() => setShowTargetClassModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-sky-400/40 rounded-3xl w-full max-w-sm p-5 shadow-[0_0_30px_rgba(56,189,248,0.3)]">
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <View>
                <Text className="text-white font-bold text-base">Target Destination Class</Text>
                <Text className="text-sky-400 text-[10px] font-semibold">Showing next grade options for {sourceClass}</Text>
              </View>
              <Pressable onPress={() => setShowTargetClassModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {availableDestinationOptions.map(cls => {
                  const isSel = targetClass === cls;
                  return (
                    <Pressable
                      key={cls}
                      onPress={() => {
                        setTargetClass(cls);
                        setShowTargetClassModal(false);
                      }}
                      className={`w-full py-3 rounded-xl border items-center ${isSel ? 'bg-sky-400 border-sky-400' : 'bg-white/5 border-white/15'}`}
                    >
                      <Text className={`text-xs font-bold ${isSel ? 'text-[#101415]' : 'text-white'}`}>{cls}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EXECUTE PROMOTION CONFIRM MODAL */}
      <Modal visible={showExecuteModal} transparent animationType="fade" onRequestClose={() => setShowExecuteModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-sm p-6 items-center ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            <View className={`w-14 h-14 rounded-full items-center justify-center mb-4 border ${isClass10Source ? 'bg-purple-500/20 border-purple-500/40' : primaryBadgeClass}`}>
              {isClass10Source ? (
                <GraduationCap size={28} color="#c084fc" />
              ) : (
                <TrendingUp size={28} color={primaryColor} />
              )}
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">
              {isClass10Source ? 'Graduate Class 10 Students?' : 'Execute Student Promotions?'}
            </Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">
              {isClass10Source 
                ? `Are you sure you want to graduate ${studentsList.length} Class 10 students into the Alumni directory for ${upcomingAcademicYear}?`
                : `Are you sure you want to promote ${studentsList.length} students from ${sourceClass} to ${targetClass} for ${upcomingAcademicYear}?`}
            </Text>

            <View className="flex-row w-full" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowExecuteModal(false)} className="flex-1 py-3.5 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleConfirmPromotion} 
                className={`flex-1 py-3.5 rounded-xl items-center ${isClass10Source ? 'bg-purple-600' : primaryBtnClass}`}
              >
                <Text className={`font-extrabold text-xs ${isClass10Source ? 'text-white' : 'text-[#101415]'}`}>
                  {isClass10Source ? 'Graduate All' : 'Confirm Migration'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* TOAST MODAL */}
      <Modal visible={toastData.visible} transparent animationType="fade" onRequestClose={() => setToastData(prev => ({ ...prev, visible: false }))}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-sm p-6 items-center ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-[0_0_30px_rgba(240,193,16,0.3)]' : 'border-[#00f1a1]/40 shadow-[0_0_30px_rgba(0,241,161,0.3)]'}`}>
            <View className={`w-14 h-14 rounded-full items-center justify-center mb-4 border ${primaryBadgeClass}`}>
              <CheckCircle2 size={28} color={primaryColor} />
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
  },
});

export default ClassPromotionsScreen;
