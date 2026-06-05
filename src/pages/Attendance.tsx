import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { CheckCircle, XCircle, BarChart2, AlertTriangle, Save } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar, ProgressBar } from '../components/ui';

const students = [
  { name: 'Priya Sharma', init: 'PS', present: true },
  { name: 'Kiran Rao', init: 'KR', present: false },
  { name: 'Ananya Singh', init: 'AS', present: true },
  { name: 'Vikram K', init: 'VK', present: true },
  { name: 'Sana Fatima', init: 'SF', present: true },
];

const monthlyData = [
  { month: 'Jan', pct: 90 },
  { month: 'Feb', pct: 88 },
  { month: 'Mar', pct: 93 },
  { month: 'Apr', pct: 91 },
  { month: 'May', pct: 92 },
];

const classOverview = [
  { cls: 'Class 6', pct: 94, color: 'var(--teal)' },
  { cls: 'Class 7', pct: 89, color: 'var(--teal)' },
  { cls: 'Class 8', pct: 82, color: 'var(--amber)' },
  { cls: 'Class 9', pct: 96, color: 'var(--teal)' },
  { cls: 'Class 10', pct: 91, color: 'var(--teal)' },
];

const avatarColors: Record<string, { bg: string; color: string }> = {
  PS: { bg: 'var(--teal-bg)', color: 'var(--teal-tx)' },
  KR: { bg: 'var(--red-bg)', color: 'var(--red-tx)' },
  AS: { bg: 'var(--teal-bg)', color: 'var(--teal-tx)' },
  VK: { bg: 'var(--teal-bg)', color: 'var(--teal-tx)' },
  SF: { bg: 'var(--blue-bg)', color: 'var(--blue-tx)' },
};

const tooltipStyle = {
  backgroundColor: 'var(--surf)',
  border: '0.5px solid var(--b2)',
  borderRadius: 8,
  fontSize: 11,
  color: 'var(--tx)',
};

export function Attendance() {
  const [attendance, setAttendance] = useState(
    students.map((s) => ({ ...s }))
  );

  const toggle = (i: number) => {
    setAttendance((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, present: !s.present } : s))
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard
          label="Present Today"
          value="258"
          sub="Out of 284"
          icon={<CheckCircle size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
        />
        <KPICard
          label="Absent Today"
          value="26"
          sub="Alerts sent via WA+SMS"
          icon={<XCircle size={15} />}
          iconBg="var(--red-bg)"
          iconColor="var(--red-tx)"
        />
        <KPICard
          label="Monthly Avg"
          value={<>92<span className="text-[13px] font-normal text-[var(--tx3)]">%</span></>}
          sub="May 2026"
          icon={<BarChart2 size={15} />}
          iconBg="var(--blue-bg)"
          iconColor="var(--blue-tx)"
        />
        <KPICard
          label="Low Attendance"
          value="8"
          sub="Below 75% this month"
          icon={<AlertTriangle size={15} />}
          iconBg="var(--amber-bg)"
          iconColor="var(--amber-tx)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mb-2.5">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12.5px] font-semibold text-[var(--tx)]">Mark Attendance — Class 8A</div>
            <button className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-[var(--blue)] text-white rounded-lg hover:opacity-90 cursor-pointer">
              <Save size={11} /> Save
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px] min-w-[320px]">
              <thead>
                <tr>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-1.5 border-b border-[var(--b)]">Student</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-1.5 border-b border-[var(--b)] w-24">Status</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-1.5 border-b border-[var(--b)] w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((s, i) => (
                  <tr key={i} className="hover:bg-[var(--surf2)] transition-colors">
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar initials={s.init} bg={avatarColors[s.init].bg} color={avatarColors[s.init].color} />
                        <span className="font-medium text-[var(--tx)]">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      {s.present ? <Badge variant="teal">Present</Badge> : <Badge variant="red">Absent</Badge>}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => toggle(i)}
                        className="text-[11px] text-[var(--blue-tx)] hover:underline cursor-pointer"
                      >
                        Toggle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 pt-3 border-t border-[var(--b)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] flex-shrink-0" />
            <span className="text-[11px] text-[var(--tx3)]">
              Absent alerts will auto-send via WhatsApp + SMS on save
            </span>
          </div>
        </Card>

        <Card>
          <CardHeader title="Monthly Attendance" />
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--b)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Attendance']} />
                <Line type="monotone" dataKey="pct" stroke="var(--blue)" strokeWidth={2} dot={{ r: 3, fill: 'var(--blue)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Class-wise Today at a Glance" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {classOverview.map((c) => (
            <div
              key={c.cls}
              className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-2.5 text-center"
            >
              <div className="text-[11px] font-semibold text-[var(--tx)] mb-1">{c.cls}</div>
              <div className="text-[18px] font-semibold mb-1.5" style={{ color: c.color }}>
                {c.pct}%
              </div>
              <ProgressBar value={c.pct} color={c.color} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
