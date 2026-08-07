import { useState, useEffect } from 'react';
import { X, Clock, Save, Loader2, Printer } from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useApp, TIMETABLE_DAYS } from '../context/AppContext';
import type { TimetablePeriod, PeriodTiming } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
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

const getSubjectColor = (subject: string): string | undefined => {
  if (!subject) return undefined;
  const key = Object.keys(SUBJECT_COLORS).find(k => k.toLowerCase() === subject.toLowerCase());
  return key ? SUBJECT_COLORS[key] : undefined;
};

const getSubjectText = (subject: string): string | undefined => {
  if (!subject) return undefined;
  const key = Object.keys(SUBJECT_TEXT).find(k => k.toLowerCase() === subject.toLowerCase());
  return key ? SUBJECT_TEXT[key] : undefined;
};

interface EditCell {
  day: string;
  period: number;
  current: TimetablePeriod | null;
}

export function Timetable() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin') || user?.roles?.includes('super-admin');
  const { timetable, setTimetablePeriod, periodTimings, savePeriodTimings, refreshTimetable, setHasUnsavedChanges, selectedAcademicYearId } = useApp();
  const [selectedClass, setSelectedClass] = useState('8A');
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [editCell, setEditCell] = useState<EditCell | null>(null);
  const [editSubject, setEditSubject] = useState('Mathematics');
  const [editTeacher, setEditTeacher] = useState('');
  const [editRoom, setEditRoom] = useState('Room 12');
  const [isManualRoom, setIsManualRoom] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [classes, setClasses] = useState<string[]>(['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B']);
  const [showEditTimings, setShowEditTimings] = useState(false);
  const [tempTimings, setTempTimings] = useState<PeriodTiming[]>([]);
  const [classTeachers, setClassTeachers] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadInitialData() {
      try {
        const resignedNames = new Set<string>();
        try {
          const s = localStorage.getItem('kts_staff_members');
           
          if (s) JSON.parse(s).filter((x: any) => x?.status === 'Resigned' && x.name)
                   .forEach((x: any) => resignedNames.add(x.name.toLowerCase().trim()));
         
        } catch { /* empty */ }

        let activeTeachers: any[] = [];
        try {
          const s = localStorage.getItem('kts_staff_members');
          if (s) activeTeachers = JSON.parse(s)
            .filter((x: any) => {
              if (!x?.id || !x.name || x.status === 'Resigned') return false;
              const cat = (x.category || 'Teaching').toString().trim().toLowerCase();
              return cat === 'teaching' || cat === 'non-teaching' || cat.includes('teach');
            })
            .map((x: any) => ({ id: String(x.id), name: x.name }));
        } catch { /* empty */ }

        if (activeTeachers.length === 0) {
          try {
            const facultyData = await api.getResources('faculty').catch(() => []);
            const facultyList = Array.isArray(facultyData) ? facultyData : (facultyData?.data || []);
            activeTeachers = facultyList.filter((t: any) => {
              if ((t.status || '').toLowerCase() === 'inactive') return false;
              if (t.name && resignedNames.has(t.name.toLowerCase().trim())) return false;
              const cat = (t.category || 'Teaching').toString().trim().toLowerCase();
              return cat === 'teaching' || cat === 'non-teaching' || cat.includes('teach');
            }).map((t: any) => ({ id: String(t.id || t.user_id), name: t.name }));
          } catch { /* empty */ }
        }

        if (activeTeachers.length === 0) {
          activeTeachers = STAFF.filter(s => s.status !== 'Resigned')
            .map(s => ({ id: String(s.id), name: s.name }));
        }

        const list = activeTeachers.map((t: any) => ({
          id: String(t.id),
          name: t.name,
        }));
         
        setTeachers(list);
        if (list.length > 0) {
          setEditTeacher(list[0].id);
        }

        const batchesDataRes = await api.getResources('batches').catch(() => []);
        const allBatchesRaw = Array.isArray(batchesDataRes) ? batchesDataRes : (batchesDataRes?.data || []);
        
        // Filter exactly like Classes.tsx to ensure correct class teacher mapping
        const allBatches = allBatchesRaw.filter((b: any) => !b.academic_year_id || String(b.academic_year_id) === String(selectedAcademicYearId));
        
        const classGroups: Record<string, string[]> = {};
        const defaultClasses = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        const teachersMap: Record<string, string> = {};

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
          const generatedName = sectionLetter ? `${classId}${sectionLetter}` : classId;
          teachersMap[generatedName] = b.class_teacher_name || 'not alloted';
        });

        setClassTeachers(teachersMap);


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
  }, [selectedAcademicYearId]);

  const classTimetable = timetable[selectedClass] ?? {};

  useEffect(() => {
    const handleSync = () => {
      refreshTimetable();
    };
    window.addEventListener('kts:timetable_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('kts:timetable_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [refreshTimetable]);

  const openEdit = (day: string, period: number) => {
    if (!isAdmin) return;
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
    const roomVal = cell?.room ?? 'Room 12';
    setEditRoom(roomVal);
    setIsManualRoom(!ROOMS.includes(roomVal));
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
    setHasUnsavedChanges(true);
    setEditCell(null);
  };

   
  const clearCell = () => {
    if (!editCell) return;
    setTimetablePeriod(selectedClass, editCell.day, editCell.period, null);
    setHasUnsavedChanges(true);
    setEditCell(null);
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
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
              start_time: periodTimings[p]?.start,
              end_time: periodTimings[p]?.end,
            });
          }
        }
      }

      const fullTimetableStr = JSON.stringify(timetable);
      localStorage.setItem('kts_school_timetable', fullTimetableStr);
      try {
        const settings = await api.getResources('settings').catch(() => []);
        const existing = Array.isArray(settings) ? settings.find((s: any) => s.key === 'kts_school_timetable') : null;
        if (existing) {
          await api.updateResource('settings', String(existing.id), { key: 'kts_school_timetable', value: fullTimetableStr });
        } else {
          await api.createResource('settings', {
            key: 'kts_school_timetable',
            value: fullTimetableStr,
            group: 'timetable',
            type: 'json',
            is_public: true,
          });
        }
      } catch (sErr) {
        console.error('Error saving timetable setting to DB:', sErr);
      }

      await api.createResource('timetable', {
        batch_name: selectedClass,
        academic_year_id: selectedAcademicYearId,
        slots: slots
      });

      await refreshTimetable();

      window.dispatchEvent(new CustomEvent('kts:timetable_updated'));
      window.dispatchEvent(new Event('storage'));

      setHasUnsavedChanges(false);
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

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #timetable-print-area, #timetable-print-area * {
          visibility: visible;
        }
        #timetable-print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          padding: 10px;
        }
        .print-only-title {
          display: block !important;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 10px;
          text-align: center;
        }
        
        /* Reduce row heights and padding to fit on one page */
        #timetable-print-area table th,
        #timetable-print-area table td {
          padding: 4px 6px !important;
        }
        #timetable-print-area button {
          min-height: 40px !important;
        }
        
        @page {
          size: landscape;
          margin: 0.5cm;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
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
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
            {savedMsg && <span className="text-[11.5px] text-[var(--teal-tx)] font-medium">Saved!</span>}
            <Badge variant="blue">{countFilledPeriods()} periods assigned</Badge>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[var(--b)] bg-[var(--surf2)] text-[var(--tx2)] rounded-lg cursor-pointer hover:border-[var(--blue)] hover:text-[var(--blue-tx)]"
            >
              <Printer size={12} /> Print
            </button>
            {isAdmin ? (
              <>
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
              </>
            ) : (
              <Badge variant="teal">Read Only View</Badge>
            )}
          </div>
          <div className="text-[11px] text-[var(--tx2)] mr-1 mt-0.5">
            Class Teacher: <span className="font-medium text-[var(--tx)]">{classTeachers[selectedClass] || 'not alloted'}</span>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div id="timetable-print-area">
        <h2 className="print-only-title hidden text-2xl font-bold text-center mb-6">Class {selectedClass} Timetable</h2>
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
                      const teacherDisplayName = cell ? (cell.teacher || teachers.find(t => String(t.id) === String(cell.teacherId))?.name || '') : '';
                      return (
                        <td key={day} className="px-1.5 py-1.5 border-b border-[var(--b)] border-l border-[var(--b)] align-top">
                          <button
                            onClick={() => openEdit(day, p)}
                            className={`w-full min-h-[52px] rounded-lg p-1.5 text-left transition-all border border-transparent ${
                              isAdmin ? 'cursor-pointer hover:border-[var(--blue)] group/cell' : 'cursor-default'
                            }`}
                            style={{
                              background: cell ? getSubjectColor(cell.subject) ?? 'var(--surf2)' : 'var(--surf2)',
                            }}
                          >
                            {cell ? (
                              <>
                                <div
                                  className="text-[11.5px] font-semibold leading-tight"
                                  style={{ color: getSubjectText(cell.subject) ?? 'var(--tx)' }}
                                >
                                  {cell.subject}
                                </div>
                                <div className="text-[11px] mt-0.5" style={{ color: getSubjectText(cell.subject) ?? 'var(--tx2)' }}>
                                  {teacherDisplayName}
                                </div>
                                <div className="text-[10.5px] mt-0.5" style={{ color: getSubjectText(cell.subject) ?? 'var(--tx3)' }}>
                                  {cell.room}
                                </div>
                              </>
                            ) : (
                              isAdmin ? (
                                <div className="text-[11px] text-[var(--tx2)] opacity-0 group-hover/cell:opacity-100 transition-opacity pt-1 text-center">
                                  + Add
                                </div>
                              ) : (
                                <div className="text-[10.5px] text-[var(--tx3)] opacity-40 pt-1 text-center font-medium">
                                  Free
                                </div>
                              )
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
      </div>

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
                {isManualRoom ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editRoom}
                      onChange={(e) => setEditRoom(e.target.value)}
                      placeholder="Enter room..."
                      className="flex-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualRoom(false);
                        setEditRoom('Room 12');
                      }}
                      className="px-2 border border-[var(--b)] rounded-lg hover:bg-[var(--surf3)] text-[var(--tx2)]"
                      title="Select from list"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <select
                    value={editRoom}
                    onChange={(e) => {
                      if (e.target.value === 'manual') {
                        setIsManualRoom(true);
                        setEditRoom('');
                      } else {
                        setEditRoom(e.target.value);
                      }
                    }}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                  >
                    {ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
                    <option value="manual">Manual Entry...</option>
                  </select>
                )}
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
