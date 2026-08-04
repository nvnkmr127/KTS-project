// Default backend API URL for mobile app connection
const API_BASE_URL = 'http://localhost:8000/api';

class ApiClient {
  private async request(path: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(options.headers || {})
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.log(`API request ${path} failed, using local offline state fallback:`, err);
      return null;
    }
  }

  async getResources(resource: string, params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    const path = `/resources/${resource}${query ? `?${query}` : ''}`;
    return await this.request(path);
  }

  async createResource(resource: string, data: any) {
    return await this.request(`/resources/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data)
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
}

export const api = new ApiClient();
