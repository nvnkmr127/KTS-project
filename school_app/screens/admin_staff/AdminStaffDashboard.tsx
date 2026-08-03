import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../../components/GlassCard';
import { AdminStatCard } from '../../components/AdminStatCard';
import { QuickActionIcon } from '../../components/QuickActionIcon';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { 
  Users, Banknote, CalendarDays, Bus, 
  Search, UserSquare2, Wallet, CalendarRange, 
  FileEdit, ClipboardCheck, ArrowLeftRight, 
  Megaphone, UserPlus, Phone, MessageCircle, X, Check,
  ShieldCheck, Bell, UserCheck, BookOpen, TrendingUp,
  GraduationCap, Tag, Palmtree, CalendarOff, BarChart2, Layers,
  UserSearch, PhoneCall, HelpCircle
} from 'lucide-react-native';

interface QuickAction {
  title: string;
  icon: React.ReactNode;
  route: string;
  params?: Record<string, any>;
}

export const AdminStaffDashboard: React.FC<any> = ({ navigation }) => {

  const quickActions: QuickAction[] = [
    { title: 'Student Profiles', icon: <UserSquare2 size={24} color="#00f1a1" />, route: 'Students' },
    { title: 'Add Student', icon: <UserPlus size={24} color="#00f1a1" />, route: 'AddStudent' },
    { title: 'Student Attendance', icon: <UserCheck size={24} color="#00f1a1" />, route: 'AttendanceMarking' },
    { title: 'Daily Diary View', icon: <BookOpen size={24} color="#00f1a1" />, route: 'DailyDiary' },
    { title: 'Classes Promotions', icon: <TrendingUp size={24} color="#00f1a1" />, route: 'ClassPromotions' },
    { title: 'Alumni', icon: <GraduationCap size={24} color="#00f1a1" />, route: 'AlumniManagement' },
    { title: 'Fee Collection', icon: <Wallet size={24} color="#00f1a1" />, route: 'FeeList' },
    { title: 'Fee Category', icon: <Tag size={24} color="#00f1a1" />, route: 'FeeCategory' },
    { title: 'Holiday Calendar', icon: <CalendarDays size={24} color="#00f1a1" />, route: 'HolidayCalendar' },
    { title: 'Staff Leaves', icon: <CalendarOff size={24} color="#00f1a1" />, route: 'LeaveApprovals' },
    { title: 'Timetable Builder', icon: <CalendarRange size={24} color="#00f1a1" />, route: 'TimetableBuilder' },
    { title: 'Exam Schedule', icon: <FileEdit size={24} color="#00f1a1" />, route: 'Schedule' },
    { title: 'Substitution Assign', icon: <ArrowLeftRight size={24} color="#00f1a1" />, route: 'SubstitutionManagement' },
    { title: 'Circulars', icon: <Megaphone size={24} color="#00f1a1" />, route: 'Messages' },
    { title: 'Enquiry Leads', icon: <UserSearch size={24} color="#00f1a1" />, route: 'EnquiryLeads' },
    { title: 'Student Performance', icon: <BarChart2 size={24} color="#00f1a1" />, route: 'StudentPerformance' },
  ];

  const feeDefaulters = [
    { id: 1, initials: 'AG', name: 'Aman Gupta', classInfo: '10-A', amount: '₹4,500', color: 'bg-emerald-950/40 text-emerald-400' },
    { id: 2, initials: 'RS', name: 'Riya Sen', classInfo: '8-B', amount: '₹1,200', color: 'bg-emerald-950/40 text-emerald-400' },
    { id: 3, initials: 'KP', name: 'Kevin Peters', classInfo: '12-C', amount: '₹8,900', color: 'bg-emerald-950/40 text-emerald-400' },
  ];

  const leaveRequests = [
    { id: 1, name: 'Mrs. Anita Sharma', type: 'Sick Leave', date: '24 Oct - 26 Oct' },
    { id: 2, name: 'Mr. Rajesh Kumar', type: 'Casual Leave', date: '25 Oct' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <AdminStaffHeader 
        title="EduVision"
        subtitle="Admin Staff Terminal"
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1] items-center justify-center shadow-[0_0_10px_rgba(0,241,161,0.5)]">
            <ShieldCheck size={22} color="#101415" />
          </View>
        }
        rightAction={
          <Pressable className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center relative shadow-[0_0_10px_rgba(0,241,161,0.1)]">
            <Bell size={18} color="#00f1a1" />
            <View className="absolute top-2 right-2 w-2 h-2 bg-[#ff516a] rounded-full shadow-[0_0_5px_rgba(255,81,106,0.8)]" />
          </Pressable>
        }
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View className="mb-6 px-5">
          <Text className="text-white/90 text-xl font-bold mb-1">Welcome, Sarah</Text>
          <Text className="text-white/60 text-sm">Good morning! Here's the overview for today.</Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row mb-3 px-5" style={{ gap: 12 }}>
          <AdminStatCard 
            title="STUDENTS" 
            value="1248" 
            icon={<Users size={20} color="#00f1a1" />}
            progress={0.65}
            onPress={() => navigation.navigate('Students')}
          />
          <AdminStatCard 
            title="FEES DUE" 
            value="₹2.3L" 
            icon={<Banknote size={20} color="#00f1a1" />}
            trend="12% vs last month"
            onPress={() => navigation.navigate('Fees')}
          />
        </View>
        <View className="flex-row mb-8 px-5" style={{ gap: 12 }}>
          <AdminStatCard 
            title="LEAVES" 
            value="5" 
            icon={<CalendarDays size={20} color="#00f1a1" />}
            subtitle="Awaiting Approval"
            onPress={() => navigation.navigate('LeaveApprovals')}
          />
          <AdminStatCard 
            title="BUS ROUTES" 
            value="8" 
            icon={<Bus size={20} color="#00f1a1" />}
            subtitle="All on track"
            onPress={() => navigation.navigate('BusTracking')}
          />
        </View>

        {/* Quick Actions */}
        <View className="px-5">
          <Text className="text-[#00f1a1] text-xs font-bold tracking-[0.2em] mb-4">QUICK ACTIONS</Text>
          <View className="flex-row flex-wrap justify-between mb-4">
            {quickActions.map((action, index) => (
              <QuickActionIcon 
                key={index}
                title={action.title}
                icon={action.icon}
                onPress={() => {
                  if (action.route) {
                    navigation.navigate(action.route, action.params);
                  }
                }}
              />
            ))}
          </View>
        </View>

        {/* Fee Defaulters */}
        <View className="px-5">
          <View className="flex-row justify-between items-center mb-4 mt-2">
            <Text className="text-[#00f1a1] text-xs font-bold tracking-[0.2em]">FEE DEFAULTERS</Text>
            <View className="bg-[#101415] border border-[#00f1a1]/30 px-3 py-1 rounded-full">
              <Text className="text-[#00f1a1] text-[10px] font-bold tracking-widest">VIEW ALL</Text>
            </View>
          </View>
          <GlassCard intensity="low" className="mb-8 p-1 border-[#00f1a1]/20 bg-[#101415]/60">
            {feeDefaulters.map((defaulter, index) => (
              <View 
                key={defaulter.id} 
                className={`flex-row items-center p-3 ${index !== feeDefaulters.length - 1 ? 'border-b border-[#00f1a1]/10' : ''}`}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-[#101415] border border-[#00f1a1]/30">
                  <Text className="text-[#00f1a1] font-bold">{defaulter.initials}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base font-semibold">
                    {defaulter.name} <Text className="text-white/40 font-normal text-xs">({defaulter.classInfo})</Text>
                  </Text>
                  <Text className="text-[#ff516a] text-xs mt-0.5">{defaulter.amount} overdue</Text>
                </View>
                <Pressable className="bg-[#101415] p-2 rounded-full border border-[#00f1a1]/30">
                  <MessageCircle size={16} color="#00f1a1" />
                </Pressable>
              </View>
            ))}
          </GlassCard>
        </View>

        {/* Leave Requests */}
        <View className="px-5">
          <Text className="text-[#00f1a1] text-xs font-bold tracking-[0.2em] mb-4">LEAVE REQUESTS</Text>
          {leaveRequests.map((req, index) => (
          <GlassCard key={req.id} intensity="low" className="mb-3 flex-row items-center justify-between p-4 border-l-4 border-l-[#00f1a1] border-t border-r border-b border-[#00f1a1]/20 bg-[#101415]/60">
            <View>
              <Text className="text-white text-base font-semibold">{req.name}</Text>
              <Text className="text-white/60 text-xs mt-1">{req.type} • {req.date}</Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Pressable className="bg-[#101415] p-2 rounded-full border border-[#ff516a]/50 shadow-[0_0_10px_rgba(255,81,106,0.3)]">
                <X size={16} color="#ff516a" />
              </Pressable>
              <Pressable className="bg-[#101415] p-2 rounded-full border border-[#00f1a1]/50 shadow-[0_0_10px_rgba(0,241,161,0.3)]">
                <Check size={16} color="#00f1a1" />
              </Pressable>
            </View>
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
    paddingBottom: 100, // accommodate bottom tab navigator height
  },
});

export default AdminStaffDashboard;
