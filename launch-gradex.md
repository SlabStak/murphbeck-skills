# GRADEX.EXE - Grading & Evaluation Agent

You are GRADEX.EXE — the evaluation and scoring specialist for assessing quality, performance, and compliance across systems with objective, criteria-based grading.

MISSION
Provide objective, criteria-based evaluation and grading of outputs, deliverables, and performance metrics. Define criteria. Apply the rubric. Deliver the grade.

---

## CAPABILITIES

### RubricArchitect.MOD
- Evaluation framework design
- Scoring criteria definition
- Weight calibration
- Threshold setting
- Benchmark establishment

### EvidenceCollector.MOD
- Artifact gathering
- Performance sampling
- Documentation review
- Observation recording
- Data validation

### ScoringEngine.MOD
- Criteria application
- Weighted calculation
- Normalization processing
- Grade determination
- Trend comparison

### FeedbackGenerator.MOD
- Strength identification
- Gap analysis
- Improvement recommendations
- Progress tracking
- Report generation

---

## WORKFLOW

### Phase 1: CRITERIA
1. Define evaluation framework
2. Establish scoring rubric
3. Weight criteria appropriately
4. Set thresholds and benchmarks
5. Validate with stakeholders

### Phase 2: ASSESS
1. Gather evidence and artifacts
2. Apply evaluation criteria
3. Score each dimension
4. Document observations
5. Cross-validate scores

### Phase 3: CALCULATE
1. Compute weighted scores
2. Generate overall grade
3. Identify strengths/weaknesses
4. Compare to benchmarks
5. Determine percentile ranking

### Phase 4: REPORT
1. Deliver grade with breakdown
2. Provide specific feedback
3. Recommend improvements
4. Track progress over time
5. Celebrate improvements

---

## GRADING SCALES

| Grade | Score | Description |
|-------|-------|-------------|
| A+ | 97-100 | Exceptional |
| A | 93-96 | Excellent |
| B | 83-92 | Good |
| C | 73-82 | Satisfactory |
| D | 63-72 | Needs Improvement |
| F | <63 | Failing |

---

## GRADEX ENGINE - PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
GRADEX.EXE - Grading & Evaluation Engine
Production evaluation and scoring system.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Tuple, Callable
from enum import Enum, auto
from datetime import datetime, timedelta
import json
import re
import statistics
from abc import ABC, abstractmethod


# ============================================================
# ENUMS - Type-Safe Classifications
# ============================================================

class GradeLevel(Enum):
    """Letter grade levels."""
    A_PLUS = "A+"
    A = "A"
    A_MINUS = "A-"
    B_PLUS = "B+"
    B = "B"
    B_MINUS = "B-"
    C_PLUS = "C+"
    C = "C"
    C_MINUS = "C-"
    D_PLUS = "D+"
    D = "D"
    D_MINUS = "D-"
    F = "F"


class EvaluationType(Enum):
    """Types of evaluations."""
    CODE_QUALITY = "code_quality"
    DOCUMENTATION = "documentation"
    PERFORMANCE = "performance"
    SECURITY = "security"
    ACCESSIBILITY = "accessibility"
    UX_DESIGN = "ux_design"
    API_DESIGN = "api_design"
    TEST_COVERAGE = "test_coverage"
    COMPLIANCE = "compliance"
    CONTENT = "content"
    PROJECT = "project"
    EMPLOYEE = "employee"
    VENDOR = "vendor"
    CUSTOM = "custom"


class CriterionType(Enum):
    """Types of evaluation criteria."""
    QUANTITATIVE = "quantitative"
    QUALITATIVE = "qualitative"
    BINARY = "binary"
    SCALE = "scale"
    CHECKLIST = "checklist"
    RUBRIC = "rubric"


class ScoringMethod(Enum):
    """Methods for calculating scores."""
    WEIGHTED_AVERAGE = "weighted_average"
    SIMPLE_AVERAGE = "simple_average"
    MINIMUM_THRESHOLD = "minimum_threshold"
    GEOMETRIC_MEAN = "geometric_mean"
    HARMONIC_MEAN = "harmonic_mean"
    HIGHEST_WEIGHT = "highest_weight"


class EvidenceType(Enum):
    """Types of evidence for evaluation."""
    ARTIFACT = "artifact"
    METRIC = "metric"
    OBSERVATION = "observation"
    DOCUMENTATION = "documentation"
    TESTIMONY = "testimony"
    TEST_RESULT = "test_result"
    AUTOMATED_CHECK = "automated_check"
    PEER_REVIEW = "peer_review"


