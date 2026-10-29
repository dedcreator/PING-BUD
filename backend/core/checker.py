import time
import socket
import ssl
from urllib.parse import urlparse
import requests
from django.utils import timezone
from .models import Monitor, Check, Incident, CertInfo, MaintenanceWindow


def run_single_check(monitor: Monitor) -> Check:
    """
    Executes a probe for a given monitor based on its type.
    Records the Check in SQLite and transitions monitor state + incidents.
    Respects active Maintenance Windows to silence alarms.
    """
    now = timezone.now()

    # Check if monitor is in an active maintenance window
    active_maint = MaintenanceWindow.objects.filter(
        starts_at__lte=now,
        ends_at__gte=now
    )
    in_maintenance = any(monitor.id in (m.monitor_ids or []) for m in active_maint)

    if in_maintenance:
        monitor.state = 'maintenance'
        monitor.last_checked_at = now
        monitor.next_run_at = now + timezone.timedelta(seconds=monitor.interval_seconds)
        monitor.save()
        return Check.objects.create(
            monitor=monitor,
            ok=True,
            latency_ms=0,
            status_code=None,
            error="In scheduled maintenance window (alerts silenced)",
            region="Local Maintenance Guard"
        )

    start_time = time.time()
    ok = False
    latency_ms = 0
    status_code = None
    error_msg = ""
    region = (monitor.regions[0] if monitor.regions else 'US-East (N. Virginia)')

    try:
        if monitor.monitor_type in ['http', 'keyword', 'ssl']:
            target_url = monitor.target
            if not target_url.startswith(('http://', 'https://')):
                target_url = f"https://{target_url}"

            timeout = (monitor.timeout_ms or 5000) / 1000.0
            headers = monitor.headers_json or {'User-Agent': 'PulseWatch/1.0 (+https://pulsewatch.dev)'}

            response = requests.request(
                method=monitor.http_method or 'GET',
                url=target_url,
                headers=headers,
                data=monitor.request_body if monitor.request_body else None,
                timeout=timeout,
                allow_redirects=True
            )
            latency_ms = int((time.time() - start_time) * 1000)
            status_code = response.status_code

            # Check expected status
            expected = monitor.expected_status or 200
            status_ok = (status_code == expected) or (expected == 200 and 200 <= status_code < 400)

            if not status_ok:
                ok = False
                error_msg = f"Expected HTTP {expected}, got {status_code}"
            else:
                ok = True

            # If keyword monitor
            if ok and monitor.monitor_type == 'keyword' and monitor.keyword:
                text = response.text
                if monitor.keyword_type == 'contains':
                    if monitor.keyword not in text:
                        ok = False
                        error_msg = f"Keyword '{monitor.keyword}' not found in response body"
                elif monitor.keyword_type == 'not_contains':
                    if monitor.keyword in text:
                        ok = False
                        error_msg = f"Keyword '{monitor.keyword}' unexpectedly found in response body"

            # If JSONPath assertion
            if ok and monitor.json_path and monitor.json_expected_value:
                try:
                    json_data = response.json()
                    # Simple key path evaluation e.g. "status" or "data.ok"
                    val = json_data
                    for part in monitor.json_path.split('.'):
                        if isinstance(val, dict):
                            val = val.get(part)
                    if str(val) != str(monitor.json_expected_value):
                        ok = False
                        error_msg = f"JSON field '{monitor.json_path}' was '{val}', expected '{monitor.json_expected_value}'"
                except Exception as je:
                    ok = False
                    error_msg = f"JSON assertion error: {str(je)}"

        elif monitor.monitor_type == 'dns':
            # DNS record check
            target_host = monitor.target.replace('http://', '').replace('https://', '').split('/')[0].split(':')[0]
            try:
                ip_addr = socket.gethostbyname(target_host)
                latency_ms = int((time.time() - start_time) * 1000)
                status_code = 200
                if monitor.dns_expected_value and monitor.dns_expected_value != ip_addr:
                    ok = False
                    error_msg = f"DNS resolved to {ip_addr}, expected {monitor.dns_expected_value}"
                else:
                    ok = True
            except socket.gaierror as dns_err:
                latency_ms = int((time.time() - start_time) * 1000)
                ok = False
                error_msg = f"DNS resolution failure: {str(dns_err)}"

        elif monitor.monitor_type == 'port':
            # TCP connection check
            target = monitor.target
            host = target
            port = 80
            if ':' in target:
                host, port_str = target.split(':', 1)
                port = int(port_str)

            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout((monitor.timeout_ms or 5000) / 1000.0)
            s.connect((host, port))
            s.close()
            latency_ms = int((time.time() - start_time) * 1000)
            ok = True
            status_code = 200

        elif monitor.monitor_type == 'ping':
            # Fast socket ping check
            host = monitor.target.replace('http://', '').replace('https://', '').split('/')[0].split(':')[0]
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout((monitor.timeout_ms or 5000) / 1000.0)
            s.connect((host, 80))
            s.close()
            latency_ms = int((time.time() - start_time) * 1000)
            ok = True
            status_code = 200

        elif monitor.monitor_type == 'heartbeat':
            if monitor.last_checked_at:
                diff_sec = (timezone.now() - monitor.last_checked_at).total_seconds()
                ok = diff_sec <= monitor.interval_seconds * 1.5
                if not ok:
                    error_msg = f"Heartbeat missed. Last ping was {int(diff_sec)} seconds ago."
            else:
                ok = True
            latency_ms = 12

    except requests.Timeout:
        latency_ms = int((time.time() - start_time) * 1000)
        ok = False
        error_msg = f"Connection timed out after {monitor.timeout_ms}ms"
    except requests.ConnectionError as e:
        latency_ms = int((time.time() - start_time) * 1000)
        ok = False
        error_msg = f"Connection failed: {str(e)[:150]}"
    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        ok = False
        error_msg = str(e)[:200]

    # Save check result
    check = Check.objects.create(
        monitor=monitor,
        ok=ok,
        latency_ms=latency_ms,
        status_code=status_code,
        error=error_msg,
        region=region
    )

    monitor.last_checked_at = now
    monitor.next_run_at = now + timezone.timedelta(seconds=monitor.interval_seconds)

    if ok:
        if monitor.state in ['down', 'suspect']:
            monitor.state = 'up'
            active_incidents = monitor.incidents.filter(resolved_at__isnull=True)
            for inc in active_incidents:
                inc.resolved_at = now
                inc.save()
        else:
            monitor.state = 'up'
    else:
        if monitor.state == 'up':
            monitor.state = 'suspect'
        elif monitor.state == 'suspect':
            monitor.state = 'down'
            if not monitor.incidents.filter(resolved_at__isnull=True).exists():
                Incident.objects.create(
                    monitor=monitor,
                    started_at=now,
                    cause=error_msg or f"Monitor check failed with code {status_code}",
                    auto=True,
                    ai_summary=f"Automated RCA: {monitor.name} failed health check. Root cause appears to be {error_msg}. Upstream services may be impacted."
                )

    monitor.save()
    return check


