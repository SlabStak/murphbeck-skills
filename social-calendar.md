# SOCIAL.CALENDAR.EXE - Content Calendar Planner

You are SOCIAL.CALENDAR.EXE — the multi-brand content calendar strategist that creates, manages, and optimizes publishing schedules across platforms with strategic content mix planning and key date integration.

MISSION
Plan content. Schedule posts. Optimize timing.

---

## CAPABILITIES

### CalendarArchitect.MOD
- Monthly planning
- Weekly scheduling
- Daily slot management
- Multi-brand coordination
- Gap identification

### ContentMixEngine.MOD
- Pillar distribution
- Type balancing
- Platform optimization
- Frequency tuning
- Seasonal adjustment

### DateIntelligence.MOD
- Holiday tracking
- Industry events
- Campaign alignment
- Launch coordination
- Trend awareness

### ResourcePlanner.MOD
- Asset scheduling
- Team allocation
- Production timeline
- Buffer management
- Capacity planning

---

## SYSTEM IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
SOCIAL.CALENDAR.EXE - Content Calendar Planner
Production-ready content calendar system with multi-brand scheduling,
content mix optimization, key date integration, and resource planning.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta, date
from enum import Enum
from typing import Optional
import argparse
import calendar


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class DayOfWeek(Enum):
    """Days of the week with themed content suggestions."""
    MONDAY = 0
    TUESDAY = 1
    WEDNESDAY = 2
    THURSDAY = 3
    FRIDAY = 4
    SATURDAY = 5
    SUNDAY = 6

    @property
    def theme(self) -> str:
        """Recommended daily content theme."""
        themes = {
            0: "Educational",
            1: "Product",
            2: "Industry",
            3: "Culture",
            4: "Entertainment",
            5: "Community",
            6: "Inspiration"
        }
        return themes.get(self.value, "General")

    @property
    def content_focus(self) -> list:
        """Suggested content types for this day."""
        focus = {
            0: ["Tips", "How-to", "Tutorials", "Educational carousels"],
            1: ["Product features", "Demos", "Use cases", "Benefits"],
            2: ["Industry news", "Insights", "Trends", "Expert takes"],
            3: ["Behind-the-scenes", "Team intros", "Company culture"],
            4: ["Fun content", "Memes", "Relatable posts", "Trends"],
            5: ["UGC spotlight", "Customer stories", "Community features"],
            6: ["Motivation", "Stories", "Quotes", "Inspiration"]
        }
        return focus.get(self.value, [])

    @property
    def engagement_level(self) -> str:
        """Expected engagement level for posting."""
        levels = {
            0: "Medium",
            1: "High",
            2: "High",
            3: "High",
            4: "Highest",
            5: "Medium",
            6: "Low"
        }
        return levels.get(self.value, "Medium")


class Platform(Enum):
    """Social media platforms with scheduling specs."""
    INSTAGRAM_FEED = "instagram_feed"
    INSTAGRAM_STORIES = "instagram_stories"
    INSTAGRAM_REELS = "instagram_reels"
    TIKTOK = "tiktok"
    LINKEDIN = "linkedin"
    TWITTER_X = "twitter_x"
    FACEBOOK = "facebook"
    YOUTUBE = "youtube"
    PINTEREST = "pinterest"
    THREADS = "threads"

    @property
    def posts_per_week(self) -> int:
        """Recommended posting frequency per week."""
        frequency = {
            "instagram_feed": 5,
            "instagram_stories": 7,
            "instagram_reels": 3,
            "tiktok": 5,
            "linkedin": 3,
            "twitter_x": 7,
            "facebook": 5,
            "youtube": 1,
            "pinterest": 10,
            "threads": 5
        }
        return frequency.get(self.value, 5)

    @property
    def best_days(self) -> list:
        """Best days for posting on this platform."""
        days = {
            "instagram_feed": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "instagram_stories": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "instagram_reels": ["Monday", "Wednesday", "Friday"],
            "tiktok": ["Tuesday", "Wednesday", "Thursday"],
            "linkedin": ["Tuesday", "Wednesday", "Thursday"],
            "twitter_x": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "facebook": ["Wednesday", "Thursday", "Friday"],
            "youtube": ["Thursday", "Friday", "Saturday"],
            "pinterest": ["Saturday", "Sunday"],
            "threads": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        }
        return days.get(self.value, [])

    @property
    def peak_times(self) -> list:
        """Optimal posting times (24h format)."""
        times = {
            "instagram_feed": ["09:00", "12:00", "18:00"],
            "instagram_stories": ["08:00", "14:00", "20:00"],
            "instagram_reels": ["12:00", "19:00"],
            "tiktok": ["19:00", "21:00"],
            "linkedin": ["08:00", "12:00", "17:00"],
            "twitter_x": ["08:00", "12:00", "17:00"],
            "facebook": ["09:00", "13:00", "16:00"],
            "youtube": ["14:00", "16:00", "20:00"],
            "pinterest": ["20:00", "21:00"],
            "threads": ["09:00", "17:00"]
        }
        return times.get(self.value, ["09:00", "12:00", "18:00"])

    @property
    def min_lead_time_days(self) -> int:
        """Minimum lead time needed for content production."""
        lead_times = {
            "instagram_feed": 2,
            "instagram_stories": 1,
            "instagram_reels": 3,
            "tiktok": 2,
            "linkedin": 2,
            "twitter_x": 1,
            "facebook": 2,
            "youtube": 7,
            "pinterest": 2,
            "threads": 1
        }
        return lead_times.get(self.value, 2)


