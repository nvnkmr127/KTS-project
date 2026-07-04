import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Users, FileText, Download, Plus, Search, X, Loader2, Trash2, ArrowLeft, Percent, MapPin, Calendar, Phone, User, AlertTriangle, Printer, Edit, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
// @ts-ignore
import * as XLSX from 'xlsx';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
import { TabBar } from '../components/ui';
import { api } from '../services/api';
import { useDialog } from '../context/DialogContext';
import { useApp } from '../context/AppContext';

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
  dob?: string;
  admissionDate?: string;
  parent?: string;
  phone?: string;
  address?: string;
  roll?: string;
  batchId?: number | string;
  assignedCategories?: string[];
}

const statusBadge = (s: 'Paid' | 'Partial' | 'Unpaid') => {
  if (s === 'Paid') return <Badge variant="teal">Paid</Badge>;
  if (s === 'Partial') return <Badge variant="amber">Partial</Badge>;
  return <Badge variant="red">Unpaid</Badge>;
};

export function FeeManagement() {
  const { alert, confirm } = useDialog();
  const { selectedAcademicYearId } = useApp();
  const [tab, setTab] = useState(0);
  const [students, setStudents] = useState<StudentFeeDisplay[]>([]);
  const [classes, setClasses] = useState<string[]>(['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B']);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [feeCategoryFilter, setFeeCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'name' | 'cls' | 'fee' | 'paid' | 'bal' | 'status' | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const handleSort = (field: 'name' | 'cls' | 'fee' | 'paid' | 'bal' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleBulkDeleteFees = async () => {
    if (selectedIds.length === 0) return;
    if (await confirm(`Are you sure you want to delete ALL allocated fees for the ${selectedIds.length} selected students? This will wipe out their fee records.`, 'Bulk Delete', true)) {
      setLoading(true);
      try {
        await Promise.all(selectedIds.map(async (studentId) => {
          // Find all fees for this student
          const studentFees = await api.getResources('student-fees', { student_id: studentId });
          await Promise.all(studentFees.map((f: { id: string; }) => api.deleteResource('student-fees', f.id)));
        }));
        setSelectedIds([]);
        await loadFeesData();
        await alert('Bulk deleted allocations successfully!', 'Deleted');
      } catch (err) {
        console.error('Failed to bulk delete fees:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const exportToExcel = () => {
    const dataToExport = filtered.map(s => ({
      'Student Name': s.name,
      'Class': s.cls,
      'Total Fee': s.fee,
      'Paid': s.paid,
      'Balance': s.bal,
      'Status': s.status
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fees');
    XLSX.writeFile(wb, 'KTS_Fees_Report.xlsx');
  };

  // Modals state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignType, setAssignType] = useState<'student' | 'class'>('student');
  const [assignedStudentForPayment, setAssignedStudentForPayment] = useState<{ studentId: string; name: string } | null>(null);
  const [collectStudent, setCollectStudent] = useState<StudentFeeDisplay | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [studentFeesList, setStudentFeesList] = useState<any[]>([]);
  const [payAmount, setPayAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [paymentRemarks, setPaymentRemarks] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [categories, setCategories] = useState<any[]>([]);
  const [assignedItems, setAssignedItems] = useState<{ category: string; amount: number }[]>([]);
  const [currentCategory, setCurrentCategory] = useState('Tuition Fee - Term 2');
  const [currentAmount, setCurrentAmount] = useState('8500');
  const [modalStudentId, setModalStudentId] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [existingFees, setExistingFees] = useState<any[]>([]);
  const [loadingExistingFees, setLoadingExistingFees] = useState(false);

  // Confirmation modlas/states
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [showAssignConfirm, setShowAssignConfirm] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingAssignData, setPendingAssignData] = useState<any>(null);
  const [duplicateWarningMsg, setDuplicateWarningMsg] = useState('');

  // Concession states
  const [showConcessionModal, setShowConcessionModal] = useState(false);
  const [selectedConcessionFeeId, setSelectedConcessionFeeId] = useState('');
  const [concessionAmount, setConcessionAmount] = useState('');
  const [concessionReason, setConcessionReason] = useState('');
  const [applyingConcession, setApplyingConcession] = useState(false);

  // Student details screen states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeDetailStudent, setActiveDetailStudent] = useState<any | null>(null);
  const [selectedStudentAttendance, setSelectedStudentAttendance] = useState<number | null>(null);
  const [loadingStudentFees, setLoadingStudentFees] = useState(false);
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [paymentSuccessData, setPaymentSuccessData] = useState<any | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    if (activeDetailStudent) {
      setLoadingAttendance(true);
      api.getResources('settings', { key: 'kts_student_attendance_records' })
        .then(res => {
          if (Array.isArray(res) && res.length > 0 && res[0].value) {
            try {
              const parsed = JSON.parse(res[0].value);
              setAttendanceRecords(parsed);
              localStorage.setItem('kts_student_attendance_records', JSON.stringify(parsed));
            } catch (e) {
              console.error('Error parsing kts_student_attendance_records:', e);
              const local = localStorage.getItem('kts_student_attendance_records');
              if (local) setAttendanceRecords(JSON.parse(local));
            }
          } else {
            const local = localStorage.getItem('kts_student_attendance_records');
            if (local) {
              setAttendanceRecords(JSON.parse(local));
            }
          }
        })
        .catch(err => {
          console.error('Error loading attendance settings:', err);
          const local = localStorage.getItem('kts_student_attendance_records');
          if (local) setAttendanceRecords(JSON.parse(local));
        })
        .finally(() => {
          setLoadingAttendance(false);
        });
    } else {
      setAttendanceRecords([]);
      setShowCalendar(false);
      setCurrentMonth(new Date());
    }
  }, [activeDetailStudent]);

  const [showEditPaidModal, setShowEditPaidModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedEditFee, setSelectedEditFee] = useState<any | null>(null);
  const [editPaidAmount, setEditPaidAmount] = useState('');
  const [savingEditPaid, setSavingEditPaid] = useState(false);

  const handleEditPaidSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEditFee || editPaidAmount === '') return;
    setSavingEditPaid(true);
    try {
      await api.updateResource('student-fees', selectedEditFee.id, {
        paid_amount: Number(editPaidAmount),
      });
      setShowEditPaidModal(false);
      setSelectedEditFee(null);
      setEditPaidAmount('');

      // Reload details
      if (activeDetailStudent) {
        loadStudentFees(activeDetailStudent.studentId);
      }
      loadFeesData();
    } catch (err) {
      console.error('Error updating paid amount:', err);
    } finally {
      setSavingEditPaid(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleViewStudentDetails = async (student: any) => {
    setActiveDetailStudent(student);
    setSelectedStudentAttendance(null);
    try {
      if (student.batchId) {
        const res = await api.getBatchStudentPercentages(String(student.batchId));
        if (res.success && res.data && res.data.students) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const [studentsData, categoriesData, allStudentFees, batchesData] = await Promise.all([
        api.getResources('students', { with: 'batch.academicYear', limit: '1000' }),
        api.getResources('fee-categories').catch(() => []),
        api.getResources('student-fees', { limit: '10000' }).catch(() => []),
        api.getResources('batches').catch(() => []),
      ]);

      const studentFeesMap = new Map<string, string[]>();
      if (Array.isArray(allStudentFees)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allStudentFees.forEach((fee: any) => {
          const studentId = String(fee.student_id || fee.studentId);
          const categoryName = fee.fee_category?.name || fee.feeCategory?.name || fee.category || 'School Fee';
          if (studentId) {
            const list = studentFeesMap.get(studentId) || [];
            if (!list.includes(categoryName.toLowerCase())) {
              list.push(categoryName.toLowerCase());
            }
            studentFeesMap.set(studentId, list);
          }
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeStudents = studentsData.filter((s: any) => {
        const isActive = s.status === 'active' || s.status === 'Active';
        const matchAy = !s.batch || String(s.batch.academic_year_id) === String(selectedAcademicYearId);
        return isActive && matchAy;
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = activeStudents.map((s: any, idx: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          dob: s.dob ? s.dob.slice(0, 10) : '',
          admissionDate: s.admission_date ? s.admission_date.slice(0, 10) : '',
          parent: s.father_name || 'N/A',
          phone: s.student_mobile || '',
          address: s.village || '',
          roll: s.enrollment_number || 'N/A',
          batchId: s.batch_id,
          assignedCategories: studentFeesMap.get(String(s.id)) || [],
        };
      });
      setStudents(mapped);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setActiveDetailStudent((prev: any) => {
        if (!prev) return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fresh = mapped.find((s: any) => String(s.studentId) === String(prev.studentId));
        return fresh || prev;
      });
      setCategories(categoriesData);
      if (categoriesData.length > 0) {
        setCurrentCategory(categoriesData[0].name);
      } else {
        setCurrentCategory('Tuition Fee - Term 2');
      }
      if (Array.isArray(batchesData) && batchesData.length > 0) {
        const filteredBatches = batchesData.filter((b: any) => !b.academic_year_id || String(b.academic_year_id) === String(selectedAcademicYearId));
        if (filteredBatches.length > 0) {
          const names = filteredBatches.map((b: any) => b.name).sort((a: string, b: string) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) {
              if (numA !== numB) return numA - numB;
              return a.localeCompare(b);
            }
            if (!isNaN(numA)) return -1;
            if (!isNaN(numB)) return 1;
            return a.localeCompare(b);
          });
          setClasses(names);
        } else {
          setClasses(['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B']);
        }
      } else {
        setClasses(['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B']);
      }
    } catch (err) {
      console.error('Error loading students fee information:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeesData();
  }, [selectedAcademicYearId]);

  useEffect(() => {
    const admittedStudentStr = sessionStorage.getItem('admitted_student');
    if (admittedStudentStr && students.length > 0) {
      try {
        const admittedStudent = JSON.parse(admittedStudentStr);
        if (admittedStudent && admittedStudent.id) {
          // Open the assign modal, select the student
          setAssignType('student');
          setModalStudentId(String(admittedStudent.id));
          setShowAssignModal(true);
          sessionStorage.removeItem('admitted_student');
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [students]);

  const loadStudentFees = async (studentId: string) => {
    setLoadingStudentFees(true);
    try {
      const fees = await api.getResources('student-fees', { student_id: studentId });
      setStudentFeesList(fees);
      if (fees.length > 0) {
        const outstanding = fees
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((f: any) => (Number(f.amount) - Number(f.paid_amount) - Number(f.concession_amount)) > 0);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const outstandingFeeIds = outstanding.map((f: any) => String(f.id));
        setSelectedFeeIds(outstandingFeeIds);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sum = outstanding.reduce((total: number, f: any) => {
          const rem = Number(f.amount) - Number(f.paid_amount) - Number(f.concession_amount);
          return total + Math.max(0, rem);
        }, 0);
        setPayAmount(String(sum));
      } else {
        setSelectedFeeIds([]);
        setPayAmount('');
      }
    } catch (err) {
      console.error('Error fetching fees for student:', err);
    } finally {
      setLoadingStudentFees(false);
    }
  };

  useEffect(() => {
    if (collectStudent) {
      loadStudentFees(collectStudent.studentId);
      setPaymentMethod('Cash');
      setPaymentRemarks('');
    } else if (activeDetailStudent) {
      loadStudentFees(activeDetailStudent.studentId);
    } else {
      setStudentFeesList([]);
    }
  }, [collectStudent, activeDetailStudent]);

  const handleCheckboxChange = (feeId: string, checked: boolean) => {
    let nextIds = [...selectedFeeIds];
    if (checked) {
      if (!nextIds.includes(feeId)) nextIds.push(feeId);
    } else {
      nextIds = nextIds.filter(id => id !== feeId);
    }
    setSelectedFeeIds(nextIds);

    const sum = nextIds.reduce((total, id) => {
      const fee = studentFeesList.find(f => String(f.id) === id);
      if (fee) {
        const rem = Number(fee.amount) - Number(fee.paid_amount) - Number(fee.concession_amount);
        return total + Math.max(0, rem);
      }
      return total;
    }, 0);
    setPayAmount(String(sum));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePrint = (data: any) => {
    const schoolName = localStorage.getItem('school_name') || 'Krishnaveni Talent School';
    const schoolAddress = localStorage.getItem('school_address') || 'Nizamabad, Telangana';
    const schoolLogo = localStorage.getItem('school_logo') || '/KTHS_Logo.png';
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Fee Receipt - ${data.studentName}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; background: white; }
              .text-center { text-align: center; }
              .mb-4 { margin-bottom: 16px; }
              .pb-4 { padding-bottom: 16px; }
              .border-b { border-bottom: 1px solid #e2e8f0; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: 1fr 1fr; gap: 16px; }
              .bg-slate { background: #f8fafc !important; border-radius: 8px; padding: 12px; border: 1px solid #e2e8f0; }
              .text-xs { font-size: 11px; color: #64748b; }
              .text-sm { font-size: 12px; font-weight: 600; color: #1e293b; }
              .font-bold { font-weight: bold; }
              .flex { display: flex; justify-content: space-between; align-items: center; }
              .justify-between { justify-content: space-between; }
              .space-y-1\\.5 > * + * { margin-top: 6px; }
              .text-gray { color: #64748b; font-size: 12px; }
              .text-dark { color: #1e293b; font-size: 12px; font-weight: 500; }
              .bg-blue { background: #eff6ff !important; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px; }
              .text-blue-tx { color: #1d4ed8; }
              .text-teal-tx { color: #0d9488; }
              .rounded-xl { border-radius: 12px; }
              .border-t { border-top: 1px solid #e2e8f0; }
              .pt-2 { padding-top: 8px; }
              .mt-4 { margin-top: 16px; }
              .text-lg { font-size: 18px; }
              .text-md { font-size: 13px; }
              .text-header-sm { font-size: 11px; color: #64748b; }
              .text-header-lg { font-size: 14px; font-weight: bold; color: #1e293b; }
              .font-semibold { font-weight: 600; }
              .mb-2 { margin-bottom: 8px; }
            </style>
          </head>
          <body>
            <div style="max-width: 500px; margin: 0 auto;">
              <div class="text-center mb-4 pb-4 border-b" style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                <img src="${schoolLogo}" alt="School Logo" style="width: 40px; height: 40px; object-fit: contain;" />
                <div style="text-align: left;">
                  <div class="text-header-lg" style="font-size: 14px; font-weight: bold; color: #1e293b; line-height: 1.2;">${schoolName}</div>
                  <div class="text-xs" style="color: #64748b; font-size: 11px; margin-top: 2px;">${schoolAddress} · Fee Receipt</div>
                  <div class="text-xs" style="color: #64748b; font-size: 11px;">Receipt No: REC-${Date.now()}</div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 mb-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div class="bg-slate">
                  <div class="text-xs" style="color: #64748b;">Student Name</div>
                  <div class="text-sm" style="font-weight: 600;">${data.studentName}</div>
                </div>
                <div class="bg-slate">
                  <div class="text-xs" style="color: #64748b;">Class</div>
                  <div class="text-sm" style="font-weight: 600;">${data.studentClass}</div>
                </div>
                <div class="bg-slate">
                  <div class="text-xs" style="color: #64748b;">Date</div>
                  <div class="text-sm" style="font-weight: 600;">${new Date().toLocaleDateString()}</div>
                </div>
                <div class="bg-slate">
                  <div class="text-xs" style="color: #64748b;">Payment Method</div>
                  <div class="text-sm" style="font-weight: 600;">Cash</div>
                </div>
              </div>

              <div style="margin-bottom: 16px;">
                <div class="text-xs" style="font-weight: 600; color: #0d9488; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Paid Items</div>
                <div class="space-y-1.5" style="display: flex; flex-direction: column; gap: 6px;">
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ${data.allocatedPayments.map((p: any) => `
                    <div class="flex" style="display: flex; justify-content: space-between;">
                      <span class="text-gray">${p.name}</span>
                      <span class="text-dark">₹${p.amount.toLocaleString()}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="bg-blue flex" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                <span class="text-md font-bold text-blue-tx" style="font-size: 13px;">Total Paid</span>
                <span class="text-lg font-bold text-blue-tx" style="font-size: 18px;">₹${data.totalPaid.toLocaleString()}</span>
              </div>

              <div class="text-center" style="margin-top: 30px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px;">
                Thank you for your payment!<br>
                This is an official computer-generated receipt.
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedFeeIds.length === 0 || !payAmount || !collectStudent) return;
    setProcessingPayment(true);
    try {
      let remainingPayment = Number(payAmount);
      const allocated: { name: string; amount: number }[] = [];

      for (const feeId of selectedFeeIds) {
        if (remainingPayment <= 0) break;

        const fee = studentFeesList.find((f) => String(f.id) === feeId);
        if (fee) {
          const rem = Number(fee.amount) - Number(fee.paid_amount) - Number(fee.concession_amount);
          const due = Math.max(0, rem);
          if (due > 0) {
            const paymentForThisFee = Math.min(remainingPayment, due);
            const currentPaid = Number(fee.paid_amount) || 0;

            await api.updateResource('student-fees', feeId, {
              paid_amount: currentPaid + paymentForThisFee,
              payment_method: paymentMethod,
              remarks: paymentRemarks,
            });

            allocated.push({
              name: fee.fee_category?.name || fee.feeCategory?.name || fee.category || 'School Fee',
              amount: paymentForThisFee
            });

            remainingPayment -= paymentForThisFee;
          }
        }
      }

      setPaymentSuccessData({
        studentName: collectStudent.name,
        studentClass: collectStudent.cls,
        allocatedPayments: allocated,
        totalPaid: Number(payAmount) - remainingPayment,
      });

      setCollectStudent(null);
      loadFeesData();
      if (activeDetailStudent) {
        loadStudentFees(activeDetailStudent.studentId);
      }
    } catch (err) {
      console.error('Error recording payment:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executeAssignFee = async (items: any[], type: string, studentId: string, className: string, dueDate: string) => {
    setLoading(true);
    try {
      await Promise.all(
        items.map((item) =>
          api.createResource('student-fees', {
            category: item.category,
            amount: item.amount,
            due_date: dueDate,
            ...(type === 'class' ? { class_name: className } : { student_id: Number(studentId) })
          })
        )
      );
      const targetStudent = students.find(s => String(s.studentId) === String(studentId));
      setShowAssignModal(false);
      setAssignedItems([]);
      await loadFeesData();
      if (type === 'student' && targetStudent) {
        setAssignedStudentForPayment({
          studentId: studentId,
          name: targetStudent.name
        });
      }
    } catch (err) {
      console.error('Error assigning fee:', err);
    } finally {
      setLoading(false);
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

    if (assignType === 'student') {
      const duplicates = itemsToAssign.filter(item =>
        existingFees.some(f => (f.fee_category?.name || f.feeCategory?.name || f.category || '').toLowerCase() === item.category.toLowerCase())
      );
      if (duplicates.length > 0) {
        setDuplicateWarningMsg(
          `This student already has the following fee category assigned: ${duplicates.map(d => d.category).join(', ')}. Assigning it again will create duplicate fee records.`
        );
        setPendingAssignData({
          items: itemsToAssign,
          type: assignType,
          studentId: studentIdVal,
          className: classNameVal,
          dueDate: dueDateVal
        });
        setShowAssignConfirm(true);
        return;
      }
    }

    await executeAssignFee(itemsToAssign, assignType, studentIdVal, classNameVal, dueDateVal);
  };

  // Filter students based on search, tabs, class, and fee category filters
  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.cls.toLowerCase().includes(search.toLowerCase()) ||
      s.assignedCategories?.some(cat => cat.toLowerCase().includes(search.toLowerCase()));
    const matchClass = classFilter === 'All' || s.cls.startsWith(classFilter);
    const matchTab =
      tab === 0 ||
      (tab === 1 && s.status === 'Paid') ||
      (tab === 2 && s.status === 'Partial') ||
      (tab === 3 && s.status === 'Unpaid');
    const matchFeeCategory = feeCategoryFilter === 'All' || s.assignedCategories?.includes(feeCategoryFilter.toLowerCase());

    return matchSearch && matchClass && matchTab && matchFeeCategory;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortField === 'cls') {
      valA = a.cls.toLowerCase();
      valB = b.cls.toLowerCase();
    } else if (sortField === 'fee') {
      valA = a.fee;
      valB = b.fee;
    } else if (sortField === 'paid') {
      valA = a.paid;
      valB = b.paid;
    } else if (sortField === 'bal') {
      valA = a.bal;
      valB = b.bal;
    } else if (sortField === 'status') {
      valA = a.status.toLowerCase();
      valB = b.status.toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalCollected = students.reduce((sum, s) => sum + s.paid, 0);
  const totalPending = students.reduce((sum, s) => sum + s.bal, 0);
  const paidCount = students.filter((s) => s.status === 'Paid').length;

  const selectedConcessionFee = studentFeesList.find(f => String(f.id) === selectedConcessionFeeId);
  const selectedConcessionRemaining = selectedConcessionFee ? (Number(selectedConcessionFee.amount) - Number(selectedConcessionFee.paid_amount) - Number(selectedConcessionFee.concession_amount)) : 0;

  const renderStudentDetails = () => {
    if (!activeDetailStudent) return null;
    const std = activeDetailStudent;

    const totalFee = studentFeesList.length > 0
      ? studentFeesList.reduce((sum, f) => sum + Number(f.amount), 0)
      : std.fee;

    const totalPaid = studentFeesList.length > 0
      ? studentFeesList.reduce((sum, f) => sum + Number(f.paid_amount), 0)
      : std.paid;

    const totalDue = studentFeesList.length > 0
      ? studentFeesList.reduce((sum, f) => sum + Math.max(0, Number(f.amount) - Number(f.paid_amount) - Number(f.concession_amount)), 0)
      : std.bal;

    const calculatedStatus = (() => {
      if (studentFeesList.length === 0) return std.status;
      const totalAmount = studentFeesList.reduce((sum, f) => sum + Number(f.amount), 0);
      const totalConcession = studentFeesList.reduce((sum, f) => sum + Number(f.concession_amount), 0);
      const totalPaid = studentFeesList.reduce((sum, f) => sum + Number(f.paid_amount), 0);
      const netAmount = totalAmount - totalConcession;
      if (netAmount > 0) {
        if (totalPaid >= netAmount) return 'Paid';
        if (totalPaid > 0) return 'Partial';
        return 'Unpaid';
      }
      return 'Paid';
    })();

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const getDayAttendanceInfo = (dateStr: string) => {
      const dayRecords = attendanceRecords.filter(
        r => String(r.studentId) === String(std.studentId) && r.date === dateStr
      );
      if (dayRecords.length === 0) return null;

      const presentCount = dayRecords.filter(r => r.status?.toLowerCase() === 'present' || r.status?.toLowerCase() === 'late').length;
      const absentCount = dayRecords.filter(r => r.status?.toLowerCase() === 'absent').length;

      if (presentCount > 0 && absentCount > 0) {
        return {
          status: 'partial' as const,
          className: 'bg-[var(--purple-bg)] text-[var(--purple-tx)] border-[var(--purple-tx)]/25',
          label: 'Partial',
          details: `${presentCount} P / ${absentCount} A`
        };
      } else if (presentCount > 0) {
        return {
          status: 'present' as const,
          className: 'bg-[var(--green-bg)] text-[var(--green-tx)] border-[var(--green-tx)]/25',
          label: 'Present',
          details: `${presentCount} Present`
        };
      } else if (absentCount > 0) {
        return {
          status: 'absent' as const,
          className: 'bg-[var(--red-bg)] text-[var(--red-tx)] border-[var(--red-tx)]/25',
          label: 'Absent',
          details: `${absentCount} Absent`
        };
      }
      return null;
    };

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const formattedMonthYear = `${monthNames[month]} ${year}`;

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
            {calculatedStatus !== 'Paid' && (
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
              {statusBadge(calculatedStatus)}
            </div>
          </div>
        </Card>

        {!showCalendar ? (
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
                <div
                  onClick={() => setShowCalendar(true)}
                  className="bg-[var(--surf2)] rounded-xl p-3 sm:col-span-2 cursor-pointer hover:bg-[var(--surf3)] border border-transparent hover:border-[var(--blue-tx)]/20 transition-all group"
                >
                  <div className="text-[10px] text-[var(--tx3)] mb-0.5 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Users size={11} /> Overall Attendance</span>
                    <span className="text-[9px] text-[var(--blue-tx)] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">Click to view calendar →</span>
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className={`text-[13px] font-bold ${selectedStudentAttendance !== null && selectedStudentAttendance >= 75 ? 'text-[var(--teal-tx)]' : selectedStudentAttendance !== null && selectedStudentAttendance >= 60 ? 'text-[var(--amber-tx)]' : 'text-[var(--red-tx)]'
                      }`}>{selectedStudentAttendance !== null ? `${selectedStudentAttendance}%` : 'Loading...'}</span>
                    {selectedStudentAttendance !== null && (
                      <div className="flex-1 h-2 bg-[var(--surf)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${selectedStudentAttendance >= 75 ? 'bg-[var(--teal)]' : selectedStudentAttendance >= 60 ? 'bg-[var(--amber)]' : 'bg-[var(--red)]'
                          }`} style={{ width: `${selectedStudentAttendance}%` }} />
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
            <Card className="space-y-4 lg:h-[400px] lg:flex lg:flex-col">
              <div className="text-[12.5px] font-bold text-[var(--tx)] pb-2 border-b border-[var(--b)] flex items-center gap-1.5 flex-shrink-0">
                <FileText size={13} className="text-[var(--tx3)]" /> Fee Summary & Ledger
              </div>

              {/* Overall totals */}
              <div className="grid grid-cols-3 gap-2.5 flex-shrink-0">
                <div className="bg-[var(--surf2)] rounded-xl p-3 text-center">
                  <div className="text-[10px] text-[var(--tx3)] mb-0.5">Total Fee</div>
                  <div className="text-[13.5px] font-bold text-[var(--tx)]">₹{totalFee.toLocaleString()}</div>
                </div>
                <div className="bg-[var(--surf2)] rounded-xl p-3 text-center border-l-2 border-[var(--teal)]">
                  <div className="text-[10px] text-[var(--tx3)] mb-0.5">Paid Amount</div>
                  <div className="text-[13.5px] font-bold text-[var(--teal-tx)]">₹{totalPaid.toLocaleString()}</div>
                </div>
                <div className="bg-[var(--surf2)] rounded-xl p-3 text-center border-l-2 border-[var(--red)]">
                  <div className="text-[10px] text-[var(--tx3)] mb-0.5">Amount Due</div>
                  <div className="text-[13.5px] font-bold text-[var(--red-tx)]">₹{totalDue.toLocaleString()}</div>
                </div>
              </div>

              {/* Fee Items Breakdown */}
              <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                <div className="text-[11.5px] font-bold text-[var(--tx)] flex-shrink-0">Detailed Fee Breakdown</div>
                {loadingStudentFees ? (
                  <div className="text-center py-6 text-[11.5px] text-[var(--tx3)] italic flex-1 flex items-center justify-center">Loading breakdown...</div>
                ) : studentFeesList.length === 0 ? (
                  <div className="text-center py-6 text-[11.5px] text-[var(--tx3)] italic flex-1 flex flex-col items-center justify-center gap-2">
                    <span>No fee records assigned.</span>
                    <button
                      onClick={() => {
                        setAssignType('student');
                        setAssignedItems([]);
                        setCurrentAmount('8500');
                        setModalStudentId(std.studentId);
                        setShowAssignModal(true);
                      }}
                      className="mt-1 flex items-center gap-1 px-2.5 py-1.5 text-[10.5px] bg-[var(--blue)] text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer font-semibold"
                    >
                      <Plus size={11} /> Assign Fee
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto pr-1 max-h-[220px] lg:max-h-none lg:flex-1">
                    {studentFeesList.map((fee) => {
                      const feeName = fee.fee_category?.name || fee.feeCategory?.name || fee.category || 'School Fee';
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
                            <div className="flex items-center gap-2 justify-end mb-1">
                              {Number(fee.paid_amount) > 0 && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedEditFee(fee);
                                      setEditPaidAmount(String(fee.paid_amount));
                                      setShowEditPaidModal(true);
                                    }}
                                    className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-[var(--surf3)] text-[var(--tx2)] hover:text-[var(--tx)] rounded-lg transition-colors cursor-pointer"
                                    title="Edit Paid Amount"
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePrint({
                                      studentName: std.name,
                                      studentClass: std.cls,
                                      allocatedPayments: [{
                                        name: feeName,
                                        amount: Number(fee.paid_amount)
                                      }],
                                      totalPaid: Number(fee.paid_amount)
                                    })}
                                    className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-[var(--surf3)] text-[var(--blue-tx)] rounded-lg transition-colors cursor-pointer"
                                    title="Print Receipt"
                                  >
                                    <Printer size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (await confirm(`Are you sure you want to delete/reverse the payment of ₹${Number(fee.paid_amount).toLocaleString()} for ${feeName}?`, 'Reverse Payment', true)) {
                                        try {
                                          await api.updateResource('student-fees', fee.id, {
                                            paid_amount: 0,
                                            payment_method: null,
                                            remarks: null,
                                          });
                                          loadFeesData();
                                          loadStudentFees(std.studentId);
                                          await alert('Payment deleted successfully!', 'Payment Deleted');
                                        } catch (err) {
                                          console.error('Failed to delete payment:', err);
                                        }
                                      }
                                    }}
                                    className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-[var(--surf3)] text-[var(--red-tx)] rounded-lg transition-colors cursor-pointer"
                                    title="Delete/Reverse Payment"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                              {bal > 0 ? (
                                <Badge variant="red">Due: ₹{bal.toLocaleString()}</Badge>
                              ) : (
                                <Badge variant="teal">Paid</Badge>
                              )}
                            </div>
                            <div className="text-[9.5px] text-[var(--tx3)]">Due Date: {fee.due_date}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          // Calendar View
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-4.5 space-y-4">
            {/* Calendar Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-[var(--b)]">
              <button
                onClick={() => setShowCalendar(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold border border-[var(--b)] bg-[var(--surf2)] rounded-lg text-[var(--tx)] hover:bg-[var(--surf3)] transition-all cursor-pointer"
              >
                <ArrowLeft size={12} /> Back to Profile
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                  className="p-1.5 rounded-lg border border-[var(--b)] bg-[var(--surf2)] text-[var(--tx)] hover:bg-[var(--surf3)] transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft size={13} />
                </button>

                <select
                  value={month}
                  onChange={(e) => setCurrentMonth(new Date(year, parseInt(e.target.value), 1))}
                  className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2 py-1 text-[11.5px] font-bold text-[var(--tx)] cursor-pointer outline-none hover:bg-[var(--surf3)] transition-all"
                  title="Select Month"
                >
                  {monthNames.map((name, idx) => (
                    <option key={name} value={idx}>{name}</option>
                  ))}
                </select>

                <select
                  value={year}
                  onChange={(e) => setCurrentMonth(new Date(parseInt(e.target.value), month, 1))}
                  className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2 py-1 text-[11.5px] font-bold text-[var(--tx)] cursor-pointer outline-none hover:bg-[var(--surf3)] transition-all"
                  title="Select Year"
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <button
                  onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                  className="p-1.5 rounded-lg border border-[var(--b)] bg-[var(--surf2)] text-[var(--tx)] hover:bg-[var(--surf3)] transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px] font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-[var(--green-bg)] border border-[var(--green-tx)]/20 inline-block"></span>
                  <span className="text-[var(--tx2)]">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-[var(--purple-bg)] border border-[var(--purple-tx)]/20 inline-block"></span>
                  <span className="text-[var(--tx2)]">Partial</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-[var(--red-bg)] border border-[var(--red-tx)]/20 inline-block"></span>
                  <span className="text-[var(--tx2)]">Absent</span>
                </div>
              </div>
            </div>

            {/* Loader when fetching records */}
            {loadingAttendance ? (
              <div className="flex flex-col justify-center items-center py-12 text-[var(--tx3)] gap-2">
                <Loader2 className="animate-spin text-[var(--blue-tx)]" size={20} />
                <span className="text-xs">Loading attendance details...</span>
              </div>
            ) : (
              /* Calendar Grid */
              <div className="grid grid-cols-7 gap-1.5">
                {/* Weekday headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-[var(--tx3)] uppercase py-1">
                    {d}
                  </div>
                ))}

                {/* Empty slots for starting offset */}
                {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square bg-transparent rounded-lg"></div>
                ))}

                {/* Active month days */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayRecords = attendanceRecords.filter(
                    r => String(r.studentId) === String(std.studentId) && r.date === dateStr
                  );
                  const att = getDayAttendanceInfo(dateStr);

                  const tooltipText = att
                    ? `${dayNum} ${monthNames[month]}: ${att.label}\n${dayRecords.map(r => `${r.session === 'first_period' ? 'Morning' : 'Afternoon'}: ${r.status}`).join('\n')}`
                    : `${dayNum} ${monthNames[month]}: No attendance marked`;

                  return (
                    <div
                      key={`day-${dayNum}`}
                      title={tooltipText}
                      className={`aspect-square p-2 rounded-xl flex flex-col justify-between border transition-all ${att
                        ? att.className
                        : 'bg-[var(--surf2)] border-[var(--b)] text-[var(--tx2)] hover:bg-[var(--surf3)]'
                        }`}
                    >
                      <span className="text-[11px] font-bold">{dayNum}</span>
                      {att && (
                        <span className="text-[9px] font-bold opacity-90 text-right truncate">
                          {att.status === 'present' ? 'P' : att.status === 'absent' ? 'A' : '1/2'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
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
                <button onClick={() => setShowImportModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg cursor-pointer hover:bg-[var(--surf3)]">
                  <Upload size={12} /> Import
                </button>
                <button onClick={exportToExcel} className="flex items-center gap-1 px-2.5 py-1 text-[11px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg text-[var(--tx)] hover:bg-[var(--surf3)] transition-colors cursor-pointer">
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
                  placeholder="Search student name, class, or fee category..."
                  className="flex-1 bg-transparent text-[12px] text-[var(--tx)] placeholder:text-[var(--tx3)] outline-none"
                />
              </div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] w-full sm:w-32 cursor-pointer outline-none"
              >
                <option value="All">All classes</option>
                {['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((c) => (
                  <option key={c} value={c}>{`Class ${c}`}</option>
                ))}
              </select>

              <select
                value={feeCategoryFilter}
                onChange={(e) => setFeeCategoryFilter(e.target.value)}
                className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] w-full sm:w-44 cursor-pointer outline-none"
              >
                <option value="All">All Fee Categories</option>
                {categories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between bg-[var(--blue-bg)] border border-[var(--blue-tx)]/25 rounded-lg p-3 mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="text-[12px] text-[var(--blue-tx)] font-semibold">{selectedIds.length} students selected</span>
                <div className="flex gap-2">
                  <button onClick={handleBulkDeleteFees} className="px-2.5 py-1 text-[11px] bg-[var(--red-bg)] text-[var(--red-tx)] border border-[var(--red-tx)]/25 rounded-md font-semibold hover:opacity-90 cursor-pointer">Bulk Delete Fees</button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[700px]">
                <thead>
                  <tr>
                    <th className="px-2 py-1.5 border-b border-[var(--b)] text-left w-8">
                      <input
                        type="checkbox"
                        checked={sortedFiltered.length > 0 && selectedIds.length === sortedFiltered.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(sortedFiltered.map(s => s.studentId));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        className="cursor-pointer rounded border-[var(--b)]"
                      />
                    </th>
                    <th onClick={() => handleSort('name')} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-1.5 border-b border-[var(--b)] whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Student Name {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => handleSort('cls')} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-1.5 border-b border-[var(--b)] whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Class {sortField === 'cls' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => handleSort('fee')} className="hidden sm:table-cell text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-1.5 border-b border-[var(--b)] whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Term Fee {sortField === 'fee' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => handleSort('paid')} className="hidden sm:table-cell text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-1.5 border-b border-[var(--b)] whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Paid {sortField === 'paid' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => handleSort('bal')} className="hidden md:table-cell text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-1.5 border-b border-[var(--b)] whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Balance {sortField === 'bal' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => handleSort('status')} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-1.5 border-b border-[var(--b)] whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Status {sortField === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-1.5 border-b border-[var(--b)] whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFiltered.map((s, index) => {
                    const isSelected = selectedIds.includes(s.studentId);
                    return (
                      <tr key={s.studentId} className={`hover:bg-[var(--surf2)] transition-colors group ${isSelected ? 'bg-[var(--blue-bg)]/10' : ''}`}>
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds(prev => [...prev, s.studentId]);
                              } else {
                                setSelectedIds(prev => prev.filter(id => id !== s.studentId));
                              }
                            }}
                            className="cursor-pointer rounded border-[var(--b)]"
                          />
                        </td>
                        <td className="px-2 py-2 cursor-pointer text-[var(--blue-tx)] font-medium" onClick={() => handleViewStudentDetails(s)}>
                          <div className="flex items-center gap-2">
                            <Avatar initials={s.init} bg="var(--blue-bg)" color="var(--blue-tx)" />
                            <span>{s.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-[var(--tx2)]">Class {s.cls}</td>
                        <td className="hidden sm:table-cell px-2 py-2 text-[var(--tx)]">₹{s.fee.toLocaleString()}</td>
                        <td className="hidden sm:table-cell px-2 py-2 text-[var(--teal-tx)] font-medium">₹{s.paid.toLocaleString()}</td>
                        <td className="hidden md:table-cell px-2 py-2 text-[var(--tx)]">
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
                    );
                  })}
                  {sortedFiltered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-6 text-[12px] text-[var(--tx3)]">
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={handleAssignFeeSubmit} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[420px] max-h-[90vh] overflow-y-auto shadow-2xl">
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
                    {classes.map((cls) => (
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
                        const feeName = fee.fee_category?.name || fee.feeCategory?.name || fee.category || 'School Fee';
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
          <form onSubmit={(e) => { e.preventDefault(); setShowPaymentConfirm(true); }} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[420px] shadow-2xl">
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
                    <div className="space-y-2 max-h-[160px] overflow-y-auto bg-[var(--surf2)] border border-[var(--b)] rounded-lg p-3">
                      {studentFeesList.map((f) => {
                        const rem = Number(f.amount) - Number(f.paid_amount) - Number(f.concession_amount);
                        const isChecked = selectedFeeIds.includes(String(f.id));
                        return (
                          <label key={f.id} className="flex items-center gap-2.5 text-[12px] text-[var(--tx)] cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleCheckboxChange(String(f.id), e.target.checked)}
                              className="accent-[var(--blue)] w-3.5 h-3.5 rounded"
                            />
                            <span>
                              {f.fee_category?.name || f.feeCategory?.name || f.category || 'School Fee'} (Due: ₹{rem.toLocaleString()})
                            </span>
                          </label>
                        );
                      })}
                    </div>
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
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Payment Method *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Note / Remarks</label>
                    <textarea
                      value={paymentRemarks}
                      onChange={(e) => setPaymentRemarks(e.target.value)}
                      placeholder="Add transaction ID, cheque number or notes..."
                      rows={2}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] resize-none"
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
                          {f.fee_category?.name || f.feeCategory?.name || f.category || 'School Fee'} (Remaining: ₹{rem.toLocaleString()})
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

      {showEditPaidModal && selectedEditFee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={handleEditPaidSubmit} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Edit Paid Amount</div>
                <div className="text-[11px] text-[var(--tx3)]">
                  {selectedEditFee.fee_category?.name || selectedEditFee.feeCategory?.name || selectedEditFee.category || 'School Fee'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditPaidModal(false);
                  setSelectedEditFee(null);
                }}
                className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-[11.5px] bg-[var(--surf2)] p-3 rounded-xl">
                <div>
                  <span className="text-[var(--tx3)] block">Assigned Amount:</span>
                  <span className="font-semibold text-[var(--tx)]">₹{Number(selectedEditFee.amount).toLocaleString()}</span>
                </div>
                {Number(selectedEditFee.concession_amount) > 0 && (
                  <div>
                    <span className="text-[var(--tx3)] block">Concession:</span>
                    <span className="font-semibold text-[var(--purple-tx)]">₹{Number(selectedEditFee.concession_amount).toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Paid Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max={Number(selectedEditFee.amount) - (Number(selectedEditFee.concession_amount) || 0)}
                  value={editPaidAmount}
                  onChange={(e) => setEditPaidAmount(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] font-bold text-lg"
                />
                <span className="text-[10px] text-[var(--tx3)] mt-1.5 block">
                  Maximum allowed: ₹{(Number(selectedEditFee.amount) - (Number(selectedEditFee.concession_amount) || 0)).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button
                type="button"
                onClick={() => {
                  setShowEditPaidModal(false);
                  setSelectedEditFee(null);
                }}
                className="flex-1 py-2 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEditPaid}
                className="flex-1 py-2 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer disabled:opacity-50"
              >
                {savingEditPaid ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {paymentSuccessData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-base font-bold text-[var(--tx)] mb-1">Payment Recorded!</h3>
            <p className="text-xs text-[var(--tx3)] mb-4">The payment has been successfully recorded in the system.</p>

            <div className="bg-[var(--surf2)] rounded-xl p-4 mb-6 text-left space-y-2.5 text-[12px]">
              <div className="flex justify-between"><span className="text-[var(--tx3)]">Student:</span><span className="font-semibold text-[var(--tx)]">{paymentSuccessData.studentName}</span></div>
              <div className="flex justify-between"><span className="text-[var(--tx3)]">Amount Paid:</span><span className="font-bold text-[var(--teal-tx)]">₹{paymentSuccessData.totalPaid.toLocaleString()}</span></div>
              <div className="border-t border-[var(--b)] pt-2 mt-1">
                <span className="text-[10px] text-[var(--tx3)] font-semibold uppercase tracking-wider block mb-1">Allocation</span>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {paymentSuccessData.allocatedPayments.map((p: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px]"><span className="text-[var(--tx2)]">{p.name}</span><span className="font-medium text-[var(--tx)]">₹{p.amount.toLocaleString()}</span></div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaymentSuccessData(null)}
                className="flex-1 py-2 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handlePrint(paymentSuccessData)}
                className="flex-1 py-2 bg-[var(--blue)] text-white rounded-xl text-[12px] font-semibold hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download size={13} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {assignedStudentForPayment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-base font-bold text-[var(--tx)] mb-1">Fees Assigned Successfully!</h3>
            <p className="text-xs text-[var(--tx3)] mb-6">
              Fees have been assigned to <strong>{assignedStudentForPayment.name}</strong>.
              Would you like to collect a payment now?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAssignedStudentForPayment(null)}
                className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer"
              >
                No, Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = students.find(std => String(std.studentId) === String(assignedStudentForPayment.studentId));
                  if (s) {
                    setCollectStudent(s);
                  }
                  setAssignedStudentForPayment(null);
                }}
                className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12px] font-semibold hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5"
              >
                Collect Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentConfirm && collectStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/30 text-[var(--blue-tx)] flex items-center justify-center mx-auto mb-4">
              <Clock size={24} />
            </div>
            <h3 className="text-base font-bold text-[var(--tx)] mb-1">Confirm Payment</h3>
            <p className="text-xs text-[var(--tx3)] mb-4">
              Are you sure you want to record a payment of <strong className="text-[var(--teal-tx)]">₹{Number(payAmount).toLocaleString()}</strong> via <strong>{paymentMethod}</strong> for <strong>{collectStudent.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentConfirm(false)}
                className="flex-1 py-2 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={processingPayment}
                onClick={async () => {
                  setShowPaymentConfirm(false);
                  const fakeEvent = { preventDefault: () => { } } as React.FormEvent<HTMLFormElement>;
                  await handleRecordPayment(fakeEvent);
                }}
                className="flex-1 py-2 bg-[var(--blue)] text-white rounded-xl text-[12px] font-semibold hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {processingPayment ? <Loader2 size={12} className="animate-spin" /> : null}
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignConfirm && pendingAssignData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-[var(--tx)] mb-1">Duplicate Fee Warning</h3>
            <p className="text-xs text-[var(--tx3)] mb-6">
              {duplicateWarningMsg}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAssignConfirm(false);
                  setPendingAssignData(null);
                }}
                className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowAssignConfirm(false);
                  const data = pendingAssignData;
                  setPendingAssignData(null);
                  await executeAssignFee(data.items, data.type, data.studentId, data.className, data.dueDate);
                }}
                className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-[12px] font-semibold hover:bg-amber-700 cursor-pointer"
              >
                Assign Anyway
              </button>
            </div>
          </div>
        </div>
      )}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--b)] mb-4">
              <h3 className="text-base font-bold text-[var(--tx)]">Import Fee Assignments</h3>
              <button onClick={() => setShowImportModal(false)} className="p-1 rounded-lg hover:bg-[var(--surf2)] text-[var(--tx3)] cursor-pointer"><X size={16} /></button>
            </div>

            <p className="text-xs text-[var(--tx3)] mb-4 leading-normal">
              Upload a spreadsheet (.xlsx, .xls, .csv) with the following headers: <br />
              <strong className="text-[var(--tx2)]">Admission Number</strong>, <strong className="text-[var(--tx2)]">Fee Category</strong>, <strong className="text-[var(--tx2)]">Amount</strong>, <strong className="text-[var(--tx2)]">Due Date</strong>.
            </p>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-[var(--b2)] rounded-xl p-6 text-center bg-[var(--surf2)]/20">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  id="fee-excel-upload"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setImportLoading(true);
                      try {
                        const reader = new FileReader();
                        reader.onload = async (evt) => {
                          try {
                            const bstr = evt.target?.result;
                            const wb = XLSX.read(bstr, { type: 'binary' });
                            const wsname = wb.SheetNames[0];
                            const ws = wb.Sheets[wsname];
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const data = XLSX.utils.sheet_to_json(ws) as any[];

                            const studentsList = await api.getResources('students');

                            let count = 0;
                            for (const row of data) {
                              const roll = String(row['Admission Number'] || row['Roll No'] || row['AdmissionNo'] || '').trim();
                              const category = String(row['Fee Category'] || row['Category'] || '').trim();
                              const amount = parseFloat(row['Amount']);
                              const dueDate = String(row['Due Date'] || row['DueDate'] || new Date().toISOString().slice(0, 10)).trim();

                              if (roll && category && !isNaN(amount)) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const foundStudent = studentsList.find((s: any) => String(s.enrollment_number).trim() === roll);
                                if (foundStudent) {
                                  await api.createResource('student-fees', {
                                    student_id: Number(foundStudent.id),
                                    category,
                                    amount,
                                    due_date: dueDate
                                  });
                                  count++;
                                }
                              }
                            }

                            await alert(`Successfully assigned fees for ${count} students!`, "Import Success");
                            setShowImportModal(false);
                            loadFeesData();
                          } catch (err) {
                            console.error(err);
                            await alert('Failed to parse Excel file rows', "Parse Error");
                          }
                        };
                        reader.readAsBinaryString(file);
                      } catch (err) {
                        await alert('Error reading Excel file', "Read Error");
                      } finally {
                        setImportLoading(false);
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('fee-excel-upload')?.click()}
                  className="px-4 py-2 bg-[var(--blue)] text-white rounded-xl text-[12px] font-semibold hover:opacity-90 cursor-pointer inline-flex items-center gap-1.5"
                  disabled={importLoading}
                >
                  {importLoading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Choose Excel File
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--b)]">
                <button
                  onClick={() => {
                    const headers = [['Admission Number', 'Fee Category', 'Amount', 'Due Date']];
                    const rows = [
                      ['101/2026', 'Tuition Fee - Term 2', '8500', '2026-10-31'],
                      ['102/2026', 'Transport Fee', '3000', '2026-10-31']
                    ];
                    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Template');
                    XLSX.writeFile(wb, 'KTS_Fee_Assignment_Template.xlsx');
                  }}
                  className="text-[11px] text-[var(--blue-tx)] hover:underline font-semibold cursor-pointer bg-transparent border-0"
                >
                  Download Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
