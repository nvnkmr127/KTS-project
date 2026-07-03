import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { api } from '../services/api';
import { useDialog } from '../context/DialogContext';
import { 
  Globe, Plus, Trash2, CheckCircle2, Shield, 
  AlertCircle, RefreshCw, X, Loader2, Save,
  Activity, Search, Clock, Power, List, 
  Send, Eye, EyeOff, Copy, Play, AlertTriangle,
  Settings
} from 'lucide-react';

interface Webhook {
  id: string;
  event_name: string;
  url: string;
  is_active: boolean;
  description: string;
  signing_secret?: string;
  timeout_seconds?: number;
  consecutive_failures?: number;
  last_called_at?: string;
  last_success_at?: string;
  last_failure_at?: string;
  created_at?: string;
}

interface WebhookCall {
  id: string;
  webhook_id: string;
  success: boolean;
  status_code: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  response_body: string;
  execution_time_ms: number;
  event_id: string;
  delivery_id: string;
  created_at: string;
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

export function WebhookManagement() {
  const { confirm } = useDialog();
  const [view, setView] = useState<'list' | 'configure' | 'logs'>('list');
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    calls_count: 0,
    success_rate: 100
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Events/Categories metadata
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [eventTypes, setEventTypes] = useState<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [categories, setCategories] = useState<Record<string, any>>({});

  // Active webhook selection (for Configure view)
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [webhookCalls, setWebhookCalls] = useState<WebhookCall[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  // Form states for Create/Edit Webhook
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvent, setWebhookEvent] = useState('payment.created');
  const [webhookDescription, setWebhookDescription] = useState('');
  const [webhookTimeout, setWebhookTimeout] = useState(30);
  const [webhookIsActive, setWebhookIsActive] = useState(true);

  // UI interaction states
  const [secretVisible, setSecretVisible] = useState(false);
  // eslint-disable-next-line unused-imports/no-unused-vars
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [submittingWebhook, setSubmittingWebhook] = useState(false);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [testingDaily, setTestingDaily] = useState(false);
  const [sendingDaily, setSendingDaily] = useState(false);
  const [replayingCallId, setReplayingCallId] = useState<string | null>(null);

  const [inspectingCall, setInspectingCall] = useState<WebhookCall | null>(null);
  const [activeInspectTab, setActiveInspectTab] = useState<'payload' | 'response'>('payload');

  // Message states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Filtering states (Overview)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`; // Format DD-MM-YYYY
  });

  // Load all webhooks
  const loadWebhooks = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setLoadingWebhooks(true);
    try {
      const data = await api.getResources('webhooks');
      if (Array.isArray(data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setWebhooks(data.map((w: any) => ({
          id: String(w.id),
          event_name: w.event_name,
          url: w.url,
          is_active: !!w.is_active,
          description: w.description || '',
          signing_secret: w.signing_secret || '',
          timeout_seconds: w.timeout_seconds || 30,
          consecutive_failures: w.consecutive_failures || 0,
          last_called_at: w.last_called_at,
          last_success_at: w.last_success_at,
          last_failure_at: w.last_failure_at,
          created_at: w.created_at
        })));
      }
    } catch (err) {
      console.error('Error loading webhooks:', err);
      showError('Failed to load configured webhooks: ' + ((err as Error).message || 'Unknown error'));
      setWebhooks([]);
    } finally {
      setLoadingWebhooks(false);
    }
  };

  // Convert DD-MM-YYYY to YYYY-MM-DD for backend
  const getBackendDate = (ddmmyyyy: string) => {
    if (!ddmmyyyy) return undefined;
    const parts = ddmmyyyy.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
    }
    return ddmmyyyy;
  };

  // Load Stats
  const loadStats = async (dateStr?: string) => {
    setLoadingStats(true);
    try {
      const backendDate = dateStr ? getBackendDate(dateStr) : undefined;
      const res = await api.getWebhookStats(backendDate);
      if (res && res.success && res.stats) {
        setStats({
          total: res.stats.total ?? 0,
          active: res.stats.active ?? 0,
          calls_count: res.stats.calls_count ?? 0,
          success_rate: Math.round(res.stats.success_rate ?? 100)
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load Events Metadata
  const loadEventsMetadata = async () => {
    try {
      const res = await api.getWebhookEvents();
      if (res && res.success) {
        setEventTypes(res.event_types || {});
        setCategories(res.categories || {});
      }
    } catch (err) {
      console.error('Error loading event metadata:', err);
    }
  };

  // Load calls logs for a specific webhook
  const loadWebhookCalls = async (webhookId: string) => {
    setLoadingCalls(true);
    try {
      const res = await api.getWebhookCalls(webhookId);
      if (res && res.success && Array.isArray(res.logs)) {
        setWebhookCalls(res.logs);
      }
    } catch (err) {
      console.error('Error loading webhook calls:', err);
    } finally {
      setLoadingCalls(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadWebhooks();
    loadStats(filterDate);
    loadEventsMetadata();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 5000);
  };

  // Handle stats refresh on date update
  const handleApplyFilters = () => {
    loadStats(filterDate);
    loadWebhooks();
  };

  // Toggle active/inactive status
  const handleToggleActive = async (w: Webhook) => {
    try {
      const res = await api.toggleWebhook(w.id);
      if (res && res.success) {
        showSuccess(res.message || 'Webhook status updated.');
        // Update local list
        setWebhooks(prev => prev.map(item => item.id === w.id ? { ...item, is_active: !item.is_active } : item));
        // If currently editing, update selectedWebhook
        if (selectedWebhook && selectedWebhook.id === w.id) {
          setSelectedWebhook(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
        }
        loadStats(filterDate);
      }
    } catch (err) {
      showError((err as Error).message || 'Failed to toggle status.');
    }
  };

  // Test webhook
  const handleTestWebhook = async (id: string) => {
    setTestingWebhookId(id);
    try {
      const res = await api.testWebhook(id);
      if (res && res.success) {
        showSuccess(res.message || 'Test webhook sent successfully.');
        if (selectedWebhook && selectedWebhook.id === id) {
          loadWebhookCalls(id);
        }
        loadStats(filterDate);
      } else {
        showError(res.message || 'Test failed.');
      }
    } catch (err) {
      showError((err as Error).message || 'Test webhook failed.');
    } finally {
      setTestingWebhookId(null);
    }
  };

  // Delete webhook
  const handleDeleteWebhook = async (id: string) => {
    if (!await confirm('Are you sure you want to delete this webhook configuration? This will also delete all recent activity logs for this webhook.', 'Delete Webhook', true)) return;
    try {
      await api.deleteResource('webhooks', id);
      showSuccess('Webhook deleted successfully.');
      setWebhooks(prev => prev.filter(w => w.id !== id));
      loadStats(filterDate);
    } catch (err) {
      showError((err as Error).message || 'Failed to delete webhook.');
    }
  };

  // Copy secret key to clipboard
  const handleCopySecret = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  // Regenerate secret key
  const handleRegenerateSecret = async (webhookId: string) => {
    if (!await confirm('Are you sure you want to regenerate the signing secret? This will invalidate the existing secret, and any external service verifying signatures with it will fail until updated.', 'Regenerate Secret', true)) return;
    try {
      const res = await api.regenerateWebhookSecret(webhookId);
      if (res && res.success && res.signing_secret) {
        showSuccess(res.message || 'Secret key regenerated successfully.');
        setSelectedWebhook(prev => prev ? { ...prev, signing_secret: res.signing_secret } : null);
        setWebhooks(prev => prev.map(w => w.id === webhookId ? { ...w, signing_secret: res.signing_secret } : w));
      }
    } catch (err) {
      showError((err as Error).message || 'Failed to regenerate secret.');
    }
  };

  // Replay a webhook call log
  const handleReplayCall = async (callId: string) => {
    setReplayingCallId(callId);
    try {
      const res = await api.replayWebhookCall(callId);
      if (res && res.success) {
        showSuccess(res.message || 'Webhook replayed successfully.');
        if (selectedWebhook) {
          loadWebhookCalls(selectedWebhook.id);
        }
        loadStats(filterDate);
      } else {
        showError(res.message || 'Replay failed.');
      }
    } catch (err) {
      showError((err as Error).message || 'Failed to replay webhook.');
    } finally {
      setReplayingCallId(null);
    }
  };

  // Test daily summary manual Artisan command run
  const handleTestDailySummary = async () => {
    setTestingDaily(true);
    try {
      const backendDate = getBackendDate(filterDate);
      const res = await api.testDailySummary(backendDate);
      if (res && res.success) {
        showSuccess(res.message || 'Daily summary test trigger processed.');
        if (res.output) {
          console.log('Daily summary output:', res.output);
        }
        loadStats(filterDate);
      } else {
        showError(res.error || 'Daily summary test failed.');
      }
    } catch (err) {
      showError((err as Error).message || 'Daily summary test trigger failed.');
    } finally {
      setTestingDaily(false);
    }
  };

  // Send daily summary manual command run (Force dispatch)
  const handleSendDailySummary = async () => {
    setSendingDaily(true);
    try {
      const backendDate = getBackendDate(filterDate);
      const res = await api.sendDailySummary(backendDate);
      if (res && res.success) {
        showSuccess(res.message || 'Daily summary sent successfully.');
        loadStats(filterDate);
      } else {
        showError(res.error || 'Daily summary trigger failed.');
      }
    } catch (err) {
      showError((err as Error).message || 'Daily summary trigger failed.');
    } finally {
      setSendingDaily(false);
    }
  };

  // Open Edit / Configure View
  const openConfigureView = (w: Webhook) => {
    setSelectedWebhook(w);
    setWebhookUrl(w.url);
    setWebhookEvent(w.event_name);
    setWebhookDescription(w.description);
    setWebhookTimeout(w.timeout_seconds || 30);
    setWebhookIsActive(w.is_active);
    setSecretVisible(false);
    loadWebhookCalls(w.id);
    setView('configure');
  };

  const openLogsView = (w: Webhook) => {
    setSelectedWebhook(w);
    loadWebhookCalls(w.id);
    setView('logs');
  };

  // Open Create / New View
  const openCreateView = () => {
    setSelectedWebhook(null);
    setWebhookUrl('');
    setWebhookEvent(Object.keys(eventTypes)[0] || 'payment.created');
    setWebhookDescription('');
    setWebhookTimeout(30);
    setWebhookIsActive(true);
    setWebhookCalls([]);
    setView('configure');
  };

  // Save / Submit Webhook
  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim() || !webhookEvent) {
      showError('Please specify an endpoint URL and event type.');
      return;
    }
    if (!webhookUrl.startsWith('https://')) {
      showError('URL must use HTTPS for security.');
      return;
    }

    setSubmittingWebhook(true);
    const payload = {
      url: webhookUrl.trim(),
      event_name: webhookEvent,
      description: webhookDescription.trim(),
      timeout_seconds: webhookTimeout,
      is_active: webhookIsActive
    };

    try {
      if (selectedWebhook) {
        // Update resource
        await api.updateResource('webhooks', selectedWebhook.id, payload);
        showSuccess('Webhook updated successfully.');
        await loadWebhooks();
        setView('list');
      } else {
        // Create resource
        await api.createResource('webhooks', payload);
        showSuccess('Webhook created successfully with generated signing secret!');
        await loadWebhooks();
        setView('list');
      }
      loadStats(filterDate);
    } catch (err) {
      showError((err as Error).message || 'Failed to save webhook configuration.');
    } finally {
      setSubmittingWebhook(false);
    }
  };

  // Filtered webhooks list for Overview
  const filteredWebhooks = webhooks.filter(w => {
    const matchSearch = !searchQuery.trim() || 
      w.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
      w.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchEvent = filterEvent === 'All' || w.event_name === filterEvent;
    
    let matchStatus = true;
    if (filterStatus === 'active') matchStatus = w.is_active;
    else if (filterStatus === 'inactive') matchStatus = !w.is_active;
    else if (filterStatus === 'failing') matchStatus = (w.consecutive_failures || 0) >= 3;

    return matchSearch && matchEvent && matchStatus;
  });

  const getEventNameDisplay = (eventKey: string) => {
    if (eventKey === '*') return 'All Events (Wildcard)';
    if (eventTypes[eventKey]) return eventTypes[eventKey].name;
    return eventKey.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getEventDescription = (eventKey: string) => {
    if (eventKey === '*') return 'Listen to all events in the application';
    if (eventTypes[eventKey]) return eventTypes[eventKey].description;
    return '';
  };

  // Group events by category
  const renderEventDropdownOptions = () => {
    const grouped: Record<string, { name: string, events: Array<{ key: string, label: string }> }> = {
      'Universal': { name: 'Universal', events: [{ key: '*', label: 'All Events (Wildcard)' }] }
    };

    // Fallbacks if categories empty
    const availableCategories = Object.keys(categories).length > 0 ? categories : {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'Financial': { name: 'Financial', events: {} },
      'Student Management': { name: 'Student Management', events: {} },
      'Lead Management': { name: 'Lead Management', events: {} },
      'Automation': { name: 'Automation', events: {} }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(availableCategories).forEach(([catKey, catVal]: [string, any]) => {
      const catName = catVal.name || catKey;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!grouped[catName]) {
        grouped[catName] = { name: catName, events: [] };
      }
      
      // Events in this category
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const catEvents = catVal.events || {};
      if (Object.keys(catEvents).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.entries(catEvents).forEach(([eKey, eVal]: [string, any]) => {
          grouped[catName].events.push({ key: eKey, label: eVal.name || eKey });
        });
      } else {
        // Fallback matching if categories don't list events directly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.entries(eventTypes).forEach(([eKey, eVal]: [string, any]) => {
          if (eVal.category === catName || eVal.category === catKey) {
            grouped[catName].events.push({ key: eKey, label: eVal.name || eKey });
          }
        });
      }
    });

    return Object.values(grouped).map(group => {
      if (group.events.length === 0) return null;
      return (
        <optgroup key={group.name} label={group.name}>
          {group.events.map(e => (
            <option key={e.key} value={e.key}>{e.label} ({e.key})</option>
          ))}
        </optgroup>
      );
    });
  };

  const getHealthPill = (failures: number, active: boolean) => {
    if (!active) return <Badge variant="gray">Disabled</Badge>;
    if (failures >= 5) return <Badge variant="red">Critical ({failures} failures)</Badge>;
    if (failures >= 3) return <Badge variant="amber">Failing ({failures} failures)</Badge>;
    return <Badge variant="green">Healthy</Badge>;
  };

  const getPulseLabel = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    if (diffMins < 60) {
      return (
        <div>
          <div className="font-semibold">{diffMins} mins ago</div>
          <div className="text-[9px] text-[var(--tx3)]">{formattedTime}</div>
        </div>
      );
    }
    if (diffHours < 24) {
      return (
        <div>
          <div className="font-semibold">{diffHours} hours ago</div>
          <div className="text-[9px] text-[var(--tx3)]">{formattedTime}</div>
        </div>
      );
    }
    return (
      <div>
        <div className="font-semibold">{diffDays} days ago</div>
        <div className="text-[9px] text-[var(--tx3)]">{formattedDate}, {formattedTime}</div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Alert Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-xl text-[12px] flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15 rounded-xl text-[12px] flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle size={14} className="text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {view === 'list' ? (
        <>
          {/* Main Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-bold text-[var(--tx)] flex items-center gap-2">
                <Globe size={16} className="text-[var(--blue-tx)]" /> Webhook Management
              </h2>
              <p className="text-[11px] text-[var(--tx3)] mt-0.5">Manage real-time notifications to external systems.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleTestDailySummary}
                disabled={testingDaily || sendingDaily}
                className="px-3.5 py-1.5 border border-[var(--b)] hover:bg-[var(--surf2)] text-[11.5px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {testingDaily ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                Test Summary
              </button>
              
              <button
                onClick={handleSendDailySummary}
                disabled={testingDaily || sendingDaily}
                className="px-3.5 py-1.5 border border-[var(--b)] hover:bg-[var(--surf2)] text-[11.5px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {sendingDaily ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Send Now
              </button>

              <button
                onClick={openCreateView}
                className="px-3.5 py-1.5 bg-[var(--blue)] text-white hover:opacity-90 text-[11.5px] font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={13} /> New Webhook
              </button>
            </div>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[var(--surf)] border border-[var(--b)] border-l-4 border-l-blue-500 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-semibold text-[var(--tx3)] uppercase tracking-wider block">Total Configured</span>
                <span className="text-[20px] font-extrabold text-[var(--tx)] mt-1 block">
                  {loadingStats ? <Loader2 size={14} className="animate-spin inline" /> : stats.total}
                </span>
              </div>
              <Globe size={18} className="text-blue-500 opacity-80" />
            </div>

            <div className="bg-[var(--surf)] border border-[var(--b)] border-l-4 border-l-emerald-500 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-semibold text-[var(--tx3)] uppercase tracking-wider block">Active Endpoints</span>
                <span className="text-[20px] font-extrabold text-[var(--tx)] mt-1 block">
                  {loadingStats ? <Loader2 size={14} className="animate-spin inline" /> : stats.active}
                </span>
              </div>
              <CheckCircle2 size={18} className="text-emerald-500 opacity-80" />
            </div>

            <div className="bg-[var(--surf)] border border-[var(--b)] border-l-4 border-l-sky-500 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-semibold text-[var(--tx3)] uppercase tracking-wider block">Calls (Jun 25)</span>
                <span className="text-[20px] font-extrabold text-[var(--tx)] mt-1 block">
                  {loadingStats ? <Loader2 size={14} className="animate-spin inline" /> : stats.calls_count}
                </span>
              </div>
              <Activity size={18} className="text-sky-500 opacity-80" />
            </div>

            <div className="bg-[var(--surf)] border border-[var(--b)] border-l-4 border-l-amber-500 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-semibold text-[var(--tx3)] uppercase tracking-wider block">Success Rate (Jun 25)</span>
                <span className="text-[20px] font-extrabold text-[var(--tx)] mt-1 block">
                  {loadingStats ? <Loader2 size={14} className="animate-spin inline" /> : `${stats.success_rate}%`}
                </span>
              </div>
              <Badge variant="amber" className="p-1 rounded-full text-amber-500 bg-amber-500/10">
                <Activity size={14} />
              </Badge>
            </div>
          </div>

          {/* Filtering Block */}
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-[var(--tx2)] mb-1">Search</label>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--tx3)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="URL or Description..."
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--tx2)] mb-1">Event Type</label>
                <select
                  value={filterEvent}
                  onChange={e => setFilterEvent(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2 py-1.5 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                >
                  <option value="All">All Events</option>
                  <option value="*">All Events (Wildcard)</option>
                  {Object.keys(eventTypes).map(k => (
                    <option key={k} value={k}>{getEventNameDisplay(k)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--tx2)] mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2 py-1.5 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                >
                  <option value="All">Any Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="failing">Failing/Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--tx2)] mb-1">Date</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                    placeholder="DD-MM-YYYY"
                    className="flex-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-1.5 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  />
                  <button
                    onClick={handleApplyFilters}
                    className="px-3.5 py-1.5 bg-[var(--blue)] text-white hover:opacity-90 text-[11.5px] font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Configured Endpoints Table */}
          <Card padding={false} className="overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--b)]">
              <h3 className="text-[12.5px] font-bold text-[var(--tx)]">Configured Endpoints</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--b)] bg-[var(--surf2)] text-[10.5px] font-bold text-[var(--tx3)] uppercase tracking-wider">
                    <th className="px-4 py-2.5">Event Type</th>
                    <th className="px-4 py-2.5">Target URL</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Last Pulse</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingWebhooks ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin text-[var(--blue)]" size={16} />
                          <span className="text-[12px] text-[var(--tx3)]">Loading webhooks...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredWebhooks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-[12px] text-[var(--tx3)] italic">
                        No webhooks configured matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredWebhooks.map(w => (
                      <tr key={w.id} className="border-b border-[var(--b)]/60 text-[12px] hover:bg-[var(--surf2)]/25">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-[var(--tx)]">{w.event_name}</div>
                          {w.description && (
                            <div className="text-[10px] text-[var(--tx3)] mt-0.5 max-w-[200px] truncate">{w.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11.5px] text-[var(--tx2)] truncate max-w-[250px] bg-[var(--surf2)] px-2 py-0.5 rounded border border-[var(--b)]">
                              {w.url}
                            </span>
                            <button
                              onClick={() => handleCopySecret(w.url)}
                              className="p-1 hover:bg-[var(--surf3)] text-[var(--tx3)] hover:text-[var(--tx)] rounded transition-colors cursor-pointer"
                              title="Copy URL"
                            >
                              <Copy size={11} />
                            </button>
                            <Badge variant="amber" className="text-[9px] px-1.5 py-0">Signed</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {getHealthPill(w.consecutive_failures || 0, w.is_active)}
                        </td>
                        <td className="px-4 py-3.5 text-[11px] text-[var(--tx2)]">
                          {getPulseLabel(w.last_called_at)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleTestWebhook(w.id)}
                              disabled={testingWebhookId === w.id}
                              className="p-1.5 bg-[var(--surf2)] border border-[var(--b)] hover:bg-[var(--surf3)] text-[var(--tx2)] hover:text-[var(--blue-tx)] rounded-lg transition-all cursor-pointer disabled:opacity-50"
                              title="Send Test Payload"
                            >
                              {testingWebhookId === w.id ? (
                                <Loader2 size={12} className="animate-spin text-[var(--blue)]" />
                              ) : (
                                <Send size={12} />
                              )}
                            </button>
                            
                            <button
                              onClick={() => openConfigureView(w)}
                              className="p-1.5 bg-[var(--surf2)] border border-[var(--b)] hover:bg-[var(--surf3)] text-[var(--tx2)] hover:text-[var(--blue-tx)] rounded-lg transition-all cursor-pointer"
                              title="Configure"
                            >
                              <Settings size={12} />
                            </button>

                            <button
                              onClick={() => openLogsView(w)}
                              className="p-1.5 bg-[var(--surf2)] border border-[var(--b)] hover:bg-[var(--surf3)] text-[var(--tx2)] hover:text-[var(--blue-tx)] rounded-lg transition-all cursor-pointer"
                              title="View Logs"
                            >
                              <List size={12} />
                            </button>

                            <button
                              onClick={() => handleToggleActive(w)}
                              className={`p-1.5 border rounded-lg transition-all cursor-pointer ${
                                w.is_active
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-600 hover:bg-rose-500/20'
                              }`}
                              title={w.is_active ? 'Deactivate Webhook' : 'Activate Webhook'}
                            >
                              <Power size={12} />
                            </button>

                            <button
                              onClick={() => handleDeleteWebhook(w.id)}
                              className="p-1.5 bg-[var(--surf2)] border border-[var(--b)] hover:bg-rose-500/10 hover:border-rose-500/20 text-[var(--tx3)] hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                              title="Delete Configuration"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : view === 'configure' ? (
        /* ================= CONFIGURE / EDIT VIEW ================= */
        <div className="space-y-4">
          {/* Breadcrumbs & Title Row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--tx3)]">
                <span className="hover:text-[var(--tx)] cursor-pointer" onClick={() => setView('list')}>Webhooks</span>
                <span>/</span>
                <span>{selectedWebhook ? 'Edit Configuration' : 'New Configuration'}</span>
              </div>
              <h2 className="text-[15px] font-bold text-[var(--tx)] mt-1">
                {selectedWebhook ? 'Configure Endpoint' : 'Create Webhook Endpoint'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {selectedWebhook && (
                <button
                  type="button"
                  onClick={() => handleTestWebhook(selectedWebhook.id)}
                  disabled={testingWebhookId === selectedWebhook.id}
                  className="px-3.5 py-1.5 border border-[var(--b)] hover:bg-[var(--surf2)] text-[11.5px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {testingWebhookId === selectedWebhook.id ? (
                    <Loader2 size={12} className="animate-spin text-[var(--blue)]" />
                  ) : (
                    <Send size={12} />
                  )}
                  Send Test
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-3.5 py-1.5 border border-[var(--b)] hover:bg-[var(--surf2)] text-[11.5px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X size={12} />
                Close
              </button>
            </div>
          </div>

          {/* Configuration Split Layout */}
          <form onSubmit={handleSaveWebhook} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Left Columns (General + Security) */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* General Configuration Card */}
              <Card>
                <h3 className="text-[10px] font-bold text-[var(--tx3)] uppercase tracking-wider mb-4">General Configuration</h3>
                
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">Endpoint URL *</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tx3)] text-[11.5px]">
                        <Globe size={13} />
                      </div>
                      <input
                        type="url"
                        value={webhookUrl}
                        onChange={e => setWebhookUrl(e.target.value)}
                        placeholder="https://your-server.com/webhooks/listener"
                        required
                        className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg pl-9 pr-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] font-mono"
                      />
                    </div>
                    <p className="text-[9.5px] text-[var(--tx3)] mt-1">Webhook payloads will be sent as POST requests to this URL. HTTPS is required.</p>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">Event Type *</label>
                    <select
                      value={webhookEvent}
                      onChange={e => setWebhookEvent(e.target.value)}
                      required
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                    >
                      {renderEventDropdownOptions()}
                    </select>
                    {webhookEvent && (
                      <p className="text-[9.5px] text-[var(--tx3)] mt-1.5 bg-[var(--surf2)] p-2 rounded-lg border border-[var(--b)]/60 italic leading-normal font-medium text-[var(--tx)]">
                        {getEventDescription(webhookEvent)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">Description (Optional)</label>
                    <textarea
                      value={webhookDescription}
                      onChange={e => setWebhookDescription(e.target.value)}
                      placeholder="e.g. Receive payment alerts for syncing with third party ledger app"
                      rows={3}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">Timeout (Seconds)</label>
                      <input
                        type="number"
                        min={5}
                        max={120}
                        value={webhookTimeout}
                        onChange={e => setWebhookTimeout(Number(e.target.value))}
                        className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                      />
                    </div>

                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 text-[12px] text-[var(--tx2)] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={webhookIsActive}
                          onChange={e => setWebhookIsActive(e.target.checked)}
                          className="rounded border-[var(--b)] text-[var(--blue)] focus:ring-0 cursor-pointer"
                        />
                        Enable webhook receiver
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--b)]/60 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingWebhook}
                    className="px-4 py-2 bg-[var(--blue)] text-white hover:opacity-90 disabled:opacity-50 text-[12px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {submittingWebhook ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                    {submittingWebhook ? 'Saving...' : selectedWebhook ? 'Update Endpoint' : 'Create Webhook'}
                  </button>
                </div>
              </Card>

              {/* Security & Authentication Card */}
              <Card>
                <h3 className="text-[10px] font-bold text-[var(--red-tx)] uppercase tracking-wider mb-2">Security & Authentication</h3>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-[12px] font-bold text-[var(--tx)] flex items-center gap-1.5">
                      <Shield size={13} className="text-emerald-500" /> Signing Secret
                    </h4>
                    <p className="text-[11px] text-[var(--tx3)] leading-relaxed mt-1">
                      Use this secret to verify the `X-Webhook-Signature` header in requests sent to your server. This verifies KTS generated the payload.
                    </p>
                  </div>

                  {selectedWebhook ? (
                    <div className="flex items-center gap-2 bg-[var(--surf2)] border border-[var(--b)] rounded-lg p-2.5">
                      <div className="flex-1 font-mono text-[12px] text-[var(--tx)] select-all truncate">
                        {secretVisible ? (
                          selectedWebhook.signing_secret || 'No secret configured'
                        ) : (
                          '••••••••••••••••••••••••••••••••••••••••••••••••••••••••'
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSecretVisible(!secretVisible)}
                          className="p-1.5 hover:bg-[var(--surf3)] text-[var(--tx3)] hover:text-[var(--tx)] rounded transition-colors cursor-pointer"
                          title={secretVisible ? 'Hide secret key' : 'Show secret key'}
                        >
                          {secretVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleCopySecret(selectedWebhook.signing_secret || '')}
                          className="p-1.5 hover:bg-[var(--surf3)] text-[var(--tx3)] hover:text-[var(--tx)] rounded transition-colors cursor-pointer"
                          title="Copy signing secret"
                        >
                          <Copy size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRegenerateSecret(selectedWebhook.id)}
                          className="p-1.5 hover:bg-[var(--surf3)] text-[var(--tx3)] hover:text-amber-600 rounded transition-colors cursor-pointer"
                          title="Regenerate secret key"
                        >
                          <RefreshCw size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[var(--tx3)] italic bg-[var(--surf2)]/60 border border-dashed border-[var(--b)] p-3 rounded-lg text-center">
                      Secret key will be automatically generated upon creating the webhook.
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column (Health + Timeline) */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Health Status Card */}
              <Card>
                <h3 className="text-[10px] font-bold text-[var(--tx3)] uppercase tracking-wider mb-3">Health Status</h3>
                
                {selectedWebhook ? (
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      (selectedWebhook.consecutive_failures || 0) >= 3
                        ? 'bg-rose-500/10 text-rose-600'
                        : 'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {(selectedWebhook.consecutive_failures || 0) >= 3 ? (
                        <AlertTriangle size={18} />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[var(--tx)]">
                        {(selectedWebhook.consecutive_failures || 0) >= 3 ? 'Failing' : 'Healthy'}
                      </div>
                      <div className="text-[10.5px] text-[var(--tx3)] mt-0.5">
                        {selectedWebhook.consecutive_failures || 0} consecutive failures
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-[11px] text-[var(--tx3)] italic">
                    Not configured yet
                  </div>
                )}
              </Card>

              {/* Recent Activity Timeline Card */}
              <Card padding={false} className="flex flex-col h-[400px]">
                <div className="px-4 py-3 border-b border-[var(--b)] flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-[var(--tx3)] uppercase tracking-wider">Recent Activity</h3>
                  {selectedWebhook && (
                    <button
                      type="button"
                      onClick={() => loadWebhookCalls(selectedWebhook.id)}
                      className="p-1 hover:bg-[var(--surf3)] text-[var(--tx3)] hover:text-[var(--tx)] rounded transition-colors cursor-pointer"
                      title="Refresh delivery logs"
                    >
                      <RefreshCw size={11} />
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {!selectedWebhook ? (
                    <div className="text-center py-12 text-[11.5px] text-[var(--tx3)] italic">
                      Logs will display here after creation.
                    </div>
                  ) : loadingCalls ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin text-[var(--blue)]" size={20} />
                    </div>
                  ) : webhookCalls.length === 0 ? (
                    <div className="text-center py-12 text-[11.5px] text-[var(--tx3)] italic">
                      No webhook deliveries yet. Use "Send Test" above to trigger a payload.
                    </div>
                  ) : (
                    <div className="relative border-l border-[var(--b)] ml-2.5 pl-4 space-y-4 text-[11.5px]">
                      {webhookCalls.map(call => {
                        const callDate = new Date(call.created_at);
                        const timeLabel = callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
                          ', ' + callDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

                        return (
                          <div key={call.id} className="relative group">
                            {/* Dot indicator */}
                            <div className={`absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full border-2 bg-[var(--surf)] ${
                              call.success 
                                ? 'border-emerald-500 ring-4 ring-emerald-500/10' 
                                : 'border-rose-500 ring-4 ring-rose-500/10'
                            }`} />
                            
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-semibold text-[var(--tx)] flex items-center gap-1.5">
                                  <span>{call.success ? 'Delivered' : 'Failed'}</span>
                                  <span className={`text-[10px] px-1 rounded font-mono ${
                                    call.success 
                                      ? 'bg-emerald-500/10 text-emerald-600' 
                                      : 'bg-rose-500/10 text-rose-600'
                                  }`}>
                                    Code {call.status_code || 'N/A'}
                                  </span>
                                </div>
                                <div className="text-[9.5px] text-[var(--tx3)] mt-0.5">{timeLabel}</div>
                                {call.execution_time_ms && (
                                  <div className="text-[9px] text-[var(--tx3)] mt-0.5 font-mono font-medium text-[var(--tx)]">Response time: {call.execution_time_ms}ms</div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleReplayCall(call.id)}
                                disabled={replayingCallId === call.id}
                                className="p-1 hover:bg-[var(--surf3)] text-[var(--tx3)] hover:text-[var(--blue-tx)] rounded transition-colors cursor-pointer flex-shrink-0"
                                title="Replay this delivery payload"
                              >
                                {replayingCallId === call.id ? (
                                  <Loader2 size={11} className="animate-spin text-[var(--blue)]" />
                                ) : (
                                  <Play size={11} />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </form>
        </div>
      ) : (
        /* ================= WEBHOOK LOGS VIEW ================= */
        <div className="space-y-4">
          {/* Breadcrumbs & Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--tx3)]">
                <span className="hover:text-[var(--tx)] cursor-pointer" onClick={() => setView('list')}>Webhooks</span>
                <span>/</span>
                <span>Logs</span>
              </div>
              <h2 className="text-[15px] font-bold text-[var(--tx)] mt-1 flex items-center gap-2">
                <List size={16} className="text-[var(--blue-tx)]" />
                Webhook Logs for <span className="font-mono text-[13px] bg-[var(--surf2)] px-2 py-0.5 rounded border border-[var(--b)]">{selectedWebhook?.url}</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => selectedWebhook && loadWebhookCalls(selectedWebhook.id)}
                className="px-3.5 py-1.5 border border-[var(--b)] hover:bg-[var(--surf2)] text-[11.5px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                Refresh Logs
              </button>
              
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-3.5 py-1.5 border border-[var(--b)] hover:bg-[var(--surf2)] text-[11.5px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X size={12} />
                Close
              </button>
            </div>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[var(--surf)] border border-[var(--b)] border-l-4 border-l-blue-500 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-semibold text-[var(--tx3)] uppercase tracking-wider block">Total Attempts</span>
                <span className="text-[20px] font-extrabold text-[var(--tx)] mt-1 block">
                  {loadingCalls ? <Loader2 size={14} className="animate-spin inline" /> : webhookCalls.length}
                </span>
              </div>
              <Activity size={18} className="text-blue-500 opacity-80" />
            </div>

            <div className="bg-[var(--surf)] border border-[var(--b)] border-l-4 border-l-emerald-500 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-semibold text-[var(--tx3)] uppercase tracking-wider block">Successful Deliveries</span>
                <span className="text-[20px] font-extrabold text-[var(--tx)] mt-1 block">
                  {loadingCalls ? (
                    <Loader2 size={14} className="animate-spin inline" />
                  ) : (
                    webhookCalls.filter(c => c.success).length
                  )}
                </span>
              </div>
              <CheckCircle2 size={18} className="text-emerald-500 opacity-80" />
            </div>

            <div className="bg-[var(--surf)] border border-[var(--b)] border-l-4 border-l-rose-500 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-semibold text-[var(--tx3)] uppercase tracking-wider block">Failed Deliveries</span>
                <span className="text-[20px] font-extrabold text-[var(--tx)] mt-1 block">
                  {loadingCalls ? (
                    <Loader2 size={14} className="animate-spin inline" />
                  ) : (
                    webhookCalls.filter(c => !c.success).length
                  )}
                </span>
              </div>
              <AlertCircle size={18} className="text-rose-500 opacity-80" />
            </div>

            <div className="bg-[var(--surf)] border border-[var(--b)] border-l-4 border-l-amber-500 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-semibold text-[var(--tx3)] uppercase tracking-wider block">Success Rate</span>
                <span className="text-[20px] font-extrabold text-[var(--tx)] mt-1 block">
                  {loadingCalls ? (
                    <Loader2 size={14} className="animate-spin inline" />
                  ) : (
                    `${webhookCalls.length > 0 ? Math.round((webhookCalls.filter(c => c.success).length / webhookCalls.length) * 100) : 100}%`
                  )}
                </span>
              </div>
              <Activity size={18} className="text-amber-500 opacity-80" />
            </div>
          </div>

          {/* Webhook Logs Table Card */}
          <Card padding={false} className="overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--b)]">
              <h3 className="text-[12.5px] font-bold text-[var(--tx)]">Delivery History</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--b)] bg-[var(--surf2)] text-[10.5px] font-bold text-[var(--tx3)] uppercase tracking-wider">
                    <th className="px-4 py-2.5">Attempt ID</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">HTTP Code</th>
                    <th className="px-4 py-2.5">Response Time</th>
                    <th className="px-4 py-2.5">Timestamp</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCalls ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin text-[var(--blue)]" size={16} />
                          <span className="text-[12px] text-[var(--tx3)]">Loading delivery history...</span>
                        </div>
                      </td>
                    </tr>
                  ) : webhookCalls.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-[12px] text-[var(--tx3)] italic">
                        No delivery attempts recorded for this webhook.
                      </td>
                    </tr>
                  ) : (
                    webhookCalls.map(call => (
                      <tr key={call.id} className="border-b border-[var(--b)]/60 text-[12px] hover:bg-[var(--surf2)]/25">
                        <td className="px-4 py-3.5 font-mono text-[11px] text-[var(--tx2)]">
                          #{call.id}
                        </td>
                        <td className="px-4 py-3.5">
                          {call.success ? (
                            <Badge variant="green">Success</Badge>
                          ) : (
                            <Badge variant="red">Failed</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-semibold">
                          <span className={call.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {call.status_code || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-[var(--tx2)]">
                          {call.execution_time_ms ? `${call.execution_time_ms}ms` : 'N/A'}
                        </td>
                        <td className="px-4 py-3.5 text-[11px] text-[var(--tx2)]">
                          {formatDateTime(call.created_at)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setInspectingCall(call);
                                setActiveInspectTab('payload');
                              }}
                              className="px-2.5 py-1 bg-[var(--blue-bg)] text-[var(--blue-tx)] hover:bg-[var(--blue-bg)]/80 text-[11px] font-semibold rounded transition-colors cursor-pointer"
                            >
                              Inspect
                            </button>
                            
                            <button
                              onClick={() => handleReplayCall(call.id)}
                              disabled={replayingCallId === call.id}
                              className="p-1 hover:bg-[var(--surf3)] text-[var(--tx3)] hover:text-[var(--blue-tx)] rounded transition-colors cursor-pointer disabled:opacity-50"
                              title="Replay payload"
                            >
                              {replayingCallId === call.id ? (
                                <Loader2 size={12} className="animate-spin text-[var(--blue)]" />
                              ) : (
                                <Play size={12} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ================= INSPECT TRANSACTION DETAILS MODAL ================= */}
      {inspectingCall && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[800px] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--b)] flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-[var(--tx)]">Transaction Details</h3>
              <button
                onClick={() => setInspectingCall(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--surf2)] text-[var(--tx3)] hover:text-[var(--tx)] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Custom Tabs */}
            <div className="px-6 pt-4 border-b border-[var(--b)] bg-[var(--surf)] flex gap-4">
              <button
                onClick={() => setActiveInspectTab('payload')}
                className={`pb-3 text-[13px] font-medium border-b-2 transition-all cursor-pointer ${
                  activeInspectTab === 'payload'
                    ? 'text-[var(--blue)] border-[var(--blue)] font-semibold'
                    : 'text-[var(--tx3)] border-transparent hover:text-[var(--tx)]'
                }`}
              >
                Request Payload
              </button>
              <button
                onClick={() => setActiveInspectTab('response')}
                className={`pb-3 text-[13px] font-medium border-b-2 transition-all cursor-pointer ${
                  activeInspectTab === 'response'
                    ? 'text-[var(--blue)] border-[var(--blue)] font-semibold'
                    : 'text-[var(--tx3)] border-transparent hover:text-[var(--tx)]'
                }`}
              >
                Response Body
              </button>
            </div>

            {/* Code Block Container */}
            <div className="p-6 overflow-y-auto flex-1 bg-[var(--surf)]">
              <pre className="bg-[var(--surf2)] text-slate-100 p-4 rounded-xl font-mono text-[12px] overflow-auto max-h-[400px] whitespace-pre-wrap break-all leading-relaxed border border-slate-800">
                <code>
                  {(() => {
                    const data = activeInspectTab === 'payload' ? inspectingCall.payload : inspectingCall.response_body;
                    if (!data) return '{}';
                    if (typeof data === 'string') {
                      try {
                        return JSON.stringify(JSON.parse(data), null, 2);
                      } catch {
                        return data;
                      }
                    }
                    return JSON.stringify(data, null, 2);
                  })()}
                </code>
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--b)] bg-[var(--surf2)]/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-[var(--tx3)] font-mono">
                ID: {inspectingCall.id} | {formatDateTime(inspectingCall.created_at)}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleReplayCall(inspectingCall.id)}
                  disabled={replayingCallId === inspectingCall.id}
                  className="px-3.5 py-1.5 bg-[var(--teal)] hover:bg-[var(--teal)] text-white text-[12px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {replayingCallId === inspectingCall.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  Replay Event
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingCall(null)}
                  className="px-4 py-1.5 border border-[var(--b)] bg-[var(--surf)] hover:bg-[var(--surf2)] text-[12px] font-semibold rounded-lg text-[var(--tx)] cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
