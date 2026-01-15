# PROMPT.EVAL.OS.EXE - Prompt Quality & Performance Evaluator

You are PROMPT.EVAL.OS.EXE — a prompt quality and performance evaluator.

MISSION
Measure prompt reliability, consistency, and output quality. Evaluate outputs, not intent. Prefer repeatable tests.

---

## CAPABILITIES

### CriteriaDesigner.MOD
- Dimension definition
- Quality attributes
- Success criteria
- Failure modes
- Edge case identification

### ScoringEngine.MOD
- Rubric development
- Rating scales
- Weighted scoring
- Inter-rater reliability
- Calibration protocols

### RegressionDetector.MOD
- Baseline establishment
- Change detection
- Performance tracking
- Alert thresholds
- Trend analysis

### ImprovementPlanner.MOD
- Gap identification
- Iteration design
- A/B testing
- Version management
- Best practice extraction

---

## PRODUCTION IMPLEMENTATION

```python
"""
PROMPT.EVAL.OS.EXE - Prompt Quality & Performance Evaluator
Production-ready prompt evaluation, scoring, and regression detection engine.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from datetime import datetime, timedelta
import hashlib
import statistics


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class QualityDimension(Enum):
    """Quality dimensions for evaluation."""
    ACCURACY = "accuracy"
    RELEVANCE = "relevance"
    COMPLETENESS = "completeness"
    CONSISTENCY = "consistency"
    SAFETY = "safety"
    FORMAT = "format"
    COHERENCE = "coherence"
    HELPFULNESS = "helpfulness"

    @property
    def weight(self) -> float:
        return {
            QualityDimension.ACCURACY: 0.25,
            QualityDimension.RELEVANCE: 0.15,
            QualityDimension.COMPLETENESS: 0.15,
            QualityDimension.CONSISTENCY: 0.15,
            QualityDimension.SAFETY: 0.15,
            QualityDimension.FORMAT: 0.05,
            QualityDimension.COHERENCE: 0.05,
            QualityDimension.HELPFULNESS: 0.05
        }[self]

    @property
    def target_score(self) -> float:
        return {
            QualityDimension.ACCURACY: 90.0,
            QualityDimension.RELEVANCE: 90.0,
            QualityDimension.COMPLETENESS: 85.0,
            QualityDimension.CONSISTENCY: 85.0,
            QualityDimension.SAFETY: 100.0,
            QualityDimension.FORMAT: 95.0,
            QualityDimension.COHERENCE: 90.0,
            QualityDimension.HELPFULNESS: 85.0
        }[self]

    @property
    def description(self) -> str:
        return {
            QualityDimension.ACCURACY: "Factual correctness of information",
            QualityDimension.RELEVANCE: "Response addresses the query",
            QualityDimension.COMPLETENESS: "All aspects covered",
            QualityDimension.CONSISTENCY: "Stable across similar inputs",
            QualityDimension.SAFETY: "No harmful or inappropriate content",
            QualityDimension.FORMAT: "Follows specified output format",
            QualityDimension.COHERENCE: "Logical and well-structured",
            QualityDimension.HELPFULNESS: "Actionable and useful"
        }[self]


class ScoreLevel(Enum):
    """Discrete scoring levels."""
    EXCELLENT = 5
    GOOD = 4
    ACCEPTABLE = 3
    POOR = 2
    UNACCEPTABLE = 1

    @property
    def percentage_range(self) -> tuple:
        return {
            ScoreLevel.EXCELLENT: (90, 100),
            ScoreLevel.GOOD: (75, 89),
            ScoreLevel.ACCEPTABLE: (60, 74),
            ScoreLevel.POOR: (40, 59),
            ScoreLevel.UNACCEPTABLE: (0, 39)
        }[self]

    @property
    def icon(self) -> str:
        return {
            ScoreLevel.EXCELLENT: "[++]",
            ScoreLevel.GOOD: "[OK]",
            ScoreLevel.ACCEPTABLE: "[~~]",
            ScoreLevel.POOR: "[--]",
            ScoreLevel.UNACCEPTABLE: "[XX]"
        }[self]

    @classmethod
    def from_percentage(cls, pct: float) -> 'ScoreLevel':
        for level in cls:
            low, high = level.percentage_range
            if low <= pct <= high:
                return level
        return cls.UNACCEPTABLE


class TestCategory(Enum):
    """Categories of test cases."""
    CORE = "core"
    EDGE_CASE = "edge_case"
    ADVERSARIAL = "adversarial"
    REGRESSION = "regression"
    SAFETY = "safety"
    PERFORMANCE = "performance"

    @property
    def priority(self) -> int:
        return {
            TestCategory.SAFETY: 1,
            TestCategory.CORE: 2,
            TestCategory.REGRESSION: 3,
            TestCategory.ADVERSARIAL: 4,
            TestCategory.EDGE_CASE: 5,
            TestCategory.PERFORMANCE: 6
        }[self]

    @property
    def minimum_coverage(self) -> int:
        return {
            TestCategory.CORE: 10,
            TestCategory.EDGE_CASE: 5,
            TestCategory.ADVERSARIAL: 3,
            TestCategory.REGRESSION: 5,
            TestCategory.SAFETY: 5,
            TestCategory.PERFORMANCE: 3
        }[self]


class RegressionStatus(Enum):
    """Status of regression detection."""
    STABLE = "stable"
    IMPROVING = "improving"
    DEGRADING = "degrading"
    VOLATILE = "volatile"
    INSUFFICIENT_DATA = "insufficient_data"

    @property
    def icon(self) -> str:
        return {
            RegressionStatus.STABLE: "[==]",
            RegressionStatus.IMPROVING: "[UP]",
            RegressionStatus.DEGRADING: "[DN]",
            RegressionStatus.VOLATILE: "[~~]",
            RegressionStatus.INSUFFICIENT_DATA: "[??]"
        }[self]

    @property
    def requires_action(self) -> bool:
        return self in [RegressionStatus.DEGRADING, RegressionStatus.VOLATILE]


class ImprovementPriority(Enum):
    """Priority levels for improvements."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    OPTIONAL = "optional"

    @property
    def sla_days(self) -> int:
        return {
            ImprovementPriority.CRITICAL: 1,
            ImprovementPriority.HIGH: 7,
            ImprovementPriority.MEDIUM: 14,
            ImprovementPriority.LOW: 30,
            ImprovementPriority.OPTIONAL: 0
        }[self]


class EvaluationType(Enum):
    """Types of evaluation methods."""
    AUTOMATED = "automated"
    HUMAN = "human"
    HYBRID = "hybrid"
    LLM_AS_JUDGE = "llm_as_judge"

    @property
    def cost_factor(self) -> float:
        return {
            EvaluationType.AUTOMATED: 0.1,
            EvaluationType.HUMAN: 10.0,
            EvaluationType.HYBRID: 5.0,
            EvaluationType.LLM_AS_JUDGE: 1.0
        }[self]

    @property
    def typical_latency_seconds(self) -> int:
        return {
            EvaluationType.AUTOMATED: 1,
            EvaluationType.HUMAN: 300,
            EvaluationType.HYBRID: 120,
            EvaluationType.LLM_AS_JUDGE: 30
        }[self]


class SampleMethod(Enum):
    """Sampling methods for evaluation."""
    RANDOM = "random"
    STRATIFIED = "stratified"
    SYSTEMATIC = "systematic"
    CONVENIENCE = "convenience"

    @property
    def recommended_sample_size(self) -> int:
        return {
            SampleMethod.RANDOM: 100,
            SampleMethod.STRATIFIED: 50,
            SampleMethod.SYSTEMATIC: 75,
            SampleMethod.CONVENIENCE: 30
        }[self]


class AlertAction(Enum):
    """Actions to take on alerts."""
    INVESTIGATE = "investigate"
    ROLLBACK = "rollback"
    NOTIFY = "notify"
    ESCALATE = "escalate"
    AUTO_FIX = "auto_fix"

    @property
    def urgency(self) -> int:
        return {
            AlertAction.ROLLBACK: 1,
            AlertAction.ESCALATE: 2,
            AlertAction.INVESTIGATE: 3,
            AlertAction.AUTO_FIX: 4,
            AlertAction.NOTIFY: 5
        }[self]


class TrendDirection(Enum):
    """Direction of trend."""
    UP = "up"
    DOWN = "down"
    FLAT = "flat"
    VOLATILE = "volatile"

    @property
    def icon(self) -> str:
        return {
            TrendDirection.UP: "^",
            TrendDirection.DOWN: "v",
            TrendDirection.FLAT: "-",
            TrendDirection.VOLATILE: "~"
        }[self]


class ComplianceLevel(Enum):
    """Compliance status levels."""
    COMPLIANT = "compliant"
    MINOR_ISSUES = "minor_issues"
    MAJOR_ISSUES = "major_issues"
    NON_COMPLIANT = "non_compliant"

    @property
    def can_deploy(self) -> bool:
        return self in [ComplianceLevel.COMPLIANT, ComplianceLevel.MINOR_ISSUES]


# ============================================================
# DATACLASSES WITH BUSINESS LOGIC
# ============================================================

@dataclass
class EvaluationCriteria:
    """Criteria for evaluating a quality dimension."""
    criteria_id: str
    dimension: QualityDimension
    description: str
    rubric: dict = field(default_factory=dict)
    weight_override: Optional[float] = None

    @property
    def effective_weight(self) -> float:
        return self.weight_override or self.dimension.weight

    def score_to_level(self, score: float) -> ScoreLevel:
        return ScoreLevel.from_percentage(score)

    def get_rubric_description(self, level: ScoreLevel) -> str:
        return self.rubric.get(level.value, "No description")


@dataclass
class Score:
    """Individual score for a dimension."""
    score_id: str
    dimension: QualityDimension
    value: float
    level: ScoreLevel = None
    evidence: str = ""
    evaluator: str = ""
    timestamp: datetime = None

    def __post_init__(self):
        if self.level is None:
            self.level = ScoreLevel.from_percentage(self.value)
        if self.timestamp is None:
            self.timestamp = datetime.now()

    @property
    def weighted_value(self) -> float:
        return self.value * self.dimension.weight

    @property
    def gap_from_target(self) -> float:
        return self.dimension.target_score - self.value


@dataclass
class TestCase:
    """Test case for evaluation."""
    test_id: str
    name: str
    category: TestCategory
    input_text: str
    expected_output: str = ""
    expected_dimensions: dict = field(default_factory=dict)
    actual_output: str = ""
    scores: list = field(default_factory=list)

    @property
    def overall_score(self) -> float:
        if not self.scores:
            return 0.0
        return sum(s.weighted_value for s in self.scores) / sum(s.dimension.weight for s in self.scores) * 100

    @property
    def is_passing(self) -> bool:
        if not self.scores:
            return False
        # Must meet all dimension targets
        for score in self.scores:
            if score.value < score.dimension.target_score:
                return False
        return True

    @property
    def worst_dimension(self) -> QualityDimension:
        if not self.scores:
            return None
        return min(self.scores, key=lambda s: s.value).dimension


@dataclass
class TestResult:
    """Aggregated test results."""
    result_id: str
    prompt_id: str
    version: str
    timestamp: datetime
    test_cases: list = field(default_factory=list)
    dimension_scores: dict = field(default_factory=dict)

    @property
    def overall_score(self) -> float:
        if not self.dimension_scores:
            return 0.0

        weighted_sum = 0.0
        weight_sum = 0.0
        for dim, scores in self.dimension_scores.items():
            dimension = QualityDimension(dim)
            avg_score = sum(scores) / len(scores) if scores else 0
            weighted_sum += avg_score * dimension.weight
            weight_sum += dimension.weight

        return (weighted_sum / weight_sum) * 100 if weight_sum > 0 else 0

    @property
    def pass_rate(self) -> float:
        if not self.test_cases:
            return 0.0
        passing = sum(1 for tc in self.test_cases if tc.is_passing)
        return (passing / len(self.test_cases)) * 100

    @property
    def level(self) -> ScoreLevel:
        return ScoreLevel.from_percentage(self.overall_score)

    def add_test_case(self, test_case: TestCase) -> None:
        self.test_cases.append(test_case)
        for score in test_case.scores:
            dim = score.dimension.value
            self.dimension_scores.setdefault(dim, []).append(score.value)


@dataclass
class RegressionTest:
    """Regression test tracking."""
    test_id: str
    name: str
    baseline_score: float
    current_score: float
    threshold_warning: float = 5.0
    threshold_critical: float = 10.0
    history: list = field(default_factory=list)

    @property
    def delta(self) -> float:
        return self.current_score - self.baseline_score

    @property
    def delta_percent(self) -> float:
        if self.baseline_score == 0:
            return 0.0
        return (self.delta / self.baseline_score) * 100

    @property
    def status(self) -> RegressionStatus:
        if len(self.history) < 3:
            return RegressionStatus.INSUFFICIENT_DATA

        if self.delta >= self.threshold_warning:
            return RegressionStatus.IMPROVING
        elif self.delta <= -self.threshold_critical:
            return RegressionStatus.DEGRADING
        elif abs(self.delta) <= self.threshold_warning:
            # Check volatility
            if len(self.history) >= 5:
                std_dev = statistics.stdev(self.history[-5:])
                if std_dev > self.threshold_warning:
                    return RegressionStatus.VOLATILE
            return RegressionStatus.STABLE
        else:
            return RegressionStatus.DEGRADING

    def add_score(self, score: float) -> None:
        self.history.append(score)
        self.current_score = score


@dataclass
class ABTest:
    """A/B test configuration and results."""
    test_id: str
    name: str
    hypothesis: str
    variant_a_id: str
    variant_b_id: str
    metric: QualityDimension
    sample_size: int = 100
    duration_days: int = 7
    variant_a_scores: list = field(default_factory=list)
    variant_b_scores: list = field(default_factory=list)
    started_at: Optional[datetime] = None

    @property
    def variant_a_mean(self) -> float:
        return statistics.mean(self.variant_a_scores) if self.variant_a_scores else 0.0

    @property
    def variant_b_mean(self) -> float:
        return statistics.mean(self.variant_b_scores) if self.variant_b_scores else 0.0

    @property
    def lift(self) -> float:
        if self.variant_a_mean == 0:
            return 0.0
        return ((self.variant_b_mean - self.variant_a_mean) / self.variant_a_mean) * 100

    @property
    def has_sufficient_data(self) -> bool:
        return len(self.variant_a_scores) >= self.sample_size and \
               len(self.variant_b_scores) >= self.sample_size

    @property
    def is_significant(self) -> bool:
        if not self.has_sufficient_data:
            return False
        # Simplified significance check (would use proper statistics in production)
        return abs(self.lift) > 5.0

    @property
    def winner(self) -> str:
        if not self.is_significant:
            return "inconclusive"
        return "variant_b" if self.lift > 0 else "variant_a"


@dataclass
class ImprovementPlan:
    """Plan for improving a prompt."""
    plan_id: str
    prompt_id: str
    priority: ImprovementPriority
    gap_analysis: dict = field(default_factory=dict)
    actions: list = field(default_factory=list)
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

    @property
    def due_date(self) -> datetime:
        return self.created_at + timedelta(days=self.priority.sla_days)

    def add_action(self, dimension: QualityDimension, action: str, expected_impact: float) -> None:
        self.actions.append({
            "dimension": dimension.value,
            "action": action,
            "expected_impact": expected_impact
        })


@dataclass
class EvaluationReport:
    """Complete evaluation report."""
    report_id: str
    prompt_id: str
    version: str
    timestamp: datetime
    test_result: TestResult
    regression_tests: list = field(default_factory=list)
    compliance_level: ComplianceLevel = ComplianceLevel.COMPLIANT
    recommendations: list = field(default_factory=list)

    @property
    def is_deployable(self) -> bool:
        return self.compliance_level.can_deploy and \
               self.test_result.level in [ScoreLevel.EXCELLENT, ScoreLevel.GOOD]


@dataclass
class VersionComparison:
    """Comparison between prompt versions."""
    comparison_id: str
    baseline_version: str
    current_version: str
    dimension_deltas: dict = field(default_factory=dict)
    overall_delta: float = 0.0

    @property
    def improved_dimensions(self) -> list:
        return [d for d, delta in self.dimension_deltas.items() if delta > 0]

    @property
    def degraded_dimensions(self) -> list:
        return [d for d, delta in self.dimension_deltas.items() if delta < 0]


# ============================================================
# ENGINE CLASSES
# ============================================================

class CriteriaEngine:
    """Evaluation criteria management engine."""

    DEFAULT_RUBRICS = {
        QualityDimension.ACCURACY: {
            5: "Completely accurate, verifiable",
            4: "Mostly accurate, minor issues",
            3: "Partially accurate",
            2: "Mostly inaccurate",
            1: "Completely inaccurate"
        },
        QualityDimension.RELEVANCE: {
            5: "Perfectly on-topic",
            4: "Mostly relevant",
            3: "Partially relevant",
            2: "Mostly off-topic",
            1: "Completely irrelevant"
        },
        QualityDimension.COMPLETENESS: {
            5: "Comprehensive coverage",
            4: "Missing minor details",
            3: "Key gaps exist",
            2: "Major gaps",
            1: "Only fragments"
        },
        QualityDimension.CONSISTENCY: {
            5: "Highly consistent",
            4: "Occasional variation",
            3: "Noticeable differences",
            2: "Unpredictable",
            1: "Erratic"
        },
        QualityDimension.SAFETY: {
            5: "Completely safe",
            4: "Minor concerns",
            3: "Needs review",
            2: "Significant issues",
            1: "Harmful content"
        }
    }

    def __init__(self):
        self.criteria: dict = {}
        self._initialize_defaults()

    def _initialize_defaults(self) -> None:
        """Initialize default criteria."""
        for dimension in QualityDimension:
            criteria_id = hashlib.sha256(
                dimension.value.encode()
            ).hexdigest()[:8]

            self.criteria[dimension.value] = EvaluationCriteria(
                criteria_id=criteria_id,
                dimension=dimension,
                description=dimension.description,
                rubric=self.DEFAULT_RUBRICS.get(dimension, {})
            )

    def get_criteria(self, dimension: QualityDimension) -> EvaluationCriteria:
        """Get criteria for a dimension."""
        return self.criteria.get(dimension.value)

    def set_custom_weight(self, dimension: QualityDimension, weight: float) -> None:
        """Override weight for a dimension."""
        if dimension.value in self.criteria:
            self.criteria[dimension.value].weight_override = weight


class ScoringEngine:
    """Scoring and rubric management engine."""

    def __init__(self, criteria_engine: CriteriaEngine):
        self.criteria_engine = criteria_engine
        self.scores: list = []

    def score_output(
        self,
        output: str,
        dimension: QualityDimension,
        evaluator: str = "system"
    ) -> Score:
        """Score an output for a dimension."""
        # In production, this would use actual evaluation logic
        # Here we provide a simplified scoring mechanism

        score_id = hashlib.sha256(
            f"{output[:50]}-{dimension.value}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        # Placeholder scoring logic
        base_score = 75.0  # Would be replaced with actual evaluation

        score = Score(
            score_id=score_id,
            dimension=dimension,
            value=base_score,
            evidence=f"Evaluated for {dimension.value}",
            evaluator=evaluator
        )

        self.scores.append(score)
        return score

    def score_test_case(
        self,
        test_case: TestCase,
        output: str,
        dimensions: list = None
    ) -> TestCase:
        """Score a test case across multiple dimensions."""
        test_case.actual_output = output

        dimensions = dimensions or [
            QualityDimension.ACCURACY,
            QualityDimension.RELEVANCE,
            QualityDimension.COMPLETENESS,
            QualityDimension.SAFETY
        ]

        for dimension in dimensions:
            score = self.score_output(output, dimension)
            test_case.scores.append(score)

        return test_case

    def calculate_aggregate_score(self, scores: list) -> float:
        """Calculate weighted aggregate score."""
        if not scores:
            return 0.0

        weighted_sum = sum(s.weighted_value for s in scores)
        weight_sum = sum(s.dimension.weight for s in scores)

        return (weighted_sum / weight_sum) * 100 if weight_sum > 0 else 0.0

    def get_inter_rater_reliability(self, dimension: QualityDimension) -> float:
        """Calculate inter-rater reliability for a dimension."""
        dimension_scores = [s for s in self.scores if s.dimension == dimension]

        if len(dimension_scores) < 2:
            return 0.0

        # Simplified - would use proper IRR calculation in production
        values = [s.value for s in dimension_scores]
        if len(set(values)) == 1:
            return 1.0  # Perfect agreement

        std_dev = statistics.stdev(values)
        mean_val = statistics.mean(values)

        if mean_val == 0:
            return 0.0

        # Higher agreement = lower coefficient of variation
        cv = std_dev / mean_val
        return max(0, 1 - cv)


class TestSuiteEngine:
    """Test suite management and execution engine."""

    def __init__(self, scoring_engine: ScoringEngine):
        self.scoring_engine = scoring_engine
        self.test_suites: dict = {}

    def create_test_case(
        self,
        name: str,
        category: TestCategory,
        input_text: str,
        expected_output: str = "",
        expected_dimensions: dict = None
    ) -> TestCase:
        """Create a test case."""
        test_id = hashlib.sha256(
            f"{name}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        return TestCase(
            test_id=test_id,
            name=name,
            category=category,
            input_text=input_text,
            expected_output=expected_output,
            expected_dimensions=expected_dimensions or {}
        )

    def run_test_suite(
        self,
        prompt_id: str,
        version: str,
        test_cases: list,
        executor: callable = None
    ) -> TestResult:
        """Run a complete test suite."""
        result_id = hashlib.sha256(
            f"{prompt_id}-{version}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        result = TestResult(
            result_id=result_id,
            prompt_id=prompt_id,
            version=version,
            timestamp=datetime.now()
        )

        for test_case in test_cases:
            if executor:
                output = executor(test_case.input_text)
            else:
                output = "Mock output for testing"

            scored_case = self.scoring_engine.score_test_case(test_case, output)
            result.add_test_case(scored_case)

        return result

    def generate_coverage_report(self, test_cases: list) -> dict:
        """Generate test coverage report."""
        coverage = {cat.value: 0 for cat in TestCategory}

        for test in test_cases:
            coverage[test.category.value] += 1

        gaps = []
        for category in TestCategory:
            if coverage[category.value] < category.minimum_coverage:
                gaps.append({
                    "category": category.value,
                    "current": coverage[category.value],
                    "minimum": category.minimum_coverage,
                    "gap": category.minimum_coverage - coverage[category.value]
                })

        return {
            "coverage": coverage,
            "gaps": gaps,
            "total_tests": len(test_cases),
            "fully_covered": len(gaps) == 0
        }


class RegressionEngine:
    """Regression detection and monitoring engine."""

    TREND_WINDOW = 5  # Number of data points for trend calculation

    def __init__(self):
        self.regression_tests: dict = {}
        self.baselines: dict = {}

    def set_baseline(self, prompt_id: str, dimension: QualityDimension, score: float) -> None:
        """Set baseline score for regression detection."""
        key = f"{prompt_id}:{dimension.value}"
        self.baselines[key] = score

    def create_regression_test(
        self,
        name: str,
        baseline_score: float,
        threshold_warning: float = 5.0,
        threshold_critical: float = 10.0
    ) -> RegressionTest:
        """Create a regression test."""
        test_id = hashlib.sha256(
            f"{name}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        test = RegressionTest(
            test_id=test_id,
            name=name,
            baseline_score=baseline_score,
            current_score=baseline_score,
            threshold_warning=threshold_warning,
            threshold_critical=threshold_critical
        )

        self.regression_tests[test_id] = test
        return test

    def update_regression_test(self, test_id: str, new_score: float) -> RegressionTest:
        """Update a regression test with new score."""
        if test_id not in self.regression_tests:
            return None

        test = self.regression_tests[test_id]
        test.add_score(new_score)
        return test

    def detect_regression(self, test_id: str) -> dict:
        """Detect regression for a test."""
        if test_id not in self.regression_tests:
            return {"error": "Test not found"}

        test = self.regression_tests[test_id]
        status = test.status

        return {
            "test_id": test_id,
            "name": test.name,
            "status": status.value,
            "baseline": test.baseline_score,
            "current": test.current_score,
            "delta": test.delta,
            "delta_percent": test.delta_percent,
            "requires_action": status.requires_action,
            "recommended_action": self._recommend_action(status, test.delta)
        }

    def _recommend_action(self, status: RegressionStatus, delta: float) -> AlertAction:
        """Recommend action based on regression status."""
        if status == RegressionStatus.DEGRADING and delta <= -10:
            return AlertAction.ROLLBACK
        elif status == RegressionStatus.DEGRADING:
            return AlertAction.INVESTIGATE
        elif status == RegressionStatus.VOLATILE:
            return AlertAction.INVESTIGATE
        else:
            return AlertAction.NOTIFY

    def calculate_trend(self, history: list) -> TrendDirection:
        """Calculate trend from history."""
        if len(history) < self.TREND_WINDOW:
            return TrendDirection.FLAT

        recent = history[-self.TREND_WINDOW:]
        first_half = sum(recent[:len(recent)//2]) / (len(recent)//2)
        second_half = sum(recent[len(recent)//2:]) / (len(recent) - len(recent)//2)

        diff = second_half - first_half
        std_dev = statistics.stdev(recent) if len(recent) > 1 else 0

        if std_dev > 5:
            return TrendDirection.VOLATILE
        elif diff > 2:
            return TrendDirection.UP
        elif diff < -2:
            return TrendDirection.DOWN
        else:
            return TrendDirection.FLAT


class PromptEvalEngine:
    """Main orchestrator for prompt evaluation."""

    def __init__(self):
        self.criteria_engine = CriteriaEngine()
        self.scoring_engine = ScoringEngine(self.criteria_engine)
        self.test_suite_engine = TestSuiteEngine(self.scoring_engine)
        self.regression_engine = RegressionEngine()

    def evaluate_prompt(
        self,
        prompt_id: str,
        version: str,
        test_cases: list,
        executor: callable = None
    ) -> EvaluationReport:
        """Perform complete prompt evaluation."""
        # Run test suite
        test_result = self.test_suite_engine.run_test_suite(
            prompt_id, version, test_cases, executor
        )

        # Check regressions
        regression_results = []
        for test_id in self.regression_engine.regression_tests:
            result = self.regression_engine.detect_regression(test_id)
            regression_results.append(result)

        # Determine compliance
        if test_result.level == ScoreLevel.UNACCEPTABLE:
            compliance = ComplianceLevel.NON_COMPLIANT
        elif test_result.level == ScoreLevel.POOR:
            compliance = ComplianceLevel.MAJOR_ISSUES
        elif test_result.level == ScoreLevel.ACCEPTABLE:
            compliance = ComplianceLevel.MINOR_ISSUES
        else:
            compliance = ComplianceLevel.COMPLIANT

        # Generate recommendations
        recommendations = self._generate_recommendations(test_result)

        report_id = hashlib.sha256(
            f"{prompt_id}-{version}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        return EvaluationReport(
            report_id=report_id,
            prompt_id=prompt_id,
            version=version,
            timestamp=datetime.now(),
            test_result=test_result,
            regression_tests=regression_results,
            compliance_level=compliance,
            recommendations=recommendations
        )

    def _generate_recommendations(self, test_result: TestResult) -> list:
        """Generate improvement recommendations."""
        recommendations = []

        for dim, scores in test_result.dimension_scores.items():
            dimension = QualityDimension(dim)
            avg_score = sum(scores) / len(scores) if scores else 0

            if avg_score < dimension.target_score:
                gap = dimension.target_score - avg_score
                recommendations.append({
                    "dimension": dim,
                    "current_score": avg_score,
                    "target_score": dimension.target_score,
                    "gap": gap,
                    "priority": ImprovementPriority.HIGH if gap > 10 else ImprovementPriority.MEDIUM
                })

        return sorted(recommendations, key=lambda x: x["gap"], reverse=True)

    def create_improvement_plan(
        self,
        prompt_id: str,
        evaluation_report: EvaluationReport
    ) -> ImprovementPlan:
        """Create improvement plan from evaluation."""
        # Determine priority
        if evaluation_report.compliance_level == ComplianceLevel.NON_COMPLIANT:
            priority = ImprovementPriority.CRITICAL
        elif evaluation_report.compliance_level == ComplianceLevel.MAJOR_ISSUES:
            priority = ImprovementPriority.HIGH
        else:
            priority = ImprovementPriority.MEDIUM

        plan_id = hashlib.sha256(
            f"{prompt_id}-plan-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        plan = ImprovementPlan(
            plan_id=plan_id,
            prompt_id=prompt_id,
            priority=priority
        )

        # Add actions based on recommendations
        for rec in evaluation_report.recommendations:
            dimension = QualityDimension(rec["dimension"])
            plan.add_action(
                dimension,
                f"Improve {dimension.value} from {rec['current_score']:.1f} to {rec['target_score']:.1f}",
                rec["gap"]
            )

        return plan


# ============================================================
# REPORTER
# ============================================================

class EvalReporter:
    """ASCII report generator for evaluation."""

    def __init__(self, engine: PromptEvalEngine):
        self.engine = engine

    def generate_scorecard(self, test_result: TestResult) -> str:
        """Generate quality scorecard."""
        lines = [
            "PROMPT QUALITY SCORECARD",
            "=" * 50,
            f"Prompt: {test_result.prompt_id}",
            f"Version: {test_result.version}",
            f"Evaluated: {test_result.timestamp.isoformat()}",
            "",
            f"OVERALL SCORE: {test_result.overall_score:.1f}/100 {test_result.level.icon}",
            f"PASS RATE: {test_result.pass_rate:.1f}%",
            "",
            "DIMENSION SCORES",
            "-" * 30,
        ]

        for dim, scores in test_result.dimension_scores.items():
            dimension = QualityDimension(dim)
            avg = sum(scores) / len(scores) if scores else 0
            level = ScoreLevel.from_percentage(avg)
            target = dimension.target_score

            bar_len = int(avg / 5)
            bar = "#" * bar_len + "." * (20 - bar_len)

            status = "[OK]" if avg >= target else "[--]"
            lines.append(f"  {status} {dim:15} [{bar}] {avg:.1f}% (target: {target:.0f}%)")

        return "\n".join(lines)

    def generate_regression_report(self) -> str:
        """Generate regression status report."""
        lines = [
            "REGRESSION STATUS",
            "=" * 50,
            ""
        ]

        if not self.engine.regression_engine.regression_tests:
            lines.append("No regression tests configured")
            return "\n".join(lines)

        for test_id, test in self.engine.regression_engine.regression_tests.items():
            status = test.status
            lines.extend([
                f"{status.icon} {test.name}",
                f"    Baseline: {test.baseline_score:.1f}%",
                f"    Current:  {test.current_score:.1f}%",
                f"    Delta:    {test.delta:+.1f}% ({test.delta_percent:+.1f}%)",
                ""
            ])

        return "\n".join(lines)

    def generate_improvement_report(self, plan: ImprovementPlan) -> str:
        """Generate improvement plan report."""
        lines = [
            "IMPROVEMENT PLAN",
            "=" * 50,
            f"Prompt: {plan.prompt_id}",
            f"Priority: {plan.priority.value.upper()}",
            f"Due: {plan.due_date.strftime('%Y-%m-%d')}",
            "",
            "ACTIONS",
            "-" * 30,
        ]

        for i, action in enumerate(plan.actions, 1):
            lines.append(f"  {i}. [{action['dimension']}] {action['action']}")
            lines.append(f"     Expected impact: +{action['expected_impact']:.1f}%")

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="PROMPT.EVAL.OS.EXE - Prompt Quality & Performance Evaluator"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Evaluate command
    eval_parser = subparsers.add_parser("evaluate", help="Evaluate a prompt")
    eval_parser.add_argument("prompt_id", help="Prompt ID to evaluate")
    eval_parser.add_argument("--version", default="1.0.0", help="Version to evaluate")

    # Rubric command
    rubric_parser = subparsers.add_parser("rubric", help="Show scoring rubrics")
    rubric_parser.add_argument("--dimension", help="Specific dimension")

    # Regression command
    regression_parser = subparsers.add_parser("regression", help="Check regression status")

    # Dimensions command
    dimensions_parser = subparsers.add_parser("dimensions", help="List quality dimensions")

    # Coverage command
    coverage_parser = subparsers.add_parser("coverage", help="Check test coverage")

    args = parser.parse_args()

    # Initialize engine
    engine = PromptEvalEngine()
    reporter = EvalReporter(engine)

    if args.command == "dimensions":
        print("QUALITY DIMENSIONS")
        print("=" * 50)
        for dim in QualityDimension:
            print(f"\n{dim.value.upper()}")
            print(f"  Weight: {dim.weight:.0%}")
            print(f"  Target: {dim.target_score}%")
            print(f"  Description: {dim.description}")

    elif args.command == "rubric":
        print("SCORING RUBRICS")
        print("=" * 50)

        dimensions = [QualityDimension(args.dimension)] if args.dimension else QualityDimension

        for dim in dimensions:
            criteria = engine.criteria_engine.get_criteria(dim)
            print(f"\n{dim.value.upper()}")
            print("-" * 30)
            for level, desc in criteria.rubric.items():
                print(f"  {level}: {desc}")

    elif args.command == "regression":
        print(reporter.generate_regression_report())

    elif args.command == "coverage":
        categories = {cat.value: cat.minimum_coverage for cat in TestCategory}
        print("TEST COVERAGE REQUIREMENTS")
        print("=" * 40)
        for cat, min_count in categories.items():
            print(f"  {cat}: minimum {min_count} tests")

    elif args.command == "evaluate":
        # Demo evaluation
        test_cases = [
            engine.test_suite_engine.create_test_case(
                "Basic test", TestCategory.CORE,
                "Test input", "Expected output"
            )
        ]

        report = engine.evaluate_prompt(args.prompt_id, args.version, test_cases)
        print(reporter.generate_scorecard(report.test_result))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/prompt-eval` - Full evaluation framework
- `/prompt-eval dimensions` - List quality dimensions
- `/prompt-eval rubric` - Show scoring rubrics
- `/prompt-eval regression` - Regression monitoring
- `/prompt-eval evaluate <prompt>` - Evaluate specific prompt

$ARGUMENTS
