# FEEDBACK.LOOPS.EXE - Human-in-the-Loop System Designer

You are FEEDBACK.LOOPS.EXE — a system that integrates human oversight.

MISSION
Capture feedback and route it into measurable improvements. Humans retain final authority.

---

## CAPABILITIES

### IntakeDesigner.MOD
- Feedback channels
- Signal collection
- Source attribution
- Context capture
- Volume management

### TriageEngine.MOD
- Priority scoring
- Category routing
- Urgency detection
- Duplicate handling
- Escalation triggers

### ReviewOrchestrator.MOD
- Review workflows
- Approval processes
- Decision tracking
- Audit trails
- SLA management

### ImprovementTracker.MOD
- Action tracking
- Impact measurement
- Trend analysis
- Loop closure
- Learning capture

---

## SYSTEM IMPLEMENTATION

```python
"""
FEEDBACK.LOOPS.EXE - Human-in-the-Loop Engine
Production-ready feedback collection and human oversight system
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Callable
import hashlib
import json


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class FeedbackType(Enum):
    """Types of feedback."""
    BUG_REPORT = "bug_report"
    FEATURE_REQUEST = "feature_request"
    MODEL_FEEDBACK = "model_feedback"
    QUALITY_ISSUE = "quality_issue"
    COMPLIANCE_FLAG = "compliance_flag"
    USER_COMPLAINT = "user_complaint"
    SUGGESTION = "suggestion"
    PRAISE = "praise"
    SECURITY_CONCERN = "security_concern"
    DATA_ISSUE = "data_issue"

    @property
    def response_time_hours(self) -> int:
        """Target response time in hours."""
        times = {
            "bug_report": 24,
            "feature_request": 168,
            "model_feedback": 4,
            "quality_issue": 4,
            "compliance_flag": 1,
            "user_complaint": 24,
            "suggestion": 168,
            "praise": 48,
            "security_concern": 1,
            "data_issue": 4
        }
        return times.get(self.value, 24)

    @property
    def requires_human_review(self) -> bool:
        """Whether human review is required."""
        human_required = {
            "compliance_flag", "security_concern", "quality_issue",
            "model_feedback", "user_complaint"
        }
        return self.value in human_required

    @property
    def default_priority(self) -> str:
        """Default priority level."""
        priorities = {
            "compliance_flag": "CRITICAL",
            "security_concern": "CRITICAL",
            "quality_issue": "HIGH",
            "bug_report": "MEDIUM",
            "model_feedback": "HIGH",
            "user_complaint": "MEDIUM",
            "feature_request": "LOW",
            "suggestion": "LOW",
            "praise": "LOW",
            "data_issue": "HIGH"
        }
        return priorities.get(self.value, "MEDIUM")


class FeedbackPriority(Enum):
    """Priority levels for feedback."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"

    @property
    def sla_hours(self) -> int:
        """SLA in hours."""
        slas = {
            "critical": 1,
            "high": 4,
            "medium": 24,
            "low": 168,
            "informational": 336
        }
        return slas.get(self.value, 24)

    @property
    def escalation_threshold_hours(self) -> int:
        """Hours before escalation."""
        thresholds = {
            "critical": 1,
            "high": 4,
            "medium": 48,
            "low": 168,
            "informational": 336
        }
        return thresholds.get(self.value, 48)

    @property
    def notification_channel(self) -> str:
        """Primary notification channel."""
        channels = {
            "critical": "pagerduty",
            "high": "slack_urgent",
            "medium": "slack",
            "low": "email",
            "informational": "digest"
        }
        return channels.get(self.value, "slack")


class FeedbackStatus(Enum):
    """Status of feedback items."""
    NEW = "new"
    TRIAGED = "triaged"
    IN_REVIEW = "in_review"
    PENDING_ACTION = "pending_action"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    DUPLICATE = "duplicate"
    DEFERRED = "deferred"
    WONT_FIX = "wont_fix"

    @property
    def is_open(self) -> bool:
        """Whether status is open."""
        open_statuses = {
            "new", "triaged", "in_review", "pending_action", "in_progress"
        }
        return self.value in open_statuses

    @property
    def is_terminal(self) -> bool:
        """Whether status is terminal."""
        terminal = {"resolved", "closed", "duplicate", "deferred", "wont_fix"}
        return self.value in terminal

    @property
    def icon(self) -> str:
        """Status icon."""
        icons = {
            "new": "🆕",
            "triaged": "📋",
            "in_review": "🔍",
            "pending_action": "⏳",
            "in_progress": "🔄",
            "resolved": "✅",
            "closed": "☑️",
            "duplicate": "🔗",
            "deferred": "⏸️",
            "wont_fix": "❌"
        }
        return icons.get(self.value, "❓")


class FeedbackSource(Enum):
    """Sources of feedback."""
    USER_INTERFACE = "user_interface"
    API = "api"
    EMAIL = "email"
    SUPPORT_TICKET = "support_ticket"
    INTERNAL = "internal"
    AUTOMATED = "automated"
    SURVEY = "survey"
    SOCIAL_MEDIA = "social_media"
    APP_STORE = "app_store"
    DIRECT = "direct"

    @property
    def reliability_score(self) -> float:
        """Reliability score (0-1)."""
        scores = {
            "user_interface": 0.9,
            "api": 0.95,
            "email": 0.7,
            "support_ticket": 0.85,
            "internal": 0.95,
            "automated": 1.0,
            "survey": 0.8,
            "social_media": 0.5,
            "app_store": 0.6,
            "direct": 0.9
        }
        return scores.get(self.value, 0.7)

    @property
    def requires_verification(self) -> bool:
        """Whether source requires verification."""
        verify = {"social_media", "email", "app_store"}
        return self.value in verify


class ReviewDecision(Enum):
    """Decisions from human review."""
    APPROVE = "approve"
    REJECT = "reject"
    ESCALATE = "escalate"
    REQUEST_MORE_INFO = "request_more_info"
    DEFER = "defer"
    MODIFY = "modify"

    @property
    def requires_rationale(self) -> bool:
        """Whether decision requires rationale."""
        return self.value in ["reject", "defer", "modify"]

    @property
    def closes_loop(self) -> bool:
        """Whether decision closes the feedback loop."""
        closing = {"approve", "reject"}
        return self.value in closing


class CheckpointType(Enum):
    """Types of HITL checkpoints."""
    CONFIDENCE_THRESHOLD = "confidence_threshold"
    HIGH_IMPACT = "high_impact"
    SENSITIVE_CONTENT = "sensitive_content"
    VOLUME_THRESHOLD = "volume_threshold"
    POLICY_REQUIRED = "policy_required"
    RANDOM_SAMPLE = "random_sample"
    NEW_PATTERN = "new_pattern"
    ESCALATION = "escalation"

    @property
    def auto_trigger(self) -> bool:
        """Whether checkpoint auto-triggers."""
        auto = {
            "confidence_threshold", "volume_threshold",
            "policy_required", "random_sample"
        }
        return self.value in auto

    @property
    def sampling_rate(self) -> float:
        """Sampling rate if applicable."""
        rates = {
            "random_sample": 0.05,
            "new_pattern": 0.2
        }
        return rates.get(self.value, 1.0)


class ActionType(Enum):
    """Types of improvement actions."""
    BUG_FIX = "bug_fix"
    FEATURE_DEVELOPMENT = "feature_development"
    MODEL_RETRAIN = "model_retrain"
    POLICY_UPDATE = "policy_update"
    DOCUMENTATION = "documentation"
    PROCESS_CHANGE = "process_change"
    TRAINING = "training"
    INVESTIGATION = "investigation"
    NO_ACTION = "no_action"

    @property
    def typical_duration_days(self) -> int:
        """Typical duration in days."""
        durations = {
            "bug_fix": 3,
            "feature_development": 14,
            "model_retrain": 7,
            "policy_update": 5,
            "documentation": 2,
            "process_change": 7,
            "training": 14,
            "investigation": 3,
            "no_action": 0
        }
        return durations.get(self.value, 7)

    @property
    def requires_approval(self) -> bool:
        """Whether action requires approval."""
        approval_needed = {
            "model_retrain", "policy_update", "process_change"
        }
        return self.value in approval_needed


class ChannelType(Enum):
    """Types of feedback channels."""
    FORM = "form"
    API_ENDPOINT = "api_endpoint"
    EMAIL_INBOX = "email_inbox"
    CHAT = "chat"
    WEBHOOK = "webhook"
    SDK_CALLBACK = "sdk_callback"
    IN_APP = "in_app"
    VOICE = "voice"

    @property
    def is_async(self) -> bool:
        """Whether channel is asynchronous."""
        async_channels = {"email_inbox", "webhook", "sdk_callback"}
        return self.value in async_channels

    @property
    def typical_volume_per_day(self) -> int:
        """Typical volume per day."""
        volumes = {
            "form": 100,
            "api_endpoint": 1000,
            "email_inbox": 50,
            "chat": 200,
            "webhook": 500,
            "sdk_callback": 2000,
            "in_app": 300,
            "voice": 20
        }
        return volumes.get(self.value, 100)


class TrendDirection(Enum):
    """Trend directions for metrics."""
    IMPROVING = "improving"
    STABLE = "stable"
    DECLINING = "declining"
    VOLATILE = "volatile"
    INSUFFICIENT_DATA = "insufficient_data"

    @property
    def requires_attention(self) -> bool:
        """Whether trend requires attention."""
        attention = {"declining", "volatile"}
        return self.value in attention

    @property
    def icon(self) -> str:
        """Trend icon."""
        icons = {
            "improving": "📈",
            "stable": "➡️",
            "declining": "📉",
            "volatile": "📊",
            "insufficient_data": "❓"
        }
        return icons.get(self.value, "❓")


# ============================================================
# DATA CLASSES WITH BUSINESS LOGIC
# ============================================================

@dataclass
class FeedbackItem:
    """A feedback item from any source."""
    feedback_id: str
    feedback_type: FeedbackType
    source: FeedbackSource
    content: str
    submitter_id: str
    created_at: datetime = field(default_factory=datetime.now)
    priority: FeedbackPriority = FeedbackPriority.MEDIUM
    status: FeedbackStatus = FeedbackStatus.NEW
    category: str = ""
    context: dict = field(default_factory=dict)
    assigned_to: str = ""

    def get_sla_deadline(self) -> datetime:
        """Get SLA deadline."""
        hours = self.priority.sla_hours
        return self.created_at + timedelta(hours=hours)

    def is_sla_breached(self) -> bool:
        """Check if SLA is breached."""
        if self.status.is_terminal:
            return False
        return datetime.now() > self.get_sla_deadline()

    def requires_human_review(self) -> bool:
        """Check if human review is required."""
        return self.feedback_type.requires_human_review

    def get_age_hours(self) -> float:
        """Get age in hours."""
        delta = datetime.now() - self.created_at
        return delta.total_seconds() / 3600


@dataclass
class FeedbackChannel:
    """A feedback intake channel."""
    channel_id: str
    name: str
    channel_type: ChannelType
    endpoint: str
    active: bool = True
    filters: list = field(default_factory=list)
    routing_rules: list = field(default_factory=list)
    volume_limit_per_hour: int = 1000
    current_hour_count: int = 0

    def is_rate_limited(self) -> bool:
        """Check if channel is rate limited."""
        return self.current_hour_count >= self.volume_limit_per_hour

    def accept_feedback(self) -> bool:
        """Check if channel can accept feedback."""
        return self.active and not self.is_rate_limited()

    def increment_count(self):
        """Increment hourly count."""
        self.current_hour_count += 1


@dataclass
class HITLCheckpoint:
    """A human-in-the-loop checkpoint."""
    checkpoint_id: str
    name: str
    checkpoint_type: CheckpointType
    trigger_condition: str
    reviewer_roles: list
    sla_hours: int = 4
    active: bool = True
    threshold_value: float = 0.0

    def should_trigger(self, context: dict) -> bool:
        """Check if checkpoint should trigger."""
        if not self.active:
            return False

        if self.checkpoint_type == CheckpointType.CONFIDENCE_THRESHOLD:
            confidence = context.get("confidence", 1.0)
            return confidence < self.threshold_value

        elif self.checkpoint_type == CheckpointType.VOLUME_THRESHOLD:
            volume = context.get("volume", 0)
            return volume > self.threshold_value

        elif self.checkpoint_type == CheckpointType.RANDOM_SAMPLE:
            import random
            return random.random() < self.checkpoint_type.sampling_rate

        return True

    def get_reviewer_count(self) -> int:
        """Get required reviewer count."""
        return len(self.reviewer_roles)


@dataclass
class Review:
    """A human review record."""
    review_id: str
    feedback_id: str
    checkpoint_id: str
    reviewer: str
    decision: ReviewDecision
    rationale: str = ""
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    time_spent_minutes: int = 0

    def complete(self, decision: ReviewDecision, rationale: str = ""):
        """Complete the review."""
        self.decision = decision
        self.rationale = rationale
        self.completed_at = datetime.now()
        self.time_spent_minutes = int(
            (self.completed_at - self.started_at).total_seconds() / 60
        )

    def is_complete(self) -> bool:
        """Check if review is complete."""
        return self.completed_at is not None

    def get_sla_status(self, sla_hours: int) -> str:
        """Get SLA status."""
        deadline = self.started_at + timedelta(hours=sla_hours)
        if self.completed_at:
            return "MET" if self.completed_at <= deadline else "BREACHED"
        return "PENDING" if datetime.now() <= deadline else "AT_RISK"


@dataclass
class ImprovementAction:
    """An improvement action from feedback."""
    action_id: str
    feedback_ids: list
    action_type: ActionType
    title: str
    description: str
    owner: str
    status: str = "PLANNED"
    created_at: datetime = field(default_factory=datetime.now)
    target_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    impact_metrics: dict = field(default_factory=dict)

    def set_target_date(self):
        """Set target date based on action type."""
        days = self.action_type.typical_duration_days
        self.target_date = datetime.now() + timedelta(days=days)

    def is_on_track(self) -> bool:
        """Check if action is on track."""
        if not self.target_date:
            return True
        if self.completed_at:
            return self.completed_at <= self.target_date
        return datetime.now() <= self.target_date

    def complete(self, metrics: dict = None):
        """Complete the action."""
        self.completed_at = datetime.now()
        self.status = "COMPLETED"
        if metrics:
            self.impact_metrics = metrics


@dataclass
class FeedbackLoop:
    """A complete feedback loop cycle."""
    loop_id: str
    feedback_id: str
    opened_at: datetime = field(default_factory=datetime.now)
    closed_at: Optional[datetime] = None
    stages: list = field(default_factory=list)
    outcome: str = ""
    submitter_notified: bool = False

    def add_stage(self, stage: str, details: dict = None):
        """Add a stage to the loop."""
        self.stages.append({
            "stage": stage,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        })

    def close(self, outcome: str):
        """Close the feedback loop."""
        self.closed_at = datetime.now()
        self.outcome = outcome
        self.add_stage("CLOSED", {"outcome": outcome})

    def get_duration_hours(self) -> float:
        """Get loop duration in hours."""
        end = self.closed_at or datetime.now()
        delta = end - self.opened_at
        return delta.total_seconds() / 3600

    def is_closed(self) -> bool:
        """Check if loop is closed."""
        return self.closed_at is not None


@dataclass
class TrendMetric:
    """A trend metric for feedback analysis."""
    metric_id: str
    name: str
    current_value: float
    previous_value: float
    trend: TrendDirection
    period: str = "WEEKLY"
    threshold_warning: float = 0.0
    threshold_critical: float = 0.0

    def get_change_percent(self) -> float:
        """Get percentage change."""
        if self.previous_value == 0:
            return 0.0
        return ((self.current_value - self.previous_value) / self.previous_value) * 100

    def is_above_threshold(self, threshold_type: str = "warning") -> bool:
        """Check if above threshold."""
        threshold = (
            self.threshold_critical
            if threshold_type == "critical"
            else self.threshold_warning
        )
        return self.current_value > threshold


@dataclass
class AuditEntry:
    """An audit trail entry."""
    entry_id: str
    action: str
    entity_type: str
    entity_id: str
    user: str
    timestamp: datetime = field(default_factory=datetime.now)
    details: dict = field(default_factory=dict)

    def get_checksum(self) -> str:
        """Generate entry checksum."""
        content = f"{self.entry_id}:{self.action}:{self.timestamp.isoformat()}"
        return hashlib.sha256(content.encode()).hexdigest()[:12]


# ============================================================
# ENGINE CLASSES
# ============================================================

class IntakeEngine:
    """Manages feedback intake channels."""

    def __init__(self):
        self.channels: dict = {}
        self.feedback_queue: list = []
        self.daily_volume: dict = {}

    def register_channel(self, channel: FeedbackChannel):
        """Register a feedback channel."""
        self.channels[channel.channel_id] = channel

    def receive_feedback(
        self,
        channel_id: str,
        feedback_type: str,
        content: str,
        submitter_id: str,
        context: dict = None
    ) -> Optional[FeedbackItem]:
        """Receive feedback through a channel."""
        channel = self.channels.get(channel_id)
        if not channel or not channel.accept_feedback():
            return None

        channel.increment_count()

        feedback = FeedbackItem(
            feedback_id=f"FB-{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
            feedback_type=FeedbackType(feedback_type),
            source=FeedbackSource(channel.channel_type.value) if channel.channel_type.value in [e.value for e in FeedbackSource] else FeedbackSource.API,
            content=content,
            submitter_id=submitter_id,
            priority=FeedbackPriority(FeedbackType(feedback_type).default_priority.lower()),
            context=context or {}
        )

        self.feedback_queue.append(feedback)
        self._update_volume_tracking(feedback_type)

        return feedback

    def _update_volume_tracking(self, feedback_type: str):
        """Update volume tracking."""
        today = datetime.now().strftime("%Y-%m-%d")
        if today not in self.daily_volume:
            self.daily_volume[today] = {}

        if feedback_type not in self.daily_volume[today]:
            self.daily_volume[today][feedback_type] = 0

        self.daily_volume[today][feedback_type] += 1

    def get_queue_stats(self) -> dict:
        """Get queue statistics."""
        return {
            "total": len(self.feedback_queue),
            "by_priority": {
                priority.value: sum(
                    1 for f in self.feedback_queue
                    if f.priority == priority
                )
                for priority in FeedbackPriority
            },
            "by_status": {
                status.value: sum(
                    1 for f in self.feedback_queue
                    if f.status == status
                )
                for status in FeedbackStatus
            },
            "sla_breached": sum(
                1 for f in self.feedback_queue
                if f.is_sla_breached()
            )
        }


class TriageEngine:
    """Triages and routes feedback."""

    CATEGORY_KEYWORDS = {
        "authentication": ["login", "password", "auth", "session", "token"],
        "performance": ["slow", "latency", "timeout", "performance", "speed"],
        "accuracy": ["wrong", "incorrect", "error", "mistake", "accuracy"],
        "usability": ["confusing", "hard", "difficult", "unclear", "ui"],
        "data": ["data", "lost", "missing", "corrupted", "export"]
    }

    def __init__(self):
        self.routing_rules: list = []
        self.duplicate_hashes: set = set()

    def triage_feedback(self, feedback: FeedbackItem) -> FeedbackItem:
        """Triage a feedback item."""
        # Auto-categorize
        feedback.category = self._categorize(feedback.content)

        # Check for duplicates
        content_hash = hashlib.md5(feedback.content.encode()).hexdigest()
        if content_hash in self.duplicate_hashes:
            feedback.status = FeedbackStatus.DUPLICATE
        else:
            self.duplicate_hashes.add(content_hash)
            feedback.status = FeedbackStatus.TRIAGED

        # Adjust priority based on content
        feedback.priority = self._assess_priority(feedback)

        return feedback

    def _categorize(self, content: str) -> str:
        """Categorize feedback content."""
        content_lower = content.lower()

        for category, keywords in self.CATEGORY_KEYWORDS.items():
            if any(kw in content_lower for kw in keywords):
                return category

        return "general"

    def _assess_priority(self, feedback: FeedbackItem) -> FeedbackPriority:
        """Assess and potentially upgrade priority."""
        content_lower = feedback.content.lower()

        # Check for critical indicators
        critical_words = ["urgent", "critical", "security", "breach", "down", "outage"]
        if any(word in content_lower for word in critical_words):
            return FeedbackPriority.CRITICAL

        # Check for high priority indicators
        high_words = ["broken", "not working", "can't", "blocked", "stuck"]
        if any(word in content_lower for word in high_words):
            return FeedbackPriority.HIGH

        return feedback.priority

    def route_feedback(
        self,
        feedback: FeedbackItem,
        teams: dict
    ) -> str:
        """Route feedback to appropriate team."""
        # Route based on category
        category_routing = {
            "authentication": "security_team",
            "performance": "platform_team",
            "accuracy": "ml_team",
            "usability": "product_team",
            "data": "data_team",
            "general": "support_team"
        }

        return category_routing.get(feedback.category, "support_team")


class ReviewOrchestratorEngine:
    """Orchestrates human reviews."""

    def __init__(self):
        self.checkpoints: dict = {}
        self.reviews: list = []
        self.reviewers: dict = {}

    def register_checkpoint(self, checkpoint: HITLCheckpoint):
        """Register a HITL checkpoint."""
        self.checkpoints[checkpoint.checkpoint_id] = checkpoint

    def check_triggers(
        self,
        feedback: FeedbackItem,
        context: dict
    ) -> list:
        """Check which checkpoints should trigger."""
        triggered = []

        for checkpoint in self.checkpoints.values():
            if checkpoint.should_trigger(context):
                triggered.append(checkpoint)

        # Always trigger for items requiring human review
        if feedback.requires_human_review():
            policy_checkpoint = self.checkpoints.get("POLICY_REQUIRED")
            if policy_checkpoint and policy_checkpoint not in triggered:
                triggered.append(policy_checkpoint)

        return triggered

    def create_review(
        self,
        feedback: FeedbackItem,
        checkpoint: HITLCheckpoint,
        reviewer: str
    ) -> Review:
        """Create a review task."""
        review = Review(
            review_id=f"REV-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            feedback_id=feedback.feedback_id,
            checkpoint_id=checkpoint.checkpoint_id,
            reviewer=reviewer,
            decision=ReviewDecision.APPROVE  # Placeholder
        )

        self.reviews.append(review)
        feedback.status = FeedbackStatus.IN_REVIEW
        feedback.assigned_to = reviewer

        return review

    def complete_review(
        self,
        review_id: str,
        decision: str,
        rationale: str = ""
    ) -> Review:
        """Complete a review."""
        review = next(
            (r for r in self.reviews if r.review_id == review_id),
            None
        )

        if review:
            review.complete(ReviewDecision(decision), rationale)

        return review

    def get_pending_reviews(self, reviewer: str = None) -> list:
        """Get pending reviews."""
        pending = [r for r in self.reviews if not r.is_complete()]

        if reviewer:
            pending = [r for r in pending if r.reviewer == reviewer]

        return pending

    def get_review_metrics(self) -> dict:
        """Get review metrics."""
        completed = [r for r in self.reviews if r.is_complete()]

        if not completed:
            return {
                "total_reviews": 0,
                "avg_time_minutes": 0,
                "decision_distribution": {}
            }

        avg_time = sum(r.time_spent_minutes for r in completed) / len(completed)

        decision_dist = {}
        for review in completed:
            dec = review.decision.value
            decision_dist[dec] = decision_dist.get(dec, 0) + 1

        return {
            "total_reviews": len(completed),
            "avg_time_minutes": round(avg_time, 1),
            "decision_distribution": decision_dist
        }


class ImprovementTrackerEngine:
    """Tracks improvements from feedback."""

    def __init__(self):
        self.actions: dict = {}
        self.feedback_action_map: dict = {}
        self.loops: dict = {}

    def create_action(
        self,
        feedback_ids: list,
        action_type: str,
        title: str,
        description: str,
        owner: str
    ) -> ImprovementAction:
        """Create improvement action."""
        action = ImprovementAction(
            action_id=f"ACT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            feedback_ids=feedback_ids,
            action_type=ActionType(action_type),
            title=title,
            description=description,
            owner=owner
        )

        action.set_target_date()
        self.actions[action.action_id] = action

        # Map feedback to action
        for fid in feedback_ids:
            self.feedback_action_map[fid] = action.action_id

        return action

    def open_loop(self, feedback_id: str) -> FeedbackLoop:
        """Open a feedback loop."""
        loop = FeedbackLoop(
            loop_id=f"LOOP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            feedback_id=feedback_id
        )
        loop.add_stage("OPENED")

        self.loops[loop.loop_id] = loop
        return loop

    def close_loop(
        self,
        loop_id: str,
        outcome: str,
        notify_submitter: bool = True
    ) -> FeedbackLoop:
        """Close a feedback loop."""
        loop = self.loops.get(loop_id)
        if loop:
            loop.close(outcome)
            loop.submitter_notified = notify_submitter
        return loop

    def get_action_metrics(self) -> dict:
        """Get action tracking metrics."""
        actions = list(self.actions.values())

        if not actions:
            return {
                "total_actions": 0,
                "completed": 0,
                "on_track": 0
            }

        completed = sum(1 for a in actions if a.completed_at)
        on_track = sum(1 for a in actions if a.is_on_track())

        return {
            "total_actions": len(actions),
            "completed": completed,
            "on_track": on_track,
            "completion_rate": round(completed / len(actions) * 100, 1)
        }

    def get_loop_metrics(self) -> dict:
        """Get feedback loop metrics."""
        loops = list(self.loops.values())

        if not loops:
            return {
                "total_loops": 0,
                "closed": 0,
                "avg_duration_hours": 0
            }

        closed = [l for l in loops if l.is_closed()]
        avg_duration = (
            sum(l.get_duration_hours() for l in closed) / len(closed)
            if closed else 0
        )

        return {
            "total_loops": len(loops),
            "closed": len(closed),
            "closure_rate": round(len(closed) / len(loops) * 100, 1),
            "avg_duration_hours": round(avg_duration, 1)
        }


class FeedbackLoopsEngine:
    """Main feedback loops orchestration engine."""

    def __init__(self):
        self.intake = IntakeEngine()
        self.triage = TriageEngine()
        self.review_orchestrator = ReviewOrchestratorEngine()
        self.improvement_tracker = ImprovementTrackerEngine()
        self.audit_log: list = []

    def setup_system(
        self,
        channels: list,
        checkpoints: list,
        reviewers: list
    ) -> dict:
        """Set up the feedback system."""
        # Register channels
        for ch_config in channels:
            channel = FeedbackChannel(
                channel_id=ch_config["id"],
                name=ch_config["name"],
                channel_type=ChannelType(ch_config["type"]),
                endpoint=ch_config.get("endpoint", "")
            )
            self.intake.register_channel(channel)

        # Register checkpoints
        for cp_config in checkpoints:
            checkpoint = HITLCheckpoint(
                checkpoint_id=cp_config["id"],
                name=cp_config["name"],
                checkpoint_type=CheckpointType(cp_config["type"]),
                trigger_condition=cp_config.get("condition", ""),
                reviewer_roles=cp_config.get("reviewers", []),
                threshold_value=cp_config.get("threshold", 0.0)
            )
            self.review_orchestrator.register_checkpoint(checkpoint)

        self._log_action("SETUP", "system", "System configured")

        return {
            "channels": len(channels),
            "checkpoints": len(checkpoints),
            "status": "CONFIGURED"
        }

    def process_feedback(
        self,
        channel_id: str,
        feedback_type: str,
        content: str,
        submitter_id: str,
        context: dict = None
    ) -> dict:
        """Process incoming feedback end-to-end."""
        # Receive feedback
        feedback = self.intake.receive_feedback(
            channel_id=channel_id,
            feedback_type=feedback_type,
            content=content,
            submitter_id=submitter_id,
            context=context
        )

        if not feedback:
            return {"error": "Failed to receive feedback"}

        # Open feedback loop
        loop = self.improvement_tracker.open_loop(feedback.feedback_id)
        loop.add_stage("INTAKE")

        # Triage
        feedback = self.triage.triage_feedback(feedback)
        loop.add_stage("TRIAGED", {"category": feedback.category})

        # Check for HITL triggers
        triggered_checkpoints = self.review_orchestrator.check_triggers(
            feedback=feedback,
            context=context or {}
        )

        result = {
            "feedback_id": feedback.feedback_id,
            "loop_id": loop.loop_id,
            "status": feedback.status.value,
            "priority": feedback.priority.value,
            "category": feedback.category,
            "requires_review": len(triggered_checkpoints) > 0,
            "sla_deadline": feedback.get_sla_deadline().isoformat()
        }

        # Create reviews if needed
        if triggered_checkpoints:
            result["reviews"] = []
            for cp in triggered_checkpoints:
                review = self.review_orchestrator.create_review(
                    feedback=feedback,
                    checkpoint=cp,
                    reviewer=cp.reviewer_roles[0] if cp.reviewer_roles else "default_reviewer"
                )
                result["reviews"].append(review.review_id)
            loop.add_stage("REVIEW_QUEUED")

        self._log_action("PROCESS", feedback.feedback_id, f"Processed: {feedback_type}")

        return result

    def submit_review_decision(
        self,
        review_id: str,
        decision: str,
        rationale: str,
        reviewer: str
    ) -> dict:
        """Submit a review decision."""
        review = self.review_orchestrator.complete_review(
            review_id=review_id,
            decision=decision,
            rationale=rationale
        )

        if not review:
            return {"error": "Review not found"}

        self._log_action("REVIEW", review_id, f"Decision: {decision}")

        return {
            "review_id": review_id,
            "decision": decision,
            "time_spent_minutes": review.time_spent_minutes,
            "closes_loop": ReviewDecision(decision).closes_loop
        }

    def create_improvement(
        self,
        feedback_ids: list,
        action_type: str,
        title: str,
        description: str,
        owner: str
    ) -> dict:
        """Create an improvement action."""
        action = self.improvement_tracker.create_action(
            feedback_ids=feedback_ids,
            action_type=action_type,
            title=title,
            description=description,
            owner=owner
        )

        self._log_action("IMPROVEMENT", action.action_id, f"Created: {title}")

        return {
            "action_id": action.action_id,
            "type": action_type,
            "target_date": action.target_date.isoformat() if action.target_date else None,
            "requires_approval": action.action_type.requires_approval
        }

    def close_feedback_loop(
        self,
        loop_id: str,
        outcome: str,
        notify_submitter: bool = True
    ) -> dict:
        """Close a feedback loop."""
        loop = self.improvement_tracker.close_loop(
            loop_id=loop_id,
            outcome=outcome,
            notify_submitter=notify_submitter
        )

        if not loop:
            return {"error": "Loop not found"}

        self._log_action("CLOSE_LOOP", loop_id, f"Outcome: {outcome}")

        return {
            "loop_id": loop_id,
            "outcome": outcome,
            "duration_hours": loop.get_duration_hours(),
            "stages_count": len(loop.stages),
            "submitter_notified": loop.submitter_notified
        }

    def get_dashboard(self) -> dict:
        """Get feedback system dashboard."""
        return {
            "timestamp": datetime.now().isoformat(),
            "queue": self.intake.get_queue_stats(),
            "reviews": self.review_orchestrator.get_review_metrics(),
            "actions": self.improvement_tracker.get_action_metrics(),
            "loops": self.improvement_tracker.get_loop_metrics()
        }

    def _log_action(self, action: str, entity_id: str, details: str):
        """Log action to audit trail."""
        entry = AuditEntry(
            entry_id=f"AUD-{len(self.audit_log) + 1}",
            action=action,
            entity_type="feedback",
            entity_id=entity_id,
            user="system",
            details={"message": details}
        )
        self.audit_log.append(entry)


# ============================================================
# REPORTER CLASS
# ============================================================

class FeedbackReporter:
    """Generates feedback system reports."""

    @staticmethod
    def generate_dashboard_report(data: dict) -> str:
        """Generate dashboard report."""
        lines = [
            "",
            "═" * 60,
            "       FEEDBACK LOOPS DASHBOARD",
            "═" * 60,
            f"  Generated: {data.get('timestamp', 'N/A')}",
            "═" * 60,
            ""
        ]

        # Queue stats
        queue = data.get('queue', {})
        lines.append("  FEEDBACK QUEUE")
        lines.append("  " + "─" * 40)
        lines.append(f"  Total Items: {queue.get('total', 0)}")
        lines.append(f"  SLA Breached: {queue.get('sla_breached', 0)}")
        lines.append("")

        by_priority = queue.get('by_priority', {})
        if by_priority:
            lines.append("  By Priority:")
            for priority, count in by_priority.items():
                if count > 0:
                    bar = FeedbackReporter._bar((count / max(queue.get('total', 1), 1)) * 100, 15)
                    lines.append(f"    {priority.upper():15} {bar} {count}")
        lines.append("")

        # Review metrics
        reviews = data.get('reviews', {})
        lines.append("  HUMAN REVIEWS")
        lines.append("  " + "─" * 40)
        lines.append(f"  Total Reviews: {reviews.get('total_reviews', 0)}")
        lines.append(f"  Avg Time: {reviews.get('avg_time_minutes', 0)} min")
        lines.append("")

        # Action metrics
        actions = data.get('actions', {})
        lines.append("  IMPROVEMENT ACTIONS")
        lines.append("  " + "─" * 40)
        lines.append(f"  Total Actions: {actions.get('total_actions', 0)}")
        lines.append(f"  Completed: {actions.get('completed', 0)}")
        lines.append(f"  Completion Rate: {actions.get('completion_rate', 0)}%")
        lines.append("")

        # Loop metrics
        loops = data.get('loops', {})
        lines.append("  FEEDBACK LOOPS")
        lines.append("  " + "─" * 40)
        lines.append(f"  Total Loops: {loops.get('total_loops', 0)}")
        lines.append(f"  Closed: {loops.get('closed', 0)}")
        lines.append(f"  Avg Duration: {loops.get('avg_duration_hours', 0)} hrs")
        lines.append("")

        lines.append("═" * 60)
        return "\n".join(lines)

    @staticmethod
    def _bar(value: float, width: int = 20) -> str:
        """Generate ASCII progress bar."""
        filled = int((value / 100) * width)
        return "█" * filled + "░" * (width - filled)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="FEEDBACK.LOOPS.EXE - Human-in-the-Loop Engine"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Setup command
    setup_parser = subparsers.add_parser("setup", help="Setup feedback system")

    # Submit command
    submit_parser = subparsers.add_parser("submit", help="Submit feedback")
    submit_parser.add_argument("--type", required=True, help="Feedback type")
    submit_parser.add_argument("--content", required=True, help="Feedback content")
    submit_parser.add_argument("--submitter", required=True, help="Submitter ID")

    # Review command
    review_parser = subparsers.add_parser("review", help="Submit review decision")
    review_parser.add_argument("--review-id", required=True, help="Review ID")
    review_parser.add_argument("--decision", required=True, help="Decision")
    review_parser.add_argument("--rationale", help="Rationale")

    # Dashboard command
    dashboard_parser = subparsers.add_parser("dashboard", help="View dashboard")

    # Close command
    close_parser = subparsers.add_parser("close", help="Close feedback loop")
    close_parser.add_argument("--loop-id", required=True, help="Loop ID")
    close_parser.add_argument("--outcome", required=True, help="Outcome")

    args = parser.parse_args()

    engine = FeedbackLoopsEngine()
    reporter = FeedbackReporter()

    if args.command == "setup":
        result = engine.setup_system(
            channels=[
                {"id": "web", "name": "Web Form", "type": "form"},
                {"id": "api", "name": "API", "type": "api_endpoint"}
            ],
            checkpoints=[
                {
                    "id": "confidence",
                    "name": "Low Confidence",
                    "type": "confidence_threshold",
                    "threshold": 0.7,
                    "reviewers": ["reviewer"]
                },
                {
                    "id": "policy",
                    "name": "Policy Required",
                    "type": "policy_required",
                    "reviewers": ["compliance"]
                }
            ],
            reviewers=["reviewer", "compliance"]
        )
        print(f"\nSetup complete: {result}")

    elif args.command == "submit":
        result = engine.process_feedback(
            channel_id="web",
            feedback_type=args.type,
            content=args.content,
            submitter_id=args.submitter
        )
        print(f"\nFeedback submitted: {result}")

    elif args.command == "review":
        result = engine.submit_review_decision(
            review_id=args.review_id,
            decision=args.decision,
            rationale=args.rationale or "",
            reviewer="reviewer"
        )
        print(f"\nReview submitted: {result}")

    elif args.command == "dashboard":
        dashboard = engine.get_dashboard()
        print(reporter.generate_dashboard_report(dashboard))

    elif args.command == "close":
        result = engine.close_feedback_loop(
            loop_id=args.loop_id,
            outcome=args.outcome
        )
        print(f"\nLoop closed: {result}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW

### Phase 1: CAPTURE
1. Define feedback sources
2. Create intake channels
3. Standardize format
4. Capture context
5. Acknowledge receipt

### Phase 2: TRIAGE
1. Categorize feedback
2. Score priority
3. Route to reviewers
4. Set SLAs
5. Track status

### Phase 3: REVIEW
1. Evaluate feedback
2. Make decisions
3. Document rationale
4. Notify stakeholders
5. Update systems

### Phase 4: IMPROVE
1. Implement changes
2. Measure impact
3. Close the loop
4. Share learnings
5. Optimize process

---

## QUICK COMMANDS

- `/feedback-loops` - Full framework design
- `/feedback-loops [system]` - System-specific
- `/feedback-loops intake` - Intake design
- `/feedback-loops triage` - Triage rules
- `/feedback-loops hitl` - Human checkpoints

$ARGUMENTS
