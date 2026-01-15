# SOCIAL.ONBOARD.EXE - Brand Onboarding Specialist

You are SOCIAL.ONBOARD.EXE — the social media brand onboarding specialist that systematically captures brand guidelines, account credentials, audience profiles, and content strategy to set up new clients for social media success.

MISSION: Onboard brands systematically. Capture all guidelines. Build content foundation.

---

## CAPABILITIES

### DiscoveryEngine.MOD
- Business goal mapping
- KPI identification
- Competitor analysis
- Resource assessment
- Success definition

### BrandCapturer.MOD
- Voice documentation
- Visual identity
- Style guidelines
- Do's and Don'ts
- Messaging approval

### AccountInventory.MOD
- Platform listing
- Credential collection
- Page ID documentation
- Settings review
- Verification status

### AudienceProfiler.MOD
- Persona creation
- Demographic mapping
- Interest identification
- Pain point discovery
- Journey mapping

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
SOCIAL.ONBOARD.EXE - Brand Onboarding Specialist
Production-ready brand onboarding system with discovery, documentation, and setup
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any
import argparse
import json


# ============================================================
# ENUMS - Onboarding Domain Types
# ============================================================

class OnboardingPhase(Enum):
    """Brand onboarding lifecycle phases."""
    DISCOVERY = "discovery"
    BRAND_DOCUMENTATION = "brand_documentation"
    ACCOUNT_INVENTORY = "account_inventory"
    AUDIENCE_RESEARCH = "audience_research"
    CONTENT_FOUNDATION = "content_foundation"

    @property
    def order(self) -> int:
        """Phase sequence order."""
        orders = {
            "discovery": 1,
            "brand_documentation": 2,
            "account_inventory": 3,
            "audience_research": 4,
            "content_foundation": 5
        }
        return orders.get(self.value, 0)

    @property
    def deliverables(self) -> List[str]:
        """Expected deliverables for each phase."""
        deliverables_map = {
            "discovery": ["Discovery call notes", "KPI definitions", "Competitor list", "Resource assessment"],
            "brand_documentation": ["Voice guide", "Visual standards", "Style guidelines", "Approved messaging"],
            "account_inventory": ["Platform list", "Access credentials", "Page IDs", "Verification status"],
            "audience_research": ["Persona documents", "Demographic profiles", "Interest maps", "Journey maps"],
            "content_foundation": ["Content pillars", "Posting schedule", "Hashtag strategy", "Initial calendar"]
        }
        return deliverables_map.get(self.value, [])

    @property
    def estimated_hours(self) -> int:
        """Estimated hours to complete phase."""
        hours = {
            "discovery": 4,
            "brand_documentation": 8,
            "account_inventory": 2,
            "audience_research": 6,
            "content_foundation": 10
        }
        return hours.get(self.value, 4)

    @property
    def next_phase(self) -> Optional["OnboardingPhase"]:
        """Next phase in sequence."""
        sequence = list(OnboardingPhase)
        current_idx = sequence.index(self)
        if current_idx < len(sequence) - 1:
            return sequence[current_idx + 1]
        return None


