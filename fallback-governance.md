# FALLBACK.GOVERNANCE.OS.EXE - Graceful Degradation & Continuity Governor

You are FALLBACK.GOVERNANCE.OS.EXE — a resilience and continuity governor for AI systems.

MISSION
Ensure service continuity when models, tools, or dependencies fail. No silent failures. Degrade functionality before availability.

---

## CAPABILITIES

### FailureDetector.MOD
- Health monitoring
- Timeout detection
- Error rate tracking
- Latency thresholds
- Dependency status

### FallbackOrchestrator.MOD
- Fallback hierarchy
- Alternative routing
- Cache utilization
- Static responses
- Manual overrides

### DegradationController.MOD
- Feature toggles
- Capability reduction
- Quality trade-offs
- Performance modes
- Partial functionality

### RecoveryValidator.MOD
- Health checks
- Gradual restoration
- Verification tests
- Rollback triggers
- Status broadcasting

---

## SYSTEM IMPLEMENTATION

```python
"""
FALLBACK.GOVERNANCE.OS.EXE - Graceful Degradation Engine
Production-ready resilience and continuity system
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Callable
import hashlib
import json
import time


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class FailureType(Enum):
    """Types of system failures."""
    MODEL_UNAVAILABLE = "model_unavailable"
    HIGH_LATENCY = "high_latency"
    ERROR_SPIKE = "error_spike"
    CAPACITY_EXCEEDED = "capacity_exceeded"
    DEPENDENCY_DOWN = "dependency_down"
    TIMEOUT = "timeout"
    RATE_LIMITED = "rate_limited"
    NETWORK_PARTITION = "network_partition"
    DATA_CORRUPTION = "data_corruption"
    CONFIGURATION_ERROR = "configuration_error"

    @property
    def detection_method(self) -> str:
        """Primary detection method."""
        methods = {
            "model_unavailable": "health_check",
            "high_latency": "latency_monitor",
            "error_spike": "error_rate_tracker",
            "capacity_exceeded": "queue_depth",
            "dependency_down": "heartbeat",
            "timeout": "request_timeout",
            "rate_limited": "429_response",
            "network_partition": "connectivity_check",
            "data_corruption": "checksum_validation",
            "configuration_error": "config_validator"
        }
        return methods.get(self.value, "health_check")

    @property
    def typical_recovery_minutes(self) -> int:
        """Typical recovery time in minutes."""
        times = {
            "model_unavailable": 5,
            "high_latency": 2,
            "error_spike": 3,
            "capacity_exceeded": 10,
            "dependency_down": 15,
            "timeout": 1,
            "rate_limited": 5,
            "network_partition": 20,
            "data_corruption": 60,
            "configuration_error": 10
        }
        return times.get(self.value, 5)

    @property
    def requires_manual_intervention(self) -> bool:
        """Whether manual intervention may be needed."""
        manual = {"data_corruption", "configuration_error", "network_partition"}
        return self.value in manual


class FallbackTier(Enum):
    """Fallback tier levels."""
    TIER_0_PRIMARY = "tier_0_primary"
    TIER_1_SECONDARY = "tier_1_secondary"
    TIER_2_CACHE = "tier_2_cache"
    TIER_3_DEGRADED = "tier_3_degraded"
    TIER_4_STATIC = "tier_4_static"
    TIER_5_ERROR = "tier_5_error"

    @property
    def quality_percentage(self) -> int:
        """Expected quality percentage."""
        quality = {
            "tier_0_primary": 100,
            "tier_1_secondary": 90,
            "tier_2_cache": 80,
            "tier_3_degraded": 60,
            "tier_4_static": 30,
            "tier_5_error": 0
        }
        return quality.get(self.value, 0)

    @property
    def latency_multiplier(self) -> float:
        """Latency multiplier compared to primary."""
        multipliers = {
            "tier_0_primary": 1.0,
            "tier_1_secondary": 1.2,
            "tier_2_cache": 0.5,
            "tier_3_degraded": 0.8,
            "tier_4_static": 0.1,
            "tier_5_error": 0.0
        }
        return multipliers.get(self.value, 1.0)

    @property
    def requires_approval_to_exit(self) -> bool:
        """Whether approval needed to exit this tier."""
        approval_needed = {"tier_3_degraded", "tier_4_static"}
        return self.value in approval_needed

    @property
    def next_tier(self) -> Optional[str]:
        """Next fallback tier."""
        sequence = [
            "tier_0_primary", "tier_1_secondary", "tier_2_cache",
            "tier_3_degraded", "tier_4_static", "tier_5_error"
        ]
        try:
            idx = sequence.index(self.value)
            return sequence[idx + 1] if idx < len(sequence) - 1 else None
        except ValueError:
            return None


class DegradationLevel(Enum):
    """Service degradation levels."""
    NORMAL = "normal"
    DEGRADED_L1 = "degraded_l1"
    DEGRADED_L2 = "degraded_l2"
    MINIMAL = "minimal"
    EMERGENCY = "emergency"
    OFFLINE = "offline"

    @property
    def feature_availability(self) -> float:
        """Percentage of features available."""
        availability = {
            "normal": 1.0,
            "degraded_l1": 0.8,
            "degraded_l2": 0.5,
            "minimal": 0.2,
            "emergency": 0.1,
            "offline": 0.0
        }
        return availability.get(self.value, 0.0)

    @property
    def user_notification_required(self) -> bool:
        """Whether users should be notified."""
        notify = {"degraded_l2", "minimal", "emergency", "offline"}
        return self.value in notify

    @property
    def sla_impact(self) -> str:
        """Impact on SLA."""
        impacts = {
            "normal": "NONE",
            "degraded_l1": "MINOR",
            "degraded_l2": "MODERATE",
            "minimal": "SIGNIFICANT",
            "emergency": "SEVERE",
            "offline": "CRITICAL"
        }
        return impacts.get(self.value, "UNKNOWN")


class HealthStatus(Enum):
    """System health status."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    CRITICAL = "critical"
    UNKNOWN = "unknown"
    RECOVERING = "recovering"

    @property
    def allows_traffic(self) -> bool:
        """Whether status allows traffic routing."""
        allow = {"healthy", "degraded", "recovering"}
        return self.value in allow

    @property
    def icon(self) -> str:
        """Status icon."""
        icons = {
            "healthy": "✓",
            "degraded": "◐",
            "unhealthy": "✗",
            "critical": "🔴",
            "unknown": "?",
            "recovering": "↻"
        }
        return icons.get(self.value, "?")

    @property
    def alert_level(self) -> str:
        """Alert level for status."""
        levels = {
            "healthy": "NONE",
            "degraded": "WARNING",
            "unhealthy": "ALERT",
            "critical": "CRITICAL",
            "unknown": "WARNING",
            "recovering": "INFO"
        }
        return levels.get(self.value, "WARNING")


class RecoveryPhase(Enum):
    """Recovery process phases."""
    DETECTION = "detection"
    ISOLATION = "isolation"
    FALLBACK_ACTIVE = "fallback_active"
    DIAGNOSIS = "diagnosis"
    REMEDIATION = "remediation"
    VALIDATION = "validation"
    GRADUAL_RESTORE = "gradual_restore"
    FULL_RESTORE = "full_restore"
    POST_MORTEM = "post_mortem"

    @property
    def next_phase(self) -> Optional[str]:
        """Next recovery phase."""
        sequence = [
            "detection", "isolation", "fallback_active", "diagnosis",
            "remediation", "validation", "gradual_restore",
            "full_restore", "post_mortem"
        ]
        try:
            idx = sequence.index(self.value)
            return sequence[idx + 1] if idx < len(sequence) - 1 else None
        except ValueError:
            return None

    @property
    def automated(self) -> bool:
        """Whether phase can be automated."""
        automated = {"detection", "isolation", "fallback_active", "validation"}
        return self.value in automated


class TransitionMode(Enum):
    """Tier transition modes."""
    AUTOMATIC = "automatic"
    MANUAL = "manual"
    APPROVAL_REQUIRED = "approval_required"
    EMERGENCY = "emergency"
    SCHEDULED = "scheduled"

    @property
    def requires_human(self) -> bool:
        """Whether human involvement required."""
        human = {"manual", "approval_required"}
        return self.value in human

    @property
    def notification_channel(self) -> str:
        """Primary notification channel."""
        channels = {
            "automatic": "monitoring",
            "manual": "oncall",
            "approval_required": "management",
            "emergency": "all_channels",
            "scheduled": "calendar"
        }
        return channels.get(self.value, "monitoring")


class NotificationAudience(Enum):
    """Notification audience types."""
    USERS = "users"
    CUSTOMERS = "customers"
    INTERNAL = "internal"
    LEADERSHIP = "leadership"
    ONCALL = "oncall"
    PUBLIC = "public"

    @property
    def channel(self) -> str:
        """Communication channel."""
        channels = {
            "users": "in_app",
            "customers": "status_page",
            "internal": "slack",
            "leadership": "email",
            "oncall": "pagerduty",
            "public": "twitter"
        }
        return channels.get(self.value, "email")

    @property
    def sla_minutes(self) -> int:
        """SLA for notification in minutes."""
        slas = {
            "users": 0,
            "customers": 5,
            "internal": 0,
            "leadership": 15,
            "oncall": 0,
            "public": 30
        }
        return slas.get(self.value, 5)


class CircuitState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

    @property
    def allows_requests(self) -> bool:
        """Whether requests are allowed."""
        return self.value in ["closed", "half_open"]

    @property
    def probe_interval_seconds(self) -> int:
        """Interval for probe requests."""
        intervals = {
            "closed": 0,
            "open": 30,
            "half_open": 5
        }
        return intervals.get(self.value, 30)


class FeatureFlag(Enum):
    """Feature flag states."""
    ENABLED = "enabled"
    DISABLED = "disabled"
    DEGRADED = "degraded"
    CANARY = "canary"

    @property
    def traffic_percentage(self) -> int:
        """Traffic percentage for feature."""
        percentages = {
            "enabled": 100,
            "disabled": 0,
            "degraded": 50,
            "canary": 10
        }
        return percentages.get(self.value, 0)


# ============================================================
# DATA CLASSES WITH BUSINESS LOGIC
# ============================================================

@dataclass
class Dependency:
    """A system dependency."""
    dependency_id: str
    name: str
    type: str
    endpoint: str
    sla_target: float = 99.9
    timeout_ms: int = 5000
    retry_count: int = 3
    circuit_breaker_enabled: bool = True
    fallback_available: bool = True
    health_endpoint: str = ""
    last_check: datetime = field(default_factory=datetime.now)
    current_status: HealthStatus = HealthStatus.UNKNOWN

    def is_healthy(self) -> bool:
        """Check if dependency is healthy."""
        return self.current_status == HealthStatus.HEALTHY

    def get_effective_timeout(self, attempt: int) -> int:
        """Get timeout with exponential backoff."""
        return min(self.timeout_ms * (2 ** attempt), 30000)

    def should_retry(self, attempt: int) -> bool:
        """Check if should retry."""
        return attempt < self.retry_count


@dataclass
class HealthCheck:
    """A health check result."""
    check_id: str
    dependency_id: str
    timestamp: datetime
    status: HealthStatus
    latency_ms: int
    error_message: str = ""
    metadata: dict = field(default_factory=dict)

    def is_passing(self) -> bool:
        """Check if health check passed."""
        return self.status in [HealthStatus.HEALTHY, HealthStatus.RECOVERING]

    def exceeds_latency_threshold(self, threshold_ms: int) -> bool:
        """Check if latency exceeds threshold."""
        return self.latency_ms > threshold_ms


@dataclass
class FailureEvent:
    """A failure event."""
    event_id: str
    failure_type: FailureType
    dependency_id: str
    detected_at: datetime
    severity: str = "HIGH"
    impact_description: str = ""
    affected_features: list = field(default_factory=list)
    metrics: dict = field(default_factory=dict)
    resolved_at: Optional[datetime] = None

    def is_resolved(self) -> bool:
        """Check if failure is resolved."""
        return self.resolved_at is not None

    def get_duration_minutes(self) -> int:
        """Get failure duration in minutes."""
        end = self.resolved_at or datetime.now()
        delta = end - self.detected_at
        return int(delta.total_seconds() / 60)

    def get_estimated_recovery(self) -> datetime:
        """Get estimated recovery time."""
        minutes = self.failure_type.typical_recovery_minutes
        return self.detected_at + timedelta(minutes=minutes)


@dataclass
class FallbackConfig:
    """Fallback configuration for a service."""
    config_id: str
    service_name: str
    tiers: list
    current_tier: FallbackTier = FallbackTier.TIER_0_PRIMARY
    auto_failover: bool = True
    auto_recovery: bool = True
    health_check_interval_seconds: int = 30
    failure_threshold: int = 3
    recovery_threshold: int = 2

    def get_tier_config(self, tier: FallbackTier) -> Optional[dict]:
        """Get configuration for specific tier."""
        for t in self.tiers:
            if t.get("tier") == tier.value:
                return t
        return None

    def can_auto_failover_to(self, tier: FallbackTier) -> bool:
        """Check if auto-failover to tier is allowed."""
        if not self.auto_failover:
            return False
        return not tier.requires_approval_to_exit


@dataclass
class DegradedModeConfig:
    """Configuration for degraded mode."""
    mode: DegradationLevel
    features_enabled: list
    features_disabled: list
    quality_settings: dict = field(default_factory=dict)
    message_template: str = ""
    activated_at: Optional[datetime] = None

    def is_feature_enabled(self, feature: str) -> bool:
        """Check if feature is enabled in this mode."""
        return feature in self.features_enabled

    def get_user_message(self) -> str:
        """Get user-facing message for this mode."""
        templates = {
            "normal": "",
            "degraded_l1": "Running in backup mode, full functionality",
            "degraded_l2": "Some features temporarily limited",
            "minimal": "Service operating in minimal mode",
            "emergency": "Emergency mode - critical functions only",
            "offline": "Service temporarily unavailable"
        }
        return self.message_template or templates.get(self.mode.value, "")


@dataclass
class RecoveryPlan:
    """A recovery plan for failures."""
    plan_id: str
    failure_type: FailureType
    current_phase: RecoveryPhase
    steps: list
    started_at: datetime = field(default_factory=datetime.now)
    completed_steps: list = field(default_factory=list)
    owner: str = ""

    def get_progress(self) -> float:
        """Get recovery progress percentage."""
        if not self.steps:
            return 0.0
        return (len(self.completed_steps) / len(self.steps)) * 100

    def advance_phase(self) -> bool:
        """Advance to next recovery phase."""
        next_phase = self.current_phase.next_phase
        if next_phase:
            self.current_phase = RecoveryPhase(next_phase)
            return True
        return False

    def get_estimated_completion(self) -> datetime:
        """Estimate completion time."""
        remaining = len(self.steps) - len(self.completed_steps)
        # Assume 5 minutes per step average
        return datetime.now() + timedelta(minutes=remaining * 5)


@dataclass
class CircuitBreaker:
    """Circuit breaker implementation."""
    breaker_id: str
    dependency_id: str
    state: CircuitState = CircuitState.CLOSED
    failure_count: int = 0
    success_count: int = 0
    failure_threshold: int = 5
    success_threshold: int = 3
    timeout_seconds: int = 60
    last_failure_time: Optional[datetime] = None
    last_state_change: datetime = field(default_factory=datetime.now)

    def record_success(self):
        """Record successful request."""
        self.success_count += 1
        if self.state == CircuitState.HALF_OPEN:
            if self.success_count >= self.success_threshold:
                self._transition_to(CircuitState.CLOSED)

    def record_failure(self):
        """Record failed request."""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.state == CircuitState.CLOSED:
            if self.failure_count >= self.failure_threshold:
                self._transition_to(CircuitState.OPEN)
        elif self.state == CircuitState.HALF_OPEN:
            self._transition_to(CircuitState.OPEN)

    def should_allow_request(self) -> bool:
        """Check if request should be allowed."""
        if self.state == CircuitState.CLOSED:
            return True
        elif self.state == CircuitState.OPEN:
            if self._timeout_elapsed():
                self._transition_to(CircuitState.HALF_OPEN)
                return True
            return False
        else:  # HALF_OPEN
            return True

    def _timeout_elapsed(self) -> bool:
        """Check if timeout has elapsed."""
        if not self.last_failure_time:
            return True
        elapsed = (datetime.now() - self.last_failure_time).seconds
        return elapsed >= self.timeout_seconds

    def _transition_to(self, new_state: CircuitState):
        """Transition to new state."""
        self.state = new_state
        self.last_state_change = datetime.now()
        if new_state == CircuitState.CLOSED:
            self.failure_count = 0
        elif new_state == CircuitState.HALF_OPEN:
            self.success_count = 0


@dataclass
class Notification:
    """A notification record."""
    notification_id: str
    audience: NotificationAudience
    message: str
    severity: str
    sent_at: datetime = field(default_factory=datetime.now)
    acknowledged: bool = False
    channel_used: str = ""

    def get_sla_deadline(self) -> datetime:
        """Get SLA deadline for notification."""
        minutes = self.audience.sla_minutes
        return self.sent_at + timedelta(minutes=minutes)

    def is_within_sla(self) -> bool:
        """Check if notification was sent within SLA."""
        return self.sent_at <= self.get_sla_deadline()


@dataclass
class AuditEntry:
    """An audit trail entry."""
    entry_id: str
    action: str
    component: str
    details: dict
    timestamp: datetime = field(default_factory=datetime.now)
    user: str = "system"
    previous_state: str = ""
    new_state: str = ""

    def get_checksum(self) -> str:
        """Generate entry checksum."""
        content = f"{self.entry_id}:{self.action}:{self.timestamp.isoformat()}"
        return hashlib.sha256(content.encode()).hexdigest()[:12]


# ============================================================
# ENGINE CLASSES
# ============================================================

class FailureDetectorEngine:
    """Detects and classifies failures."""

    THRESHOLDS = {
        "latency_warning_ms": 500,
        "latency_critical_ms": 2000,
        "error_rate_warning": 0.01,
        "error_rate_critical": 0.05,
        "queue_depth_warning": 100,
        "queue_depth_critical": 500
    }

    def __init__(self):
        self.health_history: dict = {}
        self.failure_events: list = []
        self.dependencies: dict = {}

    def register_dependency(self, dependency: Dependency):
        """Register a dependency for monitoring."""
        self.dependencies[dependency.dependency_id] = dependency
        self.health_history[dependency.dependency_id] = []

    def check_health(self, dependency_id: str) -> HealthCheck:
        """Check health of a dependency."""
        dep = self.dependencies.get(dependency_id)
        if not dep:
            return HealthCheck(
                check_id=f"HC-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                dependency_id=dependency_id,
                timestamp=datetime.now(),
                status=HealthStatus.UNKNOWN,
                latency_ms=0,
                error_message="Dependency not registered"
            )

        # Simulate health check
        start_time = time.time()
        status = HealthStatus.HEALTHY
        error_msg = ""

        # Would actually call health endpoint here
        latency_ms = int((time.time() - start_time) * 1000) + 50

        if latency_ms > self.THRESHOLDS["latency_critical_ms"]:
            status = HealthStatus.UNHEALTHY
        elif latency_ms > self.THRESHOLDS["latency_warning_ms"]:
            status = HealthStatus.DEGRADED

        check = HealthCheck(
            check_id=f"HC-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            dependency_id=dependency_id,
            timestamp=datetime.now(),
            status=status,
            latency_ms=latency_ms,
            error_message=error_msg
        )

        # Update history
        self.health_history[dependency_id].append(check)
        if len(self.health_history[dependency_id]) > 100:
            self.health_history[dependency_id] = self.health_history[dependency_id][-100:]

        dep.current_status = status
        dep.last_check = datetime.now()

        return check

    def detect_failure(
        self,
        dependency_id: str,
        error_rate: float,
        latency_ms: int,
        queue_depth: int
    ) -> Optional[FailureEvent]:
        """Detect and classify failure."""
        failure_type = None
        severity = "MEDIUM"

        if latency_ms > self.THRESHOLDS["latency_critical_ms"]:
            failure_type = FailureType.HIGH_LATENCY
            severity = "HIGH"
        elif error_rate > self.THRESHOLDS["error_rate_critical"]:
            failure_type = FailureType.ERROR_SPIKE
            severity = "CRITICAL"
        elif queue_depth > self.THRESHOLDS["queue_depth_critical"]:
            failure_type = FailureType.CAPACITY_EXCEEDED
            severity = "HIGH"

        if failure_type:
            event = FailureEvent(
                event_id=f"FAIL-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                failure_type=failure_type,
                dependency_id=dependency_id,
                detected_at=datetime.now(),
                severity=severity,
                metrics={
                    "error_rate": error_rate,
                    "latency_ms": latency_ms,
                    "queue_depth": queue_depth
                }
            )
            self.failure_events.append(event)
            return event

        return None

    def get_health_summary(self) -> dict:
        """Get health summary for all dependencies."""
        summary = {
            "total": len(self.dependencies),
            "healthy": 0,
            "degraded": 0,
            "unhealthy": 0,
            "unknown": 0
        }

        for dep in self.dependencies.values():
            status = dep.current_status.value
            if status == "healthy":
                summary["healthy"] += 1
            elif status == "degraded":
                summary["degraded"] += 1
            elif status in ["unhealthy", "critical"]:
                summary["unhealthy"] += 1
            else:
                summary["unknown"] += 1

        return summary


class FallbackOrchestratorEngine:
    """Orchestrates fallback transitions."""

    def __init__(self):
        self.configs: dict = {}
        self.active_fallbacks: dict = {}
        self.transition_history: list = []

    def register_config(self, config: FallbackConfig):
        """Register fallback configuration."""
        self.configs[config.service_name] = config

    def trigger_fallback(
        self,
        service_name: str,
        failure_event: FailureEvent,
        target_tier: Optional[FallbackTier] = None
    ) -> dict:
        """Trigger fallback for a service."""
        config = self.configs.get(service_name)
        if not config:
            return {"error": "Service not configured"}

        current_tier = config.current_tier

        # Determine target tier
        if not target_tier:
            next_tier = current_tier.next_tier
            if next_tier:
                target_tier = FallbackTier(next_tier)
            else:
                return {"error": "Already at lowest tier"}

        # Check if auto-failover is allowed
        if not config.can_auto_failover_to(target_tier):
            return {
                "status": "APPROVAL_REQUIRED",
                "current_tier": current_tier.value,
                "target_tier": target_tier.value
            }

        # Execute transition
        transition = {
            "service": service_name,
            "from_tier": current_tier.value,
            "to_tier": target_tier.value,
            "timestamp": datetime.now().isoformat(),
            "trigger": failure_event.event_id if failure_event else "manual",
            "quality_change": f"{current_tier.quality_percentage}% → {target_tier.quality_percentage}%"
        }

        config.current_tier = target_tier
        self.transition_history.append(transition)
        self.active_fallbacks[service_name] = target_tier

        return {
            "status": "SUCCESS",
            "transition": transition
        }

    def restore_to_primary(self, service_name: str) -> dict:
        """Restore service to primary tier."""
        config = self.configs.get(service_name)
        if not config:
            return {"error": "Service not configured"}

        if config.current_tier == FallbackTier.TIER_0_PRIMARY:
            return {"status": "ALREADY_PRIMARY"}

        # Gradual restoration
        transition = {
            "service": service_name,
            "from_tier": config.current_tier.value,
            "to_tier": FallbackTier.TIER_0_PRIMARY.value,
            "timestamp": datetime.now().isoformat(),
            "trigger": "recovery"
        }

        config.current_tier = FallbackTier.TIER_0_PRIMARY
        self.transition_history.append(transition)

        if service_name in self.active_fallbacks:
            del self.active_fallbacks[service_name]

        return {"status": "RESTORED", "transition": transition}

    def get_fallback_chain(self, service_name: str) -> list:
        """Get fallback chain for service."""
        config = self.configs.get(service_name)
        if not config:
            return []

        return [
            {
                "tier": t.get("tier"),
                "provider": t.get("provider"),
                "quality": FallbackTier(t.get("tier")).quality_percentage
            }
            for t in config.tiers
        ]


class DegradationControllerEngine:
    """Controls service degradation."""

    DEGRADATION_RULES = {
        "normal": {
            "preserve": ["all"],
            "reduce": [],
            "disable": []
        },
        "degraded_l1": {
            "preserve": ["authentication", "core_read", "core_write"],
            "reduce": ["response_quality", "feature_richness"],
            "disable": ["analytics", "recommendations"]
        },
        "degraded_l2": {
            "preserve": ["authentication", "core_read"],
            "reduce": ["core_write"],
            "disable": ["analytics", "recommendations", "search", "notifications"]
        },
        "minimal": {
            "preserve": ["authentication"],
            "reduce": [],
            "disable": ["all_except_auth"]
        }
    }

    def __init__(self):
        self.current_mode: DegradationLevel = DegradationLevel.NORMAL
        self.feature_flags: dict = {}
        self.mode_history: list = []

    def set_degradation_level(
        self,
        level: DegradationLevel,
        reason: str
    ) -> DegradedModeConfig:
        """Set service degradation level."""
        rules = self.DEGRADATION_RULES.get(level.value, {})

        config = DegradedModeConfig(
            mode=level,
            features_enabled=rules.get("preserve", []),
            features_disabled=rules.get("disable", []),
            quality_settings={"reduce": rules.get("reduce", [])},
            activated_at=datetime.now()
        )

        self.current_mode = level
        self.mode_history.append({
            "level": level.value,
            "reason": reason,
            "timestamp": datetime.now().isoformat()
        })

        # Update feature flags
        for feature in rules.get("disable", []):
            self.feature_flags[feature] = FeatureFlag.DISABLED
        for feature in rules.get("reduce", []):
            self.feature_flags[feature] = FeatureFlag.DEGRADED

        return config

    def is_feature_available(self, feature: str) -> bool:
        """Check if feature is available in current mode."""
        flag = self.feature_flags.get(feature, FeatureFlag.ENABLED)
        return flag.traffic_percentage > 0

    def get_quality_tradeoffs(self) -> dict:
        """Get quality trade-offs for current mode."""
        return {
            "mode": self.current_mode.value,
            "feature_availability": self.current_mode.feature_availability,
            "sla_impact": self.current_mode.sla_impact,
            "user_notification": self.current_mode.user_notification_required
        }


class RecoveryValidatorEngine:
    """Validates recovery and manages restoration."""

    RECOVERY_CHECKS = [
        {"name": "health_endpoint", "threshold": 3, "method": "consecutive_passes"},
        {"name": "latency", "threshold": 500, "method": "p99_under"},
        {"name": "error_rate", "threshold": 0.01, "method": "under_threshold"},
        {"name": "throughput", "threshold": 100, "method": "rps_above"}
    ]

    RESTORATION_RAMP = [
        {"step": 1, "traffic_percent": 10, "duration_minutes": 5},
        {"step": 2, "traffic_percent": 25, "duration_minutes": 5},
        {"step": 3, "traffic_percent": 50, "duration_minutes": 10},
        {"step": 4, "traffic_percent": 100, "duration_minutes": 0}
    ]

    def __init__(self):
        self.recovery_plans: dict = {}
        self.validation_results: list = []

    def create_recovery_plan(
        self,
        failure_event: FailureEvent,
        owner: str
    ) -> RecoveryPlan:
        """Create recovery plan for failure."""
        steps = [
            "Isolate failed component",
            "Activate fallback",
            "Diagnose root cause",
            "Implement fix",
            "Validate fix in staging",
            "Gradual traffic restoration",
            "Full restoration",
            "Post-mortem documentation"
        ]

        plan = RecoveryPlan(
            plan_id=f"REC-{failure_event.event_id}",
            failure_type=failure_event.failure_type,
            current_phase=RecoveryPhase.DETECTION,
            steps=steps,
            owner=owner
        )

        self.recovery_plans[plan.plan_id] = plan
        return plan

    def run_validation_checks(
        self,
        dependency_id: str,
        metrics: dict
    ) -> dict:
        """Run recovery validation checks."""
        results = {
            "dependency_id": dependency_id,
            "timestamp": datetime.now().isoformat(),
            "checks": [],
            "all_passed": True
        }

        for check in self.RECOVERY_CHECKS:
            passed = False

            if check["name"] == "health_endpoint":
                passed = metrics.get("health_passes", 0) >= check["threshold"]
            elif check["name"] == "latency":
                passed = metrics.get("latency_p99", 9999) <= check["threshold"]
            elif check["name"] == "error_rate":
                passed = metrics.get("error_rate", 1.0) <= check["threshold"]
            elif check["name"] == "throughput":
                passed = metrics.get("rps", 0) >= check["threshold"]

            results["checks"].append({
                "name": check["name"],
                "passed": passed,
                "threshold": check["threshold"],
                "actual": metrics.get(check["name"], "N/A")
            })

            if not passed:
                results["all_passed"] = False

        self.validation_results.append(results)
        return results

    def get_restoration_plan(self) -> list:
        """Get gradual restoration plan."""
        return self.RESTORATION_RAMP

    def should_rollback(self, error_rate: float) -> bool:
        """Check if rollback should be triggered."""
        return error_rate > 0.05


class FallbackGovernanceEngine:
    """Main fallback governance orchestration engine."""

    def __init__(self):
        self.failure_detector = FailureDetectorEngine()
        self.fallback_orchestrator = FallbackOrchestratorEngine()
        self.degradation_controller = DegradationControllerEngine()
        self.recovery_validator = RecoveryValidatorEngine()
        self.circuit_breakers: dict = {}
        self.notifications: list = []
        self.audit_log: list = []

    def setup_service(
        self,
        service_name: str,
        dependencies: list,
        fallback_tiers: list
    ) -> dict:
        """Set up fallback governance for a service."""
        # Register dependencies
        for dep_config in dependencies:
            dep = Dependency(
                dependency_id=dep_config["id"],
                name=dep_config["name"],
                type=dep_config.get("type", "api"),
                endpoint=dep_config.get("endpoint", ""),
                sla_target=dep_config.get("sla", 99.9)
            )
            self.failure_detector.register_dependency(dep)

            # Create circuit breaker
            cb = CircuitBreaker(
                breaker_id=f"CB-{dep.dependency_id}",
                dependency_id=dep.dependency_id
            )
            self.circuit_breakers[dep.dependency_id] = cb

        # Register fallback config
        config = FallbackConfig(
            config_id=f"FC-{service_name}",
            service_name=service_name,
            tiers=fallback_tiers
        )
        self.fallback_orchestrator.register_config(config)

        self._log_action("SETUP", service_name, f"Configured with {len(dependencies)} dependencies")

        return {
            "service": service_name,
            "dependencies": len(dependencies),
            "fallback_tiers": len(fallback_tiers),
            "status": "CONFIGURED"
        }

    def handle_failure(
        self,
        service_name: str,
        dependency_id: str,
        metrics: dict
    ) -> dict:
        """Handle a detected failure."""
        # Detect failure
        failure = self.failure_detector.detect_failure(
            dependency_id=dependency_id,
            error_rate=metrics.get("error_rate", 0),
            latency_ms=metrics.get("latency_ms", 0),
            queue_depth=metrics.get("queue_depth", 0)
        )

        if not failure:
            return {"status": "NO_FAILURE_DETECTED"}

        # Trip circuit breaker
        cb = self.circuit_breakers.get(dependency_id)
        if cb:
            cb.record_failure()

        # Trigger fallback
        result = self.fallback_orchestrator.trigger_fallback(
            service_name=service_name,
            failure_event=failure
        )

        # Adjust degradation if needed
        if failure.severity == "CRITICAL":
            self.degradation_controller.set_degradation_level(
                DegradationLevel.DEGRADED_L2,
                f"Critical failure: {failure.failure_type.value}"
            )

        # Send notifications
        self._send_notification(
            NotificationAudience.ONCALL,
            f"Failure detected: {failure.failure_type.value} in {dependency_id}",
            "CRITICAL" if failure.severity == "CRITICAL" else "WARNING"
        )

        # Create recovery plan
        plan = self.recovery_validator.create_recovery_plan(
            failure_event=failure,
            owner="oncall_engineer"
        )

        self._log_action("FAILURE", service_name, f"Handled {failure.failure_type.value}")

        return {
            "failure_id": failure.event_id,
            "failure_type": failure.failure_type.value,
            "fallback_result": result,
            "recovery_plan_id": plan.plan_id,
            "degradation_level": self.degradation_controller.current_mode.value
        }

    def initiate_recovery(
        self,
        service_name: str,
        plan_id: str
    ) -> dict:
        """Initiate recovery process."""
        plan = self.recovery_validator.recovery_plans.get(plan_id)
        if not plan:
            return {"error": "Recovery plan not found"}

        # Run validation checks
        validation = self.recovery_validator.run_validation_checks(
            dependency_id=service_name,
            metrics={
                "health_passes": 3,
                "latency_p99": 200,
                "error_rate": 0.005,
                "rps": 150
            }
        )

        if validation["all_passed"]:
            # Restore to primary
            restore_result = self.fallback_orchestrator.restore_to_primary(service_name)

            # Reset degradation
            self.degradation_controller.set_degradation_level(
                DegradationLevel.NORMAL,
                "Recovery complete"
            )

            self._log_action("RECOVERY", service_name, "Service restored to primary")

            return {
                "status": "RECOVERED",
                "validation": validation,
                "restore_result": restore_result
            }

        return {
            "status": "VALIDATION_FAILED",
            "validation": validation,
            "recommendation": "Continue monitoring before restoration"
        }

    def get_system_status(self) -> dict:
        """Get overall system status."""
        health_summary = self.failure_detector.get_health_summary()

        return {
            "timestamp": datetime.now().isoformat(),
            "health": health_summary,
            "active_fallbacks": dict(self.fallback_orchestrator.active_fallbacks),
            "degradation_level": self.degradation_controller.current_mode.value,
            "circuit_breakers": {
                cb_id: cb.state.value
                for cb_id, cb in self.circuit_breakers.items()
            },
            "active_incidents": len([
                f for f in self.failure_detector.failure_events
                if not f.is_resolved()
            ])
        }

    def _send_notification(
        self,
        audience: NotificationAudience,
        message: str,
        severity: str
    ):
        """Send notification."""
        notification = Notification(
            notification_id=f"NOTIF-{len(self.notifications) + 1}",
            audience=audience,
            message=message,
            severity=severity,
            channel_used=audience.channel
        )
        self.notifications.append(notification)

    def _log_action(self, action: str, component: str, details: str):
        """Log action to audit trail."""
        entry = AuditEntry(
            entry_id=f"AUD-{len(self.audit_log) + 1}",
            action=action,
            component=component,
            details={"message": details}
        )
        self.audit_log.append(entry)


# ============================================================
# REPORTER CLASS
# ============================================================

class FallbackReporter:
    """Generates fallback governance reports."""

    @staticmethod
    def generate_status_report(data: dict) -> str:
        """Generate ASCII status report."""
        lines = [
            "",
            "═" * 60,
            "       FALLBACK GOVERNANCE STATUS",
            "═" * 60,
            f"  Timestamp: {data.get('timestamp', 'N/A')}",
            "═" * 60,
            "",
            "  SYSTEM HEALTH",
            "  " + "─" * 40,
            ""
        ]

        health = data.get('health', {})
        total = health.get('total', 0)
        healthy = health.get('healthy', 0)

        health_pct = (healthy / total * 100) if total > 0 else 0
        bar = FallbackReporter._bar(health_pct, 25)

        lines.append(f"  Health: {bar} {health_pct:.0f}%")
        lines.append(f"  Healthy: {healthy} | Degraded: {health.get('degraded', 0)} | Unhealthy: {health.get('unhealthy', 0)}")
        lines.append("")

        lines.append("  CURRENT STATE")
        lines.append("  " + "─" * 40)
        lines.append(f"  Degradation Level: {data.get('degradation_level', 'normal').upper()}")
        lines.append(f"  Active Incidents: {data.get('active_incidents', 0)}")
        lines.append("")

        fallbacks = data.get('active_fallbacks', {})
        if fallbacks:
            lines.append("  ACTIVE FALLBACKS")
            lines.append("  " + "─" * 40)
            for service, tier in fallbacks.items():
                tier_obj = FallbackTier(tier) if isinstance(tier, str) else tier
                quality = tier_obj.quality_percentage if hasattr(tier_obj, 'quality_percentage') else "N/A"
                lines.append(f"  • {service}: {tier} ({quality}% quality)")
        lines.append("")

        breakers = data.get('circuit_breakers', {})
        if breakers:
            lines.append("  CIRCUIT BREAKERS")
            lines.append("  " + "─" * 40)
            for cb_id, state in breakers.items():
                icon = {"closed": "✓", "open": "✗", "half_open": "◐"}.get(state, "?")
                lines.append(f"  {icon} {cb_id}: {state.upper()}")
        lines.append("")

        lines.append("═" * 60)
        return "\n".join(lines)

    @staticmethod
    def _bar(value: float, width: int = 20) -> str:
        """Generate ASCII progress bar."""
        filled = int((value / 100) * width)
        return "█" * filled + "░" * (width - filled)

    @staticmethod
    def generate_fallback_chain_report(chain: list, current_tier: str) -> str:
        """Generate fallback chain visualization."""
        lines = [
            "",
            "  FALLBACK CHAIN",
            "  " + "─" * 40,
            ""
        ]

        for i, tier in enumerate(chain):
            tier_name = tier.get("tier", f"tier_{i}")
            is_current = tier_name == current_tier
            marker = "→" if is_current else " "
            quality = tier.get("quality", "N/A")
            provider = tier.get("provider", "unknown")

            lines.append(f"  {marker} TIER {i}: {provider}")
            lines.append(f"       Quality: {quality}%")
            if i < len(chain) - 1:
                lines.append("       ↓ (on failure)")

        lines.append("")
        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="FALLBACK.GOVERNANCE.OS.EXE - Graceful Degradation Engine"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Setup command
    setup_parser = subparsers.add_parser("setup", help="Setup fallback governance")
    setup_parser.add_argument("--service", required=True, help="Service name")

    # Status command
    status_parser = subparsers.add_parser("status", help="Get system status")

    # Failover command
    failover_parser = subparsers.add_parser("failover", help="Trigger failover")
    failover_parser.add_argument("--service", required=True, help="Service name")
    failover_parser.add_argument("--tier", help="Target tier")

    # Recover command
    recover_parser = subparsers.add_parser("recover", help="Initiate recovery")
    recover_parser.add_argument("--service", required=True, help="Service name")
    recover_parser.add_argument("--plan-id", required=True, help="Recovery plan ID")

    # Simulate command
    simulate_parser = subparsers.add_parser("simulate", help="Simulate failure")
    simulate_parser.add_argument("--service", required=True, help="Service name")
    simulate_parser.add_argument("--type", required=True, help="Failure type")

    args = parser.parse_args()

    engine = FallbackGovernanceEngine()
    reporter = FallbackReporter()

    if args.command == "setup":
        result = engine.setup_service(
            service_name=args.service,
            dependencies=[
                {"id": "primary-llm", "name": "Primary LLM", "type": "api"},
                {"id": "database", "name": "Database", "type": "database"}
            ],
            fallback_tiers=[
                {"tier": "tier_0_primary", "provider": "primary"},
                {"tier": "tier_1_secondary", "provider": "secondary"},
                {"tier": "tier_2_cache", "provider": "cache"}
            ]
        )
        print(f"\nSetup complete: {result}")

    elif args.command == "status":
        status = engine.get_system_status()
        print(reporter.generate_status_report(status))

    elif args.command == "failover":
        target = FallbackTier(args.tier) if args.tier else None
        result = engine.fallback_orchestrator.trigger_fallback(
            service_name=args.service,
            failure_event=None,
            target_tier=target
        )
        print(f"\nFailover result: {result}")

    elif args.command == "recover":
        result = engine.initiate_recovery(
            service_name=args.service,
            plan_id=args.plan_id
        )
        print(f"\nRecovery result: {result}")

    elif args.command == "simulate":
        result = engine.handle_failure(
            service_name=args.service,
            dependency_id="primary-llm",
            metrics={"error_rate": 0.1, "latency_ms": 3000, "queue_depth": 600}
        )
        print(f"\nSimulation result: {result}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW

### Phase 1: DETECT
1. Monitor health signals
2. Detect anomalies
3. Classify failure type
4. Assess blast radius
5. Trigger fallback

### Phase 2: RESPOND
1. Activate fallback
2. Route to alternatives
3. Notify stakeholders
4. Log incident
5. Update status

### Phase 3: DEGRADE
1. Reduce functionality
2. Preserve core features
3. Communicate changes
4. Maintain data integrity
5. Protect user experience

### Phase 4: RECOVER
1. Monitor recovery
2. Validate health
3. Gradual restoration
4. Verify completeness
5. Document learnings

---

## QUICK COMMANDS

- `/fallback-governance` - Full fallback framework
- `/fallback-governance [system]` - System-specific design
- `/fallback-governance scenarios` - Failure scenarios
- `/fallback-governance hierarchy` - Fallback chain
- `/fallback-governance recovery` - Recovery validation

$ARGUMENTS
