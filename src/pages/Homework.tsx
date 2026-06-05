import { useState } from 'react';
import { Plus, X, BookOpen, Clock, CheckCircle, Paperclip } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

const HOMEWORK = [
  { id: '1', subject: 'Mathematics', class: '8A', title: 'Exercise 3 — Fractions', description: 'Complete problems 1-20 from page 42. Show all working.', dueDate: '2026-06-07', assignedDate: '2026-06-05', hasAttachment: false, submissionsReceived: 28, totalStudents: 38 },
  { id: '2', subject: 'Mathematics', class: '8B', title: 'Linear Equations Practice', description: 'Solve all problems on worksheet attached.', dueDate: '2026-06-08', assignedDate: '2026-06-05', hasAttachment: true, submissionsReceived: 15, totalStudents: 35 },
  { id: '3', subject: 'Mathematics', class: '9A', title: 'Quadratic Equations', description: 'Complete Chapter 4 exercises A and B.', dueDate: '2026-06-09', assignedDate: '2026-06-04', hasAttachment: false, submissionsReceived: 40, totalStudents: 44 },
  { id: '4', subject: 'Mathematics', class: '10A', title: 'Trigonometry Revision', description: 'Revise sin/cos/tan tables and complete given problems.', dueDate: '2026-06-06', assignedDate: '2026-06-03', hasAttachment: true, submissionsReceived: 48, totalStudents: 48 },
];

export function Homework() {
  const [showCreate, setShowCreate] = useState(false);

  const total = HOMEWORK.reduce((s, h) => s + h.submissionsReceived, 0);
  const totalStudents = HOMEWORK.reduce((s, h) => s + h.totalStudents, 0);

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="Assignments Posted" value={HOMEWORK.length} sub="This week" icon={<BookOpen size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Submissions" value={total} sub={`of ${totalStudents} total`} icon={<CheckCircle size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Pending Submission" value={totalStudents - total} sub="Students pending" icon={<Clock size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
        <KPICard label="Due Today" value={HOMEWORK.filter((h) => h.dueDate === '2026-06-06').length} sub="Assignments" icon={<Clock size={15} />} iconBg="var(--red-bg)" iconColor="var(--red-tx)" />
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="text-[13px] font-semibold text-[var(--tx)]">Homework Assignments</div>
          <button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90 w-full sm:w-auto">
            <Plus size={12} /> Create Homework
          </button>
        </div>

        <div className="space-y-3">
          {HOMEWORK.map((hw) => (
            <div key={hw.id} className="p-4 bg-[var(--surf2)] border border-[var(--b)] rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-bold text-[var(--tx)]">{hw.title}</span>
                    {hw.hasAttachment && (
                      <span className="flex items-center gap-0.5 text-[10.5px] text-[var(--tx3)]"><Paperclip size={10} /> Attachment</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--tx3)]">
                    <Badge variant="blue">{hw.subject}</Badge>
                    <span>Class {hw.class}</span>
                    <span>Due: {hw.dueDate}</span>
                  </div>
                </div>
                <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--b)]">
                  <div className="text-[12px] font-semibold text-[var(--tx)]">{hw.submissionsReceived}/{hw.totalStudents} <span className="sm:hidden text-[10.5px] font-normal text-[var(--tx3)]">submissions</span></div>
                  <div className="hidden sm:block text-[10.5px] text-[var(--tx3)]">submissions</div>
                </div>
              </div>
              <div className="text-[12px] text-[var(--tx2)] mb-3">{hw.description}</div>
              <div className="h-1.5 bg-[var(--surf)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(hw.submissionsReceived / hw.totalStudents) * 100}%`,
                    background: hw.submissionsReceived === hw.totalStudents ? 'var(--teal)' : 'var(--blue)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[460px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">Create Homework</div>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class *</label>
                  <select className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]">
                    {['8A', '8B', '9A', '10A'].map((c) => <option key={c}>Class {c}</option>)}
                  </select>
                </div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Subject *</label>
                  <input defaultValue="Mathematics" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Title *</label>
                <input className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="e.g. Exercise 3 — Fractions" />
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Description</label>
                <textarea className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none resize-none focus:border-[var(--blue)]" rows={3} placeholder="Homework instructions..." />
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Due Date *</label>
                <input type="date" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Attach Document (optional)</label>
                <div className="border-2 border-dashed border-[var(--b)] rounded-lg p-3 text-center cursor-pointer hover:border-[var(--blue)] transition-colors">
                  <div className="text-[11.5px] text-[var(--tx3)]">Upload worksheet, PDF, or image</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer">Post Homework</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
