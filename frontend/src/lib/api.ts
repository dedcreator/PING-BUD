import {
  Monitor,
  Incident,
  StatusSummary,
  ProPlan,
  Donation,
  AlertChannel,
  Check,
  User,
  Project,
  ApiKey,
  MaintenanceWindow,
  StatusPageConfig,
  UserRole,
  BillingOverview,
  MonitorEdgeBreakdown,
  SlaComplianceReport,
} from '../types';

export function getApiBase(): string {
  // 1. Explicit environment variable set at build or run time
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  // 2. Client-side browser runtime autodetection
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    const port = window.location.port;

    // Local development (e.g. Next.js on port 3000 -> Django on port 8000)
    if (port === '3000') {
      return `http://${host || '127.0.0.1'}:8000`;
    }

    // Production custom domain (sentiro.xyz / www.sentiro.xyz -> api.sentiro.xyz)
    if (host === 'sentiro.xyz' || host === 'www.sentiro.xyz' || host.endsWith('.sentiro.xyz')) {
      return 'https://api.sentiro.xyz';
    }

    // Pxxl.app / Pxxl.pro deployments (sentiro-web.pxxl.pro -> sentiro-api.pxxl.pro)
    if (host.includes('pxxl')) {
      const parts = host.split('.');
      if (parts[0].endsWith('-web')) {
        parts[0] = parts[0].replace(/-web$/, '-api');
        return `${window.location.protocol}//${parts.join('.')}`;
      }
    }

    // Same-origin fallback
    return '';
  }

  // 3. Server-side rendering default
  return 'http://127.0.0.1:8000';
}

// Dynamically resolves at the exact moment of each fetch request
const API_BASE = {
  toString() {
    return getApiBase();
  },
};

// Global demo role header state for testing RBAC live in UI
let currentDemoRole: UserRole = 'owner';

export function setClientDemoRole(role: UserRole) {
  currentDemoRole = role;
  if (typeof window !== 'undefined') {
    localStorage.setItem('pulsewatch_demo_role', role);
  }
}

export function getClientDemoRole(): UserRole {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('pulsewatch_demo_role');
    if (saved === 'owner' || saved === 'editor' || saved === 'viewer') {
      currentDemoRole = saved;
    }
  }
  return currentDemoRole;
}

function getHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Demo-Role': getClientDemoRole(),
    ...extra,
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pulsewatch_token');
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
  }
  return headers;
}

// Fallback demo data
const fallbackSummary: StatusSummary = {
  total: 6,
  up: 4,
  down: 1,
  suspect: 1,
  paused: 0,
  in_maintenance: 0,
  active_maintenance_windows: 1,
  overall_uptime_24h: 98.92,
  avg_latency_ms: 48.5,
  active_incidents_count: 1,
};

const fallbackPro: ProPlan = {
  name: "sentiro Indie Pro",
  is_active: false,
  price_monthly: 2000.00,
  price_yearly: 20000.00,
  team_price_monthly: 5000.00,
  team_price_yearly: 50000.00,
  currency: "NGN",
  currency_symbol: "₦",
  tier_tag: "Indie Pro (₦2,000/mo)",
  active_tier: "indie_pro",
  features_json: [
    "30-Second Check Intervals (vs 60s/3m community)",
    "Multi-Region Global Probes (US-East, EU-Central, AP-South)",
    "Instant Email & Telegram Bot Outage Alerts (100% Free & Fast)",
    "Automated AI Incident Root-Cause Analysis (RCA)",
    "Custom Domains for Status Pages (status.yourbrand.com)",
    "SSL Certificate Expiry Alerts (30d, 14d, 7d)",
    "1-Year Historical Metric & Incident Data Retention",
    "Priority Webhook Retries & Escalation Policies",
  ]
};

// --- AUTHENTICATION & RBAC ---

