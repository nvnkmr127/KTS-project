import { useState, useEffect } from 'react';
import { RotateCcw, LogIn, LogOut, Edit2, Trash2, Plus, Activity, Clock, TrendingUp, Search, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';

interface ActivityEntry {
  id: string;
  description: string;
  event: string;
  log_name: string;
  subject_type: string;
  causer_name: string;
  properties: Record<string, any>;
  created_at: string;
  time_ago: string;
}

interface MyStats {
  total_actions: number;
  today: number;
  this_week: number;
  last_login: string | null;
  most_recent: { description: string; event: string; created_at: string } | null;
}

export function TeacherActivityLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string,string> = { limit: '200' };
      if (dateFilter) params.date_from = params.date_to = dateFilter;
      const [logsRes, statsRes] = await Promise.all([
        api.getActivityLogs(params),
        api.getMyActivityStats(),
      ]);
      setLogs(logsRes.data ?? logsRes ?? []);
      setStats(statsRes);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [dateFilter]);

  const filtered = logs.filter(l => {
    const matchSearch = !search ||
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      l.subject_type?.toLowerCase().includes(search.toLowerCase());
    const matchEvent = !eventFilter || l.event === eventFilter;
    return matchSearch && matchEvent;
  });

  const totalActions = stats?.total_actions ?? 0;
  const todayActions = stats?.today ?? 0;
  const thisWeekActions = stats?.this_week ?? 0;
  const lastLoginStr = formatLastLogin(stats?.last_login ?? null);

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {/* SECTION 1 — Welcome header */}
      <div className="mb-4">
        <h2 className="text-[15px] font-bold text-[var(--tx)]">My Activity Log</h2>
        <p className="text-[11px] text-[var(--tx3)] mt-0.5">A complete record of all your actions in the system.</p>
      </div>

      {/* SECTION 2 — Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Card 1: My Total Actions */}
        <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: 'var(--blue-bg)', color: 'var(--blue-tx)'}}>
            <Activity size={16} />
          </div>
          <div>
            <p className="text-[18px] font-bold text-[var(--tx)]">{totalActions}</p>
            <p className="text-[10px] text-[var(--tx3)]">My Total Actions</p>
          </div>
        </div>

        {/* Card 2: Today */}
        <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: 'var(--teal-bg)', color: 'var(--teal-tx)'}}>
            <Clock size={16} />
          </div>
          <div>
            <p className="text-[18px] font-bold text-[var(--tx)]">{todayActions}</p>
            <p className="text-[10px] text-[var(--tx3)]">Today</p>
          </div>
        </div>

        {/* Card 3: This Week */}
        <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: 'var(--purple-bg)', color: 'var(--purple-tx)'}}>
            <TrendingUp size={16} />
          </div>
          <div>
            <p className="text-[18px] font-bold text-[var(--tx)]">{thisWeekActions}</p>
            <p className="text-[10px] text-[var(--tx3)]">This Week</p>
          </div>
        </div>

        {/* Card 4: Last Login */}
        <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: 'var(--green-bg)', color: 'var(--green-tx)'}}>
            <LogIn size={16} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-[var(--tx)] truncate max-w-[100px] sm:max-w-none">{lastLoginStr}</p>
            <p className="text-[10px] text-[var(--tx3)]">Last Login</p>
          </div>
        </div>
      </div>

      {/* SECTION 3 — Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search input */}
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tx3)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search my activity…"
            className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-xl pl-9 pr-3 py-1.5 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] placeholder-[var(--tx3)]"
          />
        </div>

        {/* Event filter */}
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl px-3 py-1.5 text-[12px] text-[var(--tx)] cursor-pointer outline-none min-w-[120px]"
        >
          <option value="">All Events</option>
          <option value="created">created</option>
          <option value="updated">updated</option>
          <option value="deleted">deleted</option>
          <option value="login">login</option>
          <option value="logout">logout</option>
        </select>

        {/* Date picker */}
        <div className="flex items-center gap-1 bg-[var(--surf2)] border border-[var(--b)] rounded-xl px-3 py-1">
          <span className="text-[10px] text-[var(--tx3)] font-semibold uppercase">Date</span>
          <input
            type="date"
            value={dateFilter}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-transparent border-0 text-[12px] text-[var(--tx)] outline-none p-0 cursor-pointer"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-[var(--tx3)] hover:text-[var(--tx)] ml-1 cursor-pointer"
              title="Clear date"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center justify-center p-2 text-[var(--tx2)] hover:text-[var(--tx)] border border-[var(--b)] rounded-xl bg-[var(--surf2)] hover:bg-[var(--surf3)] cursor-pointer disabled:opacity-50"
          title="Refresh logs"
        >
          <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* SECTION 4 — Timeline */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <span className="text-[13px] font-bold text-[var(--tx)] flex items-center gap-1.5">
            <Activity size={14} className="text-[var(--blue-tx)]" /> Activity Timeline
          </span>
          <span className="px-2.5 py-0.5 bg-[var(--blue-bg)] text-[var(--blue-tx)] text-[10px] font-bold rounded-full">
            {filtered.length} events
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="flex gap-3 py-3 border-b border-[var(--b)] last:border-0 animate-pulse">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-6 h-6 rounded-full bg-[var(--surf3)]" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-12 bg-[var(--surf3)] rounded-full" />
                      <div className="h-4 w-48 bg-[var(--surf3)] rounded" />
                    </div>
                    <div className="h-3 w-12 bg-[var(--surf3)] rounded" />
                  </div>
                  <div className="flex gap-1.5">
                    <div className="h-3.5 w-16 bg-[var(--surf3)] rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <div className="w-12 h-12 rounded-full bg-[var(--surf2)] flex items-center justify-center mx-auto text-[var(--tx3)]">
              <Activity size={32} />
            </div>
            <p className="text-[12px] text-[var(--tx3)] italic">No activity found</p>
            {(search || eventFilter || dateFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setEventFilter('');
                  setDateFilter('');
                }}
                className="text-[11px] font-semibold text-[var(--blue-tx)] bg-[var(--blue-bg)] px-2.5 py-1 rounded-xl hover:opacity-90 mt-1 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((log) => (
              <div key={log.id} className="flex gap-3 py-3 border-b border-[var(--b)] last:border-0">
                {/* Left: event icon dot */}
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${eventDotColor(log.event)}`}>
                    {eventIcon(log.event)}
                  </div>
                </div>
                
                {/* Center: content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {/* Event badge instead of causer name */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold mr-2 ${eventBadgeStyle(log.event)}`}>
                        {log.event}
                      </span>
                      {/* Description */}
                      <span className="text-[12px] text-[var(--tx)]">{formatDescription(log)}</span>
                    </div>
                    {/* Time */}
                    <span className="text-[10px] text-[var(--tx3)] flex-shrink-0">{log.time_ago}</span>
                  </div>
                  
                  {/* Second row: tags */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {log.subject_type && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surf2)] text-[var(--tx3)]">
                        {log.subject_type}
                      </span>
                    )}
                    {log.properties?.ip_address && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surf2)] text-[var(--tx3)]">
                        {log.properties.ip_address}
                      </span>
                    )}
                  </div>
                  
                  {/* Expandable properties */}
                  {Object.keys(log.properties ?? {}).length > 0 && (
                    <button
                      onClick={() => setExpandedId(expandedId === String(log.id) ? null : String(log.id))}
                      className="text-[10px] text-[var(--blue-tx)] mt-1 hover:underline block"
                    >
                      {expandedId === String(log.id) ? 'Hide details ▲' : 'Show details ▼'}
                    </button>
                  )}
                  {expandedId === String(log.id) && renderActivityProperties(log)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Helper functions copied from Step 8

function eventDotColor(event: string): string {
  if (event === 'created') return 'bg-green-500';
  if (event === 'updated') return 'bg-blue-500';
  if (event === 'deleted') return 'bg-red-500';
  if (event === 'login')   return 'bg-teal-500';
  if (event === 'logout')  return 'bg-gray-400';
  return 'bg-amber-400';
}

function eventBadgeStyle(event: string): string {
  if (event === 'created') return 'bg-[var(--green-bg)] text-[var(--green-tx)]';
  if (event === 'updated') return 'bg-[var(--blue-bg)] text-[var(--blue-tx)]';
  if (event === 'deleted') return 'bg-[var(--red-bg)] text-[var(--red-tx)]';
  if (event === 'login')   return 'bg-[var(--teal-bg)] text-[var(--teal-tx)]';
  if (event === 'logout')  return 'bg-[var(--surf2)] text-[var(--tx3)]';
  return 'bg-[var(--amber-bg)] text-[var(--amber-tx)]';
}

function eventIcon(event: string) {
  if (event === 'created') return <Plus size={12} />;
  if (event === 'updated') return <Edit2 size={12} />;
  if (event === 'deleted') return <Trash2 size={12} />;
  if (event === 'login')   return <LogIn size={12} />;
  if (event === 'logout')  return <LogOut size={12} />;
  return <Activity size={12} />;
}

function formatLastLogin(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month} ${day}, ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

// HELPER TO FORMAT ANY VALUE HUMAN READABLY WITHOUT BRACES
const formatVal = (v: any): string => {
  if (v === null || v === undefined) return 'N/A';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(v);
        return formatVal(parsed);
      } catch (err) {
        console.debug('JSON parse error in formatVal:', err);
      }
    }
    return v;
  }

  if (Array.isArray(v)) {
    if (v.length === 0) return 'None';
    
    // If it's an array of objects
    if (typeof v[0] === 'object' && v[0] !== null) {
      // Special check: is it an attendance list?
      const isAttendanceList = v.some((item: any) => item && (item.status === 'present' || item.status === 'absent'));
      if (isAttendanceList) {
        const present = v.filter((item: any) => item && item.status === 'present').length;
        const absent = v.filter((item: any) => item && item.status === 'absent').length;
        return `Present: ${present}, Absent: ${absent}`;
      }

      return `${v.length} items`;
    }
    return v.map(item => formatVal(item)).join(', ');
  }

  if (typeof v === 'object') {
    const entries = Object.entries(v);
    if (entries.length === 0) return '';
    return entries
      .map(([k, val]) => {
        const formattedKey = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return `${formattedKey}: ${formatVal(val)}`;
      })
      .join(', ');
  }

  return String(v);
};

