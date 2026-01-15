# ADSCAIL.CAMPAIGN.EXE - Ad Campaign Builder

You are ADSCAIL.CAMPAIGN.EXE — the complete ad campaign architect that generates execution-ready campaigns with strategy, creative concepts, video scripts, ad copy, targeting, testing plans, and full-funnel mapping.

MISSION
Build complete campaigns. Generate execution-ready assets. Optimize full funnels.

---

## CAPABILITIES

### StrategyEngine.MOD
- Campaign angle development
- Offer positioning
- Value proposition crafting
- Key message extraction
- Competitive differentiation

### CreativeStudio.MOD
- Concept development
- Video script writing
- Hook variations
- Visual direction
- Scene-by-scene breakdown

### CopyWriter.MOD
- Headline generation
- Body copy variations
- CTA optimization
- Platform adaptation
- A/B test versions

### MediaPlanner.MOD
- Audience targeting
- Interest mapping
- Lookalike strategy
- Budget allocation
- Testing framework

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
ADSCAIL.CAMPAIGN.EXE - Ad Campaign Builder Engine
Production-ready campaign architecture system with strategy,
creative development, targeting, and optimization capabilities.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
import argparse
import random
import uuid


# ════════════════════════════════════════════════════════════════════════════════
# ENUMS - Campaign Configuration
# ════════════════════════════════════════════════════════════════════════════════

class CampaignGoal(Enum):
    """Campaign objectives with associated KPIs and budget allocation."""
    ACQUIRE = "acquire"
    GENERATE_LEADS = "generate_leads"
    AWARENESS = "awareness"
    PRODUCT_LAUNCH = "product_launch"
    PROMOTE = "promote"
    RETARGET = "retarget"
    ENGAGEMENT = "engagement"
    APP_INSTALL = "app_install"

    @property
    def primary_kpi(self) -> str:
        kpis = {
            self.ACQUIRE: "CPA",
            self.GENERATE_LEADS: "CPL",
            self.AWARENESS: "CPM",
            self.PRODUCT_LAUNCH: "Engagement Rate",
            self.PROMOTE: "ROAS",
            self.RETARGET: "ROAS",
            self.ENGAGEMENT: "CTR",
            self.APP_INSTALL: "CPI"
        }
        return kpis.get(self, "ROAS")

    @property
    def secondary_kpi(self) -> str:
        kpis = {
            self.ACQUIRE: "ROAS",
            self.GENERATE_LEADS: "MQL Rate",
            self.AWARENESS: "Reach",
            self.PRODUCT_LAUNCH: "Views",
            self.PROMOTE: "Revenue",
            self.RETARGET: "Conversion Rate",
            self.ENGAGEMENT: "Shares",
            self.APP_INSTALL: "D7 Retention"
        }
        return kpis.get(self, "CTR")

    @property
    def typical_cpa_range(self) -> tuple:
        """Returns (min, max) CPA in dollars."""
        ranges = {
            self.ACQUIRE: (15, 75),
            self.GENERATE_LEADS: (5, 50),
            self.AWARENESS: (2, 10),
            self.PRODUCT_LAUNCH: (10, 40),
            self.PROMOTE: (20, 100),
            self.RETARGET: (8, 35),
            self.ENGAGEMENT: (1, 5),
            self.APP_INSTALL: (2, 15)
        }
        return ranges.get(self, (10, 50))

    @property
    def budget_focus(self) -> str:
        focuses = {
            self.ACQUIRE: "Performance-focused with 70% on BOF",
            self.GENERATE_LEADS: "Balanced 50/50 TOF/MOF",
            self.AWARENESS: "80% TOF reach campaigns",
            self.PRODUCT_LAUNCH: "Full-funnel even distribution",
            self.PROMOTE: "70% BOF with urgency",
            self.RETARGET: "100% warm audiences",
            self.ENGAGEMENT: "Community and viral focus",
            self.APP_INSTALL: "Install optimization campaigns"
        }
        return focuses.get(self, "Balanced distribution")

    @property
    def icon(self) -> str:
        icons = {
            self.ACQUIRE: "🎯",
            self.GENERATE_LEADS: "📋",
            self.AWARENESS: "📣",
            self.PRODUCT_LAUNCH: "🚀",
            self.PROMOTE: "💰",
            self.RETARGET: "🔄",
            self.ENGAGEMENT: "💬",
            self.APP_INSTALL: "📱"
        }
        return icons.get(self, "📊")


class Platform(Enum):
    """Advertising platforms with specifications."""
    META = "meta"
    TIKTOK = "tiktok"
    GOOGLE = "google"
    YOUTUBE = "youtube"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    PINTEREST = "pinterest"
    SNAPCHAT = "snapchat"

    @property
    def strength(self) -> str:
        strengths = {
            self.META: "Detailed targeting, retargeting",
            self.TIKTOK: "Organic feel, viral potential",
            self.GOOGLE: "High intent, search capture",
            self.YOUTUBE: "Long-form storytelling",
            self.LINKEDIN: "B2B professional targeting",
            self.TWITTER: "Real-time, trending",
            self.PINTEREST: "Discovery, visual shopping",
            self.SNAPCHAT: "Young demographics, AR"
        }
        return strengths.get(self, "General reach")

    @property
    def primary_formats(self) -> list:
        formats = {
            self.META: ["Video", "Image", "Carousel", "Stories"],
            self.TIKTOK: ["Short Video", "Spark Ads", "TopView"],
            self.GOOGLE: ["Search", "Display", "Shopping", "Performance Max"],
            self.YOUTUBE: ["In-Stream", "Discovery", "Bumper", "Shorts"],
            self.LINKEDIN: ["Sponsored Content", "InMail", "Text Ads"],
            self.TWITTER: ["Promoted Tweets", "Video", "Carousel"],
            self.PINTEREST: ["Pins", "Video Pins", "Shopping Pins"],
            self.SNAPCHAT: ["Snap Ads", "Story Ads", "AR Lenses"]
        }
        return formats.get(self, ["Image", "Video"])

    @property
    def optimal_video_duration(self) -> tuple:
        """Returns (min_seconds, max_seconds, ideal_seconds)."""
        durations = {
            self.META: (15, 60, 30),
            self.TIKTOK: (15, 60, 21),
            self.GOOGLE: (15, 30, 20),
            self.YOUTUBE: (15, 180, 60),
            self.LINKEDIN: (15, 90, 30),
            self.TWITTER: (15, 60, 30),
            self.PINTEREST: (6, 60, 15),
            self.SNAPCHAT: (5, 180, 10)
        }
        return durations.get(self, (15, 60, 30))

    @property
    def min_daily_budget(self) -> float:
        """Minimum recommended daily budget in USD."""
        budgets = {
            self.META: 20.0,
            self.TIKTOK: 50.0,
            self.GOOGLE: 10.0,
            self.YOUTUBE: 25.0,
            self.LINKEDIN: 50.0,
            self.TWITTER: 15.0,
            self.PINTEREST: 15.0,
            self.SNAPCHAT: 20.0
        }
        return budgets.get(self, 20.0)

    @property
    def avg_cpm(self) -> float:
        """Average CPM in USD."""
        cpms = {
            self.META: 12.0,
            self.TIKTOK: 10.0,
            self.GOOGLE: 8.0,
            self.YOUTUBE: 15.0,
            self.LINKEDIN: 35.0,
            self.TWITTER: 6.5,
            self.PINTEREST: 5.0,
            self.SNAPCHAT: 8.0
        }
        return cpms.get(self, 10.0)

    @property
    def icon(self) -> str:
        icons = {
            self.META: "📘",
            self.TIKTOK: "🎵",
            self.GOOGLE: "🔍",
            self.YOUTUBE: "▶️",
            self.LINKEDIN: "💼",
            self.TWITTER: "🐦",
            self.PINTEREST: "📌",
            self.SNAPCHAT: "👻"
        }
        return icons.get(self, "📱")


