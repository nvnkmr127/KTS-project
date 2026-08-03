import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../components/GlassCard';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { 
  Calendar, Palmtree, Sparkles, Plus, Search, 
  Clock
} from 'lucide-react-native';

interface Holiday {
  id: string;
  title: string;
  date: string;
  day: string;
  type: 'National' | 'Festival' | 'Term Break' | 'Staff Special';
  daysCount: number;
  description: string;
}

export const HolidayCalendarScreen: React.FC<any> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Form State
  const [hTitle, setHTitle] = useState('');
  const [hDate, setHDate] = useState('');
  const [hDesc, setHDesc] = useState('');

  const [holidays, setHolidays] = useState<Holiday[]>([
    {
      id: '1',
      title: 'Independence Day',
      date: 'Aug 15, 2026',
      day: 'Saturday',
      type: 'National',
      daysCount: 1,
      description: 'National holiday honoring independence. Flag hoisting at 08:30 AM.'
    },
    {
      id: '2',
      title: 'Ganesh Chaturthi',
      date: 'Sep 07, 2026',
      day: 'Monday',
      type: 'Festival',
      daysCount: 1,
      description: 'School holiday on account of Ganesh Chaturthi festivities.'
    },
    {
      id: '3',
      title: 'Mahatma Gandhi Jayanti',
      date: 'Oct 02, 2026',
      day: 'Friday',
      type: 'National',
      daysCount: 1,
      description: 'National Holiday celebrating Gandhi Jayanti.'
    },
    {
      id: '4',
      title: 'Diwali & Autumn Vacation',
      date: 'Nov 08 - Nov 15, 2026',
      day: 'Sun - Sun',
      type: 'Term Break',
      daysCount: 8,
      description: 'Annual autumn festival break for students and faculty.'
    },
    {
      id: '5',
      title: 'Christmas & Winter Break',
      date: 'Dec 24 - Jan 01, 2027',
      day: 'Thu - Fri',
      type: 'Term Break',
      daysCount: 9,
      description: 'Winter recess break before Term 2 exams.'
    }
  ]);

  const categories = ['All', 'National', 'Festival', 'Term Break', 'Staff Special'];

  const filteredHolidays = holidays.filter(h => {
    const matchesCat = selectedCategory === 'All' || h.type === selectedCategory;
    const matchesSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          h.date.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAddHoliday = () => {
    if (!hTitle.trim() || !hDate.trim()) return;
    const newH: Holiday = {
      id: Date.now().toString(),
      title: hTitle,
      date: hDate,
      day: 'Scheduled',
      type: 'Festival',
      daysCount: 1,
      description: hDesc || 'School holiday declared by management.'
    };
    setHolidays([...holidays, newH]);
    setHTitle('');
    setHDate('');
    setHDesc('');
    setAddModalVisible(false);
  };

  const getTagColor = (type: string) => {
    switch (type) {
      case 'National': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Festival': return 'bg-[#00f1a1]/20 text-[#00f1a1] border-[#00f1a1]/40';
      case 'Term Break': return 'bg-sky-500/20 text-sky-400 border-sky-500/40';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
    }
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
        title="Holiday Calendar"
        subtitle="HOLIDAY & ACADEMIC SCHEDULE"
        onBackPress={() => navigation.goBack()}
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1] items-center justify-center shadow-[0_0_10px_rgba(0,241,161,0.5)]">
            <Palmtree size={22} color="#101415" />
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
              <Text className="text-white/60 text-xs font-semibold">TOTAL HOLIDAYS THIS YEAR</Text>
              <Text className="text-[#00f1a1] text-2xl font-bold mt-0.5">{holidays.reduce((a, b) => a + b.daysCount, 0)} Days Off</Text>
              <Text className="text-white/40 text-[10px] mt-0.5">Upcoming: Independence Day (Aug 15)</Text>
            </View>
            <View className="w-12 h-12 rounded-2xl bg-[#00f1a1]/10 border border-[#00f1a1]/30 items-center justify-center">
              <Palmtree size={26} color="#00f1a1" />
            </View>
          </GlassCard>
        </View>

        {/* Category Pills */}
        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {categories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl border ${selectedCategory === cat ? 'bg-[#00f1a1] border-[#00f1a1]' : 'bg-[#101415] border-[#00f1a1]/20'}`}
              >
                <Text className={`text-xs font-bold ${selectedCategory === cat ? 'text-[#101415]' : 'text-white/80'}`}>
                  {cat}
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
              placeholder="Search holiday name or date..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white text-sm ml-2.5 p-0"
            />
          </View>
        </View>

        {/* Holiday Cards */}
        <View className="mb-6">
          <Text className="text-[#00f1a1] text-xs font-bold tracking-[0.2em] mb-4">HOLIDAY SCHEDULE</Text>

          {filteredHolidays.map((item) => (
            <GlassCard key={item.id} intensity="low" className="mb-4 p-4 border-[#00f1a1]/20 bg-[#101415]/80">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1 mr-2">
                  <Text className="text-white font-bold text-base">{item.title}</Text>
                  <View className="flex-row items-center mt-1">
                    <Calendar size={14} color="#00f1a1" />
                    <Text className="text-[#00f1a1] text-xs font-semibold ml-1.5">{item.date} ({item.day})</Text>
                  </View>
                </View>
                <View className={`px-2.5 py-1 rounded-full border ${getTagColor(item.type)}`}>
                  <Text className="text-[10px] font-bold">{item.type}</Text>
                </View>
              </View>

              <Text className="text-white/70 text-xs mt-1 mb-3 leading-4">{item.description}</Text>

              <View className="pt-2 border-t border-white/5 flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <Clock size={12} color="rgba(255,255,255,0.5)" />
                  <Text className="text-white/50 text-xs ml-1">Duration: <Text className="text-white font-semibold">{item.daysCount} {item.daysCount === 1 ? 'Day' : 'Days'}</Text></Text>
                </View>
                <View className="flex-row items-center">
                  <Sparkles size={14} color="#00f1a1" />
                  <Text className="text-[#00f1a1] text-xs font-semibold ml-1">Official Holiday</Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>
      </ScrollView>

      {/* Add Holiday Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-[#101415] border-t border-[#00f1a1] p-6 rounded-t-3xl">
            <Text className="text-white text-xl font-bold mb-4">Declare New Holiday</Text>
            
            <Text className="text-white/60 text-xs mb-1 font-semibold">Holiday Title</Text>
            <TextInput 
              placeholder="e.g. Founder's Day Holiday"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={hTitle}
              onChangeText={setHTitle}
              className="bg-white/5 border border-white/10 rounded-xl text-white px-3 py-2.5 mb-3 text-sm"
            />

            <Text className="text-white/60 text-xs mb-1 font-semibold">Date / Duration</Text>
            <TextInput 
              placeholder="e.g. Sep 25, 2026"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={hDate}
              onChangeText={setHDate}
              className="bg-white/5 border border-white/10 rounded-xl text-white px-3 py-2.5 mb-3 text-sm"
            />

            <Text className="text-white/60 text-xs mb-1 font-semibold">Description</Text>
            <TextInput 
              placeholder="e.g. Special administrative holiday..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={hDesc}
              onChangeText={setHDesc}
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
                onPress={handleAddHoliday}
                className="flex-1 bg-[#00f1a1] py-3 rounded-xl items-center"
              >
                <Text className="text-[#101415] font-bold">Publish Holiday</Text>
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

export default HolidayCalendarScreen;