class ContentMixType(Enum):
    """Content mix categories with target percentages."""
    EDUCATIONAL = "educational"
    PROMOTIONAL = "promotional"
    ENTERTAINING = "entertaining"
    USER_GENERATED = "user_generated"
    INSPIRATIONAL = "inspirational"
    BEHIND_SCENES = "behind_scenes"
    THOUGHT_LEADERSHIP = "thought_leadership"
    TRENDING = "trending"

    @property
    def target_percentage(self) -> int:
        """Ideal percentage of this content type."""
        percentages = {
            "educational": 30,
            "promotional": 15,
            "entertaining": 20,
            "user_generated": 10,
            "inspirational": 10,
            "behind_scenes": 5,
            "thought_leadership": 5,
            "trending": 5
        }
        return percentages.get(self.value, 10)

    @property
    def purpose(self) -> str:
        """Primary purpose of this content type."""
        purposes = {
            "educational": "Build authority and provide value",
            "promotional": "Drive sales and conversions",
            "entertaining": "Increase reach and engagement",
            "user_generated": "Build social proof and community",
            "inspirational": "Emotional connection and shares",
            "behind_scenes": "Authenticity and brand personality",
            "thought_leadership": "Industry authority and PR",
            "trending": "Visibility and relevance"
        }
        return purposes.get(self.value, "")

    @property
    def best_platforms(self) -> list:
        """Platforms where this content performs best."""
        platforms = {
            "educational": [Platform.INSTAGRAM_FEED, Platform.LINKEDIN, Platform.YOUTUBE],
            "promotional": [Platform.INSTAGRAM_FEED, Platform.FACEBOOK, Platform.PINTEREST],
            "entertaining": [Platform.TIKTOK, Platform.INSTAGRAM_REELS, Platform.TWITTER_X],
            "user_generated": [Platform.INSTAGRAM_FEED, Platform.INSTAGRAM_STORIES],
            "inspirational": [Platform.INSTAGRAM_FEED, Platform.LINKEDIN, Platform.PINTEREST],
            "behind_scenes": [Platform.INSTAGRAM_STORIES, Platform.TIKTOK],
            "thought_leadership": [Platform.LINKEDIN, Platform.TWITTER_X],
            "trending": [Platform.TIKTOK, Platform.INSTAGRAM_REELS, Platform.TWITTER_X]
        }
        return platforms.get(self.value, [])


class KeyDateCategory(Enum):
    """Categories of key dates for planning."""
    HOLIDAY = "holiday"
    INDUSTRY_EVENT = "industry_event"
    COMPANY_EVENT = "company_event"
    PRODUCT_LAUNCH = "product_launch"
    CAMPAIGN = "campaign"
    AWARENESS_DAY = "awareness_day"
    SEASONAL = "seasonal"
    CULTURAL = "cultural"

    @property
    def priority(self) -> int:
        """Planning priority (1 = highest)."""
        priorities = {
            "product_launch": 1,
            "campaign": 1,
            "company_event": 2,
            "holiday": 3,
            "industry_event": 3,
            "awareness_day": 4,
            "seasonal": 4,
            "cultural": 5
        }
        return priorities.get(self.value, 5)

    @property
    def lead_time_weeks(self) -> int:
        """Recommended lead time for planning."""
        lead_times = {
            "product_launch": 8,
            "campaign": 6,
            "company_event": 4,
            "holiday": 4,
            "industry_event": 3,
            "awareness_day": 2,
            "seasonal": 4,
            "cultural": 2
        }
        return lead_times.get(self.value, 2)

    @property
    def content_recommendations(self) -> list:
        """Suggested content approaches."""
        recommendations = {
            "holiday": ["Themed graphics", "Greetings", "Holiday tips", "Gift guides"],
            "industry_event": ["Live coverage", "Insights", "Networking", "Recaps"],
            "company_event": ["Announcements", "Behind-scenes", "Live updates", "Highlights"],
            "product_launch": ["Teasers", "Countdowns", "Launch posts", "Feature highlights"],
            "campaign": ["Campaign content", "User participation", "Progress updates"],
            "awareness_day": ["Educational content", "Brand alignment", "Community engagement"],
            "seasonal": ["Seasonal themes", "Timely content", "Relevant offers"],
            "cultural": ["Celebration posts", "Community content", "Inclusive messaging"]
        }
        return recommendations.get(self.value, [])


class SlotStatus(Enum):
    """Calendar slot status options."""
    EMPTY = "empty"
    PLANNED = "planned"
    BRIEFED = "briefed"
    IN_PRODUCTION = "in_production"
    READY = "ready"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    SKIPPED = "skipped"

    @property
    def color_code(self) -> str:
        """Visual indicator for calendars."""
        colors = {
            "empty": "○",
            "planned": "◐",
            "briefed": "◑",
            "in_production": "◕",
            "ready": "●",
            "scheduled": "◉",
            "published": "✓",
            "skipped": "✗"
        }
        return colors.get(self.value, "○")

    @property
    def next_status(self) -> "SlotStatus":
        """Typical next status in workflow."""
        transitions = {
            "empty": SlotStatus.PLANNED,
            "planned": SlotStatus.BRIEFED,
            "briefed": SlotStatus.IN_PRODUCTION,
            "in_production": SlotStatus.READY,
            "ready": SlotStatus.SCHEDULED,
            "scheduled": SlotStatus.PUBLISHED,
            "published": SlotStatus.PUBLISHED,
            "skipped": SlotStatus.EMPTY
        }
        return transitions.get(self.value, SlotStatus.EMPTY)


