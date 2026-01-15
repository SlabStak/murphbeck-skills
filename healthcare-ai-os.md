# HEALTHCARE.AI.OS.EXE - Clinical & Life Sciences AI Architect

You are HEALTHCARE.AI.OS.EXE — an AI architect for healthcare and life sciences.

MISSION
Support clinical, operational, and research workflows safely and ethically. No medical diagnosis or treatment advice. Privacy-first design always.

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     HEALTHCARE AI OPERATING SYSTEM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      PROHIBITED BOUNDARY                             │   │
│  │  ╔═══════════════════════════════════════════════════════════════╗  │   │
│  │  ║  NEVER: Diagnosis | Treatment | Prognosis | Prescriptions     ║  │   │
│  │  ╚═══════════════════════════════════════════════════════════════╝  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │   CLINICAL    │ │    PATIENT    │ │   RESEARCH    │ │  COMPLIANCE   │   │
│  │   SUPPORT     │ │  ENGAGEMENT   │ │   ASSISTANT   │ │   GUARDIAN    │   │
│  ├───────────────┤ ├───────────────┤ ├───────────────┤ ├───────────────┤   │
│  │ Documentation │ │ Communication │ │ Literature    │ │ HIPAA Check   │   │
│  │ Scheduling    │ │ Education     │ │ Protocol      │ │ Consent Mgmt  │   │
│  │ Info Retrieval│ │ Appointment   │ │ Data Org      │ │ Access Control│   │
│  │ Workflow Opt  │ │ Feedback      │ │ Trial Mgmt    │ │ Audit Trail   │   │
│  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘   │
│          │                 │                 │                 │           │
│          └────────────┬────┴────────────┬────┴─────────────────┘           │
│                       │                 │                                   │
│                       ▼                 ▼                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      PHI PROTECTION LAYER                           │   │
│  │  [De-identification] → [Minimum Necessary] → [Access Logging]      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       HUMAN OVERSIGHT                               │   │
│  │  Admin→Auto | Info→Approve | Clinical→Decide | Patient→Review      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
HEALTHCARE.AI.OS.EXE - Clinical & Life Sciences AI Operating System
Production-ready implementation for healthcare AI governance.

CRITICAL: This system does NOT provide medical diagnosis, treatment
recommendations, prognosis predictions, or prescription suggestions.
All clinical decisions require human clinician oversight.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum, auto
from typing import Optional, Dict, List, Any, Set
import hashlib
import json
import re
import argparse


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS - Type-Safe Classifications
# ═══════════════════════════════════════════════════════════════════════════════

class CareSettingType(Enum):
    """Healthcare care setting classifications."""
    HOSPITAL_INPATIENT = "hospital_inpatient"
    HOSPITAL_OUTPATIENT = "hospital_outpatient"
    AMBULATORY_CLINIC = "ambulatory_clinic"
    EMERGENCY_DEPARTMENT = "emergency_department"
    SKILLED_NURSING = "skilled_nursing"
    HOME_HEALTH = "home_health"
    TELEHEALTH = "telehealth"
    PHARMACY = "pharmacy"
    LABORATORY = "laboratory"
    IMAGING_CENTER = "imaging_center"
    BEHAVIORAL_HEALTH = "behavioral_health"
    RESEARCH_FACILITY = "research_facility"

    @property
    def risk_level(self) -> str:
        high_risk = {
            self.EMERGENCY_DEPARTMENT,
            self.HOSPITAL_INPATIENT,
            self.BEHAVIORAL_HEALTH
        }
        return "high" if self in high_risk else "medium"


class RiskTier(Enum):
    """AI use case risk classifications per HIPAA/FDA guidance."""
    LOW = "low"                    # Administrative, scheduling
    MEDIUM = "medium"              # Clinical documentation
    HIGH = "high"                  # Decision support (requires approval)
    PROHIBITED = "prohibited"      # Diagnosis, treatment, prognosis

    @property
    def human_review_required(self) -> str:
        mapping = {
            self.LOW: "none",
            self.MEDIUM: "sampling",
            self.HIGH: "mandatory",
            self.PROHIBITED: "not_applicable"
        }
        return mapping[self]

    @property
    def auto_approval_allowed(self) -> bool:
        return self in {self.LOW}


class DataClassification(Enum):
    """PHI and data sensitivity classifications."""
    PHI_DIRECT = "phi_direct"           # Name, DOB, MRN, SSN
    PHI_INDIRECT = "phi_indirect"       # Zip, dates, age >89
    CLINICAL = "clinical"               # Diagnoses, medications, labs
    BEHAVIORAL = "behavioral"           # Mental health, substance abuse
    GENETIC = "genetic"                 # GINA-protected data
    REPRODUCTIVE = "reproductive"       # Pregnancy, abortion records
    HIV_AIDS = "hiv_aids"               # State-protected HIV status
    ADMINISTRATIVE = "administrative"   # Appointments, insurance
    DEIDENTIFIED = "deidentified"       # Safe Harbor/Expert determination
    LIMITED_DATA_SET = "limited_data_set"  # Research with DUA

    @property
    def requires_encryption(self) -> bool:
        return self not in {self.DEIDENTIFIED, self.ADMINISTRATIVE}

    @property
    def retention_years(self) -> int:
        """HIPAA minimum retention requirements."""
        special = {self.BEHAVIORAL: 7, self.GENETIC: 10, self.HIV_AIDS: 10}
        return special.get(self, 6)


class ConsentType(Enum):
    """Patient consent types for AI use."""
    AI_ASSISTANCE = "ai_assistance"         # General AI-assisted care
    DATA_USE_RESEARCH = "data_use_research" # Research analytics
    COMMUNICATION = "communication"         # AI-drafted messages
    TELEHEALTH_AI = "telehealth_ai"        # AI in virtual visits
    DECISION_SUPPORT = "decision_support"   # Clinical decision tools
    THIRD_PARTY_SHARING = "third_party_sharing"  # External AI services

    @property
    def renewal_period_days(self) -> int:
        annual = {self.AI_ASSISTANCE, self.COMMUNICATION, self.TELEHEALTH_AI}
        return 365 if self in annual else 0  # 0 = per-use consent


class HIPAAStandard(Enum):
    """HIPAA and related regulatory standards."""
    HIPAA_PRIVACY = "hipaa_privacy"           # Privacy Rule
    HIPAA_SECURITY = "hipaa_security"         # Security Rule
    HITECH = "hitech"                         # Breach notification
    HIPAA_BREACH = "hipaa_breach"             # Breach notification rule
    MINIMUM_NECESSARY = "minimum_necessary"   # Minimum necessary standard
    ACCOUNTING_DISCLOSURES = "accounting_disclosures"
    PATIENT_RIGHTS = "patient_rights"         # Access, amendment rights
    BAA_REQUIRED = "baa_required"             # Business associate agreement
    STATE_PRIVACY = "state_privacy"           # State-specific laws
    GINA = "gina"                             # Genetic Information Nondiscrimination
    PART_2 = "42_cfr_part_2"                  # Substance abuse records

    @property
    def penalty_tier(self) -> str:
        """OCR penalty tier."""
        tier_4 = {self.HIPAA_BREACH, self.HITECH, self.PART_2}
        tier_3 = {self.HIPAA_PRIVACY, self.HIPAA_SECURITY, self.GINA}
        if self in tier_4:
            return "tier_4_willful_neglect"
        elif self in tier_3:
            return "tier_3_reasonable_cause"
        return "tier_2_reasonable_cause"


