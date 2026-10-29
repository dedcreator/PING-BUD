import uuid
import hashlib
import secrets
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('owner', 'Workspace Owner (Full Control & Billing)'),
        ('editor', 'DevOps Editor (Manage Monitors & Alerts)'),
        ('viewer', 'Observer / Viewer (Read Only)'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='owner')
    totp_secret = models.CharField(max_length=64, blank=True, default='')
    totp_enabled = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=30, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

    @property
    def can_edit(self):
        return self.role in ('owner', 'editor')

    @property
    def is_owner(self):
        return self.role == 'owner'


class Project(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects', null=True, blank=True)
    name = models.CharField(max_length=120, default="Production Infrastructure")
    slug = models.SlugField(max_length=120, unique=True, default="production")
    custom_domain = models.CharField(max_length=255, blank=True, null=True, help_text="e.g. status.yourdomain.com (Pro feature)")
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Monitor(models.Model):
    TYPE_CHOICES = [
        ('http', 'HTTP(S) Endpoint'),
        ('keyword', 'Keyword Presence'),
        ('ping', 'Ping (ICMP)'),
        ('port', 'TCP / Port Check'),
        ('heartbeat', 'Heartbeat / Cron Job'),
        ('ssl', 'SSL Expiry & Validity'),
        ('dns', 'DNS Record'),
    ]

    STATE_CHOICES = [
        ('up', 'Operational (Up)'),
        ('down', 'Major Outage (Down)'),
        ('suspect', 'Degraded / Suspect'),
        ('maintenance', 'Maintenance'),
        ('paused', 'Paused'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='monitors', null=True, blank=True)
    name = models.CharField(max_length=150)
    monitor_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='http')
    target = models.CharField(max_length=500, help_text="URL, IP, hostname or port")
    interval_seconds = models.PositiveIntegerField(default=60, help_text="Interval in seconds (30s on Pro)")
    timeout_ms = models.PositiveIntegerField(default=5000, help_text="Timeout in milliseconds")
    retries = models.PositiveIntegerField(default=2)
    
    # HTTP and advanced options
    http_method = models.CharField(max_length=10, default='GET')
    expected_status = models.PositiveIntegerField(default=200)
    keyword = models.CharField(max_length=255, blank=True, null=True)
    keyword_type = models.CharField(max_length=20, choices=[('contains', 'Contains'), ('not_contains', 'Does Not Contain')], default='contains')
    headers_json = models.JSONField(default=dict, blank=True)
    request_body = models.TextField(blank=True, null=True)
    
    # DNS check options (Phase v1)
    dns_record_type = models.CharField(max_length=10, default='A', blank=True)
    dns_expected_value = models.CharField(max_length=255, blank=True, default='')

    # JSON assertion options (Phase v1)
    json_path = models.CharField(max_length=150, blank=True, default='')
    json_expected_value = models.CharField(max_length=255, blank=True, default='')

    # Multi-region probes (Phase v2 / Pro)
    regions = models.JSONField(default=list, blank=True)

    # Escalation & quiet hours
    quiet_start = models.CharField(max_length=10, blank=True, default='')
    quiet_end = models.CharField(max_length=10, blank=True, default='')
    escalate_after_s = models.PositiveIntegerField(default=600, help_text="Notify secondary channel after X seconds")

    # State tracking
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='up')
    paused = models.BooleanField(default=False)
    heartbeat_token = models.CharField(max_length=64, default=uuid.uuid4, unique=True)
    last_checked_at = models.DateTimeField(null=True, blank=True)
    next_run_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-state', '-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_state_display()})"

    @property
    def is_up(self):
        return self.state == 'up'

    @property
    def is_down(self):
        return self.state == 'down'

    @property
    def is_paused(self):
        return self.state == 'paused' or self.paused

    def calculate_uptime(self, hours=24):
        cutoff = timezone.now() - timezone.timedelta(hours=hours)
        checks = self.checks.filter(timestamp__gte=cutoff)
        total = checks.count()
        if total == 0:
            return 100.0 if self.state == 'up' else 0.0
        up_count = checks.filter(ok=True).count()
        return round((up_count / total) * 100, 2)

    def average_latency(self, hours=24):
        cutoff = timezone.now() - timezone.timedelta(hours=hours)
        checks = self.checks.filter(timestamp__gte=cutoff, ok=True)
        if not checks.exists():
            return 0
        avg = checks.aggregate(models.Avg('latency_ms'))['latency_ms__avg']
        return round(avg or 0, 1)


