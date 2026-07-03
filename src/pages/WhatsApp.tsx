import { useState } from 'react';
import {
  MessageCircle, Send, Users, Bell, X, CheckCircle2, Clock, AlertCircle,
} from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

const TEMPLATES = [
  { id: '1', name: 'Fee Due Reminder', category: 'Fee', content: 'Dear Parent, your child\'s school fee of ₹{{amount}} is due by {{date}}. Please pay at the earliest to avoid late fine. — Krishnaveni Talent School', usage: 142 },
  { id: '2', name: 'Daily Absent Alert', category: 'Attendance', content: 'Dear Parent, your child {{name}} was absent today ({{date}}). Please inform school if leave was planned. — Krishnaveni Talent School', usage: 89 },
  { id: '3', name: 'Birthday Wish', category: 'Events', content: 'Happy Birthday {{name}}! 🎂 Wishing you a wonderful day. Best wishes from all your teachers and friends at Krishnaveni Talent School!', usage: 28 },
  { id: '4', name: 'Parent Meeting', category: 'Meeting', content: 'Dear Parent, a Parent-Teacher Meeting is scheduled on {{date}} at {{time}}. Your presence is mandatory. — Krishnaveni Talent School', usage: 56 },
  { id: '5', name: 'Holiday Notice', category: 'Notice', content: 'Dear Parent, school will remain closed on {{date}} due to {{reason}}. Classes will resume on {{next_date}}. — Krishnaveni Talent School', usage: 34 },
  { id: '6', name: 'Emergency Alert', category: 'Emergency', content: '🚨 URGENT: {{message}}. Please take immediate action. Contact school: 9876543210. — Krishnaveni Talent School', usage: 5 },
];

const RECENT_LOGS = [
  { id: '1', type: 'Fee Reminder', recipients: 18, delivered: 17, failed: 1, time: '8:00 AM', date: '2026-06-05', status: 'Sent' as const },
  { id: '2', type: 'Absent Alert', recipients: 26, delivered: 26, failed: 0, time: '9:15 AM', date: '2026-06-05', status: 'Sent' as const },
  { id: '3', type: 'Daily Diary', recipients: 847, delivered: 839, failed: 8, time: '9:45 AM', date: '2026-06-05', status: 'Sent' as const },
  { id: '4', type: 'Bus Alert — Route 1', recipients: 24, delivered: 24, failed: 0, time: '7:48 AM', date: '2026-06-05', status: 'Sent' as const },
  { id: '5', type: 'Birthday Wish', recipients: 2, delivered: 2, failed: 0, time: '7:00 AM', date: '2026-06-05', status: 'Sent' as const },
];

const CATEGORY_VARIANT: Record<string, 'blue' | 'amber' | 'teal' | 'purple' | 'green' | 'red' | 'coral'> = {
  Fee: 'amber', Attendance: 'blue', Events: 'teal', Meeting: 'purple', Notice: 'green', Emergency: 'red',
};

