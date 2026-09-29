import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  BackHandler,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Printer,
  X,
  ChevronDown,
  Building2,
  User,
  BookOpen,
  Eye,
  Shield,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

export interface TimetableCellData {
  subject: string;
  teacherName: string;
  room: string;
  isFree?: boolean;
}

export interface ScheduleRowDef {
  id: string;
  type: 'period' | 'break';
  periodNumber?: number;
  label: string;
  time: string;
  isBreak?: boolean;
  breakTitle?: string;
  rowHeight: number;
}

export const TIMETABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ALL_CLASSES = [
  'NurseryA', 'NurseryB', 'LKGA', 'LKGB', 'UKGA', 'UKGB',
  '1A', '1B', '1C', '2A', '2B', '3A', '3B', '4A', '4B', '5A',
  '6A', '7A', '8A', '9A', '10A'
];

const CLASS_TEACHERS: Record<string, string> = {
  'NurseryA': 'Mrs. Sarah Khan',
  'NurseryB': 'Ms. Anita Desai',
  'LKGA': 'Mrs. Sunita Rao',
  'LKGB': 'Ms. Fatima Sheikh',
  'UKGA': 'Mrs. Lavanya Reddy',
  'UKGB': 'Mrs. Kavita Joshi',
  '1A': 'Mrs. Mary Thomas',
  '1B': 'Mrs. Geeta Patel',
  '1C': 'Ms. Ritu Sharma',
  '2A': 'Mrs. Deepa Menon',
  '2B': 'Mrs. Anjali Varma',
  '3A': 'Mrs. Rekha Iyer',
  '3B': 'Mr. Joseph Paul',
  '4A': 'Mrs. Sujatha Nair',
  '4B': 'Mr. Pradeep Reddy',
  '5A': 'Mrs. Lakshmi Narayanan',
  '6A': 'Mrs. Sunita Rao',
  '7A': 'Dr. Meenakshi Sundaram',
  '8A': 'M Surender',
  '9A': 'Dr. Meenakshi Sundaram',
  '10A': 'Mrs. Anita Sharma',
};

const SCHEDULE_ROWS: ScheduleRowDef[] = [
  { id: 'p1', type: 'period', periodNumber: 1, label: 'Period 1', time: '9:30 AM - 10:20 AM', rowHeight: 68 },
  { id: 'p2', type: 'period', periodNumber: 2, label: 'Period 2', time: '10:20 AM - 11:00 AM', rowHeight: 68 },
  { id: 'b1', type: 'break', label: 'Break', time: '11:00 AM - 11:10 AM', isBreak: true, breakTitle: 'BREAK', rowHeight: 34 },
  { id: 'p3', type: 'period', periodNumber: 3, label: 'Period 3', time: '11:10 AM - 11:50 AM', rowHeight: 68 },
  { id: 'p4', type: 'period', periodNumber: 4, label: 'Period 4', time: '11:50 AM - 12:30 PM', rowHeight: 68 },
  { id: 'b2', type: 'break', label: 'Break', time: '12:30 PM - 1:00 PM', isBreak: true, breakTitle: 'BREAK', rowHeight: 34 },
  { id: 'p5', type: 'period', periodNumber: 5, label: 'Period 5', time: '1:00 PM - 1:40 PM', rowHeight: 68 },
  { id: 'p6', type: 'period', periodNumber: 6, label: 'Period 6', time: '1:40 PM - 2:20 PM', rowHeight: 68 },
  { id: 'p7', type: 'period', periodNumber: 7, label: 'Period 7', time: '2:20 PM - 3:00 PM', rowHeight: 68 },
  { id: 'b3', type: 'break', label: 'Break', time: '3:00 PM - 3:20 PM', isBreak: true, breakTitle: 'BREAK', rowHeight: 34 },
  { id: 'p8', type: 'period', periodNumber: 8, label: 'Period 8', time: '3:20 PM - 4:40 PM', rowHeight: 68 },
];

const SUBJECT_STYLES: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    subtext: string;
    dot: string;
    htmlBg: string;
    htmlBorder: string;
    htmlText: string;
  }