class ResourceType(Enum):
    """Types of resources for content production."""
    DESIGNER = "designer"
    COPYWRITER = "copywriter"
    VIDEO_EDITOR = "video_editor"
    PHOTOGRAPHER = "photographer"
    SOCIAL_MANAGER = "social_manager"
    INFLUENCER = "influencer"
    EXTERNAL_AGENCY = "external_agency"

    @property
    def typical_capacity_per_week(self) -> int:
        """Typical number of content pieces per week."""
        capacity = {
            "designer": 20,
            "copywriter": 30,
            "video_editor": 10,
            "photographer": 15,
            "social_manager": 50,
            "influencer": 5,
            "external_agency": 30
        }
        return capacity.get(self.value, 10)

    @property
    def content_types_supported(self) -> list:
        """Content types this resource can produce."""
        types = {
            "designer": ["Graphics", "Carousels", "Thumbnails", "Stories"],
            "copywriter": ["Captions", "Scripts", "Blog posts", "Ad copy"],
            "video_editor": ["Reels", "TikToks", "YouTube", "Stories"],
            "photographer": ["Product shots", "Lifestyle", "Behind-scenes"],
            "social_manager": ["Publishing", "Community", "Analytics"],
            "influencer": ["UGC", "Collaborations", "Takeovers"],
            "external_agency": ["Full campaigns", "Video production", "Design"]
        }
        return types.get(self.value, [])


# ============================================================
# DATACLASSES
# ============================================================

@dataclass
class KeyDate:
    """Key date for content planning."""
    date: date
    name: str
    category: KeyDateCategory
    description: str = ""
    content_planned: bool = False
    content_count: int = 0
    notes: str = ""

    @property
    def days_until(self) -> int:
        """Days until this date."""
        today = date.today()
        return (self.date - today).days

    @property
    def is_upcoming(self) -> bool:
        """Check if date is within planning window."""
        return 0 <= self.days_until <= 60

    @property
    def needs_content(self) -> bool:
        """Check if content should be planned."""
        lead_time = self.category.lead_time_weeks * 7
        return self.days_until <= lead_time and not self.content_planned


@dataclass
class CalendarSlot:
    """Individual slot in the content calendar."""
    slot_date: date
    platform: Platform
    time_slot: str = "09:00"
    content_type: Optional[ContentMixType] = None
    status: SlotStatus = SlotStatus.EMPTY
    content_id: Optional[str] = None
    title: str = ""
    assigned_to: Optional[str] = None
    notes: str = ""

    @property
    def day_of_week(self) -> DayOfWeek:
        """Get day of week for this slot."""
        return DayOfWeek(self.slot_date.weekday())

    @property
    def is_peak_time(self) -> bool:
        """Check if scheduled at platform peak time."""
        return self.time_slot in self.platform.peak_times

    @property
    def is_optimal_day(self) -> bool:
        """Check if on optimal day for platform."""
        day_name = self.slot_date.strftime("%A")
        return day_name in self.platform.best_days

    @property
    def optimization_score(self) -> int:
        """Score slot optimization (0-100)."""
        score = 50  # Base score

        if self.is_peak_time:
            score += 25
        if self.is_optimal_day:
            score += 25

        return score


@dataclass
class WeeklySchedule:
    """Weekly content schedule for a brand."""
    brand_name: str
    week_start: date
    slots: list = field(default_factory=list)
    platforms: list = field(default_factory=list)

    def __post_init__(self):
        """Initialize default platforms if empty."""
        if not self.platforms:
            self.platforms = [
                Platform.INSTAGRAM_FEED,
                Platform.INSTAGRAM_STORIES,
                Platform.TIKTOK,
                Platform.LINKEDIN
            ]

    @property
    def week_end(self) -> date:
        """End date of the week."""
        return self.week_start + timedelta(days=6)

    @property
    def total_slots(self) -> int:
        """Total number of slots."""
        return len(self.slots)

    @property
    def filled_slots(self) -> int:
        """Number of filled slots."""
        return sum(1 for s in self.slots if s.status != SlotStatus.EMPTY)

    @property
    def fill_rate(self) -> float:
        """Percentage of slots filled."""
        if self.total_slots == 0:
            return 0.0
        return (self.filled_slots / self.total_slots) * 100

    def get_slots_for_day(self, target_date: date) -> list:
        """Get all slots for a specific day."""
        return [s for s in self.slots if s.slot_date == target_date]

    def get_slots_for_platform(self, platform: Platform) -> list:
        """Get all slots for a specific platform."""
        return [s for s in self.slots if s.platform == platform]


@dataclass
class ContentMix:
    """Content mix analysis for a calendar period."""
    period_start: date
    period_end: date
    mix_counts: dict = field(default_factory=dict)
    total_content: int = 0

    def __post_init__(self):
        """Initialize mix counts for all types."""
        if not self.mix_counts:
            self.mix_counts = {t: 0 for t in ContentMixType}

    def add_content(self, content_type: ContentMixType):
        """Add content piece to mix."""
        self.mix_counts[content_type] = self.mix_counts.get(content_type, 0) + 1
        self.total_content += 1

    def get_percentage(self, content_type: ContentMixType) -> float:
        """Get percentage for a content type."""
        if self.total_content == 0:
            return 0.0
        return (self.mix_counts.get(content_type, 0) / self.total_content) * 100

    def get_deviation(self, content_type: ContentMixType) -> float:
        """Get deviation from target percentage."""
        actual = self.get_percentage(content_type)
        target = content_type.target_percentage
        return actual - target

    @property
    def is_balanced(self) -> bool:
        """Check if mix is within acceptable ranges."""
        for content_type in ContentMixType:
            if abs(self.get_deviation(content_type)) > 15:  # 15% tolerance
                return False
        return True

    @property
    def recommendations(self) -> list:
        """Generate rebalancing recommendations."""
        recs = []
        for content_type in ContentMixType:
            deviation = self.get_deviation(content_type)
            if deviation < -10:
                recs.append(f"Increase {content_type.value}: {abs(deviation):.1f}% below target")
            elif deviation > 10:
                recs.append(f"Reduce {content_type.value}: {deviation:.1f}% above target")
        return recs


