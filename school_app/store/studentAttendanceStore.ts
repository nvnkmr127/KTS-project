import { create } from 'zustand';
import { api } from '../services/api';

export interface StudentPeriodAttendance {
  studentId: string;
  studentName: string;
  roll: string;
  className: string;
  date: string; // YYYY-MM-DD
  session: 'first_period' | 'lunch_period';
  status: 'present' | 'absent';
  markedBy: string;
  markedById: string;
  markedAt: string;
  autoAllotted?: boolean;
}

export interface StudentItem {
  id: string;
  name: string;
  roll: string;
  init: string;
  className: string;
}

export interface BatchItem {
  id: string;
  name: string;
  classTeacherId?: string | number;
  classTeacherName?: string;
}

export const ALL_BATCHES: BatchItem[] = [
  { id: 'b-4b', name: 'Class 4B', classTeacherName: 'Sheeren Sultana', classTeacherId: '1' },
  { id: 'b-3a', name: 'Class 3A', classTeacherName: 'Mrs. Anita Sharma', classTeacherId: '2' },
  { id: 'b-7a', name: 'Class 7A', classTeacherName: 'Dr. Meenakshi Sundaram', classTeacherId: '3' },
  { id: 'b-8a', name: 'Class 8A', classTeacherName: 'M Surender', classTeacherId: '4' },
  { id: 'b-10a', name: 'Class 10A', classTeacherName: 'Mrs. Priya Nambiar', classTeacherId: '5' },
  { id: 'b-1a', name: 'Class 1A', classTeacherName: 'Mrs. Sunita Rao', classTeacherId: '6' },
  { id: 'b-1b', name: 'Class 1B', classTeacherName: 'Mr. Rajesh Kumar', classTeacherId: '7' },
  { id: 'b-2a', name: 'Class 2A', classTeacherName: 'Mrs. Kavita Patel', classTeacherId: '8' },
  { id: 'b-2b', name: 'Class 2B', classTeacherName: 'Mr. Ramesh Varma', classTeacherId: '9' },
  { id: 'b-3b', name: 'Class 3B', classTeacherName: 'Mrs. Sarah Jenkins', classTeacherId: '10' },
  { id: 'b-4a', name: 'Class 4A', classTeacherName: 'Mr. Vikramaditya Singh', classTeacherId: '11' },
  { id: 'b-5a', name: 'Class 5A', classTeacherName: 'Mrs. Anita Sharma', classTeacherId: '2' },
  { id: 'b-5b', name: 'Class 5B', classTeacherName: 'Dr. Meenakshi Sundaram', classTeacherId: '3' },
  { id: 'b-6a', name: 'Class 6A', classTeacherName: 'Mr. Rajesh Kumar', classTeacherId: '7' },
  { id: 'b-6b', name: 'Class 6B', classTeacherName: 'Mrs. Priya Nambiar', classTeacherId: '5' },
  { id: 'b-7b', name: 'Class 7B', classTeacherName: 'Mr. Ramesh Varma', classTeacherId: '9' },
  { id: 'b-9a', name: 'Class 9A', classTeacherName: 'Dr. Meenakshi Sundaram', classTeacherId: '3' },
];