class PhaseStatus(Enum):
    """Completion status for onboarding phases."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    PENDING_REVIEW = "pending_review"
    COMPLETED = "completed"
    BLOCKED = "blocked"

    @property
    def symbol(self) -> str:
        """Status indicator symbol."""
        symbols = {
            "not_started": "○",
            "in_progress": "◐",
            "pending_review": "◑",
            "completed": "●",
            "blocked": "✗"
        }
        return symbols.get(self.value, "○")

    @property
    def is_actionable(self) -> bool:
        """Whether phase can be worked on."""
        return self in [PhaseStatus.NOT_STARTED, PhaseStatus.IN_PROGRESS, PhaseStatus.PENDING_REVIEW]

    @property
    def weight(self) -> float:
        """Completion weight for progress calculation."""
        weights = {
            "not_started": 0.0,
            "in_progress": 0.5,
            "pending_review": 0.8,
            "completed": 1.0,
            "blocked": 0.0
        }
        return weights.get(self.value, 0.0)


class Platform(Enum):
    """Social media platforms for inventory."""
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    PINTEREST = "pinterest"
    THREADS = "threads"

    @property
    def display_name(self) -> str:
        """Human-readable platform name."""
        names = {
            "instagram": "Instagram",
            "facebook": "Facebook",
            "twitter": "X (Twitter)",
            "linkedin": "LinkedIn",
            "tiktok": "TikTok",
            "youtube": "YouTube",
            "pinterest": "Pinterest",
            "threads": "Threads"
        }
        return names.get(self.value, self.value.title())

    @property
    def recommended_frequency(self) -> str:
        """Recommended posting frequency."""
        frequencies = {
            "instagram": "1-2x/day",
            "facebook": "1x/day",
            "twitter": "3-5x/day",
            "linkedin": "1x/day",
            "tiktok": "1-3x/day",
            "youtube": "2-3x/week",
            "pinterest": "5-10x/day",
            "threads": "2-3x/day"
        }
        return frequencies.get(self.value, "1x/day")

    @property
    def content_types(self) -> List[str]:
        """Primary content types for platform."""
        types = {
            "instagram": ["Reels", "Stories", "Carousels", "Posts"],
            "facebook": ["Posts", "Videos", "Stories", "Live"],
            "twitter": ["Tweets", "Threads", "Polls", "Spaces"],
            "linkedin": ["Posts", "Articles", "Documents", "Polls"],
            "tiktok": ["Videos", "Duets", "Stitches", "Lives"],
            "youtube": ["Videos", "Shorts", "Community", "Live"],
            "pinterest": ["Pins", "Idea Pins", "Boards"],
            "threads": ["Posts", "Threads", "Reposts"]
        }
        return types.get(self.value, ["Posts"])

    @property
    def verification_available(self) -> bool:
        """Whether platform offers verification."""
        return self in [Platform.INSTAGRAM, Platform.FACEBOOK, Platform.TWITTER,
                       Platform.LINKEDIN, Platform.TIKTOK, Platform.YOUTUBE]


class VoiceTrait(Enum):
    """Brand voice characteristics."""
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    PLAYFUL = "playful"
    AUTHORITATIVE = "authoritative"
    FRIENDLY = "friendly"
    INSPIRATIONAL = "inspirational"
    EDUCATIONAL = "educational"
    BOLD = "bold"
    EMPATHETIC = "empathetic"
    WITTY = "witty"

    @property
    def description(self) -> str:
        """Voice trait description."""
        descriptions = {
            "professional": "Polished, business-appropriate, credible",
            "casual": "Relaxed, conversational, approachable",
            "playful": "Fun, lighthearted, entertaining",
            "authoritative": "Expert, confident, commanding",
            "friendly": "Warm, welcoming, personable",
            "inspirational": "Motivating, uplifting, encouraging",
            "educational": "Informative, helpful, teaching",
            "bold": "Direct, fearless, provocative",
            "empathetic": "Understanding, compassionate, relatable",
            "witty": "Clever, humorous, sharp"
        }
        return descriptions.get(self.value, "")

    @property
    def compatible_with(self) -> List["VoiceTrait"]:
        """Compatible voice traits for combinations."""
        compatibility = {
            "professional": [VoiceTrait.AUTHORITATIVE, VoiceTrait.EDUCATIONAL, VoiceTrait.EMPATHETIC],
            "casual": [VoiceTrait.FRIENDLY, VoiceTrait.PLAYFUL, VoiceTrait.WITTY],
            "playful": [VoiceTrait.CASUAL, VoiceTrait.WITTY, VoiceTrait.FRIENDLY],
            "authoritative": [VoiceTrait.PROFESSIONAL, VoiceTrait.EDUCATIONAL, VoiceTrait.BOLD],
            "friendly": [VoiceTrait.CASUAL, VoiceTrait.EMPATHETIC, VoiceTrait.INSPIRATIONAL],
            "inspirational": [VoiceTrait.FRIENDLY, VoiceTrait.EMPATHETIC, VoiceTrait.BOLD],
            "educational": [VoiceTrait.PROFESSIONAL, VoiceTrait.AUTHORITATIVE, VoiceTrait.FRIENDLY],
            "bold": [VoiceTrait.AUTHORITATIVE, VoiceTrait.INSPIRATIONAL, VoiceTrait.WITTY],
            "empathetic": [VoiceTrait.FRIENDLY, VoiceTrait.INSPIRATIONAL, VoiceTrait.PROFESSIONAL],
            "witty": [VoiceTrait.CASUAL, VoiceTrait.PLAYFUL, VoiceTrait.BOLD]
        }
        return compatibility.get(self.value, [])


class ContentPillar(Enum):
    """Content pillar categories."""
    EDUCATIONAL = "educational"
    PROMOTIONAL = "promotional"
    ENTERTAINING = "entertaining"
    INSPIRATIONAL = "inspirational"
    COMMUNITY = "community"
    BEHIND_SCENES = "behind_scenes"
    USER_GENERATED = "user_generated"
    TRENDING = "trending"

    @property
    def recommended_percentage(self) -> int:
        """Recommended content mix percentage."""
        percentages = {
            "educational": 30,
            "promotional": 20,
            "entertaining": 20,
            "inspirational": 10,
            "community": 10,
            "behind_scenes": 5,
            "user_generated": 5,
            "trending": 0  # Opportunistic
        }
        return percentages.get(self.value, 10)

    @property
    def description(self) -> str:
        """Pillar description."""
        descriptions = {
            "educational": "Tips, how-tos, industry insights",
            "promotional": "Products, services, offers",
            "entertaining": "Fun, engaging, shareable",
            "inspirational": "Motivational, success stories",
            "community": "UGC features, testimonials, engagement",
            "behind_scenes": "Team, process, culture",
            "user_generated": "Customer content, reviews",
            "trending": "Timely topics, viral opportunities"
        }
        return descriptions.get(self.value, "")


class AudienceSegment(Enum):
    """Target audience segments."""
    PRIMARY = "primary"
    SECONDARY = "secondary"
    TERTIARY = "tertiary"
    INFLUENCER = "influencer"
    ADVOCATE = "advocate"

    @property
    def priority_level(self) -> int:
        """Content targeting priority (1-5)."""
        priorities = {
            "primary": 5,
            "secondary": 4,
            "tertiary": 2,
            "influencer": 3,
            "advocate": 4
        }
        return priorities.get(self.value, 1)

    @property
    def engagement_strategy(self) -> str:
        """Recommended engagement approach."""
        strategies = {
            "primary": "Direct conversion focus, solve core problems",
            "secondary": "Nurture with value, build awareness",
            "tertiary": "Light touch, awareness only",
            "influencer": "Partnership opportunities, collaborative content",
            "advocate": "Reward, feature, empower sharing"
        }
        return strategies.get(self.value, "Standard engagement")


class GoalCategory(Enum):
    """Business goal categories for social."""
    BRAND_AWARENESS = "brand_awareness"
    LEAD_GENERATION = "lead_generation"
    SALES_CONVERSION = "sales_conversion"
    COMMUNITY_BUILDING = "community_building"
    CUSTOMER_SERVICE = "customer_service"
    THOUGHT_LEADERSHIP = "thought_leadership"
    TRAFFIC_DRIVING = "traffic_driving"
    ENGAGEMENT = "engagement"

    @property
    def key_metrics(self) -> List[str]:
        """Primary metrics for goal category."""
        metrics = {
            "brand_awareness": ["Reach", "Impressions", "Brand mentions", "Share of voice"],
            "lead_generation": ["Click-through rate", "Lead form fills", "Cost per lead"],
            "sales_conversion": ["Conversion rate", "Revenue attributed", "ROAS"],
            "community_building": ["Follower growth", "Engagement rate", "Active community size"],
            "customer_service": ["Response time", "Resolution rate", "Satisfaction score"],
            "thought_leadership": ["Share of voice", "Media mentions", "Speaking opportunities"],
            "traffic_driving": ["Website clicks", "Referral traffic", "Bounce rate"],
            "engagement": ["Comments", "Shares", "Saves", "DMs"]
        }
        return metrics.get(self.value, [])

    @property
    def platform_priority(self) -> List[Platform]:
        """Best platforms for this goal."""
        priorities = {
            "brand_awareness": [Platform.INSTAGRAM, Platform.TIKTOK, Platform.YOUTUBE],
            "lead_generation": [Platform.LINKEDIN, Platform.FACEBOOK, Platform.INSTAGRAM],
            "sales_conversion": [Platform.INSTAGRAM, Platform.FACEBOOK, Platform.PINTEREST],
            "community_building": [Platform.FACEBOOK, Platform.INSTAGRAM, Platform.TWITTER],
            "customer_service": [Platform.TWITTER, Platform.FACEBOOK, Platform.INSTAGRAM],
            "thought_leadership": [Platform.LINKEDIN, Platform.TWITTER, Platform.YOUTUBE],
            "traffic_driving": [Platform.PINTEREST, Platform.FACEBOOK, Platform.TWITTER],
            "engagement": [Platform.INSTAGRAM, Platform.TIKTOK, Platform.THREADS]
        }
        return priorities.get(self.value, [])


# ============================================================
# DATACLASSES - Onboarding Data Structures
# ============================================================

@dataclass
class DiscoveryResponse:
    """Response to a discovery questionnaire item."""
    question_id: str
    question: str
    response: str
    category: str
    captured_at: datetime = field(default_factory=datetime.now)
    follow_up_needed: bool = False
    notes: str = ""

    @property
    def is_complete(self) -> bool:
        """Whether response is substantive."""
        return len(self.response.strip()) > 10

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "question_id": self.question_id,
            "question": self.question,
            "response": self.response,
            "category": self.category,
            "captured_at": self.captured_at.isoformat(),
            "follow_up_needed": self.follow_up_needed,
            "notes": self.notes
        }


@dataclass
class PlatformAccount:
    """Social media platform account details."""
    platform: Platform
    handle: str
    page_id: str = ""
    follower_count: int = 0
    is_verified: bool = False
    has_business_account: bool = False
    access_level: str = "admin"  # admin, editor, analyst
    posting_frequency: str = ""
    last_post_date: Optional[datetime] = None
    notes: str = ""

    @property
    def is_active(self) -> bool:
        """Whether account has recent activity."""
        if not self.last_post_date:
            return False
        days_since = (datetime.now() - self.last_post_date).days
        return days_since < 30

    @property
    def health_score(self) -> int:
        """Account health score (0-100)."""
        score = 50  # Base score
        if self.is_verified:
            score += 15
        if self.has_business_account:
            score += 15
        if self.is_active:
            score += 20
        if self.follower_count >= 10000:
            score += 10
        elif self.follower_count >= 1000:
            score += 5
        return min(score, 100)

    @property
    def needs_attention(self) -> List[str]:
        """Areas needing attention."""
        issues = []
        if not self.has_business_account:
            issues.append("Convert to business account")
        if not self.is_active:
            issues.append("Account inactive - needs content")
        if not self.page_id:
            issues.append("Missing Page ID")
        if self.platform.verification_available and not self.is_verified:
            issues.append("Consider verification")
        return issues

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "platform": self.platform.value,
            "handle": self.handle,
            "page_id": self.page_id,
            "follower_count": self.follower_count,
            "is_verified": self.is_verified,
            "has_business_account": self.has_business_account,
            "access_level": self.access_level,
            "posting_frequency": self.posting_frequency,
            "last_post_date": self.last_post_date.isoformat() if self.last_post_date else None,
            "health_score": self.health_score
        }


@dataclass
class BrandVoice:
    """Brand voice documentation."""
    primary_traits: List[VoiceTrait] = field(default_factory=list)
    secondary_traits: List[VoiceTrait] = field(default_factory=list)
    tone_description: str = ""
    we_are: List[str] = field(default_factory=list)  # "We ARE..."
    we_are_not: List[str] = field(default_factory=list)  # "We are NOT..."
    approved_phrases: List[str] = field(default_factory=list)
    banned_phrases: List[str] = field(default_factory=list)
    emoji_usage: str = "moderate"  # none, minimal, moderate, heavy
    hashtag_style: str = ""
    capitalization: str = "standard"  # standard, sentence, title, lowercase

    @property
    def is_documented(self) -> bool:
        """Whether voice is sufficiently documented."""
        return (len(self.primary_traits) >= 2 and
                len(self.we_are) >= 3 and
                self.tone_description)

    @property
    def trait_summary(self) -> str:
        """Summarize voice traits."""
        primary = ", ".join([t.value.title() for t in self.primary_traits])
        if self.secondary_traits:
            secondary = ", ".join([t.value.title() for t in self.secondary_traits])
            return f"{primary} (with touches of {secondary})"
        return primary

    def validate_compatibility(self) -> List[str]:
        """Check for incompatible trait combinations."""
        warnings = []
        for trait in self.primary_traits:
            incompatible = [t for t in self.primary_traits
                          if t != trait and t not in trait.compatible_with]
            if incompatible:
                warnings.append(f"{trait.value.title()} may conflict with {incompatible[0].value.title()}")
        return warnings

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "primary_traits": [t.value for t in self.primary_traits],
            "secondary_traits": [t.value for t in self.secondary_traits],
            "tone_description": self.tone_description,
            "we_are": self.we_are,
            "we_are_not": self.we_are_not,
            "approved_phrases": self.approved_phrases,
            "banned_phrases": self.banned_phrases,
            "emoji_usage": self.emoji_usage,
            "hashtag_style": self.hashtag_style,
            "capitalization": self.capitalization
        }


@dataclass
class VisualIdentity:
    """Brand visual identity documentation."""
    primary_colors: List[str] = field(default_factory=list)  # Hex codes
    secondary_colors: List[str] = field(default_factory=list)
    fonts_primary: str = ""
    fonts_secondary: str = ""
    logo_variations: List[str] = field(default_factory=list)  # "full", "icon", "wordmark"
    image_style: str = ""  # "photography", "illustration", "mixed"
    filter_presets: List[str] = field(default_factory=list)
    avoid_visually: List[str] = field(default_factory=list)
    template_links: List[str] = field(default_factory=list)

    @property
    def is_documented(self) -> bool:
        """Whether visual identity is sufficiently documented."""
        return (len(self.primary_colors) >= 2 and
                self.fonts_primary and
                len(self.logo_variations) >= 1)

    @property
    def color_palette_summary(self) -> str:
        """Summary of color palette."""
        primary = ", ".join(self.primary_colors[:3])
        return f"Primary: {primary}" if primary else "Not defined"

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "primary_colors": self.primary_colors,
            "secondary_colors": self.secondary_colors,
            "fonts_primary": self.fonts_primary,
            "fonts_secondary": self.fonts_secondary,
            "logo_variations": self.logo_variations,
            "image_style": self.image_style,
            "filter_presets": self.filter_presets,
            "avoid_visually": self.avoid_visually,
            "template_links": self.template_links
        }


@dataclass
class AudiencePersona:
    """Target audience persona."""
    persona_id: str
    name: str  # "Marketing Mary", "Tech-Savvy Tim"
    segment: AudienceSegment
    age_range: str = ""
    gender: str = "all"
    location: str = ""
    occupation: str = ""
    income_range: str = ""
    interests: List[str] = field(default_factory=list)
    pain_points: List[str] = field(default_factory=list)
    goals: List[str] = field(default_factory=list)
    preferred_platforms: List[Platform] = field(default_factory=list)
    content_preferences: List[str] = field(default_factory=list)
    buying_triggers: List[str] = field(default_factory=list)
    objections: List[str] = field(default_factory=list)

    @property
    def is_complete(self) -> bool:
        """Whether persona is sufficiently detailed."""
        return (self.name and
                len(self.interests) >= 3 and
                len(self.pain_points) >= 2 and
                len(self.preferred_platforms) >= 1)

    @property
    def completeness_score(self) -> int:
        """Persona completeness score (0-100)."""
        score = 0
        if self.name: score += 10
        if self.age_range: score += 10
        if self.occupation: score += 10
        if len(self.interests) >= 3: score += 15
        if len(self.pain_points) >= 2: score += 15
        if len(self.goals) >= 2: score += 10
        if len(self.preferred_platforms) >= 1: score += 10
        if len(self.buying_triggers) >= 2: score += 10
        if len(self.objections) >= 2: score += 10
        return score

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "persona_id": self.persona_id,
            "name": self.name,
            "segment": self.segment.value,
            "age_range": self.age_range,
            "gender": self.gender,
            "location": self.location,
            "occupation": self.occupation,
            "income_range": self.income_range,
            "interests": self.interests,
            "pain_points": self.pain_points,
            "goals": self.goals,
            "preferred_platforms": [p.value for p in self.preferred_platforms],
            "content_preferences": self.content_preferences,
            "buying_triggers": self.buying_triggers,
            "objections": self.objections,
            "completeness_score": self.completeness_score
        }


@dataclass
class ContentStrategy:
    """Content strategy foundation."""
    pillars: Dict[ContentPillar, int] = field(default_factory=dict)  # Pillar -> percentage
    posting_frequency: Dict[Platform, str] = field(default_factory=dict)
    best_times: Dict[Platform, List[str]] = field(default_factory=dict)
    hashtag_groups: Dict[str, List[str]] = field(default_factory=dict)
    content_series: List[str] = field(default_factory=list)
    recurring_themes: List[str] = field(default_factory=list)
    seasonal_opportunities: List[str] = field(default_factory=list)

    @property
    def is_defined(self) -> bool:
        """Whether content strategy is defined."""
        return (len(self.pillars) >= 3 and
                len(self.posting_frequency) >= 1)

    @property
    def pillar_breakdown(self) -> str:
        """Formatted pillar breakdown."""
        if not self.pillars:
            return "Not defined"
        lines = []
        for pillar, pct in sorted(self.pillars.items(), key=lambda x: x[1], reverse=True):
            lines.append(f"  {pillar.value.replace('_', ' ').title()}: {pct}%")
        return "\n".join(lines)

    def validate_mix(self) -> List[str]:
        """Validate content mix percentages."""
        warnings = []
        total = sum(self.pillars.values())
        if total != 100:
            warnings.append(f"Content mix totals {total}%, should be 100%")
        promotional = self.pillars.get(ContentPillar.PROMOTIONAL, 0)
        if promotional > 30:
            warnings.append(f"Promotional content at {promotional}% - consider reducing below 30%")
        return warnings

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "pillars": {p.value: v for p, v in self.pillars.items()},
            "posting_frequency": {p.value: v for p, v in self.posting_frequency.items()},
            "best_times": {p.value: v for p, v in self.best_times.items()},
            "hashtag_groups": self.hashtag_groups,
            "content_series": self.content_series,
            "recurring_themes": self.recurring_themes,
            "seasonal_opportunities": self.seasonal_opportunities
        }


@dataclass
class Competitor:
    """Competitor analysis entry."""
    name: str
    handles: Dict[Platform, str] = field(default_factory=dict)
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    content_themes: List[str] = field(default_factory=list)
    engagement_rate: float = 0.0
    follower_count: int = 0
    posting_frequency: str = ""
    differentiators: List[str] = field(default_factory=list)  # What we do differently

    @property
    def is_analyzed(self) -> bool:
        """Whether competitor is sufficiently analyzed."""
        return (len(self.handles) >= 1 and
                len(self.strengths) >= 2 and
                len(self.content_themes) >= 2)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "name": self.name,
            "handles": {p.value: h for p, h in self.handles.items()},
            "strengths": self.strengths,
            "weaknesses": self.weaknesses,
            "content_themes": self.content_themes,
            "engagement_rate": self.engagement_rate,
            "follower_count": self.follower_count,
            "posting_frequency": self.posting_frequency,
            "differentiators": self.differentiators
        }


@dataclass
class PhaseProgress:
    """Progress tracking for an onboarding phase."""
    phase: OnboardingPhase
    status: PhaseStatus = PhaseStatus.NOT_STARTED
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    blockers: List[str] = field(default_factory=list)
    deliverables_completed: List[str] = field(default_factory=list)
    notes: str = ""

    @property
    def completion_percentage(self) -> int:
        """Percentage of deliverables completed."""
        total = len(self.phase.deliverables)
        if total == 0:
            return 100 if self.status == PhaseStatus.COMPLETED else 0
        completed = len(self.deliverables_completed)
        return int((completed / total) * 100)

    @property
    def is_blocked(self) -> bool:
        """Whether phase is blocked."""
        return self.status == PhaseStatus.BLOCKED or len(self.blockers) > 0

    @property
    def duration_hours(self) -> Optional[float]:
        """Hours spent on phase."""
        if not self.started_at:
            return None
        end = self.completed_at or datetime.now()
        return (end - self.started_at).total_seconds() / 3600

    def start(self) -> None:
        """Start the phase."""
        self.status = PhaseStatus.IN_PROGRESS
        self.started_at = datetime.now()

    def complete(self) -> None:
        """Complete the phase."""
        self.status = PhaseStatus.COMPLETED
        self.completed_at = datetime.now()

    def add_blocker(self, blocker: str) -> None:
        """Add a blocker."""
        self.blockers.append(blocker)
        self.status = PhaseStatus.BLOCKED

    def resolve_blocker(self, blocker: str) -> None:
        """Resolve a blocker."""
        if blocker in self.blockers:
            self.blockers.remove(blocker)
        if not self.blockers and self.status == PhaseStatus.BLOCKED:
            self.status = PhaseStatus.IN_PROGRESS

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "phase": self.phase.value,
            "status": self.status.value,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "blockers": self.blockers,
            "deliverables_completed": self.deliverables_completed,
            "completion_percentage": self.completion_percentage,
            "notes": self.notes
        }


@dataclass
class BrandProfile:
    """Complete brand profile for onboarding."""
    brand_id: str
    brand_name: str
    industry: str
    website: str = ""
    primary_goal: GoalCategory = GoalCategory.BRAND_AWARENESS
    secondary_goals: List[GoalCategory] = field(default_factory=list)
    voice: BrandVoice = field(default_factory=BrandVoice)
    visual_identity: VisualIdentity = field(default_factory=VisualIdentity)
    accounts: List[PlatformAccount] = field(default_factory=list)
    personas: List[AudiencePersona] = field(default_factory=list)
    competitors: List[Competitor] = field(default_factory=list)
    content_strategy: ContentStrategy = field(default_factory=ContentStrategy)
    discovery_responses: List[DiscoveryResponse] = field(default_factory=list)
    phase_progress: Dict[OnboardingPhase, PhaseProgress] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        """Initialize phase progress for all phases."""
        for phase in OnboardingPhase:
            if phase not in self.phase_progress:
                self.phase_progress[phase] = PhaseProgress(phase=phase)

    @property
    def overall_progress(self) -> int:
        """Overall onboarding progress percentage."""
        total_weight = 0
        earned_weight = 0
        for phase, progress in self.phase_progress.items():
            phase_weight = phase.estimated_hours
            total_weight += phase_weight
            earned_weight += phase_weight * progress.status.weight
        return int((earned_weight / total_weight) * 100) if total_weight > 0 else 0

    @property
    def current_phase(self) -> Optional[OnboardingPhase]:
        """Current active phase."""
        for phase in OnboardingPhase:
            progress = self.phase_progress.get(phase)
            if progress and progress.status in [PhaseStatus.IN_PROGRESS, PhaseStatus.PENDING_REVIEW]:
                return phase
        # Find first not started
        for phase in OnboardingPhase:
            progress = self.phase_progress.get(phase)
            if progress and progress.status == PhaseStatus.NOT_STARTED:
                return phase
        return None

    @property
    def is_complete(self) -> bool:
        """Whether onboarding is complete."""
        return all(p.status == PhaseStatus.COMPLETED
                  for p in self.phase_progress.values())

    @property
    def active_platforms(self) -> List[Platform]:
        """List of active platforms."""
        return [a.platform for a in self.accounts if a.is_active]

    @property
    def blockers(self) -> List[str]:
        """All current blockers across phases."""
        all_blockers = []
        for progress in self.phase_progress.values():
            for blocker in progress.blockers:
                all_blockers.append(f"[{progress.phase.value}] {blocker}")
        return all_blockers

    def get_account(self, platform: Platform) -> Optional[PlatformAccount]:
        """Get account for platform."""
        for account in self.accounts:
            if account.platform == platform:
                return account
        return None

    def get_persona(self, segment: AudienceSegment) -> Optional[AudiencePersona]:
        """Get persona by segment."""
        for persona in self.personas:
            if persona.segment == segment:
                return persona
        return None

    def advance_phase(self, phase: OnboardingPhase) -> bool:
        """Complete a phase and advance to next."""
        progress = self.phase_progress.get(phase)
        if not progress:
            return False
        progress.complete()
        next_phase = phase.next_phase
        if next_phase:
            self.phase_progress[next_phase].start()
        self.updated_at = datetime.now()
        return True

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "brand_id": self.brand_id,
            "brand_name": self.brand_name,
            "industry": self.industry,
            "website": self.website,
            "primary_goal": self.primary_goal.value,
            "secondary_goals": [g.value for g in self.secondary_goals],
            "voice": self.voice.to_dict(),
            "visual_identity": self.visual_identity.to_dict(),
            "accounts": [a.to_dict() for a in self.accounts],
            "personas": [p.to_dict() for p in self.personas],
            "competitors": [c.to_dict() for c in self.competitors],
            "content_strategy": self.content_strategy.to_dict(),
            "discovery_responses": [r.to_dict() for r in self.discovery_responses],
            "phase_progress": {k.value: v.to_dict() for k, v in self.phase_progress.items()},
            "overall_progress": self.overall_progress,
            "current_phase": self.current_phase.value if self.current_phase else None,
            "is_complete": self.is_complete,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


# ============================================================
# ENGINE CLASSES - Onboarding Engines
# ============================================================

class DiscoveryEngine:
    """Engine for conducting discovery and capturing goals."""

    QUESTIONNAIRE = {
        "identity": [
            ("brand_words", "Describe your brand in 3 words"),
            ("personality", "If your brand was a person, how would you describe their personality?"),
            ("differentiation", "What makes you different from competitors?"),
            ("mission", "What is your brand's mission or purpose?"),
        ],
        "audience": [
            ("ideal_customer", "Describe your ideal customer in detail"),
            ("problems_solved", "What problems do you solve for customers?"),
            ("customer_journey", "How do customers typically find and buy from you?"),
            ("objections", "What are the most common objections you hear?"),
        ],
        "goals": [
            ("success_metrics", "How will you measure social media success?"),
            ("six_month_target", "What do you want to achieve in 6 months?"),
            ("primary_goal", "What is your #1 priority for social media?"),
            ("budget", "What resources (time, budget, team) are available?"),
        ],
        "content": [
            ("past_winners", "What content has performed best in the past?"),
            ("assets_available", "What content assets do you have (photos, videos, etc.)?"),
            ("content_restrictions", "Are there any topics or themes to avoid?"),
            ("approval_process", "Who needs to approve content before posting?"),
        ],
        "operations": [
            ("turnaround", "What is your expected turnaround time for content?"),
            ("tools", "What tools do you currently use for social media?"),
            ("team_structure", "Who on your team will be involved?"),
            ("availability", "How available is your team for content creation?"),
        ]
    }

    def __init__(self):
        self.responses: Dict[str, DiscoveryResponse] = {}

    def get_questionnaire(self, category: Optional[str] = None) -> List[tuple]:
        """Get questionnaire items."""
        if category and category in self.QUESTIONNAIRE:
            return self.QUESTIONNAIRE[category]
        # Return all
        all_questions = []
        for cat, questions in self.QUESTIONNAIRE.items():
            for q_id, question in questions:
                all_questions.append((f"{cat}_{q_id}", question, cat))
        return all_questions

    def record_response(self, question_id: str, question: str,
                       response: str, category: str) -> DiscoveryResponse:
        """Record a discovery response."""
        discovery_response = DiscoveryResponse(
            question_id=question_id,
            question=question,
            response=response,
            category=category
        )
        self.responses[question_id] = discovery_response
        return discovery_response

    def identify_goal(self, responses: List[DiscoveryResponse]) -> GoalCategory:
        """Identify primary goal from responses."""
        goal_keywords = {
            GoalCategory.BRAND_AWARENESS: ["awareness", "reach", "visibility", "known"],
            GoalCategory.LEAD_GENERATION: ["leads", "signup", "email", "generate"],
            GoalCategory.SALES_CONVERSION: ["sales", "revenue", "conversion", "purchase"],
            GoalCategory.COMMUNITY_BUILDING: ["community", "engagement", "loyalty", "fans"],
            GoalCategory.THOUGHT_LEADERSHIP: ["authority", "expert", "leader", "trust"],
            GoalCategory.TRAFFIC_DRIVING: ["traffic", "website", "clicks", "visits"],
        }

        scores = {goal: 0 for goal in GoalCategory}
        for response in responses:
            text = response.response.lower()
            for goal, keywords in goal_keywords.items():
                for keyword in keywords:
                    if keyword in text:
                        scores[goal] += 1

        return max(scores, key=scores.get)

    def get_completion_status(self) -> Dict[str, float]:
        """Get completion status by category."""
        status = {}
        for category, questions in self.QUESTIONNAIRE.items():
            total = len(questions)
            answered = sum(1 for q_id, _ in questions
                         if f"{category}_{q_id}" in self.responses and
                         self.responses[f"{category}_{q_id}"].is_complete)
            status[category] = answered / total if total > 0 else 0
        return status


class BrandCapturer:
    """Engine for capturing brand voice and visual identity."""

    def __init__(self):
        self.voice: Optional[BrandVoice] = None
        self.visual: Optional[VisualIdentity] = None

    def analyze_voice_from_content(self, sample_content: List[str]) -> List[VoiceTrait]:
        """Analyze voice traits from sample content."""
        trait_indicators = {
            VoiceTrait.PROFESSIONAL: ["professional", "expertise", "industry", "solutions"],
            VoiceTrait.CASUAL: ["hey", "awesome", "cool", "check out"],
            VoiceTrait.PLAYFUL: ["fun", "exciting", "!", "🎉"],
            VoiceTrait.AUTHORITATIVE: ["must", "essential", "critical", "proven"],
            VoiceTrait.FRIENDLY: ["we're here", "happy to", "love", "together"],
            VoiceTrait.INSPIRATIONAL: ["dream", "achieve", "possible", "transform"],
            VoiceTrait.EDUCATIONAL: ["learn", "how to", "tip", "guide"],
            VoiceTrait.BOLD: ["disrupt", "revolutionary", "game-changing", "fearless"],
            VoiceTrait.EMPATHETIC: ["understand", "feel", "struggle", "support"],
            VoiceTrait.WITTY: ["pun", "clever", "twist", "😉"],
        }

        scores = {trait: 0 for trait in VoiceTrait}
        combined_text = " ".join(sample_content).lower()

        for trait, indicators in trait_indicators.items():
            for indicator in indicators:
                if indicator in combined_text:
                    scores[trait] += 1

        # Return top 3 traits
        sorted_traits = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [trait for trait, score in sorted_traits[:3] if score > 0]

    def create_voice_guide(self, primary_traits: List[VoiceTrait],
                          we_are: List[str], we_are_not: List[str],
                          tone_description: str) -> BrandVoice:
        """Create a brand voice guide."""
        self.voice = BrandVoice(
            primary_traits=primary_traits,
            tone_description=tone_description,
            we_are=we_are,
            we_are_not=we_are_not
        )
        return self.voice

    def create_visual_guide(self, primary_colors: List[str],
                           fonts_primary: str, image_style: str,
                           logo_variations: List[str]) -> VisualIdentity:
        """Create a visual identity guide."""
        self.visual = VisualIdentity(
            primary_colors=primary_colors,
            fonts_primary=fonts_primary,
            image_style=image_style,
            logo_variations=logo_variations
        )
        return self.visual

    def validate_guidelines(self) -> List[str]:
        """Validate brand guidelines are complete."""
        issues = []
        if self.voice:
            if not self.voice.is_documented:
                issues.append("Brand voice incomplete - need more traits and descriptions")
            warnings = self.voice.validate_compatibility()
            issues.extend(warnings)
        else:
            issues.append("Brand voice not documented")

        if self.visual:
            if not self.visual.is_documented:
                issues.append("Visual identity incomplete - need colors, fonts, and logos")
        else:
            issues.append("Visual identity not documented")

        return issues


class AccountInventory:
    """Engine for managing platform account inventory."""

    def __init__(self):
        self.accounts: List[PlatformAccount] = []

    def add_account(self, platform: Platform, handle: str,
                   **kwargs) -> PlatformAccount:
        """Add a platform account."""
        account = PlatformAccount(platform=platform, handle=handle, **kwargs)
        self.accounts.append(account)
        return account

    def get_account(self, platform: Platform) -> Optional[PlatformAccount]:
        """Get account by platform."""
        for account in self.accounts:
            if account.platform == platform:
                return account
        return None

    def get_health_report(self) -> Dict[str, Any]:
        """Generate account health report."""
        if not self.accounts:
            return {"status": "No accounts", "accounts": []}

        total_score = sum(a.health_score for a in self.accounts)
        avg_score = total_score / len(self.accounts)

        attention_needed = []
        for account in self.accounts:
            if account.needs_attention:
                attention_needed.append({
                    "platform": account.platform.display_name,
                    "issues": account.needs_attention
                })

        return {
            "total_accounts": len(self.accounts),
            "average_health_score": avg_score,
            "attention_needed": attention_needed,
            "accounts": [a.to_dict() for a in self.accounts]
        }

    def suggest_platforms(self, goals: List[GoalCategory],
                         industry: str) -> List[Platform]:
        """Suggest platforms based on goals and industry."""
        platform_scores = {p: 0 for p in Platform}

        for goal in goals:
            for idx, platform in enumerate(goal.platform_priority):
                platform_scores[platform] += (5 - idx)  # Higher score for higher priority

        # Industry adjustments
        industry_preferences = {
            "b2b": [Platform.LINKEDIN, Platform.TWITTER],
            "fashion": [Platform.INSTAGRAM, Platform.PINTEREST, Platform.TIKTOK],
            "food": [Platform.INSTAGRAM, Platform.TIKTOK, Platform.PINTEREST],
            "tech": [Platform.TWITTER, Platform.LINKEDIN, Platform.YOUTUBE],
            "retail": [Platform.INSTAGRAM, Platform.FACEBOOK, Platform.PINTEREST],
        }

        industry_lower = industry.lower()
        for ind, platforms in industry_preferences.items():
            if ind in industry_lower:
                for platform in platforms:
                    platform_scores[platform] += 3

        # Return top 4
        sorted_platforms = sorted(platform_scores.items(),
                                 key=lambda x: x[1], reverse=True)
        return [p for p, _ in sorted_platforms[:4]]


class AudienceProfiler:
    """Engine for creating and managing audience personas."""

    def __init__(self):
        self.personas: List[AudiencePersona] = []

    def create_persona(self, name: str, segment: AudienceSegment,
                      **kwargs) -> AudiencePersona:
        """Create an audience persona."""
        persona_id = f"persona_{len(self.personas) + 1}"
        persona = AudiencePersona(
            persona_id=persona_id,
            name=name,
            segment=segment,
            **kwargs
        )
        self.personas.append(persona)
        return persona

    def get_persona_summary(self) -> Dict[str, Any]:
        """Get summary of all personas."""
        if not self.personas:
            return {"status": "No personas defined", "personas": []}

        avg_completeness = sum(p.completeness_score for p in self.personas) / len(self.personas)

        incomplete = [p for p in self.personas if not p.is_complete]

        return {
            "total_personas": len(self.personas),
            "average_completeness": avg_completeness,
            "incomplete_count": len(incomplete),
            "personas": [p.to_dict() for p in self.personas]
        }

    def suggest_persona_template(self, industry: str,
                                segment: AudienceSegment) -> Dict[str, Any]:
        """Suggest persona template based on industry."""
        templates = {
            "b2b": {
                "primary": {
                    "occupation": "Decision Maker / Manager",
                    "age_range": "35-54",
                    "interests": ["Industry trends", "ROI optimization", "Team efficiency"],
                    "pain_points": ["Time constraints", "Budget limitations", "Proving value"],
                    "content_preferences": ["Case studies", "ROI data", "Expert insights"]
                }
            },
            "ecommerce": {
                "primary": {
                    "occupation": "Consumer",
                    "age_range": "25-44",
                    "interests": ["Deals", "Product reviews", "Lifestyle content"],
                    "pain_points": ["Finding quality products", "Value for money", "Trust"],
                    "content_preferences": ["Product showcases", "Reviews", "How-to content"]
                }
            }
        }

        # Find matching template
        for ind, segs in templates.items():
            if ind in industry.lower():
                if segment.value in segs:
                    return segs[segment.value]

        # Default template
        return {
            "occupation": "Target Customer",
            "age_range": "25-54",
            "interests": ["Industry content", "Value-driven content"],
            "pain_points": ["Finding solutions", "Making decisions"],
            "content_preferences": ["Educational content", "Product information"]
        }


class ContentFoundation:
    """Engine for building content strategy foundation."""

    def __init__(self):
        self.strategy: Optional[ContentStrategy] = None

    def create_strategy(self, pillars: Dict[ContentPillar, int],
                       posting_frequency: Dict[Platform, str]) -> ContentStrategy:
        """Create content strategy."""
        self.strategy = ContentStrategy(
            pillars=pillars,
            posting_frequency=posting_frequency
        )
        return self.strategy

    def suggest_pillar_mix(self, goals: List[GoalCategory]) -> Dict[ContentPillar, int]:
        """Suggest content pillar mix based on goals."""
        # Start with defaults
        mix = {
            ContentPillar.EDUCATIONAL: 30,
            ContentPillar.PROMOTIONAL: 20,
            ContentPillar.ENTERTAINING: 15,
            ContentPillar.INSPIRATIONAL: 10,
            ContentPillar.COMMUNITY: 15,
            ContentPillar.BEHIND_SCENES: 5,
            ContentPillar.USER_GENERATED: 5,
        }

        # Adjust based on goals
        for goal in goals:
            if goal == GoalCategory.SALES_CONVERSION:
                mix[ContentPillar.PROMOTIONAL] += 10
                mix[ContentPillar.EDUCATIONAL] -= 5
                mix[ContentPillar.ENTERTAINING] -= 5
            elif goal == GoalCategory.COMMUNITY_BUILDING:
                mix[ContentPillar.COMMUNITY] += 10
                mix[ContentPillar.USER_GENERATED] += 5
                mix[ContentPillar.PROMOTIONAL] -= 15
            elif goal == GoalCategory.THOUGHT_LEADERSHIP:
                mix[ContentPillar.EDUCATIONAL] += 15
                mix[ContentPillar.ENTERTAINING] -= 10
                mix[ContentPillar.PROMOTIONAL] -= 5
            elif goal == GoalCategory.BRAND_AWARENESS:
                mix[ContentPillar.ENTERTAINING] += 10
                mix[ContentPillar.INSPIRATIONAL] += 5
                mix[ContentPillar.PROMOTIONAL] -= 15

        # Normalize to 100%
        total = sum(mix.values())
        return {k: int(v * 100 / total) for k, v in mix.items()}

    def generate_hashtag_strategy(self, industry: str,
                                 brand_name: str) -> Dict[str, List[str]]:
        """Generate hashtag strategy."""
        return {
            "branded": [f"#{brand_name.replace(' ', '')}",
                       f"#{brand_name.replace(' ', '')}Life"],
            "industry": [f"#{industry.replace(' ', '')}",
                        f"#{industry.replace(' ', '')}Tips"],
            "community": ["#SmallBusiness", "#Entrepreneur", "#Community"],
            "engagement": ["#MondayMotivation", "#TipTuesday", "#ThrowbackThursday"]
        }

    def validate_strategy(self) -> List[str]:
        """Validate content strategy."""
        if not self.strategy:
            return ["Content strategy not defined"]

        issues = []
        if not self.strategy.is_defined:
            issues.append("Content strategy incomplete - need pillars and frequency")

        issues.extend(self.strategy.validate_mix())

        return issues


class OnboardingOrchestrator:
    """Main orchestrator for brand onboarding workflow."""

    def __init__(self, brand_name: str, industry: str):
        self.profile = BrandProfile(
            brand_id=f"brand_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            brand_name=brand_name,
            industry=industry
        )

        # Initialize engines
        self.discovery = DiscoveryEngine()
        self.brand_capturer = BrandCapturer()
        self.account_inventory = AccountInventory()
        self.audience_profiler = AudienceProfiler()
        self.content_foundation = ContentFoundation()

    def start_onboarding(self) -> Dict[str, Any]:
        """Start the onboarding process."""
        # Start discovery phase
        self.profile.phase_progress[OnboardingPhase.DISCOVERY].start()

        return {
            "brand_id": self.profile.brand_id,
            "brand_name": self.profile.brand_name,
            "current_phase": OnboardingPhase.DISCOVERY.value,
            "questionnaire": self.discovery.get_questionnaire()
        }

    def complete_discovery(self, responses: List[Dict[str, str]]) -> Dict[str, Any]:
        """Complete discovery phase with responses."""
        # Record all responses
        for resp in responses:
            self.discovery.record_response(
                question_id=resp["question_id"],
                question=resp["question"],
                response=resp["response"],
                category=resp.get("category", "general")
            )

        # Store in profile
        self.profile.discovery_responses = list(self.discovery.responses.values())

        # Identify primary goal
        self.profile.primary_goal = self.discovery.identify_goal(
            self.profile.discovery_responses
        )

        # Advance to next phase
        self.profile.advance_phase(OnboardingPhase.DISCOVERY)

        return {
            "phase_completed": "discovery",
            "identified_goal": self.profile.primary_goal.value,
            "next_phase": "brand_documentation",
            "completion_status": self.discovery.get_completion_status()
        }

    def complete_brand_documentation(self, voice: BrandVoice,
                                    visual: VisualIdentity) -> Dict[str, Any]:
        """Complete brand documentation phase."""
        self.profile.voice = voice
        self.profile.visual_identity = visual

        # Validate
        issues = self.brand_capturer.validate_guidelines()
        self.brand_capturer.voice = voice
        self.brand_capturer.visual = visual

        if not issues:
            self.profile.advance_phase(OnboardingPhase.BRAND_DOCUMENTATION)

        return {
            "phase_completed": "brand_documentation" if not issues else None,
            "voice_documented": voice.is_documented,
            "visual_documented": visual.is_documented,
            "issues": issues,
            "next_phase": "account_inventory" if not issues else None
        }

    def complete_account_inventory(self, accounts: List[PlatformAccount]) -> Dict[str, Any]:
        """Complete account inventory phase."""
        self.profile.accounts = accounts
        for account in accounts:
            self.account_inventory.add_account(
                platform=account.platform,
                handle=account.handle
            )

        # Get health report
        health = self.account_inventory.get_health_report()

        self.profile.advance_phase(OnboardingPhase.ACCOUNT_INVENTORY)

        return {
            "phase_completed": "account_inventory",
            "accounts_added": len(accounts),
            "health_report": health,
            "next_phase": "audience_research"
        }

    def complete_audience_research(self, personas: List[AudiencePersona]) -> Dict[str, Any]:
        """Complete audience research phase."""
        self.profile.personas = personas
        for persona in personas:
            self.audience_profiler.personas.append(persona)

        # Get summary
        summary = self.audience_profiler.get_persona_summary()

        self.profile.advance_phase(OnboardingPhase.AUDIENCE_RESEARCH)

        return {
            "phase_completed": "audience_research",
            "personas_created": len(personas),
            "summary": summary,
            "next_phase": "content_foundation"
        }

    def complete_content_foundation(self, strategy: ContentStrategy) -> Dict[str, Any]:
        """Complete content foundation phase."""
        self.profile.content_strategy = strategy
        self.content_foundation.strategy = strategy

        # Validate
        issues = self.content_foundation.validate_strategy()

        if not issues:
            self.profile.advance_phase(OnboardingPhase.CONTENT_FOUNDATION)

        return {
            "phase_completed": "content_foundation" if not issues else None,
            "strategy_defined": strategy.is_defined,
            "issues": issues,
            "onboarding_complete": self.profile.is_complete
        }

    def get_status(self) -> Dict[str, Any]:
        """Get overall onboarding status."""
        return {
            "brand": self.profile.brand_name,
            "overall_progress": self.profile.overall_progress,
            "current_phase": self.profile.current_phase.value if self.profile.current_phase else "complete",
            "is_complete": self.profile.is_complete,
            "blockers": self.profile.blockers,
            "phases": {p.value: prog.to_dict()
                      for p, prog in self.profile.phase_progress.items()}
        }

    def export_profile(self) -> Dict[str, Any]:
        """Export complete brand profile."""
        return self.profile.to_dict()


# ============================================================
# REPORTER - ASCII Dashboard Generation
# ============================================================

class OnboardingReporter:
    """Generate ASCII dashboard reports for onboarding status."""

    @staticmethod
    def generate_progress_bar(percentage: int, width: int = 20) -> str:
        """Generate ASCII progress bar."""
        filled = int(width * percentage / 100)
        empty = width - filled
        return f"{'█' * filled}{'░' * empty}"

    @staticmethod
    def generate_status_dashboard(profile: BrandProfile) -> str:
        """Generate onboarding status dashboard."""
        progress_bar = OnboardingReporter.generate_progress_bar(profile.overall_progress)

        output = f"""
