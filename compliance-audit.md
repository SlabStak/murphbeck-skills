# COMPLIANCE.AUDIT.OS.EXE - AI Compliance Audit OS

You are COMPLIANCE.AUDIT.OS.EXE — an audit-readiness architect for AI systems and enterprises.

MISSION
Assess and document compliance posture across the AI lifecycle. Evidence-based findings only. No legal determinations. Clear remediation ownership.

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AI COMPLIANCE AUDIT OS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ ScopeDefiner    │  │ EvidenceCollect │  │ GapAnalyzer     │             │
│  │ Engine          │  │ Engine          │  │ Engine          │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           └────────────────────┼────────────────────┘                       │
│                                │                                            │
│                    ┌───────────┴───────────┐                                │
│                    │   ComplianceEngine     │                                │
│                    │   (Orchestrator)       │                                │
│                    └───────────┬───────────┘                                │
│                                │                                            │
│           ┌────────────────────┼────────────────────┐                       │
│           ▼                    ▼                    ▼                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ RemediationEng  │  │ ReportingEngine │  │ ScheduleEngine  │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
COMPLIANCE.AUDIT.OS.EXE - AI Compliance Audit OS
Production-ready compliance audit system with evidence collection and gap analysis.
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

class AuditFramework(Enum):
    """Supported audit frameworks."""
    SOC2_TYPE1 = "soc2_type1"
    SOC2_TYPE2 = "soc2_type2"
    ISO_27001 = "iso_27001"
    ISO_27701 = "iso_27701"
    GDPR = "gdpr"
    CCPA = "ccpa"
    HIPAA = "hipaa"
    NIST_AI_RMF = "nist_ai_rmf"
    NIST_CSF = "nist_csf"
    PCI_DSS = "pci_dss"
    FEDRAMP = "fedramp"
    EU_AI_ACT = "eu_ai_act"
    INTERNAL = "internal"

    @property
    def control_count(self) -> int:
        """Approximate number of controls in framework."""
        counts = {
            "soc2_type1": 64, "soc2_type2": 64, "iso_27001": 114,
            "iso_27701": 31, "gdpr": 99, "ccpa": 45, "hipaa": 75,
            "nist_ai_rmf": 72, "nist_csf": 108, "pci_dss": 264,
            "fedramp": 325, "eu_ai_act": 85, "internal": 50
        }
        return counts.get(self.value, 50)

    @property
    def certification_body(self) -> str:
        """Who certifies compliance."""
        bodies = {
            "soc2_type1": "AICPA", "soc2_type2": "AICPA",
            "iso_27001": "Accredited CB", "iso_27701": "Accredited CB",
            "gdpr": "DPA", "hipaa": "Self/Third-party",
            "nist_ai_rmf": "Self-assessment", "fedramp": "3PAO",
            "eu_ai_act": "Notified Body"
        }
        return bodies.get(self.value, "Self-assessment")


class ControlStatus(Enum):
    """Control implementation status."""
    NOT_IMPLEMENTED = "not_implemented"
    PLANNED = "planned"
    PARTIAL = "partial"
    IMPLEMENTED = "implemented"
    EFFECTIVE = "effective"
    NOT_APPLICABLE = "not_applicable"

    @property
    def compliance_score(self) -> float:
        """Compliance score contribution."""
        return {
            "not_implemented": 0.0, "planned": 0.1, "partial": 0.5,
            "implemented": 0.8, "effective": 1.0, "not_applicable": 1.0
        }[self.value]


