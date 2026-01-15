# CONTROL.TOWER.OS.EXE - System-of-Systems Oversight Controller

You are CONTROL.TOWER.OS.EXE — a system-of-systems oversight controller for multi-agent AI environments.

MISSION
Maintain global visibility and coordination across multiple AI systems and agents. No local optimization that harms global performance. Clarity over completeness.

---

## CAPABILITIES

### SystemMapper.MOD
- Inventory management
- Capability cataloging
- State tracking
- Version monitoring
- Configuration drift

### DependencyAnalyzer.MOD
- Relationship mapping
- Critical path analysis
- Failure propagation
- Coupling assessment
- Integration points

### HealthMonitor.MOD
- Signal aggregation
- Anomaly detection
- Threshold management
- Trend analysis
- Alert correlation

### ArbitrationEngine.MOD
- Priority resolution
- Resource allocation
- Conflict mediation
- Escalation routing
- Decision logging

---

## PRODUCTION IMPLEMENTATION

```python
"""
CONTROL.TOWER.OS.EXE - System-of-Systems Oversight Controller
Production-ready multi-system coordination and monitoring engine.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from datetime import datetime, timedelta
import hashlib


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class SystemType(Enum):
    """Types of systems managed by control tower."""
    AGENT = "agent"
    SERVICE = "service"
    PIPELINE = "pipeline"
    INTEGRATION = "integration"
    ORCHESTRATOR = "orchestrator"
    DATABASE = "database"
    CACHE = "cache"
    QUEUE = "queue"

    @property
    def primary_signals(self) -> list:
        return {
            SystemType.AGENT: ["task_completion", "error_rate", "queue_depth"],
            SystemType.SERVICE: ["latency", "availability", "throughput"],
            SystemType.PIPELINE: ["throughput", "lag", "failures"],
            SystemType.INTEGRATION: ["status", "errors", "latency"],
            SystemType.ORCHESTRATOR: ["queue_depth", "decisions", "conflicts"],
            SystemType.DATABASE: ["connections", "query_time", "disk_usage"],
            SystemType.CACHE: ["hit_rate", "memory", "evictions"],
            SystemType.QUEUE: ["depth", "throughput", "age"]
        }[self]

    @property
    def default_health_weight(self) -> float:
        return {
            SystemType.AGENT: 0.8,
            SystemType.SERVICE: 1.0,
            SystemType.PIPELINE: 0.9,
            SystemType.INTEGRATION: 0.7,
            SystemType.ORCHESTRATOR: 1.0,
            SystemType.DATABASE: 1.0,
            SystemType.CACHE: 0.6,
            SystemType.QUEUE: 0.8
        }[self]


class SystemStatus(Enum):
    """Current operational status of a system."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    UNKNOWN = "unknown"

    @property
    def health_score(self) -> int:
        return {
            SystemStatus.HEALTHY: 100,
            SystemStatus.DEGRADED: 60,
            SystemStatus.UNHEALTHY: 20,
            SystemStatus.OFFLINE: 0,
            SystemStatus.MAINTENANCE: 50,
            SystemStatus.UNKNOWN: 0
        }[self]

    @property
    def icon(self) -> str:
        return {
            SystemStatus.HEALTHY: "[OK]",
            SystemStatus.DEGRADED: "[!!]",
            SystemStatus.UNHEALTHY: "[XX]",
            SystemStatus.OFFLINE: "[--]",
            SystemStatus.MAINTENANCE: "[MT]",
            SystemStatus.UNKNOWN: "[??]"
        }[self]

    @property
    def color(self) -> str:
        return {
            SystemStatus.HEALTHY: "green",
            SystemStatus.DEGRADED: "yellow",
            SystemStatus.UNHEALTHY: "red",
            SystemStatus.OFFLINE: "gray",
            SystemStatus.MAINTENANCE: "blue",
            SystemStatus.UNKNOWN: "gray"
        }[self]


class CriticalityLevel(Enum):
    """System criticality classification."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

    @property
    def response_sla_minutes(self) -> int:
        return {
            CriticalityLevel.CRITICAL: 5,
            CriticalityLevel.HIGH: 15,
            CriticalityLevel.MEDIUM: 60,
            CriticalityLevel.LOW: 240
        }[self]

    @property
    def requires_redundancy(self) -> bool:
        return self in [CriticalityLevel.CRITICAL, CriticalityLevel.HIGH]

    @property
    def monitoring_interval_seconds(self) -> int:
        return {
            CriticalityLevel.CRITICAL: 10,
            CriticalityLevel.HIGH: 30,
            CriticalityLevel.MEDIUM: 60,
            CriticalityLevel.LOW: 300
        }[self]


class DependencyType(Enum):
    """Types of system dependencies."""
    HARD = "hard"
    SOFT = "soft"
    OPTIONAL = "optional"
    DATA = "data"
    AUTH = "auth"

    @property
    def failure_impact(self) -> float:
        return {
            DependencyType.HARD: 1.0,
            DependencyType.SOFT: 0.5,
            DependencyType.OPTIONAL: 0.1,
            DependencyType.DATA: 0.8,
            DependencyType.AUTH: 1.0
        }[self]

    @property
    def propagates_failure(self) -> bool:
        return self in [DependencyType.HARD, DependencyType.AUTH]


class AlertPriority(Enum):
    """Alert priority levels with escalation rules."""
    P1_CRITICAL = "p1_critical"
    P2_HIGH = "p2_high"
    P3_MEDIUM = "p3_medium"
    P4_LOW = "p4_low"
    P5_INFO = "p5_info"

    @property
    def response_minutes(self) -> int:
        return {
            AlertPriority.P1_CRITICAL: 5,
            AlertPriority.P2_HIGH: 15,
            AlertPriority.P3_MEDIUM: 60,
            AlertPriority.P4_LOW: 240,
            AlertPriority.P5_INFO: 0
        }[self]

    @property
    def notification_channels(self) -> list:
        return {
            AlertPriority.P1_CRITICAL: ["pagerduty", "slack", "sms", "email"],
            AlertPriority.P2_HIGH: ["slack", "email"],
            AlertPriority.P3_MEDIUM: ["slack"],
            AlertPriority.P4_LOW: ["email"],
            AlertPriority.P5_INFO: ["dashboard"]
        }[self]

    @property
    def auto_escalate_minutes(self) -> int:
        return {
            AlertPriority.P1_CRITICAL: 15,
            AlertPriority.P2_HIGH: 30,
            AlertPriority.P3_MEDIUM: 120,
            AlertPriority.P4_LOW: 0,
            AlertPriority.P5_INFO: 0
        }[self]


class EscalationLevel(Enum):
    """Escalation hierarchy levels."""
    AUTOMATED = "automated"
    ON_CALL = "on_call"
    TEAM_LEAD = "team_lead"
    MANAGER = "manager"
    EXECUTIVE = "executive"

    @property
    def response_window_minutes(self) -> int:
        return {
            EscalationLevel.AUTOMATED: 5,
            EscalationLevel.ON_CALL: 15,
            EscalationLevel.TEAM_LEAD: 30,
            EscalationLevel.MANAGER: 60,
            EscalationLevel.EXECUTIVE: 120
        }[self]

    @property
    def next_level(self) -> 'EscalationLevel':
        order = [
            EscalationLevel.AUTOMATED,
            EscalationLevel.ON_CALL,
            EscalationLevel.TEAM_LEAD,
            EscalationLevel.MANAGER,
            EscalationLevel.EXECUTIVE
        ]
        idx = order.index(self)
        return order[min(idx + 1, len(order) - 1)]


class ResourceType(Enum):
    """Types of resources managed."""
    COMPUTE = "compute"
    MEMORY = "memory"
    STORAGE = "storage"
    NETWORK = "network"
    API_QUOTA = "api_quota"
    TOKENS = "tokens"

    @property
    def unit(self) -> str:
        return {
            ResourceType.COMPUTE: "vCPU",
            ResourceType.MEMORY: "GB",
            ResourceType.STORAGE: "GB",
            ResourceType.NETWORK: "Mbps",
            ResourceType.API_QUOTA: "calls/min",
            ResourceType.TOKENS: "tokens/day"
        }[self]

    @property
    def cost_per_unit_hour(self) -> float:
        return {
            ResourceType.COMPUTE: 0.05,
            ResourceType.MEMORY: 0.01,
            ResourceType.STORAGE: 0.001,
            ResourceType.NETWORK: 0.005,
            ResourceType.API_QUOTA: 0.0001,
            ResourceType.TOKENS: 0.00001
        }[self]


class IntegrationProtocol(Enum):
    """Integration communication protocols."""
    REST = "rest"
    GRPC = "grpc"
    GRAPHQL = "graphql"
    WEBSOCKET = "websocket"
    MESSAGE_QUEUE = "message_queue"
    EVENT_STREAM = "event_stream"

    @property
    def default_timeout_ms(self) -> int:
        return {
            IntegrationProtocol.REST: 30000,
            IntegrationProtocol.GRPC: 10000,
            IntegrationProtocol.GRAPHQL: 30000,
            IntegrationProtocol.WEBSOCKET: 60000,
            IntegrationProtocol.MESSAGE_QUEUE: 0,
            IntegrationProtocol.EVENT_STREAM: 0
        }[self]

    @property
    def supports_retry(self) -> bool:
        return self in [
            IntegrationProtocol.REST,
            IntegrationProtocol.GRPC,
            IntegrationProtocol.GRAPHQL
        ]


class ArbitrationOutcome(Enum):
    """Outcomes of arbitration decisions."""
    APPROVED = "approved"
    DENIED = "denied"
    QUEUED = "queued"
    ESCALATED = "escalated"
    DEFERRED = "deferred"

    @property
    def requires_logging(self) -> bool:
        return True

    @property
    def final(self) -> bool:
        return self in [ArbitrationOutcome.APPROVED, ArbitrationOutcome.DENIED]


# ============================================================
# DATACLASSES WITH BUSINESS LOGIC
# ============================================================

@dataclass
class System:
    """Managed system in the control tower."""
    system_id: str
    name: str
    system_type: SystemType
    status: SystemStatus = SystemStatus.UNKNOWN
    criticality: CriticalityLevel = CriticalityLevel.MEDIUM
    version: str = "1.0.0"
    owner: str = ""
    description: str = ""
    health_score: int = 0
    last_check: Optional[datetime] = None
    metadata: dict = field(default_factory=dict)

    @property
    def is_healthy(self) -> bool:
        return self.status == SystemStatus.HEALTHY

    @property
    def needs_attention(self) -> bool:
        return self.status in [SystemStatus.DEGRADED, SystemStatus.UNHEALTHY, SystemStatus.UNKNOWN]

    @property
    def weighted_health(self) -> float:
        return self.health_score * self.system_type.default_health_weight

    def update_status(self, new_status: SystemStatus) -> None:
        self.status = new_status
        self.health_score = new_status.health_score
        self.last_check = datetime.now()


@dataclass
class Dependency:
    """Dependency relationship between systems."""
    dependency_id: str
    source_system_id: str
    target_system_id: str
    dependency_type: DependencyType
    protocol: IntegrationProtocol = IntegrationProtocol.REST
    description: str = ""

    @property
    def failure_impact(self) -> float:
        return self.dependency_type.failure_impact

    @property
    def is_critical(self) -> bool:
        return self.dependency_type.propagates_failure


@dataclass
class HealthCheck:
    """Health check result for a system."""
    check_id: str
    system_id: str
    timestamp: datetime
    status: SystemStatus
    latency_ms: int = 0
    signals: dict = field(default_factory=dict)
    message: str = ""

    @property
    def is_passing(self) -> bool:
        return self.status == SystemStatus.HEALTHY

    @property
    def is_degraded(self) -> bool:
        return self.status == SystemStatus.DEGRADED


@dataclass
class Alert:
    """Active alert in the system."""
    alert_id: str
    system_id: str
    priority: AlertPriority
    message: str
    triggered_at: datetime
    current_level: EscalationLevel = EscalationLevel.AUTOMATED
    acknowledged: bool = False
    resolved: bool = False
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[datetime] = None

    @property
    def age_minutes(self) -> int:
        delta = datetime.now() - self.triggered_at
        return int(delta.total_seconds() / 60)

    @property
    def within_sla(self) -> bool:
        return self.age_minutes <= self.priority.response_minutes

    @property
    def needs_escalation(self) -> bool:
        if self.resolved or self.acknowledged:
            return False
        return self.age_minutes >= self.current_level.response_window_minutes

    def escalate(self) -> None:
        self.current_level = self.current_level.next_level


@dataclass
class Resource:
    """Resource allocation tracking."""
    resource_id: str
    resource_type: ResourceType
    total_capacity: float
    allocated: float = 0.0
    system_allocations: dict = field(default_factory=dict)

    @property
    def available(self) -> float:
        return self.total_capacity - self.allocated

    @property
    def utilization_percent(self) -> float:
        if self.total_capacity <= 0:
            return 0.0
        return (self.allocated / self.total_capacity) * 100

    @property
    def cost_per_hour(self) -> float:
        return self.allocated * self.resource_type.cost_per_unit_hour

    def allocate(self, system_id: str, amount: float) -> bool:
        if amount > self.available:
            return False
        self.system_allocations[system_id] = self.system_allocations.get(system_id, 0) + amount
        self.allocated += amount
        return True

    def deallocate(self, system_id: str, amount: float = None) -> None:
        if system_id not in self.system_allocations:
            return
        if amount is None:
            amount = self.system_allocations[system_id]
        actual = min(amount, self.system_allocations[system_id])
        self.system_allocations[system_id] -= actual
        self.allocated -= actual


@dataclass
class EscalationPath:
    """Escalation path definition."""
    path_id: str
    name: str
    levels: list = field(default_factory=list)
    default_contacts: dict = field(default_factory=dict)

    def get_contact_for_level(self, level: EscalationLevel) -> str:
        return self.default_contacts.get(level.value, "")


@dataclass
class Integration:
    """External integration point."""
    integration_id: str
    name: str
    systems: list = field(default_factory=list)
    protocol: IntegrationProtocol = IntegrationProtocol.REST
    status: SystemStatus = SystemStatus.UNKNOWN
    last_successful: Optional[datetime] = None
    error_count: int = 0

    @property
    def is_healthy(self) -> bool:
        return self.status == SystemStatus.HEALTHY

    @property
    def error_rate(self) -> float:
        # Simplified - would need more context in production
        return min(self.error_count / 100, 1.0)


@dataclass
class ArbitrationDecision:
    """Record of an arbitration decision."""
    decision_id: str
    request_type: str
    requesting_system: str
    outcome: ArbitrationOutcome
    timestamp: datetime
    reason: str = ""
    resources_affected: list = field(default_factory=list)

    @property
    def is_final(self) -> bool:
        return self.outcome.final


# ============================================================
# ENGINE CLASSES
# ============================================================

class InventoryEngine:
    """System inventory management engine."""

    def __init__(self):
        self.systems: dict = {}
        self.tags: dict = {}

    def register_system(
        self,
        name: str,
        system_type: SystemType,
        criticality: CriticalityLevel = CriticalityLevel.MEDIUM,
        owner: str = "",
        version: str = "1.0.0"
    ) -> System:
        """Register a new system."""
        system_id = hashlib.sha256(
            f"{name}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        system = System(
            system_id=system_id,
            name=name,
            system_type=system_type,
            criticality=criticality,
            owner=owner,
            version=version
        )

        self.systems[system_id] = system
        return system

    def update_system(self, system_id: str, **kwargs) -> bool:
        """Update system attributes."""
        if system_id not in self.systems:
            return False

        system = self.systems[system_id]
        for key, value in kwargs.items():
            if hasattr(system, key):
                setattr(system, key, value)

        return True

    def get_system(self, system_id: str) -> System:
        """Get system by ID."""
        return self.systems.get(system_id)

    def get_systems_by_type(self, system_type: SystemType) -> list:
        """Get all systems of a specific type."""
        return [s for s in self.systems.values() if s.system_type == system_type]

    def get_systems_by_criticality(self, criticality: CriticalityLevel) -> list:
        """Get all systems of a specific criticality."""
        return [s for s in self.systems.values() if s.criticality == criticality]

    def get_unhealthy_systems(self) -> list:
        """Get all systems that need attention."""
        return [s for s in self.systems.values() if s.needs_attention]

    def tag_system(self, system_id: str, tag: str) -> None:
        """Add tag to a system."""
        self.tags.setdefault(tag, set()).add(system_id)

    def get_systems_by_tag(self, tag: str) -> list:
        """Get systems by tag."""
        system_ids = self.tags.get(tag, set())
        return [self.systems[sid] for sid in system_ids if sid in self.systems]


class DependencyEngine:
    """Dependency analysis and management engine."""

    def __init__(self, inventory: InventoryEngine):
        self.inventory = inventory
        self.dependencies: dict = {}

    def add_dependency(
        self,
        source_id: str,
        target_id: str,
        dependency_type: DependencyType,
        protocol: IntegrationProtocol = IntegrationProtocol.REST
    ) -> Dependency:
        """Add a dependency between systems."""
        dep_id = hashlib.sha256(
            f"{source_id}-{target_id}".encode()
        ).hexdigest()[:12]

        dependency = Dependency(
            dependency_id=dep_id,
            source_system_id=source_id,
            target_system_id=target_id,
            dependency_type=dependency_type,
            protocol=protocol
        )

        self.dependencies[dep_id] = dependency
        return dependency

    def get_dependencies(self, system_id: str) -> list:
        """Get all dependencies for a system (outgoing)."""
        return [d for d in self.dependencies.values() if d.source_system_id == system_id]

    def get_dependents(self, system_id: str) -> list:
        """Get all systems that depend on this system (incoming)."""
        return [d for d in self.dependencies.values() if d.target_system_id == system_id]

    def get_critical_dependencies(self, system_id: str) -> list:
        """Get critical (hard/auth) dependencies."""
        return [d for d in self.get_dependencies(system_id) if d.is_critical]

    def analyze_failure_impact(self, system_id: str) -> dict:
        """Analyze impact of system failure."""
        affected_systems = set()
        impact_score = 0.0

        # Get all dependents
        dependents = self.get_dependents(system_id)
        for dep in dependents:
            source_system = self.inventory.get_system(dep.source_system_id)
            if source_system:
                affected_systems.add(dep.source_system_id)
                impact_score += dep.failure_impact * source_system.criticality.response_sla_minutes

        return {
            "affected_systems": list(affected_systems),
            "direct_dependents": len(dependents),
            "impact_score": impact_score,
            "critical_path": self._find_critical_path(system_id)
        }

    def _find_critical_path(self, system_id: str, visited: set = None) -> list:
        """Find critical dependency path."""
        if visited is None:
            visited = set()

        if system_id in visited:
            return []

        visited.add(system_id)
        path = [system_id]

        # Follow hard dependencies
        for dep in self.get_dependencies(system_id):
            if dep.dependency_type == DependencyType.HARD:
                sub_path = self._find_critical_path(dep.target_system_id, visited)
                if sub_path:
                    path.extend(sub_path)
                    break

        return path

    def detect_single_points_of_failure(self) -> list:
        """Identify single points of failure."""
        spofs = []

        for system_id, system in self.inventory.systems.items():
            dependents = self.get_dependents(system_id)
            critical_dependents = [d for d in dependents if d.is_critical]

            if len(critical_dependents) >= 2:
                spofs.append({
                    "system_id": system_id,
                    "system_name": system.name,
                    "critical_dependents": len(critical_dependents),
                    "total_dependents": len(dependents)
                })

        return sorted(spofs, key=lambda x: x["critical_dependents"], reverse=True)


class HealthEngine:
    """System health monitoring engine."""

    def __init__(self, inventory: InventoryEngine):
        self.inventory = inventory
        self.checks: list = []
        self.thresholds: dict = {}

    def set_threshold(self, system_id: str, signal: str, warning: float, critical: float) -> None:
        """Set health threshold for a signal."""
        key = f"{system_id}:{signal}"
        self.thresholds[key] = {"warning": warning, "critical": critical}

    def record_check(
        self,
        system_id: str,
        status: SystemStatus,
        latency_ms: int = 0,
        signals: dict = None,
        message: str = ""
    ) -> HealthCheck:
        """Record a health check result."""
        check_id = hashlib.sha256(
            f"{system_id}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        check = HealthCheck(
            check_id=check_id,
            system_id=system_id,
            timestamp=datetime.now(),
            status=status,
            latency_ms=latency_ms,
            signals=signals or {},
            message=message
        )

        self.checks.append(check)

        # Update system status
        system = self.inventory.get_system(system_id)
        if system:
            system.update_status(status)

        return check

    def evaluate_signals(self, system_id: str, signals: dict) -> SystemStatus:
        """Evaluate signals against thresholds."""
        status = SystemStatus.HEALTHY

        for signal, value in signals.items():
            key = f"{system_id}:{signal}"
            if key not in self.thresholds:
                continue

            threshold = self.thresholds[key]
            if value >= threshold["critical"]:
                return SystemStatus.UNHEALTHY
            elif value >= threshold["warning"]:
                status = SystemStatus.DEGRADED

        return status

    def get_health_history(
        self,
        system_id: str,
        hours: int = 24
    ) -> list:
        """Get health check history."""
        cutoff = datetime.now() - timedelta(hours=hours)
        return [
            c for c in self.checks
            if c.system_id == system_id and c.timestamp >= cutoff
        ]

    def calculate_global_health(self) -> dict:
        """Calculate global system health score."""
        if not self.inventory.systems:
            return {"score": 0, "healthy": 0, "degraded": 0, "unhealthy": 0}

        total_weight = 0.0
        weighted_score = 0.0
        counts = {"healthy": 0, "degraded": 0, "unhealthy": 0, "unknown": 0}

        for system in self.inventory.systems.values():
            weight = system.system_type.default_health_weight
            total_weight += weight
            weighted_score += system.health_score * weight

            if system.status == SystemStatus.HEALTHY:
                counts["healthy"] += 1
            elif system.status == SystemStatus.DEGRADED:
                counts["degraded"] += 1
            elif system.status in [SystemStatus.UNHEALTHY, SystemStatus.OFFLINE]:
                counts["unhealthy"] += 1
            else:
                counts["unknown"] += 1

        score = weighted_score / total_weight if total_weight > 0 else 0

        return {
            "score": round(score, 1),
            **counts,
            "total": len(self.inventory.systems)
        }


class ArbitrationEngine:
    """Priority resolution and resource arbitration engine."""

    def __init__(self, inventory: InventoryEngine):
        self.inventory = inventory
        self.decisions: list = []
        self.resources: dict = {}
        self.alerts: dict = {}

    def register_resource(
        self,
        name: str,
        resource_type: ResourceType,
        capacity: float
    ) -> Resource:
        """Register a managed resource."""
        resource_id = hashlib.sha256(
            f"{name}-{resource_type.value}".encode()
        ).hexdigest()[:12]

        resource = Resource(
            resource_id=resource_id,
            resource_type=resource_type,
            total_capacity=capacity
        )

        self.resources[resource_id] = resource
        return resource

    def request_resources(
        self,
        system_id: str,
        resource_id: str,
        amount: float,
        priority: AlertPriority = AlertPriority.P3_MEDIUM
    ) -> ArbitrationDecision:
        """Request resource allocation."""
        resource = self.resources.get(resource_id)
        system = self.inventory.get_system(system_id)

        if not resource or not system:
            return self._record_decision(
                system_id, "resource_request",
                ArbitrationOutcome.DENIED,
                "Resource or system not found"
            )

        # Check availability
        if amount <= resource.available:
            resource.allocate(system_id, amount)
            return self._record_decision(
                system_id, "resource_request",
                ArbitrationOutcome.APPROVED,
                f"Allocated {amount} {resource.resource_type.unit}",
                [resource_id]
            )

        # Check if we can preempt lower priority allocations
        if priority in [AlertPriority.P1_CRITICAL, AlertPriority.P2_HIGH]:
            # Try to preempt
            preempted = self._try_preempt(resource, amount, system.criticality)
            if preempted:
                resource.allocate(system_id, amount)
                return self._record_decision(
                    system_id, "resource_request",
                    ArbitrationOutcome.APPROVED,
                    f"Allocated with preemption",
                    [resource_id]
                )

        return self._record_decision(
            system_id, "resource_request",
            ArbitrationOutcome.QUEUED,
            f"Insufficient resources, queued"
        )

    def _try_preempt(
        self,
        resource: Resource,
        needed: float,
        requesting_criticality: CriticalityLevel
    ) -> bool:
        """Try to preempt lower priority allocations."""
        # Find lower priority allocations
        for system_id, allocated in list(resource.system_allocations.items()):
            system = self.inventory.get_system(system_id)
            if not system:
                continue

            # Only preempt lower criticality
            if system.criticality.response_sla_minutes > requesting_criticality.response_sla_minutes:
                if allocated >= needed:
                    resource.deallocate(system_id, needed)
                    return True

        return False

    def _record_decision(
        self,
        system_id: str,
        request_type: str,
        outcome: ArbitrationOutcome,
        reason: str,
        resources: list = None
    ) -> ArbitrationDecision:
        """Record an arbitration decision."""
        decision_id = hashlib.sha256(
            f"{system_id}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        decision = ArbitrationDecision(
            decision_id=decision_id,
            request_type=request_type,
            requesting_system=system_id,
            outcome=outcome,
            timestamp=datetime.now(),
            reason=reason,
            resources_affected=resources or []
        )

        self.decisions.append(decision)
        return decision

    def create_alert(
        self,
        system_id: str,
        priority: AlertPriority,
        message: str
    ) -> Alert:
        """Create a new alert."""
        alert_id = hashlib.sha256(
            f"{system_id}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        alert = Alert(
            alert_id=alert_id,
            system_id=system_id,
            priority=priority,
            message=message,
            triggered_at=datetime.now()
        )

        self.alerts[alert_id] = alert
        return alert

    def process_escalations(self) -> list:
        """Process alerts needing escalation."""
        escalated = []

        for alert in self.alerts.values():
            if alert.needs_escalation:
                alert.escalate()
                escalated.append(alert)

        return escalated

    def get_active_alerts(self) -> list:
        """Get all active (unresolved) alerts."""
        return [a for a in self.alerts.values() if not a.resolved]


class ControlTowerEngine:
    """Main orchestrator for control tower operations."""

    def __init__(self):
        self.inventory = InventoryEngine()
        self.dependencies = DependencyEngine(self.inventory)
        self.health = HealthEngine(self.inventory)
        self.arbitration = ArbitrationEngine(self.inventory)

    def get_global_status(self) -> dict:
        """Get global control tower status."""
        health = self.health.calculate_global_health()
        spofs = self.dependencies.detect_single_points_of_failure()
        alerts = self.arbitration.get_active_alerts()

        # Determine overall status
        if health["unhealthy"] > 0 or any(a.priority == AlertPriority.P1_CRITICAL for a in alerts):
            overall = SystemStatus.UNHEALTHY
        elif health["degraded"] > 0 or any(a.priority == AlertPriority.P2_HIGH for a in alerts):
            overall = SystemStatus.DEGRADED
        elif health["unknown"] > len(self.inventory.systems) * 0.2:
            overall = SystemStatus.UNKNOWN
        else:
            overall = SystemStatus.HEALTHY

        return {
            "status": overall,
            "health_score": health["score"],
            "systems": {
                "total": health["total"],
                "healthy": health["healthy"],
                "degraded": health["degraded"],
                "unhealthy": health["unhealthy"]
            },
            "active_alerts": len(alerts),
            "critical_alerts": len([a for a in alerts if a.priority == AlertPriority.P1_CRITICAL]),
            "single_points_of_failure": len(spofs)
        }

    def get_system_summary(self, system_id: str) -> dict:
        """Get comprehensive summary for a system."""
        system = self.inventory.get_system(system_id)
        if not system:
            return None

        dependencies = self.dependencies.get_dependencies(system_id)
        dependents = self.dependencies.get_dependents(system_id)
        health_history = self.health.get_health_history(system_id, 24)

        # Calculate uptime
        healthy_checks = len([h for h in health_history if h.is_passing])
        uptime = (healthy_checks / len(health_history) * 100) if health_history else 0

        return {
            "system": system,
            "dependencies": len(dependencies),
            "dependents": len(dependents),
            "health_checks_24h": len(health_history),
            "uptime_24h": round(uptime, 1),
            "impact_analysis": self.dependencies.analyze_failure_impact(system_id)
        }


# ============================================================
# REPORTER
# ============================================================

class ControlTowerReporter:
    """ASCII report generator for control tower."""

    def __init__(self, engine: ControlTowerEngine):
        self.engine = engine

    def generate_status_dashboard(self) -> str:
        """Generate global status dashboard."""
        status = self.engine.get_global_status()

        lines = [
            "CONTROL TOWER DASHBOARD",
            "=" * 50,
            "",
            f"Overall Status: {status['status'].icon} {status['status'].value.upper()}",
            f"Health Score: {status['health_score']}/100",
            "",
            "SYSTEM INVENTORY",
            "-" * 30,
        ]

        # System counts with bars
        total = status["systems"]["total"]
        if total > 0:
            for stat, label in [("healthy", "Healthy"), ("degraded", "Degraded"), ("unhealthy", "Unhealthy")]:
                count = status["systems"][stat]
                pct = count / total
                bar_len = int(pct * 20)
                bar = "#" * bar_len + "." * (20 - bar_len)
                lines.append(f"  {label:12} [{bar}] {count}/{total}")

        lines.extend([
            "",
            "ALERTS",
            "-" * 30,
            f"  Active:   {status['active_alerts']}",
            f"  Critical: {status['critical_alerts']}",
            "",
            "RISK FACTORS",
            "-" * 30,
            f"  Single Points of Failure: {status['single_points_of_failure']}"
        ])

        return "\n".join(lines)

    def generate_dependency_map(self) -> str:
        """Generate dependency visualization."""
        lines = [
            "DEPENDENCY MAP",
            "=" * 50,
            ""
        ]

        spofs = self.engine.dependencies.detect_single_points_of_failure()

        if spofs:
            lines.append("SINGLE POINTS OF FAILURE (SPOFs)")
            lines.append("-" * 30)
            for spof in spofs[:5]:
                lines.append(f"  [!] {spof['system_name']} - {spof['critical_dependents']} critical deps")
            lines.append("")

        # Show dependencies by system type
        for system_type in SystemType:
            systems = self.engine.inventory.get_systems_by_type(system_type)
            if systems:
                lines.append(f"{system_type.value.upper()} ({len(systems)})")
                for system in systems[:3]:
                    deps = self.engine.dependencies.get_dependencies(system.system_id)
                    lines.append(f"  {system.status.icon} {system.name} -> {len(deps)} deps")
                if len(systems) > 3:
                    lines.append(f"  ... and {len(systems) - 3} more")
                lines.append("")

        return "\n".join(lines)

    def generate_alert_report(self) -> str:
        """Generate alert summary report."""
        alerts = self.engine.arbitration.get_active_alerts()

        lines = [
            "ACTIVE ALERTS",
            "=" * 50,
            f"Total Active: {len(alerts)}",
            ""
        ]

        by_priority = {}
        for alert in alerts:
            by_priority.setdefault(alert.priority.value, []).append(alert)

        for priority in ["p1_critical", "p2_high", "p3_medium", "p4_low"]:
            priority_alerts = by_priority.get(priority, [])
            if priority_alerts:
                lines.append(f"{priority.upper()} ({len(priority_alerts)})")
                lines.append("-" * 30)
                for alert in priority_alerts:
                    sla = "[SLA OK]" if alert.within_sla else "[BREACH]"
                    lines.append(f"  {sla} {alert.message[:40]}")
                lines.append("")

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="CONTROL.TOWER.OS.EXE - System-of-Systems Oversight"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Status command
    status_parser = subparsers.add_parser("status", help="Show global status")

    # Systems command
    systems_parser = subparsers.add_parser("systems", help="List systems")
    systems_parser.add_argument("--type", help="Filter by system type")
    systems_parser.add_argument("--unhealthy", action="store_true", help="Show only unhealthy")

    # Dependencies command
    deps_parser = subparsers.add_parser("dependencies", help="Show dependency map")
    deps_parser.add_argument("--system", help="Show deps for specific system")

    # Alerts command
    alerts_parser = subparsers.add_parser("alerts", help="Show active alerts")

    # SPOF command
    spof_parser = subparsers.add_parser("spof", help="Find single points of failure")

    args = parser.parse_args()

    # Initialize engine
    engine = ControlTowerEngine()
    reporter = ControlTowerReporter(engine)

    if args.command == "status":
        print(reporter.generate_status_dashboard())

    elif args.command == "systems":
        if args.unhealthy:
            systems = engine.inventory.get_unhealthy_systems()
        elif args.type:
            try:
                sys_type = SystemType(args.type)
                systems = engine.inventory.get_systems_by_type(sys_type)
            except ValueError:
                print(f"Invalid system type: {args.type}")
                return
        else:
            systems = list(engine.inventory.systems.values())

        print("REGISTERED SYSTEMS")
        print("=" * 40)
        for s in systems:
            print(f"{s.status.icon} {s.name} ({s.system_type.value}) - {s.criticality.value}")

    elif args.command == "dependencies":
        print(reporter.generate_dependency_map())

    elif args.command == "alerts":
        print(reporter.generate_alert_report())

    elif args.command == "spof":
        spofs = engine.dependencies.detect_single_points_of_failure()
        print("SINGLE POINTS OF FAILURE")
        print("=" * 40)
        for spof in spofs:
            print(f"  [!] {spof['system_name']}: {spof['critical_dependents']} critical dependents")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/control-tower` - Full control tower framework
- `/control-tower status` - Global status dashboard
- `/control-tower systems` - System inventory
- `/control-tower dependencies` - Dependency mapping
- `/control-tower alerts` - Active alerts

$ARGUMENTS
