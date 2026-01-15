# GATE.EXE - Access & Approval Gate Agent

You are GATE.EXE — the access control and approval workflow specialist for managing gates, permissions, and checkpoints with proper governance and complete audit trails.

MISSION
Manage approval workflows, access gates, and permission checkpoints with proper governance and audit trails. Control access. Enable flow. Maintain compliance.

---

## CAPABILITIES

### GateDesigner.MOD
- Gate definition
- Criteria setting
- Approver assignment
- Escalation planning
- Threshold configuration

### WorkflowOrchestrator.MOD
- Request routing
- Approval sequencing
- Parallel processing
- Condition evaluation
- Timeout handling

### AccessController.MOD
- Permission validation
- Role verification
- Scope checking
- Token management
- Session control

### AuditRecorder.MOD
- Decision logging
- Time tracking
- Compliance reporting
- Trend analysis
- Bottleneck detection

---

## WORKFLOW

### Phase 1: DEFINE
1. Identify gate requirements
2. Set approval criteria
3. Define authorized approvers
4. Configure escalation paths
5. Establish SLAs

### Phase 2: IMPLEMENT
1. Create gate checkpoint
2. Set up approval workflow
3. Configure notifications
4. Enable audit logging
5. Test workflow

### Phase 3: ENFORCE
1. Validate requests against criteria
2. Route to appropriate approvers
3. Track approval status
4. Handle timeouts/escalations
5. Process decisions

### Phase 4: AUDIT
1. Log all decisions
2. Track approval times
3. Generate compliance reports
4. Identify bottlenecks
5. Optimize workflows

---

## GATE TYPES

| Type | Purpose | Use Case |
|------|---------|----------|
| Access | Permission control | Resource access |
| Approval | Human decision | Change management |
| Release | Deployment control | Production gates |
| Quality | Standard check | Code review |
| Compliance | Policy enforcement | Regulatory |

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
GATE.EXE - Access & Approval Gate Engine
Full implementation for managing gates, permissions, and approval workflows
"""

import asyncio
import json
import hashlib
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Callable
from datetime import datetime, timedelta
from collections import defaultdict


class GateType(Enum):
    """Types of gates available"""
    ACCESS = "access"
    APPROVAL = "approval"
    RELEASE = "release"
    QUALITY = "quality"
    COMPLIANCE = "compliance"
    SECURITY = "security"
    BUDGET = "budget"
    CUSTOM = "custom"


class GateStatus(Enum):
    """Current status of a gate"""
    OPEN = "open"
    CLOSED = "closed"
    PENDING = "pending"
    LOCKED = "locked"
    BYPASSED = "bypassed"
    EXPIRED = "expired"


class RequestStatus(Enum):
    """Status of an approval request"""
    SUBMITTED = "submitted"
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    ESCALATED = "escalated"
    EXPIRED = "expired"
    WITHDRAWN = "withdrawn"


class ApprovalType(Enum):
    """Type of approval workflow"""
    SINGLE = "single"
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    UNANIMOUS = "unanimous"
    MAJORITY = "majority"
    QUORUM = "quorum"


class Priority(Enum):
    """Request priority levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    ROUTINE = "routine"


class EscalationLevel(Enum):
    """Escalation levels"""
    L0 = "none"
    L1 = "supervisor"
    L2 = "manager"
    L3 = "director"
    L4 = "executive"


class AuditAction(Enum):
    """Types of auditable actions"""
    GATE_CREATED = "gate_created"
    GATE_MODIFIED = "gate_modified"
    GATE_DELETED = "gate_deleted"
    REQUEST_SUBMITTED = "request_submitted"
    REQUEST_APPROVED = "request_approved"
    REQUEST_DENIED = "request_denied"
    REQUEST_ESCALATED = "request_escalated"
    REQUEST_WITHDRAWN = "request_withdrawn"
    CRITERIA_EVALUATED = "criteria_evaluated"
    APPROVER_ASSIGNED = "approver_assigned"
    NOTIFICATION_SENT = "notification_sent"
    SLA_BREACHED = "sla_breached"
    ACCESS_GRANTED = "access_granted"
    ACCESS_REVOKED = "access_revoked"


class CriterionType(Enum):
    """Types of gate criteria"""
    BOOLEAN = "boolean"
    NUMERIC = "numeric"
    STRING = "string"
    DATE = "date"
    LIST = "list"
    CUSTOM = "custom"


class ComplianceStatus(Enum):
    """Compliance check status"""
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PENDING_REVIEW = "pending_review"
    EXEMPTED = "exempted"
    NOT_APPLICABLE = "not_applicable"


@dataclass
class Approver:
    """Represents an approver in the workflow"""
    id: str
    name: str
    email: str
    role: str
    department: str
    level: int = 1
    delegate_id: Optional[str] = None
    is_available: bool = True
    max_pending: int = 50


@dataclass
class Criterion:
    """Single gate criterion"""
    id: str
    name: str
    description: str
    criterion_type: CriterionType
    required_value: any
    operator: str  # eq, ne, gt, lt, gte, lte, contains, matches
    weight: float = 1.0
    is_mandatory: bool = True
    failure_message: str = ""


@dataclass
class CriterionResult:
    """Result of criterion evaluation"""
    criterion_id: str
    criterion_name: str
    passed: bool
    expected: any
    actual: any
    message: str
    evaluated_at: datetime = field(default_factory=datetime.now)


@dataclass
class EscalationRule:
    """Defines escalation behavior"""
    level: EscalationLevel
    trigger_after: timedelta
    escalate_to: list[str]
    notification_template: str
    auto_approve: bool = False
    auto_deny: bool = False


@dataclass
class SLADefinition:
    """Service Level Agreement for gate"""
    response_time: timedelta
    resolution_time: timedelta
    warning_threshold: float = 0.75
    critical_threshold: float = 0.90
    breach_action: str = "escalate"


@dataclass
class GateConfiguration:
    """Complete gate configuration"""
    id: str
    name: str
    description: str
    gate_type: GateType
    status: GateStatus
    criteria: list[Criterion]
    approvers: list[Approver]
    approval_type: ApprovalType
    min_approvals: int
    escalation_rules: list[EscalationRule]
    sla: Optional[SLADefinition]
    created_at: datetime
    created_by: str
    updated_at: datetime
    is_active: bool = True
    bypass_allowed: bool = False
    bypass_requires_audit: bool = True
    metadata: dict = field(default_factory=dict)


@dataclass
class ApprovalRequest:
    """Represents a request for approval"""
    id: str
    gate_id: str
    requestor_id: str
    requestor_name: str
    title: str
    description: str
    priority: Priority
    status: RequestStatus
    submitted_at: datetime
    criteria_results: list[CriterionResult]
    current_approver_index: int = 0
    approved_by: list[str] = field(default_factory=list)
    denied_by: list[str] = field(default_factory=list)
    comments: list[dict] = field(default_factory=list)
    attachments: list[str] = field(default_factory=list)
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    escalation_level: EscalationLevel = EscalationLevel.L0
    metadata: dict = field(default_factory=dict)


@dataclass
class ApprovalDecision:
    """Record of an approval decision"""
    request_id: str
    approver_id: str
    approver_name: str
    decision: str  # approved, denied, deferred
    comment: str
    decided_at: datetime
    conditions: list[str] = field(default_factory=list)
    time_to_decision: Optional[timedelta] = None


@dataclass
class AuditEntry:
    """Single audit log entry"""
    id: str
    timestamp: datetime
    gate_id: str
    request_id: Optional[str]
    actor_id: str
    actor_name: str
    action: AuditAction
    details: dict
    ip_address: Optional[str] = None
    session_id: Optional[str] = None
    compliance_relevant: bool = False


@dataclass
class AccessToken:
    """Token representing granted access"""
    id: str
    gate_id: str
    request_id: str
    holder_id: str
    scope: list[str]
    granted_at: datetime
    expires_at: datetime
    is_revoked: bool = False
    revoked_at: Optional[datetime] = None
    revoked_by: Optional[str] = None


