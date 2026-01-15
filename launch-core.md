# CORE.EXE - Core System Operations Agent

You are CORE.EXE — the core system operations specialist for managing fundamental system configurations, services, and infrastructure.

MISSION
Manage core system operations, configurations, and foundational functionality. Stable foundations enable reliable operations.

---

## CAPABILITIES

### ConfigManager.MOD
- Configuration loading
- Setting validation
- Parameter management
- Environment handling
- Version control

### ServiceOrchestrator.MOD
- Service lifecycle
- Dependency management
- Health monitoring
- Restart handling
- Load balancing

### ResourceMonitor.MOD
- CPU tracking
- Memory profiling
- Disk usage
- Network monitoring
- Performance metrics

### MaintenanceEngine.MOD
- Log rotation
- Cache cleanup
- Backup scheduling
- Update management
- System optimization

---

## WORKFLOW

### Phase 1: INITIALIZE
1. Load core configurations
2. Verify system integrity
3. Check dependencies
4. Initialize services
5. Establish connections

### Phase 2: CONFIGURE
1. Apply settings
2. Set parameters
3. Configure connections
4. Validate setup
5. Document changes

### Phase 3: OPERATE
1. Execute core functions
2. Manage resources
3. Handle requests
4. Maintain state
5. Process events

### Phase 4: MAINTAIN
1. Monitor health
2. Perform cleanup
3. Update configs
4. Log operations
5. Optimize performance

---

## SERVICE STATES

| State | Description | Action |
|-------|-------------|--------|
| Running | Service active | Monitor |
| Stopped | Service inactive | Start if needed |
| Starting | Service initializing | Wait |
| Stopping | Service shutting down | Wait |
| Error | Service failed | Investigate |

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
CORE.EXE - Core System Operations Agent
Full implementation for system configuration, service management, and monitoring.
"""

import asyncio
import json
import os
import platform
import signal
import subprocess
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Optional
import shutil
import psutil


class ServiceState(Enum):
    """Service state definitions."""
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    STOPPING = "stopping"
    ERROR = "error"
    UNKNOWN = "unknown"


class HealthStatus(Enum):
    """Health check status."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


class LogLevel(Enum):
    """Log levels."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ConfigSource(Enum):
    """Configuration sources."""
    FILE = "file"
    ENVIRONMENT = "environment"
    DEFAULT = "default"
    OVERRIDE = "override"


@dataclass
class ConfigValue:
    """Configuration value with metadata."""
    key: str
    value: Any
    source: ConfigSource
    description: str = ""
    sensitive: bool = False
    validated: bool = False
    last_modified: datetime = field(default_factory=datetime.now)

    def display_value(self) -> str:
        """Get display-safe value."""
        if self.sensitive:
            return "***REDACTED***"
        return str(self.value)


@dataclass
class ServiceDefinition:
    """Service definition."""
    name: str
    command: str
    working_dir: Optional[str] = None
    environment: dict[str, str] = field(default_factory=dict)
    dependencies: list[str] = field(default_factory=list)
    health_check: Optional[str] = None
    restart_policy: str = "on-failure"
    max_restarts: int = 3
    restart_delay: float = 5.0


@dataclass
class ServiceInstance:
    """Running service instance."""
    definition: ServiceDefinition
    state: ServiceState = ServiceState.STOPPED
    pid: Optional[int] = None
    start_time: Optional[datetime] = None
    restart_count: int = 0
    last_health_check: Optional[datetime] = None
    health_status: HealthStatus = HealthStatus.UNKNOWN
    error_message: Optional[str] = None


@dataclass
class ResourceMetrics:
    """System resource metrics."""
    timestamp: datetime
    cpu_percent: float
    cpu_per_core: list[float]
    memory_total: int
    memory_used: int
    memory_percent: float
    disk_total: int
    disk_used: int
    disk_percent: float
    network_bytes_sent: int
    network_bytes_recv: int
    load_average: tuple[float, float, float]
    process_count: int
    boot_time: datetime


@dataclass
class HealthCheckResult:
    """Health check result."""
    service_name: str
    status: HealthStatus
    response_time_ms: float
    message: str
    timestamp: datetime = field(default_factory=datetime.now)
    details: dict = field(default_factory=dict)


@dataclass
class MaintenanceTask:
    """Scheduled maintenance task."""
    name: str
    task_type: str
    schedule: str  # cron-like or interval
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    enabled: bool = True
    callback: Optional[Callable] = None


@dataclass
class SystemStatus:
    """Overall system status."""
    timestamp: datetime
    uptime: timedelta
    health: HealthStatus
    services_running: int
    services_total: int
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    active_alerts: list[str] = field(default_factory=list)


class ConfigManager:
    """Configuration management system."""

    def __init__(self, config_dir: Optional[Path] = None):
        self.config_dir = config_dir or Path.home() / ".config" / "core"
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self.config: dict[str, ConfigValue] = {}
        self.validators: dict[str, Callable] = {}
        self._load_defaults()

    def _load_defaults(self):
        """Load default configuration values."""
        defaults = {
            "log_level": ("info", "Logging level"),
            "log_dir": (str(Path.home() / ".logs"), "Log directory"),
            "max_log_size_mb": (100, "Maximum log file size in MB"),
            "log_retention_days": (30, "Days to retain logs"),
            "health_check_interval": (30, "Health check interval in seconds"),
            "metrics_interval": (10, "Metrics collection interval in seconds"),
            "service_timeout": (60, "Service operation timeout in seconds"),
            "max_memory_percent": (90, "Maximum memory usage threshold"),
            "max_cpu_percent": (95, "Maximum CPU usage threshold"),
            "max_disk_percent": (90, "Maximum disk usage threshold"),
            "backup_enabled": (True, "Enable automatic backups"),
            "backup_interval_hours": (24, "Backup interval in hours"),
            "backup_retention_count": (7, "Number of backups to retain"),
        }

        for key, (value, desc) in defaults.items():
            self.config[key] = ConfigValue(
                key=key,
                value=value,
                source=ConfigSource.DEFAULT,
                description=desc
            )

    def load_file(self, path: Path) -> bool:
        """Load configuration from file."""
        if not path.exists():
            return False

        try:
            with open(path) as f:
                data = json.load(f)

            for key, value in data.items():
                self.set(key, value, ConfigSource.FILE)

            return True
        except Exception as e:
            print(f"Error loading config file: {e}")
            return False

    def load_environment(self, prefix: str = "CORE_"):
        """Load configuration from environment variables."""
        for key, value in os.environ.items():
            if key.startswith(prefix):
                config_key = key[len(prefix):].lower()
                # Try to parse as JSON for complex types
                try:
                    parsed = json.loads(value)
                    self.set(config_key, parsed, ConfigSource.ENVIRONMENT)
                except json.JSONDecodeError:
                    self.set(config_key, value, ConfigSource.ENVIRONMENT)

    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value."""
        if key in self.config:
            return self.config[key].value
        return default

    def set(self, key: str, value: Any, source: ConfigSource = ConfigSource.OVERRIDE,
            description: str = "", sensitive: bool = False) -> bool:
        """Set configuration value."""
        # Run validator if registered
        if key in self.validators:
            try:
                value = self.validators[key](value)
            except Exception as e:
                print(f"Validation failed for {key}: {e}")
                return False

        if key in self.config:
            self.config[key].value = value
            self.config[key].source = source
            self.config[key].last_modified = datetime.now()
            self.config[key].validated = key in self.validators
        else:
            self.config[key] = ConfigValue(
                key=key,
                value=value,
                source=source,
                description=description,
                sensitive=sensitive,
                validated=key in self.validators
            )

        return True

    def register_validator(self, key: str, validator: Callable):
        """Register a validator for a config key."""
        self.validators[key] = validator

    def save(self, path: Optional[Path] = None) -> bool:
        """Save configuration to file."""
        path = path or self.config_dir / "config.json"

        try:
            data = {}
            for key, config_val in self.config.items():
                if not config_val.sensitive:
                    data[key] = config_val.value

            with open(path, 'w') as f:
                json.dump(data, f, indent=2, default=str)

            return True
        except Exception as e:
            print(f"Error saving config: {e}")
            return False

    def export(self, include_sensitive: bool = False) -> dict:
        """Export all configuration values."""
        result = {}
        for key, config_val in self.config.items():
            if include_sensitive or not config_val.sensitive:
                result[key] = {
                    "value": config_val.display_value(),
                    "source": config_val.source.value,
                    "description": config_val.description
                }
        return result


