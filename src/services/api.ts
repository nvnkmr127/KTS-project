import { config } from '../config';
import { storage } from '../utils/storage';

const BASE_URL = config.apiUrl;

// ponytail: plain Map with insertion-order eviction, not true LRU — entries
// expire on TTL anyway; bring back recency tracking if the 100-entry cap thrashes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_CAPACITY = 100;
const CACHE_TTL = 300000; // 5 minutes cache TTL, allowing data to update without browser refresh

export function clearApiCache(resource?: string) {
  if (!resource) {
    cache.clear();
    return;
  }
  const prefix1 = `/resources/${resource}`;
  const prefix2 = `/${resource}`;
  for (const key of cache.keys()) {
    if (
      key === prefix1 || key.startsWith(prefix1 + '?') || key.startsWith(prefix1 + '/') ||
      key === prefix2 || key.startsWith(prefix2 + '?') || key.startsWith(prefix2 + '/')
    ) {
      cache.delete(key);
    }
  }
  if (resource === 'student-fees') {
    const studentPrefix = '/resources/students';
    for (const key of cache.keys()) {
      if (key === studentPrefix || key.startsWith(studentPrefix + '?') || key.startsWith(studentPrefix + '/')) {
        cache.delete(key);
      }
    }
  }
  if (resource === 'students') {
    const feePrefix = '/resources/student-fees';
    for (const key of cache.keys()) {
      if (key === feePrefix || key.startsWith(feePrefix + '?') || key.startsWith(feePrefix + '/')) {
        cache.delete(key);
      }
    }
  }
  if (resource === 'students' || resource === 'batches' || resource === 'leaves') {
    for (const key of cache.keys()) {
      if (key.startsWith('/attendance')) {
        cache.delete(key);
      }
    }
  }
}

// Custom error class carrying the HTTP status code so callers can distinguish
// 401/403 auth errors from generic network/server errors.
export class ApiError extends Error {
  status: number;
  isAuthError: boolean;
  isNetworkError: boolean;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isAuthError = status === 401 || status === 403;
    this.isNetworkError = status === 0;
  }
}



const activeRequests = new Map<string, Promise<any>>();

async function request(path: string, options: RequestInit & { silent?: boolean; timeoutMs?: number } = {}) {
  const { silent = false, timeoutMs = 15000, ...fetchOptions } = options;
  const method = fetchOptions.method || 'GET';

  // Cache GET requests (excluding real-time/dynamic resources like settings, attendance, and activity logs)
  const bypassCache = path.includes('/bus/') ||
    path.includes('/realtime') ||
    path.includes('/live-feed') ||
    path.includes('/biometric') ||
    path.includes('biometric-logs') ||
    path.includes('/attendance') ||
    path.includes('/settings') ||
    path.includes('/timetable') ||
    path.includes('/leaves') ||
    path.includes('/notifications') ||
    path.includes('/activity-logs');

  if (method === 'GET' && !bypassCache) {
    const cached = cache.get(path);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    const inFlight = activeRequests.get(path);
    if (inFlight) {
      return inFlight;
    }
  }

  const performRequest = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const token = storage.getItem<string>('token');
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };

      const response = await fetch(`${BASE_URL}${path}`, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401 && !silent) {
          // Clear auth state without a hard redirect — let React's own render logic
          // (`if (!user) return <Login />;` in App.tsx) handle showing the login screen.
          // A hard `window.location.href = '/login'` redirect would cause a full-page
          // reload and could hit the Laravel backend's /login route on production servers.
          storage.removeItem('token');
          storage.removeItem('user');
          // Dispatch a custom event so AuthContext can listen and clear user state
          // within the same tab (window.storage events only fire cross-tab).
          window.dispatchEvent(new Event('kts:unauthorized'));
        }
        const errorData = await response.json().catch(() => ({}));
        // Throw ApiError (with status code) instead of plain Error so callers can
        // distinguish 401/403 auth errors from transient network/server errors.
        throw new ApiError(errorData.error || errorData.message || 'API request failed', response.status);
      }

      const result = await response.json();

      if (method === 'GET' && !bypassCache) {
        if (!cache.has(path) && cache.size >= CACHE_CAPACITY) {
          cache.delete(cache.keys().next().value!);
        }
        cache.set(path, { data: result, timestamp: Date.now() });
      }

      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err instanceof ApiError) {
        throw err;
      }
      if (err.name === 'AbortError') {
        throw new ApiError('Server connection timed out (ERR_CONNECTION_TIMED_OUT). Please check your backend server status or network connection.', 0);
      }
      if (err instanceof TypeError || err.message?.includes('Failed to fetch')) {
        throw new ApiError('Unable to connect to the backend server (ERR_CONNECTION_TIMED_OUT). Please verify backend server status.', 0);
      }
      throw err;
    } finally {
      if (method === 'GET' && !bypassCache) {
        activeRequests.delete(path);
      }
    }
  };

  if (method === 'GET' && !bypassCache) {
    const promise = performRequest();
    activeRequests.set(path, promise);
    return promise;
  }

  return performRequest();
}