@dataclass
class GateMetrics:
    """Performance metrics for a gate"""
    gate_id: str
    total_requests: int
    approved_count: int
    denied_count: int
    pending_count: int
    avg_approval_time: timedelta
    sla_compliance_rate: float
    escalation_rate: float
    bypass_count: int
    period_start: datetime
    period_end: datetime


@dataclass
class ComplianceReport:
    """Compliance reporting data"""
    report_id: str
    gate_id: str
    period: str
    total_transactions: int
    compliant_count: int
    non_compliant_count: int
    exemptions: int
    compliance_rate: float
    issues: list[dict]
    recommendations: list[str]
    generated_at: datetime


class GateDesigner:
    """Design and configure approval gates"""

    # Default SLA configurations by gate type
    DEFAULT_SLAS = {
        GateType.ACCESS: SLADefinition(
            response_time=timedelta(hours=1),
            resolution_time=timedelta(hours=4)
        ),
        GateType.APPROVAL: SLADefinition(
            response_time=timedelta(hours=4),
            resolution_time=timedelta(days=1)
        ),
        GateType.RELEASE: SLADefinition(
            response_time=timedelta(hours=2),
            resolution_time=timedelta(hours=8)
        ),
        GateType.QUALITY: SLADefinition(
            response_time=timedelta(hours=8),
            resolution_time=timedelta(days=2)
        ),
        GateType.COMPLIANCE: SLADefinition(
            response_time=timedelta(days=1),
            resolution_time=timedelta(days=5)
        ),
    }

    # Standard escalation paths
    ESCALATION_TEMPLATES = {
        "standard": [
            EscalationRule(EscalationLevel.L1, timedelta(hours=4), [], "escalation_l1"),
            EscalationRule(EscalationLevel.L2, timedelta(hours=8), [], "escalation_l2"),
            EscalationRule(EscalationLevel.L3, timedelta(days=1), [], "escalation_l3"),
        ],
        "urgent": [
            EscalationRule(EscalationLevel.L1, timedelta(hours=1), [], "escalation_l1"),
            EscalationRule(EscalationLevel.L2, timedelta(hours=2), [], "escalation_l2"),
            EscalationRule(EscalationLevel.L3, timedelta(hours=4), [], "escalation_l3"),
        ],
        "relaxed": [
            EscalationRule(EscalationLevel.L1, timedelta(days=1), [], "escalation_l1"),
            EscalationRule(EscalationLevel.L2, timedelta(days=3), [], "escalation_l2"),
            EscalationRule(EscalationLevel.L3, timedelta(days=5), [], "escalation_l3"),
        ],
    }

    def __init__(self):
        self.gates: dict[str, GateConfiguration] = {}
        self.gate_counter = 0

    def create_gate(
        self,
        name: str,
        gate_type: GateType,
        description: str = "",
        created_by: str = "system"
    ) -> GateConfiguration:
        """Create a new gate with default configuration"""
        self.gate_counter += 1
        gate_id = f"GATE-{self.gate_counter:04d}"

        gate = GateConfiguration(
            id=gate_id,
            name=name,
            description=description or f"{gate_type.value.title()} gate for {name}",
            gate_type=gate_type,
            status=GateStatus.CLOSED,
            criteria=[],
            approvers=[],
            approval_type=ApprovalType.SINGLE,
            min_approvals=1,
            escalation_rules=self.ESCALATION_TEMPLATES["standard"].copy(),
            sla=self.DEFAULT_SLAS.get(gate_type),
            created_at=datetime.now(),
            created_by=created_by,
            updated_at=datetime.now()
        )

        self.gates[gate_id] = gate
        return gate

    def add_criterion(
        self,
        gate_id: str,
        name: str,
        criterion_type: CriterionType,
        required_value: any,
        operator: str = "eq",
        description: str = "",
        is_mandatory: bool = True,
        weight: float = 1.0
    ) -> Criterion:
        """Add a criterion to a gate"""
        if gate_id not in self.gates:
            raise ValueError(f"Gate {gate_id} not found")

        criterion = Criterion(
            id=f"{gate_id}-C{len(self.gates[gate_id].criteria) + 1:02d}",
            name=name,
            description=description or f"Criterion: {name}",
            criterion_type=criterion_type,
            required_value=required_value,
            operator=operator,
            weight=weight,
            is_mandatory=is_mandatory,
            failure_message=f"Failed: {name} must {operator} {required_value}"
        )

        self.gates[gate_id].criteria.append(criterion)
        self.gates[gate_id].updated_at = datetime.now()
        return criterion

    def add_approver(
        self,
        gate_id: str,
        approver_id: str,
        name: str,
        email: str,
        role: str,
        department: str,
        level: int = 1
    ) -> Approver:
        """Add an approver to a gate"""
        if gate_id not in self.gates:
            raise ValueError(f"Gate {gate_id} not found")

        approver = Approver(
            id=approver_id,
            name=name,
            email=email,
            role=role,
            department=department,
            level=level
        )

        self.gates[gate_id].approvers.append(approver)
        self.gates[gate_id].updated_at = datetime.now()
        return approver

    def configure_approval_flow(
        self,
        gate_id: str,
        approval_type: ApprovalType,
        min_approvals: int = 1
    ):
        """Configure the approval workflow type"""
        if gate_id not in self.gates:
            raise ValueError(f"Gate {gate_id} not found")

        gate = self.gates[gate_id]
        gate.approval_type = approval_type
        gate.min_approvals = min_approvals
        gate.updated_at = datetime.now()

    def set_sla(
        self,
        gate_id: str,
        response_hours: int,
        resolution_hours: int,
        warning_threshold: float = 0.75
    ):
        """Set SLA for a gate"""
        if gate_id not in self.gates:
            raise ValueError(f"Gate {gate_id} not found")

        self.gates[gate_id].sla = SLADefinition(
            response_time=timedelta(hours=response_hours),
            resolution_time=timedelta(hours=resolution_hours),
            warning_threshold=warning_threshold
        )
        self.gates[gate_id].updated_at = datetime.now()

    def set_escalation_path(
        self,
        gate_id: str,
        template: str = "standard"
    ):
        """Set escalation path from template"""
        if gate_id not in self.gates:
            raise ValueError(f"Gate {gate_id} not found")

        if template not in self.ESCALATION_TEMPLATES:
            raise ValueError(f"Unknown template: {template}")

        self.gates[gate_id].escalation_rules = self.ESCALATION_TEMPLATES[template].copy()
        self.gates[gate_id].updated_at = datetime.now()

    def activate_gate(self, gate_id: str):
        """Activate a gate for use"""
        if gate_id not in self.gates:
            raise ValueError(f"Gate {gate_id} not found")

        gate = self.gates[gate_id]

        # Validate gate has minimum configuration
        if not gate.criteria:
            raise ValueError("Gate must have at least one criterion")
        if not gate.approvers:
            raise ValueError("Gate must have at least one approver")

        gate.status = GateStatus.OPEN
        gate.is_active = True
        gate.updated_at = datetime.now()

    def get_gate(self, gate_id: str) -> Optional[GateConfiguration]:
        """Get gate by ID"""
        return self.gates.get(gate_id)

    def list_gates(self, gate_type: Optional[GateType] = None) -> list[GateConfiguration]:
        """List all gates, optionally filtered by type"""
        gates = list(self.gates.values())
        if gate_type:
            gates = [g for g in gates if g.gate_type == gate_type]
        return gates


