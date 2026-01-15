# SOCIAL.PUBLISH.EXE - Scheduling & Publishing Specialist

You are SOCIAL.PUBLISH.EXE — the multi-platform social media scheduling and publishing specialist that efficiently schedules content across brands and platforms with optimal timing, proper formatting, and verified delivery.

MISSION
Schedule content. Optimize timing. Ensure delivery.

---

## CAPABILITIES

### ScheduleEngine.MOD
- Optimal time selection
- Queue management
- Batch scheduling
- Conflict detection
- Timezone handling

### PlatformAdapter.MOD
- Format validation
- Spec compliance
- Feature utilization
- Native optimization
- Cross-posting logic

### DeliveryManager.MOD
- Post verification
- Error handling
- Retry logic
- Manual post alerts
- Status tracking

### AnalyticsLinker.MOD
- UTM generation
- Link tracking
- Attribution setup
- Performance tagging
- Campaign coding

---

## WORKFLOW

### Phase 1: PREPARE
1. Verify content approved
2. Select target accounts
3. Optimize media formats
4. Finalize captions
5. Generate tracking links

### Phase 2: SCHEDULE
1. Select optimal times
2. Set post to queue
3. Configure first comments
4. Add tags and mentions
5. Set notifications

### Phase 3: VERIFY
1. Preview scheduled posts
2. Check formatting
3. Confirm timing
4. Review media quality
5. Test links

### Phase 4: MONITOR
1. Confirm publication
2. Track initial metrics
3. Handle any failures
4. Log manual posts
5. Report completion

---