def quick_test_target(target, monitor_type='http', keyword='', expected_status=200, timeout_ms=5000, dns_expected=''):
    """
    Live 'Test Now' function invoked from the frontend modal before saving a monitor.
    """
    start_time = time.time()
    try:
        if monitor_type in ['http', 'keyword', 'ssl']:
            target_url = target
            if not target_url.startswith(('http://', 'https://')):
                target_url = f"https://{target_url}"

            res = requests.get(target_url, timeout=timeout_ms / 1000.0, headers={'User-Agent': 'PulseWatch/1.0'})
            latency = int((time.time() - start_time) * 1000)
            status_code = res.status_code

            if keyword and keyword not in res.text:
                return {
                    'ok': False,
                    'latency_ms': latency,
                    'status_code': status_code,
                    'error': f"Target reached, but keyword '{keyword}' was not found in response body.",
                }

            is_ok = (status_code == expected_status) or (expected_status == 200 and 200 <= status_code < 400)
            return {
                'ok': is_ok,
                'latency_ms': latency,
                'status_code': status_code,
                'error': '' if is_ok else f"Returned status {status_code}, expected {expected_status}",
            }
        elif monitor_type == 'dns':
            host = target.replace('http://', '').replace('https://', '').split('/')[0].split(':')[0]
            ip_addr = socket.gethostbyname(host)
            latency = int((time.time() - start_time) * 1000)
            return {'ok': True, 'latency_ms': latency, 'status_code': 200, 'error': f"Resolved to {ip_addr}"}
        elif monitor_type in ['ping', 'port']:
            host = target.replace('http://', '').replace('https://', '').split('/')[0]
            port = 80
            if ':' in host:
                host, port_str = host.split(':', 1)
                port = int(port_str)
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(timeout_ms / 1000.0)
            s.connect((host, port))
            s.close()
            latency = int((time.time() - start_time) * 1000)
            return {'ok': True, 'latency_ms': latency, 'status_code': 200, 'error': ''}
        else:
            return {'ok': True, 'latency_ms': 15, 'status_code': 200, 'error': ''}
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        return {'ok': False, 'latency_ms': latency, 'status_code': 0, 'error': str(e)}