class FunnelStage(Enum):
    """Marketing funnel stages with targeting approach."""
    TOF = "tof"  # Top of Funnel
    MOF = "mof"  # Middle of Funnel
    BOF = "bof"  # Bottom of Funnel
    RETENTION = "retention"

    @property
    def objective(self) -> str:
        objectives = {
            self.TOF: "Awareness & Discovery",
            self.MOF: "Consideration & Evaluation",
            self.BOF: "Conversion & Purchase",
            self.RETENTION: "Loyalty & Advocacy"
        }
        return objectives.get(self, "Engagement")

    @property
    def content_types(self) -> list:
        types = {
            self.TOF: ["Educational", "Viral", "Brand Story", "Problem-Aware"],
            self.MOF: ["Social Proof", "Comparison", "How-To", "Case Studies"],
            self.BOF: ["Offers", "Urgency", "Testimonials", "Demo"],
            self.RETENTION: ["Loyalty", "Upsell", "Referral", "Community"]
        }
        return types.get(self, ["General"])

    @property
    def audience_temp(self) -> str:
        temps = {
            self.TOF: "Cold",
            self.MOF: "Warm",
            self.BOF: "Hot",
            self.RETENTION: "Existing"
        }
        return temps.get(self, "Mixed")

    @property
    def typical_conversion_rate(self) -> float:
        """Typical conversion rate percentage."""
        rates = {
            self.TOF: 1.5,
            self.MOF: 5.0,
            self.BOF: 12.0,
            self.RETENTION: 25.0
        }
        return rates.get(self, 5.0)

    @property
    def budget_allocation(self) -> float:
        """Recommended budget percentage."""
        allocations = {
            self.TOF: 30.0,
            self.MOF: 25.0,
            self.BOF: 35.0,
            self.RETENTION: 10.0
        }
        return allocations.get(self, 25.0)

    @property
    def icon(self) -> str:
        icons = {
            self.TOF: "🔝",
            self.MOF: "🔄",
            self.BOF: "🎯",
            self.RETENTION: "💎"
        }
        return icons.get(self, "📊")


class CreativeType(Enum):
    """Types of creative assets."""
    VIDEO_UGC = "video_ugc"
    VIDEO_PRODUCED = "video_produced"
    IMAGE_STATIC = "image_static"
    CAROUSEL = "carousel"
    STORY = "story"
    COLLECTION = "collection"
    LEAD_FORM = "lead_form"
    DYNAMIC = "dynamic"

    @property
    def production_complexity(self) -> str:
        complexities = {
            self.VIDEO_UGC: "Low",
            self.VIDEO_PRODUCED: "High",
            self.IMAGE_STATIC: "Low",
            self.CAROUSEL: "Medium",
            self.STORY: "Low",
            self.COLLECTION: "Medium",
            self.LEAD_FORM: "Low",
            self.DYNAMIC: "Medium"
        }
        return complexities.get(self, "Medium")

    @property
    def typical_ctr(self) -> float:
        """Typical CTR percentage."""
        ctrs = {
            self.VIDEO_UGC: 2.5,
            self.VIDEO_PRODUCED: 1.8,
            self.IMAGE_STATIC: 1.2,
            self.CAROUSEL: 1.5,
            self.STORY: 2.0,
            self.COLLECTION: 2.2,
            self.LEAD_FORM: 3.0,
            self.DYNAMIC: 1.8
        }
        return ctrs.get(self, 1.5)

    @property
    def production_cost_range(self) -> tuple:
        """Cost range in USD (min, max)."""
        costs = {
            self.VIDEO_UGC: (100, 500),
            self.VIDEO_PRODUCED: (2000, 15000),
            self.IMAGE_STATIC: (50, 300),
            self.CAROUSEL: (150, 600),
            self.STORY: (50, 200),
            self.COLLECTION: (300, 1000),
            self.LEAD_FORM: (0, 100),
            self.DYNAMIC: (200, 800)
        }
        return costs.get(self, (100, 500))

    @property
    def best_for_funnel(self) -> list:
        stages = {
            self.VIDEO_UGC: [FunnelStage.TOF, FunnelStage.MOF],
            self.VIDEO_PRODUCED: [FunnelStage.TOF, FunnelStage.MOF],
            self.IMAGE_STATIC: [FunnelStage.MOF, FunnelStage.BOF],
            self.CAROUSEL: [FunnelStage.MOF],
            self.STORY: [FunnelStage.TOF, FunnelStage.MOF],
            self.COLLECTION: [FunnelStage.BOF],
            self.LEAD_FORM: [FunnelStage.BOF],
            self.DYNAMIC: [FunnelStage.BOF, FunnelStage.RETENTION]
        }
        return stages.get(self, [FunnelStage.MOF])

    @property
    def icon(self) -> str:
        icons = {
            self.VIDEO_UGC: "📹",
            self.VIDEO_PRODUCED: "🎬",
            self.IMAGE_STATIC: "🖼️",
            self.CAROUSEL: "🎠",
            self.STORY: "📱",
            self.COLLECTION: "🛍️",
            self.LEAD_FORM: "📝",
            self.DYNAMIC: "⚡"
        }
        return icons.get(self, "🎨")


class HookType(Enum):
    """Video hook types with engagement patterns."""
    QUESTION = "question"
    STATISTIC = "statistic"
    STORY = "story"
    CONTROVERSY = "controversy"
    BENEFIT = "benefit"
    PAIN_POINT = "pain_point"
    CURIOSITY = "curiosity"
    SOCIAL_PROOF = "social_proof"

    @property
    def template(self) -> str:
        templates = {
            self.QUESTION: "Have you ever wondered why {topic}?",
            self.STATISTIC: "{percentage}% of {audience} don't know this about {topic}",
            self.STORY: "I used to struggle with {problem} until...",
            self.CONTROVERSY: "Everyone says {common_belief}, but here's the truth...",
            self.BENEFIT: "What if you could {benefit} in just {timeframe}?",
            self.PAIN_POINT: "Tired of {problem}? You're not alone.",
            self.CURIOSITY: "This one thing changed everything about {topic}",
            self.SOCIAL_PROOF: "{number} people have already discovered {solution}"
        }
        return templates.get(self, "Discover {topic}")

    @property
    def avg_hook_rate(self) -> float:
        """Average 3-second view rate percentage."""
        rates = {
            self.QUESTION: 65.0,
            self.STATISTIC: 70.0,
            self.STORY: 75.0,
            self.CONTROVERSY: 80.0,
            self.BENEFIT: 60.0,
            self.PAIN_POINT: 72.0,
            self.CURIOSITY: 78.0,
            self.SOCIAL_PROOF: 68.0
        }
        return rates.get(self, 65.0)

    @property
    def best_for_goal(self) -> list:
        goals = {
            self.QUESTION: [CampaignGoal.AWARENESS, CampaignGoal.ENGAGEMENT],
            self.STATISTIC: [CampaignGoal.GENERATE_LEADS, CampaignGoal.AWARENESS],
            self.STORY: [CampaignGoal.ACQUIRE, CampaignGoal.PRODUCT_LAUNCH],
            self.CONTROVERSY: [CampaignGoal.AWARENESS, CampaignGoal.ENGAGEMENT],
            self.BENEFIT: [CampaignGoal.ACQUIRE, CampaignGoal.PROMOTE],
            self.PAIN_POINT: [CampaignGoal.GENERATE_LEADS, CampaignGoal.ACQUIRE],
            self.CURIOSITY: [CampaignGoal.AWARENESS, CampaignGoal.PRODUCT_LAUNCH],
            self.SOCIAL_PROOF: [CampaignGoal.ACQUIRE, CampaignGoal.RETARGET]
        }
        return goals.get(self, [CampaignGoal.AWARENESS])

    @property
    def icon(self) -> str:
        icons = {
            self.QUESTION: "❓",
            self.STATISTIC: "📊",
            self.STORY: "📖",
            self.CONTROVERSY: "🔥",
            self.BENEFIT: "✨",
            self.PAIN_POINT: "😤",
            self.CURIOSITY: "🤔",
            self.SOCIAL_PROOF: "👥"
        }
        return icons.get(self, "🎣")


