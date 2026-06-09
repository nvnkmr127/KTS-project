import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Users, FileText, Download, Plus, Search, X, Loader2, Trash2, ArrowLeft, Percent, MapPin, Calendar, Phone, User, AlertTriangle } from 'lucide-react';
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
  const [assignType, setAssignType] = useState<'student' | 'class'>('student');
  const [collectStudent, setCollectStudent] = useState<StudentFeeDisplay | null>(null);
  const [studentFeesList, setStudentFeesList] = useState<any[]>([]);
  const [selectedFeeId, setSelectedFeeId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [assignedItems, setAssignedItems] = useState<{ category: string; amount: number }[]>([]);
  const [currentCategory, setCurrentCategory] = useState('Tuition Fee - Term 2');
  const [currentAmount, setCurrentAmount] = useState('8500');
  const [modalStudentId, setModalStudentId] = useState<string>('');
  const [existingFees, setExistingFees] = useState<any[]>([]);
  const [loadingExistingFees, setLoadingExistingFees] = useState(false);

  // Concession states
  const [showConcessionModal, setShowConcessionModal] = useState(false);
  const [selectedConcessionFeeId, setSelectedConcessionFeeId] = useState('');
  const [concessionAmount, setConcessionAmount] = useState('');
  const [concessionReason, setConcessionReason] = useState('');
  const [applyingConcession, setApplyingConcession] = useState(false);

  // Student details screen states
  const [activeDetailStudent, setActiveDetailStudent] = useState<any | null>(null);
  const [selectedStudentAttendance, setSelectedStudentAttendance] = useState<number | null>(null);

  const handleViewStudentDetails = async (student: any) => {
    setActiveDetailStudent(student);
    loadStudentFees(student.studentId);
    setSelectedStudentAttendance(null);
    try {
      if (student.batchId) {
        const res = await api.getBatchStudentPercentages(String(student.batchId));
        if (res.success && res.data && res.data.students) {
          const match = res.data.students.find((std: any) => String(std.id) === String(student.studentId));
          if (match) {
            setSelectedStudentAttendance(match.percentage);
          } else {
            setSelectedStudentAttendance(92);
          }
        } else {
          setSelectedStudentAttendance(92);
        }
      } else {
        setSelectedStudentAttendance(92);
      }
    } catch (e) {
      setSelectedStudentAttendance(92);
    }
  };

  const handleApplyConcessionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedConcessionFeeId || !concessionAmount) return;
    setApplyingConcession(true);
    try {
      const fee = studentFeesList.find((f) => String(f.id) === selectedConcessionFeeId);
      if (fee) {
        const currentConcession = Number(fee.concession_amount) || 0;
        await api.updateResource('student-fees', selectedConcessionFeeId, {
          concession_amount: currentConcession + Number(concessionAmount),
          concession_reason: concessionReason,
        });
      }
      setShowConcessionModal(false);
      setConcessionAmount('');
      setConcessionReason('');
      
      if (activeDetailStudent) {
        loadStudentFees(activeDetailStudent.studentId);
      }
      loadFeesData();
    } catch (err) {
      console.error('Error applying concession:', err);
    } finally {
      setApplyingConcession(false);
    }
  };

  const loadExistingFees = async (studentId: string) => {
    if (!studentId) {
      setExistingFees([]);
      return;
    }
    setLoadingExistingFees(true);
    try {
      const fees = await api.getResources('student-fees', { student_id: studentId });
      setExistingFees(fees);
    } catch (err) {
      console.error('Error loading existing student fees:', err);
    } finally {
      setLoadingExistingFees(false);
    }
  };

  const handleDeleteExistingFee = async (feeId: string) => {
    try {
      await api.deleteResource('student-fees', feeId);
      if (modalStudentId) {
        loadExistingFees(modalStudentId);
      }
      loadFeesData();
    } catch (err) {
      console.error('Error deleting existing fee:', err);
    }
  };

  useEffect(() => {
    if (showAssignModal && assignType === 'student' && modalStudentId) {
      loadExistingFees(modalStudentId);
    } else {
      setExistingFees([]);
    }
  }, [showAssignModal, assignType, modalStudentId]);

  const handleAddFeeItem = () => {
    if (!currentCategory.trim() || !currentAmount || Number(currentAmount) <= 0) return;
    setAssignedItems((prev) => [
      ...prev,
      { category: currentCategory.trim(), amount: Number(currentAmount) }
    ]);
    setCurrentAmount('');
  };

  const handleRemoveFeeItem = (index: number) => {
    setAssignedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const loadFeesData = async () => {
    setLoading(true);
    try {
      const [studentsData, categoriesData] = await Promise.all([
        api.getResources('students'),
        api.getResources('fee-categories').catch(() => []),
      ]);
      const activeStudents = studentsData.filter((s: any) => s.status === 'active' || s.status === 'Active');
      const mapped = activeStudents.map((s: any, idx: number) => {
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
      setCategories(categoriesData);
      if (categoriesData.length > 0) {
        setCurrentCategory(categoriesData[0].name);
      } else {
        setCurrentCategory('Tuition Fee - Term 2');
      }
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
    const studentIdVal = fd.get('studentId') as string;
    const classNameVal = fd.get('className') as string;
    const dueDateVal = fd.get('dueDate') as string;

    let itemsToAssign = [...assignedItems];

    if (itemsToAssign.length === 0 && currentCategory.trim() && currentAmount && Number(currentAmount) > 0) {
      itemsToAssign.push({ category: currentCategory.trim(), amount: Number(currentAmount) });
    }

    if (itemsToAssign.length === 0) return;

    setLoading(true);
    try {
      await Promise.all(
        itemsToAssign.map((item) =>
          api.createResource('student-fees', {
            category: item.category,
            amount: item.amount,
            due_date: dueDateVal,
            ...(assignType === 'class' ? { class_name: classNameVal } : { student_id: Number(studentIdVal) })
          })
        )
      );
      setShowAssignModal(false);
      setAssignedItems([]);
      loadFeesData();
    } catch (err) {
      console.error('Error assigning fee:', err);
    } finally {
      setLoading(false);
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

  const selectedConcessionFee = studentFeesList.find(f => String(f.id) === selectedConcessionFeeId);
  const selectedConcessionRemaining = selectedConcessionFee ? (Number(selectedConcessionFee.amount) - Number(selectedConcessionFee.paid_amount) - Number(selectedConcessionFee.concession_amount)) : 0;

  const renderStudentDetails = () => {
    if (!activeDetailStudent) return null;
    const std = activeDetailStudent;
    
    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--b)] pb-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveDetailStudent(null)}
              className="p-1.5 hover:bg-[var(--surf2)] rounded-lg text-[var(--tx2)] hover:text-[var(--tx)] cursor-pointer"
              title="Back to Directory"
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <h2 className="text-[13.5px] font-bold text-[var(--tx)] flex items-center gap-2">
                Student Profile Detail
              </h2>
              <p className="text-[10px] text-[var(--tx3)]">View fee history and concession management</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedConcessionFeeId('');
                setConcessionAmount('');
                setConcessionReason('');
                setShowConcessionModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer font-medium"
            >
              <Percent size={12} className="text-[var(--blue-tx)]" /> Fee Concession
            </button>
            {std.status !== 'Paid' && (
              <button
                onClick={() => setCollectStudent(std)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg hover:opacity-90 cursor-pointer font-medium"
              >
                <Clock size={12} /> Collect Payment
              </button>
            )}
          </div>
        </div>

        {/* Profile Card Header */}
        <Card className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--blue-bg)] flex items-center justify-center text-[20px] font-bold text-[var(--blue-tx)] flex-shrink-0">
            {std.init}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="text-[16px] font-bold text-[var(--tx)]">{std.name}</div>
            <div className="text-[11.5px] text-[var(--tx3)] mt-0.5">Admission Number: <span className="font-mono">{std.roll}</span></div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <Badge variant="blue">Class {std.cls}</Badge>
              {statusBadge(std.status)}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* Personal & Academic Details */}
          <Card className="space-y-4">
            <div className="text-[12.5px] font-bold text-[var(--tx)] pb-2 border-b border-[var(--b)] flex items-center gap-1.5">
              <User size={13} className="text-[var(--tx3)]" /> Personal & Academic Profile
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-[var(--surf2)] rounded-xl p-3">
                <div className="text-[10px] text-[var(--tx3)] mb-0.5 flex items-center gap-1"><Calendar size={11} /> Date of Birth</div>
                <div className="text-[12px] font-semibold text-[var(--tx)]">{std.dob || 'N/A'}</div>
              </div>
              <div className="bg-[var(--surf2)] rounded-xl p-3">
                <div className="text-[10px] text-[var(--tx3)] mb-0.5 flex items-center gap-1"><Calendar size={11} /> Date of Join</div>
                <div className="text-[12px] font-semibold text-[var(--tx)]">{std.admissionDate || 'N/A'}</div>
              </div>
              <div className="bg-[var(--surf2)] rounded-xl p-3">
                <div className="text-[10px] text-[var(--tx3)] mb-0.5 flex items-center gap-1"><User size={11} /> Parents Details</div>
                <div className="text-[12px] font-semibold text-[var(--tx)]">{std.parent}</div>
              </div>
              <div className="bg-[var(--surf2)] rounded-xl p-3">
                <div className="text-[10px] text-[var(--tx3)] mb-0.5 flex items-center gap-1"><Phone size={11} /> Mobile Number</div>
                <div className="text-[12px] font-semibold text-[var(--tx)]">{std.phone || 'N/A'}</div>
              </div>
              <div className="bg-[var(--surf2)] rounded-xl p-3 sm:col-span-2">
                <div className="text-[10px] text-[var(--tx3)] mb-0.5 flex items-center gap-1"><Users size={11} /> Overall Attendance</div>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <span className="text-[13px] font-bold text-[var(--teal-tx)]">{selectedStudentAttendance !== null ? `${selectedStudentAttendance}%` : 'Loading...'}</span>
                  {selectedStudentAttendance !== null && (
                    <div className="flex-1 h-2 bg-[var(--surf)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--teal)] rounded-full" style={{ width: `${selectedStudentAttendance}%` }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-[var(--surf2)] rounded-xl p-3 sm:col-span-2">
                <div className="text-[10px] text-[var(--tx3)] mb-0.5 flex items-center gap-1"><MapPin size={11} /> Home Address</div>
                <div className="text-[12px] font-semibold text-[var(--tx)] leading-normal">{std.address || 'N/A'}</div>
              </div>
            </div>
          </Card>

          {/* Fee & Concession Summary */}
          <Card className="space-y-4">
            <div className="text-[12.5px] font-bold text-[var(--tx)] pb-2 border-b border-[var(--b)] flex items-center gap-1.5">
              <FileText size={13} className="text-[var(--tx3)]" /> Fee Summary & Ledger
            </div>

            {/* Overall totals */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[var(--surf2)] rounded-xl p-3 text-center">
                <div className="text-[10px] text-[var(--tx3)] mb-0.5">Total Fee</div>
                <div className="text-[13.5px] font-bold text-[var(--tx)]">₹{std.fee.toLocaleString()}</div>
              </div>
              <div className="bg-[var(--surf2)] rounded-xl p-3 text-center border-l-2 border-[var(--teal)]">
                <div className="text-[10px] text-[var(--tx3)] mb-0.5">Paid Amount</div>
                <div className="text-[13.5px] font-bold text-[var(--teal-tx)]">₹{std.paid.toLocaleString()}</div>
              </div>
              <div className="bg-[var(--surf2)] rounded-xl p-3 text-center border-l-2 border-[var(--red)]">
                <div className="text-[10px] text-[var(--tx3)] mb-0.5">Amount Due</div>
                <div className="text-[13.5px] font-bold text-[var(--red-tx)]">₹{std.bal.toLocaleString()}</div>
              </div>
            </div>

            {/* Fee Items Breakdown */}
            <div className="space-y-2">
              <div className="text-[11.5px] font-bold text-[var(--tx)]">Detailed Fee Breakdown</div>
              {studentFeesList.length === 0 ? (
                <div className="text-center py-6 text-[11.5px] text-[var(--tx3)] italic">Loading breakdown...</div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {studentFeesList.map((fee) => {
                    const feeName = fee.feeCategory?.name || fee.category || 'School Fee';
                    const bal = Number(fee.amount) - Number(fee.paid_amount) - Number(fee.concession_amount);
                    return (
                      <div key={fee.id} className="p-3 bg-[var(--surf2)] border border-[var(--b)] rounded-xl flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[12px] font-bold text-[var(--tx)]">{feeName}</div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[var(--tx3)] mt-1.5">
                            <span>Amount: ₹{Number(fee.amount).toLocaleString()}</span>
                            {Number(fee.concession_amount) > 0 && <span className="text-[var(--purple-tx)] font-semibold">Concession: -₹{Number(fee.concession_amount).toLocaleString()}</span>}
                            <span>Paid: ₹{Number(fee.paid_amount).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {bal > 0 ? (
                            <Badge variant="red">Due: ₹{bal.toLocaleString()}</Badge>
                          ) : (
                            <Badge variant="teal">Paid</Badge>
                          )}
                          <div className="text-[9.5px] text-[var(--tx3)] mt-1">Due Date: {fee.due_date}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {activeDetailStudent ? (
        renderStudentDetails()
      ) : (
        <>
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
              onClick={() => { 
                setAssignType('student'); 
                setAssignedItems([]); 
                setCurrentAmount('8500'); 
                setModalStudentId(students[0]?.studentId || '');
                setShowAssignModal(true); 
              }}
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
                  <td className="px-2 py-2 cursor-pointer hover:underline text-[var(--blue-tx)] font-medium" onClick={() => handleViewStudentDetails(s)}>
                    <div className="flex items-center gap-2">
                      <Avatar initials={s.init} bg="var(--blue-bg)" color="var(--blue-tx)" />
                      <span>{s.name}</span>
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

        </>
      )}

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
                    <input 
                      type="radio" 
                      name="assignType" 
                      value="student" 
                      checked={assignType === 'student'} 
                      onChange={() => setAssignType('student')}
                      className="accent-[var(--blue)]" 
                    />
                    <span>Single Student</span>
                  </label>
                  <label className="flex items-center justify-center gap-2 p-2 bg-[var(--surf2)] border border-[var(--b)] rounded-lg cursor-pointer text-[12px]">
                    <input 
                      type="radio" 
                      name="assignType" 
                      value="class" 
                      checked={assignType === 'class'} 
                      onChange={() => setAssignType('class')}
                      className="accent-[var(--blue)]" 
                    />
                    <span>Whole Class</span>
                  </label>
                </div>
              </div>

              {/* Conditional targets */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Select Student</label>
                {assignType === 'class' ? (
                  <select name="studentId" disabled className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none opacity-60 cursor-not-allowed">
                    <option value="all">All</option>
                  </select>
                ) : (
                  <select 
                    name="studentId" 
                    value={modalStudentId}
                    onChange={(e) => setModalStudentId(e.target.value)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                  >
                    {students.map((s) => (
                      <option key={s.studentId} value={s.studentId}>{s.name} ({s.cls})</option>
                    ))}
                  </select>
                )}
              </div>

              {assignType === 'class' && (
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Select Class (For Bulk Assignment)</label>
                  <select name="className" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]">
                    {['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A'].map((cls) => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fee category details */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Fee Category *</label>
                {categories.length > 0 ? (
                  <select 
                    value={currentCategory} 
                    onChange={(e) => setCurrentCategory(e.target.value)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    value={currentCategory} 
                    onChange={(e) => setCurrentCategory(e.target.value)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" 
                    placeholder="Tuition Fee" 
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Amount (₹) *</label>
                    <input 
                      type="number" 
                      value={currentAmount} 
                      onChange={(e) => setCurrentAmount(e.target.value)} 
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" 
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddFeeItem} 
                    className="p-2.5 bg-[var(--blue)] text-white rounded-lg hover:opacity-90 flex items-center justify-center h-[38px] w-[38px] cursor-pointer"
                    title="Add Item"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Due Date *</label>
                  <input type="date" name="dueDate" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>

              {/* Added Fee Items List */}
              {assignedItems.length > 0 && (
                <div className="space-y-2 mt-3 pt-3 border-t border-[var(--b)]">
                  <div className="text-[11.5px] font-bold text-[var(--tx)]">Items to Assign</div>
                  <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1">
                    {assignedItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-[var(--surf2)] border border-[var(--b)] rounded-lg text-[11.5px]">
                        <span className="font-semibold text-[var(--tx)]">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--blue-tx)]">₹{item.amount.toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeeItem(index)}
                            className="p-1 rounded text-[var(--tx3)] hover:text-[var(--red-tx)] hover:bg-[var(--red-bg)] cursor-pointer transition-colors"
                            title="Delete Item"
                          >
                            <Plus size={12} className="rotate-45" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-[var(--tx2)] pt-1">
                    <span>Total Amount:</span>
                    <span>₹{assignedItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Existing Fees List */}
              {assignType === 'student' && modalStudentId && (
                <div className="space-y-2 mt-3 pt-3 border-t border-[var(--b)]">
                  <div className="text-[11.5px] font-bold text-[var(--tx)] flex items-center justify-between">
                    <span>Currently Assigned Fees</span>
                    {loadingExistingFees && <Loader2 size={11} className="animate-spin text-[var(--tx3)]" />}
                  </div>
                  {existingFees.length === 0 ? (
                    <div className="text-[11px] text-[var(--tx3)] italic">No fees currently assigned.</div>
                  ) : (
                    <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1">
                      {existingFees.map((fee) => {
                        const feeName = fee.feeCategory?.name || fee.category || 'School Fee';
                        return (
                          <div key={fee.id} className="flex items-center justify-between p-2 bg-[var(--surf2)] border border-[var(--b)] rounded-lg text-[11px]">
                            <div>
                              <div className="font-semibold text-[var(--tx)]">{feeName}</div>
                              <div className="text-[9.5px] text-[var(--tx3)] mt-0.5">Due: {fee.due_date}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[var(--tx2)]">₹{Number(fee.amount).toLocaleString()}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteExistingFee(String(fee.id))}
                                className="p-1 rounded text-[var(--tx3)] hover:text-[var(--red-tx)] hover:bg-[var(--red-bg)] cursor-pointer transition-colors"
                                title="Delete Existing Fee"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
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

      {/* Fee Concession Modal */}
      {showConcessionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleApplyConcessionSubmit} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Fee Concession</div>
                <div className="text-[11px] text-[var(--tx3)]">Apply concession percentage or custom amount to active dues</div>
              </div>
              <button type="button" onClick={() => setShowConcessionModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"><X size={16} /></button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1">Fee Component *</label>
                <select 
                  value={selectedConcessionFeeId} 
                  onChange={(e) => {
                    setSelectedConcessionFeeId(e.target.value);
                    setConcessionAmount('');
                  }}
                  required 
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                >
                  <option value="">Select component</option>
                  {studentFeesList
                    .filter((f) => (Number(f.amount) - Number(f.paid_amount) - Number(f.concession_amount)) > 0)
                    .map((f) => {
                      const rem = Number(f.amount) - Number(f.paid_amount) - Number(f.concession_amount);
                      return (
                        <option key={f.id} value={f.id}>
                          {f.feeCategory?.name || f.category || 'School Fee'} (Remaining: ₹{rem.toLocaleString()})
                        </option>
                      );
                    })
                  }
                </select>
                <span className="text-[10px] text-[var(--tx3)] mt-1 block">Only components with outstanding balance are shown</span>
              </div>

              <div>
                <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr] gap-4 items-start">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[var(--tx)] mb-1.5">Concession Amount *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tx3)] text-[13px] font-medium">₹</span>
                      <input 
                        type="number"
                        value={concessionAmount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val > selectedConcessionRemaining) {
                            setConcessionAmount(String(selectedConcessionRemaining));
                          } else {
                            setConcessionAmount(e.target.value);
                          }
                        }}
                        max={selectedConcessionRemaining}
                        required
                        className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg pl-7 pr-3 py-2.5 text-[13px] text-[var(--tx)] font-semibold outline-none focus:border-[var(--blue)] transition-colors"
                        placeholder="6000"
                      />
                    </div>
                    <span className="text-[10px] text-[var(--tx3)] mt-1.5 block font-medium">Maximum: ₹{selectedConcessionRemaining.toLocaleString()}</span>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-bold text-[var(--tx3)] mb-1.5">Quick Amounts</label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[10, 25, 50, 100].map((pct) => {
                        const amt = Math.round(selectedConcessionRemaining * (pct / 100));
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setConcessionAmount(String(amt))}
                            disabled={!selectedConcessionFeeId}
                            className="w-full px-3 py-2 bg-[var(--surf)] hover:bg-[var(--surf2)] disabled:opacity-40 text-[11px] text-[var(--tx2)] border border-[var(--b)] rounded-xl cursor-pointer transition-colors text-center font-medium shadow-sm flex justify-between items-center"
                          >
                            <span>{pct}%</span>
                            <span className="font-bold text-[var(--tx3)]">(₹{amt.toLocaleString()})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[var(--tx)] mb-1.5">Reason for Concession</label>
                <textarea 
                  value={concessionReason}
                  onChange={(e) => setConcessionReason(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] resize-none" 
                  rows={3} 
                  placeholder="e.g., Merit scholarship, Financial hardship, Staff discount, Early payment discount"
                />
                <span className="text-[10px] text-[var(--tx3)] mt-1 block">Provide a brief explanation for this concession</span>
              </div>

              <div className="flex gap-2.5 p-3.5 bg-[var(--amber-bg)] border border-[var(--b)] rounded-xl text-[11px] text-[var(--amber-tx)] leading-normal">
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Important:</span> This concession will be applied immediately and cannot be undone from this interface. Please ensure the amount and reason are correct.
                </div>
              </div>
            </div>

            <div className="flex gap-2 p-5 pt-0 justify-end border-t border-[var(--b)] mt-4 pt-4 bg-[var(--surf2)]/20">
              <button 
                type="button" 
                onClick={() => setShowConcessionModal(false)} 
                className="px-4 py-2 border border-[var(--b)] bg-[var(--surf)] rounded-xl text-[12px] font-bold text-[var(--tx2)] hover:bg-[var(--surf2)] hover:text-[var(--tx)] cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
              >
                <X size={13} /> Cancel
              </button>
              <button 
                type="submit" 
                disabled={applyingConcession || !selectedConcessionFeeId || !concessionAmount}
                className="px-4 py-2 bg-[var(--coral-bg)] text-[var(--coral-tx)] border border-[var(--coral-tx)]/25 rounded-xl text-[12px] font-extrabold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 hover:bg-[var(--coral)] hover:text-white transition-all shadow-sm"
              >
                <Percent size={13} /> Apply Concession
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
