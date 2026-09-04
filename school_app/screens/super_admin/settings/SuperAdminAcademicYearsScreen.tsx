import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  BackHandler,
  PanResponder,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../../components/GlassCard';
import { useResponsive } from '../../../utils/responsive';
import { api } from '../../../services/api';

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatToDDMMYYYY = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A';
  try {
    const cleanStr = dateStr.trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(cleanStr)) return cleanStr;
    if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
      const [year, month, day] = cleanStr.substring(0, 10).split('-');
      return `${day}-${month}-${year}`;
    }
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (_) {}
  return dateStr;
};

// Formats typed numeric digits into DD-MM-YYYY as user types
const formatDigitsToDDMMYYYY = (text: string): string => {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
};

export interface AcademicYearItem {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export const SuperAdminAcademicYearsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { headerPaddingTop, scrollBottomPadding, containerStyle } = useResponsive();

  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([
    { id: '1', name: '2026-2027', start_date: '01-06-2026', end_date: '30-04-2027', is_current: true },
    { id: '2', name: '2025-2026', start_date: '01-06-2025', end_date: '30-04-2026', is_current: false },
    { id: '3', name: '2024-2025', start_date: '01-06-2024', end_date: '30-04-2025', is_current: false },
  ]);
  const [loadingAys, setLoadingAys] = useState(false);

  // Add/Edit Academic Year Modal state
  const [showAyModal, setShowAyModal] = useState(false);
  const [editingAy, setEditingAy] = useState<AcademicYearItem | null>(null);
  const [ayName, setAyName] = useState('');
  const [ayStart, setAyStart] = useState('');
  const [ayEnd, setAyEnd] = useState('');
  const [ayIsCurrent, setAyIsCurrent] = useState(false);
  const [savingAy, setSavingAy] = useState(false);
  const [ayError, setAyError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calendar Date Picker state
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [targetDateField, setTargetDateField] = useState<'start' | 'end' | null>(null);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());

