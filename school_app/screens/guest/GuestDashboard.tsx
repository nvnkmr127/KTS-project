import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, CheckCircle, GraduationCap } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../../components/GlassCard';
import { useAuthStore } from '../../store/useAuthStore';
import { GuestHeader } from '../../components/GuestHeader';

const { width, height } = Dimensions.get('window');

export const GuestDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const logout = useAuthStore((state) => state.logout);
  const [activeChip, setActiveChip] = useState('Overview');

  const chips = [
    'Overview',
    'Our Vision',
    'Leadership',
    'Infrastructure',
    'Sports Academy',
    'Innovation Hub',
    'Global Partnerships'
  ];

  const stats = [
    { value: '1,200', label: 'Global Students' },
    { value: '68', label: 'Expert Faculty' },
    { value: '94%', label: 'Board Results' },
    { value: '25', label: 'Legacy Years' }
  ];

  const bulletPoints = [
    'AI-Integrated Personalized Tracks',
    'World-Class Olympic Sports Facilities',
    'Ivy League Placement Cell'
  ];

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1a2a3a', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Glow */}
      {Platform.OS === 'ios' && (
        <>
          <View style={styles.glowTopLeft} pointerEvents="none" />
          <View style={styles.glowBottomRight} pointerEvents="none" />
        </>
      )}

      {/* Top App Bar */}
      <GuestHeader 
        title="EduVision" 
        rightAction={
          <Pressable 
            onPress={() => navigation.navigate('EnquiryForm')}
            className="bg-[#38bdf8] px-5 py-2.5 rounded-full active:scale-95 shadow-[0_0_16px_rgba(56,189,248,0.4)]"
          >
            <Text className="text-[#004965] font-semibold text-xs font-label-lg">Apply Now</Text>
          </Pressable>
        }
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Section */}
        <View className="relative w-full h-[580] items-start justify-center overflow-hidden rounded-b-[40px] border-b border-white/10 mb-8">
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9k2qrRKn6EjnwySdK8mvWGIpe-XMCT6PjXLgtiDE5O-zAs0M728KjEs2lEYzwC_UZJsD8w8Zzwmv_XflmUM8_AEnEGLAU4ferUD-PhSHAKJrd4_pJmBpBbkPgAtPLtwCyeFJJVMwOVLT0h2ecFRef8MHSXHhVUwFTucejkwH3ax5o4O36r1cvDPie5aQEMrhgPBFBl5H8p8uI8Ymb-rszmCJuKbQvR_KHb4oTXqQNDjh6RNFwtQ21EZndWWRkXCz79yeZzQ6KHK7s' }}
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
          />
          <LinearGradient 
            colors={['rgba(16,20,21,0)', 'rgba(16,20,21,0.6)', '#101415']}
            style={StyleSheet.absoluteFillObject}
          />
          
          <View className="relative z-10 px-5 gap-6 mt-16">
            <View className="flex-row items-center gap-3">
              <View className="bg-[#38bdf8]/20 border border-[#38bdf8]/40 px-3 py-1 rounded-full">
                <Text className="text-[#8ed5ff] text-[10px] font-bold tracking-widest uppercase">CBSE / ICSE Accredited</Text>
              </View>
              <Text className="text-white/60 text-[10px] font-semibold tracking-wider font-label-md">Est. 1998</Text>
            </View>

            <Text className="text-white text-4xl font-extrabold leading-tight font-display-lg">
              EduVision{'\n'}
              <Text className="text-[#8ed5ff]">International School</Text>
            </Text>

            <Text className="text-white/70 text-sm leading-relaxed max-w-xs font-body-lg">
              Empowering the next generation of global thinkers through excellence in academic rigor and holistic development in a tech-integrated ecosystem.
            </Text>

            <View className="flex-row gap-4 mt-2">
              <Pressable 
                onPress={() => navigation.navigate('SchoolFacilities')}
                className="bg-[#38bdf8] px-6 py-3.5 rounded-xl active:scale-95 shadow-[0_0_16px_rgba(56,189,248,0.4)]"
              >
                <Text className="text-[#004965] font-bold text-xs font-label-lg">Explore Virtual Tour</Text>
              </Pressable>
              <Pressable 
                onPress={() => navigation.navigate('AdmissionsInfo')}
                style={styles.secondaryButton}
                className="px-6 py-3.5 rounded-xl active:scale-95"
              >
                <Text className="text-white font-semibold text-xs font-label-lg">Download Prospectus</Text>
              </Pressable>
            </View>

            {/* Know About Our Expert Faculty Button */}
            <Pressable
              onPress={() => navigation.navigate('FacultyShowcase')}
              style={styles.facultyButton}
              className="active:scale-95"
            >
              <GraduationCap size={15} color="#8ed5ff" />
              <Text className="text-[#8ed5ff] font-semibold text-xs ml-2 font-label-lg">Know About Our Expert Faculty</Text>
            </Pressable>
          </View>
        </View>

        {/* Horizontal Scroll Chips */}
        <View className="mb-8">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.chipsContainer}
          >
            {chips.map((chip) => (
              <Pressable
                key={chip}
                onPress={() => {
                  setActiveChip(chip);
                  if (chip === 'Infrastructure') navigation.navigate('SchoolFacilities');
                  else if (chip === 'Leadership') navigation.navigate('FacultyShowcase');
                  else if (chip === 'Sports Academy' || chip === 'Innovation Hub' || chip === 'Global Partnerships') {
                    // Navigate to Showcase or Facilities
                    navigation.navigate('SchoolFacilities');
                  }
                }}
                className={`px-5 py-2.5 rounded-full mr-3 border ${
                  activeChip === chip 
                    ? 'bg-[#38bdf8] border-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.3)]' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <Text 
                  className={`text-xs font-semibold ${
                    activeChip === chip ? 'text-[#004965]' : 'text-white/60'
                  }`}
                >
                  {chip}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Stats Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statsGrid}>
            {[
              { value: '1,200', label: 'Global Students', text: '#8ed5ff' },
              { value: '68',    label: 'Expert Faculty',  text: '#c4b5fd' },
              { value: '94%',   label: 'Board Results',   text: '#6ee7b7' },
              { value: '25',    label: 'Legacy Years',    text: '#fcd34d' },
            ].map((stat, idx) => (
              <View key={idx} style={styles.statGlowWrapper}>
                {/* === Exact same glass recipe as the dropdown === */}
                {/* Layer 1: Dark blur base */}
                <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
                {/* Layer 2: Sky-blue top glow */}
                <LinearGradient
                  colors={['rgba(56, 189, 248, 0.22)', 'rgba(13, 27, 42, 0)', 'rgba(13, 27, 42, 0)']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                  pointerEvents="none"
                />
                {/* Layer 3: Diagonal specular sheen */}
                <LinearGradient
                  colors={['rgba(142, 213, 255, 0.10)', 'rgba(142, 213, 255, 0)', 'rgba(142, 213, 255, 0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                  pointerEvents="none"
                />
                {/* Content */}
                <View style={styles.statCardContent}>
                  <Text style={[styles.statValue, { color: stat.text }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Asymmetric Content Section */}
        <View className="px-5 mb-12 gap-6">
          <GlassCard className="p-1 border border-white/10 overflow-hidden" intensity="low">
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlbOkJML0ZHtBAsgIlDc0SgNZ8cxtHU65dA9vlXDDZN8jzqD6Oj6XmBgPiyvlvoarYwofQc1pOxnFapMfFX0-iwW77dRygkOclMsNajUowpnvBW1-vx1DdWk8m_wk3JNlBoaL_DmEZGYHiZON_xWUdpRoe6FjZlmcH1Zz1tRKG-6yPSOGdM59QCtr10hYXidoNTdd5B3GIC0Mktwph8QwC7WhxmJfxCKHDDFkQtJj_WgXhHrQWU0AJu_lMbXDxmHWC0sUnXQwSStRM' }}
              className="w-full h-48 rounded-[20px]"
              resizeMode="cover"
            />
          </GlassCard>

          <View className="gap-4">
            <Text className="text-white text-2xl font-bold font-display-lg leading-snug">
              The Visionary{'\n'}
              <Text className="text-[#8ed5ff]">Learning Paradigm</Text>
            </Text>

            <Text className="text-white/70 text-sm leading-relaxed font-body-md">
              At EduVision, we go beyond textbook learning. Our "Visionary Core" curriculum integrates STEAM, emotional intelligence, and global citizenship into every lesson. We prepare students for careers that don't yet exist.
            </Text>

            <View className="gap-3 mt-2">
              {bulletPoints.map((bp, idx) => (
                <View key={idx} className="flex-row items-center gap-3">
                  <CheckCircle size={18} color="#8ed5ff" />
                  <Text className="text-white/80 text-xs font-medium font-body-sm">{bp}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Extra Bottom Margin for Floating Footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Footer to Login */}
      <BlurView intensity={40} tint="dark" style={styles.footer}>
        <Pressable 
          onPress={() => navigation.navigate('EnquiryForm')}
          className="flex-row items-center gap-3 px-6 py-3 rounded-full bg-white/10 active:bg-white/20 border border-[#8ed5ff]/30 shadow-[0_0_20px_rgba(142,213,255,0.2)]"
        >
          <Text className="text-xs font-bold text-[#8ed5ff] font-label-lg">
            Register to unlock attendance, marks & full features
          </Text>
          <ArrowRight size={16} color="#8ed5ff" />
        </Pressable>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101415',
  },
  glowTopLeft: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    filter: Platform.OS === 'ios' ? 'blur(80px)' : undefined,
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    filter: Platform.OS === 'ios' ? 'blur(80px)' : undefined,
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
    backgroundColor: '#1a2a3a',
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : 85,
  },
  facultyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 213, 255, 0.35)',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(142, 213, 255, 0.07)',
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  statsStrip: {
    paddingHorizontal: 20,
    marginBottom: 32,
    // Extra padding so glow shadow isn't cut off at edges
    paddingVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  // Card container — same style as dropdown menuContainer
  statGlowWrapper: {
    width: '47%',
    marginBottom: 14,
    borderRadius: 22,
    overflow: 'hidden',               // clips BlurView + gradients to rounded corners
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',   // same as dropdown
    backgroundColor: 'rgba(13, 27, 42, 0.92)', // same dark navy as dropdown
    // iOS shadow — colored glow
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 0, // keep 0 — Android elevation always casts black
  },
  // Transparent content layer that sits above the glass layers
  statCardContent: {
    paddingVertical: 22,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.45)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
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
});

export default GuestDashboard;
