import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { BadgeIcon, CheckCircle, XCircle, Wallet, Lock, Plus, Loader2, Edit2, Trash2, X, Search, CheckCircle2, FileText } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
import { api } from '../services/api';
import { STAFF, StaffMember } from './StaffManagement';
import { useApp } from '../context/AppContext';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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



export function Faculty() {
  const { timetable } = useApp();
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<FacultyMember | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const saveSettingToDb = async (key: string, value: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const settings = await api.getResources('settings');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = settings.find((s: any) => s.key === key);
      if (existing) {
        await api.updateResource('settings', existing.id, { key, value });
      } else {
        await api.createResource('settings', { key, value, group: 'general', type: 'json', is_public: false, is_encrypted: false });
      }
    } catch (err) {
      console.error(`Error saving setting ${key} to DB:`, err);
    }
  };

  const [customDocs, setCustomDocs] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const getTeacherClasses = (teacherName: string, teacherId: string) => {
    const assignedClasses = new Set<string>();
    try {
      Object.entries(timetable || {}).forEach(([className, days]) => {
        Object.values(days || {}).forEach((periods) => {
          Object.values(periods || {}).forEach((period) => {
            if (period && (String(period.teacherId) === String(teacherId) || period.teacher.toLowerCase() === teacherName.toLowerCase())) {
              assignedClasses.add(className);
            }
          });
        });
      });
    } catch (err) {
      console.error('Error parsing timetable classes:', err);
    }
    return assignedClasses.size > 0 ? Array.from(assignedClasses).join(', ') : 'N/A';
  };

  const normalizeName = (name: string) => {
    if (!name || typeof name !== 'string') return '';
    return name
      .toLowerCase()
      .replace(/^(mr|mrs|ms|dr)\.?\s+/i, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  const loadFaculty = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let currentStaffList: any[] = [];
      try {
        const savedStaffStr = localStorage.getItem('kts_staff_members');
        if (savedStaffStr) {
          const parsed = JSON.parse(savedStaffStr);
          if (Array.isArray(parsed)) {
            currentStaffList = parsed;
          } else {
            currentStaffList = STAFF;
          }
        } else {
          currentStaffList = STAFF;
        }
      } catch (err) {
        console.error('Error parsing kts_staff_members from localStorage:', err);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currentStaffList = STAFF;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teachingStaff = currentStaffList.filter((s: any) => {
        const cat = (s.category || 'Teaching').toString().trim().toLowerCase();
        const desig = (s.designation || '').toString().trim().toLowerCase();
        if (cat === 'non-teaching' || cat.includes('non-teach')) {
          return false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        return cat === 'teaching' || cat.includes('teach') || desig.includes('teacher');
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedLocal: FacultyMember[] = teachingStaff.map((s: any) => {
        return {
          id: String(s.id),
          name: s.name,
          email: s.email || '',
          phone: s.phone || '',
          init: collectInitials(s.name),
          subject: s.subject || 'Academics',
          classes: getTeacherClasses(s.name, String(s.id)),
          designation: s.designation || 'Teacher',
          att: s.attendance || 95,
          present: s.status === 'Active',
        };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      });

      let mappedApi: FacultyMember[] = [];
      try {
        const users = await api.getResources('faculty');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mappedApi = users.map((u: any) => {
          const initials = collectInitials(u.name);
          return {
            id: String(u.id),
            name: u.name,
            email: u.email || '',
            phone: u.phone || '',
            init: initials,
            subject: u.subject || 'Academics',
            classes: getTeacherClasses(u.name, String(u.id)),
            designation: u.department || 'Teacher',
            att: u.attendance_percentage || 95,
            present: u.is_present ?? true,
          };
        });
      } catch (apiErr) {
        console.error('Error loading faculty from API:', apiErr);
      }

      const uniqueApi = mappedApi.filter(
        (am) => !mappedLocal.some((lm) => {
          const normLm = normalizeName(lm.name);
          const normAm = normalizeName(am.name);
          return normLm === normAm || String(lm.id) === String(am.id);
        })
      );

      setFaculty([...mappedLocal, ...uniqueApi]);
    } catch (err) {
      console.error('Error loading faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timetable]);

  useEffect(() => {
    if (modal === 'edit' && selected) {
      try {
        const savedStaffStr = localStorage.getItem('kts_staff_members');
        if (savedStaffStr) {
          const parsed = JSON.parse(savedStaffStr);
          if (Array.isArray(parsed)) {
            const selectedStaff = parsed.find(
              (s) => String(s.id) === String(selected.id) || s.name.toLowerCase() === selected.name.toLowerCase()
            );
            if (selectedStaff) {
              const standardDocs = ['Aadhar Card', 'Degree Certificate', 'Experience Letter'];
              const staffDocs = selectedStaff.documents || [];
              const customOnes = staffDocs.filter((d: string) => !standardDocs.includes(d));
              setCustomDocs(customOnes);
              return;
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    setCustomDocs([]);
    setUploadedFiles({});
  }, [modal, selected]);

  const collectInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'SM';
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fullName = (fd.get('name') as string) || '';
    const email = (fd.get('email') as string) || '';
    const phone = (fd.get('phone') as string) || '';
    const designation = (fd.get('designation') as string) || 'Teacher';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const department = (fd.get('department') as string) || 'Mathematics';
    const subject = (fd.get('subject') as string) || 'Mathematics';
    const joinDate = (fd.get('joinDate') as string) || new Date().toISOString().slice(0, 10);
    const salary = Number(fd.get('salary')) || 45000;
    const qualifications = (fd.get('qualifications') as string) || 'B.Ed';
    const password = (fd.get('password') as string) || 'password';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      name: fullName,
      email: email,
      phone: phone,
      department: department,
      subject: subject,
      status: 'active',
      password: password,
    };

    let savedId = 'staff-' + Date.now();

    try {
      if (modal === 'add') {
        const res = await api.createResource('faculty', data);
        if (res && res.id) {
          savedId = String(res.id);
        }
      } else if (modal === 'edit' && selected) {
        await api.updateResource('faculty', selected.id, data);
        savedId = selected.id;
      }
    } catch (err) {
      console.error('Error saving faculty member to API:', err);
    }

    try {
      const savedStaffStr = localStorage.getItem('kts_staff_members');
      const currentStaffList: StaffMember[] = savedStaffStr ? JSON.parse(savedStaffStr) : [...STAFF];

      const documentsVal = [
        'Aadhar Card',
        'Degree Certificate',
        'Experience Letter',
        ...customDocs
      ];

      if (modal === 'add') {
        const newStaff: StaffMember = {
          id: savedId,
          name: fullName,
          designation: designation,
          department: department,
          category: 'Teaching',
          subject: subject,
          phone: phone,
          email: email,
          joinDate: joinDate,
          attendance: 100,
          status: 'Active',
          salary: salary,
          qualifications: qualifications,
          documents: documentsVal,
        };
        currentStaffList.unshift(newStaff);
      } else if (modal === 'edit' && selected) {
        const idx = currentStaffList.findIndex((s) => String(s.id) === String(selected.id) || s.name.toLowerCase() === selected.name.toLowerCase());
        if (idx !== -1) {
          currentStaffList[idx] = {
            ...currentStaffList[idx],
            id: savedId,
            name: fullName,
            email: email,
            phone: phone,
            designation: designation,
            department: department,
            subject: subject,
            joinDate: joinDate,
            salary: salary,
            qualifications: qualifications,
            documents: documentsVal,
          };
        } else {
          const newStaff: StaffMember = {
            id: savedId,
            name: fullName,
            designation: designation,
            department: department,
            category: 'Teaching',
            subject: subject,
            phone: phone,
            email: email,
            joinDate: joinDate,
            attendance: selected.att,
            status: selected.present ? 'Active' : 'On Leave',
            salary: salary,
            qualifications: qualifications,
            documents: documentsVal,
          };
          currentStaffList.unshift(newStaff);
        }
      }
      localStorage.setItem('kts_staff_members', JSON.stringify(currentStaffList));
      saveSettingToDb('kts_staff_members', JSON.stringify(currentStaffList));

      // Save credentials to kts_staff_access so it shows up in Staff Access tab
      const savedAccessStr = localStorage.getItem('kts_staff_access');
      const accessRecords = savedAccessStr ? JSON.parse(savedAccessStr) : {};
      accessRecords[savedId] = {
        staffId: savedId,
        email: email,
        isActive: true,
        hasAccess: true,
      };
      localStorage.setItem('kts_staff_access', JSON.stringify(accessRecords));

    } catch (err) {
      console.error('Error saving faculty member to localStorage:', err);
    }

    setModal(null);
    loadFaculty();
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.deleteResource('faculty', deleteConfirmId);
    } catch (err) {
      console.error('Error deleting faculty from API:', err);
    }

    try {
      const savedStaffStr = localStorage.getItem('kts_staff_members');
      if (savedStaffStr) {
        const currentStaffList: StaffMember[] = JSON.parse(savedStaffStr);
        const selectedToDelete = faculty.find(f => f.id === deleteConfirmId);
        const filtered = currentStaffList.filter((s) => {
          if (String(s.id) === String(deleteConfirmId)) return false;
          if (selectedToDelete && s.name.toLowerCase() === selectedToDelete.name.toLowerCase()) return false;
          return true;
        });
        localStorage.setItem('kts_staff_members', JSON.stringify(filtered));
        saveSettingToDb('kts_staff_members', JSON.stringify(filtered));
      }
    } catch (err) {
      console.error('Error deleting faculty from localStorage:', err);
    }

    setDeleteConfirmId(null);
    loadFaculty();
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          iconBg="var(--red-bg)"
          iconColor="var(--red-tx)"
        />
        <KPICard
          label="Monthly Payroll"
          value={`₹${((faculty.reduce((sum, f) => {
            const savedStaffStr = localStorage.getItem('kts_staff_members');
            const currentStaffList = savedStaffStr ? JSON.parse(savedStaffStr) : STAFF;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const staff = currentStaffList.find((s: any) => s.name.toLowerCase() === f.name.toLowerCase());
            return sum + (staff?.salary || 45000);
          }, 0)) / 100000).toFixed(1)}L`}
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
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                />
                <YAxis
                  dataKey="dept"
                  type="category"
                  tick={{ fontSize: 10, fill: 'var(--tx3)' }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${v}k`, 'Salary']} cursor={{ fill: 'var(--surf2)' }} />
                <Bar dataKey="amt" radius={[0, 4, 4, 0]} shape={<CustomBar />} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 p-2.5 bg-[var(--amber-bg)] rounded-xl flex items-center gap-2">
            <Lock size={14} className="text-[var(--amber-tx)] flex-shrink-0" />
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <span className="text-[11.5px] text-[var(--amber-tx)]">
              Salary details visible to admin & principal only
            </span>
          </div>
        </Card>
      </div>

      {/* Add / Edit Faculty Modal */}
      {(modal === 'add' || modal === 'edit') && (() => {
        // Load details from kts_staff_members for prepopulating
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let selectedStaff: any = null;
        if (selected) {
          try {
            const savedStaffStr = localStorage.getItem('kts_staff_members');
            if (savedStaffStr) {
              const parsed = JSON.parse(savedStaffStr);
              if (Array.isArray(parsed)) {
                selectedStaff = parsed.find(
                  (s) => String(s.id) === String(selected.id) || s.name.toLowerCase() === selected.name.toLowerCase()
                );
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSave} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[500px] shadow-2xl overflow-y-auto max-h-[90vh]">
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
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Full Name *</label>
                    <input
                      name="name"
                      required
                      defaultValue={selected?.name ?? ''}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                      placeholder="Mrs. Lakshmi Devi"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Designation *</label>
                    <input
                      name="designation"
                      required
                      defaultValue={selected?.designation ?? 'Teacher'}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                      placeholder="Senior Teacher"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Phone *</label>
                    <input
                      name="phone"
                      required
                      defaultValue={selected?.phone ?? ''}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                      placeholder="9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Join Date</label>
                    <input
                      name="joinDate"
                      type="date"
                      defaultValue={selectedStaff?.joinDate || new Date().toISOString().slice(0, 10)}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Department *</label>
                    <select
                      name="department"
                      defaultValue={selectedStaff?.department || selected?.designation || 'Mathematics'}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                    >
                      <option>Mathematics</option>
                      <option>Science</option>
                      <option>English</option>
                      <option>Languages</option>
                      <option>Social Sciences</option>
                      <option>Sports</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Subject(s)</label>
                    <input
                      name="subject"
                      defaultValue={selected?.subject ?? ''}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                      placeholder="Physics, Chemistry"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Password *</label>
                    <input
                      type="password"
                      name="password"
                      required
                      defaultValue="password"
                      placeholder="••••••••"
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Monthly Salary (₹)</label>
                    <input
                      name="salary"
                      type="number"
                      defaultValue={selectedStaff?.salary || 45000}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Qualifications</label>
                    <input
                      name="qualifications"
                      defaultValue={selectedStaff?.qualifications || 'B.Ed'}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                      placeholder="M.Sc, B.Ed"
                    />
                  </div>
                </div>

                {/* Documents Required */}
                <div className="border-t border-[var(--b)] pt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)]">Documents Required</label>
                    <button
                      type="button"
                      onClick={() => {
                        const docName = prompt("Enter the name of the other document:");
                        if (docName && docName.trim()) {
                          setCustomDocs(prev => [...prev, docName.trim()]);
                        }
                      }}
                      className="flex items-center gap-1 text-[10.5px] text-[var(--blue-tx)] hover:underline cursor-pointer"
                    >
                      <Plus size={10} /> Add Other Document
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Standard Docs for Teaching Category */}
                    {['Aadhar Card', 'Degree Certificate', 'Experience Letter'].map((doc) => {
                      const file = uploadedFiles[doc];
                      return (
                        <div
                          key={doc}
                          onClick={() => {
                            const input = document.getElementById(`faculty-file-input-${doc}`);
                            if (input) input.click();
                          }}
                          className={`relative border border-dashed rounded-lg p-2.5 text-center cursor-pointer transition-colors ${
                            file
                              ? 'border-[var(--teal)] bg-[var(--teal-bg)]/10'
                              : 'border-[var(--b)] bg-[var(--surf2)]/20 hover:border-[var(--blue)]'
                          }`}
                        >
                          <input
                            id={`faculty-file-input-${doc}`}
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const selectedFile = e.target.files[0];
                                setUploadedFiles(prev => ({
                                  ...prev,
                                  [doc]: selectedFile
                                }));
                              }
                            }}
                            className="hidden"
                          />
                          {file ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUploadedFiles(prev => {
                                    const next = { ...prev };
                                    delete next[doc];
                                    return next;
                                  });
                                }}
                                className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-[var(--surf2)] text-[var(--red)] cursor-pointer flex items-center justify-center z-10"
                                title="Delete File"
                              >
                                <X size={10} />
                              </button>
                              <CheckCircle2 size={14} className="text-[var(--teal)] mx-auto mb-1" />
                              <div className="text-[10.5px] text-[var(--tx)] font-semibold truncate px-1">{doc}</div>
                              <div className="text-[9px] text-[var(--tx3)] truncate px-1">{file.name}</div>
                            </>
                          ) : (
                            <>
                              <FileText size={14} className="text-[var(--tx3)] mx-auto mb-1" />
                              <div className="text-[10.5px] text-[var(--tx3)] font-medium">{doc}</div>
                              <div className="text-[9px] text-[var(--tx3)] opacity-60">Click to upload</div>
                            </>
                          )}
                        </div>
                      );
                    })}
                    {/* Custom Docs */}
                    {customDocs.map((doc, index) => {
                      const file = uploadedFiles[doc];
                      return (
                        <div
                          key={doc + '-' + index}
                          onClick={() => {
                            const input = document.getElementById(`faculty-file-input-${doc}`);
                            if (input) input.click();
                          }}
                          className={`relative border border-dashed rounded-lg p-2.5 text-center cursor-pointer transition-colors ${
                            file
                              ? 'border-[var(--teal)] bg-[var(--teal-bg)]/10'
                              : 'border-[var(--blue)] bg-[var(--blue-bg)]/10 hover:border-[var(--blue)]'
                          }`}
                        >
                          <input
                            id={`faculty-file-input-${doc}`}
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const selectedFile = e.target.files[0];
                                setUploadedFiles(prev => ({
                                  ...prev,
                                  [doc]: selectedFile
                                }));
                              }
                            }}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomDocs(prev => prev.filter((_, idx) => idx !== index));
                              setUploadedFiles(prev => {
                                const next = { ...prev };
                                delete next[doc];
                                return next;
                              });
                            }}
                            className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-[var(--surf2)] text-[var(--red)] cursor-pointer flex items-center justify-center z-10"
                            title="Remove Document"
                          >
                            <X size={10} />
                          </button>
                          {file ? (
                            <>
                              <CheckCircle2 size={14} className="text-[var(--teal)] mx-auto mb-1" />
                              <div className="text-[10.5px] text-[var(--tx)] font-semibold truncate px-2">{doc}</div>
                              <div className="text-[9px] text-[var(--tx3)] truncate px-2">{file.name}</div>
                            </>
                          ) : (
                            <>
                              <FileText size={14} className="text-[var(--blue-tx)] mx-auto mb-1" />
                              <div className="text-[10.5px] text-[var(--tx2)] font-medium truncate px-2">{doc}</div>
                              <div className="text-[9px] text-[var(--tx3)] opacity-60">Click to upload</div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
        );
      })()}

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
