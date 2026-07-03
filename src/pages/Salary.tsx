import { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Download, Plus, Wallet, TrendingUp, Users, FileText, X, Printer, Loader2 } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';

import { STAFF, StaffMember } from './StaffManagement';
import { getYearMonth, hasJoinedBy, generateMonths, calculateLeaveAccrual } from '../utils/salaryHelpers';

interface StaffPayroll {
  id: string;
  userId?: string;
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

const getComponentAmt = (
  comp: { id: string; name?: string; calculationType?: string },
  salaries: Record<string, number>,
  basicAmt: number,
  fallbackAmt: number,
  lop: number = 0
) => {
  if (comp.id === 'basic') return basicAmt;
  const val = salaries[comp.id];
  if (val !== undefined) {
    if (comp.calculationType === 'percentage') {
      return Math.round((val / 100) * basicAmt) + (comp.id === 'deductions' ? lop : 0);
    }
    return val + (comp.id === 'deductions' ? lop : 0);
  }
  return fallbackAmt;
};

const getFallbackAmt = (
  comp: { id: string; name: string },
  p: { basic: number; hra: number; allowances: number; deductions: number; gross: number }
) => {
  const id = comp.id.toLowerCase();
  const name = comp.name.toLowerCase();
  if (id === 'basic' || name === 'basic') return p.basic;
  if (id === 'hra' || name === 'hra') return p.hra;
  if (id === 'allowances' || name.includes('allowance') || name.includes('earning')) {
    return p.allowances !== undefined ? p.allowances : Math.max(0, p.gross - p.basic - p.hra);
  }
  if (id === 'deductions' || id === 'deduction' || name.includes('deduction')) {
    return p.deductions !== undefined ? p.deductions : 3000;
  }
  return 0;
};

export function Salary() {
  const [payroll, setPayroll] = useState<StaffPayroll[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(false);
  const [leavesList, setLeavesList] = useState<any[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<StaffPayroll | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [monthFilter, setMonthFilter] = useState(() => {
    const saved = localStorage.getItem('kts_salary_month_filter');
    return saved || generateMonths()[0] || 'May 2026';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  });
  const [components, setComponents] = useState<any[]>([]);
  const [staffSalaries, setStaffSalaries] = useState<Record<string, Record<string, number>>>({});
// eslint-disable-next-line @typescript-eslint/no-explicit-any

  const getLopDeduction = (s: any, monthStr: string): number => {
    const ym = getYearMonth(monthStr);
    if (!ym) return 0;
    const { year, month } = ym;
    const { unpaidDaysInTargetMonth } = calculateLeaveAccrual(leavesList, String(s.id), s.joinDate, year, month);
    if (unpaidDaysInTargetMonth <= 0) return 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const baseSalary = Number(s.salary) || 25000;
    const perDaySalary = baseSalary / daysInMonth;
    return Math.round(unpaidDaysInTargetMonth * perDaySalary);
  };

  const getRowLop = (p: StaffPayroll) => {
    const staffObj = staffMembers.find(s => s.name === p.name || String(s.id) === String(p.userId));
    if (!staffObj) return 0;
    return getLopDeduction(staffObj, p.month);
  };
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [modalValues, setModalValues] = useState<Record<string, number>>({});
  const [modalMonth, setModalMonth] = useState(() => {
    const firstMonth = generateMonths()[0] || 'May 2026';
    return firstMonth.split(' ')[0];
  });
  const [modalYear, setModalYear] = useState(() => {
    const firstMonth = generateMonths()[0] || 'May 2026';
    return firstMonth.split(' ')[1] || '2026';
  });

  const modalMonthYear = `${modalMonth} ${modalYear}`;
  const modalActiveComponents = components.filter(
    (c) => !c.month || c.month === 'All' || c.month === modalMonthYear
  );
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('kts_staff_members');
    return (saved && JSON.parse(saved)) || STAFF;
  });

  useEffect(() => {
    if (selectedStaffId) {
      const staff = staffMembers.find(f => String(f.id) === selectedStaffId);
      const salaries = staff ? ((staffSalaries[staff.id] || staffSalaries[staff.name] || {})) : {};
      const initial: Record<string, number> = {};
      
      const defaultBasic = staff?.salary ? Math.round(staff.salary * 0.65) : 25000;
      const defaultHra = staff?.salary ? Math.round(staff.salary * 0.20) : 8000;
      const defaultAllowances = staff?.salary ? staff.salary - defaultBasic - defaultHra : 5000;
      const lop = staff ? getLopDeduction(staff, modalMonthYear) : 0;
      const defaultDeductions = (salaries['deductions'] !== undefined ? salaries['deductions'] : 3000) + lop;

      components.forEach((comp) => {
        let defaultVal = 0;
        if (comp.id === 'basic') defaultVal = defaultBasic;
        else if (comp.id === 'hra') defaultVal = defaultHra;
        else if (comp.id === 'allowances') defaultVal = defaultAllowances;
        else if (comp.id === 'deductions') defaultVal = defaultDeductions;

        initial[comp.id] = salaries[comp.id] !== undefined
          ? (comp.id === 'deductions' ? salaries[comp.id] + lop : salaries[comp.id])
          : (comp.calculationType === 'percentage' ? 0 : defaultVal);
      });
      setModalValues(initial);
    } else {
      setModalValues({});
    }
  }, [selectedStaffId, components, staffSalaries, staffMembers, modalMonthYear, leavesList]);

  const [dbSyncCompleted, setDbSyncCompleted] = useState(false);

  useEffect(() => {
    async function syncFromDb() {
      try {
        const settings = await api.getResources('settings');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        
        const compSetting = settings.find((s: any) => s.key === 'salary_components');
        if (compSetting && compSetting.value) {
          localStorage.setItem('salary_components', compSetting.value);
          setComponents(JSON.parse(compSetting.value));
        } else {
          const savedComps = localStorage.getItem('salary_components');
          if (savedComps) setComponents(JSON.parse(savedComps));
        }
// eslint-disable-next-line @typescript-eslint/no-explicit-any

        const salariesSetting = settings.find((s: any) => s.key === 'staff_salaries');
        if (salariesSetting && salariesSetting.value) {
          localStorage.setItem('staff_salaries', salariesSetting.value);
          setStaffSalaries(JSON.parse(salariesSetting.value));
        } else {
          const savedSalaries = localStorage.getItem('staff_salaries');
          if (savedSalaries) setStaffSalaries(JSON.parse(savedSalaries));
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        
        const staffSetting = settings.find((s: any) => s.key === 'kts_staff_members');
        if (staffSetting && staffSetting.value) {
          localStorage.setItem('kts_staff_members', staffSetting.value);
          setStaffMembers(JSON.parse(staffSetting.value));
        } else {
          const savedStaff = localStorage.getItem('kts_staff_members');
          if (savedStaff) setStaffMembers(JSON.parse(savedStaff));
        }
      } catch (err) {
        console.error('Error syncing settings from DB in Salary:', err);
        const savedComps = localStorage.getItem('salary_components');
        if (savedComps) {
          setComponents(JSON.parse(savedComps));
        } else {
          setComponents([
            { id: 'basic', name: 'Basic', type: 'earning', calculationType: 'flat' },
            { id: 'hra', name: 'HRA', type: 'earning', calculationType: 'flat' },
            { id: 'allowances', name: 'Allowances', type: 'earning', calculationType: 'flat' },
            { id: 'deductions', name: 'Deductions', type: 'deduction', calculationType: 'flat' },
          ]);
        }
        const savedSalaries = localStorage.getItem('staff_salaries');
        if (savedSalaries) setStaffSalaries(JSON.parse(savedSalaries));
        const savedStaff = localStorage.getItem('kts_staff_members');
        if (savedStaff) setStaffMembers(JSON.parse(savedStaff));
      } finally {
        setDbSyncCompleted(true);
      }
    }
    syncFromDb();
  }, []);

  const loadPayroll = async () => {
    setLoading(true);
    // Load staff from local storage/STAFF first so staffMembers is always populated
    const savedStaffRaw = localStorage.getItem('kts_staff_members');
    const currentStaffList = savedStaffRaw ? JSON.parse(savedStaffRaw) : STAFF;
    setStaffMembers(currentStaffList);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const leavesData = await api.getResources('leaves').catch(() => []);
      const mappedLeaves = (leavesData || []).map((l: any) => ({
        id: String(l.id),
        staffId: String(l.user_id || ''),
        staffName: l.staff_name || '',
        type: l.leave_type || '',
        from: l.start_date || '',
        to: l.end_date || '',
        days: Number(l.days) || 1,
        status: l.status || 'Pending',
      }));
      setLeavesList(mappedLeaves);

      const data = await api.getResources('payslips');
      const savedSalariesStr = localStorage.getItem('staff_salaries');
      const currentSalaries = savedSalariesStr ? JSON.parse(savedSalariesStr) : staffSalaries;
// eslint-disable-next-line @typescript-eslint/no-explicit-any

      const mapped = data.map((p: any) => {
        const gross = Number(p.gross_salary) || 0;
        const deductions = Number(p.total_deductions) || 0;
        const net = Number(p.net_salary) || 0;
// eslint-disable-next-line @typescript-eslint/no-explicit-any

        const staff = currentStaffList.find((s: any) => String(s.id) === String(p.user_id));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const name = staff ? staff.name : (p.name || 'Staff Member');
        const init = staff ? staff.name.split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase() : (p.init || 'SM');
        const designation = staff ? staff.designation : (p.designation || 'Senior Teacher');
        const salaries = staff ? (currentSalaries[staff.id] || currentSalaries[staff.name] || {}) : {};

        const basic = salaries['basic'] !== undefined ? salaries['basic'] : Math.round(gross * 0.65);
        const hra = salaries['hra'] !== undefined ? salaries['hra'] : Math.round(gross * 0.20);
        const allowances = salaries['allowances'] !== undefined ? salaries['allowances'] : gross - basic - hra;

        return {
          id: String(p.id),
          userId: String(p.user_id || ''),
          name,
          init,
          designation,
          basic,
          hra,
          allowances,
          deductions,
          gross,
          net,
          status: p.status?.toLowerCase() === 'paid' ? 'Paid' : 'Pending',
          month: `${p.month} ${p.year}`,
        };
      });
      setPayroll(mapped);
    } catch (err) {
      console.error('Error loading payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dbSyncCompleted) {
      loadPayroll();
    }
  }, [dbSyncCompleted]);

  const handleProcessPayroll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const userId = fd.get('userId') as string;

    const basicInputVal = modalValues['basic'] || 25000;
    let gross = 0;
    let totalDeductions = 0;

    modalActiveComponents.forEach((c) => {
      const inputVal = modalValues[c.id] || 0;
      const amt = c.calculationType === 'percentage'
        ? Math.round((inputVal / 100) * basicInputVal)
        : inputVal;

      if (c.type === 'earning') {
        gross += amt;
      } else {
        totalDeductions += amt;
      }
    });

    const net = Math.max(0, gross - totalDeductions);

    const data = {
      user_id: Number(userId),
      month: modalMonth,
      year: Number(modalYear),
      gross_salary: gross,
      total_deductions: totalDeductions,
      net_salary: net,
      status: fd.get('status') === 'Paid' ? 'Paid' : 'Generated',
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

  const activeComponents = components.filter(
    (c) => monthFilter === 'All' || !c.month || c.month === 'All' || c.month === monthFilter
  );

  const handleExport = () => {
    // Generate CSV content
    const headers = ['Staff Name', 'Designation', 'Month', ...activeComponents.map(c => c.name), 'Net Pay', 'Status'];
    const rows = filtered.map((p) => {
      const salaries = staffSalaries[p.name] || (p.userId ? staffSalaries[p.userId] : undefined) || {};
      const basicAmt = salaries['basic'] !== undefined ? salaries['basic'] : p.basic;
      
      // Calculate dynamic net pay
      let earningsSum = 0;
      let deductionsSum = 0;
      activeComponents.forEach((c) => {
        const fallback = getFallbackAmt(c, p);
        const amt = getComponentAmt(c, salaries, basicAmt, fallback);
        if (c.type === 'earning') earningsSum += amt;
        else deductionsSum += amt;
      });
      const rowNetPay = Math.max(0, earningsSum - deductionsSum);

      const compValues = activeComponents.map(c => {
        const fallback = getFallbackAmt(c, p);
        return getComponentAmt(c, salaries, basicAmt, fallback);
      });

      return [
        p.name,
        p.designation,
        p.month,
        ...compValues,
        rowNetPay,
        p.status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `monthly_payroll_${monthFilter.toLowerCase().replace(' ', '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-payslip');
    if (!printContent) return;

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Payslip - ${selectedSlip?.name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; background: white; }
            .text-center { text-align: center; }
            .mb-4 { margin-bottom: 16px; }
            .pb-4 { padding-bottom: 16px; }
            .border-b { border-bottom: 1px solid #e2e8f0; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: 1fr 1fr; gap: 16px; }
            .bg-\\[var\\(--surf2\\)\\] { background: #f8fafc !important; border-radius: 8px; padding: 12px; border: 1px solid #e2e8f0; }
            .text-xs { font-size: 11px; color: #64748b; }
            .text-sm { font-size: 13px; font-weight: 600; }
            .font-bold { font-weight: bold; }
            .flex { display: flex; justify-content: space-between; align-items: center; }
            .justify-between { justify-content: space-between; }
            .space-y-1\\.5 > * + * { margin-top: 6px; }
            .text-\\[var\\(--tx3\\)\\] { color: #64748b; }
            .text-\[var\(--tx\)\] { color: #1e293b; }
            .text-\\[var\\(--teal-tx\\)\\] { color: #0d9488; }
            .text-\\[var\\(--red-tx\\)\\] { color: #e11d48; }
            .text-\\[var\\(--blue-tx\\)\\] { color: #1d4ed8; }
            .bg-\\[var\\(--blue-bg\\)\\] { background: #eff6ff !important; border: 1px solid #bfdbfe; }
            .rounded-xl { border-radius: 12px; }
            .p-3\\.5 { padding: 14px; }
            .border-t { border-top: 1px solid #e2e8f0; }
            .pt-1\\.5 { padding-top: 6px; }
            .text-\\[18px\\] { font-size: 18px; }
            .text-\\[13px\\] { font-size: 13px; }
            .text-\\[12px\\] { font-size: 12px; }
            .text-\\[11px\\] { font-size: 11px; }
            .text-\\[14px\\] { font-size: 14px; }
            .font-semibold { font-weight: 600; }
            .text-\\[10\\.5px\\] { font-size: 10.5px; }
            .mb-2 { margin-bottom: 8px; }
            .grid-cols-1 { grid-template-columns: 1fr; }
            @media (min-width: 640px) {
              .sm\\:grid-cols-2 { grid-template-columns: 1fr 1fr; }
            }
          </style>
        </head>
        <body>
          <div style="max-width: 600px; margin: 0 auto;">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const filtered = monthFilter === 'All'
    ? payroll
    : staffMembers
        .filter((s) => {
          const targetYM = getYearMonth(monthFilter);
          return hasJoinedBy(s.joinDate, targetYM);
        })
        .map((s) => {
        const processed = payroll.find(p => 
          p.name.toLowerCase() === s.name.toLowerCase() && 
          p.month === monthFilter
        );
        if (processed) return processed;
// eslint-disable-next-line @typescript-eslint/no-explicit-any

        const init = s.name.split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase();
        const salaries = staffSalaries[s.id] || staffSalaries[s.name] || {};
        const basic = salaries['basic'] !== undefined ? salaries['basic'] : (s.salary ? Math.round(s.salary * 0.65) : 25000);
        const hra = salaries['hra'] !== undefined ? salaries['hra'] : (s.salary ? Math.round(s.salary * 0.20) : 8000);
        const allowances = salaries['allowances'] !== undefined ? salaries['allowances'] : (s.salary ? s.salary - basic - hra : 5000);
        
        const lop = getLopDeduction(s, monthFilter);
        const deductions = (salaries['deductions'] !== undefined ? salaries['deductions'] : 3000) + lop;

        let gross = 0;
        let totalDeductions = 0;
        activeComponents.forEach((c) => {
          const fallback = c.id === 'basic' ? basic : c.id === 'hra' ? hra : c.id === 'allowances' ? allowances : c.id === 'deductions' ? deductions : 0;
          const amt = getComponentAmt(c, salaries, basic, fallback, lop);
          if (c.type === 'earning') gross += amt;
          else totalDeductions += amt;
        });
        const net = Math.max(0, gross - totalDeductions);

        return {
          id: `virtual-${s.id}`,
          userId: s.id,
          name: s.name,
          init,
          designation: s.designation,
          basic,
          hra,
          allowances,
          deductions,
          gross,
          net,
          status: 'Pending' as const,
          month: monthFilter
        };
      });

  const totalGross = filtered.reduce((s, p) => {
    const salaries = staffSalaries[p.name] || (p.userId ? staffSalaries[p.userId] : undefined) || {};
    const basicAmt = salaries['basic'] !== undefined ? salaries['basic'] : p.basic;
    const lop = getRowLop(p);
    let earningsSum = 0;
    activeComponents.forEach((c) => {
      const fallback = getFallbackAmt(c, p);
      const amt = getComponentAmt(c, salaries, basicAmt, fallback, lop);
      if (c.type === 'earning') {
        earningsSum += amt;
      }
    });
    return s + earningsSum;
  }, 0);

  const totalNet = filtered.reduce((s, p) => {
    const salaries = staffSalaries[p.name] || (p.userId ? staffSalaries[p.userId] : undefined) || {};
    const basicAmt = salaries['basic'] !== undefined ? salaries['basic'] : p.basic;
    const lop = getRowLop(p);
    let earningsSum = 0;
    let deductionsSum = 0;
    activeComponents.forEach((c) => {
      const fallback = getFallbackAmt(c, p);
      const amt = getComponentAmt(c, salaries, basicAmt, fallback, lop);
      if (c.type === 'earning') earningsSum += amt;
      else deductionsSum += amt;
    });
    return s + Math.max(0, earningsSum - deductionsSum);
  }, 0);

  const totalDeductions = filtered.reduce((s, p) => {
    const salaries = staffSalaries[p.name] || (p.userId ? staffSalaries[p.userId] : undefined) || {};
    const basicAmt = salaries['basic'] !== undefined ? salaries['basic'] : p.basic;
    const lop = getRowLop(p);
    let deductionsSum = 0;
    activeComponents.forEach((c) => {
      const fallback = getFallbackAmt(c, p);
      const amt = getComponentAmt(c, salaries, basicAmt, fallback, lop);
      if (c.type === 'deduction') deductionsSum += amt;
    });
    return s + deductionsSum;
  }, 0);

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
              <select
                value={monthFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setMonthFilter(val);
                  localStorage.setItem('kts_salary_month_filter', val);
                }}
                className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[11.5px] text-[var(--tx)] cursor-pointer outline-none"
              >
                {generateMonths().map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg cursor-pointer hover:bg-[var(--surf3)]"
              >
                <Download size={11} /> Export
              </button>
              <button
                onClick={() => {
                  if (monthFilter !== 'All') {
                    const parts = monthFilter.split(' ');
                    if (parts.length === 2) {
                      setModalMonth(parts[0]);
                      setModalYear(parts[1]);
                    }
                  } else {
                    setModalMonth('May');
                    setModalYear('2026');
                  }
                  setSelectedStaffId('');
                  setShowProcessModal(true);
                }}
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
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">Staff</th>
                  {activeComponents.map((comp) => (
                    <th key={comp.id} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">{comp.name}</th>
                  ))}
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">Net Pay</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const salaries = staffSalaries[p.name] || (p.userId ? staffSalaries[p.userId] : undefined) || {};
                  const lop = getRowLop(p);
                  
                  // Calculate dynamic net pay
                  let earningsSum = 0;
                  let deductionsSum = 0;
                  const basicAmt = salaries['basic'] !== undefined ? salaries['basic'] : p.basic;
                  activeComponents.forEach((c) => {
                    const fallback = getFallbackAmt(c, p);
                    const amt = getComponentAmt(c, salaries, basicAmt, fallback, lop);
                    if (c.type === 'earning') earningsSum += amt;
                    else deductionsSum += amt;
                  });
                  const rowNetPay = Math.max(0, earningsSum - deductionsSum);

                  return (
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
                      {activeComponents.map((comp) => {
                        const basicAmt = salaries['basic'] !== undefined ? salaries['basic'] : p.basic;
                        const fallback = getFallbackAmt(comp, p);
                        const amt = getComponentAmt(comp, salaries, basicAmt, fallback, lop);
                        return (
                          <td key={comp.id} className={`px-2 py-2.5 ${comp.type === 'deduction' ? 'text-[var(--red-tx)]' : 'text-[var(--tx2)]'}`}>
                            {comp.type === 'deduction' ? '-' : ''}₹{amt.toLocaleString()}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2.5 font-semibold text-[var(--tx)]">₹{rowNetPay.toLocaleString()}</td>
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
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={components.length + 4} className="text-center py-6 text-[12px] text-[var(--tx3)]">
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
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={trendData} barSize={24} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--b)" />
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                <select
                  name="userId"
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                >
                  <option value="">Choose teacher...</option>
                  {staffMembers.filter((f) => {
                    const targetYM = getYearMonth(modalMonthYear);
                    return hasJoinedBy(f.joinDate, targetYM);
                  }).map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.subject || f.designation || 'Staff'})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Month *</label>
                  <select 
                    name="month" 
                    required 
                    value={modalMonth} 
                    onChange={(e) => setModalMonth(e.target.value)} 
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none"
                  >
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Year *</label>
                  <select 
                    name="year" 
                    required 
                    value={modalYear} 
                    onChange={(e) => setModalYear(e.target.value)} 
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none"
                  >
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              {selectedStaffId && (
                <div key={selectedStaffId} className="space-y-3 border-t border-[var(--b)] pt-3">
                  <div className="text-[11.5px] font-bold text-[var(--tx)]">Component Breakdown</div>
                  <div className="grid grid-cols-2 gap-3">
                    {modalActiveComponents.map((comp) => {
                      return (
                        <div key={comp.id}>
                          <label className="block text-[11px] font-medium text-[var(--tx2)] mb-1">
                            {comp.name} {comp.calculationType === 'percentage' ? '(%)' : '(₹)'} *
                          </label>
                          <input
                            type="number"
                            name={`comp_${comp.id}`}
                            required
                            value={modalValues[comp.id] ?? 0}
                            onChange={(e) => setModalValues({ ...modalValues, [comp.id]: Number(e.target.value) || 0 })}
                            className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                          />
                        </div>
                      );
                    })}
                  </div>
                  {(() => {
                    const basicAmt = modalValues['basic'] || 0;
                    let grossSum = 0;
                    let deductionsSum = 0;
                    modalActiveComponents.forEach((c) => {
                      const inputVal = modalValues[c.id] || 0;
                      const amt = c.calculationType === 'percentage'
                        ? Math.round((inputVal / 100) * basicAmt)
                        : inputVal;
                      if (c.type === 'earning') grossSum += amt;
                      else deductionsSum += amt;
                    });
                    const netPay = Math.max(0, grossSum - deductionsSum);
                    return (
                      <div className="bg-[var(--blue-bg)] rounded-xl p-3.5 flex justify-between items-center mt-3">
                        <span className="text-[12.5px] font-bold text-[var(--blue-tx)]">Net Pay (In-Hand)</span>
                        <span className="text-[16px] font-bold text-[var(--blue-tx)]">₹{netPay.toLocaleString()}</span>
                      </div>
                    );
                  })()}
                </div>
              )}
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
                <button onClick={handlePrint} className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg cursor-pointer hover:bg-[var(--surf3)]">
                  <Printer size={11} /> Print
                </button>
                <button onClick={() => setSelectedSlip(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
              </div>
            </div>
            <div className="p-5" id="printable-payslip">
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

              {(() => {
                const salaries = staffSalaries[selectedSlip.name] || (selectedSlip.userId ? staffSalaries[selectedSlip.userId] : undefined) || {};
                let earningsSum = 0;
                let deductionsSum = 0;
                const basicAmt = salaries['basic'] !== undefined ? salaries['basic'] : selectedSlip.basic;
                
                const slipActiveComponents = components.filter(
                  (c) => !c.month || c.month === 'All' || c.month === selectedSlip.month
                );

                slipActiveComponents.forEach((c) => {
                  const fallback = getFallbackAmt(c, selectedSlip);
                  const amt = getComponentAmt(c, salaries, basicAmt, fallback);
                  if (c.type === 'earning') earningsSum += amt;
                  else deductionsSum += amt;
                });

                const earnings = slipActiveComponents.filter(c => c.type === 'earning').map(c => ({
                  label: c.name,
                  amount: getComponentAmt(c, salaries, basicAmt, getFallbackAmt(c, selectedSlip))
                }));

                const deductions = slipActiveComponents.filter(c => c.type === 'deduction').map(c => ({
                  label: c.name,
                  amount: getComponentAmt(c, salaries, basicAmt, getFallbackAmt(c, selectedSlip))
                }));

                const grossVal = earningsSum;
                const deductionsVal = deductionsSum;
                const netVal = Math.max(0, earningsSum - deductionsSum);

                return (
                  <>
                    <div className={`grid grid-cols-1 ${deductions.length > 0 ? 'sm:grid-cols-2' : ''} gap-3 mb-4`}>
                      {earnings.length > 0 && (
                        <div>
                          <div className="text-[11px] font-semibold text-[var(--teal-tx)] mb-2">Earnings</div>
                          <div className="space-y-1.5">
                            {earnings.map((e) => (
                              <div key={e.label} className="flex justify-between text-[12px]">
                                <span className="text-[var(--tx3)]">{e.label}</span>
                                <span className="text-[var(--tx)] font-medium">₹{e.amount.toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-[12px] pt-1.5 border-t border-[var(--b)] font-semibold">
                              <span className="text-[var(--tx)]">Gross</span>
                              <span className="text-[var(--teal-tx)]">₹{grossVal.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {deductions.length > 0 && (
                        <div>
                          <div className="text-[11px] font-semibold text-[var(--red-tx)] mb-2">Deductions</div>
                          <div className="space-y-1.5">
                            {deductions.map((e) => (
                              <div key={e.label} className="flex justify-between text-[12px]">
                                <span className="text-[var(--tx3)]">{e.label}</span>
                                <span className="text-[var(--red-tx)] font-medium">₹{e.amount.toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-[12px] pt-1.5 border-t border-[var(--b)] font-semibold">
                              <span className="text-[var(--tx)]">Total</span>
                              <span className="text-[var(--red-tx)]">₹{deductionsVal.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-[var(--blue-bg)] rounded-xl p-3.5 flex justify-between items-center">
                      <span className="text-[13px] font-bold text-[var(--blue-tx)]">Net Pay</span>
                      <span className="text-[18px] font-bold text-[var(--blue-tx)]">₹{netVal.toLocaleString()}</span>
                    </div>
                  </>
                );
              })()}
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
