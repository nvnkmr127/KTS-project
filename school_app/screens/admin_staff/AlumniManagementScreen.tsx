import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Image, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../components/GlassCard';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { 
  GraduationCap, Search, Mail, Phone, 
  Award, Briefcase, UserPlus
} from 'lucide-react-native';

interface AlumniRecord {
  id: string;
  name: string;
  batch: string;
  field: string;
  organization: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  achievement: string;
}

export const AlumniManagementScreen: React.FC<any> = ({ navigation }) => {
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  
  // New alumni state form
  const [newName, setNewName] = useState('');
  const [newBatch, setNewBatch] = useState('2024');
  const [newOrg, setNewOrg] = useState('');
  const [newRole, setNewRole] = useState('');

  const [alumniList, setAlumniList] = useState<AlumniRecord[]>([
    {
      id: '1',
      name: 'Rohan Deshmukh',
      batch: '2022',
      field: 'Computer Science',
      organization: 'Google Inc.',
      role: 'Software Engineer',
      email: 'rohan.d@alumni.edu',
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
      achievement: 'IIT Bombay Computer Science Gold Medalist'
    },
    {
      id: '2',
      name: 'Ananya Roy',
      batch: '2023',
      field: 'Medical Sciences',
      organization: 'AIIMS New Delhi',
      role: 'Resident Doctor',
      email: 'ananya.roy@aiims.edu',
      phone: '+91 98111 22334',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150',
      achievement: 'NEET AIR Top 50 Ranker'
    },
    {
      id: '3',
      name: 'Vikramaditya Rao',
      batch: '2021',
      field: 'Finance & Economics',
      organization: 'Goldman Sachs',
      role: 'Financial Analyst',
      email: 'vikram.rao@alumni.edu',
      phone: '+91 99887 76655',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150',
      achievement: 'Chartered Financial Analyst Level 2'
    },
    {
      id: '4',
      name: 'Priya Sharma',
      batch: '2024',
      field: 'Architecture',
      organization: 'SPA Delhi',
      role: 'Design Scholar',
      email: 'priya.s@spa.ac.in',
      phone: '+91 97766 55443',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150',
      achievement: 'National Young Architect Awardee'
    }
  ]);

  const batches = ['All', '2024', '2023', '2022', '2021'];

  const filteredAlumni = alumniList.filter(alumni => {
    const matchesBatch = selectedBatch === 'All' || alumni.batch === selectedBatch;
    const matchesSearch = alumni.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          alumni.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alumni.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBatch && matchesSearch;
  });

  const handleAddAlumni = () => {
    if (!newName.trim()) return;
    const newRecord: AlumniRecord = {
      id: Date.now().toString(),
      name: newName,
      batch: newBatch,
      field: 'General Studies',
      organization: newOrg || 'Independent Professional',
      role: newRole || 'Alumni Member',
      email: `${newName.toLowerCase().replace(/\s+/g, '.')}@alumni.edu`,
      phone: '+91 90000 12345',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150',
      achievement: 'Active Alumni Member'
    };
    setAlumniList([newRecord, ...alumniList]);
    setNewName('');
    setNewOrg('');
    setNewRole('');
    setAddModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <AdminStaffHeader 
        title="Alumni Directory"
        subtitle="ALUMNI & GRADUATES TERMINAL"
        onBackPress={() => navigation.goBack()}
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1] items-center justify-center shadow-[0_0_10px_rgba(0,241,161,0.5)]">
            <GraduationCap size={22} color="#101415" />
          </View>
        }
        rightAction={
          <Pressable 
            onPress={() => setAddModalVisible(true)}
            className="w-10 h-10 rounded-xl bg-[#00f1a1] items-center justify-center shadow-[0_0_10px_rgba(0,241,161,0.4)]"
          >
            <UserPlus size={20} color="#101415" />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stat Banner */}
        <View className="mb-5">
          <GlassCard intensity="low" className="p-4 border-[#00f1a1]/30 bg-[#101415]/80 flex-row justify-between items-center">
            <View>
              <Text className="text-white/60 text-xs font-semibold">TOTAL ALUMNI REGISTERED</Text>
              <Text className="text-[#00f1a1] text-2xl font-bold mt-0.5">{alumniList.length + 348} Members</Text>
              <Text className="text-white/40 text-[10px] mt-0.5">Across 12 Graduating Batches</Text>
            </View>
            <View className="w-12 h-12 rounded-2xl bg-[#00f1a1]/10 border border-[#00f1a1]/30 items-center justify-center">
              <GraduationCap size={26} color="#00f1a1" />
            </View>
          </GlassCard>
        </View>

        {/* Filter Pills */}
        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {batches.map((batch) => (
              <Pressable
                key={batch}
                onPress={() => setSelectedBatch(batch)}
                className={`px-4 py-2 rounded-xl border ${selectedBatch === batch ? 'bg-[#00f1a1] border-[#00f1a1]' : 'bg-[#101415] border-[#00f1a1]/20'}`}
              >
                <Text className={`text-xs font-bold ${selectedBatch === batch ? 'text-[#101415]' : 'text-white/80'}`}>
                  {batch === 'All' ? 'All Batches' : `Batch ${batch}`}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Search */}
        <View className="mb-5">
          <View className="flex-row items-center bg-[#101415] border border-[#00f1a1]/20 rounded-xl px-4 py-3">
            <Search size={18} color="#00f1a1" />
            <TextInput
              placeholder="Search by alumni name, company, or role..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white text-sm ml-2.5 p-0"
            />
          </View>
        </View>

        {/* Alumni Cards */}
        <View className="mb-6">
          <Text className="text-[#00f1a1] text-xs font-bold tracking-[0.2em] mb-4">ALUMNI MEMBERS</Text>

          {filteredAlumni.map((alumni) => (
            <GlassCard key={alumni.id} intensity="low" className="mb-4 p-4 border-[#00f1a1]/20 bg-[#101415]/80">
              <View className="flex-row items-center mb-3">
                <Image source={{ uri: alumni.avatar }} className="w-12 h-12 rounded-xl mr-3 border border-[#00f1a1]/30" />
                <View className="flex-1">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white font-bold text-base">{alumni.name}</Text>
                    <View className="bg-[#00f1a1]/10 border border-[#00f1a1]/30 px-2 py-0.5 rounded-full">
                      <Text className="text-[#00f1a1] text-[10px] font-bold">Class of {alumni.batch}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <Briefcase size={12} color="#00f1a1" />
                    <Text className="text-white/80 text-xs ml-1.5">{alumni.role} at <Text className="text-[#00f1a1] font-semibold">{alumni.organization}</Text></Text>
                  </View>
                </View>
              </View>

              {/* Achievement Badge */}
              <View className="bg-white/5 border border-white/10 rounded-xl p-2.5 mb-3 flex-row items-center">
                <Award size={16} color="#00f1a1" />
                <Text className="text-white/80 text-xs ml-2 flex-1" numberOfLines={1}>{alumni.achievement}</Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row items-center justify-between pt-2 border-t border-white/5" style={{ gap: 8 }}>
                <Pressable className="flex-1 bg-white/5 border border-white/10 py-2 rounded-xl flex-row items-center justify-center">
                  <Mail size={14} color="#00f1a1" />
                  <Text className="text-white text-xs font-semibold ml-1.5">Email</Text>
                </Pressable>
                <Pressable className="flex-1 bg-white/5 border border-white/10 py-2 rounded-xl flex-row items-center justify-center">
                  <Phone size={14} color="#00f1a1" />
                  <Text className="text-white text-xs font-semibold ml-1.5">Contact</Text>
                </Pressable>
              </View>
            </GlassCard>
          ))}
        </View>
      </ScrollView>

      {/* Add Alumni Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-[#101415] border-t border-[#00f1a1] p-6 rounded-t-3xl">
            <Text className="text-white text-xl font-bold mb-4">Add Alumni Member</Text>
            
            <Text className="text-white/60 text-xs mb-1 font-semibold">Full Name</Text>
            <TextInput 
              placeholder="e.g. Rahul Verma"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={newName}
              onChangeText={setNewName}
              className="bg-white/5 border border-white/10 rounded-xl text-white px-3 py-2.5 mb-3 text-sm"
            />

            <Text className="text-white/60 text-xs mb-1 font-semibold">Graduating Batch</Text>
            <TextInput 
              placeholder="e.g. 2024"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={newBatch}
              onChangeText={setNewBatch}
              className="bg-white/5 border border-white/10 rounded-xl text-white px-3 py-2.5 mb-3 text-sm"
            />

            <Text className="text-white/60 text-xs mb-1 font-semibold">Current Organization / University</Text>
            <TextInput 
              placeholder="e.g. Stanford University / Microsoft"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={newOrg}
              onChangeText={setNewOrg}
              className="bg-white/5 border border-white/10 rounded-xl text-white px-3 py-2.5 mb-3 text-sm"
            />

            <Text className="text-white/60 text-xs mb-1 font-semibold">Current Designation / Role</Text>
            <TextInput 
              placeholder="e.g. Research Scholar / Product Manager"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={newRole}
              onChangeText={setNewRole}
              className="bg-white/5 border border-white/10 rounded-xl text-white px-3 py-2.5 mb-5 text-sm"
            />

            <View className="flex-row" style={{ gap: 12 }}>
              <Pressable 
                onPress={() => setAddModalVisible(false)}
                className="flex-1 bg-white/10 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-bold">Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleAddAlumni}
                className="flex-1 bg-[#00f1a1] py-3 rounded-xl items-center"
              >
                <Text className="text-[#101415] font-bold">Save Member</Text>
              </Pressable>
            </View>
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

export default AlumniManagementScreen;
