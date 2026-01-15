# BOUNDED.REASONING.OS.EXE - Bounded Advanced Reasoning & Deliberation OS

You are BOUNDED.REASONING.OS.EXE — a structured deliberation engine that provides high-quality reasoning within strict constraints and transparent bounds.

MISSION
Provide high-quality reasoning while respecting constraints, time bounds, and safety limits. Transparent reasoning enables trust. No hidden steps.

---

## CAPABILITIES

### ProblemFramer.MOD
- Problem statement clarification
- Scope definition
- Constraint identification
- Success criteria
- Boundary setting

### AssumptionDeclarer.MOD
- Assumption surfacing
- Dependency mapping
- Uncertainty quantification
- Risk identification
- Limitation acknowledgment

### OptionAnalyzer.MOD
- Option generation
- Tradeoff analysis
- Constraint checking
- Feasibility assessment
- Impact evaluation

### DecisionJustifier.MOD
- Recommendation formation
- Rationale documentation
- Evidence linking
- Confidence calibration
- Reviewability assurance

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
BOUNDED.REASONING.OS.EXE - Structured Deliberation Engine
Production-ready implementation for transparent AI reasoning
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any, Tuple
from enum import Enum
from datetime import datetime, timedelta
import hashlib
import json


# ════════════════════════════════════════════════════════════════════════════════
# ENUMS - Reasoning Classifications and Constraints
# ════════════════════════════════════════════════════════════════════════════════

class ConstraintType(Enum):
    """Types of reasoning constraints"""
    HARD = "hard"      # Must be satisfied
    SOFT = "soft"      # Should be satisfied
    PREFERENCE = "preference"  # Nice to have
    BOUNDARY = "boundary"  # Scope limit

    @property
    def violation_impact(self) -> str:
        """Impact of violating constraint"""
        impact_map = {
            "hard": "fatal",
            "soft": "significant",
            "preference": "minor",
            "boundary": "out_of_scope"
        }
        return impact_map.get(self.value, "unknown")

    @property
    def must_satisfy(self) -> bool:
        """Whether constraint must be satisfied"""
        return self.value in ["hard", "boundary"]


class ConfidenceLevel(Enum):
    """Confidence calibration levels"""
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

    @property
    def score_range(self) -> Tuple[int, int]:
        """Score range for confidence level"""
        ranges = {
            "very_low": (0, 20),
            "low": (21, 40),
            "medium": (41, 60),
            "high": (61, 80),
            "very_high": (81, 100)
        }
        return ranges.get(self.value, (0, 100))

    @property
    def requires_review(self) -> bool:
        """Whether decision requires human review"""
        return self.value in ["very_low", "low"]

    @property
    def can_automate(self) -> bool:
        """Whether decision can be automated"""
        return self.value in ["high", "very_high"]


class AssumptionStatus(Enum):
    """Status of assumptions"""
    STATED = "stated"
    VALIDATED = "validated"
    INVALIDATED = "invalidated"
    UNCERTAIN = "uncertain"
    PENDING_VERIFICATION = "pending_verification"

    @property
    def reliability(self) -> str:
        """Reliability level of assumption"""
        reliability_map = {
            "stated": "unknown",
            "validated": "high",
            "invalidated": "none",
            "uncertain": "low",
            "pending_verification": "medium"
        }
        return reliability_map.get(self.value, "unknown")

    @property
    def affects_confidence(self) -> float:
        """Factor to apply to confidence"""
        factor_map = {
            "stated": 0.8,
            "validated": 1.0,
            "invalidated": 0.0,
            "uncertain": 0.5,
            "pending_verification": 0.7
        }
        return factor_map.get(self.value, 0.5)


class OptionStatus(Enum):
    """Status of options being analyzed"""
    PROPOSED = "proposed"
    UNDER_ANALYSIS = "under_analysis"
    FEASIBLE = "feasible"
    INFEASIBLE = "infeasible"
    RECOMMENDED = "recommended"
    REJECTED = "rejected"
    SELECTED = "selected"

    @property
    def is_terminal(self) -> bool:
        """Whether status is final"""
        return self.value in ["infeasible", "rejected", "selected"]

    @property
    def requires_analysis(self) -> bool:
        """Whether further analysis needed"""
        return self.value in ["proposed", "under_analysis"]


class TradeoffType(Enum):
    """Types of tradeoffs"""
    COST_BENEFIT = "cost_benefit"
    RISK_REWARD = "risk_reward"
    TIME_QUALITY = "time_quality"
    SCOPE_RESOURCE = "scope_resource"
    SIMPLICITY_CAPABILITY = "simplicity_capability"
    SHORT_LONG_TERM = "short_long_term"

    @property
    def primary_factor(self) -> str:
        """Primary factor in tradeoff"""
        factors = {
            "cost_benefit": "cost",
            "risk_reward": "risk",
            "time_quality": "time",
            "scope_resource": "scope",
            "simplicity_capability": "simplicity",
            "short_long_term": "short_term"
        }
        return factors.get(self.value, "unknown")

    @property
    def secondary_factor(self) -> str:
        """Secondary factor in tradeoff"""
        factors = {
            "cost_benefit": "benefit",
            "risk_reward": "reward",
            "time_quality": "quality",
            "scope_resource": "resource",
            "simplicity_capability": "capability",
            "short_long_term": "long_term"
        }
        return factors.get(self.value, "unknown")


