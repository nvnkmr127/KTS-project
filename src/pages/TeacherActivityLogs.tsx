import { useState, useEffect, Fragment } from 'react';
import { RotateCcw, LogIn, Activity, Clock, TrendingUp, Search, X, ChevronDown, ChevronUp, Loader2, Monitor, Smartphone } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ActivityLogDetailPanel } from '../components/ActivityLogDetailPanel';
import {
  getUserDisplayDetails,
  parseActivityDetails,
  parsePlatformInfo,
  formatDateTime,
} from '../utils/activityLogFormatter';

interface ActivityEntry {
  id: string | number;
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

const PAGE_SIZE = 50;

export function TeacherActivityLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async (reset = true, nextOffset?: number) => {
    const currentOffset = nextOffset !== undefined ? nextOffset : (reset ? 0 : offset);
    if (reset) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const params: Record<string, string> = { 
        limit: String(PAGE_SIZE),
        offset: String(currentOffset)
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (eventFilter) params.event = eventFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const [logsRes, statsRes] = await Promise.all([
        api.getActivityLogs(params),
        reset ? api.getMyActivityStats() : Promise.resolve(null),
      ]);

      const raw = logsRes.data ?? logsRes ?? [];
      const clean = (Array.isArray(raw) ? raw : []).filter((l: any) => {
        const desc = (l.description || '').toLowerCase();
        const st = (l.subject_type || '').toLowerCase();
        const isDuplicateAttendance = /^marked attendance on \d{4}-\d{2}-\d{2}$/i.test(desc.trim()) ||
                                      /^updated attendance record on \d{4}-\d{2}-\d{2}$/i.test(desc.trim()) ||
                                      desc.includes('invalidate-cache');
        const isBackendEvent = desc.includes('backend public') ||
                               desc.includes('backend/public') ||
                               desc.includes('componentpaymentitem') ||
                               desc.includes('component-payment-item') ||
                               st === 'componentpaymentitem' ||
                               st === 'app\\models\\componentpaymentitem' ||
                               st === 'webhookcall' ||
                               st === 'app\\models\\webhookcall';
        return !isDuplicateAttendance &&
               !isBackendEvent &&
               !desc.includes('system setting') &&
               !desc.includes('batch subjects') &&
               !desc.includes('batch_subjects') &&
               !desc.includes('examinations exams') &&
               !desc.includes('cltk') &&
               !desc.includes('sak') &&
               st !== 'setting' &&
               st !== 'app\\models\\setting';
      });

      if (reset) {
        setLogs(clean);
      } else {
        setLogs(prev => [...prev, ...clean]);
      }

      setTotalCount(logsRes.total ?? (reset ? clean.length : totalCount));
      if (statsRes) {
        setStats(statsRes);
      }
    } catch (e) {
      console.error('Failed to load teacher activity logs:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    load(true);
  }, [debouncedSearch, eventFilter, dateFrom, dateTo]);

  const isFilterActive = !!(search || eventFilter || dateFrom || dateTo);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setEventFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const totalActions = stats?.total_actions ?? logs.length;
  const todayActions = stats?.today ?? 0;
  const thisWeekActions = stats?.this_week ?? 0;
  const lastLoginStr = stats?.last_login ? formatDateTime(stats.last_login) : '—';

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[var(--bg)] space-y-4">
      
      {/* SECTION 1 — Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">My Activity Log</h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time audit history of your actions, attendance updates, marks, and student management.
          </p>
        </div>
      </div>

      {/* SECTION 2 — KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Actions */}
        <div className="bg-white dark:bg-[var(--surf)] border border-slate-200/80 dark:border-[var(--b)] rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">My Total Actions</div>
            <div className="text-[26px] font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight">{totalActions}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Activity size={20} />
          </div>
        </div>

        {/* Today */}
        <div className="bg-white dark:bg-[var(--surf)] border border-slate-200/80 dark:border-[var(--b)] rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today's Actions</div>
            <div className="text-[26px] font-extrabold text-teal-600 dark:text-teal-400 mt-0.5 tracking-tight">{todayActions}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
            <Clock size={20} />
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white dark:bg-[var(--surf)] border border-slate-200/80 dark:border-[var(--b)] rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">This Week</div>
            <div className="text-[26px] font-extrabold text-purple-600 dark:text-purple-400 mt-0.5 tracking-tight">{thisWeekActions}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Last Login */}
        <div className="bg-white dark:bg-[var(--surf)] border border-slate-200/80 dark:border-[var(--b)] rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Login</div>
            <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mt-1 truncate" title={lastLoginStr}>{lastLoginStr}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <LogIn size={20} />
          </div>
        </div>
      </div>

