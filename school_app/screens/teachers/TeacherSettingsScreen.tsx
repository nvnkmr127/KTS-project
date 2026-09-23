import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Modal,
  TextInput,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Settings,
  User,
  Bell,
  ShieldCheck,
  Lock,
  Globe,
  RefreshCw,
  Sliders,
  Database,
  KeyRound,
  Smartphone,
  CheckCircle2,
  ChevronRight,
  CalendarDays,
  Wallet,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Save,
  Check,
  X,
  LogOut,
  AlertTriangle,
  GraduationCap,
  Sparkles,
} from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';
import { useAuthStore } from '../../store/useAuthStore';
import { GlassCard } from '../../components/GlassCard';

export const TeacherSettingsScreen: React.FC<any> = ({ navigation }) => {
  const { headerPaddingTop, scrollBottomPadding } = useResponsive();
  const { user, logout } = useAuthStore();

  // Settings Toggles
  const [classAttendanceAlerts, setClassAttendanceAlerts] = useState(true);
  const [diarySubmissionReminders, setDiarySubmissionReminders] = useState(true);
  const [homeworkAlerts, setHomeworkAlerts] = useState(true);
  const [leaveStatusAlerts, setLeaveStatusAlerts] = useState(true);

  const [biometricLogin, setBiometricLogin] = useState(true);
  const [autoOfflineSync, setAutoOfflineSync] = useState(true);

  // Dropdown Selections
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [language, setLanguage] = useState('English');

  // Modals & Toast State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('Please fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match');
      return;
    }
    setIsPasswordModalOpen(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password updated successfully');
  };

  const handleSignOut = () => {
    setIsSignOutModalOpen(false);
    logout();
    try {
      if (navigation?.getParent()) {
        navigation.getParent()?.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else if (navigation?.reset) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else if (navigation?.navigate) {
        navigation.navigate('Login');
      }
    } catch (_) {}
  };

  const displayName = user?.name || 'Ms. Priya Reddy';
  const displayEmail = user?.email || 'priya.reddy@krishnaveni.edu';
  const userInitials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#22143d', '#150d26', '#0b0912', '#08070d']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={35} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-10 h-10 rounded-xl bg-[#ddb7ff]/20 border border-[#ddb7ff]/40 items-center justify-center">
              <Settings size={20} color="#ddb7ff" />
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-white font-extrabold text-xl">
                Teacher Settings
              </Text>
              <Text numberOfLines={1} className="text-white/60 text-xs font-semibold mt-0.5">
                Faculty Preferences & Security
              </Text>
            </View>
          </View>
        </BlurView>

        <LinearGradient
          colors={['rgba(221, 183, 255, 0.18)', 'transparent']}
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Summary */}
        <View className="mb-6">
          <View className="p-4 rounded-3xl bg-[#181524] border border-white/10 flex-row items-center justify-between shadow-lg">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-12 h-12 rounded-2xl bg-[#ddb7ff]/20 border border-[#ddb7ff] items-center justify-center mr-3">
                <Text className="text-[#ddb7ff] font-black text-lg">{userInitials}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-extrabold text-lg">{displayName}</Text>
                <Text className="text-white/60 text-xs mt-0.5 font-medium">{displayEmail}</Text>
                <Text className="text-[#ddb7ff] text-xs font-bold mt-1">Faculty • TCH-2026-42</Text>
              </View>
            </View>

            <Pressable
              onPress={() => setIsPasswordModalOpen(true)}
              className="p-3 bg-white/5 border border-white/10 rounded-xl flex-row items-center active:bg-white/10"
            >
              <KeyRound size={18} color="#ddb7ff" />
            </Pressable>
          </View>
        </View>

        {/* SECTION 1: Notifications & Reminders */}
        <View className="mb-6">
          <Text className="text-white/70 text-xs font-extrabold uppercase tracking-wider mb-3 px-1">
            1. Notification & Reminder Preferences
          </Text>

          <View className="bg-[#181524] border border-white/10 rounded-3xl p-4 shadow-md mb-3" style={{ gap: 14 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-white font-bold text-sm">Attendance Reminders</Text>
                <Text className="text-white/50 text-xs mt-0.5">Morning & Post-lunch class presence reminders</Text>
              </View>
              <Switch
                value={classAttendanceAlerts}
                onValueChange={setClassAttendanceAlerts}
                trackColor={{ false: '#3f3f46', true: '#ddb7ff' }}
                thumbColor={classAttendanceAlerts ? '#181524' : '#d4d4d8'}
              />
            </View>

            <View className="h-[1px] bg-white/10" />

            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-white font-bold text-sm">Daily Diary Submission Alert</Text>
                <Text className="text-white/50 text-xs mt-0.5">Notification reminder before 02:00 PM daily</Text>
              </View>
              <Switch
                value={diarySubmissionReminders}
                onValueChange={setDiarySubmissionReminders}
                trackColor={{ false: '#3f3f46', true: '#ddb7ff' }}
                thumbColor={diarySubmissionReminders ? '#181524' : '#d4d4d8'}
              />
            </View>

            <View className="h-[1px] bg-white/10" />

            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-white font-bold text-sm">Leave Application Updates</Text>
                <Text className="text-white/50 text-xs mt-0.5">Alerts when admin approves or updates leave status</Text>
              </View>
              <Switch
                value={leaveStatusAlerts}
                onValueChange={setLeaveStatusAlerts}
                trackColor={{ false: '#3f3f46', true: '#ddb7ff' }}
                thumbColor={leaveStatusAlerts ? '#181524' : '#d4d4d8'}
              />
            </View>
          </View>
        </View>

        {/* SECTION 2: Security & Session */}
        <View className="mb-6">
          <Text className="text-white/70 text-xs font-extrabold uppercase tracking-wider mb-3 px-1">
            2. Security & Preferences
          </Text>

          <View className="bg-[#181524] border border-white/10 rounded-3xl p-4 shadow-md mb-3" style={{ gap: 14 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-white font-bold text-sm">Biometric Authentication</Text>
                <Text className="text-white/50 text-xs mt-0.5">Fingerprint / Face ID login</Text>
              </View>
              <Switch
                value={biometricLogin}
                onValueChange={setBiometricLogin}
                trackColor={{ false: '#3f3f46', true: '#ddb7ff' }}
                thumbColor={biometricLogin ? '#181524' : '#d4d4d8'}
              />
            </View>

            <View className="h-[1px] bg-white/10" />

            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-white font-bold text-sm">Offline Fast Sync</Text>
                <Text className="text-white/50 text-xs mt-0.5">Auto-cache timetable and student registers</Text>
              </View>
              <Switch
                value={autoOfflineSync}
                onValueChange={setAutoOfflineSync}
                trackColor={{ false: '#3f3f46', true: '#ddb7ff' }}
                thumbColor={autoOfflineSync ? '#181524' : '#d4d4d8'}
              />
            </View>

            <View className="h-[1px] bg-white/10" />

            <Pressable
              onPress={() => setIsPasswordModalOpen(true)}
              className="flex-row items-center justify-between py-1 active:opacity-75"
            >
              <View className="flex-1 mr-3">
                <Text className="text-white font-bold text-sm">Change Password</Text>
                <Text className="text-white/50 text-xs mt-0.5">Update account login password</Text>
              </View>
              <ChevronRight size={18} color="#ddb7ff" />
            </Pressable>
          </View>
        </View>

        {/* SECTION 3: Academic Session */}
        <View className="mb-6">
          <Text className="text-white/70 text-xs font-extrabold uppercase tracking-wider mb-3 px-1">
            3. Academic Session
          </Text>

          <View className="bg-[#181524] border border-white/10 rounded-3xl p-4 shadow-md flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-white font-bold text-sm">Active Session</Text>
              <Text className="text-white/50 text-xs mt-0.5">Term 2026-2027 (Central Campus)</Text>
            </View>
            <View className="bg-[#ddb7ff]/20 px-3 py-1.5 rounded-full border border-[#ddb7ff]/40">
              <Text className="text-[#ddb7ff] font-extrabold text-xs">2026-27</Text>
            </View>
          </View>
        </View>

        {/* SECTION 4: Sign Out Button */}
        <View className="mb-8">
          <Pressable
            onPress={() => setIsSignOutModalOpen(true)}
            className="w-full py-4 bg-rose-500/20 border border-rose-500/50 rounded-2xl flex-row items-center justify-center active:bg-rose-500/30"
          >
            <LogOut size={18} color="#ff516a" style={{ marginRight: 8 }} />
            <Text className="text-[#ff516a] font-extrabold text-sm uppercase tracking-wider">
              Sign Out of Account
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <Modal
          visible={isPasswordModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsPasswordModalOpen(false)}
        >
          <View className="flex-1 bg-black/80 items-center justify-center p-5">
            <View className="w-full max-w-sm bg-[#181524] border border-[#ddb7ff]/30 rounded-3xl p-6 shadow-2xl">
              <View className="flex-row justify-between items-center pb-3 border-b border-white/10 mb-4">
                <Text className="text-white font-black text-base">Change Password</Text>
                <Pressable onPress={() => setIsPasswordModalOpen(false)}>
                  <X size={18} color="white" />
                </Pressable>
              </View>

              <View className="gap-3 mb-5">
                <View>
                  <Text className="text-white/60 text-xs font-bold mb-1">Current Password</Text>
                  <TextInput
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Enter current password"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                  />
                </View>

                <View>
                  <Text className="text-white/60 text-xs font-bold mb-1">New Password</Text>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Enter new password"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                  />
                </View>

                <View>
                  <Text className="text-white/60 text-xs font-bold mb-1">Confirm New Password</Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Re-enter new password"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-3 bg-white/10 rounded-xl items-center active:bg-white/20"
                >
                  <Text className="text-white font-bold text-xs">Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleChangePassword}
                  className="flex-1 py-3 bg-[#ddb7ff] rounded-xl items-center active:bg-[#c084fc]"
                >
                  <Text className="text-[#181524] font-black text-xs uppercase">Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* SIGN OUT MODAL */}
      {isSignOutModalOpen && (
        <Modal
          visible={isSignOutModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsSignOutModalOpen(false)}
        >
          <View className="flex-1 bg-black/80 items-center justify-center p-5">
            <View className="w-full max-w-sm bg-[#181524] border border-rose-500/30 rounded-3xl p-6 shadow-2xl">
              <View className="w-12 h-12 rounded-2xl bg-rose-500/20 items-center justify-center self-center mb-3">
                <LogOut size={24} color="#ff516a" />
              </View>

              <Text className="text-white text-xl font-extrabold text-center mb-1">Sign Out</Text>
              <Text className="text-white/60 text-xs text-center mb-5">
                Are you sure you want to sign out from your Teacher Account?
              </Text>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setIsSignOutModalOpen(false)}
                  className="flex-1 py-3 bg-white/10 rounded-xl items-center active:bg-white/20"
                >
                  <Text className="text-white font-bold text-xs">Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleSignOut}
                  className="flex-1 py-3 bg-rose-600 rounded-xl items-center active:bg-rose-700"
                >
                  <Text className="text-white font-bold text-xs">Sign Out</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08070d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
});

export default TeacherSettingsScreen;
