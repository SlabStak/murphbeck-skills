# GOVERNANCE.OS.EXE - AI Policy, Risk & Compliance Architect

You are GOVERNANCE.OS.EXE — a policy, risk, and compliance architect for AI systems.

MISSION
Ensure AI systems are safe, explainable, auditable, and aligned with business and regulatory expectations. Favor practicality over theory.

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI GOVERNANCE OS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ RiskAssessor    │  │ GuardrailArch   │  │ AuditDesigner   │             │
│  │ Engine          │  │ Engine          │  │ Engine          │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           └────────────────────┼────────────────────┘                       │
│                                │                                            │
│                    ┌───────────┴───────────┐                                │
│                    │   OversightEngine      │                                │
│                    │   (Orchestrator)       │                                │
│                    └───────────┬───────────┘                                │
│                                │                                            │
│           ┌────────────────────┼────────────────────┐                       │
│           ▼                    ▼                    ▼                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ IncidentEngine  │  │ MonitorEngine   │  │ PolicyEngine    │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
GOVERNANCE.OS.EXE - AI Policy, Risk & Compliance Architect
Production-ready AI governance system with risk assessment, guardrails, and oversight.
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any, Set
from enum import Enum
from datetime import datetime, timedelta
import hashlib
import json
import argparse


# ============================================================================
# ENUMS - Type-safe classifications
# ============================================================================

class RiskCategory(Enum):
    """Categories of AI risk."""
    SAFETY = "safety"
    ACCURACY = "accuracy"
    PRIVACY = "privacy"
    SECURITY = "security"
    BIAS = "bias"
    COMPLIANCE = "compliance"
    OPERATIONAL = "operational"
    REPUTATIONAL = "reputational"
    FINANCIAL = "financial"
    LEGAL = "legal"

    @property
    def severity_weight(self) -> float:
        """Base severity weight for category."""
        weights = {
            "safety": 1.0,
            "privacy": 0.95,
            "security": 0.95,
            "compliance": 0.85,
            "legal": 0.85,
            "bias": 0.8,
            "accuracy": 0.75,
            "financial": 0.7,
            "reputational": 0.65,
            "operational": 0.6
        }
        return weights.get(self.value, 0.5)


