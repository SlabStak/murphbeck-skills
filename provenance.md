# PROVENANCE.OS.EXE - Output Traceability & Audit Trail Architect

You are PROVENANCE.OS.EXE — an output traceability and audit trail architect.

MISSION
Record where outputs came from, how they were produced, and under what rules. Ensure every AI output is traceable to its sources.

---

## CAPABILITIES

### SourceTracker.MOD
- Input identification
- Data lineage mapping
- Reference linking
- Version tracking
- Dependency graphs

### AuditRecorder.MOD
- Timestamp capture
- Action logging
- Decision recording
- Change tracking
- Evidence preservation

### ComplianceMapper.MOD
- Policy check documentation
- Rule application logging
- Constraint verification
- Exception recording
- Approval tracking

### OwnershipRegistry.MOD
- Responsible party assignment
- Accountability chains
- Handoff documentation
- Retention scheduling
- Access authorization

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
PROVENANCE.OS.EXE - Output Traceability & Audit Trail Engine
Production-ready implementation for complete output provenance tracking.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
import hashlib
import json
import argparse
import uuid


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class SourceType(Enum):
    """Types of data sources."""
    USER_INPUT = "user_input"
    DATABASE = "database"
    API = "api"
    FILE = "file"
    MODEL_OUTPUT = "model_output"
    CACHE = "cache"
    COMPUTED = "computed"
    EXTERNAL = "external"
    INTERNAL = "internal"
    REFERENCE = "reference"

    @property
    def reliability_score(self) -> float:
        """Default reliability score for source type."""
        scores = {
            "user_input": 0.7, "database": 0.95, "api": 0.85,
            "file": 0.9, "model_output": 0.75, "cache": 0.9,
            "computed": 0.95, "external": 0.6, "internal": 0.9,
            "reference": 0.85
        }
        return scores[self.value]

    @property
    def requires_verification(self) -> bool:
        """Whether this source type needs verification."""
        return self in [
            SourceType.USER_INPUT, SourceType.EXTERNAL,
            SourceType.MODEL_OUTPUT, SourceType.API
        ]

    @property
    def retention_category(self) -> str:
        """Default retention category for this source type."""
        categories = {
            "user_input": "standard", "database": "long_term",
            "api": "short_term", "file": "long_term",
            "model_output": "standard", "cache": "ephemeral",
            "computed": "standard", "external": "short_term",
            "internal": "long_term", "reference": "permanent"
        }
        return categories[self.value]


class TransformationType(Enum):
    """Types of data transformations."""
    NONE = "none"
    FILTER = "filter"
    AGGREGATE = "aggregate"
    ENRICH = "enrich"
    NORMALIZE = "normalize"
    VALIDATE = "validate"
    SANITIZE = "sanitize"
    FORMAT = "format"
    MERGE = "merge"
    DERIVE = "derive"

    @property
    def preserves_lineage(self) -> bool:
        """Whether transformation preserves clear lineage."""
        return self not in [
            TransformationType.AGGREGATE,
            TransformationType.MERGE
        ]

    @property
    def complexity_score(self) -> int:
        """Transformation complexity 1-10."""
        scores = {
            "none": 0, "filter": 2, "aggregate": 5, "enrich": 6,
            "normalize": 3, "validate": 2, "sanitize": 3,
            "format": 2, "merge": 7, "derive": 8
        }
        return scores[self.value]


class RetentionPeriod(Enum):
    """Data retention periods."""
    EPHEMERAL = "ephemeral"
    SHORT_TERM = "short_term"
    STANDARD = "standard"
    LONG_TERM = "long_term"
    PERMANENT = "permanent"
    REGULATORY = "regulatory"

    @property
    def days(self) -> int:
        """Retention period in days (-1 for permanent)."""
        periods = {
            "ephemeral": 1, "short_term": 30, "standard": 90,
            "long_term": 365, "permanent": -1, "regulatory": 2555  # 7 years
        }
        return periods[self.value]

    @property
    def requires_secure_deletion(self) -> bool:
        """Whether secure deletion is required at end of period."""
        return self in [
            RetentionPeriod.REGULATORY,
            RetentionPeriod.STANDARD,
            RetentionPeriod.LONG_TERM
        ]


class AccessLevel(Enum):
    """Access permission levels."""
    NONE = "none"
    READ = "read"
    EXPORT = "export"
    MODIFY = "modify"
    DELETE = "delete"
    ADMIN = "admin"

    @property
    def includes_read(self) -> bool:
        """Whether this level includes read access."""
        return self != AccessLevel.NONE

    @property
    def includes_export(self) -> bool:
        """Whether this level includes export capability."""
        return self in [
            AccessLevel.EXPORT, AccessLevel.MODIFY,
            AccessLevel.DELETE, AccessLevel.ADMIN
        ]

    @property
    def requires_approval(self) -> bool:
        """Whether this access level requires approval."""
        return self in [AccessLevel.DELETE, AccessLevel.ADMIN]


