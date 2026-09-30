import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Linking,
  Alert,
  Modal,
  BackHandler,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  Search,
  Phone,
  MessageCircle,
  User,
  Users,
  CheckCircle2,
  ChevronDown,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Send,
  ExternalLink,
  Info,
} from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';
import { useAuthStore } from '../../store/useAuthStore';
import { ALL_BATCHES, STUDENTS_BY_CLASS, StudentItem } from '../../store/studentAttendanceStore';

export interface StudentContactItem {
  id: string;
  name: string;
  roll: string;
  className: string;
  init: string;
  parentName: string;
  relationship: 'Father' | 'Mother' | 'Guardian';
  phone: string;
  altPhone?: string;
}

// Sample parent contacts generator based on student roster
const PARENT_SURNAMES: Record<string, string> = {
  'HV': 'H. Ramesh Kumar',
  'MS': 'M. Suresh Goud',
  'SM': 'S. Anitha Devi',
  'AR': 'A. Ruthwik Reddy',
  'CS': 'C. Venkataiah',
  'GS': 'G. Saidulu',
  'TS': 'T. Shashi Kumar',
  'VA': 'V. Narayana',
  'KY': 'K. Yugendhar Rao',
  'TN': 'T. Narsimha',
  'BS': 'B. Shivaraj',
  'BK': 'B. Srinivas',
  'BG': 'B. Ganeshwar',
  'CJ': 'C. Jagan Mohan',
  'CG': 'C. Goutham Reddy',
  'GA': 'G. Akshith Rao',
  'KV': 'K. Venkatesham',
  'KA': 'K. Avinash Goud',
  'KL': 'K. Laxman Rao',
  'KS': 'K. Sai Charan',
  'MM': 'Md. Feroz Khan',
  'MN': 'M. Neshitha Rao',
  'SI': 'S. Ishwar Goud',
  'AD': 'A. Divya Nayak',
  'SS': 'S. Ramana Murthy',
  'VT': 'V. Thirupathi',
  'DV': 'D. Venkatesh',
  'VS': 'V. Sangram Singh',
  'RV': 'R. Venkateshwarlu',
  'LG': 'L. Gopal Reddy',
  'SR': 'S. Rajeshwar',
  'NK': 'N. Naveen Kumar',
  'VM': 'V. Mohan Rao',
  'PA': 'P. Anand Rao',
  'AM': 'Md. Altaf Hussain',
  'NY': 'N. Yadagiri Yadav',
};

const generateContactsForClass = (className: string): StudentContactItem[] => {
  const students = STUDENTS_BY_CLASS[className] || STUDENTS_BY_CLASS['Class 4B'] || [];
  
  return students.map((s, idx) => {
    const parentName = PARENT_SURNAMES[s.init] || `${s.name.split(' ')[0]} Ramulu (Father)`;
    // Deterministic realistic Indian mobile numbers
    const basePhoneNum = 9848000000 + (idx * 317 + 10423) % 999999;
    const phone = `+91 ${String(basePhoneNum).slice(0, 5)} ${String(basePhoneNum).slice(5)}`;
    
    return {
      id: s.id,
      name: s.name,
      roll: s.roll,
      className: s.className || className,
      init: s.init,
      parentName,
      relationship: idx % 4 === 0 ? 'Mother' : 'Father',
      phone,
    };
  });
};

