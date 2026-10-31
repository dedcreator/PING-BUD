from django.urls import path
from . import api_views

urlpatterns = [
    # Auth & RBAC
    path('api/auth/register/', api_views.auth_register, name='api_auth_register'),
    path('api/auth/login/', api_views.auth_login, name='api_auth_login'),
    path('api/auth/google/', api_views.auth_google, name='api_auth_google'),
    path('api/auth/link-google/', api_views.auth_link_google, name='api_auth_link_google'),
    path('api/auth/forgot-password/', api_views.auth_forgot_password, name='api_auth_forgot_password'),
    path('api/auth/reset-password/', api_views.auth_reset_password, name='api_auth_reset_password'),
    path('api/auth/me/', api_views.auth_me, name='api_auth_me'),
    path('api/auth/totp/setup/', api_views.totp_setup, name='api_totp_setup'),
    path('api/auth/totp/verify/', api_views.totp_verify_activate, name='api_totp_verify'),
    path('api/auth/totp/disable/', api_views.totp_disable, name='api_totp_disable'),
    path('api/auth/role-switch/', api_views.auth_switch_role, name='api_auth_switch_role'),
    path('api/auth/demo-user/', api_views.demo_switch_tier_user, name='api_demo_switch_user'),
    path('api/email/test/', api_views.send_test_email, name='api_send_test_email'),

    # Projects / Workspaces
    path('api/projects/', api_views.projects_list_create, name='api_projects'),
    path('api/projects/<int:pk>/', api_views.project_detail, name='api_project_detail'),

    # Dashboard & overview
    path('api/overview/', api_views.overview, name='api_overview'),
    
    # Monitors
    path('api/monitors/', api_views.monitors_list_create, name='api_monitors'),
    path('api/monitors/test/', api_views.test_target_preview, name='api_monitors_test'),
    path('api/monitors/<int:pk>/', api_views.monitor_detail, name='api_monitor_detail'),
    path('api/monitors/<int:pk>/edge-breakdown/', api_views.monitor_edge_breakdown, name='api_monitor_edge_breakdown'),
    path('api/monitors/<int:pk>/pause/', api_views.monitor_pause, name='api_monitor_pause'),
    path('api/monitors/<int:pk>/resume/', api_views.monitor_resume, name='api_monitor_resume'),
    path('api/monitors/<int:pk>/check-now/', api_views.monitor_check_now, name='api_monitor_check_now'),
    path('api/monitors/<int:pk>/checks/', api_views.monitor_checks_timeseries, name='api_monitor_checks'),
    
    # Incidents & Export
    path('api/incidents/', api_views.incidents_list, name='api_incidents'),
    path('api/export/incidents/', api_views.export_incidents, name='api_export_incidents'),
    path('api/sla/report/', api_views.sla_compliance_report, name='api_sla_report'),
    
    # Channels
    path('api/channels/', api_views.channels_list_create, name='api_channels'),
    path('api/channels/<int:pk>/', api_views.channel_detail, name='api_channel_detail'),
    path('api/channels/<int:pk>/test/', api_views.channel_test, name='api_channel_test'),

    # Maintenance Windows
    path('api/maintenance/', api_views.maintenance_list_create, name='api_maintenance'),
    path('api/maintenance/<int:pk>/', api_views.maintenance_delete, name='api_maintenance_delete'),

    # API Keys
    path('api/api-keys/', api_views.api_keys_list_create, name='api_api_keys'),
    path('api/api-keys/<int:pk>/', api_views.api_key_delete, name='api_api_key_delete'),
    
    # Status Page & Branding Config
    path('api/status-page/config/', api_views.status_page_config, name='api_status_page_config'),
    path('api/status-page/subscribe/', api_views.subscribe_status_page, name='api_status_page_subscribe'),
    path('api/status-page/badge.svg', api_views.status_badge_svg, name='api_status_badge_svg'),
    path('api/status-page/posts/', api_views.status_page_posts, name='api_status_page_posts'),
    path('api/status-page/', api_views.public_status_page, name='api_status_page'),
    path('api/status-page/<slug:slug>/', api_views.public_status_page, name='api_status_page_slug'),
    
    # Pro Plan, Instant Bank Billing & Invoices
    path('api/pro/', api_views.pro_info_and_checkout, name='api_pro_info_and_checkout'),
    path('api/billing/', api_views.billing_overview, name='api_billing_overview'),
    path('api/billing/checkout/', api_views.bachs_create_checkout, name='api_direct_checkout'),
    path('api/billing/bachs-checkout/', api_views.bachs_create_checkout, name='api_bachs_checkout'),
    path('api/billing/webhook/', api_views.bachs_webhook, name='api_direct_webhook'),
    path('api/billing/bachs-webhook/', api_views.bachs_webhook, name='api_bachs_webhook'),
    
    # Prometheus Metrics & SVG Badge
    path('metrics', api_views.prometheus_metrics, name='api_prometheus_metrics'),
    path('badge/<int:pk>.svg', api_views.monitor_badge_svg, name='api_badge_svg'),

    # Cron Heartbeat
    path('hb/<str:token>/', api_views.heartbeat_ping, name='api_heartbeat_ping'),

    # Security & Compliance Audit Logs
    path('api/audit-logs/export/', api_views.audit_logs_export, name='api_audit_logs_export'),
    path('api/audit-logs/', api_views.audit_logs_list, name='api_audit_logs'),

    # Feedback & Issue Reporting
    path('api/feedback/', api_views.api_submit_feedback, name='api_submit_feedback'),
]
