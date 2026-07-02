import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Calendar, UserCheck, UserX, AlertCircle, Clock, Fingerprint, RefreshCw, Wifi, WifiOff, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Avatar } from '../components/ui';
import { STAFF, StaffMember } from './StaffManagement';
import { api, originalSetItem } from '../services/api';
import { useApp } from '../context/AppContext';


type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Half Day';

interface BiometricRecord {
  Empcode: string;
  Name?: string;
  INTime?: string;
  OUTTime?: string;
  WorkTime?: string;
  OverTime?: string;
  Status?: string;
  DateString?: string;
  Remark?: string;
  Late_In?: string;
  Erl_Out?: string;
  PunchDate?: string;
}

interface LocalPunch {
  id: string;
  staffId: string;
  timestamp: string; // YYYY-MM-DD HH:MM:SS
}

const normalizeName = (name: string) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/^(mr|mrs|ms|dr)\.?\s+/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

const parsePunchDate = (punchDateStr: string): string => {
  if (!punchDateStr) return '';
  try {
    const cleanStr = punchDateStr.includes('T') ? punchDateStr.split('T')[0] : punchDateStr;
    const parts = cleanStr.trim().split(' ');
    const datePart = parts[0];
    if (datePart.includes('/')) {
      const dateParts = datePart.split('/');
      if (dateParts.length === 3) {
        const day = dateParts[0];
        const month = dateParts[1];
        const year = dateParts[2];
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    } else if (datePart.includes('-')) {
      const dateParts = datePart.split('-');
      if (dateParts.length === 3) {
        if (dateParts[0].length === 4) {
          return `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].slice(0, 2).padStart(2, '0')}`;
        } else {
          const day = dateParts[0];
          const month = dateParts[1];
          const year = dateParts[2];
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }
  } catch (err) {
    console.error('Error parsing punch date:', err);
  }
  return '';
};

const formatDateDDMMYYYY = (isoDate: string) => {
  const parts = isoDate.split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return isoDate;
};

type ConnectionStatus = 'unknown' | 'connected' | 'disconnected' | 'testing';

export function StaffAttendance() {
  const { leaveRequests } = useApp();
  const [date, setDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('kts_staff_members');
    return saved ? JSON.parse(saved) : STAFF;
  });

  // Manual attendance overrides
  const [manualAttendance, setManualAttendance] = useState<Record<string, Record<string, AttendanceStatus>>>(() => {
    const saved = localStorage.getItem('kts_staff_attendance');
    return saved ? JSON.parse(saved) : {};
  });

  // Local simulated biometric punches (fallback)
  const [localPunches, setLocalPunches] = useState<LocalPunch[]>(() => {
    const saved = localStorage.getItem('kts_biometric_punches');
    return saved ? JSON.parse(saved) : [];
  });

  // Real biometric records pulled from e-TimeOffice API (via backend proxy)
  const [biometricRecords, setBiometricRecords] = useState<BiometricRecord[]>([]);

  // Attendance Mode
  const [attendanceMode, setAttendanceMode] = useState<'biometric' | 'manual'>(() => {
    const saved = localStorage.getItem('kts_staff_attendance_mode');
    return (saved as 'biometric' | 'manual') || 'biometric';
  });

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingPunches, setIsSyncingPunches] = useState(false);
  const syncInProgress = useRef(false);
  const syncPunchesInProgress = useRef(false);
  const [lastSyncMsg, setLastSyncMsg] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');

  // Timing settings states (with default fallbacks)
  const [schoolStartTime, setSchoolStartTime] = useState('08:30');
  const [schoolEndTime, setSchoolEndTime] = useState('17:30');
  const [presentCutoffMorning, setPresentCutoffMorning] = useState('09:00');
  const [presentCutoffEvening, setPresentCutoffEvening] = useState('16:30');
  const [lateEntryCutoff, setLateEntryCutoff] = useState('09:50');
  const [earlyEntryCutoff, setEarlyEntryCutoff] = useState('15:00');

  // Load staff members, attendance, and biometric punches from DB settings / localStorage
  useEffect(() => {
    api.getResources('settings')
      .then((settings) => {
        // Load timings configurations
        const startSetting = settings.find((s: any) => s.key === 'school_start_time');
        const endSetting = settings.find((s: any) => s.key === 'school_end_time');
        const presMSetting = settings.find((s: any) => s.key === 'present_cutoff_morning');
        const presESetting = settings.find((s: any) => s.key === 'present_cutoff_evening');
        const lateSetting = settings.find((s: any) => s.key === 'late_entry_cutoff');
        const earlySetting = settings.find((s: any) => s.key === 'early_entry_cutoff');

        const sStart = startSetting?.value || '08:30';
        const sEnd = endSetting?.value || '17:30';
        const pCutM = presMSetting?.value || '09:00';
        const pCutE = presESetting?.value || '16:30';
        const lCutM = lateSetting?.value || '09:50';
        const eCutE = earlySetting?.value || '15:00';

        setSchoolStartTime(sStart);
        setSchoolEndTime(sEnd);
        setPresentCutoffMorning(pCutM);
        setPresentCutoffEvening(pCutE);
        setLateEntryCutoff(lCutM);
        setEarlyEntryCutoff(eCutE);

        // 1. Staff Members
        let currentStaffList = STAFF;
        const staffSetting = settings.find((s: any) => s.key === 'kts_staff_members');
        if (staffSetting && staffSetting.value) {
          originalSetItem('kts_staff_members', staffSetting.value);
          currentStaffList = JSON.parse(staffSetting.value);
          setStaffList(currentStaffList);
        } else {
          const saved = localStorage.getItem('kts_staff_members');
          currentStaffList = saved ? JSON.parse(saved) : STAFF;
          setStaffList(currentStaffList);
        }

        // 2. Staff Attendance & 3. Biometric Punches
        const attendanceSetting = settings.find((s: any) => s.key === 'kts_staff_attendance');
        const punchesSetting = settings.find((s: any) => s.key === 'kts_biometric_punches');
        
        let loadedAttendance: Record<string, Record<string, AttendanceStatus>> = {};
        let loadedPunches: LocalPunch[] = [];

        if (attendanceSetting && attendanceSetting.value) {
          originalSetItem('kts_staff_attendance', attendanceSetting.value);
          loadedAttendance = JSON.parse(attendanceSetting.value);
        } else {
          const savedAtt = localStorage.getItem('kts_staff_attendance');
          if (savedAtt) loadedAttendance = JSON.parse(savedAtt);
        }

        if (punchesSetting && punchesSetting.value) {
          originalSetItem('kts_biometric_punches', punchesSetting.value);
          loadedPunches = JSON.parse(punchesSetting.value);
        } else {
          const savedPunches = localStorage.getItem('kts_biometric_punches');
          if (savedPunches) loadedPunches = JSON.parse(savedPunches);
        }

        setManualAttendance(loadedAttendance);
        setLocalPunches(loadedPunches);
      })
      .catch((err) => {
        console.error('Error syncing data from DB in StaffAttendance:', err);
        // Fallback to localStorage if API fails
        const savedStaff = localStorage.getItem('kts_staff_members');
        setStaffList(savedStaff ? JSON.parse(savedStaff) : STAFF);
        
        const savedAtt = localStorage.getItem('kts_staff_attendance');
        if (savedAtt) setManualAttendance(JSON.parse(savedAtt));
        
        const savedPunches = localStorage.getItem('kts_biometric_punches');
        if (savedPunches) setLocalPunches(JSON.parse(savedPunches));
      });
  }, []);

  // Check biometric status on mount
  useEffect(() => {
    api.biometricStatus()
      .then((res) => {
        if (res?.configured) {
          setConnectionStatus('connected');
          if (res.last_sync) {
            const d = new Date(res.last_sync);
            setLastSyncTime(d.toLocaleString());
          }
        } else {
          setConnectionStatus('disconnected');
        }
      })
      .catch(() => {
        setConnectionStatus('disconnected');
      });
  }, []);

  // Fetch logs from the local biometric_logs table (which gets instant webhook data)
  const fetchLocalBiometricLogs = useCallback(() => {
    api.getResources('biometric-logs', { date })
      .then((logs) => {
        if (Array.isArray(logs)) {
          const mapped: BiometricRecord[] = logs.map((l: any) => {
            const scanTime = l.scan_datetime ? l.scan_datetime.slice(11, 16) : undefined;
            const scanType = String(l.scan_type || '').toLowerCase();
            return {
              Empcode: l.employee_code || l.Empcode || '',
              Name: l.raw_data?.name || l.raw_data?.Name || l.raw_data?.EmpName || '',
              PunchDate: l.scan_datetime,
              INTime: l.raw_data?.in_time || (scanType === 'in' ? scanTime : undefined),
              OUTTime: l.raw_data?.out_time || (scanType === 'out' ? scanTime : undefined),
              WorkTime: l.raw_data?.work_time,
              Status: l.raw_data?.status,
              DateString: l.scan_datetime ? parsePunchDate(l.scan_datetime) : undefined,
            };
          });

          // Merge with existing biometricRecords to avoid overwriting or losing records
          setBiometricRecords((prev) => {
            const map = new Map<string, BiometricRecord>();

            // Add previous ones
            prev.forEach((r) => {
              const key = `${r.Empcode}-${r.PunchDate || r.INTime || r.OUTTime}`;
              map.set(key, r);
            });

            // Add/overwrite with newly fetched local logs
            mapped.forEach((r) => {
              const key = `${r.Empcode}-${r.PunchDate || r.INTime || r.OUTTime}`;
              map.set(key, r);
            });

            return Array.from(map.values());
          });
        }
      })
      .catch((err) => {
        console.error('Error fetching local biometric logs:', err);
      });
  }, [date]);

  // Sync biometric IN/OUT data for the selected date from the real API
  const syncBiometric = useCallback((silent = false) => {
    if (syncInProgress.current) return;
    syncInProgress.current = true;
    setIsSyncing(true);
    if (!silent) setLastSyncMsg(null);

    api.biometricSyncInOut(date, date, 'ALL')
      .then((result) => {
        if (result?.success) {
          const records: BiometricRecord[] = result.data || [];
          
          // Merge with existing biometricRecords to keep webhook punches
          setBiometricRecords((prev) => {
            const map = new Map<string, BiometricRecord>();
            prev.forEach((r) => {
              const key = `${r.Empcode}-${r.PunchDate || r.INTime || r.OUTTime}`;
              map.set(key, r);
            });
            records.forEach((r) => {
              const key = `${r.Empcode}-${r.PunchDate || r.INTime || r.OUTTime}`;
              map.set(key, r);
            });
            return Array.from(map.values());
          });

          setConnectionStatus('connected');
          const now = new Date().toLocaleTimeString();
          setLastSyncTime(now);

          // Convert biometric records to LocalPunch format for saving
          const newPunches: LocalPunch[] = [];

          staffList.forEach((staff) => {
            // Get biometric records matching this staff member
            const staffBioRecords = records.filter((record) => {
              const empCode = String(record.Empcode || '').toLowerCase().trim();
              const name    = String(record.Name || '').toLowerCase().trim();

              const matchesBiometricCode = staff.biometric_employee_code && (
                empCode === String(staff.biometric_employee_code).toLowerCase().trim() ||
                (!isNaN(Number(empCode)) && !isNaN(Number(staff.biometric_employee_code)) && Number(empCode) === Number(staff.biometric_employee_code))
              );

              const matchCode = empCode === String(staff.id).toLowerCase().trim() || matchesBiometricCode;
              const matchName = name === staff.name.toLowerCase().trim() || normalizeName(name) === normalizeName(staff.name);

              let dateMatch = false;
              if (record.DateString) {
                const parsed = parsePunchDate(record.DateString);
                dateMatch = parsed === date;
              } else if (record.PunchDate) {
                const parsed = parsePunchDate(record.PunchDate) || record.PunchDate.slice(0, 10);
                dateMatch = parsed === date;
              }

              return (matchCode || matchName) && dateMatch;
            });

            // Generate punches
            const staffPunches: LocalPunch[] = [];
            staffBioRecords.forEach((rec) => {
              if (rec.INTime && rec.INTime !== '--:--') {
                staffPunches.push({ id: `bio-in-${rec.Empcode}-${date}`, staffId: staff.id, timestamp: `${date} ${rec.INTime}:00` });
              }
              if (rec.OUTTime && rec.OUTTime !== '--:--') {
                staffPunches.push({ id: `bio-out-${rec.Empcode}-${date}`, staffId: staff.id, timestamp: `${date} ${rec.OUTTime}:00` });
              }
              if (!rec.INTime && !rec.OUTTime && rec.PunchDate) {
                staffPunches.push({ id: `bio-${rec.Empcode}-${date}`, staffId: staff.id, timestamp: rec.PunchDate });
              }
            });

            newPunches.push(...staffPunches);
          });

          // Update localPunches (filter out previous punches for this date)
          setLocalPunches((prev) => {
            const otherDatePunches = prev.filter((p) => !p.timestamp.startsWith(date));
            return [...otherDatePunches, ...newPunches];
          });

          if (!silent) {
            setLastSyncMsg(`✓ Synced ${result.saved ?? records.length} records at ${now}`);
          }
        } else if (result?.message?.includes('not configured')) {
          setConnectionStatus('disconnected');
          if (!silent) setLastSyncMsg('⚠ Biometric credentials not set. Configure them in Settings → Biometric Integration.');
          fetchLocalBiometricLogs();
        } else {
          if (!silent) setLastSyncMsg(`⚠ ${result?.message || 'Sync returned no data'}`);
          fetchLocalBiometricLogs();
        }
      })
      .catch((err: any) => {
        setConnectionStatus('disconnected');
        if (!silent) setLastSyncMsg('✗ Sync failed — check biometric credentials in Settings.');
        fetchLocalBiometricLogs();
      })
      .finally(() => {
        syncInProgress.current = false;
        setIsSyncing(false);
      });
  }, [date, staffList, fetchLocalBiometricLogs]);

  // Sync biometric raw punch logs (DownloadPunchData) every second during school hours
  const syncBiometricPunches = useCallback((silent = false) => {
    if (syncPunchesInProgress.current) return;
    syncPunchesInProgress.current = true;
    setIsSyncingPunches(true);

    api.biometricSyncPunch(date, date, 'ALL')
      .then((result) => {
        if (result?.success) {
          fetchLocalBiometricLogs();
          setConnectionStatus('connected');
        }
      })
      .catch((err) => {
        console.error('Error syncing biometric raw punches:', err);
      })
      .finally(() => {
        syncPunchesInProgress.current = false;
        setIsSyncingPunches(false);
      });
  }, [date, fetchLocalBiometricLogs]);

  // Refs to hold latest function references for the intervals
  const syncBiometricRef = useRef(syncBiometric);
  const syncBiometricPunchesRef = useRef(syncBiometricPunches);
  const fetchLocalBiometricLogsRef = useRef(fetchLocalBiometricLogs);

  useEffect(() => {
    syncBiometricRef.current = syncBiometric;
  }, [syncBiometric]);

  useEffect(() => {
    syncBiometricPunchesRef.current = syncBiometricPunches;
  }, [syncBiometricPunches]);

  useEffect(() => {
    fetchLocalBiometricLogsRef.current = fetchLocalBiometricLogs;
  }, [fetchLocalBiometricLogs]);

  // Auto-sync when date changes
  useEffect(() => {
    setBiometricRecords([]); // Clear old records
    syncBiometricPunches(true);
    syncBiometric(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // Local DB polling interval (every 1 second)
  useEffect(() => {
    fetchLocalBiometricLogsRef.current();

    const timerId = setInterval(() => {
      fetchLocalBiometricLogsRef.current();
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  // Live auto-sync interval for raw punches (every 1 second during school hours)
  useEffect(() => {
    const getIntervalDuration = () => {
      const now = new Date();
      const currentHour = now.getHours();

      // School timings: 8:00 AM to 6:00 PM (8 to 18)
      if (currentHour >= 8 && currentHour < 18) {
        return 1000; // 1 second
      } else {
        return 2 * 60 * 60 * 1000; // 2 hours
      }
    };

    let timerId: NodeJS.Timeout | null = null;
    let currentInterval = getIntervalDuration();

    const startTimer = (ms: number) => {
      if (timerId) clearInterval(timerId);
      timerId = setInterval(() => {
        syncBiometricPunchesRef.current(true);
      }, ms);
    };

    // Start initial timer
    startTimer(currentInterval);

    // Watch for hour changes to dynamically adjust the interval duration
    const watchTimer = setInterval(() => {
      const ms = getIntervalDuration();
      if (ms !== currentInterval) {
        currentInterval = ms;
        startTimer(currentInterval);
      }
    }, 60000);

    return () => {
      if (timerId) clearInterval(timerId);
      clearInterval(watchTimer);
    };
  }, []);

  // Live auto-sync interval for In/Out summaries (every 15 seconds during school hours)
  useEffect(() => {
    const getIntervalDuration = () => {
      const now = new Date();
      const currentHour = now.getHours();

      // School timings: 8:00 AM to 6:00 PM (8 to 18)
      if (currentHour >= 8 && currentHour < 18) {
        return 15000; // 15 seconds
      } else {
        return 2 * 60 * 60 * 1000; // 2 hours
      }
    };

    let timerId: NodeJS.Timeout | null = null;
    let currentInterval = getIntervalDuration();

    const startTimer = (ms: number) => {
      if (timerId) clearInterval(timerId);
      timerId = setInterval(() => {
        syncBiometricRef.current(true);
      }, ms);
    };

    // Start initial timer
    startTimer(currentInterval);

    // Watch for hour changes to dynamically adjust the interval duration
    const watchTimer = setInterval(() => {
      const ms = getIntervalDuration();
      if (ms !== currentInterval) {
        currentInterval = ms;
        startTimer(currentInterval);
      }
    }, 60000);

    return () => {
      if (timerId) clearInterval(timerId);
      clearInterval(watchTimer);
    };
  }, []);

  const saveSettingToDb = (key: string, value: string) => {
    api.getResources('settings')
      .then((settings) => {
        const setting = settings.find((s: any) => s.key === key);
        if (setting) {
          return api.updateResource('settings', setting.id, { key, value });
        } else {
          return api.createResource('settings', { key, value, group: 'staff' });
        }
      })
      .catch((err) => {
        console.error(`Error saving setting ${key} to DB:`, err);
      });
  };

  // Persistence hooks
  useEffect(() => {
    localStorage.setItem('kts_staff_attendance', JSON.stringify(manualAttendance));
    saveSettingToDb('kts_staff_attendance', JSON.stringify(manualAttendance));
  }, [manualAttendance]);

  // Force biometric mode if the device is connected/working
  useEffect(() => {
    if (connectionStatus === 'connected' && attendanceMode !== 'biometric') {
      setAttendanceMode('biometric');
    }
  }, [connectionStatus, attendanceMode]);

  useEffect(() => {
    localStorage.setItem('kts_biometric_punches', JSON.stringify(localPunches));
  }, [localPunches]);

  useEffect(() => {
    localStorage.setItem('kts_staff_attendance_mode', attendanceMode);
  }, [attendanceMode]);

  // Extract unique categories for filtering
  const allCategories = Array.from(new Set(staffList.map((s) => s.category || 'Teaching')));

  // Find biometric record(s) for a given staff member on the selected date
  const getBiometricRecordsForStaff = (staff: StaffMember): BiometricRecord[] => {
    return biometricRecords.filter((record) => {
      const empCode = String(record.Empcode || '').toLowerCase().trim();
      const name    = String(record.Name || '').toLowerCase().trim();

      // Matches biometric employee code
      const matchesBiometricCode = staff.biometric_employee_code && (
        empCode === String(staff.biometric_employee_code).toLowerCase().trim() ||
        (!isNaN(Number(empCode)) && !isNaN(Number(staff.biometric_employee_code)) && Number(empCode) === Number(staff.biometric_employee_code))
      );

      const matchCode = empCode === String(staff.id).toLowerCase().trim() || matchesBiometricCode;
      const matchName = name === staff.name.toLowerCase().trim() || normalizeName(name) === normalizeName(staff.name);

      let dateMatch = false;
      if (record.DateString) {
        const parsed = parsePunchDate(record.DateString);
        dateMatch = parsed === date;
      } else if (record.PunchDate) {
        const parsed = parsePunchDate(record.PunchDate) || record.PunchDate.slice(0, 10);
        dateMatch = parsed === date;
      }

      return (matchCode || matchName) && dateMatch;
    });
  };

  // Helper to count all punches (biometric API + local simulation)
  const getPunchesForStaffOnDate = (staff: StaffMember) => {
    if (attendanceMode === 'manual') {
      const manualStatus = manualAttendance[date]?.[staff.id] || 'Present';
      if (manualStatus === 'Present') {
        return [
          { id: 'm1', staffId: staff.id, timestamp: `${date} 09:00:00` },
          { id: 'm2', staffId: staff.id, timestamp: `${date} 17:00:00` },
        ];
      }
      if (manualStatus === 'Half Day') {
        return [{ id: 'm1', staffId: staff.id, timestamp: `${date} 09:00:00` }];
      }
      return [];
    }

    // Local simulation punches
    const localCount = localPunches.filter(
      (p) => p.staffId === staff.id && p.timestamp.startsWith(date)
    );

    // Real biometric records
    const apiRecords = getBiometricRecordsForStaff(staff);
    const apiCount: LocalPunch[] = [];
    for (const rec of apiRecords) {
      if (rec.INTime && rec.INTime !== '--:--') {
        apiCount.push({ id: `bio-in-${rec.Empcode}`, staffId: staff.id, timestamp: `${date} ${rec.INTime}:00` });
      }
      if (rec.OUTTime && rec.OUTTime !== '--:--') {
        apiCount.push({ id: `bio-out-${rec.Empcode}`, staffId: staff.id, timestamp: `${date} ${rec.OUTTime}:00` });
      }
      if (!rec.INTime && !rec.OUTTime && rec.PunchDate) {
        apiCount.push({ id: `bio-${rec.Empcode}`, staffId: staff.id, timestamp: rec.PunchDate });
      }
    }

    return [...localCount, ...apiCount];
  };

  const getStatus = (staff: StaffMember): AttendanceStatus => {
    const manualStatus = manualAttendance[date]?.[staff.id];

    // If manual status override exists, respect it (keeps controls working!)
    if (manualStatus) {
      return manualStatus;
    }

    // Check if there is an approved leave request for this staff member on the selected date
    const hasApprovedLeave = leaveRequests.some((l) => 
      String(l.staffId) === String(staff.id) &&
      l.status === 'Approved' &&
      date >= l.from &&
      date <= l.to
    );

    if (hasApprovedLeave) {
      return 'Leave';
    }

    if (attendanceMode === 'manual') {
      return 'Present'; // Default to Present in manual mode
    }

    // Biometric Mode
    // Calculate check-in and check-out based on windows
    const punchesList = getPunchesForStaffOnDate(staff);
    const checkInPunches = punchesList.filter((p) => {
      const timePart = p.timestamp.split(' ')[1] || '';
      return timePart >= (schoolStartTime + ':00') && timePart <= (lateEntryCutoff + ':00');
    });
    let hasCheckIn = checkInPunches.length > 0;

    const checkOutPunches = punchesList.filter((p) => {
      const timePart = p.timestamp.split(' ')[1] || '';
      return timePart >= (earlyEntryCutoff + ':00') && timePart <= (schoolEndTime + ':00');
    });
    let hasCheckOut = checkOutPunches.length > 0;

    // Fallbacks if no punches in windows
    if (!hasCheckIn || !hasCheckOut) {
      const todayPunches = punchesList.filter((p) => p.timestamp.startsWith(date));
      if (todayPunches.length > 0) {
        if (!hasCheckIn) {
          const earliest = todayPunches[0].timestamp.split(' ')[1]?.substring(0, 5);
          if (earliest && earliest >= schoolStartTime && earliest <= lateEntryCutoff) hasCheckIn = true;
        }
        if (!hasCheckOut && todayPunches.length > 1) {
          const latest = todayPunches[todayPunches.length - 1].timestamp.split(' ')[1]?.substring(0, 5);
          if (latest && latest >= earlyEntryCutoff && latest <= schoolEndTime) hasCheckOut = true;
        }
      }
    }

    if (hasCheckIn && hasCheckOut) return 'Present';
    if (hasCheckIn || hasCheckOut) return 'Half Day';
    return 'Absent';
  };

  const setManualStatus = (staffId: string, status: AttendanceStatus) => {
    setManualAttendance((prev) => {
      const dateRecords = prev[date] ? { ...prev[date] } : {};
      if (dateRecords[staffId] === status) {
        delete dateRecords[staffId];
      } else {
        dateRecords[staffId] = status;
      }
      return { ...prev, [date]: dateRecords };
    });
  };

  // Add a test simulated biometric punch
  const addSimulatedPunch = (staffId: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newPunch: LocalPunch = {
      id: 'punch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      staffId,
      timestamp: `${date} ${timeStr}`,
    };
    setLocalPunches((prev) => [...prev, newPunch]);
  };

  // Reset local simulation punches for the selected date
  const clearSimulatedPunches = () => {
    if (window.confirm('Clear all local simulated punches for this date?')) {
      setLocalPunches((prev) => prev.filter((p) => !p.timestamp.startsWith(date)));
    }
  };

  // Filter staff list
  const filteredStaff = staffList.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.designation.toLowerCase().includes(search.toLowerCase()) ||
      (s.department || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'All' || (s.category || 'Teaching') === categoryFilter;
    return matchSearch && matchCategory;
  });

  // KPI metrics
  const totalStaff = staffList.length;
  const presentCount = staffList.filter((s) => getStatus(s) === 'Present').length;
  const absentCount  = staffList.filter((s) => getStatus(s) === 'Absent').length;
  const halfDayCount = staffList.filter((s) => getStatus(s) === 'Half Day').length;
  const leaveCount   = staffList.filter((s) => getStatus(s) === 'Leave').length;

  const ConnectionDot = () => (
    <span className="flex items-center gap-1.5">
      {connectionStatus === 'connected' ? (
        <><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5"><Wifi size={10} /> Live</span></>
      ) : connectionStatus === 'disconnected' ? (
        <><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
        <span className="text-[10px] text-red-500 font-medium flex items-center gap-0.5"><WifiOff size={10} /> Offline</span></>
      ) : connectionStatus === 'testing' ? (
        <><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
        <span className="text-[10px] text-amber-600 font-medium">Testing…</span></>
      ) : (
        <><span className="w-2 h-2 rounded-full bg-[var(--tx3)]/40 inline-block" />
        <span className="text-[10px] text-[var(--tx3)] font-medium">Unknown</span></>
      )}
    </span>
  );

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mb-3">
        <KPICard
          label="Total Staff"
          value={totalStaff}
          sub="Active directory"
          icon={<UserCheck size={15} />}
          iconBg="var(--blue-bg)"
          iconColor="var(--blue-tx)"
        />
        <KPICard
          label="Present"
          value={presentCount}
          sub={`${totalStaff ? Math.round((presentCount / totalStaff) * 100) : 0}% Present`}
          icon={<UserCheck size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
        />
        <KPICard
          label="Absent"
          value={absentCount}
          sub="Needs review"
          icon={<UserX size={15} />}
          iconBg="var(--red-bg)"
          iconColor="var(--red-tx)"
        />
        <KPICard
          label="Half Day"
          value={halfDayCount}
          sub="Single punch count"
          icon={<Clock size={15} />}
          iconBg="var(--amber-bg)"
          iconColor="var(--amber-tx)"
        />
        <KPICard
          label="Leave"
          value={leaveCount}
          sub="Approved leave list"
          icon={<AlertCircle size={15} />}
          iconBg="var(--purple-bg)"
          iconColor="var(--purple-tx)"
        />
      </div>

      <Card>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 border-b border-[var(--b)] pb-4">
          <div>
            <div className="text-[13.5px] font-bold text-[var(--tx)]">Staff Daily Attendance</div>
            <div className="text-[11px] text-[var(--tx3)] flex items-center gap-1.5 mt-0.5">
              <Fingerprint size={12} className="text-[var(--blue-tx)]" />
              e-TimeOffice biometric sync •&nbsp;<ConnectionDot />
              {lastSyncTime && <span className="ml-1 text-[var(--tx3)]">· Last sync: {lastSyncTime}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-1.5">
              <span className="text-[10.5px] font-semibold text-[var(--tx2)] flex items-center gap-1 px-1">
                <Fingerprint size={12} className="text-[var(--blue-tx)]" /> Mode:
              </span>
              <button
                type="button"
                onClick={() => setAttendanceMode('biometric')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  attendanceMode === 'biometric'
                    ? 'bg-[var(--blue)] text-white'
                    : 'text-[var(--tx3)] hover:text-[var(--tx2)]'
                }`}
              >
                Biometric
              </button>
              <button
                type="button"
                onClick={() => setAttendanceMode('manual')}
                disabled={connectionStatus === 'connected'}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  connectionStatus === 'connected'
                    ? 'opacity-40 cursor-not-allowed text-[var(--tx3)]'
                    : 'cursor-pointer hover:text-[var(--tx2)]'
                } ${
                  attendanceMode === 'manual'
                    ? 'bg-[var(--amber-bg)] text-[var(--amber-tx)] border border-[var(--amber-tx)]/20'
                    : 'text-[var(--tx3)]'
                }`}
                title={connectionStatus === 'connected' ? "Manual mode is disabled because the biometric device is connected and working." : "Use this if biometric machine is under maintenance or offline"}
              >
                Manual
              </button>
            </div>

            {/* Sync Button */}
            {attendanceMode === 'biometric' && (
              <button
                type="button"
                onClick={() => syncBiometric(false)}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-[var(--blue)] text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Syncing…' : 'Sync Now'}
              </button>
            )}
          </div>
        </div>

        {/* Filters and Date Picker */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
          <div className="flex items-center gap-2 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5">
            <Search size={13} className="text-[var(--tx3)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff by name, department..."
              className="flex-1 bg-transparent text-[12px] text-[var(--tx)] placeholder:text-[var(--tx3)] outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-1.5 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
          >
            <option value="All">All Categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5">
            <Calendar size={13} className="text-[var(--tx3)]" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-transparent text-[12px] text-[var(--tx)] outline-none cursor-pointer font-medium"
            />
          </div>
        </div>

        {/* Mode banner */}
        <div className="flex items-center justify-between p-3.5 bg-[var(--surf2)] border border-[var(--b)] rounded-xl mb-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Fingerprint size={15} className={attendanceMode === 'biometric' ? 'text-[var(--blue-tx)] shrink-0' : 'text-[var(--amber-tx)] shrink-0'} />
            <span className="text-[11.5px] text-[var(--tx2)] leading-relaxed">
              {attendanceMode === 'biometric' ? (
                <>
                  <strong>Biometric Mode:</strong> Attendance driven by e-TimeOffice impressions for <strong>{formatDateDDMMYYYY(date)}</strong>.<br />
                  <span className="text-[10px] text-[var(--tx3)]">Rules: 0 punches = Absent · 1 punch = Half Day · 2+ punches = Present.</span>
                  {lastSyncMsg && (
                    <span className={`block mt-0.5 text-[10.5px] ${lastSyncMsg.startsWith('✓') ? 'text-emerald-600' : lastSyncMsg.startsWith('⚠') ? 'text-amber-600' : 'text-red-500'}`}>
                      {lastSyncMsg}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <strong>Manual Override active:</strong> Attendance is editable manually. Use this when the biometric machine is offline or under maintenance.
                </>
              )}
            </span>
          </div>
          {attendanceMode === 'biometric' && (
            <button
              onClick={clearSimulatedPunches}
              className="text-[10.5px] text-[var(--red-tx)] hover:underline cursor-pointer font-medium ml-3 shrink-0"
            >
              Clear Simulation Punches
            </button>
          )}
        </div>

        {/* Staff Attendance Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] min-w-[850px]">
            <thead>
              <tr className="border-b border-[var(--b)] text-[var(--tx3)]">
                {['Staff Member', 'Category & Department', 'Check-In', 'Check-Out', 'Working Hours', 'Status', 'Controls'].map((h) => (
                  <th
                    key={h}
                    className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-3 py-2 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s) => {
                const status        = getStatus(s);
                const punchesList   = getPunchesForStaffOnDate(s);
                const bioRecords    = getBiometricRecordsForStaff(s);
                const bioRecord     = bioRecords[0]; // primary record
                // Determine raw check-in and check-out times (first and last punches of the day):
                let inTime: string | null = null;
                let outTime: string | null = null;
                let workTime: string | null = null;
                let isLate = false;
                let isEarly = false;

                const todayPunches = punchesList.filter((p) => p.timestamp.startsWith(date));
                if (todayPunches.length > 0) {
                  todayPunches.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
                  
                  // First punch is check-in
                  const earliest = todayPunches[0].timestamp.split(' ')[1]?.substring(0, 5) || null;
                  inTime = earliest;

                  // Last punch (if different and more than one punch) is check-out
                  if (todayPunches.length > 1) {
                    const latest = todayPunches[todayPunches.length - 1].timestamp.split(' ')[1]?.substring(0, 5) || null;
                    if (latest !== earliest) {
                      outTime = latest;
                    }
                  }
                } else {
                  // Fallbacks from bioRecord
                  if (bioRecord?.INTime && bioRecord.INTime !== '--:--') {
                    inTime = bioRecord.INTime;
                  }
                  if (bioRecord?.OUTTime && bioRecord.OUTTime !== '--:--') {
                    outTime = bioRecord.OUTTime;
                  }
                }

                // Determine Lateness (if first punch is after Present Cutoff Morning)
                if (inTime) {
                  if (inTime > presentCutoffMorning) {
                    isLate = true;
                  }
                }

                // Determine Early Departure (if last punch is before Present Cutoff Evening)
                if (outTime) {
                  if (outTime < presentCutoffEvening) {
                    isEarly = true;
                  }
                }

                // Compute Working Hours based on first and last punch times
                if (inTime && outTime) {
                  const [inH, inM] = inTime.split(':').map(Number);
                  const [outH, outM] = outTime.split(':').map(Number);
                  const diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
                  if (diffMinutes > 0) {
                    const hours = Math.floor(diffMinutes / 60);
                    const minutes = diffMinutes % 60;
                    workTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                  } else {
                    workTime = '00:00';
                  }
                } else if (bioRecord?.WorkTime && bioRecord.WorkTime !== '00:00') {
                  workTime = bioRecord.WorkTime;
                }
                const hasApprovedLeave = leaveRequests.some((l) => 
                  String(l.staffId) === String(s.id) &&
                  l.status === 'Approved' &&
                  date >= l.from &&
                  date <= l.to
                );

                return (
                  <tr key={s.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)]/40 transition-colors last:border-0">
                    {/* Staff info */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          initials={s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          bg="var(--purple-bg)"
                          color="var(--purple-tx)"
                        />
                        <div>
                          <span className="font-semibold text-[var(--tx)]">{s.name}</span>
                          <div className="text-[10px] text-[var(--tx3)]">{s.designation}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-3 py-2.5">
                      <span className="font-medium text-[var(--tx)]">{s.category || 'Teaching'}</span>
                      <div className="text-[10.5px] text-[var(--tx3)]">{s.department || 'N/A'}</div>
                    </td>

                    {/* Check-In */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {attendanceMode === 'biometric' ? (
                          <>
                            <span className={`font-semibold ${inTime ? 'text-emerald-700' : 'text-[var(--tx3)]/60'}`}>
                              {inTime || '—'}
                            </span>
                            {isLate && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[9px] font-bold">
                                Late
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => addSimulatedPunch(s.id)}
                              className="p-1 border border-[var(--b)] bg-[var(--surf2)] hover:border-[var(--blue)] hover:bg-[var(--blue-bg)] hover:text-[var(--blue-tx)] rounded text-[9.5px] font-semibold cursor-pointer transition-colors"
                              title="Simulate Check-In/Punch"
                            >
                              + Sim
                            </button>
                          </>
                        ) : (
                          <span className="font-medium text-[var(--tx2)]">
                            {status === 'Present' || status === 'Half Day' ? '09:00 AM' : '—'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Check-Out */}
                    <td className="px-3 py-2.5">
                      {attendanceMode === 'biometric' ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${outTime ? 'text-red-600' : 'text-[var(--tx3)]/60'}`}>
                            {outTime || '—'}
                          </span>
                          {isEarly && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[9px] font-bold">
                              Early
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-medium text-[var(--tx2)]">
                          {status === 'Present' ? '05:00 PM' : '—'}
                        </span>
                      )}
                    </td>

                    {/* Working Hours */}
                    <td className="px-3 py-2.5">
                      {attendanceMode === 'biometric' ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${workTime ? 'text-[var(--tx)]' : 'text-[var(--tx3)]/60'}`}>
                            {workTime || '—'}
                          </span>
                          {bioRecord?.OverTime && bioRecord.OverTime !== '00:00' && (
                            <span className="text-[9.5px] text-emerald-600 font-bold">
                              +OT {bioRecord.OverTime}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-semibold text-[var(--tx2)]">
                          {status === 'Present' ? '8.0 hrs' : status === 'Half Day' ? '4.0 hrs' : '—'}
                        </span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-3 py-2.5">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                        status === 'Present'
                          ? 'bg-teal-500/10 text-teal-600 border-teal-500/20'
                          : status === 'Absent'
                          ? 'bg-red-500/10 text-red-600 border-red-500/20'
                          : status === 'Half Day'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                      }`}>
                        {status}
                      </span>
                    </td>

                    {/* Controls */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {hasApprovedLeave ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold text-purple-600 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            Approved Leave
                          </span>
                        ) : (
                          [
                            { value: 'Present', bg: 'hover:bg-teal-500/10 hover:text-teal-600', active: 'bg-teal-500/10 text-teal-600 border border-teal-500/20' },
                            { value: 'Absent',  bg: 'hover:bg-red-500/10 hover:text-red-600',  active: 'bg-red-500/10 text-red-600 border border-red-500/20' },
                            { value: 'Half Day', bg: 'hover:bg-amber-500/10 hover:text-amber-600', active: 'bg-amber-500/10 text-amber-600 border border-amber-500/20' },
                            { value: 'Leave',   bg: 'hover:bg-purple-500/10 hover:text-purple-600', active: 'bg-purple-500/10 text-purple-600 border border-purple-500/20' },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setManualStatus(s.id, opt.value as AttendanceStatus)}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                                status === opt.value
                                  ? opt.active
                                  : `text-[var(--tx3)] border-[var(--b)] bg-transparent ${opt.bg}`
                              }`}
                              title={`Set to ${opt.value}`}
                            >
                              {opt.value}
                            </button>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[var(--tx3)]">
                    No staff members found matching search or filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