class CriteriaEvaluator:
    """Evaluate criteria for gate passage"""

    OPERATORS = {
        "eq": lambda a, b: a == b,
        "ne": lambda a, b: a != b,
        "gt": lambda a, b: a > b,
        "lt": lambda a, b: a < b,
        "gte": lambda a, b: a >= b,
        "lte": lambda a, b: a <= b,
        "contains": lambda a, b: b in a if isinstance(a, (list, str)) else False,
        "not_contains": lambda a, b: b not in a if isinstance(a, (list, str)) else True,
        "matches": lambda a, b: bool(__import__('re').match(b, str(a))),
        "in_list": lambda a, b: a in b if isinstance(b, list) else False,
        "not_empty": lambda a, b: bool(a),
        "is_true": lambda a, b: a is True,
        "is_false": lambda a, b: a is False,
    }

    def evaluate_criterion(
        self,
        criterion: Criterion,
        actual_value: any
    ) -> CriterionResult:
        """Evaluate a single criterion"""
        operator_fn = self.OPERATORS.get(criterion.operator)

        if not operator_fn:
            return CriterionResult(
                criterion_id=criterion.id,
                criterion_name=criterion.name,
                passed=False,
                expected=criterion.required_value,
                actual=actual_value,
                message=f"Unknown operator: {criterion.operator}"
            )

        try:
            passed = operator_fn(actual_value, criterion.required_value)
            message = "Passed" if passed else criterion.failure_message
        except Exception as e:
            passed = False
            message = f"Evaluation error: {str(e)}"

        return CriterionResult(
            criterion_id=criterion.id,
            criterion_name=criterion.name,
            passed=passed,
            expected=criterion.required_value,
            actual=actual_value,
            message=message
        )

    def evaluate_all(
        self,
        criteria: list[Criterion],
        values: dict[str, any]
    ) -> tuple[bool, list[CriterionResult]]:
        """Evaluate all criteria against provided values"""
        results = []
        all_passed = True
        mandatory_passed = True

        for criterion in criteria:
            actual = values.get(criterion.name, values.get(criterion.id))
            result = self.evaluate_criterion(criterion, actual)
            results.append(result)

            if not result.passed:
                all_passed = False
                if criterion.is_mandatory:
                    mandatory_passed = False

        return mandatory_passed, results

    def calculate_score(self, results: list[CriterionResult], criteria: list[Criterion]) -> float:
        """Calculate weighted pass score"""
        if not results:
            return 0.0

        total_weight = sum(c.weight for c in criteria)
        passed_weight = sum(
            c.weight for c, r in zip(criteria, results) if r.passed
        )

        return (passed_weight / total_weight) * 100 if total_weight > 0 else 0.0


class WorkflowOrchestrator:
    """Orchestrate approval workflows"""

    def __init__(self, designer: GateDesigner):
        self.designer = designer
        self.requests: dict[str, ApprovalRequest] = {}
        self.decisions: dict[str, list[ApprovalDecision]] = defaultdict(list)
        self.request_counter = 0
        self.evaluator = CriteriaEvaluator()

    def submit_request(
        self,
        gate_id: str,
        requestor_id: str,
        requestor_name: str,
        title: str,
        description: str,
        priority: Priority = Priority.MEDIUM,
        criteria_values: dict = None,
        attachments: list[str] = None
    ) -> ApprovalRequest:
        """Submit a new approval request"""
        gate = self.designer.get_gate(gate_id)
        if not gate:
            raise ValueError(f"Gate {gate_id} not found")

        if gate.status != GateStatus.OPEN:
            raise ValueError(f"Gate {gate_id} is not open for requests")

        # Evaluate criteria
        criteria_values = criteria_values or {}
        _, criteria_results = self.evaluator.evaluate_all(gate.criteria, criteria_values)

        self.request_counter += 1
        request_id = f"REQ-{self.request_counter:06d}"

        # Calculate due date based on SLA
        due_date = None
        if gate.sla:
            due_date = datetime.now() + gate.sla.resolution_time

        request = ApprovalRequest(
            id=request_id,
            gate_id=gate_id,
            requestor_id=requestor_id,
            requestor_name=requestor_name,
            title=title,
            description=description,
            priority=priority,
            status=RequestStatus.PENDING,
            submitted_at=datetime.now(),
            criteria_results=criteria_results,
            due_date=due_date,
            attachments=attachments or []
        )

        self.requests[request_id] = request
        return request

    def get_pending_approvers(self, request_id: str) -> list[Approver]:
        """Get list of approvers who need to act on a request"""
        request = self.requests.get(request_id)
        if not request:
            return []

        gate = self.designer.get_gate(request.gate_id)
        if not gate:
            return []

        if gate.approval_type == ApprovalType.SEQUENTIAL:
            # Return only current approver in sequence
            if request.current_approver_index < len(gate.approvers):
                return [gate.approvers[request.current_approver_index]]
            return []

        elif gate.approval_type == ApprovalType.PARALLEL:
            # Return all approvers who haven't decided
            decided_ids = set(request.approved_by + request.denied_by)
            return [a for a in gate.approvers if a.id not in decided_ids]

        else:  # SINGLE, UNANIMOUS, MAJORITY, QUORUM
            decided_ids = set(request.approved_by + request.denied_by)
            return [a for a in gate.approvers if a.id not in decided_ids]

    def record_decision(
        self,
        request_id: str,
        approver_id: str,
        decision: str,
        comment: str = "",
        conditions: list[str] = None
    ) -> ApprovalDecision:
        """Record an approver's decision"""
        request = self.requests.get(request_id)
        if not request:
            raise ValueError(f"Request {request_id} not found")

        gate = self.designer.get_gate(request.gate_id)
        if not gate:
            raise ValueError(f"Gate not found for request")

        # Find approver
        approver = next((a for a in gate.approvers if a.id == approver_id), None)
        if not approver:
            raise ValueError(f"Approver {approver_id} not authorized for this gate")

        # Calculate time to decision
        time_to_decision = datetime.now() - request.submitted_at

        decision_record = ApprovalDecision(
            request_id=request_id,
            approver_id=approver_id,
            approver_name=approver.name,
            decision=decision,
            comment=comment,
            decided_at=datetime.now(),
            conditions=conditions or [],
            time_to_decision=time_to_decision
        )

        self.decisions[request_id].append(decision_record)

        # Update request
        if decision == "approved":
            request.approved_by.append(approver_id)
        elif decision == "denied":
            request.denied_by.append(approver_id)

        # Check if request is complete
        self._check_completion(request, gate)

        return decision_record

    def _check_completion(self, request: ApprovalRequest, gate: GateConfiguration):
        """Check if request has reached a final state"""
        approval_count = len(request.approved_by)
        denial_count = len(request.denied_by)
        total_approvers = len(gate.approvers)

        if gate.approval_type == ApprovalType.SINGLE:
            if approval_count >= 1:
                request.status = RequestStatus.APPROVED
                request.completed_at = datetime.now()
            elif denial_count >= 1:
                request.status = RequestStatus.DENIED
                request.completed_at = datetime.now()

        elif gate.approval_type == ApprovalType.SEQUENTIAL:
            request.current_approver_index += 1
            if denial_count > 0:
                request.status = RequestStatus.DENIED
                request.completed_at = datetime.now()
            elif approval_count >= total_approvers:
                request.status = RequestStatus.APPROVED
                request.completed_at = datetime.now()

        elif gate.approval_type == ApprovalType.UNANIMOUS:
            if denial_count > 0:
                request.status = RequestStatus.DENIED
                request.completed_at = datetime.now()
            elif approval_count >= total_approvers:
                request.status = RequestStatus.APPROVED
                request.completed_at = datetime.now()

        elif gate.approval_type == ApprovalType.MAJORITY:
            threshold = total_approvers // 2 + 1
            if approval_count >= threshold:
                request.status = RequestStatus.APPROVED
                request.completed_at = datetime.now()
            elif denial_count >= threshold:
                request.status = RequestStatus.DENIED
                request.completed_at = datetime.now()

        elif gate.approval_type == ApprovalType.QUORUM:
            if approval_count >= gate.min_approvals:
                request.status = RequestStatus.APPROVED
                request.completed_at = datetime.now()
            elif denial_count > (total_approvers - gate.min_approvals):
                request.status = RequestStatus.DENIED
                request.completed_at = datetime.now()

        elif gate.approval_type == ApprovalType.PARALLEL:
            if approval_count >= gate.min_approvals:
                request.status = RequestStatus.APPROVED
                request.completed_at = datetime.now()
            elif denial_count > (total_approvers - gate.min_approvals):
                request.status = RequestStatus.DENIED
                request.completed_at = datetime.now()

    def withdraw_request(self, request_id: str, reason: str = "") -> bool:
        """Withdraw a pending request"""
        request = self.requests.get(request_id)
        if not request:
            return False

        if request.status not in [RequestStatus.PENDING, RequestStatus.SUBMITTED]:
            return False

        request.status = RequestStatus.WITHDRAWN
        request.completed_at = datetime.now()
        request.comments.append({
            "type": "withdrawal",
            "reason": reason,
            "timestamp": datetime.now().isoformat()
        })
        return True

    def escalate_request(self, request_id: str) -> bool:
        """Escalate a request to the next level"""
        request = self.requests.get(request_id)
        if not request:
            return False

        gate = self.designer.get_gate(request.gate_id)
        if not gate:
            return False

        # Find next escalation level
        current_level_index = list(EscalationLevel).index(request.escalation_level)
        if current_level_index < len(EscalationLevel) - 1:
            next_level = list(EscalationLevel)[current_level_index + 1]
            request.escalation_level = next_level
            request.status = RequestStatus.ESCALATED
            return True

        return False

    def get_request(self, request_id: str) -> Optional[ApprovalRequest]:
        """Get request by ID"""
        return self.requests.get(request_id)

    def list_requests(
        self,
        gate_id: Optional[str] = None,
        status: Optional[RequestStatus] = None,
        approver_id: Optional[str] = None
    ) -> list[ApprovalRequest]:
        """List requests with optional filters"""
        requests = list(self.requests.values())

        if gate_id:
            requests = [r for r in requests if r.gate_id == gate_id]
        if status:
            requests = [r for r in requests if r.status == status]
        if approver_id:
            # Filter to requests where this approver needs to act
            filtered = []
            for req in requests:
                pending_approvers = self.get_pending_approvers(req.id)
                if any(a.id == approver_id for a in pending_approvers):
                    filtered.append(req)
            requests = filtered

        return requests


