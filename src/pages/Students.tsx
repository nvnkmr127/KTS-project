import { useState, useEffect } from 'react';
import {
  Search, Plus, Upload, UserCheck, GraduationCap,
  Phone, Edit2, Trash2, Eye, X, Loader2, AlertCircle, CheckCircle2, Download, FileSpreadsheet, FileText,
  ArrowRightLeft, Users, ChevronLeft, ChevronRight, ArrowLeft, Edit, Printer,
  Clock,
  Percent,
  History, Filter, ChevronDown, ChevronUp, Banknote, List, User
} from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
import { KPICard } from '../components/KPICard';
import { api } from '../services/api';
import { formatDate } from '../utils/date';
import { useApp } from '../context/AppContext';
import { useDialog } from '../context/DialogContext';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface Student {
  id: string;
  name: string;
  roll: string;
  class: string;
  section: string;
  gender: 'Male' | 'Female';
  dob: string;
  parent: string;
  phone: string;
  address: string;
  status: 'Active' | 'Transferred' | 'Left';
  admissionDate: string;
  feeStatus: 'Paid' | 'Partial' | 'Unpaid';
  academicYearId?: string;
  academicYearName?: string;
  biometric_employee_code?: string;
  aadhar_number?: string;
}

const INITIALS_COLORS: Record<string, { bg: string; color: string }> = {
  M: { bg: 'var(--blue-bg)', color: 'var(--blue-tx)' },
  F: { bg: 'var(--pink-bg)', color: 'var(--pink-tx)' },
};

type ModalType = 'add' | 'view' | 'edit' | null;