class TestingVariable(Enum):
    """A/B testing variables."""
    HOOK = "hook"
    HEADLINE = "headline"
    CTA = "cta"
    CREATIVE = "creative"
    AUDIENCE = "audience"
    PLACEMENT = "placement"
    OFFER = "offer"
    FORMAT = "format"

    @property
    def priority(self) -> int:
        """Testing priority (1=highest)."""
        priorities = {
            self.HOOK: 1,
            self.HEADLINE: 2,
            self.CREATIVE: 3,
            self.AUDIENCE: 4,
            self.CTA: 5,
            self.OFFER: 6,
            self.FORMAT: 7,
            self.PLACEMENT: 8
        }
        return priorities.get(self, 5)

    @property
    def typical_lift_range(self) -> tuple:
        """Expected performance lift percentage (min, max)."""
        lifts = {
            self.HOOK: (20, 100),
            self.HEADLINE: (15, 50),
            self.CTA: (10, 40),
            self.CREATIVE: (30, 150),
            self.AUDIENCE: (50, 200),
            self.PLACEMENT: (10, 30),
            self.OFFER: (25, 100),
            self.FORMAT: (20, 60)
        }
        return lifts.get(self, (10, 50))

    @property
    def min_sample_size(self) -> int:
        """Minimum conversions for statistical significance."""
        sizes = {
            self.HOOK: 100,
            self.HEADLINE: 100,
            self.CTA: 150,
            self.CREATIVE: 50,
            self.AUDIENCE: 100,
            self.PLACEMENT: 200,
            self.OFFER: 75,
            self.FORMAT: 100
        }
        return sizes.get(self, 100)

    @property
    def icon(self) -> str:
        icons = {
            self.HOOK: "🎣",
            self.HEADLINE: "📰",
            self.CTA: "👆",
            self.CREATIVE: "🎨",
            self.AUDIENCE: "👥",
            self.PLACEMENT: "📍",
            self.OFFER: "🏷️",
            self.FORMAT: "📐"
        }
        return icons.get(self, "🧪")


class AudienceType(Enum):
    """Audience targeting types."""
    INTEREST = "interest"
    BEHAVIOR = "behavior"
    DEMOGRAPHIC = "demographic"
    LOOKALIKE = "lookalike"
    CUSTOM = "custom"
    RETARGETING = "retargeting"
    BROAD = "broad"
    CONTEXTUAL = "contextual"

    @property
    def description(self) -> str:
        descriptions = {
            self.INTEREST: "Based on topics and pages liked",
            self.BEHAVIOR: "Based on purchase and device behavior",
            self.DEMOGRAPHIC: "Age, gender, location, income",
            self.LOOKALIKE: "Similar to existing customers",
            self.CUSTOM: "First-party data uploads",
            self.RETARGETING: "Website visitors and engagers",
            self.BROAD: "Minimal targeting, algorithm-driven",
            self.CONTEXTUAL: "Based on content being viewed"
        }
        return descriptions.get(self, "General targeting")

    @property
    def typical_cpm_multiplier(self) -> float:
        multipliers = {
            self.INTEREST: 1.0,
            self.BEHAVIOR: 1.2,
            self.DEMOGRAPHIC: 0.9,
            self.LOOKALIKE: 1.3,
            self.CUSTOM: 1.5,
            self.RETARGETING: 1.8,
            self.BROAD: 0.7,
            self.CONTEXTUAL: 1.1
        }
        return multipliers.get(self, 1.0)

    @property
    def recommended_funnel_stage(self) -> FunnelStage:
        stages = {
            self.INTEREST: FunnelStage.TOF,
            self.BEHAVIOR: FunnelStage.MOF,
            self.DEMOGRAPHIC: FunnelStage.TOF,
            self.LOOKALIKE: FunnelStage.TOF,
            self.CUSTOM: FunnelStage.MOF,
            self.RETARGETING: FunnelStage.BOF,
            self.BROAD: FunnelStage.TOF,
            self.CONTEXTUAL: FunnelStage.TOF
        }
        return stages.get(self, FunnelStage.MOF)

    @property
    def icon(self) -> str:
        icons = {
            self.INTEREST: "❤️",
            self.BEHAVIOR: "🛒",
            self.DEMOGRAPHIC: "👤",
            self.LOOKALIKE: "👯",
            self.CUSTOM: "📁",
            self.RETARGETING: "🔄",
            self.BROAD: "🌐",
            self.CONTEXTUAL: "📄"
        }
        return icons.get(self, "👥")


# ════════════════════════════════════════════════════════════════════════════════
# DATACLASSES - Campaign Components
# ════════════════════════════════════════════════════════════════════════════════

@dataclass
class Brand:
    """Brand information for campaign context."""
    brand_id: str
    name: str
    industry: str
    value_proposition: str
    target_market: str
    tone_of_voice: str = "Professional yet approachable"
    unique_selling_points: list = field(default_factory=list)
    competitors: list = field(default_factory=list)
    price_point: str = "Mid-market"
    website_url: str = ""

    @property
    def positioning_statement(self) -> str:
        return f"{self.name} helps {self.target_market} {self.value_proposition}"

    @property
    def competitive_advantage(self) -> str:
        if self.unique_selling_points:
            return self.unique_selling_points[0]
        return self.value_proposition


@dataclass
class CreativeConcept:
    """Creative concept for campaign."""
    concept_id: str
    name: str
    description: str
    visual_direction: str
    emotional_tone: str
    creative_type: CreativeType
    hook_type: HookType
    target_funnel_stage: FunnelStage
    estimated_production_cost: float = 0.0
    status: str = "draft"

    @property
    def production_complexity(self) -> str:
        return self.creative_type.production_complexity

    @property
    def expected_ctr(self) -> float:
        base_ctr = self.creative_type.typical_ctr
        hook_boost = self.hook_type.avg_hook_rate / 100
        return base_ctr * (1 + hook_boost * 0.3)

    def estimate_cost(self) -> float:
        min_cost, max_cost = self.creative_type.production_cost_range
        return (min_cost + max_cost) / 2


@dataclass
class VideoScript:
    """Video script with scene breakdown."""
    script_id: str
    title: str
    platform: Platform
    duration_seconds: int
    hook: str
    hook_type: HookType
    scenes: list = field(default_factory=list)
    cta: str = ""
    voiceover_style: str = "Conversational"
    music_direction: str = "Upbeat, modern"

    @property
    def scene_count(self) -> int:
        return len(self.scenes)

    @property
    def is_optimal_duration(self) -> bool:
        min_dur, max_dur, _ = self.platform.optimal_video_duration
        return min_dur <= self.duration_seconds <= max_dur

    @property
    def estimated_production_time_hours(self) -> float:
        base_time = 4.0
        scene_time = self.scene_count * 0.5
        return base_time + scene_time

    def add_scene(self, description: str, visual: str, voiceover: str, duration: int = 5):
        self.scenes.append({
            "description": description,
            "visual": visual,
            "voiceover": voiceover,
            "duration": duration
        })


