import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { CheckCircle, Clock, Users, FileText, Download, Plus, Search } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
import { TabBar } from '../components/ui';

const students = [
  { n: 1, name: 'Arjun Reddy', init: 'AR', cls: '6B', fee: 8500, paid: 8500, bal: 0, status: 'Paid' as const },
  { n: 2, name: 'Priya Sharma', init: 'PS', cls: '8A', fee: 9200, paid: 9200, bal: 0, status: 'Paid' as const },
  { n: 3, name: 'Ravi Kumar', init: 'RK', cls: '9A', fee: 10000, paid: 5000, bal: 5000, status: 'Partial' as const },
  { n: 4, name: 'Meena Nair', init: 'MN', cls: '7B', fee: 8500, paid: 0, bal: 8500, status: 'Unpaid' as const },
  { n: 5, name: 'Suresh K', init: 'SK', cls: '10A', fee: 11000, paid: 11000, bal: 0, status: 'Paid' as const },
];

const avatarColors: Record<string, { bg: string; color: string }> = {
  AR: { bg: 'var(--purple-bg)', color: 'var(--purple-tx)' },
  PS: { bg: 'var(--teal-bg)', color: 'var(--teal-tx)' },
  RK: { bg: 'var(--amber-bg)', color: 'var(--amber-tx)' },
  MN: { bg: 'var(--red-bg)', color: 'var(--red-tx)' },
  SK: { bg: 'var(--blue-bg)', color: 'var(--blue-tx)' },
};

const statusBadge = (s: 'Paid' | 'Partial' | 'Unpaid') => {
  if (s === 'Paid') return <Badge variant="teal">Paid</Badge>;
  if (s === 'Partial') return <Badge variant="amber">Partial</Badge>;
  return <Badge variant="red">Unpaid</Badge>;
};

const actionLabel = (s: 'Paid' | 'Partial' | 'Unpaid') => {
  if (s === 'Paid') return 'Receipt';
  if (s === 'Partial') return 'Collect';
  return 'Remind';
};

const classData = [
  { cls: 'Class 6', pct: 95 },
  { cls: 'Class 7', pct: 88 },
  { cls: 'Class 8', pct: 72 },
  { cls: 'Class 9', pct: 91 },
  { cls: 'Class 10', pct: 84 },
];

const CustomBar2 = (props: any) => {
  const { x, y, width, height, index } = props;
  const color = index === 2 ? 'var(--amber)' : 'var(--teal)';
  return <rect x={x} y={y} width={width} height={height} fill={color} rx={4} />;
};

const tooltipStyle = {
  backgroundColor: 'var(--surf)',
  border: '0.5px solid var(--b2)',
  borderRadius: 8,
  fontSize: 11,
  color: 'var(--tx)',
};

export function FeeManagement() {
  const [tab, setTab] = useState(0);

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard
          label="Total Collected"
          value="₹4.2L"
          sub="Term 2 · 2026"
          icon={<CheckCircle size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
        />
        <KPICard
          label="Pending"
          value="₹1.1L"
          sub="18 students"
          icon={<Clock size={15} />}
          iconBg="var(--red-bg)"
          iconColor="var(--red-tx)"
        />
        <KPICard
          label="Paid Students"
          value="266"
          sub="Out of 284"
          icon={<Users size={15} />}
          iconBg="var(--amber-bg)"
          iconColor="var(--amber-tx)"
        />
        <KPICard
          label="Receipts Today"
          value="12"
          sub="₹48,000 collected"
          icon={<FileText size={15} />}
          iconBg="var(--blue-bg)"
          iconColor="var(--blue-tx)"
        />
      </div>

      <Card className="mb-2.5">
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center mb-3">
          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--tx)]">
            Fee Collection — Term 2
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-2.5 py-1 text-[11px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg text-[var(--tx)] hover:bg-[var(--surf3)] transition-colors cursor-pointer">
              <Download size={11} /> Export
            </button>
            <button className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-[var(--blue)] text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
              <Plus size={11} /> Record payment
            </button>
          </div>
        </div>

        <TabBar
          tabs={['All Students', 'Paid', 'Pending', 'Defaulters']}
          active={tab}
          onChange={setTab}
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx3)]">
            <Search size={12} /> Search student...
          </div>
          <select className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] w-full sm:w-28 cursor-pointer">
            <option>All classes</option>
            <option>Class 6</option>
            <option>Class 7</option>
          </select>
          <select className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] w-full sm:w-24 cursor-pointer">
            <option>Term 2</option>
            <option>Term 1</option>
            <option>Term 3</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] min-w-[700px]">
            <thead>
              <tr>
                {['#', 'Student Name', 'Class', 'Term Fee', 'Paid', 'Balance', 'Status', 'Action'].map((h) => (
                  <th key={h} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-1.5 border-b border-[var(--b)] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.n} className="hover:bg-[var(--surf2)] transition-colors group">
                  <td className="px-2 py-2 text-[var(--tx3)]">{s.n}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar initials={s.init} bg={avatarColors[s.init].bg} color={avatarColors[s.init].color} />
                      <span className="font-medium text-[var(--tx)]">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-[var(--tx2)]">{s.cls}</td>
                  <td className="px-2 py-2 text-[var(--tx)]">₹{s.fee.toLocaleString()}</td>
                  <td className="px-2 py-2 text-[var(--teal-tx)] font-medium">₹{s.paid.toLocaleString()}</td>
                  <td className="px-2 py-2 text-[var(--tx)]">
                    {s.bal > 0 ? (
                      <span className="text-[var(--red-tx)] font-medium">₹{s.bal.toLocaleString()}</span>
                    ) : (
                      <span className="text-[var(--tx3)]">₹0</span>
                    )}
                  </td>
                  <td className="px-2 py-2">{statusBadge(s.status)}</td>
                  <td className="px-2 py-2">
                    <button className="text-[11px] text-[var(--blue-tx)] hover:underline cursor-pointer">
                      {actionLabel(s.status)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Class-wise Collection Progress" />
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classData} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--b)" />
              <XAxis dataKey="cls" tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Collected']} cursor={{ fill: 'var(--surf2)' }} />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]} shape={<CustomBar2 />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
