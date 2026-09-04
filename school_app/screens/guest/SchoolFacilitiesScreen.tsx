import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Image, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, FlaskConical, BookOpen, Dumbbell, Bus, UtensilsCrossed, HeartPulse, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../store/useAuthStore';
import { GuestHeader } from '../../components/GuestHeader';
import { useResponsive } from '../../utils/responsive';

export const SchoolFacilitiesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { isSmallPhone, insets, headerPaddingTop } = useResponsive();

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

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      let homeRoute = 'GuestHome';
      if (user) {
        switch (user.role) {
          case 'super_admin':
            homeRoute = 'SuperAdminHome';
            break;
          case 'admin_staff':
            homeRoute = 'AdminStaffHome';
            break;
          case 'teacher':
            homeRoute = 'TeacherHome';
            break;
          case 'parent':
            homeRoute = 'ParentHome';
            break;
          case 'guest':
            homeRoute = 'GuestHome';
            break;
        }
      }
      navigation.navigate(homeRoute);
    }
  };

  const facilities = [
    {
      icon: FlaskConical,
      title: 'Labs',
      desc: 'Next-generation research facilities equipped with AI-integrated instrumentation and specialized simulation centers for interdisciplinary discovery.',
      link: 'Explore Labs',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRCdouZ5lDyHLWuxKOiZE_cN_mn6UT6EsQvnGt3ZwJMvUIRqvquiQS6c2IZp4VxCQPx1NZmKHVrUOa59nxnhvuta3ly-R1HMVtW8yRfcwsbz-gx9n2qmUBPz8ncNgvdIvnb4fbfH6iKXtk0LoqLw8Pkqt2C5kLvsJ1C6SsdRN9-U7t7VdwzpA0xyT3OJvKeTxSQ3c_GQQVDzxY7O21E2mZeXDI5J0lrtqOrp4XelAUjCeTh5CI9h4UGsd_QnLBzi8fbqWxMcFrJkr5'
    },
    {
      icon: BookOpen,
      title: 'Library',
      desc: 'A vast hybrid repository of digital and physical knowledge, featuring quiet zones, collaborative pods, and 24/7 access to global research databases.',
      link: 'Virtual Tour',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0pZ-_LFlJudKoqBz3KHrBi6gAJy0WWcck-2BjW3PQdiXhSZXQLB27nHUPyf0gzheHH0tnuLV6MQOkGea28-rSEHbmF_wgnmX_h3wUnINCcoMpUjYfHcd0cnKP6wy4yqT98DSRPZdC3LWIsMQXCTW-DdPwCO-FhR19IUfQi_MIyKoNVOq0FuC0eoCC2IdhJZzeHtMwIImWQCBygQi2gcSn_0djMMy35JHStwFV7IX9RAlMDBpZ6DEFrv8SaMCXXzd6YpjZIZTX0zKE'
    },
    {
      icon: Dumbbell,
      title: 'Sports Complex',
      desc: 'Olympic-grade athletic centers including heated pools, professional tracks, and high-performance gyms to foster holistic physical well-being.',
      link: 'View Amenities',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9pR1WHhjXrkZz7FeEePWGlX4fls42RDxqj9YUzAiULbjvvYlh5s2ul--CYzZevE_Xq3O6OLoBxofzFp8EhEzAZREdSoO6crCVonmmFvWFl_pNnMKXyOs-iAgNXJvkwTUXsTGm9kMWR3uQv8zp-W1ag2bjyaa4ofC1_2kx74NKYKL9QFHzHdLAYsSEOMUXddGsFN6c5xr4NNOHmnXzNQ9dQLPXiknqkRvnCXE5LFA580K7l3UAOhq2Iw12sZ7jR-bnLJhu8jp_Zbd0'
    },
    {
      icon: Bus,
      title: 'Transport',
      desc: 'A seamless, eco-friendly transit network connecting the campus to major city nodes with real-time tracking and zero-emission electric shuttles.',
      link: 'Check Routes',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDC9n-mReQIeKWvNSyd8bb1kTIuEWvIuSB--s1ZgbFjDZB9eaz6BpMHIQ5VxdlwI-DZNBVBxgP3AN8tfPj3UWjn7QOlVAXyWwiBoGk4-Nr5cI1jDIzO0B2Hpx5J9PIHdK-y9_tQH33Cj8H3Yy9WxGyzacB1lAMP_v4_yiq9_tKDnpQYBiVFtTrbAu_SVkluIDyirHuVwx8VXacWIRwME5pmBl6GWeLOlMljdpjWLatjsBhB_gLROK7kSY0FepoPSZoUvyPqqNM-q3le'
    },
    {
      icon: UtensilsCrossed,
      title: 'Canteen',
      desc: 'A gourmet dining experience offering diverse, nutritionally-balanced cuisines in a vibrant, architecturally stunning social hub.',
      link: 'Menu Highlights',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRaKr8MZmE5byKZqdVZ-CFNxKpIpiw2I-lFan76XbWtLE6X41JkKS87Z24T1yI4fH99RglECg9babwd9JsT0AHF9T_YGANlH8sSU37c4xT81wCdjorHO41GHAEh4B1_sTcaOSyRyRySeYB1vggGvZY9tm8DdxhkcT5onyYEuRSQQxuB2NexAPlfRkEWRam4jyjlsm1zpNSSgSj4b9hDlsIcvlo3YtfcIaayRuuOjn9qxZwQucV71rLXofN6f5n0EBj4QLMnVXwp302'
    },
    {
      icon: HeartPulse,
      title: 'Medical Room',
      desc: 'Fully-equipped 24/7 health center staffed by professional medical practitioners, providing emergency care and mental wellness support.',
      link: 'Health Services',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAn9Uz76sg9TmgHzzr-L8tCZXFMIWf5WFApZU_a8c8ncaQ9zjpqnOkY7ZiNmaEVFA-0MYRzcfV-JVNsXhrwajCJWHLFxR3R0lxHVJaVO5kqKG2X62wBtI8ANn9ElKvg66N9NYme21h4AoiLl-PJWe4GO6-Jimyo9ELNO8ytk51R25eOYQMWD1F0OE_Rc0VtbMwvXdON-BnBU0svPVNyJzykcGuYzB07p6_Vl4E3bNKQnPqhfwlq6wA_SNSUlaXTmOGWtiinAG6s1U91'
    }
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a2a3a', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <GuestHeader
        title="Facilities"
        showBack
        rightAction={
          <Pressable
            onPress={() => navigation.navigate('EnquiryForm')}
            className="bg-[#38bdf8] px-4 py-2 md:px-5 md:py-2.5 rounded-full active:scale-95 shadow-[0_0_16px_rgba(56,189,248,0.4)]"
          >
            <Text className="text-[#004965] font-semibold text-xs">Apply Now</Text>
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
        {/* Section Header */}
        <View className="px-5 mb-8">
          <Text className="text-[#8ed5ff] text-[10px] font-bold uppercase tracking-[3px] mb-2">
            WORLD-CLASS INFRASTRUCTURE
          </Text>
          <Text className="text-white text-3xl font-extrabold leading-tight mb-3">
            Our Facilities
          </Text>
          <Text className="text-white/60 text-sm leading-relaxed">
            Experience an environment designed for innovation, discovery, and personal growth. Our campus features state-of-the-art facilities that empower students to excel in every field.
          </Text>
        </View>

        {/* Facilities List */}
        <View className="px-5 gap-8 mb-8">
          {facilities.map((fac, idx) => {
            const IconComponent = fac.icon;
            return (
              <View key={idx} style={styles.facilityCard}>
                {/* Image */}
                <View style={styles.facilityImageWrap}>
                  <Image
                    source={{ uri: fac.img }}
                    style={styles.facilityImage}
                    resizeMode="cover"
                  />
                </View>

                {/* Content */}
                <View className="px-1 pt-5 pb-2 gap-3">
                  <View className="flex-row items-center gap-3">
                    <View style={styles.iconCircle}>
                      <IconComponent size={18} color="#8ed5ff" />
                    </View>
                    <Text className="text-white font-bold text-base">{fac.title}</Text>
                  </View>

                  <Text className="text-white/60 text-xs leading-relaxed">
                    {fac.desc}
                  </Text>

                  <Pressable 
                    onPress={() => showCustomAlert('Virtual Tour', `Initiating the 360-degree immersive virtual tour for the ${fac.title}.`)}
                    className="flex-row items-center gap-2 mt-1 active:opacity-70"
                  >
                    <Text className="text-[#8ed5ff] text-xs font-semibold">{fac.link}</Text>
                    <ArrowRight size={14} color="#8ed5ff" />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        {/* Bottom spacer for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

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
    paddingTop: 16,
    paddingBottom: 40,
  },
  facilityCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  facilityImageWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  facilityImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(142, 213, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(142, 213, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
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

export default SchoolFacilitiesScreen;
