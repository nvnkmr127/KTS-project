import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';
import { 
  ArrowLeft, Search, ShieldCheck, UserSquare2, UserPlus, 
  School, UserCheck, BookOpen, TrendingUp, GraduationCap, 
  Wallet, Tag, CalendarDays, CalendarOff, CalendarRange, 
  FileEdit, ArrowLeftRight, Megaphone, UserSearch, Bus, Sliders
} from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';

interface AdminOption {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  route: string;
  category: 'Students' | 'Academics' | 'Finance' | 'Operations';
}

const ADMIN_OPTIONS: AdminOption[] = [
  // Students
  { id: '1', title: 'Student Profiles', subtitle: 'Directory & enrollment', icon: <UserSquare2 size={24} color="#ffe5a0" />, route: 'StudentDirectory', category: 'Students' },
  { id: '2', title: 'Add Student', subtitle: 'New admissions & intake', icon: <UserPlus size={24} color="#ffe5a0" />, route: 'AddStudent', category: 'Students' },
  { id: '3', title: 'Student Attendance', subtitle: 'Daily & monthly logs', icon: <UserCheck size={24} color="#ffe5a0" />, route: 'AdminStudentAttendance', category: 'Students' },
  { id: '4', title: 'Classes Promotions', subtitle: 'Annual session upgrades', icon: <TrendingUp size={24} color="#ffe5a0" />, route: 'ClassPromotions', category: 'Students' },
  { id: '5', title: 'Alumni Directory', subtitle: 'Graduated batches', icon: <GraduationCap size={24} color="#ffe5a0" />, route: 'AlumniManagement', category: 'Students' },

  // Academics
  { id: '6', title: 'Class Management', subtitle: 'Sections & class teachers', icon: <School size={24} color="#ffe5a0" />, route: 'ClassManagement', category: 'Academics' },
  { id: '7', title: 'Daily Diary View', subtitle: 'Homework & teacher logs', icon: <BookOpen size={24} color="#ffe5a0" />, route: 'AdminDailyDiary', category: 'Academics' },
  { id: '8', title: 'Timetable Builder', subtitle: 'Period allocations & slots', icon: <CalendarRange size={24} color="#ffe5a0" />, route: 'TimetableBuilder', category: 'Academics' },
  { id: '9', title: 'Exam Schedule', subtitle: 'Term & test timetables', icon: <FileEdit size={24} color="#ffe5a0" />, route: 'ExamSchedule', category: 'Academics' },
  { id: '10', title: 'Holiday Calendar', subtitle: 'Annual academic holidays', icon: <CalendarDays size={24} color="#ffe5a0" />, route: 'HolidayCalendar', category: 'Academics' },

  // Finance
  { id: '11', title: 'Fee Collection', subtitle: 'Ledger & receipt entries', icon: <Wallet size={24} color="#ffe5a0" />, route: 'FeeList', category: 'Finance' },
  { id: '12', title: 'Fee Categories', subtitle: 'Tuition & transport heads', icon: <Tag size={24} color="#ffe5a0" />, route: 'FeeCategory', category: 'Finance' },
  { id: '13', title: 'Salary Categories', subtitle: 'Payroll heads & allotments', icon: <Wallet size={24} color="#ffe5a0" />, route: 'SalaryCategories', category: 'Finance' },

  // Operations
  { id: '14', title: 'Staff Management', subtitle: 'Faculty directory & onboard', icon: <UserSquare2 size={24} color="#ffe5a0" />, route: 'StaffManagement', category: 'Operations' },
  { id: '15', title: 'Staff Attendance', subtitle: 'Faculty biometric logs & roster', icon: <UserCheck size={24} color="#ffe5a0" />, route: 'StaffAttendance', category: 'Operations' },
  { id: '16', title: 'Staff Leaves', subtitle: 'Review & approve leaves', icon: <CalendarOff size={24} color="#ffe5a0" />, route: 'AdminStaffLeaves', category: 'Operations' },
  { id: '17', title: 'Roles & Privileges', subtitle: 'Role based access matrix', icon: <ShieldCheck size={24} color="#ffe5a0" />, route: 'RolesPermissions', category: 'Operations' },
  { id: '18', title: 'Substitution Assign', subtitle: 'Teacher proxy allotments', icon: <ArrowLeftRight size={24} color="#ffe5a0" />, route: 'SubstitutionManagement', category: 'Operations' },
  { id: '19', title: 'Circulars & Alerts', subtitle: 'Parent & staff broadcasts', icon: <Megaphone size={24} color="#ffe5a0" />, route: 'AdminAlertConfiguration', category: 'Operations' },
  { id: '20', title: 'Enquiry Leads', subtitle: 'Admission CRM & inquiries', icon: <UserSearch size={24} color="#ffe5a0" />, route: 'EnquiryLeads', category: 'Operations' },
  { id: '21', title: 'Bus GPS Tracking', subtitle: 'Route movement monitor', icon: <Bus size={24} color="#ffe5a0" />, route: 'AdminBusTracking', category: 'Operations' },
  { id: '22', title: 'Configuration', subtitle: 'Alert rules & auto-broadcast settings', icon: <Sliders size={24} color="#ffe5a0" />, route: 'AdminAlertConfiguration', category: 'Operations' },
];

export const SuperAdminAdminConsoleScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isSmallPhone, isTablet, insets, headerPaddingTop, scrollBottomPadding, containerStyle } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Students' | 'Academics' | 'Finance' | 'Operations'>('All');

  const filteredOptions = useMemo(() => {
    return ADMIN_OPTIONS.filter(opt => {
      const matchesSearch = opt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            opt.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'All' || opt.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1d2022', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header matching Super Admin Theme */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <Pressable 
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <ArrowLeft size={18} color="#ffe5a0" />
            </Pressable>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-lg md:text-xl font-bold text-white font-display-lg">Admin Operations</Text>
              <Text numberOfLines={1} className="text-[9px] uppercase tracking-widest text-[#ffe5a0] font-bold">SUPER ADMIN CONSOLE</Text>
            </View>
          </View>

          <View className="w-9 h-9 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center">
            <ShieldCheck size={20} color="#f0c110" />
          </View>
        </BlurView>

        <LinearGradient 
          colors={['rgba(245, 197, 24, 0.15)', 'transparent']} 
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          containerStyle,
          { paddingBottom: scrollBottomPadding + 24 }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Search Bar & Category Filters */}
        <View className="px-5 mb-6">
          <View className="bg-black/40 border border-white/15 rounded-2xl px-3.5 py-2.5 flex-row items-center mb-4 shadow-lg">
            <Search size={18} color="#ffe5a0" style={{ marginRight: 10 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search admin operations..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="flex-1 text-white text-xs font-semibold"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {(['All', 'Students', 'Academics', 'Finance', 'Operations'] as const).map(cat => {
                const isSel = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
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

        {/* Options Counter */}
        <View className="px-5 mb-4 flex-row justify-between items-center">
          <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider">
            ADMIN MODULES ({filteredOptions.length})
          </Text>
          <Text className="text-white/40 text-[10px]">Excludes Reports & Recycle Bin</Text>
        </View>

        {/* Admin Options Grid (2 Columns) */}
        <View className="px-5 flex-row flex-wrap justify-between">
          {filteredOptions.map((opt) => (
            <GlassCard
              key={opt.id}
              className="w-[48%] p-4 mb-4 border border-white/10"
              style={{
                backgroundColor: '#1d2122',
                shadowColor: '#f0c110',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Pressable 
                onPress={() => navigation.navigate(opt.route)} 
                style={({ pressed }) => [pressed && { backgroundColor: 'rgba(240, 193, 16, 0.25)', borderRadius: 16 }]}
                className="p-1 rounded-2xl active:opacity-90"
              >
                <View className="w-11 h-11 rounded-2xl bg-[#f0c110]/15 border border-[#f0c110]/30 items-center justify-center mb-3">
                  {opt.icon}
                </View>
                <Text className="text-white font-extrabold text-sm mb-1" numberOfLines={1}>
                  {opt.title}
                </Text>
                <Text className="text-[#d1c5ac] text-[10px]" numberOfLines={2}>
                  {opt.subtitle}
                </Text>
              </Pressable>
            </GlassCard>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
});

export default SuperAdminAdminConsoleScreen;