// Proactively pull the latest attendance-records setting from the DB into
// localStorage so admin views stay in sync with teacher updates.
async function syncLocalAttendanceRecords() {
  try {
    const settingsRes = await request('/resources/settings?key=kts_student_attendance_records');
    if (Array.isArray(settingsRes) && settingsRes.length > 0 && settingsRes[0].value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (localStorage as any).originalSetItem('kts_student_attendance_records', settingsRes[0].value);
    }
  } catch (err) {
    console.error('Failed to sync kts_student_attendance_records setting:', err);
  }
}

export const api = {
  request,

  async markAllNotificationsRead() {
    const token = storage.getItem<string>('token');
    try {
      return await request('/notifications/mark-all-read', { method: 'POST', silent: true });
    } catch {
      return fetch(`${BASE_URL.replace(/\/v1$/, '')}/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    }
  },

  async getMe() {
    return request('/me');

  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async login(credentials: any) {
    const res = await request('/login', {
      method: 'POST',

      body: JSON.stringify(credentials),
    });
    if (res.token) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      storage.setItem('token', res.token as any as any);
      clearApiCache(); // Clear any stale cached data on fresh login
    }
    return res;
  },

  async logout() {
    try {
      const token = storage.getItem<string>('token');
      if (token && token !== 'demo-token') {
        await request('/logout', { method: 'POST' });
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      storage.removeItem('token');
      clearApiCache(); // Clear cache on logout
    }
  },

  async getResources(resource: string, params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    const path = `/resources/${resource}${query ? `?${query}` : ''}`;
    return request(path);
  },


  async getResource(resource: string, id: string) {
    return request(`/resources/${resource}/${id}`);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createResource(resource: string, data: any) {
    clearApiCache(resource);
    return request(`/resources/${resource}`, {

      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async bulkCreateResource(resource: string, records: any[]) {
    clearApiCache(resource);

    return request(`/resources/${resource}/bulk`, {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateResource(resource: string, id: string, data: any) {
    clearApiCache(resource);
    return request(`/resources/${resource}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteResource(resource: string, id: string) {
    clearApiCache(resource);
    return request(`/resources/${resource}/${id}`, {

      method: 'DELETE',
    });
  },

  async getBatchName(batchId: string): Promise<string> {
    try {
      const batches = await this.getResources('batches');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const batch = batches.find((b: any) => String(b.id) === String(batchId));
      return batch ? batch.name : batchId;
    } catch {
      return batchId;

    }
  },

  async getBatchStudentPercentages(batchId: string) {
    await syncLocalAttendanceRecords();
    const original = await request(`/attendance/batch/${batchId}/student-percentages`);

    try {
      const batchName = await this.getBatchName(batchId);
      const localRecords = storage.getItem('kts_student_attendance_records');
      if (localRecords) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const records = localRecords as any[];
        // Filter records for this class
        const classRecords = records.filter(r => r.className.toLowerCase() === batchName.toLowerCase());

        if (original && original.success && original.data && Array.isArray(original.data.students)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          original.data.students = original.data.students.map((student: any) => {
            const studentRecords = classRecords.filter(r => String(r.studentId) === String(student.id));

            // Group records by date to compute full day (2 periods present), half day (1 present), or absent (0 present)
            const dates = Array.from(new Set(studentRecords.map(r => r.date)));
            let customTotal = 0;
            let customPresent = 0;

            dates.forEach(d => {
              const firstRecord = studentRecords.find(r => r.date === d && r.session === 'first_period');
              const lunchRecord = studentRecords.find(r => r.date === d && r.session === 'lunch_period');

              if (firstRecord || lunchRecord) {
                customTotal += 2; // Two sessions per day
                if (firstRecord && firstRecord.status === 'present') customPresent += 1;
                if (lunchRecord && lunchRecord.status === 'present') customPresent += 1;
              }
            });

            const updatedTotal = (student.total_classes || 0) + customTotal;
            const updatedPresent = (student.present_classes || 0) + customPresent;
            const updatedPercentage = updatedTotal > 0 ? Math.round((updatedPresent / updatedTotal) * 100) : 0;

            return {
              ...student,
              total_classes: updatedTotal,
              present_classes: updatedPresent,
              percentage: updatedPercentage,
            };
          });
        }
      }

    } catch (e) {
      console.error('Error merging local percentages:', e);
    }
    return original;
  },

  async getStudentAttendanceForDate(studentId: string, date: string) {
    const original = await request(`/attendance/student/${studentId}?date=${date}`);

    try {
      const localRecords = storage.getItem('kts_student_attendance_records');
      if (localRecords) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const records = localRecords as any[];

        const studentRecords = records.filter(
          r => String(r.studentId) === String(studentId) && r.date === date
        );

        if (studentRecords.length > 0 && original && original.success && original.data) {
          const list = original.data.attendances || [];

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          studentRecords.forEach((record: any) => {
            const isFirst = record.session === 'first_period';
            const idKey = `custom-${record.session}-${date}`;

            // Check if already in the list to avoid duplicate rendering
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!list.some((a: any) => String(a.id) === idKey)) {
              list.push({
                id: idKey,
                status: record.status,
                attendance_date: date,
                check_in_time: isFirst ? '08:00:00' : '14:00:00',
                subject: {
                  name: isFirst ? 'Morning Attendance (1st Period)' : 'Afternoon Attendance (After Lunch)',

                },
                time_slot: {
                  name: isFirst ? 'Period 1' : 'Period 6',
                  start_time: isFirst ? '08:00 AM' : '02:00 PM',

                  end_time: isFirst ? '09:00 AM' : '03:00 PM',
                },
                faculty: {
                  name: record.markedBy || 'Assigned Teacher',
                },
              });
            }
          });


          // Sort by check-in time
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          list.sort((a: any, b: any) => (a.check_in_time || '').localeCompare(b.check_in_time || ''));

          // Recalculate statistics for this date
          const total = list.length;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const present = list.filter((a: any) => ['present', 'late'].includes(a.status)).length;
          const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

          original.data.attendances = list;
          original.data.statistics = {
            ...original.data.statistics,
            total,
            present,

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            absent: list.filter((a: any) => a.status === 'absent').length,
            percentage,
          };
        }
      }
    } catch (e) {
      console.error('Error merging local student attendance:', e);
    }
    return original;
  },

  async getTodayAttendance(type: string = 'all') {
    await syncLocalAttendanceRecords();
    const original = await request(`/attendance/today?type=${type}`);
    try {
      const getLocalDateString = () => {
        const d = new Date();

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const today = getLocalDateString();

      const localRecords = storage.getItem('kts_student_attendance_records');
      if (localRecords && original && original.success && original.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const records = localRecords as any[];
        const todayRecords = records.filter(r => r.date === today);


        if (todayRecords.length > 0) {
          const list = original.data.attendances || [];

          // Pre-fetch batches to map className to batchId dynamically
          const batches = await request('/resources/batches?limit=1000').catch(() => []);
          const batchMap: Record<string, number> = {};
          if (Array.isArray(batches)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            batches.forEach((b: any) => {
              batchMap[String(b.name).toLowerCase()] = Number(b.id);
            });
          }

          // Map each local record to the today list format
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          todayRecords.forEach((record: any) => {
            const isFirst = record.session === 'first_period';
            const idKey = `today-custom-${record.studentId}-${record.session}`;
            const resolvedBatchId = batchMap[String(record.className).toLowerCase()] || 1;

            // Check if already in today list
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!list.some((a: any) => String(a.id) === idKey || (String(a.student_id) === String(record.studentId) && String(a.time_slot_id) === (isFirst ? '1' : '6')))) {
              // Find student details from record to populate batch_id
              list.push({
                id: idKey,
                student_id: Number(record.studentId),
                status: record.status,
                attendance_date: today,
                check_in_time: isFirst ? '08:00:00' : '14:00:00',
                batch_id: resolvedBatchId,

                student: {
                  id: Number(record.studentId),
                  name: record.studentName,
                  enrollment_number: record.roll,
                },
              });
            }
          });

          original.data.attendances = list;
          original.data.count = list.length;
        }
      }
    } catch (e) {
      console.error('Error merging local today attendance:', e);
    }
    return original;
  },

  async saveSetting(key: string, value: string) {
    try {
      const settings = await request('/resources/settings');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = Array.isArray(settings) ? settings.find((s: any) => s.key === key) : null;
      if (existing) {
        return await request(`/resources/settings/${existing.id}`, {
          method: 'PUT',

          body: JSON.stringify({ key, value }),
        });
      } else {
        return await request('/resources/settings', {
          method: 'POST',
          body: JSON.stringify({
            key,
            value,
            group: 'general',
            type: 'json',
            is_public: false,
            is_encrypted: false,
          }),
        });
      }
    } catch (err) {
      console.error(`Error saving setting ${key} to DB:`, err);
    }
  },

  async deleteSetting(key: string) {
    try {
      const settings = await request('/resources/settings');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = Array.isArray(settings) ? settings.find((s: any) => s.key === key) : null;
      if (existing) {
        return await request(`/resources/settings/${existing.id}`, {
          method: 'DELETE',
        });
      }
    } catch (err) {
      console.error(`Error deleting setting ${key} from DB:`, err);
    }
  },

  async getSubstituteStaff() {
    return request('/substitutes/staff');
  },

  async getSubstituteSchedule(absentUserId: string, date: string) {
    return request(`/substitutes/schedule?absent_user_id=${absentUserId}&date=${date}`);
  },

  async getAvailableSubstitutes(timeSlotId: number | string, date: string, excludeUserId: string) {
    return request(`/substitutes/available?time_slot_id=${timeSlotId}&date=${date}&exclude_user_id=${excludeUserId}`);
  },

  async assignSubstitute(data: { timetable_id: number | string; absent_user_id: string; substitute_user_id: string; date: string; notes?: string }) {
    return request('/substitutes/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async seedMockData() {
    return request('/dev/seed-mock-data', {
      method: 'POST',
    });
  },

  async clearMockData() {
    return request('/dev/clear-mock-data', {
      method: 'POST',
    });
  },

  async getWebhookStats(date?: string) {
    return request(`/webhooks/stats${date ? `?date=${date}` : ''}`);
  },

  async getWebhookEvents() {
    return request('/webhooks/events');
  },

  async toggleWebhook(id: string | number) {
    return request(`/webhooks/${id}/toggle`, {
      method: 'POST',
    });
  },

  async testWebhook(id: string | number) {
    return request(`/webhooks/${id}/test`, {
      method: 'POST',
    });
  },

  async regenerateWebhookSecret(id: string | number) {
    return request(`/webhooks/${id}/regenerate-secret`, {
      method: 'POST',
    });
  },

  async getWebhookCalls(id: string | number, status?: string) {
    return request(`/webhooks/${id}/calls${status ? `?status=${status}` : ''}`);
  },

  async testDailySummary(date?: string) {
    return request(`/webhooks/test-daily-summary`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  },

  async sendDailySummary(date?: string) {
    return request(`/webhooks/send-daily-summary`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  },

  async replayWebhookCall(callId: string | number) {
    return request(`/webhooks/calls/${callId}/replay`, {
      method: 'POST',
    });
  },

  // ── Activity Logs ────────────────────────────────────────────────────

  async getActivityLogs(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/activity-logs${query ? `?${query}` : ''}`);
  },

  async getMyActivityStats() {
    return request('/activity-logs/my-stats');
  },

  async getActivityUsers() {
    return request('/activity-logs/users');

  },

  async getActivitySummary() {
    return request('/activity-logs/summary');

  },

  async clearActivityLogs() {
    return request('/activity-logs/clear', { method: 'POST' });
  },

  async restoreActivityLog(id: string | number) {
    return request(`/activity-logs/${id}/restore`, { method: 'POST' });
  },

  async deleteActivityLog(id: string | number) {
    return request(`/activity-logs/${id}`, { method: 'DELETE' });
  },

  // ── Biometric e-TimeOffice Integration ────────────────────────────────
  async biometricStatus() {
    return request('/biometric/status');
  },

  async biometricTestConnection(credentials?: { corporate_id?: string; username?: string; password?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = credentials ? new URLSearchParams(credentials as any).toString() : '';
    return request(params ? `/biometric/test-connection?${params}` : '/biometric/test-connection');
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async biometricSaveCredentials(credentials: any) {
    return request('/biometric/credentials', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  async biometricSyncInOut(fromDate: string, toDate: string, empcode = 'ALL') {
    return request(`/biometric/sync/in-out?from_date=${fromDate}&to_date=${toDate}&empcode=${empcode}`);
  },

  async biometricSyncPunch(fromDate: string, toDate: string, empcode = 'ALL') {
    return request(`/biometric/sync/punch?from_date=${fromDate}&to_date=${toDate}&empcode=${empcode}`);
  },

  async biometricSyncIncremental(empcode = 'ALL', reset = false) {
    return request(`/biometric/sync/incremental?empcode=${empcode}&reset=${reset ? '1' : '0'}`);
  },

  async biometricResetCursor() {
    return request('/biometric/reset-cursor', {
      method: 'POST'
    });
  },

  // --- Force Logout ---
  async forceLogoutUser(id: string | number) {
    clearApiCache('users');
    clearApiCache('faculty');
    return request(`/users/${id}/force-logout`, {
      method: 'POST',
    });
  },

  // --- Roles & Permissions ---
  async getRoles() {
    return request('/roles');
  },

  async createRole(data: { name: string; permissions?: string[] }) {
    clearApiCache('roles');
    return request('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRole(id: string | number, data: { name: string; permissions?: string[] }) {
    clearApiCache('roles');
    return request(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteRole(id: string | number) {
    clearApiCache('roles');
    return request(`/roles/${id}`, {
      method: 'DELETE',
    });
  },

  async syncRolePermissions(id: string | number, permissions: string[]) {
    clearApiCache('roles');
    return request(`/roles/${id}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissions }),
    });
  },

  async getPermissions() {
    return request('/permissions');
  },

  // --- Backup & System Health ---
  async getBackups() {
    return request('/backups');
  },

  async updateBackupSettings(data: any) {
    clearApiCache('backups');
    return request('/backups/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async triggerManualBackup(type: string = 'code') {
    clearApiCache('backups');
    return request('/backups/manual', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  },

  async deleteBackup(id: string) {
    clearApiCache('backups');
    return request(`/backups/${id}`, {
      method: 'DELETE',
    });
  },

  async restoreDatabaseBackup(filename: string) {
    clearApiCache('backups');
    return request('/backups/restore/database', {
      method: 'POST',
      body: JSON.stringify({ filename }),
    });
  },

  async downloadBackup(downloadUrl: string) {
    const token = storage.getItem<string>('token');
    const response = await fetch(`${config.apiUrl.replace('/api/v1', '')}${downloadUrl}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadUrl.split('/').pop() || 'backup.sql';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async authorizeGoogleDrive() {
    return request('/backups/gdrive/authorize', {
      method: 'POST'
    });
  }
};