```python
"""
SOCIAL.PUBLISH.EXE - Scheduling & Publishing Specialist
Multi-platform social media scheduling with optimal timing and verified delivery.
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time, timedelta
from abc import ABC, abstractmethod
import re
import json
import hashlib


# ============================================================================
# ENUMS - Scheduling & Publishing Domain
# ============================================================================

class Platform(Enum):
    """Social media platforms with scheduling specifications."""
    INSTAGRAM = "instagram"
    INSTAGRAM_STORIES = "instagram_stories"
    INSTAGRAM_REELS = "instagram_reels"
    TIKTOK = "tiktok"
    LINKEDIN = "linkedin"
    LINKEDIN_NEWSLETTER = "linkedin_newsletter"
    TWITTER = "twitter"
    FACEBOOK = "facebook"
    FACEBOOK_STORIES = "facebook_stories"
    YOUTUBE = "youtube"
    YOUTUBE_SHORTS = "youtube_shorts"
    PINTEREST = "pinterest"
    THREADS = "threads"

    @property
    def best_days(self) -> List[str]:
        """Best days for posting on this platform."""
        days_map = {
            "instagram": ["tuesday", "wednesday", "thursday", "friday"],
            "instagram_stories": ["monday", "tuesday", "wednesday", "thursday", "friday"],
            "instagram_reels": ["tuesday", "wednesday", "thursday"],
            "tiktok": ["tuesday", "wednesday", "thursday"],
            "linkedin": ["tuesday", "wednesday", "thursday"],
            "linkedin_newsletter": ["tuesday", "wednesday"],
            "twitter": ["wednesday", "thursday", "friday"],
            "facebook": ["wednesday", "thursday", "friday"],
            "facebook_stories": ["monday", "tuesday", "wednesday", "thursday", "friday"],
            "youtube": ["thursday", "friday", "saturday"],
            "youtube_shorts": ["friday", "saturday", "sunday"],
            "pinterest": ["saturday", "sunday"],
            "threads": ["tuesday", "wednesday", "thursday"]
        }
        return days_map.get(self.value, ["tuesday", "wednesday", "thursday"])

    @property
    def peak_times(self) -> List[str]:
        """Peak posting times for maximum engagement."""
        times_map = {
            "instagram": ["09:00", "12:00", "18:00"],
            "instagram_stories": ["08:00", "12:00", "17:00", "21:00"],
            "instagram_reels": ["09:00", "12:00", "19:00"],
            "tiktok": ["19:00", "21:00", "22:00"],
            "linkedin": ["08:00", "12:00", "17:00"],
            "linkedin_newsletter": ["10:00", "14:00"],
            "twitter": ["08:00", "12:00", "17:00"],
            "facebook": ["09:00", "13:00", "16:00"],
            "facebook_stories": ["09:00", "12:00", "19:00"],
            "youtube": ["14:00", "16:00", "18:00"],
            "youtube_shorts": ["12:00", "19:00", "21:00"],
            "pinterest": ["14:00", "20:00", "21:00"],
            "threads": ["09:00", "12:00", "18:00"]
        }
        return times_map.get(self.value, ["09:00", "12:00", "18:00"])

    @property
    def avoid_times(self) -> List[str]:
        """Times to avoid posting."""
        avoid_map = {
            "instagram": ["03:00-05:00"],
            "instagram_stories": ["02:00-06:00"],
            "instagram_reels": ["02:00-06:00"],
            "tiktok": ["05:00-07:00"],
            "linkedin": ["22:00-06:00", "weekends"],
            "linkedin_newsletter": ["22:00-08:00", "weekends"],
            "twitter": ["22:00-06:00", "weekends"],
            "facebook": ["23:00-06:00"],
            "facebook_stories": ["23:00-06:00"],
            "youtube": ["01:00-09:00"],
            "youtube_shorts": ["02:00-08:00"],
            "pinterest": ["01:00-08:00"],
            "threads": ["02:00-06:00"]
        }
        return avoid_map.get(self.value, ["02:00-06:00"])

    @property
    def min_lead_time_hours(self) -> int:
        """Minimum lead time for scheduling in hours."""
        lead_map = {
            "instagram": 1,
            "instagram_stories": 0,  # Can be posted immediately
            "instagram_reels": 2,
            "tiktok": 1,
            "linkedin": 1,
            "linkedin_newsletter": 24,
            "twitter": 0,
            "facebook": 1,
            "facebook_stories": 0,
            "youtube": 4,
            "youtube_shorts": 2,
            "pinterest": 2,
            "threads": 0
        }
        return lead_map.get(self.value, 1)

    @property
    def max_daily_posts(self) -> int:
        """Maximum recommended posts per day."""
        max_map = {
            "instagram": 2,
            "instagram_stories": 10,
            "instagram_reels": 3,
            "tiktok": 5,
            "linkedin": 2,
            "linkedin_newsletter": 1,
            "twitter": 10,
            "facebook": 3,
            "facebook_stories": 5,
            "youtube": 1,
            "youtube_shorts": 3,
            "pinterest": 15,
            "threads": 5
        }
        return max_map.get(self.value, 3)

    @property
    def supports_scheduling(self) -> bool:
        """Whether native scheduling is supported."""
        return self.value not in ["instagram_stories", "tiktok"]

    @property
    def requires_manual_post(self) -> bool:
        """Whether manual posting is required."""
        return self.value in ["instagram_stories", "tiktok", "instagram_reels"]


class PostStatus(Enum):
    """Status states for scheduled posts."""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    SCHEDULED = "scheduled"
    QUEUED = "queued"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"
    RETRY_PENDING = "retry_pending"
    CANCELLED = "cancelled"
    MANUAL_REQUIRED = "manual_required"

    @property
    def color_code(self) -> str:
        """Terminal color code for status display."""
        colors = {
            "draft": "gray",
            "pending_approval": "yellow",
            "approved": "blue",
            "scheduled": "cyan",
            "queued": "cyan",
            "publishing": "magenta",
            "published": "green",
            "failed": "red",
            "retry_pending": "orange",
            "cancelled": "gray",
            "manual_required": "yellow"
        }
        return colors.get(self.value, "white")

    @property
    def next_status(self) -> Optional[str]:
        """Next logical status in workflow."""
        next_map = {
            "draft": "pending_approval",
            "pending_approval": "approved",
            "approved": "scheduled",
            "scheduled": "queued",
            "queued": "publishing",
            "publishing": "published",
            "failed": "retry_pending",
            "retry_pending": "queued"
        }
        return next_map.get(self.value)

    @property
    def is_terminal(self) -> bool:
        """Whether this is a terminal state."""
        return self.value in ["published", "cancelled"]

    @property
    def requires_action(self) -> bool:
        """Whether this status requires user action."""
        return self.value in ["pending_approval", "failed", "manual_required"]

    @property
    def icon(self) -> str:
        """Status icon for display."""
        icons = {
            "draft": "○",
            "pending_approval": "◐",
            "approved": "◑",
            "scheduled": "◒",
            "queued": "◓",
            "publishing": "●",
            "published": "✓",
            "failed": "✗",
            "retry_pending": "↻",
            "cancelled": "⊘",
            "manual_required": "⚠"
        }
        return icons.get(self.value, "○")


class MediaType(Enum):
    """Media types with format specifications."""
    IMAGE_SQUARE = "image_square"
    IMAGE_PORTRAIT = "image_portrait"
    IMAGE_LANDSCAPE = "image_landscape"
    IMAGE_STORY = "image_story"
    VIDEO_FEED = "video_feed"
    VIDEO_STORY = "video_story"
    VIDEO_REEL = "video_reel"
    VIDEO_SHORT = "video_short"
    VIDEO_LONG = "video_long"
    CAROUSEL = "carousel"
    TEXT_ONLY = "text_only"
    LINK = "link"
    POLL = "poll"

    @property
    def dimensions(self) -> Dict[str, int]:
        """Recommended dimensions for this media type."""
        dims = {
            "image_square": {"width": 1080, "height": 1080},
            "image_portrait": {"width": 1080, "height": 1350},
            "image_landscape": {"width": 1200, "height": 627},
            "image_story": {"width": 1080, "height": 1920},
            "video_feed": {"width": 1080, "height": 1080},
            "video_story": {"width": 1080, "height": 1920},
            "video_reel": {"width": 1080, "height": 1920},
            "video_short": {"width": 1080, "height": 1920},
            "video_long": {"width": 1920, "height": 1080},
            "carousel": {"width": 1080, "height": 1080},
            "text_only": {"width": 0, "height": 0},
            "link": {"width": 1200, "height": 627},
            "poll": {"width": 0, "height": 0}
        }
        return dims.get(self.value, {"width": 1080, "height": 1080})

    @property
    def max_duration_seconds(self) -> Optional[int]:
        """Maximum video duration in seconds."""
        durations = {
            "video_feed": 3600,  # 60 minutes
            "video_story": 15,
            "video_reel": 90,
            "video_short": 60,
            "video_long": 43200  # 12 hours
        }
        return durations.get(self.value)

    @property
    def supported_platforms(self) -> List[str]:
        """Platforms that support this media type."""
        support_map = {
            "image_square": ["instagram", "facebook", "linkedin", "twitter", "threads"],
            "image_portrait": ["instagram", "pinterest", "threads"],
            "image_landscape": ["twitter", "linkedin", "facebook"],
            "image_story": ["instagram_stories", "facebook_stories"],
            "video_feed": ["instagram", "facebook", "linkedin", "twitter"],
            "video_story": ["instagram_stories", "facebook_stories"],
            "video_reel": ["instagram_reels", "facebook"],
            "video_short": ["tiktok", "youtube_shorts"],
            "video_long": ["youtube", "facebook"],
            "carousel": ["instagram", "linkedin", "facebook"],
            "text_only": ["twitter", "linkedin", "threads", "facebook"],
            "link": ["linkedin", "twitter", "facebook"],
            "poll": ["twitter", "linkedin"]
        }
        return support_map.get(self.value, [])

    @property
    def requires_media_file(self) -> bool:
        """Whether this type requires a media file upload."""
        return self.value not in ["text_only", "link", "poll"]


class UTMParameter(Enum):
    """UTM parameters for link tracking."""
    SOURCE = "utm_source"
    MEDIUM = "utm_medium"
    CAMPAIGN = "utm_campaign"
    TERM = "utm_term"
    CONTENT = "utm_content"

    @property
    def required(self) -> bool:
        """Whether this parameter is required for tracking."""
        return self.value in ["utm_source", "utm_medium", "utm_campaign"]

    @property
    def example_values(self) -> List[str]:
        """Example values for this parameter."""
        examples = {
            "utm_source": ["instagram", "facebook", "linkedin", "tiktok", "twitter"],
            "utm_medium": ["social", "paid_social", "organic", "influencer"],
            "utm_campaign": ["spring_sale", "product_launch", "brand_awareness"],
            "utm_term": ["audience_a", "interest_targeting", "lookalike"],
            "utm_content": ["carousel_1", "video_ad", "static_image"]
        }
        return examples.get(self.value, [])


class PublishingError(Enum):
    """Common publishing errors with resolution steps."""
    MEDIA_TOO_LARGE = "media_too_large"
    INVALID_FORMAT = "invalid_format"
    CAPTION_TOO_LONG = "caption_too_long"
    RATE_LIMITED = "rate_limited"
    AUTH_EXPIRED = "auth_expired"
    NETWORK_ERROR = "network_error"
    PLATFORM_ERROR = "platform_error"
    CONTENT_VIOLATION = "content_violation"
    SCHEDULING_CONFLICT = "scheduling_conflict"
    ACCOUNT_RESTRICTED = "account_restricted"

    @property
    def is_retryable(self) -> bool:
        """Whether this error can be retried automatically."""
        return self.value in ["rate_limited", "network_error", "platform_error"]

    @property
    def resolution_steps(self) -> List[str]:
        """Steps to resolve this error."""
        resolutions = {
            "media_too_large": [
                "Compress the media file",
                "Reduce video resolution or bitrate",
                "Split into multiple posts if carousel"
            ],
            "invalid_format": [
                "Convert to supported format",
                "Check aspect ratio requirements",
                "Verify codec compatibility"
            ],
            "caption_too_long": [
                "Shorten caption to platform limit",
                "Move hashtags to first comment",
                "Split into thread if Twitter"
            ],
            "rate_limited": [
                "Wait 15-30 minutes before retry",
                "Reduce posting frequency",
                "Check API rate limit status"
            ],
            "auth_expired": [
                "Re-authenticate the account",
                "Refresh OAuth tokens",
                "Check app permissions"
            ],
            "network_error": [
                "Check internet connection",
                "Retry in a few minutes",
                "Verify API endpoint availability"
            ],
            "platform_error": [
                "Check platform status page",
                "Retry later",
                "Contact platform support if persistent"
            ],
            "content_violation": [
                "Review content against guidelines",
                "Remove flagged elements",
                "Appeal if false positive"
            ],
            "scheduling_conflict": [
                "Adjust scheduled time",
                "Remove conflicting post",
                "Check timezone settings"
            ],
            "account_restricted": [
                "Check account standing",
                "Review recent violations",
                "Contact platform support"
            ]
        }
        return resolutions.get(self.value, ["Contact support"])

    @property
    def retry_delay_seconds(self) -> int:
        """Recommended delay before retry in seconds."""
        delays = {
            "rate_limited": 900,  # 15 minutes
            "network_error": 60,
            "platform_error": 300
        }
        return delays.get(self.value, 0)


class QueuePriority(Enum):
    """Priority levels for the publishing queue."""
    URGENT = "urgent"
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"
    EVERGREEN = "evergreen"

    @property
    def weight(self) -> int:
        """Numerical weight for sorting."""
        weights = {
            "urgent": 100,
            "high": 75,
            "normal": 50,
            "low": 25,
            "evergreen": 10
        }
        return weights.get(self.value, 50)

    @property
    def max_delay_hours(self) -> int:
        """Maximum delay before escalation."""
        delays = {
            "urgent": 1,
            "high": 4,
            "normal": 24,
            "low": 72,
            "evergreen": 168  # 1 week
        }
        return delays.get(self.value, 24)

    @property
    def description(self) -> str:
        """Description of this priority level."""
        descs = {
            "urgent": "Time-sensitive content that must publish immediately",
            "high": "Important content with specific timing requirements",
            "normal": "Standard scheduled content",
            "low": "Flexible content that can be delayed if needed",
            "evergreen": "Timeless content to fill gaps in schedule"
        }
        return descs.get(self.value, "Standard priority")


class CrossPostStrategy(Enum):
    """Strategies for cross-posting content across platforms."""
    IDENTICAL = "identical"
    ADAPTED = "adapted"
    NATIVE_FIRST = "native_first"
    STAGGERED = "staggered"
    REPURPOSED = "repurposed"

    @property
    def description(self) -> str:
        """Description of this cross-posting strategy."""
        descs = {
            "identical": "Post exact same content across all platforms",
            "adapted": "Adapt caption/hashtags per platform, same media",
            "native_first": "Create native content, then adapt for others",
            "staggered": "Post to different platforms at different times",
            "repurposed": "Transform content type for each platform"
        }
        return descs.get(self.value, "Standard cross-posting")

    @property
    def recommended_for(self) -> List[str]:
        """Content types this strategy works best for."""
        rec_map = {
            "identical": ["announcements", "promotions", "urgent_news"],
            "adapted": ["educational", "tips", "quotes"],
            "native_first": ["reels", "tiktoks", "stories"],
            "staggered": ["evergreen", "campaigns", "launches"],
            "repurposed": ["long_form", "tutorials", "interviews"]
        }
        return rec_map.get(self.value, [])

    @property
    def delay_between_posts_minutes(self) -> int:
        """Recommended delay between cross-posts in minutes."""
        delays = {
            "identical": 0,
            "adapted": 30,
            "native_first": 60,
            "staggered": 240,  # 4 hours
            "repurposed": 1440  # 24 hours
        }
        return delays.get(self.value, 60)


# ============================================================================
# DATA CLASSES - Publishing Structures
# ============================================================================

@dataclass
class TrackingLink:
    """UTM-tagged link for analytics tracking."""
    base_url: str
    source: str
    medium: str
    campaign: str
    term: Optional[str] = None
    content: Optional[str] = None

    def __post_init__(self):
        """Validate and clean URL."""
        if not self.base_url.startswith(("http://", "https://")):
            self.base_url = f"https://{self.base_url}"
        # Remove trailing slash
        self.base_url = self.base_url.rstrip("/")

    @property
    def full_url(self) -> str:
        """Generate full URL with UTM parameters."""
        params = [
            f"utm_source={self.source}",
            f"utm_medium={self.medium}",
            f"utm_campaign={self.campaign}"
        ]
        if self.term:
            params.append(f"utm_term={self.term}")
        if self.content:
            params.append(f"utm_content={self.content}")

        separator = "&" if "?" in self.base_url else "?"
        return f"{self.base_url}{separator}{'&'.join(params)}"

    @property
    def short_id(self) -> str:
        """Generate short ID for internal tracking."""
        hash_input = f"{self.source}:{self.campaign}:{self.content or 'default'}"
        return hashlib.md5(hash_input.encode()).hexdigest()[:8]


@dataclass
class MediaAsset:
    """Media asset with format validation."""
    file_path: str
    media_type: MediaType
    width: int = 0
    height: int = 0
    duration_seconds: Optional[int] = None
    file_size_mb: float = 0.0
    alt_text: Optional[str] = None

    @property
    def aspect_ratio(self) -> str:
        """Calculate aspect ratio."""
        if self.width == 0 or self.height == 0:
            return "unknown"
        from math import gcd
        g = gcd(self.width, self.height)
        return f"{self.width // g}:{self.height // g}"

    @property
    def is_valid_dimensions(self) -> bool:
        """Check if dimensions match media type requirements."""
        expected = self.media_type.dimensions
        if expected["width"] == 0:  # Text only
            return True
        # Allow 5% variance
        width_ok = abs(self.width - expected["width"]) / expected["width"] < 0.05
        height_ok = abs(self.height - expected["height"]) / expected["height"] < 0.05
        return width_ok and height_ok

    @property
    def is_valid_duration(self) -> bool:
        """Check if video duration is within limits."""
        max_duration = self.media_type.max_duration_seconds
        if max_duration is None:
            return True
        if self.duration_seconds is None:
            return True
        return self.duration_seconds <= max_duration

    @property
    def validation_issues(self) -> List[str]:
        """List of validation issues."""
        issues = []
        if not self.is_valid_dimensions:
            expected = self.media_type.dimensions
            issues.append(
                f"Dimensions {self.width}x{self.height} don't match "
                f"expected {expected['width']}x{expected['height']}"
            )
        if not self.is_valid_duration:
            issues.append(
                f"Duration {self.duration_seconds}s exceeds max "
                f"{self.media_type.max_duration_seconds}s"
            )
        if self.file_size_mb > 100:
            issues.append(f"File size {self.file_size_mb}MB may be too large")
        return issues


@dataclass
class ScheduledPost:
    """A post scheduled for publishing."""
    post_id: str
    brand_name: str
    platform: Platform
    caption: str
    media_assets: List[MediaAsset] = field(default_factory=list)
    scheduled_time: Optional[datetime] = None
    status: PostStatus = PostStatus.DRAFT
    priority: QueuePriority = QueuePriority.NORMAL
    tracking_link: Optional[TrackingLink] = None
    hashtags: List[str] = field(default_factory=list)
    mentions: List[str] = field(default_factory=list)
    first_comment: Optional[str] = None
    location_tag: Optional[str] = None
    cross_post_from: Optional[str] = None
    error: Optional[PublishingError] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    published_url: Optional[str] = None
    published_at: Optional[datetime] = None

    def __post_init__(self):
        """Generate post ID if not provided."""
        if not self.post_id:
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            self.post_id = f"{self.brand_name[:3].upper()}-{self.platform.value[:2].upper()}-{timestamp}"

    @property
    def full_caption(self) -> str:
        """Caption with hashtags appended."""
        if not self.hashtags:
            return self.caption
        hashtag_str = " ".join(f"#{tag}" for tag in self.hashtags)
        return f"{self.caption}\n\n{hashtag_str}"

    @property
    def caption_length(self) -> int:
        """Length of full caption including hashtags."""
        return len(self.full_caption)

    @property
    def is_overdue(self) -> bool:
        """Check if post is past scheduled time."""
        if not self.scheduled_time:
            return False
        return datetime.now() > self.scheduled_time and not self.status.is_terminal

    @property
    def time_until_publish(self) -> Optional[timedelta]:
        """Time remaining until scheduled publish."""
        if not self.scheduled_time:
            return None
        diff = self.scheduled_time - datetime.now()
        return diff if diff.total_seconds() > 0 else None

    @property
    def requires_manual_post(self) -> bool:
        """Whether this post needs manual publishing."""
        return self.platform.requires_manual_post

    @property
    def can_retry(self) -> bool:
        """Whether retry is possible."""
        if self.error and not self.error.is_retryable:
            return False
        return self.retry_count < self.max_retries

    @property
    def validation_issues(self) -> List[str]:
        """All validation issues for this post."""
        issues = []

        # Check caption length (simplified - would need platform-specific limits)
        if self.caption_length > 2200 and self.platform in [Platform.INSTAGRAM, Platform.INSTAGRAM_REELS]:
            issues.append(f"Caption too long: {self.caption_length} chars (max 2200)")

        # Check media
        for asset in self.media_assets:
            issues.extend(asset.validation_issues)

        # Check scheduling
        if self.scheduled_time:
            if self.scheduled_time < datetime.now():
                issues.append("Scheduled time is in the past")

            min_lead = timedelta(hours=self.platform.min_lead_time_hours)
            if self.scheduled_time < datetime.now() + min_lead:
                issues.append(f"Needs at least {self.platform.min_lead_time_hours}h lead time")

        return issues

    @property
    def is_ready_to_publish(self) -> bool:
        """Whether post is ready for publishing."""
        return (
            self.status == PostStatus.SCHEDULED and
            len(self.validation_issues) == 0 and
            self.scheduled_time is not None
        )


@dataclass
class PublishingQueue:
    """Queue of posts scheduled for publishing."""
    brand_name: str
    posts: List[ScheduledPost] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    def add_post(self, post: ScheduledPost) -> None:
        """Add a post to the queue."""
        self.posts.append(post)
        self._sort_queue()

    def _sort_queue(self) -> None:
        """Sort queue by priority and scheduled time."""
        self.posts.sort(
            key=lambda p: (
                -p.priority.weight,
                p.scheduled_time or datetime.max
            )
        )

    @property
    def pending_posts(self) -> List[ScheduledPost]:
        """Posts waiting to be published."""
        return [p for p in self.posts if not p.status.is_terminal]

    @property
    def published_posts(self) -> List[ScheduledPost]:
        """Successfully published posts."""
        return [p for p in self.posts if p.status == PostStatus.PUBLISHED]

    @property
    def failed_posts(self) -> List[ScheduledPost]:
        """Posts that failed to publish."""
        return [p for p in self.posts if p.status == PostStatus.FAILED]

    @property
    def manual_required(self) -> List[ScheduledPost]:
        """Posts requiring manual publishing."""
        return [p for p in self.posts if p.status == PostStatus.MANUAL_REQUIRED]

    @property
    def overdue_posts(self) -> List[ScheduledPost]:
        """Posts past their scheduled time."""
        return [p for p in self.posts if p.is_overdue]

    @property
    def next_post(self) -> Optional[ScheduledPost]:
        """Next post to be published."""
        ready = [p for p in self.pending_posts if p.is_ready_to_publish]
        return ready[0] if ready else None

    def get_posts_by_platform(self, platform: Platform) -> List[ScheduledPost]:
        """Get all posts for a specific platform."""
        return [p for p in self.posts if p.platform == platform]

    def get_posts_for_date(self, target_date: date) -> List[ScheduledPost]:
        """Get all posts scheduled for a specific date."""
        return [
            p for p in self.posts
            if p.scheduled_time and p.scheduled_time.date() == target_date
        ]

    @property
    def daily_counts(self) -> Dict[date, int]:
        """Count of posts per day."""
        counts: Dict[date, int] = {}
        for post in self.posts:
            if post.scheduled_time:
                d = post.scheduled_time.date()
                counts[d] = counts.get(d, 0) + 1
        return counts


@dataclass
class CrossPostGroup:
    """Group of cross-posted content across platforms."""
    group_id: str
    source_post: ScheduledPost
    cross_posts: List[ScheduledPost] = field(default_factory=list)
    strategy: CrossPostStrategy = CrossPostStrategy.ADAPTED

    @property
    def all_posts(self) -> List[ScheduledPost]:
        """All posts including source."""
        return [self.source_post] + self.cross_posts

    @property
    def platforms_covered(self) -> List[Platform]:
        """List of platforms covered by this group."""
        return [p.platform for p in self.all_posts]

    @property
    def all_published(self) -> bool:
        """Whether all posts in group are published."""
        return all(p.status == PostStatus.PUBLISHED for p in self.all_posts)

    @property
    def publish_progress(self) -> float:
        """Percentage of posts published."""
        if not self.all_posts:
            return 0.0
        published = sum(1 for p in self.all_posts if p.status == PostStatus.PUBLISHED)
        return (published / len(self.all_posts)) * 100


@dataclass
class PublishingSchedule:
    """Full publishing schedule with time slots."""
    brand_name: str
    start_date: date
    end_date: date
    slots: Dict[str, List[ScheduledPost]] = field(default_factory=dict)

    def add_to_slot(self, slot_key: str, post: ScheduledPost) -> None:
        """Add post to a time slot."""
        if slot_key not in self.slots:
            self.slots[slot_key] = []
        self.slots[slot_key].append(post)

    @property
    def total_posts(self) -> int:
        """Total posts in schedule."""
        return sum(len(posts) for posts in self.slots.values())

    @property
    def platforms_used(self) -> List[Platform]:
        """Unique platforms in schedule."""
        platforms = set()
        for posts in self.slots.values():
            for post in posts:
                platforms.add(post.platform)
        return list(platforms)

    @property
    def coverage_by_platform(self) -> Dict[str, int]:
        """Post count by platform."""
        coverage: Dict[str, int] = {}
        for posts in self.slots.values():
            for post in posts:
                key = post.platform.value
                coverage[key] = coverage.get(key, 0) + 1
        return coverage


# ============================================================================
# ENGINE CLASSES - Publishing Logic
# ============================================================================

class TimeOptimizer:
    """Engine for optimizing posting times."""

    def __init__(self, timezone: str = "UTC"):
        self.timezone = timezone

    def get_optimal_times(
        self,
        platform: Platform,
        target_date: date,
        avoid_conflicts: List[datetime] = None
    ) -> List[datetime]:
        """Get optimal posting times for a platform on a date."""
        optimal = []
        day_name = target_date.strftime("%A").lower()

        # Check if it's a good day for this platform
        is_good_day = day_name in platform.best_days

        for time_str in platform.peak_times:
            hour, minute = map(int, time_str.split(":"))
            dt = datetime.combine(target_date, time(hour, minute))

            # Check for conflicts
            if avoid_conflicts:
                has_conflict = any(
                    abs((dt - conflict).total_seconds()) < 1800  # 30 min buffer
                    for conflict in avoid_conflicts
                )
                if has_conflict:
                    continue

            optimal.append(dt)

        # If not a good day, reduce confidence
        if not is_good_day and optimal:
            # Return fewer times on non-optimal days
            optimal = optimal[:1]

        return optimal

    def is_time_in_avoid_window(self, dt: datetime, platform: Platform) -> bool:
        """Check if time falls in avoid window."""
        time_str = dt.strftime("%H:%M")
        for avoid_range in platform.avoid_times:
            if avoid_range == "weekends":
                if dt.weekday() >= 5:
                    return True
            elif "-" in avoid_range:
                start, end = avoid_range.split("-")
                if start <= time_str <= end:
                    return True
        return False

    def suggest_alternative_time(
        self,
        platform: Platform,
        original_time: datetime
    ) -> datetime:
        """Suggest alternative if original time is not optimal."""
        # Find nearest peak time
        peak_times = platform.peak_times
        original_minutes = original_time.hour * 60 + original_time.minute

        best_time = None
        best_diff = float("inf")

        for time_str in peak_times:
            hour, minute = map(int, time_str.split(":"))
            peak_minutes = hour * 60 + minute
            diff = abs(peak_minutes - original_minutes)

            if diff < best_diff:
                best_diff = diff
                best_time = datetime.combine(
                    original_time.date(),
                    time(hour, minute)
                )

        return best_time or original_time


class LinkTracker:
    """Engine for generating and managing tracking links."""

    def __init__(self, default_medium: str = "social"):
        self.default_medium = default_medium

    def create_tracking_link(
        self,
        base_url: str,
        platform: Platform,
        campaign: str,
        content_id: Optional[str] = None
    ) -> TrackingLink:
        """Create a UTM-tracked link."""
        return TrackingLink(
            base_url=base_url,
            source=platform.value,
            medium=self.default_medium,
            campaign=campaign,
            content=content_id
        )

    def batch_create_links(
        self,
        base_url: str,
        platforms: List[Platform],
        campaign: str
    ) -> Dict[str, TrackingLink]:
        """Create tracking links for multiple platforms."""
        return {
            platform.value: self.create_tracking_link(
                base_url, platform, campaign
            )
            for platform in platforms
        }

    def validate_url(self, url: str) -> Dict[str, Any]:
        """Validate a URL for tracking."""
        issues = []

        if not url.startswith(("http://", "https://")):
            issues.append("URL should start with http:// or https://")

        if " " in url:
            issues.append("URL contains spaces")

        # Check for existing UTM params
        has_utm = "utm_" in url
        if has_utm:
            issues.append("URL already contains UTM parameters")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "has_existing_utm": has_utm
        }


class PlatformAdapter:
    """Engine for adapting content to platform requirements."""

    def validate_caption(
        self,
        caption: str,
        platform: Platform
    ) -> Dict[str, Any]:
        """Validate caption against platform requirements."""
        # Platform character limits
        limits = {
            Platform.INSTAGRAM: 2200,
            Platform.INSTAGRAM_REELS: 2200,
            Platform.TWITTER: 280,
            Platform.LINKEDIN: 3000,
            Platform.FACEBOOK: 63206,
            Platform.TIKTOK: 4000,
            Platform.THREADS: 500,
            Platform.PINTEREST: 500
        }

        limit = limits.get(platform, 2200)
        length = len(caption)

        return {
            "valid": length <= limit,
            "length": length,
            "limit": limit,
            "overflow": max(0, length - limit)
        }

    def adapt_caption(
        self,
        caption: str,
        source_platform: Platform,
        target_platform: Platform
    ) -> str:
        """Adapt caption from one platform to another."""
        adapted = caption

        # Handle Twitter's short limit
        if target_platform == Platform.TWITTER:
            if len(adapted) > 280:
                adapted = adapted[:277] + "..."

        # Handle LinkedIn's professional tone
        if target_platform == Platform.LINKEDIN:
            # Remove excess emojis for professional context
            pass  # Would implement emoji reduction

        return adapted

    def validate_media(
        self,
        media: MediaAsset,
        platform: Platform
    ) -> Dict[str, Any]:
        """Validate media against platform requirements."""
        is_supported = platform.value in media.media_type.supported_platforms

        issues = []
        if not is_supported:
            issues.append(f"{media.media_type.value} not supported on {platform.value}")
        issues.extend(media.validation_issues)

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "supported": is_supported
        }


class QueueManager:
    """Engine for managing the publishing queue."""

    def __init__(self, max_retries: int = 3):
        self.max_retries = max_retries

    def check_conflicts(
        self,
        new_post: ScheduledPost,
        existing_posts: List[ScheduledPost],
        buffer_minutes: int = 30
    ) -> List[ScheduledPost]:
        """Find posts that conflict with new post."""
        if not new_post.scheduled_time:
            return []

        conflicts = []
        buffer = timedelta(minutes=buffer_minutes)

        for existing in existing_posts:
            if not existing.scheduled_time:
                continue
            if existing.platform != new_post.platform:
                continue

            time_diff = abs(
                (new_post.scheduled_time - existing.scheduled_time).total_seconds()
            )
            if time_diff < buffer.total_seconds():
                conflicts.append(existing)

        return conflicts

    def check_daily_limit(
        self,
        post: ScheduledPost,
        queue: PublishingQueue
    ) -> bool:
        """Check if adding post exceeds daily limit."""
        if not post.scheduled_time:
            return True

        target_date = post.scheduled_time.date()
        same_day_posts = queue.get_posts_for_date(target_date)
        same_platform = [
            p for p in same_day_posts
            if p.platform == post.platform
        ]

        max_daily = post.platform.max_daily_posts
        return len(same_platform) < max_daily

    def process_retry(self, post: ScheduledPost) -> ScheduledPost:
        """Process a retry for a failed post."""
        if not post.can_retry:
            return post

        post.retry_count += 1
        post.status = PostStatus.RETRY_PENDING

        # Calculate new time with delay
        delay = timedelta(
            seconds=post.error.retry_delay_seconds if post.error else 60
        )
        if post.scheduled_time:
            post.scheduled_time = datetime.now() + delay

        return post

    def prioritize_queue(
        self,
        queue: PublishingQueue
    ) -> List[ScheduledPost]:
        """Get posts in priority order."""
        # First: Overdue posts
        # Second: High priority
        # Third: By scheduled time

        pending = queue.pending_posts

        overdue = [p for p in pending if p.is_overdue]
        not_overdue = [p for p in pending if not p.is_overdue]

        not_overdue.sort(
            key=lambda p: (
                -p.priority.weight,
                p.scheduled_time or datetime.max
            )
        )

        return overdue + not_overdue


class CrossPostManager:
    """Engine for managing cross-posting."""

    def create_cross_post_group(
        self,
        source_post: ScheduledPost,
        target_platforms: List[Platform],
        strategy: CrossPostStrategy,
        platform_adapter: PlatformAdapter
    ) -> CrossPostGroup:
        """Create a group of cross-posts from source."""
        group_id = f"XP-{source_post.post_id}"
        cross_posts = []

        delay = timedelta(minutes=strategy.delay_between_posts_minutes)
        current_time = source_post.scheduled_time or datetime.now()

        for platform in target_platforms:
            if platform == source_post.platform:
                continue

            current_time += delay

            # Adapt caption
            adapted_caption = platform_adapter.adapt_caption(
                source_post.caption,
                source_post.platform,
                platform
            )

            cross_post = ScheduledPost(
                post_id=f"{source_post.post_id}-{platform.value[:2]}",
                brand_name=source_post.brand_name,
                platform=platform,
                caption=adapted_caption,
                media_assets=source_post.media_assets,  # Same media
                scheduled_time=current_time,
                status=PostStatus.DRAFT,
                priority=source_post.priority,
                hashtags=source_post.hashtags,
                cross_post_from=source_post.post_id
            )

            cross_posts.append(cross_post)

        return CrossPostGroup(
            group_id=group_id,
            source_post=source_post,
            cross_posts=cross_posts,
            strategy=strategy
        )


class PublishingEngine:
    """Main orchestrator for the publishing system."""

    def __init__(self, timezone: str = "UTC"):
        self.time_optimizer = TimeOptimizer(timezone)
        self.link_tracker = LinkTracker()
        self.platform_adapter = PlatformAdapter()
        self.queue_manager = QueueManager()
        self.cross_post_manager = CrossPostManager()

    def prepare_post(
        self,
        brand_name: str,
        platform: Platform,
        caption: str,
        media_paths: List[str] = None,
        scheduled_time: Optional[datetime] = None,
        tracking_url: Optional[str] = None,
        campaign: Optional[str] = None
    ) -> ScheduledPost:
        """Prepare a new post for scheduling."""
        # Validate caption
        validation = self.platform_adapter.validate_caption(caption, platform)
        if not validation["valid"]:
            caption = caption[:validation["limit"] - 3] + "..."

        # Create tracking link if URL provided
        tracking_link = None
        if tracking_url and campaign:
            tracking_link = self.link_tracker.create_tracking_link(
                tracking_url, platform, campaign
            )

        # Optimize time if not specified
        if not scheduled_time:
            optimal_times = self.time_optimizer.get_optimal_times(
                platform, date.today()
            )
            if optimal_times:
                scheduled_time = optimal_times[0]

        post = ScheduledPost(
            post_id="",  # Will be generated
            brand_name=brand_name,
            platform=platform,
            caption=caption,
            scheduled_time=scheduled_time,
            tracking_link=tracking_link,
            status=PostStatus.DRAFT
        )

        # Set status based on platform
        if platform.requires_manual_post:
            post.status = PostStatus.MANUAL_REQUIRED

        return post

    def schedule_batch(
        self,
        posts: List[ScheduledPost],
        queue: PublishingQueue
    ) -> Dict[str, Any]:
        """Schedule a batch of posts."""
        results = {
            "scheduled": [],
            "conflicts": [],
            "limit_exceeded": [],
            "errors": []
        }

        for post in posts:
            # Check conflicts
            conflicts = self.queue_manager.check_conflicts(
                post, queue.posts
            )
            if conflicts:
                results["conflicts"].append({
                    "post": post,
                    "conflicts_with": conflicts
                })
                continue

            # Check daily limit
            within_limit = self.queue_manager.check_daily_limit(post, queue)
            if not within_limit:
                results["limit_exceeded"].append(post)
                continue

            # Validate
            if post.validation_issues:
                results["errors"].append({
                    "post": post,
                    "issues": post.validation_issues
                })
                continue

            # Schedule
            post.status = PostStatus.SCHEDULED
            queue.add_post(post)
            results["scheduled"].append(post)

        return results

    def create_weekly_schedule(
        self,
        brand_name: str,
        platforms: List[Platform],
        start_date: date,
        posts_per_platform: int = 5
    ) -> PublishingSchedule:
        """Create a weekly publishing schedule."""
        end_date = start_date + timedelta(days=7)
        schedule = PublishingSchedule(
            brand_name=brand_name,
            start_date=start_date,
            end_date=end_date
        )

        for platform in platforms:
            best_days = platform.best_days
            posts_scheduled = 0

            current = start_date
            while current < end_date and posts_scheduled < posts_per_platform:
                day_name = current.strftime("%A").lower()

                if day_name in best_days:
                    optimal_times = self.time_optimizer.get_optimal_times(
                        platform, current
                    )

                    for opt_time in optimal_times:
                        if posts_scheduled >= posts_per_platform:
                            break

                        slot_key = opt_time.strftime("%Y-%m-%d %H:%M")

                        placeholder = ScheduledPost(
                            post_id="",
                            brand_name=brand_name,
                            platform=platform,
                            caption="[Content pending]",
                            scheduled_time=opt_time,
                            status=PostStatus.DRAFT
                        )

                        schedule.add_to_slot(slot_key, placeholder)
                        posts_scheduled += 1

                current += timedelta(days=1)

        return schedule

    def get_schedule_summary(
        self,
        schedule: PublishingSchedule
    ) -> Dict[str, Any]:
        """Get summary of publishing schedule."""
        return {
            "brand": schedule.brand_name,
            "period": f"{schedule.start_date} to {schedule.end_date}",
            "total_posts": schedule.total_posts,
            "platforms": [p.value for p in schedule.platforms_used],
            "coverage": schedule.coverage_by_platform,
            "slots_count": len(schedule.slots)
        }


# ============================================================================
# REPORTER - ASCII Dashboard Generation
# ============================================================================

class PublishingReporter:
    """Generate ASCII reports for publishing status."""

    def __init__(self, brand_name: str):
        self.brand_name = brand_name

    def _progress_bar(self, value: float, width: int = 20) -> str:
        """Generate a progress bar."""
        filled = int(width * value / 100)
        empty = width - filled
        return f"[{'█' * filled}{'░' * empty}] {value:.0f}%"

    def generate_queue_report(self, queue: PublishingQueue) -> str:
        """Generate queue status report."""
        total = len(queue.posts)
        published = len(queue.published_posts)
        pending = len(queue.pending_posts)
        failed = len(queue.failed_posts)
        manual = len(queue.manual_required)

        progress = (published / total * 100) if total > 0 else 0

        report = f"""
PUBLISHING QUEUE
═══════════════════════════════════════
Brand: {self.brand_name}
Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}
═══════════════════════════════════════

QUEUE STATUS
────────────────────────────────────────
┌─────────────────────────────────────┐
│       PUBLISHING STATUS             │
│                                     │
│  Total Posts: {total:<20}│
│                                     │
│  ✓ Published: {published:<20}│
│  ◐ Pending: {pending:<22}│
│  ✗ Failed: {failed:<23}│
│  ⚠ Manual Required: {manual:<14}│
│                                     │
│  Progress: {self._progress_bar(progress):<12}│
│  Status: {"● Queue Active" if pending > 0 else "○ Queue Empty":<15}│
└─────────────────────────────────────┘

UPCOMING POSTS
────────────────────────────────────────
| Time | Platform | Status | Priority |
|------|----------|--------|----------|"""

        for post in sorted(queue.pending_posts, key=lambda p: p.scheduled_time or datetime.max)[:10]:
            time_str = post.scheduled_time.strftime("%m/%d %H:%M") if post.scheduled_time else "TBD"
            report += f"\n| {time_str} | {post.platform.value[:8]:<8} | {post.status.icon} {post.status.value[:6]:<6} | {post.priority.value:<8} |"

        if queue.failed_posts:
            report += """

FAILED POSTS (Action Required)
────────────────────────────────────────"""
            for post in queue.failed_posts[:5]:
                error_name = post.error.value if post.error else "unknown"
                report += f"\n• {post.post_id}: {error_name} (retries: {post.retry_count})"

        if queue.manual_required:
            report += """

MANUAL POSTING REQUIRED
────────────────────────────────────────"""
            for post in queue.manual_required[:5]:
                time_str = post.scheduled_time.strftime("%m/%d %H:%M") if post.scheduled_time else "ASAP"
                report += f"\n• {time_str} - {post.platform.value}: {post.caption[:30]}..."

        report += f"""

Publishing Status: {"● Active" if pending > 0 else "○ Complete"}
"""
        return report

    def generate_schedule_report(self, schedule: PublishingSchedule) -> str:
        """Generate weekly schedule report."""
        report = f"""
PUBLISHING SCHEDULE
═══════════════════════════════════════
Brand: {schedule.brand_name}
Period: {schedule.start_date} to {schedule.end_date}
═══════════════════════════════════════

SCHEDULE OVERVIEW
────────────────────────────────────────
┌─────────────────────────────────────┐
│       WEEKLY SCHEDULE               │
│                                     │
│  Total Posts: {schedule.total_posts:<20}│
│  Platforms: {len(schedule.platforms_used):<22}│
│  Time Slots: {len(schedule.slots):<21}│
│                                     │
│  Status: ● Schedule Active          │
└─────────────────────────────────────┘

PLATFORM COVERAGE
────────────────────────────────────────
| Platform | Posts | Best Days |
|----------|-------|-----------|"""

        for platform in schedule.platforms_used:
            count = schedule.coverage_by_platform.get(platform.value, 0)
            days = ", ".join(d[:3].title() for d in platform.best_days[:3])
            report += f"\n| {platform.value:<8} | {count:<5} | {days:<9} |"

        report += """

DAILY BREAKDOWN
────────────────────────────────────────"""

        current = schedule.start_date
        while current <= schedule.end_date:
            day_name = current.strftime("%A")
            day_posts = [
                p for slot_posts in schedule.slots.values()
                for p in slot_posts
                if p.scheduled_time and p.scheduled_time.date() == current
            ]

            report += f"\n**{day_name} {current.strftime('%m/%d')}** ({len(day_posts)} posts)"

            for post in sorted(day_posts, key=lambda p: p.scheduled_time):
                time_str = post.scheduled_time.strftime("%H:%M")
                report += f"\n  {time_str} | {post.platform.value}"

            current += timedelta(days=1)

        report += """

Schedule Status: ● Ready for Publishing
"""
        return report

    def generate_cross_post_report(self, group: CrossPostGroup) -> str:
        """Generate cross-posting group report."""
        progress = group.publish_progress

        report = f"""
CROSS-POST GROUP
═══════════════════════════════════════
Group ID: {group.group_id}
Strategy: {group.strategy.value}
═══════════════════════════════════════

GROUP STATUS
────────────────────────────────────────
┌─────────────────────────────────────┐
│       CROSS-POST STATUS             │
│                                     │
│  Source: {group.source_post.platform.value:<25}│
│  Cross-Posts: {len(group.cross_posts):<20}│
│                                     │
│  Progress: {self._progress_bar(progress):<12}│
│                                     │
│  Strategy: {group.strategy.description[:24]:<15}│
└─────────────────────────────────────┘

POST BREAKDOWN
────────────────────────────────────────
| Platform | Status | Time | Type |
|----------|--------|------|------|"""

        # Source post
        src = group.source_post
        src_time = src.scheduled_time.strftime("%H:%M") if src.scheduled_time else "TBD"
        report += f"\n| {src.platform.value:<8} | {src.status.icon} {src.status.value:<5} | {src_time} | Source |"

        # Cross posts
        for post in group.cross_posts:
            time_str = post.scheduled_time.strftime("%H:%M") if post.scheduled_time else "TBD"
            report += f"\n| {post.platform.value:<8} | {post.status.icon} {post.status.value:<5} | {time_str} | Cross  |"

        report += f"""

Cross-Post Status: {"● All Published" if group.all_published else "◐ In Progress"}
"""
        return report

    def generate_optimal_times_report(self, platform: Platform) -> str:
        """Generate optimal posting times report."""
        report = f"""
OPTIMAL POSTING TIMES
═══════════════════════════════════════
Platform: {platform.value}
═══════════════════════════════════════

BEST DAYS
────────────────────────────────────────
{', '.join(d.title() for d in platform.best_days)}

PEAK TIMES
────────────────────────────────────────"""

        for time_str in platform.peak_times:
            report += f"\n• {time_str}"

        report += f"""

AVOID
────────────────────────────────────────"""

        for avoid in platform.avoid_times:
            report += f"\n• {avoid}"

        report += f"""

DAILY LIMITS
────────────────────────────────────────
Max posts per day: {platform.max_daily_posts}
Min lead time: {platform.min_lead_time_hours} hours
Supports scheduling: {"Yes" if platform.supports_scheduling else "No (Manual required)"}

Timing Status: ● Optimized
"""
        return report


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """Main CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="SOCIAL.PUBLISH.EXE - Scheduling & Publishing Specialist"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Schedule command
    schedule_parser = subparsers.add_parser("schedule", help="Create publishing schedule")
    schedule_parser.add_argument("--brand", required=True, help="Brand name")
    schedule_parser.add_argument("--platforms", nargs="+", help="Target platforms")
    schedule_parser.add_argument("--start", help="Start date (YYYY-MM-DD)")
    schedule_parser.add_argument("--posts-per-platform", type=int, default=5)

    # Queue command
    queue_parser = subparsers.add_parser("queue", help="View publishing queue")
    queue_parser.add_argument("--brand", required=True, help="Brand name")
    queue_parser.add_argument("--status", help="Filter by status")

    # Times command
    times_parser = subparsers.add_parser("times", help="Get optimal posting times")
    times_parser.add_argument("--platform", required=True, help="Platform name")

    # Prepare command
    prepare_parser = subparsers.add_parser("prepare", help="Prepare a post")
    prepare_parser.add_argument("--brand", required=True, help="Brand name")
    prepare_parser.add_argument("--platform", required=True, help="Target platform")
    prepare_parser.add_argument("--caption", required=True, help="Post caption")
    prepare_parser.add_argument("--time", help="Scheduled time")
    prepare_parser.add_argument("--url", help="Tracking URL")
    prepare_parser.add_argument("--campaign", help="Campaign name")

    # Track command
    track_parser = subparsers.add_parser("track", help="Create tracking link")
    track_parser.add_argument("--url", required=True, help="Base URL")
    track_parser.add_argument("--platform", required=True, help="Platform")
    track_parser.add_argument("--campaign", required=True, help="Campaign name")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Run demonstration")
    demo_parser.add_argument("--brand", default="DemoStore", help="Brand name")

    args = parser.parse_args()

    if args.command == "schedule":
        engine = PublishingEngine()
        platforms = [
            Platform(p) for p in (args.platforms or ["instagram", "tiktok", "linkedin"])
        ]
        start = date.fromisoformat(args.start) if args.start else date.today()

        schedule = engine.create_weekly_schedule(
            args.brand, platforms, start, args.posts_per_platform
        )

        reporter = PublishingReporter(args.brand)
        print(reporter.generate_schedule_report(schedule))

    elif args.command == "times":
        try:
            platform = Platform(args.platform)
        except ValueError:
            print(f"Unknown platform: {args.platform}")
            print(f"Available: {', '.join(p.value for p in Platform)}")
            return

        reporter = PublishingReporter("General")
        print(reporter.generate_optimal_times_report(platform))

    elif args.command == "track":
        try:
            platform = Platform(args.platform)
        except ValueError:
            print(f"Unknown platform: {args.platform}")
            return

        tracker = LinkTracker()
        link = tracker.create_tracking_link(args.url, platform, args.campaign)

        print(f"\nTracking Link Created")
        print(f"─" * 40)
        print(f"Full URL: {link.full_url}")
        print(f"Short ID: {link.short_id}")

    elif args.command == "demo":
        print(f"\n{'═' * 50}")
        print("SOCIAL.PUBLISH.EXE - DEMONSTRATION")
        print(f"{'═' * 50}")

        engine = PublishingEngine()
        reporter = PublishingReporter(args.brand)

        # Create schedule
        platforms = [Platform.INSTAGRAM, Platform.TIKTOK, Platform.LINKEDIN]
        schedule = engine.create_weekly_schedule(
            args.brand, platforms, date.today()
        )
        print(reporter.generate_schedule_report(schedule))

        # Show optimal times
        print(reporter.generate_optimal_times_report(Platform.INSTAGRAM))

        # Create tracking link
        tracker = LinkTracker()
        link = tracker.create_tracking_link(
            "https://example.com/sale",
            Platform.INSTAGRAM,
            "summer_campaign"
        )
        print(f"\nSample Tracking Link: {link.full_url}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

## OPTIMAL POSTING TIMES

| Platform | Best Days | Peak Times | Avoid |
|----------|-----------|------------|-------|
| Instagram | Tue-Fri | 9am, 12pm, 6pm | 3-5am |
| TikTok | Tue-Thu | 7pm, 9pm | 5-7am |
| LinkedIn | Tue-Thu | 8am, 12pm, 5pm | Weekends |
| Twitter/X | Wed-Fri | 8am, 12pm, 5pm | Weekends |
| Facebook | Wed-Fri | 9am, 1pm | 11pm-6am |

## PLATFORM SPECS

| Platform | Image Size | Video | Caption |
|----------|------------|-------|---------|
| Instagram Feed | 1080x1080, 1080x1350 | 60 min | 2,200 chars |
| Instagram Reels | 1080x1920 | 90 sec | 2,200 chars |
| TikTok | 1080x1920 | 10 min | 4,000 chars |
| LinkedIn | 1200x627, 1080x1080 | 10 min | 3,000 chars |
| Twitter/X | 1200x675 | 2:20 | 280 chars |

## SCHEDULING CHECKLIST

| Pre-Schedule | Post-Schedule |
|--------------|---------------|
| Content approved | Preview correct |
| Account selected | Time confirmed |
| Media optimized | No conflicts |
| Caption formatted | Team notified |
| Hashtags included | Alerts set |

## QUICK COMMANDS

- `/social-publish [brand] [week]` - Schedule week's content
- `/social-publish check [brand]` - Pre-publish verification
- `/social-publish times [platform]` - Optimal posting times
- `/social-publish bulk [brand]` - Batch scheduling setup
- `/social-publish manual [brand]` - Manual post reminders

$ARGUMENTS
