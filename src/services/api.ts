const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 600000; // 10 minutes cache TTL, relying primarily on mutation-based invalidation

export function clearApiCache(resource?: string) {
  if (!resource) {
    cache.clear();
    return;
  }
  const prefix = `/resources/${resource}`;
  for (const key of cache.keys()) {
    if (key === prefix || key.startsWith(prefix + '?') || key.startsWith(prefix + '/')) {
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

async function request(path: string, options: RequestInit = {}) {
  const method = options.method || 'GET';
  
  // Cache GET requests (excluding real-time/dynamic resources like settings, attendance, and activity logs)
  const bypassCache = path.includes('/settings') || 
                       path.includes('/attendance') || 
                       path.includes('/substitutes') ||
                       path.includes('/substitute-assignments') ||
                       path.includes('/activity-logs');

  if (method === 'GET' && !bypassCache) {
    const cached = cache.get(path);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const token = localStorage.getItem('token');
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
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'API request failed');
  }

  const result = await response.json();

  if (method === 'GET' && !bypassCache) {
    cache.set(path, { data: result, timestamp: Date.now() });
  }

  return result;
}

export const api = {
  async getMe() {
    return request('/me');
  },

  async login(credentials: any) {
    const res = await request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.token) {
      localStorage.setItem('token', res.token);
      clearApiCache(); // Clear any stale cached data on fresh login
    }
    return res;
  },

  async logout() {
    try {
      const token = localStorage.getItem('token');
      if (token && token !== 'demo-token') {
        await request('/logout', { method: 'POST' });
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.removeItem('token');
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

  async createResource(resource: string, data: any) {
    clearApiCache(resource);
    return request(`/resources/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async bulkCreateResource(resource: string, records: any[]) {
    clearApiCache(resource);
    return request(`/resources/${resource}/bulk`, {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  },

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
      const batch = batches.find((b: any) => String(b.id) === String(batchId));
      return batch ? batch.name : batchId;
    } catch {
      return batchId;
    }
  },

  async getBatchStudentPercentages(batchId: string) {
    // Proactively pull the latest database setting to keep in sync with teacher updates
    try {
      const settingsRes = await request('/resources/settings?key=kts_student_attendance_records');
      if (Array.isArray(settingsRes) && settingsRes.length > 0 && settingsRes[0].value) {
        localStorage.setItem('kts_student_attendance_records', settingsRes[0].value);
      }
    } catch (err) {
      console.error('Failed to sync kts_student_attendance_records setting:', err);
    }
    const original = await request(`/attendance/batch/${batchId}/student-percentages`);
    try {
      const batchName = await this.getBatchName(batchId);
      const localRecords = localStorage.getItem('kts_student_attendance_records');
      if (localRecords) {
        const records = JSON.parse(localRecords) as any[];
        // Filter records for this class
        const classRecords = records.filter(r => r.className.toLowerCase() === batchName.toLowerCase());
        
        if (original && original.success && original.data && Array.isArray(original.data.students)) {
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
      const localRecords = localStorage.getItem('kts_student_attendance_records');
      if (localRecords) {
        const records = JSON.parse(localRecords) as any[];
        const studentRecords = records.filter(
          r => String(r.studentId) === String(studentId) && r.date === date
        );

        if (studentRecords.length > 0 && original && original.success && original.data) {
          const list = original.data.attendances || [];
          
          studentRecords.forEach((record: any) => {
            const isFirst = record.session === 'first_period';
            const idKey = `custom-${record.session}-${date}`;
            
            // Check if already in the list to avoid duplicate rendering
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
          list.sort((a: any, b: any) => (a.check_in_time || '').localeCompare(b.check_in_time || ''));

          // Recalculate statistics for this date
          const total = list.length;
          const present = list.filter((a: any) => ['present', 'late'].includes(a.status)).length;
          const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

          original.data.attendances = list;
          original.data.statistics = {
            ...original.data.statistics,
            total,
            present,
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
    // Proactively pull the latest database setting to keep in sync with teacher updates
    try {
      const settingsRes = await request('/resources/settings?key=kts_student_attendance_records');
      if (Array.isArray(settingsRes) && settingsRes.length > 0 && settingsRes[0].value) {
        localStorage.setItem('kts_student_attendance_records', settingsRes[0].value);
      }
    } catch (err) {
      console.error('Failed to sync kts_student_attendance_records setting today:', err);
    }
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
      const localRecords = localStorage.getItem('kts_student_attendance_records');
      if (localRecords && original && original.success && original.data) {
        const records = JSON.parse(localRecords) as any[];
        const todayRecords = records.filter(r => r.date === today);

        if (todayRecords.length > 0) {
          const list = original.data.attendances || [];
          
          // Pre-fetch batches to map className to batchId dynamically
          const batches = await request('/resources/batches?limit=1000').catch(() => []);
          const batchMap: Record<string, number> = {};
          if (Array.isArray(batches)) {
            batches.forEach((b: any) => {
              batchMap[String(b.name).toLowerCase()] = Number(b.id);
            });
          }
          
          // Map each local record to the today list format
          todayRecords.forEach((record: any) => {
            const isFirst = record.session === 'first_period';
            const idKey = `today-custom-${record.studentId}-${record.session}`;
            const resolvedBatchId = batchMap[String(record.className).toLowerCase()] || 1;
            
            // Check if already in today list
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
};

// Preserve original localStorage methods bound to the localStorage instance
// @ts-ignore
export const originalSetItem = localStorage.setItem.bind(localStorage);
// @ts-ignore
export const originalRemoveItem = localStorage.removeItem.bind(localStorage);

// Monkey-patch localStorage.setItem to automatically sync with database settings
// @ts-ignore
localStorage.setItem = function (key: string, value: string) {
  originalSetItem(key, value);
  
  const keysToExclude = ['token', 'user', 'selected_academic_year_id', 'timetable_period_timings', 'kts_student_attendance_records'];
  
  const token = localStorage.getItem('token');
  if (token && !keysToExclude.includes(key)) {
    api.saveSetting(key, value).catch((err) => {
      console.error(`Failed to automatically sync key "${key}" to database:`, err);
    });
  }
};

// Monkey-patch localStorage.removeItem to automatically delete from database settings
// @ts-ignore
localStorage.removeItem = function (key: string) {
  originalRemoveItem(key);
  
  const token = localStorage.getItem('token');
  if (token && key !== 'token' && key !== 'user') {
    api.deleteSetting(key).catch((err) => {
      console.error(`Failed to automatically delete key "${key}" from database settings:`, err);
    });
  }
};

