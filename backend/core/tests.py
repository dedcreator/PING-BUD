from django.test import TestCase, Client
from django.urls import reverse
from .models import Monitor, Project, AuditLog

class SentiroCoreTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.project = Project.objects.create(name="Sentiro Core", slug="production", is_public=True)
        self.monitor = Monitor.objects.create(
            project=self.project,
            name="Sentiro Health Probe",
            target="https://sentiro.xyz/api/health",
            monitor_type="http",
            interval_seconds=30
        )

    def test_overview_endpoint(self):
        resp = self.client.get('/api/overview/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn('monitors', data)
        self.assertIn('status_summary', data)

    def test_status_badge_svg(self):
        resp = self.client.get('/api/status-page/badge.svg')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'image/svg+xml')
        self.assertIn(b'sentiro', resp.content)
        self.assertIn(b'#FFFFFF', resp.content)

    def test_audit_logs_list_and_seed(self):
        resp = self.client.get('/api/audit-logs/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreater(len(data), 0)
        self.assertTrue(any(log['actor'] == 'owner@sentiro.xyz' for log in data))

    def test_audit_logs_export_json_and_csv(self):
        resp_json = self.client.get('/api/audit-logs/export/?format=json')
        self.assertEqual(resp_json.status_code, 200)
        self.assertIsInstance(resp_json.json(), list)

        resp_csv = self.client.get('/api/audit-logs/export/?format=csv')
        self.assertEqual(resp_csv.status_code, 200)
        self.assertEqual(resp_csv['Content-Type'], 'text/csv')
        self.assertIn(b'Timestamp', resp_csv.content)

    def test_monitors_list(self):
        resp = self.client.get('/api/monitors/')
        self.assertEqual(resp.status_code, 200)

    def test_api_key_authentication_and_scopes(self):
        from django.contrib.auth.models import User
        from .models import ApiKey
        user = User.objects.create_user(username='sre_dev', email='sre@sentiro.xyz', password='pass')

        # Read-scoped key
        read_key, read_secret = ApiKey.generate_key(user=user, name='Read Scraper', scope='read')
        resp = self.client.get('/api/overview/', HTTP_AUTHORIZATION=f'Bearer {read_secret}')
        self.assertEqual(resp.status_code, 200)

        # Cannot create monitor with read-only key
        resp_blocked = self.client.post('/api/monitors/', {'name': 'Blocked'}, HTTP_AUTHORIZATION=f'Bearer {read_secret}')
        self.assertEqual(resp_blocked.status_code, 403)

        # Write-scoped key
        write_key, write_secret = ApiKey.generate_key(user=user, name='Write Pipeline', scope='write')
        resp_write = self.client.post('/api/monitors/', {
            'project': self.project.id,
            'name': 'API Created Probe',
            'target': 'https://api.sentiro.xyz/ping',
            'monitor_type': 'http',
            'interval_seconds': 60
        }, HTTP_X_API_KEY=write_secret, content_type='application/json')
        self.assertEqual(resp_write.status_code, 201)

        # Invalid key returns 401 Unauthorized
        resp_invalid = self.client.get('/api/overview/', HTTP_AUTHORIZATION='Bearer pw_live_invalid_fake')
        self.assertEqual(resp_invalid.status_code, 401)

    def test_feedback_submission_endpoint(self):
        import os
        os.environ['FEEDBACK_RECEIVE_EMAIL'] = 'custom_feedback@domain.com'

        payload = {
            'mode': 'feature',
            'title': 'Add Kubernetes Pod Sidecar Health Check',
            'description': 'We want to scrape pods running inside EKS automatically.',
            'category': 'probes',
            'email': 'sre@startup.io'
        }
        resp = self.client.post('/api/feedback/', payload, content_type='application/json')
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertTrue(data.get('ok'))
        self.assertEqual(data.get('dispatched_to'), 'custom_feedback@domain.com')

    def test_alert_channels_tier_limits(self):
        from .models import AlertChannel, ProSubscription
        # Set subscription to community free
        pro = ProSubscription.objects.first()
        if not pro:
            pro = ProSubscription.objects.create(name="Community Free", is_active=False, active_tier="community")
        else:
            pro.is_active = False
            pro.active_tier = "community"
            pro.save()

        AlertChannel.objects.all().delete()

        # Add 1st channel (email) on Community Free - OK
        resp1 = self.client.post('/api/channels/', {
            'name': 'Primary Email',
            'kind': 'email',
            'config': {'recipients': 'ops@sentiro.xyz'}
        }, content_type='application/json')
        self.assertEqual(resp1.status_code, 201)

        # Attempt Telegram on Community Free - should be blocked (Indie Pro required)
        resp_tg_blocked = self.client.post('/api/channels/', {
            'name': 'Telegram Alerts Blocked',
            'kind': 'telegram',
            'config': {'chat_id': '123456789'}
        }, content_type='application/json')
        self.assertEqual(resp_tg_blocked.status_code, 403)
        self.assertIn('indie pro', resp_tg_blocked.json().get('error', '').lower())

        # Upgrade to Indie Pro
        pro.is_active = True
        pro.active_tier = 'indie_pro'
        pro.save()

        # Add 2nd channel (telegram) on Indie Pro - OK
        resp2 = self.client.post('/api/channels/', {
            'name': 'Telegram Alerts',
            'kind': 'telegram',
            'config': {'chat_id': '123456789'}
        }, content_type='application/json')
        self.assertEqual(resp2.status_code, 201)

        # Attempt Slack channel on Indie Pro - should be blocked (Team Pro required)
        resp_slack = self.client.post('/api/channels/', {
            'name': 'Slack Channel Blocked',
            'kind': 'slack',
            'config': {'webhook_url': 'https://hooks.slack.com/services/xxx'}
        }, content_type='application/json')
        self.assertEqual(resp_slack.status_code, 403)
        self.assertIn('team pro', resp_slack.json().get('error', '').lower())

    def test_totp_rfc6238_setup_and_verify(self):
        from .totp import get_totp_token, verify_totp_token

        # 1. Setup endpoint
        resp_setup = self.client.get('/api/auth/totp/setup/')
        self.assertEqual(resp_setup.status_code, 200)
        data = resp_setup.json()
        self.assertIn('secret', data)
        self.assertIn('otpauth_url', data)

        secret = data['secret']

        # 2. Compute valid RFC 6238 token
        valid_token = get_totp_token(secret)
        self.assertEqual(len(valid_token), 6)
        self.assertTrue(verify_totp_token(secret, valid_token))

        # 3. Verify endpoint with valid code
        resp_verify = self.client.post('/api/auth/totp/verify/', {'code': valid_token}, content_type='application/json')
        self.assertEqual(resp_verify.status_code, 200)
        self.assertTrue(resp_verify.json().get('totp_enabled'))

        # 4. Disable endpoint
        resp_disable = self.client.post('/api/auth/totp/disable/', content_type='application/json')
        self.assertEqual(resp_disable.status_code, 200)
        self.assertFalse(resp_disable.json().get('totp_enabled'))
