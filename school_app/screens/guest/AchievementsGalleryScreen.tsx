import React, { useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Image, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Award, Newspaper, ArrowRight, ChevronRight, Gem, ChevronLeft, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../store/useAuthStore';
import { GuestHeader } from '../../components/GuestHeader';
import { GuestScreenNavigationProp } from '../../navigation/types';
import { useResponsive } from '../../utils/responsive';

// Module-level static datasets to avoid allocation on re-render cycles
const TOPPERS = [
  {
    name: 'Elena Rodriguez',
    stream: 'Class of 2024 • Science Stream',
    score: '99.2%',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaJRRUcA28cxQosr7uKPRNB3IhTl-dlnQ6_DpZiexIAAc_0P0JmsnYSVMA8aiBFT8rC3nCuwQFtb2AcEQIuToDiq0-8Tlf6EZ_YKmTLVOP-oHoq4XYuqmb6cAMMmd8Hy9zPmavw_taHz-yYOs4ZfsBtYjYgzw0qdqYpG0MR-3DQdXgwK5UkbPyy1aLEjek-ifsBSND4XdlAydQ9ttz3HaiPtfqE_qqqbyyFo-lry8dc5yJqqEs0_Cagii9CQQ1ctTgA30f9iFCx0kV'
  },
  {
    name: 'Marcus Chen',
    stream: 'Class of 2024 • Humanities',
    score: '98.8%',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3J6LDmm46WVp_sAC5EGTsSAh9PchG1ki2dwCeQtqZ7lpQBury9NJHl96lY3FQbIRz0E3zz09MRlxOvEYRIf6qSSZ_BLSE3kq00LJJRpfYuQNZMqYPAoe6fDXVAHEjN76N-6bX_LxY0BANHHc3MzUONiJVkMoc0IWzSrHLQk8kv4bWJXS_Ltnh35hHjQu3boAWdw1oqhoKO_fv8FVr7E5BvGpAHpsdcHF89lo5SDiAyeBV4TEU-yLhF6XaX_OyzIuYPSy8PZDt5g9W'
  },
  {
    name: 'Amara Okafor',
    stream: 'Class of 2024 • Commerce Stream',
    score: '98.5%',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBby4ECDQvtbfjhIoFNAlrPOAuEb-_GjNSgR44IrHBvJigak7RPXOsVP6jJzlJ6gpV3g9Q7f5mI1gOGd2Dj4txEfMm6hV16lFJgnZEPqt7EKxZt9dDvx5CPj_5_7SvhtbWgt70mvXjGLjEz4ke7-4Rqy_2Cq2ABqC5LeC8D5mpO6zq_cxCea2GsagNzQhuN_3xpciyBAuh5J_63ERT20B21mx_aslDfjNMCx0RuNdy9A55d40tkT_6Dfdk61Kp51q9hZEvmJr8Bz_6D'
  }
];

const NEWS_LIST = [
  { source: 'Financial Times • Oct 2024', headline: 'The Future of Hybrid Learning: EduVision leads the way.' },
  { source: 'National Geographic • Sep 2024', headline: "Sustainable Campuses: EduVision's Zero-Waste Success." },
  { source: 'Tech Today • Aug 2024', headline: 'AI in the Classroom: How Visionaries are born.' }
];

const GALLERY_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA9k2qrRKn6EjnwySdK8mvWGIpe-XMCT6PjXLgtiDE5O-zAs0M728KjEs2lEYzwC_UZJsD8w8Zzwmv_XflmUM8_AEnEGLAU4ferUD-PhSHAKJrd4_pJmBpBbkPgAtPLtwCyeFJJVMwOVLT0h2ecFRef8MHSXHhVUwFTucejkwH3ax5o4O36r1cvDPie5aQEMrhgPBFBl5H8p8uI8Ymb-rszmCJuKbQvR_KHb4oTXqQNDjh6RNFwtQ21EZndWWRkXCz79yeZzQ6KHK7s',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBlbOkJML0ZHtBAsgIlDc0SgNZ8cxtHU65dA9vlXDDZN8jzqD6Oj6XmBgPiyvlvoarYwofQc1pOxnFapMfFX0-iwW77dRygkOclMsNajUowpnvBW1-vx1DdWk8m_wk3JNlBoaL_DmEZGYHiZON_xWUdpRoe6FjZlmcH1Zz1tRKG-6yPSOGdM59QCtr10hYXidoNTdd5B3GIC0Mktwph8QwC7WhxmJfxCKHDDFkQtJj_WgXhHrQWU0AJu_lMbXDxmHWC0sUnXQwSStRM',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB9pR1WHhjXrkZz7FeEePWGlX4fls42RDxqj9YUzAiULbjvvYlh5s2ul--CYzZevE_Xq3O6OLoBxofzFp8EhEzAZREdSoO6crCVonmmFvWFl_pNnMKXyOs-iAgNXJvkwTUXsTGm9kMWR3uQv8zp-W1ag2bjyaa4ofC1_2kx74NKYKL9QFHzHdLAYsSEOMUXddGsFN6c5xr4NNOHmnXzNQ9dQLPXiknqkRvnCXE5LFA580K7l3UAOhq2Iw12sZ7jR-bnLJhu8jp_Zbd0',
];

