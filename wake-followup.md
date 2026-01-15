# WAKE-FOLLOWUP.EXE - Intelligent Follow-Up Engine

You are **WAKE-FOLLOWUP.EXE** — the intelligent follow-up engine for maintaining engagement, nurturing relationships, and driving conversions through strategic communication.

---

## CORE MODULES

### ContactTracker.MOD
- Interaction history
- Engagement scoring
- Touch point logging
- Priority ranking
- Reminder scheduling

### SequenceBuilder.MOD
- Multi-step sequences
- Timing optimization
- Channel selection
- Personalization rules
- Trigger configuration

### MessageCrafter.MOD
- Personalized content
- Value-add inclusion
- Tone matching
- Subject line optimization
- CTA integration

### ResponseAnalyzer.MOD
- Reply detection
- Sentiment analysis
- Engagement tracking
- Pattern recognition
- Conversion attribution

---

## PRODUCTION IMPLEMENTATION

```python
"""
WAKE-FOLLOWUP.EXE - Intelligent Follow-Up Engine
Production-ready follow-up automation and engagement tracking.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from datetime import datetime, timedelta
import re


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class FollowUpType(Enum):
    """Types of follow-up communications."""
    CHECK_IN = "check_in"
    VALUE_ADD = "value_add"
    NUDGE = "nudge"
    RE_ENGAGE = "re_engage"
    BREAKUP = "breakup"
    THANK_YOU = "thank_you"
    MEETING_RECAP = "meeting_recap"
    PROPOSAL_FOLLOWUP = "proposal_followup"

    @property
    def typical_timing_days(self) -> int:
        """Days after last touch to send."""
        timings = {
            self.CHECK_IN: 3,
            self.VALUE_ADD: 7,
            self.NUDGE: 14,
            self.RE_ENGAGE: 30,
            self.BREAKUP: 45,
            self.THANK_YOU: 0,
            self.MEETING_RECAP: 0,
            self.PROPOSAL_FOLLOWUP: 2
        }
        return timings[self]

    @property
    def purpose(self) -> str:
        """Purpose of this follow-up type."""
        purposes = {
            self.CHECK_IN: "Maintain contact and relationship",
            self.VALUE_ADD: "Provide useful resource or insight",
            self.NUDGE: "Gentle reminder to re-engage",
            self.RE_ENGAGE: "Revive cold lead or stalled deal",
            self.BREAKUP: "Final attempt before moving on",
            self.THANK_YOU: "Show appreciation after meeting/purchase",
            self.MEETING_RECAP: "Document and confirm next steps",
            self.PROPOSAL_FOLLOWUP: "Address questions about proposal"
        }
        return purposes[self]

    @property
    def typical_response_rate(self) -> float:
        """Average response rate for this type."""
        rates = {
            self.CHECK_IN: 0.15,
            self.VALUE_ADD: 0.25,
            self.NUDGE: 0.08,
            self.RE_ENGAGE: 0.05,
            self.BREAKUP: 0.12,
            self.THANK_YOU: 0.40,
            self.MEETING_RECAP: 0.60,
            self.PROPOSAL_FOLLOWUP: 0.35
        }
        return rates[self]


class Channel(Enum):
    """Communication channels."""
    EMAIL = "email"
    PHONE = "phone"
    SMS = "sms"
    LINKEDIN = "linkedin"
    VIDEO_MESSAGE = "video_message"
    DIRECT_MAIL = "direct_mail"

    @property
    def avg_response_rate(self) -> float:
        """Average response rate by channel."""
        rates = {
            self.EMAIL: 0.08,
            self.PHONE: 0.15,
            self.SMS: 0.35,
            self.LINKEDIN: 0.12,
            self.VIDEO_MESSAGE: 0.30,
            self.DIRECT_MAIL: 0.05
        }
        return rates[self]

    @property
    def best_time(self) -> str:
        """Best time to use this channel."""
        times = {
            self.EMAIL: "Tuesday-Thursday, 10am or 2pm",
            self.PHONE: "Wednesday-Thursday, 11am or 4pm",
            self.SMS: "Avoid early morning and late evening",
            self.LINKEDIN: "Tuesday-Thursday, business hours",
            self.VIDEO_MESSAGE: "Anytime - async consumption",
            self.DIRECT_MAIL: "N/A - physical delivery"
        }
        return times[self]

    @property
    def cost_per_touch(self) -> float:
        """Cost per outreach touch."""
        costs = {
            self.EMAIL: 0.01,
            self.PHONE: 0.50,
            self.SMS: 0.05,
            self.LINKEDIN: 0.00,
            self.VIDEO_MESSAGE: 2.00,
            self.DIRECT_MAIL: 5.00
        }
        return costs[self]


class Priority(Enum):
    """Contact priority levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    DORMANT = "dormant"

    @property
    def max_days_without_contact(self) -> int:
        """Max days before follow-up required."""
        days = {
            self.CRITICAL: 2,
            self.HIGH: 5,
            self.MEDIUM: 14,
            self.LOW: 30,
            self.DORMANT: 90
        }
        return days[self]

    @property
    def icon(self) -> str:
        """Priority icon."""
        icons = {
            self.CRITICAL: "🔴",
            self.HIGH: "🟠",
            self.MEDIUM: "🟡",
            self.LOW: "🟢",
            self.DORMANT: "⚪"
        }
        return icons[self]

    @property
    def follow_up_frequency(self) -> int:
        """Days between follow-ups."""
        freq = {
            self.CRITICAL: 1,
            self.HIGH: 3,
            self.MEDIUM: 7,
            self.LOW: 14,
            self.DORMANT: 30
        }
        return freq[self]


class EngagementLevel(Enum):
    """Contact engagement levels."""
    HOT = "hot"
    WARM = "warm"
    COOL = "cool"
    COLD = "cold"
    UNRESPONSIVE = "unresponsive"

    @property
    def score_range(self) -> tuple[int, int]:
        """Engagement score range."""
        ranges = {
            self.HOT: (80, 100),
            self.WARM: (60, 79),
            self.COOL: (40, 59),
            self.COLD: (20, 39),
            self.UNRESPONSIVE: (0, 19)
        }
        return ranges[self]

    @property
    def recommended_approach(self) -> str:
        """Recommended engagement approach."""
        approaches = {
            self.HOT: "Strike while hot - close or advance quickly",
            self.WARM: "Nurture with value, schedule next step",
            self.COOL: "Re-establish relevance and value",
            self.COLD: "New approach needed, try different angle",
            self.UNRESPONSIVE: "Breakup sequence or channel switch"
        }
        return approaches[self]


class SequenceStatus(Enum):
    """Sequence enrollment status."""
    NOT_ENROLLED = "not_enrolled"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CONVERTED = "converted"
    BOUNCED = "bounced"
    UNSUBSCRIBED = "unsubscribed"

    @property
    def can_send(self) -> bool:
        """Whether messages can be sent."""
        return self in [self.ACTIVE]

    @property
    def action_required(self) -> Optional[str]:
        """Action required for this status."""
        actions = {
            self.NOT_ENROLLED: "Enroll in appropriate sequence",
            self.ACTIVE: None,
            self.PAUSED: "Review and resume or end",
            self.COMPLETED: "Enroll in next stage sequence",
            self.CONVERTED: "Move to customer success",
            self.BOUNCED: "Verify contact info",
            self.UNSUBSCRIBED: "Respect preference, try other channel"
        }
        return actions[self]


class ResponseType(Enum):
    """Types of responses received."""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    MEETING_REQUEST = "meeting_request"
    INFO_REQUEST = "info_request"
    OBJECTION = "objection"
    REFERRAL = "referral"
    OUT_OF_OFFICE = "out_of_office"
    UNSUBSCRIBE = "unsubscribe"

    @property
    def follow_up_action(self) -> str:
        """Recommended action for this response."""
        actions = {
            self.POSITIVE: "Advance to next stage immediately",
            self.NEGATIVE: "Document reason, schedule re-engagement",
            self.NEUTRAL: "Provide more value, try different angle",
            self.MEETING_REQUEST: "Confirm meeting within 24 hours",
            self.INFO_REQUEST: "Respond with info same day",
            self.OBJECTION: "Address objection with proof points",
            self.REFERRAL: "Thank and follow up on referral",
            self.OUT_OF_OFFICE: "Note return date, resume then",
            self.UNSUBSCRIBE: "Remove from sequence, respect preference"
        }
        return actions[self]

    @property
    def engagement_points(self) -> int:
        """Points added to engagement score."""
        points = {
            self.POSITIVE: 30,
            self.NEGATIVE: -10,
            self.NEUTRAL: 5,
            self.MEETING_REQUEST: 50,
            self.INFO_REQUEST: 20,
            self.OBJECTION: 10,
            self.REFERRAL: 40,
            self.OUT_OF_OFFICE: 0,
            self.UNSUBSCRIBE: -50
        }
        return points[self]


class TouchOutcome(Enum):
    """Outcome of a follow-up touch."""
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    REPLIED = "replied"
    BOUNCED = "bounced"
    SPAM = "spam"
    CONNECTED = "connected"
    VOICEMAIL = "voicemail"
    NO_ANSWER = "no_answer"

    @property
    def is_successful(self) -> bool:
        """Whether outcome is successful."""
        return self in [self.DELIVERED, self.OPENED, self.CLICKED, self.REPLIED, self.CONNECTED]

    @property
    def engagement_points(self) -> int:
        """Points for engagement score."""
        points = {
            self.SENT: 0,
            self.DELIVERED: 1,
            self.OPENED: 5,
            self.CLICKED: 10,
            self.REPLIED: 25,
            self.BOUNCED: -5,
            self.SPAM: -20,
            self.CONNECTED: 20,
            self.VOICEMAIL: 3,
            self.NO_ANSWER: 0
        }
        return points[self]


class SequenceType(Enum):
    """Types of follow-up sequences."""
    INITIAL_OUTREACH = "initial_outreach"
    POST_MEETING = "post_meeting"
    POST_DEMO = "post_demo"
    POST_PROPOSAL = "post_proposal"
    NURTURE = "nurture"
    RE_ENGAGEMENT = "re_engagement"
    ONBOARDING = "onboarding"
    RENEWAL = "renewal"

    @property
    def typical_steps(self) -> int:
        """Typical number of steps in sequence."""
        steps = {
            self.INITIAL_OUTREACH: 5,
            self.POST_MEETING: 3,
            self.POST_DEMO: 4,
            self.POST_PROPOSAL: 5,
            self.NURTURE: 8,
            self.RE_ENGAGEMENT: 4,
            self.ONBOARDING: 6,
            self.RENEWAL: 5
        }
        return steps[self]

    @property
    def duration_days(self) -> int:
        """Typical sequence duration in days."""
        durations = {
            self.INITIAL_OUTREACH: 14,
            self.POST_MEETING: 7,
            self.POST_DEMO: 10,
            self.POST_PROPOSAL: 14,
            self.NURTURE: 60,
            self.RE_ENGAGEMENT: 21,
            self.ONBOARDING: 30,
            self.RENEWAL: 30
        }
        return durations[self]


# ============================================================
# DATA CLASSES
# ============================================================

@dataclass
class Contact:
    """Contact record for follow-up tracking."""
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    company: str = ""
    title: str = ""
    priority: Priority = Priority.MEDIUM
    engagement_score: int = 50
    engagement_level: EngagementLevel = EngagementLevel.WARM
    preferred_channel: Channel = Channel.EMAIL
    timezone: str = "America/New_York"
    last_contact: Optional[datetime] = None
    next_follow_up: Optional[datetime] = None
    notes: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)

    def days_since_contact(self) -> int:
        """Calculate days since last contact."""
        if not self.last_contact:
            return 999
        return (datetime.now() - self.last_contact).days

    def is_overdue(self) -> bool:
        """Check if follow-up is overdue."""
        days = self.days_since_contact()
        return days > self.priority.max_days_without_contact

    def update_engagement(self, points: int) -> None:
        """Update engagement score and level."""
        self.engagement_score = max(0, min(100, self.engagement_score + points))
        # Update level based on score
        for level in EngagementLevel:
            low, high = level.score_range
            if low <= self.engagement_score <= high:
                self.engagement_level = level
                break

    def urgency_score(self) -> int:
        """Calculate follow-up urgency (0-100)."""
        days = self.days_since_contact()
        max_days = self.priority.max_days_without_contact

        if days >= max_days * 2:
            return 100
        elif days >= max_days:
            return 80
        elif days >= max_days * 0.7:
            return 60
        elif days >= max_days * 0.5:
            return 40
        return 20


@dataclass
class TouchPoint:
    """Record of a follow-up touch."""
    id: str
    contact_id: str
    channel: Channel
    type: FollowUpType
    subject: str = ""
    content: str = ""
    sent_at: Optional[datetime] = None
    outcome: TouchOutcome = TouchOutcome.SENT
    response_type: Optional[ResponseType] = None
    response_content: str = ""
    response_at: Optional[datetime] = None

    def response_time_hours(self) -> Optional[float]:
        """Calculate response time in hours."""
        if self.sent_at and self.response_at:
            delta = self.response_at - self.sent_at
            return delta.total_seconds() / 3600
        return None

    def was_successful(self) -> bool:
        """Check if touch was successful."""
        return self.outcome.is_successful


@dataclass
class SequenceStep:
    """Step in a follow-up sequence."""
    step_number: int
    channel: Channel
    type: FollowUpType
    delay_days: int
    subject_template: str
    content_template: str
    send_time: str = "10:00"  # Time to send

    def personalize(self, contact: Contact, variables: dict) -> dict:
        """Personalize step content for contact."""
        subject = self.subject_template
        content = self.content_template

        # Replace contact variables
        subject = subject.replace("{{name}}", contact.name.split()[0])
        subject = subject.replace("{{company}}", contact.company)
        content = content.replace("{{name}}", contact.name.split()[0])
        content = content.replace("{{company}}", contact.company)
        content = content.replace("{{title}}", contact.title)

        # Replace custom variables
        for key, value in variables.items():
            subject = subject.replace(f"{{{{{key}}}}}", str(value))
            content = content.replace(f"{{{{{key}}}}}", str(value))

        return {"subject": subject, "content": content}


@dataclass
class Sequence:
    """Follow-up sequence definition."""
    id: str
    name: str
    type: SequenceType
    steps: list[SequenceStep] = field(default_factory=list)
    active: bool = True
    created_at: datetime = field(default_factory=datetime.now)

    def total_duration_days(self) -> int:
        """Calculate total sequence duration."""
        return sum(step.delay_days for step in self.steps)

    def get_step(self, step_number: int) -> Optional[SequenceStep]:
        """Get step by number."""
        for step in self.steps:
            if step.step_number == step_number:
                return step
        return None


@dataclass
class SequenceEnrollment:
    """Contact enrollment in a sequence."""
    contact_id: str
    sequence_id: str
    current_step: int = 1
    status: SequenceStatus = SequenceStatus.ACTIVE
    enrolled_at: datetime = field(default_factory=datetime.now)
    last_step_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    custom_variables: dict = field(default_factory=dict)

    def next_step_date(self, sequence: Sequence) -> Optional[datetime]:
        """Calculate when next step should be sent."""
        step = sequence.get_step(self.current_step)
        if not step:
            return None

        base = self.last_step_at or self.enrolled_at
        return base + timedelta(days=step.delay_days)

    def is_ready_to_send(self, sequence: Sequence) -> bool:
        """Check if next step is ready to send."""
        if self.status != SequenceStatus.ACTIVE:
            return False
        next_date = self.next_step_date(sequence)
        return next_date and datetime.now() >= next_date

    def advance(self, sequence: Sequence) -> bool:
        """Advance to next step."""
        if self.current_step >= len(sequence.steps):
            self.status = SequenceStatus.COMPLETED
            self.completed_at = datetime.now()
            return False
        self.current_step += 1
        self.last_step_at = datetime.now()
        return True


@dataclass
class FollowUpQueue:
    """Queue of pending follow-ups."""
    items: list[dict] = field(default_factory=list)

    def add(self, contact: Contact, reason: str, due: datetime) -> None:
        """Add item to queue."""
        self.items.append({
            "contact_id": contact.id,
            "contact_name": contact.name,
            "company": contact.company,
            "reason": reason,
            "due": due,
            "priority": contact.priority.value,
            "days_overdue": (datetime.now() - due).days if datetime.now() > due else 0
        })

    def sort_by_urgency(self) -> None:
        """Sort queue by urgency."""
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "dormant": 4}
        self.items.sort(key=lambda x: (
            priority_order.get(x["priority"], 99),
            -x["days_overdue"],
            x["due"]
        ))

    def get_due_today(self) -> list[dict]:
        """Get items due today."""
        today = datetime.now().date()
        return [item for item in self.items if item["due"].date() <= today]


@dataclass
class FollowUpMetrics:
    """Follow-up performance metrics."""
    period: str
    total_sent: int = 0
    total_delivered: int = 0
    total_opened: int = 0
    total_clicked: int = 0
    total_replied: int = 0
    total_meetings: int = 0
    avg_response_time_hours: float = 0.0

    def delivery_rate(self) -> float:
        """Calculate delivery rate."""
        return (self.total_delivered / self.total_sent * 100) if self.total_sent > 0 else 0.0

    def open_rate(self) -> float:
        """Calculate open rate."""
        return (self.total_opened / self.total_delivered * 100) if self.total_delivered > 0 else 0.0

    def click_rate(self) -> float:
        """Calculate click rate."""
        return (self.total_clicked / self.total_opened * 100) if self.total_opened > 0 else 0.0

    def reply_rate(self) -> float:
        """Calculate reply rate."""
        return (self.total_replied / self.total_sent * 100) if self.total_sent > 0 else 0.0

    def meeting_rate(self) -> float:
        """Calculate meeting booking rate."""
        return (self.total_meetings / self.total_sent * 100) if self.total_sent > 0 else 0.0


# ============================================================
# ENGINE CLASSES
# ============================================================

class ContactTracker:
    """Track contact engagement and history."""

    def __init__(self):
        self.contacts: dict[str, Contact] = {}
        self.touch_history: dict[str, list[TouchPoint]] = {}

    def add_contact(self, contact: Contact) -> None:
        """Add contact to tracker."""
        self.contacts[contact.id] = contact
        self.touch_history[contact.id] = []

    def log_touch(self, touch: TouchPoint) -> None:
        """Log a touch point."""
        if touch.contact_id in self.touch_history:
            self.touch_history[touch.contact_id].append(touch)
            # Update contact
            contact = self.contacts.get(touch.contact_id)
            if contact:
                contact.last_contact = touch.sent_at or datetime.now()
                contact.update_engagement(touch.outcome.engagement_points)
                if touch.response_type:
                    contact.update_engagement(touch.response_type.engagement_points)

    def get_history(self, contact_id: str) -> list[TouchPoint]:
        """Get touch history for contact."""
        return self.touch_history.get(contact_id, [])

    def get_overdue(self) -> list[Contact]:
        """Get contacts overdue for follow-up."""
        return [c for c in self.contacts.values() if c.is_overdue()]

    def calculate_best_channel(self, contact_id: str) -> Channel:
        """Calculate best channel based on history."""
        history = self.get_history(contact_id)
        if not history:
            return Channel.EMAIL

        # Count successful outcomes by channel
        channel_success = {}
        for touch in history:
            if touch.was_successful():
                channel_success[touch.channel] = channel_success.get(touch.channel, 0) + 1

        if channel_success:
            return max(channel_success, key=channel_success.get)
        return Channel.EMAIL


class SequenceEngine:
    """Manage follow-up sequences."""

    def __init__(self):
        self.sequences: dict[str, Sequence] = {}
        self.enrollments: dict[str, list[SequenceEnrollment]] = {}
        self._load_default_sequences()

    def _load_default_sequences(self) -> None:
        """Load default sequences."""
        # Initial outreach sequence
        initial = Sequence(
            id="initial_outreach",
            name="Initial Outreach",
            type=SequenceType.INITIAL_OUTREACH,
            steps=[
                SequenceStep(1, Channel.EMAIL, FollowUpType.VALUE_ADD, 0,
                            "Quick question about {{company}}'s growth",
                            "Hi {{name}},\n\nI noticed {{company}} is..."),
                SequenceStep(2, Channel.EMAIL, FollowUpType.CHECK_IN, 3,
                            "Following up",
                            "Hi {{name}},\n\nJust wanted to follow up..."),
                SequenceStep(3, Channel.LINKEDIN, FollowUpType.VALUE_ADD, 5,
                            "Connection request",
                            "Hi {{name}}, sharing a resource..."),
                SequenceStep(4, Channel.EMAIL, FollowUpType.NUDGE, 10,
                            "One more thing...",
                            "Hi {{name}},\n\nQuick question..."),
                SequenceStep(5, Channel.EMAIL, FollowUpType.BREAKUP, 14,
                            "Closing the loop",
                            "Hi {{name}},\n\nI haven't heard back...")
            ]
        )
        self.sequences["initial_outreach"] = initial

    def enroll(self, contact_id: str, sequence_id: str, variables: dict = None) -> SequenceEnrollment:
        """Enroll contact in sequence."""
        enrollment = SequenceEnrollment(
            contact_id=contact_id,
            sequence_id=sequence_id,
            custom_variables=variables or {}
        )
        if contact_id not in self.enrollments:
            self.enrollments[contact_id] = []
        self.enrollments[contact_id].append(enrollment)
        return enrollment

    def get_ready_to_send(self) -> list[tuple[SequenceEnrollment, SequenceStep]]:
        """Get all enrollments ready to send."""
        ready = []
        for contact_enrollments in self.enrollments.values():
            for enrollment in contact_enrollments:
                sequence = self.sequences.get(enrollment.sequence_id)
                if sequence and enrollment.is_ready_to_send(sequence):
                    step = sequence.get_step(enrollment.current_step)
                    if step:
                        ready.append((enrollment, step))
        return ready

    def process_response(self, contact_id: str, response_type: ResponseType) -> None:
        """Process response and update enrollment."""
        enrollments = self.enrollments.get(contact_id, [])
        for enrollment in enrollments:
            if enrollment.status == SequenceStatus.ACTIVE:
                if response_type in [ResponseType.POSITIVE, ResponseType.MEETING_REQUEST]:
                    enrollment.status = SequenceStatus.CONVERTED
                elif response_type == ResponseType.UNSUBSCRIBE:
                    enrollment.status = SequenceStatus.UNSUBSCRIBED
                elif response_type == ResponseType.NEGATIVE:
                    enrollment.status = SequenceStatus.PAUSED


class MessageCrafter:
    """Craft personalized messages."""

    def __init__(self):
        self.templates: dict[FollowUpType, list[str]] = {}
        self._load_templates()

    def _load_templates(self) -> None:
        """Load message templates."""
        self.templates = {
            FollowUpType.CHECK_IN: [
                "Hi {{name}},\n\nJust checking in to see how things are going at {{company}}.\n\nHappy to help if anything comes up.",
                "Hi {{name}},\n\nWanted to touch base and see if you had any questions about our conversation.",
            ],
            FollowUpType.VALUE_ADD: [
                "Hi {{name}},\n\nI came across this resource and thought of {{company}}:\n\n{{resource_link}}\n\nLet me know if it's helpful!",
                "Hi {{name}},\n\nGiven your role at {{company}}, I thought you might find this interesting:\n\n{{resource_summary}}",
            ],
            FollowUpType.BREAKUP: [
                "Hi {{name}},\n\nI've reached out a few times but haven't heard back. I don't want to be a bother.\n\nIf now isn't the right time, no problem. Just reply 'not now' and I'll check back in a few months.\n\nOr if there's someone else I should be talking to, I'd appreciate the intro.",
            ]
        }

    def craft_message(self, contact: Contact, follow_up_type: FollowUpType,
                      variables: dict = None) -> dict:
        """Craft personalized message."""
        templates = self.templates.get(follow_up_type, ["Default message"])
        template = templates[0]  # Could rotate or A/B test

        # Personalize
        message = template.replace("{{name}}", contact.name.split()[0])
        message = message.replace("{{company}}", contact.company)
        message = message.replace("{{title}}", contact.title)

        if variables:
            for key, value in variables.items():
                message = message.replace(f"{{{{{key}}}}}", str(value))

        # Generate subject
        subjects = {
            FollowUpType.CHECK_IN: f"Checking in, {contact.name.split()[0]}",
            FollowUpType.VALUE_ADD: f"Thought of {contact.company}",
            FollowUpType.BREAKUP: "Should I close your file?"
        }
        subject = subjects.get(follow_up_type, "Following up")

        return {
            "subject": subject,
            "body": message,
            "channel": contact.preferred_channel.value
        }

    def suggest_value_add(self, contact: Contact) -> str:
        """Suggest value-add content based on contact."""
        # Simple suggestion based on title
        if "marketing" in contact.title.lower():
            return "marketing automation best practices guide"
        elif "sales" in contact.title.lower():
            return "sales productivity benchmark report"
        elif "cto" in contact.title.lower() or "engineer" in contact.title.lower():
            return "technical implementation guide"
        return "industry trends report"


class ResponseAnalyzer:
    """Analyze responses and sentiment."""

    def __init__(self):
        self.positive_signals = ["interested", "tell me more", "sounds good", "let's chat", "schedule", "available"]
        self.negative_signals = ["not interested", "unsubscribe", "remove me", "stop", "no thanks"]
        self.meeting_signals = ["meet", "call", "schedule", "calendar", "available", "chat"]

    def classify_response(self, response_text: str) -> ResponseType:
        """Classify response type."""
        text_lower = response_text.lower()

        # Check for unsubscribe
        if any(signal in text_lower for signal in ["unsubscribe", "remove me", "stop emailing"]):
            return ResponseType.UNSUBSCRIBE

        # Check for out of office
        if "out of office" in text_lower or "ooo" in text_lower:
            return ResponseType.OUT_OF_OFFICE

        # Check for meeting request
        if any(signal in text_lower for signal in self.meeting_signals):
            return ResponseType.MEETING_REQUEST

        # Check for positive
        if any(signal in text_lower for signal in self.positive_signals):
            return ResponseType.POSITIVE

        # Check for negative
        if any(signal in text_lower for signal in self.negative_signals):
            return ResponseType.NEGATIVE

        # Check for info request
        if "?" in response_text:
            return ResponseType.INFO_REQUEST

        return ResponseType.NEUTRAL

    def extract_sentiment_score(self, response_text: str) -> int:
        """Extract sentiment score (0-100)."""
        score = 50  # Neutral baseline

        text_lower = response_text.lower()

        # Positive indicators
        positive_count = sum(1 for signal in self.positive_signals if signal in text_lower)
        score += positive_count * 10

        # Negative indicators
        negative_count = sum(1 for signal in self.negative_signals if signal in text_lower)
        score -= negative_count * 15

        return max(0, min(100, score))


class FollowUpEngine:
    """Main follow-up orchestration engine."""

    def __init__(self):
        self.contact_tracker = ContactTracker()
        self.sequence_engine = SequenceEngine()
        self.message_crafter = MessageCrafter()
        self.response_analyzer = ResponseAnalyzer()

    def add_contact(self, contact: Contact) -> None:
        """Add contact to system."""
        self.contact_tracker.add_contact(contact)

    def get_queue(self) -> FollowUpQueue:
        """Get follow-up queue."""
        queue = FollowUpQueue()

        # Add overdue contacts
        for contact in self.contact_tracker.get_overdue():
            due = contact.last_contact + timedelta(days=contact.priority.max_days_without_contact) \
                if contact.last_contact else datetime.now()
            queue.add(contact, "Overdue for follow-up", due)

        # Add sequence steps ready to send
        for enrollment, step in self.sequence_engine.get_ready_to_send():
            contact = self.contact_tracker.contacts.get(enrollment.contact_id)
            if contact:
                due = enrollment.next_step_date(
                    self.sequence_engine.sequences.get(enrollment.sequence_id)
                )
                queue.add(contact, f"Sequence step {enrollment.current_step}", due)

        queue.sort_by_urgency()
        return queue

    def execute_follow_up(self, contact_id: str, follow_up_type: FollowUpType,
                          variables: dict = None) -> TouchPoint:
        """Execute a follow-up."""
        contact = self.contact_tracker.contacts.get(contact_id)
        if not contact:
            raise ValueError(f"Contact {contact_id} not found")

        # Craft message
        message = self.message_crafter.craft_message(contact, follow_up_type, variables)

        # Create touch point
        touch = TouchPoint(
            id=f"touch_{datetime.now().timestamp()}",
            contact_id=contact_id,
            channel=contact.preferred_channel,
            type=follow_up_type,
            subject=message["subject"],
            content=message["body"],
            sent_at=datetime.now(),
            outcome=TouchOutcome.SENT
        )

        # Log touch
        self.contact_tracker.log_touch(touch)

        return touch

    def process_response(self, touch_id: str, response_text: str) -> dict:
        """Process a response to a follow-up."""
        # Classify response
        response_type = self.response_analyzer.classify_response(response_text)
        sentiment = self.response_analyzer.extract_sentiment_score(response_text)

        return {
            "response_type": response_type.value,
            "sentiment_score": sentiment,
            "recommended_action": response_type.follow_up_action,
            "engagement_change": response_type.engagement_points
        }

    def get_metrics(self, contact_ids: list[str] = None) -> FollowUpMetrics:
        """Get follow-up metrics."""
        metrics = FollowUpMetrics(period="all_time")

        contacts = contact_ids or list(self.contact_tracker.contacts.keys())

        for contact_id in contacts:
            history = self.contact_tracker.get_history(contact_id)
            for touch in history:
                metrics.total_sent += 1
                if touch.outcome in [TouchOutcome.DELIVERED, TouchOutcome.OPENED,
                                     TouchOutcome.CLICKED, TouchOutcome.REPLIED]:
                    metrics.total_delivered += 1
                if touch.outcome in [TouchOutcome.OPENED, TouchOutcome.CLICKED, TouchOutcome.REPLIED]:
                    metrics.total_opened += 1
                if touch.outcome in [TouchOutcome.CLICKED, TouchOutcome.REPLIED]:
                    metrics.total_clicked += 1
                if touch.outcome == TouchOutcome.REPLIED:
                    metrics.total_replied += 1
                if touch.response_type == ResponseType.MEETING_REQUEST:
                    metrics.total_meetings += 1

        return metrics


# ============================================================
# REPORTER CLASS
# ============================================================

class FollowUpReporter:
    """Generate follow-up reports."""

    def __init__(self, engine: FollowUpEngine):
        self.engine = engine

    def generate_queue_report(self) -> str:
        """Generate follow-up queue report."""
        queue = self.engine.get_queue()

        output = []
        output.append("=" * 60)
        output.append("FOLLOW-UP QUEUE")
        output.append("=" * 60)
        output.append("")

        # Summary
        output.append("QUEUE SUMMARY")
        output.append("-" * 40)
        output.append(f"  Total Pending: {len(queue.items)}")
        due_today = queue.get_due_today()
        output.append(f"  Due Today:     {len(due_today)}")
        overdue = [i for i in queue.items if i["days_overdue"] > 0]
        output.append(f"  Overdue:       {len(overdue)}")
        output.append("")

        # Priority breakdown
        output.append("PRIORITY FOLLOW-UPS")
        output.append("-" * 40)
        for item in queue.items[:10]:
            priority_icon = Priority[item["priority"].upper()].icon
            status = "OVERDUE" if item["days_overdue"] > 0 else "Due"
            output.append(
                f"  {priority_icon} {item['contact_name'][:20]:<20} "
                f"{item['company'][:15]:<15} {status}"
            )
            output.append(f"      Reason: {item['reason']}")

        output.append("")
        output.append("=" * 60)
        return "\n".join(output)

    def generate_metrics_report(self) -> str:
        """Generate metrics report."""
        metrics = self.engine.get_metrics()

        output = []
        output.append("=" * 60)
        output.append("FOLLOW-UP METRICS")
        output.append("=" * 60)
        output.append("")

        output.append("ACTIVITY METRICS")
        output.append("-" * 40)
        output.append(f"  Total Sent:      {metrics.total_sent}")
        output.append(f"  Delivered:       {metrics.total_delivered}")
        output.append(f"  Opened:          {metrics.total_opened}")
        output.append(f"  Clicked:         {metrics.total_clicked}")
        output.append(f"  Replied:         {metrics.total_replied}")
        output.append(f"  Meetings:        {metrics.total_meetings}")
        output.append("")

        output.append("CONVERSION RATES")
        output.append("-" * 40)

        # Visual bars
        rates = [
            ("Delivery", metrics.delivery_rate()),
            ("Open", metrics.open_rate()),
            ("Click", metrics.click_rate()),
            ("Reply", metrics.reply_rate()),
            ("Meeting", metrics.meeting_rate())
        ]

        for name, rate in rates:
            bar_len = int(rate / 5)  # Scale to 20 chars max
            bar = "█" * bar_len + "░" * (20 - bar_len)
            output.append(f"  {name:<10} {bar} {rate:.1f}%")

        output.append("")
        output.append("=" * 60)
        return "\n".join(output)

    def generate_contact_report(self, contact_id: str) -> str:
        """Generate contact follow-up report."""
        contact = self.engine.contact_tracker.contacts.get(contact_id)
        if not contact:
            return f"Contact {contact_id} not found"

        history = self.engine.contact_tracker.get_history(contact_id)

        output = []
        output.append("=" * 60)
        output.append(f"CONTACT: {contact.name}")
        output.append("=" * 60)
        output.append("")

        # Contact info
        output.append("CONTACT DETAILS")
        output.append("-" * 40)
        output.append(f"  Company:      {contact.company}")
        output.append(f"  Title:        {contact.title}")
        output.append(f"  Email:        {contact.email}")
        output.append(f"  Priority:     {contact.priority.icon} {contact.priority.value}")
        output.append(f"  Engagement:   {contact.engagement_score}/100 ({contact.engagement_level.value})")
        output.append("")

        # Engagement bar
        eng_bar = "█" * (contact.engagement_score // 5) + "░" * (20 - contact.engagement_score // 5)
        output.append(f"  [{eng_bar}] {contact.engagement_score}%")
        output.append("")

        # Follow-up status
        days = contact.days_since_contact()
        status = "OVERDUE" if contact.is_overdue() else "OK"
        output.append("FOLLOW-UP STATUS")
        output.append("-" * 40)
        output.append(f"  Last Contact:  {days} days ago")
        output.append(f"  Status:        {status}")
        output.append(f"  Recommended:   {contact.engagement_level.recommended_approach}")
        output.append("")

        # Touch history
        if history:
            output.append("RECENT TOUCHES")
            output.append("-" * 40)
            for touch in history[-5:]:
                outcome_icon = "✓" if touch.was_successful() else "○"
                output.append(f"  {outcome_icon} {touch.type.value} via {touch.channel.value}")
                if touch.sent_at:
                    output.append(f"      {touch.sent_at.strftime('%Y-%m-%d')}")

        output.append("")
        output.append("=" * 60)
        return "\n".join(output)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="WAKE-FOLLOWUP.EXE - Intelligent Follow-Up Engine")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Queue command
    queue_parser = subparsers.add_parser("queue", help="View follow-up queue")

    # Send command
    send_parser = subparsers.add_parser("send", help="Send follow-up")
    send_parser.add_argument("contact_id", help="Contact ID")
    send_parser.add_argument("--type", default="check_in", help="Follow-up type")

    # Sequence command
    seq_parser = subparsers.add_parser("sequence", help="Manage sequences")
    seq_parser.add_argument("action", choices=["list", "create", "enroll"])

    # Metrics command
    metrics_parser = subparsers.add_parser("metrics", help="View metrics")

    # Contact command
    contact_parser = subparsers.add_parser("contact", help="View contact")
    contact_parser.add_argument("contact_id", help="Contact ID")

    args = parser.parse_args()

    # Initialize engine
    engine = FollowUpEngine()
    reporter = FollowUpReporter(engine)

    if args.command == "queue":
        print(reporter.generate_queue_report())
    elif args.command == "send":
        follow_up_type = FollowUpType[args.type.upper()]
        print(f"Sending {follow_up_type.value} to {args.contact_id}")
    elif args.command == "sequence":
        print(f"Sequence action: {args.action}")
    elif args.command == "metrics":
        print(reporter.generate_metrics_report())
    elif args.command == "contact":
        print(reporter.generate_contact_report(args.contact_id))
    else:
        print(reporter.generate_queue_report())


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

```
/wake-followup queue           - View pending follow-ups
/wake-followup send [contact]  - Execute follow-up
/wake-followup sequence        - Manage sequences
/wake-followup metrics         - Performance metrics
/wake-followup contact [id]    - View contact details
```

$ARGUMENTS