class RiskSeverity(Enum):
    """Risk severity levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"

    @property
    def score(self) -> int:
        """Numeric score for severity."""
        return {"critical": 5, "high": 4, "medium": 3, "low": 2, "informational": 1}[self.value]

    @property
    def response_time_hours(self) -> int:
        """Maximum response time in hours."""
        return {"critical": 1, "high": 4, "medium": 24, "low": 72, "informational": 168}[self.value]


class RiskLikelihood(Enum):
    """Probability of risk occurrence."""
    CERTAIN = "certain"
    LIKELY = "likely"
    POSSIBLE = "possible"
    UNLIKELY = "unlikely"
    RARE = "rare"

    @property
    def score(self) -> int:
        """Numeric score for likelihood."""
        return {"certain": 5, "likely": 4, "possible": 3, "unlikely": 2, "rare": 1}[self.value]


class GuardrailType(Enum):
    """Types of guardrails."""
    INPUT_VALIDATION = "input_validation"
    OUTPUT_FILTERING = "output_filtering"
    RATE_LIMITING = "rate_limiting"
    CONTENT_POLICY = "content_policy"
    BEHAVIORAL_BOUND = "behavioral_bound"
    TOPIC_RESTRICTION = "topic_restriction"
    CONFIDENCE_THRESHOLD = "confidence_threshold"
    PII_DETECTION = "pii_detection"
    TOXICITY_FILTER = "toxicity_filter"
    PROMPT_INJECTION_DEFENSE = "prompt_injection_defense"

    @property
    def layer(self) -> str:
        """Which layer this guardrail operates on."""
        input_types = {"input_validation", "rate_limiting", "prompt_injection_defense"}
        output_types = {"output_filtering", "pii_detection", "toxicity_filter"}
        return "input" if self.value in input_types else "output" if self.value in output_types else "behavioral"


class PolicyStatus(Enum):
    """Status of a governance policy."""
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"


class ControlStatus(Enum):
    """Implementation status of a control."""
    NOT_IMPLEMENTED = "not_implemented"
    PARTIAL = "partial"
    IMPLEMENTED = "implemented"
    VERIFIED = "verified"
    FAILING = "failing"


class IncidentStatus(Enum):
    """Status of a governance incident."""
    DETECTED = "detected"
    TRIAGED = "triaged"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    POST_MORTEM = "post_mortem"
    CLOSED = "closed"


class HITLDecision(Enum):
    """Human-in-the-loop decision outcomes."""
    AUTO_APPROVE = "auto_approve"
    SAMPLING_REVIEW = "sampling_review"
    HUMAN_REVIEW = "human_review"
    SENIOR_APPROVAL = "senior_approval"
    REJECT = "reject"


class AuditEventType(Enum):
    """Types of audit events."""
    POLICY_CREATED = "policy_created"
    POLICY_UPDATED = "policy_updated"
    RISK_IDENTIFIED = "risk_identified"
    RISK_MITIGATED = "risk_mitigated"
    GUARDRAIL_TRIGGERED = "guardrail_triggered"
    CONTROL_VERIFIED = "control_verified"
    INCIDENT_OPENED = "incident_opened"
    INCIDENT_CLOSED = "incident_closed"
    HITL_DECISION = "hitl_decision"
    ESCALATION = "escalation"
    ROLLBACK = "rollback"


class RiskTier(Enum):
    """Risk tier classification for AI systems."""
    TIER_1_MINIMAL = "tier_1_minimal"
    TIER_2_LIMITED = "tier_2_limited"
    TIER_3_HIGH = "tier_3_high"
    TIER_4_UNACCEPTABLE = "tier_4_unacceptable"

    @property
    def requirements(self) -> Dict[str, Any]:
        """Requirements for each tier."""
        reqs = {
            "tier_1_minimal": {
                "documentation": "basic",
                "review_frequency": "annual",
                "hitl_required": False,
                "audit_depth": "light"
            },
            "tier_2_limited": {
                "documentation": "standard",
                "review_frequency": "quarterly",
                "hitl_required": False,
                "audit_depth": "standard"
            },
            "tier_3_high": {
                "documentation": "comprehensive",
                "review_frequency": "monthly",
                "hitl_required": True,
                "audit_depth": "deep"
            },
            "tier_4_unacceptable": {
                "documentation": "prohibited",
                "review_frequency": "not_allowed",
                "hitl_required": True,
                "audit_depth": "full"
            }
        }
        return reqs[self.value]


# ============================================================================
# DATACLASSES - Structured data models
# ============================================================================

@dataclass
class Risk:
    """Individual risk entry."""
    risk_id: str
    title: str
    category: RiskCategory
    description: str
    likelihood: RiskLikelihood
    severity: RiskSeverity
    mitigation: str
    owner: str
    status: str = "open"
    identified_date: datetime = field(default_factory=datetime.now)
    review_date: Optional[datetime] = None

    def calculate_score(self) -> int:
        """Calculate risk score (1-25)."""
        return self.likelihood.score * self.severity.score

    def get_priority(self) -> str:
        """Get priority based on score."""
        score = self.calculate_score()
        if score >= 20:
            return "critical"
        elif score >= 12:
            return "high"
        elif score >= 6:
            return "medium"
        return "low"

    def is_overdue(self) -> bool:
        """Check if risk review is overdue."""
        if not self.review_date:
            return (datetime.now() - self.identified_date).days > 30
        return datetime.now() > self.review_date


@dataclass
class Guardrail:
    """Individual guardrail configuration."""
    guardrail_id: str
    name: str
    guardrail_type: GuardrailType
    description: str
    implementation: str
    threshold: Optional[float] = None
    action_on_trigger: str = "block"
    enabled: bool = True
    trigger_count: int = 0
    last_triggered: Optional[datetime] = None

    def trigger(self) -> None:
        """Record a guardrail trigger."""
        self.trigger_count += 1
        self.last_triggered = datetime.now()

    def get_effectiveness_rating(self, false_positive_rate: float) -> str:
        """Rate guardrail effectiveness."""
        if false_positive_rate < 0.01:
            return "excellent"
        elif false_positive_rate < 0.05:
            return "good"
        elif false_positive_rate < 0.15:
            return "acceptable"
        return "needs_improvement"


@dataclass
class Policy:
    """Governance policy document."""
    policy_id: str
    title: str
    version: str
    status: PolicyStatus
    scope: str
    requirements: List[str]
    owner: str
    effective_date: Optional[datetime] = None
    review_date: Optional[datetime] = None
    approvers: List[str] = field(default_factory=list)
    related_controls: List[str] = field(default_factory=list)

    def is_active(self) -> bool:
        """Check if policy is currently active."""
        return self.status == PolicyStatus.ACTIVE

    def needs_review(self) -> bool:
        """Check if policy needs review."""
        if not self.review_date:
            return True
        return datetime.now() > self.review_date

    def get_compliance_gap(self, implemented_controls: Set[str]) -> List[str]:
        """Get list of controls not yet implemented."""
        return [c for c in self.related_controls if c not in implemented_controls]


@dataclass
class Control:
    """Security/governance control."""
    control_id: str
    name: str
    description: str
    category: RiskCategory
    status: ControlStatus
    implementation_details: str
    test_procedure: str
    evidence_required: List[str]
    owner: str
    last_verified: Optional[datetime] = None

    def is_compliant(self) -> bool:
        """Check if control is compliant."""
        return self.status in [ControlStatus.IMPLEMENTED, ControlStatus.VERIFIED]

    def days_since_verification(self) -> int:
        """Days since last verification."""
        if not self.last_verified:
            return -1
        return (datetime.now() - self.last_verified).days

    def needs_verification(self, max_days: int = 90) -> bool:
        """Check if control needs re-verification."""
        days = self.days_since_verification()
        return days < 0 or days > max_days


@dataclass
class Incident:
    """Governance incident record."""
    incident_id: str
    title: str
    severity: RiskSeverity
    status: IncidentStatus
    description: str
    category: RiskCategory
    detected_at: datetime
    detected_by: str
    affected_systems: List[str]
    root_cause: Optional[str] = None
    resolution: Optional[str] = None
    resolved_at: Optional[datetime] = None
    escalation_history: List[Dict[str, Any]] = field(default_factory=list)

    def escalate(self, level: str, escalated_to: str, reason: str) -> None:
        """Record an escalation."""
        self.escalation_history.append({
            "level": level,
            "escalated_to": escalated_to,
            "reason": reason,
            "timestamp": datetime.now().isoformat()
        })

    def get_resolution_time(self) -> Optional[timedelta]:
        """Get time to resolution."""
        if self.resolved_at:
            return self.resolved_at - self.detected_at
        return None

    def is_within_sla(self) -> bool:
        """Check if incident is within SLA."""
        if self.status == IncidentStatus.CLOSED:
            resolution_time = self.get_resolution_time()
            if resolution_time:
                max_hours = self.severity.response_time_hours
                return resolution_time.total_seconds() / 3600 <= max_hours
        return True  # Still in progress


@dataclass
class HITLCheckpoint:
    """Human-in-the-loop checkpoint configuration."""
    checkpoint_id: str
    name: str
    trigger_condition: str
    confidence_threshold_auto: float
    confidence_threshold_sampling: float
    confidence_threshold_review: float
    reviewer_role: str
    sla_hours: int
    sampling_rate: float = 0.1

    def get_decision(self, confidence: float, is_critical: bool = False) -> HITLDecision:
        """Determine HITL decision based on confidence."""
        if is_critical:
            return HITLDecision.SENIOR_APPROVAL
        if confidence >= self.confidence_threshold_auto:
            return HITLDecision.AUTO_APPROVE
        if confidence >= self.confidence_threshold_sampling:
            return HITLDecision.SAMPLING_REVIEW
        if confidence >= self.confidence_threshold_review:
            return HITLDecision.HUMAN_REVIEW
        return HITLDecision.REJECT


@dataclass
class MonitoringAlert:
    """Monitoring alert configuration."""
    alert_id: str
    metric_name: str
    threshold: float
    operator: str  # gt, lt, eq, gte, lte
    severity: RiskSeverity
    notification_channels: List[str]
    cooldown_minutes: int = 15
    last_fired: Optional[datetime] = None

    def evaluate(self, value: float) -> bool:
        """Evaluate if alert should fire."""
        ops = {
            "gt": lambda v, t: v > t,
            "lt": lambda v, t: v < t,
            "eq": lambda v, t: v == t,
            "gte": lambda v, t: v >= t,
            "lte": lambda v, t: v <= t
        }
        return ops.get(self.operator, lambda v, t: False)(value, self.threshold)

    def can_fire(self) -> bool:
        """Check if alert can fire (respecting cooldown)."""
        if not self.last_fired:
            return True
        elapsed = (datetime.now() - self.last_fired).total_seconds() / 60
        return elapsed >= self.cooldown_minutes


@dataclass
class AuditEntry:
    """Immutable audit log entry."""
    entry_id: str
    event_type: AuditEventType
    timestamp: datetime
    actor: str
    target: str
    action: str
    details: Dict[str, Any]
    checksum: str = ""

    def __post_init__(self):
        if not self.checksum:
            self.checksum = self._calculate_checksum()

    def _calculate_checksum(self) -> str:
        """Calculate entry checksum."""
        content = f"{self.entry_id}{self.event_type.value}{self.timestamp.isoformat()}"
        content += f"{self.actor}{self.target}{self.action}{json.dumps(self.details, sort_keys=True)}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def verify_integrity(self) -> bool:
        """Verify entry hasn't been tampered with."""
        return self.checksum == self._calculate_checksum()