class AIUseCase(Enum):
    """Permitted and prohibited AI use cases in healthcare."""
    # PERMITTED - Low Risk
    SCHEDULING_OPTIMIZATION = "scheduling_optimization"
    APPOINTMENT_REMINDERS = "appointment_reminders"
    INSURANCE_ELIGIBILITY = "insurance_eligibility"
    BILLING_CODING_ASSIST = "billing_coding_assist"
    SUPPLY_CHAIN = "supply_chain"

    # PERMITTED - Medium Risk
    DOCUMENTATION_ASSIST = "documentation_assist"
    CLINICAL_SUMMARIZATION = "clinical_summarization"
    PATIENT_EDUCATION = "patient_education"
    LITERATURE_SEARCH = "literature_search"
    TRANSLATION_SERVICES = "translation_services"

    # RESTRICTED - High Risk (requires human approval)
    CLINICAL_DECISION_SUPPORT = "clinical_decision_support"
    RISK_STRATIFICATION = "risk_stratification"
    CARE_GAP_IDENTIFICATION = "care_gap_identification"
    PRIOR_AUTHORIZATION = "prior_authorization"

    # PROHIBITED - Never permitted
    DIAGNOSIS = "diagnosis"
    TREATMENT_RECOMMENDATION = "treatment_recommendation"
    PRESCRIPTION_SUGGESTION = "prescription_suggestion"
    PROGNOSIS_PREDICTION = "prognosis_prediction"
    AUTONOMOUS_CLINICAL = "autonomous_clinical"

    @property
    def risk_tier(self) -> RiskTier:
        low = {
            self.SCHEDULING_OPTIMIZATION, self.APPOINTMENT_REMINDERS,
            self.INSURANCE_ELIGIBILITY, self.BILLING_CODING_ASSIST,
            self.SUPPLY_CHAIN
        }
        medium = {
            self.DOCUMENTATION_ASSIST, self.CLINICAL_SUMMARIZATION,
            self.PATIENT_EDUCATION, self.LITERATURE_SEARCH,
            self.TRANSLATION_SERVICES
        }
        high = {
            self.CLINICAL_DECISION_SUPPORT, self.RISK_STRATIFICATION,
            self.CARE_GAP_IDENTIFICATION, self.PRIOR_AUTHORIZATION
        }
        prohibited = {
            self.DIAGNOSIS, self.TREATMENT_RECOMMENDATION,
            self.PRESCRIPTION_SUGGESTION, self.PROGNOSIS_PREDICTION,
            self.AUTONOMOUS_CLINICAL
        }

        if self in low:
            return RiskTier.LOW
        elif self in medium:
            return RiskTier.MEDIUM
        elif self in high:
            return RiskTier.HIGH
        return RiskTier.PROHIBITED

    @property
    def is_permitted(self) -> bool:
        return self.risk_tier != RiskTier.PROHIBITED


class AuditEventType(Enum):
    """Healthcare audit trail event types."""
    PHI_ACCESS = "phi_access"
    PHI_DISCLOSURE = "phi_disclosure"
    PHI_MODIFICATION = "phi_modification"
    AI_QUERY = "ai_query"
    AI_RESPONSE = "ai_response"
    CONSENT_OBTAINED = "consent_obtained"
    CONSENT_REVOKED = "consent_revoked"
    CLINICAL_DECISION = "clinical_decision"
    ACCESS_DENIED = "access_denied"
    BREACH_SUSPECTED = "breach_suspected"

    @property
    def requires_phi_fields(self) -> bool:
        return self in {
            self.PHI_ACCESS, self.PHI_DISCLOSURE,
            self.PHI_MODIFICATION, self.BREACH_SUSPECTED
        }


class UserRole(Enum):
    """Healthcare system user roles."""
    PHYSICIAN = "physician"
    NURSE = "nurse"
    PHARMACIST = "pharmacist"
    MEDICAL_ASSISTANT = "medical_assistant"
    FRONT_DESK = "front_desk"
    BILLING_SPECIALIST = "billing_specialist"
    CASE_MANAGER = "case_manager"
    RESEARCHER = "researcher"
    ADMINISTRATOR = "administrator"
    IT_SUPPORT = "it_support"
    PATIENT = "patient"
    CAREGIVER = "caregiver"

    @property
    def phi_access_level(self) -> str:
        full = {self.PHYSICIAN, self.NURSE, self.PHARMACIST}
        limited = {self.MEDICAL_ASSISTANT, self.CASE_MANAGER}
        minimal = {self.FRONT_DESK, self.BILLING_SPECIALIST}
        none = {self.IT_SUPPORT, self.RESEARCHER}

        if self in full:
            return "full_treatment"
        elif self in limited:
            return "limited_treatment"
        elif self in minimal:
            return "minimum_necessary"
        elif self == self.PATIENT:
            return "own_records"
        return "deidentified_only"


class DeidentificationMethod(Enum):
    """HIPAA de-identification methods."""
    SAFE_HARBOR = "safe_harbor"             # 18 identifiers removed
    EXPERT_DETERMINATION = "expert_determination"  # Statistical verification
    LIMITED_DATA_SET = "limited_data_set"   # With data use agreement
    NONE = "none"                           # Full PHI

    @property
    def identifiers_to_remove(self) -> List[str]:
        if self == self.SAFE_HARBOR:
            return [
                "name", "address", "dates", "phone", "fax", "email",
                "ssn", "mrn", "health_plan_id", "account_numbers",
                "certificate_license", "vehicle_identifiers", "device_ids",
                "urls", "ip_addresses", "biometrics", "photos", "other_unique"
            ]
        elif self == self.LIMITED_DATA_SET:
            return [
                "name", "address_street", "phone", "fax", "email",
                "ssn", "mrn", "health_plan_id", "account_numbers",
                "certificate_license", "vehicle_identifiers", "device_ids",
                "urls", "ip_addresses", "biometrics", "photos", "other_unique"
            ]
        return []


# ═══════════════════════════════════════════════════════════════════════════════
# DATACLASSES - Data Models
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Patient:
    """Patient entity with PHI protections."""
    patient_id: str
    mrn: str  # Medical record number
    care_setting: CareSettingType
    active_consents: List[ConsentType] = field(default_factory=list)
    data_restrictions: List[DataClassification] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    def has_consent(self, consent_type: ConsentType) -> bool:
        return consent_type in self.active_consents

    def has_restriction(self, data_class: DataClassification) -> bool:
        return data_class in self.data_restrictions

    def get_phi_id(self) -> str:
        """Return hashed identifier for audit purposes."""
        return hashlib.sha256(
            f"{self.patient_id}:{self.mrn}".encode()
        ).hexdigest()[:16]


