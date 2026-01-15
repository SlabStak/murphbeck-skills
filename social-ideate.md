# SOCIAL.IDEATE.EXE - Content Ideation Engine

You are SOCIAL.IDEATE.EXE — the social media content brainstorming specialist that generates creative, on-brand content ideas aligned with strategy pillars, trending topics, and audience interests.

MISSION: Generate ideas. Spot trends. Fuel creativity.

---

## SYSTEM CONTEXT

This skill transforms content strategy into actionable content ideas through systematic brainstorming frameworks, trend analysis, and creative ideation techniques. It generates hooks, angles, and series concepts that align with brand pillars.

---

## IDEATION ENGINE IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
SOCIAL.IDEATE.EXE - Content Ideation Engine
Generates creative, on-brand content ideas aligned with strategy pillars.
"""

from dataclasses import dataclass, field
from datetime import datetime, date, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any, Tuple
import random
import json
import argparse


# ============================================================
# ENUMS - Content Ideation Domain
# ============================================================

class ContentPillar(Enum):
    """Core content pillars for brand strategy."""
    EDUCATIONAL = "educational"
    ENTERTAINING = "entertaining"
    INSPIRATIONAL = "inspirational"
    PROMOTIONAL = "promotional"
    COMMUNITY = "community"
    BEHIND_THE_SCENES = "behind_the_scenes"
    USER_GENERATED = "user_generated"
    THOUGHT_LEADERSHIP = "thought_leadership"

    @property
    def description(self) -> str:
        """Pillar description."""
        descriptions = {
            "educational": "Teach, inform, and provide value",
            "entertaining": "Amuse, delight, and engage",
            "inspirational": "Motivate, uplift, and connect emotionally",
            "promotional": "Showcase products, services, and offers",
            "community": "Build relationships and foster connection",
            "behind_the_scenes": "Show authenticity and transparency",
            "user_generated": "Leverage customer content and stories",
            "thought_leadership": "Establish expertise and industry authority"
        }
        return descriptions.get(self.value, "")

    @property
    def recommended_ratio(self) -> float:
        """Recommended percentage in content mix."""
        ratios = {
            "educational": 0.25,
            "entertaining": 0.20,
            "inspirational": 0.15,
            "promotional": 0.15,
            "community": 0.10,
            "behind_the_scenes": 0.05,
            "user_generated": 0.05,
            "thought_leadership": 0.05
        }
        return ratios.get(self.value, 0.10)

    @property
    def funnel_stage(self) -> str:
        """Primary funnel stage this pillar serves."""
        stages = {
            "educational": "awareness",
            "entertaining": "awareness",
            "inspirational": "awareness",
            "promotional": "conversion",
            "community": "retention",
            "behind_the_scenes": "consideration",
            "user_generated": "advocacy",
            "thought_leadership": "awareness"
        }
        return stages.get(self.value, "awareness")

    @property
    def example_formats(self) -> List[str]:
        """Example content formats for this pillar."""
        formats = {
            "educational": ["how-to", "tips", "tutorials", "explainers", "guides"],
            "entertaining": ["memes", "trends", "humor", "challenges", "reactions"],
            "inspirational": ["quotes", "success stories", "transformations", "motivation"],
            "promotional": ["product showcase", "launches", "sales", "features", "demos"],
            "community": ["polls", "Q&A", "shoutouts", "conversations", "spotlights"],
            "behind_the_scenes": ["day-in-life", "team intro", "process", "bloopers", "office"],
            "user_generated": ["reviews", "testimonials", "reposts", "features", "collabs"],
            "thought_leadership": ["insights", "predictions", "opinions", "analysis", "trends"]
        }
        return formats.get(self.value, [])


class IdeationFramework(Enum):
    """Brainstorming frameworks for content ideation."""
    FOUR_H = "4h_method"
    TREND_REMIX = "trend_remix"
    PAIN_SOLUTION = "pain_solution"
    STORY_ARC = "story_arc"
    LIST_FORMAT = "list_format"
    CONTRAST = "contrast"
    QUESTION_HOOK = "question_hook"
    MYTH_BUST = "myth_bust"
    PREDICTION = "prediction"
    TRANSFORMATION = "transformation"

    @property
    def structure(self) -> str:
        """Framework structure description."""
        structures = {
            "4h_method": "Helpful, Humorous, Heartfelt, Hype",
            "trend_remix": "Trend + Brand Angle",
            "pain_solution": "Problem → Agitate → Solve",
            "story_arc": "Setup → Conflict → Resolution",
            "list_format": "Number + Hook + Value",
            "contrast": "Before vs After / Expectation vs Reality",
            "question_hook": "Provocative Question → Answer",
            "myth_bust": "Common Belief → Truth Reveal",
            "prediction": "Trend Analysis → Future Vision",
            "transformation": "Journey + Results + How"
        }
        return structures.get(self.value, "")

    @property
    def best_for(self) -> str:
        """Primary use case for this framework."""
        uses = {
            "4h_method": "Content variety and balance",
            "trend_remix": "Viral potential and relevance",
            "pain_solution": "Educational and problem-solving",
            "story_arc": "Emotional connection and engagement",
            "list_format": "Easy consumption and saves",
            "contrast": "Visual impact and relatability",
            "question_hook": "Engagement and curiosity",
            "myth_bust": "Authority building and debate",
            "prediction": "Thought leadership and discussion",
            "transformation": "Social proof and inspiration"
        }
        return uses.get(self.value, "")

    @property
    def template(self) -> str:
        """Hook template for this framework."""
        templates = {
            "4h_method": "[Choose: Help them with X / Make them laugh about X / Make them feel X / Get them excited about X]",
            "trend_remix": "[Trending Sound/Format] + [Your Brand Twist]",
            "pain_solution": "Are you struggling with [pain point]? Here's how to fix it...",
            "story_arc": "I used to [problem]. Then [turning point]. Now [result].",
            "list_format": "[Number] [things/ways/secrets] to [achieve outcome]",
            "contrast": "[Expectation] vs [Reality] / [Before] → [After]",
            "question_hook": "Why does everyone think [common belief]? The truth is...",
            "myth_bust": "Stop believing that [myth]. Here's what actually works...",
            "prediction": "In [timeframe], [industry/topic] will look completely different. Here's why...",
            "transformation": "From [starting point] to [end result] in [timeframe]. Here's exactly how..."
        }
        return templates.get(self.value, "")


class HookType(Enum):
    """Types of content hooks for attention capture."""
    QUESTION = "question"
    CONTROVERSIAL = "controversial"
    LIST = "list"
    STORY = "story"
    MYTH_BUST = "myth_bust"
    PREDICTION = "prediction"
    SECRET = "secret"
    MISTAKE = "mistake"
    COMPARISON = "comparison"
    CHALLENGE = "challenge"

    @property
    def example(self) -> str:
        """Example hook of this type."""
        examples = {
            "question": "Are you making this mistake?",
            "controversial": "Unpopular opinion...",
            "list": "5 things nobody tells you about...",
            "story": "How we went from X to Y...",
            "myth_bust": "Stop believing this...",
            "prediction": "The future of X is...",
            "secret": "The industry secret nobody shares...",
            "mistake": "I wasted $X on this mistake...",
            "comparison": "X vs Y - which one wins?",
            "challenge": "Try this for 7 days and watch what happens..."
        }
        return examples.get(self.value, "")

    @property
    def engagement_driver(self) -> str:
        """What drives engagement for this hook."""
        drivers = {
            "question": "Curiosity and self-reflection",
            "controversial": "Debate and strong opinions",
            "list": "Promise of value and easy consumption",
            "story": "Emotional connection and relatability",
            "myth_bust": "Surprise and authority",
            "prediction": "Fear of missing out and forward thinking",
            "secret": "Exclusivity and insider knowledge",
            "mistake": "Learning from failure and relatability",
            "comparison": "Decision-making help and debate",
            "challenge": "Community participation and results"
        }
        return drivers.get(self.value, "")

    @property
    def best_platforms(self) -> List[str]:
        """Platforms where this hook works best."""
        platforms = {
            "question": ["instagram", "twitter", "linkedin"],
            "controversial": ["twitter", "tiktok", "linkedin"],
            "list": ["instagram", "pinterest", "linkedin"],
            "story": ["instagram", "facebook", "youtube"],
            "myth_bust": ["tiktok", "youtube", "linkedin"],
            "prediction": ["linkedin", "twitter", "youtube"],
            "secret": ["tiktok", "instagram", "youtube"],
            "mistake": ["linkedin", "youtube", "tiktok"],
            "comparison": ["youtube", "tiktok", "instagram"],
            "challenge": ["tiktok", "instagram", "youtube"]
        }
        return platforms.get(self.value, [])


class ContentFormat(Enum):
    """Content format types for different platforms."""
    CAROUSEL = "carousel"
    REEL = "reel"
    STORY = "story"
    STATIC_POST = "static_post"
    VIDEO = "video"
    THREAD = "thread"
    LIVE = "live"
    POLL = "poll"
    QUOTE_CARD = "quote_card"
    INFOGRAPHIC = "infographic"
    MEME = "meme"
    TUTORIAL = "tutorial"

    @property
    def platforms(self) -> List[str]:
        """Platforms supporting this format."""
        platform_map = {
            "carousel": ["instagram", "linkedin", "facebook"],
            "reel": ["instagram", "facebook", "tiktok"],
            "story": ["instagram", "facebook", "snapchat"],
            "static_post": ["instagram", "facebook", "linkedin", "twitter", "pinterest"],
            "video": ["youtube", "tiktok", "linkedin", "twitter", "facebook"],
            "thread": ["twitter", "threads"],
            "live": ["instagram", "facebook", "youtube", "tiktok", "linkedin"],
            "poll": ["twitter", "instagram", "linkedin", "youtube"],
            "quote_card": ["instagram", "twitter", "linkedin", "pinterest"],
            "infographic": ["pinterest", "linkedin", "instagram"],
            "meme": ["twitter", "instagram", "tiktok", "reddit"],
            "tutorial": ["youtube", "tiktok", "instagram"]
        }
        return platform_map.get(self.value, [])

    @property
    def production_complexity(self) -> str:
        """Production complexity level."""
        complexity = {
            "carousel": "medium",
            "reel": "medium",
            "story": "low",
            "static_post": "low",
            "video": "high",
            "thread": "low",
            "live": "medium",
            "poll": "low",
            "quote_card": "low",
            "infographic": "high",
            "meme": "low",
            "tutorial": "high"
        }
        return complexity.get(self.value, "medium")

    @property
    def engagement_potential(self) -> str:
        """Typical engagement level."""
        engagement = {
            "carousel": "high",
            "reel": "very_high",
            "story": "medium",
            "static_post": "low",
            "video": "high",
            "thread": "medium",
            "live": "very_high",
            "poll": "high",
            "quote_card": "medium",
            "infographic": "medium",
            "meme": "high",
            "tutorial": "high"
        }
        return engagement.get(self.value, "medium")

    @property
    def ideal_for_pillars(self) -> List[str]:
        """Content pillars this format serves best."""
        pillars = {
            "carousel": ["educational", "promotional", "thought_leadership"],
            "reel": ["entertaining", "behind_the_scenes", "educational"],
            "story": ["community", "behind_the_scenes", "promotional"],
            "static_post": ["inspirational", "promotional", "community"],
            "video": ["educational", "entertaining", "thought_leadership"],
            "thread": ["educational", "thought_leadership"],
            "live": ["community", "behind_the_scenes", "educational"],
            "poll": ["community", "entertaining"],
            "quote_card": ["inspirational", "thought_leadership"],
            "infographic": ["educational", "thought_leadership"],
            "meme": ["entertaining", "community"],
            "tutorial": ["educational", "thought_leadership"]
        }
        return pillars.get(self.value, [])


class TrendStatus(Enum):
    """Status of trends in lifecycle."""
    EMERGING = "emerging"
    RISING = "rising"
    PEAK = "peak"
    DECLINING = "declining"
    EVERGREEN = "evergreen"

    @property
    def action_urgency(self) -> str:
        """How urgently to act on this trend."""
        urgency = {
            "emerging": "Monitor closely, prepare content",
            "rising": "Act now for maximum impact",
            "peak": "Last chance for relevance",
            "declining": "Avoid unless unique angle",
            "evergreen": "Can use anytime"
        }
        return urgency.get(self.value, "")

    @property
    def risk_level(self) -> str:
        """Risk of using this trend."""
        risk = {
            "emerging": "low",
            "rising": "low",
            "peak": "medium",
            "declining": "high",
            "evergreen": "very_low"
        }
        return risk.get(self.value, "medium")

    @property
    def expected_lifespan_days(self) -> int:
        """Expected remaining lifespan in days."""
        lifespan = {
            "emerging": 14,
            "rising": 7,
            "peak": 3,
            "declining": 1,
            "evergreen": 365
        }
        return lifespan.get(self.value, 7)


class IdeaPriority(Enum):
    """Priority levels for content ideas."""
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    BACKLOG = "backlog"

    @property
    def icon(self) -> str:
        """Visual icon for priority."""
        icons = {
            "urgent": "🔴",
            "high": "🟠",
            "medium": "🟡",
            "low": "🟢",
            "backlog": "⚪"
        }
        return icons.get(self.value, "⚪")

    @property
    def weight(self) -> int:
        """Numeric weight for sorting."""
        weights = {
            "urgent": 100,
            "high": 75,
            "medium": 50,
            "low": 25,
            "backlog": 10
        }
        return weights.get(self.value, 10)

    @property
    def action_timeline(self) -> str:
        """When to act on this priority."""
        timelines = {
            "urgent": "Within 24 hours",
            "high": "This week",
            "medium": "Next 2 weeks",
            "low": "This month",
            "backlog": "When capacity allows"
        }
        return timelines.get(self.value, "")


class FunnelStage(Enum):
    """Marketing funnel stages for content alignment."""
    AWARENESS = "awareness"
    CONSIDERATION = "consideration"
    CONVERSION = "conversion"
    RETENTION = "retention"
    ADVOCACY = "advocacy"

    @property
    def goal(self) -> str:
        """Primary goal for this stage."""
        goals = {
            "awareness": "Reach new audiences and build brand recognition",
            "consideration": "Educate and build trust with interested prospects",
            "conversion": "Drive purchases and sign-ups",
            "retention": "Keep existing customers engaged and happy",
            "advocacy": "Turn customers into brand ambassadors"
        }
        return goals.get(self.value, "")

    @property
    def content_types(self) -> List[str]:
        """Best content types for this stage."""
        types = {
            "awareness": ["entertaining", "viral", "trends", "memes"],
            "consideration": ["educational", "tutorials", "comparisons", "case studies"],
            "conversion": ["testimonials", "demos", "offers", "urgency"],
            "retention": ["tips", "community", "exclusive", "behind-scenes"],
            "advocacy": ["user-generated", "reviews", "referral", "features"]
        }
        return types.get(self.value, [])

    @property
    def key_metrics(self) -> List[str]:
        """Key metrics to track for this stage."""
        metrics = {
            "awareness": ["reach", "impressions", "followers", "brand mentions"],
            "consideration": ["engagement rate", "saves", "shares", "time on content"],
            "conversion": ["click-through rate", "conversions", "revenue", "ROAS"],
            "retention": ["return rate", "DMs", "comments", "repeat engagement"],
            "advocacy": ["UGC volume", "referrals", "reviews", "testimonials"]
        }
        return metrics.get(self.value, [])


# ============================================================
# DATACLASSES - Content Ideation Structures
# ============================================================

@dataclass
class ContentIdea:
    """A single content idea with metadata."""
    idea_id: str
    title: str
    hook: str
    pillar: ContentPillar
    format: ContentFormat
    platform: str
    framework: IdeationFramework
    hook_type: HookType
    description: str = ""
    talking_points: List[str] = field(default_factory=list)
    hashtags: List[str] = field(default_factory=list)
    cta: str = ""
    funnel_stage: FunnelStage = FunnelStage.AWARENESS
    priority: IdeaPriority = IdeaPriority.MEDIUM
    potential_score: int = 50
    trend_based: bool = False
    series_name: Optional[str] = None
    references: List[str] = field(default_factory=list)
    production_notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def is_high_priority(self) -> bool:
        """Check if idea is high priority."""
        return self.priority in [IdeaPriority.URGENT, IdeaPriority.HIGH]

    @property
    def is_series_content(self) -> bool:
        """Check if part of a series."""
        return self.series_name is not None

    @property
    def complexity_score(self) -> int:
        """Calculate production complexity score (0-100)."""
        complexity_map = {"low": 25, "medium": 50, "high": 75}
        base = complexity_map.get(self.format.production_complexity, 50)
        if self.trend_based:
            base -= 10  # Trending content often simpler
        if self.is_series_content:
            base -= 15  # Series have established templates
        return max(10, min(100, base))

    @property
    def engagement_forecast(self) -> str:
        """Forecast engagement level."""
        engagement_map = {"low": 25, "medium": 50, "high": 75, "very_high": 90}
        base = engagement_map.get(self.format.engagement_potential, 50)

        if self.trend_based:
            base += 15
        if self.hook_type in [HookType.CONTROVERSIAL, HookType.QUESTION]:
            base += 10
        if self.potential_score > 70:
            base += 10

        score = min(100, base)
        if score >= 80:
            return "High"
        elif score >= 60:
            return "Medium-High"
        elif score >= 40:
            return "Medium"
        else:
            return "Low"


@dataclass
class TrendOpportunity:
    """A trending topic with brand angle potential."""
    trend_id: str
    trend_name: str
    platform: str
    status: TrendStatus
    description: str = ""
    brand_angle: str = ""
    example_content: str = ""
    sound_or_audio: Optional[str] = None
    hashtags: List[str] = field(default_factory=list)
    competitor_usage: List[str] = field(default_factory=list)
    discovered_at: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None

    @property
    def urgency_score(self) -> int:
        """Calculate urgency to act (0-100)."""
        base_scores = {
            TrendStatus.EMERGING: 40,
            TrendStatus.RISING: 80,
            TrendStatus.PEAK: 95,
            TrendStatus.DECLINING: 20,
            TrendStatus.EVERGREEN: 30
        }
        return base_scores.get(self.status, 50)

    @property
    def days_remaining(self) -> int:
        """Estimated days of relevance remaining."""
        if self.expires_at:
            return max(0, (self.expires_at - datetime.now()).days)
        return self.status.expected_lifespan_days

    @property
    def is_actionable(self) -> bool:
        """Whether this trend is worth acting on."""
        return self.status not in [TrendStatus.DECLINING] and bool(self.brand_angle)


@dataclass
class ContentSeries:
    """A recurring content series concept."""
    series_id: str
    name: str
    description: str
    pillar: ContentPillar
    format: ContentFormat
    frequency: str  # weekly, daily, etc.
    template: str = ""
    hashtag: str = ""
    past_topics: List[str] = field(default_factory=list)
    upcoming_topics: List[str] = field(default_factory=list)
    performance_avg: float = 0.0
    total_episodes: int = 0

    @property
    def is_performing_well(self) -> bool:
        """Check if series performs above average."""
        return self.performance_avg > 3.0  # Above 3% engagement

    @property
    def needs_refresh(self) -> bool:
        """Check if series needs creative refresh."""
        return self.total_episodes > 20 and self.performance_avg < 2.0


@dataclass
class IdeaBacklog:
    """Collection of content ideas in backlog."""
    brand_name: str
    ideas: List[ContentIdea] = field(default_factory=list)
    trends: List[TrendOpportunity] = field(default_factory=list)
    series: List[ContentSeries] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def total_ideas(self) -> int:
        """Total number of ideas."""
        return len(self.ideas)

    @property
    def high_priority_count(self) -> int:
        """Count of high priority ideas."""
        return len([i for i in self.ideas if i.is_high_priority])

    @property
    def trend_based_count(self) -> int:
        """Count of trend-based ideas."""
        return len([i for i in self.ideas if i.trend_based])

    @property
    def series_content_count(self) -> int:
        """Count of series content ideas."""
        return len([i for i in self.ideas if i.is_series_content])

    @property
    def by_pillar(self) -> Dict[str, int]:
        """Ideas grouped by pillar."""
        counts = {}
        for idea in self.ideas:
            pillar = idea.pillar.value
            counts[pillar] = counts.get(pillar, 0) + 1
        return counts

    @property
    def by_platform(self) -> Dict[str, int]:
        """Ideas grouped by platform."""
        counts = {}
        for idea in self.ideas:
            counts[idea.platform] = counts.get(idea.platform, 0) + 1
        return counts

    @property
    def creativity_score(self) -> int:
        """Overall creativity score for backlog (0-100)."""
        if not self.ideas:
            return 0

        score = 50  # Base score

        # Variety bonus
        unique_pillars = len(set(i.pillar for i in self.ideas))
        score += unique_pillars * 5

        # Trend bonus
        trend_ratio = self.trend_based_count / len(self.ideas)
        score += int(trend_ratio * 20)

        # High potential bonus
        high_potential = len([i for i in self.ideas if i.potential_score > 70])
        score += min(20, high_potential * 2)

        return min(100, score)


@dataclass
class IdeationSession:
    """A brainstorming session record."""
    session_id: str
    brand_name: str
    theme: str
    frameworks_used: List[IdeationFramework]
    ideas_generated: List[ContentIdea] = field(default_factory=list)
    trends_explored: List[TrendOpportunity] = field(default_factory=list)
    duration_minutes: int = 0
    participants: List[str] = field(default_factory=list)
    notes: str = ""
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None

    @property
    def is_complete(self) -> bool:
        """Check if session is complete."""
        return self.completed_at is not None

    @property
    def ideas_per_hour(self) -> float:
        """Ideas generated per hour."""
        if self.duration_minutes <= 0:
            return 0.0
        return len(self.ideas_generated) / (self.duration_minutes / 60)

    @property
    def quality_score(self) -> int:
        """Quality score based on idea potential."""
        if not self.ideas_generated:
            return 0
        avg_potential = sum(i.potential_score for i in self.ideas_generated) / len(self.ideas_generated)
        return int(avg_potential)


# ============================================================
# ENGINE CLASSES - Ideation Processing
# ============================================================

class HookGenerator:
    """Generates content hooks based on frameworks."""

    def __init__(self):
        self.hook_templates = self._load_templates()

    def _load_templates(self) -> Dict[str, List[str]]:
        """Load hook templates by type."""
        return {
            "question": [
                "Are you making this {topic} mistake?",
                "What if {topic} could be different?",
                "Why does everyone get {topic} wrong?",
                "Is {topic} actually worth it?",
                "What's the real cost of {topic}?"
            ],
            "controversial": [
                "Unpopular opinion: {topic}",
                "Hot take: {topic} is overrated",
                "I'm going to get hate for this, but {topic}",
                "Everyone says {topic}, but they're wrong",
                "The {topic} advice that's actually hurting you"
            ],
            "list": [
                "{number} {topic} tips nobody talks about",
                "{number} ways to improve your {topic}",
                "{number} {topic} mistakes to avoid",
                "{number} secrets the pros know about {topic}",
                "{number} {topic} hacks that actually work"
            ],
            "story": [
                "How I went from {before} to {after}",
                "The {topic} journey that changed everything",
                "What happened when I tried {topic}",
                "My biggest {topic} failure (and what I learned)",
                "From zero to {outcome}: my {topic} story"
            ],
            "myth_bust": [
                "Stop believing this {topic} myth",
                "The {topic} advice you should ignore",
                "{topic}: what they don't tell you",
                "The truth about {topic} nobody shares",
                "Why everything you know about {topic} is wrong"
            ],
            "prediction": [
                "The future of {topic} looks like this",
                "In {timeframe}, {topic} will change forever",
                "Here's what's coming next for {topic}",
                "{topic} in {year}: my predictions",
                "The {topic} trends that will dominate"
            ],
            "secret": [
                "The {topic} secret nobody shares",
                "What industry insiders know about {topic}",
                "The hidden truth about {topic}",
                "The {topic} hack they don't want you to know",
                "Inside information on {topic}"
            ],
            "mistake": [
                "I wasted ${amount} making this {topic} mistake",
                "The {topic} error that cost me everything",
                "Don't make this {topic} mistake (I did)",
                "My biggest {topic} regret",
                "The {topic} trap I fell into"
            ],
            "comparison": [
                "{option_a} vs {option_b}: which wins?",
                "I tried both {option_a} and {option_b}. Here's the verdict",
                "{option_a} or {option_b}? The definitive answer",
                "The real difference between {option_a} and {option_b}",
                "Why I switched from {option_a} to {option_b}"
            ],
            "challenge": [
                "Try this {topic} challenge for 7 days",
                "The {topic} experiment that changed my life",
                "I did {topic} for 30 days. Here's what happened",
                "The {topic} challenge you need to try",
                "What happens when you commit to {topic}"
            ]
        }

    def generate_hook(
        self,
        hook_type: HookType,
        topic: str,
        **kwargs
    ) -> str:
        """Generate a hook based on type and topic."""
        templates = self.hook_templates.get(hook_type.value, [])
        if not templates:
            return f"Discover the truth about {topic}"

        template = random.choice(templates)

        # Fill in template variables
        replacements = {
            "topic": topic,
            "number": kwargs.get("number", "5"),
            "before": kwargs.get("before", "struggling"),
            "after": kwargs.get("after", "thriving"),
            "outcome": kwargs.get("outcome", "success"),
            "timeframe": kwargs.get("timeframe", "2025"),
            "year": kwargs.get("year", "2025"),
            "amount": kwargs.get("amount", "10,000"),
            "option_a": kwargs.get("option_a", "Option A"),
            "option_b": kwargs.get("option_b", "Option B")
        }

        for key, value in replacements.items():
            template = template.replace("{" + key + "}", str(value))

        return template

    def generate_variations(
        self,
        topic: str,
        count: int = 5
    ) -> List[Dict[str, str]]:
        """Generate multiple hook variations for a topic."""
        variations = []
        hook_types = list(HookType)

        for i in range(min(count, len(hook_types))):
            hook_type = hook_types[i]
            hook = self.generate_hook(hook_type, topic)
            variations.append({
                "type": hook_type.value,
                "hook": hook,
                "engagement_driver": hook_type.engagement_driver,
                "best_platforms": ", ".join(hook_type.best_platforms)
            })

        return variations


class TrendScanner:
    """Scans and analyzes trending topics."""

    def __init__(self):
        self.trend_sources = [
            "tiktok_trending",
            "instagram_explore",
            "twitter_trending",
            "youtube_trending",
            "google_trends"
        ]

    def analyze_trend(
        self,
        trend_name: str,
        platform: str = "tiktok"
    ) -> TrendOpportunity:
        """Analyze a trend and return opportunity assessment."""
        # Simulate trend analysis
        trend_id = f"trend_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        # Determine status based on some heuristics (in production, this would use real data)
        statuses = list(TrendStatus)
        status = random.choice(statuses[:3])  # Mostly emerging, rising, or peak

        expires_at = datetime.now() + timedelta(days=status.expected_lifespan_days)

        return TrendOpportunity(
            trend_id=trend_id,
            trend_name=trend_name,
            platform=platform,
            status=status,
            description=f"Trending topic: {trend_name}",
            brand_angle=f"Connect {trend_name} to your brand's unique perspective",
            discovered_at=datetime.now(),
            expires_at=expires_at
        )

    def find_brand_angle(
        self,
        trend: TrendOpportunity,
        brand_keywords: List[str]
    ) -> str:
        """Find a brand-relevant angle for a trend."""
        if not brand_keywords:
            return f"Put your unique spin on {trend.trend_name}"

        keyword = random.choice(brand_keywords)
        angles = [
            f"Show how {trend.trend_name} relates to {keyword}",
            f"Use {trend.trend_name} to highlight your {keyword}",
            f"Create a {keyword}-focused version of {trend.trend_name}",
            f"Remix {trend.trend_name} with your {keyword} expertise"
        ]

        return random.choice(angles)


class IdeationEngine:
    """Main engine for generating content ideas."""

    def __init__(self):
        self.hook_generator = HookGenerator()
        self.trend_scanner = TrendScanner()

    def generate_idea(
        self,
        brand_name: str,
        topic: str,
        pillar: ContentPillar,
        platform: str,
        framework: Optional[IdeationFramework] = None
    ) -> ContentIdea:
        """Generate a single content idea."""
        if framework is None:
            framework = random.choice(list(IdeationFramework))

        # Select appropriate format for platform
        format_choices = [f for f in ContentFormat if platform in f.platforms]
        content_format = random.choice(format_choices) if format_choices else ContentFormat.STATIC_POST

        # Select hook type
        hook_type = random.choice(list(HookType))

        # Generate hook
        hook = self.hook_generator.generate_hook(hook_type, topic)

        # Calculate potential score
        potential_score = self._calculate_potential(pillar, content_format, hook_type)

        idea_id = f"idea_{datetime.now().strftime('%Y%m%d%H%M%S')}_{random.randint(1000, 9999)}"

        return ContentIdea(
            idea_id=idea_id,
            title=f"{topic.title()} - {framework.value.replace('_', ' ').title()}",
            hook=hook,
            pillar=pillar,
            format=content_format,
            platform=platform,
            framework=framework,
            hook_type=hook_type,
            description=f"Content about {topic} using {framework.structure}",
            potential_score=potential_score,
            funnel_stage=FunnelStage(pillar.funnel_stage)
        )

    def _calculate_potential(
        self,
        pillar: ContentPillar,
        content_format: ContentFormat,
        hook_type: HookType
    ) -> int:
        """Calculate potential score for an idea."""
        base_score = 50

        # Format engagement boost
        engagement_boost = {
            "very_high": 25,
            "high": 15,
            "medium": 5,
            "low": 0
        }
        base_score += engagement_boost.get(content_format.engagement_potential, 5)

        # Hook type boost
        high_engagement_hooks = [HookType.QUESTION, HookType.CONTROVERSIAL, HookType.STORY]
        if hook_type in high_engagement_hooks:
            base_score += 10

        # Add some randomness
        base_score += random.randint(-10, 10)

        return max(10, min(100, base_score))

    def brainstorm_session(
        self,
        brand_name: str,
        theme: str,
        pillars: List[ContentPillar],
        platforms: List[str],
        idea_count: int = 10
    ) -> IdeationSession:
        """Run a full brainstorming session."""
        session_id = f"session_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        frameworks_used = random.sample(list(IdeationFramework), min(5, len(IdeationFramework)))

        ideas = []
        for i in range(idea_count):
            pillar = random.choice(pillars)
            platform = random.choice(platforms)
            framework = random.choice(frameworks_used)

            idea = self.generate_idea(
                brand_name=brand_name,
                topic=theme,
                pillar=pillar,
                platform=platform,
                framework=framework
            )
            ideas.append(idea)

        # Simulate session duration
        duration = idea_count * 3 + random.randint(5, 15)

        return IdeationSession(
            session_id=session_id,
            brand_name=brand_name,
            theme=theme,
            frameworks_used=frameworks_used,
            ideas_generated=ideas,
            duration_minutes=duration,
            completed_at=datetime.now()
        )

    def generate_series_topics(
        self,
        series: ContentSeries,
        count: int = 5
    ) -> List[str]:
        """Generate topic ideas for a content series."""
        # Topic generation templates based on pillar
        topic_templates = {
            ContentPillar.EDUCATIONAL: [
                "How to {action}",
                "The complete guide to {topic}",
                "{number} tips for {outcome}",
                "Understanding {concept}",
                "Beginner's guide to {topic}"
            ],
            ContentPillar.ENTERTAINING: [
                "When {situation} goes wrong",
                "Expectation vs reality: {topic}",
                "Things only {audience} understand",
                "POV: You're dealing with {situation}",
                "Ranking {items} from worst to best"
            ],
            ContentPillar.INSPIRATIONAL: [
                "From {start} to {end}: A journey",
                "Why giving up on {goal} isn't an option",
                "The moment everything changed",
                "What {achievement} taught me",
                "If I can do it, so can you"
            ]
        }

        templates = topic_templates.get(series.pillar, topic_templates[ContentPillar.EDUCATIONAL])
        topics = []

        for _ in range(count):
            template = random.choice(templates)
            # Would normally fill with real topics
            topics.append(f"{series.name}: {template}")

        return topics


class ContentMatrixBuilder:
    """Builds content matrices for strategic planning."""

    def build_funnel_matrix(
        self,
        pillars: List[ContentPillar]
    ) -> Dict[str, Dict[str, List[str]]]:
        """Build a content matrix by funnel stage and pillar."""
        matrix = {}

        for stage in FunnelStage:
            matrix[stage.value] = {}
            for pillar in pillars:
                content_types = self._get_content_suggestions(stage, pillar)
                matrix[stage.value][pillar.value] = content_types

        return matrix

    def _get_content_suggestions(
        self,
        stage: FunnelStage,
        pillar: ContentPillar
    ) -> List[str]:
        """Get content suggestions for stage/pillar combo."""
        suggestions = {
            ("awareness", "educational"): ["Tips carousel", "How-to reel", "Explainer thread"],
            ("awareness", "entertaining"): ["Memes", "Trending sounds", "Relatable content"],
            ("awareness", "inspirational"): ["Quote cards", "Success stories", "Motivation reels"],
            ("consideration", "educational"): ["Deep-dive tutorials", "Comparison posts", "FAQs"],
            ("consideration", "promotional"): ["Product features", "Use cases", "Behind scenes"],
            ("conversion", "promotional"): ["Customer reviews", "Limited offers", "Demo videos"],
            ("retention", "community"): ["Polls", "Q&A sessions", "Member spotlights"],
            ("advocacy", "user_generated"): ["Reshare reviews", "Customer features", "Testimonials"]
        }

        key = (stage.value, pillar.value)
        return suggestions.get(key, ["Custom content"])


# ============================================================
# REPORTER - ASCII Dashboard Generation
# ============================================================

class IdeationReporter:
    """Generates ASCII reports for ideation sessions."""

    def _progress_bar(self, value: int, max_value: int = 100, width: int = 10) -> str:
        """Generate ASCII progress bar."""
        filled = int((value / max_value) * width)
        empty = width - filled
        return "█" * filled + "░" * empty

    def generate_ideation_report(self, session: IdeationSession) -> str:
        """Generate comprehensive ideation session report."""
        lines = []
        lines.append("CONTENT IDEATION")
        lines.append("═" * 55)
        lines.append(f"Brand: {session.brand_name}")
        lines.append(f"Theme: {session.theme}")
        lines.append(f"Time: {session.started_at.strftime('%Y-%m-%d %H:%M')}")
        lines.append("═" * 55)
        lines.append("")

        # Overview
        lines.append("IDEATION OVERVIEW")
        lines.append("─" * 55)
        lines.append("┌" + "─" * 53 + "┐")
        lines.append("│" + "       IDEATION STATUS".center(53) + "│")
        lines.append("│" + " " * 53 + "│")
        lines.append(f"│  Brand: {session.brand_name[:40]:<43}│")
        lines.append(f"│  Theme: {session.theme[:40]:<43}│")
        lines.append(f"│  Ideas Generated: {len(session.ideas_generated):<32}│")
        lines.append("│" + " " * 53 + "│")

        high_priority = len([i for i in session.ideas_generated if i.is_high_priority])
        trend_based = len([i for i in session.ideas_generated if i.trend_based])
        series_content = len([i for i in session.ideas_generated if i.is_series_content])

        lines.append(f"│  High Priority: {high_priority:<35}│")
        lines.append(f"│  Trend-Based: {trend_based:<37}│")
        lines.append(f"│  Series Content: {series_content:<34}│")
        lines.append("│" + " " * 53 + "│")

        creativity = session.quality_score
        bar = self._progress_bar(creativity)
        lines.append(f"│  Creativity Score: {bar} {creativity}/100│")
        status = "● Ideas Ready" if session.is_complete else "○ In Progress"
        lines.append(f"│  Status: {status:<42}│")
        lines.append("└" + "─" * 53 + "┘")
        lines.append("")

        # High Priority Ideas
        high_priority_ideas = [i for i in session.ideas_generated if i.is_high_priority][:3]
        if high_priority_ideas:
            lines.append("HIGH PRIORITY IDEAS")
            lines.append("─" * 55)
            for idx, idea in enumerate(high_priority_ideas, 1):
                lines.append("┌" + "─" * 53 + "┐")
                lines.append(f"│  IDEA {idx}: {idea.title[:38]:<40}│")
                lines.append("│" + " " * 53 + "│")
                lines.append(f"│  Format: {idea.format.value:<42}│")
                lines.append(f"│  Platform: {idea.platform:<40}│")
                lines.append(f"│  Pillar: {idea.pillar.value:<42}│")
                hook_display = f'"{idea.hook[:35]}..."' if len(idea.hook) > 35 else f'"{idea.hook}"'
                lines.append(f"│  Hook: {hook_display:<44}│")
                lines.append("│" + " " * 53 + "│")
                potential_bar = self._progress_bar(idea.potential_score)
                forecast = idea.engagement_forecast
                lines.append(f"│  Potential: {potential_bar} {forecast:<15}│")
                lines.append("└" + "─" * 53 + "┘")
                lines.append("")

        # Frameworks Used
        lines.append("FRAMEWORKS USED")
        lines.append("─" * 55)
        for fw in session.frameworks_used[:5]:
            lines.append(f"• {fw.value.replace('_', ' ').title()}: {fw.best_for}")
        lines.append("")

        # All Ideas Summary
        lines.append("IDEAS BY PILLAR")
        lines.append("─" * 55)
        pillar_counts = {}
        for idea in session.ideas_generated:
            p = idea.pillar.value
            pillar_counts[p] = pillar_counts.get(p, 0) + 1
        for pillar, count in sorted(pillar_counts.items(), key=lambda x: -x[1]):
            bar = self._progress_bar(count, len(session.ideas_generated))
            lines.append(f"│ {pillar[:20]:<20} {bar} {count}")
        lines.append("")

        # Implementation Checklist
        lines.append("IMPLEMENTATION CHECKLIST")
        lines.append("─" * 55)
        lines.append("• [●] Ideas generated")
        lines.append("• [●] Hooks created")
        lines.append("• [●] Formats assigned")
        lines.append("• [○] Production briefs pending")
        lines.append("• [○] Calendar assignment pending")
        lines.append("")

        lines.append(f"Ideation Status: {'● Ready for Creation' if session.is_complete else '○ In Progress'}")

        return "\n".join(lines)

    def generate_backlog_report(self, backlog: IdeaBacklog) -> str:
        """Generate backlog summary report."""
        lines = []
        lines.append("IDEA BACKLOG SUMMARY")
        lines.append("═" * 55)
        lines.append(f"Brand: {backlog.brand_name}")
        lines.append(f"Generated: {backlog.created_at.strftime('%Y-%m-%d %H:%M')}")
        lines.append("═" * 55)
        lines.append("")

        lines.append("┌" + "─" * 53 + "┐")
        lines.append(f"│  Total Ideas: {backlog.total_ideas:<38}│")
        lines.append(f"│  High Priority: {backlog.high_priority_count:<36}│")
        lines.append(f"│  Trend-Based: {backlog.trend_based_count:<38}│")
        lines.append(f"│  Series Content: {backlog.series_content_count:<35}│")
        lines.append("│" + " " * 53 + "│")

        creativity_bar = self._progress_bar(backlog.creativity_score)
        lines.append(f"│  Creativity: {creativity_bar} {backlog.creativity_score}/100  │")
        lines.append("└" + "─" * 53 + "┘")
        lines.append("")

        # By Pillar
        lines.append("BY PILLAR")
        lines.append("─" * 55)
        for pillar, count in sorted(backlog.by_pillar.items(), key=lambda x: -x[1]):
            bar = self._progress_bar(count, backlog.total_ideas) if backlog.total_ideas > 0 else "░" * 10
            lines.append(f"│ {pillar[:18]:<18} {bar} {count}")
        lines.append("")

        # By Platform
        lines.append("BY PLATFORM")
        lines.append("─" * 55)
        for platform, count in sorted(backlog.by_platform.items(), key=lambda x: -x[1]):
            bar = self._progress_bar(count, backlog.total_ideas) if backlog.total_ideas > 0 else "░" * 10
            lines.append(f"│ {platform[:18]:<18} {bar} {count}")

        return "\n".join(lines)

    def generate_hooks_report(self, hooks: List[Dict[str, str]], topic: str) -> str:
        """Generate hook variations report."""
        lines = []
        lines.append("HOOK VARIATIONS")
        lines.append("═" * 55)
        lines.append(f"Topic: {topic}")
        lines.append("═" * 55)
        lines.append("")

        for i, hook_data in enumerate(hooks, 1):
            lines.append(f"HOOK {i}: {hook_data['type'].upper()}")
            lines.append("─" * 55)
            lines.append(f"  \"{hook_data['hook']}\"")
            lines.append(f"  Driver: {hook_data['engagement_driver']}")
            lines.append(f"  Best for: {hook_data['best_platforms']}")
            lines.append("")

        return "\n".join(lines)

    def generate_trend_report(self, trends: List[TrendOpportunity]) -> str:
        """Generate trend opportunities report."""
        lines = []
        lines.append("TREND OPPORTUNITIES")
        lines.append("═" * 55)
        lines.append(f"Scanned: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        lines.append("═" * 55)
        lines.append("")

        lines.append("| Trend | Platform | Status | Days Left |")
        lines.append("|" + "-" * 20 + "|" + "-" * 12 + "|" + "-" * 12 + "|" + "-" * 11 + "|")

        for trend in trends:
            name = trend.trend_name[:18]
            platform = trend.platform[:10]
            status = trend.status.value[:10]
            days = str(trend.days_remaining)
            lines.append(f"| {name:<18} | {platform:<10} | {status:<10} | {days:<9} |")

        lines.append("")

        # Actionable trends
        actionable = [t for t in trends if t.is_actionable]
        lines.append(f"Actionable Trends: {len(actionable)}/{len(trends)}")

        for trend in actionable[:3]:
            lines.append(f"  • {trend.trend_name}: {trend.brand_angle}")

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="SOCIAL.IDEATE.EXE - Content Ideation Engine"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Brainstorm command
    brainstorm = subparsers.add_parser("brainstorm", help="Run brainstorming session")
    brainstorm.add_argument("--brand", required=True, help="Brand name")
    brainstorm.add_argument("--theme", required=True, help="Content theme/topic")
    brainstorm.add_argument("--count", type=int, default=10, help="Number of ideas")
    brainstorm.add_argument("--platforms", nargs="+", default=["instagram", "tiktok"],
                           help="Target platforms")

    # Hooks command
    hooks = subparsers.add_parser("hooks", help="Generate hook variations")
    hooks.add_argument("--topic", required=True, help="Topic for hooks")
    hooks.add_argument("--count", type=int, default=5, help="Number of variations")

    # Trends command
    trends = subparsers.add_parser("trends", help="Scan trend opportunities")
    trends.add_argument("--trend", required=True, help="Trend name to analyze")
    trends.add_argument("--platform", default="tiktok", help="Platform")
    trends.add_argument("--keywords", nargs="+", default=[], help="Brand keywords")

    # Series command
    series = subparsers.add_parser("series", help="Generate series topic ideas")
    series.add_argument("--name", required=True, help="Series name")
    series.add_argument("--pillar", default="educational", help="Content pillar")
    series.add_argument("--count", type=int, default=5, help="Number of topics")

    # Matrix command
    matrix = subparsers.add_parser("matrix", help="Build content matrix")
    matrix.add_argument("--pillars", nargs="+",
                        default=["educational", "entertaining", "inspirational"],
                        help="Content pillars")

    # Demo command
    demo = subparsers.add_parser("demo", help="Run demonstration")

    args = parser.parse_args()

    engine = IdeationEngine()
    reporter = IdeationReporter()

    if args.command == "brainstorm":
        pillars = [ContentPillar.EDUCATIONAL, ContentPillar.ENTERTAINING, ContentPillar.INSPIRATIONAL]
        session = engine.brainstorm_session(
            brand_name=args.brand,
            theme=args.theme,
            pillars=pillars,
            platforms=args.platforms,
            idea_count=args.count
        )
        print(reporter.generate_ideation_report(session))

    elif args.command == "hooks":
        hook_gen = HookGenerator()
        variations = hook_gen.generate_variations(args.topic, args.count)
        print(reporter.generate_hooks_report(variations, args.topic))

    elif args.command == "trends":
        scanner = TrendScanner()
        trend = scanner.analyze_trend(args.trend, args.platform)
        if args.keywords:
            trend.brand_angle = scanner.find_brand_angle(trend, args.keywords)
        print(reporter.generate_trend_report([trend]))

    elif args.command == "series":
        try:
            pillar = ContentPillar(args.pillar)
        except ValueError:
            pillar = ContentPillar.EDUCATIONAL

        series_obj = ContentSeries(
            series_id=f"series_{datetime.now().strftime('%Y%m%d')}",
            name=args.name,
            description=f"Content series: {args.name}",
            pillar=pillar,
            format=ContentFormat.CAROUSEL,
            frequency="weekly"
        )
        topics = engine.generate_series_topics(series_obj, args.count)
        print(f"Series: {args.name}")
        print("=" * 40)
        for i, topic in enumerate(topics, 1):
            print(f"{i}. {topic}")

    elif args.command == "matrix":
        builder = ContentMatrixBuilder()
        try:
            pillars = [ContentPillar(p) for p in args.pillars]
        except ValueError:
            pillars = [ContentPillar.EDUCATIONAL, ContentPillar.ENTERTAINING]

        content_matrix = builder.build_funnel_matrix(pillars)
        print("CONTENT MATRIX")
        print("=" * 60)
        for stage, pillar_content in content_matrix.items():
            print(f"\n{stage.upper()}")
            print("-" * 40)
            for pillar, suggestions in pillar_content.items():
                print(f"  {pillar}: {', '.join(suggestions)}")

    elif args.command == "demo":
        print("Running SOCIAL.IDEATE.EXE Demo...")
        print("=" * 55)

        # Demo brainstorm
        session = engine.brainstorm_session(
            brand_name="Demo Brand",
            theme="Summer Collection",
            pillars=[ContentPillar.EDUCATIONAL, ContentPillar.ENTERTAINING, ContentPillar.PROMOTIONAL],
            platforms=["instagram", "tiktok", "linkedin"],
            idea_count=8
        )
        print(reporter.generate_ideation_report(session))

        print("\n" + "=" * 55)
        print("Demo complete!")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/social-ideate [brand]` - Weekly content brainstorm
- `/social-ideate trends` - Current trend opportunities
- `/social-ideate series [brand]` - Recurring series ideas
- `/social-ideate hooks [topic]` - Generate hook variations
- `/social-ideate [topic] [brand]` - Topic-specific ideation

$ARGUMENTS
