import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, Modal, TextInput, BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings, User, Bell, ShieldCheck, Lock, Globe,
  RefreshCw, Sliders, Database, KeyRound, Smartphone,
  CheckCircle2, ChevronRight, Moon, CalendarDays, Wallet,
  Mail, Phone, Eye, EyeOff, Save, Check, X, History, LogOut,
  AlertTriangle
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

export const AdminStaffSettingsScreen: React.FC<any> = ({ navigation: propNavigation }) => {
  const defaultNavigation = useNavigation<any>();
  const navigation = propNavigation || defaultNavigation;
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();
  const { user, logout } = useAuthStore();

  // Settings Toggles State
  const [feeAlerts, setFeeAlerts] = useState(true);
  const [leaveAlerts, setLeaveAlerts] = useState(true);
  const [busGpsAlerts, setBusGpsAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);

  const [biometricLogin, setBiometricLogin] = useState(true);
  const [autoReceiptGen, setAutoReceiptGen] = useState(true);
  const [compactLayout, setCompactLayout] = useState(false);
  const [autoOfflineSync, setAutoOfflineSync] = useState(true);

  // Dropdown Selections
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [language, setLanguage] = useState('English');

  // Modals & Toast State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isCacheModalOpen, setIsCacheModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Safe BackHandler
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isCacheModalOpen) {
          setIsCacheModalOpen(false);
          return true;
        }
        if (isSignOutModalOpen) {
          setIsSignOutModalOpen(false);
          return true;
        }
        if (isPasswordModalOpen) {
          setIsPasswordModalOpen(false);
          return true;
        }
        if (navigation?.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isPasswordModalOpen, isSignOutModalOpen, isCacheModalOpen, navigation])
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePasswordChange = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all password fields');
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
    showToast('Password updated successfully!');
  };

  const handleClearCache = () => {
    setIsCacheModalOpen(true);
  };

  const handleSignOut = () => {
    setIsSignOutModalOpen(false);
    logout();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Admin Staff Settings"
        subtitle="System Preferences, Security & Controls"
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center">
            <Settings size={20} color="#00f1a1" />
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Profile Card Summary */}
        <View className="px-5 mb-5">
          <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/90 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-12 h-12 rounded-full bg-[#00f1a1]/20 border border-[#00f1a1] items-center justify-center mr-3">
                <Text className="text-[#00f1a1] font-extrabold text-base">
                  {(user?.name || 'Sarah Jenkins').split(' ').map(n => n[0]).join('').slice(0, 2)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-extrabold text-sm">{user?.name || 'Sarah Jenkins'}</Text>
                <Text className="text-white/50 text-xs">{user?.email || 'sarah.jenkins@kts.edu.in'}</Text>
                <Text className="text-[#00f1a1] text-[10px] font-bold mt-0.5">Admin Staff Console • EMP-2026-88</Text>
              </View>
            </View>

            <Pressable
              onPress={() => setIsPasswordModalOpen(true)}
              className="p-2 bg-white/5 border border-white/10 rounded-xl flex-row items-center"
            >
              <KeyRound size={14} color="#00f1a1" />
            </Pressable>
          </GlassCard>
        </View>

        {/* SECTION 1: System Notifications */}
        <View className="px-5 mb-5">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">1. Notifications & Alerts</Text>

          <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/90 mb-3">
            <View className="flex-row items-center justify-between py-1">
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-8 h-8 rounded-xl bg-emerald-500/20 items-center justify-center mr-3 border border-emerald-500/30">
                  <Wallet size={16} color="#00f1a1" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-xs">Fee Collection & Receipt Alerts</Text>
                  <Text className="text-white/50 text-[10px]">Instant notification on parent fee payment</Text>
                </View>
              </View>
              <Switch
                value={feeAlerts}
                onValueChange={setFeeAlerts}
                trackColor={{ false: '#262626', true: '#00f1a1' }}
                thumbColor={feeAlerts ? '#101415' : '#737373'}
              />
            </View>

            <View className="h-[1px] bg-white/10 my-2.5" />

            <View className="flex-row items-center justify-between py-1">
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-8 h-8 rounded-xl bg-sky-500/20 items-center justify-center mr-3 border border-sky-500/30">
                  <CalendarDays size={16} color="#38bdf8" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-xs">Staff Leave Approval Alerts</Text>
                  <Text className="text-white/50 text-[10px]">Notify when teachers submit leave requests</Text>
                </View>
              </View>
              <Switch
                value={leaveAlerts}
                onValueChange={setLeaveAlerts}
                trackColor={{ false: '#262626', true: '#00f1a1' }}
                thumbColor={leaveAlerts ? '#101415' : '#737373'}
              />
            </View>

            <View className="h-[1px] bg-white/10 my-2.5" />

            <View className="flex-row items-center justify-between py-1">
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-8 h-8 rounded-xl bg-amber-500/20 items-center justify-center mr-3 border border-amber-500/30">
                  <Bell size={16} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-xs">Bus Tracking GPS Alerts</Text>
                  <Text className="text-white/50 text-[10px]">Push alerts on bus route completion or delay</Text>
                </View>
              </View>
              <Switch
                value={busGpsAlerts}
                onValueChange={setBusGpsAlerts}
                trackColor={{ false: '#262626', true: '#00f1a1' }}
                thumbColor={busGpsAlerts ? '#101415' : '#737373'}
              />
            </View>
          </GlassCard>
        </View>

        {/* SECTION 2: Academic Operating Controls */}
        <View className="px-5 mb-5">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">2. Academic & Operation Defaults</Text>

          <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/90 mb-3">
            <View className="flex-row items-center justify-between py-1.5">
              <Text className="text-white font-bold text-xs">Default Academic Session</Text>
              <View className="flex-row" style={{ gap: 6 }}>
                {['2026-2027', '2025-2026'].map(year => (
                  <Pressable
                    key={year}
                    onPress={() => setAcademicYear(year)}
                    className={`px-3 py-1 rounded-xl border ${academicYear === year ? 'bg-[#00f1a1] border-[#00f1a1]' : 'bg-white/5 border-white/15'
                      }`}
                  >
                    <Text className={`text-[10px] font-bold ${academicYear === year ? 'text-[#101415]' : 'text-white'}`}>{year}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="h-[1px] bg-white/10 my-2.5" />

            <View className="flex-row items-center justify-between py-1">
              <View className="flex-1 mr-3">
                <Text className="text-white font-bold text-xs">Auto Generate PDF Fee Receipts</Text>
                <Text className="text-white/50 text-[10px]">Automatically generate printable receipt upon collection</Text>
              </View>
              <Switch
                value={autoReceiptGen}
                onValueChange={setAutoReceiptGen}
                trackColor={{ false: '#262626', true: '#00f1a1' }}
                thumbColor={autoReceiptGen ? '#101415' : '#737373'}
              />
            </View>
          </GlassCard>
        </View>

        {/* SECTION 3: Security & Data Storage */}
        <View className="px-5 mb-5">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">3. Security & App Storage</Text>

          <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/90 mb-3">
            <View className="flex-row items-center justify-between py-1">
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-8 h-8 rounded-xl bg-purple-500/20 items-center justify-center mr-3 border border-purple-500/30">
                  <FingerprintIcon />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-xs">Biometric Quick Login</Text>
                  <Text className="text-white/50 text-[10px]">Use Fingerprint / Face ID for instant login</Text>
                </View>
              </View>
              <Switch
                value={biometricLogin}
                onValueChange={setBiometricLogin}
                trackColor={{ false: '#262626', true: '#00f1a1' }}
                thumbColor={biometricLogin ? '#101415' : '#737373'}
              />
            </View>

            <View className="h-[1px] bg-white/10 my-2.5" />

            <View className="flex-row items-center justify-between py-1">
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-8 h-8 rounded-xl bg-teal-500/20 items-center justify-center mr-3 border border-teal-500/30">
                  <Database size={16} color="#14b8a6" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-xs">Auto Offline Data Sync</Text>
                  <Text className="text-white/50 text-[10px]">Store pending collections offline when network drops</Text>
                </View>
              </View>
              <Switch
                value={autoOfflineSync}
                onValueChange={setAutoOfflineSync}
                trackColor={{ false: '#262626', true: '#00f1a1' }}
                thumbColor={autoOfflineSync ? '#101415' : '#737373'}
              />
            </View>

            <View className="h-[1px] bg-white/10 my-2.5" />

            <Pressable
              onPress={handleClearCache}
              className="flex-row items-center justify-between py-2"
            >
              <View className="flex-row items-center">
                <RefreshCw size={16} color="#00f1a1" style={{ marginRight: 10 }} />
                <Text className="text-white font-bold text-xs">Clear Local Cache & Refresh Data</Text>
              </View>
              <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
            </Pressable>
          </GlassCard>
        </View>

        {/* SECTION 4: Account & Activity Actions */}
        <View className="px-5 mb-5">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">4. Account & Activity</Text>

          <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/90 mb-3">
            <Pressable
              onPress={() => navigation.navigate('AdminActivityLog')}
              className="flex-row items-center justify-between py-1"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-8 h-8 rounded-xl bg-[#00f1a1]/20 items-center justify-center mr-3 border border-[#00f1a1]/30">
                  <History size={16} color="#00f1a1" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-xs">Activity Logs & Audit Trail</Text>
                  <Text className="text-white/50 text-[10px]">View your administrative activity log & recent actions</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#00f1a1" />
            </Pressable>

            <View className="h-[1px] bg-white/10 my-2.5" />

            <Pressable
              onPress={() => setIsPasswordModalOpen(true)}
              className="flex-row items-center justify-between py-1"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-8 h-8 rounded-xl bg-amber-500/20 items-center justify-center mr-3 border border-amber-500/30">
                  <KeyRound size={16} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-xs">Change Password</Text>
                  <Text className="text-white/50 text-[10px]">Update administrative account credentials</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#f59e0b" />
            </Pressable>
          </GlassCard>

          {/* Sign Out Button */}
          <Pressable
            onPress={() => setIsSignOutModalOpen(true)}
            className="w-full py-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex-row items-center justify-center active:bg-rose-500/25 active:scale-[0.99] shadow-[0_0_15px_rgba(244,63,94,0.12)]"
          >
            <LogOut size={18} color="#f43f5e" style={{ marginRight: 8 }} />
            <Text className="text-[#f43f5e] font-extrabold text-xs uppercase tracking-wider">Sign Out </Text>
          </Pressable>
        </View>

        {/* SECTION 5: App Info */}
        <View className="px-5 mb-6">
          <GlassCard intensity="low" className="p-4 border-white/10 bg-[#101415]/90 items-center">
            <Text className="text-white font-extrabold text-xs mb-0.5">EduVision School ERP Mobile</Text>
            <Text className="text-[#00f1a1] text-[10px] font-bold">Admin Staff Terminal v2.4.0 (Expo v56)</Text>
            <Text className="text-white/40 text-[9px] mt-1">KTS School Management Infrastructure</Text>
          </GlassCard>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <Modal visible={isPasswordModalOpen} transparent animationType="fade" onRequestClose={() => setIsPasswordModalOpen(false)}>
          <View className="flex-1 bg-black/85 justify-center items-center p-4">
            <View className="w-full max-w-sm p-5 border border-white/20 rounded-3xl" style={{ backgroundColor: '#101415' }}>

              <View className="flex-row justify-between items-center pb-3 border-b border-white/10 mb-4">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center mr-2.5">
                    <Lock size={16} color="#00f1a1" />
                  </View>
                  <Text className="text-white font-extrabold text-base">Change Password</Text>
                </View>
                <Pressable onPress={() => setIsPasswordModalOpen(false)} className="p-1">
                  <X size={20} color="rgba(255,255,255,0.6)" />
                </Pressable>
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs mb-1 font-semibold">Current Password</Text>
                <TextInput
                  secureTextEntry={!showPassword}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="Enter current password"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-xs"
                />
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs mb-1 font-semibold">New Password</Text>
                <TextInput
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-xs"
                />
              </View>

              <View className="mb-5">
                <Text className="text-white/70 text-xs mb-1 font-semibold">Confirm New Password</Text>
                <TextInput
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-white/5 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-xs"
                />
              </View>

              <View className="flex-row" style={{ gap: 8 }}>
                <Pressable
                  onPress={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2.5 bg-white/10 rounded-xl items-center"
                >
                  <Text className="text-white text-xs font-bold">Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handlePasswordChange}
                  className="flex-1 py-2.5 bg-[#00f1a1] rounded-xl items-center"
                >
                  <Text className="text-[#101415] text-xs font-extrabold uppercase">Save Password</Text>
                </Pressable>
              </View>

            </View>
          </View>
        </Modal>
      )}

      {/* SIGN OUT CONFIRMATION MODAL */}
      {isSignOutModalOpen && (
        <Modal visible={isSignOutModalOpen} transparent animationType="fade" onRequestClose={() => setIsSignOutModalOpen(false)}>
          <View className="flex-1 bg-black/85 justify-center items-center p-4">
            <View className="w-full max-w-sm p-5 border border-rose-500/30 rounded-3xl" style={{ backgroundColor: '#101415' }}>
              <View className="items-center mb-4">
                <View className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 items-center justify-center mb-3 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                  <LogOut size={26} color="#f43f5e" />
                </View>
                <Text className="text-white font-extrabold text-lg text-center">Sign Out Confirmation</Text>
                <Text className="text-white/60 text-xs text-center mt-1 leading-relaxed px-2">
                  Are you sure you want to end your current session and sign out from the Admin Staff Terminal?
                </Text>
              </View>

              <View className="flex-row" style={{ gap: 10 }}>
                <Pressable
                  onPress={() => setIsSignOutModalOpen(false)}
                  className="flex-1 py-3 bg-white/10 border border-white/15 rounded-xl items-center active:bg-white/20"
                >
                  <Text className="text-white text-xs font-bold">Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleSignOut}
                  className="flex-1 py-3 bg-rose-500 rounded-xl items-center active:bg-rose-600 shadow-md shadow-rose-500/30"
                >
                  <Text className="text-white text-xs font-black uppercase tracking-wider">Sign Out</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* CLEAR LOCAL CACHE & REFRESH DATA POP-UP MODAL */}
      {isCacheModalOpen && (
        <Modal visible={isCacheModalOpen} transparent animationType="fade" onRequestClose={() => setIsCacheModalOpen(false)}>
          <View className="flex-1 bg-black/85 justify-center items-center p-4">
            <View className="w-full max-w-sm p-6 border border-[#00f1a1]/30 rounded-3xl" style={{ backgroundColor: '#101415' }}>
              <View className="items-center mb-5">
                <View className="w-16 h-16 rounded-2xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center mb-3.5 shadow-[0_0_25px_rgba(0,241,161,0.35)]">
                  <CheckCircle2 size={32} color="#00f1a1" />
                </View>
                <Text className="text-white font-extrabold text-lg text-center">Local Cache Purged</Text>
                <Text className="text-white/70 text-xs text-center mt-1.5 leading-relaxed px-1">
                  Temporary application storage, query cache, and offline tables have been purged. Live ERP connection refreshed.
                </Text>

                <View className="mt-4 px-3 py-1.5 rounded-full bg-[#00f1a1]/10 border border-[#00f1a1]/30 flex-row items-center">
                  <RefreshCw size={12} color="#00f1a1" style={{ marginRight: 6 }} />
                  <Text className="text-[#00f1a1] text-[11px] font-bold">14.2 MB Storage Cleaned • Live Sync OK</Text>
                </View>
              </View>

              <Pressable
                onPress={() => setIsCacheModalOpen(false)}
                className="w-full py-3.5 bg-[#00f1a1] rounded-xl items-center active:scale-95 shadow-md shadow-[#00f1a1]/30"
              >
                <Text className="text-[#101415] text-xs font-black uppercase tracking-wider">Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <View className="absolute bottom-28 left-5 right-5 bg-[#00f1a1] p-3.5 rounded-2xl flex-row items-center justify-between shadow-[0_0_20px_rgba(0,241,161,0.5)] z-50">
          <Text className="text-[#101415] font-extrabold text-xs">{toastMessage}</Text>
          <CheckCircle2 size={18} color="#101415" />
        </View>
      )}

    </View>
  );
};

const FingerprintIcon = () => (
  <ShieldCheck size={16} color="#c084fc" />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d2a24',
  },
  scrollContent: {
    paddingTop: 16,
  },
});

export default AdminStaffSettingsScreen;
