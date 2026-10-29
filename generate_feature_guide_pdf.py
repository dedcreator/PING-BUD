#!/usr/bin/env python3
"""
PulseWatch Platform Feature & Operations Guide Generator
Generates a comprehensive, publication-quality 6-page PDF manual documenting every feature of PulseWatch.
Uses Arial Unicode font for crisp typography and native Naira (₦) symbol rendering.
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register Arial Unicode for full Unicode / Naira glyph support
FONT_PATH = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'
FONT_NAME = 'Helvetica'
FONT_BOLD = 'Helvetica-Bold'
FONT_ITALIC = 'Helvetica-Oblique'

if os.path.exists(FONT_PATH):
    pdfmetrics.registerFont(TTFont('ArialUnicode', FONT_PATH))
    FONT_NAME = 'ArialUnicode'
    FONT_BOLD = 'ArialUnicode'
    FONT_ITALIC = 'ArialUnicode'

# Palette definition
PRIMARY = colors.HexColor('#0D9488')       # Teal 600
PRIMARY_DARK = colors.HexColor('#0F766E')  # Teal 700
PRIMARY_LIGHT = colors.HexColor('#CCFBF1') # Teal 100
DARK = colors.HexColor('#0F172A')          # Slate 900
DARK_MUTED = colors.HexColor('#334155')    # Slate 700
GRAY = colors.HexColor('#64748B')          # Slate 500
LIGHT_BG = colors.HexColor('#F8FAFC')      # Slate 50
BORDER_COLOR = colors.HexColor('#CBD5E1')  # Slate 300
ROSE = colors.HexColor('#E11D48')          # Rose 600
ROSE_BG = colors.HexColor('#FFE4E6')       # Rose 100
EMERALD = colors.HexColor('#059669')       # Emerald 600
EMERALD_BG = colors.HexColor('#D1FAE5')    # Emerald 100
AMBER = colors.HexColor('#D97706')         # Amber 600
AMBER_BG = colors.HexColor('#FEF3C7')      # Amber 100
BLUE = colors.HexColor('#2563EB')          # Blue 600
BLUE_BG = colors.HexColor('#DBEAFE')       # Blue 100


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render total page count
    alongside professional running headers and footers.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        self.setFont(FONT_NAME, 8)
        self.setFillColor(GRAY)

        # Skip running header on cover / page 1
        if self._pageNumber > 1:
            self.drawString(45, 11 * 72 - 32, "PulseWatch (pingbud.us) — Complete Platform Feature & Operations Guide")
            self.drawRightString(8.5 * 72 - 45, 11 * 72 - 32, "Release 2.0 | SRE Manual")
            self.setStrokeColor(BORDER_COLOR)
            self.setLineWidth(0.5)
            self.line(45, 11 * 72 - 36, 8.5 * 72 - 45, 11 * 72 - 36)

        # Footer (all pages)
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.5)
        self.line(45, 38, 8.5 * 72 - 45, 38)

        self.drawString(45, 26, "PulseWatch SRE • Single-Node SQLite WAL (<120MB RAM) • Open Source (MIT) • Bachs ₦2,000/mo")
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(8.5 * 72 - 45, 26, page_str)
        self.restoreState()


def build_pdf(filename="PulseWatch_Platform_Feature_Guide.pdf"):
    # Page setup: printable width = 612 - 90 = 522 pt
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=45,
        rightMargin=45,
        topMargin=45,
        bottomMargin=45
    )

    base_styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=base_styles['Normal'],
        fontName=FONT_BOLD,
        fontSize=20,
        leading=24,
        textColor=DARK,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=base_styles['Normal'],
        fontName=FONT_NAME,
        fontSize=10.5,
        leading=14,
        textColor=PRIMARY,
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=base_styles['Normal'],
        fontName=FONT_BOLD,
        fontSize=13,
        leading=16,
        textColor=DARK,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=base_styles['Normal'],
        fontName=FONT_BOLD,
        fontSize=9.5,
        leading=13,
        textColor=PRIMARY_DARK,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=base_styles['Normal'],
        fontName=FONT_NAME,
        fontSize=8.5,
        leading=11.5,
        textColor=DARK_MUTED,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=base_styles['Normal'],
        fontName=FONT_NAME,
        fontSize=8,
        leading=11,
        textColor=DARK_MUTED,
        leftIndent=10,
        firstLineIndent=-7,
        spaceAfter=2
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=base_styles['Normal'],
        fontName=FONT_NAME,
        fontSize=7.8,
        leading=10.8,
        textColor=DARK,
    )

    tbl_header_style = ParagraphStyle(
        'TblHeader',
        parent=base_styles['Normal'],
        fontName=FONT_BOLD,
        fontSize=7.8,
        leading=10,
        textColor=colors.white
    )

    tbl_cell_style = ParagraphStyle(
        'TblCell',
        parent=base_styles['Normal'],
        fontName=FONT_NAME,
        fontSize=7.3,
        leading=9.8,
        textColor=DARK_MUTED
    )

    tbl_cell_bold = ParagraphStyle(
        'TblCellBold',
        parent=base_styles['Normal'],
        fontName=FONT_BOLD,
        fontSize=7.3,
        leading=9.8,
        textColor=DARK
    )

    def callout_box(text, bg_color=LIGHT_BG, border_color=PRIMARY, title=None, width=522):
        content = []
        if title:
            content.append(Paragraph(f"<b>{title}</b>", ParagraphStyle('CTitle', parent=callout_style, fontName=FONT_BOLD, textColor=border_color, spaceAfter=2)))
        content.append(Paragraph(text, callout_style))
        t = Table([[content]], colWidths=[width])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg_color),
            ('BOX', (0, 0), (-1, -1), 0.75, border_color),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        return t

    story = []

    # =========================================================================
    # PAGE 1: COVER, EXECUTIVE SUMMARY & SYSTEM MODULES MAP
    # =========================================================================
    story.append(Paragraph("PulseWatch (pingbud.us)", title_style))
    story.append(Paragraph("Complete Platform Feature & Operations Guide • Release 2.0 (SRE Edition)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceBefore=0, spaceAfter=8))

    meta_table_data = [
        [
            Paragraph("<b>Document Scope:</b> Comprehensive Feature & Architecture Guide", tbl_cell_style),
            Paragraph("<b>Target Audience:</b> DevOps, SREs, Engineering Leads & Founders", tbl_cell_style),
        ],
        [
            Paragraph("<b>Core Engine:</b> Django 5 + SQLite WAL (<120MB RAM, zero DB overhead)", tbl_cell_style),
            Paragraph("<b>Monetization:</b> Bachs SaaS Gateway (₦2,000 Indie Pro & ₦5,000 Team Pro)", tbl_cell_style),
        ],
        [
            Paragraph("<b>Open Source:</b> 100% MIT License (Free Self-Hosting)", tbl_cell_style),
            Paragraph("<b>Live Platform URL:</b> https://pingbud.us (Commercial Cloud)", tbl_cell_style),
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[261, 261])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("1. Executive Overview & Core Engineering Principles", h1_style))
    story.append(Paragraph(
        "PulseWatch (commercially deployed at <b>pingbud.us</b>) is a high-class, ultra-reliable synthetic uptime monitoring "
        "and incident response platform. It was engineered to solve the prohibitive foreign exchange barrier and high operational "
        "complexity of legacy monitoring tools like Pingdom, Datadog Synthetics, and BetterStack. Where legacy SaaS tools cost "
        "<b>$35 to $80/mo (₦55,000 to ₦125,000/mo)</b>, PulseWatch delivers enterprise-grade multi-region consensus probing, "
        "automated AI root-cause analysis (RCA), and multi-channel alerting for <b>₦2,000/mo ($1.30/mo)</b> or 100% free self-hosting.",
        body_style
    ))
    story.append(Paragraph("• <b>Single-Process SQLite WAL Engine:</b> Eliminates multi-node PostgreSQL, Redis, or managed timeseries database costs. Utilizes SQLite in Write-Ahead Logging mode (<code>PRAGMA journal_mode=WAL;</code>) with concurrent, lock-free readers. Consumes under 120 MB RAM, easily running on a $2.50/mo VPS or free container tier.", bullet_style))
    story.append(Paragraph("• <b>Zero False Alarm SRE Guarantee:</b> Outages are never declared from a single network hiccup. Multi-step retries with exponential jitter and cross-region consensus probes verify failures before triggering notification channels.", bullet_style))
    story.append(Paragraph("• <b>Free Notification Infrastructure:</b> Integrates native 100% free Telegram Bot alerting and Resend email delivery, keeping monthly communication overhead at zero.", bullet_style))
    story.append(Paragraph("• <b>Native Nigerian Naira Billing (Bachs Gateway):</b> Overcomes foreign card blocks with instant Providus Bank transfer virtual accounts (<code>9928341029 Providus Bank</code>) and debit card processing.", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("2. Platform Module & View Architecture Map", h1_style))
    story.append(Paragraph(
        "PulseWatch is organized into clean, dedicated modules accessible via a persistent liquid-glass sidebar:",
        body_style
    ))

    modules_data = [
        [
            Paragraph("Module / Route", tbl_header_style),
            Paragraph("Primary Purpose", tbl_header_style),
            Paragraph("Key Operational Features", tbl_header_style),
        ],
        [
            Paragraph("<b>Operational Dashboard</b><br/><code>/dashboard</code>", tbl_cell_bold),
            Paragraph("Real-time infrastructure health command center.", tbl_cell_style),
            Paragraph("Overall 24h uptime %, average latency ms, active incidents counter, down-first prioritized health probes list, 60-bucket historical bars, latency sparklines, TLS expiry countdowns, ⌘K command palette.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Scheduled Maintenance</b><br/><code>/maintenance</code>", tbl_cell_bold),
            Paragraph("Planned downtime scheduling & SLA protection.", tbl_cell_style),
            Paragraph("Create future maintenance windows, suppress false midnight alerts, protect SLA uptime calculations, and broadcast maintenance notices to public status pages.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Incidents & Post-Mortems</b><br/><code>/incidents</code>", tbl_cell_bold),
            Paragraph("Outage timeline & root-cause analysis.", tbl_cell_style),
            Paragraph("Automated AI Root-Cause Analysis (RCA), Mean Time to Resolution (MTTR) calculation, filter active vs. resolved incidents, 1-click Export CSV and Export JSON for client SLA audits.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Alert Channels & Routing</b><br/><code>channels view</code>", tbl_cell_bold),
            Paragraph("Multi-channel notification routing.", tbl_cell_style),
            Paragraph("Configure free Telegram Bots (@BotFather), Resend email alerts, Slack Incoming Webhooks, Discord embeds, generic webhooks (HMAC-SHA256 signed), and Termii/Twilio SMS.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Billing & Invoices</b><br/><code>bills view</code>", tbl_cell_bold),
            Paragraph("Bachs subscription & payment receipts.", tbl_cell_style),
            Paragraph("Transparent plans (Community ₦0, Indie Pro ₦2,000/mo, Team Pro ₦5,000/mo), Providus Bank instant virtual account transfer, 1-click printable PDF tax invoices, community donation fund.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Workspace Settings</b><br/><code>settings view</code>", tbl_cell_bold),
            Paragraph("Team RBAC, Google OAuth & API keys.", tbl_cell_style),
            Paragraph("Role-Based Access Control (Owner, Editor, Viewer), Link Google / Gmail account for 1-click login, Resend email configuration with live test dispatch, quiet hours scheduler, scoped API keys.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Public Status Page</b><br/><code>/status</code>", tbl_cell_bold),
            Paragraph("Customer-facing service transparency.", tbl_cell_style),
            Paragraph("Live headline status ('All Systems Operational'), 90-day availability history, active incident updates, custom branding, and custom domain mapping (status.yourcompany.com).", tbl_cell_style),
        ],
    ]

    modules_table = Table(modules_data, colWidths=[110, 140, 272])
    modules_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(modules_table)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: HEALTH MONITOR ENGINE & 7 PROBE PROTOCOLS
    # =========================================================================
    story.append(Paragraph("3. Health Monitoring Engine & The 7 Probe Protocols", h1_style))
    story.append(Paragraph(
        "PulseWatch features a robust, multi-protocol synthetic probing engine capable of validating infrastructure health "
        "across the application, transport, network, and security layers. Each monitor runs on a configurable interval "
        "(10s, 30s, 60s, or custom) and continuously records latency percentiles, uptime percentages, and status history.",
        body_style
    ))

    probes_data = [
        [
            Paragraph("Probe Protocol", tbl_header_style),
            Paragraph("Target Scope", tbl_header_style),
            Paragraph("Configuration Parameters", tbl_header_style),
            Paragraph("Outage Triggers & Failure Detection", tbl_header_style),
        ],
        [
            Paragraph("<b>1. HTTP / HTTPS</b>", tbl_cell_bold),
            Paragraph("Web endpoints, REST APIs, GraphQL, microservices.", tbl_cell_style),
            Paragraph("Methods: GET, POST, HEAD, PUT, PATCH, DELETE.<br/>Custom JSON headers (e.g. <code>Authorization</code>), custom request payload body, expected status code matcher (e.g. 200, 201, 2xx, 3xx).", tbl_cell_style),
            Paragraph("HTTP 4xx/5xx status codes, request timeouts, SSL handshake aborts, truncated responses, DNS failures.", tbl_cell_style),
        ],
        [
            Paragraph("<b>2. Keyword Matcher</b>", tbl_cell_bold),
            Paragraph("Application layer semantic validation.", tbl_cell_style),
            Paragraph("Modes: <code>contains</code> or <code>not_contains</code>.<br/>Regex or plain substring search across full HTTP response body.", tbl_cell_style),
            Paragraph("Catches subtle application failures returning HTTP 200: database connection error strings, maintenance screens, white-screen-of-death, missing UI markers.", tbl_cell_style),
        ],
        [
            Paragraph("<b>3. ICMP Ping</b>", tbl_cell_bold),
            Paragraph("Network host reachability & router availability.", tbl_cell_style),
            Paragraph("Raw socket ICMP echo packets, configurable timeout (1s to 10s), packet count, and loss threshold.", tbl_cell_style),
            Paragraph("BGP routing failures, packet loss >50%, host crashes, severe network latency spikes.", tbl_cell_style),
        ],
        [
            Paragraph("<b>4. TCP Socket</b>", tbl_cell_bold),
            Paragraph("Database & service daemon connectivity.", tbl_cell_style),
            Paragraph("Host and arbitrary port: PostgreSQL (5432), Redis (6379), MySQL (3306), SSH (22), SMTP (587), Kafka (9092).", tbl_cell_style),
            Paragraph("Connection refused (ECONNREFUSED), port timeouts, process crashes, host firewall blocking.", tbl_cell_style),
        ],
        [
            Paragraph("<b>5. TLS / SSL Validity</b>", tbl_cell_bold),
            Paragraph("Certificate validity & expiration warnings.", tbl_cell_style),
            Paragraph("SNI hostname validation. Automatic warning alerts at <b>30, 14, 7, and 1 day</b> before certificate expiration.", tbl_cell_style),
            Paragraph("Expired certificates, untrusted CA root authorities, hostname mismatches, revoked certificates, self-signed certificates.", tbl_cell_style),
        ],
        [
            Paragraph("<b>6. DNS Resolution</b>", tbl_cell_bold),
            Paragraph("Domain Name System record integrity.", tbl_cell_style),
            Paragraph("Record types: A, AAAA, CNAME, MX, TXT.<br/>Expected resolved address matcher, nameserver selection.", tbl_cell_style),
            Paragraph("DNS hijacking, domain registrar expiration, misconfigured nameservers, NXDOMAIN lookup errors.", tbl_cell_style),
        ],
        [
            Paragraph("<b>7. Cron Heartbeat</b>", tbl_cell_bold),
            Paragraph("Background cron jobs & dead-man switch.", tbl_cell_style),
            Paragraph("Unique ingestion endpoint (e.g. <code>curl -fsS /api/heartbeat/&lt;token&gt;/</code>). Configurable grace period (1 to 60 mins).", tbl_cell_style),
            Paragraph("Silent script crashes, OOM killer terminations, hung background worker queues, missed cron schedules.", tbl_cell_style),
        ],
    ]

    probes_table = Table(probes_data, colWidths=[80, 110, 182, 150])
    probes_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('PADDING', (0, 0), (-1, -1), 3.5),
    ]))
    story.append(probes_table)

    story.append(Spacer(1, 8))
    story.append(Paragraph("Multi-Step Verification & Jittered Retry Execution Rules", h2_style))
    story.append(Paragraph(
        "To maintain strict SLA integrity, probe executions adhere to rigorous automated verification standards:",
        body_style
    ))
    story.append(Paragraph("• <b>Asynchronous Non-Blocking Engine:</b> Synthetic probes execute via lightweight background threads with tight socket timeouts (default 5.0s), preventing hung targets from blocking monitoring loops.", bullet_style))
    story.append(Paragraph("• <b>Jittered Retry Loop:</b> When a probe fails, PulseWatch triggers an immediate secondary verification with randomized jitter (1s–3s). Only when consecutive retries fail is the incident pipeline activated.", bullet_style))
    story.append(Paragraph("• <b>Historical 60-Bucket Rollups:</b> Response latencies are aggregated into 60 chronological buckets displayed as sparklines and colored uptime pills (Emerald = Up, Rose = Down, Amber = Degraded).", bullet_style))

    story.append(Spacer(1, 6))
    story.append(callout_box(
        "<b>SSRF Protection Architecture:</b> PulseWatch actively prevents Server-Side Request Forgery. When adding or updating "
        "monitors, the probe dispatcher checks resolved IP addresses against private and cloud-internal subnets (<code>127.0.0.0/8</code>, "
        "<code>10.0.0.0/8</code>, <code>172.16.0.0/12</code>, <code>192.168.0.0/16</code>, and AWS metadata <code>169.254.169.254</code>). "
        "Internal addresses are automatically blocked to prevent probing of host-level infrastructure.",
        bg_color=AMBER_BG, border_color=AMBER, title="SECURITY SURFACE: INTERNAL SUBNET SHIELD"
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: MULTI-REGION CONSENSUS & ALERT CHANNELS
    # =========================================================================
    story.append(Paragraph("4. Multi-Region Consensus Probing", h1_style))
    story.append(Paragraph(
        "Single-node monitoring tools suffer from a fatal flaw: local network blips, ISP routing issues, or CDN edge cache flushes "
        "cause false alarms that wake engineers at 3 AM. PulseWatch solves this through <b>Multi-Region Consensus Probing</b>:",
        body_style
    ))
    story.append(Paragraph("• <b>Global Edge Verification:</b> On Indie Pro and Team Pro tiers, probes originate from multiple geographically distributed nodes (Lagos, London/Frankfurt EU, and US-East).", bullet_style))
    story.append(Paragraph("• <b>Consensus Thresholds:</b> An incident is only declared when at least 2 of 3 (or a majority of edge probes) independently confirm the endpoint is unreachable. If only 1 node fails while others succeed, the incident is tagged as a localized transit blip and suppressed from waking engineers.", bullet_style))
    story.append(Paragraph("• <b>Localized CDN Drop Detection:</b> Enables SREs to distinguish between an actual origin server crash versus an edge routing anomaly affecting only a single geographic region.", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("5. Alert Channels & Multi-Channel Notification Routing", h1_style))
    story.append(Paragraph(
        "PulseWatch decouples health checks from alert routing. Notifications can be configured globally or targeted per monitor:",
        body_style
    ))

    channels_data = [
        [
            Paragraph("Notification Channel", tbl_header_style),
            Paragraph("Carrier / Protocol", tbl_header_style),
            Paragraph("Setup & Parameters", tbl_header_style),
            Paragraph("Delivery Cost", tbl_header_style),
        ],
        [
            Paragraph("<b>Telegram Bot</b>", tbl_cell_bold),
            Paragraph("Telegram Bot API (Direct HTTPS)", tbl_cell_style),
            Paragraph("Enter <code>Bot Token</code> (created via @BotFather) and target <code>Chat ID</code> (group or channel). Markdown alert cards with instant 1-click incident status buttons.", tbl_cell_style),
            Paragraph("<font color='#059669'><b>100% Free Forever</b></font>", tbl_cell_style),
        ],
        [
            Paragraph("<b>Resend Email</b>", tbl_cell_bold),
            Paragraph("Resend REST API (resend.com)", tbl_cell_style),
            Paragraph("Configured with <code>RESEND_API_KEY</code>. Sends formatted HTML incident notices with AI diagnostic summaries and recovery confirmations. Includes live test dispatch in Settings.", tbl_cell_style),
            Paragraph("<font color='#059669'><b>Free Tier (3k/mo)</b></font>", tbl_cell_style),
        ],
        [
            Paragraph("<b>Slack</b>", tbl_cell_bold),
            Paragraph("Incoming Webhook / Block Kit", tbl_cell_style),
            Paragraph("Paste Slack Incoming Webhook URL. Rich colored attachments (Red for Down, Green for Recovered) with latency statistics and affected monitor link.", tbl_cell_style),
            Paragraph("<font color='#059669'><b>100% Free</b></font>", tbl_cell_style),
        ],
        [
            Paragraph("<b>Discord</b>", tbl_cell_bold),
            Paragraph("Discord Server Webhook", tbl_cell_style),
            Paragraph("Paste Discord Channel Webhook URL. Embedded rich alerts featuring timestamp, response code, and root-cause diagnostic preview.", tbl_cell_style),
            Paragraph("<font color='#059669'><b>100% Free</b></font>", tbl_cell_style),
        ],
        [
            Paragraph("<b>Generic Webhook</b>", tbl_cell_bold),
            Paragraph("HTTP POST with HMAC-SHA256", tbl_cell_style),
            Paragraph("Endpoint URL and optional Secret Signing Key. Payloads contain JSON structured event data for CI/CD pipelines, auto-remediation scripts, or PagerDuty automations.", tbl_cell_style),
            Paragraph("<font color='#059669'><b>100% Free</b></font>", tbl_cell_style),
        ],
        [
            Paragraph("<b>SMS / WhatsApp</b>", tbl_cell_bold),
            Paragraph("Termii (Africa) & Twilio", tbl_cell_style),
            Paragraph("API key & sender ID. Dispatches direct SMS to on-call phone numbers for emergency tier-1 production outages.", tbl_cell_style),
            Paragraph("₦3.50/SMS (Pay-as-you-go)", tbl_cell_style),
        ],
    ]

    channels_table = Table(channels_data, colWidths=[90, 110, 222, 100])
    channels_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('PADDING', (0, 0), (-1, -1), 3.5),
    ]))
    story.append(channels_table)

    story.append(Spacer(1, 8))
    story.append(Paragraph("Quiet Hours, Escalation Delays & Notification Hygiene", h2_style))
    story.append(Paragraph(
        "Alert fatigue causes missed outages. PulseWatch includes built-in operational hygiene controls in Workspace Settings:",
        body_style
    ))
    story.append(Paragraph("• <b>Quiet Hours Scheduler:</b> Define a daily quiet period (e.g. 23:00 to 07:00 WAT). Non-critical alerts are buffered until quiet hours end.", bullet_style))
    story.append(Paragraph("• <b>Escalation Policy & Tiered Paging:</b> Configure an escalation delay (e.g. 5 minutes). When an outage begins, PulseWatch first notifies Slack or Telegram. If the incident remains unacknowledged after the threshold, it escalates to phone SMS or high-priority email.", bullet_style))
    story.append(Paragraph("• <b>Automatic Recovery Broadcast:</b> When the probe recovers and succeeds for two consecutive checks, an automatic 'Recovered' notice is dispatched across all channels with the total downtime duration.", bullet_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: AI RCA & SCHEDULED MAINTENANCE
    # =========================================================================
    story.append(Paragraph("6. Automated Incident Management & AI Root-Cause Analysis (RCA)", h1_style))
    story.append(Paragraph(
        "When an outage is verified, PulseWatch transitions immediately into incident response mode. SRE teams access "
        "a centralized incident management center (accessible at <code>/incidents</code>):",
        body_style
    ))
    story.append(Paragraph("• <b>Automated AI Root-Cause Analysis (RCA):</b> An embedded diagnostic engine parses failed HTTP headers, response snippets, network error strings, and TLS handshakes to generate concise, human-readable explanations. For example: <i>'Upstream 502 Bad Gateway: NGINX reverse proxy cannot connect to Gunicorn socket on 127.0.0.1:8000. Process likely terminated due to memory exhaustion.'</i>", bullet_style))
    story.append(Paragraph("• <b>Mean Time to Resolution (MTTR) SRE Metrics:</b> Automatically computes overall and per-monitor MTTR (in minutes), providing engineering management with clear reliability benchmarks across release cycles.", bullet_style))
    story.append(Paragraph("• <b>Incident Search & Filtering:</b> Filter between currently active outages vs. resolved historical incidents, and search incidents instantly by affected service, failure cause, or AI diagnostic summary.", bullet_style))
    story.append(Paragraph("• <b>1-Click Audit Export (CSV & JSON):</b> Download full historical incident logs with timestamps, durations, causes, and post-mortem summaries via <code>/api/incidents/export/?format=csv</code> or <code>json</code> for customer SLA reporting and post-incident reviews.", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("7. Scheduled Maintenance Windows & SLA Protection", h1_style))
    story.append(Paragraph(
        "A critical flaw of basic monitoring services is recording false downtime during planned deployments or database maintenance. "
        "PulseWatch includes a dedicated Scheduled Maintenance subsystem (accessible at <code>/maintenance</code>):",
        body_style
    ))

    maintenance_steps_data = [
        [
            Paragraph("Capability", tbl_header_style),
            Paragraph("How It Operates", tbl_header_style),
            Paragraph("SRE Benefit", tbl_header_style),
        ],
        [
            Paragraph("<b>Alert Suppression</b>", tbl_cell_bold),
            Paragraph("During the window (defined by Start and End timestamps), all Telegram, Email, and Slack notifications are automatically silenced for associated monitors.", tbl_cell_style),
            Paragraph("No false alarms waking on-call engineers during planned midnight database schema migrations or software deployments.", tbl_cell_style),
        ],
        [
            Paragraph("<b>SLA Protection</b>", tbl_cell_bold),
            Paragraph("Downtime occurring within an active maintenance window is tagged as <code>maintenance_downtime</code> and excluded from negative uptime % penalties.", tbl_cell_style),
            Paragraph("Preserves contractual 99.9% uptime SLA commitments for enterprise and government clients.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Public Notice Broadcast</b>", tbl_cell_bold),
            Paragraph("The public status page (<code>/status</code>) dynamically renders a prominent maintenance banner with schedule and estimated completion time.", tbl_cell_style),
            Paragraph("Informs customers and stakeholders in advance, dramatically reducing inbound support tickets.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Granular Targeting</b>", tbl_cell_bold),
            Paragraph("Windows can be applied workspace-wide or scoped to specific monitor subsets (e.g. only Payment API while Authentication API remains active).", tbl_cell_style),
            Paragraph("Prevents masking unrelated outages in unmaintained microservices.", tbl_cell_style),
        ],
    ]

    maint_table = Table(maintenance_steps_data, colWidths=[110, 212, 200])
    maint_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('PADDING', (0, 0), (-1, -1), 3.5),
    ]))
    story.append(maint_table)

    story.append(Spacer(1, 8))
    story.append(callout_box(
        "<b>Maintenance Window Lifecycle:</b> Maintenance windows progress through three automated states: "
        "<b>1. Upcoming:</b> Scheduled in advance, visible on the dashboard and status page. "
        "<b>2. Active:</b> Probes continue checking for data, but notifications are suppressed and SLA calculations are shielded. "
        "<b>3. Past:</b> Automatically completes when the end timestamp expires, with normal alerting immediately restored.",
        bg_color=BLUE_BG, border_color=BLUE, title="OPERATIONAL LIFECYCLE: AUTOMATED TIME GATING"
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: RBAC, GOOGLE AUTH, PASSWORD RECOVERY & BILLING
    # =========================================================================
    story.append(Paragraph("8. Authentication, Team RBAC & Workspace Administration", h1_style))
    story.append(Paragraph(
        "PulseWatch provides multi-user enterprise governance with Role-Based Access Control (RBAC), self-service password recovery, "
        "and Google OAuth integration:",
        body_style
    ))

    rbac_data = [
        [
            Paragraph("Role", tbl_header_style),
            Paragraph("Scope", tbl_header_style),
            Paragraph("Permitted Capabilities", tbl_header_style),
            Paragraph("Enforced Restrictions", tbl_header_style),
        ],
        [
            Paragraph("<b>👑 Owner</b>", tbl_cell_bold),
            Paragraph("Full Administrative Control", tbl_cell_style),
            Paragraph("Manage Bachs billing subscriptions, generate/revoke scoped API keys, invite/remove team members, delete monitors, configure quiet hours, trigger SQLite WAL checkpoints.", tbl_cell_style),
            Paragraph("None (super-administrator).", tbl_cell_style),
        ],
        [
            Paragraph("<b>🛠️ Editor</b>", tbl_cell_bold),
            Paragraph("Read & Write DevOps Access", tbl_cell_style),
            Paragraph("Create, edit, pause, and resume health monitors; schedule maintenance windows; test alert channels; update status page announcements.", tbl_cell_style),
            Paragraph("Cannot alter billing plans, invite owners, revoke admin API keys, or delete the workspace.", tbl_cell_style),
        ],
        [
            Paragraph("<b>👁️ Viewer</b>", tbl_cell_bold),
            Paragraph("Read-Only Stakeholder Access", tbl_cell_style),
            Paragraph("Inspect real-time metrics, probe sparklines, incident logs, public status pages, and export CSV/JSON incident reports.", tbl_cell_style),
            Paragraph("All modification, probe execution, creation, and deletion requests return HTTP 403 Forbidden.", tbl_cell_style),
        ],
    ]

    rbac_table = Table(rbac_data, colWidths=[75, 110, 197, 140])
    rbac_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('PADDING', (0, 0), (-1, -1), 3.5),
    ]))
    story.append(rbac_table)

    story.append(Spacer(1, 6))
    story.append(Paragraph("Identity & Security Subsystems", h2_style))
    story.append(Paragraph("• <b>Self-Service Password Recovery via Resend:</b> Users who misplace credentials can request a password reset from the login screen or modal. A cryptographically signed token (backed by Django's <code>default_token_generator</code>) is dispatched via Resend, allowing secure, verified password updates.", bullet_style))
    story.append(Paragraph("• <b>Google OAuth & Gmail Account Linking:</b> Users can link their Google / Gmail account directly inside Workspace Settings (General tab) for seamless 1-click Google authentication.", bullet_style))
    story.append(Paragraph("• <b>Developer API Keys:</b> Generate scoped API tokens (<code>read</code>, <code>write</code>, <code>admin</code>) for Terraform, GitHub Actions, or automated probe provisioning with standard <code>Authorization: Token &lt;key&gt;</code> headers.", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("9. Billing, Bachs SaaS Gateway & Community Sponsorship", h1_style))
    story.append(Paragraph(
        "PulseWatch breaks the foreign exchange barrier with native <b>Nigerian Naira (NGN)</b> pricing powered by <b>Bachs (bachs.io)</b>:",
        body_style
    ))

    pricing_data = [
        [
            Paragraph("Plan Tier", tbl_header_style),
            Paragraph("Price (NGN)", tbl_header_style),
            Paragraph("Check Frequency", tbl_header_style),
            Paragraph("Included Quotas & Capabilities", tbl_header_style),
        ],
        [
            Paragraph("<b>Community Free</b>", tbl_cell_bold),
            Paragraph("<b>₦0</b> / forever", tbl_cell_style),
            Paragraph("60s to 3 mins", tbl_cell_style),
            Paragraph("Up to 10 monitors, local node probing, Telegram & Slack alerts, 30-day retention, 1 admin seat.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Indie Pro</b>", tbl_cell_bold),
            Paragraph("<b>₦2,000</b> / month", tbl_cell_style),
            Paragraph("⚡ 30 Seconds", tbl_cell_style),
            Paragraph("Up to 50 monitors, 3 global consensus regions (Lagos, US, EU), unlimited AI RCA, 1-year metric retention, 5 team seats, custom status domain.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Team Pro</b>", tbl_cell_bold),
            Paragraph("<b>₦5,000</b> / month", tbl_cell_style),
            Paragraph("🚀 10 Seconds", tbl_cell_style),
            Paragraph("Unlimited monitors, 6 global edge regions, unlimited seats with full RBAC, priority SMS escalation, multi-year retention, white-labeled status pages.", tbl_cell_style),
        ],
    ]

    pricing_table = Table(pricing_data, colWidths=[90, 80, 82, 270])
    pricing_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('PADDING', (0, 0), (-1, -1), 3.5),
    ]))
    story.append(pricing_table)

    story.append(Spacer(1, 6))
    story.append(Paragraph("Bachs Checkout, Printable Invoices & Community Sponsorship", h2_style))
    story.append(Paragraph("• <b>Providus Bank Transfer:</b> Instant virtual account transfer (Account: <code>9928341029 Providus Bank</code>). Automatically upgrades the workspace the moment the transfer is confirmed.", bullet_style))
    story.append(Paragraph("• <b>Debit Card Processing:</b> Seamless debit card checkout via Bachs with 1-click renewal.", bullet_style))
    story.append(Paragraph("• <b>Printable Tax Invoices:</b> Every billing event produces an official, printable PDF tax invoice (e.g. <code>INV-2026-9403</code>) for enterprise accounting and tax audits.", bullet_style))
    story.append(Paragraph("• <b>Open-Source Community Sponsorship:</b> A dedicated donation modal allows community members to sponsor edge probe infrastructure with presets (₦1k, ₦2k, ₦5k, ₦10k) or custom contributions.", bullet_style))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: STATUS PAGES, FREE HOSTING GUIDE & SRE CHEAT SHEET
    # =========================================================================
    story.append(Paragraph("10. Public Status Pages & Custom Domain Branding", h1_style))
    story.append(Paragraph(
        "PulseWatch includes a standalone, high-performance public status page (accessible at <code>/status</code>) "
        "designed to keep users informed during outages and maintain public trust:",
        body_style
    ))
    story.append(Paragraph("• <b>Live Headline Status:</b> Displays 'All Systems Operational' (Emerald) or 'Active Outage Detected' (Rose) with real-time updates.", bullet_style))
    story.append(Paragraph("• <b>Interactive 90-Day Uptime Bars:</b> Daily availability percentage bars with tooltip latency metrics.", bullet_style))
    story.append(Paragraph("• <b>Active Incident Feed & Maintenance Notices:</b> Real-time incident logs with investigator notes and scheduled maintenance broadcasts.", bullet_style))
    story.append(Paragraph("• <b>Custom Domain Mapping:</b> Map status pages to your own domain (e.g. <code>status.yourcompany.com</code>) via a simple CNAME record.", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("11. 100% Free Hosting & Zero-Cost Deployment Blueprint", h1_style))
    story.append(Paragraph(
        "Because of PulseWatch's single-node SQLite WAL architecture (<120MB RAM), it can be hosted 100% free forever:",
        body_style
    ))

    hosting_data = [
        [
            Paragraph("Hosting Platform", tbl_header_style),
            Paragraph("Free Allowance", tbl_header_style),
            Paragraph("Deployment Configuration", tbl_header_style),
            Paragraph("Zero-Downtime Architecture", tbl_header_style),
        ],
        [
            Paragraph("<b>Render.com</b>", tbl_cell_bold),
            Paragraph("Free Web Service (512MB RAM)", tbl_cell_style),
            Paragraph("Connect GitHub repo, Python 3.11, command: <code>gunicorn pulsewatch.wsgi</code>.", tbl_cell_style),
            Paragraph("Since PulseWatch continuously executes synthetic checks, its own outgoing pings prevent Render from spinning down!", tbl_cell_style),
        ],
        [
            Paragraph("<b>Fly.io</b>", tbl_cell_bold),
            Paragraph("Up to 3 free shared-cpu VMs", tbl_cell_style),
            Paragraph("Deploy with <code>fly launch</code> using the included Dockerfile. Attach a 1GB persistent volume for SQLite.", tbl_cell_style),
            Paragraph("Ultra-fast worldwide edge deployment with zero database maintenance.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Koyeb</b>", tbl_cell_bold),
            Paragraph("1 Free Nano Service (512MB RAM)", tbl_cell_style),
            Paragraph("Direct git-push deployment with automatic HTTPS domain.", tbl_cell_style),
            Paragraph("Continuous background execution with zero idle sleep mode.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Neon / Supabase</b>", tbl_cell_bold),
            Paragraph("Free Serverless Postgres (0.5GB)", tbl_cell_style),
            Paragraph("Optional: set <code>DATABASE_URL</code> to connect external managed PostgreSQL.", tbl_cell_style),
            Paragraph("Only required if you prefer managed Postgres over native SQLite WAL.", tbl_cell_style),
        ],
    ]

    hosting_table = Table(hosting_data, colWidths=[90, 110, 162, 160])
    hosting_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(hosting_table)

    story.append(Spacer(1, 6))
    story.append(Paragraph("12. SRE Operational Quick Reference Endpoints", h1_style))

    endpoints_data = [
        [
            Paragraph("Resource / Action", tbl_header_style),
            Paragraph("Method & Endpoint", tbl_header_style),
            Paragraph("Purpose & Expected Response", tbl_header_style),
        ],
        [
            Paragraph("<b>Public Status Page</b>", tbl_cell_bold),
            Paragraph("<code>GET /status</code> or <code>/api/status-page/</code>", tbl_cell_style),
            Paragraph("Public availability dashboard, active incidents, and 90-day uptime bars.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Cron Heartbeat Ingest</b>", tbl_cell_bold),
            Paragraph("<code>GET /api/heartbeat/&lt;token&gt;/</code>", tbl_cell_style),
            Paragraph("Dead-man switch ingest endpoint for background workers and cron jobs.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Prometheus Scrape</b>", tbl_cell_bold),
            Paragraph("<code>GET /metrics/</code>", tbl_cell_style),
            Paragraph("Prometheus-compatible scrape endpoint for Grafana dashboards.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Incident Audit Export</b>", tbl_cell_bold),
            Paragraph("<code>GET /api/incidents/export/?format=csv|json</code>", tbl_cell_style),
            Paragraph("Download full historical outage records, AI root-cause summaries, and MTTR data.", tbl_cell_style),
        ],
        [
            Paragraph("<b>On-Demand Probe Check</b>", tbl_cell_bold),
            Paragraph("<code>POST /api/monitors/&lt;id&gt;/check/</code>", tbl_cell_style),
            Paragraph("Triggers immediate probe execution without waiting for the next scheduled interval.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Password Reset Dispatch</b>", tbl_cell_bold),
            Paragraph("<code>POST /api/auth/forgot-password/</code>", tbl_cell_style),
            Paragraph("Dispatches cryptographic password reset token via Resend.", tbl_cell_style),
        ],
        [
            Paragraph("<b>Bachs Checkout Session</b>", tbl_cell_bold),
            Paragraph("<code>POST /api/bachs/checkout/</code>", tbl_cell_style),
            Paragraph("Generates Providus Bank transfer account and card checkout session.", tbl_cell_style),
        ],
    ]

    endpoints_table = Table(endpoints_data, colWidths=[110, 182, 230])
    endpoints_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('PADDING', (0, 0), (-1, -1), 2.5),
    ]))
    story.append(endpoints_table)

    story.append(Spacer(1, 6))
    story.append(callout_box(
        "<b>System Summary & Production Sign-Off:</b> PulseWatch delivers the highest reliability-to-cost ratio in synthetic monitoring. "
        "With single-node SQLite WAL performance (<120MB RAM), free Telegram Bot and Resend email alerts, automated AI root-cause analysis, "
        "and Bachs Nigerian Naira pricing (₦2,000/mo), it provides world-class SRE infrastructure accessible to everyone. "
        "Source code and updates available at https://pingbud.us.",
        bg_color=EMERALD_BG, border_color=EMERALD, title="PULSEWATCH RELEASE 2.0 • PRODUCTION READY"
    ))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")


if __name__ == '__main__':
    output_pdf = sys.argv[1] if len(sys.argv) > 1 else "PulseWatch_Platform_Feature_Guide.pdf"
    build_pdf(output_pdf)
