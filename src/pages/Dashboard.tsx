import { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, CalendarCheck, DollarSign, Bus, TrendingUp,
  BarChart2, Bell, ArrowRight, Check, Trash2, Plus, ShoppingCart, Calendar, CheckCircle
} from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import type { PageId } from '../types';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
}

type RangeType = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

// Default static activity feed items
const defaultActivities = [
  { dot: 'var(--teal)', title: 'Diary sent — Class 8A', sub: 'Mrs. Lakshmi · 8:45 AM', badge: { label: 'Diary', v: 'teal' as const } },
  { dot: 'var(--blue)', title: '26 absent alerts sent', sub: 'WhatsApp + SMS · 8:32 AM', badge: { label: 'Alert', v: 'blue' as const } },
  { dot: 'var(--amber)', title: 'Fee reminder sent', sub: '18 defaulters · 8:00 AM', badge: { label: 'Fee', v: 'amber' as const } },
  { dot: 'var(--teal)', title: 'Bus Route 1 geofence fired', sub: 'GPS auto-alert · 7:48 AM', badge: { label: 'Bus', v: 'teal' as const } },
  { dot: 'var(--green)', title: 'New student admitted', sub: 'Class 6B · Arjun Reddy', badge: { label: 'Student', v: 'green' as const } },
];

const getDaysDiff = (startStr: string, endStr: string) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return isNaN(diffDays) ? 1 : diffDays;
};

const CustomBar = (props: any) => {
  const { x, y, width, height, index } = props;
  const color = index === 3 ? 'var(--blue)' : 'var(--teal)';
  return <rect x={x} y={y} width={width} height={height} fill={color} rx={4} />;
};

const tooltipStyle = {
  backgroundColor: 'var(--surf)',
  border: '0.5px solid var(--b2)',
  borderRadius: 8,
  fontSize: 11,
  color: 'var(--tx)',
};

