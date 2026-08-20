import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, TextInput, Modal, Image, KeyboardAvoidingView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Send, Zap, ArrowRight, UserPlus, Info, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../store/useAuthStore';
import { GuestHeader } from '../../components/GuestHeader';
import { useResponsive } from '../../utils/responsive';

export const EnquiryFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const logout = useAuthStore((state) => state.logout);
  const { isSmallPhone, insets, headerPaddingTop } = useResponsive();
  const [parentName, setParentName] = useState('');
  const [mobile, setMobile] = useState('');
  const [childName, setChildName] = useState('');
  const [grade, setGrade] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom alert dialog state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
    onClose?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showCustomAlert = (title: string, message: string, type: 'success' | 'error', onClose?: () => void) => {
    setCustomAlert({ visible: true, title, message, type, onClose });
  };

  const handleSubmit = () => {
    if (!parentName || !mobile || !childName) {
      showCustomAlert('Required Fields', 'Please fill in parent name, mobile number, and child name.', 'error');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showCustomAlert(
        'Success',
        'Thank you! Your enquiry has been received. Our team will contact you within 24 hours.',
        'success',
        () => navigation.goBack()
      );
    }, 1500);
  };

  const gradeOptions = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <LinearGradient
        colors={['#1a2a3a', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <GuestHeader title="Apply Now" showBack />

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerPaddingTop + 45,
            paddingBottom: insets.bottom + 90,
          }
        ]} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View className="px-5 mb-6">
          <Text className="text-white text-3xl font-extrabold leading-tight mb-3">
            Begin Your <Text className="text-[#8ed5ff]">Visionary</Text>{'\n'}Journey.
          </Text>
          <Text className="text-white/60 text-sm leading-relaxed">
            Join an elite community of learners. Fill out the enquiry form below, and our admissions office will guide you through the next steps.
          </Text>
        </View>

        {/* Priority Processing Banner */}
        <View className="px-5 mb-6">
          <View style={styles.priorityBanner}>
            <View style={styles.priorityIconWrap}>
              <Zap size={18} color="#8ed5ff" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-white font-bold text-sm mb-0.5">Priority Processing</Text>
              <Text className="text-white/60 text-xs">Enquiries are reviewed within 24 hours.</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View className="px-5 mb-8">
          <View style={styles.formCard}>
            {/* Parent Name */}
            <View className="gap-2">
              <Text style={styles.fieldLabel}>PARENT NAME</Text>
              <TextInput
                value={parentName}
                onChangeText={setParentName}
                placeholder="John Doe"
                placeholderTextColor="rgba(0,0,0,0.35)"
                style={styles.inputField}
              />
            </View>

            {/* Mobile Number */}
            <View className="gap-2">
              <Text style={styles.fieldLabel}>MOBILE NUMBER</Text>
              <TextInput
                value={mobile}
                onChangeText={setMobile}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor="rgba(0,0,0,0.35)"
                keyboardType="phone-pad"
                style={styles.inputField}
              />
            </View>

            {/* Child Name */}
            <View className="gap-2">
              <Text style={styles.fieldLabel}>CHILD NAME</Text>
              <TextInput
                value={childName}
                onChangeText={setChildName}
                placeholder="Jane Doe"
                placeholderTextColor="rgba(0,0,0,0.35)"
                style={styles.inputField}
              />
            </View>

            {/* Class Applying For */}
            <View className="gap-2">
              <Text style={styles.fieldLabel}>CLASS APPLYING FOR</Text>
              <View className="flex-row flex-wrap gap-2 mt-1">
                {gradeOptions.map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setGrade(g)}
                    style={[
                      styles.gradeChip,
                      grade === g && styles.gradeChipActive
                    ]}
                    className="active:scale-95"
                  >
                    <Text
                      style={[
                        styles.gradeChipText,
                        grade === g && styles.gradeChipTextActive
                      ]}
                    >
                      {g}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Message */}
            <View className="gap-2">
              <Text style={styles.fieldLabel}>MESSAGE</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Any specific requirements or questions..."
                placeholderTextColor="rgba(0,0,0,0.35)"
                multiline
                numberOfLines={4}
                style={[styles.inputField, styles.textArea]}
              />
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitButton}
              className="active:scale-95"
            >
              <Text className="text-[#004965] font-bold text-sm">
                {isSubmitting ? 'Sending...' : 'Submit Enquiry'}
              </Text>
              <Send size={16} color="#004965" />
            </Pressable>

            {/* Create Parent Account */}
            <Pressable
              onPress={() => logout()}
              style={styles.secondaryButton}
              className="active:scale-95"
            >
              <Text className="text-[#8ed5ff] font-semibold text-sm">Create Parent Account</Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom Section - Shaping Future Leaders */}
        <View className="mb-8">
          <View style={styles.bottomImageWrap}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9k2qrRKn6EjnwySdK8mvWGIpe-XMCT6PjXLgtiDE5O-zAs0M728KjEs2lEYzwC_UZJsD8w8Zzwmv_XflmUM8_AEnEGLAU4ferUD-PhSHAKJrd4_pJmBpBbkPgAtPLtwCyeFJJVMwOVLT0h2ecFRef8MHSXHhVUwFTucejkwH3ax5o4O36r1cvDPie5aQEMrhgPBFBl5H8p8uI8Ymb-rszmCJuKbQvR_KHb4oTXqQNDjh6RNFwtQ21EZndWWRkXCz79yeZzQ6KHK7s' }}
              style={styles.bottomImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(16,20,21,0.85)', '#101415']}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
          <View className="px-5 -mt-24">
            <Text className="text-white text-2xl font-extrabold leading-tight mb-2">
              Shaping Future{'\n'}Leaders
            </Text>
            <Text className="text-white/60 text-sm leading-relaxed">
              Our campus blends traditional academic rigor with cutting-edge technological infrastructure.
            </Text>
          </View>
        </View>

        {/* Bottom spacer for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Top App Bar */}
      <GuestHeader title="Admission Enquiry" showBack />

      {/* Floating Footer CTA */}
      <BlurView intensity={40} tint="dark" style={styles.footer}>
        <Pressable
          onPress={() => logout()}
          className="flex-row items-center gap-3 px-6 py-3 rounded-full bg-white/10 active:bg-white/20 border border-[#8ed5ff]/30"
        >
          <Text className="text-xs font-bold text-[#8ed5ff]">
            Register to unlock attendance, marks & full features
          </Text>
          <ArrowRight size={16} color="#8ed5ff" />
        </Pressable>
      </BlurView>

      {/* Custom Dialog Alert Modal */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <View 
            style={styles.alertCard}
            className="w-[85%] max-w-[340px] p-6 border border-[#8ed5ff]/20 items-center" 
          >
            {/* Header Icon */}
            <View className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center ${
              customAlert.type === 'error' 
                ? 'bg-red-500/10 border border-red-500/20' 
                : 'bg-[#8ed5ff]/10 border border-[#8ed5ff]/20'
            }`}>
              {customAlert.type === 'error' ? (
                <Info size={24} color="#EF4444" />
              ) : (
                <CheckCircle size={24} color="#8ed5ff" />
              )}
            </View>

            {/* Title & Message */}
            <Text className="text-white text-lg font-bold text-center mb-2">
              {customAlert.title}
            </Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-6 px-1">
              {customAlert.message}
            </Text>

            {/* Action Button */}
            <Pressable 
              onPress={() => {
                setCustomAlert(prev => ({ ...prev, visible: false }));
                if (customAlert.onClose) customAlert.onClose();
              }}
              style={styles.prospectusButton}
              className="w-full py-3.5 rounded-xl items-center active:scale-95 shadow-md shadow-[#38bdf8]/30"
            >
              <Text className="text-[#004965] font-bold text-xs uppercase tracking-wider">Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101415',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 50 : 35,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 50,
    elevation: 5,
    backgroundColor: '#1a2a3a',
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : 85,
    paddingBottom: 40,
  },
  priorityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
  },
  priorityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 213, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(142, 213, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    gap: 20,
  },
  fieldLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginLeft: 2,
  },
  inputField: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1a1a2e',
  },
  selectField: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  gradeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  gradeChipActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  gradeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  gradeChipTextActive: {
    color: '#004965',
    fontWeight: '700',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(142, 213, 255, 0.3)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(142, 213, 255, 0.05)',
  },
  bottomImageWrap: {
    width: '100%',
    height: 200,
    overflow: 'hidden',
  },
  bottomImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(142, 213, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2a3a',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCard: {
    backgroundColor: '#101415',
    borderRadius: 28,
    shadowColor: '#8ed5ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: Platform.OS === 'android' ? 0 : 8,
  },
  prospectusButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
});

export default EnquiryFormScreen;
