import React from 'react';
import { DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/useAuthStore';
import { CustomTabBar } from '../components/CustomTabBar';

export const appDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0d2a24',
    card: '#0d2a24',
    text: '#ffffff',
    border: 'rgba(255, 255, 255, 0.1)',
  },
};

// Icons
import { 
  Home, Bell, Calendar, User, MessageCircle, 
  GraduationCap, Banknote, Bus, ClipboardCheck, 
  ClipboardList, Star, CalendarOff, Users, 
  BarChart, Megaphone, Settings, FileText, Sliders, History
} from 'lucide-react-native';

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OTPVerifyScreen from '../screens/auth/OTPVerifyScreen';

// Super Admin Screens
import SuperAdminDashboard from '../screens/super_admin/SuperAdminDashboard';
import AnalyticsDashboardScreen from '../screens/super_admin/AnalyticsDashboardScreen';
import UserManagementScreen from '../screens/super_admin/UserManagementScreen';
import LeaveApprovalsScreen from '../screens/super_admin/LeaveApprovalsScreen';
import SalaryExpensesScreen from '../screens/super_admin/SalaryExpensesScreen';
import NotificationCenterScreen from '../screens/super_admin/NotificationCenterScreen';
import PortalToolsScreen from '../screens/super_admin/PortalToolsScreen';
import AssignFeeStructureScreen from '../screens/super_admin/AssignFeeStructureScreen';
import SuperAdminAdminConsoleScreen from '../screens/super_admin/SuperAdminAdminConsoleScreen';
import SuperAdminStaffManagementScreen from '../screens/super_admin/SuperAdminStaffManagementScreen';
import SuperAdminStaffAttendanceScreen from '../screens/super_admin/SuperAdminStaffAttendanceScreen';
import SuperAdminStaffDetailsScreen from '../screens/super_admin/SuperAdminStaffDetailsScreen';
import SuperAdminSalaryCategoriesScreen from '../screens/super_admin/SuperAdminSalaryCategoriesScreen';
import SuperAdminRolesPermissionsScreen from '../screens/super_admin/SuperAdminRolesPermissionsScreen';
import SuperAdminActivityLogScreen from '../screens/super_admin/SuperAdminActivityLogScreen';
import SuperAdminAllUsersActivityLogsScreen from '../screens/super_admin/SuperAdminAllUsersActivityLogsScreen';
import SuperAdminAcademicYearsScreen from '../screens/super_admin/settings/SuperAdminAcademicYearsScreen';
import SuperAdminSchoolProfileScreen from '../screens/super_admin/settings/SuperAdminSchoolProfileScreen';
import SuperAdminWebhookManagementScreen from '../screens/super_admin/settings/SuperAdminWebhookManagementScreen';
import SuperAdminSystemMaintenanceScreen from '../screens/super_admin/settings/SuperAdminSystemMaintenanceScreen';
import SuperAdminBiometricIntegrationScreen from '../screens/super_admin/settings/SuperAdminBiometricIntegrationScreen';

