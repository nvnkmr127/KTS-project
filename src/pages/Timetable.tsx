import { useState } from 'react';
import { X, Clock, Save } from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useApp, TIMETABLE_DAYS, TIMETABLE_PERIODS, PERIOD_TIMES } from '../context/AppContext';
import type { TimetablePeriod } from '../context/AppContext';

const CLASSES = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'];

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Telugu', 'Hindi', 'Social Studies', 'Physical Education', 'Computer Science', 'Art', 'Music', 'Library', 'Break'];

const TEACHERS = [
  { id: '2', name: 'Mrs. Lakshmi Devi' },
  { id: '7', name: 'Mr. Venkat Rao' },
  { id: '8', name: 'Mrs. Suma Reddy' },
  { id: '9', name: 'Mr. Raju Sharma' },
  { id: '10', name: 'Mrs. Savitha Kumar' },
  { id: '11', name: 'Mr. Prakash Nair' },
];

const ROOMS = ['Room 10', 'Room 11', 'Room 12', 'Room 13', 'Room 14', 'Room 15', 'Room 16', 'Room 17', 'Room 18', 'Lab 1', 'Lab 2', 'Sports Ground'];

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: 'var(--blue-bg)',
  Science: 'var(--teal-bg)',
  English: 'var(--purple-bg)',
  Telugu: 'var(--amber-bg)',
  Hindi: 'var(--coral-bg)',
  'Social Studies': 'var(--green-bg)',
  'Physical Education': 'var(--red-bg)',
  'Computer Science': 'var(--blue-bg)',
  Art: 'var(--pink-bg)',
  Music: 'var(--purple-bg)',
  Library: 'var(--teal-bg)',
  Break: 'var(--surf3)',
};

const SUBJECT_TEXT: Record<string, string> = {
  Mathematics: 'var(--blue-tx)',
  Science: 'var(--teal-tx)',
  English: 'var(--purple-tx)',
  Telugu: 'var(--amber-tx)',
  Hindi: 'var(--coral-tx)',
  'Social Studies': 'var(--green-tx)',
  'Physical Education': 'var(--red-tx)',
  'Computer Science': 'var(--blue-tx)',
  Art: 'var(--pink-tx)',
  Music: 'var(--purple-tx)',
  Library: 'var(--teal-tx)',
  Break: 'var(--tx3)',
};

interface EditCell {
  day: string;
  period: number;
  current: TimetablePeriod | null;
}

