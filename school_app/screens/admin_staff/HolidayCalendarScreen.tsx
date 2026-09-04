import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  TextInput, BackHandler, PanResponder
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar, Plus, Trash2, Pencil, CheckCircle2,
  AlertCircle, X, Clock, PartyPopper, Flag, School,
  Search, ChevronLeft, ChevronRight, Check, CalendarDays, ArrowRight, Layers
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

export interface HolidayItem {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  dateRange: string; // e.g. "20 Oct - 24 Oct 2026" or "15 Aug 2026"
  type: 'National' | 'Festival' | 'Institutional' | 'Vacation';
  description: string;
  color?: string;
  daysCount?: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HIGHLIGHT_COLORS = ['#ef4444', '#f59e0b', '#00f1a1', '#3b82f6', '#a855f7', '#ec4899'];

// Helper: Format YYYY-MM-DD into readable string (e.g. "15 Aug 2026")
const formatIsoToDisplay = (isoStr: string): string => {
  if (!isoStr || !isoStr.includes('-')) return isoStr;
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  const y = parts[0];
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return `${d} ${MONTH_SHORT[m] || ''} ${y}`;
};

// Helper: Format Date Range (e.g. "20 Oct - 24 Oct 2026" or "15 Aug 2026")
const formatDisplayRange = (startIso: string, endIso: string): string => {
  if (!startIso) return '';
  if (!endIso || startIso === endIso) {
    return formatIsoToDisplay(startIso);
  }
  const sParts = startIso.split('-');
  const eParts = endIso.split('-');
  if (sParts.length === 3 && eParts.length === 3) {
    const sYear = sParts[0];
    const sMonth = parseInt(sParts[1], 10) - 1;
    const sDay = parseInt(sParts[2], 10);

    const eYear = eParts[0];
    const eMonth = parseInt(eParts[1], 10) - 1;
    const eDay = parseInt(eParts[2], 10);

    if (sYear === eYear && sMonth === eMonth) {
      return `${sDay} ${MONTH_SHORT[sMonth]} - ${eDay} ${MONTH_SHORT[eMonth]} ${sYear}`;
    }
    if (sYear === eYear) {
      return `${sDay} ${MONTH_SHORT[sMonth]} - ${eDay} ${MONTH_SHORT[eMonth]} ${sYear}`;
    }
    return `${sDay} ${MONTH_SHORT[sMonth]} ${sYear} - ${eDay} ${MONTH_SHORT[eMonth]} ${eYear}`;
  }
  return `${startIso} - ${endIso}`;
};

// Helper: Calculate inclusive day count between start and end
const calculateDurationDays = (startIso: string, endIso: string): number => {
  if (!startIso || !endIso) return 1;
  try {
    const s = new Date(startIso).getTime();
    const e = new Date(endIso).getTime();
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  } catch (_) {
    return 1;
  }
};

const MOCK_HOLIDAYS: HolidayItem[] = [
  {
    id: 'hol_1',
    title: 'Independence Day',
    startDate: '2026-08-15',
    endDate: '2026-08-15',
    dateRange: '15 Aug 2026',
    type: 'National',
    description: 'National Holiday celebrating Indian Independence',
    color: '#00f1a1',
    daysCount: 1
  },
  {
    id: 'hol_2',
    title: 'Ganesh Chaturthi',
    startDate: '2026-09-07',
    endDate: '2026-09-08',
    dateRange: '07 Sep - 08 Sep 2026',
    type: 'Festival',
    description: 'Ganesh Chaturthi Festival holiday and celebrations',
    color: '#f59e0b',
    daysCount: 2
  },
  {
    id: 'hol_3',
    title: 'Gandhi Jayanti',
    startDate: '2026-10-02',
    endDate: '2026-10-02',
    dateRange: '02 Oct 2026',
    type: 'National',
    description: 'Mahatma Gandhi Jayanti official holiday',
    color: '#ef4444',
    daysCount: 1
  },
  {
    id: 'hol_4',
    title: 'Dussehra Term Break',
    startDate: '2026-10-20',
    endDate: '2026-10-24',
    dateRange: '20 Oct - 24 Oct 2026',
    type: 'Vacation',
    description: 'Dussehra term break for all classes and faculty',
    color: '#a855f7',
    daysCount: 5
  },
  {
    id: 'hol_5',
    title: 'Telangana Formation Day',
    startDate: '2026-06-02',
    endDate: '2026-06-02',
    dateRange: '02 Jun 2026',
    type: 'National',
    description: 'Official State Holiday for Telangana Formation',
    color: '#ef4444',
    daysCount: 1
  },
  {
    id: 'hol_6',
    title: 'Ramzan / Eid-ul-Fitr',
    startDate: '2026-06-16',
    endDate: '2026-06-17',
    dateRange: '16 Jun - 17 Jun 2026',
    type: 'Festival',
    description: 'Festival holidays and special prayers',
    color: '#3b82f6',
    daysCount: 2
  },
  {
    id: 'hol_7',
    title: 'Diwali Festive Break',
    startDate: '2026-11-08',
    endDate: '2026-11-10',
    dateRange: '08 Nov - 10 Nov 2026',
    type: 'Festival',
    description: 'Deepavali festival holidays and lakshmi pooja',
    color: '#f59e0b',
    daysCount: 3
  },
  {
    id: 'hol_8',
    title: 'Winter & Christmas Break',
    startDate: '2026-12-23',
    endDate: '2026-12-26',
    dateRange: '23 Dec - 26 Dec 2026',
    type: 'Vacation',
    description: 'Annual winter vacation and Christmas celebration break',
    color: '#06b6d4',
    daysCount: 4
  }
];

export const HolidayCalendarScreen: React.FC<any> = ({ navigation: propNavigation }) => {
  const navigation = useNavigation<any>() || propNavigation;
  const { user } = useAuthStore();
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();
  const isSuperAdmin = user?.role === 'super_admin';

  const [holidays, setHolidays] = useState<HolidayItem[]>(MOCK_HOLIDAYS);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Pill States: All, Calendar, National, Festival, Institutional, Vacation
  const [typeFilter, setTypeFilter] = useState<'All' | 'Calendar' | 'National' | 'Festival' | 'Institutional' | 'Vacation'>('All');

  // Calendar Grid Month/Year State (Default June 2026)
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(5); // 5 = June (0-indexed)

  // Configure School Holiday Modal States
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configStartDate, setConfigStartDate] = useState<string>('2026-06-02');
  const [configEndDate, setConfigEndDate] = useState<string>('2026-06-02');
  const [isMarkedAsHoliday, setIsMarkedAsHoliday] = useState<boolean>(true);
  const [configHolidayName, setConfigHolidayName] = useState<string>('');
  const [configType, setConfigType] = useState<'National' | 'Festival' | 'Institutional' | 'Vacation'>('Festival');
  const [configDescription, setConfigDescription] = useState<string>('');
  const [configColor, setConfigColor] = useState<string>('#ef4444');