class FindingSeverity(Enum):
    """Audit finding severity."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"

    @property
    def remediation_days(self) -> int:
        """Maximum days to remediate."""
        return {"critical": 7, "high": 30, "medium": 90, "low": 180, "informational": 365}[self.value]

    @property
    def risk_score(self) -> int:
        """Risk score for severity."""
        return {"critical": 10, "high": 8, "medium": 5, "low": 2, "informational": 1}[self.value]


class EvidenceType(Enum):
    """Types of audit evidence."""
    POLICY_DOCUMENT = "policy_document"
    PROCEDURE_DOCUMENT = "procedure_document"
    SYSTEM_SCREENSHOT = "system_screenshot"
    CONFIGURATION_EXPORT = "configuration_export"
    LOG_EXTRACT = "log_extract"
    INTERVIEW_NOTES = "interview_notes"
    TRAINING_RECORD = "training_record"
    TEST_RESULT = "test_result"
    THIRD_PARTY_REPORT = "third_party_report"
    ATTESTATION = "attestation"
    CODE_ARTIFACT = "code_artifact"
    AUDIT_REPORT = "audit_report"

    @property
    def evidence_weight(self) -> float:
        """Weight/reliability of evidence type."""
        weights = {
            "third_party_report": 1.0, "audit_report": 1.0,
            "system_screenshot": 0.9, "configuration_export": 0.9,
            "log_extract": 0.85, "test_result": 0.85,
            "policy_document": 0.7, "procedure_document": 0.7,
            "training_record": 0.6, "interview_notes": 0.5,
            "attestation": 0.4, "code_artifact": 0.8
        }
        return weights.get(self.value, 0.5)


class AuditStatus(Enum):
    """Status of an audit engagement."""
    PLANNING = "planning"
    SCOPING = "scoping"
    FIELDWORK = "fieldwork"
    TESTING = "testing"
    REPORTING = "reporting"
    REMEDIATION = "remediation"
    VERIFICATION = "verification"
    CLOSED = "closed"


class FindingStatus(Enum):
    """Status of an audit finding."""
    DRAFT = "draft"
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    REMEDIATION_PLANNED = "remediation_planned"
    REMEDIATION_IN_PROGRESS = "remediation_in_progress"
    REMEDIATION_COMPLETE = "remediation_complete"
    VERIFIED = "verified"
    CLOSED = "closed"
    RISK_ACCEPTED = "risk_accepted"


class ControlCategory(Enum):
    """Categories of controls."""
    ACCESS_CONTROL = "access_control"
    DATA_PROTECTION = "data_protection"
    INCIDENT_MANAGEMENT = "incident_management"
    CHANGE_MANAGEMENT = "change_management"
    RISK_MANAGEMENT = "risk_management"
    SECURITY_OPERATIONS = "security_operations"
    GOVERNANCE = "governance"
    PRIVACY = "privacy"
    AI_SPECIFIC = "ai_specific"
    VENDOR_MANAGEMENT = "vendor_management"
    BUSINESS_CONTINUITY = "business_continuity"
    ASSET_MANAGEMENT = "asset_management"


class RootCauseCategory(Enum):
    """Categories of root causes for findings."""
    PROCESS_GAP = "process_gap"
    TECHNOLOGY_GAP = "technology_gap"
    PEOPLE_GAP = "people_gap"
    DOCUMENTATION_GAP = "documentation_gap"
    TRAINING_GAP = "training_gap"
    MONITORING_GAP = "monitoring_gap"
    DESIGN_FLAW = "design_flaw"
    RESOURCE_CONSTRAINT = "resource_constraint"


class RemediationPriority(Enum):
    """Priority for remediation actions."""
    P1_CRITICAL = "p1_critical"
    P2_HIGH = "p2_high"
    P3_MEDIUM = "p3_medium"
    P4_LOW = "p4_low"

    @property
    def target_days(self) -> int:
        """Target days to complete."""
        return {"p1_critical": 7, "p2_high": 30, "p3_medium": 90, "p4_low": 180}[self.value]


# ============================================================================
# DATACLASSES - Structured data models
# ============================================================================

@dataclass
class Control:
    """Audit control definition."""
    control_id: str
    name: str
    description: str
    framework: AuditFramework
    category: ControlCategory
    status: ControlStatus = ControlStatus.NOT_IMPLEMENTED
    evidence_required: List[EvidenceType] = field(default_factory=list)
    owner: str = ""
    test_procedure: str = ""
    last_tested: Optional[datetime] = None
    test_result: Optional[str] = None

    def get_compliance_contribution(self) -> float:
        """Get control's contribution to compliance."""
        return self.status.compliance_score

    def is_tested_recently(self, days: int = 90) -> bool:
        """Check if control was tested recently."""
        if not self.last_tested:
            return False
        return (datetime.now() - self.last_tested).days <= days

    def get_evidence_gap(self, collected_evidence: List[EvidenceType]) -> List[EvidenceType]:
        """Get evidence types not yet collected."""
        return [e for e in self.evidence_required if e not in collected_evidence]


@dataclass
class Evidence:
    """Audit evidence artifact."""
    evidence_id: str
    evidence_type: EvidenceType
    title: str
    description: str
    control_ids: List[str]
    collected_by: str
    collected_date: datetime
    file_path: Optional[str] = None
    file_hash: Optional[str] = None
    validity_period_days: int = 365
    verified: bool = False

    def is_valid(self) -> bool:
        """Check if evidence is still valid."""
        days_old = (datetime.now() - self.collected_date).days
        return days_old <= self.validity_period_days

    def calculate_hash(self, content: bytes) -> str:
        """Calculate content hash."""
        return hashlib.sha256(content).hexdigest()

    def get_weight(self) -> float:
        """Get evidence reliability weight."""
        base_weight = self.evidence_type.evidence_weight
        if self.verified:
            base_weight *= 1.2
        if not self.is_valid():
            base_weight *= 0.5
        return min(base_weight, 1.0)


@dataclass
class Finding:
    """Audit finding record."""
    finding_id: str
    title: str
    severity: FindingSeverity
    status: FindingStatus
    control_id: str
    framework: AuditFramework
    description: str
    observation: str
    root_cause: RootCauseCategory
    risk_description: str
    recommendation: str
    identified_date: datetime
    identified_by: str
    owner: Optional[str] = None
    due_date: Optional[datetime] = None
    remediation_plan: Optional[str] = None
    evidence_refs: List[str] = field(default_factory=list)

    def __post_init__(self):
        if not self.due_date:
            self.due_date = self.identified_date + timedelta(days=self.severity.remediation_days)

    def is_overdue(self) -> bool:
        """Check if finding remediation is overdue."""
        if self.status in [FindingStatus.VERIFIED, FindingStatus.CLOSED, FindingStatus.RISK_ACCEPTED]:
            return False
        return datetime.now() > self.due_date if self.due_date else False

    def days_until_due(self) -> int:
        """Days until remediation due date."""
        if not self.due_date:
            return -1
        return (self.due_date - datetime.now()).days

    def get_risk_score(self) -> int:
        """Calculate risk score."""
        base_score = self.severity.risk_score
        if self.is_overdue():
            base_score += 3
        return min(base_score, 10)


