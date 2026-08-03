import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Switch, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../components/GlassCard';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { 
  Layers, Plus, Search, Tag, Edit3
} from 'lucide-react-native';

interface FeeCategory {
  id: string;
  name: string;
  code: string;
  frequency: 'Monthly' | 'Quarterly' | 'Annually' | 'One-Time';
  amount: number;
  classesApplicable: string;
  isMandatory: boolean;
  status: 'active' | 'inactive';
}

export const FeeCategoryScreen: React.FC<any> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Form state
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catAmount, setCatAmount] = useState('');
  const [catFreq, setCatFreq] = useState<'Monthly' | 'Quarterly' | 'Annually' | 'One-Time'>('Quarterly');

  const [categories, setCategories] = useState<FeeCategory[]>([
    {
      id: '1',
      name: 'Tuition Fee',
      code: 'FEE-TUIT',
      frequency: 'Quarterly',
      amount: 14500,
      classesApplicable: 'Grades 1 to 12',
      isMandatory: true,
      status: 'active'
    },
    {
      id: '2',
      name: 'Computer & Science Lab Fee',
      code: 'FEE-LAB',
      frequency: 'Quarterly',
      amount: 3200,
      classesApplicable: 'Grades 6 to 12',
      isMandatory: true,
      status: 'active'
    },
    {
      id: '3',
      name: 'School Transport & Bus Fee',
      code: 'FEE-TRANS',
      frequency: 'Monthly',
      amount: 2500,
      classesApplicable: 'Opt-in Transport Users',
      isMandatory: false,
      status: 'active'
    },
    {
      id: '4',
      name: 'Annual Sports & Activity Fee',
      code: 'FEE-SPORT',
      frequency: 'Annually',
      amount: 5000,
      classesApplicable: 'Grades 1 to 12',
      isMandatory: true,
      status: 'active'
    },
    {
      id: '5',
      name: 'Admission & Registration Charge',
      code: 'FEE-ADM',
      frequency: 'One-Time',
      amount: 25000,
      classesApplicable: 'New Entrants Only',
      isMandatory: true,
      status: 'active'
    }
  ]);

  const toggleStatus = (id: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c));
  };

  const handleAddCategory = () => {
    if (!catName.trim() || !catAmount) return;
    const newCat: FeeCategory = {
      id: Date.now().toString(),
      name: catName,
      code: catCode || `FEE-${catName.substring(0, 4).toUpperCase()}`,
      frequency: catFreq,
      amount: parseFloat(catAmount) || 0,
      classesApplicable: 'Grades 1 to 12',
      isMandatory: true,
      status: 'active'
    };
    setCategories([...categories, newCat]);
    setCatName('');
    setCatCode('');
    setCatAmount('');
    setAddModalVisible(false);
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <AdminStaffHeader 
        title="Fee Categories"
        subtitle="STRUCTURE & HEAD TERMINAL"
        onBackPress={() => navigation.goBack()}
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1] items-center justify-center shadow-[0_0_10px_rgba(0,241,161,0.5)]">
            <Tag size={22} color="#101415" />
          </View>
        }
        rightAction={
          <Pressable 
            onPress={() => setAddModalVisible(true)}
            className="w-10 h-10 rounded-xl bg-[#00f1a1] items-center justify-center shadow-[0_0_10px_rgba(0,241,161,0.4)]"
          >
            <Plus size={22} color="#101415" />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View className="mb-5">
          <GlassCard intensity="low" className="p-4 border-[#00f1a1]/30 bg-[#101415]/80 flex-row justify-between items-center">
            <View>
              <Text className="text-white/60 text-xs font-semibold">CONFIGURED FEE TYPES</Text>
              <Text className="text-[#00f1a1] text-2xl font-bold mt-0.5">{categories.length} Categories</Text>
              <Text className="text-white/40 text-[10px] mt-0.5">Active Academic Session 2024-25</Text>
            </View>
            <View className="w-12 h-12 rounded-2xl bg-[#00f1a1]/10 border border-[#00f1a1]/30 items-center justify-center">
              <Layers size={26} color="#00f1a1" />
            </View>
          </GlassCard>
        </View>

        {/* Search */}
        <View className="mb-5">
          <View className="flex-row items-center bg-[#101415] border border-[#00f1a1]/20 rounded-xl px-4 py-3">
            <Search size={18} color="#00f1a1" />
            <TextInput
              placeholder="Search fee category or code..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white text-sm ml-2.5 p-0"
            />
          </View>
        </View>

        {/* Category Items */}
        <View className="mb-6">
          <Text className="text-[#00f1a1] text-xs font-bold tracking-[0.2em] mb-4">ALL CATEGORIES</Text>

          {filteredCategories.map((item) => (
            <GlassCard key={item.id} intensity="low" className="mb-4 p-4 border-[#00f1a1]/20 bg-[#101415]/80">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center">
                    <Tag size={16} color="#00f1a1" />
                    <Text className="text-white font-bold text-base ml-2">{item.name}</Text>
                  </View>
                  <Text className="text-white/40 text-xs font-mono mt-0.5 ml-6">Code: {item.code}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-[#00f1a1] text-lg font-bold">₹{item.amount.toLocaleString()}</Text>
                  <Text className="text-white/60 text-[10px] uppercase font-semibold">{item.frequency}</Text>
                </View>
              </View>

              <View className="bg-white/5 border border-white/10 rounded-xl p-2.5 mb-3 flex-row justify-between items-center">
                <Text className="text-white/70 text-xs">Applicable: <Text className="text-white font-medium">{item.classesApplicable}</Text></Text>
                <View className={`px-2 py-0.5 rounded-full ${item.isMandatory ? 'bg-[#00f1a1]/20 border border-[#00f1a1]/40' : 'bg-white/10'}`}>
                  <Text className={`text-[10px] font-bold ${item.isMandatory ? 'text-[#00f1a1]' : 'text-white/60'}`}>
                    {item.isMandatory ? 'Mandatory' : 'Optional'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between pt-2 border-t border-white/5">
                <View className="flex-row items-center">
                  <Text className="text-white/60 text-xs mr-2">Status:</Text>
                  <Switch
                    value={item.status === 'active'}
                    onValueChange={() => toggleStatus(item.id)}
                    trackColor={{ false: '#333', true: 'rgba(0, 241, 161, 0.4)' }}
                    thumbColor={item.status === 'active' ? '#00f1a1' : '#999'}
                  />
                  <Text className={`text-xs font-bold ml-2 ${item.status === 'active' ? 'text-[#00f1a1]' : 'text-white/40'}`}>
                    {item.status === 'active' ? 'Active' : 'Inactive'}
                  </Text>
                </View>

                <Pressable 
                  onPress={() => navigation.navigate('AssignFeeStructure')}
                  className="bg-[#00f1a1]/10 border border-[#00f1a1]/30 px-3 py-1.5 rounded-lg flex-row items-center"
                >
                  <Edit3 size={14} color="#00f1a1" />
                  <Text className="text-[#00f1a1] text-xs font-bold ml-1">Configure</Text>
                </Pressable>
              </View>
            </GlassCard>
          ))}
        </View>
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-[#101415] border-t border-[#00f1a1] p-6 rounded-t-3xl">
            <Text className="text-white text-xl font-bold mb-4">Create Fee Category</Text>
            
            <Text className="text-white/60 text-xs mb-1 font-semibold">Category Name</Text>
            <TextInput 
              placeholder="e.g. Science Lab Fee"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={catName}
              onChangeText={setCatName}
              className="bg-white/5 border border-white/10 rounded-xl text-white px-3 py-2.5 mb-3 text-sm"
            />

            <Text className="text-white/60 text-xs mb-1 font-semibold">Category Code</Text>
            <TextInput 
              placeholder="e.g. FEE-LAB"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={catCode}
              onChangeText={setCatCode}
              className="bg-white/5 border border-white/10 rounded-xl text-white px-3 py-2.5 mb-3 text-sm"
            />

            <Text className="text-white/60 text-xs mb-1 font-semibold">Amount (₹)</Text>
            <TextInput 
              placeholder="e.g. 3500"
              keyboardType="numeric"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={catAmount}
              onChangeText={setCatAmount}
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
                onPress={handleAddCategory}
                className="flex-1 bg-[#00f1a1] py-3 rounded-xl items-center"
              >
                <Text className="text-[#101415] font-bold">Add Category</Text>
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

export default FeeCategoryScreen;