class EvidenceType(Enum):
    """Types of evidence supporting decisions"""
    DATA = "data"
    EXPERT_OPINION = "expert_opinion"
    PRECEDENT = "precedent"
    ANALYSIS = "analysis"
    SIMULATION = "simulation"
    ASSUMPTION = "assumption"

    @property
    def strength(self) -> str:
        """Evidence strength"""
        strengths = {
            "data": "strong",
            "expert_opinion": "moderate",
            "precedent": "moderate",
            "analysis": "strong",
            "simulation": "moderate",
            "assumption": "weak"
        }
        return strengths.get(self.value, "weak")

    @property
    def weight(self) -> float:
        """Weight for combining evidence"""
        weights = {
            "data": 1.0,
            "expert_opinion": 0.7,
            "precedent": 0.6,
            "analysis": 0.9,
            "simulation": 0.8,
            "assumption": 0.3
        }
        return weights.get(self.value, 0.5)


class ReasoningPhase(Enum):
    """Phases of reasoning process"""
    FRAMING = "framing"
    DECLARING = "declaring"
    ANALYZING = "analyzing"
    DECIDING = "deciding"
    REVIEWING = "reviewing"

    @property
    def order(self) -> int:
        """Phase order"""
        orders = {
            "framing": 1,
            "declaring": 2,
            "analyzing": 3,
            "deciding": 4,
            "reviewing": 5
        }
        return orders.get(self.value, 0)

    @property
    def outputs(self) -> List[str]:
        """Expected outputs from phase"""
        outputs = {
            "framing": ["problem_statement", "scope", "constraints", "success_criteria"],
            "declaring": ["assumptions", "dependencies", "uncertainties", "risks"],
            "analyzing": ["options", "tradeoffs", "feasibility", "impact"],
            "deciding": ["recommendation", "rationale", "evidence", "confidence"],
            "reviewing": ["validation", "gaps", "refinements"]
        }
        return outputs.get(self.value, [])


class UncertaintyType(Enum):
    """Types of uncertainty"""
    EPISTEMIC = "epistemic"      # Lack of knowledge
    ALEATORY = "aleatory"        # Inherent randomness
    MODEL = "model"              # Model limitations
    PARAMETER = "parameter"      # Parameter uncertainty
    CONTEXTUAL = "contextual"    # Context-dependent

    @property
    def reducible(self) -> bool:
        """Whether uncertainty can be reduced"""
        return self.value in ["epistemic", "model", "parameter"]

    @property
    def mitigation_strategy(self) -> str:
        """Strategy to mitigate uncertainty"""
        strategies = {
            "epistemic": "gather_more_data",
            "aleatory": "probabilistic_analysis",
            "model": "model_validation",
            "parameter": "sensitivity_analysis",
            "contextual": "scenario_planning"
        }
        return strategies.get(self.value, "acknowledge")


class RiskCategory(Enum):
    """Risk categories in decision-making"""
    TECHNICAL = "technical"
    OPERATIONAL = "operational"
    STRATEGIC = "strategic"
    FINANCIAL = "financial"
    COMPLIANCE = "compliance"
    REPUTATIONAL = "reputational"

    @property
    def impact_areas(self) -> List[str]:
        """Areas impacted by risk"""
        areas = {
            "technical": ["systems", "performance", "reliability"],
            "operational": ["processes", "efficiency", "continuity"],
            "strategic": ["goals", "competitive_position", "growth"],
            "financial": ["revenue", "costs", "profitability"],
            "compliance": ["regulations", "legal", "audit"],
            "reputational": ["brand", "trust", "relationships"]
        }
        return areas.get(self.value, [])


class DecisionOutcome(Enum):
    """Possible decision outcomes"""
    PROCEED = "proceed"
    PROCEED_WITH_CONDITIONS = "proceed_with_conditions"
    DEFER = "defer"
    REJECT = "reject"
    ESCALATE = "escalate"

    @property
    def requires_action(self) -> bool:
        """Whether outcome requires further action"""
        return self.value in ["proceed", "proceed_with_conditions", "escalate"]


# ════════════════════════════════════════════════════════════════════════════════
# DATACLASSES - Core Reasoning Models
# ════════════════════════════════════════════════════════════════════════════════

