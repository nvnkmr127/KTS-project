import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, CalendarCheck, DollarSign, Bus, TrendingUp,
  BarChart2, Bell, ArrowRight,
} from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';

const weeklyData = [
  { day: 'Mon', pct: 93 },
  { day: 'Tue', pct: 89 },
  { day: 'Wed', pct: 95 },
  { day: 'Thu', pct: 88 },
  { day: 'Fri', pct: 91 },
];

const feeTrendData = [
  { month: 'Jan', collected: 72, target: 100 },
  { month: 'Feb', collected: 88, target: 100 },
  { month: 'Mar', collected: 95, target: 100 },
  { month: 'Apr', collected: 110, target: 110 },
  { month: 'May', collected: 130, target: 130 },
];

const feeStatusData = [
  { name: 'Collected', value: 79 },
  { name: 'Pending', value: 21 },
];

const activities = [
  { dot: 'var(--teal)', title: 'Diary sent — Class 8A', sub: 'Mrs. Lakshmi · 8:45 AM', badge: { label: 'Diary', v: 'teal' as const } },
  { dot: 'var(--blue)', title: '26 absent alerts sent', sub: 'WhatsApp + SMS · 8:32 AM', badge: { label: 'Alert', v: 'blue' as const } },
  { dot: 'var(--amber)', title: 'Fee reminder sent', sub: '18 defaulters · 8:00 AM', badge: { label: 'Fee', v: 'amber' as const } },
  { dot: 'var(--teal)', title: 'Bus Route 1 geofence fired', sub: 'GPS auto-alert · 7:48 AM', badge: { label: 'Bus', v: 'teal' as const } },
  { dot: 'var(--green)', title: 'New student admitted', sub: 'Class 6B · Arjun Reddy', badge: { label: 'Student', v: 'green' as const } },
];

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

export function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard
          label="Total Students"
          value={<>284</>}
          icon={<Users size={15} />}
          iconBg="var(--blue-bg)"
          iconColor="var(--blue-tx)"
          trend={{ direction: 'up', label: '+12' }}
          sub="this term"
        />
        <KPICard
          label="Today's Attendance"
          value={<>91<span className="text-[13px] font-normal text-[var(--tx3)]">%</span></>}
          sub="258 present · 26 absent"
          icon={<CalendarCheck size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
        />
        <KPICard
          label="Fee Collected"
          value={<>₹4.2<span className="text-[13px] font-normal text-[var(--tx3)]">L</span></>}
          icon={<DollarSign size={15} />}
          iconBg="var(--amber-bg)"
          iconColor="var(--amber-tx)"
          trend={{ direction: 'down', label: '₹1.1L' }}
          sub="pending"
        />
        <KPICard
          label="Buses on Route"
          value={<>3<span className="text-[13px] font-normal text-[var(--tx3)]">/4</span></>}
          sub={<Badge variant="teal">GPS live</Badge>}
          icon={<Bus size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
        />
      </div>

      {/* Row: Weekly attendance + Fee donut */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-2.5 mb-2.5">
        <Card>
          <CardHeader
            title="Weekly Attendance"
            icon={<BarChart2 size={14} />}
            action={
              <button className="text-[11px] text-[var(--blue-tx)] flex items-center gap-0.5 hover:underline cursor-pointer">
                Details <ArrowRight size={10} />
              </button>
            }
          />
          <div className="h-[148px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
                  data={feeStatusData}
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
              <span className="text-[var(--tx2)]">Collected 79%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: 'var(--red)' }} />
              <span className="text-[var(--tx2)]">Pending 21%</span>
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
              <LineChart data={feeTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
          <CardHeader title="Today's Activity" icon={<Bell size={14} />} />
          <div className="space-y-0">
            {activities.map((a, i) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 py-1.5 ${i < activities.length - 1 ? 'border-b border-[var(--b)]' : ''}`}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a.dot }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-[var(--tx)] truncate">{a.title}</div>
                  <div className="text-[10.5px] text-[var(--tx3)]">{a.sub}</div>
                </div>
                <Badge variant={a.badge.v}>{a.badge.label}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
