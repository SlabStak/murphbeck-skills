# EXPLAINABILITY.OS.EXE - Decision Transparency & Trace Architect

You are EXPLAINABILITY.OS.EXE — an explanation and traceability architect.

MISSION
Make system decisions understandable to humans without exposing sensitive internals. Explain outcomes, not hidden chains.

---

## CAPABILITIES

### SummaryGenerator.MOD
- Plain-language synthesis
- Key factor extraction
- Outcome explanation
- Context framing
- Audience adaptation

### AttributionTracer.MOD
- Input identification
- Factor weighting
- Contribution mapping
- Source linking
- Influence scoring

### PolicyReferencer.MOD
- Rule citation
- Policy mapping
- Constraint explanation
- Exception documentation
- Compliance linking

### ConfidenceReporter.MOD
- Certainty scoring
- Uncertainty disclosure
- Limitation flagging
- Caveat documentation
- Reliability indicators

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
EXPLAINABILITY.OS.EXE - Decision Transparency & Trace Engine
Production-ready implementation for making AI decisions understandable.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
import hashlib
import json
import argparse


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class ExplanationLevel(Enum):
    """Explanation depth levels with audience mapping."""
    SUMMARY = "summary"
    STANDARD = "standard"
    DETAILED = "detailed"
    AUDIT = "audit"
    TECHNICAL = "technical"
    REGULATORY = "regulatory"
    EXECUTIVE = "executive"
    DEBUG = "debug"

    @property
    def detail_depth(self) -> int:
        """Detail depth score 1-10."""
        depths = {
            "summary": 2, "standard": 4, "detailed": 6, "audit": 8,
            "technical": 7, "regulatory": 9, "executive": 3, "debug": 10
        }
        return depths[self.value]

    @property
    def target_word_count(self) -> tuple[int, int]:
        """Target min/max word counts."""
        counts = {
            "summary": (50, 150), "standard": (150, 400),
            "detailed": (400, 800), "audit": (800, 2000),
            "technical": (300, 700), "regulatory": (600, 1500),
            "executive": (100, 250), "debug": (500, 1500)
        }
        return counts[self.value]

    @property
    def includes_technical_details(self) -> bool:
        """Whether to include technical implementation details."""
        return self in [
            ExplanationLevel.DETAILED, ExplanationLevel.AUDIT,
            ExplanationLevel.TECHNICAL, ExplanationLevel.DEBUG
        ]


class AudienceType(Enum):
    """Target audience for explanations."""
    END_USER = "end_user"
    BUSINESS_USER = "business_user"
    TECHNICAL_USER = "technical_user"
    COMPLIANCE_OFFICER = "compliance_officer"
    EXECUTIVE = "executive"
    AUDITOR = "auditor"
    DATA_SCIENTIST = "data_scientist"
    LEGAL = "legal"
    REGULATOR = "regulator"
    DEVELOPER = "developer"

    @property
    def preferred_level(self) -> ExplanationLevel:
        """Default explanation level for this audience."""
        mappings = {
            "end_user": ExplanationLevel.SUMMARY,
            "business_user": ExplanationLevel.STANDARD,
            "technical_user": ExplanationLevel.DETAILED,
            "compliance_officer": ExplanationLevel.REGULATORY,
            "executive": ExplanationLevel.EXECUTIVE,
            "auditor": ExplanationLevel.AUDIT,
            "data_scientist": ExplanationLevel.TECHNICAL,
            "legal": ExplanationLevel.REGULATORY,
            "regulator": ExplanationLevel.AUDIT,
            "developer": ExplanationLevel.DEBUG
        }
        return mappings[self.value]

    @property
    def requires_citations(self) -> bool:
        """Whether this audience needs policy citations."""
        return self in [
            AudienceType.COMPLIANCE_OFFICER, AudienceType.AUDITOR,
            AudienceType.LEGAL, AudienceType.REGULATOR
        ]

    @property
    def jargon_tolerance(self) -> str:
        """Acceptable technical jargon level."""
        tolerances = {
            "end_user": "none", "business_user": "low",
            "technical_user": "high", "compliance_officer": "medium",
            "executive": "low", "auditor": "medium",
            "data_scientist": "high", "legal": "medium",
            "regulator": "medium", "developer": "high"
        }
        return tolerances[self.value]


class FactorType(Enum):
    """Types of factors contributing to decisions."""
    INPUT_DATA = "input_data"
    MODEL_WEIGHT = "model_weight"
    POLICY_RULE = "policy_rule"
    THRESHOLD = "threshold"
    CONTEXTUAL = "contextual"
    HISTORICAL = "historical"
    CONSTRAINT = "constraint"
    OVERRIDE = "override"
    DEFAULT = "default"
    DERIVED = "derived"

    @property
    def is_deterministic(self) -> bool:
        """Whether this factor type is deterministic."""
        return self in [
            FactorType.POLICY_RULE, FactorType.THRESHOLD,
            FactorType.CONSTRAINT, FactorType.DEFAULT
        ]

    @property
    def explainability_complexity(self) -> str:
        """How hard it is to explain this factor type."""
        complexities = {
            "input_data": "low", "model_weight": "high",
            "policy_rule": "low", "threshold": "low",
            "contextual": "medium", "historical": "medium",
            "constraint": "low", "override": "low",
            "default": "low", "derived": "medium"
        }
        return complexities[self.value]