export const TeacherCommunicationScreen: React.FC<any> = () => {
  const navigation = useNavigation<any>();
  const { headerPaddingTop, scrollBottomPadding } = useResponsive();
  const { user } = useAuthStore();

  // Find all batches where this teacher is assigned as Class Teacher
  const teacherName = user?.name || 'Sheeren Sultana';

  const assignedBatches = useMemo(() => {
    const userClasses: string[] = [];
    if ((user as any)?.classTeacherOf) {
      userClasses.push(String((user as any).classTeacherOf).replace('Grade ', 'Class '));
    }
    if (Array.isArray((user as any)?.assignedClasses)) {
      (user as any).assignedClasses.forEach((c: string) =>
        userClasses.push(String(c).replace('Grade ', 'Class '))
      );
    }

    const matched = ALL_BATCHES.filter(
      (b) =>
        (b.classTeacherName && b.classTeacherName.toLowerCase() === teacherName.toLowerCase()) ||
        (b.classTeacherId && String(b.classTeacherId) === String(user?.id)) ||
        userClasses.includes(b.name) ||
        userClasses.includes(b.id)
    );

    if (matched.length > 0) {
      return matched;
    }

    return [ALL_BATCHES[0]];
  }, [teacherName, user]);

  const hasMultipleAssignedClasses = assignedBatches.length > 1;

  const [selectedClass, setSelectedClass] = useState<string>(assignedBatches[0]?.name || 'Class 4B');
  const [searchQuery, setSearchQuery] = useState('');
  const [showClassPickerModal, setShowClassPickerModal] = useState(false);
  const [selectedStudentForNotice, setSelectedStudentForNotice] = useState<StudentContactItem | null>(null);
  const [customNoticeText, setCustomNoticeText] = useState('');

  const handleBack = useCallback(() => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Dashboard');
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showClassPickerModal) {
          setShowClassPickerModal(false);
          return true;
        }
        if (selectedStudentForNotice) {
          setSelectedStudentForNotice(null);
          return true;
        }
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [showClassPickerModal, selectedStudentForNotice, handleBack])
  );

  const studentContacts = useMemo(() => {
    return generateContactsForClass(selectedClass);
  }, [selectedClass]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return studentContacts;

    return studentContacts.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.roll.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q) ||
        s.phone.replace(/\s+/g, '').includes(q)
    );
  }, [studentContacts, searchQuery]);

  // ACTION 1: Phone Call Redirect
  const handleCallParent = async (student: StudentContactItem) => {
    const cleanPhone = student.phone.replace(/[^\d+]/g, '');
    const url = `tel:${cleanPhone}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Phone Dialer',
          `Contact number for ${student.name}'s parent:\n${student.phone}`,
          [
            { text: 'Copy Number', onPress: () => {} },
            { text: 'OK' }
          ]
        );
      }
    } catch (err) {
      Alert.alert('Call Error', `Unable to open phone app for ${student.phone}`);
    }
  };

  // ACTION 2: WhatsApp Chat Redirect
  const handleWhatsAppParent = async (student: StudentContactItem) => {
    let cleanNumber = student.phone.replace(/[^\d]/g, '');
    if (!cleanNumber.startsWith('91') && cleanNumber.length === 10) {
      cleanNumber = `91${cleanNumber}`;
    }

    const messageText = `Namaste ${student.parentName},\n\nThis is from Krishnaveni Talent School regarding your ward *${student.name}* (${student.className}, Roll: ${student.roll}).\n\nClass Teacher: ${teacherName}\n\n`;
    const encodedMessage = encodeURIComponent(messageText);

    const whatsappNativeUrl = `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;
    const whatsappWebUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    try {
      const canOpenNative = await Linking.canOpenURL(whatsappNativeUrl);
      if (canOpenNative) {
        await Linking.openURL(whatsappNativeUrl);
      } else {
        await Linking.openURL(whatsappWebUrl);
      }
    } catch (err) {
      try {
        await Linking.openURL(whatsappWebUrl);
      } catch (_) {
        Alert.alert(
          'WhatsApp App',
          `Could not open WhatsApp directly. Please ensure WhatsApp is installed on this device.\n\nTarget number: ${student.phone}`
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#22143d', '#150d26', '#0b0912', '#08070d']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* TOP HEADER */}
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={20} color="#ddb7ff" />
            </Pressable>

            <View style={styles.headerTitleGroup}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitleText}>Parent Messages</Text>
                <View style={styles.assignedBadge}>
                  <Text style={styles.assignedBadgeText}>Class Teacher</Text>
                </View>
              </View>
              <Text style={styles.headerSubtitleText}>
                Direct Student & Parent Communication Hub
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding + 40 }]}
      >
        {/* BANNER CARD */}
        <LinearGradient
          colors={['rgba(221, 183, 255, 0.18)', 'rgba(147, 51, 234, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroLeft}>
            <Text style={styles.heroSubtitle}>ACADEMIC SESSION 2026-27</Text>
            <Text style={styles.heroTitle}>{selectedClass} Roster</Text>
            <Text style={styles.heroDesc}>
              Tap <Text style={{ color: '#38bdf8', fontWeight: '800' }}>Call</Text> for instant voice dial or <Text style={{ color: '#4ade80', fontWeight: '800' }}>WhatsApp</Text> for direct 1-on-1 parent chat.
            </Text>
          </View>

          {hasMultipleAssignedClasses ? (
            <Pressable
              onPress={() => setShowClassPickerModal(true)}
              style={styles.classSwitchBtn}
            >
              <Text style={styles.classSwitchBtnText}>{selectedClass}</Text>
              <ChevronDown size={14} color="#ddb7ff" />
            </Pressable>
          ) : (
            <View style={styles.classStaticBadge}>
              <Text style={styles.classStaticBadgeText}>{selectedClass}</Text>
            </View>
          )}
        </LinearGradient>

        {/* SEARCH & FILTER BAR */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBox}>
            <Search size={18} color="rgba(255, 255, 255, 0.4)" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by student, parent, or roll no..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color="rgba(255, 255, 255, 0.6)" />
              </Pressable>
            )}
          </View>
        </View>

        {/* SECTION HEADER & COUNTER */}
        <View style={styles.sectionHeaderRow}>
          <View className="flex-row items-center">
            <Users size={16} color="#ddb7ff" style={{ marginRight: 6 }} />
            <Text style={styles.sectionHeaderText}>Student Directory</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredStudents.length} Students</Text>
          </View>
        </View>

        {/* STUDENT CONTACT LIST */}
        <View style={styles.studentListContainer}>
          {filteredStudents.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <User size={32} color="rgba(255, 255, 255, 0.2)" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyStateTitle}>No Students Found</Text>
              <Text style={styles.emptyStateSub}>
                Try adjusting your search query or select a different class.
              </Text>
            </View>
          ) : (
            filteredStudents.map((student, idx) => (
              <View
                key={student.id}
                style={[
                  styles.studentCard,
                  idx === filteredStudents.length - 1 && { marginBottom: 0 }
                ]}
              >
                {/* Left: Avatar & Info */}
                <View style={styles.studentCardLeft}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{student.init}</Text>
                  </View>

                  <View style={styles.studentInfoGroup}>
                    <Text style={styles.studentNameText} numberOfLines={1}>
                      {student.name}
                    </Text>

                    <View style={styles.rollBadgeRow}>
                      <Text style={styles.rollBadgeText}>Roll: {student.roll}</Text>
                      <Text style={styles.dotSeparator}>•</Text>
                      <Text style={styles.classTagText}>{student.className}</Text>
                    </View>

                    {/* Parent Name & Phone */}
                    <View style={styles.parentRow}>
                      <User size={12} color="#ddb7ff" style={{ marginRight: 4 }} />
                      <Text style={styles.parentNameText} numberOfLines={1}>
                        {student.parentName}
                      </Text>
                    </View>

                    <Text style={styles.phoneText}>
                      {student.phone}
                    </Text>
                  </View>
                </View>

                {/* Right: Quick Call & WhatsApp Action Buttons */}
                <View style={styles.actionButtonGroup}>
                  {/* Phone Call Button */}
                  <Pressable
                    onPress={() => handleCallParent(student)}
                    style={styles.callActionButton}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <LinearGradient
                      colors={['#0284c7', '#0369a1']}
                      style={styles.actionGradientCircle}
                    >
                      <Phone size={16} color="#ffffff" />
                    </LinearGradient>
                    <Text style={styles.callButtonLabel}>Call</Text>
                  </Pressable>

                  {/* WhatsApp Direct Chat Button */}
                  <Pressable
                    onPress={() => handleWhatsAppParent(student)}
                    style={styles.whatsAppActionButton}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <LinearGradient
                      colors={['#22c55e', '#16a34a']}
                      style={styles.actionGradientCircle}
                    >
                      <MessageCircle size={16} color="#ffffff" />
                    </LinearGradient>
                    <Text style={styles.whatsAppButtonLabel}>WhatsApp</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ========================================================================= */}
      {/* CLASS SELECTOR MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={showClassPickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClassPickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowClassPickerModal(false)} />
          <View style={styles.pickerModalBox}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Class / Batch</Text>
              <Pressable onPress={() => setShowClassPickerModal(false)}>
                <X size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {assignedBatches.map((b) => {
                const isSelected = selectedClass === b.name;

                return (
                  <Pressable
                    key={b.id}
                    onPress={() => {
                      setSelectedClass(b.name);
                      setShowClassPickerModal(false);
                    }}
                    style={[
                      styles.pickerOptionItem,
                      isSelected && styles.pickerOptionItemActive,
                    ]}
                  >
                    <View>
                      <Text style={[styles.pickerOptionText, isSelected && styles.pickerOptionTextActive]}>
                        {b.name}
                      </Text>
                      <Text style={styles.assignedBadgeSub}>★ Assigned Class Teacher</Text>
                    </View>
                    {isSelected && <Check size={18} color="#ddb7ff" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08070d',
  },
  headerContainer: {
    zIndex: 50,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  assignedBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  assignedBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  headerSubtitleText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroBanner: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
    marginRight: 12,
  },
  heroSubtitle: {
    color: '#ddb7ff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
    marginBottom: 4,
  },
  heroDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },
  classSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181524',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 4,
  },
  classSwitchBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  classStaticBadge: {
    backgroundColor: 'rgba(221, 183, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  classStaticBadgeText: {
    color: '#ddb7ff',
    fontSize: 12,
    fontWeight: '900',
  },
  searchBarContainer: {
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181524',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionHeaderText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    fontWeight: '700',
  },
  studentListContainer: {
    gap: 10,
  },
  studentCard: {
    backgroundColor: '#181524',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.16)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  studentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(221, 183, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(221, 183, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ddb7ff',
    fontSize: 14,
    fontWeight: '900',
  },
  studentInfoGroup: {
    flex: 1,
  },
  studentNameText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  rollBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  rollBadgeText: {
    color: '#ddb7ff',
    fontSize: 10.5,
    fontWeight: '700',
  },
  dotSeparator: {
    color: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
    fontSize: 10,
  },
  classTagText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10.5,
    fontWeight: '600',
  },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  parentNameText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11.5,
    fontWeight: '600',
  },
  phoneText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 2,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  callActionButton: {
    alignItems: 'center',
  },
  whatsAppActionButton: {
    alignItems: 'center',
  },
  actionGradientCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  callButtonLabel: {
    color: '#38bdf8',
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: 3,
  },
  whatsAppButtonLabel: {
    color: '#4ade80',
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: 3,
  },
  emptyStateBox: {
    alignItems: 'center',
    paddingVertical: 36,
    backgroundColor: '#181524',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyStateTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyStateSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    position: 'absolute',
    inset: 0,
  },
  pickerModalBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#181524',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
    padding: 16,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  pickerModalTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  pickerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerOptionItemActive: {
    backgroundColor: 'rgba(221, 183, 255, 0.12)',
  },
  pickerOptionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  pickerOptionTextActive: {
    color: '#ddb7ff',
    fontWeight: '900',
  },
  assignedBadgeSub: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});

export default TeacherCommunicationScreen;
