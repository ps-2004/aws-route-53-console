export type RecordType = 
  | 'A'
  | 'AAAA'
  | 'CNAME'
  | 'TXT'
  | 'MX'
  | 'NS'
  | 'PTR'
  | 'SRV'
  | 'CAA'
  | 'SOA';

export type ZoneType = 'Public' | 'Private';

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface HostedZone {
  id: number;
  name: string;
  zone_id: string;
  zone_type: ZoneType;
  description: string;
  private_zone: number;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface DnsRecord {
  id: number;
  hosted_zone_id: number;
  name: string;
  type: RecordType;
  ttl: number;
  value: string;
  priority?: number | null;
  weight?: number | null;
  port?: number | null;
  target?: string | null;
  flags?: number | null;
  tag?: string | null;
  routing_policy: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  zone?: HostedZone;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}
