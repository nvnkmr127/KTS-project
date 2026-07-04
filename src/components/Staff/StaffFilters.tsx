import { Search } from 'lucide-react';

interface StaffFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  deptFilter: string;
  setDeptFilter: (val: string) => void;
  catFilter: string;
  setCatFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  allCategories: string[];
  allDepartments?: string[];
}

export function StaffFilters({
  search,
  setSearch,
  deptFilter,
  setDeptFilter,
  catFilter,
  setCatFilter,
  statusFilter,
  setStatusFilter,
  allCategories,
  allDepartments = ['Mathematics', 'Science', 'English', 'Languages', 'Social Sciences', 'Sports']
}: StaffFiltersProps) {
  return (
    <>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="flex items-center gap-2 flex-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2">
                <Search size={13} className="text-[var(--tx3)]" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, department, designation, category..." className="flex-1 bg-transparent text-[12px] text-[var(--tx)] placeholder:text-[var(--tx3)] outline-none" />
              </div>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                <option value="All">All Departments</option>
                {allDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                <option value="All">All Categories</option>
                {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

    </>
  );
}