export function Timetable() {
  const { timetable, setTimetablePeriod } = useApp();
  const [selectedClass, setSelectedClass] = useState('8A');
  const [editCell, setEditCell] = useState<EditCell | null>(null);
  const [editSubject, setEditSubject] = useState('Mathematics');
  const [editTeacher, setEditTeacher] = useState(TEACHERS[0].id);
  const [editRoom, setEditRoom] = useState('Room 12');
  const [savedMsg, setSavedMsg] = useState(false);

  const classTimetable = timetable[selectedClass] ?? {};

  const openEdit = (day: string, period: number) => {
    const cell = classTimetable[day]?.[period] ?? null;
    setEditCell({ day, period, current: cell });
    setEditSubject(cell?.subject ?? 'Mathematics');
    setEditTeacher(cell?.teacherId ?? TEACHERS[0].id);
    setEditRoom(cell?.room ?? 'Room 12');
  };

  const saveCell = () => {
    if (!editCell) return;
    const teacher = TEACHERS.find((t) => t.id === editTeacher);
    setTimetablePeriod(selectedClass, editCell.day, editCell.period, {
      subject: editSubject,
      teacher: teacher?.name ?? '',
      teacherId: editTeacher,
      room: editRoom,
    });
    setEditCell(null);
  };

  const clearCell = () => {
    if (!editCell) return;
    setTimetablePeriod(selectedClass, editCell.day, editCell.period, null);
    setEditCell(null);
  };

  const handleSaveAll = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const countFilledPeriods = () => {
    let count = 0;
    for (const day of TIMETABLE_DAYS) {
      for (let p = 0; p < TIMETABLE_PERIODS; p++) {
        if (classTimetable[day]?.[p]) count++;
      }
    }
    return count;
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center mb-3">
        <div className="flex items-center gap-3">
          <div className="text-[13px] font-semibold text-[var(--tx)]">Timetable Designer</div>
          <div className="flex gap-1 flex-wrap">
            {CLASSES.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-2.5 py-1 rounded-lg text-[11.5px] font-medium transition-all cursor-pointer ${
                  selectedClass === cls
                    ? 'bg-[var(--blue)] text-white'
                    : 'bg-[var(--surf2)] border border-[var(--b)] text-[var(--tx2)] hover:border-[var(--blue)] hover:text-[var(--blue-tx)]'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-[11.5px] text-[var(--teal-tx)] font-medium">Saved!</span>}
          <Badge variant="blue">{countFilledPeriods()} periods assigned</Badge>
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90"
          >
            <Save size={12} /> Save Timetable
          </button>
        </div>
      </div>

      {/* Timetable Grid */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11.5px]" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th className="w-[90px] text-left text-[10.5px] font-semibold text-[var(--tx3)] px-3 py-2 border-b border-[var(--b)]">Period</th>
                {TIMETABLE_DAYS.map((day) => (
                  <th key={day} className="text-left text-[10.5px] font-semibold text-[var(--tx3)] px-2 py-2 border-b border-[var(--b)] border-l border-[var(--b)]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: TIMETABLE_PERIODS }, (_, p) => (
                <tr key={p} className="group">
                  <td className="px-3 py-1.5 border-b border-[var(--b)] align-top">
                    <div className="flex items-center gap-1 text-[10.5px] text-[var(--tx3)]">
                      <Clock size={9} />
                      <span className="font-medium">{PERIOD_TIMES[p]}</span>
                    </div>
                    <div className="text-[9.5px] text-[var(--tx3)] mt-0.5">Period {p + 1}</div>
                  </td>
                  {TIMETABLE_DAYS.map((day) => {
                    const cell = classTimetable[day]?.[p];
                    return (
                      <td key={day} className="px-1.5 py-1.5 border-b border-[var(--b)] border-l border-[var(--b)] align-top">
                        <button
                          onClick={() => openEdit(day, p)}
                          className="w-full min-h-[52px] rounded-lg p-1.5 text-left transition-all cursor-pointer border border-transparent hover:border-[var(--blue)] group/cell"
                          style={{
                            background: cell ? SUBJECT_COLORS[cell.subject] ?? 'var(--surf2)' : 'var(--surf2)',
                          }}
                        >
                          {cell ? (
                            <>
                              <div
                                className="text-[10.5px] font-semibold leading-tight"
                                style={{ color: SUBJECT_TEXT[cell.subject] ?? 'var(--tx)' }}
                              >
                                {cell.subject}
                              </div>
                              <div className="text-[9.5px] mt-0.5 opacity-80" style={{ color: SUBJECT_TEXT[cell.subject] ?? 'var(--tx3)' }}>
                                {cell.teacher.split(' ').slice(-1)[0]}
                              </div>
                              <div className="text-[9px] opacity-60" style={{ color: SUBJECT_TEXT[cell.subject] ?? 'var(--tx3)' }}>
                                {cell.room}
                              </div>
                            </>
                          ) : (
                            <div className="text-[9.5px] text-[var(--tx3)] opacity-0 group-hover/cell:opacity-100 transition-opacity pt-1 text-center">
                              + Add
                            </div>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2 px-1">
        {Object.entries(SUBJECT_COLORS).slice(0, 8).map(([subj, bg]) => (
          <div key={subj} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: bg }} />
            <span className="text-[10.5px] text-[var(--tx3)]">{subj}</span>
          </div>
        ))}
      </div>

      {/* Edit Period Modal */}
      {editCell && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[380px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[13.5px] font-bold text-[var(--tx)]">Edit Period</div>
                <div className="text-[11px] text-[var(--tx3)] mt-0.5">
                  {editCell.day} · {PERIOD_TIMES[editCell.period]} · Class {selectedClass}
                </div>
              </div>
              <button onClick={() => setEditCell(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Subject *</label>
                <select
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                >
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Teacher *</label>
                <select
                  value={editTeacher}
                  onChange={(e) => setEditTeacher(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                >
                  {TEACHERS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Room *</label>
                <select
                  value={editRoom}
                  onChange={(e) => setEditRoom(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                >
                  {ROOMS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              {editCell.current && (
                <button
                  onClick={clearCell}
                  className="px-3 py-2.5 border border-[var(--red-bg)] bg-[var(--red-bg)] text-[var(--red-tx)] rounded-xl text-[12px] cursor-pointer font-medium"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setEditCell(null)}
                className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveCell}
                className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer hover:opacity-90"
              >
                Save Period
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
