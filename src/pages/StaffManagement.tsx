import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Upload, X, FileText, CheckCircle2, Download, Printer, Trash2 } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { StaffFilters } from '../components/Staff/StaffFilters';
import { StaffTable } from '../components/Staff/StaffTable';
import { StaffImportModal } from '../components/Staff/StaffImportModal';
import { StaffViewModal } from '../components/Staff/StaffViewModal';
import { StaffFormModal } from '../components/Staff/StaffFormModal';
import { StaffPayslipModal } from '../components/Staff/StaffPayslipModal';

import { useApp } from '../context/AppContext';
import { useDialog } from '../context/DialogContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import * as XLSX from 'xlsx';

export interface StaffMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  category: string;
  subject?: string;
  phone: string;
  email: string;
  join_date: string;
  attendance_percentage: number;
  status: 'Active' | 'On Leave' | 'Resigned';
  salary: number;
  qualifications: string;
  documents?: string[];
  biometric_employee_code?: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const STAFF: StaffMember[] = [];

  // eslint-disable-next-line unused-imports/no-unused-vars
const DEPT_COLORS: Record<string, { bg: string; color: string }> = {
  Mathematics: { bg: 'var(--blue-bg)', color: 'var(--blue-tx)' },
  Science: { bg: 'var(--teal-bg)', color: 'var(--teal-tx)' },
  English: { bg: 'var(--purple-bg)', color: 'var(--purple-tx)' },
  Languages: { bg: 'var(--amber-bg)', color: 'var(--amber-tx)' },
  'Social Sciences': { bg: 'var(--coral-bg)', color: 'var(--coral-tx)' },
  Sports: { bg: 'var(--green-bg)', color: 'var(--green-tx)' },
  default: { bg: 'var(--surf3)', color: 'var(--tx2)' },
};

type ModalState = { type: 'add' | 'view' | 'edit'; staff?: StaffMember } | null;

