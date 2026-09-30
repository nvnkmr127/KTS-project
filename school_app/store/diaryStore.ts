import { create } from 'zustand';
import { api } from '../services/api';

export interface DiaryEntry {
  id: string;
  classId: string;
  className: string;
  periodNumber?: number;
  subject?: string;
  teacherName: string;
  topicTitle?: string;
  topics?: string;
  contentSummary?: string;
  notes?: string;
  homework?: string;
  homeworkSubmissionDate?: string; // DD-MM-YYYY or YYYY-MM-DD
  date: string; // DD-MM-YYYY or YYYY-MM-DD
  submittedAt: string;
  attachmentName?: string;
  parentsCount?: number;
}

interface DiaryStore {
  diaryEntries: DiaryEntry[];
  fetchDailyDiariesFromApi: () => Promise<void>;
  addOrUpdateEntry: (entry: Omit<DiaryEntry, 'id' | 'submittedAt'>) => Promise<void>;
  getEntriesForClassAndDate: (classId: string, date: string) => DiaryEntry[];
  getClassSubmittedCount: (classId: string, date: string) => number;
}

// Helper to normalize dates for comparison (supports both DD-MM-YYYY and YYYY-MM-DD)
export const normalizeDate = (d: string): string => {
  if (!d) return '';
  const trimmed = d.trim();
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD -> DD-MM-YYYY
        return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
      }
      return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
    }
  }
  return trimmed;
};

const INITIAL_MOCK_ENTRIES: DiaryEntry[] = [
  {
    id: 'd_rec_3b',
    classId: '3B',
    className: 'Class 3B',
    teacherName: 'Ashwini',
    topics: '2nd bit and 3rd bit revision completed',
    topicTitle: '2nd bit and 3rd bit revision completed',
    contentSummary: '2nd bit and 3rd bit revision completed in workbook.',
    homework: '',
    notes: '',
    date: '11-09-2026',
    submittedAt: '03:15 PM',
    parentsCount: 28,
  },
  {
    id: 'd_rec_2a',
    classId: '2A',
    className: 'Class 2A',
    teacherName: 'Ashwini',
    topics: '3rd bit nd 4rth bit revision completed',
    topicTitle: '3rd bit nd 4rth bit revision completed',
    contentSummary: '3rd bit nd 4rth bit revision completed.',
    homework: '',
    notes: '',
    date: '11-09-2026',
    submittedAt: '02:40 PM',
    parentsCount: 30,
  },
  {
    id: 'd_rec_2b',
    classId: '2B',
    className: 'Class 2B',
    teacherName: 'Ashwini',
    topics: '3rd bit and 4rth bit revision completed',
    topicTitle: '3rd bit and 4rth bit revision completed',
    contentSummary: '3rd bit and 4rth bit revision completed in textbook.',
    homework: '',
    notes: '',
    date: '11-09-2026',
    submittedAt: '01:50 PM',
    parentsCount: 27,
  },
  {
    id: 'd_rec_3a',
    classId: '3A',
    className: 'Class 3A',
    teacherName: 'Ashwini',
    topics: '2nd bit to 4rth bit revision completed',
    topicTitle: '2nd bit to 4rth bit revision completed',
    contentSummary: '2nd bit to 4rth bit revision completed.',
    homework: '',
    notes: '',
    date: '11-09-2026',
    submittedAt: '11:30 AM',
    parentsCount: 29,
  },
  {
    id: 'd_rec_4b',
    classId: '4B',
    className: 'Class 4B',
    teacherName: 'N Shirisha',
    topics: 'Given revision question and answers.',
    topicTitle: 'Given revision question and answers.',
    contentSummary: 'Given revision question and answers for Chapter 5.',
    homework: 'Learn match the following from c/w.',
    notes: 'Bring classwork tomorrow without fail.',
    date: '09-09-2026',
    submittedAt: '04:10 PM',
    parentsCount: 32,
  },
  {
    id: 'd_10a_1',
    classId: '10A',
    className: 'Class 10A',
    periodNumber: 1,
    subject: 'Mathematics',
    teacherName: 'Mrs. Anita Sharma',
    topicTitle: 'Quadratic Equations & Real Roots',
    topics: 'Quadratic Equations & Real Roots',
    contentSummary: 'Completed Exercise 4.3 on discriminant methods and real roots.',
    homework: 'Ex 4.3 Q1-8',
    date: '30-09-2026',
    submittedAt: '08:55 AM',
    attachmentName: 'quadratic_worksheet.pdf',
    parentsCount: 35,
  },
  {
    id: 'd_10a_2',
    classId: '10A',
    className: 'Class 10A',
    periodNumber: 2,
    subject: 'Physics',
    teacherName: 'Mr. Rajesh Kumar',
    topicTitle: 'Electromagnetism & Faraday Law',
    topics: 'Electromagnetism & Faraday Law',
    contentSummary: 'Demonstrated magnetic flux induction using solenoid coils.',
    homework: 'Lab Manual Verification',
    date: '30-09-2026',
    submittedAt: '09:50 AM',
    attachmentName: 'solenoid_lab_guide.pdf',
    parentsCount: 35,
  },
  {
    id: 'd_10a_3',
    classId: '10A',
    className: 'Class 10A',
    periodNumber: 3,
    subject: 'Chemistry',
    teacherName: 'Dr. Meenakshi Sundaram',
    topicTitle: 'Chemical Stoichiometry',
    topics: 'Chemical Stoichiometry',
    contentSummary: 'Balanced chemical equations practice and barium chloride demonstration.',
    homework: 'Page 112 Q1-5',
    date: '30-09-2026',
    submittedAt: '10:45 AM',
    parentsCount: 35,
  }
];

