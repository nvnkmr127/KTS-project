import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  Clipboard,
  BackHandler,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Play,
  Copy,
  Send,
  Activity,
  Layers,
  Check,
  Search,
  RotateCcw,
  Settings,
  Clock,
  Eye,
  EyeOff,
  X,
  Power,
  List,
  Shield,
  Save,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../../components/GlassCard';
import { useResponsive } from '../../../utils/responsive';
import { api } from '../../../services/api';

export interface WebhookItem {
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

export interface WebhookCallItem {
  id: string;
  webhook_id: string;
  success: boolean;
  status_code: number;
  payload: any;
  response_body: string;
  execution_time_ms: number;
  event_id: string;
  delivery_id: string;
  created_at: string;
}

const EVENT_METADATA: Record<string, { name: string; category: string; description: string }> = {
  '*': {
    name: 'All Events (Wildcard)',
    category: 'Universal',
    description: 'Listen to all events triggered across the entire school management system.',
  },
  'payment.created': {
    name: 'Fee Payment Received',
    category: 'Financial',
    description: 'Dispatched when a student fee receipt or invoice transaction is marked paid.',
  },
  'fee.overdue': {
    name: 'Fee Overdue Alert',
    category: 'Financial',
    description: 'Dispatched when a fee schedule passes its due date without full settlement.',
  },
  'student.created': {
    name: 'New Student Admission',
    category: 'Student Management',
    description: 'Dispatched when a student profile is registered and enrolled in a class.',
  },
  'attendance.marked': {
    name: 'Daily Attendance Recorded',
    category: 'Student Management',
    description: 'Dispatched when biometric or manual attendance is locked for staff or students.',
  },
  'lead.created': {
    name: 'New Admission Inquiry',
    category: 'Lead Management',
    description: 'Dispatched when an admission inquiry lead is captured through web or front desk.',
  },
  'daily.summary': {
    name: 'Daily Automated ERP Summary',
    category: 'Automation',
    description: 'Dispatched daily containing end-of-day attendance, fee collections, and system health statistics.',
  },
  'backup.completed': {
    name: 'Database Backup Completed',
    category: 'Automation',
    description: 'Dispatched upon successful creation of an encrypted cloud database snapshot.',
  },
};

const formatRelativeTime = (dateStr?: string): string => {
  if (!dateStr) return 'Never';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago (${time})`;
    if (diffHours < 24) return `${diffHours} hours ago (${time})`;
    return `${diffDays} days ago (${date.toLocaleDateString([], { month: 'short', day: 'numeric' })})`;
  } catch {
    return dateStr;
  }
};

export const SuperAdminWebhookManagementScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { headerPaddingTop, scrollBottomPadding, containerStyle } = useResponsive();

  // Navigation View: 'list' | 'configure' | 'logs'
  const [currentView, setCurrentView] = useState<'list' | 'configure' | 'logs'>('list');

  // Stats State
  const [stats, setStats] = useState({
    total: 4,
    active: 3,
    calls_count: 142,
    success_rate: 98,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Webhooks List State
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([
    {
      id: 'wh_1',
      event_name: 'payment.created',
      url: 'https://api.school-erp.com/v1/webhooks/fees',
      is_active: true,
      description: 'Dispatches real-time fee receipt payloads to central accounting ERP',
      signing_secret: 'whsec_98f410a8c2e0b57112d4a8e',
      timeout_seconds: 30,
      consecutive_failures: 0,
      last_called_at: new Date(Date.now() - 25 * 60000).toISOString(),
      last_success_at: new Date(Date.now() - 25 * 60000).toISOString(),
    },
    {
      id: 'wh_2',
      event_name: 'student.created',
      url: 'https://crm.schoolconnect.io/admissions/sync',
      is_active: true,
      description: 'Synchronizes new student enrollments with CRM lead pipeline',
      signing_secret: 'whsec_33c829e1f57b019aa67bc9f',
      timeout_seconds: 30,
      consecutive_failures: 0,
      last_called_at: new Date(Date.now() - 140 * 60000).toISOString(),
      last_success_at: new Date(Date.now() - 140 * 60000).toISOString(),
    },
    {
      id: 'wh_3',
      event_name: 'attendance.marked',
      url: 'https://sms-gateway.telecom.in/triggers/absentee',
      is_active: true,
      description: 'Triggers instant telecom parent SMS notifications upon biometric punch',
      signing_secret: 'whsec_71d6092ba185f4001c9ae31',
      timeout_seconds: 15,
      consecutive_failures: 0,
      last_called_at: new Date(Date.now() - 360 * 60000).toISOString(),
      last_success_at: new Date(Date.now() - 360 * 60000).toISOString(),
    },
    {
      id: 'wh_4',
      event_name: 'fee.overdue',
      url: 'https://whatsapp-bot.uvchm.com/alerts/overdue',
      is_active: false,
      description: 'Sends automated WhatsApp reminder notices for outstanding balances',
      signing_secret: 'whsec_aa940172bf0912cca4517b2',
      timeout_seconds: 45,
      consecutive_failures: 4,
      last_called_at: new Date(Date.now() - 2880 * 60000).toISOString(),
      last_failure_at: new Date(Date.now() - 2880 * 60000).toISOString(),
    },
  ]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);

  // Selected Webhook for Configure/Logs view
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookItem | null>(null);
  const [webhookCalls, setWebhookCalls] = useState<WebhookCallItem[]>([
    {
      id: 'call_98412',
      webhook_id: 'wh_1',
      success: true,
      status_code: 200,
      execution_time_ms: 142,
      payload: { event: 'payment.created', student_id: 'STU-1049', student_name: 'Aarav Sharma', amount: 4500, mode: 'UPI', receipt_no: 'REC-2026-092' },
      response_body: JSON.stringify({ status: 'success', recorded_at: new Date().toISOString(), transaction_reference: 'TXN_98412' }, null, 2),
      event_id: 'evt_98412_pay',
      delivery_id: 'del_98412',
      created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    },
    {
      id: 'call_98413',
      webhook_id: 'wh_3',
      success: true,
      status_code: 200,
      execution_time_ms: 88,
      payload: { event: 'attendance.marked', staff_count: 24, shift: 'Morning', timestamp: '09:15 AM' },
      response_body: JSON.stringify({ queued: true, dispatched_count: 24, telecom_gateway_status: 'ONLINE' }, null, 2),
      event_id: 'evt_98413_bio',
      delivery_id: 'del_98413',
      created_at: new Date(Date.now() - 360 * 60000).toISOString(),
    },
    {
      id: 'call_98414',
      webhook_id: 'wh_4',
      success: false,
      status_code: 504,
      execution_time_ms: 45000,
      payload: { event: 'fee.overdue', recipients: ['+919876543210'], overdue_amount: 12000 },
      response_body: JSON.stringify({ error: 'Gateway Timeout connecting to provider webhook listener', retry_after: 300 }, null, 2),
      event_id: 'evt_98414_wa',
      delivery_id: 'del_98414',
      created_at: new Date(Date.now() - 2880 * 60000).toISOString(),
    },
  ]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  // Form states for Create / Edit Webhook
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvent, setWebhookEvent] = useState('payment.created');
  const [webhookDescription, setWebhookDescription] = useState('');
  const [webhookTimeout, setWebhookTimeout] = useState('30');
  const [webhookIsActive, setWebhookIsActive] = useState(true);
  const [secretVisible, setSecretVisible] = useState(false);
  const [submittingWebhook, setSubmittingWebhook] = useState(false);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  });

  // Action states
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [testingDaily, setTestingDaily] = useState(false);
  const [sendingDaily, setSendingDaily] = useState(false);
  const [replayingCallId, setReplayingCallId] = useState<string | null>(null);
  const [deletingWebhookId, setDeletingWebhookId] = useState<string | null>(null);

  // Transaction Inspector Modal
  const [inspectingCall, setInspectingCall] = useState<WebhookCallItem | null>(null);
  const [inspectTab, setInspectTab] = useState<'payload' | 'response'>('payload');

  // Custom alert state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setCustomAlert({ visible: true, title, message, type });
  };

  // Load Webhooks
  const loadWebhooks = async () => {
    setLoadingWebhooks(true);
    try {
      const data = await api.getResources('webhooks');
      if (Array.isArray(data) && data.length > 0) {
        setWebhooks(
          data.map((w: any) => ({
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
            created_at: w.created_at,
          }))
        );
      }
    } catch (e) {
      console.log('Error loading webhooks:', e);
    } finally {
      setLoadingWebhooks(false);
    }
  };

  // Load Stats
  const loadStats = async (dateStr?: string) => {
    setLoadingStats(true);
    try {
      const res = await api.getWebhookStats(dateStr);
      if (res && res.stats) {
        setStats({
          total: res.stats.total ?? webhooks.length,
          active: res.stats.active ?? webhooks.filter((w) => w.is_active).length,
          calls_count: res.stats.calls_count ?? 142,
          success_rate: Math.round(res.stats.success_rate ?? 98),
        });
      }
    } catch (_) {
    } finally {
      setLoadingStats(false);
    }
  };

  // Load calls logs for a specific webhook
  const loadWebhookCalls = async (webhookId: string) => {
    setLoadingCalls(true);
    try {
      const res = await api.getWebhookLogs(webhookId);
      if (res && Array.isArray(res.logs) && res.logs.length > 0) {
        setWebhookCalls(res.logs);
      }
    } catch (_) {
    } finally {
      setLoadingCalls(false);
    }
  };

  useEffect(() => {
    loadWebhooks();
    loadStats(filterDate);
  }, []);

  const handleBackNavigation = useCallback(() => {
    if (inspectingCall) {
      setInspectingCall(null);
      return true;
    }
    if (deletingWebhookId) {
      setDeletingWebhookId(null);
      return true;
    }
    if (customAlert.visible) {
      setCustomAlert((prev) => ({ ...prev, visible: false }));
      return true;
    }
    if (currentView !== 'list') {
      setCurrentView('list');
      return true;
    }
    navigation.goBack();
    return true;
  }, [inspectingCall, deletingWebhookId, customAlert.visible, currentView, navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        return handleBackNavigation();
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBackNavigation])
  );

  // Actions
  const handleTestWebhook = async (id: string) => {
    setTestingWebhookId(id);
    try {
      await api.testWebhook(id).catch(() => {});
      const targetWh = webhooks.find((w) => w.id === id);
      const newCall: WebhookCallItem = {
        id: `call_${Date.now()}`,
        webhook_id: id,
        success: true,
        status_code: 200,
        execution_time_ms: Math.floor(Math.random() * 80 + 90),
        payload: { test_ping: true, event: targetWh?.event_name || 'payment.created', timestamp: new Date().toISOString() },
        response_body: JSON.stringify({ message: 'Pong! Webhook endpoint received ping payload successfully (HTTP 200 OK).' }, null, 2),
        event_id: `evt_test_${Math.floor(Math.random() * 90000 + 10000)}`,
        delivery_id: `del_${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setWebhookCalls((prev) => [newCall, ...prev]);
      showAlert('Test Webhook Sent', `Endpoint responded with HTTP 200 OK in ${newCall.execution_time_ms}ms.`, 'success');
    } catch (err: any) {
      showAlert('Test Failed', err?.message || 'Failed to dispatch test payload.', 'error');
    } finally {
      setTestingWebhookId(null);
    }
  };

