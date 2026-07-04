import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { useDialog } from '../context/DialogContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Database, Cloud, Save, Trash2, Settings2, RefreshCw, 
  AlertCircle, CheckCircle2, Download, CloudOff, Play
} from 'lucide-react';
import { config } from '../config';

interface BackupItem {
  file_name: string;
  file_size: string;
  last_modified: string;
  download_url?: string;
}

export function BackupManagement() {
  const { alert, confirm } = useDialog();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [localBackups, setLocalBackups] = useState<BackupItem[]>([]);
  const [gdriveBackups, setGdriveBackups] = useState<BackupItem[]>([]);
  const [diskUsage, setDiskUsage] = useState({ percentage: 0 });
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    auto_backup: false,
    backup_frequency: 'daily',
    backup_retention_days: 30,
    auto_cleanup: false,
    backup_notifications: false,
    notification_email: '',
    backup_gdrive_enabled: false,
    gdrive_client_id: '',
    gdrive_client_secret: '',
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [triggeringBackup, setTriggeringBackup] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

  useEffect(() => {
    // Check for OAuth callback status
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const message = params.get('message');
    
    if (status && message) {
      if (status === 'success') {
        alert(message);
      } else {
        alert(message, 'OAuth Error');
      }
      // Remove query params
      navigate(location.pathname, { replace: true });
    }

    loadData();
  }, [location.search, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getBackups();
      setLocalBackups(data.spatieBackups || []);
      setGdriveBackups(data.settingsBackups || []);
      
      if (data.backupConfig) {
        setSettings({
          auto_backup: !!data.backupConfig.auto_backup,
          backup_frequency: data.backupConfig.backup_frequency || 'daily',
          backup_retention_days: parseInt(data.backupConfig.backup_retention_days || '30'),
          auto_cleanup: !!data.backupConfig.auto_cleanup,
          backup_notifications: !!data.backupConfig.backup_notifications,
          notification_email: data.backupConfig.notification_email || '',
          backup_gdrive_enabled: !!data.backupConfig.backup_gdrive_enabled,
          gdrive_client_id: data.backupConfig.gdrive_client_id || '',
          gdrive_client_secret: data.backupConfig.gdrive_client_secret || '',
        });
        setDiskUsage(data.backupConfig.disk_usage || { percentage: 0 });
        setLastBackup(data.backupConfig.last_backup?.file_name || null);
      }
    } catch (err: any) {
      alert('Failed to load backup data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await api.updateBackupSettings(settings);
      alert(res.message || 'Settings updated successfully');
      loadData();
    } catch (err: any) {
      alert('Failed to update settings: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleManualBackup = async (type: string) => {
    if (!await confirm(`Are you sure you want to trigger a manual ${type} backup? This might take a few moments.`)) return;
    
    setTriggeringBackup(true);
    try {
      const res = await api.triggerManualBackup(type);
      alert(res.message || 'Backup started successfully');
      loadData();
    } catch (err: any) {
      alert('Failed to trigger backup: ' + err.message);
    } finally {
      setTriggeringBackup(false);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (!await confirm('Are you sure you want to delete this backup? This action cannot be undone.')) return;
    
    try {
      const res = await api.deleteBackup(id);
      alert(res.message || 'Backup deleted successfully');
      loadData();
    } catch (err: any) {
      alert('Failed to delete backup: ' + err.message);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthorizing(true);
    try {
      const res = await api.authorizeGoogleDrive();
      if (res.auth_url) {
        window.location.href = res.auth_url;
      } else {
        alert(res.message || 'Authorization failed');
      }
    } catch (err: any) {
      alert('Failed to initiate authorization: ' + err.message);
    } finally {
      setAuthorizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <RefreshCw className="animate-spin text-[var(--tx3)]" size={24} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg)] space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--blue-bg)] flex items-center justify-center text-[var(--blue-tx)]">
              <Database size={20} />
            </div>
            <div>
              <p className="text-[11px] text-[var(--tx3)]">Local Backups</p>
              <h4 className="text-[16px] font-bold text-[var(--tx)]">{localBackups.length} Files</h4>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--teal-bg)] flex items-center justify-center text-[var(--teal-tx)]">
              <Cloud size={20} />
            </div>
            <div>
              <p className="text-[11px] text-[var(--tx3)]">Google Drive Backups</p>
              <h4 className="text-[16px] font-bold text-[var(--tx)]">{gdriveBackups.length} Files</h4>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--purple-bg)] flex items-center justify-center text-[var(--purple-tx)]">
              <AlertCircle size={20} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[11px] text-[var(--tx3)]">Disk Usage</p>
                <p className="text-[11px] font-bold text-[var(--tx)]">{diskUsage.percentage.toFixed(1)}%</p>
              </div>
              <div className="h-1.5 w-full bg-[var(--surf2)] rounded-full overflow-hidden">
                <div 
                  className={`h-full ${diskUsage.percentage > 80 ? 'bg-[var(--red)]' : 'bg-[var(--purple)]'}`} 
                  style={{ width: `${Math.min(diskUsage.percentage, 100)}%` }} 
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Settings Panel */}
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--b)]">
            <Settings2 size={16} className="text-[var(--blue-tx)]" />
            <h3 className="font-bold text-[13px] text-[var(--tx)]">Backup Settings</h3>
          </div>
          
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-[var(--tx)]">Auto Backup</label>
              <input 
                type="checkbox" 
                checked={settings.auto_backup} 
                onChange={e => setSettings({...settings, auto_backup: e.target.checked})}
                className="rounded border-[var(--b)]"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[11px] text-[var(--tx3)] font-medium">Frequency</label>
              <select 
                value={settings.backup_frequency}
                onChange={e => setSettings({...settings, backup_frequency: e.target.value})}
                className="w-full h-8 text-[12px] rounded-lg border border-[var(--b)] bg-[var(--surf)] text-[var(--tx)] px-2"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[var(--tx3)] font-medium">Retention Days</label>
              <input 
                type="number"
                min="1"
                max="365"
                value={settings.backup_retention_days}
                onChange={e => setSettings({...settings, backup_retention_days: parseInt(e.target.value)})}
                className="w-full h-8 text-[12px] rounded-lg border border-[var(--b)] bg-[var(--surf)] text-[var(--tx)] px-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-[var(--tx)]">Auto Cleanup</label>
              <input 
                type="checkbox" 
                checked={settings.auto_cleanup} 
                onChange={e => setSettings({...settings, auto_cleanup: e.target.checked})}
                className="rounded border-[var(--b)]"
              />
            </div>

            <hr className="border-[var(--b)]" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-bold flex items-center gap-1.5 text-[var(--tx)]">
                  <Cloud size={14} className="text-[var(--teal-tx)]" /> Google Drive
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[var(--tx3)]">Client ID</label>
                <input 
                  type="text"
                  value={settings.gdrive_client_id}
                  onChange={e => setSettings({...settings, gdrive_client_id: e.target.value})}
                  className="w-full h-8 text-[11px] rounded-lg border border-[var(--b)] bg-[var(--surf)] text-[var(--tx)] px-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[var(--tx3)]">Client Secret</label>
                <input 
                  type="password"
                  value={settings.gdrive_client_secret}
                  onChange={e => setSettings({...settings, gdrive_client_secret: e.target.value})}
                  className="w-full h-8 text-[11px] rounded-lg border border-[var(--b)] bg-[var(--surf)] text-[var(--tx)] px-2"
                />
              </div>
              
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={authorizing || !settings.gdrive_client_id}
                className="w-full h-8 mt-2 bg-[var(--teal-bg)] hover:bg-[var(--teal)] hover:text-white text-[var(--teal-tx)] rounded-lg text-[12px] font-medium transition-colors flex items-center justify-center gap-2"
              >
                {authorizing ? <RefreshCw size={14} className="animate-spin" /> : <Cloud size={14} />}
                Authorize Google Drive
              </button>
            </div>

            <div className="pt-4 mt-4 border-t border-[var(--b)]">
              <button 
                type="submit" 
                disabled={savingSettings}
                className="w-full h-9 bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2"
              >
                {savingSettings ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                Save Settings
              </button>
            </div>
          </form>
        </Card>

        {/* Backups List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[13px] text-[var(--tx)]">Local Backups</h3>
                <p className="text-[11px] text-[var(--tx3)]">Backups stored on the server.</p>
              </div>
              <button
                onClick={() => handleManualBackup('code')}
                disabled={triggeringBackup}
                className="h-8 px-3 bg-[var(--surf2)] hover:bg-[var(--blue-bg)] text-[var(--blue-tx)] rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5"
              >
                {triggeringBackup ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                Code Backup
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--b)]">
                    <th className="pb-2 text-[11px] font-medium text-[var(--tx3)]">File Name</th>
                    <th className="pb-2 text-[11px] font-medium text-[var(--tx3)]">Size</th>
                    <th className="pb-2 text-[11px] font-medium text-[var(--tx3)]">Date</th>
                    <th className="pb-2 text-[11px] font-medium text-[var(--tx3)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] text-[var(--tx)]">
                  {localBackups.length > 0 ? localBackups.map((bkp, i) => (
                    <tr key={i} className="border-b border-[var(--b2)] last:border-0 hover:bg-[var(--surf)]">
                      <td className="py-2.5 max-w-[200px] truncate">{bkp.file_name}</td>
                      <td className="py-2.5 text-[var(--tx2)]">{bkp.file_size}</td>
                      <td className="py-2.5 text-[var(--tx2)]">{bkp.last_modified}</td>
                      <td className="py-2.5 text-right space-x-2">
                        {bkp.download_url && (
                          <a 
                            href={`${config.apiUrl.replace('/api/v1', '')}${bkp.download_url}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--blue-bg)] text-[var(--blue-tx)] hover:bg-[var(--blue)] hover:text-white transition-colors"
                          >
                            <Download size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteBackup(bkp.file_name)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--red-bg)] text-[var(--red-tx)] hover:bg-[var(--red)] hover:text-white transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[12px] text-[var(--tx3)]">No local backups found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[13px] text-[var(--tx)] flex items-center gap-1.5">
                  <Cloud size={14} className="text-[var(--teal-tx)]" /> Google Drive Backups
                </h3>
                <p className="text-[11px] text-[var(--tx3)]">Database settings backups sent to Drive.</p>
              </div>
              <button
                onClick={() => handleManualBackup('settings')}
                disabled={triggeringBackup}
                className="h-8 px-3 bg-[var(--surf2)] hover:bg-[var(--teal-bg)] text-[var(--teal-tx)] rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5"
              >
                {triggeringBackup ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                Settings Backup
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--b)]">
                    <th className="pb-2 text-[11px] font-medium text-[var(--tx3)]">File Name</th>
                    <th className="pb-2 text-[11px] font-medium text-[var(--tx3)]">Size</th>
                    <th className="pb-2 text-[11px] font-medium text-[var(--tx3)]">Date</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] text-[var(--tx)]">
                  {gdriveBackups.length > 0 ? gdriveBackups.map((bkp, i) => (
                    <tr key={i} className="border-b border-[var(--b2)] last:border-0 hover:bg-[var(--surf)]">
                      <td className="py-2.5 max-w-[200px] truncate">{bkp.file_name}</td>
                      <td className="py-2.5 text-[var(--tx2)]">{bkp.file_size}</td>
                      <td className="py-2.5 text-[var(--tx2)]">{bkp.last_modified}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-[12px] flex items-center justify-center gap-2 text-[var(--tx3)]">
                        <CloudOff size={16} /> No Google Drive backups found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