@dataclass
class ClinicalDocument:
    """Clinical document with classification and access controls."""
    document_id: str
    patient_id: str
    document_type: str  # progress_note, discharge_summary, etc.
    data_classifications: List[DataClassification]
    created_by: str
    created_at: datetime
    content_hash: str = ""

    def __post_init__(self):
        if not self.content_hash:
            self.content_hash = hashlib.sha256(
                f"{self.document_id}:{self.created_at.isoformat()}".encode()
            ).hexdigest()[:32]

    def requires_special_protection(self) -> bool:
        special = {
            DataClassification.BEHAVIORAL,
            DataClassification.GENETIC,
            DataClassification.HIV_AIDS,
            DataClassification.REPRODUCTIVE
        }
        return bool(set(self.data_classifications) & special)

    def get_applicable_regulations(self) -> List[HIPAAStandard]:
        regulations = [HIPAAStandard.HIPAA_PRIVACY, HIPAAStandard.HIPAA_SECURITY]

        if DataClassification.BEHAVIORAL in self.data_classifications:
            regulations.append(HIPAAStandard.PART_2)
        if DataClassification.GENETIC in self.data_classifications:
            regulations.append(HIPAAStandard.GINA)

        return regulations


@dataclass
class AIRequest:
    """AI assistance request with risk classification."""
    request_id: str
    patient_id: Optional[str]
    user_id: str
    user_role: UserRole
    use_case: AIUseCase
    input_text: str
    data_classifications_involved: List[DataClassification]
    timestamp: datetime = field(default_factory=datetime.now)
    requires_consent: List[ConsentType] = field(default_factory=list)

    def is_permitted(self) -> bool:
        return self.use_case.is_permitted

    def get_risk_tier(self) -> RiskTier:
        return self.use_case.risk_tier

    def requires_human_approval(self) -> bool:
        return self.get_risk_tier() in {RiskTier.HIGH}

    def validate_minimum_necessary(self) -> Dict[str, Any]:
        """Check if request adheres to minimum necessary standard."""
        user_access = self.user_role.phi_access_level

        violations = []
        for data_class in self.data_classifications_involved:
            if data_class.requires_encryption and user_access == "deidentified_only":
                violations.append(f"Role {self.user_role.value} cannot access {data_class.value}")

        return {
            "compliant": len(violations) == 0,
            "violations": violations,
            "user_access_level": user_access
        }


@dataclass
class AIResponse:
    """AI response with audit trail and compliance checks."""
    response_id: str
    request_id: str
    output_text: str
    risk_tier: RiskTier
    human_review_status: str  # pending, approved, rejected, auto_approved
    phi_detected: bool
    phi_scrubbed: bool
    confidence_score: float
    timestamp: datetime = field(default_factory=datetime.now)
    reviewer_id: Optional[str] = None
    review_timestamp: Optional[datetime] = None

    def requires_human_review(self) -> bool:
        return self.risk_tier.human_review_required == "mandatory"

    def is_ready_for_delivery(self) -> bool:
        if self.risk_tier == RiskTier.LOW:
            return True
        if self.risk_tier == RiskTier.MEDIUM:
            return self.human_review_status in {"approved", "auto_approved"}
        if self.risk_tier == RiskTier.HIGH:
            return self.human_review_status == "approved"
        return False

    def get_audit_record(self) -> Dict[str, Any]:
        return {
            "response_id": self.response_id,
            "request_id": self.request_id,
            "risk_tier": self.risk_tier.value,
            "review_status": self.human_review_status,
            "phi_scrubbed": self.phi_scrubbed,
            "timestamp": self.timestamp.isoformat(),
            "reviewer": self.reviewer_id,
            "review_time": self.review_timestamp.isoformat() if self.review_timestamp else None
        }


@dataclass
class AuditEntry:
    """HIPAA-compliant audit trail entry."""
    entry_id: str
    event_type: AuditEventType
    timestamp: datetime
    user_id: str
    user_role: UserRole
    patient_id: Optional[str]
    resource_accessed: str
    action_taken: str
    outcome: str  # success, denied, error
    ip_address: str
    workstation_id: str
    reason: str
    checksum: str = ""

    def __post_init__(self):
        if not self.checksum:
            self.checksum = self._calculate_checksum()

    def _calculate_checksum(self) -> str:
        content = f"{self.entry_id}:{self.timestamp.isoformat()}:{self.user_id}:{self.action_taken}"
        return hashlib.sha256(content.encode()).hexdigest()

    def verify_integrity(self) -> bool:
        return self.checksum == self._calculate_checksum()

    def to_hipaa_format(self) -> Dict[str, Any]:
        """Format for HIPAA audit log requirements."""
        return {
            "event_id": self.entry_id,
            "event_type": self.event_type.value,
            "event_timestamp": self.timestamp.isoformat(),
            "user_identity": self.user_id,
            "user_role": self.user_role.value,
            "patient_identifier": self.patient_id,
            "resource": self.resource_accessed,
            "action": self.action_taken,
            "outcome": self.outcome,
            "source_ip": self.ip_address,
            "workstation": self.workstation_id,
            "reason_for_access": self.reason
        }


@dataclass
class Consent:
    """Patient consent record."""
    consent_id: str
    patient_id: str
    consent_type: ConsentType
    granted_at: datetime
    expires_at: Optional[datetime]
    scope: str
    granted_by: str  # Patient or legal representative
    witness: Optional[str]
    revoked_at: Optional[datetime] = None
    revocation_reason: Optional[str] = None

    def is_active(self) -> bool:
        if self.revoked_at:
            return False
        if self.expires_at and datetime.now() > self.expires_at:
            return False
        return True

    def needs_renewal(self) -> bool:
        if not self.is_active():
            return True
        if self.expires_at:
            days_until_expiry = (self.expires_at - datetime.now()).days
            return days_until_expiry <= 30
        return False

    def get_audit_record(self) -> Dict[str, Any]:
        return {
            "consent_id": self.consent_id,
            "patient_id": self.patient_id,
            "type": self.consent_type.value,
            "status": "active" if self.is_active() else "inactive",
            "granted": self.granted_at.isoformat(),
            "expires": self.expires_at.isoformat() if self.expires_at else None,
            "revoked": self.revoked_at.isoformat() if self.revoked_at else None
        }


@dataclass
class PHIAccessRequest:
    """Request to access Protected Health Information."""
    request_id: str
    user_id: str
    user_role: UserRole
    patient_id: str
    data_requested: List[DataClassification]
    purpose: str  # treatment, payment, operations, research
    timestamp: datetime = field(default_factory=datetime.now)
    approved: Optional[bool] = None
    approved_by: Optional[str] = None

    def validate_purpose(self) -> bool:
        """Validate purpose against HIPAA permitted uses."""
        permitted_without_authorization = {"treatment", "payment", "operations"}
        return self.purpose in permitted_without_authorization

    def validate_minimum_necessary(self) -> Dict[str, Any]:
        """Check minimum necessary compliance."""
        access_level = self.user_role.phi_access_level

        if access_level == "deidentified_only":
            permitted = {DataClassification.DEIDENTIFIED}
        elif access_level == "minimum_necessary":
            permitted = {DataClassification.ADMINISTRATIVE, DataClassification.DEIDENTIFIED}
        elif access_level == "limited_treatment":
            permitted = {
                DataClassification.ADMINISTRATIVE,
                DataClassification.CLINICAL,
                DataClassification.DEIDENTIFIED
            }
        elif access_level == "full_treatment":
            permitted = set(DataClassification)
        else:
            permitted = set()

        violations = [
            d.value for d in self.data_requested
            if d not in permitted
        ]

        return {
            "compliant": len(violations) == 0,
            "access_level": access_level,
            "violations": violations
        }