export async function loginUser(loginId: string, pass: string): Promise<{ token: string; user: User; role: UserRole }> {
  const res = await fetch(`${API_BASE}/api/auth/login/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      email: loginId,
      username: loginId,
      email_or_username: loginId,
      password: pass,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || 'Invalid credentials');
  }
  const data = await res.json();
  if (typeof window !== 'undefined') {
    localStorage.setItem('pulsewatch_token', data.token);
    setClientDemoRole(data.role || 'owner');
  }
  return data;
}

export async function loginWithGoogle(payload: {
  email?: string;
  name?: string;
  credential?: string;
  google_id?: string;
}): Promise<{
  token: string;
  user: User;
  role: UserRole;
  can_edit: boolean;
  is_owner: boolean;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/api/auth/google/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Google sign-in failed' }));
    throw new Error(err.error || 'Google authentication failed');
  }
  const data = await res.json();
  if (typeof window !== 'undefined') {
    localStorage.setItem('pulsewatch_token', data.token);
    setClientDemoRole(data.role || 'owner');
  }
  return data;
}

export async function registerUser(email: string, username: string, pass: string, role: UserRole): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/api/auth/register/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, username, password: pass, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(err.error || 'Failed to register');
  }
  const data = await res.json();
  if (typeof window !== 'undefined') {
    localStorage.setItem('pulsewatch_token', data.token);
    setClientDemoRole(role);
  }
  return data;
}

export function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('pulsewatch_token'));
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pulsewatch_token');
    localStorage.removeItem('pulsewatch_demo_role');
  }
}

export async function fetchCurrentUser(): Promise<{
  authenticated: boolean;
  user: User | null;
  active_role: UserRole;
  can_edit: boolean;
  is_owner: boolean;
  api_keys_count: number;
  projects_count: number;
}> {
  if (typeof window !== 'undefined' && !localStorage.getItem('pulsewatch_token')) {
    return {
      authenticated: false,
      user: null,
      active_role: 'viewer',
      can_edit: false,
      is_owner: false,
      api_keys_count: 0,
      projects_count: 0,
    };
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/me/`, {
      headers: getHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Unauthenticated');
    const data = await res.json();
    if (!data.authenticated && !data.user) {
      return {
        authenticated: false,
        user: null,
        active_role: 'viewer',
        can_edit: false,
        is_owner: false,
        api_keys_count: 0,
        projects_count: 0,
      };
    }
    return {
      authenticated: true,
      user: data.user,
      active_role: data.active_role || 'owner',
      can_edit: data.can_edit ?? true,
      is_owner: data.is_owner ?? true,
      api_keys_count: data.api_keys_count || 0,
      projects_count: data.projects_count || 0,
    };
  } catch {
    return {
      authenticated: false,
      user: null,
      active_role: 'viewer',
      can_edit: false,
      is_owner: false,
      api_keys_count: 0,
      projects_count: 0,
    };
  }
}

export async function switchUserRole(role: UserRole): Promise<{ active_role: UserRole; can_edit: boolean; is_owner: boolean }> {
  setClientDemoRole(role);
  try {
    const res = await fetch(`${API_BASE}/api/auth/role-switch/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    return await res.json();
  } catch {
    return {
      active_role: role,
      can_edit: role !== 'viewer',
      is_owner: role === 'owner',
    };
  }
}

export async function switchDemoTierUser(tier: 'free' | 'indie' | 'team'): Promise<{
  token: string;
  user: User;
  role: UserRole;
  plan_tier: string;
  can_edit: boolean;
  is_owner: boolean;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/api/auth/demo-user/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ tier }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to switch user' }));
    throw new Error(err.error || 'Failed to switch user');
  }
  const data = await res.json();
  if (typeof window !== 'undefined') {
    localStorage.setItem('pulsewatch_token', data.token);
    setClientDemoRole(data.role);
  }
  return data;
}

// --- OVERVIEW & WORKSPACES ---

export async function fetchOverview(projectSlug = ''): Promise<{
  status_summary: StatusSummary;
  monitors: Monitor[];
  active_incidents: Incident[];
  pro_plan: ProPlan;
  projects?: Project[];
}> {
  try {
    const url = projectSlug ? `${API_BASE}/api/overview/?project=${projectSlug}` : `${API_BASE}/api/overview/`;
    const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      status_summary: fallbackSummary,
      monitors: [],
      active_incidents: [],
      pro_plan: fallbackPro,
      projects: [
        { id: 1, name: "Production Cloud & Services", slug: "production", is_public: true, monitors_count: 6, created_at: new Date().toISOString() },
        { id: 2, name: "Staging & Pre-release Cluster", slug: "staging", is_public: false, monitors_count: 3, created_at: new Date().toISOString() }
      ],
    };
  }
}

export async function fetchProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_BASE}/api/projects/`, { headers: getHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load projects');
    return await res.json();
  } catch {
    return [];
  }
}

export async function createProject(name: string, custom_domain = ''): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/projects/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, custom_domain }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create workspace');
  }
  return await res.json();
}

export async function deleteProject(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/projects/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete workspace');
  }
}

