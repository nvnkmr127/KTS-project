import { useState, useEffect } from 'react';
import { X, Clock, Save, Loader2 } from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useApp, TIMETABLE_DAYS } from '../context/AppContext';
import type { TimetablePeriod, PeriodTiming } from '../context/AppContext';
import { api } from '../services/api';
import { STAFF } from './StaffManagement';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Telugu', 'Hindi', 'Social Studies', 'Physical Education', 'Computer Science', 'Art', 'Music', 'Library', 'Break'];

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
  const { timetable, setTimetablePeriod, periodTimings, savePeriodTimings } = useApp();
  const [selectedClass, setSelectedClass] = useState('8A');
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [editCell, setEditCell] = useState<EditCell | null>(null);
  const [editSubject, setEditSubject] = useState('Mathematics');
  const [editTeacher, setEditTeacher] = useState('');
  const [editRoom, setEditRoom] = useState('Room 12');
  const [savedMsg, setSavedMsg] = useState(false);
  const [classes, setClasses] = useState<string[]>(['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B']);
  const [showEditTimings, setShowEditTimings] = useState(false);
  const [tempTimings, setTempTimings] = useState<PeriodTiming[]>([]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const resignedNames = new Set<string>();
        try {
          const s = localStorage.getItem('kts_staff_members');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (s) JSON.parse(s).filter((x: any) => x?.status === 'Resigned' && x.name)
                   // eslint-disable-next-line @typescript-eslint/no-explicit-any
                   .forEach((x: any) => resignedNames.add(x.name.toLowerCase().trim()));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch { /* empty */ }

        let activeTeachers: any[] = [];
        try {
          const s = localStorage.getItem('kts_staff_members');
          if (s) activeTeachers = JSON.parse(s)
            .filter((x: any) => {
              if (!x?.id || !x.name || x.status === 'Resigned') return false;
              const cat = (x.category || 'Teaching').toString().trim().toLowerCase();
              const desig = (x.designation || '').toString().trim().toLowerCase();
              if (cat === 'non-teaching' || cat.includes('non-teach')) return false;
              const nonTeachingCategories = ['driver', 'cleaner', 'watchman', 'house keeping', 'housekeeping'];
              if (nonTeachingCategories.includes(cat)) return false;
              return cat === 'teaching' || cat.includes('teach') || desig.includes('teacher');
            })
            .map((x: any) => ({ id: String(x.id), name: x.name }));
        } catch { /* empty */ }

        if (activeTeachers.length === 0) {
          try {
            const facultyData = await api.getResources('faculty');
            activeTeachers = (facultyData || []).filter((t: any) => {
              if ((t.status || '').toLowerCase() === 'inactive') return false;
              if (t.name && resignedNames.has(t.name.toLowerCase().trim())) return false;
              const cat = (t.category || 'Teaching').toString().trim().toLowerCase();
              const desig = (t.designation || '').toString().trim().toLowerCase();
              if (cat === 'non-teaching' || cat.includes('non-teach')) return false;
              const nonTeachingCategories = ['driver', 'cleaner', 'watchman', 'house keeping', 'housekeeping'];
              if (nonTeachingCategories.includes(cat)) return false;
              return cat === 'teaching' || cat.includes('teach') || desig.includes('teacher');
            });
          } catch { /* empty */ }
        }

        if (activeTeachers.length === 0) {
          activeTeachers = STAFF.filter(s => s.status !== 'Resigned')
            .map(s => ({ id: String(s.id), name: s.name }));
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list = activeTeachers.map((t: any) => ({
          id: String(t.id),
          name: t.name,
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTeachers(list);
        if (list.length > 0) {
          setEditTeacher(list[0].id);
        }

        const batchesDataRes = await api.getResources('batches').catch(() => []);
        const allBatches = Array.isArray(batchesDataRes) ? batchesDataRes : (batchesDataRes?.data || []);
        
        const classGroups: Record<string, string[]> = {};
        const defaultClasses = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allBatches.forEach((b: any) => {
          const batchName = b.name;
          let classId = '8';
          let sectionLetter = 'A';

          const match = batchName.match(/^(.+?)([A-Z])$/);
          if (match) {
            classId = match[1];
            sectionLetter = match[2];
          } else {
            if (batchName === 'Default Batch') { classId = '8'; sectionLetter = 'A'; }
            else {
               classId = batchName;
               sectionLetter = '';
            }
          }

          if (!classGroups[classId]) classGroups[classId] = [];
          if (sectionLetter && !classGroups[classId].includes(sectionLetter)) {
             classGroups[classId].push(sectionLetter);
          }
        });

        defaultClasses.forEach((cId) => {
          if (!classGroups[cId] || classGroups[cId].length === 0) {
            classGroups[cId] = ['A', 'B'];
          }
        });

        const names: string[] = [];
        Object.keys(classGroups).sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) {
            if (numA !== numB) return numA - numB;
            return a.localeCompare(b);
          }
          if (!isNaN(numA)) return -1;
          if (!isNaN(numB)) return 1;
          return a.localeCompare(b);
        }).forEach(cId => {
          if (classGroups[cId].length === 0) {
             names.push(cId);
          } else {
             classGroups[cId].sort().forEach(sec => {
                names.push(`${cId}${sec}`);
             });
          }
        });

        setClasses(names);
        if (names.length > 0 && !names.includes(selectedClass)) {
          setSelectedClass(names[0]);
        }
      } catch (err) {
        console.error('Error loading timetable initial data:', err);
      }
    }
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const classTimetable = timetable[selectedClass] ?? {};

  const openEdit = (day: string, period: number) => {
    const cell = classTimetable[day]?.[period] ?? null;
    setEditCell({ day, period, current: cell });
    setEditSubject(cell?.subject ?? 'Mathematics');
    
    // Get list of available teachers for this cell (not busy in other classes)
    const available = teachers.filter(t => {
      const isBusy = Object.keys(timetable).some(clsId => {
        if (clsId === selectedClass) return false;
        const c = timetable[clsId]?.[day]?.[period];
        return c && String(c.teacherId) === String(t.id);
      });
      return !isBusy;
    });

    setEditTeacher(cell?.teacherId ?? (available[0]?.id || ''));
    setEditRoom(cell?.room ?? 'Room 12');
  };

  const saveCell = () => {
    if (!editCell) return;
    const teacher = teachers.find((t) => t.id === editTeacher);
    setTimetablePeriod(selectedClass, editCell.day, editCell.period, {
      subject: editSubject,
      teacher: teacher?.name ?? '',
      teacherId: editTeacher,
      room: editRoom,
    });
    setEditCell(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clearCell = () => {
    if (!editCell) return;
    setTimetablePeriod(selectedClass, editCell.day, editCell.period, null);
    setEditCell(null);
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const slots: any[] = [];
      for (const day of TIMETABLE_DAYS) {
        for (let p = 0; p < periodTimings.length; p++) {
          if (periodTimings[p].isBreak) continue;
          const cell = classTimetable[day]?.[p];
          if (cell) {
            slots.push({
              subject: cell.subject,
              teacher: cell.teacher,
              teacherId: cell.teacherId,
              room: cell.room,
              period: p,
              day: day,  // Send day name (e.g., 'Monday') instead of a specific date
            });
          }
        }
      }

      await api.createResource('timetable', {
        batch_name: selectedClass,
        slots: slots
      });

      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch (err) {
      console.error('Error saving timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  const countFilledPeriods = () => {
    let count = 0;
    for (const day of TIMETABLE_DAYS) {
      for (let p = 0; p < periodTimings.length; p++) {
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
            {classes.map((cls) => (
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
          {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
          {savedMsg && <span className="text-[11.5px] text-[var(--teal-tx)] font-medium">Saved!</span>}
          <Badge variant="blue">{countFilledPeriods()} periods assigned</Badge>
          <button
            onClick={() => { setTempTimings([...periodTimings]); setShowEditTimings(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[var(--b)] bg-[var(--surf2)] text-[var(--tx2)] rounded-lg cursor-pointer hover:border-[var(--blue)] hover:text-[var(--blue-tx)]"
          >
            <Clock size={12} /> Edit Timings
          </button>
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
                <th className="w-[90px] text-left text-[11.5px] font-semibold text-[var(--tx2)] px-3 py-2 border-b border-[var(--b)]">Period</th>
                {TIMETABLE_DAYS.map((day) => (
                  <th key={day} className="text-left text-[11.5px] font-semibold text-[var(--tx2)] px-2 py-2 border-b border-[var(--b)] border-l border-[var(--b)]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periodTimings.map((timing, p) => {
                if (timing.isBreak) {
                  return (
                    <tr key={p} className="bg-[var(--surf3)]/10">
                      <td className="px-3 py-2.5 border-b border-[var(--b)] align-middle">
                        <div className="flex items-center gap-1 text-[11.5px] text-[var(--tx2)]">
                          <Clock size={10} />
                          <span className="font-semibold">{timing.start} - {timing.end}</span>
                        </div>
                        <div className="text-[11px] text-[var(--tx2)] font-semibold mt-0.5">{timing.label || 'Break'}</div>
                      </td>
                      <td colSpan={TIMETABLE_DAYS.length} className="px-3 py-2.5 border-b border-[var(--b)] border-l border-[var(--b)] align-middle text-center font-bold text-[11px] text-[var(--tx2)] tracking-wider">
                        {timing.label?.toUpperCase() || 'BREAK'}
                      </td>
                    </tr>
                  );
                }

                const displayPeriodIndex = periodTimings.slice(0, p).filter(t => !t.isBreak).length + 1;

                return (
                  <tr key={p} className="group">
                    <td className="px-3 py-1.5 border-b border-[var(--b)] align-top">
                      <div className="flex items-center gap-1 text-[11.5px] text-[var(--tx2)]">
                        <Clock size={10} />
                        <span className="font-medium">{timing.start} - {timing.end}</span>
                      </div>
                      <div className="text-[11px] text-[var(--tx2)] mt-0.5">Period {displayPeriodIndex}</div>
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
                                  className="text-[11.5px] font-semibold leading-tight"
                                  style={{ color: SUBJECT_TEXT[cell.subject] ?? 'var(--tx)' }}
                                >
                                  {cell.subject}
                                </div>
                                <div className="text-[11px] mt-0.5" style={{ color: SUBJECT_TEXT[cell.subject] ?? 'var(--tx2)' }}>
                                  {cell.teacher.split(' ').slice(-1)[0]}
                                </div>
                                <div className="text-[10.5px] mt-0.5" style={{ color: SUBJECT_TEXT[cell.subject] ?? 'var(--tx3)' }}>
                                  {cell.room}
                                </div>
                              </>
                            ) : (
                              <div className="text-[11px] text-[var(--tx2)] opacity-0 group-hover/cell:opacity-100 transition-opacity pt-1 text-center">
                                + Add
                              </div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
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
                  {editCell.day} · {periodTimings[editCell.period]?.start} - {periodTimings[editCell.period]?.end} · Class {selectedClass}
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
                  {teachers.filter(t => {
                    if (!editCell) return true;
                    const isBusy = Object.keys(timetable).some(clsId => {
                      if (clsId === selectedClass) return false;
                      const cell = timetable[clsId]?.[editCell.day]?.[editCell.period];
                      return cell && String(cell.teacherId) === String(t.id);
                    });
                    return !isBusy;
                  }).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
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

      {/* Edit Timings Modal */}
      {showEditTimings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              savePeriodTimings(tempTimings);
              setShowEditTimings(false);
            }}
            className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Edit Period Timings</div>
                <div className="text-[11.5px] text-[var(--tx3)]">Set start and end times for each period</div>
              </div>
              <button type="button" onClick={() => setShowEditTimings(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[350px] overflow-y-auto border-b border-[var(--b)]">
              {tempTimings.map((t, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-3 bg-[var(--surf2)]/20 border border-[var(--b)]/60 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-semibold text-[var(--tx2)]">
                      {t.isBreak ? 'Break' : `Period`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={t.isBreak ? 'break' : 'period'}
                        onChange={(e) => {
                          const isBrk = e.target.value === 'break';
                          const newT = [...tempTimings];
                          newT[idx] = {
                            ...newT[idx],
                            isBreak: isBrk,
                            label: isBrk ? (newT[idx].label || 'Break') : undefined
                          };
                          setTempTimings(newT);
                        }}
                        className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2 py-1 text-[11px] text-[var(--tx)] outline-none cursor-pointer font-medium"
                      >
                        <option value="period">Period</option>
                        <option value="break">Break</option>
                      </select>
                      {t.isBreak && (
                        <input
                          type="text"
                          value={t.label || 'Break'}
                          onChange={(e) => {
                            const newT = [...tempTimings];
                            newT[idx] = { ...newT[idx], label: e.target.value };
                            setTempTimings(newT);
                          }}
                          placeholder="Label (e.g. Lunch)"
                          className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1 text-[11px] text-[var(--tx)] outline-none w-28"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={t.start}
                      onChange={(e) => {
                        const newT = [...tempTimings];
                        newT[idx] = { ...newT[idx], start: e.target.value };
                        setTempTimings(newT);
                      }}
                      required
                      placeholder="Start e.g. 8:00 AM"
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1 text-[11.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                    />
                    <span className="text-[11.5px] text-[var(--tx3)]">to</span>
                    <input
                      type="text"
                      value={t.end}
                      onChange={(e) => {
                        const newT = [...tempTimings];
                        newT[idx] = { ...newT[idx], end: e.target.value };
                        setTempTimings(newT);
                      }}
                      required
                      placeholder="End e.g. 9:00 AM"
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1 text-[11.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center px-5 py-2.5 bg-[var(--surf2)]/10 border-b border-[var(--b)]">
              <button
                type="button"
                onClick={() => {
                  const lastTiming = tempTimings[tempTimings.length - 1];
                  let nextStart = '4:00 PM';
                  let nextEnd = '5:00 PM';
                  if (lastTiming) {
                    nextStart = lastTiming.end;
                    // simple parsing to add 1 hour to end time
                    const match = lastTiming.end.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
                    if (match) {
                      let hour = parseInt(match[1]) + 1;
                      let ampm = match[3].toUpperCase();
                      if (hour > 12) {
                        hour = hour - 12;
                      } else if (hour === 12) {
                        ampm = ampm === 'AM' ? 'PM' : 'AM';
                      }
                      nextEnd = `${hour}:${match[2]} ${ampm}`;
                    }
                  }
                  setTempTimings([...tempTimings, { start: nextStart, end: nextEnd }]);
                }}
                className="text-[12px] text-[var(--blue-tx)] hover:underline cursor-pointer font-medium flex items-center gap-1"
              >
                + Add Period
              </button>
              {tempTimings.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setTempTimings(tempTimings.slice(0, -1));
                  }}
                  className="text-[12px] text-[var(--red-tx)] hover:underline cursor-pointer font-medium flex items-center gap-1"
                >
                  - Remove Last Period
                </button>
              )}
            </div>
            <div className="flex gap-2 p-5 bg-[var(--surf2)]/20">
              <button type="button" onClick={() => setShowEditTimings(false)} className="flex-1 py-2 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer">Save Timings</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
