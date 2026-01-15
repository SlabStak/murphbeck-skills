# TOOL.PERMISSIONS.OS.EXE - Policy-Aware Tool Use & Permissioning OS

You are TOOL.PERMISSIONS.OS.EXE — a permissions and policy enforcement controller for AI tool invocation.

MISSION
Ensure tools are invoked only when allowed by role, policy, and context. Default deny. Least-privilege always. Audit everything.

---

## CAPABILITIES

### ToolInventory.MOD
- Tool cataloging
- Scope definition
- Capability mapping
- Risk classification
- Version tracking

### RoleMapper.MOD
- Role definition
- Permission assignment
- Inheritance rules
- Separation of duties
- Role lifecycle

### PolicyEngine.MOD
- Policy authoring
- Context evaluation
- Condition matching
- Override handling
- Policy versioning

### AuditLogger.MOD
- Decision logging
- Evidence capture
- Compliance reporting
- Anomaly detection
- Retention management

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
TOOL.PERMISSIONS.OS.EXE - Policy-Aware Tool Use & Permissioning Engine
Production-ready implementation for AI tool access control
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any, Set
from enum import Enum
from datetime import datetime, timedelta
import hashlib
import json


# ════════════════════════════════════════════════════════════════════════════════
# ENUMS - Tool Classifications and Permission Types
# ════════════════════════════════════════════════════════════════════════════════

class ToolCategory(Enum):
    """Tool functional categories"""
    READ_ONLY = "read_only"
    WRITE = "write"
    EXECUTE = "execute"
    ADMIN = "admin"
    EXTERNAL = "external"
    DESTRUCTIVE = "destructive"

    @property
    def base_risk(self) -> int:
        """Base risk score for category"""
        risk_map = {
            "read_only": 10,
            "write": 40,
            "execute": 60,
            "admin": 80,
            "external": 50,
            "destructive": 95
        }
        return risk_map.get(self.value, 50)

    @property
    def requires_approval(self) -> bool:
        """Whether category requires explicit approval"""
        return self.value in ["admin", "destructive", "external"]


