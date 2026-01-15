# ADSCAIL.BRAND.EXE - Brand Awareness Campaign Builder

You are ADSCAIL.BRAND.EXE — the brand awareness strategist that creates reach-focused campaigns, distinctive brand assets, emotional creative concepts, and long-term brand building programs over direct response.

MISSION
Build brand awareness. Create distinctive assets. Drive long-term equity.

---

## CAPABILITIES

### BrandPlatform.MOD
- Purpose articulation
- Positioning development
- Tagline creation
- Promise formulation
- Differentiation mapping

### CreativeArchitect.MOD
- Hero concept development
- Emotional territory design
- Narrative arc construction
- Visual direction setting
- Multi-format adaptation

### DistinctiveAssets.MOD
- Visual identity systems
- Sonic branding elements
- Verbal identity design
- Brand codes creation
- Memory structure building

### ReachPlanner.MOD
- Channel mix optimization
- Frequency planning
- Flighting strategy
- Budget allocation
- Measurement framework

---

## PRODUCTION PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
ADSCAIL.BRAND.EXE - Brand Awareness Campaign Builder
Production-ready brand building and awareness campaign generator.
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

class AwarenessGoal(Enum):
    """Brand awareness campaign objectives with reach/frequency targets."""
    LAUNCH = "launch"
    SUSTAIN = "sustain"
    REMINDER = "reminder"
    ALWAYS_ON = "always_on"
    RELAUNCH = "relaunch"
    REPOSITIONING = "repositioning"

    @property
    def target_reach_percent(self) -> int:
        """Target reach percentage of target audience."""
        reach = {
            self.LAUNCH: 80,
            self.SUSTAIN: 65,
            self.REMINDER: 50,
            self.ALWAYS_ON: 45,
            self.RELAUNCH: 75,
            self.REPOSITIONING: 70
        }
        return reach.get(self, 60)

    @property
    def frequency_per_week(self) -> tuple:
        """Returns (min_frequency, max_frequency) per week."""
        freq = {
            self.LAUNCH: (5, 7),
            self.SUSTAIN: (2, 3),
            self.REMINDER: (1, 2),
            self.ALWAYS_ON: (1, 1),
            self.RELAUNCH: (4, 6),
            self.REPOSITIONING: (3, 5)
        }
        return freq.get(self, (2, 3))

    @property
    def typical_duration_months(self) -> int:
        """Recommended campaign duration in months."""
        duration = {
            self.LAUNCH: 6,
            self.SUSTAIN: 12,
            self.REMINDER: 3,
            self.ALWAYS_ON: 12,
            self.RELAUNCH: 4,
            self.REPOSITIONING: 9
        }
        return duration.get(self, 6)

    @property
    def budget_intensity(self) -> str:
        """Budget intensity level for the goal."""
        intensity = {
            self.LAUNCH: "high",
            self.SUSTAIN: "medium",
            self.REMINDER: "low",
            self.ALWAYS_ON: "low",
            self.RELAUNCH: "high",
            self.REPOSITIONING: "medium-high"
        }
        return intensity.get(self, "medium")

    @property
    def primary_metric(self) -> str:
        """Primary success metric for this goal."""
        metrics = {
            self.LAUNCH: "unaided_awareness",
            self.SUSTAIN: "brand_consideration",
            self.REMINDER: "ad_recall",
            self.ALWAYS_ON: "mental_availability",
            self.RELAUNCH: "unaided_awareness",
            self.REPOSITIONING: "brand_perception_shift"
        }
        return metrics.get(self, "aided_awareness")


class ContentTier(Enum):
    """Hero/Hub/Hygiene content pyramid tiers."""
    HERO = "hero"
    HUB = "hub"
    HYGIENE = "hygiene"

    @property
    def purpose(self) -> str:
        """Strategic purpose of this content tier."""
        purposes = {
            self.HERO: "Big brand moments that create cultural impact",
            self.HUB: "Regular engagement content around brand pillars",
            self.HYGIENE: "Always-on content addressing customer needs"
        }
        return purposes.get(self, "Content delivery")

    @property
    def frequency(self) -> str:
        """How often this content should be produced."""
        freq = {
            self.HERO: "1-2x per year",
            self.HUB: "Monthly",
            self.HYGIENE: "Daily/Weekly"
        }
        return freq.get(self, "Periodic")

    @property
    def budget_allocation_percent(self) -> int:
        """Percentage of content budget for this tier."""
        budget = {
            self.HERO: 60,
            self.HUB: 30,
            self.HYGIENE: 10
        }
        return budget.get(self, 33)

    @property
    def production_value(self) -> str:
        """Expected production quality level."""
        production = {
            self.HERO: "Premium broadcast quality",
            self.HUB: "Professional mid-tier",
            self.HYGIENE: "Efficient, on-brand"
        }
        return production.get(self, "Standard")

    @property
    def content_examples(self) -> list:
        """Example content formats for this tier."""
        examples = {
            self.HERO: ["TV spots", "Super Bowl ads", "Brand films", "Major sponsorships"],
            self.HUB: ["YouTube series", "Podcast sponsorships", "Seasonal campaigns", "Influencer partnerships"],
            self.HYGIENE: ["Social posts", "Blog articles", "SEO content", "Customer service content"]
        }
        return examples.get(self, [])


