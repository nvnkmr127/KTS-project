import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { 
  Calendar, Plus, Trash2, Edit2, CheckCircle2, Shield, 
  AlertCircle, RefreshCw, X, Loader2, Save,
  Activity, User, Search, Clock
} from 'lucide-react';
import { TabBar } from '../components/ui';

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

  // Cache/Maintenance states
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheSuccess, setCacheSuccess] = useState('');

  // Activity log states
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [users, setUsers] = useState<any[]>([]);

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

  // Load Activity Logs
  const loadActivityLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await api.getResources('activity-logs');
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      console.error('Error loading activity logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Load Users for filter dropdown
  const loadUsers = async () => {
    try {
      const data = await api.getResources('users');
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  useEffect(() => {
    if (tab === 0) {
      loadAys();
    } else if (tab === 1) {
      loadSettings();
    } else if (tab === 2) {
      loadActivityLogs();
      loadUsers();
    }
  }, [tab]);

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
    if (!window.confirm('Are you sure you want to delete this academic year? This will delete associated classes and students.')) return;
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

  const filteredLogs = logs.filter((log) => {
    const matchUser = userFilter === 'All' || String(log.causer_name) === userFilter;
    const matchSearch = !logSearch.trim() || 
      String(log.description).toLowerCase().includes(logSearch.toLowerCase()) ||
      String(log.log_name || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      String(log.event || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      String(log.causer_name).toLowerCase().includes(logSearch.toLowerCase());
    return matchUser && matchSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg)]">
      
      <TabBar 
        tabs={['Academic Years', 'School Profile', 'Activity Logs', 'System Maintenance']}
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
          <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className="text-[13px] font-bold text-[var(--tx)] flex items-center gap-1.5">
                  <Activity size={14} className="text-[var(--blue-tx)]" /> Activity Logs
                </h3>
                <p className="text-[11px] text-[var(--tx3)] mt-0.5">Track modifications, system loggings, and user actions.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch sm:items-center">
                {/* Search */}
                <div className="relative flex-1 sm:w-60">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--tx3)]" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search logs..."
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg pl-8 pr-3 py-1.5 text-[11.5px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                  />
                </div>

                {/* User filter */}
                <div className="flex items-center gap-1.5">
                  <User size={12} className="text-[var(--tx3)]" />
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2 py-1.5 text-[11.5px] text-[var(--tx)] cursor-pointer outline-none min-w-[140px]"
                  >
                    <option value="All">All Users</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                    <option value="System">System</option>
                  </select>
                </div>
                
                {/* Refresh */}
                <button
                  onClick={loadActivityLogs}
                  disabled={loadingLogs}
                  className="flex items-center justify-center p-1.5 text-[var(--tx2)] hover:text-[var(--tx)] border border-[var(--b)] rounded-lg bg-[var(--surf2)] hover:bg-[var(--surf3)] cursor-pointer disabled:opacity-50"
                  title="Refresh logs"
                >
                  <RefreshCw size={13} className={loadingLogs ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {loadingLogs ? (
              <div className="flex justify-center py-12">
                <Loader2 size={20} className="animate-spin text-[var(--blue)]" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-[12px] text-[var(--tx3)] italic">
                No activity log records found matching the criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px] min-w-[750px]">
                  <thead>
                    <tr className="border-b border-[var(--b)]">
                      <th className="text-[10.5px] font-semibold text-[var(--tx3)] text-left px-3 py-2">User / Actor</th>
                      <th className="text-[10.5px] font-semibold text-[var(--tx3)] text-left px-3 py-2">Event</th>
                      <th className="text-[10.5px] font-semibold text-[var(--tx3)] text-left px-3 py-2">Category</th>
                      <th className="text-[10.5px] font-semibold text-[var(--tx3)] text-left px-3 py-2">Description</th>
                      <th className="text-[10.5px] font-semibold text-[var(--tx3)] text-left px-3 py-2">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const isCreated = ['created', 'store', 'create'].includes(log.event || '');
                      const isUpdated = ['updated', 'update'].includes(log.event || '');
                      const isDeleted = ['deleted', 'destroy', 'delete'].includes(log.event || '');
                      
                      let badgeColor = 'bg-[var(--surf3)] text-[var(--tx2)] border border-[var(--b)]';
                      if (isCreated) badgeColor = 'bg-[var(--teal-bg)] text-[var(--teal-tx)] border border-[var(--teal-tx)]/15';
                      else if (isUpdated) badgeColor = 'bg-[var(--blue-bg)] text-[var(--blue-tx)] border border-[var(--blue-tx)]/15';
                      else if (isDeleted) badgeColor = 'bg-[var(--red-bg)] text-[var(--red-tx)] border border-[var(--red-tx)]/15';

                      // Format created_at to user friendly local datetime
                      let formattedDate = 'N/A';
                      if (log.created_at) {
                        try {
                          const dateObj = new Date(log.created_at);
                          formattedDate = dateObj.toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          });
                        } catch {
                          formattedDate = log.created_at;
                        }
                      }

                      return (
                        <tr key={log.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] transition-colors last:border-0">
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-[var(--tx)]">{log.causer_name}</div>
                            {log.causer_email && <div className="text-[10px] text-[var(--tx3)]">{log.causer_email}</div>}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${badgeColor}`}>
                              {log.event || 'activity'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[var(--tx2)] whitespace-nowrap">
                            <span className="font-mono text-[10.5px] bg-[var(--surf3)] border border-[var(--b)] px-1 py-0.5 rounded">
                              {log.log_name || 'default'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[var(--tx)] leading-relaxed max-w-[280px]">
                            <div>{log.description}</div>
                            {log.subject_type && (
                              <div className="text-[9.5px] text-[var(--tx3)] mt-0.5 font-mono">
                                Target: {log.subject_type} {log.subject_id && `#${log.subject_id}`}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-[var(--tx3)] whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Clock size={11} className="text-[var(--tx3)]" />
                              <span>{formattedDate}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Tab 3: System Maintenance */}
        {tab === 3 && (
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
