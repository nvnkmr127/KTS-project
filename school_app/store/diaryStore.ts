import { create } from 'zustand';

export interface DiaryEntry {
  id: string;
  classId: string;
  className: string;
  periodNumber: number;
  subject: string;
  teacherName: string;
  topicTitle: string;
  contentSummary: string;
  homework: string;
  date: string; // YYYY-MM-DD or DD-MM-YYYY
  submittedAt: string;
  attachmentName?: string;
}

interface DiaryStore {
  diaryEntries: DiaryEntry[];
  addOrUpdateEntry: (entry: Omit<DiaryEntry, 'id' | 'submittedAt'>) => void;
  getEntriesForClassAndDate: (classId: string, date: string) => DiaryEntry[];
  getClassSubmittedCount: (classId: string, date: string) => number;
}

const INITIAL_MOCK_ENTRIES: DiaryEntry[] = [
  {
    id: 'd_10a_1',
    classId: '10A',
    className: 'Class 10A',
    periodNumber: 1,
    subject: 'Mathematics',
    teacherName: 'Mrs. Anita Sharma',
    topicTitle: 'Quadratic Equations & Real Roots',
    contentSummary: 'Completed Exercise 4.3 on discriminant methods and real roots.',
    homework: 'Ex 4.3 Q1-8',
    date: '04-08-2026',
    submittedAt: '08:55 AM',
    attachmentName: 'quadratic_worksheet.pdf'
  },
  {
    id: 'd_10a_2',
    classId: '10A',
    className: 'Class 10A',
    periodNumber: 2,
    subject: 'Physics',
    teacherName: 'Mr. Rajesh Kumar',
    topicTitle: 'Electromagnetism & Faraday Law',
    contentSummary: 'Demonstrated magnetic flux induction using solenoid coils.',
    homework: 'Lab Manual Verification',
    date: '04-08-2026',
    submittedAt: '09:50 AM',
    attachmentName: 'solenoid_lab_guide.pdf'
  },
  {
    id: 'd_10a_3',
    classId: '10A',
    className: 'Class 10A',
    periodNumber: 3,
    subject: 'Chemistry',
    teacherName: 'Dr. Meenakshi Sundaram',
    topicTitle: 'Chemical Stoichiometry',
    contentSummary: 'Balanced chemical equations practice and barium chloride demonstration.',
    homework: 'Page 112 Q1-5',
    date: '04-08-2026',
    submittedAt: '10:45 AM'
  }
];

export const useDiaryStore = create<DiaryStore>((set, get) => ({
  diaryEntries: INITIAL_MOCK_ENTRIES,

  addOrUpdateEntry: (newEntryData) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    set((state) => {
      const existingIdx = state.diaryEntries.findIndex(
        (e) => e.classId === newEntryData.classId && e.periodNumber === newEntryData.periodNumber && e.date === newEntryData.date
      );

      if (existingIdx !== -1) {
        const copy = [...state.diaryEntries];
        copy[existingIdx] = {
          ...copy[existingIdx],
          ...newEntryData,
          submittedAt: timeStr
        };
        return { diaryEntries: copy };
      } else {
        const newEntry: DiaryEntry = {
          ...newEntryData,
          id: `d_${newEntryData.classId}_${newEntryData.periodNumber}_${Date.now()}`,
          submittedAt: timeStr
        };
        return { diaryEntries: [newEntry, ...state.diaryEntries] };
      }
    });
  },

  getEntriesForClassAndDate: (classId, date) => {
    return get().diaryEntries.filter(
      (e) => e.classId.toUpperCase() === classId.toUpperCase() && e.date === date
    );
  },

  getClassSubmittedCount: (classId, date) => {
    return get().diaryEntries.filter(
      (e) => e.classId.toUpperCase() === classId.toUpperCase() && e.date === date
    ).length;
  }
}));
