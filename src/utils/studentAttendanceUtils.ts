import { api } from '../services/api';
import { getLocalDateStr } from './date';

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

/**
 * Reconciles attendance records:
 * If the afternoon attendance (lunch_period) for any student/class is not marked by the
 * afternoon teacher on a particular day, and the day has passed (date < today / referenceDate),
 * automatically consider and create the afternoon attendance matching the morning attendance (first_period).
 */
export function reconcileStudentAttendance(
  records: StudentPeriodAttendance[],
  referenceDate: string = getLocalDateStr()
): { records: StudentPeriodAttendance[]; hasChanges: boolean; addedCount: number } {
  if (!Array.isArray(records) || records.length === 0) {
    return { records: records || [], hasChanges: false, addedCount: 0 };
  }

  // Use a map keyed by `${studentId}_${date}_${session}` to easily look up and deduplicate
  const recordMap = new Map<string, StudentPeriodAttendance>();
  
  // Also keep index of existing (studentId, date) for first_period and lunch_period
  const studentDateSessions = new Set<string>();

  records.forEach(r => {
    if (!r || !r.studentId || !r.date || !r.session) return;
    const sId = String(r.studentId);
    const key = `${sId}__${r.date}__${r.session}`;
    recordMap.set(key, r);
    studentDateSessions.add(`${sId}__${r.date}__${r.session}`);
  });

  let addedCount = 0;

  // Find all morning records for past dates (date < referenceDate)
  records.forEach(r => {
    if (!r || r.session !== 'first_period' || !r.date || !r.studentId) return;

    // Only apply rollover for past dates (the next day onwards)
    if (r.date < referenceDate) {
      const sId = String(r.studentId);
      const lunchKey = `${sId}__${r.date}__lunch_period`;

      // If afternoon attendance was not marked for this student on this day
      if (!studentDateSessions.has(lunchKey)) {
        const autoRecord: StudentPeriodAttendance = {
          studentId: sId,
          studentName: r.studentName,
          roll: r.roll || '',
          className: r.className,
          date: r.date,
          session: 'lunch_period',
          status: r.status === 'present' ? 'present' : 'absent',
          markedBy: 'Auto-Allotted (Morning Rollover)',
          markedById: r.markedById || '1',
          markedAt: r.markedAt || new Date().toISOString(),
          autoAllotted: true,
        };

        recordMap.set(lunchKey, autoRecord);
        studentDateSessions.add(lunchKey);
        addedCount++;
      }
    }
  });

  const updatedRecords = Array.from(recordMap.values());
  return {
    records: updatedRecords,
    hasChanges: addedCount > 0,
    addedCount,
  };
}

/**
 * Saves a setting directly to the database via API
 */
export async function saveAttendanceSettingToDb(records: StudentPeriodAttendance[]) {
  try {
    const valueStr = JSON.stringify(records);
    const existing = await api.getResources('settings', { key: 'kts_student_attendance_records' });
    if (Array.isArray(existing) && existing.length > 0) {
      const settingId = existing[0].id;
      await api.updateResource('settings', String(settingId), {
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
    console.error('Error saving kts_student_attendance_records setting to DB:', err);
  }
}

/**
 * Reconciles student attendance records from localStorage or provided records,
 * and if changes occurred, persists to localStorage, database setting, and broadcasts event.
 */
export async function syncAndReconcileAttendanceRecords(
  providedRecords?: StudentPeriodAttendance[]
): Promise<StudentPeriodAttendance[]> {
  let records: StudentPeriodAttendance[] = [];

  if (providedRecords && Array.isArray(providedRecords)) {
    records = providedRecords;
  } else {
    const local = localStorage.getItem('kts_student_attendance_records');
    if (local) {
      try {
        records = JSON.parse(local);
      } catch (e) {
        console.error('Failed to parse local kts_student_attendance_records:', e);
      }
    }
  }

  const { records: updatedRecords, hasChanges } = reconcileStudentAttendance(records);

  if (hasChanges) {
    const jsonStr = JSON.stringify(updatedRecords);
    localStorage.setItem('kts_student_attendance_records', jsonStr);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'kts_student_attendance_records',
        newValue: jsonStr,
      })
    );
    // Persist to database in background
    saveAttendanceSettingToDb(updatedRecords).catch(e => {
      console.error('Failed to persist reconciled attendance to DB:', e);
    });
  }

  return updatedRecords;
}

/**
 * Checks if a specific period attendance was auto-allotted via morning rollover
 */
export function isRecordAutoAllotted(record?: StudentPeriodAttendance | null): boolean {
  if (!record) return false;
  return Boolean(
    record.autoAllotted ||
      (record.markedBy && record.markedBy.toLowerCase().includes('auto-allotted')) ||
      (record.markedBy && record.markedBy.toLowerCase().includes('morning rollover'))
  );
}
