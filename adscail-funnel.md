# ADSCAIL.FUNNEL.EXE - Funnel Strategy Generator

You are ADSCAIL.FUNNEL.EXE — the AI-powered funnel strategist for TOF/MOF/BOF campaign architecture, generating complete funnel strategies with retargeting sequences, content mapping, and budget allocation that convert cold traffic to customers.

MISSION
Generate complete funnel strategies that convert cold traffic to customers across all stages. Map the journey. Sequence touchpoints. Maximize conversions.

---

## CAPABILITIES

### FunnelArchitect.MOD
- Stage definition
- Objective setting
- Journey mapping
- Touchpoint planning
- Conversion path design

### ContentStrategist.MOD
- Stage-appropriate content
- Message sequencing
- Creative alignment
- Intent matching
- Offer progression

### RetargetingEngine.MOD
- Trigger definition
- Sequence timing
- Frequency optimization
- Creative rotation
- Win-back campaigns

### BudgetAllocator.MOD
- Stage budget split
- ROI optimization
- Spend pacing
- Performance rebalancing
- Efficiency tracking

---

## PRODUCTION PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
ADSCAIL.FUNNEL.EXE - Funnel Strategy Generator
Production-ready TOF/MOF/BOF funnel architecture and retargeting sequences.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from datetime import datetime
import argparse
import json


# ============================================================
# ENUMS WITH RICH PROPERTIES
# ============================================================

class FunnelStage(Enum):
    """Marketing funnel stages with objectives and metrics."""
    TOF = "top_of_funnel"
    MOF = "middle_of_funnel"
    BOF = "bottom_of_funnel"
    POST_PURCHASE = "post_purchase"
    RETENTION = "retention"

    @property
    def objective(self) -> str:
        """Primary objective for this funnel stage."""
        objectives = {
            self.TOF: "Drive awareness and introduce brand to cold audiences",
            self.MOF: "Build consideration and educate warm prospects",
            self.BOF: "Convert intent into purchase action",
            self.POST_PURCHASE: "Confirm purchase and reduce buyer's remorse",
            self.RETENTION: "Drive repeat purchases and increase LTV"
        }
        return objectives.get(self, "Engage audience")

    @property
    def primary_metrics(self) -> list:
        """Primary KPIs for this stage."""
        metrics = {
            self.TOF: ["CPM", "Reach", "Video Views", "Brand Lift"],
            self.MOF: ["CPC", "CTR", "Engagement Rate", "Cost per Lead"],
            self.BOF: ["CPA", "ROAS", "Conversion Rate", "Revenue"],
            self.POST_PURCHASE: ["Retention Rate", "Review Rate", "NPS"],
            self.RETENTION: ["LTV", "Repeat Purchase Rate", "Churn Rate"]
        }
        return metrics.get(self, [])

    @property
    def content_types(self) -> list:
        """Recommended content types for this stage."""
        content = {
            self.TOF: ["Brand videos", "Educational content", "Entertaining posts", "Thought leadership"],
            self.MOF: ["Social proof", "Comparison guides", "Case studies", "Webinars", "Lead magnets"],
            self.BOF: ["Product demos", "Testimonials", "Urgency offers", "Free trials", "Discounts"],
            self.POST_PURCHASE: ["Thank you emails", "How-to guides", "Community invites", "Review requests"],
            self.RETENTION: ["Loyalty rewards", "VIP offers", "Referral programs", "New product alerts"]
        }
        return content.get(self, [])

    @property
    def typical_conversion_rate(self) -> float:
        """Typical stage-to-stage conversion rate percentage."""
        rates = {
            self.TOF: 3.0,  # TOF to MOF
            self.MOF: 15.0,  # MOF to BOF
            self.BOF: 25.0,  # BOF to conversion
            self.POST_PURCHASE: 70.0,  # Retention rate
            self.RETENTION: 30.0  # Repeat purchase rate
        }
        return rates.get(self, 10.0)

    @property
    def audience_temperature(self) -> str:
        """Audience temperature descriptor."""
        temp = {
            self.TOF: "cold",
            self.MOF: "warm",
            self.BOF: "hot",
            self.POST_PURCHASE: "customer",
            self.RETENTION: "loyal"
        }
        return temp.get(self, "unknown")

    @property
    def typical_touchpoints(self) -> int:
        """Typical number of touchpoints in this stage."""
        touchpoints = {
            self.TOF: 3,
            self.MOF: 5,
            self.BOF: 7,
            self.POST_PURCHASE: 4,
            self.RETENTION: 12
        }
        return touchpoints.get(self, 5)


class CampaignGoal(Enum):
    """Campaign goals that determine funnel budget allocation."""
    AWARENESS = "awareness"
    LEAD_GENERATION = "lead_generation"
    SALES = "sales"
    RETARGETING_HEAVY = "retargeting_heavy"
    BALANCED = "balanced"

    @property
    def budget_split(self) -> dict:
        """Budget allocation across funnel stages (TOF/MOF/BOF)."""
        splits = {
            self.AWARENESS: {"TOF": 60, "MOF": 25, "BOF": 15},
            self.LEAD_GENERATION: {"TOF": 40, "MOF": 35, "BOF": 25},
            self.SALES: {"TOF": 30, "MOF": 30, "BOF": 40},
            self.RETARGETING_HEAVY: {"TOF": 20, "MOF": 30, "BOF": 50},
            self.BALANCED: {"TOF": 33, "MOF": 34, "BOF": 33}
        }
        return splits.get(self, {"TOF": 33, "MOF": 34, "BOF": 33})

    @property
    def primary_kpi(self) -> str:
        """Primary KPI for this campaign goal."""
        kpis = {
            self.AWARENESS: "Cost per 1000 Reach",
            self.LEAD_GENERATION: "Cost per Lead",
            self.SALES: "ROAS",
            self.RETARGETING_HEAVY: "Incremental ROAS",
            self.BALANCED: "Blended CPA"
        }
        return kpis.get(self, "Blended CPA")

    @property
    def typical_sales_cycle_days(self) -> int:
        """Typical sales cycle length in days."""
        cycles = {
            self.AWARENESS: 90,
            self.LEAD_GENERATION: 45,
            self.SALES: 14,
            self.RETARGETING_HEAVY: 7,
            self.BALANCED: 30
        }
        return cycles.get(self, 30)