> = {
  'Telugu': {
    bg: '#332415',
    border: '#d97706',
    text: '#fbbf24',
    subtext: '#fde68a',
    dot: '#f59e0b',
    htmlBg: '#fef3c7',
    htmlBorder: '#f59e0b',
    htmlText: '#92400e',
  },
  'Biology': {
    bg: '#142c22',
    border: '#059669',
    text: '#34d399',
    subtext: '#a7f3d0',
    dot: '#10b981',
    htmlBg: '#d1fae5',
    htmlBorder: '#10b981',
    htmlText: '#065f46',
  },
  'Science': {
    bg: '#142c22',
    border: '#059669',
    text: '#34d399',
    subtext: '#a7f3d0',
    dot: '#10b981',
    htmlBg: '#d1fae5',
    htmlBorder: '#10b981',
    htmlText: '#065f46',
  },
  'Social': {
    bg: '#332d15',
    border: '#ca8a04',
    text: '#facc15',
    subtext: '#fef08a',
    dot: '#eab308',
    htmlBg: '#fef9c3',
    htmlBorder: '#eab308',
    htmlText: '#854d0e',
  },
  'Social Studies': {
    bg: '#332d15',
    border: '#ca8a04',
    text: '#facc15',
    subtext: '#fef08a',
    dot: '#eab308',
    htmlBg: '#fef9c3',
    htmlBorder: '#eab308',
    htmlText: '#854d0e',
  },
  'Hindi': {
    bg: '#331820',
    border: '#e11d48',
    text: '#fb7185',
    subtext: '#fecdd3',
    dot: '#f43f5e',
    htmlBg: '#ffe4e6',
    htmlBorder: '#f43f5e',
    htmlText: '#9f1239',
  },
  'Maths': {
    bg: '#332415',
    border: '#d97706',
    text: '#fcd34d',
    subtext: '#fde68a',
    dot: '#d97706',
    htmlBg: '#fef3c7',
    htmlBorder: '#d97706',
    htmlText: '#78350f',
  },
  'Mathematics': {
    bg: '#332415',
    border: '#d97706',
    text: '#fcd34d',
    subtext: '#fde68a',
    dot: '#d97706',
    htmlBg: '#fef3c7',
    htmlBorder: '#d97706',
    htmlText: '#78350f',
  },
  'English': {
    bg: '#251a3a',
    border: '#9333ea',
    text: '#c084fc',
    subtext: '#e9d5ff',
    dot: '#a855f7',
    htmlBg: '#ede9fe',
    htmlBorder: '#a855f7',
    htmlText: '#581c87',
  },
  'Physics': {
    bg: '#1e1f3a',
    border: '#4f46e5',
    text: '#818cf8',
    subtext: '#c7d2fe',
    dot: '#6366f1',
    htmlBg: '#e0e7ff',
    htmlBorder: '#6366f1',
    htmlText: '#3730a3',
  },
  'Chemistry': {
    bg: '#331820',
    border: '#e11d48',
    text: '#f43f5e',
    subtext: '#fecdd3',
    dot: '#e11d48',
    htmlBg: '#ffe4e6',
    htmlBorder: '#e11d48',
    htmlText: '#881337',
  },
  'Computer Science': {
    bg: '#142738',
    border: '#0284c7',
    text: '#38bdf8',
    subtext: '#bae6fd',
    dot: '#0ea5e9',
    htmlBg: '#e0f2fe',
    htmlBorder: '#0ea5e9',
    htmlText: '#0369a1',
  },
  'Physical Education': {
    bg: '#142c1b',
    border: '#16a34a',
    text: '#4ade80',
    subtext: '#bbf7d0',
    dot: '#22c55e',
    htmlBg: '#dcfce7',
    htmlBorder: '#22c55e',
    htmlText: '#15803d',
  },
  'Free': {
    bg: '#231e34',
    border: '#3d3554',
    text: '#c4b5fd',
    subtext: '#a79bbb',
    dot: '#8b5cf6',
    htmlBg: '#f3f4f6',
    htmlBorder: '#d1d5db',
    htmlText: '#6b7280',
  }
};

const LEGEND_ITEMS = [
  { name: 'Mathematics', color: '#d97706' },
  { name: 'Science', color: '#10b981' },
  { name: 'English', color: '#a855f7' },
  { name: 'Telugu', color: '#f59e0b' },
  { name: 'Hindi', color: '#f43f5e' },
  { name: 'Social Studies', color: '#eab308' },
  { name: 'Physical Education', color: '#22c55e' },
  { name: 'Computer Science', color: '#0ea5e9' },
];