BRAND ONBOARDING
═══════════════════════════════════════
Brand: {profile.brand_name}
Industry: {profile.industry}
Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}
═══════════════════════════════════════

ONBOARDING OVERVIEW
────────────────────────────────────
┌─────────────────────────────────────┐
│       ONBOARDING STATUS             │
│                                     │
│  Brand: {profile.brand_name:<26}│
│  Industry: {profile.industry:<24}│
│  Goal: {profile.primary_goal.value:<28}│
│                                     │
│  Platforms: {len(profile.accounts):<24}│
│  Personas: {len(profile.personas):<25}│
│                                     │
│  Progress: {progress_bar} {profile.overall_progress}%│
│  Status: {'●' if not profile.is_complete else '✓'} {'In Progress' if not profile.is_complete else 'Complete'}            │
└─────────────────────────────────────┘

CHECKLIST
────────────────────────────────────
| Phase                 | Status    |
|-----------------------|-----------|"""

        for phase in OnboardingPhase:
            progress = profile.phase_progress.get(phase)
            if progress:
                status = progress.status.symbol
                output += f"\n| {phase.value.replace('_', ' ').title():<21} | {status:<9} |"

        output += "\n"

        # Add voice section if documented
        if profile.voice.is_documented:
            output += f"""
BRAND VOICE
────────────────────────────────────
┌─────────────────────────────────────┐
│  Tone: {profile.voice.trait_summary:<28}│
│                                     │
│  We ARE:                            │"""
            for trait in profile.voice.we_are[:3]:
                output += f"\n│  • {trait:<32}│"
            output += """
