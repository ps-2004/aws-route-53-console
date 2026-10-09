import { HostedZone, DnsRecord, PaginatedResponse, User } from '../types/route53';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('r53_session_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ success: boolean; token: string; user: User }> {
    const data = await request<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('r53_session_token', data.token);
    localStorage.setItem('r53_user', JSON.stringify(data.user));
    return data;
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('r53_session_token');
      localStorage.removeItem('r53_user');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const data = await request<{ user: User }>('/auth/me');
      return data.user;
    } catch {
      return null;
    }
  },

  // Hosted Zones
  async getHostedZones(page = 1, limit = 10, search = ''): Promise<PaginatedResponse<HostedZone>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search ? { search } : {}),
    });
    return request<PaginatedResponse<HostedZone>>(`/hosted-zones?${params.toString()}`);
  },

  async getHostedZone(idOrZoneId: string | number): Promise<HostedZone> {
    return request<HostedZone>(`/hosted-zones/${idOrZoneId}`);
  },

  async createHostedZone(payload: {
    name: string;
    description?: string;
    zone_type?: string;
    private_zone?: boolean;
  }): Promise<HostedZone> {
    return request<HostedZone>('/hosted-zones', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateHostedZone(
    idOrZoneId: string | number,
    payload: { description?: string; zone_type?: string; private_zone?: boolean }
  ): Promise<HostedZone> {
    return request<HostedZone>(`/hosted-zones/${idOrZoneId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteHostedZone(idOrZoneId: string | number): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/hosted-zones/${idOrZoneId}`, {
      method: 'DELETE',
    });
  },

  async exportZone(idOrZoneId: string | number, format: 'json' | 'bind' = 'json'): Promise<any> {
    if (format === 'bind') {
      const res = await fetch(`${API_BASE}/hosted-zones/${idOrZoneId}/export?format=bind`, {
        headers: getAuthHeader(),
      });
      return res.text();
    }
    return request(`/hosted-zones/${idOrZoneId}/export?format=json`);
  },

  async importRecords(idOrZoneId: string | number, records: any[]): Promise<{ count: number; message: string }> {
    return request<{ count: number; message: string }>(`/hosted-zones/${idOrZoneId}/import`, {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  },

  // Records
  async getRecords(
    zoneId: string | number,
    page = 1,
    limit = 10,
    search = '',
    type = 'ALL'
  ): Promise<PaginatedResponse<DnsRecord>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search ? { search } : {}),
      ...(type && type !== 'ALL' ? { type } : {}),
    });
    return request<PaginatedResponse<DnsRecord>>(`/hosted-zones/${zoneId}/records?${params.toString()}`);
  },

  async createRecord(
    zoneId: string | number,
    payload: Partial<DnsRecord>
  ): Promise<DnsRecord> {
    return request<DnsRecord>(`/hosted-zones/${zoneId}/records`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateRecord(recordId: number, payload: Partial<DnsRecord>): Promise<DnsRecord> {
    return request<DnsRecord>(`/records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteRecord(recordId: number): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/records/${recordId}`, {
      method: 'DELETE',
    });
  },

  async bulkDeleteRecords(ids: number[]): Promise<{ success: boolean; deleted: number; message: string }> {
    return request<{ success: boolean; deleted: number; message: string }>('/records/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },
};
