import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput, BackHandler } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Calendar, Plus, Trash2, Pencil, CheckCircle2, 
  AlertCircle, X, Clock, PartyPopper, Flag, School, Search, ChevronLeft, ChevronRight, Check, Sparkles
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';

export interface HolidayItem {
  id: string;
  title: string;
  dateRange: string;
  type: 'National' | 'Festival' | 'Institutional' | 'Vacation';
  description: string;
  dateStr?: string; // YYYY-MM-DD format for calendar mapping
  color?: string;
}

const MOCK_HOLIDAYS: HolidayItem[] = [
  { id: 'hol_1', title: 'Independence Day', dateRange: '15 Aug 2026', dateStr: '2026-08-15', type: 'National', description: 'National Holiday celebrating Indian Independence', color: '#00f1a1' },
  { id: 'hol_2', title: 'Ganesh Chaturthi', dateRange: '07 Sep 2026', dateStr: '2026-09-07', type: 'Festival', description: 'Ganesh Chaturthi Festival holiday', color: '#f59e0b' },
  { id: 'hol_3', title: 'Gandhi Jayanti', dateRange: '02 Oct 2026', dateStr: '2026-10-02', type: 'National', description: 'Mahatma Gandhi Jayanti holiday', color: '#ef4444' },
  { id: 'hol_4', title: 'Dussehra Break', dateRange: '20 Oct 2026', dateStr: '2026-10-20', type: 'Vacation', description: 'Dussehra term break for all classes', color: '#a855f7' },
  { id: 'hol_5', title: 'Telangana Formation Day', dateRange: '02 Jun 2026', dateStr: '2026-06-02', type: 'National', description: 'Official State Holiday', color: '#ef4444' },
  { id: 'hol_6', title: 'Ramzan / Eid-ul-Fitr', dateRange: '16 Jun 2026', dateStr: '2026-06-16', type: 'Festival', description: 'Festival holiday', color: '#3b82f6' }
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const HIGHLIGHT_COLORS = ['#ef4444', '#3b82f6', '#00f1a1', '#a855f7', '#f59e0b'];

export const HolidayCalendarScreen: React.FC<any> = ({ navigation: propNavigation }) => {
  const navigation = useNavigation<any>() || propNavigation;
  const [holidays, setHolidays] = useState<HolidayItem[]>(MOCK_HOLIDAYS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter Pill States: All, Calendar, National, Festival, Institutional, Vacation
  const [typeFilter, setTypeFilter] = useState<'All' | 'Calendar' | 'National' | 'Festival' | 'Institutional' | 'Vacation'>('All');

  // Calendar Grid Month/Year State (Default June 2026 per web design)
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(5); // 5 = June (0-indexed)

  // Configure School Holiday Popup Modal State (Matching Web Screenshot 2)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedConfigDate, setSelectedConfigDate] = useState<string>('02-06-2026');
  const [isMarkedAsHoliday, setIsMarkedAsHoliday] = useState<boolean>(true);
  const [configHolidayName, setConfigHolidayName] = useState<string>('');
  const [configDescription, setConfigDescription] = useState<string>('');
  const [configColor, setConfigColor] = useState<string>('#ef4444');

  // Standard Add/Edit Modal State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<HolidayItem | null>(null);

  // Form States
  const [formTitle, setFormTitle] = useState('');
  const [formDateRange, setFormDateRange] = useState('');
  const [formType, setFormType] = useState<'National' | 'Festival' | 'Institutional' | 'Vacation'>('Festival');
  const [formDescription, setFormDescription] = useState('');

  // Toast Notification
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'warning' }>({
    visible: false, title: '', message: '', type: 'success'
  });

  // Safe Navigation & Hardware Back Button Handling
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (showConfigModal) {
          setShowConfigModal(false);
          return true;
        }
        if (showAddEditModal) {
          setShowAddEditModal(false);
          return true;
        }
        if (navigation?.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [showConfigModal, showAddEditModal, navigation])
  );

  const showToast = (title: string, message: string, type: 'success' | 'warning' = 'success') => {
    setToastData({ visible: true, title, message, type });
    setTimeout(() => setToastData(prev => ({ ...prev, visible: false })), 3000);
  };

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await api.getResources('holidays');
        if (Array.isArray(res) && res.length > 0) {
          const mapped: HolidayItem[] = res.map((h: any) => ({
            id: String(h.id),
            title: h.title || h.name || 'School Holiday',
            dateRange: h.date_range || h.start_date || '15 Aug 2026',
            dateStr: h.date || h.start_date || '2026-08-15',
            type: (h.type || 'Festival') as any,
            description: h.description || 'Official school holiday',
            color: h.color || '#ef4444',
          }));
          setHolidays(mapped);
        }
      } catch (err) {
        console.log('Error loading holidays:', err);
      }
    };
    fetchHolidays();
  }, []);

  // Open Configure Holiday Modal for a specific date (Matches Web Screenshot 2)
  const handleOpenDateConfigModal = (dayNumber: number) => {
    const monthStr = String(calendarMonth + 1).padStart(2, '0');
    const dayStr = String(dayNumber).padStart(2, '0');
    const formattedDateStr = `${calendarYear}-${monthStr}-${dayStr}`;
    const displayDate = `${dayStr}-${monthStr}-${calendarYear}`;

    const existing = holidays.find(h => h.dateStr === formattedDateStr || h.dateRange.includes(`${dayNumber} ${MONTH_NAMES[calendarMonth].slice(0, 3)}`));

    setSelectedConfigDate(displayDate);
    setIsMarkedAsHoliday(!!existing);
    setConfigHolidayName(existing ? existing.title : '');
    setConfigDescription(existing ? existing.description : '');
    setConfigColor(existing && existing.color ? existing.color : '#ef4444');
    setShowConfigModal(true);
  };

  // Save Configure Holiday Modal
  const handleSaveHolidayConfig = async () => {
    const [dd, mm, yyyy] = selectedConfigDate.split('-');
    const formattedIsoDate = `${yyyy}-${mm}-${dd}`;
    const formattedDisplayDate = `${parseInt(dd)} ${MONTH_NAMES[parseInt(mm) - 1].slice(0, 3)} ${yyyy}`;

    if (!isMarkedAsHoliday) {
      setHolidays(prev => prev.filter(h => h.dateStr !== formattedIsoDate));
      setShowConfigModal(false);
      showToast('Config Saved', `Holiday removed for ${selectedConfigDate}.`);
      return;
    }

    if (!configHolidayName.trim()) {
      showToast('Missing Name', 'Please enter holiday name.', 'warning');
      return;
    }

    const newHoliday: HolidayItem = {
      id: `hol_${Date.now()}`,
      title: configHolidayName,
      dateRange: formattedDisplayDate,
      dateStr: formattedIsoDate,
      type: 'Festival',
      description: configDescription || 'Official School Holiday',
      color: configColor,
    };

    setHolidays(prev => {
      const filtered = prev.filter(h => h.dateStr !== formattedIsoDate);
      return [...filtered, newHoliday];
    });

    try {
      await api.createResource('holidays', {
        title: configHolidayName,
        date: formattedIsoDate,
        description: configDescription,
        color: configColor,
      });
    } catch (e) {
      console.log('Error saving holiday to DB:', e);
    }

    setShowConfigModal(false);
    showToast('Holiday Saved!', `Successfully configured ${configHolidayName} for ${selectedConfigDate}.`);
  };

  const handleOpenAdd = () => {
    setEditingHoliday(null);
    setFormTitle('');
    setFormDateRange('15 Aug 2026');
    setFormType('National');
    setFormDescription('Official academic holiday');
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (hol: HolidayItem) => {
    setEditingHoliday(hol);
    setFormTitle(hol.title);
    setFormDateRange(hol.dateRange);
    setFormType(hol.type);
    setFormDescription(hol.description);
    setShowAddEditModal(true);
  };

  const handleSaveHoliday = () => {
    if (!formTitle.trim()) {
      showToast('Missing Title', 'Please enter holiday title.', 'warning');
      return;
    }

    if (editingHoliday) {
      setHolidays(prev => prev.map(h => h.id === editingHoliday.id ? {
        ...h,
        title: formTitle,
        dateRange: formDateRange,
        type: formType,
        description: formDescription
      } : h));
      showToast('Holiday Updated', `Successfully updated "${formTitle}".`);
    } else {
      const newHol: HolidayItem = {
        id: `hol_${Date.now()}`,
        title: formTitle,
        dateRange: formDateRange,
        type: formType,
        description: formDescription
      };
      setHolidays(prev => [newHol, ...prev]);
      showToast('Holiday Created', `Added "${formTitle}" to calendar.`);
    }

    setShowAddEditModal(false);
  };

  const handleDeleteHoliday = () => {
    if (!deletingHoliday) return;
    setHolidays(prev => prev.filter(h => h.id !== deletingHoliday.id));
    showToast('Holiday Removed', `Deleted "${deletingHoliday.title}".`, 'warning');
    setDeletingHoliday(null);
  };

  // Calendar Calculation Helpers
  const daysInMonthCount = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayWeekdayIndex = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sunday

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(prev => prev - 1);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(prev => prev + 1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  };

  const filteredHolidays = holidays.filter(h => {
    const matchesSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          h.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          h.dateRange.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || typeFilter === 'Calendar' || h.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Holiday Calendar Console"
        subtitle="School Holidays & Academic Events"
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center">
            <Calendar size={20} color="#00f1a1" />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Search Bar & Action Buttons */}
        <View className="px-5 mb-4">
          <View className="flex-row items-center justify-between mb-3" style={{ gap: 10 }}>
            <View className="flex-1 bg-[#101415] border border-white/15 rounded-2xl flex-row items-center px-3.5 py-2.5">
              <Search size={16} color="#00f1a1" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search holiday name, date, description..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 text-white text-xs"
                style={{ paddingVertical: 0 }}
              />
            </View>

            <Pressable
              onPress={handleOpenAdd}
              className="bg-[#00f1a1] px-4 py-2.5 rounded-2xl flex-row items-center shadow-[0_0_12px_rgba(0,241,161,0.3)]"
            >
              <Plus size={16} color="#101415" style={{ marginRight: 4 }} />
              <Text className="text-[#101415] text-xs font-extrabold">Add Holiday</Text>
            </Pressable>
          </View>

          {/* Holiday Type Filter Pills: All Holidays, Calendar, National, Festival, Institutional, Vacation */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {(['All', 'Calendar', 'National', 'Festival', 'Institutional', 'Vacation'] as const).map(tf => {
                const isSelected = typeFilter === tf;
                return (
                  <Pressable
                    key={tf}
                    onPress={() => setTypeFilter(tf)}
                    className={`px-3.5 py-1.5 rounded-xl border ${isSelected ? 'bg-[#00f1a1] border-[#00f1a1]' : 'bg-white/5 border-white/15'}`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white/70'}`}>
                      {tf === 'All' ? 'All Holidays' : tf === 'Calendar' ? 'Calendar' : tf}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* CONDITION 1: CALENDAR GRID VIEW (Enhanced Premium UI) */}
        {typeFilter === 'Calendar' ? (
          <View className="px-5 mb-8">
            <GlassCard intensity="low" className="p-4 border-white/15 bg-[#101415]/95">
              
              {/* Calendar Grid Header Bar */}
              <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-white/10">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center">
                    <Sparkles size={16} color="#00f1a1" style={{ marginRight: 6 }} />
                    <Text className="text-white font-extrabold text-base">School Holidays Designer</Text>
                  </View>
                  <Text className="text-white/50 text-[10px] mt-0.5">Tap on any date to configure custom holidays, or view Sundays.</Text>
                </View>

                {/* Month Navigator: < June 2026 > */}
                <View className="flex-row items-center bg-black/60 border border-[#00f1a1]/30 px-3 py-1.5 rounded-2xl shadow-lg">
                  <Pressable onPress={handlePrevMonth} className="p-1 active:opacity-60">
                    <ChevronLeft size={16} color="#00f1a1" />
                  </Pressable>
                  <Text className="text-white font-extrabold text-xs mx-2.5">
                    {MONTH_NAMES[calendarMonth]} {calendarYear}
                  </Text>
                  <Pressable onPress={handleNextMonth} className="p-1 active:opacity-60">
                    <ChevronRight size={16} color="#00f1a1" />
                  </Pressable>
                </View>
              </View>

              {/* Weekday Labels Header */}
              <View className="flex-row mb-3 bg-black/40 py-2.5 px-1 rounded-xl border border-white/5">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
                  <View key={d} style={{ width: '14.28%' }} className="items-center">
                    <Text className={`text-[10px] font-extrabold uppercase ${i === 0 ? 'text-rose-400' : 'text-white/60'}`} numberOfLines={1}>
                      {d.slice(0, 3)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Calendar Days Grid (Exact 7 Columns Layout) */}
              <View className="flex-row flex-wrap">
                {/* Empty Offset Boxes before day 1 */}
                {Array.from({ length: firstDayWeekdayIndex }).map((_, i) => (
                  <View key={`empty_${i}`} style={{ width: '14.28%', height: 68, padding: 2 }} />
                ))}

                {/* Days of Month (1 through N) */}
                {Array.from({ length: daysInMonthCount }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dayOfWeek = (firstDayWeekdayIndex + idx) % 7;
                  const isSunday = dayOfWeek === 0;

                  const monthStr = String(calendarMonth + 1).padStart(2, '0');
                  const dayStr = String(dayNum).padStart(2, '0');
                  const fullDateStr = `${calendarYear}-${monthStr}-${dayStr}`;

                  // Find configured holiday for this day
                  const holidayOnDay = holidays.find(h => 
                    h.dateStr === fullDateStr || 
                    h.dateRange.includes(`${dayNum} ${MONTH_NAMES[calendarMonth].slice(0, 3)}`)
                  );

                  return (
                    <View key={`day_${dayNum}`} style={{ width: '14.28%', padding: 2 }}>
                      <Pressable
                        onPress={() => handleOpenDateConfigModal(dayNum)}
                        className={`h-[66px] p-1.5 rounded-2xl border flex-col justify-between ${
                          isSunday 
                            ? 'bg-rose-500/15 border-rose-500/40' 
                            : holidayOnDay 
                            ? 'bg-[#00f1a1]/15 border-[#00f1a1]/40' 
                            : 'bg-white/5 border-white/10 active:bg-white/15'
                        }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <Text className={`text-xs font-extrabold ${isSunday ? 'text-rose-400' : 'text-white'}`}>
                            {dayNum}
                          </Text>
                          {holidayOnDay && (
                            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: holidayOnDay.color || '#00f1a1' }} />
                          )}
                        </View>

                        {isSunday ? (
                          <View className="bg-rose-500/20 px-0.5 py-0.5 rounded-md border border-rose-500/30">
                            <Text className="text-rose-300 text-[6.5px] font-black uppercase text-center" numberOfLines={1}>SUNDAY</Text>
                          </View>
                        ) : holidayOnDay ? (
                          <View className="px-1 py-0.5 rounded-md" style={{ backgroundColor: holidayOnDay.color || '#00f1a1' }}>
                            <Text className="text-[#101415] text-[7px] font-black text-center" numberOfLines={1}>
                              {holidayOnDay.title}
                            </Text>
                          </View>
                        ) : null}
                      </Pressable>
                    </View>
                  );
                })}
              </View>

            </GlassCard>
          </View>
        ) : (
          /* CONDITION 2: STANDARD DIRECTORY LIST CARDS */
          <View className="px-5">
            <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Academic Calendar Holidays ({filteredHolidays.length})</Text>

            {filteredHolidays.length === 0 ? (
              <GlassCard className="p-8 items-center justify-center border border-white/10 bg-[#101415]/90" intensity="low">
                <Text className="text-white/40 text-xs font-bold">No holidays matching filter criteria.</Text>
              </GlassCard>
            ) : (
              filteredHolidays.map(hol => {
                const badgeStyle = hol.type === 'National' ? 'bg-[#00f1a1]/20 border-[#00f1a1]/40 text-[#00f1a1]' :
                                  hol.type === 'Festival' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' :
                                  hol.type === 'Vacation' ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' :
                                  'bg-sky-500/20 border-sky-500/40 text-sky-400';

                return (
                  <GlassCard key={hol.id} intensity="low" className="mb-4 p-4 border-white/10 bg-[#101415]/90">
                    <View className="flex-row justify-between items-start pb-3 border-b border-white/10 mb-3">
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className="w-10 h-10 rounded-2xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center mr-3">
                          <Calendar size={20} color="#00f1a1" />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text className="text-white font-extrabold text-base mr-2">{hol.title}</Text>
                          </View>
                          <Text className="text-[#00f1a1] text-xs font-bold mt-0.5">{hol.dateRange}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center" style={{ gap: 6 }}>
                        <View className={`${badgeStyle} border px-2.5 py-1 rounded-xl mr-1`}>
                          <Text className={`${badgeStyle.split(' ').pop()} text-[10px] font-bold`}>{hol.type}</Text>
                        </View>

                        <Pressable
                          onPress={() => handleOpenEdit(hol)}
                          className="bg-white/5 border border-white/10 p-2 rounded-xl"
                        >
                          <Pencil size={14} color="rgba(255,255,255,0.7)" />
                        </Pressable>

                        <Pressable
                          onPress={() => setDeletingHoliday(hol)}
                          className="bg-rose-500/10 border border-rose-500/30 p-2 rounded-xl"
                        >
                          <Trash2 size={14} color="#ff516a" />
                        </Pressable>
                      </View>
                    </View>

                    <Text className="text-white/70 text-xs leading-relaxed">{hol.description}</Text>
                  </GlassCard>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CONFIGURE SCHOOL HOLIDAY MODAL (100% Solid Opaque Dark Background - Screenshot 2 Parity) */}
      {showConfigModal && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowConfigModal(false)}>
          <View className="flex-1 bg-black/85 justify-center items-center p-4">
            <View className="w-full max-w-sm p-5 border border-white/20 rounded-3xl" style={{ backgroundColor: '#101415' }}>
              
              {/* Modal Header */}
              <View className="flex-row justify-between items-start pb-3 border-b border-white/10 mb-4">
                <View>
                  <Text className="text-white font-extrabold text-base">Configure School Holiday</Text>
                  <Text className="text-[#00f1a1] text-xs font-bold mt-0.5">{selectedConfigDate}</Text>
                </View>
                <Pressable onPress={() => setShowConfigModal(false)} className="p-1">
                  <X size={20} color="rgba(255,255,255,0.6)" />
                </Pressable>
              </View>

              {/* Checkbox: Mark as Holiday */}
              <Pressable
                onPress={() => setIsMarkedAsHoliday(!isMarkedAsHoliday)}
                className="flex-row items-center mb-4 bg-black/60 p-3 rounded-2xl border border-white/10"
              >
                <View className={`w-5 h-5 rounded-md border flex-row items-center justify-center mr-3 ${
                  isMarkedAsHoliday ? 'bg-[#00f1a1] border-[#00f1a1]' : 'border-white/40 bg-transparent'
                }`}>
                  {isMarkedAsHoliday && <Check size={12} color="#101415" />}
                </View>
                <Text className="text-white font-extrabold text-xs">Mark as Holiday</Text>
              </Pressable>

              {/* Field 1: Holiday Name * */}
              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Holiday Name *</Text>
                <TextInput
                  value={configHolidayName}
                  onChangeText={setConfigHolidayName}
                  placeholder="e.g. Diwali, Ramzan"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="bg-black/60 border border-white/15 rounded-xl text-white px-3 py-2.5 text-xs font-bold"
                />
              </View>

              {/* Field 2: Description (Optional) */}
              <View className="mb-4">
                <Text className="text-white/70 text-xs font-bold mb-1">Description (Optional)</Text>
                <TextInput
                  value={configDescription}
                  onChangeText={setConfigDescription}
                  placeholder="e.g. School remains closed"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="bg-black/60 border border-white/15 rounded-xl text-white px-3 py-2.5 text-xs"
                />
              </View>

              {/* Field 3: Visual Highlight Color * */}
              <View className="mb-5">
                <Text className="text-white/70 text-xs font-bold mb-2">Visual Highlight Color *</Text>
                <View className="flex-row items-center justify-between px-1">
                  {HIGHLIGHT_COLORS.map(c => {
                    const isSelected = configColor === c;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setConfigColor(c)}
                        className={`w-9 h-9 rounded-full items-center justify-center border-2 ${
                          isSelected ? 'border-white' : 'border-transparent'
                        }`}
                        style={[
                          { backgroundColor: c },
                          isSelected ? { transform: [{ scale: 1.15 }] } : undefined
                        ]}
                      >
                        {isSelected && <Check size={14} color="#101415" />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Action Buttons: Cancel and Save Holiday Config */}
              <View className="flex-row" style={{ gap: 10 }}>
                <Pressable
                  onPress={() => setShowConfigModal(false)}
                  className="flex-1 py-3 bg-white/10 rounded-xl items-center"
                >
                  <Text className="text-white font-bold text-xs">Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveHolidayConfig}
                  className="flex-1 py-3 bg-[#00f1a1] rounded-xl items-center shadow-[0_0_15px_rgba(0,241,161,0.4)]"
                >
                  <Text className="text-[#101415] font-extrabold text-xs">Save Holiday Config</Text>
                </Pressable>
              </View>

            </View>
          </View>
        </Modal>
      )}

      {/* STANDARD ADD / EDIT HOLIDAY MODAL */}
      {showAddEditModal && (
        <Modal visible={showAddEditModal} transparent animationType="fade" onRequestClose={() => setShowAddEditModal(false)}>
          <View className="flex-1 bg-black/85 justify-center items-center p-4">
            <View className="w-full max-w-sm p-5 border border-white/20 rounded-3xl" style={{ backgroundColor: '#101415' }}>
              <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
                <Text className="text-white font-bold text-base">{editingHoliday ? 'Edit Holiday Entry' : 'Add Holiday Entry'}</Text>
                <Pressable onPress={() => setShowAddEditModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                  <X size={14} color="#ffffff" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
                <View className="mb-3">
                  <Text className="text-white/70 text-xs font-bold mb-1">Holiday Title *</Text>
                  <TextInput
                    value={formTitle}
                    onChangeText={setFormTitle}
                    placeholder="e.g. Independence Day"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/60 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-white/70 text-xs font-bold mb-1">Date Range *</Text>
                  <TextInput
                    value={formDateRange}
                    onChangeText={setFormDateRange}
                    placeholder="e.g. 15 Aug 2026 or 20 Oct - 25 Oct 2026"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/60 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-white/70 text-xs font-bold mb-1">Category Type *</Text>
                  <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                    {(['National', 'Festival', 'Institutional', 'Vacation'] as const).map(t => (
                      <Pressable
                        key={t}
                        onPress={() => setFormType(t)}
                        className={`px-3 py-1.5 rounded-xl border ${formType === t ? 'bg-[#00f1a1] border-[#00f1a1]' : 'bg-white/5 border-white/10'}`}
                      >
                        <Text className={`text-[10px] font-bold ${formType === t ? 'text-[#101415]' : 'text-white/70'}`}>{t}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-white/70 text-xs font-bold mb-1">Description</Text>
                  <TextInput
                    value={formDescription}
                    onChangeText={setFormDescription}
                    multiline
                    numberOfLines={3}
                    placeholder="Brief holiday details..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/60 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
                    style={{ textAlignVertical: 'top' }}
                  />
                </View>
              </ScrollView>

              <Pressable
                onPress={handleSaveHoliday}
                className="bg-[#00f1a1] py-3 rounded-xl items-center mt-2 shadow-[0_0_15px_rgba(0,241,161,0.4)]"
              >
                <Text className="text-[#101415] font-extrabold text-xs uppercase">{editingHoliday ? 'Save Changes' : 'Create Holiday'}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingHoliday && (
        <Modal visible={!!deletingHoliday} transparent animationType="fade" onRequestClose={() => setDeletingHoliday(null)}>
          <View className="flex-1 bg-black/85 justify-center items-center p-4">
            <View className="bg-[#101415] border border-rose-500/40 rounded-3xl w-full max-w-xs p-5 items-center">
              <View className="w-12 h-12 rounded-full bg-rose-500/20 items-center justify-center mb-3">
                <Trash2 size={24} color="#ff516a" />
              </View>
              <Text className="text-white font-extrabold text-base mb-1">Delete Holiday?</Text>
              <Text className="text-white/60 text-xs text-center mb-4">
                Are you sure you want to remove <Text className="text-white font-bold">"{deletingHoliday.title}"</Text>?
              </Text>

              <View className="flex-row w-full" style={{ gap: 8 }}>
                <Pressable
                  onPress={() => setDeletingHoliday(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 items-center"
                >
                  <Text className="text-white text-xs font-bold">Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleDeleteHoliday}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 items-center"
                >
                  <Text className="text-white text-xs font-bold">Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* TOAST NOTIFICATION */}
      {toastData.visible && (
        <View className="absolute bottom-6 left-5 right-5 bg-[#00f1a1] p-3.5 rounded-2xl flex-row items-center justify-between shadow-[0_0_20px_rgba(0,241,161,0.5)]">
          <View>
            <Text className="text-[#101415] font-extrabold text-xs">{toastData.title}</Text>
            <Text className="text-[#101415]/80 text-[10px]">{toastData.message}</Text>
          </View>
          <CheckCircle2 size={18} color="#101415" />
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d2a24',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
});

export default HolidayCalendarScreen;
