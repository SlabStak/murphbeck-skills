# FINANCE.AI.OS.EXE - Financial Services AI Operating System

You are **FINANCE.AI.OS.EXE** — an AI systems architect for financial institutions and fintech platforms.

## MISSION

Design AI systems that operate within financial controls, risk tolerance, and auditability requirements. No financial advice. Conservative risk posture. Full auditability required.

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FINANCE AI OPERATING SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         REGULATORY LAYER                             │   │
│  │  BSA │ AML │ KYC │ FCRA │ ECOA │ GDPR │ SOX │ SEC │ FINRA │ PCI-DSS │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      CONTROL FRAMEWORK                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │    RISK      │  │  COMPLIANCE  │  │    AUDIT     │               │   │
│  │  │  MANAGEMENT  │  │   ENGINE     │  │    TRAIL     │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        AI CAPABILITIES                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │  FRAUD   │ │  CREDIT  │ │  AML/    │ │ CUSTOMER │ │ TRADING  │  │   │
│  │  │DETECTION │ │ SCORING  │ │   KYC    │ │ SERVICE  │ │ SUPPORT  │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    HUMAN OVERSIGHT LAYER                             │   │
│  │         All Critical Decisions Require Human Approval                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PRODUCTION IMPLEMENTATION

```python
"""
FINANCE.AI.OS.EXE - Financial Services AI Operating System
Production implementation for financial AI with full regulatory compliance.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum, auto
from typing import Optional, Dict, List, Any, Tuple, Set
from decimal import Decimal, ROUND_HALF_UP
import hashlib
import json
import statistics


# ============================================================================
# ENUMS - Type-Safe Classifications
# ============================================================================

class InstitutionType(Enum):
    """Types of financial institutions."""
    COMMERCIAL_BANK = "commercial_bank"
    INVESTMENT_BANK = "investment_bank"
    CREDIT_UNION = "credit_union"
    FINTECH = "fintech"
    INSURANCE = "insurance"
    BROKERAGE = "brokerage"
    ASSET_MANAGEMENT = "asset_management"
    PAYMENT_PROCESSOR = "payment_processor"
    LENDING_PLATFORM = "lending_platform"
    CRYPTOCURRENCY = "cryptocurrency"


class RiskLevel(Enum):
    """Risk classification levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    MINIMAL = "minimal"

    @property
    def threshold_multiplier(self) -> float:
        multipliers = {
            RiskLevel.CRITICAL: 0.5,
            RiskLevel.HIGH: 0.7,
            RiskLevel.MEDIUM: 1.0,
            RiskLevel.LOW: 1.5,
            RiskLevel.MINIMAL: 2.0
        }
        return multipliers[self]


class Regulation(Enum):
    """Financial regulations and compliance frameworks."""
    BSA = "Bank Secrecy Act"
    AML = "Anti-Money Laundering"
    KYC = "Know Your Customer"
    FCRA = "Fair Credit Reporting Act"
    ECOA = "Equal Credit Opportunity Act"
    GDPR = "General Data Protection Regulation"
    CCPA = "California Consumer Privacy Act"
    SOX = "Sarbanes-Oxley Act"
    PCI_DSS = "Payment Card Industry Data Security Standard"
    GLBA = "Gramm-Leach-Bliley Act"
    TILA = "Truth in Lending Act"
    UDAAP = "Unfair Deceptive Abusive Acts Practices"
    SEC_REG = "SEC Regulations"
    FINRA_RULES = "FINRA Rules"
    OFAC = "Office of Foreign Assets Control"


class TransactionType(Enum):
    """Types of financial transactions."""
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRANSFER = "transfer"
    PAYMENT = "payment"
    WIRE = "wire_transfer"
    ACH = "ach_transfer"
    CARD_PURCHASE = "card_purchase"
    ATM = "atm_transaction"
    LOAN_DISBURSEMENT = "loan_disbursement"
    LOAN_PAYMENT = "loan_payment"
    INVESTMENT = "investment"
    TRADE = "trade"
    FEE = "fee"
    REFUND = "refund"
    CHARGEBACK = "chargeback"


class FraudType(Enum):
    """Types of fraud patterns."""
    ACCOUNT_TAKEOVER = "account_takeover"
    IDENTITY_THEFT = "identity_theft"
    CARD_FRAUD = "card_fraud"
    CHECK_FRAUD = "check_fraud"
    WIRE_FRAUD = "wire_fraud"
    LOAN_FRAUD = "loan_fraud"
    MONEY_LAUNDERING = "money_laundering"
    STRUCTURING = "structuring"
    SYNTHETIC_IDENTITY = "synthetic_identity"
    FIRST_PARTY_FRAUD = "first_party_fraud"
    INSIDER_FRAUD = "insider_fraud"


class AlertStatus(Enum):
    """Status of fraud/compliance alerts."""
    NEW = "new"
    UNDER_REVIEW = "under_review"
    ESCALATED = "escalated"
    CONFIRMED_FRAUD = "confirmed_fraud"
    FALSE_POSITIVE = "false_positive"
    CLOSED = "closed"
    SAR_FILED = "sar_filed"


class DataClassification(Enum):
    """Data sensitivity classification."""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    HIGHLY_CONFIDENTIAL = "highly_confidential"
    RESTRICTED = "restricted"

    @property
    def retention_years(self) -> int:
        retention = {
            DataClassification.PUBLIC: 1,
            DataClassification.INTERNAL: 3,
            DataClassification.CONFIDENTIAL: 5,
            DataClassification.HIGHLY_CONFIDENTIAL: 7,
            DataClassification.RESTRICTED: 10
        }
        return retention[self]


class CreditDecision(Enum):
    """Credit decision outcomes."""
    APPROVED = "approved"
    CONDITIONALLY_APPROVED = "conditionally_approved"
    DECLINED = "declined"
    MANUAL_REVIEW = "manual_review"
    INSUFFICIENT_DATA = "insufficient_data"


class CustomerRiskRating(Enum):
    """KYC customer risk ratings."""
    LOW_RISK = "low_risk"
    MEDIUM_RISK = "medium_risk"
    HIGH_RISK = "high_risk"
    PROHIBITED = "prohibited"
    PEP = "politically_exposed_person"
    SANCTIONS_MATCH = "sanctions_match"


class OversightLevel(Enum):
    """Level of human oversight required."""
    AUTOMATED = "automated"
    SAMPLING = "sampling"
    REVIEW_ALL = "review_all"
    DUAL_APPROVAL = "dual_approval"
    COMMITTEE = "committee_approval"


class AuditEventType(Enum):
    """Types of audit events."""
    DECISION_MADE = "decision_made"
    THRESHOLD_BREACH = "threshold_breach"
    DATA_ACCESS = "data_access"
    MODEL_PREDICTION = "model_prediction"
    HUMAN_OVERRIDE = "human_override"
    ALERT_GENERATED = "alert_generated"
    SAR_FILED = "sar_filed"
    CUSTOMER_ACTION = "customer_action"
    SYSTEM_CHANGE = "system_change"
    EXCEPTION_GRANTED = "exception_granted"


# ============================================================================
# DATACLASSES - Structured Data Models
# ============================================================================

@dataclass
class Customer:
    """Financial services customer profile."""
    customer_id: str
    name: str
    customer_type: str  # individual, business
    risk_rating: CustomerRiskRating
    onboarding_date: datetime
    last_kyc_review: datetime
    country: str
    occupation: Optional[str] = None
    industry: Optional[str] = None
    annual_income: Optional[Decimal] = None
    source_of_funds: Optional[str] = None
    pep_status: bool = False
    sanctions_screened: bool = True
    adverse_media: List[str] = field(default_factory=list)

    def needs_enhanced_due_diligence(self) -> bool:
        """Determine if enhanced due diligence is required."""
        return (
            self.risk_rating in [CustomerRiskRating.HIGH_RISK, CustomerRiskRating.PEP] or
            self.pep_status or
            len(self.adverse_media) > 0 or
            self.country in HIGH_RISK_COUNTRIES
        )

    def kyc_expired(self, review_period_months: int = 12) -> bool:
        """Check if KYC review is due."""
        review_due = self.last_kyc_review + timedelta(days=review_period_months * 30)
        return datetime.now() > review_due

    def generate_id(self) -> str:
        """Generate unique customer identifier."""
        data = f"{self.name}:{self.onboarding_date.isoformat()}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]


@dataclass
class Transaction:
    """Financial transaction record."""
    transaction_id: str
    customer_id: str
    transaction_type: TransactionType
    amount: Decimal
    currency: str
    timestamp: datetime
    source_account: str
    destination_account: Optional[str] = None
    counterparty: Optional[str] = None
    country: Optional[str] = None
    channel: str = "online"
    ip_address: Optional[str] = None
    device_id: Optional[str] = None
    memo: Optional[str] = None
    risk_score: Optional[float] = None
    flagged: bool = False

    def is_high_value(self, threshold: Decimal = Decimal("10000")) -> bool:
        """Check if transaction exceeds high-value threshold."""
        return self.amount >= threshold

    def is_international(self) -> bool:
        """Check if transaction is cross-border."""
        return self.country is not None and self.country != "US"

    def is_structuring_candidate(self, threshold: Decimal = Decimal("10000")) -> bool:
        """Check if transaction might be structured to avoid reporting."""
        return Decimal("9000") <= self.amount < threshold


@dataclass
class FraudAlert:
    """Fraud detection alert."""
    alert_id: str
    customer_id: str
    transaction_id: Optional[str]
    fraud_type: FraudType
    risk_score: float
    status: AlertStatus
    created_at: datetime
    detection_rule: str
    evidence: Dict[str, Any] = field(default_factory=dict)
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    sar_reference: Optional[str] = None

    def requires_sar(self) -> bool:
        """Determine if Suspicious Activity Report is required."""
        return (
            self.status == AlertStatus.CONFIRMED_FRAUD and
            self.fraud_type in [
                FraudType.MONEY_LAUNDERING,
                FraudType.STRUCTURING,
                FraudType.WIRE_FRAUD,
                FraudType.IDENTITY_THEFT
            ]
        )

    def escalation_overdue(self, hours: int = 24) -> bool:
        """Check if escalation is overdue."""
        if self.status not in [AlertStatus.NEW, AlertStatus.UNDER_REVIEW]:
            return False
        return datetime.now() > self.created_at + timedelta(hours=hours)

    def generate_id(self) -> str:
        """Generate unique alert identifier."""
        data = f"{self.customer_id}:{self.created_at.isoformat()}:{self.fraud_type.value}"
        return f"ALT-{hashlib.sha256(data.encode()).hexdigest()[:12].upper()}"


@dataclass
class CreditApplication:
    """Credit application with decision tracking."""
    application_id: str
    customer_id: str
    product_type: str  # credit_card, loan, mortgage, line_of_credit
    requested_amount: Decimal
    submitted_at: datetime
    credit_score: Optional[int] = None
    debt_to_income: Optional[float] = None
    employment_verified: bool = False
    income_verified: bool = False
    collateral_value: Optional[Decimal] = None
    decision: Optional[CreditDecision] = None
    decision_factors: List[str] = field(default_factory=list)
    approved_amount: Optional[Decimal] = None
    interest_rate: Optional[float] = None
    decision_timestamp: Optional[datetime] = None
    reviewer_id: Optional[str] = None

    def calculate_risk_score(self) -> float:
        """Calculate credit risk score (simplified model)."""
        score = 0.0

        # Credit score component (40%)
        if self.credit_score:
            if self.credit_score >= 750:
                score += 40
            elif self.credit_score >= 700:
                score += 30
            elif self.credit_score >= 650:
                score += 20
            elif self.credit_score >= 600:
                score += 10

        # DTI component (30%)
        if self.debt_to_income:
            if self.debt_to_income <= 0.28:
                score += 30
            elif self.debt_to_income <= 0.36:
                score += 20
            elif self.debt_to_income <= 0.43:
                score += 10

        # Verification component (30%)
        if self.employment_verified:
            score += 15
        if self.income_verified:
            score += 15

        return score

    def generate_adverse_action_reasons(self) -> List[str]:
        """Generate ECOA-compliant adverse action reasons."""
        reasons = []

        if self.credit_score and self.credit_score < 650:
            reasons.append("Credit score below minimum requirement")

        if self.debt_to_income and self.debt_to_income > 0.43:
            reasons.append("Debt-to-income ratio exceeds guidelines")

        if not self.employment_verified:
            reasons.append("Unable to verify employment")

        if not self.income_verified:
            reasons.append("Unable to verify income")

        return reasons[:4]  # ECOA limits to 4 reasons


@dataclass
class RiskThreshold:
    """Risk threshold configuration."""
    threshold_id: str
    name: str
    metric: str
    warning_value: float
    critical_value: float
    current_value: Optional[float] = None
    last_updated: Optional[datetime] = None
    breach_count: int = 0

    def is_warning(self) -> bool:
        """Check if in warning state."""
        if self.current_value is None:
            return False
        return self.warning_value <= self.current_value < self.critical_value

    def is_critical(self) -> bool:
        """Check if in critical state."""
        if self.current_value is None:
            return False
        return self.current_value >= self.critical_value

    def update(self, value: float) -> str:
        """Update threshold value and return status."""
        self.current_value = value
        self.last_updated = datetime.now()

        if self.is_critical():
            self.breach_count += 1
            return "CRITICAL"
        elif self.is_warning():
            return "WARNING"
        return "NORMAL"


@dataclass
class AuditEntry:
    """Immutable audit trail entry."""
    entry_id: str
    event_type: AuditEventType
    timestamp: datetime
    actor: str
    action: str
    resource: str
    resource_id: str
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    checksum: Optional[str] = None

    def __post_init__(self):
        """Generate checksum for integrity verification."""
        if self.checksum is None:
            self.checksum = self._compute_checksum()

    def _compute_checksum(self) -> str:
        """Compute SHA-256 checksum of entry."""
        data = {
            "entry_id": self.entry_id,
            "event_type": self.event_type.value,
            "timestamp": self.timestamp.isoformat(),
            "actor": self.actor,
            "action": self.action,
            "resource": self.resource,
            "resource_id": self.resource_id
        }
        return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()

    def verify_integrity(self) -> bool:
        """Verify entry has not been tampered with."""
        return self.checksum == self._compute_checksum()


@dataclass
class ComplianceControl:
    """Compliance control definition."""
    control_id: str
    regulation: Regulation
    name: str
    description: str
    control_type: str  # preventive, detective, corrective
    frequency: str  # real-time, daily, weekly, monthly, quarterly
    owner: str
    evidence_required: List[str] = field(default_factory=list)
    last_tested: Optional[datetime] = None
    test_result: Optional[str] = None  # pass, fail, partial
    findings: List[str] = field(default_factory=list)

    def is_due_for_testing(self) -> bool:
        """Check if control testing is due."""
        if self.last_tested is None:
            return True

        frequency_days = {
            "real-time": 1,
            "daily": 1,
            "weekly": 7,
            "monthly": 30,
            "quarterly": 90
        }

        days = frequency_days.get(self.frequency, 30)
        return datetime.now() > self.last_tested + timedelta(days=days)


@dataclass
class ModelDecision:
    """AI model decision record with explainability."""
    decision_id: str
    model_name: str
    model_version: str
    input_features: Dict[str, Any]
    output: Any
    confidence: float
    timestamp: datetime
    explanation: Dict[str, float] = field(default_factory=dict)  # Feature importance
    human_reviewed: bool = False
    human_decision: Optional[str] = None
    reviewer_id: Optional[str] = None
    review_notes: Optional[str] = None

    def get_top_factors(self, n: int = 5) -> List[Tuple[str, float]]:
        """Get top n factors influencing the decision."""
        sorted_factors = sorted(
            self.explanation.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        )
        return sorted_factors[:n]

    def requires_review(self, confidence_threshold: float = 0.85) -> bool:
        """Check if decision requires human review."""
        return self.confidence < confidence_threshold


@dataclass
class SARReport:
    """Suspicious Activity Report (SAR) tracking."""
    sar_id: str
    alert_ids: List[str]
    customer_id: str
    filing_date: datetime
    suspicious_activity: str
    amount_involved: Decimal
    date_range_start: datetime
    date_range_end: datetime
    narrative: str
    filed_by: str
    status: str = "draft"  # draft, submitted, acknowledged
    fincen_confirmation: Optional[str] = None

    def days_to_file(self) -> int:
        """Calculate days remaining to meet 30-day filing requirement."""
        earliest_alert = min(self.date_range_start, self.date_range_end)
        deadline = earliest_alert + timedelta(days=30)
        return (deadline - datetime.now()).days


# ============================================================================
# CONSTANTS
# ============================================================================

HIGH_RISK_COUNTRIES = {
    "AF", "BY", "BI", "CF", "CU", "CD", "IR", "IQ", "LB", "LY",
    "ML", "MM", "NI", "KP", "PK", "RU", "SO", "SS", "SD", "SY",
    "VE", "YE", "ZW"
}

CTR_THRESHOLD = Decimal("10000")  # Currency Transaction Report threshold
SAR_FILING_DEADLINE_DAYS = 30


# ============================================================================
# ENGINE CLASSES - Business Logic
# ============================================================================

class FraudDetectionEngine:
    """Real-time fraud detection engine."""

    DETECTION_RULES = {
        "velocity_check": {
            "description": "Unusual transaction frequency",
            "threshold_transactions": 10,
            "threshold_hours": 1
        },
        "amount_anomaly": {
            "description": "Transaction amount deviation",
            "std_deviation_multiplier": 3.0
        },
        "geographic_anomaly": {
            "description": "Unusual geographic pattern",
            "high_risk_countries": HIGH_RISK_COUNTRIES
        },
        "device_anomaly": {
            "description": "New or suspicious device",
            "max_devices_per_day": 3
        },
        "structuring": {
            "description": "Possible transaction structuring",
            "threshold": CTR_THRESHOLD,
            "lower_bound_pct": 0.9
        }
    }

    def __init__(self):
        self.transaction_history: Dict[str, List[Transaction]] = {}
        self.device_history: Dict[str, Set[str]] = {}
        self.alerts: List[FraudAlert] = []

    def analyze_transaction(self, transaction: Transaction,
                           customer: Customer) -> List[FraudAlert]:
        """Analyze transaction for fraud indicators."""
        alerts = []

        # Get customer's transaction history
        history = self.transaction_history.get(transaction.customer_id, [])

        # Rule 1: Velocity check
        velocity_alert = self._check_velocity(transaction, history)
        if velocity_alert:
            alerts.append(velocity_alert)

        # Rule 2: Amount anomaly
        amount_alert = self._check_amount_anomaly(transaction, history)
        if amount_alert:
            alerts.append(amount_alert)

        # Rule 3: Geographic anomaly
        geo_alert = self._check_geographic_anomaly(transaction, customer)
        if geo_alert:
            alerts.append(geo_alert)

        # Rule 4: Structuring detection
        structuring_alert = self._check_structuring(transaction, history)
        if structuring_alert:
            alerts.append(structuring_alert)

        # Update history
        if transaction.customer_id not in self.transaction_history:
            self.transaction_history[transaction.customer_id] = []
        self.transaction_history[transaction.customer_id].append(transaction)

        return alerts

    def _check_velocity(self, transaction: Transaction,
                       history: List[Transaction]) -> Optional[FraudAlert]:
        """Check for unusual transaction velocity."""
        rule = self.DETECTION_RULES["velocity_check"]
        cutoff = transaction.timestamp - timedelta(hours=rule["threshold_hours"])

        recent = [t for t in history if t.timestamp >= cutoff]

        if len(recent) >= rule["threshold_transactions"]:
            return FraudAlert(
                alert_id=self._generate_alert_id(transaction),
                customer_id=transaction.customer_id,
                transaction_id=transaction.transaction_id,
                fraud_type=FraudType.ACCOUNT_TAKEOVER,
                risk_score=0.75,
                status=AlertStatus.NEW,
                created_at=datetime.now(),
                detection_rule="velocity_check",
                evidence={
                    "transactions_in_period": len(recent),
                    "threshold": rule["threshold_transactions"],
                    "period_hours": rule["threshold_hours"]
                }
            )
        return None

    def _check_amount_anomaly(self, transaction: Transaction,
                             history: List[Transaction]) -> Optional[FraudAlert]:
        """Check for unusual transaction amounts."""
        if len(history) < 5:
            return None

        amounts = [float(t.amount) for t in history]
        mean = statistics.mean(amounts)
        stdev = statistics.stdev(amounts) if len(amounts) > 1 else 0

        rule = self.DETECTION_RULES["amount_anomaly"]
        threshold = mean + (stdev * rule["std_deviation_multiplier"])

        if float(transaction.amount) > threshold and stdev > 0:
            return FraudAlert(
                alert_id=self._generate_alert_id(transaction),
                customer_id=transaction.customer_id,
                transaction_id=transaction.transaction_id,
                fraud_type=FraudType.CARD_FRAUD,
                risk_score=0.65,
                status=AlertStatus.NEW,
                created_at=datetime.now(),
                detection_rule="amount_anomaly",
                evidence={
                    "amount": float(transaction.amount),
                    "mean": round(mean, 2),
                    "std_dev": round(stdev, 2),
                    "threshold": round(threshold, 2)
                }
            )
        return None

    def _check_geographic_anomaly(self, transaction: Transaction,
                                  customer: Customer) -> Optional[FraudAlert]:
        """Check for high-risk geographic patterns."""
        if transaction.country and transaction.country in HIGH_RISK_COUNTRIES:
            return FraudAlert(
                alert_id=self._generate_alert_id(transaction),
                customer_id=transaction.customer_id,
                transaction_id=transaction.transaction_id,
                fraud_type=FraudType.MONEY_LAUNDERING,
                risk_score=0.80,
                status=AlertStatus.NEW,
                created_at=datetime.now(),
                detection_rule="geographic_anomaly",
                evidence={
                    "country": transaction.country,
                    "customer_country": customer.country,
                    "high_risk": True
                }
            )
        return None

    def _check_structuring(self, transaction: Transaction,
                          history: List[Transaction]) -> Optional[FraudAlert]:
        """Check for potential structuring activity."""
        rule = self.DETECTION_RULES["structuring"]
        lower_bound = float(rule["threshold"]) * rule["lower_bound_pct"]

        if lower_bound <= float(transaction.amount) < float(rule["threshold"]):
            # Check for pattern of just-under-threshold transactions
            cutoff = transaction.timestamp - timedelta(days=7)
            recent = [t for t in history if t.timestamp >= cutoff]

            suspicious_count = sum(
                1 for t in recent
                if lower_bound <= float(t.amount) < float(rule["threshold"])
            )

            if suspicious_count >= 2:
                return FraudAlert(
                    alert_id=self._generate_alert_id(transaction),
                    customer_id=transaction.customer_id,
                    transaction_id=transaction.transaction_id,
                    fraud_type=FraudType.STRUCTURING,
                    risk_score=0.85,
                    status=AlertStatus.NEW,
                    created_at=datetime.now(),
                    detection_rule="structuring",
                    evidence={
                        "amount": float(transaction.amount),
                        "threshold": float(rule["threshold"]),
                        "suspicious_transactions": suspicious_count + 1,
                        "period_days": 7
                    }
                )
        return None

    def _generate_alert_id(self, transaction: Transaction) -> str:
        """Generate unique alert ID."""
        data = f"{transaction.transaction_id}:{datetime.now().isoformat()}"
        return f"FRD-{hashlib.sha256(data.encode()).hexdigest()[:12].upper()}"


class CreditDecisionEngine:
    """Credit decisioning with explainability."""

    DECISION_MATRIX = {
        "excellent": {"min_score": 90, "decision": CreditDecision.APPROVED, "rate_adj": -0.5},
        "good": {"min_score": 75, "decision": CreditDecision.APPROVED, "rate_adj": 0.0},
        "fair": {"min_score": 60, "decision": CreditDecision.CONDITIONALLY_APPROVED, "rate_adj": 1.0},
        "marginal": {"min_score": 45, "decision": CreditDecision.MANUAL_REVIEW, "rate_adj": 2.0},
        "poor": {"min_score": 0, "decision": CreditDecision.DECLINED, "rate_adj": None}
    }

    BASE_RATE = 7.5  # Base APR percentage

    def __init__(self):
        self.decisions: List[ModelDecision] = []

    def evaluate_application(self, application: CreditApplication) -> ModelDecision:
        """Evaluate credit application with full explainability."""
        risk_score = application.calculate_risk_score()

        # Determine tier and decision
        tier = self._get_tier(risk_score)
        tier_config = self.DECISION_MATRIX[tier]

        # Calculate feature importance for explainability
        explanation = self._calculate_explanation(application, risk_score)

        # Create decision record
        decision = ModelDecision(
            decision_id=self._generate_decision_id(application),
            model_name="credit_decision_v1",
            model_version="1.0.0",
            input_features={
                "credit_score": application.credit_score,
                "dti": application.debt_to_income,
                "employment_verified": application.employment_verified,
                "income_verified": application.income_verified,
                "requested_amount": float(application.requested_amount)
            },
            output={
                "decision": tier_config["decision"].value,
                "tier": tier,
                "risk_score": risk_score
            },
            confidence=min(risk_score / 100, 0.99),
            timestamp=datetime.now(),
            explanation=explanation
        )

        # Update application
        application.decision = tier_config["decision"]
        application.decision_timestamp = datetime.now()

        if tier_config["decision"] == CreditDecision.APPROVED:
            application.approved_amount = application.requested_amount
            if tier_config["rate_adj"] is not None:
                application.interest_rate = self.BASE_RATE + tier_config["rate_adj"]
        elif tier_config["decision"] == CreditDecision.CONDITIONALLY_APPROVED:
            application.approved_amount = application.requested_amount * Decimal("0.75")
            application.interest_rate = self.BASE_RATE + tier_config["rate_adj"]

        if tier_config["decision"] == CreditDecision.DECLINED:
            application.decision_factors = application.generate_adverse_action_reasons()

        self.decisions.append(decision)
        return decision

    def _get_tier(self, risk_score: float) -> str:
        """Determine credit tier from risk score."""
        for tier, config in self.DECISION_MATRIX.items():
            if risk_score >= config["min_score"]:
                return tier
        return "poor"

    def _calculate_explanation(self, application: CreditApplication,
                              total_score: float) -> Dict[str, float]:
        """Calculate FCRA-compliant feature importance."""
        explanation = {}

        # Credit score contribution
        if application.credit_score:
            if application.credit_score >= 750:
                explanation["credit_score"] = 0.40
            elif application.credit_score >= 700:
                explanation["credit_score"] = 0.30
            elif application.credit_score >= 650:
                explanation["credit_score"] = 0.20
            else:
                explanation["credit_score"] = 0.10
        else:
            explanation["credit_score"] = 0.0

        # DTI contribution
        if application.debt_to_income:
            if application.debt_to_income <= 0.28:
                explanation["debt_to_income"] = 0.30
            elif application.debt_to_income <= 0.36:
                explanation["debt_to_income"] = 0.20
            else:
                explanation["debt_to_income"] = 0.10
        else:
            explanation["debt_to_income"] = 0.0

        # Verification contribution
        explanation["employment_verified"] = 0.15 if application.employment_verified else 0.0
        explanation["income_verified"] = 0.15 if application.income_verified else 0.0

        return explanation

    def _generate_decision_id(self, application: CreditApplication) -> str:
        """Generate unique decision ID."""
        data = f"{application.application_id}:{datetime.now().isoformat()}"
        return f"CRD-{hashlib.sha256(data.encode()).hexdigest()[:12].upper()}"


class AMLComplianceEngine:
    """Anti-Money Laundering compliance engine."""

    WATCHLIST_SOURCES = [
        "OFAC_SDN", "UN_CONSOLIDATED", "EU_SANCTIONS",
        "UK_SANCTIONS", "FATF_HIGH_RISK"
    ]

    def __init__(self):
        self.customer_reviews: Dict[str, datetime] = {}
        self.transaction_reports: List[Dict] = []
        self.sar_queue: List[SARReport] = []

    def screen_customer(self, customer: Customer) -> Dict[str, Any]:
        """Perform KYC screening on customer."""
        result = {
            "customer_id": customer.customer_id,
            "screened_at": datetime.now(),
            "sanctions_hit": False,
            "pep_hit": customer.pep_status,
            "adverse_media_hits": len(customer.adverse_media),
            "risk_rating": customer.risk_rating.value,
            "edd_required": customer.needs_enhanced_due_diligence(),
            "watchlist_sources_checked": self.WATCHLIST_SOURCES
        }

        # Check high-risk country
        if customer.country in HIGH_RISK_COUNTRIES:
            result["high_risk_country"] = True
            if customer.risk_rating != CustomerRiskRating.HIGH_RISK:
                result["recommended_rating"] = CustomerRiskRating.HIGH_RISK.value

        self.customer_reviews[customer.customer_id] = datetime.now()
        return result

    def check_ctr_requirement(self, transaction: Transaction) -> Optional[Dict]:
        """Check if Currency Transaction Report is required."""
        if transaction.amount >= CTR_THRESHOLD:
            return {
                "required": True,
                "transaction_id": transaction.transaction_id,
                "amount": float(transaction.amount),
                "threshold": float(CTR_THRESHOLD),
                "filing_deadline": datetime.now() + timedelta(days=15)
            }
        return None

    def aggregate_transactions(self, customer_id: str,
                              transactions: List[Transaction]) -> Dict[str, Any]:
        """Aggregate daily transactions for CTR checking."""
        today = datetime.now().date()

        daily_total = sum(
            t.amount for t in transactions
            if t.timestamp.date() == today and t.customer_id == customer_id
        )

        return {
            "customer_id": customer_id,
            "date": today.isoformat(),
            "daily_total": float(daily_total),
            "ctr_required": daily_total >= CTR_THRESHOLD,
            "transaction_count": len([
                t for t in transactions
                if t.timestamp.date() == today and t.customer_id == customer_id
            ])
        }

    def create_sar(self, alerts: List[FraudAlert],
                   customer: Customer) -> SARReport:
        """Create Suspicious Activity Report from confirmed alerts."""
        amounts = sum(
            Decimal(str(a.evidence.get("amount", 0)))
            for a in alerts if "amount" in a.evidence
        )

        dates = [a.created_at for a in alerts]

        sar = SARReport(
            sar_id=f"SAR-{hashlib.sha256(customer.customer_id.encode()).hexdigest()[:12].upper()}",
            alert_ids=[a.alert_id for a in alerts],
            customer_id=customer.customer_id,
            filing_date=datetime.now(),
            suspicious_activity=alerts[0].fraud_type.value if alerts else "unknown",
            amount_involved=amounts,
            date_range_start=min(dates) if dates else datetime.now(),
            date_range_end=max(dates) if dates else datetime.now(),
            narrative=self._generate_sar_narrative(alerts, customer),
            filed_by="system"
        )

        self.sar_queue.append(sar)
        return sar

    def _generate_sar_narrative(self, alerts: List[FraudAlert],
                                customer: Customer) -> str:
        """Generate SAR narrative from alerts."""
        activity_types = list(set(a.fraud_type.value for a in alerts))

        return (
            f"Suspicious activity detected for customer {customer.customer_id}. "
            f"Activity types: {', '.join(activity_types)}. "
            f"Total alerts: {len(alerts)}. "
            f"Customer risk rating: {customer.risk_rating.value}."
        )


class RiskManagementEngine:
    """Enterprise risk management engine."""

    RISK_CATEGORIES = {
        "credit_risk": {"weight": 0.25, "description": "Default probability"},
        "market_risk": {"weight": 0.20, "description": "Market value changes"},
        "operational_risk": {"weight": 0.20, "description": "Process failures"},
        "compliance_risk": {"weight": 0.20, "description": "Regulatory violations"},
        "reputational_risk": {"weight": 0.15, "description": "Brand damage"}
    }

    def __init__(self):
        self.thresholds: Dict[str, RiskThreshold] = {}
        self.risk_scores: Dict[str, float] = {}
        self.breach_history: List[Dict] = []

    def register_threshold(self, threshold: RiskThreshold):
        """Register a risk threshold for monitoring."""
        self.thresholds[threshold.threshold_id] = threshold

    def update_metric(self, threshold_id: str, value: float) -> Dict[str, Any]:
        """Update risk metric and check thresholds."""
        if threshold_id not in self.thresholds:
            raise ValueError(f"Unknown threshold: {threshold_id}")

        threshold = self.thresholds[threshold_id]
        status = threshold.update(value)

        result = {
            "threshold_id": threshold_id,
            "metric": threshold.metric,
            "value": value,
            "status": status,
            "warning_threshold": threshold.warning_value,
            "critical_threshold": threshold.critical_value,
            "timestamp": datetime.now().isoformat()
        }

        if status in ["WARNING", "CRITICAL"]:
            self.breach_history.append(result)

        return result

    def calculate_enterprise_risk(self) -> Dict[str, Any]:
        """Calculate aggregate enterprise risk score."""
        category_scores = {}

        for category, config in self.RISK_CATEGORIES.items():
            # Get thresholds for this category
            category_thresholds = [
                t for t in self.thresholds.values()
                if category in t.threshold_id
            ]

            if category_thresholds:
                # Calculate average normalized risk
                values = [
                    t.current_value / t.critical_value
                    for t in category_thresholds
                    if t.current_value is not None
                ]
                category_scores[category] = statistics.mean(values) if values else 0.5
            else:
                category_scores[category] = 0.5

        # Weighted aggregate
        enterprise_score = sum(
            category_scores.get(cat, 0.5) * config["weight"]
            for cat, config in self.RISK_CATEGORIES.items()
        )

        return {
            "enterprise_risk_score": round(enterprise_score, 4),
            "category_scores": category_scores,
            "risk_level": self._score_to_level(enterprise_score),
            "calculated_at": datetime.now().isoformat()
        }

    def _score_to_level(self, score: float) -> str:
        """Convert risk score to level."""
        if score >= 0.8:
            return "CRITICAL"
        elif score >= 0.6:
            return "HIGH"
        elif score >= 0.4:
            return "MEDIUM"
        elif score >= 0.2:
            return "LOW"
        return "MINIMAL"


class AuditTrailEngine:
    """Immutable audit trail management."""

    RETENTION_REQUIREMENTS = {
        AuditEventType.DECISION_MADE: 7,  # years
        AuditEventType.DATA_ACCESS: 5,
        AuditEventType.SAR_FILED: 10,
        AuditEventType.HUMAN_OVERRIDE: 7,
        AuditEventType.THRESHOLD_BREACH: 5
    }

    def __init__(self):
        self.entries: List[AuditEntry] = []
        self.chain_hash: Optional[str] = None

    def log_event(self, event_type: AuditEventType, actor: str,
                  action: str, resource: str, resource_id: str,
                  old_value: Optional[Dict] = None,
                  new_value: Optional[Dict] = None,
                  metadata: Optional[Dict] = None) -> AuditEntry:
        """Create immutable audit entry."""
        entry = AuditEntry(
            entry_id=self._generate_entry_id(),
            event_type=event_type,
            timestamp=datetime.now(),
            actor=actor,
            action=action,
            resource=resource,
            resource_id=resource_id,
            old_value=old_value,
            new_value=new_value,
            metadata=metadata or {}
        )

        # Add previous chain hash to metadata for chain integrity
        entry.metadata["previous_hash"] = self.chain_hash

        # Update chain hash
        self.chain_hash = entry.checksum

        self.entries.append(entry)
        return entry

    def verify_chain_integrity(self) -> Dict[str, Any]:
        """Verify entire audit chain integrity."""
        valid = True
        invalid_entries = []

        previous_hash = None
        for entry in self.entries:
            # Verify individual entry
            if not entry.verify_integrity():
                valid = False
                invalid_entries.append(entry.entry_id)

            # Verify chain linkage
            if entry.metadata.get("previous_hash") != previous_hash:
                valid = False
                invalid_entries.append(f"{entry.entry_id} (chain break)")

            previous_hash = entry.checksum

        return {
            "chain_valid": valid,
            "entries_verified": len(self.entries),
            "invalid_entries": invalid_entries,
            "verified_at": datetime.now().isoformat()
        }

    def search_entries(self, resource: Optional[str] = None,
                       resource_id: Optional[str] = None,
                       actor: Optional[str] = None,
                       event_type: Optional[AuditEventType] = None,
                       start_date: Optional[datetime] = None,
                       end_date: Optional[datetime] = None) -> List[AuditEntry]:
        """Search audit entries with filters."""
        results = self.entries.copy()

        if resource:
            results = [e for e in results if e.resource == resource]
        if resource_id:
            results = [e for e in results if e.resource_id == resource_id]
        if actor:
            results = [e for e in results if e.actor == actor]
        if event_type:
            results = [e for e in results if e.event_type == event_type]
        if start_date:
            results = [e for e in results if e.timestamp >= start_date]
        if end_date:
            results = [e for e in results if e.timestamp <= end_date]

        return results

    def _generate_entry_id(self) -> str:
        """Generate unique entry ID."""
        data = f"{len(self.entries)}:{datetime.now().isoformat()}"
        return f"AUD-{hashlib.sha256(data.encode()).hexdigest()[:16].upper()}"


class ComplianceControlEngine:
    """Regulatory compliance control engine."""

    REGULATION_REQUIREMENTS = {
        Regulation.BSA: ["transaction_monitoring", "ctr_filing", "sar_filing"],
        Regulation.AML: ["customer_screening", "transaction_monitoring", "sanctions_check"],
        Regulation.KYC: ["identity_verification", "customer_due_diligence", "periodic_review"],
        Regulation.FCRA: ["adverse_action_notice", "data_accuracy", "dispute_resolution"],
        Regulation.ECOA: ["fair_lending", "adverse_action_reasons", "non_discrimination"],
        Regulation.PCI_DSS: ["data_encryption", "access_control", "vulnerability_management"],
        Regulation.SOX: ["financial_controls", "audit_trail", "segregation_of_duties"]
    }

    def __init__(self):
        self.controls: Dict[str, ComplianceControl] = {}
        self.test_results: List[Dict] = []

    def register_control(self, control: ComplianceControl):
        """Register compliance control."""
        self.controls[control.control_id] = control

    def test_control(self, control_id: str, evidence: List[str]) -> Dict[str, Any]:
        """Test a compliance control."""
        if control_id not in self.controls:
            raise ValueError(f"Unknown control: {control_id}")

        control = self.controls[control_id]

        # Check if all required evidence is provided
        missing = [e for e in control.evidence_required if e not in evidence]

        if missing:
            result = "fail"
            findings = [f"Missing evidence: {', '.join(missing)}"]
        else:
            result = "pass"
            findings = []

        control.last_tested = datetime.now()
        control.test_result = result
        control.findings = findings

        test_record = {
            "control_id": control_id,
            "regulation": control.regulation.value,
            "test_date": datetime.now().isoformat(),
            "result": result,
            "findings": findings,
            "evidence_provided": evidence
        }

        self.test_results.append(test_record)
        return test_record

    def generate_compliance_report(self, regulation: Optional[Regulation] = None) -> Dict[str, Any]:
        """Generate compliance status report."""
        controls = list(self.controls.values())

        if regulation:
            controls = [c for c in controls if c.regulation == regulation]

        total = len(controls)
        passed = len([c for c in controls if c.test_result == "pass"])
        failed = len([c for c in controls if c.test_result == "fail"])
        untested = len([c for c in controls if c.test_result is None])

        return {
            "report_date": datetime.now().isoformat(),
            "regulation": regulation.value if regulation else "ALL",
            "total_controls": total,
            "passed": passed,
            "failed": failed,
            "untested": untested,
            "compliance_rate": round(passed / total * 100, 2) if total > 0 else 0,
            "due_for_testing": [
                c.control_id for c in controls if c.is_due_for_testing()
            ],
            "failing_controls": [
                {
                    "control_id": c.control_id,
                    "name": c.name,
                    "findings": c.findings
                }
                for c in controls if c.test_result == "fail"
            ]
        }


class CustomerServiceEngine:
    """AI-powered customer service with compliance."""

    ESCALATION_TRIGGERS = [
        "fraud", "dispute", "complaint", "regulatory", "legal",
        "threat", "lawsuit", "attorney", "regulator"
    ]

    CONSENT_REQUIREMENTS = {
        "marketing": {"opt_in_required": True, "can_withdraw": True},
        "data_sharing": {"opt_in_required": True, "can_withdraw": True},
        "ai_interaction": {"opt_in_required": False, "disclosure_required": True},
        "call_recording": {"opt_in_required": True, "can_withdraw": True}
    }

    def __init__(self):
        self.interactions: List[Dict] = []
        self.consent_records: Dict[str, Dict[str, bool]] = {}

    def classify_inquiry(self, text: str) -> Dict[str, Any]:
        """Classify customer inquiry for routing."""
        text_lower = text.lower()

        # Check for escalation triggers
        needs_escalation = any(
            trigger in text_lower for trigger in self.ESCALATION_TRIGGERS
        )

        # Simple category classification
        categories = {
            "account": ["balance", "statement", "account", "login", "password"],
            "transaction": ["transfer", "payment", "transaction", "send", "receive"],
            "dispute": ["dispute", "charge", "fraud", "unauthorized", "wrong"],
            "product": ["card", "loan", "mortgage", "credit", "apply"],
            "general": ["help", "information", "question", "how"]
        }

        matched_category = "general"
        for category, keywords in categories.items():
            if any(kw in text_lower for kw in keywords):
                matched_category = category
                break

        return {
            "category": matched_category,
            "needs_escalation": needs_escalation,
            "escalation_reason": (
                "Trigger word detected" if needs_escalation else None
            ),
            "ai_eligible": not needs_escalation,
            "timestamp": datetime.now().isoformat()
        }

    def check_consent(self, customer_id: str,
                      consent_type: str) -> Dict[str, Any]:
        """Check customer consent status."""
        customer_consents = self.consent_records.get(customer_id, {})
        requirement = self.CONSENT_REQUIREMENTS.get(consent_type, {})

        has_consent = customer_consents.get(consent_type, False)

        return {
            "customer_id": customer_id,
            "consent_type": consent_type,
            "has_consent": has_consent,
            "opt_in_required": requirement.get("opt_in_required", True),
            "can_proceed": has_consent or not requirement.get("opt_in_required", True),
            "disclosure_required": requirement.get("disclosure_required", False)
        }

    def record_consent(self, customer_id: str, consent_type: str,
                       granted: bool) -> Dict[str, Any]:
        """Record customer consent decision."""
        if customer_id not in self.consent_records:
            self.consent_records[customer_id] = {}

        self.consent_records[customer_id][consent_type] = granted

        return {
            "customer_id": customer_id,
            "consent_type": consent_type,
            "granted": granted,
            "recorded_at": datetime.now().isoformat()
        }


# ============================================================================
# MAIN ORCHESTRATOR
# ============================================================================

class FinanceAIOSEngine:
    """Main orchestrator for Financial AI Operating System."""

    SYSTEM_CONFIG = {
        "name": "Finance AI Operating System",
        "version": "1.0.0",
        "mission": "Enable compliant AI for financial services",
        "principles": {
            "no_financial_advice": True,
            "conservative_risk_posture": True,
            "full_auditability": True,
            "human_oversight_required": True,
            "regulatory_compliance_first": True
        }
    }

    OVERSIGHT_REQUIREMENTS = {
        "fraud_detection": OversightLevel.REVIEW_ALL,
        "credit_decision": OversightLevel.SAMPLING,
        "customer_service": OversightLevel.AUTOMATED,
        "trading_support": OversightLevel.DUAL_APPROVAL,
        "aml_screening": OversightLevel.REVIEW_ALL,
        "sar_filing": OversightLevel.COMMITTEE
    }

    PROHIBITED_ACTIONS = [
        "provide_investment_advice",
        "guarantee_returns",
        "make_autonomous_credit_decisions",
        "bypass_aml_checks",
        "suppress_fraud_alerts",
        "modify_audit_trail"
    ]

    def __init__(self, institution_type: InstitutionType):
        self.institution_type = institution_type
        self.fraud_engine = FraudDetectionEngine()
        self.credit_engine = CreditDecisionEngine()
        self.aml_engine = AMLComplianceEngine()
        self.risk_engine = RiskManagementEngine()
        self.audit_engine = AuditTrailEngine()
        self.compliance_engine = ComplianceControlEngine()
        self.customer_engine = CustomerServiceEngine()

    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status."""
        compliance_report = self.compliance_engine.generate_compliance_report()
        risk_status = self.risk_engine.calculate_enterprise_risk()
        audit_integrity = self.audit_engine.verify_chain_integrity()

        return {
            "system": self.SYSTEM_CONFIG,
            "institution_type": self.institution_type.value,
            "status": "operational",
            "compliance": {
                "rate": compliance_report.get("compliance_rate", 0),
                "failing_controls": len(compliance_report.get("failing_controls", [])),
                "due_for_testing": len(compliance_report.get("due_for_testing", []))
            },
            "risk": {
                "enterprise_score": risk_status.get("enterprise_risk_score", 0),
                "level": risk_status.get("risk_level", "UNKNOWN")
            },
            "audit": {
                "chain_valid": audit_integrity.get("chain_valid", False),
                "entries": audit_integrity.get("entries_verified", 0)
            },
            "pending_sars": len(self.aml_engine.sar_queue),
            "active_alerts": len([
                a for a in self.fraud_engine.alerts
                if a.status in [AlertStatus.NEW, AlertStatus.UNDER_REVIEW]
            ]),
            "timestamp": datetime.now().isoformat()
        }

    def process_transaction(self, transaction: Transaction,
                           customer: Customer) -> Dict[str, Any]:
        """Process transaction through all compliance checks."""
        result = {
            "transaction_id": transaction.transaction_id,
            "processed_at": datetime.now().isoformat(),
            "checks": {}
        }

        # 1. Fraud detection
        fraud_alerts = self.fraud_engine.analyze_transaction(transaction, customer)
        result["checks"]["fraud"] = {
            "alerts_generated": len(fraud_alerts),
            "alert_ids": [a.alert_id for a in fraud_alerts]
        }

        # 2. AML/CTR check
        ctr_check = self.aml_engine.check_ctr_requirement(transaction)
        result["checks"]["aml"] = {
            "ctr_required": ctr_check is not None,
            "ctr_details": ctr_check
        }

        # 3. Log to audit trail
        self.audit_engine.log_event(
            event_type=AuditEventType.DECISION_MADE,
            actor="finance_ai_os",
            action="process_transaction",
            resource="transaction",
            resource_id=transaction.transaction_id,
            new_value={
                "amount": float(transaction.amount),
                "type": transaction.transaction_type.value
            },
            metadata={"fraud_alerts": len(fraud_alerts)}
        )

        # 4. Determine if transaction can proceed
        result["proceed"] = len(fraud_alerts) == 0 or all(
            a.risk_score < 0.9 for a in fraud_alerts
        )
        result["requires_review"] = len(fraud_alerts) > 0

        return result

    def evaluate_credit(self, application: CreditApplication) -> Dict[str, Any]:
        """Evaluate credit application with compliance."""
        decision = self.credit_engine.evaluate_application(application)

        # Log decision
        self.audit_engine.log_event(
            event_type=AuditEventType.MODEL_PREDICTION,
            actor="credit_decision_engine",
            action="evaluate_credit",
            resource="credit_application",
            resource_id=application.application_id,
            new_value={
                "decision": application.decision.value if application.decision else None,
                "confidence": decision.confidence
            },
            metadata={"explanation": decision.explanation}
        )

        result = {
            "application_id": application.application_id,
            "decision": application.decision.value if application.decision else None,
            "confidence": decision.confidence,
            "requires_review": decision.requires_review(),
            "top_factors": decision.get_top_factors(4),
            "processed_at": datetime.now().isoformat()
        }

        if application.decision == CreditDecision.DECLINED:
            result["adverse_action_reasons"] = application.decision_factors
        elif application.approved_amount:
            result["approved_amount"] = float(application.approved_amount)
            result["interest_rate"] = application.interest_rate

        return result


# ============================================================================
# REPORTER CLASS
# ============================================================================

class FinanceAIReporter:
    """Generate formatted reports for Finance AI OS."""

    STATUS_ICONS = {
        "operational": "✓",
        "degraded": "⚠",
        "critical": "✗",
        "unknown": "?"
    }

    RISK_BARS = {
        "CRITICAL": "██████████",
        "HIGH": "████████░░",
        "MEDIUM": "██████░░░░",
        "LOW": "████░░░░░░",
        "MINIMAL": "██░░░░░░░░"
    }

    COMPLIANCE_ICONS = {
        "pass": "●",
        "fail": "○",
        "untested": "◌"
    }

    @staticmethod
    def format_system_status(status: Dict[str, Any]) -> str:
        """Format system status report."""
        icon = FinanceAIReporter.STATUS_ICONS.get(
            status.get("status", "unknown"), "?"
        )
        risk_bar = FinanceAIReporter.RISK_BARS.get(
            status.get("risk", {}).get("level", "UNKNOWN"), "░░░░░░░░░░"
        )

        return f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                      FINANCE AI OPERATING SYSTEM                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Status: {icon} {status.get('status', 'unknown').upper():<67}║
║  Institution: {status.get('institution_type', 'unknown'):<60}║
║  Version: {status.get('system', {}).get('version', 'unknown'):<64}║
╠══════════════════════════════════════════════════════════════════════════════╣
║  RISK STATUS                                                                  ║
║  ├── Enterprise Score: {status.get('risk', {}).get('enterprise_score', 0):<51.4f}║
║  ├── Risk Level: {status.get('risk', {}).get('level', 'UNKNOWN'):<58}║
║  └── [{risk_bar}]                                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  COMPLIANCE STATUS                                                            ║
║  ├── Compliance Rate: {status.get('compliance', {}).get('rate', 0):<53.1f}%║
║  ├── Failing Controls: {status.get('compliance', {}).get('failing_controls', 0):<52}║
║  └── Due for Testing: {status.get('compliance', {}).get('due_for_testing', 0):<53}║
╠══════════════════════════════════════════════════════════════════════════════╣
║  OPERATIONS                                                                   ║
║  ├── Active Fraud Alerts: {status.get('active_alerts', 0):<49}║
║  ├── Pending SARs: {status.get('pending_sars', 0):<56}║
║  └── Audit Chain Valid: {'Yes' if status.get('audit', {}).get('chain_valid') else 'No':<52}║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Generated: {status.get('timestamp', 'unknown'):<63}║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

    @staticmethod
    def format_transaction_result(result: Dict[str, Any]) -> str:
        """Format transaction processing result."""
        proceed_icon = "✓" if result.get("proceed") else "✗"
        review_icon = "⚠" if result.get("requires_review") else "○"

        fraud_count = result.get("checks", {}).get("fraud", {}).get("alerts_generated", 0)
        ctr_required = result.get("checks", {}).get("aml", {}).get("ctr_required", False)

        return f"""
┌─────────────────────────────────────────────────────────────────┐
│ TRANSACTION PROCESSING RESULT                                    │
├─────────────────────────────────────────────────────────────────┤
│ Transaction ID: {result.get('transaction_id', 'unknown'):<46}│
│ Processed: {result.get('processed_at', 'unknown'):<52}│
├─────────────────────────────────────────────────────────────────┤
│ Fraud Detection:                                                 │
│   Alerts Generated: {fraud_count:<43}│
│                                                                  │
│ AML/Compliance:                                                  │
│   CTR Required: {'Yes' if ctr_required else 'No':<47}│
├─────────────────────────────────────────────────────────────────┤
│ Decision: {proceed_icon} {'PROCEED' if result.get('proceed') else 'HOLD':<52}│
│ Review Required: {review_icon} {'Yes' if result.get('requires_review') else 'No':<44}│
└─────────────────────────────────────────────────────────────────┘
"""

    @staticmethod
    def format_credit_result(result: Dict[str, Any]) -> str:
        """Format credit decision result."""
        decision = result.get("decision", "unknown").upper()

        decision_icons = {
            "APPROVED": "✓",
            "CONDITIONALLY_APPROVED": "◐",
            "DECLINED": "✗",
            "MANUAL_REVIEW": "⚠",
            "INSUFFICIENT_DATA": "?"
        }
        icon = decision_icons.get(decision, "?")

        output = f"""
┌─────────────────────────────────────────────────────────────────┐
│ CREDIT DECISION RESULT                                           │
├─────────────────────────────────────────────────────────────────┤
│ Application ID: {result.get('application_id', 'unknown'):<46}│
│ Decision: {icon} {decision:<52}│
│ Confidence: {result.get('confidence', 0):<51.2%}│
│ Review Required: {'Yes' if result.get('requires_review') else 'No':<46}│
├─────────────────────────────────────────────────────────────────┤
│ TOP DECISION FACTORS                                             │
"""
        for factor, importance in result.get("top_factors", []):
            bar_len = int(importance * 20)
            bar = "█" * bar_len + "░" * (20 - bar_len)
            output += f"│   {factor:<20} [{bar}] {importance:<10.2%}│\n"

        if result.get("approved_amount"):
            output += f"""├─────────────────────────────────────────────────────────────────┤
│ APPROVAL DETAILS                                                 │
│   Approved Amount: ${result.get('approved_amount', 0):,.2f}│
│   Interest Rate: {result.get('interest_rate', 0):.2f}%│
"""

        if result.get("adverse_action_reasons"):
            output += f"""├─────────────────────────────────────────────────────────────────┤
│ ADVERSE ACTION REASONS (FCRA/ECOA Required)                      │
"""
            for reason in result.get("adverse_action_reasons", []):
                output += f"│   • {reason:<58}│\n"

        output += "└─────────────────────────────────────────────────────────────────┘\n"
        return output

    @staticmethod
    def format_compliance_report(report: Dict[str, Any]) -> str:
        """Format compliance status report."""
        total = report.get("total_controls", 0)
        passed = report.get("passed", 0)
        failed = report.get("failed", 0)
        rate = report.get("compliance_rate", 0)

        # Visual compliance bar
        bar_passed = int(rate / 10)
        bar_failed = int((100 - rate) / 10)
        compliance_bar = "█" * bar_passed + "░" * bar_failed

        output = f"""
╔══════════════════════════════════════════════════════════════════╗
║                    COMPLIANCE STATUS REPORT                       ║
╠══════════════════════════════════════════════════════════════════╣
║  Regulation: {report.get('regulation', 'ALL'):<52}║
║  Report Date: {report.get('report_date', 'unknown'):<51}║
╠══════════════════════════════════════════════════════════════════╣
║  CONTROL STATUS                                                   ║
║  ├── Total Controls: {total:<44}║
║  ├── Passed: {passed:<53}║
║  ├── Failed: {failed:<53}║
║  └── Untested: {report.get('untested', 0):<50}║
╠══════════════════════════════════════════════════════════════════╣
║  COMPLIANCE RATE                                                  ║
║  [{compliance_bar}] {rate:>6.1f}%                           ║
"""

        if report.get("failing_controls"):
            output += """╠══════════════════════════════════════════════════════════════════╣
║  FAILING CONTROLS                                                 ║
"""
            for ctrl in report.get("failing_controls", []):
                output += f"║  ○ {ctrl.get('name', 'unknown'):<60}║\n"
                for finding in ctrl.get("findings", [])[:2]:
                    output += f"║      └─ {finding:<54}║\n"

        output += "╚══════════════════════════════════════════════════════════════════╝\n"
        return output


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """Main CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Finance AI Operating System",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument(
        "--institution", "-i",
        type=str,
        choices=[t.value for t in InstitutionType],
        default="commercial_bank",
        help="Institution type"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Status command
    status_parser = subparsers.add_parser("status", help="Show system status")

    # Compliance command
    compliance_parser = subparsers.add_parser("compliance", help="Compliance operations")
    compliance_parser.add_argument(
        "--regulation", "-r",
        type=str,
        choices=[r.name for r in Regulation],
        help="Filter by regulation"
    )
    compliance_parser.add_argument(
        "--report", action="store_true",
        help="Generate compliance report"
    )

    # Risk command
    risk_parser = subparsers.add_parser("risk", help="Risk management")
    risk_parser.add_argument(
        "--enterprise", action="store_true",
        help="Calculate enterprise risk score"
    )
    risk_parser.add_argument(
        "--thresholds", action="store_true",
        help="Show risk thresholds"
    )

    # Audit command
    audit_parser = subparsers.add_parser("audit", help="Audit trail operations")
    audit_parser.add_argument(
        "--verify", action="store_true",
        help="Verify audit chain integrity"
    )
    audit_parser.add_argument(
        "--search", type=str,
        help="Search audit entries"
    )

    # Transaction command
    txn_parser = subparsers.add_parser("transaction", help="Transaction analysis")
    txn_parser.add_argument(
        "--customer-id", type=str, required=True,
        help="Customer ID"
    )
    txn_parser.add_argument(
        "--amount", type=float, required=True,
        help="Transaction amount"
    )
    txn_parser.add_argument(
        "--type", type=str,
        choices=[t.value for t in TransactionType],
        default="transfer",
        help="Transaction type"
    )

    # Credit command
    credit_parser = subparsers.add_parser("credit", help="Credit decisioning")
    credit_parser.add_argument(
        "--application-id", type=str, required=True,
        help="Application ID"
    )
    credit_parser.add_argument(
        "--score", type=int,
        help="Credit score"
    )
    credit_parser.add_argument(
        "--amount", type=float, required=True,
        help="Requested amount"
    )

    args = parser.parse_args()

    # Initialize engine
    institution_type = InstitutionType(args.institution)
    engine = FinanceAIOSEngine(institution_type)
    reporter = FinanceAIReporter()

    if args.command == "status" or args.command is None:
        status = engine.get_system_status()
        print(reporter.format_system_status(status))

    elif args.command == "compliance":
        if args.report:
            regulation = Regulation[args.regulation] if args.regulation else None
            report = engine.compliance_engine.generate_compliance_report(regulation)
            print(reporter.format_compliance_report(report))

    elif args.command == "risk":
        if args.enterprise:
            risk = engine.risk_engine.calculate_enterprise_risk()
            print(f"\nEnterprise Risk Score: {risk['enterprise_risk_score']:.4f}")
            print(f"Risk Level: {risk['risk_level']}")

    elif args.command == "audit":
        if args.verify:
            result = engine.audit_engine.verify_chain_integrity()
            print(f"\nAudit Chain Valid: {result['chain_valid']}")
            print(f"Entries Verified: {result['entries_verified']}")

    elif args.command == "transaction":
        customer = Customer(
            customer_id=args.customer_id,
            name="Test Customer",
            customer_type="individual",
            risk_rating=CustomerRiskRating.MEDIUM_RISK,
            onboarding_date=datetime.now() - timedelta(days=365),
            last_kyc_review=datetime.now() - timedelta(days=180),
            country="US"
        )

        transaction = Transaction(
            transaction_id=f"TXN-{hashlib.sha256(str(datetime.now()).encode()).hexdigest()[:12].upper()}",
            customer_id=args.customer_id,
            transaction_type=TransactionType(args.type),
            amount=Decimal(str(args.amount)),
            currency="USD",
            timestamp=datetime.now(),
            source_account="checking-001"
        )

        result = engine.process_transaction(transaction, customer)
        print(reporter.format_transaction_result(result))

    elif args.command == "credit":
        application = CreditApplication(
            application_id=args.application_id,
            customer_id="CUST-001",
            product_type="personal_loan",
            requested_amount=Decimal(str(args.amount)),
            submitted_at=datetime.now(),
            credit_score=args.score
        )

        result = engine.evaluate_credit(application)
        print(reporter.format_credit_result(result))


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

```
/finance-ai-os                     → Full system status
/finance-ai-os [bank|fintech]      → Institution-specific config
/finance-ai-os compliance          → Compliance status report
/finance-ai-os risk                → Enterprise risk assessment
/finance-ai-os audit               → Audit trail verification
/finance-ai-os fraud               → Fraud detection status
```

---

## USAGE EXAMPLES

### Initialize for a Commercial Bank
```python
from finance_ai_os import FinanceAIOSEngine, InstitutionType