@dataclass
class ProblemStatement:
    """Structured problem definition"""
    problem_id: str
    title: str
    description: str
    context: str
    scope_in: List[str] = field(default_factory=list)
    scope_out: List[str] = field(default_factory=list)
    success_criteria: List[str] = field(default_factory=list)
    time_bound: Optional[timedelta] = None
    created_at: datetime = field(default_factory=datetime.now)

    def is_well_defined(self) -> bool:
        """Check if problem is well-defined"""
        return all([
            self.title,
            self.description,
            len(self.scope_in) > 0,
            len(self.success_criteria) > 0
        ])

    def get_scope_summary(self) -> str:
        """Get scope summary"""
        return f"In: {len(self.scope_in)} items, Out: {len(self.scope_out)} items"


@dataclass
class Constraint:
    """Reasoning constraint"""
    constraint_id: str
    name: str
    description: str
    constraint_type: ConstraintType
    value: Any = None
    unit: Optional[str] = None
    status: str = "unmet"  # met, unmet, partially_met
    violation_impact: Optional[str] = None

    def check(self, actual_value: Any) -> bool:
        """Check if constraint is satisfied"""
        if self.value is None:
            return True

        if isinstance(self.value, (int, float)) and isinstance(actual_value, (int, float)):
            # Numeric constraint - assume less than or equal
            return actual_value <= self.value

        return actual_value == self.value

    def is_critical(self) -> bool:
        """Check if constraint is critical"""
        return self.constraint_type.must_satisfy


@dataclass
class Assumption:
    """Explicit assumption in reasoning"""
    assumption_id: str
    statement: str
    basis: str
    confidence: int  # 1-10
    status: AssumptionStatus = AssumptionStatus.STATED
    impact_if_wrong: str = ""
    dependencies: List[str] = field(default_factory=list)
    validated_by: Optional[str] = None
    validated_at: Optional[datetime] = None

    def get_confidence_level(self) -> ConfidenceLevel:
        """Convert numeric confidence to level"""
        if self.confidence <= 2:
            return ConfidenceLevel.VERY_LOW
        elif self.confidence <= 4:
            return ConfidenceLevel.LOW
        elif self.confidence <= 6:
            return ConfidenceLevel.MEDIUM
        elif self.confidence <= 8:
            return ConfidenceLevel.HIGH
        else:
            return ConfidenceLevel.VERY_HIGH

    def validate(self, validated_by: str) -> None:
        """Mark assumption as validated"""
        self.status = AssumptionStatus.VALIDATED
        self.validated_by = validated_by
        self.validated_at = datetime.now()

    def invalidate(self) -> None:
        """Mark assumption as invalidated"""
        self.status = AssumptionStatus.INVALIDATED


@dataclass
class Option:
    """Decision option under analysis"""
    option_id: str
    name: str
    description: str
    pros: List[str] = field(default_factory=list)
    cons: List[str] = field(default_factory=list)
    constraints_met: Dict[str, bool] = field(default_factory=dict)
    feasibility_score: int = 0  # 0-100
    impact_score: int = 0  # 0-100
    status: OptionStatus = OptionStatus.PROPOSED
    rationale: str = ""

    def calculate_score(self) -> int:
        """Calculate overall option score"""
        if not self.constraints_met:
            return 0

        # Check critical constraints
        critical_met = all(self.constraints_met.values())
        if not critical_met:
            return 0

        # Combine feasibility and impact
        return (self.feasibility_score + self.impact_score) // 2

    def is_viable(self) -> bool:
        """Check if option is viable"""
        return self.status not in [OptionStatus.INFEASIBLE, OptionStatus.REJECTED]

    def add_pro(self, pro: str) -> None:
        """Add advantage"""
        self.pros.append(pro)

    def add_con(self, con: str) -> None:
        """Add disadvantage"""
        self.cons.append(con)


@dataclass
class Tradeoff:
    """Tradeoff analysis between factors"""
    tradeoff_id: str
    tradeoff_type: TradeoffType
    option_a: str
    option_b: str
    factor_a_impact: str
    factor_b_impact: str
    resolution: str = ""
    chosen_priority: Optional[str] = None

    def describe(self) -> str:
        """Describe the tradeoff"""
        return (
            f"Trading {self.tradeoff_type.primary_factor} "
            f"for {self.tradeoff_type.secondary_factor}: "
            f"{self.option_a} vs {self.option_b}"
        )


@dataclass
class Evidence:
    """Evidence supporting a decision"""
    evidence_id: str
    evidence_type: EvidenceType
    description: str
    source: str
    supports: str  # What it supports
    strength: float = 0.0  # 0-1

    def __post_init__(self):
        if self.strength == 0.0:
            self.strength = self.evidence_type.weight

    def weighted_strength(self) -> float:
        """Get weighted evidence strength"""
        return self.strength * self.evidence_type.weight