class EmotionalTerritory(Enum):
    """Emotional spaces brands can own in consumer minds."""
    EMPOWERMENT = "empowerment"
    BELONGING = "belonging"
    ADVENTURE = "adventure"
    SECURITY = "security"
    JOY = "joy"
    NOSTALGIA = "nostalgia"
    ASPIRATION = "aspiration"
    AUTHENTICITY = "authenticity"
    INNOVATION = "innovation"
    CARE = "care"

    @property
    def core_emotion(self) -> str:
        """The primary emotion this territory evokes."""
        emotions = {
            self.EMPOWERMENT: "confidence",
            self.BELONGING: "connection",
            self.ADVENTURE: "excitement",
            self.SECURITY: "trust",
            self.JOY: "happiness",
            self.NOSTALGIA: "warmth",
            self.ASPIRATION: "hope",
            self.AUTHENTICITY: "respect",
            self.INNOVATION: "wonder",
            self.CARE: "comfort"
        }
        return emotions.get(self, "interest")

    @property
    def narrative_themes(self) -> list:
        """Story themes that support this territory."""
        themes = {
            self.EMPOWERMENT: ["overcoming obstacles", "personal transformation", "breaking barriers"],
            self.BELONGING: ["community", "shared experiences", "finding your tribe"],
            self.ADVENTURE: ["discovery", "exploration", "pushing limits"],
            self.SECURITY: ["protection", "reliability", "peace of mind"],
            self.JOY: ["celebration", "play", "simple pleasures"],
            self.NOSTALGIA: ["heritage", "traditions", "timeless moments"],
            self.ASPIRATION: ["success stories", "dreams realized", "better future"],
            self.AUTHENTICITY: ["real stories", "unfiltered truth", "staying true"],
            self.INNOVATION: ["breakthroughs", "future vision", "changing the game"],
            self.CARE: ["nurturing", "support", "being there"]
        }
        return themes.get(self, [])

    @property
    def visual_style_cues(self) -> list:
        """Visual elements that reinforce this territory."""
        cues = {
            self.EMPOWERMENT: ["bold colors", "dynamic movement", "upward motion"],
            self.BELONGING: ["group shots", "warm lighting", "inclusive imagery"],
            self.ADVENTURE: ["vast landscapes", "action shots", "vivid colors"],
            self.SECURITY: ["stable compositions", "soft lighting", "enclosed spaces"],
            self.JOY: ["bright colors", "candid moments", "smiles and laughter"],
            self.NOSTALGIA: ["vintage tones", "film grain", "familiar settings"],
            self.ASPIRATION: ["clean aesthetics", "aspirational settings", "polished imagery"],
            self.AUTHENTICITY: ["documentary style", "natural light", "imperfect beauty"],
            self.INNOVATION: ["clean lines", "tech elements", "futuristic tones"],
            self.CARE: ["soft focus", "gentle colors", "intimate framing"]
        }
        return cues.get(self, [])

    @property
    def brand_examples(self) -> list:
        """Well-known brands that own this territory."""
        examples = {
            self.EMPOWERMENT: ["Nike", "Under Armour", "Gatorade"],
            self.BELONGING: ["Coca-Cola", "Airbnb", "Facebook"],
            self.ADVENTURE: ["Red Bull", "GoPro", "Jeep"],
            self.SECURITY: ["Allstate", "Volvo", "ADT"],
            self.JOY: ["Disney", "McDonald's", "Hershey's"],
            self.NOSTALGIA: ["Kodak", "Budweiser", "Levi's"],
            self.ASPIRATION: ["Apple", "Mercedes-Benz", "Rolex"],
            self.AUTHENTICITY: ["Patagonia", "TOMS", "Dove"],
            self.INNOVATION: ["Tesla", "Google", "SpaceX"],
            self.CARE: ["Johnson & Johnson", "Pampers", "Huggies"]
        }
        return examples.get(self, [])


class ChannelType(Enum):
    """Media channels for brand awareness campaigns."""
    BROADCAST_TV = "broadcast_tv"
    STREAMING_TV = "streaming_tv"
    DIGITAL_VIDEO = "digital_video"
    SOCIAL_MEDIA = "social_media"
    DISPLAY = "display"
    OUT_OF_HOME = "out_of_home"
    AUDIO = "audio"
    SPONSORSHIPS = "sponsorships"
    INFLUENCER = "influencer"
    PRINT = "print"

    @property
    def reach_efficiency(self) -> str:
        """Efficiency for reaching mass audiences."""
        efficiency = {
            self.BROADCAST_TV: "very_high",
            self.STREAMING_TV: "high",
            self.DIGITAL_VIDEO: "high",
            self.SOCIAL_MEDIA: "medium",
            self.DISPLAY: "medium",
            self.OUT_OF_HOME: "high",
            self.AUDIO: "medium",
            self.SPONSORSHIPS: "medium",
            self.INFLUENCER: "medium",
            self.PRINT: "low"
        }
        return efficiency.get(self, "medium")

    @property
    def frequency_building(self) -> str:
        """Effectiveness at building frequency."""
        freq = {
            self.BROADCAST_TV: "excellent",
            self.STREAMING_TV: "good",
            self.DIGITAL_VIDEO: "excellent",
            self.SOCIAL_MEDIA: "excellent",
            self.DISPLAY: "excellent",
            self.OUT_OF_HOME: "good",
            self.AUDIO: "excellent",
            self.SPONSORSHIPS: "limited",
            self.INFLUENCER: "limited",
            self.PRINT: "limited"
        }
        return freq.get(self, "good")

    @property
    def typical_cpm_range(self) -> tuple:
        """Typical CPM range (min, max) in dollars."""
        cpm = {
            self.BROADCAST_TV: (15, 40),
            self.STREAMING_TV: (20, 50),
            self.DIGITAL_VIDEO: (8, 25),
            self.SOCIAL_MEDIA: (5, 15),
            self.DISPLAY: (2, 8),
            self.OUT_OF_HOME: (3, 12),
            self.AUDIO: (10, 30),
            self.SPONSORSHIPS: (20, 100),
            self.INFLUENCER: (15, 60),
            self.PRINT: (10, 30)
        }
        return cpm.get(self, (5, 20))

    @property
    def best_for(self) -> list:
        """Campaign objectives this channel excels at."""
        best = {
            self.BROADCAST_TV: ["mass awareness", "brand launches", "emotional storytelling"],
            self.STREAMING_TV: ["targeted reach", "premium environments", "completion rates"],
            self.DIGITAL_VIDEO: ["precision targeting", "measurable reach", "sequential messaging"],
            self.SOCIAL_MEDIA: ["engagement", "virality", "community building"],
            self.DISPLAY: ["frequency building", "retargeting", "visual branding"],
            self.OUT_OF_HOME: ["local awareness", "event support", "geographic targeting"],
            self.AUDIO: ["frequency", "commute reach", "intimate connection"],
            self.SPONSORSHIPS: ["brand association", "credibility", "audience alignment"],
            self.INFLUENCER: ["authenticity", "niche reach", "social proof"],
            self.PRINT: ["credibility", "detailed messaging", "premium positioning"]
        }
        return best.get(self, [])

    @property
    def creative_formats(self) -> list:
        """Available creative formats for this channel."""
        formats = {
            self.BROADCAST_TV: [":15", ":30", ":60", "sponsorship billboards"],
            self.STREAMING_TV: [":15", ":30", "non-skippable", "pause ads"],
            self.DIGITAL_VIDEO: [":06 bumpers", ":15", ":30", "skippable pre-roll"],
            self.SOCIAL_MEDIA: ["feed video", "stories", "reels", "live"],
            self.DISPLAY: ["static banners", "rich media", "native", "interstitials"],
            self.OUT_OF_HOME: ["billboards", "transit", "digital OOH", "experiential"],
            self.AUDIO: [":15", ":30", ":60", "host reads", "branded content"],
            self.SPONSORSHIPS: ["presenting sponsor", "segment sponsor", "branded content"],
            self.INFLUENCER: ["sponsored posts", "stories", "reviews", "ambassadorships"],
            self.PRINT: ["full page", "half page", "advertorials", "inserts"]
        }
        return formats.get(self, [])


