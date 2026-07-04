import { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Wallet, TrendingUp, FileText, Printer, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

import { STAFF } from './StaffManagement';
import { generateMonths, getYearMonth, calculateLeaveAccrual } from '../utils/salaryHelpers';

interface PayslipRecord {
  id: string;
  userId?: string;
  name: string;
  designation?: string;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  gross: number;
  net: number;
  status: 'Paid' | 'Pending' | 'On Hold';
  month: string;
}

const tooltipStyle = {
  backgroundColor: 'var(--surf)',
  border: '0.5px solid var(--b2)',
  borderRadius: 8,
  fontSize: 11,
  color: 'var(--tx)',
};

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

const isNameMatch = (name1: string, name2: string) => {
  if (!name1 || !name2) return false;
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean(name1) === clean(name2);
};

export function MySalary() {
  const schoolName = localStorage.getItem('school_name') || 'Krishnaveni Talent School';
  const schoolAddress = localStorage.getItem('school_address') || 'Nizamabad, Telangana';
  const schoolLogo = localStorage.getItem('school_logo') || '/KTHS_Logo.png';

  const { user } = useAuth();
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedSlip, setSelectedSlip] = useState<PayslipRecord | null>(null);
  const [components, setComponents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [staffSalaries, setStaffSalaries] = useState<Record<string, Record<string, number>>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leavesList, setLeavesList] = useState<any[]>([]);
  const [myStaffRecord, setMyStaffRecord] = useState<any>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any

  const getLopDeduction = (s: any, monthStr: string): number => {
    const ym = getYearMonth(monthStr);
    if (!ym) return 0;
    const { year, month } = ym;
    const { unpaidDaysInTargetMonth } = calculateLeaveAccrual(leavesList, String(s.id), s.join_date || s.joinDate, year, month);
    if (unpaidDaysInTargetMonth <= 0) return 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const baseSalary = Number(s.salary) || 25000;
    const perDaySalary = baseSalary / daysInMonth;
    return Math.round(unpaidDaysInTargetMonth * perDaySalary);
  };

  const getRowLop = (p: PayslipRecord) => {
    if (!myStaffRecord) return 0;
    return getLopDeduction(myStaffRecord, p.month);
  };

  const [dbSyncCompleted, setDbSyncCompleted] = useState(false);

  useEffect(() => {
    async function syncFromDb() {
      try {
        const settings = await api.getResources('settings');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        
        const compSetting = settings.find((s: any) => s.key === 'salary_components');
        if (compSetting && compSetting.value) {
          (localStorage as any).originalSetItem('salary_components', compSetting.value);
          setComponents(JSON.parse(compSetting.value));
        } else {
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
        }
// eslint-disable-next-line @typescript-eslint/no-explicit-any

        const salariesSetting = settings.find((s: any) => s.key === 'staff_salaries');
        if (salariesSetting && salariesSetting.value) {
          (localStorage as any).originalSetItem('staff_salaries', salariesSetting.value);
          setStaffSalaries(JSON.parse(salariesSetting.value));
        } else {
          const savedSalaries = localStorage.getItem('staff_salaries');
          if (savedSalaries) setStaffSalaries(JSON.parse(savedSalaries));
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        
        const staffSetting = settings.find((s: any) => s.key === 'kts_staff_members');
        const savedStaff = localStorage.getItem('kts_staff_members');
        if ((!savedStaff || savedStaff === '[]') && staffSetting && staffSetting.value) {
          (localStorage as any).originalSetItem('kts_staff_members', staffSetting.value);
        }
      } catch (err) {
        console.error('Error syncing settings from DB:', err);
        // Fallback to local storage
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
      } finally {
        setDbSyncCompleted(true);
      }
    }
    syncFromDb();
  }, []);

  const loadPayslips = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const savedSalariesStr = localStorage.getItem('staff_salaries');
      const currentSalaries = savedSalariesStr ? JSON.parse(savedSalariesStr) : staffSalaries;
      const userSalaries = currentSalaries[user.id] || 
        currentSalaries[Object.keys(currentSalaries).find(k => isNameMatch(k, user.name)) || ''] || 
        {};

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const leavesData = await api.getResources('leaves').catch(() => []);
      const mappedLeaves = (leavesData || []).map((l: any) => ({
        id: String(l.id),
        staffId: String(l.user_id || ''),
        staffName: l.staff_name || '',
        type: (typeof l.leave_type === 'object' && l.leave_type ? l.leave_type.name : l.leave_type) || 'Sick Leave',
        from: l.start_date || '',
        to: l.end_date || '',
        days: Number(l.days) || 1,
        status: l.status || 'Pending',
      }));
      setLeavesList(mappedLeaves);

      const savedStaffStr = localStorage.getItem('kts_staff_members');
      const currentStaffList = savedStaffStr ? JSON.parse(savedStaffStr) : STAFF;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let staffRecord = currentStaffList.find(
        (s: any) =>
          (s.email && user.email && s.email.trim().toLowerCase() === user.email.trim().toLowerCase()) ||
          isNameMatch(s.name, user.name)
      );
      setMyStaffRecord(staffRecord);

      // Fetch payslips from backend API
      const data = await api.getResources('payslips');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiSlips = data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((p: any) => String(p.user_id) === String(user.id))
        .map((p: any) => {
          const gross = Number(p.gross_salary) || 0;
          const deductions = Number(p.total_deductions) || 0;
          const net = Number(p.net_salary) || 0;

          const basic = userSalaries['basic'] !== undefined ? userSalaries['basic'] : Math.round(gross * 0.65);
          const hra = userSalaries['hra'] !== undefined ? userSalaries['hra'] : Math.round(gross * 0.20);
          const allowances = userSalaries['allowances'] !== undefined ? userSalaries['allowances'] : gross - basic - hra;

          return {
            id: String(p.id),
            userId: String(p.user_id || ''),
            name: p.name || user.name,
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

      // Merge backend payslips
      const merged: PayslipRecord[] = apiSlips;

      if (!staffRecord && user) {
        // Fallback: construct a virtual staff record using logged-in user info
        // Check if there is an assigned salary in staffSalaries state
        const userSalaries = staffSalaries[user.id] || 
          staffSalaries[Object.keys(staffSalaries).find(k => isNameMatch(k, user.name)) || ''] || 
          {};
        let calculatedSalary = 35000; // default
        if (userSalaries && Object.keys(userSalaries).length > 0) {
          let earningsSum = 0;
          components.forEach((c) => {
            const val = userSalaries[c.id];
            if (val !== undefined && c.type === 'earning') {
              earningsSum += val;
            }
          });
          if (earningsSum > 0) {
            calculatedSalary = earningsSum;
          }
        }
        
        staffRecord = {
          id: String(user.id),
          name: user.name,
          email: user.email,
          designation: user.designation || 'Teacher',
          salary: calculatedSalary,
          status: 'Active',
          id_number: `ST-${user.id}`
        };
      }

      // Standard months list to match admin panel's filters
      const targetMonths = generateMonths();

      // Ensure that for each target month, there is a payslip. If not, generate a virtual one.
      targetMonths.forEach((month) => {
        const hasSlip = merged.some((s) => s.month === month);
        if (!hasSlip && staffRecord) {
          const basic = userSalaries['basic'] !== undefined ? userSalaries['basic'] : (staffRecord.salary ? Math.round(staffRecord.salary * 0.65) : 25000);
          const hra = userSalaries['hra'] !== undefined ? userSalaries['hra'] : (staffRecord.salary ? Math.round(staffRecord.salary * 0.20) : 8000);
          const allowances = userSalaries['allowances'] !== undefined ? userSalaries['allowances'] : (staffRecord.salary ? staffRecord.salary - basic - hra : 5000);
          const lop = getLopDeduction(staffRecord, month);
          const deductions = (userSalaries['deductions'] !== undefined ? userSalaries['deductions'] : 3000) + lop;

          let gross = 0;
          let totalDeductions = 0;
          const slipActiveComponents = components.filter(
            (c) => !c.month || c.month === 'All' || c.month === month
          );
          slipActiveComponents.forEach((c) => {
            const fallback = c.id === 'basic' ? basic : c.id === 'hra' ? hra : c.id === 'allowances' ? allowances : c.id === 'deductions' ? deductions : 0;
            const val = userSalaries[c.id];
            let amt = fallback;
            if (val !== undefined) {
              if (c.calculationType === 'percentage') {
                amt = Math.round((val / 100) * basic) + (c.id === 'deductions' ? lop : 0);
              } else {
                amt = val + (c.id === 'deductions' ? lop : 0);
              }
            }
            if (c.type === 'earning') gross += amt;
            else totalDeductions += amt;
          });
          const net = Math.max(0, gross - totalDeductions);

          merged.push({
            id: `virtual-${staffRecord.id}-${month}`,
            userId: staffRecord.id,
            name: staffRecord.name,
            basic,
            hra,
            allowances,
            deductions,
            gross,
            net,
            status: 'Pending',
            month: month
          });
        }
      });
      
      // Deduplicate by month if both exist
      const uniqueSlipsMap: Record<string, PayslipRecord> = {};
      merged.forEach(s => {
        uniqueSlipsMap[s.month] = s;
      });
      
      setPayslips(Object.values(uniqueSlipsMap));
    } catch (err) {
      console.error('Error loading payslips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dbSyncCompleted) {
      loadPayslips();
    }
  }, [user, dbSyncCompleted]);

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

  const getUserSalaries = () => {
    if (!user) return {};
    if (staffSalaries[user.id]) return staffSalaries[user.id];
    
    const targetName = user.name;
    const foundKey = Object.keys(staffSalaries).find(
      (k) => isNameMatch(k, targetName)
    );
    if (foundKey) return staffSalaries[foundKey];
    
    return {};
  };

  const userSalaries = getUserSalaries();

  const getDynamicPayslipValues = (p: PayslipRecord) => {
    let earningsSum = 0;
    let deductionsSum = 0;
    const basicAmt = userSalaries['basic'] !== undefined ? userSalaries['basic'] : p.basic;
    const lop = getRowLop(p);
    
    const slipActiveComponents = components.filter(
      (c) => !c.month || c.month === 'All' || c.month === p.month
    );

    slipActiveComponents.forEach((c) => {
      const fallback = getFallbackAmt(c, p);
      const amt = getComponentAmt(c, userSalaries, basicAmt, fallback, lop);
      if (c.type === 'earning') earningsSum += amt;
      else deductionsSum += amt;
    });

    return {
      gross: earningsSum,
      deductions: deductionsSum,
      net: Math.max(0, earningsSum - deductionsSum)
    };
  };

  // Compute stats based on the active user
  const latestPayslip = payslips.find(p => p.status === 'Paid') || payslips[0];
  const activeBasic = userSalaries['basic'] !== undefined ? userSalaries['basic'] : (latestPayslip?.basic ?? 25000);
  
  const activeMonth = latestPayslip?.month || 'May 2026';
  const activeComponents = components.filter(
    (c) => !c.month || c.month === 'All' || c.month === activeMonth
  );

  // Calculate dynamic components
  let grossSalary = 0;
  let totalDeductionsSum = 0;
  const latestLop = latestPayslip ? getRowLop(latestPayslip) : 0;
  const salaryDetails = activeComponents.map(c => {
    const fallback = getFallbackAmt(c, latestPayslip || { basic: 25000, hra: 8000, allowances: 5000, deductions: 3000, gross: 38000 });
    const amt = getComponentAmt(c, userSalaries, activeBasic, fallback, latestLop);
    if (c.type === 'earning') grossSalary += amt;
    else totalDeductionsSum += amt;
    return { name: c.name, type: c.type, amount: amt };
  });

  const dynLatest = latestPayslip ? getDynamicPayslipValues(latestPayslip) : null;
  const netSalary = dynLatest ? dynLatest.net : Math.max(0, grossSalary - totalDeductionsSum);
  const deductionsToShow = dynLatest ? dynLatest.deductions : totalDeductionsSum;
  const paidPayslips = payslips.filter(p => p.status === 'Paid');
  const yearToDateEarnings = paidPayslips.reduce((acc, curr) => {
    const dyn = getDynamicPayslipValues(curr);
    return acc + dyn.net;
  }, 0);

  // Trend data for chart
  const trendData = payslips
    .slice()
    .reverse()
    .map(p => {
      const dyn = getDynamicPayslipValues(p);
      return {
        month: p.month.split(' ')[0],
        amount: dyn.net
      };
    });

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-[18px] font-bold text-[var(--tx)]">My Payroll Dashboard</h1>
        <p className="text-[12px] text-[var(--tx3)]">View your current salary structure, monthly payslips, and tax details.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        <KPICard label="Latest Net Salary" value={`₹${netSalary.toLocaleString()}`} sub="Gross with active components" icon={<Wallet size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Year to Date Paid" value={`₹${yearToDateEarnings.toLocaleString()}`} sub={`${paidPayslips.length} paid payslip(s)`} icon={<TrendingUp size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Total Active Deductions" value={`₹${deductionsToShow.toLocaleString()}`} sub="PF, TDS, and basic deductions" icon={<FileText size={15} />} iconBg="var(--red-bg)" iconColor="var(--red-tx)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-2.5 mb-2.5">
        {/* Salary History */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <div className="text-[13px] font-semibold text-[var(--tx)]">My Payslips History</div>
            {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px] min-w-[500px]">
              <thead>
                <tr className="border-b border-[var(--b)]">
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2">Month</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2">Gross Salary</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2">Deductions</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2">Net Pay</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2">Status</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((p) => {
                  const dyn = getDynamicPayslipValues(p);
                  return (
                    <tr key={p.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] transition-colors last:border-0">
                      <td className="px-2 py-2.5 font-semibold text-[var(--tx)]">{p.month}</td>
                      <td className="px-2 py-2.5 text-[var(--tx2)]">₹{dyn.gross.toLocaleString()}</td>
                      <td className="px-2 py-2.5 text-[var(--red-tx)]">-₹{dyn.deductions.toLocaleString()}</td>
                      <td className="px-2 py-2.5 font-semibold text-[var(--tx)]">₹{dyn.net.toLocaleString()}</td>
                      <td className="px-2 py-2.5">
                        {p.status === 'Paid' && <Badge variant="teal">Paid</Badge>}
                        {p.status === 'Pending' && <Badge variant="amber">Pending</Badge>}
                        {p.status === 'On Hold' && <Badge variant="red">On Hold</Badge>}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <button
                          onClick={() => setSelectedSlip(p)}
                          className="text-[11px] text-[var(--blue-tx)] hover:underline cursor-pointer flex items-center justify-end gap-0.5"
                        >
                          <FileText size={11} /> Slip
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {payslips.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-[12px] text-[var(--tx3)]">
                      No payslips found for your account. Contact administration.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Active Salary Structure Card */}
        <div className="space-y-2.5">
          <Card>
            <div className="text-[13px] font-semibold text-[var(--tx)] mb-3">Active Salary Structure</div>
            <div className="space-y-2.5">
              {salaryDetails.map((detail, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 border-b border-[var(--b)] last:border-0">
                  <div>
                    <div className="text-[12px] font-medium text-[var(--tx)]">{detail.name}</div>
                    <div className="text-[10px] text-[var(--tx3)] uppercase">{detail.type}</div>
                  </div>
                  <span className={`text-[12px] font-semibold ${detail.type === 'deduction' ? 'text-[var(--red-tx)]' : 'text-[var(--tx)]'}`}>
                    {detail.type === 'deduction' ? '-' : ''}₹{detail.amount.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="bg-[var(--blue-bg)] rounded-xl p-3 flex justify-between items-center mt-2">
                <span className="text-[12px] font-bold text-[var(--blue-tx)]">Active Net (Monthly)</span>
                <span className="text-[14px] font-bold text-[var(--blue-tx)]">₹{netSalary.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Earnings Chart */}
          {trendData.length > 0 && (
            <Card>
              <div className="text-[12.5px] font-semibold text-[var(--tx)] mb-3">Net Pay Trend</div>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={trendData} barSize={20} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--b)" />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `₹${v/1000}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Net Pay']} cursor={{ fill: 'var(--surf2)' }} />
                    <Bar dataKey="amount" fill="var(--teal)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Detailed Payslip Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[460px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Payslip Details</div>
                <div className="text-[12px] text-[var(--tx3)]">{selectedSlip.month}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg cursor-pointer hover:bg-[var(--surf3)] text-[var(--tx)]"
                >
                  <Printer size={11} /> Print
                </button>
                <button
                  onClick={() => setSelectedSlip(null)}
                  className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="p-5" id="printable-payslip">
              <div className="text-center mb-4 pb-4 border-b border-[var(--b)]" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <img src={schoolLogo} alt="School Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                <div>
                  <div className="text-[14px] font-bold text-[var(--tx)]">{schoolName}</div>
                  <div className="text-[11px] text-[var(--tx3)]">{schoolAddress} · Salary Payslip</div>
                  <div className="text-[11px] text-[var(--tx3)]">{selectedSlip.month}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'Employee Name', value: selectedSlip.name },
                  { label: 'Role/Designation', value: selectedSlip.designation },
                  { label: 'Pay Month', value: selectedSlip.month },
                  { label: 'Payment Status', value: selectedSlip.status },
                ].map((item) => (
                  <div key={item.label} className="bg-[var(--surf2)] rounded-lg p-2.5">
                    <div className="text-[10.5px] text-[var(--tx3)]">{item.label}</div>
                    <div className="text-[12px] font-semibold text-[var(--tx)]">{item.value}</div>
                  </div>
                ))}
              </div>

              {(() => {
                const foundKey = Object.keys(staffSalaries).find(k => isNameMatch(k, selectedSlip.name));
                const slipSalaries = (selectedSlip.userId ? staffSalaries[selectedSlip.userId] : undefined) || (foundKey ? staffSalaries[foundKey] : undefined) || {};
                const lop = getRowLop(selectedSlip);
                let earningsSum = 0;
                let deductionsSum = 0;
                const basicAmt = slipSalaries['basic'] !== undefined ? slipSalaries['basic'] : selectedSlip.basic;
                
                const slipActiveComponents = components.filter(
                  (c) => !c.month || c.month === 'All' || c.month === selectedSlip.month
                );

                slipActiveComponents.forEach((c) => {
                  const fallback = getFallbackAmt(c, selectedSlip);
                  const amt = getComponentAmt(c, slipSalaries, basicAmt, fallback, lop);
                  if (c.type === 'earning') earningsSum += amt;
                  else deductionsSum += amt;
                });

                const earnings = slipActiveComponents.filter(c => c.type === 'earning').map(c => ({
                  label: c.name,
                  amount: getComponentAmt(c, slipSalaries, basicAmt, getFallbackAmt(c, selectedSlip), lop)
                }));

                const deductions = slipActiveComponents.filter(c => c.type === 'deduction').map(c => ({
                  label: c.name,
                  amount: getComponentAmt(c, slipSalaries, basicAmt, getFallbackAmt(c, selectedSlip), lop)
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
                      <span className="text-[13px] font-bold text-[var(--blue-tx)]">Net In-Hand</span>
                      <span className="text-[18px] font-bold text-[var(--blue-tx)]">₹{netVal.toLocaleString()}</span>
                    </div>
                  </>
                );
              })()}
            </div>
            
            <div className="p-5 pt-0">
              <button
                onClick={() => setSelectedSlip(null)}
                className="w-full py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