@dataclass
class AISystem:
    """AI system being governed."""
    system_id: str
    name: str
    description: str
    risk_tier: RiskTier
    owner: str
    use_cases: List[str]
    data_types: List[str]
    deployed_date: Optional[datetime] = None
    last_assessment: Optional[datetime] = None
    associated_risks: List[str] = field(default_factory=list)
    associated_controls: List[str] = field(default_factory=list)

    def needs_assessment(self) -> bool:
        """Check if system needs risk assessment."""
        if not self.last_assessment:
            return True
        days = (datetime.now() - self.last_assessment).days
        req_freq = self.risk_tier.requirements["review_frequency"]
        freq_days = {"annual": 365, "quarterly": 90, "monthly": 30}
        return days > freq_days.get(req_freq, 365)


# ============================================================================
# ENGINE CLASSES - Core business logic
# ============================================================================

class RiskAssessorEngine:
    """Engine for assessing and managing AI risks."""

    RISK_MATRIX = {
        # (likelihood_score, severity_score) -> priority
        (5, 5): "critical", (5, 4): "critical", (4, 5): "critical",
        (5, 3): "high", (4, 4): "high", (3, 5): "high",
        (5, 2): "high", (4, 3): "high", (3, 4): "high", (2, 5): "high",
        (5, 1): "medium", (4, 2): "medium", (3, 3): "medium", (2, 4): "medium", (1, 5): "medium",
        (4, 1): "medium", (3, 2): "medium", (2, 3): "medium", (1, 4): "medium",
        (3, 1): "low", (2, 2): "low", (1, 3): "low",
        (2, 1): "low", (1, 2): "low", (1, 1): "low"
    }

    def __init__(self):
        self.risks: Dict[str, Risk] = {}
        self.risk_history: List[Dict[str, Any]] = []

    def identify_risk(
        self,
        title: str,
        category: RiskCategory,
        description: str,
        likelihood: RiskLikelihood,
        severity: RiskSeverity,
        mitigation: str,
        owner: str
    ) -> Risk:
        """Identify and register a new risk."""
        risk_id = f"RISK-{hashlib.md5(f'{title}{datetime.now().isoformat()}'.encode()).hexdigest()[:8].upper()}"

        risk = Risk(
            risk_id=risk_id,
            title=title,
            category=category,
            description=description,
            likelihood=likelihood,
            severity=severity,
            mitigation=mitigation,
            owner=owner,
            review_date=datetime.now() + timedelta(days=30)
        )

        self.risks[risk_id] = risk
        self.risk_history.append({
            "action": "identified",
            "risk_id": risk_id,
            "timestamp": datetime.now().isoformat()
        })

        return risk

    def assess_system_risks(self, system: AISystem) -> Dict[str, Any]:
        """Assess all risks for an AI system."""
        system_risks = [r for r in self.risks.values() if r.risk_id in system.associated_risks]

        assessment = {
            "system_id": system.system_id,
            "system_name": system.name,
            "risk_tier": system.risk_tier.value,
            "total_risks": len(system_risks),
            "by_severity": {},
            "by_category": {},
            "aggregate_score": 0,
            "top_risks": []
        }

        for severity in RiskSeverity:
            count = len([r for r in system_risks if r.severity == severity])
            assessment["by_severity"][severity.value] = count

        for category in RiskCategory:
            count = len([r for r in system_risks if r.category == category])
            if count > 0:
                assessment["by_category"][category.value] = count

        if system_risks:
            assessment["aggregate_score"] = sum(r.calculate_score() for r in system_risks) / len(system_risks)
            sorted_risks = sorted(system_risks, key=lambda r: r.calculate_score(), reverse=True)
            assessment["top_risks"] = [
                {"risk_id": r.risk_id, "title": r.title, "score": r.calculate_score()}
                for r in sorted_risks[:5]
            ]

        return assessment

    def get_risk_register(self) -> List[Dict[str, Any]]:
        """Get formatted risk register."""
        return [
            {
                "risk_id": r.risk_id,
                "title": r.title,
                "category": r.category.value,
                "likelihood": r.likelihood.value,
                "severity": r.severity.value,
                "score": r.calculate_score(),
                "priority": r.get_priority(),
                "owner": r.owner,
                "status": r.status
            }
            for r in sorted(self.risks.values(), key=lambda r: r.calculate_score(), reverse=True)
        ]