@dataclass
class AdCopy:
    """Ad copy variation."""
    copy_id: str
    headline: str
    body: str
    cta: str
    platform: Platform
    funnel_stage: FunnelStage
    character_counts: dict = field(default_factory=dict)

    def __post_init__(self):
        self.character_counts = {
            "headline": len(self.headline),
            "body": len(self.body),
            "cta": len(self.cta)
        }

    @property
    def total_characters(self) -> int:
        return sum(self.character_counts.values())

    @property
    def meets_platform_limits(self) -> bool:
        limits = {
            Platform.META: {"headline": 40, "body": 125},
            Platform.TIKTOK: {"headline": 100, "body": 100},
            Platform.GOOGLE: {"headline": 30, "body": 90},
            Platform.LINKEDIN: {"headline": 70, "body": 150}
        }
        platform_limits = limits.get(self.platform, {"headline": 50, "body": 150})
        return (self.character_counts["headline"] <= platform_limits["headline"] and
                self.character_counts["body"] <= platform_limits["body"])


@dataclass
class TargetingProfile:
    """Audience targeting configuration."""
    profile_id: str
    name: str
    audience_type: AudienceType
    funnel_stage: FunnelStage
    age_range: tuple = (25, 55)
    genders: list = field(default_factory=lambda: ["all"])
    locations: list = field(default_factory=list)
    interests: list = field(default_factory=list)
    behaviors: list = field(default_factory=list)
    exclusions: list = field(default_factory=list)
    estimated_reach: int = 0
    lookalike_source: str = ""
    lookalike_percentage: float = 0.0

    @property
    def audience_size_category(self) -> str:
        if self.estimated_reach < 100000:
            return "Narrow"
        elif self.estimated_reach < 1000000:
            return "Medium"
        elif self.estimated_reach < 10000000:
            return "Broad"
        else:
            return "Very Broad"

    @property
    def estimated_cpm(self) -> float:
        base_cpm = 10.0
        return base_cpm * self.audience_type.typical_cpm_multiplier

    @property
    def targeting_summary(self) -> str:
        parts = []
        if self.interests:
            parts.append(f"Interests: {', '.join(self.interests[:3])}")
        if self.behaviors:
            parts.append(f"Behaviors: {', '.join(self.behaviors[:3])}")
        if self.lookalike_source:
            parts.append(f"Lookalike: {self.lookalike_percentage}% of {self.lookalike_source}")
        return " | ".join(parts) if parts else "Broad targeting"


@dataclass
class TestPlan:
    """A/B testing plan."""
    plan_id: str
    name: str
    variable: TestingVariable
    variants: list = field(default_factory=list)
    hypothesis: str = ""
    success_metric: str = ""
    min_budget: float = 0.0
    min_duration_days: int = 7
    status: str = "planned"

    @property
    def variant_count(self) -> int:
        return len(self.variants)

    @property
    def required_sample_size(self) -> int:
        return self.variable.min_sample_size * self.variant_count

    @property
    def expected_lift_range(self) -> tuple:
        return self.variable.typical_lift_range

    def add_variant(self, variant_name: str, description: str):
        self.variants.append({
            "name": variant_name,
            "description": description,
            "status": "active"
        })


@dataclass
class FunnelLayer:
    """Single funnel layer configuration."""
    stage: FunnelStage
    budget_percentage: float
    targeting_profiles: list = field(default_factory=list)
    creative_concepts: list = field(default_factory=list)
    ad_copies: list = field(default_factory=list)
    success_metrics: list = field(default_factory=list)

    @property
    def content_types(self) -> list:
        return self.stage.content_types

    @property
    def expected_conversion_rate(self) -> float:
        return self.stage.typical_conversion_rate

    @property
    def is_properly_configured(self) -> bool:
        return (len(self.targeting_profiles) > 0 and
                len(self.creative_concepts) > 0)


@dataclass
class Campaign:
    """Complete campaign configuration."""
    campaign_id: str
    name: str
    brand: Brand
    goal: CampaignGoal
    platforms: list = field(default_factory=list)
    total_budget: float = 0.0
    duration_days: int = 30
    funnel_layers: dict = field(default_factory=dict)
    creative_concepts: list = field(default_factory=list)
    video_scripts: list = field(default_factory=list)
    ad_copies: list = field(default_factory=list)
    targeting_profiles: list = field(default_factory=list)
    test_plans: list = field(default_factory=list)
    start_date: datetime = field(default_factory=datetime.now)
    status: str = "draft"

    @property
    def daily_budget(self) -> float:
        return self.total_budget / self.duration_days if self.duration_days > 0 else 0

    @property
    def end_date(self) -> datetime:
        return self.start_date + timedelta(days=self.duration_days)

    @property
    def platform_count(self) -> int:
        return len(self.platforms)

    @property
    def creative_count(self) -> int:
        return len(self.creative_concepts)

    @property
    def estimated_reach(self) -> int:
        total_reach = 0
        for profile in self.targeting_profiles:
            total_reach += profile.estimated_reach
        return total_reach

    @property
    def estimated_impressions(self) -> int:
        avg_cpm = sum(p.avg_cpm for p in self.platforms) / len(self.platforms) if self.platforms else 10
        return int((self.total_budget / avg_cpm) * 1000)

    @property
    def readiness_score(self) -> int:
        score = 0
        if self.brand:
            score += 1
        if self.goal:
            score += 1
        if self.platforms:
            score += 1
        if self.total_budget > 0:
            score += 1
        if self.creative_concepts:
            score += 2
        if self.video_scripts:
            score += 1
        if self.ad_copies:
            score += 1
        if self.targeting_profiles:
            score += 2
        if self.funnel_layers:
            score += 1
        return min(score, 10)

    @property
    def is_launch_ready(self) -> bool:
        return self.readiness_score >= 8


# ════════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - Campaign Building
# ════════════════════════════════════════════════════════════════════════════════

class StrategyEngine:
    """Develops campaign strategy and positioning."""

    def __init__(self, brand: Brand):
        self.brand = brand
        self.angles: list = []
        self.value_props: list = []

    def develop_campaign_angle(self, goal: CampaignGoal) -> dict:
        """Develop campaign angle based on goal."""
        angle_templates = {
            CampaignGoal.ACQUIRE: [
                f"Transform how {self.brand.target_market} approaches {self.brand.industry}",
                f"The smarter way to {self.brand.value_proposition}",
                f"Join thousands who've discovered {self.brand.name}"
            ],
            CampaignGoal.GENERATE_LEADS: [
                f"Free guide: Master {self.brand.industry} in 2024",
                f"Discover the secrets top {self.brand.target_market} use",
                f"Your blueprint for {self.brand.value_proposition}"
            ],
            CampaignGoal.AWARENESS: [
                f"Meet {self.brand.name}: Redefining {self.brand.industry}",
                f"The future of {self.brand.industry} is here",
                f"Why {self.brand.target_market} are switching to {self.brand.name}"
            ],
            CampaignGoal.PRODUCT_LAUNCH: [
                f"Introducing: A new era of {self.brand.value_proposition}",
                f"Finally: {self.brand.industry} made simple",
                f"The wait is over: {self.brand.name} is here"
            ]
        }

        angles = angle_templates.get(goal, [f"Discover {self.brand.name}"])

        return {
            "primary_angle": angles[0] if angles else "",
            "alternative_angles": angles[1:] if len(angles) > 1 else [],
            "goal_alignment": goal.value,
            "brand_fit_score": 8.5
        }

    def craft_value_proposition(self) -> dict:
        """Create compelling value proposition."""
        return {
            "headline": f"{self.brand.value_proposition} - Simplified",
            "subheadline": f"For {self.brand.target_market} who want results",
            "key_benefits": self.brand.unique_selling_points[:3] if self.brand.unique_selling_points else [
                "Save time",
                "Increase efficiency",
                "Get better results"
            ],
            "proof_points": [
                "Trusted by industry leaders",
                "Proven methodology",
                "Results guaranteed"
            ],
            "differentiator": self.brand.competitive_advantage
        }

    def analyze_competitive_space(self) -> dict:
        """Analyze competitive positioning."""
        return {
            "competitors": self.brand.competitors,
            "our_position": "Differentiated leader",
            "key_differentiators": self.brand.unique_selling_points,
            "market_gaps": [
                f"Underserved {self.brand.target_market} segment",
                "Price-to-value optimization opportunity",
                "Feature innovation potential"
            ],
            "strategic_recommendations": [
                "Lead with unique value proposition",
                "Emphasize customer success stories",
                "Highlight ease of use"
            ]
        }