export function WhatsApp() {
  const [showCompose, setShowCompose] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);

  const totalSent = RECENT_LOGS.reduce((s, l) => s + l.delivered, 0);
  const totalFailed = RECENT_LOGS.reduce((s, l) => s + l.failed, 0);

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="Messages Today" value={totalSent + totalFailed} sub="All channels" icon={<MessageCircle size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Delivered" value={totalSent} sub={`${Math.round((totalSent / (totalSent + totalFailed)) * 100)}% delivery rate`} icon={<CheckCircle2 size={15} />} iconBg="var(--green-bg)" iconColor="var(--green-tx)" />
        <KPICard label="Failed" value={totalFailed} sub="Retry available" icon={<AlertCircle size={15} />} iconBg="var(--red-bg)" iconColor="var(--red-tx)" />
        <KPICard label="Templates" value={TEMPLATES.length} sub="Ready to use" icon={<Bell size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[5fr_4fr] gap-2.5">
        <div className="space-y-2.5">
          {/* Send Message Card */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="text-[13px] font-semibold text-[var(--tx)]">Send Message</div>
              <button onClick={() => setShowCompose(true)} className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11.5px] bg-[var(--teal)] text-white rounded-lg cursor-pointer hover:opacity-90 w-full sm:w-auto">
                <Send size={11} /> Compose
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Fee Due Reminder', icon: '💰', count: '18 parents', color: 'var(--amber-bg)', tx: 'var(--amber-tx)' },
                { label: 'Absent Alert', icon: '📋', count: '26 students', color: 'var(--blue-bg)', tx: 'var(--blue-tx)' },
                { label: 'Holiday Notice', icon: '📅', count: 'All parents', color: 'var(--teal-bg)', tx: 'var(--teal-tx)' },
                { label: 'PTM Invite', icon: '👥', count: 'All parents', color: 'var(--purple-bg)', tx: 'var(--purple-tx)' },
                { label: 'Emergency Alert', icon: '🚨', count: 'All parents', color: 'var(--red-bg)', tx: 'var(--red-tx)' },
                { label: 'Birthday Wish', icon: '🎂', count: "2 today", color: 'var(--pink-bg)', tx: 'var(--pink-tx)' },
              ].map((item) => (
                <button
                   key={item.label}
                   className="p-3 rounded-xl border border-[var(--b)] text-left hover:border-current cursor-pointer transition-all"
                   style={{ background: item.color }}
                >
                  <div className="text-[16px] mb-1.5">{item.icon}</div>
                  <div className="text-[11.5px] font-semibold" style={{ color: item.tx }}>{item.label}</div>
                  <div className="text-[10.5px] mt-0.5" style={{ color: item.tx, opacity: 0.7 }}>{item.count}</div>
                </button>
              ))}
            </div>

            {/* Templates */}
            <div className="text-[11.5px] font-semibold text-[var(--tx)] mb-2">Message Templates</div>
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className="w-full text-left p-3 bg-[var(--surf2)] border border-[var(--b)] rounded-xl hover:border-[var(--blue)] cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-[var(--tx)]">{t.name}</span>
                      <Badge variant={CATEGORY_VARIANT[t.category] ?? 'gray'}>{t.category}</Badge>
                    </div>
                    <span className="text-[10.5px] text-[var(--tx3)]">Used {t.usage}x</span>
                  </div>
                  <div className="text-[11px] text-[var(--tx3)] truncate">{t.content}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent logs */}
        <Card>
          <div className="text-[12.5px] font-semibold text-[var(--tx)] mb-3">Today's Message Log</div>
          <div className="space-y-2">
            {RECENT_LOGS.map((log) => (
              <div key={log.id} className="p-3 bg-[var(--surf2)] border border-[var(--b)] rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-semibold text-[var(--tx)]">{log.type}</span>
                  <span className="text-[10.5px] text-[var(--tx3)]">{log.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[11px] text-[var(--tx3)]">
                    <Users size={10} /> {log.recipients} recipients
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[var(--teal-tx)]">
                    <CheckCircle2 size={10} /> {log.delivered} delivered
                  </div>
                  {log.failed > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-[var(--red-tx)]">
                      <AlertCircle size={10} /> {log.failed} failed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--b)]">
            <div className="text-[12px] font-semibold text-[var(--tx)] mb-2">Auto-Send Schedule</div>
            <div className="space-y-2">
              {[
                { label: 'Morning absent alerts', time: '8:30 AM', active: true },
                { label: 'Daily diary', time: '9:30 AM', active: true },
                { label: 'Fee reminders', time: '10:00 AM', active: true },
                { label: 'Daily school summary', time: '5:00 PM', active: true },
                { label: 'Bus arrival alert', time: 'Auto', active: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-[var(--teal)]' : 'bg-[var(--tx3)]'}`} />
                    <span className="text-[11.5px] text-[var(--tx2)]">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10.5px] text-[var(--tx3)]">
                    <Clock size={9} /> {item.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Template preview modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[460px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">{selectedTemplate.name}</div>
                <Badge variant={CATEGORY_VARIANT[selectedTemplate.category] ?? 'gray'}>{selectedTemplate.category}</Badge>
              </div>
              <button onClick={() => setSelectedTemplate(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5">
              <div className="text-[11.5px] text-[var(--tx3)] mb-2">Message Preview</div>
              <div className="bg-[var(--teal-bg)] rounded-xl p-3.5 text-[12.5px] text-[var(--teal-tx)] leading-relaxed mb-4">
                {selectedTemplate.content}
              </div>
              <div className="text-[11.5px] text-[var(--tx3)] mb-3">Select Recipients</div>
              <div className="grid grid-cols-2 gap-2">
                {['All Parents', 'LKG Parents', 'UKG Parents', 'Class 1 Parents', 'Class 2 Parents', 'Class 3 Parents', 'Class 4 Parents', 'Class 5 Parents', 'Class 6 Parents', 'Class 7 Parents', 'Class 8 Parents', 'Class 9 Parents', 'Class 10 Parents'].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked={g === 'All Parents'} />
                    <span className="text-[12px] text-[var(--tx2)]">{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setSelectedTemplate(null)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button onClick={() => setSelectedTemplate(null)} className="flex-1 py-2.5 bg-[var(--teal)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer flex items-center justify-center gap-1.5">
                <Send size={13} /> Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[480px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">Compose Message</div>
              <button onClick={() => setShowCompose(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Recipients *</label>
                <select className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                  <option>All Parents (284)</option>
                  <option>Class 8 Parents (81)</option>
                  <option>Fee Defaulters (18)</option>
                  <option>Absent students' parents (26)</option>
                </select>
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Message *</label>
                <textarea className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none resize-none focus:border-[var(--blue)]" rows={5} placeholder="Type your message here..." />
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Schedule</label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="schedule" defaultChecked /><span className="text-[12px] text-[var(--tx2)]">Send now</span></label>
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="schedule" /><span className="text-[12px] text-[var(--tx2)]">Schedule for later</span></label>
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setShowCompose(false)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button onClick={() => setShowCompose(false)} className="flex-1 py-2.5 bg-[var(--teal)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer flex items-center justify-center gap-1.5">
                <Send size={13} /> Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