class RiskLevel(Enum):
    """Tool risk classifications"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

    @property
    def score_range(self) -> tuple:
        """Risk score range"""
        ranges = {
            "low": (0, 25),
            "medium": (26, 50),
            "high": (51, 75),
            "critical": (76, 100)
        }
        return ranges.get(self.value, (0, 100))

    @property
    def approval_required(self) -> str:
        """Required approval level"""
        approvals = {
            "low": "auto",
            "medium": "role_based",
            "high": "manager",
            "critical": "security_team"
        }
        return approvals.get(self.value, "manager")

    @property
    def audit_level(self) -> str:
        """Audit logging level"""
        levels = {
            "low": "minimal",
            "medium": "standard",
            "high": "detailed",
            "critical": "full_capture"
        }
        return levels.get(self.value, "standard")


class PermissionType(Enum):
    """Permission grant types"""
    ALLOW = "allow"
    DENY = "deny"
    CONDITIONAL = "conditional"
    ESCALATE = "escalate"
    INHERIT = "inherit"
    TEMPORARY = "temporary"

    @property
    def is_explicit(self) -> bool:
        """Whether permission is explicitly set"""
        return self.value in ["allow", "deny"]

    @property
    def requires_context(self) -> bool:
        """Whether context evaluation needed"""
        return self.value in ["conditional", "escalate", "temporary"]


class DecisionOutcome(Enum):
    """Authorization decision outcomes"""
    GRANTED = "granted"
    DENIED = "denied"
    ESCALATED = "escalated"
    PENDING = "pending"
    EXPIRED = "expired"
    REVOKED = "revoked"

    @property
    def is_positive(self) -> bool:
        """Whether access was granted"""
        return self.value == "granted"

    @property
    def requires_followup(self) -> bool:
        """Whether decision requires followup"""
        return self.value in ["escalated", "pending"]


class PolicyPriority(Enum):
    """Policy evaluation priority"""
    EMERGENCY = "emergency"
    CRITICAL = "critical"
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"
    DEFAULT = "default"

    @property
    def order(self) -> int:
        """Evaluation order (lower = first)"""
        orders = {
            "emergency": 0,
            "critical": 10,
            "high": 20,
            "normal": 50,
            "low": 80,
            "default": 100
        }
        return orders.get(self.value, 50)

    @property
    def can_override(self) -> Set[str]:
        """Which priorities this can override"""
        overrides = {
            "emergency": {"critical", "high", "normal", "low", "default"},
            "critical": {"high", "normal", "low", "default"},
            "high": {"normal", "low", "default"},
            "normal": {"low", "default"},
            "low": {"default"},
            "default": set()
        }
        return overrides.get(self.value, set())


class ContextType(Enum):
    """Context evaluation types"""
    TIME_BASED = "time_based"
    LOCATION_BASED = "location_based"
    SESSION_BASED = "session_based"
    RISK_BASED = "risk_based"
    RESOURCE_BASED = "resource_based"
    BEHAVIORAL = "behavioral"

    @property
    def evaluation_method(self) -> str:
        """How to evaluate context"""
        methods = {
            "time_based": "check_time_window",
            "location_based": "check_ip_allowlist",
            "session_based": "check_session_validity",
            "risk_based": "calculate_risk_score",
            "resource_based": "check_resource_limits",
            "behavioral": "analyze_behavior_pattern"
        }
        return methods.get(self.value, "default_check")


class AuditAction(Enum):
    """Audit log action types"""
    REQUEST = "request"
    DECISION = "decision"
    OVERRIDE = "override"
    ESCALATION = "escalation"
    REVOCATION = "revocation"
    POLICY_CHANGE = "policy_change"
    ROLE_CHANGE = "role_change"

    @property
    def retention_days(self) -> int:
        """Retention period in days"""
        retention = {
            "request": 90,
            "decision": 365,
            "override": 730,
            "escalation": 365,
            "revocation": 730,
            "policy_change": 1095,
            "role_change": 1095
        }
        return retention.get(self.value, 365)


class InheritanceMode(Enum):
    """Role inheritance modes"""
    ADDITIVE = "additive"
    RESTRICTIVE = "restrictive"
    OVERRIDE = "override"
    NONE = "none"

    @property
    def merge_strategy(self) -> str:
        """How to merge permissions"""
        strategies = {
            "additive": "union_permissions",
            "restrictive": "intersect_permissions",
            "override": "replace_permissions",
            "none": "no_inheritance"
        }
        return strategies.get(self.value, "no_inheritance")


class SeparationRule(Enum):
    """Separation of duties rules"""
    EXCLUSIVE = "exclusive"
    DUAL_CONTROL = "dual_control"
    TIME_SEPARATION = "time_separation"
    APPROVAL_CHAIN = "approval_chain"

    @property
    def minimum_parties(self) -> int:
        """Minimum parties required"""
        parties = {
            "exclusive": 1,
            "dual_control": 2,
            "time_separation": 1,
            "approval_chain": 2
        }
        return parties.get(self.value, 1)


# ════════════════════════════════════════════════════════════════════════════════
# DATACLASSES - Core Permission Models
# ════════════════════════════════════════════════════════════════════════════════

@dataclass
class Tool:
    """Tool definition with access metadata"""
    tool_id: str
    name: str
    description: str
    category: ToolCategory
    owner: str
    version: str = "1.0.0"
    risk_level: RiskLevel = RiskLevel.MEDIUM
    scope: str = "default"
    dependencies: List[str] = field(default_factory=list)
    data_accessed: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    deprecated: bool = False

    def calculate_risk_score(self) -> int:
        """Calculate composite risk score"""
        base = self.category.base_risk
        level_min, level_max = self.risk_level.score_range
        level_mid = (level_min + level_max) // 2

        # Adjust for dependencies
        dependency_factor = len(self.dependencies) * 2

        # Adjust for data sensitivity
        data_factor = len(self.data_accessed) * 3

        score = (base + level_mid + dependency_factor + data_factor) // 2
        return min(100, max(0, score))

    def get_checksum(self) -> str:
        """Generate tool configuration checksum"""
        content = f"{self.tool_id}:{self.version}:{self.category.value}:{self.risk_level.value}"
        return hashlib.sha256(content.encode()).hexdigest()[:12]


@dataclass
class Role:
    """Role definition with permissions"""
    role_id: str
    name: str
    description: str
    parent_role: Optional[str] = None
    inheritance_mode: InheritanceMode = InheritanceMode.ADDITIVE
    permissions: Dict[str, PermissionType] = field(default_factory=dict)
    max_risk_level: RiskLevel = RiskLevel.MEDIUM
    separation_rules: List[SeparationRule] = field(default_factory=list)
    active: bool = True
    created_at: datetime = field(default_factory=datetime.now)

    def has_permission(self, tool_id: str) -> Optional[PermissionType]:
        """Check if role has permission for tool"""
        return self.permissions.get(tool_id)

    def can_access_risk(self, risk_level: RiskLevel) -> bool:
        """Check if role can access given risk level"""
        max_score = self.max_risk_level.score_range[1]
        tool_score = risk_level.score_range[0]
        return tool_score <= max_score

    def get_effective_permissions(self) -> Dict[str, PermissionType]:
        """Get permissions after inheritance"""
        # Base implementation - inheritance resolved by engine
        return self.permissions.copy()


@dataclass
class Policy:
    """Access policy definition"""
    policy_id: str
    name: str
    description: str
    priority: PolicyPriority
    conditions: List[Dict[str, Any]] = field(default_factory=list)
    action: PermissionType = PermissionType.DENY
    applies_to_roles: List[str] = field(default_factory=list)
    applies_to_tools: List[str] = field(default_factory=list)
    context_type: ContextType = ContextType.RISK_BASED
    effective_from: datetime = field(default_factory=datetime.now)
    effective_until: Optional[datetime] = None
    version: int = 1
    active: bool = True

    def is_active(self) -> bool:
        """Check if policy is currently active"""
        if not self.active:
            return False
        now = datetime.now()
        if self.effective_until and now > self.effective_until:
            return False
        return now >= self.effective_from

    def matches_context(self, context: Dict[str, Any]) -> bool:
        """Check if policy conditions match context"""
        for condition in self.conditions:
            condition_type = condition.get("type")
            expected = condition.get("value")
            actual = context.get(condition.get("field"))

            if condition_type == "equals" and actual != expected:
                return False
            elif condition_type == "contains" and expected not in (actual or []):
                return False
            elif condition_type == "greater_than" and not (actual and actual > expected):
                return False
            elif condition_type == "less_than" and not (actual and actual < expected):
                return False
        return True

    def applies_to(self, role_id: str, tool_id: str) -> bool:
        """Check if policy applies to role/tool combination"""
        role_match = not self.applies_to_roles or role_id in self.applies_to_roles
        tool_match = not self.applies_to_tools or tool_id in self.applies_to_tools
        return role_match and tool_match


@dataclass
class AccessRequest:
    """Access request for authorization"""
    request_id: str
    requestor_id: str
    role_id: str
    tool_id: str
    context: Dict[str, Any] = field(default_factory=dict)
    justification: Optional[str] = None
    requested_at: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None

    def is_expired(self) -> bool:
        """Check if request has expired"""
        if not self.expires_at:
            return False
        return datetime.now() > self.expires_at

    def get_context_hash(self) -> str:
        """Generate context hash for caching"""
        context_str = json.dumps(self.context, sort_keys=True, default=str)
        return hashlib.md5(context_str.encode()).hexdigest()[:8]


@dataclass
class AccessDecision:
    """Authorization decision record"""
    decision_id: str
    request_id: str
    outcome: DecisionOutcome
    rationale: str
    policies_evaluated: List[str] = field(default_factory=list)
    policy_applied: Optional[str] = None
    decided_at: datetime = field(default_factory=datetime.now)
    decided_by: str = "system"
    valid_until: Optional[datetime] = None
    override_reason: Optional[str] = None

    def is_valid(self) -> bool:
        """Check if decision is still valid"""
        if not self.valid_until:
            return True
        return datetime.now() <= self.valid_until

    def to_audit_record(self) -> Dict[str, Any]:
        """Convert to audit record format"""
        return {
            "decision_id": self.decision_id,
            "request_id": self.request_id,
            "outcome": self.outcome.value,
            "rationale": self.rationale,
            "policy_applied": self.policy_applied,
            "timestamp": self.decided_at.isoformat(),
            "decided_by": self.decided_by,
            "override": self.override_reason is not None
        }


@dataclass
class AuditEntry:
    """Audit log entry"""
    entry_id: str
    action: AuditAction
    actor_id: str
    resource_type: str
    resource_id: str
    details: Dict[str, Any] = field(default_factory=dict)
    outcome: str = "success"
    timestamp: datetime = field(default_factory=datetime.now)
    session_id: Optional[str] = None
    ip_address: Optional[str] = None

    def get_retention_date(self) -> datetime:
        """Calculate retention expiry date"""
        return self.timestamp + timedelta(days=self.action.retention_days)

    def to_log_format(self) -> str:
        """Format for log output"""
        return (
            f"[{self.timestamp.isoformat()}] "
            f"{self.action.value.upper()} | "
            f"Actor: {self.actor_id} | "
            f"Resource: {self.resource_type}/{self.resource_id} | "
            f"Outcome: {self.outcome}"
        )


@dataclass
class Override:
    """Permission override record"""
    override_id: str
    request_id: str
    original_decision: DecisionOutcome
    override_decision: DecisionOutcome
    override_reason: str
    approved_by: str
    approved_at: datetime = field(default_factory=datetime.now)
    valid_until: Optional[datetime] = None
    requires_review: bool = True

    def is_active(self) -> bool:
        """Check if override is still active"""
        if not self.valid_until:
            return True
        return datetime.now() <= self.valid_until

    def days_until_expiry(self) -> Optional[int]:
        """Days until override expires"""
        if not self.valid_until:
            return None
        delta = self.valid_until - datetime.now()
        return max(0, delta.days)


# ════════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - Business Logic Implementation
# ════════════════════════════════════════════════════════════════════════════════

class ToolInventoryEngine:
    """Manages tool catalog and classifications"""

    # Risk classification rules
    RISK_FACTORS = {
        "data_sensitivity": {
            "pii": 30,
            "financial": 25,
            "health": 30,
            "credentials": 40,
            "public": 5
        },
        "action_type": {
            "read": 10,
            "write": 30,
            "delete": 50,
            "execute": 40,
            "admin": 60
        },
        "scope": {
            "self": 5,
            "team": 15,
            "department": 25,
            "organization": 40,
            "external": 50
        }
    }

    def __init__(self):
        self.tools: Dict[str, Tool] = {}
        self.categories: Dict[ToolCategory, List[str]] = {cat: [] for cat in ToolCategory}

    def register_tool(self, tool: Tool) -> str:
        """Register a tool in the catalog"""
        self.tools[tool.tool_id] = tool
        self.categories[tool.category].append(tool.tool_id)
        return tool.tool_id

    def classify_risk(self, tool: Tool) -> RiskLevel:
        """Classify tool risk level"""
        score = 0

        # Data sensitivity
        for data_type in tool.data_accessed:
            score += self.RISK_FACTORS["data_sensitivity"].get(data_type, 10)

        # Action type from category
        action_map = {
            ToolCategory.READ_ONLY: "read",
            ToolCategory.WRITE: "write",
            ToolCategory.EXECUTE: "execute",
            ToolCategory.ADMIN: "admin",
            ToolCategory.DESTRUCTIVE: "delete"
        }
        action = action_map.get(tool.category, "read")
        score += self.RISK_FACTORS["action_type"].get(action, 20)

        # Scope factor
        score += self.RISK_FACTORS["scope"].get(tool.scope, 15)

        # Dependency risk
        score += len(tool.dependencies) * 5

        # Classify based on score
        if score < 30:
            return RiskLevel.LOW
        elif score < 55:
            return RiskLevel.MEDIUM
        elif score < 80:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL

    def get_tool(self, tool_id: str) -> Optional[Tool]:
        """Retrieve tool by ID"""
        return self.tools.get(tool_id)

    def get_by_category(self, category: ToolCategory) -> List[Tool]:
        """Get all tools in a category"""
        return [self.tools[tid] for tid in self.categories.get(category, [])]

    def get_high_risk_tools(self) -> List[Tool]:
        """Get tools with high or critical risk"""
        return [
            t for t in self.tools.values()
            if t.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
        ]


class RoleMapperEngine:
    """Manages roles and permission inheritance"""

    # Default role hierarchy
    DEFAULT_HIERARCHY = {
        "admin": {"parent": None, "max_risk": RiskLevel.CRITICAL},
        "operator": {"parent": "admin", "max_risk": RiskLevel.HIGH},
        "developer": {"parent": "operator", "max_risk": RiskLevel.MEDIUM},
        "analyst": {"parent": "operator", "max_risk": RiskLevel.MEDIUM},
        "reader": {"parent": "developer", "max_risk": RiskLevel.LOW},
        "viewer": {"parent": "analyst", "max_risk": RiskLevel.LOW}
    }

    def __init__(self):
        self.roles: Dict[str, Role] = {}
        self.hierarchy: Dict[str, str] = {}

    def register_role(self, role: Role) -> str:
        """Register a role"""
        self.roles[role.role_id] = role
        if role.parent_role:
            self.hierarchy[role.role_id] = role.parent_role
        return role.role_id

    def get_effective_permissions(self, role_id: str) -> Dict[str, PermissionType]:
        """Get permissions including inherited"""
        role = self.roles.get(role_id)
        if not role:
            return {}

        effective = {}

        # Start with inherited permissions
        if role.parent_role and role.inheritance_mode != InheritanceMode.NONE:
            parent_perms = self.get_effective_permissions(role.parent_role)

            if role.inheritance_mode == InheritanceMode.ADDITIVE:
                effective.update(parent_perms)
            elif role.inheritance_mode == InheritanceMode.RESTRICTIVE:
                # Only inherit if also in role's own permissions
                for tool_id, perm in parent_perms.items():
                    if tool_id in role.permissions:
                        effective[tool_id] = perm

        # Apply role's own permissions
        if role.inheritance_mode == InheritanceMode.OVERRIDE:
            effective = role.permissions.copy()
        else:
            effective.update(role.permissions)

        return effective

    def get_role_chain(self, role_id: str) -> List[str]:
        """Get inheritance chain from role to root"""
        chain = [role_id]
        current = role_id

        while current in self.hierarchy:
            parent = self.hierarchy[current]
            chain.append(parent)
            current = parent

        return chain

    def check_separation_of_duties(self, role_id: str, tool_id: str,
                                    context: Dict[str, Any]) -> bool:
        """Check separation of duties rules"""
        role = self.roles.get(role_id)
        if not role or not role.separation_rules:
            return True

        for rule in role.separation_rules:
            if rule == SeparationRule.EXCLUSIVE:
                # Cannot have done related action recently
                recent_actions = context.get("recent_actions", [])
                if tool_id in recent_actions:
                    return False

            elif rule == SeparationRule.DUAL_CONTROL:
                # Requires second approver
                approvers = context.get("approvers", [])
                if len(approvers) < rule.minimum_parties:
                    return False

        return True


class PolicyEngine:
    """Evaluates and enforces access policies"""

    # Built-in policy templates
    POLICY_TEMPLATES = {
        "default_deny": {
            "action": PermissionType.DENY,
            "priority": PolicyPriority.DEFAULT,
            "conditions": []
        },
        "business_hours": {
            "action": PermissionType.CONDITIONAL,
            "priority": PolicyPriority.NORMAL,
            "conditions": [
                {"type": "time_range", "field": "hour", "start": 9, "end": 17}
            ]
        },
        "high_risk_approval": {
            "action": PermissionType.ESCALATE,
            "priority": PolicyPriority.HIGH,
            "conditions": [
                {"type": "risk_level", "field": "tool_risk", "value": "high"}
            ]
        },
        "emergency_access": {
            "action": PermissionType.ALLOW,
            "priority": PolicyPriority.EMERGENCY,
            "conditions": [
                {"type": "equals", "field": "emergency_flag", "value": True}
            ]
        }
    }

    def __init__(self):
        self.policies: Dict[str, Policy] = {}
        self.policy_cache: Dict[str, AccessDecision] = {}

    def register_policy(self, policy: Policy) -> str:
        """Register a policy"""
        self.policies[policy.policy_id] = policy
        return policy.policy_id

    def evaluate(self, request: AccessRequest, role: Role,
                 tool: Tool) -> AccessDecision:
        """Evaluate request against policies"""
        decision_id = hashlib.sha256(
            f"{request.request_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        # Get applicable policies sorted by priority
        applicable = self._get_applicable_policies(request.role_id, request.tool_id)
        applicable.sort(key=lambda p: p.priority.order)

        policies_evaluated = []

        # Enrich context with tool/role info
        context = request.context.copy()
        context["tool_risk"] = tool.risk_level.value
        context["tool_category"] = tool.category.value
        context["role_max_risk"] = role.max_risk_level.value

        # Evaluate policies in priority order
        for policy in applicable:
            policies_evaluated.append(policy.policy_id)

            if not policy.is_active():
                continue

            if policy.matches_context(context):
                outcome = self._action_to_outcome(policy.action)

                return AccessDecision(
                    decision_id=decision_id,
                    request_id=request.request_id,
                    outcome=outcome,
                    rationale=f"Policy '{policy.name}' matched",
                    policies_evaluated=policies_evaluated,
                    policy_applied=policy.policy_id
                )

        # Default deny if no policy matched
        return AccessDecision(
            decision_id=decision_id,
            request_id=request.request_id,
            outcome=DecisionOutcome.DENIED,
            rationale="No policy granted access (default deny)",
            policies_evaluated=policies_evaluated
        )

    def _get_applicable_policies(self, role_id: str, tool_id: str) -> List[Policy]:
        """Get policies applicable to role/tool"""
        return [
            p for p in self.policies.values()
            if p.applies_to(role_id, tool_id)
        ]

    def _action_to_outcome(self, action: PermissionType) -> DecisionOutcome:
        """Convert permission type to decision outcome"""
        mapping = {
            PermissionType.ALLOW: DecisionOutcome.GRANTED,
            PermissionType.DENY: DecisionOutcome.DENIED,
            PermissionType.CONDITIONAL: DecisionOutcome.PENDING,
            PermissionType.ESCALATE: DecisionOutcome.ESCALATED,
            PermissionType.TEMPORARY: DecisionOutcome.GRANTED
        }
        return mapping.get(action, DecisionOutcome.DENIED)


class AuditLoggerEngine:
    """Manages audit logging and compliance reporting"""

    # Anomaly detection thresholds
    ANOMALY_THRESHOLDS = {
        "rapid_requests": {"count": 100, "window_minutes": 5},
        "denied_attempts": {"count": 10, "window_minutes": 15},
        "off_hours_access": {"start_hour": 22, "end_hour": 6},
        "unusual_tools": {"threshold_percent": 95},
        "privilege_escalation": {"sensitivity": "high"}
    }

    def __init__(self):
        self.entries: List[AuditEntry] = []
        self.actor_history: Dict[str, List[AuditEntry]] = {}

    def log(self, entry: AuditEntry) -> str:
        """Log an audit entry"""
        self.entries.append(entry)

        if entry.actor_id not in self.actor_history:
            self.actor_history[entry.actor_id] = []
        self.actor_history[entry.actor_id].append(entry)

        return entry.entry_id

    def log_decision(self, request: AccessRequest, decision: AccessDecision) -> str:
        """Log an access decision"""
        entry_id = hashlib.sha256(
            f"audit:{decision.decision_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        entry = AuditEntry(
            entry_id=entry_id,
            action=AuditAction.DECISION,
            actor_id=request.requestor_id,
            resource_type="tool",
            resource_id=request.tool_id,
            details={
                "request_id": request.request_id,
                "role_id": request.role_id,
                "decision": decision.outcome.value,
                "rationale": decision.rationale,
                "policy_applied": decision.policy_applied
            },
            outcome="success" if decision.outcome.is_positive else "denied",
            session_id=request.context.get("session_id")
        )

        return self.log(entry)

    def detect_anomalies(self, actor_id: str) -> List[Dict[str, Any]]:
        """Detect anomalous behavior patterns"""
        anomalies = []
        history = self.actor_history.get(actor_id, [])

        if not history:
            return anomalies

        now = datetime.now()

        # Rapid requests check
        rapid_window = timedelta(minutes=self.ANOMALY_THRESHOLDS["rapid_requests"]["window_minutes"])
        recent = [e for e in history if (now - e.timestamp) < rapid_window]
        if len(recent) > self.ANOMALY_THRESHOLDS["rapid_requests"]["count"]:
            anomalies.append({
                "type": "rapid_requests",
                "count": len(recent),
                "severity": "high"
            })

        # Denied attempts check
        denied_window = timedelta(minutes=self.ANOMALY_THRESHOLDS["denied_attempts"]["window_minutes"])
        denied_recent = [
            e for e in history
            if (now - e.timestamp) < denied_window and e.outcome == "denied"
        ]
        if len(denied_recent) > self.ANOMALY_THRESHOLDS["denied_attempts"]["count"]:
            anomalies.append({
                "type": "excessive_denials",
                "count": len(denied_recent),
                "severity": "medium"
            })

        # Off-hours access
        start_hour = self.ANOMALY_THRESHOLDS["off_hours_access"]["start_hour"]
        end_hour = self.ANOMALY_THRESHOLDS["off_hours_access"]["end_hour"]
        current_hour = now.hour
        if current_hour >= start_hour or current_hour < end_hour:
            recent_off_hours = [
                e for e in history
                if (now - e.timestamp) < timedelta(hours=1)
            ]
            if recent_off_hours:
                anomalies.append({
                    "type": "off_hours_access",
                    "count": len(recent_off_hours),
                    "severity": "low"
                })

        return anomalies

    def get_compliance_report(self, start_date: datetime,
                               end_date: datetime) -> Dict[str, Any]:
        """Generate compliance report for period"""
        period_entries = [
            e for e in self.entries
            if start_date <= e.timestamp <= end_date
        ]

        total = len(period_entries)
        by_action = {}
        by_outcome = {}

        for entry in period_entries:
            action = entry.action.value
            by_action[action] = by_action.get(action, 0) + 1
            by_outcome[entry.outcome] = by_outcome.get(entry.outcome, 0) + 1

        return {
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "total_entries": total,
            "by_action": by_action,
            "by_outcome": by_outcome,
            "compliance_rate": by_outcome.get("success", 0) / total * 100 if total > 0 else 100,
            "generated_at": datetime.now().isoformat()
        }


class ToolPermissionsEngine:
    """Main orchestrator for tool permissions"""

    def __init__(self):
        self.inventory = ToolInventoryEngine()
        self.role_mapper = RoleMapperEngine()
        self.policy_engine = PolicyEngine()
        self.audit_logger = AuditLoggerEngine()
        self.overrides: Dict[str, Override] = {}

    def register_tool(self, tool: Tool) -> str:
        """Register a tool and auto-classify risk"""
        tool.risk_level = self.inventory.classify_risk(tool)
        return self.inventory.register_tool(tool)

    def register_role(self, role: Role) -> str:
        """Register a role"""
        return self.role_mapper.register_role(role)

    def register_policy(self, policy: Policy) -> str:
        """Register a policy"""
        return self.policy_engine.register_policy(policy)

    def authorize(self, request: AccessRequest) -> AccessDecision:
        """Process authorization request"""
        # Get tool
        tool = self.inventory.get_tool(request.tool_id)
        if not tool:
            decision = AccessDecision(
                decision_id=hashlib.sha256(request.request_id.encode()).hexdigest()[:16],
                request_id=request.request_id,
                outcome=DecisionOutcome.DENIED,
                rationale=f"Tool '{request.tool_id}' not found"
            )
            self.audit_logger.log_decision(request, decision)
            return decision

        # Get role
        role = self.role_mapper.roles.get(request.role_id)
        if not role or not role.active:
            decision = AccessDecision(
                decision_id=hashlib.sha256(request.request_id.encode()).hexdigest()[:16],
                request_id=request.request_id,
                outcome=DecisionOutcome.DENIED,
                rationale=f"Role '{request.role_id}' not found or inactive"
            )
            self.audit_logger.log_decision(request, decision)
            return decision

        # Check role can access tool's risk level
        if not role.can_access_risk(tool.risk_level):
            decision = AccessDecision(
                decision_id=hashlib.sha256(request.request_id.encode()).hexdigest()[:16],
                request_id=request.request_id,
                outcome=DecisionOutcome.DENIED,
                rationale=f"Role max risk ({role.max_risk_level.value}) insufficient for tool risk ({tool.risk_level.value})"
            )
            self.audit_logger.log_decision(request, decision)
            return decision

        # Check separation of duties
        if not self.role_mapper.check_separation_of_duties(
            request.role_id, request.tool_id, request.context
        ):
            decision = AccessDecision(
                decision_id=hashlib.sha256(request.request_id.encode()).hexdigest()[:16],
                request_id=request.request_id,
                outcome=DecisionOutcome.DENIED,
                rationale="Separation of duties violation"
            )
            self.audit_logger.log_decision(request, decision)
            return decision

        # Check effective permissions
        effective_perms = self.role_mapper.get_effective_permissions(request.role_id)
        if request.tool_id in effective_perms:
            perm = effective_perms[request.tool_id]
            if perm == PermissionType.ALLOW:
                decision = AccessDecision(
                    decision_id=hashlib.sha256(request.request_id.encode()).hexdigest()[:16],
                    request_id=request.request_id,
                    outcome=DecisionOutcome.GRANTED,
                    rationale=f"Explicit permission granted to role"
                )
                self.audit_logger.log_decision(request, decision)
                return decision
            elif perm == PermissionType.DENY:
                decision = AccessDecision(
                    decision_id=hashlib.sha256(request.request_id.encode()).hexdigest()[:16],
                    request_id=request.request_id,
                    outcome=DecisionOutcome.DENIED,
                    rationale=f"Explicit permission denied for role"
                )
                self.audit_logger.log_decision(request, decision)
                return decision

        # Evaluate policies
        decision = self.policy_engine.evaluate(request, role, tool)

        # Log decision
        self.audit_logger.log_decision(request, decision)

        # Check for anomalies
        anomalies = self.audit_logger.detect_anomalies(request.requestor_id)
        if anomalies:
            # Log anomaly detection
            for anomaly in anomalies:
                self.audit_logger.log(AuditEntry(
                    entry_id=hashlib.sha256(f"anomaly:{datetime.now().isoformat()}".encode()).hexdigest()[:16],
                    action=AuditAction.REQUEST,
                    actor_id="system",
                    resource_type="anomaly",
                    resource_id=request.requestor_id,
                    details=anomaly
                ))

        return decision

    def create_override(self, request_id: str, original_decision: DecisionOutcome,
                        new_decision: DecisionOutcome, reason: str,
                        approver: str, validity_hours: int = 24) -> Override:
        """Create a permission override"""
        override_id = hashlib.sha256(
            f"override:{request_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        override = Override(
            override_id=override_id,
            request_id=request_id,
            original_decision=original_decision,
            override_decision=new_decision,
            override_reason=reason,
            approved_by=approver,
            valid_until=datetime.now() + timedelta(hours=validity_hours)
        )

        self.overrides[override_id] = override

        # Log override
        self.audit_logger.log(AuditEntry(
            entry_id=hashlib.sha256(f"audit:override:{override_id}".encode()).hexdigest()[:16],
            action=AuditAction.OVERRIDE,
            actor_id=approver,
            resource_type="override",
            resource_id=override_id,
            details={
                "request_id": request_id,
                "original": original_decision.value,
                "override": new_decision.value,
                "reason": reason
            }
        ))

        return override

    def get_permission_matrix(self) -> Dict[str, Dict[str, str]]:
        """Generate permission matrix for all roles/tools"""
        matrix = {}

        for role_id, role in self.role_mapper.roles.items():
            matrix[role_id] = {}
            effective = self.role_mapper.get_effective_permissions(role_id)

            for tool_id in self.inventory.tools:
                if tool_id in effective:
                    matrix[role_id][tool_id] = effective[tool_id].value
                else:
                    matrix[role_id][tool_id] = "default_deny"

        return matrix


# ════════════════════════════════════════════════════════════════════════════════
# REPORTER - ASCII Visualizations
# ════════════════════════════════════════════════════════════════════════════════

class PermissionsReporter:
    """ASCII report generator for permissions"""

    ICONS = {
        "allow": "✓",
        "deny": "✗",
        "conditional": "?",
        "escalate": "↑",
        "pending": "○",
        "granted": "●",
        "low": "░",
        "medium": "▒",
        "high": "▓",
        "critical": "█"
    }

    def __init__(self, engine: ToolPermissionsEngine):
        self.engine = engine

    def generate_inventory_report(self) -> str:
        """Generate tool inventory report"""
        tools = list(self.engine.inventory.tools.values())

        by_category = {}
        by_risk = {}

        for tool in tools:
            cat = tool.category.value
            by_category[cat] = by_category.get(cat, 0) + 1

            risk = tool.risk_level.value
            by_risk[risk] = by_risk.get(risk, 0) + 1

        total = len(tools)

        lines = [
            "TOOL INVENTORY",
            "═" * 50,
            "",
            "┌" + "─" * 48 + "┐",
            "│       TOOL CATALOG                              │",
            "│                                                  │"
        ]

        # Category distribution
        lines.append("│  Tool Categories:                                │")
        for cat in ToolCategory:
            count = by_category.get(cat.value, 0)
            pct = count / total * 100 if total > 0 else 0
            bar = "█" * int(pct / 10) + "░" * (10 - int(pct / 10))
            lines.append(f"│  ├── {cat.value:12} {count:3} {bar} │")

        lines.append("│                                                  │")
        lines.append("│  Risk Distribution:                              │")

        for risk in RiskLevel:
            count = by_risk.get(risk.value, 0)
            pct = count / total * 100 if total > 0 else 0
            icon = self.ICONS.get(risk.value, "░")
            lines.append(f"│  ├── {risk.value:8} {count:3} ({pct:5.1f}%) {icon * 5}     │")

        lines.append("│                                                  │")
        lines.append("└" + "─" * 48 + "┘")

        return "\n".join(lines)

    def generate_permission_matrix(self) -> str:
        """Generate permission matrix visualization"""
        matrix = self.engine.get_permission_matrix()

        if not matrix:
            return "No roles or tools registered"

        roles = list(matrix.keys())
        tools = list(self.engine.inventory.tools.keys())[:10]  # Limit for display

        lines = [
            "PERMISSION MATRIX",
            "═" * 60,
            ""
        ]

        # Header
        header = "│ Tool         │"
        for role in roles[:5]:  # Limit roles for display
            header += f" {role[:8]:8} │"
        lines.append(header)
        lines.append("├" + "─" * 14 + "┼" + ("─" * 10 + "┼") * min(len(roles), 5))

        # Rows
        for tool in tools:
            row = f"│ {tool[:12]:12} │"
            for role in roles[:5]:
                perm = matrix.get(role, {}).get(tool, "deny")
                icon = self.ICONS.get(perm, "?")
                row += f"    {icon}     │"
            lines.append(row)

        lines.append("")
        lines.append("Legend: ✓=Allow  ✗=Deny  ?=Conditional  ↑=Escalate")

        return "\n".join(lines)

    def generate_policy_flow(self) -> str:
        """Generate policy evaluation flow diagram"""
        lines = [
            "POLICY EVALUATION FLOW",
            "═" * 50,
            "",
            "┌" + "─" * 48 + "┐",
            "│  Request Received                                │",
            "│          ↓                                       │",
            "│  Extract Context (role, tool, env)               │",
            "│          ↓                                       │",
            "│  Check Role Validity                             │",
            "│          ↓                                       │",
            "│  Check Tool Risk vs Role Max Risk                │",
            "│          ↓                                       │",
            "│  Check Explicit Permissions                      │",
            "│          ↓                                       │",
            "│  Evaluate Policies (by priority)                 │",
            "│    ├── Emergency (0)                             │",
            "│    ├── Critical (10)                             │",
            "│    ├── High (20)                                 │",
            "│    ├── Normal (50)                               │",
            "│    ├── Low (80)                                  │",
            "│    └── Default (100)                             │",
            "│          ↓                                       │",
            "│  Apply Default (DENY)                            │",
            "│          ↓                                       │",
            "│  Log Decision & Detect Anomalies                 │",
            "└" + "─" * 48 + "┘"
        ]

        return "\n".join(lines)

    def generate_role_hierarchy(self) -> str:
        """Generate role hierarchy visualization"""
        lines = [
            "ROLE HIERARCHY",
            "═" * 50,
            "",
            "┌" + "─" * 48 + "┐"
        ]

        # Build hierarchy from registered roles
        roles = self.engine.role_mapper.roles
        hierarchy = self.engine.role_mapper.hierarchy

        # Find roots (roles with no parent)
        roots = [r for r in roles if r not in hierarchy]

        def print_tree(role_id: str, indent: int = 0) -> List[str]:
            role = roles.get(role_id)
            if not role:
                return []

            prefix = "│  " + "    " * indent
            result = [f"{prefix}{'└── ' if indent > 0 else ''}{role.name} [{role.max_risk_level.value}]"]

            # Find children
            children = [r for r, p in hierarchy.items() if p == role_id]
            for child in children:
                result.extend(print_tree(child, indent + 1))

            return result

        for root in roots:
            lines.extend([f"│  {line[4:]}" for line in print_tree(root)])

        if not roots:
            lines.append("│  (No roles registered)                          │")

        lines.append("└" + "─" * 48 + "┘")

        return "\n".join(lines)

    def generate_audit_summary(self, days: int = 7) -> str:
        """Generate audit summary report"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        report = self.engine.audit_logger.get_compliance_report(start_date, end_date)

        lines = [
            "AUDIT SUMMARY",
            "═" * 50,
            f"Period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            "",
            f"Total Entries: {report['total_entries']}",
            f"Compliance Rate: {report['compliance_rate']:.1f}%",
            "",
            "By Action:",
        ]

        for action, count in report.get("by_action", {}).items():
            lines.append(f"  {action}: {count}")

        lines.extend([
            "",
            "By Outcome:"
        ])

        for outcome, count in report.get("by_outcome", {}).items():
            lines.append(f"  {outcome}: {count}")

        return "\n".join(lines)

    def generate_full_report(self) -> str:
        """Generate comprehensive permissions report"""
        sections = [
            "TOOL PERMISSIONING FRAMEWORK",
            "═" * 60,
            f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            f"Tools: {len(self.engine.inventory.tools)}",
            f"Roles: {len(self.engine.role_mapper.roles)}",
            f"Policies: {len(self.engine.policy_engine.policies)}",
            "═" * 60,
            "",
            self.generate_inventory_report(),
            "",
            self.generate_role_hierarchy(),
            "",
            self.generate_permission_matrix(),
            "",
            self.generate_policy_flow(),
            "",
            self.generate_audit_summary()
        ]

        return "\n".join(sections)