class DistinctiveAssetType(Enum):
    """Types of distinctive brand assets."""
    VISUAL_IDENTITY = "visual_identity"
    COLOR_PALETTE = "color_palette"
    TYPOGRAPHY = "typography"
    LOGO = "logo"
    CHARACTERS = "characters"
    SONIC_LOGO = "sonic_logo"
    JINGLE = "jingle"
    TAGLINE = "tagline"
    PACKAGING = "packaging"
    ADVERTISING_STYLE = "advertising_style"

    @property
    def recognition_speed(self) -> str:
        """How quickly this asset triggers brand recognition."""
        speed = {
            self.VISUAL_IDENTITY: "fast",
            self.COLOR_PALETTE: "very_fast",
            self.TYPOGRAPHY: "medium",
            self.LOGO: "very_fast",
            self.CHARACTERS: "very_fast",
            self.SONIC_LOGO: "instant",
            self.JINGLE: "instant",
            self.TAGLINE: "fast",
            self.PACKAGING: "fast",
            self.ADVERTISING_STYLE: "medium"
        }
        return speed.get(self, "medium")

    @property
    def development_investment(self) -> str:
        """Investment level required to develop this asset."""
        investment = {
            self.VISUAL_IDENTITY: "high",
            self.COLOR_PALETTE: "medium",
            self.TYPOGRAPHY: "medium",
            self.LOGO: "high",
            self.CHARACTERS: "very_high",
            self.SONIC_LOGO: "high",
            self.JINGLE: "high",
            self.TAGLINE: "medium",
            self.PACKAGING: "high",
            self.ADVERTISING_STYLE: "medium"
        }
        return investment.get(self, "medium")

    @property
    def longevity_years(self) -> int:
        """Typical lifespan before refresh needed."""
        years = {
            self.VISUAL_IDENTITY: 10,
            self.COLOR_PALETTE: 15,
            self.TYPOGRAPHY: 10,
            self.LOGO: 20,
            self.CHARACTERS: 30,
            self.SONIC_LOGO: 15,
            self.JINGLE: 20,
            self.TAGLINE: 10,
            self.PACKAGING: 5,
            self.ADVERTISING_STYLE: 5
        }
        return years.get(self, 10)

    @property
    def famous_examples(self) -> list:
        """Iconic examples of this asset type."""
        examples = {
            self.VISUAL_IDENTITY: ["Coca-Cola contour bottle", "McDonald's golden arches"],
            self.COLOR_PALETTE: ["Tiffany blue", "UPS brown", "T-Mobile magenta"],
            self.TYPOGRAPHY: ["Coca-Cola script", "IBM typeface"],
            self.LOGO: ["Nike swoosh", "Apple apple", "Mercedes star"],
            self.CHARACTERS: ["Geico gecko", "M&M's characters", "Tony the Tiger"],
            self.SONIC_LOGO: ["Intel bong", "Netflix ta-dum", "McDonald's I'm lovin' it"],
            self.JINGLE: ["Nationwide is on your side", "Ba da ba ba ba"],
            self.TAGLINE: ["Just Do It", "Think Different", "Because You're Worth It"],
            self.PACKAGING: ["Tiffany box", "Apple packaging", "Toblerone shape"],
            self.ADVERTISING_STYLE: ["Apple minimalism", "Old Spice absurdist humor"]
        }
        return examples.get(self, [])


class BrandMetric(Enum):
    """Brand health and awareness metrics."""
    UNAIDED_AWARENESS = "unaided_awareness"
    AIDED_AWARENESS = "aided_awareness"
    AD_RECALL = "ad_recall"
    BRAND_CONSIDERATION = "brand_consideration"
    BRAND_PREFERENCE = "brand_preference"
    PURCHASE_INTENT = "purchase_intent"
    NET_PROMOTER_SCORE = "net_promoter_score"
    BRAND_EQUITY_INDEX = "brand_equity_index"
    MENTAL_AVAILABILITY = "mental_availability"
    BRAND_PERCEPTION = "brand_perception"

    @property
    def measurement_method(self) -> str:
        """How this metric is typically measured."""
        methods = {
            self.UNAIDED_AWARENESS: "Survey: Name brands in [category]",
            self.AIDED_AWARENESS: "Survey: Have you heard of [brand]?",
            self.AD_RECALL: "Survey: Do you recall seeing ads for [brand]?",
            self.BRAND_CONSIDERATION: "Survey: Would you consider buying [brand]?",
            self.BRAND_PREFERENCE: "Survey: Which brand do you prefer?",
            self.PURCHASE_INTENT: "Survey: How likely to purchase [brand]?",
            self.NET_PROMOTER_SCORE: "Survey: How likely to recommend (0-10)?",
            self.BRAND_EQUITY_INDEX: "Composite: Awareness + Perception + Loyalty",
            self.MENTAL_AVAILABILITY: "Survey: Category entry point associations",
            self.BRAND_PERCEPTION: "Survey: Brand attribute ratings"
        }
        return methods.get(self, "Survey-based measurement")

    @property
    def benchmark_range(self) -> tuple:
        """Typical range (low, average, high) for this metric."""
        ranges = {
            self.UNAIDED_AWARENESS: (5, 25, 60),
            self.AIDED_AWARENESS: (30, 60, 90),
            self.AD_RECALL: (10, 30, 60),
            self.BRAND_CONSIDERATION: (15, 40, 70),
            self.BRAND_PREFERENCE: (5, 20, 50),
            self.PURCHASE_INTENT: (10, 30, 60),
            self.NET_PROMOTER_SCORE: (-20, 30, 70),
            self.BRAND_EQUITY_INDEX: (20, 50, 80),
            self.MENTAL_AVAILABILITY: (10, 35, 65),
            self.BRAND_PERCEPTION: (30, 55, 85)
        }
        return ranges.get(self, (10, 40, 70))

    @property
    def tracking_frequency(self) -> str:
        """Recommended tracking frequency."""
        freq = {
            self.UNAIDED_AWARENESS: "quarterly",
            self.AIDED_AWARENESS: "quarterly",
            self.AD_RECALL: "during_campaign",
            self.BRAND_CONSIDERATION: "quarterly",
            self.BRAND_PREFERENCE: "bi-annual",
            self.PURCHASE_INTENT: "quarterly",
            self.NET_PROMOTER_SCORE: "monthly",
            self.BRAND_EQUITY_INDEX: "annual",
            self.MENTAL_AVAILABILITY: "quarterly",
            self.BRAND_PERCEPTION: "bi-annual"
        }
        return freq.get(self, "quarterly")

    @property
    def typical_lift_from_campaign(self) -> tuple:
        """Expected lift range (min%, max%) from awareness campaign."""
        lift = {
            self.UNAIDED_AWARENESS: (2, 15),
            self.AIDED_AWARENESS: (5, 20),
            self.AD_RECALL: (10, 40),
            self.BRAND_CONSIDERATION: (3, 12),
            self.BRAND_PREFERENCE: (1, 8),
            self.PURCHASE_INTENT: (2, 10),
            self.NET_PROMOTER_SCORE: (2, 10),
            self.BRAND_EQUITY_INDEX: (1, 8),
            self.MENTAL_AVAILABILITY: (3, 15),
            self.BRAND_PERCEPTION: (2, 12)
        }
        return lift.get(self, (2, 10))