class RetargetingTrigger(Enum):
    """Events that trigger retargeting sequences."""
    PAGE_VIEW = "page_view"
    PRODUCT_VIEW = "product_view"
    ADD_TO_CART = "add_to_cart"
    CHECKOUT_STARTED = "checkout_started"
    VIDEO_VIEW = "video_view"
    LEAD_FORM_STARTED = "lead_form_started"
    EMAIL_OPEN = "email_open"
    LINK_CLICK = "link_click"

    @property
    def intent_level(self) -> str:
        """Intent level indicated by this trigger."""
        levels = {
            self.PAGE_VIEW: "low",
            self.PRODUCT_VIEW: "medium",
            self.ADD_TO_CART: "high",
            self.CHECKOUT_STARTED: "very_high",
            self.VIDEO_VIEW: "low",
            self.LEAD_FORM_STARTED: "high",
            self.EMAIL_OPEN: "medium",
            self.LINK_CLICK: "medium"
        }
        return levels.get(self, "medium")

    @property
    def urgency_window_days(self) -> int:
        """Days before intent typically decays."""
        windows = {
            self.PAGE_VIEW: 30,
            self.PRODUCT_VIEW: 14,
            self.ADD_TO_CART: 7,
            self.CHECKOUT_STARTED: 3,
            self.VIDEO_VIEW: 14,
            self.LEAD_FORM_STARTED: 5,
            self.EMAIL_OPEN: 7,
            self.LINK_CLICK: 7
        }
        return windows.get(self, 14)

    @property
    def recommended_frequency_cap(self) -> int:
        """Recommended frequency cap per week."""
        caps = {
            self.PAGE_VIEW: 3,
            self.PRODUCT_VIEW: 5,
            self.ADD_TO_CART: 7,
            self.CHECKOUT_STARTED: 10,
            self.VIDEO_VIEW: 3,
            self.LEAD_FORM_STARTED: 5,
            self.EMAIL_OPEN: 4,
            self.LINK_CLICK: 4
        }
        return caps.get(self, 5)

    @property
    def typical_conversion_rate(self) -> float:
        """Typical conversion rate for retargeting this trigger (%)."""
        rates = {
            self.PAGE_VIEW: 1.5,
            self.PRODUCT_VIEW: 3.0,
            self.ADD_TO_CART: 10.0,
            self.CHECKOUT_STARTED: 25.0,
            self.VIDEO_VIEW: 2.0,
            self.LEAD_FORM_STARTED: 15.0,
            self.EMAIL_OPEN: 2.5,
            self.LINK_CLICK: 3.5
        }
        return rates.get(self, 3.0)


class CreativeType(Enum):
    """Ad creative types with performance characteristics."""
    VIDEO_SHORT = "video_short"
    VIDEO_LONG = "video_long"
    STATIC_IMAGE = "static_image"
    CAROUSEL = "carousel"
    COLLECTION = "collection"
    UGC = "user_generated_content"
    TESTIMONIAL = "testimonial"
    DYNAMIC_PRODUCT = "dynamic_product"

    @property
    def best_for_stage(self) -> list:
        """Funnel stages where this creative performs best."""
        stages = {
            self.VIDEO_SHORT: ["TOF", "MOF"],
            self.VIDEO_LONG: ["MOF"],
            self.STATIC_IMAGE: ["TOF", "MOF", "BOF"],
            self.CAROUSEL: ["MOF", "BOF"],
            self.COLLECTION: ["BOF"],
            self.UGC: ["TOF", "MOF"],
            self.TESTIMONIAL: ["MOF", "BOF"],
            self.DYNAMIC_PRODUCT: ["BOF"]
        }
        return stages.get(self, ["MOF"])

    @property
    def typical_ctr(self) -> float:
        """Typical CTR for this creative type (%)."""
        ctrs = {
            self.VIDEO_SHORT: 1.8,
            self.VIDEO_LONG: 1.2,
            self.STATIC_IMAGE: 1.5,
            self.CAROUSEL: 2.2,
            self.COLLECTION: 2.5,
            self.UGC: 2.8,
            self.TESTIMONIAL: 2.0,
            self.DYNAMIC_PRODUCT: 3.5
        }
        return ctrs.get(self, 1.5)

    @property
    def production_effort(self) -> str:
        """Production effort level."""
        effort = {
            self.VIDEO_SHORT: "high",
            self.VIDEO_LONG: "very_high",
            self.STATIC_IMAGE: "low",
            self.CAROUSEL: "medium",
            self.COLLECTION: "medium",
            self.UGC: "variable",
            self.TESTIMONIAL: "medium",
            self.DYNAMIC_PRODUCT: "low"
        }
        return effort.get(self, "medium")

    @property
    def recommended_refresh_days(self) -> int:
        """Days before creative fatigue sets in."""
        refresh = {
            self.VIDEO_SHORT: 21,
            self.VIDEO_LONG: 30,
            self.STATIC_IMAGE: 14,
            self.CAROUSEL: 21,
            self.COLLECTION: 21,
            self.UGC: 14,
            self.TESTIMONIAL: 30,
            self.DYNAMIC_PRODUCT: 45
        }
        return refresh.get(self, 21)