@dataclass
class Audit:
    """Audit engagement record."""
    audit_id: str
    name: str
    frameworks: List[AuditFramework]
    status: AuditStatus
    scope_description: str
    systems_in_scope: List[str]
    start_date: datetime
    target_end_date: datetime
    lead_auditor: str
    audit_team: List[str] = field(default_factory=list)
    actual_end_date: Optional[datetime] = None
    findings: List[str] = field(default_factory=list)
    controls_tested: List[str] = field(default_factory=list)

    def get_progress_percentage(self, total_controls: int) -> float:
        """Calculate audit progress."""
        if total_controls == 0:
            return 0.0
        return (len(self.controls_tested) / total_controls) * 100

    def is_on_schedule(self) -> bool:
        """Check if audit is on schedule."""
        if self.actual_end_date:
            return self.actual_end_date <= self.target_end_date
        return datetime.now() <= self.target_end_date

    def days_remaining(self) -> int:
        """Days remaining until target end."""
        return (self.target_end_date - datetime.now()).days


@dataclass
class RemediationAction:
    """Remediation action for a finding."""
    action_id: str
    finding_id: str
    title: str
    description: str
    priority: RemediationPriority
    owner: str
    status: str = "open"
    created_date: datetime = field(default_factory=datetime.now)
    due_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    verification_criteria: str = ""
    notes: List[str] = field(default_factory=list)

    def __post_init__(self):
        if not self.due_date:
            self.due_date = self.created_date + timedelta(days=self.priority.target_days)

    def is_complete(self) -> bool:
        """Check if action is complete."""
        return self.status == "complete"

    def is_overdue(self) -> bool:
        """Check if action is overdue."""
        if self.is_complete():
            return False
        return datetime.now() > self.due_date if self.due_date else False


@dataclass
class ControlTestResult:
    """Result of testing a control."""
    test_id: str
    control_id: str
    test_date: datetime
    tester: str
    test_type: str  # design, operating
    result: str  # pass, fail, partial
    sample_size: int
    exceptions_found: int
    observations: str
    evidence_refs: List[str] = field(default_factory=list)

    def get_exception_rate(self) -> float:
        """Calculate exception rate."""
        if self.sample_size == 0:
            return 0.0
        return self.exceptions_found / self.sample_size

    def is_passing(self, max_exception_rate: float = 0.05) -> bool:
        """Check if test is passing."""
        if self.result == "pass":
            return True
        if self.result == "fail":
            return False
        return self.get_exception_rate() <= max_exception_rate


@dataclass
class AuditScope:
    """Definition of audit scope."""
    scope_id: str
    audit_id: str
    frameworks: List[AuditFramework]
    systems: List[str]
    locations: List[str]
    time_period_start: datetime
    time_period_end: datetime
    exclusions: List[str] = field(default_factory=list)
    assumptions: List[str] = field(default_factory=list)
    constraints: List[str] = field(default_factory=list)

    def is_in_scope(self, system: str, location: str) -> bool:
        """Check if system/location is in scope."""
        if system in self.exclusions or location in self.exclusions:
            return False
        return system in self.systems and location in self.locations


# ============================================================================
# ENGINE CLASSES - Core business logic
# ============================================================================

class ScopeDefinerEngine:
    """Engine for defining audit scope."""

    FRAMEWORK_DOMAINS = {
        AuditFramework.SOC2_TYPE2: [
            "Security", "Availability", "Processing Integrity",
            "Confidentiality", "Privacy"
        ],
        AuditFramework.ISO_27001: [
            "Information Security Policies", "Organization of Information Security",
            "Human Resource Security", "Asset Management", "Access Control",
            "Cryptography", "Physical Security", "Operations Security",
            "Communications Security", "System Acquisition",
            "Supplier Relationships", "Incident Management",
            "Business Continuity", "Compliance"
        ],
        AuditFramework.NIST_AI_RMF: [
            "Govern", "Map", "Measure", "Manage"
        ],
        AuditFramework.EU_AI_ACT: [
            "Risk Classification", "Data Governance", "Technical Documentation",
            "Record-keeping", "Transparency", "Human Oversight",
            "Accuracy & Robustness", "Cybersecurity"
        ]
    }

    def __init__(self):
        self.scopes: Dict[str, AuditScope] = {}

    def create_scope(
        self,
        audit_id: str,
        frameworks: List[AuditFramework],
        systems: List[str],
        locations: List[str],
        time_period_start: datetime,
        time_period_end: datetime,
        exclusions: List[str] = None
    ) -> AuditScope:
        """Create audit scope definition."""
        scope_id = f"SCOPE-{hashlib.md5(f'{audit_id}{datetime.now().isoformat()}'.encode()).hexdigest()[:8].upper()}"

        scope = AuditScope(
            scope_id=scope_id,
            audit_id=audit_id,
            frameworks=frameworks,
            systems=systems,
            locations=locations,
            time_period_start=time_period_start,
            time_period_end=time_period_end,
            exclusions=exclusions or []
        )

        self.scopes[scope_id] = scope
        return scope

    def get_applicable_controls(
        self,
        frameworks: List[AuditFramework],
        control_library: Dict[str, Control]
    ) -> List[Control]:
        """Get controls applicable to scope."""
        applicable = []
        for control in control_library.values():
            if control.framework in frameworks:
                applicable.append(control)
        return applicable

    def estimate_audit_effort(
        self,
        scope: AuditScope,
        controls_count: int
    ) -> Dict[str, Any]:
        """Estimate audit effort based on scope."""
        base_hours_per_control = 2
        complexity_multiplier = len(scope.systems) * 0.1 + len(scope.locations) * 0.05

        total_hours = controls_count * base_hours_per_control * (1 + complexity_multiplier)

        return {
            "scope_id": scope.scope_id,
            "controls_count": controls_count,
            "estimated_hours": round(total_hours),
            "estimated_days": round(total_hours / 8),
            "systems_count": len(scope.systems),
            "locations_count": len(scope.locations),
            "complexity_factor": round(1 + complexity_multiplier, 2)
        }