# ============================================================
# DATACLASSES
# ============================================================

@dataclass
class BrandPlatform:
    """Core brand positioning and strategy foundation."""
    brand_name: str
    category: str
    purpose: str = ""
    positioning_statement: str = ""
    tagline: str = ""
    brand_promise: str = ""
    emotional_territory: EmotionalTerritory = EmotionalTerritory.ASPIRATION
    target_audience: str = ""
    key_differentiators: list = field(default_factory=list)
    brand_values: list = field(default_factory=list)
    competitive_set: list = field(default_factory=list)

    @property
    def positioning_summary(self) -> str:
        """Generate positioning statement summary."""
        return f"For {self.target_audience}, {self.brand_name} is the {self.category} that {self.brand_promise}."

    @property
    def platform_completeness(self) -> float:
        """Score how complete the brand platform is (0-100)."""
        score = 0
        if self.purpose: score += 15
        if self.positioning_statement: score += 20
        if self.tagline: score += 10
        if self.brand_promise: score += 15
        if self.target_audience: score += 15
        if self.key_differentiators: score += 10
        if self.brand_values: score += 10
        if self.competitive_set: score += 5
        return min(score, 100)


@dataclass
class DistinctiveAsset:
    """A distinctive brand asset for recognition and recall."""
    asset_type: DistinctiveAssetType
    name: str
    description: str = ""
    implementation_guidelines: str = ""
    usage_examples: list = field(default_factory=list)
    recognition_score: int = 0  # 1-10
    consistency_score: int = 0  # 1-10

    @property
    def effectiveness_score(self) -> float:
        """Combined effectiveness based on recognition and consistency."""
        return (self.recognition_score * 0.6 + self.consistency_score * 0.4)

    @property
    def asset_status(self) -> str:
        """Status based on effectiveness score."""
        score = self.effectiveness_score
        if score >= 8:
            return "Iconic"
        elif score >= 6:
            return "Strong"
        elif score >= 4:
            return "Developing"
        else:
            return "Needs Work"


@dataclass
class HeroConcept:
    """A hero creative concept for brand campaigns."""
    concept_name: str
    insight: str
    narrative_setup: str = ""
    narrative_tension: str = ""
    narrative_resolution: str = ""
    visual_direction: str = ""
    tone: str = ""
    emotional_territory: EmotionalTerritory = EmotionalTerritory.ASPIRATION
    formats: list = field(default_factory=list)
    estimated_production_cost: float = 0.0

    @property
    def narrative_arc(self) -> dict:
        """Complete narrative arc structure."""
        return {
            "setup": self.narrative_setup,
            "tension": self.narrative_tension,
            "resolution": self.narrative_resolution
        }

    @property
    def concept_strength(self) -> float:
        """Score concept completeness (0-100)."""
        score = 0
        if self.insight: score += 25
        if self.narrative_setup: score += 15
        if self.narrative_tension: score += 15
        if self.narrative_resolution: score += 15
        if self.visual_direction: score += 15
        if self.tone: score += 10
        if self.formats: score += 5
        return min(score, 100)


@dataclass
class ChannelPlan:
    """Media channel allocation for brand campaign."""
    channel: ChannelType
    role: str
    budget_percent: float
    estimated_impressions: int = 0
    target_frequency: float = 0.0
    creative_formats: list = field(default_factory=list)
    flight_weeks: int = 0

    @property
    def estimated_cpm(self) -> float:
        """Estimated CPM based on channel type."""
        min_cpm, max_cpm = self.channel.typical_cpm_range
        return (min_cpm + max_cpm) / 2

    @property
    def estimated_cost(self) -> float:
        """Estimated media cost based on impressions and CPM."""
        if self.estimated_impressions > 0:
            return (self.estimated_impressions / 1000) * self.estimated_cpm
        return 0.0


@dataclass
class MeasurementPlan:
    """Brand measurement and tracking framework."""
    metric: BrandMetric
    baseline: float
    target: float
    tracking_method: str = ""
    tracking_frequency: str = ""
    research_partner: str = ""

    @property
    def target_lift(self) -> float:
        """Target lift as percentage."""
        if self.baseline > 0:
            return ((self.target - self.baseline) / self.baseline) * 100
        return 0.0

    @property
    def is_realistic(self) -> bool:
        """Check if target is within realistic range."""
        min_lift, max_lift = self.metric.typical_lift_from_campaign
        return min_lift <= self.target_lift <= max_lift * 1.5


@dataclass
class ContentPyramid:
    """Hero/Hub/Hygiene content strategy."""
    hero_content: list = field(default_factory=list)
    hub_content: list = field(default_factory=list)
    hygiene_content: list = field(default_factory=list)
    total_budget: float = 0.0

    @property
    def hero_budget(self) -> float:
        """Budget allocated to hero content."""
        return self.total_budget * (ContentTier.HERO.budget_allocation_percent / 100)

    @property
    def hub_budget(self) -> float:
        """Budget allocated to hub content."""
        return self.total_budget * (ContentTier.HUB.budget_allocation_percent / 100)

    @property
    def hygiene_budget(self) -> float:
        """Budget allocated to hygiene content."""
        return self.total_budget * (ContentTier.HYGIENE.budget_allocation_percent / 100)

    @property
    def content_balance_score(self) -> float:
        """Score the balance of content across tiers (0-100)."""
        hero_count = len(self.hero_content) > 0
        hub_count = len(self.hub_content) > 0
        hygiene_count = len(self.hygiene_content) > 0
        return (hero_count + hub_count + hygiene_count) / 3 * 100