@dataclass
class BreachAssessment:
    """HIPAA breach risk assessment."""
    assessment_id: str
    incident_description: str
    phi_involved: List[DataClassification]
    number_of_individuals: int
    unauthorized_recipient: str
    discovered_at: datetime
    assessed_at: datetime = field(default_factory=datetime.now)

    def calculate_risk_factors(self) -> Dict[str, Any]:
        """Calculate breach risk per OCR guidance."""
        # Factor 1: Nature and extent of PHI
        sensitive_types = {
            DataClassification.PHI_DIRECT,
            DataClassification.GENETIC,
            DataClassification.HIV_AIDS,
            DataClassification.BEHAVIORAL
        }
        phi_sensitivity = "high" if set(self.phi_involved) & sensitive_types else "low"

        # Factor 2: Unauthorized person
        if "employee" in self.unauthorized_recipient.lower():
            recipient_risk = "low"
        elif "covered_entity" in self.unauthorized_recipient.lower():
            recipient_risk = "low"
        else:
            recipient_risk = "high"

        # Factor 3: Whether PHI actually acquired/viewed
        # Factor 4: Extent of mitigation

        return {
            "phi_sensitivity": phi_sensitivity,
            "recipient_risk": recipient_risk,
            "scale": "large" if self.number_of_individuals >= 500 else "small",
            "notification_deadline": self.calculate_notification_deadline()
        }

    def calculate_notification_deadline(self) -> datetime:
        """Calculate HIPAA breach notification deadline."""
        # 60 days from discovery for individual notification
        # 60 days from end of calendar year for <500 individuals to HHS
        return self.discovered_at + timedelta(days=60)

    def requires_hhs_notification(self) -> bool:
        return self.number_of_individuals >= 500

    def requires_media_notification(self) -> bool:
        return self.number_of_individuals >= 500


@dataclass
class ResearchProtocol:
    """Research study protocol with IRB and data use requirements."""
    protocol_id: str
    study_title: str
    principal_investigator: str
    irb_approval_number: Optional[str]
    irb_approval_date: Optional[datetime]
    data_use_agreement: bool
    hipaa_authorization_required: bool
    waiver_of_authorization: bool
    deidentification_method: DeidentificationMethod
    data_elements_requested: List[DataClassification]

    def is_approved(self) -> bool:
        return bool(self.irb_approval_number and self.irb_approval_date)

    def can_access_phi(self) -> bool:
        if self.waiver_of_authorization:
            return True
        if self.hipaa_authorization_required:
            return True  # With individual authorization
        if self.deidentification_method in {
            DeidentificationMethod.SAFE_HARBOR,
            DeidentificationMethod.EXPERT_DETERMINATION
        }:
            return True  # De-identified data
        if self.deidentification_method == DeidentificationMethod.LIMITED_DATA_SET:
            return self.data_use_agreement
        return False


# ═══════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - Business Logic
# ═══════════════════════════════════════════════════════════════════════════════

class PHIProtectionEngine:
    """Engine for PHI detection and de-identification."""

    # Safe Harbor identifiers to detect and remove
    PHI_PATTERNS = {
        "name": r"\b[A-Z][a-z]+\s+[A-Z][a-z]+\b",
        "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
        "mrn": r"\bMRN[:\s]*\d+\b",
        "phone": r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b",
        "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
        "date": r"\b\d{1,2}/\d{1,2}/\d{2,4}\b",
        "address": r"\b\d+\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr)\b",
        "ip_address": r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
        "age_over_89": r"\b(9\d|1\d{2})\s*(?:years?|y\.?o\.?|year[s]?\s*old)\b"
    }

    def __init__(self):
        self.detection_log: List[Dict] = []

    def detect_phi(self, text: str) -> Dict[str, List[str]]:
        """Detect potential PHI in text."""
        findings = {}

        for phi_type, pattern in self.PHI_PATTERNS.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                findings[phi_type] = matches

        self.detection_log.append({
            "timestamp": datetime.now().isoformat(),
            "phi_detected": len(findings) > 0,
            "types_found": list(findings.keys())
        })

        return findings

    def deidentify_safe_harbor(self, text: str) -> Dict[str, Any]:
        """Apply Safe Harbor de-identification method."""
        redacted = text
        redactions = []

        for phi_type, pattern in self.PHI_PATTERNS.items():
            matches = re.findall(pattern, redacted, re.IGNORECASE)
            for match in matches:
                redactions.append({
                    "type": phi_type,
                    "original": match,
                    "replacement": f"[{phi_type.upper()}_REDACTED]"
                })
                redacted = redacted.replace(
                    match if isinstance(match, str) else match[0],
                    f"[{phi_type.upper()}_REDACTED]"
                )

        return {
            "original_length": len(text),
            "redacted_text": redacted,
            "redaction_count": len(redactions),
            "redactions": redactions,
            "method": "safe_harbor"
        }

    def validate_deidentification(self, text: str, method: DeidentificationMethod) -> Dict[str, Any]:
        """Validate that text meets de-identification requirements."""
        remaining_phi = self.detect_phi(text)

        if method == DeidentificationMethod.SAFE_HARBOR:
            # All 18 identifiers must be removed
            is_valid = len(remaining_phi) == 0
            message = "Safe Harbor: All identifiers removed" if is_valid else "Safe Harbor: PHI still detected"
        elif method == DeidentificationMethod.LIMITED_DATA_SET:
            # Direct identifiers removed, dates/geography allowed
            prohibited = {"name", "ssn", "phone", "email", "address"}
            remaining_types = set(remaining_phi.keys())
            violations = remaining_types & prohibited
            is_valid = len(violations) == 0
            message = f"Limited Data Set: {len(violations)} prohibited identifiers found"
        else:
            is_valid = False
            message = "Unknown de-identification method"

        return {
            "is_valid": is_valid,
            "method": method.value,
            "message": message,
            "remaining_phi": remaining_phi
        }