# ════════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════════

def create_cli():
    """Create command-line interface"""
    import argparse

    parser = argparse.ArgumentParser(
        description="TOOL.PERMISSIONS.OS.EXE - Policy-Aware Tool Use & Permissioning"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Inventory command
    inv_parser = subparsers.add_parser("inventory", help="Manage tool inventory")
    inv_parser.add_argument("--list", action="store_true", help="List all tools")
    inv_parser.add_argument("--category", help="Filter by category")
    inv_parser.add_argument("--risk", help="Filter by risk level")

    # Authorize command
    auth_parser = subparsers.add_parser("authorize", help="Process authorization request")
    auth_parser.add_argument("--role", required=True, help="Role ID")
    auth_parser.add_argument("--tool", required=True, help="Tool ID")
    auth_parser.add_argument("--context", help="Context JSON")

    # Matrix command
    matrix_parser = subparsers.add_parser("matrix", help="Show permission matrix")
    matrix_parser.add_argument("--role", help="Filter by role")

    # Audit command
    audit_parser = subparsers.add_parser("audit", help="View audit logs")
    audit_parser.add_argument("--days", type=int, default=7, help="Days to include")
    audit_parser.add_argument("--actor", help="Filter by actor")

    # Policy command
    policy_parser = subparsers.add_parser("policy", help="Manage policies")
    policy_parser.add_argument("--list", action="store_true", help="List policies")
    policy_parser.add_argument("--evaluate", help="Evaluate specific policy")

    return parser


def main():
    """Main entry point"""
    parser = create_cli()
    args = parser.parse_args()

    engine = ToolPermissionsEngine()
    reporter = PermissionsReporter(engine)

    if args.command == "inventory":
        print(reporter.generate_inventory_report())

    elif args.command == "authorize":
        import json as json_lib
        context = json_lib.loads(args.context) if args.context else {}

        request = AccessRequest(
            request_id=hashlib.sha256(f"req:{datetime.now().isoformat()}".encode()).hexdigest()[:16],
            requestor_id=args.role,
            role_id=args.role,
            tool_id=args.tool,
            context=context
        )

        decision = engine.authorize(request)
        print(f"Decision: {decision.outcome.value}")
        print(f"Rationale: {decision.rationale}")

    elif args.command == "matrix":
        print(reporter.generate_permission_matrix())

    elif args.command == "audit":
        print(reporter.generate_audit_summary(args.days))

    elif args.command == "policy":
        print(reporter.generate_policy_flow())

    else:
        print(reporter.generate_full_report())


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/tool-permissions` - Full permissioning framework
- `/tool-permissions inventory` - Tool catalog report
- `/tool-permissions matrix` - Permission matrix
- `/tool-permissions audit` - Audit log analysis
- `/tool-permissions policy` - Policy configuration

$ARGUMENTS
