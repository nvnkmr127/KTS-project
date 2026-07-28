import { useState, useEffect, useMemo } from 'react';
import { Users, ShieldAlert, ArrowRight, X, GraduationCap, School, BookOpen } from 'lucide-react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { Avatar, getInitials } from '../components/ui';
import type { PageId } from '../types';

interface SearchPageProps {
  searchQuery: string;
  onNavigate: (page: PageId) => void;
  onClearSearch: () => void;
}

export function SearchPage({ searchQuery, onNavigate, onClearSearch }: SearchPageProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [students, setStudents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [faculty, setFaculty] = useState<any[]>([]);
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all search data once on mount
  useEffect(() => {
    async function loadSearchData() {
      setLoading(true);
      try {
        const [studentsData, facultyData, batchesData] = await Promise.all([
          api.getResources('students', { limit: '1000' }).catch(() => []),
          api.getResources('faculty').catch(() => []),
          api.getResources('batches').catch(() => []),
        ]);
        setStudents(studentsData || []);
        setFaculty(facultyData || []);
        setBatches(batchesData || []);
      } catch (err) {
        console.error('Failed to load global search data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSearchData();
  }, []);

  const results = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return { students: [], faculty: [], batches: [], totalCount: 0 };
    }

    const matchedStudents = students.filter((s) =>
      String(s.name || '').toLowerCase().includes(q) ||
      String(s.roll || s.enrollment_number || '').toLowerCase().includes(q) ||
      String(s.parent || '').toLowerCase().includes(q)
    );

    const matchedFaculty = faculty.filter((f) =>
      String(f.name || '').toLowerCase().includes(q) ||
      String(f.designation || '').toLowerCase().includes(q) ||
      String(f.department || '').toLowerCase().includes(q) ||
      String(f.subject || '').toLowerCase().includes(q)
    );

    const matchedBatches = batches.filter((b) =>
      String(b.name || '').toLowerCase().includes(q) ||
      String(b.class_teacher_name || '').toLowerCase().includes(q)
    );

    const totalCount = matchedStudents.length + matchedFaculty.length + matchedBatches.length;

    return {
      students: matchedStudents,
      faculty: matchedFaculty,
      batches: matchedBatches,
      totalCount,
    };
  }, [searchQuery, students, faculty, batches]);


  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg)] pb-10">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-4 border-b border-[var(--b)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[16px] font-bold text-[var(--tx)]">Global Search Results</h1>
            <Badge variant="blue">{results.totalCount} match{results.totalCount !== 1 ? 'es' : ''}</Badge>
          </div>
          <p className="text-[11px] text-[var(--tx3)] mt-0.5">
            Showing matches for <span className="font-semibold text-[var(--tx)]">"{searchQuery}"</span>
          </p>
        </div>
        <button
          onClick={onClearSearch}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surf)] hover:bg-[var(--surf2)] border border-[var(--b2)] text-[11px] text-[var(--tx2)] hover:text-[var(--tx)] rounded-lg transition-colors cursor-pointer"
        >
          <X size={12} />
          Clear Search
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--blue)] mb-3"></div>
          <p className="text-[11px] text-[var(--tx3)]">Indexing school directory...</p>
        </div>
      )}

      {!loading && results.totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-[var(--surf)] border border-dashed border-[var(--b)] rounded-xl text-center">
          <ShieldAlert className="text-[var(--red-tx)] mb-3" size={32} />
          <div className="text-[13.5px] font-bold text-[var(--tx)]">No Results Found</div>
          <p className="text-[11px] text-[var(--tx3)] max-w-sm mt-1">
            We couldn't find any students, staff, or classes matching "{searchQuery}". Try adjusting your keywords.
          </p>
        </div>
      )}

      {!loading && results.totalCount > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Column: Students */}
          <div className="space-y-3">
            <h2 className="text-[12.5px] font-bold text-[var(--tx)] flex items-center gap-2 px-1">
              <GraduationCap size={15} className="text-[var(--blue)]" />
              <span>Students ({results.students.length})</span>
            </h2>
            <div className="space-y-2">
              {results.students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => {
                    onClearSearch();
                    onNavigate('students');
                  }}
                  className="bg-[var(--surf)] border border-[var(--b)] hover:border-[var(--blue)] rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar initials={getInitials(student.name)} bg="var(--blue-bg)" color="var(--blue-tx)" />
                    <div>
                      <div className="text-[12.5px] font-bold text-[var(--tx)] group-hover:text-[var(--blue)] transition-colors">
                        {student.name}
                      </div>
                      <div className="text-[10px] text-[var(--tx3)] mt-0.5">
                        Roll: {student.roll || student.enrollment_number} · Parent: {student.parent || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={12} className="text-[var(--tx3)] group-hover:text-[var(--blue)] group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
              {results.students.length === 0 && (
                <div className="text-center py-6 bg-[var(--surf2)] border border-[var(--b)] rounded-xl text-[11px] text-[var(--tx3)]">
                  No students match
                </div>
              )}
            </div>
          </div>

          {/* Column: Staff & Faculty */}
          <div className="space-y-3">
            <h2 className="text-[12.5px] font-bold text-[var(--tx)] flex items-center gap-2 px-1">
              <Users size={15} className="text-[var(--teal)]" />
              <span>Staff & Faculty ({results.faculty.length})</span>
            </h2>
            <div className="space-y-2">
              {results.faculty.map((member) => (
                <div
                  key={member.id}
                  onClick={() => {
                    onClearSearch();
                    onNavigate('faculty');
                  }}
                  className="bg-[var(--surf)] border border-[var(--b)] hover:border-[var(--teal)] rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar initials={getInitials(member.name)} bg="var(--teal-bg)" color="var(--teal-tx)" />
                    <div>
                      <div className="text-[12.5px] font-bold text-[var(--tx)] group-hover:text-[var(--teal)] transition-colors">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-[var(--tx3)] mt-0.5">
                        {member.designation || 'Staff'} · {member.department || 'General'} {member.subject ? `(${member.subject})` : ''}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={12} className="text-[var(--tx3)] group-hover:text-[var(--teal)] group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
              {results.faculty.length === 0 && (
                <div className="text-center py-6 bg-[var(--surf2)] border border-[var(--b)] rounded-xl text-[11px] text-[var(--tx3)]">
                  No staff match
                </div>
              )}
            </div>
          </div>

          {/* Column: Classes / Batches */}
          <div className="space-y-3">
            <h2 className="text-[12.5px] font-bold text-[var(--tx)] flex items-center gap-2 px-1">
              <School size={15} className="text-[var(--amber)]" />
              <span>Classes ({results.batches.length})</span>
            </h2>
            <div className="space-y-2">
              {results.batches.map((batch) => (
                <div
                  key={batch.id}
                  onClick={() => {
                    onClearSearch();
                    onNavigate('classes');
                  }}
                  className="bg-[var(--surf)] border border-[var(--b)] hover:border-[var(--amber)] rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--amber-bg)] text-[var(--amber-tx)] rounded-lg">
                      <BookOpen size={14} />
                    </div>
                    <div>
                      <div className="text-[12.5px] font-bold text-[var(--tx)] group-hover:text-[var(--amber)] transition-colors">
                        Class {batch.name}
                      </div>
                      <div className="text-[10px] text-[var(--tx3)] mt-0.5">
                        Teacher: {batch.class_teacher_name || 'Not assigned'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={12} className="text-[var(--tx3)] group-hover:text-[var(--amber)] group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
              {results.batches.length === 0 && (
                <div className="text-center py-6 bg-[var(--surf2)] border border-[var(--b)] rounded-xl text-[11px] text-[var(--tx3)]">
                  No classes match
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
