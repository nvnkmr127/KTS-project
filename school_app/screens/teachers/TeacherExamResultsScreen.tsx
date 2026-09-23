import React, { useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { ArrowLeft, Award } from "lucide-react-native";
import { useResponsive } from "../../utils/responsive";

export const TeacherExamResultsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { headerPaddingTop } = useResponsive();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Examination");
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#22143d", "#150d26", "#0b0912", "#08070d"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={40} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Pressable
                onPress={() => navigation.navigate("Examination")}
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center mr-3 active:bg-white/20"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color="#ddb7ff" />
              </Pressable>
              <View className="flex-1">
                <Text className="text-white text-lg md:text-xl font-extrabold" numberOfLines={1}>
                  Results & Rankings
                </Text>
                <Text className="text-[#ddb7ff] text-xs font-semibold">
                  Student Performance & Rank Matrix
                </Text>
              </View>
            </View>
          </View>
        </BlurView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: 16, paddingTop: 16 }}
      >
        <View className="bg-[#181524] border border-white/10 rounded-2xl p-5 items-center justify-center">
          <View className="w-14 h-14 rounded-2xl bg-[#facc15]/20 items-center justify-center mb-3 border border-[#facc15]/30">
            <Award size={28} color="#facc15" />
          </View>
          <Text className="text-white text-lg font-black text-center mb-1">Results & Rankings Screen</Text>
          <Text className="text-white/60 text-xs text-center leading-relaxed">
            Ready to configure class rankings, topper analytics, report card downloads, and grade summaries.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#08070d",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
});

export default TeacherExamResultsScreen;