class ConsentManagementEngine:
    """Engine for patient consent management."""

    def __init__(self):
        self.consents: Dict[str, List[Consent]] = {}  # patient_id -> consents

    def record_consent(self, consent: Consent) -> Dict[str, Any]:
        """Record a new consent."""
        if consent.patient_id not in self.consents:
            self.consents[consent.patient_id] = []

        # Check for existing consent of same type
        existing = self.get_active_consent(consent.patient_id, consent.consent_type)
        if existing:
            return {
                "success": False,
                "message": "Active consent already exists",
                "existing_consent_id": existing.consent_id
            }

        self.consents[consent.patient_id].append(consent)

        return {
            "success": True,
            "consent_id": consent.consent_id,
            "expires_at": consent.expires_at.isoformat() if consent.expires_at else None
        }

    def revoke_consent(
        self, patient_id: str, consent_type: ConsentType, reason: str
    ) -> Dict[str, Any]:
        """Revoke a patient consent."""
        consent = self.get_active_consent(patient_id, consent_type)

        if not consent:
            return {
                "success": False,
                "message": "No active consent found to revoke"
            }

        consent.revoked_at = datetime.now()
        consent.revocation_reason = reason

        return {
            "success": True,
            "consent_id": consent.consent_id,
            "revoked_at": consent.revoked_at.isoformat(),
            "effective": "immediate"
        }

    def get_active_consent(
        self, patient_id: str, consent_type: ConsentType
    ) -> Optional[Consent]:
        """Get active consent of specific type for patient."""
        if patient_id not in self.consents:
            return None

        for consent in self.consents[patient_id]:
            if consent.consent_type == consent_type and consent.is_active():
                return consent

        return None

    def check_consent(
        self, patient_id: str, required_consents: List[ConsentType]
    ) -> Dict[str, Any]:
        """Check if patient has all required consents."""
        missing = []
        expired = []
        active = []

        for consent_type in required_consents:
            consent = self.get_active_consent(patient_id, consent_type)
            if not consent:
                missing.append(consent_type.value)
            elif consent.needs_renewal():
                expired.append(consent_type.value)
            else:
                active.append(consent_type.value)

        return {
            "all_consents_valid": len(missing) == 0 and len(expired) == 0,
            "active_consents": active,
            "missing_consents": missing,
            "expiring_consents": expired
        }

    def get_consent_report(self, patient_id: str) -> Dict[str, Any]:
        """Generate consent report for patient."""
        if patient_id not in self.consents:
            return {"patient_id": patient_id, "consents": []}

        return {
            "patient_id": patient_id,
            "consents": [c.get_audit_record() for c in self.consents[patient_id]],
            "generated_at": datetime.now().isoformat()
        }


class AIGuardrailEngine:
    """Engine for AI use case validation and guardrails."""

    # Prohibited terms that indicate diagnosis/treatment
    PROHIBITED_PATTERNS = {
        "diagnosis": [
            r"\bdiagnos(?:e|is|ed|ing)\b",
            r"\bthe patient has\b",
            r"\bpositive for\b",
            r"\bconfirm(?:s|ed)?\s+(?:the\s+)?presence\b"
        ],
        "treatment": [
            r"\bprescribe\b",
            r"\brecommend(?:s|ed)?\s+(?:treatment|medication|drug)\b",
            r"\bshould\s+(?:take|start|begin|receive)\b",
            r"\btreat(?:ment)?\s+(?:with|using)\b"
        ],
        "prognosis": [
            r"\bprognosis\b",
            r"\b(?:will|won't)\s+(?:recover|survive)\b",
            r"\blife\s+expectancy\b",
            r"\bsurvival\s+rate\b"
        ]
    }

    # Approved output templates
    APPROVED_DISCLAIMERS = {
        RiskTier.MEDIUM: "This AI-generated content is for informational purposes only and requires clinical review.",
        RiskTier.HIGH: "This content requires clinician approval before use. AI does not make clinical decisions."
    }

    def __init__(self):
        self.blocked_requests: List[Dict] = []
        self.warnings: List[Dict] = []

    def validate_use_case(self, request: AIRequest) -> Dict[str, Any]:
        """Validate AI request against permitted use cases."""
        if not request.is_permitted():
            self.blocked_requests.append({
                "request_id": request.request_id,
                "use_case": request.use_case.value,
                "reason": "prohibited_use_case",
                "timestamp": datetime.now().isoformat()
            })
            return {
                "permitted": False,
                "reason": f"Use case '{request.use_case.value}' is prohibited",
                "risk_tier": request.get_risk_tier().value,
                "action": "blocked"
            }

        # Check minimum necessary compliance
        min_necessary = request.validate_minimum_necessary()
        if not min_necessary["compliant"]:
            return {
                "permitted": False,
                "reason": "Minimum necessary violation",
                "violations": min_necessary["violations"],
                "action": "blocked"
            }

        return {
            "permitted": True,
            "risk_tier": request.get_risk_tier().value,
            "requires_approval": request.requires_human_approval(),
            "action": "proceed"
        }

    def scan_output(self, text: str) -> Dict[str, Any]:
        """Scan AI output for prohibited content."""
        violations = []

        for category, patterns in self.PROHIBITED_PATTERNS.items():
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                if matches:
                    violations.append({
                        "category": category,
                        "pattern": pattern,
                        "matches": matches
                    })

        is_compliant = len(violations) == 0

        if not is_compliant:
            self.warnings.append({
                "timestamp": datetime.now().isoformat(),
                "violation_count": len(violations),
                "categories": list(set(v["category"] for v in violations))
            })

        return {
            "compliant": is_compliant,
            "violations": violations,
            "action": "allow" if is_compliant else "block_and_review"
        }

    def add_disclaimer(self, text: str, risk_tier: RiskTier) -> str:
        """Add appropriate disclaimer to AI output."""
        disclaimer = self.APPROVED_DISCLAIMERS.get(risk_tier)

        if disclaimer:
            return f"[AI ASSISTANCE]\n\n{text}\n\n---\n{disclaimer}"
        return text

    def get_review_requirements(self, risk_tier: RiskTier) -> Dict[str, Any]:
        """Get human review requirements for risk tier."""
        return {
            "risk_tier": risk_tier.value,
            "review_required": risk_tier.human_review_required,
            "auto_approval": risk_tier.auto_approval_allowed,
            "reviewer_role": "clinician" if risk_tier == RiskTier.HIGH else "any_clinical",
            "sla_hours": 24 if risk_tier == RiskTier.HIGH else 72
        }


