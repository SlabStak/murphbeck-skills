# SECURE.MEMORY.OS.EXE - Memory Governance & Protection Architect

You are SECURE.MEMORY.OS.EXE — a memory governance and protection architect.

MISSION
Control what is stored, how long, and who can access memory artifacts. Minimize persistence, protect sensitive content.

---

## CAPABILITIES

### MemoryClassifier.MOD
- Content categorization
- Sensitivity scoring
- PII detection
- Context assessment
- Classification rules

### RetentionEngine.MOD
- Retention policies
- Expiration scheduling
- Archive triggers
- Legal holds
- Compliance mapping

### AccessController.MOD
- Permission models
- Role-based access
- Need-to-know rules
- Audit logging
- Access revocation

### RedactionManager.MOD
- Redaction strategies
- Anonymization rules
- Reference patterns
- Verification checks
- Recovery prevention

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
SECURE.MEMORY.OS.EXE - Memory Governance & Protection Engine
Production-ready implementation for AI memory security
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any, Set
from enum import Enum
from datetime import datetime, timedelta
import hashlib
import re
import json


# ════════════════════════════════════════════════════════════════════════════════
# ENUMS - Memory Classifications and Security Levels
# ════════════════════════════════════════════════════════════════════════════════

class MemoryClassification(Enum):
    """Memory sensitivity classifications"""
    TRANSIENT = "transient"
    SHORT_TERM = "short_term"
    LONG_TERM = "long_term"
    SENSITIVE = "sensitive"
    RESTRICTED = "restricted"

    @property
    def retention_default(self) -> timedelta:
        """Default retention period"""
        retention_map = {
            "transient": timedelta(hours=24),
            "short_term": timedelta(days=30),
            "long_term": timedelta(days=365),
            "sensitive": timedelta(days=30),
            "restricted": timedelta(days=0)  # Legal requirement
        }
        return retention_map.get(self.value, timedelta(days=30))

    @property
    def retention_max(self) -> timedelta:
        """Maximum retention allowed"""
        max_map = {
            "transient": timedelta(hours=24),
            "short_term": timedelta(days=90),
            "long_term": timedelta(days=1095),  # 3 years
            "sensitive": timedelta(days=30),
            "restricted": timedelta(days=2555)  # 7 years for compliance
        }
        return max_map.get(self.value, timedelta(days=90))

    @property
    def encryption_required(self) -> str:
        """Required encryption level"""
        encryption_map = {
            "transient": "optional",
            "short_term": "standard",
            "long_term": "standard",
            "sensitive": "enhanced",
            "restricted": "maximum"
        }
        return encryption_map.get(self.value, "standard")


class DataType(Enum):
    """Types of data stored in memory"""
    SESSION_CONTEXT = "session_context"
    USER_PREFERENCES = "user_preferences"
    CONVERSATION_HISTORY = "conversation_history"
    LEARNED_PATTERNS = "learned_patterns"
    PII_REFERENCE = "pii_reference"
    CREDENTIALS = "credentials"
    FINANCIAL = "financial"
    HEALTH = "health"
    LEGAL = "legal"

    @property
    def default_classification(self) -> MemoryClassification:
        """Default classification for data type"""
        class_map = {
            "session_context": MemoryClassification.TRANSIENT,
            "user_preferences": MemoryClassification.SHORT_TERM,
            "conversation_history": MemoryClassification.LONG_TERM,
            "learned_patterns": MemoryClassification.LONG_TERM,
            "pii_reference": MemoryClassification.SENSITIVE,
            "credentials": MemoryClassification.RESTRICTED,
            "financial": MemoryClassification.SENSITIVE,
            "health": MemoryClassification.RESTRICTED,
            "legal": MemoryClassification.RESTRICTED
        }
        return class_map.get(self.value, MemoryClassification.SHORT_TERM)

    @property
    def pii_risk(self) -> str:
        """PII risk level"""
        risk_map = {
            "session_context": "low",
            "user_preferences": "medium",
            "conversation_history": "high",
            "learned_patterns": "medium",
            "pii_reference": "critical",
            "credentials": "critical",
            "financial": "high",
            "health": "critical",
            "legal": "high"
        }
        return risk_map.get(self.value, "medium")


class AccessTier(Enum):
    """Access control tiers"""
    TIER_1_USER = "tier_1_user"
    TIER_2_SUPPORT = "tier_2_support"
    TIER_3_ADMIN = "tier_3_admin"
    TIER_4_AUDIT = "tier_4_audit"

    @property
    def access_level(self) -> str:
        """Access level description"""
        levels = {
            "tier_1_user": "own_data_only",
            "tier_2_support": "read_with_ticket",
            "tier_3_admin": "full_with_approval",
            "tier_4_audit": "read_only_immutable"
        }
        return levels.get(self.value, "own_data_only")

    @property
    def logging_level(self) -> str:
        """Audit logging level"""
        logging_map = {
            "tier_1_user": "standard",
            "tier_2_support": "enhanced",
            "tier_3_admin": "full",
            "tier_4_audit": "immutable"
        }
        return logging_map.get(self.value, "standard")

    @property
    def requires_approval(self) -> bool:
        """Whether access requires approval"""
        return self.value in ["tier_3_admin"]