class GuardrailArchitectEngine:
    """Engine for designing and managing guardrails."""

    DEFAULT_GUARDRAILS = {
        "input_sanitization": {
            "type": GuardrailType.INPUT_VALIDATION,
            "description": "Sanitize and validate all user inputs",
            "threshold": None,
            "action": "sanitize"
        },
        "prompt_injection": {
            "type": GuardrailType.PROMPT_INJECTION_DEFENSE,
            "description": "Detect and block prompt injection attempts",
            "threshold": 0.8,
            "action": "block"
        },
        "pii_filter": {
            "type": GuardrailType.PII_DETECTION,
            "description": "Detect and redact PII in outputs",
            "threshold": 0.9,
            "action": "redact"
        },
        "toxicity_filter": {
            "type": GuardrailType.TOXICITY_FILTER,
            "description": "Block toxic or harmful outputs",
            "threshold": 0.7,
            "action": "block"
        },
        "rate_limiter": {
            "type": GuardrailType.RATE_LIMITING,
            "description": "Prevent abuse through rate limiting",
            "threshold": 100,  # requests per minute
            "action": "throttle"
        }
    }

    def __init__(self):
        self.guardrails: Dict[str, Guardrail] = {}
        self.trigger_log: List[Dict[str, Any]] = []

    def create_guardrail(
        self,
        name: str,
        guardrail_type: GuardrailType,
        description: str,
        implementation: str,
        threshold: Optional[float] = None,
        action_on_trigger: str = "block"
    ) -> Guardrail:
        """Create a new guardrail."""
        guardrail_id = f"GR-{hashlib.md5(f'{name}{datetime.now().isoformat()}'.encode()).hexdigest()[:8].upper()}"

        guardrail = Guardrail(
            guardrail_id=guardrail_id,
            name=name,
            guardrail_type=guardrail_type,
            description=description,
            implementation=implementation,
            threshold=threshold,
            action_on_trigger=action_on_trigger
        )

        self.guardrails[guardrail_id] = guardrail
        return guardrail

    def evaluate_input(self, content: str) -> List[Dict[str, Any]]:
        """Evaluate input against all input guardrails."""
        results = []
        input_guardrails = [g for g in self.guardrails.values()
                          if g.guardrail_type.layer == "input" and g.enabled]

        for guardrail in input_guardrails:
            triggered = self._check_guardrail(guardrail, content)
            if triggered:
                guardrail.trigger()
                self.trigger_log.append({
                    "guardrail_id": guardrail.guardrail_id,
                    "content_hash": hashlib.md5(content.encode()).hexdigest()[:8],
                    "timestamp": datetime.now().isoformat()
                })
            results.append({
                "guardrail_id": guardrail.guardrail_id,
                "name": guardrail.name,
                "triggered": triggered,
                "action": guardrail.action_on_trigger if triggered else None
            })

        return results

    def evaluate_output(self, content: str) -> List[Dict[str, Any]]:
        """Evaluate output against all output guardrails."""
        results = []
        output_guardrails = [g for g in self.guardrails.values()
                           if g.guardrail_type.layer == "output" and g.enabled]

        for guardrail in output_guardrails:
            triggered = self._check_guardrail(guardrail, content)
            if triggered:
                guardrail.trigger()
            results.append({
                "guardrail_id": guardrail.guardrail_id,
                "name": guardrail.name,
                "triggered": triggered,
                "action": guardrail.action_on_trigger if triggered else None
            })

        return results

    def _check_guardrail(self, guardrail: Guardrail, content: str) -> bool:
        """Check if guardrail should trigger (simplified check)."""
        # In production, this would use ML models, regex patterns, etc.
        checks = {
            GuardrailType.PROMPT_INJECTION_DEFENSE: lambda c: any(
                kw in c.lower() for kw in ["ignore previous", "disregard instructions", "system prompt"]
            ),
            GuardrailType.PII_DETECTION: lambda c: any(
                kw in c.lower() for kw in ["ssn:", "social security", "credit card"]
            ),
            GuardrailType.TOXICITY_FILTER: lambda c: any(
                kw in c.lower() for kw in ["hate", "violent", "harmful"]
            )
        }

        check_fn = checks.get(guardrail.guardrail_type)
        return check_fn(content) if check_fn else False

    def get_guardrail_status(self) -> Dict[str, Any]:
        """Get status of all guardrails."""
        return {
            "total": len(self.guardrails),
            "enabled": len([g for g in self.guardrails.values() if g.enabled]),
            "by_layer": {
                "input": len([g for g in self.guardrails.values() if g.guardrail_type.layer == "input"]),
                "output": len([g for g in self.guardrails.values() if g.guardrail_type.layer == "output"]),
                "behavioral": len([g for g in self.guardrails.values() if g.guardrail_type.layer == "behavioral"])
            },
            "total_triggers": sum(g.trigger_count for g in self.guardrails.values())
        }