export function Students() {
  const { alert, confirm } = useDialog();
  const { selectedAcademicYearId, setHasUnsavedChanges } = useApp();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);

  // Timeline states
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'payment' | 'concession'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState<string[]>([]);

  // States for Edit/Print/Delete inside Detailed Fee Breakdown
  const [selectedEditFee, setSelectedEditFee] = useState<any>(null);
  const [editPaidAmount, setEditPaidAmount] = useState('');
  const [savingEditPaid, setSavingEditPaid] = useState(false);
  const [showEditPaidModal, setShowEditPaidModal] = useState(false);

  // Concession states
  const [showConcessionModal, setShowConcessionModal] = useState(false);
  const [selectedConcessionFeeId, setSelectedConcessionFeeId] = useState('');
  const [concessionAmount, setConcessionAmount] = useState('');
  const [concessionReason, setConcessionReason] = useState('');
  const [applyingConcession, setApplyingConcession] = useState(false);

  // Collect Payment states
  const [collectStudent, setCollectStudent] = useState<any>(null);
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);
  const [ayFilter, setAyFilter] = useState(() => localStorage.getItem('selected_academic_year_id') || 'All');

  const [sortField, setSortField] = useState<'name' | 'roll' | 'class' | 'status' | 'feeStatus' | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSort = (field: 'name' | 'roll' | 'class' | 'status' | 'feeStatus') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleBulkStatusChange = async (newStatus: 'Active' | 'Transferred' | 'Left') => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const dbStatus = newStatus === 'Active' ? 'active' : newStatus === 'Left' ? 'left' : 'transfer';
      await Promise.all(selectedIds.map(id => api.updateResource('students', id, { status: dbStatus })));
      setSelectedIds([]);
      await loadStudents();
    } catch (err) {
      console.error('Bulk edit status failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteConfirmOpen(true);
  };

  const executeBulkDelete = async () => {
    setBulkDeleteConfirmOpen(false);
    setLoading(true);
    const previousStatuses = selectedIds.map(id => {
      const s = students.find(std => std.id === id);
      return { id, status: s ? s.status : 'Active' };
    });
    try {
      await Promise.all(selectedIds.map(id => api.updateResource('students', id, { status: 'left' })));
      const deletedCount = selectedIds.length;
      setSelectedIds([]);
      await loadStudents();
      showToast(
        `${deletedCount} students deleted.`,
        true,
        async () => {
          try {
            await Promise.all(previousStatuses.map(item => {
              const dbStatus = item.status === 'Active' ? 'active' : item.status === 'Left' ? 'left' : 'transfer';
              return api.updateResource('students', item.id, { status: dbStatus });
            }));
            await loadStudents();
            showToast('Bulk deletion undone successfully!', true);
          } catch (err) {
            console.error('Error undoing bulk delete:', err);
            showToast('Failed to undo bulk deletion.', false);
          }
        }
      );
    } catch (err) {
      console.error('Bulk delete failed:', err);
      showToast('Failed to delete selected students.', false);
    } finally {
      setLoading(false);
    }
  };

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [phoneVal, setPhoneVal] = useState('');
  const [biometricVal, setBiometricVal] = useState('');
  const [aadharVal, setAadharVal] = useState('');

  useEffect(() => {
    if (selectedAcademicYearId) {
      setAyFilter(selectedAcademicYearId);
    }
  }, [selectedAcademicYearId]);
  const [modal, setModal] = useState<ModalType>(null);
  const [activeDetailStudent, setActiveDetailStudent] = useState<Student | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [admittedStudentForFee, setAdmittedStudentForFee] = useState<{ id: string; name: string } | null>(null);

  const [toast, setToast] = useState<{ message: string; success: boolean; undoAction?: () => Promise<void> } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [toastTimeoutId, setToastTimeoutId] = useState<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const showToast = (message: string, success: boolean, undoAction?: () => Promise<void>) => {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }
    setToast({ message, success, undoAction });
    const id = setTimeout(() => {
      setToast(null);
    }, 6000);
    setToastTimeoutId(id);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [batchesList, setBatchesList] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [modalSelectedClass, setModalSelectedClass] = useState<string>('');
  const [modalSelectedSection, setModalSelectedSection] = useState<string>('');
  const [attendancePercentage, setAttendancePercentage] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [studentFeesList, setStudentFeesList] = useState<any[]>([]);
  const [loadingStudentFees, setLoadingStudentFees] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Derived concession variables
  const selectedConcessionFee = studentFeesList.find(f => String(f.id) === selectedConcessionFeeId);
  const selectedConcessionRemaining = selectedConcessionFee ? (Number(selectedConcessionFee.amount) - Number(selectedConcessionFee.paid_amount) - Number(selectedConcessionFee.concession_amount)) : 0;

  useEffect(() => {
    if (modal !== 'view' && !activeDetailStudent) {
      setShowCalendar(false);
      setCurrentMonth(new Date());
    }
  }, [modal, activeDetailStudent]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Derive classes and sections from batches (mirrors Classes.tsx logic)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getClassesFromBatches = (batches: any[]): string[] => {
    if (!batches || batches.length === 0) {
      // Fallback safety classes if fail to load
      return ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Priority: Union of default classes (1-10) and any custom classes from database batches
    const classSet = new Set<string>(['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    batches.forEach((b: any) => {
      const match = b.name?.match(/^(.+?)([A-Z])$/);
      if (match) classSet.add(match[1]);
    });
    return Array.from(classSet).sort((a, b) => {
      const nA = Number(a), nB = Number(b);
      if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
      if (!isNaN(nA)) return -1;
      if (!isNaN(nB)) return 1;
      return a.localeCompare(b);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getSectionsForClass = (batches: any[], classId: string): string[] => {
    if (!batches || batches.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Fallback safety sections if fail to load
      return ['A', 'B', 'C'];
    }
    const sectionSet = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    batches.forEach((b: any) => {
      const match = b.name?.match(/^(.+?)([A-Z])$/);
      if (match && match[1] === classId) sectionSet.add(match[2]);
    });
    const sorted = Array.from(sectionSet).sort();
    // If we have batches loaded but none for this class, fall back to Class tab's mock sections ['A', 'B']
    return sorted.length > 0 ? sorted : ['A', 'B'];
  };

  const availableClasses = getClassesFromBatches(batchesList);
  const availableSections = getSectionsForClass(batchesList, modalSelectedClass);

  // Reset section to first available when class changes
  useEffect(() => {
    if (modalSelectedClass) {
      const sections = getSectionsForClass(batchesList, modalSelectedClass);
      setModalSelectedSection(prev => sections.includes(prev) ? prev : (sections[0] || 'A'));
    }
  }, [modalSelectedClass, batchesList]);

  // If batchesList loads AFTER 'add' modal opened, refresh the default class/section
  useEffect(() => {
    if (modal === 'add' && batchesList.length > 0 && !modalSelectedClass) {
      const firstClass = getClassesFromBatches(batchesList)[0];
      const cls = firstClass || '8';
      setModalSelectedClass(cls);
      setModalSelectedSection(getSectionsForClass(batchesList, cls)[0] || 'A');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchesList, modal]);

  useEffect(() => {
    if (modal === 'add') {
      setPhoneVal('');
      setBiometricVal('');
      setAadharVal('');
      setFormErrors({});
      setHasUnsavedChanges(false);
      // Set default class to the first available class
      const firstClass = getClassesFromBatches(batchesList)[0];
      const cls = firstClass || '8';
      setModalSelectedClass(cls);
      setModalSelectedSection(getSectionsForClass(batchesList, cls)[0] || 'A');
    } else if (modal === 'edit' && selected) {
      setPhoneVal(selected.phone || '');
      setBiometricVal(selected.biometric_employee_code || '');
      setAadharVal(selected.aadhar_number || '');
      setFormErrors({});
      setHasUnsavedChanges(false);
      setModalSelectedClass(selected.class || '8');
      setModalSelectedSection(selected.section || 'A');
    } else {
      setHasUnsavedChanges(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal, selected, setHasUnsavedChanges]);

  useEffect(() => {
    const viewStudent = activeDetailStudent;
    if (viewStudent) {
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
    }
  }, [activeDetailStudent]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function loadInitialData() {
      try {
        const [batchesData, ayData] = await Promise.all([
          api.getResources('batches'),
          api.getResources('academic-years'),
        ]);
        setBatchesList(batchesData);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAcademicYears((ayData || []).map((ay: any) => ({ id: String(ay.id), name: ay.name })));
      } catch (e) {
        console.error(e);
      }
    }
    loadInitialData();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEffect(() => {
    if (activeDetailStudent) {
      const batchName = `${activeDetailStudent.class}${activeDetailStudent.section}`;
      const foundBatch = batchesList.find(b => b.name.toLowerCase() === batchName.toLowerCase());
      if (foundBatch) {
        api.getBatchStudentPercentages(foundBatch.id)
          .then(res => {
            if (res.success && res.data && Array.isArray(res.data.students)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const match = res.data.students.find((std: any) => String(std.id) === String(activeDetailStudent.id));
              if (match) {
                setAttendancePercentage(match.percentage);
              } else {
                setAttendancePercentage(85);
              }
            }
          })
          .catch(() => {
            setAttendancePercentage(85);
          });
      } else {
        setAttendancePercentage(85);
      }
    } else {
      setAttendancePercentage(null);
    }
  }, [activeDetailStudent, batchesList]);

  const reloadStudentFees = (overrideStudentId?: string) => {
    const studentId = overrideStudentId || activeDetailStudent?.id;
    if (studentId) {
      setLoadingStudentFees(true);
      api.getResources('student-fees', { student_id: studentId })
        .then(res => {
          const fees = res || [];
          setStudentFeesList(fees);
          // Set initial fee selection for collect payment
          const outstanding = fees.filter((f: any) => (Number(f.amount) - Number(f.paid_amount) - Number(f.concession_amount)) > 0);
          setSelectedFeeIds(outstanding.map((f: any) => String(f.id)));
          const sum = outstanding.reduce((total: number, f: any) => {
            const rem = Number(f.amount) - Number(f.paid_amount) - Number(f.concession_amount);
            return total + Math.max(0, rem);
          }, 0);
          setPayAmount(String(sum));
        })
        .catch(err => {
          console.error('Error fetching student fees:', err);
          setStudentFeesList([]);
          setSelectedFeeIds([]);
          setPayAmount('');
        })
        .finally(() => {
          setLoadingStudentFees(false);
        });
    }
  };

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

  useEffect(() => {
    if (activeDetailStudent) {
      reloadStudentFees();
    } else {
      setStudentFeesList([]);
    }
  }, [activeDetailStudent]);

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
      showToast('Paid amount updated successfully!', true);

      // Reload details
      reloadStudentFees();
      loadStudents();
    } catch (err) {
      console.error('Error updating paid amount:', err);
      showToast('Failed to update paid amount.', false);
    } finally {
      setSavingEditPaid(false);
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
          concession_reason: JSON.stringify({ text: concessionReason, collectedBy: user?.name || 'Super Admin' }),
        });
        showToast('Concession applied successfully!', true);
        setShowConcessionModal(false);
        setConcessionAmount('');
        setConcessionReason('');

        // Reload details
        reloadStudentFees();
        loadStudents();
      }
    } catch (err) {
      console.error('Error applying concession:', err);
      showToast('Failed to apply concession.', false);
    } finally {
      setApplyingConcession(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedFeeIds.length === 0 || !payAmount || !activeDetailStudent) return;
    setProcessingPayment(true);
    try {
      let remainingPayment = Number(payAmount);
      const allocated: { name: string; amount: number }[] = [];
      const txnId = 'RCP' + new Date().getFullYear() + Math.floor(100000 + Math.random() * 900000);

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
              remarks: JSON.stringify({ text: paymentRemarks, collectedBy: user?.name || 'Super Admin' }),
              transaction_id: txnId,
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
        studentName: activeDetailStudent.name,
        studentClass: `${activeDetailStudent.class}${activeDetailStudent.section}`,
        allocatedPayments: allocated,
        totalPaid: Number(payAmount) - remainingPayment,
      });

      setCollectStudent(null);
      showToast('Payment recorded successfully!', true);

      // Reload details
      reloadStudentFees();
      loadStudents();
    } catch (err) {
      console.error('Error recording payment:', err);
      showToast('Failed to record payment.', false);
    } finally {
      setProcessingPayment(false);
    }
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
              .text-header-lg { font-size: 14px; font-weight: bold; color: #1e293b; line-height: 1.2; }
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

  useEffect(() => {
    if (activeDetailStudent) {
      const match = students.find(std => String(std.id) === String(activeDetailStudent.id));
      if (match) {
        if (JSON.stringify(match) !== JSON.stringify(activeDetailStudent)) {
          setActiveDetailStudent(match);
        }
      } else {
        setActiveDetailStudent(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, [students]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, classFilter, statusFilter, ayFilter]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getResources('students', { with: 'batch.academicYear', limit: '1000' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = data.map((s: any) => ({
        id: String(s.id),
        name: s.name,
        roll: s.enrollment_number || 'N/A',
        class: s.class || '8',
        section: s.section || 'A',
        gender: s.gender || 'Male',
        dob: s.dob ? s.dob.slice(0, 10) : '',
        parent: s.father_name || 'N/A',
        phone: s.student_mobile || '',
        address: s.village || '',
        status: (s.status === 'active' || s.status === 'Active') ? 'Active' : (s.status === 'left' || s.status === 'dropout' || s.status === 'Left') ? 'Left' : (s.status === 'transfer' || s.status === 'transferred' || s.status === 'Transferred') ? 'Transferred' : 'Active',
        admissionDate: s.admission_date ? s.admission_date.slice(0, 10) : '',
        feeStatus: s.fee_status || 'Paid',
        academicYearId: s.batch && s.batch.academic_year ? String(s.batch.academic_year.id) : '',
        academicYearName: s.batch && s.batch.academic_year ? s.batch.academic_year.name : 'N/A',
        biometric_employee_code: s.biometric_employee_code || '',
        aadhar_number: s.aadhar_number || '',
      }));
      setStudents(mapped);
    } catch (err) {
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    const fd = new FormData(e.currentTarget);
    const firstName = fd.get('firstName') as string;
    const lastName = fd.get('lastName') as string;
    const statusVal = fd.get('studentStatus') as string;
    const parentVal = fd.get('parent') as string;
    const phone = phoneVal;
    const bio = biometricVal;
    const aadharNum = aadharVal;

    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = 'First Name is required';
    if (!lastName.trim()) errors.lastName = 'Last Name is required';
    if (!parentVal.trim()) errors.parent = 'Parent Name is required';
    if (!phone) {
      errors.phone = 'Mobile Number is required';
    } else if (phone.replace(/\D/g, '').length !== 10) {
      errors.phone = 'Mobile Number must be exactly 10 digits';
    }
    if (bio && !/^[A-Za-z0-9-]+$/.test(bio)) {
      errors.biometric_employee_code = 'Biometric Code must be alphanumeric (hyphens allowed)';
    }
    if (aadharNum && aadharNum.replace(/\D/g, '').length !== 12) {
      errors.aadhar_number = 'Aadhar Card Number must be exactly 12 digits';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSaving(false);
      return;
    }

    const data = {
      name: `${firstName} ${lastName}`,
      gender: fd.get('gender'),
      dob: fd.get('dob'),
      admission_date: fd.get('admissionDate'),
      father_name: parentVal,
      student_mobile: phone,
      village: fd.get('address'),
      class: fd.get('class'),
      section: fd.get('section'),
      status: statusVal === 'Active' ? 'active' : statusVal === 'Left' ? 'left' : 'transfer',
      biometric_employee_code: bio || null,
      aadhar_number: aadharNum || null,
    };

    try {
      const isAdding = modal === 'add';
      let created = null;
      if (isAdding) {
        created = await api.createResource('students', data);
      } else if (modal === 'edit' && selected) {
        await api.updateResource('students', selected.id, data);
      }
      setHasUnsavedChanges(false);
      setModal(null);
      setSaveError('');
      await loadStudents();
      if (isAdding && created && created.id) {
        setAdmittedStudentForFee({
          id: String(created.id),
          name: created.name || `${firstName} ${lastName}`,
        });
      }
    } catch (err) {
      console.error('Error saving student:', err);
      setSaveError((err as Error).message || 'Failed to save student. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const [transferringId, setTransferringId] = useState<string | null>(null);

  const handleTransferClick = async (id: string) => {
    setTransferringId(id);
    try {
      await api.updateResource('students', id, { status: 'transfer' });
      await loadStudents();
    } catch (err) {
      console.error('Error transferring student:', err);
    } finally {
      setTransferringId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    const targetStudent = students.find(s => s.id === deleteConfirmId);
    const previousStatus = targetStudent ? targetStudent.status : 'Active';
    try {
      await api.updateResource('students', deleteConfirmId, { status: 'left' });
      const studentId = deleteConfirmId;
      setDeleteConfirmId(null);
      await loadStudents();
      showToast(
        `Student "${targetStudent?.name}" has been deleted.`,
        true,
        async () => {
          try {
            const dbStatus = previousStatus === 'Active' ? 'active' : previousStatus === 'Left' ? 'left' : 'transfer';
            await api.updateResource('students', studentId, { status: dbStatus });
            await loadStudents();
            showToast('Student restored successfully!', true);
          } catch (err) {
            console.error('Error undoing delete:', err);
            showToast('Failed to restore student.', false);
          }
        }
      );
    } catch (err) {
      console.error('Error marking student as left:', err);
      setDeleteConfirmId(null);
      showToast('Failed to delete student.', false);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = students.filter((s) => {
    const matchSearch =
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.roll || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.parent || '').toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === 'All' || s.class === classFilter;
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchAy = ayFilter === 'All' || String(s.academicYearId) === ayFilter;
    return matchSearch && matchClass && matchStatus && matchAy;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    if (sortField === 'class') {
      const numA = parseInt(a.class) || 0;
      const numB = parseInt(b.class) || 0;
      if (numA !== numB) return sortOrder === 'asc' ? numA - numB : numB - numA;
      valA = a.section || '';
      valB = b.section || '';
    }
    return sortOrder === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / ITEMS_PER_PAGE));
  const paginated = sortedFiltered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const activeCount = students.filter((s) => s.status === 'Active').length;
  const maleCount = students.filter((s) => s.gender === 'Male').length;
  const femaleCount = students.filter((s) => s.gender === 'Female').length;

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const newAdmissionsCount = students.filter(s => s.admissionDate && new Date(s.admissionDate) >= threeMonthsAgo).length;

  // ─── In-screen student detail view (FeeManagement style) ─────────────────
  const renderStudentDetail = () => {
    if (!activeDetailStudent) return null;
    const s = activeDetailStudent;

    const totalFee = studentFeesList.reduce((sum, f) => sum + Number(f.amount), 0);
    const totalPaid = studentFeesList.reduce((sum, f) => sum + Number(f.paid_amount), 0);
    const totalDue = studentFeesList.reduce((sum, f) => sum + Math.max(0, Number(f.amount) - Number(f.paid_amount) - Number(f.concession_amount)), 0);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const formattedMonthYear = `${monthNames[month]} ${year}`;

    const getDayAttendanceInfo = (dateStr: string) => {
      const dayRecords = attendanceRecords.filter(
        r => String(r.studentId) === String(s.id) && r.date === dateStr
      );
      if (dayRecords.length === 0) return null;
      const presentCount = dayRecords.filter(r => r.status?.toLowerCase() === 'present' || r.status?.toLowerCase() === 'late').length;
      const absentCount = dayRecords.filter(r => r.status?.toLowerCase() === 'absent').length;
      if (presentCount > 0 && absentCount > 0) return { status: 'partial' as const, className: 'bg-[var(--purple-bg)] text-[var(--purple-tx)] border-[var(--purple-tx)]/25', label: 'Partial', details: `${presentCount} P / ${absentCount} A` };
      if (presentCount > 0) return { status: 'present' as const, className: 'bg-[var(--green-bg)] text-[var(--green-tx)] border-[var(--green-tx)]/25', label: 'Present', details: `${presentCount} Present` };
      if (absentCount > 0) return { status: 'absent' as const, className: 'bg-[var(--red-bg)] text-[var(--red-tx)] border-[var(--red-tx)]/25', label: 'Absent', details: `${absentCount} Absent` };
      return null;
    };

    // Helper functions for timeline formatting
    const formatTimeAgo = (dateInput: string | Date | null | undefined): string => {
      if (!dateInput) return 'some time ago';
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return 'some time ago';
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
      const months = Math.floor(days / 30);
      if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
      const years = Math.floor(months / 12);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    };

    const formatDateTime = (dateInput: string | Date | null | undefined): string => {
      if (!dateInput) return '';
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    // Timeline activities processing
    const activities: any[] = [];
    const paymentGroups: Record<string, any[]> = {};

    studentFeesList.forEach((fee) => {
      if (Number(fee.paid_amount) > 0) {
        let groupKey = '';
        if (fee.transaction_id) {
          groupKey = `txn-${fee.transaction_id}`;
        } else {
          const dateMs = new Date(fee.paid_date || fee.updated_at || '').getTime();
          const roundedTime = Math.round(dateMs / 10000) * 10000;
          groupKey = `legacy-${roundedTime}-${fee.payment_method}-${fee.remarks}`;
        }

        if (!paymentGroups[groupKey]) {
          paymentGroups[groupKey] = [];
        }
        paymentGroups[groupKey].push(fee);
      }
    });

    Object.entries(paymentGroups).forEach(([key, fees]) => {
      const totalPaidInGroup = fees.reduce((sum, f) => sum + (Number(f.paid_amount) || 0), 0);
      const firstFee = fees[0];
      
      let remarksText = '';
      let collectedBy = user?.name || 'Admin';
      try {
        if (firstFee.remarks) {
          if (firstFee.remarks.startsWith('{')) {
            const parsed = JSON.parse(firstFee.remarks);
            remarksText = parsed.text || '';
            collectedBy = parsed.collectedBy || user?.name || 'Admin';
          } else {
            remarksText = firstFee.remarks;
          }
        }
      } catch (e) {
        remarksText = firstFee.remarks || '';
      }

      const receiptNum = firstFee.transaction_id || `RCP${new Date(firstFee.updated_at || Date.now()).getFullYear()}${String(firstFee.id).padStart(6, '0')}`;

      activities.push({
        id: `pay-${receiptNum}`,
        type: 'payment',
        title: 'Payment Received',
        subtitle: `Payment of ₹${totalPaidInGroup.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} received via ${firstFee.payment_method || 'Cash'}`,
        amount: totalPaidInGroup,
        method: firstFee.payment_method || 'Cash',
        receipt: receiptNum,
        componentsCount: fees.length,
        components: fees.map(f => ({
          name: f.fee_category?.name || f.feeCategory?.name || f.category || 'School Fee',
          amount: Number(f.paid_amount)
        })),
        date: firstFee.paid_date || firstFee.updated_at || new Date().toISOString(),
        collectedBy,
        remarks: remarksText
      });
    });

    studentFeesList.forEach((fee) => {
      if (Number(fee.concession_amount) > 0) {
        let reasonText = '';
        let approvedBy = 'Super Admin';
        try {
          if (fee.concession_reason) {
            if (fee.concession_reason.startsWith('{')) {
              const parsed = JSON.parse(fee.concession_reason);
              reasonText = parsed.text || '';
              approvedBy = parsed.collectedBy || 'Super Admin';
            } else {
              reasonText = fee.concession_reason;
            }
          }
        } catch (e) {
          reasonText = fee.concession_reason || '';
        }

        const categoryName = fee.fee_category?.name || fee.feeCategory?.name || fee.category || 'School Fee';

        activities.push({
          id: `con-${fee.id}`,
          type: 'concession',
          title: 'Concession Applied',
          subtitle: `Concession of ₹${Number(fee.concession_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} applied for ${categoryName}`,
          amount: Number(fee.concession_amount),
          reason: reasonText,
          categoryName,
          date: fee.concession_approved_at || fee.updated_at || new Date().toISOString(),
          collectedBy: approvedBy
        });
      }
    });

    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredActivities = activities.filter(act => {
      if (timelineFilter === 'all') return true;
      return act.type === timelineFilter;
    });

    return (
      <div className="space-y-3">
        {/* Back header */}
        <div className="flex items-center justify-between border-b border-[var(--b)] pb-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { setActiveDetailStudent(null); setShowCalendar(false); setCurrentMonth(new Date()); }}
              className="p-1.5 hover:bg-[var(--surf2)] rounded-lg text-[var(--tx2)] hover:text-[var(--tx)] cursor-pointer"
              title="Back to Student Directory"
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <h2 className="text-[13.5px] font-bold text-[var(--tx)]">Student Profile Detail</h2>
              <p className="text-[10px] text-[var(--tx3)]">Personal information, attendance and fee summary</p>
            </div>
          </div>
          <button
            onClick={() => { setSelected(s); setModal('edit'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg hover:opacity-90 cursor-pointer font-medium"
          >
            <Edit2 size={12} /> Edit Profile
          </button>
        </div>

        {/* Profile card */}
        <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--blue-bg)] flex items-center justify-center text-[20px] font-bold text-[var(--blue-tx)] flex-shrink-0">
              {s.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-center sm:text-left">
              <div className="text-[16px] font-bold text-[var(--tx)]">{s.name}</div>
              <div className="text-[11.5px] text-[var(--tx3)] mt-0.5">Roll No: <span className="font-mono">{s.roll}</span></div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <Badge variant="blue">Class {s.class} — {s.section}</Badge>
                <Badge variant={s.status === 'Active' ? 'green' : s.status === 'Left' ? 'red' : 'amber'}>{s.status}</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-end flex-shrink-0">
            <button
              onClick={() => {
                setSelectedConcessionFeeId('');
                setConcessionAmount('');
                setConcessionReason('');
                setShowConcessionModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer font-medium transition-all"
            >
              <Percent size={12} className="text-[var(--blue-tx)]" /> Fee Concession
            </button>
            {totalDue > 0 && (
              <button
                onClick={() => setCollectStudent(s)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg hover:opacity-90 cursor-pointer font-medium transition-all"
              >
                <Clock size={12} /> Collect Payment
              </button>
            )}
          </div>
        </Card>

        {!showCalendar ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* Personal Info */}
            <Card className="space-y-4">
              <div className="text-[12.5px] font-bold text-[var(--tx)] pb-2 border-b border-[var(--b)] flex items-center gap-1.5">
                <GraduationCap size={13} className="text-[var(--tx3)]" /> Personal &amp; Academic Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Gender', value: s.gender },
                  { label: 'Date of Birth', value: formatDate(s.dob) },
                  { label: 'Admission Date', value: formatDate(s.admissionDate) },
                  { label: 'Parent / Guardian', value: s.parent },
                  { label: 'Mobile', value: s.phone },
                  { label: 'Aadhar Number', value: s.aadhar_number },
                ].map(item => (
                  <div key={item.label} className="bg-[var(--surf2)] rounded-xl p-3">
                    <div className="text-[10px] text-[var(--tx3)] mb-0.5">{item.label}</div>
                    <div className="text-[12px] font-semibold text-[var(--tx)]">{item.value || 'N/A'}</div>
                  </div>
                ))}
                <div
                  onClick={() => setShowCalendar(true)}
                  className="bg-[var(--surf2)] rounded-xl p-3 sm:col-span-2 cursor-pointer hover:bg-[var(--surf3)] border border-transparent hover:border-[var(--blue-tx)]/20 transition-all group"
                >
                  <div className="text-[10px] text-[var(--tx3)] mb-0.5 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Users size={11} /> Overall Attendance</span>
                    <span className="text-[9px] text-[var(--blue-tx)] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">Click to view calendar →</span>
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className={`text-[13px] font-bold ${attendancePercentage !== null && attendancePercentage >= 75 ? 'text-[var(--teal-tx)]' : attendancePercentage !== null && attendancePercentage >= 60 ? 'text-[var(--amber-tx)]' : 'text-[var(--red-tx)]'
                      }`}>{attendancePercentage !== null ? `${attendancePercentage}%` : 'Loading...'}</span>
                    {attendancePercentage !== null && (
                      <div className="flex-1 h-2 bg-[var(--surf)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${attendancePercentage >= 75 ? 'bg-[var(--teal)]' : attendancePercentage >= 60 ? 'bg-[var(--amber)]' : 'bg-[var(--red)]'
                          }`} style={{ width: `${attendancePercentage}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-[var(--surf2)] rounded-xl p-3">
                <div className="text-[10px] text-[var(--tx3)] mb-0.5">Address</div>
                <div className="text-[12px] font-semibold text-[var(--tx)]">{s.address || 'N/A'}</div>
              </div>
            </Card>

            {/* Fee Summary */}
            <Card className="space-y-4">
              <div className="text-[12.5px] font-bold text-[var(--tx)] pb-2 border-b border-[var(--b)] flex items-center gap-1.5">
                <FileText size={13} className="text-[var(--tx3)]" /> Fee Summary &amp; Ledger
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[var(--surf2)] rounded-xl p-2.5 text-center">
                  <div className="text-[9px] text-[var(--tx3)] mb-0.5">Total Fee</div>
                  <div className="text-[13px] font-bold text-[var(--tx)]">₹{totalFee.toLocaleString()}</div>
                </div>
                <div className="bg-[var(--surf2)] rounded-xl p-2.5 text-center border-l-2 border-[var(--teal)]">
                  <div className="text-[9px] text-[var(--tx3)] mb-0.5">Paid</div>
                  <div className="text-[13px] font-bold text-[var(--teal-tx)]">₹{totalPaid.toLocaleString()}</div>
                </div>
                <div className="bg-[var(--surf2)] rounded-xl p-2.5 text-center border-l-2 border-[var(--red)]">
                  <div className="text-[9px] text-[var(--tx3)] mb-0.5">Due</div>
                  <div className="text-[13px] font-bold text-[var(--red-tx)]">₹{totalDue.toLocaleString()}</div>
                </div>
              </div>
              <div className="text-[11px] font-bold text-[var(--tx)]">Detailed Fee Breakdown</div>
              {loadingStudentFees ? (
                <div className="text-center py-6 text-[11px] text-[var(--tx3)] italic flex items-center justify-center gap-2">
                  <Loader2 size={13} className="animate-spin" /> Loading breakdown...
                </div>
              ) : studentFeesList.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-[var(--tx3)] italic flex flex-col items-center justify-center gap-2">
                  <span>No fee records assigned.</span>
                  {activeDetailStudent && (
                    <button
                      onClick={() => {
                        sessionStorage.setItem('admitted_student', JSON.stringify({ id: String(activeDetailStudent.id), name: activeDetailStudent.name }));
                        window.history.pushState({}, '', '/fee-management');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="mt-1 flex items-center gap-1 px-2.5 py-1.5 text-[10.5px] bg-[var(--blue)] text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer font-semibold"
                    >
                      <Plus size={11} /> Assign Fee
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {studentFeesList.map(fee => {
                    const feeName = fee.fee_category?.name || fee.feeCategory?.name || fee.category || 'School Fee';
                    const bal = Number(fee.amount) - Number(fee.paid_amount) - Number(fee.concession_amount);
                    return (
                      <div key={fee.id} className="p-2.5 bg-[var(--surf2)] border border-[var(--b)] rounded-xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-[var(--tx)] truncate">{feeName}</div>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] text-[var(--tx3)] mt-0.5">
                            <span>Amount: ₹{Number(fee.amount).toLocaleString()}</span>
                            {Number(fee.concession_amount) > 0 && <span className="text-[var(--purple-tx)] font-semibold">Concession: -₹{Number(fee.concession_amount).toLocaleString()}</span>}
                            <span>Paid: ₹{Number(fee.paid_amount).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1.5 justify-end mb-1">
                            {Number(fee.paid_amount) > 0 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedEditFee(fee);
                                    setEditPaidAmount(String(fee.paid_amount));
                                    setShowEditPaidModal(true);
                                  }}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-[var(--surf3)] text-[var(--tx2)] hover:text-[var(--tx)] rounded-md transition-colors cursor-pointer"
                                  title="Edit Paid Amount"
                                >
                                  <Edit size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrint({
                                    studentName: s.name,
                                    studentClass: `${s.class}${s.section}`,
                                    allocatedPayments: [{
                                      name: feeName,
                                      amount: Number(fee.paid_amount)
                                    }],
                                    totalPaid: Number(fee.paid_amount)
                                  })}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-[var(--surf3)] text-[var(--blue-tx)] rounded-md transition-colors cursor-pointer"
                                  title="Print Receipt"
                                >
                                  <Printer size={11} />
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
                                        reloadStudentFees();
                                        loadStudents();
                                        showToast('Payment deleted successfully!', true);
                                      } catch (err) {
                                        console.error('Failed to delete payment:', err);
                                        showToast('Failed to delete payment.', false);
                                      }
                                    }
                                  }}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-[var(--surf3)] text-[var(--red-tx)] rounded-md transition-colors cursor-pointer"
                                  title="Delete/Reverse Payment"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </>
                            )}
                            {bal > 0 ? (
                              <Badge variant="red">Due: ₹{bal.toLocaleString()}</Badge>
                            ) : (
                              <Badge variant="teal">Paid</Badge>
                            )}
                          </div>
                          <div className="text-[8px] text-[var(--tx3)]">Due: {fee.due_date}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Recent Activity Timeline */}
          <Card className="p-4 mt-3.5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--b)] pb-3 relative">
              <span className="text-[13px] font-bold text-[var(--tx)] flex items-center gap-1.5">
                <History size={14} className="text-[var(--blue-tx)]" /> Recent Activity Timeline
              </span>
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold border border-[var(--blue-tx)]/20 bg-[var(--blue-bg)] text-[var(--blue-tx)] rounded-lg hover:opacity-90 transition-all cursor-pointer"
                >
                  <Filter size={11} /> Filter <ChevronDown size={11} className={`transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showFilterDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilterDropdown(false)} />
                    <div className="absolute right-0 mt-1.5 w-44 bg-[var(--surf)] border border-[var(--b)] rounded-xl shadow-lg z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                      <button
                        onClick={() => { setTimelineFilter('all'); setShowFilterDropdown(false); }}
                        className={`flex items-center gap-2 w-full px-3.5 py-2 text-left text-[11.5px] hover:bg-[var(--surf2)] transition-colors cursor-pointer ${timelineFilter === 'all' ? 'text-[var(--blue-tx)] font-semibold bg-[var(--blue-bg)]/20' : 'text-[var(--tx2)]'}`}
                      >
                        <List size={12} className={timelineFilter === 'all' ? 'text-[var(--blue-tx)]' : 'text-[var(--tx3)]'} /> All Activities
                      </button>
                      <button
                        onClick={() => { setTimelineFilter('payment'); setShowFilterDropdown(false); }}
                        className={`flex items-center gap-2 w-full px-3.5 py-2 text-left text-[11.5px] hover:bg-[var(--surf2)] transition-colors cursor-pointer ${timelineFilter === 'payment' ? 'text-[var(--blue-tx)] font-semibold bg-[var(--blue-bg)]/20' : 'text-[var(--tx2)]'}`}
                      >
                        <Banknote size={12} className={timelineFilter === 'payment' ? 'text-[var(--blue-tx)]' : 'text-[var(--tx3)]'} /> Payments Only
                      </button>
                      <button
                        onClick={() => { setTimelineFilter('concession'); setShowFilterDropdown(false); }}
                        className={`flex items-center gap-2 w-full px-3.5 py-2 text-left text-[11.5px] hover:bg-[var(--surf2)] transition-colors cursor-pointer ${timelineFilter === 'concession' ? 'text-[var(--blue-tx)] font-semibold bg-[var(--blue-bg)]/20' : 'text-[var(--tx2)]'}`}
                      >
                        <Percent size={12} className={timelineFilter === 'concession' ? 'text-[var(--blue-tx)]' : 'text-[var(--tx3)]'} /> Concessions Only
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Timeline content */}
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-[11.5px] text-[var(--tx3)] italic">
                No recent activity found.
              </div>
            ) : (
              <div className="relative pl-2.5 space-y-5">
                {/* Vertical line connector */}
                <div className="absolute left-[20px] top-4 bottom-4 w-0.5 bg-[var(--b)]" />

                {filteredActivities.map((act) => {
                  const isExpanded = expandedActivities.includes(act.id);
                  return (
                    <div key={act.id} className="flex gap-4 relative">
                      {/* Event icon dot */}
                      <div className="relative z-10 flex-shrink-0 mt-1">
                        {act.type === 'payment' ? (
                          <div className="w-8 h-8 rounded-full bg-[#10b981] text-white flex items-center justify-center shadow-md shadow-emerald-500/10">
                            <Banknote size={14} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-md shadow-violet-500/10">
                            <Percent size={14} />
                          </div>
                        )}
                      </div>

                      {/* Card box */}
                      <div className="flex-1 bg-[var(--surf2)] border border-[var(--b)] border-l-[3px] border-[var(--blue)] rounded-xl p-3.5 space-y-2.5 relative shadow-sm">
                        {/* Title & DateTime */}
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[13px] font-bold text-[var(--tx)]">{act.title}</div>
                            <div className="text-[11.5px] text-[var(--tx2)] mt-0.5">{act.subtitle}</div>
                          </div>
                          <div className="text-right text-[10px] text-[var(--tx3)] leading-tight">
                            <div>{formatDateTime(act.date).split(', ')[0]}</div>
                            <div className="mt-0.5">{formatDateTime(act.date).split(', ')[1]}</div>
                          </div>
                        </div>

                        {/* Details Button */}
                        <div>
                          <button
                            onClick={() => {
                              if (isExpanded) {
                                setExpandedActivities(expandedActivities.filter(id => id !== act.id));
                              } else {
                                setExpandedActivities([...expandedActivities, act.id]);
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[10.5px] border border-[var(--b)] bg-[var(--surf)] rounded-lg text-[var(--tx2)] hover:text-[var(--tx)] transition-all cursor-pointer font-medium"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp size={11} /> Details
                              </>
                            ) : (
                              <>
                                <ChevronDown size={11} /> Details
                              </>
                            )}
                          </button>
                        </div>

                        {/* Expanded Details section */}
                        {isExpanded && (
                          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-[var(--tx2)] animate-fade-in">
                            {act.type === 'payment' ? (
                              <>
                                <div>
                                  <span className="font-semibold text-[var(--tx3)]">Amount:</span> ₹{act.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div>
                                  <span className="font-semibold text-[var(--tx3)]">Receipt:</span> <span className="font-mono">{act.receipt}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-[var(--tx3)]">Method:</span> {act.method}
                                </div>
                                <div>
                                  <span className="font-semibold text-[var(--tx3)]">Components:</span> {act.componentsCount} items
                                </div>
                                {act.remarks && (
                                  <div className="sm:col-span-2 mt-1 pt-1.5 border-t border-[var(--b)]/30">
                                    <span className="font-semibold text-[var(--tx3)]">Remarks:</span> {act.remarks}
                                  </div>
                                )}
                                {act.components && act.components.length > 0 && (
                                  <div className="sm:col-span-2 mt-1.5 pt-1.5 border-t border-[var(--b)]/30 space-y-1">
                                    <span className="font-semibold text-[var(--tx3)] text-[10.5px] block mb-1">Payment Breakdown:</span>
                                    {act.components.map((c: any, i: number) => (
                                      <div key={i} className="flex justify-between text-[10.5px] pl-1 border-l border-[var(--b)]">
                                        <span>{c.name}</span>
                                        <span className="font-medium">₹{c.amount.toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div>
                                  <span className="font-semibold text-[var(--tx3)]">Concession:</span> ₹{act.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div>
                                  <span className="font-semibold text-[var(--tx3)]">Category:</span> {act.categoryName}
                                </div>
                                {act.reason && (
                                  <div className="sm:col-span-2 mt-1 pt-1.5 border-t border-[var(--b)]/30">
                                    <span className="font-semibold text-[var(--tx3)]">Reason:</span> {act.reason}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* Footer user & time */}
                        <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--tx3)] pt-2 border-t border-[var(--b)]/30 mt-2">
                          <User size={11} className="text-[var(--tx3)]" />
                          <span>{act.collectedBy}</span>
                          <span className="mx-1">•</span>
                          <Clock size={11} className="text-[var(--tx3)]" />
                          <span>{formatTimeAgo(act.date)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      ) : (
          // Calendar View
          <Card className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-[var(--b)]">
              <button
                onClick={() => setShowCalendar(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold border border-[var(--b)] bg-[var(--surf2)] rounded-lg text-[var(--tx)] hover:bg-[var(--surf3)] transition-all cursor-pointer"
              >
                <ArrowLeft size={12} /> Back to Profile
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg border border-[var(--b)] bg-[var(--surf2)] text-[var(--tx)] hover:bg-[var(--surf3)] transition-colors cursor-pointer" title="Previous Month">
                  <ChevronLeft size={13} />
                </button>
                <select value={month} onChange={e => setCurrentMonth(new Date(year, parseInt(e.target.value), 1))} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2 py-1 text-[11.5px] font-bold text-[var(--tx)] cursor-pointer outline-none">
                  {monthNames.map((name, idx) => <option key={name} value={idx}>{name}</option>)}
                </select>
                <select value={year} onChange={e => setCurrentMonth(new Date(parseInt(e.target.value), month, 1))} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2 py-1 text-[11.5px] font-bold text-[var(--tx)] cursor-pointer outline-none">
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg border border-[var(--b)] bg-[var(--surf2)] text-[var(--tx)] hover:bg-[var(--surf3)] transition-colors cursor-pointer" title="Next Month">
                  <ChevronRight size={13} />
                </button>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-medium">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-md bg-[var(--green-bg)] border border-[var(--green-tx)]/20 inline-block"></span><span className="text-[var(--tx2)]">Present</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-md bg-[var(--purple-bg)] border border-[var(--purple-tx)]/20 inline-block"></span><span className="text-[var(--tx2)]">Partial</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-md bg-[var(--red-bg)] border border-[var(--red-tx)]/20 inline-block"></span><span className="text-[var(--tx2)]">Absent</span></div>
              </div>
            </div>
            <div className="text-[12px] font-bold text-[var(--tx)] text-center">{formattedMonthYear}</div>
            {loadingAttendance ? (
              <div className="flex flex-col justify-center items-center py-12 text-[var(--tx3)] gap-2">
                <Loader2 className="animate-spin text-[var(--blue-tx)]" size={20} />
                <span className="text-xs">Loading attendance details...</span>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-[var(--tx3)] uppercase py-1">{d}</div>
                ))}
                {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square bg-transparent rounded-lg"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayRecords = attendanceRecords.filter(r => String(r.studentId) === String(s.id) && r.date === dateStr);
                  const att = getDayAttendanceInfo(dateStr);
                  const tooltipText = att
                    ? `${dayNum} ${monthNames[month]}: ${att.label}\n${dayRecords.map(r => `${r.session === 'first_period' ? 'Morning' : 'Afternoon'}: ${r.status}`).join('\n')}`
                    : `${dayNum} ${monthNames[month]}: No attendance marked`;
                  return (
                    <div key={`day-${dayNum}`} title={tooltipText} className={`aspect-square p-2 rounded-xl flex flex-col justify-between border transition-all ${att ? att.className : 'bg-[var(--surf2)] border-[var(--b)] text-[var(--tx2)] hover:bg-[var(--surf3)]'
                      }`}>
                      <span className="text-[11px] font-bold">{dayNum}</span>
                      {att && <span className="text-[9px] font-bold opacity-90 text-right truncate">{att.status === 'present' ? 'P' : att.status === 'absent' ? 'A' : '1/2'}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)] relative">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-[12px] font-semibold animate-fade-in ${toast.success
          ? 'bg-[var(--teal-bg)] border-[var(--teal-tx)]/20 text-[var(--teal-tx)]'
          : 'bg-[var(--red-bg)] border-[var(--red-tx)]/20 text-[var(--red-tx)]'
          }`}>
          {toast.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span>{toast.message}</span>
          {toast.undoAction && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (toast.undoAction) {
                  await toast.undoAction();
                }
              }}
              className="ml-3 px-2 py-1 bg-[var(--surf3)] hover:bg-[var(--surf2)] text-[var(--tx)] rounded border border-[var(--b)] text-[10px] uppercase tracking-wider font-bold transition-colors cursor-pointer"
            >
              Undo
            </button>
          )}
        </div>
      )}

      {/* If a student is selected → show in-screen detail view */}
      {activeDetailStudent ? (
        <Card>{renderStudentDetail()}</Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <KPICard label="Total Students" value={students.length} sub="This academic year" icon={<GraduationCap size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
            <KPICard label="Active Students" value={activeCount} sub="Currently enrolled" icon={<UserCheck size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
            <KPICard label="Boys / Girls" value={<>{maleCount}<span className="text-[13px] font-normal text-[var(--tx3)]">/{femaleCount}</span></>} sub="Gender distribution" icon={<GraduationCap size={15} />} iconBg="var(--purple-bg)" iconColor="var(--purple-tx)" />
            <KPICard label="New Admissions" value={newAdmissionsCount} sub="This term" icon={<Plus size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" trend={{ direction: 'up', label: `+${newAdmissionsCount}` }} />
          </div>

          <Card>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-[13px] font-semibold text-[var(--tx)] flex items-center gap-2">
                Student Directory {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setImportOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer"
                >
                  <Upload size={12} /> Import
                </button>
                <button
                  onClick={() => { setSelected(null); setModal('add'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg hover:opacity-90 cursor-pointer"
                >
                  <Plus size={12} /> Add Student
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="flex items-center gap-2 flex-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2">
                <Search size={13} className="text-[var(--tx3)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, roll no, parent..."
                  className="flex-1 bg-transparent text-[12px] text-[var(--tx)] placeholder:text-[var(--tx3)] outline-none"
                />
              </div>
              <select value={ayFilter} onChange={(e) => setAyFilter(e.target.value)} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                <option value="All">All Academic Years</option>
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>{ay.name}</option>
                ))}
              </select>
              <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                {['All', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((c) => <option key={c} value={c}>{c === 'All' ? 'All Classes' : `Class ${c}`}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                {['All', 'Active', 'Transferred', 'Left'].map((s) => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between bg-[var(--blue-bg)] border border-[var(--blue-tx)]/20 rounded-xl p-3.5 mb-4">
                <div className="text-[12px] font-semibold text-[var(--blue-tx)]">
                  {selectedIds.length} students selected
                </div>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        handleBulkStatusChange(e.target.value as any);
                        e.target.value = '';
                      }
                    }}
                    className="bg-[var(--surf)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[11.5px] cursor-pointer outline-none text-[var(--tx)]"
                  >
                    <option value="">-- Bulk Edit Status --</option>
                    <option value="Active">Active</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Left">Left</option>
                  </select>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] bg-[var(--red-bg)] text-[var(--red-tx)] border border-[var(--red-tx)]/25 rounded-lg cursor-pointer hover:opacity-90 font-semibold"
                  >
                    <Trash2 size={12} /> Bulk Delete
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-1.5 text-[11.5px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg text-[var(--tx)] cursor-pointer"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[700px]">
                <thead>
                  <tr className="border-b border-[var(--b)]">
                    <th className="px-2 py-2 w-8">
                      <input
                        type="checkbox"
                        checked={paginated.length > 0 && paginated.every(s => selectedIds.includes(s.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const pageIds = paginated.map(s => s.id);
                            setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
                          } else {
                            const pageIds = paginated.map(s => s.id);
                            setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
                          }
                        }}
                        className="rounded border-[var(--b)] text-[var(--blue)] focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th onClick={() => handleSort('name')} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Student {sortField === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleSort('roll')} className="hidden md:table-cell text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Roll No {sortField === 'roll' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleSort('class')} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Class {sortField === 'class' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th className="hidden sm:table-cell text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">Parent / Guardian</th>
                    <th className="hidden lg:table-cell text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">Phone</th>
                    <th onClick={() => handleSort('feeStatus')} className="hidden sm:table-cell text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Fee Status {sortField === 'feeStatus' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleSort('status')} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Status {sortField === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-2 py-4">
                        <TableSkeleton rows={8} cols={9} />
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-2 py-4">
                        <EmptyState
                          title="No students found"
                          description={search.trim() ? "We couldn't find any students matching your search criteria. Try refining your filters." : "Add your first student to populate the directory."}
                          icon={<GraduationCap size={28} />}
                          actionLabel={search.trim() ? undefined : "Add Student"}
                          onAction={search.trim() ? undefined : () => { setSelected(null); setModal('add'); }}
                        />
                      </td>
                    </tr>
                  ) : (
                    paginated.map((s) => (
                      <tr key={s.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] transition-colors last:border-0">
                        <td className="px-2 py-2.5 w-8">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(s.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds(prev => [...prev, s.id]);
                              } else {
                                setSelectedIds(prev => prev.filter(id => id !== s.id));
                              }
                            }}
                            className="rounded border-[var(--b)] text-[var(--blue)] focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar initials={s.name.slice(0, 2).toUpperCase()} bg={INITIALS_COLORS[s.gender === 'Male' ? 'M' : 'F']?.bg || 'var(--blue-bg)'} color={INITIALS_COLORS[s.gender === 'Male' ? 'M' : 'F']?.color || 'var(--blue-tx)'} />
                            <div>
                              <div
                                className="font-semibold text-[var(--blue-tx)] hover:opacity-80 cursor-pointer transition-colors"
                                onClick={() => { setActiveDetailStudent(s); }}
                              >
                                {s.name}
                              </div>
                              <div className="text-[10.5px] text-[var(--tx3)]">{s.gender} · DOB {formatDate(s.dob)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-2 py-2.5 font-mono text-[11px] text-[var(--tx2)]">{s.roll}</td>
                        <td className="px-2 py-2.5 text-[var(--tx2)]">Class {s.class} — {s.section}</td>
                        <td className="hidden sm:table-cell px-2 py-2.5">
                          <div className="font-medium text-[var(--tx)]">{s.parent}</div>
                          <div className="text-[10.5px] text-[var(--tx3)] flex items-center gap-1"><Phone size={9} />{s.phone}</div>
                        </td>
                        <td className="hidden lg:table-cell px-2 py-2.5 text-[var(--tx2)]">{s.phone}</td>
                        <td className="hidden sm:table-cell px-2 py-2.5">
                          {s.feeStatus === 'Paid' && <Badge variant="teal">Paid</Badge>}
                          {s.feeStatus === 'Partial' && <Badge variant="amber">Partial</Badge>}
                          {s.feeStatus === 'Unpaid' && <Badge variant="red">Unpaid</Badge>}
                        </td>
                        <td className="px-2 py-2.5">
                          {s.status === 'Active' && <Badge variant="green">Active</Badge>}
                          {s.status === 'Transferred' && <Badge variant="amber">Transferred</Badge>}
                          {s.status === 'Left' && <Badge variant="red">Left</Badge>}
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setActiveDetailStudent(s); }} className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded text-[var(--tx3)] hover:text-[var(--blue-tx)] hover:bg-[var(--blue-bg)] transition-colors cursor-pointer" title="View Details"><Eye size={13} /></button>
                            <button onClick={() => { setSelected(s); setModal('edit'); }} className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded text-[var(--tx3)] hover:text-[var(--amber-tx)] hover:bg-[var(--amber-bg)] transition-colors cursor-pointer" title="Edit Student"><Edit2 size={13} /></button>
                            <button
                              onClick={() => handleTransferClick(s.id)}
                              disabled={transferringId !== null}
                              className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded text-[var(--tx3)] hover:text-[var(--purple-tx)] hover:bg-[var(--purple-bg)] transition-colors cursor-pointer disabled:opacity-50"
                              title="Transfer Student"
                            >
                              {transferringId === s.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <ArrowRightLeft size={13} />
                              )}
                            </button>
                            <button onClick={() => setDeleteConfirmId(s.id)} className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded text-[var(--tx3)] hover:text-[var(--red-tx)] hover:bg-[var(--red-bg)] transition-colors cursor-pointer" title="Delete Student"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 pt-3 border-t border-[var(--b)] flex items-center justify-between text-[11px] text-[var(--tx3)]">
              <span>
                Showing {filtered.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to {Math.min(filtered.length, currentPage * ITEMS_PER_PAGE)} of {filtered.length} students
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 border border-[var(--b)] rounded-lg hover:bg-[var(--surf2)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-[var(--tx)]"
                >
                  Previous
                </button>
                <span className="px-2.5 py-1 bg-[var(--blue)] text-white rounded-lg font-medium">
                  {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 border border-[var(--b)] rounded-lg hover:bg-[var(--surf2)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-[var(--tx)]"
                >
                  Next
                </button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)] sticky top-0 bg-[var(--surf)] z-10">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">{modal === 'add' ? 'Add New Student' : 'Edit Student'}</div>
                <div className="text-[12px] text-[var(--tx3)]">Fill in all required student details</div>
              </div>
              <button type="button" onClick={() => { setModal(null); setSaveError(''); }} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">First Name *</label>
                  <input
                    name="firstName"
                    required
                    defaultValue={selected?.name.split(' ')[0] ?? ''}
                    onChange={(e) => {
                      setHasUnsavedChanges(true);
                      if (e.target.value.trim() && formErrors.firstName) {
                        setFormErrors(prev => {
                          const copy = { ...prev };
                          delete copy.firstName;
                          return copy;
                        });
                      }
                    }}
                    className={`w-full bg-[var(--surf2)] border ${formErrors.firstName ? 'border-[var(--red-tx)]' : 'border-[var(--b)]'} rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]`}
                    placeholder="Arjun"
                  />
                  {formErrors.firstName && <span className="text-[10px] text-[var(--red-tx)] mt-1 block">{formErrors.firstName}</span>}
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Last Name *</label>
                  <input
                    name="lastName"
                    required
                    defaultValue={selected?.name.split(' ').slice(1).join(' ') ?? ''}
                    onChange={(e) => {
                      setHasUnsavedChanges(true);
                      if (e.target.value.trim() && formErrors.lastName) {
                        setFormErrors(prev => {
                          const copy = { ...prev };
                          delete copy.lastName;
                          return copy;
                        });
                      }
                    }}
                    className={`w-full bg-[var(--surf2)] border ${formErrors.lastName ? 'border-[var(--red-tx)]' : 'border-[var(--b)]'} rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]`}
                    placeholder="Reddy"
                  />
                  {formErrors.lastName && <span className="text-[10px] text-[var(--red-tx)] mt-1 block">{formErrors.lastName}</span>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class *</label>
                  <select
                    name="class"
                    value={modalSelectedClass}
                    onChange={(e) => { setModalSelectedClass(e.target.value); setHasUnsavedChanges(true); }}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                  >
                    {availableClasses.map((c) => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Section *</label>
                  <select
                    name="section"
                    value={modalSelectedSection}
                    onChange={(e) => { setModalSelectedSection(e.target.value); setHasUnsavedChanges(true); }}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                  >
                    {availableSections.map((s) => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Gender *</label>
                  <select
                    name="gender"
                    defaultValue={selected?.gender || 'Male'}
                    onChange={() => setHasUnsavedChanges(true)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                  >
                    <option value="Male">Male</option><option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Date of Birth *</label>
                  <input
                    type="date"
                    name="dob"
                    required
                    defaultValue={selected?.dob}
                    onChange={() => setHasUnsavedChanges(true)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Admission Date</label>
                  <input
                    type="date"
                    name="admissionDate"
                    defaultValue={selected?.admissionDate || new Date().toISOString().slice(0, 10)}
                    onChange={() => setHasUnsavedChanges(true)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  />
                </div>
              </div>
              {/* Status field — only shown in edit mode */}
              {modal === 'edit' && (
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Student Status</label>
                  <select
                    name="studentStatus"
                    defaultValue={selected?.status || 'Active'}
                    onChange={() => setHasUnsavedChanges(true)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                  >
                    <option value="Active">Active</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Left">Left (Dropout)</option>
                  </select>
                </div>
              )}
              {modal === 'add' && <input type="hidden" name="studentStatus" value="Active" />}
              <div className="border-t border-[var(--b)] pt-4">
                <div className="text-[12px] font-semibold text-[var(--tx)] mb-3">Parent / Guardian Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Parent Name *</label>
                    <input
                      name="parent"
                      required
                      defaultValue={selected?.parent}
                      onChange={(e) => {
                        setHasUnsavedChanges(true);
                        if (e.target.value.trim() && formErrors.parent) {
                          setFormErrors(prev => {
                            const copy = { ...prev };
                            delete copy.parent;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full bg-[var(--surf2)] border ${formErrors.parent ? 'border-[var(--red-tx)]' : 'border-[var(--b)]'} rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]`}
                      placeholder="Father/Mother name"
                    />
                    {formErrors.parent && <span className="text-[10px] text-[var(--red-tx)] mt-1 block">{formErrors.parent}</span>}
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Mobile Number *</label>
                    <input
                      name="phone"
                      required
                      value={phoneVal}
                      onChange={(e) => {
                        setHasUnsavedChanges(true);
                        // Clean input: numbers only, max 10 digits
                        const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhoneVal(cleaned);
                        if (cleaned.length === 10 && formErrors.phone) {
                          setFormErrors(prev => {
                            const copy = { ...prev };
                            delete copy.phone;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full bg-[var(--surf2)] border ${formErrors.phone ? 'border-[var(--red-tx)]' : 'border-[var(--b)]'} rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]`}
                      placeholder="e.g. 9876543210"
                    />
                    {formErrors.phone && <span className="text-[10px] text-[var(--red-tx)] mt-1 block">{formErrors.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[var(--b)] pt-4">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Address</label>
                  <textarea
                    name="address"
                    defaultValue={selected?.address}
                    onChange={() => setHasUnsavedChanges(true)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] resize-none"
                    rows={2}
                    placeholder="House no, Street, Area, City"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">
                      Biometric Code
                      <span
                        className="cursor-help w-3.5 h-3.5 rounded-full bg-[var(--surf3)] text-[10px] text-[var(--tx3)] flex items-center justify-center font-bold"
                        title="Format: Alphanumeric characters and hyphens allowed (e.g. BIO-123 or STU-1001). Leave empty if not yet assigned."
                      >
                        ?
                      </span>
                    </label>
                    <input
                      name="biometric_employee_code"
                      value={biometricVal}
                      onChange={(e) => {
                        setHasUnsavedChanges(true);
                        const val = e.target.value.replace(/[^A-Za-z0-9-]/g, '');
                        setBiometricVal(val);
                        if (formErrors.biometric_employee_code) {
                          setFormErrors(prev => {
                            const copy = { ...prev };
                            delete copy.biometric_employee_code;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full bg-[var(--surf2)] border ${formErrors.biometric_employee_code ? 'border-[var(--red-tx)]' : 'border-[var(--b)]'} rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]`}
                      placeholder="e.g. STU-1001"
                    />
                    {formErrors.biometric_employee_code && <span className="text-[10px] text-[var(--red-tx)] mt-1 block">{formErrors.biometric_employee_code}</span>}
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">
                      Aadhar Number
                    </label>
                    <input
                      name="aadhar_number"
                      value={aadharVal}
                      onChange={(e) => {
                        setHasUnsavedChanges(true);
                        const val = e.target.value.replace(/\D/g, '').substring(0, 12);
                        setAadharVal(val);
                        if (formErrors.aadhar_number) {
                          setFormErrors(prev => {
                            const copy = { ...prev };
                            delete copy.aadhar_number;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full bg-[var(--surf2)] border ${formErrors.aadhar_number ? 'border-[var(--red-tx)]' : 'border-[var(--b)]'} rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]`}
                      placeholder="e.g. 123456789012"
                    />
                    {formErrors.aadhar_number && <span className="text-[10px] text-[var(--red-tx)] mt-1 block">{formErrors.aadhar_number}</span>}
                  </div>
                </div>
              </div>
              {/* Inline error feedback */}
              {saveError && (
                <div className="flex items-center gap-2 p-3 bg-[var(--red-bg)] rounded-xl border border-[var(--red-tx)]/10">
                  <AlertCircle size={13} className="text-[var(--red-tx)] flex-shrink-0" />
                  <span className="text-[11.5px] text-[var(--red-tx)]">{saveError}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button type="button" onClick={() => { setModal(null); setSaveError(''); setHasUnsavedChanges(false); }} disabled={saving} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold hover:opacity-90 cursor-pointer disabled:opacity-70 flex items-center justify-center gap-1.5">
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? 'Saving...' : modal === 'add' ? 'Add Student' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Delete Student"
        message="Are you sure you want to delete this student? They will be moved to the Recycle Bin."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
        isDestructive={true}
        loading={deleting}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirmOpen}
        title="Delete Selected Students"
        message={`Are you sure you want to delete the ${selectedIds.length} selected students? They will be moved to the Recycle Bin.`}
        confirmText="Delete All"
        cancelText="Cancel"
        onConfirm={executeBulkDelete}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
        isDestructive={true}
        loading={loading}
      />

      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onImportSuccess={() => {
            setImportOpen(false);
            // Reload fresh data from DB so enrollment numbers and IDs are real
            loadStudents();
          }}
        />
      )}

      {admittedStudentForFee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-base font-bold text-[var(--tx)] mb-2">Student Admitted Successfully!</h3>
            <p className="text-xs text-[var(--tx3)] mb-6">
              <strong>{admittedStudentForFee.name}</strong> has been successfully admitted to the school.
              Would you like to assign fees to this student now?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAdmittedStudentForFee(null)}
                className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer"
              >
                Skip for Now
              </button>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem('admitted_student', JSON.stringify(admittedStudentForFee));
                  setAdmittedStudentForFee(null);
                  window.history.pushState({}, '', '/fee-management');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12px] font-semibold hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5"
              >
                Assign Fees
              </button>
            </div>
          </div>
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

      {/* Collect Payment Modal */}
      {collectStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={(e) => { e.preventDefault(); setShowPaymentConfirm(true); }} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[420px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Collect Student Fee</div>
                <div className="text-[12px] text-[var(--tx3)]">{collectStudent.name} (Class {collectStudent.class} — {collectStudent.section})</div>
              </div>
              <button type="button" onClick={() => setCollectStudent(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              {studentFeesList.length === 0 ? (
                <div className="text-center py-6 text-[12px] text-[var(--tx3)] flex items-center justify-center gap-2">
                  <Loader2 size={13} className="animate-spin" /> Loading assigned fee records...
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
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Payment Method *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)] font-semibold"
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

      {/* Confirm Payment Modal */}
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
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
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

      {/* Payment Success Dialog */}
      {paymentSuccessData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-base font-bold text-[var(--tx)] mb-1">Payment Recorded!</h3>
            <p className="text-xs text-[var(--tx3)] mb-4">The payment has been successfully recorded in the system.</p>

            <div className="bg-[var(--surf2)] rounded-xl p-4 mb-6 text-left space-y-2.5 text-[12px]">
              <div className="flex justify-between"><span className="text-[var(--tx3)]">Student:</span><span className="font-semibold text-[var(--tx)]">{paymentSuccessData.studentName}</span></div>
              <div className="flex justify-between"><span className="text-[var(--tx3)]">Amount Paid:</span><span className="font-bold text-[var(--teal-tx)]">₹{paymentSuccessData.totalPaid.toLocaleString()}</span></div>
              <div className="border-t border-[var(--b)] pt-2 mt-1">
                <span className="text-[10px] text-[var(--tx3)] font-semibold uppercase tracking-wider block mb-1">Allocation</span>
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
                <Printer size={12} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ImportModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

const SYNONYMS: Record<string, string[]> = {
  firstName: ['first name', 'firstname', 'first_name', 'fname', 'first'],
  lastName: ['last name', 'lastname', 'last_name', 'lname', 'last', 'surname'],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fullName: ['name', 'student name', 'student', 'full name', 'fullname', 'student_name'],
  class: ['class', 'grade', 'std', 'standard'],
  section: ['section', 'sec'],
  gender: ['gender', 'sex'],
  dob: ['date of birth', 'dob', 'birth date', 'birthdate', 'dob date'],
  admissionDate: ['admission date', 'doj', 'joining date', 'admission_date', 'adm date'],
  parent: ['parent name', 'parent', 'father name', 'father', 'guardian', 'mother name', 'mother', 'parent_name'],
  phone: ['mobile number', 'mobile', 'phone', 'phone number', 'contact', 'student mobile', 'parent mobile', 'mobile_no', 'phone_no'],
  address: ['address', 'village', 'city', 'location', 'residence', 'street'],
  aadhar_number: ['aadhar number', 'aadhar', 'aadhar card number', 'aadhar card', 'aadhaar', 'aadhaar number', 'aadhar_number', 'aadhaar_number']
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanDate = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'number') {
    const date = new Date((val - 25569) * 86400 * 1000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return d.toISOString().slice(0, 10);
  }
  const parts = str.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[2].length === 4 && parts[0].length <= 2 && parts[1].length <= 2) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    if (parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return str;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanClass = (val: any): string => {
  if (!val) return '8';
  let str = String(val).trim().toUpperCase();
  // Remove "CLASS" prefix if present
  str = str.replace(/^CLASS\s*/i, '');
  return str || '8';
};


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanSection = (val: any): string => {
  if (!val) return 'A';
  const match = String(val).match(/[A-Za-z]/);
  return match ? match[0].toUpperCase() : 'A';
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanGender = (val: any): 'Male' | 'Female' => {
  if (!val) return 'Male';
  const str = String(val).trim().toLowerCase();
  if (str.startsWith('f') || str.includes('girl') || str.includes('female')) {
    return 'Female';
  }
  return 'Male';
};

interface MappedStudent {
  id: string;
  firstName: string;
  lastName: string;
  class: string;
  section: string;
  gender: 'Male' | 'Female';
  dob: string;
  admissionDate: string;
  parent: string;
  phone: string;
  address: string;
  aadhar_number?: string;
}

const validateStudent = (s: MappedStudent) => {
  const errors: string[] = [];
  if (!s.firstName.trim() || s.firstName === 'N/A') errors.push('First name is required');
  if (!s.lastName.trim() || s.lastName === 'N/A') errors.push('Last name is required');
  if (!s.class) errors.push('Class is required');
  if (!s.section) errors.push('Section is required');
  if (s.gender !== 'Male' && s.gender !== 'Female') errors.push('Gender must be Male or Female');
  if (!s.dob || !/^\d{4}-\d{2}-\d{2}$/.test(s.dob)) errors.push('Valid DOB required (YYYY-MM-DD)');
  if (!s.admissionDate || !/^\d{4}-\d{2}-\d{2}$/.test(s.admissionDate)) errors.push('Valid Admission Date required (YYYY-MM-DD)');
  if (!s.parent.trim() || s.parent === 'N/A') errors.push('Parent name is required');
  if (!s.phone.trim() || s.phone === 'N/A') errors.push('Mobile number is required');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!s.address.trim()) errors.push('Address is required');
  if (s.aadhar_number && s.aadhar_number.replace(/\D/g, '').length !== 12) {
    errors.push('Aadhar must be exactly 12 digits');
  }
  return errors;
};

export function ImportModal({ onClose, onImportSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mappedStudents, setMappedStudents] = useState<MappedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseExcel = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reader.readAsBinaryString(file);
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseWord = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.convertToHtml({ arrayBuffer });
          const html = result.value;

          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const tables = doc.querySelectorAll('table');

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rowsData: any[][] = [];
          if (tables.length > 0) {
            tables.forEach((table) => {
              const trs = table.querySelectorAll('tr');
              trs.forEach((tr) => {
                const tds = tr.querySelectorAll('td, th');
                const row: string[] = [];
                tds.forEach((td) => {
                  row.push(td.textContent?.trim() || '');
                });
                rowsData.push(row);
              });
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            resolve(rowsData);
          } else {
            const paragraphs = doc.querySelectorAll('p');
            const lines: string[] = [];
            paragraphs.forEach((p) => {
              const txt = p.textContent?.trim();
              if (txt) lines.push(txt);
            });
            resolve(lines.map((l) => [l]));
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reader.readAsArrayBuffer(file);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsePDF = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rowsData: any[][] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const items = textContent.items as any[];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const lineGroups: Record<number, any[]> = {};

            items.forEach((item) => {
              const y = Math.round(item.transform[5]);
              if (!lineGroups[y]) {
                lineGroups[y] = [];
              }
              lineGroups[y].push(item);
            });

            const sortedYs = Object.keys(lineGroups)
              .map(Number)
              .sort((a, b) => b - a);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any

            sortedYs.forEach((y) => {
              const rowItems = lineGroups[y].sort((a, b) => a.transform[4] - b.transform[4]);
              const rowText = rowItems.map((item) => item.str.trim()).filter(Boolean);
              if (rowText.length > 0) {
                rowsData.push(rowText);
              }
            });
          }
          resolve(rowsData);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (selectedFile: File) => {
    setLoading(true);
    setError('');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rawRows: any[][] = [];
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        rawRows = await parseExcel(selectedFile);
      } else if (ext === 'docx' || ext === 'doc') {
        rawRows = await parseWord(selectedFile);
      } else if (ext === 'pdf') {
        rawRows = await parsePDF(selectedFile);
      } else {
        throw new Error('Unsupported file format. Please upload PDF, Word, or Excel.');
      }

      if (rawRows.length === 0) {
        throw new Error('No data found in the file.');
      }

      let headerIndex = 0;
      for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
        const row = rawRows[r];
        if (row.some(cell => {
          const val = String(cell).toLowerCase().trim();
          return Object.values(SYNONYMS).some(syns => syns.includes(val));
        })) {
          headerIndex = r;
          break;
        }
      }

      const headers = rawRows[headerIndex].map(h => String(h).toLowerCase().trim());

      const colMap: Record<string, number> = {};
      Object.keys(SYNONYMS).forEach(field => {
        const syns = SYNONYMS[field];
        const idx = headers.findIndex(h => syns.includes(h) || syns.some(syn => h.includes(syn)));
        if (idx !== -1) {
          colMap[field] = idx;
        }
      });

      const dataRows = rawRows.slice(headerIndex + 1);
      const studentsList: MappedStudent[] = dataRows
        .map((row): MappedStudent | null => {
          if (row.filter(c => c !== undefined && c !== null && String(c).trim() !== '').length === 0) {
            return null;
          }

          let firstName = '';
          let lastName = '';

          if (colMap.fullName !== undefined && row[colMap.fullName] !== undefined) {
            const fullName = String(row[colMap.fullName]).trim();
            const parts = fullName.split(/\s+/);
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ') || 'N/A';
          }

          if (colMap.firstName !== undefined && row[colMap.firstName] !== undefined) {
            firstName = String(row[colMap.firstName]).trim();
          }
          if (colMap.lastName !== undefined && row[colMap.lastName] !== undefined) {
            lastName = String(row[colMap.lastName]).trim();
          }

          const rawClass = colMap.class !== undefined ? row[colMap.class] : '';
          const rawSection = colMap.section !== undefined ? row[colMap.section] : '';
          const rawGender = colMap.gender !== undefined ? row[colMap.gender] : '';
          const rawDob = colMap.dob !== undefined ? row[colMap.dob] : '';
          const rawAdmission = colMap.admissionDate !== undefined ? row[colMap.admissionDate] : '';
          const rawParent = colMap.parent !== undefined ? row[colMap.parent] : '';
          const rawPhone = colMap.phone !== undefined ? row[colMap.phone] : '';
          const rawAddress = colMap.address !== undefined ? row[colMap.address] : '';
          const rawAadhar = colMap.aadhar_number !== undefined ? row[colMap.aadhar_number] : '';

          return {
            id: Math.random().toString(36).substr(2, 9),
            firstName: firstName || 'N/A',
            lastName: lastName || 'N/A',
            class: cleanClass(rawClass),
            section: cleanSection(rawSection),
            gender: cleanGender(rawGender),
            dob: cleanDate(rawDob),
            admissionDate: cleanDate(rawAdmission) || new Date().toISOString().slice(0, 10),
            parent: rawParent ? String(rawParent).trim() : 'N/A',
            phone: rawPhone ? String(rawPhone).trim() : 'N/A',
            address: rawAddress ? String(rawAddress).trim() : '',
            aadhar_number: rawAadhar ? String(rawAadhar).trim() : '',
          };
        })
        .filter((s): s is MappedStudent => s !== null);

      setMappedStudents(studentsList);
      setFile(selectedFile);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Failed to parse file. Please verify format.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateStudentField = (id: string, field: keyof MappedStudent, value: any) => {
    setMappedStudents(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const removeStudent = (id: string) => {
    setMappedStudents(prev => prev.filter(s => s.id !== id));
  };

  const addStudentRow = () => {
    const newStudent: MappedStudent = {
      id: Math.random().toString(36).substr(2, 9),
      firstName: '',
      lastName: '',
      class: '8',
      section: 'A',
      gender: 'Male',
      dob: '',
      admissionDate: new Date().toISOString().slice(0, 10),
      parent: '',
      phone: '',
      address: '',
      aadhar_number: '',
    };
    setMappedStudents(prev => [...prev, newStudent]);
  };

  const handleImportSave = async () => {
    setImporting(true);
    setError('');

    const invalidStudents = mappedStudents.filter(s => validateStudent(s).length > 0);
    if (invalidStudents.length > 0) {
      setError(`Please fix all validation errors before importing. (${invalidStudents.length} rows contain errors)`);
      setImporting(false);
      return;
    }

    const backendRecords = mappedStudents.map(s => ({
      name: `${s.firstName} ${s.lastName}`,
      gender: s.gender,
      dob: s.dob,
      admission_date: s.admissionDate,
      father_name: s.parent,
      student_mobile: s.phone,
      village: s.address,
      class: s.class,
      section: s.section,
      status: 'active',
      aadhar_number: s.aadhar_number || null,
    }));

    try {
      await api.bulkCreateResource('students', backendRecords);
      // DB save succeeded — show success screen
      setSuccessCount(mappedStudents.length);
    } catch (err) {
      console.error('Import failed:', err);
      setError((err as Error).message || 'Import failed. Please check the database connection and try again.');
    } finally {
      setImporting(false);
    }
  };

  // ── Sample template download ─────────────────────────────────────────────
  const SAMPLE_HEADERS = [
    'First Name', 'Last Name', 'Class', 'Section', 'Gender',
    'Date of Birth', 'Admission Date', 'Parent Name', 'Mobile Number', 'Address', 'Aadhar Number',
  ];
  const SAMPLE_ROWS = [
    ['Ravi', 'Teja', '9', 'B', 'Male', '2012-05-15', '2026-06-01', 'Nageswara Rao', '9876543210', 'Nizamabad Main Street', '123456789012'],
    ['Anjali', 'Devi', '10', 'A', 'Female', '2011-09-22', '2026-06-01', 'Srinivas', '9848022338', 'Housing Board Colony', '234567890123'],
    ['Arun', 'Kumar', '8', 'C', 'Male', '2013-03-10', '2026-06-01', 'Ramesh', '9700123456', 'Old Town, Nizamabad', '345678901234'],
  ];

  const downloadTemplate = (format: 'xlsx' | 'csv') => {
    if (format === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet([SAMPLE_HEADERS, ...SAMPLE_ROWS]);

      // Style the header row a bit wider
      ws['!cols'] = SAMPLE_HEADERS.map(() => ({ wch: 20 }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      XLSX.writeFile(wb, 'KTS_Student_Import_Template.xlsx');
    } else {
      // CSV
      const csvLines = [
        SAMPLE_HEADERS.join(','),
        ...SAMPLE_ROWS.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\r\n');
      const blob = new Blob([csvLines], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'KTS_Student_Import_Template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  if (successCount !== null) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[460px] p-6 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--teal-bg)] text-[var(--teal)] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-[var(--tx)] mb-2">Import Successful</h3>
          <p className="text-[12.5px] text-[var(--tx2)] mb-6">
            Successfully saved {successCount} student records to the database.
          </p>
          <button
            onClick={onImportSuccess}
            className="w-full py-2.5 bg-[var(--blue)] text-white rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            View in Student Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[1020px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--b)] bg-[var(--surf)] sticky top-0 z-10">
          <div>
            <div className="text-[14px] font-bold text-[var(--tx)] flex items-center gap-2">
              <Upload size={16} /> Import Student Directory Data
            </div>
            <div className="text-[11.5px] text-[var(--tx3)]">
              Support PDF, Word (.docx), Excel (.xlsx, .xls) and CSV files
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {!file && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-colors ${dragActive
                ? 'border-[var(--blue)] bg-[var(--blue-bg)]/20'
                : 'border-[var(--b2)] bg-[var(--surf2)]/40 hover:bg-[var(--surf2)]/70'
                }`}
            >
              {loading ? (
                <div className="py-4">
                  <Loader2 size={36} className="animate-spin text-[var(--blue)] mx-auto mb-3" />
                  <div className="text-[13px] font-semibold text-[var(--tx)]">Analyzing and Parsing File...</div>
                  <div className="text-[11px] text-[var(--tx3)] mt-1">Extracting text columns and headers</div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-[var(--blue-bg)] text-[var(--blue-tx)] flex items-center justify-center mb-3.5">
                    <Upload size={22} />
                  </div>
                  <div className="text-[13px] font-bold text-[var(--tx)] mb-1">Drag and drop file here</div>
                  <div className="text-[11.5px] text-[var(--tx3)] mb-4">
                    Limit 10MB per file · PDF, DOCX, XLSX, XLS, CSV
                  </div>
                  <label className="px-4 py-2 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold hover:opacity-90 cursor-pointer shadow-sm">
                    Browse Files
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.doc,.xlsx,.xls,.csv"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChange(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </>
              )}
            </div>
          )}

          {/* Required column order reference — always visible when no file loaded */}
          {!file && !loading && (
            <div className="border border-[var(--b)] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[var(--surf2)] border-b border-[var(--b)]">
                <FileSpreadsheet size={13} className="text-[var(--blue-tx)]" />
                <span className="text-[11.5px] font-semibold text-[var(--tx)]">
                  Required column order in your file
                </span>
                <span className="ml-auto text-[10.5px] text-[var(--tx3)]">
                  Columns must appear in this order (header names are flexible)
                </span>
              </div>
              <div className="p-3.5">
                {/* Column chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    { n: '1', label: 'First Name', req: true },
                    { n: '2', label: 'Last Name', req: true },
                    { n: '3', label: 'Class', req: true },
                    { n: '4', label: 'Section', req: true },
                    { n: '5', label: 'Gender', req: true },
                    { n: '6', label: 'Date of Birth', req: true },
                    { n: '7', label: 'Admission Date', req: true },
                    { n: '8', label: 'Parent Name', req: true },
                    { n: '9', label: 'Mobile Number', req: true },
                    { n: '10', label: 'Address', req: true },
                    { n: '11', label: 'Aadhar Number', req: false },
                  ].map(col => (
                    <div
                      key={col.n}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${col.req
                        ? 'bg-[var(--blue-bg)] border-[var(--blue-tx)]/20 text-[var(--blue-tx)]'
                        : 'bg-[var(--surf2)] border-[var(--b)] text-[var(--tx3)]'
                        }`}
                    >
                      <span className="opacity-60 text-[10px]">{col.n}.</span>
                      {col.label}
                      {!col.req && <span className="text-[9.5px] opacity-50">(opt)</span>}
                    </div>
                  ))}
                </div>

                {/* Mini example row */}
                <div className="bg-[var(--surf2)] rounded-lg p-2.5 overflow-x-auto">
                  <div className="text-[10px] text-[var(--tx3)] mb-1.5 font-medium uppercase tracking-wider">Example row</div>
                  <div className="flex gap-2 text-[10.5px] text-[var(--tx2)] whitespace-nowrap">
                    {['Ravi', 'Teja', '9', 'B', 'Male', '2012-05-15', '2026-06-01', 'Nageswara Rao', '9876543210', 'Nizamabad', '123456789012'].map((v, i) => (
                      <span key={i} className="px-2 py-0.5 bg-[var(--surf)] border border-[var(--b)] rounded font-mono text-[10px]">{v}</span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2.5 text-[10.5px]">
                  <span className="flex items-center gap-1 text-[var(--blue-tx)]">
                    <span className="w-2 h-2 rounded-full bg-[var(--blue)]" /> 10 columns are required (Aadhar is optional)
                  </span>
                  <span className="ml-auto text-[var(--tx3)]">
                    Dates accepted as: YYYY-MM-DD · DD/MM/YYYY · DD-MM-YYYY
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-[var(--red-bg)] rounded-xl border border-[var(--red-tx)]/10 text-[var(--red-tx)] text-[12px]">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {file && mappedStudents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[12.5px] font-bold text-[var(--tx)]">
                  Parsed Records Preview ({mappedStudents.length} rows)
                </div>
                <button
                  onClick={addStudentRow}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--surf2)] hover:bg-[var(--surf3)] text-[var(--tx)] border border-[var(--b)] rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer"
                >
                  <Plus size={12} /> Add Student Row
                </button>
              </div>

              {/* Responsive table for inline editing */}
              <div className="overflow-x-auto border border-[var(--b)] rounded-xl max-h-[400px]">
                <table className="w-full border-collapse text-[11.5px] min-w-[1100px]">
                  <thead>
                    <tr className="bg-[var(--surf2)] border-b border-[var(--b)] sticky top-0 z-10 text-[var(--tx3)]">
                      <th className="px-3 py-2 text-left font-medium w-[50px]">Status</th>
                      <th className="px-2 py-2 text-left font-medium w-[120px]">First Name *</th>
                      <th className="px-2 py-2 text-left font-medium w-[120px]">Last Name *</th>
                      <th className="px-2 py-2 text-left font-medium w-[90px]">Class *</th>
                      <th className="px-2 py-2 text-left font-medium w-[90px]">Section *</th>
                      <th className="px-2 py-2 text-left font-medium w-[100px]">Gender *</th>
                      <th className="px-2 py-2 text-left font-medium w-[130px]">DOB *</th>
                      <th className="px-2 py-2 text-left font-medium w-[130px]">Admission Date</th>
                      <th className="px-2 py-2 text-left font-medium w-[140px]">Parent Name *</th>
                      <th className="px-2 py-2 text-left font-medium w-[120px]">Mobile *</th>
                      <th className="px-2 py-2 text-left font-medium w-[120px]">Aadhar</th>
                      <th className="px-2 py-2 text-left font-medium">Address</th>
                      <th className="px-2 py-2 text-center font-medium w-[50px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--surf)] divide-y divide-[var(--b)]">
                    {mappedStudents.map((s) => {
                      const rowErrors = validateStudent(s);
                      const isValid = rowErrors.length === 0;
                      return (
                        <tr key={s.id} className="hover:bg-[var(--surf2)]/40 transition-colors">
                          <td className="px-3 py-2 text-center">
                            {isValid ? (
                              <div className="inline-flex text-[var(--green)]" title="Valid Row">
                                <CheckCircle2 size={15} />
                              </div>
                            ) : (
                              <div className="inline-flex text-[var(--red)] cursor-help" title={rowErrors.join('\n')}>
                                <AlertCircle size={15} />
                              </div>
                            )}
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              value={s.firstName}
                              onChange={(e) => updateStudentField(s.id, 'firstName', e.target.value)}
                              className={`w-full bg-[var(--surf2)] border ${s.firstName === 'N/A' || !s.firstName ? 'border-[var(--red)]/40 focus:border-[var(--red)]' : 'border-[var(--b)] focus:border-[var(--blue)]'} rounded px-2 py-1 text-[11.5px] outline-none`}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              value={s.lastName}
                              onChange={(e) => updateStudentField(s.id, 'lastName', e.target.value)}
                              className={`w-full bg-[var(--surf2)] border ${s.lastName === 'N/A' || !s.lastName ? 'border-[var(--red)]/40 focus:border-[var(--red)]' : 'border-[var(--b)] focus:border-[var(--blue)]'} rounded px-2 py-1 text-[11.5px] outline-none`}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <select
                              value={s.class}
                              onChange={(e) => updateStudentField(s.id, 'class', e.target.value)}
                              className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded px-1.5 py-1 text-[11.5px] outline-none cursor-pointer"
                            >
                              {['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(c => (
                                <option key={c} value={c}>Class {c}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-1 py-1.5">
                            <select
                              value={s.section}
                              onChange={(e) => updateStudentField(s.id, 'section', e.target.value)}
                              className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded px-1.5 py-1 text-[11.5px] outline-none cursor-pointer"
                            >
                              {['A', 'B', 'C'].map(sec => (
                                <option key={sec} value={sec}>Sec {sec}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-1 py-1.5">
                            <select
                              value={s.gender}
                              onChange={(e) => updateStudentField(s.id, 'gender', e.target.value)}
                              className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded px-1.5 py-1 text-[11.5px] outline-none cursor-pointer"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              type="date"
                              value={s.dob}
                              onChange={(e) => updateStudentField(s.id, 'dob', e.target.value)}
                              className={`w-full bg-[var(--surf2)] border ${!s.dob ? 'border-[var(--red)]/40 focus:border-[var(--red)]' : 'border-[var(--b)] focus:border-[var(--blue)]'} rounded px-1 py-1 text-[11px] outline-none`}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              type="date"
                              value={s.admissionDate}
                              onChange={(e) => updateStudentField(s.id, 'admissionDate', e.target.value)}
                              className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded px-1 py-1 text-[11px] outline-none"
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              value={s.parent}
                              onChange={(e) => updateStudentField(s.id, 'parent', e.target.value)}
                              className={`w-full bg-[var(--surf2)] border ${s.parent === 'N/A' || !s.parent ? 'border-[var(--red)]/40 focus:border-[var(--red)]' : 'border-[var(--b)] focus:border-[var(--blue)]'} rounded px-2 py-1 text-[11.5px] outline-none`}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              value={s.phone}
                              onChange={(e) => updateStudentField(s.id, 'phone', e.target.value)}
                              className={`w-full bg-[var(--surf2)] border ${s.phone === 'N/A' || !s.phone ? 'border-[var(--red)]/40 focus:border-[var(--red)]' : 'border-[var(--b)] focus:border-[var(--blue)]'} rounded px-2 py-1 text-[11.5px] outline-none`}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              value={s.aadhar_number || ''}
                              onChange={(e) => updateStudentField(s.id, 'aadhar_number', e.target.value)}
                              className={`w-full bg-[var(--surf2)] border ${s.aadhar_number && s.aadhar_number.replace(/\D/g, '').length !== 12 ? 'border-[var(--red)]/40 focus:border-[var(--red)]' : 'border-[var(--b)] focus:border-[var(--blue)]'} rounded px-2 py-1 text-[11.5px] outline-none`}
                              placeholder="12-digit"
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              value={s.address}
                              onChange={(e) => updateStudentField(s.id, 'address', e.target.value)}
                              className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded px-2 py-1 text-[11.5px] outline-none"
                            />
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeStudent(s.id)}
                              className="p-1 rounded text-[var(--tx3)] hover:text-[var(--red)] hover:bg-[var(--red-bg)] transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--tx3)] mt-1.5">
                <span>
                  * Red highlighted cells represent missing or incorrect data fields.
                </span>
                <span className="font-medium text-[var(--tx2)]">
                  Total parsed rows: {mappedStudents.length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--b)] bg-[var(--surf2)]/50 flex items-center sticky bottom-0 z-10">
          {/* Left side — sample format downloads */}
          <div className="flex items-center gap-1 mr-auto">
            <Download size={12} className="text-[var(--tx3)]" />
            <span className="text-[11px] text-[var(--tx3)] mr-1">Download template:</span>
            <button
              type="button"
              onClick={() => downloadTemplate('xlsx')}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[var(--blue-tx)] bg-[var(--blue-bg)] hover:opacity-80 rounded-lg transition-opacity cursor-pointer"
            >
              <FileSpreadsheet size={11} /> Excel
            </button>
            <button
              type="button"
              onClick={() => downloadTemplate('csv')}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[var(--teal-tx)] bg-[var(--teal-bg)] hover:opacity-80 rounded-lg transition-opacity cursor-pointer"
            >
              <FileText size={11} /> CSV
            </button>
          </div>

          {/* Right side — action buttons */}
          <div className="flex items-center gap-3">
            {file && (
              <button
                onClick={() => {
                  setFile(null);
                  setMappedStudents([]);
                  setError('');
                }}
                disabled={importing}
                className="px-4 py-2 border border-[var(--b)] bg-[var(--surf)] hover:bg-[var(--surf2)] text-[12.5px] text-[var(--tx)] rounded-xl font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                Upload Different File
              </button>
            )}
            <button
              onClick={onClose}
              disabled={importing}
              className="px-4 py-2 border border-[var(--b)] bg-[var(--surf)] hover:bg-[var(--surf2)] text-[12.5px] text-[var(--tx)] rounded-xl font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            {file && mappedStudents.length > 0 && (
              <button
                onClick={handleImportSave}
                disabled={importing}
                className="px-4 py-2 bg-[var(--blue)] hover:opacity-90 text-white rounded-xl text-[12.5px] font-semibold transition-opacity disabled:opacity-70 flex items-center gap-1.5 cursor-pointer"
              >
                {importing && <Loader2 size={13} className="animate-spin" />}
                {importing ? 'Importing Students...' : 'Save & Import Directory'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
