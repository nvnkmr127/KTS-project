import { useState, useEffect } from 'react';
import {
  Search, Plus, GraduationCap, Phone, Edit2, Trash2, Eye,
  X, Loader2, AlertCircle, CheckCircle2, Download, Mail,
  MapPin, Briefcase, Calendar, Users, Award, ArrowLeft,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { KPICard } from '../components/KPICard';
import { api } from '../services/api';
import { formatDate } from '../utils/date';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { TableSkeleton } from '../components/Skeleton';
import {
  type LocalAlumni,
  readLocalAlumni,
  addLocalAlumni,
  updateLocalAlumni,
  deleteLocalAlumni,
  mergeAlumni,
} from '../utils/alumniStore';

interface Alumni extends LocalAlumni {}

type ModalType = 'add' | 'view' | 'edit' | null;

const PASS_OUT_YEARS = Array.from({ length: 20 }, (_, i) => String(new Date().getFullYear() - i));

const OCCUPATION_OPTIONS = [
  'Engineering Student',
  'Medical Student',
  'Arts/Science Student',
  'Commerce Student',
  'Software Engineer',
  'Doctor',
  'Lawyer',
  'Teacher',
  'Business / Entrepreneur',
  'Government Job',
  'Other',
];

const GENDER_VARIANTS: Record<string, 'blue' | 'pink' | 'purple'> = {
  Male: 'blue',
  Female: 'pink',
  Other: 'purple',
};

const STATUS_VARIANTS: Record<string, 'teal' | 'amber' | 'gray'> = {
  Verified: 'teal',
  Unverified: 'amber',
  Inactive: 'gray',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
}

const AVATAR_COLORS = [
  { bg: 'var(--blue-bg)', color: 'var(--blue-tx)' },
  { bg: 'var(--teal-bg)', color: 'var(--teal-tx)' },
  { bg: 'var(--purple-bg)', color: 'var(--purple-tx)' },
  { bg: 'var(--amber-bg)', color: 'var(--amber-tx)' },
  { bg: 'var(--coral-bg)', color: 'var(--coral-tx)' },
  { bg: 'var(--green-bg)', color: 'var(--green-tx)' },
];
function avatarColor(id: string) {
  const idx = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

const ITEMS_PER_PAGE = 10;

// ── Component ─────────────────────────────────────────────────────────────────
export function Alumni() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Alumni | null>(null);
  const [detailAlumni, setDetailAlumni] = useState<Alumni | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Form field state ─────────────────────────────────────────────────────
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [fGender, setFGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [fDob, setFDob] = useState('');
  const [fRoll, setFRoll] = useState('');
  const [fYear, setFYear] = useState(PASS_OUT_YEARS[0]);
  const [fClass, setFClass] = useState('10');
  const [fSection, setFSection] = useState('A');
  const [fPhone, setFPhone] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fOccupation, setFOccupation] = useState(OCCUPATION_OPTIONS[0]);
  const [fAchievement, setFAchievement] = useState('');
  const [fStatus, setFStatus] = useState<'Verified' | 'Unverified' | 'Inactive'>('Unverified');

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Load — merges backend + localStorage store ──────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      let backendAlumni: Alumni[] = [];
      try {
        const data = await api.getResources('alumni');
        if (Array.isArray(data) && data.length > 0) {
          backendAlumni = data.map((a: any) => ({
            id: String(a.id),
            name: a.name,
            roll: a.roll || a.enrollment_number || '',
            passOutYear: String(a.pass_out_year || a.passOutYear || ''),
            class: String(a.class || '10'),
            section: a.section || 'A',
            gender: (a.gender as any) || 'Male',
            dob: a.dob ? a.dob.slice(0, 10) : '',
            phone: a.phone || a.student_mobile || '',
            email: a.email || '',
            address: a.address || a.village || '',
            currentOccupation: a.current_occupation || a.currentOccupation || '',
            achievement: a.achievement || '',
            status: a.status === 'verified' ? 'Verified' : a.status === 'inactive' ? 'Inactive' : 'Unverified',
            source: 'backend' as const,
          }));
        }
      } catch {
        // Backend may not have alumni endpoint yet — that's fine
      }

      // Merge backend records with locally-stored ones (from promotion or manual adds)
      const merged = (mergeAlumni(backendAlumni) as Alumni[]).filter(a => a.status !== 'Deleted');
      
      setAlumni(merged);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, yearFilter, statusFilter]);

  // ── Populate form on modal open ───────────────────────────────────────────
  useEffect(() => {
    if (modal === 'add') {
      setFname(''); setLname(''); setFGender('Male'); setFDob('');
      setFRoll(''); setFYear(PASS_OUT_YEARS[0]); setFClass('10'); setFSection('A');
      setFPhone(''); setFEmail(''); setFAddress('');
      setFOccupation(OCCUPATION_OPTIONS[0]); setFAchievement(''); setFStatus('Unverified');
      setFormErrors({}); setSaveError('');
    } else if ((modal === 'edit') && selected) {
      const [first, ...rest] = selected.name.split(' ');
      setFname(first); setLname(rest.join(' '));
      setFGender(selected.gender); setFDob(selected.dob);
      setFRoll(selected.roll); setFYear(selected.passOutYear);
      setFClass(selected.class); setFSection(selected.section);
      setFPhone(selected.phone); setFEmail(selected.email);
      setFAddress(selected.address); setFOccupation(selected.currentOccupation);
      setFAchievement(selected.achievement); setFStatus(selected.status === 'Deleted' ? 'Unverified' : selected.status);
      setFormErrors({}); setSaveError('');
    }
  }, [modal, selected]);

  // ── Filtering & pagination ────────────────────────────────────────────────
  const filtered = alumni.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = a.name.toLowerCase().includes(q) ||
      a.roll.toLowerCase().includes(q) ||
      a.currentOccupation.toLowerCase().includes(q) ||
      a.achievement.toLowerCase().includes(q);
    const matchYear = yearFilter === 'All' || a.passOutYear === yearFilter;
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchYear && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const verifiedCount = alumni.filter(a => a.status === 'Verified').length;
  const uniqueYears = [...new Set(alumni.map(a => a.passOutYear))].length;
  const employedCount = alumni.filter(a =>
    ['Software Engineer', 'Doctor', 'Lawyer', 'Teacher', 'Business / Entrepreneur', 'Government Job'].includes(a.currentOccupation)
  ).length;

  // ── Validate + Save ───────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!fname.trim()) errors.fname = 'First name is required';
    if (!lname.trim()) errors.lname = 'Last name is required';
    if (!fPhone || fPhone.replace(/\D/g, '').length !== 10) errors.fPhone = 'Valid 10-digit mobile is required';
    if (fEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fEmail)) errors.fEmail = 'Enter a valid email';
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    setSaving(true);
    const payload = {
      name: `${fname.trim()} ${lname.trim()}`,
      gender: fGender,
      dob: fDob,
      roll: fRoll,
      pass_out_year: fYear,
      class: fClass,
      section: fSection,
      phone: fPhone,
      email: fEmail,
      address: fAddress,
      current_occupation: fOccupation,
      achievement: fAchievement,
      status: fStatus.toLowerCase(),
    };

    try {
      if (modal === 'add') {
        try {
          await api.createResource('alumni', payload);
        } catch {
          // fallback to local
        }
        const localRecord = { ...payload, passOutYear: fYear, currentOccupation: fOccupation, status: fStatus, source: 'manual' as const };
        const added = addLocalAlumni(localRecord as any);
        showToast('Alumni record added!', true);
      } else if (modal === 'edit' && selected) {
        try {
          if (selected.source === 'backend' || !selected.id.toString().startsWith('local-')) {
            await api.updateResource('alumni', selected.id, payload);
          }
        } catch {
          // ignore backend failure
        }
        const localRecord = { ...payload, passOutYear: fYear, currentOccupation: fOccupation, status: fStatus, source: selected.source || 'manual' };
        updateLocalAlumni(selected.id, localRecord as any);
        showToast('Alumni record updated!', true);
      }
      setModal(null);
      await load();
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      if (!deleteId.toString().startsWith('local-')) {
        await api.updateResource('alumni', deleteId, { status: 'Deleted' });
      }
      updateLocalAlumni(deleteId, { status: 'Deleted' as any });
      await load();
      showToast('Alumni record moved to recycle bin.', true);
    } catch {
      // local fallback
      updateLocalAlumni(deleteId, { status: 'Deleted' as any });
      await load();
      showToast('Alumni record moved to recycle bin.', true);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  // ── CSV Export ────────────────────────────────────────────────────────────
  const handleExport = () => {
    const headers = ['Name', 'Roll No', 'Pass-Out Year', 'Class', 'Gender', 'Phone', 'Email', 'Occupation', 'Achievement', 'Status'];
    const rows = filtered.map(a => [
      a.name, a.roll, a.passOutYear, `${a.class}-${a.section}`,
      a.gender, a.phone, a.email, a.currentOccupation, a.achievement, a.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `alumni_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Detail view ───────────────────────────────────────────────────────────
  const renderDetail = () => {
    if (!detailAlumni) return null;
    const a = detailAlumni;
    const av = avatarColor(a.id);
    return (
      <div className="space-y-3">
        {/* Back */}
        <div className="flex items-center justify-between border-b border-[var(--b)] pb-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setDetailAlumni(null)}
              className="p-1.5 hover:bg-[var(--surf2)] rounded-lg text-[var(--tx2)] hover:text-[var(--tx)] cursor-pointer"
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <h2 className="text-[13.5px] font-bold text-[var(--tx)]">Alumni Profile</h2>
              <p className="text-[11px] text-[var(--tx3)]">Full details and contact information</p>
            </div>
          </div>
          <button
            onClick={() => { setSelected(a); setDetailAlumni(null); setModal('edit'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg hover:opacity-90 cursor-pointer font-medium"
          >
            <Edit2 size={12} /> Edit
          </button>
        </div>

        {/* Avatar + name */}
        <Card className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-[20px] font-bold flex-shrink-0"
            style={{ background: av.bg, color: av.color }}
          >
            {initials(a.name)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="text-[16px] font-bold text-[var(--tx)]">{a.name}</div>
            <div className="text-[12px] text-[var(--tx3)] mt-0.5">Roll No: <span className="font-mono">{a.roll || 'N/A'}</span></div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <Badge variant="blue">Batch of {a.passOutYear}</Badge>
              <Badge variant="blue">Class {a.class}-{a.section}</Badge>
              <Badge variant={STATUS_VARIANTS[a.status] ?? 'gray'}>{a.status}</Badge>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* Personal Info */}
          <Card className="space-y-3">
            <div className="text-[12.5px] font-bold text-[var(--tx)] pb-2 border-b border-[var(--b)] flex items-center gap-1.5">
              <GraduationCap size={13} className="text-[var(--tx3)]" /> Personal Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { label: 'Gender', value: a.gender },
                { label: 'Date of Birth', value: formatDate(a.dob) },
                { label: 'Phone', value: a.phone },
                { label: 'Email', value: a.email || 'N/A' },
              ].map(item => (
                <div key={item.label} className="bg-[var(--surf2)] rounded-xl p-3">
                  <div className="text-[10px] text-[var(--tx3)] mb-0.5">{item.label}</div>
                  <div className="text-[12px] font-semibold text-[var(--tx)]">{item.value || 'N/A'}</div>
                </div>
              ))}
              <div className="bg-[var(--surf2)] rounded-xl p-3 sm:col-span-2">
                <div className="text-[10px] text-[var(--tx3)] mb-0.5 flex items-center gap-1"><MapPin size={10} /> Address</div>
                <div className="text-[12px] font-semibold text-[var(--tx)]">{a.address || 'N/A'}</div>
              </div>
            </div>
          </Card>

          {/* Career / Achievement */}
          <Card className="space-y-3">
            <div className="text-[12.5px] font-bold text-[var(--tx)] pb-2 border-b border-[var(--b)] flex items-center gap-1.5">
              <Briefcase size={13} className="text-[var(--tx3)]" /> Career & Achievement
            </div>
            <div className="space-y-2.5">
              <div className="bg-[var(--surf2)] rounded-xl p-3">
                <div className="text-[10px] text-[var(--tx3)] mb-0.5 flex items-center gap-1"><Briefcase size={10} /> Current Occupation</div>
                <div className="text-[12px] font-semibold text-[var(--tx)]">{a.currentOccupation || 'N/A'}</div>
              </div>
              <div className="bg-[var(--teal-bg)] rounded-xl p-3 border border-[var(--teal-tx)]/15">
                <div className="text-[10px] text-[var(--teal-tx)] mb-0.5 flex items-center gap-1"><Award size={10} /> Achievement / College</div>
                <div className="text-[12px] font-semibold text-[var(--teal-tx)]">{a.achievement || 'N/A'}</div>
              </div>
              <div className="flex gap-2">
                {a.phone && (
                  <a
                    href={`tel:${a.phone}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[var(--blue-bg)] text-[var(--blue-tx)] rounded-xl text-[11.5px] font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Phone size={12} /> Call
                  </a>
                )}
                {a.email && (
                  <a
                    href={`mailto:${a.email}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[var(--purple-bg)] text-[var(--purple-tx)] rounded-xl text-[11.5px] font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Mail size={12} /> Email
                  </a>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // ── Add/Edit Modal ────────────────────────────────────────────────────────
  const renderModal = () => {
    if (!modal || modal === 'view') return null;
    const isAdd = modal === 'add';
    const fieldCls = (err?: string) =>
      `w-full bg-[var(--surf2)] border ${err ? 'border-[var(--red-tx)]' : 'border-[var(--b)]'} rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] transition-colors`;

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[560px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--b)] flex-shrink-0">
            <div>
              <div className="text-[13.5px] font-bold text-[var(--tx)]">{isAdd ? 'Add Alumni Record' : 'Edit Alumni Record'}</div>
              <div className="text-[11px] text-[var(--tx3)] mt-0.5">{isAdd ? 'Register a former student in the alumni network' : 'Update alumni information'}</div>
            </div>
            <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx2)]">
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <form id="alumni-form" onSubmit={handleSave} className="overflow-y-auto flex-1">
            <div className="p-5 space-y-4">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">First Name *</label>
                  <input value={fname} onChange={e => { setFname(e.target.value); setFormErrors(prev => ({ ...prev, fname: '' })); }}
                    className={fieldCls(formErrors.fname)} placeholder="Arjun" />
                  {formErrors.fname && <p className="text-[10.5px] text-[var(--red-tx)] mt-1">{formErrors.fname}</p>}
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Last Name *</label>
                  <input value={lname} onChange={e => { setLname(e.target.value); setFormErrors(prev => ({ ...prev, lname: '' })); }}
                    className={fieldCls(formErrors.lname)} placeholder="Reddy" />
                  {formErrors.lname && <p className="text-[10.5px] text-[var(--red-tx)] mt-1">{formErrors.lname}</p>}
                </div>
              </div>

              {/* Roll + Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Roll / Admission No.</label>
                  <input value={fRoll} onChange={e => setFRoll(e.target.value)}
                    className={fieldCls()} placeholder="KTS2022001" />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Pass-Out Year *</label>
                  <select value={fYear} onChange={e => setFYear(e.target.value)} className={fieldCls()}>
                    {PASS_OUT_YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Class + Section + Gender */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class</label>
                  <select value={fClass} onChange={e => setFClass(e.target.value)} className={fieldCls()}>
                    {['6','7','8','9','10'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Section</label>
                  <select value={fSection} onChange={e => setFSection(e.target.value)} className={fieldCls()}>
                    {['A','B','C','D'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Gender</label>
                  <select value={fGender} onChange={e => setFGender(e.target.value as any)} className={fieldCls()}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>

              {/* DOB */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Date of Birth</label>
                <input type="date" value={fDob} onChange={e => setFDob(e.target.value)} className={fieldCls()} />
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Phone *</label>
                  <input value={fPhone} onChange={e => { setFPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setFormErrors(prev => ({ ...prev, fPhone: '' })); }}
                    className={fieldCls(formErrors.fPhone)} placeholder="9876543210" />
                  {formErrors.fPhone && <p className="text-[10.5px] text-[var(--red-tx)] mt-1">{formErrors.fPhone}</p>}
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Email</label>
                  <input type="email" value={fEmail} onChange={e => { setFEmail(e.target.value); setFormErrors(prev => ({ ...prev, fEmail: '' })); }}
                    className={fieldCls(formErrors.fEmail)} placeholder="arjun@gmail.com" />
                  {formErrors.fEmail && <p className="text-[10.5px] text-[var(--red-tx)] mt-1">{formErrors.fEmail}</p>}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Address</label>
                <input value={fAddress} onChange={e => setFAddress(e.target.value)}
                  className={fieldCls()} placeholder="City, District, State" />
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Current Occupation</label>
                <select value={fOccupation} onChange={e => setFOccupation(e.target.value)} className={fieldCls()}>
                  {OCCUPATION_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

              {/* Achievement */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Achievement / College / Employer</label>
                <input value={fAchievement} onChange={e => setFAchievement(e.target.value)}
                  className={fieldCls()} placeholder="e.g. B.Tech at JNTU Hyderabad" />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Verification Status</label>
                <select value={fStatus} onChange={e => setFStatus(e.target.value as any)} className={fieldCls()}>
                  <option>Unverified</option><option>Verified</option><option>Inactive</option>
                </select>
              </div>

              {saveError && (
                <div className="flex items-center gap-2 text-[11.5px] text-[var(--red-tx)] bg-[var(--red-bg)] p-3 rounded-xl border border-[var(--red-tx)]/20">
                  <AlertCircle size={13} /> {saveError}
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="flex gap-2 px-5 py-4 border-t border-[var(--b)] flex-shrink-0">
            <button onClick={() => setModal(null)}
              className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer hover:bg-[var(--surf3)]">
              Cancel
            </button>
            <button form="alumni-form" type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-60">
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              {isAdd ? 'Add Alumni' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)] relative">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-[12px] font-semibold ${
          toast.ok
            ? 'bg-[var(--teal-bg)] border-[var(--teal-tx)]/20 text-[var(--teal-tx)]'
            : 'bg-[var(--red-bg)] border-[var(--red-tx)]/20 text-[var(--red-tx)]'
        }`}>
          {toast.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Detail view */}
      {detailAlumni ? (
        <Card>{renderDetail()}</Card>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <KPICard label="Total Alumni" value={alumni.length} sub="Registered in network"
              icon={<GraduationCap size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
            <KPICard label="Verified" value={verifiedCount} sub="Contact confirmed"
              icon={<CheckCircle2 size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
            <KPICard label="Batches" value={uniqueYears} sub="Pass-out years"
              icon={<Calendar size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
            <KPICard label="Employed / Working" value={employedCount} sub="Professional careers"
              icon={<Briefcase size={15} />} iconBg="var(--purple-bg)" iconColor="var(--purple-tx)" />
          </div>

          <Card>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="text-[13px] font-semibold text-[var(--tx)] flex items-center gap-2">
                <Users size={14} className="text-[var(--tx3)]" />
                Alumni Directory
                {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[var(--b)] bg-[var(--surf2)] text-[var(--tx)] rounded-lg hover:bg-[var(--surf3)] cursor-pointer"
                >
                  <Download size={12} /> Export CSV
                </button>
                <button
                  onClick={() => { setSelected(null); setModal('add'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg hover:opacity-90 cursor-pointer font-medium"
                >
                  <Plus size={12} /> Add Alumni
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="flex items-center gap-2 flex-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2">
                <Search size={13} className="text-[var(--tx3)]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, roll, occupation, achievement..."
                  className="flex-1 bg-transparent text-[12px] text-[var(--tx)] placeholder:text-[var(--tx3)] outline-none"
                />
              </div>
              <select
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
                className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none cursor-pointer"
              >
                <option value="All">All Years</option>
                {PASS_OUT_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option>Verified</option>
                <option>Unverified</option>
                <option>Inactive</option>
              </select>
            </div>

            {/* Table */}
            {loading ? (
              <TableSkeleton rows={6} cols={6} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<GraduationCap size={28} />}
                title="No alumni found"
                description={search || yearFilter !== 'All' || statusFilter !== 'All'
                  ? 'Try adjusting your filters or search term.'
                  : 'Add your first alumni record to get started.'}
                actionLabel={!search && yearFilter === 'All' && statusFilter === 'All' ? 'Add Alumni' : undefined}
                onAction={!search && yearFilter === 'All' && statusFilter === 'All' ? () => { setSelected(null); setModal('add'); } : undefined}
              />
            ) : (
              <>
                <div className="overflow-x-auto -mx-3.5">
                  <table className="w-full border-collapse" style={{ minWidth: 720 }}>
                    <thead>
                      <tr className="border-b border-[var(--b)]">
                        {['Name & Roll', 'Batch', 'Gender', 'Occupation', 'Achievement', 'Status', ''].map(h => (
                          <th key={h} className="text-left text-[11.5px] font-semibold text-[var(--tx2)] px-3.5 py-2.5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((a, idx) => {
                        const av = avatarColor(a.id);
                        return (
                          <tr
                            key={a.id}
                            className={`border-b border-[var(--b)] hover:bg-[var(--surf2)] transition-colors group ${idx % 2 === 0 ? '' : 'bg-[var(--surf2)]/30'}`}
                          >
                            {/* Name */}
                            <td className="px-3.5 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                                  style={{ background: av.bg, color: av.color }}
                                >
                                  {initials(a.name)}
                                </div>
                                <div>
                                  <div className="text-[12.5px] font-semibold text-[var(--tx)]">{a.name}</div>
                                  <div className="text-[11px] text-[var(--tx3)] font-mono">{a.roll || '—'}</div>
                                </div>
                              </div>
                            </td>
                            {/* Batch */}
                            <td className="px-3.5 py-2.5">
                              <div className="text-[12px] font-semibold text-[var(--tx)]">{a.passOutYear}</div>
                              <div className="text-[11px] text-[var(--tx3)]">Class {a.class}-{a.section}</div>
                            </td>
                            {/* Gender */}
                            <td className="px-3.5 py-2.5">
                              <Badge variant={GENDER_VARIANTS[a.gender] ?? 'gray'}>{a.gender}</Badge>
                            </td>
                            {/* Occupation */}
                            <td className="px-3.5 py-2.5">
                              <div className="text-[12px] text-[var(--tx)] max-w-[140px] truncate">{a.currentOccupation || '—'}</div>
                            </td>
                            {/* Achievement */}
                            <td className="px-3.5 py-2.5">
                              <div className="text-[12px] text-[var(--tx3)] max-w-[160px] truncate">{a.achievement || '—'}</div>
                            </td>
                            {/* Status */}
                            <td className="px-3.5 py-2.5">
                              <Badge variant={STATUS_VARIANTS[a.status] ?? 'gray'}>{a.status}</Badge>
                            </td>
                            {/* Actions */}
                            <td className="px-3.5 py-2.5">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setDetailAlumni(a)}
                                  title="View"
                                  className="p-1.5 hover:bg-[var(--blue-bg)] hover:text-[var(--blue-tx)] text-[var(--tx3)] rounded-lg transition-colors cursor-pointer"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  onClick={() => { setSelected(a); setModal('edit'); }}
                                  title="Edit"
                                  className="p-1.5 hover:bg-[var(--amber-bg)] hover:text-[var(--amber-tx)] text-[var(--tx3)] rounded-lg transition-colors cursor-pointer"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => setDeleteId(a.id)}
                                  title="Delete"
                                  className="p-1.5 hover:bg-[var(--red-bg)] hover:text-[var(--red-tx)] text-[var(--tx3)] rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                                {a.phone && (
                                  <a
                                    href={`tel:${a.phone}`}
                                    title="Call"
                                    className="p-1.5 hover:bg-[var(--teal-bg)] hover:text-[var(--teal-tx)] text-[var(--tx3)] rounded-lg transition-colors"
                                  >
                                    <Phone size={13} />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--b)]">
                    <span className="text-[11.5px] text-[var(--tx3)]">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} alumni
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="p-1.5 rounded-lg border border-[var(--b)] text-[var(--tx2)] hover:bg-[var(--surf2)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pg = i + 1;
                        return (
                          <button
                            key={pg}
                            onClick={() => setCurrentPage(pg)}
                            className={`w-7 h-7 rounded-lg text-[11.5px] font-medium cursor-pointer transition-colors ${
                              pg === currentPage
                                ? 'bg-[var(--blue)] text-white'
                                : 'text-[var(--tx2)] hover:bg-[var(--surf2)]'
                            }`}
                          >
                            {pg}
                          </button>
                        );
                      })}
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="p-1.5 rounded-lg border border-[var(--b)] text-[var(--tx2)] hover:bg-[var(--surf2)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}

      {/* Add/Edit Modal */}
      {renderModal()}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Alumni Record"
        message="Are you sure you want to remove this alumni from the network? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
