const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function request(path: string, options: RequestInit = {}) {
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

  return response.json();
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
    }
    return res;
  },

  logout() {
    localStorage.removeItem('token');
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
    return request(`/resources/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async bulkCreateResource(resource: string, records: any[]) {
    return request(`/resources/${resource}/bulk`, {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  },

  async updateResource(resource: string, id: string, data: any) {
    return request(`/resources/${resource}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteResource(resource: string, id: string) {
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