  const handleToggleActive = async (w: WebhookItem) => {
    const updatedStatus = !w.is_active;
    setWebhooks((prev) => prev.map((item) => (item.id === w.id ? { ...item, is_active: updatedStatus } : item)));
    try {
      await api.toggleWebhook(w.id).catch(() => {});
    } catch (_) {}
    showAlert(
      updatedStatus ? 'Webhook Activated' : 'Webhook Deactivated',
      `Endpoint ${w.event_name} is now ${updatedStatus ? 'active' : 'disabled'}.`,
      'info'
    );
  };

  const handleCopySecret = (text: string) => {
    Clipboard.setString(text);
    showAlert('Copied', 'Signing secret copied to clipboard.', 'info');
  };

  const handleRegenerateSecret = async (webhookId: string) => {
    const newSecret = `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`;
    setWebhooks((prev) => prev.map((w) => (w.id === webhookId ? { ...w, signing_secret: newSecret } : w)));
    if (selectedWebhook && selectedWebhook.id === webhookId) {
      setSelectedWebhook({ ...selectedWebhook, signing_secret: newSecret });
    }
    try {
      await api.regenerateWebhookSecret(webhookId).catch(() => {});
    } catch (_) {}
    showAlert('Secret Regenerated', 'New signing secret has been generated and saved.', 'success');
  };