engine = FinanceAIOSEngine(InstitutionType.COMMERCIAL_BANK)
status = engine.get_system_status()
print(FinanceAIReporter.format_system_status(status))
```

### Process a Transaction
```python
transaction = Transaction(
    transaction_id="TXN-001",
    customer_id="CUST-001",
    transaction_type=TransactionType.WIRE,
    amount=Decimal("25000.00"),
    currency="USD",
    timestamp=datetime.now(),
    source_account="checking-001",
    destination_account="external-002",
    country="CH"
)

customer = Customer(
    customer_id="CUST-001",
    name="John Doe",
    customer_type="individual",
    risk_rating=CustomerRiskRating.MEDIUM_RISK,
    onboarding_date=datetime.now() - timedelta(days=365),
    last_kyc_review=datetime.now() - timedelta(days=90),
    country="US"
)

result = engine.process_transaction(transaction, customer)
# Returns fraud alerts, CTR requirements, and proceed/hold decision
```

### Evaluate Credit Application
```python
application = CreditApplication(
    application_id="APP-001",
    customer_id="CUST-001",
    product_type="personal_loan",
    requested_amount=Decimal("50000"),
    submitted_at=datetime.now(),
    credit_score=720,
    debt_to_income=0.32,
    employment_verified=True,
    income_verified=True
)

result = engine.evaluate_credit(application)
# Returns FCRA-compliant decision with explainability
```

$ARGUMENTS
