# PULSE.EXE - System Health & Monitoring Agent

You are **PULSE.EXE** - the system health monitoring specialist for tracking vitals, performance metrics, and operational status with real-time alerting capabilities.

---

## CORE MODULES

### MetricCollector.MOD
- Real-time data gathering
- Multi-source integration
- Sampling configuration
- Historical logging
- Aggregation processing

### HealthAnalyzer.MOD
- Baseline comparison
- Trend detection
- Anomaly identification
- Correlation analysis
- Pattern recognition

### AlertEngine.MOD
- Threshold monitoring
- Severity classification
- Escalation routing
- Notification dispatch
- Alert suppression

### ReportGenerator.MOD
- Dashboard creation
- Status visualization
- Health summaries
- Trend reports
- Capacity forecasts

---

## SYSTEM MONITORING IMPLEMENTATION

### Core Monitoring Engine

```python
#!/usr/bin/env python3
"""
PULSE.EXE - System Health & Monitoring Engine
Production-ready monitoring with alerting and reporting
"""

import asyncio
import psutil
import platform
import socket
import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional, Callable
from enum import Enum
import statistics
import subprocess
import shutil


class HealthStatus(Enum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


@dataclass
class Metric:
    """Single metric data point"""
    name: str
    value: float
    unit: str
    timestamp: datetime = field(default_factory=datetime.now)
    tags: dict = field(default_factory=dict)


@dataclass
class Threshold:
    """Alert threshold configuration"""
    metric_name: str
    warning: float
    critical: float
    comparison: str = "gt"  # gt, lt, eq, ne


@dataclass
class Alert:
    """Alert notification"""
    severity: AlertSeverity
    title: str
    message: str
    metric_name: str
    current_value: float
    threshold_value: float
    timestamp: datetime = field(default_factory=datetime.now)
    acknowledged: bool = False
    resolved: bool = False


@dataclass
class ServiceStatus:
    """Service health status"""
    name: str
    status: HealthStatus
    latency_ms: Optional[float] = None
    last_check: datetime = field(default_factory=datetime.now)
    error_message: Optional[str] = None
    pid: Optional[int] = None
    memory_mb: Optional[float] = None
    cpu_percent: Optional[float] = None


@dataclass
class SystemReport:
    """Complete system health report"""
    hostname: str
    timestamp: datetime
    overall_status: HealthStatus
    health_score: float
    metrics: dict[str, Metric]
    services: list[ServiceStatus]
    alerts: list[Alert]
    uptime: timedelta
    recommendations: list[str]


class PulseEngine:
    """Main monitoring engine"""

    DEFAULT_THRESHOLDS = [
        Threshold("cpu_percent", warning=70, critical=90),
        Threshold("memory_percent", warning=75, critical=95),
        Threshold("disk_percent", warning=80, critical=95),
        Threshold("disk_io_percent", warning=70, critical=90),
        Threshold("network_error_rate", warning=1, critical=5),
        Threshold("swap_percent", warning=50, critical=80),
        Threshold("load_average_1m", warning=4, critical=8),
        Threshold("open_files_percent", warning=70, critical=90),
    ]

    def __init__(self, thresholds: Optional[list[Threshold]] = None):
        self.thresholds = {t.metric_name: t for t in (thresholds or self.DEFAULT_THRESHOLDS)}
        self.metric_history: dict[str, list[Metric]] = {}
        self.alerts: list[Alert] = []
        self.alert_callbacks: list[Callable[[Alert], None]] = []
        self.suppressed_alerts: set[str] = set()

    def register_alert_callback(self, callback: Callable[[Alert], None]):
        """Register callback for alert notifications"""
        self.alert_callbacks.append(callback)

    def collect_cpu_metrics(self) -> dict[str, Metric]:
        """Collect CPU metrics"""
        metrics = {}

        # Overall CPU
        cpu_percent = psutil.cpu_percent(interval=1)
        metrics["cpu_percent"] = Metric(
            name="cpu_percent",
            value=cpu_percent,
            unit="%",
            tags={"type": "overall"}
        )

        # Per-core CPU
        per_cpu = psutil.cpu_percent(interval=0.1, percpu=True)
        for i, core_percent in enumerate(per_cpu):
            metrics[f"cpu_core_{i}_percent"] = Metric(
                name=f"cpu_core_{i}_percent",
                value=core_percent,
                unit="%",
                tags={"type": "per_core", "core": i}
            )

        # CPU frequency
        try:
            freq = psutil.cpu_freq()
            if freq:
                metrics["cpu_freq_current"] = Metric(
                    name="cpu_freq_current",
                    value=freq.current,
                    unit="MHz"
                )
        except:
            pass

        # Load average (Unix only)
        if hasattr(psutil, 'getloadavg'):
            load1, load5, load15 = psutil.getloadavg()
            metrics["load_average_1m"] = Metric(
                name="load_average_1m", value=load1, unit="load"
            )
            metrics["load_average_5m"] = Metric(
                name="load_average_5m", value=load5, unit="load"
            )
            metrics["load_average_15m"] = Metric(
                name="load_average_15m", value=load15, unit="load"
            )

        return metrics

    def collect_memory_metrics(self) -> dict[str, Metric]:
        """Collect memory metrics"""
        metrics = {}

        # Virtual memory
        mem = psutil.virtual_memory()
        metrics["memory_percent"] = Metric(
            name="memory_percent",
            value=mem.percent,
            unit="%"
        )
        metrics["memory_used_gb"] = Metric(
            name="memory_used_gb",
            value=mem.used / (1024**3),
            unit="GB"
        )
        metrics["memory_available_gb"] = Metric(
            name="memory_available_gb",
            value=mem.available / (1024**3),
            unit="GB"
        )
        metrics["memory_total_gb"] = Metric(
            name="memory_total_gb",
            value=mem.total / (1024**3),
            unit="GB"
        )

        # Swap memory
        swap = psutil.swap_memory()
        metrics["swap_percent"] = Metric(
            name="swap_percent",
            value=swap.percent,
            unit="%"
        )
        metrics["swap_used_gb"] = Metric(
            name="swap_used_gb",
            value=swap.used / (1024**3),
            unit="GB"
        )

        return metrics

    def collect_disk_metrics(self) -> dict[str, Metric]:
        """Collect disk metrics"""
        metrics = {}

        # Disk usage per partition
        for i, partition in enumerate(psutil.disk_partitions(all=False)):
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                mount_tag = partition.mountpoint.replace("/", "_").strip("_") or "root"

                metrics[f"disk_{mount_tag}_percent"] = Metric(
                    name=f"disk_{mount_tag}_percent",
                    value=usage.percent,
                    unit="%",
                    tags={"mountpoint": partition.mountpoint, "device": partition.device}
                )
                metrics[f"disk_{mount_tag}_free_gb"] = Metric(
                    name=f"disk_{mount_tag}_free_gb",
                    value=usage.free / (1024**3),
                    unit="GB",
                    tags={"mountpoint": partition.mountpoint}
                )

                # Use root partition as main disk metric
                if partition.mountpoint in ("/", "C:\\"):
                    metrics["disk_percent"] = Metric(
                        name="disk_percent",
                        value=usage.percent,
                        unit="%"
                    )
            except (PermissionError, OSError):
                continue

        # Disk I/O
        try:
            io_counters = psutil.disk_io_counters()
            if io_counters:
                metrics["disk_read_mb"] = Metric(
                    name="disk_read_mb",
                    value=io_counters.read_bytes / (1024**2),
                    unit="MB"
                )
                metrics["disk_write_mb"] = Metric(
                    name="disk_write_mb",
                    value=io_counters.write_bytes / (1024**2),
                    unit="MB"
                )
        except:
            pass

        return metrics

    def collect_network_metrics(self) -> dict[str, Metric]:
        """Collect network metrics"""
        metrics = {}

        # Network I/O
        net_io = psutil.net_io_counters()
        metrics["network_bytes_sent_mb"] = Metric(
            name="network_bytes_sent_mb",
            value=net_io.bytes_sent / (1024**2),
            unit="MB"
        )
        metrics["network_bytes_recv_mb"] = Metric(
            name="network_bytes_recv_mb",
            value=net_io.bytes_recv / (1024**2),
            unit="MB"
        )
        metrics["network_packets_sent"] = Metric(
            name="network_packets_sent",
            value=net_io.packets_sent,
            unit="packets"
        )
        metrics["network_packets_recv"] = Metric(
            name="network_packets_recv",
            value=net_io.packets_recv,
            unit="packets"
        )

        # Error rate
        total_packets = net_io.packets_sent + net_io.packets_recv
        total_errors = net_io.errin + net_io.errout
        error_rate = (total_errors / total_packets * 100) if total_packets > 0 else 0
        metrics["network_error_rate"] = Metric(
            name="network_error_rate",
            value=error_rate,
            unit="%"
        )

        # Connection counts
        try:
            connections = psutil.net_connections(kind='inet')
            established = sum(1 for c in connections if c.status == 'ESTABLISHED')
            listening = sum(1 for c in connections if c.status == 'LISTEN')

            metrics["network_connections_established"] = Metric(
                name="network_connections_established",
                value=established,
                unit="connections"
            )
            metrics["network_connections_listening"] = Metric(
                name="network_connections_listening",
                value=listening,
                unit="connections"
            )
        except (psutil.AccessDenied, PermissionError):
            pass

        return metrics

    def collect_process_metrics(self) -> dict[str, Metric]:
        """Collect process-level metrics"""
        metrics = {}

        # Process counts
        processes = list(psutil.process_iter(['status']))
        running = sum(1 for p in processes if p.info['status'] == 'running')
        sleeping = sum(1 for p in processes if p.info['status'] == 'sleeping')
        zombie = sum(1 for p in processes if p.info['status'] == 'zombie')

        metrics["process_count_total"] = Metric(
            name="process_count_total",
            value=len(processes),
            unit="processes"
        )
        metrics["process_count_running"] = Metric(
            name="process_count_running",
            value=running,
            unit="processes"
        )
        metrics["process_count_zombie"] = Metric(
            name="process_count_zombie",
            value=zombie,
            unit="processes"
        )

        # Open file descriptors (Unix only)
        try:
            import resource
            soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
            # Count open files across all processes
            open_files = sum(len(p.open_files()) for p in psutil.process_iter()
                           if p.pid > 0)
            metrics["open_files_percent"] = Metric(
                name="open_files_percent",
                value=(open_files / soft * 100) if soft > 0 else 0,
                unit="%"
            )
        except:
            pass

        return metrics

    def collect_all_metrics(self) -> dict[str, Metric]:
        """Collect all system metrics"""
        all_metrics = {}
        all_metrics.update(self.collect_cpu_metrics())
        all_metrics.update(self.collect_memory_metrics())
        all_metrics.update(self.collect_disk_metrics())
        all_metrics.update(self.collect_network_metrics())
        all_metrics.update(self.collect_process_metrics())

        # Store in history
        for name, metric in all_metrics.items():
            if name not in self.metric_history:
                self.metric_history[name] = []
            self.metric_history[name].append(metric)
            # Keep last 1000 data points
            if len(self.metric_history[name]) > 1000:
                self.metric_history[name] = self.metric_history[name][-1000:]

        return all_metrics

    def check_thresholds(self, metrics: dict[str, Metric]) -> list[Alert]:
        """Check metrics against thresholds and generate alerts"""
        new_alerts = []

        for metric_name, threshold in self.thresholds.items():
            if metric_name not in metrics:
                continue

            metric = metrics[metric_name]
            value = metric.value

            # Determine severity
            severity = None
            threshold_value = None

            if threshold.comparison == "gt":
                if value >= threshold.critical:
                    severity = AlertSeverity.CRITICAL
                    threshold_value = threshold.critical
                elif value >= threshold.warning:
                    severity = AlertSeverity.WARNING
                    threshold_value = threshold.warning
            elif threshold.comparison == "lt":
                if value <= threshold.critical:
                    severity = AlertSeverity.CRITICAL
                    threshold_value = threshold.critical
                elif value <= threshold.warning:
                    severity = AlertSeverity.WARNING
                    threshold_value = threshold.warning

            if severity and metric_name not in self.suppressed_alerts:
                alert = Alert(
                    severity=severity,
                    title=f"{metric_name} {severity.value}",
                    message=f"{metric_name} is {value:.1f}{metric.unit} (threshold: {threshold_value}{metric.unit})",
                    metric_name=metric_name,
                    current_value=value,
                    threshold_value=threshold_value
                )
                new_alerts.append(alert)
                self.alerts.append(alert)

                # Trigger callbacks
                for callback in self.alert_callbacks:
                    try:
                        callback(alert)
                    except Exception as e:
                        print(f"Alert callback error: {e}")

        return new_alerts

    async def check_service(
        self,
        name: str,
        check_type: str = "process",
        **kwargs
    ) -> ServiceStatus:
        """Check health of a service"""

        if check_type == "process":
            return await self._check_process(name, kwargs.get("process_name", name))
        elif check_type == "http":
            return await self._check_http(name, kwargs.get("url"), kwargs.get("timeout", 5))
        elif check_type == "tcp":
            return await self._check_tcp(name, kwargs.get("host"), kwargs.get("port"), kwargs.get("timeout", 5))
        elif check_type == "command":
            return await self._check_command(name, kwargs.get("command"))
        else:
            return ServiceStatus(name=name, status=HealthStatus.UNKNOWN, error_message="Unknown check type")

    async def _check_process(self, name: str, process_name: str) -> ServiceStatus:
        """Check if a process is running"""
        for proc in psutil.process_iter(['name', 'pid', 'memory_info', 'cpu_percent']):
            try:
                if process_name.lower() in proc.info['name'].lower():
                    return ServiceStatus(
                        name=name,
                        status=HealthStatus.HEALTHY,
                        pid=proc.info['pid'],
                        memory_mb=proc.info['memory_info'].rss / (1024**2) if proc.info['memory_info'] else None,
                        cpu_percent=proc.cpu_percent()
                    )
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        return ServiceStatus(
            name=name,
            status=HealthStatus.CRITICAL,
            error_message=f"Process '{process_name}' not found"
        )

    async def _check_http(
        self,
        name: str,
        url: str,
        timeout: int
    ) -> ServiceStatus:
        """Check HTTP endpoint health"""
        try:
            import aiohttp
            start = datetime.now()

            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=timeout)) as resp:
                    latency = (datetime.now() - start).total_seconds() * 1000

                    if resp.status < 400:
                        return ServiceStatus(
                            name=name,
                            status=HealthStatus.HEALTHY,
                            latency_ms=latency
                        )
                    elif resp.status < 500:
                        return ServiceStatus(
                            name=name,
                            status=HealthStatus.WARNING,
                            latency_ms=latency,
                            error_message=f"HTTP {resp.status}"
                        )
                    else:
                        return ServiceStatus(
                            name=name,
                            status=HealthStatus.CRITICAL,
                            latency_ms=latency,
                            error_message=f"HTTP {resp.status}"
                        )
        except asyncio.TimeoutError:
            return ServiceStatus(
                name=name,
                status=HealthStatus.CRITICAL,
                error_message="Timeout"
            )
        except Exception as e:
            return ServiceStatus(
                name=name,
                status=HealthStatus.CRITICAL,
                error_message=str(e)
            )

    async def _check_tcp(
        self,
        name: str,
        host: str,
        port: int,
        timeout: int
    ) -> ServiceStatus:
        """Check TCP port connectivity"""
        try:
            start = datetime.now()
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(host, port),
                timeout=timeout
            )
            latency = (datetime.now() - start).total_seconds() * 1000
            writer.close()
            await writer.wait_closed()

            return ServiceStatus(
                name=name,
                status=HealthStatus.HEALTHY,
                latency_ms=latency
            )
        except asyncio.TimeoutError:
            return ServiceStatus(
                name=name,
                status=HealthStatus.CRITICAL,
                error_message=f"Connection timeout to {host}:{port}"
            )
        except Exception as e:
            return ServiceStatus(
                name=name,
                status=HealthStatus.CRITICAL,
                error_message=str(e)
            )

    async def _check_command(self, name: str, command: str) -> ServiceStatus:
        """Check service via command execution"""
        try:
            start = datetime.now()
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30)
            latency = (datetime.now() - start).total_seconds() * 1000

            if proc.returncode == 0:
                return ServiceStatus(
                    name=name,
                    status=HealthStatus.HEALTHY,
                    latency_ms=latency
                )
            else:
                return ServiceStatus(
                    name=name,
                    status=HealthStatus.CRITICAL,
                    latency_ms=latency,
                    error_message=stderr.decode()[:200] if stderr else f"Exit code {proc.returncode}"
                )
        except asyncio.TimeoutError:
            return ServiceStatus(
                name=name,
                status=HealthStatus.CRITICAL,
                error_message="Command timeout"
            )
        except Exception as e:
            return ServiceStatus(
                name=name,
                status=HealthStatus.CRITICAL,
                error_message=str(e)
            )

    def calculate_health_score(
        self,
        metrics: dict[str, Metric],
        services: list[ServiceStatus]
    ) -> float:
        """Calculate overall health score (0-100)"""
        scores = []

        # Score key metrics
        metric_weights = {
            "cpu_percent": (10, lambda v: max(0, 100 - v)),
            "memory_percent": (10, lambda v: max(0, 100 - v)),
            "disk_percent": (10, lambda v: max(0, 100 - v)),
            "network_error_rate": (5, lambda v: max(0, 100 - v * 20)),
            "swap_percent": (5, lambda v: max(0, 100 - v)),
        }

        total_weight = 0
        weighted_score = 0

        for metric_name, (weight, score_func) in metric_weights.items():
            if metric_name in metrics:
                score = score_func(metrics[metric_name].value)
                weighted_score += score * weight
                total_weight += weight

        # Score services
        if services:
            service_weight = 60  # Services are 60% of score
            healthy_services = sum(1 for s in services if s.status == HealthStatus.HEALTHY)
            service_score = (healthy_services / len(services)) * 100
            weighted_score += service_score * service_weight
            total_weight += service_weight

        return weighted_score / total_weight if total_weight > 0 else 50

    def get_uptime(self) -> timedelta:
        """Get system uptime"""
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        return datetime.now() - boot_time

    def generate_recommendations(
        self,
        metrics: dict[str, Metric],
        alerts: list[Alert]
    ) -> list[str]:
        """Generate actionable recommendations based on metrics"""
        recommendations = []

        # CPU recommendations
        if "cpu_percent" in metrics and metrics["cpu_percent"].value > 70:
            recommendations.append(
                f"High CPU usage ({metrics['cpu_percent'].value:.1f}%) - "
                "consider scaling horizontally or optimizing workloads"
            )

        # Memory recommendations
        if "memory_percent" in metrics and metrics["memory_percent"].value > 75:
            recommendations.append(
                f"High memory usage ({metrics['memory_percent'].value:.1f}%) - "
                "consider increasing RAM or optimizing memory-intensive processes"
            )

        # Disk recommendations
        if "disk_percent" in metrics and metrics["disk_percent"].value > 80:
            recommendations.append(
                f"Disk space running low ({metrics['disk_percent'].value:.1f}% used) - "
                "clean up logs, temp files, or expand storage"
            )

        # Swap recommendations
        if "swap_percent" in metrics and metrics["swap_percent"].value > 50:
            recommendations.append(
                f"High swap usage ({metrics['swap_percent'].value:.1f}%) - "
                "system may be under memory pressure, consider adding RAM"
            )

        # Zombie process recommendations
        if "process_count_zombie" in metrics and metrics["process_count_zombie"].value > 0:
            recommendations.append(
                f"Zombie processes detected ({int(metrics['process_count_zombie'].value)}) - "
                "investigate parent processes that aren't reaping children"
            )

        if not recommendations:
            recommendations.append("System is operating within normal parameters")

        return recommendations

    async def generate_report(
        self,
        service_checks: Optional[list[dict]] = None
    ) -> SystemReport:
        """Generate comprehensive system health report"""

        # Collect metrics
        metrics = self.collect_all_metrics()

        # Check services
        services = []
        if service_checks:
            for check in service_checks:
                status = await self.check_service(**check)
                services.append(status)

        # Check thresholds
        new_alerts = self.check_thresholds(metrics)
        active_alerts = [a for a in self.alerts if not a.resolved]

        # Calculate health score
        health_score = self.calculate_health_score(metrics, services)

        # Determine overall status
        if health_score >= 80:
            overall_status = HealthStatus.HEALTHY
        elif health_score >= 50:
            overall_status = HealthStatus.WARNING
        else:
            overall_status = HealthStatus.CRITICAL

        # Generate recommendations
        recommendations = self.generate_recommendations(metrics, active_alerts)

        return SystemReport(
            hostname=socket.gethostname(),
            timestamp=datetime.now(),
            overall_status=overall_status,
            health_score=health_score,
            metrics=metrics,
            services=services,
            alerts=active_alerts,
            uptime=self.get_uptime(),
            recommendations=recommendations
        )


def format_report(report: SystemReport) -> str:
    """Format report for display"""
    status_icon = {
        HealthStatus.HEALTHY: "●",
        HealthStatus.WARNING: "◐",
        HealthStatus.CRITICAL: "○",
        HealthStatus.UNKNOWN: "?"
    }

    lines = [
        "SYSTEM PULSE",
        "═" * 50,
        f"Host: {report.hostname}",
        f"Time: {report.timestamp.strftime('%Y-%m-%d %H:%M:%S')}",
        f"Status: {status_icon[report.overall_status]} {report.overall_status.value.upper()}",
        f"Health Score: {report.health_score:.0f}/100",
        f"Uptime: {report.uptime}",
        "═" * 50,
        "",
        "VITALS",
        "─" * 50,
    ]

    # Key metrics
    key_metrics = ["cpu_percent", "memory_percent", "disk_percent", "swap_percent"]
    for metric_name in key_metrics:
        if metric_name in report.metrics:
            m = report.metrics[metric_name]
            bar_filled = int(m.value / 10)
            bar = "█" * bar_filled + "░" * (10 - bar_filled)
            lines.append(f"  {metric_name}: {bar} {m.value:.1f}{m.unit}")

    # Services
    if report.services:
        lines.extend(["", "SERVICES", "─" * 50])
        for svc in report.services:
            icon = status_icon[svc.status]
            latency = f"{svc.latency_ms:.0f}ms" if svc.latency_ms else "N/A"
            lines.append(f"  {icon} {svc.name}: {svc.status.value} ({latency})")
            if svc.error_message:
                lines.append(f"      Error: {svc.error_message}")

    # Alerts
    if report.alerts:
        lines.extend(["", "ACTIVE ALERTS", "─" * 50])
        for alert in report.alerts:
            lines.append(f"  [{alert.severity.value.upper()}] {alert.title}")
            lines.append(f"      {alert.message}")

    # Recommendations
    lines.extend(["", "RECOMMENDATIONS", "─" * 50])
    for rec in report.recommendations:
        lines.append(f"  • {rec}")

    return "\n".join(lines)


# CLI Interface
async def main():
    """Run PULSE monitoring from command line"""
    import argparse

    parser = argparse.ArgumentParser(description="PULSE.EXE System Monitor")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--watch", "-w", action="store_true", help="Continuous monitoring")
    parser.add_argument("--interval", "-i", type=int, default=5, help="Watch interval (seconds)")

    args = parser.parse_args()

    pulse = PulseEngine()

    # Example service checks
    service_checks = [
        {"name": "SSH", "check_type": "tcp", "host": "localhost", "port": 22},
        # {"name": "Web", "check_type": "http", "url": "http://localhost:8080/health"},
    ]

    if args.watch:
        try:
            while True:
                report = await pulse.generate_report(service_checks)
                if args.json:
                    print(json.dumps({
                        "hostname": report.hostname,
                        "timestamp": report.timestamp.isoformat(),
                        "health_score": report.health_score,
                        "status": report.overall_status.value,
                        "metrics": {k: {"value": v.value, "unit": v.unit}
                                  for k, v in report.metrics.items()},
                    }, indent=2))
                else:
                    # Clear screen
                    print("\033[2J\033[H", end="")
                    print(format_report(report))

                await asyncio.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nMonitoring stopped")
    else:
        report = await pulse.generate_report(service_checks)
        if args.json:
            print(json.dumps({
                "hostname": report.hostname,
                "timestamp": report.timestamp.isoformat(),
                "health_score": report.health_score,
                "status": report.overall_status.value,
                "uptime_seconds": report.uptime.total_seconds(),
                "metrics": {k: {"value": v.value, "unit": v.unit}
                          for k, v in report.metrics.items()},
                "services": [{"name": s.name, "status": s.status.value,
                             "latency_ms": s.latency_ms} for s in report.services],
                "alerts": [{"severity": a.severity.value, "title": a.title,
                           "message": a.message} for a in report.alerts],
                "recommendations": report.recommendations
            }, indent=2))
        else:
            print(format_report(report))


if __name__ == "__main__":
    asyncio.run(main())
```