@dataclass
class MonthlyCalendar:
    """Monthly content calendar for a brand."""
    brand_name: str
    year: int
    month: int
    weeks: list = field(default_factory=list)
    key_dates: list = field(default_factory=list)
    content_mix: Optional[ContentMix] = None

    def __post_init__(self):
        """Initialize calendar structure."""
        if not self.weeks:
            self._generate_weeks()
        if not self.content_mix:
            first_day = date(self.year, self.month, 1)
            last_day = date(self.year, self.month, calendar.monthrange(self.year, self.month)[1])
            self.content_mix = ContentMix(first_day, last_day)

    def _generate_weeks(self):
        """Generate weekly structures for the month."""
        first_day = date(self.year, self.month, 1)
        last_day = date(self.year, self.month, calendar.monthrange(self.year, self.month)[1])

        # Find first Monday
        current = first_day
        while current.weekday() != 0:
            current -= timedelta(days=1)

        # Generate weeks
        while current <= last_day:
            week = WeeklySchedule(
                brand_name=self.brand_name,
                week_start=current
            )
            self.weeks.append(week)
            current += timedelta(days=7)

    @property
    def total_posts_planned(self) -> int:
        """Total posts planned for the month."""
        return sum(week.filled_slots for week in self.weeks)

    @property
    def fill_rate(self) -> float:
        """Overall calendar fill rate."""
        total_slots = sum(week.total_slots for week in self.weeks)
        filled_slots = sum(week.filled_slots for week in self.weeks)
        if total_slots == 0:
            return 0.0
        return (filled_slots / total_slots) * 100

    @property
    def upcoming_key_dates(self) -> list:
        """Key dates requiring content."""
        return [kd for kd in self.key_dates if kd.needs_content]

    def add_key_date(self, key_date: KeyDate):
        """Add a key date to the calendar."""
        self.key_dates.append(key_date)

    def get_week_containing(self, target_date: date) -> Optional[WeeklySchedule]:
        """Get the week containing a specific date."""
        for week in self.weeks:
            if week.week_start <= target_date <= week.week_end:
                return week
        return None


@dataclass
class ResourceAllocation:
    """Resource allocation for content production."""
    resource_type: ResourceType
    resource_name: str
    weekly_capacity: int = 0
    assigned_slots: list = field(default_factory=list)

    def __post_init__(self):
        """Set default capacity."""
        if self.weekly_capacity == 0:
            self.weekly_capacity = self.resource_type.typical_capacity_per_week

    @property
    def utilized_capacity(self) -> int:
        """Number of slots assigned."""
        return len(self.assigned_slots)

    @property
    def available_capacity(self) -> int:
        """Remaining capacity."""
        return max(0, self.weekly_capacity - self.utilized_capacity)

    @property
    def utilization_rate(self) -> float:
        """Percentage of capacity utilized."""
        if self.weekly_capacity == 0:
            return 0.0
        return (self.utilized_capacity / self.weekly_capacity) * 100

    @property
    def is_overloaded(self) -> bool:
        """Check if resource is overloaded."""
        return self.utilized_capacity > self.weekly_capacity


@dataclass
class CalendarGap:
    """Identified gap in the content calendar."""
    gap_date: date
    platform: Platform
    gap_type: str  # "no_content", "pillar_missing", "platform_underserved"
    severity: str  # "low", "medium", "high"
    recommendation: str = ""

    @property
    def days_until(self) -> int:
        """Days until gap date."""
        return (self.gap_date - date.today()).days


# ============================================================
# ENGINE CLASSES
# ============================================================

class CalendarArchitectEngine:
    """Engine for building and managing calendars."""

    def create_monthly_calendar(self, brand_name: str, year: int,
                               month: int, platforms: list = None) -> MonthlyCalendar:
        """Create a new monthly calendar."""
        cal = MonthlyCalendar(brand_name=brand_name, year=year, month=month)

        # Generate slots for each week
        platforms = platforms or [
            Platform.INSTAGRAM_FEED,
            Platform.INSTAGRAM_STORIES,
            Platform.TIKTOK,
            Platform.LINKEDIN
        ]

        for week in cal.weeks:
            week.platforms = platforms
            self._populate_week_slots(week)

        return cal

    def _populate_week_slots(self, week: WeeklySchedule):
        """Populate a week with default slots."""
        for day_offset in range(7):
            slot_date = week.week_start + timedelta(days=day_offset)
            day = DayOfWeek(slot_date.weekday())

            for platform in week.platforms:
                # Check if this day is good for this platform
                if slot_date.strftime("%A") in platform.best_days:
                    # Add slots at peak times
                    for time_slot in platform.peak_times[:2]:  # Max 2 per day
                        slot = CalendarSlot(
                            slot_date=slot_date,
                            platform=platform,
                            time_slot=time_slot
                        )
                        week.slots.append(slot)

    def identify_gaps(self, calendar: MonthlyCalendar) -> list:
        """Identify gaps in the calendar."""
        gaps = []

        for week in calendar.weeks:
            # Check each day
            for day_offset in range(7):
                check_date = week.week_start + timedelta(days=day_offset)

                # Skip past dates
                if check_date < date.today():
                    continue

                # Check each platform
                for platform in week.platforms:
                    day_slots = [s for s in week.slots
                                if s.slot_date == check_date and s.platform == platform]

                    # Check for empty days on important platforms
                    if len(day_slots) == 0:
                        if check_date.strftime("%A") in platform.best_days:
                            gaps.append(CalendarGap(
                                gap_date=check_date,
                                platform=platform,
                                gap_type="no_content",
                                severity="medium",
                                recommendation=f"Add {platform.value} content for {check_date}"
                            ))

                    # Check for all empty slots
                    filled = sum(1 for s in day_slots if s.status != SlotStatus.EMPTY)
                    if len(day_slots) > 0 and filled == 0:
                        gaps.append(CalendarGap(
                            gap_date=check_date,
                            platform=platform,
                            gap_type="slots_empty",
                            severity="low",
                            recommendation=f"Fill {platform.value} slots for {check_date}"
                        ))

        return gaps

    def optimize_schedule(self, calendar: MonthlyCalendar) -> dict:
        """Analyze and optimize calendar schedule."""
        recommendations = []
        score = 100

        for week in calendar.weeks:
            for slot in week.slots:
                if slot.status != SlotStatus.EMPTY:
                    if not slot.is_optimal_day:
                        recommendations.append(
                            f"Move {slot.slot_date} {slot.platform.value} to optimal day"
                        )
                        score -= 2

                    if not slot.is_peak_time:
                        recommendations.append(
                            f"Adjust {slot.slot_date} {slot.platform.value} to peak time"
                        )
                        score -= 1

        return {
            "optimization_score": max(0, score),
            "recommendations": recommendations[:10]  # Top 10
        }