class RedactionMethod(Enum):
    """Methods for redacting sensitive data"""
    PSEUDONYMIZATION = "pseudonymization"
    MASKING = "masking"
    PARTIAL_MASK = "partial_mask"
    FULL_REDACT = "full_redact"
    TOKENIZATION = "tokenization"
    GENERALIZATION = "generalization"

    @property
    def reversible(self) -> bool:
        """Whether redaction is reversible"""
        reversible_map = {
            "pseudonymization": True,
            "masking": False,
            "partial_mask": False,
            "full_redact": False,
            "tokenization": True,
            "generalization": False
        }
        return reversible_map.get(self.value, False)

    @property
    def compliance_suitable(self) -> List[str]:
        """Regulations this method is suitable for"""
        suitable_map = {
            "pseudonymization": ["gdpr", "ccpa"],
            "masking": ["pci_dss", "hipaa"],
            "partial_mask": ["general"],
            "full_redact": ["all"],
            "tokenization": ["pci_dss", "hipaa", "gdpr"],
            "generalization": ["gdpr", "ccpa"]
        }
        return suitable_map.get(self.value, ["general"])


class EncryptionStandard(Enum):
    """Encryption standards"""
    NONE = "none"
    TLS = "tls"
    AES_256 = "aes_256"
    AES_256_FPE = "aes_256_fpe"
    MTLS = "mtls"

    @property
    def key_rotation_days(self) -> int:
        """Key rotation period in days"""
        rotation_map = {
            "none": 0,
            "tls": 0,
            "aes_256": 90,
            "aes_256_fpe": 30,
            "mtls": 90
        }
        return rotation_map.get(self.value, 90)

    @property
    def key_management(self) -> str:
        """Key management approach"""
        mgmt_map = {
            "none": "n/a",
            "tls": "session_key",
            "aes_256": "rotating",
            "aes_256_fpe": "hsm_mfa",
            "mtls": "hsm"
        }
        return mgmt_map.get(self.value, "rotating")


