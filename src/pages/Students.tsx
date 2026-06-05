import { useState } from 'react';
import {
  Search, Plus, Upload, UserCheck, GraduationCap,
  Phone, Edit2, Trash2, Eye, X,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
import { KPICard } from '../components/KPICard';

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
}

const STUDENTS: Student[] = [
  { id: '1', name: 'Arjun Reddy', roll: '8B-001', class: '8', section: 'B', gender: 'Male', dob: '2012-04-15', parent: 'Ravi Reddy', phone: '9876543210', address: 'Railway Colony, Nizamabad', status: 'Active', admissionDate: '2020-06-01', feeStatus: 'Paid' },
  { id: '2', name: 'Priya Sharma', roll: '8A-002', class: '8', section: 'A', gender: 'Female', dob: '2011-09-22', parent: 'Suresh Sharma', phone: '9845671234', address: 'Gandhi Nagar, Nizamabad', status: 'Active', admissionDate: '2019-06-01', feeStatus: 'Paid' },
  { id: '3', name: 'Ravi Kumar', roll: '9A-003', class: '9', section: 'A', gender: 'Male', dob: '2010-11-08', parent: 'Ramesh Kumar', phone: '9712345678', address: 'Bus Stand Area, Nizamabad', status: 'Active', admissionDate: '2018-06-01', feeStatus: 'Partial' },
  { id: '4', name: 'Meena Nair', roll: '7B-004', class: '7', section: 'B', gender: 'Female', dob: '2013-02-14', parent: 'Gopal Nair', phone: '9654321098', address: 'Old Town, Nizamabad', status: 'Active', admissionDate: '2021-06-01', feeStatus: 'Unpaid' },
  { id: '5', name: 'Suresh K', roll: '10A-005', class: '10', section: 'A', gender: 'Male', dob: '2009-07-30', parent: 'Krishnamurthy K', phone: '9543219876', address: 'Market Circle, Nizamabad', status: 'Active', admissionDate: '2017-06-01', feeStatus: 'Paid' },
  { id: '6', name: 'Divya Lakshmi', roll: '6A-006', class: '6', section: 'A', gender: 'Female', dob: '2014-03-18', parent: 'Venkat Rao', phone: '9432198765', address: 'New Colony, Nizamabad', status: 'Active', admissionDate: '2022-06-01', feeStatus: 'Paid' },
  { id: '7', name: 'Mohammed Farid', roll: '9B-007', class: '9', section: 'B', gender: 'Male', dob: '2010-12-05', parent: 'Ahmed Farid', phone: '9321987654', address: 'Nizamabad Old City', status: 'Active', admissionDate: '2018-06-01', feeStatus: 'Partial' },
  { id: '8', name: 'Ananya Singh', roll: '8A-008', class: '8', section: 'A', gender: 'Female', dob: '2012-06-25', parent: 'Rajesh Singh', phone: '9210987654', address: 'Yellareddyguda, Nizamabad', status: 'Active', admissionDate: '2020-06-01', feeStatus: 'Paid' },
];

const INITIALS_COLORS: Record<string, { bg: string; color: string }> = {
  M: { bg: 'var(--blue-bg)', color: 'var(--blue-tx)' },
  F: { bg: 'var(--pink-bg)', color: 'var(--pink-tx)' },
};

type ModalType = 'add' | 'view' | 'edit' | null;