export const useDiaryStore = create<DiaryStore>((set, get) => ({
  diaryEntries: INITIAL_MOCK_ENTRIES,

  fetchDailyDiariesFromApi: async () => {
    try {
      const res = await api.getResources('daily-diaries');
      if (Array.isArray(res) && res.length > 0) {
        const mapped: DiaryEntry[] = res.map((d: any) => ({
          id: String(d.id),
          classId: (d.class_id || d.batch_id || d.batch_name || '10A').replace(/^Class\s*/i, ''),
          className: d.class_name || (d.batch_name ? (d.batch_name.startsWith('Class ') ? d.batch_name : `Class ${d.batch_name}`) : 'Class 10A'),
          periodNumber: d.period_number ? Number(d.period_number) : undefined,
          subject: d.subject || 'General',
          teacherName: d.teacher_name || 'Faculty Member',
          topicTitle: d.topic_title || d.topics || d.title || 'Lesson Overview',
          topics: d.topics || d.topic_title || d.title || 'Lesson Overview',
          contentSummary: d.content_summary || d.summary || d.description || d.topics || '',
          notes: d.notes || '',
          homework: d.homework || '',
          date: normalizeDate(d.date || d.diary_date || new Date().toISOString().split('T')[0]),
          submittedAt: d.submitted_at || '09:00 AM',
          attachmentName: d.attachment_name,
          parentsCount: d.parents_count || 28,
        }));
        set({ diaryEntries: mapped });
      }
    } catch (e) {
      console.log('Error fetching daily diaries:', e);
    }
  },

  addOrUpdateEntry: async (newEntryData) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const cleanClassId = newEntryData.classId.replace(/^Class\s*/i, '');
    const cleanClassName = newEntryData.className || `Class ${cleanClassId}`;
    const cleanDate = normalizeDate(newEntryData.date);
    const topics = newEntryData.topics || newEntryData.topicTitle || '';
    const notes = newEntryData.notes || newEntryData.contentSummary || '';

    // Sync with backend API
    try {
      await api.createResource('daily-diaries', {
        batch_name: cleanClassId,
        class_id: cleanClassId,
        class_name: cleanClassName,
        period_number: newEntryData.periodNumber,
        subject: newEntryData.subject || 'General',
        teacher_name: newEntryData.teacherName,
        topics: topics,
        topic_title: topics,
        content_summary: notes,
        homework: newEntryData.homework || '',
        notes: notes,
        diary_date: cleanDate.split('-').reverse().join('-'), // YYYY-MM-DD
        date: cleanDate,
        submitted_at: timeStr,
        parents_count: newEntryData.parentsCount || 28,
        attachment_name: newEntryData.attachmentName,
      });

      try {
        await api.recordActivityLog({
          log_name: 'diary',
          event: 'created',
          description: `${newEntryData.teacherName} published daily diary update for ${cleanClassName}.`,
          properties: {
            class_name: cleanClassId,
            topics: topics,
            homework: newEntryData.homework || '',
            notes: notes,
            diary_date: cleanDate,
            marked_by: newEntryData.teacherName,
            actor_name: newEntryData.teacherName,
          },
        });
      } catch { /* empty */ }
    } catch (e) {
      console.log('Error creating daily diary entry in database:', e);
    }

    set((state) => {
      const existingIdx = state.diaryEntries.findIndex(
        (e) =>
          normalizeDate(e.date) === cleanDate &&
          e.classId.toUpperCase() === cleanClassId.toUpperCase() &&
          ((newEntryData.periodNumber && e.periodNumber === newEntryData.periodNumber) ||
           (!newEntryData.periodNumber && !e.periodNumber))
      );

      const entryToCommit: DiaryEntry = {
        id: existingIdx !== -1 ? state.diaryEntries[existingIdx].id : `d_${cleanClassId}_${Date.now()}`,
        classId: cleanClassId,
        className: cleanClassName,
        periodNumber: newEntryData.periodNumber,
        subject: newEntryData.subject,
        teacherName: newEntryData.teacherName,
        topicTitle: topics,
        topics: topics,
        contentSummary: notes,
        notes: notes,
        homework: newEntryData.homework || '',
        homeworkSubmissionDate: newEntryData.homeworkSubmissionDate || undefined,
        date: cleanDate,
        submittedAt: timeStr,
        attachmentName: newEntryData.attachmentName,
        parentsCount: newEntryData.parentsCount || 28,
      };

      if (existingIdx !== -1) {
        const copy = [...state.diaryEntries];
        copy[existingIdx] = entryToCommit;
        return { diaryEntries: copy };
      } else {
        return { diaryEntries: [entryToCommit, ...state.diaryEntries] };
      }
    });
  },

  getEntriesForClassAndDate: (classId, date) => {
    const normDate = normalizeDate(date);
    const cleanClassId = classId.replace(/^Class\s*/i, '').toUpperCase();
    return get().diaryEntries.filter(
      (e) => e.classId.toUpperCase() === cleanClassId && normalizeDate(e.date) === normDate
    );
  },

  getClassSubmittedCount: (classId, date) => {
    const normDate = normalizeDate(date);
    const cleanClassId = classId.replace(/^Class\s*/i, '').toUpperCase();
    return get().diaryEntries.filter(
      (e) => e.classId.toUpperCase() === cleanClassId && normalizeDate(e.date) === normDate
    ).length;
  }
}));

