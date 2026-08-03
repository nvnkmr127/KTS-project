import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, TextInput, Image, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, Search, Plus, Trash2, X, Edit3, ShieldAlert, Key, UserCheck, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';

export const UserManagementScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filterChips = ['ALL', 'TEACHERS', 'ADMIN STAFF', 'PARENTS', 'STUDENTS'];

  const initialUsers = [
    {
      id: 'ED-001',
      name: 'Dr. Aris Thorne',
      role: 'Super Admin',
      status: 'Active',
      dept: 'ADMIN STAFF',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7FczfnKSVZ91VRiIfuBtOEhmA6JLz4YPSk40CQrAgXsqPb5NWWdCqqmzVpJNDpnxQSdecTP5pe54DRMCbFkMlfR4K5JBMwr9Z9rd-f_05dfhdy0ThMgGq6naYJfCjz3amVCvWhbnfwiSLhYOXSuGF55kpWsfljF4nv2FiNP_5euYTdpm0iAi6VVUFf6QUENV0LTmHNXvfAU9c2xBiXHTKJ_79usdMqTNH6H7v68K2SpfvOTvVJlisZuBp-236LvhLC0HnSYL9q8Sc'
    },
    {
      id: 'ED-042',
      name: 'Elena Vance',
      role: 'Faculty Lead',
      status: 'Active',
      dept: 'TEACHERS',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAbIIb4sf36g4piMdrvBNVB1flfK5K4fvpkp2tU5bPRSk8zfl2WZ0_1u48KaVT-3_ddiHuw_L0VKjKiLGdUkACDp51MHvn7-ZTKkHfmZCfxeAsconMBJiqfLyflTSp4atRos77YiCx_WIh-U8_mO0KxP-fCMMqdY0MErnSL_BFX43rWECs46mYJuZxHP3Lc-jd6TwoIGOA8JMO2acJZa5YEwl6Zkpt7LBEWYWk2LQhz8-BHtPxMXepa5Daw4Jme8b4r61tmMRyls4B'
    },
    {
      id: 'ED-119',
      name: 'Julian Cross',
      role: 'Maintenance',
      status: 'Inactive',
      dept: 'ADMIN STAFF',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRaycB-Wyu41EKOMMtmM3YWEFrVdojgfU3_5qSmpOHS8GRlo5CBaQzfsbFcnkr2tDmNH_pJXERl_yljGxB5Q2xNkvSX-b-OlbYNg4SudoGa1kDIe93_zetttzF7uLG1ZqM4ZjgOzhMqUISyawr-YCxw3N7191XeK_dzKPHwFchEqQwZH42aftmYx9JYVR0n_ARHDmD9UeYkClAm3z1C0ndeQ2DwbSvkaK9A00JZmQ3dTdp9i0-62M4jNN0QHDDm9_Q34b-s5vuF8n6'
    },
    {
      id: 'ED-088',
      name: 'Sarah Miller',
      role: 'IT Staff',
      status: 'Active',
      dept: 'ADMIN STAFF',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATGx8K-AMlbETqeD1LJDxRj1StJ7Hosbnah3FKl7sA7ixCU6ViCJ9ujHoGZZt_ITi-ivQ0kTlsWSmP5rpEr96u3hDVNqTD2-FYSxcUJUijYB9g62JjQj22VzmqmzRp8pYQHRDic745h6RZcsVB6RNQp_FlLrybM5B3_kkPSdl11syt5HQwetav4LkaZm-BhCy4IoUth1LGvRXt2UL5lQzm4MwwOJuFuaJI8uINO4AL_ci_QOi1K-Y0WxPcLxhdiO5ejvWUb9yNgC-Q'
    },
    {
      id: 'ED-412',
      name: 'Dorian Black',
      role: 'Prefect',
      status: 'Active',
      dept: 'STUDENTS',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAndwa0JtwR8W_27didVnmC9PrLPiL350lGvC9yHH9dKTtsry4veG7zNtHXFU8KSBiTYmzKFGXBu9U4EfP96PCjPpZrc4K3K3fW7zQuAsbXBeV92AKeWrYXQsa1cuaCIMFsejBWTS76em22m3o9ws3h5pSORTkou6e7zsApA0iYI5gCRSswn5vBiD-A1z0VKRD5r300bhBhIKYJoGBP5JSFUkEbS4ImPuzJpE_kExhhiwkQI42EE6dSyzdv3RZDBRRgy8OaixcSJSGh'
    }
  ];

  const [users, setUsers] = useState(initialUsers);

  const filteredUsers = users.filter(u => {
    const matchesFilter = filter === 'ALL' || u.dept === filter;
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenUserModal = (user: any) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1d2022', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header with Custom Glow Shadow */}
      <View style={{ zIndex: 50 }}>
        {/* Top App Bar */}
        <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 28 : 20) }]}>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => navigation.goBack()} className="p-1 active:scale-95">
              <ChevronLeft size={24} color="#ffe5a0" />
            </Pressable>
            <Text className="text-xl font-bold text-white font-display-lg">User Management</Text>
          </View>
          <Pressable className="bg-[#f0c110] w-9 h-9 rounded-full items-center justify-center active:scale-95 shadow-[0_0_12px_rgba(240,193,16,0.4)]">
            <Plus size={18} color="#000" />
          </Pressable>
        </BlurView>
        
        {/* The glowing shadow below the line */}
        <LinearGradient 
          colors={['rgba(245, 197, 24, 0.15)', 'transparent']} 
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
            <Search size={18} color="rgba(255,255,255,0.4)" style={{ marginRight: 12 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search elite personnel..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="flex-1 text-white font-body-md text-sm"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Filter Chips */}
        <View className="mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
            {filterChips.map((c) => (
              <Pressable
                key={c}
                onPress={() => setFilter(c)}
                className={`px-5 py-2.5 rounded-full mr-3 border ${filter === c
                    ? 'bg-[#f0c110] border-[#f0c110] shadow-[0_0_12px_rgba(240,193,16,0.3)]'
                    : 'bg-white/5 border-white/10'
                  }`}
              >
                <Text className={`text-xs font-semibold ${filter === c ? 'text-[#000]' : 'text-white/60'}`}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* User list */}
        <View className="px-5 gap-4 mb-8">
          {filteredUsers.map((u, idx) => (
            <Pressable
              key={u.id}
              onPress={() => handleOpenUserModal(u)}
              className="active:scale-[0.99] transition-all"
            >
              <GlassCard className="p-4 border border-white/10 flex-row items-center justify-between" intensity="low">
                <View className="flex-row items-center gap-4 flex-1">
                  <View className="relative">
                    <Image
                      source={{ uri: u.avatar }}
                      className="w-14 h-14 rounded-2xl border border-white/10"
                      style={{ resizeMode: 'cover' }}
                    />
                    <View
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-[#101415] ${u.status === 'Active' ? 'bg-[#41eec2]' : 'bg-[#ffb4ab]'
                        }`}
                    />
                  </View>
                  <View className="gap-1 flex-1 pr-4">
                    <Text className="text-white font-bold text-[16px]">{u.name}</Text>
                    <View className="flex-row items-center gap-2 mt-0.5">
                      <View className="px-2 py-0.5 rounded bg-[#f5c518]/10 border border-[#f5c518]/20">
                        <Text className="text-[#ffe5a0] text-[9px] font-bold uppercase">{u.role}</Text>
                      </View>
                      <Text className="text-white/40 text-xs font-semibold">ID: {u.id}</Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
              </GlassCard>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* User Details bottom sheet modal */}
      {selectedUser && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent} className="glass-card">
              <View className="p-8">
                {/* Header */}
                <View className="flex-row justify-between items-start mb-6">
                  <View className="w-24 h-24 rounded-3xl bg-white/5 border border-white/20 p-1">
                    <Image
                      source={{ uri: selectedUser.avatar }}
                      className="w-full h-full rounded-2xl"
                      style={{ resizeMode: 'cover' }}
                    />
                  </View>
                  <Pressable
                    onPress={() => setModalVisible(false)}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center hover:bg-white/20"
                  >
                    <X size={20} color="#fff" />
                  </Pressable>
                </View>

                {/* Profile detail */}
                <View className="mb-8">
                  <Text className="text-white text-2xl font-bold font-display-lg mb-1">{selectedUser.name}</Text>
                  <Text className="text-[#ffe5a0] text-sm font-bold tracking-widest uppercase">{selectedUser.role}</Text>
                  <View className="flex-row items-center gap-2 mt-3">
                    <View className={`w-2 h-2 rounded-full ${selectedUser.status === 'Active' ? 'bg-[#41eec2]' : 'bg-[#ffb4ab]'}`} />
                    <Text className="text-white/50 text-sm">System Status: {selectedUser.status}</Text>
                  </View>
                </View>

                {/* Actions Grid */}
                <View className="flex-row flex-wrap justify-between gap-y-3 mb-4">
                  {/* Action 1: Edit Profile */}
                  <Pressable className="w-[48%] flex-row items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 active:bg-white/10">
                    <Edit3 size={18} color="#ffe5a0" />
                    <View>
                      <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider">MANAGE</Text>
                      <Text className="text-white font-semibold text-xs mt-0.5">Edit Profile</Text>
                    </View>
                  </Pressable>

                  {/* Action 2: Reset Pass */}
                  <Pressable className="w-[48%] flex-row items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 active:bg-white/10">
                    <Key size={18} color="#ffe5a0" />
                    <View>
                      <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider">SECURITY</Text>
                      <Text className="text-white font-semibold text-xs mt-0.5">Reset Pass</Text>
                    </View>
                  </Pressable>

                  {/* Action 3: Assign Role */}
                  <Pressable className="w-[48%] flex-row items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 active:bg-white/10">
                    <Shield size={18} color="#ffe5a0" />
                    <View>
                      <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider">ACCESS</Text>
                      <Text className="text-white font-semibold text-xs mt-0.5">Assign Role</Text>
                    </View>
                  </Pressable>

                  {/* Action 4: Delete User */}
                  <Pressable
                    onPress={() => handleDeleteUser(selectedUser.id)}
                    className="w-[48%] flex-row items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 active:bg-red-500/20"
                  >
                    <Trash2 size={18} color="#ffb4ab" />
                    <View>
                      <Text className="text-red-400/60 text-[9px] font-bold uppercase tracking-wider">DANGER</Text>
                      <Text className="text-[#ffb4ab] font-semibold text-xs mt-0.5">Delete User</Text>
                    </View>
                  </Pressable>
                </View>
              </View>

              {/* Modal footer logs */}
              <View className="p-6 bg-white/5 border-t border-white/10 flex-row items-center justify-between">
                <Text className="text-xs text-white/40">Last access: Today at 09:42 AM</Text>
                <Pressable className="px-5 py-2 rounded-full border border-[#ffe5a0] active:bg-[#ffe5a0] active:text-[#000]">
                  <Text className="text-[#ffe5a0] text-[10px] font-bold uppercase tracking-wider">View Logs</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101415',
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#16191b',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
});

export default UserManagementScreen;
