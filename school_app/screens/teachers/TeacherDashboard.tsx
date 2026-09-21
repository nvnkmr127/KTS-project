import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Image,
  Modal,
  BackHandler,
  PanResponder,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Bell,
  Clock,
  MapPin,
  ClipboardCheck,
  ClipboardList,
  Star,
  Upload,
  Megaphone,
  MessageSquare,
  ChevronRight,
  Lock,
  Plus,
  X,
  LogOut,
  GraduationCap,
  FileText,
  CalendarOff,
  User as UserIcon,
} from "lucide-react-native";
import { useResponsive } from "../../utils/responsive";
import { useAuthStore } from "../../store/useAuthStore";

export const TeacherDashboard: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isSmallPhone, headerPaddingTop, scrollBottomPadding } = useResponsive();
  const { user, logout } = useAuthStore();
  const [showSidebarModal, setShowSidebarModal] = useState(false);
  const showSidebarModalRef = useRef(showSidebarModal);
  showSidebarModalRef.current = showSidebarModal;

  // Swipe from left-to-right anywhere on Dashboard to open sidebar drawer
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only trigger when sidebar is closed and swipe is predominantly horizontal left-to-right
        if (showSidebarModalRef.current) return false;
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.25;
        return isHorizontal && gestureState.dx > 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 35 || (gestureState.dx > 15 && gestureState.vx > 0.2)) {
          setShowSidebarModal(true);
        }
      },
    })
  ).current;

  // Swipe from right-to-left on open sidebar drawer to close
  const sidebarSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2;
        return isHorizontal && gestureState.dx < -20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -30 || gestureState.vx < -0.2) {
          setShowSidebarModal(false);
        }
      },
    })
  ).current;

  // Hardware Back Button closes open sidebar modal
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showSidebarModal) {
          setShowSidebarModal(false);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [showSidebarModal])
  );

  const handleSignOut = () => {
    setShowSidebarModal(false);
    logout();
  };

  const displayName = user?.name || "Ms. Priya Reddy";
  const displayEmail = user?.email || "priya.reddy@krishnaveni.edu";
  const displayDesignation = user?.designation || "Senior Mathematics Faculty";
  const userInitials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  
  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View className="absolute inset-0 bg-[#121212]" />

      {/* Header Container with Shadow */}
      <View style={{ zIndex: 50 }}>
        <BlurView
          intensity={30}
          tint="dark"
          style={[
            styles.header,
            { paddingTop: headerPaddingTop },
          ]}
        >
          {/* Header Left Profile Area (Click to open Left Sidebar Drawer) */}
          <Pressable 
            onPress={() => setShowSidebarModal(true)}
            className="flex-row items-center flex-1 mr-2 active:opacity-80"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <View className="relative">
              <View className="w-11 h-11 md:w-12 md:h-12 rounded-full border-2 border-[#ddb7ff] p-0.5 items-center justify-center bg-[#1a1525] shadow-[0_0_12px_rgba(221,183,255,0.3)]">
                {user?.avatar ? (
                  <Image
                    source={{
                      uri: user.avatar,
                    }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150",
                    }}
                    className="w-full h-full rounded-full"
                  />
                )}
              </View>
              <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00f1a1] rounded-full border-2 border-[#0d0d12]" />
            </View>
            <View className="ml-3 flex-1">
              <Text numberOfLines={1} className="text-[#ddb7ff] text-xl font-extrabold">
                {displayName}
              </Text>
              <Text numberOfLines={1} className="text-white/70 text-xs font-bold tracking-wider uppercase mt-0.5">
                Class Teacher: 8-A
              </Text>
            </View>
          </Pressable>
          <Pressable 
            className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/10"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Bell size={22} color="#fff" />
          </Pressable>
        </BlurView>
        
        {/* Glow Shadow beneath header */}
        <LinearGradient 
          colors={['rgba(221, 183, 255, 0.15)', 'transparent']} 
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollBottomPadding + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Leave Balances (Relocated inside scrollview at the top) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6 overflow-visible"
          contentContainerStyle={{ paddingRight: 20 }}
        >
          <View className="bg-white/5 border border-white/10 px-4 py-2 rounded-full flex-row items-center mr-3 shadow-md">
            <View className="w-2.5 h-2.5 rounded-full bg-[#ddb7ff] mr-2 shadow-[0_0_8px_rgba(221,183,255,0.6)]" />
            <Text className="text-white font-bold text-sm">CL 8</Text>
          </View>
          <View className="bg-white/5 border border-white/10 px-4 py-2 rounded-full flex-row items-center mr-3 shadow-md">
            <View className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] mr-2 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <Text className="text-white font-bold text-sm">SL 5</Text>
          </View>
          <View className="bg-white/5 border border-white/10 px-4 py-2 rounded-full flex-row items-center shadow-md">
            <View className="w-2.5 h-2.5 rounded-full bg-[#eab308] mr-2 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
            <Text className="text-white font-bold text-sm">EL 12</Text>
          </View>
        </ScrollView>

        {/* Today's Timetable */}
        <View className="flex-row justify-between items-end mb-4">
          <Text className="text-white text-2xl font-bold tracking-tight">
            Today's Timetable
          </Text>
          <Pressable>
            <Text className="text-[#ddb7ff] text-sm font-bold tracking-wide">
              View All
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-8 overflow-visible"
          contentContainerStyle={{ paddingRight: 20 }}
        >
          <View className="w-44 bg-[#1C1C1E] border border-white/5 rounded-3xl p-5 mr-4 shadow-lg">
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-[#ddb7ff] text-xl font-bold">P1</Text>
              <Text className="text-white/20 font-bold text-2xl">∑</Text>
            </View>
            <Text className="text-white font-bold text-lg mb-4">Maths</Text>
            <View className="space-y-2">
              <View className="flex-row items-center">
                <Clock size={14} color="#A1A1AA" />
                <Text className="text-white/70 text-xs ml-2">08:30 AM</Text>
              </View>
              <View className="flex-row items-center">
                <MapPin size={14} color="#A1A1AA" />
                <Text className="text-white/70 text-xs ml-2">Room 402</Text>
              </View>
            </View>
          </View>

          <View className="w-44 bg-[#252535] border border-[#ddb7ff]/30 rounded-3xl p-5 mr-4 shadow-lg shadow-[#ddb7ff]/10">
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-[#ddb7ff] text-xl font-bold">P2</Text>
            </View>
            <Text className="text-white font-bold text-lg mb-4">Physics</Text>
            <View className="space-y-2 mb-4">
              <View className="flex-row items-center">
                <Clock size={14} color="#A1A1AA" />
                <Text className="text-white/70 text-xs ml-2">09:20 AM</Text>
              </View>
              <View className="flex-row items-center">
                <MapPin size={14} color="#A1A1AA" />
                <Text className="text-white/70 text-xs ml-2">Lab A</Text>
              </View>
            </View>
            <View className="bg-[#ddb7ff]/20 self-start px-2 py-0.5 rounded-full mt-1">
              <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-wider">
                ONGOING
              </Text>
            </View>
          </View>

          <View className="w-44 bg-[#1C1C1E] border border-white/5 rounded-3xl p-5 mr-4 shadow-lg">
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-[#ddb7ff] text-xl font-bold">P3</Text>
            </View>
            <Text className="text-white font-bold text-lg mb-4">Chemistry</Text>
            <View className="space-y-2">
              <View className="flex-row items-center">
                <Clock size={14} color="#A1A1AA" />
                <Text className="text-white/70 text-xs ml-2">10:10 AM</Text>
              </View>
              <View className="flex-row items-center">
                <MapPin size={14} color="#A1A1AA" />
                <Text className="text-white/70 text-xs ml-2">Lab B</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Quick Actions */}
        <View className="flex-row flex-wrap justify-between mb-8">
          {[
            {
              icon: ClipboardCheck,
              label: "Mark Attendance",
              route: "Attendance",
            },
            { icon: ClipboardList, label: "Add Homework", route: "Homework" },
            { icon: Star, label: "Enter Marks", route: "Marks" },
            { icon: Upload, label: "Upload Material" },
            { icon: Megaphone, label: "Post Notice" },
            { icon: MessageSquare, label: "Message Parents" },
          ].map((action, index) => (
            <View key={index} className="w-[30%] items-center mb-6">
              <Pressable
                onPress={() =>
                  action.route && navigation.navigate(action.route)
                }
                className="w-16 h-16 bg-[#1C1C1E] rounded-3xl items-center justify-center border border-white/5 mb-3 shadow-lg"
              >
                <action.icon size={26} color="#EABFFF" />
              </Pressable>
              <Text className="text-[#A1A1AA] text-[11px] font-medium text-center">
                {action.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Review Pending */}
        <View className="flex-row justify-between items-end mb-4">
          <Text className="text-white text-2xl font-bold tracking-tight">
            Review Pending
          </Text>
          <Text className="text-white/60 text-sm font-bold">4 Total</Text>
        </View>

        <View className="space-y-4">
          {/* Card 1 */}
          <View className="bg-[#1C1C1E] border border-white/5 rounded-3xl p-5 flex-row justify-between items-center shadow-lg mb-4">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-white text-base font-bold mr-2">
                  Quadratic Equations
                </Text>
                <View className="bg-[#3f2024] px-2 py-0.5 rounded-sm">
                  <Text className="text-[#fca5a5] text-[10px] font-bold">
                    URGENT
                  </Text>
                </View>
              </View>
              <Text className="text-[#A1A1AA] text-xs mb-3">
                Class 8-A • Maths
              </Text>
              <View className="flex-row items-center">
                <View className="flex-row -space-x-3 mr-4">
                  {["AE", "MK", "+28"].map((initial, i) => (
                    <View
                      key={i}
                      className="w-7 h-7 rounded-full bg-[#2a2a35] border-2 border-[#1C1C1E] items-center justify-center"
                    >
                      <Text className="text-white/80 text-[9px] font-bold">
                        {initial}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text className="text-[#EABFFF] text-xs font-semibold">
                  32 / 40 Submitted
                </Text>
              </View>
            </View>
            <Pressable className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/10">
              <ChevronRight size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Card 2 */}
          <View className="bg-[#1C1C1E] border border-white/5 rounded-3xl p-5 flex-row justify-between items-center shadow-lg mb-4">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-white text-base font-bold mr-2">
                  Newton's Laws
                </Text>
                <View className="bg-white/10 px-2 py-0.5 rounded-sm">
                  <Text className="text-[#A1A1AA] text-[10px] font-bold">
                    DUE TODAY
                  </Text>
                </View>
              </View>
              <Text className="text-[#A1A1AA] text-xs mb-3">
                Class 8-B • Physics
              </Text>
              <View className="flex-row items-center">
                <View className="flex-row -space-x-3 mr-4">
                  {["SJ", "RP", "+12"].map((initial, i) => (
                    <View
                      key={i}
                      className="w-7 h-7 rounded-full bg-[#2a2a35] border-2 border-[#1C1C1E] items-center justify-center"
                    >
                      <Text className="text-white/80 text-[9px] font-bold">
                        {initial}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text className="text-[#EABFFF] text-xs font-semibold">
                  15 / 38 Submitted
                </Text>
              </View>
            </View>
            <Pressable className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/10">
              <ChevronRight size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Card 3 Locked */}
          <View className="bg-[#1C1C1E]/50 border border-white/5 rounded-3xl p-5 flex-row justify-between items-center shadow-lg">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-[#A1A1AA] text-base font-bold mr-2">
                  Periodic Table
                </Text>
                <View className="bg-white/5 px-2 py-0.5 rounded-sm">
                  <Text className="text-white/40 text-[10px] font-bold">
                    DUE MON
                  </Text>
                </View>
              </View>
              <Text className="text-[#A1A1AA] text-xs mb-2">
                Class 7-C • Chemistry
              </Text>
              <Text className="text-[#A1A1AA]/60 text-xs italic">
                Review window opens tomorrow
              </Text>
            </View>
            <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center border border-white/10">
              <Lock size={16} color="#A1A1AA" />
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        className="absolute bottom-[120px] right-6 w-16 h-16 bg-[#ddb7ff] rounded-[24px] items-center justify-center shadow-lg shadow-[#ddb7ff]/40 z-50 border border-white/10"
        style={{ elevation: 15 }}
      >
        <Plus size={32} color="#121212" />
      </Pressable>

      {/* LEFT SIDEBAR DRAWER MODAL (Profile Details & Sign Out - Teacher Theme) */}
      {showSidebarModal && (
        <Modal 
          visible={showSidebarModal} 
          transparent 
          animationType="fade" 
          onRequestClose={() => setShowSidebarModal(false)}
        >
          <View className="flex-1 bg-black/80 flex-row">
            <View 
              {...sidebarSwipeResponder.panHandlers}
              className="w-[82%] max-w-xs h-full p-5 flex-col justify-between border-r border-[#ddb7ff]/30" 
              style={{ 
                backgroundColor: '#101415',
                paddingTop: Math.max(insets.top, 20) + 8,
                paddingBottom: Math.max(insets.bottom, 20) + 12,
              }}
            >
              {/* Sidebar Header & Close */}
              <View>
                <View className="flex-row justify-between items-center pb-4 border-b border-white/10 mb-5">
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-xl bg-[#ddb7ff]/20 border border-[#ddb7ff]/40 items-center justify-center mr-2.5">
                      <GraduationCap size={20} color="#ddb7ff" />
                    </View>
                    <View>
                      <Text className="text-white font-extrabold text-sm">EduVision</Text>
                      <Text className="text-[#ddb7ff] text-[9px] font-bold uppercase tracking-widest">TEACHER PORTAL</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setShowSidebarModal(false)} className="p-1 active:scale-95">
                    <X size={20} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                </View>

                {/* Profile Avatar Card */}
                <View className="bg-black/60 p-4 rounded-3xl border border-[#ddb7ff]/20 mb-5 items-center">
                  <View className="w-16 h-16 rounded-full items-center justify-center mb-3 bg-[#ddb7ff]/20 border-2 border-[#ddb7ff] shadow-[0_0_15px_rgba(221,183,255,0.3)] overflow-hidden">
                    {user?.avatar ? (
                      <Image
                        source={{ uri: user.avatar }}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <Text className="text-[#ddb7ff] font-extrabold text-xl">
                        {userInitials}
                      </Text>
                    )}
                  </View>
                  <Text className="text-white font-extrabold text-base text-center">{displayName}</Text>
                  <Text className="text-white/50 text-xs text-center mt-0.5">{displayEmail}</Text>

                  <View className="px-3 py-1 rounded-xl mt-3 bg-[#ddb7ff]/20 border border-[#ddb7ff]/40">
                    <Text className="text-[#ddb7ff] text-[10px] font-black uppercase tracking-wider">
                      {user?.designation || "SENIOR FACULTY"}
                    </Text>
                  </View>
                </View>

                {/* Staff Info Details List */}
                <View className="bg-white/5 p-3.5 rounded-2xl border border-white/10 mb-4" style={{ gap: 10 }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">Faculty ID</Text>
                    <Text className="text-white font-extrabold text-xs">TCH-2026-42</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">Class Assigned</Text>
                    <Text className="text-[#ddb7ff] font-bold text-xs">Grade 8-A (Class Teacher)</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">Department</Text>
                    <Text className="text-white font-bold text-xs">Mathematics & Sciences</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">Campus</Text>
                    <Text className="text-white font-bold text-xs">KTS Central Campus</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/50 text-xs font-semibold">System Version</Text>
                    <Text className="text-white/70 font-semibold text-xs">v2.4.0 (Expo SDK 56)</Text>
                  </View>
                </View>
              </View>

              {/* Bottom Actions: Fast navigation & Sign Out */}
              <View className="pb-6">
                <Pressable
                  onPress={() => {
                    setShowSidebarModal(false);
                    navigation.navigate('Attendance');
                  }}
                  className="w-full py-3.5 px-4 mb-2.5 bg-white/5 border border-white/15 rounded-2xl flex-row items-center justify-between active:bg-white/10"
                >
                  <View className="flex-row items-center">
                    <ClipboardCheck size={18} color="#ddb7ff" style={{ marginRight: 10 }} />
                    <Text className="text-white font-extrabold text-xs">Mark Attendance</Text>
                  </View>
                  <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowSidebarModal(false);
                    navigation.navigate('Leave');
                  }}
                  className="w-full py-3.5 px-4 mb-2.5 bg-white/5 border border-white/15 rounded-2xl flex-row items-center justify-between active:bg-white/10"
                >
                  <View className="flex-row items-center">
                    <CalendarOff size={18} color="#ddb7ff" style={{ marginRight: 10 }} />
                    <Text className="text-white font-extrabold text-xs">Leave Applications</Text>
                  </View>
                  <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>

                <Pressable
                  onPress={handleSignOut}
                  className="w-full py-3.5 bg-rose-500/20 border border-rose-500/50 rounded-2xl flex-row items-center justify-center active:bg-rose-500/30"
                >
                  <LogOut size={18} color="#ff516a" style={{ marginRight: 8 }} />
                  <Text className="text-[#ff516a] font-extrabold text-xs uppercase tracking-wider">Sign Out</Text>
                </Pressable>
              </View>

            </View>

            {/* Tap Backdrop Outside Drawer to Dismiss */}
            <Pressable onPress={() => setShowSidebarModal(false)} className="flex-1" />
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 80,
  },
});

export default TeacherDashboard;