  // Custom alert state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setCustomAlert({ visible: true, title, message, type });
  };

  const loadAcademicYears = async () => {
    setLoadingAys(true);
    try {
      const data = await api.getResources('academic-years');
      if (Array.isArray(data) && data.length > 0) {
        setAcademicYears(
          data.map((ay: any) => ({
            id: String(ay.id),
            name: ay.name,
            start_date: formatToDDMMYYYY(ay.start_date),
            end_date: formatToDDMMYYYY(ay.end_date),
            is_current: !!ay.is_current,
          }))
        );
      }
    } catch (e) {
      console.log('Error loading academic years:', e);
    } finally {
      setLoadingAys(false);
    }
  };

  useEffect(() => {
    loadAcademicYears();
  }, []);

  const handleBackNavigation = useCallback(() => {
    if (showDatePickerModal) {
      setShowDatePickerModal(false);
      return true;
    }
    if (showAyModal) {
      setShowAyModal(false);
      return true;
    }
    if (deletingId) {
      setDeletingId(null);
      return true;
    }
    if (customAlert.visible) {
      setCustomAlert((prev) => ({ ...prev, visible: false }));
      return true;
    }
    navigation.goBack();
    return true;
  }, [showDatePickerModal, showAyModal, deletingId, customAlert.visible, navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        return handleBackNavigation();
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBackNavigation])
  );

  const openAyModal = (ay: AcademicYearItem | null = null) => {
    setAyError('');
    if (ay) {
      setEditingAy(ay);
      setAyName(ay.name);
      setAyStart(ay.start_date);
      setAyEnd(ay.end_date);
      setAyIsCurrent(ay.is_current);
    } else {
      setEditingAy(null);
      setAyName('');
      setAyStart('');
      setAyEnd('');
      setAyIsCurrent(false);
    }
    setShowAyModal(true);
  };

  // Date input text change with numeric-only auto-formatting
  const handleStartDateChange = (text: string) => {
    const formatted = formatDigitsToDDMMYYYY(text);
    setAyStart(formatted);
  };

  const handleEndDateChange = (text: string) => {
    const formatted = formatDigitsToDDMMYYYY(text);
    setAyEnd(formatted);
  };

  // Open Calendar Picker for a target field
  const openCalendarPicker = (field: 'start' | 'end') => {
    setTargetDateField(field);
    const currentDateStr = field === 'start' ? ayStart : ayEnd;
    if (currentDateStr && /^\d{2}-\d{2}-\d{4}$/.test(currentDateStr)) {
      const parts = currentDateStr.split('-');
      const y = parseInt(parts[2], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        setPickerYear(y);
        setPickerMonth(m);
      }
    } else {
      setPickerYear(new Date().getFullYear());
      setPickerMonth(new Date().getMonth());
    }
    setShowDatePickerModal(true);
  };

  const handlePrevMonth = () => {
    if (pickerMonth === 0) {
      setPickerMonth(11);
      setPickerYear((y) => y - 1);
    } else {
      setPickerMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (pickerMonth === 11) {
      setPickerMonth(0);
      setPickerYear((y) => y + 1);
    } else {
      setPickerMonth((m) => m + 1);
    }
  };

  const calPrevMonthRef = useRef(handlePrevMonth);
  const calNextMonthRef = useRef(handleNextMonth);
  calPrevMonthRef.current = handlePrevMonth;
  calNextMonthRef.current = handleNextMonth;

  // Swipe gesture for Calendar Modal (Right-to-left = Next Month, Left-to-right = Prev Month)
  const calSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 15;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -35) {
          calNextMonthRef.current?.();
        } else if (gestureState.dx > 35) {
          calPrevMonthRef.current?.();
        }
      },
    })
  ).current;

  const handleSelectCalendarDate = (day: number) => {
    const dd = String(day).padStart(2, '0');
    const mm = String(pickerMonth + 1).padStart(2, '0');
    const yyyy = String(pickerYear);
    const dateFormatted = `${dd}-${mm}-${yyyy}`;

    if (targetDateField === 'start') {
      setAyStart(dateFormatted);
    } else if (targetDateField === 'end') {
      setAyEnd(dateFormatted);
    }
    setShowDatePickerModal(false);
  };

  // Generate calendar grid for the picker
  const firstDayOfWeek = new Date(pickerYear, pickerMonth, 1).getDay();
  const totalDaysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= totalDaysInMonth; d++) {
    calendarCells.push(d);
  }

  const handleSaveAy = async () => {
    if (!ayName.trim() || !ayStart.trim() || !ayEnd.trim()) {
      setAyError('Please fill in all fields (Academic Year Name, Start Date, End Date).');
      return;
    }
    setSavingAy(true);
    setAyError('');

    const formattedStart = formatToDDMMYYYY(ayStart.trim());
    const formattedEnd = formatToDDMMYYYY(ayEnd.trim());

    const newAy: AcademicYearItem = {
      id: editingAy ? editingAy.id : String(Date.now()),
      name: ayName.trim(),
      start_date: formattedStart,
      end_date: formattedEnd,
      is_current: ayIsCurrent,
    };

    try {
      if (editingAy) {
        await api.updateResource('academic-years', editingAy.id, newAy).catch(() => {});
      } else {
        await api.createResource('academic-years', newAy).catch(() => {});
      }
    } catch (_) {}

    setAcademicYears((prev) => {
      let updated = prev.map((item) => {
        if (newAy.is_current) {
          return { ...item, is_current: false };
        }
        return item;
      });
      if (editingAy) {
        updated = updated.map((item) => (item.id === editingAy.id ? newAy : item));
      } else {
        updated = [newAy, ...updated];
      }
      return updated;
    });

    setSavingAy(false);
    setShowAyModal(false);
    showAlert('Success', `Academic Year "${newAy.name}" saved successfully.`, 'success');
  };

  const handleSetCurrent = async (ay: AcademicYearItem) => {
    setLoadingAys(true);
    try {
      await api.updateResource('academic-years', ay.id, { is_current: true }).catch(() => {});
    } catch (_) {}
    setAcademicYears((prev) =>
      prev.map((item) => ({
        ...item,
        is_current: item.id === ay.id,
      }))
    );
    setLoadingAys(false);
    showAlert('Current Year Activated', `Academic Session "${ay.name}" is now set as active current year.`, 'success');
  };

  const handleDeleteAy = (id: string) => {
    setDeletingId(id);
  };

  const confirmDeleteAy = () => {
    if (!deletingId) return;
    const id = deletingId;
    setDeletingId(null);
    setAcademicYears((prev) => prev.filter((ay) => ay.id !== id));
    try {
      api.deleteResource('academic-years', id).catch(() => {});
    } catch (_) {}
    showAlert('Year Deleted', 'Academic year removed from records.', 'info');
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1d2022', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <Pressable
              onPress={handleBackNavigation}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <ArrowLeft size={22} color="#ffe5a0" />
            </Pressable>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-xl md:text-2xl font-extrabold text-white font-display-lg">
                Academic Years Management
              </Text>
              <Text numberOfLines={1} className="text-xs uppercase tracking-wider text-[#ffe5a0] font-bold mt-0.5">
                DEFINE SCHOOL YEARS & TERM RANGES
              </Text>
            </View>
          </View>
          <View className="w-10 h-10 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center">
            <CalendarIcon size={22} color="#f0c110" />
          </View>
        </BlurView>

        <LinearGradient
          colors={['rgba(245, 197, 24, 0.15)', 'transparent']}
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Card */}
        <View className="px-5 mb-4">
          <GlassCard className="p-4 border border-white/10" intensity="low">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-white font-bold text-sm">Academic Years Management</Text>
                <Text className="text-[#d1c5ac] text-xs leading-relaxed mt-1">
                  Define school years, term ranges, and activate the current academic year.
                </Text>
              </View>
              <Pressable
                onPress={() => openAyModal(null)}
                className="py-2.5 px-3.5 rounded-xl bg-[#f0c110] flex-row items-center gap-1.5 active:scale-95 shadow-md shadow-[#f0c110]/30"
              >
                <Plus size={14} color="#101415" />
                <Text className="text-[#101415] font-extrabold text-xs uppercase tracking-wider">Add Academic Year</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>

        {/* Academic Years List */}
        <View className="px-5 mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider">
              CONFIGURED SESSIONS ({academicYears.length})
            </Text>
            <Pressable onPress={loadAcademicYears} className="p-1.5 rounded-lg bg-white/5 border border-white/10">
              <RotateCcw size={12} color="#ffe5a0" className={loadingAys ? 'animate-spin' : ''} />
            </Pressable>
          </View>

          {loadingAys ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#f0c110" />
            </View>
          ) : academicYears.length === 0 ? (
            <GlassCard className="p-8 border border-white/10 items-center justify-center" intensity="low">
              <Text className="text-white/40 text-xs italic text-center">
                No academic years configured. Tap "Add Academic Year" to create one.
              </Text>
            </GlassCard>
          ) : (
            academicYears.map((ay) => (
              <GlassCard
                key={ay.id}
                className={`p-4 mb-3.5 border ${
                  ay.is_current ? 'border-[#f0c110]/60 bg-[#f0c110]/10' : 'border-white/10 bg-white/5'
                }`}
                intensity="low"
              >
                <View className="flex-row justify-between items-center mb-1.5">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white font-extrabold text-base">{ay.name}</Text>
                    {ay.is_current && (
                      <View className="px-2.5 py-0.5 rounded-lg bg-[#f0c110] border border-[#f0c110]">
                        <Text className="text-[#101415] text-[9.5px] font-black uppercase">Current Year</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text className="text-white/60 text-xs font-mono mb-3">
                  {ay.start_date} &nbsp;to&nbsp; {ay.end_date}
                </Text>

                <View className="flex-row justify-end items-center gap-2 pt-2.5 border-t border-white/5">
                  {!ay.is_current && (
                    <Pressable
                      onPress={() => handleSetCurrent(ay)}
                      className="px-3 py-1.5 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 active:scale-95 flex-row items-center gap-1.5"
                    >
                      <Check size={12} color="#ffe5a0" />
                      <Text className="text-[#ffe5a0] text-[10.5px] font-bold">Set Active</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => openAyModal(ay)}
                    className="p-2 rounded-xl bg-white/10 border border-white/15 active:scale-95"
                  >
                    <Edit2 size={13} color="#ffe5a0" />
                  </Pressable>
                  {!ay.is_current && (
                    <Pressable
                      onPress={() => handleDeleteAy(ay.id)}
                      className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 active:scale-95"
                    >
                      <Trash2 size={13} color="#ffb4ab" />
                    </Pressable>
                  )}
                </View>
              </GlassCard>
            ))
          )}
        </View>
      </ScrollView>

      {/* ========================================================= */}
      {/* ADD / EDIT ACADEMIC YEAR MODAL (MATCHING WEB IMAGE POPUP) */}
      {/* ========================================================= */}
      <Modal visible={showAyModal} transparent animationType="fade" onRequestClose={() => setShowAyModal(false)}>
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[90%] max-w-[390px] p-5 border border-white/15"
            style={{
              backgroundColor: '#16191b',
              borderRadius: 24,
              shadowColor: '#f0c110',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Header matching image */}
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1 pr-2">
                <Text className="text-white font-extrabold text-base">
                  {editingAy ? 'Edit Academic Year' : 'Add Academic Year'}
                </Text>
                <Text className="text-white/50 text-xs mt-0.5">Specify name and duration limits.</Text>
              </View>
              <Pressable
                onPress={() => setShowAyModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            {ayError ? (
              <View className="p-2.5 mb-3 bg-red-500/15 border border-red-500/30 rounded-xl flex-row items-center gap-2">
                <AlertCircle size={14} color="#ffb4ab" />
                <Text className="text-[#ffb4ab] text-xs flex-1">{ayError}</Text>
              </View>
            ) : null}

            {/* Field 1: Academic Year Name * */}
            <View className="mb-3.5">
              <Text className="text-white/80 text-xs font-bold mb-1.5">Academic Year Name *</Text>
              <TextInput
                value={ayName}
                onChangeText={setAyName}
                placeholder="e.g. 2027-2028"
                placeholderTextColor="rgba(255,255,255,0.3)"
                className="bg-black/50 border border-white/15 rounded-xl text-white px-3.5 py-2.5 text-xs font-semibold"
              />
            </View>

            {/* Field 2 & 3: Two-Column Start Date * & End Date * */}
            <View className="flex-row gap-3 mb-4">
              {/* Start Date */}
              <View className="flex-1">
                <Text className="text-white/80 text-xs font-bold mb-1.5">Start Date *</Text>
                <View className="bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 flex-row items-center justify-between">
                  <TextInput
                    value={ayStart}
                    onChangeText={handleStartDateChange}
                    placeholder="dd-mm-yyyy"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    maxLength={10}
                    className="flex-1 text-white text-xs font-mono p-0"
                  />
                  <Pressable
                    onPress={() => openCalendarPicker('start')}
                    className="p-1 rounded-lg bg-white/5 active:bg-white/15"
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <CalendarIcon size={14} color="#ffe5a0" />
                  </Pressable>
                </View>
              </View>

              {/* End Date */}
              <View className="flex-1">
                <Text className="text-white/80 text-xs font-bold mb-1.5">End Date *</Text>
                <View className="bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 flex-row items-center justify-between">
                  <TextInput
                    value={ayEnd}
                    onChangeText={handleEndDateChange}
                    placeholder="dd-mm-yyyy"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    maxLength={10}
                    className="flex-1 text-white text-xs font-mono p-0"
                  />
                  <Pressable
                    onPress={() => openCalendarPicker('end')}
                    className="p-1 rounded-lg bg-white/5 active:bg-white/15"
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <CalendarIcon size={14} color="#ffe5a0" />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Checkbox: Mark as Active/Current Academic Year */}
            <Pressable
              onPress={() => setAyIsCurrent(!ayIsCurrent)}
              className="flex-row items-center gap-2.5 mb-5 active:opacity-80"
            >
              <View
                className={`w-4 h-4 rounded-md border items-center justify-center ${
                  ayIsCurrent ? 'bg-[#f0c110] border-[#f0c110]' : 'border-white/30 bg-black/40'
                }`}
              >
                {ayIsCurrent && <Check size={11} color="#101415" strokeWidth={3} />}
              </View>
              <Text className="text-white/80 text-xs font-semibold">Mark as Active/Current Academic Year</Text>
            </Pressable>

            {/* Action Buttons: Cancel & Create Year (or Save Changes) */}
            <View className="flex-row gap-3 pt-2 border-t border-white/10">
              <Pressable
                onPress={() => setShowAyModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:scale-95"
              >
                <Text className="text-white/80 font-bold text-xs">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveAy}
                disabled={savingAy}
                className="flex-1 py-3 rounded-xl bg-[#f0c110] items-center justify-center active:scale-95 shadow-md shadow-[#f0c110]/30"
              >
                {savingAy ? (
                  <ActivityIndicator size="small" color="#101415" />
                ) : (
                  <Text className="text-[#101415] font-extrabold text-xs">
                    {editingAy ? 'Save Changes' : 'Create Year'}
                  </Text>
                )}
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* CALENDAR DATE PICKER MODAL */}
      {/* ========================================================= */}
      <Modal visible={showDatePickerModal} transparent animationType="fade" onRequestClose={() => setShowDatePickerModal(false)}>
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[90%] max-w-[340px] p-5 border border-[#f0c110]/40"
            style={{ backgroundColor: '#101415', borderRadius: 28 }}
          >
            {/* Calendar Header */}
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center">
                  <CalendarIcon size={16} color="#ffe5a0" />
                </View>
                <Text className="text-white font-bold text-sm">
                  Select {targetDateField === 'start' ? 'Start' : 'End'} Date
                </Text>
              </View>
              <Pressable
                onPress={() => setShowDatePickerModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 items-center justify-center"
              >
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            {/* Month & Year Navigation Ribbon */}
            <View className="flex-row justify-between items-center bg-white/5 p-2 rounded-xl mb-3 border border-white/10">
              <Pressable onPress={handlePrevMonth} className="p-1 border border-white/10 rounded-lg bg-white/5 active:bg-white/20">
                <ChevronLeft size={16} color="#ffe5a0" />
              </Pressable>
              <Text className="text-white font-extrabold text-xs">
                {MONTH_NAMES[pickerMonth]} {pickerYear}
              </Text>
              <Pressable onPress={handleNextMonth} className="p-1 border border-white/10 rounded-lg bg-white/5 active:bg-white/20">
                <ChevronRight size={16} color="#ffe5a0" />
              </Pressable>
            </View>

            {/* 7 Days of Week Header */}
            <View className="flex-row mb-2">
              {DAYS_OF_WEEK.map((d, i) => (
                <View key={i} style={{ width: '14.28%', alignItems: 'center' }}>
                  <Text className="text-white/40 text-[9.5px] font-bold uppercase">{d}</Text>
                </View>
              ))}
            </View>

            {/* 7-Column Calendar Days Grid */}
            <View {...calSwipeResponder.panHandlers} className="flex-row flex-wrap mb-4">
              {calendarCells.map((dayNum, idx) => {
                if (!dayNum) {
                  return <View key={idx} style={{ width: '14.28%', height: 34 }} />;
                }

                const currentFormatted = `${String(dayNum).padStart(2, '0')}-${String(pickerMonth + 1).padStart(2, '0')}-${pickerYear}`;
                const isSelected = (targetDateField === 'start' ? ayStart : ayEnd) === currentFormatted;

                return (
                  <View key={idx} style={{ width: '14.28%', height: 34, padding: 1.5 }}>
                    <Pressable
                      onPress={() => handleSelectCalendarDate(dayNum)}
                      className={`w-full h-full rounded-lg items-center justify-center border ${
                        isSelected
                          ? 'bg-[#f0c110] border-[#f0c110]'
                          : 'bg-white/5 border-white/10 active:bg-white/20'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white'}`}>
                        {dayNum}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <Pressable
              onPress={() => setShowDatePickerModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 items-center active:scale-95"
            >
              <Text className="text-white/80 font-bold text-xs">Close Calendar</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deletingId} transparent animationType="fade" onRequestClose={() => setDeletingId(null)}>
        <View style={styles.alertOverlay}>
          <GlassCard className="w-[88%] max-w-[340px] p-5 border border-red-500/40" style={{ backgroundColor: '#181414', borderRadius: 24 }}>
            <View className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 items-center justify-center mb-3 self-center">
              <Trash2 size={24} color="#ffb4ab" />
            </View>
            <Text className="text-white font-extrabold text-sm text-center mb-2">Delete Academic Year?</Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-5">
              Are you sure you want to delete this academic year? This will delete associated classes and students.
            </Text>
            <View className="flex-row gap-2.5">
              <Pressable onPress={() => setDeletingId(null)} className="flex-1 py-2.5 rounded-xl bg-white/10 items-center">
                <Text className="text-white/70 font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmDeleteAy} className="flex-1 py-2.5 rounded-xl bg-red-500 items-center">
                <Text className="text-white font-extrabold text-xs">Delete</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* Custom Dialog Alert Modal */}
      <Modal visible={customAlert.visible} transparent animationType="fade" onRequestClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}>
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[85%] max-w-[340px] p-6 border border-white/10 items-center"
            style={{
              backgroundColor: '#16191b',
              borderRadius: 28,
              shadowColor: '#f0c110',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <View
              className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center ${
                customAlert.type === 'error'
                  ? 'bg-red-500/20 border border-red-500/40'
                  : 'bg-[#f0c110]/20 border border-[#f0c110]/40'
              }`}
            >
              {customAlert.type === 'error' ? (
                <AlertCircle size={24} color="#ffb4ab" />
              ) : (
                <CheckCircle2 size={24} color="#ffe5a0" />
              )}
            </View>

            <Text className="text-white text-base font-bold text-center mb-1.5">{customAlert.title}</Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-5 px-1">{customAlert.message}</Text>

            <Pressable
              onPress={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
              className="w-full py-3 rounded-xl bg-[#f0c110] items-center active:scale-95 shadow-md shadow-[#f0c110]/30"
            >
              <Text className="text-[#101415] text-xs font-extrabold uppercase tracking-wider">Dismiss</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SuperAdminAcademicYearsScreen;
