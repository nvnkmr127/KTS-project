import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, Upload, X, FileText, Phone, Mail } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';

interface StaffMember {
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
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [modal, setModal] = useState<ModalState>(null);

  const filtered = STAFF.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.designation.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'All' || s.department === deptFilter;
    return matchSearch && matchDept;
  });

  const active = STAFF.filter((s) => s.status === 'Active').length;
  const onLeave = STAFF.filter((s) => s.status === 'On Leave').length;
  const totalSalary = STAFF.reduce((sum, s) => sum + s.salary, 0);

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="Total Staff" value={STAFF.length} sub="All departments" icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} iconBg="var(--purple-bg)" iconColor="var(--purple-tx)" />
        <KPICard label="Active Staff" value={active} sub="Present this month" icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="On Leave" value={onLeave} sub="Approved leaves" icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
        <KPICard label="Total Payroll" value={`₹${(totalSalary / 100000).toFixed(1)}L`} sub="Per month" icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[13px] font-semibold text-[var(--tx)]">Staff Directory</div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg cursor-pointer hover:bg-[var(--surf3)]">
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
                        <button className="p-1 rounded text-[var(--tx3)] hover:text-[var(--red-tx)] hover:bg-[var(--red-bg)] cursor-pointer"><Trash2 size={13} /></button>
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
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[540px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)] sticky top-0 bg-[var(--surf)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">{modal.type === 'add' ? 'Add New Staff' : 'Edit Staff Profile'}</div>
                <div className="text-[12px] text-[var(--tx3)]">Fill in all staff details</div>
              </div>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Full Name *</label><input defaultValue={modal.staff?.name} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Mrs. Lakshmi Devi" /></div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Designation *</label><input defaultValue={modal.staff?.designation} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Senior Teacher" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Department *</label><select defaultValue={modal.staff?.department} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"><option>Mathematics</option><option>Science</option><option>English</option><option>Languages</option><option>Social Sciences</option><option>Sports</option></select></div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Subject(s)</label><input defaultValue={modal.staff?.subject} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Physics, Chemistry" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Phone *</label><input defaultValue={modal.staff?.phone} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" /></div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Email</label><input defaultValue={modal.staff?.email} type="email" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Join Date</label><input type="date" defaultValue={modal.staff?.joinDate} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" /></div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Monthly Salary (₹)</label><input type="number" defaultValue={modal.staff?.salary} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" /></div>
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Qualifications</label><input defaultValue={modal.staff?.qualifications} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="M.Sc, B.Ed" /></div>
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
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] cursor-pointer">Cancel</button>
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer hover:opacity-90">{modal.type === 'add' ? 'Add Staff' : 'Save Changes'}</button>
            </div>
          </div>
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
    </div>
  );
}