// Admin Staff Screens
import AdminStaffDashboard from '../screens/admin_staff/AdminStaffDashboard';
import FeeCollectionScreen from '../screens/admin_staff/FeeCollectionScreen';
import StudentPerformanceScreen from '../screens/admin_staff/StudentPerformanceScreen';
import StudentDirectoryScreen from '../screens/admin_staff/StudentDirectoryScreen';
import ExamScheduleScreen from '../screens/admin_staff/ExamScheduleScreen';
import SubstitutionManagementScreen from '../screens/admin_staff/SubstitutionManagementScreen';
import TimetableBuilderScreen from '../screens/admin_staff/TimetableBuilderScreen';
import EnquiryLeadsScreen from '../screens/admin_staff/EnquiryLeadsScreen';
import ClassPromotionsScreen from '../screens/admin_staff/ClassPromotionsScreen';
import AlumniManagementScreen from '../screens/admin_staff/AlumniManagementScreen';
import FeeCategoryScreen from '../screens/admin_staff/FeeCategoryScreen';
import HolidayCalendarScreen from '../screens/admin_staff/HolidayCalendarScreen';
import AddStudentScreen from '../screens/admin_staff/AddStudentScreen';
import RecycleBinScreen from '../screens/admin_staff/RecycleBinScreen';
import ClassManagementScreen from '../screens/admin_staff/ClassManagementScreen';
import AdminStudentAttendanceScreen from '../screens/admin_staff/AdminStudentAttendanceScreen';
import AdminDailyDiaryScreen from '../screens/admin_staff/AdminDailyDiaryScreen';
import AdminStaffLeavesScreen from '../screens/admin_staff/AdminStaffLeavesScreen';
import AdminBusTrackingScreen from '../screens/admin_staff/AdminBusTrackingScreen';
import AdminReportsAnalyticsScreen from '../screens/admin_staff/AdminReportsAnalyticsScreen';
import AdminStaffAttendanceScreen from '../screens/admin_staff/AdminStaffAttendanceScreen';
import AdminAlertConfigurationScreen from '../screens/admin_staff/AdminAlertConfigurationScreen';
import AdminActivityLogScreen from '../screens/admin_staff/AdminActivityLogScreen';
import AdminStaffSettingsScreen from '../screens/admin_staff/AdminStaffSettingsScreen';

// Teacher Screens
import TeacherDashboard from '../screens/teachers/TeacherDashboard';
import AttendanceMarkingScreen from '../screens/teachers/AttendanceMarkingScreen';
import HomeworkAssignmentsScreen from '../screens/teachers/HomeworkAssignmentsScreen';
import MarksEntryScreen from '../screens/teachers/MarksEntryScreen';
import LeaveApplicationScreen from '../screens/teachers/LeaveApplicationScreen';
import DailyDiaryScreen from '../screens/teachers/DailyDiaryScreen';

// Parent Screens
import ParentDashboard from '../screens/parents/ParentDashboard';
import ReportCardScreen from '../screens/parents/ReportCardScreen';
import FeePaymentScreen from '../screens/parents/FeePaymentScreen';
import BusTrackingScreen from '../screens/parents/BusTrackingScreen';
import MessagingScreen from '../screens/parents/MessagingScreen';
import ProfileScreen from '../screens/parents/StudentProfileDetailsScreen';
import AttendanceHistoryScreen from '../screens/parents/AttendanceHistoryScreen';

// Guest Screens
import GuestDashboard from '../screens/guest/GuestDashboard';
import AdmissionsInfoScreen from '../screens/guest/AdmissionsInfoScreen';
import EnquiryFormScreen from '../screens/guest/EnquiryFormScreen';
import FacultyShowcaseScreen from '../screens/guest/FacultyShowcaseScreen';
import SchoolFacilitiesScreen from '../screens/guest/SchoolFacilitiesScreen';
import AchievementsGalleryScreen from '../screens/guest/AchievementsGalleryScreen';
import FeeStructureScreen from '../screens/guest/FeeStructureScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const getTabOptions = (icon: any, activeColor: string, title?: string) => ({
  tabBarIcon: ({ color, size }: { color: string; size: number }) => {
    const IconComponent = icon;
    return <IconComponent size={size} color={color} />;
  },
  tabBarActiveTintColor: activeColor,
  headerShown: false,
  ...(title ? { title } : {}),
});