class ConfidenceLevel(Enum):
    """Confidence levels for decisions."""
    VERY_HIGH = "very_high"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    VERY_LOW = "very_low"
    UNCERTAIN = "uncertain"

    @property
    def score_range(self) -> tuple[float, float]:
        """Score range for this confidence level."""
        ranges = {
            "very_high": (0.95, 1.0), "high": (0.80, 0.95),
            "medium": (0.60, 0.80), "low": (0.40, 0.60),
            "very_low": (0.20, 0.40), "uncertain": (0.0, 0.20)
        }
        return ranges[self.value]

    @property
    def requires_human_review(self) -> bool:
        """Whether this confidence level needs human review."""
        return self in [
            ConfidenceLevel.LOW, ConfidenceLevel.VERY_LOW,
            ConfidenceLevel.UNCERTAIN
        ]

    @property
    def disclosure_urgency(self) -> str:
        """How urgently uncertainty should be disclosed."""
        urgencies = {
            "very_high": "optional", "high": "optional",
            "medium": "recommended", "low": "required",
            "very_low": "critical", "uncertain": "critical"
        }
        return urgencies[self.value]


class DisclosureMode(Enum):
    """How much information to disclose."""
    FULL = "full"
    PARTIAL = "partial"
    SUMMARY_ONLY = "summary_only"
    REDACTED = "redacted"
    ANONYMIZED = "anonymized"
    AGGREGATED = "aggregated"

    @property
    def allows_factor_details(self) -> bool:
        """Whether individual factors can be shown."""
        return self in [DisclosureMode.FULL, DisclosureMode.PARTIAL]

    @property
    def allows_weights(self) -> bool:
        """Whether factor weights can be disclosed."""
        return self == DisclosureMode.FULL


class LimitationType(Enum):
    """Types of limitations to disclose."""
    DATA_QUALITY = "data_quality"
    MODEL_LIMITATION = "model_limitation"
    COVERAGE_GAP = "coverage_gap"
    EDGE_CASE = "edge_case"
    TEMPORAL = "temporal"
    SCOPE = "scope"
    METHODOLOGY = "methodology"
    UNKNOWN_UNKNOWNS = "unknown_unknowns"

    @property
    def severity_weight(self) -> float:
        """How significantly this limitation affects reliability."""
        weights = {
            "data_quality": 0.8, "model_limitation": 0.9,
            "coverage_gap": 0.7, "edge_case": 0.6,
            "temporal": 0.5, "scope": 0.4,
            "methodology": 0.7, "unknown_unknowns": 1.0
        }
        return weights[self.value]


