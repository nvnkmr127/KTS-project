import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { BadgeIcon, CheckCircle, XCircle, Wallet, Lock, Plus, Loader2, Edit2, Trash2, X, Search } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
import { api } from '../services/api';

interface FacultyMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  init: string;
  subject: string;
  classes: string;
  designation: string;
  att: number;
  present: boolean;
}

const salaryData = [
  { dept: 'Science', amt: 62 },
  { dept: 'Maths', amt: 58 },
  { dept: 'English', amt: 55 },
  { dept: 'Telugu', amt: 48 },
  { dept: 'Social', amt: 45 },
];

const barColors = ['var(--purple)', 'var(--blue)', 'var(--teal)', 'var(--amber)', 'var(--coral)'];

const CustomBar = (props: any) => {
  const { x, y, width, height, index } = props;
  return <rect x={x} y={y} width={width} height={height} fill={barColors[index] || 'var(--blue)'} rx={4} />;
};

const tooltipStyle = {
  backgroundColor: 'var(--surf)',
  border: '0.5px solid var(--b2)',
  borderRadius: 8,
  fontSize: 11,
  color: 'var(--tx)',
};

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Telugu', 'Hindi', 'Social Studies', 'Physical Education', 'Computer Science', 'Art', 'Music', 'Library'];
const DESIGNATIONS = ['Senior Teacher', 'Teacher', 'PT Teacher', 'Librarian', 'Head of Dept'];