class OfferType(Enum):
    """Offer types with conversion characteristics."""
    NO_OFFER = "no_offer"
    PERCENTAGE_OFF = "percentage_off"
    DOLLAR_OFF = "dollar_off"
    FREE_SHIPPING = "free_shipping"
    BOGO = "buy_one_get_one"
    FREE_TRIAL = "free_trial"
    FREE_GIFT = "free_gift"
    BUNDLE_DEAL = "bundle_deal"
    LIMITED_TIME = "limited_time"

    @property
    def conversion_lift(self) -> float:
        """Typical conversion rate lift from this offer (%)."""
        lifts = {
            self.NO_OFFER: 0,
            self.PERCENTAGE_OFF: 25,
            self.DOLLAR_OFF: 20,
            self.FREE_SHIPPING: 30,
            self.BOGO: 40,
            self.FREE_TRIAL: 50,
            self.FREE_GIFT: 35,
            self.BUNDLE_DEAL: 25,
            self.LIMITED_TIME: 45
        }
        return lifts.get(self, 20)

    @property
    def margin_impact(self) -> str:
        """Impact on profit margins."""
        impacts = {
            self.NO_OFFER: "none",
            self.PERCENTAGE_OFF: "medium",
            self.DOLLAR_OFF: "medium",
            self.FREE_SHIPPING: "low",
            self.BOGO: "high",
            self.FREE_TRIAL: "variable",
            self.FREE_GIFT: "medium",
            self.BUNDLE_DEAL: "low",
            self.LIMITED_TIME: "variable"
        }
        return impacts.get(self, "medium")

    @property
    def best_for_trigger(self) -> list:
        """Retargeting triggers this offer works best with."""
        triggers = {
            self.NO_OFFER: ["page_view"],
            self.PERCENTAGE_OFF: ["add_to_cart", "checkout_started"],
            self.DOLLAR_OFF: ["product_view", "add_to_cart"],
            self.FREE_SHIPPING: ["add_to_cart", "checkout_started"],
            self.BOGO: ["product_view"],
            self.FREE_TRIAL: ["lead_form_started", "page_view"],
            self.FREE_GIFT: ["add_to_cart"],
            self.BUNDLE_DEAL: ["product_view"],
            self.LIMITED_TIME: ["checkout_started"]
        }
        return triggers.get(self, [])


class MessageTone(Enum):
    """Message tones for different funnel stages."""
    EDUCATIONAL = "educational"
    INSPIRATIONAL = "inspirational"
    SOCIAL_PROOF = "social_proof"
    URGENCY = "urgency"
    SCARCITY = "scarcity"
    REASSURANCE = "reassurance"
    EXCLUSIVE = "exclusive"
    REMINDER = "reminder"

    @property
    def best_for_stage(self) -> str:
        """Funnel stage where this tone works best."""
        stages = {
            self.EDUCATIONAL: "TOF",
            self.INSPIRATIONAL: "TOF",
            self.SOCIAL_PROOF: "MOF",
            self.URGENCY: "BOF",
            self.SCARCITY: "BOF",
            self.REASSURANCE: "BOF",
            self.EXCLUSIVE: "MOF",
            self.REMINDER: "BOF"
        }
        return stages.get(self, "MOF")

    @property
    def headline_templates(self) -> list:
        """Template headlines for this tone."""
        templates = {
            self.EDUCATIONAL: [
                "Did you know {fact}?",
                "{X} things you didn't know about {topic}",
                "The truth about {topic}"
            ],
            self.INSPIRATIONAL: [
                "Imagine {outcome}",
                "What if you could {benefit}?",
                "Your journey to {goal} starts here"
            ],
            self.SOCIAL_PROOF: [
                "{X}+ {customers} already {action}",
                "See why {persona} love {product}",
                "Rated {X}/5 by {X}+ customers"
            ],
            self.URGENCY: [
                "Last chance: {offer} ends {time}",
                "Only {X} hours left!",
                "Don't miss out on {offer}"
            ],
            self.SCARCITY: [
                "Only {X} left in stock",
                "{X}% sold out - act fast",
                "Limited quantities available"
            ],
            self.REASSURANCE: [
                "{X}-day money-back guarantee",
                "Free returns, no questions asked",
                "Join {X}+ satisfied customers"
            ],
            self.EXCLUSIVE: [
                "VIP early access: {offer}",
                "Exclusive offer just for you",
                "Members-only: {benefit}"
            ],
            self.REMINDER: [
                "Still thinking about {product}?",
                "You left something behind",
                "Your cart is waiting"
            ]
        }
        return templates.get(self, [])


# ============================================================
# DATACLASSES
# ============================================================

@dataclass
class StageStrategy:
    """Strategy for a single funnel stage."""
    stage: FunnelStage
    objective: str = ""
    budget_percent: float = 0.0
    budget_amount: float = 0.0
    tactics: list = field(default_factory=list)
    content_types: list = field(default_factory=list)
    kpis: list = field(default_factory=list)
    target_cpa: float = 0.0
    target_roas: float = 0.0

    @property
    def estimated_conversions(self) -> int:
        """Estimate conversions based on budget and target CPA."""
        if self.target_cpa > 0:
            return int(self.budget_amount / self.target_cpa)
        return 0

    @property
    def stage_completeness(self) -> float:
        """Score how complete the stage strategy is (0-100)."""
        score = 0
        if self.objective: score += 20
        if self.budget_percent > 0: score += 20
        if self.tactics: score += 20
        if self.content_types: score += 20
        if self.kpis: score += 20
        return min(score, 100)


@dataclass
class RetargetingSequence:
    """A retargeting sequence triggered by user action."""
    trigger: RetargetingTrigger
    sequence_name: str
    steps: list = field(default_factory=list)
    total_duration_days: int = 0
    frequency_cap_per_week: int = 5
    offer_progression: list = field(default_factory=list)

    @property
    def step_count(self) -> int:
        """Number of steps in the sequence."""
        return len(self.steps)

    @property
    def estimated_conversion_rate(self) -> float:
        """Estimated conversion rate based on trigger type."""
        return self.trigger.typical_conversion_rate


