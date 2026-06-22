import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, Calendar, Search, RefreshCw, Clock, Loader2, X, AlertCircle 
} from 'lucide-react';

export function TeacherActivityLogs() {
  const { user } = useAuth();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Fetch logs
  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { limit: '1000' };
      if (selectedDate) {
        params.date = selectedDate;
      }
      
      const data = await api.getResources('activity-logs', params);
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch (err: any) {
      console.error('Error fetching teacher activity logs:', err);
      setError(err.message || 'Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedDate]);

  // Format helper functions
  const formatLogTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatLogDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const getEventBadge = (event: string) => {
    const ev = (event || '').toLowerCase();
    if (['created', 'store', 'create', 'posted', 'submitted'].some(x => ev.includes(x))) {
      return <Badge variant="teal">Create</Badge>;
    }
    if (['updated', 'update', 'modified', 'changed'].some(x => ev.includes(x))) {
      return <Badge variant="amber">Update</Badge>;
    }
    if (['deleted', 'destroy', 'delete', 'cancelled', 'removed'].some(x => ev.includes(x))) {
      return <Badge variant="red">Delete</Badge>;
    }
    return <Badge variant="gray">{event || 'Activity'}</Badge>;
  };

  // Filter logs by search query locally
  const filteredLogs = logs.filter(log => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      String(log.description || '').toLowerCase().includes(query) ||
      String(log.event || '').toLowerCase().includes(query) ||
      String(log.subject_type || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg)]">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[var(--blue)] to-[#1a7bc4] rounded-2xl p-4 mb-4 text-white relative overflow-hidden">
        <div className="absolute right-4 top-4 opacity-10">
          <Activity size={64} />
        </div>
        <div className="relative z-10">
          <div className="text-[11px] font-medium opacity-70 uppercase tracking-wider mb-1">Teacher Portal</div>
          <div className="text-[18px] font-bold mb-1">My Activity Logs</div>
          <div className="text-[12px] opacity-80">Track the actions and operations you have performed up to the present date.</div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Filters Panel */}
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              {/* Keyword Search */}
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--tx3)]" />
                <input
                  type="text"
                  placeholder="Search my logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg pl-8 pr-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                />
              </div>

              {/* Date Filter */}
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1 sm:w-48">
                  <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--tx3)]" />
                  <input
                    type="date"
                    value={selectedDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg pl-8 pr-8 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] cursor-pointer"
                  />
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--tx3)] hover:text-[var(--tx)] cursor-pointer"
                      title="Clear date filter"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end items-center gap-2">
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 bg-[var(--surf2)] hover:bg-[var(--surf3)] text-[var(--tx)] border border-[var(--b)] rounded-lg text-[11.5px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                title="Refresh logs"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Error Notice */}
        {error && (
          <div className="p-3 bg-[var(--red-bg)] border border-[var(--red-tx)]/15 text-[var(--red-tx)] rounded-xl text-[12px] flex items-center gap-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Timeline Logs Card */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[12.5px] font-bold text-[var(--tx)] flex items-center gap-1.5">
              <Clock size={13} className="text-[var(--blue-tx)]" /> Timeline Actions
            </span>
            <span className="px-2.5 py-0.5 bg-[var(--blue-bg)] text-[var(--blue-tx)] text-[10px] font-bold rounded-full">
              {filteredLogs.length} events
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin text-[var(--blue)]" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-[var(--tx3)] space-y-2">
              <div className="w-12 h-12 rounded-full bg-[var(--surf2)] flex items-center justify-center mx-auto text-[var(--tx3)]">
                <Activity size={20} />
              </div>
              <p className="text-[12px] italic">No activity logs found matching the filters.</p>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-[11.5px] font-semibold text-[var(--blue)] hover:underline mt-1"
                >
                  Clear date filter
                </button>
              )}
            </div>
          ) : (
            <div className="relative pl-4 border-l border-[var(--b)] ml-2.5 space-y-5 my-2">
              {filteredLogs.map((log) => {
                return (
                  <div key={log.id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[20.5px] top-1.5 w-3 h-3 rounded-full bg-[var(--surf)] border-2 border-[var(--blue)] flex-shrink-0" />
                    
                    {/* Log Details */}
                    <div className="p-3 bg-[var(--surf2)]/50 border border-[var(--b)] rounded-xl hover:bg-[var(--surf2)] transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        {/* Event text & type */}
                        <div className="flex items-start gap-2 flex-1">
                          <span className="mt-0.5">{getEventBadge(log.event || 'Activity')}</span>
                          <div className="space-y-0.5">
                            <p className="text-[12.5px] font-semibold text-[var(--tx)] leading-snug">
                              {log.description || 'Performed an operation'}
                            </p>
                            {log.subject_type && (
                              <p className="text-[10px] text-[var(--tx3)] font-mono uppercase tracking-wider">
                                Resource: {log.subject_type} {log.subject_id ? `#${log.subject_id}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Time & Date */}
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-1.5 sm:gap-0.5 text-[11px] text-[var(--tx3)] mt-1 sm:mt-0 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {formatLogTime(log.created_at)}
                          </span>
                          <span className="hidden sm:inline">
                            {formatLogDate(log.created_at)}
                          </span>
                          <span className="sm:hidden text-[10px] opacity-70">
                            · {formatLogDate(log.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
