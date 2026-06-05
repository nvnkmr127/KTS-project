import { useState } from 'react';
import { Plus, X, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const AVATAR_COLORS: Record<string, { bg: string; color: string }> = {
  SR: { bg: 'var(--red-bg)', color: 'var(--red-tx)' },
  RS: { bg: 'var(--amber-bg)', color: 'var(--amber-tx)' },
  SK: { bg: 'var(--teal-bg)', color: 'var(--teal-tx)' },
  PN: { bg: 'var(--green-bg)', color: 'var(--green-tx)' },
  LD: { bg: 'var(--purple-bg)', color: 'var(--purple-tx)' },
};

const LEAVE_BALANCE = [
  { type: 'Sick Leave', total: 12, used: 4, remaining: 8 },
  { type: 'Casual Leave', total: 6, used: 1, remaining: 5 },
  { type: 'Earned Leave', total: 18, used: 3, remaining: 15 },
  { type: 'Emergency Leave', total: 5, used: 1, remaining: 4 },
];

export function Leave() {
  const { user } = useAuth();
  const { leaveRequests, approveLeave, rejectLeave, addLeaveRequest } = useApp();
  const isAdmin = user?.role === 'admin';
  const [showApply, setShowApply] = useState(false);

  const [applyType, setApplyType] = useState<'Sick Leave' | 'Casual Leave' | 'Emergency Leave' | 'Earned Leave'>('Sick Leave');
  const [applyFrom, setApplyFrom] = useState('');
  const [applyTo, setApplyTo] = useState('');
  const [applyReason, setApplyReason] = useState('');

  const visibleRequests = isAdmin
    ? leaveRequests
    : leaveRequests.filter((l) => l.staffId === user?.id);

  const pending = leaveRequests.filter((l) => l.status === 'Pending').length;
  const approved = leaveRequests.filter((l) => l.status === 'Approved').length;
  const totalDaysUsed = leaveRequests.filter((l) => l.status === 'Approved').reduce((s, l) => s + l.days, 0);

  const handleSubmit = () => {
    if (!applyFrom || !applyTo || !applyReason) return;
    const from = new Date(applyFrom);
    const to = new Date(applyTo);
    const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
    addLeaveRequest({
      staffId: user?.id ?? '2',
      staffName: user?.name ?? 'Unknown',
      init: user?.initials ?? 'LD',
      type: applyType,
      from: applyFrom,
      to: applyTo,
      days,
      reason: applyReason,
      status: 'Pending',
    });
    setShowApply(false);
    setApplyFrom('');
    setApplyTo('');
    setApplyReason('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label={isAdmin ? 'Total Requests' : 'Total Leaves'} value={isAdmin ? leaveRequests.length : visibleRequests.length} sub="This year" icon={<Calendar size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Pending Approval" value={pending} sub="Awaiting review" icon={<Clock size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
        <KPICard label="Approved" value={approved} sub="This month" icon={<CheckCircle size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Days Used" value={totalDaysUsed} sub="By all staff" icon={<XCircle size={15} />} iconBg="var(--red-bg)" iconColor="var(--red-tx)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-2.5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-semibold text-[var(--tx)]">{isAdmin ? 'Leave Requests' : 'My Leave History'}</div>
            {!isAdmin && (
              <button onClick={() => setShowApply(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90">
                <Plus size={11} /> Apply Leave
              </button>
            )}
          </div>

          <div className="space-y-2">
            {visibleRequests.length === 0 ? (
              <div className="text-center py-8 text-[12px] text-[var(--tx3)]">No leave requests found.</div>
            ) : (
              visibleRequests.map((l) => (
                <div key={l.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-[var(--surf2)] border border-[var(--b)] rounded-xl">
                  <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                    {isAdmin && (
                      <div className="flex-shrink-0">
                        <Avatar initials={l.init} bg={AVATAR_COLORS[l.init]?.bg ?? 'var(--surf3)'} color={AVATAR_COLORS[l.init]?.color ?? 'var(--tx2)'} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {isAdmin && <span className="text-[12.5px] font-semibold text-[var(--tx)]">{l.staffName}</span>}
                        <Badge variant={l.type === 'Sick Leave' ? 'red' : l.type === 'Emergency Leave' ? 'coral' : l.type === 'Earned Leave' ? 'teal' : 'blue'}>
                          {l.type}
                        </Badge>
                      </div>
                      <div className="text-[11.5px] text-[var(--tx2)]">{l.from} → {l.to} <span className="text-[var(--tx3)]">({l.days} day{l.days > 1 ? 's' : ''})</span></div>
                      <div className="text-[11px] text-[var(--tx3)] truncate mt-0.5">{l.reason}</div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--b)] sm:border-none flex-shrink-0">
                    {l.status === 'Approved' && <Badge variant="teal">Approved</Badge>}
                    {l.status === 'Pending' && <Badge variant="amber">Pending</Badge>}
                    {l.status === 'Rejected' && <Badge variant="red">Rejected</Badge>}
                    {isAdmin && l.status === 'Pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => approveLeave(l.id)} className="px-2 py-0.5 text-[10.5px] bg-[var(--teal-bg)] text-[var(--teal-tx)] rounded-lg cursor-pointer font-medium hover:opacity-80">Approve</button>
                        <button onClick={() => rejectLeave(l.id)} className="px-2 py-0.5 text-[10.5px] bg-[var(--red-bg)] text-[var(--red-tx)] rounded-lg cursor-pointer font-medium hover:opacity-80">Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="text-[12.5px] font-semibold text-[var(--tx)] mb-3">Leave Balance</div>
          <div className="space-y-3">
            {LEAVE_BALANCE.map((lb) => (
              <div key={lb.type}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-medium text-[var(--tx)]">{lb.type}</span>
                  <span className="text-[12px] font-semibold text-[var(--tx)]">{lb.remaining}/{lb.total}</span>
                </div>
                <div className="h-1.5 bg-[var(--surf2)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(lb.remaining / lb.total) * 100}%`,
                      background: lb.remaining > lb.total / 2 ? 'var(--teal)' : lb.remaining > 2 ? 'var(--amber)' : 'var(--red)',
                    }}
                  />
                </div>
                <div className="text-[10.5px] text-[var(--tx3)] mt-0.5">{lb.used} used · {lb.remaining} remaining</div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--b)]">
            <div className="text-[12px] font-semibold text-[var(--tx)] mb-2">Leave Calendar</div>
            <div className="text-[11.5px] text-[var(--tx3)] bg-[var(--surf2)] rounded-xl p-3 text-center">
              June 2026 · {leaveRequests.filter((l) => l.status === 'Approved').length} approved leaves
            </div>
            {leaveRequests.filter((l) => l.status === 'Approved').slice(0, 3).map((l) => (
              <div key={l.id} className="flex items-center justify-between mt-2 text-[11.5px]">
                <span className="text-[var(--tx2)]">{isAdmin ? l.staffName : l.type}</span>
                <span className="text-[var(--tx3)]">{l.from}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Apply Leave Modal */}
      {showApply && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[440px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">Apply for Leave</div>
              <button onClick={() => setShowApply(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Leave Type *</label>
                <select
                  value={applyType}
                  onChange={(e) => setApplyType(e.target.value as typeof applyType)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                >
                  <option>Sick Leave</option>
                  <option>Casual Leave</option>
                  <option>Emergency Leave</option>
                  <option>Earned Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">From Date *</label>
                  <input type="date" value={applyFrom} onChange={(e) => setApplyFrom(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">To Date *</label>
                  <input type="date" value={applyTo} onChange={(e) => setApplyTo(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Reason *</label>
                <textarea
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none resize-none focus:border-[var(--blue)]"
                  rows={3}
                  placeholder="Briefly describe the reason for leave..."
                />
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Supporting Document (optional)</label>
                <div className="border-2 border-dashed border-[var(--b)] rounded-lg p-3 text-center cursor-pointer hover:border-[var(--blue)] transition-colors">
                  <div className="text-[11.5px] text-[var(--tx3)]">Upload medical certificate, etc.</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setShowApply(false)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!applyFrom || !applyTo || !applyReason}
                className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer disabled:opacity-50"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
