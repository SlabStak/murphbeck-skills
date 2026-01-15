# MODEL.ARBITRATION.OS.EXE - Cross-Model Arbitration & Selection OS

You are MODEL.ARBITRATION.OS.EXE — a neutral arbiter across multiple AI models for optimal task routing.

MISSION
Select or combine model outputs based on quality, risk, latency, and cost. Prefer simplest model that meets requirements. Safety overrides performance.

---

## CAPABILITIES

### TaskAnalyzer.MOD
- Task classification
- Complexity assessment
- Requirement extraction
- Constraint mapping
- Risk profiling

### ModelProfiler.MOD
- Capability mapping
- Performance benchmarks
- Cost modeling
- Latency profiles
- Safety ratings

### ScoringEngine.MOD
- Criteria weighting
- Score normalization
- Trade-off analysis
- Confidence intervals
- Uncertainty handling

### DecisionRouter.MOD
- Selection logic
- Fallback chains
- Ensemble strategies
- Load balancing
- Result aggregation

---

## PRODUCTION IMPLEMENTATION

```python
"""
MODEL.ARBITRATION.OS.EXE - Cross-Model Arbitration & Selection
Production-ready model routing and selection system.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Dict, List, Any, Callable, Tuple
import hashlib
import json
from statistics import mean, stdev
import random


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class TaskComplexity(Enum):
    """Task complexity levels for routing."""
    TRIVIAL = "trivial"
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"
    EXPERT = "expert"

    @property
    def min_model_tier(self) -> 'ModelTier':
        tier_map = {
            self.TRIVIAL: ModelTier.FAST,
            self.SIMPLE: ModelTier.FAST,
            self.MODERATE: ModelTier.BALANCED,
            self.COMPLEX: ModelTier.BALANCED,
            self.EXPERT: ModelTier.FRONTIER
        }
        return tier_map.get(self, ModelTier.BALANCED)

    @property
    def timeout_multiplier(self) -> float:
        multipliers = {
            self.TRIVIAL: 0.5,
            self.SIMPLE: 0.75,
            self.MODERATE: 1.0,
            self.COMPLEX: 1.5,
            self.EXPERT: 2.0
        }
        return multipliers.get(self, 1.0)

    @property
    def score_threshold(self) -> float:
        """Minimum quality score threshold."""
        thresholds = {
            self.TRIVIAL: 0.60,
            self.SIMPLE: 0.70,
            self.MODERATE: 0.80,
            self.COMPLEX: 0.85,
            self.EXPERT: 0.90
        }
        return thresholds.get(self, 0.80)


class ModelTier(Enum):
    """Model capability tiers."""
    FRONTIER = "frontier"
    BALANCED = "balanced"
    FAST = "fast"
    SPECIALIZED = "specialized"
    LOCAL = "local"

    @property
    def priority(self) -> int:
        priorities = {
            self.FRONTIER: 5,
            self.BALANCED: 4,
            self.FAST: 2,
            self.SPECIALIZED: 3,
            self.LOCAL: 1
        }
        return priorities.get(self, 2)

    @property
    def typical_cost_per_1k(self) -> float:
        costs = {
            self.FRONTIER: 15.0,
            self.BALANCED: 3.0,
            self.FAST: 0.25,
            self.SPECIALIZED: 5.0,
            self.LOCAL: 0.01
        }
        return costs.get(self, 3.0)

    @property
    def typical_latency_ms(self) -> int:
        latencies = {
            self.FRONTIER: 3000,
            self.BALANCED: 1500,
            self.FAST: 400,
            self.SPECIALIZED: 2000,
            self.LOCAL: 200
        }
        return latencies.get(self, 1500)

    @property
    def capabilities(self) -> List[str]:
        caps = {
            self.FRONTIER: ["reasoning", "coding", "analysis", "creativity", "multimodal"],
            self.BALANCED: ["reasoning", "coding", "analysis", "creativity"],
            self.FAST: ["classification", "extraction", "simple_qa"],
            self.SPECIALIZED: ["domain_specific"],
            self.LOCAL: ["privacy_sensitive", "offline"]
        }
        return caps.get(self, [])


class RiskLevel(Enum):
    """Risk levels for task execution."""
    MINIMAL = "minimal"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

    @property
    def requires_frontier(self) -> bool:
        return self in [self.HIGH, self.CRITICAL]

    @property
    def requires_human_review(self) -> bool:
        return self == self.CRITICAL

    @property
    def safety_weight(self) -> float:
        weights = {
            self.MINIMAL: 0.1,
            self.LOW: 0.2,
            self.MEDIUM: 0.3,
            self.HIGH: 0.5,
            self.CRITICAL: 0.8
        }
        return weights.get(self, 0.3)

    @property
    def max_retries(self) -> int:
        retries = {
            self.MINIMAL: 5,
            self.LOW: 3,
            self.MEDIUM: 2,
            self.HIGH: 1,
            self.CRITICAL: 0
        }
        return retries.get(self, 2)


class SelectionCriterion(Enum):
    """Criteria for model selection."""
    QUALITY = "quality"
    LATENCY = "latency"
    COST = "cost"
    SAFETY = "safety"
    RELIABILITY = "reliability"
    CAPABILITY = "capability"
    CONSISTENCY = "consistency"
    PRIVACY = "privacy"
    COMPLIANCE = "compliance"
    AVAILABILITY = "availability"

    @property
    def default_weight(self) -> float:
        weights = {
            self.QUALITY: 0.25,
            self.LATENCY: 0.10,
            self.COST: 0.15,
            self.SAFETY: 0.20,
            self.RELIABILITY: 0.10,
            self.CAPABILITY: 0.10,
            self.CONSISTENCY: 0.05,
            self.PRIVACY: 0.02,
            self.COMPLIANCE: 0.02,
            self.AVAILABILITY: 0.01
        }
        return weights.get(self, 0.05)

    @property
    def is_required(self) -> bool:
        return self in [self.SAFETY, self.CAPABILITY]

    @property
    def higher_is_better(self) -> bool:
        return self not in [self.LATENCY, self.COST]


class RoutingStrategy(Enum):
    """Model routing strategies."""
    SINGLE_BEST = "single_best"
    FALLBACK_CHAIN = "fallback_chain"
    ENSEMBLE_VOTING = "ensemble_voting"
    ENSEMBLE_WEIGHTED = "ensemble_weighted"
    PARALLEL_RACE = "parallel_race"
    CASCADE = "cascade"
    ROUND_ROBIN = "round_robin"
    LEAST_COST = "least_cost"
    LOWEST_LATENCY = "lowest_latency"
    HIGHEST_QUALITY = "highest_quality"

    @property
    def uses_multiple_models(self) -> bool:
        return self in [
            self.FALLBACK_CHAIN, self.ENSEMBLE_VOTING,
            self.ENSEMBLE_WEIGHTED, self.PARALLEL_RACE,
            self.CASCADE, self.ROUND_ROBIN
        ]

    @property
    def cost_multiplier(self) -> float:
        multipliers = {
            self.SINGLE_BEST: 1.0,
            self.FALLBACK_CHAIN: 1.2,
            self.ENSEMBLE_VOTING: 3.0,
            self.ENSEMBLE_WEIGHTED: 3.0,
            self.PARALLEL_RACE: 2.0,
            self.CASCADE: 1.5,
            self.ROUND_ROBIN: 1.0,
            self.LEAST_COST: 0.8,
            self.LOWEST_LATENCY: 1.0,
            self.HIGHEST_QUALITY: 1.5
        }
        return multipliers.get(self, 1.0)

    @property
    def description(self) -> str:
        descriptions = {
            self.SINGLE_BEST: "Route to single highest-scoring model",
            self.FALLBACK_CHAIN: "Try models in sequence until success",
            self.ENSEMBLE_VOTING: "Majority vote from multiple models",
            self.ENSEMBLE_WEIGHTED: "Weighted combination of model outputs",
            self.PARALLEL_RACE: "First successful response wins",
            self.CASCADE: "Start fast, escalate if needed",
            self.ROUND_ROBIN: "Distribute load evenly",
            self.LEAST_COST: "Minimize cost while meeting threshold",
            self.LOWEST_LATENCY: "Minimize response time",
            self.HIGHEST_QUALITY: "Maximize output quality"
        }
        return descriptions.get(self, "")


class DecisionConfidence(Enum):
    """Confidence level in routing decision."""
    VERY_HIGH = "very_high"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    VERY_LOW = "very_low"

    @property
    def score_range(self) -> Tuple[float, float]:
        ranges = {
            self.VERY_HIGH: (0.90, 1.00),
            self.HIGH: (0.75, 0.89),
            self.MEDIUM: (0.50, 0.74),
            self.LOW: (0.25, 0.49),
            self.VERY_LOW: (0.00, 0.24)
        }
        return ranges.get(self, (0.0, 1.0))

    @property
    def should_log(self) -> bool:
        return self in [self.LOW, self.VERY_LOW]

    @property
    def allow_auto_routing(self) -> bool:
        return self in [self.VERY_HIGH, self.HIGH, self.MEDIUM]

    @classmethod
    def from_score(cls, score: float) -> 'DecisionConfidence':
        for conf in cls:
            low, high = conf.score_range
            if low <= score <= high:
                return conf
        return cls.VERY_LOW


class FallbackReason(Enum):
    """Reasons for falling back to another model."""
    PRIMARY_UNAVAILABLE = "primary_unavailable"
    TIMEOUT = "timeout"
    RATE_LIMITED = "rate_limited"
    QUALITY_BELOW_THRESHOLD = "quality_below_threshold"
    SAFETY_VIOLATION = "safety_violation"
    BUDGET_EXCEEDED = "budget_exceeded"
    ERROR = "error"
    CIRCUIT_OPEN = "circuit_open"

    @property
    def is_retriable(self) -> bool:
        return self in [
            self.TIMEOUT, self.RATE_LIMITED,
            self.PRIMARY_UNAVAILABLE, self.ERROR
        ]

    @property
    def cooldown_seconds(self) -> int:
        cooldowns = {
            self.PRIMARY_UNAVAILABLE: 300,
            self.TIMEOUT: 30,
            self.RATE_LIMITED: 60,
            self.QUALITY_BELOW_THRESHOLD: 0,
            self.SAFETY_VIOLATION: 3600,
            self.BUDGET_EXCEEDED: 3600,
            self.ERROR: 10,
            self.CIRCUIT_OPEN: 120
        }
        return cooldowns.get(self, 60)


class AggregationMethod(Enum):
    """Methods for aggregating ensemble outputs."""
    MAJORITY_VOTE = "majority_vote"
    WEIGHTED_VOTE = "weighted_vote"
    BEST_OF_N = "best_of_n"
    CONCATENATE = "concatenate"
    SYNTHESIZE = "synthesize"
    FIRST_VALID = "first_valid"

    @property
    def min_responses(self) -> int:
        mins = {
            self.MAJORITY_VOTE: 3,
            self.WEIGHTED_VOTE: 2,
            self.BEST_OF_N: 2,
            self.CONCATENATE: 1,
            self.SYNTHESIZE: 2,
            self.FIRST_VALID: 1
        }
        return mins.get(self, 1)

    @property
    def requires_evaluator(self) -> bool:
        return self in [self.BEST_OF_N, self.SYNTHESIZE]


class ModelStatus(Enum):
    """Operational status of a model."""
    AVAILABLE = "available"
    DEGRADED = "degraded"
    UNAVAILABLE = "unavailable"
    RATE_LIMITED = "rate_limited"
    MAINTENANCE = "maintenance"
    DEPRECATED = "deprecated"

    @property
    def is_usable(self) -> bool:
        return self in [self.AVAILABLE, self.DEGRADED]

    @property
    def health_score(self) -> float:
        scores = {
            self.AVAILABLE: 1.0,
            self.DEGRADED: 0.7,
            self.UNAVAILABLE: 0.0,
            self.RATE_LIMITED: 0.3,
            self.MAINTENANCE: 0.0,
            self.DEPRECATED: 0.2
        }
        return scores.get(self, 0.0)

    @property
    def icon(self) -> str:
        icons = {
            self.AVAILABLE: "🟢",
            self.DEGRADED: "🟡",
            self.UNAVAILABLE: "🔴",
            self.RATE_LIMITED: "🟠",
            self.MAINTENANCE: "🔧",
            self.DEPRECATED: "⚠️"
        }
        return icons.get(self, "❓")


# ============================================================
# DATACLASSES WITH BUSINESS LOGIC
# ============================================================

@dataclass
class TaskProfile:
    """Profile of a task for routing."""
    id: str
    description: str
    complexity: TaskComplexity
    risk_level: RiskLevel
    required_capabilities: List[str] = field(default_factory=list)
    constraints: Dict[str, Any] = field(default_factory=dict)
    priority: int = 5
    max_latency_ms: int = 30000
    max_cost: float = 1.0

    @property
    def min_quality_threshold(self) -> float:
        return self.complexity.score_threshold

    @property
    def effective_timeout(self) -> int:
        base_timeout = self.max_latency_ms
        return int(base_timeout * self.complexity.timeout_multiplier)

    @property
    def safety_critical(self) -> bool:
        return self.risk_level.requires_frontier

    def matches_model(self, model: 'ModelCandidate') -> bool:
        """Check if model meets task requirements."""
        # Check capabilities
        for cap in self.required_capabilities:
            if cap not in model.capabilities:
                return False

        # Check tier
        if model.tier.priority < self.complexity.min_model_tier.priority:
            return False

        return True


@dataclass
class ModelCandidate:
    """A model candidate for selection."""
    id: str
    name: str
    provider: str
    tier: ModelTier
    status: ModelStatus = ModelStatus.AVAILABLE
    capabilities: List[str] = field(default_factory=list)
    quality_score: float = 0.8
    latency_p50_ms: int = 1000
    latency_p99_ms: int = 5000
    cost_per_1k_input: float = 3.0
    cost_per_1k_output: float = 15.0
    safety_rating: float = 0.95
    reliability_score: float = 0.99

    @property
    def is_available(self) -> bool:
        return self.status.is_usable

    @property
    def estimated_cost(self) -> float:
        # Rough estimate for typical task
        return (self.cost_per_1k_input * 0.5) + (self.cost_per_1k_output * 0.3)

    @property
    def health(self) -> float:
        return self.status.health_score * self.reliability_score

    def calculate_task_cost(self, input_tokens: int, output_tokens: int) -> float:
        return ((input_tokens / 1000) * self.cost_per_1k_input +
                (output_tokens / 1000) * self.cost_per_1k_output)


@dataclass
class CriterionScore:
    """Score for a single selection criterion."""
    criterion: SelectionCriterion
    raw_value: float
    normalized_score: float
    weight: float
    passed_threshold: bool = True

    @property
    def weighted_score(self) -> float:
        return self.normalized_score * self.weight

    @property
    def is_blocking(self) -> bool:
        return self.criterion.is_required and not self.passed_threshold


@dataclass
class SelectionScore:
    """Complete selection score for a model."""
    model: ModelCandidate
    task: TaskProfile
    criterion_scores: Dict[SelectionCriterion, CriterionScore] = field(default_factory=dict)

    @property
    def total_score(self) -> float:
        return sum(cs.weighted_score for cs in self.criterion_scores.values())

    @property
    def is_viable(self) -> bool:
        # Check no blocking criteria failed
        for cs in self.criterion_scores.values():
            if cs.is_blocking:
                return False
        return self.model.is_available

    @property
    def confidence(self) -> DecisionConfidence:
        # Calculate confidence based on score margin and criterion passes
        pass_rate = sum(1 for cs in self.criterion_scores.values() if cs.passed_threshold)
        pass_rate /= max(len(self.criterion_scores), 1)

        combined = (self.total_score / 100 + pass_rate) / 2
        return DecisionConfidence.from_score(combined)

    def get_weakest_criterion(self) -> Optional[SelectionCriterion]:
        if not self.criterion_scores:
            return None
        return min(self.criterion_scores.items(),
                   key=lambda x: x[1].normalized_score)[0]


@dataclass
class RoutingDecision:
    """Final routing decision."""
    task: TaskProfile
    selected_model: ModelCandidate
    strategy: RoutingStrategy
    score: SelectionScore
    fallback_models: List[ModelCandidate] = field(default_factory=list)
    rationale: str = ""
    confidence: DecisionConfidence = DecisionConfidence.MEDIUM
    timestamp: datetime = field(default_factory=datetime.now)

    @property
    def has_fallback(self) -> bool:
        return len(self.fallback_models) > 0

    @property
    def estimated_cost(self) -> float:
        base_cost = self.selected_model.estimated_cost
        return base_cost * self.strategy.cost_multiplier

    def get_fallback(self, reason: FallbackReason) -> Optional[ModelCandidate]:
        """Get next fallback model."""
        if not reason.is_retriable or not self.fallback_models:
            return None
        return self.fallback_models[0]


@dataclass
class ExecutionResult:
    """Result of executing with selected model."""
    decision: RoutingDecision
    model_used: ModelCandidate
    success: bool
    output: str = ""
    latency_ms: float = 0.0
    tokens_used: int = 0
    cost: float = 0.0
    quality_score: float = 0.0
    fallback_triggered: bool = False
    fallback_reason: Optional[FallbackReason] = None
    error_message: str = ""

    @property
    def met_quality_threshold(self) -> bool:
        return self.quality_score >= self.decision.task.min_quality_threshold

    @property
    def within_latency_budget(self) -> bool:
        return self.latency_ms <= self.decision.task.max_latency_ms

    @property
    def within_cost_budget(self) -> bool:
        return self.cost <= self.decision.task.max_cost


@dataclass
class FallbackChain:
    """Chain of fallback models."""
    primary: ModelCandidate
    fallbacks: List[ModelCandidate] = field(default_factory=list)
    max_attempts: int = 3
    current_index: int = -1

    @property
    def current_model(self) -> Optional[ModelCandidate]:
        if self.current_index < 0:
            return self.primary
        if self.current_index < len(self.fallbacks):
            return self.fallbacks[self.current_index]
        return None

    @property
    def has_more(self) -> bool:
        return self.current_index < len(self.fallbacks) - 1

    def advance(self) -> Optional[ModelCandidate]:
        """Move to next fallback."""
        self.current_index += 1
        return self.current_model

    def reset(self):
        """Reset to primary."""
        self.current_index = -1


@dataclass
class EnsembleConfig:
    """Configuration for ensemble routing."""
    models: List[ModelCandidate]
    aggregation: AggregationMethod
    weights: Dict[str, float] = field(default_factory=dict)
    min_agreement: float = 0.5
    timeout_ms: int = 30000

    @property
    def total_weight(self) -> float:
        return sum(self.weights.values())

    def get_weight(self, model_id: str) -> float:
        if not self.weights:
            return 1.0 / len(self.models)
        return self.weights.get(model_id, 0.0) / max(self.total_weight, 1)

    @property
    def is_valid(self) -> bool:
        return len(self.models) >= self.aggregation.min_responses


@dataclass
class CircuitBreaker:
    """Circuit breaker for model health."""
    model_id: str
    failure_threshold: int = 5
    recovery_timeout_seconds: int = 120
    failures: int = 0
    last_failure: Optional[datetime] = None
    state: str = "closed"  # closed, open, half-open

    @property
    def is_open(self) -> bool:
        if self.state == "open":
            # Check if recovery timeout passed
            if self.last_failure:
                elapsed = (datetime.now() - self.last_failure).total_seconds()
                if elapsed >= self.recovery_timeout_seconds:
                    self.state = "half-open"
                    return False
            return True
        return False

    def record_failure(self):
        self.failures += 1
        self.last_failure = datetime.now()
        if self.failures >= self.failure_threshold:
            self.state = "open"

    def record_success(self):
        self.failures = 0
        self.state = "closed"


# ============================================================
# ENGINE CLASSES
# ============================================================

class TaskAnalyzer:
    """Analyzes tasks for routing decisions."""

    COMPLEXITY_KEYWORDS = {
        TaskComplexity.TRIVIAL: ["hello", "hi", "thanks", "yes", "no"],
        TaskComplexity.SIMPLE: ["what is", "define", "list", "count"],
        TaskComplexity.MODERATE: ["explain", "compare", "summarize", "analyze"],
        TaskComplexity.COMPLEX: ["design", "implement", "optimize", "debug"],
        TaskComplexity.EXPERT: ["architect", "research", "prove", "novel"]
    }

    RISK_KEYWORDS = {
        RiskLevel.CRITICAL: ["medical", "legal", "financial advice", "safety"],
        RiskLevel.HIGH: ["personal data", "credentials", "security"],
        RiskLevel.MEDIUM: ["business", "decision", "recommendation"],
        RiskLevel.LOW: ["general", "creative", "casual"],
        RiskLevel.MINIMAL: ["test", "example", "demo"]
    }

    def analyze_complexity(self, description: str) -> TaskComplexity:
        """Estimate task complexity from description."""
        desc_lower = description.lower()

        for complexity, keywords in self.COMPLEXITY_KEYWORDS.items():
            if any(kw in desc_lower for kw in keywords):
                return complexity

        # Default based on length
        if len(description) < 50:
            return TaskComplexity.SIMPLE
        elif len(description) < 200:
            return TaskComplexity.MODERATE
        return TaskComplexity.COMPLEX

    def analyze_risk(self, description: str) -> RiskLevel:
        """Estimate risk level from description."""
        desc_lower = description.lower()

        for risk, keywords in self.RISK_KEYWORDS.items():
            if any(kw in desc_lower for kw in keywords):
                return risk

        return RiskLevel.LOW

    def extract_capabilities(self, description: str) -> List[str]:
        """Extract required capabilities from description."""
        capabilities = []
        desc_lower = description.lower()

        if any(w in desc_lower for w in ["code", "program", "function", "debug"]):
            capabilities.append("coding")
        if any(w in desc_lower for w in ["reason", "logic", "think", "analyze"]):
            capabilities.append("reasoning")
        if any(w in desc_lower for w in ["image", "picture", "visual", "see"]):
            capabilities.append("multimodal")
        if any(w in desc_lower for w in ["creative", "story", "poem", "art"]):
            capabilities.append("creativity")

        return capabilities

    def create_task_profile(self, task_id: str, description: str,
                            constraints: Dict[str, Any] = None) -> TaskProfile:
        """Create complete task profile."""
        return TaskProfile(
            id=task_id,
            description=description,
            complexity=self.analyze_complexity(description),
            risk_level=self.analyze_risk(description),
            required_capabilities=self.extract_capabilities(description),
            constraints=constraints or {}
        )


class ScoringEngine:
    """Scores models against selection criteria."""

    def __init__(self):
        self.weights: Dict[SelectionCriterion, float] = {
            c: c.default_weight for c in SelectionCriterion
        }

    def set_weight(self, criterion: SelectionCriterion, weight: float):
        self.weights[criterion] = weight
        # Normalize weights
        total = sum(self.weights.values())
        self.weights = {k: v/total for k, v in self.weights.items()}

    def score_criterion(self, model: ModelCandidate, task: TaskProfile,
                        criterion: SelectionCriterion) -> CriterionScore:
        """Score a model on a single criterion."""
        raw_value = 0.0
        threshold_passed = True

        if criterion == SelectionCriterion.QUALITY:
            raw_value = model.quality_score * 100
            threshold_passed = raw_value >= task.min_quality_threshold * 100

        elif criterion == SelectionCriterion.LATENCY:
            raw_value = model.latency_p50_ms
            threshold_passed = raw_value <= task.max_latency_ms
            # Invert for scoring (lower is better)
            raw_value = max(0, 100 - (raw_value / task.max_latency_ms * 100))

        elif criterion == SelectionCriterion.COST:
            raw_value = model.estimated_cost
            threshold_passed = raw_value <= task.max_cost
            raw_value = max(0, 100 - (raw_value / max(task.max_cost, 0.01) * 100))

        elif criterion == SelectionCriterion.SAFETY:
            raw_value = model.safety_rating * 100
            threshold_passed = model.safety_rating >= 0.9 if task.safety_critical else True

        elif criterion == SelectionCriterion.RELIABILITY:
            raw_value = model.reliability_score * 100

        elif criterion == SelectionCriterion.CAPABILITY:
            matched = sum(1 for c in task.required_capabilities if c in model.capabilities)
            total = len(task.required_capabilities) or 1
            raw_value = (matched / total) * 100
            threshold_passed = matched == len(task.required_capabilities)

        elif criterion == SelectionCriterion.AVAILABILITY:
            raw_value = model.health * 100
            threshold_passed = model.is_available

        else:
            raw_value = 70.0  # Default

        return CriterionScore(
            criterion=criterion,
            raw_value=raw_value,
            normalized_score=min(raw_value, 100),
            weight=self.weights.get(criterion, 0.05),
            passed_threshold=threshold_passed
        )

    def score_model(self, model: ModelCandidate, task: TaskProfile) -> SelectionScore:
        """Calculate complete selection score."""
        criterion_scores = {}

        for criterion in SelectionCriterion:
            criterion_scores[criterion] = self.score_criterion(model, task, criterion)

        return SelectionScore(
            model=model,
            task=task,
            criterion_scores=criterion_scores
        )


class DecisionRouter:
    """Routes tasks to models based on strategy."""

    def __init__(self, scoring_engine: ScoringEngine):
        self.scoring = scoring_engine
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}

    def get_circuit_breaker(self, model_id: str) -> CircuitBreaker:
        if model_id not in self.circuit_breakers:
            self.circuit_breakers[model_id] = CircuitBreaker(model_id)
        return self.circuit_breakers[model_id]

    def select_single_best(self, task: TaskProfile,
                           candidates: List[ModelCandidate]) -> RoutingDecision:
        """Select single best model."""
        viable_candidates = []

        for model in candidates:
            cb = self.get_circuit_breaker(model.id)
            if cb.is_open:
                continue

            score = self.scoring.score_model(model, task)
            if score.is_viable:
                viable_candidates.append((model, score))

        if not viable_candidates:
            # Fall back to highest tier available
            return self._emergency_fallback(task, candidates)

        # Sort by total score
        viable_candidates.sort(key=lambda x: x[1].total_score, reverse=True)
        best_model, best_score = viable_candidates[0]

        fallbacks = [m for m, _ in viable_candidates[1:4]]

        return RoutingDecision(
            task=task,
            selected_model=best_model,
            strategy=RoutingStrategy.SINGLE_BEST,
            score=best_score,
            fallback_models=fallbacks,
            rationale=f"Highest scoring viable model ({best_score.total_score:.1f})",
            confidence=best_score.confidence
        )

    def select_lowest_cost(self, task: TaskProfile,
                           candidates: List[ModelCandidate]) -> RoutingDecision:
        """Select lowest cost model meeting requirements."""
        viable = []

        for model in candidates:
            score = self.scoring.score_model(model, task)
            if score.is_viable:
                viable.append((model, score))

        if not viable:
            return self._emergency_fallback(task, candidates)

        # Sort by cost (ascending)
        viable.sort(key=lambda x: x[0].estimated_cost)
        best_model, best_score = viable[0]

        return RoutingDecision(
            task=task,
            selected_model=best_model,
            strategy=RoutingStrategy.LEAST_COST,
            score=best_score,
            fallback_models=[m for m, _ in viable[1:3]],
            rationale=f"Lowest cost viable model (${best_model.estimated_cost:.4f})",
            confidence=best_score.confidence
        )

    def select_cascade(self, task: TaskProfile,
                       candidates: List[ModelCandidate]) -> RoutingDecision:
        """Start with fast model, escalate if needed."""
        # Sort by tier (fast first)
        sorted_candidates = sorted(candidates, key=lambda m: m.tier.priority)

        for model in sorted_candidates:
            score = self.scoring.score_model(model, task)
            if score.is_viable:
                # Found viable starting point
                fallbacks = [m for m in sorted_candidates if m.tier.priority > model.tier.priority]
                return RoutingDecision(
                    task=task,
                    selected_model=model,
                    strategy=RoutingStrategy.CASCADE,
                    score=score,
                    fallback_models=fallbacks[:3],
                    rationale="Start with simplest viable model, escalate as needed",
                    confidence=score.confidence
                )

        return self._emergency_fallback(task, candidates)

    def _emergency_fallback(self, task: TaskProfile,
                            candidates: List[ModelCandidate]) -> RoutingDecision:
        """Emergency fallback when no viable candidates."""
        # Pick highest tier available model
        available = [m for m in candidates if m.is_available]
        if not available:
            available = candidates

        best = max(available, key=lambda m: m.tier.priority)
        score = self.scoring.score_model(best, task)

        return RoutingDecision(
            task=task,
            selected_model=best,
            strategy=RoutingStrategy.SINGLE_BEST,
            score=score,
            rationale="Emergency fallback - no viable candidates",
            confidence=DecisionConfidence.VERY_LOW
        )

    def create_fallback_chain(self, decision: RoutingDecision) -> FallbackChain:
        """Create fallback chain from decision."""
        return FallbackChain(
            primary=decision.selected_model,
            fallbacks=decision.fallback_models,
            max_attempts=decision.task.risk_level.max_retries + 1
        )


class EnsembleRouter:
    """Handles ensemble routing strategies."""

    def __init__(self, scoring_engine: ScoringEngine):
        self.scoring = scoring_engine

    def create_ensemble(self, task: TaskProfile,
                        candidates: List[ModelCandidate],
                        aggregation: AggregationMethod = AggregationMethod.WEIGHTED_VOTE) -> EnsembleConfig:
        """Create ensemble configuration."""
        # Score all candidates
        scores = [(m, self.scoring.score_model(m, task)) for m in candidates]

        # Select top N viable models
        viable = [(m, s) for m, s in scores if s.is_viable]
        viable.sort(key=lambda x: x[1].total_score, reverse=True)

        n_models = aggregation.min_responses + 1
        selected = [m for m, _ in viable[:n_models]]

        # Calculate weights based on scores
        weights = {
            m.id: s.total_score
            for m, s in viable[:n_models]
        }

        return EnsembleConfig(
            models=selected,
            aggregation=aggregation,
            weights=weights,
            timeout_ms=task.max_latency_ms
        )

    def aggregate_votes(self, responses: Dict[str, str],
                        config: EnsembleConfig) -> str:
        """Aggregate ensemble responses using voting."""
        if config.aggregation == AggregationMethod.MAJORITY_VOTE:
            # Simple majority
            from collections import Counter
            votes = Counter(responses.values())
            return votes.most_common(1)[0][0] if votes else ""

        elif config.aggregation == AggregationMethod.WEIGHTED_VOTE:
            # Weighted by model quality
            weighted_responses: Dict[str, float] = {}
            for model_id, response in responses.items():
                weight = config.get_weight(model_id)
                weighted_responses[response] = weighted_responses.get(response, 0) + weight

            return max(weighted_responses.items(), key=lambda x: x[1])[0]

        elif config.aggregation == AggregationMethod.FIRST_VALID:
            # Return first non-empty response
            for response in responses.values():
                if response.strip():
                    return response
            return ""

        return list(responses.values())[0] if responses else ""


class ModelArbitrationEngine:
    """Main orchestrator for model arbitration."""

    def __init__(self):
        self.task_analyzer = TaskAnalyzer()
        self.scoring = ScoringEngine()
        self.router = DecisionRouter(self.scoring)
        self.ensemble = EnsembleRouter(self.scoring)
        self.models: Dict[str, ModelCandidate] = {}
        self.decisions: List[RoutingDecision] = []

    def register_model(self, model: ModelCandidate):
        """Register a model candidate."""
        self.models[model.id] = model

    def analyze_task(self, task_id: str, description: str,
                     constraints: Dict[str, Any] = None) -> TaskProfile:
        """Analyze and profile a task."""
        return self.task_analyzer.create_task_profile(task_id, description, constraints)

    def route_task(self, task: TaskProfile,
                   strategy: RoutingStrategy = RoutingStrategy.SINGLE_BEST) -> RoutingDecision:
        """Route a task to appropriate model(s)."""
        candidates = list(self.models.values())

        # Filter by basic requirements first
        candidates = [m for m in candidates if task.matches_model(m)]

        if not candidates:
            candidates = list(self.models.values())

        if strategy == RoutingStrategy.SINGLE_BEST:
            decision = self.router.select_single_best(task, candidates)
        elif strategy == RoutingStrategy.LEAST_COST:
            decision = self.router.select_lowest_cost(task, candidates)
        elif strategy == RoutingStrategy.CASCADE:
            decision = self.router.select_cascade(task, candidates)
        else:
            decision = self.router.select_single_best(task, candidates)

        self.decisions.append(decision)
        return decision

    def create_ensemble_routing(self, task: TaskProfile,
                                aggregation: AggregationMethod = AggregationMethod.WEIGHTED_VOTE) -> EnsembleConfig:
        """Create ensemble routing configuration."""
        return self.ensemble.create_ensemble(
            task, list(self.models.values()), aggregation
        )

    def record_execution(self, decision: RoutingDecision,
                         result: ExecutionResult):
        """Record execution result for learning."""
        cb = self.router.get_circuit_breaker(result.model_used.id)

        if result.success and result.met_quality_threshold:
            cb.record_success()
        else:
            cb.record_failure()

    def get_statistics(self) -> Dict[str, Any]:
        """Get arbitration statistics."""
        return {
            "total_decisions": len(self.decisions),
            "by_strategy": {
                s.value: len([d for d in self.decisions if d.strategy == s])
                for s in RoutingStrategy
            },
            "avg_confidence": mean(
                [list(DecisionConfidence).index(d.confidence) for d in self.decisions]
            ) if self.decisions else 0,
            "models_registered": len(self.models),
            "models_available": len([m for m in self.models.values() if m.is_available])
        }


# ============================================================
# REPORTER CLASS
# ============================================================

class ArbitrationReporter:
    """Generates arbitration reports and visualizations."""

    def __init__(self, engine: ModelArbitrationEngine):
        self.engine = engine

    def generate_decision_report(self, decision: RoutingDecision) -> str:
        """Generate detailed decision report."""
        lines = [
            "MODEL ARBITRATION DECISION",
            "=" * 55,
            f"Task: {decision.task.description[:50]}...",
            f"Selected: {decision.selected_model.name}",
            f"Strategy: {decision.strategy.value}",
            f"Confidence: {decision.confidence.value}",
            "=" * 55,
            "",
            "TASK ANALYSIS",
            "-" * 40,
            f"  Complexity: {decision.task.complexity.value}",
            f"  Risk Level: {decision.task.risk_level.value}",
            f"  Required Caps: {', '.join(decision.task.required_capabilities) or 'None'}",
            f"  Max Latency: {decision.task.max_latency_ms}ms",
            f"  Max Cost: ${decision.task.max_cost:.4f}",
            ""
        ]

        # Selection scores
        lines.extend([
            "SCORING BREAKDOWN",
            "-" * 40
        ])

        for criterion, cs in decision.score.criterion_scores.items():
            status = "✅" if cs.passed_threshold else "❌"
            bar_len = int(cs.normalized_score / 5)
            bar = "█" * bar_len + "░" * (20 - bar_len)
            lines.append(f"  {status} {criterion.value:15} {bar} {cs.normalized_score:.1f}")

        lines.extend([
            "",
            f"Total Score: {decision.score.total_score:.1f}/100",
            "",
            "SELECTED MODEL",
            "-" * 40,
            f"  Name: {decision.selected_model.name}",
            f"  Provider: {decision.selected_model.provider}",
            f"  Tier: {decision.selected_model.tier.value}",
            f"  Status: {decision.selected_model.status.icon} {decision.selected_model.status.value}",
            f"  Est. Cost: ${decision.estimated_cost:.4f}",
            ""
        ])

        if decision.fallback_models:
            lines.extend([
                "FALLBACK CHAIN",
                "-" * 40
            ])
            for i, fb in enumerate(decision.fallback_models, 1):
                lines.append(f"  {i}. {fb.name} ({fb.tier.value})")

        lines.extend([
            "",
            f"Rationale: {decision.rationale}",
            "=" * 55
        ])

        return "\n".join(lines)

    def generate_model_status_report(self) -> str:
        """Generate model availability status report."""
        lines = [
            "MODEL STATUS REPORT",
            "=" * 55,
            f"Total Models: {len(self.engine.models)}",
            f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "=" * 55,
            ""
        ]

        # Group by tier
        by_tier: Dict[ModelTier, List[ModelCandidate]] = {}
        for model in self.engine.models.values():
            if model.tier not in by_tier:
                by_tier[model.tier] = []
            by_tier[model.tier].append(model)

        for tier in ModelTier:
            models = by_tier.get(tier, [])
            if not models:
                continue

            lines.extend([
                f"{tier.value.upper()} TIER",
                "-" * 40
            ])

            for model in models:
                cb = self.engine.router.get_circuit_breaker(model.id)
                cb_status = "🔓" if not cb.is_open else "🔒"
                lines.append(
                    f"  {model.status.icon} {model.name:25} {cb_status} "
                    f"Q:{model.quality_score:.2f} L:{model.latency_p50_ms}ms"
                )

            lines.append("")

        return "\n".join(lines)

    def generate_statistics_report(self) -> str:
        """Generate arbitration statistics report."""
        stats = self.engine.get_statistics()

        lines = [
            "ARBITRATION STATISTICS",
            "=" * 55,
            f"Total Decisions: {stats['total_decisions']}",
            "",
            "BY STRATEGY",
            "-" * 40
        ]

        for strategy, count in stats['by_strategy'].items():
            if count > 0:
                lines.append(f"  {strategy}: {count}")

        lines.extend([
            "",
            f"Models Registered: {stats['models_registered']}",
            f"Models Available: {stats['models_available']}",
            "=" * 55
        ])

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli():
    """Create command-line interface."""
    import argparse

    parser = argparse.ArgumentParser(
        prog="model-arbitration",
        description="Cross-Model Arbitration & Selection"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Route command
    route_parser = subparsers.add_parser("route", help="Route a task")
    route_parser.add_argument("description", help="Task description")
    route_parser.add_argument("--strategy", choices=[s.value for s in RoutingStrategy],
                              default="single_best")
    route_parser.add_argument("--max-latency", type=int, default=30000)
    route_parser.add_argument("--max-cost", type=float, default=1.0)

    # Compare command
    compare_parser = subparsers.add_parser("compare", help="Compare models for task")
    compare_parser.add_argument("description", help="Task description")

    # Status command
    status_parser = subparsers.add_parser("status", help="Show model status")

    # Stats command
    stats_parser = subparsers.add_parser("stats", help="Show statistics")

    # Ensemble command
    ensemble_parser = subparsers.add_parser("ensemble", help="Create ensemble config")
    ensemble_parser.add_argument("description", help="Task description")
    ensemble_parser.add_argument("--method", choices=[m.value for m in AggregationMethod],
                                  default="weighted_vote")

    return parser


def main():
    """Main entry point."""
    parser = create_cli()
    args = parser.parse_args()

    # Initialize engine with sample models
    engine = ModelArbitrationEngine()

    # Register sample models
    sample_models = [
        ModelCandidate("claude-opus", "Claude Opus", "Anthropic", ModelTier.FRONTIER,
                       capabilities=["reasoning", "coding", "analysis", "creativity", "multimodal"]),
        ModelCandidate("claude-sonnet", "Claude Sonnet", "Anthropic", ModelTier.BALANCED,
                       capabilities=["reasoning", "coding", "analysis", "creativity"]),
        ModelCandidate("claude-haiku", "Claude Haiku", "Anthropic", ModelTier.FAST,
                       capabilities=["classification", "extraction", "simple_qa"]),
        ModelCandidate("gpt-4o", "GPT-4o", "OpenAI", ModelTier.BALANCED,
                       capabilities=["reasoning", "coding", "analysis", "multimodal"]),
        ModelCandidate("gpt-4o-mini", "GPT-4o Mini", "OpenAI", ModelTier.FAST,
                       capabilities=["classification", "simple_qa"])
    ]

    for model in sample_models:
        engine.register_model(model)

    reporter = ArbitrationReporter(engine)

    if args.command == "route":
        task = engine.analyze_task(
            hashlib.sha256(args.description.encode()).hexdigest()[:8],
            args.description,
            {"max_latency_ms": args.max_latency, "max_cost": args.max_cost}
        )
        task.max_latency_ms = args.max_latency
        task.max_cost = args.max_cost

        strategy = RoutingStrategy(args.strategy)
        decision = engine.route_task(task, strategy)
        print(reporter.generate_decision_report(decision))

    elif args.command == "status":
        print(reporter.generate_model_status_report())

    elif args.command == "stats":
        print(reporter.generate_statistics_report())

    elif args.command == "compare":
        task = engine.analyze_task("compare", args.description)
        print(f"Task Analysis: {task.complexity.value} complexity, {task.risk_level.value} risk")
        print(f"Required: {task.required_capabilities}")
        print()

        for model in engine.models.values():
            score = engine.scoring.score_model(model, task)
            viable = "✅" if score.is_viable else "❌"
            print(f"  {viable} {model.name:20} Score: {score.total_score:.1f}")

    elif args.command == "ensemble":
        task = engine.analyze_task("ensemble", args.description)
        method = AggregationMethod(args.method)
        config = engine.create_ensemble_routing(task, method)

        print(f"Ensemble Configuration")
        print(f"  Method: {config.aggregation.value}")
        print(f"  Models: {len(config.models)}")
        for model in config.models:
            weight = config.get_weight(model.id)
            print(f"    - {model.name}: {weight:.2%}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

## QUICK COMMANDS

- `/model-arbitration` - Full arbitration decision
- `/model-arbitration [task]` - Task-specific routing
- `/model-arbitration compare` - Model comparison
- `/model-arbitration fallback` - Fallback strategy
- `/model-arbitration ensemble` - Ensemble configuration

$ARGUMENTS
