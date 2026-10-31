# Architecture, SQLite WAL & Security Controls

Sentiro is engineered under strict principles of ultra-low overhead, predictable latency, and enterprise security.

---

## 1. Single-Node SQLite WAL Engine
Traditional monitoring stacks require multi-node Postgres, Redis clusters, and Prometheus timeseries storage that consume 2GB–8GB of RAM.

Sentiro runs entirely on **SQLite in Write-Ahead Logging mode (`PRAGMA journal_mode=WAL;`)**:
- **RAM Footprint**: Under 120MB total memory consumption.
- **Concurrency**: Lock-free concurrent readers (`WAL` mode allows queries while writes proceed).
- **Durability**: Zero data loss across process restarts with synchronous checkpoints (`PRAGMA synchronous=NORMAL;`).

---

## 2. Multi-Region Consensus Probing (Eliminating False Alarms)
To avoid waking engineers up for single-transit network hiccups:
1. When a probe fails in Region 1 (e.g. Oregon), Sentiro transitions the monitor to `suspect` state instead of declaring an outage.
2. Cross-region quorum probes fire from secondary edge nodes (Frankfurt, London, Lagos).
3. If quorum confirms failure, the outage incident is declared and alerts are dispatched.
4. If secondary probes succeed, the anomaly is recorded as transient jitter and alarms remain quiet.

---

## 3. Security, Audit Logs & Compliance Controls

### Multi-Factor Authentication (TOTP 2FA)
- Time-based One-Time Passwords compatible with Google Authenticator, 1Password, and Apple Keychain.
- Configurable directly in **Workspace Settings** → **Security & Compliance**.

### Immutable Audit Logs
Every administrative and mutating action is recorded in the `core_auditlog` table:
- User ID & IP Address
- Timestamp & Action (`login`, `monitor.create`, `monitor.delete`, `settings.update`, `apikey.create`)
- Detailed change context

### Compliance Exports
- **CSV & JSON Export**: 1-click download via `/api/audit-logs/export/?format=csv` and `/api/audit-logs/export/?format=json`.
- **Retention Control**: Configurable log retention window (30 to 365 days) with automated cleanup.
