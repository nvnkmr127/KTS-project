import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, Upload, X, FileText, Phone, Mail, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Download } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
// @ts-ignore
import * as XLSX from 'xlsx';
// @ts-ignore
import mammoth from 'mammoth';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

export interface StaffMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  subject?: string;
  phone: string;
  email: string;
  joinDate: string;
  attendance: number;
  status: 'Active' | 'On Leave' | 'Resigned';
  salary: number;
  qualifications: string;
}

export const STAFF: StaffMember[] = [
  { id: '1', name: 'Mrs. Lakshmi Devi', designation: 'Senior Teacher', department: 'Mathematics', subject: 'Maths', phone: '9876501234', email: 'lakshmi@krishnaveni.edu', joinDate: '2015-06-01', attendance: 96, status: 'Active', salary: 62000, qualifications: 'M.Sc Mathematics, B.Ed' },
  { id: '2', name: 'Mr. Venkat Rao', designation: 'Teacher', department: 'Science', subject: 'Physics, Chemistry', phone: '9876502345', email: 'venkat@krishnaveni.edu', joinDate: '2017-06-01', attendance: 92, status: 'Active', salary: 58000, qualifications: 'M.Sc Physics, B.Ed' },
  { id: '3', name: 'Mrs. Suma Reddy', designation: 'Teacher', department: 'English', subject: 'English', phone: '9876503456', email: 'suma@krishnaveni.edu', joinDate: '2018-06-01', attendance: 88, status: 'On Leave', salary: 55000, qualifications: 'MA English, B.Ed' },
  { id: '4', name: 'Mr. Raju Sharma', designation: 'Teacher', department: 'Languages', subject: 'Telugu, Hindi', phone: '9876504567', email: 'raju@krishnaveni.edu', joinDate: '2016-06-01', attendance: 94, status: 'Active', salary: 48000, qualifications: 'MA Telugu, B.Ed' },
  { id: '5', name: 'Mrs. Savitha Kumar', designation: 'Teacher', department: 'Social Sciences', subject: 'History, Geography', phone: '9876505678', email: 'savitha@krishnaveni.edu', joinDate: '2019-06-01', attendance: 90, status: 'Active', salary: 45000, qualifications: 'MA History, B.Ed' },
  { id: '6', name: 'Mr. Prakash Nair', designation: 'Physical Education', department: 'Sports', phone: '9876506789', email: 'prakash@krishnaveni.edu', joinDate: '2020-06-01', attendance: 98, status: 'Active', salary: 40000, qualifications: 'B.P.Ed' },
  { id: '7', name: 'Mrs. Radha Krishnan', designation: 'Lab Assistant', department: 'Science', phone: '9876507890', email: 'radha@krishnaveni.edu', joinDate: '2021-06-01', attendance: 95, status: 'Active', salary: 30000, qualifications: 'B.Sc' },
];

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
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('kts_staff_members');
    return saved ? JSON.parse(saved) : STAFF;
  });

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [modal, setModal] = useState<ModalState>(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('kts_staff_members', JSON.stringify(staffList));
  }, [staffList]);

  const filtered = staffList.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.designation.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'All' || s.department === deptFilter;
    return matchSearch && matchDept;
  });

  const active = staffList.filter((s) => s.status === 'Active').length;
  const onLeave = staffList.filter((s) => s.status === 'On Leave').length;
  const totalSalary = staffList.reduce((sum, s) => sum + s.salary, 0);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nameVal = fd.get('name') as string;
    const designationVal = fd.get('designation') as string;
    const departmentVal = fd.get('department') as string;
    const subjectVal = fd.get('subject') as string;
    const phoneVal = fd.get('phone') as string;
    const emailVal = fd.get('email') as string;
    const joinDateVal = fd.get('joinDate') as string;
    const salaryVal = parseFloat(fd.get('salary') as string) || 0;
    const qualificationsVal = fd.get('qualifications') as string;

    if (modal?.type === 'add') {
      const newStaff: StaffMember = {
        id: 'staff-' + Date.now(),
        name: nameVal,
        designation: designationVal,
        department: departmentVal,
        subject: subjectVal,
        phone: phoneVal,
        email: emailVal || `${nameVal.toLowerCase().replace(/[^a-z0-9]/g, '')}@krishnaveni.edu`,
        joinDate: joinDateVal || new Date().toISOString().slice(0, 10),
        attendance: 100,
        status: 'Active',
        salary: salaryVal,
        qualifications: qualificationsVal || 'N/A',
      };
      setStaffList(prev => [newStaff, ...prev]);
    } else if (modal?.type === 'edit' && modal.staff) {
      setStaffList(prev => prev.map(s => s.id === modal.staff!.id ? {
        ...s,
        name: nameVal,
        designation: designationVal,
        department: departmentVal,
        subject: subjectVal,
        phone: phoneVal,
        email: emailVal,
        joinDate: joinDateVal,
        salary: salaryVal,
        qualifications: qualificationsVal,
      } : s));
    }
    setModal(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      setStaffList(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
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
            <button onClick={() => setModal({ type: 'add' })} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90">
              <Plus size={12} /> Add Staff
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex items-center gap-2 flex-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2">
            <Search size={13} className="text-[var(--tx3)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, department, designation..." className="flex-1 bg-transparent text-[12px] text-[var(--tx)] placeholder:text-[var(--tx3)] outline-none" />
          </div>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
            <option value="All">All Departments</option>
            {['Mathematics', 'Science', 'English', 'Languages', 'Social Sciences', 'Sports'].map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--b)]">
                {['Staff Member', 'Department', 'Contact', 'Join Date', 'Attendance', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const dc = DEPT_COLORS[s.department] ?? DEPT_COLORS.default;
                return (
                  <tr key={s.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] transition-colors last:border-0">
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)} bg={dc.bg} color={dc.color} />
                        <div>
                          <div className="font-semibold text-[var(--tx)]">{s.name}</div>
                          <div className="text-[10.5px] text-[var(--tx3)]">{s.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="font-medium text-[var(--tx)]">{s.department}</div>
                      {s.subject && <div className="text-[10.5px] text-[var(--tx3)]">{s.subject}</div>}
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-1 text-[var(--tx2)]"><Phone size={10} />{s.phone}</div>
                      <div className="flex items-center gap-1 text-[10.5px] text-[var(--tx3)]"><Mail size={9} />{s.email}</div>
                    </td>
                    <td className="px-2 py-2.5 text-[var(--tx2)]">{s.joinDate}</td>
                    <td className="px-2 py-2.5">
                      <span className={`font-semibold ${s.attendance >= 90 ? 'text-[var(--teal-tx)]' : 'text-[var(--amber-tx)]'}`}>{s.attendance}%</span>
                    </td>
                    <td className="px-2 py-2.5">
                      {s.status === 'Active' && <Badge variant="teal">Active</Badge>}
                      {s.status === 'On Leave' && <Badge variant="amber">On Leave</Badge>}
                      {s.status === 'Resigned' && <Badge variant="red">Resigned</Badge>}
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setModal({ type: 'view', staff: s })} className="p-1 rounded text-[var(--tx3)] hover:text-[var(--blue-tx)] hover:bg-[var(--blue-bg)] cursor-pointer"><Eye size={13} /></button>
                        <button onClick={() => setModal({ type: 'edit', staff: s })} className="p-1 rounded text-[var(--tx3)] hover:text-[var(--amber-tx)] hover:bg-[var(--amber-bg)] cursor-pointer"><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-1 rounded text-[var(--tx3)] hover:text-[var(--red-tx)] hover:bg-[var(--red-bg)] cursor-pointer"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {modal && modal.type !== 'view' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[540px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)] sticky top-0 bg-[var(--surf)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">{modal.type === 'add' ? 'Add New Staff' : 'Edit Staff Profile'}</div>
                <div className="text-[12px] text-[var(--tx3)]">Fill in all staff details</div>
              </div>
              <button type="button" onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Full Name *</label><input name="name" required defaultValue={modal.staff?.name} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Mrs. Lakshmi Devi" /></div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Designation *</label><input name="designation" required defaultValue={modal.staff?.designation} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Senior Teacher" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Department *</label><select name="department" defaultValue={modal.staff?.department} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"><option>Mathematics</option><option>Science</option><option>English</option><option>Languages</option><option>Social Sciences</option><option>Sports</option></select></div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Subject(s)</label><input name="subject" defaultValue={modal.staff?.subject} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Physics, Chemistry" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Phone *</label><input name="phone" required defaultValue={modal.staff?.phone} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" /></div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Email</label><input name="email" defaultValue={modal.staff?.email} type="email" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Join Date</label><input name="joinDate" type="date" defaultValue={modal.staff?.joinDate} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" /></div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Monthly Salary (₹)</label><input name="salary" type="number" defaultValue={modal.staff?.salary} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" /></div>
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Qualifications</label><input name="qualifications" defaultValue={modal.staff?.qualifications} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="M.Sc, B.Ed" /></div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Documents</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {['Aadhar Card', 'Degree Certificate', 'Experience Letter'].map((doc) => (
                    <div key={doc} className="border border-dashed border-[var(--b)] rounded-lg p-2.5 text-center cursor-pointer hover:border-[var(--blue)] transition-colors">
                      <FileText size={14} className="text-[var(--tx3)] mx-auto mb-1" />
                      <div className="text-[10.5px] text-[var(--tx3)]">{doc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer hover:opacity-90">{modal.type === 'add' ? 'Add Staff' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      )}

      {/* View Modal */}
      {modal?.type === 'view' && modal.staff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[460px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">Staff Profile</div>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-[var(--purple-bg)] flex items-center justify-center text-[18px] font-bold text-[var(--purple-tx)]">
                  {modal.staff.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="text-[15px] font-bold text-[var(--tx)]">{modal.staff.name}</div>
                  <div className="text-[12px] text-[var(--tx3)]">{modal.staff.designation} · {modal.staff.department}</div>
                  <div className="mt-1"><Badge variant={modal.staff.status === 'Active' ? 'teal' : 'amber'}>{modal.staff.status}</Badge></div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: 'Subject(s)', value: modal.staff.subject ?? 'N/A' },
                  { label: 'Join Date', value: modal.staff.joinDate },
                  { label: 'Phone', value: modal.staff.phone },
                  { label: 'Email', value: modal.staff.email },
                  { label: 'Attendance', value: `${modal.staff.attendance}%` },
                  { label: 'Monthly Salary', value: `₹${modal.staff.salary.toLocaleString()}` },
                ].map((item) => (
                  <div key={item.label} className="bg-[var(--surf2)] rounded-xl p-3">
                    <div className="text-[10.5px] text-[var(--tx3)] mb-0.5">{item.label}</div>
                    <div className="text-[12.5px] font-semibold text-[var(--tx)]">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 bg-[var(--surf2)] rounded-xl p-3">
                <div className="text-[10.5px] text-[var(--tx3)] mb-0.5">Qualifications</div>
                <div className="text-[12.5px] font-semibold text-[var(--tx)]">{modal.staff.qualifications}</div>
              </div>
            </div>
            <div className="p-5 pt-0">
              <button onClick={() => setModal(null)} className="w-full py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] cursor-pointer">Close</button>
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
    </div>
  );
}

interface StaffImportModalProps {
  onClose: () => void;
  onImportSuccess: (newStaff: StaffMember[]) => void;
}

const STAFF_SYNONYMS: Record<string, string[]> = {
  name: ['full name', 'name', 'staff name', 'staff_name', 'employee name', 'employee_name', 'teacher name', 'teacher_name'],
  designation: ['designation', 'role', 'job title', 'job_title', 'position'],
  department: ['department', 'dept'],
  subject: ['subject', 'subjects', 'subject(s)', 'specialization'],
  phone: ['mobile number', 'mobile', 'phone', 'phone number', 'contact', 'mobile_no', 'phone_no'],
  email: ['email', 'email address', 'email_address', 'mail'],
  joinDate: ['join date', 'joining date', 'join_date', 'date of joining', 'doj'],
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
  if (!s.joinDate || !/^\d{4}-\d{2}-\d{2}$/.test(s.joinDate)) errors.push('Valid Join Date required (YYYY-MM-DD)');
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
          const rawSubject = colMap.subject !== undefined ? row[colMap.subject] : '';
          const rawPhone = colMap.phone !== undefined ? row[colMap.phone] : '';
          const rawEmail = colMap.email !== undefined ? row[colMap.email] : '';
          const rawJoinDate = colMap.joinDate !== undefined ? row[colMap.joinDate] : '';
          const rawSalary = colMap.salary !== undefined ? row[colMap.salary] : 0;
          const rawQualifications = colMap.qualifications !== undefined ? row[colMap.qualifications] : '';

          const nameVal = rawName ? String(rawName).trim() : 'N/A';
          return {
            id: 'staff-' + Math.random().toString(36).substr(2, 9),
            name: nameVal,
            designation: rawDesignation ? String(rawDesignation).trim() : 'Teacher',
            department: cleanDepartment(rawDepartment),
            subject: rawSubject ? String(rawSubject).trim() : '',
            phone: rawPhone ? String(rawPhone).trim() : 'N/A',
            email: rawEmail ? String(rawEmail).trim() : `${nameVal.toLowerCase().replace(/[^a-z0-9]/g, '')}@krishnaveni.edu`,
            joinDate: cleanDate(rawJoinDate) || new Date().toISOString().slice(0, 10),
            attendance: 100,
            status: 'Active',
            salary: parseFloat(String(rawSalary)) || 35000,
            qualifications: rawQualifications ? String(rawQualifications).trim() : 'B.Ed',
          } as StaffMember;
        })
        .filter((s): s is StaffMember => s !== null);

      setMappedStaff(staffList);
      setFile(selectedFile);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to parse file. Please verify format.');
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
      subject: '',
      phone: '',
      email: '',
      joinDate: new Date().toISOString().slice(0, 10),
      attendance: 100,
      status: 'Active',
      salary: 35000,
      qualifications: 'B.Ed',
    };
    setMappedStaff(prev => [...prev, newStaff]);
  };

  const handleImportSave = () => {
    setImporting(true);
    setError('');

    const invalidStaff = mappedStaff.filter(s => validateStaff(s).length > 0);
    if (invalidStaff.length > 0) {
      setError(`Please fix all validation errors before importing. (${invalidStaff.length} rows contain errors)`);
      setImporting(false);
      return;
    }

    onImportSuccess(mappedStaff);
    setSuccessCount(mappedStaff.length);
    setImporting(false);
  };

  const SAMPLE_HEADERS = [
    'Full Name', 'Designation', 'Department', 'Subject(s)', 'Phone',
    'Email', 'Join Date', 'Monthly Salary', 'Qualifications'
  ];
  const SAMPLE_ROWS = [
    ['Mr. V. Suresh', 'Social Studies Teacher', 'Social Sciences', 'History, Civics', '9876543210', 'suresh@krishnaveni.edu', '2020-06-01', '35000', 'M.A., B.Ed'],
    ['Mrs. Lakshmi Devi', 'Senior Teacher', 'Mathematics', 'Maths', '9876501234', 'lakshmi@krishnaveni.edu', '2015-06-01', '62000', 'M.Sc, B.Ed'],
  ];

  const downloadTemplate = (format: 'xlsx' | 'csv') => {
    if (format === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet([SAMPLE_HEADERS, ...SAMPLE_ROWS]);
      ws['!cols'] = SAMPLE_HEADERS.map(() => ({ wch: 20 }));
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
                    { n: '4', label: 'Subject(s)', req: false },
                    { n: '5', label: 'Phone', req: true },
                    { n: '6', label: 'Email', req: false },
                    { n: '7', label: 'Join Date', req: true },
                    { n: '8', label: 'Monthly Salary', req: true },
                    { n: '9', label: 'Qualifications', req: false },
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
                    {['Mr. V. Suresh', 'Social Studies Teacher', 'Social Sciences', 'History', '9876543210', 'suresh@edu.com', '2020-06-01', '35000', 'M.A., B.Ed'].map((v, i) => (
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
                            <input
                              type="date"
                              value={s.joinDate}
                              onChange={(e) => updateStaffField(s.id, 'joinDate', e.target.value)}
                              className={`w-full bg-[var(--surf2)] border ${!s.joinDate ? 'border-[var(--red)]/40 focus:border-[var(--red)]' : 'border-[var(--b)] focus:border-[var(--blue)]'} rounded px-1 py-1 text-[11px] outline-none`}
                            />
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