@dataclass
class BrandCampaign:
    """Complete brand awareness campaign."""
    campaign_name: str
    brand_platform: BrandPlatform
    goal: AwarenessGoal
    hero_concept: Optional[HeroConcept] = None
    distinctive_assets: list = field(default_factory=list)
    channel_plan: list = field(default_factory=list)
    content_pyramid: Optional[ContentPyramid] = None
    measurement_plan: list = field(default_factory=list)
    total_budget: float = 0.0
    start_date: str = ""
    duration_months: int = 6
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    @property
    def total_impressions(self) -> int:
        """Total estimated impressions across all channels."""
        return sum(cp.estimated_impressions for cp in self.channel_plan)

    @property
    def target_reach(self) -> int:
        """Target reach percentage from goal."""
        return self.goal.target_reach_percent

    @property
    def campaign_readiness(self) -> float:
        """Score campaign readiness (0-100)."""
        score = 0
        if self.brand_platform.platform_completeness >= 80: score += 25
        if self.hero_concept and self.hero_concept.concept_strength >= 70: score += 25
        if len(self.distinctive_assets) >= 3: score += 15
        if len(self.channel_plan) >= 3: score += 20
        if len(self.measurement_plan) >= 3: score += 15
        return min(score, 100)

    @property
    def estimated_cpm(self) -> float:
        """Weighted average CPM across channels."""
        if not self.channel_plan:
            return 0.0
        total_weight = sum(cp.budget_percent for cp in self.channel_plan)
        if total_weight == 0:
            return 0.0
        weighted_cpm = sum(cp.estimated_cpm * cp.budget_percent for cp in self.channel_plan)
        return weighted_cpm / total_weight


# ============================================================
# ENGINE CLASSES
# ============================================================

class BrandPlatformEngine:
    """Engine for developing brand platform and positioning."""

    def __init__(self):
        self.positioning_templates = {
            "classic": "For {audience}, {brand} is the {category} that delivers {benefit} because {reason}.",
            "competitive": "Unlike {competitor}, {brand} {differentiator}.",
            "emotional": "{brand} helps {audience} feel {emotion} by {how}."
        }

    def develop_platform(
        self,
        brand_name: str,
        category: str,
        target_audience: str,
        key_benefit: str,
        emotional_territory: EmotionalTerritory,
        differentiators: list = None
    ) -> BrandPlatform:
        """Develop complete brand platform."""
        purpose = f"To {emotional_territory.narrative_themes[0] if emotional_territory.narrative_themes else 'serve'} for {target_audience}"

        positioning = self.positioning_templates["classic"].format(
            audience=target_audience,
            brand=brand_name,
            category=category,
            benefit=key_benefit,
            reason=differentiators[0] if differentiators else "unique approach"
        )

        promise = f"We {key_benefit.lower()} for you"

        return BrandPlatform(
            brand_name=brand_name,
            category=category,
            purpose=purpose,
            positioning_statement=positioning,
            brand_promise=promise,
            emotional_territory=emotional_territory,
            target_audience=target_audience,
            key_differentiators=differentiators or []
        )

    def generate_taglines(self, platform: BrandPlatform, count: int = 5) -> list:
        """Generate tagline options based on platform."""
        territory = platform.emotional_territory
        templates = [
            f"{territory.core_emotion.title()} starts here.",
            f"Your {platform.category} for {territory.core_emotion}.",
            f"Where {territory.narrative_themes[0] if territory.narrative_themes else 'dreams'} begin.",
            f"The {territory.core_emotion} you deserve.",
            f"{platform.brand_name}. {territory.core_emotion.title()}."
        ]
        return templates[:count]


class CreativeConceptEngine:
    """Engine for developing hero creative concepts."""

    def __init__(self):
        self.concept_frameworks = [
            "problem_solution",
            "transformation",
            "slice_of_life",
            "demonstration",
            "testimonial",
            "brand_story"
        ]

    def develop_concept(
        self,
        platform: BrandPlatform,
        insight: str,
        framework: str = "transformation"
    ) -> HeroConcept:
        """Develop a hero creative concept."""
        territory = platform.emotional_territory

        narrative_maps = {
            "transformation": {
                "setup": f"{platform.target_audience} faces everyday challenges",
                "tension": f"The struggle to achieve {territory.core_emotion}",
                "resolution": f"{platform.brand_name} enables {territory.narrative_themes[0] if territory.narrative_themes else 'success'}"
            },
            "problem_solution": {
                "setup": f"The frustration of life without {platform.brand_promise}",
                "tension": f"Searching for a better way",
                "resolution": f"{platform.brand_name} delivers the solution"
            },
            "slice_of_life": {
                "setup": f"A day in the life of {platform.target_audience}",
                "tension": f"A moment where {territory.core_emotion} is needed",
                "resolution": f"{platform.brand_name} becomes part of that moment"
            }
        }

        narrative = narrative_maps.get(framework, narrative_maps["transformation"])
        visual_cues = territory.visual_style_cues

        return HeroConcept(
            concept_name=f"{platform.brand_name} {territory.value.title()} Campaign",
            insight=insight,
            narrative_setup=narrative["setup"],
            narrative_tension=narrative["tension"],
            narrative_resolution=narrative["resolution"],
            visual_direction=", ".join(visual_cues[:3]) if visual_cues else "Brand-aligned visuals",
            tone=territory.core_emotion,
            emotional_territory=territory,
            formats=[":30 TV", ":15 digital", "social cutdowns"]
        )


class MediaPlanningEngine:
    """Engine for channel planning and media allocation."""

    def __init__(self):
        self.default_mixes = {
            AwarenessGoal.LAUNCH: {
                ChannelType.BROADCAST_TV: 35,
                ChannelType.STREAMING_TV: 20,
                ChannelType.DIGITAL_VIDEO: 20,
                ChannelType.SOCIAL_MEDIA: 15,
                ChannelType.OUT_OF_HOME: 10
            },
            AwarenessGoal.SUSTAIN: {
                ChannelType.STREAMING_TV: 25,
                ChannelType.DIGITAL_VIDEO: 30,
                ChannelType.SOCIAL_MEDIA: 25,
                ChannelType.DISPLAY: 10,
                ChannelType.AUDIO: 10
            },
            AwarenessGoal.ALWAYS_ON: {
                ChannelType.DIGITAL_VIDEO: 30,
                ChannelType.SOCIAL_MEDIA: 40,
                ChannelType.DISPLAY: 20,
                ChannelType.AUDIO: 10
            }
        }

    def create_channel_plan(
        self,
        goal: AwarenessGoal,
        total_budget: float,
        duration_weeks: int
    ) -> list:
        """Create channel plan based on goal and budget."""
        mix = self.default_mixes.get(goal, self.default_mixes[AwarenessGoal.SUSTAIN])
        channel_plans = []

        for channel, budget_pct in mix.items():
            channel_budget = total_budget * (budget_pct / 100)
            avg_cpm = (channel.typical_cpm_range[0] + channel.typical_cpm_range[1]) / 2
            estimated_impressions = int((channel_budget / avg_cpm) * 1000)

            plan = ChannelPlan(
                channel=channel,
                role=channel.best_for[0] if channel.best_for else "Awareness",
                budget_percent=budget_pct,
                estimated_impressions=estimated_impressions,
                target_frequency=goal.frequency_per_week[0],
                creative_formats=channel.creative_formats[:2],
                flight_weeks=duration_weeks
            )
            channel_plans.append(plan)

        return channel_plans

    def optimize_for_reach(self, channel_plans: list, target_reach: int) -> list:
        """Optimize channel mix for reach targets."""
        # Prioritize high-reach channels
        reach_priority = {
            ChannelType.BROADCAST_TV: 1,
            ChannelType.OUT_OF_HOME: 2,
            ChannelType.STREAMING_TV: 3,
            ChannelType.DIGITAL_VIDEO: 4
        }

        sorted_plans = sorted(
            channel_plans,
            key=lambda x: reach_priority.get(x.channel, 5)
        )
        return sorted_plans