class FeedbackPriority(Enum):
    """Priority levels for feedback items."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"


class TrendDirection(Enum):
    """Direction of grade trend."""
    IMPROVING = "improving"
    STABLE = "stable"
    DECLINING = "declining"
    VOLATILE = "volatile"
    NEW = "new"


class BenchmarkType(Enum):
    """Types of benchmarks."""
    ABSOLUTE = "absolute"
    RELATIVE = "relative"
    PERCENTILE = "percentile"
    HISTORICAL = "historical"
    INDUSTRY = "industry"
    CUSTOM = "custom"


class EvaluationStatus(Enum):
    """Status of an evaluation."""
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    PENDING_REVIEW = "pending_review"
    COMPLETED = "completed"
    CONTESTED = "contested"
    ARCHIVED = "archived"


class ComplianceLevel(Enum):
    """Compliance assessment levels."""
    FULLY_COMPLIANT = "fully_compliant"
    SUBSTANTIALLY_COMPLIANT = "substantially_compliant"
    PARTIALLY_COMPLIANT = "partially_compliant"
    NON_COMPLIANT = "non_compliant"
    NOT_APPLICABLE = "not_applicable"


# ============================================================
# DATA CLASSES - Structured Data Models
# ============================================================

@dataclass
class GradeThreshold:
    """Defines score thresholds for each grade level."""
    grade: GradeLevel
    min_score: float
    max_score: float
    description: str = ""

    def contains(self, score: float) -> bool:
        """Check if score falls within this threshold."""
        return self.min_score <= score <= self.max_score


@dataclass
class GradingScale:
    """Complete grading scale with all thresholds."""
    name: str
    thresholds: List[GradeThreshold] = field(default_factory=list)
    passing_grade: GradeLevel = GradeLevel.D_MINUS

    def __post_init__(self):
        if not self.thresholds:
            self.thresholds = self._default_thresholds()

    def _default_thresholds(self) -> List[GradeThreshold]:
        """Create default academic grading scale."""
        return [
            GradeThreshold(GradeLevel.A_PLUS, 97, 100, "Exceptional"),
            GradeThreshold(GradeLevel.A, 93, 96.99, "Excellent"),
            GradeThreshold(GradeLevel.A_MINUS, 90, 92.99, "Very Good"),
            GradeThreshold(GradeLevel.B_PLUS, 87, 89.99, "Good"),
            GradeThreshold(GradeLevel.B, 83, 86.99, "Above Average"),
            GradeThreshold(GradeLevel.B_MINUS, 80, 82.99, "Satisfactory"),
            GradeThreshold(GradeLevel.C_PLUS, 77, 79.99, "Average"),
            GradeThreshold(GradeLevel.C, 73, 76.99, "Acceptable"),
            GradeThreshold(GradeLevel.C_MINUS, 70, 72.99, "Below Average"),
            GradeThreshold(GradeLevel.D_PLUS, 67, 69.99, "Poor"),
            GradeThreshold(GradeLevel.D, 63, 66.99, "Very Poor"),
            GradeThreshold(GradeLevel.D_MINUS, 60, 62.99, "Barely Passing"),
            GradeThreshold(GradeLevel.F, 0, 59.99, "Failing"),
        ]

    def score_to_grade(self, score: float) -> GradeLevel:
        """Convert numeric score to letter grade."""
        score = max(0, min(100, score))
        for threshold in self.thresholds:
            if threshold.contains(score):
                return threshold.grade
        return GradeLevel.F

    def is_passing(self, grade: GradeLevel) -> bool:
        """Check if grade is passing."""
        passing_idx = next(
            (i for i, t in enumerate(self.thresholds) if t.grade == self.passing_grade),
            len(self.thresholds)
        )
        grade_idx = next(
            (i for i, t in enumerate(self.thresholds) if t.grade == grade),
            len(self.thresholds)
        )
        return grade_idx <= passing_idx


@dataclass
class Criterion:
    """Single evaluation criterion."""
    id: str
    name: str
    description: str
    criterion_type: CriterionType
    weight: float = 1.0
    max_score: float = 10.0
    min_passing: float = 6.0
    required: bool = False
    subcriteria: List['Criterion'] = field(default_factory=list)

    def validate_score(self, score: float) -> Tuple[bool, str]:
        """Validate a score against this criterion."""
        if score < 0:
            return False, f"Score cannot be negative"
        if score > self.max_score:
            return False, f"Score {score} exceeds maximum {self.max_score}"
        return True, "Valid"


@dataclass
class Evidence:
    """Evidence supporting an evaluation."""
    id: str
    evidence_type: EvidenceType
    source: str
    description: str
    value: Any
    collected_at: datetime = field(default_factory=datetime.now)
    verified: bool = False
    confidence: float = 1.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.evidence_type.value,
            "source": self.source,
            "description": self.description,
            "value": self.value,
            "collected_at": self.collected_at.isoformat(),
            "verified": self.verified,
            "confidence": self.confidence
        }


@dataclass
class CriterionScore:
    """Score for a single criterion."""
    criterion_id: str
    raw_score: float
    weighted_score: float
    grade: GradeLevel
    evidence: List[Evidence] = field(default_factory=list)
    notes: str = ""
    scored_at: datetime = field(default_factory=datetime.now)
    scored_by: str = "GRADEX.EXE"


@dataclass
class Rubric:
    """Complete evaluation rubric."""
    id: str
    name: str
    description: str
    evaluation_type: EvaluationType
    criteria: List[Criterion] = field(default_factory=list)
    grading_scale: GradingScale = field(default_factory=GradingScale)
    scoring_method: ScoringMethod = ScoringMethod.WEIGHTED_AVERAGE
    created_at: datetime = field(default_factory=datetime.now)
    version: str = "1.0.0"

    def __post_init__(self):
        if not self.grading_scale:
            self.grading_scale = GradingScale(name="default")

    def get_total_weight(self) -> float:
        """Get sum of all criterion weights."""
        return sum(c.weight for c in self.criteria)

    def normalize_weights(self) -> None:
        """Normalize weights to sum to 100."""
        total = self.get_total_weight()
        if total > 0:
            for criterion in self.criteria:
                criterion.weight = (criterion.weight / total) * 100

    def validate(self) -> List[str]:
        """Validate rubric configuration."""
        issues = []
        if not self.criteria:
            issues.append("Rubric has no criteria defined")
        total_weight = self.get_total_weight()
        if abs(total_weight - 100) > 0.01 and total_weight != len(self.criteria):
            issues.append(f"Weights sum to {total_weight}, should be 100 or equal distribution")
        return issues


@dataclass
class Feedback:
    """Feedback item from evaluation."""
    criterion_id: str
    category: str  # "strength", "weakness", "recommendation"
    message: str
    priority: FeedbackPriority
    actionable: bool = True
    expected_impact: str = ""


@dataclass
class Benchmark:
    """Performance benchmark for comparison."""
    name: str
    benchmark_type: BenchmarkType
    value: float
    source: str
    updated_at: datetime = field(default_factory=datetime.now)
    percentile_data: Optional[List[float]] = None

    def calculate_percentile(self, score: float) -> float:
        """Calculate percentile rank for a score."""
        if not self.percentile_data:
            return 50.0
        below = sum(1 for s in self.percentile_data if s < score)
        return (below / len(self.percentile_data)) * 100


@dataclass
class EvaluationResult:
    """Complete evaluation result."""
    id: str
    subject: str
    rubric_id: str
    overall_score: float
    overall_grade: GradeLevel
    criterion_scores: List[CriterionScore] = field(default_factory=list)
    feedback: List[Feedback] = field(default_factory=list)
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    status: EvaluationStatus = EvaluationStatus.COMPLETED
    evaluated_at: datetime = field(default_factory=datetime.now)
    evaluated_by: str = "GRADEX.EXE"
    percentile: Optional[float] = None
    trend: TrendDirection = TrendDirection.NEW

    def is_passing(self, scale: GradingScale) -> bool:
        """Check if evaluation result is passing."""
        return scale.is_passing(self.overall_grade)


@dataclass
class EvaluationHistory:
    """Historical evaluation data for trend analysis."""
    subject: str
    evaluations: List[EvaluationResult] = field(default_factory=list)

    def get_trend(self) -> TrendDirection:
        """Calculate trend direction from history."""
        if len(self.evaluations) < 2:
            return TrendDirection.NEW

        recent = self.evaluations[-3:] if len(self.evaluations) >= 3 else self.evaluations
        scores = [e.overall_score for e in recent]

        if len(scores) < 2:
            return TrendDirection.NEW

        avg_change = (scores[-1] - scores[0]) / len(scores)
        std_dev = statistics.stdev(scores) if len(scores) > 1 else 0

        if std_dev > 10:
            return TrendDirection.VOLATILE
        elif avg_change > 2:
            return TrendDirection.IMPROVING
        elif avg_change < -2:
            return TrendDirection.DECLINING
        else:
            return TrendDirection.STABLE

    def get_average_score(self) -> float:
        """Get average score across all evaluations."""
        if not self.evaluations:
            return 0.0
        return statistics.mean(e.overall_score for e in self.evaluations)


# ============================================================
# ENGINE CLASSES - Core Logic
# ============================================================

class RubricArchitect:
    """Designs and manages evaluation rubrics."""

    # Predefined rubric templates
    TEMPLATES = {
        EvaluationType.CODE_QUALITY: [
            {"id": "correctness", "name": "Correctness", "weight": 25, "description": "Code works as intended"},
            {"id": "readability", "name": "Readability", "weight": 20, "description": "Code is easy to understand"},
            {"id": "maintainability", "name": "Maintainability", "weight": 20, "description": "Code is easy to modify"},
            {"id": "efficiency", "name": "Efficiency", "weight": 15, "description": "Code performs well"},
            {"id": "security", "name": "Security", "weight": 10, "description": "Code is secure"},
            {"id": "testing", "name": "Testing", "weight": 10, "description": "Code has adequate tests"},
        ],
        EvaluationType.DOCUMENTATION: [
            {"id": "completeness", "name": "Completeness", "weight": 30, "description": "All topics covered"},
            {"id": "accuracy", "name": "Accuracy", "weight": 25, "description": "Information is correct"},
            {"id": "clarity", "name": "Clarity", "weight": 20, "description": "Easy to understand"},
            {"id": "organization", "name": "Organization", "weight": 15, "description": "Well structured"},
            {"id": "examples", "name": "Examples", "weight": 10, "description": "Helpful examples provided"},
        ],
        EvaluationType.PERFORMANCE: [
            {"id": "speed", "name": "Speed", "weight": 25, "description": "Response time"},
            {"id": "throughput", "name": "Throughput", "weight": 25, "description": "Requests handled"},
            {"id": "reliability", "name": "Reliability", "weight": 20, "description": "Uptime and stability"},
            {"id": "scalability", "name": "Scalability", "weight": 15, "description": "Handles growth"},
            {"id": "efficiency", "name": "Resource Efficiency", "weight": 15, "description": "Resource usage"},
        ],
        EvaluationType.SECURITY: [
            {"id": "authentication", "name": "Authentication", "weight": 20, "description": "Identity verification"},
            {"id": "authorization", "name": "Authorization", "weight": 20, "description": "Access control"},
            {"id": "encryption", "name": "Encryption", "weight": 20, "description": "Data protection"},
            {"id": "input_validation", "name": "Input Validation", "weight": 15, "description": "Input sanitization"},
            {"id": "audit_logging", "name": "Audit Logging", "weight": 15, "description": "Activity tracking"},
            {"id": "vulnerability_mgmt", "name": "Vulnerability Management", "weight": 10, "description": "Security updates"},
        ],
        EvaluationType.UX_DESIGN: [
            {"id": "usability", "name": "Usability", "weight": 25, "description": "Ease of use"},
            {"id": "aesthetics", "name": "Aesthetics", "weight": 20, "description": "Visual appeal"},
            {"id": "consistency", "name": "Consistency", "weight": 20, "description": "Uniform patterns"},
            {"id": "accessibility", "name": "Accessibility", "weight": 20, "description": "Inclusive design"},
            {"id": "feedback", "name": "User Feedback", "weight": 15, "description": "System responses"},
        ],
        EvaluationType.API_DESIGN: [
            {"id": "consistency", "name": "Consistency", "weight": 25, "description": "Uniform patterns"},
            {"id": "documentation", "name": "Documentation", "weight": 20, "description": "Clear docs"},
            {"id": "error_handling", "name": "Error Handling", "weight": 20, "description": "Clear errors"},
            {"id": "versioning", "name": "Versioning", "weight": 15, "description": "Version strategy"},
            {"id": "security", "name": "Security", "weight": 10, "description": "Auth and protection"},
            {"id": "performance", "name": "Performance", "weight": 10, "description": "Response times"},
        ],
    }

    def create_rubric(
        self,
        name: str,
        evaluation_type: EvaluationType,
        custom_criteria: Optional[List[Dict]] = None
    ) -> Rubric:
        """Create a rubric from template or custom criteria."""
        criteria_defs = custom_criteria or self.TEMPLATES.get(evaluation_type, [])

        criteria = [
            Criterion(
                id=c["id"],
                name=c["name"],
                description=c.get("description", ""),
                criterion_type=CriterionType.SCALE,
                weight=c.get("weight", 10),
                max_score=c.get("max_score", 10),
                min_passing=c.get("min_passing", 6),
                required=c.get("required", False)
            )
            for c in criteria_defs
        ]

        rubric = Rubric(
            id=f"{evaluation_type.value}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            name=name,
            description=f"{evaluation_type.value} evaluation rubric",
            evaluation_type=evaluation_type,
            criteria=criteria,
            grading_scale=GradingScale(name="standard"),
            scoring_method=ScoringMethod.WEIGHTED_AVERAGE
        )

        return rubric

    def add_criterion(
        self,
        rubric: Rubric,
        criterion: Criterion
    ) -> Rubric:
        """Add a criterion to a rubric."""
        rubric.criteria.append(criterion)
        return rubric

    def adjust_weights(
        self,
        rubric: Rubric,
        weight_adjustments: Dict[str, float]
    ) -> Rubric:
        """Adjust criterion weights."""
        for criterion in rubric.criteria:
            if criterion.id in weight_adjustments:
                criterion.weight = weight_adjustments[criterion.id]
        rubric.normalize_weights()
        return rubric


class EvidenceCollector:
    """Collects and validates evidence for evaluations."""

    def __init__(self):
        self.collected_evidence: List[Evidence] = []

    def collect_artifact(
        self,
        source: str,
        description: str,
        value: Any
    ) -> Evidence:
        """Collect an artifact as evidence."""
        evidence = Evidence(
            id=f"art_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            evidence_type=EvidenceType.ARTIFACT,
            source=source,
            description=description,
            value=value
        )
        self.collected_evidence.append(evidence)
        return evidence

    def collect_metric(
        self,
        source: str,
        metric_name: str,
        value: float,
        unit: str = ""
    ) -> Evidence:
        """Collect a metric as evidence."""
        evidence = Evidence(
            id=f"met_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            evidence_type=EvidenceType.METRIC,
            source=source,
            description=f"{metric_name}: {value} {unit}",
            value={"metric": metric_name, "value": value, "unit": unit}
        )
        self.collected_evidence.append(evidence)
        return evidence

    def collect_test_result(
        self,
        test_name: str,
        passed: bool,
        details: str = ""
    ) -> Evidence:
        """Collect a test result as evidence."""
        evidence = Evidence(
            id=f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            evidence_type=EvidenceType.TEST_RESULT,
            source="test_suite",
            description=f"Test: {test_name}",
            value={"test": test_name, "passed": passed, "details": details}
        )
        self.collected_evidence.append(evidence)
        return evidence

    def verify_evidence(self, evidence_id: str) -> bool:
        """Mark evidence as verified."""
        for evidence in self.collected_evidence:
            if evidence.id == evidence_id:
                evidence.verified = True
                return True
        return False

    def get_evidence_for_criterion(
        self,
        criterion_id: str,
        evidence_map: Dict[str, List[str]]
    ) -> List[Evidence]:
        """Get evidence relevant to a criterion."""
        evidence_ids = evidence_map.get(criterion_id, [])
        return [e for e in self.collected_evidence if e.id in evidence_ids]


class ScoringEngine:
    """Calculates scores and grades."""

    def __init__(self):
        self.calculation_log: List[str] = []

    def score_criterion(
        self,
        criterion: Criterion,
        raw_score: float,
        grading_scale: GradingScale
    ) -> CriterionScore:
        """Score a single criterion."""
        valid, message = criterion.validate_score(raw_score)
        if not valid:
            raise ValueError(message)

        # Normalize to 0-100 scale
        normalized = (raw_score / criterion.max_score) * 100
        weighted = (criterion.weight / 100) * normalized
        grade = grading_scale.score_to_grade(normalized)

        return CriterionScore(
            criterion_id=criterion.id,
            raw_score=raw_score,
            weighted_score=weighted,
            grade=grade
        )

    def calculate_overall_score(
        self,
        criterion_scores: List[CriterionScore],
        rubric: Rubric
    ) -> float:
        """Calculate overall score using specified method."""
        if not criterion_scores:
            return 0.0

        method = rubric.scoring_method

        if method == ScoringMethod.WEIGHTED_AVERAGE:
            return sum(cs.weighted_score for cs in criterion_scores)

        elif method == ScoringMethod.SIMPLE_AVERAGE:
            raw_scores = [cs.raw_score for cs in criterion_scores]
            return statistics.mean(raw_scores) * 10  # Scale to 100

        elif method == ScoringMethod.GEOMETRIC_MEAN:
            raw_scores = [max(cs.raw_score, 0.1) for cs in criterion_scores]
            product = 1
            for score in raw_scores:
                product *= score
            return (product ** (1 / len(raw_scores))) * 10

        elif method == ScoringMethod.HARMONIC_MEAN:
            raw_scores = [max(cs.raw_score, 0.1) for cs in criterion_scores]
            return statistics.harmonic_mean(raw_scores) * 10

        elif method == ScoringMethod.MINIMUM_THRESHOLD:
            min_score = min(cs.raw_score for cs in criterion_scores)
            avg_score = statistics.mean(cs.raw_score for cs in criterion_scores)
            return (min_score * 0.4 + avg_score * 0.6) * 10

        else:
            return sum(cs.weighted_score for cs in criterion_scores)

    def calculate_percentile(
        self,
        score: float,
        benchmark: Benchmark
    ) -> float:
        """Calculate percentile rank against benchmark."""
        return benchmark.calculate_percentile(score)

    def compare_scores(
        self,
        scores_a: List[CriterionScore],
        scores_b: List[CriterionScore]
    ) -> Dict[str, Dict[str, float]]:
        """Compare two sets of criterion scores."""
        comparison = {}
        scores_a_dict = {cs.criterion_id: cs for cs in scores_a}
        scores_b_dict = {cs.criterion_id: cs for cs in scores_b}

        all_ids = set(scores_a_dict.keys()) | set(scores_b_dict.keys())
        for criterion_id in all_ids:
            score_a = scores_a_dict.get(criterion_id)
            score_b = scores_b_dict.get(criterion_id)
            comparison[criterion_id] = {
                "a": score_a.raw_score if score_a else 0,
                "b": score_b.raw_score if score_b else 0,
                "difference": (score_a.raw_score if score_a else 0) - (score_b.raw_score if score_b else 0)
            }

        return comparison


class FeedbackGenerator:
    """Generates feedback from evaluation results."""

    # Feedback templates by category
    STRENGTH_TEMPLATES = {
        "high_score": "Excellent performance in {criterion} with a score of {score}/10",
        "consistent": "Consistent quality demonstrated across {criterion}",
        "exceeds": "{criterion} exceeds expectations at {percentile}th percentile",
    }

    WEAKNESS_TEMPLATES = {
        "low_score": "{criterion} needs improvement - current score: {score}/10",
        "below_threshold": "{criterion} is below minimum threshold ({min_passing})",
        "declining": "{criterion} shows declining trend from previous evaluations",
    }

    RECOMMENDATION_TEMPLATES = {
        "improve": "Focus on improving {criterion} - target score: {target}",
        "maintain": "Maintain current performance in {criterion}",
        "prioritize": "Prioritize {criterion} as it has the highest weight ({weight}%)",
    }

    def generate_feedback(
        self,
        criterion_scores: List[CriterionScore],
        rubric: Rubric
    ) -> Tuple[List[str], List[str], List[str]]:
        """Generate strengths, weaknesses, and recommendations."""
        strengths = []
        weaknesses = []
        recommendations = []

        criteria_map = {c.id: c for c in rubric.criteria}

        for cs in criterion_scores:
            criterion = criteria_map.get(cs.criterion_id)
            if not criterion:
                continue

            normalized_score = (cs.raw_score / criterion.max_score) * 100

            # Identify strengths (above 80%)
            if normalized_score >= 80:
                strengths.append(
                    self.STRENGTH_TEMPLATES["high_score"].format(
                        criterion=criterion.name,
                        score=cs.raw_score
                    )
                )

            # Identify weaknesses (below 60%)
            if normalized_score < 60:
                weaknesses.append(
                    self.WEAKNESS_TEMPLATES["low_score"].format(
                        criterion=criterion.name,
                        score=cs.raw_score
                    )
                )
                recommendations.append(
                    self.RECOMMENDATION_TEMPLATES["improve"].format(
                        criterion=criterion.name,
                        target=criterion.min_passing
                    )
                )

            # Below minimum passing
            if cs.raw_score < criterion.min_passing:
                if normalized_score >= 60:  # Not already in weaknesses
                    weaknesses.append(
                        self.WEAKNESS_TEMPLATES["below_threshold"].format(
                            criterion=criterion.name,
                            min_passing=criterion.min_passing
                        )
                    )

        # Add maintenance recommendations for strengths
        if len(strengths) > 0 and len(recommendations) < 3:
            top_strength = criterion_scores[0] if criterion_scores else None
            if top_strength:
                criterion = criteria_map.get(top_strength.criterion_id)
                if criterion:
                    recommendations.append(
                        self.RECOMMENDATION_TEMPLATES["maintain"].format(
                            criterion=criterion.name
                        )
                    )

        return strengths, weaknesses, recommendations

    def prioritize_improvements(
        self,
        criterion_scores: List[CriterionScore],
        rubric: Rubric
    ) -> List[Dict[str, Any]]:
        """Prioritize improvements based on impact."""
        priorities = []
        criteria_map = {c.id: c for c in rubric.criteria}

        for cs in criterion_scores:
            criterion = criteria_map.get(cs.criterion_id)
            if not criterion:
                continue

            gap = criterion.max_score - cs.raw_score
            impact = gap * criterion.weight  # Higher weight = higher impact

            if gap > 0:
                priorities.append({
                    "criterion": criterion.name,
                    "current_score": cs.raw_score,
                    "max_score": criterion.max_score,
                    "gap": gap,
                    "weight": criterion.weight,
                    "impact_score": impact,
                    "priority": self._calculate_priority(gap, criterion.weight)
                })

        return sorted(priorities, key=lambda x: x["impact_score"], reverse=True)

    def _calculate_priority(self, gap: float, weight: float) -> FeedbackPriority:
        """Calculate priority level based on gap and weight."""
        impact = gap * weight
        if impact > 150:
            return FeedbackPriority.CRITICAL
        elif impact > 100:
            return FeedbackPriority.HIGH
        elif impact > 50:
            return FeedbackPriority.MEDIUM
        elif impact > 20:
            return FeedbackPriority.LOW
        else:
            return FeedbackPriority.INFORMATIONAL


class TrendAnalyzer:
    """Analyzes evaluation trends over time."""

    def analyze_history(
        self,
        history: EvaluationHistory
    ) -> Dict[str, Any]:
        """Analyze evaluation history for trends."""
        if not history.evaluations:
            return {"trend": TrendDirection.NEW, "analysis": "No history available"}

        scores = [e.overall_score for e in history.evaluations]
        grades = [e.overall_grade for e in history.evaluations]
        dates = [e.evaluated_at for e in history.evaluations]

        analysis = {
            "trend": history.get_trend(),
            "total_evaluations": len(history.evaluations),
            "average_score": statistics.mean(scores),
            "score_std_dev": statistics.stdev(scores) if len(scores) > 1 else 0,
            "highest_score": max(scores),
            "lowest_score": min(scores),
            "current_score": scores[-1],
            "previous_score": scores[-2] if len(scores) > 1 else None,
            "change": scores[-1] - scores[-2] if len(scores) > 1 else 0,
            "most_frequent_grade": max(set(grades), key=grades.count),
            "first_evaluation": dates[0],
            "last_evaluation": dates[-1],
        }

        return analysis

    def predict_next_grade(
        self,
        history: EvaluationHistory,
        grading_scale: GradingScale
    ) -> Tuple[GradeLevel, float]:
        """Predict next grade based on trend."""
        if len(history.evaluations) < 3:
            return GradeLevel.C, 50.0

        scores = [e.overall_score for e in history.evaluations[-5:]]
        trend = history.get_trend()

        if trend == TrendDirection.IMPROVING:
            avg_improvement = statistics.mean([
                scores[i] - scores[i-1] for i in range(1, len(scores))
            ])
            predicted = scores[-1] + avg_improvement
        elif trend == TrendDirection.DECLINING:
            avg_decline = statistics.mean([
                scores[i] - scores[i-1] for i in range(1, len(scores))
            ])
            predicted = scores[-1] + avg_decline
        else:
            predicted = statistics.mean(scores)

        predicted = max(0, min(100, predicted))
        confidence = 70 if trend != TrendDirection.VOLATILE else 40

        return grading_scale.score_to_grade(predicted), confidence


# ============================================================
# MAIN ENGINE - Orchestrator
# ============================================================

class GradexEngine:
    """Main GRADEX evaluation engine orchestrator."""

    def __init__(self):
        self.rubric_architect = RubricArchitect()
        self.evidence_collector = EvidenceCollector()
        self.scoring_engine = ScoringEngine()
        self.feedback_generator = FeedbackGenerator()
        self.trend_analyzer = TrendAnalyzer()
        self.rubrics: Dict[str, Rubric] = {}
        self.history: Dict[str, EvaluationHistory] = {}

    def create_rubric(
        self,
        name: str,
        evaluation_type: EvaluationType,
        custom_criteria: Optional[List[Dict]] = None
    ) -> Rubric:
        """Create a new rubric."""
        rubric = self.rubric_architect.create_rubric(
            name, evaluation_type, custom_criteria
        )
        self.rubrics[rubric.id] = rubric
        return rubric

    def evaluate(
        self,
        subject: str,
        rubric_id: str,
        scores: Dict[str, float]
    ) -> EvaluationResult:
        """Perform a complete evaluation."""
        rubric = self.rubrics.get(rubric_id)
        if not rubric:
            raise ValueError(f"Rubric {rubric_id} not found")

        # Score each criterion
        criterion_scores = []
        for criterion in rubric.criteria:
            raw_score = scores.get(criterion.id, 0)
            cs = self.scoring_engine.score_criterion(
                criterion, raw_score, rubric.grading_scale
            )
            criterion_scores.append(cs)

        # Calculate overall score
        overall_score = self.scoring_engine.calculate_overall_score(
            criterion_scores, rubric
        )
        overall_grade = rubric.grading_scale.score_to_grade(overall_score)

        # Generate feedback
        strengths, weaknesses, recommendations = self.feedback_generator.generate_feedback(
            criterion_scores, rubric
        )

        # Get trend from history
        history = self.history.get(subject, EvaluationHistory(subject=subject))
        trend = history.get_trend()

        result = EvaluationResult(
            id=f"eval_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            subject=subject,
            rubric_id=rubric_id,
            overall_score=overall_score,
            overall_grade=overall_grade,
            criterion_scores=criterion_scores,
            strengths=strengths,
            weaknesses=weaknesses,
            recommendations=recommendations,
            trend=trend
        )

        # Update history
        history.evaluations.append(result)
        self.history[subject] = history

        return result

    def compare(
        self,
        subject_a: str,
        subject_b: str
    ) -> Dict[str, Any]:
        """Compare two subjects' latest evaluations."""
        history_a = self.history.get(subject_a)
        history_b = self.history.get(subject_b)

        if not history_a or not history_a.evaluations:
            raise ValueError(f"No evaluations found for {subject_a}")
        if not history_b or not history_b.evaluations:
            raise ValueError(f"No evaluations found for {subject_b}")

        eval_a = history_a.evaluations[-1]
        eval_b = history_b.evaluations[-1]

        comparison = self.scoring_engine.compare_scores(
            eval_a.criterion_scores,
            eval_b.criterion_scores
        )

        return {
            "subject_a": {
                "name": subject_a,
                "score": eval_a.overall_score,
                "grade": eval_a.overall_grade.value
            },
            "subject_b": {
                "name": subject_b,
                "score": eval_b.overall_score,
                "grade": eval_b.overall_grade.value
            },
            "winner": subject_a if eval_a.overall_score > eval_b.overall_score else subject_b,
            "score_difference": abs(eval_a.overall_score - eval_b.overall_score),
            "criterion_comparison": comparison
        }

    def get_history(self, subject: str) -> EvaluationHistory:
        """Get evaluation history for a subject."""
        return self.history.get(subject, EvaluationHistory(subject=subject))

    def analyze_trend(self, subject: str) -> Dict[str, Any]:
        """Analyze evaluation trend for a subject."""
        history = self.get_history(subject)
        return self.trend_analyzer.analyze_history(history)

    def list_rubrics(self) -> Dict[str, str]:
        """List all available rubrics."""
        return {
            rid: f"{r.name} ({r.evaluation_type.value})"
            for rid, r in self.rubrics.items()
        }

    def get_improvement_priorities(
        self,
        subject: str
    ) -> List[Dict[str, Any]]:
        """Get prioritized list of improvements for a subject."""
        history = self.history.get(subject)
        if not history or not history.evaluations:
            return []

        latest = history.evaluations[-1]
        rubric = self.rubrics.get(latest.rubric_id)
        if not rubric:
            return []

        return self.feedback_generator.prioritize_improvements(
            latest.criterion_scores, rubric
        )


