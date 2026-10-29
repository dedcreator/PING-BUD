'use client';

import React, { useState } from 'react';
import {
  X,
  Globe,
  Radio,
  Terminal,
  Key,
  Lock,
  Search,
  Zap,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sliders,
  Shield,
  Loader2,
  Network,
  Clock,
} from 'lucide-react';
import { Monitor, MonitorType, UserRole } from '../types';
import { testTargetPreview } from '../lib/api';
import ThreeDProtocolHologram from './ThreeDProtocolHologram';
import ThreeDDeployingOverlay from './ThreeDDeployingOverlay';

interface AddMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Monitor>) => Promise<void>;
  isPro?: boolean;
  userRole?: UserRole;
}

export default function AddMonitorModal({
  isOpen,
  onClose,
  onSubmit,
  isPro = false,
  userRole = 'owner',
}: AddMonitorModalProps) {
  const [monitorType, setMonitorType] = useState<MonitorType>('http');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [interval, setInterval] = useState(60);
  const [timeoutMs, setTimeoutMs] = useState(5000);
  const [retries, setRetries] = useState(2);

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [httpMethod, setHttpMethod] = useState('GET');
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [keyword, setKeyword] = useState('');
  const [keywordType, setKeywordType] = useState<'contains' | 'not_contains'>('contains');
  const [headersJsonStr, setHeadersJsonStr] = useState('');
  const [requestBody, setRequestBody] = useState('');

  // DNS & JSON assertions
  const [dnsRecordType, setDnsRecordType] = useState('A');
  const [dnsExpectedValue, setDnsExpectedValue] = useState('');
  const [jsonPath, setJsonPath] = useState('');
  const [jsonExpectedValue, setJsonExpectedValue] = useState('');

  // Multi-region & escalation
  const [regions, setRegions] = useState<string[]>(['US-East (N. Virginia)']);
  const [escalateAfterS, setEscalateAfterS] = useState(600);

  // Live test preview state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    ok: boolean;
    latency_ms: number;
    status_code: number;
    error: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const canEdit = userRole === 'owner' || userRole === 'editor';

  if (!isOpen) return null;

  const handleToggleRegion = (reg: string) => {
    setRegions((prev) =>
      prev.includes(reg) ? (prev.length > 1 ? prev.filter((r) => r !== reg) : prev) : [...prev, reg]
    );
  };

  const handleTestPreview = async () => {
    if (!target.trim()) {
      setErrorMsg('Please enter a target URL or address first');
      return;
    }
    setErrorMsg('');
    setTesting(true);
    setTestResult(null);

    try {
      const res = await testTargetPreview({
        target: target.trim(),
        monitor_type: monitorType,
        keyword: keyword.trim() || undefined,
        expected_status: expectedStatus,
        timeout_ms: timeoutMs,
        dns_expected_value: dnsExpectedValue.trim() || undefined,
      });
      setTestResult({
        tested: true,
        ok: res.ok,
        latency_ms: res.latency_ms,
        status_code: res.status_code,
        error: res.error,
      });
    } catch {
      setTestResult({
        tested: true,
        ok: false,
        latency_ms: 0,
        status_code: 0,
        error: 'Failed to complete test check',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setErrorMsg('Viewer role cannot create monitors. Switch role in Team Modal to Editor or Owner.');
      return;
    }
    if (!target.trim()) {
      setErrorMsg('Target is required');
      return;
    }
    setErrorMsg('');
    setSaving(true);

    try {
      let headers_json = {};
      if (headersJsonStr.trim()) {
        try {
          headers_json = JSON.parse(headersJsonStr);
        } catch {
          setErrorMsg('Custom headers must be valid JSON');
          setSaving(false);
          return;
        }
      }

      const monitorData: Partial<Monitor> = {
        name: name.trim() || target.trim(),
        monitor_type: monitorType,
        target: target.trim(),
        interval_seconds: interval,
        timeout_ms: timeoutMs,
        retries: retries,
        http_method: httpMethod,
        expected_status: Number(expectedStatus),
        keyword: keyword.trim() || null,
        keyword_type: keywordType,
        headers_json,
        request_body: requestBody.trim() || null,
        dns_record_type: dnsRecordType,
        dns_expected_value: dnsExpectedValue.trim(),
        json_path: jsonPath.trim(),
        json_expected_value: jsonExpectedValue.trim(),
        regions,
        escalate_after_s: escalateAfterS,
      };

      await onSubmit(monitorData);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create monitor');
    } finally {
      setSaving(false);
    }
  };

  const typeOptions: { id: MonitorType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'http',
      label: 'HTTP(s)',
      icon: <Globe className="w-4 h-4 text-indigo-500" />,
      desc: 'Website or REST endpoint',
    },
    {
      id: 'keyword',
      label: 'Keyword',
      icon: <Search className="w-4 h-4 text-sky-500" />,
      desc: 'Verify text in response body',
    },
    {
      id: 'ping',
      label: 'Ping (ICMP)',
      icon: <Radio className="w-4 h-4 text-violet-500" />,
      desc: 'Packet availability & latency',
    },
    {
      id: 'port',
      label: 'TCP Port',
      icon: <Terminal className="w-4 h-4 text-amber-500" />,
      desc: 'Database, Redis, SSH socket',
    },
    {
      id: 'dns',
      label: 'DNS Record',
      icon: <Network className="w-4 h-4 text-cyan-500" />,
      desc: 'A, CNAME, MX resolution',
    },
    {
      id: 'heartbeat',
      label: 'Heartbeat',
      icon: <Key className="w-4 h-4 text-pink-500" />,
      desc: 'Cron job dead-man switch',
    },
    {
      id: 'ssl',
      label: 'SSL Expiry',
      icon: <Lock className="w-4 h-4 text-emerald-500" />,
      desc: 'TLS certificate validity',
    },
  ];

  const getTargetPlaceholder = () => {
    switch (monitorType) {
      case 'port':
        return 'e.g. db.internal:5432 or 1.2.3.4:22';
      case 'ping':
        return 'e.g. 1.1.1.1 or api.example.com';
      case 'dns':
        return 'e.g. pulsewatch.app or api.internal';
      case 'heartbeat':
        return 'cron:backup-nightly';
      default:
        return 'https://example.com/api/health';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#111A2E] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 my-8 text-slate-900 dark:text-slate-100 transition-all max-h-[92vh] overflow-y-auto">
        {/* 3D Synthetic Deployment Animation Overlay */}
        {saving && (
          <ThreeDDeployingOverlay
            monitorName={name.trim() || target.trim()}
            target={target.trim()}
            regions={regions}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Zap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Add New Monitor</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure health probes with sub-second failover checks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive 3D Protocol Hologram & Scanner */}
        <div className="mt-4">
          <ThreeDProtocolHologram
            type={monitorType}
            isTesting={testing}
            testResult={testResult}
            className="h-28 w-full border border-slate-200/80 dark:border-slate-800/80 bg-slate-900/[0.03] dark:bg-slate-950/40 shadow-inner"
          />
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Step 1: Monitor Type Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Monitor Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {typeOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setMonitorType(opt.id)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                    monitorType === opt.id
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                    {opt.icon}
                    <span>{opt.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Target & Friendly Name */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Endpoint or Hostname <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={getTargetPlaceholder()}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production API Gateway"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* DNS Specific Fields if Type is DNS */}
          {monitorType === 'dns' && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Record Type
                </label>
                <select
                  value={dnsRecordType}
                  onChange={(e) => setDnsRecordType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white font-mono"
                >
                  <option value="A">A Record (IPv4)</option>
                  <option value="AAAA">AAAA Record (IPv6)</option>
                  <option value="CNAME">CNAME Record</option>
                  <option value="MX">MX Mail Record</option>
                  <option value="TXT">TXT Verification</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Expected Resolved Value
                </label>
                <input
                  type="text"
                  placeholder="e.g. 104.21.48.12"
                  value={dnsExpectedValue}
                  onChange={(e) => setDnsExpectedValue(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Step 3: Check Interval Slider */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>Check Frequency</span>
              </span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {interval >= 60 ? `${interval / 60} min (${interval}s)` : `${interval} seconds`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[
                { s: 30, label: '30s (Pro)' },
                { s: 60, label: '1m' },
                { s: 180, label: '3m' },
                { s: 300, label: '5m' },
                { s: 900, label: '15m' },
              ].map((item) => (
                <button
                  key={item.s}
                  type="button"
                  onClick={() => setInterval(item.s)}
                  className={`flex-1 py-1 text-[11px] font-mono rounded border transition-all ${
                    interval === item.s
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Multi-Region Edge Probes */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Multi-Region Consensus Probes
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'US-East (N. Virginia)', label: 'US-East' },
                { id: 'EU-Central (Frankfurt)', label: 'EU-Central' },
                { id: 'AP-South (Singapore)', label: 'AP-South' },
              ].map((reg) => (
                <label
                  key={reg.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                    regions.includes(reg.id)
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={regions.includes(reg.id)}
                    onChange={() => handleToggleRegion(reg.id)}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>{reg.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Test Now Button & Live Result */}
          <div className="pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestPreview}
                disabled={testing || !target.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 disabled:opacity-50 transition-colors"
              >
                {testing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>Test Now (Preview Probe)</span>
              </button>

              <span className="text-[11px] text-slate-400">Verifies endpoint live before saving</span>
            </div>

            {testResult && testResult.tested && (
              <div
                className={`mt-2 p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                  testResult.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>{testResult.ok ? 'Probe Succeeded' : 'Probe Failed'}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span>HTTP {testResult.status_code || '--'}</span>
                  <span>{testResult.latency_ms} ms</span>
                  {testResult.error && (
                    <span className="max-w-[150px] truncate text-red-400">{testResult.error}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Advanced Settings */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              <span>Advanced Options (JSONPath, Headers, Retries, Escalation)</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      HTTP Method
                    </label>
                    <select
                      value={httpMethod}
                      onChange={(e) => setHttpMethod(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="HEAD">HEAD</option>
                      <option value="PUT">PUT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Expected HTTP Status
                    </label>
                    <input
                      type="number"
                      value={expectedStatus}
                      onChange={(e) => setExpectedStatus(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* JSONPath Assertion */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      JSONPath (e.g. data.status)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. health.status"
                      value={jsonPath}
                      onChange={(e) => setJsonPath(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Expected JSON Value
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. operational or ok"
                      value={jsonExpectedValue}
                      onChange={(e) => setJsonExpectedValue(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Timeout (ms)
                    </label>
                    <input
                      type="number"
                      value={timeoutMs}
                      onChange={(e) => setTimeoutMs(Number(e.target.value))}
                      step={500}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Escalate Alert After (Seconds)
                    </label>
                    <input
                      type="number"
                      value={escalateAfterS}
                      onChange={(e) => setEscalateAfterS(Number(e.target.value))}
                      step={60}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Custom Headers (JSON)
                  </label>
                  <input
                    type="text"
                    value={headersJsonStr}
                    onChange={(e) => setHeadersJsonStr(e.target.value)}
                    placeholder='{"Authorization": "Bearer key", "User-Agent": "pingbud.us"}'
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#16223B] border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !canEdit}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all ${
                canEdit
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{canEdit ? (saving ? 'Creating...' : 'Save & Start Monitoring') : 'Read-Only (Viewer Role)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
