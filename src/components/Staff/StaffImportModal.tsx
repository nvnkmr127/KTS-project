import { useState } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, FileSpreadsheet, Download, Loader2, Plus, Trash2 } from 'lucide-react';
import { StaffMember } from '../../pages/StaffManagement';
import * as XLSX from 'xlsx-js-style';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

interface StaffImportModalProps {
  onClose: () => void;
  onImportSuccess: (newStaff: StaffMember[]) => void | Promise<void>;
}

const STAFF_SYNONYMS: Record<string, string[]> = {
  name: ['full name', 'name', 'staff name', 'staff_name', 'employee name', 'employee_name', 'teacher name', 'teacher_name'],
  designation: ['designation', 'role', 'job title', 'job_title', 'position'],
  department: ['department', 'dept'],
  category: ['category', 'group', 'type'],
  subject: ['subject', 'subjects', 'subject(s)', 'specialization'],
  phone: ['mobile number', 'mobile', 'phone', 'phone number', 'contact', 'mobile_no', 'phone_no'],
  email: ['email', 'email address', 'email_address', 'mail'],
  join_date: ['join date', 'joining date', 'join_date', 'date of joining', 'doj'],
  salary: ['salary', 'monthly salary', 'monthly_salary', 'pay', 'basic salary'],
  qualifications: ['qualifications', 'qualification', 'degree', 'education']
};

 
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
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    if (parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return str;
};
 

const cleanDepartment = (val: any): string => {
  if (!val) return 'Mathematics';
  const str = String(val).trim().toLowerCase();
  if (str.includes('math')) return 'Mathematics';
  if (str.includes('sci') || str.includes('phys') || str.includes('chem') || str.includes('bio')) return 'Science';
  if (str.includes('eng')) return 'English';
  if (str.includes('tel') || str.includes('hin') || str.includes('lang')) return 'Languages';
  if (str.includes('soc') || str.includes('his') || str.includes('geo') || str.includes('civ')) return 'Social Sciences';
  if (str.includes('sport') || str.includes('p.e') || str.includes('gym') || str.includes('physical')) return 'Sports';
  return 'Mathematics';
};

const validateStaff = (s: StaffMember) => {
  const errors: string[] = [];
  if (!s.name.trim()) errors.push('Full name is required');
  if (!s.designation.trim()) errors.push('Designation is required');
  if (!s.department.trim()) errors.push('Department is required');
  if (!s.phone.trim()) errors.push('Phone number is required');
  if (!s.join_date || !/^\d{4}-\d{2}-\d{2}$/.test(s.join_date)) errors.push('Valid Join Date required (YYYY-MM-DD)');
  if (isNaN(s.salary) || s.salary <= 0) errors.push('Salary must be a positive number');
  return errors;
};

