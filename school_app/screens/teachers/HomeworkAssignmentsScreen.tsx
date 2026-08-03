import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Image, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Bell, Calendar, BookOpen, Plus } from 'lucide-react-native';

export const HomeworkAssignmentsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [autoReminder, setAutoReminder] = useState(true);

  return (
    <View style={styles.container}>
      <View className="absolute inset-0 bg-[#150E22]" />
      
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
              <Text className="text-[#ddb7ff] text-xl font-bold">Homework</Text>
              <Text className="text-white/50 text-xs font-semibold tracking-wider uppercase mt-0.5">
                Homework Hub
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Title & Toggle */}
        <View className="flex-row justify-between items-center mb-8">
          <Text className="text-white text-[32px] font-extrabold tracking-tight w-[60%] leading-tight">Homework{'\n'}Dashboard</Text>
          <View className="flex-row items-center">
            <Text className="text-[#A1A1AA] text-[9px] font-bold tracking-widest uppercase mr-3">AUTO-{'\n'}REMINDER</Text>
            <Switch
              trackColor={{ false: "#2a1b4e", true: "#2a1b4e" }}
              thumbColor={autoReminder ? "#EABFFF" : "#a1a1aa"}
              onValueChange={setAutoReminder}
              value={autoReminder}
            />
          </View>
        </View>

        {/* Assignment Card 1 */}
        <View className="bg-[#1C1C1E] border border-white/5 rounded-3xl p-6 mb-5 shadow-lg">
          <View className="flex-row justify-between items-start mb-6">
            <View className="border border-[#ddb7ff]/20 px-4 py-1.5 rounded-full">
              <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-widest uppercase">MATHEMATICS</Text>
            </View>
            <View className="items-center">
              <Calendar size={22} color="#A1A1AA" />
              <Text className="text-[#fca5a5] text-xs font-bold mt-2">24 Oct, 2023</Text>
            </View>
          </View>
          
          <Text className="text-white text-2xl font-bold mb-8">Advanced Calculus - Set 4</Text>
          
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[#ffffff] font-bold text-sm">Completion Rate</Text>
            <Text className="text-[#ffffff] font-bold text-sm">28/42 submitted</Text>
          </View>
          <View className="h-2.5 bg-[#2a2a35] rounded-full overflow-hidden">
            <LinearGradient
              colors={['#EABFFF', '#9333ea']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: '100%', width: '66%', borderRadius: 9999 }}
            />
          </View>
        </View>

        {/* Assignment Card 2 */}
        <View className="bg-[#1C1C1E] border border-white/5 rounded-3xl p-6 mb-5 shadow-lg">
          <View className="flex-row justify-between items-start mb-6">
            <View className="border border-[#a78bfa]/20 px-4 py-1.5 rounded-full">
              <Text className="text-[#a78bfa] text-[10px] font-bold tracking-widest uppercase">ENGLISH LIT</Text>
            </View>
            <View className="items-center">
              <Calendar size={22} color="#A1A1AA" />
              <Text className="text-white text-xs font-bold mt-2">27 Oct, 2023</Text>
            </View>
          </View>
          
          <Text className="text-white text-2xl font-bold mb-8">Elizabethan Era Analysis</Text>
          
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[#ffffff] font-bold text-sm">Completion Rate</Text>
            <Text className="text-[#ffffff] font-bold text-sm">12/35 submitted</Text>
          </View>
          <View className="h-2.5 bg-[#2a2a35] rounded-full overflow-hidden">
            <LinearGradient
              colors={['#EABFFF', '#9333ea']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: '100%', width: '34%', borderRadius: 9999 }}
            />
          </View>
        </View>

        {/* Draft Card */}
        <View className="bg-[#1A1A1A] border-2 rounded-3xl p-6 shadow-lg border-dashed border-[#A1A1AA]/20 flex-row items-center">
          <BookOpen size={30} color="#A1A1AA" />
          <Text className="text-[#A1A1AA] text-lg font-medium ml-4 flex-1">Drafting next assignment: Physics Lab Report...</Text>
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
    backgroundColor: '#150E22',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
});

export default HomeworkAssignmentsScreen;
