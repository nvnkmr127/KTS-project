import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  OTPVerify: { email: string };
  AppStack: undefined;
};

export type GuestStackParamList = {
  GuestHome: undefined;
  AdmissionsInfo: undefined;
  EnquiryForm: undefined;
  FacultyShowcase: undefined;
  SchoolFacilities: undefined;
  AchievementsGallery: undefined;
  FeeStructure: undefined;
};

export type ParentTabParamList = {
  Dashboard: undefined;
  Academics: undefined;
  Fees: undefined;
  BusTrack: undefined;
  Messages: undefined;
  Profile: undefined;
  AttendanceHistory: undefined;
};

export type TeacherTabParamList = {
  Dashboard: undefined;
  Attendance: undefined;
  Homework: undefined;
  Marks: undefined;
  Diary: undefined;
  Leave: undefined;
};

export type AdminStaffTabParamList = {
  Dashboard: undefined;
  Students: undefined;
  Fees: undefined;
  Schedule: undefined;
  Messages: undefined;
  Timetable: undefined;
  Substitutions: undefined;
  Leads: undefined;
};

export type SuperAdminTabParamList = {
  Dashboard: undefined;
  Analytics: undefined;
  Users: undefined;
  Broadcast: undefined;
  Settings: undefined;
  SalaryExpenses: undefined;
  LeaveApprovals: undefined;
  AssignFee: undefined;
};

// Strongly typed navigation prop helpers
export type GuestScreenNavigationProp<T extends keyof GuestStackParamList> = 
  NativeStackNavigationProp<GuestStackParamList, T>;

export type GuestScreenRouteProp<T extends keyof GuestStackParamList> = 
  RouteProp<GuestStackParamList, T>;