export function Faculty() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<FacultyMember | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadFaculty = async () => {
    setLoading(true);
    try {
      const users = await api.getResources('faculty');
      const mapped = users.map((u: any) => {
        const initials = collectInitials(u.name);
        return {
          id: String(u.id),
          name: u.name,
          email: u.email || '',
          phone: u.phone || '',
          init: initials,
          subject: u.subject || 'Academics',
          classes: Array.isArray(u.classes) ? u.classes.join(', ') : u.classes || 'N/A',
          designation: u.department || 'Teacher',
          att: u.attendance_percentage || 95,
          present: u.is_present ?? true,
        };
      });
      setFaculty(mapped);
    } catch (err) {
      console.error('Error loading faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, []);

  const collectInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const firstName = fd.get('firstName') as string;
    const lastName = fd.get('lastName') as string;
    const data: any = {
      name: `${firstName} ${lastName}`,
      email: fd.get('email'),
      phone: fd.get('phone'),
      department: fd.get('designation'),
      subject: fd.get('subject'),
      status: 'active',
    };

    if (modal === 'add') {
      data.password = fd.get('password') || 'password';
    }

    try {
      if (modal === 'add') {
        await api.createResource('faculty', data);
      } else if (modal === 'edit' && selected) {
        await api.updateResource('faculty', selected.id, data);
      }
      setModal(null);
      loadFaculty();
    } catch (err) {
      console.error('Error saving faculty member:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.deleteResource('faculty', deleteConfirmId);
      setDeleteConfirmId(null);
      loadFaculty();
    } catch (err) {
      console.error('Error deleting faculty:', err);
    }
  };

  const filtered = faculty.filter((f) => {
    return (
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.subject.toLowerCase().includes(search.toLowerCase()) ||
      f.designation.toLowerCase().includes(search.toLowerCase())
    );
  });

  const presentCount = faculty.filter((f) => f.present).length;
  const absentCount = faculty.filter((f) => !f.present).length;

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard
          label="Total Faculty"
          value={faculty.length}
          sub="All departments"
          icon={<BadgeIcon size={15} />}
          iconBg="var(--purple-bg)"
          iconColor="var(--purple-tx)"
        />
        <KPICard
          label="Present Today"
          value={presentCount}
          sub=""
          icon={<CheckCircle size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
          trend={{ direction: 'up', label: faculty.length ? `${Math.round((presentCount / faculty.length) * 100)}%` : '0%' }}
        />
        <KPICard
          label="Absent Today"
          value={absentCount}
          sub="On approved leave"
          icon={<XCircle size={15} />}
          iconBg="var(--red-bg)"
          iconColor="var(--red-tx)"
        />
        <KPICard
          label="Monthly Payroll"
          value="₹3.8L"
          sub="Due end of month"
          icon={<Wallet size={15} />}
          iconBg="var(--amber-bg)"
          iconColor="var(--amber-tx)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12.5px] font-semibold text-[var(--tx)] flex items-center gap-2">
              Faculty List {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
            </div>
            <button
              onClick={() => { setSelected(null); setModal('add'); }}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-[var(--blue)] text-white rounded-lg hover:opacity-90 cursor-pointer"
            >
              <Plus size={11} /> Add Faculty
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 mb-3 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5">
            <Search size={12} className="text-[var(--tx3)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search faculty by name, subject, designation..."
              className="flex-1 bg-transparent text-[11.5px] text-[var(--tx)] placeholder:text-[var(--tx3)] outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px] min-w-[450px]">
              <thead>
                <tr>
                  {['Name', 'Subject', 'Class', 'Designation', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-1.5 border-b border-[var(--b)] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-[var(--surf2)] transition-colors">
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar initials={f.init} bg="var(--purple-bg)" color="var(--purple-tx)" />
                        <div>
                          <span className="font-medium text-[var(--tx)] whitespace-nowrap">{f.name}</span>
                          <div className="text-[10px] text-[var(--tx3)]">{f.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-[var(--tx2)] whitespace-nowrap">{f.subject}</td>
                    <td className="px-2 py-2 text-[var(--tx2)] whitespace-nowrap">{f.classes}</td>
                    <td className="px-2 py-2 text-[var(--tx2)] whitespace-nowrap">{f.designation}</td>
                    <td className="px-2 py-2">
                      {f.present ? <Badge variant="teal">Present</Badge> : <Badge variant="red">Absent</Badge>}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setSelected(f); setModal('edit'); }}
                          className="p-1 rounded text-[var(--tx3)] hover:text-[var(--amber-tx)] hover:bg-[var(--amber-bg)] transition-colors cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(f.id)}
                          className="p-1 rounded text-[var(--tx3)] hover:text-[var(--red-tx)] hover:bg-[var(--red-bg)] transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12.5px] font-semibold text-[var(--tx)]">Payroll Summary</div>
            <Badge variant="gray">Admin only</Badge>
          </div>

          <div className="h-[148px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salaryData}
                layout="vertical"
                barSize={14}
                margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke="var(--b)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: 'var(--tx3)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}k`}
                />
                <YAxis
                  dataKey="dept"
                  type="category"
                  tick={{ fontSize: 10, fill: 'var(--tx3)' }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${v}k`, 'Salary']} cursor={{ fill: 'var(--surf2)' }} />
                <Bar dataKey="amt" radius={[0, 4, 4, 0]} shape={<CustomBar />} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 p-2.5 bg-[var(--amber-bg)] rounded-xl flex items-center gap-2">
            <Lock size={14} className="text-[var(--amber-tx)] flex-shrink-0" />
            <span className="text-[11.5px] text-[var(--amber-tx)]">
              Salary details visible to admin & principal only
            </span>
          </div>
        </Card>
      </div>

      {/* Add / Edit Faculty Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[500px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)] sticky top-0 bg-[var(--surf)] z-10">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">
                  {modal === 'add' ? 'Add New Faculty Member' : 'Edit Faculty Details'}
                </div>
                <div className="text-[12px] text-[var(--tx3)]">Fill in the teacher's profile details</div>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">First Name *</label>
                  <input
                    name="firstName"
                    required
                    defaultValue={selected?.name.split(' ')[0] ?? ''}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                    placeholder="Lakshmi"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Last Name *</label>
                  <input
                    name="lastName"
                    required
                    defaultValue={selected?.name.split(' ').slice(1).join(' ') ?? ''}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                    placeholder="Devi"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={selected?.email ?? ''}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  placeholder="teacher@krishnaveni.edu"
                />
              </div>
              {modal === 'add' && (
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Password *</label>
                  <input
                    type="password"
                    name="password"
                    required
                    defaultValue="password"
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Primary Subject *</label>
                  <select
                    name="subject"
                    defaultValue={selected?.subject ?? 'Mathematics'}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Designation *</label>
                  <select
                    name="designation"
                    defaultValue={selected?.designation ?? 'Teacher'}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                  >
                    {DESIGNATIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Phone Number</label>
                <input
                  name="phone"
                  defaultValue={selected?.phone ?? ''}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  placeholder="9876543210"
                />
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold hover:opacity-90 cursor-pointer"
              >
                {modal === 'add' ? 'Add Teacher' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-955/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-base font-bold text-[var(--tx)] mb-2">Delete Teacher</h3>
              <p className="text-xs text-[var(--tx3)] mb-6">Are you sure you want to delete this teacher? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl text-[12px] font-semibold hover:bg-red-700 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
