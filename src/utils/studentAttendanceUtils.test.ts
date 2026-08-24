import { describe, it, expect } from 'vitest';
import {
  reconcileStudentAttendance,
  isRecordAutoAllotted,
  StudentPeriodAttendance
} from './studentAttendanceUtils';

describe('studentAttendanceUtils - Afternoon Attendance Auto-Rollover', () => {
  const referenceDate = '2026-08-24'; // simulate "today"

  it('automatically creates afternoon attendance from morning attendance for past dates when afternoon was not marked', () => {
    const pastDate = '2026-08-23'; // yesterday
    const records: StudentPeriodAttendance[] = [
      {
        studentId: '101',
        studentName: 'Rahul Sharma',
        roll: 'KTS-001',
        className: '8A',
        date: pastDate,
        session: 'first_period',
        status: 'present',
        markedBy: 'Mr. John (Class Teacher)',
        markedById: '12',
        markedAt: '2026-08-23T08:30:00.000Z',
      },
      {
        studentId: '102',
        studentName: 'Sneha Patel',
        roll: 'KTS-002',
        className: '8A',
        date: pastDate,
        session: 'first_period',
        status: 'absent',
        markedBy: 'Mr. John (Class Teacher)',
        markedById: '12',
        markedAt: '2026-08-23T08:30:00.000Z',
      },
    ];

    const result = reconcileStudentAttendance(records, referenceDate);

    expect(result.hasChanges).toBe(true);
    expect(result.addedCount).toBe(2);
    expect(result.records.length).toBe(4);

    // Find the auto-created afternoon records
    const rahulAfternoon = result.records.find(
      r => r.studentId === '101' && r.date === pastDate && r.session === 'lunch_period'
    );
    expect(rahulAfternoon).toBeDefined();
    expect(rahulAfternoon?.status).toBe('present');
    expect(rahulAfternoon?.autoAllotted).toBe(true);
    expect(isRecordAutoAllotted(rahulAfternoon)).toBe(true);

    const snehaAfternoon = result.records.find(
      r => r.studentId === '102' && r.date === pastDate && r.session === 'lunch_period'
    );
    expect(snehaAfternoon).toBeDefined();
    expect(snehaAfternoon?.status).toBe('absent');
    expect(snehaAfternoon?.autoAllotted).toBe(true);
    expect(isRecordAutoAllotted(snehaAfternoon)).toBe(true);
  });

  it('does NOT overwrite afternoon attendance if the afternoon teacher already marked it on a past date', () => {
    const pastDate = '2026-08-23';
    const records: StudentPeriodAttendance[] = [
      {
        studentId: '101',
        studentName: 'Rahul Sharma',
        roll: 'KTS-001',
        className: '8A',
        date: pastDate,
        session: 'first_period',
        status: 'present',
        markedBy: 'Mr. John (Class Teacher)',
        markedById: '12',
        markedAt: '2026-08-23T08:30:00.000Z',
      },
      {
        studentId: '101',
        studentName: 'Rahul Sharma',
        roll: 'KTS-001',
        className: '8A',
        date: pastDate,
        session: 'lunch_period',
        status: 'absent', // marked absent in afternoon by subject teacher
        markedBy: 'Mrs. Anita (Science Teacher)',
        markedById: '15',
        markedAt: '2026-08-23T14:15:00.000Z',
      },
    ];

    const result = reconcileStudentAttendance(records, referenceDate);

    expect(result.hasChanges).toBe(false);
    expect(result.addedCount).toBe(0);
    expect(result.records.length).toBe(2);

    const lunchRecord = result.records.find(r => r.session === 'lunch_period');
    expect(lunchRecord?.status).toBe('absent');
    expect(lunchRecord?.markedBy).toBe('Mrs. Anita (Science Teacher)');
    expect(isRecordAutoAllotted(lunchRecord)).toBe(false);
  });

  it('does NOT prematurely auto-rollover for the current day (date === today)', () => {
    const todayDate = referenceDate; // '2026-08-24'
    const records: StudentPeriodAttendance[] = [
      {
        studentId: '101',
        studentName: 'Rahul Sharma',
        roll: 'KTS-001',
        className: '8A',
        date: todayDate,
        session: 'first_period',
        status: 'present',
        markedBy: 'Mr. John (Class Teacher)',
        markedById: '12',
        markedAt: '2026-08-24T08:30:00.000Z',
      },
    ];

    const result = reconcileStudentAttendance(records, referenceDate);

    expect(result.hasChanges).toBe(false);
    expect(result.addedCount).toBe(0);
    expect(result.records.length).toBe(1);

    const lunchRecord = result.records.find(r => r.session === 'lunch_period');
    expect(lunchRecord).toBeUndefined();
  });
});
