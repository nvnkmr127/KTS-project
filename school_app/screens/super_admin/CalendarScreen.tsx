import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { GlassCard } from '../../components/GlassCard';
import { ArrowLeft, Calendar, Info } from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';

export const CalendarScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isSmallPhone, isTablet, insets, headerPaddingTop, scrollBottomPadding, containerStyle } = useResponsive();
  const events = [
    { id: "e1", title: "Term 2 Mid-Term Exams", date: "June 15 - June 22", category: "Academic" },
    { id: "e2", title: "Parent-Teacher Conference (PTC)", date: "June 27, 09:00 AM", category: "Meeting" },
    { id: "e3", title: "Independence Day Holiday", date: "July 04", category: "Holiday" },
    { id: "e4", title: "Summer Recess Break Begins", date: "July 20", category: "Holiday" },
  ];

  return (
    <ScrollView 
      style={styles.scrollView} 
      contentContainerStyle={[
        styles.contentContainer,
        containerStyle,
        { paddingTop: headerPaddingTop, paddingBottom: scrollBottomPadding + 24 }
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center mb-6">
        <Pressable 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 items-center justify-center bg-white/5 border border-white/10 rounded-2xl active:scale-95"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </Pressable>
        <Text numberOfLines={1} className="text-white text-xl md:text-2xl font-extrabold ml-4 flex-1">Academy Calendar</Text>
      </View>

      <Text className="text-white/80 text-sm font-semibold mb-3 ml-1">Key Events & Milestones</Text>
      {events.map((event) => (
        <GlassCard key={event.id} className="p-4 mb-4" intensity="medium">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center flex-1 mr-2">
              <Calendar size={18} color="#60A5FA" />
              <View className="ml-3 flex-1">
                <Text numberOfLines={1} className="text-white font-bold text-sm">{event.title}</Text>
                <Text numberOfLines={1} className="text-white/50 text-[10px] uppercase font-semibold mt-0.5">{event.category}</Text>
              </View>
            </View>
            <Text className="text-brand-indigo text-xs font-bold">{event.date.split(',')[0]}</Text>
          </View>
        </GlassCard>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
});

export default CalendarScreen;