@dataclass
class RetargetingStep:
    """A single step in a retargeting sequence."""
    day_from_trigger: int
    message_tone: MessageTone
    creative_type: CreativeType
    offer: OfferType = OfferType.NO_OFFER
    headline: str = ""
    body_copy: str = ""

    @property
    def urgency_level(self) -> str:
        """Urgency level based on day from trigger."""
        if self.day_from_trigger <= 3:
            return "high"
        elif self.day_from_trigger <= 7:
            return "medium"
        else:
            return "low"


@dataclass
class CreativeRotation:
    """Creative rotation strategy for a funnel stage."""
    stage: FunnelStage
    creative_types: list = field(default_factory=list)
    rotation_strategy: str = "sequential"
    refresh_frequency_days: int = 14
    variants_per_type: int = 3

    @property
    def total_creatives_needed(self) -> int:
        """Total number of creatives needed."""
        return len(self.creative_types) * self.variants_per_type


@dataclass
class FunnelMetrics:
    """Projected metrics for a funnel."""
    stage: FunnelStage
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    spend: float = 0.0

    @property
    def ctr(self) -> float:
        """Click-through rate."""
        if self.impressions > 0:
            return (self.clicks / self.impressions) * 100
        return 0.0

    @property
    def conversion_rate(self) -> float:
        """Conversion rate from clicks."""
        if self.clicks > 0:
            return (self.conversions / self.clicks) * 100
        return 0.0

    @property
    def cpc(self) -> float:
        """Cost per click."""
        if self.clicks > 0:
            return self.spend / self.clicks
        return 0.0

    @property
    def cpa(self) -> float:
        """Cost per acquisition."""
        if self.conversions > 0:
            return self.spend / self.conversions
        return 0.0


@dataclass
class FunnelStrategy:
    """Complete funnel strategy."""
    campaign_name: str
    brand: str
    product: str
    goal: CampaignGoal
    total_budget: float
    sales_cycle_days: int = 30
    price_point: float = 0.0
    tof_strategy: Optional[StageStrategy] = None
    mof_strategy: Optional[StageStrategy] = None
    bof_strategy: Optional[StageStrategy] = None
    retargeting_sequences: list = field(default_factory=list)
    creative_rotation: list = field(default_factory=list)
    projected_metrics: list = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    @property
    def total_projected_conversions(self) -> int:
        """Total projected conversions across all stages."""
        return sum(m.conversions for m in self.projected_metrics)

    @property
    def blended_cpa(self) -> float:
        """Blended CPA across all stages."""
        total_conversions = self.total_projected_conversions
        if total_conversions > 0:
            return self.total_budget / total_conversions
        return 0.0

    @property
    def projected_roas(self) -> float:
        """Projected ROAS based on price point and conversions."""
        if self.total_budget > 0 and self.price_point > 0:
            revenue = self.total_projected_conversions * self.price_point
            return revenue / self.total_budget
        return 0.0

    @property
    def funnel_health_score(self) -> float:
        """Score overall funnel health (0-100)."""
        score = 0
        if self.tof_strategy and self.tof_strategy.stage_completeness >= 80: score += 25
        if self.mof_strategy and self.mof_strategy.stage_completeness >= 80: score += 25
        if self.bof_strategy and self.bof_strategy.stage_completeness >= 80: score += 25
        if len(self.retargeting_sequences) >= 2: score += 15
        if len(self.creative_rotation) >= 3: score += 10
        return min(score, 100)


# ============================================================
# ENGINE CLASSES
# ============================================================

class FunnelArchitect:
    """Engine for designing funnel architecture."""

    def __init__(self):
        self.stage_tactics = {
            FunnelStage.TOF: [
                "Brand video campaigns",
                "Broad targeting prospecting",
                "Lookalike audiences",
                "Interest-based targeting",
                "Content distribution"
            ],
            FunnelStage.MOF: [
                "Engagement retargeting",
                "Lead magnet campaigns",
                "Webinar registration",
                "Content downloads",
                "Quiz/assessment funnels"
            ],
            FunnelStage.BOF: [
                "Cart abandonment recovery",
                "Dynamic product ads",
                "Urgency campaigns",
                "Final offer sequences",
                "1:1 personalization"
            ]
        }

    def create_stage_strategy(
        self,
        stage: FunnelStage,
        budget_percent: float,
        total_budget: float,
        target_cpa: float = 0.0
    ) -> StageStrategy:
        """Create strategy for a single funnel stage."""
        budget_amount = total_budget * (budget_percent / 100)

        return StageStrategy(
            stage=stage,
            objective=stage.objective,
            budget_percent=budget_percent,
            budget_amount=budget_amount,
            tactics=self.stage_tactics.get(stage, [])[:3],
            content_types=stage.content_types[:3],
            kpis=stage.primary_metrics[:3],
            target_cpa=target_cpa if target_cpa > 0 else budget_amount / 100
        )

    def create_full_funnel(
        self,
        goal: CampaignGoal,
        total_budget: float,
        target_cpa: float = 0.0
    ) -> tuple:
        """Create all three funnel stage strategies."""
        budget_split = goal.budget_split

        tof = self.create_stage_strategy(
            FunnelStage.TOF,
            budget_split["TOF"],
            total_budget,
            target_cpa * 3  # TOF typically 3x BOF CPA
        )

        mof = self.create_stage_strategy(
            FunnelStage.MOF,
            budget_split["MOF"],
            total_budget,
            target_cpa * 1.5  # MOF typically 1.5x BOF CPA
        )

        bof = self.create_stage_strategy(
            FunnelStage.BOF,
            budget_split["BOF"],
            total_budget,
            target_cpa
        )

        return tof, mof, bof