export async function fetchMonitorEdgeBreakdown(id: number | string): Promise<MonitorEdgeBreakdown> {
  const res = await fetch(`${API_BASE}/api/monitors/${id}/edge-breakdown/`, {
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch edge breakdown');
  return await res.json();
}

export async function fetchSlaComplianceReport(target = 99.9): Promise<SlaComplianceReport> {
  const res = await fetch(`${API_BASE}/api/sla/report/?target=${target}`, {
    headers: getHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch SLA report');
  return await res.json();
}

// --- MONITORS ---

export async function fetchMonitorDetail(id: number | string): Promise<Monitor | null> {
  try {
    const res = await fetch(`${API_BASE}/api/monitors/${id}/`, { headers: getHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load monitor');
    return await res.json();
  } catch {
    return null;
  }
}

export async function createMonitor(data: Partial<Monitor>): Promise<Monitor> {
  const res = await fetch(`${API_BASE}/api/monitors/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || JSON.stringify(err));
  }
  return await res.json();
}

export async function testTargetPreview(data: {
  target: string;
  monitor_type: string;
  keyword?: string;
  expected_status?: number;
  timeout_ms?: number;
  dns_expected_value?: string;
}): Promise<{ ok: boolean; latency_ms: number; status_code: number; error: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/monitors/test/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return { ok: false, latency_ms: 0, status_code: 0, error: 'Failed to contact backend check agent' };
  }
}

export async function pauseMonitor(id: number): Promise<Monitor> {
  const res = await fetch(`${API_BASE}/api/monitors/${id}/pause/`, { method: 'POST', headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to pause');
  }
  return await res.json();
}

export async function resumeMonitor(id: number): Promise<Monitor> {
  const res = await fetch(`${API_BASE}/api/monitors/${id}/resume/`, { method: 'POST', headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to resume');
  }
  return await res.json();
}

export async function checkMonitorNow(id: number): Promise<{ monitor: Monitor; check: Check }> {
  const res = await fetch(`${API_BASE}/api/monitors/${id}/check-now/`, { method: 'POST', headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to run check');
  }
  return await res.json();
}

export async function deleteMonitor(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/monitors/${id}/`, { method: 'DELETE', headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete');
  }
}

export async function fetchMonitorChecks(id: number | string, range = '24h'): Promise<{
  monitor_id: number;
  monitor_name: string;
  range: string;
  p50_ms: number;
  p95_ms: number;
  recent_checks: Check[];
}> {
  const res = await fetch(`${API_BASE}/api/monitors/${id}/checks/?range=${range}`, { headers: getHeaders(), cache: 'no-store' });
  return await res.json();
}

// --- INCIDENTS & EXPORTS ---

export async function fetchIncidents(statusFilter = 'all'): Promise<Incident[]> {
  try {
    const url = statusFilter === 'all' 
      ? `${API_BASE}/api/incidents/` 
      : `${API_BASE}/api/incidents/?status=${statusFilter}`;
    const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' });
    return await res.json();
  } catch {
    return [];
  }
}

export function getIncidentExportUrl(format: 'csv' | 'json'): string {
  return `${API_BASE}/api/export/incidents/?format=${format}`;
}

// --- CHANNELS ---

export async function fetchChannels(): Promise<AlertChannel[]> {
  try {
    const res = await fetch(`${API_BASE}/api/channels/`, { headers: getHeaders(), cache: 'no-store' });
    return await res.json();
  } catch {
    return [];
  }
}

export async function createChannel(data: Partial<AlertChannel>): Promise<AlertChannel> {
  const res = await fetch(`${API_BASE}/api/channels/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create channel');
  }
  return await res.json();
}

export async function updateChannel(id: number, data: Partial<AlertChannel>): Promise<AlertChannel> {
  const res = await fetch(`${API_BASE}/api/channels/${id}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update channel');
  }
  return await res.json();
}

export async function deleteChannel(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/channels/${id}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to delete channel');
  }
}

export async function testChannel(id: number): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/channels/${id}/test/`, { method: 'POST', headers: getHeaders() });
  return await res.json();
}

// --- MAINTENANCE WINDOWS ---

export async function fetchMaintenanceWindows(): Promise<MaintenanceWindow[]> {
  try {
    const res = await fetch(`${API_BASE}/api/maintenance/`, { headers: getHeaders(), cache: 'no-store' });
    return await res.json();
  } catch {
    return [];
  }
}

export async function createMaintenanceWindow(data: {
  title: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  monitor_ids: number[];
}): Promise<MaintenanceWindow> {
  const res = await fetch(`${API_BASE}/api/maintenance/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to schedule maintenance');
  }
  return await res.json();
}

export async function deleteMaintenanceWindow(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/maintenance/${id}/`, { method: 'DELETE', headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete');
  }
}

// --- API KEYS ---

export async function fetchApiKeys(): Promise<ApiKey[]> {
  try {
    const res = await fetch(`${API_BASE}/api/api-keys/`, { headers: getHeaders(), cache: 'no-store' });
    return await res.json();
  } catch {
    return [];
  }
}

export async function createApiKey(name: string, scope: 'read' | 'write' | 'admin'): Promise<{
  api_key: ApiKey;
  secret_key: string;
  warning: string;
}> {
  const res = await fetch(`${API_BASE}/api/api-keys/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, scope }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to generate key');
  }
  return await res.json();
}

export async function deleteApiKey(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/api-keys/${id}/`, { method: 'DELETE', headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete');
  }
}

// --- STATUS PAGE & BRANDING ---

export async function fetchStatusPage(): Promise<{
  system_status: string;
  status_headline: string;
  avg_sla_90d?: number;
  company_name?: string;
  headline?: string;
  announcement_text?: string;
  custom_domain?: string;
  updated_at: string;
  component_groups?: Array<{
    name: string;
    description: string;
    monitors: Monitor[];
  }>;
  monitors: Monitor[];
  active_incidents: Incident[];
  past_incidents?: Incident[];
  recent_posts: Array<{ id: number; title: string; body: string; kind: string; created_at: string }>;
  scheduled_maintenances?: Array<{ id: number; title: string; description: string; starts_at: string; ends_at: string }>;
}> {
  const res = await fetch(`${API_BASE}/api/status-page/`, { headers: getHeaders(), cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to load status page');
  }
  return await res.json();
}

export async function fetchStatusPageConfig(): Promise<StatusPageConfig> {
  const res = await fetch(`${API_BASE}/api/status-page/config/`, { headers: getHeaders(), cache: 'no-store' });
  return await res.json();
}

export async function updateStatusPageConfig(data: Partial<StatusPageConfig>): Promise<StatusPageConfig> {
  const res = await fetch(`${API_BASE}/api/status-page/config/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update config');
  }
  return await res.json();
}

export async function subscribeToStatusPage(channel: string, endpoint: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/status-page/subscribe/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ channel, endpoint }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Subscription failed');
  }
  return await res.json();
}