export const STUDENTS_BY_CLASS: Record<string, StudentItem[]> = {
  'Class 4B': [
    { id: 's-4b-1', name: 'H VAISHANVI', roll: 'STDDe2026074', init: 'HV', className: 'Class 4B' },
    { id: 's-4b-2', name: 'MANGALI SWATHI', roll: 'STDDe2026075', init: 'MS', className: 'Class 4B' },
    { id: 's-4b-3', name: 'SHERI MAANVITHA', roll: 'STDDe2026076', init: 'SM', className: 'Class 4B' },
    { id: 's-4b-4', name: 'ADDANUMUTHI RUTHWIK', roll: 'STDDe2026077', init: 'AR', className: 'Class 4B' },
    { id: 's-4b-5', name: 'CHAKALI SAI VARSHITH', roll: 'STDDe2026078', init: 'CS', className: 'Class 4B' },
    { id: 's-4b-6', name: 'GADDAMEEDA SAIDATH', roll: 'STDDe2026079', init: 'GS', className: 'Class 4B' },
    { id: 's-4b-7', name: 'TURPU SHASHIVARDHAN', roll: 'STDDe2026080', init: 'TS', className: 'Class 4B' },
    { id: 's-4b-8', name: 'VOGGU ANEESH VARDHAN', roll: 'STDDe2026081', init: 'VA', className: 'Class 4B' },
    { id: 's-4b-9', name: 'KUMMARI YUGENDHAR', roll: 'STDDe2026082', init: 'KY', className: 'Class 4B' },
    { id: 's-4b-10', name: 'THASILI NARESH', roll: 'STDDe2026083', init: 'TN', className: 'Class 4B' },
    { id: 's-4b-11', name: 'BABAPURAM SHIVANI', roll: '1548', init: 'BS', className: 'Class 4B' },
    { id: 's-4b-12', name: 'BARLAPALLY KRUTHIKA', roll: '1543', init: 'BK', className: 'Class 4B' },
    { id: 's-4b-13', name: 'BEENAMONI GANESH', roll: '1536', init: 'BG', className: 'Class 4B' },
    { id: 's-4b-14', name: 'BULKAPURAM KARTHIK REDDY', roll: '1566', init: 'BK', className: 'Class 4B' },
    { id: 's-4b-15', name: 'CHAKALI JASHWANTH', roll: '1564', init: 'CJ', className: 'Class 4B' },
    { id: 's-4b-16', name: 'CHETTUKINDI GOUTHAMI', roll: '1541', init: 'CG', className: 'Class 4B' },
    { id: 's-4b-17', name: 'G SAIKRISHNA', roll: 'STDDe2026043', init: 'GS', className: 'Class 4B' },
    { id: 's-4b-18', name: 'GHANAPURAM AKSHIT', roll: 'STDDe2026044', init: 'GA', className: 'Class 4B' },
    { id: 's-4b-19', name: 'K VIVEKA', roll: 'STDDe2026046', init: 'KV', className: 'Class 4B' },
    { id: 's-4b-20', name: 'KAVALI AVINASH', roll: 'STDDe2026047', init: 'KA', className: 'Class 4B' },
    { id: 's-4b-21', name: 'KHANAPURAM LITHIKA SRI', roll: 'STDDe2026050', init: 'KL', className: 'Class 4B' },
    { id: 's-4b-22', name: 'KORE SAI CHARAN', roll: 'STDDe2026051', init: 'KS', className: 'Class 4B' },
    { id: 's-4b-23', name: 'MD MUZAFIR KHAN', roll: 'STDDe2026054', init: 'MM', className: 'Class 4B' },
    { id: 's-4b-24', name: 'MONDIVAGU NESHITHA', roll: 'STDDe2026057', init: 'MN', className: 'Class 4B' },
    { id: 's-4b-25', name: 'MOTHE NAGARAJU', roll: 'STDDe2026058', init: 'MN', className: 'Class 4B' },
    { id: 's-4b-26', name: 'SALE ISHIKA', roll: 'STDDe2026062', init: 'SI', className: 'Class 4B' },
    { id: 's-4b-27', name: 'AMGOTH DIVYA', roll: 'STDDe2026072', init: 'AD', className: 'Class 4B' },
  ],
  'Class 3A': [
    { id: 's-3a-1', name: 'SUHASINI SADULA', roll: 'STDDe2026171', init: 'SS', className: 'Class 3A' },
    { id: 's-3a-2', name: 'VARSHITH THOOPRU', roll: 'STDDe2026172', init: 'VT', className: 'Class 3A' },
    { id: 's-3a-3', name: 'ABHI RAM VADDE', roll: 'STDDe2026173', init: 'AR', className: 'Class 3A' },
    { id: 's-3a-4', name: 'DEEKSHITHA V', roll: 'STDDe2026174', init: 'DV', className: 'Class 3A' },
    { id: 's-3a-5', name: 'VIRENDRA SING SING', roll: 'STDDe2026175', init: 'VS', className: 'Class 3A' },
    { id: 's-3a-6', name: 'RAKSHITHA V', roll: 'STDDe2026176', init: 'RV', className: 'Class 3A' },
    { id: 's-3a-7', name: 'LOWKYA GADDAMIDI', roll: 'STDDe2026177', init: 'LG', className: 'Class 3A' },
    { id: 's-3a-8', name: 'SAHARSRA R', roll: 'STDDe2026178', init: 'SR', className: 'Class 3A' },
    { id: 's-3a-9', name: 'Naveen Kumar', roll: 'STDDe2026179', init: 'NK', className: 'Class 3A' },
    { id: 's-3a-10', name: 'Vigneshwar M', roll: 'STDDe2026180', init: 'VM', className: 'Class 3A' },
    { id: 's-3a-11', name: 'PRANAVI ALOOR', roll: 'STDDe2026150', init: 'PA', className: 'Class 3A' },
    { id: 's-3a-12', name: 'ANAS Mohammed', roll: 'STDDe2026151', init: 'AM', className: 'Class 3A' },
    { id: 's-3a-13', name: 'NIKSHITH YADAV CHITTEMPALLY', roll: 'STDDe2026152', init: 'NY', className: 'Class 3A' },
    { id: 's-3a-14', name: 'CHANIKYA GAJJAGANI', roll: 'STDDe2026153', init: 'CG', className: 'Class 3A' },
    { id: 's-3a-15', name: 'SIRI GAJJAGANI', roll: 'STDDe2026154', init: 'SG', className: 'Class 3A' },
    { id: 's-3a-16', name: 'RUTHVIK GOPANI', roll: 'STDDe2026155', init: 'RG', className: 'Class 3A' },
    { id: 's-3a-17', name: 'SRIDEVI GUGULOTHU', roll: 'STDDe2026156', init: 'SG', className: 'Class 3A' },
    { id: 's-3a-18', name: 'JAIVARDHAN JAM', roll: 'STDDe2026157', init: 'JJ', className: 'Class 3A' },
    { id: 's-3a-19', name: 'DEEPAK KASIRE', roll: 'STDDe2026158', init: 'DK', className: 'Class 3A' },
    { id: 's-3a-20', name: 'DHRUVAN MADIGA', roll: 'STDDe2026159', init: 'DM', className: 'Class 3A' },
    { id: 's-3a-21', name: 'BHUVANESHWAR MALA', roll: 'STDDe2026160', init: 'BM', className: 'Class 3A' },
    { id: 's-3a-22', name: 'JESHVIKA MALA', roll: 'STDDe2026161', init: 'JM', className: 'Class 3A' },
    { id: 's-3a-23', name: 'GOUTHAM MAMILLA', roll: 'STDDe2026162', init: 'GM', className: 'Class 3A' },
    { id: 's-3a-24', name: 'FARAN MOHAMMED', roll: 'STDDe2026163', init: 'FM', className: 'Class 3A' },
    { id: 's-3a-25', name: 'MOKSHA NARSAMOLLA', roll: 'STDDe2026164', init: 'MN', className: 'Class 3A' },
    { id: 's-3a-26', name: 'VARUN TEJ PALLE', roll: 'STDDe2026165', init: 'VT', className: 'Class 3A' },
    { id: 's-3a-27', name: 'SATHVIK PAMBALI', roll: 'STDDe2026166', init: 'SP', className: 'Class 3A' },
    { id: 's-3a-28', name: 'ASHWANTH KUMAR P', roll: 'STDDe2026167', init: 'AK', className: 'Class 3A' },
    { id: 's-3a-29', name: 'NAVADEEP PENDYALA', roll: 'STDDe2026168', init: 'NP', className: 'Class 3A' },
    { id: 's-3a-30', name: 'JANSON RODDA', roll: 'STDDe2026169', init: 'JR', className: 'Class 3A' },
    { id: 's-3a-31', name: 'VIGNESH SABAVATH', roll: 'STDDe2026170', init: 'VS', className: 'Class 3A' },
  ],
  'Class 7A': [
    { id: 's-7a-1', name: 'Andhipuram Sravani', roll: '1318', init: 'AS', className: 'Class 7A' },
    { id: 's-7a-2', name: 'Adire Srivarsha', roll: '1227', init: 'AS', className: 'Class 7A' },
    { id: 's-7a-3', name: 'Adire Varshitha', roll: '1439', init: 'AV', className: 'Class 7A' },
    { id: 's-7a-4', name: 'Bulkapuram Chandana', roll: '1207', init: 'BC', className: 'Class 7A' },
    { id: 's-7a-5', name: 'Chakali Rishi', roll: '1246', init: 'CR', className: 'Class 7A' },
    { id: 's-7a-6', name: 'Dumsa Mani Priya', roll: '1726', init: 'DM', className: 'Class 7A' },
    { id: 's-7a-7', name: 'Duta Mani Deepthi', roll: '1437', init: 'DM', className: 'Class 7A' },
    { id: 's-7a-8', name: 'Gajjagani Pawanjan', roll: '370', init: 'GP', className: 'Class 7A' },
    { id: 's-7a-9', name: 'Gajji Srija', roll: '1855', init: 'GS', className: 'Class 7A' },
    { id: 's-7a-10', name: 'Kummari Akshitha', roll: '1206', init: 'KA', className: 'Class 7A' },
    { id: 's-7a-11', name: 'Kavali Nandini', roll: '1728', init: 'KN', className: 'Class 7A' },
    { id: 's-7a-12', name: 'Mangali Spandana', roll: '1722', init: 'MS', className: 'Class 7A' },
    { id: 's-7a-13', name: 'Marella Varun Sandesh', roll: '1585', init: 'MV', className: 'Class 7A' },
    { id: 's-7a-14', name: 'Pati Lokshitha', roll: '1491', init: 'PL', className: 'Class 7A' },
    { id: 's-7a-15', name: 'Pendyala Navaneetha', roll: '1408', init: 'PN', className: 'Class 7A' },
    { id: 's-7a-16', name: 'Pothireddy Charan', roll: '185', init: 'PC', className: 'Class 7A' },
    { id: 's-7a-17', name: 'Sama Sravan Reddy', roll: '1201', init: 'SS', className: 'Class 7A' },
    { id: 's-7a-18', name: 'Tangadapally Akhil', roll: '1723', init: 'TA', className: 'Class 7A' },
    { id: 's-7a-19', name: 'Tanniru Vishnu', roll: '1313', init: 'TV', className: 'Class 7A' },
    { id: 's-7a-20', name: 'Urella Rishik', roll: '1214', init: 'UR', className: 'Class 7A' },
    { id: 's-7a-21', name: 'Boda Veena', roll: 'STDDe2026459', init: 'BV', className: 'Class 7A' },
    { id: 's-7a-22', name: 'Godugu Aishwarya', roll: '1406', init: 'GA', className: 'Class 7A' },
    { id: 's-7a-23', name: 'Malapati BhavyaSri', roll: 'STDDe2026440', init: 'MB', className: 'Class 7A' },
    { id: 's-7a-24', name: 'Chandipa Sriman Karthikeya', roll: '1705', init: 'CS', className: 'Class 7A' },
    { id: 's-7a-25', name: 'Mangali Varshith', roll: 'STDDe2026441', init: 'MV', className: 'Class 7A' },
    { id: 's-7a-26', name: 'vadde Thirupati', roll: '1857', init: 'VT', className: 'Class 7A' },
    { id: 's-7a-27', name: 'Ranga Jaideep', roll: 'STDDe2026442', init: 'RJ', className: 'Class 7A' },
    { id: 's-7a-28', name: 'Nadimolla Gowthami', roll: 'STDDe2026443', init: 'NG', className: 'Class 7A' },
  ],
  'Class 8A': [
    { id: 's-8a-1', name: 'BODAPOTHULA ABHILASH GOUD', roll: 'STDDe2026400', init: 'BG', className: 'Class 8A' },
    { id: 's-8a-2', name: 'SHIVVAMOLLA SATHVIKA', roll: 'STDDe2026451', init: 'SS', className: 'Class 8A' },
    { id: 's-8a-3', name: 'GAJJAGANI CHAITANYA', roll: 'STDDe2026459', init: 'GC', className: 'Class 8A' },
    { id: 's-8a-4', name: 'RALLAMOLLA NIHARIKA', roll: 'STDDe2026444', init: 'RN', className: 'Class 8A' },
    { id: 's-8a-5', name: 'MALAPATI RISHITHA', roll: 'STDDe2026448', init: 'MR', className: 'Class 8A' },
    { id: 's-8a-6', name: 'MALAPATI LASYA', roll: 'STDDe2026447', init: 'ML', className: 'Class 8A' },
    { id: 's-8a-7', name: 'KAVALI ANANYA', roll: 'STDDe2026446', init: 'KA', className: 'Class 8A' },
    { id: 's-8a-8', name: 'SATHWIK BANDA', roll: 'STDDe2026450', init: 'SB', className: 'Class 8A' },
    { id: 's-8a-9', name: 'Chakali Vishnu Charan', roll: '151', init: 'CC', className: 'Class 8A' },
    { id: 's-8a-10', name: 'Dosada Vaishnavi', roll: '152', init: 'DV', className: 'Class 8A' },
    { id: 's-8a-11', name: 'Gundala Manoj Kumar', roll: '153', init: 'GK', className: 'Class 8A' },
    { id: 's-8a-12', name: 'Harijan Nani', roll: '154', init: 'HN', className: 'Class 8A' },
    { id: 's-8a-13', name: 'Karike Chandana', roll: '155', init: 'KC', className: 'Class 8A' },
    { id: 's-8a-14', name: 'Mohammad Sohel Khan', roll: '156', init: 'MK', className: 'Class 8A' },
    { id: 's-8a-15', name: 'P Akhil', roll: '157', init: 'PA', className: 'Class 8A' },
    { id: 's-8a-16', name: 'P Pranaya', roll: '158', init: 'PP', className: 'Class 8A' },
  ],
  'Class 10A': [
    { id: 's-10a-1', name: 'A. ROHITH SHARMA', roll: 'STD20261001', init: 'AR', className: 'Class 10A' },
    { id: 's-10a-2', name: 'B. SNEHA REDDY', roll: 'STD20261002', init: 'BS', className: 'Class 10A' },
    { id: 's-10a-3', name: 'C. VARUN KUMAR', roll: 'STD20261003', init: 'CV', className: 'Class 10A' },
    { id: 's-10a-4', name: 'D. MANISH GOUD', roll: 'STD20261004', init: 'DM', className: 'Class 10A' },
    { id: 's-10a-5', name: 'E. POOJA SHARMA', roll: 'STD20261005', init: 'EP', className: 'Class 10A' },
  ],
};

