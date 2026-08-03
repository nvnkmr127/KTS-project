import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Image, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Bell, Calendar, CalendarDays, CloudUpload, Send, ExternalLink, Info } from 'lucide-react-native';

const leaveHistory = [
  {
    id: '1',
    date: 'Nov 12 - Nov 14',
    type: 'CL',
    reason: 'Family emergency travel',
    status: 'Pending',
    meta: 'Applied: Nov 10'
  },
  {
    id: '2',
    date: 'Oct 28 - Oct 28',
    type: 'SL',
    reason: 'Doctor appointment',
    status: 'Approved',
    meta: 'By: Admin Ross'
  },
  {
    id: '3',
    date: 'Oct 15 - Oct 17',
    type: 'EL',
    reason: 'Admin Remark: High student absenteeism during these dates. Please reschedule if possible.',
    status: 'Rejected',
    meta: ''
  }
];

export const LeaveApplicationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [leaveType, setLeaveType] = useState('CL');
  const [reason, setReason] = useState('');

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Pending': return { bg: 'bg-transparent', border: 'border-[#eab308]/50', text: 'text-[#eab308]', icon: true };
      case 'Approved': return { bg: 'bg-[#22c55e]/10', border: 'border-[#22c55e]/30', text: 'text-[#22c55e]', icon: false };
      case 'Rejected': return { bg: 'bg-[#ef4444]/10', border: 'border-[#ef4444]/30', text: 'text-[#ef4444]', icon: false };
      default: return { bg: 'bg-transparent', border: 'border-white/20', text: 'text-white' };
    }
  };

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
              <Text className="text-[#ddb7ff] text-xl font-bold">Leave Command</Text>
              <Text className="text-white/50 text-xs font-semibold tracking-wider uppercase mt-0.5">
                Leave Center
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
        
        {/* Title */}
        <View className="mb-8 mt-2">
          <Text className="text-white text-[32px] font-extrabold tracking-tight mb-2 leading-tight">Leave Command{'\n'}Center</Text>
        </View>

        {/* Balances */}
        <View className="flex-row justify-between mb-8">
          <View className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-5 w-[31%] items-center shadow-lg">
            <Text className="text-[#A1A1AA] text-[10px] font-bold tracking-widest uppercase mb-2 text-center">Casual (CL)</Text>
            <Text className="text-[#EABFFF] text-3xl font-bold mb-2">04</Text>
            <Text className="text-[#A1A1AA]/50 text-[9px] font-medium tracking-widest uppercase text-center">DAYS LEFT</Text>
          </View>
          <View className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-5 w-[31%] items-center shadow-lg">
            <Text className="text-[#A1A1AA] text-[10px] font-bold tracking-widest uppercase mb-2 text-center">Sick (SL)</Text>
            <Text className="text-[#ddb7ff] text-3xl font-bold mb-2">08</Text>
            <Text className="text-[#A1A1AA]/50 text-[9px] font-medium tracking-widest uppercase text-center">DAYS LEFT</Text>
          </View>
          <View className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-5 w-[31%] items-center shadow-lg">
            <Text className="text-[#A1A1AA] text-[10px] font-bold tracking-widest uppercase mb-2 text-center">Earned (EL)</Text>
            <Text className="text-white text-3xl font-bold mb-2">12</Text>
            <Text className="text-[#A1A1AA]/50 text-[9px] font-medium tracking-widest uppercase text-center">DAYS LEFT</Text>
          </View>
        </View>

        {/* Apply For Leave */}
        <View className="bg-[#1e1136] border border-white/5 rounded-[32px] p-6 mb-10 shadow-lg">
          <View className="flex-row items-center mb-8">
            <CalendarDays size={28} color="#fff" />
            <Text className="text-white text-[22px] font-bold ml-4">Apply for Leave</Text>
          </View>

          {/* Leave Type */}
          <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-widest uppercase mb-4">Select Leave Type</Text>
          <View className="flex-row mb-8">
            {['CL', 'SL', 'EL'].map(type => (
              <Pressable
                key={type}
                onPress={() => setLeaveType(type)}
                className={`px-8 py-3 rounded-full mr-3 ${leaveType === type ? 'bg-transparent border border-[#ddb7ff]' : 'bg-[#2a2a35] border border-transparent'}`}
              >
                <Text className={`font-bold ${leaveType === type ? 'text-[#ddb7ff]' : 'text-[#A1A1AA]'}`}>{type}</Text>
              </Pressable>
            ))}
          </View>

          {/* Dates */}
          <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-widest uppercase mb-3">From Date</Text>
          <View className="flex-row justify-between items-center bg-[#1C1C1E] border border-[#ddb7ff]/20 px-5 py-4 rounded-xl mb-5">
            <Text className="text-white text-sm">11/20/2024</Text>
            <Calendar size={20} color="#A1A1AA" />
          </View>

          <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-widest uppercase mb-3">To Date</Text>
          <View className="flex-row justify-between items-center bg-[#1C1C1E] border border-[#ddb7ff]/20 px-5 py-4 rounded-xl mb-8">
            <Text className="text-white text-sm">11/22/2024</Text>
            <Calendar size={20} color="#A1A1AA" />
          </View>

          {/* Calculated */}
          <View className="bg-[#2a1b4e]/30 border border-[#ddb7ff]/20 px-5 py-5 rounded-xl flex-row justify-between items-center mb-8">
            <View className="flex-row items-center">
              <Info size={20} color="#ddb7ff" />
              <Text className="text-[#A1A1AA] text-sm ml-4">Calculated working days:</Text>
            </View>
            <Text className="text-[#EABFFF] text-[22px] font-bold">3</Text>
          </View>

          {/* Reason */}
          <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-widest uppercase mb-3">Reason for Leave</Text>
          <View className="bg-[#1C1C1E] border border-[#ddb7ff]/20 rounded-xl mb-8">
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Please provide a brief reason for your absence..."
              placeholderTextColor="#A1A1AA"
              multiline
              numberOfLines={4}
              style={{ textAlignVertical: 'top' }}
              className="px-5 py-5 text-white text-base leading-relaxed"
            />
          </View>

          {/* Upload */}
          <Text className="text-[#ddb7ff] text-[10px] font-bold tracking-widest uppercase mb-3">Supporting Document (Optional)</Text>
          <View className="bg-transparent border border-[#A1A1AA]/30 border-dashed rounded-xl py-10 items-center mb-10">
            <CloudUpload size={32} color="#ddb7ff" className="mb-4" />
            <Text className="text-white font-medium mb-2 text-base">Click to upload or drag & drop</Text>
            <Text className="text-[#A1A1AA] text-[10px]">PDF, JPG, or PNG (Max 5MB)</Text>
          </View>

          {/* Submit */}
          <Pressable className="bg-[#EABFFF] flex-row items-center justify-center py-5 rounded-xl shadow-lg shadow-[#EABFFF]/30">
            <Text className="text-[#150E22] font-bold text-lg mr-3">Submit Leave Application</Text>
            <Send size={20} color="#150E22" />
          </Pressable>
        </View>

        {/* Leave History */}
        <View className="flex-row justify-between items-end mb-6">
          <Text className="text-white text-[28px] font-bold tracking-tight">Leave History</Text>
          <Pressable className="flex-row items-center">
            <Text className="text-[#ddb7ff] text-sm font-bold tracking-wide mr-2">View All</Text>
            <ExternalLink size={16} color="#ddb7ff" />
          </Pressable>
        </View>

        <View className="space-y-4">
          {leaveHistory.map((log) => {
            const statusStyle = getStatusStyle(log.status);
            return (
              <View key={log.id} className="bg-[#1C1C1E] border border-white/5 rounded-[24px] p-6 shadow-lg mb-4">
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-row items-center">
                    <Text className="text-white font-bold text-lg mr-3">{log.date}</Text>
                    <View className="bg-[#2a2a35] px-3 py-1 rounded-md">
                      <Text className="text-[#A1A1AA] text-[10px] font-bold">{log.type}</Text>
                    </View>
                  </View>
                  <View className={`${statusStyle.bg} border ${statusStyle.border} px-3 py-1.5 rounded-full flex-row items-center`}>
                    {statusStyle.icon && <View className="w-1.5 h-1.5 rounded-full bg-[#facc15] mr-2" />}
                    <Text className={`${statusStyle.text} text-[11px] font-bold`}>{log.status}</Text>
                  </View>
                </View>
                
                {log.status === 'Rejected' ? (
                  <View className="border-l-[3px] border-[#ef4444] bg-[#ef4444]/5 p-4 rounded-r-xl my-2">
                    <Text className="text-[#ef4444]/90 text-sm leading-relaxed">{log.reason}</Text>
                  </View>
                ) : (
                  <Text className="text-[#A1A1AA] text-sm mb-4 italic">{log.reason}</Text>
                )}
                
                {log.meta ? (
                  <Text className="text-[#A1A1AA]/60 text-[11px] font-medium text-right mt-2">{log.meta}</Text>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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

export default LeaveApplicationScreen;