@dataclass
class Uncertainty:
    """Documented uncertainty"""
    uncertainty_id: str
    uncertainty_type: UncertaintyType
    description: str
    magnitude: str  # low, medium, high
    impact_on_decision: str
    mitigation: Optional[str] = None

    def can_reduce(self) -> bool:
        """Check if uncertainty can be reduced"""
        return self.uncertainty_type.reducible

    def get_mitigation_strategy(self) -> str:
        """Get recommended mitigation"""
        if self.mitigation:
            return self.mitigation
        return self.uncertainty_type.mitigation_strategy


@dataclass
class Risk:
    """Identified risk"""
    risk_id: str
    category: RiskCategory
    description: str
    probability: str  # low, medium, high
    impact: str  # low, medium, high
    mitigation: str = ""

    def get_risk_score(self) -> int:
        """Calculate risk score"""
        prob_scores = {"low": 1, "medium": 2, "high": 3}
        impact_scores = {"low": 1, "medium": 2, "high": 3}

        return prob_scores.get(self.probability, 2) * impact_scores.get(self.impact, 2)

    def is_high_risk(self) -> bool:
        """Check if high risk"""
        return self.get_risk_score() >= 6


@dataclass
class Recommendation:
    """Final recommendation"""
    recommendation_id: str
    problem_id: str
    recommended_option: str
    outcome: DecisionOutcome
    rationale: str
    confidence: ConfidenceLevel
    confidence_score: int  # 0-100
    evidence_ids: List[str] = field(default_factory=list)
    conditions: List[str] = field(default_factory=list)
    uncertainties: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    def requires_review(self) -> bool:
        """Check if human review required"""
        return self.confidence.requires_review

    def is_actionable(self) -> bool:
        """Check if recommendation is actionable"""
        return self.outcome.requires_action


# ════════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - Business Logic Implementation
# ════════════════════════════════════════════════════════════════════════════════

class ProblemFramerEngine:
    """Frames problems for structured analysis"""

    # Problem complexity factors
    COMPLEXITY_FACTORS = {
        "scope_items": {"weight": 2, "threshold": 5},
        "constraints": {"weight": 3, "threshold": 3},
        "stakeholders": {"weight": 2, "threshold": 3},
        "unknowns": {"weight": 4, "threshold": 2}
    }

    def __init__(self):
        self.problems: Dict[str, ProblemStatement] = {}

    def create_problem(self, title: str, description: str,
                       context: str, **kwargs) -> ProblemStatement:
        """Create structured problem statement"""
        problem_id = hashlib.sha256(
            f"prob:{title}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        problem = ProblemStatement(
            problem_id=problem_id,
            title=title,
            description=description,
            context=context,
            scope_in=kwargs.get("scope_in", []),
            scope_out=kwargs.get("scope_out", []),
            success_criteria=kwargs.get("success_criteria", []),
            time_bound=kwargs.get("time_bound")
        )

        self.problems[problem_id] = problem
        return problem

    def assess_complexity(self, problem: ProblemStatement) -> Dict[str, Any]:
        """Assess problem complexity"""
        score = 0
        factors = {}

        # Scope complexity
        scope_count = len(problem.scope_in) + len(problem.scope_out)
        factor = self.COMPLEXITY_FACTORS["scope_items"]
        if scope_count > factor["threshold"]:
            score += factor["weight"] * (scope_count - factor["threshold"])
        factors["scope"] = scope_count

        # Criteria complexity
        criteria_count = len(problem.success_criteria)
        factors["criteria"] = criteria_count
        score += criteria_count

        # Time pressure
        if problem.time_bound and problem.time_bound < timedelta(days=7):
            score += 5
            factors["time_pressure"] = "high"
        else:
            factors["time_pressure"] = "normal"

        complexity = "low" if score < 10 else "medium" if score < 20 else "high"

        return {
            "score": score,
            "level": complexity,
            "factors": factors
        }

    def validate_problem(self, problem_id: str) -> List[str]:
        """Validate problem definition"""
        problem = self.problems.get(problem_id)
        if not problem:
            return ["Problem not found"]

        issues = []

        if not problem.title:
            issues.append("Missing problem title")
        if not problem.description:
            issues.append("Missing problem description")
        if not problem.scope_in:
            issues.append("No items defined as in-scope")
        if not problem.success_criteria:
            issues.append("No success criteria defined")

        return issues


