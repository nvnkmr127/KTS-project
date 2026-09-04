import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  BackHandler,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Building2,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Phone,
  MapPin,
  BadgePercent,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import { GlassCard } from '../../../components/GlassCard';
import { useResponsive } from '../../../utils/responsive';
import { api } from '../../../services/api';

export const SuperAdminSchoolProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { headerPaddingTop, scrollBottomPadding, containerStyle } = useResponsive();

  const [schoolName, setSchoolName] = useState('Krishnaveni Talent School');
  const [schoolEmail, setSchoolEmail] = useState('info@krishnaveni.edu');
  const [schoolPhone, setSchoolPhone] = useState('+91 98765 43210');
  const [schoolAddress, setSchoolAddress] = useState('Main Campus, Nizamabad, Telangana - 503001');
  const [minAttendance, setMinAttendance] = useState('75');
  const [schoolLogoUri, setSchoolLogoUri] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

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

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const data = await api.getResources('settings');
      if (Array.isArray(data)) {
        const nameSet = data.find((s: any) => s.key === 'school_name');
        const emailSet = data.find((s: any) => s.key === 'school_email');
        const phoneSet = data.find((s: any) => s.key === 'school_phone');
        const addrSet = data.find((s: any) => s.key === 'school_address');
        const attSet = data.find((s: any) => s.key === 'minimum_attendance_percentage');
        const logoSet = data.find((s: any) => s.key === 'school_logo');

        if (nameSet?.value) setSchoolName(nameSet.value);
        if (emailSet?.value) setSchoolEmail(emailSet.value);
        if (phoneSet?.value) setSchoolPhone(phoneSet.value);
        if (addrSet?.value) setSchoolAddress(addrSet.value);
        if (attSet?.value) setMinAttendance(attSet.value);
        if (logoSet?.value) setSchoolLogoUri(logoSet.value);
      }
    } catch (e) {
      console.log('Error loading school profile settings:', e);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    loadSettings();
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

  const handlePickLogo = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSchoolLogoUri(res.assets[0].uri);
      }
    } catch (e) {
      console.log('Picker error:', e);
    }
  };

  const handleSaveSettings = async () => {
    if (!schoolName.trim() || !schoolEmail.trim() || !schoolPhone.trim()) {
      showAlert('Missing Fields', 'School name, email, and contact phone are required.', 'error');
      return;
    }
    setSavingSettings(true);
    setSettingsSuccess('');
    try {
      const keys = [
        { key: 'school_name', value: schoolName },
        { key: 'school_email', value: schoolEmail },
        { key: 'school_phone', value: schoolPhone },
        { key: 'school_address', value: schoolAddress },
        { key: 'minimum_attendance_percentage', value: minAttendance },
        ...(schoolLogoUri ? [{ key: 'school_logo', value: schoolLogoUri }] : []),
      ];
      await Promise.all(
        keys.map((k) =>
          api.createResource('settings', { key: k.key, value: k.value, group: 'general', is_public: true }).catch(() => {})
        )
      );
      setSettingsSuccess('Settings saved successfully!');
      showAlert('Settings Saved', 'School profile configurations saved successfully.', 'success');
    } catch (err) {
      console.log('Error saving settings:', err);
    } finally {
      setSavingSettings(false);
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
                School Profile Configurations
              </Text>
              <Text numberOfLines={1} className="text-xs uppercase tracking-wider text-[#ffe5a0] font-bold mt-0.5">
                PUBLIC INFORMATION & INTEGRATION KEYS
              </Text>
            </View>
          </View>
          <View className="w-10 h-10 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center">
            <Building2 size={22} color="#f0c110" />
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
          {/* Card: Logo Section */}
          <GlassCard className="p-4 border border-white/10" intensity="low">
            <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider mb-3">
              SCHOOL LOGO
            </Text>
            <View className="flex-row items-center gap-4">
              <View className="w-16 h-16 rounded-2xl bg-black/40 border border-white/15 items-center justify-center overflow-hidden p-1 shadow-sm">
                <Image
                  source={{
                    uri:
                      schoolLogoUri ||
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuC7FczfnKSVZ91VRiIfuBtOEhmA6JLz4YPSk40CQrAgXsqPb5NWWdCqqmzVpJNDpnxQSdecTP5pe54DRMCbFkMlfR4K5JBMwr9Z9rd-f_05dfhdy0ThMgGq6naYJfCjz3amVCvWhbnfwiSLhYOXSuGF55kpWsfljF4nv2FiNP_5euYTdpm0iAi6VVUFf6QUENV0LTmHNXvfAU9c2xBiXHTKJ_79usdMqTNH6H7v68K2SpfvOTvVJlisZuBp-236LvhLC0HnSYL9q8Sc',
                  }}
                  className="w-full h-full rounded-xl"
                  style={{ resizeMode: 'cover' }}
                />
              </View>
              <View className="flex-1">
                <View className="flex-row gap-2 mb-1.5">
                  <Pressable
                    onPress={handlePickLogo}
                    className="px-3 py-2 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 flex-row items-center gap-1.5 active:scale-95"
                  >
                    <Upload size={13} color="#ffe5a0" />
                    <Text className="text-[#ffe5a0] text-xs font-bold">Upload Logo</Text>
                  </Pressable>
                  {schoolLogoUri && (
                    <Pressable
                      onPress={() => setSchoolLogoUri(null)}
                      className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 active:scale-95"
                    >
                      <Text className="text-white/60 text-xs font-bold">Reset</Text>
                    </Pressable>
                  )}
                </View>
                <Text className="text-white/40 text-[10px]">Supported formats: JPG, PNG, JPEG. Max size 1MB.</Text>
              </View>
            </View>
          </GlassCard>

          {/* Card: Form Fields */}
          <GlassCard className="p-4 border border-white/10" intensity="low">
            <View className="gap-3.5">
              <View>
                <Text className="text-white/70 text-xs font-bold mb-1.5 flex-row items-center">
                  <Building2 size={12} color="#ffe5a0" style={{ marginRight: 4 }} /> School Name *
                </Text>
                <TextInput
                  value={schoolName}
                  onChangeText={setSchoolName}
                  placeholder="e.g. Krishnaveni Talent School"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="bg-black/50 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-xs font-semibold"
                />
              </View>

              <View>
                <Text className="text-white/70 text-xs font-bold mb-1.5 flex-row items-center">
                  <Mail size={12} color="#ffe5a0" style={{ marginRight: 4 }} /> Contact Email Address *
                </Text>
                <TextInput
                  value={schoolEmail}
                  onChangeText={setSchoolEmail}
                  keyboardType="email-address"
                  placeholder="e.g. info@krishnaveni.edu"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="bg-black/50 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-xs font-semibold"
                />
              </View>

              <View>
                <Text className="text-white/70 text-xs font-bold mb-1.5 flex-row items-center">
                  <Phone size={12} color="#ffe5a0" style={{ marginRight: 4 }} /> Contact Phone Number *
                </Text>
                <TextInput
                  value={schoolPhone}
                  onChangeText={setSchoolPhone}
                  keyboardType="phone-pad"
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="bg-black/50 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-xs font-semibold"
                />
              </View>

              <View>
                <Text className="text-white/70 text-xs font-bold mb-1.5 flex-row items-center">
                  <BadgePercent size={12} color="#ffe5a0" style={{ marginRight: 4 }} /> Minimum Student Attendance (%) *
                </Text>
                <TextInput
                  value={minAttendance}
                  onChangeText={setMinAttendance}
                  keyboardType="numeric"
                  placeholder="e.g. 75"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="bg-black/50 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-xs font-semibold"
                />
              </View>

              <View>
                <Text className="text-white/70 text-xs font-bold mb-1.5 flex-row items-center">
                  <MapPin size={12} color="#ffe5a0" style={{ marginRight: 4 }} /> School Physical Address
                </Text>
                <TextInput
                  value={schoolAddress}
                  onChangeText={setSchoolAddress}
                  multiline
                  numberOfLines={2}
                  placeholder="House no, Street, Area, Town, State"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="bg-black/50 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-xs font-semibold"
                />
              </View>
            </View>

            {settingsSuccess ? (
              <View className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex-row items-center gap-2">
                <CheckCircle2 size={14} color="#41eec2" />
                <Text className="text-emerald-400 text-xs font-semibold">{settingsSuccess}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSaveSettings}
              disabled={savingSettings}
              className="py-3.5 mt-5 rounded-2xl bg-[#f0c110] flex-row items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#f0c110]/30"
            >
              {savingSettings ? <ActivityIndicator size="small" color="#101415" /> : <Save size={16} color="#101415" />}
              <Text className="text-[#101415] font-extrabold text-xs uppercase tracking-wider">
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </Text>
            </Pressable>
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

export default SuperAdminSchoolProfileScreen;