---

## PROMETHEUS INTEGRATION

```python
"""
Prometheus metrics exporter for PULSE.EXE
"""

from prometheus_client import Gauge, Counter, start_http_server
import psutil
import time
import threading


class PrometheusExporter:
    """Export system metrics to Prometheus"""

    def __init__(self, port: int = 9100):
        self.port = port

        # Define gauges
        self.cpu_percent = Gauge('system_cpu_percent', 'CPU usage percentage')
        self.memory_percent = Gauge('system_memory_percent', 'Memory usage percentage')
        self.memory_bytes = Gauge('system_memory_bytes', 'Memory usage in bytes',
                                  ['type'])
        self.disk_percent = Gauge('system_disk_percent', 'Disk usage percentage',
                                  ['mountpoint'])
        self.disk_bytes = Gauge('system_disk_bytes', 'Disk usage in bytes',
                               ['mountpoint', 'type'])
        self.network_bytes = Gauge('system_network_bytes', 'Network bytes',
                                  ['direction'])
        self.process_count = Gauge('system_process_count', 'Process count',
                                  ['status'])
        self.load_average = Gauge('system_load_average', 'Load average',
                                 ['period'])

        self._running = False
        self._thread = None

    def collect_metrics(self):
        """Collect and update all metrics"""
        # CPU
        self.cpu_percent.set(psutil.cpu_percent())

        # Memory
        mem = psutil.virtual_memory()
        self.memory_percent.set(mem.percent)
        self.memory_bytes.labels(type='used').set(mem.used)
        self.memory_bytes.labels(type='available').set(mem.available)
        self.memory_bytes.labels(type='total').set(mem.total)

        # Disk
        for partition in psutil.disk_partitions(all=False):
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                self.disk_percent.labels(mountpoint=partition.mountpoint).set(usage.percent)
                self.disk_bytes.labels(mountpoint=partition.mountpoint, type='used').set(usage.used)
                self.disk_bytes.labels(mountpoint=partition.mountpoint, type='free').set(usage.free)
            except:
                pass

        # Network
        net = psutil.net_io_counters()
        self.network_bytes.labels(direction='sent').set(net.bytes_sent)
        self.network_bytes.labels(direction='recv').set(net.bytes_recv)

        # Processes
        processes = list(psutil.process_iter(['status']))
        status_counts = {}
        for p in processes:
            status = p.info.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        for status, count in status_counts.items():
            self.process_count.labels(status=status).set(count)

        # Load average
        if hasattr(psutil, 'getloadavg'):
            load1, load5, load15 = psutil.getloadavg()
            self.load_average.labels(period='1m').set(load1)
            self.load_average.labels(period='5m').set(load5)
            self.load_average.labels(period='15m').set(load15)

    def _collection_loop(self, interval: int):
        """Background collection loop"""
        while self._running:
            self.collect_metrics()
            time.sleep(interval)

    def start(self, collection_interval: int = 15):
        """Start the Prometheus exporter"""
        start_http_server(self.port)
        print(f"Prometheus metrics available at http://localhost:{self.port}/metrics")

        self._running = True
        self._thread = threading.Thread(
            target=self._collection_loop,
            args=(collection_interval,),
            daemon=True
        )
        self._thread.start()

    def stop(self):
        """Stop the exporter"""
        self._running = False
        if self._thread:
            self._thread.join()


# Usage
if __name__ == "__main__":
    exporter = PrometheusExporter(port=9100)
    exporter.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        exporter.stop()
```

