# TOOLING.GOVERNANCE.OS.EXE - Tool Adoption & Oversight Architect

You are TOOLING.GOVERNANCE.OS.EXE — a tooling oversight and approval architect.

MISSION
Control tool adoption without slowing innovation. Enable speed with guardrails, prevent sprawl with visibility.

---

## CAPABILITIES

### IntakeEngine.MOD
- Tool request workflow
- Use case validation
- Sponsor identification
- Urgency classification
- Duplicate detection

### EvaluationFramework.MOD
- Security assessment
- Compliance review
- Integration analysis
- Cost evaluation
- Risk scoring

### ApprovalArchitect.MOD
- Tier-based approval
- Escalation paths
- Conditional approvals
- Exception handling
- Fast-track criteria

### LifecycleManager.MOD
- Usage monitoring
- License optimization
- Renewal management
- Sunset planning
- Consolidation tracking

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
TOOLING.GOVERNANCE.OS.EXE - Tool Adoption & Oversight Engine
Production-ready implementation for enterprise tooling governance
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any, Set
from enum import Enum
from datetime import datetime, timedelta
import hashlib
import json


# ════════════════════════════════════════════════════════════════════════════════
# ENUMS - Tool Governance Classifications
# ════════════════════════════════════════════════════════════════════════════════

class ToolTier(Enum):
    """Tool approval tier classification"""
    TIER_1 = "tier_1"  # Critical - CISO + Legal + CFO
    TIER_2 = "tier_2"  # High - Security + Manager
    TIER_3 = "tier_3"  # Medium - Manager + IT
    TIER_4 = "tier_4"  # Low - Self-service

    @property
    def approvers(self) -> List[str]:
        """Required approvers for tier"""
        approver_map = {
            "tier_1": ["ciso", "legal", "cfo", "cio"],
            "tier_2": ["security_lead", "director"],
            "tier_3": ["manager", "it_admin"],
            "tier_4": []
        }
        return approver_map.get(self.value, [])

    @property
    def sla_days(self) -> int:
        """SLA in business days"""
        sla_map = {
            "tier_1": 10,
            "tier_2": 5,
            "tier_3": 3,
            "tier_4": 0
        }
        return sla_map.get(self.value, 5)

    @property
    def requires_security_review(self) -> bool:
        """Whether security review is mandatory"""
        return self.value in ["tier_1", "tier_2"]