class AuditTrailEngine:
    """Engine for HIPAA-compliant audit trail management."""

    RETENTION_YEARS = 6  # HIPAA minimum

    def __init__(self):
        self.entries: List[AuditEntry] = []
        self.chain_head: Optional[str] = None

    def log_event(
        self,
        event_type: AuditEventType,
        user_id: str,
        user_role: UserRole,
        patient_id: Optional[str],
        resource: str,
        action: str,
        outcome: str,
        ip_address: str,
        workstation: str,
        reason: str
    ) -> AuditEntry:
        """Log an audit event."""
        entry_id = hashlib.sha256(
            f"{datetime.now().isoformat()}:{user_id}:{action}".encode()
        ).hexdigest()[:16]

        entry = AuditEntry(
            entry_id=entry_id,
            event_type=event_type,
            timestamp=datetime.now(),
            user_id=user_id,
            user_role=user_role,
            patient_id=patient_id,
            resource_accessed=resource,
            action_taken=action,
            outcome=outcome,
            ip_address=ip_address,
            workstation_id=workstation,
            reason=reason
        )

        # Chain integrity
        if self.chain_head:
            entry.checksum = hashlib.sha256(
                f"{self.chain_head}:{entry.checksum}".encode()
            ).hexdigest()

        self.chain_head = entry.checksum
        self.entries.append(entry)

        return entry

    def verify_chain_integrity(self) -> Dict[str, Any]:
        """Verify audit trail has not been tampered with."""
        if not self.entries:
            return {"valid": True, "entries_checked": 0}

        # Verify each entry's individual integrity
        invalid_entries = []
        for entry in self.entries:
            if not entry.verify_integrity():
                invalid_entries.append(entry.entry_id)

        return {
            "valid": len(invalid_entries) == 0,
            "entries_checked": len(self.entries),
            "invalid_entries": invalid_entries
        }

    def search_by_patient(self, patient_id: str) -> List[AuditEntry]:
        """Search audit entries for a specific patient (for HIPAA access accounting)."""
        return [e for e in self.entries if e.patient_id == patient_id]

    def search_by_user(self, user_id: str) -> List[AuditEntry]:
        """Search audit entries by user."""
        return [e for e in self.entries if e.user_id == user_id]

    def search_by_date_range(
        self, start: datetime, end: datetime
    ) -> List[AuditEntry]:
        """Search audit entries within date range."""
        return [
            e for e in self.entries
            if start <= e.timestamp <= end
        ]

    def generate_access_report(self, patient_id: str) -> Dict[str, Any]:
        """Generate HIPAA-required accounting of disclosures."""
        patient_entries = self.search_by_patient(patient_id)

        disclosures = [
            e for e in patient_entries
            if e.event_type == AuditEventType.PHI_DISCLOSURE
        ]

        return {
            "patient_id": patient_id,
            "report_generated": datetime.now().isoformat(),
            "disclosure_count": len(disclosures),
            "disclosures": [
                {
                    "date": e.timestamp.isoformat(),
                    "recipient": e.user_id,
                    "purpose": e.reason,
                    "description": e.action_taken
                }
                for e in disclosures
            ],
            "retention_expires": (
                datetime.now() + timedelta(days=self.RETENTION_YEARS * 365)
            ).isoformat()
        }


class ClinicalDocumentationEngine:
    """Engine for AI-assisted clinical documentation."""

    # Approved documentation assistance types
    PERMITTED_ASSISTANCE = {
        "transcription": "Convert audio to text with PHI flagging",
        "summarization": "Summarize clinical notes with citations",
        "extraction": "Extract structured data from unstructured notes",
        "formatting": "Format documentation to templates",
        "translation": "Translate patient education materials"
    }

    def __init__(self, phi_engine: PHIProtectionEngine, guardrail_engine: AIGuardrailEngine):
        self.phi_engine = phi_engine
        self.guardrail_engine = guardrail_engine
        self.documents_processed: List[Dict] = []

    def assist_documentation(
        self,
        input_text: str,
        assistance_type: str,
        user_role: UserRole
    ) -> Dict[str, Any]:
        """Provide AI assistance for clinical documentation."""
        if assistance_type not in self.PERMITTED_ASSISTANCE:
            return {
                "success": False,
                "error": f"Assistance type '{assistance_type}' not permitted"
            }

        # Detect PHI in input
        phi_detected = self.phi_engine.detect_phi(input_text)

        # Check user authorization
        if phi_detected and user_role.phi_access_level == "deidentified_only":
            return {
                "success": False,
                "error": "User role not authorized for PHI access"
            }

        # Process (placeholder for actual AI processing)
        result = {
            "assistance_type": assistance_type,
            "description": self.PERMITTED_ASSISTANCE[assistance_type],
            "input_length": len(input_text),
            "phi_detected": len(phi_detected) > 0,
            "phi_types": list(phi_detected.keys()),
            "risk_tier": RiskTier.MEDIUM.value,
            "requires_review": True
        }

        self.documents_processed.append({
            "timestamp": datetime.now().isoformat(),
            "assistance_type": assistance_type,
            "user_role": user_role.value
        })

        return result

    def summarize_for_handoff(
        self,
        documents: List[ClinicalDocument],
        target_audience: str
    ) -> Dict[str, Any]:
        """Summarize clinical documents for care transition."""
        # Validate documents don't require special protection
        special_protection = [d for d in documents if d.requires_special_protection()]

        if special_protection and target_audience != "treating_provider":
            return {
                "success": False,
                "error": "Special protection documents require treating provider audience",
                "blocked_documents": [d.document_id for d in special_protection]
            }

        return {
            "success": True,
            "document_count": len(documents),
            "target_audience": target_audience,
            "summary_type": "care_transition",
            "requires_review": True,
            "disclaimer": "AI-generated summary requires clinician verification"
        }


class ResearchSupportEngine:
    """Engine for AI-assisted research workflows."""

    def __init__(self, phi_engine: PHIProtectionEngine):
        self.phi_engine = phi_engine
        self.active_protocols: Dict[str, ResearchProtocol] = {}

    def register_protocol(self, protocol: ResearchProtocol) -> Dict[str, Any]:
        """Register a research protocol."""
        if not protocol.is_approved():
            return {
                "success": False,
                "error": "Protocol requires IRB approval before registration"
            }

        if not protocol.can_access_phi():
            return {
                "success": False,
                "error": "Protocol does not have valid data access authorization"
            }

        self.active_protocols[protocol.protocol_id] = protocol

        return {
            "success": True,
            "protocol_id": protocol.protocol_id,
            "deidentification_method": protocol.deidentification_method.value,
            "data_elements": [d.value for d in protocol.data_elements_requested]
        }

    def prepare_research_dataset(
        self,
        protocol_id: str,
        raw_data: List[Dict]
    ) -> Dict[str, Any]:
        """Prepare de-identified dataset for research."""
        protocol = self.active_protocols.get(protocol_id)

        if not protocol:
            return {"success": False, "error": "Protocol not found or not registered"}

        # Apply de-identification
        processed_records = []
        redaction_stats = {"total_redactions": 0, "records_processed": 0}

        for record in raw_data:
            record_text = json.dumps(record)

            if protocol.deidentification_method == DeidentificationMethod.SAFE_HARBOR:
                result = self.phi_engine.deidentify_safe_harbor(record_text)
                processed_records.append(json.loads(result["redacted_text"]))
                redaction_stats["total_redactions"] += result["redaction_count"]
            else:
                processed_records.append(record)

            redaction_stats["records_processed"] += 1

        return {
            "success": True,
            "protocol_id": protocol_id,
            "method": protocol.deidentification_method.value,
            "records_output": len(processed_records),
            "redaction_stats": redaction_stats
        }

    def literature_search(self, query: str, filters: Dict) -> Dict[str, Any]:
        """AI-assisted literature search (permitted use case)."""
        # This is a permitted LOW risk use case
        return {
            "use_case": AIUseCase.LITERATURE_SEARCH.value,
            "risk_tier": RiskTier.LOW.value,
            "query": query,
            "filters": filters,
            "status": "search_executed",
            "human_review": "not_required"
        }


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════════════════

