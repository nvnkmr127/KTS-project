import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Download, Plus, Wallet, TrendingUp, Users, FileText, X, Printer } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';

interface StaffPayroll {
  id: string;
  name: string;
  init: string;
  designation: string;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  gross: number;
  net: number;
  status: 'Paid' | 'Pending' | 'On Hold';
  month: string;
}

const PAYROLL: StaffPayroll[] = [
  { id: '1', name: 'Mrs. Lakshmi Devi', init: 'LD', designation: 'Senior Teacher', basic: 40000, hra: 12000, allowances: 10000, deductions: 4200, gross: 62000, net: 57800, status: 'Paid', month: 'May 2026' },
  { id: '2', name: 'Mr. Venkat Rao', init: 'VR', designation: 'Teacher', basic: 36000, hra: 10800, allowances: 11200, deductions: 3780, gross: 58000, net: 54220, status: 'Paid', month: 'May 2026' },
  { id: '3', name: 'Mrs. Suma Reddy', init: 'SR', designation: 'Teacher', basic: 34000, hra: 10200, allowances: 10800, deductions: 3570, gross: 55000, net: 51430, status: 'Pending', month: 'May 2026' },
  { id: '4', name: 'Mr. Raju Sharma', init: 'RS', designation: 'Teacher', basic: 30000, hra: 9000, allowances: 9000, deductions: 3150, gross: 48000, net: 44850, status: 'Paid', month: 'May 2026' },
  { id: '5', name: 'Mrs. Savitha Kumar', init: 'SK', designation: 'Teacher', basic: 28000, hra: 8400, allowances: 8600, deductions: 2940, gross: 45000, net: 42060, status: 'Paid', month: 'May 2026' },
  { id: '6', name: 'Mr. Prakash Nair', init: 'PN', designation: 'PT Teacher', basic: 25000, hra: 7500, allowances: 7500, deductions: 2625, gross: 40000, net: 37375, status: 'On Hold', month: 'May 2026' },
];

const AVATAR_COLORS: Record<string, { bg: string; color: string }> = {
  LD: { bg: 'var(--purple-bg)', color: 'var(--purple-tx)' },
  VR: { bg: 'var(--blue-bg)', color: 'var(--blue-tx)' },
  SR: { bg: 'var(--red-bg)', color: 'var(--red-tx)' },
  RS: { bg: 'var(--amber-bg)', color: 'var(--amber-tx)' },
  SK: { bg: 'var(--teal-bg)', color: 'var(--teal-tx)' },
  PN: { bg: 'var(--green-bg)', color: 'var(--green-tx)' },
};

const trendData = [
  { month: 'Jan', amount: 3.6 },
  { month: 'Feb', amount: 3.7 },
  { month: 'Mar', amount: 3.8 },
  { month: 'Apr', amount: 3.8 },
  { month: 'May', amount: 3.8 },
];

const tooltipStyle = { backgroundColor: 'var(--surf)', border: '0.5px solid var(--b2)', borderRadius: 8, fontSize: 11, color: 'var(--tx)' };