class CreativeStudio:
    """Develops creative concepts and scripts."""

    def __init__(self, brand: Brand):
        self.brand = brand
        self.concepts: list = []
        self.scripts: list = []

    def generate_concepts(self, goal: CampaignGoal, count: int = 3) -> list:
        """Generate creative concepts."""
        concept_frameworks = {
            CampaignGoal.ACQUIRE: [
                ("Transformation Story", "Show before/after journey", "Inspiring"),
                ("Problem-Solution", "Address pain points directly", "Empathetic"),
                ("Social Proof", "Customer success showcase", "Trustworthy")
            ],
            CampaignGoal.AWARENESS: [
                ("Brand Story", "Origin and mission narrative", "Authentic"),
                ("Industry Disruptor", "Challenge status quo", "Bold"),
                ("Educational", "Provide valuable insights", "Authoritative")
            ],
            CampaignGoal.GENERATE_LEADS: [
                ("Value Exchange", "Free resource for contact", "Generous"),
                ("Quiz/Assessment", "Interactive engagement", "Curious"),
                ("Expert Interview", "Authority positioning", "Professional")
            ]
        }

        frameworks = concept_frameworks.get(goal, concept_frameworks[CampaignGoal.ACQUIRE])
        concepts = []

        for i, (name, direction, tone) in enumerate(frameworks[:count]):
            concept = CreativeConcept(
                concept_id=f"concept_{uuid.uuid4().hex[:8]}",
                name=name,
                description=f"{name} approach for {self.brand.name}",
                visual_direction=direction,
                emotional_tone=tone,
                creative_type=CreativeType.VIDEO_UGC if i == 0 else CreativeType.IMAGE_STATIC,
                hook_type=HookType.STORY if i == 0 else HookType.BENEFIT,
                target_funnel_stage=FunnelStage.TOF if i == 0 else FunnelStage.MOF,
                estimated_production_cost=500.0 if i == 0 else 200.0
            )
            concepts.append(concept)
            self.concepts.append(concept)

        return concepts

    def write_video_script(self, concept: CreativeConcept, platform: Platform,
                          duration: int = 30) -> VideoScript:
        """Write video script for concept."""
        script = VideoScript(
            script_id=f"script_{uuid.uuid4().hex[:8]}",
            title=f"{concept.name} - {platform.value.title()} Ad",
            platform=platform,
            duration_seconds=duration,
            hook=concept.hook_type.template.format(
                topic=self.brand.industry,
                problem="common challenges",
                benefit=self.brand.value_proposition,
                audience=self.brand.target_market,
                percentage="73",
                number="10,000+",
                solution=self.brand.name,
                common_belief="traditional methods work best",
                timeframe="30 days"
            ),
            hook_type=concept.hook_type,
            cta=f"Try {self.brand.name} today"
        )

        # Add scenes based on duration
        scene_count = max(3, duration // 10)
        scene_templates = [
            ("Opening hook", "Close-up, attention-grabbing", "Hook delivery"),
            ("Problem highlight", "Real-world scenario", "Pain point emphasis"),
            ("Solution intro", "Product showcase", "Brand introduction"),
            ("Benefits", "Feature demonstration", "Value explanation"),
            ("Social proof", "Testimonial clip", "Customer voice"),
            ("CTA", "Logo and action", "Clear next step")
        ]

        for i in range(min(scene_count, len(scene_templates))):
            desc, visual, vo = scene_templates[i]
            script.add_scene(desc, visual, vo, duration // scene_count)

        self.scripts.append(script)
        return script

    def generate_hook_variations(self, base_concept: CreativeConcept, count: int = 5) -> list:
        """Generate hook variations for testing."""
        hooks = []
        hook_types = [HookType.QUESTION, HookType.STATISTIC, HookType.STORY,
                     HookType.PAIN_POINT, HookType.CURIOSITY]

        for hook_type in hook_types[:count]:
            hook_text = hook_type.template.format(
                topic=self.brand.industry,
                problem="common challenges",
                benefit=self.brand.value_proposition,
                audience=self.brand.target_market,
                percentage=str(random.randint(60, 90)),
                number=f"{random.randint(5, 50)},000+",
                solution=self.brand.name,
                common_belief="the old way is best",
                timeframe=f"{random.randint(7, 30)} days"
            )
            hooks.append({
                "type": hook_type.value,
                "text": hook_text,
                "expected_hook_rate": hook_type.avg_hook_rate,
                "icon": hook_type.icon
            })

        return hooks


class CopyWriter:
    """Generates ad copy variations."""

    def __init__(self, brand: Brand):
        self.brand = brand
        self.copies: list = []

    def generate_headlines(self, funnel_stage: FunnelStage, count: int = 5) -> list:
        """Generate headline variations."""
        headline_templates = {
            FunnelStage.TOF: [
                f"Discover the Future of {self.brand.industry}",
                f"Why {self.brand.target_market} Are Making the Switch",
                f"The Secret to {self.brand.value_proposition}",
                f"Meet {self.brand.name}: {self.brand.industry} Reimagined",
                f"Stop Struggling. Start Succeeding."
            ],
            FunnelStage.MOF: [
                f"See How {self.brand.name} Works",
                f"Compare Your Options: Why We're Different",
                f"Real Results from Real {self.brand.target_market}",
                f"Your Questions About {self.brand.industry}, Answered",
                f"The Complete Guide to {self.brand.value_proposition}"
            ],
            FunnelStage.BOF: [
                f"Limited Time: Start with {self.brand.name} Today",
                f"Join {random.randint(5, 50)}K+ Happy Customers",
                f"Your {self.brand.industry} Solution Awaits",
                f"Ready to Transform Your Results?",
                f"Special Offer: Get Started Now"
            ]
        }

        return headline_templates.get(funnel_stage, headline_templates[FunnelStage.MOF])[:count]

    def generate_body_copy(self, funnel_stage: FunnelStage) -> list:
        """Generate body copy variations."""
        body_templates = {
            FunnelStage.TOF: [
                f"{self.brand.name} is changing how {self.brand.target_market} approach {self.brand.industry}. "
                f"Discover a better way to {self.brand.value_proposition}.",
                f"Tired of the same old {self.brand.industry} solutions? There's a smarter approach. "
                f"{self.brand.name} helps you achieve more with less effort."
            ],
            FunnelStage.MOF: [
                f"Here's what makes {self.brand.name} different: {self.brand.competitive_advantage}. "
                f"See why thousands of {self.brand.target_market} trust us.",
                f"Not sure if {self.brand.name} is right for you? Our customers report significant improvements. "
                f"Let us show you what's possible."
            ],
            FunnelStage.BOF: [
                f"Ready to {self.brand.value_proposition}? Start your journey with {self.brand.name} today. "
                f"Limited time offer available.",
                f"Join the thousands who've transformed their approach to {self.brand.industry}. "
                f"Your success story starts here."
            ]
        }

        return body_templates.get(funnel_stage, body_templates[FunnelStage.MOF])

    def generate_ctas(self, goal: CampaignGoal) -> list:
        """Generate CTA variations."""
        cta_templates = {
            CampaignGoal.ACQUIRE: ["Get Started", "Try Free", "Start Now", "Join Today"],
            CampaignGoal.GENERATE_LEADS: ["Get Free Guide", "Download Now", "Learn More", "Get Access"],
            CampaignGoal.AWARENESS: ["Discover More", "See How", "Watch Now", "Explore"],
            CampaignGoal.PROMOTE: ["Shop Now", "Get Deal", "Claim Offer", "Buy Now"],
            CampaignGoal.RETARGET: ["Come Back", "Complete Order", "Continue", "Finish Purchase"]
        }

        return cta_templates.get(goal, ["Learn More", "Get Started", "Try Now"])

    def create_ad_copy_set(self, platform: Platform, funnel_stage: FunnelStage,
                          goal: CampaignGoal) -> list:
        """Create complete ad copy set."""
        headlines = self.generate_headlines(funnel_stage, 3)
        bodies = self.generate_body_copy(funnel_stage)
        ctas = self.generate_ctas(goal)

        copies = []
        for i, headline in enumerate(headlines):
            copy = AdCopy(
                copy_id=f"copy_{uuid.uuid4().hex[:8]}",
                headline=headline,
                body=bodies[i % len(bodies)],
                cta=ctas[i % len(ctas)],
                platform=platform,
                funnel_stage=funnel_stage
            )
            copies.append(copy)
            self.copies.append(copy)

        return copies


class MediaPlanner:
    """Plans audience targeting and budget allocation."""

    def __init__(self, brand: Brand):
        self.brand = brand
        self.profiles: list = []
        self.test_plans: list = []

    def create_targeting_profile(self, name: str, audience_type: AudienceType,
                                funnel_stage: FunnelStage) -> TargetingProfile:
        """Create targeting profile."""
        profile = TargetingProfile(
            profile_id=f"audience_{uuid.uuid4().hex[:8]}",
            name=name,
            audience_type=audience_type,
            funnel_stage=funnel_stage,
            age_range=(25, 55),
            locations=["United States"],
            interests=[self.brand.industry, self.brand.target_market],
            estimated_reach=random.randint(500000, 5000000)
        )
        self.profiles.append(profile)
        return profile

    def build_funnel_audiences(self) -> dict:
        """Build audiences for each funnel stage."""
        return {
            FunnelStage.TOF: [
                self.create_targeting_profile("Cold - Interest Based", AudienceType.INTEREST, FunnelStage.TOF),
                self.create_targeting_profile("Cold - Lookalike 1%", AudienceType.LOOKALIKE, FunnelStage.TOF),
                self.create_targeting_profile("Cold - Broad", AudienceType.BROAD, FunnelStage.TOF)
            ],
            FunnelStage.MOF: [
                self.create_targeting_profile("Warm - Engagers", AudienceType.CUSTOM, FunnelStage.MOF),
                self.create_targeting_profile("Warm - Video Viewers", AudienceType.RETARGETING, FunnelStage.MOF)
            ],
            FunnelStage.BOF: [
                self.create_targeting_profile("Hot - Website Visitors", AudienceType.RETARGETING, FunnelStage.BOF),
                self.create_targeting_profile("Hot - Cart Abandoners", AudienceType.RETARGETING, FunnelStage.BOF)
            ]
        }

    def allocate_budget(self, total_budget: float, goal: CampaignGoal) -> dict:
        """Allocate budget across funnel stages."""
        allocations = {
            CampaignGoal.ACQUIRE: {FunnelStage.TOF: 0.25, FunnelStage.MOF: 0.25, FunnelStage.BOF: 0.50},
            CampaignGoal.AWARENESS: {FunnelStage.TOF: 0.70, FunnelStage.MOF: 0.20, FunnelStage.BOF: 0.10},
            CampaignGoal.GENERATE_LEADS: {FunnelStage.TOF: 0.40, FunnelStage.MOF: 0.35, FunnelStage.BOF: 0.25},
            CampaignGoal.RETARGET: {FunnelStage.TOF: 0.0, FunnelStage.MOF: 0.30, FunnelStage.BOF: 0.70}
        }

        goal_allocation = allocations.get(goal, {FunnelStage.TOF: 0.33, FunnelStage.MOF: 0.34, FunnelStage.BOF: 0.33})

        return {
            stage.value: {
                "percentage": pct * 100,
                "amount": total_budget * pct,
                "daily": (total_budget * pct) / 30
            }
            for stage, pct in goal_allocation.items()
        }

    def create_test_plan(self, variable: TestingVariable, budget: float) -> TestPlan:
        """Create A/B test plan."""
        plan = TestPlan(
            plan_id=f"test_{uuid.uuid4().hex[:8]}",
            name=f"{variable.value.title()} Test",
            variable=variable,
            hypothesis=f"Testing {variable.value} will improve campaign performance",
            success_metric="Conversion Rate" if variable in [TestingVariable.CTA, TestingVariable.OFFER] else "CTR",
            min_budget=budget * 0.1,
            min_duration_days=7
        )

        # Add variants based on variable type
        if variable == TestingVariable.HOOK:
            plan.add_variant("Question Hook", "Opens with engaging question")
            plan.add_variant("Statistic Hook", "Leads with compelling data")
            plan.add_variant("Story Hook", "Personal narrative opening")
        elif variable == TestingVariable.HEADLINE:
            plan.add_variant("Benefit-focused", "Emphasizes key benefit")
            plan.add_variant("Problem-focused", "Addresses pain point")
            plan.add_variant("Curiosity-driven", "Creates intrigue")
        else:
            plan.add_variant("Variant A", "Control version")
            plan.add_variant("Variant B", "Test version")

        self.test_plans.append(plan)
        return plan


class CampaignBuilder:
    """Main campaign building orchestrator."""

    def __init__(self):
        self.campaigns: list = []
        self.current_campaign: Optional[Campaign] = None

    def create_campaign(self, brand: Brand, goal: CampaignGoal,
                       platforms: list, budget: float, duration: int = 30) -> Campaign:
        """Create new campaign."""
        campaign = Campaign(
            campaign_id=f"campaign_{uuid.uuid4().hex[:8]}",
            name=f"{brand.name} - {goal.value.title()} Campaign",
            brand=brand,
            goal=goal,
            platforms=platforms,
            total_budget=budget,
            duration_days=duration
        )

        # Initialize engines
        strategy_engine = StrategyEngine(brand)
        creative_studio = CreativeStudio(brand)
        copy_writer = CopyWriter(brand)
        media_planner = MediaPlanner(brand)

        # Phase 1: Strategy
        campaign_angle = strategy_engine.develop_campaign_angle(goal)
        value_prop = strategy_engine.craft_value_proposition()

        # Phase 2: Creative
        concepts = creative_studio.generate_concepts(goal, 3)
        campaign.creative_concepts = concepts

        # Generate scripts for video concepts
        for concept in concepts:
            if concept.creative_type in [CreativeType.VIDEO_UGC, CreativeType.VIDEO_PRODUCED]:
                for platform in platforms[:2]:
                    script = creative_studio.write_video_script(
                        concept, platform, platform.optimal_video_duration[2]
                    )
                    campaign.video_scripts.append(script)

        # Phase 3: Copy
        for platform in platforms:
            for stage in [FunnelStage.TOF, FunnelStage.MOF, FunnelStage.BOF]:
                copies = copy_writer.create_ad_copy_set(platform, stage, goal)
                campaign.ad_copies.extend(copies)

        # Phase 4: Targeting
        funnel_audiences = media_planner.build_funnel_audiences()
        for stage, profiles in funnel_audiences.items():
            campaign.targeting_profiles.extend(profiles)

        # Phase 5: Testing
        for variable in [TestingVariable.HOOK, TestingVariable.HEADLINE, TestingVariable.CREATIVE]:
            test_plan = media_planner.create_test_plan(variable, budget)
            campaign.test_plans.append(test_plan)

        # Build funnel layers
        budget_allocation = media_planner.allocate_budget(budget, goal)
        for stage in [FunnelStage.TOF, FunnelStage.MOF, FunnelStage.BOF]:
            stage_budget = budget_allocation.get(stage.value, {}).get("percentage", 33)
            layer = FunnelLayer(
                stage=stage,
                budget_percentage=stage_budget,
                targeting_profiles=[p for p in campaign.targeting_profiles if p.funnel_stage == stage],
                creative_concepts=[c for c in campaign.creative_concepts if c.target_funnel_stage == stage],
                ad_copies=[a for a in campaign.ad_copies if a.funnel_stage == stage]
            )
            campaign.funnel_layers[stage.value] = layer

        self.campaigns.append(campaign)
        self.current_campaign = campaign
        return campaign

    def get_campaign_summary(self, campaign: Campaign) -> dict:
        """Get campaign summary."""
        return {
            "campaign_id": campaign.campaign_id,
            "name": campaign.name,
            "brand": campaign.brand.name,
            "goal": campaign.goal.value,
            "platforms": [p.value for p in campaign.platforms],
            "budget": campaign.total_budget,
            "duration_days": campaign.duration_days,
            "creative_count": campaign.creative_count,
            "readiness_score": campaign.readiness_score,
            "is_launch_ready": campaign.is_launch_ready,
            "estimated_impressions": campaign.estimated_impressions
        }


# ════════════════════════════════════════════════════════════════════════════════
# REPORTER - Campaign Reports
# ════════════════════════════════════════════════════════════════════════════════

class CampaignReporter:
    """Generates campaign reports."""

    def __init__(self, campaign: Campaign):
        self.campaign = campaign

    def _progress_bar(self, value: float, max_value: float = 10, width: int = 10) -> str:
        filled = int((value / max_value) * width)
        return "█" * filled + "░" * (width - filled)

    def generate_overview_report(self) -> str:
        """Generate campaign overview."""
        c = self.campaign
        lines = [
            "",
            "AD CAMPAIGN",
            "═" * 60,
            f"Brand: {c.brand.name}",
            f"Goal: {c.goal.icon} {c.goal.value.replace('_', ' ').title()}",
            f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "═" * 60,
            "",
            "CAMPAIGN OVERVIEW",
            "─" * 60,
            "┌" + "─" * 58 + "┐",
            "│" + "STRATEGY SUMMARY".center(58) + "│",
            "│" + " " * 58 + "│",
            f"│  Positioning: {c.brand.positioning_statement[:42]:<42}  │",
            f"│  Value Prop: {c.brand.value_proposition[:43]:<43}  │",
            "│" + " " * 58 + "│",
            f"│  Platforms: {', '.join(p.value.title() for p in c.platforms[:3]):<44}  │",
            f"│  Budget: ${c.total_budget:,.2f} ({c.duration_days} days)".ljust(57) + "│",
            f"│  Daily Budget: ${c.daily_budget:,.2f}".ljust(57) + "│",
            "│" + " " * 58 + "│",
            f"│  Readiness: {self._progress_bar(c.readiness_score)} {c.readiness_score}/10".ljust(57) + "│",
            f"│  Status: {'●' if c.is_launch_ready else '○'} {'Campaign Ready' if c.is_launch_ready else 'In Progress'}".ljust(57) + "│",
            "└" + "─" * 58 + "┘",
            ""
        ]
        return "\n".join(lines)

    def generate_creative_report(self) -> str:
        """Generate creative concepts report."""
        lines = [
            "CREATIVE CONCEPTS",
            "─" * 60
        ]

        for i, concept in enumerate(self.campaign.creative_concepts, 1):
            lines.extend([
                f"",
                f"**Concept {i}: {concept.name}**",
                f"• Description: {concept.description}",
                f"• Visual Direction: {concept.visual_direction}",
                f"• Emotional Tone: {concept.emotional_tone}",
                f"• Type: {concept.creative_type.icon} {concept.creative_type.value}",
                f"• Expected CTR: {concept.expected_ctr:.1f}%",
                f"• Est. Cost: ${concept.estimate_cost():,.0f}"
            ])

        return "\n".join(lines)

    def generate_scripts_report(self) -> str:
        """Generate video scripts report."""
        lines = [
            "",
            "VIDEO SCRIPTS",
            "─" * 60
        ]

        for script in self.campaign.video_scripts:
            lines.extend([
                "",
                "┌" + "─" * 58 + "┐",
                f"│  Title: {script.title[:48]:<48}  │",
                f"│  Platform: {script.platform.icon} {script.platform.value.title():<44}  │",
                f"│  Duration: {script.duration_seconds}s".ljust(57) + "│",
                "│" + " " * 58 + "│",
                f"│  HOOK: {script.hook[:49]:<49}  │",
                "│" + " " * 58 + "│"
            ])

            for i, scene in enumerate(script.scenes[:3], 1):
                lines.append(f"│  Scene {i}: {scene['description'][:44]:<44}  │")
                lines.append(f"│  Visual: {scene['visual'][:46]:<46}  │")
                lines.append("│" + " " * 58 + "│")

            lines.extend([
                f"│  CTA: {script.cta:<51}  │",
                "└" + "─" * 58 + "┘"
            ])

        return "\n".join(lines)

    def generate_copy_report(self) -> str:
        """Generate ad copy report."""
        lines = [
            "",
            "AD COPY VARIATIONS",
            "─" * 60
        ]

        for i, copy in enumerate(self.campaign.ad_copies[:6], 1):
            lines.extend([
                "",
                f"**Version {i}** ({copy.platform.value.title()} - {copy.funnel_stage.value.upper()})",
                f"Headline: {copy.headline}",
                f"Body: {copy.body[:100]}{'...' if len(copy.body) > 100 else ''}",
                f"CTA: {copy.cta}",
                f"{'✓' if copy.meets_platform_limits else '✗'} Platform limits"
            ])

        return "\n".join(lines)

    def generate_targeting_report(self) -> str:
        """Generate targeting report."""
        lines = [
            "",
            "TARGETING",
            "─" * 60,
            "",
            "| Targeting | Details |",
            "|-----------|---------|"
        ]

        for profile in self.campaign.targeting_profiles[:5]:
            lines.append(f"| {profile.audience_type.icon} {profile.name[:20]} | {profile.targeting_summary[:30]} |")

        lines.extend([
            "",
            f"Total Estimated Reach: {self.campaign.estimated_reach:,}",
            f"Estimated Impressions: {self.campaign.estimated_impressions:,}"
        ])

        return "\n".join(lines)

    def generate_testing_report(self) -> str:
        """Generate testing plan report."""
        lines = [
            "",
            "TESTING PLAN",
            "─" * 60,
            "",
            "| Variable | Options | Expected Lift |",
            "|----------|---------|---------------|"
        ]

        for plan in self.campaign.test_plans:
            min_lift, max_lift = plan.expected_lift_range
            lines.append(f"| {plan.variable.icon} {plan.variable.value.title()} | {plan.variant_count} variants | {min_lift}-{max_lift}% |")

        total_test_budget = sum(p.min_budget for p in self.campaign.test_plans)
        lines.extend([
            "",
            f"Recommended Test Budget: ${total_test_budget:,.2f}",
            f"Minimum Test Duration: 7 days per variable"
        ])

        return "\n".join(lines)

    def generate_funnel_report(self) -> str:
        """Generate funnel map report."""
        lines = [
            "",
            "FUNNEL MAP",
            "─" * 60
        ]

        for stage_key, layer in self.campaign.funnel_layers.items():
            stage = layer.stage
            lines.extend([
                "",
                f"**{stage.icon} {stage.value.upper()} ({stage.objective})**",
                f"Budget: {layer.budget_percentage:.0f}% (${self.campaign.total_budget * layer.budget_percentage / 100:,.2f})",
                f"Content: {', '.join(stage.content_types[:3])}",
                f"Audiences: {len(layer.targeting_profiles)}",
                f"Creatives: {len(layer.creative_concepts)}",
                f"Expected CVR: {stage.typical_conversion_rate:.1f}%"
            ])

        return "\n".join(lines)

    def generate_full_report(self) -> str:
        """Generate complete campaign report."""
        sections = [
            self.generate_overview_report(),
            self.generate_creative_report(),
            self.generate_scripts_report(),
            self.generate_copy_report(),
            self.generate_targeting_report(),
            self.generate_testing_report(),
            self.generate_funnel_report(),
            "",
            "─" * 60,
            f"Campaign Status: {'●' if self.campaign.is_launch_ready else '○'} {'Ready to Launch' if self.campaign.is_launch_ready else 'In Progress'}",
            "─" * 60
        ]
        return "\n".join(sections)


# ════════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════════

def create_sample_brand() -> Brand:
    """Create sample brand for demo."""
    return Brand(
        brand_id="brand_demo",
        name="TechFlow Pro",
        industry="Productivity Software",
        value_proposition="streamline workflows and boost productivity",
        target_market="busy professionals and growing teams",
        tone_of_voice="Professional yet approachable",
        unique_selling_points=[
            "AI-powered task automation",
            "Seamless integrations",
            "Real-time collaboration"
        ],
        competitors=["Notion", "Asana", "Monday.com"],
        price_point="Mid-market",
        website_url="https://techflowpro.com"
    )


def main():
    parser = argparse.ArgumentParser(
        description="ADSCAIL.CAMPAIGN.EXE - Ad Campaign Builder"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Build command
    build_parser = subparsers.add_parser("build", help="Build complete campaign")
    build_parser.add_argument("--brand", default="Demo Brand", help="Brand name")
    build_parser.add_argument("--goal", default="acquire",
                             choices=[g.value for g in CampaignGoal],
                             help="Campaign goal")
    build_parser.add_argument("--budget", type=float, default=10000, help="Total budget")
    build_parser.add_argument("--duration", type=int, default=30, help="Campaign duration in days")
    build_parser.add_argument("--platforms", nargs="+", default=["meta", "tiktok"],
                             help="Target platforms")

    # Scripts command
    scripts_parser = subparsers.add_parser("scripts", help="Generate video scripts only")
    scripts_parser.add_argument("--count", type=int, default=3, help="Number of scripts")

    # Copy command
    copy_parser = subparsers.add_parser("copy", help="Generate ad copy variations")
    copy_parser.add_argument("--stage", default="mof",
                            choices=[s.value for s in FunnelStage],
                            help="Funnel stage")

    # Targeting command
    targeting_parser = subparsers.add_parser("targeting", help="Generate targeting strategy")

    # Testing command
    testing_parser = subparsers.add_parser("testing", help="Generate testing plan")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Run full demo")

    args = parser.parse_args()

    # Create sample brand
    brand = create_sample_brand()

    if args.command == "build":
        platforms = [Platform(p) for p in args.platforms if p in [pl.value for pl in Platform]]
        if not platforms:
            platforms = [Platform.META, Platform.TIKTOK]

        builder = CampaignBuilder()
        campaign = builder.create_campaign(
            brand=brand,
            goal=CampaignGoal(args.goal),
            platforms=platforms,
            budget=args.budget,
            duration=args.duration
        )

        reporter = CampaignReporter(campaign)
        print(reporter.generate_full_report())

    elif args.command == "scripts":
        studio = CreativeStudio(brand)
        concepts = studio.generate_concepts(CampaignGoal.ACQUIRE, args.count)

        for concept in concepts:
            script = studio.write_video_script(concept, Platform.META, 30)
            print(f"\n{'='*60}")
            print(f"Script: {script.title}")
            print(f"Duration: {script.duration_seconds}s")
            print(f"Hook: {script.hook}")
            print(f"Scenes: {script.scene_count}")

    elif args.command == "copy":
        writer = CopyWriter(brand)
        copies = writer.create_ad_copy_set(
            Platform.META,
            FunnelStage(args.stage),
            CampaignGoal.ACQUIRE
        )

        for i, copy in enumerate(copies, 1):
            print(f"\n--- Version {i} ---")
            print(f"Headline: {copy.headline}")
            print(f"Body: {copy.body}")
            print(f"CTA: {copy.cta}")

    elif args.command == "targeting":
        planner = MediaPlanner(brand)
        audiences = planner.build_funnel_audiences()

        for stage, profiles in audiences.items():
            print(f"\n{stage.icon} {stage.value.upper()}")
            for profile in profiles:
                print(f"  • {profile.name}: {profile.audience_size_category} ({profile.estimated_reach:,} reach)")

    elif args.command == "testing":
        planner = MediaPlanner(brand)

        for variable in [TestingVariable.HOOK, TestingVariable.HEADLINE, TestingVariable.CREATIVE]:
            plan = planner.create_test_plan(variable, 10000)
            min_lift, max_lift = plan.expected_lift_range
            print(f"\n{variable.icon} {variable.value.title()} Test")
            print(f"  Variants: {plan.variant_count}")
            print(f"  Expected Lift: {min_lift}-{max_lift}%")
            print(f"  Min Budget: ${plan.min_budget:,.0f}")

    elif args.command == "demo" or not args.command:
        print("\n" + "="*60)
        print("ADSCAIL.CAMPAIGN.EXE - Demo Campaign Build")
        print("="*60)

        builder = CampaignBuilder()
        campaign = builder.create_campaign(
            brand=brand,
            goal=CampaignGoal.ACQUIRE,
            platforms=[Platform.META, Platform.TIKTOK, Platform.YOUTUBE],
            budget=15000,
            duration=30
        )

        reporter = CampaignReporter(campaign)
        print(reporter.generate_full_report())


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/adscail-campaign-builder [brand]` - Full campaign build
- `/adscail-campaign-builder scripts` - Video scripts only
- `/adscail-campaign-builder copy` - Ad copy variations
- `/adscail-campaign-builder targeting` - Targeting strategy
- `/adscail-campaign-builder testing` - Testing plan

$ARGUMENTS
