import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../components/GlassCard';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { 
  TrendingUp, GraduationCap, Users, CheckCircle2, 
  Search, AlertCircle, ArrowUpRight, Check, RefreshCw
} from 'lucide-react-native';

interface PromotionBatch {
  id: string;
  fromClass: string;
  toClass: string;
  totalStudents: number;
  promotedCount: number;
  pendingCount: number;
  passPercentage: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export const ClassPromotionsScreen: React.FC<any> = ({ navigation }) => {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2024 - 2025');
  const [searchQuery, setSearchQuery] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<PromotionBatch | null>(null);

  const [batches, setBatches] = useState<PromotionBatch[]>([
    { id: '1', fromClass: 'Grade 9 - Sec A', toClass: 'Grade 10 - Sec A', totalStudents: 42, promotedCount: 40, pendingCount: 2, passPercentage: 95.2, status: 'in_progress' },
    { id: '2', fromClass: 'Grade 9 - Sec B', toClass: 'Grade 10 - Sec B', totalStudents: 38, promotedCount: 38, pendingCount: 0, passPercentage: 100, status: 'completed' },
    { id: '3', fromClass: 'Grade 10 - Sec A', toClass: 'Grade 11 - Science', totalStudents: 45, promotedCount: 41, pendingCount: 4, passPercentage: 91.1, status: 'pending' },
    { id: '4', fromClass: 'Grade 10 - Sec B', toClass: 'Grade 11 - Commerce', totalStudents: 40, promotedCount: 37, pendingCount: 3, passPercentage: 92.5, status: 'pending' },
    { id: '5', fromClass: 'Grade 11 - Sci A', toClass: 'Grade 12 - Sci A', totalStudents: 36, promotedCount: 36, pendingCount: 0, passPercentage: 100, status: 'completed' },
    { id: '6', fromClass: 'Grade 11 - Com A', toClass: 'Grade 12 - Com A', totalStudents: 34, promotedCount: 30, pendingCount: 4, passPercentage: 88.2, status: 'pending' },
  ]);

  const handlePromoteAll = (batch: PromotionBatch) => {
    setSelectedBatch(batch);
    setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, promotedCount: b.totalStudents, pendingCount: 0, status: 'completed' } : b));
    setSuccessModalVisible(true);
  };

  const filteredBatches = batches.filter(b => 
    b.fromClass.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.toClass.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEligible = batches.reduce((acc, curr) => acc + curr.totalStudents, 0);
  const totalPromoted = batches.reduce((acc, curr) => acc + curr.promotedCount, 0);
  const totalPending = batches.reduce((acc, curr) => acc + curr.pendingCount, 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <AdminStaffHeader 
        title="Class Promotions"
        subtitle="ACADEMIC PROMOTION TERMINAL"
        onBackPress={() => navigation.goBack()}
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1] items-center justify-center shadow-[0_0_10px_rgba(0,241,161,0.5)]">
            <TrendingUp size={22} color="#101415" />
          </View>
        }
        rightAction={
          <Pressable 
            onPress={() => setSelectedAcademicYear(selectedAcademicYear === '2024 - 2025' ? '2025 - 2026' : '2024 - 2025')}
            className="px-3 py-1.5 rounded-full bg-[#00f1a1]/10 border border-[#00f1a1]/30 flex-row items-center"
          >
            <RefreshCw size={12} color="#00f1a1" />
            <Text className="text-[#00f1a1] text-xs font-bold ml-1.5">{selectedAcademicYear}</Text>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stat Overview */}
        <View className="flex-row mb-6" style={{ gap: 12 }}>
          <GlassCard intensity="low" className="flex-1 p-3.5 border-[#00f1a1]/20 bg-[#101415]/80">
            <View className="flex-row items-center mb-1">
              <Users size={16} color="#00f1a1" />
              <Text className="text-white/60 text-[10px] font-bold uppercase ml-1.5">Eligible</Text>
            </View>
            <Text className="text-white text-xl font-bold">{totalEligible}</Text>
            <Text className="text-white/40 text-[10px] mt-0.5">Across 6 classes</Text>
          </GlassCard>

          <GlassCard intensity="low" className="flex-1 p-3.5 border-[#00f1a1]/20 bg-[#101415]/80">
            <View className="flex-row items-center mb-1">
              <CheckCircle2 size={16} color="#00f1a1" />
              <Text className="text-white/60 text-[10px] font-bold uppercase ml-1.5">Promoted</Text>
            </View>
            <Text className="text-[#00f1a1] text-xl font-bold">{totalPromoted}</Text>
            <Text className="text-[#00f1a1]/70 text-[10px] mt-0.5">{((totalPromoted / totalEligible) * 100).toFixed(1)}% Done</Text>
          </GlassCard>

          <GlassCard intensity="low" className="flex-1 p-3.5 border-[#ff516a]/30 bg-[#101415]/80">
            <View className="flex-row items-center mb-1">
              <AlertCircle size={16} color="#ff516a" />
              <Text className="text-white/60 text-[10px] font-bold uppercase ml-1.5">Pending</Text>
            </View>
            <Text className="text-[#ff516a] text-xl font-bold">{totalPending}</Text>
            <Text className="text-white/40 text-[10px] mt-0.5">Needs Review</Text>
          </GlassCard>
        </View>

        {/* Search */}
        <View className="mb-6">
          <View className="flex-row items-center bg-[#101415] border border-[#00f1a1]/20 rounded-xl px-4 py-3">
            <Search size={18} color="#00f1a1" />
            <TextInput
              placeholder="Search class batch..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white text-sm ml-2.5 p-0"
            />
          </View>
        </View>

        {/* Batch Promotion List */}
        <View className="mb-6">
          <Text className="text-[#00f1a1] text-xs font-bold tracking-[0.2em] mb-4">PROMOTION BATCHES</Text>
          
          {filteredBatches.map((batch) => (
            <GlassCard key={batch.id} intensity="low" className="mb-4 p-4 border-[#00f1a1]/20 bg-[#101415]/80">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center flex-1 pr-2">
                  <View className="w-10 h-10 rounded-xl bg-[#00f1a1]/10 border border-[#00f1a1]/30 items-center justify-center mr-3">
                    <GraduationCap size={20} color="#00f1a1" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-base">{batch.fromClass}</Text>
                    <View className="flex-row items-center mt-0.5">
                      <ArrowUpRight size={12} color="#00f1a1" />
                      <Text className="text-[#00f1a1] text-xs font-medium ml-1">Promotes to: {batch.toClass}</Text>
                    </View>
                  </View>
                </View>
                <View className={`px-2.5 py-1 rounded-full ${batch.status === 'completed' ? 'bg-[#00f1a1]/20 border border-[#00f1a1]/40' : 'bg-amber-500/20 border border-amber-500/40'}`}>
                  <Text className={`text-[10px] font-bold uppercase ${batch.status === 'completed' ? 'text-[#00f1a1]' : 'text-amber-400'}`}>
                    {batch.status === 'completed' ? 'Promoted' : 'In Progress'}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View className="mb-3 bg-white/5 h-2 rounded-full overflow-hidden">
                <View 
                  className="bg-[#00f1a1] h-full rounded-full" 
                  style={{ width: `${(batch.promotedCount / batch.totalStudents) * 100}%` }} 
                />
              </View>

              <View className="flex-row justify-between items-center pt-2 border-t border-white/5">
                <Text className="text-white/60 text-xs">
                  <Text className="text-white font-bold">{batch.promotedCount}</Text> / {batch.totalStudents} Promoted ({batch.passPercentage}% Pass Rate)
                </Text>
                {batch.status !== 'completed' ? (
                  <Pressable 
                    onPress={() => handlePromoteAll(batch)}
                    className="bg-[#00f1a1] px-3.5 py-1.5 rounded-lg flex-row items-center"
                  >
                    <Check size={14} color="#101415" />
                    <Text className="text-[#101415] text-xs font-bold ml-1">Promote Batch</Text>
                  </Pressable>
                ) : (
                  <View className="flex-row items-center">
                    <CheckCircle2 size={16} color="#00f1a1" />
                    <Text className="text-[#00f1a1] text-xs font-bold ml-1">Completed</Text>
                  </View>
                )}
              </View>
            </GlassCard>
          ))}
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className="bg-[#101415] border border-[#00f1a1] p-6 rounded-3xl w-full max-w-sm items-center">
            <View className="w-16 h-16 rounded-full bg-[#00f1a1]/20 items-center justify-center mb-4 border border-[#00f1a1]">
              <CheckCircle2 size={32} color="#00f1a1" />
            </View>
            <Text className="text-white text-xl font-bold text-center mb-2">Promotion Successful!</Text>
            <Text className="text-white/70 text-sm text-center mb-6">
              All eligible students from <Text className="text-[#00f1a1] font-bold">{selectedBatch?.fromClass}</Text> have been promoted to <Text className="text-[#00f1a1] font-bold">{selectedBatch?.toClass}</Text>.
            </Text>
            <Pressable 
              onPress={() => setSuccessModalVisible(false)}
              className="bg-[#00f1a1] py-3 px-8 rounded-xl w-full items-center"
            >
              <Text className="text-[#101415] font-bold text-base">Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
});

export default ClassPromotionsScreen;