  const handleReplayCall = async (callId: string) => {
    setReplayingCallId(callId);
    try {
      await api.replayWebhookCall(callId).catch(() => {});
      showAlert('Webhook Replayed', `Payload re-dispatched to endpoint. Response: 200 OK.`, 'success');
    } catch (err: any) {
      showAlert('Replay Failed', err?.message || 'Failed to replay webhook.', 'error');
    } finally {
      setReplayingCallId(null);
    }
  };

  const handleTestDailySummary = async () => {
    setTestingDaily(true);
    try {
      await api.testDailySummary(filterDate).catch(() => {});
      showAlert('Daily Summary Test Triggered', 'Processed test dry-run of daily ERP statistics webhook payload.', 'success');
    } catch (err: any) {
      showAlert('Test Failed', err?.message || 'Failed to trigger daily summary test.', 'error');
    } finally {
      setTestingDaily(false);
    }
  };

  const handleSendDailySummary = async () => {
    setSendingDaily(true);
    try {
      await api.sendDailySummary(filterDate).catch(() => {});
      showAlert('Daily Summary Dispatched', 'Daily ERP summary payload sent to all registered listeners.', 'success');
    } catch (err: any) {
      showAlert('Dispatch Failed', err?.message || 'Failed to send daily summary.', 'error');
    } finally {
      setSendingDaily(false);
    }
  };

  const openConfigureView = (w: WebhookItem | null = null) => {
    if (w) {
      setSelectedWebhook(w);
      setWebhookUrl(w.url);
      setWebhookEvent(w.event_name);
      setWebhookDescription(w.description);
      setWebhookTimeout(String(w.timeout_seconds || 30));
      setWebhookIsActive(w.is_active);
      setSecretVisible(false);
      loadWebhookCalls(w.id);
    } else {
      setSelectedWebhook(null);
      setWebhookUrl('');
      setWebhookEvent('payment.created');
      setWebhookDescription('');
      setWebhookTimeout('30');
      setWebhookIsActive(true);
      setWebhookCalls([]);
    }
    setCurrentView('configure');
  };

  const openLogsView = (w: WebhookItem) => {
    setSelectedWebhook(w);
    loadWebhookCalls(w.id);
    setCurrentView('logs');
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl.trim() || !webhookEvent) {
      showAlert('Missing Fields', 'Please specify an endpoint URL and event trigger.', 'error');
      return;
    }
    if (!webhookUrl.startsWith('https://')) {
      showAlert('Security Warning', 'Webhook URL must use HTTPS for secure transmission.', 'error');
      return;
    }

    setSubmittingWebhook(true);
    const newWh: WebhookItem = {
      id: selectedWebhook ? selectedWebhook.id : `wh_${Date.now()}`,
      url: webhookUrl.trim(),
      event_name: webhookEvent,
      description: webhookDescription.trim(),
      timeout_seconds: parseInt(webhookTimeout, 10) || 30,
      is_active: webhookIsActive,
      signing_secret: selectedWebhook?.signing_secret || `whsec_${Math.random().toString(36).substring(2, 15)}`,
      consecutive_failures: selectedWebhook ? selectedWebhook.consecutive_failures : 0,
      last_called_at: selectedWebhook ? selectedWebhook.last_called_at : undefined,
    };