class EvidenceCollectorEngine:
    """Engine for collecting and managing evidence."""

    EVIDENCE_REQUIREMENTS = {
        ControlCategory.ACCESS_CONTROL: [
            EvidenceType.SYSTEM_SCREENSHOT,
            EvidenceType.CONFIGURATION_EXPORT,
            EvidenceType.POLICY_DOCUMENT
        ],
        ControlCategory.DATA_PROTECTION: [
            EvidenceType.CONFIGURATION_EXPORT,
            EvidenceType.POLICY_DOCUMENT,
            EvidenceType.TEST_RESULT
        ],
        ControlCategory.INCIDENT_MANAGEMENT: [
            EvidenceType.PROCEDURE_DOCUMENT,
            EvidenceType.LOG_EXTRACT,
            EvidenceType.TRAINING_RECORD
        ],
        ControlCategory.AI_SPECIFIC: [
            EvidenceType.CODE_ARTIFACT,
            EvidenceType.TEST_RESULT,
            EvidenceType.POLICY_DOCUMENT,
            EvidenceType.AUDIT_REPORT
        ]
    }

    def __init__(self):
        self.evidence: Dict[str, Evidence] = {}
        self.collection_log: List[Dict[str, Any]] = []

    def collect_evidence(
        self,
        evidence_type: EvidenceType,
        title: str,
        description: str,
        control_ids: List[str],
        collected_by: str,
        file_path: Optional[str] = None,
        content: Optional[bytes] = None
    ) -> Evidence:
        """Collect and register evidence."""
        evidence_id = f"EVD-{hashlib.md5(f'{title}{datetime.now().isoformat()}'.encode()).hexdigest()[:8].upper()}"

        file_hash = None
        if content:
            file_hash = hashlib.sha256(content).hexdigest()

        evidence = Evidence(
            evidence_id=evidence_id,
            evidence_type=evidence_type,
            title=title,
            description=description,
            control_ids=control_ids,
            collected_by=collected_by,
            collected_date=datetime.now(),
            file_path=file_path,
            file_hash=file_hash
        )

        self.evidence[evidence_id] = evidence
        self.collection_log.append({
            "evidence_id": evidence_id,
            "action": "collected",
            "timestamp": datetime.now().isoformat(),
            "collector": collected_by
        })

        return evidence

    def verify_evidence(self, evidence_id: str, verifier: str) -> bool:
        """Verify collected evidence."""
        evidence = self.evidence.get(evidence_id)
        if not evidence:
            return False

        evidence.verified = True
        self.collection_log.append({
            "evidence_id": evidence_id,
            "action": "verified",
            "timestamp": datetime.now().isoformat(),
            "verifier": verifier
        })

        return True

    def get_evidence_coverage(
        self,
        controls: List[Control]
    ) -> Dict[str, Any]:
        """Calculate evidence coverage for controls."""
        coverage = {
            "total_controls": len(controls),
            "fully_covered": 0,
            "partially_covered": 0,
            "not_covered": 0,
            "by_control": {}
        }

        for control in controls:
            control_evidence = [
                e for e in self.evidence.values()
                if control.control_id in e.control_ids
            ]

            required_types = set(control.evidence_required)
            collected_types = set(e.evidence_type for e in control_evidence)
            missing = required_types - collected_types

            if not missing:
                coverage["fully_covered"] += 1
                status = "full"
            elif collected_types:
                coverage["partially_covered"] += 1
                status = "partial"
            else:
                coverage["not_covered"] += 1
                status = "none"

            coverage["by_control"][control.control_id] = {
                "status": status,
                "required": len(required_types),
                "collected": len(collected_types),
                "missing": list(e.value for e in missing)
            }

        return coverage

    def get_evidence_for_control(self, control_id: str) -> List[Evidence]:
        """Get all evidence for a specific control."""
        return [e for e in self.evidence.values() if control_id in e.control_ids]


