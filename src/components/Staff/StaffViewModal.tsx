import React from 'react';
import { ArrowLeft, Calendar, FileText, Printer, History, Plus, UserCheck, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../Card';
import { Badge } from '../Badge';

interface StaffViewModalProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modal: any;
  onClose: () => void;
  activeTab: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setActiveTab: (tab: 'info' | 'leaves' | 'attendance' | 'salary' | 'slips') => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leaveRequests: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadedDocs: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSelectedSlip: (slip: any) => void;
    attStartDate: string;
  attEndDate: string;
  manualAttendance: Record<string, Record<string, string>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  biometricPunches: any[];
  setAttStartDate: (val: string) => void;
  setAttEndDate: (val: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAttPage: (val: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSelectedDocPreview: (doc: any) => void;
  attPage: number;
  staffSalaries: Record<string, Record<string, number>>;
  setNewDocName: (val: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setNewDocFile: (val: any) => void;
  setAddDocModalOpen: (val: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payslips: any[];
}

export function StaffViewModal({
  modal,
  onClose,
  activeTab,
  setActiveTab,
  leaveRequests,
  uploadedDocs,
    setSelectedSlip,
    attStartDate,
  attEndDate,
  manualAttendance,
  biometricPunches,
  setAttStartDate,
  setAttEndDate,
  setAttPage,
  setSelectedDocPreview,
  attPage,
  staffSalaries,
  payslips,
  setNewDocName,
  setNewDocFile,
  setAddDocModalOpen
}: StaffViewModalProps) {
  if (modal?.type !== 'view' || !modal.staff) return null;

  return (
        <div className="space-y-3">
          {/* Back Navigation */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => onClose()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg cursor-pointer hover:bg-[var(--surf3)] text-[var(--tx)] font-semibold transition-colors"
            >
              <ArrowLeft size={13} /> Back to Staff Directory
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3.5">
            {/* Left Column - Detailed tabbed content */}
            <Card className="flex flex-col min-w-0">
              {/* Profile Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-[var(--b)] mb-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--purple-bg)] flex items-center justify-center text-[18px] font-bold text-[var(--purple-tx)]">
                  {modal.staff.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[var(--tx)]">{modal.staff.name}</h2>
                  <p className="text-[11.5px] text-[var(--tx3)]">{modal.staff.designation} · {modal.staff.department}</p>
                  <div className="mt-1"><Badge variant={modal.staff.status === 'Active' ? 'teal' : 'amber'}>{modal.staff.status}</Badge></div>
                </div>
              </div>

              {/* Sub Navigation Tabs */}
              <div className="flex border-b border-[var(--b)] mb-4 overflow-x-auto">
                {[
                  { id: 'info', label: 'Info', icon: <UserCheck size={13} /> },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  { id: 'leaves', label: 'Leaves', icon: <Calendar size={13} /> },
                  { id: 'attendance', label: 'Attendance Log', icon: <History size={13} /> },
                  { id: 'salary', label: 'Salary Structure', icon: <Wallet size={13} /> },
                  { id: 'slips', label: 'Pay Slips', icon: <FileText size={13} /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 py-2.5 px-4 text-[12px] font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-[var(--blue)] text-[var(--blue-tx)] bg-[var(--surf)]'
                        : 'border-transparent text-[var(--tx3)] hover:text-[var(--tx2)]'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="flex-1">
                {/* Info Tab */}
                {activeTab === 'info' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { label: 'Category', value: modal.staff.category || 'Teaching' },
                        { label: 'Biometric Employee Code', value: modal.staff.biometric_employee_code || 'Not Mapped' },
                        { label: 'Subject / Assigned Route', value: modal.staff.subject ?? 'N/A' },
                        { label: 'Join Date', value: modal.staff.joinDate },
                        { label: 'Phone', value: modal.staff.phone },
                        { label: 'Email', value: modal.staff.email },
                        { label: 'Attendance Average', value: `${modal.staff.attendance}%` },
                        { label: 'Monthly Salary', value: `₹${modal.staff.salary?.toLocaleString()}` },
                        { label: 'Qualifications', value: modal.staff.qualifications || 'N/A' },
                      ].map((item) => (
                        <div key={item.label} className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3">
                          <div className="text-[10px] text-[var(--tx3)] mb-0.5">{item.label}</div>
                          <div className="text-[12px] font-semibold text-[var(--tx)]">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] text-[var(--tx3)] font-medium">Submitted Documents (Click to Preview)</div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewDocName('');
                            setNewDocFile(null);
                            setAddDocModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-[var(--blue-tx)] hover:underline cursor-pointer flex items-center gap-1 bg-transparent border-0 outline-none"
                        >
                          <Plus size={10} /> Add Other Document
                        </button>
                      </div>

                      {(() => {
                        const staffUploaded = uploadedDocs[modal.staff.id] || {};
                        const docsList = Object.keys(staffUploaded);
                        
                        if (docsList.length === 0) {
                          return (
                            <div className="text-center py-5 text-[11px] text-[var(--tx3)] italic bg-[var(--surf)] border border-[var(--b)] rounded-lg">
                              no submitted documents
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {docsList.map((doc) => (
                              <div
                                key={doc}
                                onClick={() => setSelectedDocPreview(doc)}
                                className="flex items-center gap-2 bg-[var(--surf)] border border-[var(--b)] rounded-lg p-2.5 text-[11px] text-[var(--tx2)] cursor-pointer hover:border-[var(--blue)] hover:bg-[var(--surf2)] hover:text-[var(--blue-tx)] transition-all group"
                              >
                                <FileText size={11} className="text-[var(--tx3)] group-hover:text-[var(--blue)]" />
                                <span className="truncate font-semibold">{doc}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Leaves Tab */}
                {activeTab === 'leaves' && (() => {
                  const staffLeaves = leaveRequests.filter(
                    (l) =>
                      l.staffId === modal.staff!.id ||
                      (l.staffName || '').toLowerCase() === (modal.staff!.name || '').toLowerCase()
                  );
                  return (
                    <div className="space-y-2">
                      <div className="text-[12px] font-semibold text-[var(--tx)] mb-2">Leave Request History</div>
                      {staffLeaves.length === 0 ? (
                        <div className="text-center py-8 text-[11.5px] text-[var(--tx3)]">No leave requests found for this staff member.</div>
                      ) : (
                        staffLeaves.map((l) => (
                          <div key={l.id} className="p-3 bg-[var(--surf2)] border border-[var(--b)] rounded-xl flex items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <Badge variant={l.type === 'Sick Leave' ? 'red' : l.type === 'Emergency Leave' ? 'coral' : l.type === 'Earned Leave' ? 'teal' : 'blue'}>
                                  {l.type}
                                </Badge>
                                <span className="text-[10.5px] text-[var(--tx3)]">({l.days} day{l.days > 1 ? 's' : ''})</span>
                              </div>
                              <div className="text-[11.5px] text-[var(--tx)] font-medium">
                                {l.from} → {l.to}
                              </div>
                              <div className="text-[10.5px] text-[var(--tx3)] mt-0.5">{l.reason}</div>
                              {l.adminNotes && (
                                <div className="text-[10px] text-red-500 bg-red-50 dark:bg-red-955/20 px-2 py-0.5 rounded mt-1.5">
                                  Rejection Note: {l.adminNotes}
                                </div>
                              )}
                            </div>
                            <Badge variant={l.status === 'Approved' ? 'teal' : l.status === 'Pending' ? 'amber' : 'red'}>
                              {l.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()}

                {/* Attendance Tab */}
                {activeTab === 'attendance' && (() => {
                  // Generate days list based on selected date range
                  const days: string[] = [];
                  const start = new Date(attStartDate);
                  const end = new Date(attEndDate);
                  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    const current = new Date(end);
                    let count = 0;
                    while (current >= start && count < 366) {
                      days.push(current.toISOString().slice(0, 10));
                      current.setDate(current.getDate() - 1);
                      count++;
                    }
                  }

                  let presentCount = 0;
                  let absentCount = 0;
                  let leaveCount = 0;
                  let halfDayCount = 0;

                  const logs = days.map((dateStr) => {
                    const manualStatus = manualAttendance[dateStr]?.[modal.staff!.id];
                    let status: 'Present' | 'Absent' | 'Leave' | 'Half Day' = 'Present';
                    
                    if (manualStatus === 'Leave') {
                      status = 'Leave';
                      leaveCount++;
                    } else {
                      const punches = biometricPunches.filter(
                        (p) => p.staffId === modal.staff!.id && p.timestamp.startsWith(dateStr)
                      );
                      if (punches.length === 0) {
                        status = manualStatus === 'Absent' ? 'Absent' : 'Absent';
                        if (status === 'Absent') absentCount++;
                      } else if (punches.length === 1) {
                        status = 'Half Day';
                        halfDayCount++;
                      } else {
                        status = 'Present';
                        presentCount++;
                      }
                    }

                    return { dateStr, status };
                  });

                  // Pagination variables
                  const ITEMS_PER_PAGE = 7;
                  const totalItems = logs.length;
                  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
                  // Ensure attPage is in bounds
                  const currentPage = Math.min(attPage, totalPages);
                  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
                  const paginatedLogs = logs.slice(startIndex, endIndex);

                  return (
                    <div className="space-y-4">
                      {/* Date Filter Bar */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3">
                        <div>
                          <div className="text-[12px] font-bold text-[var(--tx)]">Filter Log Range</div>
                          <div className="text-[10px] text-[var(--tx3)]">Select custom start and end dates</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--tx2)]">
                            <span>From:</span>
                            <input
                              type="date"
                              value={attStartDate}
                              onChange={(e) => {
                                setAttStartDate(e.target.value);
                                setAttPage(1);
                              }}
                              className="bg-[var(--surf)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--tx)] outline-none focus:border-[var(--blue)] cursor-pointer"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--tx2)]">
                            <span>To:</span>
                            <input
                              type="date"
                              value={attEndDate}
                              onChange={(e) => {
                                setAttEndDate(e.target.value);
                                setAttPage(1);
                              }}
                              className="bg-[var(--surf)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--tx)] outline-none focus:border-[var(--blue)] cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-2.5">
                        {[
                          { label: 'Present', value: presentCount, color: 'text-[var(--teal-tx)] bg-[var(--teal-bg)]' },
                          { label: 'Absent', value: absentCount, color: 'text-[var(--red-tx)] bg-[var(--red-bg)]' },
                          { label: 'Leave', value: leaveCount, color: 'text-[var(--amber-tx)] bg-[var(--amber-bg)]' },
                          { label: 'Half Day', value: halfDayCount, color: 'text-[var(--blue-tx)] bg-[var(--blue-bg)]' },
                        ].map((stat) => (
                          <div key={stat.label} className={`rounded-xl p-2.5 text-center ${stat.color}`}>
                            <div className="text-[14px] font-bold">{stat.value}</div>
                            <div className="text-[9.5px] font-medium opacity-80">{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-[12px] font-semibold text-[var(--tx)]">Log Entries ({totalItems} days total)</div>
                      </div>
                      
                      <div className="border border-[var(--b)] rounded-xl overflow-hidden bg-[var(--surf)]">
                        <table className="w-full border-collapse text-[11.5px]">
                          <thead>
                            <tr className="bg-[var(--surf2)] border-b border-[var(--b)] text-[var(--tx3)]">
                              <th className="text-left px-3 py-2">Date</th>
                              <th className="text-left px-3 py-2">Status</th>
                              <th className="text-left px-3 py-2">Biometric Punches</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedLogs.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="text-center py-6 text-[11.5px] text-[var(--tx3)]">
                                  No attendance logs found in this date range.
                                </td>
                              </tr>
                            ) : (
                              paginatedLogs.map((log) => {
                                const datePunches = biometricPunches.filter(
                                  (p) => p.staffId === modal.staff!.id && p.timestamp.startsWith(log.dateStr)
                                );
                                const times = datePunches.map(p => p.timestamp.split(' ')[1] || '').join(', ');
                                return (
                                  <tr key={log.dateStr} className="border-b border-[var(--b)] last:border-0 hover:bg-[var(--surf2)]/40">
                                    <td className="px-3 py-2 text-[var(--tx)] font-medium">{log.dateStr}</td>
                                    <td className="px-3 py-2">
                                      <Badge variant={log.status === 'Present' ? 'teal' : log.status === 'Leave' ? 'amber' : log.status === 'Half Day' ? 'blue' : 'red'}>
                                        {log.status}
                                      </Badge>
                                    </td>
                                    <td className="px-3 py-2 font-mono text-[10.5px] text-[var(--tx3)]">
                                      {times || (log.status === 'Present' ? '09:00 AM, 05:00 PM (Manual)' : log.status === 'Half Day' ? '09:00 AM (Manual)' : 'None')}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>

                        {/* Pagination Footer */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between px-3 py-2 bg-[var(--surf2)] border-t border-[var(--b)] text-[11px] text-[var(--tx2)]">
                            <div>
                              Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                              <span className="font-semibold">{endIndex}</span> of{' '}
                              <span className="font-semibold">{totalItems}</span> records
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setAttPage(currentPage - 1)}
                                className="px-2.5 py-1 border border-[var(--b)] bg-[var(--surf)] text-[var(--tx)] rounded-lg hover:bg-[var(--surf3)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-all font-medium"
                              >
                                Previous
                              </button>
                              <span className="font-medium">
                                Page {currentPage} of {totalPages}
                              </span>
                              <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setAttPage(currentPage + 1)}
                                className="px-2.5 py-1 border border-[var(--b)] bg-[var(--surf)] text-[var(--tx)] rounded-lg hover:bg-[var(--surf3)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-all font-medium"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Salary Tab */}
                {activeTab === 'salary' && (() => {
                  const salaries = staffSalaries[modal.staff!.id] || staffSalaries[modal.staff!.name] || {};
                  const basicSalary = modal.staff!.salary || 45000;
                  
                  // Get structured breakdown
                  const basic = salaries['basic'] !== undefined ? salaries['basic'] : Math.round(basicSalary * 0.65);
                  const hra = salaries['hra'] !== undefined ? salaries['hra'] : Math.round(basicSalary * 0.20);
                  const allowances = salaries['allowances'] !== undefined ? salaries['allowances'] : (basicSalary - basic - hra);
                  const deductions = salaries['deductions'] !== undefined ? salaries['deductions'] : 3000;
                  
                  const earnings = [
                    { name: 'Basic Salary', amount: basic },
                    { name: 'House Rent Allowance (HRA)', amount: hra },
                    { name: 'Special Allowances', amount: allowances }
                  ];
                  const gross = basic + hra + allowances;
                  const net = Math.max(0, gross - deductions);

                  return (
                    <div className="space-y-4">
                      <div className="text-[12px] font-semibold text-[var(--tx)]">Salary Structure Components</div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Earnings */}
                        <div className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-4">
                          <div className="text-[11px] font-semibold text-[var(--teal-tx)] mb-2.5">Monthly Earnings</div>
                          <div className="space-y-2 text-[12px]">
                            {earnings.map(e => (
                              <div key={e.name} className="flex justify-between">
                                <span className="text-[var(--tx3)]">{e.name}</span>
                                <span className="font-semibold text-[var(--tx)]">₹{e.amount.toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="flex justify-between pt-2 border-t border-[var(--b)] font-bold">
                              <span className="text-[var(--tx)]">Gross Salary</span>
                              <span className="text-[var(--teal-tx)]">₹{gross.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Deductions */}
                        <div className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-4">
                          <div className="text-[11px] font-semibold text-[var(--red-tx)] mb-2.5">Monthly Deductions</div>
                          <div className="space-y-2 text-[12px]">
                            <div className="flex justify-between">
                              <span className="text-[var(--tx3)]">Standard Deductions (PF, Tax)</span>
                              <span className="font-semibold text-[var(--red-tx)]">₹{deductions.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-[var(--b)] font-bold">
                              <span className="text-[var(--tx)]">Total Deductions</span>
                              <span className="text-[var(--red-tx)]">₹{deductions.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[var(--blue-bg)] border border-[var(--blue-tx)]/10 rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <div className="text-[13px] font-bold text-[var(--blue-tx)]">Net In-Hand Salary</div>
                          <div className="text-[10px] text-[var(--blue-tx)] opacity-80 mt-0.5">Calculated take home pay per month</div>
                        </div>
                        <div className="text-[20px] font-bold text-[var(--blue-tx)]">₹{net.toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Slips Tab */}
                {activeTab === 'slips' && (() => {
                  // Filter payslips for this employee
                  const staffSlips = payslips.filter(
                    (p) =>
                      p.user_id === Number(modal.staff!.id) ||
                      (p.name || '').toLowerCase() === (modal.staff!.name || '').toLowerCase()
                  );

                  // Pre-populate mock payslips if none exist in the database, so we have records to display/print
                  const displayedSlips = staffSlips.length > 0 ? staffSlips.map(p => {
                    const gross = Number(p.gross_salary) || 0;
                    const deductions = Number(p.total_deductions) || 0;
                    const net = Number(p.net_salary) || 0;
                    return {
                      id: String(p.id),
                      name: modal.staff!.name,
                      designation: modal.staff!.designation,
                      basic: Math.round(gross * 0.65),
                      hra: Math.round(gross * 0.20),
                      allowances: gross - Math.round(gross * 0.65) - Math.round(gross * 0.20),
                      deductions,
                      gross,
                      net,
                      status: p.status === 'paid' ? 'Paid' : 'Pending',
                      month: `${p.month} ${p.year}`,
                    };
                  }) : [];

                  return (
                    <div className="space-y-4">
                      <div className="text-[12px] font-semibold text-[var(--tx)]">Salary Slips & Paid Records</div>
                      <div className="border border-[var(--b)] rounded-xl overflow-hidden">
                        <table className="w-full border-collapse text-[11.5px]">
                          <thead>
                            <tr className="bg-[var(--surf2)] border-b border-[var(--b)] text-[var(--tx3)]">
                              <th className="text-left px-3 py-2">Month</th>
                              <th className="text-left px-3 py-2">Net Salary</th>
                              <th className="text-left px-3 py-2">Status</th>
                              <th className="text-center px-3 py-2">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayedSlips.map((slip) => (
                              <tr key={slip.id} className="border-b border-[var(--b)] last:border-0 hover:bg-[var(--surf2)]/40">
                                <td className="px-3 py-2.5 text-[var(--tx)] font-medium">{slip.month}</td>
                                <td className="px-3 py-2.5 text-[var(--tx2)] font-semibold">₹{slip.net.toLocaleString()}</td>
                                <td className="px-3 py-2.5">
                                  <Badge variant={slip.status === 'Paid' ? 'teal' : 'amber'}>{slip.status}</Badge>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSlip(slip)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[10.5px] border border-[var(--blue-tx)]/20 bg-[var(--blue-bg)] text-[var(--blue-tx)] rounded-lg hover:opacity-90 cursor-pointer transition-all"
                                  >
                                    <Printer size={10} /> View & Print
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Card>

            {/* Right Column - Attendance Pie Graph & Stats */}
            <div className="space-y-3.5">
              <Card>
                <h3 className="text-[12.5px] font-bold text-[var(--tx)] mb-3 flex items-center gap-1.5">
                  <History size={14} className="text-[var(--blue-tx)]" /> Attendance Breakdown (Selected Range)
                </h3>

                {(() => {
                  // Compute stats for Pie Chart using selected date range
                  const days: string[] = [];
                  const start = new Date(attStartDate);
                  const end = new Date(attEndDate);
                  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    const current = new Date(end);
                    let count = 0;
                    while (current >= start && count < 366) {
                      days.push(current.toISOString().slice(0, 10));
                      current.setDate(current.getDate() - 1);
                      count++;
                    }
                  }

                  let presentCount = 0;
                  let absentCount = 0;
                  let leaveCount = 0;
                  let halfDayCount = 0;

                  days.forEach((dateStr) => {
                    const manualStatus = manualAttendance[dateStr]?.[modal.staff!.id];
                    if (manualStatus === 'Leave') {
                      leaveCount++;
                    } else {
                      const punches = biometricPunches.filter(
                        (p) => p.staffId === modal.staff!.id && p.timestamp.startsWith(dateStr)
                      );
                      if (punches.length === 0) {
                        if (manualStatus === 'Absent') absentCount++;
                        else absentCount++;
                      } else if (punches.length === 1) {
                        halfDayCount++;
                      } else {
                        presentCount++;
                      }
                    }
                  });

                  const totalDays = presentCount + absentCount + leaveCount + halfDayCount;
                  const presentRate = totalDays > 0 ? Math.round(((presentCount + halfDayCount * 0.5) / totalDays) * 100) : 100;

                  const pieData = [
                    { name: 'Present', value: presentCount, color: 'var(--teal)' },
                    { name: 'Absent', value: absentCount, color: 'var(--red)' },
                    { name: 'Leave', value: leaveCount, color: 'var(--amber)' },
                    { name: 'Half Day', value: halfDayCount, color: 'var(--blue)' },
                  ].filter(d => d.value > 0);

                  return (
                    <div className="space-y-4">
                      <div className="flex justify-center items-center h-[200px] relative">
                        {pieData.length === 0 ? (
                          <div className="text-[11.5px] text-[var(--tx3)]">No attendance logs found</div>
                        ) : (
                          <>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={75}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(v) => [`${v} day(s)`, 'Count']}
                                  contentStyle={{
                                    backgroundColor: 'var(--surf)',
                                    borderColor: 'var(--b)',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    color: 'var(--tx)',
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute flex flex-col items-center justify-center">
                              <span className="text-[16px] font-bold text-[var(--tx)]">{presentRate}%</span>
                              <span className="text-[9.5px] text-[var(--tx3)] font-medium">Rate</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Custom Legend */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-[var(--b)] pt-3">
                        {[
                          { label: 'Present', value: presentCount, color: 'bg-[var(--teal)]' },
                          { label: 'Absent', value: absentCount, color: 'bg-[var(--red)]' },
                          { label: 'Leave', value: leaveCount, color: 'bg-[var(--amber)]' },
                          { label: 'Half Day', value: halfDayCount, color: 'bg-[var(--blue)]' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-1.5 justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                              <span className="text-[var(--tx3)]">{item.label}</span>
                            </div>
                            <span className="font-semibold text-[var(--tx)]">{item.value} d</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </Card>

              {/* General Summary */}
              <Card className="bg-[var(--blue-bg)]/20 border-[var(--blue-tx)]/10">
                <h4 className="text-[12.5px] font-bold text-[var(--tx)] mb-1.5">Quick Summary</h4>
                <p className="text-[11.5px] text-[var(--tx2)] leading-relaxed">
                  This dashboard shows full profile details, leave history, biometric logs, and payroll records for <strong>{modal.staff.name}</strong>. You can print processed salary slips directly from the <strong>Pay Slips</strong> tab.
                </p>
              </Card>
            </div>
          </div>
        </div>
  );
}