class AccessController:
    """Control access based on gate decisions"""

    def __init__(self, orchestrator: WorkflowOrchestrator):
        self.orchestrator = orchestrator
        self.tokens: dict[str, AccessToken] = {}
        self.token_counter = 0

    def grant_access(
        self,
        request_id: str,
        scope: list[str],
        duration_hours: int = 24
    ) -> Optional[AccessToken]:
        """Grant access token for approved request"""
        request = self.orchestrator.get_request(request_id)
        if not request or request.status != RequestStatus.APPROVED:
            return None

        self.token_counter += 1
        token_id = f"TKN-{self.token_counter:08d}"

        token = AccessToken(
            id=token_id,
            gate_id=request.gate_id,
            request_id=request_id,
            holder_id=request.requestor_id,
            scope=scope,
            granted_at=datetime.now(),
            expires_at=datetime.now() + timedelta(hours=duration_hours)
        )

        self.tokens[token_id] = token
        return token

    def validate_token(self, token_id: str, required_scope: str = None) -> tuple[bool, str]:
        """Validate an access token"""
        token = self.tokens.get(token_id)

        if not token:
            return False, "Token not found"

        if token.is_revoked:
            return False, "Token has been revoked"

        if datetime.now() > token.expires_at:
            return False, "Token has expired"

        if required_scope and required_scope not in token.scope:
            return False, f"Token does not include scope: {required_scope}"

        return True, "Token is valid"

    def revoke_token(self, token_id: str, revoked_by: str, reason: str = "") -> bool:
        """Revoke an access token"""
        token = self.tokens.get(token_id)
        if not token:
            return False

        token.is_revoked = True
        token.revoked_at = datetime.now()
        token.revoked_by = revoked_by
        return True

    def list_active_tokens(self, holder_id: Optional[str] = None) -> list[AccessToken]:
        """List active (non-revoked, non-expired) tokens"""
        now = datetime.now()
        tokens = [
            t for t in self.tokens.values()
            if not t.is_revoked and t.expires_at > now
        ]

        if holder_id:
            tokens = [t for t in tokens if t.holder_id == holder_id]

        return tokens

    def get_token(self, token_id: str) -> Optional[AccessToken]:
        """Get token by ID"""
        return self.tokens.get(token_id)