class CaveatSeverity(Enum):
    """Severity of caveats in explanations."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"

    @property
    def must_acknowledge(self) -> bool:
        """Whether user must acknowledge this caveat."""
        return self in [CaveatSeverity.CRITICAL, CaveatSeverity.HIGH]


class ReferencePriority(Enum):
    """Priority for policy references."""
    PRIMARY = "primary"
    SECONDARY = "secondary"
    SUPPORTING = "supporting"
    CONTEXTUAL = "contextual"

    @property
    def must_cite(self) -> bool:
        """Whether this reference must be cited."""
        return self in [ReferencePriority.PRIMARY, ReferencePriority.SECONDARY]


class AppealOption(Enum):
    """Options for appealing decisions."""
    REQUEST_REVIEW = "request_review"
    PROVIDE_ADDITIONAL_INFO = "provide_additional_info"
    ESCALATE = "escalate"
    FORMAL_DISPUTE = "formal_dispute"
    REGULATORY_COMPLAINT = "regulatory_complaint"

    @property
    def typical_timeline_days(self) -> int:
        """Typical resolution timeline in days."""
        timelines = {
            "request_review": 3, "provide_additional_info": 5,
            "escalate": 7, "formal_dispute": 14, "regulatory_complaint": 30
        }
        return timelines[self.value]


class DecisionDomain(Enum):
    """Domain of the decision being explained."""
    CREDIT = "credit"
    CONTENT_MODERATION = "content_moderation"
    RECOMMENDATION = "recommendation"
    FRAUD_DETECTION = "fraud_detection"
    RISK_ASSESSMENT = "risk_assessment"
    ELIGIBILITY = "eligibility"
    PRICING = "pricing"
    CLASSIFICATION = "classification"
    PREDICTION = "prediction"
    ROUTING = "routing"

    @property
    def regulatory_requirements(self) -> list[str]:
        """Regulatory frameworks that may apply."""
        requirements = {
            "credit": ["FCRA", "ECOA", "GDPR_Art22"],
            "content_moderation": ["DSA", "NetzDG"],
            "recommendation": ["GDPR_Art22"],
            "fraud_detection": ["GDPR", "PCI_DSS"],
            "risk_assessment": ["Basel_III", "Solvency_II"],
            "eligibility": ["ADA", "FCRA"],
            "pricing": ["Antitrust", "Consumer_Protection"],
            "classification": ["GDPR_Art22"],
            "prediction": ["GDPR_Art22"],
            "routing": ["Service_Standards"]
        }
        return requirements.get(self.value, [])


# ============================================================
# DATACLASSES WITH BUSINESS LOGIC
# ============================================================

@dataclass
class Factor:
    """A factor contributing to a decision."""
    factor_id: str
    name: str
    factor_type: FactorType
    value: str
    weight: float
    contribution: str
    source: str
    timestamp: datetime = field(default_factory=datetime.now)
    is_primary: bool = False
    is_sensitive: bool = False

    def get_influence_score(self) -> float:
        """Calculate influence score (weight * type importance)."""
        type_multipliers = {
            FactorType.INPUT_DATA: 1.0, FactorType.MODEL_WEIGHT: 0.8,
            FactorType.POLICY_RULE: 1.2, FactorType.THRESHOLD: 1.1,
            FactorType.OVERRIDE: 1.5, FactorType.DEFAULT: 0.5
        }
        multiplier = type_multipliers.get(self.factor_type, 1.0)
        return self.weight * multiplier

    def get_explanation_text(self, audience: AudienceType) -> str:
        """Generate audience-appropriate explanation text."""
        if audience.jargon_tolerance == "none":
            return f"{self.name} contributed to this decision"
        elif audience.jargon_tolerance == "low":
            return f"{self.name}: {self.contribution}"
        else:
            return f"{self.name} ({self.factor_type.value}): {self.contribution} (weight: {self.weight:.2f})"

    def can_disclose(self, mode: DisclosureMode) -> bool:
        """Check if this factor can be disclosed under given mode."""
        if self.is_sensitive and mode != DisclosureMode.FULL:
            return False
        return mode.allows_factor_details


@dataclass
class PolicyReference:
    """A policy or rule referenced in explanation."""
    policy_id: str
    name: str
    version: str
    section: str
    priority: ReferencePriority
    application: str
    effective_date: datetime
    source_url: Optional[str] = None

    def get_citation(self) -> str:
        """Generate formal citation."""
        return f"{self.name} v{self.version}, §{self.section}"

    def is_current(self) -> bool:
        """Check if policy version is current."""
        return self.effective_date <= datetime.now()


@dataclass
class Limitation:
    """A limitation affecting the decision."""
    limitation_id: str
    limitation_type: LimitationType
    description: str
    impact: str
    severity: CaveatSeverity
    mitigations: list[str] = field(default_factory=list)

    def get_disclosure_text(self, audience: AudienceType) -> str:
        """Generate audience-appropriate limitation disclosure."""
        base_text = f"{self.description}: {self.impact}"
        if audience.jargon_tolerance == "high" and self.mitigations:
            base_text += f" Mitigations: {', '.join(self.mitigations)}"
        return base_text

    def get_reliability_impact(self) -> float:
        """Calculate impact on overall reliability score."""
        return self.limitation_type.severity_weight * (
            0.3 if self.severity == CaveatSeverity.LOW else
            0.5 if self.severity == CaveatSeverity.MEDIUM else
            0.7 if self.severity == CaveatSeverity.HIGH else 1.0
        )


@dataclass
class ConfidenceAssessment:
    """Assessment of decision confidence."""
    assessment_id: str
    overall_level: ConfidenceLevel
    overall_score: float
    data_quality_score: float
    model_certainty_score: float
    rule_clarity_score: float
    coverage_score: float
    uncertainty_sources: list[str] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)

    def calculate_combined_score(self) -> float:
        """Calculate weighted combined confidence score."""
        weights = {
            "data_quality": 0.25, "model_certainty": 0.30,
            "rule_clarity": 0.25, "coverage": 0.20
        }
        return (
            self.data_quality_score * weights["data_quality"] +
            self.model_certainty_score * weights["model_certainty"] +
            self.rule_clarity_score * weights["rule_clarity"] +
            self.coverage_score * weights["coverage"]
        )

    def get_level_from_score(self) -> ConfidenceLevel:
        """Determine confidence level from combined score."""
        score = self.calculate_combined_score()
        for level in ConfidenceLevel:
            min_score, max_score = level.score_range
            if min_score <= score <= max_score:
                return level
        return ConfidenceLevel.UNCERTAIN

    def needs_disclosure(self) -> bool:
        """Check if uncertainty needs explicit disclosure."""
        return self.overall_level.disclosure_urgency in ["required", "critical"]

    def get_disclosure_text(self) -> str:
        """Generate confidence disclosure text."""
        return (
            f"Confidence: {self.overall_level.value.replace('_', ' ').title()} "
            f"({self.overall_score:.0%}). "
            f"Uncertainty sources: {', '.join(self.uncertainty_sources) if self.uncertainty_sources else 'None identified'}"
        )


@dataclass
class AppealPath:
    """An available appeal option."""
    path_id: str
    option: AppealOption
    process_description: str
    timeline_description: str
    eligibility_criteria: list[str] = field(default_factory=list)
    contact_info: Optional[str] = None

    def get_deadline(self, decision_date: datetime) -> datetime:
        """Calculate appeal deadline."""
        return decision_date + timedelta(days=self.option.typical_timeline_days * 2)

    def format_for_display(self) -> dict:
        """Format appeal path for display."""
        return {
            "option": self.option.value.replace("_", " ").title(),
            "process": self.process_description,
            "timeline": self.timeline_description,
            "contact": self.contact_info
        }


@dataclass
class DecisionExplanation:
    """Complete explanation of a decision."""
    explanation_id: str
    decision_id: str
    domain: DecisionDomain
    outcome: str
    summary: str
    primary_reason: str
    factors: list[Factor] = field(default_factory=list)
    policies: list[PolicyReference] = field(default_factory=list)
    limitations: list[Limitation] = field(default_factory=list)
    confidence: Optional[ConfidenceAssessment] = None
    appeal_paths: list[AppealPath] = field(default_factory=list)
    generated_at: datetime = field(default_factory=datetime.now)
    level: ExplanationLevel = ExplanationLevel.STANDARD
    audience: AudienceType = AudienceType.END_USER

    def get_primary_factors(self) -> list[Factor]:
        """Get primary contributing factors."""
        return sorted(
            [f for f in self.factors if f.is_primary],
            key=lambda f: f.get_influence_score(),
            reverse=True
        )

    def get_total_factor_weight(self) -> float:
        """Sum of all factor weights (should approach 1.0)."""
        return sum(f.weight for f in self.factors)

    def get_applicable_regulations(self) -> list[str]:
        """Get regulations that apply to this decision."""
        return self.domain.regulatory_requirements

    def validate_completeness(self) -> list[str]:
        """Validate explanation meets requirements."""
        issues = []
        if not self.summary:
            issues.append("Missing summary")
        if not self.primary_reason:
            issues.append("Missing primary reason")
        if not self.factors:
            issues.append("No factors documented")
        if self.audience.requires_citations and not self.policies:
            issues.append(f"Audience {self.audience.value} requires policy citations")
        if self.confidence and self.confidence.needs_disclosure():
            if not self.limitations:
                issues.append("Low confidence requires limitation disclosure")
        return issues

    def get_checksum(self) -> str:
        """Generate checksum for audit trail."""
        content = f"{self.explanation_id}:{self.decision_id}:{self.outcome}:{self.generated_at.isoformat()}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]


@dataclass
class ExplanationRequest:
    """Request for an explanation."""
    request_id: str
    decision_id: str
    requestor: str
    audience: AudienceType
    level: ExplanationLevel
    domain: DecisionDomain
    requested_at: datetime = field(default_factory=datetime.now)
    disclosure_mode: DisclosureMode = DisclosureMode.FULL
    include_confidence: bool = True
    include_appeals: bool = True

    def get_disclosure_constraints(self) -> dict:
        """Get constraints based on disclosure mode."""
        return {
            "show_factors": self.disclosure_mode.allows_factor_details,
            "show_weights": self.disclosure_mode.allows_weights,
            "audience_level": self.audience.preferred_level,
            "requires_citations": self.audience.requires_citations
        }


@dataclass
class AuditRecord:
    """Audit record for explanation generation."""
    record_id: str
    explanation_id: str
    request_id: str
    action: str
    actor: str
    timestamp: datetime = field(default_factory=datetime.now)
    details: dict = field(default_factory=dict)
    checksum: str = ""

    def __post_init__(self):
        if not self.checksum:
            content = f"{self.record_id}:{self.explanation_id}:{self.action}:{self.timestamp.isoformat()}"
            self.checksum = hashlib.sha256(content.encode()).hexdigest()[:16]

    def verify_integrity(self) -> bool:
        """Verify record hasn't been tampered with."""
        expected = f"{self.record_id}:{self.explanation_id}:{self.action}:{self.timestamp.isoformat()}"
        return hashlib.sha256(expected.encode()).hexdigest()[:16] == self.checksum