class GapAnalyzerEngine:
    """Engine for analyzing compliance gaps."""

    def __init__(self):
        self.findings: Dict[str, Finding] = {}
        self.test_results: Dict[str, ControlTestResult] = {}

    def test_control(
        self,
        control: Control,
        tester: str,
        test_type: str,
        sample_size: int,
        exceptions_found: int,
        observations: str,
        evidence_refs: List[str]
    ) -> ControlTestResult:
        """Record control test result."""
        test_id = f"TEST-{hashlib.md5(f'{control.control_id}{datetime.now().isoformat()}'.encode()).hexdigest()[:8].upper()}"

        if exceptions_found == 0:
            result = "pass"
        elif exceptions_found / sample_size <= 0.05:
            result = "partial"
        else:
            result = "fail"

        test_result = ControlTestResult(
            test_id=test_id,
            control_id=control.control_id,
            test_date=datetime.now(),
            tester=tester,
            test_type=test_type,
            result=result,
            sample_size=sample_size,
            exceptions_found=exceptions_found,
            observations=observations,
            evidence_refs=evidence_refs
        )

        self.test_results[test_id] = test_result

        # Update control
        control.last_tested = datetime.now()
        control.test_result = result

        return test_result

    def create_finding(
        self,
        title: str,
        severity: FindingSeverity,
        control_id: str,
        framework: AuditFramework,
        description: str,
        observation: str,
        root_cause: RootCauseCategory,
        risk_description: str,
        recommendation: str,
        identified_by: str
    ) -> Finding:
        """Create audit finding."""
        finding_id = f"FIND-{hashlib.md5(f'{title}{datetime.now().isoformat()}'.encode()).hexdigest()[:8].upper()}"

        finding = Finding(
            finding_id=finding_id,
            title=title,
            severity=severity,
            status=FindingStatus.DRAFT,
            control_id=control_id,
            framework=framework,
            description=description,
            observation=observation,
            root_cause=root_cause,
            risk_description=risk_description,
            recommendation=recommendation,
            identified_date=datetime.now(),
            identified_by=identified_by
        )

        self.findings[finding_id] = finding
        return finding

    def analyze_gaps(
        self,
        controls: List[Control],
        test_results: List[ControlTestResult]
    ) -> Dict[str, Any]:
        """Analyze compliance gaps across controls."""
        analysis = {
            "total_controls": len(controls),
            "tested": 0,
            "passed": 0,
            "failed": 0,
            "not_tested": 0,
            "compliance_score": 0.0,
            "by_category": {},
            "gaps": []
        }

        results_by_control = {r.control_id: r for r in test_results}

        for control in controls:
            result = results_by_control.get(control.control_id)

            if result:
                analysis["tested"] += 1
                if result.is_passing():
                    analysis["passed"] += 1
                else:
                    analysis["failed"] += 1
                    analysis["gaps"].append({
                        "control_id": control.control_id,
                        "name": control.name,
                        "category": control.category.value,
                        "exception_rate": result.get_exception_rate()
                    })
            else:
                analysis["not_tested"] += 1

            # Category breakdown
            cat = control.category.value
            if cat not in analysis["by_category"]:
                analysis["by_category"][cat] = {"total": 0, "passed": 0, "failed": 0}
            analysis["by_category"][cat]["total"] += 1
            if result:
                if result.is_passing():
                    analysis["by_category"][cat]["passed"] += 1
                else:
                    analysis["by_category"][cat]["failed"] += 1

        if analysis["tested"] > 0:
            analysis["compliance_score"] = (analysis["passed"] / analysis["tested"]) * 100

        return analysis

    def get_findings_summary(self) -> Dict[str, Any]:
        """Get summary of all findings."""
        summary = {
            "total": len(self.findings),
            "by_severity": {},
            "by_status": {},
            "overdue": [],
            "aging": {}
        }

        for severity in FindingSeverity:
            count = len([f for f in self.findings.values() if f.severity == severity])
            if count > 0:
                summary["by_severity"][severity.value] = count

        for status in FindingStatus:
            count = len([f for f in self.findings.values() if f.status == status])
            if count > 0:
                summary["by_status"][status.value] = count

        for finding in self.findings.values():
            if finding.is_overdue():
                summary["overdue"].append({
                    "finding_id": finding.finding_id,
                    "title": finding.title,
                    "days_overdue": -finding.days_until_due()
                })

        # Aging analysis
        for finding in self.findings.values():
            if finding.status not in [FindingStatus.CLOSED, FindingStatus.VERIFIED]:
                age = (datetime.now() - finding.identified_date).days
                bucket = "0-30" if age <= 30 else "31-60" if age <= 60 else "61-90" if age <= 90 else "90+"
                summary["aging"][bucket] = summary["aging"].get(bucket, 0) + 1

        return summary


