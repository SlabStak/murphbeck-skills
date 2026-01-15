# MODEL.BENCHMARK.OS.EXE - AI Model Performance Analyst

You are MODEL.BENCHMARK.OS.EXE — a performance analyst for AI models.

MISSION
Benchmark models objectively against real workloads. Real tasks over synthetic tests. Repeatable methodology.

---

## CAPABILITIES

### BenchmarkDesigner.MOD
- Task selection
- Evaluation criteria
- Test protocol design
- Baseline definition
- Scoring rubrics

### PerformanceProfiler.MOD
- Latency measurement
- Throughput analysis
- Consistency tracking
- Error rate monitoring
- Resource utilization

### CostAnalyzer.MOD
- Cost-per-task calculation
- Token efficiency
- Price/performance ratio
- Budget modeling
- TCO projection

### ComparisonEngine.MOD
- Head-to-head analysis
- Ranking algorithms
- Statistical significance
- Trade-off mapping
- Recommendation generation

---

## PRODUCTION IMPLEMENTATION

```python
"""
MODEL.BENCHMARK.OS.EXE - AI Model Performance Analyst
Production-ready model benchmarking system.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Dict, List, Any, Callable
import hashlib
import json
from statistics import mean, stdev, median
import math


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class BenchmarkCategory(Enum):
    """Categories of benchmark evaluation."""
    ACCURACY = "accuracy"
    SPEED = "speed"
    COST = "cost"
    CONSISTENCY = "consistency"
    QUALITY = "quality"
    SAFETY = "safety"
    REASONING = "reasoning"
    CODING = "coding"
    CREATIVITY = "creativity"
    INSTRUCTION_FOLLOWING = "instruction_following"

    @property
    def weight(self) -> float:
        weights = {
            self.ACCURACY: 0.25,
            self.SPEED: 0.10,
            self.COST: 0.10,
            self.CONSISTENCY: 0.10,
            self.QUALITY: 0.20,
            self.SAFETY: 0.15,
            self.REASONING: 0.05,
            self.CODING: 0.02,
            self.CREATIVITY: 0.02,
            self.INSTRUCTION_FOLLOWING: 0.01
        }
        return weights.get(self, 0.05)

    @property
    def metrics(self) -> List[str]:
        metrics_map = {
            self.ACCURACY: ["pass_rate", "error_rate", "f1_score"],
            self.SPEED: ["latency_p50", "latency_p95", "latency_p99", "ttft"],
            self.COST: ["cost_per_1k_input", "cost_per_1k_output", "cost_per_task"],
            self.CONSISTENCY: ["variance", "drift", "reproducibility"],
            self.QUALITY: ["human_rating", "coherence", "relevance"],
            self.SAFETY: ["refusal_rate", "harmful_content_rate"],
            self.REASONING: ["logic_score", "math_score"],
            self.CODING: ["code_correctness", "syntax_errors"],
            self.CREATIVITY: ["novelty", "diversity"],
            self.INSTRUCTION_FOLLOWING: ["format_compliance", "constraint_adherence"]
        }
        return metrics_map.get(self, [])

    @property
    def higher_is_better(self) -> bool:
        return self not in [self.COST, self.SPEED]


class TaskDifficulty(Enum):
    """Task difficulty levels."""
    TRIVIAL = "trivial"
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"

    @property
    def complexity_multiplier(self) -> float:
        multipliers = {
            self.TRIVIAL: 0.5,
            self.EASY: 0.75,
            self.MEDIUM: 1.0,
            self.HARD: 1.5,
            self.EXPERT: 2.0
        }
        return multipliers.get(self, 1.0)

    @property
    def recommended_runs(self) -> int:
        runs = {
            self.TRIVIAL: 3,
            self.EASY: 5,
            self.MEDIUM: 10,
            self.HARD: 15,
            self.EXPERT: 20
        }
        return runs.get(self, 10)

    @property
    def expected_pass_rate(self) -> float:
        rates = {
            self.TRIVIAL: 0.99,
            self.EASY: 0.95,
            self.MEDIUM: 0.85,
            self.HARD: 0.70,
            self.EXPERT: 0.50
        }
        return rates.get(self, 0.80)


class ModelTier(Enum):
    """Model capability tiers."""
    FRONTIER = "frontier"
    BALANCED = "balanced"
    FAST = "fast"
    SPECIALIZED = "specialized"
    LEGACY = "legacy"

    @property
    def typical_latency_ms(self) -> int:
        latencies = {
            self.FRONTIER: 3000,
            self.BALANCED: 1500,
            self.FAST: 500,
            self.SPECIALIZED: 2000,
            self.LEGACY: 2500
        }
        return latencies.get(self, 1500)

    @property
    def cost_range(self) -> str:
        ranges = {
            self.FRONTIER: "$15-75/M tokens",
            self.BALANCED: "$3-15/M tokens",
            self.FAST: "$0.25-3/M tokens",
            self.SPECIALIZED: "$5-30/M tokens",
            self.LEGACY: "$1-10/M tokens"
        }
        return ranges.get(self, "varies")

    @property
    def best_for(self) -> List[str]:
        use_cases = {
            self.FRONTIER: ["complex reasoning", "research", "novel problems"],
            self.BALANCED: ["general tasks", "production workloads"],
            self.FAST: ["high volume", "real-time", "simple queries"],
            self.SPECIALIZED: ["domain expertise", "specific tasks"],
            self.LEGACY: ["backward compatibility", "cost savings"]
        }
        return use_cases.get(self, [])


class MetricType(Enum):
    """Types of benchmark metrics."""
    LATENCY = "latency"
    THROUGHPUT = "throughput"
    ACCURACY = "accuracy"
    COST = "cost"
    QUALITY = "quality"
    ERROR_RATE = "error_rate"
    TOKEN_EFFICIENCY = "token_efficiency"
    TTFT = "time_to_first_token"
    TPS = "tokens_per_second"
    CONTEXT_UTILIZATION = "context_utilization"

    @property
    def unit(self) -> str:
        units = {
            self.LATENCY: "ms",
            self.THROUGHPUT: "req/s",
            self.ACCURACY: "%",
            self.COST: "$",
            self.QUALITY: "/10",
            self.ERROR_RATE: "%",
            self.TOKEN_EFFICIENCY: "tokens",
            self.TTFT: "ms",
            self.TPS: "tok/s",
            self.CONTEXT_UTILIZATION: "%"
        }
        return units.get(self, "")

    @property
    def aggregation(self) -> str:
        aggs = {
            self.LATENCY: "percentile",
            self.THROUGHPUT: "mean",
            self.ACCURACY: "mean",
            self.COST: "sum",
            self.QUALITY: "mean",
            self.ERROR_RATE: "mean",
            self.TOKEN_EFFICIENCY: "median",
            self.TTFT: "percentile",
            self.TPS: "mean",
            self.CONTEXT_UTILIZATION: "mean"
        }
        return aggs.get(self, "mean")

    @property
    def lower_is_better(self) -> bool:
        return self in [self.LATENCY, self.COST, self.ERROR_RATE, self.TTFT]


class ComparisonResult(Enum):
    """Result of model comparison."""
    SIGNIFICANTLY_BETTER = "significantly_better"
    SLIGHTLY_BETTER = "slightly_better"
    EQUIVALENT = "equivalent"
    SLIGHTLY_WORSE = "slightly_worse"
    SIGNIFICANTLY_WORSE = "significantly_worse"

    @property
    def icon(self) -> str:
        icons = {
            self.SIGNIFICANTLY_BETTER: "⬆️⬆️",
            self.SLIGHTLY_BETTER: "⬆️",
            self.EQUIVALENT: "↔️",
            self.SLIGHTLY_WORSE: "⬇️",
            self.SIGNIFICANTLY_WORSE: "⬇️⬇️"
        }
        return icons.get(self, "❓")

    @property
    def threshold(self) -> float:
        thresholds = {
            self.SIGNIFICANTLY_BETTER: 0.20,
            self.SLIGHTLY_BETTER: 0.05,
            self.EQUIVALENT: 0.0,
            self.SLIGHTLY_WORSE: -0.05,
            self.SIGNIFICANTLY_WORSE: -0.20
        }
        return thresholds.get(self, 0.0)

    @classmethod
    def from_delta(cls, delta: float) -> 'ComparisonResult':
        """Determine comparison result from delta percentage."""
        if delta >= 0.20:
            return cls.SIGNIFICANTLY_BETTER
        elif delta >= 0.05:
            return cls.SLIGHTLY_BETTER
        elif delta >= -0.05:
            return cls.EQUIVALENT
        elif delta >= -0.20:
            return cls.SLIGHTLY_WORSE
        return cls.SIGNIFICANTLY_WORSE


class BenchmarkStatus(Enum):
    """Status of benchmark execution."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PARTIAL = "partial"

    @property
    def is_terminal(self) -> bool:
        return self in [self.COMPLETED, self.FAILED, self.CANCELLED]

    @property
    def icon(self) -> str:
        icons = {
            self.PENDING: "⏳",
            self.RUNNING: "🔄",
            self.COMPLETED: "✅",
            self.FAILED: "❌",
            self.CANCELLED: "🚫",
            self.PARTIAL: "⚠️"
        }
        return icons.get(self, "❓")


class RankingMethod(Enum):
    """Methods for ranking models."""
    WEIGHTED_SCORE = "weighted_score"
    ELO = "elo"
    BRADLEY_TERRY = "bradley_terry"
    BORDA_COUNT = "borda_count"
    PARETO = "pareto"

    @property
    def description(self) -> str:
        descriptions = {
            self.WEIGHTED_SCORE: "Sum of weighted category scores",
            self.ELO: "Chess-style rating from pairwise comparisons",
            self.BRADLEY_TERRY: "Probabilistic ranking model",
            self.BORDA_COUNT: "Points based on rank position",
            self.PARETO: "Non-dominated solutions"
        }
        return descriptions.get(self, "")


class UseCaseFit(Enum):
    """How well a model fits a use case."""
    EXCELLENT = "excellent"
    GOOD = "good"
    ADEQUATE = "adequate"
    POOR = "poor"
    NOT_RECOMMENDED = "not_recommended"

    @property
    def score_range(self) -> tuple:
        ranges = {
            self.EXCELLENT: (90, 100),
            self.GOOD: (75, 89),
            self.ADEQUATE: (60, 74),
            self.POOR: (40, 59),
            self.NOT_RECOMMENDED: (0, 39)
        }
        return ranges.get(self, (0, 100))

    @property
    def icon(self) -> str:
        icons = {
            self.EXCELLENT: "🌟",
            self.GOOD: "✅",
            self.ADEQUATE: "⚡",
            self.POOR: "⚠️",
            self.NOT_RECOMMENDED: "❌"
        }
        return icons.get(self, "❓")

    @classmethod
    def from_score(cls, score: float) -> 'UseCaseFit':
        for fit in cls:
            low, high = fit.score_range
            if low <= score <= high:
                return fit
        return cls.NOT_RECOMMENDED


# ============================================================
# DATACLASSES WITH BUSINESS LOGIC
# ============================================================

@dataclass
class BenchmarkTask:
    """Individual benchmark task definition."""
    id: str
    name: str
    description: str
    category: BenchmarkCategory
    difficulty: TaskDifficulty
    prompt_template: str
    expected_output_pattern: str = ""
    weight: float = 1.0
    timeout_seconds: int = 60

    @property
    def effective_weight(self) -> float:
        return self.weight * self.difficulty.complexity_multiplier

    @property
    def min_runs(self) -> int:
        return self.difficulty.recommended_runs

    def generate_id(self) -> str:
        content = f"{self.name}{self.category.value}{self.difficulty.value}"
        return hashlib.sha256(content.encode()).hexdigest()[:12]


@dataclass
class TaskResult:
    """Result from running a single task."""
    task_id: str
    model_id: str
    run_number: int
    passed: bool
    latency_ms: float
    input_tokens: int
    output_tokens: int
    quality_score: float = 0.0
    error_message: str = ""
    output: str = ""
    timestamp: datetime = field(default_factory=datetime.now)

    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens

    @property
    def tokens_per_second(self) -> float:
        if self.latency_ms > 0:
            return (self.output_tokens / self.latency_ms) * 1000
        return 0.0

    @property
    def cost_estimate(self) -> float:
        """Rough cost estimate assuming $15/M input, $60/M output."""
        input_cost = (self.input_tokens / 1_000_000) * 15
        output_cost = (self.output_tokens / 1_000_000) * 60
        return input_cost + output_cost


@dataclass
class ModelProfile:
    """Profile of a model being benchmarked."""
    id: str
    name: str
    provider: str
    tier: ModelTier
    version: str = ""
    context_window: int = 128000
    cost_per_1k_input: float = 0.0
    cost_per_1k_output: float = 0.0
    supports_tools: bool = True
    supports_vision: bool = False

    @property
    def cost_per_task(self) -> Callable[[int, int], float]:
        """Return function to calculate cost for given tokens."""
        def calculate(input_tokens: int, output_tokens: int) -> float:
            input_cost = (input_tokens / 1000) * self.cost_per_1k_input
            output_cost = (output_tokens / 1000) * self.cost_per_1k_output
            return input_cost + output_cost
        return calculate

    @property
    def display_name(self) -> str:
        if self.version:
            return f"{self.name} ({self.version})"
        return self.name


@dataclass
class MetricValue:
    """A measured metric value with statistics."""
    metric_type: MetricType
    values: List[float] = field(default_factory=list)

    @property
    def count(self) -> int:
        return len(self.values)

    @property
    def mean_value(self) -> float:
        return mean(self.values) if self.values else 0.0

    @property
    def median_value(self) -> float:
        return median(self.values) if self.values else 0.0

    @property
    def std_dev(self) -> float:
        return stdev(self.values) if len(self.values) > 1 else 0.0

    @property
    def min_value(self) -> float:
        return min(self.values) if self.values else 0.0

    @property
    def max_value(self) -> float:
        return max(self.values) if self.values else 0.0

    def percentile(self, p: int) -> float:
        """Calculate percentile (p50, p95, p99)."""
        if not self.values:
            return 0.0
        sorted_values = sorted(self.values)
        idx = int(len(sorted_values) * p / 100)
        return sorted_values[min(idx, len(sorted_values) - 1)]

    @property
    def aggregated_value(self) -> float:
        """Get value based on metric's aggregation method."""
        if self.metric_type.aggregation == "percentile":
            return self.percentile(50)
        elif self.metric_type.aggregation == "median":
            return self.median_value
        elif self.metric_type.aggregation == "sum":
            return sum(self.values)
        return self.mean_value

    def add_value(self, value: float):
        self.values.append(value)


@dataclass
class CategoryScore:
    """Score for a benchmark category."""
    category: BenchmarkCategory
    raw_score: float
    normalized_score: float
    task_count: int
    pass_rate: float
    metrics: Dict[MetricType, MetricValue] = field(default_factory=dict)

    @property
    def weighted_score(self) -> float:
        return self.normalized_score * self.category.weight

    @property
    def grade(self) -> str:
        """Letter grade based on normalized score."""
        if self.normalized_score >= 90:
            return "A"
        elif self.normalized_score >= 80:
            return "B"
        elif self.normalized_score >= 70:
            return "C"
        elif self.normalized_score >= 60:
            return "D"
        return "F"


@dataclass
class ModelBenchmarkResult:
    """Complete benchmark results for a model."""
    model: ModelProfile
    category_scores: Dict[BenchmarkCategory, CategoryScore] = field(default_factory=dict)
    task_results: List[TaskResult] = field(default_factory=list)
    status: BenchmarkStatus = BenchmarkStatus.PENDING
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    @property
    def overall_score(self) -> float:
        if not self.category_scores:
            return 0.0
        return sum(cs.weighted_score for cs in self.category_scores.values())

    @property
    def total_pass_rate(self) -> float:
        if not self.task_results:
            return 0.0
        passed = sum(1 for r in self.task_results if r.passed)
        return passed / len(self.task_results)

    @property
    def total_cost(self) -> float:
        return sum(r.cost_estimate for r in self.task_results)

    @property
    def average_latency(self) -> float:
        if not self.task_results:
            return 0.0
        return mean(r.latency_ms for r in self.task_results)

    @property
    def duration_seconds(self) -> float:
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return 0.0

    def get_best_category(self) -> Optional[BenchmarkCategory]:
        if not self.category_scores:
            return None
        return max(self.category_scores.items(),
                   key=lambda x: x[1].normalized_score)[0]

    def get_worst_category(self) -> Optional[BenchmarkCategory]:
        if not self.category_scores:
            return None
        return min(self.category_scores.items(),
                   key=lambda x: x[1].normalized_score)[0]


@dataclass
class BenchmarkComparison:
    """Comparison between two models."""
    model_a: ModelProfile
    model_b: ModelProfile
    result_a: ModelBenchmarkResult
    result_b: ModelBenchmarkResult

    @property
    def score_delta(self) -> float:
        return self.result_a.overall_score - self.result_b.overall_score

    @property
    def score_delta_percent(self) -> float:
        if self.result_b.overall_score == 0:
            return 0.0
        return self.score_delta / self.result_b.overall_score

    @property
    def comparison_result(self) -> ComparisonResult:
        return ComparisonResult.from_delta(self.score_delta_percent)

    @property
    def cost_delta(self) -> float:
        return self.result_a.total_cost - self.result_b.total_cost

    @property
    def latency_delta(self) -> float:
        return self.result_a.average_latency - self.result_b.average_latency

    def get_category_comparison(self, category: BenchmarkCategory) -> ComparisonResult:
        score_a = self.result_a.category_scores.get(category)
        score_b = self.result_b.category_scores.get(category)

        if not score_a or not score_b:
            return ComparisonResult.EQUIVALENT

        delta = score_a.normalized_score - score_b.normalized_score
        delta_pct = delta / max(score_b.normalized_score, 1)
        return ComparisonResult.from_delta(delta_pct)


@dataclass
class UseCaseRecommendation:
    """Recommendation for a specific use case."""
    use_case: str
    recommended_model: ModelProfile
    fit: UseCaseFit
    score: float
    rationale: str
    alternatives: List[ModelProfile] = field(default_factory=list)


@dataclass
class BenchmarkSuite:
    """Complete benchmark suite definition."""
    id: str
    name: str
    description: str
    tasks: List[BenchmarkTask] = field(default_factory=list)
    models: List[ModelProfile] = field(default_factory=list)
    config: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def task_count(self) -> int:
        return len(self.tasks)

    @property
    def model_count(self) -> int:
        return len(self.models)

    @property
    def total_runs(self) -> int:
        return sum(t.min_runs for t in self.tasks) * len(self.models)

    @property
    def estimated_duration_minutes(self) -> float:
        avg_timeout = mean(t.timeout_seconds for t in self.tasks) if self.tasks else 30
        return (self.total_runs * avg_timeout) / 60


# ============================================================
# ENGINE CLASSES
# ============================================================

class TaskDesigner:
    """Designs and manages benchmark tasks."""

    TASK_TEMPLATES = {
        BenchmarkCategory.REASONING: [
            "Solve this logic puzzle: {puzzle}",
            "Given these premises, what can we conclude? {premises}",
            "Explain the flaw in this argument: {argument}"
        ],
        BenchmarkCategory.CODING: [
            "Write a function that: {spec}",
            "Debug this code: {code}",
            "Refactor this code for better performance: {code}"
        ],
        BenchmarkCategory.ACCURACY: [
            "Answer this factual question: {question}",
            "Extract the following information: {extraction_spec}",
            "Classify this text: {text}"
        ],
        BenchmarkCategory.CREATIVITY: [
            "Write a short story about: {topic}",
            "Generate creative alternatives for: {item}",
            "Create an analogy for: {concept}"
        ]
    }

    def __init__(self):
        self.tasks: Dict[str, BenchmarkTask] = {}

    def create_task(self, name: str, description: str,
                    category: BenchmarkCategory,
                    difficulty: TaskDifficulty,
                    prompt_template: str) -> BenchmarkTask:
        """Create a new benchmark task."""
        task = BenchmarkTask(
            id="",
            name=name,
            description=description,
            category=category,
            difficulty=difficulty,
            prompt_template=prompt_template
        )
        task.id = task.generate_id()
        self.tasks[task.id] = task
        return task

    def create_standard_suite(self, categories: List[BenchmarkCategory] = None) -> List[BenchmarkTask]:
        """Create a standard benchmark suite."""
        categories = categories or list(BenchmarkCategory)
        tasks = []

        for category in categories:
            templates = self.TASK_TEMPLATES.get(category, [])
            for i, template in enumerate(templates):
                task = self.create_task(
                    name=f"{category.value}_task_{i+1}",
                    description=f"Standard {category.value} benchmark task {i+1}",
                    category=category,
                    difficulty=TaskDifficulty.MEDIUM,
                    prompt_template=template
                )
                tasks.append(task)

        return tasks

    def get_tasks_by_category(self, category: BenchmarkCategory) -> List[BenchmarkTask]:
        return [t for t in self.tasks.values() if t.category == category]

    def get_tasks_by_difficulty(self, difficulty: TaskDifficulty) -> List[BenchmarkTask]:
        return [t for t in self.tasks.values() if t.difficulty == difficulty]


class MetricsCollector:
    """Collects and aggregates benchmark metrics."""

    def __init__(self):
        self.metrics: Dict[str, Dict[MetricType, MetricValue]] = {}

    def record_result(self, model_id: str, result: TaskResult):
        """Record task result metrics."""
        if model_id not in self.metrics:
            self.metrics[model_id] = {mt: MetricValue(mt) for mt in MetricType}

        model_metrics = self.metrics[model_id]

        model_metrics[MetricType.LATENCY].add_value(result.latency_ms)
        model_metrics[MetricType.ACCURACY].add_value(100.0 if result.passed else 0.0)
        model_metrics[MetricType.COST].add_value(result.cost_estimate)
        model_metrics[MetricType.QUALITY].add_value(result.quality_score)
        model_metrics[MetricType.TOKEN_EFFICIENCY].add_value(result.total_tokens)
        model_metrics[MetricType.TPS].add_value(result.tokens_per_second)

        if not result.passed:
            model_metrics[MetricType.ERROR_RATE].add_value(1.0)
        else:
            model_metrics[MetricType.ERROR_RATE].add_value(0.0)

    def get_latency_percentiles(self, model_id: str) -> Dict[str, float]:
        """Get latency percentiles for a model."""
        if model_id not in self.metrics:
            return {}

        latency = self.metrics[model_id][MetricType.LATENCY]
        return {
            "p50": latency.percentile(50),
            "p95": latency.percentile(95),
            "p99": latency.percentile(99)
        }

    def get_summary(self, model_id: str) -> Dict[str, float]:
        """Get metric summary for a model."""
        if model_id not in self.metrics:
            return {}

        return {
            mt.value: mv.aggregated_value
            for mt, mv in self.metrics[model_id].items()
        }

    def compare_metrics(self, model_a: str, model_b: str,
                        metric: MetricType) -> ComparisonResult:
        """Compare a specific metric between two models."""
        if model_a not in self.metrics or model_b not in self.metrics:
            return ComparisonResult.EQUIVALENT

        value_a = self.metrics[model_a][metric].aggregated_value
        value_b = self.metrics[model_b][metric].aggregated_value

        if value_b == 0:
            return ComparisonResult.EQUIVALENT

        # Invert delta for metrics where lower is better
        delta = (value_a - value_b) / value_b
        if metric.lower_is_better:
            delta = -delta

        return ComparisonResult.from_delta(delta)


class ScoringEngine:
    """Calculates scores and rankings."""

    def __init__(self):
        self.category_weights: Dict[BenchmarkCategory, float] = {
            cat: cat.weight for cat in BenchmarkCategory
        }

    def set_weight(self, category: BenchmarkCategory, weight: float):
        """Customize category weight."""
        self.category_weights[category] = weight

    def normalize_score(self, raw_score: float, min_score: float = 0.0,
                        max_score: float = 100.0) -> float:
        """Normalize score to 0-100 range."""
        if max_score == min_score:
            return 50.0
        return ((raw_score - min_score) / (max_score - min_score)) * 100

    def calculate_category_score(self, results: List[TaskResult],
                                  category: BenchmarkCategory) -> CategoryScore:
        """Calculate score for a category."""
        category_results = [r for r in results if r.task_id.startswith(category.value)]

        if not category_results:
            return CategoryScore(
                category=category,
                raw_score=0.0,
                normalized_score=0.0,
                task_count=0,
                pass_rate=0.0
            )

        passed = sum(1 for r in category_results if r.passed)
        pass_rate = passed / len(category_results)

        avg_quality = mean(r.quality_score for r in category_results) if category_results else 0.0

        raw_score = (pass_rate * 60) + (avg_quality * 40)
        normalized = self.normalize_score(raw_score)

        return CategoryScore(
            category=category,
            raw_score=raw_score,
            normalized_score=normalized,
            task_count=len(category_results),
            pass_rate=pass_rate
        )

    def calculate_overall_score(self, category_scores: Dict[BenchmarkCategory, CategoryScore]) -> float:
        """Calculate weighted overall score."""
        total_weight = sum(self.category_weights.get(cat, 0) for cat in category_scores.keys())

        if total_weight == 0:
            return 0.0

        weighted_sum = sum(
            score.normalized_score * self.category_weights.get(cat, 0)
            for cat, score in category_scores.items()
        )

        return weighted_sum / total_weight

    def rank_models(self, results: Dict[str, ModelBenchmarkResult],
                    method: RankingMethod = RankingMethod.WEIGHTED_SCORE) -> List[tuple]:
        """Rank models by overall score."""
        if method == RankingMethod.WEIGHTED_SCORE:
            rankings = [(model_id, r.overall_score) for model_id, r in results.items()]
            return sorted(rankings, key=lambda x: x[1], reverse=True)

        elif method == RankingMethod.BORDA_COUNT:
            # Rank by each category, sum positions
            category_rankings = {}
            for cat in BenchmarkCategory:
                cat_scores = [
                    (model_id, r.category_scores.get(cat, CategoryScore(cat, 0, 0, 0, 0)).normalized_score)
                    for model_id, r in results.items()
                ]
                sorted_cat = sorted(cat_scores, key=lambda x: x[1], reverse=True)
                for rank, (model_id, _) in enumerate(sorted_cat):
                    if model_id not in category_rankings:
                        category_rankings[model_id] = 0
                    category_rankings[model_id] += len(results) - rank

            return sorted(category_rankings.items(), key=lambda x: x[1], reverse=True)

        # Default to weighted score
        return self.rank_models(results, RankingMethod.WEIGHTED_SCORE)


class RecommendationEngine:
    """Generates model recommendations for use cases."""

    USE_CASE_REQUIREMENTS = {
        "complex_reasoning": {
            BenchmarkCategory.REASONING: 0.4,
            BenchmarkCategory.ACCURACY: 0.3,
            BenchmarkCategory.QUALITY: 0.2,
            BenchmarkCategory.CONSISTENCY: 0.1
        },
        "high_volume": {
            BenchmarkCategory.SPEED: 0.4,
            BenchmarkCategory.COST: 0.3,
            BenchmarkCategory.CONSISTENCY: 0.2,
            BenchmarkCategory.ACCURACY: 0.1
        },
        "code_generation": {
            BenchmarkCategory.CODING: 0.4,
            BenchmarkCategory.ACCURACY: 0.3,
            BenchmarkCategory.QUALITY: 0.2,
            BenchmarkCategory.REASONING: 0.1
        },
        "content_creation": {
            BenchmarkCategory.CREATIVITY: 0.3,
            BenchmarkCategory.QUALITY: 0.3,
            BenchmarkCategory.INSTRUCTION_FOLLOWING: 0.2,
            BenchmarkCategory.CONSISTENCY: 0.2
        },
        "safety_critical": {
            BenchmarkCategory.SAFETY: 0.5,
            BenchmarkCategory.ACCURACY: 0.3,
            BenchmarkCategory.CONSISTENCY: 0.2
        }
    }

    def __init__(self, results: Dict[str, ModelBenchmarkResult]):
        self.results = results

    def calculate_use_case_fit(self, model_id: str, use_case: str) -> float:
        """Calculate how well a model fits a use case."""
        if model_id not in self.results or use_case not in self.USE_CASE_REQUIREMENTS:
            return 0.0

        result = self.results[model_id]
        requirements = self.USE_CASE_REQUIREMENTS[use_case]

        weighted_score = 0.0
        for category, weight in requirements.items():
            cat_score = result.category_scores.get(category)
            if cat_score:
                weighted_score += cat_score.normalized_score * weight

        return weighted_score

    def recommend_for_use_case(self, use_case: str) -> UseCaseRecommendation:
        """Get model recommendation for a use case."""
        scores = [
            (model_id, self.calculate_use_case_fit(model_id, use_case))
            for model_id in self.results.keys()
        ]

        sorted_scores = sorted(scores, key=lambda x: x[1], reverse=True)

        if not sorted_scores:
            return None

        best_model_id, best_score = sorted_scores[0]
        best_model = self.results[best_model_id].model

        alternatives = [
            self.results[mid].model
            for mid, _ in sorted_scores[1:4]
        ]

        fit = UseCaseFit.from_score(best_score)

        return UseCaseRecommendation(
            use_case=use_case,
            recommended_model=best_model,
            fit=fit,
            score=best_score,
            rationale=f"Best {use_case} performance with score {best_score:.1f}",
            alternatives=alternatives
        )

    def generate_all_recommendations(self) -> Dict[str, UseCaseRecommendation]:
        """Generate recommendations for all use cases."""
        return {
            use_case: self.recommend_for_use_case(use_case)
            for use_case in self.USE_CASE_REQUIREMENTS.keys()
        }


class ModelBenchmarkEngine:
    """Main orchestrator for model benchmarking."""

    def __init__(self):
        self.task_designer = TaskDesigner()
        self.metrics = MetricsCollector()
        self.scoring = ScoringEngine()
        self.results: Dict[str, ModelBenchmarkResult] = {}
        self.models: Dict[str, ModelProfile] = {}
        self.suites: Dict[str, BenchmarkSuite] = {}

    def register_model(self, model: ModelProfile):
        """Register a model for benchmarking."""
        self.models[model.id] = model
        self.results[model.id] = ModelBenchmarkResult(model=model)

    def create_suite(self, name: str, description: str,
                     categories: List[BenchmarkCategory] = None) -> BenchmarkSuite:
        """Create a benchmark suite."""
        tasks = self.task_designer.create_standard_suite(categories)

        suite = BenchmarkSuite(
            id=hashlib.sha256(name.encode()).hexdigest()[:12],
            name=name,
            description=description,
            tasks=tasks,
            models=list(self.models.values())
        )

        self.suites[suite.id] = suite
        return suite

    def record_task_result(self, model_id: str, result: TaskResult):
        """Record a task result."""
        if model_id not in self.results:
            return

        self.results[model_id].task_results.append(result)
        self.metrics.record_result(model_id, result)

    def finalize_benchmark(self, model_id: str):
        """Calculate final scores for a model."""
        if model_id not in self.results:
            return

        result = self.results[model_id]
        result.completed_at = datetime.now()
        result.status = BenchmarkStatus.COMPLETED

        # Calculate category scores
        for category in BenchmarkCategory:
            cat_score = self.scoring.calculate_category_score(
                result.task_results, category
            )
            result.category_scores[category] = cat_score

    def compare_models(self, model_a_id: str, model_b_id: str) -> Optional[BenchmarkComparison]:
        """Compare two models."""
        if model_a_id not in self.results or model_b_id not in self.results:
            return None

        return BenchmarkComparison(
            model_a=self.models[model_a_id],
            model_b=self.models[model_b_id],
            result_a=self.results[model_a_id],
            result_b=self.results[model_b_id]
        )

    def get_rankings(self, method: RankingMethod = RankingMethod.WEIGHTED_SCORE) -> List[tuple]:
        """Get model rankings."""
        return self.scoring.rank_models(self.results, method)

    def get_recommendations(self) -> Dict[str, UseCaseRecommendation]:
        """Get use case recommendations."""
        engine = RecommendationEngine(self.results)
        return engine.generate_all_recommendations()


# ============================================================
# REPORTER CLASS
# ============================================================

class BenchmarkReporter:
    """Generates benchmark reports and visualizations."""

    def __init__(self, engine: ModelBenchmarkEngine):
        self.engine = engine

    def generate_summary_report(self) -> str:
        """Generate executive summary report."""
        rankings = self.engine.get_rankings()

        lines = [
            "MODEL BENCHMARKING REPORT",
            "=" * 55,
            f"Models Tested: {len(self.engine.models)}",
            f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "=" * 55,
            "",
            "RANKINGS",
            "-" * 40
        ]

        for rank, (model_id, score) in enumerate(rankings, 1):
            model = self.engine.models[model_id]
            bar_len = int(score / 5)
            bar = "█" * bar_len + "░" * (20 - bar_len)
            lines.append(f"  {rank}. {model.display_name:25} {bar} {score:.1f}")

        if rankings:
            winner_id = rankings[0][0]
            winner = self.engine.models[winner_id]
            result = self.engine.results[winner_id]

            lines.extend([
                "",
                "WINNER DETAILS",
                "-" * 40,
                f"  Model: {winner.display_name}",
                f"  Tier: {winner.tier.value}",
                f"  Score: {result.overall_score:.1f}/100",
                f"  Pass Rate: {result.total_pass_rate*100:.1f}%",
                f"  Avg Latency: {result.average_latency:.0f}ms",
                f"  Total Cost: ${result.total_cost:.4f}"
            ])

            if result.get_best_category():
                lines.append(f"  Best At: {result.get_best_category().value}")
            if result.get_worst_category():
                lines.append(f"  Worst At: {result.get_worst_category().value}")

        return "\n".join(lines)

    def generate_model_report(self, model_id: str) -> str:
        """Generate detailed report for a single model."""
        if model_id not in self.engine.results:
            return f"No results for model: {model_id}"

        result = self.engine.results[model_id]
        model = result.model

        lines = [
            f"MODEL REPORT: {model.display_name}",
            "=" * 55,
            f"Provider: {model.provider}",
            f"Tier: {model.tier.value}",
            f"Status: {result.status.icon} {result.status.value}",
            "=" * 55,
            "",
            f"Overall Score: {result.overall_score:.1f}/100",
            "",
            "CATEGORY SCORES",
            "-" * 40
        ]

        for cat, score in sorted(result.category_scores.items(),
                                  key=lambda x: x[1].normalized_score, reverse=True):
            bar_len = int(score.normalized_score / 5)
            bar = "█" * bar_len + "░" * (20 - bar_len)
            lines.append(f"  {cat.value:20} {bar} {score.normalized_score:.1f} ({score.grade})")

        lines.extend([
            "",
            "METRICS SUMMARY",
            "-" * 40
        ])

        metrics = self.engine.metrics.get_summary(model_id)
        for metric_name, value in metrics.items():
            mt = MetricType(metric_name)
            lines.append(f"  {metric_name:20} {value:.2f} {mt.unit}")

        percentiles = self.engine.metrics.get_latency_percentiles(model_id)
        if percentiles:
            lines.extend([
                "",
                "LATENCY PERCENTILES",
                "-" * 40,
                f"  p50: {percentiles.get('p50', 0):.0f}ms",
                f"  p95: {percentiles.get('p95', 0):.0f}ms",
                f"  p99: {percentiles.get('p99', 0):.0f}ms"
            ])

        return "\n".join(lines)

    def generate_comparison_report(self, model_a_id: str, model_b_id: str) -> str:
        """Generate comparison report between two models."""
        comparison = self.engine.compare_models(model_a_id, model_b_id)

        if not comparison:
            return "Cannot compare models"

        lines = [
            "MODEL COMPARISON",
            "=" * 55,
            f"Model A: {comparison.model_a.display_name}",
            f"Model B: {comparison.model_b.display_name}",
            "",
            f"Result: {comparison.comparison_result.icon} {comparison.comparison_result.value}",
            f"Score Delta: {comparison.score_delta:+.1f} ({comparison.score_delta_percent*100:+.1f}%)",
            "",
            "CATEGORY COMPARISON",
            "-" * 40
        ]

        for cat in BenchmarkCategory:
            cat_result = comparison.get_category_comparison(cat)
            score_a = comparison.result_a.category_scores.get(cat)
            score_b = comparison.result_b.category_scores.get(cat)

            if score_a and score_b:
                lines.append(
                    f"  {cat.value:20} {cat_result.icon} "
                    f"A:{score_a.normalized_score:.0f} vs B:{score_b.normalized_score:.0f}"
                )

        lines.extend([
            "",
            "TRADE-OFFS",
            "-" * 40,
            f"  Cost: A=${comparison.result_a.total_cost:.4f} vs B=${comparison.result_b.total_cost:.4f}",
            f"  Latency: A={comparison.result_a.average_latency:.0f}ms vs B={comparison.result_b.average_latency:.0f}ms"
        ])

        return "\n".join(lines)

    def generate_recommendations_report(self) -> str:
        """Generate use case recommendations report."""
        recommendations = self.engine.get_recommendations()

        lines = [
            "USE CASE RECOMMENDATIONS",
            "=" * 55,
            ""
        ]

        for use_case, rec in recommendations.items():
            if rec:
                lines.extend([
                    f"{use_case.upper()}",
                    "-" * 40,
                    f"  {rec.fit.icon} Recommended: {rec.recommended_model.display_name}",
                    f"  Fit: {rec.fit.value} (Score: {rec.score:.1f})",
                    f"  Rationale: {rec.rationale}",
                    f"  Alternatives: {', '.join(m.name for m in rec.alternatives[:3])}",
                    ""
                ])

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli():
    """Create command-line interface."""
    import argparse

    parser = argparse.ArgumentParser(
        prog="model-benchmark",
        description="AI Model Performance Analyst"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Summary command
    summary_parser = subparsers.add_parser("summary", help="Show benchmark summary")
    summary_parser.add_argument("--format", choices=["text", "json"], default="text")

    # Model command
    model_parser = subparsers.add_parser("model", help="Show model report")
    model_parser.add_argument("model_id", help="Model ID")

    # Compare command
    compare_parser = subparsers.add_parser("compare", help="Compare two models")
    compare_parser.add_argument("model_a", help="First model ID")
    compare_parser.add_argument("model_b", help="Second model ID")

    # Rankings command
    rank_parser = subparsers.add_parser("rankings", help="Show model rankings")
    rank_parser.add_argument("--method", choices=[m.value for m in RankingMethod],
                             default="weighted_score")

    # Recommend command
    rec_parser = subparsers.add_parser("recommend", help="Get use case recommendations")
    rec_parser.add_argument("--use-case", help="Specific use case")

    # Suite command
    suite_parser = subparsers.add_parser("suite", help="Create benchmark suite")
    suite_parser.add_argument("name", help="Suite name")
    suite_parser.add_argument("--categories", nargs="+", help="Categories to include")

    return parser


def main():
    """Main entry point."""
    parser = create_cli()
    args = parser.parse_args()

    # Initialize engine with sample data
    engine = ModelBenchmarkEngine()
    reporter = BenchmarkReporter(engine)

    if args.command == "summary":
        print(reporter.generate_summary_report())

    elif args.command == "model":
        print(reporter.generate_model_report(args.model_id))

    elif args.command == "compare":
        print(reporter.generate_comparison_report(args.model_a, args.model_b))

    elif args.command == "rankings":
        method = RankingMethod(args.method)
        rankings = engine.get_rankings(method)
        for rank, (model_id, score) in enumerate(rankings, 1):
            print(f"  {rank}. {model_id}: {score:.1f}")

    elif args.command == "recommend":
        print(reporter.generate_recommendations_report())

    elif args.command == "suite":
        categories = None
        if args.categories:
            categories = [BenchmarkCategory(c) for c in args.categories]
        suite = engine.create_suite(args.name, "Custom benchmark suite", categories)
        print(f"Created suite: {suite.id}")
        print(f"  Tasks: {suite.task_count}")
        print(f"  Est. Duration: {suite.estimated_duration_minutes:.1f} min")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

## QUICK COMMANDS

- `/model-benchmark` - Full benchmarking report
- `/model-benchmark [models]` - Compare specific models
- `/model-benchmark tasks` - Task design template
- `/model-benchmark cost` - Cost analysis focus
- `/model-benchmark recommend` - Use case recommendations

$ARGUMENTS
