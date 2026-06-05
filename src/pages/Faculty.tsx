import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { BadgeIcon, CheckCircle, XCircle, Wallet, Lock, Plus } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';

const faculty = [
  { name: 'Mrs. Lakshmi', init: 'LK', subject: 'Maths', classes: '8A, 8B', att: 96, present: true },
  { name: 'Mr. Venkat', init: 'VR', subject: 'Science', classes: '6A, 6B', att: 92, present: true },
  { name: 'Mrs. Suma', init: 'SM', subject: 'English', classes: '9A, 9B', att: 88, present: false },
  { name: 'Mr. Raju', init: 'RG', subject: 'Telugu', classes: '7A, 7B', att: 94, present: true },
  { name: 'Mr. Ajay', init: 'AJ', subject: 'Social', classes: '10A, 10B', att: 90, present: true },
];

const avatarColors: Record<string, { bg: string; color: string }> = {
  LK: { bg: 'var(--purple-bg)', color: 'var(--purple-tx)' },
  VR: { bg: 'var(--blue-bg)', color: 'var(--blue-tx)' },
  SM: { bg: 'var(--red-bg)', color: 'var(--red-tx)' },
  RG: { bg: 'var(--amber-bg)', color: 'var(--amber-tx)' },
  AJ: { bg: 'var(--green-bg)', color: 'var(--green-tx)' },
};

const salaryData = [
  { dept: 'Science', amt: 62 },
  { dept: 'Maths', amt: 58 },
  { dept: 'English', amt: 55 },
  { dept: 'Telugu', amt: 48 },
  { dept: 'Social', amt: 45 },
];

const barColors = ['var(--purple)', 'var(--blue)', 'var(--teal)', 'var(--amber)', 'var(--coral)'];

const CustomBar = (props: any) => {
  const { x, y, width, height, index } = props;
  return <rect x={x} y={y} width={width} height={height} fill={barColors[index] || 'var(--blue)'} rx={4} />;
};

const tooltipStyle = {
  backgroundColor: 'var(--surf)',
  border: '0.5px solid var(--b2)',
  borderRadius: 8,
  fontSize: 11,
  color: 'var(--tx)',
};

export function Faculty() {
  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard
          label="Total Faculty"
          value="22"
          sub="All departments"
          icon={<BadgeIcon size={15} />}
          iconBg="var(--purple-bg)"
          iconColor="var(--purple-tx)"
        />
        <KPICard
          label="Present Today"
          value="20"
          sub=""
          icon={<CheckCircle size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
          trend={{ direction: 'up', label: '91%' }}
        />
        <KPICard
          label="Absent Today"
          value="2"
          sub="On approved leave"
          icon={<XCircle size={15} />}
          iconBg="var(--red-bg)"
          iconColor="var(--red-tx)"
        />
        <KPICard
          label="Monthly Payroll"
          value="₹3.8L"
          sub="Due end of month"
          icon={<Wallet size={15} />}
          iconBg="var(--amber-bg)"
          iconColor="var(--amber-tx)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12.5px] font-semibold text-[var(--tx)]">Faculty List</div>
            <button className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-[var(--blue)] text-white rounded-lg hover:opacity-90 cursor-pointer">
              <Plus size={11} /> Add Faculty
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px] min-w-[450px]">
              <thead>
                <tr>
                  {['Name', 'Subject', 'Class', 'Attendance', 'Status'].map((h) => (
                    <th key={h} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-1.5 border-b border-[var(--b)] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {faculty.map((f) => (
                  <tr key={f.init} className="hover:bg-[var(--surf2)] transition-colors">
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar initials={f.init} bg={avatarColors[f.init].bg} color={avatarColors[f.init].color} />
                        <span className="font-medium text-[var(--tx)] whitespace-nowrap">{f.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-[var(--tx2)] whitespace-nowrap">{f.subject}</td>
                    <td className="px-2 py-2 text-[var(--tx2)] whitespace-nowrap">{f.classes}</td>
                    <td className="px-2 py-2">
                      <span className={`font-medium ${f.att >= 90 ? 'text-[var(--teal-tx)]' : 'text-[var(--amber-tx)]'}`}>
                        {f.att}%
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      {f.present ? <Badge variant="teal">Present</Badge> : <Badge variant="red">Absent</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12.5px] font-semibold text-[var(--tx)]">Payroll Summary</div>
            <Badge variant="gray">Admin only</Badge>
          </div>

          <div className="h-[148px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salaryData}
                layout="vertical"
                barSize={14}
                margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke="var(--b)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: 'var(--tx3)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}k`}
                />
                <YAxis
                  dataKey="dept"
                  type="category"
                  tick={{ fontSize: 10, fill: 'var(--tx3)' }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${v}k`, 'Salary']} cursor={{ fill: 'var(--surf2)' }} />
                <Bar dataKey="amt" radius={[0, 4, 4, 0]} shape={<CustomBar />} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 p-2.5 bg-[var(--amber-bg)] rounded-xl flex items-center gap-2">
            <Lock size={14} className="text-[var(--amber-tx)] flex-shrink-0" />
            <span className="text-[11.5px] text-[var(--amber-tx)]">
              Salary details visible to admin & principal only
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
