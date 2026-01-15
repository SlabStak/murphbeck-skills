# MODEL.STRATEGY.OS.EXE - AI Model Strategy & Selection OS

You are MODEL.STRATEGY.OS.EXE — a senior AI systems architect responsible for selecting, benchmarking, and deploying language and multimodal models with optimal balance of performance, cost, and reliability.

MISSION
Choose the right model(s) for each workload while balancing performance, cost, reliability, and future-proofing. No hype. Measurable decisions. Multi-model resilience.

---

## CAPABILITIES

### ModelAnalyzer.MOD
- Capability benchmarking
- Performance profiling
- Latency measurement
- Quality assessment
- Feature comparison

### TaskMapper.MOD
- Use-case classification
- Task-model matching
- Requirement extraction
- Constraint mapping
- Priority weighting

### CostOptimizer.MOD
- Cost modeling
- Token economics
- Batch optimization
- Caching strategies
- Volume discounting

### ResilienceArchitect.MOD
- Fallback planning
- Redundancy design
- Vendor diversification
- Upgrade pathing
- Degradation strategies

---

## PRODUCTION IMPLEMENTATION

```python
"""
MODEL.STRATEGY.OS.EXE - AI Model Strategy & Selection
Production-ready model strategy planning system.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Dict, List, Any, Callable, Set
import hashlib
import json
from statistics import mean


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class ModelCategory(Enum):
    """Model capability categories."""
    FRONTIER = "frontier"
    BALANCED = "balanced"
    FAST = "fast"
    SPECIALIZED = "specialized"
    OPEN_SOURCE = "open_source"
    EMBEDDING = "embedding"
    VISION = "vision"
    AUDIO = "audio"
    MULTIMODAL = "multimodal"
    FINE_TUNED = "fine_tuned"

    @property
    def examples(self) -> List[str]:
        examples_map = {
            self.FRONTIER: ["GPT-4", "Claude Opus", "Gemini Ultra"],
            self.BALANCED: ["Claude Sonnet", "GPT-4o", "Gemini Pro"],
            self.FAST: ["Claude Haiku", "GPT-4o-mini", "Gemini Flash"],
            self.SPECIALIZED: ["Code Llama", "Med-PaLM", "Legal-BERT"],
            self.OPEN_SOURCE: ["Llama 3", "Mixtral", "Qwen"],
            self.EMBEDDING: ["text-embedding-3", "voyage-2", "e5-large"],
            self.VISION: ["GPT-4V", "Claude Vision", "Gemini Vision"],
            self.AUDIO: ["Whisper", "Assembly AI"],
            self.MULTIMODAL: ["GPT-4o", "Claude 3.5", "Gemini"],
            self.FINE_TUNED: ["Custom fine-tunes"]
        }
        return examples_map.get(self, [])

    @property
    def typical_use_cases(self) -> List[str]:
        use_cases = {
            self.FRONTIER: ["Complex reasoning", "Research", "Novel problems"],
            self.BALANCED: ["General tasks", "Production workloads", "Customer-facing"],
            self.FAST: ["High volume", "Real-time", "Cost-sensitive"],
            self.SPECIALIZED: ["Domain expertise", "Regulated industries"],
            self.OPEN_SOURCE: ["Self-hosted", "Privacy", "Customization"],
            self.EMBEDDING: ["Semantic search", "RAG", "Clustering"],
            self.VISION: ["Image analysis", "Document processing"],
            self.AUDIO: ["Transcription", "Voice interfaces"],
            self.MULTIMODAL: ["Mixed media", "Complex documents"],
            self.FINE_TUNED: ["Specific formats", "Domain adaptation"]
        }
        return use_cases.get(self, [])

    @property
    def cost_tier(self) -> str:
        tiers = {
            self.FRONTIER: "$$$$",
            self.BALANCED: "$$$",
            self.FAST: "$",
            self.SPECIALIZED: "$$$",
            self.OPEN_SOURCE: "$",
            self.EMBEDDING: "$",
            self.VISION: "$$$",
            self.AUDIO: "$$",
            self.MULTIMODAL: "$$$",
            self.FINE_TUNED: "$$"
        }
        return tiers.get(self, "$$")


class WorkloadType(Enum):
    """Types of AI workloads."""
    INTERACTIVE = "interactive"
    BATCH = "batch"
    STREAMING = "streaming"
    REAL_TIME = "real_time"
    BACKGROUND = "background"
    SCHEDULED = "scheduled"
    ON_DEMAND = "on_demand"
    BURST = "burst"

    @property
    def latency_requirement(self) -> str:
        requirements = {
            self.INTERACTIVE: "<3s",
            self.BATCH: "flexible",
            self.STREAMING: "<500ms TTFT",
            self.REAL_TIME: "<1s",
            self.BACKGROUND: "flexible",
            self.SCHEDULED: "flexible",
            self.ON_DEMAND: "<5s",
            self.BURST: "<2s"
        }
        return requirements.get(self, "flexible")

    @property
    def cost_sensitivity(self) -> float:
        sensitivities = {
            self.INTERACTIVE: 0.3,
            self.BATCH: 0.8,
            self.STREAMING: 0.2,
            self.REAL_TIME: 0.1,
            self.BACKGROUND: 0.9,
            self.SCHEDULED: 0.7,
            self.ON_DEMAND: 0.4,
            self.BURST: 0.2
        }
        return sensitivities.get(self, 0.5)

    @property
    def recommended_strategy(self) -> 'RoutingStrategy':
        strategies = {
            self.INTERACTIVE: RoutingStrategy.BALANCED,
            self.BATCH: RoutingStrategy.COST_OPTIMIZED,
            self.STREAMING: RoutingStrategy.LOW_LATENCY,
            self.REAL_TIME: RoutingStrategy.LOW_LATENCY,
            self.BACKGROUND: RoutingStrategy.COST_OPTIMIZED,
            self.SCHEDULED: RoutingStrategy.COST_OPTIMIZED,
            self.ON_DEMAND: RoutingStrategy.BALANCED,
            self.BURST: RoutingStrategy.HIGH_AVAILABILITY
        }
        return strategies.get(self, RoutingStrategy.BALANCED)


class RoutingStrategy(Enum):
    """Model routing strategies."""
    COST_OPTIMIZED = "cost_optimized"
    QUALITY_FIRST = "quality_first"
    LOW_LATENCY = "low_latency"
    BALANCED = "balanced"
    HIGH_AVAILABILITY = "high_availability"
    PRIVACY_FIRST = "privacy_first"
    COMPLIANCE_REQUIRED = "compliance_required"

    @property
    def model_priority(self) -> List[ModelCategory]:
        priorities = {
            self.COST_OPTIMIZED: [ModelCategory.FAST, ModelCategory.OPEN_SOURCE, ModelCategory.BALANCED],
            self.QUALITY_FIRST: [ModelCategory.FRONTIER, ModelCategory.BALANCED, ModelCategory.SPECIALIZED],
            self.LOW_LATENCY: [ModelCategory.FAST, ModelCategory.BALANCED, ModelCategory.OPEN_SOURCE],
            self.BALANCED: [ModelCategory.BALANCED, ModelCategory.FAST, ModelCategory.FRONTIER],
            self.HIGH_AVAILABILITY: [ModelCategory.BALANCED, ModelCategory.FAST, ModelCategory.OPEN_SOURCE],
            self.PRIVACY_FIRST: [ModelCategory.OPEN_SOURCE, ModelCategory.FINE_TUNED],
            self.COMPLIANCE_REQUIRED: [ModelCategory.SPECIALIZED, ModelCategory.FINE_TUNED, ModelCategory.BALANCED]
        }
        return priorities.get(self, [ModelCategory.BALANCED])

    @property
    def fallback_count(self) -> int:
        counts = {
            self.COST_OPTIMIZED: 1,
            self.QUALITY_FIRST: 2,
            self.LOW_LATENCY: 2,
            self.BALANCED: 2,
            self.HIGH_AVAILABILITY: 3,
            self.PRIVACY_FIRST: 1,
            self.COMPLIANCE_REQUIRED: 1
        }
        return counts.get(self, 2)

    @property
    def description(self) -> str:
        descriptions = {
            self.COST_OPTIMIZED: "Minimize costs while meeting minimum quality bar",
            self.QUALITY_FIRST: "Maximize output quality regardless of cost",
            self.LOW_LATENCY: "Minimize response time for real-time use",
            self.BALANCED: "Balance cost, quality, and latency",
            self.HIGH_AVAILABILITY: "Maximize uptime with multiple fallbacks",
            self.PRIVACY_FIRST: "Keep data on-premise or in controlled environment",
            self.COMPLIANCE_REQUIRED: "Meet regulatory requirements"
        }
        return descriptions.get(self, "")


class CostOptimization(Enum):
    """Cost optimization techniques."""
    PROMPT_CACHING = "prompt_caching"
    BATCH_PROCESSING = "batch_processing"
    TIERED_ROUTING = "tiered_routing"
    OUTPUT_LIMITING = "output_limiting"
    PROMPT_COMPRESSION = "prompt_compression"
    SEMANTIC_CACHING = "semantic_caching"
    VOLUME_DISCOUNTS = "volume_discounts"
    RESERVED_CAPACITY = "reserved_capacity"

    @property
    def savings_potential(self) -> str:
        savings = {
            self.PROMPT_CACHING: "50-90%",
            self.BATCH_PROCESSING: "20-50%",
            self.TIERED_ROUTING: "30-60%",
            self.OUTPUT_LIMITING: "10-30%",
            self.PROMPT_COMPRESSION: "15-40%",
            self.SEMANTIC_CACHING: "40-80%",
            self.VOLUME_DISCOUNTS: "10-30%",
            self.RESERVED_CAPACITY: "20-40%"
        }
        return savings.get(self, "varies")

    @property
    def implementation_complexity(self) -> str:
        complexity = {
            self.PROMPT_CACHING: "Low",
            self.BATCH_PROCESSING: "Medium",
            self.TIERED_ROUTING: "High",
            self.OUTPUT_LIMITING: "Low",
            self.PROMPT_COMPRESSION: "Medium",
            self.SEMANTIC_CACHING: "High",
            self.VOLUME_DISCOUNTS: "Low",
            self.RESERVED_CAPACITY: "Low"
        }
        return complexity.get(self, "Medium")

    @property
    def prerequisites(self) -> List[str]:
        prereqs = {
            self.PROMPT_CACHING: ["Repeated prompts", "Deterministic outputs"],
            self.BATCH_PROCESSING: ["Non-real-time workloads", "Queue infrastructure"],
            self.TIERED_ROUTING: ["Task classifier", "Multiple models"],
            self.OUTPUT_LIMITING: ["max_tokens control", "Structured outputs"],
            self.PROMPT_COMPRESSION: ["Long prompts", "Compression service"],
            self.SEMANTIC_CACHING: ["Vector DB", "Similarity threshold"],
            self.VOLUME_DISCOUNTS: ["High volume", "Committed usage"],
            self.RESERVED_CAPACITY: ["Predictable demand", "Upfront commitment"]
        }
        return prereqs.get(self, [])


class ResiliencePattern(Enum):
    """Patterns for system resilience."""
    ACTIVE_PASSIVE = "active_passive"
    ACTIVE_ACTIVE = "active_active"
    CIRCUIT_BREAKER = "circuit_breaker"
    BULKHEAD = "bulkhead"
    RETRY_WITH_BACKOFF = "retry_with_backoff"
    TIMEOUT = "timeout"
    FALLBACK = "fallback"
    HEDGE = "hedge"

    @property
    def description(self) -> str:
        descriptions = {
            self.ACTIVE_PASSIVE: "Primary model with standby backup",
            self.ACTIVE_ACTIVE: "Multiple models handling traffic",
            self.CIRCUIT_BREAKER: "Fail fast on repeated errors",
            self.BULKHEAD: "Isolate failures to subsystems",
            self.RETRY_WITH_BACKOFF: "Retry with exponential delay",
            self.TIMEOUT: "Bound waiting time for responses",
            self.FALLBACK: "Use degraded alternative on failure",
            self.HEDGE: "Send parallel requests, use first response"
        }
        return descriptions.get(self, "")

    @property
    def cost_impact(self) -> str:
        impacts = {
            self.ACTIVE_PASSIVE: "Low (standby only)",
            self.ACTIVE_ACTIVE: "High (2x+ capacity)",
            self.CIRCUIT_BREAKER: "None",
            self.BULKHEAD: "Low",
            self.RETRY_WITH_BACKOFF: "Variable",
            self.TIMEOUT: "None",
            self.FALLBACK: "Variable",
            self.HEDGE: "High (2x requests)"
        }
        return impacts.get(self, "Variable")


class VendorRisk(Enum):
    """Vendor risk levels."""
    MINIMAL = "minimal"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"

    @property
    def mitigation_required(self) -> bool:
        return self in [self.HIGH, self.CRITICAL]

    @property
    def diversification_threshold(self) -> int:
        thresholds = {
            self.MINIMAL: 1,
            self.LOW: 1,
            self.MODERATE: 2,
            self.HIGH: 2,
            self.CRITICAL: 3
        }
        return thresholds.get(self, 2)

    @property
    def review_frequency_days(self) -> int:
        frequencies = {
            self.MINIMAL: 180,
            self.LOW: 90,
            self.MODERATE: 30,
            self.HIGH: 14,
            self.CRITICAL: 7
        }
        return frequencies.get(self, 30)


class CapabilityGap(Enum):
    """Types of capability gaps."""
    NONE = "none"
    MINOR = "minor"
    MODERATE = "moderate"
    SIGNIFICANT = "significant"
    BLOCKING = "blocking"

    @property
    def action_required(self) -> str:
        actions = {
            self.NONE: "No action needed",
            self.MINOR: "Monitor for improvements",
            self.MODERATE: "Plan mitigation",
            self.SIGNIFICANT: "Implement workaround",
            self.BLOCKING: "Find alternative solution"
        }
        return actions.get(self, "Evaluate")

    @property
    def severity(self) -> int:
        severities = {
            self.NONE: 0,
            self.MINOR: 1,
            self.MODERATE: 2,
            self.SIGNIFICANT: 3,
            self.BLOCKING: 4
        }
        return severities.get(self, 0)


class UpgradeUrgency(Enum):
    """Urgency of model upgrades."""
    NOT_NEEDED = "not_needed"
    OPTIONAL = "optional"
    RECOMMENDED = "recommended"
    IMPORTANT = "important"
    CRITICAL = "critical"

    @property
    def timeline(self) -> str:
        timelines = {
            self.NOT_NEEDED: "N/A",
            self.OPTIONAL: "When convenient",
            self.RECOMMENDED: "Within quarter",
            self.IMPORTANT: "Within month",
            self.CRITICAL: "Immediately"
        }
        return timelines.get(self, "TBD")

    @property
    def icon(self) -> str:
        icons = {
            self.NOT_NEEDED: "✅",
            self.OPTIONAL: "💡",
            self.RECOMMENDED: "📌",
            self.IMPORTANT: "⚠️",
            self.CRITICAL: "🚨"
        }
        return icons.get(self, "❓")


class BudgetAllocation(Enum):
    """Budget allocation strategies."""
    FIXED = "fixed"
    PERCENTAGE = "percentage"
    TIERED = "tiered"
    PAY_AS_YOU_GO = "pay_as_you_go"
    RESERVED = "reserved"
    HYBRID = "hybrid"

    @property
    def predictability(self) -> str:
        predictabilities = {
            self.FIXED: "High",
            self.PERCENTAGE: "Medium",
            self.TIERED: "Medium",
            self.PAY_AS_YOU_GO: "Low",
            self.RESERVED: "High",
            self.HYBRID: "Medium"
        }
        return predictabilities.get(self, "Medium")

    @property
    def flexibility(self) -> str:
        flexibilities = {
            self.FIXED: "Low",
            self.PERCENTAGE: "High",
            self.TIERED: "Medium",
            self.PAY_AS_YOU_GO: "High",
            self.RESERVED: "Low",
            self.HYBRID: "High"
        }
        return flexibilities.get(self, "Medium")


# ============================================================
# DATACLASSES WITH BUSINESS LOGIC
# ============================================================

@dataclass
class ModelSpec:
    """Specification of an AI model."""
    id: str
    name: str
    provider: str
    category: ModelCategory
    context_window: int = 128000
    max_output_tokens: int = 4096
    cost_per_1k_input: float = 3.0
    cost_per_1k_output: float = 15.0
    latency_p50_ms: int = 1000
    latency_p99_ms: int = 5000
    capabilities: Set[str] = field(default_factory=set)
    quality_score: float = 0.85
    availability_sla: float = 0.999
    release_date: Optional[datetime] = None
    deprecation_date: Optional[datetime] = None

    @property
    def cost_per_1k_avg(self) -> float:
        return (self.cost_per_1k_input + self.cost_per_1k_output) / 2

    @property
    def is_deprecated(self) -> bool:
        if self.deprecation_date:
            return datetime.now() > self.deprecation_date
        return False

    @property
    def age_months(self) -> int:
        if self.release_date:
            return (datetime.now() - self.release_date).days // 30
        return 0

    def supports_capability(self, capability: str) -> bool:
        return capability in self.capabilities

    def estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        return ((input_tokens / 1000) * self.cost_per_1k_input +
                (output_tokens / 1000) * self.cost_per_1k_output)


@dataclass
class UseCase:
    """A specific use case for model selection."""
    id: str
    name: str
    description: str
    workload_type: WorkloadType
    required_capabilities: Set[str] = field(default_factory=set)
    quality_threshold: float = 0.8
    max_latency_ms: int = 5000
    max_cost_per_request: float = 0.10
    volume_per_day: int = 1000
    criticality: int = 5  # 1-10

    @property
    def monthly_budget(self) -> float:
        return self.max_cost_per_request * self.volume_per_day * 30

    @property
    def is_latency_sensitive(self) -> bool:
        return self.max_latency_ms < 2000

    @property
    def is_cost_sensitive(self) -> bool:
        return self.workload_type.cost_sensitivity > 0.6

    @property
    def recommended_strategy(self) -> RoutingStrategy:
        if self.criticality >= 8:
            return RoutingStrategy.QUALITY_FIRST
        if self.is_latency_sensitive:
            return RoutingStrategy.LOW_LATENCY
        if self.is_cost_sensitive:
            return RoutingStrategy.COST_OPTIMIZED
        return RoutingStrategy.BALANCED


@dataclass
class ModelRecommendation:
    """Recommendation for a specific use case."""
    use_case: UseCase
    primary_model: ModelSpec
    fallback_models: List[ModelSpec] = field(default_factory=list)
    routing_strategy: RoutingStrategy = RoutingStrategy.BALANCED
    estimated_monthly_cost: float = 0.0
    confidence_score: float = 0.8
    capability_gaps: Dict[str, CapabilityGap] = field(default_factory=dict)
    rationale: str = ""

    @property
    def has_gaps(self) -> bool:
        return any(g.severity >= 2 for g in self.capability_gaps.values())

    @property
    def blocking_gaps(self) -> List[str]:
        return [cap for cap, gap in self.capability_gaps.items()
                if gap == CapabilityGap.BLOCKING]

    def meets_requirements(self) -> bool:
        return not self.blocking_gaps


@dataclass
class CostProjection:
    """Cost projection for model usage."""
    model: ModelSpec
    use_case: UseCase
    period_days: int = 30
    avg_input_tokens: int = 500
    avg_output_tokens: int = 300

    @property
    def cost_per_request(self) -> float:
        return self.model.estimate_cost(self.avg_input_tokens, self.avg_output_tokens)

    @property
    def daily_cost(self) -> float:
        return self.cost_per_request * self.use_case.volume_per_day

    @property
    def period_cost(self) -> float:
        return self.daily_cost * self.period_days

    @property
    def within_budget(self) -> bool:
        return self.cost_per_request <= self.use_case.max_cost_per_request


@dataclass
class FallbackConfig:
    """Configuration for fallback behavior."""
    primary: ModelSpec
    fallbacks: List[ModelSpec] = field(default_factory=list)
    pattern: ResiliencePattern = ResiliencePattern.FALLBACK
    timeout_ms: int = 30000
    max_retries: int = 2
    circuit_breaker_threshold: int = 5

    @property
    def total_models(self) -> int:
        return 1 + len(self.fallbacks)

    def get_next_fallback(self, current_idx: int) -> Optional[ModelSpec]:
        if current_idx < len(self.fallbacks):
            return self.fallbacks[current_idx]
        return None


@dataclass
class VendorAssessment:
    """Assessment of vendor risk and dependency."""
    vendor: str
    models_count: int
    usage_percentage: float
    risk_level: VendorRisk
    alternatives: List[str] = field(default_factory=list)
    last_incident: Optional[datetime] = None
    sla_compliance: float = 0.999

    @property
    def is_overconcentrated(self) -> bool:
        return self.usage_percentage > 0.7

    @property
    def needs_diversification(self) -> bool:
        return self.is_overconcentrated and self.risk_level.mitigation_required

    @property
    def days_since_incident(self) -> int:
        if self.last_incident:
            return (datetime.now() - self.last_incident).days
        return 999


@dataclass
class UpgradeRecommendation:
    """Recommendation for model upgrade."""
    current_model: ModelSpec
    recommended_model: ModelSpec
    urgency: UpgradeUrgency
    reasons: List[str] = field(default_factory=list)
    cost_impact: float = 0.0
    quality_improvement: float = 0.0
    migration_complexity: str = "Low"

    @property
    def net_benefit(self) -> float:
        return self.quality_improvement - (self.cost_impact / 100)

    @property
    def should_upgrade(self) -> bool:
        return (self.urgency in [UpgradeUrgency.IMPORTANT, UpgradeUrgency.CRITICAL] or
                self.net_benefit > 0.1)


@dataclass
class ModelStrategy:
    """Complete model strategy for an organization."""
    name: str
    description: str
    use_cases: List[UseCase] = field(default_factory=list)
    recommendations: Dict[str, ModelRecommendation] = field(default_factory=dict)
    vendor_assessments: Dict[str, VendorAssessment] = field(default_factory=dict)
    cost_optimizations: List[CostOptimization] = field(default_factory=list)
    resilience_patterns: List[ResiliencePattern] = field(default_factory=list)
    upgrade_roadmap: List[UpgradeRecommendation] = field(default_factory=list)
    budget_allocation: BudgetAllocation = BudgetAllocation.HYBRID
    total_monthly_budget: float = 10000.0
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def total_projected_cost(self) -> float:
        return sum(r.estimated_monthly_cost for r in self.recommendations.values())

    @property
    def within_budget(self) -> bool:
        return self.total_projected_cost <= self.total_monthly_budget

    @property
    def unique_vendors(self) -> Set[str]:
        vendors = set()
        for rec in self.recommendations.values():
            vendors.add(rec.primary_model.provider)
            for fb in rec.fallback_models:
                vendors.add(fb.provider)
        return vendors

    @property
    def vendor_concentration(self) -> Dict[str, float]:
        vendor_costs: Dict[str, float] = {}
        total = self.total_projected_cost or 1

        for rec in self.recommendations.values():
            vendor = rec.primary_model.provider
            vendor_costs[vendor] = vendor_costs.get(vendor, 0) + rec.estimated_monthly_cost

        return {v: c/total for v, c in vendor_costs.items()}


# ============================================================
# ENGINE CLASSES
# ============================================================

class ModelCatalog:
    """Catalog of available models."""

    def __init__(self):
        self.models: Dict[str, ModelSpec] = {}
        self._initialize_catalog()

    def _initialize_catalog(self):
        """Initialize with known models."""
        default_models = [
            ModelSpec(
                id="claude-opus", name="Claude Opus", provider="Anthropic",
                category=ModelCategory.FRONTIER,
                context_window=200000, cost_per_1k_input=15.0, cost_per_1k_output=75.0,
                latency_p50_ms=2500, quality_score=0.95,
                capabilities={"reasoning", "coding", "analysis", "creativity", "multimodal"}
            ),
            ModelSpec(
                id="claude-sonnet", name="Claude Sonnet", provider="Anthropic",
                category=ModelCategory.BALANCED,
                context_window=200000, cost_per_1k_input=3.0, cost_per_1k_output=15.0,
                latency_p50_ms=1200, quality_score=0.88,
                capabilities={"reasoning", "coding", "analysis", "creativity"}
            ),
            ModelSpec(
                id="claude-haiku", name="Claude Haiku", provider="Anthropic",
                category=ModelCategory.FAST,
                context_window=200000, cost_per_1k_input=0.25, cost_per_1k_output=1.25,
                latency_p50_ms=400, quality_score=0.78,
                capabilities={"classification", "extraction", "simple_qa"}
            ),
            ModelSpec(
                id="gpt-4o", name="GPT-4o", provider="OpenAI",
                category=ModelCategory.BALANCED,
                context_window=128000, cost_per_1k_input=2.5, cost_per_1k_output=10.0,
                latency_p50_ms=1000, quality_score=0.87,
                capabilities={"reasoning", "coding", "analysis", "multimodal"}
            ),
            ModelSpec(
                id="gpt-4o-mini", name="GPT-4o Mini", provider="OpenAI",
                category=ModelCategory.FAST,
                context_window=128000, cost_per_1k_input=0.15, cost_per_1k_output=0.60,
                latency_p50_ms=350, quality_score=0.75,
                capabilities={"classification", "simple_qa"}
            ),
            ModelSpec(
                id="llama-3-70b", name="Llama 3 70B", provider="Meta",
                category=ModelCategory.OPEN_SOURCE,
                context_window=8192, cost_per_1k_input=0.5, cost_per_1k_output=0.5,
                latency_p50_ms=800, quality_score=0.82,
                capabilities={"reasoning", "coding"}
            )
        ]

        for model in default_models:
            self.models[model.id] = model

    def add_model(self, model: ModelSpec):
        self.models[model.id] = model

    def get_by_category(self, category: ModelCategory) -> List[ModelSpec]:
        return [m for m in self.models.values() if m.category == category]

    def get_by_capability(self, capability: str) -> List[ModelSpec]:
        return [m for m in self.models.values() if m.supports_capability(capability)]

    def get_by_provider(self, provider: str) -> List[ModelSpec]:
        return [m for m in self.models.values() if m.provider == provider]

    def search(self, max_cost: float = None, min_quality: float = None,
               max_latency: int = None, required_caps: Set[str] = None) -> List[ModelSpec]:
        """Search models by criteria."""
        results = list(self.models.values())

        if max_cost is not None:
            results = [m for m in results if m.cost_per_1k_avg <= max_cost]
        if min_quality is not None:
            results = [m for m in results if m.quality_score >= min_quality]
        if max_latency is not None:
            results = [m for m in results if m.latency_p50_ms <= max_latency]
        if required_caps:
            results = [m for m in results
                       if all(m.supports_capability(c) for c in required_caps)]

        return results


class UseCaseAnalyzer:
    """Analyzes use cases for model selection."""

    def __init__(self, catalog: ModelCatalog):
        self.catalog = catalog

    def analyze_requirements(self, use_case: UseCase) -> Dict[str, Any]:
        """Analyze use case requirements."""
        return {
            "workload_type": use_case.workload_type.value,
            "latency_requirement": use_case.workload_type.latency_requirement,
            "cost_sensitivity": use_case.workload_type.cost_sensitivity,
            "quality_threshold": use_case.quality_threshold,
            "required_capabilities": list(use_case.required_capabilities),
            "monthly_volume": use_case.volume_per_day * 30,
            "monthly_budget": use_case.monthly_budget,
            "recommended_strategy": use_case.recommended_strategy.value
        }

    def find_suitable_models(self, use_case: UseCase) -> List[ModelSpec]:
        """Find models suitable for use case."""
        candidates = self.catalog.search(
            max_latency=use_case.max_latency_ms,
            min_quality=use_case.quality_threshold,
            required_caps=use_case.required_capabilities
        )

        # Filter by cost
        candidates = [
            m for m in candidates
            if m.estimate_cost(500, 300) <= use_case.max_cost_per_request
        ]

        # Sort by quality/cost ratio
        candidates.sort(key=lambda m: m.quality_score / (m.cost_per_1k_avg + 0.1), reverse=True)

        return candidates

    def generate_recommendation(self, use_case: UseCase) -> ModelRecommendation:
        """Generate model recommendation for use case."""
        candidates = self.find_suitable_models(use_case)

        if not candidates:
            # Relax constraints and try again
            candidates = self.catalog.search(min_quality=use_case.quality_threshold * 0.9)

        if not candidates:
            candidates = list(self.catalog.models.values())

        primary = candidates[0] if candidates else list(self.catalog.models.values())[0]
        fallbacks = candidates[1:3] if len(candidates) > 1 else []

        # Check capability gaps
        gaps = {}
        for cap in use_case.required_capabilities:
            if not primary.supports_capability(cap):
                gaps[cap] = CapabilityGap.MODERATE

        # Calculate cost
        cost_projection = CostProjection(primary, use_case)

        return ModelRecommendation(
            use_case=use_case,
            primary_model=primary,
            fallback_models=fallbacks,
            routing_strategy=use_case.recommended_strategy,
            estimated_monthly_cost=cost_projection.period_cost,
            confidence_score=0.85 if not gaps else 0.65,
            capability_gaps=gaps,
            rationale=f"Best {use_case.recommended_strategy.value} fit for {use_case.name}"
        )


class CostOptimizer:
    """Optimizes model costs."""

    def __init__(self):
        self.optimizations: List[CostOptimization] = []

    def analyze_opportunities(self, strategy: ModelStrategy) -> List[Dict[str, Any]]:
        """Analyze cost optimization opportunities."""
        opportunities = []

        # Check for caching potential
        batch_candidates = [
            uc for uc in strategy.use_cases
            if uc.workload_type in [WorkloadType.BATCH, WorkloadType.BACKGROUND]
        ]
        if batch_candidates:
            opportunities.append({
                "optimization": CostOptimization.BATCH_PROCESSING,
                "applicable_use_cases": [uc.name for uc in batch_candidates],
                "estimated_savings": CostOptimization.BATCH_PROCESSING.savings_potential
            })

        # Check for tiered routing
        if len(strategy.recommendations) > 1:
            opportunities.append({
                "optimization": CostOptimization.TIERED_ROUTING,
                "applicable_use_cases": list(strategy.recommendations.keys()),
                "estimated_savings": CostOptimization.TIERED_ROUTING.savings_potential
            })

        # Check for semantic caching
        high_volume = [
            uc for uc in strategy.use_cases
            if uc.volume_per_day > 5000
        ]
        if high_volume:
            opportunities.append({
                "optimization": CostOptimization.SEMANTIC_CACHING,
                "applicable_use_cases": [uc.name for uc in high_volume],
                "estimated_savings": CostOptimization.SEMANTIC_CACHING.savings_potential
            })

        return opportunities

    def estimate_savings(self, current_cost: float,
                         optimizations: List[CostOptimization]) -> float:
        """Estimate total savings from optimizations."""
        # Parse savings ranges and take midpoint
        total_savings_pct = 0.0

        for opt in optimizations:
            savings_str = opt.savings_potential
            # Extract numbers from "XX-YY%"
            parts = savings_str.replace("%", "").split("-")
            if len(parts) == 2:
                low, high = float(parts[0]), float(parts[1])
                total_savings_pct += (low + high) / 2

        # Cap at 80% savings
        total_savings_pct = min(total_savings_pct, 80)

        return current_cost * (total_savings_pct / 100)


class ResilienceDesigner:
    """Designs resilience patterns."""

    def __init__(self, catalog: ModelCatalog):
        self.catalog = catalog

    def design_fallback_chain(self, primary: ModelSpec,
                              strategy: RoutingStrategy) -> FallbackConfig:
        """Design fallback chain for a model."""
        # Find fallback candidates
        same_provider = self.catalog.get_by_provider(primary.provider)
        other_providers = [m for m in self.catalog.models.values()
                          if m.provider != primary.provider]

        fallbacks = []

        # First fallback: same provider, different tier
        for model in same_provider:
            if model.id != primary.id and model not in fallbacks:
                fallbacks.append(model)
                break

        # Second fallback: different provider
        for model in other_providers:
            if model not in fallbacks:
                fallbacks.append(model)
                break

        # Limit based on strategy
        fallbacks = fallbacks[:strategy.fallback_count]

        return FallbackConfig(
            primary=primary,
            fallbacks=fallbacks,
            pattern=ResiliencePattern.FALLBACK,
            max_retries=2
        )

    def assess_vendor_risk(self, strategy: ModelStrategy) -> Dict[str, VendorAssessment]:
        """Assess vendor risk in strategy."""
        assessments = {}

        for vendor, concentration in strategy.vendor_concentration.items():
            risk = VendorRisk.MINIMAL
            if concentration > 0.9:
                risk = VendorRisk.CRITICAL
            elif concentration > 0.7:
                risk = VendorRisk.HIGH
            elif concentration > 0.5:
                risk = VendorRisk.MODERATE
            elif concentration > 0.3:
                risk = VendorRisk.LOW

            # Find alternatives
            other_vendors = [v for v in strategy.unique_vendors if v != vendor]

            assessments[vendor] = VendorAssessment(
                vendor=vendor,
                models_count=len(self.catalog.get_by_provider(vendor)),
                usage_percentage=concentration,
                risk_level=risk,
                alternatives=other_vendors
            )

        return assessments


class ModelStrategyEngine:
    """Main orchestrator for model strategy."""

    def __init__(self):
        self.catalog = ModelCatalog()
        self.analyzer = UseCaseAnalyzer(self.catalog)
        self.cost_optimizer = CostOptimizer()
        self.resilience = ResilienceDesigner(self.catalog)

    def create_strategy(self, name: str, description: str,
                        use_cases: List[UseCase],
                        budget: float = 10000.0) -> ModelStrategy:
        """Create complete model strategy."""
        strategy = ModelStrategy(
            name=name,
            description=description,
            use_cases=use_cases,
            total_monthly_budget=budget
        )

        # Generate recommendations for each use case
        for use_case in use_cases:
            rec = self.analyzer.generate_recommendation(use_case)
            strategy.recommendations[use_case.id] = rec

        # Assess vendor risk
        strategy.vendor_assessments = self.resilience.assess_vendor_risk(strategy)

        # Find cost optimizations
        opportunities = self.cost_optimizer.analyze_opportunities(strategy)
        strategy.cost_optimizations = [
            opp["optimization"] for opp in opportunities
        ]

        # Design resilience patterns
        for rec in strategy.recommendations.values():
            fallback = self.resilience.design_fallback_chain(
                rec.primary_model, rec.routing_strategy
            )
            rec.fallback_models = fallback.fallbacks

        strategy.resilience_patterns = [
            ResiliencePattern.FALLBACK,
            ResiliencePattern.CIRCUIT_BREAKER,
            ResiliencePattern.TIMEOUT
        ]

        return strategy

    def add_model(self, model: ModelSpec):
        """Add model to catalog."""
        self.catalog.add_model(model)

    def compare_options(self, use_case: UseCase) -> List[Dict[str, Any]]:
        """Compare model options for a use case."""
        candidates = self.analyzer.find_suitable_models(use_case)

        options = []
        for model in candidates[:5]:
            projection = CostProjection(model, use_case)
            options.append({
                "model": model.name,
                "provider": model.provider,
                "category": model.category.value,
                "quality": model.quality_score,
                "latency_p50": model.latency_p50_ms,
                "cost_per_request": projection.cost_per_request,
                "monthly_cost": projection.period_cost,
                "within_budget": projection.within_budget
            })

        return options


# ============================================================
# REPORTER CLASS
# ============================================================

class StrategyReporter:
    """Generates strategy reports and visualizations."""

    def __init__(self, engine: ModelStrategyEngine):
        self.engine = engine

    def generate_strategy_report(self, strategy: ModelStrategy) -> str:
        """Generate comprehensive strategy report."""
        lines = [
            "AI MODEL STRATEGY",
            "=" * 55,
            f"Strategy: {strategy.name}",
            f"Use Cases: {len(strategy.use_cases)}",
            f"Budget: ${strategy.total_monthly_budget:,.0f}/month",
            f"Projected Cost: ${strategy.total_projected_cost:,.0f}/month",
            f"Status: {'✅ Within Budget' if strategy.within_budget else '⚠️ Over Budget'}",
            "=" * 55,
            "",
            "USE CASE RECOMMENDATIONS",
            "-" * 40
        ]

        for uc_id, rec in strategy.recommendations.items():
            status = "✅" if rec.meets_requirements() else "⚠️"
            lines.extend([
                f"\n{status} {rec.use_case.name}",
                f"   Primary: {rec.primary_model.name} ({rec.primary_model.provider})",
                f"   Strategy: {rec.routing_strategy.value}",
                f"   Est. Cost: ${rec.estimated_monthly_cost:,.0f}/month",
                f"   Confidence: {rec.confidence_score:.0%}"
            ])

            if rec.fallback_models:
                fb_names = [m.name for m in rec.fallback_models]
                lines.append(f"   Fallbacks: {', '.join(fb_names)}")

            if rec.has_gaps:
                lines.append(f"   ⚠️ Capability Gaps: {', '.join(rec.capability_gaps.keys())}")

        lines.extend([
            "",
            "VENDOR DISTRIBUTION",
            "-" * 40
        ])

        for vendor, assessment in strategy.vendor_assessments.items():
            icon = "🔴" if assessment.needs_diversification else "🟢"
            pct = assessment.usage_percentage * 100
            bar_len = int(pct / 5)
            bar = "█" * bar_len + "░" * (20 - bar_len)
            lines.append(f"  {icon} {vendor:15} {bar} {pct:.0f}%")

        lines.extend([
            "",
            "COST OPTIMIZATION OPPORTUNITIES",
            "-" * 40
        ])

        for opt in strategy.cost_optimizations:
            lines.append(f"  💰 {opt.value}: {opt.savings_potential} savings")

        lines.extend([
            "",
            "RESILIENCE PATTERNS",
            "-" * 40
        ])

        for pattern in strategy.resilience_patterns:
            lines.append(f"  🛡️ {pattern.value}: {pattern.description}")

        return "\n".join(lines)

    def generate_comparison_report(self, use_case: UseCase) -> str:
        """Generate model comparison report for use case."""
        options = self.engine.compare_options(use_case)

        lines = [
            f"MODEL OPTIONS: {use_case.name}",
            "=" * 55,
            f"Requirements:",
            f"  Quality: ≥{use_case.quality_threshold:.0%}",
            f"  Latency: ≤{use_case.max_latency_ms}ms",
            f"  Budget: ≤${use_case.max_cost_per_request:.4f}/request",
            "",
            "OPTIONS",
            "-" * 40
        ]

        for i, opt in enumerate(options, 1):
            status = "✅" if opt["within_budget"] else "❌"
            lines.extend([
                f"\n{i}. {opt['model']} ({opt['provider']})",
                f"   {status} Category: {opt['category']}",
                f"   Quality: {opt['quality']:.0%}",
                f"   Latency: {opt['latency_p50']}ms",
                f"   Cost: ${opt['cost_per_request']:.4f}/request",
                f"   Monthly: ${opt['monthly_cost']:,.0f}"
            ])

        return "\n".join(lines)

    def generate_cost_report(self, strategy: ModelStrategy) -> str:
        """Generate cost breakdown report."""
        lines = [
            "COST ANALYSIS",
            "=" * 55,
            f"Total Budget: ${strategy.total_monthly_budget:,.0f}",
            f"Projected Spend: ${strategy.total_projected_cost:,.0f}",
            f"Remaining: ${strategy.total_monthly_budget - strategy.total_projected_cost:,.0f}",
            "",
            "BY USE CASE",
            "-" * 40
        ]

        sorted_recs = sorted(
            strategy.recommendations.items(),
            key=lambda x: x[1].estimated_monthly_cost,
            reverse=True
        )

        for uc_id, rec in sorted_recs:
            pct = rec.estimated_monthly_cost / max(strategy.total_projected_cost, 1) * 100
            bar_len = int(pct / 5)
            bar = "█" * bar_len + "░" * (20 - bar_len)
            lines.append(
                f"  {rec.use_case.name[:20]:20} {bar} "
                f"${rec.estimated_monthly_cost:,.0f} ({pct:.0f}%)"
            )

        lines.extend([
            "",
            "BY VENDOR",
            "-" * 40
        ])

        vendor_costs: Dict[str, float] = {}
        for rec in strategy.recommendations.values():
            vendor = rec.primary_model.provider
            vendor_costs[vendor] = vendor_costs.get(vendor, 0) + rec.estimated_monthly_cost

        for vendor, cost in sorted(vendor_costs.items(), key=lambda x: x[1], reverse=True):
            pct = cost / max(strategy.total_projected_cost, 1) * 100
            lines.append(f"  {vendor:15} ${cost:,.0f} ({pct:.0f}%)")

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli():
    """Create command-line interface."""
    import argparse

    parser = argparse.ArgumentParser(
        prog="model-strategy",
        description="AI Model Strategy & Selection"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Strategy command
    strategy_parser = subparsers.add_parser("strategy", help="Generate full strategy")
    strategy_parser.add_argument("name", help="Strategy name")
    strategy_parser.add_argument("--budget", type=float, default=10000, help="Monthly budget")

    # Compare command
    compare_parser = subparsers.add_parser("compare", help="Compare models for use case")
    compare_parser.add_argument("use_case", help="Use case name")
    compare_parser.add_argument("--workload", choices=[w.value for w in WorkloadType],
                                 default="interactive")
    compare_parser.add_argument("--quality", type=float, default=0.8)
    compare_parser.add_argument("--latency", type=int, default=5000)

    # Cost command
    cost_parser = subparsers.add_parser("cost", help="Cost analysis")
    cost_parser.add_argument("--budget", type=float, default=10000)

    # Catalog command
    catalog_parser = subparsers.add_parser("catalog", help="Show model catalog")
    catalog_parser.add_argument("--category", help="Filter by category")
    catalog_parser.add_argument("--provider", help="Filter by provider")

    # Fallback command
    fallback_parser = subparsers.add_parser("fallback", help="Design fallback strategy")
    fallback_parser.add_argument("model_id", help="Primary model ID")

    return parser


def main():
    """Main entry point."""
    parser = create_cli()
    args = parser.parse_args()

    engine = ModelStrategyEngine()
    reporter = StrategyReporter(engine)

    if args.command == "strategy":
        # Create sample use cases
        use_cases = [
            UseCase(
                id="chat", name="Customer Chat",
                description="Interactive customer support",
                workload_type=WorkloadType.INTERACTIVE,
                required_capabilities={"reasoning"},
                quality_threshold=0.85,
                max_latency_ms=3000,
                volume_per_day=5000
            ),
            UseCase(
                id="summarize", name="Document Summarization",
                description="Batch document processing",
                workload_type=WorkloadType.BATCH,
                required_capabilities={"analysis"},
                quality_threshold=0.80,
                max_latency_ms=30000,
                volume_per_day=1000
            ),
            UseCase(
                id="classify", name="Content Classification",
                description="Real-time content moderation",
                workload_type=WorkloadType.REAL_TIME,
                required_capabilities={"classification"},
                quality_threshold=0.90,
                max_latency_ms=1000,
                volume_per_day=50000
            )
        ]

        strategy = engine.create_strategy(args.name, "Auto-generated strategy",
                                          use_cases, args.budget)
        print(reporter.generate_strategy_report(strategy))

    elif args.command == "compare":
        use_case = UseCase(
            id=args.use_case.lower().replace(" ", "_"),
            name=args.use_case,
            description=args.use_case,
            workload_type=WorkloadType(args.workload),
            quality_threshold=args.quality,
            max_latency_ms=args.latency,
            volume_per_day=1000
        )
        print(reporter.generate_comparison_report(use_case))

    elif args.command == "catalog":
        models = list(engine.catalog.models.values())

        if args.category:
            cat = ModelCategory(args.category)
            models = [m for m in models if m.category == cat]
        if args.provider:
            models = [m for m in models if m.provider == args.provider]

        print("MODEL CATALOG")
        print("=" * 55)
        for model in models:
            print(f"\n{model.name} ({model.provider})")
            print(f"  Category: {model.category.value}")
            print(f"  Quality: {model.quality_score:.0%}")
            print(f"  Latency: {model.latency_p50_ms}ms")
            print(f"  Cost: ${model.cost_per_1k_input}/{model.cost_per_1k_output} per 1K tokens")

    elif args.command == "fallback":
        if args.model_id in engine.catalog.models:
            model = engine.catalog.models[args.model_id]
            config = engine.resilience.design_fallback_chain(model, RoutingStrategy.BALANCED)

            print(f"FALLBACK STRATEGY: {model.name}")
            print("=" * 55)
            print(f"Primary: {config.primary.name}")
            print(f"Pattern: {config.pattern.value}")
            print(f"Timeout: {config.timeout_ms}ms")
            print(f"Max Retries: {config.max_retries}")
            print("\nFallback Chain:")
            for i, fb in enumerate(config.fallbacks, 1):
                print(f"  {i}. {fb.name} ({fb.provider})")
        else:
            print(f"Model not found: {args.model_id}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

## QUICK COMMANDS

- `/model-strategy` - Full model strategy analysis
- `/model-strategy [use-case]` - Strategy for specific use case
- `/model-strategy compare [models]` - Compare specific models
- `/model-strategy cost [budget]` - Cost-optimized strategy
- `/model-strategy fallback` - Design fallback strategy

$ARGUMENTS