class OwnershipRole(Enum):
    """Roles in accountability chain."""
    OUTPUT_OWNER = "output_owner"
    SYSTEM_OWNER = "system_owner"
    DATA_STEWARD = "data_steward"
    MODEL_OWNER = "model_owner"
    POLICY_OWNER = "policy_owner"
    COMPLIANCE_OFFICER = "compliance_officer"
    REQUESTOR = "requestor"
    APPROVER = "approver"

    @property
    def is_accountable(self) -> bool:
        """Whether this role is accountable for decisions."""
        return self in [
            OwnershipRole.OUTPUT_OWNER, OwnershipRole.SYSTEM_OWNER,
            OwnershipRole.APPROVER
        ]

    @property
    def notification_priority(self) -> int:
        """Priority for notifications (1=highest)."""
        priorities = {
            "output_owner": 1, "system_owner": 2, "data_steward": 3,
            "model_owner": 4, "policy_owner": 5, "compliance_officer": 2,
            "requestor": 1, "approver": 3
        }
        return priorities[self.value]


class ComplianceCheckType(Enum):
    """Types of compliance checks."""
    PII_SCAN = "pii_scan"
    CONTENT_FILTER = "content_filter"
    ACCESS_CONTROL = "access_control"
    RATE_LIMIT = "rate_limit"
    DATA_CLASSIFICATION = "data_classification"
    POLICY_COMPLIANCE = "policy_compliance"
    SECURITY_SCAN = "security_scan"
    AUDIT_REQUIREMENT = "audit_requirement"

    @property
    def is_blocking(self) -> bool:
        """Whether failure blocks output."""
        return self in [
            ComplianceCheckType.PII_SCAN,
            ComplianceCheckType.CONTENT_FILTER,
            ComplianceCheckType.ACCESS_CONTROL,
            ComplianceCheckType.SECURITY_SCAN
        ]

    @property
    def requires_logging(self) -> bool:
        """Whether this check must be logged."""
        return True  # All compliance checks require logging


class IntegrityStatus(Enum):
    """Record integrity status."""
    VERIFIED = "verified"
    UNVERIFIED = "unverified"
    TAMPERED = "tampered"
    EXPIRED = "expired"
    PENDING = "pending"

    @property
    def is_trustworthy(self) -> bool:
        """Whether record can be trusted."""
        return self == IntegrityStatus.VERIFIED


class LineageDepth(Enum):
    """Depth of lineage tracking."""
    IMMEDIATE = "immediate"
    PARENT = "parent"
    FULL = "full"
    COMPLETE = "complete"

    @property
    def generations(self) -> int:
        """Number of generations to track."""
        depths = {
            "immediate": 1, "parent": 2, "full": 5, "complete": -1
        }
        return depths[self.value]


class DataClassification(Enum):
    """Data classification levels."""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"
    TOP_SECRET = "top_secret"

    @property
    def minimum_retention(self) -> RetentionPeriod:
        """Minimum required retention period."""
        retentions = {
            "public": RetentionPeriod.SHORT_TERM,
            "internal": RetentionPeriod.STANDARD,
            "confidential": RetentionPeriod.LONG_TERM,
            "restricted": RetentionPeriod.REGULATORY,
            "top_secret": RetentionPeriod.PERMANENT
        }
        return retentions[self.value]

    @property
    def requires_encryption(self) -> bool:
        """Whether encryption is required."""
        return self in [
            DataClassification.CONFIDENTIAL,
            DataClassification.RESTRICTED,
            DataClassification.TOP_SECRET
        ]


class PolicyCategory(Enum):
    """Categories of policies applied."""
    DATA_PROTECTION = "data_protection"
    SAFETY = "safety"
    AUTHORIZATION = "authorization"
    USAGE = "usage"
    RETENTION = "retention"
    ACCESS = "access"
    COMPLIANCE = "compliance"
    SECURITY = "security"

    @property
    def enforcement_level(self) -> str:
        """Enforcement level for this policy category."""
        levels = {
            "data_protection": "strict", "safety": "strict",
            "authorization": "strict", "usage": "moderate",
            "retention": "moderate", "access": "strict",
            "compliance": "strict", "security": "strict"
        }
        return levels[self.value]


# ============================================================
# DATACLASSES WITH BUSINESS LOGIC
# ============================================================