class Check(models.Model):
    monitor = models.ForeignKey(Monitor, on_delete=models.CASCADE, related_name='checks')
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    ok = models.BooleanField(default=True)
    latency_ms = models.PositiveIntegerField(default=0)
    status_code = models.IntegerField(null=True, blank=True)
    error = models.TextField(blank=True, default='')
    region = models.CharField(max_length=30, default='US-East (N. Virginia)')

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['monitor', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.monitor.name} - {'OK' if self.ok else 'FAIL'} ({self.latency_ms}ms)"


class Incident(models.Model):
    monitor = models.ForeignKey(Monitor, on_delete=models.CASCADE, related_name='incidents')
    started_at = models.DateTimeField(default=timezone.now)
    resolved_at = models.DateTimeField(null=True, blank=True)
    cause = models.TextField(default="Connection timeout or HTTP 5xx response")
    auto = models.BooleanField(default=True)
    ai_summary = models.TextField(blank=True, default='', help_text="AI Root-Cause summary (Pro feature)")

    class Meta:
        ordering = ['-started_at']

    @property
    def is_active(self):
        return self.resolved_at is None

    @property
    def duration_minutes(self):
        end = self.resolved_at or timezone.now()
        diff = end - self.started_at
        return max(1, int(diff.total_seconds() // 60))

    def __str__(self):
        status = "Active" if self.is_active else "Resolved"
        return f"Incident on {self.monitor.name} [{status}]"


class AlertChannel(models.Model):
    CHANNEL_TYPES = [
        ('email', 'Email (SMTP)'),
        ('slack', 'Slack Incoming Webhook'),
        ('discord', 'Discord Webhook'),
        ('telegram', 'Telegram Bot'),
        ('teams', 'Microsoft Teams Webhook'),
        ('webhook', 'Custom HTTP Webhook'),
        ('sms_whatsapp', 'SMS / WhatsApp (Pro)'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='alert_channels', null=True, blank=True)
    name = models.CharField(max_length=100)
    kind = models.CharField(max_length=30, choices=CHANNEL_TYPES, default='email')
    config = models.JSONField(default=dict, help_text="Webhook URL, email address, or token credentials")
    enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.get_kind_display()})"


class MaintenanceWindow(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='maintenance_windows', null=True, blank=True)
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    monitor_ids = models.JSONField(default=list, help_text="List of monitor IDs silenced during maintenance")
    silence_alerts = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-starts_at']

    @property
    def is_currently_active(self):
        now = timezone.now()
        return self.starts_at <= now <= self.ends_at

    def __str__(self):
        return f"{self.title} ({self.starts_at.date()})"


class StatusPageConfig(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='status_page_config')
    company_name = models.CharField(max_length=120, default="PulseWatch Infrastructure")
    logo_url = models.CharField(max_length=300, blank=True, default='')
    custom_domain = models.CharField(max_length=200, blank=True, default='', help_text="e.g. status.company.com")
    headline = models.CharField(max_length=200, default="Real-time uptime and incident monitoring")
    announcement_text = models.TextField(blank=True, default='')
    show_uptime_history = models.BooleanField(default=True)
    allow_subscriptions = models.BooleanField(default=True)
    theme = models.CharField(max_length=20, default='system', choices=[('light', 'Light'), ('dark', 'Dark'), ('system', 'System Default')])
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Status Page for {self.company_name}"


class StatusPost(models.Model):
    KIND_CHOICES = [
        ('investigating', 'Investigating'),
        ('identified', 'Identified'),
        ('monitoring', 'Monitoring Fix'),
        ('resolved', 'Resolved'),
        ('maintenance', 'Scheduled Maintenance'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='status_posts', null=True, blank=True)
    title = models.CharField(max_length=200)
    body = models.TextField()
    kind = models.CharField(max_length=30, choices=KIND_CHOICES, default='investigating')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.kind})"


