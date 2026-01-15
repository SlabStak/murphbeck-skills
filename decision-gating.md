# DECISION.GATING.OS.EXE - Regulated Approval & Risk Gate Controller

You are DECISION.GATING.OS.EXE — a regulated approval and risk gate controller.

MISSION
Gate high-risk decisions behind appropriate approvals, reviews, or multi-party consent. No bypass for critical decisions.

---

## CAPABILITIES

### DecisionClassifier.MOD
- Risk categorization
- Impact assessment
- Reversibility analysis
- Sensitivity scoring
- Category assignment

### ThresholdEngine.MOD
- Risk threshold definition
- Trigger criteria
- Escalation rules
- Override conditions
- Exception handling

### ApprovalChain.MOD
- Workflow design
- Authority mapping
- Delegation rules
- Timeout handling
- Notification triggers

### EvidenceManager.MOD
- Documentation requirements
- Artifact collection
- Audit trail creation
- Record retention
- Compliance mapping

---

## SYSTEM IMPLEMENTATION

```python
"""
DECISION.GATING.OS.EXE - Regulated Approval Engine
Production-ready decision gating and approval workflow system
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Callable
import hashlib
import json


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class RiskLevel(Enum):
    """Risk levels for decisions."""
    LEVEL_1_LOW = "level_1_low"
    LEVEL_2_MEDIUM = "level_2_medium"
    LEVEL_3_HIGH = "level_3_high"
    LEVEL_4_CRITICAL = "level_4_critical"
    LEVEL_5_RESTRICTED = "level_5_restricted"

    @property
    def approval_required(self) -> str:
        """Required approval level."""
        approvals = {
            "level_1_low": "SELF_SERVICE",
            "level_2_medium": "MANAGER",
            "level_3_high": "SENIOR_LEADERSHIP",
            "level_4_critical": "MULTI_PARTY",
            "level_5_restricted": "BOARD_EXECUTIVE_LEGAL"
        }
        return approvals.get(self.value, "MANAGER")

    @property
    def sla_hours(self) -> int:
        """SLA for approval in hours."""
        slas = {
            "level_1_low": 0,
            "level_2_medium": 24,
            "level_3_high": 48,
            "level_4_critical": 72,
            "level_5_restricted": 168
        }
        return slas.get(self.value, 24)

    @property
    def evidence_requirements(self) -> list:
        """Required evidence types."""
        base = []
        if self.value in ["level_3_high", "level_4_critical", "level_5_restricted"]:
            base = ["business_justification", "impact_analysis", "risk_assessment",
                   "alternatives_considered", "rollback_plan"]
        if self.value in ["level_4_critical", "level_5_restricted"]:
            base.extend(["compliance_review", "financial_impact", "stakeholder_notification"])
        if self.value == "level_5_restricted":
            base.extend(["executive_summary", "board_notification", "external_counsel"])
        return base

    @property
    def can_auto_approve(self) -> bool:
        """Whether auto-approval is allowed."""
        return self.value == "level_1_low"


class DecisionCategory(Enum):
    """Categories of decisions requiring gating."""
    FINANCIAL = "financial"
    DATA_ACCESS = "data_access"
    SYSTEM_CHANGE = "system_change"
    PERSONNEL = "personnel"
    COMPLIANCE = "compliance"
    SECURITY = "security"
    CUSTOMER_IMPACT = "customer_impact"
    MODEL_DEPLOYMENT = "model_deployment"
    VENDOR = "vendor"
    LEGAL = "legal"

    @property
    def default_risk_level(self) -> RiskLevel:
        """Default risk level for category."""
        defaults = {
            "financial": RiskLevel.LEVEL_3_HIGH,
            "data_access": RiskLevel.LEVEL_3_HIGH,
            "system_change": RiskLevel.LEVEL_2_MEDIUM,
            "personnel": RiskLevel.LEVEL_3_HIGH,
            "compliance": RiskLevel.LEVEL_4_CRITICAL,
            "security": RiskLevel.LEVEL_4_CRITICAL,
            "customer_impact": RiskLevel.LEVEL_3_HIGH,
            "model_deployment": RiskLevel.LEVEL_3_HIGH,
            "vendor": RiskLevel.LEVEL_2_MEDIUM,
            "legal": RiskLevel.LEVEL_4_CRITICAL
        }
        return defaults.get(self.value, RiskLevel.LEVEL_2_MEDIUM)

    @property
    def requires_legal_review(self) -> bool:
        """Whether legal review is required."""
        legal_required = {"compliance", "legal", "vendor", "data_access"}
        return self.value in legal_required

    @property
    def typical_approvers(self) -> list:
        """Typical approver roles for category."""
        approvers = {
            "financial": ["finance_director", "cfo"],
            "data_access": ["data_protection_officer", "security_lead"],
            "system_change": ["engineering_manager", "cto"],
            "personnel": ["hr_director", "department_head"],
            "compliance": ["compliance_officer", "legal_counsel"],
            "security": ["ciso", "security_lead"],
            "customer_impact": ["product_lead", "customer_success_director"],
            "model_deployment": ["ml_lead", "ethics_officer"],
            "vendor": ["procurement_lead", "legal_counsel"],
            "legal": ["general_counsel", "ceo"]
        }
        return approvers.get(self.value, ["manager"])


class ApprovalStatus(Enum):
    """Status of an approval request."""
    DRAFT = "draft"
    PENDING_SUBMISSION = "pending_submission"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    ESCALATED = "escalated"
    EXPIRED = "expired"
    WITHDRAWN = "withdrawn"

    @property
    def is_terminal(self) -> bool:
        """Whether status is terminal."""
        terminal = {"approved", "rejected", "expired", "withdrawn"}
        return self.value in terminal

    @property
    def allows_modification(self) -> bool:
        """Whether request can be modified."""
        modifiable = {"draft", "pending_submission", "rejected"}
        return self.value in modifiable

    @property
    def icon(self) -> str:
        """Status icon."""
        icons = {
            "draft": "📝",
            "pending_submission": "⏳",
            "submitted": "📤",
            "under_review": "🔍",
            "pending_approval": "⏰",
            "approved": "✅",
            "rejected": "❌",
            "escalated": "⬆️",
            "expired": "⏰",
            "withdrawn": "↩️"
        }
        return icons.get(self.value, "❓")


class EscalationTrigger(Enum):
    """Triggers for escalation."""
    SLA_BREACH = "sla_breach"
    RISK_INCREASE = "risk_increase"
    MANUAL_REQUEST = "manual_request"
    APPROVER_UNAVAILABLE = "approver_unavailable"
    CONFLICT_OF_INTEREST = "conflict_of_interest"
    POLICY_EXCEPTION = "policy_exception"
    THRESHOLD_EXCEEDED = "threshold_exceeded"

    @property
    def auto_escalate(self) -> bool:
        """Whether to auto-escalate."""
        auto = {"sla_breach", "approver_unavailable", "threshold_exceeded"}
        return self.value in auto

    @property
    def notification_priority(self) -> str:
        """Notification priority."""
        priorities = {
            "sla_breach": "HIGH",
            "risk_increase": "CRITICAL",
            "manual_request": "NORMAL",
            "approver_unavailable": "HIGH",
            "conflict_of_interest": "HIGH",
            "policy_exception": "CRITICAL",
            "threshold_exceeded": "CRITICAL"
        }
        return priorities.get(self.value, "NORMAL")


class OverrideType(Enum):
    """Types of approval overrides."""
    EMERGENCY = "emergency"
    EXECUTIVE = "executive"
    DELEGATION = "delegation"
    TECHNICAL = "technical"
    TEMPORAL = "temporal"

    @property
    def requires_post_review(self) -> bool:
        """Whether post-review is required."""
        return self.value in ["emergency", "executive"]

    @property
    def max_duration_hours(self) -> int:
        """Maximum override duration."""
        durations = {
            "emergency": 24,
            "executive": 72,
            "delegation": 168,
            "technical": 4,
            "temporal": 48
        }
        return durations.get(self.value, 24)

    @property
    def required_authority(self) -> str:
        """Required authority for override."""
        authorities = {
            "emergency": "INCIDENT_COMMANDER",
            "executive": "C_LEVEL",
            "delegation": "ORIGINAL_APPROVER",
            "technical": "SYSTEM_ADMIN",
            "temporal": "MANAGER"
        }
        return authorities.get(self.value, "MANAGER")


class EvidenceType(Enum):
    """Types of evidence for decisions."""
    BUSINESS_JUSTIFICATION = "business_justification"
    IMPACT_ANALYSIS = "impact_analysis"
    RISK_ASSESSMENT = "risk_assessment"
    ALTERNATIVES_ANALYSIS = "alternatives_analysis"
    ROLLBACK_PLAN = "rollback_plan"
    COMPLIANCE_REVIEW = "compliance_review"
    LEGAL_OPINION = "legal_opinion"
    FINANCIAL_ANALYSIS = "financial_analysis"
    STAKEHOLDER_SIGN_OFF = "stakeholder_sign_off"
    TECHNICAL_REVIEW = "technical_review"

    @property
    def template_available(self) -> bool:
        """Whether template is available."""
        templated = {
            "business_justification", "impact_analysis", "risk_assessment",
            "rollback_plan", "financial_analysis"
        }
        return self.value in templated

    @property
    def retention_years(self) -> int:
        """Retention period in years."""
        retention = {
            "legal_opinion": 10,
            "compliance_review": 7,
            "financial_analysis": 7,
            "stakeholder_sign_off": 5
        }
        return retention.get(self.value, 3)


class WorkflowStage(Enum):
    """Workflow stages for approval."""
    INITIATION = "initiation"
    EVIDENCE_COLLECTION = "evidence_collection"
    INITIAL_REVIEW = "initial_review"
    ROUTING = "routing"
    APPROVAL_QUEUE = "approval_queue"
    REVIEW = "review"
    DECISION = "decision"
    EXECUTION = "execution"
    AUDIT_LOG = "audit_log"

    @property
    def next_stage(self) -> Optional[str]:
        """Next stage in workflow."""
        sequence = [
            "initiation", "evidence_collection", "initial_review",
            "routing", "approval_queue", "review", "decision",
            "execution", "audit_log"
        ]
        try:
            idx = sequence.index(self.value)
            return sequence[idx + 1] if idx < len(sequence) - 1 else None
        except ValueError:
            return None

    @property
    def sla_hours(self) -> int:
        """SLA for stage completion."""
        slas = {
            "initiation": 0,
            "evidence_collection": 24,
            "initial_review": 4,
            "routing": 1,
            "approval_queue": 0,
            "review": 24,
            "decision": 4,
            "execution": 24,
            "audit_log": 1
        }
        return slas.get(self.value, 4)


class QuorumType(Enum):
    """Types of quorum for multi-party approval."""
    UNANIMOUS = "unanimous"
    MAJORITY = "majority"
    ANY_ONE = "any_one"
    WEIGHTED = "weighted"
    SEQUENTIAL = "sequential"

    @property
    def description(self) -> str:
        """Quorum description."""
        descriptions = {
            "unanimous": "All approvers must approve",
            "majority": "More than 50% must approve",
            "any_one": "Any single approver can approve",
            "weighted": "Weighted vote based on authority",
            "sequential": "Each approver in sequence"
        }
        return descriptions.get(self.value, "")


class AuditAction(Enum):
    """Actions to audit."""
    REQUEST_CREATED = "request_created"
    REQUEST_SUBMITTED = "request_submitted"
    EVIDENCE_ADDED = "evidence_added"
    REVIEW_STARTED = "review_started"
    APPROVAL_GRANTED = "approval_granted"
    APPROVAL_DENIED = "approval_denied"
    ESCALATION_TRIGGERED = "escalation_triggered"
    OVERRIDE_INVOKED = "override_invoked"
    REQUEST_EXECUTED = "request_executed"
    REQUEST_EXPIRED = "request_expired"

    @property
    def severity(self) -> str:
        """Audit severity level."""
        severities = {
            "override_invoked": "HIGH",
            "approval_denied": "MEDIUM",
            "escalation_triggered": "MEDIUM",
            "approval_granted": "LOW"
        }
        return severities.get(self.value, "INFO")


# ============================================================
# DATA CLASSES WITH BUSINESS LOGIC
# ============================================================

@dataclass
class Decision:
    """A decision requiring approval."""
    decision_id: str
    title: str
    description: str
    category: DecisionCategory
    risk_level: RiskLevel
    requestor: str
    created_at: datetime = field(default_factory=datetime.now)
    reversibility: str = "REVERSIBLE"
    impact_scope: str = ""
    estimated_value: float = 0.0
    urgency: str = "NORMAL"

    def get_required_approvers(self) -> list:
        """Get required approvers based on risk level."""
        return self.category.typical_approvers

    def get_evidence_requirements(self) -> list:
        """Get evidence requirements."""
        return self.risk_level.evidence_requirements

    def get_approval_sla(self) -> datetime:
        """Get approval SLA deadline."""
        hours = self.risk_level.sla_hours
        return self.created_at + timedelta(hours=hours)

    def requires_multi_party(self) -> bool:
        """Check if multi-party approval required."""
        return self.risk_level.value in ["level_4_critical", "level_5_restricted"]


@dataclass
class ApprovalRequest:
    """An approval request for a decision."""
    request_id: str
    decision: Decision
    status: ApprovalStatus = ApprovalStatus.DRAFT
    submitted_at: Optional[datetime] = None
    approvers: list = field(default_factory=list)
    evidence: list = field(default_factory=list)
    comments: list = field(default_factory=list)
    current_stage: WorkflowStage = WorkflowStage.INITIATION
    quorum_type: QuorumType = QuorumType.ANY_ONE

    def submit(self) -> bool:
        """Submit request for approval."""
        if self.status != ApprovalStatus.DRAFT:
            return False

        # Validate evidence
        required = self.decision.get_evidence_requirements()
        provided = [e.evidence_type.value for e in self.evidence]
        missing = set(required) - set(provided)

        if missing:
            return False

        self.status = ApprovalStatus.SUBMITTED
        self.submitted_at = datetime.now()
        self.current_stage = WorkflowStage.INITIAL_REVIEW
        return True

    def is_sla_breached(self) -> bool:
        """Check if SLA is breached."""
        if not self.submitted_at:
            return False
        deadline = self.decision.get_approval_sla()
        return datetime.now() > deadline

    def get_approval_progress(self) -> dict:
        """Get approval progress."""
        total = len(self.approvers)
        approved = sum(1 for a in self.approvers if a.get("decision") == "APPROVED")
        rejected = sum(1 for a in self.approvers if a.get("decision") == "REJECTED")

        return {
            "total_approvers": total,
            "approved": approved,
            "rejected": rejected,
            "pending": total - approved - rejected,
            "percent_complete": (approved + rejected) / total * 100 if total > 0 else 0
        }

    def check_quorum(self) -> Optional[str]:
        """Check if quorum is reached."""
        progress = self.get_approval_progress()

        if self.quorum_type == QuorumType.UNANIMOUS:
            if progress["rejected"] > 0:
                return "REJECTED"
            if progress["approved"] == progress["total_approvers"]:
                return "APPROVED"
        elif self.quorum_type == QuorumType.MAJORITY:
            half = progress["total_approvers"] / 2
            if progress["approved"] > half:
                return "APPROVED"
            if progress["rejected"] > half:
                return "REJECTED"
        elif self.quorum_type == QuorumType.ANY_ONE:
            if progress["approved"] >= 1:
                return "APPROVED"
            if progress["rejected"] == progress["total_approvers"]:
                return "REJECTED"

        return None


@dataclass
class Evidence:
    """Evidence for a decision."""
    evidence_id: str
    request_id: str
    evidence_type: EvidenceType
    title: str
    content: str
    attachments: list = field(default_factory=list)
    submitted_by: str = ""
    submitted_at: datetime = field(default_factory=datetime.now)
    validated: bool = False

    def get_checksum(self) -> str:
        """Generate evidence checksum."""
        content = f"{self.evidence_id}:{self.content}:{self.submitted_at.isoformat()}"
        return hashlib.sha256(content.encode()).hexdigest()[:12]

    def get_retention_expiry(self) -> datetime:
        """Get retention expiry date."""
        years = self.evidence_type.retention_years
        return self.submitted_at + timedelta(days=years * 365)


@dataclass
class Approver:
    """An approver in the approval chain."""
    approver_id: str
    user_id: str
    role: str
    authority_level: int = 1
    delegation_allowed: bool = True
    auto_approve_threshold: float = 0.0
    available: bool = True

    def can_approve(self, decision: Decision) -> bool:
        """Check if approver can approve decision."""
        required_authority = {
            "level_1_low": 1,
            "level_2_medium": 2,
            "level_3_high": 3,
            "level_4_critical": 4,
            "level_5_restricted": 5
        }
        required = required_authority.get(decision.risk_level.value, 5)
        return self.authority_level >= required

    def can_delegate_to(self, other: 'Approver') -> bool:
        """Check if can delegate to another approver."""
        return (
            self.delegation_allowed and
            other.authority_level >= self.authority_level - 1
        )


@dataclass
class ApprovalDecision:
    """A decision made by an approver."""
    decision_id: str
    request_id: str
    approver_id: str
    decision: str  # APPROVED, REJECTED, ESCALATED
    rationale: str
    conditions: list = field(default_factory=list)
    decided_at: datetime = field(default_factory=datetime.now)

    def is_conditional(self) -> bool:
        """Check if approval is conditional."""
        return len(self.conditions) > 0 and self.decision == "APPROVED"

    def get_audit_record(self) -> dict:
        """Get audit record for decision."""
        return {
            "decision_id": self.decision_id,
            "request_id": self.request_id,
            "approver": self.approver_id,
            "decision": self.decision,
            "timestamp": self.decided_at.isoformat(),
            "conditional": self.is_conditional()
        }


@dataclass
class Override:
    """An approval override."""
    override_id: str
    request_id: str
    override_type: OverrideType
    invoked_by: str
    reason: str
    expires_at: datetime = field(default_factory=datetime.now)
    reviewed: bool = False
    review_notes: str = ""

    def is_expired(self) -> bool:
        """Check if override is expired."""
        return datetime.now() > self.expires_at

    def requires_review(self) -> bool:
        """Check if post-review is required."""
        return self.override_type.requires_post_review and not self.reviewed


@dataclass
class Escalation:
    """An escalation record."""
    escalation_id: str
    request_id: str
    trigger: EscalationTrigger
    from_level: str
    to_level: str
    escalated_at: datetime = field(default_factory=datetime.now)
    resolved: bool = False
    resolution_notes: str = ""

    def get_escalation_path(self) -> str:
        """Get escalation path description."""
        return f"{self.from_level} → {self.to_level}"


@dataclass
class AuditEntry:
    """An audit trail entry."""
    entry_id: str
    action: AuditAction
    request_id: str
    user: str
    timestamp: datetime = field(default_factory=datetime.now)
    details: dict = field(default_factory=dict)
    previous_state: str = ""
    new_state: str = ""
    checksum: str = ""

    def __post_init__(self):
        """Generate checksum after init."""
        if not self.checksum:
            content = f"{self.entry_id}:{self.action.value}:{self.timestamp.isoformat()}"
            self.checksum = hashlib.sha256(content.encode()).hexdigest()[:12]

    def to_record(self) -> dict:
        """Convert to audit record."""
        return {
            "id": self.entry_id,
            "action": self.action.value,
            "request": self.request_id,
            "user": self.user,
            "timestamp": self.timestamp.isoformat(),
            "severity": self.action.severity,
            "checksum": self.checksum
        }


# ============================================================
# ENGINE CLASSES
# ============================================================

class DecisionClassifierEngine:
    """Classifies decisions and assesses risk."""

    RISK_FACTORS = {
        "financial_impact": {
            "thresholds": [1000, 10000, 100000, 1000000],
            "levels": [
                RiskLevel.LEVEL_1_LOW,
                RiskLevel.LEVEL_2_MEDIUM,
                RiskLevel.LEVEL_3_HIGH,
                RiskLevel.LEVEL_4_CRITICAL,
                RiskLevel.LEVEL_5_RESTRICTED
            ]
        },
        "user_impact": {
            "thresholds": [10, 100, 1000, 10000],
            "levels": [
                RiskLevel.LEVEL_1_LOW,
                RiskLevel.LEVEL_2_MEDIUM,
                RiskLevel.LEVEL_3_HIGH,
                RiskLevel.LEVEL_4_CRITICAL,
                RiskLevel.LEVEL_5_RESTRICTED
            ]
        }
    }

    def __init__(self):
        self.classification_history: list = []

    def classify_decision(
        self,
        title: str,
        description: str,
        category: DecisionCategory,
        requestor: str,
        financial_impact: float = 0,
        user_impact: int = 0,
        reversibility: str = "REVERSIBLE"
    ) -> Decision:
        """Classify a decision and determine risk level."""
        # Start with category default
        risk_level = category.default_risk_level

        # Adjust based on financial impact
        for i, threshold in enumerate(self.RISK_FACTORS["financial_impact"]["thresholds"]):
            if financial_impact >= threshold:
                potential_level = self.RISK_FACTORS["financial_impact"]["levels"][i + 1]
                if potential_level.value > risk_level.value:
                    risk_level = potential_level

        # Adjust based on user impact
        for i, threshold in enumerate(self.RISK_FACTORS["user_impact"]["thresholds"]):
            if user_impact >= threshold:
                potential_level = self.RISK_FACTORS["user_impact"]["levels"][i + 1]
                if potential_level.value > risk_level.value:
                    risk_level = potential_level

        # Adjust for irreversibility
        if reversibility == "IRREVERSIBLE":
            level_values = list(RiskLevel)
            current_idx = level_values.index(risk_level)
            if current_idx < len(level_values) - 1:
                risk_level = level_values[current_idx + 1]

        decision = Decision(
            decision_id=f"DEC-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            title=title,
            description=description,
            category=category,
            risk_level=risk_level,
            requestor=requestor,
            reversibility=reversibility,
            estimated_value=financial_impact
        )

        self.classification_history.append({
            "decision_id": decision.decision_id,
            "risk_level": risk_level.value,
            "timestamp": datetime.now().isoformat()
        })

        return decision

    def assess_impact(self, decision: Decision) -> dict:
        """Assess impact of a decision."""
        return {
            "category_impact": decision.category.value,
            "risk_level": decision.risk_level.value,
            "requires_legal": decision.category.requires_legal_review,
            "requires_multi_party": decision.requires_multi_party(),
            "estimated_approval_time": f"{decision.risk_level.sla_hours} hours",
            "evidence_count": len(decision.get_evidence_requirements())
        }


class ThresholdEngine:
    """Manages risk thresholds and triggers."""

    DEFAULT_THRESHOLDS = {
        "financial": {
            "level_2": 5000,
            "level_3": 25000,
            "level_4": 100000,
            "level_5": 500000
        },
        "user_count": {
            "level_2": 50,
            "level_3": 500,
            "level_4": 5000,
            "level_5": 50000
        },
        "data_records": {
            "level_2": 1000,
            "level_3": 10000,
            "level_4": 100000,
            "level_5": 1000000
        }
    }

    def __init__(self):
        self.thresholds = self.DEFAULT_THRESHOLDS.copy()
        self.custom_rules: list = []

    def check_threshold(
        self,
        metric_type: str,
        value: float
    ) -> RiskLevel:
        """Check which risk level a value triggers."""
        thresholds = self.thresholds.get(metric_type, {})

        if value >= thresholds.get("level_5", float("inf")):
            return RiskLevel.LEVEL_5_RESTRICTED
        elif value >= thresholds.get("level_4", float("inf")):
            return RiskLevel.LEVEL_4_CRITICAL
        elif value >= thresholds.get("level_3", float("inf")):
            return RiskLevel.LEVEL_3_HIGH
        elif value >= thresholds.get("level_2", float("inf")):
            return RiskLevel.LEVEL_2_MEDIUM
        else:
            return RiskLevel.LEVEL_1_LOW

    def add_custom_rule(
        self,
        name: str,
        condition: Callable,
        result_level: RiskLevel
    ):
        """Add custom threshold rule."""
        self.custom_rules.append({
            "name": name,
            "condition": condition,
            "result": result_level
        })

    def evaluate_custom_rules(self, context: dict) -> Optional[RiskLevel]:
        """Evaluate custom rules against context."""
        for rule in self.custom_rules:
            if rule["condition"](context):
                return rule["result"]
        return None


class ApprovalChainEngine:
    """Manages approval workflows and chains."""

    def __init__(self):
        self.approvers: dict = {}
        self.workflows: dict = {}
        self.pending_approvals: dict = {}

    def register_approver(self, approver: Approver):
        """Register an approver."""
        self.approvers[approver.approver_id] = approver

    def create_approval_request(
        self,
        decision: Decision,
        quorum_type: QuorumType = QuorumType.ANY_ONE
    ) -> ApprovalRequest:
        """Create approval request for decision."""
        # Get appropriate approvers
        required_approvers = []
        for approver in self.approvers.values():
            if approver.can_approve(decision) and approver.available:
                required_approvers.append({
                    "approver_id": approver.approver_id,
                    "user_id": approver.user_id,
                    "role": approver.role,
                    "decision": None
                })

        # For multi-party, need at least 2 approvers
        if decision.requires_multi_party() and len(required_approvers) < 2:
            raise ValueError("Insufficient approvers for multi-party approval")

        request = ApprovalRequest(
            request_id=f"REQ-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            decision=decision,
            approvers=required_approvers,
            quorum_type=quorum_type if decision.requires_multi_party() else QuorumType.ANY_ONE
        )

        self.pending_approvals[request.request_id] = request
        return request

    def process_approval(
        self,
        request_id: str,
        approver_id: str,
        decision: str,
        rationale: str,
        conditions: list = None
    ) -> dict:
        """Process an approval decision."""
        request = self.pending_approvals.get(request_id)
        if not request:
            return {"error": "Request not found"}

        # Find approver in request
        approver_entry = None
        for a in request.approvers:
            if a["approver_id"] == approver_id:
                approver_entry = a
                break

        if not approver_entry:
            return {"error": "Approver not authorized"}

        # Record decision
        approval_decision = ApprovalDecision(
            decision_id=f"AD-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            request_id=request_id,
            approver_id=approver_id,
            decision=decision,
            rationale=rationale,
            conditions=conditions or []
        )

        approver_entry["decision"] = decision
        approver_entry["decided_at"] = datetime.now().isoformat()

        # Check quorum
        quorum_result = request.check_quorum()

        if quorum_result:
            request.status = (
                ApprovalStatus.APPROVED
                if quorum_result == "APPROVED"
                else ApprovalStatus.REJECTED
            )
            request.current_stage = WorkflowStage.DECISION

        return {
            "approval_decision": approval_decision.get_audit_record(),
            "quorum_reached": quorum_result is not None,
            "final_decision": quorum_result,
            "request_status": request.status.value
        }

    def escalate_request(
        self,
        request_id: str,
        trigger: EscalationTrigger,
        escalated_by: str
    ) -> Escalation:
        """Escalate an approval request."""
        request = self.pending_approvals.get(request_id)
        if not request:
            raise ValueError("Request not found")

        current_level = request.decision.risk_level.value

        # Determine escalation target
        level_hierarchy = [
            "level_1_low", "level_2_medium", "level_3_high",
            "level_4_critical", "level_5_restricted"
        ]
        current_idx = level_hierarchy.index(current_level)
        next_level = (
            level_hierarchy[current_idx + 1]
            if current_idx < len(level_hierarchy) - 1
            else current_level
        )

        escalation = Escalation(
            escalation_id=f"ESC-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            request_id=request_id,
            trigger=trigger,
            from_level=current_level,
            to_level=next_level
        )

        request.status = ApprovalStatus.ESCALATED

        return escalation


class EvidenceManagerEngine:
    """Manages evidence collection and validation."""

    EVIDENCE_TEMPLATES = {
        "business_justification": {
            "sections": [
                "Business Need", "Expected Benefits",
                "Success Metrics", "Timeline"
            ]
        },
        "impact_analysis": {
            "sections": [
                "Affected Systems", "User Impact",
                "Financial Impact", "Risk Assessment"
            ]
        },
        "risk_assessment": {
            "sections": [
                "Identified Risks", "Likelihood", "Impact",
                "Mitigation Strategies"
            ]
        },
        "rollback_plan": {
            "sections": [
                "Rollback Triggers", "Rollback Steps",
                "Recovery Time", "Communication Plan"
            ]
        }
    }

    def __init__(self):
        self.evidence_store: dict = {}
        self.validations: list = []

    def collect_evidence(
        self,
        request_id: str,
        evidence_type: EvidenceType,
        title: str,
        content: str,
        submitted_by: str,
        attachments: list = None
    ) -> Evidence:
        """Collect evidence for a request."""
        evidence = Evidence(
            evidence_id=f"EV-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            request_id=request_id,
            evidence_type=evidence_type,
            title=title,
            content=content,
            attachments=attachments or [],
            submitted_by=submitted_by
        )

        self.evidence_store[evidence.evidence_id] = evidence
        return evidence

    def validate_evidence(
        self,
        evidence_id: str,
        validator: str
    ) -> bool:
        """Validate evidence."""
        evidence = self.evidence_store.get(evidence_id)
        if not evidence:
            return False

        # Check required sections if template exists
        template = self.EVIDENCE_TEMPLATES.get(evidence.evidence_type.value)
        if template:
            required_sections = template.get("sections", [])
            for section in required_sections:
                if section.lower() not in evidence.content.lower():
                    return False

        evidence.validated = True
        self.validations.append({
            "evidence_id": evidence_id,
            "validator": validator,
            "timestamp": datetime.now().isoformat()
        })

        return True

    def get_evidence_for_request(self, request_id: str) -> list:
        """Get all evidence for a request."""
        return [
            e for e in self.evidence_store.values()
            if e.request_id == request_id
        ]

    def get_template(self, evidence_type: str) -> dict:
        """Get evidence template."""
        return self.EVIDENCE_TEMPLATES.get(evidence_type, {})


class DecisionGatingEngine:
    """Main decision gating orchestration engine."""

    def __init__(self):
        self.classifier = DecisionClassifierEngine()
        self.threshold_engine = ThresholdEngine()
        self.approval_chain = ApprovalChainEngine()
        self.evidence_manager = EvidenceManagerEngine()
        self.audit_log: list = []
        self.overrides: list = []

    def create_decision_request(
        self,
        title: str,
        description: str,
        category: str,
        requestor: str,
        financial_impact: float = 0,
        user_impact: int = 0,
        reversibility: str = "REVERSIBLE"
    ) -> dict:
        """Create and classify a decision request."""
        # Classify decision
        decision = self.classifier.classify_decision(
            title=title,
            description=description,
            category=DecisionCategory(category),
            requestor=requestor,
            financial_impact=financial_impact,
            user_impact=user_impact,
            reversibility=reversibility
        )

        # Create approval request
        request = self.approval_chain.create_approval_request(decision)

        # Log creation
        self._log_action(
            AuditAction.REQUEST_CREATED,
            request.request_id,
            requestor,
            {"decision_id": decision.decision_id}
        )

        return {
            "decision": {
                "id": decision.decision_id,
                "title": decision.title,
                "category": decision.category.value,
                "risk_level": decision.risk_level.value
            },
            "request": {
                "id": request.request_id,
                "status": request.status.value,
                "approvers": len(request.approvers),
                "evidence_required": decision.get_evidence_requirements()
            },
            "impact_assessment": self.classifier.assess_impact(decision)
        }

    def submit_evidence(
        self,
        request_id: str,
        evidence_type: str,
        title: str,
        content: str,
        submitted_by: str
    ) -> dict:
        """Submit evidence for a request."""
        evidence = self.evidence_manager.collect_evidence(
            request_id=request_id,
            evidence_type=EvidenceType(evidence_type),
            title=title,
            content=content,
            submitted_by=submitted_by
        )

        # Add to request
        request = self.approval_chain.pending_approvals.get(request_id)
        if request:
            request.evidence.append(evidence)

        self._log_action(
            AuditAction.EVIDENCE_ADDED,
            request_id,
            submitted_by,
            {"evidence_id": evidence.evidence_id, "type": evidence_type}
        )

        return {
            "evidence_id": evidence.evidence_id,
            "type": evidence_type,
            "checksum": evidence.get_checksum(),
            "validated": evidence.validated
        }

    def submit_request(self, request_id: str, submitted_by: str) -> dict:
        """Submit request for approval."""
        request = self.approval_chain.pending_approvals.get(request_id)
        if not request:
            return {"error": "Request not found"}

        success = request.submit()

        if success:
            self._log_action(
                AuditAction.REQUEST_SUBMITTED,
                request_id,
                submitted_by,
                {"status": request.status.value}
            )

        return {
            "success": success,
            "status": request.status.value,
            "stage": request.current_stage.value,
            "sla_deadline": request.decision.get_approval_sla().isoformat()
        }

    def process_approval(
        self,
        request_id: str,
        approver_id: str,
        decision: str,
        rationale: str
    ) -> dict:
        """Process an approval decision."""
        result = self.approval_chain.process_approval(
            request_id=request_id,
            approver_id=approver_id,
            decision=decision,
            rationale=rationale
        )

        action = (
            AuditAction.APPROVAL_GRANTED
            if decision == "APPROVED"
            else AuditAction.APPROVAL_DENIED
        )

        self._log_action(
            action,
            request_id,
            approver_id,
            {"decision": decision, "rationale": rationale}
        )

        return result

    def invoke_override(
        self,
        request_id: str,
        override_type: str,
        invoked_by: str,
        reason: str
    ) -> dict:
        """Invoke an approval override."""
        ov_type = OverrideType(override_type)

        override = Override(
            override_id=f"OV-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            request_id=request_id,
            override_type=ov_type,
            invoked_by=invoked_by,
            reason=reason,
            expires_at=datetime.now() + timedelta(hours=ov_type.max_duration_hours)
        )

        self.overrides.append(override)

        # Update request status
        request = self.approval_chain.pending_approvals.get(request_id)
        if request:
            request.status = ApprovalStatus.APPROVED

        self._log_action(
            AuditAction.OVERRIDE_INVOKED,
            request_id,
            invoked_by,
            {
                "override_id": override.override_id,
                "type": override_type,
                "reason": reason
            }
        )

        return {
            "override_id": override.override_id,
            "type": override_type,
            "expires_at": override.expires_at.isoformat(),
            "requires_review": override.requires_review()
        }

    def get_request_status(self, request_id: str) -> dict:
        """Get status of approval request."""
        request = self.approval_chain.pending_approvals.get(request_id)
        if not request:
            return {"error": "Request not found"}

        return {
            "request_id": request_id,
            "status": request.status.value,
            "stage": request.current_stage.value,
            "decision": {
                "id": request.decision.decision_id,
                "title": request.decision.title,
                "risk_level": request.decision.risk_level.value
            },
            "progress": request.get_approval_progress(),
            "sla_breached": request.is_sla_breached(),
            "evidence_count": len(request.evidence)
        }

    def get_audit_trail(self, request_id: str) -> list:
        """Get audit trail for request."""
        return [
            entry.to_record()
            for entry in self.audit_log
            if entry.request_id == request_id
        ]

    def _log_action(
        self,
        action: AuditAction,
        request_id: str,
        user: str,
        details: dict
    ):
        """Log action to audit trail."""
        entry = AuditEntry(
            entry_id=f"AUD-{len(self.audit_log) + 1}",
            action=action,
            request_id=request_id,
            user=user,
            details=details
        )
        self.audit_log.append(entry)


# ============================================================
# REPORTER CLASS
# ============================================================

class GatingReporter:
    """Generates decision gating reports."""

    @staticmethod
    def generate_request_report(data: dict) -> str:
        """Generate approval request report."""
        lines = [
            "",
            "═" * 60,
            "       DECISION GATING REPORT",
            "═" * 60,
            f"  Request ID: {data.get('request_id', 'N/A')}",
            f"  Status: {data.get('status', 'N/A').upper()}",
            "═" * 60,
            ""
        ]

        decision = data.get('decision', {})
        lines.append("  DECISION DETAILS")
        lines.append("  " + "─" * 40)
        lines.append(f"  Title: {decision.get('title', 'N/A')}")
        lines.append(f"  Risk Level: {decision.get('risk_level', 'N/A').upper()}")
        lines.append("")

        progress = data.get('progress', {})
        lines.append("  APPROVAL PROGRESS")
        lines.append("  " + "─" * 40)

        approved = progress.get('approved', 0)
        total = progress.get('total_approvers', 1)
        pct = (approved / total * 100) if total > 0 else 0
        bar = GatingReporter._bar(pct, 25)

        lines.append(f"  Progress: {bar} {pct:.0f}%")
        lines.append(f"  Approved: {approved} | Rejected: {progress.get('rejected', 0)} | Pending: {progress.get('pending', 0)}")
        lines.append("")

        lines.append("  STATUS")
        lines.append("  " + "─" * 40)
        sla_icon = "❌" if data.get('sla_breached') else "✓"
        lines.append(f"  SLA Status: {sla_icon} {'BREACHED' if data.get('sla_breached') else 'ON TRACK'}")
        lines.append(f"  Evidence: {data.get('evidence_count', 0)} items")
        lines.append(f"  Stage: {data.get('stage', 'N/A')}")
        lines.append("")

        lines.append("═" * 60)
        return "\n".join(lines)

    @staticmethod
    def _bar(value: float, width: int = 20) -> str:
        """Generate ASCII progress bar."""
        filled = int((value / 100) * width)
        return "█" * filled + "░" * (width - filled)

    @staticmethod
    def generate_audit_report(entries: list) -> str:
        """Generate audit trail report."""
        lines = [
            "",
            "═" * 60,
            "       AUDIT TRAIL",
            "═" * 60,
            ""
        ]

        for entry in entries:
            severity_icon = {
                "HIGH": "🔴",
                "MEDIUM": "🟡",
                "LOW": "🟢",
                "INFO": "⚪"
            }.get(entry.get("severity", "INFO"), "⚪")

            lines.append(f"  {severity_icon} {entry.get('action', 'N/A')}")
            lines.append(f"     User: {entry.get('user', 'N/A')}")
            lines.append(f"     Time: {entry.get('timestamp', 'N/A')}")
            lines.append(f"     Checksum: {entry.get('checksum', 'N/A')}")
            lines.append("")

        lines.append("═" * 60)
        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="DECISION.GATING.OS.EXE - Regulated Approval Engine"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create decision request")
    create_parser.add_argument("--title", required=True, help="Decision title")
    create_parser.add_argument("--category", required=True, help="Decision category")
    create_parser.add_argument("--requestor", required=True, help="Requestor ID")
    create_parser.add_argument("--financial-impact", type=float, default=0)

    # Status command
    status_parser = subparsers.add_parser("status", help="Get request status")
    status_parser.add_argument("--request-id", required=True, help="Request ID")

    # Approve command
    approve_parser = subparsers.add_parser("approve", help="Approve/reject request")
    approve_parser.add_argument("--request-id", required=True, help="Request ID")
    approve_parser.add_argument("--approver-id", required=True, help="Approver ID")
    approve_parser.add_argument("--decision", required=True, choices=["APPROVED", "REJECTED"])
    approve_parser.add_argument("--rationale", required=True, help="Decision rationale")

    # Evidence command
    evidence_parser = subparsers.add_parser("evidence", help="Submit evidence")
    evidence_parser.add_argument("--request-id", required=True, help="Request ID")
    evidence_parser.add_argument("--type", required=True, help="Evidence type")
    evidence_parser.add_argument("--content", required=True, help="Evidence content")

    # Audit command
    audit_parser = subparsers.add_parser("audit", help="Get audit trail")
    audit_parser.add_argument("--request-id", required=True, help="Request ID")

    args = parser.parse_args()

    engine = DecisionGatingEngine()
    reporter = GatingReporter()

    # Register sample approvers
    engine.approval_chain.register_approver(Approver(
        approver_id="APP-001",
        user_id="manager@company.com",
        role="Engineering Manager",
        authority_level=3
    ))
    engine.approval_chain.register_approver(Approver(
        approver_id="APP-002",
        user_id="director@company.com",
        role="Engineering Director",
        authority_level=4
    ))

    if args.command == "create":
        result = engine.create_decision_request(
            title=args.title,
            description=f"Decision request for {args.title}",
            category=args.category,
            requestor=args.requestor,
            financial_impact=args.financial_impact
        )
        print(f"\nCreated request: {result['request']['id']}")
        print(f"Risk Level: {result['decision']['risk_level']}")
        print(f"Evidence Required: {result['request']['evidence_required']}")

    elif args.command == "status":
        status = engine.get_request_status(args.request_id)
        print(reporter.generate_request_report(status))

    elif args.command == "approve":
        result = engine.process_approval(
            request_id=args.request_id,
            approver_id=args.approver_id,
            decision=args.decision,
            rationale=args.rationale
        )
        print(f"\nApproval processed: {result}")

    elif args.command == "evidence":
        result = engine.submit_evidence(
            request_id=args.request_id,
            evidence_type=args.type,
            title=f"Evidence: {args.type}",
            content=args.content,
            submitted_by="requestor"
        )
        print(f"\nEvidence submitted: {result['evidence_id']}")

    elif args.command == "audit":
        entries = engine.get_audit_trail(args.request_id)
        print(reporter.generate_audit_report(entries))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW

### Phase 1: CLASSIFY
1. Identify decision types
2. Assess risk levels
3. Determine reversibility
4. Evaluate sensitivity
5. Assign categories

### Phase 2: DESIGN
1. Define thresholds
2. Map approval chains
3. Set evidence requirements
4. Create escalation paths
5. Document overrides

### Phase 3: IMPLEMENT
1. Configure workflows
2. Assign authorities
3. Enable notifications
4. Set up logging
5. Test edge cases

### Phase 4: GOVERN
1. Monitor compliance
2. Audit decisions
3. Review exceptions
4. Update policies
5. Report metrics

---

## QUICK COMMANDS

- `/decision-gating` - Full gating framework
- `/decision-gating [decision]` - Specific decision analysis
- `/decision-gating workflow` - Approval workflow design
- `/decision-gating evidence` - Evidence requirements
- `/decision-gating audit` - Audit configuration

$ARGUMENTS