class MeasurementEngine:
    """Engine for brand measurement planning."""

    def __init__(self):
        self.research_partners = [
            "Kantar",
            "Nielsen",
            "Ipsos",
            "YouGov",
            "Morning Consult",
            "Brand Lift Study (Platform)"
        ]

    def create_measurement_plan(
        self,
        goal: AwarenessGoal,
        baseline_metrics: dict = None
    ) -> list:
        """Create measurement plan based on goal."""
        baselines = baseline_metrics or {}

        # Determine key metrics for goal
        metric_priority = {
            AwarenessGoal.LAUNCH: [
                BrandMetric.UNAIDED_AWARENESS,
                BrandMetric.AIDED_AWARENESS,
                BrandMetric.AD_RECALL
            ],
            AwarenessGoal.SUSTAIN: [
                BrandMetric.BRAND_CONSIDERATION,
                BrandMetric.AIDED_AWARENESS,
                BrandMetric.MENTAL_AVAILABILITY
            ],
            AwarenessGoal.REPOSITIONING: [
                BrandMetric.BRAND_PERCEPTION,
                BrandMetric.BRAND_PREFERENCE,
                BrandMetric.UNAIDED_AWARENESS
            ]
        }

        metrics = metric_priority.get(goal, [
            BrandMetric.AIDED_AWARENESS,
            BrandMetric.AD_RECALL,
            BrandMetric.BRAND_CONSIDERATION
        ])

        plans = []
        for metric in metrics:
            baseline = baselines.get(metric.value, metric.benchmark_range[0])
            min_lift, max_lift = metric.typical_lift_from_campaign
            target = baseline * (1 + (min_lift + max_lift) / 200)

            plan = MeasurementPlan(
                metric=metric,
                baseline=baseline,
                target=round(target, 1),
                tracking_method=metric.measurement_method,
                tracking_frequency=metric.tracking_frequency,
                research_partner=self.research_partners[0]
            )
            plans.append(plan)

        return plans


class BrandCampaignBuilder:
    """Main orchestrator for building brand awareness campaigns."""

    def __init__(self):
        self.platform_engine = BrandPlatformEngine()
        self.creative_engine = CreativeConceptEngine()
        self.media_engine = MediaPlanningEngine()
        self.measurement_engine = MeasurementEngine()

    def build_campaign(
        self,
        brand_name: str,
        category: str,
        target_audience: str,
        key_benefit: str,
        emotional_territory: EmotionalTerritory,
        goal: AwarenessGoal,
        total_budget: float,
        consumer_insight: str = "",
        duration_months: int = None
    ) -> BrandCampaign:
        """Build complete brand awareness campaign."""

        # Build brand platform
        platform = self.platform_engine.develop_platform(
            brand_name=brand_name,
            category=category,
            target_audience=target_audience,
            key_benefit=key_benefit,
            emotional_territory=emotional_territory
        )

        # Generate tagline options
        taglines = self.platform_engine.generate_taglines(platform)
        if taglines:
            platform.tagline = taglines[0]

        # Develop hero concept
        insight = consumer_insight or f"{target_audience} wants to feel {emotional_territory.core_emotion}"
        hero_concept = self.creative_engine.develop_concept(
            platform=platform,
            insight=insight
        )

        # Create channel plan
        duration = duration_months or goal.typical_duration_months
        channel_plan = self.media_engine.create_channel_plan(
            goal=goal,
            total_budget=total_budget,
            duration_weeks=duration * 4
        )

        # Create measurement plan
        measurement_plan = self.measurement_engine.create_measurement_plan(goal=goal)

        # Build content pyramid
        content_pyramid = ContentPyramid(
            hero_content=[hero_concept.concept_name],
            hub_content=["Brand pillar series", "Influencer partnerships"],
            hygiene_content=["Social content", "SEO articles", "Email campaigns"],
            total_budget=total_budget * 0.3  # 30% of budget for content
        )

        # Create default distinctive assets
        distinctive_assets = [
            DistinctiveAsset(
                asset_type=DistinctiveAssetType.TAGLINE,
                name=platform.tagline,
                description="Campaign tagline",
                recognition_score=5,
                consistency_score=8
            ),
            DistinctiveAsset(
                asset_type=DistinctiveAssetType.COLOR_PALETTE,
                name="Brand Colors",
                description="Primary and secondary brand colors",
                recognition_score=6,
                consistency_score=7
            )
        ]

        return BrandCampaign(
            campaign_name=f"{brand_name} {goal.value.title()} Campaign",
            brand_platform=platform,
            goal=goal,
            hero_concept=hero_concept,
            distinctive_assets=distinctive_assets,
            channel_plan=channel_plan,
            content_pyramid=content_pyramid,
            measurement_plan=measurement_plan,
            total_budget=total_budget,
            duration_months=duration
        )


# ============================================================
# REPORTER CLASS
# ============================================================

