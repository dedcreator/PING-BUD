export type MonitorType = 'http' | 'keyword' | 'ping' | 'port' | 'heartbeat' | 'ssl' | 'dns';
export type MonitorState = 'up' | 'down' | 'suspect' | 'maintenance' | 'paused';
export type UserRole = 'owner' | 'editor' | 'viewer';

export interface UserProfile {
  role: UserRole;
  totp_enabled: boolean;
  phone_number: string;
  can_edit: boolean;
  is_owner: boolean;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile?: UserProfile;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  custom_domain?: string | null;
  is_public: boolean;
  monitors_count: number;
  created_at: string;
}

export interface ApiKey {
  id: number;
  name: string;
  key_prefix: string;
  scope: 'read' | 'write' | 'admin';
  created_at: string;
  last_used_at: string | null;
}

export interface MaintenanceWindow {
  id: number;
  project?: number;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  monitor_ids: number[];
  silence_alerts: boolean;
  is_currently_active: boolean;
  created_at: string;
}

export interface StatusPageConfig {
  id: number;
  project: number;
  company_name: string;
  logo_url: string;
  custom_domain: string;
  headline: string;
  announcement_text: string;
  show_uptime_history: boolean;
  allow_subscriptions: boolean;
  theme: 'light' | 'dark' | 'system';
  updated_at: string;
}

export interface UptimeBarTick {
  status: 'up' | 'down' | 'warn' | 'empty';
  latency_ms: number;
  status_code: number | null;
  timestamp: string;
  error?: string;
}

export interface CertInfo {
  id: number;
  issuer: string;
  valid_to: string;
  days_remaining: number;
  last_checked: string;
}

export interface Monitor {
  id: number;
  project?: number;
  name: string;
  monitor_type: MonitorType;
  target: string;
  interval_seconds: number;
  timeout_ms: number;
  retries: number;
  http_method: string;
  expected_status: number;
  keyword?: string | null;
  keyword_type?: 'contains' | 'not_contains';
  headers_json?: Record<string, string>;
  request_body?: string | null;
  dns_record_type?: string;
  dns_expected_value?: string;
  json_path?: string;
  json_expected_value?: string;
  regions?: string[];
  quiet_start?: string;
  quiet_end?: string;
  escalate_after_s?: number;
  state: MonitorState;
  paused: boolean;
  heartbeat_token: string;
  last_checked_at: string | null;
  next_run_at: string;
  created_at: string;
  uptime_24h: number;
  uptime_7d: number;
  uptime_30d: number;
  uptime_90d: number;
  avg_latency: number;
  recent_checks_count: number;
  uptime_bar: UptimeBarTick[];
  cert_info?: CertInfo | null;
  active_incidents_count: number;
}

export interface Check {
  id: number;
  timestamp: string;
  ok: boolean;
  latency_ms: number;
  status_code: number | null;
  error: string;
  region: string;
}

export interface Incident {
  id: number;
  monitor: number;
  monitor_name: string;
  started_at: string;
  resolved_at: string | null;
  cause: string;
  auto: boolean;
  ai_summary: string;
  duration_minutes: number;
  is_active: boolean;
}

export interface AlertChannel {
  id: number;
  name: string;
  kind: 'email' | 'slack' | 'discord' | 'telegram' | 'teams' | 'webhook' | 'sms_whatsapp';
  config: Record<string, string>;
  enabled: boolean;
  created_at: string;
}

export interface StatusSummary {
  total: number;
  up: number;
  down: number;
  suspect: number;
  paused: number;
  in_maintenance?: number;
  active_maintenance_windows?: number;
  overall_uptime_24h: number;
  avg_latency_ms: number;
  active_incidents_count: number;
}

export interface ProPlan {
  id?: number;
  name: string;
  is_active: boolean;
  price_monthly: number;
  price_yearly: number;
  team_price_monthly?: number;
  team_price_yearly?: number;
  currency?: string;
  currency_symbol?: string;
  tier_tag: string;
  active_tier?: 'community' | 'indie_pro' | 'team_pro';
  features_json: string[];
}

export interface Invoice {
  id: number;
  invoice_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  currency_symbol: string;
  status: string;
  payment_method: string;
  created_at: string;
}

export interface BillingOverview {
  active_plan: {
    tier: string;
    name: string;
    price: number;
    currency: string;
    currency_symbol: string;
    status: string;
    renewal_date: string;
    billing_cycle: string;
  };
  payment_method: {
    type: string;
    brand: string;
    last4: string;
    expiry: string;
    provider: string;
  };
  usage_quotas: {
    monitors_used: number;
    monitors_limit: number;
    check_frequency: string;
    team_seats_used: number;
    team_seats_limit: number;
    telegram_alerts_sent?: number;
    sms_alerts_remaining?: number;
  };
  invoices: Invoice[];
}

export interface Donation {
  id: number;
  donor_name: string;
  amount: number;
  currency: string;
  message: string;
  source: string;
  created_at: string;
}

export interface EdgeNodeBreakdown {
  region: string;
  node_id: string;
  latency_ms: number | null;
  status: 'up' | 'down';
  packet_loss_pct: number;
  consensus: string;
  ip: string;
  flag: string;
}

export interface MonitorEdgeBreakdown {
  monitor_id: number;
  monitor_name: string;
  state: string;
  consensus_quorum: string;
  is_healthy: boolean;
  jitter_ms: number;
  nodes: EdgeNodeBreakdown[];
}

export interface SlaComplianceReport {
  sla_target_pct: number;
  current_uptime_pct: number;
  total_monitors: number;
  period: string;
  allowed_downtime_minutes: number;
  actual_downtime_minutes: number;
  remaining_budget_minutes: number;
  remaining_budget_pct: number;
  is_compliant: boolean;
  status: string;
  generated_at: string;
  attestation_id: string;
}