// HELPER TO DYNAMICALLY CLEAN UP ANY JSON STRING INSIDE DESCRIPTION
const cleanJsonInString = (str: string): string => {
  if (!str) return '';
  const startIdxCurly = str.indexOf('{');
  const startIdxSquare = str.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;
  let isCurly = false;
  
  if (startIdxCurly !== -1 && (startIdxSquare === -1 || startIdxCurly < startIdxSquare)) {
    startIdx = startIdxCurly;
    isCurly = true;
  } else if (startIdxSquare !== -1) {
    startIdx = startIdxSquare;
  }
  
  if (startIdx !== -1) {
    const endIdxCurly = str.lastIndexOf('}');
    const endIdxSquare = str.lastIndexOf(']');
    if (isCurly && endIdxCurly > startIdx) {
      endIdx = endIdxCurly;
    } else if (!isCurly && endIdxSquare > startIdx) {
      endIdx = endIdxSquare;
    }
  }
  
  if (startIdx !== -1 && endIdx !== -1) {
    const prefix = str.substring(0, startIdx).trim();
    let suffix = str.substring(endIdx + 1).trim();
    const jsonStr = str.substring(startIdx, endIdx + 1);
    
    try {
      const parsed = JSON.parse(jsonStr);
      if (suffix === "'" || suffix === '"') suffix = '';
      let cleanPrefix = prefix;
      if (cleanPrefix.endsWith("to '") || cleanPrefix.endsWith('to "')) {
        cleanPrefix = cleanPrefix.substring(0, cleanPrefix.length - 5).trim();
      } else if (cleanPrefix.endsWith("to")) {
        cleanPrefix = cleanPrefix.substring(0, cleanPrefix.length - 2).trim();
      }
      
      let formattedJson = formatVal(parsed);
      if (formattedJson.length > 120) {
        formattedJson = formattedJson.substring(0, 120) + '...';
      }
      return `${cleanPrefix}${formattedJson ? ` to: ${formattedJson}` : ''}${suffix ? ` ${suffix}` : ''}`;
    } catch (err) {
      console.debug('JSON parse error in cleanDescription:', err);
    }
  }
  
  return str;
};