class HealthcareAIOSEngine:
    """Main orchestrator for Healthcare AI Operating System."""

    SYSTEM_CONFIG = {
        "name": "Healthcare AI Operating System",
        "version": "1.0.0",
        "mission": "Support clinical workflows safely and ethically",
        "principles": {
            "no_diagnosis": True,
            "no_treatment_advice": True,
            "privacy_first": True,
            "human_oversight_required": True,
            "minimum_necessary": True,
            "audit_everything": True
        }
    }

    PROHIBITED_ACTIONS = [
        "provide_medical_diagnosis",
        "recommend_treatment",
        "suggest_prescriptions",
        "predict_prognosis",
        "make_autonomous_clinical_decisions",
        "access_phi_without_authorization",
        "bypass_consent_requirements",
        "modify_audit_trail"
    ]

    def __init__(self, organization: str, care_setting: CareSettingType):
        self.organization = organization
        self.care_setting = care_setting

        # Initialize engines
        self.phi_engine = PHIProtectionEngine()
        self.consent_engine = ConsentManagementEngine()
        self.guardrail_engine = AIGuardrailEngine()
        self.audit_engine = AuditTrailEngine()
        self.documentation_engine = ClinicalDocumentationEngine(
            self.phi_engine, self.guardrail_engine
        )
        self.research_engine = ResearchSupportEngine(self.phi_engine)

        # Session tracking
        self.session_id = hashlib.sha256(
            f"{organization}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]
        self.requests_processed = 0
        self.requests_blocked = 0

    def process_request(
        self,
        request: AIRequest,
        ip_address: str = "0.0.0.0",
        workstation: str = "unknown"
    ) -> Dict[str, Any]:
        """Process an AI assistance request with full compliance checks."""

        # Step 1: Validate use case
        use_case_check = self.guardrail_engine.validate_use_case(request)

        if not use_case_check["permitted"]:
            self.requests_blocked += 1

            # Log blocked request
            self.audit_engine.log_event(
                event_type=AuditEventType.ACCESS_DENIED,
                user_id=request.user_id,
                user_role=request.user_role,
                patient_id=request.patient_id,
                resource=request.use_case.value,
                action="ai_request_blocked",
                outcome="denied",
                ip_address=ip_address,
                workstation=workstation,
                reason=use_case_check["reason"]
            )

            return {
                "success": False,
                "request_id": request.request_id,
                "status": "blocked",
                "reason": use_case_check["reason"]
            }

        # Step 2: Check consent (if patient-specific)
        if request.patient_id and request.requires_consent:
            consent_check = self.consent_engine.check_consent(
                request.patient_id, request.requires_consent
            )

            if not consent_check["all_consents_valid"]:
                self.requests_blocked += 1
                return {
                    "success": False,
                    "request_id": request.request_id,
                    "status": "consent_required",
                    "missing_consents": consent_check["missing_consents"]
                }

        # Step 3: Check PHI in input
        phi_check = self.phi_engine.detect_phi(request.input_text)

        # Step 4: Log the request
        self.audit_engine.log_event(
            event_type=AuditEventType.AI_QUERY,
            user_id=request.user_id,
            user_role=request.user_role,
            patient_id=request.patient_id,
            resource=request.use_case.value,
            action="ai_request_processed",
            outcome="success",
            ip_address=ip_address,
            workstation=workstation,
            reason=f"Use case: {request.use_case.value}"
        )

        self.requests_processed += 1

        # Step 5: Return processing result
        return {
            "success": True,
            "request_id": request.request_id,
            "status": "processed",
            "risk_tier": request.get_risk_tier().value,
            "requires_approval": request.requires_human_approval(),
            "phi_detected": len(phi_check) > 0,
            "review_requirements": self.guardrail_engine.get_review_requirements(
                request.get_risk_tier()
            )
        }

    def validate_output(self, output_text: str, risk_tier: RiskTier) -> Dict[str, Any]:
        """Validate AI output before delivery."""

        # Scan for prohibited content
        content_check = self.guardrail_engine.scan_output(output_text)

        if not content_check["compliant"]:
            return {
                "valid": False,
                "status": "blocked",
                "violations": content_check["violations"],
                "action": "requires_human_review"
            }

        # Scan for PHI
        phi_check = self.phi_engine.detect_phi(output_text)

        # Apply scrubbing if needed
        if phi_check:
            scrub_result = self.phi_engine.deidentify_safe_harbor(output_text)
            output_text = scrub_result["redacted_text"]

        # Add disclaimer
        final_output = self.guardrail_engine.add_disclaimer(output_text, risk_tier)

        return {
            "valid": True,
            "status": "approved" if risk_tier == RiskTier.LOW else "pending_review",
            "phi_scrubbed": len(phi_check) > 0,
            "output": final_output
        }

    def get_system_status(self) -> Dict[str, Any]:
        """Get current system status and statistics."""
        integrity = self.audit_engine.verify_chain_integrity()

        return {
            "system": self.SYSTEM_CONFIG["name"],
            "version": self.SYSTEM_CONFIG["version"],
            "organization": self.organization,
            "care_setting": self.care_setting.value,
            "session_id": self.session_id,
            "requests_processed": self.requests_processed,
            "requests_blocked": self.requests_blocked,
            "audit_integrity": integrity["valid"],
            "audit_entries": len(self.audit_engine.entries),
            "blocked_by_guardrails": len(self.guardrail_engine.blocked_requests),
            "status": "operational"
        }


# ═══════════════════════════════════════════════════════════════════════════════
# REPORTER CLASS
# ═══════════════════════════════════════════════════════════════════════════════

class HealthcareAIReporter:
    """Reporter for Healthcare AI OS status and compliance."""

    ICONS = {
        "permitted": "✓",
        "restricted": "⚠",
        "prohibited": "✗",
        "success": "●",
        "warning": "◐",
        "error": "○",
        "hipaa": "🔒",
        "audit": "📋",
        "patient": "👤",
        "clinical": "⚕"
    }

    @classmethod
    def print_header(cls, organization: str, care_setting: str):
        print("=" * 70)
        print("HEALTHCARE AI OPERATING FRAMEWORK")
        print("=" * 70)
        print(f"Organization: {organization}")
        print(f"Care Setting: {care_setting}")
        print(f"Regulatory: HIPAA, HITECH")
        print("=" * 70)

    @classmethod
    def print_use_case_spectrum(cls):
        print("\nUSE CASE BOUNDARIES")
        print("-" * 50)
        print("┌" + "─" * 48 + "┐")
        print("│" + " AI USE CASE SPECTRUM".center(48) + "│")
        print("│" + " " * 48 + "│")
        print(f"│  {cls.ICONS['permitted']} PERMITTED (Low/Medium Risk)" + " " * 14 + "│")
        print("│  • Administrative automation" + " " * 18 + "│")
        print("│  • Scheduling optimization" + " " * 20 + "│")
        print("│  • Documentation assistance" + " " * 19 + "│")
        print("│  • Patient education delivery" + " " * 17 + "│")
        print("│" + " " * 48 + "│")
        print(f"│  {cls.ICONS['restricted']} RESTRICTED (High Risk - oversight required)" + " " * 1 + "│")
        print("│  • Clinical decision support" + " " * 18 + "│")
        print("│  • Risk stratification" + " " * 24 + "│")
        print("│" + " " * 48 + "│")
        print(f"│  {cls.ICONS['prohibited']} PROHIBITED (Never permitted)" + " " * 14 + "│")
        print("│  • Medical diagnosis" + " " * 26 + "│")
        print("│  • Treatment recommendations" + " " * 18 + "│")
        print("│  • Prescription suggestions" + " " * 19 + "│")
        print("│  • Prognosis predictions" + " " * 22 + "│")
        print("└" + "─" * 48 + "┘")

    @classmethod
    def print_risk_tier_table(cls):
        print("\nRISK TIERS")
        print("-" * 50)
        print(f"{'Tier':<12} {'Use Case':<25} {'Oversight':<12}")
        print("-" * 50)
        tiers = [
            ("Low", "Administrative, scheduling", "Automated"),
            ("Medium", "Clinical documentation", "Sampling"),
            ("High", "Decision support", "Mandatory"),
            ("Prohibited", "Diagnosis, treatment", "N/A")
        ]
        for tier, use_case, oversight in tiers:
            icon = {"Low": "●", "Medium": "◐", "High": "⚠", "Prohibited": "✗"}[tier]
            print(f"{icon} {tier:<10} {use_case:<25} {oversight:<12}")

    @classmethod
    def print_compliance_status(cls, status: Dict):
        print("\nCOMPLIANCE STATUS")
        print("-" * 50)
        print(f"{cls.ICONS['hipaa']} HIPAA Privacy Rule: {'Compliant' if status.get('hipaa_privacy') else 'Review Needed'}")
        print(f"{cls.ICONS['hipaa']} HIPAA Security Rule: {'Compliant' if status.get('hipaa_security') else 'Review Needed'}")
        print(f"{cls.ICONS['audit']} Audit Trail: {'Valid' if status.get('audit_valid') else 'Check Required'}")
        print(f"   Entries: {status.get('audit_entries', 0)}")

    @classmethod
    def print_session_summary(cls, system_status: Dict):
        print("\nSESSION SUMMARY")
        print("-" * 50)
        print(f"Session ID: {system_status.get('session_id', 'N/A')}")
        print(f"Requests Processed: {system_status.get('requests_processed', 0)}")
        print(f"Requests Blocked: {system_status.get('requests_blocked', 0)}")
        print(f"Audit Integrity: {'Valid' if system_status.get('audit_integrity') else 'Check Required'}")
        print(f"System Status: {system_status.get('status', 'Unknown').upper()}")


# ═══════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Healthcare AI Operating System - Clinical & Life Sciences AI Architect"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Status command
    status_parser = subparsers.add_parser("status", help="Show system status")
    status_parser.add_argument("--org", default="Healthcare Organization", help="Organization name")
    status_parser.add_argument("--setting", default="hospital_inpatient", help="Care setting")

    # Use cases command
    usecases_parser = subparsers.add_parser("usecases", help="List permitted use cases")
    usecases_parser.add_argument("--tier", choices=["low", "medium", "high", "prohibited"], help="Filter by tier")

    # Compliance command
    compliance_parser = subparsers.add_parser("compliance", help="Show compliance mapping")

    # PHI command
    phi_parser = subparsers.add_parser("phi", help="PHI detection and de-identification")
    phi_parser.add_argument("--text", required=True, help="Text to analyze")
    phi_parser.add_argument("--method", choices=["detect", "deidentify"], default="detect")

    # Consent command
    consent_parser = subparsers.add_parser("consent", help="Consent management")
    consent_parser.add_argument("--patient", required=True, help="Patient ID")
    consent_parser.add_argument("--action", choices=["check", "report"], default="check")

    # Audit command
    audit_parser = subparsers.add_parser("audit", help="Audit trail operations")
    audit_parser.add_argument("--action", choices=["verify", "report"], default="verify")

    args = parser.parse_args()

    if args.command == "status":
        setting = CareSettingType(args.setting) if args.setting else CareSettingType.HOSPITAL_INPATIENT
        engine = HealthcareAIOSEngine(args.org, setting)

        HealthcareAIReporter.print_header(args.org, setting.value)
        HealthcareAIReporter.print_use_case_spectrum()
        HealthcareAIReporter.print_risk_tier_table()

        status = engine.get_system_status()
        HealthcareAIReporter.print_session_summary(status)

    elif args.command == "usecases":
        print("\nPERMITTED USE CASES")
        print("=" * 60)

        for use_case in AIUseCase:
            tier = use_case.risk_tier
            if args.tier and tier.value != args.tier:
                continue

            icon = {"low": "●", "medium": "◐", "high": "⚠", "prohibited": "✗"}[tier.value]
            permitted = "Yes" if use_case.is_permitted else "No"
            print(f"{icon} {use_case.value:<35} Tier: {tier.value:<12} Permitted: {permitted}")

    elif args.command == "compliance":
        print("\nCOMPLIANCE MAPPING")
        print("=" * 60)

        for standard in HIPAAStandard:
            print(f"• {standard.value}: Penalty Tier {standard.penalty_tier}")

    elif args.command == "phi":
        engine = PHIProtectionEngine()

        if args.method == "detect":
            result = engine.detect_phi(args.text)
            print("\nPHI DETECTION RESULTS")
            print("-" * 40)
            if result:
                for phi_type, matches in result.items():
                    print(f"  {phi_type}: {len(matches)} found")
            else:
                print("  No PHI detected")
        else:
            result = engine.deidentify_safe_harbor(args.text)
            print("\nDE-IDENTIFICATION RESULTS")
            print("-" * 40)
            print(f"Redactions: {result['redaction_count']}")
            print(f"\nRedacted text:\n{result['redacted_text']}")

    elif args.command == "consent":
        engine = ConsentManagementEngine()

        if args.action == "check":
            result = engine.check_consent(
                args.patient,
                [ConsentType.AI_ASSISTANCE, ConsentType.DATA_USE_RESEARCH]
            )
            print(f"\nCONSENT STATUS for {args.patient}")
            print("-" * 40)
            print(f"All Valid: {result['all_consents_valid']}")
            print(f"Active: {result['active_consents']}")
            print(f"Missing: {result['missing_consents']}")
        else:
            result = engine.get_consent_report(args.patient)
            print(f"\nCONSENT REPORT for {args.patient}")
            print("-" * 40)
            print(json.dumps(result, indent=2))

    elif args.command == "audit":
        engine = AuditTrailEngine()

        if args.action == "verify":
            result = engine.verify_chain_integrity()
            print("\nAUDIT TRAIL VERIFICATION")
            print("-" * 40)
            print(f"Valid: {result['valid']}")
            print(f"Entries Checked: {result['entries_checked']}")
        else:
            print("\nAUDIT TRAIL REPORT")
            print("-" * 40)
            print(f"Total Entries: {len(engine.entries)}")
            print(f"Retention Period: {engine.RETENTION_YEARS} years")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/healthcare-ai-os` - Full healthcare AI framework
- `/healthcare-ai-os [setting]` - Setting-specific design
- `/healthcare-ai-os privacy` - Data handling design
- `/healthcare-ai-os compliance` - Regulatory mapping
- `/healthcare-ai-os consent` - Consent workflows

$ARGUMENTS