      {/* SECTION 3 — Filter Controls Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search input */}
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search my actions..."
            className="w-full bg-white dark:bg-[var(--surf)] border border-slate-200/90 dark:border-[var(--b)] rounded-xl pl-9 pr-3.5 py-2 text-[12.5px] text-slate-800 dark:text-[var(--tx)] outline-none focus:border-blue-500 placeholder-slate-400 shadow-2xs"
          />
        </div>

        {/* Events filter */}
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="bg-white dark:bg-[var(--surf)] border border-slate-200/90 dark:border-[var(--b)] rounded-xl px-3.5 py-2 text-[12.5px] text-slate-800 dark:text-[var(--tx)] cursor-pointer outline-none min-w-[130px] shadow-2xs focus:border-blue-500"
        >
          <option value="">All Events</option>
          <option value="created">created</option>
          <option value="updated">updated</option>
          <option value="deleted">deleted</option>
          <option value="login">login</option>
          <option value="logout">logout</option>
          <option value="action">action</option>
        </select>

        {/* FROM Date */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-[var(--surf)] border border-slate-200/90 dark:border-[var(--b)] rounded-xl px-3 py-1.5 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold tracking-wider">FROM</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-transparent border-0 text-[12px] text-slate-800 dark:text-[var(--tx)] outline-none p-0 cursor-pointer"
          />
        </div>

        {/* TO Date */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-[var(--surf)] border border-slate-200/90 dark:border-[var(--b)] rounded-xl px-3 py-1.5 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold tracking-wider">TO</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-transparent border-0 text-[12px] text-slate-800 dark:text-[var(--tx)] outline-none p-0 cursor-pointer"
          />
        </div>

        {/* Clear filter button */}
        {isFilterActive && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-[12px] text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-semibold cursor-pointer border border-rose-200"
          >
            <X size={13} />
            <span>Clear</span>
          </button>
        )}

        {/* Refresh button */}
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="flex items-center justify-center p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 border border-slate-200/90 dark:border-[var(--b)] rounded-xl bg-white dark:bg-[var(--surf)] hover:bg-slate-50 dark:hover:bg-[var(--surf2)] cursor-pointer disabled:opacity-50 shadow-2xs transition-all"
          title="Refresh logs"
        >
          <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* SECTION 4 — Data Table */}
      <div className="bg-white dark:bg-[var(--surf)] rounded-2xl border border-slate-200/80 dark:border-[var(--b)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-[var(--surf2)] border-b border-slate-200/80 dark:border-[var(--b)] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 min-w-[170px]">User</th>
                <th className="py-3 px-4 min-w-[280px]">Activity</th>
                <th className="py-3 px-4 min-w-[160px]">Target</th>
                <th className="py-3 px-4 min-w-[170px]">Date & Time</th>
                <th className="py-3 px-4 min-w-[160px]">Platform</th>
                <th className="py-3 px-4 text-right min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[var(--b)]/60">
              {loading && logs.length === 0 ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[var(--surf3)]" />
                        <div className="space-y-1">
                          <div className="h-3.5 w-24 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                          <div className="h-3 w-16 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-44 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                        <div className="h-3 w-64 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 w-24 bg-slate-100 dark:bg-[var(--surf3)] rounded-lg" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="h-3.5 w-28 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                        <div className="h-3 w-16 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="h-3.5 w-20 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                        <div className="h-3 w-28 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-7 w-16 bg-slate-100 dark:bg-[var(--surf3)] rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[12.5px] text-slate-400 italic">
                    No activity logs found matching the selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const logUser = getUserDisplayDetails(log);
                  const activity = parseActivityDetails(log);
                  const platform = parsePlatformInfo(log);
                  const formattedDate = formatDateTime(log.created_at);
                  const isExpanded = expandedId === String(log.id);

                  return (
                    <Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/60 dark:hover:bg-[var(--surf2)]/40 transition-colors">
                        {/* 1. User Column */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] flex-shrink-0 ${logUser.avatarBgClass} ${logUser.avatarTextClass} shadow-2xs`}>
                              {logUser.initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[13px] text-slate-900 dark:text-white truncate">
                                {logUser.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                {logUser.role}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Activity Column */}
                        <td className="py-3.5 px-4 align-top">
                          <div>
                            <div className="font-bold text-[13px] text-slate-900 dark:text-white leading-snug">
                              {activity.title}
                            </div>
                            <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                              {activity.description}
                            </div>
                            <div className="mt-1.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider border ${activity.categoryBadgeClass}`}>
                                {activity.category}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Target Column */}
                        <td className="py-3.5 px-4 align-top">
                          {activity.target ? (
                            <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-[var(--surf2)] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[var(--b)] max-w-[160px] truncate" title={activity.target}>
                              {activity.target}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium text-[12px]">—</span>
                          )}
                        </td>

