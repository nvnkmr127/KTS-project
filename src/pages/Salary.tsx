import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Download, Plus, Wallet, TrendingUp, Users, FileText, X, Printer, Loader2 } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
import { api } from '../services/api';

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

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = [2026, 2027];

export function Salary() {
  const [payroll, setPayroll] = useState<StaffPayroll[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<StaffPayroll | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [monthFilter, setMonthFilter] = useState('May 2026');

  const loadPayroll = async () => {
    setLoading(true);
    try {
      const data = await api.getResources('payslips');
      const mapped = data.map((p: any) => {
        const gross = Number(p.gross_salary) || 0;
        const deductions = Number(p.total_deductions) || 0;
        const net = Number(p.net_salary) || 0;

        const basic = Math.round(gross * 0.65);
        const hra = Math.round(gross * 0.20);
        const allowances = gross - basic - hra;

        return {
          id: String(p.id),
          name: p.name || 'Staff Member',
          init: p.init || 'SM',
          designation: p.designation || 'Senior Teacher',
          basic,
          hra,
          allowances,
          deductions,
          gross,
          net,
          status: p.status === 'paid' ? 'Paid' : p.status === 'on_hold' ? 'On Hold' : 'Pending',
          month: `${p.month} ${p.year}`,
        };
      });
      setPayroll(mapped);

      const teachers = await api.getResources('faculty');
      setFaculty(teachers);
    } catch (err) {
      console.error('Error loading payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, []);

  const handleProcessPayroll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const userId = fd.get('userId') as string;
    const basic = Number(fd.get('basic')) || 0;
    const hra = Number(fd.get('hra')) || 0;
    const allowances = Number(fd.get('allowances')) || 0;
    const deductions = Number(fd.get('deductions')) || 0;

    const gross = basic + hra + allowances;
    const net = gross - deductions;

    const data = {
      user_id: Number(userId),
      month: fd.get('month') as string,
      year: Number(fd.get('year')),
      gross_salary: gross,
      total_deductions: deductions,
      net_salary: net,
      status: (fd.get('status') as string).toLowerCase().replace(' ', '_'),
      working_days: 30,
      days_present: 30,
      leave_days: 0,
      payment_multiplier: 1.0
    };

    try {
      await api.createResource('payslips', data);
      setShowProcessModal(false);
      loadPayroll();
    } catch (err) {
      console.error('Error processing payroll:', err);
    }
  };

  const filtered = payroll.filter((p) => {
    if (monthFilter === 'All') return true;
    return p.month === monthFilter;
  });

  const totalGross = filtered.reduce((s, p) => s + p.gross, 0);
  const totalNet = filtered.reduce((s, p) => s + p.net, 0);
  const totalDeductions = filtered.reduce((s, p) => s + p.deductions, 0);
  const paid = filtered.filter((p) => p.status === 'Paid').length;

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="Gross Payroll" value={`₹${(totalGross / 100000).toFixed(2)}L`} sub={monthFilter} icon={<Wallet size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Net Payroll" value={`₹${(totalNet / 100000).toFixed(2)}L`} sub="After deductions" icon={<TrendingUp size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Total Deductions" value={`₹${totalDeductions.toLocaleString()}`} sub="PF, Tax, etc." icon={<FileText size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
        <KPICard label="Payments Done" value={`${paid}/${filtered.length}`} sub="Staff paid this month" icon={<Users size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-2.5 mb-2.5">
        <Card>
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center mb-4">
            <div className="text-[13px] font-semibold text-[var(--tx)] flex items-center gap-2">
              Monthly Payroll — {monthFilter} {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
            </div>
            <div className="flex gap-2">
              <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[11.5px] text-[var(--tx)] cursor-pointer outline-none">
                <option value="All">All Months</option>
                {['May 2026', 'April 2026', 'March 2026', 'February 2026'].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg cursor-pointer hover:bg-[var(--surf3)]">
                <Download size={11} /> Export
              </button>
              <button
                onClick={() => setShowProcessModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90"
              >
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
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] transition-colors last:border-0">
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar initials={p.init} bg={AVATAR_COLORS[p.init]?.bg ?? 'var(--surf3)'} color={AVATAR_COLORS[p.init]?.color ?? 'var(--tx2)'} />
                        <div>
                          <div className="font-semibold text-[var(--tx)]">{p.name}</div>
                          <div className="text-[10.5px] text-[var(--tx3)]">{p.designation} · {p.month}</div>
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
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-[12px] text-[var(--tx3)]">
                      No payroll records processed for this period.
                    </td>
                  </tr>
                )}
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

      {/* Process Payroll Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleProcessPayroll} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[480px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Process Staff Payroll</div>
                <div className="text-[12px] text-[var(--tx3)]">Generate monthly payslip for a faculty member</div>
              </div>
              <button type="button" onClick={() => setShowProcessModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Select Staff *</label>
                <select name="userId" required className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]">
                  <option value="">Choose teacher...</option>
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.subject})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Month *</label>
                  <select name="month" required defaultValue="May" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Year *</label>
                  <select name="year" required defaultValue="2026" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Basic Salary (₹) *</label>
                  <input type="number" name="basic" required defaultValue="35000" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">HRA (₹) *</label>
                  <input type="number" name="hra" required defaultValue="10000" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Allowances (₹)</label>
                  <input type="number" name="allowances" defaultValue="5000" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Deductions (₹)</label>
                  <input type="number" name="deductions" defaultValue="3000" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Status *</label>
                <select name="status" defaultValue="Paid" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button type="button" onClick={() => setShowProcessModal(false)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer">Process Slip</button>
            </div>
          </form>
        </div>
      )}

      {/* Payslip Details Modal */}
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
              <div className="text-center mb-4 pb-4 border-b border-[var(--b)]">
                <div className="text-[14px] font-bold text-[var(--tx)]">Krishnaveni Talent School</div>
                <div className="text-[11px] text-[var(--tx3)]">Nizamabad, Telangana · Salary Payslip</div>
                <div className="text-[11px] text-[var(--tx3)]">{selectedSlip.month}</div>
              </div>

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
                      { label: 'Other Deductions', amount: selectedSlip.deductions - Math.round(selectedSlip.basic * 0.12) - 200 },
                    ].map((e) => (
                      <div key={e.label} className="flex justify-between text-[12px]">
                        <span className="text-[var(--tx3)]">{e.label}</span>
                        <span className="text-[var(--red-tx)] font-medium">₹{Math.max(0, e.amount).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-[12px] pt-1.5 border-t border-[var(--b)] font-semibold">
                      <span className="text-[var(--tx)]">Total</span>
                      <span className="text-[var(--red-tx)]">₹{selectedSlip.deductions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

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