class AssumptionEngine:
    """Manages assumptions in reasoning"""

    def __init__(self):
        self.assumptions: Dict[str, Assumption] = {}

    def declare_assumption(self, statement: str, basis: str,
                           confidence: int, **kwargs) -> Assumption:
        """Declare an explicit assumption"""
        assumption_id = hashlib.sha256(
            f"assume:{statement[:20]}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        assumption = Assumption(
            assumption_id=assumption_id,
            statement=statement,
            basis=basis,
            confidence=min(10, max(1, confidence)),
            impact_if_wrong=kwargs.get("impact_if_wrong", ""),
            dependencies=kwargs.get("dependencies", [])
        )

        self.assumptions[assumption_id] = assumption
        return assumption

    def get_critical_assumptions(self) -> List[Assumption]:
        """Get assumptions that significantly affect reasoning"""
        return [
            a for a in self.assumptions.values()
            if a.confidence <= 5 or a.status == AssumptionStatus.UNCERTAIN
        ]

    def calculate_assumption_impact(self) -> float:
        """Calculate combined impact of assumptions on confidence"""
        if not self.assumptions:
            return 1.0

        factors = [a.status.affects_confidence for a in self.assumptions.values()]

        # Geometric mean of factors
        product = 1.0
        for f in factors:
            product *= f

        return product ** (1 / len(factors))

    def validate_assumption(self, assumption_id: str,
                            validated_by: str) -> bool:
        """Validate an assumption"""
        assumption = self.assumptions.get(assumption_id)
        if not assumption:
            return False

        assumption.validate(validated_by)
        return True


class OptionAnalyzerEngine:
    """Analyzes decision options"""

    def __init__(self):
        self.options: Dict[str, Option] = {}
        self.tradeoffs: Dict[str, Tradeoff] = {}

    def create_option(self, name: str, description: str,
                      **kwargs) -> Option:
        """Create option for analysis"""
        option_id = hashlib.sha256(
            f"opt:{name}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        option = Option(
            option_id=option_id,
            name=name,
            description=description,
            pros=kwargs.get("pros", []),
            cons=kwargs.get("cons", [])
        )

        self.options[option_id] = option
        return option

    def evaluate_against_constraints(self, option_id: str,
                                      constraints: List[Constraint],
                                      values: Dict[str, Any]) -> Dict[str, bool]:
        """Evaluate option against constraints"""
        option = self.options.get(option_id)
        if not option:
            return {}

        results = {}
        for constraint in constraints:
            actual = values.get(constraint.constraint_id)
            met = constraint.check(actual) if actual is not None else False
            results[constraint.constraint_id] = met
            constraint.status = "met" if met else "unmet"

        option.constraints_met = results
        return results

    def analyze_tradeoff(self, option_a_id: str, option_b_id: str,
                         tradeoff_type: TradeoffType) -> Tradeoff:
        """Analyze tradeoff between two options"""
        option_a = self.options.get(option_a_id)
        option_b = self.options.get(option_b_id)

        if not option_a or not option_b:
            raise ValueError("Options not found")

        tradeoff_id = hashlib.sha256(
            f"trade:{option_a_id}:{option_b_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        tradeoff = Tradeoff(
            tradeoff_id=tradeoff_id,
            tradeoff_type=tradeoff_type,
            option_a=option_a.name,
            option_b=option_b.name,
            factor_a_impact=f"{option_a.name} scores {option_a.calculate_score()}",
            factor_b_impact=f"{option_b.name} scores {option_b.calculate_score()}"
        )

        self.tradeoffs[tradeoff_id] = tradeoff
        return tradeoff

    def rank_options(self) -> List[Tuple[str, int]]:
        """Rank all viable options by score"""
        viable = [o for o in self.options.values() if o.is_viable()]
        ranked = [(o.option_id, o.calculate_score()) for o in viable]
        ranked.sort(key=lambda x: x[1], reverse=True)
        return ranked

    def get_recommended_option(self) -> Optional[Option]:
        """Get top-ranked option"""
        ranked = self.rank_options()
        if not ranked:
            return None

        top_id = ranked[0][0]
        option = self.options[top_id]
        option.status = OptionStatus.RECOMMENDED
        return option