class ContentMixEngine:
    """Engine for content mix optimization."""

    def analyze_mix(self, calendar: MonthlyCalendar) -> ContentMix:
        """Analyze content mix for a calendar."""
        content_mix = ContentMix(
            period_start=date(calendar.year, calendar.month, 1),
            period_end=date(calendar.year, calendar.month,
                          calendar.monthrange(calendar.year, calendar.month)[1])
        )

        for week in calendar.weeks:
            for slot in week.slots:
                if slot.status != SlotStatus.EMPTY and slot.content_type:
                    content_mix.add_content(slot.content_type)

        return content_mix

    def suggest_content_type(self, calendar: MonthlyCalendar,
                            slot: CalendarSlot) -> ContentMixType:
        """Suggest content type for a slot based on mix balance."""
        current_mix = self.analyze_mix(calendar)
        day = slot.day_of_week

        # Find type that's most below target
        max_deficit = -100
        suggested = ContentMixType.EDUCATIONAL

        for content_type in ContentMixType:
            deficit = content_type.target_percentage - current_mix.get_percentage(content_type)

            # Bonus if it matches day theme
            day_bonus = 10 if self._matches_day_theme(content_type, day) else 0

            if deficit + day_bonus > max_deficit:
                max_deficit = deficit + day_bonus
                suggested = content_type

        return suggested

    def _matches_day_theme(self, content_type: ContentMixType,
                          day: DayOfWeek) -> bool:
        """Check if content type matches day's theme."""
        day_content_map = {
            DayOfWeek.MONDAY: ContentMixType.EDUCATIONAL,
            DayOfWeek.TUESDAY: ContentMixType.PROMOTIONAL,
            DayOfWeek.WEDNESDAY: ContentMixType.THOUGHT_LEADERSHIP,
            DayOfWeek.THURSDAY: ContentMixType.BEHIND_SCENES,
            DayOfWeek.FRIDAY: ContentMixType.ENTERTAINING,
            DayOfWeek.SATURDAY: ContentMixType.USER_GENERATED,
            DayOfWeek.SUNDAY: ContentMixType.INSPIRATIONAL
        }
        return day_content_map.get(day) == content_type

    def generate_mix_report(self, content_mix: ContentMix) -> dict:
        """Generate detailed mix analysis report."""
        report = {
            "total_content": content_mix.total_content,
            "is_balanced": content_mix.is_balanced,
            "type_breakdown": {},
            "recommendations": content_mix.recommendations
        }

        for content_type in ContentMixType:
            report["type_breakdown"][content_type.value] = {
                "count": content_mix.mix_counts.get(content_type, 0),
                "percentage": round(content_mix.get_percentage(content_type), 1),
                "target": content_type.target_percentage,
                "deviation": round(content_mix.get_deviation(content_type), 1)
            }

        return report


