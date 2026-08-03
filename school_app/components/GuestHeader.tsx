import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { School, Settings, ChevronLeft, Home, Info, Building2, GraduationCap, Award, Banknote, FileText, LogOut, X } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';

interface GuestHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export const GuestHeader: React.FC<GuestHeaderProps> = ({ title, showBack = false, rightAction }) => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const logout = useAuthStore((state) => state.logout);
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const handleNavigate = (screenName: string) => {
    setMenuVisible(false);
    if (route.name === screenName) return;
    navigation.navigate(screenName);
  };

  const menuItems = [
    { label: 'Dashboard',          icon: Home,         routeName: 'GuestHome' },
    { label: 'Admissions Info',    icon: Info,         routeName: 'AdmissionsInfo' },
    { label: 'School Facilities',  icon: Building2,    routeName: 'SchoolFacilities' },
    { label: 'Faculty Showcase',   icon: GraduationCap,routeName: 'FacultyShowcase' },
    { label: 'Achievements Gallery',icon: Award,       routeName: 'AchievementsGallery' },
    { label: 'Fee Structure',      icon: Banknote,     routeName: 'FeeStructure' },
    { label: 'Admission Enquiry',  icon: FileText,     routeName: 'EnquiryForm' },
  ];

  return (
    <>
      {/* Top App Bar */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 6) }]}>
        <View style={styles.headerLeft}>
          {showBack && (
            <Pressable
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('GuestHome');
                }
              }}
              style={styles.backButton}
            >
              <ChevronLeft size={24} color="#8ed5ff" />
            </Pressable>
          )}
          <School size={26} color="#8ed5ff" />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          {rightAction}
          <Pressable
            onPress={() => setMenuVisible(true)}
            style={styles.settingsButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Settings size={20} color="#8ed5ff" />
          </Pressable>
        </View>
      </View>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMenuVisible(false)}
      >
        {/* Backdrop */}
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          {/* Menu panel — stop propagation so taps inside don't close modal */}
          <Pressable
            style={[styles.menuContainer, { top: insets.top + 60 }]}
            onPress={() => {}}
          >
            {/* Layer 1: Dark blur base matching guest screen tone */}
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />

            {/* Layer 2: Sky-blue top glow — matches guest header/stat card accents */}
            <LinearGradient
              colors={['rgba(56, 189, 248, 0.18)', 'rgba(13, 27, 42, 0)', 'rgba(13, 27, 42, 0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />

            {/* Layer 3: Subtle diagonal specular sheen */}
            <LinearGradient
              colors={['rgba(142, 213, 255, 0.07)', 'rgba(142, 213, 255, 0)', 'rgba(142, 213, 255, 0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />

            {/* Content on top of layers */}
            <View style={styles.menuContent}>
              {/* Menu Header */}
              <View style={styles.menuHeader}>
                <Text style={styles.menuHeaderText}>Quick Menu</Text>
                <Pressable
                  onPress={() => setMenuVisible(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.closeButton}
                >
                  <X size={14} color="rgba(255, 255, 255, 0.5)" />
                </Pressable>
              </View>

              {/* Nav Options */}
              <View style={styles.menuItemsContainer}>
                {menuItems.map((item, index) => {
                  const IconComp = item.icon;
                  const isCurrent = route.name === item.routeName;
                  return (
                    <Pressable
                      key={index}
                      onPress={() => handleNavigate(item.routeName)}
                      style={[
                        styles.menuItem,
                        isCurrent && styles.menuItemActive,
                      ]}
                      android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
                    >
                      <IconComp
                        size={16}
                        color={isCurrent ? '#8ed5ff' : 'rgba(255, 255, 255, 0.65)'}
                      />
                      <Text style={[styles.menuItemText, isCurrent && styles.menuItemTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Exit Guest Portal */}
              <Pressable
                onPress={() => {
                  setMenuVisible(false);
                  logout();
                }}
                style={styles.logoutItem}
                android_ripple={{ color: 'rgba(239,68,68,0.15)' }}
              >
                <LogOut size={16} color="#ef4444" />
                <Text style={styles.logoutText}>Exit Guest Portal</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e0e3e5',
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  menuContainer: {
    position: 'absolute',
    right: 16,
    width: 235,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    // Dark navy matching guest header + sky-blue accent border
    borderColor: 'rgba(56, 189, 248, 0.28)',
    // Same dark navy as guest header (#1a2a3a) with slight transparency
    backgroundColor: 'rgba(13, 27, 42, 0.92)',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  menuContent: {
    paddingBottom: 4,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  menuHeaderText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  closeButton: {
    padding: 4,
  },
  menuItemsContainer: {
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  menuItemActive: {
    backgroundColor: 'rgba(142, 213, 255, 0.15)',
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 12,
  },
  menuItemTextActive: {
    color: '#8ed5ff',
    fontWeight: '700',
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    marginTop: 4,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
    marginLeft: 12,
  },
});

export default GuestHeader;