│                                     │
│  We are NOT:                        │"""
            for trait in profile.voice.we_are_not[:3]:
                output += f"\n│  • {trait:<32}│"
            output += "\n└─────────────────────────────────────┘\n"

        # Add platforms section
        if profile.accounts:
            output += """
PLATFORMS
────────────────────────────────────
| Platform  | Handle        | Freq     |
|-----------|---------------|----------|"""
            for account in profile.accounts[:5]:
                output += f"\n| {account.platform.display_name:<9} | @{account.handle:<12} | {account.posting_frequency or account.platform.recommended_frequency:<8} |"
            output += "\n"

        # Add content pillars if defined
        if profile.content_strategy.is_defined:
            output += """
CONTENT PILLARS
────────────────────────────────────
| Pillar        | %   | Description       |
|---------------|-----|-------------------|"""
            for pillar, pct in sorted(profile.content_strategy.pillars.items(),
                                     key=lambda x: x[1], reverse=True)[:5]:
                desc = pillar.description[:17]
                output += f"\n| {pillar.value.replace('_', ' ').title():<13} | {pct:>2}% | {desc:<17} |"
            output += "\n"

        # Add next steps
        blockers = profile.blockers
        current = profile.current_phase

        output += """
NEXT STEPS
────────────────────────────────────"""
        if blockers:
            output += "\n• [BLOCKED] Resolve blockers:"
            for blocker in blockers[:3]:
                output += f"\n  - {blocker}"
        elif current:
            deliverables = current.deliverables
            output += f"\n• Complete {current.value.replace('_', ' ').title()} phase:"
            for d in deliverables[:3]:
                output += f"\n  - {d}"
        else:
            output += "\n• Onboarding complete! Ready to start creating content."

        output += f"""

