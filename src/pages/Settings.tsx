import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { api, clearApiCache } from '../services/api';
import { useApp } from '../context/AppContext';
import { useDialog } from '../context/DialogContext';
import { 
  Calendar, Plus, Trash2, Edit2, CheckCircle2, Shield, 
  AlertCircle, RefreshCw, RotateCcw, X, Loader2, Save,
  Activity, User, Search, Clock, GitCompare, ArrowRight,
  ShieldAlert, ChevronDown, ChevronRight, Fingerprint, Key
} from 'lucide-react';
import { TabBar } from '../components/ui';
import { WebhookManagement } from '../components/WebhookManagement';


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
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Biometric integration states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activityUsers, setActivityUsers] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nameSet = data.find((s: any) => s.key === 'school_name');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const emailSet = data.find((s: any) => s.key === 'school_email');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const phoneSet = data.find((s: any) => s.key === 'school_phone');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const addrSet = data.find((s: any) => s.key === 'school_address');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const attSet = data.find((s: any) => s.key === 'minimum_attendance_percentage');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bioSet = data.find((s: any) => s.key === 'biometric_api_key');

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const startSetting = settings.find((s: any) => s.key === 'school_start_time');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const endSetting = settings.find((s: any) => s.key === 'school_end_time');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const presMSetting = settings.find((s: any) => s.key === 'present_cutoff_morning');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const presESetting = settings.find((s: any) => s.key === 'present_cutoff_evening');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lateSetting = settings.find((s: any) => s.key === 'late_entry_cutoff');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const earlySetting = settings.find((s: any) => s.key === 'early_entry_cutoff');

        if (startSetting) setSchoolStartTime(startSetting.value);
        if (endSetting) setSchoolEndTime(endSetting.value);
        if (presMSetting) setPresentCutoffMorning(presMSetting.value);
        if (presESetting) setPresentCutoffEvening(presESetting.value);
        if (lateSetting) setLateEntryCutoff(lateSetting.value);
        if (earlySetting) setEarlyEntryCutoff(earlySetting.value);
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
      ];

      await Promise.all(keys.map(async (item) => {
        const existing = await api.getResources('settings', { key: item.key });
        if (Array.isArray(existing) && existing.length > 0) {
          await api.updateResource('settings', String(existing[0].id), { value: item.value });
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
      const data = res.data ?? res ?? [];
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
        { key: 'biometric_api_key', value: biometricApiKey }
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

                <div className="border-t border-[var(--b)] pt-4">
                  <h4 className="text-[12px] font-bold text-[var(--tx)] mb-2 flex items-center gap-1">
                    <Shield size={12} className="text-[var(--purple-tx)]" /> API Integrations
                  </h4>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">Biometric Machine API Key (Webhook Security)</label>
                    <input 
                      type="password"
                      value={biometricApiKey}
                      onChange={(e) => setBiometricApiKey(e.target.value)}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)] font-mono" 
                      placeholder="••••••••••••••••••••••••••••••••"
                    />
                    <span className="text-[10px] text-[var(--tx3)] mt-1.5 block">Used to verify punch data updates sent from biometric device webhook requests.</span>
                  </div>
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
            {/* SECTION 1 — Summary bar */}
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <div className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl px-3 py-2 text-center text-[11px]">
                    <div className="text-[var(--tx3)] font-medium">Total Logs Today</div>
                    <div className="text-[16px] font-bold text-[var(--tx)] mt-0.5">{totalLogsToday}</div>
                  </div>
                  <div className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl px-3 py-2 text-center text-[11px]">
                    <div className="text-[var(--tx3)] font-medium">Active Users Today</div>
                    <div className="text-[16px] font-bold text-[var(--tx)] mt-0.5">{activeUsersToday}</div>
                  </div>
                  <div className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl px-3 py-2 text-center text-[11px]">
                    <div className="text-[var(--tx3)] font-medium">Logins Today</div>
                    <div className="text-[16px] font-bold text-[var(--teal-tx)] mt-0.5">{loginsToday}</div>
                  </div>
                  <div className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl px-3 py-2 text-center text-[11px]">
                    <div className="text-[var(--tx3)] font-medium">Deletions Today</div>
                    <div className="text-[16px] font-bold text-[var(--red-tx)] mt-0.5">{deletionsToday}</div>
                  </div>
                </div>
              );
            })()}

            {/* SECTION 2 — Filter bar */}
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
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="relative min-w-[200px] flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tx3)]" />
                    <input
                      type="text"
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      placeholder="Search actions…"
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-xl pl-9 pr-3 py-1.5 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] placeholder-[var(--tx3)]"
                    />
                  </div>

                  <select
                    value={activityUserFilter}
                    onChange={(e) => setActivityUserFilter(e.target.value)}
                    className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl px-3 py-1.5 text-[12px] text-[var(--tx)] cursor-pointer outline-none min-w-[140px]"
                  >
                    <option value="">All Users</option>
                    {activityUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={activityEventFilter}
                    onChange={(e) => setActivityEventFilter(e.target.value)}
                    className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl px-3 py-1.5 text-[12px] text-[var(--tx)] cursor-pointer outline-none min-w-[120px]"
                  >
                    <option value="">All Events</option>
                    <option value="created">created</option>
                    <option value="updated">updated</option>
                    <option value="deleted">deleted</option>
                    <option value="login">login</option>
                    <option value="logout">logout</option>
                    <option value="action">action</option>
                  </select>

                  <div className="flex items-center gap-1 bg-[var(--surf2)] border border-[var(--b)] rounded-xl px-3 py-1">
                    <span className="text-[10px] text-[var(--tx3)] font-semibold uppercase">From</span>
                    <input
                      type="date"
                      value={activityDateFrom}
                      onChange={(e) => setActivityDateFrom(e.target.value)}
                      className="bg-transparent border-0 text-[12px] text-[var(--tx)] outline-none p-0 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-[var(--surf2)] border border-[var(--b)] rounded-xl px-3 py-1">
                    <span className="text-[10px] text-[var(--tx3)] font-semibold uppercase">To</span>
                    <input
                      type="date"
                      value={activityDateTo}
                      onChange={(e) => setActivityDateTo(e.target.value)}
                      className="bg-transparent border-0 text-[12px] text-[var(--tx)] outline-none p-0 cursor-pointer"
                    />
                  </div>

                  {isFilterActive && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-[var(--red-tx)] bg-[var(--red-bg)] hover:opacity-90 rounded-xl font-semibold cursor-pointer"
                    >
                      <X size={13} />
                      <span>Clear</span>
                    </button>
                  )}

                  <button
                    onClick={() => loadActivityLogs(true)}
                    disabled={activityLoading}
                    className="flex items-center justify-center p-2 text-[var(--tx2)] hover:text-[var(--tx)] border border-[var(--b)] rounded-xl bg-[var(--surf2)] hover:bg-[var(--surf3)] cursor-pointer disabled:opacity-50"
                    title="Refresh logs"
                  >
                    <RotateCcw size={14} className={activityLoading ? 'animate-spin' : ''} />
                  </button>

                  <button
                    onClick={handleClearActivityLogs}
                    disabled={activityLoading || clearingLogs}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12px] text-rose-500 hover:text-rose-600 border border-rose-500/20 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer disabled:opacity-50 font-semibold"
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

            {/* SECTION 3 — Activity timeline list */}
            <Card>
              {activityLoading && activityLogs.length === 0 ? (
                <div className="space-y-4">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="flex gap-3 py-3 border-b border-[var(--b)] last:border-0 animate-pulse">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--surf3)] mt-1.5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-16 bg-[var(--surf3)] rounded-full" />
                            <div className="h-4 w-48 bg-[var(--surf3)] rounded" />
                          </div>
                          <div className="h-3 w-12 bg-[var(--surf3)] rounded" />
                        </div>
                        <div className="flex gap-1.5">
                          <div className="h-3.5 w-10 bg-[var(--surf3)] rounded-full" />
                          <div className="h-3.5 w-16 bg-[var(--surf3)] rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-10 text-[12px] text-[var(--tx3)] italic">
                  No activity logs found matching the selected filters.
                </div>
              ) : (
                <div>
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 py-3 border-b border-[var(--b)] last:border-0 items-start">
                      {/* Left: event dot */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${eventDotColor(log.event)}`} />
                      </div>
                      
                      {/* Center: content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {/* User chip */}
                            <span className="text-[11px] font-semibold text-[var(--blue-tx)] bg-[var(--blue-bg)] px-2 py-0.5 rounded-full mr-2">
                              {log.causer_name}
                            </span>
                            {/* Description */}
                            <span className="text-[12px] text-[var(--tx)]">{formatDescription(log)}</span>
                          </div>
                          {/* Time */}
                          <span className="text-[10px] text-[var(--tx3)] flex-shrink-0">{log.time_ago}</span>
                        </div>
                        
                        {/* Second row: tags */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {log.event && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${eventBadgeStyle(log.event)}`}>
                              {log.event}
                            </span>
                          )}
                          {log.subject_type && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surf2)] text-[var(--tx3)]">
                              {log.subject_type}
                            </span>
                          )}
                          {log.properties?.ip_address && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surf2)] text-[var(--tx3)]">
                              {log.properties.ip_address}
                            </span>
                          )}
                        </div>
                        
                        {/* Expandable properties */}
                        {Object.keys(log.properties ?? {}).length > 0 && (
                          <button
                            onClick={() => setActivityExpandedId(activityExpandedId === String(log.id) ? null : String(log.id))}
                            className="text-[10px] text-[var(--blue-tx)] mt-1 hover:underline block"
                          >
                            {activityExpandedId === String(log.id) ? 'Hide details ▲' : 'Show details ▼'}
                          </button>
                        )}
                        {activityExpandedId === String(log.id) && renderActivityProperties(log)}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <button
                          onClick={() => handleDeleteActivityLog(log.id)}
                          disabled={activityLoading || deletingLogId === log.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-[var(--red-bg)] text-[var(--red-tx)] rounded-lg hover:opacity-80 cursor-pointer transition-opacity"
                          title="Delete (move to Recycle Bin)"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* SECTION 4 — Load more button */}
            {activityLogs.length < activityTotal && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    const nextOffset = activityOffset + ACTIVITY_PAGE_SIZE;
                    setActivityOffset(nextOffset);
                    loadActivityLogs(false, nextOffset);
                  }}
                  disabled={activityLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[var(--surf2)] hover:bg-[var(--surf3)] border border-[var(--b)] rounded-xl text-[12px] font-semibold text-[var(--tx)] transition-all cursor-pointer disabled:opacity-50"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isAttendanceList = v.some((item: any) => item && (item.status === 'present' || item.status === 'absent'));
      if (isAttendanceList) {
        let maxMarkedAt = '';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        v.forEach((r: any) => {
          if (r && r.markedAt) {
            if (!maxMarkedAt || r.markedAt > maxMarkedAt) {
              maxMarkedAt = r.markedAt;
            }
          }
        });
        const targetRecords = maxMarkedAt 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? v.filter((r: any) => r && r.markedAt === maxMarkedAt)
          : v;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const present = targetRecords.filter((item: any) => item && item.status === 'present').length;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatDescription(log: any): string {
  const desc = log.description || '';
  if (desc.startsWith("Updated system setting 'kts student attendance records' to") || desc === "Student attendance records updated" || desc.toLowerCase().includes("attendance")) {
    const properties = log.properties || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let records: any[] = [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      records.forEach((r: any) => {
        if (r && r.markedAt) {
          if (!maxMarkedAt || r.markedAt > maxMarkedAt) {
            maxMarkedAt = r.markedAt;
          }
        }
      });

      const targetRecords = maxMarkedAt 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderActivityProperties(log: any) {
  const properties = log.properties;
  const event = log.event;
  const description = log.description;

  if (!properties || Object.keys(properties).length === 0) return null;

  const formatKey = (k: string) => {
    return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const isAttendanceLog = 
    properties.present_count !== undefined ||
    (description && (
      description === 'Student attendance records updated' ||
      description.toLowerCase().includes('attendance')
    )) ||
    (properties.attributes && (properties.attributes.key === 'kts_student_attendance_records' || properties.attributes.key === 'kts student attendance records')) ||
    (properties.old && (properties.old.key === 'kts_student_attendance_records' || properties.old.key === 'kts student attendance records'));

  if (isAttendanceLog) {
    let present: number | undefined = undefined;
    let absent: number | undefined = undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let oldArr: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let newArr: any[] = [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parseValue = (val: any) => {
      if (!val) return [];
      try {
        if (Array.isArray(val)) return val;
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return [];
    };

    newArr = parseValue(properties.attributes?.value || properties.value);
    oldArr = parseValue(properties.old?.value);

    if (newArr.length === 0 && oldArr.length === 0) {
      for (const val of Object.values(properties)) {
        const arr = parseValue(val);
        if (arr.length > 0 && arr[0] && (arr[0].studentId || arr[0].status || arr[0].markedAt)) {
          newArr = arr;
          break;
        }
      }
    }

    if (newArr.length === 0 && oldArr.length === 0) {
      const startIdxSquare = description ? description.indexOf('[') : -1;
      const endIdxSquare = description ? description.lastIndexOf(']') : -1;
      if (startIdxSquare !== -1 && endIdxSquare > startIdxSquare) {
        const jsonStr = description.substring(startIdxSquare, endIdxSquare + 1);
        newArr = parseValue(jsonStr);
      }
    }

    if (newArr.length > 0) {
      let maxMarkedAt = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newArr.forEach((r: any) => {
        if (r && r.markedAt) {
          if (!maxMarkedAt || r.markedAt > maxMarkedAt) {
            maxMarkedAt = r.markedAt;
          }
        }
      });
      const targetRecords = maxMarkedAt 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? newArr.filter((r: any) => r && r.markedAt === maxMarkedAt)
        : newArr;
      present = targetRecords.filter(r => r.status === 'present').length;
      absent = targetRecords.filter(r => r.status === 'absent').length;
    } else if (oldArr.length > 0) {
      let maxMarkedAt = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      oldArr.forEach((r: any) => {
        if (r && r.markedAt) {
          if (!maxMarkedAt || r.markedAt > maxMarkedAt) {
            maxMarkedAt = r.markedAt;
          }
        }
      });
      const targetRecords = maxMarkedAt 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? oldArr.filter((r: any) => r && r.markedAt === maxMarkedAt)
        : oldArr;
      present = targetRecords.filter(r => r.status === 'present').length;
      absent = targetRecords.filter(r => r.status === 'absent').length;
    } else {
      if (properties.present_count !== undefined) present = properties.present_count;
      if (properties.absent_count !== undefined) absent = properties.absent_count;
    }

    if (present !== undefined || absent !== undefined) {
      return (
        <div className="mt-2 text-[11px] bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3 text-[var(--tx2)]">
          <div className="font-semibold text-[var(--tx)] text-[11.5px] border-b border-[var(--b)] pb-1.5 mb-1.5">
            Attendance Allotment Summary
          </div>
          <div className="space-y-1">
            <div className="flex justify-between sm:justify-start gap-2">
              <span className="font-bold text-[var(--tx)] min-w-[120px]">Present:</span>
              <span className="text-[var(--teal-tx)] font-semibold">{present ?? 0}</span>
            </div>
            <div className="flex justify-between sm:justify-start gap-2">
              <span className="font-bold text-[var(--tx)] min-w-[120px]">Absent:</span>
              <span className="text-[var(--red-tx)] font-semibold">{absent ?? 0}</span>
            </div>
          </div>
        </div>
      );
    }
  }

  const isModelLog = 'attributes' in properties || 'old' in properties;
  const excludeKeys = ['id', 'created_at', 'updated_at', 'password', 'password_confirmation', 'token', '_token', 'created_by', 'updated_by', 'academic_year_id', 'remember_token'];

  if (isModelLog) {
    const attributes = properties.attributes || {};
    const old = properties.old || {};

    // For updates, we show what changed
    if (event === 'updated' && Object.keys(old).length > 0) {
      const changes = Object.keys(attributes)
        .filter(key => !excludeKeys.includes(key))
        .map(key => {
          const oldVal = old[key];
          const newVal = attributes[key];
          if (oldVal !== newVal) {
            return {
              key,
              old: formatVal(oldVal),
              new: formatVal(newVal)
            };
          }
          return null;
        })
        .filter(Boolean) as Array<{ key: string; old: string; new: string }>;

      if (changes.length > 0) {
        return (
          <div className="mt-2 text-[11px] bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3 space-y-1.5 text-[var(--tx2)]">
            <div className="font-semibold text-[var(--tx)] text-[11.5px] border-b border-[var(--b)] pb-1.5 mb-1.5">Modified Fields</div>
            {changes.map(ch => (
              <div key={ch.key} className="flex flex-wrap gap-1 items-center">
                <span className="font-bold text-[var(--tx)]">{formatKey(ch.key)}</span>
                <span>changed from</span>
                <code className="px-1.5 py-0.5 bg-[var(--surf3)] rounded font-mono text-[10px] text-rose-500 line-through">{ch.old}</code>
                <span>to</span>
                <code className="px-1.5 py-0.5 bg-[var(--surf3)] rounded font-mono text-[10px] text-emerald-500 font-semibold">{ch.new}</code>
              </div>
            ))}
          </div>
        );
      }
    }

    // For created or deleted or fallback where we display a list of attributes
    const displayData = event === 'deleted' ? old : attributes;
    const items = Object.entries(displayData)
      .filter(([key]) => !excludeKeys.includes(key) && displayData[key] !== null)
      .map(([key, val]) => ({
        key,
        value: formatVal(val)
      }));

    if (items.length > 0) {
      return (
        <div className="mt-2 text-[11px] bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3 text-[var(--tx2)]">
          <div className="font-semibold text-[var(--tx)] text-[11.5px] border-b border-[var(--b)] pb-1.5 mb-1.5">
            {event === 'deleted' ? 'Deleted Record Details' : 'Record Details'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            {items.map(item => (
              <div key={item.key} className="flex justify-between sm:justify-start gap-2 border-b border-[var(--b)]/40 pb-1 last:border-0">
                <span className="font-bold text-[var(--tx)] min-w-[120px]">{formatKey(item.key)}:</span>
                <span className="text-[var(--tx2)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  // Otherwise it is a request/middleware log (or doesn't fit attributes/old schema)
  const renderDevice = (ua: string) => {
    if (!ua) return 'Unknown Device';
    if (ua.includes('Edg/')) return 'Edge Browser';
    if (ua.includes('Chrome/')) return 'Chrome Browser';
    if (ua.includes('Safari/') && ua.includes('Version/')) return 'Safari Browser';
    if (ua.includes('Firefox/')) return 'Firefox Browser';
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) return 'Mobile Device';
    return 'Web Browser';
  };

  const details = [];
  if (properties.ip_address) details.push({ label: 'IP Address', value: properties.ip_address });
  if (properties.user_agent) details.push({ label: 'Device', value: renderDevice(properties.user_agent) });
  if (properties.method && properties.path) details.push({ label: 'API Route', value: `${properties.method} ${properties.path}` });
  if (properties.status_code) details.push({ label: 'HTTP Status', value: String(properties.status_code) });
  if (properties.input_keys && Array.isArray(properties.input_keys) && properties.input_keys.length > 0) {
    details.push({ label: 'Parameters Modified', value: properties.input_keys.map(formatKey).join(', ') });
  }

  // Add any other top-level keys that aren't excluded
  const standardKeys = ['ip_address', 'user_agent', 'method', 'path', 'status_code', 'url', 'input_keys'];
  Object.entries(properties).forEach(([key, val]) => {
    if (!standardKeys.includes(key) && val !== null && val !== undefined) {
      details.push({ label: formatKey(key), value: formatVal(val) });
    }
  });

  if (details.length > 0) {
    return (
      <div className="mt-2 text-[11px] bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3 text-[var(--tx2)]">
        <div className="font-semibold text-[var(--tx)] text-[11.5px] border-b border-[var(--b)] pb-1.5 mb-1.5">Activity Details</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {details.map(d => (
            <div key={d.label} className="flex justify-between sm:justify-start gap-2 border-b border-[var(--b)]/40 pb-1 last:border-0">
              <span className="font-bold text-[var(--tx)] min-w-[120px]">{d.label}:</span>
              <span className="text-[var(--tx2)] font-mono">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