class RemediationPlannerEngine:
    """Engine for planning and tracking remediation."""

    def __init__(self):
        self.actions: Dict[str, RemediationAction] = {}

    def create_action(
        self,
        finding_id: str,
        title: str,
        description: str,
        priority: RemediationPriority,
        owner: str,
        verification_criteria: str
    ) -> RemediationAction:
        """Create remediation action."""
        action_id = f"REM-{hashlib.md5(f'{finding_id}{title}{datetime.now().isoformat()}'.encode()).hexdigest()[:8].upper()}"

        action = RemediationAction(
            action_id=action_id,
            finding_id=finding_id,
            title=title,
            description=description,
            priority=priority,
            owner=owner,
            verification_criteria=verification_criteria
        )

        self.actions[action_id] = action
        return action

    def update_action_status(
        self,
        action_id: str,
        status: str,
        note: Optional[str] = None
    ) -> bool:
        """Update action status."""
        action = self.actions.get(action_id)
        if not action:
            return False

        action.status = status
        if status == "complete":
            action.completed_date = datetime.now()

        if note:
            action.notes.append(f"{datetime.now().isoformat()}: {note}")

        return True

    def get_remediation_progress(self) -> Dict[str, Any]:
        """Get remediation progress summary."""
        progress = {
            "total_actions": len(self.actions),
            "complete": 0,
            "in_progress": 0,
            "open": 0,
            "overdue": 0,
            "by_priority": {},
            "by_owner": {}
        }

        for action in self.actions.values():
            if action.is_complete():
                progress["complete"] += 1
            elif action.status == "in_progress":
                progress["in_progress"] += 1
            else:
                progress["open"] += 1

            if action.is_overdue():
                progress["overdue"] += 1

            # By priority
            pri = action.priority.value
            if pri not in progress["by_priority"]:
                progress["by_priority"][pri] = {"total": 0, "complete": 0}
            progress["by_priority"][pri]["total"] += 1
            if action.is_complete():
                progress["by_priority"][pri]["complete"] += 1

            # By owner
            if action.owner not in progress["by_owner"]:
                progress["by_owner"][action.owner] = {"total": 0, "complete": 0}
            progress["by_owner"][action.owner]["total"] += 1
            if action.is_complete():
                progress["by_owner"][action.owner]["complete"] += 1

        if progress["total_actions"] > 0:
            progress["completion_rate"] = (progress["complete"] / progress["total_actions"]) * 100
        else:
            progress["completion_rate"] = 0

        return progress

    def get_actions_for_finding(self, finding_id: str) -> List[RemediationAction]:
        """Get all actions for a finding."""
        return [a for a in self.actions.values() if a.finding_id == finding_id]


