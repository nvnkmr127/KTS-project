import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Image, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, CheckCircle, Calendar, FileText, ClipboardList, Building2, FileSignature, GraduationCap, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../store/useAuthStore';
import { GuestHeader } from '../../components/GuestHeader';

export const AdmissionsInfoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const logout = useAuthStore((state) => state.logout);

  // Custom alert dialog state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showCustomAlert = (title: string, message: string) => {
    setCustomAlert({ visible: true, title, message });
  };

  const steps = [
    { num: '01', icon: ClipboardList, title: 'Enquiry', desc: 'Connect with our counselors to discuss your goals and understand our visionary curriculum.' },
    { num: '02', icon: Building2, title: 'Visit', desc: 'Experience our state-of-the-art campus firsthand with a personalized guided tour.' },
    { num: '03', icon: FileSignature, title: 'Form', desc: 'Complete our digital-first application process via the integrated EduVision portal.' },
    { num: '04', icon: GraduationCap, title: 'Admission', desc: 'Receive your visionary welcome kit and join our elite community of global learners.' }
  ];

  const eligibility = [
    { title: 'Academic Excellence', desc: 'Minimum 75% aggregate in prerequisite examinations or international equivalent.', color: '#8ed5ff' },
    { title: 'Language Proficiency', desc: 'IELTS 6.5+ or TOEFL iBT 90+ for international non-native English speakers.', color: '#34d399' },
    { title: 'Aptitude Testing', desc: 'Successful completion of the EduVision Visionary Thinking Assessment.', color: '#fbbf24' },
    { title: 'Interview Round', desc: 'Holistic review through a digital panel discussion with faculty leads.', color: '#a78bfa' }
  ];

  const dates = [
    { label: 'Early Access', date: 'Oct 15, 2024' },
    { label: 'Regular Batch', date: 'Jan 20, 2025' },
    { label: 'Scholarship Exam', date: 'Feb 12, 2025' },
    { label: 'Commencement', date: 'Sep 05, 2025' }
  ];

  const docs = [
    'Official Academic Transcripts',
    'Valid Government Identity Card',
    'Letter of Recommendation',
    'Statement of Purpose (Video/Text)',
    'Recent Passport Photograph',
    'Extracurricular Certificates'
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a2a3a', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View className="px-5 mb-8">
          <Text className="text-white text-3xl font-extrabold leading-tight mb-3">
            Join the Future of{'\n'}<Text className="text-[#8ed5ff]">Learning</Text>
          </Text>
          <Text className="text-white/60 text-sm leading-relaxed text-center">
            A seamless, visionary admissions journey designed to empower your educational aspirations. From initial inquiry to final enrollment, we guide you every step of the way.
          </Text>
        </View>

        {/* The Journey */}
        <View className="px-5 mb-8">
          <View className="flex-row items-center gap-3 mb-5">
            <View style={styles.dividerLine} />
            <Text className="text-white/40 text-[10px] font-bold uppercase tracking-[3px]">THE JOURNEY</Text>
            <View style={styles.dividerLine} />
          </View>

          <View className="gap-4">
            {steps.map((s, idx) => {
              const IconComp = s.icon;
              return (
                <View key={idx} style={styles.stepCard}>
                  {/* Step Number Badge */}
                  <View style={styles.stepBadge}>
                    <Text className="text-[#8ed5ff] font-bold text-[10px]">{s.num}</Text>
                  </View>

                  <View className="mt-4 gap-2">
                    <View style={styles.stepIconWrap}>
                      <IconComp size={20} color="rgba(255,255,255,0.5)" />
                    </View>
                    <Text className="text-white font-bold text-base">{s.title}</Text>
                    <Text className="text-white/60 text-xs leading-relaxed">{s.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Eligibility Criteria */}
        <View className="px-5 mb-8">
          <View style={styles.sectionCard}>
            <Text className="text-white font-bold text-lg mb-5">Eligibility Criteria</Text>
            <View className="gap-5">
              {eligibility.map((el, idx) => (
                <View key={idx} className="flex-row gap-3">
                  <View style={[styles.eligibilityDot, { backgroundColor: el.color }]} />
                  <View className="flex-1">
                    <Text className="text-[#8ed5ff] font-bold text-xs mb-1">{el.title}</Text>
                    <Text className="text-white/60 text-xs leading-relaxed">{el.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Critical Dates */}
        <View className="px-5 mb-8">
          <View style={styles.sectionCard}>
            <Text className="text-white font-bold text-lg mb-4">Critical Dates</Text>
            <View className="gap-3 mb-5">
              {dates.map((d, idx) => (
                <View key={idx} className="flex-row justify-between items-center">
                  <Text className="text-white/60 text-xs">{d.label}</Text>
                  <Text className="text-white/80 font-semibold text-xs">{d.date}</Text>
                </View>
              ))}
            </View>
            <Pressable 
              onPress={() => showCustomAlert('Add to Calendar', 'Key admission timeline events and deadlines have been added to your calendar.')}
              style={styles.calendarButton} 
              className="active:scale-95"
            >
              <Calendar size={16} color="#8ed5ff" />
              <Text className="text-[#8ed5ff] font-semibold text-xs ml-2">Add to Calendar</Text>
            </Pressable>
          </View>
        </View>

        {/* Required Documentation */}
        <View className="px-5 mb-8">
          <View style={styles.sectionCard}>
            <Text className="text-white font-bold text-lg mb-2">Required Documentation</Text>
            <Text className="text-white/50 text-xs mb-5 leading-relaxed">
              Please ensure high-resolution digital copies of the following are ready for your application portal upload.
            </Text>
            <View className="gap-3.5">
              {docs.map((doc, idx) => (
                <View key={idx} className="flex-row items-center gap-3">
                  <CheckCircle size={16} color="#8ed5ff" />
                  <Text className="text-white/80 text-xs font-medium">{doc}</Text>
                </View>
              ))}
            </View>

            {/* Bottom Image */}
            <View style={styles.docImageWrap} className="mt-6">
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlbOkJML0ZHtBAsgIlDc0SgNZ8cxtHU65dA9vlXDDZN8jzqD6Oj6XmBgPiyvlvoarYwofQc1pOxnFapMfFX0-iwW77dRygkOclMsNajUowpnvBW1-vx1DdWk8m_wk3JNlBoaL_DmEZGYHiZON_xWUdpRoe6FjZlmcH1Zz1tRKG-6yPSOGdM59QCtr10hYXidoNTdd5B3GIC0Mktwph8QwC7WhxmJfxCKHDDFkQtJj_WgXhHrQWU0AJu_lMbXDxmHWC0sUnXQwSStRM' }}
                style={styles.docImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>

        {/* Bottom spacer for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Top App Bar */}
      <GuestHeader title="Admissions" showBack />

      {/* Floating Footer CTA */}
      <BlurView intensity={40} tint="dark" style={styles.footer}>
        <Pressable
          onPress={() => navigation.navigate('EnquiryForm')}
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
            <View className="w-12 h-12 rounded-2xl mb-4 items-center justify-center bg-[#8ed5ff]/10 border border-[#8ed5ff]/20">
              <Info size={24} color="#8ed5ff" />
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
              onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
              style={styles.prospectusButton}
              className="w-full py-3.5 rounded-xl items-center active:scale-95 shadow-md shadow-[#38bdf8]/30"
            >
              <Text className="text-[#004965] font-bold text-xs uppercase tracking-wider">Dismiss</Text>
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
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
  },
  stepBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
  },
  eligibilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 213, 255, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: 'rgba(142, 213, 255, 0.05)',
  },
  docImageWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  docImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
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

export default AdmissionsInfoScreen;
