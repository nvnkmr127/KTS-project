
import { Avatar } from '../ui';
import { Phone, Mail, Eye, Edit2, Trash2, Users } from 'lucide-react';
import { Badge } from '../Badge';
import { TableSkeleton } from '../Skeleton';
import { EmptyState } from '../EmptyState';

const DEPT_COLORS: Record<string, { bg: string, color: string }> = {
  Mathematics: { bg: 'var(--blue-bg)', color: 'var(--blue-tx)' },
  Science: { bg: 'var(--emerald-bg)', color: 'var(--emerald-tx)' },
  English: { bg: 'var(--purple-bg)', color: 'var(--purple-tx)' },
  Languages: { bg: 'var(--amber-bg)', color: 'var(--amber-tx)' },
  'Social Sciences': { bg: 'var(--rose-bg)', color: 'var(--rose-tx)' },
  Sports: { bg: 'var(--indigo-bg)', color: 'var(--indigo-tx)' },
  default: { bg: 'var(--gray-bg)', color: 'var(--gray-tx)' }
};

interface StaffTableProps {
  loading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sortedFiltered: any[];
  selectedIds: string[];
  setSelectedIds: (val: string[]) => void;
  sortField: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sortOrder: 'asc' | 'desc';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleSort: (field: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setModal: (val: any) => void;
  handleDelete: (id: string) => void;
  search: string;
}

export function StaffTable({ loading, sortedFiltered, selectedIds, setSelectedIds, sortField, sortOrder, handleSort, setModal, handleDelete, search }: StaffTableProps) {
  return (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[700px]">
                <thead>
                  <tr className="border-b border-[var(--b)]">
                    <th className="px-2 py-2 text-left w-8">
                      <input
                        type="checkbox"
                        checked={sortedFiltered.length > 0 && selectedIds.length === sortedFiltered.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(sortedFiltered.map(s => s.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        className="cursor-pointer rounded border-[var(--b)]"
                      />
                    </th>
                    <th onClick={() => handleSort('name')} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Staff Member {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => handleSort('department')} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Department {sortField === 'department' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="hidden md:table-cell text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">Contact</th>
                    <th onClick={() => handleSort('joinDate')} className="hidden sm:table-cell text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Join Date {sortField === 'joinDate' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => handleSort('attendance')} className="hidden lg:table-cell text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Attendance {sortField === 'attendance' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => handleSort('status')} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap cursor-pointer hover:text-[var(--tx)]">
                      Status {sortField === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-2 py-4">
                        <TableSkeleton rows={6} cols={8} />
                      </td>
                    </tr>
                  ) : sortedFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-2 py-4">
                        <EmptyState
                          title="No staff members found"
                          description={search.trim() ? "We couldn't find any staff matching your search criteria. Try refining your filters." : "Add your first staff member to populate the directory."}
                          icon={<Users size={28} />}
                          actionLabel={search.trim() ? undefined : "Add Staff"}
                          onAction={search.trim() ? undefined : () => { setModal({ type: 'add' }); }}
                        />
                      </td>
                    </tr>
                  ) : (
                    sortedFiltered.map((s) => {
                      const dc = DEPT_COLORS[s.department] ?? DEPT_COLORS.default;
                      const isSelected = selectedIds.includes(s.id);
                      return (
                        <tr key={s.id} className={`border-b border-[var(--b)] hover:bg-[var(--surf2)] transition-colors last:border-0 ${isSelected ? 'bg-[var(--blue-bg)]/10' : ''}`}>
                          <td className="px-2 py-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds([...selectedIds, s.id]);
                                } else {
                                  setSelectedIds(selectedIds.filter(id => id !== s.id));
                                }
                              }}
                              className="cursor-pointer rounded border-[var(--b)]"
                            />
                          </td>
                          <td className="px-2 py-2.5 cursor-pointer" onClick={() => setModal({ type: 'view', staff: s })}>
                            <div className="flex items-center gap-2.5">
                              <Avatar initials={s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)} bg={dc.bg} color={dc.color} />
                              <div>
                                <div className="font-semibold text-[var(--tx)] hover:text-[var(--blue)]">{s.name}</div>
                                <div className="text-[10.5px] text-[var(--tx3)] flex items-center gap-1.5">
                                  <span>{s.designation}</span>
                                  <span className="text-[9px] px-1.5 py-0.5 bg-[var(--surf3)] border border-[var(--b)] rounded-full text-[var(--tx2)] font-medium">{s.category || 'Teaching'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="font-medium text-[var(--tx)]">{s.department}</div>
                            {s.subject && <div className="text-[10.5px] text-[var(--tx3)]">{s.subject}</div>}
                          </td>
                          <td className="hidden md:table-cell px-2 py-2.5">
                            <div className="flex items-center gap-1 text-[var(--tx2)]"><Phone size={10} />{s.phone}</div>
                            <div className="flex items-center gap-1 text-[10.5px] text-[var(--tx3)]"><Mail size={9} />{s.email}</div>
                          </td>
                          <td className="hidden sm:table-cell px-2 py-2.5 text-[var(--tx2)]">
                            {(() => {
                              const parts = (s.joinDate || '').split('-');
                              if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                              return s.joinDate;
                            })()}
                          </td>
                          <td className="hidden lg:table-cell px-2 py-2.5">
                            <span className={`font-semibold ${s.attendance >= 90 ? 'text-[var(--teal-tx)]' : 'text-[var(--amber-tx)]'}`}>{s.attendance}%</span>
                          </td>
                          <td className="px-2 py-2.5">
                            {s.status === 'Active' && <Badge variant="teal">Active</Badge>}
                            {s.status === 'On Leave' && <Badge variant="amber">On Leave</Badge>}
                            {s.status === 'Resigned' && <Badge variant="red">Resigned</Badge>}
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setModal({ type: 'view', staff: s })} className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded text-[var(--tx3)] hover:text-[var(--blue-tx)] hover:bg-[var(--blue-bg)] cursor-pointer"><Eye size={13} /></button>
                              <button onClick={() => setModal({ type: 'edit', staff: s })} className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded text-[var(--tx3)] hover:text-[var(--amber-tx)] hover:bg-[var(--amber-bg)] cursor-pointer"><Edit2 size={13} /></button>
                              <button onClick={() => handleDelete(s.id)} className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded text-[var(--tx3)] hover:text-[var(--red-tx)] hover:bg-[var(--red-bg)] cursor-pointer"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

  );
}