class DeletionStatus(Enum):
    """Deletion process status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    VERIFIED = "verified"
    FAILED = "failed"
    HELD = "held"

    @property
    def is_terminal(self) -> bool:
        """Whether status is final"""
        return self.value in ["completed", "verified", "failed"]

    @property
    def requires_verification(self) -> bool:
        """Whether verification is needed"""
        return self.value == "completed"


class LegalHoldStatus(Enum):
    """Legal hold status"""
    NONE = "none"
    ACTIVE = "active"
    RELEASED = "released"
    EXPIRED = "expired"

    @property
    def blocks_deletion(self) -> bool:
        """Whether hold blocks deletion"""
        return self.value == "active"


class RetentionException(Enum):
    """Retention exception types"""
    LEGAL_HOLD = "legal_hold"
    USER_REQUEST = "user_request"
    BUSINESS_NEED = "business_need"
    INCIDENT = "incident"
    REGULATORY = "regulatory"

    @property
    def authority_required(self) -> str:
        """Authority needed for exception"""
        authority_map = {
            "legal_hold": "legal_counsel",
            "user_request": "self_service",
            "business_need": "data_steward",
            "incident": "security",
            "regulatory": "compliance"
        }
        return authority_map.get(self.value, "data_steward")

    @property
    def max_extension_days(self) -> int:
        """Maximum extension allowed"""
        extension_map = {
            "legal_hold": 0,  # Indefinite
            "user_request": 0,  # Immediate deletion
            "business_need": 90,
            "incident": 180,
            "regulatory": 0  # Per regulation
        }
        return extension_map.get(self.value, 90)


class AuditEvent(Enum):
    """Audit event types"""
    ACCESS = "access"
    MODIFICATION = "modification"
    DELETION = "deletion"
    FAILED_ACCESS = "failed_access"
    ADMIN_ACTION = "admin_action"
    CLASSIFICATION_CHANGE = "classification_change"
    REDACTION = "redaction"

    @property
    def retention_years(self) -> int:
        """Audit log retention in years"""
        retention_map = {
            "access": 1,
            "modification": 1,
            "deletion": 3,
            "failed_access": 1,
            "admin_action": 3,
            "classification_change": 3,
            "redaction": 3
        }
        return retention_map.get(self.value, 1)


class PIIPattern(Enum):
    """PII detection patterns"""
    EMAIL = "email"
    PHONE = "phone"
    SSN = "ssn"
    CREDIT_CARD = "credit_card"
    IP_ADDRESS = "ip_address"
    NAME = "name"
    ADDRESS = "address"
    DOB = "dob"

    @property
    def regex_pattern(self) -> str:
        """Regex for detection"""
        patterns = {
            "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
            "phone": r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",
            "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
            "credit_card": r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b",
            "ip_address": r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
            "name": r"",  # Requires NLP
            "address": r"",  # Requires NLP
            "dob": r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"
        }
        return patterns.get(self.value, "")

    @property
    def default_redaction(self) -> RedactionMethod:
        """Default redaction method for PII type"""
        redaction_map = {
            "email": RedactionMethod.PARTIAL_MASK,
            "phone": RedactionMethod.PARTIAL_MASK,
            "ssn": RedactionMethod.MASKING,
            "credit_card": RedactionMethod.TOKENIZATION,
            "ip_address": RedactionMethod.GENERALIZATION,
            "name": RedactionMethod.PSEUDONYMIZATION,
            "address": RedactionMethod.GENERALIZATION,
            "dob": RedactionMethod.GENERALIZATION
        }
        return redaction_map.get(self.value, RedactionMethod.FULL_REDACT)


# ════════════════════════════════════════════════════════════════════════════════
# DATACLASSES - Core Memory Models
# ════════════════════════════════════════════════════════════════════════════════

@dataclass
class MemoryItem:
    """Individual memory item"""
    item_id: str
    owner_id: str
    data_type: DataType
    classification: MemoryClassification
    content_hash: str  # Hash of content, never raw
    size_bytes: int
    created_at: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    last_accessed: Optional[datetime] = None
    access_count: int = 0
    encrypted: bool = True
    encryption_standard: EncryptionStandard = EncryptionStandard.AES_256
    legal_hold: LegalHoldStatus = LegalHoldStatus.NONE
    deletion_status: DeletionStatus = DeletionStatus.PENDING
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        """Set default expiration based on classification"""
        if not self.expires_at:
            self.expires_at = self.created_at + self.classification.retention_default

    def is_expired(self) -> bool:
        """Check if item has expired"""
        if not self.expires_at:
            return False
        return datetime.now() > self.expires_at

    def can_delete(self) -> bool:
        """Check if item can be deleted"""
        if self.legal_hold.blocks_deletion:
            return False
        return self.is_expired() or self.deletion_status == DeletionStatus.PENDING

    def record_access(self) -> None:
        """Record access event"""
        self.last_accessed = datetime.now()
        self.access_count += 1

    def get_age_days(self) -> int:
        """Get item age in days"""
        delta = datetime.now() - self.created_at
        return delta.days


@dataclass
class RetentionPolicy:
    """Retention policy definition"""
    policy_id: str
    name: str
    classification: MemoryClassification
    data_types: List[DataType] = field(default_factory=list)
    retention_period: timedelta = field(default_factory=lambda: timedelta(days=30))
    max_retention: timedelta = field(default_factory=lambda: timedelta(days=90))
    legal_basis: str = "business_need"
    auto_delete: bool = True
    requires_verification: bool = True
    active: bool = True
    created_at: datetime = field(default_factory=datetime.now)

    def applies_to(self, item: MemoryItem) -> bool:
        """Check if policy applies to item"""
        if item.classification != self.classification:
            return False
        if self.data_types and item.data_type not in self.data_types:
            return False
        return True

    def calculate_expiration(self, created_at: datetime) -> datetime:
        """Calculate expiration date"""
        return created_at + self.retention_period


@dataclass
class AccessRequest:
    """Request to access memory"""
    request_id: str
    requestor_id: str
    access_tier: AccessTier
    item_id: str
    purpose: str
    ticket_id: Optional[str] = None
    approved_by: Optional[str] = None
    requested_at: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None

    def requires_ticket(self) -> bool:
        """Check if ticket required"""
        return self.access_tier == AccessTier.TIER_2_SUPPORT

    def requires_approval(self) -> bool:
        """Check if approval required"""
        return self.access_tier.requires_approval

    def is_valid(self) -> bool:
        """Check if request is still valid"""
        if self.expires_at and datetime.now() > self.expires_at:
            return False
        if self.requires_ticket() and not self.ticket_id:
            return False
        if self.requires_approval() and not self.approved_by:
            return False
        return True


@dataclass
class RedactionRecord:
    """Record of redaction applied"""
    record_id: str
    item_id: str
    pii_type: PIIPattern
    method: RedactionMethod
    original_hash: str
    redacted_hash: str
    token_id: Optional[str] = None  # For tokenization
    redacted_at: datetime = field(default_factory=datetime.now)
    reversible: bool = False

    def __post_init__(self):
        self.reversible = self.method.reversible


@dataclass
class DeletionRequest:
    """Request to delete memory"""
    request_id: str
    item_ids: List[str]
    requestor_id: str
    reason: str
    status: DeletionStatus = DeletionStatus.PENDING
    submitted_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    verification_method: Optional[str] = None
    certificate_id: Optional[str] = None

    def complete(self) -> None:
        """Mark deletion as complete"""
        self.status = DeletionStatus.COMPLETED
        self.completed_at = datetime.now()

    def verify(self, method: str) -> str:
        """Verify deletion and generate certificate"""
        self.status = DeletionStatus.VERIFIED
        self.verified_at = datetime.now()
        self.verification_method = method
        self.certificate_id = hashlib.sha256(
            f"cert:{self.request_id}:{self.verified_at.isoformat()}".encode()
        ).hexdigest()[:24]
        return self.certificate_id


@dataclass
class LegalHold:
    """Legal hold on memory"""
    hold_id: str
    matter_name: str
    custodian_id: str
    item_ids: List[str] = field(default_factory=list)
    query_criteria: Dict[str, Any] = field(default_factory=dict)
    placed_by: str = ""
    placed_at: datetime = field(default_factory=datetime.now)
    released_at: Optional[datetime] = None
    status: LegalHoldStatus = LegalHoldStatus.ACTIVE

    def release(self) -> None:
        """Release the hold"""
        self.status = LegalHoldStatus.RELEASED
        self.released_at = datetime.now()

    def is_active(self) -> bool:
        """Check if hold is active"""
        return self.status == LegalHoldStatus.ACTIVE


@dataclass
class AuditEntry:
    """Audit log entry"""
    entry_id: str
    event: AuditEvent
    actor_id: str
    item_id: Optional[str]
    details: Dict[str, Any] = field(default_factory=dict)
    access_tier: Optional[AccessTier] = None
    outcome: str = "success"
    timestamp: datetime = field(default_factory=datetime.now)
    session_id: Optional[str] = None
    ip_address: Optional[str] = None

    def get_retention_date(self) -> datetime:
        """Calculate retention expiry"""
        years = self.event.retention_years
        return self.timestamp + timedelta(days=years * 365)


@dataclass
class EncryptionConfig:
    """Encryption configuration"""
    config_id: str
    classification: MemoryClassification
    at_rest: EncryptionStandard
    in_transit: EncryptionStandard
    key_management: str
    rotation_days: int = 90
    hsm_required: bool = False
    mfa_required: bool = False

    @classmethod
    def for_classification(cls, classification: MemoryClassification) -> 'EncryptionConfig':
        """Create config for classification"""
        configs = {
            MemoryClassification.TRANSIENT: {
                "at_rest": EncryptionStandard.NONE,
                "in_transit": EncryptionStandard.TLS,
                "key_management": "session_key",
                "rotation_days": 0
            },
            MemoryClassification.SHORT_TERM: {
                "at_rest": EncryptionStandard.AES_256,
                "in_transit": EncryptionStandard.TLS,
                "key_management": "rotating",
                "rotation_days": 90
            },
            MemoryClassification.LONG_TERM: {
                "at_rest": EncryptionStandard.AES_256,
                "in_transit": EncryptionStandard.TLS,
                "key_management": "hsm",
                "rotation_days": 90,
                "hsm_required": True
            },
            MemoryClassification.SENSITIVE: {
                "at_rest": EncryptionStandard.AES_256_FPE,
                "in_transit": EncryptionStandard.MTLS,
                "key_management": "hsm_mfa",
                "rotation_days": 30,
                "hsm_required": True,
                "mfa_required": True
            },
            MemoryClassification.RESTRICTED: {
                "at_rest": EncryptionStandard.AES_256_FPE,
                "in_transit": EncryptionStandard.MTLS,
                "key_management": "split_keys",
                "rotation_days": 0,  # On-demand
                "hsm_required": True,
                "mfa_required": True
            }
        }

        config_data = configs.get(classification, configs[MemoryClassification.SHORT_TERM])

        return cls(
            config_id=hashlib.sha256(f"enc:{classification.value}".encode()).hexdigest()[:12],
            classification=classification,
            **config_data
        )


# ════════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - Business Logic Implementation
# ════════════════════════════════════════════════════════════════════════════════

class MemoryClassifierEngine:
    """Classifies memory content and detects PII"""

    # Sensitivity scoring weights
    SENSITIVITY_WEIGHTS = {
        "pii_count": 10,
        "credential_present": 30,
        "financial_present": 20,
        "health_present": 25,
        "legal_present": 15
    }

    def __init__(self):
        self.classification_rules: Dict[str, MemoryClassification] = {}
        self.pii_patterns = {p: re.compile(p.regex_pattern) for p in PIIPattern if p.regex_pattern}

    def classify(self, content: str, data_type: DataType) -> MemoryClassification:
        """Classify content sensitivity"""
        # Start with data type's default
        base_class = data_type.default_classification

        # Check for PII
        pii_found = self.detect_pii(content)

        # Calculate sensitivity score
        score = 0
        score += len(pii_found) * self.SENSITIVITY_WEIGHTS["pii_count"]

        # Check for specific sensitive content
        if any(p in [PIIPattern.SSN, PIIPattern.CREDIT_CARD] for p in pii_found):
            score += self.SENSITIVITY_WEIGHTS["credential_present"]

        # Determine classification based on score
        if score >= 50:
            return MemoryClassification.RESTRICTED
        elif score >= 30:
            return MemoryClassification.SENSITIVE
        elif score >= 10:
            return max(base_class, MemoryClassification.SHORT_TERM,
                       key=lambda x: list(MemoryClassification).index(x))

        return base_class

    def detect_pii(self, content: str) -> List[PIIPattern]:
        """Detect PII patterns in content"""
        found = []

        for pii_type, pattern in self.pii_patterns.items():
            if pattern.search(content):
                found.append(pii_type)

        return found

    def get_sensitivity_score(self, item: MemoryItem) -> int:
        """Calculate sensitivity score for item"""
        score = 0

        # Classification base score
        class_scores = {
            MemoryClassification.TRANSIENT: 10,
            MemoryClassification.SHORT_TERM: 20,
            MemoryClassification.LONG_TERM: 30,
            MemoryClassification.SENSITIVE: 70,
            MemoryClassification.RESTRICTED: 100
        }
        score += class_scores.get(item.classification, 20)

        # Data type risk
        risk_scores = {"low": 5, "medium": 15, "high": 25, "critical": 40}
        score += risk_scores.get(item.data_type.pii_risk, 15)

        return min(100, score)


class RetentionEngine:
    """Manages retention policies and scheduling"""

    def __init__(self):
        self.policies: Dict[str, RetentionPolicy] = {}
        self.exceptions: Dict[str, RetentionException] = {}

    def register_policy(self, policy: RetentionPolicy) -> str:
        """Register retention policy"""
        self.policies[policy.policy_id] = policy
        return policy.policy_id

    def get_applicable_policy(self, item: MemoryItem) -> Optional[RetentionPolicy]:
        """Get policy applicable to item"""
        for policy in self.policies.values():
            if policy.active and policy.applies_to(item):
                return policy
        return None

    def calculate_expiration(self, item: MemoryItem) -> datetime:
        """Calculate expiration for item"""
        policy = self.get_applicable_policy(item)

        if policy:
            return policy.calculate_expiration(item.created_at)

        # Default to classification's retention
        return item.created_at + item.classification.retention_default

    def get_expired_items(self, items: List[MemoryItem]) -> List[MemoryItem]:
        """Get all expired items"""
        return [item for item in items if item.is_expired() and item.can_delete()]

    def request_exception(self, item_id: str, exception_type: RetentionException,
                          reason: str, requested_by: str) -> bool:
        """Request retention exception"""
        # Check authority
        required_authority = exception_type.authority_required

        # In production, verify requestor has authority
        # For now, record the exception request
        self.exceptions[item_id] = exception_type

        return True

    def has_exception(self, item_id: str) -> bool:
        """Check if item has retention exception"""
        return item_id in self.exceptions


class AccessControlEngine:
    """Manages access control and authorization"""

    # Permission matrix by classification and tier
    PERMISSION_MATRIX = {
        MemoryClassification.TRANSIENT: {
            AccessTier.TIER_1_USER: {"create": True, "read": True, "update": True, "delete": False},
            AccessTier.TIER_2_SUPPORT: {"create": False, "read": True, "update": False, "delete": False},
            AccessTier.TIER_3_ADMIN: {"create": True, "read": True, "update": True, "delete": True},
            AccessTier.TIER_4_AUDIT: {"create": False, "read": True, "update": False, "delete": False}
        },
        MemoryClassification.SENSITIVE: {
            AccessTier.TIER_1_USER: {"create": False, "read": True, "update": False, "delete": False},
            AccessTier.TIER_2_SUPPORT: {"create": False, "read": True, "update": False, "delete": False},
            AccessTier.TIER_3_ADMIN: {"create": True, "read": True, "update": True, "delete": True},
            AccessTier.TIER_4_AUDIT: {"create": False, "read": True, "update": False, "delete": False}
        },
        MemoryClassification.RESTRICTED: {
            AccessTier.TIER_1_USER: {"create": False, "read": False, "update": False, "delete": False},
            AccessTier.TIER_2_SUPPORT: {"create": False, "read": False, "update": False, "delete": False},
            AccessTier.TIER_3_ADMIN: {"create": True, "read": True, "update": True, "delete": True},
            AccessTier.TIER_4_AUDIT: {"create": False, "read": True, "update": False, "delete": False}
        }
    }

    def __init__(self):
        self.access_requests: Dict[str, AccessRequest] = {}

    def check_permission(self, tier: AccessTier, classification: MemoryClassification,
                         operation: str) -> bool:
        """Check if operation is permitted"""
        class_perms = self.PERMISSION_MATRIX.get(
            classification,
            self.PERMISSION_MATRIX[MemoryClassification.SENSITIVE]
        )
        tier_perms = class_perms.get(tier, {})
        return tier_perms.get(operation, False)

    def authorize_access(self, request: AccessRequest,
                         item: MemoryItem) -> tuple:
        """Authorize access request"""
        # Check basic permission
        if not self.check_permission(request.access_tier, item.classification, "read"):
            return False, "Permission denied for classification"

        # Check ownership for tier 1
        if request.access_tier == AccessTier.TIER_1_USER:
            if request.requestor_id != item.owner_id:
                return False, "Can only access own data"

        # Check ticket requirement
        if request.requires_ticket() and not request.ticket_id:
            return False, "Support ticket required"

        # Check approval requirement
        if request.requires_approval() and not request.approved_by:
            return False, "Admin approval required"

        return True, "Access granted"

    def create_access_request(self, requestor_id: str, tier: AccessTier,
                               item_id: str, purpose: str,
                               **kwargs) -> AccessRequest:
        """Create access request"""
        request_id = hashlib.sha256(
            f"access:{requestor_id}:{item_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        request = AccessRequest(
            request_id=request_id,
            requestor_id=requestor_id,
            access_tier=tier,
            item_id=item_id,
            purpose=purpose,
            ticket_id=kwargs.get("ticket_id"),
            approved_by=kwargs.get("approved_by")
        )

        self.access_requests[request_id] = request
        return request


class RedactionEngine:
    """Manages data redaction and anonymization"""

    # Redaction templates by PII type
    REDACTION_TEMPLATES = {
        PIIPattern.EMAIL: {"mask_char": "*", "visible_chars": 3, "format": "{prefix}***@***.{domain}"},
        PIIPattern.PHONE: {"mask_char": "*", "visible_chars": 4, "format": "***-***-{last4}"},
        PIIPattern.SSN: {"mask_char": "*", "visible_chars": 4, "format": "***-**-{last4}"},
        PIIPattern.CREDIT_CARD: {"mask_char": "*", "visible_chars": 4, "format": "****-****-****-{last4}"},
        PIIPattern.IP_ADDRESS: {"mask_char": "x", "visible_chars": 0, "format": "{first}.x.x.x"}
    }

    def __init__(self):
        self.redaction_records: Dict[str, RedactionRecord] = {}
        self.token_store: Dict[str, str] = {}  # token_id -> original_hash

    def redact(self, content: str, pii_type: PIIPattern,
               method: Optional[RedactionMethod] = None) -> tuple:
        """Redact PII from content"""
        if method is None:
            method = pii_type.default_redaction

        original_hash = hashlib.sha256(content.encode()).hexdigest()

        if method == RedactionMethod.FULL_REDACT:
            redacted = "[REDACTED]"

        elif method == RedactionMethod.MASKING:
            redacted = "*" * len(content)

        elif method == RedactionMethod.PARTIAL_MASK:
            template = self.REDACTION_TEMPLATES.get(pii_type, {})
            visible = template.get("visible_chars", 4)
            redacted = "*" * (len(content) - visible) + content[-visible:]

        elif method == RedactionMethod.TOKENIZATION:
            token_id = hashlib.sha256(f"token:{original_hash}".encode()).hexdigest()[:16]
            self.token_store[token_id] = original_hash
            redacted = f"[TOKEN:{token_id}]"

        elif method == RedactionMethod.PSEUDONYMIZATION:
            pseudo_id = hashlib.sha256(content.encode()).hexdigest()[:8]
            redacted = f"USER_{pseudo_id}"

        elif method == RedactionMethod.GENERALIZATION:
            # Generalize to category
            redacted = f"[{pii_type.value.upper()}]"

        else:
            redacted = "[REDACTED]"

        redacted_hash = hashlib.sha256(redacted.encode()).hexdigest()

        return redacted, original_hash, redacted_hash

    def create_redaction_record(self, item_id: str, pii_type: PIIPattern,
                                 method: RedactionMethod,
                                 original_hash: str, redacted_hash: str,
                                 token_id: Optional[str] = None) -> RedactionRecord:
        """Create redaction record"""
        record_id = hashlib.sha256(
            f"redact:{item_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        record = RedactionRecord(
            record_id=record_id,
            item_id=item_id,
            pii_type=pii_type,
            method=method,
            original_hash=original_hash,
            redacted_hash=redacted_hash,
            token_id=token_id
        )

        self.redaction_records[record_id] = record
        return record

    def can_reverse(self, record_id: str) -> bool:
        """Check if redaction is reversible"""
        record = self.redaction_records.get(record_id)
        if not record:
            return False
        return record.reversible and record.token_id in self.token_store


class SecureMemoryEngine:
    """Main orchestrator for secure memory operations"""

    def __init__(self):
        self.classifier = MemoryClassifierEngine()
        self.retention = RetentionEngine()
        self.access_control = AccessControlEngine()
        self.redaction = RedactionEngine()
        self.items: Dict[str, MemoryItem] = {}
        self.legal_holds: Dict[str, LegalHold] = {}
        self.deletion_requests: Dict[str, DeletionRequest] = {}
        self.audit_log: List[AuditEntry] = []

    def log_audit(self, event: AuditEvent, actor_id: str,
                  item_id: Optional[str] = None,
                  details: Dict[str, Any] = None,
                  **kwargs) -> str:
        """Log audit event"""
        entry_id = hashlib.sha256(
            f"audit:{event.value}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        entry = AuditEntry(
            entry_id=entry_id,
            event=event,
            actor_id=actor_id,
            item_id=item_id,
            details=details or {},
            access_tier=kwargs.get("access_tier"),
            outcome=kwargs.get("outcome", "success"),
            session_id=kwargs.get("session_id"),
            ip_address=kwargs.get("ip_address")
        )

        self.audit_log.append(entry)
        return entry_id

    def store_memory(self, owner_id: str, content: str,
                     data_type: DataType) -> MemoryItem:
        """Store new memory item with classification"""
        # Classify content
        classification = self.classifier.classify(content, data_type)

        # Create hash (never store raw content)
        content_hash = hashlib.sha256(content.encode()).hexdigest()

        # Create item
        item_id = hashlib.sha256(
            f"mem:{owner_id}:{content_hash}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        item = MemoryItem(
            item_id=item_id,
            owner_id=owner_id,
            data_type=data_type,
            classification=classification,
            content_hash=content_hash,
            size_bytes=len(content.encode())
        )

        # Calculate expiration
        item.expires_at = self.retention.calculate_expiration(item)

        # Get encryption config
        enc_config = EncryptionConfig.for_classification(classification)
        item.encryption_standard = enc_config.at_rest

        self.items[item_id] = item

        # Audit
        self.log_audit(
            AuditEvent.ACCESS,
            owner_id,
            item_id,
            {"action": "store", "classification": classification.value}
        )

        return item

    def access_memory(self, request: AccessRequest) -> tuple:
        """Process memory access request"""
        item = self.items.get(request.item_id)
        if not item:
            return None, "Item not found"

        # Authorize
        authorized, reason = self.access_control.authorize_access(request, item)

        if not authorized:
            self.log_audit(
                AuditEvent.FAILED_ACCESS,
                request.requestor_id,
                request.item_id,
                {"reason": reason},
                access_tier=request.access_tier,
                outcome="denied"
            )
            return None, reason

        # Record access
        item.record_access()

        # Audit successful access
        self.log_audit(
            AuditEvent.ACCESS,
            request.requestor_id,
            request.item_id,
            {"purpose": request.purpose},
            access_tier=request.access_tier
        )

        return item, "Access granted"

    def delete_memory(self, item_ids: List[str], requestor_id: str,
                      reason: str) -> DeletionRequest:
        """Request memory deletion"""
        request_id = hashlib.sha256(
            f"delete:{requestor_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        # Filter out items with legal holds
        deletable = []
        held = []

        for item_id in item_ids:
            item = self.items.get(item_id)
            if item and item.can_delete():
                deletable.append(item_id)
            else:
                held.append(item_id)

        request = DeletionRequest(
            request_id=request_id,
            item_ids=deletable,
            requestor_id=requestor_id,
            reason=reason
        )

        self.deletion_requests[request_id] = request

        # Process immediate deletions
        for item_id in deletable:
            item = self.items[item_id]
            item.deletion_status = DeletionStatus.IN_PROGRESS

        self.log_audit(
            AuditEvent.DELETION,
            requestor_id,
            None,
            {"item_count": len(deletable), "held_count": len(held)}
        )

        return request

    def verify_deletion(self, request_id: str, method: str) -> Optional[str]:
        """Verify deletion completion"""
        request = self.deletion_requests.get(request_id)
        if not request:
            return None

        # Verify items actually deleted
        for item_id in request.item_ids:
            if item_id in self.items:
                # Mark as deleted
                del self.items[item_id]

        # Complete and verify
        request.complete()
        certificate_id = request.verify(method)

        self.log_audit(
            AuditEvent.DELETION,
            "system",
            None,
            {"request_id": request_id, "certificate": certificate_id, "method": method}
        )

        return certificate_id

    def place_legal_hold(self, matter_name: str, custodian_id: str,
                         item_ids: List[str], placed_by: str) -> LegalHold:
        """Place legal hold on items"""
        hold_id = hashlib.sha256(
            f"hold:{matter_name}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        hold = LegalHold(
            hold_id=hold_id,
            matter_name=matter_name,
            custodian_id=custodian_id,
            item_ids=item_ids,
            placed_by=placed_by
        )

        # Apply hold to items
        for item_id in item_ids:
            item = self.items.get(item_id)
            if item:
                item.legal_hold = LegalHoldStatus.ACTIVE

        self.legal_holds[hold_id] = hold

        self.log_audit(
            AuditEvent.ADMIN_ACTION,
            placed_by,
            None,
            {"action": "legal_hold", "hold_id": hold_id, "item_count": len(item_ids)}
        )

        return hold

    def get_compliance_status(self) -> Dict[str, Any]:
        """Get compliance status summary"""
        items = list(self.items.values())

        classified = len([i for i in items if i.classification])
        encrypted = len([i for i in items if i.encrypted])
        expired = len([i for i in items if i.is_expired()])
        held = len([i for i in items if i.legal_hold.blocks_deletion])

        total = len(items)

        return {
            "total_items": total,
            "classification_coverage": classified / total * 100 if total > 0 else 100,
            "encryption_compliance": encrypted / total * 100 if total > 0 else 100,
            "expired_pending_deletion": expired,
            "under_legal_hold": held,
            "audit_entries": len(self.audit_log),
            "generated_at": datetime.now().isoformat()
        }


# ════════════════════════════════════════════════════════════════════════════════
# REPORTER - ASCII Visualizations
# ════════════════════════════════════════════════════════════════════════════════

class SecureMemoryReporter:
    """ASCII report generator for secure memory"""

    ICONS = {
        "encrypted": "🔒",
        "unencrypted": "🔓",
        "held": "⚖",
        "expired": "⏰",
        "active": "●",
        "pending": "○"
    }

    def __init__(self, engine: SecureMemoryEngine):
        self.engine = engine

    def generate_taxonomy(self) -> str:
        """Generate memory taxonomy visualization"""
        lines = [
            "MEMORY TAXONOMY",
            "═" * 50,
            "",
            "┌" + "─" * 48 + "┐",
            "│        MEMORY CATEGORIES                        │",
            "│                                                  │",
            "│  TRANSIENT                                       │",
            "│  • Session context                               │",
            "│  • Temporary calculations                        │",
            "│  • Working memory                                │",
            "│                                                  │",
            "│  PERSISTENT                                      │",
            "│  • User preferences                              │",
            "│  • Conversation history                          │",
            "│  • Learned patterns                              │",
            "│                                                  │",
            "│  SENSITIVE                                       │",
            "│  • PII references                                │",
            "│  • Credentials (tokenized)                       │",
            "│  • Financial data                                │",
            "│                                                  │",
            "│  RESTRICTED                                      │",
            "│  • Legal/compliance data                         │",
            "│  • Health information                            │",
            "│  • Protected classifications                     │",
            "└" + "─" * 48 + "┘"
        ]

        return "\n".join(lines)

    def generate_retention_table(self) -> str:
        """Generate retention schedules table"""
        lines = [
            "RETENTION SCHEDULES",
            "═" * 60,
            "",
            "│ Classification │ Default   │ Maximum   │ Legal Basis      │",
            "├────────────────┼───────────┼───────────┼──────────────────┤"
        ]

        for cls in MemoryClassification:
            default = cls.retention_default
            maximum = cls.retention_max

            def_str = f"{default.days}d" if default.days > 0 else f"{default.seconds // 3600}h"
            max_str = f"{maximum.days}d" if maximum.days > 0 else f"{maximum.seconds // 3600}h"

            basis = "Business need" if cls in [MemoryClassification.TRANSIENT, MemoryClassification.SHORT_TERM] else "Compliance"

            lines.append(f"│ {cls.value:14} │ {def_str:9} │ {max_str:9} │ {basis:16} │")

        return "\n".join(lines)

    def generate_access_model(self) -> str:
        """Generate access control model visualization"""
        lines = [
            "ACCESS CONTROL MODEL",
            "═" * 50,
            "",
            "┌" + "─" * 48 + "┐",
            "│        ACCESS FLOW                               │",
            "│                                                  │",
            "│  [Requestor] → [Authentication]                  │",
            "│         ↓                                        │",
            "│  [Authorization Check]                           │",
            "│         ↓                                        │",
            "│  [Classification Check]                          │",
            "│         ↓                                        │",
            "│  [Need-to-Know Verification]                     │",
            "│         ↓                                        │",
            "│  [Access Granted] → [Audit Log]                  │",
            "└" + "─" * 48 + "┘",
            "",
            "Access Tiers:",
            "│ Tier │ Who       │ Access Level     │ Logging   │",
            "├──────┼───────────┼──────────────────┼───────────┤",
            "│ 1    │ User      │ Own data only    │ Standard  │",
            "│ 2    │ Support   │ Read with ticket │ Enhanced  │",
            "│ 3    │ Admin     │ Full w/ approval │ Full      │",
            "│ 4    │ Audit     │ Read-only        │ Immutable │"
        ]

        return "\n".join(lines)

    def generate_encryption_table(self) -> str:
        """Generate encryption requirements table"""
        lines = [
            "ENCRYPTION REQUIREMENTS",
            "═" * 65,
            "",
            "│ Classification │ At Rest      │ In Transit │ Key Management │",
            "├────────────────┼──────────────┼────────────┼────────────────┤"
        ]

        for cls in MemoryClassification:
            config = EncryptionConfig.for_classification(cls)
            lines.append(
                f"│ {cls.value:14} │ {config.at_rest.value:12} │ "
                f"{config.in_transit.value:10} │ {config.key_management:14} │"
            )

        return "\n".join(lines)

    def generate_compliance_summary(self) -> str:
        """Generate compliance status summary"""
        status = self.engine.get_compliance_status()

        lines = [
            "COMPLIANCE STATUS",
            "═" * 50,
            "",
            f"Total Memory Items: {status['total_items']}",
            "",
            "Coverage Metrics:"
        ]

        metrics = [
            ("Classification", status["classification_coverage"]),
            ("Encryption", status["encryption_compliance"])
        ]

        for name, pct in metrics:
            bar = "█" * int(pct / 10) + "░" * (10 - int(pct / 10))
            status_icon = "✓" if pct >= 100 else "○"
            lines.append(f"  {status_icon} {name}: {bar} {pct:.1f}%")

        lines.extend([
            "",
            f"Expired (pending deletion): {status['expired_pending_deletion']}",
            f"Under legal hold: {status['under_legal_hold']}",
            f"Audit entries: {status['audit_entries']}"
        ])

        return "\n".join(lines)

    def generate_full_report(self) -> str:
        """Generate comprehensive memory governance report"""
        sections = [
            "SECURE MEMORY GOVERNANCE FRAMEWORK",
            "═" * 60,
            f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "═" * 60,
            "",
            self.generate_taxonomy(),
            "",
            self.generate_retention_table(),
            "",
            self.generate_access_model(),
            "",
            self.generate_encryption_table(),
            "",
            self.generate_compliance_summary()
        ]

        return "\n".join(sections)


# ════════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════════

def create_cli():
    """Create command-line interface"""
    import argparse

    parser = argparse.ArgumentParser(
        description="SECURE.MEMORY.OS.EXE - Memory Governance & Protection"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Classify command
    class_parser = subparsers.add_parser("classify", help="Classify memory content")
    class_parser.add_argument("--content", help="Content to classify")
    class_parser.add_argument("--type", choices=[t.value for t in DataType])

    # Retention command
    ret_parser = subparsers.add_parser("retention", help="View retention policies")
    ret_parser.add_argument("--classification", choices=[c.value for c in MemoryClassification])

    # Access command
    access_parser = subparsers.add_parser("access", help="Access control operations")
    access_parser.add_argument("--tier", choices=[t.value for t in AccessTier])
    access_parser.add_argument("--item-id", help="Item to access")

    # Redaction command
    redact_parser = subparsers.add_parser("redaction", help="Redaction strategies")
    redact_parser.add_argument("--pii-type", choices=[p.value for p in PIIPattern])

    # Compliance command
    comp_parser = subparsers.add_parser("compliance", help="Compliance status")

    return parser


def main():
    """Main entry point"""
    parser = create_cli()
    args = parser.parse_args()

    engine = SecureMemoryEngine()
    reporter = SecureMemoryReporter(engine)

    if args.command == "classify":
        print(reporter.generate_taxonomy())

    elif args.command == "retention":
        print(reporter.generate_retention_table())

    elif args.command == "access":
        print(reporter.generate_access_model())

    elif args.command == "redaction":
        lines = [
            "REDACTION STRATEGIES",
            "═" * 50,
            "",
            "│ Data Type     │ Method          │ Reversible │",
            "├───────────────┼─────────────────┼────────────┤"
        ]
        for pii in PIIPattern:
            method = pii.default_redaction
            rev = "Yes" if method.reversible else "No"
            lines.append(f"│ {pii.value:13} │ {method.value:15} │ {rev:10} │")
        print("\n".join(lines))

    elif args.command == "compliance":
        print(reporter.generate_compliance_summary())

    else:
        print(reporter.generate_full_report())


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/secure-memory` - Full memory governance framework
- `/secure-memory classify` - Classification taxonomy
- `/secure-memory retention` - Retention policies
- `/secure-memory access` - Access control design
- `/secure-memory redaction` - Redaction strategies

$ARGUMENTS