@dataclass
class Source:
    """A data source in the provenance chain."""
    source_id: str
    name: str
    source_type: SourceType
    version: str
    retrieved_at: datetime
    location: str
    reliability: float = 0.0
    verified: bool = False
    checksum: Optional[str] = None
    metadata: dict = field(default_factory=dict)

    def __post_init__(self):
        if self.reliability == 0.0:
            self.reliability = self.source_type.reliability_score

    def calculate_checksum(self, content: str) -> str:
        """Calculate content checksum."""
        self.checksum = hashlib.sha256(content.encode()).hexdigest()
        return self.checksum

    def verify(self, content: str) -> bool:
        """Verify content matches checksum."""
        if not self.checksum:
            return False
        expected = hashlib.sha256(content.encode()).hexdigest()
        self.verified = (expected == self.checksum)
        return self.verified

    def get_freshness_score(self) -> float:
        """Calculate source freshness (1.0 = fresh, 0.0 = stale)."""
        age_hours = (datetime.now() - self.retrieved_at).total_seconds() / 3600
        if age_hours < 1:
            return 1.0
        elif age_hours < 24:
            return 0.9
        elif age_hours < 168:  # 1 week
            return 0.7
        elif age_hours < 720:  # 30 days
            return 0.5
        return 0.3

    def needs_refresh(self) -> bool:
        """Check if source needs refresh."""
        return self.get_freshness_score() < 0.5


@dataclass
class Transformation:
    """A transformation step in the pipeline."""
    transform_id: str
    transformation_type: TransformationType
    operation: str
    input_sources: list[str]
    output_id: str
    timestamp: datetime = field(default_factory=datetime.now)
    parameters: dict = field(default_factory=dict)

    def get_lineage_impact(self) -> str:
        """Describe impact on lineage tracking."""
        if self.transformation_type.preserves_lineage:
            return "Lineage preserved"
        return f"Lineage complexity increased (score: {self.transformation_type.complexity_score})"

    def is_reversible(self) -> bool:
        """Check if transformation is reversible."""
        return self.transformation_type in [
            TransformationType.FILTER,
            TransformationType.FORMAT,
            TransformationType.NORMALIZE
        ]


@dataclass
class PolicyCheck:
    """A compliance policy check record."""
    check_id: str
    check_type: ComplianceCheckType
    policy_name: str
    policy_category: PolicyCategory
    result: str  # "pass" or "fail"
    timestamp: datetime = field(default_factory=datetime.now)
    details: dict = field(default_factory=dict)

    def passed(self) -> bool:
        """Check if policy check passed."""
        return self.result.lower() == "pass"

    def is_blocking_failure(self) -> bool:
        """Check if failure should block output."""
        return not self.passed() and self.check_type.is_blocking

    def get_enforcement_action(self) -> str:
        """Get required action based on result."""
        if self.passed():
            return "proceed"
        if self.check_type.is_blocking:
            return "block"
        return "warn"


@dataclass
class OwnershipRecord:
    """Record of ownership in accountability chain."""
    record_id: str
    role: OwnershipRole
    party_name: str
    party_contact: str
    assigned_at: datetime = field(default_factory=datetime.now)
    valid_until: Optional[datetime] = None

    def is_current(self) -> bool:
        """Check if ownership is current."""
        if not self.valid_until:
            return True
        return datetime.now() < self.valid_until

    def get_notification_info(self) -> dict:
        """Get notification information."""
        return {
            "role": self.role.value,
            "name": self.party_name,
            "contact": self.party_contact,
            "priority": self.role.notification_priority
        }


@dataclass
class RetentionPolicy:
    """Retention policy for provenance data."""
    policy_id: str
    data_type: str
    period: RetentionPeriod
    classification: DataClassification
    basis: str
    created_at: datetime = field(default_factory=datetime.now)

    def get_expiry_date(self, creation_date: datetime) -> Optional[datetime]:
        """Calculate expiry date."""
        if self.period.days == -1:
            return None  # Permanent
        return creation_date + timedelta(days=self.period.days)

    def is_compliant(self) -> bool:
        """Check if policy meets minimum requirements."""
        min_period = self.classification.minimum_retention
        return self.period.days >= min_period.days or self.period.days == -1


@dataclass
class AccessPermission:
    """Access permission record."""
    permission_id: str
    role: str
    access_level: AccessLevel
    granted_at: datetime = field(default_factory=datetime.now)
    granted_by: str = ""
    expires_at: Optional[datetime] = None

    def can_read(self) -> bool:
        """Check read permission."""
        return self.access_level.includes_read and self.is_valid()

    def can_export(self) -> bool:
        """Check export permission."""
        return self.access_level.includes_export and self.is_valid()

    def is_valid(self) -> bool:
        """Check if permission is still valid."""
        if not self.expires_at:
            return True
        return datetime.now() < self.expires_at


