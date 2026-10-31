# Contributing to Sentiro (sentiro.xyz)

Thank you for your interest in contributing to **Sentiro** — the ultra-lean, multi-region IT Sentinel uptime and synthetic monitoring platform.

We welcome contributions from SREs, backend developers, frontend designers, and DevOps engineers worldwide!

---

## 🧭 Code of Conduct
All contributors are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please be respectful and constructive in all discussions.

---

## 🛠️ Local Development Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 20+**
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/dedcreator/PING-BUD.git
cd PING-BUD
```

### 2. Backend Setup (Django 5 + REST Framework)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations & seed demo dataset
python manage.py migrate
python manage.py seed_demo_data

# Run tests
python manage.py test

# Start API server on http://localhost:8000
python manage.py runserver 0.0.0.0:8000
```

### 3. Frontend Setup (Next.js 16 + Turbopack + Tailwind CSS)
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:3000** to view Sentiro locally.

---

## 🌿 Git Workflow & Branching
1. Fork the repo and create your branch from `main`:
   ```bash
   git checkout -b feature/amazing-feature
   # or
   git checkout -b fix/issue-description
   ```
2. Write clean, readable code with descriptive commit messages:
   ```bash
   git commit -m "feat(probes): add DNS CAA record validation check"
   ```
3. Ensure backend tests pass and the frontend compiles:
   ```bash
   cd backend && python manage.py test
   cd ../frontend && npm run build
   ```
4. Push to your fork and submit a Pull Request against `main`.

---

## 🧪 Testing Checklist
Before submitting a PR:
- [ ] Django test suite passes without regressions (`python manage.py test`)
- [ ] Next.js Turbopack build finishes cleanly (`npm run build`)
- [ ] API routes enforce proper RBAC (`owner`, `editor`, `viewer`)
- [ ] No hardcoded secrets or credentials are committed

---

## 📬 Questions & Security
- Have a feature idea? Open a [Feature Request](https://github.com/dedcreator/PING-BUD/issues/new?template=feature_request.md).
- Found a bug? Open a [Bug Report](https://github.com/dedcreator/PING-BUD/issues/new?template=bug_report.md).
- Security concerns? Please review [SECURITY.md](SECURITY.md).