class BrandCampaignReporter:
    """Generate ASCII dashboard reports for brand campaigns."""

    def __init__(self, campaign: BrandCampaign):
        self.campaign = campaign

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

    def generate_report(self) -> str:
        """Generate complete campaign report."""
        c = self.campaign
        p = c.brand_platform

        report = f"""
BRAND AWARENESS CAMPAIGN
═══════════════════════════════════════════════════════════════
Brand: {p.brand_name}
Category: {p.category}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}
═══════════════════════════════════════════════════════════════

CAMPAIGN OVERVIEW
───────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│                    BRAND PLATFORM                           │
│                                                             │
│  Brand: {p.brand_name:<40}  │
│  Category: {p.category:<38}  │
│  Emotional Territory: {p.emotional_territory.value:<26}  │
│                                                             │
│  Purpose: {p.purpose[:40]:<40}  │
│  Tagline: "{p.tagline[:35]}"  │
│                                                             │
│  Target Audience: {p.target_audience[:30]:<30}  │
│                                                             │
│  Campaign Goal: {c.goal.value.upper():<32}  │
│  Target Reach: {c.target_reach}%{'':<38}  │
│  Duration: {c.duration_months} months{'':<35}  │
│  Budget: {self._format_currency(c.total_budget):<40}  │
│                                                             │
│  Platform Completeness: {self._progress_bar(p.platform_completeness)} {p.platform_completeness:.0f}%  │
│  Campaign Readiness: {self._progress_bar(c.campaign_readiness)} {c.campaign_readiness:.0f}%  │
│  Status: {'●' if c.campaign_readiness >= 70 else '○'} {'Campaign Ready' if c.campaign_readiness >= 70 else 'In Development'}  │
└─────────────────────────────────────────────────────────────┘

POSITIONING STATEMENT
───────────────────────────────────────────────────────────────
{p.positioning_statement}

Brand Promise: {p.brand_promise}
"""

        # Hero Concept Section
        if c.hero_concept:
            hc = c.hero_concept
            report += f"""
HERO CREATIVE CONCEPT
───────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  Concept: {hc.concept_name[:45]:<45}  │
│                                                             │
│  Consumer Insight:                                          │
│  "{hc.insight[:50]}"  │
│                                                             │
│  Narrative Arc:                                             │
│  • Setup: {hc.narrative_setup[:40]:<40}  │
│  • Tension: {hc.narrative_tension[:38]:<38}  │
│  • Resolution: {hc.narrative_resolution[:35]:<35}  │
│                                                             │
│  Visual Direction: {hc.visual_direction[:32]:<32}  │
│  Tone: {hc.tone:<44}  │
│                                                             │
│  Concept Strength: {self._progress_bar(hc.concept_strength)} {hc.concept_strength:.0f}%  │
└─────────────────────────────────────────────────────────────┘
"""

        # Emotional Territory Section
        et = p.emotional_territory
        themes = et.narrative_themes[:3] if et.narrative_themes else []
        examples = et.brand_examples[:3] if et.brand_examples else []

        report += f"""
EMOTIONAL TERRITORY: {et.value.upper()}
───────────────────────────────────────────────────────────────
Core Emotion: {et.core_emotion.title()}

Narrative Themes:
"""
        for theme in themes:
            report += f"  • {theme}\n"

        report += f"""
Visual Style Cues:
"""
        for cue in et.visual_style_cues[:3]:
            report += f"  • {cue}\n"

        report += f"""
Brands in This Territory: {', '.join(examples)}
"""

        # Channel Strategy Section
        if c.channel_plan:
            report += """
CHANNEL STRATEGY
───────────────────────────────────────────────────────────────
| Channel           | Role              | Budget % | Impressions |
|-------------------|-------------------|----------|-------------|
"""
            for cp in c.channel_plan:
                report += f"| {cp.channel.value:<17} | {cp.role[:17]:<17} | {cp.budget_percent:>6.0f}%  | {cp.estimated_impressions:>11,} |\n"

            report += f"""
Total Estimated Impressions: {c.total_impressions:,}
Blended CPM: ${c.estimated_cpm:.2f}
"""

        # Content Pyramid Section
        if c.content_pyramid:
            cp = c.content_pyramid
            report += f"""
CONTENT PYRAMID (HERO/HUB/HYGIENE)
───────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  HERO (60% Budget = {self._format_currency(cp.hero_budget)})                     │
│  Purpose: {ContentTier.HERO.purpose[:45]:<45}  │
│  Frequency: {ContentTier.HERO.frequency:<42}  │
│  Content: {', '.join(cp.hero_content)[:42]:<42}  │
├─────────────────────────────────────────────────────────────┤
│  HUB (30% Budget = {self._format_currency(cp.hub_budget)})                       │
│  Purpose: {ContentTier.HUB.purpose[:45]:<45}  │
│  Frequency: {ContentTier.HUB.frequency:<42}  │
│  Content: {', '.join(cp.hub_content)[:42]:<42}  │
├─────────────────────────────────────────────────────────────┤
│  HYGIENE (10% Budget = {self._format_currency(cp.hygiene_budget)})                   │
│  Purpose: {ContentTier.HYGIENE.purpose[:45]:<45}  │
│  Frequency: {ContentTier.HYGIENE.frequency:<42}  │
│  Content: {', '.join(cp.hygiene_content)[:42]:<42}  │
└─────────────────────────────────────────────────────────────┘
"""

        # Measurement Framework Section
        if c.measurement_plan:
            report += """
MEASUREMENT FRAMEWORK
───────────────────────────────────────────────────────────────
| Metric                | Baseline | Target | Lift   | Frequency   |
|-----------------------|----------|--------|--------|-------------|
"""
            for mp in c.measurement_plan:
                lift_str = f"+{mp.target_lift:.1f}%" if mp.target_lift > 0 else f"{mp.target_lift:.1f}%"
                report += f"| {mp.metric.value:<21} | {mp.baseline:>6.1f}%  | {mp.target:>4.1f}%  | {lift_str:>6} | {mp.tracking_frequency:<11} |\n"

        # Distinctive Assets Section
        if c.distinctive_assets:
            report += """
DISTINCTIVE BRAND ASSETS
───────────────────────────────────────────────────────────────
| Asset Type      | Name                | Status     | Score |
|-----------------|---------------------|------------|-------|
"""
            for asset in c.distinctive_assets:
                report += f"| {asset.asset_type.value:<15} | {asset.name[:19]:<19} | {asset.asset_status:<10} | {asset.effectiveness_score:.1f}/10 |\n"

        # Campaign Roadmap
        report += f"""
CAMPAIGN ROADMAP
───────────────────────────────────────────────────────────────
Phase 1 (Month 1-{c.duration_months//3}): Launch & Build Awareness
  • Deploy hero content across priority channels
  • Establish baseline brand metrics
  • Optimize media mix based on early results

Phase 2 (Month {c.duration_months//3 + 1}-{2*c.duration_months//3}): Sustain & Engage
  • Rotate hub content to maintain frequency
  • Introduce retargeting sequences
  • Mid-campaign brand lift study

Phase 3 (Month {2*c.duration_months//3 + 1}-{c.duration_months}): Optimize & Measure
  • Final push with proven creative
  • Comprehensive brand tracking study
  • Document learnings for next campaign

═══════════════════════════════════════════════════════════════
Campaign Status: {'●' if c.campaign_readiness >= 70 else '○'} {'Ready to Launch' if c.campaign_readiness >= 70 else 'In Development'}
Generated by ADSCAIL.BRAND.EXE
═══════════════════════════════════════════════════════════════
"""
        return report


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="ADSCAIL.BRAND.EXE - Brand Awareness Campaign Builder"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Build command
    build_parser = subparsers.add_parser("build", help="Build complete brand campaign")
    build_parser.add_argument("--brand", required=True, help="Brand name")
    build_parser.add_argument("--category", required=True, help="Product category")
    build_parser.add_argument("--audience", required=True, help="Target audience")
    build_parser.add_argument("--benefit", required=True, help="Key benefit")
    build_parser.add_argument("--territory", default="aspiration",
                             choices=[e.value for e in EmotionalTerritory],
                             help="Emotional territory")
    build_parser.add_argument("--goal", default="launch",
                             choices=[e.value for e in AwarenessGoal],
                             help="Campaign goal")
    build_parser.add_argument("--budget", type=float, default=500000,
                             help="Total budget")
    build_parser.add_argument("--insight", help="Consumer insight")
    build_parser.add_argument("--output", choices=["report", "json"], default="report")

    # Creative command
    creative_parser = subparsers.add_parser("creative", help="Generate hero concept only")
    creative_parser.add_argument("--brand", required=True, help="Brand name")
    creative_parser.add_argument("--category", required=True, help="Product category")
    creative_parser.add_argument("--audience", required=True, help="Target audience")
    creative_parser.add_argument("--territory", default="aspiration",
                                choices=[e.value for e in EmotionalTerritory])
    creative_parser.add_argument("--insight", help="Consumer insight")

    # Assets command
    assets_parser = subparsers.add_parser("assets", help="Plan distinctive assets")
    assets_parser.add_argument("--brand", required=True, help="Brand name")

    # Channels command
    channels_parser = subparsers.add_parser("channels", help="Generate channel strategy")
    channels_parser.add_argument("--goal", default="launch",
                                choices=[e.value for e in AwarenessGoal])
    channels_parser.add_argument("--budget", type=float, required=True, help="Total budget")
    channels_parser.add_argument("--duration", type=int, default=12, help="Duration in weeks")

    # Measure command
    measure_parser = subparsers.add_parser("measure", help="Create measurement plan")
    measure_parser.add_argument("--goal", default="launch",
                               choices=[e.value for e in AwarenessGoal])

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Run demo campaign")

    args = parser.parse_args()

    if args.command == "build":
        builder = BrandCampaignBuilder()
        campaign = builder.build_campaign(
            brand_name=args.brand,
            category=args.category,
            target_audience=args.audience,
            key_benefit=args.benefit,
            emotional_territory=EmotionalTerritory(args.territory),
            goal=AwarenessGoal(args.goal),
            total_budget=args.budget,
            consumer_insight=args.insight or ""
        )

        if args.output == "json":
            print(json.dumps({
                "campaign_name": campaign.campaign_name,
                "brand": campaign.brand_platform.brand_name,
                "goal": campaign.goal.value,
                "budget": campaign.total_budget,
                "readiness": campaign.campaign_readiness,
                "target_reach": campaign.target_reach
            }, indent=2))
        else:
            reporter = BrandCampaignReporter(campaign)
            print(reporter.generate_report())

    elif args.command == "creative":
        platform_engine = BrandPlatformEngine()
        creative_engine = CreativeConceptEngine()

        platform = platform_engine.develop_platform(
            brand_name=args.brand,
            category=args.category,
            target_audience=args.audience,
            key_benefit="deliver value",
            emotional_territory=EmotionalTerritory(args.territory)
        )

        insight = args.insight or f"{args.audience} seeks {EmotionalTerritory(args.territory).core_emotion}"
        concept = creative_engine.develop_concept(platform, insight)

        print(f"\nHERO CONCEPT: {concept.concept_name}")
        print(f"Insight: {concept.insight}")
        print(f"Setup: {concept.narrative_setup}")
        print(f"Tension: {concept.narrative_tension}")
        print(f"Resolution: {concept.narrative_resolution}")
        print(f"Visual Direction: {concept.visual_direction}")
        print(f"Concept Strength: {concept.concept_strength:.0f}%")

    elif args.command == "assets":
        print(f"\nDISTINCTIVE ASSETS FOR {args.brand.upper()}")
        print("=" * 50)
        for asset_type in DistinctiveAssetType:
            print(f"\n{asset_type.value.upper()}")
            print(f"  Recognition Speed: {asset_type.recognition_speed}")
            print(f"  Investment: {asset_type.development_investment}")
            print(f"  Longevity: {asset_type.longevity_years} years")
            if asset_type.famous_examples:
                print(f"  Examples: {', '.join(asset_type.famous_examples[:2])}")

    elif args.command == "channels":
        media_engine = MediaPlanningEngine()
        goal = AwarenessGoal(args.goal)

        channel_plan = media_engine.create_channel_plan(
            goal=goal,
            total_budget=args.budget,
            duration_weeks=args.duration
        )

        print(f"\nCHANNEL PLAN: {goal.value.upper()} GOAL")
        print(f"Budget: ${args.budget:,.0f} | Duration: {args.duration} weeks")
        print("=" * 60)
        print(f"{'Channel':<20} {'Budget %':>10} {'Impressions':>15} {'CPM':>8}")
        print("-" * 60)
        for cp in channel_plan:
            print(f"{cp.channel.value:<20} {cp.budget_percent:>9.0f}% {cp.estimated_impressions:>15,} ${cp.estimated_cpm:>6.2f}")

    elif args.command == "measure":
        measurement_engine = MeasurementEngine()
        goal = AwarenessGoal(args.goal)

        measurement_plan = measurement_engine.create_measurement_plan(goal=goal)

        print(f"\nMEASUREMENT PLAN: {goal.value.upper()} GOAL")
        print("=" * 70)
        print(f"{'Metric':<25} {'Baseline':>10} {'Target':>10} {'Frequency':<15}")
        print("-" * 70)
        for mp in measurement_plan:
            print(f"{mp.metric.value:<25} {mp.baseline:>9.1f}% {mp.target:>9.1f}% {mp.tracking_frequency:<15}")

    elif args.command == "demo":
        print("\n🚀 Running ADSCAIL.BRAND.EXE Demo...\n")

        builder = BrandCampaignBuilder()
        campaign = builder.build_campaign(
            brand_name="Vitality Beverages",
            category="functional beverages",
            target_audience="Health-conscious millennials aged 25-40",
            key_benefit="Natural energy without the crash",
            emotional_territory=EmotionalTerritory.EMPOWERMENT,
            goal=AwarenessGoal.LAUNCH,
            total_budget=2_000_000,
            consumer_insight="Busy professionals want sustained energy that doesn't compromise their health",
            duration_months=6
        )

        reporter = BrandCampaignReporter(campaign)
        print(reporter.generate_report())

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/adscail-brand-awareness [brand]` - Full campaign build
- `/adscail-brand-awareness creative` - Hero concept only
- `/adscail-brand-awareness assets` - Distinctive assets
- `/adscail-brand-awareness channels` - Channel strategy
- `/adscail-brand-awareness measure` - Measurement plan

$ARGUMENTS
