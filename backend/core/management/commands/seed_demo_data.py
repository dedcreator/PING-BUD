import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth.models import User
from core.models import (
    Project, Monitor, Check, Incident, AlertChannel, StatusPost,
    CertInfo, ProSubscription, Donation, UserProfile, ApiKey,
    MaintenanceWindow, StatusPageConfig, Invoice
)


class Command(BaseCommand):
    help = 'Seeds realistic high-class SaaS demo data for PulseWatch'

    def handle(self, *args, **options):
        self.stdout.write("Seeding PulseWatch high-class SaaS demo data...")

        # 1. Team Users & Roles
        users_spec = [
            ("owner", "admin@pulsewatch.dev", "owner", "Alex (Founder & Infra Lead)"),
            ("editor", "devops@pulsewatch.dev", "editor", "Jordan (DevOps Engineer)"),
            ("viewer", "observer@pulsewatch.dev", "viewer", "Taylor (Support & QA)"),
        ]

        for username, email, role, full_name in users_spec:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={"email": email, "first_name": full_name.split()[0], "last_name": full_name.split()[-1]}
            )
            if created:
                user.set_password("pulsewatch123")
                user.save()
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = role
            profile.save()

        owner_user = User.objects.get(username="owner")

        # 2. Workspaces / Projects
        project_prod, _ = Project.objects.get_or_create(
            slug="production",
            defaults={
                "owner": owner_user,
                "name": "Production Cloud & Services",
                "custom_domain": "status.pulsewatch.dev",
                "is_public": True,
            }
        )
        project_staging, _ = Project.objects.get_or_create(
            slug="staging",
            defaults={
                "owner": owner_user,
                "name": "Staging & Pre-release Cluster",
                "custom_domain": "staging-status.pulsewatch.dev",
                "is_public": False,
            }
        )

        # Status Page Config
        StatusPageConfig.objects.get_or_create(
            project=project_prod,
            defaults={
                "company_name": "PulseWatch Cloud",
                "headline": "Real-time edge uptime & global probe telemetry",
                "custom_domain": "status.pulsewatch.dev",
                "announcement_text": "All global probe nodes operational. Maintenance completed in EU-Central.",
                "theme": "system"
            }
        )

        # 3. API Keys
        if not ApiKey.objects.filter(user=owner_user).exists():
            ApiKey.generate_key(owner_user, name="CI/CD GitHub Actions Deployment Key", scope="write")
            ApiKey.generate_key(owner_user, name="Grafana Telemetry Read Key", scope="read")

        # Clear existing monitors for clean reload
        Monitor.objects.all().delete()
        Incident.objects.all().delete()
        AlertChannel.objects.all().delete()
        StatusPost.objects.all().delete()
        Donation.objects.all().delete()
        MaintenanceWindow.objects.all().delete()

        now = timezone.now()

        # 4. Monitors (variety of types: http, keyword, port, ping, heartbeat, ssl, dns)
        monitors_spec = [
            {
                "project": project_prod,
                "name": "Main Production Web App",
                "monitor_type": "http",
                "target": "https://pulsewatch.app",
                "state": "up",
                "interval_seconds": 60,
                "timeout_ms": 3000,
                "expected_status": 200,
                "base_latency": 32,
                "regions": ["US-East", "EU-Central", "AP-South"],
            },
            {
                "project": project_prod,
                "name": "Public REST & GraphQL Gateway",
                "monitor_type": "http",
                "target": "https://api.pulsewatch.app/v1/health",
                "state": "up",
                "interval_seconds": 30,
                "timeout_ms": 2500,
                "expected_status": 200,
                "base_latency": 45,
                "regions": ["US-East", "EU-Central"],
            },
            {
                "project": project_prod,
                "name": "OAuth2 Auth & Session Gateway",
                "monitor_type": "http",
                "target": "https://auth.pulsewatch.app/healthz",
                "state": "suspect",
                "interval_seconds": 60,
                "timeout_ms": 4000,
                "expected_status": 200,
                "base_latency": 780,
                "regions": ["US-East"],
            },
            {
                "project": project_prod,
                "name": "Primary Database Read Replica",
                "monitor_type": "port",
                "target": "db-replica.pulsewatch.internal:5432",
                "state": "up",
                "interval_seconds": 60,
                "timeout_ms": 2000,
                "expected_status": 200,
                "base_latency": 14,
                "regions": ["US-East"],
            },
            {
                "project": project_prod,
                "name": "EU Legacy Database & Storage Node",
                "monitor_type": "http",
                "target": "https://eu-db.pulsewatch.internal/status",
                "state": "down",
                "interval_seconds": 60,
                "timeout_ms": 5000,
                "expected_status": 200,
                "base_latency": 0,
                "regions": ["EU-Central"],
            },
            {
                "project": project_prod,
                "name": "Global Edge DNS (A-Record)",
                "monitor_type": "dns",
                "target": "pulsewatch.app",
                "dns_record_type": "A",
                "dns_expected_value": "104.21.48.12",
                "state": "up",
                "interval_seconds": 300,
                "timeout_ms": 3000,
                "expected_status": 200,
                "base_latency": 18,
                "regions": ["US-East", "AP-South"],
            },
            {
                "project": project_prod,
                "name": "Nightly Database Backup Cron Job",
                "monitor_type": "heartbeat",
                "target": "cron:backup-nightly",
                "state": "up",
                "interval_seconds": 86400,
                "timeout_ms": 5000,
                "expected_status": 200,
                "base_latency": 10,
                "regions": ["US-East"],
            },
        ]

        created_monitors = []
        for m_data in monitors_spec:
            base_lat = m_data.pop("base_latency")
            regions = m_data.pop("regions", ["US-East"])
            mon = Monitor.objects.create(
                last_checked_at=now,
                next_run_at=now + timezone.timedelta(seconds=m_data["interval_seconds"]),
                regions=regions,
                **m_data
            )
            created_monitors.append((mon, base_lat))

            # Add SSL info for HTTPS targets
            if mon.target.startswith("https://") or mon.monitor_type == 'ssl':
                CertInfo.objects.create(
                    monitor=mon,
                    issuer="Let's Encrypt Authority R3 (Automated ACME)",
                    valid_to=now + timezone.timedelta(days=78),
                    last_checked=now
                )

        # 5. Populate Historical Checks (60 checks per monitor for beautiful UptimeBar signature)
        for mon, base_lat in created_monitors:
            checks_to_create = []
            for i in range(60):
                chk_time = now - timezone.timedelta(minutes=(60 - i))
                if mon.state == "down":
                    # Down in last 12 checks
                    is_ok = i < 48
                    lat = max(0, base_lat + random.randint(-5, 8)) if is_ok else 0
                    code = 200 if is_ok else 503
                    err = "" if is_ok else "HTTP 503 Service Unavailable: Database replica connection timeout"
                elif mon.state == "suspect":
                    # High latency & degradation in last 8 checks
                    is_ok = True
                    lat = max(0, (base_lat + random.randint(100, 300)) if i >= 52 else random.randint(35, 60))
                    code = 200
                    err = "Slow response / elevated latency" if i >= 52 else ""
                else:
                    is_ok = True
                    lat = max(8, base_lat + random.randint(-4, 12))
                    code = 200
                    err = ""

                checks_to_create.append(Check(
                    monitor=mon,
                    timestamp=chk_time,
                    ok=is_ok,
                    latency_ms=lat,
                    status_code=code,
                    error=err,
                    region="US-East (N. Virginia)" if i % 2 == 0 else "EU-Central (Frankfurt)"
                ))
            Check.objects.bulk_create(checks_to_create)

        # 6. Incidents
        down_mon = next((m for m, _ in created_monitors if m.state == "down"), None)
        if down_mon:
            Incident.objects.create(
                monitor=down_mon,
                started_at=now - timezone.timedelta(minutes=24),
                resolved_at=None,
                cause="HTTP 503 Service Unavailable: Node unresponsive to health probe ping",
                auto=True,
                ai_summary="Automated RCA: Memory saturation triggered kernel OOM-killer on node eu-db-04. Traffic rerouted to secondary fallback cluster."
            )

        # Resolved incident yesterday
        up_mon = created_monitors[0][0]
        Incident.objects.create(
            monitor=up_mon,
            started_at=now - timezone.timedelta(hours=28),
            resolved_at=now - timezone.timedelta(hours=27, minutes=45),
            cause="Cloudflare CDN Edge Intermittent 502 Bad Gateway",
            auto=True,
            ai_summary="Automated RCA: Cloudflare origin shield brief network partition. Resolved after automatic edge BGP re-convergence."
        )

        # 7. Scheduled Maintenance Window
        MaintenanceWindow.objects.create(
            project=project_prod,
            title="Database Cluster OS Kernel Patching & Failover Test",
            description="Scheduled rolling reboot of worker nodes. Minimal expected latency fluctuation; alarms silenced.",
            starts_at=now + timezone.timedelta(hours=14),
            ends_at=now + timezone.timedelta(hours=16),
            monitor_ids=[m[0].id for m in created_monitors[:3]],
            silence_alerts=True
        )

        # 8. Alert Channels
        AlertChannel.objects.create(
            project=project_prod,
            name="Platform Engineering Slack (#alerts-prod)",
            kind="slack",
            config={"webhook_url": "https://hooks.slack.com/services/T00/B00/XXXXX"},
            enabled=True
        )
        AlertChannel.objects.create(
            project=project_prod,
            name="PagerDuty Urgent On-Call (SMS / Voice)",
            kind="sms_whatsapp",
            config={"phone": "+1-555-019-2834", "provider": "Twilio Global"},
            enabled=True
        )
        AlertChannel.objects.create(
            project=project_prod,
            name="Ops Discord Server (#incidents)",
            kind="discord",
            config={"webhook_url": "https://discord.com/api/webhooks/XXXXX"},
            enabled=True
        )
        AlertChannel.objects.create(
            project=project_prod,
            name="Lead SRE Email Dispatch",
            kind="email",
            config={"email": "sre-oncall@pulsewatch.dev"},
            enabled=True
        )

        # 9. Pro Subscription, Invoices & Community Donors (Priced in Naira: ₦2,000 & ₦5,000)
        pro, _ = ProSubscription.objects.update_or_create(
            id=1,
            defaults={
                "name": "PulseWatch Indie Pro",
                "is_active": True,
                "price_monthly": 2000.00,
                "price_yearly": 20000.00,
                "team_price_monthly": 5000.00,
                "team_price_yearly": 50000.00,
                "currency": "NGN",
                "currency_symbol": "₦",
                "tier_tag": "Indie Pro (₦2,000/mo)",
                "active_tier": "indie_pro",
                "features_json": [
                    "⚡ 30-Second Check Intervals (vs 60s/3m community)",
                    "🌍 Multi-Region Global Probes (US-East, EU-Central, AP-South)",
                    "📱 SMS & WhatsApp Outage Alerts via Termii / Twilio",
                    "🤖 Automated AI Incident Root-Cause Analysis (RCA)",
                    "🌐 Custom Domains for Status Pages (status.yourbrand.com)",
                    "🔒 SSL Certificate Expiry Alerts (30d, 14d, 7d)",
                    "📈 1-Year Historical Metric & Incident Data Retention",
                    "🛡️ Priority Webhook Retries & Escalation Policies",
                ]
            }
        )

        Invoice.objects.all().delete()
        Invoice.objects.create(
            invoice_id="INV-2026-8821",
            project=project_prod,
            plan_name="PulseWatch Indie Pro (Monthly)",
            amount=2000.00,
            currency="NGN",
            currency_symbol="₦",
            status="Paid",
            payment_method="Paystack / Mastercard (•••• 4242)",
            created_at=now - timezone.timedelta(days=28)
        )
        Invoice.objects.create(
            invoice_id="INV-2026-9403",
            project=project_prod,
            plan_name="PulseWatch Indie Pro (Monthly)",
            amount=2000.00,
            currency="NGN",
            currency_symbol="₦",
            status="Paid",
            payment_method="Paystack / Mastercard (•••• 4242)",
            created_at=now
        )

        # Donors in Naira
        donors_data = [
            ("Devin R. (Lagos Indie Dev)", 10000.00, "PulseWatch replaced my ₦55,000/mo Pingdom bill!"),
            ("Paytech Engineering", 25000.00, "Monitoring 30 client status pages for basically ₦0. Brilliant!"),
            ("Chidi Okafor", 5000.00, "Love the SQLite WAL zero-maintenance architecture."),
            ("Titi S. (Product Lead)", 5000.00, "Cleanest UI in the self-hosted uptime space."),
        ]
        for name, amt, msg in donors_data:
            Donation.objects.create(
                donor_name=name,
                amount=amt,
                currency="NGN",
                message=msg,
                source="Paystack / Bank Transfer"
            )

        self.stdout.write(self.style.SUCCESS("✓ Successfully seeded high-class SaaS demo data for PulseWatch!"))