class RetargetingBuilder:
    """Engine for building retargeting sequences."""

    def __init__(self):
        self.sequence_templates = {
            RetargetingTrigger.PAGE_VIEW: [
                (1, MessageTone.REMINDER, OfferType.NO_OFFER),
                (4, MessageTone.SOCIAL_PROOF, OfferType.NO_OFFER),
                (7, MessageTone.EDUCATIONAL, OfferType.FREE_SHIPPING),
                (14, MessageTone.URGENCY, OfferType.PERCENTAGE_OFF)
            ],
            RetargetingTrigger.ADD_TO_CART: [
                (1, MessageTone.REMINDER, OfferType.NO_OFFER),
                (2, MessageTone.REASSURANCE, OfferType.FREE_SHIPPING),
                (4, MessageTone.URGENCY, OfferType.PERCENTAGE_OFF),
                (7, MessageTone.SCARCITY, OfferType.LIMITED_TIME)
            ],
            RetargetingTrigger.CHECKOUT_STARTED: [
                (0, MessageTone.REMINDER, OfferType.NO_OFFER),
                (1, MessageTone.REASSURANCE, OfferType.FREE_SHIPPING),
                (2, MessageTone.URGENCY, OfferType.DOLLAR_OFF),
                (3, MessageTone.SCARCITY, OfferType.LIMITED_TIME)
            ],
            RetargetingTrigger.VIDEO_VIEW: [
                (1, MessageTone.EDUCATIONAL, OfferType.NO_OFFER),
                (3, MessageTone.SOCIAL_PROOF, OfferType.NO_OFFER),
                (7, MessageTone.INSPIRATIONAL, OfferType.FREE_TRIAL),
                (14, MessageTone.URGENCY, OfferType.PERCENTAGE_OFF)
            ]
        }

    def build_sequence(
        self,
        trigger: RetargetingTrigger,
        product_name: str = ""
    ) -> RetargetingSequence:
        """Build a retargeting sequence for a trigger."""
        template = self.sequence_templates.get(
            trigger,
            self.sequence_templates[RetargetingTrigger.PAGE_VIEW]
        )

        steps = []
        offers = []
        max_day = 0

        for day, tone, offer in template:
            creative = CreativeType.STATIC_IMAGE
            if tone == MessageTone.SOCIAL_PROOF:
                creative = CreativeType.TESTIMONIAL
            elif tone == MessageTone.EDUCATIONAL:
                creative = CreativeType.VIDEO_SHORT
            elif tone in [MessageTone.URGENCY, MessageTone.SCARCITY]:
                creative = CreativeType.DYNAMIC_PRODUCT

            headline = ""
            if tone.headline_templates:
                headline = tone.headline_templates[0].format(
                    product=product_name,
                    fact="this",
                    topic=product_name,
                    offer="20% off",
                    time="tonight",
                    X="1000",
                    customers="customers",
                    action="bought",
                    persona="people",
                    outcome="your goals",
                    benefit="save time",
                    goal="success"
                )

            step = RetargetingStep(
                day_from_trigger=day,
                message_tone=tone,
                creative_type=creative,
                offer=offer,
                headline=headline
            )
            steps.append(step)
            offers.append(offer)
            max_day = max(max_day, day)

        return RetargetingSequence(
            trigger=trigger,
            sequence_name=f"{trigger.value.replace('_', ' ').title()} Sequence",
            steps=steps,
            total_duration_days=max_day,
            frequency_cap_per_week=trigger.recommended_frequency_cap,
            offer_progression=offers
        )


class MetricsProjector:
    """Engine for projecting funnel metrics."""

    def __init__(self):
        self.avg_cpms = {
            FunnelStage.TOF: 12.0,
            FunnelStage.MOF: 15.0,
            FunnelStage.BOF: 20.0
        }
        self.avg_ctrs = {
            FunnelStage.TOF: 1.2,
            FunnelStage.MOF: 1.8,
            FunnelStage.BOF: 2.5
        }

    def project_metrics(self, stage_strategy: StageStrategy) -> FunnelMetrics:
        """Project metrics for a funnel stage."""
        stage = stage_strategy.stage
        spend = stage_strategy.budget_amount

        cpm = self.avg_cpms.get(stage, 15.0)
        ctr = self.avg_ctrs.get(stage, 1.5)
        conversion_rate = stage.typical_conversion_rate

        impressions = int((spend / cpm) * 1000)
        clicks = int(impressions * (ctr / 100))
        conversions = int(clicks * (conversion_rate / 100))

        return FunnelMetrics(
            stage=stage,
            impressions=impressions,
            clicks=clicks,
            conversions=conversions,
            spend=spend
        )


class CreativeRotationPlanner:
    """Engine for planning creative rotation."""

    def __init__(self):
        self.stage_creatives = {
            FunnelStage.TOF: [CreativeType.VIDEO_SHORT, CreativeType.UGC, CreativeType.STATIC_IMAGE],
            FunnelStage.MOF: [CreativeType.CAROUSEL, CreativeType.TESTIMONIAL, CreativeType.VIDEO_SHORT],
            FunnelStage.BOF: [CreativeType.DYNAMIC_PRODUCT, CreativeType.TESTIMONIAL, CreativeType.CAROUSEL]
        }

    def create_rotation(
        self,
        stage: FunnelStage,
        variants_per_type: int = 3
    ) -> CreativeRotation:
        """Create creative rotation plan for a stage."""
        creatives = self.stage_creatives.get(stage, [CreativeType.STATIC_IMAGE])

        # Calculate average refresh based on creative types
        total_refresh = sum(c.recommended_refresh_days for c in creatives)
        avg_refresh = total_refresh // len(creatives) if creatives else 14

        return CreativeRotation(
            stage=stage,
            creative_types=creatives,
            rotation_strategy="performance_based",
            refresh_frequency_days=avg_refresh,
            variants_per_type=variants_per_type
        )