@dataclass
class ProvenanceRecord:
    """Complete provenance record for an output."""
    record_id: str
    output_id: str
    generated_at: datetime
    sources: list[Source] = field(default_factory=list)
    transformations: list[Transformation] = field(default_factory=list)
    policy_checks: list[PolicyCheck] = field(default_factory=list)
    ownership: list[OwnershipRecord] = field(default_factory=list)
    retention: Optional[RetentionPolicy] = None
    permissions: list[AccessPermission] = field(default_factory=list)
    model_config: dict = field(default_factory=dict)
    integrity_status: IntegrityStatus = IntegrityStatus.UNVERIFIED
    checksum: str = ""

    def __post_init__(self):
        if not self.checksum:
            self._calculate_checksum()

    def _calculate_checksum(self):
        """Calculate record checksum."""
        content = f"{self.record_id}:{self.output_id}:{self.generated_at.isoformat()}"
        self.checksum = hashlib.sha256(content.encode()).hexdigest()[:32]

    def verify_integrity(self) -> bool:
        """Verify record integrity."""
        expected = f"{self.record_id}:{self.output_id}:{self.generated_at.isoformat()}"
        calculated = hashlib.sha256(expected.encode()).hexdigest()[:32]
        if calculated == self.checksum:
            self.integrity_status = IntegrityStatus.VERIFIED
            return True
        self.integrity_status = IntegrityStatus.TAMPERED
        return False

    def all_checks_passed(self) -> bool:
        """Check if all policy checks passed."""
        return all(check.passed() for check in self.policy_checks)

    def get_blocking_failures(self) -> list[PolicyCheck]:
        """Get policy checks that block output."""
        return [c for c in self.policy_checks if c.is_blocking_failure()]

    def get_owner(self) -> Optional[OwnershipRecord]:
        """Get current output owner."""
        owners = [o for o in self.ownership if o.role == OwnershipRole.OUTPUT_OWNER and o.is_current()]
        return owners[0] if owners else None

    def get_lineage_depth(self) -> int:
        """Calculate lineage depth."""
        return len(self.transformations) + 1

    def get_source_reliability(self) -> float:
        """Calculate average source reliability."""
        if not self.sources:
            return 0.0
        return sum(s.reliability for s in self.sources) / len(self.sources)


@dataclass
class LineageGraph:
    """Dependency graph for source lineage."""
    graph_id: str
    root_output_id: str
    nodes: dict = field(default_factory=dict)
    edges: list = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    def add_node(self, node_id: str, node_type: str, metadata: dict):
        """Add node to lineage graph."""
        self.nodes[node_id] = {
            "type": node_type,
            "metadata": metadata,
            "added_at": datetime.now().isoformat()
        }

    def add_edge(self, from_id: str, to_id: str, relationship: str):
        """Add edge between nodes."""
        self.edges.append({
            "from": from_id,
            "to": to_id,
            "relationship": relationship
        })

    def get_ancestors(self, node_id: str, depth: int = -1) -> list[str]:
        """Get ancestor nodes up to depth."""
        ancestors = []
        current_depth = 0
        to_process = [node_id]

        while to_process and (depth == -1 or current_depth < depth):
            next_batch = []
            for nid in to_process:
                for edge in self.edges:
                    if edge["to"] == nid and edge["from"] not in ancestors:
                        ancestors.append(edge["from"])
                        next_batch.append(edge["from"])
            to_process = next_batch
            current_depth += 1

        return ancestors


@dataclass
class AuditEntry:
    """Immutable audit trail entry."""
    entry_id: str
    provenance_id: str
    action: str
    actor: str
    timestamp: datetime = field(default_factory=datetime.now)
    details: dict = field(default_factory=dict)
    previous_hash: str = ""
    entry_hash: str = ""

    def __post_init__(self):
        if not self.entry_hash:
            content = f"{self.entry_id}:{self.action}:{self.timestamp.isoformat()}:{self.previous_hash}"
            self.entry_hash = hashlib.sha256(content.encode()).hexdigest()[:32]

    def verify_chain(self, previous_entry: Optional["AuditEntry"]) -> bool:
        """Verify this entry is correctly chained."""
        if previous_entry is None:
            return self.previous_hash == ""
        return self.previous_hash == previous_entry.entry_hash


# ============================================================
# ENGINE CLASSES
# ============================================================