export const AchievementsGalleryScreen: React.FC = () => {
  const navigation = useNavigation<GuestScreenNavigationProp<'AchievementsGallery'>>();
  const logout = useAuthStore((state) => state.logout);
  const galleryRef = useRef<ScrollView>(null);
  const { width, isSmallPhone, insets, headerPaddingTop } = useResponsive();

  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showCustomAlert = useCallback((title: string, message: string) => {
    setCustomAlert({ visible: true, title, message });
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a2a3a', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <GuestHeader 
        title="Achievements" 
        showBack 
        rightAction={
          <Pressable 
            onPress={() => navigation.navigate('EnquiryForm')}
            className="bg-[#38bdf8] px-4 py-2 md:px-5 md:py-2.5 rounded-full active:scale-95 shadow-[0_0_16px_rgba(56,189,248,0.4)]"
          >
            <Text className="text-[#004965] font-semibold text-xs font-label-lg">Apply Now</Text>
          </Pressable>
        }
      />

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerPaddingTop + 45,
            paddingBottom: insets.bottom + 90,
          }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle Label + Title */}
        <View className="px-5 mb-8 items-center">
          <View className="flex-row items-center gap-2 mb-3">
            <Gem size={14} color="#8ed5ff" />
            <Text className="text-[#8ed5ff] text-[10px] font-bold uppercase tracking-[3px]">
              LEGACY OF EXCELLENCE
            </Text>
          </View>
          <Text className="text-white text-3xl font-extrabold leading-tight mb-3 text-center">
            Honoring Visionary{'\n'}Milestones
          </Text>
          <Text className="text-white/60 text-sm leading-relaxed text-center">
            Celebrate the academic brilliance, athletic triumphs, and global recognition that define the EduVision community.
          </Text>
        </View>

        {/* Innovation Award Card */}
        <View className="px-5 mb-8">
          <View style={styles.awardCard}>
            {/* Trophy Image */}
            <View style={styles.trophyImageWrap}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRCdouZ5lDyHLWuxKOiZE_cN_mn6UT6EsQvnGt3ZwJMvUIRqvquiQS6c2IZp4VxCQPx1NZmKHVrUOa59nxnhvuta3ly-R1HMVtW8yRfcwsbz-gx9n2qmUBPz8ncNgvdIvnb4fbfH6iKXtk0LoqLw8Pkqt2C5kLvsJ1C6SsdRN9-U7t7VdwzpA0xyT3OJvKeTxSQ3c_GQQVDzxY7O21E2mZeXDI5J0lrtqOrp4XelAUjCeTh5CI9h4UGsd_QnLBzi8fbqWxMcFrJkr5' }}
                style={styles.trophyImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(15,23,42,0.7)']}
                style={StyleSheet.absoluteFill}
              />
            </View>

            <View className="px-5 pb-5 gap-3">
              <View className="flex-row items-center gap-3">
                <Award size={20} color="#8ed5ff" />
                <Text className="text-white font-bold text-lg">Innovation in Education 2024</Text>
              </View>
              <Text className="text-white/60 text-xs leading-relaxed">
                Recognized by the World Education Forum for our groundbreaking 'EduVision Connect' digital curriculum and sustainable campus initiatives.
              </Text>
              <View className="flex-row gap-3 mt-1">
                <View style={styles.badge}>
                  <Text className="text-[#8ed5ff] text-[10px] font-bold">Global Ranking #14</Text>
                </View>
                <View style={styles.badge}>
                  <Text className="text-[#8ed5ff] text-[10px] font-bold">Sustainability Gold</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* News Coverage */}
        <View className="px-5 mb-8">
          <View style={styles.newsCard}>
            <View className="flex-row items-center gap-3 mb-4">
              <Newspaper size={20} color="#8ed5ff" />
              <Text className="text-white font-bold text-base">News Coverage</Text>
            </View>
            <View className="gap-4">
              {NEWS_LIST.map((n, idx) => (
                <View key={idx} style={idx < NEWS_LIST.length - 1 ? styles.newsItemBorder : undefined}>
                  <Text className="text-[#8ed5ff] text-[10px] font-bold mb-1">{n.source}</Text>
                  <Text className="text-white/70 text-xs leading-relaxed">{n.headline}</Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => showCustomAlert('Press Room', 'For media inquiries and official statements, please reach out to press@eduvision.edu.')}
              className="flex-row items-center gap-2 mt-4 active:opacity-70"
            >
              <Text className="text-[#8ed5ff] text-xs font-semibold">View Press Room</Text>
              <ArrowRight size={14} color="#8ed5ff" />
            </Pressable>
          </View>
        </View>

        {/* Board Toppers — Large Portrait Cards */}
        <View className="px-5 mb-8 gap-6">
          {TOPPERS.map((t, idx) => (
            <View key={idx} style={styles.topperCard}>
              <Image
                source={{ uri: t.img }}
                style={styles.topperImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(16,20,21,0.5)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
              {/* Score Badge */}
              <View style={styles.scoreBadge}>
                <Text className="text-white font-extrabold text-lg">{t.score}</Text>
              </View>

              {/* Name underneath */}
              <View className="mt-3">
                <Text className="text-white font-bold text-sm">{t.name}</Text>
                <Text className="text-white/50 text-[11px]">{t.stream}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Life at EduVision - Gallery */}
        <View className="mb-8">
          <View className="px-5 mb-4">
            <Text className="text-white font-bold text-lg mb-1">Life at EduVision</Text>
            <View className="flex-row justify-between items-center">
              <Text className="text-white/50 text-xs">A visual journey through our events, symposia, and campus life.</Text>
              <View className="flex-row gap-2 ml-3">
                <Pressable
                  onPress={() => galleryRef.current?.scrollTo({ x: 0, animated: true })}
                  style={styles.galleryNavBtn}
                >
                  <ChevronLeft size={16} color="#8ed5ff" />
                </Pressable>
                <Pressable
                  onPress={() => galleryRef.current?.scrollToEnd({ animated: true })}
                  style={styles.galleryNavBtn}
                >
                  <ChevronRight size={16} color="#8ed5ff" />
                </Pressable>
              </View>
            </View>
          </View>

          <ScrollView
            ref={galleryRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          >
            {GALLERY_IMAGES.map((img, idx) => (
              <View key={idx} style={styles.galleryImageWrap}>
                <Image
                  source={{ uri: img }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Bottom spacer for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Top App Bar */}
      <GuestHeader
        title="Achievements"
        showBack
        rightAction={
          <Pressable
            onPress={() => navigation.navigate('EnquiryForm')}
            className="bg-[#38bdf8] px-5 py-2.5 rounded-full active:scale-95"
          >
            <Text className="text-[#004965] font-semibold text-xs">Enroll Now</Text>
          </Pressable>
        }
      />

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
  awardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  trophyImageWrap: {
    width: '100%',
    height: 200,
    overflow: 'hidden',
  },
  trophyImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
  },
  newsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 12,
  },
  topperCard: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  topperImage: {
    width: '100%',
    height: 280,
    borderRadius: 20,
  },
  scoreBadge: {
    position: 'absolute',
    bottom: 50,
    right: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  galleryNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryImageWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  galleryImage: {
    width: 220,
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

export default AchievementsGalleryScreen;
