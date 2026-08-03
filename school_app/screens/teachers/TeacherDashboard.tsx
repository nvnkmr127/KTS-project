import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Image,
} from "react-native";
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
} from "lucide-react-native";

export const TeacherDashboard: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={styles.container}>
      <View className="absolute inset-0 bg-[#121212]" />

      {/* Header Container with Shadow */}
      <View style={{ zIndex: 50 }}>
        <BlurView
          intensity={30}
          tint="dark"
          style={[
            styles.header,
            { paddingTop: insets.top + (Platform.OS === "android" ? 24 : 16) },
          ]}
        >
          <View className="flex-row items-center">
            <View className="relative">
              <View className="w-12 h-12 rounded-full border-2 border-[#ddb7ff] p-0.5 items-center justify-center bg-[#1a1525]">
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150",
                  }}
                  className="w-full h-full rounded-full"
                />
              </View>
              <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00f1a1] rounded-full border-2 border-[#0d0d12]" />
            </View>
            <View className="ml-3">
              <Text className="text-[#ddb7ff] text-xl font-bold">
                Ms. Priya Reddy
              </Text>
              <Text className="text-white/50 text-xs font-semibold tracking-wider uppercase mt-0.5">
                Class Teacher: 8-A
              </Text>
            </View>
          </View>
          <Pressable className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/10">
            <Bell size={20} color="#fff" />
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
        contentContainerStyle={styles.scrollContent}
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