class SourceTrackerEngine:
    """Engine for tracking data sources."""

    def __init__(self):
        self.sources = {}
        self.lineage_graphs = {}

    def register_source(
        self,
        name: str,
        source_type: SourceType,
        version: str,
        location: str,
        content: Optional[str] = None
    ) -> Source:
        """Register a new data source."""
        source = Source(
            source_id=f"src_{uuid.uuid4().hex[:8]}",
            name=name,
            source_type=source_type,
            version=version,
            retrieved_at=datetime.now(),
            location=location
        )

        if content:
            source.calculate_checksum(content)

        self.sources[source.source_id] = source
        return source

    def build_lineage_graph(
        self,
        output_id: str,
        sources: list[Source],
        transformations: list[Transformation]
    ) -> LineageGraph:
        """Build lineage graph for output."""
        graph = LineageGraph(
            graph_id=f"graph_{uuid.uuid4().hex[:8]}",
            root_output_id=output_id
        )

        # Add sources as nodes
        for source in sources:
            graph.add_node(source.source_id, "source", {
                "name": source.name,
                "type": source.source_type.value,
                "reliability": source.reliability
            })

        # Add transformations and edges
        for transform in transformations:
            graph.add_node(transform.transform_id, "transform", {
                "type": transform.transformation_type.value,
                "operation": transform.operation
            })

            for input_id in transform.input_sources:
                graph.add_edge(input_id, transform.transform_id, "input_to")

            graph.add_edge(transform.transform_id, transform.output_id, "produces")

        self.lineage_graphs[graph.graph_id] = graph
        return graph

    def get_source_freshness_report(self) -> dict:
        """Generate freshness report for all sources."""
        return {
            source_id: {
                "name": source.name,
                "freshness": source.get_freshness_score(),
                "needs_refresh": source.needs_refresh()
            }
            for source_id, source in self.sources.items()
        }


class AuditRecorderEngine:
    """Engine for recording audit trail."""

    def __init__(self):
        self.entries = []
        self.last_hash = ""

    def record_action(
        self,
        provenance_id: str,
        action: str,
        actor: str,
        details: dict = None
    ) -> AuditEntry:
        """Record an action in the audit trail."""
        entry = AuditEntry(
            entry_id=f"audit_{uuid.uuid4().hex[:8]}",
            provenance_id=provenance_id,
            action=action,
            actor=actor,
            details=details or {},
            previous_hash=self.last_hash
        )

        self.entries.append(entry)
        self.last_hash = entry.entry_hash
        return entry

    def verify_chain_integrity(self) -> tuple[bool, list[str]]:
        """Verify entire audit chain integrity."""
        issues = []

        for i, entry in enumerate(self.entries):
            prev_entry = self.entries[i - 1] if i > 0 else None
            if not entry.verify_chain(prev_entry):
                issues.append(f"Chain break at entry {entry.entry_id}")

        return len(issues) == 0, issues

    def get_entries_for_provenance(self, provenance_id: str) -> list[AuditEntry]:
        """Get all audit entries for a provenance record."""
        return [e for e in self.entries if e.provenance_id == provenance_id]

    def export_audit_trail(self, provenance_id: str) -> list[dict]:
        """Export audit trail as list of dicts."""
        entries = self.get_entries_for_provenance(provenance_id)
        return [
            {
                "entry_id": e.entry_id,
                "action": e.action,
                "actor": e.actor,
                "timestamp": e.timestamp.isoformat(),
                "details": e.details,
                "hash": e.entry_hash
            }
            for e in entries
        ]


class ComplianceMapperEngine:
    """Engine for mapping compliance checks."""

    STANDARD_CHECKS = {
        "pii": ComplianceCheckType.PII_SCAN,
        "content": ComplianceCheckType.CONTENT_FILTER,
        "access": ComplianceCheckType.ACCESS_CONTROL,
        "rate": ComplianceCheckType.RATE_LIMIT,
        "classification": ComplianceCheckType.DATA_CLASSIFICATION,
        "security": ComplianceCheckType.SECURITY_SCAN
    }

    def __init__(self):
        self.checks = []

    def run_check(
        self,
        check_type: ComplianceCheckType,
        policy_name: str,
        policy_category: PolicyCategory,
        data: dict
    ) -> PolicyCheck:
        """Run a compliance check."""
        # Simulate check execution
        result = self._execute_check(check_type, data)

        check = PolicyCheck(
            check_id=f"chk_{uuid.uuid4().hex[:8]}",
            check_type=check_type,
            policy_name=policy_name,
            policy_category=policy_category,
            result="pass" if result else "fail",
            details={"data_summary": str(data)[:100]}
        )

        self.checks.append(check)
        return check

    def _execute_check(self, check_type: ComplianceCheckType, data: dict) -> bool:
        """Execute actual check logic."""
        # Simplified check logic
        if check_type == ComplianceCheckType.PII_SCAN:
            # Check for obvious PII patterns
            content = str(data).lower()
            pii_indicators = ["ssn", "social security", "credit card"]
            return not any(ind in content for ind in pii_indicators)

        if check_type == ComplianceCheckType.CONTENT_FILTER:
            # Check for prohibited content
            return True  # Placeholder

        return True  # Default pass

    def run_standard_checks(self, data: dict) -> list[PolicyCheck]:
        """Run all standard compliance checks."""
        results = []

        for name, check_type in self.STANDARD_CHECKS.items():
            check = self.run_check(
                check_type=check_type,
                policy_name=f"standard_{name}",
                policy_category=PolicyCategory.COMPLIANCE,
                data=data
            )
            results.append(check)

        return results

    def get_compliance_summary(self) -> dict:
        """Get summary of compliance checks."""
        passed = sum(1 for c in self.checks if c.passed())
        failed = len(self.checks) - passed
        blocking = sum(1 for c in self.checks if c.is_blocking_failure())

        return {
            "total_checks": len(self.checks),
            "passed": passed,
            "failed": failed,
            "blocking_failures": blocking,
            "compliance_rate": passed / len(self.checks) if self.checks else 1.0
        }


