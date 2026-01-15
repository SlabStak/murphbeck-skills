# SOCIAL.ENGAGE.EXE - Community Management Specialist

You are SOCIAL.ENGAGE.EXE — the multi-brand community management specialist that monitors, responds, and engages across all social channels while maintaining brand voice, managing escalations, and building authentic relationships.

MISSION: Monitor channels. Engage community. Build relationships.

---

## SYSTEM CONTEXT

This skill provides comprehensive community management through real-time monitoring, intelligent triage, personalized responses, and relationship building while maintaining SLA compliance across multiple brands and platforms.

---

## COMMUNITY ENGAGEMENT ENGINE

```python
#!/usr/bin/env python3
"""
SOCIAL.ENGAGE.EXE - Community Management Specialist
Monitors, responds, and engages across all social channels.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any, Tuple
import random
import json
import argparse


# ============================================================
# ENUMS - Community Management Domain
# ============================================================

class Platform(Enum):
    """Social media platforms for engagement."""
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    TIKTOK = "tiktok"
    LINKEDIN = "linkedin"
    YOUTUBE = "youtube"
    THREADS = "threads"
    REDDIT = "reddit"

    @property
    def interaction_types(self) -> List[str]:
        """Types of interactions on this platform."""
        interactions = {
            "instagram": ["comment", "dm", "mention", "story_reply", "reel_comment"],
            "facebook": ["comment", "message", "review", "mention", "reaction"],
            "twitter": ["reply", "dm", "mention", "quote_tweet", "retweet"],
            "tiktok": ["comment", "dm", "duet", "stitch", "mention"],
            "linkedin": ["comment", "message", "mention", "reaction", "share"],
            "youtube": ["comment", "community_post", "mention", "live_chat"],
            "threads": ["reply", "mention", "quote", "repost"],
            "reddit": ["comment", "dm", "mention", "crosspost"]
        }
        return interactions.get(self.value, ["comment", "message", "mention"])

    @property
    def avg_response_expectation_hours(self) -> float:
        """Average user expectation for response time in hours."""
        expectations = {
            "instagram": 4.0,
            "facebook": 6.0,
            "twitter": 1.0,
            "tiktok": 8.0,
            "linkedin": 24.0,
            "youtube": 12.0,
            "threads": 2.0,
            "reddit": 4.0
        }
        return expectations.get(self.value, 4.0)

    @property
    def engagement_weight(self) -> float:
        """Weight for engagement priority scoring."""
        weights = {
            "instagram": 1.2,
            "facebook": 1.0,
            "twitter": 1.5,
            "tiktok": 1.1,
            "linkedin": 0.9,
            "youtube": 0.8,
            "threads": 1.3,
            "reddit": 1.0
        }
        return weights.get(self.value, 1.0)


class InteractionType(Enum):
    """Types of interactions to manage."""
    COMMENT = "comment"
    DIRECT_MESSAGE = "direct_message"
    MENTION = "mention"
    REVIEW = "review"
    STORY_REPLY = "story_reply"
    LIVE_CHAT = "live_chat"
    QUOTE = "quote"
    TAG = "tag"

    @property
    def visibility(self) -> str:
        """Visibility level of interaction."""
        visibility_map = {
            "comment": "public",
            "direct_message": "private",
            "mention": "public",
            "review": "public",
            "story_reply": "private",
            "live_chat": "public",
            "quote": "public",
            "tag": "public"
        }
        return visibility_map.get(self.value, "public")

    @property
    def response_urgency_modifier(self) -> float:
        """Modifier for response urgency (higher = more urgent)."""
        modifiers = {
            "comment": 1.0,
            "direct_message": 1.2,
            "mention": 1.3,
            "review": 1.5,
            "story_reply": 0.8,
            "live_chat": 2.0,
            "quote": 1.1,
            "tag": 0.9
        }
        return modifiers.get(self.value, 1.0)

    @property
    def requires_public_response(self) -> bool:
        """Whether this interaction typically needs public response."""
        return self.visibility == "public"


class Priority(Enum):
    """Priority levels for interactions."""
    P1_CRITICAL = "p1_critical"
    P2_URGENT = "p2_urgent"
    P3_STANDARD = "p3_standard"
    P4_LOW = "p4_low"

    @property
    def response_time_minutes(self) -> int:
        """Target response time in minutes."""
        times = {
            "p1_critical": 15,
            "p2_urgent": 60,
            "p3_standard": 240,
            "p4_low": 1440  # 24 hours
        }
        return times.get(self.value, 240)

    @property
    def examples(self) -> List[str]:
        """Example scenarios for this priority."""
        examples = {
            "p1_critical": ["Crisis", "Legal threat", "Safety issue", "PR emergency"],
            "p2_urgent": ["Complaint", "Unhappy customer", "Product issue", "Billing dispute"],
            "p3_standard": ["Question", "Feedback", "Feature request", "Information"],
            "p4_low": ["Praise", "General comment", "Greeting", "Share appreciation"]
        }
        return examples.get(self.value, [])

    @property
    def color(self) -> str:
        """Color code for visual display."""
        colors = {
            "p1_critical": "red",
            "p2_urgent": "orange",
            "p3_standard": "yellow",
            "p4_low": "green"
        }
        return colors.get(self.value, "gray")

    @property
    def icon(self) -> str:
        """Visual icon for priority."""
        icons = {
            "p1_critical": "🔴",
            "p2_urgent": "🟠",
            "p3_standard": "🟡",
            "p4_low": "🟢"
        }
        return icons.get(self.value, "⚪")

    @classmethod
    def from_score(cls, score: int) -> "Priority":
        """Determine priority from urgency score."""
        if score >= 80:
            return cls.P1_CRITICAL
        elif score >= 60:
            return cls.P2_URGENT
        elif score >= 30:
            return cls.P3_STANDARD
        else:
            return cls.P4_LOW


class Sentiment(Enum):
    """Sentiment classification for interactions."""
    VERY_POSITIVE = "very_positive"
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    VERY_NEGATIVE = "very_negative"

    @property
    def score(self) -> int:
        """Numeric sentiment score (-100 to 100)."""
        scores = {
            "very_positive": 80,
            "positive": 40,
            "neutral": 0,
            "negative": -40,
            "very_negative": -80
        }
        return scores.get(self.value, 0)

    @property
    def response_approach(self) -> str:
        """Recommended response approach."""
        approaches = {
            "very_positive": "Celebrate and amplify",
            "positive": "Thank and engage",
            "neutral": "Inform and assist",
            "negative": "Empathize and resolve",
            "very_negative": "De-escalate and take offline"
        }
        return approaches.get(self.value, "Engage appropriately")

    @property
    def icon(self) -> str:
        """Visual icon for sentiment."""
        icons = {
            "very_positive": "😍",
            "positive": "😊",
            "neutral": "😐",
            "negative": "😟",
            "very_negative": "😠"
        }
        return icons.get(self.value, "😐")

    @property
    def requires_escalation_review(self) -> bool:
        """Whether this sentiment should trigger escalation review."""
        return self.value in ["negative", "very_negative"]

    @classmethod
    def from_score(cls, score: int) -> "Sentiment":
        """Determine sentiment from score."""
        if score >= 60:
            return cls.VERY_POSITIVE
        elif score >= 20:
            return cls.POSITIVE
        elif score >= -20:
            return cls.NEUTRAL
        elif score >= -60:
            return cls.NEGATIVE
        else:
            return cls.VERY_NEGATIVE


class ResponseType(Enum):
    """Types of responses for different interactions."""
    GRATITUDE = "gratitude"
    HELPFUL = "helpful"
    RECOVERY = "recovery"
    DE_ESCALATION = "de_escalation"
    CLARIFICATION = "clarification"
    ACKNOWLEDGMENT = "acknowledgment"
    REDIRECT = "redirect"
    NO_RESPONSE = "no_response"

    @property
    def template_category(self) -> str:
        """Category for template lookup."""
        categories = {
            "gratitude": "thank_templates",
            "helpful": "help_templates",
            "recovery": "recovery_templates",
            "de_escalation": "de_escalation_templates",
            "clarification": "clarify_templates",
            "acknowledgment": "ack_templates",
            "redirect": "redirect_templates",
            "no_response": "none"
        }
        return categories.get(self.value, "default_templates")

    @property
    def typical_length(self) -> str:
        """Typical response length."""
        lengths = {
            "gratitude": "short",
            "helpful": "medium",
            "recovery": "long",
            "de_escalation": "medium",
            "clarification": "short",
            "acknowledgment": "short",
            "redirect": "short",
            "no_response": "none"
        }
        return lengths.get(self.value, "medium")

    @property
    def follow_up_required(self) -> bool:
        """Whether follow-up is typically needed."""
        return self.value in ["recovery", "de_escalation", "helpful"]


class EscalationType(Enum):
    """Types of escalation scenarios."""
    PRODUCT_DEFECT = "product_defect"
    LEGAL_THREAT = "legal_threat"
    PR_CRISIS = "pr_crisis"
    INFLUENCER_ISSUE = "influencer_issue"
    VIP_CUSTOMER = "vip_customer"
    BILLING_ISSUE = "billing_issue"
    SAFETY_CONCERN = "safety_concern"
    MISINFORMATION = "misinformation"

    @property
    def escalate_to(self) -> List[str]:
        """Roles/teams to escalate to."""
        escalation_map = {
            "product_defect": ["client", "support", "product"],
            "legal_threat": ["client", "legal"],
            "pr_crisis": ["client", "pr", "executive"],
            "influencer_issue": ["marketing", "partnerships"],
            "vip_customer": ["sales", "account_manager"],
            "billing_issue": ["support", "finance"],
            "safety_concern": ["legal", "client", "executive"],
            "misinformation": ["pr", "legal", "client"]
        }
        return escalation_map.get(self.value, ["client"])

    @property
    def timeline_hours(self) -> float:
        """Maximum hours before escalation must be resolved."""
        timelines = {
            "product_defect": 0.25,  # 15 minutes
            "legal_threat": 0.25,
            "pr_crisis": 0.25,
            "influencer_issue": 1.0,
            "vip_customer": 1.0,
            "billing_issue": 4.0,
            "safety_concern": 0.25,
            "misinformation": 0.5
        }
        return timelines.get(self.value, 1.0)

    @property
    def severity(self) -> str:
        """Severity level for this escalation type."""
        severities = {
            "product_defect": "high",
            "legal_threat": "critical",
            "pr_crisis": "critical",
            "influencer_issue": "medium",
            "vip_customer": "medium",
            "billing_issue": "low",
            "safety_concern": "critical",
            "misinformation": "high"
        }
        return severities.get(self.value, "medium")


class QueueStatus(Enum):
    """Status of items in the response queue."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    AWAITING_INFO = "awaiting_info"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    CLOSED = "closed"

    @property
    def is_active(self) -> bool:
        """Whether this status represents an active item."""
        return self.value in ["pending", "in_progress", "awaiting_info", "escalated"]

    @property
    def next_statuses(self) -> List[str]:
        """Valid next statuses from current."""
        transitions = {
            "pending": ["in_progress", "escalated"],
            "in_progress": ["awaiting_info", "escalated", "resolved"],
            "awaiting_info": ["in_progress", "escalated", "closed"],
            "escalated": ["in_progress", "resolved"],
            "resolved": ["closed"],
            "closed": []
        }
        return transitions.get(self.value, [])

    @property
    def color(self) -> str:
        """Color for visual display."""
        colors = {
            "pending": "yellow",
            "in_progress": "blue",
            "awaiting_info": "orange",
            "escalated": "red",
            "resolved": "green",
            "closed": "gray"
        }
        return colors.get(self.value, "gray")


# ============================================================
# DATACLASSES - Engagement Structures
# ============================================================

@dataclass
class Interaction:
    """A single community interaction to manage."""
    interaction_id: str
    brand_name: str
    platform: Platform
    interaction_type: InteractionType
    author_username: str
    content: str
    sentiment: Sentiment = Sentiment.NEUTRAL
    priority: Priority = Priority.P3_STANDARD
    status: QueueStatus = QueueStatus.PENDING
    is_influencer: bool = False
    follower_count: int = 0
    is_vip: bool = False
    requires_response: bool = True
    assigned_to: Optional[str] = None
    parent_interaction_id: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    received_at: datetime = field(default_factory=datetime.now)
    responded_at: Optional[datetime] = None
    response_content: Optional[str] = None

    @property
    def age_minutes(self) -> int:
        """Age of interaction in minutes."""
        return int((datetime.now() - self.received_at).total_seconds() / 60)

    @property
    def is_overdue(self) -> bool:
        """Check if response is overdue based on SLA."""
        return self.age_minutes > self.priority.response_time_minutes

    @property
    def time_remaining_minutes(self) -> int:
        """Minutes remaining before SLA breach."""
        return max(0, self.priority.response_time_minutes - self.age_minutes)

    @property
    def urgency_score(self) -> int:
        """Calculate overall urgency score (0-100)."""
        base_score = 50

        # Priority impact
        priority_scores = {"p1_critical": 40, "p2_urgent": 25, "p3_standard": 10, "p4_low": 0}
        base_score += priority_scores.get(self.priority.value, 10)

        # Sentiment impact
        if self.sentiment in [Sentiment.NEGATIVE, Sentiment.VERY_NEGATIVE]:
            base_score += 15

        # Influencer/VIP bonus
        if self.is_influencer or self.is_vip:
            base_score += 20

        # Overdue penalty
        if self.is_overdue:
            base_score += 10

        # Platform urgency
        base_score = int(base_score * self.platform.engagement_weight)

        return min(100, max(0, base_score))

    @property
    def response_type_recommended(self) -> ResponseType:
        """Recommend response type based on interaction."""
        if self.sentiment == Sentiment.VERY_POSITIVE:
            return ResponseType.GRATITUDE
        elif self.sentiment == Sentiment.POSITIVE:
            return ResponseType.ACKNOWLEDGMENT
        elif self.sentiment == Sentiment.NEGATIVE:
            return ResponseType.RECOVERY
        elif self.sentiment == Sentiment.VERY_NEGATIVE:
            return ResponseType.DE_ESCALATION
        elif self.interaction_type == InteractionType.DIRECT_MESSAGE:
            return ResponseType.HELPFUL
        else:
            return ResponseType.HELPFUL

    @property
    def sla_status(self) -> str:
        """Get SLA status description."""
        if self.status in [QueueStatus.RESOLVED, QueueStatus.CLOSED]:
            if self.responded_at:
                response_time = (self.responded_at - self.received_at).total_seconds() / 60
                if response_time <= self.priority.response_time_minutes:
                    return "Met"
                else:
                    return "Breached"
            return "N/A"
        elif self.is_overdue:
            return "Breaching"
        elif self.time_remaining_minutes < 15:
            return "At Risk"
        else:
            return "On Track"


@dataclass
class ResponseTemplate:
    """Template for common responses."""
    template_id: str
    name: str
    response_type: ResponseType
    template_text: str
    platforms: List[Platform] = field(default_factory=list)
    sentiment_target: Optional[Sentiment] = None
    personalization_fields: List[str] = field(default_factory=list)
    usage_count: int = 0
    success_rate: float = 0.0

    def render(self, context: Dict[str, str]) -> str:
        """Render template with context."""
        text = self.template_text
        for field_name, value in context.items():
            text = text.replace(f"{{{field_name}}}", value)
        return text


@dataclass
class Escalation:
    """An escalation record."""
    escalation_id: str
    interaction_id: str
    brand_name: str
    escalation_type: EscalationType
    summary: str
    status: str = "open"
    assigned_to: List[str] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    resolved_at: Optional[datetime] = None
    resolution: Optional[str] = None

    @property
    def age_hours(self) -> float:
        """Age in hours."""
        return (datetime.now() - self.created_at).total_seconds() / 3600

    @property
    def is_overdue(self) -> bool:
        """Check if escalation is overdue."""
        return self.status == "open" and self.age_hours > self.escalation_type.timeline_hours

    @property
    def severity_icon(self) -> str:
        """Get severity icon."""
        icons = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}
        return icons.get(self.escalation_type.severity, "⚪")


@dataclass
class EngagementQueue:
    """Queue of interactions to manage."""
    brand_name: str
    interactions: List[Interaction] = field(default_factory=list)
    escalations: List[Escalation] = field(default_factory=list)

    @property
    def pending_count(self) -> int:
        """Count of pending interactions."""
        return len([i for i in self.interactions if i.status == QueueStatus.PENDING])

    @property
    def by_priority(self) -> Dict[str, int]:
        """Interactions grouped by priority."""
        counts = {}
        for interaction in self.interactions:
            if interaction.status.is_active:
                p = interaction.priority.value
                counts[p] = counts.get(p, 0) + 1
        return counts

    @property
    def by_platform(self) -> Dict[str, int]:
        """Interactions grouped by platform."""
        counts = {}
        for interaction in self.interactions:
            if interaction.status.is_active:
                p = interaction.platform.value
                counts[p] = counts.get(p, 0) + 1
        return counts

    @property
    def overdue_count(self) -> int:
        """Count of overdue interactions."""
        return len([i for i in self.interactions if i.is_overdue and i.status.is_active])

    @property
    def oldest_pending_minutes(self) -> int:
        """Age of oldest pending interaction."""
        pending = [i for i in self.interactions if i.status == QueueStatus.PENDING]
        if not pending:
            return 0
        return max(i.age_minutes for i in pending)

    @property
    def avg_response_time_minutes(self) -> float:
        """Average response time for resolved interactions."""
        resolved = [i for i in self.interactions
                   if i.status == QueueStatus.RESOLVED and i.responded_at]
        if not resolved:
            return 0.0
        total = sum((i.responded_at - i.received_at).total_seconds() / 60 for i in resolved)
        return total / len(resolved)

    @property
    def sla_compliance_rate(self) -> float:
        """Percentage of interactions meeting SLA."""
        resolved = [i for i in self.interactions
                   if i.status in [QueueStatus.RESOLVED, QueueStatus.CLOSED] and i.responded_at]
        if not resolved:
            return 100.0
        met_sla = len([i for i in resolved
                      if (i.responded_at - i.received_at).total_seconds() / 60 <= i.priority.response_time_minutes])
        return (met_sla / len(resolved)) * 100

    def get_next_interaction(self) -> Optional[Interaction]:
        """Get highest priority pending interaction."""
        pending = [i for i in self.interactions if i.status == QueueStatus.PENDING]
        if not pending:
            return None
        return max(pending, key=lambda x: x.urgency_score)


@dataclass
class SentimentSnapshot:
    """Snapshot of sentiment across interactions."""
    brand_name: str
    period_start: datetime
    period_end: datetime
    total_interactions: int = 0
    very_positive_count: int = 0
    positive_count: int = 0
    neutral_count: int = 0
    negative_count: int = 0
    very_negative_count: int = 0
    previous_avg_score: float = 0.0

    @property
    def positive_rate(self) -> float:
        """Percentage of positive interactions."""
        if self.total_interactions == 0:
            return 0.0
        return ((self.very_positive_count + self.positive_count) / self.total_interactions) * 100

    @property
    def negative_rate(self) -> float:
        """Percentage of negative interactions."""
        if self.total_interactions == 0:
            return 0.0
        return ((self.very_negative_count + self.negative_count) / self.total_interactions) * 100

    @property
    def neutral_rate(self) -> float:
        """Percentage of neutral interactions."""
        if self.total_interactions == 0:
            return 0.0
        return (self.neutral_count / self.total_interactions) * 100

    @property
    def avg_sentiment_score(self) -> float:
        """Average sentiment score."""
        if self.total_interactions == 0:
            return 0.0
        total_score = (
            self.very_positive_count * 80 +
            self.positive_count * 40 +
            self.neutral_count * 0 +
            self.negative_count * -40 +
            self.very_negative_count * -80
        )
        return total_score / self.total_interactions

    @property
    def trend(self) -> str:
        """Sentiment trend compared to previous period."""
        current = self.avg_sentiment_score
        if current > self.previous_avg_score + 10:
            return "improving"
        elif current < self.previous_avg_score - 10:
            return "declining"
        else:
            return "stable"


@dataclass
class ProactiveEngagement:
    """Record of proactive community engagement."""
    brand_name: str
    platform: Platform
    engagement_date: datetime = field(default_factory=datetime.now)
    likes_given: int = 0
    comments_made: int = 0
    follows_given: int = 0
    shares_done: int = 0
    dm_conversations: int = 0
    hashtags_engaged: List[str] = field(default_factory=list)
    influencers_engaged: List[str] = field(default_factory=list)
    ugc_discovered: int = 0

    @property
    def total_engagements(self) -> int:
        """Total proactive engagements."""
        return (self.likes_given + self.comments_made +
                self.follows_given + self.shares_done + self.dm_conversations)

    @property
    def engagement_quality_score(self) -> int:
        """Quality score favoring comments over likes."""
        score = (
            self.likes_given * 1 +
            self.comments_made * 5 +
            self.follows_given * 3 +
            self.shares_done * 4 +
            self.dm_conversations * 10
        )
        return min(100, score // 5)


# ============================================================
# ENGINE CLASSES - Engagement Processing
# ============================================================

class SentimentAnalyzer:
    """Analyzes sentiment of interactions."""

    def __init__(self):
        self.positive_keywords = [
            "love", "amazing", "great", "awesome", "excellent", "best",
            "thank", "wonderful", "fantastic", "perfect", "beautiful", "helpful"
        ]
        self.negative_keywords = [
            "hate", "terrible", "awful", "worst", "bad", "horrible",
            "disappointed", "angry", "frustrated", "broken", "scam", "fraud"
        ]

    def analyze(self, text: str) -> Sentiment:
        """Analyze sentiment of text."""
        text_lower = text.lower()

        positive_score = sum(1 for word in self.positive_keywords if word in text_lower)
        negative_score = sum(1 for word in self.negative_keywords if word in text_lower)

        net_score = (positive_score - negative_score) * 20

        return Sentiment.from_score(net_score)

    def get_sentiment_snapshot(
        self,
        interactions: List[Interaction],
        previous_avg: float = 0.0
    ) -> SentimentSnapshot:
        """Create sentiment snapshot from interactions."""
        if not interactions:
            return SentimentSnapshot(
                brand_name="",
                period_start=datetime.now(),
                period_end=datetime.now()
            )

        brand = interactions[0].brand_name
        dates = [i.received_at for i in interactions]

        snapshot = SentimentSnapshot(
            brand_name=brand,
            period_start=min(dates),
            period_end=max(dates),
            total_interactions=len(interactions),
            previous_avg_score=previous_avg
        )

        for interaction in interactions:
            if interaction.sentiment == Sentiment.VERY_POSITIVE:
                snapshot.very_positive_count += 1
            elif interaction.sentiment == Sentiment.POSITIVE:
                snapshot.positive_count += 1
            elif interaction.sentiment == Sentiment.NEUTRAL:
                snapshot.neutral_count += 1
            elif interaction.sentiment == Sentiment.NEGATIVE:
                snapshot.negative_count += 1
            else:
                snapshot.very_negative_count += 1

        return snapshot


class TriageEngine:
    """Triages and prioritizes interactions."""

    def __init__(self):
        self.sentiment_analyzer = SentimentAnalyzer()
        self.vip_usernames: List[str] = []
        self.influencer_threshold = 10000

    def triage(self, interaction: Interaction) -> Interaction:
        """Triage an interaction and set priority."""
        # Analyze sentiment
        interaction.sentiment = self.sentiment_analyzer.analyze(interaction.content)

        # Check for VIP/influencer
        interaction.is_vip = interaction.author_username in self.vip_usernames
        interaction.is_influencer = interaction.follower_count >= self.influencer_threshold

        # Calculate urgency and set priority
        urgency = interaction.urgency_score
        interaction.priority = Priority.from_score(urgency)

        return interaction

    def bulk_triage(self, interactions: List[Interaction]) -> List[Interaction]:
        """Triage multiple interactions."""
        return [self.triage(i) for i in interactions]


class ResponseGenerator:
    """Generates responses based on templates and context."""

    def __init__(self):
        self.templates = self._load_default_templates()

    def _load_default_templates(self) -> Dict[str, List[ResponseTemplate]]:
        """Load default response templates."""
        return {
            "gratitude": [
                ResponseTemplate(
                    template_id="grat_1",
                    name="Simple Thank You",
                    response_type=ResponseType.GRATITUDE,
                    template_text="Thank you so much for the kind words, {username}! We truly appreciate your support! 💙",
                    personalization_fields=["username"]
                ),
                ResponseTemplate(
                    template_id="grat_2",
                    name="Detailed Appreciation",
                    response_type=ResponseType.GRATITUDE,
                    template_text="@{username} This made our day! Thank you for taking the time to share your experience. We're so glad you're enjoying {product}!",
                    personalization_fields=["username", "product"]
                )
            ],
            "helpful": [
                ResponseTemplate(
                    template_id="help_1",
                    name="Quick Answer",
                    response_type=ResponseType.HELPFUL,
                    template_text="Great question, {username}! {answer} Let us know if you need anything else! 😊",
                    personalization_fields=["username", "answer"]
                ),
                ResponseTemplate(
                    template_id="help_2",
                    name="DM Redirect",
                    response_type=ResponseType.REDIRECT,
                    template_text="Hi {username}! We'd love to help with this. Could you send us a DM so we can look into the details for you?",
                    personalization_fields=["username"]
                )
            ],
            "recovery": [
                ResponseTemplate(
                    template_id="recov_1",
                    name="Service Recovery",
                    response_type=ResponseType.RECOVERY,
                    template_text="Hi {username}, we're really sorry to hear about your experience. That's not the standard we aim for. Please DM us your order details so we can make this right for you. 🙏",
                    personalization_fields=["username"]
                )
            ],
            "de_escalation": [
                ResponseTemplate(
                    template_id="deesc_1",
                    name="Take Offline",
                    response_type=ResponseType.DE_ESCALATION,
                    template_text="@{username} We hear you and understand your frustration. We'd like to resolve this for you directly. Please send us a DM or email us at {support_email} so we can prioritize your case.",
                    personalization_fields=["username", "support_email"]
                )
            ]
        }

    def get_template(
        self,
        response_type: ResponseType,
        platform: Optional[Platform] = None
    ) -> Optional[ResponseTemplate]:
        """Get appropriate template for response type."""
        category = response_type.template_category
        if category == "none":
            return None

        templates = self.templates.get(category.replace("_templates", ""), [])
        if not templates:
            templates = self.templates.get("helpful", [])

        if platform:
            platform_templates = [t for t in templates if not t.platforms or platform in t.platforms]
            if platform_templates:
                return random.choice(platform_templates)

        return random.choice(templates) if templates else None

    def generate_response(
        self,
        interaction: Interaction,
        context: Dict[str, str]
    ) -> Optional[str]:
        """Generate response for an interaction."""
        template = self.get_template(
            interaction.response_type_recommended,
            interaction.platform
        )

        if not template:
            return None

        context.setdefault("username", interaction.author_username)
        return template.render(context)


class EscalationManager:
    """Manages escalation workflows."""

    def __init__(self):
        self.active_escalations: List[Escalation] = []

    def should_escalate(self, interaction: Interaction) -> Optional[EscalationType]:
        """Determine if interaction needs escalation."""
        content_lower = interaction.content.lower()

        # Check for legal threats
        legal_keywords = ["lawyer", "legal", "sue", "lawsuit", "attorney"]
        if any(kw in content_lower for kw in legal_keywords):
            return EscalationType.LEGAL_THREAT

        # Check for safety concerns
        safety_keywords = ["dangerous", "injury", "hurt", "unsafe", "hazard"]
        if any(kw in content_lower for kw in safety_keywords):
            return EscalationType.SAFETY_CONCERN

        # Check for product defects
        defect_keywords = ["broken", "defective", "doesn't work", "malfunction"]
        if any(kw in content_lower for kw in defect_keywords):
            return EscalationType.PRODUCT_DEFECT

        # Check for billing
        billing_keywords = ["charge", "billing", "refund", "payment", "overcharge"]
        if any(kw in content_lower for kw in billing_keywords):
            return EscalationType.BILLING_ISSUE

        # VIP/Influencer check
        if interaction.is_vip:
            return EscalationType.VIP_CUSTOMER
        if interaction.is_influencer and interaction.sentiment.requires_escalation_review:
            return EscalationType.INFLUENCER_ISSUE

        return None

    def create_escalation(
        self,
        interaction: Interaction,
        escalation_type: EscalationType
    ) -> Escalation:
        """Create new escalation."""
        escalation = Escalation(
            escalation_id=f"esc_{datetime.now().strftime('%Y%m%d%H%M%S')}_{random.randint(1000, 9999)}",
            interaction_id=interaction.interaction_id,
            brand_name=interaction.brand_name,
            escalation_type=escalation_type,
            summary=f"{escalation_type.value}: {interaction.content[:100]}...",
            assigned_to=escalation_type.escalate_to
        )
        self.active_escalations.append(escalation)
        return escalation


class EngagementEngine:
    """Main engine coordinating all engagement activities."""

    def __init__(self):
        self.triage_engine = TriageEngine()
        self.response_generator = ResponseGenerator()
        self.escalation_manager = EscalationManager()
        self.queues: Dict[str, EngagementQueue] = {}

    def process_interaction(
        self,
        interaction: Interaction
    ) -> Tuple[Interaction, Optional[Escalation]]:
        """Process a single interaction through the pipeline."""
        # Triage
        interaction = self.triage_engine.triage(interaction)

        # Check escalation
        escalation = None
        esc_type = self.escalation_manager.should_escalate(interaction)
        if esc_type:
            escalation = self.escalation_manager.create_escalation(interaction, esc_type)
            interaction.status = QueueStatus.ESCALATED

        # Add to queue
        if interaction.brand_name not in self.queues:
            self.queues[interaction.brand_name] = EngagementQueue(brand_name=interaction.brand_name)
        self.queues[interaction.brand_name].interactions.append(interaction)

        return interaction, escalation

    def get_queue(self, brand_name: str) -> EngagementQueue:
        """Get queue for a brand."""
        if brand_name not in self.queues:
            self.queues[brand_name] = EngagementQueue(brand_name=brand_name)
        return self.queues[brand_name]

    def generate_demo_interactions(self, brand_name: str, count: int = 10) -> List[Interaction]:
        """Generate demo interactions for testing."""
        platforms = list(Platform)
        types = [InteractionType.COMMENT, InteractionType.DIRECT_MESSAGE, InteractionType.MENTION]
        sentiments = list(Sentiment)

        demo_contents = [
            ("Love your products!", Sentiment.VERY_POSITIVE),
            ("This is amazing, thank you!", Sentiment.POSITIVE),
            ("Quick question about shipping", Sentiment.NEUTRAL),
            ("When will my order arrive?", Sentiment.NEUTRAL),
            ("Pretty disappointed with the quality", Sentiment.NEGATIVE),
            ("WORST experience ever! Want a refund!", Sentiment.VERY_NEGATIVE),
            ("Can you help me with returns?", Sentiment.NEUTRAL),
            ("Just placed my first order, excited!", Sentiment.POSITIVE),
            ("This product broke after one use", Sentiment.VERY_NEGATIVE),
            ("Your customer service is great!", Sentiment.POSITIVE)
        ]

        interactions = []
        for i in range(count):
            content, sentiment = demo_contents[i % len(demo_contents)]
            interaction = Interaction(
                interaction_id=f"int_{datetime.now().strftime('%Y%m%d%H%M%S')}_{i}",
                brand_name=brand_name,
                platform=random.choice(platforms[:4]),
                interaction_type=random.choice(types),
                author_username=f"user_{random.randint(1000, 9999)}",
                content=content,
                sentiment=sentiment,
                follower_count=random.randint(100, 50000),
                received_at=datetime.now() - timedelta(minutes=random.randint(5, 300))
            )
            interaction = self.triage_engine.triage(interaction)
            interactions.append(interaction)

        return interactions


# ============================================================
# REPORTER - ASCII Dashboard Generation
# ============================================================

class EngagementReporter:
    """Generates ASCII reports for engagement dashboards."""

    def _progress_bar(self, value: float, max_value: float = 100, width: int = 10) -> str:
        """Generate ASCII progress bar."""
        if max_value == 0:
            return "░" * width
        filled = int((value / max_value) * width)
        empty = width - filled
        return "█" * filled + "░" * empty

    def generate_dashboard(self, queue: EngagementQueue, sentiment: SentimentSnapshot) -> str:
        """Generate comprehensive engagement dashboard."""
        lines = []
        lines.append("ENGAGEMENT DASHBOARD")
        lines.append("═" * 55)
        lines.append(f"Brand: {queue.brand_name}")
        lines.append(f"Period: {datetime.now().strftime('%Y-%m-%d')}")
        lines.append(f"Time: {datetime.now().strftime('%H:%M')}")
        lines.append("═" * 55)
        lines.append("")

        # Engagement Overview
        lines.append("ENGAGEMENT OVERVIEW")
        lines.append("─" * 55)
        lines.append("┌" + "─" * 53 + "┐")
        lines.append("│" + "       ENGAGEMENT STATUS".center(53) + "│")
        lines.append("│" + " " * 53 + "│")
        lines.append(f"│  Brand: {queue.brand_name[:40]:<43}│")
        lines.append(f"│  Period: Today                                      │")
        lines.append(f"│  Total Interactions: {len(queue.interactions):<30}│")
        lines.append("│" + " " * 53 + "│")

        # Interaction counts by type
        comments = len([i for i in queue.interactions if i.interaction_type == InteractionType.COMMENT])
        dms = len([i for i in queue.interactions if i.interaction_type == InteractionType.DIRECT_MESSAGE])
        mentions = len([i for i in queue.interactions if i.interaction_type == InteractionType.MENTION])
        resolved = len([i for i in queue.interactions if i.status == QueueStatus.RESOLVED])

        lines.append(f"│  Comments: {comments:<41}│")
        lines.append(f"│  DMs: {dms:<46}│")
        lines.append(f"│  Mentions: {mentions:<41}│")
        lines.append(f"│  Responses Sent: {resolved:<34}│")
        lines.append("│" + " " * 53 + "│")

        avg_time = int(queue.avg_response_time_minutes)
        lines.append(f"│  Avg Response Time: {avg_time} min                      │")
        sla_bar = self._progress_bar(queue.sla_compliance_rate)
        lines.append(f"│  SLA Compliance: {sla_bar} {queue.sla_compliance_rate:.0f}%     │")
        lines.append("│  Status: [●] Monitoring Active                      │")
        lines.append("└" + "─" * 53 + "┘")
        lines.append("")

        # Queue Status
        lines.append("QUEUE STATUS")
        lines.append("─" * 55)
        lines.append("┌" + "─" * 53 + "┐")
        lines.append("│  PENDING RESPONSES                                  │")
        lines.append("│" + " " * 53 + "│")

        by_priority = queue.by_priority
        lines.append(f"│  P1 Critical:  {by_priority.get('p1_critical', 0):<36}│")
        lines.append(f"│  P2 Urgent:    {by_priority.get('p2_urgent', 0):<36}│")
        lines.append(f"│  P3 Standard:  {by_priority.get('p3_standard', 0):<36}│")
        lines.append(f"│  P4 Low:       {by_priority.get('p4_low', 0):<36}│")
        lines.append("│" + " " * 53 + "│")

        oldest = queue.oldest_pending_minutes
        if oldest > 60:
            oldest_str = f"{oldest // 60}h {oldest % 60}m"
        else:
            oldest_str = f"{oldest}m"
        lines.append(f"│  Oldest Item: {oldest_str:<38}│")
        lines.append("└" + "─" * 53 + "┘")
        lines.append("")

        # Sentiment Analysis
        lines.append("SENTIMENT ANALYSIS")
        lines.append("─" * 55)
        lines.append("┌" + "─" * 53 + "┐")
        lines.append("│  TODAY'S SENTIMENT                                  │")
        lines.append("│" + " " * 53 + "│")

        pos_bar = self._progress_bar(sentiment.positive_rate)
        neu_bar = self._progress_bar(sentiment.neutral_rate)
        neg_bar = self._progress_bar(sentiment.negative_rate)

        lines.append(f"│  Positive:  {pos_bar} {sentiment.positive_rate:.0f}%               │")
        lines.append(f"│  Neutral:   {neu_bar} {sentiment.neutral_rate:.0f}%               │")
        lines.append(f"│  Negative:  {neg_bar} {sentiment.negative_rate:.0f}%               │")
        lines.append("│" + " " * 53 + "│")
        lines.append(f"│  Trend: {sentiment.trend:<43}│")
        lines.append("└" + "─" * 53 + "┘")
        lines.append("")

        # Escalations
        if queue.escalations:
            lines.append("ESCALATIONS")
            lines.append("─" * 55)
            lines.append("| ID | Platform | Issue | Status | Owner |")
            lines.append("|" + "-" * 8 + "|" + "-" * 12 + "|" + "-" * 15 + "|" + "-" * 10 + "|" + "-" * 8 + "|")
            for esc in queue.escalations[:5]:
                lines.append(f"| {esc.escalation_id[:6]} | {esc.brand_name[:10]} | {esc.escalation_type.value[:13]} | {esc.status[:8]} | {', '.join(esc.assigned_to[:2])[:6]} |")
            lines.append("")

        # Implementation Checklist
        lines.append("IMPLEMENTATION CHECKLIST")
        lines.append("─" * 55)
        lines.append("• [●] All channels monitored")
        sla_status = "●" if queue.overdue_count == 0 else "○"
        lines.append(f"• [{sla_status}] Queue cleared to SLA")
        esc_status = "●" if not any(e.status == "open" for e in queue.escalations) else "○"
        lines.append(f"• [{esc_status}] Escalations handled")
        lines.append("• [○] Proactive engagement done")
        lines.append("• [●] Daily report complete")
        lines.append("")

        lines.append("Engagement Status: ● Community Active")

        return "\n".join(lines)

    def generate_queue_report(self, queue: EngagementQueue) -> str:
        """Generate detailed queue report."""
        lines = []
        lines.append("RESPONSE QUEUE")
        lines.append("═" * 55)
        lines.append(f"Brand: {queue.brand_name}")
        lines.append(f"Total Active: {queue.pending_count}")
        lines.append("═" * 55)
        lines.append("")

        active = [i for i in queue.interactions if i.status.is_active]
        sorted_interactions = sorted(active, key=lambda x: -x.urgency_score)

        for interaction in sorted_interactions[:10]:
            lines.append(f"{interaction.priority.icon} [{interaction.interaction_id[:8]}]")
            lines.append(f"  Platform: {interaction.platform.value}")
            lines.append(f"  Type: {interaction.interaction_type.value}")
            lines.append(f"  User: @{interaction.author_username}")
            lines.append(f"  Sentiment: {interaction.sentiment.icon} {interaction.sentiment.value}")
            lines.append(f"  Age: {interaction.age_minutes}m | SLA: {interaction.sla_status}")
            lines.append(f"  Content: \"{interaction.content[:50]}...\"")
            lines.append("")

        return "\n".join(lines)

    def generate_proactive_report(self, engagements: List[ProactiveEngagement]) -> str:
        """Generate proactive engagement report."""
        lines = []
        lines.append("PROACTIVE ENGAGEMENT LOG")
        lines.append("═" * 55)
        lines.append("")

        lines.append("| Platform | Likes | Comments | Follows |")
        lines.append("|" + "-" * 12 + "|" + "-" * 8 + "|" + "-" * 10 + "|" + "-" * 9 + "|")

        for eng in engagements:
            lines.append(f"| {eng.platform.value[:10]:<10} | {eng.likes_given:<6} | {eng.comments_made:<8} | {eng.follows_given:<7} |")

        lines.append("")

        total_likes = sum(e.likes_given for e in engagements)
        total_comments = sum(e.comments_made for e in engagements)
        total_follows = sum(e.follows_given for e in engagements)

        lines.append(f"Total Likes: {total_likes}")
        lines.append(f"Total Comments: {total_comments}")
        lines.append(f"Total Follows: {total_follows}")

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="SOCIAL.ENGAGE.EXE - Community Management Specialist"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Dashboard command
    dashboard = subparsers.add_parser("dashboard", help="Show engagement dashboard")
    dashboard.add_argument("--brand", required=True, help="Brand name")

    # Queue command
    queue_cmd = subparsers.add_parser("queue", help="Show response queue")
    queue_cmd.add_argument("--brand", required=True, help="Brand name")

    # Respond command
    respond = subparsers.add_parser("respond", help="Get response templates")
    respond.add_argument("--type", required=True,
                        choices=["gratitude", "helpful", "recovery", "de_escalation"],
                        help="Response type")

    # Escalate command
    escalate = subparsers.add_parser("escalate", help="Create escalation")
    escalate.add_argument("--brand", required=True, help="Brand name")
    escalate.add_argument("--type", required=True, help="Escalation type")
    escalate.add_argument("--summary", required=True, help="Issue summary")

    # Proactive command
    proactive = subparsers.add_parser("proactive", help="Plan proactive engagement")
    proactive.add_argument("--brand", required=True, help="Brand name")
    proactive.add_argument("--platform", default="instagram", help="Platform")

    # Demo command
    demo = subparsers.add_parser("demo", help="Run demonstration")

    args = parser.parse_args()

    engine = EngagementEngine()
    reporter = EngagementReporter()
    sentiment_analyzer = SentimentAnalyzer()

    if args.command == "dashboard":
        interactions = engine.generate_demo_interactions(args.brand, 15)
        queue = engine.get_queue(args.brand)
        queue.interactions = interactions
        sentiment = sentiment_analyzer.get_sentiment_snapshot(interactions, 10.0)
        print(reporter.generate_dashboard(queue, sentiment))

    elif args.command == "queue":
        interactions = engine.generate_demo_interactions(args.brand, 10)
        queue = engine.get_queue(args.brand)
        queue.interactions = interactions
        print(reporter.generate_queue_report(queue))

    elif args.command == "respond":
        try:
            response_type = ResponseType(args.type)
        except ValueError:
            response_type = ResponseType.HELPFUL

        template = engine.response_generator.get_template(response_type)
        if template:
            print(f"Response Type: {response_type.value.upper()}")
            print("=" * 40)
            print(f"Template: {template.name}")
            print(f"Text: {template.template_text}")
            print(f"Fields: {', '.join(template.personalization_fields)}")

    elif args.command == "escalate":
        try:
            esc_type = EscalationType(args.type)
        except ValueError:
            esc_type = EscalationType.PRODUCT_DEFECT

        escalation = Escalation(
            escalation_id=f"esc_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            interaction_id="manual",
            brand_name=args.brand,
            escalation_type=esc_type,
            summary=args.summary
        )
        print(f"Escalation Created: {escalation.escalation_id}")
        print(f"Type: {esc_type.value}")
        print(f"Severity: {esc_type.severity}")
        print(f"Escalate To: {', '.join(esc_type.escalate_to)}")
        print(f"Timeline: {esc_type.timeline_hours} hours")

    elif args.command == "proactive":
        try:
            platform = Platform(args.platform)
        except ValueError:
            platform = Platform.INSTAGRAM

        engagement = ProactiveEngagement(
            brand_name=args.brand,
            platform=platform,
            likes_given=random.randint(20, 50),
            comments_made=random.randint(5, 15),
            follows_given=random.randint(3, 10),
            shares_done=random.randint(2, 8)
        )
        print(reporter.generate_proactive_report([engagement]))

    elif args.command == "demo":
        print("Running SOCIAL.ENGAGE.EXE Demo...")
        print("=" * 55)

        interactions = engine.generate_demo_interactions("Demo Brand", 12)
        queue = engine.get_queue("Demo Brand")
        queue.interactions = interactions

        # Process for escalations
        for interaction in interactions:
            esc_type = engine.escalation_manager.should_escalate(interaction)
            if esc_type:
                esc = engine.escalation_manager.create_escalation(interaction, esc_type)
                queue.escalations.append(esc)

        sentiment = sentiment_analyzer.get_sentiment_snapshot(interactions, 5.0)
        print(reporter.generate_dashboard(queue, sentiment))

        print("\n" + "=" * 55)
        print("Demo complete!")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/social-engage [brand]` - Daily engagement dashboard
- `/social-engage respond [type]` - Get response templates
- `/social-engage escalate [brand]` - Create escalation alert
- `/social-engage report [brand]` - Generate engagement report
- `/social-engage proactive [brand]` - Plan proactive engagement

$ARGUMENTS