# ============================================================
# ENGINE CLASSES
# ============================================================

class SummaryGeneratorEngine:
    """Engine for generating plain-language summaries."""

    SUMMARY_TEMPLATES = {
        DecisionDomain.CREDIT: {
            "approved": "Your {product} application was approved because {reason}.",
            "denied": "Your {product} application was not approved because {reason}.",
        },
        DecisionDomain.CONTENT_MODERATION: {
            "approved": "Your content was approved for publication.",
            "removed": "Your content was removed because {reason}.",
            "restricted": "Your content was restricted because {reason}.",
        },
        DecisionDomain.RECOMMENDATION: {
            "standard": "We recommended {item} based on {reason}.",
        },
        DecisionDomain.ELIGIBILITY: {
            "eligible": "You are eligible for {program} because {reason}.",
            "ineligible": "You are not eligible for {program} because {reason}.",
        }
    }

    def __init__(self):
        self.generated_count = 0

    def generate_summary(
        self,
        outcome: str,
        domain: DecisionDomain,
        primary_reason: str,
        audience: AudienceType,
        context: dict
    ) -> str:
        """Generate audience-appropriate summary."""
        templates = self.SUMMARY_TEMPLATES.get(domain, {})
        template = templates.get(outcome.lower(), "The decision was {outcome} because {reason}.")

        # Adapt language for audience
        if audience.jargon_tolerance == "none":
            primary_reason = self._simplify_language(primary_reason)

        summary = template.format(
            outcome=outcome,
            reason=primary_reason,
            **context
        )

        self.generated_count += 1
        return summary

    def _simplify_language(self, text: str) -> str:
        """Simplify technical language for end users."""
        replacements = {
            "insufficient": "not enough",
            "criteria": "requirements",
            "threshold": "minimum level",
            "algorithm": "system",
            "model": "system",
            "parameters": "settings"
        }
        result = text.lower()
        for technical, simple in replacements.items():
            result = result.replace(technical, simple)
        return result

    def extract_key_factors(
        self,
        factors: list[Factor],
        max_count: int = 3
    ) -> list[Factor]:
        """Extract most important factors for summary."""
        sorted_factors = sorted(
            factors,
            key=lambda f: f.get_influence_score(),
            reverse=True
        )
        return sorted_factors[:max_count]

    def frame_context(
        self,
        domain: DecisionDomain,
        audience: AudienceType,
        factors: list[Factor]
    ) -> str:
        """Add contextual framing to explanation."""
        if domain in [DecisionDomain.CREDIT, DecisionDomain.ELIGIBILITY]:
            return "This decision was made using established criteria and your provided information."
        elif domain == DecisionDomain.CONTENT_MODERATION:
            return "Content decisions are made according to our community guidelines."
        return "This decision was based on available information and applicable rules."


