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
  
  // Cache GET requests
  if (method === 'GET') {
    const cached = cache.get(path);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'API request failed');
  }

  const result = await response.json();

  if (method === 'GET') {
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

  logout() {
    localStorage.removeItem('token');
    clearApiCache(); // Clear cache on logout
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

  async getBatchStudentPercentages(batchId: string) {
    return request(`/attendance/batch/${batchId}/student-percentages`);
  },

  async getStudentAttendanceForDate(studentId: string, date: string) {
    return request(`/attendance/student/${studentId}?date=${date}`);
  },

  async getTodayAttendance(type: string = 'all') {
    return request(`/attendance/today?type=${type}`);
  },
};