export function Salary() {
  const [selectedSlip, setSelectedSlip] = useState<StaffPayroll | null>(null);
  const [month, setMonth] = useState('May 2026');

  const totalGross = PAYROLL.reduce((s, p) => s + p.gross, 0);
  const totalNet = PAYROLL.reduce((s, p) => s + p.net, 0);
  const totalDeductions = PAYROLL.reduce((s, p) => s + p.deductions, 0);
  const paid = PAYROLL.filter((p) => p.status === 'Paid').length;

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="Gross Payroll" value={`₹${(totalGross / 100000).toFixed(2)}L`} sub="May 2026" icon={<Wallet size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Net Payroll" value={`₹${(totalNet / 100000).toFixed(2)}L`} sub="After deductions" icon={<TrendingUp size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Total Deductions" value={`₹${totalDeductions.toLocaleString()}`} sub="PF, Tax, etc." icon={<FileText size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
        <KPICard label="Payments Done" value={`${paid}/${PAYROLL.length}`} sub="Staff paid this month" icon={<Users size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-2.5 mb-2.5">
        <Card>
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center mb-4">
            <div className="text-[13px] font-semibold text-[var(--tx)]">Monthly Payroll — {month}</div>
            <div className="flex gap-2">
              <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[11.5px] text-[var(--tx)] cursor-pointer outline-none">
                {['May 2026', 'Apr 2026', 'Mar 2026', 'Feb 2026'].map((m) => <option key={m}>{m}</option>)}
              </select>
              <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg cursor-pointer hover:bg-[var(--surf3)]">
                <Download size={11} /> Export
              </button>
              <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90">
                <Plus size={11} /> Process Payroll
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px] min-w-[700px]">
              <thead>
                <tr className="border-b border-[var(--b)]">
                  {['Staff', 'Basic', 'HRA', 'Allowances', 'Deductions', 'Net Pay', 'Status', ''].map((h) => (
                    <th key={h} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PAYROLL.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] transition-colors last:border-0">
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar initials={p.init} bg={AVATAR_COLORS[p.init]?.bg ?? 'var(--surf3)'} color={AVATAR_COLORS[p.init]?.color ?? 'var(--tx2)'} />
                        <div>
                          <div className="font-semibold text-[var(--tx)]">{p.name}</div>
                          <div className="text-[10.5px] text-[var(--tx3)]">{p.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-[var(--tx2)]">₹{p.basic.toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-[var(--tx2)]">₹{p.hra.toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-[var(--tx2)]">₹{p.allowances.toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-[var(--red-tx)]">-₹{p.deductions.toLocaleString()}</td>
                    <td className="px-2 py-2.5 font-semibold text-[var(--tx)]">₹{p.net.toLocaleString()}</td>
                    <td className="px-2 py-2.5">
                      {p.status === 'Paid' && <Badge variant="teal">Paid</Badge>}
                      {p.status === 'Pending' && <Badge variant="amber">Pending</Badge>}
                      {p.status === 'On Hold' && <Badge variant="red">On Hold</Badge>}
                    </td>
                    <td className="px-2 py-2.5">
                      <button onClick={() => setSelectedSlip(p)} className="text-[11px] text-[var(--blue-tx)] hover:underline cursor-pointer flex items-center gap-0.5">
                        <FileText size={11} /> Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="text-[12.5px] font-semibold text-[var(--tx)] mb-3">Payroll Trend</div>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barSize={24} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--b)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `₹${v}L`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${v}L`, 'Payroll']} cursor={{ fill: 'var(--surf2)' }} />
                <Bar dataKey="amount" fill="var(--blue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              { label: 'Gross Payroll', value: `₹${(totalGross / 100000).toFixed(2)}L`, color: 'var(--blue)' },
              { label: 'Total Deductions', value: `₹${(totalDeductions / 100000).toFixed(2)}L`, color: 'var(--red)' },
              { label: 'Net Payroll', value: `₹${(totalNet / 100000).toFixed(2)}L`, color: 'var(--teal)' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-[11.5px] text-[var(--tx2)]">{item.label}</span>
                </div>
                <span className="text-[12px] font-semibold text-[var(--tx)]">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Payslip Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[460px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Payslip</div>
                <div className="text-[12px] text-[var(--tx3)]">{selectedSlip.month}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg cursor-pointer">
                  <Printer size={11} /> Print
                </button>
                <button onClick={() => setSelectedSlip(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
              </div>
            </div>
            <div className="p-5">
              {/* School header */}
              <div className="text-center mb-4 pb-4 border-b border-[var(--b)]">
                <div className="text-[14px] font-bold text-[var(--tx)]">Krishnaveni Talent School</div>
                <div className="text-[11px] text-[var(--tx3)]">Nizamabad, Telangana · Salary Payslip</div>
                <div className="text-[11px] text-[var(--tx3)]">{selectedSlip.month}</div>
              </div>

              {/* Employee info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'Employee Name', value: selectedSlip.name },
                  { label: 'Designation', value: selectedSlip.designation },
                  { label: 'Pay Period', value: selectedSlip.month },
                  { label: 'Payment Status', value: selectedSlip.status },
                ].map((item) => (
                  <div key={item.label} className="bg-[var(--surf2)] rounded-lg p-2.5">
                    <div className="text-[10.5px] text-[var(--tx3)]">{item.label}</div>
                    <div className="text-[12px] font-semibold text-[var(--tx)]">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Earnings + Deductions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <div className="text-[11px] font-semibold text-[var(--teal-tx)] mb-2">Earnings</div>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Basic Salary', amount: selectedSlip.basic },
                      { label: 'HRA', amount: selectedSlip.hra },
                      { label: 'Allowances', amount: selectedSlip.allowances },
                    ].map((e) => (
                      <div key={e.label} className="flex justify-between text-[12px]">
                        <span className="text-[var(--tx3)]">{e.label}</span>
                        <span className="text-[var(--tx)] font-medium">₹{e.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-[12px] pt-1.5 border-t border-[var(--b)] font-semibold">
                      <span className="text-[var(--tx)]">Gross</span>
                      <span className="text-[var(--teal-tx)]">₹{selectedSlip.gross.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-[var(--red-tx)] mb-2">Deductions</div>
                  <div className="space-y-1.5">
                    {[
                      { label: 'PF (12%)', amount: Math.round(selectedSlip.basic * 0.12) },
                      { label: 'Professional Tax', amount: 200 },
                      { label: 'Income Tax', amount: selectedSlip.deductions - Math.round(selectedSlip.basic * 0.12) - 200 },
                    ].map((e) => (
                      <div key={e.label} className="flex justify-between text-[12px]">
                        <span className="text-[var(--tx3)]">{e.label}</span>
                        <span className="text-[var(--red-tx)] font-medium">₹{e.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-[12px] pt-1.5 border-t border-[var(--b)] font-semibold">
                      <span className="text-[var(--tx)]">Total</span>
                      <span className="text-[var(--red-tx)]">₹{selectedSlip.deductions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-[var(--blue-bg)] rounded-xl p-3.5 flex justify-between items-center">
                <span className="text-[13px] font-bold text-[var(--blue-tx)]">Net Pay</span>
                <span className="text-[18px] font-bold text-[var(--blue-tx)]">₹{selectedSlip.net.toLocaleString()}</span>
              </div>
            </div>
            <div className="p-5 pt-0">
              <button onClick={() => setSelectedSlip(null)} className="w-full py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