  // Standard Add/Edit Modal State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<HolidayItem | null>(null);

  // Add/Edit Form States
  const [formTitle, setFormTitle] = useState('');
  const [formStartDate, setFormStartDate] = useState('2026-08-15');
  const [formEndDate, setFormEndDate] = useState('2026-08-15');
  const [formType, setFormType] = useState<'National' | 'Festival' | 'Institutional' | 'Vacation'>('Festival');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#00f1a1');

  // Date Range Picker Modal States
  const [showRangePickerModal, setShowRangePickerModal] = useState(false);
  const [rangePickerTarget, setRangePickerTarget] = useState<'config' | 'form'>('config');
  const [tempFromDate, setTempFromDate] = useState<string>('2026-06-02');
  const [tempToDate, setTempToDate] = useState<string>('2026-06-02');
  const [activeRangeTab, setActiveRangeTab] = useState<'from' | 'to'>('from');
  const [rangePickerMonth, setRangePickerMonth] = useState<number>(5);
  const [rangePickerYear, setRangePickerYear] = useState<number>(2026);

  // Toast Notification
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'warning' }>({
    visible: false, title: '', message: '', type: 'success'
  });

  // Safe Navigation & Hardware Back Button Handling
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (showRangePickerModal) {
          setShowRangePickerModal(false);
          return true;
        }
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
    }, [showRangePickerModal, showConfigModal, showAddEditModal, navigation])
  );

  const showToast = (title: string, message: string, type: 'success' | 'warning' = 'success') => {
    setToastData({ visible: true, title, message, type });
    setTimeout(() => setToastData(prev => ({ ...prev, visible: false })), 3200);
  };

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await api.getResources('holidays');
        if (Array.isArray(res) && res.length > 0) {
          const mapped: HolidayItem[] = res.map((h: any) => {
            const start = h.start_date || h.date || '2026-08-15';
            const end = h.end_date || start;
            const days = calculateDurationDays(start, end);
            return {
              id: String(h.id),
              title: h.title || h.name || 'School Holiday',
              startDate: start,
              endDate: end,
              dateRange: h.date_range || formatDisplayRange(start, end),
              type: (h.type || 'Festival') as any,
              description: h.description || 'Official school holiday',
              color: h.color || '#ef4444',
              daysCount: days,
            };
          });
          setHolidays(mapped);
        }
      } catch (err) {
        console.log('Error loading holidays from DB:', err);
      }
    };
    fetchHolidays();
  }, []);

  // Helper: Find holiday item that covers a given date string (YYYY-MM-DD)
  const findHolidayForDate = (dateStr: string): HolidayItem | undefined => {
    return holidays.find(h => {
      const s = h.startDate || '';
      const e = h.endDate || s;
      return dateStr >= s && dateStr <= e;
    });
  };

  // Open Configure Holiday Modal for a specific date
  const handleOpenDateConfigModal = (dayNumber: number) => {
    const monthStr = String(calendarMonth + 1).padStart(2, '0');
    const dayStr = String(dayNumber).padStart(2, '0');
    const formattedDateStr = `${calendarYear}-${monthStr}-${dayStr}`;

    const existing = findHolidayForDate(formattedDateStr);

    if (existing) {
      setConfigStartDate(existing.startDate);
      setConfigEndDate(existing.endDate);
      setIsMarkedAsHoliday(true);
      setConfigHolidayName(existing.title);
      setConfigType(existing.type);
      setConfigDescription(existing.description);
      setConfigColor(existing.color || '#ef4444');
    } else {
      setConfigStartDate(formattedDateStr);
      setConfigEndDate(formattedDateStr);
      setIsMarkedAsHoliday(true);
      setConfigHolidayName('');
      setConfigType('Festival');
      setConfigDescription('');
      setConfigColor('#ef4444');
    }
    setShowConfigModal(true);
  };

  // Open Interactive Date Range Picker Modal
  const openDateRangePicker = (target: 'config' | 'form') => {
    setRangePickerTarget(target);
    const start = target === 'config' ? configStartDate : formStartDate;
    const end = target === 'config' ? configEndDate : formEndDate;
    setTempFromDate(start || '2026-06-02');
    setTempToDate(end || start || '2026-06-02');
    setActiveRangeTab('from');

    if (start && start.includes('-')) {
      const parts = start.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        setRangePickerYear(y);
        setRangePickerMonth(m);
      }
    }
    setShowRangePickerModal(true);
  };

  // Apply Selected Date Range from Modal
  const handleApplyRangePicker = () => {
    let s = tempFromDate;
    let e = tempToDate;
    if (s > e) {
      // Swap if inverted
      const temp = s;
      s = e;
      e = temp;
    }

    if (rangePickerTarget === 'config') {
      setConfigStartDate(s);
      setConfigEndDate(e);
    } else {
      setFormStartDate(s);
      setFormEndDate(e);
    }
    setShowRangePickerModal(false);
  };

  // Quick Preset Helper for Range Picker
  const handleSelectQuickDuration = (days: number) => {
    if (!tempFromDate) return;
    const start = new Date(tempFromDate);
    if (isNaN(start.getTime())) return;
    const end = new Date(start);
    end.setDate(end.getDate() + (days - 1));
    const endIso = end.toISOString().split('T')[0];
    setTempToDate(endIso);
  };

  // Save Configure Holiday Modal
  const handleSaveHolidayConfig = async () => {
    let s = configStartDate;
    let e = configEndDate;
    if (s > e) {
      const temp = s;
      s = e;
      e = temp;
    }

    const duration = calculateDurationDays(s, e);
    const dateRangeStr = formatDisplayRange(s, e);

    if (!isMarkedAsHoliday) {
      // Remove holidays overlapping this range
      setHolidays(prev => prev.filter(h => !(h.startDate <= e && h.endDate >= s)));
      setShowConfigModal(false);
      showToast('Config Saved', `Holiday removed for ${dateRangeStr}.`);
      return;
    }

    if (!configHolidayName.trim()) {
      showToast('Missing Name', 'Please enter a holiday title.', 'warning');
      return;
    }

    const newHoliday: HolidayItem = {
      id: `hol_${Date.now()}`,
      title: configHolidayName.trim(),
      startDate: s,
      endDate: e,
      dateRange: dateRangeStr,
      type: configType,
      description: configDescription.trim() || 'Official School Holiday',
      color: configColor,
      daysCount: duration,
    };

    setHolidays(prev => {
      // Replace any existing overlapping holidays
      const filtered = prev.filter(h => !(h.startDate <= e && h.endDate >= s));
      return [newHoliday, ...filtered];
    });

    try {
      await api.createResource('holidays', {
        title: configHolidayName.trim(),
        start_date: s,
        end_date: e,
        date_range: dateRangeStr,
        type: configType,
        description: configDescription.trim(),
        color: configColor,
      });
    } catch (err) {
      console.log('Error saving holiday to DB:', err);
    }

    setShowConfigModal(false);
    showToast('Holiday Saved!', `Successfully configured "${configHolidayName}" (${dateRangeStr} • ${duration} Day${duration > 1 ? 's' : ''}).`);
  };

  // Open Standard Add Modal
  const handleOpenAdd = () => {
    setEditingHoliday(null);
    setFormTitle('');
    setFormStartDate('2026-08-15');
    setFormEndDate('2026-08-15');
    setFormType('National');
    setFormDescription('Official academic holiday');
    setFormColor('#00f1a1');
    setShowAddEditModal(true);
  };

  // Open Standard Edit Modal
  const handleOpenEdit = (hol: HolidayItem) => {
    setEditingHoliday(hol);
    setFormTitle(hol.title);
    setFormStartDate(hol.startDate || '2026-08-15');
    setFormEndDate(hol.endDate || hol.startDate || '2026-08-15');
    setFormType(hol.type);
    setFormDescription(hol.description);
    setFormColor(hol.color || '#00f1a1');
    setShowAddEditModal(true);
  };

  // Save Add/Edit Holiday
  const handleSaveHoliday = () => {
    if (!formTitle.trim()) {
      showToast('Missing Title', 'Please enter a holiday title.', 'warning');
      return;
    }

    let s = formStartDate;
    let e = formEndDate;
    if (s > e) {
      const temp = s;
      s = e;
      e = temp;
    }

    const duration = calculateDurationDays(s, e);
    const dateRangeStr = formatDisplayRange(s, e);

    if (editingHoliday) {
      setHolidays(prev => prev.map(h => h.id === editingHoliday.id ? {
        ...h,
        title: formTitle.trim(),
        startDate: s,
        endDate: e,
        dateRange: dateRangeStr,
        type: formType,
        description: formDescription.trim(),
        color: formColor,
        daysCount: duration,
      } : h));
      showToast('Holiday Updated', `Successfully updated "${formTitle}".`);
    } else {
      const newHol: HolidayItem = {
        id: `hol_${Date.now()}`,
        title: formTitle.trim(),
        startDate: s,
        endDate: e,
        dateRange: dateRangeStr,
        type: formType,
        description: formDescription.trim() || 'Official School Holiday',
        color: formColor,
        daysCount: duration,
      };
      setHolidays(prev => [newHol, ...prev]);
      showToast('Holiday Created', `Added "${formTitle}" (${dateRangeStr}) to calendar.`);
    }

    setShowAddEditModal(false);
  };

  const handleDeleteHoliday = () => {
    if (!deletingHoliday) return;
    setHolidays(prev => prev.filter(h => h.id !== deletingHoliday.id));
    showToast('Holiday Removed', `Deleted "${deletingHoliday.title}".`, 'warning');
    setDeletingHoliday(null);
  };

  // Calendar Calculation Helpers for Main Grid
  const daysInMonthCount = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayWeekdayIndex = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sunday

  const calendarWeeks = useMemo(() => {
    const totalSlots: ({ dayNum: number; fullDateStr: string; isSunday: boolean } | null)[] = [];
    for (let i = 0; i < firstDayWeekdayIndex; i++) {
      totalSlots.push(null);
    }
    for (let d = 1; d <= daysInMonthCount; d++) {
      const dayOfWeek = (firstDayWeekdayIndex + d - 1) % 7;
      const monthStr = String(calendarMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      totalSlots.push({
        dayNum: d,
        fullDateStr: `${calendarYear}-${monthStr}-${dayStr}`,
        isSunday: dayOfWeek === 0,
      });
    }
    while (totalSlots.length % 7 !== 0) {
      totalSlots.push(null);
    }
    const weeks: (typeof totalSlots)[] = [];
    for (let i = 0; i < totalSlots.length; i += 7) {
      weeks.push(totalSlots.slice(i, i + 7));
    }
    return weeks;
  }, [calendarYear, calendarMonth, firstDayWeekdayIndex, daysInMonthCount]);

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

  const calPrevMonthRef = useRef(handlePrevMonth);
  const calNextMonthRef = useRef(handleNextMonth);
  calPrevMonthRef.current = handlePrevMonth;
  calNextMonthRef.current = handleNextMonth;

  // Swipe Gesture Responder for Calendar Month Grid
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

  // Calendar Range Picker Month Navigation
  const handlePrevRangeMonth = () => {
    if (rangePickerMonth === 0) {
      setRangePickerMonth(11);
      setRangePickerYear(prev => prev - 1);
    } else {
      setRangePickerMonth(prev => prev - 1);
    }
  };

  const handleNextRangeMonth = () => {
    if (rangePickerMonth === 11) {
      setRangePickerMonth(0);
      setRangePickerYear(prev => prev + 1);
    } else {
      setRangePickerMonth(prev => prev + 1);
    }
  };

  const filteredHolidays = useMemo(() => {
    return holidays.filter(h => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        h.title.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.dateRange.toLowerCase().includes(q);
      const matchesType = typeFilter === 'All' || typeFilter === 'Calendar' || h.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [holidays, searchQuery, typeFilter]);

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';

  return (
    <View style={[styles.container, isSuperAdmin && { backgroundColor: '#101415' }]}>
      <LinearGradient
        colors={isSuperAdmin ? ['#1d2022', '#101415'] : ['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Holiday Calendar"
        subtitle="School Holidays & Academic Events"
        icon={
          <View className={`w-11 h-11 rounded-2xl items-center justify-center ${primaryBadgeClass}`}>
            <Calendar size={22} color={primaryColor} />
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 28 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Search Bar & Action Buttons */}
        <View className="px-5 mb-5">
          <View className="flex-row items-center justify-between mb-3.5" style={{ gap: 10 }}>
            <View className="flex-1 bg-[#101415] border border-white/20 rounded-2xl flex-row items-center px-4 py-3 shadow-md">
              <Search size={18} color={primaryColor} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Search holiday, date, description..."
                placeholderTextColor="rgba(255, 255, 255, 0.45)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 text-white text-sm font-semibold"
                style={{ paddingVertical: 0 }}
              />
            </View>

            <Pressable
              onPress={handleOpenAdd}
              className={`${primaryBtnClass} px-4 py-3 rounded-2xl flex-row items-center justify-center shadow-lg active:scale-95 flex-shrink-0`}
              style={{ minWidth: 130 }}
            >
              <Plus size={18} color="#101415" style={{ marginRight: 6 }} strokeWidth={2.5} />
              <Text numberOfLines={1} style={{ color: '#101415', fontSize: 13.5, fontWeight: '900' }}>
                Add Holiday
              </Text>
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
                    className={`px-4 py-2 rounded-xl border ${isSelected ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/5 border-white/15 active:bg-white/10'}`}
                  >
                    <Text className={`text-sm font-bold ${isSelected ? 'text-[#101415]' : 'text-white/80'}`}>
                      {tf === 'All' ? 'All Holidays' : tf === 'Calendar' ? 'Calendar Grid' : tf}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* CONDITION 1: CALENDAR GRID VIEW */}
        {typeFilter === 'Calendar' ? (
          <View className="px-5 mb-8">
            <GlassCard intensity="low" className="p-4 sm:p-5 border-white/15 bg-[#101415]/95">

              {/* Calendar Grid Header Bar */}
              <View className="flex-row justify-between items-center mb-4 pb-3.5 border-b border-white/10">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center">
                    <Calendar size={18} color={primaryColor} style={{ marginRight: 8 }} />
                    <Text className="text-white font-extrabold text-base sm:text-lg">School Holidays Designer</Text>
                  </View>
                  <Text className="text-white/60 text-xs font-medium mt-0.5" numberOfLines={1}>
                    Tap any date to configure holidays
                  </Text>
                </View>

                {/* Medium Month Navigator: < September 2026 > */}
                <View className={`flex-row items-center bg-black/60 border ${isSuperAdmin ? 'border-[#f0c110]/40' : 'border-[#00f1a1]/40'} px-3 py-1.5 rounded-2xl shadow-md`}>
                  <Pressable onPress={handlePrevMonth} className="p-1 active:opacity-60" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <ChevronLeft size={16} color={primaryColor} />
                  </Pressable>
                  <Text className="text-white font-black text-xs sm:text-sm mx-2">
                    {MONTH_NAMES[calendarMonth]} {calendarYear}
                  </Text>
                  <Pressable onPress={handleNextMonth} className="p-1 active:opacity-60" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <ChevronRight size={16} color={primaryColor} />
                  </Pressable>
                </View>
              </View>

              {/* Calendar Swipeable Container */}
              <View {...calSwipeResponder.panHandlers}>
                {/* Weekday Labels Header - Locked 100/7% Column Grid */}
                <View style={{ flexDirection: 'row', width: '100%', marginBottom: 6 }}>
                  {DAY_NAMES.map((d, i) => (
                    <View key={d} style={{ width: `${100 / 7}%`, paddingHorizontal: 2 }}>
                      <View style={{ width: '100%', paddingVertical: 7, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, color: i === 0 ? '#fb7185' : 'rgba(255,255,255,0.85)' }}>
                          {d}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Calendar Days Grid (Locked 100/7% Columns per Week Row - Zero Sliding) */}
                <View style={{ width: '100%' }}>
                  {calendarWeeks.map((week, weekIdx) => (
                    <View key={`week_${weekIdx}`} style={{ flexDirection: 'row', width: '100%', marginBottom: 6 }}>
                      {week.map((cell, colIdx) => {
                        if (!cell) {
                          return (
                            <View key={`empty_${colIdx}`} style={{ width: `${100 / 7}%`, paddingHorizontal: 2 }}>
                              <View style={{ width: '100%', minHeight: 62, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' }} />
                            </View>
                          );
                        }

                        const { dayNum, fullDateStr, isSunday } = cell;
                        const holidayOnDay = findHolidayForDate(fullDateStr);

                        return (
                          <View key={`day_${dayNum}`} style={{ width: `${100 / 7}%`, paddingHorizontal: 2 }}>
                            <Pressable
                              onPress={() => handleOpenDateConfigModal(dayNum)}
                              style={[
                                { width: '100%', minHeight: 62, padding: 5, borderRadius: 12, borderWidth: 1, flexDirection: 'column', justifyContent: 'space-between' },
                                isSunday
                                  ? { backgroundColor: 'rgba(244, 63, 94, 0.12)', borderColor: 'rgba(244, 63, 94, 0.35)' }
                                  : holidayOnDay
                                    ? { backgroundColor: isSuperAdmin ? 'rgba(240, 193, 16, 0.15)' : 'rgba(0, 241, 161, 0.15)', borderColor: isSuperAdmin ? 'rgba(240, 193, 16, 0.5)' : 'rgba(0, 241, 161, 0.5)' }
                                    : { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }
                              ]}
                            >
                              {/* Day Number and Holiday Color Dot */}
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <Text style={{ fontSize: 12, fontWeight: '900', color: isSunday ? '#fb7185' : '#ffffff' }}>
                                  {dayNum}
                                </Text>
                                {holidayOnDay && (
                                  <View
                                    style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: holidayOnDay.color || primaryGold }}
                                  />
                                )}
                              </View>

                              {/* Sunday or Holiday Indicator Badge */}
                              {isSunday ? (
                                <View style={{ width: '100%', backgroundColor: 'rgba(244, 63, 94, 0.22)', paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.35)', alignItems: 'center', justifyContent: 'center' }}>
                                  <Text style={{ color: '#fda4af', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' }} numberOfLines={1}>
                                    SUN
                                  </Text>
                                </View>
                              ) : holidayOnDay ? (
                                <View
                                  style={{ width: '100%', backgroundColor: holidayOnDay.color || primaryGold, paddingVertical: 2, paddingHorizontal: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <Text style={{ color: '#101415', fontSize: 8, fontWeight: '900', textAlign: 'center' }} numberOfLines={1}>
                                    {holidayOnDay.title}
                                  </Text>
                                </View>
                              ) : null}
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>

            </GlassCard>
          </View>
        ) : (
          /* CONDITION 2: STANDARD DIRECTORY LIST CARDS */
          <View className="px-5">
            <View className="flex-row justify-between items-center mb-3.5">
              <Text className="text-white/80 text-sm font-black uppercase tracking-wider">
                Academic Holidays ({filteredHolidays.length})
              </Text>
              <Pressable onPress={() => setTypeFilter('Calendar')} className="flex-row items-center">
                <Text className={`${primaryTextClass} text-xs font-bold mr-1`}>Switch to Calendar Grid</Text>
                <ArrowRight size={14} color={primaryColor} />
              </Pressable>
            </View>

            {filteredHolidays.length === 0 ? (
              <GlassCard className="p-10 items-center justify-center border border-white/10 bg-[#101415]/90" intensity="low">
                <Calendar size={36} color="rgba(255,255,255,0.3)" style={{ marginBottom: 10 }} />
                <Text className="text-white/60 text-sm font-bold">No holidays matching filter criteria.</Text>
              </GlassCard>
            ) : (
              filteredHolidays.map(hol => {
                const badgeStyle = hol.type === 'National' ? (isSuperAdmin ? 'bg-[#f0c110]/20 border-[#f0c110]/40 text-[#ffe5a0]' : 'bg-[#00f1a1]/20 border-[#00f1a1]/40 text-[#00f1a1]') :
                  hol.type === 'Festival' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' :
                    hol.type === 'Vacation' ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' :
                      'bg-sky-500/20 border-sky-500/40 text-sky-400';

                const duration = hol.daysCount || calculateDurationDays(hol.startDate, hol.endDate);

                return (
                  <GlassCard key={hol.id} intensity="low" className="mb-4 p-4 sm:p-5 border-white/15 bg-[#101415]/90 shadow-lg">
                    <View className="flex-row justify-between items-start pb-3.5 border-b border-white/10 mb-3">
                      <View className="flex-row items-center flex-1 mr-2">
                        <View
                          className="w-12 h-12 rounded-2xl items-center justify-center mr-3 border"
                          style={{
                            backgroundColor: `${hol.color || primaryGold}25`,
                            borderColor: `${hol.color || primaryGold}50`
                          }}
                        >
                          <CalendarDays size={22} color={hol.color || primaryColor} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white font-black text-lg leading-tight mr-2">{hol.title}</Text>
                          <View className="flex-row items-center mt-1 flex-wrap" style={{ gap: 6 }}>
                            <Text className={`${primaryTextClass} text-sm font-extrabold`}>{hol.dateRange}</Text>
                            <View className="bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
                              <Text className="text-white/80 text-xs font-black">
                                {duration} {duration === 1 ? 'Day' : 'Days'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      <View className="flex-row items-center" style={{ gap: 8 }}>
                        <View className={`${badgeStyle} border px-3 py-1.5 rounded-xl`}>
                          <Text className={`${badgeStyle.split(' ').pop()} text-xs font-black uppercase`}>{hol.type}</Text>
                        </View>

                        <Pressable
                          onPress={() => handleOpenEdit(hol)}
                          className="bg-white/10 border border-white/15 p-2.5 rounded-xl active:bg-white/20"
                        >
                          <Pencil size={16} color="#ffffff" />
                        </Pressable>

                        <Pressable
                          onPress={() => setDeletingHoliday(hol)}
                          className="bg-rose-500/15 border border-rose-500/35 p-2.5 rounded-xl active:bg-rose-500/30"
                        >
                          <Trash2 size={16} color="#ff516a" />
                        </Pressable>
                      </View>
                    </View>

                    <Text className="text-white/85 text-sm font-medium leading-relaxed">{hol.description}</Text>
                  </GlassCard>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CONFIGURE SCHOOL HOLIDAY MODAL WITH DATE RANGE */}
      {showConfigModal && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowConfigModal(false)}>
          <View className="flex-1 bg-black/85 justify-center items-center p-4">
            <View className="w-full max-w-md p-5 sm:p-6 border border-white/20 rounded-3xl" style={{ backgroundColor: '#101415' }}>

              {/* Modal Header */}
              <View className="flex-row justify-between items-start pb-3.5 border-b border-white/10 mb-4">
                <View>
                  <Text className="text-white font-black text-lg">Configure School Holiday</Text>
                  <Text className={`${primaryTextClass} text-sm font-extrabold mt-0.5`}>
                    {formatDisplayRange(configStartDate, configEndDate)}
                  </Text>
                </View>
                <Pressable onPress={() => setShowConfigModal(false)} className="p-1 rounded-full bg-white/10">
                  <X size={20} color="#ffffff" />
                </Pressable>
              </View>

              {/* Checkbox: Mark as Holiday */}
              <Pressable
                onPress={() => setIsMarkedAsHoliday(!isMarkedAsHoliday)}
                className="flex-row items-center mb-4 bg-black/60 p-3.5 rounded-2xl border border-white/15"
              >
                <View className={`w-6 h-6 rounded-lg border flex-row items-center justify-center mr-3 ${isMarkedAsHoliday ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'border-white/40 bg-transparent'
                  }`}>
                  {isMarkedAsHoliday && <Check size={16} color="#101415" strokeWidth={3} />}
                </View>
                <Text className="text-white font-extrabold text-sm">Mark as School Holiday</Text>
              </Pressable>

              {/* DATE RANGE PICKER TRIGGER SECTION (FROM & TO DATES) */}
              <View className="mb-4 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <View className="flex-row justify-between items-center mb-2.5">
                  <Text className="text-white/80 text-xs font-black uppercase tracking-wider">Holiday Date Range</Text>
                  <View className="bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-500/40">
                    <Text className="text-emerald-400 text-xs font-black">
                      {calculateDurationDays(configStartDate, configEndDate)} Days Total
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                  <Pressable
                    onPress={() => openDateRangePicker('config')}
                    className="flex-1 bg-black/60 border border-white/15 p-3 rounded-xl flex-row items-center justify-between active:border-white/30"
                  >
                    <View>
                      <Text className="text-white/50 text-[10px] font-bold uppercase">From Date</Text>
                      <Text className="text-white text-sm font-black mt-0.5">{formatIsoToDisplay(configStartDate)}</Text>
                    </View>
                    <Calendar size={16} color={primaryColor} />
                  </Pressable>

                  <ArrowRight size={16} color="rgba(255,255,255,0.4)" />

                  <Pressable
                    onPress={() => openDateRangePicker('config')}
                    className="flex-1 bg-black/60 border border-white/15 p-3 rounded-xl flex-row items-center justify-between active:border-white/30"
                  >
                    <View>
                      <Text className="text-white/50 text-[10px] font-bold uppercase">To Date</Text>
                      <Text className="text-white text-sm font-black mt-0.5">{formatIsoToDisplay(configEndDate)}</Text>
                    </View>
                    <Calendar size={16} color={primaryColor} />
                  </Pressable>
                </View>
              </View>

              {/* Field: Holiday Name */}
              <View className="mb-3.5">
                <Text className="text-white/80 text-sm font-bold mb-1.5">Holiday Name *</Text>
                <TextInput
                  value={configHolidayName}
                  onChangeText={setConfigHolidayName}
                  placeholder="e.g. Dussehra Holidays, Diwali Break"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/60 border border-white/20 rounded-xl text-white px-3.5 py-3 text-sm font-bold"
                />
              </View>

              {/* Field: Category Type */}
              <View className="mb-3.5">
                <Text className="text-white/80 text-sm font-bold mb-1.5">Holiday Category *</Text>
                <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                  {(['National', 'Festival', 'Institutional', 'Vacation'] as const).map(t => (
                    <Pressable
                      key={t}
                      onPress={() => setConfigType(t)}
                      className={`px-3 py-1.5 rounded-xl border ${configType === t ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/5 border-white/15'}`}
                    >
                      <Text className={`text-xs font-extrabold ${configType === t ? 'text-[#101415]' : 'text-white/80'}`}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Field: Description */}
              <View className="mb-3.5">
                <Text className="text-white/80 text-sm font-bold mb-1.5">Description (Optional)</Text>
                <TextInput
                  value={configDescription}
                  onChangeText={setConfigDescription}
                  placeholder="e.g. School remains closed for all students and staff"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/60 border border-white/20 rounded-xl text-white px-3.5 py-2.5 text-sm"
                />
              </View>

              {/* Field: Visual Highlight Color */}
              <View className="mb-5">
                <Text className="text-white/80 text-sm font-bold mb-2">Visual Highlight Color *</Text>
                <View className="flex-row items-center justify-between px-1">
                  {HIGHLIGHT_COLORS.map(c => {
                    const isSelected = configColor === c;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setConfigColor(c)}
                        className={`w-10 h-10 rounded-full items-center justify-center border-2 ${isSelected ? 'border-white' : 'border-transparent'
                          }`}
                        style={[
                          { backgroundColor: c },
                          isSelected ? { transform: [{ scale: 1.15 }] } : undefined
                        ]}
                      >
                        {isSelected && <Check size={16} color="#101415" strokeWidth={3} />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row" style={{ gap: 10 }}>
                <Pressable
                  onPress={() => setShowConfigModal(false)}
                  className="flex-1 py-3.5 bg-white/10 rounded-xl items-center active:bg-white/20"
                >
                  <Text className="text-white font-bold text-sm">Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveHolidayConfig}
                  className={`flex-1 py-3.5 ${primaryBtnClass} rounded-xl items-center shadow-lg active:scale-95`}
                >
                  <Text className="text-[#101415] font-black text-sm">Save Holiday</Text>
                </Pressable>
              </View>

            </View>
          </View>
        </Modal>
      )}

      {/* STANDARD ADD / EDIT HOLIDAY MODAL WITH FROM & TO DATES */}
      {showAddEditModal && (
        <Modal visible={showAddEditModal} transparent animationType="fade" onRequestClose={() => setShowAddEditModal(false)}>
          <View className="flex-1 bg-black/85 justify-center items-center p-4">
            <View className="w-full max-w-md p-5 sm:p-6 border border-white/20 rounded-3xl" style={{ backgroundColor: '#101415' }}>
              <View className="flex-row justify-between items-center border-b border-white/10 pb-3.5 mb-4">
                <Text className="text-white font-black text-lg">{editingHoliday ? 'Edit Holiday Entry' : 'Add Holiday Entry'}</Text>
                <Pressable onPress={() => setShowAddEditModal(false)} className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                  <X size={16} color="#ffffff" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {/* Field 1: Title */}
                <View className="mb-4">
                  <Text className="text-white/80 text-sm font-bold mb-1.5">Holiday Title *</Text>
                  <TextInput
                    value={formTitle}
                    onChangeText={setFormTitle}
                    placeholder="e.g. Dussehra Vacation, Independence Day"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/60 border border-white/20 rounded-xl text-white px-3.5 py-3 text-sm font-bold"
                  />
                </View>

                {/* Field 2: Date Range (From & To Dates) */}
                <View className="mb-4 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                  <View className="flex-row justify-between items-center mb-2.5">
                    <Text className="text-white/80 text-xs font-black uppercase tracking-wider">Holiday Date Range</Text>
                    <View className="bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-500/40">
                      <Text className="text-emerald-400 text-xs font-black">
                        {calculateDurationDays(formStartDate, formEndDate)} Days Total
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                    <Pressable
                      onPress={() => openDateRangePicker('form')}
                      className="flex-1 bg-black/60 border border-white/15 p-3 rounded-xl flex-row items-center justify-between active:border-white/30"
                    >
                      <View>
                        <Text className="text-white/50 text-[10px] font-bold uppercase">From Date</Text>
                        <Text className="text-white text-sm font-black mt-0.5">{formatIsoToDisplay(formStartDate)}</Text>
                      </View>
                      <Calendar size={16} color={primaryColor} />
                    </Pressable>

                    <ArrowRight size={16} color="rgba(255,255,255,0.4)" />

                    <Pressable
                      onPress={() => openDateRangePicker('form')}
                      className="flex-1 bg-black/60 border border-white/15 p-3 rounded-xl flex-row items-center justify-between active:border-white/30"
                    >
                      <View>
                        <Text className="text-white/50 text-[10px] font-bold uppercase">To Date</Text>
                        <Text className="text-white text-sm font-black mt-0.5">{formatIsoToDisplay(formEndDate)}</Text>
                      </View>
                      <Calendar size={16} color={primaryColor} />
                    </Pressable>
                  </View>
                </View>

                {/* Field 3: Category Type */}
                <View className="mb-4">
                  <Text className="text-white/80 text-sm font-bold mb-1.5">Category Type *</Text>
                  <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                    {(['National', 'Festival', 'Institutional', 'Vacation'] as const).map(t => (
                      <Pressable
                        key={t}
                        onPress={() => setFormType(t)}
                        className={`px-3.5 py-2 rounded-xl border ${formType === t ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/5 border-white/10'}`}
                      >
                        <Text className={`text-xs font-black ${formType === t ? 'text-[#101415]' : 'text-white/80'}`}>{t}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Field 4: Visual Color Highlight */}
                <View className="mb-4">
                  <Text className="text-white/80 text-sm font-bold mb-2">Visual Badge Color *</Text>
                  <View className="flex-row items-center justify-between px-1">
                    {HIGHLIGHT_COLORS.map(c => {
                      const isSelected = formColor === c;
                      return (
                        <Pressable
                          key={c}
                          onPress={() => setFormColor(c)}
                          className={`w-9 h-9 rounded-full items-center justify-center border-2 ${isSelected ? 'border-white' : 'border-transparent'
                            }`}
                          style={[
                            { backgroundColor: c },
                            isSelected ? { transform: [{ scale: 1.15 }] } : undefined
                          ]}
                        >
                          {isSelected && <Check size={14} color="#101415" strokeWidth={3} />}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Field 5: Description */}
                <View className="mb-4">
                  <Text className="text-white/80 text-sm font-bold mb-1.5">Description</Text>
                  <TextInput
                    value={formDescription}
                    onChangeText={setFormDescription}
                    multiline
                    numberOfLines={3}
                    placeholder="Provide details about school closure..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="bg-black/60 border border-white/20 rounded-xl text-white px-3.5 py-3 text-sm font-medium"
                    style={{ textAlignVertical: 'top' }}
                  />
                </View>
              </ScrollView>

              <Pressable
                onPress={handleSaveHoliday}
                className={`${primaryBtnClass} py-3.5 rounded-xl items-center mt-2 shadow-lg active:scale-95`}
              >
                <Text className="text-[#101415] font-black text-sm uppercase">
                  {editingHoliday ? 'Save Changes' : 'Create Holiday'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* DATE RANGE PICKER MODAL */}
      {showRangePickerModal && (
        <Modal visible={showRangePickerModal} transparent animationType="fade" onRequestClose={() => setShowRangePickerModal(false)}>
          <View className="flex-1 bg-black/85 justify-center items-center p-4">
            <View className="w-full max-w-md p-5 sm:p-6 border border-white/20 rounded-3xl" style={{ backgroundColor: '#101415' }}>

              {/* Range Picker Header */}
              <View className="flex-row justify-between items-center pb-3.5 border-b border-white/10 mb-4">
                <View>
                  <Text className="text-white font-black text-lg">Select Holiday Date Range</Text>
                  <Text className="text-white/60 text-xs font-medium mt-0.5">Choose start and end dates for continuous holidays</Text>
                </View>
                <Pressable onPress={() => setShowRangePickerModal(false)} className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                  <X size={16} color="#ffffff" />
                </Pressable>
              </View>

              {/* From / To Date Switcher Ribbon */}
              <View className="flex-row mb-4 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                <Pressable
                  onPress={() => setActiveRangeTab('from')}
                  className={`flex-1 py-2.5 px-3 rounded-xl items-center ${activeRangeTab === 'from' ? (isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]') : 'bg-transparent'}`}
                >
                  <Text className={`text-xs font-black uppercase ${activeRangeTab === 'from' ? 'text-[#101415]' : 'text-white/60'}`}>
                    1. From Date
                  </Text>
                  <Text className={`text-sm font-black mt-0.5 ${activeRangeTab === 'from' ? 'text-[#101415]' : 'text-white'}`}>
                    {formatIsoToDisplay(tempFromDate)}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveRangeTab('to')}
                  className={`flex-1 py-2.5 px-3 rounded-xl items-center ${activeRangeTab === 'to' ? (isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]') : 'bg-transparent'}`}
                >
                  <Text className={`text-xs font-black uppercase ${activeRangeTab === 'to' ? 'text-[#101415]' : 'text-white/60'}`}>
                    2. To Date
                  </Text>
                  <Text className={`text-sm font-black mt-0.5 ${activeRangeTab === 'to' ? 'text-[#101415]' : 'text-white'}`}>
                    {formatIsoToDisplay(tempToDate)}
                  </Text>
                </Pressable>
              </View>

              {/* Quick Duration Shortcuts */}
              <View className="mb-4">
                <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Quick Duration Presets</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row" style={{ gap: 6 }}>
                    {[
                      { label: '1 Day', days: 1 },
                      { label: '2 Days', days: 2 },
                      { label: '3 Days', days: 3 },
                      { label: '5 Days', days: 5 },
                      { label: '1 Week', days: 7 },
                      { label: '10 Days', days: 10 },
                      { label: '2 Weeks', days: 14 }
                    ].map(preset => {
                      const curDays = calculateDurationDays(tempFromDate, tempToDate);
                      const isSel = curDays === preset.days;
                      return (
                        <Pressable
                          key={preset.label}
                          onPress={() => handleSelectQuickDuration(preset.days)}
                          className={`px-3 py-1.5 rounded-xl border ${isSel ? (isSuperAdmin ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-[#00f1a1] border-[#00f1a1]') : 'bg-white/10 border-white/15 active:bg-white/20'}`}
                        >
                          <Text className={`text-xs font-bold ${isSel ? 'text-[#101415]' : 'text-white'}`}>
                            {preset.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* Month Navigation Ribbon in Range Picker */}
              <View className="flex-row justify-between items-center bg-white/5 p-2.5 rounded-2xl mb-3 border border-white/10">
                <Pressable onPress={handlePrevRangeMonth} className="p-1 border border-white/10 rounded-lg bg-white/5 active:bg-white/20">
                  <ChevronLeft size={16} color={primaryColor} />
                </Pressable>
                <Text className="text-white font-extrabold text-sm">
                  {MONTH_NAMES[rangePickerMonth]} {rangePickerYear}
                </Text>
                <Pressable onPress={handleNextRangeMonth} className="p-1 border border-white/10 rounded-lg bg-white/5 active:bg-white/20">
                  <ChevronRight size={16} color={primaryColor} />
                </Pressable>
              </View>

              {/* 7-Column Days Header - Locked 100/7% Column Grid */}
              <View style={{ flexDirection: 'row', width: '100%', marginBottom: 6 }}>
                {DAY_NAMES.map((d, i) => (
                  <View key={i} style={{ width: `${100 / 7}%`, paddingHorizontal: 2 }}>
                    <View style={{ width: '100%', paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: i === 0 ? '#fb7185' : 'rgba(255,255,255,0.7)' }}>{d}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* 7-Column Calendar Grid with Range Highlighting - Locked Columns */}
              {(() => {
                const y = rangePickerYear;
                const m = rangePickerMonth;
                const firstDay = new Date(y, m, 1).getDay();
                const daysInM = new Date(y, m + 1, 0).getDate();
                const totalSlots: ({ dayNum: number; cellIso: string } | null)[] = [];
                for (let i = 0; i < firstDay; i++) totalSlots.push(null);
                for (let d = 1; d <= daysInM; d++) {
                  const dayStr = String(d).padStart(2, '0');
                  const monthStr = String(m + 1).padStart(2, '0');
                  totalSlots.push({ dayNum: d, cellIso: `${y}-${monthStr}-${dayStr}` });
                }
                while (totalSlots.length % 7 !== 0) {
                  totalSlots.push(null);
                }
                const modalWeeks: (typeof totalSlots)[] = [];
                for (let i = 0; i < totalSlots.length; i += 7) {
                  modalWeeks.push(totalSlots.slice(i, i + 7));
                }

                return (
                  <View style={{ width: '100%', marginBottom: 16 }}>
                    {modalWeeks.map((week, wIdx) => (
                      <View key={`r_week_${wIdx}`} style={{ flexDirection: 'row', width: '100%', marginBottom: 6 }}>
                        {week.map((cell, colIdx) => {
                          if (!cell) {
                            return (
                              <View key={`r_empty_${colIdx}`} style={{ width: `${100 / 7}%`, paddingHorizontal: 2, height: 36 }} />
                            );
                          }

                          const { dayNum, cellIso } = cell;
                          const isFrom = cellIso === tempFromDate;
                          const isTo = cellIso === tempToDate;
                          const inRange = cellIso >= tempFromDate && cellIso <= tempToDate;

                          return (
                            <View key={`r_day_${dayNum}`} style={{ width: `${100 / 7}%`, paddingHorizontal: 2 }}>
                              <Pressable
                                onPress={() => {
                                  if (activeRangeTab === 'from') {
                                    setTempFromDate(cellIso);
                                    if (cellIso > tempToDate) {
                                      setTempToDate(cellIso);
                                    }
                                    setActiveRangeTab('to');
                                  } else {
                                    if (cellIso < tempFromDate) {
                                      setTempFromDate(cellIso);
                                    } else {
                                      setTempToDate(cellIso);
                                    }
                                  }
                                }}
                                style={[
                                  { width: '100%', height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
                                  (isFrom || isTo)
                                    ? { backgroundColor: isSuperAdmin ? '#f0c110' : '#00f1a1', borderColor: isSuperAdmin ? '#f0c110' : '#00f1a1' }
                                    : inRange
                                      ? { backgroundColor: isSuperAdmin ? 'rgba(240, 193, 16, 0.25)' : 'rgba(0, 241, 161, 0.25)', borderColor: isSuperAdmin ? 'rgba(240, 193, 16, 0.4)' : 'rgba(0, 241, 161, 0.4)' }
                                      : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }
                                ]}
                              >
                                <Text style={{ fontSize: 12, fontWeight: '800', color: (isFrom || isTo) ? '#101415' : inRange ? (isSuperAdmin ? '#ffe5a0' : '#00f1a1') : '#ffffff' }}>
                                  {dayNum}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                );
              })()}

              {/* Range Action Buttons */}
              <View className="flex-row border-t border-white/10 pt-3.5" style={{ gap: 10 }}>
                <Pressable
                  onPress={() => setShowRangePickerModal(false)}
                  className="flex-1 py-3 bg-white/10 rounded-xl items-center active:bg-white/20"
                >
                  <Text className="text-white font-bold text-sm">Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleApplyRangePicker}
                  className={`flex-1 py-3 ${primaryBtnClass} rounded-xl items-center shadow-lg active:scale-95`}
                >
                  <Text className="text-[#101415] font-black text-sm">Apply Date Range</Text>
                </Pressable>
              </View>

            </View>
          </View>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingHoliday && (
        <Modal visible={!!deletingHoliday} transparent animationType="fade" onRequestClose={() => setDeletingHoliday(null)}>
          <View className="flex-1 bg-black/85 justify-center items-center p-4">
            <View className="bg-[#101415] border border-rose-500/40 rounded-3xl w-full max-w-sm p-6 items-center shadow-2xl">
              <View className="w-14 h-14 rounded-full bg-rose-500/20 items-center justify-center mb-4">
                <Trash2 size={26} color="#ff516a" />
              </View>
              <Text className="text-white font-black text-lg mb-2 text-center">Delete Holiday?</Text>
              <Text className="text-white/70 text-sm text-center mb-6 leading-relaxed">
                Are you sure you want to remove <Text className="text-white font-extrabold">"{deletingHoliday.title}"</Text> ({deletingHoliday.dateRange})?
              </Text>

              <View className="flex-row w-full" style={{ gap: 10 }}>
                <Pressable
                  onPress={() => setDeletingHoliday(null)}
                  className="flex-1 py-3 rounded-xl bg-white/10 items-center active:bg-white/20"
                >
                  <Text className="text-white text-sm font-bold">Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleDeleteHoliday}
                  className="flex-1 py-3 rounded-xl bg-rose-500 items-center shadow-lg active:scale-95"
                >
                  <Text className="text-white text-sm font-black">Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* TOAST NOTIFICATION */}
      {toastData.visible && (
        <View className={`absolute bottom-6 left-5 right-5 ${primaryBtnClass} p-4 rounded-2xl flex-row items-center justify-between shadow-2xl z-50`}>
          <View className="flex-1 mr-2">
            <Text className="text-[#101415] font-black text-sm">{toastData.title}</Text>
            <Text className="text-[#101415]/85 text-xs font-semibold mt-0.5">{toastData.message}</Text>
          </View>
          <CheckCircle2 size={20} color="#101415" />
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
  },
});

export default HolidayCalendarScreen;