class FunnelStrategyBuilder:
    """Main orchestrator for building complete funnel strategies."""

    def __init__(self):
        self.architect = FunnelArchitect()
        self.retargeting_builder = RetargetingBuilder()
        self.metrics_projector = MetricsProjector()
        self.creative_planner = CreativeRotationPlanner()

    def build_strategy(
        self,
        campaign_name: str,
        brand: str,
        product: str,
        goal: CampaignGoal,
        total_budget: float,
        price_point: float = 100.0,
        sales_cycle_days: int = None
    ) -> FunnelStrategy:
        """Build complete funnel strategy."""

        # Determine sales cycle
        cycle = sales_cycle_days or goal.typical_sales_cycle_days

        # Calculate target CPA based on price point
        target_cpa = price_point * 0.3  # 30% of price as target CPA

        # Create funnel stages
        tof, mof, bof = self.architect.create_full_funnel(
            goal=goal,
            total_budget=total_budget,
            target_cpa=target_cpa
        )

        # Build retargeting sequences
        sequences = [
            self.retargeting_builder.build_sequence(RetargetingTrigger.PAGE_VIEW, product),
            self.retargeting_builder.build_sequence(RetargetingTrigger.ADD_TO_CART, product),
            self.retargeting_builder.build_sequence(RetargetingTrigger.CHECKOUT_STARTED, product)
        ]

        # Create creative rotations
        rotations = [
            self.creative_planner.create_rotation(FunnelStage.TOF),
            self.creative_planner.create_rotation(FunnelStage.MOF),
            self.creative_planner.create_rotation(FunnelStage.BOF)
        ]

        # Project metrics
        metrics = [
            self.metrics_projector.project_metrics(tof),
            self.metrics_projector.project_metrics(mof),
            self.metrics_projector.project_metrics(bof)
        ]

        return FunnelStrategy(
            campaign_name=campaign_name,
            brand=brand,
            product=product,
            goal=goal,
            total_budget=total_budget,
            sales_cycle_days=cycle,
            price_point=price_point,
            tof_strategy=tof,
            mof_strategy=mof,
            bof_strategy=bof,
            retargeting_sequences=sequences,
            creative_rotation=rotations,
            projected_metrics=metrics
        )


# ============================================================
# REPORTER CLASS
# ============================================================

