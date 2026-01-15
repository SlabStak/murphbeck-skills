# WAKE-SALESOPS.EXE - RevOps Mode

You are **WAKE-SALESOPS.EXE** — the revenue operations engine for optimizing sales processes, pipeline management, and forecasting with data-driven insights.

**MISSION**: Optimize revenue operations through pipeline management, forecasting, and process automation. Know the numbers. Own the process. Drive the revenue.

---

## COMPLETE IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
WAKE-SALESOPS.EXE - Revenue Operations Engine
Production-ready RevOps system for pipeline management and forecasting.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
import json
import random


# ============================================================
# ENUMS - Revenue Operations Classifications
# ============================================================

class PipelineStage(Enum):
    """Sales pipeline stages with conversion probabilities."""
    LEAD = "lead"
    QUALIFIED = "qualified"
    DISCOVERY = "discovery"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"

    @property
    def probability(self) -> float:
        """Win probability at this stage."""
        probs = {
            self.LEAD: 0.10,
            self.QUALIFIED: 0.20,
            self.DISCOVERY: 0.40,
            self.PROPOSAL: 0.60,
            self.NEGOTIATION: 0.80,
            self.CLOSED_WON: 1.00,
            self.CLOSED_LOST: 0.00
        }
        return probs.get(self, 0.0)

    @property
    def typical_days(self) -> int:
        """Typical days in this stage."""
        days = {
            self.LEAD: 7,
            self.QUALIFIED: 5,
            self.DISCOVERY: 14,
            self.PROPOSAL: 10,
            self.NEGOTIATION: 21,
            self.CLOSED_WON: 0,
            self.CLOSED_LOST: 0
        }
        return days.get(self, 7)

    @property
    def stage_order(self) -> int:
        """Stage sequence order."""
        order = {
            self.LEAD: 1,
            self.QUALIFIED: 2,
            self.DISCOVERY: 3,
            self.PROPOSAL: 4,
            self.NEGOTIATION: 5,
            self.CLOSED_WON: 6,
            self.CLOSED_LOST: 6
        }
        return order.get(self, 0)

    @property
    def icon(self) -> str:
        """Visual icon for stage."""
        icons = {
            self.LEAD: "○",
            self.QUALIFIED: "◐",
            self.DISCOVERY: "◑",
            self.PROPOSAL: "◕",
            self.NEGOTIATION: "●",
            self.CLOSED_WON: "✓",
            self.CLOSED_LOST: "✗"
        }
        return icons.get(self, "○")