Onboarding Status: {'● In Progress' if not profile.is_complete else '✓ Complete'}
"""
        return output

    @staticmethod
    def generate_questionnaire_output(questionnaire: List[tuple]) -> str:
        """Generate formatted questionnaire."""
        output = """
DISCOVERY QUESTIONNAIRE
═══════════════════════════════════════

Complete these questions to begin your brand onboarding.
"""
        current_category = None
        q_num = 1

        for item in questionnaire:
            if len(item) == 3:
                q_id, question, category = item
            else:
                q_id, question = item
                category = "general"

            if category != current_category:
                current_category = category
                output += f"\n## {category.upper()}\n"

            output += f"\n{q_num}. {question}\n   [Your answer here]\n"
            q_num += 1

        return output

    @staticmethod
    def generate_checklist() -> str:
        """Generate onboarding checklist."""
        output = """
BRAND ONBOARDING CHECKLIST
═══════════════════════════════════════

## PHASE 1: DISCOVERY
□ Conduct discovery call
□ Map business goals
□ Review current social presence
□ Identify competitors
□ Assess available resources

## PHASE 2: BRAND DOCUMENTATION
□ Capture brand voice
□ Document voice traits (we are/we're not)
□ Collect visual assets
□ Document color palette & fonts
□ List logo variations

## PHASE 3: ACCOUNT INVENTORY
□ List all platforms
□ Collect credentials/access
□ Document Page IDs
□ Review account settings
□ Check verification status

## PHASE 4: AUDIENCE RESEARCH
□ Create primary persona
□ Create secondary persona
□ Map demographics
□ Identify interests
□ Document pain points

## PHASE 5: CONTENT FOUNDATION
□ Define content pillars
□ Set posting frequency
□ Identify best posting times
□ Create hashtag strategy
□ Plan initial 2-week content

═══════════════════════════════════════
"""
        return output


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="SOCIAL.ONBOARD.EXE - Brand Onboarding Specialist"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Start command
    start_parser = subparsers.add_parser("start", help="Start new brand onboarding")
    start_parser.add_argument("brand", help="Brand name")
    start_parser.add_argument("--industry", "-i", required=True, help="Industry")
    start_parser.add_argument("--website", "-w", help="Website URL")

    # Questionnaire command
    quest_parser = subparsers.add_parser("questionnaire", help="Generate discovery questionnaire")
    quest_parser.add_argument("--category", "-c", help="Specific category")

    # Status command
    status_parser = subparsers.add_parser("status", help="Show onboarding status")
    status_parser.add_argument("brand", help="Brand name")

    # Checklist command
    subparsers.add_parser("checklist", help="Get onboarding checklist")

    # Profile command
    profile_parser = subparsers.add_parser("profile", help="Generate brand profile")
    profile_parser.add_argument("brand", help="Brand name")

    # Audit command
    audit_parser = subparsers.add_parser("audit", help="Audit existing accounts")
    audit_parser.add_argument("brand", help="Brand name")

    # Demo command
    subparsers.add_parser("demo", help="Run demonstration")

    args = parser.parse_args()

    if args.command == "start":
        orchestrator = OnboardingOrchestrator(args.brand, args.industry)
        result = orchestrator.start_onboarding()
        print(f"\n✓ Started onboarding for {args.brand}")
        print(f"Brand ID: {result['brand_id']}")
        print(f"Current Phase: {result['current_phase']}")
        print("\nRun 'questionnaire' command to get discovery questions.")

    elif args.command == "questionnaire":
        engine = DiscoveryEngine()
        questionnaire = engine.get_questionnaire(args.category)
        print(OnboardingReporter.generate_questionnaire_output(questionnaire))

    elif args.command == "checklist":
        print(OnboardingReporter.generate_checklist())

    elif args.command == "demo":
        run_demo()

    else:
        parser.print_help()


def run_demo():
    """Run demonstration of onboarding system."""
    print("=" * 60)
    print("SOCIAL.ONBOARD.EXE - DEMONSTRATION")
    print("=" * 60)

    # Create orchestrator
    print("\n[1] Starting onboarding for 'Acme Coffee Co.'...")
    orchestrator = OnboardingOrchestrator("Acme Coffee Co.", "Coffee & Beverages")
    result = orchestrator.start_onboarding()
    print(f"    Brand ID: {result['brand_id']}")
    print(f"    Current Phase: {result['current_phase']}")

    # Simulate discovery completion
    print("\n[2] Completing discovery phase...")
    discovery_responses = [
        {"question_id": "identity_brand_words", "question": "Brand in 3 words",
         "response": "Artisanal, Community-focused, Sustainable", "category": "identity"},
        {"question_id": "goals_primary_goal", "question": "Primary goal",
         "response": "Build brand awareness and community engagement", "category": "goals"},
        {"question_id": "audience_ideal_customer", "question": "Ideal customer",
         "response": "Young professionals who appreciate quality coffee", "category": "audience"}
    ]
    result = orchestrator.complete_discovery(discovery_responses)
    print(f"    Identified Goal: {result['identified_goal']}")

    # Add brand voice
    print("\n[3] Documenting brand voice...")
    voice = BrandVoice(
        primary_traits=[VoiceTrait.FRIENDLY, VoiceTrait.CASUAL],
        secondary_traits=[VoiceTrait.EDUCATIONAL],
        tone_description="Warm, welcoming, like chatting with a friend over coffee",
        we_are=["Approachable", "Knowledgeable about coffee", "Community-oriented", "Sustainably minded"],
        we_are_not=["Pretentious", "Corporate", "Pushy sales", "Boring"],
        emoji_usage="moderate"
    )
    visual = VisualIdentity(
        primary_colors=["#4A2C2A", "#D4A574", "#FFFFFF"],
        fonts_primary="Playfair Display",
        fonts_secondary="Open Sans",
        image_style="photography",
        logo_variations=["full", "icon", "wordmark"]
    )
    result = orchestrator.complete_brand_documentation(voice, visual)
    print(f"    Voice Documented: {result['voice_documented']}")
    print(f"    Visual Documented: {result['visual_documented']}")

    # Add accounts
    print("\n[4] Adding platform accounts...")
    accounts = [
        PlatformAccount(Platform.INSTAGRAM, "acmecoffee", follower_count=5200,
                       has_business_account=True, posting_frequency="1x/day"),
        PlatformAccount(Platform.FACEBOOK, "AcmeCoffeeCo", follower_count=3100,
                       has_business_account=True),
        PlatformAccount(Platform.TIKTOK, "acmecoffee", follower_count=890)
    ]
    result = orchestrator.complete_account_inventory(accounts)
    print(f"    Accounts Added: {result['accounts_added']}")

    # Add personas
    print("\n[5] Creating audience personas...")
    personas = [
        AudiencePersona(
            persona_id="p1",
            name="Coffee Enthusiast Emma",
            segment=AudienceSegment.PRIMARY,
            age_range="25-35",
            occupation="Marketing Professional",
            interests=["Specialty coffee", "Local businesses", "Sustainability"],
            pain_points=["Finding quality coffee", "Lack of community spaces"],
            preferred_platforms=[Platform.INSTAGRAM, Platform.TIKTOK]
        ),
        AudiencePersona(
            persona_id="p2",
            name="Remote Worker Ryan",
            segment=AudienceSegment.SECONDARY,
            age_range="28-40",
            occupation="Tech Worker",
            interests=["Work-friendly cafes", "Quality wifi", "Good ambiance"],
            pain_points=["Noisy coffee shops", "Unreliable wifi"],
            preferred_platforms=[Platform.INSTAGRAM, Platform.LINKEDIN]
        )
    ]
    result = orchestrator.complete_audience_research(personas)
    print(f"    Personas Created: {result['personas_created']}")

    # Add content strategy
    print("\n[6] Defining content strategy...")
    strategy = ContentStrategy(
        pillars={
            ContentPillar.EDUCATIONAL: 30,
            ContentPillar.COMMUNITY: 25,
            ContentPillar.BEHIND_SCENES: 20,
            ContentPillar.PROMOTIONAL: 15,
            ContentPillar.USER_GENERATED: 10
        },
        posting_frequency={
            Platform.INSTAGRAM: "1x/day",
            Platform.FACEBOOK: "4x/week",
            Platform.TIKTOK: "3x/week"
        },
        hashtag_groups={
            "branded": ["#AcmeCoffee", "#AcmeCoffeeCo"],
            "industry": ["#CoffeeLovers", "#SpecialtyCoffee"],
            "local": ["#SeattleCoffee", "#PNWCoffee"]
        },
        content_series=["Meet the Barista Monday", "Coffee Tip Tuesday", "Behind the Roast"]
    )
    result = orchestrator.complete_content_foundation(strategy)
    print(f"    Strategy Defined: {result['strategy_defined']}")
    print(f"    Onboarding Complete: {result['onboarding_complete']}")

    # Generate dashboard
    print("\n[7] Generating status dashboard...")
    print(OnboardingReporter.generate_status_dashboard(orchestrator.profile))

    # Export profile
    print("\n[8] Exporting brand profile (JSON)...")
    profile_json = json.dumps(orchestrator.export_profile(), indent=2, default=str)
    print(f"    Profile exported: {len(profile_json)} characters")
    print(f"    Overall Progress: {orchestrator.profile.overall_progress}%")

    print("\n" + "=" * 60)
    print("DEMONSTRATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/social-onboard [brand]` - Full onboarding workflow
- `/social-onboard questionnaire` - Generate client questionnaire
- `/social-onboard profile [brand]` - Create brand profile
- `/social-onboard audit [brand]` - Audit existing accounts
- `/social-onboard checklist` - Get onboarding checklist

$ARGUMENTS
