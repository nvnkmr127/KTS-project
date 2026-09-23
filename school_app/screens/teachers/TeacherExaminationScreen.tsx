import React, { useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  ArrowLeft,
  Calendar,
  Award,
  Edit3,
  Eye,
  ShieldAlert,
  ChevronRight,
} from "lucide-react-native";
import { useResponsive } from "../../utils/responsive";

interface ExamBarOption {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  route: string;
}

export const TeacherExaminationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { headerPaddingTop } = useResponsive();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Dashboard");
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  const examOptions: ExamBarOption[] = [
    {
      id: "exam-schedule",
      title: "Exam Schedule",
      subtitle: "Exam dates, subject timings & syllabus",
      badge: "Upcoming",
      badgeColor: "#ddb7ff",
      icon: <Calendar size={22} color="#ddb7ff" />,
      route: "TeacherExamSchedule",
    },
    {
      id: "results-rankings",
      title: "Results & Rankings",
      subtitle: "Performance metrics, toppers & rank list",
      badge: "Term 1",
      badgeColor: "#facc15",
      icon: <Award size={22} color="#facc15" />,
      route: "TeacherExamResults",
    },
    {
      id: "marks-entry",
      title: "Marks Entry",
      subtitle: "Grade student evaluations & submit marks",
      badge: "Active",
      badgeColor: "#38bdf8",
      icon: <Edit3 size={22} color="#38bdf8" />,
      route: "MarksEntry",
    },
    {
      id: "schedule-preview",
      title: "Schedule Preview",
      subtitle: "Calendar matrix & printable PDF timetable",
      badge: "Preview",
      badgeColor: "#a78bfa",
      icon: <Eye size={22} color="#a78bfa" />,
      route: "TeacherExamSchedulePreview",
    },
    {
      id: "exam-invigilation",
      title: "Exam Invigilation",
      subtitle: "Hall duty roster, reporting & check-in",
      badge: "3 Duties",
      badgeColor: "#f472b6",
      icon: <ShieldAlert size={22} color="#f472b6" />,
      route: "TeacherExamInvigilation",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Background Deep Gradient */}
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
            <View className="flex-row items-center flex-1 mr-3">
              <Pressable
                onPress={() => navigation.navigate("Dashboard")}
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center mr-3 active:bg-white/20"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color="#ddb7ff" />
              </Pressable>
              <View className="flex-1">
                <Text className="text-white text-lg md:text-xl font-extrabold" numberOfLines={1}>
                  Examination
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <View className="w-2 h-2 rounded-full bg-[#00f1a1] mr-1.5" />
                  <Text className="text-[#ddb7ff] text-xs font-semibold">
                    Academic Session 2025-26
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 90,
          paddingHorizontal: 16,
          paddingTop: 18,
        }}
      >
        {/* TOP HEADING TEXT (NO BORDER BOX, CLEAN TEXT) */}
        <View className="mb-5 px-1">
          <Text className="text-white text-xl md:text-2xl font-black">
            Examination Portal
          </Text>
          <Text className="text-white/60 text-xs md:text-sm font-medium mt-1 leading-relaxed">
            Select an option below to manage schedules, marks, rankings and duties.
          </Text>
        </View>

        {/* 5 OPTIONS IN BAR STYLE ONE AFTER OTHER WITH PROPER SPACING */}
        <View style={{ gap: 12 }}>
          {examOptions.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => navigation.navigate(option.route)}
              className="bg-[#181524] border border-white/10 p-4 flex-row items-center active:bg-white/10 active:border-[#ddb7ff]/40 shadow-lg relative overflow-hidden"
              style={{
                borderRadius: 16, // Little curve
              }}
            >
              {/* Icon Container with explicit right margin for clear gap */}
              <View
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 items-center justify-center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  marginRight: 16, // Fixed gap between icon and text
                }}
              >
                {option.icon}
              </View>

              {/* Text Info */}
              <View style={{ flex: 1, marginRight: 10 }}>
                <View className="flex-row items-center flex-wrap" style={{ gap: 8, marginBottom: 3 }}>
                  <Text className="text-white text-base font-extrabold">
                    {option.title}
                  </Text>
                  {option.badge && (
                    <View
                      className="px-2 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: `${option.badgeColor}20`,
                        borderColor: `${option.badgeColor}50`,
                      }}
                    >
                      <Text
                        className="text-[10px] font-black"
                        style={{ color: option.badgeColor }}
                      >
                        {option.badge}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-white/50 text-xs font-medium" numberOfLines={1}>
                  {option.subtitle}
                </Text>
              </View>

              {/* Right Arrow */}
              <View
                className="w-8 h-8 rounded-full bg-white/5 items-center justify-center border border-white/10"
                style={{ width: 32, height: 32, borderRadius: 16 }}
              >
                <ChevronRight size={18} color="#ddb7ff" />
              </View>
            </Pressable>
          ))}
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

export default TeacherExaminationScreen;