export async function createStatusPost(title: string, body: string, kind: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/status-page/posts/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, body, kind }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to publish post');
  }
  return await res.json();
}

// --- BILLING, PRO PLANS & DONATIONS (PRICED IN NAIRA: ₦2,000 & ₦5,000) ---

export async function fetchBillingOverview(): Promise<BillingOverview> {
  try {
    const res = await fetch(`${API_BASE}/api/billing/`, { headers: getHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load billing');
    return await res.json();
  } catch {
    return {
      active_plan: {
        tier: 'indie_pro',
        name: 'Indie Pro (₦2,000/mo)',
        price: 2000.0,
        currency: 'NGN',
        currency_symbol: '₦',
        status: 'Active',
        renewal_date: 'November 28, 2026',
        billing_cycle: 'monthly',
      },
      payment_method: {
        type: 'virtual_account',
        brand: 'Sentiro Pro Billing',
        last4: '4242',
        expiry: '12/28',
        provider: 'Direct Settlement',
      },
      usage_quotas: {
        monitors_used: 7,
        monitors_limit: 50,
        check_frequency: '30s',
        team_seats_used: 3,
        team_seats_limit: 5,
        telegram_alerts_sent: 48,
      },
      invoices: [
        {
          id: 1,
          invoice_id: 'INV-2026-9403',
          plan_name: 'sentiro Indie Pro (Monthly)',
          amount: 2000.0,
          currency: 'NGN',
          currency_symbol: '₦',
          status: 'Paid',
          payment_method: 'Providus Bank Transfer',
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          invoice_id: 'INV-2026-8821',
          plan_name: 'sentiro Indie Pro (Monthly)',
          amount: 2000.0,
          currency: 'NGN',
          currency_symbol: '₦',
          status: 'Paid',
          payment_method: 'Mastercard (•••• 4242)',
          created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
        },
      ],
    };
  }
}

export async function selectBillingPlan(tier: 'community' | 'indie_pro' | 'team_pro'): Promise<{ message: string; pro_subscription: ProPlan }> {
  const res = await fetch(`${API_BASE}/api/pro/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ action: 'select_plan', tier }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update plan');
  }
  return await res.json();
}

export async function createDirectCheckoutSession(planId: string, billingCycle: 'monthly' | 'yearly', amount?: number): Promise<{
  reference: string;
  checkout_url: string;
  hosted_checkout_url?: string;
  amount: number;
  currency: string;
  plan_id: string;
  plan_name: string;
  billing_cycle: string;
  provider: string;
  virtual_account: {
    bank_name: string;
    account_number: string;
    account_name: string;
    instructions: string;
  };
  status: string;
}> {
  const res = await fetch(`${API_BASE}/api/billing/checkout/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ plan_id: planId, billing_cycle: billingCycle, amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Checkout initialization failed' }));
    throw new Error(err.error || 'Failed to initiate checkout');
  }
  return await res.json();
}

export const createBachsCheckoutSession = createDirectCheckoutSession;

export async function fetchProInfo(): Promise<{
  pro_subscription: ProPlan;
  donations: Donation[];
  stats: { total_supporters: number; total_donated_naira?: number; total_donated_usd?: number; active_tier?: string };
}> {
  try {
    const res = await fetch(`${API_BASE}/api/pro/`, { headers: getHeaders(), cache: 'no-store' });
    return await res.json();
  } catch {
    return {
      pro_subscription: fallbackPro,
      donations: [],
      stats: { total_supporters: 14, total_donated_naira: 45000, active_tier: 'Indie Pro' }
    };
  }
}

export async function toggleProStatus(tier = 'indie_pro'): Promise<{ message: string; pro_subscription: ProPlan }> {
  const res = await fetch(`${API_BASE}/api/pro/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ action: 'select_plan', tier }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update Pro status');
  }
  return await res.json();
}

export async function submitDonation(data: {
  donor_name: string;
  amount: number;
  message: string;
  source?: string;
}): Promise<{ message: string; donation: Donation }> {
  const res = await fetch(`${API_BASE}/api/pro/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ action: 'donate', ...data }),
  });
  return await res.json();
}