class RequestStatus(Enum):
    """Tool request status"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    ON_HOLD = "on_hold"

    @property
    def is_terminal(self) -> bool:
        """Whether status is final"""
        return self.value in ["approved", "rejected", "withdrawn"]

    @property
    def can_edit(self) -> bool:
        """Whether request can be edited"""
        return self.value in ["draft", "on_hold"]

    @property
    def next_states(self) -> List[str]:
        """Valid next states"""
        transitions = {
            "draft": ["submitted", "withdrawn"],
            "submitted": ["in_review", "withdrawn"],
            "in_review": ["pending_approval", "rejected", "on_hold"],
            "pending_approval": ["approved", "rejected", "on_hold"],
            "on_hold": ["in_review", "withdrawn"],
            "approved": [],
            "rejected": [],
            "withdrawn": []
        }
        return transitions.get(self.value, [])


class SecurityCriterion(Enum):
    """Security assessment criteria"""
    SOC2_TYPE_II = "soc2_type_ii"
    ENCRYPTION_REST = "encryption_rest"
    ENCRYPTION_TRANSIT = "encryption_transit"
    SSO_SAML = "sso_saml"
    MFA_SUPPORT = "mfa_support"
    DATA_RESIDENCY = "data_residency"
    PENTEST_RESULTS = "pentest_results"
    INCIDENT_SLA = "incident_sla"

    @property
    def weight(self) -> str:
        """Criterion weight"""
        weights = {
            "soc2_type_ii": "critical",
            "encryption_rest": "critical",
            "encryption_transit": "critical",
            "sso_saml": "high",
            "mfa_support": "high",
            "data_residency": "medium",
            "pentest_results": "medium",
            "incident_sla": "medium"
        }
        return weights.get(self.value, "medium")

    @property
    def is_mandatory(self) -> bool:
        """Whether criterion is mandatory for approval"""
        return self.weight == "critical"


class ComplianceRegulation(Enum):
    """Compliance regulations"""
    GDPR = "gdpr"
    CCPA = "ccpa"
    HIPAA = "hipaa"
    SOX = "sox"
    PCI_DSS = "pci_dss"
    INDUSTRY_SPECIFIC = "industry_specific"

    @property
    def data_types_affected(self) -> List[str]:
        """Data types under regulation"""
        data_map = {
            "gdpr": ["pii", "personal_data", "behavioral"],
            "ccpa": ["pii", "personal_data", "consumer_data"],
            "hipaa": ["phi", "health_records", "medical"],
            "sox": ["financial", "audit", "controls"],
            "pci_dss": ["payment", "card_data", "financial"],
            "industry_specific": ["varies"]
        }
        return data_map.get(self.value, [])

    @property
    def review_frequency(self) -> str:
        """How often compliance must be reviewed"""
        frequencies = {
            "gdpr": "annual",
            "ccpa": "annual",
            "hipaa": "annual",
            "sox": "quarterly",
            "pci_dss": "quarterly",
            "industry_specific": "as_needed"
        }
        return frequencies.get(self.value, "annual")


class IntegrationComplexity(Enum):
    """Integration complexity levels"""
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

    @property
    def review_days(self) -> int:
        """Additional review days for complexity"""
        days = {
            "none": 0,
            "low": 1,
            "medium": 2,
            "high": 5,
            "critical": 10
        }
        return days.get(self.value, 2)

    @property
    def requires_architecture_review(self) -> bool:
        """Whether architecture team review needed"""
        return self.value in ["high", "critical"]


class UsageStatus(Enum):
    """Tool usage status"""
    ACTIVE = "active"
    UNDERUTILIZED = "underutilized"
    ABANDONED = "abandoned"
    OVERUTILIZED = "overutilized"
    SUNSET_PLANNED = "sunset_planned"
    DECOMMISSIONED = "decommissioned"

    @property
    def action_required(self) -> Optional[str]:
        """Action required for status"""
        actions = {
            "active": None,
            "underutilized": "review_licenses",
            "abandoned": "decommission_review",
            "overutilized": "capacity_review",
            "sunset_planned": "migration_planning",
            "decommissioned": None
        }
        return actions.get(self.value)

    @property
    def alert_level(self) -> str:
        """Alert level for status"""
        levels = {
            "active": "none",
            "underutilized": "warning",
            "abandoned": "warning",
            "overutilized": "info",
            "sunset_planned": "info",
            "decommissioned": "none"
        }
        return levels.get(self.value, "none")


class SunsetTrigger(Enum):
    """Triggers for tool sunset"""
    LOW_USAGE = "low_usage"
    SECURITY_ISSUE = "security_issue"
    VENDOR_EOL = "vendor_eol"
    DUPLICATE_FUNCTION = "duplicate_function"
    COST_NOT_JUSTIFIED = "cost_not_justified"
    STRATEGIC_CHANGE = "strategic_change"

    @property
    def urgency(self) -> str:
        """Urgency level for trigger"""
        urgency_map = {
            "low_usage": "low",
            "security_issue": "critical",
            "vendor_eol": "high",
            "duplicate_function": "medium",
            "cost_not_justified": "medium",
            "strategic_change": "high"
        }
        return urgency_map.get(self.value, "medium")

    @property
    def notification_days(self) -> int:
        """Days notice required for sunset"""
        notice = {
            "low_usage": 90,
            "security_issue": 7,
            "vendor_eol": 180,
            "duplicate_function": 90,
            "cost_not_justified": 60,
            "strategic_change": 90
        }
        return notice.get(self.value, 90)


class CostCategory(Enum):
    """Tool cost categories"""
    FREE = "free"
    UNDER_1K = "under_1k"
    BETWEEN_1K_10K = "1k_10k"
    BETWEEN_10K_50K = "10k_50k"
    OVER_50K = "over_50k"

    @property
    def tier_implication(self) -> ToolTier:
        """Implied approval tier"""
        tier_map = {
            "free": ToolTier.TIER_4,
            "under_1k": ToolTier.TIER_4,
            "1k_10k": ToolTier.TIER_3,
            "10k_50k": ToolTier.TIER_2,
            "over_50k": ToolTier.TIER_1
        }
        return tier_map.get(self.value, ToolTier.TIER_3)

    @property
    def requires_budget_approval(self) -> bool:
        """Whether budget approval needed"""
        return self.value in ["10k_50k", "over_50k"]


class UserScope(Enum):
    """Tool user scope"""
    INDIVIDUAL = "individual"
    TEAM = "team"
    DEPARTMENT = "department"
    ORG_WIDE = "org_wide"

    @property
    def tier_implication(self) -> ToolTier:
        """Implied approval tier"""
        tier_map = {
            "individual": ToolTier.TIER_4,
            "team": ToolTier.TIER_3,
            "department": ToolTier.TIER_2,
            "org_wide": ToolTier.TIER_1
        }
        return tier_map.get(self.value, ToolTier.TIER_3)


class AuditAction(Enum):
    """Audit log action types"""
    REQUEST_CREATED = "request_created"
    REQUEST_UPDATED = "request_updated"
    STATUS_CHANGED = "status_changed"
    APPROVAL_GIVEN = "approval_given"
    APPROVAL_DENIED = "approval_denied"
    TOOL_PROVISIONED = "tool_provisioned"
    TOOL_SUNSET = "tool_sunset"
    LICENSE_UPDATED = "license_updated"

    @property
    def retention_days(self) -> int:
        """Retention period in days"""
        retention = {
            "request_created": 365,
            "request_updated": 365,
            "status_changed": 365,
            "approval_given": 730,
            "approval_denied": 730,
            "tool_provisioned": 1095,
            "tool_sunset": 1095,
            "license_updated": 365
        }
        return retention.get(self.value, 365)


# ════════════════════════════════════════════════════════════════════════════════
# DATACLASSES - Core Governance Models
# ════════════════════════════════════════════════════════════════════════════════

@dataclass
class ToolRequest:
    """Tool adoption request"""
    request_id: str
    tool_name: str
    vendor: str
    requestor_id: str
    sponsor_id: str
    business_need: str
    estimated_users: int
    user_scope: UserScope
    cost_estimate: float
    cost_category: CostCategory
    data_types_handled: List[str] = field(default_factory=list)
    integrations_needed: List[str] = field(default_factory=list)
    alternatives_considered: List[str] = field(default_factory=list)
    status: RequestStatus = RequestStatus.DRAFT
    tier: Optional[ToolTier] = None
    created_at: datetime = field(default_factory=datetime.now)
    submitted_at: Optional[datetime] = None

    def calculate_tier(self) -> ToolTier:
        """Calculate approval tier based on factors"""
        # Start with cost-based tier
        tier_score = self.cost_category.tier_implication.value

        # Adjust for user scope
        scope_tier = self.user_scope.tier_implication.value
        if scope_tier < tier_score:
            tier_score = scope_tier

        # Check for sensitive data
        sensitive_data = ["pii", "phi", "financial", "credentials"]
        if any(d in self.data_types_handled for d in sensitive_data):
            tier_score = min(tier_score, "tier_2")

        # Check for critical integrations
        if len(self.integrations_needed) > 3:
            tier_score = min(tier_score, "tier_2")

        return ToolTier(tier_score)

    def submit(self) -> bool:
        """Submit request for review"""
        if self.status != RequestStatus.DRAFT:
            return False

        self.tier = self.calculate_tier()
        self.status = RequestStatus.SUBMITTED
        self.submitted_at = datetime.now()
        return True

    def get_sla_deadline(self) -> Optional[datetime]:
        """Calculate SLA deadline"""
        if not self.submitted_at or not self.tier:
            return None

        business_days = self.tier.sla_days
        deadline = self.submitted_at

        while business_days > 0:
            deadline += timedelta(days=1)
            if deadline.weekday() < 5:  # Mon-Fri
                business_days -= 1

        return deadline


@dataclass
class SecurityAssessment:
    """Security assessment results"""
    assessment_id: str
    request_id: str
    assessor_id: str
    criteria_results: Dict[str, bool] = field(default_factory=dict)
    notes: Dict[str, str] = field(default_factory=dict)
    overall_pass: bool = False
    critical_failures: List[str] = field(default_factory=list)
    conditions: List[str] = field(default_factory=list)
    assessed_at: datetime = field(default_factory=datetime.now)

    def evaluate(self) -> bool:
        """Evaluate assessment results"""
        self.critical_failures = []

        for criterion in SecurityCriterion:
            result = self.criteria_results.get(criterion.value, False)
            if criterion.is_mandatory and not result:
                self.critical_failures.append(criterion.value)

        self.overall_pass = len(self.critical_failures) == 0
        return self.overall_pass

    def get_score(self) -> int:
        """Calculate security score (0-100)"""
        if not self.criteria_results:
            return 0

        passed = sum(1 for v in self.criteria_results.values() if v)
        total = len(self.criteria_results)
        return int(passed / total * 100)


@dataclass
class ComplianceReview:
    """Compliance review results"""
    review_id: str
    request_id: str
    reviewer_id: str
    applicable_regulations: List[ComplianceRegulation] = field(default_factory=list)
    compliance_status: Dict[str, bool] = field(default_factory=dict)
    gaps_identified: List[str] = field(default_factory=list)
    remediation_required: List[str] = field(default_factory=list)
    reviewed_at: datetime = field(default_factory=datetime.now)

    def is_compliant(self) -> bool:
        """Check if compliant with all applicable regulations"""
        for reg in self.applicable_regulations:
            if not self.compliance_status.get(reg.value, False):
                return False
        return True

    def get_gap_count(self) -> int:
        """Get number of compliance gaps"""
        return len(self.gaps_identified)


@dataclass
class IntegrationAnalysis:
    """Integration analysis results"""
    analysis_id: str
    request_id: str
    analyst_id: str
    integration_points: List[Dict[str, Any]] = field(default_factory=list)
    overall_complexity: IntegrationComplexity = IntegrationComplexity.MEDIUM
    risks_identified: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    estimated_effort_hours: int = 0
    analyzed_at: datetime = field(default_factory=datetime.now)

    def calculate_complexity(self) -> IntegrationComplexity:
        """Calculate overall integration complexity"""
        if not self.integration_points:
            return IntegrationComplexity.NONE

        high_risk_count = len(self.risks_identified)
        point_count = len(self.integration_points)

        if high_risk_count > 3 or point_count > 5:
            return IntegrationComplexity.CRITICAL
        elif high_risk_count > 1 or point_count > 3:
            return IntegrationComplexity.HIGH
        elif point_count > 1:
            return IntegrationComplexity.MEDIUM
        else:
            return IntegrationComplexity.LOW


@dataclass
class Approval:
    """Approval record"""
    approval_id: str
    request_id: str
    approver_id: str
    approver_role: str
    decision: str  # approved, rejected, conditional
    conditions: List[str] = field(default_factory=list)
    rationale: str = ""
    approved_at: datetime = field(default_factory=datetime.now)

    def is_approved(self) -> bool:
        """Check if approval is positive"""
        return self.decision in ["approved", "conditional"]


@dataclass
class ManagedTool:
    """Tool in portfolio under governance"""
    tool_id: str
    name: str
    vendor: str
    request_id: str
    tier: ToolTier
    owner_id: str
    status: UsageStatus = UsageStatus.ACTIVE
    licenses_purchased: int = 0
    licenses_used: int = 0
    monthly_cost: float = 0.0
    annual_cost: float = 0.0
    provisioned_at: datetime = field(default_factory=datetime.now)
    next_renewal: Optional[datetime] = None
    sunset_date: Optional[datetime] = None

    def get_utilization(self) -> float:
        """Calculate license utilization percentage"""
        if self.licenses_purchased == 0:
            return 0.0
        return self.licenses_used / self.licenses_purchased * 100

    def update_status(self) -> UsageStatus:
        """Update usage status based on metrics"""
        utilization = self.get_utilization()

        if utilization < 30:
            self.status = UsageStatus.ABANDONED
        elif utilization < 60:
            self.status = UsageStatus.UNDERUTILIZED
        elif utilization > 95:
            self.status = UsageStatus.OVERUTILIZED
        else:
            self.status = UsageStatus.ACTIVE

        return self.status

    def days_until_renewal(self) -> Optional[int]:
        """Days until renewal"""
        if not self.next_renewal:
            return None
        delta = self.next_renewal - datetime.now()
        return max(0, delta.days)


@dataclass
class SunsetPlan:
    """Tool sunset/decommission plan"""
    plan_id: str
    tool_id: str
    trigger: SunsetTrigger
    target_date: datetime
    migration_tool: Optional[str] = None
    affected_users: int = 0
    data_export_required: bool = False
    data_archive_location: Optional[str] = None
    notification_sent: bool = False
    access_revoked: bool = False
    contract_terminated: bool = False
    created_at: datetime = field(default_factory=datetime.now)

    def get_stages(self) -> List[Dict[str, Any]]:
        """Get sunset stages with dates"""
        notice_days = self.trigger.notification_days

        notification_date = self.target_date - timedelta(days=notice_days)
        export_date = self.target_date - timedelta(days=30)
        revocation_date = self.target_date - timedelta(days=7)

        return [
            {"stage": "notification", "date": notification_date, "done": self.notification_sent},
            {"stage": "data_export", "date": export_date, "done": self.data_archive_location is not None},
            {"stage": "access_revocation", "date": revocation_date, "done": self.access_revoked},
            {"stage": "contract_termination", "date": self.target_date, "done": self.contract_terminated}
        ]

    def is_complete(self) -> bool:
        """Check if sunset is complete"""
        return all([
            self.notification_sent,
            self.access_revoked,
            self.contract_terminated,
            not self.data_export_required or self.data_archive_location is not None
        ])


@dataclass
class AuditEntry:
    """Audit log entry"""
    entry_id: str
    action: AuditAction
    actor_id: str
    resource_type: str
    resource_id: str
    details: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)

    def get_retention_date(self) -> datetime:
        """Calculate retention expiry"""
        return self.timestamp + timedelta(days=self.action.retention_days)


# ════════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - Business Logic Implementation
# ════════════════════════════════════════════════════════════════════════════════

class IntakeEngine:
    """Manages tool request intake process"""

    # Duplicate detection keywords
    TOOL_CATEGORIES = {
        "project_management": ["jira", "asana", "monday", "trello", "linear"],
        "communication": ["slack", "teams", "discord", "zoom", "meet"],
        "crm": ["salesforce", "hubspot", "pipedrive", "zoho"],
        "code_hosting": ["github", "gitlab", "bitbucket", "azure_devops"],
        "monitoring": ["datadog", "newrelic", "splunk", "grafana"],
        "analytics": ["amplitude", "mixpanel", "google_analytics", "heap"]
    }

    def __init__(self):
        self.requests: Dict[str, ToolRequest] = {}

    def create_request(self, tool_name: str, requestor_id: str,
                       sponsor_id: str, business_need: str,
                       **kwargs) -> ToolRequest:
        """Create new tool request"""
        request_id = hashlib.sha256(
            f"req:{tool_name}:{requestor_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        request = ToolRequest(
            request_id=request_id,
            tool_name=tool_name,
            vendor=kwargs.get("vendor", "unknown"),
            requestor_id=requestor_id,
            sponsor_id=sponsor_id,
            business_need=business_need,
            estimated_users=kwargs.get("estimated_users", 1),
            user_scope=kwargs.get("user_scope", UserScope.INDIVIDUAL),
            cost_estimate=kwargs.get("cost_estimate", 0.0),
            cost_category=kwargs.get("cost_category", CostCategory.FREE),
            data_types_handled=kwargs.get("data_types_handled", []),
            integrations_needed=kwargs.get("integrations_needed", []),
            alternatives_considered=kwargs.get("alternatives_considered", [])
        )

        self.requests[request_id] = request
        return request

    def check_duplicates(self, tool_name: str) -> List[str]:
        """Check for duplicate or similar tools"""
        duplicates = []
        tool_lower = tool_name.lower()

        # Check against known categories
        for category, tools in self.TOOL_CATEGORIES.items():
            if tool_lower in tools:
                # Find other tools in same category
                for existing_id, existing in self.requests.items():
                    if existing.tool_name.lower() in tools and existing.tool_name.lower() != tool_lower:
                        if existing.status in [RequestStatus.APPROVED]:
                            duplicates.append(existing.tool_name)

        return duplicates

    def submit_request(self, request_id: str) -> bool:
        """Submit request for review"""
        request = self.requests.get(request_id)
        if not request:
            return False

        return request.submit()

    def get_requests_by_status(self, status: RequestStatus) -> List[ToolRequest]:
        """Get all requests with given status"""
        return [r for r in self.requests.values() if r.status == status]


class EvaluationEngine:
    """Manages tool evaluation process"""

    # Security criteria weights
    SECURITY_WEIGHTS = {
        SecurityCriterion.SOC2_TYPE_II: 20,
        SecurityCriterion.ENCRYPTION_REST: 15,
        SecurityCriterion.ENCRYPTION_TRANSIT: 15,
        SecurityCriterion.SSO_SAML: 10,
        SecurityCriterion.MFA_SUPPORT: 10,
        SecurityCriterion.DATA_RESIDENCY: 10,
        SecurityCriterion.PENTEST_RESULTS: 10,
        SecurityCriterion.INCIDENT_SLA: 10
    }

    def __init__(self):
        self.security_assessments: Dict[str, SecurityAssessment] = {}
        self.compliance_reviews: Dict[str, ComplianceReview] = {}
        self.integration_analyses: Dict[str, IntegrationAnalysis] = {}

    def create_security_assessment(self, request_id: str,
                                    assessor_id: str) -> SecurityAssessment:
        """Create security assessment"""
        assessment_id = hashlib.sha256(
            f"sec:{request_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        assessment = SecurityAssessment(
            assessment_id=assessment_id,
            request_id=request_id,
            assessor_id=assessor_id
        )

        self.security_assessments[assessment_id] = assessment
        return assessment

    def evaluate_security(self, assessment_id: str,
                          results: Dict[str, bool]) -> bool:
        """Evaluate security criteria"""
        assessment = self.security_assessments.get(assessment_id)
        if not assessment:
            return False

        assessment.criteria_results = results
        return assessment.evaluate()

    def identify_applicable_regulations(self,
                                         data_types: List[str]) -> List[ComplianceRegulation]:
        """Identify applicable regulations based on data types"""
        applicable = []

        for reg in ComplianceRegulation:
            affected_types = reg.data_types_affected
            if any(dt in affected_types for dt in data_types):
                applicable.append(reg)

        return applicable

    def create_compliance_review(self, request_id: str, reviewer_id: str,
                                  data_types: List[str]) -> ComplianceReview:
        """Create compliance review"""
        review_id = hashlib.sha256(
            f"comp:{request_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        applicable = self.identify_applicable_regulations(data_types)

        review = ComplianceReview(
            review_id=review_id,
            request_id=request_id,
            reviewer_id=reviewer_id,
            applicable_regulations=applicable
        )

        self.compliance_reviews[review_id] = review
        return review

    def create_integration_analysis(self, request_id: str,
                                     analyst_id: str) -> IntegrationAnalysis:
        """Create integration analysis"""
        analysis_id = hashlib.sha256(
            f"int:{request_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        analysis = IntegrationAnalysis(
            analysis_id=analysis_id,
            request_id=request_id,
            analyst_id=analyst_id
        )

        self.integration_analyses[analysis_id] = analysis
        return analysis

    def get_evaluation_summary(self, request_id: str) -> Dict[str, Any]:
        """Get combined evaluation summary"""
        security = [a for a in self.security_assessments.values()
                    if a.request_id == request_id]
        compliance = [r for r in self.compliance_reviews.values()
                      if r.request_id == request_id]
        integration = [a for a in self.integration_analyses.values()
                       if a.request_id == request_id]

        return {
            "request_id": request_id,
            "security_passed": all(a.overall_pass for a in security) if security else None,
            "security_score": security[0].get_score() if security else None,
            "compliance_passed": all(r.is_compliant() for r in compliance) if compliance else None,
            "compliance_gaps": sum(r.get_gap_count() for r in compliance),
            "integration_complexity": integration[0].overall_complexity.value if integration else None
        }


class ApprovalEngine:
    """Manages approval workflow"""

    def __init__(self):
        self.approvals: Dict[str, List[Approval]] = {}

    def get_required_approvers(self, tier: ToolTier) -> List[str]:
        """Get list of required approvers for tier"""
        return tier.approvers

    def submit_approval(self, request_id: str, approver_id: str,
                        approver_role: str, decision: str,
                        rationale: str = "", conditions: List[str] = None) -> Approval:
        """Submit an approval decision"""
        approval_id = hashlib.sha256(
            f"appr:{request_id}:{approver_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        approval = Approval(
            approval_id=approval_id,
            request_id=request_id,
            approver_id=approver_id,
            approver_role=approver_role,
            decision=decision,
            rationale=rationale,
            conditions=conditions or []
        )

        if request_id not in self.approvals:
            self.approvals[request_id] = []
        self.approvals[request_id].append(approval)

        return approval

    def check_approval_complete(self, request_id: str, tier: ToolTier) -> bool:
        """Check if all required approvals received"""
        required = set(tier.approvers)
        received = {a.approver_role for a in self.approvals.get(request_id, [])
                    if a.is_approved()}

        return required.issubset(received)

    def get_pending_approvers(self, request_id: str, tier: ToolTier) -> List[str]:
        """Get list of pending approvers"""
        required = set(tier.approvers)
        received = {a.approver_role for a in self.approvals.get(request_id, [])}
        return list(required - received)

    def has_rejection(self, request_id: str) -> bool:
        """Check if any approver rejected"""
        approvals = self.approvals.get(request_id, [])
        return any(a.decision == "rejected" for a in approvals)


class LifecycleEngine:
    """Manages tool lifecycle after approval"""

    # Usage thresholds
    USAGE_THRESHOLDS = {
        "abandoned": 30,      # < 30% utilization
        "underutilized": 60,  # < 60% utilization
        "healthy": 80,        # 60-95% utilization
        "overutilized": 95    # > 95% utilization
    }

    def __init__(self):
        self.tools: Dict[str, ManagedTool] = {}
        self.sunset_plans: Dict[str, SunsetPlan] = {}

    def provision_tool(self, request: ToolRequest,
                       licenses: int, monthly_cost: float) -> ManagedTool:
        """Provision approved tool"""
        tool_id = hashlib.sha256(
            f"tool:{request.request_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        tool = ManagedTool(
            tool_id=tool_id,
            name=request.tool_name,
            vendor=request.vendor,
            request_id=request.request_id,
            tier=request.tier,
            owner_id=request.sponsor_id,
            licenses_purchased=licenses,
            monthly_cost=monthly_cost,
            annual_cost=monthly_cost * 12
        )

        self.tools[tool_id] = tool
        return tool

    def update_usage(self, tool_id: str, licenses_used: int) -> UsageStatus:
        """Update tool usage metrics"""
        tool = self.tools.get(tool_id)
        if not tool:
            return None

        tool.licenses_used = licenses_used
        return tool.update_status()

    def create_sunset_plan(self, tool_id: str, trigger: SunsetTrigger,
                           target_date: datetime) -> SunsetPlan:
        """Create sunset plan for tool"""
        plan_id = hashlib.sha256(
            f"sunset:{tool_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        tool = self.tools.get(tool_id)

        plan = SunsetPlan(
            plan_id=plan_id,
            tool_id=tool_id,
            trigger=trigger,
            target_date=target_date,
            affected_users=tool.licenses_used if tool else 0
        )

        self.sunset_plans[plan_id] = plan

        if tool:
            tool.status = UsageStatus.SUNSET_PLANNED
            tool.sunset_date = target_date

        return plan

    def get_underutilized_tools(self) -> List[ManagedTool]:
        """Get tools with low utilization"""
        return [
            t for t in self.tools.values()
            if t.get_utilization() < self.USAGE_THRESHOLDS["underutilized"]
            and t.status not in [UsageStatus.SUNSET_PLANNED, UsageStatus.DECOMMISSIONED]
        ]

    def get_upcoming_renewals(self, days: int = 90) -> List[ManagedTool]:
        """Get tools with renewals in next N days"""
        cutoff = datetime.now() + timedelta(days=days)
        return [
            t for t in self.tools.values()
            if t.next_renewal and t.next_renewal <= cutoff
            and t.status != UsageStatus.DECOMMISSIONED
        ]

    def calculate_portfolio_metrics(self) -> Dict[str, Any]:
        """Calculate portfolio-wide metrics"""
        active_tools = [t for t in self.tools.values()
                        if t.status != UsageStatus.DECOMMISSIONED]

        total_cost = sum(t.annual_cost for t in active_tools)
        total_licenses = sum(t.licenses_purchased for t in active_tools)
        used_licenses = sum(t.licenses_used for t in active_tools)

        utilization = used_licenses / total_licenses * 100 if total_licenses > 0 else 0

        by_status = {}
        for tool in active_tools:
            status = tool.status.value
            by_status[status] = by_status.get(status, 0) + 1

        return {
            "total_tools": len(active_tools),
            "total_annual_cost": total_cost,
            "total_licenses": total_licenses,
            "used_licenses": used_licenses,
            "overall_utilization": utilization,
            "by_status": by_status,
            "underutilized_count": len(self.get_underutilized_tools()),
            "upcoming_renewals": len(self.get_upcoming_renewals())
        }


class ToolingGovernanceEngine:
    """Main orchestrator for tooling governance"""

    def __init__(self):
        self.intake = IntakeEngine()
        self.evaluation = EvaluationEngine()
        self.approval = ApprovalEngine()
        self.lifecycle = LifecycleEngine()
        self.audit_log: List[AuditEntry] = []

    def log_audit(self, action: AuditAction, actor_id: str,
                  resource_type: str, resource_id: str,
                  details: Dict[str, Any] = None) -> str:
        """Log audit entry"""
        entry_id = hashlib.sha256(
            f"audit:{action.value}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        entry = AuditEntry(
            entry_id=entry_id,
            action=action,
            actor_id=actor_id,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {}
        )

        self.audit_log.append(entry)
        return entry_id

    def create_tool_request(self, tool_name: str, requestor_id: str,
                            sponsor_id: str, business_need: str,
                            **kwargs) -> ToolRequest:
        """Create and log tool request"""
        # Check for duplicates
        duplicates = self.intake.check_duplicates(tool_name)

        request = self.intake.create_request(
            tool_name=tool_name,
            requestor_id=requestor_id,
            sponsor_id=sponsor_id,
            business_need=business_need,
            **kwargs
        )

        if duplicates:
            request.alternatives_considered.extend(duplicates)

        self.log_audit(
            AuditAction.REQUEST_CREATED,
            requestor_id,
            "tool_request",
            request.request_id,
            {"tool_name": tool_name, "duplicates_found": duplicates}
        )

        return request

    def submit_for_review(self, request_id: str) -> bool:
        """Submit request for review"""
        success = self.intake.submit_request(request_id)

        if success:
            request = self.intake.requests[request_id]
            self.log_audit(
                AuditAction.STATUS_CHANGED,
                request.requestor_id,
                "tool_request",
                request_id,
                {"new_status": "submitted", "tier": request.tier.value}
            )

        return success

    def process_approval(self, request_id: str, approver_id: str,
                         approver_role: str, decision: str,
                         rationale: str = "") -> Optional[str]:
        """Process approval decision"""
        request = self.intake.requests.get(request_id)
        if not request:
            return None

        approval = self.approval.submit_approval(
            request_id, approver_id, approver_role, decision, rationale
        )

        action = AuditAction.APPROVAL_GIVEN if decision == "approved" else AuditAction.APPROVAL_DENIED
        self.log_audit(
            action,
            approver_id,
            "tool_request",
            request_id,
            {"role": approver_role, "decision": decision}
        )

        # Check if all approvals complete
        if self.approval.check_approval_complete(request_id, request.tier):
            request.status = RequestStatus.APPROVED
            self.log_audit(
                AuditAction.STATUS_CHANGED,
                "system",
                "tool_request",
                request_id,
                {"new_status": "approved"}
            )
        elif self.approval.has_rejection(request_id):
            request.status = RequestStatus.REJECTED
            self.log_audit(
                AuditAction.STATUS_CHANGED,
                "system",
                "tool_request",
                request_id,
                {"new_status": "rejected"}
            )

        return approval.approval_id

    def provision_approved_tool(self, request_id: str,
                                 licenses: int, monthly_cost: float) -> Optional[ManagedTool]:
        """Provision approved tool"""
        request = self.intake.requests.get(request_id)
        if not request or request.status != RequestStatus.APPROVED:
            return None

        tool = self.lifecycle.provision_tool(request, licenses, monthly_cost)

        self.log_audit(
            AuditAction.TOOL_PROVISIONED,
            request.sponsor_id,
            "managed_tool",
            tool.tool_id,
            {"licenses": licenses, "monthly_cost": monthly_cost}
        )

        return tool

    def initiate_sunset(self, tool_id: str, trigger: SunsetTrigger,
                        target_date: datetime) -> Optional[SunsetPlan]:
        """Initiate tool sunset"""
        tool = self.lifecycle.tools.get(tool_id)
        if not tool:
            return None

        plan = self.lifecycle.create_sunset_plan(tool_id, trigger, target_date)

        self.log_audit(
            AuditAction.TOOL_SUNSET,
            "system",
            "managed_tool",
            tool_id,
            {"trigger": trigger.value, "target_date": target_date.isoformat()}
        )

        return plan


# ════════════════════════════════════════════════════════════════════════════════
# REPORTER - ASCII Visualizations
# ════════════════════════════════════════════════════════════════════════════════

class GovernanceReporter:
    """ASCII report generator for tooling governance"""

    ICONS = {
        "approved": "✓",
        "rejected": "✗",
        "pending": "○",
        "active": "●",
        "warning": "⚠",
        "critical": "█",
        "high": "▓",
        "medium": "▒",
        "low": "░"
    }

    def __init__(self, engine: ToolingGovernanceEngine):
        self.engine = engine

    def generate_intake_flow(self) -> str:
        """Generate intake process visualization"""
        lines = [
            "TOOL REQUEST FLOW",
            "═" * 50,
            "",
            "┌" + "─" * 48 + "┐",
            "│       INTAKE PROCESS                            │",
            "│                                                  │",
            "│  [Request] → [Triage]                           │",
            "│       ↓          ↓                              │",
            "│  [Duplicate?] → YES → [Redirect]                │",
            "│       ↓ NO                                      │",
            "│  [Tier Classification]                          │",
            "│       ↓                                         │",
            "│  [Assign Evaluators]                            │",
            "│       ↓                                         │",
            "│  [Begin Assessment]                             │",
            "└" + "─" * 48 + "┘"
        ]

        return "\n".join(lines)

    def generate_tier_matrix(self) -> str:
        """Generate tier classification matrix"""
        lines = [
            "TIER CLASSIFICATION MATRIX",
            "═" * 60,
            "",
            "│ Factor     │ Tier 1   │ Tier 2   │ Tier 3   │ Tier 4   │",
            "├────────────┼──────────┼──────────┼──────────┼──────────┤",
            "│ PII/PHI    │ Yes      │ Limited  │ No       │ No       │",
            "│ Cost       │ >$50K    │ $10-50K  │ $1-10K   │ <$1K     │",
            "│ Users      │ Org-wide │ Dept     │ Team     │ Individual│",
            "│ Integration│ Core     │ Dept sys │ Standalone│ None     │",
            "├────────────┼──────────┼──────────┼──────────┼──────────┤",
            "│ SLA (days) │ 10       │ 5        │ 3        │ 0        │",
            "│ Approvers  │ C-suite  │ Director │ Manager  │ Auto     │"
        ]

        return "\n".join(lines)

    def generate_portfolio_summary(self) -> str:
        """Generate portfolio metrics summary"""
        metrics = self.engine.lifecycle.calculate_portfolio_metrics()

        utilization = metrics.get("overall_utilization", 0)
        util_bar = "█" * int(utilization / 10) + "░" * (10 - int(utilization / 10))

        lines = [
            "PORTFOLIO METRICS",
            "═" * 50,
            "",
            f"Total Tools:      {metrics.get('total_tools', 0)}",
            f"Annual Spend:     ${metrics.get('total_annual_cost', 0):,.0f}",
            f"Total Licenses:   {metrics.get('total_licenses', 0)}",
            f"Used Licenses:    {metrics.get('used_licenses', 0)}",
            f"Utilization:      {util_bar} {utilization:.1f}%",
            "",
            "By Status:"
        ]

        for status, count in metrics.get("by_status", {}).items():
            icon = self.ICONS.get(status, "○")
            lines.append(f"  {icon} {status}: {count}")

        lines.extend([
            "",
            f"Underutilized:    {metrics.get('underutilized_count', 0)}",
            f"Upcoming Renewals: {metrics.get('upcoming_renewals', 0)}"
        ])

        return "\n".join(lines)

    def generate_request_status(self, request_id: str) -> str:
        """Generate status report for specific request"""
        request = self.engine.intake.requests.get(request_id)
        if not request:
            return f"Request {request_id} not found"

        eval_summary = self.engine.evaluation.get_evaluation_summary(request_id)
        pending_approvers = self.engine.approval.get_pending_approvers(
            request_id, request.tier
        ) if request.tier else []

        lines = [
            f"REQUEST STATUS: {request_id}",
            "═" * 50,
            "",
            f"Tool:          {request.tool_name}",
            f"Vendor:        {request.vendor}",
            f"Status:        {request.status.value}",
            f"Tier:          {request.tier.value if request.tier else 'TBD'}",
            f"Cost Category: {request.cost_category.value}",
            "",
            "Evaluation Summary:",
            f"  Security:    {'✓ Passed' if eval_summary.get('security_passed') else '○ Pending' if eval_summary.get('security_passed') is None else '✗ Failed'}",
            f"  Compliance:  {'✓ Passed' if eval_summary.get('compliance_passed') else '○ Pending' if eval_summary.get('compliance_passed') is None else '✗ Failed'}",
            f"  Integration: {eval_summary.get('integration_complexity', 'Pending')}",
            ""
        ]

        if pending_approvers:
            lines.append("Pending Approvers:")
            for approver in pending_approvers:
                lines.append(f"  ○ {approver}")
        else:
            lines.append("All approvals received")

        return "\n".join(lines)

    def generate_sunset_flow(self) -> str:
        """Generate decommission flow visualization"""
        lines = [
            "DECOMMISSION FLOW",
            "═" * 50,
            "",
            "┌" + "─" * 48 + "┐",
            "│       SUNSET PROCESS                            │",
            "│                                                  │",
            "│  [Trigger] → [Impact Assessment]                │",
            "│       ↓                                         │",
            "│  [Migration Plan]                               │",
            "│       ↓                                         │",
            "│  [User Notification] (90 days)                  │",
            "│       ↓                                         │",
            "│  [Data Export/Archive]                          │",
            "│       ↓                                         │",
            "│  [Access Revocation]                            │",
            "│       ↓                                         │",
            "│  [Contract Termination]                         │",
            "└" + "─" * 48 + "┘",
            "",
            "Sunset Triggers:",
            "  • Usage below threshold for 3+ months",
            "  • Security vulnerability unpatched >90 days",
            "  • Vendor end-of-life announced",
            "  • Duplicate functionality available",
            "  • Contract renewal not justified"
        ]

        return "\n".join(lines)

    def generate_full_report(self) -> str:
        """Generate comprehensive governance report"""
        requests = list(self.engine.intake.requests.values())
        pending = len([r for r in requests if not r.status.is_terminal])

        sections = [
            "TOOLING GOVERNANCE FRAMEWORK",
            "═" * 60,
            f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            f"Total Requests: {len(requests)}",
            f"Pending Review: {pending}",
            "═" * 60,
            "",
            self.generate_intake_flow(),
            "",
            self.generate_tier_matrix(),
            "",
            self.generate_portfolio_summary(),
            "",
            self.generate_sunset_flow()
        ]

        return "\n".join(sections)


# ════════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════════

def create_cli():
    """Create command-line interface"""
    import argparse

    parser = argparse.ArgumentParser(
        description="TOOLING.GOVERNANCE.OS.EXE - Tool Adoption & Oversight"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Request command
    req_parser = subparsers.add_parser("request", help="Create tool request")
    req_parser.add_argument("--tool", required=True, help="Tool name")
    req_parser.add_argument("--vendor", help="Vendor name")
    req_parser.add_argument("--need", required=True, help="Business need")
    req_parser.add_argument("--users", type=int, default=1, help="Estimated users")
    req_parser.add_argument("--cost", type=float, default=0, help="Monthly cost")

    # Evaluate command
    eval_parser = subparsers.add_parser("evaluate", help="Evaluate tool request")
    eval_parser.add_argument("--request-id", required=True, help="Request ID")
    eval_parser.add_argument("--type", choices=["security", "compliance", "integration"])

    # Approve command
    appr_parser = subparsers.add_parser("approve", help="Approve/reject request")
    appr_parser.add_argument("--request-id", required=True, help="Request ID")
    appr_parser.add_argument("--decision", choices=["approve", "reject"], required=True)
    appr_parser.add_argument("--rationale", help="Decision rationale")

    # Portfolio command
    port_parser = subparsers.add_parser("portfolio", help="Portfolio analysis")
    port_parser.add_argument("--underutilized", action="store_true", help="Show underutilized")
    port_parser.add_argument("--renewals", action="store_true", help="Show upcoming renewals")

    # Sunset command
    sun_parser = subparsers.add_parser("sunset", help="Sunset planning")
    sun_parser.add_argument("--tool-id", required=True, help="Tool ID to sunset")
    sun_parser.add_argument("--trigger", choices=[t.value for t in SunsetTrigger])
    sun_parser.add_argument("--date", help="Target sunset date (YYYY-MM-DD)")

    return parser


def main():
    """Main entry point"""
    parser = create_cli()
    args = parser.parse_args()

    engine = ToolingGovernanceEngine()
    reporter = GovernanceReporter(engine)

    if args.command == "request":
        request = engine.create_tool_request(
            tool_name=args.tool,
            requestor_id="current_user",
            sponsor_id="current_user",
            business_need=args.need,
            vendor=args.vendor or "unknown",
            estimated_users=args.users,
            cost_estimate=args.cost
        )
        print(f"Request created: {request.request_id}")
        print(reporter.generate_request_status(request.request_id))

    elif args.command == "portfolio":
        print(reporter.generate_portfolio_summary())

    elif args.command == "sunset":
        print(reporter.generate_sunset_flow())

    else:
        print(reporter.generate_full_report())


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/tooling-governance` - Full governance framework
- `/tooling-governance request` - Create tool request
- `/tooling-governance evaluate` - Evaluate specific tool
- `/tooling-governance portfolio` - Portfolio analysis
- `/tooling-governance sunset` - Decommission planning

$ARGUMENTS