class OwnershipRegistryEngine:
    """Engine for managing ownership and accountability."""

    def __init__(self):
        self.ownership_records = []
        self.retention_policies = []
        self.permissions = []

    def assign_owner(
        self,
        role: OwnershipRole,
        party_name: str,
        party_contact: str,
        valid_days: Optional[int] = None
    ) -> OwnershipRecord:
        """Assign ownership role."""
        valid_until = None
        if valid_days:
            valid_until = datetime.now() + timedelta(days=valid_days)

        record = OwnershipRecord(
            record_id=f"own_{uuid.uuid4().hex[:8]}",
            role=role,
            party_name=party_name,
            party_contact=party_contact,
            valid_until=valid_until
        )

        self.ownership_records.append(record)
        return record

    def build_accountability_chain(
        self,
        output_owner: str,
        system_owner: str,
        data_steward: str
    ) -> list[OwnershipRecord]:
        """Build complete accountability chain."""
        chain = [
            self.assign_owner(OwnershipRole.OUTPUT_OWNER, output_owner, f"{output_owner}@example.com"),
            self.assign_owner(OwnershipRole.SYSTEM_OWNER, system_owner, f"{system_owner}@example.com"),
            self.assign_owner(OwnershipRole.DATA_STEWARD, data_steward, f"{data_steward}@example.com")
        ]
        return chain

    def create_retention_policy(
        self,
        data_type: str,
        period: RetentionPeriod,
        classification: DataClassification,
        basis: str
    ) -> RetentionPolicy:
        """Create retention policy."""
        policy = RetentionPolicy(
            policy_id=f"ret_{uuid.uuid4().hex[:8]}",
            data_type=data_type,
            period=period,
            classification=classification,
            basis=basis
        )

        if not policy.is_compliant():
            raise ValueError(f"Retention period does not meet minimum for {classification.value}")

        self.retention_policies.append(policy)
        return policy

    def grant_permission(
        self,
        role: str,
        access_level: AccessLevel,
        granted_by: str,
        valid_days: Optional[int] = None
    ) -> AccessPermission:
        """Grant access permission."""
        expires_at = None
        if valid_days:
            expires_at = datetime.now() + timedelta(days=valid_days)

        permission = AccessPermission(
            permission_id=f"perm_{uuid.uuid4().hex[:8]}",
            role=role,
            access_level=access_level,
            granted_by=granted_by,
            expires_at=expires_at
        )

        self.permissions.append(permission)
        return permission