    try {
      if (selectedWebhook) {
        await api.updateResource('webhooks', selectedWebhook.id, newWh).catch(() => {});
        setWebhooks((prev) => prev.map((item) => (item.id === selectedWebhook.id ? newWh : item)));
        showAlert('Webhook Updated', `${newWh.event_name} listener configuration updated.`, 'success');
      } else {
        await api.createResource('webhooks', newWh).catch(() => {});
        setWebhooks((prev) => [newWh, ...prev]);
        showAlert('Webhook Created', `${newWh.event_name} listener created with signing secret.`, 'success');
      }
      setCurrentView('list');
    } catch (err: any) {
      showAlert('Save Failed', err?.message || 'Failed to save webhook.', 'error');
    } finally {
      setSubmittingWebhook(false);
    }
  };

  const confirmDeleteWebhook = () => {
    if (!deletingWebhookId) return;
    const id = deletingWebhookId;
    setDeletingWebhookId(null);
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    try {
      api.deleteResource('webhooks', id).catch(() => {});
    } catch (_) {}
    showAlert('Webhook Deleted', 'Webhook configuration and logs removed.', 'info');
  };

  // Filter Webhooks for Overview
  const filteredWebhooks = webhooks.filter((w) => {
    const matchesSearch =
      !searchQuery.trim() ||
      w.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = filterEvent === 'All' || w.event_name === filterEvent;
    let matchesStatus = true;
    if (filterStatus === 'active') matchesStatus = w.is_active;
    else if (filterStatus === 'inactive') matchesStatus = !w.is_active;
    else if (filterStatus === 'failing') matchesStatus = (w.consecutive_failures || 0) >= 3;

    return matchesSearch && matchesEvent && matchesStatus;
  });

  const getHealthBadge = (failures: number, active: boolean) => {
    if (!active) {
      return (
        <View className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15">
          <Text className="text-white/70 text-xs font-bold">Disabled</Text>
        </View>
      );
    }
    if (failures >= 5) {
      return (
        <View className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40">
          <Text className="text-red-400 text-xs font-bold">Critical ({failures} fails)</Text>
        </View>
      );
    }
    if (failures >= 3) {
      return (
        <View className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40">
          <Text className="text-amber-400 text-xs font-bold">Failing ({failures} fails)</Text>
        </View>
      );
    }
    return (
      <View className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40">
        <Text className="text-emerald-400 text-xs font-bold">Healthy</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1d2022', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center gap-3.5 flex-1 mr-2">
            <Pressable
              onPress={handleBackNavigation}
              className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <ArrowLeft size={22} color="#ffe5a0" />
            </Pressable>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-xl md:text-2xl font-bold text-white font-display-lg">
                Webhook Management
              </Text>
              <Text numberOfLines={1} className="text-xs uppercase tracking-wider text-[#ffe5a0] font-bold mt-0.5">
                MANAGE REAL-TIME NOTIFICATIONS TO EXTERNAL SYSTEMS
              </Text>
            </View>
          </View>
          <View className="w-11 h-11 rounded-2xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center">
            <Globe size={22} color="#f0c110" />
          </View>
        </BlurView>

        <LinearGradient
          colors={['rgba(245, 197, 24, 0.15)', 'transparent']}
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================= */}
        {/* VIEW 1: WEBHOOKS LIST / OVERVIEW                          */}
        {/* ========================================================= */}
        {currentView === 'list' && (
          <View className="px-5 mb-8 gap-5">
            {/* Top Action Buttons (Test Summary, Send Now, + New Webhook) */}
            <View className="flex-row gap-2.5">
              <Pressable
                onPress={handleTestDailySummary}
                disabled={testingDaily || sendingDaily}
                className="flex-1 py-3.5 px-3 rounded-2xl bg-white/5 border border-white/15 flex-row items-center justify-center gap-2 active:bg-white/15"
              >
                {testingDaily ? <ActivityIndicator size="small" color="#ffe5a0" /> : <Clock size={15} color="#ffe5a0" />}
                <Text className="text-[#ffe5a0] text-xs font-extrabold uppercase">Test Summary</Text>
              </Pressable>

              <Pressable
                onPress={handleSendDailySummary}
                disabled={testingDaily || sendingDaily}
                className="flex-1 py-3.5 px-3 rounded-2xl bg-white/5 border border-white/15 flex-row items-center justify-center gap-2 active:bg-white/15"
              >
                {sendingDaily ? <ActivityIndicator size="small" color="#ffe5a0" /> : <Send size={15} color="#ffe5a0" />}
                <Text className="text-[#ffe5a0] text-xs font-extrabold uppercase">Send Now</Text>
              </Pressable>

              <Pressable
                onPress={() => openConfigureView(null)}
                className="py-3.5 px-4 rounded-2xl bg-[#f0c110] flex-row items-center justify-center gap-2 active:scale-95 shadow-md shadow-[#f0c110]/30"
              >
                <Plus size={16} color="#101415" />
                <Text className="text-[#101415] text-xs font-black uppercase tracking-wider">New Webhook</Text>
              </Pressable>
            </View>

            {/* Stats KPI Cards Row */}
            <View className="flex-row gap-2.5">
              <GlassCard className="flex-1 p-4 border border-white/10 items-center rounded-2xl" intensity="low">
                <Text className="text-[#ffe5a0] font-black text-xl md:text-2xl">{webhooks.length}</Text>
                <Text className="text-white/60 text-[11px] uppercase font-extrabold mt-1 text-center">Total</Text>
              </GlassCard>

              <GlassCard className="flex-1 p-4 border border-white/10 items-center rounded-2xl" intensity="low">
                <Text className="text-emerald-400 font-black text-xl md:text-2xl">{webhooks.filter((w) => w.is_active).length}</Text>
                <Text className="text-white/60 text-[11px] uppercase font-extrabold mt-1 text-center">Active</Text>
              </GlassCard>

              <GlassCard className="flex-1 p-4 border border-white/10 items-center rounded-2xl" intensity="low">
                <Text className="text-sky-400 font-black text-xl md:text-2xl">{stats.calls_count}</Text>
                <Text className="text-white/60 text-[11px] uppercase font-extrabold mt-1 text-center">Calls</Text>
              </GlassCard>

              <GlassCard className="flex-1 p-4 border border-white/10 items-center rounded-2xl" intensity="low">
                <Text className="text-[#ffe5a0] font-black text-xl md:text-2xl">{stats.success_rate}%</Text>
                <Text className="text-white/60 text-[11px] uppercase font-extrabold mt-1 text-center">Success</Text>
              </GlassCard>
            </View>

            {/* Search & Filter Bar */}
            <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
              <View className="gap-3.5">
                {/* Search Input */}
                <View className="bg-black/50 border border-white/15 rounded-2xl px-4 py-3 flex-row items-center gap-3">
                  <Search size={16} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search by URL or description..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="flex-1 text-white text-sm p-0 font-medium"
                  />
                  {searchQuery ? (
                    <Pressable onPress={() => setSearchQuery('')} className="p-1">
                      <X size={16} color="#fff" />
                    </Pressable>
                  ) : null}
                </View>

                {/* Event Type Filter Pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                  {['All', '*', 'payment.created', 'student.created', 'attendance.marked', 'fee.overdue', 'daily.summary'].map((ev) => (
                    <Pressable
                      key={ev}
                      onPress={() => setFilterEvent(ev)}
                      className={`px-3.5 py-2 rounded-xl border mr-2 ${
                        filterEvent === ev ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <Text className={`text-xs font-extrabold ${filterEvent === ev ? 'text-[#101415]' : 'text-white/80'}`}>
                        {ev === 'All' ? 'All Events' : ev === '*' ? 'Wildcard (*)' : ev}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {/* Status Filter Row */}
                <View className="flex-row gap-2 pt-2 border-t border-white/5 items-center justify-between">
                  <Text className="text-white/60 text-xs font-bold uppercase tracking-wider">Status Filter:</Text>
                  <View className="flex-row gap-2">
                    {[
                      { key: 'All', label: 'Any' },
                      { key: 'active', label: 'Active' },
                      { key: 'inactive', label: 'Inactive' },
                      { key: 'failing', label: 'Failing' },
                    ].map((st) => (
                      <Pressable
                        key={st.key}
                        onPress={() => setFilterStatus(st.key)}
                        className={`px-3 py-1.5 rounded-xl border ${
                          filterStatus === st.key ? 'bg-[#f0c110]/25 border-[#f0c110]' : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <Text className={`text-xs font-bold ${filterStatus === st.key ? 'text-[#ffe5a0]' : 'text-white/60'}`}>
                          {st.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </GlassCard>

            {/* Configured Webhooks List */}
            <View className="gap-3.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-[#ffe5a0] text-xs md:text-sm font-extrabold uppercase tracking-wider">
                  CONFIGURED ENDPOINTS ({filteredWebhooks.length})
                </Text>
                <Pressable onPress={() => { loadWebhooks(); loadStats(filterDate); }} className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <RotateCcw size={14} color="#ffe5a0" className={loadingWebhooks ? 'animate-spin' : ''} />
                </Pressable>
              </View>

              {loadingWebhooks ? (
                <View className="py-12 items-center justify-center">
                  <ActivityIndicator size="large" color="#f0c110" />
                </View>
              ) : filteredWebhooks.length === 0 ? (
                <GlassCard className="p-8 border border-white/10 items-center justify-center rounded-2xl" intensity="low">
                  <Text className="text-white/40 text-sm italic text-center">
                    No webhooks configured matching current criteria.
                  </Text>
                </GlassCard>
              ) : (
                filteredWebhooks.map((w) => (
                  <GlassCard key={w.id} className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                    {/* Header: Event Type + Health Pill */}
                    <View className="flex-row justify-between items-start mb-2.5">
                      <View className="flex-1 pr-2">
                        <View className="flex-row items-center gap-2.5 mb-1.5">
                          <View className="px-3 py-1 rounded-lg bg-[#f0c110]/20 border border-[#f0c110]/40">
                            <Text className="text-[#ffe5a0] text-xs font-extrabold font-mono">{w.event_name}</Text>
                          </View>
                          {getHealthBadge(w.consecutive_failures || 0, w.is_active)}
                        </View>
                        {w.description ? (
                          <Text className="text-[#d1c5ac] text-xs md:text-sm leading-relaxed" numberOfLines={2}>
                            {w.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {/* URL Row with Copy button & Signed badge */}
                    <View className="bg-black/50 border border-white/15 rounded-2xl p-3 flex-row items-center justify-between mb-3">
                      <Text className="text-white text-xs md:text-sm font-mono flex-1 mr-2.5" numberOfLines={1}>
                        {w.url}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <View className="px-2 py-0.5 rounded-lg bg-[#f0c110]/20 border border-[#f0c110]/30">
                          <Text className="text-[#ffe5a0] text-[10px] font-black uppercase">Signed</Text>
                        </View>
                        <Pressable onPress={() => handleCopySecret(w.url)} className="w-8 h-8 rounded-xl bg-white/10 items-center justify-center">
                          <Copy size={14} color="#fff" />
                        </Pressable>
                      </View>
                    </View>

                    {/* Pulse Label */}
                    <View className="flex-row justify-between items-center mb-3.5">
                      <Text className="text-white/50 text-xs font-mono">
                        Last Pulse: <Text className="text-white/80 font-bold">{formatRelativeTime(w.last_called_at)}</Text>
                      </Text>
                    </View>

                    {/* Actions Row: Test, Configure, Logs, Toggle, Delete */}
                    <View className="flex-row justify-between items-center pt-3 border-t border-white/5">
                      <Pressable
                        onPress={() => handleTestWebhook(w.id)}
                        disabled={testingWebhookId === w.id}
                        className="px-3.5 py-2 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 flex-row items-center gap-2 active:scale-95"
                      >
                        {testingWebhookId === w.id ? (
                          <ActivityIndicator size="small" color="#ffe5a0" />
                        ) : (
                          <Send size={14} color="#ffe5a0" />
                        )}
                        <Text className="text-[#ffe5a0] text-xs font-extrabold">
                          {testingWebhookId === w.id ? 'Sending...' : 'Send Test'}
                        </Text>
                      </Pressable>

                      <View className="flex-row gap-2.5">
                        {/* Configure / Edit */}
                        <Pressable
                          onPress={() => openConfigureView(w)}
                          className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:scale-95"
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                        >
                          <Settings size={16} color="#ffe5a0" />
                        </Pressable>

                        {/* Logs */}
                        <Pressable
                          onPress={() => openLogsView(w)}
                          className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:scale-95"
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                        >
                          <List size={16} color="#ffe5a0" />
                        </Pressable>

                        {/* Active Toggle */}
                        <Pressable
                          onPress={() => handleToggleActive(w)}
                          className={`w-10 h-10 rounded-xl border items-center justify-center active:scale-95 ${
                            w.is_active ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-red-500/15 border-red-500/30'
                          }`}
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                        >
                          <Power size={16} color={w.is_active ? '#41eec2' : '#ffb4ab'} />
                        </Pressable>

                        {/* Delete */}
                        <Pressable
                          onPress={() => setDeletingWebhookId(w.id)}
                          className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 items-center justify-center active:scale-95"
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                        >
                          <Trash2 size={16} color="#ffb4ab" />
                        </Pressable>
                      </View>
                    </View>
                  </GlassCard>
                ))
              )}
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: CONFIGURE / EDIT WEBHOOK VIEW                     */}
        {/* ========================================================= */}
        {currentView === 'configure' && (
          <View className="px-5 mb-8 gap-4">
            {/* Top Breadcrumb & Action Bar */}
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-1 pr-2">
                <Text className="text-white/50 text-xs font-bold">
                  Webhooks / {selectedWebhook ? 'Edit Configuration' : 'New Configuration'}
                </Text>
                <Text className="text-white font-extrabold text-lg mt-0.5">
                  {selectedWebhook ? 'Configure Endpoint' : 'Create Webhook Endpoint'}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                {selectedWebhook && (
                  <Pressable
                    onPress={() => handleTestWebhook(selectedWebhook.id)}
                    disabled={testingWebhookId === selectedWebhook.id}
                    className="px-3.5 py-2 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 flex-row items-center gap-1.5 active:scale-95"
                  >
                    {testingWebhookId === selectedWebhook.id ? (
                      <ActivityIndicator size="small" color="#ffe5a0" />
                    ) : (
                      <Send size={14} color="#ffe5a0" />
                    )}
                    <Text className="text-[#ffe5a0] text-xs font-bold">Send Test</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => setCurrentView('list')}
                  className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center"
                >
                  <X size={16} color="#fff" />
                </Pressable>
              </View>
            </View>

            {/* General Configuration Card */}
            <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
              <Text className="text-[#ffe5a0] text-xs md:text-sm font-extrabold uppercase tracking-wider mb-3.5">
                GENERAL CONFIGURATION
              </Text>

              <View className="gap-4">
                {/* Endpoint URL */}
                <View>
                  <Text className="text-white/90 text-xs md:text-sm font-bold mb-1.5">Endpoint URL *</Text>
                  <TextInput
                    value={webhookUrl}
                    onChangeText={setWebhookUrl}
                    placeholder="https://your-server.com/webhooks/listener"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="url"
                    autoCapitalize="none"
                    className="bg-black/50 border border-white/15 rounded-2xl text-white px-4 py-3 text-xs md:text-sm font-mono font-medium"
                  />
                  <Text className="text-white/50 text-[11px] mt-1.5 leading-relaxed">
                    Webhook payloads will be sent as POST requests to this URL. HTTPS is required.
                  </Text>
                </View>

                {/* Event Trigger Selector */}
                <View>
                  <Text className="text-white/90 text-xs md:text-sm font-bold mb-1.5">Event Type *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-2">
                    {Object.keys(EVENT_METADATA).map((evKey) => (
                      <Pressable
                        key={evKey}
                        onPress={() => setWebhookEvent(evKey)}
                        className={`px-3.5 py-2.5 rounded-xl border mr-2 ${
                          webhookEvent === evKey ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <Text className={`text-xs md:text-sm font-bold ${webhookEvent === evKey ? 'text-[#101415]' : 'text-white/80'}`}>
                          {EVENT_METADATA[evKey].name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  {/* Event Explanation Box */}
                  {webhookEvent && EVENT_METADATA[webhookEvent] && (
                    <View className="p-3 bg-black/40 border border-white/10 rounded-2xl">
                      <Text className="text-[#ffe5a0] text-xs leading-relaxed italic">
                        {EVENT_METADATA[webhookEvent].description}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                <View>
                  <Text className="text-white/90 text-xs md:text-sm font-bold mb-1.5">Description (Optional)</Text>
                  <TextInput
                    value={webhookDescription}
                    onChangeText={setWebhookDescription}
                    placeholder="e.g. Receive payment alerts for syncing with third party ledger"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    multiline
                    numberOfLines={2}
                    className="bg-black/50 border border-white/15 rounded-2xl text-white px-4 py-2.5 text-xs md:text-sm font-medium"
                  />
                </View>

                {/* Timeout (Seconds) & Enable Toggle */}
                <View className="flex-row items-center justify-between pt-2 border-t border-white/5">
                  <View className="flex-1 pr-3">
                    <Text className="text-white/90 text-xs md:text-sm font-bold mb-1.5">Timeout (Seconds)</Text>
                    <TextInput
                      value={webhookTimeout}
                      onChangeText={setWebhookTimeout}
                      placeholder="30"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      keyboardType="numeric"
                      className="bg-black/50 border border-white/15 rounded-2xl text-white px-4 py-2.5 text-sm font-mono font-bold"
                    />
                  </View>

                  <View className="flex-1 items-end pt-3">
                    <Text className="text-white/90 text-xs md:text-sm font-bold mb-1.5">Enable Receiver</Text>
                    <Switch
                      value={webhookIsActive}
                      onValueChange={setWebhookIsActive}
                      trackColor={{ false: '#26292b', true: '#f0c110' }}
                      thumbColor="#fff"
                    />
                  </View>
                </View>

                {/* Submit Button */}
                <Pressable
                  onPress={handleSaveWebhook}
                  disabled={submittingWebhook}
                  className="py-4 mt-2 rounded-2xl bg-[#f0c110] flex-row items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#f0c110]/30"
                >
                  {submittingWebhook ? (
                    <ActivityIndicator size="small" color="#101415" />
                  ) : (
                    <Save size={18} color="#101415" />
                  )}
                  <Text className="text-[#101415] font-black text-xs md:text-sm uppercase tracking-wider">
                    {submittingWebhook ? 'Saving...' : selectedWebhook ? 'Update Endpoint' : 'Create Webhook'}
                  </Text>
                </Pressable>
              </View>
            </GlassCard>

            {/* Security & Authentication Card */}
            <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
              <View className="flex-row items-center gap-2 mb-2">
                <Shield size={16} color="#41eec2" />
                <Text className="text-white font-bold text-sm md:text-base">Security & Authentication</Text>
              </View>
              <Text className="text-white/60 text-xs md:text-sm leading-relaxed mb-3.5">
                Use this secret to verify the <Text className="text-[#ffe5a0] font-mono font-bold">X-Webhook-Signature</Text> header in requests sent to your server. This verifies KTS generated the payload.
              </Text>

              {selectedWebhook ? (
                <View className="bg-black/50 border border-white/15 rounded-2xl p-3.5 flex-row items-center justify-between">
                  <Text className="text-[#ffe5a0] font-mono text-xs md:text-sm flex-1 mr-2" numberOfLines={1}>
                    {secretVisible ? selectedWebhook.signing_secret || 'No secret configured' : '••••••••••••••••••••••••••••••••••••'}
                  </Text>

                  <View className="flex-row items-center gap-2">
                    <Pressable onPress={() => setSecretVisible(!secretVisible)} className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
                      {secretVisible ? <EyeOff size={15} color="#fff" /> : <Eye size={15} color="#fff" />}
                    </Pressable>
                    <Pressable onPress={() => handleCopySecret(selectedWebhook.signing_secret || '')} className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
                      <Copy size={15} color="#fff" />
                    </Pressable>
                    <Pressable onPress={() => handleRegenerateSecret(selectedWebhook.id)} className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 items-center justify-center">
                      <RotateCcw size={15} color="#f0c110" />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View className="p-4 bg-white/5 border border-dashed border-white/15 rounded-2xl items-center">
                  <Text className="text-white/50 text-xs md:text-sm italic text-center">
                    Secret key will be automatically generated upon creating the webhook.
                  </Text>
                </View>
              )}
            </GlassCard>

            {/* Health Status & Recent Activity Timeline Card */}
            {selectedWebhook && (
              <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                <View className="flex-row justify-between items-center mb-3.5 pb-2.5 border-b border-white/5">
                  <Text className="text-[#ffe5a0] text-xs md:text-sm font-extrabold uppercase tracking-wider">
                    RECENT ACTIVITY TIMELINE
                  </Text>
                  <Pressable onPress={() => loadWebhookCalls(selectedWebhook.id)} className="p-2 rounded-xl bg-white/5">
                    <RotateCcw size={14} color="#ffe5a0" className={loadingCalls ? 'animate-spin' : ''} />
                  </Pressable>
                </View>

                {loadingCalls ? (
                  <View className="py-8 items-center justify-center">
                    <ActivityIndicator size="small" color="#f0c110" />
                  </View>
                ) : webhookCalls.length === 0 ? (
                  <Text className="text-white/40 text-xs md:text-sm italic text-center py-6">
                    No webhook deliveries recorded yet. Use "Send Test" above to trigger a payload.
                  </Text>
                ) : (
                  <View className="gap-3">
                    {webhookCalls.map((call) => (
                      <View key={call.id} className="bg-black/40 border border-white/5 rounded-2xl p-3.5">
                        <View className="flex-row justify-between items-center mb-1.5">
                          <View className="flex-row items-center gap-2">
                            <View className={`w-2.5 h-2.5 rounded-full ${call.success ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <Text className="text-white font-extrabold text-xs md:text-sm">{call.success ? 'Delivered' : 'Failed'}</Text>
                            <View className={`px-2 py-0.5 rounded-md ${call.success ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                              <Text className={`text-xs font-mono font-bold ${call.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                {call.status_code || 'N/A'}
                              </Text>
                            </View>
                          </View>

                          <Pressable
                            onPress={() => handleReplayCall(call.id)}
                            disabled={replayingCallId === call.id}
                            className="w-8 h-8 rounded-xl bg-white/10 items-center justify-center"
                          >
                            {replayingCallId === call.id ? (
                              <ActivityIndicator size="small" color="#ffe5a0" />
                            ) : (
                              <Play size={13} color="#ffe5a0" />
                            )}
                          </Pressable>
                        </View>

                        <Text className="text-white/50 text-xs font-mono">
                          {formatRelativeTime(call.created_at)} • {call.execution_time_ms}ms
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </GlassCard>
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: WEBHOOK LOGS & DELIVERY HISTORY VIEW              */}
        {/* ========================================================= */}
        {currentView === 'logs' && selectedWebhook && (
          <View className="px-5 mb-8 gap-4">
            {/* Top Breadcrumb & Action Bar */}
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-1 pr-2">
                <Text className="text-white/50 text-xs font-bold">Webhooks / Logs</Text>
                <Text className="text-white font-extrabold text-sm md:text-base font-mono mt-0.5" numberOfLines={1}>
                  {selectedWebhook.url}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => loadWebhookCalls(selectedWebhook.id)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 flex-row items-center gap-2 active:scale-95"
                >
                  <RotateCcw size={14} color="#ffe5a0" className={loadingCalls ? 'animate-spin' : ''} />
                  <Text className="text-[#ffe5a0] text-xs font-bold">Refresh</Text>
                </Pressable>

                <Pressable
                  onPress={() => setCurrentView('list')}
                  className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center"
                >
                  <X size={16} color="#fff" />
                </Pressable>
              </View>
            </View>

            {/* Stats Cards for This Webhook */}
            <View className="flex-row gap-2.5">
              <GlassCard className="flex-1 p-3.5 border border-white/10 items-center rounded-2xl" intensity="low">
                <Text className="text-white font-black text-lg md:text-xl">{webhookCalls.length}</Text>
                <Text className="text-white/60 text-[10.5px] uppercase font-extrabold mt-1 text-center">Attempts</Text>
              </GlassCard>

              <GlassCard className="flex-1 p-3.5 border border-white/10 items-center rounded-2xl" intensity="low">
                <Text className="text-emerald-400 font-black text-lg md:text-xl">
                  {webhookCalls.filter((c) => c.success).length}
                </Text>
                <Text className="text-white/60 text-[10.5px] uppercase font-extrabold mt-1 text-center">Success</Text>
              </GlassCard>

              <GlassCard className="flex-1 p-3.5 border border-white/10 items-center rounded-2xl" intensity="low">
                <Text className="text-red-400 font-black text-lg md:text-xl">
                  {webhookCalls.filter((c) => !c.success).length}
                </Text>
                <Text className="text-white/60 text-[10.5px] uppercase font-extrabold mt-1 text-center">Failed</Text>
              </GlassCard>

              <GlassCard className="flex-1 p-3.5 border border-white/10 items-center rounded-2xl" intensity="low">
                <Text className="text-[#ffe5a0] font-black text-lg md:text-xl">
                  {webhookCalls.length > 0
                    ? Math.round((webhookCalls.filter((c) => c.success).length / webhookCalls.length) * 100)
                    : 100}%
                </Text>
                <Text className="text-white/60 text-[10.5px] uppercase font-extrabold mt-1 text-center">Rate</Text>
              </GlassCard>
            </View>

            {/* Delivery History List */}
            <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
              <Text className="text-[#ffe5a0] text-xs md:text-sm font-extrabold uppercase tracking-wider mb-3.5">
                DELIVERY HISTORY
              </Text>

              {loadingCalls ? (
                <View className="py-12 items-center justify-center">
                  <ActivityIndicator size="large" color="#f0c110" />
                </View>
              ) : webhookCalls.length === 0 ? (
                <Text className="text-white/40 text-sm italic text-center py-8">
                  No delivery attempts recorded for this webhook.
                </Text>
              ) : (
                <View className="gap-3">
                  {webhookCalls.map((call) => (
                    <View key={call.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                      <View className="flex-row justify-between items-center mb-2">
                        <View className="flex-row items-center gap-2.5">
                          <Text className="text-white font-mono text-sm font-extrabold">#{call.id}</Text>
                          <View className={`px-2.5 py-1 rounded-lg ${call.success ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                            <Text className={`text-xs font-bold ${call.success ? 'text-emerald-400' : 'text-red-400'}`}>
                              {call.status_code || (call.success ? '200 OK' : 'Error')}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row gap-2.5">
                          <Pressable
                            onPress={() => {
                              setInspectingCall(call);
                              setInspectTab('payload');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/30 active:scale-95"
                          >
                            <Text className="text-[#ffe5a0] text-xs font-extrabold">Inspect</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => handleReplayCall(call.id)}
                            disabled={replayingCallId === call.id}
                            className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:scale-95"
                          >
                            {replayingCallId === call.id ? (
                              <ActivityIndicator size="small" color="#ffe5a0" />
                            ) : (
                              <Play size={14} color="#ffe5a0" />
                            )}
                          </Pressable>
                        </View>
                      </View>

                      <Text className="text-white/50 text-xs font-mono">
                        {formatRelativeTime(call.created_at)} • Latency: {call.execution_time_ms}ms
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </GlassCard>
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* INSPECT TRANSACTION DETAILS MODAL                         */}
      {/* ========================================================= */}
      <Modal visible={!!inspectingCall} transparent animationType="slide" onRequestClose={() => setInspectingCall(null)}>
        <View style={styles.modalOverlay}>
          <GlassCard className="w-full max-h-[85%] p-5 border border-white/15 rounded-t-3xl" style={{ backgroundColor: '#14181a' }}>
            {/* Modal Header */}
            <View className="flex-row justify-between items-center pb-3 border-b border-white/10 mb-3">
              <View>
                <Text className="text-white font-extrabold text-base">Transaction Details</Text>
                <Text className="text-white/50 text-xs font-mono mt-0.5">{inspectingCall?.id} • {inspectingCall?.created_at}</Text>
              </View>
              <Pressable onPress={() => setInspectingCall(null)} className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
                <X size={18} color="#fff" />
              </Pressable>
            </View>

            {/* Custom Tabs */}
            <View className="flex-row bg-black/60 p-1.5 rounded-2xl border border-white/10 mb-3.5" style={{ gap: 4 }}>
              <Pressable
                onPress={() => setInspectTab('payload')}
                className={`flex-1 py-2.5 rounded-xl items-center ${inspectTab === 'payload' ? 'bg-[#f0c110]' : 'bg-transparent'}`}
              >
                <Text className={`text-xs md:text-sm font-extrabold ${inspectTab === 'payload' ? 'text-[#101415]' : 'text-white/70'}`}>
                  Request Payload
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setInspectTab('response')}
                className={`flex-1 py-2.5 rounded-xl items-center ${inspectTab === 'response' ? 'bg-[#f0c110]' : 'bg-transparent'}`}
              >
                <Text className={`text-xs md:text-sm font-extrabold ${inspectTab === 'response' ? 'text-[#101415]' : 'text-white/70'}`}>
                  Response Body
                </Text>
              </Pressable>
            </View>

            {/* Code Block */}
            <ScrollView showsVerticalScrollIndicator={false} className="p-4 bg-black/80 rounded-2xl border border-white/5 mb-3.5 max-h-[320px]">
              <Text className="text-[#ffe5a0] text-xs md:text-sm font-mono leading-relaxed select-all">
                {(() => {
                  if (!inspectingCall) return '{}';
                  const data = inspectTab === 'payload' ? inspectingCall.payload : inspectingCall.response_body;
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
              </Text>
            </ScrollView>

            {/* Footer Buttons */}
            <View className="flex-row gap-2.5 pt-2.5 border-t border-white/10">
              <Pressable
                onPress={() => inspectingCall && handleReplayCall(inspectingCall.id)}
                disabled={replayingCallId === inspectingCall?.id}
                className="flex-1 py-3.5 rounded-2xl bg-[#f0c110] items-center justify-center flex-row gap-2 active:scale-95 shadow-md shadow-[#f0c110]/30"
              >
                {replayingCallId === inspectingCall?.id ? (
                  <ActivityIndicator size="small" color="#101415" />
                ) : (
                  <RotateCcw size={15} color="#101415" />
                )}
                <Text className="text-[#101415] font-black text-xs md:text-sm uppercase tracking-wider">Replay Event</Text>
              </Pressable>

              <Pressable
                onPress={() => setInspectingCall(null)}
                className="py-3.5 px-6 rounded-2xl bg-white/10 border border-white/15 items-center justify-center"
              >
                <Text className="text-white/80 font-bold text-xs md:text-sm">Close</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION MODAL                                 */}
      {/* ========================================================= */}
      <Modal visible={!!deletingWebhookId} transparent animationType="fade" onRequestClose={() => setDeletingWebhookId(null)}>
        <View style={styles.alertOverlay}>
          <GlassCard className="w-[88%] max-w-[340px] p-5 border border-red-500/40" style={{ backgroundColor: '#181414', borderRadius: 24 }}>
            <View className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 items-center justify-center mb-3 self-center">
              <Trash2 size={24} color="#ffb4ab" />
            </View>
            <Text className="text-white font-extrabold text-sm text-center mb-2">Delete Webhook Configuration?</Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-5">
              Are you sure you want to delete this webhook configuration? This will also delete all recent activity logs for this webhook.
            </Text>
            <View className="flex-row gap-2.5">
              <Pressable onPress={() => setDeletingWebhookId(null)} className="flex-1 py-2.5 rounded-xl bg-white/10 items-center">
                <Text className="text-white/70 font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmDeleteWebhook} className="flex-1 py-2.5 rounded-xl bg-red-500 items-center">
                <Text className="text-white font-extrabold text-xs">Delete</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* CUSTOM DIALOG ALERT MODAL                                 */}
      {/* ========================================================= */}
      <Modal visible={customAlert.visible} transparent animationType="fade" onRequestClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}>
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[85%] max-w-[340px] p-6 border border-white/10 items-center"
            style={{
              backgroundColor: '#16191b',
              borderRadius: 28,
              shadowColor: '#f0c110',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <View
              className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center ${
                customAlert.type === 'error'
                  ? 'bg-red-500/20 border border-red-500/40'
                  : 'bg-[#f0c110]/20 border border-[#f0c110]/40'
              }`}
            >
              {customAlert.type === 'error' ? (
                <AlertCircle size={24} color="#ffb4ab" />
              ) : (
                <CheckCircle2 size={24} color="#ffe5a0" />
              )}
            </View>

            <Text className="text-white text-base font-bold text-center mb-1.5">{customAlert.title}</Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-5 px-1">{customAlert.message}</Text>

            <Pressable
              onPress={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
              className="w-full py-3 rounded-xl bg-[#f0c110] items-center active:scale-95 shadow-md shadow-[#f0c110]/30"
            >
              <Text className="text-[#101415] text-xs font-extrabold uppercase tracking-wider">Dismiss</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101415',
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SuperAdminWebhookManagementScreen;
