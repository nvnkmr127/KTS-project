import { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Plus, X, DollarSign, TrendingDown, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { formatDate } from '../utils/date';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  vendor: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  receipt: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Electricity: 'var(--amber)',
  Maintenance: 'var(--blue)',
  Stationery: 'var(--purple)',
  Water: 'var(--teal)',
  Transport: 'var(--coral)',
  Events: 'var(--pink)',
};

const monthlyData = [
  { month: 'Jan', amount: 1.2 }, { month: 'Feb', amount: 1.4 }, { month: 'Mar', amount: 1.8 },
  { month: 'Apr', amount: 1.3 }, { month: 'May', amount: 1.67 },
];

const tooltipStyle = { backgroundColor: 'var(--surf)', border: '0.5px solid var(--b2)', borderRadius: 8, fontSize: 11, color: 'var(--tx)' };

export function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [catFilter, setCatFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await api.getResources('expenses');
      const mapped = data.map((e: any) => {
        const catName = typeof e.category === 'object' && e.category !== null 
          ? e.category.name 
          : e.category;
        return {
          id: String(e.id),
          category: catName || 'General',
          description: e.description || '',
          amount: parseFloat(e.amount) || 0,
          date: e.date ? e.date.slice(0, 10) : '',
          vendor: e.vendor || 'N/A',
          status: e.status || 'Pending',
          receipt: !!e.receipt,
        };
      });
      // MOCK DATA START
      setExpenses((prev) => {
        const hasMocks = prev.some((e) => e.id.startsWith('mock-'));
        const mockList = hasMocks ? [] : [
          { id: 'mock-1', category: 'Electricity', description: 'Power bill for May 2026', amount: 8400, date: '2026-05-15', vendor: 'Telangana SPDCL', status: 'Approved', receipt: true },
          { id: 'mock-2', category: 'Maintenance', description: 'Plumbing repairs in block A', amount: 3500, date: '2026-05-20', vendor: 'Local Plumber', status: 'Approved', receipt: false },
          { id: 'mock-3', category: 'Stationery', description: 'Whiteboard markers and chalk', amount: 1500, date: '2026-05-22', vendor: 'Royal Stationery', status: 'Approved', receipt: true },
          { id: 'mock-4', category: 'Utilities', description: 'Drinking water cans supply', amount: 2400, date: '2026-05-25', vendor: 'Bisleri Distributors', status: 'Pending', receipt: false },
          { id: 'mock-5', category: 'Transport', description: 'School bus diesel filling', amount: 12000, date: '2026-05-28', vendor: 'HP Petrol Pump', status: 'Approved', receipt: true },
        ];
        const combined = [...mockList, ...mapped];
        return combined.map((newItem) => {
          const existing = prev.find((e) => e.id === newItem.id);
          return existing ? { ...newItem, status: existing.status } : newItem;
        });
      });
      // MOCK DATA END
    } catch (err) {
      console.error('Error loading expenses:', err);
      // Fallback if API is not connected or failing
      setExpenses((prev) => {
        const hasMocks = prev.some((e) => e.id.startsWith('mock-'));
        if (hasMocks) return prev;
        return [
          { id: 'mock-1', category: 'Electricity', description: 'Power bill for May 2026', amount: 8400, date: '2026-05-15', vendor: 'Telangana SPDCL', status: 'Approved', receipt: true },
          { id: 'mock-2', category: 'Maintenance', description: 'Plumbing repairs in block A', amount: 3500, date: '2026-05-20', vendor: 'Local Plumber', status: 'Approved', receipt: false },
          { id: 'mock-3', category: 'Stationery', description: 'Whiteboard markers and chalk', amount: 1500, date: '2026-05-22', vendor: 'Royal Stationery', status: 'Approved', receipt: true },
          { id: 'mock-4', category: 'Utilities', description: 'Drinking water cans supply', amount: 2400, date: '2026-05-25', vendor: 'Bisleri Distributors', status: 'Pending', receipt: false },
          { id: 'mock-5', category: 'Transport', description: 'School bus diesel filling', amount: 12000, date: '2026-05-28', vendor: 'HP Petrol Pump', status: 'Approved', receipt: true },
        ];
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      category: fd.get('category'),
      amount: parseFloat(fd.get('amount') as string) || 0,
      description: fd.get('description'),
      vendor: fd.get('vendor'),
      date: fd.get('date'),
      status: 'Pending',
      receipt: false,
    };

    try {
      await api.createResource('expenses', data);
      setShowAdd(false);
      loadExpenses();
    } catch (err) {
      console.error('Error adding expense:', err);
      // Fallback local add if API fails
      const localNew: Expense = {
        id: 'local-' + Date.now(),
        category: (fd.get('category') as string) || 'General',
        description: (fd.get('description') as string) || '',
        amount: parseFloat(fd.get('amount') as string) || 0,
        vendor: (fd.get('vendor') as string) || 'N/A',
        date: (fd.get('date') as string) || new Date().toISOString().slice(0, 10),
        status: 'Pending',
        receipt: false,
      };
      setExpenses((prev) => [localNew, ...prev]);
      setShowAdd(false);
    }
  };

  const handleApprove = async (id: string) => {
    // Update local state first to make UI updates instantaneous and works in database-less environment
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: 'Approved' } : e));
    
    if (!id.startsWith('mock-') && !id.startsWith('local-')) {
      try {
        await api.updateResource('expenses', id, { status: 'Approved' });
      } catch (err) {
        console.error('Error approving expense in backend:', err);
      }
    }
  };

  const filtered = expenses.filter((e) => {
    const matchCategory = catFilter === 'All' || e.category === catFilter;
    const matchStart = !startDate || e.date >= startDate;
    const matchEnd = !endDate || e.date <= endDate;
    return matchCategory && matchStart && matchEnd;
  });

  const totalApproved = filtered.filter((e) => e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
  const totalPending = filtered.filter((e) => e.status === 'Pending').reduce((s, e) => s + e.amount, 0);
  const totalExpensesSum = filtered.reduce((s, e) => s + e.amount, 0);

  const categoryTotals = filtered.reduce((acc, e) => ({ ...acc, [e.category]: (acc[e.category] ?? 0) + e.amount }), {} as Record<string, number>);
  const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="Total Expenses" value={`₹${(totalExpensesSum / 100000).toFixed(2)}L`} sub={startDate || endDate ? 'Custom Date Range' : 'This Academic Year'} icon={<DollarSign size={15} />} iconBg="var(--red-bg)" iconColor="var(--red-tx)" />
        <KPICard label="Approved" value={`₹${(totalApproved / 1000).toFixed(0)}K`} sub={`${filtered.filter((e) => e.status === 'Approved').length} items`} icon={<CheckCircle size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Pending Approval" value={`₹${(totalPending / 1000).toFixed(0)}K`} sub={`${filtered.filter((e) => e.status === 'Pending').length} items`} icon={<AlertTriangle size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
        <KPICard label="Annual Budget" value="₹25L" sub={`₹${(totalExpensesSum / 100000).toFixed(2)}L spent`} icon={<TrendingDown size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-2.5 mb-2.5">
        <Card>
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center mb-4">
            <div className="text-[13px] font-semibold text-[var(--tx)] flex items-center gap-2">
              Expense Ledger {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch sm:items-center">
              <div className="flex items-center gap-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2 py-1.5 text-[11.5px]">
                <span className="text-[var(--tx3)]">From:</span>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="bg-transparent text-[var(--tx)] outline-none cursor-pointer w-[105px] h-[16px] text-[10.5px]"
                />
              </div>
              <div className="flex items-center gap-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2 py-1.5 text-[11.5px]">
                <span className="text-[var(--tx3)]">To:</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="bg-transparent text-[var(--tx)] outline-none cursor-pointer w-[105px] h-[16px] text-[10.5px]"
                />
              </div>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[11.5px] text-[var(--tx)] cursor-pointer outline-none w-full sm:w-auto">
                <option value="All">All Categories</option>
                {Object.keys(CATEGORY_COLORS).map((c) => <option key={c}>{c}</option>)}
              </select>
              <button onClick={() => setShowAdd(true)} className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11.5px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90 w-full sm:w-auto flex-shrink-0">
                <Plus size={11} /> Add Expense
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px] min-w-[700px]">
              <thead>
                <tr className="border-b border-[var(--b)]">
                  {['Category', 'Description', 'Vendor', 'Date', 'Amount', 'Status', ''].map((h) => (
                    <th key={h} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] transition-colors last:border-0">
                    <td className="px-2 py-2.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[e.category] ?? 'var(--tx3)' }} />
                        <span className="font-medium text-[var(--tx)]">{e.category}</span>
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-[var(--tx2)] max-w-[180px] truncate">{e.description}</td>
                    <td className="px-2 py-2.5 text-[var(--tx3)]">{e.vendor}</td>
                    <td className="px-2 py-2.5 text-[var(--tx3)]">{formatDate(e.date)}</td>
                    <td className="px-2 py-2.5 font-semibold text-[var(--tx)]">₹{e.amount.toLocaleString()}</td>
                    <td className="px-2 py-2.5">
                      {e.status === 'Approved' && <Badge variant="teal">Approved</Badge>}
                      {e.status === 'Pending' && <Badge variant="amber">Pending</Badge>}
                      {e.status === 'Rejected' && <Badge variant="red">Rejected</Badge>}
                    </td>
                    <td className="px-2 py-2.5">
                      {e.status === 'Pending' && (
                        <button onClick={() => handleApprove(e.id)} className="text-[11px] text-[var(--teal-tx)] hover:underline cursor-pointer">Approve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-2.5">
          <Card>
            <div className="text-[12.5px] font-semibold text-[var(--tx)] mb-3">By Category</div>
            <div className="h-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={52} paddingAngle={2} dataKey="value">
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.name] ?? 'var(--tx3)'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${v.toLocaleString()}`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              {categoryData.slice(0, 4).map((d) => (
                <div key={d.name} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm" style={{ background: CATEGORY_COLORS[d.name] ?? 'var(--tx3)' }} />
                    <span className="text-[var(--tx2)]">{d.name}</span>
                  </span>
                  <span className="font-medium text-[var(--tx)]">₹{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="text-[12.5px] font-semibold text-[var(--tx)] mb-3">Monthly Trend</div>
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barSize={16} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--b)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `₹${v}L`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${v}L`, 'Expenses']} cursor={{ fill: 'var(--surf2)' }} />
                  <Bar dataKey="amount" fill="var(--coral)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAdd} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[460px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">Add Expense</div>
              <button type="button" onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Category *</label>
                  <select name="category" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]">
                    {Object.keys(CATEGORY_COLORS).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Amount (₹) *</label>
                  <input type="number" name="amount" required className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="15000" />
                </div>
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Description *</label>
                <input name="description" required className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Describe the expense..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Vendor / Payee</label>
                  <input name="vendor" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Vendor name" />
                </div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Date *</label>
                  <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer">Submit for Approval</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