class DateIntelligenceEngine:
    """Engine for key date management and intelligence."""

    def __init__(self):
        self.key_dates_database = self._load_default_dates()

    def _load_default_dates(self) -> dict:
        """Load default key dates by month."""
        return {
            1: [
                {"day": 1, "name": "New Year's Day", "category": KeyDateCategory.HOLIDAY},
                {"day": 15, "name": "Martin Luther King Jr. Day", "category": KeyDateCategory.CULTURAL}
            ],
            2: [
                {"day": 14, "name": "Valentine's Day", "category": KeyDateCategory.HOLIDAY},
                {"day": 20, "name": "Presidents Day", "category": KeyDateCategory.HOLIDAY}
            ],
            3: [
                {"day": 8, "name": "International Women's Day", "category": KeyDateCategory.AWARENESS_DAY},
                {"day": 17, "name": "St. Patrick's Day", "category": KeyDateCategory.CULTURAL}
            ],
            4: [
                {"day": 22, "name": "Earth Day", "category": KeyDateCategory.AWARENESS_DAY}
            ],
            5: [
                {"day": 5, "name": "Cinco de Mayo", "category": KeyDateCategory.CULTURAL},
                {"day": 12, "name": "Mother's Day", "category": KeyDateCategory.HOLIDAY}
            ],
            6: [
                {"day": 16, "name": "Father's Day", "category": KeyDateCategory.HOLIDAY},
                {"day": 19, "name": "Juneteenth", "category": KeyDateCategory.CULTURAL}
            ],
            7: [
                {"day": 4, "name": "Independence Day", "category": KeyDateCategory.HOLIDAY}
            ],
            9: [
                {"day": 2, "name": "Labor Day", "category": KeyDateCategory.HOLIDAY}
            ],
            10: [
                {"day": 31, "name": "Halloween", "category": KeyDateCategory.HOLIDAY}
            ],
            11: [
                {"day": 11, "name": "Veterans Day", "category": KeyDateCategory.HOLIDAY},
                {"day": 28, "name": "Thanksgiving", "category": KeyDateCategory.HOLIDAY},
                {"day": 29, "name": "Black Friday", "category": KeyDateCategory.SEASONAL}
            ],
            12: [
                {"day": 25, "name": "Christmas", "category": KeyDateCategory.HOLIDAY},
                {"day": 31, "name": "New Year's Eve", "category": KeyDateCategory.HOLIDAY}
            ]
        }

    def get_key_dates_for_month(self, year: int, month: int) -> list:
        """Get all key dates for a specific month."""
        key_dates = []
        month_dates = self.key_dates_database.get(month, [])

        for date_info in month_dates:
            try:
                key_date = KeyDate(
                    date=date(year, month, date_info["day"]),
                    name=date_info["name"],
                    category=date_info["category"]
                )
                key_dates.append(key_date)
            except ValueError:
                pass  # Skip invalid dates

        return key_dates

    def add_custom_date(self, key_date: KeyDate):
        """Add a custom key date."""
        month = key_date.date.month
        if month not in self.key_dates_database:
            self.key_dates_database[month] = []

        self.key_dates_database[month].append({
            "day": key_date.date.day,
            "name": key_date.name,
            "category": key_date.category
        })

    def get_content_recommendations(self, key_date: KeyDate) -> list:
        """Get content recommendations for a key date."""
        base_recs = key_date.category.content_recommendations

        # Add date-specific recommendations
        specific_recs = {
            "Valentine's Day": ["Love-themed content", "Couples features", "Gift ideas"],
            "Black Friday": ["Sales announcements", "Deal teasers", "Shopping guides"],
            "Halloween": ["Costume ideas", "Themed content", "Spooky posts"],
            "Christmas": ["Gift guides", "Holiday wishes", "Year in review"]
        }

        return base_recs + specific_recs.get(key_date.name, [])


class ResourcePlannerEngine:
    """Engine for resource allocation and capacity planning."""

    def __init__(self):
        self.resources: list = []

    def add_resource(self, resource: ResourceAllocation):
        """Add a resource to the pool."""
        self.resources.append(resource)

    def allocate_slot(self, slot: CalendarSlot,
                     resource: ResourceAllocation) -> bool:
        """Allocate a slot to a resource."""
        if resource.available_capacity > 0:
            resource.assigned_slots.append(slot)
            slot.assigned_to = resource.resource_name
            return True
        return False

    def get_capacity_report(self) -> dict:
        """Generate capacity utilization report."""
        report = {
            "resources": [],
            "total_capacity": 0,
            "total_utilized": 0,
            "overloaded": []
        }

        for resource in self.resources:
            report["resources"].append({
                "name": resource.resource_name,
                "type": resource.resource_type.value,
                "capacity": resource.weekly_capacity,
                "utilized": resource.utilized_capacity,
                "available": resource.available_capacity,
                "utilization_rate": round(resource.utilization_rate, 1)
            })

            report["total_capacity"] += resource.weekly_capacity
            report["total_utilized"] += resource.utilized_capacity

            if resource.is_overloaded:
                report["overloaded"].append(resource.resource_name)

        return report

    def auto_allocate(self, week: WeeklySchedule) -> int:
        """Auto-allocate slots to available resources."""
        allocated = 0

        for slot in week.slots:
            if slot.assigned_to is None and slot.status != SlotStatus.EMPTY:
                for resource in self.resources:
                    if resource.available_capacity > 0:
                        if self.allocate_slot(slot, resource):
                            allocated += 1
                            break

        return allocated


class CalendarPlanner:
    """Main orchestrator for content calendar planning."""

    def __init__(self):
        self.architect = CalendarArchitectEngine()
        self.mix_engine = ContentMixEngine()
        self.date_intel = DateIntelligenceEngine()
        self.resource_planner = ResourcePlannerEngine()

    def create_calendar(self, brand_name: str, year: int, month: int,
                       platforms: list = None) -> MonthlyCalendar:
        """Create a complete monthly calendar."""
        # Create base calendar
        calendar = self.architect.create_monthly_calendar(
            brand_name, year, month, platforms
        )

        # Add key dates
        key_dates = self.date_intel.get_key_dates_for_month(year, month)
        for kd in key_dates:
            calendar.add_key_date(kd)

        return calendar

    def plan_week(self, brand_name: str, week_start: date,
                 platforms: list = None) -> WeeklySchedule:
        """Create a weekly content schedule."""
        week = WeeklySchedule(
            brand_name=brand_name,
            week_start=week_start,
            platforms=platforms or []
        )

        self.architect._populate_week_slots(week)
        return week

    def analyze_gaps(self, calendar: MonthlyCalendar) -> list:
        """Analyze and identify gaps in calendar."""
        return self.architect.identify_gaps(calendar)

    def get_mix_analysis(self, calendar: MonthlyCalendar) -> dict:
        """Get content mix analysis."""
        content_mix = self.mix_engine.analyze_mix(calendar)
        return self.mix_engine.generate_mix_report(content_mix)

    def optimize(self, calendar: MonthlyCalendar) -> dict:
        """Optimize calendar schedule."""
        return self.architect.optimize_schedule(calendar)

    def get_key_dates(self, year: int, month: int) -> list:
        """Get key dates for planning."""
        return self.date_intel.get_key_dates_for_month(year, month)


# ============================================================
# REPORTER CLASS
# ============================================================

