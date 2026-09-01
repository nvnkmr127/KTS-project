import { Platform } from 'react-native';

// Standard API endpoints for local & production backend
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api';
let customApiBaseUrl: string | null = null;

export const setApiBaseUrl = (url: string) => {
  customApiBaseUrl = url.replace(/\/$/, '');
};

export const getApiBaseUrl = (): string => {
  return customApiBaseUrl || DEFAULT_HOST;
};

class ApiClient {
  private authToken: string | null = null;

  setToken(token: string | null) {
    this.authToken = token;
  }

  getToken(): string | null {
    return this.authToken;
  }

  private async request(path: string, options: RequestInit = {}) {
    const baseUrl = getApiBaseUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    // Normalize v1 prefix if needed
    const fullUrl = cleanPath.startsWith('/v1') || cleanPath.startsWith('/notifications') || cleanPath.startsWith('/resources') 
      ? `${baseUrl}${cleanPath.replace(/^\/v1/, '')}` 
      : `${baseUrl}/v1${cleanPath}`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
        ...(options.headers as Record<string, string> || {})
      };

      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.message) errorMessage = parsed.message;
          if (parsed.error) errorMessage = parsed.error;
        } catch (_) {}
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (err) {
      console.log(`API request ${fullUrl} failed, falling back to local state:`, err);
      return null;
    }
  }

  // Auth Endpoints
  async login(credentials: { email: string; password?: string }) {
    const baseUrl = getApiBaseUrl();
    const fullUrl = `${baseUrl}/v1/login`;

    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        let errorMsg = 'Invalid credentials. Please check your email and password.';
        if (data?.error) errorMsg = data.error;
        if (data?.message) errorMsg = data.message;
        return { ok: false, error: errorMsg, status: response.status };
      }

      if (data && data.token) {
        this.setToken(data.token);
        return { ok: true, token: data.token, user: data.user };
      }

      return { ok: false, error: 'Malformed response from server.' };
    } catch (err: any) {
      console.log(`Login API request ${fullUrl} error (using development fallback):`, err?.message || err);
      return { ok: false, isOffline: true, error: 'Server unreachable. Switching to offline preview.' };
    }
  }

  async getMe() {
    return await this.request('/v1/me');
  }

  async logout() {
    try {
      await this.request('/v1/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // Dashboard Stats
  async getDashboardStats() {
    return await this.request('/v1/dashboard/stats');
  }

  // Resources CRUD Endpoints
  async getResources(resource: string, params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    const path = `/resources/${resource}${query ? `?${query}` : ''}`;
    return await this.request(path);
  }

  async getResource(resource: string, id: string) {
    return await this.request(`/resources/${resource}/${id}`);
  }

  async createResource(resource: string, data: any) {
    return await this.request(`/resources/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async bulkCreateResource(resource: string, records: any[]) {
    return await this.request(`/resources/${resource}/bulk`, {
      method: 'POST',
      body: JSON.stringify({ records })
    });
  }

  async updateResource(resource: string, id: string, data: any) {
    return await this.request(`/resources/${resource}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteResource(resource: string, id: string) {
    return await this.request(`/resources/${resource}/${id}`, {
      method: 'DELETE'
    });
  }

  // Bus Tracking
  async getBusFleet() {
    return await this.request('/v1/bus/fleet');
  }

  async getBusPositions() {
    return await this.request('/v1/bus/positions');
  }

  // Substitutes
  async getSubstitutesSchedule() {
    return await this.request('/v1/substitutes/schedule');
  }

  async assignSubstitute(data: any) {
    return await this.request('/v1/substitutes/assign', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Roles & Permissions
  async getRoles() {
    return await this.request('/roles');
  }

  async createRole(data: { name: string; permissions?: string[] }) {
    return await this.request('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(id: string | number, data: { name: string; permissions?: string[] }) {
    return await this.request(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRole(id: string | number) {
    return await this.request(`/roles/${id}`, {
      method: 'DELETE',
    });
  }

  async syncRolePermissions(id: string | number, permissions: string[]) {
    return await this.request(`/roles/${id}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissions }),
    });
  }

  async getPermissions() {
    return await this.request('/permissions');
  }

  // Notifications
  async getNotifications() {
    return await this.request('/notifications');
  }
}

export const api = new ApiClient();