class FunnelReporter:
    """Generate ASCII dashboard reports for funnel strategies."""

    def __init__(self, strategy: FunnelStrategy):
        self.strategy = strategy

    def _progress_bar(self, value: float, max_value: float = 100, width: int = 10) -> str:
        """Generate ASCII progress bar."""
        filled = int((value / max_value) * width)
        empty = width - filled
        return f"{'█' * filled}{'░' * empty}"

    def _format_currency(self, amount: float) -> str:
        """Format currency with appropriate suffix."""
        if amount >= 1_000_000:
            return f"${amount/1_000_000:.1f}M"
        elif amount >= 1_000:
            return f"${amount/1_000:.0f}K"
        else:
            return f"${amount:.0f}"

    def _format_number(self, num: int) -> str:
        """Format large numbers."""
        if num >= 1_000_000:
            return f"{num/1_000_000:.1f}M"
        elif num >= 1_000:
            return f"{num/1_000:.0f}K"
        return str(num)

    def generate_report(self) -> str:
        """Generate complete funnel strategy report."""
        s = self.strategy

        report = f"""
FUNNEL STRATEGY
═══════════════════════════════════════════════════════════════
Brand: {s.brand}
Product: {s.product}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}
═══════════════════════════════════════════════════════════════

FUNNEL OVERVIEW
───────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│                  FUNNEL ARCHITECTURE                        │
│                                                             │
│  Brand: {s.brand:<42}  │
│  Product: {s.product:<40}  │
│  Price Point: {self._format_currency(s.price_point):<36}  │
│                                                             │
│  Total Budget: {self._format_currency(s.total_budget):<35}  │
│  Sales Cycle: {s.sales_cycle_days} days{'':<33}  │
│  Campaign Goal: {s.goal.value.upper():<33}  │
│                                                             │
│  Projected Conversions: {s.total_projected_conversions:<26}  │
│  Blended CPA: {self._format_currency(s.blended_cpa):<37}  │
│  Projected ROAS: {s.projected_roas:.2f}x{'':<32}  │
│                                                             │
│  Funnel Health: {self._progress_bar(s.funnel_health_score)} {s.funnel_health_score:.0f}%{'':<8}  │
│  Status: {'●' if s.funnel_health_score >= 70 else '○'} {'Strategy Ready' if s.funnel_health_score >= 70 else 'In Development':<30}  │
└─────────────────────────────────────────────────────────────┘
"""

        # TOF Strategy
        if s.tof_strategy:
            tof = s.tof_strategy
            report += f"""
TOP OF FUNNEL (TOF) - Awareness
───────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  Objective: {tof.objective[:40]:<40}  │
│  Budget: {self._format_currency(tof.budget_amount)} ({tof.budget_percent:.0f}%){'':<30}  │
│                                                             │
│  Tactics:                                                   │
"""
            for tactic in tof.tactics[:3]:
                report += f"│  • {tactic:<52}  │\n"
            report += f"""│                                                             │
│  Content: {', '.join(tof.content_types[:2])[:42]:<42}  │
│  KPIs: {', '.join(tof.kpis[:3]):<45}  │
└─────────────────────────────────────────────────────────────┘
"""

        # MOF Strategy
        if s.mof_strategy:
            mof = s.mof_strategy
            report += f"""
MIDDLE OF FUNNEL (MOF) - Consideration
───────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  Objective: {mof.objective[:40]:<40}  │
│  Budget: {self._format_currency(mof.budget_amount)} ({mof.budget_percent:.0f}%){'':<30}  │
│                                                             │
│  Tactics:                                                   │
"""
            for tactic in mof.tactics[:3]:
                report += f"│  • {tactic:<52}  │\n"
            report += f"""│                                                             │
│  Content: {', '.join(mof.content_types[:2])[:42]:<42}  │
│  KPIs: {', '.join(mof.kpis[:3]):<45}  │
└─────────────────────────────────────────────────────────────┘
"""

        # BOF Strategy
        if s.bof_strategy:
            bof = s.bof_strategy
            report += f"""
BOTTOM OF FUNNEL (BOF) - Conversion
───────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  Objective: {bof.objective[:40]:<40}  │
│  Budget: {self._format_currency(bof.budget_amount)} ({bof.budget_percent:.0f}%){'':<30}  │
│                                                             │
│  Tactics:                                                   │
"""
            for tactic in bof.tactics[:3]:
                report += f"│  • {tactic:<52}  │\n"
            report += f"""│                                                             │
│  Content: {', '.join(bof.content_types[:2])[:42]:<42}  │
│  KPIs: {', '.join(bof.kpis[:3]):<45}  │
└─────────────────────────────────────────────────────────────┘
"""

        # Retargeting Sequences
        if s.retargeting_sequences:
            report += """
RETARGETING SEQUENCES
───────────────────────────────────────────────────────────────
| Trigger           | Steps | Duration | Freq Cap | Conv Rate |
|-------------------|-------|----------|----------|-----------|
"""
            for seq in s.retargeting_sequences:
                report += f"| {seq.trigger.value:<17} | {seq.step_count:>5} | {seq.total_duration_days:>5} days | {seq.frequency_cap_per_week:>6}/wk | {seq.estimated_conversion_rate:>7.1f}% |\n"

        # Retargeting Detail
        report += """
RETARGETING SEQUENCE DETAILS
───────────────────────────────────────────────────────────────
"""
        for seq in s.retargeting_sequences[:2]:  # Show first 2
            report += f"\n{seq.sequence_name.upper()}\n"
            report += "| Day | Tone           | Creative       | Offer              |\n"
            report += "|-----|----------------|----------------|--------------------|\n"
            for step in seq.steps:
                report += f"| {step.day_from_trigger:>3} | {step.message_tone.value:<14} | {step.creative_type.value:<14} | {step.offer.value:<18} |\n"

        # Creative Rotation
        if s.creative_rotation:
            report += """
CREATIVE ROTATION
───────────────────────────────────────────────────────────────
"""
            for rotation in s.creative_rotation:
                creatives = ', '.join(c.value for c in rotation.creative_types[:3])
                report += f"""┌─────────────────────────────────────────────────────────────┐
│  Stage: {rotation.stage.value.upper():<43}  │
│  Creative Types: {creatives[:35]:<35}  │
│  Rotation: {rotation.rotation_strategy:<41}  │
│  Refresh Every: {rotation.refresh_frequency_days} days{'':<33}  │
│  Total Creatives Needed: {rotation.total_creatives_needed:<27}  │
└─────────────────────────────────────────────────────────────┘
"""

        # Projected Metrics
        if s.projected_metrics:
            report += """
PROJECTED METRICS
───────────────────────────────────────────────────────────────
| Stage | Impressions | Clicks   | Conversions | CTR   | CPA      |
|-------|-------------|----------|-------------|-------|----------|
"""
            for m in s.projected_metrics:
                report += f"| {m.stage.value[:5].upper():<5} | {self._format_number(m.impressions):>11} | {self._format_number(m.clicks):>8} | {m.conversions:>11} | {m.ctr:>4.1f}% | {self._format_currency(m.cpa):>8} |\n"

        # Funnel Visualization
        tof_conv = s.projected_metrics[0].conversions if s.projected_metrics else 0
        mof_conv = s.projected_metrics[1].conversions if len(s.projected_metrics) > 1 else 0
        bof_conv = s.projected_metrics[2].conversions if len(s.projected_metrics) > 2 else 0
        max_conv = max(tof_conv, mof_conv, bof_conv, 1)

        tof_bar = self._progress_bar(100, 100, 16)
        mof_pct = (mof_conv / max_conv * 100) if max_conv > 0 else 65
        mof_bar = self._progress_bar(min(mof_pct, 100), 100, 16)
        bof_pct = (bof_conv / max_conv * 100) if max_conv > 0 else 40
        bof_bar = self._progress_bar(min(bof_pct, 100), 100, 16)
        conv_pct = 15
        conv_bar = self._progress_bar(conv_pct, 100, 16)

        report += f"""
FUNNEL VISUALIZATION
───────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  TOF:     {tof_bar} 100%{'':<10}  │
│  MOF:     {mof_bar} {mof_pct:.0f}%{'':<11}  │
│  BOF:     {bof_bar} {bof_pct:.0f}%{'':<11}  │
│  Convert: {conv_bar} {conv_pct:.0f}%{'':<11}  │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
Funnel Status: {'●' if s.funnel_health_score >= 70 else '○'} {'Strategy Complete' if s.funnel_health_score >= 70 else 'In Development'}
Generated by ADSCAIL.FUNNEL.EXE
═══════════════════════════════════════════════════════════════
"""
        return report


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="ADSCAIL.FUNNEL.EXE - Funnel Strategy Generator"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Build command
    build_parser = subparsers.add_parser("build", help="Build complete funnel strategy")
    build_parser.add_argument("--brand", required=True, help="Brand name")
    build_parser.add_argument("--product", required=True, help="Product name")
    build_parser.add_argument("--goal", default="balanced",
                             choices=[e.value for e in CampaignGoal],
                             help="Campaign goal")
    build_parser.add_argument("--budget", type=float, required=True, help="Total budget")
    build_parser.add_argument("--price", type=float, default=100, help="Product price point")
    build_parser.add_argument("--cycle", type=int, help="Sales cycle in days")
    build_parser.add_argument("--output", choices=["report", "json"], default="report")

    # TOF command
    tof_parser = subparsers.add_parser("tof", help="Top of funnel strategy only")
    tof_parser.add_argument("--budget", type=float, required=True, help="TOF budget")

    # Retargeting command
    retarget_parser = subparsers.add_parser("retargeting", help="Build retargeting sequence")
    retarget_parser.add_argument("--trigger", required=True,
                                choices=[e.value for e in RetargetingTrigger],
                                help="Trigger event")
    retarget_parser.add_argument("--product", default="", help="Product name")

    # Budget command
    budget_parser = subparsers.add_parser("budget", help="Calculate budget allocation")
    budget_parser.add_argument("--total", type=float, required=True, help="Total budget")
    budget_parser.add_argument("--goal", default="balanced",
                              choices=[e.value for e in CampaignGoal])

    # Metrics command
    metrics_parser = subparsers.add_parser("metrics", help="Project stage metrics")
    metrics_parser.add_argument("--stage", required=True,
                               choices=["tof", "mof", "bof"])
    metrics_parser.add_argument("--budget", type=float, required=True)

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Run demo funnel")

    args = parser.parse_args()

    if args.command == "build":
        builder = FunnelStrategyBuilder()
        strategy = builder.build_strategy(
            campaign_name=f"{args.brand} Funnel Campaign",
            brand=args.brand,
            product=args.product,
            goal=CampaignGoal(args.goal),
            total_budget=args.budget,
            price_point=args.price,
            sales_cycle_days=args.cycle
        )

        if args.output == "json":
            print(json.dumps({
                "campaign_name": strategy.campaign_name,
                "brand": strategy.brand,
                "goal": strategy.goal.value,
                "total_budget": strategy.total_budget,
                "projected_conversions": strategy.total_projected_conversions,
                "blended_cpa": strategy.blended_cpa,
                "projected_roas": strategy.projected_roas,
                "funnel_health": strategy.funnel_health_score
            }, indent=2))
        else:
            reporter = FunnelReporter(strategy)
            print(reporter.generate_report())

    elif args.command == "tof":
        architect = FunnelArchitect()
        tof = architect.create_stage_strategy(
            FunnelStage.TOF,
            100,
            args.budget
        )
        print(f"\nTOP OF FUNNEL STRATEGY")
        print("=" * 50)
        print(f"Budget: ${args.budget:,.0f}")
        print(f"Objective: {tof.objective}")
        print(f"\nTactics:")
        for t in tof.tactics:
            print(f"  • {t}")
        print(f"\nContent Types:")
        for c in tof.content_types:
            print(f"  • {c}")
        print(f"\nKPIs: {', '.join(tof.kpis)}")

    elif args.command == "retargeting":
        builder = RetargetingBuilder()
        trigger = RetargetingTrigger(args.trigger)
        sequence = builder.build_sequence(trigger, args.product)

        print(f"\nRETARGETING SEQUENCE: {sequence.sequence_name}")
        print("=" * 60)
        print(f"Trigger: {trigger.value}")
        print(f"Intent Level: {trigger.intent_level}")
        print(f"Duration: {sequence.total_duration_days} days")
        print(f"Frequency Cap: {sequence.frequency_cap_per_week}/week")
        print(f"Expected Conversion Rate: {sequence.estimated_conversion_rate}%")
        print(f"\nSequence Steps:")
        print("-" * 60)
        for step in sequence.steps:
            print(f"Day {step.day_from_trigger}: {step.message_tone.value} | {step.creative_type.value} | {step.offer.value}")

    elif args.command == "budget":
        goal = CampaignGoal(args.goal)
        split = goal.budget_split

        print(f"\nBUDGET ALLOCATION: {goal.value.upper()}")
        print("=" * 50)
        print(f"Total Budget: ${args.total:,.0f}")
        print(f"\nAllocation:")
        for stage, pct in split.items():
            amount = args.total * (pct / 100)
            print(f"  {stage}: {pct}% = ${amount:,.0f}")
        print(f"\nPrimary KPI: {goal.primary_kpi}")
        print(f"Typical Sales Cycle: {goal.typical_sales_cycle_days} days")

    elif args.command == "metrics":
        stage_map = {
            "tof": FunnelStage.TOF,
            "mof": FunnelStage.MOF,
            "bof": FunnelStage.BOF
        }
        stage = stage_map[args.stage]

        architect = FunnelArchitect()
        projector = MetricsProjector()

        strategy = architect.create_stage_strategy(stage, 100, args.budget)
        metrics = projector.project_metrics(strategy)

        print(f"\nPROJECTED METRICS: {stage.value.upper()}")
        print("=" * 50)
        print(f"Budget: ${args.budget:,.0f}")
        print(f"\nProjections:")
        print(f"  Impressions: {metrics.impressions:,}")
        print(f"  Clicks: {metrics.clicks:,}")
        print(f"  Conversions: {metrics.conversions}")
        print(f"\nRates:")
        print(f"  CTR: {metrics.ctr:.2f}%")
        print(f"  Conversion Rate: {metrics.conversion_rate:.2f}%")
        print(f"  CPC: ${metrics.cpc:.2f}")
        print(f"  CPA: ${metrics.cpa:.2f}")

    elif args.command == "demo":
        print("\n🚀 Running ADSCAIL.FUNNEL.EXE Demo...\n")

        builder = FunnelStrategyBuilder()
        strategy = builder.build_strategy(
            campaign_name="TechGadget Pro Funnel",
            brand="TechGadget",
            product="TechGadget Pro Smartwatch",
            goal=CampaignGoal.SALES,
            total_budget=50000,
            price_point=299,
            sales_cycle_days=21
        )

        reporter = FunnelReporter(strategy)
        print(reporter.generate_report())

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/adscail-funnel [brand]` - Full funnel strategy
- `/adscail-funnel tof [product]` - Top of funnel only
- `/adscail-funnel retargeting [trigger]` - Retargeting sequence
- `/adscail-funnel budget [amount]` - Budget allocation
- `/adscail-funnel metrics [stage]` - Stage metrics

$ARGUMENTS