class ReportingEngine:
    """Engine for generating audit reports."""

    def __init__(self):
        self.reports: List[Dict[str, Any]] = []

    def generate_audit_report(
        self,
        audit: Audit,
        controls: List[Control],
        findings: List[Finding],
        evidence_coverage: Dict[str, Any],
        gap_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate comprehensive audit report."""
        report = {
            "report_id": f"RPT-{hashlib.md5(f'{audit.audit_id}{datetime.now().isoformat()}'.encode()).hexdigest()[:8].upper()}",
            "generated_at": datetime.now().isoformat(),
            "audit": {
                "audit_id": audit.audit_id,
                "name": audit.name,
                "frameworks": [f.value for f in audit.frameworks],
                "status": audit.status.value,
                "scope": audit.scope_description,
                "period": f"{audit.start_date.date()} to {audit.target_end_date.date()}"
            },
            "executive_summary": {
                "total_controls": len(controls),
                "controls_tested": len(audit.controls_tested),
                "compliance_score": gap_analysis["compliance_score"],
                "total_findings": len(findings),
                "critical_findings": len([f for f in findings if f.severity == FindingSeverity.CRITICAL]),
                "high_findings": len([f for f in findings if f.severity == FindingSeverity.HIGH])
            },
            "evidence_coverage": evidence_coverage,
            "gap_analysis": gap_analysis,
            "findings_by_severity": {},
            "recommendations": []
        }

        # Findings by severity
        for severity in FindingSeverity:
            severity_findings = [f for f in findings if f.severity == severity]
            if severity_findings:
                report["findings_by_severity"][severity.value] = [
                    {
                        "finding_id": f.finding_id,
                        "title": f.title,
                        "control_id": f.control_id,
                        "status": f.status.value
                    }
                    for f in severity_findings
                ]

        # Generate recommendations based on gaps
        if gap_analysis["compliance_score"] < 80:
            report["recommendations"].append({
                "priority": "high",
                "area": "overall_compliance",
                "recommendation": "Compliance score below 80%. Focus on remediating critical and high findings."
            })

        for cat, stats in gap_analysis["by_category"].items():
            if stats["total"] > 0 and stats["failed"] / stats["total"] > 0.2:
                report["recommendations"].append({
                    "priority": "medium",
                    "area": cat,
                    "recommendation": f"Category '{cat}' has >20% failure rate. Review control implementations."
                })

        self.reports.append(report)
        return report

    def generate_executive_summary(
        self,
        audit: Audit,
        compliance_score: float,
        findings_count: int,
        critical_count: int
    ) -> str:
        """Generate executive summary text."""
        status = "satisfactory" if compliance_score >= 80 else "needs improvement" if compliance_score >= 60 else "unsatisfactory"

        return f"""
EXECUTIVE SUMMARY
-----------------
Audit: {audit.name}
Frameworks: {', '.join(f.value for f in audit.frameworks)}
Period: {audit.start_date.date()} to {audit.target_end_date.date()}

Overall Assessment: {status.upper()}
Compliance Score: {compliance_score:.1f}%

Total Findings: {findings_count}
Critical Findings: {critical_count}

Opinion: Based on our audit procedures, the organization's compliance posture
is assessed as {status}. {'Immediate attention required for critical findings.' if critical_count > 0 else ''}
"""


# ============================================================================
# MAIN ORCHESTRATOR
# ============================================================================

class ComplianceAuditEngine:
    """Main orchestrator for AI Compliance Audit OS."""

    SYSTEM_CONFIG = {
        "name": "AI Compliance Audit Operating System",
        "version": "1.0.0",
        "mission": "Assess and document compliance posture across AI lifecycle",
        "principles": {
            "evidence_based": True,
            "clear_ownership": True,
            "practical_remediation": True,
            "continuous_monitoring": True
        }
    }

    def __init__(self):
        self.scope_engine = ScopeDefinerEngine()
        self.evidence_engine = EvidenceCollectorEngine()
        self.gap_engine = GapAnalyzerEngine()
        self.remediation_engine = RemediationPlannerEngine()
        self.reporting_engine = ReportingEngine()
        self.audits: Dict[str, Audit] = {}
        self.controls: Dict[str, Control] = {}

    def create_audit(
        self,
        name: str,
        frameworks: List[AuditFramework],
        scope_description: str,
        systems_in_scope: List[str],
        start_date: datetime,
        target_end_date: datetime,
        lead_auditor: str
    ) -> Audit:
        """Create a new audit engagement."""
        audit_id = f"AUD-{datetime.now().strftime('%Y%m%d')}-{len(self.audits):03d}"

        audit = Audit(
            audit_id=audit_id,
            name=name,
            frameworks=frameworks,
            status=AuditStatus.PLANNING,
            scope_description=scope_description,
            systems_in_scope=systems_in_scope,
            start_date=start_date,
            target_end_date=target_end_date,
            lead_auditor=lead_auditor
        )

        self.audits[audit_id] = audit
        return audit

    def import_control_framework(
        self,
        framework: AuditFramework
    ) -> List[Control]:
        """Import controls from a framework."""
        # Example controls for demonstration
        control_templates = {
            ControlCategory.ACCESS_CONTROL: [
                ("User Access Management", "Ensure access is granted based on business need"),
                ("Authentication", "Implement strong authentication mechanisms"),
                ("Access Review", "Periodically review user access rights")
            ],
            ControlCategory.DATA_PROTECTION: [
                ("Data Classification", "Classify data based on sensitivity"),
                ("Encryption", "Encrypt sensitive data at rest and in transit"),
                ("Data Retention", "Implement data retention policies")
            ],
            ControlCategory.AI_SPECIFIC: [
                ("Model Documentation", "Document AI model development and training"),
                ("Bias Assessment", "Assess and mitigate AI bias"),
                ("AI Monitoring", "Monitor AI system performance and outputs")
            ]
        }

        controls = []
        for category, templates in control_templates.items():
            for i, (name, desc) in enumerate(templates):
                control_id = f"{framework.value.upper()}-{category.value[:3].upper()}-{i+1:02d}"
                control = Control(
                    control_id=control_id,
                    name=name,
                    description=desc,
                    framework=framework,
                    category=category,
                    evidence_required=[EvidenceType.POLICY_DOCUMENT, EvidenceType.SYSTEM_SCREENSHOT]
                )
                controls.append(control)
                self.controls[control_id] = control

        return controls

    def run_audit(self, audit_id: str) -> Dict[str, Any]:
        """Run audit and generate report."""
        audit = self.audits.get(audit_id)
        if not audit:
            return {"error": "Audit not found"}

        # Get applicable controls
        applicable_controls = [
            c for c in self.controls.values()
            if c.framework in audit.frameworks
        ]

        # Get evidence coverage
        evidence_coverage = self.evidence_engine.get_evidence_coverage(applicable_controls)

        # Get gap analysis
        test_results = list(self.gap_engine.test_results.values())
        gap_analysis = self.gap_engine.analyze_gaps(applicable_controls, test_results)

        # Get findings
        findings = list(self.gap_engine.findings.values())

        # Generate report
        report = self.reporting_engine.generate_audit_report(
            audit, applicable_controls, findings, evidence_coverage, gap_analysis
        )

        return report

    def get_dashboard(self) -> Dict[str, Any]:
        """Get audit dashboard."""
        return {
            "config": self.SYSTEM_CONFIG,
            "audits": {
                "total": len(self.audits),
                "active": len([a for a in self.audits.values() if a.status not in [AuditStatus.CLOSED]]),
                "list": [
                    {
                        "audit_id": a.audit_id,
                        "name": a.name,
                        "status": a.status.value,
                        "progress": a.get_progress_percentage(len([c for c in self.controls.values() if c.framework in a.frameworks]))
                    }
                    for a in self.audits.values()
                ]
            },
            "controls": {
                "total": len(self.controls),
                "by_framework": {}
            },
            "findings": self.gap_engine.get_findings_summary(),
            "remediation": self.remediation_engine.get_remediation_progress(),
            "evidence": {
                "total": len(self.evidence_engine.evidence),
                "verified": len([e for e in self.evidence_engine.evidence.values() if e.verified])
            }
        }


# ============================================================================
# REPORTER
# ============================================================================

class ComplianceAuditReporter:
    """Generate compliance audit reports and visualizations."""

    STATUS_ICONS = {
        "pass": "[OK]",
        "fail": "[!!]",
        "partial": "[~~]",
        "not_tested": "[??]",
        "compliant": "[OK]",
        "non_compliant": "[!!]"
    }

    def format_compliance_posture(self, score: float) -> str:
        """Format compliance posture visualization."""
        filled = int(score / 10)
        bar = "#" * filled + "-" * (10 - filled)
        return f"""
COMPLIANCE POSTURE
------------------
Score: {score:.1f}%
[{bar}]

Status: {'Compliant' if score >= 80 else 'Needs Improvement' if score >= 60 else 'Non-Compliant'}
"""

    def format_findings_table(self, findings: List[Finding]) -> str:
        """Format findings summary table."""
        lines = ["FINDINGS SUMMARY", "-" * 50]
        lines.append(f"{'ID':<12} {'Severity':<10} {'Status':<15} Title")
        lines.append("-" * 50)

        for f in findings[:10]:
            icon = self.STATUS_ICONS.get(f.status.value, "[--]")
            lines.append(f"{f.finding_id:<12} {f.severity.value:<10} {icon} {f.title[:30]}")

        return "\n".join(lines)

    def generate_report(self, engine: ComplianceAuditEngine) -> str:
        """Generate comprehensive audit report."""
        dashboard = engine.get_dashboard()

        report = []
        report.append("=" * 60)
        report.append("AI COMPLIANCE AUDIT REPORT")
        report.append("=" * 60)
        report.append(f"\nGenerated: {datetime.now().isoformat()}")
        report.append(f"System: {dashboard['config']['name']}")

        report.append("\n" + "-" * 40)
        report.append("AUDITS")
        report.append("-" * 40)
        report.append(f"Total: {dashboard['audits']['total']} | Active: {dashboard['audits']['active']}")

        report.append("\n" + "-" * 40)
        report.append("FINDINGS")
        report.append("-" * 40)
        fs = dashboard['findings']
        report.append(f"Total: {fs['total']} | Overdue: {len(fs.get('overdue', []))}")
        for sev, count in fs.get('by_severity', {}).items():
            icon = self.STATUS_ICONS.get(sev, "[--]")
            report.append(f"  {icon} {sev}: {count}")

        report.append("\n" + "-" * 40)
        report.append("REMEDIATION")
        report.append("-" * 40)
        rem = dashboard['remediation']
        report.append(f"Actions: {rem['total_actions']} | Complete: {rem['complete']} | Overdue: {rem['overdue']}")
        if rem['total_actions'] > 0:
            rate = rem.get('completion_rate', 0)
            filled = int(rate / 10)
            bar = "#" * filled + "-" * (10 - filled)
            report.append(f"Completion: [{bar}] {rate:.1f}%")

        report.append("\n" + "-" * 40)
        report.append("EVIDENCE")
        report.append("-" * 40)
        report.append(f"Collected: {dashboard['evidence']['total']} | Verified: {dashboard['evidence']['verified']}")

        report.append("\n" + "=" * 60)

        return "\n".join(report)


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="COMPLIANCE.AUDIT.OS.EXE - AI Compliance Audit OS"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Dashboard
    subparsers.add_parser("dashboard", help="Show audit dashboard")

    # Audit commands
    audit_parser = subparsers.add_parser("audit", help="Audit management")
    audit_sub = audit_parser.add_subparsers(dest="audit_command")
    audit_sub.add_parser("list", help="List audits")

    create_audit = audit_sub.add_parser("create", help="Create new audit")
    create_audit.add_argument("--name", required=True, help="Audit name")
    create_audit.add_argument("--framework", required=True, choices=[f.value for f in AuditFramework])
    create_audit.add_argument("--lead", required=True, help="Lead auditor")

    # Finding commands
    finding_parser = subparsers.add_parser("finding", help="Finding management")
    finding_sub = finding_parser.add_subparsers(dest="finding_command")
    finding_sub.add_parser("list", help="List findings")
    finding_sub.add_parser("summary", help="Findings summary")

    # Evidence commands
    evidence_parser = subparsers.add_parser("evidence", help="Evidence management")
    evidence_sub = evidence_parser.add_subparsers(dest="evidence_command")
    evidence_sub.add_parser("list", help="List evidence")
    evidence_sub.add_parser("coverage", help="Evidence coverage report")

    # Report command
    subparsers.add_parser("report", help="Generate full audit report")

    args = parser.parse_args()

    engine = ComplianceAuditEngine()
    reporter = ComplianceAuditReporter()

    if args.command == "dashboard":
        dashboard = engine.get_dashboard()
        print(json.dumps(dashboard, indent=2, default=str))

    elif args.command == "audit":
        if args.audit_command == "list":
            for audit in engine.audits.values():
                print(f"{audit.audit_id}: {audit.name} [{audit.status.value}]")
        elif args.audit_command == "create":
            audit = engine.create_audit(
                name=args.name,
                frameworks=[AuditFramework(args.framework)],
                scope_description="",
                systems_in_scope=[],
                start_date=datetime.now(),
                target_end_date=datetime.now() + timedelta(days=30),
                lead_auditor=args.lead
            )
            print(f"Audit created: {audit.audit_id}")

    elif args.command == "finding":
        if args.finding_command == "list":
            for finding in engine.gap_engine.findings.values():
                icon = reporter.STATUS_ICONS.get(finding.severity.value, "[--]")
                print(f"{icon} {finding.finding_id}: {finding.title}")
        elif args.finding_command == "summary":
            summary = engine.gap_engine.get_findings_summary()
            print(json.dumps(summary, indent=2))

    elif args.command == "evidence":
        if args.evidence_command == "list":
            for evidence in engine.evidence_engine.evidence.values():
                status = "[OK]" if evidence.verified else "[??]"
                print(f"{status} {evidence.evidence_id}: {evidence.title}")

    elif args.command == "report":
        print(reporter.generate_report(engine))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/compliance-audit` - Full audit report
- `/compliance-audit [framework]` - Framework-specific audit
- `/compliance-audit gaps` - Gap analysis focus
- `/compliance-audit evidence` - Evidence collection
- `/compliance-audit remediate` - Remediation planning

$ARGUMENTS
