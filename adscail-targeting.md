# ADSCAIL.TARGETING.EXE - Targeting Strategy Generator

You are ADSCAIL.TARGETING.EXE — the AI-powered audience targeting strategist for Meta, TikTok, and Google ads, generating precise targeting strategies with interest grouping, lookalike strategies, and exclusion optimization for maximum ROAS.

MISSION
Generate precise targeting strategies that maximize ROAS across Meta, TikTok, and Google platforms. Know the audience. Target precisely. Exclude waste.

---

## CAPABILITIES

### AudienceArchitect.MOD
- Primary audience definition
- Demographic profiling
- Psychographic mapping
- Behavior analysis
- Purchase intent identification

### InterestGrouper.MOD
- Interest research
- Logical grouping
- Competitor targeting
- Publication alignment
- Lifestyle mapping

### LookalikeStrategist.MOD
- Source selection
- Percentage optimization
- Seed quality assessment
- Expansion planning
- Performance correlation

### ExclusionOptimizer.MOD
- Waste identification
- Exclusion list building
- Negative targeting
- Budget protection
- Audience refinement

---

## SYSTEM IMPLEMENTATION

```python
"""
ADSCAIL.TARGETING.EXE - Targeting Strategy Generator
Production-ready audience targeting engine for Meta, TikTok, and Google ads.
"""

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
from datetime import datetime


# ============================================================
# ENUMS - Targeting Taxonomy
# ============================================================

class Platform(Enum):
    """Advertising platforms with their targeting capabilities."""
    META = "meta"
    TIKTOK = "tiktok"
    GOOGLE = "google"
    LINKEDIN = "linkedin"
    PINTEREST = "pinterest"
    TWITTER_X = "twitter_x"
    SNAPCHAT = "snapchat"

    @property
    def targeting_capabilities(self) -> dict:
        caps = {
            "meta": {
                "demographics": True,
                "interests": True,
                "behaviors": True,
                "lookalikes": True,
                "custom_audiences": True,
                "retargeting": True,
                "max_lookalike_pct": 10,
                "interest_granularity": "high"
            },
            "tiktok": {
                "demographics": True,
                "interests": True,
                "behaviors": True,
                "lookalikes": True,
                "custom_audiences": True,
                "retargeting": True,
                "max_lookalike_pct": 10,
                "interest_granularity": "medium"
            },
            "google": {
                "demographics": True,
                "interests": True,
                "behaviors": True,
                "lookalikes": False,
                "custom_audiences": True,
                "retargeting": True,
                "similar_audiences": True,
                "interest_granularity": "high"
            },
            "linkedin": {
                "demographics": True,
                "interests": True,
                "behaviors": False,
                "lookalikes": True,
                "custom_audiences": True,
                "retargeting": True,
                "job_targeting": True,
                "interest_granularity": "medium"
            },
            "pinterest": {
                "demographics": True,
                "interests": True,
                "behaviors": False,
                "lookalikes": True,
                "custom_audiences": True,
                "retargeting": True,
                "interest_granularity": "medium"
            },
            "twitter_x": {
                "demographics": True,
                "interests": True,
                "behaviors": True,
                "lookalikes": False,
                "custom_audiences": True,
                "retargeting": True,
                "interest_granularity": "medium"
            },
            "snapchat": {
                "demographics": True,
                "interests": True,
                "behaviors": True,
                "lookalikes": True,
                "custom_audiences": True,
                "retargeting": True,
                "interest_granularity": "medium"
            }
        }
        return caps.get(self.value, {})

    @property
    def audience_minimum(self) -> int:
        minimums = {
            "meta": 1000,
            "tiktok": 1000,
            "google": 100,
            "linkedin": 300,
            "pinterest": 100,
            "twitter_x": 500,
            "snapchat": 1000
        }
        return minimums.get(self.value, 1000)

    @property
    def best_for(self) -> list:
        use_cases = {
            "meta": ["DTC", "e-commerce", "lead gen", "app installs", "local businesses"],
            "tiktok": ["Gen Z", "viral products", "entertainment", "fashion", "beauty"],
            "google": ["search intent", "comparison shopping", "B2B", "services", "local"],
            "linkedin": ["B2B", "recruiting", "professional services", "enterprise"],
            "pinterest": ["home decor", "fashion", "DIY", "weddings", "food"],
            "twitter_x": ["news", "tech", "crypto", "entertainment", "thought leadership"],
            "snapchat": ["Gen Z", "AR experiences", "app installs", "entertainment"]
        }
        return use_cases.get(self.value, [])


class FunnelStage(Enum):
    """Marketing funnel stages with targeting strategies."""
    TOF = "top_of_funnel"
    MOF = "middle_of_funnel"
    BOF = "bottom_of_funnel"
    RETENTION = "retention"
    REACTIVATION = "reactivation"

    @property
    def description(self) -> str:
        descriptions = {
            "top_of_funnel": "Awareness - cold audiences discovering your brand",
            "middle_of_funnel": "Consideration - warm audiences evaluating options",
            "bottom_of_funnel": "Conversion - hot audiences ready to purchase",
            "retention": "Loyalty - existing customers for repeat purchases",
            "reactivation": "Win-back - lapsed customers to re-engage"
        }
        return descriptions.get(self.value, "")

    @property
    def targeting_approach(self) -> list:
        approaches = {
            "top_of_funnel": ["broad interests", "lookalikes 5-10%", "behavioral categories", "content engagement"],
            "middle_of_funnel": ["website visitors", "video viewers", "email subscribers", "lookalikes 2-5%"],
            "bottom_of_funnel": ["cart abandoners", "product viewers", "email openers", "lookalikes 1-2%"],
            "retention": ["purchasers", "high-value customers", "repeat buyers", "VIP lists"],
            "reactivation": ["lapsed purchasers", "inactive subscribers", "churned customers"]
        }
        return approaches.get(self.value, [])

    @property
    def recommended_budget_split(self) -> float:
        """Recommended percentage of total budget."""
        splits = {
            "top_of_funnel": 0.40,
            "middle_of_funnel": 0.25,
            "bottom_of_funnel": 0.25,
            "retention": 0.07,
            "reactivation": 0.03
        }
        return splits.get(self.value, 0.20)

    @property
    def typical_cpa_multiplier(self) -> float:
        """Multiplier relative to BOF CPA (BOF = 1.0)."""
        multipliers = {
            "top_of_funnel": 3.0,
            "middle_of_funnel": 1.8,
            "bottom_of_funnel": 1.0,
            "retention": 0.6,
            "reactivation": 1.2
        }
        return multipliers.get(self.value, 1.0)


class InterestCategory(Enum):
    """Interest grouping categories for ad sets."""
    COMPETITORS = "competitors"
    BEHAVIORS = "behaviors"
    LIFESTYLE = "lifestyle"
    PUBLICATIONS = "publications"
    COMPLEMENTARY = "complementary"
    DEMOGRAPHICS = "demographics"
    PURCHASE_INTENT = "purchase_intent"
    AFFINITY = "affinity"

    @property
    def description(self) -> str:
        descriptions = {
            "competitors": "Direct competitor brands and products",
            "behaviors": "Purchase and engagement signals",
            "lifestyle": "Life stage and general interests",
            "publications": "Industry media, influencers, and content",
            "complementary": "Related but non-competing products",
            "demographics": "Age, gender, income, education groups",
            "purchase_intent": "In-market signals and research behavior",
            "affinity": "Long-term interests and passions"
        }
        return descriptions.get(self.value, "")

    @property
    def grouping_strategy(self) -> str:
        strategies = {
            "competitors": "Group 3-5 similar competitors per ad set, avoid mixing premium with budget",
            "behaviors": "Combine related purchase behaviors, keep engagement and purchase separate",
            "lifestyle": "Create cohesive lifestyle clusters, don't mix opposing values",
            "publications": "Group by topic relevance, separate news from niche publications",
            "complementary": "Focus on products used together, same price tier",
            "demographics": "Layer demographics on top of interests, don't use alone",
            "purchase_intent": "Most valuable - use in MOF/BOF campaigns",
            "affinity": "Best for TOF awareness, broad but relevant"
        }
        return strategies.get(self.value, "")

    @property
    def testing_priority(self) -> int:
        """1-5 scale, 5 = test first."""
        priorities = {
            "competitors": 5,
            "behaviors": 4,
            "lifestyle": 3,
            "publications": 4,
            "complementary": 3,
            "demographics": 2,
            "purchase_intent": 5,
            "affinity": 3
        }
        return priorities.get(self.value, 3)


class LookalikeSource(Enum):
    """Seed audience sources for lookalike creation."""
    PURCHASERS = "purchasers"
    HIGH_VALUE_CUSTOMERS = "high_value_customers"
    REPEAT_BUYERS = "repeat_buyers"
    EMAIL_SUBSCRIBERS = "email_subscribers"
    EMAIL_OPENERS = "email_openers"
    WEBSITE_VISITORS = "website_visitors"
    PAGE_ENGAGERS = "page_engagers"
    VIDEO_VIEWERS = "video_viewers"
    APP_USERS = "app_users"
    LEAD_FORM_COMPLETERS = "lead_form_completers"

    @property
    def quality_score(self) -> int:
        """1-10 scale for seed quality."""
        scores = {
            "purchasers": 10,
            "high_value_customers": 10,
            "repeat_buyers": 9,
            "email_subscribers": 7,
            "email_openers": 8,
            "website_visitors": 5,
            "page_engagers": 6,
            "video_viewers": 4,
            "app_users": 7,
            "lead_form_completers": 8
        }
        return scores.get(self.value, 5)

    @property
    def minimum_seed_size(self) -> int:
        """Recommended minimum audience size."""
        sizes = {
            "purchasers": 100,
            "high_value_customers": 100,
            "repeat_buyers": 100,
            "email_subscribers": 1000,
            "email_openers": 500,
            "website_visitors": 1000,
            "page_engagers": 1000,
            "video_viewers": 5000,
            "app_users": 1000,
            "lead_form_completers": 500
        }
        return sizes.get(self.value, 1000)

    @property
    def best_percentage(self) -> dict:
        """Recommended lookalike percentages by funnel stage."""
        percentages = {
            "purchasers": {"tof": "5-10%", "mof": "2-5%", "bof": "1-2%"},
            "high_value_customers": {"tof": "3-5%", "mof": "1-3%", "bof": "1%"},
            "repeat_buyers": {"tof": "3-5%", "mof": "1-3%", "bof": "1%"},
            "email_subscribers": {"tof": "5-10%", "mof": "3-5%", "bof": "2-3%"},
            "email_openers": {"tof": "5-10%", "mof": "3-5%", "bof": "2-3%"},
            "website_visitors": {"tof": "5-10%", "mof": "3-5%", "bof": "N/A"},
            "page_engagers": {"tof": "5-10%", "mof": "3-5%", "bof": "N/A"},
            "video_viewers": {"tof": "10%", "mof": "5-10%", "bof": "N/A"},
            "app_users": {"tof": "5-10%", "mof": "3-5%", "bof": "1-3%"},
            "lead_form_completers": {"tof": "5-10%", "mof": "3-5%", "bof": "1-3%"}
        }
        return percentages.get(self.value, {})

    @property
    def recommended_funnel_stage(self) -> list:
        """Best funnel stages for this seed."""
        stages = {
            "purchasers": ["mof", "bof"],
            "high_value_customers": ["mof", "bof"],
            "repeat_buyers": ["bof", "retention"],
            "email_subscribers": ["mof"],
            "email_openers": ["mof", "bof"],
            "website_visitors": ["tof", "mof"],
            "page_engagers": ["tof", "mof"],
            "video_viewers": ["tof"],
            "app_users": ["mof", "retention"],
            "lead_form_completers": ["mof", "bof"]
        }
        return stages.get(self.value, ["mof"])


class ExclusionType(Enum):
    """Types of audience exclusions."""
    RECENT_PURCHASERS = "recent_purchasers"
    ALL_PURCHASERS = "all_purchasers"
    EMAIL_UNSUBSCRIBERS = "email_unsubscribers"
    BOUNCED_VISITORS = "bounced_visitors"
    NEGATIVE_ENGAGERS = "negative_engagers"
    IRRELEVANT_INTERESTS = "irrelevant_interests"
    COMPETITOR_EMPLOYEES = "competitor_employees"
    EXISTING_CUSTOMERS = "existing_customers"
    LOW_VALUE_SEGMENTS = "low_value_segments"

    @property
    def description(self) -> str:
        descriptions = {
            "recent_purchasers": "Customers who purchased in last 7-30 days",
            "all_purchasers": "All customers ever (for acquisition campaigns)",
            "email_unsubscribers": "People who opted out of email",
            "bounced_visitors": "High bounce rate website visitors",
            "negative_engagers": "People who hid ads or gave negative feedback",
            "irrelevant_interests": "Interests that attract wrong audience",
            "competitor_employees": "Employees of competitor companies",
            "existing_customers": "All customers in CRM",
            "low_value_segments": "Customers with low LTV or high return rates"
        }
        return descriptions.get(self.value, "")

    @property
    def priority(self) -> int:
        """1-5 scale, 5 = always exclude."""
        priorities = {
            "recent_purchasers": 5,
            "all_purchasers": 4,
            "email_unsubscribers": 3,
            "bounced_visitors": 2,
            "negative_engagers": 5,
            "irrelevant_interests": 4,
            "competitor_employees": 3,
            "existing_customers": 4,
            "low_value_segments": 3
        }
        return priorities.get(self.value, 3)

    @property
    def when_to_use(self) -> str:
        use_cases = {
            "recent_purchasers": "Always in acquisition, allow in retention after 30+ days",
            "all_purchasers": "Pure acquisition campaigns only",
            "email_unsubscribers": "All campaigns - these people don't want to hear from you",
            "bounced_visitors": "Retargeting campaigns to improve quality",
            "negative_engagers": "Always - they hurt your relevance score",
            "irrelevant_interests": "When seeing poor conversion from certain segments",
            "competitor_employees": "B2B campaigns especially",
            "existing_customers": "New customer acquisition campaigns",
            "low_value_segments": "When optimizing for profit, not just revenue"
        }
        return use_cases.get(self.value, "")


class AudienceTier(Enum):
    """Audience priority tiers for budget allocation."""
    TIER_1 = "tier_1"
    TIER_2 = "tier_2"
    TIER_3 = "tier_3"
    TIER_4 = "tier_4"

    @property
    def description(self) -> str:
        descriptions = {
            "tier_1": "Highest intent - cart abandoners, recent viewers, engaged email",
            "tier_2": "High intent - past purchasers LAL 1-2%, email LAL, site visitors",
            "tier_3": "Medium intent - interest stacking, broader LALs 3-5%",
            "tier_4": "Low intent - broad interests, wide LALs 5-10%, prospecting"
        }
        return descriptions.get(self.value, "")

    @property
    def budget_allocation(self) -> dict:
        allocations = {
            "tier_1": {"min": 0.25, "max": 0.35, "recommended": 0.30},
            "tier_2": {"min": 0.20, "max": 0.30, "recommended": 0.25},
            "tier_3": {"min": 0.20, "max": 0.30, "recommended": 0.25},
            "tier_4": {"min": 0.10, "max": 0.25, "recommended": 0.20}
        }
        return allocations.get(self.value, {})

    @property
    def expected_roas_range(self) -> tuple:
        """Expected ROAS range (min, max) as multiple of target."""
        ranges = {
            "tier_1": (1.5, 3.0),
            "tier_2": (1.2, 2.0),
            "tier_3": (0.8, 1.5),
            "tier_4": (0.5, 1.0)
        }
        return ranges.get(self.value, (0.5, 1.0))


class DemographicAttribute(Enum):
    """Demographic targeting attributes."""
    AGE = "age"
    GENDER = "gender"
    INCOME = "income"
    EDUCATION = "education"
    RELATIONSHIP = "relationship"
    PARENTAL = "parental"
    HOMEOWNER = "homeowner"
    EMPLOYMENT = "employment"

    @property
    def meta_options(self) -> list:
        options = {
            "age": ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"],
            "gender": ["male", "female", "all"],
            "income": ["top 5%", "top 10%", "top 25%", "top 50%"],
            "education": ["high school", "some college", "college", "post-grad"],
            "relationship": ["single", "in relationship", "engaged", "married"],
            "parental": ["parents", "new parents", "parents of teens", "not parents"],
            "homeowner": ["renter", "homeowner"],
            "employment": ["employed", "self-employed", "small business owner"]
        }
        return options.get(self.value, [])

    @property
    def layering_recommendation(self) -> str:
        recs = {
            "age": "Always layer - most impactful demographic",
            "gender": "Layer when product skews 70%+ one gender",
            "income": "Use for luxury/premium products only",
            "education": "Use for B2B or professional products",
            "relationship": "Use for relationship/wedding/family products",
            "parental": "Critical for family/children products",
            "homeowner": "Use for home improvement/real estate",
            "employment": "Use for B2B or career-focused products"
        }
        return recs.get(self.value, "")


class PsychographicProfile(Enum):
    """Psychographic targeting profiles."""
    VALUE_SEEKER = "value_seeker"
    QUALITY_FOCUSED = "quality_focused"
    EARLY_ADOPTER = "early_adopter"
    TREND_FOLLOWER = "trend_follower"
    STATUS_CONSCIOUS = "status_conscious"
    ECO_CONSCIOUS = "eco_conscious"
    CONVENIENCE_FIRST = "convenience_first"
    EXPERIENCE_SEEKER = "experience_seeker"

    @property
    def characteristics(self) -> list:
        chars = {
            "value_seeker": ["price-sensitive", "coupon user", "comparison shopper", "deal hunter"],
            "quality_focused": ["brand loyal", "review reader", "premium buyer", "research-heavy"],
            "early_adopter": ["tech enthusiast", "first buyer", "innovation lover", "beta tester"],
            "trend_follower": ["social media active", "influencer follower", "fashion-forward"],
            "status_conscious": ["luxury buyer", "brand-aware", "exclusive seeker", "premium member"],
            "eco_conscious": ["sustainability focus", "ethical buyer", "organic preference", "minimalist"],
            "convenience_first": ["time-poor", "subscription lover", "fast shipping priority", "easy returns"],
            "experience_seeker": ["travel enthusiast", "event goer", "foodie", "adventure lover"]
        }
        return chars.get(self.value, [])

    @property
    def messaging_angle(self) -> str:
        angles = {
            "value_seeker": "Emphasize savings, deals, and value for money",
            "quality_focused": "Highlight quality, durability, and social proof",
            "early_adopter": "Lead with innovation, exclusivity, and newness",
            "trend_follower": "Use social proof, trending labels, and influencers",
            "status_conscious": "Focus on premium positioning and exclusivity",
            "eco_conscious": "Emphasize sustainability, ethics, and transparency",
            "convenience_first": "Highlight ease, speed, and hassle-free experience",
            "experience_seeker": "Sell the experience, not just the product"
        }
        return angles.get(self.value, "")

    @property
    def interest_indicators(self) -> list:
        indicators = {
            "value_seeker": ["Groupon", "coupons.com", "deal sites", "outlet shopping"],
            "quality_focused": ["Consumer Reports", "review sites", "premium brands"],
            "early_adopter": ["TechCrunch", "Product Hunt", "Kickstarter", "beta programs"],
            "trend_follower": ["fashion magazines", "influencers", "trending hashtags"],
            "status_conscious": ["luxury brands", "premium memberships", "exclusive clubs"],
            "eco_conscious": ["sustainability blogs", "eco brands", "farmers markets"],
            "convenience_first": ["Amazon Prime", "delivery services", "subscription boxes"],
            "experience_seeker": ["travel sites", "event platforms", "adventure brands"]
        }
        return indicators.get(self.value, [])


# ============================================================
# DATACLASSES - Targeting Structures
# ============================================================

@dataclass
class DemographicTarget:
    """Demographic targeting specification."""
    age_ranges: list = field(default_factory=list)
    genders: list = field(default_factory=lambda: ["all"])
    income_levels: list = field(default_factory=list)
    education_levels: list = field(default_factory=list)
    parental_status: list = field(default_factory=list)
    relationship_status: list = field(default_factory=list)
    locations: list = field(default_factory=list)
    languages: list = field(default_factory=lambda: ["english"])

    @property
    def is_broad(self) -> bool:
        """Check if demographics are too broad."""
        broad_indicators = [
            len(self.age_ranges) > 4,
            "all" in self.genders,
            len(self.income_levels) == 0,
            len(self.locations) == 0
        ]
        return sum(broad_indicators) >= 3

    @property
    def estimated_reach(self) -> str:
        """Rough reach estimate based on narrowing."""
        narrowing_count = sum([
            len(self.age_ranges) > 0 and len(self.age_ranges) < 6,
            "all" not in self.genders,
            len(self.income_levels) > 0,
            len(self.parental_status) > 0,
            len(self.relationship_status) > 0
        ])

        if narrowing_count >= 4:
            return "narrow"
        elif narrowing_count >= 2:
            return "moderate"
        else:
            return "broad"


@dataclass
class InterestGroup:
    """Grouped interests for an ad set."""
    name: str
    category: InterestCategory
    interests: list = field(default_factory=list)
    logical_operator: str = "OR"  # OR within group, AND between groups
    estimated_size: int = 0

    @property
    def is_valid(self) -> bool:
        """Check if interest group is valid."""
        return 2 <= len(self.interests) <= 10

    @property
    def diversity_score(self) -> int:
        """Score the diversity of interests (1-10)."""
        if len(self.interests) < 2:
            return 1
        elif len(self.interests) > 8:
            return 4  # Too diverse, may lack focus
        else:
            return min(10, len(self.interests) + 3)


@dataclass
class LookalikeAudience:
    """Lookalike audience configuration."""
    name: str
    source: LookalikeSource
    source_size: int
    percentage: float
    platform: Platform
    funnel_stage: FunnelStage
    country: str = "US"

    @property
    def quality_score(self) -> int:
        """Calculate audience quality score."""
        base_score = self.source.quality_score

        # Percentage modifier
        if self.percentage <= 1:
            pct_bonus = 3
        elif self.percentage <= 3:
            pct_bonus = 2
        elif self.percentage <= 5:
            pct_bonus = 1
        else:
            pct_bonus = 0

        # Size modifier
        if self.source_size >= self.source.minimum_seed_size * 2:
            size_bonus = 1
        elif self.source_size < self.source.minimum_seed_size:
            size_bonus = -2
        else:
            size_bonus = 0

        return min(10, max(1, base_score + pct_bonus + size_bonus))

    @property
    def estimated_reach(self) -> int:
        """Estimate lookalike audience reach."""
        us_facebook_users = 190_000_000
        return int(us_facebook_users * (self.percentage / 100))


@dataclass
class ExclusionAudience:
    """Audience exclusion specification."""
    name: str
    exclusion_type: ExclusionType
    audience_size: int = 0
    days_lookback: int = 30
    reason: str = ""

    def __post_init__(self):
        if not self.reason:
            self.reason = self.exclusion_type.description

    @property
    def priority(self) -> int:
        return self.exclusion_type.priority


@dataclass
class CustomAudience:
    """Custom audience definition."""
    name: str
    audience_type: str  # retargeting, engagement, customer_list, app_activity
    source_description: str
    size: int
    days_lookback: int = 30
    priority: str = "high"  # high, medium, low

    @property
    def is_warm(self) -> bool:
        return self.audience_type in ["retargeting", "customer_list"]


@dataclass
class AudienceTierConfig:
    """Configuration for a single audience tier."""
    tier: AudienceTier
    audiences: list = field(default_factory=list)  # List of audience names/IDs
    budget_percentage: float = 0.0
    cpa_target: float = 0.0
    roas_target: float = 0.0

    def __post_init__(self):
        if self.budget_percentage == 0.0:
            self.budget_percentage = self.tier.budget_allocation["recommended"]

    @property
    def expected_roas(self) -> tuple:
        return self.tier.expected_roas_range


@dataclass
class TestingPlan:
    """Audience testing matrix plan."""
    week: int
    focus: str
    audiences_to_test: list = field(default_factory=list)
    success_metrics: list = field(default_factory=list)
    budget_allocation: float = 0.0
    notes: str = ""


@dataclass
class TargetingStrategy:
    """Complete targeting strategy output."""
    brand_name: str
    product_name: str
    industry: str
    campaign_goal: str
    platforms: list = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    # Audience components
    primary_audience: DemographicTarget = None
    psychographic_profile: PsychographicProfile = None
    interest_groups: list = field(default_factory=list)
    lookalike_audiences: list = field(default_factory=list)
    custom_audiences: list = field(default_factory=list)
    exclusion_audiences: list = field(default_factory=list)

    # Tier configuration
    tier_configs: list = field(default_factory=list)

    # Testing plan
    testing_plan: list = field(default_factory=list)

    @property
    def total_audience_count(self) -> int:
        return (
            len(self.interest_groups) +
            len(self.lookalike_audiences) +
            len(self.custom_audiences)
        )

    @property
    def estimated_total_reach(self) -> int:
        lal_reach = sum(l.estimated_reach for l in self.lookalike_audiences)
        return lal_reach

    @property
    def strategy_score(self) -> int:
        """Score the overall strategy quality (1-10)."""
        score = 5  # Base

        # Interest groups
        if 3 <= len(self.interest_groups) <= 6:
            score += 1

        # Lookalikes
        if len(self.lookalike_audiences) >= 2:
            score += 1
        avg_lal_quality = sum(l.quality_score for l in self.lookalike_audiences) / max(len(self.lookalike_audiences), 1)
        if avg_lal_quality >= 7:
            score += 1

        # Exclusions
        if len(self.exclusion_audiences) >= 2:
            score += 1

        # Testing plan
        if len(self.testing_plan) >= 4:
            score += 1

        return min(10, score)


# ============================================================
# ENGINE CLASSES - Targeting Generators
# ============================================================

class AudienceArchitectEngine:
    """Designs primary audience profiles."""

    def __init__(self):
        self.age_brackets = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]

    def build_profile(
        self,
        product_category: str,
        price_tier: str = "mid",
        target_description: str = ""
    ) -> DemographicTarget:
        """Build demographic target based on product."""
        demo = DemographicTarget()

        # Age selection based on category
        category_ages = {
            "tech": ["18-24", "25-34", "35-44"],
            "fashion": ["18-24", "25-34", "35-44"],
            "home": ["25-34", "35-44", "45-54"],
            "health": ["35-44", "45-54", "55-64"],
            "finance": ["25-34", "35-44", "45-54", "55-64"],
            "kids": ["25-34", "35-44"],
            "luxury": ["35-44", "45-54", "55-64"]
        }

        demo.age_ranges = category_ages.get(product_category.lower(), ["25-34", "35-44"])

        # Income based on price tier
        tier_income = {
            "budget": [],
            "mid": [],
            "premium": ["top 25%", "top 10%"],
            "luxury": ["top 10%", "top 5%"]
        }
        demo.income_levels = tier_income.get(price_tier, [])

        return demo

    def infer_psychographic(self, target_description: str) -> PsychographicProfile:
        """Infer psychographic profile from description."""
        desc_lower = target_description.lower()

        keywords_to_profile = {
            PsychographicProfile.VALUE_SEEKER: ["budget", "deal", "save", "affordable", "cheap"],
            PsychographicProfile.QUALITY_FOCUSED: ["quality", "premium", "best", "review", "durable"],
            PsychographicProfile.EARLY_ADOPTER: ["new", "latest", "innovative", "tech", "cutting-edge"],
            PsychographicProfile.TREND_FOLLOWER: ["trending", "popular", "influencer", "viral", "cool"],
            PsychographicProfile.STATUS_CONSCIOUS: ["luxury", "exclusive", "prestigious", "elite", "vip"],
            PsychographicProfile.ECO_CONSCIOUS: ["eco", "sustainable", "green", "organic", "ethical"],
            PsychographicProfile.CONVENIENCE_FIRST: ["easy", "quick", "convenient", "fast", "simple"],
            PsychographicProfile.EXPERIENCE_SEEKER: ["experience", "adventure", "travel", "explore"]
        }

        for profile, keywords in keywords_to_profile.items():
            if any(kw in desc_lower for kw in keywords):
                return profile

        return PsychographicProfile.QUALITY_FOCUSED  # Default


class InterestGrouperEngine:
    """Groups interests logically for ad sets."""

    def __init__(self):
        self.category_templates = {
            InterestCategory.COMPETITORS: "Direct competitor brands: {interests}",
            InterestCategory.BEHAVIORS: "Purchase and engagement behaviors: {interests}",
            InterestCategory.LIFESTYLE: "Lifestyle and life stage: {interests}",
            InterestCategory.PUBLICATIONS: "Industry media and influencers: {interests}",
            InterestCategory.COMPLEMENTARY: "Complementary products and services: {interests}"
        }

    def create_groups(
        self,
        interests_by_category: dict,
        max_per_group: int = 6
    ) -> list:
        """Create interest groups from categorized interests."""
        groups = []

        for category, interests in interests_by_category.items():
            if not interests:
                continue

            # Split large lists into multiple groups
            for i in range(0, len(interests), max_per_group):
                chunk = interests[i:i + max_per_group]
                group_num = (i // max_per_group) + 1

                group = InterestGroup(
                    name=f"{category.value}_{group_num}",
                    category=category,
                    interests=chunk
                )
                groups.append(group)

        return groups

    def suggest_interests(self, industry: str, competitors: list = None) -> dict:
        """Suggest interests based on industry."""
        # Return template - in production would query interest database
        suggestions = {
            InterestCategory.COMPETITORS: competitors or [],
            InterestCategory.BEHAVIORS: ["Online shopping", "Engaged shoppers"],
            InterestCategory.LIFESTYLE: [],
            InterestCategory.PUBLICATIONS: [],
            InterestCategory.COMPLEMENTARY: []
        }

        # Industry-specific additions
        industry_interests = {
            "fitness": {
                InterestCategory.BEHAVIORS: ["Fitness", "Gym membership", "Health food"],
                InterestCategory.LIFESTYLE: ["Active lifestyle", "Wellness"],
                InterestCategory.PUBLICATIONS: ["Men's Health", "Women's Health", "Shape"],
                InterestCategory.COMPLEMENTARY: ["Athletic wear", "Supplements", "Protein powder"]
            },
            "fashion": {
                InterestCategory.BEHAVIORS: ["Fashion accessories", "Online fashion shopping"],
                InterestCategory.LIFESTYLE: ["Fashion and style", "Luxury goods"],
                InterestCategory.PUBLICATIONS: ["Vogue", "Elle", "GQ", "Glamour"],
                InterestCategory.COMPLEMENTARY: ["Beauty products", "Accessories"]
            },
            "tech": {
                InterestCategory.BEHAVIORS: ["Technology enthusiasts", "Early tech adopters"],
                InterestCategory.LIFESTYLE: ["Gadgets", "Smart home"],
                InterestCategory.PUBLICATIONS: ["TechCrunch", "Wired", "The Verge"],
                InterestCategory.COMPLEMENTARY: ["Software", "Electronics accessories"]
            }
        }

        if industry.lower() in industry_interests:
            for cat, ints in industry_interests[industry.lower()].items():
                suggestions[cat].extend(ints)

        return suggestions


class LookalikeStrategistEngine:
    """Creates and optimizes lookalike strategies."""

    def __init__(self):
        self.default_percentages = {
            FunnelStage.TOF: [5, 10],
            FunnelStage.MOF: [2, 3, 5],
            FunnelStage.BOF: [1, 2]
        }

    def create_lookalike(
        self,
        source: LookalikeSource,
        source_size: int,
        platform: Platform,
        funnel_stage: FunnelStage,
        percentage: float = None
    ) -> LookalikeAudience:
        """Create a lookalike audience configuration."""
        if percentage is None:
            percentages = self.default_percentages.get(funnel_stage, [3])
            percentage = percentages[0]

        return LookalikeAudience(
            name=f"LAL_{source.value}_{int(percentage)}pct_{funnel_stage.value[:3]}",
            source=source,
            source_size=source_size,
            percentage=percentage,
            platform=platform,
            funnel_stage=funnel_stage
        )

    def create_strategy(
        self,
        available_sources: dict,  # {source: size}
        platform: Platform
    ) -> list:
        """Create complete lookalike strategy."""
        lookalikes = []

        for source, size in available_sources.items():
            if size < source.minimum_seed_size:
                continue

            for stage in source.recommended_funnel_stage:
                funnel = FunnelStage.BOF if stage == "bof" else (
                    FunnelStage.MOF if stage == "mof" else FunnelStage.TOF
                )

                percentages = self.default_percentages.get(funnel, [3])
                for pct in percentages:
                    lal = self.create_lookalike(source, size, platform, funnel, pct)
                    lookalikes.append(lal)

        return lookalikes


class ExclusionOptimizerEngine:
    """Optimizes audience exclusions to reduce waste."""

    def __init__(self):
        self.always_exclude = [
            ExclusionType.NEGATIVE_ENGAGERS,
            ExclusionType.EMAIL_UNSUBSCRIBERS
        ]

    def recommend_exclusions(
        self,
        campaign_goal: str,
        funnel_stage: FunnelStage,
        has_customer_data: bool = True
    ) -> list:
        """Recommend exclusions based on campaign type."""
        exclusions = []

        # Always exclude
        for exc_type in self.always_exclude:
            exclusions.append(ExclusionAudience(
                name=f"Exclude_{exc_type.value}",
                exclusion_type=exc_type
            ))

        # Goal-based exclusions
        if campaign_goal.lower() in ["acquisition", "new_customers", "prospecting"]:
            if has_customer_data:
                exclusions.append(ExclusionAudience(
                    name="Exclude_All_Customers",
                    exclusion_type=ExclusionType.ALL_PURCHASERS
                ))
        elif campaign_goal.lower() in ["retention", "upsell", "cross-sell"]:
            exclusions.append(ExclusionAudience(
                name="Exclude_Recent_Purchasers_7d",
                exclusion_type=ExclusionType.RECENT_PURCHASERS,
                days_lookback=7
            ))

        # Funnel-based exclusions
        if funnel_stage == FunnelStage.TOF:
            exclusions.append(ExclusionAudience(
                name="Exclude_Website_Visitors_30d",
                exclusion_type=ExclusionType.BOUNCED_VISITORS,
                days_lookback=30,
                reason="TOF should target cold audiences"
            ))

        return exclusions


class TierBuilderEngine:
    """Builds audience tier configurations."""

    def build_tiers(self, audiences: dict) -> list:
        """Build tier configurations from available audiences."""
        tiers = []

        # Tier 1: Highest intent
        tier1_audiences = audiences.get("cart_abandoners", []) + audiences.get("high_value_lal", [])
        if tier1_audiences:
            tiers.append(AudienceTierConfig(
                tier=AudienceTier.TIER_1,
                audiences=tier1_audiences
            ))

        # Tier 2: High intent
        tier2_audiences = audiences.get("purchaser_lal", []) + audiences.get("email_lal", [])
        if tier2_audiences:
            tiers.append(AudienceTierConfig(
                tier=AudienceTier.TIER_2,
                audiences=tier2_audiences
            ))

        # Tier 3: Medium intent
        tier3_audiences = audiences.get("interest_stacks", []) + audiences.get("broad_lal", [])
        if tier3_audiences:
            tiers.append(AudienceTierConfig(
                tier=AudienceTier.TIER_3,
                audiences=tier3_audiences
            ))

        # Tier 4: Low intent / prospecting
        tier4_audiences = audiences.get("broad_interests", []) + audiences.get("wide_lal", [])
        if tier4_audiences:
            tiers.append(AudienceTierConfig(
                tier=AudienceTier.TIER_4,
                audiences=tier4_audiences
            ))

        return tiers


class TestingPlannerEngine:
    """Creates testing roadmaps for audiences."""

    def create_plan(self, strategy: TargetingStrategy) -> list:
        """Create a 4-week testing plan."""
        plan = []

        # Week 1: Test interest groups
        plan.append(TestingPlan(
            week=1,
            focus="Interest Group Testing",
            audiences_to_test=[g.name for g in strategy.interest_groups[:3]],
            success_metrics=["CTR", "CPC", "Landing page views"],
            budget_allocation=0.30,
            notes="Test top 3 interest groups head-to-head"
        ))

        # Week 2: Add lookalikes
        plan.append(TestingPlan(
            week=2,
            focus="Lookalike Introduction",
            audiences_to_test=[l.name for l in strategy.lookalike_audiences[:3]],
            success_metrics=["CTR", "Cost per add-to-cart", "ROAS"],
            budget_allocation=0.25,
            notes="Introduce top lookalike audiences alongside winning interests"
        ))

        # Week 3: Layer combinations
        plan.append(TestingPlan(
            week=3,
            focus="Audience Layering",
            audiences_to_test=["Interest + Demo stack", "LAL + Interest exclusion"],
            success_metrics=["CPA", "ROAS", "Conversion rate"],
            budget_allocation=0.25,
            notes="Test layering demographics on winning audiences"
        ))

        # Week 4: Scale winners
        plan.append(TestingPlan(
            week=4,
            focus="Scale Winners",
            audiences_to_test=["Top performers from weeks 1-3"],
            success_metrics=["ROAS", "Volume", "Marginal ROAS"],
            budget_allocation=0.20,
            notes="Increase budget on top 3-5 audiences, pause losers"
        ))

        return plan


class TargetingStrategyBuilder:
    """Main orchestrator for targeting strategy creation."""

    def __init__(self):
        self.audience_architect = AudienceArchitectEngine()
        self.interest_grouper = InterestGrouperEngine()
        self.lookalike_strategist = LookalikeStrategistEngine()
        self.exclusion_optimizer = ExclusionOptimizerEngine()
        self.tier_builder = TierBuilderEngine()
        self.testing_planner = TestingPlannerEngine()

    def build(
        self,
        brand_name: str,
        product_name: str,
        industry: str,
        campaign_goal: str,
        platforms: list = None,
        target_description: str = "",
        competitors: list = None,
        available_seeds: dict = None,
        price_tier: str = "mid"
    ) -> TargetingStrategy:
        """Build complete targeting strategy."""
        if platforms is None:
            platforms = [Platform.META]
        if available_seeds is None:
            available_seeds = {}

        # Build primary audience
        primary = self.audience_architect.build_profile(
            product_category=industry,
            price_tier=price_tier,
            target_description=target_description
        )

        # Infer psychographic
        psychographic = self.audience_architect.infer_psychographic(target_description)

        # Create interest groups
        suggested_interests = self.interest_grouper.suggest_interests(industry, competitors)
        interest_groups = self.interest_grouper.create_groups(suggested_interests)

        # Create lookalikes
        lookalikes = self.lookalike_strategist.create_strategy(
            available_seeds,
            platforms[0]
        )

        # Create exclusions
        exclusions = self.exclusion_optimizer.recommend_exclusions(
            campaign_goal,
            FunnelStage.MOF,
            has_customer_data=bool(available_seeds)
        )

        # Build strategy
        strategy = TargetingStrategy(
            brand_name=brand_name,
            product_name=product_name,
            industry=industry,
            campaign_goal=campaign_goal,
            platforms=platforms,
            primary_audience=primary,
            psychographic_profile=psychographic,
            interest_groups=interest_groups,
            lookalike_audiences=lookalikes,
            exclusion_audiences=exclusions
        )

        # Add testing plan
        strategy.testing_plan = self.testing_planner.create_plan(strategy)

        return strategy


# ============================================================
# REPORTER CLASS - ASCII Dashboard
# ============================================================

class TargetingReporter:
    """Generates formatted targeting reports."""

    @staticmethod
    def _progress_bar(value: float, max_val: float = 10, width: int = 10) -> str:
        filled = int((value / max_val) * width)
        return "█" * filled + "░" * (width - filled)

    def generate_report(self, strategy: TargetingStrategy) -> str:
        """Generate complete targeting strategy report."""
        lines = []

        # Header
        lines.append("TARGETING STRATEGY")
        lines.append("═" * 55)
        lines.append(f"Brand: {strategy.brand_name}")
        lines.append(f"Product: {strategy.product_name}")
        lines.append(f"Time: {strategy.created_at.strftime('%Y-%m-%d %H:%M')}")
        lines.append("═" * 55)

        # Overview
        lines.append("")
        lines.append("TARGETING OVERVIEW")
        lines.append("─" * 40)
        lines.append("┌─────────────────────────────────────────┐")
        lines.append("│       AUDIENCE STRATEGY                 │")
        lines.append("│                                         │")
        lines.append(f"│  Brand: {strategy.brand_name:<30}│")
        lines.append(f"│  Industry: {strategy.industry:<28}│")
        lines.append(f"│  Goal: {strategy.campaign_goal:<32}│")
        lines.append("│                                         │")
        platforms_str = ", ".join([p.value for p in strategy.platforms])
        lines.append(f"│  Platforms: {platforms_str:<27}│")
        lines.append(f"│  Audience Tiers: {strategy.total_audience_count:<22}│")
        lines.append("│                                         │")
        bar = self._progress_bar(strategy.strategy_score)
        lines.append(f"│  ROAS Potential: {bar} {strategy.strategy_score}/10   │")
        lines.append("│  Status: [●] Strategy Ready             │")
        lines.append("└─────────────────────────────────────────┘")

        # Primary Audience
        lines.append("")
        lines.append("PRIMARY AUDIENCE")
        lines.append("─" * 40)

        if strategy.primary_audience:
            pa = strategy.primary_audience
            lines.append("┌─────────────────────────────────────────┐")
            lines.append(f"│  Demographics:                          │")
            lines.append(f"│  • Age: {', '.join(pa.age_ranges):<31}│")
            lines.append(f"│  • Gender: {', '.join(pa.genders):<28}│")
            if pa.income_levels:
                lines.append(f"│  • Income: {', '.join(pa.income_levels):<28}│")
            lines.append("│                                         │")

            if strategy.psychographic_profile:
                pp = strategy.psychographic_profile
                lines.append("│  Psychographics:                        │")
                for char in pp.characteristics[:3]:
                    lines.append(f"│  • {char:<36}│")

            lines.append("└─────────────────────────────────────────┘")

        # Interest Targeting
        lines.append("")
        lines.append("INTEREST TARGETING")
        lines.append("─" * 40)
        lines.append("| Group       | Interests                     |")
        lines.append("|-------------|-------------------------------|")

        for group in strategy.interest_groups[:5]:
            interests_str = ", ".join(group.interests[:3])
            if len(group.interests) > 3:
                interests_str += f"... +{len(group.interests) - 3}"
            lines.append(f"| {group.category.value:<11} | {interests_str:<29} |")

        # Interest Groups Detail
        lines.append("")
        lines.append("INTEREST GROUPS (for ad sets)")
        lines.append("─" * 40)
        lines.append("┌─────────────────────────────────────────┐")

        for i, group in enumerate(strategy.interest_groups[:3], 1):
            lines.append(f"│  Group {i}: {group.category.value:<28}│")
            for interest in group.interests[:3]:
                lines.append(f"│  • {interest:<36}│")
            lines.append("│                                         │")

        lines.append("└─────────────────────────────────────────┘")

        # Lookalike Audiences
        lines.append("")
        lines.append("LOOKALIKE AUDIENCES")
        lines.append("─" * 40)
        lines.append("| Source          | Percentage | Strategy    |")
        lines.append("|-----------------|------------|-------------|")

        for lal in strategy.lookalike_audiences[:5]:
            lines.append(f"| {lal.source.value:<15} | {lal.percentage}%{' ' * (9 - len(str(lal.percentage)))}| {lal.funnel_stage.value[:3].upper():<11} |")

        # Exclusion Lists
        lines.append("")
        lines.append("EXCLUSION LISTS")
        lines.append("─" * 40)
        lines.append("┌─────────────────────────────────────────┐")
        lines.append("│  Exclude:                               │")

        for exc in strategy.exclusion_audiences[:4]:
            lines.append(f"│  • {exc.exclusion_type.value:<36}│")

        lines.append("│                                         │")
        lines.append("│  Reason: Prevent wasted spend           │")
        lines.append("└─────────────────────────────────────────┘")

        # Testing Matrix
        lines.append("")
        lines.append("TESTING MATRIX")
        lines.append("─" * 40)
        lines.append("┌─────────────────────────────────────────┐")

        for plan in strategy.testing_plan[:4]:
            lines.append(f"│  Week {plan.week}: {plan.focus:<30}│")

        lines.append("└─────────────────────────────────────────┘")

        # Status
        lines.append("")
        lines.append(f"Targeting Status: ● Strategy Complete (Score: {strategy.strategy_score}/10)")

        return "\n".join(lines)

    def generate_interests_report(self, groups: list) -> str:
        """Generate detailed interest groups report."""
        lines = ["INTEREST GROUPS DETAIL", "═" * 55, ""]

        for group in groups:
            lines.append(f"Group: {group.name}")
            lines.append(f"Category: {group.category.value}")
            lines.append(f"Testing Priority: {group.category.testing_priority}/5")
            lines.append("Interests:")
            for interest in group.interests:
                lines.append(f"  • {interest}")
            lines.append("")

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli():
    """Create the CLI argument parser."""
    import argparse

    parser = argparse.ArgumentParser(
        description="ADSCAIL.TARGETING.EXE - Targeting Strategy Generator"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Build command
    build_parser = subparsers.add_parser("build", help="Build targeting strategy")
    build_parser.add_argument("brand", help="Brand name")
    build_parser.add_argument("--product", required=True, help="Product name")
    build_parser.add_argument("--industry", required=True, help="Industry category")
    build_parser.add_argument("--goal", default="acquisition", help="Campaign goal")
    build_parser.add_argument("--platform", choices=[p.value for p in Platform],
                              default="meta", help="Primary platform")

    # Interests command
    interests_parser = subparsers.add_parser("interests", help="Generate interest suggestions")
    interests_parser.add_argument("niche", help="Industry niche")
    interests_parser.add_argument("--competitors", nargs="+", help="Competitor brands")

    # Lookalike command
    lal_parser = subparsers.add_parser("lookalike", help="Create lookalike strategy")
    lal_parser.add_argument("source", choices=[s.value for s in LookalikeSource],
                            help="Seed source type")
    lal_parser.add_argument("--size", type=int, default=1000, help="Source audience size")
    lal_parser.add_argument("--stage", choices=["tof", "mof", "bof"], default="mof",
                            help="Funnel stage")

    # Exclusions command
    exc_parser = subparsers.add_parser("exclusions", help="Generate exclusion recommendations")
    exc_parser.add_argument("--goal", default="acquisition", help="Campaign goal")

    # Test command
    test_parser = subparsers.add_parser("test", help="Generate testing plan")
    test_parser.add_argument("--weeks", type=int, default=4, help="Testing period in weeks")

    # Demo command
    subparsers.add_parser("demo", help="Run demonstration strategy")

    return parser


def run_demo():
    """Run a demonstration targeting strategy."""
    builder = TargetingStrategyBuilder()
    reporter = TargetingReporter()

    # Sample seeds
    seeds = {
        LookalikeSource.PURCHASERS: 5000,
        LookalikeSource.EMAIL_SUBSCRIBERS: 15000,
        LookalikeSource.WEBSITE_VISITORS: 50000
    }

    # Build strategy
    strategy = builder.build(
        brand_name="FitLife Pro",
        product_name="Premium Protein Powder",
        industry="fitness",
        campaign_goal="acquisition",
        platforms=[Platform.META, Platform.TIKTOK],
        target_description="Health-conscious fitness enthusiasts who value quality supplements",
        competitors=["Optimum Nutrition", "BSN", "Dymatize", "Ghost Lifestyle"],
        available_seeds=seeds,
        price_tier="premium"
    )

    # Generate report
    print(reporter.generate_report(strategy))


def main():
    """Main entry point."""
    parser = create_cli()
    args = parser.parse_args()

    if args.command == "demo":
        run_demo()
    elif args.command == "interests":
        engine = InterestGrouperEngine()
        suggestions = engine.suggest_interests(
            args.niche,
            getattr(args, 'competitors', None)
        )
        print("Suggested Interests by Category:")
        for cat, interests in suggestions.items():
            if interests:
                print(f"\n{cat.value}:")
                for interest in interests:
                    print(f"  • {interest}")
    elif args.command == "lookalike":
        engine = LookalikeStrategistEngine()
        source = LookalikeSource(args.source)
        stage_map = {"tof": FunnelStage.TOF, "mof": FunnelStage.MOF, "bof": FunnelStage.BOF}
        lal = engine.create_lookalike(
            source, args.size, Platform.META, stage_map[args.stage]
        )
        print(f"Lookalike: {lal.name}")
        print(f"Quality Score: {lal.quality_score}/10")
        print(f"Estimated Reach: {lal.estimated_reach:,}")
    elif args.command == "exclusions":
        engine = ExclusionOptimizerEngine()
        exclusions = engine.recommend_exclusions(args.goal, FunnelStage.MOF)
        print("Recommended Exclusions:")
        for exc in exclusions:
            print(f"  • {exc.exclusion_type.value}: {exc.reason}")
    else:
        print("ADSCAIL.TARGETING.EXE")
        print("Use --help for available commands")
        print("Use 'demo' to see a sample strategy")


if __name__ == "__main__":
    main()
```

## TARGETING RULES

- Interests must be specific, not broad categories
- Group interests logically (don't mix unrelated)
- Lookalikes must specify source and percentage
- Exclusions must prevent wasted spend
- Custom audiences must be actionable
- All targeting must align with campaign goal

## QUICK COMMANDS

- `/adscail-targeting [brand]` - Full targeting strategy
- `/adscail-targeting interests [niche]` - Interest research
- `/adscail-targeting lookalike [source]` - Lookalike strategy
- `/adscail-targeting exclusions [campaign]` - Exclusion list
- `/adscail-targeting test [audiences]` - Testing plan

$ARGUMENTS
