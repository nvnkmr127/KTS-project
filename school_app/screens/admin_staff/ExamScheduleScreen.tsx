import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  Calendar,
  Award,
  Edit3,
  Sliders,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';
import { useAuthStore } from '../../store/useAuthStore';

interface ExamBarOption {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  icon: (color: string) => React.ReactNode;
  route: string;
}

export const ExamScheduleScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { headerPaddingTop } = useResponsive();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  const primaryColor = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryLight = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const bgGradient = isSuperAdmin
    ? (['#101415', '#1a1e1f', '#0b0c0d', '#080809'] as const)
    : (['#061a14', '#0d2a24', '#081713', '#050f0c'] as const);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (navigation?.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate(isSuperAdmin ? 'SuperAdminHome' : 'AdminStaffHome');
        }
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation, isSuperAdmin])
  );

  const examOptions: ExamBarOption[] = [
    {
      id: 'exam-schedule',
      title: 'Exam Schedule',
      subtitle: 'Exam dates, subject timings & syllabus',
      badge: 'Upcoming',
      badgeColor: isSuperAdmin ? '#ffe5a0' : '#00f1a1',
      icon: (color) => <Calendar size={22} color={color} />,
      route: 'AdminExamSchedule',
    },
    {
      id: 'results-rankings',
      title: 'Results & Rankings',
      subtitle: 'Performance metrics, toppers & rank list',
      badge: 'Term 1',
      badgeColor: '#facc15',
      icon: (color) => <Award size={22} color={color} />,
      route: 'AdminExamResults',
    },
    {
      id: 'marks-preview',
      title: 'Marks Preview',
      subtitle: 'Grade evaluations & preview marks across all classes',
      badge: 'Active',
      badgeColor: '#38bdf8',
      icon: (color) => <Edit3 size={22} color={color} />,
      route: 'AdminMarksPreview',
    },
    {
      id: 'schedule-designer',
      title: 'Schedule Designer',
      subtitle: 'Timetable matrix, slots & schedule creator',
      badge: 'Designer',
      badgeColor: '#a78bfa',
      icon: (color) => <Sliders size={22} color={color} />,
      route: 'AdminExamScheduleDesigner',
    },
    {
      id: 'allot-invigilation',
      title: 'Allot Invigilation',
      subtitle: 'Hall duty roster, faculty assignment & check-in',
      badge: 'Allotment',
      badgeColor: '#f472b6',
      icon: (color) => <ShieldCheck size={22} color={color} />,
      route: 'AdminExamInvigilation',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Background Deep Gradient */}
      <LinearGradient
        colors={bgGradient}
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
                onPress={() => {
                  if (navigation?.canGoBack && navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate(isSuperAdmin ? 'SuperAdminHome' : 'AdminStaffHome');
                  }
                }}
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center mr-3 active:bg-white/20"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color={primaryLight} />
              </Pressable>
              <View className="flex-1">
                <Text className="text-white text-lg md:text-xl font-extrabold" numberOfLines={1}>
                  Examination
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <View
                    className="w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <Text className="text-xs font-semibold" style={{ color: primaryLight }}>
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
          paddingBottom: insets.bottom + 105,
          paddingHorizontal: 16,
          paddingTop: 18,
        }}
      >
        {/* TOP HEADING TEXT */}
        <View className="mb-5 px-1">
          <Text className="text-white text-xl md:text-2xl font-black">
            Examination Portal
          </Text>
          <Text className="text-white/60 text-xs md:text-sm font-medium mt-1 leading-relaxed">
            Manage schedules, results, marks preview, designer & invigilation allotment.
          </Text>
        </View>

        {/* 5 OPTIONS IN BAR STYLE */}
        <View style={{ gap: 12 }}>
          {examOptions.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => navigation.navigate(option.route)}
              className="border p-4 flex-row items-center shadow-lg relative overflow-hidden active:opacity-90"
              style={{
                backgroundColor: isSuperAdmin ? 'rgba(26, 30, 31, 0.95)' : 'rgba(16, 45, 38, 0.95)',
                borderColor: isSuperAdmin ? 'rgba(240, 193, 16, 0.2)' : 'rgba(0, 241, 161, 0.2)',
                borderRadius: 16,
              }}
            >
              {/* Icon Container */}
              <View
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  marginRight: 16,
                  backgroundColor: isSuperAdmin ? 'rgba(240, 193, 16, 0.12)' : 'rgba(0, 241, 161, 0.12)',
                  borderColor: isSuperAdmin ? 'rgba(240, 193, 16, 0.25)' : 'rgba(0, 241, 161, 0.25)',
                  borderWidth: 1,
                }}
              >
                {option.icon(option.badgeColor || primaryColor)}
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
                className="w-8 h-8 rounded-full items-center justify-center border"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <ChevronRight size={18} color={primaryLight} />
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
    backgroundColor: '#061a14',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
});

export default ExamScheduleScreen;