const generateClassTimetable = (cls: string): Record<string, Record<string, TimetableCellData>> => {
  const result: Record<string, Record<string, TimetableCellData>> = {};

  if (cls === '8A') {
    TIMETABLE_DAYS.forEach((day) => {
      result[day] = {
        'p1': { subject: 'Telugu', teacherName: 'M Surender', room: 'Room 12' },
        'p2': { subject: 'Biology', teacherName: 'H Ramesh', room: 'Room 12' },
        'p3': { subject: 'Social', teacherName: 'Srinivas Vasudev', room: 'Room 12' },
        'p4': { subject: 'Hindi', teacherName: 'Md Mohammed', room: 'Room 12' },
        'p5': { subject: 'Maths', teacherName: 'K Madhuri', room: 'Room 12' },
        'p6': { subject: 'English', teacherName: 'C Shivani', room: 'Room 12' },
        'p7': { subject: 'Physics', teacherName: 'H Ramesh', room: 'Room 12' },
        'p8': { subject: 'Free', teacherName: '', room: '', isFree: true },
      };
    });
    return result;
  }

  const cleanCls = cls.replace(/^(Class|Grade)\s*/i, '').trim();
  const roomNum = `Room ${cleanCls || '10'}`;

  TIMETABLE_DAYS.forEach((day, dayIdx) => {
    result[day] = {
      'p1': {
        subject: dayIdx % 2 === 0 ? 'Mathematics' : 'English',
        teacherName: dayIdx % 2 === 0 ? 'Mrs. Anita Sharma' : 'Mr. David Miller',
        room: roomNum,
      },
      'p2': {
        subject: dayIdx % 2 === 0 ? 'Physics' : 'Biology',
        teacherName: dayIdx % 2 === 0 ? 'Mr. Rajesh Kumar' : 'Mr. Vikramaditya',
        room: roomNum,
      },
      'p3': {
        subject: 'Social Studies',
        teacherName: 'Mrs. Sunita Rao',
        room: roomNum,
      },
      'p4': {
        subject: dayIdx % 3 === 0 ? 'Hindi' : 'Telugu',
        teacherName: dayIdx % 3 === 0 ? 'Mr. Suresh Verma' : 'M Surender',
        room: roomNum,
      },
      'p5': {
        subject: dayIdx === 5 ? 'Physical Education' : 'Mathematics',
        teacherName: dayIdx === 5 ? 'Mr. David Paul' : 'Mrs. Anita Sharma',
        room: dayIdx === 5 ? 'Sports Ground' : roomNum,
      },
      'p6': {
        subject: dayIdx % 2 === 1 ? 'Computer Science' : 'English',
        teacherName: dayIdx % 2 === 1 ? 'Mrs. Priya Nambiar' : 'Mr. David Miller',
        room: dayIdx % 2 === 1 ? 'Computer Lab' : roomNum,
      },
      'p7': {
        subject: 'Chemistry',
        teacherName: 'Dr. Meenakshi Sundaram',
        room: 'Chemistry Lab',
      },
      'p8': {
        subject: 'Free',
        teacherName: '',
        room: '',
        isFree: true,
      },
    };
  });

  return result;
};

