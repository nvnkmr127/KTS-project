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

// Populated once the WhatsApp Business API integration is connected.
const RECENT_LOGS: { id: string; type: string; recipients: number; delivered: number; failed: number; time: string; date: string; status: 'Sent' }[] = [];

const CATEGORY_VARIANT: Record<string, 'blue' | 'amber' | 'teal' | 'purple' | 'green' | 'red' | 'coral'> = {
  Fee: 'amber', Attendance: 'blue', Events: 'teal', Meeting: 'purple', Notice: 'green', Emergency: 'red',
};

export function WhatsApp() {
  const [showCompose, setShowCompose] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);

  const totalSent = RECENT_LOGS.reduce((s, l) => s + l.delivered, 0);
  const totalFailed = RECENT_LOGS.reduce((s, l) => s + l.failed, 0);
  const totalMessages = totalSent + totalFailed;

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="flex items-start gap-2.5 p-3.5 mb-3 bg-[var(--amber-bg)] border border-[var(--amber-tx)]/25 rounded-xl">
        <AlertCircle size={15} className="text-[var(--amber-tx)] mt-0.5 flex-shrink-0" />
        <div className="text-[12px] text-[var(--amber-tx)]">
          <span className="font-semibold">WhatsApp integration is not connected yet.</span>{' '}
          Templates below are ready to use once a WhatsApp Business API account is linked. Contact your service provider to enable sending.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="Messages Today" value={totalMessages} sub="All channels" icon={<MessageCircle size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Delivered" value={totalSent} sub={totalMessages > 0 ? `${Math.round((totalSent / totalMessages) * 100)}% delivery rate` : 'No messages yet'} icon={<CheckCircle2 size={15} />} iconBg="var(--green-bg)" iconColor="var(--green-tx)" />
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
          {RECENT_LOGS.length === 0 && (
            <div className="text-center py-8 text-[11.5px] text-[var(--tx3)]">
              No messages sent yet. The log will populate once WhatsApp is connected.
            </div>
          )}
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
            <div className="text-[12px] font-semibold text-[var(--tx)] mb-2">Auto-Send Schedule <span className="font-normal text-[var(--tx3)]">(activates with integration)</span></div>
            <div className="space-y-2">
              {[
                { label: 'Morning absent alerts', time: '8:30 AM', active: false },
                { label: 'Daily diary', time: '9:30 AM', active: false },
                { label: 'Fee reminders', time: '10:00 AM', active: false },
                { label: 'Daily school summary', time: '5:00 PM', active: false },
                { label: 'Bus arrival alert', time: 'Auto', active: false },
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
              <button onClick={() => setSelectedTemplate(null)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Close</button>
              <button disabled title="Available once WhatsApp is connected" className="flex-1 py-2.5 bg-[var(--teal)] text-white rounded-xl text-[12.5px] font-semibold flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed">
                <Send size={13} /> Send (integration pending)
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
              <button onClick={() => setShowCompose(false)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Close</button>
              <button disabled title="Available once WhatsApp is connected" className="flex-1 py-2.5 bg-[var(--teal)] text-white rounded-xl text-[12.5px] font-semibold flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed">
                <Send size={13} /> Send (integration pending)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