// FORMAT DYNAMIC DESCRIPTIONS DYNAMICALLY (e.g. attendance logs)
function formatDescription(log: any): string {
  const desc = log.description || '';
  if (desc.startsWith("Updated system setting 'kts student attendance records' to") || desc === "Student attendance records updated" || desc.toLowerCase().includes("attendance")) {
    const properties = log.properties || {};
    let records: any[] = [];
    
    const parseValue = (val: any) => {
      if (!val) return [];
      try {
        if (Array.isArray(val)) return val;
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (err) {
        console.debug('Parse error:', err);
      }
      return [];
    };

    records = parseValue(properties.attributes?.value || properties.value);
    
    if (records.length === 0) {
      for (const val of Object.values(properties)) {
        const arr = parseValue(val);
        if (arr.length > 0 && arr[0] && (arr[0].className || arr[0].session || arr[0].markedAt)) {
          records = arr;
          break;
        }
      }
    }

    if (records.length === 0) {
      const startIdxSquare = desc.indexOf('[');
      const endIdxSquare = desc.lastIndexOf(']');
      if (startIdxSquare !== -1 && endIdxSquare > startIdxSquare) {
        const jsonStr = desc.substring(startIdxSquare, endIdxSquare + 1);
        records = parseValue(jsonStr);
      }
    }

    if (records.length > 0) {
      let maxMarkedAt = '';
      records.forEach((r: any) => {
        if (r && r.markedAt) {
          if (!maxMarkedAt || r.markedAt > maxMarkedAt) {
            maxMarkedAt = r.markedAt;
          }
        }
      });

      const targetRecords = maxMarkedAt 
        ? records.filter((r: any) => r && r.markedAt === maxMarkedAt)
        : records;

      if (targetRecords.length > 0 && targetRecords[0]) {
        const first = targetRecords[0];
        const classSection = first.className || '';
        const session = first.session === 'first_period' ? 'morning' : 'afternoon';
        if (classSection) {
          return `marked attendance for ${classSection} in ${session}`;
        }
      }
    }
  }
  return cleanJsonInString(desc);
}

// RENDER ACTIVITY PROPERTIES IN HUMAN READABLE FORMAT
function renderActivityProperties(log: any) {
  const properties = log.properties;
  const event = log.event;
  const description = log.description;

  if (!properties || Object.keys(properties).length === 0) return null;

  const formatKey = (k: string) => {
    return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const isAttendanceLog = 
    properties.present_count !== undefined ||
    (description && (
      description === 'Student attendance records updated' ||
      description.toLowerCase().includes('attendance')
    )) ||
    (properties.attributes && (properties.attributes.key === 'kts_student_attendance_records' || properties.attributes.key === 'kts student attendance records')) ||
    (properties.old && (properties.old.key === 'kts_student_attendance_records' || properties.old.key === 'kts student attendance records'));

  if (isAttendanceLog) {
    let present: number | undefined = undefined;
    let absent: number | undefined = undefined;

    let oldArr: any[] = [];
    let newArr: any[] = [];
    
    const parseValue = (val: any) => {
      if (!val) return [];
      try {
        if (Array.isArray(val)) return val;
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (err) {
        console.debug('Parse error:', err);
      }
      return [];
    };

    newArr = parseValue(properties.attributes?.value || properties.value);
    oldArr = parseValue(properties.old?.value);

    if (newArr.length === 0 && oldArr.length === 0) {
      for (const val of Object.values(properties)) {
        const arr = parseValue(val);
        if (arr.length > 0 && arr[0] && (arr[0].studentId || arr[0].status || arr[0].markedAt)) {
          newArr = arr;
          break;
        }
      }
    }

    if (newArr.length === 0 && oldArr.length === 0) {
      const startIdxSquare = description ? description.indexOf('[') : -1;
      const endIdxSquare = description ? description.lastIndexOf(']') : -1;
      if (startIdxSquare !== -1 && endIdxSquare > startIdxSquare) {
        const jsonStr = description.substring(startIdxSquare, endIdxSquare + 1);
        newArr = parseValue(jsonStr);
      }
    }

    if (newArr.length > 0) {
      let maxMarkedAt = '';
      newArr.forEach((r: any) => {
        if (r && r.markedAt) {
          if (!maxMarkedAt || r.markedAt > maxMarkedAt) {
            maxMarkedAt = r.markedAt;
          }
        }
      });
      const targetRecords = maxMarkedAt 
        ? newArr.filter((r: any) => r && r.markedAt === maxMarkedAt)
        : newArr;
      present = targetRecords.filter(r => r.status === 'present').length;
      absent = targetRecords.filter(r => r.status === 'absent').length;
    } else if (oldArr.length > 0) {
      let maxMarkedAt = '';
      oldArr.forEach((r: any) => {
        if (r && r.markedAt) {
          if (!maxMarkedAt || r.markedAt > maxMarkedAt) {
            maxMarkedAt = r.markedAt;
          }
        }
      });
      const targetRecords = maxMarkedAt 
        ? oldArr.filter((r: any) => r && r.markedAt === maxMarkedAt)
        : oldArr;
      present = targetRecords.filter(r => r.status === 'present').length;
      absent = targetRecords.filter(r => r.status === 'absent').length;
    } else {
      if (properties.present_count !== undefined) present = properties.present_count;
      if (properties.absent_count !== undefined) absent = properties.absent_count;
    }

    if (present !== undefined || absent !== undefined) {
      return (
        <div className="mt-2 text-[11px] bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3 text-[var(--tx2)]">
          <div className="font-semibold text-[var(--tx)] text-[11.5px] border-b border-[var(--b)] pb-1.5 mb-1.5">
            Attendance Allotment Summary
          </div>
          <div className="space-y-1">
            <div className="flex justify-between sm:justify-start gap-2">
              <span className="font-bold text-[var(--tx)] min-w-[120px]">Present:</span>
              <span className="text-[var(--teal-tx)] font-semibold">{present ?? 0}</span>
            </div>
            <div className="flex justify-between sm:justify-start gap-2">
              <span className="font-bold text-[var(--tx)] min-w-[120px]">Absent:</span>
              <span className="text-[var(--red-tx)] font-semibold">{absent ?? 0}</span>
            </div>
          </div>
        </div>
      );
    }
  }

  const isModelLog = 'attributes' in properties || 'old' in properties;
  const excludeKeys = ['id', 'created_at', 'updated_at', 'password', 'password_confirmation', 'token', '_token', 'created_by', 'updated_by', 'academic_year_id', 'remember_token'];

  if (isModelLog) {
    const attributes = properties.attributes || {};
    const old = properties.old || {};

    // For updates, we show what changed
    if (event === 'updated' && Object.keys(old).length > 0) {
      const changes = Object.keys(attributes)
        .filter(key => !excludeKeys.includes(key))
        .map(key => {
          const oldVal = old[key];
          const newVal = attributes[key];
          if (oldVal !== newVal) {
            return {
              key,
              old: formatVal(oldVal),
              new: formatVal(newVal)
            };
          }
          return null;
        })
        .filter(Boolean) as Array<{ key: string; old: string; new: string }>;

      if (changes.length > 0) {
        return (
          <div className="mt-2 text-[11px] bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3 space-y-1.5 text-[var(--tx2)]">
            <div className="font-semibold text-[var(--tx)] text-[11.5px] border-b border-[var(--b)] pb-1.5 mb-1.5">Modified Fields</div>
            {changes.map(ch => (
              <div key={ch.key} className="flex flex-wrap gap-1 items-center">
                <span className="font-bold text-[var(--tx)]">{formatKey(ch.key)}</span>
                <span>changed from</span>
                <code className="px-1.5 py-0.5 bg-[var(--surf3)] rounded font-mono text-[10px] text-rose-500 line-through">{ch.old}</code>
                <span>to</span>
                <code className="px-1.5 py-0.5 bg-[var(--surf3)] rounded font-mono text-[10px] text-emerald-500 font-semibold">{ch.new}</code>
              </div>
            ))}
          </div>
        );
      }
    }

    // For created or deleted or fallback where we display a list of attributes
    const displayData = event === 'deleted' ? old : attributes;
    const items = Object.entries(displayData)
      .filter(([key]) => !excludeKeys.includes(key) && displayData[key] !== null)
      .map(([key, val]) => ({
        key,
        value: formatVal(val)
      }));

    if (items.length > 0) {
      return (
        <div className="mt-2 text-[11px] bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3 text-[var(--tx2)]">
          <div className="font-semibold text-[var(--tx)] text-[11.5px] border-b border-[var(--b)] pb-1.5 mb-1.5">
            {event === 'deleted' ? 'Deleted Record Details' : 'Record Details'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            {items.map(item => (
              <div key={item.key} className="flex justify-between sm:justify-start gap-2 border-b border-[var(--b)]/40 pb-1 last:border-0">
                <span className="font-bold text-[var(--tx)] min-w-[120px]">{formatKey(item.key)}:</span>
                <span className="text-[var(--tx2)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  // Otherwise it is a request/middleware log (or doesn't fit attributes/old schema)
  const renderDevice = (ua: string) => {
    if (!ua) return 'Unknown Device';
    if (ua.includes('Edg/')) return 'Edge Browser';
    if (ua.includes('Chrome/')) return 'Chrome Browser';
    if (ua.includes('Safari/') && ua.includes('Version/')) return 'Safari Browser';
    if (ua.includes('Firefox/')) return 'Firefox Browser';
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) return 'Mobile Device';
    return 'Web Browser';
  };

  const details = [];
  if (properties.ip_address) details.push({ label: 'IP Address', value: properties.ip_address });
  if (properties.user_agent) details.push({ label: 'Device', value: renderDevice(properties.user_agent) });
  if (properties.method && properties.path) details.push({ label: 'API Route', value: `${properties.method} ${properties.path}` });
  if (properties.status_code) details.push({ label: 'HTTP Status', value: String(properties.status_code) });
  if (properties.input_keys && Array.isArray(properties.input_keys) && properties.input_keys.length > 0) {
    details.push({ label: 'Parameters Modified', value: properties.input_keys.map(formatKey).join(', ') });
  }

  // Add any other top-level keys that aren't excluded
  const standardKeys = ['ip_address', 'user_agent', 'method', 'path', 'status_code', 'url', 'input_keys'];
  Object.entries(properties).forEach(([key, val]) => {
    if (!standardKeys.includes(key) && val !== null && val !== undefined) {
      details.push({ label: formatKey(key), value: formatVal(val) });
    }
  });

  if (details.length > 0) {
    return (
      <div className="mt-2 text-[11px] bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3 text-[var(--tx2)]">
        <div className="font-semibold text-[var(--tx)] text-[11.5px] border-b border-[var(--b)] pb-1.5 mb-1.5">Activity Details</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {details.map(d => (
            <div key={d.label} className="flex justify-between sm:justify-start gap-2 border-b border-[var(--b)]/40 pb-1 last:border-0">
              <span className="font-bold text-[var(--tx)] min-w-[120px]">{d.label}:</span>
              <span className="text-[var(--tx2)] font-mono">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