export const TeacherTimetableScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isSmallPhone, tabBarBottomPadding, headerPaddingTop } = useResponsive();
  const { user } = useAuthStore();

  const [selectedClass, setSelectedClass] = useState<string>('8A');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026-2027 (Current)');
  const [showYearModal, setShowYearModal] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Read-only cell preview modal
  const [selectedCell, setSelectedCell] = useState<{
    day: string;
    rowDef: ScheduleRowDef;
    data: TimetableCellData;
  } | null>(null);

  // Handle Hardware Back Button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (selectedCell) {
          setSelectedCell(null);
          return true;
        }
        if (showYearModal) {
          setShowYearModal(false);
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
    }, [selectedCell, showYearModal, navigation])
  );

  const timetableData = useMemo(() => {
    return generateClassTimetable(selectedClass);
  }, [selectedClass]);

  const assignedPeriodsCount = useMemo(() => {
    let count = 0;
    TIMETABLE_DAYS.forEach((day) => {
      const dayData = timetableData[day] || {};
      Object.keys(dayData).forEach((rowKey) => {
        const item = dayData[rowKey];
        if (item && item.subject && !item.isFree && item.subject !== 'Free') {
          count++;
        }
      });
    });
    return count;
  }, [timetableData]);

  const classTeacherName = CLASS_TEACHERS[selectedClass] || 'M Surender';

  // Print Timetable using expo-print
  const handlePrintTimetable = async () => {
    try {
      setIsPrinting(true);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Class ${selectedClass} Timetable</title>
            <style>
              @page {
                size: landscape;
                margin: 0.8cm;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #ffffff;
                color: #111827;
                margin: 0;
                padding: 12px;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 12px;
                margin-bottom: 14px;
              }
              .school-info h1 {
                margin: 0;
                font-size: 20px;
                color: #1f2937;
                font-weight: 800;
              }
              .school-info p {
                margin: 2px 0 0 0;
                font-size: 11px;
                color: #6b7280;
              }
              .meta-badge {
                display: inline-block;
                background: #ede9fe;
                color: #6d28d9;
                padding: 4px 10px;
                border-radius: 9999px;
                font-size: 11px;
                font-weight: 700;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
              }
              th {
                background: #f9fafb;
                color: #374151;
                padding: 8px 10px;
                border: 1px solid #e5e7eb;
                font-weight: 700;
                text-align: center;
              }
              td {
                border: 1px solid #e5e7eb;
                padding: 6px;
                vertical-align: top;
                height: 52px;
              }
              .period-col {
                background: #fafafa;
                width: 110px;
                text-align: center;
              }
              .period-time {
                font-size: 10px;
                color: #6b7280;
                font-weight: 600;
              }
              .period-lbl {
                font-size: 11px;
                color: #111827;
                font-weight: 800;
              }
              .break-cell {
                background: #f3f4f6;
                text-align: center;
                vertical-align: middle;
                font-weight: 800;
                color: #6b7280;
                letter-spacing: 2px;
                height: 24px;
              }
              .cell-box {
                border-radius: 6px;
                padding: 5px;
                min-height: 44px;
                box-sizing: border-box;
              }
              .subj {
                font-weight: 800;
                font-size: 11px;
                margin-bottom: 2px;
              }
              .teacher {
                font-size: 9.5px;
                color: #4b5563;
              }
              .room {
                font-size: 9px;
                color: #6b7280;
                margin-top: 2px;
              }
              .footer {
                margin-top: 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 10px;
                color: #6b7280;
                border-top: 1px solid #e5e7eb;
                padding-top: 8px;
              }
              .legend {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 10px;
              }
              .legend-item {
                display: flex;
                align-items: center;
                font-size: 9.5px;
                color: #4b5563;
              }
              .legend-dot {
                width: 8px;
                height: 8px;
                border-radius: 2px;
                margin-right: 4px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="school-info">
                <h1>Class ${selectedClass} Timetable Schedule</h1>
                <p>Academic Year: ${selectedAcademicYear} • Class Teacher: <strong>${classTeacherName}</strong></p>
              </div>
              <div>
                <span class="meta-badge">${assignedPeriodsCount} Periods Assigned</span>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th class="period-col">Period</th>
                  ${TIMETABLE_DAYS.map((d) => `<th>${d}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${SCHEDULE_ROWS.map((row) => {
                  if (row.isBreak) {
                    return `
                      <tr>
                        <td class="period-col">
                          <div class="period-time">${row.time}</div>
                          <div class="period-lbl">${row.label}</div>
                        </td>
                        <td colspan="${TIMETABLE_DAYS.length}" class="break-cell">
                          ${row.breakTitle || 'BREAK'}
                        </td>
                      </tr>
                    `;
                  }

                  return `
                    <tr>
                      <td class="period-col">
                        <div class="period-time">${row.time}</div>
                        <div class="period-lbl">${row.label}</div>
                      </td>
                      ${TIMETABLE_DAYS.map((day) => {
                        const cell = timetableData[day]?.[row.id];
                        if (!cell || cell.isFree || cell.subject === 'Free') {
                          return `
                            <td>
                              <div class="cell-box" style="background:#f9fafb; border:1px dashed #d1d5db; text-align:center; color:#6b7280; padding-top:14px; font-weight:700;">
                                Free
                              </div>
                            </td>
                          `;
                        }

                        const style = SUBJECT_STYLES[cell.subject] || SUBJECT_STYLES['English'];
                        return `
                          <td>
                            <div class="cell-box" style="background:${style.htmlBg}; border:1px solid ${style.htmlBorder}; color:${style.htmlText};">
                              <div class="subj" style="color:${style.htmlText}">${cell.subject}</div>
                              <div class="teacher">${cell.teacherName}</div>
                              <div class="room">${cell.room}</div>
                            </div>
                          </td>
                        `;
                      }).join('')}
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="legend">
              ${LEGEND_ITEMS.map(
                (lg) => `
                <div class="legend-item">
                  <div class="legend-dot" style="background:${lg.color};"></div>
                  <span>${lg.name}</span>
                </div>
              `
              ).join('')}
            </div>

            <div class="footer">
              <span>Generated via KTS School Portal • Teacher Read-Only View</span>
              <span>Class Teacher: ${classTeacherName}</span>
              <span>Printed on: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </body>
        </html>
      `;

      await Print.printAsync({ html: htmlContent });
    } catch (err: any) {
      Alert.alert('Print Notice', 'Could not open print preview: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsPrinting(false);
    }
  };

  const dayColumnWidth = 112;
  const periodColumnWidth = 96;
  const headerHeight = 34;

  return (
    <View style={styles.container}>
      {/* Background Deep Gradient */}
      <LinearGradient
        colors={["#22143d", "#150d26", "#0b0912", "#08070d"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER (Matching Examination Screen Header) */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={40} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <Pressable
                onPress={() => {
                  if (navigation?.canGoBack && navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate('Dashboard');
                  }
                }}
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center mr-3 active:bg-white/20"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color="#ddb7ff" />
              </Pressable>

              <View className="flex-1 justify-center">
                <View className="flex-row items-center">
                  <Text className="text-white text-lg md:text-xl font-extrabold mr-2" numberOfLines={1} style={{ includeFontPadding: false }}>
                    Timetable Designer
                  </Text>
                  <View className="bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full flex-row items-center">
                    <Shield size={10} color="#34d399" style={{ marginRight: 3 }} />
                    <Text className="text-emerald-300 font-extrabold text-[10px]">Read Only</Text>
                  </View>
                </View>

                {/* Academic Year Dropdown Trigger */}
                <Pressable
                  onPress={() => setShowYearModal(true)}
                  className="flex-row items-center mt-0.5 active:opacity-75"
                  style={{ flexWrap: 'nowrap' }}
                >
                  <View className="w-2 h-2 rounded-full bg-[#00f1a1] mr-1.5" style={{ flexShrink: 0 }} />
                  <Text
                    className="text-[#ddb7ff] text-xs font-semibold mr-1"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                    style={{ flexShrink: 1, includeFontPadding: false }}
                  >
                    Academic Year: {selectedAcademicYear}
                  </Text>
                  <ChevronDown size={13} color="#ddb7ff" />
                </Pressable>
              </View>
            </View>
          </View>
        </BlurView>
      </View>

      {/* MAIN CONTENT SCROLLVIEW */}
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          paddingBottom: Math.max(tabBarBottomPadding + 40, 90),
          paddingTop: 12,
          paddingHorizontal: 12,
        }}
        className="flex-1"
      >
        {/* 2. CLASS FILTER PILLS */}
        <View className="mb-3.5">
          <Text className="text-white/60 text-[11px] font-extrabold uppercase tracking-wider mb-2 px-1">
            Select Class
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 2, paddingRight: 16 }}
            className="overflow-visible"
          >
            {ALL_CLASSES.map((cls) => {
              const isSelected = selectedClass === cls;
              return (
                <Pressable
                  key={cls}
                  onPress={() => setSelectedClass(cls)}
                  style={{
                    backgroundColor: isSelected ? '#1d4ed8' : '#1e1a2f',
                    borderColor: isSelected ? '#60a5fa' : 'rgba(255,255,255,0.12)',
                    minWidth: 44,
                    height: 38,
                    paddingHorizontal: 12,
                    marginRight: 8,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: isSelected ? '#3b82f6' : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isSelected ? 0.6 : 0,
                    shadowRadius: 4,
                    elevation: isSelected ? 5 : 0,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.75)',
                      fontWeight: isSelected ? '900' : '700',
                      fontSize: 12,
                    }}
                  >
                    {cls}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. ACTION & STATUS BAR (Refined, no clipping, bigger print button) */}
        <View
          style={{
            backgroundColor: '#181524',
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
            borderRadius: 18,
            padding: 12,
            marginBottom: 14,
            width: '100%',
          }}
        >
          {/* Top row with tags & class teacher */}
          <View className="flex-row items-center justify-between flex-wrap gap-2 mb-2.5">
            <View className="flex-row items-center flex-wrap gap-2 flex-1">
              <View className="bg-sky-500/20 border border-sky-500/40 px-3 py-1.5 rounded-full">
                <Text className="text-sky-300 font-extrabold text-xs">
                  {assignedPeriodsCount} periods assigned
                </Text>
              </View>

              <View className="flex-row items-center bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <User size={12} color="#ddb7ff" style={{ marginRight: 5 }} />
                <Text className="text-white/80 text-xs font-semibold">
                  Class Teacher: <Text className="text-white font-extrabold">{classTeacherName}</Text>
                </Text>
              </View>
            </View>

            <View className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex-row items-center">
              <Eye size={13} color="#34d399" style={{ marginRight: 5 }} />
              <Text className="text-emerald-300 font-extrabold text-xs">Read Only View</Text>
            </View>
          </View>

          {/* Prominent Print Button */}
          <Pressable
            onPress={handlePrintTimetable}
            disabled={isPrinting}
            style={{
              backgroundColor: '#ddb7ff',
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <Printer size={16} color="#181524" style={{ marginRight: 8 }} />
            <Text
              style={{
                color: '#181524',
                fontWeight: '900',
                fontSize: 13,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {isPrinting ? 'Generating Print View...' : 'Print Timetable Schedule'}
            </Text>
          </Pressable>
        </View>

        {/* 4. TIMETABLE MATRIX TABLE (Compact & Clean) */}
        <View
          style={{
            backgroundColor: '#14121f',
            borderColor: 'rgba(255,255,255,0.18)',
            borderWidth: 1,
            borderRadius: 0,
            overflow: 'hidden',
            marginBottom: 14,
            width: '100%',
          }}
        >
          <View style={{ flexDirection: 'row', width: '100%' }}>
            {/* FIXED / STICKY LEFT COLUMN: PERIOD & TIMINGS */}
            <View
              style={{
                width: periodColumnWidth,
                backgroundColor: '#19152a',
                borderRightWidth: 1.5,
                borderRightColor: 'rgba(255,255,255,0.2)',
                zIndex: 10,
              }}
            >
              {/* Period Header */}
              <View
                style={{
                  height: headerHeight,
                  backgroundColor: '#201b36',
                  borderBottomWidth: 1.5,
                  borderBottomColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 2,
                }}
              >
                <Text
                  style={{
                    color: '#ffffff',
                    fontWeight: '900',
                    fontSize: 10.5,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  Period
                </Text>
              </View>

              {/* Period Column Rows */}
              {SCHEDULE_ROWS.map((rowDef) => {
                const isBreak = rowDef.isBreak;
                const timeParts = rowDef.time.split(' - ');

                return (
                  <View
                    key={rowDef.id}
                    style={{
                      height: rowDef.rowHeight,
                      backgroundColor: isBreak ? '#1b172a' : '#171325',
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255,255,255,0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 3,
                    }}
                  >
                    {!isBreak && (
                      <Clock size={10} color="rgba(255,255,255,0.4)" style={{ marginBottom: 1 }} />
                    )}
                    {timeParts.length === 2 ? (
                      <View style={{ alignItems: 'center' }}>
                        <Text
                          style={{
                            color: isBreak ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.7)',
                            fontSize: 8.5,
                            fontWeight: '700',
                            textAlign: 'center',
                            includeFontPadding: false,
                          }}
                          numberOfLines={1}
                        >
                          {timeParts[0]} -
                        </Text>
                        <Text
                          style={{
                            color: isBreak ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.7)',
                            fontSize: 8.5,
                            fontWeight: '700',
                            textAlign: 'center',
                            includeFontPadding: false,
                          }}
                          numberOfLines={1}
                        >
                          {timeParts[1]}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={{
                          color: isBreak ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.7)',
                          fontSize: 8.5,
                          fontWeight: '700',
                          textAlign: 'center',
                          includeFontPadding: false,
                        }}
                        numberOfLines={1}
                      >
                        {rowDef.time}
                      </Text>
                    )}
                    <Text
                      style={{
                        color: isBreak ? 'rgba(255,255,255,0.85)' : '#ddb7ff',
                        fontSize: isBreak ? 9.5 : 10.5,
                        fontWeight: '900',
                        marginTop: 1.5,
                        includeFontPadding: false,
                      }}
                      numberOfLines={1}
                    >
                      {rowDef.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* HORIZONTAL SCROLLABLE RIGHT DAYS AREA */}
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={true}
              persistentScrollbar={true}
              style={{ flex: 1 }}
              contentContainerStyle={{ width: dayColumnWidth * TIMETABLE_DAYS.length }}
            >
              <View style={{ width: dayColumnWidth * TIMETABLE_DAYS.length }}>
                {/* DAYS HEADER ROW */}
                <View
                  style={{
                    height: headerHeight,
                    flexDirection: 'row',
                    backgroundColor: '#1b172c',
                    borderBottomWidth: 1.5,
                    borderBottomColor: 'rgba(255,255,255,0.2)',
                  }}
                >
                  {TIMETABLE_DAYS.map((day) => (
                    <View
                      key={day}
                      style={{
                        width: dayColumnWidth,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRightWidth: 1,
                        borderRightColor: 'rgba(255,255,255,0.12)',
                        paddingHorizontal: 2,
                      }}
                    >
                      <Text
                        style={{
                          color: '#ffffff',
                          fontWeight: '900',
                          fontSize: 10.5,
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                        }}
                      >
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* DAYS BODY ROWS */}
                {SCHEDULE_ROWS.map((rowDef) => {
                  const isBreak = rowDef.isBreak;

                  if (isBreak) {
                    return (
                      <View
                        key={rowDef.id}
                        style={{
                          height: rowDef.rowHeight,
                          width: dayColumnWidth * TIMETABLE_DAYS.length,
                          backgroundColor: '#171324',
                          borderBottomWidth: 1,
                          borderBottomColor: 'rgba(255,255,255,0.1)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 8,
                        }}
                      >
                        <View
                          style={{
                            width: '100%',
                            height: 20,
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.15)',
                            borderStyle: 'dashed',
                            borderRadius: 6,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text
                            style={{
                              color: 'rgba(255,255,255,0.65)',
                              fontWeight: '900',
                              fontSize: 10,
                              letterSpacing: 3,
                              textTransform: 'uppercase',
                            }}
                          >
                            {rowDef.breakTitle || 'BREAK'}
                          </Text>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View
                      key={rowDef.id}
                      style={{
                        height: rowDef.rowHeight,
                        flexDirection: 'row',
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(255,255,255,0.1)',
                        backgroundColor: '#14121f',
                      }}
                    >
                      {TIMETABLE_DAYS.map((day) => {
                        const cellData = timetableData[day]?.[rowDef.id] || {
                          subject: 'Free',
                          teacherName: '',
                          room: '',
                          isFree: true,
                        };

                        const isFree = cellData.isFree || cellData.subject === 'Free';
                        const style = SUBJECT_STYLES[cellData.subject] || SUBJECT_STYLES['Free'];

                        return (
                          <View
                            key={day}
                            style={{
                              width: dayColumnWidth,
                              height: rowDef.rowHeight,
                              padding: 2.5,
                              borderRightWidth: 1,
                              borderRightColor: 'rgba(255,255,255,0.1)',
                            }}
                          >
                            <Pressable
                              onPress={() =>
                                setSelectedCell({
                                  day,
                                  rowDef,
                                  data: cellData,
                                })
                              }
                              style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: style.bg,
                                borderColor: style.border,
                                borderWidth: 1,
                                borderRadius: 8,
                                padding: 4,
                                justifyContent: 'space-between',
                              }}
                            >
                              {isFree ? (
                                <View
                                  style={{
                                    flex: 1,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: style.text,
                                      fontWeight: '800',
                                      fontSize: 10.5,
                                    }}
                                  >
                                    Free
                                  </Text>
                                </View>
                              ) : (
                                <>
                                  <View>
                                    <Text
                                      numberOfLines={1}
                                      style={{
                                        color: style.text,
                                        fontWeight: '900',
                                        fontSize: 10.5,
                                      }}
                                    >
                                      {cellData.subject}
                                    </Text>
                                    <Text
                                      numberOfLines={1}
                                      style={{
                                        color: '#ffffff',
                                        fontWeight: '600',
                                        fontSize: 9,
                                        marginTop: 0.5,
                                      }}
                                    >
                                      {cellData.teacherName}
                                    </Text>
                                  </View>

                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                    }}
                                  >
                                    <Text
                                      numberOfLines={1}
                                      style={{
                                        color: 'rgba(255,255,255,0.6)',
                                        fontSize: 8.5,
                                        fontWeight: '700',
                                      }}
                                    >
                                      {cellData.room}
                                    </Text>
                                    <View
                                      style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: 2.5,
                                        backgroundColor: style.dot,
                                      }}
                                    />
                                  </View>
                                </>
                              )}
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* 5. SUBJECT COLOR LEGEND (Full width, no cutdown) */}
        <View
          style={{
            backgroundColor: '#181524',
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
            borderRadius: 18,
            padding: 14,
            marginBottom: 20,
            width: '100%',
          }}
        >
          <Text
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 10,
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            Subject Color Code
          </Text>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              width: '100%',
            }}
          >
            {LEGEND_ITEMS.map((item) => (
              <View
                key={item.name}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderWidth: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 10,
                }}
              >
                <View
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 4.5,
                    backgroundColor: item.color,
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.85)',
                    fontWeight: '700',
                    fontSize: 11,
                  }}
                >
                  {item.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* READ ONLY CELL DETAILS MODAL */}
      {selectedCell && (
        <Modal
          visible={!!selectedCell}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedCell(null)}
        >
          <View className="flex-1 bg-black/80 items-center justify-center p-5">
            <View className="w-full max-w-sm bg-[#181524] border border-[#ddb7ff]/30 rounded-3xl p-5 shadow-2xl">
              {/* Modal Header */}
              <View className="flex-row justify-between items-center pb-3 border-b border-white/10 mb-4">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-xl bg-[#ddb7ff]/20 items-center justify-center mr-2.5">
                    <Calendar size={16} color="#ddb7ff" />
                  </View>
                  <View>
                    <Text className="text-white font-black text-base">Class Schedule Details</Text>
                    <Text className="text-white/50 text-xs">
                      {selectedCell.day} • {selectedCell.rowDef.label}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setSelectedCell(null)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                >
                  <X size={16} color="white" />
                </Pressable>
              </View>

              {/* Modal Body */}
              <View className="gap-3 mb-5">
                <View className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
                  <Text className="text-white/50 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                    Subject Allotment
                  </Text>
                  <Text className="text-[#ddb7ff] text-base font-black">
                    {selectedCell.data.subject}
                  </Text>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3">
                    <Text className="text-white/50 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                      Assigned Faculty
                    </Text>
                    <Text className="text-white font-bold text-xs" numberOfLines={1}>
                      {selectedCell.data.teacherName || 'Not Assigned'}
                    </Text>
                  </View>

                  <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3">
                    <Text className="text-white/50 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                      Classroom / Venue
                    </Text>
                    <Text className="text-white font-bold text-xs" numberOfLines={1}>
                      {selectedCell.data.room || 'Classroom'}
                    </Text>
                  </View>
                </View>

                <View className="bg-white/5 border border-white/10 rounded-2xl p-3">
                  <Text className="text-white/50 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                    Slot Timing
                  </Text>
                  <Text className="text-white font-bold text-xs">
                    {selectedCell.rowDef.time} ({selectedCell.day})
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setSelectedCell(null)}
                className="w-full py-3 bg-[#ddb7ff] rounded-2xl items-center active:bg-[#c084fc]"
              >
                <Text className="text-[#181524] font-black text-xs uppercase tracking-wider">
                  Close Preview
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* ACADEMIC YEAR SELECTOR MODAL */}
      {showYearModal && (
        <Modal
          visible={showYearModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowYearModal(false)}
        >
          <View className="flex-1 bg-black/80 items-center justify-center p-5">
            <View className="w-full max-w-xs bg-[#181524] border border-[#ddb7ff]/30 rounded-3xl p-5 shadow-2xl">
              <View className="flex-row justify-between items-center pb-3 border-b border-white/10 mb-3">
                <Text className="text-white font-black text-sm">Select Academic Year</Text>
                <Pressable onPress={() => setShowYearModal(false)}>
                  <X size={16} color="white" />
                </Pressable>
              </View>

              {['2026-2027 (Current)', '2025-2026 (Archived)', '2024-2025 (Archived)'].map(
                (year) => {
                  const isSelected = selectedAcademicYear === year;
                  return (
                    <Pressable
                      key={year}
                      onPress={() => {
                        setSelectedAcademicYear(year);
                        setShowYearModal(false);
                      }}
                      className={`p-3 rounded-xl mb-2 flex-row items-center justify-between ${
                        isSelected
                          ? 'bg-[#ddb7ff]/20 border border-[#ddb7ff]/40'
                          : 'bg-white/5 border border-white/10 active:bg-white/10'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-[#ddb7ff]' : 'text-white'
                        }`}
                      >
                        {year}
                      </Text>
                      {isSelected && <CheckCircle2 size={14} color="#ddb7ff" />}
                    </Pressable>
                  );
                }
              )}
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
    backgroundColor: '#08070d',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
});