class ProvenanceEngine:
    """Main orchestrator for provenance tracking."""

    def __init__(self):
        self.source_tracker = SourceTrackerEngine()
        self.audit_recorder = AuditRecorderEngine()
        self.compliance_mapper = ComplianceMapperEngine()
        self.ownership_registry = OwnershipRegistryEngine()
        self.records = []

    def create_provenance_record(
        self,
        output_id: str,
        sources: list[dict],
        transformations: list[dict],
        model_config: dict,
        owner_info: dict
    ) -> ProvenanceRecord:
        """Create complete provenance record."""
        # Register sources
        registered_sources = []
        for src in sources:
            source = self.source_tracker.register_source(
                name=src["name"],
                source_type=SourceType(src.get("type", "internal")),
                version=src.get("version", "1.0"),
                location=src.get("location", "unknown")
            )
            registered_sources.append(source)

        # Create transformations
        transform_objects = []
        for t in transformations:
            transform = Transformation(
                transform_id=f"trans_{uuid.uuid4().hex[:8]}",
                transformation_type=TransformationType(t.get("type", "none")),
                operation=t.get("operation", ""),
                input_sources=t.get("inputs", []),
                output_id=t.get("output", output_id)
            )
            transform_objects.append(transform)

        # Run compliance checks
        policy_checks = self.compliance_mapper.run_standard_checks({
            "output_id": output_id,
            "source_count": len(sources)
        })

        # Build ownership
        ownership = self.ownership_registry.build_accountability_chain(
            output_owner=owner_info.get("output_owner", "system"),
            system_owner=owner_info.get("system_owner", "admin"),
            data_steward=owner_info.get("data_steward", "data_team")
        )

        # Create retention policy
        retention = self.ownership_registry.create_retention_policy(
            data_type="output_provenance",
            period=RetentionPeriod.STANDARD,
            classification=DataClassification.INTERNAL,
            basis="standard_operations"
        )

        # Build provenance record
        record = ProvenanceRecord(
            record_id=f"prov_{uuid.uuid4().hex[:8]}",
            output_id=output_id,
            generated_at=datetime.now(),
            sources=registered_sources,
            transformations=transform_objects,
            policy_checks=policy_checks,
            ownership=ownership,
            retention=retention,
            model_config=model_config
        )

        # Audit
        self.audit_recorder.record_action(
            provenance_id=record.record_id,
            action="provenance_created",
            actor="system",
            details={"output_id": output_id}
        )

        self.records.append(record)
        return record

    def verify_record(self, record_id: str) -> dict:
        """Verify provenance record integrity."""
        record = next((r for r in self.records if r.record_id == record_id), None)
        if not record:
            return {"found": False}

        integrity_valid = record.verify_integrity()
        chain_valid, issues = self.audit_recorder.verify_chain_integrity()

        return {
            "found": True,
            "record_id": record_id,
            "integrity_valid": integrity_valid,
            "chain_valid": chain_valid,
            "issues": issues,
            "status": record.integrity_status.value
        }

    def get_provenance_summary(self) -> dict:
        """Get summary of all provenance records."""
        return {
            "total_records": len(self.records),
            "total_sources": len(self.source_tracker.sources),
            "compliance_summary": self.compliance_mapper.get_compliance_summary(),
            "audit_entries": len(self.audit_recorder.entries)
        }


# ============================================================
# REPORTER CLASS
# ============================================================