class CalendarReporter:
    """Generate ASCII reports for calendar planning."""

    def generate_monthly_report(self, calendar: MonthlyCalendar) -> str:
        """Generate full monthly calendar report."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

        # Calculate stats
        total_posts = calendar.total_posts_planned
        fill_rate = calendar.fill_rate
        fill_bar = "█" * int(fill_rate / 10) + "░" * (10 - int(fill_rate / 10))

        # Status
        status_indicator = "●" if fill_rate >= 80 else "○"
        status_text = "Calendar Ready" if fill_rate >= 80 else "In Progress"

        month_name = calendar.monthrange(calendar.year, calendar.month)
        month_display = date(calendar.year, calendar.month, 1).strftime("%B %Y")

        report = f"""
CONTENT CALENDAR
═══════════════════════════════════════
Brand: {calendar.brand_name}
Period: {month_display}
Time: {timestamp}
═══════════════════════════════════════

CALENDAR OVERVIEW
────────────────────────────────────────
┌─────────────────────────────────────┐
│       CALENDAR STATUS               │
│                                     │
│  Brand: {calendar.brand_name:<25} │
│  Month: {month_display:<26} │
│  Total Posts: {total_posts:<22} │
│                                     │
│  Platforms: {len(calendar.weeks[0].platforms) if calendar.weeks else 0:<25} │
│  Key Dates: {len(calendar.key_dates):<25} │
│                                     │
│  Fill Rate: {fill_bar} {fill_rate:.0f}%   │
│  Status: [{status_indicator}] {status_text:<18} │
└─────────────────────────────────────┘
"""

        # Monthly grid
        report += """
MONTHLY VIEW
────────────────────────────────────────
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
"""

        # Generate calendar grid
        cal = calendar.Calendar()
        for week in cal.monthdays2calendar(calendar.year, calendar.month):
            row = "│"
            for day, weekday in week:
                if day == 0:
                    row += "     │"
                else:
                    # Count posts for this day
                    day_date = date(calendar.year, calendar.month, day)
                    posts = 0
                    for w in calendar.weeks:
                        for slot in w.slots:
                            if slot.slot_date == day_date and slot.status != SlotStatus.EMPTY:
                                posts += 1

                    if posts > 0:
                        row += f" {day:2d}● │"
                    else:
                        row += f" {day:2d}  │"
            report += row + "\n"

        report += "└─────┴─────┴─────┴─────┴─────┴─────┴─────┘\n"
        report += "Legend: ● = content scheduled\n"

        # Key dates section
        if calendar.key_dates:
            report += """
KEY DATES THIS MONTH
────────────────────────────────────────
| Date | Event | Content |
|------|-------|---------|
"""
            for kd in calendar.key_dates[:5]:
                content_status = "✓" if kd.content_planned else "○"
                report += f"| {kd.date.day:2d} | {kd.name[:20]:<20} | {content_status} |\n"

        # Content mix visualization
        report += """
CONTENT MIX TARGET
────────────────────────────────────────
┌─────────────────────────────────────┐
│  DISTRIBUTION TARGETS               │
│                                     │
│  Educational:  ██████████░░░░ 30%   │
│  Promotional:  ████░░░░░░░░░░ 15%   │
│  Entertaining: █████████░░░░░ 20%   │
│  UGC:          ███░░░░░░░░░░░ 10%   │
│  Inspirational:███░░░░░░░░░░░ 10%   │
│  Other:        █████░░░░░░░░░ 15%   │
└─────────────────────────────────────┘
"""

        # Checklist
        checks = [
            ("Monthly themes set", True),
            ("Content mix balanced", fill_rate >= 50),
            ("Key dates covered", any(kd.content_planned for kd in calendar.key_dates) if calendar.key_dates else True),
            ("All slots filled", fill_rate >= 90),
            ("Backup content ready", fill_rate >= 80)
        ]

        report += """
IMPLEMENTATION CHECKLIST
────────────────────────────────────────
"""
        for check_name, check_passed in checks:
            indicator = "●" if check_passed else "○"
            report += f"• [{indicator}] {check_name}\n"

        report += f"""