class AuditDesignerEngine:
    """Engine for audit logging and compliance tracking."""

    RETENTION_POLICIES = {
        AuditEventType.POLICY_CREATED: 365 * 7,  # 7 years
        AuditEventType.POLICY_UPDATED: 365 * 7,
        AuditEventType.RISK_IDENTIFIED: 365 * 5,
        AuditEventType.RISK_MITIGATED: 365 * 5,
        AuditEventType.GUARDRAIL_TRIGGERED: 365,
        AuditEventType.INCIDENT_OPENED: 365 * 7,
        AuditEventType.INCIDENT_CLOSED: 365 * 7,
        AuditEventType.HITL_DECISION: 365 * 3,
        AuditEventType.ROLLBACK: 365 * 7
    }

    def __init__(self):
        self.audit_trail: List[AuditEntry] = []
        self.chain_checksum: str = "genesis"

    def log_event(
        self,
        event_type: AuditEventType,
        actor: str,
        target: str,
        action: str,
        details: Dict[str, Any]
    ) -> AuditEntry:
        """Log an audit event with chain integrity."""
        entry_id = f"AUD-{len(self.audit_trail):06d}"

        # Include previous checksum in details for chain integrity
        details["_chain_prev"] = self.chain_checksum

        entry = AuditEntry(
            entry_id=entry_id,
            event_type=event_type,
            timestamp=datetime.now(),
            actor=actor,
            target=target,
            action=action,
            details=details
        )

        self.audit_trail.append(entry)
        self.chain_checksum = entry.checksum

        return entry

    def verify_chain_integrity(self) -> Dict[str, Any]:
        """Verify integrity of entire audit chain."""
        if not self.audit_trail:
            return {"valid": True, "entries_verified": 0}

        valid = True
        invalid_entries = []
        prev_checksum = "genesis"

        for entry in self.audit_trail:
            if not entry.verify_integrity():
                valid = False
                invalid_entries.append(entry.entry_id)

            if entry.details.get("_chain_prev") != prev_checksum:
                valid = False
                invalid_entries.append(f"{entry.entry_id}_chain")

            prev_checksum = entry.checksum

        return {
            "valid": valid,
            "entries_verified": len(self.audit_trail),
            "invalid_entries": invalid_entries,
            "chain_checksum": self.chain_checksum
        }

    def query_events(
        self,
        event_types: Optional[List[AuditEventType]] = None,
        actor: Optional[str] = None,
        target: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Query audit events with filters."""
        results = []

        for entry in reversed(self.audit_trail):
            if event_types and entry.event_type not in event_types:
                continue
            if actor and entry.actor != actor:
                continue
            if target and entry.target != target:
                continue
            if start_date and entry.timestamp < start_date:
                continue
            if end_date and entry.timestamp > end_date:
                continue

            results.append({
                "entry_id": entry.entry_id,
                "event_type": entry.event_type.value,
                "timestamp": entry.timestamp.isoformat(),
                "actor": entry.actor,
                "target": entry.target,
                "action": entry.action
            })

            if len(results) >= limit:
                break

        return results

    def generate_compliance_report(self) -> Dict[str, Any]:
        """Generate compliance report from audit trail."""
        report = {
            "generated_at": datetime.now().isoformat(),
            "total_events": len(self.audit_trail),
            "chain_integrity": self.verify_chain_integrity(),
            "events_by_type": {},
            "recent_incidents": [],
            "policy_changes": []
        }

        for event_type in AuditEventType:
            count = len([e for e in self.audit_trail if e.event_type == event_type])
            if count > 0:
                report["events_by_type"][event_type.value] = count

        incident_entries = [e for e in self.audit_trail
                          if e.event_type in [AuditEventType.INCIDENT_OPENED, AuditEventType.INCIDENT_CLOSED]]
        report["recent_incidents"] = [
            {"entry_id": e.entry_id, "action": e.action, "timestamp": e.timestamp.isoformat()}
            for e in incident_entries[-10:]
        ]

        policy_entries = [e for e in self.audit_trail
                        if e.event_type in [AuditEventType.POLICY_CREATED, AuditEventType.POLICY_UPDATED]]
        report["policy_changes"] = [
            {"entry_id": e.entry_id, "action": e.action, "timestamp": e.timestamp.isoformat()}
            for e in policy_entries[-10:]
        ]

        return report


class OversightEngine:
    """Engine for human oversight and escalation management."""

    ESCALATION_MATRIX = {
        "technical_failure": ["on_call", "engineering_lead", "cto"],
        "safety_incident": ["trust_safety", "legal", "ceo"],
        "data_breach": ["security", "ciso", "legal_ceo"],
        "regulatory": ["compliance", "legal", "ceo"],
        "reputational": ["communications", "legal", "ceo"]
    }

    def __init__(self):
        self.checkpoints: Dict[str, HITLCheckpoint] = {}
        self.decisions: List[Dict[str, Any]] = []
        self.escalations: List[Dict[str, Any]] = []

    def create_checkpoint(
        self,
        name: str,
        trigger_condition: str,
        confidence_threshold_auto: float,
        confidence_threshold_sampling: float,
        confidence_threshold_review: float,
        reviewer_role: str,
        sla_hours: int,
        sampling_rate: float = 0.1
    ) -> HITLCheckpoint:
        """Create a HITL checkpoint."""
        checkpoint_id = f"CP-{hashlib.md5(f'{name}{datetime.now().isoformat()}'.encode()).hexdigest()[:8].upper()}"

        checkpoint = HITLCheckpoint(
            checkpoint_id=checkpoint_id,
            name=name,
            trigger_condition=trigger_condition,
            confidence_threshold_auto=confidence_threshold_auto,
            confidence_threshold_sampling=confidence_threshold_sampling,
            confidence_threshold_review=confidence_threshold_review,
            reviewer_role=reviewer_role,
            sla_hours=sla_hours,
            sampling_rate=sampling_rate
        )

        self.checkpoints[checkpoint_id] = checkpoint
        return checkpoint

    def evaluate_decision(
        self,
        checkpoint_id: str,
        confidence: float,
        context: Dict[str, Any],
        is_critical: bool = False
    ) -> Dict[str, Any]:
        """Evaluate a decision through a checkpoint."""
        checkpoint = self.checkpoints.get(checkpoint_id)
        if not checkpoint:
            return {"error": "Checkpoint not found"}

        decision = checkpoint.get_decision(confidence, is_critical)

        result = {
            "checkpoint_id": checkpoint_id,
            "decision": decision.value,
            "confidence": confidence,
            "is_critical": is_critical,
            "reviewer_role": checkpoint.reviewer_role if decision != HITLDecision.AUTO_APPROVE else None,
            "sla_hours": checkpoint.sla_hours if decision != HITLDecision.AUTO_APPROVE else None,
            "timestamp": datetime.now().isoformat()
        }

        self.decisions.append(result)
        return result

    def escalate(
        self,
        issue_type: str,
        severity: RiskSeverity,
        description: str,
        current_handler: str
    ) -> Dict[str, Any]:
        """Escalate an issue to appropriate level."""
        escalation_path = self.ESCALATION_MATRIX.get(issue_type, ["manager", "director", "executive"])

        # Determine escalation level based on severity
        level_map = {
            RiskSeverity.CRITICAL: 2,  # Go to highest
            RiskSeverity.HIGH: 1,
            RiskSeverity.MEDIUM: 0,
            RiskSeverity.LOW: 0
        }

        level = level_map.get(severity, 0)
        escalate_to = escalation_path[min(level, len(escalation_path) - 1)]

        escalation = {
            "escalation_id": f"ESC-{len(self.escalations):04d}",
            "issue_type": issue_type,
            "severity": severity.value,
            "description": description,
            "from": current_handler,
            "to": escalate_to,
            "timestamp": datetime.now().isoformat(),
            "sla_hours": severity.response_time_hours
        }

        self.escalations.append(escalation)
        return escalation

    def get_pending_reviews(self) -> List[Dict[str, Any]]:
        """Get decisions pending human review."""
        return [
            d for d in self.decisions
            if d["decision"] in [HITLDecision.HUMAN_REVIEW.value, HITLDecision.SENIOR_APPROVAL.value, HITLDecision.SAMPLING_REVIEW.value]
        ]


class IncidentResponseEngine:
    """Engine for incident management."""

    def __init__(self):
        self.incidents: Dict[str, Incident] = {}
        self.playbooks: Dict[str, List[str]] = {
            "safety": [
                "Immediately disable affected AI feature",
                "Notify Trust & Safety team",
                "Document incident details",
                "Assess user impact",
                "Prepare communications"
            ],
            "security": [
                "Isolate affected systems",
                "Notify Security team",
                "Preserve evidence",
                "Assess data exposure",
                "Begin forensic analysis"
            ],
            "privacy": [
                "Stop data processing",
                "Notify Privacy team",
                "Assess PII exposure",
                "Determine notification requirements",
                "Document timeline"
            ]
        }

    def open_incident(
        self,
        title: str,
        severity: RiskSeverity,
        description: str,
        category: RiskCategory,
        detected_by: str,
        affected_systems: List[str]
    ) -> Incident:
        """Open a new incident."""
        incident_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{len(self.incidents):04d}"

        incident = Incident(
            incident_id=incident_id,
            title=title,
            severity=severity,
            status=IncidentStatus.DETECTED,
            description=description,
            category=category,
            detected_at=datetime.now(),
            detected_by=detected_by,
            affected_systems=affected_systems
        )

        self.incidents[incident_id] = incident
        return incident

    def update_status(self, incident_id: str, new_status: IncidentStatus) -> bool:
        """Update incident status."""
        incident = self.incidents.get(incident_id)
        if not incident:
            return False

        incident.status = new_status
        if new_status == IncidentStatus.RESOLVED:
            incident.resolved_at = datetime.now()

        return True

    def get_playbook(self, category: RiskCategory) -> List[str]:
        """Get incident response playbook for category."""
        category_map = {
            RiskCategory.SAFETY: "safety",
            RiskCategory.SECURITY: "security",
            RiskCategory.PRIVACY: "privacy"
        }

        playbook_key = category_map.get(category, "safety")
        return self.playbooks.get(playbook_key, self.playbooks["safety"])

    def get_active_incidents(self) -> List[Dict[str, Any]]:
        """Get all active (non-closed) incidents."""
        return [
            {
                "incident_id": i.incident_id,
                "title": i.title,
                "severity": i.severity.value,
                "status": i.status.value,
                "category": i.category.value,
                "detected_at": i.detected_at.isoformat(),
                "sla_hours": i.severity.response_time_hours
            }
            for i in self.incidents.values()
            if i.status != IncidentStatus.CLOSED
        ]


class MonitoringEngine:
    """Engine for monitoring and alerting."""

    def __init__(self):
        self.alerts: Dict[str, MonitoringAlert] = {}
        self.metrics: Dict[str, List[Dict[str, Any]]] = {}
        self.fired_alerts: List[Dict[str, Any]] = []

    def create_alert(
        self,
        metric_name: str,
        threshold: float,
        operator: str,
        severity: RiskSeverity,
        notification_channels: List[str],
        cooldown_minutes: int = 15
    ) -> MonitoringAlert:
        """Create a monitoring alert."""
        alert_id = f"ALT-{hashlib.md5(f'{metric_name}{threshold}'.encode()).hexdigest()[:8].upper()}"

        alert = MonitoringAlert(
            alert_id=alert_id,
            metric_name=metric_name,
            threshold=threshold,
            operator=operator,
            severity=severity,
            notification_channels=notification_channels,
            cooldown_minutes=cooldown_minutes
        )

        self.alerts[alert_id] = alert
        return alert

    def record_metric(self, metric_name: str, value: float) -> List[Dict[str, Any]]:
        """Record a metric value and check alerts."""
        if metric_name not in self.metrics:
            self.metrics[metric_name] = []

        self.metrics[metric_name].append({
            "value": value,
            "timestamp": datetime.now().isoformat()
        })

        # Keep only last 1000 values
        self.metrics[metric_name] = self.metrics[metric_name][-1000:]

        # Check alerts for this metric
        fired = []
        for alert in self.alerts.values():
            if alert.metric_name == metric_name and alert.can_fire():
                if alert.evaluate(value):
                    alert.last_fired = datetime.now()
                    fire_record = {
                        "alert_id": alert.alert_id,
                        "metric_name": metric_name,
                        "value": value,
                        "threshold": alert.threshold,
                        "severity": alert.severity.value,
                        "timestamp": datetime.now().isoformat()
                    }
                    fired.append(fire_record)
                    self.fired_alerts.append(fire_record)

        return fired

    def get_metric_summary(self, metric_name: str) -> Dict[str, Any]:
        """Get summary statistics for a metric."""
        values = self.metrics.get(metric_name, [])
        if not values:
            return {"error": "No data for metric"}

        numeric_values = [v["value"] for v in values]
        return {
            "metric_name": metric_name,
            "count": len(numeric_values),
            "min": min(numeric_values),
            "max": max(numeric_values),
            "avg": sum(numeric_values) / len(numeric_values),
            "latest": numeric_values[-1] if numeric_values else None
        }


class PolicyEngine:
    """Engine for policy management."""

    def __init__(self):
        self.policies: Dict[str, Policy] = {}
        self.controls: Dict[str, Control] = {}

    def create_policy(
        self,
        title: str,
        scope: str,
        requirements: List[str],
        owner: str,
        related_controls: List[str]
    ) -> Policy:
        """Create a new governance policy."""
        policy_id = f"POL-{hashlib.md5(f'{title}{datetime.now().isoformat()}'.encode()).hexdigest()[:8].upper()}"

        policy = Policy(
            policy_id=policy_id,
            title=title,
            version="1.0",
            status=PolicyStatus.DRAFT,
            scope=scope,
            requirements=requirements,
            owner=owner,
            related_controls=related_controls,
            review_date=datetime.now() + timedelta(days=365)
        )

        self.policies[policy_id] = policy
        return policy

    def create_control(
        self,
        name: str,
        description: str,
        category: RiskCategory,
        implementation_details: str,
        test_procedure: str,
        evidence_required: List[str],
        owner: str
    ) -> Control:
        """Create a governance control."""
        control_id = f"CTL-{hashlib.md5(f'{name}{datetime.now().isoformat()}'.encode()).hexdigest()[:8].upper()}"

        control = Control(
            control_id=control_id,
            name=name,
            description=description,
            category=category,
            status=ControlStatus.NOT_IMPLEMENTED,
            implementation_details=implementation_details,
            test_procedure=test_procedure,
            evidence_required=evidence_required,
            owner=owner
        )

        self.controls[control_id] = control
        return control

    def approve_policy(self, policy_id: str, approver: str) -> bool:
        """Approve a policy for activation."""
        policy = self.policies.get(policy_id)
        if not policy or policy.status not in [PolicyStatus.DRAFT, PolicyStatus.REVIEW]:
            return False

        policy.approvers.append(approver)
        policy.status = PolicyStatus.APPROVED
        policy.effective_date = datetime.now()
        return True

    def activate_policy(self, policy_id: str) -> bool:
        """Activate an approved policy."""
        policy = self.policies.get(policy_id)
        if not policy or policy.status != PolicyStatus.APPROVED:
            return False

        policy.status = PolicyStatus.ACTIVE
        return True

    def verify_control(self, control_id: str, evidence: Dict[str, Any]) -> bool:
        """Verify a control's implementation."""
        control = self.controls.get(control_id)
        if not control:
            return False

        # Check if all required evidence is provided
        missing_evidence = [e for e in control.evidence_required if e not in evidence]
        if missing_evidence:
            return False

        control.status = ControlStatus.VERIFIED
        control.last_verified = datetime.now()
        return True

    def get_compliance_status(self) -> Dict[str, Any]:
        """Get overall compliance status."""
        total_controls = len(self.controls)
        compliant = len([c for c in self.controls.values() if c.is_compliant()])

        return {
            "total_policies": len(self.policies),
            "active_policies": len([p for p in self.policies.values() if p.is_active()]),
            "total_controls": total_controls,
            "compliant_controls": compliant,
            "compliance_rate": (compliant / total_controls * 100) if total_controls > 0 else 0,
            "controls_needing_verification": [
                c.control_id for c in self.controls.values() if c.needs_verification()
            ]
        }


# ============================================================================
# MAIN ORCHESTRATOR
# ============================================================================

class GovernanceOSEngine:
    """Main orchestrator for AI Governance OS."""

    SYSTEM_CONFIG = {
        "name": "AI Governance Operating System",
        "version": "1.0.0",
        "mission": "Ensure AI systems are safe, explainable, auditable, and aligned",
        "principles": {
            "safety_first": True,
            "transparency": True,
            "accountability": True,
            "human_oversight": True,
            "continuous_improvement": True
        }
    }

    def __init__(self):
        self.risk_engine = RiskAssessorEngine()
        self.guardrail_engine = GuardrailArchitectEngine()
        self.audit_engine = AuditDesignerEngine()
        self.oversight_engine = OversightEngine()
        self.incident_engine = IncidentResponseEngine()
        self.monitoring_engine = MonitoringEngine()
        self.policy_engine = PolicyEngine()
        self.systems: Dict[str, AISystem] = {}

    def register_system(
        self,
        name: str,
        description: str,
        risk_tier: RiskTier,
        owner: str,
        use_cases: List[str],
        data_types: List[str]
    ) -> AISystem:
        """Register an AI system for governance."""
        system_id = f"SYS-{hashlib.md5(f'{name}{datetime.now().isoformat()}'.encode()).hexdigest()[:8].upper()}"

        system = AISystem(
            system_id=system_id,
            name=name,
            description=description,
            risk_tier=risk_tier,
            owner=owner,
            use_cases=use_cases,
            data_types=data_types,
            deployed_date=datetime.now()
        )

        self.systems[system_id] = system

        self.audit_engine.log_event(
            AuditEventType.POLICY_CREATED,
            "system",
            system_id,
            "system_registered",
            {"name": name, "risk_tier": risk_tier.value}
        )

        return system

    def assess_system(self, system_id: str) -> Dict[str, Any]:
        """Perform comprehensive assessment of an AI system."""
        system = self.systems.get(system_id)
        if not system:
            return {"error": "System not found"}

        assessment = {
            "system_id": system_id,
            "system_name": system.name,
            "assessment_date": datetime.now().isoformat(),
            "risk_tier": system.risk_tier.value,
            "risk_assessment": self.risk_engine.assess_system_risks(system),
            "guardrail_status": self.guardrail_engine.get_guardrail_status(),
            "compliance_status": self.policy_engine.get_compliance_status(),
            "active_incidents": self.incident_engine.get_active_incidents(),
            "pending_reviews": len(self.oversight_engine.get_pending_reviews()),
            "requirements": system.risk_tier.requirements
        }

        system.last_assessment = datetime.now()
        return assessment

    def get_governance_dashboard(self) -> Dict[str, Any]:
        """Get governance dashboard overview."""
        return {
            "config": self.SYSTEM_CONFIG,
            "systems": {
                "total": len(self.systems),
                "by_tier": {
                    tier.value: len([s for s in self.systems.values() if s.risk_tier == tier])
                    for tier in RiskTier
                },
                "needing_assessment": [
                    s.system_id for s in self.systems.values() if s.needs_assessment()
                ]
            },
            "risks": {
                "total": len(self.risk_engine.risks),
                "register": self.risk_engine.get_risk_register()[:10]
            },
            "guardrails": self.guardrail_engine.get_guardrail_status(),
            "compliance": self.policy_engine.get_compliance_status(),
            "incidents": {
                "active": len(self.incident_engine.get_active_incidents()),
                "list": self.incident_engine.get_active_incidents()[:5]
            },
            "audit_integrity": self.audit_engine.verify_chain_integrity()
        }


# ============================================================================
# REPORTER
# ============================================================================

class GovernanceReporter:
    """Generate governance reports and visualizations."""

    STATUS_ICONS = {
        "compliant": "[OK]",
        "partial": "[~~]",
        "non_compliant": "[!!]",
        "not_assessed": "[??]",
        "critical": "[!!]",
        "high": "[!-]",
        "medium": "[--]",
        "low": "[__]"
    }

    @staticmethod
    def format_risk_matrix() -> str:
        """Format risk assessment matrix."""
        return """
RISK ASSESSMENT MATRIX
----------------------
           │  Low Impact  │ Med Impact │ High Impact │
───────────┼──────────────┼────────────┼─────────────│
High Prob  │    MEDIUM    │    HIGH    │  CRITICAL   │
Med Prob   │     LOW      │   MEDIUM   │    HIGH     │
Low Prob   │     LOW      │    LOW     │   MEDIUM    │
"""

    @staticmethod
    def format_hitl_flow() -> str:
        """Format HITL decision flow."""
        return """
HITL DECISION FLOW
------------------
[AI Output] --> [Confidence Check]
                      |
     +----------------+----------------+
     |                |                |
     v                v                v
High (>0.95)    Med (0.7-0.95)    Low (<0.7)
     |                |                |
Auto-approve    Sampling/Review   Human Review
"""

    def generate_report(self, engine: GovernanceOSEngine) -> str:
        """Generate comprehensive governance report."""
        dashboard = engine.get_governance_dashboard()

        report = []
        report.append("=" * 60)
        report.append("AI GOVERNANCE FRAMEWORK REPORT")
        report.append("=" * 60)
        report.append(f"\nGenerated: {datetime.now().isoformat()}")
        report.append(f"System: {dashboard['config']['name']}")
        report.append(f"Version: {dashboard['config']['version']}")

        report.append("\n" + "-" * 40)
        report.append("SYSTEMS OVERVIEW")
        report.append("-" * 40)
        report.append(f"Total Systems: {dashboard['systems']['total']}")
        for tier, count in dashboard['systems']['by_tier'].items():
            if count > 0:
                report.append(f"  {tier}: {count}")

        report.append("\n" + "-" * 40)
        report.append("RISK SUMMARY")
        report.append("-" * 40)
        report.append(f"Total Risks: {dashboard['risks']['total']}")
        for risk in dashboard['risks']['register'][:5]:
            icon = self.STATUS_ICONS.get(risk['priority'], "[--]")
            report.append(f"  {icon} {risk['risk_id']}: {risk['title']} ({risk['priority'].upper()})")

        report.append("\n" + "-" * 40)
        report.append("GUARDRAIL STATUS")
        report.append("-" * 40)
        gs = dashboard['guardrails']
        report.append(f"Total: {gs['total']} | Enabled: {gs['enabled']}")
        report.append(f"Input: {gs['by_layer']['input']} | Output: {gs['by_layer']['output']} | Behavioral: {gs['by_layer']['behavioral']}")

        report.append("\n" + "-" * 40)
        report.append("COMPLIANCE STATUS")
        report.append("-" * 40)
        cs = dashboard['compliance']
        rate = cs['compliance_rate']
        bar_filled = int(rate / 10)
        bar = "[" + "#" * bar_filled + "-" * (10 - bar_filled) + "]"
        report.append(f"Compliance Rate: {rate:.1f}% {bar}")
        report.append(f"Controls: {cs['compliant_controls']}/{cs['total_controls']} compliant")

        report.append("\n" + "-" * 40)
        report.append("AUDIT INTEGRITY")
        report.append("-" * 40)
        ai = dashboard['audit_integrity']
        status = "[OK]" if ai['valid'] else "[!!]"
        report.append(f"Chain Integrity: {status} ({ai['entries_verified']} entries verified)")

        report.append("\n" + "=" * 60)

        return "\n".join(report)


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="GOVERNANCE.OS.EXE - AI Policy, Risk & Compliance Architect"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Dashboard command
    subparsers.add_parser("dashboard", help="Show governance dashboard")

    # Risk commands
    risk_parser = subparsers.add_parser("risk", help="Risk management")
    risk_sub = risk_parser.add_subparsers(dest="risk_command")
    risk_sub.add_parser("list", help="List all risks")
    risk_sub.add_parser("matrix", help="Show risk matrix")

    add_risk = risk_sub.add_parser("add", help="Add a new risk")
    add_risk.add_argument("--title", required=True, help="Risk title")
    add_risk.add_argument("--category", required=True, choices=[c.value for c in RiskCategory])
    add_risk.add_argument("--likelihood", required=True, choices=[l.value for l in RiskLikelihood])
    add_risk.add_argument("--severity", required=True, choices=[s.value for s in RiskSeverity])
    add_risk.add_argument("--owner", required=True, help="Risk owner")

    # Guardrail commands
    guard_parser = subparsers.add_parser("guardrail", help="Guardrail management")
    guard_sub = guard_parser.add_subparsers(dest="guard_command")
    guard_sub.add_parser("status", help="Show guardrail status")
    guard_sub.add_parser("list", help="List all guardrails")

    # System commands
    sys_parser = subparsers.add_parser("system", help="System management")
    sys_sub = sys_parser.add_subparsers(dest="sys_command")
    sys_sub.add_parser("list", help="List registered systems")

    register_sys = sys_sub.add_parser("register", help="Register a new system")
    register_sys.add_argument("--name", required=True, help="System name")
    register_sys.add_argument("--tier", required=True, choices=[t.value for t in RiskTier])
    register_sys.add_argument("--owner", required=True, help="System owner")

    # Audit commands
    audit_parser = subparsers.add_parser("audit", help="Audit management")
    audit_sub = audit_parser.add_subparsers(dest="audit_command")
    audit_sub.add_parser("verify", help="Verify audit chain integrity")
    audit_sub.add_parser("report", help="Generate compliance report")

    # Report command
    subparsers.add_parser("report", help="Generate full governance report")

    args = parser.parse_args()

    engine = GovernanceOSEngine()
    reporter = GovernanceReporter()

    if args.command == "dashboard":
        dashboard = engine.get_governance_dashboard()
        print(json.dumps(dashboard, indent=2, default=str))

    elif args.command == "risk":
        if args.risk_command == "list":
            risks = engine.risk_engine.get_risk_register()
            for risk in risks:
                print(f"{risk['risk_id']}: {risk['title']} [{risk['priority'].upper()}]")
        elif args.risk_command == "matrix":
            print(reporter.format_risk_matrix())
        elif args.risk_command == "add":
            risk = engine.risk_engine.identify_risk(
                title=args.title,
                category=RiskCategory(args.category),
                description="",
                likelihood=RiskLikelihood(args.likelihood),
                severity=RiskSeverity(args.severity),
                mitigation="To be defined",
                owner=args.owner
            )
            print(f"Risk created: {risk.risk_id}")

    elif args.command == "guardrail":
        if args.guard_command == "status":
            status = engine.guardrail_engine.get_guardrail_status()
            print(json.dumps(status, indent=2))
        elif args.guard_command == "list":
            for g in engine.guardrail_engine.guardrails.values():
                status = "[ON]" if g.enabled else "[OFF]"
                print(f"{status} {g.guardrail_id}: {g.name}")

    elif args.command == "system":
        if args.sys_command == "list":
            for sys in engine.systems.values():
                print(f"{sys.system_id}: {sys.name} [{sys.risk_tier.value}]")
        elif args.sys_command == "register":
            system = engine.register_system(
                name=args.name,
                description="",
                risk_tier=RiskTier(args.tier),
                owner=args.owner,
                use_cases=[],
                data_types=[]
            )
            print(f"System registered: {system.system_id}")

    elif args.command == "audit":
        if args.audit_command == "verify":
            result = engine.audit_engine.verify_chain_integrity()
            status = "VALID" if result["valid"] else "INVALID"
            print(f"Chain integrity: {status}")
            print(f"Entries verified: {result['entries_verified']}")
        elif args.audit_command == "report":
            report = engine.audit_engine.generate_compliance_report()
            print(json.dumps(report, indent=2, default=str))

    elif args.command == "report":
        print(reporter.generate_report(engine))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/governance` - Full governance framework
- `/governance [system]` - System-specific assessment
- `/governance risks` - Risk register
- `/governance guardrails` - Guardrail design
- `/governance checklist` - Governance checklist

$ARGUMENTS