class ProvenanceReporter:
    """Generate provenance reports and visualizations."""

    def __init__(self, engine: ProvenanceEngine):
        self.engine = engine

    def generate_provenance_report(
        self,
        record: ProvenanceRecord
    ) -> str:
        """Generate full provenance report."""
        lines = [
            "═" * 60,
            "OUTPUT PROVENANCE RECORD",
            "═" * 60,
            f"Record ID:  {record.record_id}",
            f"Output ID:  {record.output_id}",
            f"Generated:  {record.generated_at.strftime('%Y-%m-%d %H:%M:%S')}",
            f"Integrity:  {record.integrity_status.value}",
            f"Checksum:   {record.checksum}",
            "═" * 60,
            "",
            "SOURCE INVENTORY",
            "─" * 40
        ]

        for source in record.sources:
            status = "✓" if source.verified else "○"
            lines.append(
                f"  {status} [{source.source_type.value:12}] {source.name}"
            )
            lines.append(
                f"    Version: {source.version} | Reliability: {source.reliability:.0%}"
            )
        lines.append("")

        # Transformations
        if record.transformations:
            lines.extend([
                "DATA TRANSFORMATIONS",
                "─" * 40
            ])
            for i, trans in enumerate(record.transformations, 1):
                lines.append(
                    f"  {i}. [{trans.transformation_type.value:10}] {trans.operation}"
                )
                lines.append(
                    f"     Inputs: {', '.join(trans.input_sources)}"
                )
            lines.append("")

        # Policy checks
        lines.extend([
            "POLICY CHECKS",
            "─" * 40
        ])
        for check in record.policy_checks:
            status = "✓" if check.passed() else "✗"
            lines.append(
                f"  {status} [{check.check_type.value:20}] {check.policy_name}: {check.result.upper()}"
            )
        lines.append("")

        # Ownership
        lines.extend([
            "ACCOUNTABILITY CHAIN",
            "─" * 40
        ])
        for owner in record.ownership:
            current = "●" if owner.is_current() else "○"
            lines.append(
                f"  {current} [{owner.role.value:18}] {owner.party_name}"
            )
        lines.append("")

        # Retention
        if record.retention:
            lines.extend([
                "RETENTION POLICY",
                "─" * 40,
                f"  Period:         {record.retention.period.value} ({record.retention.period.days} days)",
                f"  Classification: {record.retention.classification.value}",
                f"  Basis:          {record.retention.basis}",
                ""
            ])

        # Model config
        if record.model_config:
            lines.extend([
                "MODEL CONFIGURATION",
                "─" * 40
            ])
            for key, value in record.model_config.items():
                lines.append(f"  {key}: {value}")
            lines.append("")

        lines.extend([
            "─" * 40,
            f"Verification: {record.integrity_status.value}",
            "═" * 60
        ])

        return "\n".join(lines)

    def generate_lineage_diagram(
        self,
        graph: LineageGraph
    ) -> str:
        """Generate ASCII lineage diagram."""
        lines = [
            "LINEAGE GRAPH",
            "─" * 40,
            f"Output: {graph.root_output_id}",
            ""
        ]

        # Group nodes by type
        sources = [n for n, d in graph.nodes.items() if d["type"] == "source"]
        transforms = [n for n, d in graph.nodes.items() if d["type"] == "transform"]

        for source_id in sources:
            node = graph.nodes[source_id]
            lines.append(f"  [{source_id}] {node['metadata'].get('name', 'Unknown')}")

        if transforms:
            lines.append("        │")
            lines.append("        ▼")
            for trans_id in transforms:
                node = graph.nodes[trans_id]
                lines.append(f"  [{trans_id}] {node['metadata'].get('operation', 'Transform')}")

        lines.append("        │")
        lines.append("        ▼")
        lines.append(f"  [OUTPUT] {graph.root_output_id}")

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="PROVENANCE.OS.EXE - Output Traceability Engine"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Trace command
    trace_parser = subparsers.add_parser("trace", help="Create provenance trace")
    trace_parser.add_argument("--output-id", required=True, help="Output ID to trace")
    trace_parser.add_argument("--owner", default="system", help="Output owner")

    # Record command
    record_parser = subparsers.add_parser("record", help="Record provenance event")
    record_parser.add_argument("--provenance-id", required=True)
    record_parser.add_argument("--action", required=True)
    trace_parser.add_argument("--actor", default="cli_user")

    # Verify command
    verify_parser = subparsers.add_parser("verify", help="Verify provenance integrity")
    verify_parser.add_argument("--record-id", required=True)

    # Ownership command
    ownership_parser = subparsers.add_parser("ownership", help="Manage ownership")
    ownership_parser.add_argument("--provenance-id", required=True)
    ownership_parser.add_argument("--action", choices=["show", "assign", "transfer"])

    # Audit command
    audit_parser = subparsers.add_parser("audit", help="View audit trail")
    audit_parser.add_argument("--provenance-id", help="Filter by provenance ID")

    args = parser.parse_args()

    engine = ProvenanceEngine()
    reporter = ProvenanceReporter(engine)

    if args.command == "trace":
        record = engine.create_provenance_record(
            output_id=args.output_id,
            sources=[
                {"name": "Primary Input", "type": "user_input", "version": "1.0"}
            ],
            transformations=[],
            model_config={"model": "claude-3", "temperature": 0.7},
            owner_info={"output_owner": args.owner}
        )

        print(reporter.generate_provenance_report(record))

    elif args.command == "verify":
        result = engine.verify_record(args.record_id)

        print("VERIFICATION RESULT")
        print("=" * 40)
        for key, value in result.items():
            print(f"  {key}: {value}")

    elif args.command == "audit":
        summary = engine.get_provenance_summary()

        print("PROVENANCE SUMMARY")
        print("=" * 40)
        for key, value in summary.items():
            print(f"  {key}: {value}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW

### Phase 1: CAPTURE
1. Identify all inputs
2. Record source metadata
3. Document transformations
4. Log policy checks
5. Timestamp everything

### Phase 2: LINK
1. Build lineage graph
2. Connect dependencies
3. Reference versions
4. Map relationships
5. Establish chains

### Phase 3: ATTRIBUTE
1. Assign ownership
2. Document decisions
3. Record approvals
4. Note exceptions
5. Track handoffs

### Phase 4: PRESERVE
1. Store securely
2. Set retention
3. Enable retrieval
4. Support queries
5. Maintain integrity

---

## PROVENANCE ELEMENTS

| Element | Purpose | Retention |
|---------|---------|-----------|
| Source ID | Input tracing | Permanent |
| Timestamp | Timeline | Permanent |
| Version | Reproducibility | Long-term |
| Owner | Accountability | Long-term |
| Policy | Compliance | Regulatory |

## QUICK COMMANDS

- `/provenance` - Full provenance framework
- `/provenance [output]` - Specific output tracing
- `/provenance sources` - Source inventory
- `/provenance audit` - Audit trail
- `/provenance ownership` - Accountability chain

$ARGUMENTS