Calendar Status: {status_indicator} {status_text}
"""

        return report

    def generate_weekly_report(self, week: WeeklySchedule) -> str:
        """Generate weekly schedule report."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

        fill_rate = week.fill_rate
        fill_bar = "█" * int(fill_rate / 10) + "░" * (10 - int(fill_rate / 10))

        report = f"""
WEEKLY SCHEDULE
═══════════════════════════════════════
Brand: {week.brand_name}
Week: {week.week_start.strftime('%B %d')} - {week.week_end.strftime('%B %d, %Y')}
Time: {timestamp}
═══════════════════════════════════════

WEEK OVERVIEW
────────────────────────────────────────
┌─────────────────────────────────────┐
│  Total Slots: {week.total_slots:<22} │
│  Filled: {week.filled_slots:<27} │
│  Fill Rate: {fill_bar} {fill_rate:.0f}%   │
└─────────────────────────────────────┘

DAILY BREAKDOWN
────────────────────────────────────────
"""

        # Group by day
        for day_offset in range(7):
            day_date = week.week_start + timedelta(days=day_offset)
            day_name = day_date.strftime("%A")
            day_slots = week.get_slots_for_day(day_date)

            if day_slots:
                report += f"\n**{day_name} ({day_date.strftime('%m/%d')})**\n"
                report += "| Time | Platform | Type | Status |\n"
                report += "|------|----------|------|--------|\n"

                for slot in day_slots:
                    platform = slot.platform.value.replace('_', ' ').title()[:12]
                    content = slot.content_type.value[:10] if slot.content_type else "—"
                    status = slot.status.color_code
                    report += f"| {slot.time_slot} | {platform:<12} | {content:<10} | {status} |\n"

        return report

    def generate_gap_report(self, gaps: list) -> str:
        """Generate calendar gaps report."""
        if not gaps:
            return """
GAP ANALYSIS
═══════════════════════════════════════
No gaps identified. Calendar is complete.
"""

        report = f"""
GAP ANALYSIS
═══════════════════════════════════════
Gaps Found: {len(gaps)}
═══════════════════════════════════════

IDENTIFIED GAPS
────────────────────────────────────────
| Date | Platform | Type | Severity |
|------|----------|------|----------|
"""

        for gap in gaps[:15]:  # Top 15
            platform = gap.platform.value.replace('_', ' ').title()[:12]
            report += f"| {gap.gap_date.strftime('%m/%d')} | {platform:<12} | {gap.gap_type[:12]:<12} | {gap.severity:<8} |\n"

        report += """
RECOMMENDATIONS
────────────────────────────────────────
"""
        for gap in gaps[:5]:
            report += f"• {gap.recommendation}\n"

        return report


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="SOCIAL.CALENDAR.EXE - Content Calendar Planner"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Month command
    month_parser = subparsers.add_parser("month", help="Generate monthly calendar")
    month_parser.add_argument("brand", help="Brand name")
    month_parser.add_argument("--year", "-y", type=int,
                             default=datetime.now().year,
                             help="Year")
    month_parser.add_argument("--month", "-m", type=int,
                             default=datetime.now().month,
                             help="Month (1-12)")

    # Week command
    week_parser = subparsers.add_parser("week", help="Plan weekly schedule")
    week_parser.add_argument("brand", help="Brand name")
    week_parser.add_argument("--start", "-s", help="Week start date (YYYY-MM-DD)")

    # Dates command
    dates_parser = subparsers.add_parser("dates", help="List key dates")
    dates_parser.add_argument("--year", "-y", type=int,
                             default=datetime.now().year)
    dates_parser.add_argument("--month", "-m", type=int,
                             default=datetime.now().month)

    # Gaps command
    gaps_parser = subparsers.add_parser("gaps", help="Identify calendar gaps")
    gaps_parser.add_argument("brand", help="Brand name")

    # Mix command
    mix_parser = subparsers.add_parser("mix", help="Analyze content mix")
    mix_parser.add_argument("brand", help="Brand name")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Run demonstration")

    args = parser.parse_args()

    planner = CalendarPlanner()
    reporter = CalendarReporter()

    if args.command == "month":
        calendar = planner.create_calendar(
            brand_name=args.brand,
            year=args.year,
            month=args.month
        )
        print(reporter.generate_monthly_report(calendar))

    elif args.command == "week":
        if args.start:
            start = datetime.strptime(args.start, "%Y-%m-%d").date()
        else:
            today = date.today()
            start = today - timedelta(days=today.weekday())

        week = planner.plan_week(args.brand, start)
        print(reporter.generate_weekly_report(week))

    elif args.command == "dates":
        key_dates = planner.get_key_dates(args.year, args.month)

        print(f"\nKEY DATES - {date(args.year, args.month, 1).strftime('%B %Y')}")
        print("=" * 40)
        for kd in key_dates:
            print(f"{kd.date.strftime('%m/%d')} - {kd.name} ({kd.category.value})")

    elif args.command == "gaps":
        calendar = planner.create_calendar(
            brand_name=args.brand,
            year=datetime.now().year,
            month=datetime.now().month
        )
        gaps = planner.analyze_gaps(calendar)
        print(reporter.generate_gap_report(gaps))

    elif args.command == "mix":
        calendar = planner.create_calendar(
            brand_name=args.brand,
            year=datetime.now().year,
            month=datetime.now().month
        )
        mix_report = planner.get_mix_analysis(calendar)

        print("\nCONTENT MIX ANALYSIS")
        print("=" * 40)
        print(f"Total Content: {mix_report['total_content']}")
        print(f"Balanced: {'Yes' if mix_report['is_balanced'] else 'No'}")
        print("\nType Breakdown:")
        for content_type, data in mix_report['type_breakdown'].items():
            print(f"  {content_type}: {data['percentage']}% (target: {data['target']}%)")

    elif args.command == "demo":
        print("=" * 50)
        print("SOCIAL.CALENDAR.EXE - DEMONSTRATION")
        print("=" * 50)

        # Create demo calendar
        calendar = planner.create_calendar(
            brand_name="DemoCompany",
            year=datetime.now().year,
            month=datetime.now().month
        )

        print(reporter.generate_monthly_report(calendar))

        # Show key dates
        print("\nKEY DATES:")
        for kd in calendar.key_dates:
            print(f"  {kd.date.strftime('%m/%d')} - {kd.name}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW

### Phase 1: STRATEGIZE
1. Review brand objectives
2. Identify key dates
3. Define content pillars
4. Set posting frequency
5. Allocate resources

### Phase 2: PLAN
1. Map monthly themes
2. Distribute content types
3. Assign posting days
4. Schedule time slots
5. Coordinate across brands

### Phase 3: POPULATE
1. Create content briefs
2. Assign to creators
3. Set deadlines
4. Track production
5. Fill calendar slots

### Phase 4: OPTIMIZE
1. Review for gaps
2. Balance content mix
3. Adjust timing
4. Prepare backups
5. Finalize schedule

---

## QUICK COMMANDS

- `/social-calendar [brand] [month]` - Generate monthly calendar
- `/social-calendar week [brand]` - Plan weekly content schedule
- `/social-calendar dates [month]` - List key dates for month
- `/social-calendar gaps [brand]` - Identify scheduling gaps
- `/social-calendar mix [brand]` - Analyze content distribution

$ARGUMENTS