// Role-Specific Tab Navigators
const SuperAdminTabs = () => (
  <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true, sceneStyle: { backgroundColor: '#101415' } }}>
    <Tab.Screen name="Dashboard" component={SuperAdminDashboard} options={getTabOptions(Home, '#f0c110')} />
    <Tab.Screen name="Analytics" component={AnalyticsDashboardScreen} options={getTabOptions(BarChart, '#f0c110')} />
    <Tab.Screen name="Users" component={UserManagementScreen} options={getTabOptions(Users, '#f0c110')} />
    <Tab.Screen name="Broadcast" component={NotificationCenterScreen} options={getTabOptions(Megaphone, '#f0c110')} />
    <Tab.Screen name="ActivityLogs" component={SuperAdminAllUsersActivityLogsScreen} options={getTabOptions(History, '#f0c110', 'Activity Logs')} />
    <Tab.Screen name="Settings" component={PortalToolsScreen} options={getTabOptions(Settings, '#f0c110')} />
  </Tab.Navigator>
);

const AdminStaffTabs = () => (
  <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true, sceneStyle: { backgroundColor: '#0d2a24' } }}>
    <Tab.Screen name="Dashboard" component={AdminStaffDashboard} options={getTabOptions(Home, '#00f1a1')} />
    <Tab.Screen name="Students" component={StudentDirectoryScreen} options={getTabOptions(Users, '#00f1a1')} />
    <Tab.Screen name="Fees" component={FeeCollectionScreen} options={getTabOptions(Banknote, '#00f1a1')} />
    <Tab.Screen name="Schedule" component={ExamScheduleScreen} options={getTabOptions(Calendar, '#00f1a1')} />
    <Tab.Screen name="Config" component={AdminAlertConfigurationScreen} options={getTabOptions(Sliders, '#00f1a1', 'Config')} />
    <Tab.Screen name="Settings" component={AdminStaffSettingsScreen} options={getTabOptions(Settings, '#00f1a1', 'Settings')} />
  </Tab.Navigator>
);

const TeacherTabs = () => (
  <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true, sceneStyle: { backgroundColor: '#0d0d12' } }}>
    <Tab.Screen name="Dashboard" component={TeacherDashboard} options={getTabOptions(Home, '#ddb7ff')} />
    <Tab.Screen name="Attendance" component={AttendanceMarkingScreen} options={getTabOptions(ClipboardCheck, '#ddb7ff')} />
    <Tab.Screen name="DailyDiary" component={DailyDiaryScreen} options={getTabOptions(FileText, '#ddb7ff', 'Daily Diary')} />
    <Tab.Screen name="Homework" component={HomeworkAssignmentsScreen} options={getTabOptions(ClipboardList, '#ddb7ff')} />
    <Tab.Screen name="Marks" component={MarksEntryScreen} options={getTabOptions(Star, '#ddb7ff')} />
    <Tab.Screen name="Leave" component={LeaveApplicationScreen} options={getTabOptions(CalendarOff, '#ddb7ff')} />
  </Tab.Navigator>
);