export function StaffImportModal({ onClose, onImportSuccess }: StaffImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mappedStaff, setMappedStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
   
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const parseExcel = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
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
      reader.readAsBinaryString(file);
     
    });
  };

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
        } catch (err) {
          reject(err);
        }
      };
       
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const parsePDF = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
         
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
           
          
           
          const rowsData: any[][] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            const items = textContent.items as any[];
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
          return Object.values(STAFF_SYNONYMS).some(syns => syns.includes(val));
        })) {
          headerIndex = r;
          break;
        }
      }

      const headers = rawRows[headerIndex].map(h => String(h).toLowerCase().trim());
      
      const colMap: Record<string, number> = {};
      Object.keys(STAFF_SYNONYMS).forEach(field => {
        const syns = STAFF_SYNONYMS[field];
        const idx = headers.findIndex(h => syns.includes(h) || syns.some(syn => h.includes(syn)));
        if (idx !== -1) {
          colMap[field] = idx;
        }
      });

      const dataRows = rawRows.slice(headerIndex + 1);
      const staffList: StaffMember[] = dataRows
        .map((row) => {
          if (row.filter(c => c !== undefined && c !== null && String(c).trim() !== '').length === 0) {
            return null;
          }

          const rawName = colMap.name !== undefined ? row[colMap.name] : '';
          const rawDesignation = colMap.designation !== undefined ? row[colMap.designation] : '';
          const rawDepartment = colMap.department !== undefined ? row[colMap.department] : '';
          const rawCategory = colMap.category !== undefined ? row[colMap.category] : '';
          const rawSubject = colMap.subject !== undefined ? row[colMap.subject] : '';
          const rawPhone = colMap.phone !== undefined ? row[colMap.phone] : '';
          const rawEmail = colMap.email !== undefined ? row[colMap.email] : '';
          const rawJoinDate = colMap.join_date !== undefined ? row[colMap.join_date] : '';
          const rawSalary = colMap.salary !== undefined ? row[colMap.salary] : 0;
          const rawQualifications = colMap.qualifications !== undefined ? row[colMap.qualifications] : '';

          const nameVal = rawName ? String(rawName).trim() : 'N/A';
          return {
            id: 'staff-' + Math.random().toString(36).substr(2, 9),
            name: nameVal,
            designation: rawDesignation ? String(rawDesignation).trim() : 'Teacher',
            department: cleanDepartment(rawDepartment),
            category: rawCategory ? String(rawCategory).trim() : 'Teaching',
            subject: rawSubject ? String(rawSubject).trim() : '',
            phone: rawPhone ? String(rawPhone).trim() : 'N/A',
            email: rawEmail ? String(rawEmail).trim() : `${nameVal.toLowerCase().replace(/[^a-z0-9]/g, '')}@krishnaveni.edu`,
            join_date: cleanDate(rawJoinDate) || new Date().toISOString().slice(0, 10),
            attendance_percentage: 100,
            status: 'Active',
            salary: parseFloat(String(rawSalary)) || 35000,
            qualifications: rawQualifications ? String(rawQualifications).trim() : 'B.Ed',
          } as StaffMember;
        })
        .filter((s): s is StaffMember => s !== null);

      setMappedStaff(staffList);
      setFile(selectedFile);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Failed to parse file. Please verify format.');
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

  const updateStaffField = (id: string, field: keyof StaffMember, value: any) => {
    setMappedStaff(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const removeStaff = (id: string) => {
    setMappedStaff(prev => prev.filter(s => s.id !== id));
  };

  const addStaffRow = () => {
    const newStaff: StaffMember = {
      id: 'staff-' + Math.random().toString(36).substr(2, 9),
      name: '',
      designation: 'Teacher',
      department: 'Mathematics',
      category: 'Teaching',
      subject: '',
      phone: '',
      email: '',
      join_date: new Date().toISOString().slice(0, 10),
      attendance_percentage: 100,
      status: 'Active',
      salary: 35000,
      qualifications: 'B.Ed',
    };
    setMappedStaff(prev => [...prev, newStaff]);
  };

  const handleImportSave = async () => {
    setImporting(true);
    setError('');

    const invalidStaff = mappedStaff.filter(s => validateStaff(s).length > 0);
    if (invalidStaff.length > 0) {
      setError(`Please fix all validation errors before importing. (${invalidStaff.length} rows contain errors)`);
      setImporting(false);
      return;
    }

    try {
      await onImportSuccess(mappedStaff);
      setSuccessCount(mappedStaff.length);
    } catch (err) {
      setError('Failed to import staff members. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const SAMPLE_HEADERS = [
    'Full Name', 'Designation', 'Department', 'Category', 'Subject(s)', 'Phone',
    'Email', 'Join Date', 'Monthly Salary', 'Qualifications'
  ];
  const SAMPLE_ROWS = [
    ['Mr. V. Suresh', 'Social Studies Teacher', 'Social Sciences', 'Teaching', 'History, Civics', '9876543210', 'suresh@krishnaveni.edu', '2020-06-01', '35000', 'M.A., B.Ed'],
    ['Mrs. Lakshmi Devi', 'Senior Teacher', 'Mathematics', 'Teaching', 'Maths', '9876501234', 'lakshmi@krishnaveni.edu', '2015-06-01', '62000', 'M.Sc, B.Ed'],
  ];

  const downloadTemplate = (format: 'xlsx' | 'csv') => {
    if (format === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet([SAMPLE_HEADERS, ...SAMPLE_ROWS]);
      ws['!cols'] = SAMPLE_HEADERS.map(() => ({ wch: 20 }));

      // Apply bold, yellow background, and borders to the first row (headers)
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ c: C, r: 0 });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "FFFF00" } }, // Yellow highlight
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Staff');
      XLSX.writeFile(wb, 'KTS_Staff_Import_Template.xlsx');
    } else {
      const csvLines = [
        SAMPLE_HEADERS.join(','),
        ...SAMPLE_ROWS.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\r\n');
      const blob = new Blob([csvLines], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'KTS_Staff_Import_Template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (successCount !== null) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[460px] p-6 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--teal-bg)] text-[var(--teal)] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-[var(--tx)] mb-2">Import Successful</h3>
          <p className="text-[12.5px] text-[var(--tx2)] mb-6">
            Successfully imported {successCount} staff records into the directory.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[var(--blue)] text-white rounded-xl text-[13px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            View in Staff Directory
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
              <Upload size={16} /> Import Staff Directory Data
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
              className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-colors ${
                dragActive
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

          {/* Required columns */}
          {!file && !loading && (
            <div className="border border-[var(--b)] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[var(--surf2)] border-b border-[var(--b)]">
                <FileSpreadsheet size={13} className="text-[var(--blue-tx)]" />
                <span className="text-[11.5px] font-semibold text-[var(--tx)]">
                  Required columns in your file
                </span>
              </div>
              <div className="p-3.5">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    { n: '1', label: 'Full Name', req: true },
                    { n: '2', label: 'Designation', req: true },
                    { n: '3', label: 'Department', req: true },
                    { n: '4', label: 'Category', req: true },
                    { n: '5', label: 'Subject(s)', req: false },
                    { n: '6', label: 'Phone', req: true },
                    { n: '7', label: 'Email', req: false },
                    { n: '8', label: 'Join Date', req: true },
                    { n: '9', label: 'Monthly Salary', req: true },
                    { n: '10', label: 'Qualifications', req: false },
                  ].map(col => (
                    <div
                      key={col.n}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                        col.req
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

                <div className="bg-[var(--surf2)] rounded-lg p-2.5 overflow-x-auto">
                  <div className="text-[10px] text-[var(--tx3)] mb-1.5 font-medium uppercase tracking-wider">Example row</div>
                  <div className="flex gap-2 text-[10.5px] text-[var(--tx2)] whitespace-nowrap">
                    {['Mr. V. Suresh', 'Social Studies Teacher', 'Social Sciences', 'Teaching', 'History', '9876543210', 'suresh@edu.com', '2020-06-01', '35000', 'M.A., B.Ed'].map((v, i) => (
                      <span key={i} className="px-2 py-0.5 bg-[var(--surf)] border border-[var(--b)] rounded font-mono text-[10px]">{v}</span>
                    ))}
                  </div>
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

          {file && mappedStaff.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[12.5px] font-bold text-[var(--tx)]">
                  Parsed Records Preview ({mappedStaff.length} rows)
                </div>
                <button
                  onClick={addStaffRow}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--surf2)] hover:bg-[var(--surf3)] text-[var(--tx)] border border-[var(--b)] rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer"
                >
                  <Plus size={12} /> Add Staff Row
                </button>
              </div>

              <div className="overflow-x-auto border border-[var(--b)] rounded-xl max-h-[400px]">
                <table className="w-full border-collapse text-[11.5px] min-w-[1100px]">
                  <thead>
                    <tr className="bg-[var(--surf2)] border-b border-[var(--b)] sticky top-0 z-10 text-[var(--tx3)]">
                      <th className="px-3 py-2 text-left font-medium w-[50px]">Status</th>
                      <th className="px-2 py-2 text-left font-medium w-[150px]">Full Name *</th>
                      <th className="px-2 py-2 text-left font-medium w-[130px]">Designation *</th>
                      <th className="px-2 py-2 text-left font-medium w-[130px]">Department *</th>
                      <th className="px-2 py-2 text-left font-medium w-[120px]">Category *</th>
                      <th className="px-2 py-2 text-left font-medium w-[130px]">Subject(s)</th>
                      <th className="px-2 py-2 text-left font-medium w-[120px]">Phone *</th>
                      <th className="px-2 py-2 text-left font-medium w-[150px]">Email</th>
                      <th className="px-2 py-2 text-left font-medium w-[120px]">Join Date *</th>
                      <th className="px-2 py-2 text-left font-medium w-[100px]">Salary (₹) *</th>
                      <th className="px-2 py-2 text-left font-medium">Qualifications</th>
                      <th className="px-2 py-2 text-center font-medium w-[50px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--surf)] divide-y divide-[var(--b)]">
                    {mappedStaff.map((s) => {
                      const rowErrors = validateStaff(s);
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
                              value={s.name}
                              onChange={(e) => updateStaffField(s.id, 'name', e.target.value)}
                              className={`w-full bg-[var(--surf2)] border ${!s.name ? 'border-[var(--red)]/40 focus:border-[var(--red)]' : 'border-[var(--b)] focus:border-[var(--blue)]'} rounded px-2 py-1 text-[11.5px] outline-none`}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              value={s.designation}
                              onChange={(e) => updateStaffField(s.id, 'designation', e.target.value)}
                              className={`w-full bg-[var(--surf2)] border ${!s.designation ? 'border-[var(--red)]/40 focus:border-[var(--red)]' : 'border-[var(--b)] focus:border-[var(--blue)]'} rounded px-2 py-1 text-[11.5px] outline-none`}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <select
                              value={s.department}
                              onChange={(e) => updateStaffField(s.id, 'department', e.target.value)}
                              className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded px-1.5 py-1 text-[11.5px] outline-none cursor-pointer"
                            >
                              {['Mathematics', 'Science', 'English', 'Languages', 'Social Sciences', 'Sports'].map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              value={s.category}
                              onChange={(e) => updateStaffField(s.id, 'category', e.target.value)}
                              className={`w-full bg-[var(--surf2)] border ${!s.category ? 'border-[var(--red)]/40 focus:border-[var(--red)]' : 'border-[var(--b)] focus:border-[var(--blue)]'} rounded px-2 py-1 text-[11.5px] outline-none`}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              value={s.subject || ''}
                              onChange={(e) => updateStaffField(s.id, 'subject', e.target.value)}
                              className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded px-2 py-1 text-[11.5px] outline-none"
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              value={s.phone}
                              onChange={(e) => updateStaffField(s.id, 'phone', e.target.value)}
                              className={`w-full bg-[var(--surf2)] border ${!s.phone ? 'border-[var(--red)]/40 focus:border-[var(--red)]' : 'border-[var(--b)] focus:border-[var(--blue)]'} rounded px-2 py-1 text-[11.5px] outline-none`}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              value={s.email || ''}
                              onChange={(e) => updateStaffField(s.id, 'email', e.target.value)}
                              className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded px-2 py-1 text-[11.5px] outline-none"
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <div className="flex flex-col min-w-[120px]">
                              <input 
                                type="date"
                                value={s.join_date}
                                onChange={(e) => updateStaffField(s.id, 'join_date', e.target.value)}
                                className={`w-full bg-[var(--surf2)] border ${!s.join_date ? 'border-[var(--red)]/40 focus:border-[var(--red)]' : 'border-[var(--b)] focus:border-[var(--blue)]'} rounded px-1 py-1 text-[11px] outline-none`} 
                              />
                            </div>
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              type="number"
                              value={s.salary}
                              onChange={(e) => updateStaffField(s.id, 'salary', parseFloat(e.target.value) || 0)}
                              className={`w-full bg-[var(--surf2)] border ${s.salary <= 0 ? 'border-[var(--red)]/40 focus:border-[var(--red)]' : 'border-[var(--b)] focus:border-[var(--blue)]'} rounded px-2 py-1 text-[11.5px] outline-none`}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              value={s.qualifications || ''}
                              onChange={(e) => updateStaffField(s.id, 'qualifications', e.target.value)}
                              className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded px-2 py-1 text-[11.5px] outline-none"
                            />
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeStaff(s.id)}
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--b)] bg-[var(--surf2)]/50 flex items-center sticky bottom-0 z-10">
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

          <div className="flex items-center gap-3">
            {file && (
              <button
                onClick={() => {
                  setFile(null);
                  setMappedStaff([]);
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
            {file && mappedStaff.length > 0 && (
              <button
                onClick={handleImportSave}
                disabled={importing}
                className="px-4 py-2 bg-[var(--blue)] hover:opacity-90 text-white rounded-xl text-[12.5px] font-semibold transition-opacity disabled:opacity-70 flex items-center gap-1.5 cursor-pointer"
              >
                {importing && <Loader2 size={13} className="animate-spin" />}
                {importing ? 'Importing Staff...' : 'Save & Import Directory'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