// Default fallback generator for any class
export const getStudentsForClass = (className: string): StudentItem[] => {
  if (STUDENTS_BY_CLASS[className]) {
    return STUDENTS_BY_CLASS[className];
  }
  // Fallback to Class 4B or 3A sample roster if not explicitly configured
  const template = STUDENTS_BY_CLASS['Class 4B'] || [];
  return template.map((s, idx) => ({
    ...s,
    id: `s-${className.toLowerCase().replace(/[^a-z0-9]/g, '')}-${idx + 1}`,
    className,
  }));
};

interface StudentAttendanceStoreState {
  records: StudentPeriodAttendance[];
  isLoading: boolean;
  loadRecords: () => Promise<void>;
  saveRecords: (newRecords: StudentPeriodAttendance[]) => Promise<void>;
}

export const useStudentAttendanceStore = create<StudentAttendanceStoreState>((set, get) => ({
  records: [],
  isLoading: false,

  loadRecords: async () => {
    set({ isLoading: true });
    try {
      const res = await api.getResources('settings', { key: 'kts_student_attendance_records' });
      let loaded: StudentPeriodAttendance[] = [];
      if (Array.isArray(res) && res.length > 0 && res[0]?.value) {
        try {
          loaded = typeof res[0].value === 'string' ? JSON.parse(res[0].value) : res[0].value;
        } catch {
          loaded = [];
        }
      }
      set({ records: loaded || [] });
    } catch {
      // Fallback
    } finally {
      set({ isLoading: false });
    }
  },

  saveRecords: async (newRecords: StudentPeriodAttendance[]) => {
    set({ records: newRecords });
    try {
      const valueStr = JSON.stringify(newRecords);
      const existing = await api.getResources('settings', { key: 'kts_student_attendance_records' });
      if (Array.isArray(existing) && existing.length > 0) {
        await api.updateResource('settings', String(existing[0].id), {
          key: 'kts_student_attendance_records',
          value: valueStr,
          group: 'attendance',
          type: 'json',
          is_public: true,
        });
      } else {
        await api.createResource('settings', {
          key: 'kts_student_attendance_records',
          value: valueStr,
          group: 'attendance',
          type: 'json',
          is_public: true,
        });
      }
    } catch (err) {
      console.log('Error saving attendance records:', err);
    }
  },
}));