class AttributionTracerEngine:
    """Engine for tracing factor contributions."""

    def __init__(self):
        self.traced_decisions = []

    def identify_inputs(self, decision_data: dict) -> list[dict]:
        """Identify all inputs that contributed to decision."""
        inputs = []
        for key, value in decision_data.items():
            if key.startswith("input_"):
                inputs.append({
                    "name": key.replace("input_", ""),
                    "value": value,
                    "type": self._infer_input_type(value)
                })
        return inputs

    def _infer_input_type(self, value) -> str:
        """Infer the type of input."""
        if isinstance(value, bool):
            return "boolean"
        elif isinstance(value, (int, float)):
            return "numeric"
        elif isinstance(value, str):
            return "text"
        elif isinstance(value, list):
            return "array"
        return "unknown"

    def calculate_contribution(
        self,
        factor: Factor,
        total_weight: float
    ) -> dict:
        """Calculate and describe factor's contribution."""
        relative_weight = factor.weight / total_weight if total_weight > 0 else 0

        contribution_level = (
            "major" if relative_weight > 0.3 else
            "significant" if relative_weight > 0.15 else
            "moderate" if relative_weight > 0.05 else
            "minor"
        )

        return {
            "factor_id": factor.factor_id,
            "absolute_weight": factor.weight,
            "relative_weight": relative_weight,
            "contribution_level": contribution_level,
            "influence_score": factor.get_influence_score()
        }

    def build_attribution_map(self, factors: list[Factor]) -> dict:
        """Build complete attribution map for all factors."""
        total_weight = sum(f.weight for f in factors)

        return {
            "total_factors": len(factors),
            "total_weight": total_weight,
            "attribution": [
                self.calculate_contribution(f, total_weight)
                for f in factors
            ],
            "weight_normalized": abs(total_weight - 1.0) < 0.01
        }

    def link_sources(
        self,
        factor: Factor,
        source_registry: dict
    ) -> dict:
        """Link factor to its original sources."""
        return {
            "factor_id": factor.factor_id,
            "source": factor.source,
            "source_type": source_registry.get(factor.source, {}).get("type", "unknown"),
            "source_reliability": source_registry.get(factor.source, {}).get("reliability", "unverified"),
            "timestamp": factor.timestamp.isoformat()
        }


class PolicyReferencerEngine:
    """Engine for policy citation and mapping."""

    POLICY_TEMPLATES = {
        "GDPR_Art22": {
            "name": "GDPR Article 22",
            "section": "Automated Decision Making",
            "summary": "Right to explanation for automated decisions"
        },
        "FCRA": {
            "name": "Fair Credit Reporting Act",
            "section": "Adverse Action",
            "summary": "Right to know reasons for credit denial"
        },
        "ECOA": {
            "name": "Equal Credit Opportunity Act",
            "section": "Notice Requirements",
            "summary": "Specific reasons for adverse actions"
        }
    }

    def __init__(self):
        self.policy_cache = {}

    def cite_rule(
        self,
        policy_id: str,
        application_context: str
    ) -> PolicyReference:
        """Create policy citation."""
        template = self.POLICY_TEMPLATES.get(policy_id, {})

        return PolicyReference(
            policy_id=policy_id,
            name=template.get("name", policy_id),
            version="current",
            section=template.get("section", "General"),
            priority=ReferencePriority.PRIMARY,
            application=application_context,
            effective_date=datetime.now()
        )

    def map_policies_to_decision(
        self,
        domain: DecisionDomain,
        factors: list[Factor]
    ) -> list[PolicyReference]:
        """Map applicable policies to decision."""
        policies = []

        # Add regulatory requirements
        for reg in domain.regulatory_requirements:
            policies.append(self.cite_rule(
                reg,
                f"Required for {domain.value} decisions"
            ))

        # Add policy-type factors as references
        for factor in factors:
            if factor.factor_type == FactorType.POLICY_RULE:
                policies.append(PolicyReference(
                    policy_id=factor.factor_id,
                    name=factor.name,
                    version="1.0",
                    section=factor.source,
                    priority=ReferencePriority.SECONDARY,
                    application=factor.contribution,
                    effective_date=datetime.now()
                ))

        return policies

    def explain_constraint(
        self,
        constraint_name: str,
        constraint_value: str,
        audience: AudienceType
    ) -> str:
        """Explain a constraint in audience-appropriate language."""
        if audience.jargon_tolerance == "none":
            return f"A rule called '{constraint_name}' affected this decision."
        elif audience.jargon_tolerance == "low":
            return f"The {constraint_name} constraint required: {constraint_value}"
        else:
            return f"Constraint '{constraint_name}' applied with value '{constraint_value}'"


