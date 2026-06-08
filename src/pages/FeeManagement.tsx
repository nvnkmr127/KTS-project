import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Users, FileText, Download, Plus, Search, X, Loader2 } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
import { TabBar } from '../components/ui';
import { api } from '../services/api';

interface StudentFeeDisplay {
  id: string;
  name: string;
  init: string;
  cls: string;
  fee: number;
  paid: number;
  bal: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  studentId: string;
}

const statusBadge = (s: 'Paid' | 'Partial' | 'Unpaid') => {
  if (s === 'Paid') return <Badge variant="teal">Paid</Badge>;
  if (s === 'Partial') return <Badge variant="amber">Partial</Badge>;
  return <Badge variant="red">Unpaid</Badge>;
};

export function FeeManagement() {
  const [tab, setTab] = useState(0);
  const [students, setStudents] = useState<StudentFeeDisplay[]>([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [collectStudent, setCollectStudent] = useState<StudentFeeDisplay | null>(null);
  const [studentFeesList, setStudentFeesList] = useState<any[]>([]);
  const [selectedFeeId, setSelectedFeeId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const loadFeesData = async () => {
    setLoading(true);
    try {
      const data = await api.getResources('students');
      const mapped = data.map((s: any, idx: number) => {
        const initials = s.name.split(' ').map((n: any) => n[0] ?? '').join('').toUpperCase().slice(0, 2);
        return {
          id: String(idx + 1),
          studentId: String(s.id),
          name: s.name,
          init: initials || 'ST',
          cls: `${s.class || '8'}${s.section || 'A'}`,
          fee: Number(s.fee_total) || 0,
          paid: Number(s.fee_paid) || 0,
          bal: Number(s.fee_balance) || 0,
          status: s.fee_status as 'Paid' | 'Partial' | 'Unpaid',
        };
      });
      setStudents(mapped);
    } catch (err) {
      console.error('Error loading students fee information:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeesData();
  }, []);

  const loadStudentFees = async (studentId: string) => {
    try {
      const fees = await api.getResources('student-fees', { student_id: studentId });
      setStudentFeesList(fees);
      if (fees.length > 0) {
        setSelectedFeeId(String(fees[0].id));
        const rem = Number(fees[0].amount) - Number(fees[0].paid_amount) - Number(fees[0].concession_amount);
        setPayAmount(String(Math.max(0, rem)));
      } else {
        setSelectedFeeId('');
        setPayAmount('');
      }
    } catch (err) {
      console.error('Error fetching fees for student:', err);
    }
  };

  useEffect(() => {
    if (collectStudent) {
      loadStudentFees(collectStudent.studentId);
    } else {
      setStudentFeesList([]);
    }
  }, [collectStudent]);

  const handleSelectFeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const feeId = e.target.value;
    setSelectedFeeId(feeId);
    const fee = studentFeesList.find((f) => String(f.id) === feeId);
    if (fee) {
      const rem = Number(fee.amount) - Number(fee.paid_amount) - Number(fee.concession_amount);
      setPayAmount(String(Math.max(0, rem)));
    }
  };

  const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFeeId || !payAmount) return;
    setProcessingPayment(true);
    try {
      const fee = studentFeesList.find((f) => String(f.id) === selectedFeeId);
      if (fee) {
        const currentPaid = Number(fee.paid_amount) || 0;
        await api.updateResource('student-fees', selectedFeeId, {
          paid_amount: currentPaid + Number(payAmount),
        });
      }
      setCollectStudent(null);
      loadFeesData();
    } catch (err) {
      console.error('Error recording payment:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleAssignFeeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const assignType = fd.get('assignType') as string;
    const categoryName = fd.get('category') as string;
    const amountVal = Number(fd.get('amount')) || 0;
    const dueDateVal = fd.get('dueDate') as string;

    const data: any = {
      category: categoryName,
      amount: amountVal,
      due_date: dueDateVal,
    };

    if (assignType === 'class') {
      data.class_name = fd.get('className') as string;
    } else {
      data.student_id = Number(fd.get('studentId'));
    }

    try {
      await api.createResource('student-fees', data);
      setShowAssignModal(false);
      loadFeesData();
    } catch (err) {
      console.error('Error assigning fee:', err);
    }
  };

  // Filter students based on search, tabs and class filters
  const filtered = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.cls.toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === 'All' || s.cls.startsWith(classFilter);
    const matchTab =
      tab === 0 ||
      (tab === 1 && s.status === 'Paid') ||
      (tab === 2 && s.status === 'Partial') ||
      (tab === 3 && s.status === 'Unpaid');

    return matchSearch && matchClass && matchTab;
  });

  const totalCollected = students.reduce((sum, s) => sum + s.paid, 0);
  const totalPending = students.reduce((sum, s) => sum + s.bal, 0);
  const paidCount = students.filter((s) => s.status === 'Paid').length;

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard
          label="Total Collected"
          value={`₹${(totalCollected / 100000).toFixed(2)}L`}
          sub="Term 2 · 2026"
          icon={<CheckCircle size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
        />
        <KPICard
          label="Pending"
          value={`₹${(totalPending / 100000).toFixed(2)}L`}
          sub={`${students.filter(s => s.bal > 0).length} students`}
          icon={<Clock size={15} />}
          iconBg="var(--red-bg)"
          iconColor="var(--red-tx)"
        />
        <KPICard
          label="Paid Students"
          value={paidCount}
          sub={`Out of ${students.length}`}
          icon={<Users size={15} />}
          iconBg="var(--amber-bg)"
          iconColor="var(--amber-tx)"
        />
        <KPICard
          label="Receipts Total"
          value={students.length}
          sub="Active students"
          icon={<FileText size={15} />}
          iconBg="var(--blue-bg)"
          iconColor="var(--blue-tx)"
        />
      </div>

      <Card className="mb-2.5">
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center mb-3">
          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--tx)]">
            Fee Collection Directory {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-2.5 py-1 text-[11px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg text-[var(--tx)] hover:bg-[var(--surf3)] transition-colors cursor-pointer">
              <Download size={11} /> Export
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-[var(--blue)] text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Plus size={11} /> Assign Fee
            </button>
          </div>
        </div>

        <TabBar
          tabs={['All Students', 'Paid', 'Partial', 'Unpaid']}
          active={tab}
          onChange={setTab}
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3 mt-3">
          <div className="flex items-center gap-1.5 flex-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx3)]">
            <Search size={12} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student by name or class..."
              className="flex-1 bg-transparent text-[12px] text-[var(--tx)] placeholder:text-[var(--tx3)] outline-none"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] w-full sm:w-32 cursor-pointer outline-none"
          >
            <option value="All">All classes</option>
            {['6', '7', '8', '9', '10'].map((c) => (
              <option key={c} value={c}>{`Class ${c}`}</option>
            ))}
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
              {filtered.map((s, index) => (
                <tr key={s.studentId} className="hover:bg-[var(--surf2)] transition-colors group">
                  <td className="px-2 py-2 text-[var(--tx3)]">{index + 1}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar initials={s.init} bg="var(--blue-bg)" color="var(--blue-tx)" />
                      <span className="font-medium text-[var(--tx)]">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-[var(--tx2)]">Class {s.cls}</td>
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
                    {s.status === 'Paid' ? (
                      <span className="text-[11px] text-[var(--tx3)]">No Dues</span>
                    ) : (
                      <button
                        onClick={() => setCollectStudent(s)}
                        className="text-[11px] text-[var(--blue-tx)] hover:underline cursor-pointer font-medium"
                      >
                        Collect Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-[12px] text-[var(--tx3)]">
                    No student fee records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Assign Fee Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAssignFeeSubmit} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[420px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">Assign New Fee</div>
              <button type="button" onClick={() => setShowAssignModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Toggle target */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Assign Target *</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-center gap-2 p-2 bg-[var(--surf2)] border border-[var(--b)] rounded-lg cursor-pointer text-[12px]">
                    <input type="radio" name="assignType" value="student" defaultChecked className="accent-[var(--blue)]" />
                    <span>Single Student</span>
                  </label>
                  <label className="flex items-center justify-center gap-2 p-2 bg-[var(--surf2)] border border-[var(--b)] rounded-lg cursor-pointer text-[12px]">
                    <input type="radio" name="assignType" value="class" className="accent-[var(--blue)]" />
                    <span>Whole Class</span>
                  </label>
                </div>
              </div>

              {/* Conditional targets */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Select Student</label>
                <select name="studentId" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]">
                  {students.map((s) => (
                    <option key={s.studentId} value={s.studentId}>{s.name} ({s.cls})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Select Class (For Bulk Assignment)</label>
                <select name="className" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]">
                  {['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A'].map((cls) => (
                    <option key={cls} value={cls}>Class {cls}</option>
                  ))}
                </select>
              </div>

              {/* Fee category details */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Fee Category / Title *</label>
                <input name="category" required defaultValue="Tuition Fee - Term 2" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Tuition Fee" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Amount (₹) *</label>
                  <input type="number" name="amount" required defaultValue="8500" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Due Date *</label>
                  <input type="date" name="dueDate" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer">Assign Dues</button>
            </div>
          </form>
        </div>
      )}

      {/* Collect Payment Modal */}
      {collectStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleRecordPayment} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[420px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Collect Student Fee</div>
                <div className="text-[12px] text-[var(--tx3)]">{collectStudent.name} (Class {collectStudent.cls})</div>
              </div>
              <button type="button" onClick={() => setCollectStudent(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              {studentFeesList.length === 0 ? (
                <div className="text-center py-6 text-[12px] text-[var(--tx3)]">
                  Loading assigned fee records...
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Select Fee Dues *</label>
                    <select
                      value={selectedFeeId}
                      onChange={handleSelectFeeChange}
                      required
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                    >
                      {studentFeesList.map((f) => {
                        const rem = Number(f.amount) - Number(f.paid_amount) - Number(f.concession_amount);
                        return (
                          <option key={f.id} value={f.id}>
                            {f.feeCategory?.name || 'School Fee'} (Due: ₹{rem.toLocaleString()})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Amount to Record (₹) *</label>
                    <input
                      type="number"
                      required
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button type="button" onClick={() => setCollectStudent(null)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] cursor-pointer">Cancel</button>
              <button
                type="submit"
                disabled={processingPayment || studentFeesList.length === 0}
                className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer disabled:opacity-50"
              >
                {processingPayment ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