class CertInfo(models.Model):
    monitor = models.OneToOneField(Monitor, on_delete=models.CASCADE, related_name='cert_info')
    issuer = models.CharField(max_length=200, default="Let's Encrypt Authority X3")
    valid_to = models.DateTimeField()
    last_checked = models.DateTimeField(default=timezone.now)

    @property
    def days_remaining(self):
        diff = self.valid_to - timezone.now()
        return max(0, diff.days)

    def __str__(self):
        return f"SSL for {self.monitor.name}: {self.days_remaining} days left"


class ApiKey(models.Model):
    SCOPE_CHOICES = [
        ('read', 'Read Only (View Monitors, Incidents & Stats)'),
        ('write', 'Read & Write (Trigger Checks, Create/Edit Monitors)'),
        ('admin', 'Full Administrator (Manage Team, Billing & Delete)'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_keys')
    name = models.CharField(max_length=100, default="Default API Key")
    key_prefix = models.CharField(max_length=16, default="pw_live_")
    key_hash = models.CharField(max_length=64, unique=True)
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default='write')
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.key_prefix}...)"

    @classmethod
    def generate_key(cls, user, name="Default API Key", scope="write"):
        raw_token = secrets.token_urlsafe(32)
        prefix = f"pw_live_{raw_token[:8]}"
        hashed = hashlib.sha256(raw_token.encode()).hexdigest()
        key_obj = cls.objects.create(
            user=user,
            name=name,
            key_prefix=prefix,
            key_hash=hashed,
            scope=scope,
        )
        return key_obj, f"pw_live_{raw_token}"


class ProSubscription(models.Model):
    """
    Ultra-affordable Pro Plan in Naira (₦2,000/mo or ₦5,000/mo for Team) to make PulseWatch
    accessible to indie developers, agencies, and startups while remaining 100% open source.
    """
    name = models.CharField(max_length=100, default="PulseWatch Indie Pro")
    is_active = models.BooleanField(default=True)
    price_monthly = models.DecimalField(max_digits=12, decimal_places=2, default=2000.00)
    price_yearly = models.DecimalField(max_digits=12, decimal_places=2, default=20000.00)
    team_price_monthly = models.DecimalField(max_digits=12, decimal_places=2, default=5000.00)
    team_price_yearly = models.DecimalField(max_digits=12, decimal_places=2, default=50000.00)
    currency = models.CharField(max_length=10, default="NGN")
    currency_symbol = models.CharField(max_length=10, default="₦")
    tier_tag = models.CharField(max_length=50, default="Indie Pro (₦2,000/mo)")
    active_tier = models.CharField(max_length=30, default="indie_pro", choices=[('community', 'Community Free'), ('indie_pro', 'Indie Pro (₦2,000/mo)'), ('team_pro', 'Team Pro (₦5,000/mo)')])
    features_json = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (₦{self.price_monthly}/mo)"


class Invoice(models.Model):
    invoice_id = models.CharField(max_length=64, unique=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='invoices', null=True, blank=True)
    plan_name = models.CharField(max_length=100, default="PulseWatch Indie Pro")
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=2000.00)
    currency = models.CharField(max_length=10, default="NGN")
    currency_symbol = models.CharField(max_length=10, default="₦")
    status = models.CharField(max_length=30, default="Paid")
    payment_method = models.CharField(max_length=100, default="Paystack / Debit Card (•••• 4242)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.invoice_id} - ₦{self.amount} ({self.status})"


class Donation(models.Model):
    donor_name = models.CharField(max_length=100, default="Anonymous Supporter")
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=2000.00)
    currency = models.CharField(max_length=10, default="NGN")
    message = models.TextField(blank=True, default="Keep up the great open source work!")
    source = models.CharField(max_length=50, default="Paystack / Bank Transfer")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"₦{self.amount} from {self.donor_name}"