const ParentTabs = () => (
  <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true, sceneStyle: { backgroundColor: '#0A0A1F' } }}>
    <Tab.Screen name="Dashboard" component={ParentDashboard} options={getTabOptions(Home, '#5E5CE6')} />
    <Tab.Screen name="Attendance" component={AttendanceHistoryScreen} options={getTabOptions(Calendar, '#5E5CE6')} />
    <Tab.Screen name="Academics" component={ReportCardScreen} options={getTabOptions(GraduationCap, '#10B981')} />
    <Tab.Screen name="Fees" component={FeePaymentScreen} options={getTabOptions(Banknote, '#10B981')} />
    <Tab.Screen name="Bus" component={BusTrackingScreen} options={getTabOptions(Bus, '#5E5CE6')} />
    <Tab.Screen name="Messages" component={MessagingScreen} options={getTabOptions(MessageCircle, '#5E5CE6')} />
  </Tab.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  const getInitialRoute = () => {
    if (!isAuthenticated || !user) return "Splash";
    switch (user.role) {
      case 'super_admin':
        return "SuperAdminHome";
      case 'admin_staff':
        return "AdminStaffHome";
      case 'teacher':
        return "TeacherHome";
      case 'parent':
        return "ParentHome";
      case 'guest':
      default:
        return "GuestHome";
    }
  };

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false, 
        contentStyle: { backgroundColor: user?.role === 'super_admin' ? '#101415' : user?.role === 'admin_staff' ? '#0d2a24' : '#101415' } 
      }} 
      initialRouteName={getInitialRoute()}
    >
    {/* Authentication Flow */}
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />

      {/* Role Home Dashboards */}
      <Stack.Screen name="SuperAdminHome" component={SuperAdminTabs} />
      <Stack.Screen name="AdminStaffHome" component={AdminStaffTabs} />
      <Stack.Screen name="TeacherHome" component={TeacherTabs} />
      <Stack.Screen name="ParentHome" component={ParentTabs} />
      <Stack.Screen name="GuestHome" component={GuestDashboard} />

      {/* Feature Screens */}
      <Stack.Screen name="FeePayment" component={FeePaymentScreen} />
      <Stack.Screen name="ReportCard" component={ReportCardScreen} />
      <Stack.Screen name="BusTracking" component={BusTrackingScreen} />
      <Stack.Screen name="Messaging" component={MessagingScreen} />
      <Stack.Screen name="TeacherCommunication" component={MessagingScreen} />
      <Stack.Screen name="EnquiryLeads" component={EnquiryLeadsScreen} />
      <Stack.Screen name="StudentPerformance" component={StudentPerformanceScreen} />
      <Stack.Screen name="StudentDirectory" component={StudentDirectoryScreen} />
      <Stack.Screen name="Students" component={StudentDirectoryScreen} />
      <Stack.Screen name="SubstitutionManagement" component={SubstitutionManagementScreen} />
      <Stack.Screen name="LeaveApplication" component={LeaveApplicationScreen} />
      <Stack.Screen name="AnalyticsDashboard" component={AnalyticsDashboardScreen} />
      <Stack.Screen name="DailyDiary" component={DailyDiaryScreen} />
      <Stack.Screen name="HomeworkAssignments" component={HomeworkAssignmentsScreen} />
      <Stack.Screen name="AdmissionsInfo" component={AdmissionsInfoScreen} />
      <Stack.Screen name="AchievementsGallery" component={AchievementsGalleryScreen} />
      <Stack.Screen name="FeeCollection" component={FeeCollectionScreen} />
      <Stack.Screen name="FeeList" component={FeeCollectionScreen} />
      <Stack.Screen name="Fees" component={FeeCollectionScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsDashboardScreen} />
      <Stack.Screen name="Users" component={UserManagementScreen} />
      <Stack.Screen name="Broadcast" component={NotificationCenterScreen} />
      <Stack.Screen name="FeeStructure" component={FeeStructureScreen} />
      <Stack.Screen name="EnquiryForm" component={EnquiryFormScreen} />
      <Stack.Screen name="TimetableBuilder" component={TimetableBuilderScreen} />
      <Stack.Screen name="SchoolFacilities" component={SchoolFacilitiesScreen} />
      <Stack.Screen name="AttendanceMarking" component={AttendanceMarkingScreen} />
      <Stack.Screen name="MarksEntry" component={MarksEntryScreen} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} />
      <Stack.Screen name="LeaveApprovals" component={LeaveApprovalsScreen} />
      <Stack.Screen name="ExamSchedule" component={ExamScheduleScreen} />
      <Stack.Screen name="SalaryExpenses" component={SalaryExpensesScreen} />
      <Stack.Screen name="PortalTools" component={PortalToolsScreen} />
      <Stack.Screen name="FacultyShowcase" component={FacultyShowcaseScreen} />
      <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
      <Stack.Screen name="StudentProfileDetails" component={ProfileScreen} />
      <Stack.Screen name="AssignFeeStructure" component={AssignFeeStructureScreen} />
      <Stack.Screen name="AdminAlertConfiguration" component={AdminAlertConfigurationScreen} />
      <Stack.Screen 
        name="AdminActivityLog" 
        component={user?.role === 'super_admin' ? SuperAdminActivityLogScreen : AdminActivityLogScreen} 
      />
      <Stack.Screen name="SuperAdminActivityLog" component={SuperAdminActivityLogScreen} />
      <Stack.Screen name="AdminStaffSettings" component={AdminStaffSettingsScreen} />
      <Stack.Screen name="ClassPromotions" component={ClassPromotionsScreen} />
      <Stack.Screen name="AlumniManagement" component={AlumniManagementScreen} />
      <Stack.Screen name="FeeCategory" component={FeeCategoryScreen} />
      <Stack.Screen name="HolidayCalendar" component={HolidayCalendarScreen} />
      <Stack.Screen name="AddStudent" component={AddStudentScreen} />
      <Stack.Screen name="RecycleBin" component={RecycleBinScreen} />
      <Stack.Screen name="ClassManagement" component={ClassManagementScreen} />
      <Stack.Screen name="AdminStudentAttendance" component={AdminStudentAttendanceScreen} />
      <Stack.Screen name="AdminDailyDiary" component={AdminDailyDiaryScreen} />
      <Stack.Screen name="AdminStaffLeaves" component={AdminStaffLeavesScreen} />
      <Stack.Screen name="AdminBusTracking" component={AdminBusTrackingScreen} />
      <Stack.Screen name="AdminReportsAnalytics" component={AdminReportsAnalyticsScreen} />
      <Stack.Screen 
        name="StaffAttendance" 
        component={user?.role === 'super_admin' ? SuperAdminStaffAttendanceScreen : AdminStaffAttendanceScreen} 
      />
      <Stack.Screen name="StaffManagement" component={SuperAdminStaffManagementScreen} />
      <Stack.Screen name="SuperAdminStaffManagement" component={SuperAdminStaffManagementScreen} />
      <Stack.Screen name="StaffDetails" component={SuperAdminStaffDetailsScreen} />
      <Stack.Screen name="SuperAdminStaffDetails" component={SuperAdminStaffDetailsScreen} />
      <Stack.Screen name="SuperAdminStaffAttendance" component={SuperAdminStaffAttendanceScreen} />
      <Stack.Screen name="SalaryCategories" component={SuperAdminSalaryCategoriesScreen} />
      <Stack.Screen name="SuperAdminSalaryCategories" component={SuperAdminSalaryCategoriesScreen} />
      <Stack.Screen name="RolesPermissions" component={SuperAdminRolesPermissionsScreen} />
      <Stack.Screen name="SuperAdminRolesPermissions" component={SuperAdminRolesPermissionsScreen} />
      <Stack.Screen name="SuperAdminAdminConsole" component={SuperAdminAdminConsoleScreen} />
      <Stack.Screen name="AllUsersActivityLogs" component={SuperAdminAllUsersActivityLogsScreen} />
      <Stack.Screen name="ActivityLogs" component={SuperAdminAllUsersActivityLogsScreen} />
      <Stack.Screen name="SuperAdminAcademicYears" component={SuperAdminAcademicYearsScreen} />
      <Stack.Screen name="AcademicYears" component={SuperAdminAcademicYearsScreen} />
      <Stack.Screen name="SuperAdminSchoolProfile" component={SuperAdminSchoolProfileScreen} />
      <Stack.Screen name="SchoolProfile" component={SuperAdminSchoolProfileScreen} />
      <Stack.Screen name="SuperAdminWebhookManagement" component={SuperAdminWebhookManagementScreen} />
      <Stack.Screen name="WebhookManagement" component={SuperAdminWebhookManagementScreen} />
      <Stack.Screen name="SuperAdminSystemMaintenance" component={SuperAdminSystemMaintenanceScreen} />
      <Stack.Screen name="SystemMaintenance" component={SuperAdminSystemMaintenanceScreen} />
        <Stack.Screen name="SuperAdminBiometricIntegration" component={SuperAdminBiometricIntegrationScreen} />
        <Stack.Screen name="BiometricIntegration" component={SuperAdminBiometricIntegrationScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