class ConfidenceReporterEngine:
    """Engine for confidence assessment and reporting."""

    SCORE_THRESHOLDS = {
        "data_quality": {"excellent": 0.9, "good": 0.7, "fair": 0.5, "poor": 0.3},
        "model_certainty": {"excellent": 0.95, "good": 0.8, "fair": 0.6, "poor": 0.4},
        "rule_clarity": {"excellent": 0.95, "good": 0.85, "fair": 0.7, "poor": 0.5},
        "coverage": {"excellent": 0.9, "good": 0.75, "fair": 0.6, "poor": 0.4}
    }

    def __init__(self):
        self.assessments = []

    def assess_confidence(
        self,
        data_quality: float,
        model_certainty: float,
        rule_clarity: float,
        coverage: float,
        uncertainty_sources: list[str]
    ) -> ConfidenceAssessment:
        """Create comprehensive confidence assessment."""
        assessment = ConfidenceAssessment(
            assessment_id=f"conf_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            overall_level=ConfidenceLevel.MEDIUM,  # Will be calculated
            overall_score=0.0,
            data_quality_score=data_quality,
            model_certainty_score=model_certainty,
            rule_clarity_score=rule_clarity,
            coverage_score=coverage,
            uncertainty_sources=uncertainty_sources
        )

        # Calculate overall
        assessment.overall_score = assessment.calculate_combined_score()
        assessment.overall_level = assessment.get_level_from_score()

        self.assessments.append(assessment)
        return assessment

    def score_component(self, component: str, value: float) -> str:
        """Get qualitative score for a component."""
        thresholds = self.SCORE_THRESHOLDS.get(component, {})
        if value >= thresholds.get("excellent", 0.9):
            return "excellent"
        elif value >= thresholds.get("good", 0.7):
            return "good"
        elif value >= thresholds.get("fair", 0.5):
            return "fair"
        return "poor"

    def identify_uncertainty_sources(
        self,
        factors: list[Factor],
        limitations: list[Limitation]
    ) -> list[str]:
        """Identify sources of uncertainty."""
        sources = []

        # Check for non-deterministic factors
        non_deterministic = [f for f in factors if not f.factor_type.is_deterministic]
        if non_deterministic:
            sources.append(f"{len(non_deterministic)} probabilistic factors")

        # Check limitations
        for limitation in limitations:
            if limitation.limitation_type == LimitationType.UNKNOWN_UNKNOWNS:
                sources.append("Potential unknown factors")
            elif limitation.limitation_type == LimitationType.DATA_QUALITY:
                sources.append("Data quality concerns")

        return sources

    def flag_limitations(
        self,
        assessment: ConfidenceAssessment
    ) -> list[str]:
        """Flag significant limitations based on assessment."""
        flags = []

        if assessment.data_quality_score < 0.5:
            flags.append("Low data quality may affect accuracy")
        if assessment.model_certainty_score < 0.6:
            flags.append("Model has low certainty for this case")
        if assessment.coverage_score < 0.6:
            flags.append("This case may be outside typical coverage")

        return flags


class ExplainabilityEngine:
    """Main orchestrator for explainability operations."""

    def __init__(self):
        self.summary_engine = SummaryGeneratorEngine()
        self.attribution_engine = AttributionTracerEngine()
        self.policy_engine = PolicyReferencerEngine()
        self.confidence_engine = ConfidenceReporterEngine()
        self.explanations = []
        self.audit_trail = []

    def generate_explanation(
        self,
        request: ExplanationRequest,
        decision_data: dict,
        factors: list[Factor],
        outcome: str,
        primary_reason: str
    ) -> DecisionExplanation:
        """Generate complete explanation for a decision."""
        # Assess confidence
        confidence = self.confidence_engine.assess_confidence(
            data_quality=decision_data.get("data_quality", 0.8),
            model_certainty=decision_data.get("model_certainty", 0.7),
            rule_clarity=decision_data.get("rule_clarity", 0.9),
            coverage=decision_data.get("coverage", 0.8),
            uncertainty_sources=self.confidence_engine.identify_uncertainty_sources(
                factors, []
            )
        )

        # Map policies
        policies = self.policy_engine.map_policies_to_decision(
            request.domain, factors
        )

        # Identify limitations
        limitations = self._identify_limitations(confidence, decision_data)

        # Generate summary
        summary = self.summary_engine.generate_summary(
            outcome=outcome,
            domain=request.domain,
            primary_reason=primary_reason,
            audience=request.audience,
            context=decision_data
        )

        # Build explanation
        explanation = DecisionExplanation(
            explanation_id=f"exp_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            decision_id=request.decision_id,
            domain=request.domain,
            outcome=outcome,
            summary=summary,
            primary_reason=primary_reason,
            factors=factors,
            policies=policies,
            limitations=limitations,
            confidence=confidence if request.include_confidence else None,
            appeal_paths=self._get_appeal_paths(request.domain) if request.include_appeals else [],
            level=request.level,
            audience=request.audience
        )

        # Audit
        self._log_audit("explanation_generated", request.request_id, explanation.explanation_id)
        self.explanations.append(explanation)

        return explanation

    def _identify_limitations(
        self,
        confidence: ConfidenceAssessment,
        decision_data: dict
    ) -> list[Limitation]:
        """Identify limitations based on confidence and data."""
        limitations = []

        if confidence.data_quality_score < 0.7:
            limitations.append(Limitation(
                limitation_id=f"lim_{len(limitations)}",
                limitation_type=LimitationType.DATA_QUALITY,
                description="Some input data may be incomplete or outdated",
                impact="May affect precision of the decision",
                severity=CaveatSeverity.MEDIUM
            ))

        if confidence.coverage_score < 0.7:
            limitations.append(Limitation(
                limitation_id=f"lim_{len(limitations)}",
                limitation_type=LimitationType.COVERAGE_GAP,
                description="This case has unusual characteristics",
                impact="Decision may be less reliable than typical cases",
                severity=CaveatSeverity.MEDIUM
            ))

        return limitations

    def _get_appeal_paths(self, domain: DecisionDomain) -> list[AppealPath]:
        """Get available appeal paths for domain."""
        paths = [
            AppealPath(
                path_id="appeal_review",
                option=AppealOption.REQUEST_REVIEW,
                process_description="Request human review of the decision",
                timeline_description="Typically resolved within 3 business days"
            ),
            AppealPath(
                path_id="appeal_info",
                option=AppealOption.PROVIDE_ADDITIONAL_INFO,
                process_description="Submit additional information for reconsideration",
                timeline_description="Typically resolved within 5 business days"
            )
        ]

        if domain.regulatory_requirements:
            paths.append(AppealPath(
                path_id="appeal_regulatory",
                option=AppealOption.REGULATORY_COMPLAINT,
                process_description="File complaint with regulatory authority",
                timeline_description="Varies by jurisdiction"
            ))

        return paths

    def _log_audit(self, action: str, request_id: str, explanation_id: str):
        """Log audit record."""
        record = AuditRecord(
            record_id=f"aud_{len(self.audit_trail)}",
            explanation_id=explanation_id,
            request_id=request_id,
            action=action,
            actor="system"
        )
        self.audit_trail.append(record)

    def get_explanation_summary(self) -> dict:
        """Get summary of all generated explanations."""
        return {
            "total_explanations": len(self.explanations),
            "by_domain": self._count_by_field("domain"),
            "by_audience": self._count_by_field("audience"),
            "by_level": self._count_by_field("level"),
            "audit_records": len(self.audit_trail)
        }

    def _count_by_field(self, field: str) -> dict:
        """Count explanations by field value."""
        counts = {}
        for exp in self.explanations:
            value = getattr(exp, field).value if hasattr(getattr(exp, field), "value") else str(getattr(exp, field))
            counts[value] = counts.get(value, 0) + 1
        return counts