class AuditRecorder:
    """Record and query audit trail"""

    def __init__(self):
        self.entries: list[AuditEntry] = []
        self.entry_counter = 0

    def record(
        self,
        gate_id: str,
        actor_id: str,
        actor_name: str,
        action: AuditAction,
        details: dict,
        request_id: Optional[str] = None,
        compliance_relevant: bool = False,
        ip_address: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> AuditEntry:
        """Record an audit entry"""
        self.entry_counter += 1
        entry_id = f"AUD-{self.entry_counter:010d}"

        entry = AuditEntry(
            id=entry_id,
            timestamp=datetime.now(),
            gate_id=gate_id,
            request_id=request_id,
            actor_id=actor_id,
            actor_name=actor_name,
            action=action,
            details=details,
            ip_address=ip_address,
            session_id=session_id,
            compliance_relevant=compliance_relevant
        )

        self.entries.append(entry)
        return entry

    def query(
        self,
        gate_id: Optional[str] = None,
        request_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        action: Optional[AuditAction] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        compliance_only: bool = False
    ) -> list[AuditEntry]:
        """Query audit entries with filters"""
        results = self.entries.copy()

        if gate_id:
            results = [e for e in results if e.gate_id == gate_id]
        if request_id:
            results = [e for e in results if e.request_id == request_id]
        if actor_id:
            results = [e for e in results if e.actor_id == actor_id]
        if action:
            results = [e for e in results if e.action == action]
        if start_time:
            results = [e for e in results if e.timestamp >= start_time]
        if end_time:
            results = [e for e in results if e.timestamp <= end_time]
        if compliance_only:
            results = [e for e in results if e.compliance_relevant]

        return sorted(results, key=lambda e: e.timestamp, reverse=True)

    def get_timeline(self, request_id: str) -> list[AuditEntry]:
        """Get chronological timeline for a request"""
        entries = [e for e in self.entries if e.request_id == request_id]
        return sorted(entries, key=lambda e: e.timestamp)

    def export_compliance_log(
        self,
        gate_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> list[dict]:
        """Export compliance-relevant entries for auditing"""
        entries = self.query(
            gate_id=gate_id,
            start_time=start_time,
            end_time=end_time,
            compliance_only=True
        )

        return [
            {
                "id": e.id,
                "timestamp": e.timestamp.isoformat(),
                "actor": e.actor_name,
                "action": e.action.value,
                "details": e.details,
                "request_id": e.request_id
            }
            for e in entries
        ]


class MetricsCalculator:
    """Calculate gate performance metrics"""

    def __init__(self, orchestrator: WorkflowOrchestrator, audit: AuditRecorder):
        self.orchestrator = orchestrator
        self.audit = audit

    def calculate_metrics(
        self,
        gate_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> GateMetrics:
        """Calculate metrics for a gate over a time period"""
        requests = [
            r for r in self.orchestrator.requests.values()
            if r.gate_id == gate_id and r.submitted_at >= start_time and r.submitted_at <= end_time
        ]

        total = len(requests)
        approved = len([r for r in requests if r.status == RequestStatus.APPROVED])
        denied = len([r for r in requests if r.status == RequestStatus.DENIED])
        pending = len([r for r in requests if r.status == RequestStatus.PENDING])

        # Calculate average approval time
        completed = [r for r in requests if r.completed_at]
        if completed:
            total_time = sum(
                (r.completed_at - r.submitted_at).total_seconds()
                for r in completed
            )
            avg_time = timedelta(seconds=total_time / len(completed))
        else:
            avg_time = timedelta(0)

        # Calculate SLA compliance
        gate = self.orchestrator.designer.get_gate(gate_id)
        sla_compliant = 0
        if gate and gate.sla and completed:
            for r in completed:
                if r.completed_at - r.submitted_at <= gate.sla.resolution_time:
                    sla_compliant += 1
            sla_rate = sla_compliant / len(completed)
        else:
            sla_rate = 1.0

        # Calculate escalation rate
        escalated = len([r for r in requests if r.escalation_level != EscalationLevel.L0])
        escalation_rate = escalated / total if total > 0 else 0.0

        # Count bypasses from audit
        bypass_entries = self.audit.query(
            gate_id=gate_id,
            action=AuditAction.ACCESS_GRANTED,
            start_time=start_time,
            end_time=end_time
        )
        bypass_count = len([e for e in bypass_entries if e.details.get("bypass")])

        return GateMetrics(
            gate_id=gate_id,
            total_requests=total,
            approved_count=approved,
            denied_count=denied,
            pending_count=pending,
            avg_approval_time=avg_time,
            sla_compliance_rate=sla_rate,
            escalation_rate=escalation_rate,
            bypass_count=bypass_count,
            period_start=start_time,
            period_end=end_time
        )

    def generate_compliance_report(
        self,
        gate_id: str,
        period: str = "monthly"
    ) -> ComplianceReport:
        """Generate compliance report for a gate"""
        now = datetime.now()

        if period == "daily":
            start = now - timedelta(days=1)
        elif period == "weekly":
            start = now - timedelta(weeks=1)
        elif period == "monthly":
            start = now - timedelta(days=30)
        elif period == "quarterly":
            start = now - timedelta(days=90)
        else:
            start = now - timedelta(days=30)

        metrics = self.calculate_metrics(gate_id, start, now)

        # Identify issues
        issues = []
        if metrics.sla_compliance_rate < 0.95:
            issues.append({
                "type": "sla_breach",
                "severity": "high",
                "message": f"SLA compliance at {metrics.sla_compliance_rate:.1%}"
            })
        if metrics.escalation_rate > 0.1:
            issues.append({
                "type": "high_escalation",
                "severity": "medium",
                "message": f"Escalation rate at {metrics.escalation_rate:.1%}"
            })
        if metrics.bypass_count > 0:
            issues.append({
                "type": "bypass_usage",
                "severity": "info",
                "message": f"{metrics.bypass_count} bypasses recorded"
            })

        # Generate recommendations
        recommendations = []
        if metrics.avg_approval_time.total_seconds() > 86400:  # > 24 hours
            recommendations.append("Consider adding more approvers to reduce approval time")
        if metrics.denied_count / max(metrics.total_requests, 1) > 0.3:
            recommendations.append("High denial rate - review criteria clarity")

        compliant = metrics.approved_count + metrics.denied_count - len(issues)

        return ComplianceReport(
            report_id=f"RPT-{gate_id}-{now.strftime('%Y%m%d')}",
            gate_id=gate_id,
            period=period,
            total_transactions=metrics.total_requests,
            compliant_count=max(compliant, 0),
            non_compliant_count=len(issues),
            exemptions=0,
            compliance_rate=metrics.sla_compliance_rate,
            issues=issues,
            recommendations=recommendations,
            generated_at=now
        )


class GateEngine:
    """Main orchestration engine for GATE.EXE"""

    def __init__(self):
        self.designer = GateDesigner()
        self.orchestrator = WorkflowOrchestrator(self.designer)
        self.access = AccessController(self.orchestrator)
        self.audit = AuditRecorder()
        self.metrics = MetricsCalculator(self.orchestrator, self.audit)

    def create_gate(
        self,
        name: str,
        gate_type: GateType,
        description: str = "",
        created_by: str = "system"
    ) -> GateConfiguration:
        """Create a new gate"""
        gate = self.designer.create_gate(name, gate_type, description, created_by)

        self.audit.record(
            gate_id=gate.id,
            actor_id=created_by,
            actor_name=created_by,
            action=AuditAction.GATE_CREATED,
            details={"name": name, "type": gate_type.value},
            compliance_relevant=True
        )

        return gate

    def submit_request(
        self,
        gate_id: str,
        requestor_id: str,
        requestor_name: str,
        title: str,
        description: str,
        priority: Priority = Priority.MEDIUM,
        criteria_values: dict = None
    ) -> ApprovalRequest:
        """Submit a new approval request"""
        request = self.orchestrator.submit_request(
            gate_id, requestor_id, requestor_name,
            title, description, priority, criteria_values
        )

        self.audit.record(
            gate_id=gate_id,
            request_id=request.id,
            actor_id=requestor_id,
            actor_name=requestor_name,
            action=AuditAction.REQUEST_SUBMITTED,
            details={"title": title, "priority": priority.value},
            compliance_relevant=True
        )

        return request

    def approve(
        self,
        request_id: str,
        approver_id: str,
        comment: str = ""
    ) -> ApprovalDecision:
        """Approve a request"""
        request = self.orchestrator.get_request(request_id)
        if not request:
            raise ValueError(f"Request {request_id} not found")

        gate = self.designer.get_gate(request.gate_id)
        approver = next((a for a in gate.approvers if a.id == approver_id), None)

        decision = self.orchestrator.record_decision(
            request_id, approver_id, "approved", comment
        )

        self.audit.record(
            gate_id=request.gate_id,
            request_id=request_id,
            actor_id=approver_id,
            actor_name=approver.name if approver else approver_id,
            action=AuditAction.REQUEST_APPROVED,
            details={"comment": comment},
            compliance_relevant=True
        )

        return decision

    def deny(
        self,
        request_id: str,
        approver_id: str,
        comment: str = ""
    ) -> ApprovalDecision:
        """Deny a request"""
        request = self.orchestrator.get_request(request_id)
        if not request:
            raise ValueError(f"Request {request_id} not found")

        gate = self.designer.get_gate(request.gate_id)
        approver = next((a for a in gate.approvers if a.id == approver_id), None)

        decision = self.orchestrator.record_decision(
            request_id, approver_id, "denied", comment
        )

        self.audit.record(
            gate_id=request.gate_id,
            request_id=request_id,
            actor_id=approver_id,
            actor_name=approver.name if approver else approver_id,
            action=AuditAction.REQUEST_DENIED,
            details={"comment": comment},
            compliance_relevant=True
        )

        return decision

    def grant_access(self, request_id: str, scope: list[str], hours: int = 24) -> Optional[AccessToken]:
        """Grant access for approved request"""
        token = self.access.grant_access(request_id, scope, hours)

        if token:
            request = self.orchestrator.get_request(request_id)
            self.audit.record(
                gate_id=request.gate_id,
                request_id=request_id,
                actor_id="system",
                actor_name="System",
                action=AuditAction.ACCESS_GRANTED,
                details={"token_id": token.id, "scope": scope, "duration_hours": hours},
                compliance_relevant=True
            )

        return token

    def get_gate_status(self, gate_id: str) -> dict:
        """Get comprehensive gate status"""
        gate = self.designer.get_gate(gate_id)
        if not gate:
            return {}

        pending = self.orchestrator.list_requests(gate_id=gate_id, status=RequestStatus.PENDING)
        metrics = self.metrics.calculate_metrics(
            gate_id,
            datetime.now() - timedelta(days=30),
            datetime.now()
        )

        return {
            "gate": gate,
            "pending_requests": len(pending),
            "metrics": metrics,
            "active_tokens": len(self.access.list_active_tokens())
        }

    def get_audit_trail(self, request_id: str) -> list[AuditEntry]:
        """Get audit trail for a request"""
        return self.audit.get_timeline(request_id)

    def export_report(self, gate_id: str, period: str = "monthly") -> ComplianceReport:
        """Export compliance report"""
        return self.metrics.generate_compliance_report(gate_id, period)


class GateReporter:
    """Generate visual reports for gate operations"""

    STATUS_ICONS = {
        GateStatus.OPEN: "●",
        GateStatus.CLOSED: "○",
        GateStatus.PENDING: "◐",
        GateStatus.LOCKED: "◉",
        GateStatus.BYPASSED: "◎",
        GateStatus.EXPIRED: "○",
    }

    REQUEST_ICONS = {
        RequestStatus.SUBMITTED: "○",
        RequestStatus.PENDING: "◐",
        RequestStatus.APPROVED: "●",
        RequestStatus.DENIED: "✗",
        RequestStatus.ESCALATED: "▲",
        RequestStatus.EXPIRED: "○",
        RequestStatus.WITHDRAWN: "○",
    }

    PRIORITY_ICONS = {
        Priority.CRITICAL: "!!!",
        Priority.HIGH: "!!",
        Priority.MEDIUM: "!",
        Priority.LOW: ".",
        Priority.ROUTINE: " ",
    }

    def __init__(self, engine: GateEngine):
        self.engine = engine

    def generate_gate_report(self, gate_id: str) -> str:
        """Generate comprehensive gate status report"""
        status = self.engine.get_gate_status(gate_id)
        if not status:
            return "Gate not found"

        gate = status["gate"]
        metrics = status["metrics"]
        report = []

        report.append("GATE STATUS")
        report.append("=" * 55)
        report.append(f"Gate: {gate.name}")
        report.append(f"Type: {gate.gate_type.value}")
        report.append(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        report.append("=" * 55)
        report.append("")

        # Gate Configuration
        report.append("GATE CONFIGURATION")
        report.append("-" * 40)
        report.append("+---------------------------------------------+")
        report.append("|       GATE DETAILS                          |")
        report.append("|                                             |")
        report.append(f"|  Name: {gate.name:<36}|")
        report.append(f"|  Type: {gate.gate_type.value:<36}|")
        status_icon = self.STATUS_ICONS.get(gate.status, "?")
        report.append(f"|  Status: {status_icon} {gate.status.value:<32}|")
        report.append("|                                             |")

        if gate.sla:
            sla_str = f"{gate.sla.resolution_time.total_seconds() / 3600:.0f}h"
            report.append(f"|  SLA: {sla_str:<37}|")

        report.append(f"|  Approval Type: {gate.approval_type.value:<27}|")
        report.append(f"|  Min Approvals: {gate.min_approvals:<27}|")
        report.append("|                                             |")
        report.append(f"|  Created: {gate.created_at.strftime('%Y-%m-%d'):<33}|")
        report.append(f"|  Updated: {gate.updated_at.strftime('%Y-%m-%d'):<33}|")
        report.append("+---------------------------------------------+")
        report.append("")

        # Criteria
        if gate.criteria:
            report.append("GATE CRITERIA")
            report.append("-" * 40)
            report.append("| Criterion          | Type     | Required |")
            report.append("|" + "-" * 20 + "|" + "-" * 10 + "|" + "-" * 10 + "|")
            for c in gate.criteria[:5]:
                name = c.name[:18]
                ctype = c.criterion_type.value[:8]
                req = "Yes" if c.is_mandatory else "No"
                report.append(f"| {name:<18} | {ctype:<8} | {req:<8} |")
            report.append("")

        # Approvers
        if gate.approvers:
            report.append("AUTHORIZED APPROVERS")
            report.append("-" * 40)
            report.append("| Name               | Role     | Level   |")
            report.append("|" + "-" * 20 + "|" + "-" * 10 + "|" + "-" * 9 + "|")
            for a in gate.approvers[:5]:
                name = a.name[:18]
                role = a.role[:8]
                level = f"L{a.level}"
                report.append(f"| {name:<18} | {role:<8} | {level:<7} |")
            report.append("")

        # Metrics
        report.append("GATE METRICS (Last 30 Days)")
        report.append("-" * 40)
        report.append("+---------------------------------------------+")
        report.append(f"|  Total Requests: {metrics.total_requests:<26}|")
        report.append(f"|  Approved: {metrics.approved_count:<32}|")
        report.append(f"|  Denied: {metrics.denied_count:<34}|")
        report.append(f"|  Pending: {metrics.pending_count:<33}|")
        report.append("|                                             |")

        approval_rate = metrics.approved_count / max(metrics.total_requests, 1) * 100
        approval_bar = self._make_bar(approval_rate, 100)
        report.append(f"|  Approval Rate: {approval_bar} {approval_rate:.0f}%    |")

        sla_bar = self._make_bar(metrics.sla_compliance_rate * 100, 100)
        report.append(f"|  SLA Compliance: {sla_bar} {metrics.sla_compliance_rate:.0%}   |")

        avg_hours = metrics.avg_approval_time.total_seconds() / 3600
        report.append(f"|  Avg Approval Time: {avg_hours:.1f}h                    |")
        report.append("|                                             |")
        report.append("+---------------------------------------------+")
        report.append("")

        report.append(f"Status: {status_icon} Gate {gate.status.value.upper()}")

        return '\n'.join(report)

    def generate_request_report(self, request_id: str) -> str:
        """Generate request status report"""
        request = self.engine.orchestrator.get_request(request_id)
        if not request:
            return "Request not found"

        gate = self.engine.designer.get_gate(request.gate_id)
        report = []

        report.append("REQUEST STATUS")
        report.append("=" * 55)
        report.append(f"Request: {request.id}")
        report.append(f"Gate: {gate.name if gate else request.gate_id}")
        report.append(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        report.append("=" * 55)
        report.append("")

        # Request Details
        report.append("REQUEST DETAILS")
        report.append("-" * 40)
        report.append("+---------------------------------------------+")
        report.append(f"|  Title: {request.title[:35]:<35}|")
        report.append("|                                             |")

        # Wrap description
        desc_words = request.description.split()
        lines = []
        current = []
        for word in desc_words:
            current.append(word)
            if len(' '.join(current)) > 40:
                lines.append(' '.join(current[:-1]))
                current = [word]
        if current:
            lines.append(' '.join(current))

        for line in lines[:3]:
            report.append(f"|  {line:<41}|")

        report.append("|                                             |")
        report.append(f"|  Requestor: {request.requestor_name:<31}|")
        report.append(f"|  Submitted: {request.submitted_at.strftime('%Y-%m-%d %H:%M'):<31}|")

        priority_icon = self.PRIORITY_ICONS.get(request.priority, "")
        report.append(f"|  Priority: {priority_icon} {request.priority.value:<31}|")

        status_icon = self.REQUEST_ICONS.get(request.status, "?")
        report.append(f"|  Status: {status_icon} {request.status.value:<33}|")
        report.append("+---------------------------------------------+")
        report.append("")

        # Criteria Results
        if request.criteria_results:
            report.append("CRITERIA CHECK")
            report.append("-" * 40)
            report.append("| Criterion          | Expected | Status  |")
            report.append("|" + "-" * 20 + "|" + "-" * 10 + "|" + "-" * 9 + "|")
            for cr in request.criteria_results[:5]:
                name = cr.criterion_name[:18]
                expected = str(cr.expected)[:8]
                status = "●" if cr.passed else "○"
                report.append(f"| {name:<18} | {expected:<8} | {status:<7} |")

            all_passed = all(cr.passed for cr in request.criteria_results)
            report.append("")
            report.append(f"All Criteria Met: {'Yes' if all_passed else 'No'}")
            report.append("")

        # Approval Chain
        if gate and gate.approvers:
            report.append("APPROVAL CHAIN")
            report.append("-" * 40)
            report.append("+---------------------------------------------+")
            report.append("|  Approval Flow:                             |")
            report.append("|                                             |")

            for i, approver in enumerate(gate.approvers, 1):
                if approver.id in request.approved_by:
                    status = "● approved"
                elif approver.id in request.denied_by:
                    status = "✗ denied"
                else:
                    status = "○ pending"
                report.append(f"|  {i}. {approver.name:<20}                  |")
                report.append(f"|     Status: {status:<30}|")
                report.append("|                                             |")

            progress = len(request.approved_by) + len(request.denied_by)
            total = len(gate.approvers)
            progress_bar = self._make_bar(progress, total)
            report.append(f"|  Progress: {progress_bar} {progress}/{total}       |")
            report.append("+---------------------------------------------+")
            report.append("")

        # Decision
        report.append("DECISION")
        report.append("-" * 40)
        report.append("+---------------------------------------------+")
        report.append(f"|  Final Decision: {request.status.value.upper():<26}|")
        report.append("|                                             |")

        if request.completed_at:
            report.append(f"|  Decision Time: {request.completed_at.strftime('%Y-%m-%d %H:%M'):<27}|")
        else:
            report.append(f"|  Decision Time: Pending                     |")

        report.append("+---------------------------------------------+")
        report.append("")

        # Audit Trail
        audit = self.engine.get_audit_trail(request_id)
        if audit:
            report.append("AUDIT TRAIL")
            report.append("-" * 40)
            report.append("| Time       | Actor      | Action         |")
            report.append("|" + "-" * 12 + "|" + "-" * 12 + "|" + "-" * 16 + "|")
            for entry in audit[:5]:
                time = entry.timestamp.strftime('%H:%M')
                actor = entry.actor_name[:10]
                action = entry.action.value[:14]
                report.append(f"| {time:<10} | {actor:<10} | {action:<14} |")
            report.append("")
            report.append(f"Audit ID: {audit[0].id if audit else 'N/A'}")

        return '\n'.join(report)

    def _make_bar(self, value: float, max_val: float, width: int = 10) -> str:
        """Create a visual progress bar"""
        if max_val == 0:
            return "░" * width
        filled = int((value / max_val) * width)
        empty = width - filled
        return "█" * filled + "░" * empty


# CLI Interface
async def main():
    """CLI entry point for GATE.EXE"""
    import argparse

    parser = argparse.ArgumentParser(
        description="GATE.EXE - Access & Approval Gate Agent"
    )
    subparsers = parser.add_subparsers(dest='command', help='Commands')

    # Create gate command
    create_parser = subparsers.add_parser('create', help='Create a new gate')
    create_parser.add_argument('name', help='Gate name')
    create_parser.add_argument('--type', choices=['access', 'approval', 'release', 'quality', 'compliance'],
                               default='approval', help='Gate type')
    create_parser.add_argument('--description', default='', help='Gate description')

    # Status command
    status_parser = subparsers.add_parser('status', help='Check gate status')
    status_parser.add_argument('gate_id', help='Gate ID')

    # Submit command
    submit_parser = subparsers.add_parser('submit', help='Submit approval request')
    submit_parser.add_argument('gate_id', help='Gate ID')
    submit_parser.add_argument('--title', required=True, help='Request title')
    submit_parser.add_argument('--description', default='', help='Request description')
    submit_parser.add_argument('--priority', choices=['critical', 'high', 'medium', 'low', 'routine'],
                               default='medium', help='Request priority')
    submit_parser.add_argument('--requestor', default='user', help='Requestor ID')

    # Approve command
    approve_parser = subparsers.add_parser('approve', help='Approve request')
    approve_parser.add_argument('request_id', help='Request ID')
    approve_parser.add_argument('--approver', required=True, help='Approver ID')
    approve_parser.add_argument('--comment', default='', help='Approval comment')

    # Deny command
    deny_parser = subparsers.add_parser('deny', help='Deny request')
    deny_parser.add_argument('request_id', help='Request ID')
    deny_parser.add_argument('--approver', required=True, help='Approver ID')
    deny_parser.add_argument('--comment', default='', help='Denial reason')

    # Request status command
    request_parser = subparsers.add_parser('request', help='Get request status')
    request_parser.add_argument('request_id', help='Request ID')

    # Audit command
    audit_parser = subparsers.add_parser('audit', help='View audit log')
    audit_parser.add_argument('gate_id', help='Gate ID')
    audit_parser.add_argument('--limit', type=int, default=10, help='Number of entries')

    # Report command
    report_parser = subparsers.add_parser('report', help='Generate compliance report')
    report_parser.add_argument('gate_id', help='Gate ID')
    report_parser.add_argument('--period', choices=['daily', 'weekly', 'monthly', 'quarterly'],
                               default='monthly', help='Report period')

    # List command
    list_parser = subparsers.add_parser('list', help='List gates or requests')
    list_parser.add_argument('what', choices=['gates', 'requests', 'tokens'], help='What to list')
    list_parser.add_argument('--gate', help='Filter by gate ID')
    list_parser.add_argument('--status', help='Filter by status')

    args = parser.parse_args()

    engine = GateEngine()
    reporter = GateReporter(engine)

    if args.command == 'create':
        gate_type = GateType(args.type)
        gate = engine.create_gate(args.name, gate_type, args.description)

        # Add default criterion and approver for demo
        engine.designer.add_criterion(
            gate.id, "approval_required", CriterionType.BOOLEAN, True, "eq",
            "Requires approval", True
        )
        engine.designer.add_approver(
            gate.id, "approver1", "Default Approver", "approver@example.com",
            "Approver", "Operations", 1
        )
        engine.designer.activate_gate(gate.id)

        print(f"\nGate Created: {gate.id}")
        print(f"Name: {gate.name}")
        print(f"Type: {gate.gate_type.value}")
        print(f"Status: {gate.status.value}")

    elif args.command == 'status':
        report = reporter.generate_gate_report(args.gate_id)
        print(report)

    elif args.command == 'submit':
        priority = Priority(args.priority)
        request = engine.submit_request(
            args.gate_id,
            args.requestor,
            args.requestor,
            args.title,
            args.description,
            priority
        )
        print(f"\nRequest Submitted: {request.id}")
        print(f"Status: {request.status.value}")

    elif args.command == 'approve':
        decision = engine.approve(args.request_id, args.approver, args.comment)
        request = engine.orchestrator.get_request(args.request_id)
        print(f"\nApproval Recorded")
        print(f"Request: {args.request_id}")
        print(f"New Status: {request.status.value}")

    elif args.command == 'deny':
        decision = engine.deny(args.request_id, args.approver, args.comment)
        request = engine.orchestrator.get_request(args.request_id)
        print(f"\nDenial Recorded")
        print(f"Request: {args.request_id}")
        print(f"New Status: {request.status.value}")

    elif args.command == 'request':
        report = reporter.generate_request_report(args.request_id)
        print(report)

    elif args.command == 'audit':
        entries = engine.audit.query(gate_id=args.gate_id)[:args.limit]
        print(f"\nAudit Log for {args.gate_id}")
        print("=" * 60)
        for entry in entries:
            print(f"{entry.timestamp.strftime('%Y-%m-%d %H:%M')} | {entry.actor_name:<12} | {entry.action.value}")

    elif args.command == 'report':
        report = engine.export_report(args.gate_id, args.period)
        print(f"\nCompliance Report: {report.report_id}")
        print("=" * 60)
        print(f"Period: {report.period}")
        print(f"Total Transactions: {report.total_transactions}")
        print(f"Compliance Rate: {report.compliance_rate:.1%}")
        print(f"\nIssues: {len(report.issues)}")
        for issue in report.issues:
            print(f"  - [{issue['severity']}] {issue['message']}")
        print(f"\nRecommendations:")
        for rec in report.recommendations:
            print(f"  - {rec}")

    elif args.command == 'list':
        if args.what == 'gates':
            gates = engine.designer.list_gates()
            print("\nGates:")
            print("-" * 50)
            for gate in gates:
                icon = reporter.STATUS_ICONS.get(gate.status, "?")
                print(f"{icon} {gate.id}: {gate.name} ({gate.gate_type.value})")

        elif args.what == 'requests':
            requests = engine.orchestrator.list_requests(gate_id=args.gate)
            print("\nRequests:")
            print("-" * 50)
            for req in requests:
                icon = reporter.REQUEST_ICONS.get(req.status, "?")
                print(f"{icon} {req.id}: {req.title} ({req.status.value})")

        elif args.what == 'tokens':
            tokens = engine.access.list_active_tokens()
            print("\nActive Tokens:")
            print("-" * 50)
            for token in tokens:
                print(f"{token.id}: {token.holder_id} (expires: {token.expires_at.strftime('%Y-%m-%d %H:%M')})")

    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## USAGE EXAMPLES

### Create and Configure a Gate
```python
import asyncio
from gate_engine import GateEngine, GateType, CriterionType, ApprovalType

async def setup_release_gate():
    engine = GateEngine()

    # Create release gate
    gate = engine.create_gate(
        name="Production Deployment",
        gate_type=GateType.RELEASE,
        description="Gate for production deployments"
    )

    # Add criteria
    engine.designer.add_criterion(
        gate.id, "tests_passed", CriterionType.BOOLEAN, True, "eq",
        "All tests must pass", True
    )
    engine.designer.add_criterion(
        gate.id, "code_coverage", CriterionType.NUMERIC, 80, "gte",
        "Code coverage must be >= 80%", True
    )
    engine.designer.add_criterion(
        gate.id, "security_scan", CriterionType.BOOLEAN, True, "eq",
        "Security scan must pass", True
    )

    # Add approvers
    engine.designer.add_approver(
        gate.id, "tech-lead", "Tech Lead", "tech@example.com",
        "Technical Lead", "Engineering", 1
    )
    engine.designer.add_approver(
        gate.id, "qa-lead", "QA Lead", "qa@example.com",
        "QA Lead", "Quality", 1
    )

    # Configure approval flow
    engine.designer.configure_approval_flow(
        gate.id, ApprovalType.SEQUENTIAL, min_approvals=2
    )

    # Set SLA
    engine.designer.set_sla(gate.id, response_hours=2, resolution_hours=8)

    # Activate
    engine.designer.activate_gate(gate.id)

    print(f"Gate created and activated: {gate.id}")
    return gate

asyncio.run(setup_release_gate())
```

### Submit and Process Request
```python
async def process_deployment_request():
    engine = GateEngine()

    # Assume gate is already set up
    gate_id = "GATE-0001"

    # Submit request with criteria values
    request = engine.submit_request(
        gate_id=gate_id,
        requestor_id="dev-123",
        requestor_name="John Developer",
        title="Deploy v2.1.0 to Production",
        description="Release includes new payment features and bug fixes",
        priority=Priority.HIGH,
        criteria_values={
            "tests_passed": True,
            "code_coverage": 85,
            "security_scan": True
        }
    )

    print(f"Request submitted: {request.id}")
    print(f"Criteria results:")
    for cr in request.criteria_results:
        status = "✓" if cr.passed else "✗"
        print(f"  {status} {cr.criterion_name}: {cr.actual}")

    # First approver approves
    engine.approve(request.id, "tech-lead", "Code looks good, approved")

    # Check status
    request = engine.orchestrator.get_request(request.id)
    print(f"\nAfter tech lead approval: {request.status.value}")

    # Second approver approves
    engine.approve(request.id, "qa-lead", "QA verified, approved")

    # Check final status
    request = engine.orchestrator.get_request(request.id)
    print(f"Final status: {request.status.value}")

    # Grant access if approved
    if request.status == RequestStatus.APPROVED:
        token = engine.grant_access(
            request.id,
            scope=["deploy:production", "rollback:production"],
            hours=4
        )
        print(f"\nAccess token granted: {token.id}")
        print(f"Scope: {token.scope}")
        print(f"Expires: {token.expires_at}")

asyncio.run(process_deployment_request())
```

### Generate Reports
```python
async def generate_reports():
    engine = GateEngine()
    reporter = GateReporter(engine)

    gate_id = "GATE-0001"

    # Generate gate status report
    report = reporter.generate_gate_report(gate_id)
    print(report)

    # Generate compliance report
    compliance = engine.export_report(gate_id, "monthly")
    print(f"\nCompliance Report: {compliance.report_id}")
    print(f"Compliance Rate: {compliance.compliance_rate:.1%}")
    print(f"Issues Found: {len(compliance.issues)}")

    for issue in compliance.issues:
        print(f"  [{issue['severity']}] {issue['message']}")

asyncio.run(generate_reports())
```

### Audit Trail Query
```python
async def query_audit():
    engine = GateEngine()

    # Query all approval actions
    entries = engine.audit.query(
        action=AuditAction.REQUEST_APPROVED,
        start_time=datetime.now() - timedelta(days=7)
    )

    print("Recent Approvals (Last 7 Days):")
    print("-" * 60)
    for entry in entries:
        print(f"{entry.timestamp.strftime('%Y-%m-%d %H:%M')} - {entry.actor_name}")
        print(f"  Request: {entry.request_id}")
        print(f"  Details: {entry.details}")
        print()

    # Export compliance log
    log = engine.audit.export_compliance_log(
        "GATE-0001",
        datetime.now() - timedelta(days=30),
        datetime.now()
    )

    print(f"\nCompliance Log Entries: {len(log)}")

asyncio.run(query_audit())
```

---

## OUTPUT FORMAT

```
GATE STATUS
═══════════════════════════════════════════════════════
Gate: [gate_name]
Type: [access/approval/release]
Date: [timestamp]
═══════════════════════════════════════════════════════

GATE CONFIGURATION
────────────────────────────────────────
┌─────────────────────────────────────────────┐
│       GATE DETAILS                          │
│                                             │
│  Name: [gate_name]                          │
│  Type: [gate_type]                          │
│  Status: [●/◐/○] [open/pending/closed]      │
│                                             │
│  SLA: [duration]                            │
│  Approval Type: [sequential/parallel]       │
│  Min Approvals: [count]                     │
│                                             │
│  Created: [timestamp]                       │
│  Updated: [timestamp]                       │
└─────────────────────────────────────────────┘

GATE CRITERIA
────────────────────────────────────────
| Criterion          | Type     | Required |
|--------------------|----------|----------|
| [criterion_1]      | [type]   | [Yes/No] |
| [criterion_2]      | [type]   | [Yes/No] |

AUTHORIZED APPROVERS
────────────────────────────────────────
| Name               | Role     | Level   |
|--------------------|----------|---------|
| [approver_1]       | [role]   | L[n]    |
| [approver_2]       | [role]   | L[n]    |

GATE METRICS (Last 30 Days)
────────────────────────────────────────
┌─────────────────────────────────────────────┐
│  Total Requests: [count]                    │
│  Approved: [count]                          │
│  Denied: [count]                            │
│  Pending: [count]                           │
│                                             │
│  Approval Rate: ████████░░ [X]%             │
│  SLA Compliance: █████████░ [X]%            │
│  Avg Approval Time: [X]h                    │
└─────────────────────────────────────────────┘

Status: ● Gate OPEN
```

---

## QUICK COMMANDS

- `/launch-gate create [name]` - Create new gate
- `/launch-gate status [id]` - Check gate status
- `/launch-gate submit [gate] --title [title]` - Submit request
- `/launch-gate approve [request] --approver [id]` - Approve request
- `/launch-gate deny [request] --approver [id]` - Deny request
- `/launch-gate audit [gate]` - View audit log
- `/launch-gate report [gate]` - Generate compliance report

$ARGUMENTS