# ============================================================
# REPORTER - Visual Output
# ============================================================

class GradexReporter:
    """Generates visual GRADEX reports."""

    STATUS_ICONS = {
        EvaluationStatus.DRAFT: "○",
        EvaluationStatus.IN_PROGRESS: "◐",
        EvaluationStatus.PENDING_REVIEW: "◑",
        EvaluationStatus.COMPLETED: "●",
        EvaluationStatus.CONTESTED: "⚠",
        EvaluationStatus.ARCHIVED: "◌",
    }

    TREND_ICONS = {
        TrendDirection.IMPROVING: "↑",
        TrendDirection.STABLE: "→",
        TrendDirection.DECLINING: "↓",
        TrendDirection.VOLATILE: "↕",
        TrendDirection.NEW: "●",
    }

    GRADE_COLORS = {
        GradeLevel.A_PLUS: "🟢",
        GradeLevel.A: "🟢",
        GradeLevel.A_MINUS: "🟢",
        GradeLevel.B_PLUS: "🟡",
        GradeLevel.B: "🟡",
        GradeLevel.B_MINUS: "🟡",
        GradeLevel.C_PLUS: "🟠",
        GradeLevel.C: "🟠",
        GradeLevel.C_MINUS: "🟠",
        GradeLevel.D_PLUS: "🔴",
        GradeLevel.D: "🔴",
        GradeLevel.D_MINUS: "🔴",
        GradeLevel.F: "⛔",
    }

    def generate_report(self, result: EvaluationResult, rubric: Rubric) -> str:
        """Generate comprehensive evaluation report."""
        # Progress bar for overall score
        filled = int(result.overall_score / 10)
        progress_bar = "█" * filled + "░" * (10 - filled)

        trend_icon = self.TREND_ICONS.get(result.trend, "●")
        grade_color = self.GRADE_COLORS.get(result.overall_grade, "⚪")

        report = f'''
EVALUATION REPORT
═══════════════════════════════════════════════════════════════
Subject: {result.subject}
Evaluator: {result.evaluated_by}
Time: {result.evaluated_at.strftime("%Y-%m-%d %H:%M:%S")}
═══════════════════════════════════════════════════════════════

GRADE OVERVIEW
───────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│                   EVALUATION RESULT                         │
│                                                             │
│        ╔═══════════════════════════════════╗               │
│        ║  {grade_color} OVERALL GRADE: {result.overall_grade.value:<3}          ║               │
│        ╚═══════════════════════════════════╝               │
│                                                             │
│  Score: {result.overall_score:.1f}/100{' ' * 43}│
│  Trend: {trend_icon} {result.trend.value:<46}│
│  Status: {self.STATUS_ICONS.get(result.status, '●')} {result.status.value:<44}│
│                                                             │
│  Quality: {progress_bar} {result.overall_score:.0f}%{' ' * 23}│
└─────────────────────────────────────────────────────────────┘

CRITERIA BREAKDOWN
───────────────────────────────────────────────────────────────
{self._generate_criteria_table(result.criterion_scores, rubric)}

DIMENSION SCORES
───────────────────────────────────────────────────────────────
{self._generate_dimension_bars(result.criterion_scores, rubric)}

STRENGTHS
───────────────────────────────────────────────────────────────
{self._generate_list(result.strengths, "●")}

AREAS FOR IMPROVEMENT
───────────────────────────────────────────────────────────────
{self._generate_list(result.weaknesses, "○")}

RECOMMENDATIONS
───────────────────────────────────────────────────────────────
{self._generate_numbered_list(result.recommendations)}

═══════════════════════════════════════════════════════════════
Evaluation Status: {self.STATUS_ICONS.get(result.status, '●')} {result.status.value}
'''
        return report

    def _generate_criteria_table(
        self,
        criterion_scores: List[CriterionScore],
        rubric: Rubric
    ) -> str:
        """Generate criteria breakdown table."""
        criteria_map = {c.id: c for c in rubric.criteria}
        lines = ["  │ Criterion            │ Weight │ Score  │ Grade │"]
        lines.append("  ├──────────────────────┼────────┼────────┼───────┤")

        for cs in criterion_scores:
            criterion = criteria_map.get(cs.criterion_id)
            if criterion:
                lines.append(
                    f"  │ {criterion.name:<20} │ {criterion.weight:>5.1f}% │ {cs.raw_score:>5.1f}/10 │  {cs.grade.value:<3}  │"
                )

        return "\n".join(lines)

    def _generate_dimension_bars(
        self,
        criterion_scores: List[CriterionScore],
        rubric: Rubric
    ) -> str:
        """Generate visual score bars for each dimension."""
        criteria_map = {c.id: c for c in rubric.criteria}
        lines = ["  ┌─────────────────────────────────────────────────────────┐"]

        for cs in criterion_scores:
            criterion = criteria_map.get(cs.criterion_id)
            if criterion:
                normalized = (cs.raw_score / criterion.max_score) * 10
                filled = int(normalized)
                bar = "█" * filled + "░" * (10 - filled)
                lines.append(
                    f"  │  {criterion.name:<15}: {bar} {cs.raw_score:.1f}/10{' ' * 10}│"
                )

        lines.append("  └─────────────────────────────────────────────────────────┘")
        return "\n".join(lines)

    def _generate_list(self, items: List[str], icon: str) -> str:
        """Generate a bullet list."""
        if not items:
            return "  (None identified)"
        lines = ["  ┌─────────────────────────────────────────────────────────┐"]
        for item in items[:5]:  # Limit to 5 items
            wrapped = item[:50] + "..." if len(item) > 50 else item
            lines.append(f"  │  [{icon}] {wrapped:<52}│")
        lines.append("  └─────────────────────────────────────────────────────────┘")
        return "\n".join(lines)

    def _generate_numbered_list(self, items: List[str]) -> str:
        """Generate a numbered list."""
        if not items:
            return "  (None)"
        lines = []
        for i, item in enumerate(items[:5], 1):
            wrapped = item[:55] + "..." if len(item) > 55 else item
            lines.append(f"  {i}. {wrapped}")
        return "\n".join(lines)

    def generate_comparison_report(
        self,
        comparison: Dict[str, Any]
    ) -> str:
        """Generate comparison report between two subjects."""
        a = comparison["subject_a"]
        b = comparison["subject_b"]
        winner = comparison["winner"]

        report = f'''
COMPARISON REPORT
═══════════════════════════════════════════════════════════════

{a['name']:<30} vs {b['name']:>30}
───────────────────────────────────────────────────────────────

Overall Score: {a['score']:.1f}                    {b['score']:.1f}
Grade:         {a['grade']:<5}                    {b['grade']:>5}

Winner: {winner} (by {comparison['score_difference']:.1f} points)

CRITERION COMPARISON
───────────────────────────────────────────────────────────────
'''
        for crit_id, scores in comparison['criterion_comparison'].items():
            diff = scores['difference']
            indicator = "←" if diff > 0 else "→" if diff < 0 else "="
            report += f"  {crit_id:<20} {scores['a']:.1f} {indicator} {scores['b']:.1f}\n"

        return report

    def generate_history_report(
        self,
        history: EvaluationHistory,
        analysis: Dict[str, Any]
    ) -> str:
        """Generate historical trend report."""
        trend_icon = self.TREND_ICONS.get(analysis.get('trend', TrendDirection.NEW), "●")

        report = f'''
EVALUATION HISTORY
═══════════════════════════════════════════════════════════════
Subject: {history.subject}
Total Evaluations: {analysis.get('total_evaluations', 0)}
═══════════════════════════════════════════════════════════════

TREND ANALYSIS
───────────────────────────────────────────────────────────────
  Trend: {trend_icon} {analysis.get('trend', TrendDirection.NEW).value}
  Average Score: {analysis.get('average_score', 0):.1f}
  Highest Score: {analysis.get('highest_score', 0):.1f}
  Lowest Score: {analysis.get('lowest_score', 0):.1f}
  Current Score: {analysis.get('current_score', 0):.1f}
  Change: {analysis.get('change', 0):+.1f}

GRADE HISTORY
───────────────────────────────────────────────────────────────
'''
        for eval_result in history.evaluations[-10:]:
            grade_color = self.GRADE_COLORS.get(eval_result.overall_grade, "⚪")
            report += f"  {eval_result.evaluated_at.strftime('%Y-%m-%d')} │ {grade_color} {eval_result.overall_grade.value} │ {eval_result.overall_score:.1f}\n"

        return report


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli():
    """Create CLI argument parser."""
    import argparse

    parser = argparse.ArgumentParser(
        prog="gradex",
        description="GRADEX.EXE - Grading & Evaluation Engine"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # evaluate command
    eval_parser = subparsers.add_parser("evaluate", help="Evaluate a subject")
    eval_parser.add_argument("subject", help="Subject to evaluate")
    eval_parser.add_argument("--rubric", "-r", help="Rubric ID to use")
    eval_parser.add_argument("--type", "-t", default="code_quality",
                            choices=["code_quality", "documentation", "performance",
                                   "security", "ux_design", "api_design"],
                            help="Evaluation type for new rubric")
    eval_parser.add_argument("--scores", "-s", help="JSON scores dict")

    # compare command
    compare_parser = subparsers.add_parser("compare", help="Compare two subjects")
    compare_parser.add_argument("subject_a", help="First subject")
    compare_parser.add_argument("subject_b", help="Second subject")

    # history command
    history_parser = subparsers.add_parser("history", help="Show evaluation history")
    history_parser.add_argument("subject", help="Subject to show history for")

    # rubric command
    rubric_parser = subparsers.add_parser("rubric", help="Manage rubrics")
    rubric_subparsers = rubric_parser.add_subparsers(dest="rubric_command")

    rubric_list = rubric_subparsers.add_parser("list", help="List rubrics")
    rubric_create = rubric_subparsers.add_parser("create", help="Create rubric")
    rubric_create.add_argument("name", help="Rubric name")
    rubric_create.add_argument("--type", "-t", default="code_quality", help="Evaluation type")

    rubric_show = rubric_subparsers.add_parser("show", help="Show rubric details")
    rubric_show.add_argument("rubric_id", help="Rubric ID")

    # priorities command
    priorities_parser = subparsers.add_parser("priorities", help="Get improvement priorities")
    priorities_parser.add_argument("subject", help="Subject to analyze")

    # templates command
    subparsers.add_parser("templates", help="List evaluation templates")

    return parser


def main():
    """Main CLI entry point."""
    parser = create_cli()
    args = parser.parse_args()

    engine = GradexEngine()
    reporter = GradexReporter()

    if args.command == "evaluate":
        eval_type = EvaluationType(args.type)
        rubric = engine.create_rubric(f"{args.subject}_eval", eval_type)

        # Parse scores from JSON or use defaults
        if args.scores:
            scores = json.loads(args.scores)
        else:
            # Default scores for demo
            scores = {c.id: 7.5 for c in rubric.criteria}

        result = engine.evaluate(args.subject, rubric.id, scores)
        report = reporter.generate_report(result, rubric)
        print(report)

    elif args.command == "compare":
        try:
            comparison = engine.compare(args.subject_a, args.subject_b)
            report = reporter.generate_comparison_report(comparison)
            print(report)
        except ValueError as e:
            print(f"Error: {e}")
            print("Both subjects must have at least one evaluation.")

    elif args.command == "history":
        history = engine.get_history(args.subject)
        analysis = engine.analyze_trend(args.subject)
        report = reporter.generate_history_report(history, analysis)
        print(report)

    elif args.command == "rubric":
        if args.rubric_command == "list":
            rubrics = engine.list_rubrics()
            print("\nAvailable Rubrics")
            print("=" * 50)
            for rid, desc in rubrics.items():
                print(f"  {rid}: {desc}")

        elif args.rubric_command == "create":
            eval_type = EvaluationType(args.type)
            rubric = engine.create_rubric(args.name, eval_type)
            print(f"Created rubric: {rubric.id}")
            print(f"  Type: {rubric.evaluation_type.value}")
            print(f"  Criteria: {len(rubric.criteria)}")

        elif args.rubric_command == "show":
            rubric = engine.rubrics.get(args.rubric_id)
            if rubric:
                print(f"\nRubric: {rubric.name}")
                print(f"Type: {rubric.evaluation_type.value}")
                print(f"Criteria:")
                for c in rubric.criteria:
                    print(f"  - {c.name} ({c.weight}%)")
            else:
                print(f"Rubric not found: {args.rubric_id}")

    elif args.command == "priorities":
        priorities = engine.get_improvement_priorities(args.subject)
        print(f"\nImprovement Priorities for {args.subject}")
        print("=" * 50)
        for i, p in enumerate(priorities[:5], 1):
            print(f"  {i}. {p['criterion']} (Gap: {p['gap']:.1f}, Impact: {p['impact_score']:.1f})")

    elif args.command == "templates":
        print("\nAvailable Evaluation Templates")
        print("=" * 50)
        for eval_type in EvaluationType:
            if eval_type in RubricArchitect.TEMPLATES:
                criteria_count = len(RubricArchitect.TEMPLATES[eval_type])
                print(f"  {eval_type.value}: {criteria_count} criteria")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## OUTPUT FORMAT

```
EVALUATION REPORT
═══════════════════════════════════════
Subject: [evaluated_item]
Evaluator: GRADEX.EXE
Time: [timestamp]
═══════════════════════════════════════

GRADE OVERVIEW
────────────────────────────────────
┌─────────────────────────────────────┐
│       EVALUATION RESULT             │
│                                     │
│  ╔═══════════════════════════╗      │
│  ║     OVERALL GRADE: [A]    ║      │
│  ╚═══════════════════════════╝      │
│                                     │
│  Score: [X]/100                     │
│  Percentile: [X]th                  │
│                                     │
│  Quality: ████████░░ [X]/10         │
│  Status: [●] Evaluation Complete    │
└─────────────────────────────────────┘

CRITERIA BREAKDOWN
────────────────────────────────────
| Criterion | Weight | Score | Grade |
|-----------|--------|-------|-------|
| [criterion_1] | [%] | [x/10] | [A] |
| [criterion_2] | [%] | [x/10] | [B] |
| [criterion_3] | [%] | [x/10] | [A] |
| [criterion_4] | [%] | [x/10] | [C] |

DIMENSION SCORES
────────────────────────────────────
┌─────────────────────────────────────┐
│  [Criterion 1]: ████████░░ [X]/10   │
│  [Criterion 2]: ███████░░░ [X]/10   │
│  [Criterion 3]: █████████░ [X]/10   │
│  [Criterion 4]: ██████░░░░ [X]/10   │
└─────────────────────────────────────┘

STRENGTHS
────────────────────────────────────
┌─────────────────────────────────────┐
│  [●] [strength_1]                   │
│  [●] [strength_2]                   │
│  [●] [strength_3]                   │
└─────────────────────────────────────┘

AREAS FOR IMPROVEMENT
────────────────────────────────────
┌─────────────────────────────────────┐
│  [○] [improvement_1]                │
│  [○] [improvement_2]                │
│  [○] [improvement_3]                │
└─────────────────────────────────────┘

RECOMMENDATIONS
────────────────────────────────────
| Priority | Action | Impact |
|----------|--------|--------|
| 1 | [action_1] | [impact] |
| 2 | [action_2] | [impact] |
| 3 | [action_3] | [impact] |

GRADE HISTORY
────────────────────────────────────
| Date | Grade | Change |
|------|-------|--------|
| [date] | [grade] | [+/-] |
| [date] | [grade] | [+/-] |

Evaluation Status: ● Complete
```

---

## QUICK COMMANDS

- `/launch-gradex [item]` - Evaluate with default rubric
- `/launch-gradex evaluate [item] --type [type]` - Evaluate with specific type
- `/launch-gradex compare [a] [b]` - Compare two items
- `/launch-gradex history [item]` - Show grade history
- `/launch-gradex rubric list` - Show available rubrics
- `/launch-gradex rubric create [name]` - Create new rubric
- `/launch-gradex priorities [item]` - Get improvement priorities
- `/launch-gradex templates` - Show evaluation templates

$ARGUMENTS
