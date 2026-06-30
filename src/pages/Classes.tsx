import { useState, useEffect } from 'react';
import { Plus, X, BookOpen, Users, User, Loader2, Trash2, Edit2 } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { STAFF } from './StaffManagement';

interface ClassData {
  id: string;
  name: string;
  sections: SectionData[];
}

interface SectionData {
  id: string;
  name: string;
  classTeacher: string;
  classTeacherId?: string;
  students: number;
  realStudents?: number;
  subjects: string[];
  capacity?: number;
}

const ALL_SUBJECTS = ['Maths', 'Physics', 'Chemistry', 'Biology', 'Science', 'English', 'Telugu', 'Hindi', 'Social', 'EVS', 'Computer Science', 'Physical Education'];

export function Classes() {
  const { selectedAcademicYearId } = useApp();
  const [classes, setClasses] = useState<ClassData[]>([]);
  // Pre-populate teachers from local storage / STAFF constant so dropdown always works
  const [teachers, setTeachers] = useState<any[]>(() => {
    try {
      const savedStaffStr = localStorage.getItem('kts_staff_members');
      if (savedStaffStr) {
        const arr = JSON.parse(savedStaffStr).filter(
          (s: any) => s && s.id && s.name && s.status !== 'Resigned'
        );
        if (arr.length > 0) return arr;
      }
    } catch {}
    return STAFF.filter(s => s.status !== 'Resigned');
  });
  const [loading, setLoading] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>('8');
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAssignTeacher, setShowAssignTeacher] = useState<SectionData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteConfirmSection, setDeleteConfirmSection] = useState<SectionData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editSectionData, setEditSectionData] = useState<{ classId: string; section: SectionData } | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [customSubjectInput, setCustomSubjectInput] = useState('');

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (allowedKeys.includes(e.key)) {
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleNumberInput = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
  };

   const loadClasses = async () => {
    setLoading(true);

    // ── Teachers (fully independent – never blocks class loading) ──────────
    const resignedNames = new Set<string>();
    try {
      const s = localStorage.getItem('kts_staff_members');
      if (s) JSON.parse(s).filter((x: any) => x?.status === 'Resigned' && x.name)
               .forEach((x: any) => resignedNames.add(x.name.toLowerCase().trim()));
    } catch {}

    let activeTeachers: any[] = [];
    try {
      const facultyData = await api.getResources('faculty');
      activeTeachers = (facultyData || []).filter((t: any) => {
        if ((t.status || '').toLowerCase() === 'inactive') return false;
        if (t.name && resignedNames.has(t.name.toLowerCase().trim())) return false;
        return true;
      });
    } catch {}

    if (activeTeachers.length === 0) {
      try {
        const s = localStorage.getItem('kts_staff_members');
        if (s) activeTeachers = JSON.parse(s)
          .filter((x: any) => x?.id && x.name && x.status !== 'Resigned')
          .map((x: any) => ({ id: x.id, name: x.name, status: x.status, department: x.department || '' }));
      } catch {}
    }

    if (activeTeachers.length === 0) {
      activeTeachers = STAFF.filter(s => s.status !== 'Resigned')
        .map(s => ({ id: s.id, name: s.name, status: s.status, department: s.department || '' }));
    }

    setTeachers(activeTeachers);

    // ── Batches + Students (backend-dependent) ─────────────────────────────
    try {
      const [allBatches, studentsData] = await Promise.all([
        api.getResources('batches'),
        api.getResources('students'),
      ]);
      const batchesData = allBatches.filter((b: any) => !b.academic_year_id || String(b.academic_year_id) === String(selectedAcademicYearId));

      const classGroups: Record<string, SectionData[]> = {};
      const defaultClasses = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

      batchesData.forEach((b: any) => {
        const batchName = b.name;
        let classId = '8';
        let sectionLetter = 'A';

        const match = batchName.match(/^(.+?)([A-Z])$/);
        if (match) {
          classId = match[1];
          sectionLetter = match[2];
        } else {
          if (batchName === 'Default Batch') { classId = '8'; sectionLetter = 'A'; }
        }

        const studentsInBatch = studentsData.filter((s: any) => String(s.batch_id) === String(b.id)).length;
        if (!classGroups[classId]) classGroups[classId] = [];

        const savedSubjects = localStorage.getItem(`batch_subjects_${batchName}`);
        const subjectsList = savedSubjects ? JSON.parse(savedSubjects) : (classId === '8' ? ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'Telugu', 'Social'] : ['Maths', 'Science', 'English', 'Telugu', 'Hindi', 'Social', 'EVS']);
        const capacityVal = localStorage.getItem(`batch_capacity_${batchName}`) ? Number(localStorage.getItem(`batch_capacity_${batchName}`)) : 40;

        classGroups[classId].push({
          id: String(b.id),
          name: `Section ${sectionLetter}`,
          classTeacher: b.class_teacher_name || 'Select teacher',
          classTeacherId: b.class_teacher_id ? String(b.class_teacher_id) : undefined,
          students: studentsInBatch,
          realStudents: studentsInBatch,
          subjects: subjectsList,
          capacity: capacityVal,
        });
      });

      defaultClasses.forEach((cId) => {
        if (!classGroups[cId]) {
          classGroups[cId] = [
            { id: `mock-${cId}A`, name: 'Section A', classTeacher: 'Select teacher', students: 0, subjects: localStorage.getItem(`batch_subjects_${cId}A`) ? JSON.parse(localStorage.getItem(`batch_subjects_${cId}A`)!) : ['Maths', 'Science', 'English', 'Telugu', 'Hindi', 'Social'], capacity: localStorage.getItem(`batch_capacity_${cId}A`) ? Number(localStorage.getItem(`batch_capacity_${cId}A`)) : 40 },
            { id: `mock-${cId}B`, name: 'Section B', classTeacher: 'Select teacher', students: 0, subjects: localStorage.getItem(`batch_subjects_${cId}B`) ? JSON.parse(localStorage.getItem(`batch_subjects_${cId}B`)!) : ['Maths', 'Science', 'English', 'Telugu', 'Hindi', 'Social'], capacity: localStorage.getItem(`batch_capacity_${cId}B`) ? Number(localStorage.getItem(`batch_capacity_${cId}B`)) : 40 }
          ];
        }
      });

      const mappedClasses = Object.keys(classGroups).map((cId) => ({
        id: cId,
        name: cId,
        sections: classGroups[cId].sort((a, b) => a.name.localeCompare(b.name)),
      })).sort((a, b) => {
        const numA = Number(a.id), numB = Number(b.id);
        const isNumA = !isNaN(numA), isNumB = !isNaN(numB);
        if (isNumA && isNumB) return numA - numB;
        if (isNumA) return -1;
        if (isNumB) return 1;
        return a.id.localeCompare(b.id);
      });

      setClasses(mappedClasses);
    } catch (err) {
      console.error('Error loading classes:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadClasses();
  }, [selectedAcademicYearId]);

  const handleAssignTeacher = async (teacherId: string) => {
    if (!showAssignTeacher) return;
    const isMock = showAssignTeacher.id.startsWith('mock-');

    try {
      if (isMock) {
        const sectionNameLetter = showAssignTeacher.id.replace('mock-', '');
        await api.createResource('batches', {
          name: sectionNameLetter,
          class_teacher_id: Number(teacherId),
          course_id: 1,
          academic_year_id: 1,
          start_date: '2026-06-01',
          end_date: '2027-05-31',
          status: 'active',
        });
      } else {
        await api.updateResource('batches', showAssignTeacher.id, {
          class_teacher_id: Number(teacherId),
        });
      }
      setShowAssignTeacher(null);
      loadClasses();
    } catch (err) {
      console.error('Error assigning class teacher:', err);
    }
  };

  const handleAddSection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const fd = new FormData(e.currentTarget);
    const classNameVal = fd.get('className') as string;
    const sectionNameVal = fd.get('sectionName') as string;
    const teacherIdVal = fd.get('teacherId') as string;
    const capacityVal = fd.get('capacity') as string;

    const classNum = classNameVal.trim();
    const sectionLetter = sectionNameVal.replace(/section\s*/i, '').toUpperCase().trim();

    if (!classNum || !sectionLetter) {
      setErrorMsg('Class and Section Name are required.');
      return;
    }

    const targetClass = classes.find(c => c.id === classNum);
    if (targetClass) {
      const exists = targetClass.sections.some(
        sec => sec.name.replace('Section ', '').toUpperCase().trim() === sectionLetter
      );
      if (exists) {
        setErrorMsg('The section already exists.');
        return;
      }
    }

    try {
      await api.createResource('batches', {
        name: `${classNum}${sectionLetter}`,
        class_teacher_id: teacherIdVal ? Number(teacherIdVal) : null,
        course_id: 1,
        academic_year_id: 1,
        start_date: '2026-06-01',
        end_date: '2027-05-31',
        status: 'active',
      });
      localStorage.setItem(`batch_subjects_${classNum}${sectionLetter}`, JSON.stringify(selectedSubjects));
      localStorage.setItem(`batch_capacity_${classNum}${sectionLetter}`, capacityVal || '40');
      setShowAddSection(false);
      loadClasses();
    } catch (err: any) {
      console.error('Error adding section:', err);
      setErrorMsg(err.message || 'Failed to add section. Please try again.');
    }
  };

  const handleDeleteSection = async () => {
    if (!deleteConfirmSection) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      await api.deleteResource('batches', deleteConfirmSection.id);
      setDeleteConfirmSection(null);
      loadClasses();
    } catch (err: any) {
      console.error('Error deleting section:', err);
      setErrorMsg(err.message || 'Failed to delete section. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSectionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editSectionData) return;
    setErrorMsg(null);
    const fd = new FormData(e.currentTarget);
    const classNameVal = fd.get('className') as string;
    const sectionNameVal = fd.get('sectionName') as string;
    const teacherIdVal = fd.get('teacherId') as string;
    const capacityVal = fd.get('capacity') as string;

    const classNum = classNameVal.trim();
    const sectionLetter = sectionNameVal.replace(/section\s*/i, '').toUpperCase().trim();

    if (!classNum || !sectionLetter) {
      setErrorMsg('Class and Section Name are required.');
      return;
    }

    const originalClassNum = editSectionData.classId;
    const originalSectionLetter = editSectionData.section.name.replace('Section ', '').toUpperCase().trim();

    if (classNum !== originalClassNum || sectionLetter !== originalSectionLetter) {
      const targetClass = classes.find(c => c.id === classNum);
      if (targetClass) {
        const exists = targetClass.sections.some(
          sec => sec.name.replace('Section ', '').toUpperCase().trim() === sectionLetter
        );
        if (exists) {
          setErrorMsg('The section already exists.');
          return;
        }
      }
    }

    try {
      await api.updateResource('batches', editSectionData.section.id, {
        name: `${classNum}${sectionLetter}`,
        class_teacher_id: teacherIdVal ? Number(teacherIdVal) : null,
      });
      localStorage.setItem(`batch_subjects_${classNum}${sectionLetter}`, JSON.stringify(selectedSubjects));
      localStorage.setItem(`batch_capacity_${classNum}${sectionLetter}`, capacityVal || '40');
      const oldBatchName = `${originalClassNum}${originalSectionLetter}`;
      if (oldBatchName !== `${classNum}${sectionLetter}`) {
        localStorage.removeItem(`batch_subjects_${oldBatchName}`);
        localStorage.removeItem(`batch_capacity_${oldBatchName}`);
      }
      setEditSectionData(null);
      loadClasses();
    } catch (err: any) {
      console.error('Error editing section:', err);
      setErrorMsg(err.message || 'Failed to edit section. Please try again.');
    }
  };

  const assignedTeacherIds = new Set<string>();
  classes.forEach(c => {
    c.sections.forEach(sec => {
      if (sec.classTeacherId) {
        assignedTeacherIds.add(String(sec.classTeacherId));
      }
    });
  });

  const totalSections = classes.reduce((s, c) => s + c.sections.length, 0);
  const totalStudents = classes.reduce((s, c) => s + c.sections.reduce((ss, sec) => ss + sec.students, 0), 0);

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="Total Classes" value={classes.length} sub="Academic year 2025-26" icon={<BookOpen size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Total Sections" value={totalSections} sub="Across all classes" icon={<BookOpen size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Total Students" value={totalStudents} sub="All classes combined" icon={<Users size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
        <KPICard label="Avg Class Size" value={totalSections ? Math.round(totalStudents / totalSections) : 0} sub="Students per section" icon={<User size={15} />} iconBg="var(--purple-bg)" iconColor="var(--purple-tx)" />
      </div>

      {/* Header actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] font-semibold text-[var(--tx)] flex items-center gap-2">
          Class & Section Management {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setErrorMsg(null); setSelectedSubjects(['Maths', 'Science', 'English', 'Telugu', 'Hindi', 'Social', 'EVS']); setCustomSubjects([]); setCustomSubjectInput(''); setShowAddSection(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90">
            <Plus size={12} /> Add Class / Section
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {classes.map((cls) => (
          <Card key={cls.id} className="">
            {/* Class header */}
            <button
              onClick={() => setExpandedClass(expandedClass === cls.id ? null : cls.id)}
              className="w-full flex items-center justify-between p-0 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--blue-bg)] flex items-center justify-center text-[13px] font-bold text-[var(--blue-tx)]">
                  {cls.id}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[var(--tx)] text-left">{cls.name}</div>
                  <div className="text-[11.5px] text-[var(--tx3)] text-left">
                    {cls.sections.length} section{cls.sections.length > 1 ? 's' : ''} · {cls.sections.reduce((s, sec) => s + sec.students, 0)} students
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {cls.sections.map((sec) => (
                  <Badge key={sec.id} variant="blue">{cls.id}{sec.name.replace('Section ', '')}</Badge>
                ))}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-[var(--tx3)] transition-transform ${expandedClass === cls.id ? 'rotate-180' : ''}`}>
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>

            {expandedClass === cls.id && (
              <div className="mt-4 pt-4 border-t border-[var(--b)] grid grid-cols-1 md:grid-cols-2 gap-3">
                {cls.sections.map((sec) => {
                  const isMock = sec.id.startsWith('mock-');
                  return (
                    <div key={sec.id} className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-[12.5px] font-bold text-[var(--tx)]">{cls.name} — {sec.name}</div>
                          <div className="text-[11px] text-[var(--tx3)]">{sec.students} students enrolled · Capacity: {sec.capacity || 40}</div>
                        </div>
                        {!isMock && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setErrorMsg(null); setSelectedSubjects(sec.subjects); const existingCustom = sec.subjects.filter(s => !ALL_SUBJECTS.includes(s)); setCustomSubjects(existingCustom); setCustomSubjectInput(''); setEditSectionData({ classId: cls.id, section: sec }); }}
                              className="p-1.5 rounded-lg text-[var(--tx3)] hover:text-[var(--blue-tx)] hover:bg-[var(--blue-bg)] cursor-pointer transition-colors"
                              title="Edit Section"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => { setErrorMsg(null); setDeleteConfirmSection(sec); }}
                              className="p-1.5 rounded-lg text-[var(--tx3)] hover:text-[var(--red-tx)] hover:bg-[var(--red-bg)] cursor-pointer transition-colors"
                              title="Delete Section"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                    {/* Class Teacher */}
                    <div className="flex items-center justify-between bg-[var(--surf)] rounded-lg p-2.5 mb-3">
                      <div>
                        <div className="text-[10.5px] text-[var(--tx3)] mb-0.5">Class Teacher</div>
                        <div className="text-[12px] font-semibold text-[var(--tx)]">{sec.classTeacher}</div>
                      </div>
                      <button
                        onClick={() => setShowAssignTeacher(sec)}
                        className="text-[11px] text-[var(--blue-tx)] hover:underline cursor-pointer font-medium"
                      >
                        Reassign
                      </button>
                    </div>

                    {/* Subjects */}
                    <div>
                      <div className="text-[10.5px] text-[var(--tx3)] mb-1.5">Assigned Subjects</div>
                      <div className="flex flex-wrap gap-1.5">
                        {sec.subjects.map((sub) => (
                          <span key={sub} className="px-2 py-0.5 bg-[var(--blue-bg)] text-[var(--blue-tx)] rounded-full text-[10.5px] font-medium">{sub}</span>
                        ))}
                      </div>
                    </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add Section Modal */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddSection} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[420px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">Add New Section</div>
              <button type="button" onClick={() => setShowAddSection(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class * (Select or Type Manually)</label>
                <input
                  name="className"
                  list="class-list"
                  required
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  placeholder="e.g. 8 or 11"
                />
                <datalist id="class-list">
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </datalist>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Section Name *</label>
                <input name="sectionName" required className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Section C" />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Capacity *</label>
                <input
                  name="capacity"
                  required
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onKeyDown={handleNumberKeyDown}
                  onInput={handleNumberInput}
                  defaultValue="40"
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  placeholder="e.g. 40"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class Teacher</label>
                <select name="teacherId" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                  <option value="">Select teacher</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Select Subjects</label>
                {/* Manual subject entry */}
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = customSubjectInput.trim();
                        if (val && !ALL_SUBJECTS.includes(val) && !customSubjects.includes(val)) {
                          setCustomSubjects([...customSubjects, val]);
                          if (!selectedSubjects.includes(val)) setSelectedSubjects([...selectedSubjects, val]);
                        }
                        setCustomSubjectInput('');
                      }
                    }}
                    placeholder="Type subject name & press + or Enter"
                    className="flex-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[11.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)] placeholder:text-[var(--tx3)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = customSubjectInput.trim();
                      if (val && !ALL_SUBJECTS.includes(val) && !customSubjects.includes(val)) {
                        setCustomSubjects([...customSubjects, val]);
                        if (!selectedSubjects.includes(val)) setSelectedSubjects([...selectedSubjects, val]);
                      }
                      setCustomSubjectInput('');
                    }}
                    className="px-3 py-1.5 bg-[var(--blue)] text-white rounded-lg text-[12px] font-bold cursor-pointer hover:opacity-90 flex items-center"
                  >+</button>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-[var(--surf2)] border border-[var(--b)] rounded-lg p-2.5 max-h-[150px] overflow-y-auto">
                  {ALL_SUBJECTS.map((sub) => (
                    <label key={sub} className="flex items-center gap-2 text-[11px] text-[var(--tx2)] cursor-pointer">
                      <input
                        type="checkbox"
                        value={sub}
                        checked={selectedSubjects.includes(sub)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubjects([...selectedSubjects, sub]);
                          } else {
                            setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
                          }
                        }}
                        className="rounded border-[var(--b)] text-[var(--blue)] focus:ring-0 cursor-pointer"
                      />
                      {sub}
                    </label>
                  ))}
                  {customSubjects.map((sub) => (
                    <div key={sub} className="flex items-center gap-1.5">
                      <label className="flex items-center gap-2 text-[11px] text-[var(--blue-tx)] font-medium cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          value={sub}
                          checked={selectedSubjects.includes(sub)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubjects([...selectedSubjects, sub]);
                            } else {
                              setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
                            }
                          }}
                          className="rounded border-[var(--b)] text-[var(--blue)] focus:ring-0 cursor-pointer"
                        />
                        {sub}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomSubjects(customSubjects.filter(s => s !== sub));
                          setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
                        }}
                        className="text-[var(--tx3)] hover:text-[var(--red-tx)] cursor-pointer"
                        title="Remove custom subject"
                      ><X size={10} /></button>
                    </div>
                  ))}
                </div>
              </div>
              
              {errorMsg && (
                <div className="p-3 bg-[var(--red-bg)] border border-[var(--red-tx)]/10 text-[var(--red-tx)] rounded-xl text-[11.5px] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button type="button" onClick={() => setShowAddSection(false)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer">Add Section</button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showAssignTeacher && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Assign Class Teacher</div>
                <div className="text-[12px] text-[var(--tx3)]">{showAssignTeacher.name}</div>
              </div>
              <button onClick={() => setShowAssignTeacher(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-2 max-h-[300px] overflow-y-auto">
              {teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => handleAssignTeacher(teacher.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    showAssignTeacher.classTeacherId === String(teacher.id)
                      ? 'border-[var(--blue)] bg-[var(--blue-bg)]'
                      : 'border-[var(--b)] bg-[var(--surf2)] hover:bg-[var(--surf3)]'
                  }`}
                >
                  <span className={`text-[12.5px] font-medium ${showAssignTeacher.classTeacherId === String(teacher.id) ? 'text-[var(--blue-tx)]' : 'text-[var(--tx)]'}`}>{teacher.name}</span>
                  {showAssignTeacher.classTeacherId === String(teacher.id) && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="var(--blue-tx)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  )}
                </button>
              ))}
            </div>
            <div className="p-5 pt-0">
              <button onClick={() => setShowAssignTeacher(null)} className="w-full py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmSection && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-955/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-base font-bold text-[var(--tx)] mb-2">Delete Section</h3>
              <p className="text-xs text-[var(--tx3)] mb-6">Are you sure you want to delete this section? This action cannot be undone.</p>
              
              {deleteConfirmSection.realStudents !== undefined && deleteConfirmSection.realStudents > 0 && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 rounded-xl text-[12px] text-left flex flex-col gap-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Enrolled Students Alert
                  </div>
                  <p className="text-[11.5px] leading-relaxed">
                    There are <strong>{deleteConfirmSection.realStudents}</strong> students currently enrolled in this section. Deleting it will leave these students without a class section assignment.
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="mb-4 p-3 bg-[var(--red-bg)] border border-[var(--red-tx)]/10 text-[var(--red-tx)] rounded-xl text-[11.5px] text-left flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => { setDeleteConfirmSection(null); setErrorMsg(null); }}
                  disabled={deleting}
                  className="flex-1 py-2 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleDeleteSection}
                  disabled={deleting}
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl text-[12px] font-semibold hover:bg-red-700 cursor-pointer disabled:opacity-70 flex items-center justify-center gap-1.5"
                >
                  {deleting && <Loader2 size={12} className="animate-spin" />}
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {editSectionData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleEditSectionSubmit} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[420px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">Edit Class / Section</div>
              <button type="button" onClick={() => setEditSectionData(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class * (Select or Type Manually)</label>
                <input
                  name="className"
                  list="class-list"
                  required
                  defaultValue={editSectionData.classId}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  placeholder="e.g. 8 or 11"
                />
                <datalist id="class-list">
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </datalist>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Section Name *</label>
                <input
                  name="sectionName"
                  required
                  defaultValue={editSectionData.section.name}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  placeholder="Section C"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Capacity *</label>
                <input
                  name="capacity"
                  required
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onKeyDown={handleNumberKeyDown}
                  onInput={handleNumberInput}
                  defaultValue={editSectionData.section.capacity || 40}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  placeholder="e.g. 40"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class Teacher</label>
                <select
                  name="teacherId"
                  defaultValue={editSectionData.section.classTeacherId || ''}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none"
                >
                  <option value="">Select teacher</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Select Subjects</label>
                {/* Manual subject entry */}
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = customSubjectInput.trim();
                        if (val && !ALL_SUBJECTS.includes(val) && !customSubjects.includes(val)) {
                          setCustomSubjects([...customSubjects, val]);
                          if (!selectedSubjects.includes(val)) setSelectedSubjects([...selectedSubjects, val]);
                        }
                        setCustomSubjectInput('');
                      }
                    }}
                    placeholder="Type subject name & press + or Enter"
                    className="flex-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[11.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)] placeholder:text-[var(--tx3)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = customSubjectInput.trim();
                      if (val && !ALL_SUBJECTS.includes(val) && !customSubjects.includes(val)) {
                        setCustomSubjects([...customSubjects, val]);
                        if (!selectedSubjects.includes(val)) setSelectedSubjects([...selectedSubjects, val]);
                      }
                      setCustomSubjectInput('');
                    }}
                    className="px-3 py-1.5 bg-[var(--blue)] text-white rounded-lg text-[12px] font-bold cursor-pointer hover:opacity-90 flex items-center"
                  >+</button>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-[var(--surf2)] border border-[var(--b)] rounded-lg p-2.5 max-h-[150px] overflow-y-auto">
                  {ALL_SUBJECTS.map((sub) => (
                    <label key={sub} className="flex items-center gap-2 text-[11px] text-[var(--tx2)] cursor-pointer">
                      <input
                        type="checkbox"
                        value={sub}
                        checked={selectedSubjects.includes(sub)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubjects([...selectedSubjects, sub]);
                          } else {
                            setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
                          }
                        }}
                        className="rounded border-[var(--b)] text-[var(--blue)] focus:ring-0 cursor-pointer"
                      />
                      {sub}
                    </label>
                  ))}
                  {customSubjects.map((sub) => (
                    <div key={sub} className="flex items-center gap-1.5">
                      <label className="flex items-center gap-2 text-[11px] text-[var(--blue-tx)] font-medium cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          value={sub}
                          checked={selectedSubjects.includes(sub)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubjects([...selectedSubjects, sub]);
                            } else {
                              setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
                            }
                          }}
                          className="rounded border-[var(--b)] text-[var(--blue)] focus:ring-0 cursor-pointer"
                        />
                        {sub}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomSubjects(customSubjects.filter(s => s !== sub));
                          setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
                        }}
                        className="text-[var(--tx3)] hover:text-[var(--red-tx)] cursor-pointer"
                        title="Remove custom subject"
                      ><X size={10} /></button>
                    </div>
                  ))}
                </div>
              </div>
              
              {errorMsg && (
                <div className="p-3 bg-[var(--red-bg)] border border-[var(--red-tx)]/10 text-[var(--red-tx)] rounded-xl text-[11.5px] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button type="button" onClick={() => setEditSectionData(null)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