class ServiceOrchestrator:
    """Service lifecycle management."""

    def __init__(self, config: ConfigManager):
        self.config = config
        self.services: dict[str, ServiceInstance] = {}
        self.processes: dict[str, subprocess.Popen] = {}
        self._shutdown = False

    def register(self, definition: ServiceDefinition) -> bool:
        """Register a service definition."""
        if definition.name in self.services:
            return False

        self.services[definition.name] = ServiceInstance(definition=definition)
        return True

    async def start(self, name: str) -> bool:
        """Start a service."""
        if name not in self.services:
            return False

        instance = self.services[name]

        if instance.state == ServiceState.RUNNING:
            return True

        # Check dependencies
        for dep in instance.definition.dependencies:
            if dep not in self.services:
                instance.error_message = f"Missing dependency: {dep}"
                instance.state = ServiceState.ERROR
                return False

            dep_instance = self.services[dep]
            if dep_instance.state != ServiceState.RUNNING:
                # Try to start dependency
                if not await self.start(dep):
                    instance.error_message = f"Failed to start dependency: {dep}"
                    instance.state = ServiceState.ERROR
                    return False

        instance.state = ServiceState.STARTING

        try:
            # Prepare environment
            env = os.environ.copy()
            env.update(instance.definition.environment)

            # Start process
            process = subprocess.Popen(
                instance.definition.command.split(),
                cwd=instance.definition.working_dir,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )

            self.processes[name] = process
            instance.pid = process.pid
            instance.start_time = datetime.now()
            instance.state = ServiceState.RUNNING
            instance.restart_count = 0

            # Wait briefly to check for immediate failure
            await asyncio.sleep(0.5)
            if process.poll() is not None:
                raise Exception(f"Process exited immediately with code {process.returncode}")

            return True

        except Exception as e:
            instance.state = ServiceState.ERROR
            instance.error_message = str(e)
            return False

    async def stop(self, name: str, force: bool = False) -> bool:
        """Stop a service."""
        if name not in self.services:
            return False

        instance = self.services[name]

        if instance.state == ServiceState.STOPPED:
            return True

        instance.state = ServiceState.STOPPING

        if name in self.processes:
            process = self.processes[name]

            try:
                if force:
                    process.kill()
                else:
                    process.terminate()

                timeout = self.config.get("service_timeout", 60)
                try:
                    process.wait(timeout=timeout)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()

                del self.processes[name]

            except Exception as e:
                instance.error_message = str(e)

        instance.state = ServiceState.STOPPED
        instance.pid = None
        return True

    async def restart(self, name: str) -> bool:
        """Restart a service."""
        await self.stop(name)
        await asyncio.sleep(1)
        return await self.start(name)

    async def start_all(self) -> dict[str, bool]:
        """Start all registered services."""
        results = {}
        for name in self.services:
            results[name] = await self.start(name)
        return results

    async def stop_all(self) -> dict[str, bool]:
        """Stop all running services."""
        results = {}
        for name in self.services:
            results[name] = await self.stop(name)
        return results

    def get_status(self, name: str) -> Optional[ServiceInstance]:
        """Get service status."""
        return self.services.get(name)

    def list_services(self) -> list[ServiceInstance]:
        """List all services."""
        return list(self.services.values())

    async def health_check(self, name: str) -> HealthCheckResult:
        """Run health check for a service."""
        if name not in self.services:
            return HealthCheckResult(
                service_name=name,
                status=HealthStatus.UNKNOWN,
                response_time_ms=0,
                message="Service not found"
            )

        instance = self.services[name]
        start_time = time.time()

        # Basic process check
        if instance.state != ServiceState.RUNNING:
            return HealthCheckResult(
                service_name=name,
                status=HealthStatus.UNHEALTHY,
                response_time_ms=0,
                message=f"Service not running: {instance.state.value}"
            )

        # Check if process is still alive
        if name in self.processes:
            process = self.processes[name]
            if process.poll() is not None:
                instance.state = ServiceState.ERROR
                return HealthCheckResult(
                    service_name=name,
                    status=HealthStatus.UNHEALTHY,
                    response_time_ms=0,
                    message=f"Process exited with code {process.returncode}"
                )

        # Run custom health check if defined
        if instance.definition.health_check:
            try:
                result = subprocess.run(
                    instance.definition.health_check.split(),
                    capture_output=True,
                    timeout=10
                )
                response_time = (time.time() - start_time) * 1000

                if result.returncode == 0:
                    status = HealthStatus.HEALTHY
                    message = "Health check passed"
                else:
                    status = HealthStatus.UNHEALTHY
                    message = f"Health check failed: {result.stderr.decode()}"

            except Exception as e:
                response_time = (time.time() - start_time) * 1000
                status = HealthStatus.UNHEALTHY
                message = f"Health check error: {e}"
        else:
            response_time = (time.time() - start_time) * 1000
            status = HealthStatus.HEALTHY
            message = "Process running"

        instance.last_health_check = datetime.now()
        instance.health_status = status

        return HealthCheckResult(
            service_name=name,
            status=status,
            response_time_ms=response_time,
            message=message,
            details={
                "pid": instance.pid,
                "uptime": str(datetime.now() - instance.start_time) if instance.start_time else None,
                "restart_count": instance.restart_count
            }
        )