class DealPriority(Enum):
    """Deal priority levels with weighting."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

    @property
    def weight(self) -> float:
        """Priority weight for forecasting."""
        weights = {
            self.CRITICAL: 1.2,
            self.HIGH: 1.0,
            self.MEDIUM: 0.8,
            self.LOW: 0.6
        }
        return weights.get(self, 1.0)

    @property
    def follow_up_days(self) -> int:
        """Maximum days between follow-ups."""
        days = {
            self.CRITICAL: 1,
            self.HIGH: 3,
            self.MEDIUM: 7,
            self.LOW: 14
        }
        return days.get(self, 7)

    @property
    def icon(self) -> str:
        """Visual icon."""
        icons = {
            self.CRITICAL: "🔴",
            self.HIGH: "🟠",
            self.MEDIUM: "🟡",
            self.LOW: "🟢"
        }
        return icons.get(self, "⚪")


class ForecastCategory(Enum):
    """Forecast commitment categories."""
    COMMITTED = "committed"
    BEST_CASE = "best_case"
    PIPELINE = "pipeline"
    UPSIDE = "upside"
    OMITTED = "omitted"

    @property
    def confidence_range(self) -> tuple[float, float]:
        """Confidence range (min, max)."""
        ranges = {
            self.COMMITTED: (0.90, 1.00),
            self.BEST_CASE: (0.70, 0.90),
            self.PIPELINE: (0.40, 0.70),
            self.UPSIDE: (0.10, 0.40),
            self.OMITTED: (0.00, 0.10)
        }
        return ranges.get(self, (0.0, 0.5))

    @property
    def label(self) -> str:
        """Display label."""
        labels = {
            self.COMMITTED: "Committed",
            self.BEST_CASE: "Best Case",
            self.PIPELINE: "Pipeline",
            self.UPSIDE: "Upside",
            self.OMITTED: "Omitted"
        }
        return labels.get(self, "Unknown")


class ActivityType(Enum):
    """Sales activity types with point values."""
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    DEMO = "demo"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATION_CALL = "negotiation_call"
    CONTRACT_SENT = "contract_sent"

    @property
    def points(self) -> int:
        """Activity points for scoring."""
        pts = {
            self.CALL: 2,
            self.EMAIL: 1,
            self.MEETING: 5,
            self.DEMO: 8,
            self.PROPOSAL_SENT: 10,
            self.NEGOTIATION_CALL: 6,
            self.CONTRACT_SENT: 15
        }
        return pts.get(self, 1)

    @property
    def typical_duration_mins(self) -> int:
        """Typical duration in minutes."""
        durations = {
            self.CALL: 15,
            self.EMAIL: 5,
            self.MEETING: 30,
            self.DEMO: 60,
            self.PROPOSAL_SENT: 20,
            self.NEGOTIATION_CALL: 45,
            self.CONTRACT_SENT: 30
        }
        return durations.get(self, 15)


class HealthStatus(Enum):
    """Deal health status indicators."""
    HEALTHY = "healthy"
    AT_RISK = "at_risk"
    STALLED = "stalled"
    CRITICAL = "critical"

    @property
    def threshold_days(self) -> int:
        """Days without activity before this status."""
        thresholds = {
            self.HEALTHY: 0,
            self.AT_RISK: 7,
            self.STALLED: 14,
            self.CRITICAL: 21
        }
        return thresholds.get(self, 7)

    @property
    def icon(self) -> str:
        """Visual indicator."""
        icons = {
            self.HEALTHY: "●",
            self.AT_RISK: "◐",
            self.STALLED: "○",
            self.CRITICAL: "✗"
        }
        return icons.get(self, "○")

    @property
    def color_code(self) -> str:
        """Color for display."""
        colors = {
            self.HEALTHY: "green",
            self.AT_RISK: "yellow",
            self.STALLED: "orange",
            self.CRITICAL: "red"
        }
        return colors.get(self, "gray")


class MetricPeriod(Enum):
    """Time periods for metric analysis."""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

    @property
    def days(self) -> int:
        """Number of days in period."""
        period_days = {
            self.DAILY: 1,
            self.WEEKLY: 7,
            self.MONTHLY: 30,
            self.QUARTERLY: 90,
            self.YEARLY: 365
        }
        return period_days.get(self, 30)


class ProcessPhase(Enum):
    """Sales process optimization phases."""
    AUDIT = "audit"
    OPTIMIZE = "optimize"
    FORECAST = "forecast"
    EXECUTE = "execute"
    REVIEW = "review"

    @property
    def description(self) -> str:
        """Phase description."""
        descs = {
            self.AUDIT: "Assess current pipeline and identify bottlenecks",
            self.OPTIMIZE: "Streamline stages and improve qualification",
            self.FORECAST: "Analyze data and project outcomes",
            self.EXECUTE: "Implement changes and monitor metrics",
            self.REVIEW: "Evaluate results and iterate"
        }
        return descs.get(self, "")

    @property
    def typical_days(self) -> int:
        """Typical days for this phase."""
        days = {
            self.AUDIT: 5,
            self.OPTIMIZE: 10,
            self.FORECAST: 3,
            self.EXECUTE: 14,
            self.REVIEW: 2
        }
        return days.get(self, 5)


class DealSource(Enum):
    """Lead/deal source tracking."""
    INBOUND = "inbound"
    OUTBOUND = "outbound"
    REFERRAL = "referral"
    PARTNER = "partner"
    EVENT = "event"
    WEBSITE = "website"

    @property
    def typical_conversion_rate(self) -> float:
        """Typical conversion rate by source."""
        rates = {
            self.INBOUND: 0.25,
            self.OUTBOUND: 0.08,
            self.REFERRAL: 0.40,
            self.PARTNER: 0.30,
            self.EVENT: 0.15,
            self.WEBSITE: 0.12
        }
        return rates.get(self, 0.15)

    @property
    def typical_cycle_days(self) -> int:
        """Typical sales cycle by source."""
        cycles = {
            self.INBOUND: 45,
            self.OUTBOUND: 75,
            self.REFERRAL: 30,
            self.PARTNER: 40,
            self.EVENT: 60,
            self.WEBSITE: 55
        }
        return cycles.get(self, 50)


# ============================================================
# DATACLASSES - Revenue Operations Data Structures
# ============================================================

@dataclass
class Activity:
    """Sales activity record."""
    activity_id: str
    deal_id: str
    activity_type: ActivityType
    timestamp: datetime
    duration_mins: int = 0
    notes: str = ""
    outcome: str = ""

    @property
    def points(self) -> int:
        """Activity points earned."""
        return self.activity_type.points

    @property
    def is_recent(self) -> bool:
        """Check if activity is within last 7 days."""
        return (datetime.now() - self.timestamp).days <= 7


@dataclass
class Deal:
    """Sales opportunity/deal record."""
    deal_id: str
    name: str
    company: str
    value: float
    stage: PipelineStage
    priority: DealPriority = DealPriority.MEDIUM
    source: DealSource = DealSource.INBOUND
    owner: str = ""
    created_date: datetime = field(default_factory=datetime.now)
    expected_close: Optional[datetime] = None
    forecast_category: ForecastCategory = ForecastCategory.PIPELINE
    activities: list[Activity] = field(default_factory=list)
    notes: str = ""

    @property
    def weighted_value(self) -> float:
        """Value weighted by probability."""
        return self.value * self.stage.probability

    @property
    def priority_weighted_value(self) -> float:
        """Value weighted by probability and priority."""
        return self.weighted_value * self.priority.weight

    @property
    def days_in_pipeline(self) -> int:
        """Total days since deal created."""
        return (datetime.now() - self.created_date).days

    @property
    def days_since_activity(self) -> int:
        """Days since last activity."""
        if not self.activities:
            return self.days_in_pipeline
        latest = max(a.timestamp for a in self.activities)
        return (datetime.now() - latest).days

    @property
    def health_status(self) -> HealthStatus:
        """Current deal health based on activity."""
        days = self.days_since_activity
        if days <= HealthStatus.HEALTHY.threshold_days + 3:
            return HealthStatus.HEALTHY
        elif days <= HealthStatus.AT_RISK.threshold_days:
            return HealthStatus.AT_RISK
        elif days <= HealthStatus.STALLED.threshold_days:
            return HealthStatus.STALLED
        return HealthStatus.CRITICAL

    @property
    def activity_score(self) -> int:
        """Total activity points."""
        return sum(a.points for a in self.activities)

    @property
    def is_open(self) -> bool:
        """Check if deal is still open."""
        return self.stage not in [PipelineStage.CLOSED_WON, PipelineStage.CLOSED_LOST]

    @property
    def days_to_close(self) -> Optional[int]:
        """Days until expected close."""
        if not self.expected_close:
            return None
        return (self.expected_close - datetime.now()).days

    def advance_stage(self) -> bool:
        """Advance deal to next stage."""
        stage_order = [
            PipelineStage.LEAD,
            PipelineStage.QUALIFIED,
            PipelineStage.DISCOVERY,
            PipelineStage.PROPOSAL,
            PipelineStage.NEGOTIATION
        ]
        try:
            current_idx = stage_order.index(self.stage)
            if current_idx < len(stage_order) - 1:
                self.stage = stage_order[current_idx + 1]
                return True
        except ValueError:
            pass
        return False


@dataclass
class StageMetrics:
    """Metrics for a pipeline stage."""
    stage: PipelineStage
    deal_count: int = 0
    total_value: float = 0.0
    weighted_value: float = 0.0
    avg_days_in_stage: float = 0.0
    conversion_rate: float = 0.0

    @property
    def avg_deal_size(self) -> float:
        """Average deal size at this stage."""
        if self.deal_count == 0:
            return 0.0
        return self.total_value / self.deal_count

    @property
    def velocity_score(self) -> float:
        """Velocity score (lower is better)."""
        expected = self.stage.typical_days
        if expected == 0:
            return 1.0
        return min(2.0, self.avg_days_in_stage / expected)


@dataclass
class PipelineSnapshot:
    """Point-in-time pipeline snapshot."""
    snapshot_date: datetime
    total_deals: int
    total_value: float
    weighted_value: float
    stage_metrics: list[StageMetrics] = field(default_factory=list)
    health_distribution: dict[HealthStatus, int] = field(default_factory=dict)

    @property
    def avg_deal_size(self) -> float:
        """Average deal size."""
        if self.total_deals == 0:
            return 0.0
        return self.total_value / self.total_deals

    @property
    def healthy_percentage(self) -> float:
        """Percentage of healthy deals."""
        if self.total_deals == 0:
            return 0.0
        healthy = self.health_distribution.get(HealthStatus.HEALTHY, 0)
        return (healthy / self.total_deals) * 100

    @property
    def health_score(self) -> float:
        """Overall pipeline health score (0-10)."""
        if self.total_deals == 0:
            return 0.0
        weights = {
            HealthStatus.HEALTHY: 10,
            HealthStatus.AT_RISK: 6,
            HealthStatus.STALLED: 3,
            HealthStatus.CRITICAL: 0
        }
        total_score = sum(
            weights.get(status, 0) * count
            for status, count in self.health_distribution.items()
        )
        return total_score / self.total_deals


@dataclass
class Forecast:
    """Revenue forecast projection."""
    period: MetricPeriod
    period_start: datetime
    period_end: datetime
    target: float
    committed: float = 0.0
    best_case: float = 0.0
    pipeline: float = 0.0
    upside: float = 0.0

    @property
    def total_forecast(self) -> float:
        """Total forecasted value."""
        return self.committed + self.best_case + self.pipeline + self.upside

    @property
    def weighted_forecast(self) -> float:
        """Probability-weighted forecast."""
        return (
            self.committed * 0.95 +
            self.best_case * 0.70 +
            self.pipeline * 0.40 +
            self.upside * 0.15
        )

    @property
    def gap_to_target(self) -> float:
        """Gap between weighted forecast and target."""
        return self.target - self.weighted_forecast

    @property
    def attainment_percentage(self) -> float:
        """Percentage of target attainable."""
        if self.target == 0:
            return 0.0
        return (self.weighted_forecast / self.target) * 100

    @property
    def confidence_level(self) -> str:
        """Forecast confidence assessment."""
        pct = self.attainment_percentage
        if pct >= 100:
            return "High - On track to exceed target"
        elif pct >= 80:
            return "Medium - Achievable with focus"
        elif pct >= 60:
            return "Low - Significant gap to target"
        return "Critical - Major intervention needed"


@dataclass
class ConversionMetrics:
    """Stage-to-stage conversion metrics."""
    from_stage: PipelineStage
    to_stage: PipelineStage
    deals_entered: int = 0
    deals_converted: int = 0
    deals_lost: int = 0
    avg_conversion_days: float = 0.0

    @property
    def conversion_rate(self) -> float:
        """Conversion rate percentage."""
        if self.deals_entered == 0:
            return 0.0
        return (self.deals_converted / self.deals_entered) * 100

    @property
    def loss_rate(self) -> float:
        """Loss rate percentage."""
        if self.deals_entered == 0:
            return 0.0
        return (self.deals_lost / self.deals_entered) * 100

    @property
    def is_bottleneck(self) -> bool:
        """Check if this conversion is a bottleneck."""
        # Bottleneck if conversion < 50% or takes > 1.5x typical time
        expected_days = self.from_stage.typical_days
        return (
            self.conversion_rate < 50 or
            self.avg_conversion_days > expected_days * 1.5
        )


@dataclass
class RepPerformance:
    """Sales rep performance metrics."""
    rep_name: str
    deals_owned: int = 0
    total_value: float = 0.0
    weighted_value: float = 0.0
    deals_won: int = 0
    deals_lost: int = 0
    quota: float = 0.0
    activity_points: int = 0

    @property
    def win_rate(self) -> float:
        """Win rate percentage."""
        total_closed = self.deals_won + self.deals_lost
        if total_closed == 0:
            return 0.0
        return (self.deals_won / total_closed) * 100

    @property
    def quota_attainment(self) -> float:
        """Quota attainment percentage."""
        if self.quota == 0:
            return 0.0
        # Use value of won deals (simplified)
        won_value = self.weighted_value * (self.deals_won / max(1, self.deals_owned))
        return (won_value / self.quota) * 100

    @property
    def avg_deal_size(self) -> float:
        """Average deal size."""
        if self.deals_owned == 0:
            return 0.0
        return self.total_value / self.deals_owned

    @property
    def productivity_score(self) -> float:
        """Activity-based productivity score."""
        # Normalize activity points per deal
        if self.deals_owned == 0:
            return 0.0
        points_per_deal = self.activity_points / self.deals_owned
        # Target: 50 points per deal
        return min(100, (points_per_deal / 50) * 100)


# ============================================================
# ENGINE CLASSES - Revenue Operations Engines
# ============================================================

class PipelineAnalyzer:
    """Analyzes pipeline health and metrics."""

    def __init__(self):
        self.deals: list[Deal] = []
        self.snapshots: list[PipelineSnapshot] = []

    def add_deal(self, deal: Deal) -> None:
        """Add deal to pipeline."""
        self.deals.append(deal)

    def get_open_deals(self) -> list[Deal]:
        """Get all open deals."""
        return [d for d in self.deals if d.is_open]

    def get_deals_by_stage(self, stage: PipelineStage) -> list[Deal]:
        """Get deals in a specific stage."""
        return [d for d in self.deals if d.stage == stage]

    def calculate_stage_metrics(self, stage: PipelineStage) -> StageMetrics:
        """Calculate metrics for a stage."""
        stage_deals = self.get_deals_by_stage(stage)

        if not stage_deals:
            return StageMetrics(stage=stage)

        total_value = sum(d.value for d in stage_deals)
        weighted_value = sum(d.weighted_value for d in stage_deals)
        avg_days = sum(d.days_in_pipeline for d in stage_deals) / len(stage_deals)

        return StageMetrics(
            stage=stage,
            deal_count=len(stage_deals),
            total_value=total_value,
            weighted_value=weighted_value,
            avg_days_in_stage=avg_days
        )

    def create_snapshot(self) -> PipelineSnapshot:
        """Create current pipeline snapshot."""
        open_deals = self.get_open_deals()

        # Calculate health distribution
        health_dist = {}
        for status in HealthStatus:
            health_dist[status] = sum(
                1 for d in open_deals if d.health_status == status
            )

        # Calculate stage metrics
        stage_metrics = []
        for stage in PipelineStage:
            if stage not in [PipelineStage.CLOSED_WON, PipelineStage.CLOSED_LOST]:
                stage_metrics.append(self.calculate_stage_metrics(stage))

        snapshot = PipelineSnapshot(
            snapshot_date=datetime.now(),
            total_deals=len(open_deals),
            total_value=sum(d.value for d in open_deals),
            weighted_value=sum(d.weighted_value for d in open_deals),
            stage_metrics=stage_metrics,
            health_distribution=health_dist
        )

        self.snapshots.append(snapshot)
        return snapshot

    def identify_bottlenecks(self) -> list[tuple[PipelineStage, str]]:
        """Identify pipeline bottlenecks."""
        bottlenecks = []

        for stage in PipelineStage:
            if stage in [PipelineStage.CLOSED_WON, PipelineStage.CLOSED_LOST]:
                continue

            stage_deals = self.get_deals_by_stage(stage)
            if not stage_deals:
                continue

            # Check for stalled deals
            stalled = [d for d in stage_deals if d.days_since_activity > 7]
            if len(stalled) > len(stage_deals) * 0.3:
                bottlenecks.append(
                    (stage, f"{len(stalled)} deals stalled (>30% of stage)")
                )

            # Check for slow progression
            avg_days = sum(d.days_in_pipeline for d in stage_deals) / len(stage_deals)
            if avg_days > stage.typical_days * 1.5:
                bottlenecks.append(
                    (stage, f"Avg {avg_days:.0f} days vs {stage.typical_days} expected")
                )

        return bottlenecks

    def get_at_risk_deals(self) -> list[Deal]:
        """Get deals that need attention."""
        return [
            d for d in self.get_open_deals()
            if d.health_status in [HealthStatus.AT_RISK, HealthStatus.STALLED, HealthStatus.CRITICAL]
        ]


class ForecastEngine:
    """Revenue forecasting and projection engine."""

    def __init__(self, pipeline_analyzer: PipelineAnalyzer):
        self.analyzer = pipeline_analyzer
        self.forecasts: list[Forecast] = []

    def categorize_deal(self, deal: Deal) -> ForecastCategory:
        """Auto-categorize deal for forecasting."""
        # Based on stage, probability, and health
        prob = deal.stage.probability
        health = deal.health_status

        if prob >= 0.90 and health == HealthStatus.HEALTHY:
            return ForecastCategory.COMMITTED
        elif prob >= 0.60 and health in [HealthStatus.HEALTHY, HealthStatus.AT_RISK]:
            return ForecastCategory.BEST_CASE
        elif prob >= 0.30:
            return ForecastCategory.PIPELINE
        elif prob >= 0.10:
            return ForecastCategory.UPSIDE
        return ForecastCategory.OMITTED

    def create_forecast(
        self,
        period: MetricPeriod,
        target: float,
        start_date: Optional[datetime] = None
    ) -> Forecast:
        """Create forecast for a period."""
        if not start_date:
            start_date = datetime.now()

        end_date = start_date + timedelta(days=period.days)

        forecast = Forecast(
            period=period,
            period_start=start_date,
            period_end=end_date,
            target=target
        )

        # Categorize all open deals
        for deal in self.analyzer.get_open_deals():
            # Only include if expected close within period
            if deal.expected_close and deal.expected_close <= end_date:
                category = self.categorize_deal(deal)

                if category == ForecastCategory.COMMITTED:
                    forecast.committed += deal.value
                elif category == ForecastCategory.BEST_CASE:
                    forecast.best_case += deal.value
                elif category == ForecastCategory.PIPELINE:
                    forecast.pipeline += deal.value
                elif category == ForecastCategory.UPSIDE:
                    forecast.upside += deal.value

        self.forecasts.append(forecast)
        return forecast

    def project_scenarios(self, forecast: Forecast) -> dict[str, float]:
        """Project best/worst/likely scenarios."""
        return {
            "worst_case": forecast.committed * 0.85,
            "likely": forecast.weighted_forecast,
            "best_case": forecast.total_forecast * 0.75,
            "stretch": forecast.total_forecast * 0.90
        }

    def calculate_forecast_accuracy(
        self,
        actual: float,
        forecast: Forecast
    ) -> float:
        """Calculate forecast accuracy percentage."""
        if forecast.weighted_forecast == 0:
            return 0.0

        error = abs(actual - forecast.weighted_forecast)
        accuracy = max(0, 100 - (error / forecast.weighted_forecast * 100))
        return accuracy


class ProcessOptimizer:
    """Sales process optimization engine."""

    def __init__(self, pipeline_analyzer: PipelineAnalyzer):
        self.analyzer = pipeline_analyzer
        self.recommendations: list[str] = []

    def analyze_conversions(self) -> list[ConversionMetrics]:
        """Analyze stage-to-stage conversions."""
        conversions = []
        stages = [
            PipelineStage.LEAD,
            PipelineStage.QUALIFIED,
            PipelineStage.DISCOVERY,
            PipelineStage.PROPOSAL,
            PipelineStage.NEGOTIATION
        ]

        for i in range(len(stages) - 1):
            from_stage = stages[i]
            to_stage = stages[i + 1]

            from_deals = self.analyzer.get_deals_by_stage(from_stage)
            to_deals = self.analyzer.get_deals_by_stage(to_stage)

            # Simplified conversion calculation
            entered = len(from_deals) + len(to_deals)
            converted = len(to_deals)

            conversions.append(ConversionMetrics(
                from_stage=from_stage,
                to_stage=to_stage,
                deals_entered=max(1, entered),
                deals_converted=converted,
                avg_conversion_days=from_stage.typical_days
            ))

        return conversions

    def identify_optimization_opportunities(self) -> list[str]:
        """Identify process optimization opportunities."""
        opportunities = []

        # Check for bottlenecks
        bottlenecks = self.analyzer.identify_bottlenecks()
        for stage, issue in bottlenecks:
            opportunities.append(
                f"Optimize {stage.value} stage: {issue}"
            )

        # Check conversion rates
        conversions = self.analyze_conversions()
        for conv in conversions:
            if conv.is_bottleneck:
                opportunities.append(
                    f"Improve {conv.from_stage.value} → {conv.to_stage.value} "
                    f"conversion (currently {conv.conversion_rate:.1f}%)"
                )

        # Check for automation opportunities
        open_deals = self.analyzer.get_open_deals()
        low_activity = [d for d in open_deals if d.activity_score < 20]
        if len(low_activity) > len(open_deals) * 0.3:
            opportunities.append(
                "Implement automated follow-up sequences for low-activity deals"
            )

        # Check for qualification issues
        early_stage = (
            len(self.analyzer.get_deals_by_stage(PipelineStage.LEAD)) +
            len(self.analyzer.get_deals_by_stage(PipelineStage.QUALIFIED))
        )
        if early_stage > len(open_deals) * 0.5:
            opportunities.append(
                "Improve lead qualification criteria to reduce early-stage bloat"
            )

        self.recommendations = opportunities
        return opportunities

    def generate_playbook_recommendations(self) -> dict[PipelineStage, list[str]]:
        """Generate stage-specific playbook recommendations."""
        playbooks = {}

        playbooks[PipelineStage.LEAD] = [
            "Initial outreach within 24 hours",
            "Qualify budget, authority, need, timeline (BANT)",
            "Schedule discovery call if qualified"
        ]

        playbooks[PipelineStage.QUALIFIED] = [
            "Complete discovery questionnaire",
            "Identify key stakeholders",
            "Understand current solution and pain points"
        ]

        playbooks[PipelineStage.DISCOVERY] = [
            "Conduct needs assessment call",
            "Map requirements to solution",
            "Build champion relationship"
        ]

        playbooks[PipelineStage.PROPOSAL] = [
            "Create customized proposal",
            "Present to decision makers",
            "Address concerns proactively"
        ]

        playbooks[PipelineStage.NEGOTIATION] = [
            "Navigate procurement process",
            "Finalize terms and pricing",
            "Prepare contract for signature"
        ]

        return playbooks


class MetricsTracker:
    """Track and report key sales metrics."""

    def __init__(self, pipeline_analyzer: PipelineAnalyzer):
        self.analyzer = pipeline_analyzer

    def calculate_sales_velocity(self) -> float:
        """
        Calculate sales velocity.
        Velocity = (Deals × Win Rate × Avg Deal Size) / Sales Cycle Length
        """
        open_deals = self.analyzer.get_open_deals()
        if not open_deals:
            return 0.0

        num_deals = len(open_deals)
        total_value = sum(d.value for d in open_deals)
        avg_deal_size = total_value / num_deals

        # Estimate win rate from stage probabilities
        avg_probability = sum(d.stage.probability for d in open_deals) / num_deals

        # Estimate average cycle
        avg_days = sum(d.days_in_pipeline for d in open_deals) / num_deals
        avg_cycle = max(1, avg_days)

        velocity = (num_deals * avg_probability * avg_deal_size) / avg_cycle
        return velocity

    def calculate_rep_performance(self) -> list[RepPerformance]:
        """Calculate performance by rep."""
        rep_deals: dict[str, list[Deal]] = {}

        for deal in self.analyzer.deals:
            owner = deal.owner or "Unassigned"
            if owner not in rep_deals:
                rep_deals[owner] = []
            rep_deals[owner].append(deal)

        performances = []
        for rep_name, deals in rep_deals.items():
            open_deals = [d for d in deals if d.is_open]
            won = [d for d in deals if d.stage == PipelineStage.CLOSED_WON]
            lost = [d for d in deals if d.stage == PipelineStage.CLOSED_LOST]

            perf = RepPerformance(
                rep_name=rep_name,
                deals_owned=len(open_deals),
                total_value=sum(d.value for d in open_deals),
                weighted_value=sum(d.weighted_value for d in open_deals),
                deals_won=len(won),
                deals_lost=len(lost),
                activity_points=sum(d.activity_score for d in deals)
            )
            performances.append(perf)

        return performances

    def get_kpi_summary(self) -> dict[str, any]:
        """Get key KPI summary."""
        open_deals = self.analyzer.get_open_deals()
        all_deals = self.analyzer.deals

        won = [d for d in all_deals if d.stage == PipelineStage.CLOSED_WON]
        lost = [d for d in all_deals if d.stage == PipelineStage.CLOSED_LOST]

        total_closed = len(won) + len(lost)
        win_rate = (len(won) / total_closed * 100) if total_closed > 0 else 0

        return {
            "pipeline_value": sum(d.value for d in open_deals),
            "weighted_value": sum(d.weighted_value for d in open_deals),
            "deal_count": len(open_deals),
            "win_rate": win_rate,
            "avg_deal_size": (sum(d.value for d in open_deals) / len(open_deals)) if open_deals else 0,
            "sales_velocity": self.calculate_sales_velocity(),
            "health_score": self.analyzer.create_snapshot().health_score if open_deals else 0
        }

    def generate_trend_analysis(
        self,
        period: MetricPeriod = MetricPeriod.WEEKLY
    ) -> dict[str, str]:
        """Generate trend analysis."""
        # Simplified trend analysis
        kpis = self.get_kpi_summary()

        # In production, compare to historical data
        trends = {
            "pipeline_value": "stable",
            "win_rate": "improving",
            "velocity": "stable",
            "health": "needs attention" if kpis["health_score"] < 7 else "good"
        }

        return trends


class SalesOpsEngine:
    """Main RevOps engine coordinating all components."""

    def __init__(self):
        self.pipeline = PipelineAnalyzer()
        self.forecast = ForecastEngine(self.pipeline)
        self.optimizer = ProcessOptimizer(self.pipeline)
        self.metrics = MetricsTracker(self.pipeline)
        self.current_phase: ProcessPhase = ProcessPhase.AUDIT

    def add_deal(self, deal: Deal) -> None:
        """Add deal to the system."""
        self.pipeline.add_deal(deal)

    def run_pipeline_analysis(self) -> PipelineSnapshot:
        """Run complete pipeline analysis."""
        return self.pipeline.create_snapshot()

    def create_revenue_forecast(
        self,
        period: MetricPeriod,
        target: float
    ) -> Forecast:
        """Create revenue forecast."""
        return self.forecast.create_forecast(period, target)

    def get_optimization_recommendations(self) -> list[str]:
        """Get process optimization recommendations."""
        return self.optimizer.identify_optimization_opportunities()

    def get_metrics_dashboard(self) -> dict[str, any]:
        """Get comprehensive metrics dashboard."""
        kpis = self.metrics.get_kpi_summary()
        trends = self.metrics.generate_trend_analysis()
        rep_perf = self.metrics.calculate_rep_performance()

        return {
            "kpis": kpis,
            "trends": trends,
            "rep_performance": rep_perf,
            "at_risk_deals": len(self.pipeline.get_at_risk_deals()),
            "bottlenecks": self.pipeline.identify_bottlenecks()
        }

    def execute_revops_cycle(
        self,
        target: float,
        period: MetricPeriod = MetricPeriod.MONTHLY
    ) -> dict[str, any]:
        """Execute full RevOps analysis cycle."""
        results = {
            "phase": self.current_phase.value,
            "timestamp": datetime.now().isoformat()
        }

        # Phase 1: Audit
        self.current_phase = ProcessPhase.AUDIT
        results["pipeline_snapshot"] = self.run_pipeline_analysis()
        results["bottlenecks"] = self.pipeline.identify_bottlenecks()

        # Phase 2: Optimize
        self.current_phase = ProcessPhase.OPTIMIZE
        results["recommendations"] = self.get_optimization_recommendations()

        # Phase 3: Forecast
        self.current_phase = ProcessPhase.FORECAST
        results["forecast"] = self.create_revenue_forecast(period, target)
        results["scenarios"] = self.forecast.project_scenarios(results["forecast"])

        # Phase 4: Execute (generate playbooks)
        self.current_phase = ProcessPhase.EXECUTE
        results["playbooks"] = self.optimizer.generate_playbook_recommendations()

        # Phase 5: Review (compile metrics)
        self.current_phase = ProcessPhase.REVIEW
        results["metrics"] = self.get_metrics_dashboard()

        return results


# ============================================================
# REPORTER - ASCII Dashboard Generation
# ============================================================

class SalesOpsReporter:
    """Generate RevOps reports and dashboards."""

    def __init__(self, engine: SalesOpsEngine):
        self.engine = engine

    def _progress_bar(self, value: float, max_val: float, width: int = 20) -> str:
        """Generate ASCII progress bar."""
        if max_val == 0:
            pct = 0
        else:
            pct = min(1.0, value / max_val)
        filled = int(width * pct)
        empty = width - filled
        return f"{'█' * filled}{'░' * empty}"

    def _format_currency(self, value: float) -> str:
        """Format currency value."""
        if value >= 1_000_000:
            return f"${value/1_000_000:.1f}M"
        elif value >= 1_000:
            return f"${value/1_000:.0f}K"
        return f"${value:.0f}"

    def generate_pipeline_report(self) -> str:
        """Generate pipeline analysis report."""
        snapshot = self.engine.run_pipeline_analysis()

        lines = [
            "REVOPS ANALYSIS",
            "═" * 55,
            f"Period: {datetime.now().strftime('%Y-%m-%d')}",
            f"Mode: Revenue Operations",
            f"Time: {datetime.now().strftime('%H:%M:%S')}",
            "═" * 55,
            "",
            "PIPELINE OVERVIEW",
            "─" * 40,
            "┌─────────────────────────────────────────┐",
            "│         PIPELINE HEALTH                 │",
            "│                                         │",
            f"│  Total Value: {self._format_currency(snapshot.total_value):>18}     │",
            f"│  Opportunities: {snapshot.total_deals:>16}     │",
            "│                                         │",
            f"│  Health Score: {self._progress_bar(snapshot.health_score, 10, 10)} {snapshot.health_score:.1f}/10│",
            f"│  Healthy Deals: {snapshot.healthy_percentage:>14.0f}%     │",
            "│                                         │",
        ]

        # Health status indicator
        if snapshot.health_score >= 8:
            lines.append("│  Status: ● Healthy                      │")
        elif snapshot.health_score >= 6:
            lines.append("│  Status: ◐ Needs Attention              │")
        else:
            lines.append("│  Status: ○ At Risk                      │")

        lines.extend([
            "└─────────────────────────────────────────┘",
            "",
            "PIPELINE BY STAGE",
            "─" * 40,
            "| Stage        | Count | Value    | Days |",
            "|--------------|-------|----------|------|"
        ])

        for sm in snapshot.stage_metrics:
            lines.append(
                f"| {sm.stage.value:<12} | {sm.deal_count:>5} | "
                f"{self._format_currency(sm.total_value):>8} | {sm.avg_days_in_stage:>4.0f} |"
            )

        return "\n".join(lines)

    def generate_forecast_report(
        self,
        target: float,
        period: MetricPeriod = MetricPeriod.MONTHLY
    ) -> str:
        """Generate forecast report."""
        forecast = self.engine.create_revenue_forecast(period, target)
        scenarios = self.engine.forecast.project_scenarios(forecast)

        lines = [
            "",
            "FORECAST",
            "─" * 40,
            "| Category     | Value       | Confidence |",
            "|--------------|-------------|------------|",
            f"| Committed    | {self._format_currency(forecast.committed):>11} | High       |",
            f"| Best Case    | {self._format_currency(forecast.best_case):>11} | Medium     |",
            f"| Pipeline     | {self._format_currency(forecast.pipeline):>11} | Low        |",
            f"| Upside       | {self._format_currency(forecast.upside):>11} | Very Low   |",
            "|--------------|-------------|------------|",
            f"| **Weighted** | {self._format_currency(forecast.weighted_forecast):>11} |            |",
            "",
            "TARGET ATTAINMENT",
            "─" * 40,
            "┌─────────────────────────────────────────┐",
            f"│  Target: {self._format_currency(target):>25}      │",
            f"│  Forecast: {self._format_currency(forecast.weighted_forecast):>23}      │",
            f"│  Gap: {self._format_currency(forecast.gap_to_target):>28}      │",
            "│                                         │",
            f"│  Attainment: {self._progress_bar(forecast.attainment_percentage, 100, 12)} {forecast.attainment_percentage:>5.1f}%│",
            "│                                         │",
            f"│  {forecast.confidence_level:<39}│",
            "└─────────────────────────────────────────┘",
            "",
            "SCENARIO ANALYSIS",
            "─" * 40,
            f"  Worst Case:  {self._format_currency(scenarios['worst_case'])}",
            f"  Likely:      {self._format_currency(scenarios['likely'])}",
            f"  Best Case:   {self._format_currency(scenarios['best_case'])}",
            f"  Stretch:     {self._format_currency(scenarios['stretch'])}"
        ]

        return "\n".join(lines)

    def generate_metrics_report(self) -> str:
        """Generate metrics dashboard."""
        dashboard = self.engine.get_metrics_dashboard()
        kpis = dashboard["kpis"]
        trends = dashboard["trends"]

        trend_icons = {
            "improving": "▲",
            "stable": "─",
            "declining": "▼",
            "needs attention": "⚠",
            "good": "✓"
        }

        lines = [
            "",
            "CONVERSION METRICS",
            "─" * 40,
            "┌─────────────────────────────────────────┐",
            f"│  Win Rate: {kpis['win_rate']:>22.1f}%      │",
            f"│  {self._progress_bar(kpis['win_rate'], 100, 20)}              │",
            "│                                         │",
            f"│  Average Deal Size: {self._format_currency(kpis['avg_deal_size']):>14}      │",
            f"│  Sales Velocity: {self._format_currency(kpis['sales_velocity']):>17}/day  │",
            "└─────────────────────────────────────────┘",
            "",
            "KEY METRICS",
            "─" * 40,
            f"  Pipeline Value:  {self._format_currency(kpis['pipeline_value']):>15} {trend_icons.get(trends['pipeline_value'], '─')}",
            f"  Weighted Value:  {self._format_currency(kpis['weighted_value']):>15}",
            f"  Deal Count:      {kpis['deal_count']:>15}",
            f"  Health Score:    {kpis['health_score']:>14.1f}/10 {trend_icons.get(trends['health'], '─')}",
            "",
            "TRENDS",
            "─" * 40
        ]

        for metric, trend in trends.items():
            icon = trend_icons.get(trend, "─")
            lines.append(f"  {metric.replace('_', ' ').title()}: {icon} {trend}")

        return "\n".join(lines)

    def generate_recommendations_report(self) -> str:
        """Generate recommendations report."""
        recommendations = self.engine.get_optimization_recommendations()
        bottlenecks = self.engine.pipeline.identify_bottlenecks()
        at_risk = self.engine.pipeline.get_at_risk_deals()

        lines = [
            "",
            "RECOMMENDATIONS",
            "─" * 40,
            "┌─────────────────────────────────────────┐",
            "│  Priority Actions:                      │"
        ]

        for i, rec in enumerate(recommendations[:5], 1):
            # Truncate long recommendations
            if len(rec) > 35:
                rec = rec[:32] + "..."
            lines.append(f"│  {i}. {rec:<36}│")

        lines.extend([
            "│                                         │",
            "│  Risk Areas:                            │"
        ])

        for stage, issue in bottlenecks[:3]:
            issue_short = issue[:30] + "..." if len(issue) > 30 else issue
            lines.append(f"│  • {stage.value}: {issue_short:<27}│")

        if at_risk:
            lines.append(f"│  • {len(at_risk)} deals need immediate attention   │")

        lines.append("└─────────────────────────────────────────┘")

        return "\n".join(lines)

    def generate_full_report(
        self,
        target: float = 100000,
        period: MetricPeriod = MetricPeriod.MONTHLY
    ) -> str:
        """Generate complete RevOps report."""
        lines = [
            self.generate_pipeline_report(),
            self.generate_metrics_report(),
            self.generate_forecast_report(target, period),
            self.generate_recommendations_report(),
            "",
            f"RevOps Status: ● Analysis Complete",
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        ]

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def create_sample_deals() -> list[Deal]:
    """Create sample deals for demo."""
    companies = [
        ("Acme Corp", 75000, PipelineStage.NEGOTIATION, DealPriority.HIGH),
        ("TechStart Inc", 45000, PipelineStage.PROPOSAL, DealPriority.MEDIUM),
        ("Global Systems", 120000, PipelineStage.DISCOVERY, DealPriority.CRITICAL),
        ("Innovate LLC", 35000, PipelineStage.QUALIFIED, DealPriority.LOW),
        ("Enterprise Co", 200000, PipelineStage.NEGOTIATION, DealPriority.CRITICAL),
        ("Startup XYZ", 25000, PipelineStage.LEAD, DealPriority.LOW),
        ("MegaCorp", 150000, PipelineStage.PROPOSAL, DealPriority.HIGH),
        ("SmallBiz Inc", 15000, PipelineStage.DISCOVERY, DealPriority.MEDIUM),
        ("Tech Giants", 95000, PipelineStage.QUALIFIED, DealPriority.HIGH),
        ("Future Systems", 65000, PipelineStage.LEAD, DealPriority.MEDIUM),
    ]

    reps = ["Sarah Johnson", "Mike Chen", "Emily Davis", "James Wilson"]
    sources = list(DealSource)

    deals = []
    for i, (company, value, stage, priority) in enumerate(companies):
        deal = Deal(
            deal_id=f"DEAL-{i+1:04d}",
            name=f"{company} - Q1 Deal",
            company=company,
            value=value,
            stage=stage,
            priority=priority,
            source=random.choice(sources),
            owner=random.choice(reps),
            created_date=datetime.now() - timedelta(days=random.randint(10, 60)),
            expected_close=datetime.now() + timedelta(days=random.randint(15, 45))
        )

        # Add some activities
        for _ in range(random.randint(2, 8)):
            activity = Activity(
                activity_id=f"ACT-{random.randint(1000, 9999)}",
                deal_id=deal.deal_id,
                activity_type=random.choice(list(ActivityType)),
                timestamp=datetime.now() - timedelta(days=random.randint(0, 14)),
                duration_mins=random.randint(15, 60)
            )
            deal.activities.append(activity)

        deals.append(deal)

    return deals


def main():
    """Main CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="WAKE-SALESOPS.EXE - Revenue Operations Engine"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Pipeline command
    pipeline_parser = subparsers.add_parser("pipeline", help="Pipeline analysis")
    pipeline_parser.add_argument("--format", choices=["text", "json"], default="text")

    # Forecast command
    forecast_parser = subparsers.add_parser("forecast", help="Revenue forecast")
    forecast_parser.add_argument("--target", type=float, default=100000, help="Revenue target")
    forecast_parser.add_argument(
        "--period",
        choices=["daily", "weekly", "monthly", "quarterly"],
        default="monthly"
    )

    # Metrics command
    metrics_parser = subparsers.add_parser("metrics", help="Key metrics dashboard")
    metrics_parser.add_argument("--format", choices=["text", "json"], default="text")

    # Optimize command
    optimize_parser = subparsers.add_parser("optimize", help="Process optimization")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Run demo with sample data")
    demo_parser.add_argument("--target", type=float, default=500000, help="Revenue target")

    args = parser.parse_args()

    # Initialize engine
    engine = SalesOpsEngine()
    reporter = SalesOpsReporter(engine)

    if args.command == "demo":
        # Load sample deals
        for deal in create_sample_deals():
            engine.add_deal(deal)

        # Generate full report
        print(reporter.generate_full_report(args.target, MetricPeriod.MONTHLY))

    elif args.command == "pipeline":
        # Load sample deals for demo
        for deal in create_sample_deals():
            engine.add_deal(deal)

        if args.format == "json":
            snapshot = engine.run_pipeline_analysis()
            print(json.dumps({
                "total_deals": snapshot.total_deals,
                "total_value": snapshot.total_value,
                "weighted_value": snapshot.weighted_value,
                "health_score": snapshot.health_score
            }, indent=2))
        else:
            print(reporter.generate_pipeline_report())

    elif args.command == "forecast":
        for deal in create_sample_deals():
            engine.add_deal(deal)

        period_map = {
            "daily": MetricPeriod.DAILY,
            "weekly": MetricPeriod.WEEKLY,
            "monthly": MetricPeriod.MONTHLY,
            "quarterly": MetricPeriod.QUARTERLY
        }
        period = period_map.get(args.period, MetricPeriod.MONTHLY)

        print(reporter.generate_forecast_report(args.target, period))

    elif args.command == "metrics":
        for deal in create_sample_deals():
            engine.add_deal(deal)

        if args.format == "json":
            dashboard = engine.get_metrics_dashboard()
            print(json.dumps(dashboard["kpis"], indent=2))
        else:
            print(reporter.generate_metrics_report())

    elif args.command == "optimize":
        for deal in create_sample_deals():
            engine.add_deal(deal)

        print(reporter.generate_recommendations_report())

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## CAPABILITIES

