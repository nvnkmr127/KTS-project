import { useState, useEffect } from 'react';
import {
  GraduationCap, ArrowRight, CheckCircle2,
  AlertCircle, Loader2, Search, UserMinus, UserCheck, HelpCircle
} from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { addLocalAlumni } from '../utils/alumniStore';

interface Student {
  id: string;
  name: string;
  roll: string;
  class: string;
  section: string;
  gender: 'Male' | 'Female';
  status: 'Active' | 'Transferred' | 'Left';
  batchId: string;
}

interface Batch {
  id: string;
  name: string;
  academic_year_id: string;
  academicYearName?: string;
}

type PromotionAction = 'promote' | 'retain' | 'left' | 'alumni';

interface StudentPromotionState {
  student: Student;
  action: PromotionAction;
  targetBatchId: string; // The selected destination batch ID
}

export function Promotion() {
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  
  // Selections
  const [sourceAy, setSourceAy] = useState<string>('');
  const [sourceBatch, setSourceBatch] = useState<string>('');
  const [targetAy, setTargetAy] = useState<string>('');
  const [targetBatch, setTargetBatch] = useState<string>('');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [promotionStates, setPromotionStates] = useState<Record<string, StudentPromotionState>>({});
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Load Academic Years and Batches
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [ayData, batchesData] = await Promise.all([
          api.getResources('academic-years'),
          api.getResources('batches', { with: 'academicYear' }),
        ]);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sortedAys = (ayData || []).map((ay: any) => ({ id: String(ay.id), name: ay.name }));
        setAcademicYears(sortedAys);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // Find current academic year to set as default source
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentAy = ayData?.find((ay: any) => ay.is_current);
        if (currentAy) {
          setSourceAy(String(currentAy.id));
        } else if (sortedAys.length > 0) {
          setSourceAy(sortedAys[0].id);
        }
        
        // Find if there is a next academic year for target
        if (sortedAys.length > 1) {
          // If current is found, set next one in list as target
          const currentIndex = sortedAys.findIndex((ay: { id: string; name: string }) => ay.id === String(currentAy?.id));
          if (currentIndex !== -1 && currentIndex < sortedAys.length - 1) {
            setTargetAy(sortedAys[currentIndex + 1].id);
          } else {
            setTargetAy(sortedAys[sortedAys.length - 1].id);
          }
        } else if (sortedAys.length > 0) {
          setTargetAy(sortedAys[0].id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedBatches = (batchesData || []).map((b: any) => ({
          id: String(b.id),
          name: b.name,
          academic_year_id: String(b.academic_year_id),
          academicYearName: b.academic_year ? b.academic_year.name : 'N/A'
        }));
        setBatches(mappedBatches);
      } catch (e) {
        console.error('Error loading initial data:', e);
        setMessage({ type: 'error', text: 'Failed to load academic years and classes.' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter batches based on academic years
  const sourceBatches = batches.filter(b => b.academic_year_id === sourceAy);
  const targetBatches = batches.filter(b => b.academic_year_id === targetAy);

  // Detect if selected source is a Class-10 batch (name starts with "10")
  const selectedSourceBatch = batches.find(b => b.id === sourceBatch);
  const isClass10 = selectedSourceBatch
    ? /^10(\s*(?:SECTION|SEC)?\s*[A-Z]?)?$/i.test(selectedSourceBatch.name.trim()) || selectedSourceBatch.name.trim().startsWith('10')
    : false;

  // Set default source batch when sourceAy changes
  useEffect(() => {
    if (sourceBatches.length > 0) {
      setSourceBatch(sourceBatches[0].id);
    } else {
      setSourceBatch('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceAy, batches]);

  // Set default target batch and match logic when targetAy or sourceBatch changes
  useEffect(() => {
    // If Class 10, no target batch needed — students go to Alumni
    if (isClass10) {
      setTargetBatch('');
      return;
    }
    if (sourceBatch && targetBatches.length > 0) {
      const selectedSourceBatch = batches.find(b => b.id === sourceBatch);
      if (selectedSourceBatch) {
        const match = selectedSourceBatch.name.match(/^(\d+)([A-Z])$/i);
        if (match) {
          const currentClass = parseInt(match[1]);
          const currentSection = match[2];
          const nextClassStr = String(currentClass + 1);
          const nextBatchName = `${nextClassStr}${currentSection}`;
          const matchingTarget = targetBatches.find(b => b.name.toLowerCase() === nextBatchName.toLowerCase());
          if (matchingTarget) {
            setTargetBatch(matchingTarget.id);
            return;
          }
        }
      }
      setTargetBatch(targetBatches[0].id);
    } else {
      setTargetBatch('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceBatch, targetAy, batches, isClass10]);

  // Load students for selected source batch — auto-set action to 'alumni' for Class 10
  useEffect(() => {
    if (!sourceBatch) {
      setStudents([]);
      setPromotionStates({});
      return;
    }

    async function loadStudents() {
      setStudentsLoading(true);
      setMessage(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try {
        // Fetch all students from cache (no params = uses the pre-warmed cached list)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // then filter client-side by batch_id — this is instant when cached.
        const allStudents = await api.getResources('students');
        const batchStudents = (allStudents || []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (s: any) => String(s.batch_id) === String(sourceBatch)
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = batchStudents.map((s: any) => ({
          id: String(s.id),
          name: s.name,
          roll: s.enrollment_number || 'N/A',
          class: s.class || '8',
          section: s.section || 'A',
          gender: s.gender || 'Male',
          status: s.status === 'active' || s.status === 'Active' ? 'Active' : s.status === 'left' ? 'Left' : 'Transferred',
          batchId: String(s.batch_id),
        }));
        
        setStudents(mapped);
        
        const defaultAction: PromotionAction = isClass10 ? 'alumni' : 'promote';
        const initialStates: Record<string, StudentPromotionState> = {};
        mapped.forEach((student: Student) => {
          initialStates[student.id] = {
            student,
            action: defaultAction,
            targetBatchId: isClass10 ? '' : targetBatch
          };
        });
        setPromotionStates(initialStates);
      } catch (e) {
        console.error('Error loading students:', e);
        setMessage({ type: 'error', text: 'Failed to load students in the selected class.' });
      } finally {
        setStudentsLoading(false);
      }
    }
    loadStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceBatch, isClass10]);

  // Update target batch id for all students when targetBatch changes
  useEffect(() => {
    setPromotionStates(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        if (updated[id].action === 'promote') {
          updated[id].targetBatchId = targetBatch;
        }
      });
      return updated;
    });
  }, [targetBatch]);

  const handleActionChange = (studentId: string, action: PromotionAction) => {
    setPromotionStates(prev => {
      const state = prev[studentId];
      if (!state) return prev;
      
      let resolvedTarget = targetBatch;
      if (action === 'retain') {
        // Retain: Stays in the same class level under the NEW academic year.
        // Try to find a batch with the same name in target batches.
        const sourceBatchName = batches.find(b => b.id === sourceBatch)?.name;
        const matchingTarget = targetBatches.find(b => b.name === sourceBatchName);
        resolvedTarget = matchingTarget ? matchingTarget.id : targetBatch;
      }
      
      return {
        ...prev,
        [studentId]: {
          ...state,
          action,
          targetBatchId: action === 'left' ? '' : resolvedTarget
        }
      };
    });
  };

  const handleSelectAll = (action: PromotionAction) => {
    setPromotionStates(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        let resolvedTarget = targetBatch;
        if (action === 'retain') {
          const sourceBatchName = batches.find(b => b.id === sourceBatch)?.name;
          const matchingTarget = targetBatches.find(b => b.name === sourceBatchName);
          resolvedTarget = matchingTarget ? matchingTarget.id : targetBatch;
        }
        updated[id] = {
          ...updated[id],
          action,
          targetBatchId: action === 'left' ? '' : resolvedTarget
        };
      });
      return updated;
    });
  };

  const executePromotion = async () => {
    if (students.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    
    setExecuting(true);
    setMessage(null);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      const updates = Object.values(promotionStates).map(async (state) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: Record<string, any> = {};
        
        if (state.action === 'promote') {
          payload.batch_id = state.targetBatchId;
          payload.status = 'active';
        } else if (state.action === 'retain') {
          payload.batch_id = state.targetBatchId;
          payload.status = 'active';
        } else if (state.action === 'left') {
          payload.status = 'left';
        } else if (state.action === 'alumni') {
          // Mark student as left (graduated) and register in alumni network
          payload.status = 'left';
        }
        
        try {
          await api.updateResource('students', state.student.id, payload);
          // For alumni action: always write to local store + try backend
          if (state.action === 'alumni') {
            // 1. Write to shared localStorage store immediately (primary fallback)
            addLocalAlumni({
              name: state.student.name,
              roll: state.student.roll,
              passOutYear: String(new Date().getFullYear()),
              class: state.student.class,
              section: state.student.section,
              gender: state.student.gender,
              dob: '',
              phone: '',
              email: '',
              address: '',
              currentOccupation: '',
              achievement: '',
              status: 'Unverified',
              source: 'promotion',
            });
            // 2. Also try the backend (best-effort)
            try {
              await api.createResource('alumni', {
                name: state.student.name,
                roll: state.student.roll,
                pass_out_year: String(new Date().getFullYear()),
                class: state.student.class,
                section: state.student.section,
                gender: state.student.gender,
                status: 'unverified',
              });
            } catch {
              // Backend endpoint may not exist yet — local store is the source of truth
            }
          }
          successCount++;
        } catch (err) {
          console.error(`Failed to update student ${state.student.name}:`, err);
          errorCount++;
        }
      });
      
      await Promise.all(updates);
      
      const alumniCount = Object.values(promotionStates).filter(s => s.action === 'alumni').length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMessage({
        type: errorCount === 0 ? 'success' : 'error',
        text: `Promotion completed: ${successCount} student(s) updated successfully.${
          alumniCount > 0 ? ` ${alumniCount} student(s) moved to Alumni network.` : ''
        }${errorCount > 0 ? ` ${errorCount} failed.` : ''}`
      });
      
      // Reload
      const data = await api.getResources('students', { batch_id: sourceBatch, limit: '1000' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = data.map((s: any) => ({
        id: String(s.id),
        name: s.name,
        roll: s.enrollment_number || 'N/A',
        class: s.class || '8',
        section: s.section || 'A',
        gender: s.gender || 'Male',
        status: s.status === 'active' || s.status === 'Active' ? 'Active' : s.status === 'left' ? 'Left' : 'Transferred',
        batchId: String(s.batch_id),
      }));
      setStudents(mapped);
    } catch (e) {
      console.error('Promotion transaction error:', e);
      setMessage({ type: 'error', text: 'A critical error occurred while executing the promotion.' });
    } finally {
      setExecuting(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg)]">
        <Loader2 className="animate-spin text-[var(--blue)]" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg)] space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-[var(--tx)] flex items-center gap-2">
            <GraduationCap className="text-[var(--blue)]" size={18} />
            Student Promotion Dashboard
          </h1>
          <p className="text-[11.5px] text-[var(--tx3)]">
            Promote students of the present class to the next class level for the upcoming academic year.
          </p>
        </div>
      </div>

      {/* Selectors and Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Configuration */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--b)] text-[12px] font-semibold text-[var(--tx)]">
            <span className="w-5 h-5 rounded-full bg-[var(--blue-bg)] text-[var(--blue-tx)] flex items-center justify-center text-[10px]">1</span>
            Source Class / Batch (Current)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--tx3)] mb-1">Academic Year</label>
              <select
                value={sourceAy}
                onChange={(e) => setSourceAy(e.target.value)}
                className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none"
              >
                {academicYears.map(ay => (
                  <option key={ay.id} value={ay.id}>{ay.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--tx3)] mb-1">Class & Section</label>
              <select
                value={sourceBatch}
                onChange={(e) => setSourceBatch(e.target.value)}
                disabled={sourceBatches.length === 0}
                className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none disabled:opacity-50"
              >
                {sourceBatches.length === 0 ? (
                  <option value="">No classes found</option>
                ) : (
                  sourceBatches.map(b => (
                    <option key={b.id} value={b.id}>Class {b.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>
        </Card>

        {/* Target Configuration */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--b)] text-[12px] font-semibold text-[var(--tx)]">
            <span className="w-5 h-5 rounded-full bg-[var(--teal-bg)] text-[var(--teal-tx)] flex items-center justify-center text-[10px]">2</span>
            Destination Class / Batch (Next Year)
          </div>

          {isClass10 ? (
            /* ── Alumni destination panel (shown only for Class 10) ── */
            <div className="flex flex-col items-center justify-center gap-3 py-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--purple-bg)] flex items-center justify-center">
                <GraduationCap size={22} className="text-[var(--purple-tx)]" />
              </div>
              <div className="text-center">
                <div className="text-[13px] font-bold text-[var(--purple-tx)]">Alumni Network</div>
                <div className="text-[11px] text-[var(--tx3)] mt-0.5">
                  Class 10 students graduate and join the Alumni directory.
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--purple-bg)] border border-[var(--purple-tx)]/20 rounded-xl text-[11.5px] font-semibold text-[var(--purple-tx)]">
                <GraduationCap size={13} />
                Graduates → Alumni
              </div>
            </div>
          ) : (
            /* ── Normal destination dropdowns ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--tx3)] mb-1">Upcoming Year</label>
                <select
                  value={targetAy}
                  onChange={(e) => setTargetAy(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none"
                >
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id}>{ay.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--tx3)] mb-1">Target Class & Section</label>
                <select
                  value={targetBatch}
                  onChange={(e) => setTargetBatch(e.target.value)}
                  disabled={targetBatches.length === 0}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none disabled:opacity-50"
                >
                  {targetBatches.length === 0 ? (
                    <option value="">No target classes found</option>
                  ) : (
                    targetBatches.map(b => (
                      <option key={b.id} value={b.id}>Class {b.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Info Warning */}
      <div className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3.5 flex items-start gap-2.5 text-[11.5px] text-[var(--tx2)]">
        <HelpCircle size={15} className="text-[var(--blue-tx)] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[var(--tx)]">Transition Rules:</span>
          <ul className="list-disc pl-4 mt-1 space-y-0.5">
            {isClass10 ? (
              <li><strong>Alumni</strong> graduates the student and registers them in the Alumni network automatically.</li>
            ) : (
              <li><strong>Promote</strong> updates the student to the selected target batch under the upcoming year.</li>
            )}
            <li><strong>Retain</strong> assigns the student to the corresponding class level under the new year (keeps them in the same grade).</li>
            <li><strong>Left</strong> updates the student status to &quot;Left&quot; (for transfers or dropouts). They are excluded from future year lists.</li>
          </ul>
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-[12px] ${
          message.type === 'success' ? 'bg-[var(--teal-bg)] border-[var(--teal-tx)]/20 text-[var(--teal-tx)]' : 'bg-[var(--red-bg)] border-[var(--red-tx)]/20 text-[var(--red-tx)]'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Student List Checklist */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="text-[12.5px] font-bold text-[var(--tx)]">
            Students List ({filteredStudents.length})
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="flex items-center gap-2 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 flex-1 sm:flex-none min-w-[200px]">
              <Search size={13} className="text-[var(--tx3)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students..."
                className="bg-transparent text-[11.5px] text-[var(--tx)] outline-none w-full"
              />
            </div>
            
            {/* Bulk set buttons */}
            {!isClass10 && (
              <button
                onClick={() => handleSelectAll('promote')}
                className="px-2.5 py-1.5 text-[11px] font-medium border border-[var(--b)] rounded-lg text-[var(--tx2)] hover:bg-[var(--surf2)] cursor-pointer"
              >
                All Promote
              </button>
            )}
            <button
              onClick={() => handleSelectAll('retain')}
              className="px-2.5 py-1.5 text-[11px] font-medium border border-[var(--b)] rounded-lg text-[var(--tx2)] hover:bg-[var(--surf2)] cursor-pointer"
            >
              All Retain
            </button>
            <button
              onClick={() => handleSelectAll('left')}
              className="px-2.5 py-1.5 text-[11px] font-medium border border-[var(--b)] rounded-lg text-[var(--tx2)] hover:bg-[var(--surf2)] cursor-pointer"
            >
              All Left
            </button>
          </div>
        </div>

        {/* Table list */}
        {studentsLoading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="animate-spin text-[var(--tx3)]" size={24} />
          </div>
        ) : students.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-[var(--tx3)]">
            No active students found in this source class.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[var(--b)] text-[var(--tx3)] text-left">
                  <th className="py-2 px-1 font-semibold text-[10.5px]">Student Details</th>
                  <th className="py-2 px-1 font-semibold text-[10.5px]">Roll No</th>
                  <th className="py-2 px-1 font-semibold text-[10.5px] text-center">Status</th>
                  <th className="py-2 px-1 font-semibold text-[10.5px] text-right">Transition Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const state = promotionStates[student.id];
                  if (!state) return null;
                  
                  return (
                    <tr key={student.id} className="border-b border-[var(--b)] last:border-0 hover:bg-[var(--surf2)] transition-colors">
                      <td className="py-2.5 px-1 font-medium text-[var(--tx)]">
                        {student.name}
                        <span className="text-[10px] text-[var(--tx3)] ml-2">({student.gender})</span>
                      </td>
                      <td className="py-2.5 px-1 font-mono text-[var(--tx2)]">{student.roll}</td>
                      <td className="py-2.5 px-1 text-center">
                        <Badge variant="green">{student.status}</Badge>
                      </td>
                      <td className="py-2.5 px-1 text-right">
                        <div className="inline-flex gap-1 bg-[var(--surf3)] border border-[var(--b)] p-0.5 rounded-lg">
                          {isClass10 ? (
                            /* Class 10: Alumni | Retain | Left */
                            <button
                              onClick={() => handleActionChange(student.id, 'alumni')}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1 cursor-pointer transition-all ${
                                state.action === 'alumni'
                                  ? 'bg-[var(--purple)] text-white shadow'
                                  : 'text-[var(--tx2)] hover:text-[var(--tx)]'
                              }`}
                            >
                              <GraduationCap size={11} /> Alumni
                            </button>
                          ) : (
                            /* Normal classes: Promote */
                            <button
                              onClick={() => handleActionChange(student.id, 'promote')}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1 cursor-pointer transition-all ${
                                state.action === 'promote'
                                  ? 'bg-[var(--blue)] text-white shadow'
                                  : 'text-[var(--tx2)] hover:text-[var(--tx)]'
                              }`}
                            >
                              <UserCheck size={11} /> Promote
                            </button>
                          )}
                          <button
                            onClick={() => handleActionChange(student.id, 'retain')}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1 cursor-pointer transition-all ${
                              state.action === 'retain'
                                ? 'bg-[var(--amber-bg)] text-[var(--amber-tx)] shadow'
                                : 'text-[var(--tx2)] hover:text-[var(--tx)]'
                            }`}
                          >
                            Retain
                          </button>
                          <button
                            onClick={() => handleActionChange(student.id, 'left')}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1 cursor-pointer transition-all ${
                              state.action === 'left'
                                ? 'bg-[var(--red-bg)] text-[var(--red-tx)] shadow'
                                : 'text-[var(--tx2)] hover:text-[var(--tx)]'
                            }`}
                          >
                            <UserMinus size={11} /> Left
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Execution */}
        {students.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--b)] flex justify-end">
            <button
              onClick={executePromotion}
              disabled={executing || (!isClass10 && targetBatches.length === 0)}
              className="px-4 py-2 bg-[var(--blue)] text-white text-[12px] font-bold rounded-lg flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {executing ? (
                <>
                  <Loader2 className="animate-spin" size={13} />
                  Executing Transition...
                </>
              ) : isClass10 ? (
                <>
                  <GraduationCap size={13} />
                  Graduate to Alumni ({students.length} students)
                </>
              ) : (
                <>
                  <ArrowRight size={13} />
                  Execute Promotion ({students.length} students)
                </>
              )}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
