import { useState } from 'react';
import { Plus, Edit2, X, BookOpen, Users, User } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

interface ClassData {
  id: string;
  name: string;
  sections: SectionData[];
}

interface SectionData {
  id: string;
  name: string;
  classTeacher: string;
  students: number;
  subjects: string[];
}

const CLASSES: ClassData[] = [
  {
    id: '6', name: 'Class 6',
    sections: [
      { id: '6A', name: 'Section A', classTeacher: 'Mr. Venkat Rao', students: 38, subjects: ['Maths', 'Science', 'English', 'Telugu', 'Hindi', 'Social', 'EVS'] },
      { id: '6B', name: 'Section B', classTeacher: 'Mrs. Savitha Kumar', students: 35, subjects: ['Maths', 'Science', 'English', 'Telugu', 'Hindi', 'Social', 'EVS'] },
    ],
  },
  {
    id: '7', name: 'Class 7',
    sections: [
      { id: '7A', name: 'Section A', classTeacher: 'Mr. Raju Sharma', students: 40, subjects: ['Maths', 'Science', 'English', 'Telugu', 'Hindi', 'Social'] },
      { id: '7B', name: 'Section B', classTeacher: 'Mrs. Suma Reddy', students: 37, subjects: ['Maths', 'Science', 'English', 'Telugu', 'Hindi', 'Social'] },
    ],
  },
  {
    id: '8', name: 'Class 8',
    sections: [
      { id: '8A', name: 'Section A', classTeacher: 'Mrs. Lakshmi Devi', students: 42, subjects: ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'Telugu', 'Social'] },
      { id: '8B', name: 'Section B', classTeacher: 'Mr. Prakash Nair', students: 39, subjects: ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'Telugu', 'Social'] },
    ],
  },
  {
    id: '9', name: 'Class 9',
    sections: [
      { id: '9A', name: 'Section A', classTeacher: 'Mrs. Radha Krishnan', students: 44, subjects: ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'Telugu', 'Social'] },
      { id: '9B', name: 'Section B', classTeacher: 'Mr. Venkat Rao', students: 41, subjects: ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'Telugu', 'Social'] },
    ],
  },
  {
    id: '10', name: 'Class 10',
    sections: [
      { id: '10A', name: 'Section A', classTeacher: 'Mrs. Lakshmi Devi', students: 48, subjects: ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'Telugu', 'Social'] },
    ],
  },
];

export function Classes() {
  const [expandedClass, setExpandedClass] = useState<string | null>('8');
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAssignTeacher, setShowAssignTeacher] = useState<SectionData | null>(null);

  const totalSections = CLASSES.reduce((s, c) => s + c.sections.length, 0);
  const totalStudents = CLASSES.reduce((s, c) => s + c.sections.reduce((ss, sec) => ss + sec.students, 0), 0);

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="Total Classes" value={CLASSES.length} sub="Academic year 2025-26" icon={<BookOpen size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Total Sections" value={totalSections} sub="Across all classes" icon={<BookOpen size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Total Students" value={totalStudents} sub="All classes combined" icon={<Users size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
        <KPICard label="Avg Class Size" value={Math.round(totalStudents / totalSections)} sub="Students per section" icon={<User size={15} />} iconBg="var(--purple-bg)" iconColor="var(--purple-tx)" />
      </div>

      {/* Header actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] font-semibold text-[var(--tx)]">Class & Section Management</div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[var(--b)] bg-[var(--surf)] rounded-lg cursor-pointer hover:bg-[var(--surf2)]">
            <Plus size={12} /> Add Class
          </button>
          <button onClick={() => setShowAddSection(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90">
            <Plus size={12} /> Add Section
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {CLASSES.map((cls) => (
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
                  <Badge key={sec.id} variant="blue">{sec.id}</Badge>
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
                      <button className="p-1 rounded-lg text-[var(--tx3)] hover:bg-[var(--surf3)] cursor-pointer"><Edit2 size={13} /></button>
                    </div>

                    {/* Class Teacher */}
                    <div className="flex items-center justify-between bg-[var(--surf)] rounded-lg p-2.5 mb-3">
                      <div>
                        <div className="text-[10.5px] text-[var(--tx3)] mb-0.5">Class Teacher</div>
                        <div className="text-[12px] font-semibold text-[var(--tx)]">{sec.classTeacher}</div>
                      </div>
                      <button
                        onClick={() => setShowAssignTeacher(sec)}
                        className="text-[11px] text-[var(--blue-tx)] hover:underline cursor-pointer"
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
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[420px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">Add New Section</div>
              <button onClick={() => setShowAddSection(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class *</label>
                <select className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                  {CLASSES.map((c) => <option key={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Section Name *</label>
                <input className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Section C" />
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class Teacher</label>
                <select className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                  <option>Select teacher</option>
                  {['Mrs. Lakshmi Devi', 'Mr. Venkat Rao', 'Mrs. Suma Reddy', 'Mr. Raju Sharma'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Max Capacity</label>
                <input type="number" defaultValue="45" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setShowAddSection(false)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button onClick={() => setShowAddSection(false)} className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer">Add Section</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showAssignTeacher && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Assign Class Teacher</div>
                <div className="text-[12px] text-[var(--tx3)]">{showAssignTeacher.id}</div>
              </div>
              <button onClick={() => setShowAssignTeacher(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-2">
              {['Mrs. Lakshmi Devi', 'Mr. Venkat Rao', 'Mrs. Suma Reddy', 'Mr. Raju Sharma', 'Mrs. Savitha Kumar'].map((teacher) => (
                <button
                  key={teacher}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    showAssignTeacher.classTeacher === teacher
                      ? 'border-[var(--blue)] bg-[var(--blue-bg)]'
                      : 'border-[var(--b)] bg-[var(--surf2)] hover:bg-[var(--surf3)]'
                  }`}
                >
                  <span className={`text-[12.5px] font-medium ${showAssignTeacher.classTeacher === teacher ? 'text-[var(--blue-tx)]' : 'text-[var(--tx)]'}`}>{teacher}</span>
                  {showAssignTeacher.classTeacher === teacher && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="var(--blue-tx)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  )}
                </button>
              ))}
            </div>
            <div className="p-5 pt-0">
              <button onClick={() => setShowAssignTeacher(null)} className="w-full py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer">Confirm Assignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
