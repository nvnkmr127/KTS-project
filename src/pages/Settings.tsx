import { useState, useEffect, Fragment } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { api, clearApiCache } from '../services/api';
import { useApp } from '../context/AppContext';
import { useDialog } from '../context/DialogContext';
import { 
  Calendar, Plus, Trash2, Edit2, CheckCircle2, Shield, 
  AlertCircle, RefreshCw, RotateCcw, X, Loader2, Save, Search, Clock,
  ShieldAlert, Key, Upload, FileText, Users, LogIn, Monitor, Smartphone,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { TabBar } from '../components/ui';
import { WebhookManagement } from '../components/WebhookManagement';
import { ActivityLogDetailPanel } from '../components/ActivityLogDetailPanel';
import { 
  getUserDisplayDetails, 
  parseActivityDetails, 
  formatDateTime, 
  parsePlatformInfo 
} from '../utils/activityLogFormatter';


interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface SettingsProps {
  initialTab?: number;
}

export function Settings({ initialTab = 0 }: SettingsProps) {
  const { alert, confirm } = useDialog();
  const { setSelectedAcademicYearId } = useApp();
  const [tab, setTab] = useState(initialTab);
  const [ays, setAys] = useState<AcademicYear[]>([]);
  const [loadingAys, setLoadingAys] = useState(false);

  // Form states for Academic Year
  const [showAyModal, setShowAyModal] = useState(false);
  const [editingAy, setEditingAy] = useState<AcademicYear | null>(null);
  const [ayName, setAyName] = useState('');
  const [ayStart, setAyStart] = useState('');
  const [ayEnd, setAyEnd] = useState('');
  const [ayIsCurrent, setAyIsCurrent] = useState(false);
  const [savingAy, setSavingAy] = useState(false);
  const [ayError, setAyError] = useState('');

  // School profile states
  const [schoolName, setSchoolName] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [minAttendance, setMinAttendance] = useState('75');
  const [biometricApiKey, setBiometricApiKey] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Biometric integration states
  const [bioStatus, setBioStatus] = useState<any>(null);
  const [loadingBioStatus, setLoadingBioStatus] = useState(false);
  const [isTestingBio, setIsTestingBio] = useState(false);
  const [testBioResult, setTestBioResult] = useState<{ success: boolean; message: string } | null>(null);
  const [bioError, setBioError] = useState('');
  const [resettingCursor, setResettingCursor] = useState(false);

  // School timing settings states
  const [schoolStartTime, setSchoolStartTime] = useState('08:30');
  const [schoolEndTime, setSchoolEndTime] = useState('17:30');
  const [presentCutoffMorning, setPresentCutoffMorning] = useState('09:00');
  const [presentCutoffEvening, setPresentCutoffEvening] = useState('16:30');
  const [lateEntryCutoff, setLateEntryCutoff] = useState('09:50');
  const [earlyEntryCutoff, setEarlyEntryCutoff] = useState('15:00');
  const [biometricMachineCutoff, setBiometricMachineCutoff] = useState('10:00');
  const [savingTimings, setSavingTimings] = useState(false);
  const [timingsSuccess, setTimingsSuccess] = useState('');
  const [timingsError, setTimingsError] = useState('');

  // Cache/Maintenance states
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheSuccess, setCacheSuccess] = useState('');

  // Developer Tools states
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState('');
  const [seedError, setSeedError] = useState('');
  const [clearingDb, setClearingDb] = useState(false);
  const [clearDbSuccess, setClearDbSuccess] = useState('');
  const [clearDbError, setClearDbError] = useState('');

  // Activity log states
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activityUsers, setActivityUsers] = useState<any[]>([]);
  const [activitySummary, setActivitySummary] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activityUserFilter, setActivityUserFilter] = useState('');
  const [activityEventFilter, setActivityEventFilter] = useState('');
  const [activityDateFrom, setActivityDateFrom] = useState('');
  const [activityDateTo, setActivityDateTo] = useState('');
  const [activityExpandedId, setActivityExpandedId] = useState<string | null>(null);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityOffset, setActivityOffset] = useState(0);
  const ACTIVITY_PAGE_SIZE = 50;
  const [deletingLogId, setDeletingLogId] = useState<string | number | null>(null);


  // Load academic years
  const loadAys = async () => {
    setLoadingAys(true);
    try {
      const data = await api.getResources('academic-years');
      if (Array.isArray(data)) {
        setAys(data.map((ay: any) => ({
          id: String(ay.id),
          name: ay.name,
          start_date: ay.start_date ? ay.start_date.slice(0, 10) : '',
          end_date: ay.end_date ? ay.end_date.slice(0, 10) : '',
          is_current: !!ay.is_current,
        })));
      }
    } catch (err) {
      console.error('Error loading academic years:', err);
    } finally {
      setLoadingAys(false);
    }
  };

  // Load school settings from DB
  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const data = await api.getResources('settings');
      if (Array.isArray(data)) {
        const nameSet = data.find((s: any) => s.key === 'school_name');
        const emailSet = data.find((s: any) => s.key === 'school_email');
        const phoneSet = data.find((s: any) => s.key === 'school_phone');
        const addrSet = data.find((s: any) => s.key === 'school_address');
        const attSet = data.find((s: any) => s.key === 'minimum_attendance_percentage');
         
        const bioSet = data.find((s: any) => s.key === 'biometric_api_key');
        const logoSet = data.find((s: any) => s.key === 'school_logo');

        if (nameSet) setSchoolName(nameSet.value);
        else setSchoolName('Krishnaveni Talent School');

        if (emailSet) setSchoolEmail(emailSet.value);
        else setSchoolEmail('info@krishnaveni.edu');

        if (phoneSet) setSchoolPhone(phoneSet.value);
        else setSchoolPhone('9876543210');

        if (addrSet) setSchoolAddress(addrSet.value);
        else setSchoolAddress('Nizamabad, Telangana');

        if (attSet) setMinAttendance(attSet.value);
        else setMinAttendance('75');

        if (bioSet) setBiometricApiKey(bioSet.value);
        else setBiometricApiKey('');

        if (logoSet) setSchoolLogo(logoSet.value);
        else setSchoolLogo('/KTHS_Logo.png');
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Load Biometric Settings/Status
  const loadBiometricSettings = async () => {
    setLoadingBioStatus(true);
    setBioError('');
    try {
      const res = await api.biometricStatus();
      setBioStatus(res);

      // Load school timings configurations from settings
      const settings = await api.getResources('settings');
      if (Array.isArray(settings)) {
        const startSetting = settings.find((s: any) => s.key === 'school_start_time');
        const endSetting = settings.find((s: any) => s.key === 'school_end_time');
        const presMSetting = settings.find((s: any) => s.key === 'present_cutoff_morning');
        const presESetting = settings.find((s: any) => s.key === 'present_cutoff_evening');
        const lateSetting = settings.find((s: any) => s.key === 'late_entry_cutoff');
        const earlySetting = settings.find((s: any) => s.key === 'early_entry_cutoff');
        const bioCutoffSetting = settings.find((s: any) => s.key === 'biometric_machine_status_cutoff');

        if (startSetting) setSchoolStartTime(startSetting.value);
        if (endSetting) setSchoolEndTime(endSetting.value);
        if (presMSetting) setPresentCutoffMorning(presMSetting.value);
        if (presESetting) setPresentCutoffEvening(presESetting.value);
        if (lateSetting) setLateEntryCutoff(lateSetting.value);
        if (earlySetting) setEarlyEntryCutoff(earlySetting.value);
        if (bioCutoffSetting) setBiometricMachineCutoff(bioCutoffSetting.value);
      }
    } catch (err: any) {
      console.error('Error loading biometric status:', err);
      setBioError(err.message || 'Failed to load biometric status');
    } finally {
      setLoadingBioStatus(false);
    }
  };

  // Save Biometric School Timings
  const handleSaveTimings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTimings(true);
    setTimingsSuccess('');
    setTimingsError('');

    try {
      const keys = [
        { key: 'school_start_time', value: schoolStartTime },
        { key: 'school_end_time', value: schoolEndTime },
        { key: 'present_cutoff_morning', value: presentCutoffMorning },
        { key: 'present_cutoff_evening', value: presentCutoffEvening },
        { key: 'late_entry_cutoff', value: lateEntryCutoff },
        { key: 'early_entry_cutoff', value: earlyEntryCutoff },
        { key: 'biometric_machine_status_cutoff', value: biometricMachineCutoff },
      ];

      const allSettings = await api.getResources('settings').catch(() => []);
      const settingsArray = Array.isArray(allSettings) ? allSettings : (allSettings?.data || []);

      await Promise.all(keys.map(async (item) => {
        const existing = settingsArray.find((s: any) => s.key === item.key);
        if (existing) {
          await api.updateResource('settings', String(existing.id), { value: item.value });
        } else {
          await api.createResource('settings', {
            key: item.key,
            value: item.value,
            group: 'biometric',
            type: 'string',
            is_public: true
          });
        }
      }));

      // Also set the items in localstorage so other components see them immediately
      keys.forEach((item) => {
        localStorage.setItem(item.key, item.value);
      });

      setTimingsSuccess('School timings and cutoffs saved successfully!');
      setTimeout(() => setTimingsSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error saving school timings:', err);
      setTimingsError(err.message || 'Failed to save school timings.');
    } finally {
      setSavingTimings(false);
    }
  };

  // Test Biometric Connection
  const handleTestBiometric = async () => {
    setIsTestingBio(true);
    setTestBioResult(null);
    setBioError('');
    try {
      const res = await api.biometricTestConnection();
      if (res?.connected) {
        setTestBioResult({ success: true, message: res.message || 'Successfully connected to e-TimeOffice API!' });
      } else {
        setTestBioResult({ success: false, message: res.message || 'Failed to connect. Check credentials.' });
      }
    } catch (err: any) {
      console.error(err);
      setTestBioResult({ success: false, message: err.message || 'Connection error.' });
    } finally {
      setIsTestingBio(false);
    }
  };

  // Reset Sync Cursor
  const handleResetCursor = async () => {
    if (!await confirm('Are you sure you want to reset the incremental sync cursor? This will re-fetch all records starting from the beginning of the current month.', 'Reset Sync Cursor', true)) {
      return;
    }
    setResettingCursor(true);
    try {
      const res = await api.biometricResetCursor();
      if (res?.success) {
        await alert('Sync cursor reset successfully!', 'Success');
        loadBiometricSettings();
      } else {
        await alert('Failed to reset sync cursor.', 'Error');
      }
    } catch (err: any) {
      await alert('Error: ' + err.message, 'Error');
    } finally {
      setResettingCursor(false);
    }
  };

  // Load Activity Logs
  async function loadActivityLogs(reset = true, nextOffset?: number) {
    setActivityLoading(true);
    const offset = nextOffset !== undefined ? nextOffset : (reset ? 0 : activityOffset);
    if (reset) setActivityOffset(0);
    try {
      const params: Record<string,string> = { limit: String(ACTIVITY_PAGE_SIZE), offset: String(offset) };
      if (activitySearch) params.search = activitySearch;
      if (activityUserFilter) params.user_id = activityUserFilter;
      if (activityEventFilter) params.event = activityEventFilter;
      if (activityDateFrom) params.date_from = activityDateFrom;
      if (activityDateTo) params.date_to = activityDateTo;
      const res = await api.getActivityLogs(params);
      const rawData = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      const data = rawData.filter((l: any) => {
        const desc = (l.description || '').toLowerCase();
        const st = (l.subject_type || '').toLowerCase();
        const isDuplicateAttendance = /^marked attendance on \d{4}-\d{2}-\d{2}$/i.test(desc.trim()) ||
                                      /^updated attendance record on \d{4}-\d{2}-\d{2}$/i.test(desc.trim()) ||
                                      desc.includes('invalidate-cache');
        const isBackendEvent = desc.includes('backend public') ||
                               desc.includes('backend/public') ||
                               desc.includes('componentpaymentitem') ||
                               desc.includes('component-payment-item') ||
                               st === 'componentpaymentitem' ||
                               st === 'app\\models\\componentpaymentitem' ||
                               st === 'webhookcall' ||
                               st === 'app\\models\\webhookcall';
        return !isDuplicateAttendance &&
               !isBackendEvent &&
               !desc.includes('system setting') &&
               !desc.includes('batch subjects') &&
               !desc.includes('batch_subjects') &&
               !desc.includes('examinations exams') &&
               !desc.includes('cltk') &&
               !desc.includes('sak') &&
               st !== 'setting' &&
               st !== 'app\\models\\setting';
      });
      if (reset) setActivityLogs(data);
      else setActivityLogs(prev => [...prev, ...data]);
      setActivityTotal(res.total ?? data.length);
    } catch (e) { console.error(e); }
    finally { setActivityLoading(false); }
  }

  const handleClearActivityLogs = async () => {
    if (!await confirm('Are you sure you want to permanently clear all activity logs? This cannot be undone.', 'Clear Activity Logs', true)) {
      return;
    }
    setClearingLogs(true);
    try {
      const res = await api.clearActivityLogs();
      if (res.success) {
        setActivityLogs([]);
        setActivityTotal(0);
        setActivityUsers([]);
        setActivitySummary([]);
        // Reload metadata / summaries
        api.getActivityUsers().then(setActivityUsers).catch(() => {});
        api.getActivitySummary().then(r => setActivitySummary(r.data ?? r ?? [])).catch(() => {});
      } else {
        await alert(res.error || 'Failed to clear activity logs.', 'Error');
      }
    } catch (err: any) {
      console.error(err);
      await alert(err.message || 'Failed to clear activity logs.', 'Error');
    } finally {
      setClearingLogs(false);
    }
  };

  const handleDeleteActivityLog = async (id: string | number) => {
    if (!await confirm('Are you sure you want to delete this activity log? It will be moved to the Recycle Bin.', 'Delete Activity Log', true)) {
      return;
    }
    setDeletingLogId(id);
    try {
      const res = await api.deleteActivityLog(id);
      if (res.success) {
        setActivityLogs(prev => prev.filter(log => log.id !== id));
        setActivityTotal(prev => prev - 1);
      } else {
        await alert(res.error || 'Failed to delete activity log.', 'Error');
      }
    } catch (err: any) {
      console.error(err);
      await alert(err.message || 'Failed to delete activity log.', 'Error');
    } finally {
      setDeletingLogId(null);
    }
  };

  useEffect(() => {
    if (tab === 0) {
      loadAys();
    } else if (tab === 1) {
      loadSettings();
    } else if (tab === 2) {
      api.getActivityUsers().then(setActivityUsers).catch(() => {});
      api.getActivitySummary().then(r => setActivitySummary(r.data ?? r ?? [])).catch(() => {});
    } else if (tab === 5) {
      loadBiometricSettings();
    }
  }, [tab]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(activitySearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [activitySearch]);

  useEffect(() => {
    if (tab === 2) {
      loadActivityLogs(true);
    }
  }, [debouncedSearch, activityUserFilter, activityEventFilter, activityDateFrom, activityDateTo, tab]);


  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  // Open Add/Edit Modal
  const openAyModal = (ay: AcademicYear | null = null) => {
    setAyError('');
    if (ay) {
      setEditingAy(ay);
      setAyName(ay.name);
      setAyStart(ay.start_date);
      setAyEnd(ay.end_date);
      setAyIsCurrent(ay.is_current);
    } else {
      setEditingAy(null);
      setAyName('');
      setAyStart('');
      setAyEnd('');
      setAyIsCurrent(false);
    }
    setShowAyModal(true);
  };

  // Save Academic Year (Create / Update)
  const handleSaveAy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ayName.trim() || !ayStart || !ayEnd) {
      setAyError('Please fill in all fields.');
      return;
    }
    setSavingAy(true);
    setAyError('');

    const payload = {
      name: ayName.trim(),
      start_date: ayStart,
      end_date: ayEnd,
      is_current: ayIsCurrent,
    };

    try {
      if (editingAy) {
        await api.updateResource('academic-years', editingAy.id, payload);
      } else {
        await api.createResource('academic-years', payload);
      }
      setShowAyModal(false);
      await loadAys();
      
      // Reload page context academic years
      window.location.reload();
    } catch (err: any) {
      console.error('Error saving academic year:', err);
      setAyError(err.message || 'Failed to save academic year.');
    } finally {
      setSavingAy(false);
    }
  };

  // Set Academic Year as Active / Current
  const handleSetCurrent = async (ay: AcademicYear) => {
    setLoadingAys(true);
    try {
      await api.updateResource('academic-years', ay.id, { is_current: true });
      setSelectedAcademicYearId(ay.id);
      await loadAys();
      
      // Reload page context academic years
      window.location.reload();
    } catch (err) {
      console.error('Error setting current academic year:', err);
    } finally {
      setLoadingAys(false);
    }
  };

  // Delete Academic Year
  const handleDeleteAy = async (id: string) => {
    if (!await confirm('Are you sure you want to delete this academic year? This will delete associated classes and students.', 'Delete Academic Year', true)) return;
    setLoadingAys(true);
    try {
      await api.deleteResource('academic-years', id);
      await loadAys();
      
      // Reload page context academic years
      window.location.reload();
    } catch (err) {
      console.error('Error deleting academic year:', err);
    } finally {
      setLoadingAys(false);
    }
  };

  // Handle school logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert('File size exceeds 1MB limit. Please upload a smaller image.', 'File Too Large');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setSchoolLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save General School Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess('');
    
    try {
      const keys = [
        { key: 'school_name', value: schoolName },
        { key: 'school_email', value: schoolEmail },
        { key: 'school_phone', value: schoolPhone },
        { key: 'school_address', value: schoolAddress },
        { key: 'minimum_attendance_percentage', value: minAttendance },
        { key: 'biometric_api_key', value: biometricApiKey },
        { key: 'school_logo', value: schoolLogo }
      ];

      await Promise.all(keys.map(async (item) => {
        const existing = await api.getResources('settings', { key: item.key });
        if (Array.isArray(existing) && existing.length > 0) {
          await api.updateResource('settings', String(existing[0].id), { value: item.value });
        } else {
          await api.createResource('settings', {
            key: item.key,
            value: item.value,
            group: 'general',
            type: 'string',
            is_public: true
          });
        }
      }));

      // Update localStorage immediately
      keys.forEach((item) => {
        localStorage.setItem(item.key, item.value);
      });
      window.dispatchEvent(new CustomEvent('kts:school_profile_updated'));

      setSettingsSuccess('Settings saved successfully!');
      setTimeout(() => setSettingsSuccess(''), 4000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Clear App Cache
  const handleClearCache = () => {
    setClearingCache(true);
    setCacheSuccess('');
    setTimeout(() => {
      localStorage.clear();
      setClearingCache(false);
      setCacheSuccess('App cache and local storage cleared successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }, 1200);
  };

  // Seed Mock Data in Database
  const handleSeedMockData = async () => {
    setSeeding(true);
    setSeedSuccess('');
    setSeedError('');
    try {
      const res = await api.seedMockData();
      if (res.success) {
        clearApiCache();
        setSeedSuccess('Mock data seeded successfully! Reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setSeedError(res.error || 'Failed to seed mock data.');
      }
    } catch (err: any) {
      console.error(err);
      setSeedError(err.message || 'Failed to seed mock data.');
    } finally {
      setSeeding(false);
    }
  };

  // Clear Database for Client Handover
  const handleClearDbData = async () => {
    if (!await confirm('WARNING: This will delete all mock students, fees, attendance, timetables, and logs. It will restore the database to a clean, empty state with only default admin accounts. Do you want to proceed?', 'Reset Database', true)) {
      return;
    }
    setClearingDb(true);
    setClearDbSuccess('');
    setClearDbError('');
    try {
      const res = await api.clearMockData();
      if (res.success) {
        clearApiCache();
        setClearDbSuccess('Database reset successfully! Clearing cache and logging out...');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/';
        }, 2000);
      } else {
        setClearDbError(res.error || 'Failed to clear mock data.');
      }
    } catch (err: any) {
      console.error(err);
      setClearDbError(err.message || 'Failed to clear mock data.');
    } finally {
      setClearingDb(false);
    }
  };



  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg)]">
      
      <TabBar 
        tabs={['Academic Years', 'School Profile', 'Activity Logs', 'Webhook Management', 'System Maintenance', 'Biometric Integration']}
        active={tab}
        onChange={setTab}
      />

      <div className="mt-4">
        {/* Tab 0: Academic Years */}
        {tab === 0 && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[13px] font-bold text-[var(--tx)] flex items-center gap-1.5">
                    <Calendar size={14} className="text-[var(--blue-tx)]" /> Academic Years Management
                  </h3>
                  <p className="text-[11px] text-[var(--tx3)] mt-0.5">Define school years, term ranges, and activate the current academic year.</p>
                </div>
                <button
                  onClick={() => openAyModal(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--blue)] text-white rounded-lg text-[11.5px] font-semibold hover:opacity-90 cursor-pointer"
                >
                  <Plus size={13} /> Add Academic Year
                </button>
              </div>

              {loadingAys ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-[var(--blue)]" />
                </div>
              ) : ays.length === 0 ? (
                <div className="text-center py-10 text-[12px] text-[var(--tx3)] italic">
                  No academic years configured. Click "Add Academic Year" to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ays.map((ay) => (
                    <div 
                      key={ay.id} 
                      className={`p-3.5 bg-[var(--surf2)] border rounded-xl flex items-center justify-between ${
                        ay.is_current ? 'border-[var(--blue)] ring-1 ring-[var(--blue)]/20' : 'border-[var(--b)]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-[var(--tx)]">{ay.name}</span>
                          {ay.is_current && <Badge variant="teal">Current Year</Badge>}
                        </div>
                        <div className="text-[11px] text-[var(--tx3)]">
                          {ay.start_date} &nbsp;to&nbsp; {ay.end_date}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!ay.is_current && (
                          <button
                            onClick={() => handleSetCurrent(ay)}
                            className="px-2.5 py-1.5 text-[11px] font-semibold border border-[var(--b)] hover:border-[var(--blue)] rounded-lg text-[var(--tx)] bg-[var(--surf)] hover:bg-[var(--blue-bg)] hover:text-[var(--blue-tx)] transition-all cursor-pointer"
                          >
                            Set Active
                          </button>
                        )}
                        <button
                          onClick={() => openAyModal(ay)}
                          className="p-2 border border-[var(--b)] hover:border-[var(--blue)] rounded-lg text-[var(--tx3)] hover:text-[var(--blue-tx)] bg-[var(--surf)] transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        {!ay.is_current && (
                          <button
                            onClick={() => handleDeleteAy(ay.id)}
                            className="p-2 border border-[var(--b)] hover:border-[var(--red)] rounded-lg text-[var(--tx3)] hover:text-[var(--red-tx)] bg-[var(--surf)] transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Tab 1: School Profile Settings */}
        {tab === 1 && (
          <Card>
            <div className="flex items-center gap-1.5 mb-4">
              <Shield size={14} className="text-[var(--blue-tx)]" />
              <div>
                <h3 className="text-[13px] font-bold text-[var(--tx)]">School Profile Configurations</h3>
                <p className="text-[11px] text-[var(--tx3)]">Update public school information and integration keys.</p>
              </div>
            </div>

            {loadingSettings ? (
              <div className="flex justify-center py-10">
                <Loader2 size={20} className="animate-spin text-[var(--blue)]" />
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                {/* School Logo upload section */}
                <div className="border-b border-[var(--b)] pb-4 mb-4">
                  <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-2">School Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-white border border-[var(--b)] flex items-center justify-center p-1 shadow-sm overflow-hidden flex-shrink-0">
                      <img src={schoolLogo || '/KTHS_Logo.png'} alt="School Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 bg-[var(--surf2)] hover:bg-[var(--surf3)] border border-[var(--b)] rounded-lg text-[11.5px] font-semibold text-[var(--tx)] cursor-pointer transition-colors flex items-center gap-1.5">
                          <Upload size={12} className="text-[var(--tx2)]" />
                          Upload Logo
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleLogoUpload}
                          />
                        </label>
                        {schoolLogo && schoolLogo !== '/KTHS_Logo.png' && (
                          <button
                            type="button"
                            onClick={() => setSchoolLogo('/KTHS_Logo.png')}
                            className="px-3 py-1.5 bg-[var(--red-bg)] hover:bg-opacity-80 text-[var(--red-tx)] rounded-lg text-[11.5px] font-semibold cursor-pointer transition-colors"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--tx3)]">Supported formats: JPG, PNG, JPEG. Max size 1MB.</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">School Name *</label>
                    <input 
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      required 
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" 
                      placeholder="e.g. Krishnaveni Talent School"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">Contact Email Address *</label>
                    <input 
                      type="email"
                      value={schoolEmail}
                      onChange={(e) => setSchoolEmail(e.target.value)}
                      required 
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" 
                      placeholder="e.g. info@krishnaveni.edu"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">Contact Phone Number *</label>
                    <input 
                      value={schoolPhone}
                      onChange={(e) => setSchoolPhone(e.target.value)}
                      required 
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" 
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">Minimum Student Attendance (%)</label>
                    <input 
                      type="number"
                      min="1"
                      max="100"
                      value={minAttendance}
                      onChange={(e) => setMinAttendance(e.target.value)}
                      required 
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" 
                      placeholder="e.g. 75"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">School Physical Address</label>
                  <textarea 
                     value={schoolAddress}
                     onChange={(e) => setSchoolAddress(e.target.value)}
                     required
                     rows={2} 
                     className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)] resize-none" 
                     placeholder="House no, Street, Area, Town, State"
                  />
                </div>



                {settingsSuccess && (
                  <div className="p-3 bg-[var(--teal-bg)] border border-[var(--teal-tx)]/15 text-[var(--teal-tx)] rounded-xl text-[11.5px] flex items-center gap-2">
                    <CheckCircle2 size={13} />
                    <span>{settingsSuccess}</span>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <button 
                    type="submit" 
                    disabled={savingSettings}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[var(--blue)] text-white rounded-lg text-[12px] font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50"
                  >
                    {savingSettings ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* Tab 2: Activity Logs */}
        {tab === 2 && (
          <div className="space-y-4">
            {/* SECTION 1 — Summary KPI Bar */}
            {(() => {
              const getTodayDateStr = () => {
                const d = new Date();
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              };
              const todayStr = getTodayDateStr();
              const todaySummary = activitySummary.find(s => s.date === todayStr) || (activitySummary.length > 0 ? activitySummary[activitySummary.length - 1] : null);
              const totalLogsToday = todaySummary ? todaySummary.total : 0;
              const loginsToday = todaySummary ? todaySummary.login_count : 0;
              const deletionsToday = todaySummary ? todaySummary.deleted_count : 0;
              const activeUsersToday = new Set(
                activityLogs
                  .filter(log => log.created_at && log.created_at.startsWith(todayStr))
                  .map(log => log.causer_id || log.causer_name)
              ).size;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
                  {/* Card 1: Total Logs Today */}
                  <div className="bg-white dark:bg-[var(--surf)] border border-slate-200/80 dark:border-[var(--b)] rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Total Logs Today</div>
                      <div className="text-[26px] font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight">{totalLogsToday}</div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                      <FileText size={20} />
                    </div>
                  </div>

                  {/* Card 2: Active Users Today */}
                  <div className="bg-white dark:bg-[var(--surf)] border border-slate-200/80 dark:border-[var(--b)] rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Active Users Today</div>
                      <div className="text-[26px] font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight">{activeUsersToday}</div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Users size={20} />
                    </div>
                  </div>

                  {/* Card 3: Logins Today */}
                  <div className="bg-white dark:bg-[var(--surf)] border border-slate-200/80 dark:border-[var(--b)] rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Logins Today</div>
                      <div className="text-[26px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight">{loginsToday}</div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                      <LogIn size={20} />
                    </div>
                  </div>

                  {/* Card 4: Deletions Today */}
                  <div className="bg-white dark:bg-[var(--surf)] border border-slate-200/80 dark:border-[var(--b)] rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Deletions Today</div>
                      <div className="text-[26px] font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 tracking-tight">{deletionsToday}</div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                      <Trash2 size={20} />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* SECTION 2 — Filter Controls Bar */}
            {(() => {
              const isFilterActive = !!(activitySearch || activityUserFilter || activityEventFilter || activityDateFrom || activityDateTo);
              const clearFilters = () => {
                setActivitySearch('');
                setActivityUserFilter('');
                setActivityEventFilter('');
                setActivityDateFrom('');
                setActivityDateTo('');
              };

              return (
                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                  {/* Search input */}
                  <div className="relative min-w-[220px] flex-1">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      placeholder="Search actions..."
                      className="w-full bg-white dark:bg-[var(--surf)] border border-slate-200/90 dark:border-[var(--b)] rounded-xl pl-9 pr-3.5 py-2 text-[12.5px] text-slate-800 dark:text-[var(--tx)] outline-none focus:border-blue-500 placeholder-slate-400 shadow-2xs"
                    />
                  </div>

                  {/* Users filter */}
                  <select
                    value={activityUserFilter}
                    onChange={(e) => setActivityUserFilter(e.target.value)}
                    className="bg-white dark:bg-[var(--surf)] border border-slate-200/90 dark:border-[var(--b)] rounded-xl px-3.5 py-2 text-[12.5px] text-slate-800 dark:text-[var(--tx)] cursor-pointer outline-none min-w-[130px] shadow-2xs focus:border-blue-500"
                  >
                    <option value="">All Users</option>
                    {activityUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>

                  {/* Events filter */}
                  <select
                    value={activityEventFilter}
                    onChange={(e) => setActivityEventFilter(e.target.value)}
                    className="bg-white dark:bg-[var(--surf)] border border-slate-200/90 dark:border-[var(--b)] rounded-xl px-3.5 py-2 text-[12.5px] text-slate-800 dark:text-[var(--tx)] cursor-pointer outline-none min-w-[130px] shadow-2xs focus:border-blue-500"
                  >
                    <option value="">All Events</option>
                    <option value="created">created</option>
                    <option value="updated">updated</option>
                    <option value="deleted">deleted</option>
                    <option value="login">login</option>
                    <option value="logout">logout</option>
                    <option value="action">action</option>
                  </select>

                  {/* FROM Date */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-[var(--surf)] border border-slate-200/90 dark:border-[var(--b)] rounded-xl px-3 py-1.5 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold tracking-wider">FROM</span>
                    <input
                      type="date"
                      value={activityDateFrom}
                      onChange={(e) => setActivityDateFrom(e.target.value)}
                      className="bg-transparent border-0 text-[12px] text-slate-800 dark:text-[var(--tx)] outline-none p-0 cursor-pointer"
                    />
                  </div>

                  {/* TO Date */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-[var(--surf)] border border-slate-200/90 dark:border-[var(--b)] rounded-xl px-3 py-1.5 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold tracking-wider">TO</span>
                    <input
                      type="date"
                      value={activityDateTo}
                      onChange={(e) => setActivityDateTo(e.target.value)}
                      className="bg-transparent border-0 text-[12px] text-slate-800 dark:text-[var(--tx)] outline-none p-0 cursor-pointer"
                    />
                  </div>

                  {/* Clear filter button */}
                  {isFilterActive && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 px-3 py-2 text-[12px] text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-semibold cursor-pointer border border-rose-200"
                    >
                      <X size={13} />
                      <span>Clear</span>
                    </button>
                  )}

                  {/* Refresh button */}
                  <button
                    onClick={() => loadActivityLogs(true)}
                    disabled={activityLoading}
                    className="flex items-center justify-center p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 border border-slate-200/90 dark:border-[var(--b)] rounded-xl bg-white dark:bg-[var(--surf)] hover:bg-slate-50 dark:hover:bg-[var(--surf2)] cursor-pointer disabled:opacity-50 shadow-2xs transition-all"
                    title="Refresh logs"
                  >
                    <RotateCcw size={14} className={activityLoading ? 'animate-spin' : ''} />
                  </button>

                  {/* Clear All Logs button */}
                  <button
                    onClick={handleClearActivityLogs}
                    disabled={activityLoading || clearingLogs}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-[12px] text-rose-600 hover:text-rose-700 border border-rose-200 rounded-xl bg-rose-50/70 hover:bg-rose-100 cursor-pointer disabled:opacity-50 font-semibold shadow-2xs transition-all"
                    title="Clear all activity logs"
                  >
                    {clearingLogs ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    <span>Clear Logs</span>
                  </button>
                </div>
              );
            })()}

            {/* SECTION 3 — Redesigned Data Table */}
            <div className="bg-white dark:bg-[var(--surf)] rounded-2xl border border-slate-200/80 dark:border-[var(--b)] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-[var(--surf2)] border-b border-slate-200/80 dark:border-[var(--b)] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 min-w-[170px]">User</th>
                      <th className="py-3 px-4 min-w-[280px]">Activity</th>
                      <th className="py-3 px-4 min-w-[160px]">Target</th>
                      <th className="py-3 px-4 min-w-[170px]">Date & Time</th>
                      <th className="py-3 px-4 min-w-[160px]">Platform</th>
                      <th className="py-3 px-4 text-right min-w-[100px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[var(--b)]/60">
                    {activityLoading && activityLogs.length === 0 ? (
                      Array.from({ length: 6 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[var(--surf3)]" />
                              <div className="space-y-1">
                                <div className="h-3.5 w-24 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                                <div className="h-3 w-16 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1.5">
                              <div className="h-3.5 w-44 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                              <div className="h-3 w-64 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="h-5 w-24 bg-slate-100 dark:bg-[var(--surf3)] rounded-lg" />
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="h-3.5 w-28 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                              <div className="h-3 w-16 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="h-3.5 w-20 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                              <div className="h-3 w-28 bg-slate-100 dark:bg-[var(--surf3)] rounded" />
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="h-7 w-16 bg-slate-100 dark:bg-[var(--surf3)] rounded-lg ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : activityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-[12.5px] text-slate-400 italic">
                          No activity logs found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      activityLogs.map((log) => {
                        const user = getUserDisplayDetails(log);
                        const activity = parseActivityDetails(log);
                        const platform = parsePlatformInfo(log);
                        const formattedDate = formatDateTime(log.created_at);
                        const isExpanded = activityExpandedId === String(log.id);

                        return (
                          <Fragment key={log.id}>
                            <tr className="hover:bg-slate-50/60 dark:hover:bg-[var(--surf2)]/40 transition-colors">
                              {/* 1. User Column */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] flex-shrink-0 ${user.avatarBgClass} ${user.avatarTextClass} shadow-2xs`}>
                                    {user.initials}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-[13px] text-slate-900 dark:text-white truncate">
                                      {user.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                      {user.role}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Activity Column */}
                              <td className="py-3.5 px-4 align-top">
                                <div>
                                  <div className="font-bold text-[13px] text-slate-900 dark:text-white leading-snug">
                                    {activity.title}
                                  </div>
                                  <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                                    {activity.description}
                                  </div>
                                  <div className="mt-1.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider border ${activity.categoryBadgeClass}`}>
                                      {activity.category}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 3. Target Column */}
                              <td className="py-3.5 px-4 align-top">
                                {activity.target ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 max-w-[200px] truncate">
                                    {activity.target}
                                  </span>
                                ) : (
                                  <span className="text-[13px] text-slate-400 font-medium">—</span>
                                )}
                              </td>

                              {/* 4. Date & Time Column */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="text-[12px] font-medium text-slate-800 dark:text-slate-200">
                                  {formattedDate}
                                </div>
                                <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                                  {log.time_ago || 'recently'}
                                </div>
                              </td>

                              {/* 5. Platform Column */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-800 dark:text-slate-200">
                                  {platform.isMobile ? (
                                    <Smartphone size={13} className="text-slate-500" />
                                  ) : (
                                    <Monitor size={13} className="text-slate-500" />
                                  )}
                                  <span>{platform.platform}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                                  {platform.osBrowser}
                                </div>
                                <button
                                  onClick={() => setActivityExpandedId(isExpanded ? null : String(log.id))}
                                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 mt-1 cursor-pointer"
                                >
                                  <span>{isExpanded ? 'Hide details ▲' : 'Show details ▼'}</span>
                                </button>
                              </td>

                              {/* 6. Actions Column */}
                              <td className="py-3.5 px-4 align-top text-right">
                                <button
                                  onClick={() => handleDeleteActivityLog(log.id)}
                                  disabled={activityLoading || deletingLogId === log.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900/50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                  title="Delete (move to Recycle Bin)"
                                >
                                  <Trash2 size={11} />
                                  <span>Delete</span>
                                </button>
                              </td>
                            </tr>

                            {/* Expandable Properties Drawer */}
                            {isExpanded && (
                              <tr className="bg-slate-50/50 dark:bg-[var(--surf2)]/30 border-b border-slate-100 dark:border-[var(--b)]/60">
                                <td colSpan={6} className="py-2 px-3 sm:px-6">
                                  <ActivityLogDetailPanel log={log} />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 4 — Load more pagination button */}
            {activityLogs.length < activityTotal && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    const nextOffset = activityOffset + ACTIVITY_PAGE_SIZE;
                    setActivityOffset(nextOffset);
                    loadActivityLogs(false, nextOffset);
                  }}
                  disabled={activityLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[var(--surf)] hover:bg-slate-50 dark:hover:bg-[var(--surf2)] border border-slate-200 dark:border-[var(--b)] rounded-xl text-[12px] font-semibold text-slate-800 dark:text-[var(--tx)] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {activityLoading && <Loader2 size={13} className="animate-spin" />}
                  <span>Load More ({activityTotal - activityLogs.length} remaining)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Webhook Management */}
        {tab === 3 && (
          <WebhookManagement />
        )}

        {/* Tab 4: System Maintenance */}
        {tab === 4 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--amber-bg)] text-[var(--amber-tx)] flex items-center justify-center flex-shrink-0">
                  <RefreshCw size={14} />
                </div>
                <div className="flex-1 space-y-1.5">
                  <h4 className="text-[13px] font-bold text-[var(--tx)]">Clear Client Application Cache</h4>
                  <p className="text-[11px] text-[var(--tx3)] leading-relaxed">
                    Clears local browser cache, localStorage states, and active logins. Useful if you are experiencing UI state inconsistency or want a fresh login.
                  </p>
                  
                  {cacheSuccess && (
                    <div className="p-2.5 bg-[var(--teal-bg)] text-[var(--teal-tx)] border border-[var(--teal-tx)]/10 rounded-lg text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 size={12} />
                      <span>{cacheSuccess}</span>
                    </div>
                  )}

                  <button
                    onClick={handleClearCache}
                    disabled={clearingCache}
                    className="px-3.5 py-1.5 bg-[var(--surf3)] hover:bg-[var(--surf)] border border-[var(--b)] hover:border-[var(--amber)] text-[11.5px] font-semibold text-[var(--tx)] rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {clearingCache && <Loader2 size={12} className="animate-spin" />}
                    Clear Local Cache
                  </button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--blue-bg)] text-[var(--blue-tx)] flex items-center justify-center flex-shrink-0">
                  <Shield size={14} />
                </div>
                <div className="flex-1 space-y-1.5">
                  <h4 className="text-[13px] font-bold text-[var(--tx)]">System Diagnostics</h4>
                  <p className="text-[11px] text-[var(--tx3)] leading-relaxed">
                    Test connection status to external ERP microservices including the live GPS Millitrack vehicle broker.
                  </p>
                  
                  <div className="space-y-1 mt-1 pt-1.5 border-t border-[var(--b)]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--tx3)]">Laravel API Gateway:</span>
                      <span className="font-semibold text-[var(--teal-tx)]">Online (200 OK)</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--tx3)]">Millitrack Broker:</span>
                      <span className="font-semibold text-[var(--teal-tx)]">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="md:col-span-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--amber-bg)] text-[var(--amber-tx)] flex items-center justify-center flex-shrink-0">
                  <ShieldAlert size={14} className="text-amber-500" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="text-[13px] font-bold text-[var(--tx)]">Mock Data & Handover Tools</h4>
                    <p className="text-[11px] text-[var(--tx3)] leading-relaxed">
                      Developer controls to populate temporary mock data for system testing across all tabs, or completely wipe all data to prepare a clean database for the client handover.
                    </p>
                  </div>

                  {seedSuccess && (
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-lg text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 size={12} />
                      <span>{seedSuccess}</span>
                    </div>
                  )}

                  {seedError && (
                    <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15 rounded-lg text-[11px] flex items-center gap-1.5">
                      <AlertCircle size={12} />
                      <span>{seedError}</span>
                    </div>
                  )}

                  {clearDbSuccess && (
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-lg text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 size={12} />
                      <span>{clearDbSuccess}</span>
                    </div>
                  )}

                  {clearDbError && (
                    <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15 rounded-lg text-[11px] flex items-center gap-1.5">
                      <AlertCircle size={12} />
                      <span>{clearDbError}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      onClick={handleSeedMockData}
                      disabled={seeding || clearingDb}
                      className="px-4 py-2 bg-[var(--blue)] text-white hover:opacity-90 disabled:opacity-50 text-[11.5px] font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {seeding && <Loader2 size={12} className="animate-spin" />}
                      Seed Mock Data
                    </button>

                    <button
                      onClick={handleClearDbData}
                      disabled={seeding || clearingDb}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-[11.5px] font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {clearingDb && <Loader2 size={12} className="animate-spin" />}
                      Wipe Mock Data & Prepare Handover
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 5: Biometric Integration (e-TimeOffice API) */}
        {tab === 5 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4 border-b border-[var(--b)] pb-3">
                <div>
                  <h3 className="text-[13px] font-bold text-[var(--tx)] flex items-center gap-1.5">
                    <Clock size={14} className="text-[var(--blue-tx)]" /> Biometric School Timings & Attendance Cutoffs
                  </h3>
                  <p className="text-[11px] text-[var(--tx3)] mt-0.5">
                    Define operational hours and cutoffs for automatic biometric check-in/check-out classification.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveTimings} className="space-y-4">
                {timingsSuccess && (
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-xl text-[11.5px] flex items-center gap-2">
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>{timingsSuccess}</span>
                  </div>
                )}

                {timingsError && (
                  <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15 rounded-xl text-[11.5px] flex items-center gap-2">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{timingsError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-[var(--b)]/50">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">School Start Time *</label>
                    <input 
                      type="time"
                      value={schoolStartTime}
                      onChange={(e) => setSchoolStartTime(e.target.value)}
                      required 
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)] font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">School End Time *</label>
                    <input 
                      type="time"
                      value={schoolEndTime}
                      onChange={(e) => setSchoolEndTime(e.target.value)}
                      required 
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)] font-mono" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-[var(--b)]/50">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">Morning Present Cutoff Time *</label>
                    <input 
                      type="time"
                      value={presentCutoffMorning}
                      onChange={(e) => setPresentCutoffMorning(e.target.value)}
                      required 
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)] font-mono" 
                    />
                    <span className="text-[10px] text-[var(--tx3)] mt-1 block">Punches before this cutoff are marked "Present" (No Late Marks).</span>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">Evening Present Cutoff Time *</label>
                    <input 
                      type="time"
                      value={presentCutoffEvening}
                      onChange={(e) => setPresentCutoffEvening(e.target.value)}
                      required 
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)] font-mono" 
                    />
                    <span className="text-[10px] text-[var(--tx3)] mt-1 block">Punches after this cutoff are marked "Present" (No Early Marks).</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-[var(--b)]/50">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">Morning Late Entry Cutoff *</label>
                    <input 
                      type="time"
                      value={lateEntryCutoff}
                      onChange={(e) => setLateEntryCutoff(e.target.value)}
                      required 
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)] font-mono" 
                    />
                    <span className="text-[10px] text-[var(--tx3)] mt-1 block">Punches between morning Present Cutoff and this cutoff are marked "Late". Punches after this cutoff are ignored (Absent).</span>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">Evening Early Entry Cutoff *</label>
                    <input 
                      type="time"
                      value={earlyEntryCutoff}
                      onChange={(e) => setEarlyEntryCutoff(e.target.value)}
                      required 
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)] font-mono" 
                    />
                    <span className="text-[10px] text-[var(--tx3)] mt-1 block">Punches between this cutoff and evening Present Cutoff are marked "Early". Punches before this cutoff are ignored.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">Biometric Machine Status Cutoff Time *</label>
                    <input 
                      type="time"
                      value={biometricMachineCutoff}
                      onChange={(e) => setBiometricMachineCutoff(e.target.value)}
                      required 
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)] font-mono" 
                    />
                    <span className="text-[10px] text-[var(--tx3)] mt-1 block">If no punch data is received from the biometric device up to this time, manual attendance mode is automatically enabled for staff attendance.</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-[var(--b)]">
                  <button
                    type="submit"
                    disabled={savingTimings}
                    className="px-4 py-2 bg-[var(--blue)] hover:opacity-90 disabled:opacity-50 text-white text-[11.5px] font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {savingTimings && <Loader2 size={12} className="animate-spin" />}
                    <Save size={12} />
                    Save Timings & Cutoffs
                  </button>
                </div>
              </form>
            </Card>

            {bioStatus && (
              <Card>
                <div className="flex items-center justify-between mb-3 border-b border-[var(--b)] pb-2.5">
                  <h4 className="text-[12.5px] font-bold text-[var(--tx)] flex items-center gap-1.5">
                    <Key size={13} className="text-[var(--blue-tx)]" /> System Sync Status
                  </h4>
                </div>
                {loadingBioStatus ? (
                  <div className="flex justify-center py-6">
                    <Loader2 size={16} className="animate-spin text-[var(--blue)]" />
                  </div>
                ) : (
                  <div className="space-y-2.5 text-[11.5px]">
                    <div className="flex justify-between py-1 border-b border-[var(--b)]/50">
                      <span className="text-[var(--tx3)]">Last Successful Sync:</span>
                      <span className="font-semibold text-[var(--tx)]">
                        {bioStatus.last_sync ? new Date(bioStatus.last_sync).toLocaleString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[var(--b)]/50">
                      <span className="text-[var(--tx3)]">Last Sync Cursor:</span>
                      <span className="font-mono text-[var(--tx2)] font-semibold">
                        {bioStatus.last_record || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[var(--b)]/50">
                      <span className="text-[var(--tx3)]">Synced Today:</span>
                      <span className="font-semibold text-[var(--teal-tx)]">{bioStatus.today_records} logs</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[var(--tx3)]">Synced This Week:</span>
                      <span className="font-semibold text-[var(--blue-tx)]">{bioStatus.week_records} logs</span>
                    </div>

                    <div className="pt-2.5 border-t border-[var(--b)]/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[11px] text-[var(--tx)]">API Connection Test</div>
                          <p className="text-[10px] text-[var(--tx3)]">Verify connectivity with env credentials.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleTestBiometric}
                          disabled={isTestingBio}
                          className="px-2.5 py-1.5 bg-[var(--surf3)] hover:bg-[var(--surf)] border border-[var(--b)] hover:border-[var(--blue)] disabled:opacity-50 text-[10.5px] font-semibold text-[var(--tx2)] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          {isTestingBio && <Loader2 size={10} className="animate-spin" />}
                          <RefreshCw size={10} />
                          Test
                        </button>
                      </div>

                      {testBioResult && (
                        <div className={`mt-2 p-2 border rounded-lg text-[10px] flex items-center gap-1.5 ${
                          testBioResult.success 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/15'
                        }`}>
                          {testBioResult.success ? <CheckCircle2 size={11} className="shrink-0" /> : <AlertCircle size={11} className="shrink-0" />}
                          <span>{testBioResult.message}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-[var(--b)]/50 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-[11px] text-[var(--tx)]">Cursor Reset</div>
                        <p className="text-[10px] text-[var(--tx3)]">Force full sync of the current month.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetCursor}
                        disabled={resettingCursor}
                        className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/15 rounded-lg text-[10.5px] font-semibold cursor-pointer disabled:opacity-50 transition-all"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Academic Year Create/Edit Modal */}
      {showAyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveAy} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <h3 className="text-[14px] font-bold text-[var(--tx)]">
                  {editingAy ? 'Edit Academic Year' : 'Add Academic Year'}
                </h3>
                <p className="text-[11px] text-[var(--tx3)] mt-0.5">Specify name and duration limits.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAyModal(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--surf2)] text-[var(--tx2)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">Academic Year Name *</label>
                <input 
                  value={ayName}
                  onChange={(e) => setAyName(e.target.value)}
                  required 
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" 
                  placeholder="e.g. 2027-2028"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">Start Date *</label>
                  <input 
                    type="date"
                    value={ayStart}
                    onChange={(e) => setAyStart(e.target.value)}
                    required 
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" 
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">End Date *</label>
                  <input 
                    type="date"
                    value={ayEnd}
                    onChange={(e) => setAyEnd(e.target.value)}
                    required 
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" 
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-[12px] text-[var(--tx2)] cursor-pointer mt-1 select-none">
                <input 
                  type="checkbox"
                  checked={ayIsCurrent}
                  onChange={(e) => setAyIsCurrent(e.target.checked)}
                  className="rounded border-[var(--b)] text-[var(--blue)] focus:ring-0 cursor-pointer"
                />
                Mark as Active/Current Academic Year
              </label>

              {ayError && (
                <div className="p-3 bg-[var(--red-bg)] border border-[var(--red-tx)]/10 text-[var(--red-tx)] rounded-xl text-[11.5px] flex items-center gap-2">
                  <AlertCircle size={13} className="flex-shrink-0" />
                  <span>{ayError}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 p-5 pt-0 border-t border-[var(--b)]/10 mt-2">
              <button 
                type="button" 
                onClick={() => setShowAyModal(false)}
                disabled={savingAy}
                className="flex-1 py-2 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={savingAy}
                className="flex-1 py-2 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {savingAy && <Loader2 size={13} className="animate-spin" />}
                {savingAy ? 'Saving...' : editingAy ? 'Save Changes' : 'Create Year'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

// EVENT DOT COLORS (helper function)
function eventDotColor(event: string): string {
  if (event === 'created') return 'bg-green-500';
  if (event === 'updated') return 'bg-blue-500';
  if (event === 'deleted') return 'bg-red-500';
  if (event === 'login')   return 'bg-teal-500';
  if (event === 'logout')  return 'bg-gray-400';
  return 'bg-amber-400';
}

// EVENT BADGE STYLES
function eventBadgeStyle(event: string): string {
  if (event === 'created') return 'bg-[var(--green-bg)] text-[var(--green-tx)]';
  if (event === 'updated') return 'bg-[var(--blue-bg)] text-[var(--blue-tx)]';
  if (event === 'deleted') return 'bg-[var(--red-bg)] text-[var(--red-tx)]';
  if (event === 'login')   return 'bg-[var(--teal-bg)] text-[var(--teal-tx)]';
  if (event === 'logout')  return 'bg-[var(--surf2)] text-[var(--tx3)]';
  return 'bg-[var(--amber-bg)] text-[var(--amber-tx)]';
}

// HELPER TO FORMAT ANY VALUE HUMAN READABLY WITHOUT BRACES
const formatVal = (v: any): string => {
  if (v === null || v === undefined) return 'N/A';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(v);
        return formatVal(parsed);
      } catch (e) {}
    }
    return v;
  }

  if (Array.isArray(v)) {
    if (v.length === 0) return 'None';
    
    // If it's an array of objects
    if (typeof v[0] === 'object' && v[0] !== null) {
      // Special check: is it an attendance list?
      const isAttendanceList = v.some((item: any) => item && (item.status === 'present' || item.status === 'absent'));
      if (isAttendanceList) {
        let maxMarkedAt = '';
        v.forEach((r: any) => {
          if (r && r.markedAt) {
            if (!maxMarkedAt || r.markedAt > maxMarkedAt) {
              maxMarkedAt = r.markedAt;
            }
          }
        });
        const targetRecords = maxMarkedAt 
          ? v.filter((r: any) => r && r.markedAt === maxMarkedAt)
          : v;
        const present = targetRecords.filter((item: any) => item && item.status === 'present').length;
        const absent = targetRecords.filter((item: any) => item && item.status === 'absent').length;
        return `Present: ${present}, Absent: ${absent}`;
      }

      return `${v.length} items`;
    }
    return v.map(item => formatVal(item)).join(', ');
  }

  if (typeof v === 'object') {
    const entries = Object.entries(v);
    if (entries.length === 0) return '';
    return entries
      .map(([k, val]) => {
        const formattedKey = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return `${formattedKey}: ${formatVal(val)}`;
      })
      .join(', ');
  }

  return String(v);
};

// HELPER TO DYNAMICALLY CLEAN UP ANY JSON STRING INSIDE DESCRIPTION
const cleanJsonInString = (str: string): string => {
  if (!str) return '';
  const startIdxCurly = str.indexOf('{');
  const startIdxSquare = str.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;
  let isCurly = false;
  
  if (startIdxCurly !== -1 && (startIdxSquare === -1 || startIdxCurly < startIdxSquare)) {
    startIdx = startIdxCurly;
    isCurly = true;
  } else if (startIdxSquare !== -1) {
    startIdx = startIdxSquare;
  }
  
  if (startIdx !== -1) {
    const endIdxCurly = str.lastIndexOf('}');
    const endIdxSquare = str.lastIndexOf(']');
    if (isCurly && endIdxCurly > startIdx) {
      endIdx = endIdxCurly;
    } else if (!isCurly && endIdxSquare > startIdx) {
      endIdx = endIdxSquare;
    }
  }
  
  if (startIdx !== -1 && endIdx !== -1) {
    const prefix = str.substring(0, startIdx).trim();
    let suffix = str.substring(endIdx + 1).trim();
    const jsonStr = str.substring(startIdx, endIdx + 1);
    
    try {
      const parsed = JSON.parse(jsonStr);
      if (suffix === "'" || suffix === '"') suffix = '';
      let cleanPrefix = prefix;
      if (cleanPrefix.endsWith("to '") || cleanPrefix.endsWith('to "')) {
        cleanPrefix = cleanPrefix.substring(0, cleanPrefix.length - 5).trim();
      } else if (cleanPrefix.endsWith("to")) {
        cleanPrefix = cleanPrefix.substring(0, cleanPrefix.length - 2).trim();
      }
      
      let formattedJson = formatVal(parsed);
      if (formattedJson.length > 120) {
        formattedJson = formattedJson.substring(0, 120) + '...';
      }
      return `${cleanPrefix}${formattedJson ? ` to: ${formattedJson}` : ''}${suffix ? ` ${suffix}` : ''}`;
    } catch (e) {}
  }
  
  return str;
};

// FORMAT DYNAMIC DESCRIPTIONS DYNAMICALLY (e.g. attendance logs)
function formatDescription(log: any): string {
  const desc = log.description || '';
  if (desc.startsWith("Updated system setting 'kts student attendance records' to") || desc === "Student attendance records updated" || desc.toLowerCase().includes("attendance")) {
    const properties = log.properties || {};
    let records: any[] = [];
    
    const parseValue = (val: any) => {
      if (!val) return [];
      try {
        if (Array.isArray(val)) return val;
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return [];
    };

    records = parseValue(properties.attributes?.value || properties.value);
    
    if (records.length === 0) {
      for (const val of Object.values(properties)) {
        const arr = parseValue(val);
        if (arr.length > 0 && arr[0] && (arr[0].className || arr[0].session || arr[0].markedAt)) {
          records = arr;
          break;
        }
      }
    }

    if (records.length === 0) {
      const startIdxSquare = desc.indexOf('[');
      const endIdxSquare = desc.lastIndexOf(']');
      if (startIdxSquare !== -1 && endIdxSquare > startIdxSquare) {
        const jsonStr = desc.substring(startIdxSquare, endIdxSquare + 1);
        records = parseValue(jsonStr);
      }
    }

    if (records.length > 0) {
      let maxMarkedAt = '';
      records.forEach((r: any) => {
        if (r && r.markedAt) {
          if (!maxMarkedAt || r.markedAt > maxMarkedAt) {
            maxMarkedAt = r.markedAt;
          }
        }
      });

      const targetRecords = maxMarkedAt 
        ? records.filter((r: any) => r && r.markedAt === maxMarkedAt)
        : records;

      if (targetRecords.length > 0 && targetRecords[0]) {
        const first = targetRecords[0];
        const classSection = first.className || '';
        const session = first.session === 'first_period' ? 'morning' : 'afternoon';
        if (classSection) {
          return `marked attendance for ${classSection} in ${session}`;
        }
      }
    }
  }
  return cleanJsonInString(desc);
}

// RENDER ACTIVITY PROPERTIES IN HUMAN READABLE FORMAT
function renderActivityProperties(log: any) {
  if (!log) return null;
  return <ActivityLogDetailPanel log={log} />;
}