// --- RESEND EMAIL & PASSWORD RECOVERY ---

export async function forgotPassword(email: string): Promise<{ ok: boolean; message: string; token?: string; uidb64?: string }> {
  const res = await fetch(`${API_BASE}/api/auth/forgot-password/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to request password reset');
  }
  return data;
}

export async function resetPassword(payload: {
  email: string;
  token?: string;
  uidb64?: string;
  new_password: string;
}): Promise<{ ok: boolean; message: string; token?: string; user?: User; role?: UserRole }> {
  const res = await fetch(`${API_BASE}/api/auth/reset-password/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to reset password');
  }
  return data;
}

export async function linkGoogleAccount(googleEmail: string): Promise<{ ok: boolean; linked_email: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/auth/link-google/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ google_email: googleEmail }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to link Google account');
  }
  return data;
}

export async function sendTestEmail(toEmail?: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/api/email/test/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ to: toEmail }),
  });
  return await res.json();
}

export async function fetchAuditLogs(category = 'all', search = ''): Promise<any[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE}/api/audit-logs/?${params.toString()}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    return [];
  }
  return await res.json();
}

export function getAuditLogExportUrl(format: 'csv' | 'json' = 'json'): string {
  return `${API_BASE}/api/audit-logs/export/?format=${format}`;
}

export async function submitFeedback(payload: {
  mode: 'feature' | 'issue';
  title: string;
  description: string;
  category?: string;
  severity?: string;
  email?: string;
}): Promise<{ ok: boolean; message: string; dispatched_to?: string }> {
  const res = await fetch(`${API_BASE}/api/feedback/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to submit feedback' }));
    throw new Error(err.error || 'Failed to submit feedback');
  }
  return await res.json();
}

export async function fetchTotpSetup(): Promise<{
  secret: string;
  otpauth_url: string;
  totp_enabled: boolean;
  account_name: string;
}> {
  const res = await fetch(`${API_BASE}/api/auth/totp/setup/`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to load TOTP setup credentials');
  }
  return await res.json();
}

export async function verifyTotp(code: string): Promise<{ ok: boolean; message: string; totp_enabled: boolean }> {
  const res = await fetch(`${API_BASE}/api/auth/totp/verify/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Invalid verification code' }));
    throw new Error(err.error || 'Invalid verification code');
  }
  return await res.json();
}

export async function disableTotp(): Promise<{ ok: boolean; message: string; totp_enabled: boolean }> {
  const res = await fetch(`${API_BASE}/api/auth/totp/disable/`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to disable 2FA' }));
    throw new Error(err.error || 'Failed to disable 2FA');
  }
  return await res.json();
}


