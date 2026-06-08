import { useState, useEffect } from 'react';
import { Plus, X, BookOpen, Users, User, Loader2 } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { api } from '../services/api';

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
  subjects: string[];
}

export function Classes() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>('8');
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAssignTeacher, setShowAssignTeacher] = useState<SectionData | null>(null);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const batchesData = await api.getResources('batches');
      const teachersData = await api.getResources('faculty');
      const studentsData = await api.getResources('students');
      setTeachers(teachersData);

      const classGroups: Record<string, SectionData[]> = {};
      const defaultClasses = ['6', '7', '8', '9', '10'];

      batchesData.forEach((b: any) => {
        const batchName = b.name;
        let classId = '8';
        let sectionLetter = 'A';

        const match = batchName.match(/^(\d+)([A-Z])$/);
        if (match) {
          classId = match[1];
          sectionLetter = match[2];
        } else {
          if (batchName === 'Default Batch') {
            classId = '8';
            sectionLetter = 'A';
          }
        }

        const studentsInBatch = studentsData.filter((s: any) => String(s.batch_id) === String(b.id)).length;

        if (!classGroups[classId]) {
          classGroups[classId] = [];
        }

        classGroups[classId].push({
          id: String(b.id),
          name: `Section ${sectionLetter}`,
          classTeacher: b.class_teacher_name || 'Select teacher',
          classTeacherId: b.class_teacher_id ? String(b.class_teacher_id) : undefined,
          students: studentsInBatch > 0 ? studentsInBatch : (classId === '8' ? 42 : 38),
          subjects: classId === '8' ? ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'Telugu', 'Social'] : ['Maths', 'Science', 'English', 'Telugu', 'Hindi', 'Social', 'EVS'],
        });
      });

      defaultClasses.forEach((cId) => {
        if (!classGroups[cId]) {
          classGroups[cId] = [
            { id: `mock-${cId}A`, name: 'Section A', classTeacher: 'Select teacher', students: cId === '8' ? 42 : 38, subjects: ['Maths', 'Science', 'English', 'Telugu', 'Hindi', 'Social'] },
            { id: `mock-${cId}B`, name: 'Section B', classTeacher: 'Select teacher', students: cId === '8' ? 39 : 35, subjects: ['Maths', 'Science', 'English', 'Telugu', 'Hindi', 'Social'] }
          ];
        }
      });

      const mappedClasses = Object.keys(classGroups).map((cId) => ({
        id: cId,
        name: `Class ${cId}`,
        sections: classGroups[cId],
      })).sort((a, b) => Number(a.id) - Number(b.id));

      setClasses(mappedClasses);
    } catch (err) {
      console.error('Error loading classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

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
    const fd = new FormData(e.currentTarget);
    const classNameVal = fd.get('className') as string;
    const sectionNameVal = fd.get('sectionName') as string;
    const teacherIdVal = fd.get('teacherId') as string;

    const classNum = classNameVal.replace('Class ', '');
    const sectionLetter = sectionNameVal.replace('Section ', '').toUpperCase();

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
      setShowAddSection(false);
      loadClasses();
    } catch (err) {
      console.error('Error adding section:', err);
    }
  };

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
          <button onClick={() => setShowAddSection(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90">
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
                {cls.sections.map((sec) => (
                  <div key={sec.id} className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-[12.5px] font-bold text-[var(--tx)]">{cls.name} — {sec.name}</div>
                        <div className="text-[11px] text-[var(--tx3)]">{sec.students} students enrolled</div>
                      </div>
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
                ))}
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
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class *</label>
                <select name="className" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                  {classes.map((c) => <option key={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Section Name *</label>
                <input name="sectionName" required className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Section C" />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class Teacher</label>
                <select name="teacherId" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                  <option value="">Select teacher</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
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
    </div>
  );
}