export function StaffManagement() {
  const { alert, confirm } = useDialog();
  const { leaveRequests } = useApp();
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem('kts_staff_members');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          return arr.filter((s: any) => s && s.email !== 'teacher@krishnaveni.edu' && s.email !== 'prasad@krishnaveni.edu' && s.email !== 'anitha@krishnaveni.edu' && s.email !== 'suresh@krishnaveni.edu' && s.email !== 'javvajimadhuteja2000@gmail.com' && s.email !== 'pavan@gmail.com');
        }
      }
    } catch { /* empty */ }
    return [];
  });

  useEffect(() => {
    // Clean up mock staff members from localStorage if present
    try {
      const savedStaffStr = localStorage.getItem('kts_staff_members');
      if (savedStaffStr) {
        const parsed = JSON.parse(savedStaffStr);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (s: any) => s && s.email !== 'teacher@krishnaveni.edu' && s.email !== 'prasad@krishnaveni.edu' && s.email !== 'anitha@krishnaveni.edu' && s.email !== 'suresh@krishnaveni.edu' && s.email !== 'javvajimadhuteja2000@gmail.com' && s.email !== 'pavan@gmail.com'
          );
          if (filtered.length !== parsed.length) {
            localStorage.setItem('kts_staff_members', JSON.stringify(filtered));
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    async function syncFromDb() {
      try {
        const staffData = await api.getResources('faculty');
        if (staffData && staffData.length > 0) {
          // Normalize documents array and status capitalization
          const normalizedStaff = staffData.map((s: any) => ({
            ...s,
            documents: typeof s.documents === 'string' ? JSON.parse(s.documents) : (s.documents || []),
            status: s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : 'Active',
            salary: typeof s.salary === 'string' ? parseFloat(s.salary) : s.salary
          }));
          setStaffList(normalizedStaff);
        } else {
          setStaffList([]);
        }
      } catch (err) {
        console.error('Error fetching staff list from DB in StaffManagement:', err);
      }
    }
    syncFromDb();
  }, []);

  useEffect(() => {
    localStorage.setItem('kts_staff_members', JSON.stringify(staffList));
  }, [staffList]);




  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');
  const [modal, setModal] = useState<ModalState>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'name' | 'department' | 'join_date' | 'attendance_percentage' | 'status' | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkStatusConfirmOpen, setBulkStatusConfirmOpen] = useState<'Active' | 'On Leave' | 'Resigned' | null>(null);
  const [loading] = useState(false);
  // eslint-disable-next-line unused-imports/no-unused-vars
  const [error] = useState<string | null>(null);

  const handleSort = (field: 'name' | 'department' | 'join_date' | 'attendance_percentage' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleBulkStatusChange = (newStatus: 'Active' | 'On Leave' | 'Resigned') => {
    if (selectedIds.length === 0) return;
    if (newStatus === 'Resigned') {
      setBulkDeleteConfirmOpen(true);
    } else {
      setBulkStatusConfirmOpen(newStatus);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteConfirmOpen(true);
  };

  const executeBulkDelete = async () => {
    try {
      // In a real app, you'd have a bulk delete endpoint or map promises.
      // For now, we update local state assuming it works, or map API calls:
      await Promise.all(selectedIds.map(id => api.deleteResource('faculty', id)));
      setStaffList(prev => prev.map(s => selectedIds.includes(s.id) ? { ...s, status: 'Resigned' } : s));
      setSelectedIds([]);
      setBulkDeleteConfirmOpen(false);
    } catch (err) {
      console.error('Bulk delete failed', err);
    }
  };

  const executeBulkStatusChange = async () => {
    if (!bulkStatusConfirmOpen) return;
    try {
      await Promise.all(selectedIds.map(id => api.updateResource('faculty', id, { status: bulkStatusConfirmOpen })));
      setStaffList(prev => prev.map(s => selectedIds.includes(s.id) ? { ...s, status: bulkStatusConfirmOpen } : s));
      setSelectedIds([]);
      setBulkStatusConfirmOpen(null);
    } catch (err) {
      console.error('Bulk status update failed', err);
    }
  };

  const exportToExcel = () => {
    const dataToExport = filtered.map(s => ({
      'Staff Name': s.name,
      'Designation': s.designation,
      'Department': s.department,
      'Category': s.category,
      'Subject': s.subject || 'N/A',
      'Phone': s.phone,
      'Email': s.email,
      'Join Date': (() => {
        if (!s.join_date) return '';
        const dateOnly = s.join_date.split('T')[0];
        const parts = dateOnly.split('-');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return s.join_date;
      })(),
      'Salary': s.salary,
      'Qualifications': s.qualifications,
      'Status': s.status
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Staff Directory');
    XLSX.writeFile(wb, 'KTS_Staff_Directory.xlsx');
  };

  const [selectedCategory, setSelectedCategory] = useState('Teaching');
  const [customCategory, setCustomCategory] = useState('');
  const [customDocs, setCustomDocs] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  // States for detailed view tabs and payslips
  const [activeTab, setActiveTab] = useState<'info' | 'leaves' | 'attendance' | 'salary' | 'slips'>('info');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [payslips, setPayslips] = useState<any[]>([]);
  const [staffSalaries, setStaffSalaries] = useState<Record<string, Record<string, number>>>({});
  const [manualAttendance, setManualAttendance] = useState<Record<string, Record<string, string>>>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const saved = localStorage.getItem('kts_staff_attendance');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (saved && JSON.parse(saved)) || {};
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [biometricPunches, setBiometricPunches] = useState<any[]>(() => {
    const saved = localStorage.getItem('kts_biometric_punches');
    return (saved && JSON.parse(saved)) || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  });

  // Dynamic base64 uploaded documents mapping
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, Record<string, { name: string; type: string; data: string }>>>(() => {
    const saved = localStorage.getItem('kts_staff_uploaded_docs');
    return (saved && JSON.parse(saved)) || {};
  });

  // Helper to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // States for attendance filters and pagination in full page view
  const [attStartDate, setAttStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Default to last 30 days
    return d.toISOString().slice(0, 10);
  });
  const [attEndDate, setAttEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [attPage, setAttPage] = useState<number>(1);
  const [selectedDocPreview, setSelectedDocPreview] = useState<string | null>(null);

  // States for adding a document directly in Info tab
  const [addDocModalOpen, setAddDocModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);

  useEffect(() => {
    if (modal && modal.type === 'view') {
      setActiveTab('info');
      setAttPage(1);
      setSelectedDocPreview(null);
      setAddDocModalOpen(false);
      setNewDocName('');
      setNewDocFile(null);
      
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setAttStartDate(d.toISOString().slice(0, 10));
      setAttEndDate(new Date().toISOString().slice(0, 10));
      
      // Load payslips
      async function loadPayslips() {
        try {
          const data = await api.getResources('payslips');
          setPayslips(data || []);
        } catch (e) {
          console.error(e);
        }
      }
      loadPayslips();

      // Load salary config
      const savedSalaries = localStorage.getItem('staff_salaries');
      if (savedSalaries) setStaffSalaries(JSON.parse(savedSalaries));

      // Load attendance records
      const savedAtt = localStorage.getItem('kts_staff_attendance');
      if (savedAtt) setManualAttendance(JSON.parse(savedAtt));

      const savedPunches = localStorage.getItem('kts_biometric_punches');
      if (savedPunches) setBiometricPunches(JSON.parse(savedPunches));
    }
  }, [modal]);

  useEffect(() => {
    if (modal?.type === 'view' && modal.staff) {
      const currentStaff = modal.staff;
      const fetchLogs = async () => {
        const empCode = currentStaff.biometric_employee_code;
        const staffId = currentStaff.id;
        
        let logs: any[] = [];
        try {
          if (empCode) {
            logs = await api.getResources('biometric-logs', { employee_code: String(empCode), limit: '1000' });
          }
          if ((!logs || logs.length === 0) && staffId) {
            logs = await api.getResources('biometric-logs', { employee_code: String(staffId), limit: '1000' });
          }

          if (Array.isArray(logs)) {
            const mappedPunches: any[] = [];
            logs.forEach((l: any) => {
              let date = '';
              if (l.scan_datetime) {
                date = l.scan_datetime.includes('T') ? l.scan_datetime.split('T')[0] : l.scan_datetime.split(' ')[0];
              }
              if (!date) return;

              let scanTime: string | undefined;
              if (l.scan_datetime) {
                const timeStr = l.scan_datetime.includes('T') ? l.scan_datetime.split('T')[1] : l.scan_datetime.split(' ')[1];
                scanTime = timeStr ? timeStr.slice(0, 5) : l.scan_datetime.slice(11, 16);
              }
              const scanType = String(l.scan_type || '').toLowerCase();

              const inTime = l.raw_data?.in_time || (scanType === 'in' ? scanTime : undefined);
              const outTime = l.raw_data?.out_time || (scanType === 'out' ? scanTime : undefined);

              if (inTime && inTime !== '--:--') {
                mappedPunches.push({
                  id: `bio-in-${l.id}-${date}`,
                  staffId: currentStaff.id,
                  timestamp: `${date} ${inTime}:00`
                });
              }

              if (outTime && outTime !== '--:--') {
                mappedPunches.push({
                  id: `bio-out-${l.id}-${date}`,
                  staffId: currentStaff.id,
                  timestamp: `${date} ${outTime}:00`
                });
              }

              if (!inTime && !outTime && l.scan_datetime) {
                const cleanTimestamp = l.scan_datetime.includes('T')
                  ? l.scan_datetime.replace('T', ' ').split('.')[0].slice(0, 19)
                  : l.scan_datetime;
                mappedPunches.push({
                  id: `bio-${l.id}-${date}`,
                  staffId: currentStaff.id,
                  timestamp: cleanTimestamp
                });
              }
            });

            // Filter by date range (attStartDate to attEndDate)
            const filteredPunches = mappedPunches.filter((p) => {
              const pDate = p.timestamp.slice(0, 10);
              return pDate >= attStartDate && pDate <= attEndDate;
            });

            setBiometricPunches(filteredPunches);
          }
        } catch (err) {
          console.error('Error fetching biometric logs in StaffManagement:', err);
        }
      };

      fetchLogs();
    }
  }, [modal?.staff, attStartDate, attEndDate]);

  // Helper to handle print functionality
  

  // Helper to handle print document functionality
  const handlePrintDoc = (docName: string) => {
    const docFile = uploadedDocs[modal?.staff?.id || '']?.[docName];
    const win = window.open('', '_blank');
    if (!win) return;

    const schoolName = localStorage.getItem('school_name') || 'Krishnaveni Talent School';
    const schoolAddress = localStorage.getItem('school_address') || 'Nizamabad, Telangana';
    const schoolLogo = localStorage.getItem('school_logo') || '/KTHS_Logo.png';

    if (docFile && docFile.type.startsWith('image/')) {
      win.document.write(`
        <html>
          <head><title>Print Document - ${docName}</title></head>
          <body style="margin:0; display:flex; justify-content:center; align-items:center;">
            <img src="${docFile.data}" style="max-width:100%; max-height:100vh; object-fit:contain;" />
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
    } else {
      win.document.write(`
        <html>
          <head>
            <title>Document Receipt - ${modal?.staff?.name}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; background: white; text-align: center; }
              .doc-container { border: 2px solid #3b82f6; border-radius: 12px; padding: 40px; max-width: 650px; margin: 0 auto; background: #f8fafc; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
              .school-title { font-size: 20px; font-weight: bold; color: #1e3a8a; margin-bottom: 4px; }
              .doc-title { font-size: 16px; font-weight: bold; color: #475569; margin-bottom: 24px; border-bottom: 1px solid #cbd5e1; padding-bottom: 12px; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; text-align: left; }
              .info-label { color: #64748b; font-weight: 500; }
              .info-value { color: #0f172a; font-weight: 600; }
              .seal { margin-top: 32px; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 12px; color: #10b981; font-weight: bold; text-transform: uppercase; }
            </style>
          </head>
          <body>
            <div class="doc-container">
              <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px; border-bottom: 1px solid #cbd5e1; padding-bottom: 16px;">
                <img src="${schoolLogo}" alt="School Logo" style="width: 44px; height: 44px; object-fit: contain;" />
                <div style="text-align: left;">
                  <div class="school-title" style="margin: 0; line-height: 1.2;">${schoolName}</div>
                  <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${schoolAddress}</div>
                </div>
              </div>
              <div class="doc-title">${docName} Verification Receipt</div>
              <div class="info-row"><span class="info-label">Staff Name:</span><span class="info-value">${modal?.staff?.name}</span></div>
              <div class="info-row"><span class="info-label">Designation:</span><span class="info-value">${modal?.staff?.designation}</span></div>
              <div class="info-row"><span class="info-label">Document Name:</span><span class="info-value">${docName}</span></div>
              <div class="info-row"><span class="info-label">File Name:</span><span class="info-value">${docFile ? docFile.name : 'N/A'}</span></div>
              <div class="info-row"><span class="info-label">Verification Status:</span><span class="info-value" style="color: #10b981;">VERIFIED & ACTIVE</span></div>
              <div class="seal">Official Digital Record - Verified by Admin</div>
            </div>
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
    }
    win.document.close();
  };

  const handleDownloadDoc = (docName: string) => {
    const schoolName = localStorage.getItem('school_name') || 'Krishnaveni Talent School';
    const docFile = uploadedDocs[modal?.staff?.id || '']?.[docName];
    if (docFile) {
      const link = document.createElement('a');
      link.href = docFile.data;
      link.download = docFile.name;
      link.click();
    } else {
      const content = `${schoolName.toUpperCase()}\nDocument Verification Receipt\n\nStaff Member: ${modal?.staff?.name}\nDocument Type: ${docName}\nStatus: Verified & Approved\nDate: ${new Date().toLocaleDateString()}\n`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${docName.replace(/\s+/g, '_')}_${modal?.staff?.name?.replace(/\s+/g, '_')}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDeleteDoc = async (docName: string) => {
    const staffId = modal?.staff?.id;
    if (!staffId) return;
    if (!await confirm(`Are you sure you want to delete the uploaded document "${docName}"?`, 'Delete Document', true)) return;

    setUploadedDocs(prev => {
      const next = { ...prev };
      if (next[staffId]) {
        const staffDocs = { ...next[staffId] };
        delete staffDocs[docName];
        next[staffId] = staffDocs;
      }
      localStorage.setItem('kts_staff_uploaded_docs', JSON.stringify(next));
      return next;
    });

    setSelectedDocPreview(null);
  };




  useEffect(() => {
    if (modal && modal.staff) {
      const cat = modal.staff.category || 'Teaching';
      const standards = ['Teaching', 'Non-Teaching', 'House Keeping', 'Driver', 'Cleaner', 'Watchman'];
      if (standards.includes(cat)) {
        setSelectedCategory(cat);
        setCustomCategory('');
      } else {
        setSelectedCategory('manual_entry');
        setCustomCategory(cat);
      }

      const standardDocs = getDocsForCategory(cat);
      const staffDocs = modal.staff.documents || [];
      const customOnes = staffDocs.filter(d => !standardDocs.includes(d));
      setCustomDocs(customOnes);
    } else {
      setSelectedCategory('Teaching');
      setCustomCategory('');
      setCustomDocs([]);
      setUploadedFiles({});
    }
  }, [modal]);

  const getStaffAttendancePercentage = (staff: StaffMember) => {
    // Get all unique dates in the system
    const recordedDates = new Set<string>();
    Object.keys(manualAttendance).forEach(d => recordedDates.add(d));
    biometricPunches.forEach(p => {
      if (p.timestamp) {
        recordedDates.add(p.timestamp.slice(0, 10));
      }
    });

    // Filter out dates before the employee's join date or in the future
    const joinTime = new Date(staff.join_date || new Date()).getTime();
    const dates = Array.from(recordedDates).filter(d => {
      const dateTime = new Date(d).getTime();
      return !isNaN(dateTime) && dateTime >= joinTime && d <= new Date().toISOString().slice(0, 10);
    });

    if (dates.length === 0) {
      // If no attendance records exist in the system yet, fall back to the mock/default percentage
      return staff.attendance_percentage || 100;
    }

    let presentDays = 0;
    let totalDays = 0;

    const attendanceMode = localStorage.getItem('kts_staff_attendance_mode') || 'biometric';
    const lateEntryCutoff = localStorage.getItem('late_entry_cutoff') || '09:50';
    const earlyEntryCutoff = localStorage.getItem('early_entry_cutoff') || '15:00';

    dates.forEach((dateStr) => {
      const manualStatus = manualAttendance[dateStr]?.[staff.id];
      let status: 'Present' | 'Absent' | 'Leave' | 'Half Day' = 'Present';
      
      if (manualStatus) {
        status = manualStatus as any;
      } else {
        const hasApprovedLeave = leaveRequests.some((l) => 
          String(l.staffId) === String(staff.id) &&
          l.status === 'Approved' &&
          dateStr >= l.from &&
          dateStr <= l.to
        );
        if (hasApprovedLeave) {
          status = 'Leave';
        } else if (attendanceMode === 'manual') {
          status = 'Present'; // default to present in manual mode
        } else {
          // Biometric mode - check punches
          const punches = biometricPunches.filter(
            (p) => p.staffId === staff.id && p.timestamp.startsWith(dateStr)
          );
          punches.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

          if (punches.length === 0) {
            status = 'Absent';
          } else if (punches.length === 1) {
            status = 'Half Day';
          } else {
            const firstPunchTime = punches[0].timestamp.split(' ')[1] || '';
            const lastPunchTime = punches[punches.length - 1].timestamp.split(' ')[1] || '';
            
            let hasCheckIn = firstPunchTime <= (lateEntryCutoff + ':59');
            let hasCheckOut = lastPunchTime >= (earlyEntryCutoff + ':00');
            
            if (!hasCheckIn && !hasCheckOut) {
              if (punches.length >= 2) {
                hasCheckIn = true;
                hasCheckOut = true;
              } else {
                hasCheckIn = true; // Half Day
              }
            }
            
            if (hasCheckIn && hasCheckOut) {
              status = 'Present';
            } else {
              status = 'Half Day';
            }
          }
        }
      }

      if (status === 'Present') {
        presentDays += 1;
        totalDays += 1;
      } else if (status === 'Half Day') {
        presentDays += 0.5;
        totalDays += 1;
      } else if (status === 'Absent') {
        totalDays += 1;
      }
    });

    if (totalDays === 0) return staff.attendance_percentage || 100;
    return Math.round((presentDays / totalDays) * 100);
  };

  const staffListWithAttendance = staffList.map(s => ({
    ...s,
    attendance_percentage: getStaffAttendancePercentage(s)
  }));

  const filtered = staffListWithAttendance.filter((s) => {
    if (s.status === 'Resigned') return false; // Hidden in recycle bin
    const matchSearch =
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.designation || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.department || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.category || '').toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'All' || s.department === deptFilter;
    const matchCat = catFilter === 'All' || s.category === catFilter;
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchDept && matchCat && matchStatus;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let valA: any = a[sortField];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let valB: any = b[sortField];

    if (sortField === 'name') {
      valA = (a.name || '').toLowerCase();
      valB = (b.name || '').toLowerCase();
    } else if (sortField === 'department') {
      valA = (a.department || '').toLowerCase();
      valB = (b.department || '').toLowerCase();
    } else if (sortField === 'join_date') {
      valA = new Date(a.join_date).getTime();
      valB = new Date(b.join_date).getTime();
    } else if (sortField === 'attendance_percentage') {
      valA = a.attendance_percentage;
      valB = b.attendance_percentage;
    } else if (sortField === 'status') {
      valA = (a.status || '').toLowerCase();
      valB = (b.status || '').toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const active = staffList.filter((s) => s.status === 'Active').length;
  const onLeave = staffList.filter((s) => s.status === 'On Leave').length;
  const totalSalary = staffList.filter(s => s.status !== 'Resigned').reduce((sum, s) => sum + s.salary, 0);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nameVal = fd.get('name') as string;
    const designationVal = fd.get('designation') as string;
    const subjectVal = (fd.get('subject') as string) || '';
    const phoneVal = fd.get('phone') as string;
    const emailVal = (fd.get('email') as string) || '';
    const joinDateVal = fd.get('joinDate') as string;
    const salaryVal = parseFloat(fd.get('salary') as string) || 0;
    const qualificationsVal = (fd.get('qualifications') as string) || 'N/A';
    const biometricCodeVal = (fd.get('biometric_employee_code') as string) || '';

    const categoryVal = selectedCategory === 'manual_entry' ? customCategory.trim() : selectedCategory;
    let departmentVal = (fd.get('department') as string) || '';
    if (!departmentVal) {
      if (categoryVal === 'Driver' || categoryVal === 'Cleaner') {
        departmentVal = 'Transport';
      } else if (categoryVal === 'Watchman') {
        departmentVal = 'Security';
      } else if (categoryVal === 'House Keeping') {
        departmentVal = 'Housekeeping';
      } else {
        departmentVal = 'Support Staff';
      }
    }
    const documentsVal = [
      ...getDocsForCategory(categoryVal || 'Teaching'),
      ...customDocs
    ];

    const staffId = modal?.type === 'add' ? 'staff-' + Date.now() : modal!.staff!.id;

    // Convert uploadedFiles to base64
    const docUpdates: Record<string, { name: string; type: string; data: string }> = {};
    for (const [docName, file] of Object.entries(uploadedFiles)) {
      try {
        const base64 = await fileToBase64(file);
        docUpdates[docName] = {
          name: file.name,
          type: file.type,
          data: base64
        };
      } catch (err) {
        console.error('Error saving file:', err);
      }
    }

    if (Object.keys(docUpdates).length > 0) {
      setUploadedDocs(prev => {
        const next = {
          ...prev,
          [staffId]: {
            ...(prev[staffId] || {}),
            ...docUpdates
          }
        };
        localStorage.setItem('kts_staff_uploaded_docs', JSON.stringify(next));
        return next;
      });
    }

    if (modal?.type === 'add') {
      const newStaff = {
        name: nameVal,
        designation: designationVal,
        department: departmentVal,
        category: categoryVal || 'Teaching',
        subject: subjectVal,
        phone: phoneVal,
        email: emailVal || `${(nameVal || '').toLowerCase().replace(/[^a-z0-9]/g, '')}@krishnaveni.edu`,
        join_date: joinDateVal || new Date().toISOString().slice(0, 10),
        attendance_percentage: 100,
        status: 'Active',
        salary: salaryVal,
        qualifications: qualificationsVal,
        documents: documentsVal,
        biometric_employee_code: biometricCodeVal,
      };
      
      try {
        const res = await api.createResource('faculty', newStaff);
        setStaffList(prev => [{
          ...res,
          documents: typeof res.documents === 'string' ? JSON.parse(res.documents) : (res.documents || []),
          status: res.status ? res.status.charAt(0).toUpperCase() + res.status.slice(1) : 'Active',
          salary: typeof res.salary === 'string' ? parseFloat(res.salary) : res.salary
        }, ...prev]);
      } catch (err) {
        console.error('Failed to create staff', err);
      }
      
    } else if (modal?.type === 'edit' && modal.staff) {
      const updatedStaff = {
        name: nameVal,
        designation: designationVal,
        department: departmentVal,
        category: categoryVal || 'Teaching',
        subject: subjectVal,
        phone: phoneVal,
        email: emailVal,
        join_date: joinDateVal,
        salary: salaryVal,
        qualifications: qualificationsVal,
        documents: documentsVal,
        biometric_employee_code: biometricCodeVal,
      };

      try {
        const res = await api.updateResource('faculty', staffId, updatedStaff);
        setStaffList(prev => prev.map(s => s.id === staffId ? {
          ...res,
          documents: typeof res.documents === 'string' ? JSON.parse(res.documents) : (res.documents || []),
          status: res.status ? res.status.charAt(0).toUpperCase() + res.status.slice(1) : 'Active',
          salary: typeof res.salary === 'string' ? parseFloat(res.salary) : res.salary
        } : s));
      } catch (err) {
        console.error('Failed to update staff', err);
      }
    }
    setModal(null);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.deleteResource('faculty', deleteConfirmId);
      setStaffList(prev => prev.map(s => s.id === deleteConfirmId ? { ...s, status: 'Resigned' as const } : s));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete staff', err);
    }
  };

  const allCategories = Array.from(new Set(staffList.map(s => s.category || 'Teaching')));
  const standardDepts = ['Mathematics', 'Science', 'English', 'Languages', 'Social Sciences', 'Sports', 'Admin', 'Office', 'Transport', 'Security', 'Housekeeping'];
  const allDepartments = Array.from(new Set([...standardDepts, ...staffList.map(s => s.department).filter(Boolean)]));

  const getDocsForCategory = (cat: string) => {
    const common = ['Aadhar Card'];
    if (cat === 'Teaching') {
      return [...common, 'Degree Certificate', 'Experience Letter'];
    }
    if (cat === 'Non-Teaching') {
      return [...common, 'Degree Certificate'];
    }
    if (cat === 'Driver') {
      return [...common, 'Driving License Copy'];
    }
    return [...common, 'Police NOC / Verification'];
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {modal?.type === 'view' && modal.staff ? (
        <StaffViewModal
          modal={modal}
          onClose={() => setModal(null)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          leaveRequests={leaveRequests}
          uploadedDocs={uploadedDocs}
          setSelectedSlip={setSelectedSlip}
          attStartDate={attStartDate}
          attEndDate={attEndDate}
          setAttStartDate={setAttStartDate}
          setAttEndDate={setAttEndDate}
          setAttPage={setAttPage}
          setSelectedDocPreview={setSelectedDocPreview}
          attPage={attPage}
          staffSalaries={staffSalaries}
          setNewDocName={setNewDocName}
          setNewDocFile={setNewDocFile}
          setAddDocModalOpen={setAddDocModalOpen}
          payslips={payslips}
          manualAttendance={manualAttendance}
          biometricPunches={biometricPunches}
        />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <KPICard label="Total Staff" value={staffList.length} sub="All departments" icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} iconBg="var(--purple-bg)" iconColor="var(--purple-tx)" />
            <KPICard label="Active Staff" value={active} sub="Present this month" icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
            <KPICard label="On Leave" value={onLeave} sub="Approved leaves" icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
            <KPICard label="Total Payroll" value={`₹${(totalSalary / 100000).toFixed(1)}L`} sub="Per month" icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[13px] font-semibold text-[var(--tx)]">Staff Directory</div>
              <div className="flex gap-2">
                <button onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg cursor-pointer hover:bg-[var(--surf3)]">
                  <Upload size={12} /> Import
                </button>
                <button onClick={exportToExcel} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg cursor-pointer hover:bg-[var(--surf3)]">
                  <Download size={12} /> Export
                </button>
                <button onClick={() => setModal({ type: 'add' })} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90">
                  <Plus size={12} /> Add Staff
                </button>
              </div>
            </div>

            {/* Filters */}
            <StaffFilters 
              search={search}
              setSearch={setSearch}
              deptFilter={deptFilter}
              setDeptFilter={setDeptFilter}
              catFilter={catFilter}
              setCatFilter={setCatFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              allCategories={allCategories}
              allDepartments={allDepartments}
            />

            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between bg-[var(--blue-bg)] border border-[var(--blue-tx)]/25 rounded-lg p-3 mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="text-[12px] text-[var(--blue-tx)] font-semibold">{selectedIds.length} staff selected</span>
                <div className="flex gap-2">
                  <button onClick={() => handleBulkStatusChange('Active')} className="px-2.5 py-1 text-[11px] bg-[var(--teal-bg)] text-[var(--teal-tx)] border border-[var(--teal-tx)]/20 rounded-md font-semibold hover:opacity-90 cursor-pointer">Mark Active</button>
                  <button onClick={() => handleBulkStatusChange('On Leave')} className="px-2.5 py-1 text-[11px] bg-[var(--amber-bg)] text-[var(--amber-tx)] border border-[var(--amber-tx)]/20 rounded-md font-semibold hover:opacity-90 cursor-pointer">Mark On Leave</button>
                  <button onClick={handleBulkDelete} className="px-2.5 py-1 text-[11px] bg-[var(--red-bg)] text-[var(--red-tx)] border border-[var(--red-tx)]/25 rounded-md font-semibold hover:opacity-90 cursor-pointer">Move to Recycle Bin</button>
                </div>
              </div>
            )}

            <StaffTable
              loading={loading}
              sortedFiltered={sortedFiltered}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              sortField={sortField}
              sortOrder={sortOrder}
              handleSort={handleSort}
              setModal={setModal}
              handleDelete={handleDelete}
              search={search}
            />
          </Card>
        </>
      )}

      {/* Add/Edit Modal */}
      {modal && modal.type !== 'view' && (
        <StaffFormModal
          modal={modal}
          onClose={() => setModal(null)}
          handleSave={handleSave}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          customCategory={customCategory}
          setCustomCategory={setCustomCategory}
          getDocsForCategory={getDocsForCategory}
          setCustomDocs={setCustomDocs}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
        />
      )}



      {/* Payslip View & Print Preview Modal */}
      <StaffPayslipModal selectedSlip={selectedSlip} onClose={() => setSelectedSlip(null)} />

      {/* Submitted Document Preview Modal */}
      {selectedDocPreview && modal && modal.staff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[480px] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Document Preview</div>
                <div className="text-[12px] text-[var(--tx3)]">{selectedDocPreview}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadDoc(selectedDocPreview)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg cursor-pointer hover:bg-[var(--surf3)] text-[var(--tx)] font-semibold transition-all"
                  title="Download Document"
                >
                  <Download size={11} /> Download
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDoc(selectedDocPreview)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] bg-[var(--red-bg)] text-[var(--red-tx)] border border-[var(--red-tx)]/25 rounded-lg cursor-pointer hover:bg-[var(--red-bg)]/80 font-semibold transition-all"
                  title="Delete Document"
                >
                  <Trash2 size={11} /> Delete
                </button>
                <button
                  onClick={() => setSelectedDocPreview(null)}
                  className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx3)]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Document Certificate Layout */}
            <div className="p-6 bg-[var(--surf2)]/30 overflow-y-auto max-h-[55vh] flex flex-col items-center justify-center min-h-[200px]">
              {(() => {
                const docFile = uploadedDocs[modal.staff.id]?.[selectedDocPreview];
                if (docFile) {
                  const isImage = docFile.type.startsWith('image/');
                  const isPdf = docFile.type === 'application/pdf';
                  
                  if (isImage) {
                    return (
                      <div className="border border-[var(--b)] rounded-2xl overflow-hidden bg-white p-2 max-w-full flex items-center justify-center">
                        <img src={docFile.data} alt={selectedDocPreview} className="max-w-full max-h-[400px] object-contain rounded-xl" />
                      </div>
                    );
                  }
                  if (isPdf) {
                    return (
                      <iframe src={docFile.data} className="w-full h-[400px] rounded-xl border border-[var(--b)] bg-white" title={selectedDocPreview} />
                    );
                  }
                  
                  // Non-previewable (doc, xlsx, etc.)
                  return (
                    <div className="w-full bg-[var(--surf)] border border-[var(--b)] rounded-2xl p-6 shadow-sm text-center max-w-[400px]">
                      <FileText size={48} className="text-[var(--blue-tx)] mx-auto mb-3" />
                      <div className="text-[13px] font-bold text-[var(--tx)] truncate mb-1">{docFile.name}</div>
                      <div className="text-[11px] text-[var(--tx3)] font-mono mb-4">{(docFile.data.length * 0.75 / 1024).toFixed(1)} KB</div>
                      <p className="text-[11px] text-[var(--tx2)] mb-4">This file type cannot be previewed directly. Please download the document to view its contents.</p>
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(selectedDocPreview)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--blue)] text-white rounded-xl text-[12px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <Download size={13} /> Download File
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="text-center py-6 text-[11.5px] text-[var(--tx3)] italic">
                    Document source file not found.
                  </div>
                );
              })()}
            </div>

            <div className="p-5 pt-0 border-t border-[var(--b)] bg-[var(--surf2)]/20 mt-auto">
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="w-full py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Inline Modal (100% robust on desktop and mobiles) */}
      {addDocModalOpen && modal && modal.staff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Add Other Document</div>
                <div className="text-[11px] text-[var(--tx3)]">Upload custom files for {modal.staff.name}</div>
              </div>
              <button
                type="button"
                onClick={() => setAddDocModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--surf2)] text-[var(--tx3)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--tx2)] mb-1.5">Document Name *</label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Experience Certificate"
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--tx2)] mb-1.5">Choose File *</label>
                <div
                  onClick={() => {
                    const elInput = document.getElementById('direct-file-chooser-input');
                    if (elInput) elInput.click();
                  }}
                  className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    newDocFile
                      ? 'border-[var(--teal)] bg-[var(--teal-bg)]/10'
                      : 'border-[var(--b)] bg-[var(--surf2)]/20 hover:border-[var(--blue)]'
                  }`}
                >
                  <input
                    id="direct-file-chooser-input"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setNewDocFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  {newDocFile ? (
                    <>
                      <CheckCircle2 size={24} className="text-[var(--teal)] mx-auto mb-2" />
                      <div className="text-[12px] font-bold text-[var(--tx)] truncate px-1">{newDocFile.name}</div>
                      <div className="text-[10px] text-[var(--tx3)] font-mono mt-0.5">{(newDocFile.size / 1024).toFixed(1)} KB</div>
                      <div className="text-[9px] text-[var(--blue-tx)] mt-2 hover:underline">Tap to change file</div>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="text-[var(--tx3)] mx-auto mb-2" />
                      <div className="text-[12px] font-bold text-[var(--tx2)]">Choose file from device</div>
                      <div className="text-[10px] text-[var(--tx3)] mt-0.5">Supports PDF, Images, Word, Excel</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 p-5 pt-0">
              <button
                type="button"
                onClick={() => setAddDocModalOpen(false)}
                className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] cursor-pointer hover:bg-[var(--surf3)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newDocName.trim() || !newDocFile}
                onClick={async () => {
                  if (!newDocName.trim() || !newDocFile) return;
                  try {
                    const base64 = await fileToBase64(newDocFile);
                    setUploadedDocs(prev => {
                      const staffDocs = prev[modal.staff!.id] || {};
                      const next = {
                        ...prev,
                        [modal.staff!.id]: {
                          ...staffDocs,
                          [newDocName.trim()]: {
                            name: newDocFile.name,
                            type: newDocFile.type,
                            data: base64
                          }
                        }
                      };
                      localStorage.setItem('kts_staff_uploaded_docs', JSON.stringify(next));
                      return next;
                    });
                    // Update staff documents list
                    setStaffList(prevList => prevList.map(s => {
                      if (s.id === modal.staff!.id) {
                        const existingDocs = s.documents || [];
                        if (!existingDocs.includes(newDocName.trim())) {
                          return {
                            ...s,
                            documents: [...existingDocs, newDocName.trim()]
                          };
                        }
                      }
                      return s;
                    }));
                    setAddDocModalOpen(false);
                    await alert("Document added successfully!", "Document Uploaded");
  // eslint-disable-next-line unused-imports/no-unused-vars
                  } catch (err) {
                    await alert("Failed to save document file", "Upload Error");
                  }
                }}
                className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <StaffImportModal
          onClose={() => setImportOpen(false)}
          onImportSuccess={(newStaff) => {
            setStaffList(prev => [...newStaff, ...prev]);
            setImportOpen(false);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Move Staff Member to Recycle Bin"
        message="Are you sure you want to move this staff member to the recycle bin? You can restore them later."
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
        isDestructive={true}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirmOpen}
        title="Move Selected Staff Members to Recycle Bin"
        message={`Are you sure you want to move the ${selectedIds.length} selected staff members to the recycle bin? You can restore them later.`}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={executeBulkDelete}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
        isDestructive={true}
      />

      {/* Bulk Status Update Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!bulkStatusConfirmOpen}
        title="Update Selected Staff Status"
        message={`Are you sure you want to change the status of the ${selectedIds.length} selected staff members to ${bulkStatusConfirmOpen}?`}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={executeBulkStatusChange}
        onCancel={() => setBulkStatusConfirmOpen(null)}
        isDestructive={false}
      />
    </div>
  );
}

