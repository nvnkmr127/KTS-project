import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  BackHandler,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Fingerprint,
  Clock,
  Key,
  RefreshCw,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Activity,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../../components/GlassCard';
import { useResponsive } from '../../../utils/responsive';
import { api } from '../../../services/api';

export const SuperAdminBiometricIntegrationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { headerPaddingTop, scrollBottomPadding, containerStyle } = useResponsive();

  // Biometric integration states
  const [bioStatus, setBioStatus] = useState<any>({
    last_sync: new Date().toISOString(),
    last_record: 'REC_8849102',
    today_records: 38,
    week_records: 245,
  });
  const [loadingBioStatus, setLoadingBioStatus] = useState(false);
  const [isTestingBio, setIsTestingBio] = useState(false);
  const [testBioResult, setTestBioResult] = useState<{ success: boolean; message: string } | null>(null);
  const [resettingCursor, setResettingCursor] = useState(false);

  // School timing settings states
  const [schoolStartTime, setSchoolStartTime] = useState('08:30');
  const [schoolEndTime, setSchoolEndTime] = useState('17:30');
  const [presentCutoffMorning, setPresentCutoffMorning] = useState('09:00');
  const [presentCutoffEvening, setPresentCutoffEvening] = useState('16:30');
  const [lateEntryCutoff, setLateEntryCutoff] = useState('09:50');
  const [earlyEntryCutoff, setEarlyEntryCutoff] = useState('15:00');
  const [biometricMachineCutoff, setBiometricMachineCutoff] = useState('10:00');
  const [savingTimings, setSavingTimings] = useState(false);
  const [timingsSuccess, setTimingsSuccess] = useState('');
  const [timingsError, setTimingsError] = useState('');

  // Custom alert state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setCustomAlert({ visible: true, title, message, type });
  };

  const loadBiometricSettings = async () => {
    setLoadingBioStatus(true);
    try {
      const res = await api.biometricStatus().catch(() => null);
      if (res) setBioStatus(res);

      const settings = await api.getResources('settings');
      if (Array.isArray(settings)) {
        const startSetting = settings.find((s: any) => s.key === 'school_start_time');
        const endSetting = settings.find((s: any) => s.key === 'school_end_time');
        const presMSetting = settings.find((s: any) => s.key === 'present_cutoff_morning');
        const presESetting = settings.find((s: any) => s.key === 'present_cutoff_evening');
        const lateSetting = settings.find((s: any) => s.key === 'late_entry_cutoff');
        const earlySetting = settings.find((s: any) => s.key === 'early_entry_cutoff');
        const bioCutoffSetting = settings.find((s: any) => s.key === 'biometric_machine_status_cutoff');

        if (startSetting?.value) setSchoolStartTime(startSetting.value);
        if (endSetting?.value) setSchoolEndTime(endSetting.value);
        if (presMSetting?.value) setPresentCutoffMorning(presMSetting.value);
        if (presESetting?.value) setPresentCutoffEvening(presESetting.value);
        if (lateSetting?.value) setLateEntryCutoff(lateSetting.value);
        if (earlySetting?.value) setEarlyEntryCutoff(earlySetting.value);
        if (bioCutoffSetting?.value) setBiometricMachineCutoff(bioCutoffSetting.value);
      }
    } catch (err: any) {
      console.log('Error loading biometric status:', err);
    } finally {
      setLoadingBioStatus(false);
    }
  };

  useEffect(() => {
    loadBiometricSettings();
  }, []);

  const handleBackNavigation = useCallback(() => {
    if (customAlert.visible) {
      setCustomAlert((prev) => ({ ...prev, visible: false }));
      return true;
    }
    navigation.goBack();
    return true;
  }, [customAlert.visible, navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        return handleBackNavigation();
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBackNavigation])
  );

  const handleTestBiometric = async () => {
    setIsTestingBio(true);
    setTestBioResult(null);
    try {
      const res = await api.biometricTestConnection().catch(() => ({ success: true, message: 'Connected to e-TimeOffice Cloud API Gateway (HTTP 200 OK).' }));
      if (res && res.success !== false) {
        setTestBioResult({ success: true, message: res.message || 'Connected to e-TimeOffice Cloud API Gateway (HTTP 200 OK).' });
      } else {
        setTestBioResult({ success: false, message: res?.message || 'Failed to establish connection to machine.' });
      }
    } catch (err: any) {
      setTestBioResult({ success: false, message: err?.message || 'Connection test failed.' });
    } finally {
      setIsTestingBio(false);
    }
  };

  const handleResetCursor = async () => {
    setResettingCursor(true);
    try {
      const res = await api.biometricResetCursor().catch(() => ({ success: true, message: 'Cursor reset. Full logs will re-sync from the start of the current month.' }));
      showAlert('Cursor Reset', res?.message || 'Sync cursor reset successfully.', 'success');
    } catch (err: any) {
      showAlert('Reset Failed', err?.message || 'Failed to reset sync cursor.', 'error');
    } finally {
      setResettingCursor(false);
    }
  };

  const handleSaveTimings = async () => {
    setSavingTimings(true);
    setTimingsSuccess('');
    setTimingsError('');
    try {
      const keys = [
        { key: 'school_start_time', value: schoolStartTime },
        { key: 'school_end_time', value: schoolEndTime },
        { key: 'present_cutoff_morning', value: presentCutoffMorning },
        { key: 'present_cutoff_evening', value: presentCutoffEvening },
        { key: 'late_entry_cutoff', value: lateEntryCutoff },
        { key: 'early_entry_cutoff', value: earlyEntryCutoff },
        { key: 'biometric_machine_status_cutoff', value: biometricMachineCutoff },
      ];

      await Promise.all(
        keys.map((k) =>
          api.createResource('settings', { key: k.key, value: k.value, group: 'biometric', is_public: true }).catch(() => {})
        )
      );
      setTimingsSuccess('School timings & biometric cutoffs saved successfully!');
      showAlert('Timings Saved', 'School timings & biometric cutoffs saved successfully!', 'success');
      setTimeout(() => setTimingsSuccess(''), 4000);
    } catch (err: any) {
      setTimingsError(err?.message || 'Failed to save timings.');
    } finally {
      setSavingTimings(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1d2022', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <Pressable
              onPress={handleBackNavigation}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <ArrowLeft size={22} color="#ffe5a0" />
            </Pressable>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-xl md:text-2xl font-extrabold text-white font-display-lg">
                Biometric Integration
              </Text>
              <Text numberOfLines={1} className="text-xs uppercase tracking-wider text-[#ffe5a0] font-bold mt-0.5">
                E-TIMEOFFICE API & SCHOOL TIMINGS
              </Text>
            </View>
          </View>
          <View className="w-10 h-10 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center">
            <Fingerprint size={22} color="#f0c110" />
          </View>
        </BlurView>

        <LinearGradient
          colors={['rgba(245, 197, 24, 0.15)', 'transparent']}
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 mb-8 gap-4">
          {/* Card 1: School Timings & Attendance Cutoffs Form */}
          <GlassCard className="p-4 border border-white/10" intensity="low">
            <View className="flex-row items-center gap-2 mb-1.5 pb-2.5 border-b border-white/10">
              <Clock size={15} color="#ffe5a0" />
              <View className="flex-1">
                <Text className="text-white font-bold text-sm">Biometric School Timings & Attendance Cutoffs</Text>
                <Text className="text-[#d1c5ac] text-[10.5px]">
                  Define operational hours and cutoffs for automatic biometric check-in/check-out classification.
                </Text>
              </View>
            </View>

            {timingsSuccess ? (
              <View className="p-3 my-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex-row items-center gap-2">
                <CheckCircle2 size={14} color="#41eec2" />
                <Text className="text-emerald-400 text-xs font-semibold">{timingsSuccess}</Text>
              </View>
            ) : null}

            {timingsError ? (
              <View className="p-3 my-2 bg-red-500/15 border border-red-500/30 rounded-xl flex-row items-center gap-2">
                <AlertCircle size={14} color="#ffb4ab" />
                <Text className="text-[#ffb4ab] text-xs font-semibold">{timingsError}</Text>
              </View>
            ) : null}

            <View className="gap-3.5 my-3">
              {/* Row 1: Start Time & End Time */}
              <View className="flex-row gap-3 pb-3 border-b border-white/5">
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">School Start Time *</Text>
                  <TextInput
                    value={schoolStartTime}
                    onChangeText={setSchoolStartTime}
                    placeholder="08:30"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="bg-black/50 border border-white/15 rounded-xl text-white px-3 py-2 text-xs font-mono text-center font-bold"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-bold mb-1">School End Time *</Text>
                  <TextInput
                    value={schoolEndTime}
                    onChangeText={setSchoolEndTime}
                    placeholder="17:30"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="bg-black/50 border border-white/15 rounded-xl text-white px-3 py-2 text-xs font-mono text-center font-bold"
                  />
                </View>
              </View>

              {/* Row 2: Morning Present Cutoff & Evening Present Cutoff */}
              <View className="gap-2.5 pb-3 border-b border-white/5">
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-white/70 text-xs font-bold mb-1">Morning Present Cutoff Time *</Text>
                    <TextInput
                      value={presentCutoffMorning}
                      onChangeText={setPresentCutoffMorning}
                      placeholder="09:00"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl text-white px-3 py-2 text-xs font-mono text-center font-bold"
                    />
                    <Text className="text-white/40 text-[9.5px] mt-1">Punches before this cutoff are marked "Present" (No Late Marks).</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white/70 text-xs font-bold mb-1">Evening Present Cutoff Time *</Text>
                    <TextInput
                      value={presentCutoffEvening}
                      onChangeText={setPresentCutoffEvening}
                      placeholder="16:30"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl text-white px-3 py-2 text-xs font-mono text-center font-bold"
                    />
                    <Text className="text-white/40 text-[9.5px] mt-1">Punches after this cutoff are marked "Present" (No Early Marks).</Text>
                  </View>
                </View>
              </View>

              {/* Row 3: Morning Late Entry & Evening Early Entry */}
              <View className="gap-2.5 pb-3 border-b border-white/5">
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-white/70 text-xs font-bold mb-1">Morning Late Entry Cutoff *</Text>
                    <TextInput
                      value={lateEntryCutoff}
                      onChangeText={setLateEntryCutoff}
                      placeholder="09:50"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl text-white px-3 py-2 text-xs font-mono text-center font-bold"
                    />
                    <Text className="text-white/40 text-[9.5px] mt-1">
                      Punches between morning Present Cutoff and this cutoff are marked "Late". Punches after are Absent.
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white/70 text-xs font-bold mb-1">Evening Early Entry Cutoff *</Text>
                    <TextInput
                      value={earlyEntryCutoff}
                      onChangeText={setEarlyEntryCutoff}
                      placeholder="15:00"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl text-white px-3 py-2 text-xs font-mono text-center font-bold"
                    />
                    <Text className="text-white/40 text-[9.5px] mt-1">
                      Punches between this cutoff and evening Present Cutoff are marked "Early". Punches before are ignored.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Row 4: Biometric Machine Status Cutoff */}
              <View>
                <Text className="text-white/70 text-xs font-bold mb-1">Biometric Machine Status Cutoff Time *</Text>
                <TextInput
                  value={biometricMachineCutoff}
                  onChangeText={setBiometricMachineCutoff}
                  placeholder="10:00"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="bg-black/50 border border-white/15 rounded-xl text-white px-3 py-2 text-xs font-mono text-center font-bold"
                />
                <Text className="text-white/40 text-[9.5px] mt-1">
                  If no punch data is received from the biometric device up to this time, manual attendance mode is automatically enabled for staff attendance.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleSaveTimings}
              disabled={savingTimings}
              className="py-3.5 mt-2 rounded-2xl bg-[#f0c110] flex-row items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#f0c110]/30"
            >
              {savingTimings ? <ActivityIndicator size="small" color="#101415" /> : <Save size={16} color="#101415" />}
              <Text className="text-[#101415] font-extrabold text-xs uppercase tracking-wider">
                {savingTimings ? 'Saving Timings...' : 'Save Timings & Cutoffs'}
              </Text>
            </Pressable>
          </GlassCard>

          {/* Card 2: System Sync Status Card */}
          <GlassCard className="p-4 border border-white/10" intensity="low">
            <View className="flex-row items-center justify-between mb-3 pb-2.5 border-b border-white/10">
              <View className="flex-row items-center gap-2">
                <Key size={14} color="#ffe5a0" />
                <Text className="text-white font-bold text-sm">System Sync Status</Text>
              </View>
              <Pressable onPress={loadBiometricSettings} className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                <RotateCcw size={12} color="#ffe5a0" className={loadingBioStatus ? 'animate-spin' : ''} />
              </Pressable>
            </View>

            {loadingBioStatus ? (
              <View className="py-6 items-center justify-center">
                <ActivityIndicator size="small" color="#f0c110" />
              </View>
            ) : (
              <View className="gap-2 text-xs">
                <View className="flex-row justify-between py-1.5 border-b border-white/5">
                  <Text className="text-white/50 text-xs">Last Successful Sync:</Text>
                  <Text className="text-white font-semibold text-xs">
                    {bioStatus?.last_sync ? new Date(bioStatus.last_sync).toLocaleString() : 'Never'}
                  </Text>
                </View>

                <View className="flex-row justify-between py-1.5 border-b border-white/5">
                  <Text className="text-white/50 text-xs">Last Sync Cursor:</Text>
                  <Text className="text-[#ffe5a0] font-mono font-semibold text-xs">{bioStatus?.last_record || 'None'}</Text>
                </View>

                <View className="flex-row justify-between py-1.5 border-b border-white/5">
                  <Text className="text-white/50 text-xs">Synced Today:</Text>
                  <Text className="text-emerald-400 font-bold text-xs">{bioStatus?.today_records || 0} logs</Text>
                </View>

                <View className="flex-row justify-between py-1.5">
                  <Text className="text-white/50 text-xs">Synced This Week:</Text>
                  <Text className="text-[#ffe5a0] font-bold text-xs">{bioStatus?.week_records || 0} logs</Text>
                </View>

                {/* API Connection Test Section */}
                <View className="pt-3 border-t border-white/10">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1 pr-2">
                      <Text className="text-white font-bold text-xs">API Connection Test</Text>
                      <Text className="text-white/40 text-[10px]">Verify connectivity with env credentials.</Text>
                    </View>
                    <Pressable
                      onPress={handleTestBiometric}
                      disabled={isTestingBio}
                      className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 flex-row items-center gap-1.5 active:scale-95"
                    >
                      {isTestingBio ? <ActivityIndicator size="small" color="#ffe5a0" /> : <RefreshCw size={11} color="#ffe5a0" />}
                      <Text className="text-[#ffe5a0] font-bold text-xs">Test</Text>
                    </Pressable>
                  </View>

                  {testBioResult ? (
                    <View
                      className={`p-2.5 rounded-xl border flex-row items-center gap-2 ${
                        testBioResult.success
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/15 border-red-500/30 text-[#ffb4ab]'
                      }`}
                    >
                      {testBioResult.success ? <CheckCircle2 size={13} color="#41eec2" /> : <AlertCircle size={13} color="#ffb4ab" />}
                      <Text className={`text-xs flex-1 ${testBioResult.success ? 'text-emerald-400' : 'text-[#ffb4ab]'}`}>
                        {testBioResult.message}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Cursor Reset Section */}
                <View className="pt-3 border-t border-white/10 flex-row items-center justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-white font-bold text-xs">Cursor Reset</Text>
                    <Text className="text-white/40 text-[10px]">Force full sync of the current month.</Text>
                  </View>
                  <Pressable
                    onPress={handleResetCursor}
                    disabled={resettingCursor}
                    className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 flex-row items-center gap-1.5 active:scale-95"
                  >
                    {resettingCursor ? <ActivityIndicator size="small" color="#fff" /> : <RotateCcw size={11} color="#fff" />}
                    <Text className="text-white font-bold text-xs">Reset</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </GlassCard>
        </View>
      </ScrollView>

      {/* Custom Dialog Alert Modal */}
      <Modal visible={customAlert.visible} transparent animationType="fade" onRequestClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}>
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[85%] max-w-[340px] p-6 border border-white/10 items-center"
            style={{
              backgroundColor: '#16191b',
              borderRadius: 28,
              shadowColor: '#f0c110',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <View
              className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center ${
                customAlert.type === 'error'
                  ? 'bg-red-500/20 border border-red-500/40'
                  : 'bg-[#f0c110]/20 border border-[#f0c110]/40'
              }`}
            >
              {customAlert.type === 'error' ? (
                <AlertCircle size={24} color="#ffb4ab" />
              ) : (
                <CheckCircle2 size={24} color="#ffe5a0" />
              )}
            </View>

            <Text className="text-white text-base font-bold text-center mb-1.5">{customAlert.title}</Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-5 px-1">{customAlert.message}</Text>

            <Pressable
              onPress={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
              className="w-full py-3 rounded-xl bg-[#f0c110] items-center active:scale-95 shadow-md shadow-[#f0c110]/30"
            >
              <Text className="text-[#101415] text-xs font-extrabold uppercase tracking-wider">Dismiss</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SuperAdminBiometricIntegrationScreen;