export function Dashboard({ onNavigate }: DashboardProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const sevenDaysAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [rangeType, setRangeType] = useState<RangeType>('today');
  const [customStartDate, setCustomStartDate] = useState(sevenDaysAgoStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  // Initialize activity feed with localStorage persistence
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('kts_dashboard_activities');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved activities:', e);
      }
    }
    return defaultActivities.map((a, i) => ({ ...a, id: i, seen: false }));
  });

  useEffect(() => {
    localStorage.setItem('kts_dashboard_activities', JSON.stringify(activities));
  }, [activities]);

  // Compute dynamic dashboard metrics and chart data based on date ranges
  const data = useMemo(() => {
    if (rangeType === 'today') {
      return {
        totalStudents: { value: 284, trend: { direction: 'up' as const, label: '+12' }, sub: 'this term' },
        attendance: { value: 91, sub: '258 present · 26 absent', trend: null },
        feeCollected: { value: '₹4.2L', sub: '₹1.1L pending', trend: { direction: 'down' as const, label: '₹1.1L' } },
        buses: { value: '3/4', sub: 'GPS live' },
        weeklyAttendance: [
          { day: 'Mon', pct: 93 },
          { day: 'Tue', pct: 89 },
          { day: 'Wed', pct: 95 },
          { day: 'Thu', pct: 88 },
          { day: 'Fri', pct: 91 },
        ],
        feeStatus: [
          { name: 'Collected', value: 79 },
          { name: 'Pending', value: 21 },
        ],
        feeStatusPercentages: { collected: 79, pending: 21 },
        feeTrend: [
          { month: 'Jan', collected: 72, target: 100 },
          { month: 'Feb', collected: 88, target: 100 },
          { month: 'Mar', collected: 95, target: 100 },
          { month: 'Apr', collected: 110, target: 110 },
          { month: 'May', collected: 130, target: 130 },
        ]
      };
    } else if (rangeType === 'yesterday') {
      return {
        totalStudents: { value: 284, trend: { direction: 'up' as const, label: '+12' }, sub: 'this term' },
        attendance: { value: 94, sub: '267 present · 17 absent', trend: null },
        feeCollected: { value: '₹0.8L', sub: '₹0.2L pending', trend: { direction: 'up' as const, label: '₹0.1L' } },
        buses: { value: '4/4', sub: 'GPS logs' },
        weeklyAttendance: [
          { day: 'Mon', pct: 92 },
          { day: 'Tue', pct: 94 },
          { day: 'Wed', pct: 93 },
          { day: 'Thu', pct: 91 },
          { day: 'Fri', pct: 89 },
        ],
        feeStatus: [
          { name: 'Collected', value: 80 },
          { name: 'Pending', value: 20 },
        ],
        feeStatusPercentages: { collected: 80, pending: 20 },
        feeTrend: [
          { month: 'Jan', collected: 70, target: 100 },
          { month: 'Feb', collected: 85, target: 100 },
          { month: 'Mar', collected: 90, target: 100 },
          { month: 'Apr', collected: 105, target: 110 },
          { month: 'May', collected: 125, target: 130 },
        ]
      };
    } else if (rangeType === 'week') {
      return {
        totalStudents: { value: 284, trend: { direction: 'up' as const, label: '+12' }, sub: 'this term' },
        attendance: { value: 91.2, sub: 'Avg: 259 present · 25 absent', trend: null },
        feeCollected: { value: '₹12.5L', sub: '₹3.4L pending', trend: { direction: 'up' as const, label: '₹3.2L' } },
        buses: { value: '3.8/4', sub: 'Weekly average' },
        weeklyAttendance: [
          { day: 'Mon', pct: 93 },
          { day: 'Tue', pct: 89 },
          { day: 'Wed', pct: 95 },
          { day: 'Thu', pct: 88 },
          { day: 'Fri', pct: 91 },
        ],
        feeStatus: [
          { name: 'Collected', value: 78 },
          { name: 'Pending', value: 22 },
        ],
        feeStatusPercentages: { collected: 78, pending: 22 },
        feeTrend: [
          { month: 'Jan', collected: 72, target: 100 },
          { month: 'Feb', collected: 88, target: 100 },
          { month: 'Mar', collected: 95, target: 100 },
          { month: 'Apr', collected: 110, target: 110 },
          { month: 'May', collected: 130, target: 130 },
        ]
      };
    } else if (rangeType === 'month') {
      return {
        totalStudents: { value: 282, trend: { direction: 'up' as const, label: '+10' }, sub: 'active this month' },
        attendance: { value: 92.5, sub: 'Avg: 261 present · 21 absent', trend: null },
        feeCollected: { value: '₹45.2L', sub: '₹8.5L pending', trend: { direction: 'up' as const, label: '₹8.2L' } },
        buses: { value: '4/4', sub: 'Stable routes' },
        weeklyAttendance: [
          { day: 'Wk 1', pct: 91 },
          { day: 'Wk 2', pct: 93 },
          { day: 'Wk 3', pct: 94 },
          { day: 'Wk 4', pct: 92 },
        ],
        feeStatus: [
          { name: 'Collected', value: 84 },
          { name: 'Pending', value: 16 },
        ],
        feeStatusPercentages: { collected: 84, pending: 16 },
        feeTrend: [
          { month: 'Jan', collected: 72, target: 100 },
          { month: 'Feb', collected: 88, target: 100 },
          { month: 'Mar', collected: 95, target: 100 },
          { month: 'Apr', collected: 110, target: 110 },
          { month: 'May', collected: 130, target: 130 },
          { month: 'Jun', collected: 145, target: 140 },
        ]
      };
    } else {
      // Custom Range calculation
      const days = getDaysDiff(customStartDate, customEndDate);
      const randFactor = (days % 5) * 0.4;
      const attVal = Math.min(99, Math.max(70, Number((91.5 + randFactor).toFixed(1))));
      const presentVal = Math.round(284 * (attVal / 100));
      const absentVal = 284 - presentVal;

      const feeVal = (days * 0.9).toFixed(1);
      const pendingVal = (days * 0.25).toFixed(1);
      const pctCollected = Math.round((Number(feeVal) / (Number(feeVal) + Number(pendingVal))) * 100) || 80;

      let customWeekly = [
        { day: 'Wk 1', pct: 92 },
        { day: 'Wk 2', pct: 90 },
        { day: 'Wk 3', pct: 94 },
      ];
      if (days <= 7) {
        customWeekly = [
          { day: 'Start', pct: 90 },
          { day: 'Mid', pct: 93 },
          { day: 'End', pct: 91 },
        ];
      }

      return {
        totalStudents: { value: 284, trend: { direction: 'up' as const, label: '+12' }, sub: 'active in range' },
        attendance: { value: attVal, sub: `${presentVal} present · ${absentVal} absent (avg)`, trend: null },
        feeCollected: { value: `₹${feeVal}L`, sub: `₹${pendingVal}L pending`, trend: { direction: 'up' as const, label: `₹${(days * 0.7).toFixed(1)}L` } },
        buses: { value: '3.9/4', sub: 'Average tracker' },
        weeklyAttendance: customWeekly,
        feeStatus: [
          { name: 'Collected', value: pctCollected },
          { name: 'Pending', value: 100 - pctCollected },
        ],
        feeStatusPercentages: { collected: pctCollected, pending: 100 - pctCollected },
        feeTrend: [
          { month: 'Range', collected: Number(feeVal), target: Number(feeVal) + Number(pendingVal) }
        ]
      };
    }
  }, [rangeType, customStartDate, customEndDate]);

  // Activity feed action handlers
  const handleMarkSeen = (id: number) => {
    setActivities((prev: any[]) =>
      prev.map((a: { id: number; }) => (a.id === id ? { ...a, seen: true } : a))
    );
  };

  const handleClearActivity = (id: number) => {
    setActivities((prev: any[]) => prev.filter((a: { id: number; }) => a.id !== id));
  };

  const handleMarkAllSeen = () => {
    setActivities((prev: any[]) => prev.map((a: any) => ({ ...a, seen: true })));
  };

  const handleClearAll = () => {
    setActivities([]);
  };

  const unreadCount = activities.filter((a: { seen: any; }) => !a.seen).length;

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {/* Header & Date Range Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3.5 border-b border-[var(--b)] pb-3">
        <div>
          <h1 className="text-[16px] font-bold text-[var(--tx)] leading-none mb-1.5">Overview Dashboard</h1>
          <p className="text-[11px] text-[var(--tx3)]">Welcome back, Administrator. Real-time statistics and analytics for today.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <div className="flex items-center bg-[var(--surf)] border border-[var(--b2)] rounded-lg p-0.5 shadow-sm">
            {(['today', 'yesterday', 'week', 'month', 'custom'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRangeType(r)}
                className={`px-2.5 py-1 text-[11px] font-semibold capitalize rounded-md transition-all cursor-pointer ${rangeType === r
                    ? 'bg-[var(--blue)] text-white shadow-sm'
                    : 'text-[var(--tx2)] hover:bg-[var(--surf2)] hover:text-[var(--tx)]'
                  }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {rangeType === 'custom' && (
            <div className="flex items-center gap-1.5 animate-fadeIn bg-[var(--surf)] border border-[var(--b2)] rounded-lg px-2 py-1 shadow-sm">
              <Calendar size={11} className="text-[var(--tx3)]" />
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-transparent border-0 text-[11px] text-[var(--tx)] outline-none cursor-pointer"
              />
              <span className="text-[10px] text-[var(--tx3)] font-medium">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-transparent border-0 text-[11px] text-[var(--tx)] outline-none cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Control Deck */}
      <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-3.5 mb-3.5 relative overflow-hidden">
        <div className="text-[10.5px] font-bold text-[var(--tx3)] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <TrendingUp size={12} className="text-[var(--blue)]" /> Quick Controls
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <button
            onClick={() => onNavigate('attendance')}
            className="flex items-center justify-center sm:justify-start gap-2.5 p-2.5 bg-[var(--teal-bg)] hover:bg-[var(--teal)] text-[var(--teal-tx)] hover:text-white rounded-xl border border-[var(--teal)]/10 font-semibold text-[12px] cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.98] group"
          >
            <span className="p-1.5 rounded-lg bg-white/60 dark:bg-black/20 text-[var(--teal-tx)] group-hover:bg-white/20 group-hover:text-white transition-all">
              <CalendarCheck size={13} />
            </span>
            <span>Mark Attendance</span>
          </button>

          <button
            onClick={() => onNavigate('fee')}
            className="flex items-center justify-center sm:justify-start gap-2.5 p-2.5 bg-[var(--amber-bg)] hover:bg-[var(--amber)] text-[var(--amber-tx)] hover:text-white rounded-xl border border-[var(--amber)]/10 font-semibold text-[12px] cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.98] group"
          >
            <span className="p-1.5 rounded-lg bg-white/60 dark:bg-black/20 text-[var(--amber-tx)] group-hover:bg-white/20 group-hover:text-white transition-all">
              <DollarSign size={13} />
            </span>
            <span>Collect Fee</span>
          </button>

          <button
            onClick={() => onNavigate('expenses')}
            className="flex items-center justify-center sm:justify-start gap-2.5 p-2.5 bg-[var(--red-bg)] hover:bg-[var(--red)] text-[var(--red-tx)] hover:text-white rounded-xl border border-[var(--red)]/10 font-semibold text-[12px] cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.98] group"
          >
            <span className="p-1.5 rounded-lg bg-white/60 dark:bg-black/20 text-[var(--red-tx)] group-hover:bg-white/20 group-hover:text-white transition-all">
              <ShoppingCart size={13} />
            </span>
            <span>Record Expense</span>
          </button>

          <button
            onClick={() => onNavigate('students')}
            className="flex items-center justify-center sm:justify-start gap-2.5 p-2.5 bg-[var(--blue-bg)] hover:bg-[var(--blue)] text-[var(--blue-tx)] hover:text-white rounded-xl border border-[var(--blue)]/10 font-semibold text-[12px] cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.98] group"
          >
            <span className="p-1.5 rounded-lg bg-white/60 dark:bg-black/20 text-[var(--blue-tx)] group-hover:bg-white/20 group-hover:text-white transition-all">
              <Plus size={13} />
            </span>
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard
          label="Total Students"
          value={<>{data.totalStudents.value}</>}
          icon={<Users size={15} />}
          iconBg="var(--blue-bg)"
          iconColor="var(--blue-tx)"
          trend={data.totalStudents.trend}
          sub={data.totalStudents.sub}
          onClick={() => onNavigate('students')}
        />
        <KPICard
          label="Attendance Rate"
          value={<>{data.attendance.value}<span className="text-[13px] font-normal text-[var(--tx3)]">%</span></>}
          sub={data.attendance.sub}
          icon={<CalendarCheck size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
          onClick={() => onNavigate('attendance')}
        />
        <KPICard
          label="Fee Collected"
          value={<>{data.feeCollected.value}</>}
          icon={<DollarSign size={15} />}
          iconBg="var(--amber-bg)"
          iconColor="var(--amber-tx)"
          trend={data.feeCollected.trend}
          sub={data.feeCollected.sub}
          onClick={() => onNavigate('fee')}
        />
        <KPICard
          label="Buses on Route"
          value={<>{data.buses.value}</>}
          sub={<Badge variant="teal">{data.buses.sub}</Badge>}
          icon={<Bus size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
          onClick={() => onNavigate('bus')}
        />
      </div>

      {/* Row: Weekly attendance + Fee donut */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-2.5 mb-2.5">
        <Card>
          <CardHeader
            title={rangeType === 'month' ? "Weekly Attendance (Monthly View)" : "Weekly Attendance"}
            icon={<BarChart2 size={14} />}
            action={
              <button
                onClick={() => onNavigate('attendance')}
                className="text-[11px] text-[var(--blue-tx)] flex items-center gap-0.5 hover:underline cursor-pointer font-semibold"
              >
                Details <ArrowRight size={10} />
              </button>
            }
          />
          <div className="h-[148px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyAttendance} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--b)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Attendance']} cursor={{ fill: 'var(--surf2)' }} />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]} shape={<CustomBar />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Fee Status" icon={<DollarSign size={14} />} />
          <div className="h-[110px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.feeStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={52}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill="var(--teal)" />
                  <Cell fill="var(--red)" />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-1 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: 'var(--teal)' }} />
              <span className="text-[var(--tx2)] font-medium">Collected {data.feeStatusPercentages.collected}%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: 'var(--red)' }} />
              <span className="text-[var(--tx2)] font-medium">Pending {data.feeStatusPercentages.pending}%</span>
            </span>
          </div>
        </Card>
      </div>

      {/* Row: Fee trend + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        <Card>
          <CardHeader title="Fee Trend — Term 2" icon={<TrendingUp size={14} />} />
          <div className="h-[130px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.feeTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--b)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [`₹${v}k`, name === 'collected' ? 'Collected' : 'Target']} />
                <Line type="monotone" dataKey="collected" stroke="var(--teal)" strokeWidth={2} dot={{ r: 3, fill: 'var(--teal)' }} />
                <Line type="monotone" dataKey="target" stroke="var(--amber)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Today's Activity"
            icon={<Bell size={14} />}
            action={
              activities.length > 0 ? (
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllSeen}
                      className="text-[10px] text-[var(--blue-tx)] bg-[var(--blue-bg)] px-2 py-0.5 rounded border border-[var(--blue)]/15 font-semibold hover:bg-[var(--blue)] hover:text-white transition-all cursor-pointer"
                    >
                      Mark Seen
                    </button>
                  )}
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] text-[var(--red-tx)] bg-[var(--red-bg)] px-2 py-0.5 rounded border border-[var(--red)]/15 font-semibold hover:bg-[var(--red)] hover:text-white transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              ) : undefined
            }
          />
          <div className="space-y-0">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-9 text-center">
                <CheckCircle className="text-[var(--teal)] mb-2 animate-bounce" size={24} />
                <div className="text-[12px] font-bold text-[var(--tx)]">All Caught Up!</div>
                <div className="text-[10px] text-[var(--tx3)] mt-0.5">No recent system events to review.</div>
              </div>
            ) : (
              activities.map((a: any, i: number) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-2.5 py-2 border-b border-[var(--b)] last:border-0 transition-all duration-300 group ${a.seen ? 'opacity-55 hover:opacity-85' : ''
                    }`}
                >
                  {/* Status Indicator */}
                  {a.seen ? (
                    <span className="text-[var(--tx3)] flex-shrink-0 w-3 h-3 flex items-center justify-center">
                      <Check size={10} className="text-gray-400" />
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a.dot }} />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-[12px] font-medium text-[var(--tx)] truncate ${a.seen ? 'line-through decoration-[var(--tx3)]' : ''}`}>
                      {a.title}
                    </div>
                    <div className="text-[10.5px] text-[var(--tx3)]">{a.sub}</div>
                  </div>

                  {/* Badges / Seen Tags */}
                  <div className="flex items-center gap-1.5">
                    <Badge variant={a.badge.v}>{a.badge.label}</Badge>

                    {/* Seen Indicator Badge */}
                    {a.seen && (
                      <span className="text-[8px] bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 font-bold px-1 py-0.5 rounded">
                        seen
                      </span>
                    )}
                  </div>

                  {/* Hover Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0">
                    {!a.seen && (
                      <button
                        onClick={() => handleMarkSeen(a.id)}
                        className="p-1 text-[var(--teal-tx)] hover:bg-[var(--teal-bg)] rounded-lg transition-colors cursor-pointer"
                        title="Mark seen"
                      >
                        <Check size={11} />
                      </button>
                    )}
                    <button
                      onClick={() => handleClearActivity(a.id)}
                      className="p-1 text-[var(--red-tx)] hover:bg-[var(--red-bg)] rounded-lg transition-colors cursor-pointer"
                      title="Clear activity"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
