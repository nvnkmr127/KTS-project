import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { FileText, BarChart2, Database, Download, CalendarCheck, Wallet } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card, CardHeader } from '../components/Card';

const termData = [
  { cls: 'Class 6', t1: 95, t2: 88, t3: 0 },
  { cls: 'Class 7', t1: 92, t2: 85, t3: 0 },
  { cls: 'Class 8', t1: 88, t2: 72, t3: 0 },
  { cls: 'Class 9', t1: 94, t2: 91, t3: 0 },
  { cls: 'Class 10', t1: 90, t2: 84, t3: 0 },
];

const attPieData = [
  { name: 'LKG–2nd', value: 95, color: 'var(--purple)' },
  { name: '3rd–5th', value: 91, color: 'var(--blue)' },
  { name: '6th–8th', value: 89, color: 'var(--teal)' },
  { name: '9th–10th', value: 92, color: 'var(--coral)' },
];

const exports = [
  { label: 'Fee Report', sub: 'PDF · Excel', icon: <Wallet size={14} />, iconBg: 'var(--teal-bg)', iconColor: 'var(--teal-tx)' },
  { label: 'Attendance', sub: 'Class-wise', icon: <CalendarCheck size={14} />, iconBg: 'var(--blue-bg)', iconColor: 'var(--blue-tx)' },
  { label: 'Payroll Sheet', sub: 'Admin only', icon: <Wallet size={14} />, iconBg: 'var(--amber-bg)', iconColor: 'var(--amber-tx)' },
  { label: 'Diary Report', sub: 'Weekly', icon: <FileText size={14} />, iconBg: 'var(--purple-bg)', iconColor: 'var(--purple-tx)' },
  { label: 'Bus Report', sub: 'GPS logs', icon: <BarChart2 size={14} />, iconBg: 'var(--green-bg)', iconColor: 'var(--green-tx)' },
  { label: 'Annual Report', sub: 'Full summary', icon: <Database size={14} />, iconBg: 'var(--coral-bg)', iconColor: 'var(--coral-tx)' },
];

const tooltipStyle = {
  backgroundColor: 'var(--surf)',
  border: '0.5px solid var(--b2)',
  borderRadius: 8,
  fontSize: 11,
  color: 'var(--tx)',
};

export function Reports() {
  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        <KPICard
          label="Reports Generated"
          value="48"
          sub="This month"
          icon={<FileText size={15} />}
          iconBg="var(--blue-bg)"
          iconColor="var(--blue-tx)"
        />
        <KPICard
          label="Last Export"
          value={<span className="text-[14px]">Today</span>}
          sub="Fee collection · PDF"
          icon={<BarChart2 size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
        />
        <KPICard
          label="Data Points"
          value="12k+"
          sub="Term 2 records"
          icon={<Database size={15} />}
          iconBg="var(--purple-bg)"
          iconColor="var(--purple-tx)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mb-2.5">
        <Card>
          <CardHeader title="Term-wise Fee Collection" />
          <div className="h-[158px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={termData} barSize={10} barGap={2} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--b)" />
                <XAxis dataKey="cls" tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="t1" name="Term 1" fill="var(--teal)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="t2" name="Term 2" fill="var(--blue)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="t3" name="Term 3" fill="var(--amber)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Attendance by Class Group" />
          <div className="h-[128px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={56}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {attPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [`${v}%`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 text-[11px]">
            {attPieData.map((d) => (
              <span key={d.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                <span className="text-[var(--tx2)]">{d.name} · {d.value}%</span>
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Quick Exports" icon={<Download size={14} />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {exports.map((e) => (
            <button
              key={e.label}
              className="flex items-center gap-2.5 p-2.5 bg-[var(--surf2)] border border-[var(--b)] rounded-xl hover:bg-[var(--surf3)] transition-colors cursor-pointer text-left font-medium"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: e.iconBg, color: e.iconColor }}
              >
                {e.icon}
              </div>
              <div>
                <div className="text-[12px] font-semibold text-[var(--tx)]">{e.label}</div>
                <div className="text-[10.5px] text-[var(--tx3)]">{e.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