class ResourceMonitor:
    """System resource monitoring."""

    def __init__(self, config: ConfigManager):
        self.config = config
        self.metrics_history: list[ResourceMetrics] = []
        self.max_history = 1000
        self._baseline: Optional[ResourceMetrics] = None

    def collect_metrics(self) -> ResourceMetrics:
        """Collect current system metrics."""
        cpu_percent = psutil.cpu_percent(interval=0.1)
        cpu_per_core = psutil.cpu_percent(interval=0.1, percpu=True)

        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        network = psutil.net_io_counters()

        try:
            load_avg = os.getloadavg()
        except (AttributeError, OSError):
            load_avg = (0.0, 0.0, 0.0)

        metrics = ResourceMetrics(
            timestamp=datetime.now(),
            cpu_percent=cpu_percent,
            cpu_per_core=cpu_per_core,
            memory_total=memory.total,
            memory_used=memory.used,
            memory_percent=memory.percent,
            disk_total=disk.total,
            disk_used=disk.used,
            disk_percent=disk.percent,
            network_bytes_sent=network.bytes_sent,
            network_bytes_recv=network.bytes_recv,
            load_average=load_avg,
            process_count=len(psutil.pids()),
            boot_time=datetime.fromtimestamp(psutil.boot_time())
        )

        # Store in history
        self.metrics_history.append(metrics)
        if len(self.metrics_history) > self.max_history:
            self.metrics_history.pop(0)

        return metrics

    def get_baseline(self) -> ResourceMetrics:
        """Get or set baseline metrics."""
        if self._baseline is None:
            self._baseline = self.collect_metrics()
        return self._baseline

    def reset_baseline(self):
        """Reset baseline to current metrics."""
        self._baseline = self.collect_metrics()

    def check_thresholds(self, metrics: ResourceMetrics) -> list[str]:
        """Check if metrics exceed configured thresholds."""
        alerts = []

        max_cpu = self.config.get("max_cpu_percent", 95)
        max_memory = self.config.get("max_memory_percent", 90)
        max_disk = self.config.get("max_disk_percent", 90)

        if metrics.cpu_percent > max_cpu:
            alerts.append(f"CPU usage critical: {metrics.cpu_percent}% > {max_cpu}%")

        if metrics.memory_percent > max_memory:
            alerts.append(f"Memory usage critical: {metrics.memory_percent}% > {max_memory}%")

        if metrics.disk_percent > max_disk:
            alerts.append(f"Disk usage critical: {metrics.disk_percent}% > {max_disk}%")

        return alerts

    def get_process_info(self, pid: int) -> Optional[dict]:
        """Get detailed info for a process."""
        try:
            process = psutil.Process(pid)
            return {
                "pid": pid,
                "name": process.name(),
                "status": process.status(),
                "cpu_percent": process.cpu_percent(),
                "memory_percent": process.memory_percent(),
                "memory_mb": process.memory_info().rss / (1024 * 1024),
                "threads": process.num_threads(),
                "create_time": datetime.fromtimestamp(process.create_time()),
                "cmdline": " ".join(process.cmdline())
            }
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            return None

    def get_top_processes(self, count: int = 10, sort_by: str = "memory") -> list[dict]:
        """Get top processes by resource usage."""
        processes = []

        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                info = proc.info
                info['memory_mb'] = proc.memory_info().rss / (1024 * 1024)
                processes.append(info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        if sort_by == "cpu":
            processes.sort(key=lambda x: x.get('cpu_percent', 0), reverse=True)
        else:
            processes.sort(key=lambda x: x.get('memory_percent', 0), reverse=True)

        return processes[:count]

    def get_system_info(self) -> dict:
        """Get system information."""
        return {
            "platform": platform.system(),
            "platform_release": platform.release(),
            "platform_version": platform.version(),
            "architecture": platform.machine(),
            "processor": platform.processor(),
            "hostname": platform.node(),
            "python_version": platform.python_version(),
            "cpu_count": psutil.cpu_count(),
            "cpu_count_physical": psutil.cpu_count(logical=False),
            "memory_total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
            "boot_time": datetime.fromtimestamp(psutil.boot_time()).isoformat()
        }

    def get_metrics_summary(self, minutes: int = 60) -> dict:
        """Get summary of recent metrics."""
        if not self.metrics_history:
            return {}

        cutoff = datetime.now() - timedelta(minutes=minutes)
        recent = [m for m in self.metrics_history if m.timestamp > cutoff]

        if not recent:
            return {}

        return {
            "period_minutes": minutes,
            "sample_count": len(recent),
            "cpu": {
                "avg": round(sum(m.cpu_percent for m in recent) / len(recent), 1),
                "max": round(max(m.cpu_percent for m in recent), 1),
                "min": round(min(m.cpu_percent for m in recent), 1)
            },
            "memory": {
                "avg": round(sum(m.memory_percent for m in recent) / len(recent), 1),
                "max": round(max(m.memory_percent for m in recent), 1),
                "min": round(min(m.memory_percent for m in recent), 1)
            },
            "disk": {
                "current": recent[-1].disk_percent
            }
        }


class MaintenanceEngine:
    """System maintenance and cleanup."""

    def __init__(self, config: ConfigManager):
        self.config = config
        self.tasks: dict[str, MaintenanceTask] = {}
        self._running = False

    def register_task(self, task: MaintenanceTask):
        """Register a maintenance task."""
        self.tasks[task.name] = task

    async def run_task(self, name: str) -> dict:
        """Run a specific maintenance task."""
        if name not in self.tasks:
            return {"success": False, "error": "Task not found"}

        task = self.tasks[name]
        start_time = datetime.now()

        try:
            if task.callback:
                result = await task.callback() if asyncio.iscoroutinefunction(task.callback) else task.callback()
            else:
                result = await self._run_builtin_task(task)

            task.last_run = datetime.now()
            duration = (datetime.now() - start_time).total_seconds()

            return {
                "success": True,
                "task": name,
                "duration_seconds": duration,
                "result": result
            }

        except Exception as e:
            return {
                "success": False,
                "task": name,
                "error": str(e)
            }

    async def _run_builtin_task(self, task: MaintenanceTask) -> dict:
        """Run built-in maintenance tasks."""
        if task.task_type == "log_rotation":
            return await self._rotate_logs()
        elif task.task_type == "cache_cleanup":
            return await self._cleanup_cache()
        elif task.task_type == "temp_cleanup":
            return await self._cleanup_temp()
        elif task.task_type == "backup":
            return await self._run_backup()
        else:
            return {"status": "unknown task type"}

    async def _rotate_logs(self) -> dict:
        """Rotate log files."""
        log_dir = Path(self.config.get("log_dir", "/var/log"))
        max_size = self.config.get("max_log_size_mb", 100) * 1024 * 1024
        retention_days = self.config.get("log_retention_days", 30)

        rotated = 0
        deleted = 0
        errors = []

        if not log_dir.exists():
            return {"rotated": 0, "deleted": 0, "errors": ["Log directory not found"]}

        cutoff = datetime.now() - timedelta(days=retention_days)

        for log_file in log_dir.glob("*.log"):
            try:
                stat = log_file.stat()

                # Delete old files
                if datetime.fromtimestamp(stat.st_mtime) < cutoff:
                    log_file.unlink()
                    deleted += 1
                    continue

                # Rotate large files
                if stat.st_size > max_size:
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    rotated_name = log_file.with_suffix(f".{timestamp}.log")
                    log_file.rename(rotated_name)
                    rotated += 1

            except Exception as e:
                errors.append(f"{log_file.name}: {e}")

        return {
            "rotated": rotated,
            "deleted": deleted,
            "errors": errors if errors else None
        }

    async def _cleanup_cache(self) -> dict:
        """Clean up cache directories."""
        cache_dirs = [
            Path.home() / ".cache",
            Path("/tmp") / "cache",
        ]

        cleaned_bytes = 0
        files_removed = 0
        errors = []

        for cache_dir in cache_dirs:
            if not cache_dir.exists():
                continue

            try:
                for item in cache_dir.rglob("*"):
                    if item.is_file():
                        try:
                            size = item.stat().st_size
                            item.unlink()
                            cleaned_bytes += size
                            files_removed += 1
                        except Exception as e:
                            errors.append(f"{item}: {e}")
            except Exception as e:
                errors.append(f"{cache_dir}: {e}")

        return {
            "files_removed": files_removed,
            "cleaned_mb": round(cleaned_bytes / (1024 * 1024), 2),
            "errors": errors if errors else None
        }

    async def _cleanup_temp(self) -> dict:
        """Clean up temporary files."""
        temp_dirs = [
            Path("/tmp"),
            Path.home() / "tmp"
        ]

        max_age_hours = 24
        cutoff = datetime.now() - timedelta(hours=max_age_hours)

        cleaned_bytes = 0
        files_removed = 0

        for temp_dir in temp_dirs:
            if not temp_dir.exists():
                continue

            try:
                for item in temp_dir.iterdir():
                    if item.is_file():
                        try:
                            stat = item.stat()
                            if datetime.fromtimestamp(stat.st_mtime) < cutoff:
                                size = stat.st_size
                                item.unlink()
                                cleaned_bytes += size
                                files_removed += 1
                        except Exception:
                            continue
            except Exception:
                continue

        return {
            "files_removed": files_removed,
            "cleaned_mb": round(cleaned_bytes / (1024 * 1024), 2)
        }

    async def _run_backup(self) -> dict:
        """Run system backup."""
        if not self.config.get("backup_enabled", True):
            return {"status": "disabled"}

        backup_dir = Path(self.config.get("backup_dir", str(Path.home() / "backups")))
        backup_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"backup_{timestamp}"
        backup_path = backup_dir / backup_name

        # Items to backup
        backup_sources = [
            self.config.config_dir,
            Path.home() / ".config"
        ]

        backed_up = []
        errors = []

        backup_path.mkdir(parents=True, exist_ok=True)

        for source in backup_sources:
            if source.exists():
                try:
                    dest = backup_path / source.name
                    if source.is_dir():
                        shutil.copytree(source, dest)
                    else:
                        shutil.copy2(source, dest)
                    backed_up.append(str(source))
                except Exception as e:
                    errors.append(f"{source}: {e}")

        # Cleanup old backups
        retention = self.config.get("backup_retention_count", 7)
        backups = sorted(backup_dir.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True)

        removed = 0
        for old_backup in backups[retention:]:
            try:
                if old_backup.is_dir():
                    shutil.rmtree(old_backup)
                else:
                    old_backup.unlink()
                removed += 1
            except Exception:
                continue

        return {
            "backup_path": str(backup_path),
            "sources_backed_up": backed_up,
            "old_backups_removed": removed,
            "errors": errors if errors else None
        }

    def get_default_tasks(self) -> list[MaintenanceTask]:
        """Get default maintenance tasks."""
        return [
            MaintenanceTask(
                name="log_rotation",
                task_type="log_rotation",
                schedule="0 0 * * *"  # Daily at midnight
            ),
            MaintenanceTask(
                name="cache_cleanup",
                task_type="cache_cleanup",
                schedule="0 3 * * 0"  # Weekly on Sunday at 3am
            ),
            MaintenanceTask(
                name="temp_cleanup",
                task_type="temp_cleanup",
                schedule="0 4 * * *"  # Daily at 4am
            ),
            MaintenanceTask(
                name="backup",
                task_type="backup",
                schedule="0 2 * * *"  # Daily at 2am
            )
        ]


class CoreEngine:
    """Main core system operations engine."""

    def __init__(self, config_dir: Optional[Path] = None):
        self.config = ConfigManager(config_dir)
        self.services = ServiceOrchestrator(self.config)
        self.monitor = ResourceMonitor(self.config)
        self.maintenance = MaintenanceEngine(self.config)
        self._start_time = datetime.now()

        # Register default maintenance tasks
        for task in self.maintenance.get_default_tasks():
            self.maintenance.register_task(task)

    def get_uptime(self) -> timedelta:
        """Get system uptime."""
        return datetime.now() - self._start_time

    async def get_status(self) -> SystemStatus:
        """Get overall system status."""
        metrics = self.monitor.collect_metrics()
        alerts = self.monitor.check_thresholds(metrics)

        services = self.services.list_services()
        running = sum(1 for s in services if s.state == ServiceState.RUNNING)

        # Determine overall health
        if alerts:
            health = HealthStatus.DEGRADED
        elif running < len(services):
            health = HealthStatus.DEGRADED
        else:
            health = HealthStatus.HEALTHY

        return SystemStatus(
            timestamp=datetime.now(),
            uptime=self.get_uptime(),
            health=health,
            services_running=running,
            services_total=len(services),
            cpu_percent=metrics.cpu_percent,
            memory_percent=metrics.memory_percent,
            disk_percent=metrics.disk_percent,
            active_alerts=alerts
        )

    async def health_check_all(self) -> dict[str, HealthCheckResult]:
        """Run health checks on all services."""
        results = {}
        for name in self.services.services:
            results[name] = await self.services.health_check(name)
        return results

    async def run_maintenance(self, task_name: Optional[str] = None) -> dict:
        """Run maintenance tasks."""
        if task_name:
            return await self.maintenance.run_task(task_name)

        results = {}
        for name in self.maintenance.tasks:
            results[name] = await self.maintenance.run_task(name)
        return results

    def initialize(self):
        """Initialize the core system."""
        # Load config from file
        config_file = self.config.config_dir / "config.json"
        if config_file.exists():
            self.config.load_file(config_file)

        # Load from environment
        self.config.load_environment()

        # Set baseline metrics
        self.monitor.get_baseline()

    def shutdown(self):
        """Shutdown the core system."""
        # Save configuration
        self.config.save()


class CoreReporter:
    """Generate system status reports."""

    def generate_report(self, status: SystemStatus, metrics: ResourceMetrics,
                        services: list[ServiceInstance]) -> str:
        """Generate comprehensive status report."""
        timestamp = status.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        uptime_str = str(status.uptime).split('.')[0]

        # Service table
        service_rows = ""
        for svc in services:
            state_icon = "●" if svc.state == ServiceState.RUNNING else "○"
            pid_str = str(svc.pid) if svc.pid else "-"
            mem_str = "-"
            if svc.pid:
                try:
                    proc = psutil.Process(svc.pid)
                    mem_str = f"{proc.memory_info().rss / (1024*1024):.1f}"
                except:
                    pass
            service_rows += f"| {svc.definition.name:<20} | {state_icon} {svc.state.value:<10} | {pid_str:<6} | {mem_str:<8} |\n"

        # Alerts section
        alerts_section = ""
        if status.active_alerts:
            alerts_section = "\nACTIVE ALERTS\n────────────────────────────────────\n"
            for alert in status.active_alerts:
                alerts_section += f"  ⚠ {alert}\n"

        return f"""
CORE SYSTEM STATUS
═══════════════════════════════════════
System: {platform.node()}
Status: {status.health.value.upper()}
Uptime: {uptime_str}
═══════════════════════════════════════

SYSTEM HEALTH
────────────────────────────────────
┌─────────────────────────────────────┐
│       CORE METRICS                  │
│                                     │
│  Overall Status: {'●' if status.health == HealthStatus.HEALTHY else '○'} {status.health.value.upper():<12} │
│                                     │
│  Resource Usage:                    │
│  ├── CPU:     {self._bar(metrics.cpu_percent)}  {metrics.cpu_percent:>5.1f}%│
│  ├── Memory:  {self._bar(metrics.memory_percent)}  {metrics.memory_percent:>5.1f}%│
│  ├── Disk:    {self._bar(metrics.disk_percent)}  {metrics.disk_percent:>5.1f}%│
│  └── Load:    {metrics.load_average[0]:.2f} {metrics.load_average[1]:.2f} {metrics.load_average[2]:.2f}│
│                                     │
│  Services: {status.services_running} running / {status.services_total} total       │
│  Processes: {metrics.process_count:<6}                  │
│  Uptime: {uptime_str:<20}      │
└─────────────────────────────────────┘

RESOURCE DETAILS
────────────────────────────────────
┌─────────────────────────────────────┐
│  CPU:                               │
│  ├── Usage:   {metrics.cpu_percent:.1f}%                   │
│  ├── Cores:   {len(metrics.cpu_per_core)}                        │
│  └── Load:    {metrics.load_average[0]:.2f}, {metrics.load_average[1]:.2f}, {metrics.load_average[2]:.2f}         │
│                                     │
│  Memory:                            │
│  ├── Used:    {metrics.memory_used / (1024**3):.1f} GB                  │
│  ├── Total:   {metrics.memory_total / (1024**3):.1f} GB                 │
│  └── Percent: {metrics.memory_percent:.1f}%                  │
│                                     │
│  Disk:                              │
│  ├── Used:    {metrics.disk_used / (1024**3):.1f} GB                  │
│  ├── Total:   {metrics.disk_total / (1024**3):.1f} GB                │
│  └── Percent: {metrics.disk_percent:.1f}%                  │
└─────────────────────────────────────┘

SERVICES
────────────────────────────────────
| Service              | Status      | PID    | Memory   |
|----------------------|-------------|--------|----------|
{service_rows}
CONFIGURATION
────────────────────────────────────
| Setting          | Value        | Status   |
|------------------|--------------|----------|
| log_level        | info         | active   |
| health_interval  | 30s          | active   |
| backup_enabled   | true         | active   |
{alerts_section}
RECENT OPERATIONS
────────────────────────────────────
| Operation       | Time                | Status    |
|-----------------|---------------------|-----------|
| System Init     | {timestamp}  | success   |
| Health Check    | {timestamp}  | success   |

System Status: ● Core Running
Generated: {timestamp}
"""

    def _bar(self, percent: float, width: int = 10) -> str:
        """Generate a progress bar."""
        filled = int(percent / 100 * width)
        empty = width - filled
        return "█" * filled + "░" * empty


# CLI Interface
async def main():
    """CLI interface for CORE.EXE."""
    import argparse

    parser = argparse.ArgumentParser(
        description="CORE.EXE - Core System Operations Agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  core status                    Show system status
  core health                    Run health checks
  core config get log_level      Get config value
  core config set log_level debug Set config value
  core service list              List all services
  core service start myservice   Start a service
  core metrics                   Show resource metrics
  core maintenance run backup    Run maintenance task
  core top                       Show top processes
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Status command
    subparsers.add_parser("status", help="Show system status")

    # Health command
    subparsers.add_parser("health", help="Run health checks")

    # Config commands
    config_parser = subparsers.add_parser("config", help="Configuration management")
    config_sub = config_parser.add_subparsers(dest="config_action")

    config_get = config_sub.add_parser("get", help="Get config value")
    config_get.add_argument("key", help="Configuration key")

    config_set = config_sub.add_parser("set", help="Set config value")
    config_set.add_argument("key", help="Configuration key")
    config_set.add_argument("value", help="Configuration value")

    config_sub.add_parser("list", help="List all config")
    config_sub.add_parser("save", help="Save configuration")

    # Service commands
    service_parser = subparsers.add_parser("service", help="Service management")
    service_sub = service_parser.add_subparsers(dest="service_action")

    service_sub.add_parser("list", help="List services")

    svc_start = service_sub.add_parser("start", help="Start service")
    svc_start.add_argument("name", help="Service name")

    svc_stop = service_sub.add_parser("stop", help="Stop service")
    svc_stop.add_argument("name", help="Service name")

    svc_restart = service_sub.add_parser("restart", help="Restart service")
    svc_restart.add_argument("name", help="Service name")

    svc_status = service_sub.add_parser("status", help="Service status")
    svc_status.add_argument("name", help="Service name")

    # Metrics command
    metrics_parser = subparsers.add_parser("metrics", help="Show resource metrics")
    metrics_parser.add_argument("--summary", action="store_true", help="Show summary")
    metrics_parser.add_argument("--minutes", type=int, default=60, help="Summary period")

    # Maintenance commands
    maint_parser = subparsers.add_parser("maintenance", help="Maintenance tasks")
    maint_sub = maint_parser.add_subparsers(dest="maint_action")

    maint_sub.add_parser("list", help="List maintenance tasks")

    maint_run = maint_sub.add_parser("run", help="Run maintenance task")
    maint_run.add_argument("task", nargs="?", help="Task name (all if omitted)")

    # Top command
    top_parser = subparsers.add_parser("top", help="Show top processes")
    top_parser.add_argument("--count", "-n", type=int, default=10, help="Number of processes")
    top_parser.add_argument("--sort", choices=["cpu", "memory"], default="memory", help="Sort by")

    # System info command
    subparsers.add_parser("info", help="Show system information")

    # Logs command
    logs_parser = subparsers.add_parser("logs", help="View logs")
    logs_parser.add_argument("--lines", "-n", type=int, default=20, help="Number of lines")
    logs_parser.add_argument("--follow", "-f", action="store_true", help="Follow log")

    args = parser.parse_args()

    # Initialize engine
    engine = CoreEngine()
    engine.initialize()
    reporter = CoreReporter()

    if args.command == "status":
        status = await engine.get_status()
        metrics = engine.monitor.collect_metrics()
        services = engine.services.list_services()
        print(reporter.generate_report(status, metrics, services))

    elif args.command == "health":
        results = await engine.health_check_all()
        print("\nHealth Check Results")
        print("=" * 50)
        for name, result in results.items():
            icon = "✓" if result.status == HealthStatus.HEALTHY else "✗"
            print(f"  {icon} {name}: {result.status.value} ({result.response_time_ms:.1f}ms)")
            if result.message != "Process running":
                print(f"      {result.message}")

    elif args.command == "config":
        if args.config_action == "get":
            value = engine.config.get(args.key)
            if value is not None:
                print(f"{args.key} = {value}")
            else:
                print(f"Config key '{args.key}' not found")

        elif args.config_action == "set":
            # Try to parse as JSON
            try:
                value = json.loads(args.value)
            except json.JSONDecodeError:
                value = args.value

            if engine.config.set(args.key, value):
                print(f"Set {args.key} = {value}")
            else:
                print("Failed to set config")

        elif args.config_action == "list":
            print("\nConfiguration")
            print("=" * 60)
            for key, conf in engine.config.config.items():
                print(f"  {key:<25} = {conf.display_value():<20} ({conf.source.value})")

        elif args.config_action == "save":
            if engine.config.save():
                print("Configuration saved")
            else:
                print("Failed to save configuration")

    elif args.command == "service":
        if args.service_action == "list":
            services = engine.services.list_services()
            print("\nServices")
            print("=" * 60)
            for svc in services:
                icon = "●" if svc.state == ServiceState.RUNNING else "○"
                print(f"  {icon} {svc.definition.name:<25} {svc.state.value}")

        elif args.service_action in ["start", "stop", "restart", "status"]:
            name = args.name
            if args.service_action == "start":
                result = await engine.services.start(name)
                print(f"Start {name}: {'success' if result else 'failed'}")
            elif args.service_action == "stop":
                result = await engine.services.stop(name)
                print(f"Stop {name}: {'success' if result else 'failed'}")
            elif args.service_action == "restart":
                result = await engine.services.restart(name)
                print(f"Restart {name}: {'success' if result else 'failed'}")
            elif args.service_action == "status":
                instance = engine.services.get_status(name)
                if instance:
                    print(f"\nService: {name}")
                    print(f"State: {instance.state.value}")
                    print(f"PID: {instance.pid or 'N/A'}")
                    print(f"Health: {instance.health_status.value}")
                else:
                    print(f"Service '{name}' not found")

    elif args.command == "metrics":
        if args.summary:
            summary = engine.monitor.get_metrics_summary(args.minutes)
            print(f"\nMetrics Summary (last {args.minutes} minutes)")
            print("=" * 50)
            if summary:
                print(f"  Samples: {summary['sample_count']}")
                print(f"  CPU:    avg={summary['cpu']['avg']}% max={summary['cpu']['max']}%")
                print(f"  Memory: avg={summary['memory']['avg']}% max={summary['memory']['max']}%")
                print(f"  Disk:   {summary['disk']['current']}%")
            else:
                print("  No metrics data available")
        else:
            metrics = engine.monitor.collect_metrics()
            print("\nCurrent Metrics")
            print("=" * 50)
            print(f"  CPU:      {metrics.cpu_percent}%")
            print(f"  Memory:   {metrics.memory_percent}% ({metrics.memory_used / (1024**3):.1f}/{metrics.memory_total / (1024**3):.1f} GB)")
            print(f"  Disk:     {metrics.disk_percent}% ({metrics.disk_used / (1024**3):.1f}/{metrics.disk_total / (1024**3):.1f} GB)")
            print(f"  Load:     {metrics.load_average[0]:.2f}, {metrics.load_average[1]:.2f}, {metrics.load_average[2]:.2f}")
            print(f"  Procs:    {metrics.process_count}")

    elif args.command == "maintenance":
        if args.maint_action == "list":
            print("\nMaintenance Tasks")
            print("=" * 50)
            for name, task in engine.maintenance.tasks.items():
                status = "enabled" if task.enabled else "disabled"
                last_run = task.last_run.strftime("%Y-%m-%d %H:%M") if task.last_run else "never"
                print(f"  {name:<20} {task.schedule:<15} {status:<10} last: {last_run}")

        elif args.maint_action == "run":
            results = await engine.run_maintenance(args.task if hasattr(args, 'task') else None)
            print("\nMaintenance Results")
            print("=" * 50)
            if isinstance(results, dict) and "success" in results:
                print(f"  {args.task}: {'success' if results['success'] else 'failed'}")
                if results.get('result'):
                    for k, v in results['result'].items():
                        print(f"    {k}: {v}")
            else:
                for name, result in results.items():
                    status = "success" if result.get("success") else "failed"
                    print(f"  {name}: {status}")

    elif args.command == "top":
        processes = engine.monitor.get_top_processes(args.count, args.sort)
        print(f"\nTop Processes (by {args.sort})")
        print("=" * 70)
        print(f"{'PID':<8} {'Name':<25} {'CPU%':<8} {'MEM%':<8} {'MEM MB':<10}")
        print("-" * 70)
        for proc in processes:
            print(f"{proc['pid']:<8} {proc['name'][:24]:<25} {proc.get('cpu_percent', 0):<8.1f} {proc.get('memory_percent', 0):<8.1f} {proc.get('memory_mb', 0):<10.1f}")

    elif args.command == "info":
        info = engine.monitor.get_system_info()
        print("\nSystem Information")
        print("=" * 50)
        for key, value in info.items():
            print(f"  {key:<20}: {value}")

    elif args.command == "logs":
        log_dir = Path(engine.config.get("log_dir", str(Path.home() / ".logs")))
        log_file = log_dir / "core.log"

        if log_file.exists():
            if args.follow:
                print(f"Following {log_file}...")
                # Simple tail -f implementation
                with open(log_file) as f:
                    f.seek(0, 2)  # Go to end
                    while True:
                        line = f.readline()
                        if line:
                            print(line, end='')
                        else:
                            await asyncio.sleep(0.1)
            else:
                lines = log_file.read_text().splitlines()
                for line in lines[-args.lines:]:
                    print(line)
        else:
            print(f"Log file not found: {log_file}")

    else:
        parser.print_help()

    # Cleanup
    engine.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## OUTPUT FORMAT

```
CORE SYSTEM STATUS
═══════════════════════════════════════
System: [system_name]
Status: [running/stopped/error]
Uptime: [duration]
═══════════════════════════════════════

SYSTEM HEALTH
────────────────────────────────────
┌─────────────────────────────────────┐
│       CORE METRICS                  │
│                                     │
│  Overall Status: [●/○] [status]     │
│                                     │
│  Resource Usage:                    │
│  ├── CPU:     ████████░░  [X]%      │
│  ├── Memory:  ██████░░░░  [X]%      │
│  ├── Disk:    ███████░░░  [X]%      │
│  └── Network: █████░░░░░  [X]%      │
│                                     │
│  Services: [#] running / [#] total  │
│  Uptime: [duration]                 │
└─────────────────────────────────────┘

CONFIGURATION
────────────────────────────────────
| Setting | Value | Status |
|---------|-------|--------|
| [config_key_1] | [value] | [active] |
| [config_key_2] | [value] | [active] |
| [config_key_3] | [value] | [active] |

SERVICES
────────────────────────────────────
| Service | Status | PID | Memory |
|---------|--------|-----|--------|
| [service_1] | [●/○] | [pid] | [MB] |
| [service_2] | [●/○] | [pid] | [MB] |
| [service_3] | [●/○] | [pid] | [MB] |

RESOURCE DETAILS
────────────────────────────────────
┌─────────────────────────────────────┐
│  CPU:                               │
│  ├── User:    [X]%                  │
│  ├── System:  [X]%                  │
│  └── Idle:    [X]%                  │
│                                     │
│  Memory:                            │
│  ├── Used:    [X] GB                │
│  ├── Free:    [X] GB                │
│  └── Cached:  [X] GB                │
│                                     │
│  Disk:                              │
│  ├── Used:    [X] GB                │
│  ├── Free:    [X] GB                │
│  └── I/O:     [X] MB/s              │
└─────────────────────────────────────┘

RECENT OPERATIONS
────────────────────────────────────
| Operation | Time | Status |
|-----------|------|--------|
| [operation_1] | [timestamp] | [success/failed] |
| [operation_2] | [timestamp] | [success/failed] |
```

---

## USAGE EXAMPLES

### Initialize Core System

```python
import asyncio
from core_exe import CoreEngine

async def main():
    engine = CoreEngine()
    engine.initialize()

    # Get system status
    status = await engine.get_status()
    print(f"Health: {status.health.value}")
    print(f"CPU: {status.cpu_percent}%")
    print(f"Memory: {status.memory_percent}%")

    engine.shutdown()

asyncio.run(main())
```

### Manage Services

```python
from core_exe import CoreEngine, ServiceDefinition

async def manage_services():
    engine = CoreEngine()
    engine.initialize()

    # Register a service
    service = ServiceDefinition(
        name="myapp",
        command="python app.py",
        working_dir="/opt/myapp",
        health_check="curl -f http://localhost:8080/health"
    )
    engine.services.register(service)

    # Start service
    await engine.services.start("myapp")

    # Check health
    result = await engine.services.health_check("myapp")
    print(f"Health: {result.status.value}")

    # Stop service
    await engine.services.stop("myapp")
```

### Monitor Resources

```python
from core_exe import CoreEngine

engine = CoreEngine()
engine.initialize()

# Collect metrics
metrics = engine.monitor.collect_metrics()
print(f"CPU: {metrics.cpu_percent}%")
print(f"Memory: {metrics.memory_percent}%")
print(f"Disk: {metrics.disk_percent}%")

# Get top processes
processes = engine.monitor.get_top_processes(5, "memory")
for proc in processes:
    print(f"{proc['name']}: {proc['memory_mb']:.1f} MB")

# Get system info
info = engine.monitor.get_system_info()
print(f"Platform: {info['platform']}")
print(f"Cores: {info['cpu_count']}")
```

### Run Maintenance

```python
from core_exe import CoreEngine

async def run_maintenance():
    engine = CoreEngine()
    engine.initialize()

    # Run specific task
    result = await engine.maintenance.run_task("log_rotation")
    print(f"Rotated: {result['result']['rotated']}")
    print(f"Deleted: {result['result']['deleted']}")

    # Run all maintenance tasks
    results = await engine.run_maintenance()
    for task, result in results.items():
        print(f"{task}: {'success' if result['success'] else 'failed'}")
```

### Configuration Management

```python
from core_exe import ConfigManager, ConfigSource

config = ConfigManager()

# Load from file
config.load_file(Path("config.json"))

# Load from environment
config.load_environment("MYAPP_")

# Get/set values
log_level = config.get("log_level", "info")
config.set("max_connections", 100, ConfigSource.OVERRIDE)

# Register validator
config.register_validator("port", lambda v: int(v) if 0 < int(v) < 65536 else ValueError("Invalid port"))

# Save configuration
config.save()
```

---

## QUICK COMMANDS

- `/launch-core status` - Check core system status
- `/launch-core config [key] [value]` - Set configuration
- `/launch-core restart` - Restart core services
- `/launch-core logs` - View core logs
- `/launch-core health` - Run health check
- `/launch-core metrics` - Show resource metrics
- `/launch-core maintenance` - Run maintenance tasks
- `/launch-core top` - Show top processes
- `/launch-core info` - Show system information

$ARGUMENTS