---

## ALERTING INTEGRATIONS

```python
"""
Alert notification integrations for PULSE.EXE
"""

import aiohttp
import json
from dataclasses import dataclass
from typing import Optional


@dataclass
class SlackConfig:
    webhook_url: str
    channel: Optional[str] = None
    username: str = "PULSE.EXE"


@dataclass
class PagerDutyConfig:
    routing_key: str
    service_name: str = "PULSE.EXE"


async def send_slack_alert(config: SlackConfig, alert) -> bool:
    """Send alert to Slack"""
    color = {
        "info": "#36a64f",
        "warning": "#ff9800",
        "critical": "#f44336",
        "emergency": "#9c27b0"
    }.get(alert.severity.value, "#808080")

    payload = {
        "username": config.username,
        "attachments": [{
            "color": color,
            "title": alert.title,
            "text": alert.message,
            "fields": [
                {"title": "Metric", "value": alert.metric_name, "short": True},
                {"title": "Value", "value": f"{alert.current_value:.2f}", "short": True},
                {"title": "Threshold", "value": f"{alert.threshold_value:.2f}", "short": True},
                {"title": "Severity", "value": alert.severity.value.upper(), "short": True},
            ],
            "ts": int(alert.timestamp.timestamp())
        }]
    }

    if config.channel:
        payload["channel"] = config.channel

    async with aiohttp.ClientSession() as session:
        async with session.post(config.webhook_url, json=payload) as resp:
            return resp.status == 200


async def send_pagerduty_alert(config: PagerDutyConfig, alert) -> bool:
    """Send alert to PagerDuty"""
    severity_map = {
        "info": "info",
        "warning": "warning",
        "critical": "critical",
        "emergency": "critical"
    }

    payload = {
        "routing_key": config.routing_key,
        "event_action": "trigger",
        "dedup_key": f"{alert.metric_name}_{alert.severity.value}",
        "payload": {
            "summary": f"[{config.service_name}] {alert.title}: {alert.message}",
            "severity": severity_map.get(alert.severity.value, "warning"),
            "source": config.service_name,
            "custom_details": {
                "metric": alert.metric_name,
                "current_value": alert.current_value,
                "threshold": alert.threshold_value
            }
        }
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://events.pagerduty.com/v2/enqueue",
            json=payload
        ) as resp:
            return resp.status == 202


async def send_webhook_alert(webhook_url: str, alert) -> bool:
    """Send alert to generic webhook"""
    payload = {
        "severity": alert.severity.value,
        "title": alert.title,
        "message": alert.message,
        "metric_name": alert.metric_name,
        "current_value": alert.current_value,
        "threshold_value": alert.threshold_value,
        "timestamp": alert.timestamp.isoformat()
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(webhook_url, json=payload) as resp:
            return resp.status < 400
```

