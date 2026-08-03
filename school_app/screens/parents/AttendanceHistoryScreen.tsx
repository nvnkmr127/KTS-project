import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Dimensions, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronLeft, Bell, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';

const { width } = Dimensions.get('window');
const SCREEN_MARGIN = 20;
const CARD_PADDING = 16;
const GRID_GAP = 8;
const CELL_SIZE = Math.floor((width - 2 * SCREEN_MARGIN - 2 * CARD_PADDING - 6 * GRID_GAP) / 7);

export const AttendanceHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user, activeChildId } = useAuthStore();
  const currentChild = user?.children?.find(c => c.id === activeChildId) || user?.children?.[0];
  const isTab = route.name === 'Attendance';
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const stats = [
    { label: 'Present', val: '22', color: '#10B981' },
    { label: 'Absent', val: '2', color: '#FB7185' },
    { label: 'Late', val: '1', color: '#818CF8' },
    { label: 'Total', val: '88%', color: '#818CF8', isTotal: true }
  ];

  // Calendar dates matching October 2023
  const calendarDays = [
    // Week 1 (Partial) - starts with Saturday Oct 1
    { dayNum: null, status: null }, { dayNum: null, status: null }, { dayNum: null, status: null },
    { dayNum: null, status: null }, { dayNum: null, status: null },
    { dayNum: 1, status: 'present' },
    { dayNum: 2, status: 'holiday' },
    // Week 2
    { dayNum: 3, status: 'present' }, { dayNum: 4, status: 'present' }, { dayNum: 5, status: 'present' },
    { dayNum: 6, status: 'present' }, { dayNum: 7, status: 'present' }, { dayNum: 8, status: 'present' },
    { dayNum: 9, status: 'holiday' },
    // Week 3
    { dayNum: 10, status: 'present' }, { dayNum: 11, status: 'absent' }, { dayNum: 12, status: 'present' },
    { dayNum: 13, status: 'present' }, { dayNum: 14, status: 'present' }, { dayNum: 15, status: 'late' },
    { dayNum: 16, status: 'holiday' },
    // Week 4
    { dayNum: 17, status: 'present' }, { dayNum: 18, status: 'present' }, { dayNum: 19, status: 'present' },
    { dayNum: 20, status: 'absent' }, { dayNum: 21, status: 'present' }, { dayNum: 22, status: 'present' },
    { dayNum: 23, status: 'holiday' },
    // Week 5
    { dayNum: 24, status: 'present' }, { dayNum: 25, status: 'present' }, { dayNum: 26, status: 'present' },
    { dayNum: 27, status: 'present' }, { dayNum: 28, status: 'present' }, { dayNum: 29, status: 'present' },
    { dayNum: 30, status: 'holiday' }
  ];

  // Group calendar days into weekly rows of 7 cells
  const weeks: any[][] = [];
  let currentWeek: any[] = [];
  calendarDays.forEach((dayObj, index) => {
    currentWeek.push(dayObj);
    if (currentWeek.length === 7 || index === calendarDays.length - 1) {
      while (currentWeek.length < 7) {
        currentWeek.push({ dayNum: null, status: null });
      }
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const listItems = [
    { date: 'October 20, 2023', dayName: 'Friday', remark: 'No remark provided', status: 'absent' },
    { date: 'October 15, 2023', dayName: 'Late', remark: 'arrived 9:15 AM', status: 'late' },
    { date: 'October 11, 2023', dayName: 'Wednesday', remark: 'Medical Leave', status: 'absent' },
    { date: 'October 09, 2023', dayName: 'Sunday', remark: 'Weekly Off', status: 'holiday' }
  ];

  const getDayCellStyle = (status: string | null) => {
    switch (status) {
      case 'present':
        return styles.dayPresent;
      case 'absent':
        return styles.dayAbsent;
      case 'late':
        return styles.dayLate;
      case 'holiday':
        return styles.dayHoliday;
      default:
        return {};
    }
  };

  const getDayTextStyle = (status: string | null) => {
    switch (status) {
      case 'present':
        return { color: '#10B981' };
      case 'absent':
        return { color: '#FB7185' };
      case 'late':
        return { color: '#818CF8' };
      case 'holiday':
        return { color: 'rgba(255, 255, 255, 0.35)' };
      default:
        return { color: '#ffffff' };
    }
  };

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'absent':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: 'rgba(239, 68, 68, 0.4)' };
      case 'late':
        return { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' };
      case 'holiday':
        return { bg: 'rgba(107, 114, 128, 0.2)', text: '#9ca3af', border: 'rgba(107, 114, 128, 0.4)' };
      default:
        return { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.4)' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0E0F26', '#121330']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header - Matching other screens pattern */}
      <View style={styles.header}>
        <View className="flex-row items-center gap-3">
          {isTab ? (
            <Pressable 
              onPress={() => navigation.navigate('StudentProfileDetails')}
              className="w-10 h-10 rounded-full overflow-hidden border border-white/20 active:scale-95"
            >
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMrIIqhz709VeW2BpRqLVg1j7U7Pl9daXfwRKA-2HDDgcA9W7mXSd5OKr4pnpdIm8PH7zmg2kpcIfjndCo00bTp-Axh-ozzk6NmCmBUgatneU-MIJXsqAP3jNupEJEVMnZddUdmfbtXx9Pf104uwZfzaiIwRgyJZ8fQhJHzGToBXPUzvkGYakj-ALyh-X-w-OuUIWQTLleEFRHfU4lEubjrHCKU1coc5G8ockGv2_JF5fyZw89gZymwweZDxq0LKQFld8hZ2gu1G6t' }}
                className="w-full h-full object-cover"
              />
            </Pressable>
          ) : (
            <Pressable onPress={() => navigation.goBack()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-95">
              <ChevronLeft size={20} color="#818CF8" />
            </Pressable>
          )}
          <View>
            <Text className="text-white/70 text-xs font-semibold">Parent Profile</Text>
            <Text className="text-white text-lg font-bold font-headline-md">Good Morning, {user?.name || 'Ramesh'} 👋</Text>
          </View>
        </View>
        <Pressable className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-95">
          <Bell size={20} color="#5E5CE6" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Attendance Warning Card - Frosted Glass */}
        <View className="px-5 mb-5">
          <View style={styles.warningCard} className="overflow-hidden relative">
            <BlurView intensity={80} tint="dark" style={[StyleSheet.absoluteFillObject, { zIndex: -1 }]} />
            {/* Subtle error tint overlay */}
            <LinearGradient
              colors={['rgba(251, 113, 133, 0.08)', 'rgba(251, 113, 133, 0.03)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View className="p-5 flex-row items-center gap-4">
              <View className="w-12 h-12 rounded-full bg-[#351A2C] border border-[#592C4D] flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} color="#FB7185" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text style={{ color: '#FB7185' }} className="font-bold text-sm font-headline-md">Attendance Warning</Text>
                <Text className="text-white/80 text-xs mt-1 leading-normal">
                  {currentChild?.name || 'Arjun'}'s attendance has dropped to 88%. A minimum of 75% is required for term exams.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats strip */}
        <View className="px-5 mb-6 flex-row gap-2">
          {stats.map((st, idx) => (
            <View 
              key={idx}
              style={[
                styles.statsCard,
                st.isTotal && styles.statsCardTotal,
              ]}
              className="flex-1 items-center justify-center"
            >
              <Text style={[
                { color: '#5A577C', fontSize: 12, fontWeight: '600' },
                st.isTotal && { color: '#818CF8' },
              ]}>{st.label}</Text>
              <Text className="text-2xl font-bold mt-1.5 font-headline-md" style={{ color: st.color }}>
                {st.val}
              </Text>
            </View>
          ))}
        </View>

        {/* View Controls Header */}
        <View className="px-5 mb-4 flex-row justify-between items-center">
          <Text className="text-white text-base font-bold font-headline-md">October 2023</Text>
          <View style={styles.toggleContainer} className="p-1 rounded-full flex-row">
            <Pressable 
              onPress={() => setViewMode('calendar')}
              className={`px-5 py-2 rounded-full ${viewMode === 'calendar' ? 'bg-[#232145]' : ''}`}
            >
              <Text className={`text-xs font-bold ${viewMode === 'calendar' ? 'text-white' : 'text-white/40'}`}>
                Calendar
              </Text>
            </Pressable>
            <Pressable 
              onPress={() => setViewMode('list')}
              className={`px-5 py-2 rounded-full ${viewMode === 'list' ? 'bg-[#232145]' : ''}`}
            >
              <Text className={`text-xs font-bold ${viewMode === 'list' ? 'text-white' : 'text-white/40'}`}>
                List View
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Dynamic content */}
        {viewMode === 'calendar' ? (
          <View className="px-5 mb-8">
            {/* Calendar Card */}
            <View style={styles.calendarCard}>
              {/* Day headers */}
              <View style={styles.dayHeaderRow}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, dIdx) => (
                  <View key={dIdx} style={styles.dayHeaderCell}>
                    <Text className="text-white/40 text-xs font-bold">
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Day cells grid */}
              {weeks.map((week, wIdx) => (
                <View key={wIdx} style={styles.weekRow}>
                  {week.map((dayObj: any, cellIdx: number) => (
                    <View 
                      key={cellIdx} 
                      style={[
                        styles.dayCell, 
                        getDayCellStyle(dayObj.status),
                      ]}
                    >
                      {dayObj.dayNum ? (
                        <Text style={[styles.dayText, getDayTextStyle(dayObj.status)]}>
                          {dayObj.dayNum}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ))}

              {/* Calendar Legend */}
              <View className="flex-row justify-between pt-4 mt-5 border-t border-white/5" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }} />
                  <Text className="text-white/60 text-xs font-semibold">Present</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FB7185' }} />
                  <Text className="text-white/60 text-xs font-semibold">Absent</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#818CF8' }} />
                  <Text className="text-white/60 text-xs font-semibold">Late</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5A577C' }} />
                  <Text className="text-white/60 text-xs font-semibold">Holiday</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* List View */
          <View className="px-5 mb-8">
            {listItems.map((item, index) => {
              const bStyle = getBadgeStyle(item.status);
              return (
                <View 
                  key={index} 
                  style={styles.glassCard}
                  className="p-4 rounded-xl flex-row justify-between items-center mb-3 border border-white/10"
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-white font-bold text-sm leading-tight">{item.date}</Text>
                    <Text className="text-white/50 text-[11px] mt-1 font-semibold">
                      {item.dayName} — {item.remark}
                    </Text>
                  </View>
                  <View 
                    style={{ backgroundColor: bStyle.bg, borderColor: bStyle.border, borderWidth: 1 }}
                    className="px-3 py-1 rounded-full"
                  >
                    <Text style={{ color: bStyle.text }} className="text-[10px] font-bold capitalize">
                      {item.status}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F26',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 65 : 52,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 50,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 140,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  // Warning Card - Frosted Glass
  warningCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  // Stats Cards
  statsCard: {
    backgroundColor: '#16142C',
    borderColor: '#26244C',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
  },
  statsCardTotal: {
    backgroundColor: '#1A1640',
    borderColor: '#3730A3',
  },
  // Toggle
  toggleContainer: {
    backgroundColor: '#131124',
    borderColor: '#26244C',
    borderWidth: 1,
  },
  // Calendar Card
  calendarCard: {
    backgroundColor: '#16142C',
    borderColor: '#26244C',
    borderWidth: 1,
    borderRadius: 24,
    padding: CARD_PADDING,
    paddingTop: 20,
  },
  // Day header row
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  // Week rows with proper spacing
  weekRow: {
    flexDirection: 'row',
    marginBottom: GRID_GAP,
  },
  // Day cells - using flex for even distribution
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'transparent',
    marginHorizontal: GRID_GAP / 2,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dayPresent: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  dayAbsent: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.45)',
  },
  dayLate: {
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    borderColor: 'rgba(129, 140, 248, 0.45)',
  },
  dayHoliday: {
    backgroundColor: '#0F0E20',
    borderColor: '#26244C',
  },
});

export default AttendanceHistoryScreen;
