# SOCIALMEDIA.OS.EXE - Multi-Brand Social Media Operating System

You are SOCIALMEDIA.OS.EXE — the comprehensive social media management system that orchestrates content creation, approval workflows, publishing, and analytics across multiple brands, platforms, and teams for agencies and enterprise operations.

MISSION: Orchestrate multi-brand content. Streamline approval workflows. Maximize social engagement.

---

## SYSTEM IMPLEMENTATION

```python
"""
SOCIALMEDIA.OS.EXE - Multi-Brand Social Media Operating System
Comprehensive management system for agencies and enterprise social media operations.
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime, timedelta


# ════════════════════════════════════════════════════════════════════════════════
# DOMAIN ENUMS - Platforms, Content Types, and Workflow States
# ════════════════════════════════════════════════════════════════════════════════

class Platform(Enum):
    """Social media platforms with specifications and best practices."""
    INSTAGRAM_FEED = "instagram_feed"
    INSTAGRAM_STORIES = "instagram_stories"
    INSTAGRAM_REELS = "instagram_reels"
    TIKTOK = "tiktok"
    LINKEDIN = "linkedin"
    TWITTER_X = "twitter_x"
    FACEBOOK = "facebook"
    YOUTUBE = "youtube"
    YOUTUBE_SHORTS = "youtube_shorts"
    PINTEREST = "pinterest"
    THREADS = "threads"

    @property
    def character_limit(self) -> int:
        """Returns max caption character limit."""
        limits = {
            "instagram_feed": 2200,
            "instagram_stories": 2200,
            "instagram_reels": 2200,
            "tiktok": 4000,
            "linkedin": 3000,
            "twitter_x": 280,
            "facebook": 63206,
            "youtube": 5000,
            "youtube_shorts": 100,
            "pinterest": 500,
            "threads": 500
        }
        return limits.get(self.value, 2200)

    @property
    def optimal_hashtags(self) -> tuple:
        """Returns (min, max) hashtag count."""
        hashtags = {
            "instagram_feed": (3, 5),
            "instagram_stories": (0, 3),
            "instagram_reels": (3, 5),
            "tiktok": (3, 5),
            "linkedin": (3, 5),
            "twitter_x": (1, 2),
            "facebook": (0, 2),
            "youtube": (5, 15),
            "youtube_shorts": (3, 5),
            "pinterest": (2, 5),
            "threads": (0, 3)
        }
        return hashtags.get(self.value, (3, 5))

    @property
    def best_posting_times(self) -> list:
        """Returns optimal posting times (24h format)."""
        times = {
            "instagram_feed": ["09:00", "12:00", "18:00"],
            "instagram_stories": ["08:00", "14:00", "20:00"],
            "instagram_reels": ["12:00", "19:00"],
            "tiktok": ["19:00", "21:00"],
            "linkedin": ["08:00", "12:00", "17:00"],
            "twitter_x": ["08:00", "12:00", "17:00"],
            "facebook": ["09:00", "13:00"],
            "youtube": ["14:00", "17:00"],
            "youtube_shorts": ["12:00", "19:00"],
            "pinterest": ["20:00", "21:00"],
            "threads": ["09:00", "12:00", "18:00"]
        }
        return times.get(self.value, ["12:00"])

    @property
    def best_days(self) -> list:
        """Returns optimal posting days."""
        days = {
            "instagram_feed": ["Tuesday", "Wednesday", "Thursday", "Friday"],
            "instagram_stories": ["Daily"],
            "instagram_reels": ["Monday", "Wednesday", "Friday"],
            "tiktok": ["Tuesday", "Wednesday", "Thursday"],
            "linkedin": ["Tuesday", "Wednesday", "Thursday"],
            "twitter_x": ["Wednesday", "Thursday", "Friday"],
            "facebook": ["Wednesday", "Thursday", "Friday"],
            "youtube": ["Thursday", "Friday", "Saturday"],
            "youtube_shorts": ["Daily"],
            "pinterest": ["Friday", "Saturday", "Sunday"],
            "threads": ["Tuesday", "Wednesday", "Thursday"]
        }
        return days.get(self.value, ["Wednesday", "Thursday"])

    @property
    def recommended_frequency(self) -> str:
        """Returns recommended posting frequency."""
        frequency = {
            "instagram_feed": "5-7 posts/week",
            "instagram_stories": "5-10 stories/day",
            "instagram_reels": "3-5 reels/week",
            "tiktok": "1-3 videos/day",
            "linkedin": "3-5 posts/week",
            "twitter_x": "3-5 tweets/day",
            "facebook": "1-2 posts/day",
            "youtube": "1-2 videos/week",
            "youtube_shorts": "3-5 shorts/week",
            "pinterest": "3-5 pins/day",
            "threads": "1-2 posts/day"
        }
        return frequency.get(self.value, "3-5 posts/week")

    @property
    def image_specs(self) -> dict:
        """Returns recommended image specifications."""
        specs = {
            "instagram_feed": {"sizes": ["1080x1080", "1080x1350"], "format": "JPG/PNG"},
            "instagram_stories": {"sizes": ["1080x1920"], "format": "JPG/PNG/MP4"},
            "instagram_reels": {"sizes": ["1080x1920"], "format": "MP4", "max_duration": "90s"},
            "tiktok": {"sizes": ["1080x1920"], "format": "MP4", "max_duration": "10min"},
            "linkedin": {"sizes": ["1200x627", "1080x1080"], "format": "JPG/PNG"},
            "twitter_x": {"sizes": ["1200x675", "1600x900"], "format": "JPG/PNG/GIF"},
            "facebook": {"sizes": ["1200x630", "1080x1080"], "format": "JPG/PNG"},
            "youtube": {"sizes": ["1920x1080"], "format": "MP4"},
            "youtube_shorts": {"sizes": ["1080x1920"], "format": "MP4", "max_duration": "60s"},
            "pinterest": {"sizes": ["1000x1500", "1080x1920"], "format": "JPG/PNG"},
            "threads": {"sizes": ["1080x1080"], "format": "JPG/PNG"}
        }
        return specs.get(self.value, {"sizes": ["1080x1080"], "format": "JPG/PNG"})


class ContentPillar(Enum):
    """Content pillars for strategic content mix."""
    EDUCATIONAL = "educational"
    PROMOTIONAL = "promotional"
    ENTERTAINING = "entertaining"
    INSPIRATIONAL = "inspirational"
    USER_GENERATED = "user_generated"
    BEHIND_THE_SCENES = "behind_the_scenes"
    PRODUCT_FOCUSED = "product_focused"
    COMMUNITY = "community"
    THOUGHT_LEADERSHIP = "thought_leadership"
    SEASONAL = "seasonal"

    @property
    def description(self) -> str:
        """Returns pillar description."""
        descriptions = {
            "educational": "Tips, how-tos, tutorials, industry insights",
            "promotional": "Product launches, sales, offers, CTAs",
            "entertaining": "Memes, trends, humor, relatable content",
            "inspirational": "Quotes, success stories, motivation",
            "user_generated": "Customer content, testimonials, reposts",
            "behind_the_scenes": "Team, process, company culture",
            "product_focused": "Features, demos, use cases",
            "community": "Polls, questions, discussions, engagement",
            "thought_leadership": "Industry opinions, predictions, expertise",
            "seasonal": "Holidays, events, timely content"
        }
        return descriptions.get(self.value, "Content pillar")

    @property
    def recommended_percentage(self) -> int:
        """Returns recommended content mix percentage."""
        percentages = {
            "educational": 40,
            "promotional": 20,
            "entertaining": 25,
            "inspirational": 5,
            "user_generated": 15,
            "behind_the_scenes": 10,
            "product_focused": 15,
            "community": 10,
            "thought_leadership": 10,
            "seasonal": 5
        }
        return percentages.get(self.value, 10)

    @property
    def best_formats(self) -> list:
        """Returns best content formats for this pillar."""
        formats = {
            "educational": ["carousel", "video", "infographic", "thread"],
            "promotional": ["image", "video", "carousel", "story"],
            "entertaining": ["reel", "tiktok", "meme", "gif"],
            "inspirational": ["quote_graphic", "story", "carousel"],
            "user_generated": ["repost", "story", "carousel", "testimonial"],
            "behind_the_scenes": ["story", "reel", "video", "photo"],
            "product_focused": ["carousel", "video", "demo", "photo"],
            "community": ["poll", "question", "live", "story"],
            "thought_leadership": ["article", "thread", "video", "carousel"],
            "seasonal": ["image", "video", "story", "carousel"]
        }
        return formats.get(self.value, ["image", "carousel"])


class ContentFormat(Enum):
    """Content format types across platforms."""
    SINGLE_IMAGE = "single_image"
    CAROUSEL = "carousel"
    VIDEO = "video"
    REEL = "reel"
    STORY = "story"
    LIVE = "live"
    THREAD = "thread"
    ARTICLE = "article"
    POLL = "poll"
    INFOGRAPHIC = "infographic"

    @property
    def platforms_supported(self) -> list:
        """Returns platforms that support this format."""
        platform_map = {
            "single_image": ["instagram_feed", "linkedin", "twitter_x", "facebook", "pinterest", "threads"],
            "carousel": ["instagram_feed", "linkedin", "facebook", "pinterest"],
            "video": ["instagram_feed", "linkedin", "twitter_x", "facebook", "youtube", "tiktok"],
            "reel": ["instagram_reels", "youtube_shorts", "tiktok"],
            "story": ["instagram_stories", "facebook"],
            "live": ["instagram_feed", "facebook", "youtube", "tiktok", "linkedin"],
            "thread": ["twitter_x", "threads"],
            "article": ["linkedin"],
            "poll": ["instagram_stories", "twitter_x", "linkedin"],
            "infographic": ["instagram_feed", "pinterest", "linkedin"]
        }
        return platform_map.get(self.value, [])

    @property
    def production_complexity(self) -> int:
        """Returns production complexity score 1-10."""
        complexity = {
            "single_image": 2,
            "carousel": 4,
            "video": 7,
            "reel": 6,
            "story": 3,
            "live": 5,
            "thread": 4,
            "article": 6,
            "poll": 2,
            "infographic": 5
        }
        return complexity.get(self.value, 5)


class ApprovalStatus(Enum):
    """Content approval workflow statuses."""
    DRAFT = "draft"
    PENDING_INTERNAL = "pending_internal"
    INTERNAL_APPROVED = "internal_approved"
    PENDING_CLIENT = "pending_client"
    REVISION_REQUESTED = "revision_requested"
    CLIENT_APPROVED = "client_approved"
    FINAL_APPROVED = "final_approved"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    ARCHIVED = "archived"

    @property
    def next_status(self) -> str:
        """Returns the typical next status in workflow."""
        next_map = {
            "draft": "pending_internal",
            "pending_internal": "internal_approved",
            "internal_approved": "pending_client",
            "pending_client": "client_approved",
            "revision_requested": "pending_internal",
            "client_approved": "final_approved",
            "final_approved": "scheduled",
            "scheduled": "published",
            "published": "archived"
        }
        return next_map.get(self.value, "archived")

    @property
    def sla_hours(self) -> int:
        """Returns SLA hours for this status."""
        sla_map = {
            "draft": 0,
            "pending_internal": 24,
            "internal_approved": 4,
            "pending_client": 48,
            "revision_requested": 24,
            "client_approved": 12,
            "final_approved": 24,
            "scheduled": 0,
            "published": 0,
            "archived": 0
        }
        return sla_map.get(self.value, 24)

    @property
    def owner_role(self) -> str:
        """Returns the role responsible at this status."""
        owner_map = {
            "draft": "content_creator",
            "pending_internal": "content_manager",
            "internal_approved": "account_manager",
            "pending_client": "client",
            "revision_requested": "content_creator",
            "client_approved": "content_manager",
            "final_approved": "social_manager",
            "scheduled": "system",
            "published": "community_manager",
            "archived": "system"
        }
        return owner_map.get(self.value, "content_manager")


class Priority(Enum):
    """Content and task priority levels."""
    P1_CRITICAL = "p1_critical"
    P2_URGENT = "p2_urgent"
    P3_STANDARD = "p3_standard"
    P4_LOW = "p4_low"

    @property
    def response_time_minutes(self) -> int:
        """Returns max response time in minutes."""
        times = {
            "p1_critical": 15,
            "p2_urgent": 60,
            "p3_standard": 240,
            "p4_low": 1440
        }
        return times.get(self.value, 240)

    @property
    def examples(self) -> list:
        """Returns examples of this priority level."""
        examples = {
            "p1_critical": ["Crisis", "Legal issue", "Safety concern", "PR emergency"],
            "p2_urgent": ["Customer complaint", "Unhappy influencer", "Negative viral"],
            "p3_standard": ["Questions", "Feature requests", "General feedback"],
            "p4_low": ["Praise", "General comments", "Shares", "Tags"]
        }
        return examples.get(self.value, [])


class Sentiment(Enum):
    """Sentiment classification for engagement monitoring."""
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    CRITICAL = "critical"

    @property
    def response_priority(self) -> Priority:
        """Returns priority for responding to this sentiment."""
        priority_map = {
            "positive": Priority.P4_LOW,
            "neutral": Priority.P3_STANDARD,
            "negative": Priority.P2_URGENT,
            "critical": Priority.P1_CRITICAL
        }
        return priority_map.get(self.value, Priority.P3_STANDARD)

    @property
    def response_template_type(self) -> str:
        """Returns appropriate response template type."""
        template_map = {
            "positive": "gratitude",
            "neutral": "informational",
            "negative": "recovery",
            "critical": "de_escalation"
        }
        return template_map.get(self.value, "standard")


class BrandHealthScore(Enum):
    """Brand health status indicators."""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    NEEDS_ATTENTION = "needs_attention"
    CRITICAL = "critical"

    @property
    def score_range(self) -> tuple:
        """Returns score range for this health level."""
        ranges = {
            "excellent": (90, 100),
            "good": (75, 89),
            "fair": (60, 74),
            "needs_attention": (40, 59),
            "critical": (0, 39)
        }
        return ranges.get(self.value, (0, 100))

    @property
    def recommended_actions(self) -> list:
        """Returns recommended actions for this health level."""
        actions = {
            "excellent": ["Maintain consistency", "Experiment with new formats", "Expand reach"],
            "good": ["Optimize underperforming content", "Increase engagement tactics", "Test new times"],
            "fair": ["Review content strategy", "Analyze competitor performance", "Increase frequency"],
            "needs_attention": ["Audit content quality", "Revise brand voice", "Boost engagement efforts"],
            "critical": ["Emergency strategy review", "Pause and reassess", "Stakeholder meeting"]
        }
        return actions.get(self.value, ["Review performance"])


class TeamRole(Enum):
    """Team roles in social media operations."""
    ACCOUNT_DIRECTOR = "account_director"
    ACCOUNT_MANAGER = "account_manager"
    CONTENT_MANAGER = "content_manager"
    CONTENT_CREATOR = "content_creator"
    SOCIAL_MANAGER = "social_manager"
    COMMUNITY_MANAGER = "community_manager"
    DESIGNER = "designer"
    VIDEO_EDITOR = "video_editor"
    ANALYST = "analyst"
    CLIENT = "client"

    @property
    def permissions(self) -> list:
        """Returns role permissions."""
        perms = {
            "account_director": ["all"],
            "account_manager": ["approve", "schedule", "report", "assign"],
            "content_manager": ["create", "edit", "internal_approve", "schedule"],
            "content_creator": ["create", "edit", "submit"],
            "social_manager": ["schedule", "publish", "engage"],
            "community_manager": ["engage", "respond", "escalate"],
            "designer": ["create_assets", "edit_assets"],
            "video_editor": ["create_video", "edit_video"],
            "analyst": ["view", "report"],
            "client": ["approve", "view", "comment"]
        }
        return perms.get(self.value, ["view"])


# ════════════════════════════════════════════════════════════════════════════════
# DATA CLASSES - Core System Objects
# ════════════════════════════════════════════════════════════════════════════════

@dataclass
class BrandProfile:
    """Complete brand profile for social media management."""
    brand_id: str
    brand_name: str
    industry: str
    website: str = ""
    primary_goal: str = "brand_awareness"

    # Voice & Style
    voice_tone: str = "professional"
    voice_traits: list = field(default_factory=list)
    voice_avoid: list = field(default_factory=list)

    # Visual Identity
    primary_colors: list = field(default_factory=list)
    secondary_colors: list = field(default_factory=list)
    fonts: list = field(default_factory=list)
    logo_url: str = ""

    # Audience
    target_demographics: dict = field(default_factory=dict)
    personas: list = field(default_factory=list)

    # Content Strategy
    content_pillars: list = field(default_factory=list)
    hashtag_sets: dict = field(default_factory=dict)
    posting_frequency: dict = field(default_factory=dict)

    # Platforms
    active_platforms: list = field(default_factory=list)
    platform_handles: dict = field(default_factory=dict)

    # Team
    team_members: list = field(default_factory=list)
    approval_workflow: list = field(default_factory=list)

    # Status
    health_score: int = 75
    created_date: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))

    def __post_init__(self):
        if not self.voice_traits:
            self.voice_traits = ["professional", "approachable", "knowledgeable"]
        if not self.voice_avoid:
            self.voice_avoid = ["slang", "controversial topics"]
        if not self.content_pillars:
            self.content_pillars = [ContentPillar.EDUCATIONAL, ContentPillar.PROMOTIONAL]
        if not self.active_platforms:
            self.active_platforms = [Platform.INSTAGRAM_FEED, Platform.LINKEDIN]

    @property
    def health_status(self) -> BrandHealthScore:
        """Returns health status based on score."""
        for status in BrandHealthScore:
            low, high = status.score_range
            if low <= self.health_score <= high:
                return status
        return BrandHealthScore.FAIR

    @property
    def platform_count(self) -> int:
        return len(self.active_platforms)


@dataclass
class ContentItem:
    """Individual content piece in the system."""
    content_id: str
    brand_id: str
    title: str
    caption: str = ""
    platform: Platform = Platform.INSTAGRAM_FEED
    format: ContentFormat = ContentFormat.SINGLE_IMAGE
    pillar: ContentPillar = ContentPillar.EDUCATIONAL

    # Media
    media_urls: list = field(default_factory=list)
    thumbnail_url: str = ""

    # Metadata
    hashtags: list = field(default_factory=list)
    mentions: list = field(default_factory=list)
    link: str = ""
    utm_params: dict = field(default_factory=dict)

    # Workflow
    status: ApprovalStatus = ApprovalStatus.DRAFT
    assigned_to: str = ""
    created_by: str = ""
    created_date: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))

    # Scheduling
    scheduled_date: str = ""
    scheduled_time: str = ""
    published_date: str = ""

    # Performance
    reach: int = 0
    impressions: int = 0
    engagements: int = 0
    engagement_rate: float = 0.0
    saves: int = 0
    shares: int = 0
    clicks: int = 0

    # Revisions
    revision_count: int = 0
    revision_notes: list = field(default_factory=list)

    def __post_init__(self):
        if not self.media_urls:
            self.media_urls = []

    @property
    def is_scheduled(self) -> bool:
        return self.status == ApprovalStatus.SCHEDULED and bool(self.scheduled_date)

    @property
    def is_overdue(self) -> bool:
        if not self.scheduled_date:
            return False
        scheduled = datetime.strptime(self.scheduled_date, "%Y-%m-%d")
        return scheduled < datetime.now() and self.status != ApprovalStatus.PUBLISHED

    @property
    def caption_length(self) -> int:
        return len(self.caption)

    @property
    def within_character_limit(self) -> bool:
        return self.caption_length <= self.platform.character_limit

    @property
    def hashtag_count(self) -> int:
        return len(self.hashtags)

    @property
    def performance_score(self) -> int:
        """Calculate content performance score 0-100."""
        if self.impressions == 0:
            return 0
        score = 0
        # Engagement rate contribution (max 40 points)
        if self.engagement_rate >= 5:
            score += 40
        elif self.engagement_rate >= 3:
            score += 30
        elif self.engagement_rate >= 1:
            score += 20
        else:
            score += 10

        # Saves/shares contribution (max 30 points)
        save_share_rate = (self.saves + self.shares) / max(self.impressions, 1) * 100
        if save_share_rate >= 2:
            score += 30
        elif save_share_rate >= 1:
            score += 20
        else:
            score += 10

        # Reach contribution (max 30 points)
        if self.reach >= 10000:
            score += 30
        elif self.reach >= 5000:
            score += 20
        elif self.reach >= 1000:
            score += 15
        else:
            score += 10

        return min(score, 100)


@dataclass
class EngagementItem:
    """Individual engagement/interaction to process."""
    engagement_id: str
    brand_id: str
    platform: Platform
    interaction_type: str  # comment, dm, mention, reply
    content: str
    author: str
    author_followers: int = 0

    # Classification
    sentiment: Sentiment = Sentiment.NEUTRAL
    priority: Priority = Priority.P3_STANDARD
    requires_response: bool = True

    # Workflow
    assigned_to: str = ""
    response: str = ""
    responded: bool = False
    escalated: bool = False
    escalation_reason: str = ""

    # Timestamps
    received_date: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))
    response_date: str = ""

    @property
    def response_time_minutes(self) -> int:
        """Calculate response time in minutes."""
        if not self.response_date:
            return -1
        received = datetime.strptime(self.received_date, "%Y-%m-%d %H:%M")
        responded = datetime.strptime(self.response_date, "%Y-%m-%d %H:%M")
        delta = responded - received
        return int(delta.total_seconds() / 60)

    @property
    def within_sla(self) -> bool:
        """Check if response was within SLA."""
        if not self.responded:
            return False
        return self.response_time_minutes <= self.priority.response_time_minutes

    @property
    def is_influencer(self) -> bool:
        """Check if author is an influencer based on followers."""
        return self.author_followers >= 10000


@dataclass
class CalendarSlot:
    """Individual calendar slot for content scheduling."""
    slot_id: str
    brand_id: str
    date: str
    time: str
    platform: Platform
    pillar: ContentPillar = ContentPillar.EDUCATIONAL
    content_id: str = ""
    status: str = "empty"  # empty, planned, filled, published

    @property
    def is_filled(self) -> bool:
        return bool(self.content_id) and self.status in ["filled", "published"]

    @property
    def datetime_str(self) -> str:
        return f"{self.date} {self.time}"


@dataclass
class PerformanceMetrics:
    """Performance metrics for a brand/period."""
    brand_id: str
    period: str  # "2024-01", "2024-Q1", "2024"
    period_type: str = "monthly"  # daily, weekly, monthly, quarterly, yearly

    # Reach & Awareness
    total_reach: int = 0
    total_impressions: int = 0
    follower_count: int = 0
    follower_growth: int = 0
    follower_growth_rate: float = 0.0

    # Engagement
    total_engagements: int = 0
    engagement_rate: float = 0.0
    total_comments: int = 0
    total_likes: int = 0
    total_saves: int = 0
    total_shares: int = 0

    # Traffic & Conversion
    total_clicks: int = 0
    click_through_rate: float = 0.0
    conversions: int = 0
    conversion_rate: float = 0.0

    # Content
    posts_published: int = 0
    top_performing_posts: list = field(default_factory=list)
    worst_performing_posts: list = field(default_factory=list)

    # Comparison
    vs_previous_period: dict = field(default_factory=dict)
    vs_goal: dict = field(default_factory=dict)

    def __post_init__(self):
        if self.total_impressions > 0 and self.total_engagements > 0:
            self.engagement_rate = (self.total_engagements / self.total_impressions) * 100
        if self.total_impressions > 0 and self.total_clicks > 0:
            self.click_through_rate = (self.total_clicks / self.total_impressions) * 100

    @property
    def health_score(self) -> int:
        """Calculate health score based on metrics."""
        score = 50  # Base score

        # Engagement rate contribution
        if self.engagement_rate >= 5:
            score += 20
        elif self.engagement_rate >= 3:
            score += 15
        elif self.engagement_rate >= 1:
            score += 10

        # Follower growth contribution
        if self.follower_growth_rate >= 5:
            score += 15
        elif self.follower_growth_rate >= 2:
            score += 10
        elif self.follower_growth_rate >= 0:
            score += 5

        # Posting consistency contribution
        expected_posts = 20 if self.period_type == "monthly" else 5
        post_ratio = min(self.posts_published / expected_posts, 1)
        score += int(post_ratio * 15)

        return min(score, 100)


@dataclass
class ApprovalWorkflow:
    """Approval workflow configuration for a brand."""
    brand_id: str
    workflow_name: str = "standard"
    stages: list = field(default_factory=list)
    auto_advance: bool = False
    notifications_enabled: bool = True

    def __post_init__(self):
        if not self.stages:
            self.stages = [
                {"stage": "draft", "owner": "content_creator", "sla_hours": 0},
                {"stage": "internal_review", "owner": "content_manager", "sla_hours": 24},
                {"stage": "client_review", "owner": "client", "sla_hours": 48},
                {"stage": "final_approval", "owner": "account_manager", "sla_hours": 12},
                {"stage": "scheduling", "owner": "social_manager", "sla_hours": 24}
            ]


@dataclass
class AgencyDashboard:
    """Agency-level dashboard aggregating all brands."""
    agency_id: str
    agency_name: str
    brands: list = field(default_factory=list)
    team_size: int = 0

    # Aggregate metrics
    total_scheduled_posts: int = 0
    total_pending_approvals: int = 0
    total_unread_messages: int = 0

    # Today's tasks
    todays_tasks: list = field(default_factory=list)

    # Alerts
    overdue_items: list = field(default_factory=list)
    urgent_items: list = field(default_factory=list)

    # System status
    system_status: str = "operational"

    @property
    def brand_count(self) -> int:
        return len(self.brands)

    @property
    def overall_health(self) -> int:
        """Calculate average health across all brands."""
        if not self.brands:
            return 0
        total_health = sum(b.health_score for b in self.brands if hasattr(b, 'health_score'))
        return total_health // len(self.brands) if self.brands else 0


# ════════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - Core System Functionality
# ════════════════════════════════════════════════════════════════════════════════

class BrandOrchestratorEngine:
    """Manages multiple brands and their configurations."""

    def __init__(self):
        self.brands: dict = {}

    def register_brand(self, brand: BrandProfile) -> bool:
        """Register a new brand in the system."""
        self.brands[brand.brand_id] = brand
        return True

    def get_brand(self, brand_id: str) -> Optional[BrandProfile]:
        """Retrieve brand by ID."""
        return self.brands.get(brand_id)

    def list_brands(self) -> list:
        """List all registered brands."""
        return list(self.brands.values())

    def update_brand_health(self, brand_id: str, metrics: PerformanceMetrics) -> int:
        """Update brand health score based on metrics."""
        brand = self.get_brand(brand_id)
        if brand:
            brand.health_score = metrics.health_score
        return brand.health_score if brand else 0

    def get_brand_summary(self, brand_id: str) -> dict:
        """Get brand summary for dashboard."""
        brand = self.get_brand(brand_id)
        if not brand:
            return {}

        return {
            "name": brand.brand_name,
            "health_score": brand.health_score,
            "health_status": brand.health_status.value,
            "platforms": brand.platform_count,
            "pillars": len(brand.content_pillars),
            "goal": brand.primary_goal
        }


class ContentPipelineEngine:
    """Manages content creation and workflow pipeline."""

    def __init__(self):
        self.content_items: dict = {}
        self.workflows: dict = {}

    def create_content(self, content: ContentItem) -> str:
        """Create new content item."""
        self.content_items[content.content_id] = content
        return content.content_id

    def get_content(self, content_id: str) -> Optional[ContentItem]:
        """Retrieve content by ID."""
        return self.content_items.get(content_id)

    def update_status(self, content_id: str, new_status: ApprovalStatus, notes: str = "") -> bool:
        """Update content approval status."""
        content = self.get_content(content_id)
        if content:
            content.status = new_status
            if notes:
                content.revision_notes.append({
                    "status": new_status.value,
                    "notes": notes,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M")
                })
            return True
        return False

    def get_queue_by_status(self, brand_id: str, status: ApprovalStatus) -> list:
        """Get all content items with a specific status."""
        return [
            c for c in self.content_items.values()
            if c.brand_id == brand_id and c.status == status
        ]

    def get_pending_approvals(self, brand_id: str) -> list:
        """Get all pending approval items."""
        pending_statuses = [
            ApprovalStatus.PENDING_INTERNAL,
            ApprovalStatus.PENDING_CLIENT,
            ApprovalStatus.REVISION_REQUESTED
        ]
        return [
            c for c in self.content_items.values()
            if c.brand_id == brand_id and c.status in pending_statuses
        ]

    def get_scheduled_content(self, brand_id: str) -> list:
        """Get all scheduled content."""
        return [
            c for c in self.content_items.values()
            if c.brand_id == brand_id and c.is_scheduled
        ]

    def validate_content(self, content: ContentItem) -> dict:
        """Validate content against platform requirements."""
        issues = []

        if not content.within_character_limit:
            issues.append(f"Caption exceeds {content.platform.character_limit} character limit")

        min_h, max_h = content.platform.optimal_hashtags
        if content.hashtag_count < min_h:
            issues.append(f"Add at least {min_h} hashtags for {content.platform.value}")
        elif content.hashtag_count > max_h:
            issues.append(f"Reduce hashtags to max {max_h} for {content.platform.value}")

        if not content.media_urls:
            issues.append("No media attached")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "score": 100 - (len(issues) * 20)
        }


class EngagementEngine:
    """Manages community engagement and response workflows."""

    def __init__(self):
        self.engagement_queue: list = []
        self.response_templates: dict = {}

    def add_engagement(self, engagement: EngagementItem):
        """Add engagement item to queue."""
        self.engagement_queue.append(engagement)

    def get_queue(self, brand_id: str, priority: Optional[Priority] = None) -> list:
        """Get engagement queue, optionally filtered by priority."""
        queue = [e for e in self.engagement_queue if e.brand_id == brand_id]
        if priority:
            queue = [e for e in queue if e.priority == priority]
        return sorted(queue, key=lambda x: x.priority.response_time_minutes)

    def get_pending_responses(self, brand_id: str) -> list:
        """Get all items requiring response."""
        return [
            e for e in self.engagement_queue
            if e.brand_id == brand_id and e.requires_response and not e.responded
        ]

    def calculate_sentiment_distribution(self, brand_id: str) -> dict:
        """Calculate sentiment distribution for a brand."""
        items = [e for e in self.engagement_queue if e.brand_id == brand_id]
        if not items:
            return {"positive": 0, "neutral": 0, "negative": 0, "critical": 0}

        distribution = {}
        for sentiment in Sentiment:
            count = len([e for e in items if e.sentiment == sentiment])
            distribution[sentiment.value] = round(count / len(items) * 100, 1)

        return distribution

    def get_sla_compliance(self, brand_id: str) -> float:
        """Calculate SLA compliance rate."""
        items = [e for e in self.engagement_queue if e.brand_id == brand_id and e.responded]
        if not items:
            return 100.0

        within_sla = len([e for e in items if e.within_sla])
        return round(within_sla / len(items) * 100, 1)

    def identify_escalations(self, brand_id: str) -> list:
        """Identify items requiring escalation."""
        return [
            e for e in self.engagement_queue
            if e.brand_id == brand_id and (
                e.priority == Priority.P1_CRITICAL or
                e.sentiment == Sentiment.CRITICAL or
                e.is_influencer
            )
        ]


class AnalyticsEngine:
    """Manages performance tracking and reporting."""

    def __init__(self):
        self.metrics_history: dict = {}

    def record_metrics(self, metrics: PerformanceMetrics):
        """Record metrics for a period."""
        key = f"{metrics.brand_id}_{metrics.period}"
        self.metrics_history[key] = metrics

    def get_metrics(self, brand_id: str, period: str) -> Optional[PerformanceMetrics]:
        """Retrieve metrics for a brand/period."""
        return self.metrics_history.get(f"{brand_id}_{period}")

    def calculate_growth(self, brand_id: str, current_period: str, previous_period: str) -> dict:
        """Calculate growth between two periods."""
        current = self.get_metrics(brand_id, current_period)
        previous = self.get_metrics(brand_id, previous_period)

        if not current or not previous:
            return {}

        def growth_rate(current_val, previous_val):
            if previous_val == 0:
                return 0
            return round((current_val - previous_val) / previous_val * 100, 1)

        return {
            "reach_growth": growth_rate(current.total_reach, previous.total_reach),
            "engagement_growth": growth_rate(current.total_engagements, previous.total_engagements),
            "follower_growth": growth_rate(current.follower_count, previous.follower_count),
            "click_growth": growth_rate(current.total_clicks, previous.total_clicks)
        }

    def get_top_content(self, brand_id: str, period: str, count: int = 5) -> list:
        """Get top performing content for a period."""
        metrics = self.get_metrics(brand_id, period)
        if not metrics:
            return []
        return metrics.top_performing_posts[:count]

    def generate_report_data(self, brand_id: str, period: str) -> dict:
        """Generate comprehensive report data."""
        metrics = self.get_metrics(brand_id, period)
        if not metrics:
            return {}

        return {
            "period": period,
            "reach": metrics.total_reach,
            "impressions": metrics.total_impressions,
            "engagement_rate": metrics.engagement_rate,
            "follower_growth": metrics.follower_growth,
            "posts_published": metrics.posts_published,
            "health_score": metrics.health_score,
            "top_content": metrics.top_performing_posts[:3]
        }


class CalendarEngine:
    """Manages content calendar and scheduling."""

    def __init__(self):
        self.slots: dict = {}

    def create_calendar(self, brand_id: str, month: str, platforms: list) -> list:
        """Create calendar slots for a month."""
        slots = []
        # Generate slots for each platform's recommended schedule
        for platform in platforms:
            for day in platform.best_days:
                for time in platform.best_posting_times:
                    slot = CalendarSlot(
                        slot_id=f"{brand_id}_{month}_{platform.value}_{day}_{time}",
                        brand_id=brand_id,
                        date=f"{month}-01",  # Would calculate actual dates
                        time=time,
                        platform=platform
                    )
                    slots.append(slot)

        return slots

    def assign_content_to_slot(self, slot_id: str, content_id: str) -> bool:
        """Assign content to a calendar slot."""
        if slot_id in self.slots:
            self.slots[slot_id].content_id = content_id
            self.slots[slot_id].status = "filled"
            return True
        return False

    def get_calendar_fill_rate(self, brand_id: str, month: str) -> float:
        """Calculate calendar fill rate."""
        slots = [s for s in self.slots.values()
                 if s.brand_id == brand_id and month in s.date]
        if not slots:
            return 0.0

        filled = len([s for s in slots if s.is_filled])
        return round(filled / len(slots) * 100, 1)

    def identify_gaps(self, brand_id: str, month: str) -> list:
        """Identify unfilled calendar slots."""
        return [
            s for s in self.slots.values()
            if s.brand_id == brand_id and month in s.date and not s.is_filled
        ]


class SocialMediaMasterOS:
    """Main orchestrator for the Social Media Operating System."""

    def __init__(self, agency_id: str, agency_name: str):
        self.agency_id = agency_id
        self.agency_name = agency_name

        # Initialize sub-engines
        self.brand_engine = BrandOrchestratorEngine()
        self.content_engine = ContentPipelineEngine()
        self.engagement_engine = EngagementEngine()
        self.analytics_engine = AnalyticsEngine()
        self.calendar_engine = CalendarEngine()

    def onboard_brand(self, brand: BrandProfile) -> dict:
        """Onboard a new brand to the system."""
        self.brand_engine.register_brand(brand)

        return {
            "success": True,
            "brand_id": brand.brand_id,
            "platforms_configured": brand.platform_count,
            "pillars_set": len(brand.content_pillars),
            "next_steps": [
                "Configure approval workflow",
                "Set up hashtag sets",
                "Create initial content calendar",
                "Assign team members"
            ]
        }

    def get_dashboard(self) -> AgencyDashboard:
        """Generate agency dashboard."""
        brands = self.brand_engine.list_brands()

        total_scheduled = sum(
            len(self.content_engine.get_scheduled_content(b.brand_id))
            for b in brands
        )

        total_pending = sum(
            len(self.content_engine.get_pending_approvals(b.brand_id))
            for b in brands
        )

        total_unread = sum(
            len(self.engagement_engine.get_pending_responses(b.brand_id))
            for b in brands
        )

        return AgencyDashboard(
            agency_id=self.agency_id,
            agency_name=self.agency_name,
            brands=brands,
            total_scheduled_posts=total_scheduled,
            total_pending_approvals=total_pending,
            total_unread_messages=total_unread,
            system_status="operational"
        )

    def get_brand_status(self, brand_id: str) -> dict:
        """Get comprehensive brand status."""
        brand = self.brand_engine.get_brand(brand_id)
        if not brand:
            return {"error": "Brand not found"}

        return {
            "brand": self.brand_engine.get_brand_summary(brand_id),
            "scheduled_posts": len(self.content_engine.get_scheduled_content(brand_id)),
            "pending_approvals": len(self.content_engine.get_pending_approvals(brand_id)),
            "pending_responses": len(self.engagement_engine.get_pending_responses(brand_id)),
            "sla_compliance": self.engagement_engine.get_sla_compliance(brand_id),
            "sentiment": self.engagement_engine.calculate_sentiment_distribution(brand_id)
        }

    def create_content_brief(
        self,
        brand_id: str,
        pillar: ContentPillar,
        platform: Platform,
        topic: str
    ) -> dict:
        """Create a content brief for the team."""
        brand = self.brand_engine.get_brand(brand_id)
        if not brand:
            return {"error": "Brand not found"}

        return {
            "brand": brand.brand_name,
            "pillar": pillar.value,
            "pillar_description": pillar.description,
            "platform": platform.value,
            "topic": topic,
            "voice_tone": brand.voice_tone,
            "voice_traits": brand.voice_traits,
            "character_limit": platform.character_limit,
            "optimal_hashtags": platform.optimal_hashtags,
            "best_formats": pillar.best_formats,
            "image_specs": platform.image_specs,
            "recommended_posting_times": platform.best_posting_times
        }


# ════════════════════════════════════════════════════════════════════════════════
# REPORTER - ASCII Dashboard Generation
# ════════════════════════════════════════════════════════════════════════════════

class SocialMediaReporter:
    """Generate ASCII dashboard reports."""

    def __init__(self, os: SocialMediaMasterOS):
        self.os = os

    def _progress_bar(self, value: int, max_val: int = 100, width: int = 10) -> str:
        """Generate ASCII progress bar."""
        filled = int((value / max_val) * width)
        return f"{'█' * filled}{'░' * (width - filled)}"

    def _status_indicator(self, status: str) -> str:
        """Generate status indicator."""
        indicators = {
            "excellent": "●",
            "good": "●",
            "fair": "◐",
            "needs_attention": "◑",
            "critical": "○",
            "operational": "●",
            "degraded": "◐",
            "down": "○"
        }
        return indicators.get(status.lower(), "●")

    def generate_dashboard(self) -> str:
        """Generate main agency dashboard."""
        dashboard = self.os.get_dashboard()

        report = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                      SOCIAL MEDIA COMMAND CENTER                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Agency: {dashboard.agency_name:<67} ║
║  Brands: {dashboard.brand_count:<67} ║
║  Generated: {datetime.now().strftime("%Y-%m-%d %H:%M"):<63} ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│                           COMMAND CENTER                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Active Brands:      {dashboard.brand_count:<53} │
│  Scheduled Posts:    {dashboard.total_scheduled_posts:<53} │
│  Pending Approvals:  {dashboard.total_pending_approvals:<53} │
│  Unread Messages:    {dashboard.total_unread_messages:<53} │
│                                                                              │
│  System Health: [{self._progress_bar(dashboard.overall_health)}] {dashboard.overall_health}/100              │
│  Status: [{self._status_indicator(dashboard.system_status)}] {dashboard.system_status.title():<60} │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                            BRAND STATUS                                      │
├──────────────────────────────────────────────────────────────────────────────┤
"""

        for brand in dashboard.brands:
            status = self.os.get_brand_status(brand.brand_id)
            health_bar = self._progress_bar(brand.health_score)
            health_indicator = self._status_indicator(brand.health_status.value)

            report += f"""│                                                                              │
│  {brand.brand_name:<74} │
│  ├── Scheduled: {status['scheduled_posts']:<20} Pending: {status['pending_approvals']:<20}   │
│  ├── Messages: {status['pending_responses']:<21} SLA: {status['sla_compliance']:.1f}%                     │
│  └── Health: [{health_bar}] {brand.health_score}/100 [{health_indicator}]                    │
"""

        report += f"""│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                          WEEKLY WORKFLOW                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  Day        │ Activity              │ Status                          │  │
│  ├─────────────┼───────────────────────┼─────────────────────────────────┤  │
│  │  Monday     │ Ideation              │ Plan weekly themes              │  │
│  │  Tuesday    │ Creation              │ Draft content                   │  │
│  │  Wednesday  │ Design                │ Create visuals                  │  │
│  │  Thursday   │ Approval              │ Client reviews                  │  │
│  │  Friday     │ Schedule              │ Queue for publishing            │  │
│  │  Daily      │ Engage                │ Community management            │  │
│  └─────────────┴───────────────────────┴─────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                          QUICK ACTIONS                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  /social-ideate [brand]     → Generate content ideas                         │
│  /social-create [brand]     → Create new content                             │
│  /social-calendar [brand]   → View/edit content calendar                     │
│  /social-approve [brand]    → Manage approval queue                          │
│  /social-publish [brand]    → Schedule content                               │
│  /social-engage [brand]     → Community management                           │
│  /social-report [brand]     → Generate performance report                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                    System Status: [{self._status_indicator(dashboard.system_status)}] All Systems Operational
═══════════════════════════════════════════════════════════════════════════════
"""

        return report

    def generate_brand_report(self, brand_id: str) -> str:
        """Generate detailed brand report."""
        brand = self.os.brand_engine.get_brand(brand_id)
        if not brand:
            return "Brand not found"

        status = self.os.get_brand_status(brand_id)

        report = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                          BRAND STATUS REPORT                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Brand: {brand.brand_name:<68} ║
║  Industry: {brand.industry:<65} ║
║  Generated: {datetime.now().strftime("%Y-%m-%d %H:%M"):<63} ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│                          BRAND PROFILE                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Primary Goal: {brand.primary_goal:<60} │
│  Voice Tone: {brand.voice_tone:<62} │
│  Health Score: [{self._progress_bar(brand.health_score)}] {brand.health_score}/100                     │
│  Status: [{self._status_indicator(brand.health_status.value)}] {brand.health_status.value.replace('_', ' ').title():<57} │
│                                                                              │
│  VOICE TRAITS                                                                │
"""

        for trait in brand.voice_traits[:4]:
            report += f"│    ✓ {trait:<70} │\n"

        report += f"""│                                                                              │
│  ACTIVE PLATFORMS ({brand.platform_count})                                                 │
"""

        for platform in brand.active_platforms[:5]:
            handle = brand.platform_handles.get(platform.value, "@handle")
            report += f"│    • {platform.value:<25} {handle:<40} │\n"

        report += f"""│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         CONTENT PILLARS                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
"""

        for pillar in brand.content_pillars[:5]:
            report += f"│  {pillar.value.upper():<20} ({pillar.recommended_percentage}%)                                       │\n"
            report += f"│    {pillar.description[:60]:<65} │\n"
            report += f"│                                                                              │\n"

        report += f"""└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         CURRENT STATUS                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Scheduled Posts:     {status['scheduled_posts']:<53} │
│  Pending Approvals:   {status['pending_approvals']:<53} │
│  Pending Responses:   {status['pending_responses']:<53} │
│  SLA Compliance:      {status['sla_compliance']:.1f}%                                                │
│                                                                              │
│  SENTIMENT DISTRIBUTION                                                      │
│  ├── Positive:  [{self._progress_bar(int(status['sentiment'].get('positive', 0)))}] {status['sentiment'].get('positive', 0):.1f}%                   │
│  ├── Neutral:   [{self._progress_bar(int(status['sentiment'].get('neutral', 0)))}] {status['sentiment'].get('neutral', 0):.1f}%                   │
│  ├── Negative:  [{self._progress_bar(int(status['sentiment'].get('negative', 0)))}] {status['sentiment'].get('negative', 0):.1f}%                   │
│  └── Critical:  [{self._progress_bar(int(status['sentiment'].get('critical', 0)))}] {status['sentiment'].get('critical', 0):.1f}%                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                              END OF REPORT
                      Generated by SOCIALMEDIA.OS.EXE
═══════════════════════════════════════════════════════════════════════════════
"""

        return report


# ════════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════════

def main():
    """Main CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="SOCIALMEDIA.OS.EXE - Multi-Brand Social Media Operating System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  social-media dashboard                    # Agency dashboard
  social-media status brand_123             # Brand status
  social-media onboard --name "Brand" --industry "Tech"
  social-media week brand_123               # Plan weekly content
  social-media audit brand_123              # Account audit
  social-media demo                         # Demo mode

Sub-Commands:
  /social-ideate    - Content brainstorming
  /social-create    - Content production
  /social-calendar  - Content planning
  /social-approve   - Approval workflows
  /social-publish   - Scheduling
  /social-engage    - Community management
  /social-report    - Analytics
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Dashboard command
    dash_parser = subparsers.add_parser("dashboard", help="Agency dashboard")
    dash_parser.add_argument("--agency", "-a", default="Agency", help="Agency name")

    # Status command
    status_parser = subparsers.add_parser("status", help="Brand status")
    status_parser.add_argument("brand_id", help="Brand ID")

    # Onboard command
    onboard_parser = subparsers.add_parser("onboard", help="Onboard new brand")
    onboard_parser.add_argument("--name", "-n", required=True, help="Brand name")
    onboard_parser.add_argument("--industry", "-i", required=True, help="Industry")
    onboard_parser.add_argument("--website", "-w", default="", help="Website URL")
    onboard_parser.add_argument("--goal", "-g", default="brand_awareness", help="Primary goal")

    # Week command
    week_parser = subparsers.add_parser("week", help="Weekly planning")
    week_parser.add_argument("brand_id", help="Brand ID")

    # Audit command
    audit_parser = subparsers.add_parser("audit", help="Account audit")
    audit_parser.add_argument("brand_id", help="Brand ID")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Run demo")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Initialize OS
    os = SocialMediaMasterOS("agency_001", "Demo Agency")
    reporter = SocialMediaReporter(os)

    if args.command == "dashboard":
        print(reporter.generate_dashboard())

    elif args.command == "status":
        print(reporter.generate_brand_report(args.brand_id))

    elif args.command == "onboard":
        brand = BrandProfile(
            brand_id=f"brand_{args.name.lower().replace(' ', '_')}",
            brand_name=args.name,
            industry=args.industry,
            website=args.website,
            primary_goal=args.goal
        )
        result = os.onboard_brand(brand)
        print(f"\n✓ Brand '{args.name}' onboarded successfully!")
        print(f"  Brand ID: {result['brand_id']}")
        print(f"  Platforms: {result['platforms_configured']}")
        print(f"\n  Next Steps:")
        for step in result['next_steps']:
            print(f"    → {step}")

    elif args.command == "demo":
        # Create demo brand
        demo_brand = BrandProfile(
            brand_id="demo_brand_001",
            brand_name="Demo Fashion Brand",
            industry="Fashion & Apparel",
            website="https://demobrand.com",
            primary_goal="brand_awareness",
            voice_tone="friendly and aspirational",
            voice_traits=["approachable", "trend-aware", "authentic", "empowering"],
            active_platforms=[
                Platform.INSTAGRAM_FEED,
                Platform.INSTAGRAM_REELS,
                Platform.TIKTOK,
                Platform.PINTEREST
            ],
            platform_handles={
                "instagram_feed": "@demobrand",
                "instagram_reels": "@demobrand",
                "tiktok": "@demobrandofficial",
                "pinterest": "demobrand"
            },
            content_pillars=[
                ContentPillar.EDUCATIONAL,
                ContentPillar.ENTERTAINING,
                ContentPillar.PROMOTIONAL,
                ContentPillar.USER_GENERATED
            ],
            health_score=82
        )

        os.onboard_brand(demo_brand)

        # Generate dashboard
        print(reporter.generate_dashboard())
        print("\n" + "=" * 80 + "\n")
        print(reporter.generate_brand_report("demo_brand_001"))


if __name__ == "__main__":
    main()
```

---

## SUB-COMMANDS

| Command | Purpose |
|---------|---------|
| /social-onboard | New brand setup |
| /social-calendar | Content planning |
| /social-ideate | Brainstorming |
| /social-create | Content production |
| /social-approve | Review workflow |
| /social-publish | Scheduling |
| /social-engage | Community mgmt |
| /social-report | Analytics |

## QUICK COMMANDS

- `/social-media-master` - Full dashboard
- `/social-status [brand]` - Brand status
- `/social-week [brand]` - Plan weekly content
- `/social-audit [brand]` - Account audit
- `/social-metrics [brand]` - Performance overview

$ARGUMENTS