### PipelineAnalyzer.MOD
- Stage progression tracking
- Velocity measurement
- Bottleneck detection
- Health scoring
- Trend analysis

### ForecastEngine.MOD
- Revenue projection
- Probability weighting
- Scenario modeling
- Risk assessment
- Accuracy tracking

### ProcessOptimizer.MOD
- Stage streamlining
- Automation identification
- Workflow design
- Handoff optimization
- Friction reduction

### MetricsTracker.MOD
- KPI monitoring
- Conversion tracking
- Activity measurement
- Quota attainment
- Performance benchmarking

---

## QUICK COMMANDS

```bash
# Run full RevOps analysis demo
python wake-salesops.md demo --target 500000

# Pipeline analysis
python wake-salesops.md pipeline

# Revenue forecast
python wake-salesops.md forecast --target 100000 --period monthly

# Key metrics dashboard
python wake-salesops.md metrics

# Process optimization recommendations
python wake-salesops.md optimize
```

---

## KEY METRICS

| Metric | Description | Frequency |
|--------|-------------|-----------|
| Pipeline Value | Total opportunity value | Daily |
| Win Rate | Opportunities won % | Weekly |
| Sales Velocity | Revenue per day potential | Weekly |
| Conversion Rate | Stage progression % | Weekly |
| Forecast Accuracy | Predicted vs actual | Monthly |

---

## WORKFLOW

### Phase 1: AUDIT
1. Assess current pipeline
2. Review conversion rates
3. Identify bottlenecks
4. Map sales process
5. Benchmark against targets

### Phase 2: OPTIMIZE
1. Streamline stages
2. Improve qualification criteria
3. Automate follow-ups
4. Enhance reporting
5. Define playbooks

### Phase 3: FORECAST
1. Analyze pipeline data
2. Apply probability weights
3. Project revenue outcomes
4. Identify deal risks
5. Set realistic targets

### Phase 4: EXECUTE
1. Implement changes
2. Train team members
3. Monitor key metrics
4. Iterate on process
5. Report to leadership

$ARGUMENTS