                        {/* 4. Date & Time Column */}
                        <td className="py-3.5 px-4 align-top">
                          <div>
                            <div className="font-medium text-[12px] text-slate-800 dark:text-slate-200">
                              {formattedDate}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {log.time_ago || 'just now'}
                            </div>
                          </div>
                        </td>

                        {/* 5. Platform Column */}
                        <td className="py-3.5 px-4 align-top">
                          <div>
                            <div className="flex items-center gap-1.5 font-medium text-[12px] text-slate-800 dark:text-slate-200">
                              {platform.isMobile ? (
                                <Smartphone size={13} className="text-slate-500" />
                              ) : (
                                <Monitor size={13} className="text-slate-500" />
                              )}
                              <span>{platform.platform}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[150px] mt-0.5" title={platform.osBrowser}>
                              {platform.osBrowser}
                            </div>
                          </div>
                        </td>

                        {/* 6. Actions Column */}
                        <td className="py-3.5 px-4 text-right align-top">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : String(log.id))}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-xl transition-all cursor-pointer ${
                              isExpanded
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-[var(--surf2)] dark:hover:bg-[var(--surf3)] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[var(--b)]'
                            }`}
                          >
                            <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Properties Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-[var(--surf2)]/30 border-b border-slate-100 dark:border-[var(--b)]/60">
                          <td colSpan={6} className="py-2 px-3 sm:px-6">
                            <ActivityLogDetailPanel log={log} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5 — Load More pagination */}
      {logs.length < totalCount && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => {
              const nextOffset = offset + PAGE_SIZE;
              setOffset(nextOffset);
              load(false, nextOffset);
            }}
            disabled={loadingMore}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[var(--surf)] border border-slate-200/80 dark:border-[var(--b)] text-slate-700 dark:text-slate-300 rounded-xl text-[12px] font-semibold hover:bg-slate-50 dark:hover:bg-[var(--surf2)] shadow-2xs cursor-pointer disabled:opacity-50 transition-all"
          >
            {loadingMore && <Loader2 size={13} className="animate-spin text-blue-600" />}
            <span>{loadingMore ? 'Loading more...' : `Load More (${logs.length} of ${totalCount})`}</span>
          </button>
        </div>
      )}
    </div>
  );
}