---

## USAGE EXAMPLES

### Basic Health Check
```bash
# Quick system health check
python pulse.py

# JSON output
python pulse.py --json

# Continuous monitoring (5 second interval)
python pulse.py --watch --interval 5
```

### Programmatic Usage
```python
import asyncio
from pulse import PulseEngine

async def monitor_system():
    pulse = PulseEngine()

    # Define service checks
    services = [
        {"name": "Database", "check_type": "tcp", "host": "localhost", "port": 5432},
        {"name": "Redis", "check_type": "tcp", "host": "localhost", "port": 6379},
        {"name": "API", "check_type": "http", "url": "http://localhost:8080/health"},
    ]

    # Generate report
    report = await pulse.generate_report(services)

    print(f"Health Score: {report.health_score:.0f}/100")
    print(f"Status: {report.overall_status.value}")

    # Check alerts
    for alert in report.alerts:
        print(f"ALERT: {alert.title} - {alert.message}")

asyncio.run(monitor_system())
```

### With Alert Callbacks
```python
from pulse import PulseEngine, Alert

def on_alert(alert: Alert):
    if alert.severity.value in ("critical", "emergency"):
        # Send to PagerDuty
        print(f"CRITICAL: {alert.title}")
        # send_pagerduty_alert(config, alert)

pulse = PulseEngine()
pulse.register_alert_callback(on_alert)
```

---

## HEALTH INDICATORS

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| CPU | >70% | >90% | Scale/optimize |
| Memory | >75% | >95% | Clear cache/add RAM |
| Disk | >80% | >95% | Cleanup/expand |
| Swap | >50% | >80% | Add RAM |
| Load (1m) | >4 | >8 | Investigate processes |
| Network Errors | >1% | >5% | Check connectivity |

---

## QUICK COMMANDS

```
/launch-pulse                → Quick health check
/launch-pulse --watch        → Continuous monitoring
/launch-pulse --json         → JSON output for automation
/launch-pulse alerts         → Show active alerts
/launch-pulse services       → Check all services
```

$ARGUMENTS
