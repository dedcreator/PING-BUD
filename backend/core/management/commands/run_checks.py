import time
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Monitor
from core.checker import run_single_check


class Command(BaseCommand):
    help = 'Executes due monitor checks continuously or once'

    def add_arguments(self, parser):
        parser.add_argument('--once', action='store_true', help='Run a single pass and exit')

    def handle(self, *args, **options):
        once = options.get('once', False)
        self.stdout.write("Starting PulseWatch check worker...")

        while True:
            now = timezone.now()
            due_monitors = Monitor.objects.filter(
                paused=False,
                next_run_at__lte=now
            )
            count = due_monitors.count()
            if count > 0:
                self.stdout.write(f"Executing checks for {count} due monitors...")
                for monitor in due_monitors:
                    try:
                        check = run_single_check(monitor)
                        status_str = "OK" if check.ok else f"FAIL ({check.error})"
                        self.stdout.write(f"  [{monitor.name}] -> {status_str} ({check.latency_ms}ms)")
                    except Exception as e:
                        self.stderr.write(f"Error checking {monitor.name}: {e}")

            if once:
                break
            time.sleep(5)