class DecisionJustifierEngine:
    """Justifies and documents decisions"""

    def __init__(self):
        self.evidence: Dict[str, Evidence] = {}
        self.recommendations: Dict[str, Recommendation] = {}

    def add_evidence(self, evidence_type: EvidenceType,
                     description: str, source: str,
                     supports: str) -> Evidence:
        """Add supporting evidence"""
        evidence_id = hashlib.sha256(
            f"evid:{description[:20]}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        evidence = Evidence(
            evidence_id=evidence_id,
            evidence_type=evidence_type,
            description=description,
            source=source,
            supports=supports
        )

        self.evidence[evidence_id] = evidence
        return evidence

    def calculate_confidence(self, evidence_ids: List[str],
                              assumption_factor: float) -> Tuple[ConfidenceLevel, int]:
        """Calculate confidence based on evidence"""
        if not evidence_ids:
            return ConfidenceLevel.VERY_LOW, 10

        # Calculate weighted evidence strength
        total_weight = 0
        weighted_sum = 0

        for eid in evidence_ids:
            evidence = self.evidence.get(eid)
            if evidence:
                weight = evidence.evidence_type.weight
                total_weight += weight
                weighted_sum += evidence.weighted_strength() * 100

        if total_weight == 0:
            base_score = 20
        else:
            base_score = weighted_sum / total_weight

        # Apply assumption factor
        final_score = int(base_score * assumption_factor)
        final_score = min(100, max(0, final_score))

        # Determine level
        if final_score <= 20:
            level = ConfidenceLevel.VERY_LOW
        elif final_score <= 40:
            level = ConfidenceLevel.LOW
        elif final_score <= 60:
            level = ConfidenceLevel.MEDIUM
        elif final_score <= 80:
            level = ConfidenceLevel.HIGH
        else:
            level = ConfidenceLevel.VERY_HIGH

        return level, final_score

    def create_recommendation(self, problem_id: str,
                               option: Option,
                               evidence_ids: List[str],
                               assumption_factor: float,
                               rationale: str,
                               conditions: List[str] = None,
                               uncertainties: List[str] = None) -> Recommendation:
        """Create final recommendation"""
        recommendation_id = hashlib.sha256(
            f"rec:{problem_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        confidence_level, confidence_score = self.calculate_confidence(
            evidence_ids, assumption_factor
        )

        # Determine outcome
        if confidence_score >= 60 and option.calculate_score() >= 50:
            if conditions:
                outcome = DecisionOutcome.PROCEED_WITH_CONDITIONS
            else:
                outcome = DecisionOutcome.PROCEED
        elif confidence_score >= 40:
            outcome = DecisionOutcome.DEFER
        else:
            outcome = DecisionOutcome.ESCALATE

        recommendation = Recommendation(
            recommendation_id=recommendation_id,
            problem_id=problem_id,
            recommended_option=option.name,
            outcome=outcome,
            rationale=rationale,
            confidence=confidence_level,
            confidence_score=confidence_score,
            evidence_ids=evidence_ids,
            conditions=conditions or [],
            uncertainties=uncertainties or []
        )

        self.recommendations[recommendation_id] = recommendation
        return recommendation


class BoundedReasoningEngine:
    """Main orchestrator for bounded reasoning"""

    def __init__(self):
        self.framer = ProblemFramerEngine()
        self.assumption_engine = AssumptionEngine()
        self.analyzer = OptionAnalyzerEngine()
        self.justifier = DecisionJustifierEngine()
        self.constraints: Dict[str, Constraint] = {}
        self.uncertainties: Dict[str, Uncertainty] = {}
        self.risks: Dict[str, Risk] = {}
        self.current_phase: ReasoningPhase = ReasoningPhase.FRAMING

    def add_constraint(self, name: str, description: str,
                       constraint_type: ConstraintType,
                       value: Any = None, unit: str = None) -> Constraint:
        """Add reasoning constraint"""
        constraint_id = hashlib.sha256(
            f"const:{name}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        constraint = Constraint(
            constraint_id=constraint_id,
            name=name,
            description=description,
            constraint_type=constraint_type,
            value=value,
            unit=unit
        )

        self.constraints[constraint_id] = constraint
        return constraint

    def add_uncertainty(self, uncertainty_type: UncertaintyType,
                        description: str, magnitude: str,
                        impact: str) -> Uncertainty:
        """Document uncertainty"""
        uncertainty_id = hashlib.sha256(
            f"uncert:{description[:20]}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        uncertainty = Uncertainty(
            uncertainty_id=uncertainty_id,
            uncertainty_type=uncertainty_type,
            description=description,
            magnitude=magnitude,
            impact_on_decision=impact
        )

        self.uncertainties[uncertainty_id] = uncertainty
        return uncertainty

    def add_risk(self, category: RiskCategory, description: str,
                 probability: str, impact: str, mitigation: str = "") -> Risk:
        """Document risk"""
        risk_id = hashlib.sha256(
            f"risk:{description[:20]}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        risk = Risk(
            risk_id=risk_id,
            category=category,
            description=description,
            probability=probability,
            impact=impact,
            mitigation=mitigation
        )

        self.risks[risk_id] = risk
        return risk

    def advance_phase(self) -> ReasoningPhase:
        """Advance to next reasoning phase"""
        current_order = self.current_phase.order

        for phase in ReasoningPhase:
            if phase.order == current_order + 1:
                self.current_phase = phase
                return phase

        return self.current_phase

    def generate_decision_brief(self, problem_id: str) -> Dict[str, Any]:
        """Generate complete decision brief"""
        problem = self.framer.problems.get(problem_id)
        if not problem:
            return {"error": "Problem not found"}

        # Get assumptions
        assumptions = list(self.assumption_engine.assumptions.values())
        assumption_factor = self.assumption_engine.calculate_assumption_impact()

        # Get options and recommendation
        ranked_options = self.analyzer.rank_options()
        recommended = self.analyzer.get_recommended_option()

        # Get constraints status
        constraints_met = sum(
            1 for c in self.constraints.values()
            if c.status == "met"
        )

        # Get high risks
        high_risks = [r for r in self.risks.values() if r.is_high_risk()]

        return {
            "problem": {
                "id": problem_id,
                "title": problem.title,
                "scope": problem.get_scope_summary(),
                "well_defined": problem.is_well_defined()
            },
            "constraints": {
                "total": len(self.constraints),
                "met": constraints_met,
                "all_satisfied": constraints_met == len(self.constraints)
            },
            "assumptions": {
                "total": len(assumptions),
                "critical": len(self.assumption_engine.get_critical_assumptions()),
                "impact_factor": assumption_factor
            },
            "options": {
                "total": len(self.analyzer.options),
                "ranked": ranked_options[:3],
                "recommended": recommended.name if recommended else None
            },
            "risks": {
                "total": len(self.risks),
                "high": len(high_risks)
            },
            "uncertainties": {
                "total": len(self.uncertainties),
                "reducible": len([u for u in self.uncertainties.values() if u.can_reduce()])
            },
            "phase": self.current_phase.value,
            "generated_at": datetime.now().isoformat()
        }


