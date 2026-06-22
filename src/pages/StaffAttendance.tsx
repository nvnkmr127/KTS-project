import { useState, useEffect } from 'react';
import { Search, Calendar, UserCheck, UserX, AlertCircle, Clock, Fingerprint, Plus } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Avatar } from '../components/ui';
import { STAFF, StaffMember } from './StaffManagement';
import { api } from '../services/api';

type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Half Day';

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
    const parts = punchDateStr.trim().split(' ');
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
          return datePart;
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

export function StaffAttendance() {
  const [date, setDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  
  // Local storage manual attendance overrides
  const [manualAttendance, setManualAttendance] = useState<Record<string, Record<string, AttendanceStatus>>>(() => {
    const saved = localStorage.getItem('kts_staff_attendance');
    return saved ? JSON.parse(saved) : {};
  });

  // Local simulated biometric punches
  const [localPunches, setLocalPunches] = useState<LocalPunch[]>(() => {
    const saved = localStorage.getItem('kts_biometric_punches');
    return saved ? JSON.parse(saved) : [];
  });

  // API biometric logs
  const [apiPunches, setApiPunches] = useState<any[]>([]);

  // Attendance Mode: 'biometric' or 'manual'
  const [attendanceMode, setAttendanceMode] = useState<'biometric' | 'manual'>(() => {
    const saved = localStorage.getItem('kts_staff_attendance_mode');
    return (saved as 'biometric' | 'manual') || 'biometric';
  });

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');


  // Load staff members from localStorage (sync with Staff Management)
  useEffect(() => {
    const savedStaffStr = localStorage.getItem('kts_staff_members');
    if (savedStaffStr) {
      try {
        const parsed = JSON.parse(savedStaffStr);
        if (Array.isArray(parsed)) {
          setStaffList(parsed);
          return;
        }
      } catch (err) {
        console.error('Error parsing staff members:', err);
      }
    }
    setStaffList(STAFF);
  }, []);

  // Fetch biometric logs from API when date changes
  useEffect(() => {
    async function fetchBiometricLogs() {
      try {
        const logs = await api.getResources('biometric-logs');
        if (Array.isArray(logs)) {
          setApiPunches(logs);
        }
      } catch (err) {
        console.log('Backend biometric-logs API is offline/unavailable, falling back to local simulation.', err);
      }
    }
    fetchBiometricLogs();
  }, [date]);

  // Persistence hooks
  useEffect(() => {
    localStorage.setItem('kts_staff_attendance', JSON.stringify(manualAttendance));
  }, [manualAttendance]);

  useEffect(() => {
    localStorage.setItem('kts_biometric_punches', JSON.stringify(localPunches));
  }, [localPunches]);

  useEffect(() => {
    localStorage.setItem('kts_staff_attendance_mode', attendanceMode);
  }, [attendanceMode]);

  // Extract unique categories for filtering
  const allCategories = Array.from(new Set(staffList.map((s) => s.category || 'Teaching')));

  // Helper to count punches for a staff member on the selected date
  const getPunchesForStaffOnDate = (staff: StaffMember) => {
    if (attendanceMode === 'manual') {
      const manualStatus = manualAttendance[date]?.[staff.id] || 'Present';
      if (manualStatus === 'Present') {
        return [
          { id: 'm1', staffId: staff.id, timestamp: `${date} 09:00:00` },
          { id: 'm2', staffId: staff.id, timestamp: `${date} 17:00:00` }
        ];
      }
      if (manualStatus === 'Half Day') {
        return [
          { id: 'm1', staffId: staff.id, timestamp: `${date} 09:00:00` }
        ];
      }
      return []; // Absent or Leave
    }

    const localCount = localPunches.filter(
      (p) => p.staffId === staff.id && p.timestamp.startsWith(date)
    );

    const apiCount = apiPunches.filter((p) => {
      const dataObj = p.punch_data || p;
      const punchDateStr = dataObj.PunchDate || dataObj.punch_date || dataObj.scan_datetime;
      if (!punchDateStr) return false;

      const parsedDate = parsePunchDate(punchDateStr) || punchDateStr.slice(0, 10);
      if (parsedDate !== date) return false;

      const code = String(dataObj.Empcode || dataObj.emp_code || dataObj.employee_code || '').toLowerCase().trim();
      const name = String(dataObj.Name || dataObj.name || '').toLowerCase().trim();

      return (
        code === String(staff.id).toLowerCase().trim() ||
        code === staff.phone.trim() ||
        name === staff.name.toLowerCase().trim() ||
        normalizeName(name) === normalizeName(staff.name)
      );
    });

    return [...localCount, ...apiCount];
  };

  // Get current status of a staff member for the selected date
  const getStatus = (staff: StaffMember): AttendanceStatus => {
    const manualStatus = manualAttendance[date]?.[staff.id];

    // If manual status is set to 'Leave', we always respect it (even in biometric mode)
    if (manualStatus === 'Leave') {
      return 'Leave';
    }

    if (attendanceMode === 'manual') {
      return manualStatus || 'Present'; // Default to Present in manual mode
    }

    // Biometric Mode
    const punchesCount = getPunchesForStaffOnDate(staff).length;
    if (punchesCount === 0) return 'Absent';
    if (punchesCount === 1) return 'Half Day';
    return 'Present';
  };

  // Set manual override status
  const setManualStatus = (staffId: string, status: AttendanceStatus) => {
    setManualAttendance((prev) => {
      const dateRecords = prev[date] ? { ...prev[date] } : {};
      dateRecords[staffId] = status;
      return {
        ...prev,
        [date]: dateRecords,
      };
    });
  };

  // Add a test simulated biometric punch for a staff member
  const addSimulatedPunch = (staffId: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS
    const newPunch: LocalPunch = {
      id: 'punch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      staffId,
      timestamp: `${date} ${timeStr}`,
    };
    setLocalPunches((prev) => [...prev, newPunch]);
  };

  // Reset/Clear local simulation punches for the selected date
  const clearSimulatedPunches = () => {
    if (window.confirm('Clear all local simulated punches for this date?')) {
      setLocalPunches((prev) => prev.filter((p) => !p.timestamp.startsWith(date)));
    }
  };

  // Filter staff list based on search and category
  const filteredStaff = staffList.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.designation.toLowerCase().includes(search.toLowerCase()) ||
      (s.department || '').toLowerCase().includes(search.toLowerCase());
    
    const matchCategory = categoryFilter === 'All' || (s.category || 'Teaching') === categoryFilter;
    return matchSearch && matchCategory;
  });

  // Calculate metrics for the selected date
  const totalStaff = staffList.length;
  const presentCount = staffList.filter((s) => getStatus(s) === 'Present').length;
  const absentCount = staffList.filter((s) => getStatus(s) === 'Absent').length;
  const halfDayCount = staffList.filter((s) => getStatus(s) === 'Half Day').length;
  const leaveCount = staffList.filter((s) => getStatus(s) === 'Leave').length;

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
        {/* Header with Attendance Mode Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 border-b border-[var(--b)] pb-4">
          <div>
            <div className="text-[13.5px] font-bold text-[var(--tx)]">Staff Daily Attendance</div>
            <div className="text-[11px] text-[var(--tx3)]">Record staff daily attendance using biometric machine inputs or manual overrides</div>
          </div>
          
          <div className="flex items-center gap-3 bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-2">
            <span className="text-[11.5px] font-semibold text-[var(--tx2)] flex items-center gap-1.5">
              <Fingerprint size={14} className="text-[var(--blue-tx)]" /> Input Mode:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAttendanceMode('biometric')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  attendanceMode === 'biometric'
                    ? 'bg-[var(--blue)] text-white'
                    : 'text-[var(--tx3)] hover:text-[var(--tx2)]'
                }`}
              >
                Biometric Sync
              </button>
              <button
                type="button"
                onClick={() => setAttendanceMode('manual')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  attendanceMode === 'manual'
                    ? 'bg-[var(--amber-bg)] text-[var(--amber-tx)] border border-[var(--amber-tx)]/20'
                    : 'text-[var(--tx3)] hover:text-[var(--tx2)]'
                }`}
                title="Use this if biometric machine is under maintenance or offline"
              >
                Manual Override
              </button>
            </div>
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
              <option key={cat} value={cat}>
                {cat}
              </option>
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

        {/* Mode info message */}
        <div className="flex items-center justify-between p-3.5 bg-[var(--surf2)] border border-[var(--b)] rounded-xl mb-4">
          <div className="flex items-center gap-2">
            <Fingerprint size={16} className={attendanceMode === 'biometric' ? 'text-[var(--blue-tx)]' : 'text-[var(--amber-tx)]'} />
            <span className="text-[11.5px] text-[var(--tx2)]">
              {attendanceMode === 'biometric' ? (
                <>
                  <strong>Biometric Mode active:</strong> Attendance is set based on machine impressions for <strong>{(() => {
                    const parts = date.split('-');
                    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : date;
                  })()}</strong>.<br />
                  <span className="text-[10px] text-[var(--tx3)]">Rules: 0 impressions = Absent | 1 impression = Half Day | 2+ impressions = Present.</span>
                </>
              ) : (
                <>
                  <strong>Manual Override active:</strong> Attendance is editable manually. Use this mode when the biometric machine is offline or undergoing maintenance.
                </>
              )}
            </span>
          </div>
          {attendanceMode === 'biometric' && (
            <button
              onClick={clearSimulatedPunches}
              className="text-[11px] text-[var(--red-tx)] hover:underline cursor-pointer font-medium"
            >
              Reset Simulation Punches
            </button>
          )}
        </div>

        {/* Staff Attendance Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--b)] text-[var(--tx3)]">
                {['Staff Member', 'Category & Department', 'Punches Today', 'Status & Controls'].map((h) => (
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
                const status = getStatus(s);
                const punchesList = getPunchesForStaffOnDate(s);
                
                return (
                  <tr key={s.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)]/40 transition-colors last:border-0">
                    {/* Staff info */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          initials={s.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
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

                    {/* Biometric Punches Count */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          punchesList.length === 0
                            ? 'bg-[var(--red-bg)] text-[var(--red-tx)]'
                            : punchesList.length === 1
                            ? 'bg-[var(--amber-bg)] text-[var(--amber-tx)]'
                            : 'bg-[var(--teal-bg)] text-[var(--teal-tx)]'
                        }`}>
                          {punchesList.length} punch{punchesList.length !== 1 ? 'es' : ''}
                        </span>

                        {attendanceMode === 'biometric' && (
                          <button
                            type="button"
                            onClick={() => addSimulatedPunch(s.id)}
                            className="p-1 border border-[var(--b)] bg-[var(--surf2)] hover:border-[var(--blue)] hover:bg-[var(--blue-bg)] hover:text-[var(--blue-tx)] rounded text-[10px] font-semibold cursor-pointer transition-colors flex items-center gap-0.5"
                            title="Simulate Fingerprint Biometric Impression"
                          >
                            <Plus size={10} /> Punch
                          </button>
                        )}
                      </div>
                      {punchesList.length > 0 && (
                        <div className="text-[9px] text-[var(--tx3)] mt-1.5 max-w-[150px] truncate">
                          {punchesList.map(p => p.timestamp.slice(11, 16)).join(', ')}
                        </div>
                      )}
                    </td>

                    {/* Status Buttons */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {attendanceMode === 'manual' ? (
                          // Manual Mode Buttons
                          [
                            { value: 'Present', bg: 'hover:bg-teal-500/10 hover:text-teal-600', active: 'bg-teal-500/10 text-teal-600 border border-teal-500/20' },
                            { value: 'Absent', bg: 'hover:bg-red-500/10 hover:text-red-600', active: 'bg-red-500/10 text-red-600 border border-red-500/20' },
                            { value: 'Half Day', bg: 'hover:bg-amber-500/10 hover:text-amber-600', active: 'bg-amber-500/10 text-amber-600 border border-amber-500/20' },
                            { value: 'Leave', bg: 'hover:bg-purple-500/10 hover:text-purple-600', active: 'bg-purple-500/10 text-purple-600 border border-purple-500/20' },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setManualStatus(s.id, opt.value as AttendanceStatus)}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all border border-transparent cursor-pointer ${
                                status === opt.value
                                  ? opt.active
                                  : `text-[var(--tx3)] bg-transparent ${opt.bg}`
                              }`}
                            >
                              {opt.value}
                            </button>
                          ))
                        ) : (
                          // Biometric Mode Badges (Read-Only)
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-[11px] font-semibold rounded-lg border ${
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
                            {/* Allow toggling Leave even in Biometric Mode */}
                            <button
                              type="button"
                              onClick={() => setManualStatus(s.id, status === 'Leave' ? 'Present' : 'Leave')}
                              className={`px-2 py-1 text-[10px] font-semibold rounded border cursor-pointer transition-colors ${
                                status === 'Leave'
                                  ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                  : 'text-[var(--tx3)] border-[var(--b)] hover:bg-[var(--surf3)]'
                              }`}
                              title="Toggle Leave Status for this staff member"
                            >
                              {status === 'Leave' ? 'Cancel Leave' : 'Set Leave'}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-[var(--tx3)]">
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
