import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Image, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GraduationCap, Clock, ArrowRight, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../store/useAuthStore';
import { GuestHeader } from '../../components/GuestHeader';

export const FacultyShowcaseScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const logout = useAuthStore((state) => state.logout);
  const [selectedDept, setSelectedDept] = useState('All Departments');

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

  const depts = ['All Departments', 'Sciences', 'Humanities', 'Engineering', 'Design', 'Business'];

  const faculty = [
    {
      name: 'Dr. Sarah Jenkins',
      role: 'Head of Science',
      degree: 'Ph.D in Astrophysics',
      exp: '15+ Years Experience',
      dept: 'Sciences',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgLMF7kKCQOINwGCptlsid4XVzIJeE9lpseMUas9wyYR6mTEp6twKJKwWKCZi_Xm7VU43G5nvYneTmGBC0GaC2Ku8VW6md1jdhdVPgYTU_zX8oPKK7C9vYKpk2yKAsZDIS_cSKVnrIQoecH0QDfwohseAd7w5zX5-6P2wKzS-DBhwqUpgKv0IxLPR7CNGdPv1iYhSS-b59a1QCCoE1v34DxLtntva3bGY14l-t-0XoV6VlOszMO4kGTrDieo-3bomuvw2FVDhCX1Lr',
      focus: 'Advanced gravitational lensing, dark matter signatures, and stellar evolution models in early galaxies.'
    },
    {
      name: 'Prof. David Chen',
      role: 'Lead Quantitative Researcher',
      degree: 'Ph.D in Applied Mathematics',
      exp: '22+ Years Experience',
      dept: 'Sciences',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmN2Z_SmkrCLQLcas1U2Q9pDL7uTa0sdz6brm3obLPsA3dYdAavs49CBLJ2RVzsJtuc7946QRGKKE9URm_PCu5-r--F74K4nt95u-tYHWtuu5pcePJpizQDwOQ8u-1C7jNs69nzf3T0KU7cV9fXcnbXTmOeKO_nhltSCaYNoah-l7VLyE-f3TMRNLDY5SbmddBotIvMfOKbkJjauouszfnwUa1DJmfdf_TG0_yRYlvBnKkigkuFDStAGqYd3-nBC1A492aQNZsqhzD',
      focus: 'Optimization algorithms, stochastic analysis, mathematical modeling, and quantitative finance frameworks.'
    },
    {
      name: 'Elena Rodriguez',
      role: 'Senior Design Architect',
      degree: 'M.Arch from Harvard GSD',
      exp: '12+ Years Experience',
      dept: 'Design',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCETrkOtbrWqxfoot50KfYxkpbPrgKCHv4EWXsXcnaWw-y188f2kNX37I9b7TnccaW8S0MyqMst9o_PQxsCD5yJoZv_4vtbPooR70CjT1PnpMNjfK7dZY-7ltMJca5j18CawpRLkJDyOu5qNRVAY4yAp7ThvxTNz1QyZAYAU2rgLy-MKntoC-weSNEtINKXqsYvHAa9qx63CNrSqsMNwOGtr-wm-_woLRDTqr-XWy8pjNLL1gpFvlcJpTFwHNfV8Wo0gs8e76dNF0yI',
      focus: 'Sustainable urban planning, low-carbon materials engineering, and modular architectural prototypes.'
    },
    {
      name: 'Dr. Robert Vance',
      role: 'Director of Economics',
      degree: 'Ph.D in Global Economics',
      exp: '18+ Years Experience',
      dept: 'Business',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSxRUcRuHyMela1NpdKa6hFIlpFfs3Q6K02v23mgULo2zJBDqVlMEiK07H_gSN2Cu1jCG4XXmyPScTjOrjkJCvG4k-VU9QfZdUiok2D0-KP4FtwHD15MovOV0odIKFYJ25DMNzKpyyGNYJ99wx5Ar6Y_1c_N9SC0rw2dQQkKsY0IUCkcrDPHB0Y9wZ-GdfLMPjkMxi-4S1qfj2R0LEy4zyEBcVSfcRg8Q5BSAV4riQRQsOSxkDaannFII2HCWkMIiH10l9r1vGl6jA',
      focus: 'International trade barriers, emerging market volatility, monetary policy, and central banking strategies.'
    },
    {
      name: 'Dr. Amelia Thorne',
      role: 'Head of Humanities',
      degree: 'Ph.D in Literature',
      exp: '20+ Years Experience',
      dept: 'Humanities',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBzah9qLyA7Q6eup5IcL9apOALyGP0mQJCcah-Vt-LbrT6EEz7YLmRsmBZ8aHd_oEEMyj8hdrA3f60PzkpbKiXl52N_cJbVet_FlhS1SLet87QZAQsm-JGD52yhs0jvDYpbGMVTqFDLfV6KJPub66WzEupaI964HBTot0v7KzjEdHtHCsxQ55HFwkOxXWfxGhT1vktnS5oCOIBu4LYSkDnQq4yMpT3TiOPGR94ROMfKkLWuLUAS80vg-4-EKmOdvkUXrp1kZ0bURmL',
      focus: 'Comparative literature, narrative structure in post-modern texts, and cross-cultural postcolonial studies.'
    },
    {
      name: 'Marcus Thompson',
      role: 'Lead AI Research',
      degree: 'M.S. in Machine Learning',
      exp: '10+ Years Experience',
      dept: 'Engineering',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZwtN7l0GsJD76fvA-qp-3OD38v9uB3JwKhHg5y-9TJfSoHX0s1cE9TT3Adu7CW-r9q86eOrgaeOJKhi1elrFKQP4q-oQdgk47nvSjAu52-I47opMJPBYX9qSDixPU2QujYAaomMV5XhDdMxQsXNjDcwQHLM0G2-YLjl_l3a19-mudQFhOdzT7IB42gkF2Mnpu8d0LTIPz9s8T4Q_aT4S9tygod893zNe707ydO2oFs_eUZkNaQbbfY_NpkwZjj5ydOnzMOcJH4DXo',
      focus: 'Deep transformer networks, multi-agent reinforcement learning, and real-time autonomous navigation systems.'
    }
  ];

  const filteredFaculty = selectedDept === 'All Departments'
    ? faculty
    : faculty.filter(f => f.dept === selectedDept);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a2a3a', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 mb-6 items-center">
          <Text className="text-white text-3xl font-extrabold leading-tight mb-2 text-center">
            Meet the <Text className="text-[#8ed5ff]">Visionaries</Text>
          </Text>
          <Text className="text-white/60 text-sm leading-relaxed text-center">
            Our world-class faculty members combine academic excellence with deep industry experience to guide the next generation of leaders.
          </Text>
        </View>

        {/* Filter Chips */}
        <View className="mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
            {depts.map((d) => (
              <Pressable
                key={d}
                onPress={() => setSelectedDept(d)}
                className={`px-5 py-2.5 rounded-full mr-3 border ${
                  selectedDept === d
                    ? 'bg-[#38bdf8] border-[#38bdf8]'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <Text className={`text-xs font-semibold ${selectedDept === d ? 'text-[#004965]' : 'text-white/60'}`}>{d}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Faculty Cards - Vertical Centered Layout */}
        <View className="px-5 mb-8 gap-6">
          {filteredFaculty.map((f, idx) => (
            <View key={idx} style={styles.facultyCard}>
              {/* Circular Photo */}
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: f.img }}
                  style={styles.facultyPhoto}
                  resizeMode="cover"
                />
              </View>

              {/* Info */}
              <View className="items-center gap-2 mt-4">
                <Text className="text-white font-bold text-base text-center">{f.name}</Text>
                <Text className="text-[#8ed5ff] text-xs font-semibold text-center">{f.role}</Text>

                <View className="gap-1.5 mt-1">
                  <View className="flex-row items-center gap-2 justify-center">
                    <GraduationCap size={14} color="rgba(255,255,255,0.4)" />
                    <Text className="text-white/50 text-[11px]">{f.degree}</Text>
                  </View>
                  <View className="flex-row items-center gap-2 justify-center">
                    <Clock size={14} color="rgba(255,255,255,0.4)" />
                    <Text className="text-white/50 text-[11px]">{f.exp}</Text>
                  </View>
                </View>

                {/* View Research Button */}
                <Pressable 
                  onPress={() => showCustomAlert('Research Profile', `${f.name}'s current focus:\n\n${f.focus}`)}
                  style={styles.researchButton} 
                  className="active:scale-95 mt-2"
                >
                  <Text className="text-[#8ed5ff] text-xs font-semibold">View Research</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Join Faculty CTA */}
        <View className="px-5 mb-8">
          <View style={styles.joinCard}>
            <Text className="text-white text-2xl font-extrabold leading-tight mb-2">
              Join Our{'\n'}Prestigious{'\n'}<Text className="text-[#8ed5ff]">Faculty</Text>
            </Text>
            <Text className="text-white/60 text-sm leading-relaxed mb-5">
              We are always looking for visionary educators to join our global campus.
            </Text>
            <Pressable 
              onPress={() => showCustomAlert('Apply as Faculty', 'Interested candidates can submit their resume and teaching philosophy statement to careers@eduvision.edu.')}
              style={styles.applyButton} 
              className="active:scale-95"
            >
              <Text className="text-[#004965] font-bold text-sm">Submit Application</Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom spacer for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Top App Bar */}
      <GuestHeader 
        title="Our Faculty" 
        showBack 
        rightAction={
          <Pressable
            onPress={() => logout()}
            className="bg-[#38bdf8] px-5 py-2.5 rounded-full active:scale-95"
          >
            <Text className="text-[#004965] font-semibold text-xs">Portal</Text>
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
  chipsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  facultyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(142, 213, 255, 0.35)',
    overflow: 'hidden',
  },
  facultyPhoto: {
    width: '100%',
    height: '100%',
  },
  researchButton: {
    borderWidth: 1,
    borderColor: 'rgba(142, 213, 255, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(142, 213, 255, 0.05)',
  },
  joinCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 28,
  },
  applyButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    alignSelf: 'flex-start',
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

export default FacultyShowcaseScreen;