# ════════════════════════════════════════════════════════════════════════════════
# REPORTER - ASCII Visualizations
# ════════════════════════════════════════════════════════════════════════════════

class ReasoningReporter:
    """ASCII report generator for bounded reasoning"""

    CONFIDENCE_BARS = {
        10: "█░░░░░░░░░",
        20: "██░░░░░░░░",
        30: "███░░░░░░░",
        40: "████░░░░░░",
        50: "█████░░░░░",
        60: "██████░░░░",
        70: "███████░░░",
        80: "████████░░",
        90: "█████████░",
        100: "██████████"
    }

    def __init__(self, engine: BoundedReasoningEngine):
        self.engine = engine

    def _get_bar(self, value: int) -> str:
        """Get progress bar for value"""
        rounded = (value // 10) * 10
        return self.CONFIDENCE_BARS.get(rounded, "░░░░░░░░░░")

    def generate_problem_frame(self, problem_id: str) -> str:
        """Generate problem framing section"""
        problem = self.engine.framer.problems.get(problem_id)
        if not problem:
            return "Problem not found"

        lines = [
            "PROBLEM STATEMENT",
            "─" * 40,
            "",
            "┌" + "─" * 48 + "┐",
            "│       FRAMING                                   │",
            "│                                                  │",
            f"│  Problem:                                        │",
            f"│  {problem.title[:42]:42}  │",
            "│                                                  │",
            "│  Scope:                                          │",
            f"│  • In Scope: {len(problem.scope_in)} items                           │",
            f"│  • Out of Scope: {len(problem.scope_out)} items                       │",
            "│                                                  │",
            "│  Success Criteria:                               │"
        ]

        for criterion in problem.success_criteria[:3]:
            lines.append(f"│  • {criterion[:42]:42}  │")

        time_str = str(problem.time_bound) if problem.time_bound else "Not set"
        lines.extend([
            "│                                                  │",
            f"│  Time Bound: {time_str[:33]:33}  │",
            "└" + "─" * 48 + "┘"
        ])

        return "\n".join(lines)

    def generate_constraints_table(self) -> str:
        """Generate constraints status table"""
        lines = [
            "CONSTRAINTS",
            "─" * 40,
            "",
            "│ Constraint       │ Type │ Status │",
            "├──────────────────┼──────┼────────┤"
        ]

        for constraint in self.engine.constraints.values():
            icon = "●" if constraint.status == "met" else "○"
            type_short = constraint.constraint_type.value[:4]
            lines.append(
                f"│ {constraint.name[:16]:16} │ {type_short:4} │   {icon}    │"
            )

        total = len(self.engine.constraints)
        met = sum(1 for c in self.engine.constraints.values() if c.status == "met")
        lines.append(f"\nAll constraints: {'SATISFIED' if met == total else 'VIOLATED'}")

        return "\n".join(lines)

    def generate_assumptions_section(self) -> str:
        """Generate assumptions section"""
        lines = [
            "EXPLICIT ASSUMPTIONS",
            "─" * 40,
            "",
            "┌" + "─" * 48 + "┐",
            "│  Assumptions Made:                               │",
            "│                                                  │"
        ]

        for i, assumption in enumerate(self.engine.assumption_engine.assumptions.values(), 1):
            conf_bar = self._get_bar(assumption.confidence * 10)
            lines.extend([
                f"│  {i}. {assumption.statement[:40]:40}  │",
                f"│     Confidence: {conf_bar} {assumption.confidence}/10   │",
                f"│     If wrong: {assumption.impact_if_wrong[:30]:30}  │",
                "│                                                  │"
            ])

        lines.append("└" + "─" * 48 + "┘")

        return "\n".join(lines)

    def generate_options_analysis(self) -> str:
        """Generate options analysis table"""
        lines = [
            "OPTIONS ANALYSIS",
            "─" * 40,
            "",
            "│ Option           │ Pros │ Cons │ Score │",
            "├──────────────────┼──────┼──────┼───────┤"
        ]

        for option in self.engine.analyzer.options.values():
            score = option.calculate_score()
            lines.append(
                f"│ {option.name[:16]:16} │  {len(option.pros):2}  │  {len(option.cons):2}  │  {score:3}  │"
            )

        return "\n".join(lines)

    def generate_recommendation(self, recommendation: Recommendation) -> str:
        """Generate recommendation section"""
        conf_bar = self._get_bar(recommendation.confidence_score)

        lines = [
            "RECOMMENDATION",
            "─" * 40,
            "",
            "┌" + "─" * 48 + "┐",
            "│       FINAL DECISION                             │",
            "│                                                  │",
            f"│  Recommended: {recommendation.recommended_option[:32]:32}  │",
            "│                                                  │",
            "│  Rationale:                                      │",
            f"│  {recommendation.rationale[:44]:44}  │",
            "│                                                  │",
            f"│  Confidence: {conf_bar} {recommendation.confidence_score}/100  │",
            "│                                                  │",
            "│  Key Evidence:                                   │"
        ]

        for eid in recommendation.evidence_ids[:2]:
            evidence = self.engine.justifier.evidence.get(eid)
            if evidence:
                lines.append(f"│  • {evidence.description[:42]:42}  │")

        if recommendation.uncertainties:
            lines.extend([
                "│                                                  │",
                "│  Uncertainties:                                  │"
            ])
            for u in recommendation.uncertainties[:2]:
                lines.append(f"│  • {u[:42]:42}  │")

        lines.append("└" + "─" * 48 + "┘")

        return "\n".join(lines)

    def generate_full_brief(self, problem_id: str) -> str:
        """Generate complete decision brief"""
        problem = self.engine.framer.problems.get(problem_id)

        sections = [
            "BOUNDED DECISION BRIEF",
            "═" * 60,
            f"Decision: {problem.title if problem else 'Unknown'}",
            f"Bounds: {len(self.engine.constraints)} constraints",
            f"Date: {datetime.now().strftime('%Y-%m-%d')}",
            "═" * 60,
            ""
        ]

        if problem:
            sections.extend([
                self.generate_problem_frame(problem_id),
                "",
                self.generate_constraints_table(),
                "",
                self.generate_assumptions_section(),
                "",
                self.generate_options_analysis()
            ])

        return "\n".join(sections)


# ════════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════════

def create_cli():
    """Create command-line interface"""
    import argparse

    parser = argparse.ArgumentParser(
        description="BOUNDED.REASONING.OS.EXE - Structured Deliberation Engine"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Frame command
    frame_parser = subparsers.add_parser("frame", help="Frame a problem")
    frame_parser.add_argument("--title", required=True, help="Problem title")
    frame_parser.add_argument("--description", required=True, help="Problem description")

    # Assume command
    assume_parser = subparsers.add_parser("assume", help="Declare assumption")
    assume_parser.add_argument("--statement", required=True, help="Assumption statement")
    assume_parser.add_argument("--confidence", type=int, default=5, help="Confidence (1-10)")

    # Options command
    opt_parser = subparsers.add_parser("options", help="Analyze options")
    opt_parser.add_argument("--problem-id", help="Problem ID")

    # Constraints command
    const_parser = subparsers.add_parser("constraints", help="Check constraints")

    # Decide command
    decide_parser = subparsers.add_parser("decide", help="Generate recommendation")
    decide_parser.add_argument("--problem-id", required=True, help="Problem ID")

    return parser


def main():
    """Main entry point"""
    parser = create_cli()
    args = parser.parse_args()

    engine = BoundedReasoningEngine()
    reporter = ReasoningReporter(engine)

    if args.command == "frame":
        problem = engine.framer.create_problem(
            title=args.title,
            description=args.description,
            context=""
        )
        print(f"Problem created: {problem.problem_id}")
        print(reporter.generate_problem_frame(problem.problem_id))

    elif args.command == "assume":
        assumption = engine.assumption_engine.declare_assumption(
            statement=args.statement,
            basis="User stated",
            confidence=args.confidence
        )
        print(f"Assumption declared: {assumption.assumption_id}")
        print(reporter.generate_assumptions_section())

    elif args.command == "options":
        print(reporter.generate_options_analysis())

    elif args.command == "constraints":
        print(reporter.generate_constraints_table())

    elif args.command == "decide":
        print(reporter.generate_full_brief(args.problem_id))

    else:
        # Demo output
        problem = engine.framer.create_problem(
            title="Demo Decision",
            description="A sample decision problem",
            context="Demo context",
            scope_in=["Item 1", "Item 2"],
            success_criteria=["Criterion 1", "Criterion 2"]
        )
        print(reporter.generate_full_brief(problem.problem_id))


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/bounded-reasoning` - Full bounded deliberation
- `/bounded-reasoning frame` - Frame a problem
- `/bounded-reasoning options` - Option analysis
- `/bounded-reasoning constraints` - Constraint check
- `/bounded-reasoning assume` - Surface assumptions

$ARGUMENTS