# ============================================================
# REPORTER CLASS
# ============================================================

class ExplainabilityReporter:
    """Generate explanation reports and visualizations."""

    def __init__(self, engine: ExplainabilityEngine):
        self.engine = engine

    def generate_explanation_report(
        self,
        explanation: DecisionExplanation
    ) -> str:
        """Generate full explanation report."""
        lines = [
            "═" * 60,
            "DECISION EXPLANATION REPORT",
            "═" * 60,
            f"Explanation ID: {explanation.explanation_id}",
            f"Decision ID:    {explanation.decision_id}",
            f"Domain:         {explanation.domain.value}",
            f"Generated:      {explanation.generated_at.strftime('%Y-%m-%d %H:%M:%S')}",
            f"Audience:       {explanation.audience.value}",
            f"Level:          {explanation.level.value}",
            "═" * 60,
            "",
            "PLAIN-LANGUAGE SUMMARY",
            "─" * 40,
            explanation.summary,
            "",
            f"Why: {explanation.primary_reason}",
            ""
        ]

        # Confidence section
        if explanation.confidence:
            conf = explanation.confidence
            lines.extend([
                "CONFIDENCE ASSESSMENT",
                "─" * 40,
                f"Overall Level: {conf.overall_level.value.upper()}",
                f"Overall Score: {conf.overall_score:.0%}",
                "",
                f"  Data Quality:    {self._bar(conf.data_quality_score)} {conf.data_quality_score:.0%}",
                f"  Model Certainty: {self._bar(conf.model_certainty_score)} {conf.model_certainty_score:.0%}",
                f"  Rule Clarity:    {self._bar(conf.rule_clarity_score)} {conf.rule_clarity_score:.0%}",
                f"  Coverage:        {self._bar(conf.coverage_score)} {conf.coverage_score:.0%}",
                ""
            ])
            if conf.uncertainty_sources:
                lines.append("Uncertainty Sources:")
                for source in conf.uncertainty_sources:
                    lines.append(f"  • {source}")
                lines.append("")

        # Factors section
        lines.extend([
            "KEY FACTORS",
            "─" * 40
        ])
        for factor in sorted(explanation.factors, key=lambda f: f.weight, reverse=True):
            lines.append(
                f"  [{factor.factor_type.value:12}] {factor.name}: {factor.contribution} "
                f"(weight: {factor.weight:.2f})"
            )
        lines.append("")

        # Policies section
        if explanation.policies:
            lines.extend([
                "APPLICABLE POLICIES",
                "─" * 40
            ])
            for policy in explanation.policies:
                lines.append(f"  • {policy.get_citation()}: {policy.application}")
            lines.append("")

        # Limitations section
        if explanation.limitations:
            lines.extend([
                "KNOWN LIMITATIONS",
                "─" * 40
            ])
            for lim in explanation.limitations:
                lines.append(f"  [{lim.severity.value:12}] {lim.description}")
                lines.append(f"                   Impact: {lim.impact}")
            lines.append("")

        # Appeals section
        if explanation.appeal_paths:
            lines.extend([
                "APPEAL OPTIONS",
                "─" * 40
            ])
            for path in explanation.appeal_paths:
                info = path.format_for_display()
                lines.append(f"  • {info['option']}: {info['process']}")
                lines.append(f"    Timeline: {info['timeline']}")
            lines.append("")

        # Checksum
        lines.extend([
            "─" * 40,
            f"Checksum: {explanation.get_checksum()}",
            "═" * 60
        ])

        return "\n".join(lines)

    def generate_summary_report(
        self,
        explanation: DecisionExplanation
    ) -> str:
        """Generate brief summary for end users."""
        lines = [
            "━" * 50,
            "DECISION SUMMARY",
            "━" * 50,
            "",
            explanation.summary,
            "",
            f"Confidence: {explanation.confidence.overall_level.value.replace('_', ' ').title() if explanation.confidence else 'Not assessed'}",
            ""
        ]

        if explanation.limitations:
            lines.append("Please note:")
            for lim in explanation.limitations:
                lines.append(f"  • {lim.description}")
            lines.append("")

        if explanation.appeal_paths:
            lines.append("If you disagree with this decision, you may:")
            for path in explanation.appeal_paths[:2]:
                lines.append(f"  • {path.process_description}")

        return "\n".join(lines)

    def _bar(self, value: float, width: int = 10) -> str:
        """Generate ASCII progress bar."""
        filled = int(value * width)
        return "█" * filled + "░" * (width - filled)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="EXPLAINABILITY.OS.EXE - Decision Transparency Engine"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Explain command
    explain_parser = subparsers.add_parser("explain", help="Generate explanation for a decision")
    explain_parser.add_argument("--decision-id", required=True, help="Decision ID")
    explain_parser.add_argument("--domain", choices=[d.value for d in DecisionDomain], required=True)
    explain_parser.add_argument("--audience", choices=[a.value for a in AudienceType], default="end_user")
    explain_parser.add_argument("--level", choices=[l.value for l in ExplanationLevel], default="standard")
    explain_parser.add_argument("--outcome", required=True, help="Decision outcome")
    explain_parser.add_argument("--reason", required=True, help="Primary reason")

    # Summarize command
    summarize_parser = subparsers.add_parser("summarize", help="Generate plain-language summary")
    summarize_parser.add_argument("--decision-id", required=True)
    summarize_parser.add_argument("--domain", choices=[d.value for d in DecisionDomain], required=True)
    summarize_parser.add_argument("--audience", choices=[a.value for a in AudienceType], default="end_user")

    # Attribute command
    attribute_parser = subparsers.add_parser("attribute", help="Trace factor contributions")
    attribute_parser.add_argument("--decision-id", required=True)

    # Confidence command
    confidence_parser = subparsers.add_parser("confidence", help="Assess decision confidence")
    confidence_parser.add_argument("--data-quality", type=float, default=0.8)
    confidence_parser.add_argument("--model-certainty", type=float, default=0.7)
    confidence_parser.add_argument("--rule-clarity", type=float, default=0.9)
    confidence_parser.add_argument("--coverage", type=float, default=0.8)

    # Audit command
    audit_parser = subparsers.add_parser("audit", help="View audit trail")
    audit_parser.add_argument("--explanation-id", help="Filter by explanation ID")

    args = parser.parse_args()

    engine = ExplainabilityEngine()
    reporter = ExplainabilityReporter(engine)

    if args.command == "explain":
        # Create sample factors for demo
        factors = [
            Factor(
                factor_id="f1",
                name="Primary Input",
                factor_type=FactorType.INPUT_DATA,
                value="provided",
                weight=0.4,
                contribution="Major contributing factor",
                source="user_input",
                is_primary=True
            ),
            Factor(
                factor_id="f2",
                name="Policy Rule",
                factor_type=FactorType.POLICY_RULE,
                value="applicable",
                weight=0.3,
                contribution="Applied standard policy",
                source="policy_engine",
                is_primary=True
            )
        ]

        request = ExplanationRequest(
            request_id=f"req_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            decision_id=args.decision_id,
            requestor="cli_user",
            audience=AudienceType(args.audience),
            level=ExplanationLevel(args.level),
            domain=DecisionDomain(args.domain)
        )

        explanation = engine.generate_explanation(
            request=request,
            decision_data={"product": "service", "data_quality": 0.8},
            factors=factors,
            outcome=args.outcome,
            primary_reason=args.reason
        )

        print(reporter.generate_explanation_report(explanation))

    elif args.command == "confidence":
        conf_engine = ConfidenceReporterEngine()
        assessment = conf_engine.assess_confidence(
            data_quality=args.data_quality,
            model_certainty=args.model_certainty,
            rule_clarity=args.rule_clarity,
            coverage=args.coverage,
            uncertainty_sources=[]
        )

        print("CONFIDENCE ASSESSMENT")
        print("=" * 40)
        print(f"Overall Level: {assessment.overall_level.value}")
        print(f"Overall Score: {assessment.overall_score:.0%}")
        print(f"Combined Score: {assessment.calculate_combined_score():.0%}")
        print(f"Needs Human Review: {assessment.overall_level.requires_human_review}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW

### Phase 1: ANALYZE
1. Identify decision
2. Extract key factors
3. Map contributions
4. Note constraints
5. Assess confidence

### Phase 2: SYNTHESIZE
1. Structure explanation
2. Prioritize factors
3. Cite sources
4. Add context
5. Flag limitations

### Phase 3: ADAPT
1. Identify audience
2. Adjust language
3. Select detail level
4. Choose format
5. Add examples

### Phase 4: VERIFY
1. Check accuracy
2. Validate completeness
3. Confirm clarity
4. Review sensitivity
5. Approve disclosure

---

## EXPLANATION LEVELS

| Level | Audience | Detail | Format |
|-------|----------|--------|--------|
| Summary | End user | Low | Plain language |
| Standard | Business user | Medium | Structured |
| Detailed | Technical | High | Full trace |
| Audit | Compliance | Complete | Formal record |

## QUICK COMMANDS

- `/explainability` - Full explanation framework
- `/explainability [decision]` - Specific decision trace
- `/explainability summary` - Plain-language explanation
- `/explainability audit` - Compliance-level detail
- `/explainability confidence` - Certainty breakdown

$ARGUMENTS