export function Students() {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Student | null>(null);

  const filtered = STUDENTS.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.roll.toLowerCase().includes(search.toLowerCase()) ||
      s.parent.toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === 'All' || s.class === classFilter;
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchClass && matchStatus;
  });

  const activeCount = STUDENTS.filter((s) => s.status === 'Active').length;
  const maleCount = STUDENTS.filter((s) => s.gender === 'Male').length;
  const femaleCount = STUDENTS.filter((s) => s.gender === 'Female').length;

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="Total Students" value={STUDENTS.length} sub="This academic year" icon={<GraduationCap size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Active Students" value={activeCount} sub="Currently enrolled" icon={<UserCheck size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Boys / Girls" value={<>{maleCount}<span className="text-[13px] font-normal text-[var(--tx3)]">/{femaleCount}</span></>} sub="Gender distribution" icon={<GraduationCap size={15} />} iconBg="var(--purple-bg)" iconColor="var(--purple-tx)" />
        <KPICard label="New Admissions" value="12" sub="This term" icon={<Plus size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" trend={{ direction: 'up', label: '+12' }} />
      </div>

      <Card>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-[13px] font-semibold text-[var(--tx)]">Student Directory</div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer">
              <Upload size={12} /> Import
            </button>
            <button
              onClick={() => setModal('add')}
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
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
            {['All', '6', '7', '8', '9', '10'].map((c) => <option key={c}>{c === 'All' ? 'All Classes' : `Class ${c}`}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
            {['All', 'Active', 'Transferred', 'Left'].map((s) => <option key={s}>{s === 'All' ? 'All Status' : s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--b)]">
                {['Student', 'Roll No', 'Class', 'Parent / Guardian', 'Phone', 'Fee Status', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] transition-colors last:border-0">
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={s.name.slice(0, 2).toUpperCase()} bg={INITIALS_COLORS[s.gender === 'Male' ? 'M' : 'F'].bg} color={INITIALS_COLORS[s.gender === 'Male' ? 'M' : 'F'].color} />
                      <div>
                        <div className="font-semibold text-[var(--tx)]">{s.name}</div>
                        <div className="text-[10.5px] text-[var(--tx3)]">{s.gender} · DOB {s.dob}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 font-mono text-[11px] text-[var(--tx2)]">{s.roll}</td>
                  <td className="px-2 py-2.5 text-[var(--tx2)]">Class {s.class} — {s.section}</td>
                  <td className="px-2 py-2.5">
                    <div className="font-medium text-[var(--tx)]">{s.parent}</div>
                    <div className="text-[10.5px] text-[var(--tx3)] flex items-center gap-1"><Phone size={9} />{s.phone}</div>
                  </td>
                  <td className="px-2 py-2.5 text-[var(--tx2)]">{s.phone}</td>
                  <td className="px-2 py-2.5">
                    {s.feeStatus === 'Paid' && <Badge variant="teal">Paid</Badge>}
                    {s.feeStatus === 'Partial' && <Badge variant="amber">Partial</Badge>}
                    {s.feeStatus === 'Unpaid' && <Badge variant="red">Unpaid</Badge>}
                  </td>
                  <td className="px-2 py-2.5">
                    {s.status === 'Active' && <Badge variant="green">Active</Badge>}
                    {s.status === 'Transferred' && <Badge variant="blue">Transferred</Badge>}
                    {s.status === 'Left' && <Badge variant="gray">Left</Badge>}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { setSelected(s); setModal('view'); }} className="p-1 rounded text-[var(--tx3)] hover:text-[var(--blue-tx)] hover:bg-[var(--blue-bg)] transition-colors cursor-pointer"><Eye size={13} /></button>
                      <button onClick={() => { setSelected(s); setModal('edit'); }} className="p-1 rounded text-[var(--tx3)] hover:text-[var(--amber-tx)] hover:bg-[var(--amber-bg)] transition-colors cursor-pointer"><Edit2 size={13} /></button>
                      <button className="p-1 rounded text-[var(--tx3)] hover:text-[var(--red-tx)] hover:bg-[var(--red-bg)] transition-colors cursor-pointer"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 pt-3 border-t border-[var(--b)] flex items-center justify-between text-[11px] text-[var(--tx3)]">
          <span>Showing {filtered.length} of {STUDENTS.length} students</span>
          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1 border border-[var(--b)] rounded-lg hover:bg-[var(--surf2)] cursor-pointer">Previous</button>
            <span className="px-2.5 py-1 bg-[var(--blue)] text-white rounded-lg">1</span>
            <button className="px-2.5 py-1 border border-[var(--b)] rounded-lg hover:bg-[var(--surf2)] cursor-pointer">Next</button>
          </div>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)] sticky top-0 bg-[var(--surf)] z-10">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">{modal === 'add' ? 'Add New Student' : 'Edit Student'}</div>
                <div className="text-[12px] text-[var(--tx3)]">Fill in all required student details</div>
              </div>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">First Name *</label>
                  <input defaultValue={selected?.name.split(' ')[0] ?? ''} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Arjun" />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Last Name *</label>
                  <input defaultValue={selected?.name.split(' ').slice(1).join(' ') ?? ''} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Reddy" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class *</label>
                  <select defaultValue={selected?.class} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]">
                    {['6','7','8','9','10'].map((c) => <option key={c}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Section *</label>
                  <select defaultValue={selected?.section} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]">
                    {['A','B','C'].map((s) => <option key={s}>Section {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Gender *</label>
                  <select defaultValue={selected?.gender} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]">
                    <option>Male</option><option>Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Date of Birth *</label>
                  <input type="date" defaultValue={selected?.dob} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Admission Date</label>
                  <input type="date" defaultValue={selected?.admissionDate} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>
              <div className="border-t border-[var(--b)] pt-4">
                <div className="text-[12px] font-semibold text-[var(--tx)] mb-3">Parent / Guardian Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Parent Name *</label>
                    <input defaultValue={selected?.parent} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Father/Mother name" />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Mobile Number *</label>
                    <input defaultValue={selected?.phone} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="9876543210" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Address</label>
                <textarea defaultValue={selected?.address} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] resize-none" rows={2} placeholder="House no, Street, Area, City" />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Photo Upload</label>
                <div className="border-2 border-dashed border-[var(--b)] rounded-lg p-4 text-center cursor-pointer hover:border-[var(--blue)] transition-colors">
                  <Upload size={18} className="text-[var(--tx3)] mx-auto mb-1" />
                  <div className="text-[11.5px] text-[var(--tx3)]">Click to upload student photo</div>
                  <div className="text-[11px] text-[var(--tx3)]/70 mt-0.5">JPG, PNG up to 2MB</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer">Cancel</button>
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold hover:opacity-90 cursor-pointer">
                {modal === 'add' ? 'Add Student' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modal === 'view' && selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[480px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">Student Profile</div>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"><X size={16} /></button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-[var(--blue-bg)] flex items-center justify-center text-[18px] font-bold text-[var(--blue-tx)]">
                  {selected.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-[15px] font-bold text-[var(--tx)]">{selected.name}</div>
                  <div className="text-[12px] text-[var(--tx3)]">Roll No: {selected.roll}</div>
                  <div className="mt-1"><Badge variant={selected.status === 'Active' ? 'green' : 'gray'}>{selected.status}</Badge></div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Class & Section', value: `Class ${selected.class} — Section ${selected.section}` },
                  { label: 'Gender', value: selected.gender },
                  { label: 'Date of Birth', value: selected.dob },
                  { label: 'Admission Date', value: selected.admissionDate },
                  { label: 'Parent / Guardian', value: selected.parent },
                  { label: 'Mobile', value: selected.phone },
                ].map((item) => (
                  <div key={item.label} className="bg-[var(--surf2)] rounded-xl p-3">
                    <div className="text-[10.5px] text-[var(--tx3)] mb-0.5">{item.label}</div>
                    <div className="text-[12.5px] font-semibold text-[var(--tx)]">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-[var(--surf2)] rounded-xl p-3">
                <div className="text-[10.5px] text-[var(--tx3)] mb-0.5">Address</div>
                <div className="text-[12.5px] font-semibold text-[var(--tx)]">{selected.address}</div>
              </div>
              <div className="mt-3 flex gap-2">
                <div className="flex-1 bg-[var(--surf2)] rounded-xl p-3 text-center">
                  <div className="text-[10.5px] text-[var(--tx3)] mb-0.5">Fee Status</div>
                  {selected.feeStatus === 'Paid' && <Badge variant="teal">Paid</Badge>}
                  {selected.feeStatus === 'Partial' && <Badge variant="amber">Partial</Badge>}
                  {selected.feeStatus === 'Unpaid' && <Badge variant="red">Unpaid</Badge>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => { setModal('edit'); }} className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold hover:opacity-90 cursor-pointer">Edit Profile</button>
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
